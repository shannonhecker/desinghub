"use client";

/* ════════════════════════════════════════════════════════════
   ScrubNumberField (P6, Figma parity) — a numeric inspector field
   whose label / glyph is a drag-to-scrub handle.
   ════════════════════════════════════════════════════════════
   Why a component (not a hook): the inspector's gap/padding fields
   render inside `.map()` and conditional (linked / split) branches
   where React forbids conditional hook calls — so the scrub gesture
   has to live in something map-able. This wraps the pure
   `applyScrubDelta` math (unit-tested in lib/scrub) in the three DOM
   shapes the inspector needs, while keeping a real focusable
   <input type=number> as the keyboard + screen-reader surface so
   there is no a11y regression versus the plain inputs it replaces.

   It deliberately does NOT touch the on-canvas ExperimentalResize
   gesture (which has its own snap/hysteresis machinery) — that
   consolidation is a later, riskier follow-up.
   ════════════════════════════════════════════════════════════ */

import React, { useCallback, useRef } from "react";
import { applyScrubDelta } from "@/lib/scrub";

type ScrubLayout = "stacked" | "cell" | "inline";

export interface ScrubNumberFieldProps {
  /** Current value — string or number, mirroring the inspector's existing inputs. */
  value: string | number;
  /** Fired for typed entry AND scrub; receives the raw string the existing
     inspector handlers already expect (an empty string clears the field). */
  onValueChange: (next: string) => void;
  min?: number;
  max?: number;
  /** Value change per unit of pointer/keyboard movement. Defaults to 1. */
  step?: number;
  /** Handle layout: stacked label above input, per-side cell glyph, or inline glyph. */
  layout?: ScrubLayout;
  /** Visible handle text (stacked) — also the default accessible name. */
  label?: string;
  /** Compact handle glyph (cell / inline), e.g. "T" / "V" / "W". */
  glyph?: string;
  /** Accessible name for the input. Falls back to `label`. */
  ariaLabel?: string;
  placeholder?: string;
  /** Extra class on the <input> (e.g. inspector-pad-input). */
  inputClassName?: string;
  /** title on the cell wrapper (per-side hint). */
  cellTitle?: string;
}

const toNumber = (v: string | number): number => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

export function ScrubNumberField({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  layout = "stacked",
  label,
  glyph,
  ariaLabel,
  placeholder,
  inputClassName,
  cellTitle,
}: ScrubNumberFieldProps) {
  /* Baseline captured at pointerdown so the whole drag is measured from one
     origin, not accumulated per frame. The store's history is RAF-debounced,
     so the many onChange calls of a single drag coalesce into one undo step. */
  const startRef = useRef<{ x: number; start: number } | null>(null);

  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      /* Suppress dnd-kit activation + text selection so the gesture is ours. */
      e.preventDefault();
      e.stopPropagation();
      startRef.current = { x: e.clientX, start: toNumber(value) };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [value],
  );

  const onHandlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const s = startRef.current;
      if (!s) return;
      const next = applyScrubDelta({
        start: s.start,
        units: e.clientX - s.x,
        step,
        coarse: e.shiftKey,
        min,
        max,
      });
      onValueChange(String(next));
    },
    [step, min, max, onValueChange],
  );

  const onHandlePointerUp = useCallback((e: React.PointerEvent) => {
    startRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* capture may already be released (e.g. pointercancel) */
    }
  }, []);

  /* Keyboard parity: ArrowUp/Down step the value, Shift = coarse ×10.
     Driven by the same pure math so keyboard and pointer never diverge. */
  const onInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      const next = applyScrubDelta({
        start: toNumber(e.currentTarget.value),
        units: e.key === "ArrowUp" ? 1 : -1,
        step,
        coarse: e.shiftKey,
        min,
        max,
      });
      onValueChange(String(next));
    },
    [step, min, max, onValueChange],
  );

  const handleEvents = {
    onPointerDown: onHandlePointerDown,
    onPointerMove: onHandlePointerMove,
    onPointerUp: onHandlePointerUp,
    onPointerCancel: onHandlePointerUp,
  };

  const input = (
    <input
      type="number"
      className={`inspector-input${inputClassName ? ` ${inputClassName}` : ""}`}
      value={value}
      min={min}
      max={max}
      placeholder={placeholder}
      aria-label={ariaLabel ?? label}
      onChange={(e) => onValueChange(e.target.value)}
      onKeyDown={onInputKeyDown}
    />
  );

  if (layout === "cell") {
    return (
      <label className="inspector-pad-cell" title={cellTitle}>
        <span className="inspector-pad-side inspector-scrub-handle" aria-hidden="true" {...handleEvents}>
          {glyph}
        </span>
        {input}
      </label>
    );
  }

  if (layout === "inline") {
    return (
      <span className="inspector-scrub-inline">
        <span className="inspector-pad-side inspector-scrub-handle" aria-hidden="true" {...handleEvents}>
          {glyph}
        </span>
        {input}
      </span>
    );
  }

  /* stacked (default): block label above the input; the label is the handle. */
  return (
    <>
      <span className="inspector-field-label inspector-scrub-handle" aria-hidden="true" {...handleEvents}>
        {label}
      </span>
      {input}
    </>
  );
}
