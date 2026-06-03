/**
 * autoSaveTrackedKeys - the SINGLE source of truth for which builder-store
 * fields trigger an auto-save.
 *
 * Both auto-save paths fingerprint-diff this exact list:
 *   - useAutoSave.ts      (cloud / Firebase mirror)
 *   - useLocalAutoSave.ts (local-first / localStorage source of truth)
 *
 * Keeping the list in one module means the cloud and local writers can
 * never silently diverge on what counts as a "meaningful" edit. If a new
 * persisted field is added to a session snapshot, add it here once and
 * both writers pick it up.
 *
 * Unrelated UI state (drawer toggles, input focus, preview-open, etc.) is
 * intentionally excluded so neither path burns writes on noise.
 */
export const TRACKED_KEYS = [
  "messages",
  "blocks",
  "headerBlocks",
  "sidebarBlocks",
  "footerBlocks",
  "zoneLayouts",
  "designSystem",
  "mode",
  "density",
  "interfaceType",
  "selectedComponents",
  "colorOverrides",
  "activeTemplateId",
  "sessionTitle",
] as const;

export type TrackedKey = (typeof TRACKED_KEYS)[number];
