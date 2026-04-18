"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import type { ZoneId, Block } from "@/store/useBuilder";

/* ══════════════════════════════════════════════════════════
   ZoneDropContainer - shared droppable + SortableContext
   wrapper used by all four builder zones (header, sidebar,
   body, footer). Provides drop-target detection and
   sortable ordering within the zone.

   direction="grid" uses a 3-column CSS grid with
   rectSortingStrategy for the body zone.
   ══════════════════════════════════════════════════════════ */

interface ZoneDropContainerProps {
  zoneId: ZoneId;
  blocks: Block[];
  direction: "horizontal" | "vertical" | "grid";
  className?: string;
  children: React.ReactNode;
}

export function ZoneDropContainer({
  zoneId,
  blocks,
  direction,
  className,
  children,
}: ZoneDropContainerProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `zone-${zoneId}`,
    data: { zone: zoneId },
  });

  const strategy =
    direction === "grid"
      ? rectSortingStrategy
      : direction === "horizontal"
      ? horizontalListSortingStrategy
      : verticalListSortingStrategy;

  return (
    <div
      ref={setNodeRef}
      className={`zone-drop-container zone-drop-${zoneId}${direction === "grid" ? " zone-grid" : ""}${isOver ? " is-over" : ""}${className ? ` ${className}` : ""}`}
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
