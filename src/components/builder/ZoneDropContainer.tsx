"use client";

import React from "react";
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

/* ══════════════════════════════════════════════════════════
   ZoneDropContainer - shared droppable + SortableContext
   wrapper used by all four builder zones (header, sidebar,
   body, footer). Provides drop-target detection and
   sortable ordering within the zone.

   The container now reads its flow mode (stack/row/grid) from
   the store's zoneLayouts[zoneId] config rather than a hard-
   coded prop. `direction` is kept as a legacy fallback for
   callers that haven't migrated yet.
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

  return (
    <div
      ref={setNodeRef}
      className={`zone-drop-container zone-drop-${zoneId}${mode === "grid" ? " zone-grid" : ""}${mode === "row" ? " zone-row" : ""}${mode === "stack" ? " zone-stack" : ""}${isOver ? " is-over" : ""}${className ? ` ${className}` : ""}`}
      style={style}
      data-layout-mode={mode}
    >
      <SortableContext
        items={blocks.map((b) => b.id)}
        strategy={strategy}
      >
        {children}
      </SortableContext>
    </div>
  );
}
