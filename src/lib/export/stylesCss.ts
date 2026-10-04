/**
 * stylesCss - the fallback stylesheet every runnable export ships
 * (Vite `src/styles.css`, and the React download's `styles.css`).
 *
 * Two parts:
 *   1. TOKEN BLOCK (per DS, per mode). The generic `--bg / --fg / --accent …`
 *      variables the fallback primitives consume. Previously this was ONE
 *      hardcoded `:root` in uoaui purple for all five design systems, so a
 *      Salt / Carbon / M3 / Fluent canvas whose blocks fell through to the
 *      generic markup shipped the wrong brand, and dark/light followed the
 *      OS (`prefers-color-scheme`) instead of the builder's mode.
 *      Now:
 *        - `:root` carries the LITERAL palette of the builder's active mode,
 *          read from each DS's official token source (Salt theme table,
 *          @carbon/themes, MUI's generated `--mui-*` sheet, @fluentui/react-theme,
 *          the uoaui theme table).
 *        - `.dashboard-layout[data-mode=light|dark]` carries both modes and
 *          ALIASES each variable to the DS's own CSS variable with the literal
 *          as fallback (e.g. `--accent: var(--salt-actionable-bold-background,
 *          #1B7F9E)`), so inside the real provider the fallback primitives
 *          follow the live DS tokens, and outside it they still resolve.
 *   2. PRIMITIVES (DS-agnostic). Shell layout + the `.btn / .card / …` rules
 *      the generic-markup path emits. Unchanged.
 *   3. REPORT_CSS (DS-agnostic). The report and application-chrome markup
 *      reportMarkup.ts emits: chrome tones, flush / right-docked zones, top
 *      nav, tab strip, nav group, page title, framed panel, data table.
 *   4. REPORT_RICH_CSS (DS-agnostic, only when the canvas needs it). Rich
 *      grid cells (heat, bar, chip, delta, sparkline, badge, toned text,
 *      flag, rank), the record panel, the gauge reading.
 *   5. REPORT_BLOCKS_CSS (DS-agnostic, only when the canvas needs it). The
 *      report card blocks (entity header, metric tile, verdict card, launcher
 *      card, hero), dot and tag cells, group heading rows.
 */

import { getTheme } from "@/data/registry";
import { getCarbonOfficialTokens } from "@/lib/officialTokens";
import { buildM3TokenCSS } from "@/lib/officialM3FluentTokens";
import { webLightTheme, webDarkTheme } from "@fluentui/react-theme";
import type { SystemId } from "@/lib/componentApiRegistry";
import { PANEL_HEADER_HEIGHT, PANEL_PADDING, PANEL_VIEW_BY_WIDTH } from "@/lib/panelMetrics";

export type ExportMode = "light" | "dark";

/** The generic variables the fallback primitives consume. */
export interface ExportPalette {
  bg: string;
  fg: string;
  fgMuted: string;
  surface: string;
  border: string;
  accent: string;
  accentFg: string;
  success: string;
  warn: string;
  error: string;
  info: string;
  radius: string;
  font: string;
}

export const PALETTE_VAR: Record<keyof ExportPalette, string> = {
  bg: "--bg",
  fg: "--fg",
  fgMuted: "--fg-muted",
  surface: "--surface",
  border: "--border",
  accent: "--accent",
  accentFg: "--accent-fg",
  success: "--success",
  warn: "--warn",
  error: "--error",
  info: "--info",
  radius: "--radius",
  font: "--font",
};

/* ── Per-DS official sources ─────────────────────────────────────────── */

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

/** Parse one `--mui-*` block out of buildM3TokenCSS() (dark = `.preview-m3`,
 *  light = `.builder-light .preview-m3`) into a name → value map. */
function muiVars(mode: ExportMode): Record<string, string> {
  const css = buildM3TokenCSS();
  const selector = mode === "dark" ? ".preview-m3{" : ".builder-light .preview-m3{";
  const start = css.indexOf(selector);
  if (start === -1) return {};
  const body = css.slice(start + selector.length, css.indexOf("}", start));
  const out: Record<string, string> = {};
  for (const decl of body.split(";")) {
    const i = decl.indexOf(":");
    if (i > 0) out[decl.slice(0, i).trim()] = decl.slice(i + 1).trim();
  }
  return out;
}

/** Literal palette from the DS's official token source for one mode. */
export function officialPalette(system: SystemId, mode: ExportMode): ExportPalette {
  const dark = mode === "dark";
  switch (system) {
    case "salt": {
      const T = getTheme("salt", dark ? "jpm-dark" : "jpm-light");
      return {
        bg: str(T.bg, dark ? "#101820" : "#FFFFFF"),
        fg: str(T.fg, dark ? "#FFFFFF" : "#000000"),
        fgMuted: str(T.fg2, dark ? "#D3D5D8" : "#4C5157"),
        surface: str(T.bg2, dark ? "#1A2229" : "#F5F7F8"),
        border: str(T.border, dark ? "#5F646A" : "#B1B5B9"),
        accent: str(T.accent, "#1B7F9E"),
        accentFg: str(T.accentFg, "#FFFFFF"),
        success: str(T.positive, dark ? "#53B087" : "#00875D"),
        warn: str(T.caution, dark ? "#EB7B39" : "#C75300"),
        error: str(T.negative, dark ? "#FF5D57" : "#E52135"),
        info: str(T.info, dark ? "#669CE8" : "#0078CF"),
        radius: "4px",
        font: "'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      };
    }
    case "carbon": {
      const c = getCarbonOfficialTokens(dark ? "g100" : "white");
      return {
        bg: str(c["--cds-background"], dark ? "#161616" : "#ffffff"),
        fg: str(c["--cds-text-primary"], dark ? "#f4f4f4" : "#161616"),
        fgMuted: str(c["--cds-text-secondary"], dark ? "#c6c6c6" : "#525252"),
        surface: str(c["--cds-layer-01"], dark ? "#262626" : "#f4f4f4"),
        border: str(c["--cds-border-subtle-01"], dark ? "#393939" : "#e0e0e0"),
        accent: str(c["--cds-interactive"], dark ? "#4589ff" : "#0f62fe"),
        accentFg: str(c["--cds-text-on-color"], "#ffffff"),
        success: str(c["--cds-support-success"], dark ? "#42be65" : "#24a148"),
        warn: str(c["--cds-support-warning"], dark ? "#f1c21b" : "#f1c21b"),
        error: str(c["--cds-support-error"], dark ? "#fa4d56" : "#da1e28"),
        info: str(c["--cds-support-info"], dark ? "#4589ff" : "#0043ce"),
        radius: "0px",
        font: "'IBM Plex Sans', system-ui, sans-serif",
      };
    }
    case "m3": {
      const m = muiVars(mode);
      return {
        bg: str(m["--mui-palette-background-default"], dark ? "#121212" : "#fff"),
        fg: str(m["--mui-palette-text-primary"], dark ? "#fff" : "rgba(0, 0, 0, 0.87)"),
        fgMuted: str(m["--mui-palette-text-secondary"], dark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)"),
        surface: str(m["--mui-palette-background-paper"], dark ? "#121212" : "#fff"),
        border: str(m["--mui-palette-divider"], dark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)"),
        accent: str(m["--mui-palette-primary-main"], dark ? "#D0BCFF" : "#6750A4"),
        accentFg: str(m["--mui-palette-primary-contrastText"], dark ? "#381E72" : "#FFFFFF"),
        success: str(m["--mui-palette-success-main"], dark ? "#66bb6a" : "#2e7d32"),
        warn: str(m["--mui-palette-warning-main"], dark ? "#ffa726" : "#ed6c02"),
        error: str(m["--mui-palette-error-main"], dark ? "#F2B8B5" : "#B3261E"),
        info: str(m["--mui-palette-info-main"], dark ? "#29b6f6" : "#0288d1"),
        radius: str(m["--mui-shape-borderRadius"], "4px"),
        font: "Roboto, system-ui, sans-serif",
      };
    }
    case "fluent": {
      const t = (dark ? webDarkTheme : webLightTheme) as unknown as Record<string, unknown>;
      return {
        bg: str(t.colorNeutralBackground1, dark ? "#292929" : "#ffffff"),
        fg: str(t.colorNeutralForeground1, dark ? "#ffffff" : "#242424"),
        fgMuted: str(t.colorNeutralForeground2, dark ? "#d6d6d6" : "#424242"),
        surface: str(t.colorNeutralBackground3, dark ? "#141414" : "#f5f5f5"),
        border: str(t.colorNeutralStroke1, dark ? "#666666" : "#d1d1d1"),
        accent: str(t.colorBrandBackground, dark ? "#115ea3" : "#0f6cbd"),
        accentFg: str(t.colorNeutralForegroundOnBrand, "#ffffff"),
        success: str(t.colorStatusSuccessForeground1, dark ? "#54b054" : "#0e700e"),
        warn: str(t.colorStatusWarningForeground1, dark ? "#faa06b" : "#bc4b09"),
        error: str(t.colorStatusDangerForeground1, dark ? "#dc626d" : "#b10e1c"),
        info: str(t.colorBrandForeground1, dark ? "#479ef5" : "#0f6cbd"),
        radius: str(t.borderRadiusMedium, "4px"),
        font: str(t.fontFamilyBase, "'Segoe UI', system-ui, sans-serif"),
      };
    }
    default: {
      const T = getTheme("uoaui", dark ? "dark" : "light");
      return {
        bg: str(T.bg, dark ? "#0b1120" : "#FFFFFF"),
        fg: str(T.fg, dark ? "#E8EAED" : "#15102a"),
        fgMuted: str(T.fg2, dark ? "#9CA3AF" : "#5b5670"),
        surface: str(T.surface, dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)"),
        border: str(T.borderMd, dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)"),
        accent: str(T.accent, "#8A58C9"),
        accentFg: str(T.accentFg, "#ffffff"),
        success: str(T.successFg, "#4ADE80"),
        warn: str(T.warningFg, "#FBBF24"),
        error: str(T.dangerFg, "#F87171"),
        info: str(T.infoFg, "#A78BFA"),
        radius: "12px",
        font: "'Inter', system-ui, -apple-system, sans-serif",
      };
    }
  }
}

/** The DS's own CSS variable for each generic slot, when the DS exposes one at
 *  runtime inside its provider (Salt `.salt-theme`, Carbon `.cds--*` theme
 *  class, Fluent's provider root, uoaui's theme sheet). M3's ThemeProvider
 *  emits no CSS variables unless `cssVariables: true`; the alias is still
 *  emitted so a project that enables it picks the live values up. */
export const DS_VAR_ALIAS: Record<SystemId, Partial<Record<keyof ExportPalette, string>>> = {
  salt: {
    bg: "--salt-container-primary-background",
    fg: "--salt-content-primary-foreground",
    fgMuted: "--salt-content-secondary-foreground",
    surface: "--salt-container-secondary-background",
    border: "--salt-separable-primary-borderColor",
    accent: "--salt-actionable-bold-background",
    accentFg: "--salt-actionable-bold-foreground",
    success: "--salt-status-success-foreground",
    warn: "--salt-status-warning-foreground",
    error: "--salt-status-error-foreground",
    info: "--salt-status-info-foreground",
  },
  carbon: {
    bg: "--cds-background",
    fg: "--cds-text-primary",
    fgMuted: "--cds-text-secondary",
    surface: "--cds-layer-01",
    border: "--cds-border-subtle-01",
    accent: "--cds-interactive",
    accentFg: "--cds-text-on-color",
    success: "--cds-support-success",
    warn: "--cds-support-warning",
    error: "--cds-support-error",
    info: "--cds-support-info",
  },
  m3: {
    bg: "--mui-palette-background-default",
    fg: "--mui-palette-text-primary",
    fgMuted: "--mui-palette-text-secondary",
    surface: "--mui-palette-background-paper",
    border: "--mui-palette-divider",
    accent: "--mui-palette-primary-main",
    accentFg: "--mui-palette-primary-contrastText",
    success: "--mui-palette-success-main",
    warn: "--mui-palette-warning-main",
    error: "--mui-palette-error-main",
    info: "--mui-palette-info-main",
    radius: "--mui-shape-borderRadius",
  },
  fluent: {
    bg: "--colorNeutralBackground1",
    fg: "--colorNeutralForeground1",
    fgMuted: "--colorNeutralForeground2",
    surface: "--colorNeutralBackground3",
    border: "--colorNeutralStroke1",
    accent: "--colorBrandBackground",
    accentFg: "--colorNeutralForegroundOnBrand",
    success: "--colorStatusSuccessForeground1",
    warn: "--colorStatusWarningForeground1",
    error: "--colorStatusDangerForeground1",
    info: "--colorBrandForeground1",
    radius: "--borderRadiusMedium",
    font: "--fontFamilyBase",
  },
  uoaui: {
    bg: "--a-bg",
    fg: "--a-fg",
    fgMuted: "--a-fg-muted",
    surface: "--a-surface",
    border: "--a-border",
    accent: "--a-accent",
    accentFg: "--a-accent-fg",
    radius: "--a-radius",
    font: "--a-font",
  },
};

const DS_LABEL: Record<SystemId, string> = {
  salt: "Salt DS",
  m3: "Material 3 (MUI)",
  fluent: "Fluent 2",
  carbon: "Carbon DS",
  uoaui: "uoaui DS",
};

function literalDecls(p: ExportPalette): string {
  return (Object.keys(PALETTE_VAR) as (keyof ExportPalette)[])
    .map((k) => `  ${PALETTE_VAR[k]}: ${p[k]};`)
    .join("\n");
}

function aliasDecls(system: SystemId, p: ExportPalette): string {
  const alias = DS_VAR_ALIAS[system] ?? {};
  return (Object.keys(PALETTE_VAR) as (keyof ExportPalette)[])
    .map((k) => {
      const dsVar = alias[k];
      return `  ${PALETTE_VAR[k]}: ${dsVar ? `var(${dsVar}, ${p[k]})` : p[k]};`;
    })
    .join("\n");
}

/** The per-DS, per-mode token block. */
export function buildTokenBlock(system: SystemId, mode: ExportMode): string {
  const light = officialPalette(system, "light");
  const dark = officialPalette(system, "dark");
  const active = mode === "dark" ? dark : light;
  return `/* ── ${DS_LABEL[system] ?? system} tokens (official values; builder mode: ${mode}) ──
   :root carries the active mode's literal palette. Inside the app root each
   variable aliases the DS's own CSS variable (with the literal as fallback),
   so the fallback primitives follow the real DS tokens once its provider /
   theme stylesheet is in scope. Switch modes via data-mode on .dashboard-layout. */
:root {
${literalDecls(active)}
}

.dashboard-layout[data-mode="light"] {
${aliasDecls(system, light)}
}

.dashboard-layout[data-mode="dark"] {
${aliasDecls(system, dark)}
}
`;
}

/* ── DS-agnostic primitives (selectors MUST match what reactExporter emits) ── */
export const PRIMITIVES_CSS = `* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; font-family: var(--font); background: var(--bg); color: var(--fg); min-height: 100vh; }

/* Skip link — visually hidden off-screen until it receives keyboard focus,
   then it positions itself top-left with a visible focus ring so a keyboard or
   screen-reader user can jump straight to <main id="main-content">. */
.skip-link { position: absolute; left: -9999px; top: 0; z-index: 100; padding: 8px 16px; background: var(--bg); color: var(--fg); border-radius: 6px; }
.skip-link:focus { left: 8px; top: 8px; outline: 2px solid var(--accent); outline-offset: 2px; }

/* ── Shell layout — selectors MUST match the classes reactExporter emits:
   .dashboard-layout wraps the four zones; the body zone is the KPI grid;
   the sidebar sits in a 220px track beside the 1fr body. ── */
.dashboard-layout { display: grid; grid-template-rows: auto 1fr auto; grid-template-columns: 220px 1fr; min-height: 100vh; }
.zone-header { grid-column: 1 / -1; padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; }
.zone-sidebar { border-right: 1px solid var(--border); padding: 12px 8px; display: flex; flex-direction: column; gap: 4px; }
.zone-body { display: grid; grid-template-columns: repeat(12, 1fr); gap: 12px; align-content: start; padding: 16px; }
.zone-footer { grid-column: 1 / -1; padding: 12px 16px; border-top: 1px solid var(--border); color: var(--fg-muted); font-size: 13px; text-align: center; }
.layout-group { display: flex; gap: 12px; }

/* Mobile — stack the shell into a single column under 768px. */
@media (max-width: 768px) {
  .dashboard-layout { grid-template-columns: 1fr; grid-template-rows: auto auto 1fr auto; }
  .zone-sidebar { border-right: 0; border-bottom: 1px solid var(--border); flex-direction: row; flex-wrap: wrap; }
  .zone-body { grid-template-columns: 1fr; }
  /* Inline grid-column (a P3-3 pin or a wide span) would spawn phantom tracks
     and overflow on the 1-col mobile grid; !important neutralizes it so blocks
     stack. */
  .zone-body > .grid-item { grid-column: auto !important; }
}

/* Primitives */
h1 { font-size: 28px; margin: 4px 0; letter-spacing: -0.02em; }
h2 { font-size: 20px; margin: 8px 0; letter-spacing: -0.01em; }
h3 { font-size: 16px; margin: 6px 0; }
h4 { font-size: 14px; margin: 4px 0; color: var(--fg-muted); font-weight: 500; }
label { display: block; font-size: 12px; font-weight: 500; color: var(--fg-muted); }

.btn { display: inline-flex; align-items: center; padding: 8px 14px; border-radius: 6px; border: 0; font-family: inherit; font-size: 14px; cursor: pointer; }
.btn-primary { background: var(--accent); color: var(--accent-fg); }
.btn-secondary { background: var(--surface); color: var(--fg); border: 1px solid var(--border); }
.btn-outline { background: transparent; color: var(--fg); border: 1px solid var(--border); }
.btn-ghost { background: transparent; color: var(--fg); }
.btn:hover { filter: brightness(1.1); }

.form-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
.form-field input { padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); color: var(--fg); font-family: inherit; }

.card { padding: 16px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
.stat-card { padding: 14px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
.stat-label { display: block; font-size: 11px; font-weight: 600; color: var(--fg-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.stat-value { display: block; font-size: 24px; font-weight: 700; margin: 4px 0; }
.progress-bar { height: 4px; background: var(--accent); border-radius: 2px; }

.alert { padding: 12px 16px; border-radius: var(--radius); border: 1px solid var(--border); }
.alert-info    { background: rgba(96, 165, 250, 0.1);  border-color: var(--info); }
.alert-success { background: rgba(74, 222, 128, 0.1);  border-color: var(--success); }
.alert-warning { background: rgba(250, 204, 21, 0.1);  border-color: var(--warn); }
.alert-error   { background: rgba(248, 113, 113, 0.1); border-color: var(--error); }

.badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; background: var(--surface); border: 1px solid var(--border); }

.progress { padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius); }
progress { width: 100%; height: 6px; }

.tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); }
.tab { padding: 8px 12px; border: 0; background: transparent; color: var(--fg-muted); font-family: inherit; cursor: pointer; font-size: 13px; }
.tab:hover { color: var(--fg); }

.checkbox, .switch { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; color: var(--fg); cursor: pointer; }

/* Shell-block primitives (emitted by the generic markup path) */
.app-brand { font-weight: 700; font-size: 16px; letter-spacing: -0.01em; }
.status-pill { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: var(--surface); border: 1px solid var(--border); }
.footer-text { color: var(--fg-muted); font-size: 13px; }
.nav-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 12px; border: 0; background: transparent; color: var(--fg); font-family: inherit; font-size: 14px; text-align: left; border-radius: 6px; cursor: pointer; }
.nav-item.active { background: var(--surface); font-weight: 600; }
.nav-item:hover { background: var(--surface); }
.sim-image { margin: 0; }
.sim-image img { width: 100%; height: auto; display: block; border-radius: var(--radius); }
.sim-image figcaption { font-size: 12px; color: var(--fg-muted); margin-top: 4px; }
.sim-image-placeholder { aspect-ratio: 16 / 9; background: var(--surface); border: 1px dashed var(--border); border-radius: var(--radius); }
.avatar { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; background: var(--surface); border: 1px solid var(--border); object-fit: cover; overflow: hidden; }
.avatar-sm { width: 28px; height: 28px; font-size: 12px; }
.avatar-md { width: 40px; height: 40px; font-size: 14px; }
.avatar-lg { width: 56px; height: 56px; font-size: 18px; }

/* Focus rings — keyboard-visible only. .btn sets border:0, so its ring is an
   outline + offset (never a border) so it stays visible against any fill. */
.btn:focus-visible,
.tab:focus-visible,
.nav-item:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
input:focus-visible,
.checkbox input:focus-visible,
.switch input:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}
`;

/* ── Report + application-chrome styles (selectors MUST match what
   reportMarkup.ts emits). Shared by the React / Vite stylesheet and the
   HTML page export. Colours come from the token variables above; the panel
   measurements are the canvas's own (panelMetrics.ts). ── */
export const REPORT_CSS = `/* ── Chrome tones ──
   A chrome zone (header / sidebar / footer) or a navigation bar picks one of
   five surface treatments through data-tone. Each sets the same four custom
   properties, which the zone or bar then paints with. Dark chrome is dark in
   light AND dark mode, so it carries its own neutral values, defined once. */
:root {
  --chrome-dark: #15171d;
  --chrome-dark-raised: #20232b;
  --chrome-dark-fg: #eceef2;
  --chrome-dark-fg-dim: #a9afbb;
  --chrome-dark-line: rgba(255, 255, 255, 0.1);
}
[data-tone="surface"] { --chrome-bg: var(--surface); --chrome-fg: var(--fg); --chrome-fg-dim: var(--fg-muted); --chrome-line: var(--border); }
[data-tone="transparent"] { --chrome-bg: transparent; --chrome-fg: var(--fg); --chrome-fg-dim: var(--fg-muted); --chrome-line: var(--border); }
[data-tone="inverse"] { --chrome-bg: var(--fg); --chrome-fg: var(--bg); --chrome-fg-dim: color-mix(in srgb, var(--bg) 72%, var(--fg)); --chrome-line: color-mix(in srgb, var(--bg) 18%, transparent); }
[data-tone="dark"] { --chrome-bg: var(--chrome-dark); --chrome-fg: var(--chrome-dark-fg); --chrome-fg-dim: var(--chrome-dark-fg-dim); --chrome-line: var(--chrome-dark-line); }
[data-tone="accent"] { --chrome-bg: var(--accent); --chrome-fg: var(--accent-fg); --chrome-fg-dim: color-mix(in srgb, var(--accent-fg) 78%, transparent); --chrome-line: color-mix(in srgb, var(--accent-fg) 22%, transparent); }
.zone-header[data-tone], .zone-sidebar[data-tone], .zone-footer[data-tone], .topnav, .tabstrip { background: var(--chrome-bg); color: var(--chrome-fg); border-color: var(--chrome-line); }

/* ── Zones ──
   data-layout="ds": the design system's own layout primitive lays the zone
   out, so the landmark is a plain block around it.
   data-flush: bars stack edge to edge, no zone padding or rule.
   data-sidebar on the root: no sidebar (one column) or a right-hand one. */
.zone-header[data-layout="ds"], .zone-sidebar[data-layout="ds"], .zone-body[data-layout="ds"], .zone-footer[data-layout="ds"] { display: block; }
.zone-body { min-width: 0; }
.zone-header[data-flush], .zone-footer[data-flush] { display: block; padding: 0; border-width: 0; }
/* A design system's stack primitive may bring its own gap; flush bars touch. */
.zone-header[data-flush] > *, .zone-footer[data-flush] > * { gap: 0 !important; }
.dashboard-layout[data-sidebar="none"] { grid-template-columns: minmax(0, 1fr); }
.dashboard-layout[data-sidebar="right"] { grid-template-columns: minmax(0, 1fr) 220px; }
.zone-sidebar[data-side="right"] { border-right: 0; border-left: 1px solid var(--border); }
.zone-sidebar[data-side="right"][data-tone] { border-left-color: var(--chrome-line); }

/* ── Navigation bars ── */
.topnav { display: flex; align-items: center; height: 48px; padding-inline: clamp(16px, 2.5vw, 32px); gap: 24px; min-width: 0; font-size: 13px; }
.topnav-brand { flex: none; display: flex; align-items: center; gap: 12px; font-weight: 600; letter-spacing: 0.01em; }
.topnav-mark { display: inline-grid; place-items: center; width: 24px; height: 24px; border-radius: var(--radius); background: var(--accent); color: var(--accent-fg); font-size: 12px; font-weight: 700; }
.topnav-divider { flex: none; width: 1px; height: 20px; background: var(--chrome-line); }
.topnav-links { display: flex; align-items: stretch; align-self: stretch; gap: 24px; min-width: 0; overflow: hidden; }
.topnav-link, .tabstrip-tab { display: inline-flex; align-items: center; gap: 6px; color: var(--chrome-fg-dim); font-size: 13px; text-decoration: none; white-space: nowrap; }
.topnav-link:hover, .tabstrip-tab:hover { color: var(--chrome-fg); }
/* The active link: full-strength text and a bar in the accent colour along
   the bottom edge. */
.topnav-link[aria-current="page"], .tabstrip-tab[aria-current="page"] { color: var(--chrome-fg); font-weight: 600; box-shadow: inset 0 -2px 0 var(--accent); }
/* A small caret after a link or the account that opens a menu. */
.topnav-link[data-chevron]::after, .topnav-account[data-chevron]::after { content: ""; margin-top: 4px; border: 4px solid transparent; border-top-color: currentColor; }
.topnav-spacer { flex: 1 1 auto; }
.topnav-account { flex: none; display: flex; align-items: center; gap: 8px; color: var(--chrome-fg-dim); }
.topnav-avatar { display: inline-block; width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--chrome-line); }
.tabstrip { display: flex; align-items: stretch; height: 40px; padding-inline: clamp(16px, 2.5vw, 32px); gap: 24px; min-width: 0; overflow-x: auto; scrollbar-width: none; border-bottom: 1px solid var(--chrome-line); }
/* A dark tab strip under a dark top bar reads as a second, lifted level. */
.tabstrip[data-tone="dark"] { background: var(--chrome-dark-raised); }
.tabstrip-add { display: inline-grid; place-items: center; color: var(--chrome-fg-dim); }
.nav-group { margin: 0; padding: 12px 12px 6px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--fg-muted); }
.topnav-link:focus-visible, .tabstrip-tab:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
/* On a phone the primary links and the account name give way to the brand. */
@media (max-width: 560px) {
  .topnav-links, .topnav-divider, .topnav-account-name { display: none; }
  .topnav, .tabstrip { padding-inline: 16px; gap: 16px; }
}

/* ── Page title: one fixed size, the active system's font and colour ── */
.page-title-wrap { min-width: 0; }
.page-title { margin: 0; font-size: 24px; font-weight: 600; line-height: 1.2; letter-spacing: -0.01em; color: var(--fg); text-wrap: balance; }
.page-caption { margin: 4px 0 0; font-size: 13px; color: var(--fg-muted); }
.section-title { margin: 0; font-size: 15px; font-weight: 600; line-height: 1.3; color: var(--fg); }
/* ── Context bar: the page title and its filters on one compact line ── */
.contextbar { box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: 24px; min-height: 40px; padding: 6px clamp(16px, 2.5vw, 24px); min-width: 0; background: var(--bg); color: var(--fg); border-bottom: 1px solid var(--border); }
.contextbar .page-title { flex: none; font-size: 13px; letter-spacing: 0; }
.contextbar-filters { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 6px 24px; min-width: 0; }
.inline-field { display: flex; align-items: center; gap: 6px; min-width: 0; }
.inline-field label { flex: none; font-size: 11px; color: var(--fg-muted); white-space: nowrap; }
.dropdown-inline { height: 24px; min-width: 96px; padding: 0 4px; border: 0; border-bottom: 1px solid var(--border-strong, var(--border)); border-radius: 0; background: transparent; color: var(--fg); font-family: inherit; font-size: 12px; }
/* ── Instrument header ── */
.instrument { display: flex; flex-direction: column; gap: 6px; padding: 12px clamp(16px, 2.5vw, 24px); background: var(--bg); color: var(--fg); border-bottom: 1px solid var(--border); font-size: 12px; }
.instrument-main, .instrument-sub { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; min-width: 0; }
.instrument-symbol { margin: 0; font-size: 20px; font-weight: 700; line-height: 1.2; }
.instrument-meta { color: var(--fg-muted); }
.instrument-ohlc { display: flex; flex-wrap: wrap; gap: 4px 10px; margin: 0; font-variant-numeric: tabular-nums; }
.instrument-ohlc > div { display: flex; gap: 2px; }
.instrument-ohlc dt { color: var(--fg-muted); }
.instrument-ohlc dt::after { content: ":"; }
.instrument-ohlc dd { margin: 0; font-weight: 600; }
.instrument-change { font-weight: 600; color: var(--tone); }
.instrument-quote { display: flex; gap: 8px; margin-left: auto; }
.instrument-side { display: flex; flex-direction: column; align-items: center; padding: 4px 10px; border: 1px solid var(--border); border-radius: var(--radius); }
.instrument-side strong { font-size: 16px; font-variant-numeric: tabular-nums; }
.instrument-orders { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; list-style: none; }
.instrument-orders li { padding: 4px 8px; border: 1px solid var(--border); border-radius: var(--radius); }
.instrument-orders li[aria-current] { border-color: var(--accent); }
.instrument-orders li span { color: var(--fg-muted); }
.dropdown-inline:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }

/* ── Dropdown (plain select) ── */
.dropdown, .panel-viewby { padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); color: var(--fg); font-family: inherit; font-size: 14px; }
.dropdown:focus-visible, .panel-viewby:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }

/* ── Framed panel: the card a chart or a data table sits in. Its height is
   set inline by the block; the header and padding are fixed. ── */
.panel { box-sizing: border-box; display: flex; flex-direction: column; min-width: 0; overflow: hidden; background: var(--surface); color: var(--fg); border: 1px solid var(--border); border-radius: var(--radius); }
.panel-header { box-sizing: border-box; flex: 0 0 ${PANEL_HEADER_HEIGHT}px; height: ${PANEL_HEADER_HEIGHT}px; display: flex; align-items: center; justify-content: space-between; gap: ${PANEL_PADDING}px; padding-inline: ${PANEL_PADDING}px; min-width: 0; }
.panel-heading { flex: 1 1 auto; display: flex; align-items: baseline; gap: ${PANEL_PADDING / 2}px; min-width: 0; }
.panel-title { flex: 0 1 auto; min-width: 0; margin: 0; font-size: 14px; font-weight: 600; line-height: 1.3; letter-spacing: 0; color: var(--fg); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* When the header is tight the subtitle gives way first, then the title truncates. */
.panel-subtitle { flex: 0 1000 auto; min-width: 0; overflow: hidden; font-size: 12px; line-height: 1.3; color: var(--fg-muted); white-space: nowrap; }
.panel-viewby { flex: 0 100 ${PANEL_VIEW_BY_WIDTH}px; min-width: 0; padding: 4px 8px; font-size: 13px; }
.panel-body { box-sizing: border-box; flex: 1 1 auto; min-height: 0; min-width: 0; padding: 0 ${PANEL_PADDING}px ${PANEL_PADDING}px; }
.panel-empty { margin: 0; font-size: 13px; color: var(--fg-muted); }

/* ── Data table: scrolls inside its region; grouped headers, right-aligned
   numbers, negative values and total rows flagged. ── */
.table-scroll { height: 100%; overflow: auto; }
.table-scroll:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; font-variant-numeric: tabular-nums; }
.data-table th, .data-table td { height: 32px; padding: 0 8px; border-bottom: 1px solid var(--border); font-weight: 400; text-align: left; white-space: nowrap; }
.data-table thead th, .data-table thead td { height: 36px; font-size: 12px; font-weight: 600; color: var(--fg-muted); }
.data-table-groups th { text-align: center; }
.data-table .num { text-align: right; }
.data-table .is-negative { color: var(--error); }
.data-table .is-total th, .data-table .is-total td { font-weight: 600; }
.data-table .is-selected { background: color-mix(in srgb, var(--accent) 12%, transparent); box-shadow: inset 2px 0 0 var(--accent); }
.data-table tbody tr:hover { background: color-mix(in srgb, var(--fg) 6%, transparent); }
.data-table [data-indent="1"] { padding-left: 24px; }
.data-table [data-indent="2"] { padding-left: 40px; }
.data-table [data-indent="3"] { padding-left: 56px; }
.chart-data { margin: 0; height: 100%; display: flex; flex-direction: column; min-height: 0; }
.chart-data .table-scroll { flex: 1 1 auto; min-height: 0; height: auto; }
.chart-data-total { font-size: 15px; font-weight: 600; padding-bottom: 8px; }

/* ── Narrow frames ──
   The shell's mobile rule sets one column; a right-hand sidebar track must
   fold with it. A grid item that names its own tablet / phone span (of the
   body grid's columns) takes it at that width instead of the generic collapse. */
@media (max-width: 768px) {
  .dashboard-layout[data-sidebar="right"] { grid-template-columns: minmax(0, 1fr); }
  .zone-sidebar[data-side="right"] { border-left: 0; border-top: 1px solid var(--border); border-bottom: 0; }
  .zone-body:has(> .grid-item[data-span-phone]) { grid-template-columns: repeat(var(--body-cols, 12), 1fr); }
  .zone-body:has(> .grid-item[data-span-phone]) > .grid-item { grid-column: 1 / -1 !important; }
  .zone-body:has(> .grid-item[data-span-phone]) > .grid-item[data-span-phone] { grid-column: span var(--span-phone) !important; }
}
@media (min-width: 769px) and (max-width: 1024px) {
  .zone-body > .grid-item[data-span-tablet] { grid-column: span var(--span-tablet) !important; }
}
`;

/* ── Rich grid cells, the record panel and a gauge's reading (selectors MUST
   match what reportMarkup.ts emits). Shipped only with a canvas that draws
   them (usesRichReport), so other exports keep the stylesheet they had.

   A tone is a meaning, not a colour: the tone-* class sets --tone to the
   design system's status variable from the token block (positive / warning /
   negative / accent), and each cell kind paints with --tone. The same mixes
   as the canvas (builder.css, ".dh-cell-*" and ".dh-record-*"). ── */
export const REPORT_RICH_CSS = `
/* ── Tones ── */
.tone-good { --tone: var(--success); }
.tone-mid { --tone: var(--warn); }
.tone-bad { --tone: var(--error); }
.tone-accent { --tone: var(--accent); }
.tone-neutral { --tone: var(--fg-muted); }
.visually-hidden { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; border: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* ── Rich cells ── */
/* Heat: a tint of the tone behind ordinary text that leans towards it. */
.data-table .cell-heat { background: color-mix(in srgb, var(--tone) 16%, transparent); color: color-mix(in srgb, var(--tone) 62%, var(--fg)); }
.cell-arrow { flex: none; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.cell-bar { display: flex; align-items: center; gap: 6px; width: 100%; min-width: 96px; }
.cell-bar-track { flex: 1 1 auto; height: 6px; border-radius: 6px; background: color-mix(in srgb, var(--fg) 10%, transparent); overflow: hidden; }
.cell-bar-fill { display: block; height: 100%; border-radius: inherit; background: var(--tone); }
.cell-bar-value { flex: 0 0 44px; text-align: right; font-size: 11px; color: var(--fg-muted); }
.cell-chip { display: inline-flex; align-items: center; gap: 2px; height: 20px; padding: 0 8px 0 6px; border-radius: 20px; background: color-mix(in srgb, var(--tone) 16%, transparent); color: color-mix(in srgb, var(--tone) 62%, var(--fg)); font-size: 11px; font-weight: 600; line-height: 1; }
.cell-delta-wrap { display: inline-flex; align-items: center; gap: 6px; vertical-align: middle; }
.cell-delta { display: inline-flex; align-items: center; gap: 2px; font-weight: 600; color: color-mix(in srgb, var(--tone) 70%, var(--fg)); }
.cell-delta.is-flat { font-weight: 400; color: var(--fg-muted); }
.cell-spark { flex: none; color: var(--tone); overflow: visible; vertical-align: middle; }
.cell-spark polyline { stroke-width: 1.5; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.cell-badge { display: inline-grid; place-items: center; box-sizing: border-box; min-width: 26px; height: 26px; padding-inline: 3px; border-radius: 26px; border: 1px solid color-mix(in srgb, var(--tone) 45%, transparent); background: color-mix(in srgb, var(--tone) 14%, transparent); color: color-mix(in srgb, var(--tone) 62%, var(--fg)); font-size: 11px; font-weight: 600; line-height: 1; }
.cell-tonetext { font-weight: 600; color: color-mix(in srgb, var(--tone) 70%, var(--fg)); }
.cell-tonetext.is-neutral { font-weight: 400; color: var(--fg-muted); }
.cell-flag { display: inline-flex; align-items: center; gap: 6px; }
.cell-flag-code { font-size: 11px; color: var(--fg-muted); }
.cell-rank { color: var(--fg-muted); }

/* ── Gauge reading (page export: the dial's value as text) ── */
.chart-value { margin: 0; font-size: 22px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--fg); }

/* ── Record panel: the detail of the selected record. Sections stack in a
   narrow panel and sit side by side in a wide one. ── */
.record { box-sizing: border-box; height: 100%; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(14rem, 100%), 1fr)); align-content: start; align-items: start; gap: 16px 32px; overflow-y: auto; font-size: 13px; color: var(--fg); }
.record-empty { place-content: center; place-items: center; color: var(--fg-muted); text-align: center; }
.record-empty p { margin: 0; max-width: 24ch; }
.record-pairs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 16px; margin: 0; }
.record-pairs.is-rows { grid-template-columns: minmax(0, 1fr); gap: 8px; }
.record-pairs.is-rows > div { display: flex; justify-content: space-between; gap: 16px; }
.record-pair { min-width: 0; }
.record-pair dt, .record-heading { margin: 0 0 3px; font-size: 11px; font-weight: 600; letter-spacing: 0.02em; color: var(--fg-muted); }
.record-pair dd { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.record-section { min-width: 0; }
.record-table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
.record-table th, .record-table td { padding: 6px 0; border-bottom: 1px solid var(--border); text-align: right; font-weight: 400; }
.record-table thead th { font-size: 11px; font-weight: 600; color: var(--fg-muted); }
.record-table th + th, .record-table th + td, .record-table td + td { padding-inline-start: 12px; }
.record-table th[scope="row"], .record-table thead th:first-child { text-align: left; }
.record-change { display: inline-flex; color: color-mix(in srgb, var(--tone) 70%, var(--fg)); }
.record-flat { color: var(--fg-muted); }
`;

/* ── Report card blocks, dot and tag cells, group heading rows (selectors
   MUST match what reportMarkup.ts emits). Shipped only with a canvas that
   draws them (usesReportBlocks), after REPORT_RICH_CSS, whose tones, bar
   track and visually-hidden rule they use. The same sizes and mixes as the
   canvas (builder.css, ".dh-cell-dot", ".dh-cell-tag", ".dh-entity",
   ".dh-tile", ".dh-verdict", ".dh-launcher", ".dh-hero"). ── */
export const REPORT_BLOCKS_CSS = `
/* ── Dot and tag cells ── */
.cell-dot { display: inline-flex; align-items: center; gap: 6px; }
.cell-dot.is-strong { font-weight: 600; color: color-mix(in srgb, var(--tone) 70%, var(--fg)); }
.cell-dot-mark { flex: none; box-sizing: border-box; width: 8px; height: 8px; border-radius: 50%; background: var(--tone); }
.cell-dot.is-hollow .cell-dot-mark { background: none; border: 2px solid var(--tone); }
.cell-tag { display: inline-flex; align-items: center; height: 20px; padding-inline: 6px; border-radius: var(--radius); background: color-mix(in srgb, var(--tone) 16%, transparent); color: color-mix(in srgb, var(--tone) 62%, var(--fg)); font-size: 11px; font-weight: 600; line-height: 1; }
.cell-tag.is-solid { min-width: 20px; justify-content: center; background: var(--tone); color: var(--bg); }

/* ── Group heading row: a sunken band above its indented rows ── */
.data-table .is-heading { background: color-mix(in srgb, var(--fg) 5%, transparent); }
.data-table .is-heading th, .data-table .is-heading td { font-weight: 600; }

/* ── Icons: inline SVG, stroked in the text colour around them ── */
.tile-icon, .tile-sub-icon, .hero-icon, .launcher-arrow { flex: none; stroke-linecap: round; stroke-linejoin: round; }
.tile-icon { stroke-width: 1.3; color: var(--fg-muted); }
.tile-sub-icon { stroke-width: 1.4; }
.hero-icon { stroke-width: 1.8; }
.launcher-arrow { stroke-width: 2; }

/* ── Entity header: the name of the entity and a line of facts ── */
.entity { box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; gap: 6px; min-width: 0; color: var(--fg); }
.entity-main { display: flex; align-items: center; gap: 9px; min-width: 0; }
.entity-eyebrow, .entity-suffix { font-size: 12px; color: var(--fg-muted); white-space: nowrap; }
.entity-eyebrow { text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
.entity-title { margin: 0; font-size: 22px; font-weight: 700; line-height: 1.2; letter-spacing: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.entity-facts { display: flex; flex-wrap: wrap; gap: 3px 16px; margin: 0; font-size: 12px; }
.entity-facts > div { display: flex; gap: 6px; min-width: 0; }
.entity-facts dt { color: var(--fg-muted); }
.entity-facts dt::after { content: ":"; }
.entity-facts dd { margin: 0; color: var(--fg); }

/* ── Metric tile: a label, an icon and a figure; chips; sub-figures ── */
.tile { box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; gap: 6px; width: 100%; min-width: 0; padding: 16px; background: var(--surface); color: var(--fg); border: 1px solid var(--border); border-radius: var(--radius); font-family: inherit; font-size: inherit; text-align: left; }
button.tile { appearance: none; cursor: pointer; }
.tile-selectable:hover { border-color: color-mix(in srgb, var(--accent) 50%, var(--border)); }
.tile-selectable.is-selected { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
.tile-selectable:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.tile-label { font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--fg-muted); }
.tile-row { display: flex; align-items: center; gap: 16px; min-width: 0; }
.tile-main { display: flex; align-items: center; gap: 9px; }
.tile-value { font-size: 22px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
.tile-value.is-muted { color: var(--fg-muted); }
.tile-subs { flex: 1 1 auto; display: flex; gap: 16px; min-width: 0; padding-left: 16px; border-left: 1px solid var(--border); }
.tile-sub { flex: 1 1 0; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.tile-sub-label { font-size: 11px; color: var(--fg-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tile-sub-main { display: flex; align-items: center; gap: 6px; color: var(--fg-muted); }
.tile-sub-value { font-size: 15px; font-weight: 700; color: var(--fg); }

/* ── Verdict card: one judgement, stated large, with what backs it ── */
.verdict { box-sizing: border-box; display: flex; flex-direction: column; gap: 9px; min-width: 0; padding: 16px; overflow: hidden; background: var(--surface); color: var(--fg); border: 1px solid var(--border); border-radius: var(--radius); }
.verdict-title { margin: 0; font-size: 14px; font-weight: 600; line-height: 1.3; letter-spacing: 0; }
.verdict-chip { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; height: 20px; padding-inline: 6px; border-radius: 20px; background: color-mix(in srgb, var(--tone) 14%, transparent); font-size: 11px; font-weight: 600; }
.verdict-hero { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0 6px; margin: 0; }
.verdict-figure { font-size: 44px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
.verdict-unit { align-self: flex-start; font-size: 18px; font-weight: 600; }
.verdict-status { font-size: 18px; font-weight: 600; color: color-mix(in srgb, var(--tone) 75%, var(--fg)); }
.verdict-caption, .verdict-footnote { margin: 0; font-size: 12px; color: var(--fg-muted); }
.verdict-progress { display: flex; flex-direction: column; gap: 3px; }
.verdict-progress .cell-bar-track { flex: none; }
.verdict-progress-head { display: flex; justify-content: space-between; font-size: 12px; color: var(--fg-muted); }
.verdict-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin: auto 0 0; padding-top: 16px; border-top: 1px solid var(--border); }
.verdict-stats dt { font-size: 11px; color: var(--fg-muted); }
.verdict-stats dd { margin: 0; font-size: 18px; font-weight: 700; }
.verdict-stats dd.is-toned { color: color-mix(in srgb, var(--tone) 75%, var(--fg)); }

/* ── Launcher card: a way into another report ── */
.launcher { box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; min-width: 0; padding: 16px; background: var(--surface); color: var(--fg); border: 1px solid var(--border); border-top: 3px solid var(--tone); border-radius: var(--radius); }
.launcher-head { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.launcher-title { margin: 0; min-width: 0; font-size: 14px; font-weight: 600; line-height: 1.3; letter-spacing: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* Where the canvas draws a thumbnail of the report: a neutral block. */
.launcher-thumb { aspect-ratio: 220 / 130; border-radius: var(--radius); background: color-mix(in srgb, var(--fg) 4%, transparent); }
.launcher-desc { flex: 1 1 auto; margin: 0; font-size: 12px; line-height: 1.45; color: var(--fg-muted); }
.launcher-open { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; color: var(--accent); }
.launcher-open:hover { text-decoration: underline; }
.launcher-open:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* ── Hero: a page's opening line and a search field ── */
.hero { box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center; color: var(--fg); }
.hero-title { margin: 0; font-size: 28px; font-weight: 700; line-height: 1.2; }
.hero-subtitle { margin: 0; color: var(--fg-muted); }
.hero-search { box-sizing: border-box; display: flex; align-items: center; gap: 6px; width: min(100%, 540px); height: 44px; margin-top: 6px; padding-left: 16px; padding-right: 3px; background: var(--surface); color: var(--fg-muted); border: 1px solid var(--border); border-radius: var(--radius); }
.hero-search:focus-within { outline: 2px solid var(--accent); outline-offset: 1px; }
.hero-input { flex: 1 1 auto; min-width: 0; border: 0; outline: 0; background: none; font: inherit; color: var(--fg); }
.hero-button { display: inline-flex; align-items: center; height: 35px; padding-inline: 16px; border: 0; border-radius: var(--radius); background: var(--accent); color: var(--accent-fg); font-family: inherit; font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; cursor: pointer; }
.hero-button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
`;

/** The complete stylesheet for a runnable export. `rich` adds the rules for
 *  rich grid cells, the record panel and the gauge reading; `blocks` adds the
 *  report card blocks, dot / tag cells and heading rows (and brings the rich
 *  rules, which they build on). */
export function buildStylesCss(system: SystemId, mode: ExportMode, opts: { rich?: boolean; blocks?: boolean } = {}): string {
  return `${buildTokenBlock(system, mode)}
${PRIMITIVES_CSS}
${REPORT_CSS}${reportExtrasCss(opts)}`;
}

/** The optional report rules a canvas needs, in order. */
export function reportExtrasCss(opts: { rich?: boolean; blocks?: boolean }): string {
  return `${opts.rich || opts.blocks ? REPORT_RICH_CSS : ""}${opts.blocks ? REPORT_BLOCKS_CSS : ""}`;
}
