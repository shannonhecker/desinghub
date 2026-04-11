"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableBlockProps {
  id: string;
  isSelected?: boolean;
  onSwapClick: () => void;
  onRemove?: () => void;
  children: React.ReactNode;
}

export function SortableBlock({ id, isSelected, onSwapClick, onRemove, children }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`canvas-block${isDragging ? " is-dragging" : ""}${isSelected ? " is-selected" : ""}`}
      {...attributes}
    >
      {/* Drag handle */}
      <div className="canvas-block-handle" {...listeners} title="Drag to reorder">
        <span style={{ fontSize: 14, lineHeight: 1 }}>&#x2807;</span>
      </div>

      {/* Remove button */}
      {onRemove && (
        <button
          className="canvas-block-remove"
          onClick={onRemove}
          title="Remove block"
          type="button"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            close
          </span>
        </button>
      )}

      {/* Swap button */}
      <button
        className="canvas-block-swap"
        onClick={onSwapClick}
        title="Swap component"
        type="button"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          swap_horiz
        </span>
      </button>

      {children}
    </div>
  );
}
