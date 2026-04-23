/**
 * ausos.ai brand tokens.
 *
 * The brand layer sits above per-DS tokens (Salt / M3 / Fluent / Carbon /
 * ausos-DS-the-design-system) but below the five DS namespaces. These
 * values drive the landing page hero, marketing surfaces, and any future
 * ausos-owned chrome.
 *
 * Not to be confused with:
 *   - `AUSOS_*` tokens in src/data/ausos/tokens.ts — those are the
 *     *ausos DS* (one of the 5 supported DSes, a glassmorphism system).
 *   - `--bc-*` tokens in chrome-tokens.css — those are builder-chrome
 *     (tool UI around the canvas, intentionally isolated from DS tokens).
 *
 * This file is the brand for the PRODUCT (ausos.ai), not for a DS.
 *
 * Token-definition file — exempt from no-hardcoded-tokens via filename.
 */

/* ── Core brand palette ─────────────────────────────────────────────────
   Violet + soft-violet anchor, indigo background. The shader beam pulls
   its core + edge from here; the 3 CSS aurora blobs have their own
   legacy gradients still hardcoded in hero.css (to preserve the
   existing multi-hue look). Future: fold those into AURORA below. */
export const BRAND = {
  /* Background — shared by hero, landing, auth chrome. */
  'bg-deep': '#0b0e1a',

  /* Primary brand violet — M3 primary / ausos violet accent. Used for
     beam core, focus rings on landing, CTA accents. */
  'primary': '#6750a4',

  /* Soft violet — beam edge, softer state + hover tint. */
  'primary-soft': '#b490f5',

  /* Foreground on bg-deep. */
  'fg': '#ffffff',
  'fg-muted': 'rgba(255, 255, 255, 0.7)',
  'fg-disabled': 'rgba(255, 255, 255, 0.38)',
} as const;

/* ── Aurora blob palette ────────────────────────────────────────────────
   The three aurora blobs on the landing hero. Each blob is a radial
   gradient between an inner stop and an outer stop.
   Surface these so future compositions (OG images, social cards, splash
   screens) can pull identical values without hardcoding. */
export const AURORA = {
  'blob-1-inner': '#5ee7df', /* cyan */
  'blob-1-outer': '#3b82f6', /* blue */
  'blob-2-inner': '#b490f5', /* soft violet */
  'blob-2-outer': '#8b5cf6', /* violet */
  'blob-3-inner': '#f7a8c4', /* pink */
  'blob-3-outer': '#d946ef', /* magenta */
} as const;

/* ── Beam shader semantic tokens ─────────────────────────────────────────
   Aliases the WebGL beam shader reads via CSS vars. Expressed as
   semantic intents (core, edge, background) so the palette above can
   shift without re-wiring the shader. */
export const BEAM = {
  core: BRAND.primary,           /* center of the beam */
  edge: BRAND['primary-soft'],    /* outer halo */
  bg: BRAND['bg-deep'],           /* matches hero bg so the beam blends in */
} as const;

/* ── CSS-var emitter ─────────────────────────────────────────────────────
   Called from globals.css (or a dedicated brand.css import) to declare
   --dh-brand-*, --aurora-*, and --beam-color-* vars at :root. */
export function brandTokenVars(): string {
  const lines: string[] = [];

  /* Brand palette */
  for (const [k, v] of Object.entries(BRAND)) {
    lines.push(`--dh-brand-${k}: ${v};`);
  }

  /* Aurora blobs */
  for (const [k, v] of Object.entries(AURORA)) {
    lines.push(`--aurora-${k}: ${v};`);
  }

  /* Beam shader (semantic aliases → primitives) */
  lines.push(`--beam-color-a: ${BEAM.core};`);
  lines.push(`--beam-color-b: ${BEAM.edge};`);
  lines.push(`--beam-color-bg: ${BEAM.bg};`);

  return lines.join(' ');
}

/* ── Types ───────────────────────────────────────────────────────────── */
export type BrandKey = keyof typeof BRAND;
export type AuroraKey = keyof typeof AURORA;
export type BeamKey = keyof typeof BEAM;
