/**
 * Fluent 2 design tokens — motion, radius, elevation, stroke width.
 *
 * Names mirror the Microsoft Fluent 2 spec
 *   (https://fluent2.microsoft.design/design-tokens).
 * CSS vars keep the existing `--f-*` prefix used throughout Design Hub.
 *
 * Token-definition file — exempt from no-hardcoded-tokens via filename.
 */

import {
  DURATION_MS,
  EASING,
  BORDER_WIDTH_PX,
} from '../_shared/primitives';

/* ── MOTION (Fluent 2 spec) ─────────────────────────────────────────────
   Durations ladder matches Microsoft spec: ultraFast → ultraSlow.
   Curves match the three canonical Fluent easing bands. */
export const FLUENT_MOTION = {
  durations: {
    ultraFast: `${DURATION_MS['x-fast']}ms`, // 50ms  — micro-tick
    faster: `${DURATION_MS.fast}ms`,          // 100ms — in-place icon changes
    fast: `${DURATION_MS.short}ms`,            // 150ms — control hover
    normal: `${DURATION_MS.medium}ms`,         // 200ms — spec default
    gentle: '250ms',                            // 250ms — Fluent-specific rung
    slow: `${DURATION_MS.long}ms`,             // 300ms — drawer / dialog in
    slower: `${DURATION_MS['x-long']}ms`,       // 400ms — multi-step reveal
    ultraSlow: `${DURATION_MS['xx-long']}ms`,   // 500ms — emphasis orchestration
  },
  curves: {
    // Spec bands: accelerate / decelerate / easy-ease (symmetric)
    accelerateMid: 'cubic-bezier(0.7, 0, 1, 0.5)',
    decelerateMid: 'cubic-bezier(0.1, 0.9, 0.2, 1)',
    easyEase: 'cubic-bezier(0.33, 0, 0.67, 1)',
    linear: EASING.linear,
  },
} as const;

/* ── RADIUS (Fluent 2 spec) ─────────────────────────────────────────────
   Scale: none / small / medium / large / xLarge / circular.
   Matches existing inline values in buildCSS:
     2 (xs), 3 (checkbox), 4 (sm), 6, 8 (md), 10 (switch), 12 (lg), 10000 (circ). */
export const FLUENT_RADIUS = {
  none: '0px',
  xs: '2px',      // progress, slider track
  '3xs': '3px',   // checkbox
  sm: '4px',      // buttons, inputs, tooltip, menu, messagebar
  md: '6px',      // SIZE_MAP small.cardRadius
  lg: '8px',      // cards, dialogs, SIZE_MAP medium/large cardRadius
  xl: '12px',     // oversized cards
  circular: '10000px', // pill-shaped (badge, avatar)
} as const;

/* ── ELEVATION / SHADOWS (Fluent 2 spec) ────────────────────────────────
   Elevation scale: shadow2, shadow4, shadow8, shadow16, shadow28, shadow64.
   Each mode has different ambient + key values (theme object defines
   `shadowAmbient` / `shadowKey` rgba tuples that we compose here).
   This lets the shadow VALUES stay mode-dependent while the NAMES stay
   mode-agnostic. */
function shadowDepth(ambient: string, key: string) {
  return {
    shadow2: `0 1px 2px ${key}, 0 0 2px ${ambient}`,
    shadow4: `0 2px 4px ${key}, 0 0 2px ${ambient}`,
    shadow8: `0 4px 8px ${key}, 0 0 2px ${ambient}`,
    shadow16: `0 8px 16px ${key}, 0 0 2px ${ambient}`,
    shadow28: `0 14px 28px ${key}, 0 0 8px ${ambient}`,
    shadow64: `0 32px 64px ${key}, 0 0 8px ${ambient}`,
  } as const;
}

export const FLUENT_SHADOW = {
  light: shadowDepth('rgba(0,0,0,0.12)', 'rgba(0,0,0,0.14)'),
  dark: shadowDepth('rgba(0,0,0,0.24)', 'rgba(0,0,0,0.28)'),
} as const;

/* ── STROKE WIDTH (Fluent 2 spec) ───────────────────────────────────────
   Microsoft spec names. */
export const FLUENT_STROKE_WIDTH = {
  thin: `${BORDER_WIDTH_PX.thin}px`,     // 1px — default borders
  thicker: `${BORDER_WIDTH_PX.thick}px`,  // 2px — input bottom border, focus ring
  thickest: '3px',                         // 3px — spinner rings, emphasis
} as const;

/* ── CSS-var injection ──────────────────────────────────────────────────
   Emits all Fluent tokens as `--f-*` declarations for :root. */
export function fluentTokenVars(mode: 'light' | 'dark'): string {
  const m = FLUENT_MOTION;
  const r = FLUENT_RADIUS;
  const s = FLUENT_SHADOW[mode];
  const sw = FLUENT_STROKE_WIDTH;
  return [
    `--f-dur-ultra-fast: ${m.durations.ultraFast};`,
    `--f-dur-faster: ${m.durations.faster};`,
    `--f-dur-fast: ${m.durations.fast};`,
    `--f-dur-normal: ${m.durations.normal};`,
    `--f-dur-gentle: ${m.durations.gentle};`,
    `--f-dur-slow: ${m.durations.slow};`,
    `--f-dur-slower: ${m.durations.slower};`,
    `--f-dur-ultra-slow: ${m.durations.ultraSlow};`,
    `--f-curve-accel-mid: ${m.curves.accelerateMid};`,
    `--f-curve-decel-mid: ${m.curves.decelerateMid};`,
    `--f-curve-easy-ease: ${m.curves.easyEase};`,
    `--f-curve-linear: ${m.curves.linear};`,
    `--f-radius-none: ${r.none};`,
    `--f-radius-xs: ${r.xs};`,
    `--f-radius-3xs: ${r['3xs']};`,
    `--f-radius-sm: ${r.sm};`,
    `--f-radius-md: ${r.md};`,
    `--f-radius-lg: ${r.lg};`,
    `--f-radius-xl: ${r.xl};`,
    `--f-radius-circular: ${r.circular};`,
    `--f-shadow-2: ${s.shadow2};`,
    `--f-shadow-4: ${s.shadow4};`,
    `--f-shadow-8: ${s.shadow8};`,
    `--f-shadow-16: ${s.shadow16};`,
    `--f-shadow-28: ${s.shadow28};`,
    `--f-shadow-64: ${s.shadow64};`,
    `--f-stroke-width-thin: ${sw.thin};`,
    `--f-stroke-width-thicker: ${sw.thicker};`,
    `--f-stroke-width-thickest: ${sw.thickest};`,
  ].join(' ');
}

/* ── Re-export types ──────────────────────────────────────────────────── */
export type FluentDurationKey = keyof typeof FLUENT_MOTION.durations;
export type FluentRadiusKey = keyof typeof FLUENT_RADIUS;
export type FluentShadowKey = keyof typeof FLUENT_SHADOW.light;
export type FluentStrokeKey = keyof typeof FLUENT_STROKE_WIDTH;
