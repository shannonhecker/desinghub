"use client";

/**
 * GroupDropContainer - nested drop target + sortable context for a
 * LayoutGroup block's interior. Mirrors ZoneDropContainer but
 * scopes to a parent group's `children` array instead of a zone.
 *
 * IDs and data keys:
 *   - Droppable id:  `group-${groupId}`
 *   - Droppable data: { parentGroupId: groupId }
 *
 * The wrapping PreviewPanel's handleDragEnd reads `parentGroupId`
 * from `over.data` to route library drops and zone-to-group moves
 * into the correct group. Reorders-within-group go through the
 * SortableContext below.
 */

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Block } from "@/store/useBuilder";
import { computeGroupStyle } from "@/lib/layoutResolver";

interface GroupDropContainerProps {
  group: Block;
  children: React.ReactNode;
}

export function GroupDropContainer({ group, children }: GroupDropContainerProps) {
  const kids = group.children ?? [];
  const { setNodeRef, isOver } = useDroppable({
    id: `group-${group.id}`,
    data: { parentGroupId: group.id },
  });

  const rawDir = group.props.direction;
  const mode: "stack" | "row" = rawDir === "row" ? "row" : "stack";
  const strategy = mode === "row" ? horizontalListSortingStrategy : verticalListSortingStrategy;

  const style = computeGroupStyle(group);
  /* Ensure the group's drop target is a distinct surface with
     visible hit area even when empty. Minimum height keeps
     drop-detection reliable in stack mode with no children yet. */
  const containerStyle: React.CSSProperties = {
    ...style,
    minHeight: kids.length === 0 ? 64 : undefined,
  };

  const countLabel =
    kids.length === 0
      ? "empty, drop blocks here"
      : `${kids.length} ${kids.length === 1 ? "block" : "blocks"}`;

  return (
    <div
      ref={setNodeRef}
      className={`group-drop-container group-drop-${mode}${isOver ? " is-over" : ""}${kids.length === 0 ? " is-empty" : ""}`}
      style={containerStyle}
      data-layout-mode={mode}
      data-group-id={group.id}
      role="group"
      aria-label={`Group column — ${countLabel}`}
    >
      <SortableContext
        items={kids.map((b) => b.id)}
        strategy={strategy}
      >
        {kids.length === 0 ? (
          <div className="group-drop-empty-hint" aria-hidden="true">
            Drop blocks here
          </div>
        ) : (
          children
        )}
      </SortableContext>
    </div>
  );
}
