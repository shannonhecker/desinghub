/**
 * sessionReset - undoable wrappers for the two whole-canvas wipes.
 *
 * `startNewSession` (top-bar icon beside the logo, Sessions drawer
 * "New session") and the chat's "clear all" both blanked the canvas with
 * no confirmation, no toast and no undo. The new-session wipe also nulls
 * `currentSessionId`, so the canvas undo stack (builderHistory) could not
 * bring the transcript or the session identity back.
 *
 * The builder's established pattern for destructive actions is a
 * toast-with-Undo (delete block, delete group), not a confirm dialog, so
 * both wipes now follow it:
 *   - startNewSessionWithUndo: captures the exact session slice that
 *     startNewSession resets, wipes, and offers Undo that restores it.
 *   - clearCanvasWithUndo: pushes a history snapshot first (so ⌘Z also
 *     works), wipes, and offers Undo that pops it.
 * An already-empty canvas with no messages wipes silently: nothing to lose.
 */

import { useBuilder } from "@/store/useBuilder";
import { captureSnapshot, pushSnapshot, restoreSnapshot } from "./builderHistory";
import { showToast } from "./toast";

type BuilderState = ReturnType<typeof useBuilder.getState>;

/** Visible long enough for a non-power user to read + act. */
const UNDO_TOAST_MS = 6000;

/** Everything startNewSession resets (kept in sync with the store action)
 *  PLUS the fields that give the session its identity. */
const SESSION_KEYS = [
  "messages",
  "blocks",
  "pages",
  "activePageId",
  "headerBlocks",
  "sidebarBlocks",
  "footerBlocks",
  "zoneLayouts",
  "selectedComponents",
  "selectedBlockId",
  "selectedBlockZone",
  "selectedBlockIds",
  "activeTemplateId",
  "pendingTemplateId",
  "pendingFirstMessage",
  "pendingAudience",
  "inputText",
  "currentSessionId",
  "sessionTitle",
  "lastSavedAt",
  "saveState",
  "saveError",
  "previewOpen",
  "onboardingStep",
  "wizardStep",
  "builtViaWizard",
] as const satisfies readonly (keyof BuilderState)[];

type SessionSlice = Pick<BuilderState, (typeof SESSION_KEYS)[number]>;

export function captureSessionSlice(s: BuilderState = useBuilder.getState()): SessionSlice {
  const out = {} as Record<string, unknown>;
  for (const k of SESSION_KEYS) out[k] = s[k];
  return out as SessionSlice;
}

/** True when there is nothing a user could regret losing. */
export function sessionIsEmpty(s: BuilderState = useBuilder.getState()): boolean {
  return (
    s.messages.length === 0 &&
    s.blocks.length === 0 &&
    s.headerBlocks.length === 0 &&
    s.sidebarBlocks.length === 0 &&
    s.footerBlocks.length === 0 &&
    s.pages.length <= 1
  );
}

/** Start a fresh session; when the old one had content, offer Undo. */
export function startNewSessionWithUndo(): void {
  const store = useBuilder.getState();
  const hadContent = !sessionIsEmpty(store);
  const before = hadContent ? captureSessionSlice(store) : null;
  store.startNewSession();
  if (!before) return;
  showToast("New session started", {
    icon: "restart_alt",
    durationMs: UNDO_TOAST_MS,
    action: {
      label: "Undo",
      onClick: () => {
        useBuilder.setState(before);
        useBuilder.getState().bumpPreview();
      },
    },
  });
}

/** Wipe every zone + body layout + template (the chat "clear all").
 *  Recorded on the canvas history (so ⌘Z works) AND held as an explicit
 *  pre-clear snapshot for the toast: downstream effects in the chat flow
 *  can touch tracked keys after the wipe and push an extra history entry,
 *  so a bare `undo()` could land on the still-empty canvas. restoreSnapshot
 *  is the non-destructive rewind the turn-history Restore cards use. */
export function clearCanvasWithUndo(): void {
  const store = useBuilder.getState();
  const hadContent = !sessionIsEmpty({ ...store, messages: [] });
  const before = hadContent ? captureSnapshot() : null;
  if (hadContent) pushSnapshot();
  store.setHeaderBlocks([]);
  store.setSidebarBlocks([]);
  store.setBlocks([]);
  store.setFooterBlocks([]);
  store.setZoneLayout("body", { mode: "row", gap: 12, wrap: true, align: "stretch" });
  store.setActiveTemplateId(null);
  if (!before) return;
  showToast("Canvas cleared", {
    icon: "delete_sweep",
    durationMs: UNDO_TOAST_MS,
    action: { label: "Undo", onClick: () => restoreSnapshot(before) },
  });
}
