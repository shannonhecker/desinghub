"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ZoneId, LayoutProps, LayoutWidth } from "@/store/useBuilder";
import { useBuilder } from "@/store/useBuilder";
import { ResizeHUD } from "./ResizeHUD";
import { SizeChipRail } from "./SizeChipRail";

const COL_SPAN_LABELS: Record<number, string> = { 1: "⅓", 2: "⅔", 3: "Full" };

/* Snap points (percent) and magnetic pull distance (px) applied
   to the experimental right-edge handle. Pull is translated to
   a percent window based on the container's current width so the
   snap feels consistent on narrow and wide zones alike. */
const SNAP_POINTS_PCT: readonly number[] = [25, 33, 50, 66, 75, 100];
const SNAP_PULL_PX = 6;

/* ════════════════════════════════════════════════════════════
   Resize handles — production path (two handles) vs experimental
   path (one right-edge slider + HUD + snap guide + chip rail).
   ════════════════════════════════════════════════════════════

   Production (experimentalLayout === false):
   - Right-edge handle drags block width in PIXELS.
   - Bottom-right corner handle drags block width as PERCENT.
   Both are kept unchanged so the flag-off path regresses nothing.

   Experimental (experimentalLayout === true):
   - Single right-edge handle (the corner handle is removed).
   - Handle is role="slider" with ARIA valuemin/max/now/text +
     arrow-key resize (Left/Right, Shift = fine, Alt = 0.5%).
   - During drag, ResizeHUD shows the live value + unit toggle
     (P = px, % = percent).
   - Unit defaults from the zone's flow mode: row/grid → %,
     stack → px.
   - A single snap guide line renders at the NEAREST snap point
     (25/33/50/66/75/100 %); when the pointer is within
     SNAP_PULL_PX of that point the width is magnetically
     pulled to it.
   - A SizeChipRail mounts above the block while it's selected.
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

/* ════════════════════════════════════════════════════════════
   Experimental single-handle resize + HUD + snap guide
   ════════════════════════════════════════════════════════════ */

interface ExperimentalResizeProps {
  zone: ZoneId;
  blockId: string;
  /** Current width from block.layout.width — used to seed aria
     valuenow and HUD fallbacks on first drag. */
  currentWidth: LayoutWidth | undefined;
  onWidth: (width: string) => void;
  minWidth?: number;
  maxWidth?: number;
  /** Zone flow mode — drives the default unit (stack → px, else %). */
  zoneMode: "stack" | "row" | "grid";
}

function ExperimentalResize({
  zone: _zone,
  blockId: _blockId,
  currentWidth,
  onWidth,
  minWidth,
  maxWidth,
  zoneMode,
}: ExperimentalResizeProps) {
  void _zone;
  void _blockId;

  /* Active unit during interaction. Can flip mid-drag via the
     HUD's unit toggle or window-level P / % keys. */
  const defaultUnit: "px" | "%" = zoneMode === "stack" ? "px" : "%";
  const [unit, setUnit] = useState<"px" | "%">(defaultUnit);

  /* Drag state: live width in px + containerWidth for % conversion. */
  const [dragState, setDragState] = useState<{
    widthPx: number;
    containerWidth: number;
    containerRect: DOMRect;
    snapPct: number | null;
  } | null>(null);

  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [liveMessage, setLiveMessage] = useState<string>("");

  const startRef = useRef<{ x: number; startWidth: number; containerWidth: number; containerRect: DOMRect } | null>(null);

  /* Seed unit from current width on mount / when the block
     changes so the HUD shows a sensible unit from the first
     pointer-down. */
  useEffect(() => {
    if (typeof currentWidth === "string") {
      if (currentWidth.endsWith("px")) {
        setUnit("px");
        return;
      }
      if (currentWidth.endsWith("%")) {
        setUnit("%");
        return;
      }
    }
    if (typeof currentWidth === "number") setUnit("px");
  }, [currentWidth]);

  /* Helper — compute width for emit + nearest-snap magnetic pull. */
  const applyWidth = useCallback(
    (rawPx: number, containerWidth: number, activeUnit: "px" | "%") => {
      const minPx = minWidth ?? 80;
      const maxPx = maxWidth ?? containerWidth;
      let nextPx = Math.max(minPx, Math.min(maxPx, rawPx));

      /* Find the nearest snap point (in %) and the px offset to it. */
      const pctRaw = (nextPx / containerWidth) * 100;
      let nearestPct = SNAP_POINTS_PCT[0];
      let bestDelta = Math.abs(pctRaw - nearestPct);
      for (const p of SNAP_POINTS_PCT) {
        const d = Math.abs(pctRaw - p);
        if (d < bestDelta) {
          bestDelta = d;
          nearestPct = p;
        }
      }
      /* Convert the SNAP_PULL_PX threshold to a percent window so
         the magnetic pull feels the same on any container width. */
      const pullPct = (SNAP_PULL_PX / containerWidth) * 100;
      let snappedPct: number | null = null;
      if (bestDelta <= pullPct) {
        snappedPct = nearestPct;
        nextPx = Math.max(minPx, Math.min(maxPx, (nearestPct / 100) * containerWidth));
      }

      const widthString = activeUnit === "px"
        ? `${Math.round(nextPx)}px`
        : `${Math.round((nextPx / containerWidth) * 100)}%`;

      return { nextPx, widthString, snapPct: snappedPct, nearestPct };
    },
    [minWidth, maxWidth],
  );

  /* ── Pointer drag ── */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const blockEl = (e.currentTarget as HTMLElement).closest(".canvas-block") as HTMLElement | null;
      const wrapperEl = blockEl?.parentElement as HTMLElement | null;
      const containerEl = wrapperEl?.closest(".zone-drop-container") as HTMLElement | null;
      const startWidth = wrapperEl?.getBoundingClientRect().width ?? 240;
      const containerWidth = containerEl?.clientWidth ?? 720;
      const containerRect = containerEl?.getBoundingClientRect() ?? new DOMRect(0, 0, containerWidth, 0);

      startRef.current = { x: e.clientX, startWidth, containerWidth, containerRect };
      setDragState({ widthPx: startWidth, containerWidth, containerRect, snapPct: null });
      setAnchorRect(blockEl?.getBoundingClientRect() ?? null);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current) return;
      const { x: startX, startWidth, containerWidth, containerRect } = startRef.current;
      const delta = e.clientX - startX;
      const rawPx = startWidth + delta;

      const { nextPx, widthString, snapPct } = applyWidth(rawPx, containerWidth, unit);
      onWidth(widthString);

      setDragState({ widthPx: nextPx, containerWidth, containerRect, snapPct });

      /* Update the anchor rect so HUD tracks the resized block's
         new top-right corner. */
      const blockEl = (e.currentTarget as HTMLElement).closest(".canvas-block") as HTMLElement | null;
      setAnchorRect(blockEl?.getBoundingClientRect() ?? null);
    },
    [applyWidth, onWidth, unit],
  );

  const handlePointerUp = useCallback(() => {
    startRef.current = null;
    setDragState(null);
    /* Keep anchorRect briefly so HUD can fade — simpler to just
       clear it immediately; HUD unmounts. */
    setAnchorRect(null);
  }, []);

  /* ── Keyboard resize (slider role) ── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

      e.preventDefault();

      const handleEl = e.currentTarget;
      const blockEl = handleEl.closest(".canvas-block") as HTMLElement | null;
      const wrapperEl = blockEl?.parentElement as HTMLElement | null;
      const containerEl = wrapperEl?.closest(".zone-drop-container") as HTMLElement | null;
      const startWidth = wrapperEl?.getBoundingClientRect().width ?? 240;
      const containerWidth = containerEl?.clientWidth ?? 720;

      const sign = e.key === "ArrowRight" ? 1 : -1;

      /* Step sizes:
         - Default: 8px or 2% (depending on active unit)
         - Shift:   1px or 0.5%
         - Alt:     0.5% (always %) */
      let deltaPx: number;
      let stepUnit: "px" | "%" = unit;
      if (e.altKey) {
        stepUnit = "%";
        deltaPx = (0.5 / 100) * containerWidth;
      } else if (e.shiftKey) {
        deltaPx = unit === "px" ? 1 : (0.5 / 100) * containerWidth;
      } else {
        deltaPx = unit === "px" ? 8 : (2 / 100) * containerWidth;
      }

      const nextRaw = startWidth + sign * deltaPx;
      const { nextPx, widthString } = applyWidth(nextRaw, containerWidth, stepUnit);
      onWidth(widthString);

      /* Announce new width in the active unit. */
      const announced = stepUnit === "px"
        ? `Width ${Math.round(nextPx)} pixels`
        : `Width ${Math.round((nextPx / containerWidth) * 100)} percent`;
      setLiveMessage(announced);
    },
    [applyWidth, onWidth, unit],
  );

  /* Compute aria-valuenow + valuetext from the current width token.
     Falls back to 100 / full-width when no explicit width is set. */
  const { valueNow, valueText, valueMin, valueMax } = (() => {
    /* Prefer a percent-based readout — it's the most portable
       announcement regardless of container width. */
    if (typeof currentWidth === "string") {
      if (currentWidth.endsWith("%")) {
        const n = parseFloat(currentWidth);
        return {
          valueNow: Number.isFinite(n) ? Math.round(n) : 100,
          valueText: `${Math.round(Number.isFinite(n) ? n : 100)} percent`,
          valueMin: 10,
          valueMax: 100,
        };
      }
      if (currentWidth.endsWith("px")) {
        const n = parseFloat(currentWidth);
        return {
          valueNow: Number.isFinite(n) ? Math.round(n) : 240,
          valueText: `${Math.round(Number.isFinite(n) ? n : 240)} pixels`,
          valueMin: minWidth ?? 80,
          valueMax: maxWidth ?? 2000,
        };
      }
    }
    if (typeof currentWidth === "number") {
      return {
        valueNow: Math.round(currentWidth),
        valueText: `${Math.round(currentWidth)} pixels`,
        valueMin: minWidth ?? 80,
        valueMax: maxWidth ?? 2000,
      };
    }
    /* fill / auto / undefined → report 100% */
    return { valueNow: 100, valueText: "100 percent", valueMin: 10, valueMax: 100 };
  })();

  /* HUD value (live during drag, derived from dragState). */
  const hudValue = dragState
    ? unit === "px"
      ? dragState.widthPx
      : (dragState.widthPx / dragState.containerWidth) * 100
    : valueNow;

  /* Snap guide info — only rendered during drag. */
  const snapGuide = dragState ? (() => {
    const rect = dragState.containerRect;
    const nearestPct = (() => {
      const pctRaw = (dragState.widthPx / dragState.containerWidth) * 100;
      let n = SNAP_POINTS_PCT[0];
      let best = Math.abs(pctRaw - n);
      for (const p of SNAP_POINTS_PCT) {
        const d = Math.abs(pctRaw - p);
        if (d < best) {
          best = d;
          n = p;
        }
      }
      return n;
    })();
    const x = rect.left + (nearestPct / 100) * rect.width;
    const snapped = dragState.snapPct === nearestPct;
    return { x, top: rect.top, height: rect.height, pct: nearestPct, snapped };
  })() : null;

  return (
    <>
      {/* Single right-edge handle. role="slider" for a11y. */}
      <div
        className="block-resize-handle block-resize-handle--experimental"
        role="slider"
        tabIndex={0}
        aria-orientation="horizontal"
        aria-label="Resize width"
        aria-valuemin={valueMin}
        aria-valuemax={valueMax}
        aria-valuenow={valueNow}
        aria-valuetext={valueText}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        title="Drag or use arrow keys to resize"
      >
        <div className="block-resize-grip" />
      </div>

      {/* Screen-reader live region for keyboard resize announcements. */}
      <span className="bc-sr-only" role="status" aria-live="polite">{liveMessage}</span>

      {/* HUD overlay — only during drag. Portalled to body so it
         escapes any overflow:hidden ancestor. */}
      {dragState && typeof document !== "undefined" && createPortal(
        <ResizeHUD
          value={hudValue}
          unit={unit}
          onUnitChange={setUnit}
          anchorRect={anchorRect}
          min={valueMin}
          max={valueMax}
        />,
        document.body,
      )}

      {/* Snap guide — only during drag. Portalled to body so it
         sits on top of everything else. */}
      {snapGuide && typeof document !== "undefined" && createPortal(
        <div
          className={`bc-snap-guide${snapGuide.snapped ? " is-snapped" : ""}`}
          style={{
            position: "fixed",
            left: snapGuide.x,
            top: snapGuide.top,
            height: snapGuide.height,
          }}
          aria-hidden="true"
        >
          <span className="bc-snap-guide__label">{`${snapGuide.pct}%`}</span>
        </div>,
        document.body,
      )}
    </>
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
  /** Current width token from block.layout.width — only consumed
     by the experimental flow (ARIA + HUD seeding). */
  currentWidth?: LayoutWidth;
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
  currentWidth,
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

  const experimentalLayout = useBuilder((s) => s.experimentalLayout);
  const zoneLayouts = useBuilder((s) => s.zoneLayouts);
  const zoneMode = zone ? (zoneLayouts[zone]?.mode ?? "row") : "row";

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cls = [
    "canvas-block",
    isDragging && "is-dragging",
    isSelected && "is-selected",
    compact && "zone-block-compact",
    experimentalLayout && "canvas-block--experimental",
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

  const resizableInExperimental = experimentalLayout && !!onWidthChange && !compact && !!zone;
  const resizableInProduction = !experimentalLayout && !!onColSpanChange && !compact;

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
          resize handles are the primary affordance now).
          Hidden in experimental mode — the size chip rail
          supersedes it. */}
      {onColSpanChange && !compact && !experimentalLayout && (
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

      {/* Size chip rail — experimental only, shown when selected. */}
      {experimentalLayout && isSelected && !compact && zone && onWidthChange && (
        <SizeChipRail zone={zone} blockId={id} currentWidth={currentWidth} />
      )}

      {children}

      {/* Production path: dual handles (right-edge px + corner percent). */}
      {resizableInProduction && (
        <>
          <ResizeHandle
            colSpan={colSpan}
            onResize={handleSpanChange}
            onWidth={handleWidthChange}
            minWidth={minPx}
            maxWidth={maxPx}
            mode="px"
          />
          <ResizeHandle
            colSpan={colSpan}
            onResize={handleSpanChange}
            onWidth={handleWidthChange}
            minWidth={minPx}
            maxWidth={maxPx}
            mode="percent"
          />
        </>
      )}

      {/* Experimental path: single right-edge handle + HUD +
          snap guide. Corner handle is removed. */}
      {resizableInExperimental && zone && (
        <ExperimentalResize
          zone={zone}
          blockId={id}
          currentWidth={currentWidth}
          onWidth={handleWidthChange}
          minWidth={minPx}
          maxWidth={maxPx}
          zoneMode={zoneMode}
        />
      )}
    </div>
  );
}
