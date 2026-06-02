/**
 * uoaui design tokens — motion, opacity, radius, shadow.
 *
 * This is a token-definition file. Raw ms / px / rgba literals live here
 * because they define the scale; consumers must reference them via the
 * `--a-*` CSS vars injected by uoaui-documentation.jsx:buildCSS.
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
   Mirrors uoaui' existing cadence (150 / 250 / 350) plus two house-style
   easing curves. The 250 / 350 rungs are uoaui-specific and don't appear
   in _shared/primitives — they express the DS's lazier, floatier feel. */
export const UOAUI_MOTION = {
  durations: {
    fast: `${DURATION_MS.short}ms`, // 150ms — rapid micro-interactions
    mid: '250ms',                    // uoaui-specific — default UI transition
    slow: '350ms',                    // uoaui-specific — emphasis + orchestration
  },
  easings: {
    standard: 'cubic-bezier(0.22, 0.68, 0, 1)', // house curve — slight overshoot
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // springy, for toggle states
    // also re-expose the shared standard/emphasized for consistency with cross-DS patterns:
    shared: EASING.standard,
  },
} as const;

/* ── OPACITY (glass layers) ────────────────────────────────────────────
   uoaui' signature glassmorphism uses translucent white-on-surface in
   dark mode and translucent white-on-lavender in light mode. The NUMERIC
   opacity levels below define the semantic ladder; the theme object
   composes them with the mode's base color to produce the final rgba.
   Consumers that want programmatic control use var(--a-opacity-glass-NN)
   directly; consumers that want pre-composed strings use var(--a-surface-*). */
export const UOAUI_OPACITY = {
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
   uoaui uses soft, generous corner radii to reinforce the glass metaphor.
   Values match the inline usages across the existing CSS:
     2, 4, 5, 8, 10, 12, 14, 16, 20, 10000 (pill). */
export const UOAUI_RADIUS = {
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
   uoaui' identity is backdrop-filter blur — drop shadows are intentionally
   understated. Q2 (2026-04-22) approved exposing --a-shadow-* as opt-in
   escape hatches for parity with Salt/M3/Fluent/Carbon. Use sparingly.

   Values are MODE-DEPENDENT — theme object holds composed strings and
   buildCSS injects them as CSS vars for the active mode. */
export const UOAUI_SHADOW = {
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
export const UOAUI_BORDER = {
  hair: `${BORDER_WIDTH_PX.hair}px`,
  thin: `${BORDER_WIDTH_PX.thin}px`,
  thick: `${BORDER_WIDTH_PX.thick}px`,
  focus: `${BORDER_WIDTH_PX.focus}px`,
} as const;

/* ── LANDING / MARKETING SCHEME ────────────────────────────────────────
   The uoaui DS "Refined Aurora" scheme used by the marketing surfaces
   (landing + login). Kept SEPARATE from the component THEMES (dark/light)
   so promoting these values doesn't ripple into builder / preview / export
   rendering — owner decision 2026-06-07 ("new uoaui 'landing' scheme").

   This is the canonical source of record for the aurora palette + editorial
   type families. Emitted globally as `--a-landing-*` vars (see
   uoauiLandingSchemeVars + app/layout.tsx) so the .landing-southleft /
   conversion surfaces can alias their local --lsl-* layer onto the DS.

   Contrast (verified on #0A0E1A, 2026-06-07): accent 7.08:1, peach 10.87:1,
   teal 11.22:1, label-accent 4.71:1 — all clear WCAG AA. Brand vocabulary:
   Teal Input · Purple Compute · Peach Output · Midnight Canvas. */
export const UOAUI_LANDING = {
  // Midnight Canvas — background tiers
  bg:          '#0A0E1A',
  bgSoft:      '#131829',
  bgElevated:  '#1C2238',
  // Ink ladder — intentional white-alpha (aurora wash), not the DS solid-grey ladder
  fg:          'rgba(255, 255, 255, 0.92)',
  fgStrong:    '#FFFFFF',
  fgMuted:     'rgba(255, 255, 255, 0.65)',
  fgSubtle:    'rgba(255, 255, 255, 0.50)',
  rule:        'rgba(255, 255, 255, 0.10)',
  ruleStrong:  'rgba(255, 255, 255, 0.22)',
  // Purple Compute — primary marketing accent (text-grade violet, 7.08:1)
  accent:      '#A78BFA',
  accentHover: '#B89BFB',
  accentSoft:  'rgba(167, 139, 250, 0.18)',
  labelAccent: 'rgba(167, 139, 250, 0.78)',
  // Peach Output — secondary highlight
  peach:       '#F0B5A4',
  peachSoft:   'rgba(240, 181, 164, 0.18)',
  // Teal Input — tertiary signal
  teal:        '#3DDCC4',
  tealSoft:    'rgba(61, 220, 196, 0.16)',
  // Decorative hero-wash radial stops
  auroraCyan:  'rgba(130, 224, 255, 0.10)',
  auroraPale:  'rgba(175, 240, 255, 0.06)',
  // Editorial type families (resolve through next/font CSS vars)
  fontSans:    "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  fontDisplay: "var(--font-bricolage), var(--font-outfit), -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  fontMono:    "var(--font-ibm-plex-mono), ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
} as const;

/* Emit the landing scheme as `--a-landing-*` custom properties (`:root` body,
   no braces). Injected once, globally, by app/layout.tsx so marketing surfaces
   can alias --lsl-* onto var(--a-landing-*). */
export function uoauiLandingSchemeVars(): string {
  const L = UOAUI_LANDING;
  return [
    `--a-landing-bg: ${L.bg};`,
    `--a-landing-bg-soft: ${L.bgSoft};`,
    `--a-landing-bg-elevated: ${L.bgElevated};`,
    `--a-landing-fg: ${L.fg};`,
    `--a-landing-fg-strong: ${L.fgStrong};`,
    `--a-landing-fg-muted: ${L.fgMuted};`,
    `--a-landing-fg-subtle: ${L.fgSubtle};`,
    `--a-landing-rule: ${L.rule};`,
    `--a-landing-rule-strong: ${L.ruleStrong};`,
    `--a-landing-accent: ${L.accent};`,
    `--a-landing-accent-hover: ${L.accentHover};`,
    `--a-landing-accent-soft: ${L.accentSoft};`,
    `--a-landing-label-accent: ${L.labelAccent};`,
    `--a-landing-peach: ${L.peach};`,
    `--a-landing-peach-soft: ${L.peachSoft};`,
    `--a-landing-teal: ${L.teal};`,
    `--a-landing-teal-soft: ${L.tealSoft};`,
    `--a-landing-aurora-cyan: ${L.auroraCyan};`,
    `--a-landing-aurora-pale: ${L.auroraPale};`,
    `--a-landing-font-sans: ${L.fontSans};`,
    `--a-landing-font-display: ${L.fontDisplay};`,
    `--a-landing-font-mono: ${L.fontMono};`,
  ].join(' ');
}

/* ── CSS-var injection helper ──────────────────────────────────────────
   Returns the `:root` block body (without braces) expressing all uoaui
   tokens for the given mode as CSS custom properties. Called from
   buildCSS(T) in uoaui-documentation.jsx. */
export function uoauiTokenVars(mode: 'dark' | 'light'): string {
  const op = UOAUI_OPACITY[mode];
  const sh = UOAUI_SHADOW[mode];
  const m = UOAUI_MOTION;
  const r = UOAUI_RADIUS;
  const b = UOAUI_BORDER;
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
    `--a-opacity-disabled: ${UOAUI_OPACITY.disabled};`,
    `--a-radius-none: ${r.none};`,
    `--a-radius-xs: ${r.xs};`,
    `--a-radius-sm: ${r.sm};`,
    `--a-radius-sm-plus: ${r['sm-plus']};`,
    `--a-radius-md: ${r.md};`,
    `--a-radius-md-plus: ${r['md-plus']};`,
    `--a-radius-lg: ${r.lg};`,
    `--a-radius-lg-plus: ${r['lg-plus']};`,
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

/* ── Structure padding (S/M/L) ────────────────────────────────────────
   User-adjustable canvas chrome rhythm. Glass-aesthetic prefers
   slightly wider canvas margins than Salt's H/M/L base. */
import type { StructurePaddingScale } from "../_shared/structure";

export const UOAUI_STRUCTURE_PADDING: StructurePaddingScale = {
  small:  { canvas: 8,  zone: 6,  block: 6,  gap: 8  },
  medium: { canvas: 16, zone: 10, block: 10, gap: 12 },
  large:  { canvas: 24, zone: 14, block: 12, gap: 16 },
};

/* ── Re-export types for consumers ─────────────────────────────────────── */
export type UoauiDurationKey = keyof typeof UOAUI_MOTION.durations;
export type UoauiRadiusKey = keyof typeof UOAUI_RADIUS;
export type UoauiShadowKey = keyof typeof UOAUI_SHADOW.dark;
export type UoauiGlassKey = keyof typeof UOAUI_OPACITY.dark;
