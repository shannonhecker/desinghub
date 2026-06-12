"use client";

import React, { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import type { ZoneId, Block, ZoneLayout } from "@/store/useBuilder";
import { useBuilder } from "@/store/useBuilder";
import { computeContainerStyle } from "@/lib/layoutResolver";
import { InsertionSlot } from "./InsertionSlot";

/* ══════════════════════════════════════════════════════════
   ZoneDropContainer - shared droppable + SortableContext
   wrapper used by all four builder zones (header, sidebar,
   body, footer). Provides drop-target detection and
   sortable ordering within the zone.

   The container now reads its flow mode (stack/row/grid) from
   the store's zoneLayouts[zoneId] config rather than a hard-
   coded prop. `direction` is kept as a legacy fallback for
   callers that haven't migrated yet.

   We interleave InsertionSlot strips between every mapped child
   so users can add a new block at any index with a + click.
   ══════════════════════════════════════════════════════════ */

interface ZoneDropContainerProps {
  zoneId: ZoneId;
  blocks: Block[];
  /** Legacy prop - kept for backward compat until sub-phase 6.
     When `zoneLayout` is absent, falls back to this for the
     sortable strategy pick. */
  direction?: "horizontal" | "vertical" | "grid";
  /** Explicit override for the zone's layout config. When
     omitted, reads from useBuilder's zoneLayouts map. */
  zoneLayout?: ZoneLayout;
  className?: string;
  children: React.ReactNode;
}

export function ZoneDropContainer({
  zoneId,
  blocks,
  direction,
  zoneLayout: zoneLayoutOverride,
  className,
  children,
}: ZoneDropContainerProps) {
  const storeLayout = useBuilder((s) => s.zoneLayouts[zoneId]);
  const zoneLayout = zoneLayoutOverride ?? storeLayout;
  /* Issue #79: highlight this zone when the user is hovering a library
     tile that would land here. Cleared on tile-leave or click/drag start. */
  const libraryHoverZone = useBuilder((s) => s.libraryHoverZone);
  const isLibraryHoverTarget = libraryHoverZone === zoneId;
  const { setNodeRef, isOver } = useDroppable({
    id: `zone-${zoneId}`,
    data: { zone: zoneId },
  });

  /* Sortable strategy picks are independent of container style:
     Grid → rectSortingStrategy (2-axis hit testing).
     Row  → horizontalListSortingStrategy.
     Stack (vertical) → verticalListSortingStrategy. */
  const mode = zoneLayout?.mode ?? (direction === "grid" ? "grid" : direction === "vertical" ? "stack" : "row");
  const strategy =
    mode === "grid"
      ? rectSortingStrategy
      : mode === "row"
      ? horizontalListSortingStrategy
      : verticalListSortingStrategy;

  const style = zoneLayout ? computeContainerStyle(zoneLayout) : undefined;

  /* Memoize the sortable items array. Without this, every render
     produces a fresh array reference for `SortableContext.items`,
     which dnd-kit treats as "items changed" and may trigger internal
     recalculation. During drag (high re-render frequency) this
     compounds. The array contents only change when the blocks list
     changes, so memoize on blocks. */
  const itemIds = useMemo(() => blocks.map((b) => b.id), [blocks]);

  /* Interleave InsertionSlot strips between every mapped child.
     `React.Children.toArray` preserves the caller's keys + strips
     falsy children, which matches the existing behavior.

     GRID EXCEPTION: every auto-placed grid child occupies a track, so
     interleaved slots silently steal one column each — a 6/3/3 scope
     row plus its slots can never fit a 12-col row, collapsing template
     rows (Export CSV wrapping, KPI 4-up turning into a staircase).
     Grid zones therefore render only the trailing append slot, styled
     full-row via `.zone-grid > .insertion-slot-horizontal` so it takes
     no column track. Insert-at-position in grid stays reachable via
     drag-and-drop and the "/" SlashInserter. */
  const childArray = React.Children.toArray(children);
  const slotOrientation: "horizontal" | "vertical" = mode === "row" ? "vertical" : "horizontal";
  const endSlot = (
    <InsertionSlot
      key={`slot-${zoneId}-end`}
      zone={zoneId}
      index={childArray.length}
      orientation={slotOrientation}
    />
  );
  const renderedChildren =
    mode === "grid"
      ? childArray.concat(endSlot)
      : childArray.flatMap((child, i) => [
          <InsertionSlot
            key={`slot-${zoneId}-${i}`}
            zone={zoneId}
            index={i}
            orientation={slotOrientation}
          />,
          child,
        ]).concat(endSlot);

  return (
    <div
      ref={setNodeRef}
      className={`zone-drop-container zone-drop-${zoneId}${mode === "grid" ? " zone-grid" : ""}${mode === "row" ? " zone-row" : ""}${mode === "stack" ? " zone-stack" : ""}${isOver ? " is-over" : ""}${isLibraryHoverTarget ? " is-library-hover-target" : ""} has-insertion-slots${className ? ` ${className}` : ""}`}
      style={style}
      data-layout-mode={mode}
    >
      <SortableContext
        items={itemIds}
        strategy={strategy}
      >
        {renderedChildren}
      </SortableContext>
    </div>
  );
}
