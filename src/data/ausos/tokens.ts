/**
 * ausos design tokens — motion, opacity, radius, shadow.
 *
 * This is a token-definition file. Raw ms / px / rgba literals live here
 * because they define the scale; consumers must reference them via the
 * `--a-*` CSS vars injected by ausos-documentation.jsx:buildCSS.
 *
 * File is exempt from no-hardcoded-tokens via filename suffix `.ts`
 * under src/data/*\/tokens.ts — see docs/TOKENS.md § Intentional literals.
 */

import {
  DURATION_MS,
  EASING,
  OPACITY,
  BORDER_WIDTH_PX,
} from '../_shared/primitives';

/* ── MOTION ────────────────────────────────────────────────────────────
   Mirrors ausos' existing cadence (150 / 250 / 350) plus two house-style
   easing curves. The 250 / 350 rungs are ausos-specific and don't appear
   in _shared/primitives — they express the DS's lazier, floatier feel. */
export const AUSOS_MOTION = {
  durations: {
    fast: `${DURATION_MS.short}ms`, // 150ms — rapid micro-interactions
    mid: '250ms',                    // ausos-specific — default UI transition
    slow: '350ms',                    // ausos-specific — emphasis + orchestration
  },
  easings: {
    standard: 'cubic-bezier(0.22, 0.68, 0, 1)', // house curve — slight overshoot
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // springy, for toggle states
    // also re-expose the shared standard/emphasized for consistency with cross-DS patterns:
    shared: EASING.standard,
  },
} as const;

/* ── OPACITY (glass layers) ────────────────────────────────────────────
   ausos' signature glassmorphism uses translucent white-on-surface in
   dark mode and translucent white-on-lavender in light mode. The NUMERIC
   opacity levels below define the semantic ladder; the theme object
   composes them with the mode's base color to produce the final rgba.
   Consumers that want programmatic control use var(--a-opacity-glass-NN)
   directly; consumers that want pre-composed strings use var(--a-surface-*). */
export const AUSOS_OPACITY = {
  dark: {
    'glass-01': OPACITY[4] + OPACITY[4], // 0.08 — placeholder semantic: subtlest layer
    'glass-02': OPACITY[12],              // 0.12 — raised / hover
    'glass-03': OPACITY[16],              // 0.16 — active
    'glass-04': OPACITY[24],              // 0.24 — emphasized
  },
  light: {
    'glass-01': OPACITY[72],              // 0.72 — subtlest layer (mostly opaque white)
    'glass-02': OPACITY[87],              // 0.87 — raised / hover (approx 0.85 in theme)
    'glass-03': OPACITY[87] + 0.08,       // 0.95 — active (rendered as 0.95)
    'glass-04': OPACITY[100],             // 1.00 — emphasized (solid)
  },
  // State-specific opacities (mode-agnostic — applied as opacity: prop)
  disabled: OPACITY[38],
  'inset-highlight-dark': OPACITY[4],
  'inset-highlight-light': OPACITY[72],
} as const;

/* ── RADIUS ────────────────────────────────────────────────────────────
   ausos uses soft, generous corner radii to reinforce the glass metaphor.
   Values match the inline usages across the existing CSS:
     2, 4, 5, 8, 10, 12, 14, 16, 20, 10000 (pill). */
export const AUSOS_RADIUS = {
  none: '0px',
  xs: '2px',
  sm: '4px',
  'sm-plus': '5px', // used for checkbox/radio micro-scale
  md: '8px',
  'md-plus': '10px',
  lg: '12px',
  'lg-plus': '14px',
  xl: '16px',
  '2xl': '20px',
  full: '9999px',
} as const;

/* ── SHADOW (opt-in, per Q2) ────────────────────────────────────────────
   ausos' identity is backdrop-filter blur — drop shadows are intentionally
   understated. Q2 (2026-04-22) approved exposing --a-shadow-* as opt-in
   escape hatches for parity with Salt/M3/Fluent/Carbon. Use sparingly.

   Values are MODE-DEPENDENT — theme object holds composed strings and
   buildCSS injects them as CSS vars for the active mode. */
export const AUSOS_SHADOW = {
  dark: {
    sm: '0 2px 8px rgba(0,0,0,0.2)',
    md: '0 4px 16px rgba(0,0,0,0.3)',    // matches existing T.shadow
    lg: '0 8px 32px rgba(0,0,0,0.4)',    // matches existing T.shadowLg
  },
  light: {
    sm: '0 1px 4px rgba(100,60,180,0.04)',
    md: '0 2px 8px rgba(100,60,180,0.06), 0 8px 24px rgba(100,60,180,0.04)',   // matches T.shadow
    lg: '0 4px 12px rgba(100,60,180,0.08), 0 12px 36px rgba(100,60,180,0.06)', // matches T.shadowLg
  },
} as const;

/* ── BORDER WIDTH ──────────────────────────────────────────────────────
   Re-expose shared primitives under --a-border-* via buildCSS. */
export const AUSOS_BORDER = {
  hair: `${BORDER_WIDTH_PX.hair}px`,
  thin: `${BORDER_WIDTH_PX.thin}px`,
  thick: `${BORDER_WIDTH_PX.thick}px`,
  focus: `${BORDER_WIDTH_PX.focus}px`,
} as const;

/* ── CSS-var injection helper ──────────────────────────────────────────
   Returns the `:root` block body (without braces) expressing all ausos
   tokens for the given mode as CSS custom properties. Called from
   buildCSS(T) in ausos-documentation.jsx. */
export function ausosTokenVars(mode: 'dark' | 'light'): string {
  const op = AUSOS_OPACITY[mode];
  const sh = AUSOS_SHADOW[mode];
  const m = AUSOS_MOTION;
  const r = AUSOS_RADIUS;
  const b = AUSOS_BORDER;
  return [
    `--a-dur-fast: ${m.durations.fast};`,
    `--a-dur-mid: ${m.durations.mid};`,
    `--a-dur-slow: ${m.durations.slow};`,
    `--a-ease: ${m.easings.standard};`,
    `--a-ease-bounce: ${m.easings.bounce};`,
    `--a-opacity-glass-01: ${op['glass-01']};`,
    `--a-opacity-glass-02: ${op['glass-02']};`,
    `--a-opacity-glass-03: ${op['glass-03']};`,
    `--a-opacity-glass-04: ${op['glass-04']};`,
    `--a-opacity-disabled: ${AUSOS_OPACITY.disabled};`,
    `--a-radius-none: ${r.none};`,
    `--a-radius-xs: ${r.xs};`,
    `--a-radius-sm: ${r.sm};`,
    `--a-radius-md: ${r.md};`,
    `--a-radius-lg: ${r.lg};`,
    `--a-radius-xl: ${r.xl};`,
    `--a-radius-2xl: ${r['2xl']};`,
    `--a-radius-full: ${r.full};`,
    `--a-shadow-sm: ${sh.sm};`,
    `--a-shadow-md: ${sh.md};`,
    `--a-shadow-lg: ${sh.lg};`,
    `--a-border-hair: ${b.hair};`,
    `--a-border-thin: ${b.thin};`,
    `--a-border-thick: ${b.thick};`,
    `--a-border-focus: ${b.focus};`,
  ].join(' ');
}

/* ── Re-export types for consumers ─────────────────────────────────────── */
export type AusosDurationKey = keyof typeof AUSOS_MOTION.durations;
export type AusosRadiusKey = keyof typeof AUSOS_RADIUS;
export type AusosShadowKey = keyof typeof AUSOS_SHADOW.dark;
export type AusosGlassKey = keyof typeof AUSOS_OPACITY.dark;
