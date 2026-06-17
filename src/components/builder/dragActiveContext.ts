"use client";

import { createContext, useContext } from "react";

/* True while a block is actively being dragged on the canvas. `activeDragId`
   is LOCAL state inside CanvasDndProvider (PreviewPanel); bridging it through
   context lets deep children (e.g. the grid ColumnGuides) react to drag start/
   end WITHOUT promoting that ephemeral UI state into the Zustand store — which
   would re-render every store subscriber on each drag. */
export const DragActiveContext = createContext(false);

export function useDragActive(): boolean {
  return useContext(DragActiveContext);
}
