import { useBuilder, DEFAULT_ZONE_LAYOUTS } from "@/store/useBuilder";
import type { DesignSystem } from "@/store/useBuilder";
import type { BuilderTemplate } from "@/lib/builderTemplates";
import { usePreviewMode } from "@/store/usePreviewMode";
import { titleFromTemplate } from "@/lib/sessionTitle";
import { collectReportControls } from "@/lib/reportCommand";

/* ── Shared template-apply ───────────────────────────────────────
   Writes a template's full payload to the canvas (all four zones +
   body layout + the inferred dims) through the store. ONE source of
   truth shared by:
     - the builder wizard build path (ChatPanel.applyTemplateById +
       applyPendingIntentWithDs Case 1), and
     - the Components-panel Templates accordion.
   The panel previously only STAGED a pending intent and never wrote
   the canvas, so clicking a template card "changed nothing" (owner
   bug). Routing it through this helper makes the panel apply
   immediately, identically to the wizard.

   The caller owns its own chat messaging and preview-open state, since
   those differ per surface.

   The session is started HERE, not by each caller: auto-save only writes
   once a session exists, and the chat's "Use this" path applied a template
   without starting one - the canvas and every edit to it were never saved,
   and a refresh lost them. ensureSessionStarted is a no-op when a session
   is already running, so a caller that named one first keeps its title. ── */
export function applyTemplateToCanvas(tpl: BuilderTemplate, ds: DesignSystem) {
  const s = useBuilder.getState();
  s.ensureSessionStarted(titleFromTemplate(tpl.label));
  /* A template is a single page: drop pages left over from a previous
     multi-page canvas so they cannot resurface on the next page switch. */
  useBuilder.setState({ pages: [], activePageId: null });
  s.setDesignSystem(ds);
  s.setInterfaceType(tpl.interfaceType);
  s.setSelectedComponents(tpl.selectedComponents);
  s.setHeaderBlocks(tpl.header);
  s.setSidebarBlocks(tpl.sidebar);
  s.setBlocks(tpl.body);
  s.setFooterBlocks(tpl.footer);
  /* Apply the template's body layout (e.g. the dashboard's 12-col grid);
     fall back to the default row layout so a prior grid does not leak.
     REPLACED, not merged: a setting the last template had (a plain canvas)
     must not carry over. */
  useBuilder.setState((st) => ({
    zoneLayouts: { ...st.zoneLayouts, body: { ...(tpl.zoneLayouts?.body ?? { mode: "row", gap: 12, wrap: true, align: "stretch" }) } },
  }));
  /* Chrome zones: a template may restyle or hide its header, sidebar and
     footer (a two-bar header, no sidebar, a dark tone). Each is REPLACED -
     the template's layout, else the default - so a previous template's
     chrome (a hidden footer, a dark header) does not leak into this one.
     A sidebar width the user dragged is theirs to keep. */
  const current = useBuilder.getState().zoneLayouts;
  useBuilder.setState({
    zoneLayouts: {
      ...current,
      header: { ...(tpl.zoneLayouts?.header ?? DEFAULT_ZONE_LAYOUTS.header) },
      sidebar: {
        ...(tpl.zoneLayouts?.sidebar ?? DEFAULT_ZONE_LAYOUTS.sidebar),
        ...(current.sidebar.size !== undefined && tpl.zoneLayouts?.sidebar?.size === undefined ? { size: current.sidebar.size } : {}),
      },
      footer: { ...(tpl.zoneLayouts?.footer ?? DEFAULT_ZONE_LAYOUTS.footer) },
    },
  });
  s.setActiveTemplateId(tpl.id);
  s.bumpPreview();
  /* #16 (owner): once a template populates the canvas, show it in PREVIEW first
     (chrome hidden, the rendered UI front-and-centre) instead of dropping the
     user straight into edit. They flip to edit via the preview/edit toggle. */
  usePreviewMode.getState().setMode("preview");
}

/* ── Following a link between reports ────────────────────────────
   A workspace tab or a sidebar item that names a template opens it. That is
   moving around ONE application, so what the reader set stays set: the
   sidebar stays collapsed (or open), and a filter both reports share keeps
   its value (the same entity, the same currency) where the new report
   offers it. ── */
export function openTemplateLink(tpl: BuilderTemplate, ds: DesignSystem) {
  const before = useBuilder.getState();
  const collapsed = before.zoneLayouts.sidebar.collapsed;
  const held = before.reportState;
  applyTemplateToCanvas(tpl, ds);
  const s = useBuilder.getState();
  if (collapsed !== undefined && tpl.sidebar.length > 0) s.setZoneLayout("sidebar", { collapsed });
  for (const control of collectReportControls([...tpl.header, ...tpl.body])) {
    const value = held[control.key];
    if (control.kind === "filter" && value !== undefined && value !== control.current && control.choices.includes(value)) s.setReportState(control.key, value);
  }
}
