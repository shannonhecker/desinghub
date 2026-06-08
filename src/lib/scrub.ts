/* ════════════════════════════════════════════════════════════
   Scrubbable NumberField — pure scrub math (P6, Figma parity).
   ════════════════════════════════════════════════════════════
   Side-effect-free core shared by the inspector drag gesture and
   its keyboard path. Kept pure so it can be unit-tested directly
   (the house convention for layout/export math) while the React
   plumbing in ScrubNumberField stays a thin shell.

   Convention note: the on-canvas ExperimentalResize keyboard uses
   Shift = FINE (1px) because its base step is already coarse (8px).
   A scrub's base step is 1, so there is nothing finer — Shift here
   means COARSE (×10), matching Figma's inspector-scrub behaviour.
   Both surfaces therefore treat Shift as "the other granularity".
   ════════════════════════════════════════════════════════════ */

/** Multiplier applied to the step when Shift is held (Figma coarse scrub). */
export const SCRUB_COARSE_MULTIPLIER = 10;

export interface ScrubOptions {
  /** Current numeric value the scrub starts from. */
  start: number;
  /** Signed movement: pixels dragged (pointer) or ±1 per keypress (keyboard). */
  units: number;
  /** Value change per unit of movement. Defaults to 1. */
  step?: number;
  /** Shift held → coarse ×SCRUB_COARSE_MULTIPLIER step. */
  coarse?: boolean;
  /** Inclusive lower bound. */
  min?: number;
  /** Inclusive upper bound. */
  max?: number;
}

/** next = clamp(round(start + units · step · (coarse ? 10 : 1))).
   Rounds to an integer — every field this drives (px, %, columns,
   margin, gap, padding) is integer-valued. */
export function applyScrubDelta({
  start,
  units,
  step = 1,
  coarse = false,
  min,
  max,
}: ScrubOptions): number {
  const multiplier = coarse ? SCRUB_COARSE_MULTIPLIER : 1;
  let next = Math.round(start + units * step * multiplier);
  if (typeof min === "number") next = Math.max(min, next);
  if (typeof max === "number") next = Math.min(max, next);
  return next;
}
