/**
 * Material 3 design tokens — motion (re-exported), shape, type, border.
 *
 * M3_MOTION was added to m3-documentation.jsx in PR #12. This file pulls
 * it (and new M3_SHAPE / M3_TYPE / M3_BORDER exports) into one canonical
 * token surface that matches the Material 3 spec:
 *   https://m3.material.io/foundations/design-tokens
 *
 * Shape names use the M3 spec vocabulary (extra-small / small / medium /
 * large / extra-large / full) rather than T-shirt sizes.
 *
 * Token-definition file — exempt from no-hardcoded-tokens via filename.
 */

import { BORDER_WIDTH_PX } from '../_shared/primitives';

/* ── SHAPE (M3 spec) ────────────────────────────────────────────────────
   Canonical corner-radius scale. Extra-large is used by FAB and search
   bars. `full` resolves to a pill (height-capped by CSS). */
export const M3_SHAPE = {
  none: '0',
  'extra-small': '4px',
  small: '8px',
  medium: '12px',
  large: '16px',
  'extra-large': '28px',
  full: '9999px',
} as const;

/* ── TYPE (M3 spec) ─────────────────────────────────────────────────────
   Display / Headline / Title / Body / Label. Each has small/medium/large.
   Per M3 spec (Roboto Flex or Roboto):
     - displayLarge 57 / 400 / 64 / -0.25
     - headlineLarge 32 / 400 / 40 / 0
     - titleLarge   22 / 400 / 28 / 0
     - bodyLarge    16 / 400 / 24 / 0.5
     - labelLarge   14 / 500 / 20 / 0.1
   Full table: https://m3.material.io/styles/typography/type-scale-tokens */
const typeStyle = (fontSize: string, fontWeight: number, lineHeight: string, letterSpacing: string) =>
  ({ fontSize, fontWeight, lineHeight, letterSpacing } as const);

export const M3_TYPE = {
  'display-large':   typeStyle('57px', 400, '64px', '-0.25px'),
  'display-medium':  typeStyle('45px', 400, '52px', '0'),
  'display-small':   typeStyle('36px', 400, '44px', '0'),
  'headline-large':  typeStyle('32px', 400, '40px', '0'),
  'headline-medium': typeStyle('28px', 400, '36px', '0'),
  'headline-small':  typeStyle('24px', 400, '32px', '0'),
  'title-large':     typeStyle('22px', 400, '28px', '0'),
  'title-medium':    typeStyle('16px', 500, '24px', '0.15px'),
  'title-small':     typeStyle('14px', 500, '20px', '0.1px'),
  'body-large':      typeStyle('16px', 400, '24px', '0.5px'),
  'body-medium':     typeStyle('14px', 400, '20px', '0.25px'),
  'body-small':      typeStyle('12px', 400, '16px', '0.4px'),
  'label-large':     typeStyle('14px', 500, '20px', '0.1px'),
  'label-medium':    typeStyle('12px', 500, '16px', '0.5px'),
  'label-small':     typeStyle('11px', 500, '16px', '0.5px'),
} as const;

/* ── DENSITY (M3 density-offset model) ─────────────────────────────────
   M3 uses a density offset from 0 (default) to -3 or more. Each step
   subtracts 4dp from component heights. Design Hub exposes 0 / -2 / -4
   for the DensityTokens demo. */
export const M3_DENSITY = {
  default: { offset: 0, btnH: '40px', tfH: '56px', chipH: '32px', btnFs: '14px', tfFs: '16px', chipFs: '14px', btnPad: '0 24px', chipPad: '0 16px' },
  compact: { offset: -2, btnH: '36px', tfH: '48px', chipH: '28px', btnFs: '13px', tfFs: '14px', chipFs: '13px', btnPad: '0 20px', chipPad: '0 12px' },
  'extra-compact': { offset: -4, btnH: '32px', tfH: '40px', chipH: '24px', btnFs: '12px', tfFs: '13px', chipFs: '12px', btnPad: '0 16px', chipPad: '0 10px' },
} as const;

/* ── BORDER WIDTH ────────────────────────────────────────────────────── */
export const M3_BORDER = {
  thin: `${BORDER_WIDTH_PX.thin}px`,
  thick: `${BORDER_WIDTH_PX.thick}px`,
  focus: `${BORDER_WIDTH_PX.focus}px`,
} as const;

/* ── CSS-var emitter ──────────────────────────────────────────────────── */
export function m3ShapeVars(): string {
  return [
    `--m3-shape-none: ${M3_SHAPE.none};`,
    `--m3-shape-extra-small: ${M3_SHAPE['extra-small']};`,
    `--m3-shape-small: ${M3_SHAPE.small};`,
    `--m3-shape-medium: ${M3_SHAPE.medium};`,
    `--m3-shape-large: ${M3_SHAPE.large};`,
    `--m3-shape-extra-large: ${M3_SHAPE['extra-large']};`,
    `--m3-shape-full: ${M3_SHAPE.full};`,
    `--m3-border-thin: ${M3_BORDER.thin};`,
    `--m3-border-thick: ${M3_BORDER.thick};`,
    `--m3-border-focus: ${M3_BORDER.focus};`,
  ].join(' ');
}

/* ── Types ───────────────────────────────────────────────────────────── */
export type M3ShapeKey = keyof typeof M3_SHAPE;
export type M3TypeKey = keyof typeof M3_TYPE;
export type M3DensityKey = keyof typeof M3_DENSITY;
