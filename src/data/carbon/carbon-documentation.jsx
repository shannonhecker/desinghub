/* ══════════════════════════════════════════════════════════
   Carbon Design System (IBM) - documentation module.

   Grounded in official Carbon sources:
   - https://carbondesignsystem.com/elements/color/tokens/
   - https://carbondesignsystem.com/components/button/style/
   - https://carbondesignsystem.com/components/text-input/style/
   - https://carbondesignsystem.com/components/data-table/style/
   - https://carbondesignsystem.com/components/notification/style/
   - https://carbondesignsystem.com/components/dropdown/style/
   - https://carbondesignsystem.com/components/modal/style/

   All hex values + sizing specs come from those pages. Button sizes
   24/32/40/48/64/80 px. Input sizes 32/40/48. Button padding 16/64.
   Data table rows 24/32/40/48/64 px. Focus ring inset 2px white +
   2px blue. Corners are flat (0px) across the board. Font is IBM
   Plex Sans with 14px/400 as the baseline. ══════════════════════════════════════════════════════════ */

import React, { useState } from "react";

/* Font stack - next/font/google registers IBM Plex Sans at the
   app root via the --font-ibm-plex-sans CSS variable, so the
   stack picks it up immediately. The raw family name is kept as
   a fallback for any consumer that inlines Carbon CSS outside
   the app root (e.g. standalone preview iframes). */
export const CARBON_FONT = "var(--font-ibm-plex-sans), 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif";

/* ──────────────────────────────────────────────
   PRIMITIVE COLOURS (from @carbon/colors)
   ────────────────────────────────────────────── */
const BLUE_30  = "#a6c8ff";
const BLUE_40  = "#78a9ff";
const BLUE_50  = "#4589ff";
const BLUE_60  = "#0f62fe";
const BLUE_70  = "#0043ce";
const GRAY_10  = "#f4f4f4";
const GRAY_20  = "#e0e0e0";
const GRAY_30  = "#c6c6c6";
const GRAY_40  = "#a8a8a8";
const GRAY_50  = "#8d8d8d";
const GRAY_60  = "#6f6f6f";
const GRAY_70  = "#525252";
const GRAY_80  = "#393939";
const GRAY_90  = "#262626";
const GRAY_100 = "#161616";
const RED_50   = "#fa4d56";
const RED_60   = "#da1e28";
const GREEN_40 = "#42be65";
const GREEN_50 = "#24a148";
const YELLOW_30 = "#f1c21b";
const PURPLE_60 = "#8a3ffc";

/* ──────────────────────────────────────────────
   THEMES - Carbon's 4 official themes
   ──────────────────────────────────────────────
   Token names + values from the Carbon source
   (packages/themes/src/white.js / g10.js / g90.js
   / g100.js). Both ThemeContext's normalized
   fields (bg/fg/accent/border/etc.) and Carbon's
   semantic role tokens are exposed on every theme. */

/* White theme - light canvas, gray layers */
const white = {
  // Normalized
  bg: "#ffffff", bg2: GRAY_10, bg3: GRAY_20,
  fg: GRAY_100, fg2: GRAY_70, fg3: GRAY_50,
  accent: BLUE_60, accentFg: "#ffffff",
  accentWeak: "rgba(15,98,254,0.12)", accentText: BLUE_60,
  border: GRAY_20, borderStrong: GRAY_50,
  positive: GREEN_50, warning: YELLOW_30, negative: RED_60,
  // Carbon-native
  background: "#ffffff", backgroundHover: "rgba(141,141,141,0.12)",
  backgroundInverse: GRAY_80, backgroundBrand: BLUE_60,
  layer01: GRAY_10, layer02: "#ffffff", layer03: GRAY_10,
  layerHover01: "#e8e8e8", layerActive01: GRAY_30,
  layerAccent01: GRAY_20, layerAccentHover01: "#cacaca",
  field01: GRAY_10, field02: "#ffffff", field03: GRAY_10, fieldHover01: "#e8e8e8",
  borderSubtle00: GRAY_20, borderSubtle01: GRAY_30,
  borderStrong01: GRAY_50, borderInverse: GRAY_100, borderDisabled: GRAY_30,
  borderInteractive: BLUE_60,
  textPrimary: GRAY_100, textSecondary: GRAY_70, textPlaceholder: GRAY_40,
  textHelper: GRAY_60, textError: RED_60, textOnColor: "#ffffff",
  textInverse: "#ffffff", textDisabled: "rgba(22,22,22,0.25)",
  iconPrimary: GRAY_100, iconSecondary: GRAY_70, iconInteractive: BLUE_60,
  iconInverse: "#ffffff", iconOnColor: "#ffffff",
  linkPrimary: BLUE_60, linkPrimaryHover: BLUE_70,
  linkSecondary: BLUE_70, linkVisited: PURPLE_60, linkInverse: BLUE_40,
  supportError: RED_60, supportSuccess: GREEN_50, supportWarning: YELLOW_30, supportInfo: BLUE_70,
  supportErrorInverse: RED_50, supportSuccessInverse: GREEN_40,
  focus: BLUE_60, focusInset: "#ffffff", focusInverse: "#ffffff",
  highlight: "#d0e2ff", interactive: BLUE_60,
  toggleOff: GRAY_50, overlay: "rgba(22,22,22,0.5)", skeletonElement: GRAY_30,
  // Button-specific
  buttonPrimary: BLUE_60, buttonPrimaryHover: "#0353e9", buttonPrimaryActive: "#002d9c",
  buttonSecondary: GRAY_80, buttonSecondaryHover: "#474747", buttonSecondaryActive: GRAY_70,
  buttonTertiary: BLUE_60, buttonTertiaryHover: BLUE_70,
  buttonDangerPrimary: RED_60, buttonDangerHover: "#b81921", buttonDangerActive: "#750e13",
  buttonSeparator: GRAY_20,
  // Shadow tokens
  shadowRaised: "0 1px 2px rgba(0,0,0,0.06)",
  shadowFloating: "0 2px 6px rgba(0,0,0,0.1)",
};

/* G10 - darker light; canvas is gray-10 */
const g10 = {
  ...white,
  bg: GRAY_10, bg2: "#ffffff", bg3: GRAY_20,
  background: GRAY_10, layer01: "#ffffff", layer02: GRAY_10, layer03: "#ffffff",
  field01: "#ffffff", field02: GRAY_10, field03: "#ffffff",
  layerHover01: "#e8e8e8",
};

/* G90 - dark; canvas is gray-90 */
const g90 = {
  // Normalized
  bg: GRAY_90, bg2: GRAY_80, bg3: GRAY_70,
  fg: GRAY_10, fg2: GRAY_30, fg3: GRAY_50,
  accent: BLUE_50, accentFg: "#ffffff",
  accentWeak: "rgba(69,137,255,0.16)", accentText: BLUE_40,
  border: GRAY_80, borderStrong: GRAY_60,
  positive: GREEN_40, warning: YELLOW_30, negative: RED_50,
  // Carbon-native
  background: GRAY_90, backgroundHover: "rgba(141,141,141,0.16)",
  backgroundInverse: GRAY_10, backgroundBrand: BLUE_60,
  layer01: GRAY_80, layer02: GRAY_70, layer03: GRAY_60,
  layerHover01: "#474747", layerActive01: GRAY_60,
  layerAccent01: GRAY_70, layerAccentHover01: GRAY_60,
  field01: GRAY_80, field02: GRAY_70, field03: GRAY_60, fieldHover01: "#474747",
  borderSubtle00: GRAY_80, borderSubtle01: GRAY_70,
  borderStrong01: GRAY_50, borderInverse: GRAY_10, borderDisabled: "rgba(141,141,141,0.4)",
  borderInteractive: BLUE_50,
  textPrimary: GRAY_10, textSecondary: GRAY_30, textPlaceholder: GRAY_50,
  textHelper: GRAY_40, textError: "#ff8389", textOnColor: "#ffffff",
  textInverse: GRAY_100, textDisabled: "rgba(244,244,244,0.25)",
  iconPrimary: GRAY_10, iconSecondary: GRAY_30, iconInteractive: "#ffffff",
  iconInverse: GRAY_100, iconOnColor: "#ffffff",
  linkPrimary: BLUE_40, linkPrimaryHover: BLUE_30, linkSecondary: BLUE_40,
  linkVisited: "#be95ff", linkInverse: BLUE_60,
  supportError: "#ff8389", supportSuccess: GREEN_40, supportWarning: YELLOW_30, supportInfo: BLUE_50,
  supportErrorInverse: RED_60, supportSuccessInverse: GREEN_50,
  focus: "#ffffff", focusInset: GRAY_100, focusInverse: BLUE_60,
  highlight: "#002d9c", interactive: BLUE_50,
  toggleOff: GRAY_60, overlay: "rgba(0,0,0,0.65)", skeletonElement: GRAY_70,
  buttonPrimary: BLUE_60, buttonPrimaryHover: "#0353e9", buttonPrimaryActive: "#002d9c",
  buttonSecondary: GRAY_10, buttonSecondaryHover: "#e5e5e5", buttonSecondaryActive: GRAY_30,
  buttonTertiary: "#ffffff", buttonTertiaryHover: GRAY_10,
  buttonDangerPrimary: RED_60, buttonDangerHover: "#b81921", buttonDangerActive: "#750e13",
  buttonSeparator: GRAY_100,
  shadowRaised: "0 1px 2px rgba(0,0,0,0.3)",
  shadowFloating: "0 2px 6px rgba(0,0,0,0.4)",
};
/* G100 - darkest; canvas is gray-100 */
const g100 = {
  ...g90,
  bg: GRAY_100, bg2: GRAY_90, bg3: GRAY_80,
  background: GRAY_100, layer01: GRAY_90, layer02: GRAY_80, layer03: GRAY_70,
  field01: GRAY_90, field02: GRAY_80, field03: GRAY_70,
  layerHover01: "#333333",
};

export const CARBON_THEMES = { white, g10, g90, g100 };

/* Module-scoped active theme. registry.activateTheme() calls setCarbonT. */
let T = CARBON_THEMES.white;
export const setCarbonT = (theme) => { T = theme; };
export const getCarbonT = () => T;

/* ──────────────────────────────────────────────
   CSS BUILDER - injected into UI Kit iframe
   ──────────────────────────────────────────────
   Emits Carbon's canonical `--cds-*` token names (prefix confirmed
   via carbon-design-system/carbon/packages/themes/scss/_config.scss
   → `$prefix: 'cds'`). The four theme dicts become class-selector
   blocks (`.cds--white`, `.cds--g10`, `.cds--g90`, `.cds--g100`) so
   a preview wrapper can swap themes by changing a single className,
   matching Carbon's own runtime theming model.

   All component CSS rules below the theme blocks read from the
   resolved `var(--cds-*)` values, so the class-selector cascade
   handles theme switching with zero per-rule rewrites. The module
   still exports `T` for JSX renderers (color dots, typography
   specimens) that need raw token access.

   Component geometry matches Carbon's Style tabs exactly:
   - Button sizes 32/40/48/64/80 px (sm/md/lg/xl/2xl), 2px focus
     outline in $focus, asymmetric padding, zero radius.
   - Text Input / Number Input / Dropdown share a 40px field with a
     1px bottom border in $border-strong-01 that swaps to a 2px
     $focus bottom border on focus; no horizontal borders.
   - Data Table rows 48px (md), header $layer-accent-01, zero
     border-radius anywhere.
   - Tile uses $layer-01, zero radius, $spacing-05 padding.
   - Tag pill (1rem radius), 24px tall, $label-01 500 weight. */
export function carbonBuildCSS(theme) {
  const t = theme || T;

  /* Helper: emit the full token set for one theme dict. Used inside
     each `.cds--<theme>` selector below so the cascade resolves
     tokens automatically when the wrapper class changes. */
  const themeTokens = (dict) => `
      --cds-background: ${dict.background};
      --cds-background-hover: ${dict.backgroundHover};
      --cds-background-active: ${dict.layerActive01};
      --cds-background-selected: ${dict.highlight};
      --cds-background-inverse: ${dict.backgroundInverse};
      --cds-background-brand: ${dict.backgroundBrand};
      --cds-layer-01: ${dict.layer01};
      --cds-layer-02: ${dict.layer02};
      --cds-layer-03: ${dict.layer03};
      --cds-layer-hover-01: ${dict.layerHover01};
      --cds-layer-hover-02: ${dict.layerHover01};
      --cds-layer-hover-03: ${dict.layerHover01};
      --cds-layer-selected-01: ${dict.layerActive01};
      --cds-layer-selected-02: ${dict.layerActive01};
      --cds-layer-selected-03: ${dict.layerActive01};
      --cds-layer-accent-01: ${dict.layerAccent01};
      --cds-layer-accent-02: ${dict.layerAccent01};
      --cds-layer-accent-03: ${dict.layerAccent01};
      --cds-field-01: ${dict.field01};
      --cds-field-02: ${dict.field02};
      --cds-field-03: ${dict.field03};
      --cds-field-hover-01: ${dict.fieldHover01};
      --cds-field-hover-02: ${dict.fieldHover01};
      --cds-field-hover-03: ${dict.fieldHover01};
      --cds-border-subtle-00: ${dict.borderSubtle00};
      --cds-border-subtle-01: ${dict.borderSubtle01};
      --cds-border-subtle-02: ${dict.borderSubtle01};
      --cds-border-subtle-03: ${dict.borderSubtle01};
      --cds-border-strong-01: ${dict.borderStrong01};
      --cds-border-strong-02: ${dict.borderStrong01};
      --cds-border-strong-03: ${dict.borderStrong01};
      --cds-border-interactive: ${dict.borderInteractive};
      --cds-border-inverse: ${dict.borderInverse};
      --cds-border-disabled: ${dict.borderDisabled};
      --cds-text-primary: ${dict.textPrimary};
      --cds-text-secondary: ${dict.textSecondary};
      --cds-text-placeholder: ${dict.textPlaceholder};
      --cds-text-on-color: ${dict.textOnColor};
      --cds-text-helper: ${dict.textHelper};
      --cds-text-error: ${dict.textError};
      --cds-text-disabled: ${dict.textDisabled};
      --cds-text-inverse: ${dict.textInverse};
      --cds-icon-primary: ${dict.iconPrimary};
      --cds-icon-secondary: ${dict.iconSecondary};
      --cds-icon-interactive: ${dict.iconInteractive};
      --cds-icon-on-color: ${dict.iconOnColor};
      --cds-icon-inverse: ${dict.iconInverse};
      --cds-link-primary: ${dict.linkPrimary};
      --cds-link-primary-hover: ${dict.linkPrimaryHover};
      --cds-link-secondary: ${dict.linkSecondary};
      --cds-link-visited: ${dict.linkVisited};
      --cds-link-inverse: ${dict.linkInverse};
      --cds-support-error: ${dict.supportError};
      --cds-support-success: ${dict.supportSuccess};
      --cds-support-warning: ${dict.supportWarning};
      --cds-support-info: ${dict.supportInfo};
      --cds-focus: ${dict.focus};
      --cds-focus-inset: ${dict.focusInset};
      --cds-focus-inverse: ${dict.focusInverse};
      --cds-interactive: ${dict.interactive};
      --cds-highlight: ${dict.highlight};
      --cds-toggle-off: ${dict.toggleOff};
      --cds-overlay: ${dict.overlay};
      --cds-skeleton-element: ${dict.skeletonElement};
      --cds-button-primary: ${dict.buttonPrimary};
      --cds-button-primary-hover: ${dict.buttonPrimaryHover};
      --cds-button-primary-active: ${dict.buttonPrimaryActive};
      --cds-button-secondary: ${dict.buttonSecondary};
      --cds-button-secondary-hover: ${dict.buttonSecondaryHover};
      --cds-button-secondary-active: ${dict.buttonSecondaryActive};
      --cds-button-tertiary: ${dict.buttonTertiary};
      --cds-button-tertiary-hover: ${dict.buttonTertiaryHover};
      --cds-button-danger-primary: ${dict.buttonDangerPrimary};
      --cds-button-danger-hover: ${dict.buttonDangerHover};
      --cds-button-danger-active: ${dict.buttonDangerActive};
      --cds-button-separator: ${dict.buttonSeparator};
      --cds-shadow-raised: ${dict.shadowRaised};
      --cds-shadow-floating: ${dict.shadowFloating};
      /* Spacing scale (px) - Carbon scale-01..13. Exposed as tokens
         so inline styles and consumer CSS can consume them. */
      --cds-spacing-01: 2px; --cds-spacing-02: 4px; --cds-spacing-03: 8px;
      --cds-spacing-04: 12px; --cds-spacing-05: 16px; --cds-spacing-06: 24px;
      --cds-spacing-07: 32px; --cds-spacing-08: 40px; --cds-spacing-09: 48px;
      --cds-spacing-10: 64px; --cds-spacing-11: 80px; --cds-spacing-12: 96px;
      --cds-spacing-13: 160px;`;

  /* IBM Plex Sans + Mono are registered globally via next/font in
     src/lib/fonts.ts; the CSS variable --font-ibm-plex-sans flows in
     via <html> so no @import is needed here. */
  return `
    .cds--white {${themeTokens(CARBON_THEMES.white)}
    }
    .cds--g10 {${themeTokens(CARBON_THEMES.g10)}
    }
    .cds--g90 {${themeTokens(CARBON_THEMES.g90)}
    }
    .cds--g100 {${themeTokens(CARBON_THEMES.g100)}
    }

    /* Base / fallback :root tokens so rules still resolve if no
       theme class is applied. Uses the currently active theme. */
    :root {${themeTokens(t)}
    }

    * { box-sizing: border-box; }
    body, .cb-root { font-family: ${CARBON_FONT}; color: var(--cds-text-primary); background: var(--cds-background); }

    /* Carbon type scale - letter-spacing +0.32px at 12px, +0.16px at
       14px, 0 at 16+. Applied inline wherever type tokens surface. */

    /* ═══ BUTTON ═══
       Kinds: primary / secondary / tertiary / ghost / danger /
       danger--tertiary / danger--ghost. Sizes sm 32 / md 40 (default)
       / lg 48 / xl 64 / 2xl 80. Padding 0 $spacing-05 (16px) with
       right padding $spacing-10 (64px) when the button carries a
       trailing renderIcon. 2px $focus outline on :focus-visible.
       Zero border-radius. IBM Plex Sans 400, letter-spacing 0.16px. */
    .cb-btn { display: inline-flex; align-items: center; justify-content: space-between;
      gap: var(--cds-spacing-05); min-width: 0;
      height: 40px; padding: 0 var(--cds-spacing-05); border-radius: 0;
      font-family: ${CARBON_FONT}; font-size: 14px; font-weight: 400; line-height: 18px;
      letter-spacing: 0.16px;
      cursor: pointer; border: 1px solid transparent; background: transparent;
      color: var(--cds-text-primary);
      transition: background 70ms cubic-bezier(0.2, 0, 0.38, 0.9),
                  color 70ms cubic-bezier(0.2, 0, 0.38, 0.9);
      outline: none; text-align: left; white-space: nowrap; }
    .cb-btn:focus-visible, .cb-btn:focus { outline: 2px solid var(--cds-focus); outline-offset: -2px; box-shadow: inset 0 0 0 1px var(--cds-focus-inset); }
    .cb-btn[data-icon] { padding-right: var(--cds-spacing-10); }
    .cb-btn[disabled], .cb-btn:disabled { background: var(--cds-button-disabled, #c6c6c6); color: var(--cds-text-disabled); cursor: not-allowed; border-color: transparent; }

    .cb-btn-primary { background: var(--cds-button-primary); color: var(--cds-text-on-color); }
    .cb-btn-primary:hover { background: var(--cds-button-primary-hover); }
    .cb-btn-primary:active { background: var(--cds-button-primary-active); }
    .cb-btn-secondary { background: var(--cds-button-secondary); color: var(--cds-text-on-color); }
    .cb-btn-secondary:hover { background: var(--cds-button-secondary-hover); }
    .cb-btn-secondary:active { background: var(--cds-button-secondary-active); }
    .cb-btn-tertiary { background: transparent; color: var(--cds-button-tertiary); border-color: var(--cds-button-tertiary); }
    .cb-btn-tertiary:hover { background: var(--cds-button-tertiary-hover); color: var(--cds-text-on-color); }
    .cb-btn-ghost { background: transparent; color: var(--cds-link-primary); border-color: transparent; }
    .cb-btn-ghost:hover { background: var(--cds-background-hover); color: var(--cds-link-primary-hover); }
    .cb-btn-danger, .cb-btn-danger--primary { background: var(--cds-button-danger-primary); color: var(--cds-text-on-color); }
    .cb-btn-danger:hover, .cb-btn-danger--primary:hover { background: var(--cds-button-danger-hover); }
    .cb-btn-danger:active, .cb-btn-danger--primary:active { background: var(--cds-button-danger-active); }
    .cb-btn-danger--tertiary { background: transparent; color: var(--cds-button-danger-primary); border-color: var(--cds-button-danger-primary); }
    .cb-btn-danger--tertiary:hover { background: var(--cds-button-danger-hover); color: var(--cds-text-on-color); border-color: var(--cds-button-danger-hover); }
    .cb-btn-danger--ghost { background: transparent; color: var(--cds-button-danger-primary); }
    .cb-btn-danger--ghost:hover { background: var(--cds-button-danger-hover); color: var(--cds-text-on-color); }

    /* Sizes - Carbon ladder: 32/40/48/64/80. 2xl is 80px. */
    .cb-btn-sm  { height: 32px; padding: 0 var(--cds-spacing-04); }
    .cb-btn-md  { height: 40px; padding: 0 var(--cds-spacing-05); }
    .cb-btn-lg  { height: 48px; padding: 0 var(--cds-spacing-05); }
    .cb-btn-xl  { height: 64px; align-items: flex-start; padding: var(--cds-spacing-04) var(--cds-spacing-05); }
    .cb-btn-2xl { height: 80px; align-items: flex-start; padding: var(--cds-spacing-04) var(--cds-spacing-05); }
    .cb-btn-xs  { height: 24px; font-size: 12px; padding: 0 var(--cds-spacing-04); letter-spacing: 0.32px; }
    .cb-btn-icon { width: 40px; padding: 0; justify-content: center; gap: 0; }
    .cb-btn-sm.cb-btn-icon { width: 32px; }
    .cb-btn-lg.cb-btn-icon { width: 48px; }

    /* ═══ TEXT INPUT ═══
       md 40px tall (Carbon default). label-01 12/16/400 +0.32px above
       the input; field-01 background; 1px bottom border in
       $border-strong-01; on :focus the bottom border hides and a 2px
       $focus bottom border appears (no horizontal borders - Carbon's
       Text Input has only the bottom rule in the default variant).
       Helper text uses helper-text-01 12/16; invalid state swaps to a
       2px $support-error outline + leaves room for the ErrorFilled
       icon the React renderer injects. */
    .cb-input-wrap { display: flex; flex-direction: column; gap: var(--cds-spacing-02); }
    .cb-input-label { font-size: 12px; line-height: 16px; letter-spacing: 0.32px; color: var(--cds-text-secondary); font-weight: 400; font-family: ${CARBON_FONT}; }
    .cb-input { height: 40px; width: 100%; padding: 0 var(--cds-spacing-05);
      background: var(--cds-field-01); color: var(--cds-text-primary);
      border: 0; border-bottom: 1px solid var(--cds-border-strong-01);
      font-family: ${CARBON_FONT}; font-size: 14px; line-height: 18px; letter-spacing: 0.16px;
      outline: none; border-radius: 0;
      transition: background 70ms cubic-bezier(0.2, 0, 0.38, 0.9); }
    .cb-input:hover { background: var(--cds-field-hover-01); }
    .cb-input:focus, .cb-input:focus-visible { border-bottom: 2px solid var(--cds-focus); padding-bottom: 0; }
    .cb-input::placeholder { color: var(--cds-text-placeholder); }
    .cb-input-helper { font-size: 12px; line-height: 16px; letter-spacing: 0.32px; color: var(--cds-text-helper); font-family: ${CARBON_FONT}; }
    .cb-input-error-msg { font-size: 12px; line-height: 16px; letter-spacing: 0.32px; color: var(--cds-text-error); font-family: ${CARBON_FONT}; }
    .cb-input-invalid-wrap { position: relative; }
    .cb-input-invalid-wrap .cb-input-invalid-icon { position: absolute; right: var(--cds-spacing-05); top: 50%; transform: translateY(-50%); color: var(--cds-support-error); pointer-events: none; }
    .cb-input.error { outline: 2px solid var(--cds-support-error); outline-offset: -2px; border-bottom-color: transparent; padding-right: var(--cds-spacing-09); }
    .cb-input-sm { height: 32px; }
    .cb-input-lg { height: 48px; }
    .cb-textarea { min-height: 88px; padding: var(--cds-spacing-03) var(--cds-spacing-05); resize: vertical; }
    .cb-search-wrap { position: relative; }
    .cb-search-icon { position: absolute; left: var(--cds-spacing-05); top: 50%; transform: translateY(-50%); color: var(--cds-icon-secondary); pointer-events: none; }
    .cb-search-wrap .cb-input { padding-left: var(--cds-spacing-09); }

    /* ═══ NUMBER INPUT ═══
       Same 40px field shell as TextInput with a pair of square
       stepper buttons on the trailing edge. Each stepper is
       40×40 with $field-01 bg, $border-strong-01 left separator,
       $icon-primary chevron, and Carbon's standard 70ms ease-out. */
    .cb-number { position: relative; display: flex; align-items: stretch; width: 100%; height: 40px;
      background: var(--cds-field-01); border-bottom: 1px solid var(--cds-border-strong-01); }
    .cb-number:focus-within { border-bottom: 2px solid var(--cds-focus); }
    .cb-number-input { flex: 1; min-width: 0; height: 100%; padding: 0 var(--cds-spacing-05);
      background: transparent; color: var(--cds-text-primary); border: 0;
      font-family: ${CARBON_FONT}; font-size: 14px; letter-spacing: 0.16px; outline: none; border-radius: 0; }
    .cb-number-steppers { display: flex; flex-shrink: 0; height: 100%; border-left: 1px solid var(--cds-border-strong-01); }
    .cb-number-step { width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center;
      background: var(--cds-field-01); color: var(--cds-icon-primary); border: 0; cursor: pointer; border-radius: 0;
      transition: background 70ms cubic-bezier(0.2, 0, 0.38, 0.9); }
    .cb-number-step:hover { background: var(--cds-field-hover-01); }
    .cb-number-step:focus-visible { outline: 2px solid var(--cds-focus); outline-offset: -2px; }
    .cb-number-step + .cb-number-step { border-left: 1px solid var(--cds-border-strong-01); }

    /* ═══ DROPDOWN ═══
       Shares the TextInput field shell (40px, 1px bottom border,
       field-01 bg). Trailing chevron 16px in $icon-primary. Menu
       opens immediately below the trigger with $layer-01 bg and no
       gap, matching the Carbon select/dropdown pattern. */
    .cb-dropdown { position: relative; }
    .cb-dropdown-trigger { height: 40px; padding: 0 var(--cds-spacing-05); background: var(--cds-field-01);
      color: var(--cds-text-primary); border: 0; border-bottom: 1px solid var(--cds-border-strong-01);
      display: flex; align-items: center; justify-content: space-between;
      cursor: pointer; font-family: ${CARBON_FONT}; font-size: 14px; letter-spacing: 0.16px; width: 100%; border-radius: 0;
      transition: background 70ms cubic-bezier(0.2, 0, 0.38, 0.9); }
    .cb-dropdown-trigger:hover { background: var(--cds-field-hover-01); }
    .cb-dropdown-trigger:focus-visible { outline: 2px solid var(--cds-focus); outline-offset: -2px; border-bottom-color: transparent; }
    .cb-dropdown-chev { color: var(--cds-icon-primary); flex-shrink: 0; }
    .cb-dropdown-menu { position: absolute; top: 100%; left: 0; right: 0; background: var(--cds-layer-01);
      border-top: 1px solid var(--cds-border-subtle-01); box-shadow: var(--cds-shadow-floating); z-index: 10; }
    .cb-dropdown-item { padding: 0 var(--cds-spacing-05); height: 40px; display: flex; align-items: center;
      color: var(--cds-text-primary); font-family: ${CARBON_FONT}; font-size: 14px; cursor: pointer; }
    .cb-dropdown-item:hover { background: var(--cds-layer-hover-01); }
    .cb-dropdown-item.selected { background: var(--cds-layer-selected-01); }

    /* ═══ CHECKBOX ═══
       18×18 square, 2px border in $icon-primary. On check: $background-brand
       fill with a Checkmark glyph in $icon-on-color. Label label-01 to
       the right with $spacing-03 (8px) gap. */
    .cb-checkbox, .cb-radio { display: inline-flex; align-items: center; gap: var(--cds-spacing-03);
      font-family: ${CARBON_FONT}; font-size: 14px; letter-spacing: 0.16px; color: var(--cds-text-primary); cursor: pointer; user-select: none; }
    .cb-cb-box { width: 18px; height: 18px; border: 2px solid var(--cds-icon-primary);
      background: transparent; border-radius: 0; display: inline-flex;
      align-items: center; justify-content: center; flex-shrink: 0;
      transition: background 70ms cubic-bezier(0.2, 0, 0.38, 0.9); }
    .cb-cb-box.checked { background: var(--cds-background-brand); border-color: var(--cds-background-brand); }
    .cb-cb-box.checked::after { content: ""; width: 10px; height: 6px;
      border-left: 2px solid var(--cds-icon-on-color); border-bottom: 2px solid var(--cds-icon-on-color);
      transform: rotate(-45deg) translate(1px, -1px); }
    .cb-cb-box:focus-visible, .cb-checkbox:focus-visible .cb-cb-box { outline: 2px solid var(--cds-focus); outline-offset: 1px; }
    .cb-checkbox.disabled { color: var(--cds-text-disabled); cursor: not-allowed; }
    .cb-checkbox.disabled .cb-cb-box { border-color: var(--cds-text-disabled); }

    /* ═══ RADIO ═══ */
    .cb-radio-circle { width: 18px; height: 18px; border: 2px solid var(--cds-icon-primary);
      border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .cb-radio-circle.checked::after { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--cds-icon-primary); }

    /* ═══ TOGGLE ═══
       48×24 pill. Off: $toggle-off bg. On: $support-success bg
       (Carbon's on-state green across all four themes). Knob is a
       20×20 white circle inset 2px. */
    .cb-toggle { display: inline-flex; align-items: center; gap: var(--cds-spacing-04); cursor: pointer;
      font-family: ${CARBON_FONT}; font-size: 14px; letter-spacing: 0.16px; color: var(--cds-text-primary); }
    .cb-toggle-track { width: 48px; height: 24px; background: var(--cds-toggle-off); border-radius: 12px;
      position: relative; transition: background 70ms cubic-bezier(0.2, 0, 0.38, 0.9); flex-shrink: 0; }
    .cb-toggle.on .cb-toggle-track { background: var(--cds-support-success); }
    .cb-toggle-thumb { width: 20px; height: 20px; background: #ffffff; border-radius: 50%;
      position: absolute; top: 2px; left: 2px;
      transition: left 70ms cubic-bezier(0.2, 0, 0.38, 0.9); }
    .cb-toggle.on .cb-toggle-thumb { left: 26px; }
    .cb-toggle:focus-within .cb-toggle-track { outline: 2px solid var(--cds-focus); outline-offset: 1px; }

    /* ═══ TABS ═══
       Tab buttons 40px tall. 2px bottom border $border-strong-01
       along the entire tablist. Selected tab gets a 3px
       $border-interactive underline that stacks above the subtle
       rule (negative margin-bottom + overlapping z). Body text uses
       body-compact-02 (14/18, 400). */
    .cb-tabs { display: flex; border-bottom: 2px solid var(--cds-border-strong-01); position: relative; }
    .cb-tab { position: relative; height: 40px; padding: 0 var(--cds-spacing-05);
      font-family: ${CARBON_FONT}; font-size: 14px; font-weight: 400; line-height: 18px; letter-spacing: 0.16px;
      color: var(--cds-text-secondary); border: 0; background: transparent;
      cursor: pointer; margin-bottom: -2px;
      transition: color 70ms cubic-bezier(0.2, 0, 0.38, 0.9); }
    .cb-tab:hover { color: var(--cds-text-primary); background: var(--cds-layer-hover-01); }
    .cb-tab:focus-visible { outline: 2px solid var(--cds-focus); outline-offset: -2px; }
    .cb-tab.active { color: var(--cds-text-primary); }
    .cb-tab.active::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0;
      height: 3px; background: var(--cds-border-interactive); }

    /* ═══ TAG ═══
       Pill: border-radius 1rem (16px). Height 24px. Padding
       0 $spacing-03 (8px). label-01 at 500 weight. Colour variants
       map to Carbon's tag palette (red/magenta/purple/blue/cyan/
       teal/green/gray/cool-gray/warm-gray). Values use the pairs
       published in Carbon's tag style page. */
    .cb-tag { display: inline-flex; align-items: center; gap: var(--cds-spacing-02); height: 24px;
      padding: 0 var(--cds-spacing-03); border-radius: 1rem;
      background: var(--cds-layer-accent-01); color: var(--cds-text-primary);
      font-family: ${CARBON_FONT}; font-size: 12px; font-weight: 500; letter-spacing: 0.32px; white-space: nowrap; }
    .cb-tag-red        { background: ${t.background === "#ffffff" || t.background === GRAY_10 ? "#ffd7d9" : "#7a1620"}; color: ${t.background === "#ffffff" || t.background === GRAY_10 ? "#750e13" : "#ffd7d9"}; }
    .cb-tag-magenta    { background: ${t.background === "#ffffff" || t.background === GRAY_10 ? "#ffd6e8" : "#740937"}; color: ${t.background === "#ffffff" || t.background === GRAY_10 ? "#740937" : "#ffd6e8"}; }
    .cb-tag-purple     { background: ${t.background === "#ffffff" || t.background === GRAY_10 ? "#e8daff" : "#491d8b"}; color: ${t.background === "#ffffff" || t.background === GRAY_10 ? "#491d8b" : "#e8daff"}; }
    .cb-tag-blue       { background: ${t.background === "#ffffff" || t.background === GRAY_10 ? "#d0e2ff" : "#002d9c"}; color: ${t.background === "#ffffff" || t.background === GRAY_10 ? "#002d9c" : "#d0e2ff"}; }
    .cb-tag-cyan       { background: ${t.background === "#ffffff" || t.background === GRAY_10 ? "#bae6ff" : "#003a6d"}; color: ${t.background === "#ffffff" || t.background === GRAY_10 ? "#003a6d" : "#bae6ff"}; }
    .cb-tag-teal       { background: ${t.background === "#ffffff" || t.background === GRAY_10 ? "#9ef0f0" : "#004144"}; color: ${t.background === "#ffffff" || t.background === GRAY_10 ? "#004144" : "#9ef0f0"}; }
    .cb-tag-green      { background: ${t.background === "#ffffff" || t.background === GRAY_10 ? "#a7f0ba" : "#044317"}; color: ${t.background === "#ffffff" || t.background === GRAY_10 ? "#044317" : "#a7f0ba"}; }
    .cb-tag-gray       { background: var(--cds-layer-accent-01); color: var(--cds-text-primary); }
    .cb-tag-cool-gray  { background: ${t.background === "#ffffff" || t.background === GRAY_10 ? "#dde1e6" : "#343a3f"}; color: ${t.background === "#ffffff" || t.background === GRAY_10 ? "#121619" : "#dde1e6"}; }
    .cb-tag-warm-gray  { background: ${t.background === "#ffffff" || t.background === GRAY_10 ? "#e5e0df" : "#3c3838"}; color: ${t.background === "#ffffff" || t.background === GRAY_10 ? "#171414" : "#e5e0df"}; }
    .cb-tag-yellow     { background: ${t.background === "#ffffff" || t.background === GRAY_10 ? "#fcf4d6" : "#483700"}; color: ${t.background === "#ffffff" || t.background === GRAY_10 ? "#684e00" : "#fcf4d6"}; }

    /* ═══ TILE (card) ═══
       No border-radius. $layer-01 bg. Padding $spacing-05 (16px).
       Outline variant uses $border-subtle-01 for the 1px border. */
    .cb-tile { background: var(--cds-layer-01); border: 1px solid transparent;
      padding: var(--cds-spacing-05); border-radius: 0; font-family: ${CARBON_FONT}; color: var(--cds-text-primary); }
    .cb-tile-outline { border-color: var(--cds-border-subtle-01); }
    .cb-tile-clickable { cursor: pointer; transition: background 70ms cubic-bezier(0.2, 0, 0.38, 0.9); }
    .cb-tile-clickable:hover { background: var(--cds-layer-hover-01); }
    .cb-tile-selectable.selected { outline: 2px solid var(--cds-interactive); outline-offset: -2px; }
    .cb-tile:focus-visible { outline: 2px solid var(--cds-focus); outline-offset: -2px; }

    /* ═══ NOTIFICATION ═══
       3px left border, icon on left, 48px min-height, 16px padding. */
    .cb-notif { display: flex; align-items: flex-start; gap: var(--cds-spacing-04);
      min-height: 48px; padding: var(--cds-spacing-04) var(--cds-spacing-05);
      border-left: 3px solid var(--cds-interactive);
      background: var(--cds-layer-01); color: var(--cds-text-primary);
      font-family: ${CARBON_FONT}; font-size: 14px; line-height: 18px; }
    .cb-notif-success { border-left-color: var(--cds-support-success); }
    .cb-notif-warning { border-left-color: var(--cds-support-warning); }
    .cb-notif-error   { border-left-color: var(--cds-support-error); }
    .cb-notif-info    { border-left-color: var(--cds-support-info); }
    .cb-notif-icon { flex-shrink: 0; margin-top: 1px; }
    .cb-notif-body { flex: 1; }
    .cb-notif-title { font-weight: 600; line-height: 18px; }
    .cb-notif-sub { color: var(--cds-text-secondary); margin-top: 2px; }

    /* ═══ PROGRESS BAR ═══ */
    .cb-progress { display: flex; flex-direction: column; gap: var(--cds-spacing-03);
      font-family: ${CARBON_FONT}; font-size: 12px; letter-spacing: 0.32px; color: var(--cds-text-primary); }
    .cb-progress-label { display: flex; justify-content: space-between; }
    .cb-progress-track { height: 4px; background: var(--cds-border-subtle-01); width: 100%; overflow: hidden; }
    .cb-progress-fill { height: 100%; background: var(--cds-interactive);
      transition: width 200ms cubic-bezier(0.2, 0, 0.38, 0.9); }

    /* ═══ ACCORDION ═══ */
    .cb-accordion { border-top: 1px solid var(--cds-border-subtle-01); }
    .cb-accordion-item { border-bottom: 1px solid var(--cds-border-subtle-01); }
    .cb-accordion-head { display: flex; justify-content: space-between; align-items: center;
      padding: var(--cds-spacing-04) 0; cursor: pointer; font-family: ${CARBON_FONT}; font-size: 14px;
      color: var(--cds-text-primary); transition: background 70ms cubic-bezier(0.2, 0, 0.38, 0.9); }
    .cb-accordion-head:hover { background: var(--cds-layer-hover-01); }
    .cb-accordion-body { padding: 0 0 var(--cds-spacing-05) 0; font-size: 14px; line-height: 20px; color: var(--cds-text-secondary); }

    /* ═══ BREADCRUMB ═══ */
    .cb-crumb { display: flex; align-items: center; gap: var(--cds-spacing-03);
      font-family: ${CARBON_FONT}; font-size: 14px; letter-spacing: 0.16px; color: var(--cds-text-secondary); }
    .cb-crumb a { color: var(--cds-link-primary); text-decoration: none; cursor: pointer; }
    .cb-crumb a:hover { color: var(--cds-link-primary-hover); text-decoration: underline; }
    .cb-crumb-sep { color: var(--cds-text-secondary); }
    .cb-crumb-current { color: var(--cds-text-primary); }

    /* ═══ DATA TABLE ═══
       No border-radius. Row height 48px (md). Header row bg
       $layer-accent-01 with heading-02 bold (14/600). Row hover bg
       $layer-hover-01. Cell padding 0 $spacing-05 with
       vertical-align centre. */
    .cb-table { width: 100%; border-collapse: collapse; font-family: ${CARBON_FONT};
      font-size: 14px; line-height: 18px; letter-spacing: 0.16px;
      color: var(--cds-text-primary); background: var(--cds-layer-01); border-radius: 0; }
    .cb-table th { text-align: left; font-weight: 600; font-size: 14px; line-height: 18px;
      padding: 0 var(--cds-spacing-05); height: 48px; vertical-align: middle;
      border-bottom: 1px solid var(--cds-border-subtle-01);
      background: var(--cds-layer-accent-01); color: var(--cds-text-primary); }
    .cb-table td { padding: 0 var(--cds-spacing-05); height: 48px; vertical-align: middle;
      border-bottom: 1px solid var(--cds-border-subtle-01); }
    .cb-table tr:hover td { background: var(--cds-layer-hover-01); }
    .cb-table tr.selected td { background: var(--cds-background-selected); }

    /* ═══ MODAL ═══ */
    .cb-modal { max-width: 440px; background: var(--cds-layer-01);
      border: 1px solid var(--cds-border-subtle-01); padding: 0;
      font-family: ${CARBON_FONT}; color: var(--cds-text-primary); }
    .cb-modal-header { padding: var(--cds-spacing-05) var(--cds-spacing-05) var(--cds-spacing-04); }
    .cb-modal-label { font-size: 12px; letter-spacing: 0.32px; color: var(--cds-text-secondary); margin-bottom: var(--cds-spacing-02); }
    .cb-modal-title { font-size: 20px; font-weight: 400; line-height: 28px; color: var(--cds-text-primary); margin-bottom: var(--cds-spacing-04); }
    .cb-modal-body { padding: 0 var(--cds-spacing-05) var(--cds-spacing-09); font-size: 14px; line-height: 20px; color: var(--cds-text-secondary); max-width: 80%; }
    .cb-modal-footer { display: grid; grid-template-columns: 1fr 1fr; }
    .cb-modal-footer .cb-btn { height: 64px; border-radius: 0; padding: var(--cds-spacing-04) var(--cds-spacing-05);
      align-items: flex-start; justify-content: space-between; }

    /* ═══ LINK ═══ */
    .cb-link { color: var(--cds-link-primary); text-decoration: underline;
      font-family: ${CARBON_FONT}; font-size: 14px; letter-spacing: 0.16px; cursor: pointer; }
    .cb-link:hover { color: var(--cds-link-primary-hover); }
    .cb-link-visited { color: var(--cds-link-visited); }
    .cb-link-inline { font-size: inherit; }

    /* ═══ TOOLTIP ═══ */
    .cb-tooltip { position: relative; display: inline-block; }
    .cb-tooltip-bubble { position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
      background: var(--cds-background-inverse); color: var(--cds-text-inverse); font-size: 12px; letter-spacing: 0.32px;
      padding: var(--cds-spacing-03) var(--cds-spacing-04); white-space: nowrap; font-family: ${CARBON_FONT}; border-radius: 0;
      box-shadow: var(--cds-shadow-floating); pointer-events: none; }

    /* ═══ AVATAR (compose) ═══ */
    .cb-avatar { width: 32px; height: 32px; border-radius: 50%;
      background: var(--cds-interactive); color: #ffffff; display: inline-flex;
      align-items: center; justify-content: center; font-family: ${CARBON_FONT};
      font-weight: 400; font-size: 12px; letter-spacing: 0.32px; }
    .cb-avatar-sm { width: 24px; height: 24px; font-size: 10px; }
    .cb-avatar-lg { width: 48px; height: 48px; font-size: 16px; letter-spacing: 0; }

    /* ═══ SLIDER ═══ */
    .cb-slider { display: flex; flex-direction: column; gap: var(--cds-spacing-03);
      font-family: ${CARBON_FONT}; font-size: 12px; letter-spacing: 0.32px; color: var(--cds-text-primary); }
    .cb-slider-track { position: relative; height: 4px; background: var(--cds-border-subtle-01); border-radius: 0; cursor: pointer; }
    .cb-slider-fill { position: absolute; left: 0; top: 0; height: 100%; background: var(--cds-interactive); }
    .cb-slider-thumb { position: absolute; top: 50%; width: 14px; height: 14px;
      background: var(--cds-interactive); border-radius: 50%; transform: translate(-50%, -50%);
      border: 1px solid var(--cds-interactive); }

    /* ═══ LOADING ═══ */
    .cb-loading { width: 44px; height: 44px; border: 2px solid var(--cds-border-subtle-01);
      border-top-color: var(--cds-interactive); border-radius: 50%;
      animation: cb-spin 0.7s linear infinite; }
    .cb-loading-sm { width: 16px; height: 16px; border-width: 1.5px; }
    @keyframes cb-spin { to { transform: rotate(360deg); } }

    /* ═══ SKELETON ═══ */
    .cb-skeleton { background: var(--cds-skeleton-element); animation: cb-pulse 1.5s ease-in-out infinite; border-radius: 0; }
    @keyframes cb-pulse { 50% { opacity: 0.55; } }

    /* ═══ CONTENT SWITCHER ═══ */
    .cb-switcher { display: inline-flex; border: 1px solid var(--cds-border-strong-01); background: transparent; }
    .cb-switcher-btn { padding: 0 var(--cds-spacing-05); height: 40px; font-family: ${CARBON_FONT};
      font-size: 14px; letter-spacing: 0.16px;
      background: transparent; color: var(--cds-text-secondary); border: 0; cursor: pointer;
      border-right: 1px solid var(--cds-border-strong-01); }
    .cb-switcher-btn:last-child { border-right: 0; }
    .cb-switcher-btn.active { background: var(--cds-text-primary); color: var(--cds-text-inverse); }

    /* ═══ PAGINATION ═══ */
    .cb-pagination { display: flex; align-items: center; justify-content: space-between;
      padding: 0 var(--cds-spacing-05); height: 40px; font-family: ${CARBON_FONT}; font-size: 12px; letter-spacing: 0.32px;
      color: var(--cds-text-primary); border-top: 1px solid var(--cds-border-subtle-01);
      background: var(--cds-layer-01); }

    /* ═══ INLINE LOADING / FILE UPLOADER / POPOVER ═══ */
    .cb-popover { background: var(--cds-layer-02); border: 1px solid var(--cds-border-subtle-01);
      padding: var(--cds-spacing-04) var(--cds-spacing-05); box-shadow: var(--cds-shadow-floating); font-family: ${CARBON_FONT};
      font-size: 12px; letter-spacing: 0.32px; color: var(--cds-text-primary); }

    /* ═══ HEADER / SIDE NAV (UI Shell) ═══ */
    .cb-header { height: 48px; background: var(--cds-background-inverse); color: #ffffff;
      display: flex; align-items: center; font-family: ${CARBON_FONT}; border-bottom: 1px solid ${GRAY_80};
      padding: 0 var(--cds-spacing-05); }
    .cb-sidenav { width: 240px; background: var(--cds-layer-01); font-family: ${CARBON_FONT}; }
    .cb-sidenav-item { padding: var(--cds-spacing-04) var(--cds-spacing-05); color: var(--cds-text-secondary); font-size: 14px;
      cursor: pointer; border-left: 3px solid transparent; }
    .cb-sidenav-item:hover { background: var(--cds-layer-hover-01); color: var(--cds-text-primary); }
    .cb-sidenav-item.active { border-left-color: var(--cds-interactive);
      background: var(--cds-layer-hover-01); color: var(--cds-text-primary); font-weight: 600; }
  `;
}

/* ──────────────────────────────────────────────
   ICON - native Carbon icons via @carbon/icons-react.
   ──────────────────────────────────────────────
   CIcon keeps its existing call signature (a string `name`) so
   demo code doesn't need rewriting. Names map to Carbon's icon
   exports - either directly (Carbon naming: "ChevronDown") or via
   a short Material-Symbols → Carbon alias table for legacy demo
   strings like "chevron_down", "expand_more", "check_circle". */
import * as CarbonIcons from "@carbon/icons-react";

const CARBON_ICON_ALIASES = {
  /* Material Symbols names used in the existing demo strings.
     Every alias resolves to a real @carbon/icons-react export. */
  search: "Search",
  add: "Add",
  close: "Close",
  check: "Checkmark",
  check_circle: "CheckmarkFilled",
  cancel: "ErrorFilled",
  error: "ErrorFilled",
  warning: "WarningFilled",
  info: "Information",
  settings: "Settings",
  person: "User",
  home: "Home",
  menu: "Menu",
  delete: "TrashCan",
  edit: "Edit",
  download: "Download",
  filter_alt: "Filter",
  save: "Save",
  notifications: "Notification",
  bookmark: "Bookmark",
  arrow_forward: "ArrowRight",
  arrow_back: "ArrowLeft",
  arrow_upward: "ArrowUp",
  arrow_downward: "ArrowDown",
  chevron_left: "ChevronLeft",
  chevron_right: "ChevronRight",
  chevron_up: "ChevronUp",
  chevron_down: "ChevronDown",
  expand_more: "ChevronDown",
  expand_less: "ChevronUp",
  remove: "Subtract",
  calendar_today: "Calendar",
  more_horiz: "OverflowMenuHorizontal",
  more_vert: "OverflowMenuVertical",
};

export const CIcon = ({ name, size = 16, color, ...rest }) => {
  /* Accept either an explicit Carbon name (e.g. "ChevronDown") or a
     Material Symbols legacy string (e.g. "expand_more"). */
  const resolved = CARBON_ICON_ALIASES[name] || name;
  const IconComp = CarbonIcons[resolved];
  if (!IconComp) {
    /* Unknown icon - render a sized placeholder so layout stays
       stable instead of crashing the preview. */
    return <span style={{ display: "inline-block", width: size, height: size }} aria-hidden="true" />;
  }
  return (
    <IconComp
      size={size}
      aria-hidden="true"
      style={{ color: color || T.iconPrimary, verticalAlign: "middle", flexShrink: 0 }}
      {...rest}
    />
  );
};

/* ──────────────────────────────────────────────
   SHARED DEMO HELPERS
   ────────────────────────────────────────────── */
const Row = ({ gap = 8, wrap = true, children, style }) => (
  <div style={{ display: "flex", alignItems: "center", gap, flexWrap: wrap ? "wrap" : "nowrap", ...style }}>{children}</div>
);
const Col = ({ gap = 12, children, style }) => (
  <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>{children}</div>
);
const Section = ({ title, children }) => (
  <div style={{ marginBottom: 16 }}>
    {title && <div style={{ fontSize: 12, fontWeight: 600, color: T.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4, fontFamily: CARBON_FONT }}>{title}</div>}
    {children}
  </div>
);

/* ──────────────────────────────────────────────
   FULL-SIZE DEMO RENDERERS (component detail view)
   Each returns a meaningful Carbon-styled UI.
   ────────────────────────────────────────────── */
function DLColor() {
  const tokens = [
    ["$background", T.background],
    ["$layer-01", T.layer01],
    ["$layer-accent", T.layerAccent01],
    ["$field-01", T.field01],
    ["$border-subtle-01", T.borderSubtle01],
    ["$border-strong-01", T.borderStrong01],
    ["$text-primary", T.textPrimary],
    ["$text-secondary", T.textSecondary],
    ["$interactive", T.interactive],
    ["$link-primary", T.linkPrimary],
    ["$support-error", T.supportError],
    ["$support-success", T.supportSuccess],
    ["$support-warning", T.supportWarning],
    ["$support-info", T.supportInfo],
    ["$highlight", T.highlight],
  ];
  return (
    <div style={{ fontFamily: CARBON_FONT }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
        {tokens.map(([name, val]) => (
          <div key={name} style={{ background: T.layer01, padding: 12, borderBottom: `1px solid ${T.borderSubtle01}` }}>
            <div style={{ height: 40, background: val, border: `1px solid ${T.borderSubtle01}`, marginBottom: 8 }} />
            <div style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: T.textPrimary }}>{name}</div>
            <div style={{ fontSize: 11, color: T.textSecondary, fontFamily: "'IBM Plex Mono', monospace" }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DLTypography() {
  const scale = [
    { label: "$display-01", fs: 42, weight: 300, lh: 52, use: "Marketing display" },
    { label: "$heading-04", fs: 28, weight: 400, lh: 36, use: "Section heading" },
    { label: "$heading-03", fs: 20, weight: 400, lh: 28, use: "Subsection" },
    { label: "$heading-01", fs: 14, weight: 600, lh: 20, use: "Card heading" },
    { label: "$body-02", fs: 16, weight: 400, lh: 24, use: "Expressive body" },
    { label: "$body-01", fs: 14, weight: 400, lh: 20, use: "Productive body" },
    { label: "$helper-text-01", fs: 12, weight: 400, lh: 16, use: "Helper" },
    { label: "$label-01", fs: 12, weight: 400, lh: 16, use: "Input label" },
  ];
  return (
    <Col gap={16}>
      {scale.map((s) => (
        <div key={s.label} style={{ fontFamily: CARBON_FONT, color: T.textPrimary, borderBottom: `1px solid ${T.borderSubtle01}`, paddingBottom: 12 }}>
          <div style={{ fontSize: s.fs, fontWeight: s.weight, lineHeight: `${s.lh}px` }}>The quick brown fox</div>
          <div style={{ fontSize: 11, color: T.textSecondary, fontFamily: "'IBM Plex Mono', monospace", marginTop: 4 }}>
            {s.label} / {s.fs}px / {s.weight} / {s.lh}px lh — {s.use}
          </div>
        </div>
      ))}
    </Col>
  );
}

function DLSpacing() {
  const steps = [
    ["01", 2], ["02", 4], ["03", 8], ["04", 12], ["05", 16],
    ["06", 24], ["07", 32], ["08", 40], ["09", 48], ["10", 64],
  ];
  return (
    <Col gap={8}>
      {steps.map(([t, px]) => (
        <Row key={t} gap={16}>
          <span style={{ width: 100, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: T.textPrimary }}>$spacing-{t}</span>
          <div style={{ width: px, height: 16, background: T.interactive }} />
          <span style={{ fontSize: 12, color: T.textSecondary }}>{px}px / {(px / 16).toFixed(3)}rem</span>
        </Row>
      ))}
    </Col>
  );
}

function DLElevation() {
  const levels = [
    { name: "$shadow-raised", shadow: T.shadowRaised, use: "Tile hover" },
    { name: "$shadow-floating", shadow: T.shadowFloating, use: "Menu / tooltip" },
  ];
  return (
    <Row gap={24}>
      {levels.map((l) => (
        <div key={l.name} style={{ width: 180, height: 96, background: T.layer01, boxShadow: l.shadow, padding: 16, fontFamily: CARBON_FONT }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>{l.name}</div>
          <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 4 }}>{l.use}</div>
        </div>
      ))}
    </Row>
  );
}

function DLIcons() {
  const icons = ["search", "add", "close", "check", "settings", "person", "home", "menu", "arrow_forward", "download", "filter_alt", "info", "notifications", "bookmark", "delete", "edit"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: 12 }}>
      {icons.map((n) => (
        <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 12, background: T.layer01 }}>
          <CIcon name={n} size={24} color={T.iconPrimary} />
          <span style={{ fontSize: 11, color: T.textSecondary, fontFamily: CARBON_FONT }}>{n}</span>
        </div>
      ))}
    </div>
  );
}

function DLTokens() {
  const tokens = [
    ["$interactive", T.interactive, "Brand interactive"],
    ["$background", T.background, "Page canvas"],
    ["$layer-01", T.layer01, "First layer up"],
    ["$text-primary", T.textPrimary, "Default text"],
    ["$text-secondary", T.textSecondary, "Secondary text"],
    ["$text-placeholder", T.textPlaceholder, "Input placeholder"],
    ["$border-subtle-01", T.borderSubtle01, "Subtle divider"],
    ["$border-strong-01", T.borderStrong01, "Strong divider"],
    ["$focus", T.focus, "Focus ring"],
    ["$highlight", T.highlight, "Selection background"],
  ];
  return (
    <div style={{ fontFamily: CARBON_FONT }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: T.layerAccent01 }}>
            <th style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Token</th>
            <th style={{ textAlign: "left", padding: 12, fontWeight: 600, width: 80 }}>Preview</th>
            <th style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Role</th>
            <th style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map(([n, v, use]) => (
            <tr key={n} style={{ borderBottom: `1px solid ${T.borderSubtle01}` }}>
              <td style={{ padding: 12, fontFamily: "'IBM Plex Mono', monospace" }}>{n}</td>
              <td style={{ padding: 12 }}><div style={{ width: 24, height: 16, background: v, border: `1px solid ${T.borderSubtle01}` }} /></td>
              <td style={{ padding: 12, color: T.textSecondary }}>{use}</td>
              <td style={{ padding: 12, fontFamily: "'IBM Plex Mono', monospace", color: T.textSecondary }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DLDensity() {
  const sizes = [
    ["Small", 32, 12], ["Medium", 40, 14], ["Large", 48, 14], ["XL", 64, 14], ["2XL", 80, 14],
  ];
  return (
    <Col gap={12}>
      {sizes.map(([name, h, fs]) => (
        <Row key={name} gap={16}>
          <span style={{ width: 60, fontSize: 12, color: T.textSecondary, fontFamily: CARBON_FONT }}>{name}</span>
          <button style={{ height: h, padding: h >= 64 ? "14px 16px" : "0 64px 0 16px", background: T.interactive, color: "#ffffff", border: 0, fontFamily: CARBON_FONT, fontSize: fs, cursor: "pointer", display: "inline-flex", alignItems: h >= 64 ? "flex-start" : "center" }}>
            Button
          </button>
          <span style={{ fontSize: 12, color: T.textSecondary, fontFamily: CARBON_FONT }}>{h}px</span>
        </Row>
      ))}
    </Col>
  );
}

function DLAccessibility() {
  return (
    <Col gap={12}>
      <div style={{ fontFamily: CARBON_FONT, fontSize: 14, color: T.textPrimary }}>
        Carbon ships to <strong>WCAG 2.1 Level AA</strong>. Every component meets:
      </div>
      <Col gap={8}>
        {[
          ["4.5:1 minimum contrast for text on all four themes"],
          ["3:1 minimum contrast for UI components (buttons, inputs)"],
          ["Focus ring: 2px $focus inset + 2px $focus-inset offset"],
          ["44×44px minimum touch target on mobile breakpoints"],
          ["aria-label on icon-only buttons, aria-hidden on decorative svg"],
          ["Keyboard navigation with visible focus state"],
          ["prefers-reduced-motion respected (no auto-play, no parallax)"],
        ].map(([txt]) => (
          <Row key={txt} gap={8}>
            <CIcon name="check_circle" size={16} color={T.supportSuccess} />
            <span style={{ fontFamily: CARBON_FONT, fontSize: 13, color: T.textPrimary }}>{txt}</span>
          </Row>
        ))}
      </Col>
    </Col>
  );
}

function DLMotion() {
  const durations = [
    ["$duration-fast-01", "70ms", "Button hover, focus"],
    ["$duration-fast-02", "110ms", "Menu open, toggle"],
    ["$duration-moderate-01", "150ms", "Panel slide"],
    ["$duration-moderate-02", "240ms", "Modal entrance"],
    ["$duration-slow-01", "400ms", "Expressive transition"],
    ["$duration-slow-02", "700ms", "Large motion (rare)"],
  ];
  return (
    <Col gap={6}>
      {durations.map(([n, d, use]) => (
        <Row key={n} gap={12} style={{ paddingBottom: 8, borderBottom: `1px solid ${T.borderSubtle01}` }}>
          <span style={{ width: 200, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: T.textPrimary }}>{n}</span>
          <span style={{ width: 60, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: T.textSecondary }}>{d}</span>
          <span style={{ fontSize: 12, color: T.textSecondary, fontFamily: CARBON_FONT }}>{use}</span>
        </Row>
      ))}
    </Col>
  );
}

function DLShape() {
  return (
    <Col gap={12}>
      <div style={{ fontFamily: CARBON_FONT, fontSize: 14, color: T.textPrimary }}>
        Carbon corners are <strong>flat (0px)</strong> on all core controls. Rounded corners are reserved for:
      </div>
      <Row gap={16}>
        <div style={{ background: T.layer01, padding: "12px 16px", fontFamily: CARBON_FONT, fontSize: 14, color: T.textPrimary }}>Button (0)</div>
        <span className="cb-tag cb-tag-blue" style={{ borderRadius: 16 }}>Tag (16)</span>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.interactive }} />
      </Row>
    </Col>
  );
}

/* ───── Component demos ───── */
function ButtonsDemo() {
  return (
    <Col gap={24}>
      <Section title="Kinds">
        <Row>
          <button className="cb-btn cb-btn-primary">Primary</button>
          <button className="cb-btn cb-btn-secondary">Secondary</button>
          <button className="cb-btn cb-btn-tertiary">Tertiary</button>
          <button className="cb-btn cb-btn-ghost">Ghost</button>
          <button className="cb-btn cb-btn-danger">Danger</button>
        </Row>
      </Section>
      <Section title="Sizes">
        <Row>
          <button className="cb-btn cb-btn-primary cb-btn-xs">XS 24px</button>
          <button className="cb-btn cb-btn-primary cb-btn-sm">Small 32px</button>
          <button className="cb-btn cb-btn-primary cb-btn-md">Medium 40px</button>
          <button className="cb-btn cb-btn-primary cb-btn-lg">Large 48px</button>
          <button className="cb-btn cb-btn-primary cb-btn-xl">XL 64px</button>
          <button className="cb-btn cb-btn-primary cb-btn-2xl">2XL 80px</button>
        </Row>
      </Section>
      <Section title="With icon">
        <Row>
          <button className="cb-btn cb-btn-primary">Save <CIcon name="save" size={16} color="#ffffff" /></button>
          <button className="cb-btn cb-btn-tertiary">Download <CIcon name="download" size={16} color={T.interactive} /></button>
          <button className="cb-btn cb-btn-ghost">Learn more <CIcon name="arrow_forward" size={16} color={T.linkPrimary} /></button>
        </Row>
      </Section>
    </Col>
  );
}

function IconButtonsDemo() {
  return (
    <Row>
      {["search", "add", "settings", "notifications", "person", "close", "delete", "filter_alt"].map((n) => (
        <button key={n} className="cb-btn cb-btn-ghost cb-btn-icon" aria-label={n}>
          <CIcon name={n} size={16} color={T.iconPrimary} />
        </button>
      ))}
    </Row>
  );
}

function InputsDemo() {
  const [a, setA] = useState("");
  return (
    <Col gap={16}>
      <div className="cb-input-wrap">
        <label className="cb-input-label">Work email</label>
        <input className="cb-input" placeholder="name@company.com" value={a} onChange={(e) => setA(e.target.value)} />
        <span className="cb-input-helper">We&apos;ll never share your email.</span>
      </div>
      <div className="cb-input-wrap">
        <label className="cb-input-label">Small (32px)</label>
        <input className="cb-input cb-input-sm" placeholder="Small input" />
      </div>
      <div className="cb-input-wrap">
        <label className="cb-input-label">Large (48px)</label>
        <input className="cb-input cb-input-lg" placeholder="Large input" />
      </div>
      <div className="cb-input-wrap">
        <label className="cb-input-label">Invalid state</label>
        <input className="cb-input error" placeholder="name@company.com" />
        <span className="cb-input-error-msg">Invalid email format.</span>
      </div>
      <div className="cb-input-wrap">
        <label className="cb-input-label">Message</label>
        <textarea className="cb-input cb-textarea" placeholder="Type a longer response..." />
      </div>
    </Col>
  );
}

function SearchDemo() {
  return (
    <div className="cb-input-wrap" style={{ maxWidth: 400 }}>
      <label className="cb-input-label">Search components</label>
      <div className="cb-search-wrap">
        <span className="cb-search-icon"><CIcon name="search" size={16} /></span>
        <input className="cb-input" placeholder="Find components" />
      </div>
    </div>
  );
}

function CheckboxesDemo() {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  return (
    <Col>
      <label className="cb-checkbox" onClick={() => setA((v) => !v)}>
        <span className={`cb-cb-box${a ? " checked" : ""}`} /> Subscribe to newsletter
      </label>
      <label className="cb-checkbox" onClick={() => setB((v) => !v)}>
        <span className={`cb-cb-box${b ? " checked" : ""}`} /> Receive product updates
      </label>
      <label className="cb-checkbox disabled">
        <span className="cb-cb-box" /> Disabled option
      </label>
    </Col>
  );
}

function RadiosDemo() {
  const [sel, setSel] = useState("md");
  return (
    <Col>
      <div style={{ fontSize: 12, color: T.textSecondary, fontFamily: CARBON_FONT, marginBottom: 4 }}>Select a size</div>
      {[["sm", "Small"], ["md", "Medium"], ["lg", "Large"], ["xl", "Extra large"]].map(([k, lbl]) => (
        <label key={k} className="cb-radio" onClick={() => setSel(k)}>
          <span className={`cb-radio-circle${sel === k ? " checked" : ""}`} /> {lbl}
        </label>
      ))}
    </Col>
  );
}

function TogglesDemo() {
  const [on, setOn] = useState(true);
  return (
    <Col>
      <div className={`cb-toggle${on ? " on" : ""}`} onClick={() => setOn((v) => !v)}>
        <span className="cb-toggle-track"><span className="cb-toggle-thumb" /></span>
        Email notifications
      </div>
      <div className="cb-toggle">
        <span className="cb-toggle-track"><span className="cb-toggle-thumb" /></span>
        SMS alerts (off)
      </div>
    </Col>
  );
}

function TabsDemo() {
  const [i, setI] = useState(0);
  const tabs = ["Overview", "Usage", "Style", "Accessibility", "Code"];
  return (
    <Col>
      <div className="cb-tabs">
        {tabs.map((t, idx) => (
          <button key={t} className={`cb-tab${idx === i ? " active" : ""}`} onClick={() => setI(idx)}>{t}</button>
        ))}
      </div>
      <div style={{ padding: "16px 0", fontFamily: CARBON_FONT, fontSize: 14, color: T.textSecondary }}>
        {tabs[i]} panel content — Carbon tabs live above their associated panels and use a 2px interactive underline.
      </div>
    </Col>
  );
}

function TagsDemo() {
  return (
    <Col gap={16}>
      <Section title="Types">
        <Row>
          <span className="cb-tag cb-tag-gray">Gray</span>
          <span className="cb-tag cb-tag-blue">Blue</span>
          <span className="cb-tag cb-tag-green">Green</span>
          <span className="cb-tag cb-tag-yellow">Yellow</span>
          <span className="cb-tag cb-tag-red">Red</span>
        </Row>
      </Section>
      <Section title="With close">
        <Row>
          <span className="cb-tag cb-tag-blue">
            Filter: Active
            <CIcon name="close" size={14} color={T.interactive} />
          </span>
        </Row>
      </Section>
    </Col>
  );
}

function TilesDemo() {
  const [sel, setSel] = useState(0);
  return (
    <Row gap={16}>
      {[
        { title: "MRR", value: "$48,200", delta: "+12%", pos: true },
        { title: "Active users", value: "12,847", delta: "+8%", pos: true },
        { title: "Churn", value: "2.1%", delta: "-3%", pos: false },
      ].map((c, i) => (
        <div
          key={c.title}
          className={`cb-tile cb-tile-clickable cb-tile-selectable${sel === i ? " selected" : ""}`}
          onClick={() => setSel(i)}
          style={{ minWidth: 200 }}
        >
          <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 8 }}>{c.title}</div>
          <div style={{ fontSize: 28, fontWeight: 400, lineHeight: "36px" }}>{c.value}</div>
          <div style={{ fontSize: 12, color: c.pos ? T.supportSuccess : T.supportError, marginTop: 4 }}>{c.delta}</div>
        </div>
      ))}
    </Row>
  );
}

function NotificationsDemo() {
  return (
    <Col>
      <div className="cb-notif cb-notif-success">
        <CIcon name="check_circle" size={16} color={T.supportSuccess} />
        <div className="cb-notif-body">
          <div className="cb-notif-title">Deployment succeeded</div>
          <div className="cb-notif-sub">Production is now serving v2.4.</div>
        </div>
      </div>
      <div className="cb-notif cb-notif-warning">
        <CIcon name="warning" size={16} color={T.supportWarning} />
        <div className="cb-notif-body">
          <div className="cb-notif-title">Upcoming maintenance</div>
          <div className="cb-notif-sub">System will be offline for 30 minutes on Sunday 03:00 UTC.</div>
        </div>
      </div>
      <div className="cb-notif cb-notif-error">
        <CIcon name="error" size={16} color={T.supportError} />
        <div className="cb-notif-body">
          <div className="cb-notif-title">Couldn&apos;t save</div>
          <div className="cb-notif-sub">Check your connection and try again.</div>
        </div>
      </div>
      <div className="cb-notif cb-notif-info">
        <CIcon name="info" size={16} color={T.supportInfo} />
        <div className="cb-notif-body">
          <div className="cb-notif-title">New version available</div>
          <div className="cb-notif-sub">@carbon/react 1.106 ships new Popover variants.</div>
        </div>
      </div>
    </Col>
  );
}

function ProgressDemo() {
  return (
    <Col gap={16}>
      <div className="cb-progress">
        <div className="cb-progress-label">
          <span>Uploading file</span>
          <span style={{ color: T.textSecondary }}>64%</span>
        </div>
        <div className="cb-progress-track"><div className="cb-progress-fill" style={{ width: "64%" }} /></div>
      </div>
      <div className="cb-progress">
        <div className="cb-progress-label">
          <span>Processing</span>
          <span style={{ color: T.textSecondary }}>34%</span>
        </div>
        <div className="cb-progress-track"><div className="cb-progress-fill" style={{ width: "34%" }} /></div>
      </div>
    </Col>
  );
}

function LoadingDemo() {
  return (
    <Row gap={24}>
      <div className="cb-loading" role="status" aria-label="Loading large" />
      <div className="cb-loading cb-loading-sm" role="status" aria-label="Loading small" />
    </Row>
  );
}

function AccordionDemo() {
  const [open, setOpen] = useState(0);
  const items = [
    ["What is Carbon?", "Carbon is IBM's open-source design system. It includes working code, design tools and resources, and a vibrant community of contributors."],
    ["How do I install it?", "npm install @carbon/react. The package ships with SCSS you import alongside the React components."],
    ["Is it accessible?", "Yes. Carbon components ship with WCAG 2.1 AA compliance across colour contrast, focus, keyboard nav, and screen reader semantics."],
  ];
  return (
    <div className="cb-accordion">
      {items.map(([q, a], i) => (
        <div key={q} className="cb-accordion-item">
          <div className="cb-accordion-head" onClick={() => setOpen(open === i ? -1 : i)}>
            <span>{q}</span>
            <CIcon name={open === i ? "chevron_up" : "chevron_down"} size={16} color={T.iconPrimary} />
          </div>
          {open === i && <div className="cb-accordion-body">{a}</div>}
        </div>
      ))}
    </div>
  );
}

function BreadcrumbsDemo() {
  return (
    <nav className="cb-crumb" aria-label="Breadcrumb">
      <a>Home</a>
      <span className="cb-crumb-sep">/</span>
      <a>Components</a>
      <span className="cb-crumb-sep">/</span>
      <span className="cb-crumb-current">Button</span>
    </nav>
  );
}

function DataTableDemo() {
  const rows = [
    { name: "Jane Doe", status: "Active", role: "Admin", last: "2 hrs ago" },
    { name: "John Smith", status: "Pending", role: "Editor", last: "Yesterday" },
    { name: "Alice Jones", status: "Active", role: "Viewer", last: "5 mins ago" },
    { name: "Marcus Rivera", status: "Inactive", role: "Viewer", last: "3 days ago" },
  ];
  return (
    <table className="cb-table">
      <thead>
        <tr><th>Name</th><th>Status</th><th>Role</th><th>Last active</th></tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name}>
            <td>{r.name}</td>
            <td>
              <span className={`cb-tag cb-tag-${r.status === "Active" ? "green" : r.status === "Pending" ? "yellow" : "gray"}`}>
                {r.status}
              </span>
            </td>
            <td>{r.role}</td>
            <td style={{ color: T.textSecondary }}>{r.last}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StructuredListDemo() {
  return (
    <table className="cb-table">
      <thead>
        <tr><th>Release</th><th>Notes</th></tr>
      </thead>
      <tbody>
        <tr><td>v2.4</td><td style={{ color: T.textSecondary }}>Added Popover, AI-enhanced components.</td></tr>
        <tr><td>v2.3</td><td style={{ color: T.textSecondary }}>TreeView GA. UI Shell updates.</td></tr>
        <tr><td>v2.2</td><td style={{ color: T.textSecondary }}>ContentSwitcher default style refresh.</td></tr>
      </tbody>
    </table>
  );
}

function PaginationDemo() {
  return (
    <div className="cb-pagination">
      <span style={{ color: T.textSecondary }}>Items per page: 10</span>
      <span style={{ color: T.textSecondary }}>1 - 10 of 247</span>
      <Row>
        <button className="cb-btn cb-btn-ghost cb-btn-icon" aria-label="Prev"><CIcon name="chevron_left" size={16} /></button>
        <span style={{ color: T.textPrimary, fontSize: 12, padding: "0 8px" }}>1 of 25</span>
        <button className="cb-btn cb-btn-ghost cb-btn-icon" aria-label="Next"><CIcon name="chevron_right" size={16} /></button>
      </Row>
    </div>
  );
}

function ModalDemo() {
  return (
    <div className="cb-modal" role="dialog" aria-label="Delete confirmation">
      <div className="cb-modal-header">
        <div className="cb-modal-label">Danger zone</div>
        <div className="cb-modal-title">Delete this project?</div>
      </div>
      <div className="cb-modal-body">
        This permanently removes the project and all deployments. This action cannot be undone.
      </div>
      <div className="cb-modal-footer">
        <button className="cb-btn cb-btn-secondary">Cancel</button>
        <button className="cb-btn cb-btn-danger">Delete</button>
      </div>
    </div>
  );
}

function TooltipDemo() {
  return (
    <div style={{ padding: 24, display: "flex", gap: 16 }}>
      <div className="cb-tooltip">
        <button className="cb-btn cb-btn-ghost cb-btn-icon"><CIcon name="info" size={16} color={T.iconPrimary} /></button>
        <span className="cb-tooltip-bubble">Tooltips provide additional context</span>
      </div>
      <div className="cb-tooltip">
        <span style={{ textDecoration: "underline dotted", cursor: "help", fontFamily: CARBON_FONT, fontSize: 14, color: T.textPrimary }}>
          Hover term
        </span>
        <span className="cb-tooltip-bubble">Definition tooltip</span>
      </div>
    </div>
  );
}

function AvatarsDemo() {
  return (
    <Row gap={12}>
      <div className="cb-avatar cb-avatar-sm">JD</div>
      <div className="cb-avatar">JD</div>
      <div className="cb-avatar cb-avatar-lg">JD</div>
      <div className="cb-avatar" style={{ background: T.supportSuccess }}>AK</div>
      <div className="cb-avatar" style={{ background: T.supportWarning, color: T.textPrimary }}>RW</div>
      <div className="cb-avatar" style={{ background: T.supportError }}>MZ</div>
    </Row>
  );
}

function LinksDemo() {
  return (
    <Col>
      <a className="cb-link">Read the documentation</a>
      <a className="cb-link cb-link-visited">Visited link</a>
      <span style={{ fontFamily: CARBON_FONT, fontSize: 14, color: T.textPrimary }}>
        Inline <a className="cb-link cb-link-inline">Carbon Design System</a> link inside body text.
      </span>
    </Col>
  );
}

function SliderDemo() {
  const [v, setV] = useState(40);
  return (
    <div className="cb-slider" style={{ maxWidth: 400 }}>
      <Row>
        <span style={{ fontFamily: CARBON_FONT, fontSize: 12, color: T.textPrimary }}>Volume</span>
        <span style={{ marginLeft: "auto", color: T.textSecondary, fontFamily: CARBON_FONT }}>{v}</span>
      </Row>
      <div
        className="cb-slider-track"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setV(Math.max(0, Math.min(100, Math.round(((e.clientX - r.left) / r.width) * 100))));
        }}
      >
        <div className="cb-slider-fill" style={{ width: `${v}%` }} />
        <span className="cb-slider-thumb" style={{ left: `${v}%` }} />
      </div>
    </div>
  );
}

function DropdownDemo() {
  return (
    <div className="cb-input-wrap" style={{ maxWidth: 320 }}>
      <label className="cb-input-label">Choose a region</label>
      <div className="cb-dropdown-trigger">
        <span>North America (AMER)</span>
        <CIcon name="expand_more" size={16} color={T.iconPrimary} />
      </div>
    </div>
  );
}

function ContentSwitcherDemo() {
  const [i, setI] = useState(0);
  const opts = ["All", "Active", "Archived"];
  return (
    <div className="cb-switcher">
      {opts.map((o, idx) => (
        <button key={o} className={`cb-switcher-btn${idx === i ? " active" : ""}`} onClick={() => setI(idx)}>
          {o}
        </button>
      ))}
    </div>
  );
}

function SkeletonDemo() {
  return (
    <Col gap={12} style={{ width: 320 }}>
      <div className="cb-skeleton" style={{ height: 24, width: "60%" }} />
      <div className="cb-skeleton" style={{ height: 16, width: "90%" }} />
      <div className="cb-skeleton" style={{ height: 16, width: "75%" }} />
      <Row gap={8}><div className="cb-skeleton" style={{ height: 32, width: 100 }} /><div className="cb-skeleton" style={{ height: 32, width: 100 }} /></Row>
    </Col>
  );
}

function PopoverDemo() {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button className="cb-btn cb-btn-tertiary">Anchor</button>
      <div className="cb-popover" style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, minWidth: 200 }}>
        <div style={{ fontWeight: 600, marginBottom: 4, color: T.textPrimary, fontSize: 12 }}>Popover title</div>
        <div style={{ color: T.textSecondary, fontSize: 12 }}>Context-rich content anchored to a trigger.</div>
      </div>
    </div>
  );
}

/* ───── Patterns ───── */
function PatDashboard() {
  return (
    <Col gap={16}>
      <TilesDemo />
      <DataTableDemo />
      <PaginationDemo />
    </Col>
  );
}

function PatForm() {
  return (
    <Col gap={16} style={{ maxWidth: 480 }}>
      <InputsDemo />
      <Row>
        <button className="cb-btn cb-btn-secondary">Cancel</button>
        <button className="cb-btn cb-btn-primary">Save changes</button>
      </Row>
    </Col>
  );
}

function PatAppShell() {
  return (
    <div style={{ fontFamily: CARBON_FONT, border: `1px solid ${T.borderSubtle01}`, height: 280 }}>
      <div className="cb-header" style={{ color: "#ffffff" }}>
        <strong style={{ marginRight: 8 }}>IBM</strong> Design Hub
        <span style={{ marginLeft: "auto", color: GRAY_30, fontSize: 14 }}>v2.4</span>
      </div>
      <div style={{ display: "flex", height: "calc(100% - 48px)" }}>
        <div className="cb-sidenav" style={{ width: 200, borderRight: `1px solid ${T.borderSubtle01}` }}>
          {[["Home", true], ["Deploy", false], ["Logs", false], ["Settings", false]].map(([l, a]) => (
            <div key={l} className={`cb-sidenav-item${a ? " active" : ""}`}>{l}</div>
          ))}
        </div>
        <div style={{ flex: 1, padding: 24, background: T.background, color: T.textSecondary, fontSize: 14 }}>Main content area</div>
      </div>
    </div>
  );
}

function PatLogin() {
  return (
    <div style={{ maxWidth: 360, fontFamily: CARBON_FONT }}>
      <div style={{ fontSize: 32, fontWeight: 400, color: T.textPrimary, marginBottom: 12 }}>Log in</div>
      <div style={{ fontSize: 14, color: T.textSecondary, marginBottom: 24 }}>Enter your IBMid to continue.</div>
      <Col gap={16}>
        <div className="cb-input-wrap">
          <label className="cb-input-label">IBMid</label>
          <input className="cb-input" placeholder="name@example.com" />
        </div>
        <div className="cb-input-wrap">
          <label className="cb-input-label">Password</label>
          <input className="cb-input" type="password" placeholder="••••••••" />
        </div>
        <button className="cb-btn cb-btn-primary" style={{ width: "100%", justifyContent: "space-between" }}>
          Continue <CIcon name="arrow_forward" size={16} color="#ffffff" />
        </button>
        <a className="cb-link">Forgot your IBMid?</a>
      </Col>
    </div>
  );
}

function PatListDetail() {
  const [sel, setSel] = useState(0);
  const items = ["Project Apollo", "Project Zeus", "Project Hermes"];
  return (
    <div style={{ display: "flex", border: `1px solid ${T.borderSubtle01}`, height: 280, fontFamily: CARBON_FONT }}>
      <div style={{ width: 200, borderRight: `1px solid ${T.borderSubtle01}`, background: T.layer01 }}>
        {items.map((n, i) => (
          <div key={n} onClick={() => setSel(i)} style={{ padding: "12px 16px", cursor: "pointer", fontSize: 14, background: i === sel ? T.layerHover01 : "transparent", borderLeft: i === sel ? `3px solid ${T.interactive}` : "3px solid transparent", color: T.textPrimary }}>
            {n}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 400, color: T.textPrimary }}>{items[sel]}</div>
        <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 4 }}>Last updated 3 hours ago</div>
        <div style={{ fontSize: 14, color: T.textPrimary, marginTop: 16 }}>Detail pane content for the selected list item.</div>
      </div>
    </div>
  );
}

function PatSearch() {
  return (
    <Col gap={16}>
      <SearchDemo />
      <Row>
        <span className="cb-tag cb-tag-blue">
          Category: Foundations
          <CIcon name="close" size={14} color={T.interactive} />
        </span>
        <span className="cb-tag cb-tag-gray">
          Type: Component
          <CIcon name="close" size={14} color={T.textSecondary} />
        </span>
      </Row>
      <StructuredListDemo />
    </Col>
  );
}

/* ══════════════════════════════════════════════════════════
   PREVIEWS - Compact thumbnails for the landing grid
   ══════════════════════════════════════════════════════════
   Sized to fit ~150px square cards. Every entry in COMPS has
   a matching preview so the grid renders cleanly. */
const PREVIEWS = {
  /* Foundations */
  "dl-color": () => <Row gap={2} wrap={false} style={{ padding: "6px 0" }}>{[T.background, T.layer01, T.layerAccent01, T.textPrimary, T.interactive, T.supportSuccess, T.supportWarning, T.supportError].map((c, i) => <div key={i} style={{ width: 14, height: 14, background: c, border: `1px solid ${T.borderSubtle01}` }} />)}</Row>,
  "dl-typography": () => <div style={{ fontFamily: CARBON_FONT, padding: "6px 0" }}><span style={{ fontSize: 20, fontWeight: 300, color: T.textPrimary, lineHeight: 1 }}>Aa</span><span style={{ fontSize: 10, color: T.textSecondary, marginLeft: 6 }}>IBM Plex Sans</span></div>,
  "dl-spacing": () => <Col gap={2} style={{ padding: "6px 0" }}>{[4, 8, 16, 24, 32].map((s) => <div key={s} style={{ width: s * 2, height: 3, background: T.interactive, opacity: 0.7 }} />)}</Col>,
  "dl-elevation": () => <Row gap={6} style={{ padding: "6px 0", alignItems: "flex-end" }}>{[T.shadowRaised, T.shadowFloating].map((s, i) => <div key={i} style={{ width: 26, height: 18, background: T.layer01, boxShadow: s, border: `1px solid ${T.borderSubtle01}` }} />)}</Row>,
  "dl-icons": () => <Row gap={4} style={{ padding: "6px 0" }}>{["search", "settings", "home"].map((i) => <CIcon key={i} name={i} size={16} color={T.iconSecondary} />)}</Row>,
  "dl-tokens": () => <div style={{ fontSize: 9, color: T.textSecondary, fontFamily: "'IBM Plex Mono', monospace", padding: "6px 0", lineHeight: 1.5 }}>$interactive<br/>$layer-01<br/>$text-primary</div>,
  "dl-density": () => <Row gap={3} style={{ padding: "6px 0", alignItems: "flex-end" }}>{[16, 20, 24, 32].map((h) => <div key={h} style={{ width: 16, height: h, background: T.interactive, opacity: 0.7 }} />)}</Row>,
  "dl-a11y": () => <Row gap={4} style={{ padding: "6px 0" }}><CIcon name="check_circle" size={16} color={T.supportSuccess} /><span style={{ fontSize: 10, color: T.textSecondary, fontFamily: CARBON_FONT }}>WCAG 2.1 AA</span></Row>,
  "dl-motion": () => <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: T.textSecondary, padding: "6px 0", lineHeight: 1.5 }}>70ms fast-01<br/>240ms moderate-02</div>,
  "dl-shape": () => <Row gap={6} style={{ padding: "6px 0" }}><div style={{ width: 24, height: 16, background: T.interactive }} /><div style={{ width: 24, height: 16, background: T.interactive, borderRadius: 16 }} /><div style={{ width: 16, height: 16, background: T.interactive, borderRadius: "50%" }} /></Row>,
  tokens: () => <Row gap={2} style={{ padding: "6px 0" }}>{[T.interactive, T.textPrimary, T.background, T.supportSuccess].map((c, i) => <div key={i} style={{ width: 14, height: 14, background: c, border: `1px solid ${T.borderSubtle01}` }} />)}</Row>,
  audit: () => <Row gap={4} style={{ padding: "6px 0" }}>{["check_circle", "check_circle", "cancel"].map((n, i) => <CIcon key={i} name={n} size={12} color={i < 2 ? T.supportSuccess : T.supportError} />)}</Row>,
  /* Components */
  buttons: () => <Row gap={4}><button style={{ height: 20, padding: "0 8px", background: T.interactive, color: "#fff", border: 0, fontSize: 10, fontFamily: CARBON_FONT }}>Primary</button><button style={{ height: 20, padding: "0 8px", background: T.buttonSecondary, color: "#fff", border: 0, fontSize: 10, fontFamily: CARBON_FONT }}>Secondary</button></Row>,
  "icon-button": () => <Row gap={4}>{["search", "add", "settings"].map((n) => <div key={n} style={{ width: 22, height: 22, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}><CIcon name={n} size={14} color={T.iconPrimary} /></div>)}</Row>,
  inputs: () => <div style={{ height: 22, borderBottom: `1px solid ${T.borderStrong01}`, background: T.field01, padding: "0 8px", fontSize: 10, color: T.textPlaceholder, display: "flex", alignItems: "center", maxWidth: 130, fontFamily: CARBON_FONT }}>name@company.com</div>,
  search: () => <div style={{ height: 22, borderBottom: `1px solid ${T.borderStrong01}`, background: T.field01, padding: "0 8px 0 24px", fontSize: 10, color: T.textPlaceholder, display: "flex", alignItems: "center", position: "relative", maxWidth: 130, fontFamily: CARBON_FONT }}><span style={{ position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)", display: "inline-flex" }}><CIcon name="search" size={12} color={T.iconSecondary} /></span>Find components</div>,
  checkboxes: () => <Row gap={4}><div style={{ width: 14, height: 14, background: T.textPrimary, color: T.background, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>✓</div><div style={{ width: 14, height: 14, border: `1px solid ${T.textPrimary}` }} /></Row>,
  radios: () => <Row gap={4}><div style={{ width: 14, height: 14, borderRadius: 7, border: `1px solid ${T.textPrimary}`, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: T.textPrimary }} /></div><div style={{ width: 14, height: 14, borderRadius: 7, border: `1px solid ${T.textPrimary}` }} /></Row>,
  switches: () => <div style={{ width: 32, height: 16, borderRadius: 8, background: T.interactive, position: "relative" }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: 19 }} /></div>,
  tabs: () => <div style={{ display: "flex", borderBottom: `1px solid ${T.borderSubtle01}` }}><span style={{ fontSize: 9, color: T.textPrimary, borderBottom: `2px solid ${T.interactive}`, padding: "2px 6px", fontWeight: 600, fontFamily: CARBON_FONT }}>Tab 1</span><span style={{ fontSize: 9, color: T.textSecondary, padding: "2px 6px", fontFamily: CARBON_FONT }}>Tab 2</span></div>,
  tags: () => <Row gap={3}><span style={{ background: "#d0e2ff", color: T.interactive, fontSize: 9, padding: "1px 6px", borderRadius: 12, fontFamily: CARBON_FONT }}>Active</span><span style={{ background: T.layerAccent01, color: T.textPrimary, fontSize: 9, padding: "1px 6px", borderRadius: 12, fontFamily: CARBON_FONT }}>Default</span></Row>,
  cards: () => <div style={{ padding: 6, background: T.layer01, fontFamily: CARBON_FONT }}><div style={{ fontSize: 9, color: T.textSecondary }}>MRR</div><div style={{ fontSize: 14, fontWeight: 400, color: T.textPrimary, lineHeight: 1 }}>$48,200</div><div style={{ fontSize: 8, color: T.supportSuccess }}>+12%</div></div>,
  alerts: () => <div style={{ padding: "6px 8px", borderLeft: `3px solid ${T.supportSuccess}`, background: T.layer01, fontSize: 9, color: T.textPrimary, fontFamily: CARBON_FONT }}>Deployment succeeded</div>,
  progress: () => <div style={{ padding: "6px 0", width: 80 }}><div style={{ height: 3, background: T.borderSubtle01, overflow: "hidden" }}><div style={{ width: "64%", height: "100%", background: T.interactive }} /></div></div>,
  loading: () => <div style={{ width: 22, height: 22, border: `2px solid ${T.borderSubtle01}`, borderTopColor: T.interactive, borderRadius: "50%" }} />,
  accordion: () => <div style={{ border: `1px solid ${T.borderSubtle01}`, fontFamily: CARBON_FONT }}><div style={{ padding: "4px 6px", fontSize: 9, color: T.textPrimary, display: "flex", justifyContent: "space-between" }}>Section<span>▾</span></div></div>,
  breadcrumbs: () => <div style={{ display: "flex", gap: 3, fontSize: 9, color: T.textSecondary, fontFamily: CARBON_FONT }}><span style={{ color: T.linkPrimary }}>Home</span><span>/</span><span style={{ color: T.linkPrimary }}>Comp</span><span>/</span><span style={{ color: T.textPrimary }}>Button</span></div>,
  "data-table": () => <div style={{ border: `1px solid ${T.borderSubtle01}`, fontFamily: CARBON_FONT, fontSize: 8 }}><div style={{ padding: "3px 6px", background: T.layerAccent01, fontWeight: 600, color: T.textPrimary, borderBottom: `1px solid ${T.borderSubtle01}` }}>Name   Status</div><div style={{ padding: "3px 6px", color: T.textPrimary, borderBottom: `1px solid ${T.borderSubtle01}` }}>Jane   Active</div><div style={{ padding: "3px 6px", color: T.textPrimary }}>John   Pending</div></div>,
  "structured-list": () => <div style={{ border: `1px solid ${T.borderSubtle01}`, fontFamily: CARBON_FONT, fontSize: 8 }}><div style={{ padding: "3px 6px", color: T.textPrimary, borderBottom: `1px solid ${T.borderSubtle01}` }}>v2.4  <span style={{ color: T.textSecondary }}>Latest</span></div><div style={{ padding: "3px 6px", color: T.textPrimary }}>v2.3</div></div>,
  pagination: () => <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6px", fontSize: 8, color: T.textSecondary, fontFamily: CARBON_FONT }}>1–10 of 247<span style={{ color: T.textPrimary }}>1/25</span></div>,
  dialog: () => <div style={{ width: 64, height: 40, background: T.layer01, border: `1px solid ${T.borderSubtle01}`, padding: 4, fontFamily: CARBON_FONT }}><div style={{ fontSize: 9, fontWeight: 600, color: T.textPrimary }}>Modal</div><div style={{ fontSize: 7, color: T.textSecondary }}>Body…</div></div>,
  tooltips: () => <div style={{ background: T.backgroundInverse, color: T.textInverse, fontSize: 9, padding: "3px 6px", fontFamily: CARBON_FONT, display: "inline-block" }}>Tooltip</div>,
  avatars: () => <Row gap={3}>{["JD", "AK"].map((i, ix) => <div key={i} style={{ width: 20, height: 20, borderRadius: "50%", background: ix === 0 ? T.interactive : T.supportSuccess, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 500, fontFamily: CARBON_FONT }}>{i}</div>)}</Row>,
  link: () => <Col gap={2} style={{ fontFamily: CARBON_FONT }}><span style={{ fontSize: 10, color: T.linkPrimary, textDecoration: "underline" }}>Read the docs</span><span style={{ fontSize: 9, color: T.linkVisited, textDecoration: "underline" }}>Visited</span></Col>,
  slider: () => <div style={{ width: 72, padding: "6px 0" }}><div style={{ height: 3, background: T.borderSubtle01, position: "relative" }}><div style={{ width: "40%", height: "100%", background: T.interactive }} /><div style={{ position: "absolute", top: "50%", left: "40%", width: 10, height: 10, background: T.interactive, borderRadius: "50%", transform: "translate(-50%,-50%)" }} /></div></div>,
  dropdowns: () => <div style={{ borderBottom: `1px solid ${T.borderStrong01}`, background: T.field01, fontSize: 9, color: T.textPrimary, padding: "3px 6px", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: CARBON_FONT, maxWidth: 100 }}>North America<span>▾</span></div>,
  "content-switcher": () => <div style={{ display: "inline-flex", border: `1px solid ${T.borderStrong01}`, fontFamily: CARBON_FONT, fontSize: 9 }}><span style={{ padding: "2px 6px", background: T.textPrimary, color: T.textInverse }}>All</span><span style={{ padding: "2px 6px", color: T.textSecondary, borderLeft: `1px solid ${T.borderStrong01}` }}>Active</span></div>,
  skeleton: () => <Col gap={3}><div style={{ height: 8, width: 80, background: T.skeletonElement }} /><div style={{ height: 8, width: 100, background: T.skeletonElement }} /></Col>,
  popover: () => <div style={{ padding: 6, background: T.layer02, border: `1px solid ${T.borderSubtle01}`, fontSize: 9, color: T.textPrimary, fontFamily: CARBON_FONT }}>Popover</div>,
  /* Patterns */
  "pat-dashboard": () => <Row gap={3}>{["MRR", "Users", "Churn"].map((v) => <div key={v} style={{ background: T.layer01, padding: "3px 4px", fontSize: 7, fontFamily: CARBON_FONT, color: T.textPrimary, lineHeight: 1.2 }}><div>{v}</div><div style={{ fontWeight: 600 }}>$48K</div></div>)}</Row>,
  "pat-form": () => <Col gap={2}>{[0, 1].map((i) => <div key={i} style={{ height: 10, borderBottom: `1px solid ${T.borderStrong01}`, background: T.field01, width: 80 }} />)}<div style={{ height: 10, width: 40, background: T.interactive, alignSelf: "flex-start" }} /></Col>,
  "pat-app-shell": () => <Col gap={0} style={{ border: `1px solid ${T.borderSubtle01}`, width: 100 }}><div style={{ height: 10, background: T.backgroundInverse }} /><Row gap={0} style={{ height: 40 }}><div style={{ width: 20, background: T.layer01, borderRight: `1px solid ${T.borderSubtle01}` }} /><div style={{ flex: 1 }} /></Row></Col>,
  "pat-login": () => <Col gap={3} style={{ width: 90 }}><div style={{ fontSize: 10, fontWeight: 400, color: T.textPrimary, fontFamily: CARBON_FONT }}>Log in</div><div style={{ height: 10, borderBottom: `1px solid ${T.borderStrong01}`, background: T.field01 }} /><div style={{ height: 10, borderBottom: `1px solid ${T.borderStrong01}`, background: T.field01 }} /><div style={{ height: 14, background: T.interactive }} /></Col>,
  "pat-list-detail": () => <Row gap={0} style={{ border: `1px solid ${T.borderSubtle01}`, height: 40, width: 100 }}><div style={{ width: 30, background: T.layer01, borderRight: `1px solid ${T.borderSubtle01}`, padding: 2, fontSize: 7, color: T.textPrimary, fontFamily: CARBON_FONT }}><div style={{ borderLeft: `2px solid ${T.interactive}`, paddingLeft: 2 }}>Item 1</div></div><div style={{ flex: 1, padding: 4, fontSize: 7, color: T.textSecondary }}>Detail…</div></Row>,
  "pat-search": () => <Col gap={3}><div style={{ height: 10, borderBottom: `1px solid ${T.borderStrong01}`, background: T.field01, padding: "0 6px 0 14px", fontSize: 7, color: T.textPlaceholder, fontFamily: CARBON_FONT, display: "flex", alignItems: "center", position: "relative" }}><span style={{ position: "absolute", left: 4, fontSize: 8 }}>🔍</span>Search</div><Row gap={2}><span style={{ background: "#d0e2ff", color: T.interactive, fontSize: 7, padding: "1px 4px", borderRadius: 8, fontFamily: CARBON_FONT }}>Filter</span></Row></Col>,
};

/* ══════════════════════════════════════════════════════════
   COMPS REGISTRY
   ══════════════════════════════════════════════════════════ */
const COMPS = [
  /* Foundations (11) */
  { id: "dl-color", name: "Color", cat: "Foundations", desc: "Semantic colour tokens for the 4 themes (white / g10 / g90 / g100). Role-based naming over raw hex.", render: DLColor },
  { id: "dl-typography", name: "Typography", cat: "Foundations", desc: "IBM Plex Sans + 17-step productive and expressive type scales. Pairs with Plex Serif and Mono.", render: DLTypography },
  { id: "dl-spacing", name: "Spacing", cat: "Foundations", desc: "2px-based scale. spacing-01 (2px) through spacing-10 (64px). Consistent rhythm across layouts.", render: DLSpacing },
  { id: "dl-elevation", name: "Elevation", cat: "Foundations", desc: "Shadow tokens: $shadow-raised, $shadow-floating. Used for overlays; Carbon is visually flat.", render: DLElevation },
  { id: "dl-icons", name: "Iconography", cat: "Foundations", desc: "@carbon/icons-react ships 2,600+ SVG icons (16/20/24/32px). Per-icon named imports for full tree-shaking.", render: DLIcons },
  { id: "dl-tokens", name: "Token Architecture", cat: "Foundations", desc: "Semantic role tokens over primitives: $interactive, $layer, $field, $text, $support, $border, $focus.", render: DLTokens },
  { id: "dl-density", name: "Density", cat: "Foundations", desc: "Size ladder for controls: 24 / 32 / 40 / 48 / 64 / 80 px. Maps to XS / Small / Medium / Large / XL / 2XL.", render: DLDensity },
  { id: "dl-a11y", name: "Accessibility", cat: "Foundations", desc: "WCAG 2.1 AA. Contrast, focus, touch targets, ARIA, keyboard nav, reduced-motion.", render: DLAccessibility },
  { id: "dl-motion", name: "Motion", cat: "Foundations", desc: "Duration tokens: fast-01 (70ms) through slow-02 (700ms). Carbon easing curves.", render: DLMotion },
  { id: "dl-shape", name: "Shape", cat: "Foundations", desc: "0px radius on controls. Pills (tags) use 16px. Round only for avatars.", render: DLShape },
  { id: "tokens", name: "Tokens", cat: "Foundations", desc: "Full token reference with contrast ratios (routed to TokenReference).", render: () => null },
  { id: "audit", name: "Design Audit", cat: "Foundations", desc: "Paste code to audit against Carbon token conventions.", render: () => null },

  /* Components (22) */
  { id: "buttons", name: "Button", cat: "Components", desc: "5 kinds: primary / secondary / tertiary / ghost / danger. 6 sizes: 24/32/40/48/64/80 px.", render: ButtonsDemo },
  { id: "icon-button", name: "Icon Button", cat: "Components", desc: "Ghost button containing a single icon. aria-label required. 32×32 default.", render: IconButtonsDemo },
  { id: "inputs", name: "Text Input", cat: "Components", desc: "1px $border-strong bottom border. Focus swaps to 2px $focus inset. Sizes 32/40/48.", render: InputsDemo },
  { id: "search", name: "Search", cat: "Components", desc: "TextInput with leading search icon. Optional clear button.", render: SearchDemo },
  { id: "checkboxes", name: "Checkbox", cat: "Components", desc: "Square with fill-on-check. Supports indeterminate (not shown) + disabled states.", render: CheckboxesDemo },
  { id: "radios", name: "Radio Button", cat: "Components", desc: "Round with centre dot. Mutually exclusive within a named group.", render: RadiosDemo },
  { id: "switches", name: "Toggle", cat: "Components", desc: "Binary on/off, 32×16 track. Use for single settings — not for list selection.", render: TogglesDemo },
  { id: "tabs", name: "Tabs", cat: "Components", desc: "Underline 2px $interactive on active. Live above their associated panel.", render: TabsDemo },
  { id: "tags", name: "Tag", cat: "Components", desc: "Category / status pill, 16px radius. Colours map to semantic roles.", render: TagsDemo },
  { id: "cards", name: "Tile", cat: "Components", desc: "Layer-elevated container. Clickable / selectable / expandable variants.", render: TilesDemo },
  { id: "alerts", name: "Notification", cat: "Components", desc: "3px left border indicates severity. 48px min-height. Inline / toast / actionable.", render: NotificationsDemo },
  { id: "progress", name: "Progress Bar", cat: "Components", desc: "Horizontal fill on 4px track. Optional label and percentage. Indeterminate variant animates.", render: ProgressDemo },
  { id: "loading", name: "Loading", cat: "Components", desc: "44×44 circular spinner. Small 16×16 variant for inline use.", render: LoadingDemo },
  { id: "accordion", name: "Accordion", cat: "Components", desc: "Expandable rows. Chevron on the right. Subtle hover background.", render: AccordionDemo },
  { id: "breadcrumbs", name: "Breadcrumb", cat: "Components", desc: "Slash-separated path. Last item is $text-primary, others are $link-primary.", render: BreadcrumbsDemo },
  { id: "data-table", name: "Data Table", cat: "Components", desc: "Header uses $layer-accent + 14px SemiBold. Rows 48px with $border-subtle bottom.", render: DataTableDemo },
  { id: "structured-list", name: "Structured List", cat: "Components", desc: "Simpler data display; no column sorting. Great for docs, release notes, changelogs.", render: StructuredListDemo },
  { id: "pagination", name: "Pagination", cat: "Components", desc: "Chevron paging + items-per-page + X of Y indicator. Lives below tables.", render: PaginationDemo },
  { id: "dialog", name: "Modal", cat: "Components", desc: "Label + title + body + footer with two buttons. 440px default width. 1px container border.", render: ModalDemo },
  { id: "tooltips", name: "Tooltip", cat: "Components", desc: "Hover/focus revealed context. $background-inverse + $text-inverse.", render: TooltipDemo },
  { id: "avatars", name: "Avatar", cat: "Components", desc: "Composed from initials on a filled circle. Carbon ships no first-party Avatar component.", render: AvatarsDemo },
  { id: "link", name: "Link", cat: "Components", desc: "Underlined $link-primary. Hover deepens to $link-primary-hover. Visited is $link-visited purple.", render: LinksDemo },
  { id: "slider", name: "Slider", cat: "Components", desc: "Click-to-position thumb on 4px track. $interactive fill.", render: SliderDemo },
  { id: "dropdowns", name: "Dropdown", cat: "Components", desc: "Click-to-open select with $field-01 surface and $border-strong bottom.", render: DropdownDemo },
  { id: "content-switcher", name: "Content Switcher", cat: "Components", desc: "Mutually exclusive option group. Active has $text-primary background.", render: ContentSwitcherDemo },
  { id: "skeleton", name: "Skeleton", cat: "Components", desc: "Placeholder during load. $skeleton-element background with pulse animation.", render: SkeletonDemo },
  { id: "popover", name: "Popover", cat: "Components", desc: "Anchored content panel. 1px $border-subtle + $shadow-floating.", render: PopoverDemo },

  /* Patterns (6) */
  { id: "pat-dashboard", name: "Analytical Dashboard", cat: "Patterns", desc: "Tile row + data table + pagination. Carbon's canonical overview layout.", render: PatDashboard },
  { id: "pat-form", name: "Form", cat: "Patterns", desc: "Labelled inputs stacked with a primary/secondary action bar.", render: PatForm },
  { id: "pat-app-shell", name: "App Shell", cat: "Patterns", desc: "UI Shell header + side nav + main content area.", render: PatAppShell },
  { id: "pat-login", name: "Login", cat: "Patterns", desc: "Heading + IBMid field + password + continue-with-arrow primary button.", render: PatLogin },
  { id: "pat-list-detail", name: "List + Detail", cat: "Patterns", desc: "Selectable list on the left, detail pane on the right. Canonical records layout.", render: PatListDetail },
  { id: "pat-search", name: "Search", cat: "Patterns", desc: "Search input + filter tags + structured results.", render: PatSearch },
];

/* ══════════════════════════════════════════════════════════
   CATEGORIES + EXPORTS
   ══════════════════════════════════════════════════════════ */
export const CARBON_CATS = ["Foundations", "Components", "Patterns"];
export const CARBON_COMPS = COMPS;

export function getCarbonDemoComponent(id) {
  const entry = COMPS.find((c) => c.id === id);
  return entry ? entry.render : null;
}

export function getCarbonPreviews() {
  return PREVIEWS;
}

/* ──────────────────────────────────────────────
   DENSITY OVERRIDES
   ──────────────────────────────────────────────
   Carbon's spacing-scale compact/normal/spacious
   matches S/M/L input+button heights. Override
   only the .cb-btn and .cb-input defaults - other
   components keep their own size variants. */
export function getCarbonDensityCSS(density) {
  const map = {
    compact:  ".cb-btn{height:24px;font-size:12px;padding:0 16px 0 12px;gap:16px;} .cb-input{height:32px;font-size:12px;}",
    normal:   ".cb-btn{height:40px;padding:0 48px 0 16px;} .cb-input{height:40px;}",
    spacious: ".cb-btn{height:48px;} .cb-input{height:48px;}",
  };
  return map[density] || map.normal;
}
