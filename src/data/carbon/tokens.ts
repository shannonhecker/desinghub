/**
 * Carbon design tokens — motion, type, radius, spacing, shadow.
 *
 * Carbon's system is already heavily tokenised via CSS custom properties
 * (`--cds-*`) emitted from `carbonBuildCSS`. This file re-surfaces the
 * canonical JS definitions so:
 *   - cross-DS consumers can import CARBON_MOTION etc. alongside
 *     M3_MOTION / FLUENT_MOTION (parity with other DS exports)
 *   - `carbonBuildCSS` consumes these constants instead of declaring
 *     tokens inline, so the spec stays in one place
 *
 * Values match the IBM Carbon Design System v11 spec
 *   (https://carbondesignsystem.com/guidelines/motion/overview,
 *    https://carbondesignsystem.com/elements/typography/overview).
 *
 * Token-definition file — exempt from no-hardcoded-tokens via filename.
 */

import { DURATION_MS, BORDER_WIDTH_PX } from '../_shared/primitives';

/* ── MOTION (Carbon spec) ────────────────────────────────────────────────
   Productive = interface-focused, fast & utilitarian.
   Expressive = moment-focused, slower & personality-bearing. */
export const CARBON_MOTION = {
  durations: {
    'fast-01': '70ms',                          // Carbon-specific — micro-acknowledge
    'fast-02': '110ms',                         // Carbon-specific — rapid feedback
    'moderate-01': `${DURATION_MS.short}ms`,    // 150ms — hover, selection
    'moderate-02': '240ms',                      // Carbon-specific — larger components
    'slow-01': `${DURATION_MS['x-long']}ms`,    // 400ms — orchestration
    'slow-02': '700ms',                          // Carbon-specific — emphasis reveals
  },
  easings: {
    'standard-productive': 'cubic-bezier(0.2, 0, 0.38, 0.9)',
    'standard-expressive': 'cubic-bezier(0.4, 0.14, 0.3, 1)',
    'entrance-productive': 'cubic-bezier(0, 0, 0.38, 0.9)',
    'entrance-expressive': 'cubic-bezier(0, 0, 0.3, 1)',
    'exit-productive': 'cubic-bezier(0.2, 0, 1, 0.9)',
    'exit-expressive': 'cubic-bezier(0.4, 0.14, 1, 1)',
  },
} as const;

/* ── TYPE (Carbon Plex Sans scale) ───────────────────────────────────────
   Canonical @carbon/type styles. Each token declares fontSize, fontWeight,
   lineHeight, letterSpacing. The .cds--type-* utility classes in
   carbonBuildCSS resolve to these values via CSS vars.

   Letter-spacing rule: +0.32px at 12px, +0.16px at 14px, 0 at 16+. */
const type = (fontSize: string, fontWeight: number, lineHeight: number, letterSpacing: string) =>
  ({ fontSize, fontWeight, lineHeight, letterSpacing } as const);

export const CARBON_TYPE = {
  // Body
  'body-01':          type('14px', 400, 1.42857, '0.16px'),
  'body-02':          type('16px', 400, 1.5,     '0'),
  'body-compact-01':  type('14px', 400, 1.28572, '0.16px'),
  'body-compact-02':  type('16px', 400, 1.375,   '0'),
  // Heading productive
  'heading-01':       type('14px', 600, 1.42857, '0.16px'),
  'heading-02':       type('16px', 600, 1.5,     '0'),
  'heading-03':       type('20px', 400, 1.4,     '0'),
  'heading-04':       type('28px', 400, 1.28572, '0'),
  'heading-05':       type('32px', 400, 1.25,    '0'),
  'heading-06':       type('42px', 300, 1.19,    '0'),
  'heading-07':       type('54px', 300, 1.19,    '0'),
  // Heading compact
  'heading-compact-01': type('14px', 600, 1.28572, '0.16px'),
  'heading-compact-02': type('16px', 600, 1.375,   '0'),
  'heading-compact-03': type('20px', 400, 1.4,     '0'),
  'heading-compact-04': type('28px', 400, 1.28572, '0'),
  'heading-compact-05': type('32px', 400, 1.25,    '0'),
  'heading-compact-06': type('42px', 300, 1.19,    '0'),
  'heading-compact-07': type('54px', 300, 1.19,    '0'),
  // Utility
  'label-01':         type('12px', 400, 1.33333, '0.32px'),
  'label-02':         type('14px', 400, 1.28572, '0.16px'),
  'helper-text-01':   type('12px', 400, 1.33333, '0.32px'),
  'helper-text-02':   type('14px', 400, 1.28572, '0.16px'),
  'code-01':          type('12px', 400, 1.33333, '0.32px'),
  'code-02':          type('14px', 400, 1.42857, '0.32px'),
  'legal-01':         type('12px', 400, 1.33333, '0.32px'),
  'legal-02':         type('14px', 400, 1.28572, '0.16px'),
} as const;

/* ── SPACING (Carbon 2px scale) ──────────────────────────────────────────
   Component-internal spacing. 2px-based ladder. NOT the same as the
   CARBON_DENSITY_MAP preview-chrome scale (4px) which lives in
   registry.ts. See CLAUDE.md § Carbon density note. */
export const CARBON_SPACING = {
  '01': '2px',
  '02': '4px',
  '03': '8px',
  '04': '12px',
  '05': '16px',
  '06': '24px',
  '07': '32px',
  '08': '40px',
  '09': '48px',
  '10': '64px',
  '11': '80px',
  '12': '96px',
  '13': '160px',
} as const;

/* ── RADIUS (Carbon is mostly flat) ─────────────────────────────────────
   Default is 0 across standard controls. Tiles optionally use 2px.
   Tags / pills use 16px (half the 32px default control height). */
export const CARBON_RADIUS = {
  '0': '0',
  '1': '2px',
  '2': '4px',
  '3': '8px',
  pill: '16px',
} as const;

/* ── SHADOW ──────────────────────────────────────────────────────────────
   Carbon uses two elevation levels — raised (cards, tiles) and floating
   (overlays, menus, toasts). Values come from the active theme dict's
   shadowRaised / shadowFloating keys; this export documents the shape. */
export const CARBON_SHADOW_KEYS = ['raised', 'floating'] as const;

/* ── BORDER WIDTH ────────────────────────────────────────────────────── */
export const CARBON_BORDER = {
  thin: `${BORDER_WIDTH_PX.thin}px`,
  thick: `${BORDER_WIDTH_PX.thick}px`,
  focus: `${BORDER_WIDTH_PX.focus}px`,
} as const;

/* ── CSS-var emitters ────────────────────────────────────────────────────
   Called from carbonBuildCSS to declare tokens in :root / per-theme block.
   Motion + type + spacing + radius are mode-agnostic; shadow is resolved
   from the theme dict (see themeTokens in carbon-documentation.jsx). */
export function carbonStaticTokenVars(): string {
  const lines: string[] = [];
  // Motion
  for (const [k, v] of Object.entries(CARBON_MOTION.durations)) lines.push(`--cds-duration-${k}: ${v};`);
  for (const [k, v] of Object.entries(CARBON_MOTION.easings)) lines.push(`--cds-motion-${k}: ${v};`);
  // Spacing
  for (const [k, v] of Object.entries(CARBON_SPACING)) lines.push(`--cds-spacing-${k}: ${v};`);
  // Radius
  lines.push(`--cds-radius-0: ${CARBON_RADIUS['0']};`);
  lines.push(`--cds-radius-1: ${CARBON_RADIUS['1']};`);
  lines.push(`--cds-radius-2: ${CARBON_RADIUS['2']};`);
  lines.push(`--cds-radius-3: ${CARBON_RADIUS['3']};`);
  lines.push(`--cds-radius-pill: ${CARBON_RADIUS.pill};`);
  // Border width
  for (const [k, v] of Object.entries(CARBON_BORDER)) lines.push(`--cds-border-width-${k}: ${v};`);
  // Type scale — emit --cds-type-fs-*, --cds-type-fw-*, --cds-type-lh-*, --cds-type-ls-*
  for (const [name, t] of Object.entries(CARBON_TYPE)) {
    lines.push(`--cds-type-fs-${name}: ${t.fontSize};`);
    lines.push(`--cds-type-fw-${name}: ${t.fontWeight};`);
    lines.push(`--cds-type-lh-${name}: ${t.lineHeight};`);
    lines.push(`--cds-type-ls-${name}: ${t.letterSpacing};`);
  }
  return lines.join(' ');
}

/** Emits `.cds--type-*` utility-class declarations using the CSS vars
 *  injected by carbonStaticTokenVars. Keeps Carbon's public class API
 *  stable — consumers can still write class="cds--type-body-01" and get
 *  the same resolved values, but the SOURCE OF TRUTH is now the tokens. */
export function carbonTypeClasses(fontVar: string): string {
  const rules: string[] = [];
  for (const name of Object.keys(CARBON_TYPE)) {
    const isCode = name.startsWith('code-');
    const family = isCode ? "'IBM Plex Mono', monospace" : fontVar;
    rules.push(
      `.cds--type-${name} { font-family: ${family}; font-size: var(--cds-type-fs-${name}); font-weight: var(--cds-type-fw-${name}); line-height: var(--cds-type-lh-${name}); letter-spacing: var(--cds-type-ls-${name}); }`
    );
  }
  return rules.join('\n    ');
}

/* ── Types ───────────────────────────────────────────────────────────── */
export type CarbonDurationKey = keyof typeof CARBON_MOTION.durations;
export type CarbonEasingKey = keyof typeof CARBON_MOTION.easings;
export type CarbonTypeKey = keyof typeof CARBON_TYPE;
export type CarbonSpacingKey = keyof typeof CARBON_SPACING;
export type CarbonRadiusKey = keyof typeof CARBON_RADIUS;
