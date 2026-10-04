import { useBuilder, DEFAULT_ZONE_LAYOUTS, flushActiveBody } from "@/store/useBuilder";
import type { Block, DesignSystem } from "@/store/useBuilder";
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
  if (tpl.pages?.length) {
    // Seed the current dashboard first; subsequent switches flush live edits
    // through the existing page model. Clone authored pages for each apply.
    for (const page of structuredClone(tpl.pages)) s.addPage(page);
  }
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
  const defaults = persistedReportDefaults(before);
  applyTemplateToCanvas(tpl, ds);
  const s = useBuilder.getState();
  if (collapsed !== undefined && tpl.sidebar.length > 0) s.setZoneLayout("sidebar", { collapsed });
  carryReportDefaults(defaults);
  /* What the reader chose just now outranks a saved default. */
  const carried = { ...defaults, ...held };
  const after = useBuilder.getState();
  for (const control of collectReportControls([...after.headerBlocks, ...after.blocks])) {
    const value = carried[control.key];
    if (control.kind === "filter" && value !== undefined && value !== control.current && control.choices.includes(value)) s.setReportState(control.key, value);
  }
}

/* ── Saved report defaults ───────────────────────────────────────
   Report state is transient on purpose: a reload clears it, so chart picks
   and live values never outlive the visit. A few controls are SETTINGS (the
   Configuration page's base currency, benchmark, periodicity and fee type):
   they carry `persistValue`, so a change is also written into the control's
   own `value`, which the page model and autosave already keep. A report
   opened by a link starts from those saved values. No new saved fields. */

const isPersisted = (props: Record<string, unknown> | undefined): boolean => props?.persistValue === true;

/** Saved defaults by report-state key: the value of every control marked
 *  `persistValue`, across every page (the active one flushed) and the header. */
export function persistedReportDefaults(
  s: Pick<ReturnType<typeof useBuilder.getState>, "pages" | "activePageId" | "blocks" | "sidebarBlocks" | "zoneLayouts" | "headerBlocks">,
): Record<string, string> {
  const out: Record<string, string> = {};
  const read = (key: unknown, value: unknown) => {
    if (typeof key === "string" && key && typeof value === "string" && value) out[key] = value;
  };
  const blocks = [...s.headerBlocks, ...flushActiveBody(s).pages.flatMap((p) => p.body)];
  for (const b of blocks) {
    const props = (b.props ?? {}) as Record<string, unknown>;
    if (isPersisted(props)) read(props.stateKey, props.value);
    if (Array.isArray(props.filters)) {
      for (const f of props.filters as Record<string, unknown>[]) if (f && isPersisted(f)) read(f.stateKey, f.value);
    }
  }
  return out;
}

const optionsOf = (props: Record<string, unknown>): string[] =>
  Array.isArray(props.options) ? props.options.map(String) : String(props.optionsCsv ?? "").split(",").map((o) => o.trim()).filter(Boolean);

/** Write saved defaults into the canvas just opened: its settings controls
 *  take them, and a filter for the same key starts from them and keeps them
 *  (marked, so they travel on to the next report and back). */
function withDefaults(blocks: Block[], defaults: Record<string, string>): Block[] {
  let changed = false;
  const next = blocks.map((b) => {
    const props = (b.props ?? {}) as Record<string, unknown>;
    let out = b;
    const key = props.stateKey;
    if (isPersisted(props) && typeof key === "string" && defaults[key] !== undefined && defaults[key] !== props.value && optionsOf(props).includes(defaults[key])) {
      out = { ...out, props: { ...out.props, value: defaults[key] } };
    }
    if (Array.isArray(props.filters)) {
      const filters = (props.filters as Record<string, unknown>[]).map((f) => {
        const k = f?.stateKey;
        if (!f || typeof k !== "string" || defaults[k] === undefined || !optionsOf(f).includes(defaults[k])) return f;
        return f.value === defaults[k] && isPersisted(f) ? f : { ...f, value: defaults[k], persistValue: true };
      });
      if (filters.some((f, i) => f !== (props.filters as unknown[])[i])) out = { ...out, props: { ...out.props, filters } };
    }
    if (out !== b) changed = true;
    return out;
  });
  return changed ? next : blocks;
}

function carryReportDefaults(defaults: Record<string, string>) {
  if (Object.keys(defaults).length === 0) return;
  useBuilder.setState((st) => {
    const blocks = withDefaults(st.blocks, defaults);
    return {
      headerBlocks: withDefaults(st.headerBlocks, defaults),
      blocks,
      pages: st.pages.map((p) => (p.id === st.activePageId ? { ...p, body: blocks } : { ...p, body: withDefaults(p.body, defaults) })),
    };
  });
}

/** A report control's change. Always the live report state; a settings
 *  control (`persistValue`) also keeps the value on its block so it is saved. */
export function setReportControlValue(blockId: string | undefined, props: Record<string, unknown>, stateKey: string, value: string) {
  const s = useBuilder.getState();
  s.setReportState(stateKey, value);
  if (blockId && isPersisted(props) && value) s.updateBlockProps(blockId, { value });
}
