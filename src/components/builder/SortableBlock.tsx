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
  onResize: (pct: number) => void;
}) {
  const [resizing, setResizing] = useState(false);
  const startRef = useRef<{ x: number; startPct: number; containerWidth: number } | null>(null);

  /* Current width percentage — derive from colSpan (legacy) or direct pct */
  const currentPct = colSpan <= 3 ? Math.round(colSpan * 33.33) : colSpan;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const container = (e.currentTarget as HTMLElement).closest(".zone-grid") || (e.currentTarget as HTMLElement).parentElement?.parentElement;
      const containerWidth = container ? container.clientWidth : 600;
      startRef.current = { x: e.clientX, startPct: currentPct, containerWidth };
      setResizing(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [currentPct]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current) return;
      const { x: startX, startPct: sp, containerWidth } = startRef.current;
      const deltaPx = e.clientX - startX;
      const deltaPct = (deltaPx / containerWidth) * 100;
      const newPct = Math.max(20, Math.min(100, Math.round(sp + deltaPct)));
      if (newPct !== currentPct) onResize(newPct);
    },
    [currentPct, onResize]
  );

  const handlePointerUp = useCallback(() => {
    startRef.current = null;
    setResizing(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); onResize(Math.min(100, currentPct + 10)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); onResize(Math.max(20, currentPct - 10)); }
  }, [currentPct, onResize]);

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
      aria-valuenow={currentPct}
      aria-valuemin={20}
      aria-valuemax={100}
      tabIndex={0}
      title={`Width: ${currentPct}% — drag to resize (or Arrow keys ±10%)`}
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

      {/* Width badge — click to cycle common widths */}
      {onColSpanChange && !compact && (
        <button
          className="canvas-block-colspan"
          onClick={() => {
            const cycle = [33, 50, 66, 100];
            const current = colSpan <= 3 ? Math.round(colSpan * 33.33) : colSpan;
            const idx = cycle.findIndex(v => v >= current);
            const next = cycle[(idx + 1) % cycle.length];
            onColSpanChange(next);
          }}
          aria-label={`Width ${colSpan <= 3 ? Math.round(colSpan * 33.33) : colSpan}%`}
          type="button"
        >
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.02em" }}>
            {colSpan <= 3 ? COL_SPAN_LABELS[colSpan] || "Full" : `${colSpan}%`}
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
