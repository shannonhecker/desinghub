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
 */

import { getTheme } from "@/data/registry";
import { getCarbonOfficialTokens } from "@/lib/officialTokens";
import { buildM3TokenCSS } from "@/lib/officialM3FluentTokens";
import { webLightTheme, webDarkTheme } from "@fluentui/react-theme";
import type { SystemId } from "@/lib/componentApiRegistry";

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

/** The complete stylesheet for a runnable export. */
export function buildStylesCss(system: SystemId, mode: ExportMode): string {
  return `${buildTokenBlock(system, mode)}
${PRIMITIVES_CSS}`;
}
