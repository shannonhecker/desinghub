/* ══════════════════════════════════════════════════════════
   Carbon Design System (IBM) - documentation module.

   Mirrors the shape of salt/m3/fluent/ausos documentation files so
   registry.ts can wire it in with the same contract. Phase 1 ships
   minimal stubs so the registry compiles and Carbon is a selectable
   SystemId; Phase 2 fills in real themes, component demos, and
   preview renderers pulled from @carbon/react + @carbon/themes.

   Exports (contract with registry.ts):
   - CARBON_THEMES     - { [themeKey]: tokenDict } (4 themes: white, g10, g90, g100)
   - CARBON_COMPS      - list of { id, name, cat, desc, ... } entries
   - CARBON_CATS       - category list shown in the UI Kit sidebar
   - CARBON_FONT       - CSS font-family string for the active theme
   - carbonBuildCSS(t) - returns CSS variable block for the theme
   - CIcon             - generic icon component; stub in Phase 1
   - setCarbonT / getCarbonT        - module-level T ref for demos
   - getCarbonDemoComponent(id)     - returns a React.ComponentType
   - getCarbonPreviews()            - returns { [id]: ComponentType }
   - getCarbonDensityCSS(density)   - density scale overrides
   ══════════════════════════════════════════════════════════ */

import React from "react";

/* IBM Plex Sans (loaded via Google Fonts in layout.tsx during Phase 7). */
export const CARBON_FONT = "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif";

/* Token dictionaries. The four theme keys (white / g10 / g90 / g100)
   are Carbon's canonical theme names - don't rename without also
   updating CARBON_THEMES consumers in the store.

   Token shape mirrors the fields ThemeContext's `n()` helper expects:
   - bg / bg2 / bg3     : background surface ladder
   - fg / fg2 / fg3     : text foreground ladder (primary / secondary / placeholder)
   - accent / accentFg / accentWeak / accentText : interactive
   - border / borderStrong : divider + emphasized border
   - positive / warning / negative : status

   Phase 2 extends this with Carbon's complete token namespace (layer-01..03,
   field-01..03, interactive, focus, support-*, etc.) sourced directly from
   @carbon/themes. The fields below are the minimum that keeps the UI Kit
   header, sidebar, and generic preview chrome readable. */
const CARBON_BLUE_60 = "#0f62fe"; /* interactive brand - light themes */
const CARBON_BLUE_50 = "#4589ff"; /* interactive brand - dark themes */

export const CARBON_THEMES = {
  /* WHITE - default light theme; text on white canvas. */
  white: {
    bg: "#ffffff",        bg2: "#f4f4f4",        bg3: "#e0e0e0",
    fg: "#161616",        fg2: "#525252",        fg3: "#a8a8a8",
    accent: CARBON_BLUE_60, accentFg: "#ffffff", accentWeak: "rgba(15,98,254,0.12)", accentText: CARBON_BLUE_60,
    border: "#e0e0e0",    borderStrong: "#8d8d8d",
    positive: "#24a148",  warning: "#f1c21b",    negative: "#da1e28",
    /* Carbon-native convenience fields used by carbonBuildCSS + demos. */
    primary: CARBON_BLUE_60,
    surface: "#f4f4f4",
    fgSecondary: "#525252",
    fgTertiary: "#a8a8a8",
  },
  /* G10 - slightly darker light theme; canvas is gray10. */
  g10: {
    bg: "#f4f4f4",        bg2: "#ffffff",        bg3: "#e0e0e0",
    fg: "#161616",        fg2: "#525252",        fg3: "#a8a8a8",
    accent: CARBON_BLUE_60, accentFg: "#ffffff", accentWeak: "rgba(15,98,254,0.12)", accentText: CARBON_BLUE_60,
    border: "#e0e0e0",    borderStrong: "#8d8d8d",
    positive: "#24a148",  warning: "#f1c21b",    negative: "#da1e28",
    primary: CARBON_BLUE_60,
    surface: "#ffffff",
    fgSecondary: "#525252",
    fgTertiary: "#a8a8a8",
  },
  /* G90 - darker dark theme; canvas is gray90. */
  g90: {
    bg: "#262626",        bg2: "#393939",        bg3: "#525252",
    fg: "#f4f4f4",        fg2: "#c6c6c6",        fg3: "#8d8d8d",
    accent: CARBON_BLUE_50, accentFg: "#ffffff", accentWeak: "rgba(69,137,255,0.16)", accentText: CARBON_BLUE_50,
    border: "#525252",    borderStrong: "#8d8d8d",
    positive: "#42be65",  warning: "#f1c21b",    negative: "#fa4d56",
    primary: CARBON_BLUE_50,
    surface: "#393939",
    fgSecondary: "#c6c6c6",
    fgTertiary: "#8d8d8d",
  },
  /* G100 - default dark theme; canvas is gray100. */
  g100: {
    bg: "#161616",        bg2: "#262626",        bg3: "#393939",
    fg: "#f4f4f4",        fg2: "#c6c6c6",        fg3: "#8d8d8d",
    accent: CARBON_BLUE_50, accentFg: "#ffffff", accentWeak: "rgba(69,137,255,0.16)", accentText: CARBON_BLUE_50,
    border: "#393939",    borderStrong: "#525252",
    positive: "#42be65",  warning: "#f1c21b",    negative: "#fa4d56",
    primary: CARBON_BLUE_50,
    surface: "#262626",
    fgSecondary: "#c6c6c6",
    fgTertiary: "#8d8d8d",
  },
};

/* Module-scoped active-theme ref - registry.activateTheme() calls
   setCarbonT() so demos downstream read via getCarbonT(). Mirrors the
   pattern used by ausos / fluent. */
let T = CARBON_THEMES.white;
export const setCarbonT = (theme) => { T = theme; };
export const getCarbonT = () => T;

/* CSS builder - Phase 1 returns the minimum viable token block so
   previews don't explode. Phase 2 extends with the full Carbon token
   namespace (layer-01..03, field-01..03, text-on-color, etc.). */
export function carbonBuildCSS(theme) {
  const t = theme || T;
  return `
    :root {
      --cb-primary: ${t.primary};
      --cb-bg: ${t.bg};
      --cb-fg: ${t.fg};
      --cb-fg-secondary: ${t.fgSecondary};
      --cb-fg-tertiary: ${t.fgTertiary};
      --cb-surface: ${t.surface};
      --cb-border: ${t.border};
    }
  `;
}

/* Category ordering in the UI Kit sidebar. Matches the high-level
   groups Carbon uses at carbondesignsystem.com/components. */
export const CARBON_CATS = [
  "Foundations",
  "Components",
  "Patterns",
];

/* Phase 2 replaces this with ~80 real entries. Keeping it empty is
   a valid scaffold - getComponents() returns []. */
export const CARBON_COMPS = [];

/* Generic icon wrapper - Phase 7 swaps this for @carbon/icons-react. */
export const CIcon = ({ name, size = 16, ...rest }) => {
  void name;
  return <span className="material-symbols-outlined" style={{ fontSize: size }} {...rest} />;
};

/* Demo + preview registries. Return null/empty for Phase 1 - the UI
   Kit hides components with no demo, so the Carbon tab just shows
   "No components yet" until Phase 2.

   NOTE: the `id` parameter is unused in the stub but MUST be declared
   so TypeScript's inferred signature from the .jsx boundary matches
   the call site in registry.ts (which passes componentId). Leaving
   it off caused a strict-mode "Expected 0 arguments, but got 1"
   build failure on Vercel. */
export function getCarbonDemoComponent(id) { void id; return null; }
export function getCarbonPreviews() { return {}; }

/* Density offsets. Carbon uses 2px-based spacing (spacing-01 = 2px,
   spacing-02 = 4px, ...). compact / normal / spacious map to the
   densities Carbon ships in the Theme token set. */
export function getCarbonDensityCSS(density) {
  const map = {
    compact:  ".cb-btn{height:24px;padding:0 8px;font-size:11px;}",
    normal:   ".cb-btn{height:32px;padding:0 12px;font-size:14px;}",
    spacious: ".cb-btn{height:48px;padding:0 16px;font-size:14px;}",
  };
  return map[density] || map.normal;
}
