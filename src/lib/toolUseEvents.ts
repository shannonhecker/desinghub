/* ── Phase 3a (N4 Tool-Use Cards): tool-use event bus ──
 *
 * `applyAIActions` (and any future tool-emitter) calls `emitToolUse`
 * after each parsed action lands. `ChatPanel` subscribes via
 * `subscribeToolUse`, groups events by `messageId`, and renders a
 * <ToolUseCard> inline below the assistant message that produced the
 * action.
 *
 * Wire pattern: window CustomEvent. Same convention used elsewhere
 * in builder/ for cross-component signals (search src for
 * `window.addEventListener`). SSR-safe — every entry point guards
 * `typeof window !== "undefined"` so build-time module load doesn't
 * blow up under Next.js RSC.
 *
 * Event payload shape mirrors the parsed AIAction union plus optional
 * `blockId` + `zone` for action-level undo wiring. PR (a) ships the
 * base wrapper; PR (b) introduces per-action card variants that
 * consume these fields.
 */

import type { ZoneId } from "@/store/useBuilder";

/* Tool-use action names. Subset of AIAction['action'] — re-declared
   here (rather than imported) to keep this file decoupled from the
   parse layer. Any drift surfaces as a compile error at the call
   site in applyAIActions, which imports both. */
export type ToolUseAction =
  | "setDesignSystem"
  | "setMode"
  | "setDensity"
  | "setComponents"
  | "setInterfaceType"
  | "setThemeKey"
  | "setColorOverride"
  | "addBlock"
  | "removeBlock"
  | "moveBlock"
  | "updateBlockProps"
  | "updateBlockLayout"
  | "clearCanvas"
  | "setZoneLayout";

export interface ToolUseEvent {
  /* The assistant message id this action belongs to. ChatPanel groups
     events by this key. Optional — tests / callers without a message
     context still emit usefully (events just don't render). */
  messageId?: string;
  action: ToolUseAction;
  /* Raw action value (mirrors AIAction.value shape). The card variant
     in PR (b) discriminates on `action` to render the right summary. */
  value: unknown;
  /* For block-targeting actions (`addBlock`, `removeBlock`,
     `moveBlock`, `updateBlockProps`, `updateBlockLayout`): the block
     id + zone the action touched. PR (a) uses these to wire a
     working per-card "Undo" for addBlock (remove the newly-added
     block). PR (b) extends to the other variants. */
  blockId?: string;
  zone?: ZoneId;
  /* Per-event monotonic timestamp so cards can sort + animate in
     order even when emitted in the same tick. */
  ts: number;
}

const EVENT_NAME = "builder:tool-use";

/* Module-scope sequence so cards stagger predictably even if many
   actions land synchronously in one applyAIActions pass. */
let seq = 0;

export function emitToolUse(
  payload: Omit<ToolUseEvent, "ts"> & { ts?: number },
): void {
  if (typeof window === "undefined") return;
  const detail: ToolUseEvent = {
    ...payload,
    ts: payload.ts ?? Date.now() + seq++ * 0.001,
  };
  window.dispatchEvent(new CustomEvent<ToolUseEvent>(EVENT_NAME, { detail }));
}

export function subscribeToolUse(
  handler: (event: ToolUseEvent) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => {
    const ce = e as CustomEvent<ToolUseEvent>;
    if (ce.detail) handler(ce.detail);
  };
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

/* Exposed for tests so the event name doesn't get hard-coded. */
export const TOOL_USE_EVENT_NAME = EVENT_NAME;
