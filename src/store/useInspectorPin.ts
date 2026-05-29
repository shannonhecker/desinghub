/* ════════════════════════════════════════════════════════════
   useInspectorPin (Phase E2, 2026-05-29 builder UX cleanup)
   ════════════════════════════════════════════════════════════
   Hover-activated inspector replaces always-on chrome in Edit
   mode. Two layers of state:

     - hoveredBlockId : block the pointer is currently over.
                        Drives the dashed 1px outline + reveal
                        of inspector controls.
     - pinnedBlockId  : block the user clicked. Anchors the
                        inspector with a 2px solid outline +
                        corner badges. Survives pointer leave
                        so the user can move to the inspector
                        controls themselves without losing
                        focus.

   Behaviour rules:
     - setHover(id) tracks the pointer regardless of pin.
       Visual "inspector active" stays anchored to the pinned
       block (HoverInspector renders for hover OR pin), so the
       chrome doesn't follow the mouse off the pinned block.
     - pin(id) sets pinned + hover to the same id so the
       inspector reads as immediately active.
     - unpin() clears pinned only. Hover state untouched —
       if the pointer is still on the unpinned block, the
       hover outline reappears.
     - clear() resets both.

   In-memory only. Reload defaults back to nothing pinned /
   hovered.

   Phase E1 still owns mode-level chrome gating via
   usePreviewMode + [data-builder-mode]. This store layers
   on top inside Edit mode only.
   ════════════════════════════════════════════════════════════ */

import { create } from "zustand";

export interface InspectorState {
  pinnedBlockId: string | null;
  hoveredBlockId: string | null;
  setHover: (id: string | null) => void;
  pin: (id: string) => void;
  unpin: () => void;
  clear: () => void;
}

export const useInspectorPin = create<InspectorState>((set) => ({
  pinnedBlockId: null,
  hoveredBlockId: null,
  setHover: (id) => set({ hoveredBlockId: id }),
  pin: (id) => set({ pinnedBlockId: id, hoveredBlockId: id }),
  unpin: () => set({ pinnedBlockId: null }),
  clear: () => set({ pinnedBlockId: null, hoveredBlockId: null }),
}));
