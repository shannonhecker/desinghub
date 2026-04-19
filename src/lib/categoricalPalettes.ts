/**
 * Categorical colour palettes for charts, keyed by design system.
 *
 * Each DS gets a hand-picked 12-colour palette that:
 *   1. Uses the DS's accent + semantic tokens where they map cleanly.
 *   2. Fills in with DS-appropriate hues (teal/blue for Salt JPM,
 *      violet/purple for M3, brand-blue for Fluent, muted violet/
 *      aurora for ausos).
 *   3. Passes basic contrast checks on both dark and light canvases.
 *
 * The first 4 entries are the "primary quadrant" (accent, positive,
 * warning, negative) so basic charts stay on-brand even when they
 * only draw 4 series. Extra colours round out the palette for rich
 * charts like heatmaps and stacked columns.
 *
 * Consumed by:
 *  - src/components/builder/SimulatedHighchart.tsx (palette fallback
 *    when a chart block doesn't specify its own seriesColors).
 *  - src/components/builder/ComponentLibrary.tsx (colour swatches in
 *    the chart inspector).
 *  - src/lib/chatSystem.ts (AI knows these token names for "use the
 *    DS's 3rd colour" kind of requests).
 */

import type { DesignSystem } from "@/store/useBuilder";

/** Named slots. Index 0-3 are semantic; 4-11 are "extra categorical". */
export const PALETTE_SLOT_NAMES = [
  "accent",
  "positive",
  "warning",
  "negative",
  "info",
  "violet",
  "pink",
  "cyan",
  "amber",
  "lime",
  "teal",
  "coral",
] as const;

export type PaletteSlotName = typeof PALETTE_SLOT_NAMES[number];

export const CATEGORICAL_PALETTES: Record<DesignSystem, string[]> = {
  /* Salt DS - J.P. Morgan: teal accent + utility semantics + blue family */
  salt: [
    "#1B7F9E", // accent teal
    "#2E7D32", // positive green
    "#E65100", // warning orange
    "#C62828", // negative red
    "#0277BD", // info blue
    "#6A4C93", // violet
    "#C2185B", // pink
    "#00838F", // cyan
    "#F9A825", // amber
    "#689F38", // lime
    "#00796B", // teal
    "#D84315", // coral
  ],
  /* Material 3 - Google: purple primary + Material palette */
  m3: [
    "#6750A4", // primary purple
    "#386A20", // positive
    "#E67E22", // warning
    "#B3261E", // negative (error)
    "#0B57D0", // info blue
    "#7D5260", // tertiary rose
    "#D63384", // pink
    "#0288D1", // cyan
    "#F9A825", // amber
    "#558B2F", // lime
    "#00796B", // teal
    "#EF6C00", // coral
  ],
  /* Fluent 2 - Microsoft: brand blue + Fluent palette */
  fluent: [
    "#0F6CBD", // brand blue
    "#107C10", // positive
    "#FFAA44", // warning
    "#D13438", // negative
    "#038387", // info teal
    "#8764B8", // violet
    "#E3008C", // magenta
    "#00B7C3", // cyan
    "#FFB900", // amber
    "#498205", // lime
    "#006D75", // teal
    "#CA5010", // coral
  ],
  /* ausos - proprietary: muted violet + aurora palette */
  ausos: [
    "#7E6BC4", // accent muted violet
    "#5AAE8C", // positive sage
    "#D4A574", // warning warm amber
    "#C4677E", // negative muted coral
    "#6B9DD4", // info steel blue
    "#9884D6", // secondary violet
    "#D683B1", // pink
    "#7CB8D4", // cyan
    "#D4C067", // amber
    "#8FBD6A", // lime
    "#66A9A3", // teal
    "#D47E5E", // coral
  ],
  /* Carbon - IBM: interactive blue + Carbon semantic support + IBM
     data viz accents. Slot 0 is IBM's signature blue60 (#0f62fe);
     status slots (positive/warning/negative) use Carbon's published
     support-* palette. Additional slots draw from Carbon's data-viz
     categorical palette to stay on-brand for charts. */
  carbon: [
    "#0f62fe", // accent - IBM blue60
    "#24a148", // positive - green50
    "#f1c21b", // warning - yellow30
    "#da1e28", // negative - red60
    "#0043ce", // info - blue70
    "#8a3ffc", // violet - purple60
    "#d12771", // pink - magenta60
    "#1192e8", // cyan - cyan50
    "#ff7eb6", // amber-substitute - magenta40 (Carbon data-viz)
    "#42be65", // lime - green40
    "#007d79", // teal - teal60
    "#fa4d56", // coral - red50
  ],
};

/** Return the DS's palette array or Salt's as a safe fallback. */
export function getPalette(ds: DesignSystem | undefined | null): string[] {
  if (!ds || !CATEGORICAL_PALETTES[ds]) return CATEGORICAL_PALETTES.salt;
  return CATEGORICAL_PALETTES[ds];
}

/** Lookup a colour by its slot name (used by AI / Claude when it
 *  emits references like {slot: "positive"} rather than raw hex). */
export function colorForSlot(ds: DesignSystem, slot: PaletteSlotName): string {
  const palette = getPalette(ds);
  const idx = PALETTE_SLOT_NAMES.indexOf(slot);
  return palette[idx >= 0 ? idx : 0];
}

/** Human-readable labels for the 12 slots - used as <abbr> text /
 *  tooltip on the inspector swatches. */
export const PALETTE_SLOT_LABELS: Record<PaletteSlotName, string> = {
  accent: "Accent",
  positive: "Positive",
  warning: "Warning",
  negative: "Negative",
  info: "Info",
  violet: "Violet",
  pink: "Pink",
  cyan: "Cyan",
  amber: "Amber",
  lime: "Lime",
  teal: "Teal",
  coral: "Coral",
};
