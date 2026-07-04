import { captureSnapshot, type CanvasSnapshot } from "./builderHistory";

/* Per-turn canvas snapshots for the chat history "Restore" cards (Phase 2).
   Keyed by the user message id that started the turn; captured PRE-build in
   ChatPanel.handleSend (before any canvas mutation). Module-scoped (resets on
   reload), capped to mirror the undo ring. Stale ids (for trimmed/cleared
   messages) are harmless — they simply never render a card. */
const MAX_TURN_SNAPSHOTS = 50;
const snapshots = new Map<string, CanvasSnapshot>();
const order: string[] = [];

export function saveTurnSnapshot(messageId: string): void {
  if (!messageId || snapshots.has(messageId)) return;
  snapshots.set(messageId, captureSnapshot());
  order.push(messageId);
  while (order.length > MAX_TURN_SNAPSHOTS) {
    const evicted = order.shift();
    if (evicted) snapshots.delete(evicted);
  }
}

export function getTurnSnapshot(messageId: string): CanvasSnapshot | undefined {
  return snapshots.get(messageId);
}

export function clearTurnSnapshots(): void {
  snapshots.clear();
  order.length = 0;
}
