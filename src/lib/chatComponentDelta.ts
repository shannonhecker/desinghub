/**
 * Chat → canvas bridge.
 *
 * `processComponentCommand` in ChatPanel returns a new
 * `selectedComponents` id array but never writes to the canvas
 * `blocks` array. PreviewCanvas mirrors selectedComponents → blocks
 * only on first mount (one-shot guard), so chat commands sent AFTER
 * the preview has opened produced no visible change.
 *
 * This helper closes that gap: compute the delta between the old +
 * new id lists, then apply it to the body zone using the same store
 * actions the component library uses (addBlockFromLibrary for adds,
 * removeBlockFromZone for removals). The selectedComponents array
 * still gets updated at the call site to keep the onboarding state
 * consistent.
 */

import { useBuilder } from "@/store/useBuilder";
import type { Block } from "@/store/useBuilder";
import { ID_TO_BLOCK, ID_TO_MULTI_BLOCKS } from "@/lib/componentMaps";

export function applyChatComponentDelta(
  oldIds: string[],
  newIds: string[],
): void {
  const addedIds = newIds.filter((id) => !oldIds.includes(id));
  const removedIds = oldIds.filter((id) => !newIds.includes(id));
  if (addedIds.length === 0 && removedIds.length === 0) return;

  const state = useBuilder.getState();

  /* Adds first so a subsequent "remove" in the same delta operates
     on a stable post-add block list. */
  for (const id of addedIds) {
    const multi = ID_TO_MULTI_BLOCKS[id];
    if (multi) {
      for (const mb of multi) {
        state.addBlockFromLibrary(mb.type, { ...mb.props }, "body");
      }
      continue;
    }
    const type = ID_TO_BLOCK[id];
    if (type) {
      state.addBlockFromLibrary(type, {}, "body");
    }
    /* Unknown id (e.g. legacy string from an old session) — skip
       silently. The AI acknowledgement still surfaces, so the UX
       stays smooth even if the mapping drifts. */
  }

  if (removedIds.length === 0) return;

  /* ⚠️ Collateral-removal note:
     Removals match by `block.type`, not by provenance. A chat
     "remove cards" will drop every SimulatedCard in the body zone —
     including any the user dragged in via the palette. Acceptable
     for MVP; a follow-up could tag chat-sourced blocks with
     provenance metadata and target only those, or remove only the
     N most recent matches where N is the multi-block count. */
  const fresh = useBuilder.getState();
  const typesToRemove = new Set<string>();
  for (const id of removedIds) {
    const multi = ID_TO_MULTI_BLOCKS[id];
    if (multi) {
      for (const mb of multi) typesToRemove.add(mb.type);
      continue;
    }
    const type = ID_TO_BLOCK[id];
    if (type) typesToRemove.add(type);
  }
  const doomed: Block[] = fresh.blocks.filter((b) => typesToRemove.has(b.type));
  for (const b of doomed) {
    fresh.removeBlockFromZone("body", b.id);
  }
}
