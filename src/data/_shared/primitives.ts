/**
 * Shared primitive values across all 5 design systems.
 *
 * Per Q1 (2026-04-22): unify raw values here; each DS re-aliases under its
 * spec-correct names (M3 short1..long2, Carbon productive/expressive,
 * Fluent durationFaster/Fast/Normal, Salt fast/normal/slow, ausos glass-*).
 *
 * Rules:
 *   - No semantic names in this file — only primitive values keyed by intent.
 *   - DS-specific character lives in the per-DS wrapper, not here.
 *   - Consumers MUST NOT import primitives directly into renderers; go through
 *     the per-DS alias (e.g. M3_MOTION, CARBON_MOTION) so the token-audit
 *     script sees DS-scoped CSS var names, not raw numbers.
 *
 * Reference: docs/TOKENS.md § Shared primitives.
 */

/* ── Motion primitives ─────────────────────────────────────────────────── */

/** Duration ladder (ms). Aligned to Material Expressive / Carbon spec overlap. */
export const DURATION_MS = {
  instant: 0,
  'x-fast': 50,
  fast: 100,
  short: 150,
  medium: 200,
  long: 300,
  'x-long': 400,
  'xx-long': 500,
} as const;

/** Easing curves. cubic-bezier values only; DS aliases pick their own name. */
export const EASING = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  emphasized: 'cubic-bezier(0.3, 0, 0, 1)',
  'emphasized-decelerate': 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  'emphasized-accelerate': 'cubic-bezier(0.3, 0, 0.8, 0.15)',
  linear: 'linear',
  // Carbon productive/expressive easing:
  productive: 'cubic-bezier(0.2, 0, 0.38, 0.9)',
  expressive: 'cubic-bezier(0.4, 0.14, 0.3, 1)',
} as const;

/* ── Opacity primitives ────────────────────────────────────────────────── */

/** Opacity values expressed as 0–1 decimals for direct use in rgba/opacity. */
export const OPACITY = {
  0: 0,
  4: 0.04,
  8: 0.08,
  12: 0.12,
  16: 0.16,
  24: 0.24,
  32: 0.32,
  38: 0.38,
  48: 0.48,
  60: 0.60,
  72: 0.72,
  87: 0.87,
  100: 1,
} as const;

/* ── Border-width primitives ───────────────────────────────────────────── */

/** Border widths in px. Carbon thick = 2; Salt focus = 2; hair = subpixel fallback. */
export const BORDER_WIDTH_PX = {
  hair: 0.5,
  thin: 1,
  thick: 2,
  focus: 2,
} as const;

/* ── Type weight primitives ────────────────────────────────────────────── */

/** Canonical CSS font-weight values. DS-specific weight maps alias these. */
export const FONT_WEIGHT = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

/* ── Line-height primitives ────────────────────────────────────────────── */

/** Line-height multipliers (unitless). */
export const LINE_HEIGHT = {
  tight: 1.2,
  normal: 1.5,
  loose: 1.75,
} as const;

/* ── Re-export types for consumers that need them ──────────────────────── */

export type DurationKey = keyof typeof DURATION_MS;
export type EasingKey = keyof typeof EASING;
export type OpacityKey = keyof typeof OPACITY;
export type BorderWidthKey = keyof typeof BORDER_WIDTH_PX;
export type FontWeightKey = keyof typeof FONT_WEIGHT;
export type LineHeightKey = keyof typeof LINE_HEIGHT;
