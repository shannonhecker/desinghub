"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { useBuilder, type ZoneId } from "@/store/useBuilder";

/* ══════════════════════════════════════════════════════════
   InsertionSlot - thin strip between sortable children inside a
   zone. Two jobs:
     1. Click the + button to open the SlashInserter at this
        zone + index.
     2. Act as a real drop target during drag (Placement Option 1):
        when a block is dragged over this gap, the slot lights up a
        precise insertion line and the drop commits to exactly this
        index — no more faked, jumping indicator.

   The strip is always in the DOM (so it can expand on hover), but
   only a 1px center line is painted until hover/drag-over.

   DROP HIT-AREA: dnd-kit measures the droppable's bounding rect,
   not DOM pointer hit-testing, so we attach the droppable ref to an
   absolutely-positioned overlay that bleeds a few px into the
   neighbouring blocks. That makes the thin gap reliably catchable
   while the overlay's `pointer-events: none` keeps clicks on
   neighbours (and the + button) intact and adds zero layout height.

   Orientation mirrors the zone's flow mode:
     - stack / grid → horizontal strip (full width, short height)
     - row          → vertical strip (short width, full height)
   ══════════════════════════════════════════════════════════ */

interface InsertionSlotProps {
  zone: ZoneId;
  /** Insertion index inside the zone. The new block is spliced at
     this position, so index 0 prepends and index === children.length
     appends. */
  index: number;
  /** Horizontal strips sit between stacked items (default); vertical
     strips sit between row-mode items. */
  orientation?: "horizontal" | "vertical";
}

export function InsertionSlot({ zone, index, orientation = "horizontal" }: InsertionSlotProps) {
  const openInserter = useBuilder((s) => s.openInserter);

  /* Real drop target: id encodes the exact gap so the drag handlers can
     resolve {zone, index} straight from over.data without a findIndex
     guess. `isInsertionSlot` lets handleDragOver/End take the precise
     path and skip the block-to-block arrayMove approximation. */
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${zone}-${index}`,
    data: { zone, index, isInsertionSlot: true },
  });

  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    openInserter({ zone, index });
  };

  return (
    <div
      className={`insertion-slot insertion-slot-${orientation}${isOver ? " is-drop-target" : ""}`}
      data-zone={zone}
      data-index={index}
      aria-hidden="false"
    >
      {/* Expanded, invisible drop hit-area (measured by dnd-kit). */}
      <span ref={setNodeRef} className="insertion-slot-hit" aria-hidden="true" />
      <span className="insertion-slot-line" aria-hidden="true" />
      <button
        type="button"
        className="insertion-slot-plus"
        aria-label={`Insert component at position ${index + 1}`}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick(e);
          }
        }}
      >
        <span className="insertion-slot-plus-icon" aria-hidden="true">
          +
        </span>
      </button>
    </div>
  );
}
