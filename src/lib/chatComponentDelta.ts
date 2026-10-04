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
 * new id lists, then apply it to the target zone using the same store
 * actions the component library uses (addBlockFromLibrary for adds,
 * removeBlockFromZone for removals). The selectedComponents array
 * still gets updated at the call site to keep the onboarding state
 * consistent.
 */

import { useBuilder } from "@/store/useBuilder";
import type { Block, ZoneId } from "@/store/useBuilder";
import { ID_TO_BLOCK, ID_TO_MULTI_BLOCKS } from "@/lib/componentMaps";

/* Store key per zone — mirrors ZONE_KEYS in useBuilder.ts. Kept local
   so the delta can read the target zone's array directly. */
const ZONE_TO_KEY: Record<ZoneId, "blocks" | "headerBlocks" | "sidebarBlocks" | "footerBlocks"> = {
  body: "blocks",
  header: "headerBlocks",
  sidebar: "sidebarBlocks",
  footer: "footerBlocks",
};

export interface ChatDeltaOptions {
  /* IDs whose mapped block types should be removed from the target zone
     regardless of whether they appear in the (oldIds → newIds) delta.
     Use this when removal intent is explicit in the user's message
     but the wizard `selectedComponents` array is out of sync with
     what's actually on canvas (e.g. blocks dragged from the palette). */
  alsoRemoveIds?: string[];
  /* IDs whose mapped block types should be added EVEN IF the id is
     already present in oldIds (so the delta is empty). Each entry adds
     one block. This is how "add a data table" with one already on
     canvas produces a real duplicate instead of a false "Added"
     confirmation that changed nothing. */
  alsoAddIds?: string[];
  /* When true, wipe every block in the target zone. Used for "clear"
     style commands. Runs before adds so a combined clear+add still
     works. Other zones are untouched. */
  clearBody?: boolean;
  /* Target zone for adds, removals, and clears. Defaults to "body" so
     every existing caller keeps its behavior. */
  zone?: ZoneId;
}

export interface ChatDeltaResult {
  /* Blocks actually removed from the canvas (clears included). Lets the
     caller catch an explicit removal that matched nothing in the target
     zone and reply honestly instead of reporting success. */
  removedCount: number;
}

export function applyChatComponentDelta(
  oldIds: string[],
  newIds: string[],
  opts: ChatDeltaOptions = {},
): ChatDeltaResult {
  const zone: ZoneId = opts.zone ?? "body";
  const zoneKey = ZONE_TO_KEY[zone];
  const explicitAddIds = opts.alsoAddIds ?? [];
  /* Delta adds exclude explicit ids so an id present in both lists is
     added exactly once (alsoAddIds wins as the intent carrier). */
  const deltaAddedIds = newIds.filter(
    (id) => !oldIds.includes(id) && !explicitAddIds.includes(id),
  );
  const addedIds = [...deltaAddedIds, ...explicitAddIds];
  const deltaRemovedIds = oldIds.filter((id) => !newIds.includes(id));
  const explicitRemoveIds = opts.alsoRemoveIds ?? [];
  const removedIds = Array.from(new Set([...deltaRemovedIds, ...explicitRemoveIds]));
  const clearZone = opts.clearBody === true;

  if (addedIds.length === 0 && removedIds.length === 0 && !clearZone) return { removedCount: 0 };

  let removedCount = 0;

  /* "Clear" runs first so that a combined clear-then-add still leaves
     the canvas in the intended post-state. */
  if (clearZone) {
    const fresh = useBuilder.getState();
    for (const b of [...(fresh[zoneKey] as Block[])]) {
      fresh.removeBlockFromZone(zone, b.id);
      removedCount++;
    }
  }

  const state = useBuilder.getState();

  /* Adds second so a subsequent "remove" in the same delta operates
     on a stable post-add block list.

     Phase 3a: every block landing via the chat delta carries
     `source: 'chat'` so N4 Tool-Use Cards can render the right
     "Undo this action" affordance. Removal predicate below stays
     type-only per Q2 — provenance is metadata, not a filter. */
  for (const id of addedIds) {
    const multi = ID_TO_MULTI_BLOCKS[id];
    if (multi) {
      for (const mb of multi) {
        state.addBlockFromLibrary(mb.type, { ...mb.props }, zone, undefined, "chat");
      }
      continue;
    }
    const type = ID_TO_BLOCK[id];
    if (type) {
      state.addBlockFromLibrary(type, {}, zone, undefined, "chat");
    }
    /* Unknown id (e.g. legacy string from an old session) — skip
       silently. The AI acknowledgement still surfaces, so the UX
       stays smooth even if the mapping drifts. */
  }

  /* addBlockFromLibrary auto-selects what it adds (inspector jump for
     palette clicks), but a selected block routes the NEXT chat message
     to the selected-block scope path — offline it then bails with
     "Editing the selected block needs AI", breaking repeated adds.
     Chat adds keep the conversation in freeform scope: restore the
     pre-add selection (`state` was snapshotted before the loop). */
  if (addedIds.length > 0) {
    useBuilder.setState({
      selectedBlockId: state.selectedBlockId,
      selectedBlockZone: state.selectedBlockZone,
      selectedBlockIds: state.selectedBlockIds,
    });
  }

  if (removedIds.length === 0) return { removedCount };

  /* ⚠️ Collateral-removal note:
     Removals match by `block.type`, not by provenance. A chat
     "remove cards" will drop every SimulatedCard in the target zone —
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
  const doomed: Block[] = (fresh[zoneKey] as Block[]).filter((b) => typesToRemove.has(b.type));
  for (const b of doomed) {
    fresh.removeBlockFromZone(zone, b.id);
  }
  removedCount += doomed.length;
  return { removedCount };
}
