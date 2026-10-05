"use client";

/* ════════════════════════════════════════════════════════════
   ScrubNumberField (P6, Figma parity) — a numeric inspector field
   whose label / glyph is a drag-to-scrub handle.
   ════════════════════════════════════════════════════════════
   Why a component (not a hook): the inspector's gap/padding fields
   render inside `.map()` and conditional (linked / split) branches
   where React forbids conditional hook calls — so the scrub gesture
   has to live in something map-able. This wraps the pure
   `applyScrubDelta` math (unit-tested in lib/scrub) in the DOM
   shapes the inspector needs, while keeping a real focusable
   <input type=number> as the keyboard + screen-reader surface so
   there is no a11y regression versus the plain inputs it replaces.

   Interaction rules (2026-10-05 inspector redesign):
     - Typed values apply live while inside [min, max]; a value outside
       the range shows a plain inline line and is clamped when the
       field is left. An empty field leaves the value unchanged.
     - A focused field is one undo step: a history transaction opens on
       focus and closes on blur, so live typing never fills the past
       stack. A scrub is one step per drag.
     - Escape leaves the field (blur) and stops there; the builder's
       own Escape (clear selection) is not reached from inside a field.

   It deliberately does NOT touch the on-canvas ExperimentalResize
   gesture (which has its own snap/hysteresis machinery) — that
   consolidation is a later, riskier follow-up.
   ════════════════════════════════════════════════════════════ */

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { applyScrubDelta } from "@/lib/scrub";
import { beginHistoryTransaction } from "@/lib/builderHistory";

type ScrubLayout = "stacked" | "cell" | "inline" | "bare";

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
  /** Handle layout: stacked label above input, per-side cell glyph, inline
     glyph, or a bare input (no handle; the caller labels it). */
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
  /** id for the input, so an outside <label htmlFor> can name it. */
  id?: string;
}

const toNumber = (v: string | number): number => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

/** Plain copy for a value outside the field's range. */
export function rangeMessage(min: number | undefined, max: number | undefined): string {
  if (min !== undefined && max !== undefined) return `Keep this between ${min} and ${max}`;
  if (min !== undefined) return `Keep this at ${min} or more`;
  if (max !== undefined) return `Keep this at ${max} or less`;
  return "";
}

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
  id,
}: ScrubNumberFieldProps) {
  const hintId = useId();
  /* Baseline captured at pointerdown so the whole drag is measured from one
     origin, not accumulated per frame. The drag is one history transaction. */
  const startRef = useRef<{ x: number; start: number } | null>(null);
  const endGestureRef = useRef<(() => void) | null>(null);
  /* A focused field is one undo step. */
  const endFocusRef = useRef<(() => void) | null>(null);
  useEffect(() => () => { endFocusRef.current?.(); endGestureRef.current?.(); }, []);

  /* Draft while typing, so an out-of-range or partial entry shows as typed
     and is clamped only on blur. */
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);

  const inRange = (n: number) => (min === undefined || n >= min) && (max === undefined || n <= max);
  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));

  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      /* Suppress dnd-kit activation + text selection so the gesture is ours. */
      e.preventDefault();
      e.stopPropagation();
      startRef.current = { x: e.clientX, start: toNumber(value) };
      endGestureRef.current?.();
      endGestureRef.current = beginHistoryTransaction();
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
    endGestureRef.current?.();
    endGestureRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* capture may already be released (e.g. pointercancel) */
    }
  }, []);

  /* Keyboard parity: ArrowUp/Down step the value, Shift = coarse ×10.
     Driven by the same pure math so keyboard and pointer never diverge.
     Escape leaves the field and does not reach the builder's own Escape. */
  const onInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.blur();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        e.currentTarget.blur();
        return;
      }
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
      setDraft(null);
      setInvalid(false);
      onValueChange(String(next));
    },
    [step, min, max, onValueChange],
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setDraft("");
      setInvalid(false);
      onValueChange("");
      return;
    }
    const n = parseFloat(raw);
    if (Number.isFinite(n) && inRange(n)) {
      setDraft(null);
      setInvalid(false);
      onValueChange(raw);
    } else {
      setDraft(raw);
      setInvalid(Number.isFinite(n));
    }
  };

  const onFocus = () => {
    endFocusRef.current?.();
    endFocusRef.current = beginHistoryTransaction();
  };

  const onBlur = () => {
    if (draft !== null && draft !== "") {
      const n = parseFloat(draft);
      if (Number.isFinite(n)) onValueChange(String(clamp(n)));
    }
    setDraft(null);
    setInvalid(false);
    endFocusRef.current?.();
    endFocusRef.current = null;
  };

  const handleEvents = {
    onPointerDown: onHandlePointerDown,
    onPointerMove: onHandlePointerMove,
    onPointerUp: onHandlePointerUp,
    onPointerCancel: onHandlePointerUp,
  };

  const message = invalid ? rangeMessage(min, max) : "";
  const input = (
    <input
      id={id}
      type="number"
      className={`inspector-input${inputClassName ? ` ${inputClassName}` : ""}`}
      value={draft ?? value}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      aria-label={ariaLabel ?? label}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? hintId : undefined}
      onChange={onChange}
      onKeyDown={onInputKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
  const hint = invalid ? (
    <p id={hintId} className="inspector-field-hint is-invalid" role="status">{message}</p>
  ) : null;

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
      <>
        <span className="inspector-scrub-inline">
          <span className="inspector-pad-side inspector-scrub-handle" aria-hidden="true" {...handleEvents}>
            {glyph}
          </span>
          {input}
        </span>
        {hint}
      </>
    );
  }

  if (layout === "bare") {
    return (
      <>
        {input}
        {hint}
      </>
    );
  }

  /* stacked (default): block label above the input; the label is the handle. */
  return (
    <>
      <span className="inspector-field-label inspector-scrub-handle" aria-hidden="true" {...handleEvents}>
        {label}
      </span>
      {input}
      {hint}
    </>
  );
}
