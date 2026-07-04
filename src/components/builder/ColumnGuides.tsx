"use client";

import React from "react";
import { useDragActive } from "./dragActiveContext";
import { usePreviewMode } from "@/store/usePreviewMode";

/* ══════════════════════════════════════════════════════════
   ColumnGuides — Placement P2.

   While a block is being dragged inside a grid zone, overlay faint
   dashed lines at each column boundary so the designer can see the
   12-col structure they're dropping into. It is a pure EDITOR VISUAL:
   it writes NO data and never persists or exports anything.

   It must NOT be a raw DOM grid child of the zone — grid children
   steal a track (the same reason interleaved InsertionSlots are
   suppressed in grid mode). So it is an absolutely-positioned overlay
   (inset:0, pointer-events:none) with its OWN internal grid that
   mirrors the zone's columns + column-gap to align with the real
   tracks.
   ══════════════════════════════════════════════════════════ */

export function ColumnGuides({ columns, gap, alwaysShow = false }: { columns: number; gap: number; alwaysShow?: boolean }) {
  const dragActive = useDragActive();
  const inPreview = usePreviewMode((s) => s.mode) === "preview";
  /* Editor-only visual: never leak into Present/Preview, even in Grid
     placement mode (which passes alwaysShow). */
  if (inPreview) return null;
  /* Visible while dragging (Auto mode) OR always when the user is in Grid
     placement mode (so they can see + work the column grid). Only for a real
     multi-column grid. */
  if ((!dragActive && !alwaysShow) || columns < 2) return null;
  return (
    <div
      className="zone-col-guides"
      aria-hidden="true"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, columnGap: `${gap}px` }}
    >
      {Array.from({ length: columns }, (_, i) => (
        <span key={i} className="zone-col-guide-cell" />
      ))}
    </div>
  );
}
