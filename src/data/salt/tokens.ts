/**
 * Salt DS (J.P. Morgan) design tokens.
 *
 * Per Q3 (2026-04-22): ideally pulled from `node_modules/@salt-ds/theme/
 * theme-next.css`. As of this phase @salt-ds/theme is not installed in
 * the project (see `npm ls @salt-ds/theme` — empty). Values here mirror
 * the current Salt renderer implementation, which was originally seeded
 * from the Salt spec. If @salt-ds/theme gets added later, this file
 * should be reconciled via a follow-up PR that reads the exact upstream
 * CSS vars (pin the @salt-ds/theme version in package.json when doing so).
 *
 * Salt naming convention uses "characteristic" tokens — actionable,
 * navigable, editable — that describe intent rather than appearance. This
 * file exposes the primitive ladder; the characteristic layer lives in
 * salt-documentation.jsx where components apply them.
 *
 * Token-definition file — exempt from no-hardcoded-tokens via filename.
 */

import { DURATION_MS, BORDER_WIDTH_PX } from '../_shared/primitives';

/* ── MOTION ─────────────────────────────────────────────────────────────
   Salt's PUBLIC spec has 4 semantic durations: instant (0ms),
   perceptible (300ms), notable (1000ms), cutoff (10000ms). These
   describe "when does the user notice?" — not micro-interaction timing.

   The renderer also uses short-form durations (150 / 200 / 300) for
   CSS transitions. Both surfaces are exposed so components can pick
   the intent that matches. */
export const SALT_MOTION = {
  // Semantic spec durations
  spec: {
    instant: '0ms',
    perceptible: `${DURATION_MS.long}ms`, // 300ms
    notable: '1000ms',                     // Salt-specific
    cutoff: '10000ms',                     // Salt-specific
  },
  // Short-form durations (renderer use)
  durations: {
    fast: `${DURATION_MS.short}ms`,   // 150ms
    normal: `${DURATION_MS.medium}ms`, // 200ms
    slow: `${DURATION_MS.long}ms`,     // 300ms
  },
  easings: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)', // matches --ease in current buildCSS
  },
} as const;

/* ── CURVE (Salt's radius scale) ────────────────────────────────────────
   Salt uses "curve" as the spec name (not radius). Scale from Salt
   density-map values: high 3, medium 4, low 6, touch 8. Plus pill. */
export const SALT_CURVE = {
  none: '0',
  '100': '3px',  // high density
  '200': '4px',  // medium (default)
  '300': '6px',  // low
  '400': '8px',  // touch
  pill: '10000px',
} as const;

/* ── ELEVATION (Salt shadow levels) ─────────────────────────────────────
   Salt spec: 5 elevation levels, with dark mode shadows ~3–5× stronger
   than light mode (per CLAUDE.md guidance).
   Composed from the theme's shadow/shadowMed/shadowHigh rgba tuples. */
function elev(shadow: string, shadowMed: string, shadowHigh: string) {
  return {
    low: `0 1px 2px ${shadow}`,
    medium: `0 2px 6px ${shadowMed}`,
    high: `0 4px 12px ${shadowHigh}`,
    overlay: `0 8px 24px ${shadowHigh}`,
    popover: `0 2px 6px ${shadowMed}`,
  } as const;
}

export const SALT_ELEVATION = {
  light: elev('rgba(0,0,0,0.10)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.20)'),
  dark: elev('rgba(0,0,0,0.50)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.65)'),
} as const;

/* ── BORDER WIDTH ───────────────────────────────────────────────────── */
export const SALT_BORDER = {
  thin: `${BORDER_WIDTH_PX.thin}px`,
  thick: `${BORDER_WIDTH_PX.thick}px`,
  focus: `${BORDER_WIDTH_PX.focus}px`,
} as const;

/* ── TYPE (partial — awaiting upstream reconcile) ───────────────────────
   Current renderer derives font-size per density (DENSITY_MAP.fs:
   11/12/13/14). Salt's actual type scale has characteristic names
   (actionable-primary, navigable, editable) tied to density — which
   requires @salt-ds/theme to reflect accurately.
   This partial set exposes the density font-size ladder for now. */
export const SALT_TYPE = {
  // Density-mapped text sizes
  'size-high': '11px',
  'size-medium': '12px',
  'size-low': '13px',
  'size-touch': '14px',
  // Header scale (pulled from DENSITY_MAP.h1)
  'size-h1-high': '16px',
  'size-h1-medium': '18px',
  'size-h1-low': '20px',
  'size-h1-touch': '24px',
  // Weight intents
  'weight-regular': 400,
  'weight-semibold': 600,
  'weight-bold': 700,
} as const;

/* ── CSS-var emitters ──────────────────────────────────────────────────
   Mode-aware. Called from buildCSS to declare tokens in :root. */
export function saltTokenVars(mode: 'light' | 'dark'): string {
  const e = SALT_ELEVATION[mode];
  const m = SALT_MOTION;
  const c = SALT_CURVE;
  const b = SALT_BORDER;
  return [
    // Motion — durations (both spec + short-form)
    `--salt-dur-spec-instant: ${m.spec.instant};`,
    `--salt-dur-spec-perceptible: ${m.spec.perceptible};`,
    `--salt-dur-spec-notable: ${m.spec.notable};`,
    `--salt-dur-spec-cutoff: ${m.spec.cutoff};`,
    `--salt-dur-fast: ${m.durations.fast};`,
    `--salt-dur-normal: ${m.durations.normal};`,
    `--salt-dur-slow: ${m.durations.slow};`,
    `--salt-ease: ${m.easings.standard};`,
    // Legacy short names already in use by buildCSS
    `--dur-fast: ${m.durations.fast};`,
    `--dur-norm: ${m.durations.normal};`,
    `--dur-slow: ${m.durations.slow};`,
    `--ease: ${m.easings.standard};`,
    // Curve (radius)
    `--salt-curve-none: ${c.none};`,
    `--salt-curve-100: ${c['100']};`,
    `--salt-curve-200: ${c['200']};`,
    `--salt-curve-300: ${c['300']};`,
    `--salt-curve-400: ${c['400']};`,
    `--salt-curve-pill: ${c.pill};`,
    // Elevation
    `--salt-elev-low: ${e.low};`,
    `--salt-elev-medium: ${e.medium};`,
    `--salt-elev-high: ${e.high};`,
    `--salt-elev-overlay: ${e.overlay};`,
    `--salt-elev-popover: ${e.popover};`,
    // Border
    `--salt-border-thin: ${b.thin};`,
    `--salt-border-thick: ${b.thick};`,
    `--salt-border-focus: ${b.focus};`,
  ].join(' ');
}

/* ── Types ───────────────────────────────────────────────────────────── */
export type SaltCurveKey = keyof typeof SALT_CURVE;
export type SaltMotionKey = keyof typeof SALT_MOTION.durations;
export type SaltElevationKey = keyof typeof SALT_ELEVATION.light;
export type SaltTypeKey = keyof typeof SALT_TYPE;
