"use client";

import React, { useCallback, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ZoneId, LayoutProps } from "@/store/useBuilder";

const COL_SPAN_LABELS: Record<number, string> = { 1: "⅓", 2: "⅔", 3: "Full" };

/* ════════════════════════════════════════════════════════════
   Resize handles - two complementary affordances
   ════════════════════════════════════════════════════════════

   Right-edge handle (.block-resize-handle) drags the block's
   width in PIXELS. Absolute values, precise. Ideal for fixed-
   width elements like sidebars, form fields, fixed cards.

   Corner handle (.block-resize-corner) drags the block's width
   as a PERCENTAGE of the parent container. Responsive-friendly
   - the block re-flows if the container resizes.

   Both handles show a floating value overlay during drag
   (Figma-style) so the user sees the exact number they're
   landing on. Min/max constraints are respected during the
   drag: the pointer moves freely but the computed width is
   clamped before the store writes.
   ════════════════════════════════════════════════════════════ */

interface ResizeHandleProps {
  colSpan: number;
  onResize: (span: number) => void;
  /** Called when the new resize flow writes a specific width
     string (px or %) to the block. Prefer this over onResize
     for the new layout system; colSpan is legacy. */
  onWidth?: (width: string) => void;
  /** Respected during drag - computed width is clamped to
     [minWidth, maxWidth] before being emitted. */
  minWidth?: number;
  maxWidth?: number;
  /** Drag mode: "px" (right-edge) or "percent" (corner). */
  mode: "px" | "percent";
}

function ResizeHandle({ colSpan, onResize, onWidth, minWidth, maxWidth, mode }: ResizeHandleProps) {
  const [resizing, setResizing] = useState(false);
  const [overlay, setOverlay] = useState<string>("");
  const startRef = useRef<{ x: number; startWidth: number; containerWidth: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      /* Measure the block and the parent container. Parent is the
         zone-drop-container; block is the wrapping div that carries
         computeItemStyle. */
      const blockEl = (e.currentTarget as HTMLElement).closest(".canvas-block") as HTMLElement | null;
      const wrapperEl = blockEl?.parentElement as HTMLElement | null;
      const containerEl = wrapperEl?.closest(".zone-drop-container") as HTMLElement | null;
      const startWidth = wrapperEl?.getBoundingClientRect().width ?? 240;
      const containerWidth = containerEl?.clientWidth ?? 720;

      startRef.current = { x: e.clientX, startWidth, containerWidth };
      setResizing(true);
      setOverlay(mode === "px" ? `${Math.round(startWidth)}px` : `${Math.round((startWidth / containerWidth) * 100)}%`);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [mode],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current) return;
      const { x: startX, startWidth, containerWidth } = startRef.current;
      const delta = e.clientX - startX;

      /* Clamp to [minWidth, maxWidth] (px). Default min is 80px,
         default max is containerWidth (can't exceed parent). */
      const minPx = minWidth ?? 80;
      const maxPx = maxWidth ?? containerWidth;
      const nextPx = Math.max(minPx, Math.min(maxPx, startWidth + delta));

      if (mode === "px") {
        const v = Math.round(nextPx);
        setOverlay(`${v}px`);
        onWidth?.(`${v}px`);
        /* Also map to legacy colSpan so the badge button stays in
           sync. Snap: <40% = 1, <73% = 2, else 3. */
        const pct = nextPx / containerWidth;
        const legacy = pct >= 0.73 ? 3 : pct >= 0.4 ? 2 : 1;
        if (legacy !== colSpan) onResize(legacy);
      } else {
        /* Percent mode: round to nearest 5% for snappy feel;
           hold Shift for 1% precision. */
        const rawPct = (nextPx / containerWidth) * 100;
        const pct = e.shiftKey ? Math.round(rawPct) : Math.round(rawPct / 5) * 5;
        const clamped = Math.max(10, Math.min(100, pct));
        setOverlay(`${clamped}%`);
        onWidth?.(`${clamped}%`);
        const legacy = clamped >= 73 ? 3 : clamped >= 40 ? 2 : 1;
        if (legacy !== colSpan) onResize(legacy);
      }
    },
    [colSpan, onResize, onWidth, minWidth, maxWidth, mode],
  );

  const handlePointerUp = useCallback(() => {
    startRef.current = null;
    setResizing(false);
    /* Fade overlay out after a beat so the user sees the final value. */
    setTimeout(() => setOverlay(""), 350);
  }, []);

  const wrapperClass = mode === "px" ? "block-resize-handle" : "block-resize-corner";
  return (
    <div
      className={`${wrapperClass}${resizing ? " is-resizing" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      title={mode === "px" ? "Drag to resize (pixels)" : "Drag to resize (percent) — hold Shift for 1% steps"}
    >
      <div className={mode === "px" ? "block-resize-grip" : "block-resize-grip-corner"} />
      {overlay && <span className="block-resize-overlay">{overlay}</span>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */

interface SortableBlockProps {
  id: string;
  zone?: ZoneId;
  compact?: boolean;
  isSelected?: boolean;
  colSpan?: number;
  onColSpanChange?: (span: number) => void;
  /** New layout-system hook. Writes a width string
     ("{N}px" / "{N}%") directly to the block's layout.width. */
  onWidthChange?: (width: string) => void;
  /** Passed through to the resize handles to clamp during drag. */
  layoutHints?: Pick<LayoutProps, "minWidth" | "maxWidth">;
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
  onWidthChange,
  layoutHints,
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

  /* Parse minWidth/maxWidth hints (strings) to px for the drag
     clamp. Percent/fraction hints aren't converted here - we
     only clamp when a concrete px value is provided. */
  const minPx = typeof layoutHints?.minWidth === "string" && layoutHints.minWidth.endsWith("px")
    ? parseFloat(layoutHints.minWidth)
    : typeof layoutHints?.minWidth === "number" ? layoutHints.minWidth : undefined;
  const maxPx = typeof layoutHints?.maxWidth === "string" && layoutHints.maxWidth.endsWith("px")
    ? parseFloat(layoutHints.maxWidth)
    : typeof layoutHints?.maxWidth === "number" ? layoutHints.maxWidth : undefined;

  /* Unified colSpan-change handler used by both the badge button
     (discrete 1/2/3) and the percent resize handle (continuous). */
  const handleSpanChange = (span: number) => onColSpanChange?.(span);
  const handleWidthChange = (w: string) => onWidthChange?.(w);

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

      {/* Swap button - hidden in compact mode */}
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

      {/* Column span badge - click to cycle 1/2/3 (legacy; the
          resize handles are the primary affordance now) */}
      {onColSpanChange && !compact && (
        <button
          className="canvas-block-colspan"
          onClick={() => {
            const cycle = [1, 2, 3];
            const idx = cycle.indexOf(colSpan);
            onColSpanChange(cycle[(idx + 1) % cycle.length]);
          }}
          title={`Width: ${COL_SPAN_LABELS[colSpan] || "Full"} - click to cycle`}
          type="button"
        >
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.02em" }}>
            {COL_SPAN_LABELS[colSpan] || "Full"}
          </span>
        </button>
      )}

      {children}

      {/* Right-edge handle - drags pixel width (precise).
         Only visible for body zone (resizable) blocks in
         non-compact mode. */}
      {onColSpanChange && !compact && (
        <ResizeHandle
          colSpan={colSpan}
          onResize={handleSpanChange}
          onWidth={handleWidthChange}
          minWidth={minPx}
          maxWidth={maxPx}
          mode="px"
        />
      )}

      {/* Bottom-right corner handle - drags percent width.
         Complements the px handle for responsive layouts. */}
      {onColSpanChange && !compact && (
        <ResizeHandle
          colSpan={colSpan}
          onResize={handleSpanChange}
          onWidth={handleWidthChange}
          minWidth={minPx}
          maxWidth={maxPx}
          mode="percent"
        />
      )}
    </div>
  );
}
