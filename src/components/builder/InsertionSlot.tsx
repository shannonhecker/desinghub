"use client";

import React from "react";
import { useBuilder, type ZoneId } from "@/store/useBuilder";

/* ══════════════════════════════════════════════════════════
   InsertionSlot - thin hover-activated strip between sortable
   children inside a zone. Click the + button to open the
   SlashInserter anchored at this zone + index.

   Visibility is entirely gated by experimentalLayout:
     - flag OFF → component returns null, zero regression for
       non-test users.
     - flag ON  → the strip is always in the DOM (so it can
       expand on hover), but only a 1px center line is painted
       until the user hovers.

   Orientation mirrors the zone's flow mode:
     - stack / grid → horizontal strip (full width, short height)
     - row          → vertical strip (short width, full height)

   Styles live in builder.css alongside the existing .slash-*
   rules so we keep one stylesheet per the project convention.
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
  const experimentalLayout = useBuilder((s) => s.experimentalLayout);
  const openInserter = useBuilder((s) => s.openInserter);

  if (!experimentalLayout) return null;

  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    openInserter({ zone, index });
  };

  return (
    <div
      className={`insertion-slot insertion-slot-${orientation}`}
      data-zone={zone}
      data-index={index}
      aria-hidden="false"
    >
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
