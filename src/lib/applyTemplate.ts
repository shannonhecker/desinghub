import { useBuilder } from "@/store/useBuilder";
import type { DesignSystem } from "@/store/useBuilder";
import type { BuilderTemplate } from "@/lib/builderTemplates";

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

   The caller owns its own chat messaging, session naming, and
   preview-open state, since those differ per surface. ── */
export function applyTemplateToCanvas(tpl: BuilderTemplate, ds: DesignSystem) {
  const s = useBuilder.getState();
  s.setDesignSystem(ds);
  s.setInterfaceType(tpl.interfaceType);
  s.setSelectedComponents(tpl.selectedComponents);
  s.setHeaderBlocks(tpl.header);
  s.setSidebarBlocks(tpl.sidebar);
  s.setBlocks(tpl.body);
  s.setFooterBlocks(tpl.footer);
  /* Apply the template's body layout (e.g. the dashboard's 12-col grid);
     fall back to the default row layout so a prior grid does not leak. */
  s.setZoneLayout("body", tpl.zoneLayouts?.body ?? { mode: "row", gap: 12, wrap: true, align: "stretch" });
  s.setActiveTemplateId(tpl.id);
  s.bumpPreview();
}
