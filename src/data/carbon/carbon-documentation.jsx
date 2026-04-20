/* ══════════════════════════════════════════════════════════
   Carbon Design System (IBM) - documentation module.

   Mirrors the shape of salt/m3/fluent/ausos documentation files so
   registry.ts can wire it in with the same contract.

   Exports (contract with registry.ts - do not break):
   - CARBON_THEMES     - { [themeKey]: tokenDict } (4 themes: white, g10, g90, g100)
   - CARBON_COMPS      - list of { id, name, cat, desc, render } entries
   - CARBON_CATS       - category list for the UI Kit sidebar
   - CARBON_FONT       - CSS font-family string for the active theme
   - carbonBuildCSS(t) - CSS string with all .cb-* classes + tokens
   - CIcon             - generic material-symbols icon wrapper
   - setCarbonT/getCarbonT   - module-level active-theme ref
   - getCarbonDemoComponent(id)   - returns the demo render fn
   - getCarbonPreviews()          - returns { [id]: ComponentType }
   - getCarbonDensityCSS(d)       - compact/normal/spacious overrides

   Visual language: Carbon is flat / Swiss - 0px corner radius on
   controls, IBM Plex Sans typography, heavy use of the #0f62fe
   blue for interactivity, semantic support colors for status, and
   a 2px-based spacing scale. ══════════════════════════════════════════════════════════ */

import React, { useState } from "react";

/* ──────────────────────────────────────────────
   FONT
   ────────────────────────────────────────────── */
export const CARBON_FONT = "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif";

/* ──────────────────────────────────────────────
   COLORS - Carbon palette (base values)
   ──────────────────────────────────────────────
   These are the primitive colours used to compose
   the four theme token sets below. Sourced from
   @carbon/colors (gray/blue/red/green/yellow) +
   IBM Plex data-viz for expanded palettes. */
const BLUE_60 = "#0f62fe";
const BLUE_50 = "#4589ff";
const BLUE_70 = "#0043ce";
const GRAY_10 = "#f4f4f4";
const GRAY_20 = "#e0e0e0";
const GRAY_30 = "#c6c6c6";
const GRAY_40 = "#a8a8a8";
const GRAY_50 = "#8d8d8d";
const GRAY_60 = "#6f6f6f";
const GRAY_70 = "#525252";
const GRAY_80 = "#393939";
const GRAY_90 = "#262626";
const GRAY_100 = "#161616";
const RED_60 = "#da1e28";
const RED_50 = "#fa4d56";
const GREEN_50 = "#24a148";
const GREEN_40 = "#42be65";
const YELLOW_30 = "#f1c21b";

/* ──────────────────────────────────────────────
   THEMES - Carbon's 4 canonical themes
   ──────────────────────────────────────────────
   Every theme must expose the normalized fields
   ThemeContext reads via its `n()` helper:
     bg / bg2 / bg3
     fg / fg2 / fg3
     accent / accentFg / accentWeak / accentText
     border / borderStrong
     positive / warning / negative

   Plus Carbon-native fields used by buildCSS +
   demos: primary, surface, layer01/02/03, fieldBg,
   textPlaceholder, interactiveHover, buttonHover. */
function lightTokens(bg, bg2, layerOne, fieldBg) {
  return {
    // Normalized (ThemeContext contract)
    bg, bg2, bg3: GRAY_20,
    fg: GRAY_100, fg2: GRAY_70, fg3: GRAY_50,
    accent: BLUE_60, accentFg: "#ffffff",
    accentWeak: "rgba(15,98,254,0.12)", accentText: BLUE_60,
    border: GRAY_20, borderStrong: GRAY_50,
    positive: GREEN_50, warning: YELLOW_30, negative: RED_60,
    // Carbon-native
    primary: BLUE_60, primaryHover: BLUE_70,
    surface: bg2,
    layer01: layerOne, layer02: bg, layer03: layerOne,
    fieldBg,
    textPlaceholder: GRAY_50, textDisabled: GRAY_40,
    fgSecondary: GRAY_70, fgTertiary: GRAY_50,
    interactiveHover: "#0353e9",
    buttonHover: "#0353e9",
    buttonDangerHover: "#b81922",
    focus: BLUE_60,
    shadow: "0 1px 2px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.08)",
    icon: GRAY_100, iconSecondary: GRAY_70,
  };
}
function darkTokens(bg, bg2, layerOne, fieldBg) {
  return {
    bg, bg2, bg3: GRAY_70,
    fg: GRAY_10, fg2: GRAY_30, fg3: GRAY_50,
    accent: BLUE_50, accentFg: "#ffffff",
    accentWeak: "rgba(69,137,255,0.16)", accentText: BLUE_50,
    border: GRAY_80, borderStrong: GRAY_50,
    positive: GREEN_40, warning: YELLOW_30, negative: RED_50,
    primary: BLUE_50, primaryHover: "#3a7afe",
    surface: bg2,
    layer01: layerOne, layer02: bg, layer03: layerOne,
    fieldBg,
    textPlaceholder: GRAY_50, textDisabled: GRAY_60,
    fgSecondary: GRAY_30, fgTertiary: GRAY_50,
    interactiveHover: "#3a7afe",
    buttonHover: "#3a7afe",
    buttonDangerHover: RED_60,
    focus: "#ffffff",
    shadow: "0 1px 2px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.4)",
    icon: GRAY_10, iconSecondary: GRAY_30,
  };
}

export const CARBON_THEMES = {
  white: lightTokens("#ffffff", GRAY_10, GRAY_10, GRAY_10),
  g10:   lightTokens(GRAY_10,   "#ffffff", "#ffffff", "#ffffff"),
  g90:   darkTokens(GRAY_90,    GRAY_80,  GRAY_80,  GRAY_80),
  g100:  darkTokens(GRAY_100,   GRAY_90,  GRAY_90,  GRAY_90),
};

/* Module-scoped active theme. registry.activateTheme() calls
   setCarbonT(theme) so downstream demos read via getCarbonT() or
   just reference T directly. */
let T = CARBON_THEMES.white;
export const setCarbonT = (theme) => { T = theme; };
export const getCarbonT = () => T;

/* ──────────────────────────────────────────────
   CSS BUILDER - injected into the UI Kit iframe
   ──────────────────────────────────────────────
   Writes the Carbon .cb-* class rules using the
   active theme's CSS variables so demos render
   correctly regardless of which theme is active.

   Phase 4 will promote these into builder.css so
   the Builder preview panel also picks up Carbon
   styling; for now these live only in the UI Kit
   demo iframe. */
export function carbonBuildCSS(theme) {
  const t = theme || T;
  return `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono&display=swap');

    :root {
      --cb-bg: ${t.bg}; --cb-bg2: ${t.bg2};
      --cb-fg: ${t.fg}; --cb-fg2: ${t.fg2}; --cb-fg3: ${t.fg3};
      --cb-primary: ${t.primary}; --cb-primary-hover: ${t.primaryHover};
      --cb-accent-fg: ${t.accentFg};
      --cb-border: ${t.border}; --cb-border-strong: ${t.borderStrong};
      --cb-surface: ${t.surface};
      --cb-layer-01: ${t.layer01}; --cb-layer-02: ${t.layer02};
      --cb-field-bg: ${t.fieldBg};
      --cb-placeholder: ${t.textPlaceholder};
      --cb-positive: ${t.positive}; --cb-warning: ${t.warning}; --cb-negative: ${t.negative};
      --cb-focus: ${t.focus};
      --cb-button-hover: ${t.buttonHover};
      --cb-icon: ${t.icon};
    }

    /* Base */
    * { box-sizing: border-box; }
    body, .cb-root { font-family: ${CARBON_FONT}; color: var(--cb-fg); background: var(--cb-bg); }

    /* Buttons - Carbon is flat: 0px radius, 32px default height */
    .cb-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      height: 32px; padding: 0 12px 0 12px; border-radius: 0;
      font-family: ${CARBON_FONT}; font-size: 14px; font-weight: 400;
      cursor: pointer; border: 1px solid transparent; background: transparent;
      color: var(--cb-fg); transition: background 70ms ease-out, border-color 70ms ease-out; outline: none; }
    .cb-btn:focus-visible { box-shadow: inset 0 0 0 2px var(--cb-focus), inset 0 0 0 3px var(--cb-bg); }
    .cb-btn-primary { background: var(--cb-primary); color: var(--cb-accent-fg); }
    .cb-btn-primary:hover { background: var(--cb-button-hover); }
    .cb-btn-secondary { background: ${t.fg}; color: ${t.bg}; }
    .cb-btn-secondary:hover { background: ${t.fg2}; }
    .cb-btn-tertiary { background: transparent; color: var(--cb-primary); border-color: var(--cb-primary); }
    .cb-btn-tertiary:hover { background: var(--cb-primary); color: var(--cb-accent-fg); }
    .cb-btn-ghost { background: transparent; color: var(--cb-primary); padding: 0 12px; }
    .cb-btn-ghost:hover { background: var(--cb-accent-fg); background: rgba(15,98,254,0.08); }
    .cb-btn-danger { background: var(--cb-negative); color: #ffffff; }
    .cb-btn-danger:hover { background: ${t.buttonDangerHover}; }
    .cb-btn-sm { height: 24px; padding: 0 8px; font-size: 12px; }
    .cb-btn-lg { height: 48px; padding: 0 16px; font-size: 14px; }
    .cb-btn-xl { height: 64px; padding: 0 16px; font-size: 14px; }

    /* Inputs */
    .cb-input-wrap { display: flex; flex-direction: column; gap: 6px; }
    .cb-input-label { font-size: 12px; color: var(--cb-fg2); }
    .cb-input { height: 40px; width: 100%; padding: 0 16px;
      background: var(--cb-field-bg); color: var(--cb-fg);
      border: 0; border-bottom: 1px solid var(--cb-border-strong);
      font-family: ${CARBON_FONT}; font-size: 14px; outline: none;
      transition: border-color 70ms ease-out; border-radius: 0; }
    .cb-input:focus { box-shadow: inset 0 -2px 0 0 var(--cb-primary); border-bottom-color: transparent; }
    .cb-input::placeholder { color: var(--cb-placeholder); }
    .cb-input-helper { font-size: 12px; color: var(--cb-fg2); }
    .cb-textarea { min-height: 88px; padding: 12px 16px; resize: vertical; }
    .cb-search { position: relative; }
    .cb-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--cb-fg2); pointer-events: none; }
    .cb-search input { padding-left: 40px; }

    /* Checkbox + radio + toggle */
    .cb-checkbox, .cb-radio { display: inline-flex; align-items: center; gap: 8px;
      font-family: ${CARBON_FONT}; font-size: 14px; color: var(--cb-fg); cursor: pointer; }
    .cb-cb-box { width: 16px; height: 16px; border: 1px solid var(--cb-fg);
      background: transparent; border-radius: 0; display: inline-flex; align-items: center; justify-content: center; }
    .cb-cb-box.checked { background: var(--cb-fg); }
    .cb-cb-box.checked::after { content: "✓"; color: var(--cb-bg); font-size: 12px; line-height: 1; }
    .cb-radio-circle { width: 16px; height: 16px; border: 1px solid var(--cb-fg);
      border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; }
    .cb-radio-circle.checked::after { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--cb-fg); }
    .cb-toggle { display: inline-flex; align-items: center; gap: 12px; cursor: pointer; font-family: ${CARBON_FONT}; font-size: 14px; color: var(--cb-fg); }
    .cb-toggle-track { width: 48px; height: 24px; background: var(--cb-fg3); border-radius: 12px; position: relative; transition: background 100ms ease-out; }
    .cb-toggle.on .cb-toggle-track { background: var(--cb-primary); }
    .cb-toggle-thumb { width: 18px; height: 18px; background: #ffffff; border-radius: 50%; position: absolute; top: 3px; left: 3px; transition: left 100ms ease-out; }
    .cb-toggle.on .cb-toggle-thumb { left: 27px; }

    /* Tabs */
    .cb-tabs { display: flex; border-bottom: 1px solid var(--cb-border); }
    .cb-tab { padding: 12px 16px; font-family: ${CARBON_FONT}; font-size: 14px; color: var(--cb-fg2); border: 0; background: transparent; cursor: pointer; border-bottom: 2px solid transparent; }
    .cb-tab:hover { color: var(--cb-fg); }
    .cb-tab.active { color: var(--cb-fg); border-bottom-color: var(--cb-primary); font-weight: 600; }

    /* Tag / badge */
    .cb-tag { display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 8px;
      background: var(--cb-layer-01); color: var(--cb-fg); font-family: ${CARBON_FONT}; font-size: 12px; border-radius: 12px; }
    .cb-tag-red    { background: rgba(218,30,40,0.1); color: var(--cb-negative); }
    .cb-tag-green  { background: rgba(36,161,72,0.1); color: var(--cb-positive); }
    .cb-tag-yellow { background: rgba(241,194,27,0.15); color: ${t.fg}; }
    .cb-tag-blue   { background: rgba(15,98,254,0.1); color: var(--cb-primary); }

    /* Card / tile */
    .cb-tile { background: var(--cb-layer-01); border: 1px solid transparent; padding: 16px; border-radius: 0; font-family: ${CARBON_FONT}; color: var(--cb-fg); }
    .cb-tile-clickable { cursor: pointer; transition: background 70ms ease-out; }
    .cb-tile-clickable:hover { background: var(--cb-layer-02); }

    /* Notification / inline alerts */
    .cb-notif { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px;
      border-left: 3px solid var(--cb-primary); background: var(--cb-layer-01);
      color: var(--cb-fg); font-family: ${CARBON_FONT}; font-size: 14px; }
    .cb-notif-success { border-color: var(--cb-positive); }
    .cb-notif-warning { border-color: var(--cb-warning); }
    .cb-notif-error   { border-color: var(--cb-negative); }
    .cb-notif-title { font-weight: 600; margin-bottom: 2px; }

    /* Progress */
    .cb-progress { display: flex; flex-direction: column; gap: 6px; font-family: ${CARBON_FONT}; font-size: 12px; color: var(--cb-fg); }
    .cb-progress-track { height: 4px; background: var(--cb-border); width: 100%; overflow: hidden; }
    .cb-progress-fill { height: 100%; background: var(--cb-primary); transition: width 200ms ease-out; }

    /* Accordion */
    .cb-accordion { border-top: 1px solid var(--cb-border); }
    .cb-accordion-item { border-bottom: 1px solid var(--cb-border); }
    .cb-accordion-head { display: flex; justify-content: space-between; align-items: center;
      padding: 12px 0; cursor: pointer; font-family: ${CARBON_FONT}; font-size: 14px; color: var(--cb-fg); }
    .cb-accordion-body { padding: 0 0 12px 0; font-size: 14px; color: var(--cb-fg2); }

    /* Breadcrumb */
    .cb-crumb { display: flex; align-items: center; gap: 4px; font-family: ${CARBON_FONT}; font-size: 12px; color: var(--cb-fg2); }
    .cb-crumb a { color: var(--cb-primary); text-decoration: none; cursor: pointer; }
    .cb-crumb a:hover { text-decoration: underline; }
    .cb-crumb-sep { color: var(--cb-fg3); }

    /* Data table */
    .cb-table { width: 100%; border-collapse: collapse; font-family: ${CARBON_FONT}; font-size: 14px; color: var(--cb-fg); background: var(--cb-layer-01); }
    .cb-table th { text-align: left; font-weight: 600; padding: 12px 16px; border-bottom: 1px solid var(--cb-border); background: var(--cb-bg2); }
    .cb-table td { padding: 12px 16px; border-bottom: 1px solid var(--cb-border); }
    .cb-table tr:hover td { background: var(--cb-layer-02); }

    /* Modal / dialog */
    .cb-modal { max-width: 320px; background: var(--cb-layer-01); border: 1px solid var(--cb-border); padding: 20px; }
    .cb-modal-head { font-family: ${CARBON_FONT}; font-size: 20px; font-weight: 400; color: var(--cb-fg); margin-bottom: 8px; }
    .cb-modal-body { font-size: 14px; color: var(--cb-fg2); margin-bottom: 20px; }

    /* Link */
    .cb-link { color: var(--cb-primary); text-decoration: underline; font-family: ${CARBON_FONT}; font-size: 14px; cursor: pointer; }
    .cb-link:hover { color: var(--cb-primary-hover); }

    /* Tooltip */
    .cb-tooltip { position: relative; display: inline-block; }
    .cb-tooltip-bubble { position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);
      background: var(--cb-fg); color: var(--cb-bg); font-size: 12px; padding: 6px 10px;
      white-space: nowrap; font-family: ${CARBON_FONT}; }

    /* Avatar */
    .cb-avatar { width: 32px; height: 32px; border-radius: 50%;
      background: var(--cb-primary); color: #ffffff; display: inline-flex;
      align-items: center; justify-content: center; font-family: ${CARBON_FONT};
      font-weight: 500; font-size: 12px; }

    /* Slider */
    .cb-slider { display: flex; flex-direction: column; gap: 8px; font-family: ${CARBON_FONT}; font-size: 12px; color: var(--cb-fg); }
    .cb-slider-track { position: relative; height: 4px; background: var(--cb-border); border-radius: 0; }
    .cb-slider-fill { position: absolute; left: 0; top: 0; height: 100%; background: var(--cb-primary); }
    .cb-slider-thumb { position: absolute; top: 50%; width: 14px; height: 14px; background: var(--cb-primary);
      border-radius: 50%; transform: translate(-50%, -50%); }

    /* Dropdown */
    .cb-dropdown { position: relative; min-width: 200px; }
    .cb-dropdown-trigger { height: 40px; padding: 0 16px; background: var(--cb-field-bg); color: var(--cb-fg);
      border: 0; border-bottom: 1px solid var(--cb-border-strong); display: flex; align-items: center;
      justify-content: space-between; cursor: pointer; font-family: ${CARBON_FONT}; font-size: 14px; }

    /* Loading */
    .cb-loading { width: 44px; height: 44px; border: 2px solid var(--cb-border); border-top-color: var(--cb-primary);
      border-radius: 50%; animation: cb-spin 0.7s linear infinite; }
    @keyframes cb-spin { to { transform: rotate(360deg); } }

    /* Skeleton */
    .cb-skeleton { background: var(--cb-border); animation: cb-pulse 1.5s ease-in-out infinite; }
    @keyframes cb-pulse { 50% { opacity: 0.55; } }
  `;
}

/* ──────────────────────────────────────────────
   ICON - Material Symbols wrapper (Phase 7 swaps
   to @carbon/icons-react for proper Carbon icons).
   ────────────────────────────────────────────── */
export const CIcon = ({ name, size = 16, color, ...rest }) => (
  <span
    className="material-symbols-outlined"
    style={{ fontSize: size, color: color || T.icon, lineHeight: 1, verticalAlign: "middle" }}
    aria-hidden="true"
    {...rest}
  >
    {name}
  </span>
);

/* ──────────────────────────────────────────────
   SHARED DEMO HELPERS
   ────────────────────────────────────────────── */
const demoStyle = () => ({ fontFamily: CARBON_FONT, color: T.fg });
const Row = ({ gap = 8, wrap = true, children }) => (
  <div style={{ display: "flex", alignItems: "center", gap, flexWrap: wrap ? "wrap" : "nowrap" }}>{children}</div>
);
const Col = ({ gap = 12, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap }}>{children}</div>
);
const Section = ({ title, children }) => (
  <div style={{ marginBottom: 16 }}>
    {title && <div style={{ fontSize: 12, fontWeight: 600, color: T.fg2, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>{title}</div>}
    {children}
  </div>
);

/* ──────────────────────────────────────────────
   FOUNDATION RENDERERS
   ────────────────────────────────────────────── */
function DLColor() {
  const swatches = [
    { label: "Interactive", val: T.primary },
    { label: "Background", val: T.bg },
    { label: "Layer 01", val: T.layer01 },
    { label: "Text primary", val: T.fg },
    { label: "Text secondary", val: T.fg2 },
    { label: "Border", val: T.border },
    { label: "Support success", val: T.positive },
    { label: "Support warning", val: T.warning },
    { label: "Support error", val: T.negative },
  ];
  return (
    <div style={demoStyle()}>
      <Row gap={12}>
        {swatches.map((s) => (
          <div key={s.label} style={{ width: 120 }}>
            <div style={{ height: 64, background: s.val, border: `1px solid ${T.border}`, marginBottom: 6 }} />
            <div style={{ fontSize: 12 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: T.fg2, fontFamily: "'IBM Plex Mono', monospace" }}>{s.val}</div>
          </div>
        ))}
      </Row>
    </div>
  );
}

function DLTypography() {
  const scale = [
    { label: "Display 01", size: 42, weight: 300 },
    { label: "Heading 04", size: 28, weight: 400 },
    { label: "Heading 02", size: 20, weight: 400 },
    { label: "Body 02", size: 16, weight: 400 },
    { label: "Body 01", size: 14, weight: 400 },
    { label: "Helper", size: 12, weight: 400 },
    { label: "Label", size: 12, weight: 400 },
  ];
  return (
    <Col gap={8}>
      {scale.map((s) => (
        <div key={s.label} style={{ fontFamily: CARBON_FONT, color: T.fg }}>
          <div style={{ fontSize: s.size, fontWeight: s.weight, lineHeight: 1.2 }}>IBM Plex Sans</div>
          <div style={{ fontSize: 11, color: T.fg2 }}>{s.label} - {s.size}px / {s.weight}</div>
        </div>
      ))}
    </Col>
  );
}

function DLSpacing() {
  const steps = [
    { t: "01", px: 2 }, { t: "02", px: 4 }, { t: "03", px: 8 }, { t: "04", px: 12 },
    { t: "05", px: 16 }, { t: "06", px: 24 }, { t: "07", px: 32 }, { t: "08", px: 40 },
    { t: "09", px: 48 }, { t: "10", px: 64 },
  ];
  return (
    <Col gap={6}>
      {steps.map((s) => (
        <Row key={s.t} gap={12}>
          <span style={{ width: 40, fontSize: 12, color: T.fg2 }}>spacing-{s.t}</span>
          <div style={{ width: s.px, height: 12, background: T.primary }} />
          <span style={{ fontSize: 12, color: T.fg }}>{s.px}px</span>
        </Row>
      ))}
    </Col>
  );
}

function DLElevation() {
  const levels = [
    { name: "Raised", shadow: "0 1px 2px rgba(0,0,0,0.06)" },
    { name: "Floating", shadow: "0 2px 6px rgba(0,0,0,0.1)" },
    { name: "Overflow", shadow: "0 4px 12px rgba(0,0,0,0.16)" },
    { name: "Modal", shadow: "0 8px 24px rgba(0,0,0,0.2)" },
  ];
  return (
    <Row gap={16}>
      {levels.map((l) => (
        <div key={l.name} style={{ width: 140, height: 80, background: T.layer01, boxShadow: l.shadow, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: CARBON_FONT, fontSize: 12, color: T.fg }}>
          {l.name}
        </div>
      ))}
    </Row>
  );
}

function DLIcons() {
  const icons = ["search", "add", "close", "check", "settings", "person", "home", "menu", "arrow_forward", "download", "filter_alt", "info"];
  return (
    <Row gap={16}>
      {icons.map((n) => (
        <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 56 }}>
          <CIcon name={n} size={24} />
          <span style={{ fontSize: 10, color: T.fg2 }}>{n}</span>
        </div>
      ))}
    </Row>
  );
}

function DLTokens() {
  const tokens = [
    ["$interactive", T.primary], ["$background", T.bg], ["$layer-01", T.layer01],
    ["$text-primary", T.fg], ["$border-subtle", T.border], ["$focus", T.focus],
  ];
  return (
    <Col gap={6}>
      {tokens.map(([tk, v]) => (
        <Row key={tk} gap={12}>
          <span style={{ width: 140, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: T.fg }}>{tk}</span>
          <div style={{ width: 28, height: 16, background: v, border: `1px solid ${T.border}` }} />
          <span style={{ fontSize: 12, color: T.fg2, fontFamily: "'IBM Plex Mono', monospace" }}>{v}</span>
        </Row>
      ))}
    </Col>
  );
}

function DLDensity() {
  return (
    <Col gap={12}>
      {[
        { name: "Compact", h: 24 },
        { name: "Normal", h: 32 },
        { name: "Spacious", h: 48 },
      ].map((d) => (
        <Row key={d.name} gap={12}>
          <span style={{ width: 80, fontSize: 12, color: T.fg }}>{d.name}</span>
          <div style={{ height: d.h, padding: "0 12px", background: T.primary, color: "#ffffff", display: "inline-flex", alignItems: "center", fontFamily: CARBON_FONT, fontSize: 14 }}>Button</div>
          <span style={{ fontSize: 12, color: T.fg2 }}>{d.h}px</span>
        </Row>
      ))}
    </Col>
  );
}

function DLAccessibility() {
  return (
    <Col gap={8}>
      <div style={{ ...demoStyle(), fontSize: 14 }}>WCAG 2.1 AA compliant:</div>
      <ul style={{ ...demoStyle(), fontSize: 13, color: T.fg2, paddingLeft: 20, lineHeight: 1.6 }}>
        <li>Text contrast ≥ 4.5:1 on all surfaces</li>
        <li>Focus rings visible via 2px inset box-shadow</li>
        <li>44px minimum touch targets on mobile (spacious density)</li>
        <li>Support colours (error/warning/success) readable on all 4 themes</li>
        <li>Icon-only buttons carry aria-label metadata</li>
      </ul>
    </Col>
  );
}

function DLMotion() {
  const durations = [
    ["Fast 01", "70ms", "button hover"],
    ["Fast 02", "110ms", "menu open"],
    ["Moderate 01", "150ms", "panel slide"],
    ["Moderate 02", "240ms", "modal"],
    ["Slow 01", "400ms", "expressive"],
  ];
  return (
    <Col gap={6}>
      {durations.map(([n, d, use]) => (
        <Row key={n} gap={12}>
          <span style={{ width: 100, fontSize: 12, color: T.fg }}>{n}</span>
          <span style={{ width: 60, fontSize: 12, color: T.fg2, fontFamily: "'IBM Plex Mono', monospace" }}>{d}</span>
          <span style={{ fontSize: 12, color: T.fg2 }}>{use}</span>
        </Row>
      ))}
    </Col>
  );
}

/* ──────────────────────────────────────────────
   COMPONENT RENDERERS
   ────────────────────────────────────────────── */
function Buttons() {
  return (
    <Col gap={16}>
      <Section title="Variants">
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
          <button className="cb-btn cb-btn-primary cb-btn-sm">Small</button>
          <button className="cb-btn cb-btn-primary">Default</button>
          <button className="cb-btn cb-btn-primary cb-btn-lg">Large</button>
          <button className="cb-btn cb-btn-primary cb-btn-xl">2xL</button>
        </Row>
      </Section>
    </Col>
  );
}

function IconButton() {
  return (
    <Row>
      {["search", "add", "settings", "notifications", "person"].map((n) => (
        <button key={n} className="cb-btn cb-btn-ghost" aria-label={n} style={{ width: 32, padding: 0, justifyContent: "center" }}>
          <CIcon name={n} size={18} />
        </button>
      ))}
    </Row>
  );
}

function Inputs() {
  const [val, setVal] = useState("");
  return (
    <Col gap={12}>
      <div className="cb-input-wrap">
        <label className="cb-input-label">Work email</label>
        <input className="cb-input" placeholder="you@company.com" value={val} onChange={(e) => setVal(e.target.value)} />
        <span className="cb-input-helper">We never share your email.</span>
      </div>
      <div className="cb-input-wrap">
        <label className="cb-input-label">Message</label>
        <textarea className="cb-input cb-textarea" placeholder="Type here..." />
      </div>
    </Col>
  );
}

function Search() {
  return (
    <div className="cb-input-wrap">
      <label className="cb-input-label">Search</label>
      <div className="cb-search">
        <CIcon name="search" size={18} />
        <input className="cb-input" placeholder="Find components" />
      </div>
    </div>
  );
}

function Checkboxes() {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  return (
    <Col>
      <label className="cb-checkbox" onClick={() => setA((v) => !v)}>
        <span className={`cb-cb-box${a ? " checked" : ""}`} />
        Option A (selected)
      </label>
      <label className="cb-checkbox" onClick={() => setB((v) => !v)}>
        <span className={`cb-cb-box${b ? " checked" : ""}`} />
        Option B
      </label>
      <label className="cb-checkbox" style={{ opacity: 0.5 }}>
        <span className="cb-cb-box" />
        Disabled
      </label>
    </Col>
  );
}

function Radios() {
  const [sel, setSel] = useState("b");
  return (
    <Col>
      {[["a", "Small"], ["b", "Medium"], ["c", "Large"]].map(([k, lbl]) => (
        <label key={k} className="cb-radio" onClick={() => setSel(k)}>
          <span className={`cb-radio-circle${sel === k ? " checked" : ""}`} />
          {lbl}
        </label>
      ))}
    </Col>
  );
}

function Toggles() {
  const [on, setOn] = useState(true);
  return (
    <Col>
      <div className={`cb-toggle${on ? " on" : ""}`} onClick={() => setOn((v) => !v)}>
        <span className="cb-toggle-track"><span className="cb-toggle-thumb" /></span>
        Enabled
      </div>
      <div className="cb-toggle">
        <span className="cb-toggle-track"><span className="cb-toggle-thumb" /></span>
        Disabled
      </div>
    </Col>
  );
}

function Tabs() {
  const [i, setI] = useState(0);
  const tabs = ["Overview", "Usage", "Code", "Accessibility"];
  return (
    <Col>
      <div className="cb-tabs">
        {tabs.map((t, idx) => (
          <button key={t} className={`cb-tab${idx === i ? " active" : ""}`} onClick={() => setI(idx)}>{t}</button>
        ))}
      </div>
      <div style={{ padding: "16px 0", color: T.fg2, fontFamily: CARBON_FONT, fontSize: 14 }}>
        {tabs[i]} panel content.
      </div>
    </Col>
  );
}

function Tags() {
  return (
    <Row>
      <span className="cb-tag">Default</span>
      <span className="cb-tag cb-tag-blue">Interactive</span>
      <span className="cb-tag cb-tag-green">Success</span>
      <span className="cb-tag cb-tag-yellow">Warning</span>
      <span className="cb-tag cb-tag-red">Error</span>
    </Row>
  );
}

function Cards() {
  return (
    <Row gap={16}>
      {[
        { title: "Active users", value: "12,847", delta: "+8%" },
        { title: "Revenue (MRR)", value: "$48,200", delta: "+12%" },
        { title: "Churn rate", value: "2.1%", delta: "-3%" },
      ].map((c) => (
        <div key={c.title} className="cb-tile cb-tile-clickable" style={{ minWidth: 180 }}>
          <div style={{ fontSize: 12, color: T.fg2, marginBottom: 6 }}>{c.title}</div>
          <div style={{ fontSize: 24, fontWeight: 400 }}>{c.value}</div>
          <div style={{ fontSize: 12, color: T.positive, marginTop: 4 }}>{c.delta}</div>
        </div>
      ))}
    </Row>
  );
}

function Notifications() {
  return (
    <Col>
      <div className="cb-notif cb-notif-success">
        <CIcon name="check_circle" size={16} color={T.positive} />
        <div>
          <div className="cb-notif-title">Deployment succeeded</div>
          <div>Production is now serving v2.4.</div>
        </div>
      </div>
      <div className="cb-notif cb-notif-warning">
        <CIcon name="warning" size={16} color={T.warning} />
        <div>
          <div className="cb-notif-title">Upcoming maintenance</div>
          <div>System will be offline for 30 minutes on Sunday 03:00 UTC.</div>
        </div>
      </div>
      <div className="cb-notif cb-notif-error">
        <CIcon name="error" size={16} color={T.negative} />
        <div>
          <div className="cb-notif-title">Couldn&apos;t save</div>
          <div>Check your connection and try again.</div>
        </div>
      </div>
    </Col>
  );
}

function Progress() {
  return (
    <Col>
      <div className="cb-progress">
        <div>Upload in progress</div>
        <div className="cb-progress-track"><div className="cb-progress-fill" style={{ width: "64%" }} /></div>
        <div style={{ color: T.fg2 }}>64%</div>
      </div>
    </Col>
  );
}

function Loading() {
  return (
    <Col>
      <div className="cb-loading" role="status" aria-label="Loading" />
    </Col>
  );
}

function Accordion() {
  const [open, setOpen] = useState(0);
  const items = [
    ["What is Carbon?", "Carbon is IBM's open-source design system."],
    ["How do I install?", "npm install @carbon/react and import components."],
    ["Is it accessible?", "Yes. Carbon ships with WCAG 2.1 AA coverage across all components."],
  ];
  return (
    <div className="cb-accordion">
      {items.map(([q, a], i) => (
        <div key={q} className="cb-accordion-item">
          <div className="cb-accordion-head" onClick={() => setOpen(open === i ? -1 : i)}>
            <span>{q}</span>
            <CIcon name={open === i ? "expand_less" : "expand_more"} size={20} />
          </div>
          {open === i && <div className="cb-accordion-body">{a}</div>}
        </div>
      ))}
    </div>
  );
}

function Breadcrumbs() {
  return (
    <div className="cb-crumb">
      <a>Home</a>
      <span className="cb-crumb-sep">/</span>
      <a>Components</a>
      <span className="cb-crumb-sep">/</span>
      <span>Buttons</span>
    </div>
  );
}

function DataTableDemo() {
  const rows = [
    { name: "Jane Doe", status: "Active", role: "Admin", last: "2 hrs ago" },
    { name: "John Smith", status: "Pending", role: "Editor", last: "Yesterday" },
    { name: "Alice Jones", status: "Active", role: "Viewer", last: "5 mins ago" },
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
            <td><span className={`cb-tag cb-tag-${r.status === "Active" ? "green" : "yellow"}`}>{r.status}</span></td>
            <td>{r.role}</td>
            <td>{r.last}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ModalDemo() {
  return (
    <div className="cb-modal">
      <div className="cb-modal-head">Delete this project?</div>
      <div className="cb-modal-body">This action is permanent. All associated deployments and logs will be removed.</div>
      <Row>
        <button className="cb-btn cb-btn-ghost">Cancel</button>
        <button className="cb-btn cb-btn-danger">Delete</button>
      </Row>
    </div>
  );
}

function TooltipDemo() {
  return (
    <Row>
      <div className="cb-tooltip" style={{ padding: "8px 0" }}>
        <span className="cb-tooltip-bubble">Carbon tooltip</span>
        <button className="cb-btn cb-btn-ghost">Hover me</button>
      </div>
    </Row>
  );
}

function Avatars() {
  return (
    <Row>
      <div className="cb-avatar">JD</div>
      <div className="cb-avatar" style={{ background: T.positive }}>AK</div>
      <div className="cb-avatar" style={{ background: T.warning, color: T.fg }}>RW</div>
      <div className="cb-avatar" style={{ background: T.negative }}>MZ</div>
    </Row>
  );
}

function Links() {
  return (
    <Col>
      <a className="cb-link">Read the docs</a>
      <a className="cb-link">View on GitHub</a>
      <a className="cb-link">Carbon Design System</a>
    </Col>
  );
}

function Slider() {
  const [v, setV] = useState(40);
  return (
    <Col>
      <div className="cb-slider">
        <Row>
          <span>Volume</span>
          <span style={{ marginLeft: "auto", color: T.fg2 }}>{v}</span>
        </Row>
        <div
          className="cb-slider-track"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setV(Math.round(((e.clientX - r.left) / r.width) * 100));
          }}
          style={{ cursor: "pointer" }}
        >
          <div className="cb-slider-fill" style={{ width: `${v}%` }} />
          <span className="cb-slider-thumb" style={{ left: `${v}%` }} />
        </div>
      </div>
    </Col>
  );
}

function DropdownDemo() {
  return (
    <div className="cb-dropdown">
      <label className="cb-input-label">Choose a region</label>
      <div className="cb-dropdown-trigger">
        <span>North America</span>
        <CIcon name="expand_more" size={18} />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   PATTERNS
   ────────────────────────────────────────────── */
function PatDashboard() {
  return (
    <Col>
      <Cards />
      <div style={{ height: 12 }} />
      <DataTableDemo />
    </Col>
  );
}

function PatForm() {
  return (
    <Col>
      <Inputs />
      <Row>
        <button className="cb-btn cb-btn-ghost">Cancel</button>
        <button className="cb-btn cb-btn-primary">Save changes</button>
      </Row>
    </Col>
  );
}

function PatAppShell() {
  return (
    <div style={{ fontFamily: CARBON_FONT, border: `1px solid ${T.border}`, height: 200 }}>
      <div style={{ height: 40, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: `1px solid ${T.border}`, background: T.bg2, fontWeight: 600 }}>
        Carbon Header
      </div>
      <div style={{ display: "flex", height: 160 }}>
        <div style={{ width: 120, borderRight: `1px solid ${T.border}`, padding: 12, background: T.bg2 }}>
          {["Home", "Deploy", "Logs", "Settings"].map((l, i) => (
            <div key={l} style={{ padding: "6px 8px", fontSize: 13, color: i === 0 ? T.fg : T.fg2, borderLeft: i === 0 ? `3px solid ${T.primary}` : "3px solid transparent" }}>{l}</div>
          ))}
        </div>
        <div style={{ flex: 1, padding: 16, fontSize: 13, color: T.fg2 }}>Main content area</div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   COMPS REGISTRY - id/name/cat/desc/render
   ──────────────────────────────────────────────
   Phase 2a ships a focused subset (~30 entries)
   covering foundations + core components + a few
   patterns. Phase 2b expands to the full 80+. */
const COMPS = [
  // Foundations
  { id: "dl-color", name: "Color", cat: "Foundations", desc: "Carbon colour tokens for the 4 themes (white / g10 / g90 / g100). Role-based semantic naming.", render: DLColor },
  { id: "dl-typography", name: "Typography", cat: "Foundations", desc: "IBM Plex Sans + 17 step type scale. Productive vs expressive sets.", render: DLTypography },
  { id: "dl-spacing", name: "Spacing", cat: "Foundations", desc: "2px-based scale: spacing-01 (2px) through spacing-10 (64px).", render: DLSpacing },
  { id: "dl-elevation", name: "Elevation", cat: "Foundations", desc: "Layered surfaces via shadow tokens. Raised / floating / overflow / modal.", render: DLElevation },
  { id: "dl-icons", name: "Iconography", cat: "Foundations", desc: "Material Symbols stand-in; the @carbon/icons-react package ships 2,000+ icons in production (Phase 7).", render: DLIcons },
  { id: "dl-tokens", name: "Token Architecture", cat: "Foundations", desc: "Semantic token layer over the Carbon palette: $interactive, $layer, $field, $text, $support.", render: DLTokens },
  { id: "dl-density", name: "Density", cat: "Foundations", desc: "Compact / normal / spacious ladder matching Carbon's spacing scale (24 / 32 / 48px).", render: DLDensity },
  { id: "dl-a11y", name: "Accessibility", cat: "Foundations", desc: "WCAG 2.1 AA. Contrast, focus rings, touch targets, screen reader labels.", render: DLAccessibility },
  { id: "dl-motion", name: "Motion", cat: "Foundations", desc: "Carbon duration + easing tokens: fast-01/02, moderate-01/02, slow-01.", render: DLMotion },
  { id: "tokens", name: "Tokens", cat: "Foundations", desc: "Full token reference with contrast ratios (routed to TokenReference).", render: () => null },
  { id: "audit", name: "Design Audit", cat: "Foundations", desc: "Paste code to audit against Carbon token conventions.", render: () => null },

  // Components
  { id: "buttons", name: "Button", cat: "Components", desc: "5 variants: primary, secondary, tertiary, ghost, danger. 4 sizes.", render: Buttons },
  { id: "icon-button", name: "Icon Button", cat: "Components", desc: "Ghost button containing a single icon. 32px square.", render: IconButton },
  { id: "inputs", name: "Text Input", cat: "Components", desc: "Underline style with focus ring. Helper + error text.", render: Inputs },
  { id: "search", name: "Search", cat: "Components", desc: "Text input with leading search icon.", render: Search },
  { id: "checkboxes", name: "Checkbox", cat: "Components", desc: "Square with fill-on-check. Supports indeterminate (not shown).", render: Checkboxes },
  { id: "radios", name: "Radio Button", cat: "Components", desc: "Round with center dot. Mutually exclusive.", render: Radios },
  { id: "switches", name: "Toggle", cat: "Components", desc: "Pill-shaped switch for boolean state.", render: Toggles },
  { id: "tabs", name: "Tabs", cat: "Components", desc: "Underline tabs with bold active label.", render: Tabs },
  { id: "tags", name: "Tag", cat: "Components", desc: "Pill label for status / category. Red / green / yellow / blue variants.", render: Tags },
  { id: "cards", name: "Tile", cat: "Components", desc: "Layer-elevated container. Clickable + selectable variants.", render: Cards },
  { id: "alerts", name: "Notification", cat: "Components", desc: "Inline alert with left border. Info / success / warning / error.", render: Notifications },
  { id: "progress", name: "Progress Bar", cat: "Components", desc: "Horizontal fill with optional label and percentage.", render: Progress },
  { id: "loading", name: "Loading", cat: "Components", desc: "Spinner for indeterminate progress. 44px circular.", render: Loading },
  { id: "accordion", name: "Accordion", cat: "Components", desc: "Collapsible rows with expand icon. Single-open by default.", render: Accordion },
  { id: "breadcrumbs", name: "Breadcrumb", cat: "Components", desc: "Slash-separated path links in muted foreground.", render: Breadcrumbs },
  { id: "data-table", name: "Data Table", cat: "Components", desc: "Bordered table with status tags and hover rows.", render: DataTableDemo },
  { id: "dialog", name: "Modal", cat: "Components", desc: "Centered dialog with title, body, action bar.", render: ModalDemo },
  { id: "tooltips", name: "Tooltip", cat: "Components", desc: "Hover/focus triggered popover with arrow.", render: TooltipDemo },
  { id: "avatars", name: "Avatar", cat: "Components", desc: "Initials on brand or status colour background.", render: Avatars },
  { id: "link", name: "Link", cat: "Components", desc: "Underlined anchor in brand blue, hover deepens.", render: Links },
  { id: "slider", name: "Slider", cat: "Components", desc: "Range input with click-to-position.", render: Slider },
  { id: "dropdowns", name: "Dropdown", cat: "Components", desc: "Click-to-open select with fill surface.", render: DropdownDemo },

  // Patterns
  { id: "pat-dashboard", name: "Analytical Dashboard", cat: "Patterns", desc: "KPI tile row + data table composed Carbon-style.", render: PatDashboard },
  { id: "pat-form", name: "Form", cat: "Patterns", desc: "Labelled inputs + primary/ghost action bar.", render: PatForm },
  { id: "pat-app-shell", name: "App Shell", cat: "Patterns", desc: "Header + side nav + main content + active-state indicator.", render: PatAppShell },
];

/* Preview thumbnails for the landing grid. Keep these lightweight
   and consistent with the full demos - they render in tiny tiles
   so avoid complex stateful components. */
const PREVIEWS = {
  "dl-color": DLColor,
  "dl-typography": DLTypography,
  "dl-spacing": DLSpacing,
  "dl-icons": DLIcons,
  buttons: Buttons,
  inputs: Inputs,
  tags: Tags,
  cards: Cards,
  tabs: Tabs,
  alerts: Notifications,
  progress: Progress,
  checkboxes: Checkboxes,
  radios: Radios,
  switches: Toggles,
  accordion: Accordion,
  breadcrumbs: Breadcrumbs,
  "data-table": DataTableDemo,
  avatars: Avatars,
};

/* ──────────────────────────────────────────────
   CATEGORIES + EXPORTS
   ────────────────────────────────────────────── */
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
   DENSITY - Carbon spacing-scale ladder
   ────────────────────────────────────────────── */
export function getCarbonDensityCSS(density) {
  const map = {
    compact:  ".cb-btn{height:24px;padding:0 8px;font-size:12px;} .cb-input{height:32px;font-size:12px;}",
    normal:   ".cb-btn{height:32px;padding:0 12px;font-size:14px;} .cb-input{height:40px;font-size:14px;}",
    spacious: ".cb-btn{height:48px;padding:0 16px;font-size:14px;} .cb-input{height:48px;font-size:14px;}",
  };
  return map[density] || map.normal;
}
