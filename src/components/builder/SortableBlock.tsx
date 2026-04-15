"use client";

import React, { useCallback, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ZoneId } from "@/store/useBuilder";

const COL_SPAN_LABELS: Record<number, string> = { 1: "⅓", 2: "⅔", 3: "Full" };

/* ── Resize handle — drag the right edge to change colSpan ── */
function ResizeHandle({
  colSpan,
  onResize,
}: {
  colSpan: number;
  onResize: (span: number) => void;
}) {
  const [resizing, setResizing] = useState(false);
  const startRef = useRef<{ x: number; span: number; gridWidth: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      /* Measure the grid container width to calculate column thresholds */
      const gridEl = (e.currentTarget as HTMLElement).closest(".zone-grid");
      const gridWidth = gridEl ? gridEl.clientWidth : 600;

      startRef.current = { x: e.clientX, span: colSpan, gridWidth };
      setResizing(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [colSpan]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current) return;
      const { x: startX, gridWidth } = startRef.current;
      const colWidth = gridWidth / 3;
      const delta = e.clientX - startX;
      const deltaSpans = Math.round(delta / colWidth);
      const newSpan = Math.max(1, Math.min(3, startRef.current.span + deltaSpans));
      if (newSpan !== colSpan) onResize(newSpan);
    },
    [colSpan, onResize]
  );

  const handlePointerUp = useCallback(() => {
    startRef.current = null;
    setResizing(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); onResize(Math.min(3, colSpan + 1)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); onResize(Math.max(1, colSpan - 1)); }
  }, [colSpan, onResize]);

  return (
    <div
      className={`block-resize-handle${resizing ? " is-resizing" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize block width"
      aria-valuenow={colSpan}
      aria-valuemin={1}
      aria-valuemax={3}
      tabIndex={0}
      title="Drag to resize width (or use Arrow keys)"
    >
      <div className="block-resize-grip" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */

interface SortableBlockProps {
  id: string;
  zone?: ZoneId;
  compact?: boolean;
  isSelected?: boolean;
  colSpan?: number;
  onColSpanChange?: (span: number) => void;
  onSwapClick?: () => void;
  onRemove?: () => void;
  children: React.ReactNode;
}

export function SortableBlock({
  id,
  zone,
  compact,
  isSelected,
  colSpan = 3,
  onColSpanChange,
  onSwapClick,
  onRemove,
  children,
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({ id, data: { zone } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cls = [
    "canvas-block",
    isDragging && "is-dragging",
    isSelected && "is-selected",
    compact && "zone-block-compact",
    /* Drop indicator: show when another item is being sorted and this item is shifting */
    isSorting && !isDragging && "is-sorting-peer",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={setNodeRef} style={style} className={cls} {...attributes}>
      {/* Drop-between indicator line */}
      {isSorting && !isDragging && (
        <div className="block-drop-indicator" />
      )}

      {/* Drag handle */}
      <div
        ref={setActivatorNodeRef}
        className="canvas-block-handle"
        {...listeners}
        title="Drag to reorder"
        role="button"
        tabIndex={0}
        aria-roledescription="sortable"
        aria-label="Drag handle"
      >
        <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1 }}>&#x2807;</span>
      </div>

      {/* Remove button */}
      {onRemove && (
        <button
          className="canvas-block-remove"
          onClick={onRemove}
          aria-label="Remove block"
          type="button"
        >
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 14 }}>
            close
          </span>
        </button>
      )}

      {/* Swap button — hidden in compact mode */}
      {onSwapClick && !compact && (
        <button
          className="canvas-block-swap"
          onClick={onSwapClick}
          aria-label="Swap component"
          type="button"
        >
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 14 }}>
            swap_horiz
          </span>
        </button>
      )}

      {/* Column span badge — click to cycle */}
      {onColSpanChange && !compact && (
        <button
          className="canvas-block-colspan"
          onClick={() => {
            const cycle = [1, 2, 3];
            const idx = cycle.indexOf(colSpan);
            onColSpanChange(cycle[(idx + 1) % cycle.length]);
          }}
          title={`Width: ${COL_SPAN_LABELS[colSpan] || "Full"} — click to cycle`}
          type="button"
        >
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.02em" }}>
            {COL_SPAN_LABELS[colSpan] || "Full"}
          </span>
        </button>
      )}

      {children}

      {/* Resize handle — right edge drag (body zone only) */}
      {onColSpanChange && !compact && colSpan < 3 && (
        <ResizeHandle colSpan={colSpan} onResize={onColSpanChange} />
      )}
    </div>
  );
}
