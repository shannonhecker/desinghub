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

export interface ChatDeltaOptions {
  /* IDs whose mapped block types should be removed from the body zone
     regardless of whether they appear in the (oldIds → newIds) delta.
     Use this when removal intent is explicit in the user's message
     but the wizard `selectedComponents` array is out of sync with
     what's actually on canvas (e.g. blocks dragged from the palette). */
  alsoRemoveIds?: string[];
  /* When true, wipe every block in the body zone. Used for "clear all"
     style commands. Runs before adds so a combined clear+add still
     works. Other zones (header/sidebar/footer) are untouched. */
  clearBody?: boolean;
}

export function applyChatComponentDelta(
  oldIds: string[],
  newIds: string[],
  opts: ChatDeltaOptions = {},
): void {
  const addedIds = newIds.filter((id) => !oldIds.includes(id));
  const deltaRemovedIds = oldIds.filter((id) => !newIds.includes(id));
  const explicitRemoveIds = opts.alsoRemoveIds ?? [];
  const removedIds = Array.from(new Set([...deltaRemovedIds, ...explicitRemoveIds]));
  const clearBody = opts.clearBody === true;

  if (addedIds.length === 0 && removedIds.length === 0 && !clearBody) return;

  /* "Clear body" runs first so that a combined clear-then-add still
     leaves the canvas in the intended post-state. */
  if (clearBody) {
    const fresh = useBuilder.getState();
    for (const b of [...fresh.blocks]) {
      fresh.removeBlockFromZone("body", b.id);
    }
  }

  const state = useBuilder.getState();

  /* Adds second so a subsequent "remove" in the same delta operates
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
