import { useState } from "react";

/* ── EXPORTED FOR DESIGN HUB ── */
export { THEMES as AUSOS_THEMES, buildCSS as ausosBuildCSS, COMPS as AUSOS_COMPS, CATS as AUSOS_CATS, AIcon, FONT as AUSOS_FONT };
export function setAusosT(theme) { T = theme; }
export function getAusosT() { return T; }
export function getAusosPreviews() { return PREVIEWS; }
export function getAusosDemoComponent(id) {
  const comp = COMPS.find(c => c.id === id);
  return comp ? comp.render : null;
}
export function getAusosDensityCSS(density) {
  const densityMap = {
    high:   { h: 24, pad: 8,  fs: 11, iconS: 14, sideW: 200, sidePad: 10, mainPad: 20, cardMin: 160, gap: 8,  bodyFs: 11, labelFs: 11, headFs: 20, subFs: 10, gridGap: 8,  cardPad: 12, sideItemPad: "6px 10px", sideFs: 10, topBarH: 28, cardRadius: 18 },
    medium: { h: 32, pad: 14, fs: 13, iconS: 18, sideW: 260, sidePad: 14, mainPad: 28, cardMin: 200, gap: 12, bodyFs: 13, labelFs: 13, headFs: 24, subFs: 11, gridGap: 14, cardPad: 20, sideItemPad: "8px 14px", sideFs: 12, topBarH: 40, cardRadius: 24 },
    low:    { h: 40, pad: 18, fs: 14, iconS: 20, sideW: 280, sidePad: 16, mainPad: 36, cardMin: 220, gap: 14, bodyFs: 14, labelFs: 14, headFs: 28, subFs: 12, gridGap: 16, cardPad: 24, sideItemPad: "10px 16px", sideFs: 13, topBarH: 48, cardRadius: 28 },
    touch:  { h: 48, pad: 22, fs: 15, iconS: 22, sideW: 300, sidePad: 18, mainPad: 44, cardMin: 240, gap: 16, bodyFs: 15, labelFs: 15, headFs: 32, subFs: 14, gridGap: 18, cardPad: 28, sideItemPad: "12px 18px", sideFs: 14, topBarH: 56, cardRadius: 32 },
  };
  const sz = densityMap[density] || densityMap.medium;
  return `
    .a-btn{height:${sz.h}px;padding:0 ${sz.pad+4}px;font-size:${sz.fs}px;min-width:${sz.h*2.5}px;border-radius:9999px;}
    .a-input{height:${sz.h}px;font-size:${sz.fs}px;padding:0 ${sz.pad+2}px;border-radius:9999px;}
    .a-input-label{font-size:${sz.labelFs}px;}
    .a-checkbox{font-size:${sz.fs}px;gap:${sz.gap}px;}
    .a-cb-box{width:${sz.iconS-2}px;height:${sz.iconS-2}px;border-radius:5px;}
    .a-radio{font-size:${sz.fs}px;gap:${sz.gap}px;}
    .a-radio-circle{width:${sz.iconS-2}px;height:${sz.iconS-2}px;border-radius:${(sz.iconS-2)/2}px;}
    .a-tab{padding:${Math.max(6,sz.pad-2)}px ${sz.pad+2}px;font-size:${sz.fs}px;}
    .a-badge{height:${sz.h-8}px;min-width:${sz.h-8}px;font-size:${sz.fs-2}px;border-radius:9999px;}
    .a-card{border-radius:${sz.cardRadius}px;padding:${sz.cardPad}px;}
    .a-avatar{width:${sz.h}px;height:${sz.h}px;font-size:${sz.fs}px;}
    .a-switch{width:${sz.h+12}px;height:${Math.round(sz.h/1.5)}px;border-radius:${sz.h}px;}
    .a-switch .a-sw-thumb{width:${Math.round(sz.h/1.8)}px;height:${Math.round(sz.h/1.8)}px;border-radius:${sz.h}px;}
    .a-switch.on .a-sw-thumb{left:${sz.h-3}px;}
    .a-sidebar-item{padding:${sz.sideItemPad};font-size:${sz.sideFs}px;border-radius:9999px;}
  `;
}

/* ── AUSOS THEME PALETTES ──
   Following dark mode best practices:
   - Base bg near-black (#0b1120), surfaces step up 5-8% luminance each
   - Primary text off-white (#E8EAED) not pure white — reduces eye strain
   - Secondary text at 70% opacity, tertiary at 50%
   - Accent boosted 10-20% saturation for dark mode
   - All text meets WCAG AA 4.5:1 minimum contrast
   Ref: https://muz.li/blog/dark-mode-design-systems
   Ref: https://uxpilot.ai/blogs/glassmorphism-ui
   ──────────────────────────────────────────── */
const THEMES = {
  dark: {
    name: "Dark",
    // Backgrounds — aurora gradient base
    bg: "#0b1120", bg2: "#0e1428", bg3: "#121830", bg4: "#171d3a",
    gradient: "linear-gradient(135deg, #0b1120 0%, #0d1f2d 30%, #1a1035 65%, #120b20 100%)",
    gradientSubtle: "linear-gradient(135deg, rgba(11,17,32,0.95) 0%, rgba(13,31,45,0.9) 30%, rgba(26,16,53,0.9) 65%, rgba(18,11,32,0.95) 100%)",
    // Surfaces — glass with visible presence (higher opacity than before)
    surface: "rgba(255,255,255,0.06)", surfaceHover: "rgba(255,255,255,0.10)", surfaceActive: "rgba(255,255,255,0.14)",
    surfaceMd: "rgba(255,255,255,0.08)", surfaceLg: "rgba(255,255,255,0.10)",
    cardBg: "rgba(255,255,255,0.06)", cardBgHover: "rgba(255,255,255,0.10)",
    // Text — solid colors for reliable contrast (4.5:1+)
    fg: "#E8EAED", fg2: "#9CA3AF", fg3: "#6B7280", fgDisabled: "#4B5563",
    // Accent — violet (4.5:1+ on dark bg, 3:1+ with white text)
    accent: "#9575F0", accentHover: "#A48AF5", accentActive: "#8B5CF6",
    accentGradient: "linear-gradient(135deg, #9575F0 0%, #8B5CF6 50%, #7C3AED 100%)",
    accentSurface: "rgba(149,117,240,0.10)", accentSurfaceHover: "rgba(149,117,240,0.16)",
    accentFg: "#ffffff",
    // Borders — white opacity for glass aesthetic (visible enough to define cards)
    border: "rgba(255,255,255,0.08)", borderMd: "rgba(255,255,255,0.12)", borderStrong: "rgba(255,255,255,0.20)",
    borderAccent: "rgba(167,139,250,0.25)",
    // Elevation
    shadow: "0 4px 16px rgba(0,0,0,0.3)", shadowLg: "0 8px 32px rgba(0,0,0,0.4)",
    glass: "blur(16px) saturate(140%)", glassLg: "blur(24px) saturate(150%)",
    insetHighlight: "inset 0 1px 0 rgba(255,255,255,0.05)",
    // Status
    dangerBg: "rgba(248,113,113,0.1)", dangerFg: "#F87171", dangerBorder: "rgba(248,113,113,0.2)",
    successBg: "rgba(74,222,128,0.1)", successFg: "#4ADE80", successBorder: "rgba(74,222,128,0.2)",
    warningBg: "rgba(251,191,36,0.1)", warningFg: "#FBBF24", warningBorder: "rgba(251,191,36,0.2)",
    infoBg: "rgba(167,139,250,0.08)", infoFg: "#A78BFA", infoBorder: "rgba(167,139,250,0.2)",
    // Chart / dataviz palette (pastel-vibrant, fun & modern)
    chart: ["#9575F0", "#f46a9b", "#27aeef", "#87bc45", "#edbf33", "#ef9b20", "#b33dc6", "#ea5545", "#76b7b2", "#bdcf32"],
    chartGrid: "rgba(255,255,255,0.06)", chartText: "#6B7280",
    chartGradient1: "rgba(149,117,240,0.35)", chartGradient2: "rgba(244,106,155,0.15)",
  },
  light: {
    name: "Light",
    // Backgrounds — white base with lavender depth layers
    bg: "#FFFFFF", bg2: "#FAF8FE", bg3: "#F3EEFA", bg4: "#EDE6F5",
    gradient: "linear-gradient(135deg, #E8E0F8 0%, #DDE8F8 25%, #F0E2F0 50%, #E0E4F8 75%, #E8E0F5 100%)",
    gradientSubtle: "linear-gradient(135deg, #EDE6F5 0%, #E8EEF8 50%, #F0E8F5 100%)",
    // Surfaces — white glass on lavender
    surface: "rgba(255,255,255,0.72)", surfaceHover: "rgba(255,255,255,0.85)", surfaceActive: "rgba(255,255,255,0.95)",
    surfaceMd: "rgba(255,255,255,0.80)", surfaceLg: "rgba(255,255,255,0.88)",
    cardBg: "rgba(255,255,255,0.68)", cardBgHover: "rgba(255,255,255,0.82)",
    // Text — purple-tinted dark
    fg: "#2D1B4E", fg2: "#5C4A78", fg3: "#9688AD", fgDisabled: "#C4B8D6",
    // Accent — soft violet
    accent: "#8B5CF6", accentHover: "#7C3AED", accentActive: "#6D28D9",
    accentGradient: "linear-gradient(135deg, #B49AFF 0%, #A78BFA 50%, #8B5CF6 100%)",
    accentSurface: "rgba(139,92,246,0.06)", accentSurfaceHover: "rgba(139,92,246,0.10)",
    accentFg: "#FFFFFF",
    // Borders — very subtle lavender
    border: "rgba(100,60,180,0.06)", borderMd: "rgba(100,60,180,0.10)", borderStrong: "rgba(100,60,180,0.16)",
    borderAccent: "rgba(139,92,246,0.2)",
    // Elevation — purple-tinted shadows
    shadow: "0 4px 20px rgba(100,60,180,0.06)", shadowLg: "0 8px 32px rgba(100,60,180,0.10)",
    glass: "blur(20px) saturate(130%)", glassLg: "blur(28px) saturate(140%)",
    insetHighlight: "none",
    // Status
    dangerBg: "rgba(239,68,68,0.06)", dangerFg: "#DC2626", dangerBorder: "rgba(239,68,68,0.10)",
    successBg: "rgba(16,185,129,0.06)", successFg: "#047857", successBorder: "rgba(16,185,129,0.10)",
    warningBg: "rgba(234,179,8,0.06)", warningFg: "#D97706", warningBorder: "rgba(234,179,8,0.10)",
    infoBg: "rgba(139,92,246,0.04)", infoFg: "#7C3AED", infoBorder: "rgba(139,92,246,0.10)",
    // Chart / dataviz palette (deeper versions for light bg)
    chart: ["#7C3AED", "#e03a7a", "#1a8fd1", "#5da030", "#c9a020", "#d07a10", "#9228a8", "#d03030", "#5a9a96", "#9ab025"],
    chartGrid: "rgba(0,0,0,0.06)", chartText: "#5C4A78",
  },
};

let T = THEMES.dark;

/* ── FONT ── */
const FONT = "'Inter', 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

/* ── ICON COMPONENT ── */
function AIcon({ name, size = 18, color }) {
  return <span className="material-symbols-outlined" style={{ fontSize: size, color: color || T.fg2, lineHeight: 1 }} aria-hidden="true">{name}</span>;
}

/* ── GLOBAL STYLES ── */
const buildCSS = (T) => `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --a-dur-fast: 150ms;
  --a-dur-mid: 250ms;
  --a-dur-slow: 350ms;
  --a-ease: cubic-bezier(0.22, 0.68, 0, 1);
  --a-ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --a-gradient: ${T.gradient};
  --a-gradient-subtle: ${T.gradientSubtle};
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}

/* === BUTTONS (Glass system — no solid fills, depth via opacity) === */
.a-btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; height:32px; min-width:72px; border-radius:9999px; padding:0 16px; font-family:${FONT}; font-size:13px; font-weight:500; cursor:pointer; border:1px solid ${T.border}; outline:none; position:relative; overflow:hidden; backdrop-filter:${T.glass}; -webkit-backdrop-filter:${T.glass}; transition:all var(--a-dur-fast) var(--a-ease); box-shadow:${T.insetHighlight}; }
.a-btn:focus-visible { outline:2px solid ${T.fg3}; outline-offset:2px; }
.a-btn:disabled { opacity:0.35; cursor:default; pointer-events:none; }

.a-btn-primary { background:${T.accentGradient}; color:${T.accentFg}; border-color:transparent; font-weight:600; }
.a-btn-primary:hover { background:${T.accentHover}; color:${T.accentFg}; border-color:transparent; filter:brightness(1.1); }
.a-btn-primary:active { background:${T.accentActive}; filter:none; }

.a-btn-secondary { background:${T.surface}; color:${T.fg2}; border-color:${T.border}; }
.a-btn-secondary:hover { background:${T.surfaceHover}; color:${T.fg}; border-color:${T.borderMd}; }
.a-btn-secondary:active { background:${T.surfaceActive}; }

.a-btn-ghost { background:transparent; color:${T.fg3}; border-color:transparent; }
.a-btn-ghost:hover { background:${T.surface}; color:${T.fg2}; border-color:${T.border}; }
.a-btn-ghost:active { background:${T.surfaceHover}; }

.a-btn-outline { background:transparent; color:${T.fg2}; border-color:${T.borderMd}; }
.a-btn-outline:hover { background:${T.surface}; color:${T.fg}; border-color:${T.borderStrong}; }
.a-btn-outline:active { background:${T.surfaceHover}; }

/* === INPUT === */
.a-input-wrap { display:flex; flex-direction:column; gap:6px; }
.a-input-label { font-size:12px; font-weight:500; color:${T.fg3}; font-family:${FONT}; text-transform:uppercase; letter-spacing:0.04em; }
.a-input { height:36px; border:1px solid ${T.border}; border-radius:9999px; padding:0 14px; font-size:13px; font-family:${FONT}; color:${T.fg}; background:${T.surface}; backdrop-filter:${T.glass}; -webkit-backdrop-filter:${T.glass}; outline:none; transition:border-color var(--a-dur-fast) var(--a-ease), box-shadow var(--a-dur-fast) var(--a-ease); box-shadow:${T.insetHighlight}; }
.a-input:hover { border-color:${T.borderMd}; }
.a-input:focus { border-color:${T.borderStrong}; box-shadow:0 0 0 1px ${T.borderStrong}; }
.a-input::placeholder { color:${T.fg3}; }
.a-input:disabled { opacity:0.35; cursor:default; }

/* === CHECKBOX === */
.a-checkbox { display:inline-flex; align-items:center; gap:8px; cursor:pointer; font-family:${FONT}; font-size:13px; color:${T.fg}; outline:none; }
.a-checkbox:focus-visible .a-cb-box { outline:2px solid ${T.fg3}; outline-offset:2px; }
.a-cb-box { width:18px; height:18px; border:1px solid ${T.borderStrong}; border-radius:5px; display:flex; align-items:center; justify-content:center; transition:all var(--a-dur-fast) var(--a-ease); flex-shrink:0; background:${T.surface}; }
.a-checkbox:hover .a-cb-box { border-color:${T.accent}; }
.a-checkbox.checked .a-cb-box { background:${T.accent}; border-color:${T.accent}; }

/* === RADIO === */
.a-radio { display:flex; align-items:center; gap:8px; cursor:pointer; font-family:${FONT}; font-size:13px; color:${T.fg}; padding:3px 0; outline:none; }
.a-radio-circle { width:18px; height:18px; border-radius:9px; border:1px solid ${T.borderStrong}; display:flex; align-items:center; justify-content:center; transition:all var(--a-dur-fast) var(--a-ease); flex-shrink:0; background:${T.surface}; }
.a-radio:hover .a-radio-circle { border-color:${T.accent}; }
.a-radio.selected .a-radio-circle { border-color:${T.accent}; border-width:2px; }

/* === SWITCH === */
.a-switch { width:40px; height:22px; border-radius:11px; background:${T.surface}; border:1px solid ${T.borderStrong}; cursor:pointer; position:relative; outline:none; transition:all var(--a-dur-mid) var(--a-ease); padding:0; backdrop-filter:${T.glass}; }
.a-switch:focus-visible { outline:2px solid ${T.fg3}; outline-offset:2px; }
.a-switch .a-sw-thumb { position:absolute; width:16px; height:16px; border-radius:8px; background:${T.fg3}; top:2px; left:2px; transition:all var(--a-dur-mid) var(--a-ease); }
.a-switch.on { background:${T.accent}; border-color:${T.accent}; }
.a-switch.on .a-sw-thumb { left:20px; background:#ffffff; }

/* === TABS === */
.a-tabs { display:flex; border-bottom:1px solid ${T.border}; gap:0; }
.a-tab { padding:8px 14px; font-family:${FONT}; font-size:13px; font-weight:500; color:${T.fg3}; cursor:pointer; background:transparent; border:none; border-bottom:2px solid transparent; transition:all var(--a-dur-fast) var(--a-ease); outline:none; }
.a-tab:hover { color:${T.fg}; background:${T.surface}; }
.a-tab.active { color:${T.fg}; border-bottom-color:${T.accent}; font-weight:600; }
.a-tab:focus-visible { outline:2px solid ${T.accent}; outline-offset:-2px; }

/* === CARD === */
.a-card { border-radius:24px; background:${T.cardBg}; border:1px solid ${T.borderMd}; backdrop-filter:${T.glass}; -webkit-backdrop-filter:${T.glass}; cursor:pointer; outline:none; transition:background var(--a-dur-fast) var(--a-ease), border-color var(--a-dur-fast) var(--a-ease), box-shadow var(--a-dur-mid) var(--a-ease); overflow:hidden; box-shadow:${T.insetHighlight}, 0 2px 12px rgba(0,0,0,0.12); }
.a-card:hover { background:${T.cardBgHover}; border-color:${T.borderStrong}; box-shadow:${T.shadow}, ${T.insetHighlight}; }
.a-card:focus-visible { outline:2px solid ${T.accent}; outline-offset:2px; }

/* === BADGE === */
.a-badge { display:inline-flex; align-items:center; justify-content:center; min-width:20px; height:22px; border-radius:10000px; padding:0 10px; font-size:11px; font-weight:500; font-family:${FONT}; backdrop-filter:${T.glass}; border:1px solid transparent; }
.a-badge-accent { background:${T.accentSurface}; color:${T.fg2}; border-color:${T.borderMd}; }
.a-badge-default { background:${T.surface}; color:${T.fg3}; border-color:${T.border}; }
.a-badge-danger { background:${T.dangerBg}; color:${T.dangerFg}; border-color:${T.dangerBorder}; }
.a-badge-success { background:${T.successBg}; color:${T.successFg}; border-color:${T.successBorder}; }
.a-badge-warning { background:${T.warningBg}; color:${T.warningFg}; border-color:${T.warningBorder}; }

/* === AVATAR === */
.a-avatar { display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:50%; font-family:${FONT}; font-weight:600; font-size:12px; color:${T.fg2}; background:${T.surface}; border:1px solid ${T.borderMd}; }

/* === ALERT === */
.a-alert { display:flex; align-items:flex-start; gap:10px; padding:12px 18px; border-radius:9999px; font-family:${FONT}; font-size:12px; backdrop-filter:${T.glass}; -webkit-backdrop-filter:${T.glass}; border:1px solid; box-shadow:${T.insetHighlight}; }
.a-alert-info { background:${T.infoBg}; color:${T.infoFg}; border-color:${T.infoBorder}; }
.a-alert-success { background:${T.successBg}; color:${T.successFg}; border-color:${T.successBorder}; }
.a-alert-warning { background:${T.warningBg}; color:${T.warningFg}; border-color:${T.warningBorder}; }
.a-alert-danger { background:${T.dangerBg}; color:${T.dangerFg}; border-color:${T.dangerBorder}; }

/* === PROGRESS === */
.a-progress-track { height:4px; border-radius:2px; background:${T.surface}; overflow:hidden; }
.a-progress-fill { height:100%; border-radius:2px; background:${T.accent}; transition:width var(--a-dur-mid) var(--a-ease); }

/* === TOOLTIP === */
.a-tooltip { position:absolute; background:${T.surfaceLg}; backdrop-filter:${T.glassLg}; -webkit-backdrop-filter:${T.glassLg}; border:1px solid ${T.borderMd}; border-radius:8px; padding:6px 10px; font-family:${FONT}; font-size:11px; color:${T.fg}; box-shadow:${T.shadowLg}; white-space:nowrap; }

/* === DIALOG === */
.a-dialog-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; }
.a-dialog { background:${T.bg2}; backdrop-filter:${T.glassLg}; border:1px solid ${T.borderMd}; border-radius:28px; padding:24px; min-width:320px; box-shadow:${T.shadowLg}; font-family:${FONT}; }

/* === DATA TABLE === */
.a-table { width:100%; border-collapse:separate; border-spacing:0; font-family:${FONT}; font-size:12px; }
.a-table th { padding:8px 10px; text-align:left; font-weight:600; font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:${T.fg3}; border-bottom:1px solid ${T.borderMd}; background:transparent; }
.a-table td { padding:8px 10px; border-bottom:1px solid ${T.border}; color:${T.fg}; }
.a-table tr:hover td { background:${T.surface}; }

/* === ACCORDION === */
.a-accordion { border:1px solid ${T.border}; border-radius:20px; overflow:hidden; backdrop-filter:${T.glass}; }
.a-accordion-header { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; cursor:pointer; font-family:${FONT}; font-size:13px; font-weight:600; color:${T.fg}; background:${T.surface}; border:none; width:100%; outline:none; transition:background var(--a-dur-fast) var(--a-ease); }
.a-accordion-header:hover { background:${T.surfaceHover}; }
.a-accordion-body { padding:10px 14px; font-size:12px; color:${T.fg2}; border-top:1px solid ${T.border}; }

/* === DROPDOWN === */
.a-dropdown { position:relative; display:inline-block; }
.a-dropdown-trigger { display:flex; align-items:center; justify-content:space-between; gap:8px; height:32px; padding:0 14px; border:1px solid ${T.border}; border-radius:9999px; background:${T.surface}; backdrop-filter:${T.glass}; color:${T.fg}; font-family:${FONT}; font-size:13px; cursor:pointer; transition:border-color var(--a-dur-fast); }
.a-dropdown-trigger:hover { border-color:${T.borderMd}; }
.a-dropdown-menu { position:absolute; top:calc(100% + 4px); left:0; right:0; background:${T.bg2}; backdrop-filter:${T.glassLg}; border:1px solid ${T.borderMd}; border-radius:18px; box-shadow:${T.shadowLg}; overflow:hidden; z-index:10; }
.a-dropdown-item { padding:7px 10px; font-size:12px; color:${T.fg}; cursor:pointer; transition:background var(--a-dur-fast); }
.a-dropdown-item:hover { background:${T.surface}; }

/* === SIDEBAR ITEM === */
.a-sidebar-item { display:flex; align-items:center; gap:10px; padding:8px 12px; font-family:${FONT}; font-size:12px; font-weight:500; color:${T.fg2}; border-radius:6px; cursor:pointer; transition:all var(--a-dur-fast) var(--a-ease); border:none; background:transparent; width:100%; text-align:left; outline:none; }
.a-sidebar-item:hover { background:${T.surface}; color:${T.fg}; }
.a-sidebar-item.active { background:${T.accentSurface}; color:${T.accent}; }
`;

const CATS = ["Foundations", "Components & Patterns", "Patterns"];

/* ════════════════════════════════════════════════════════════
   DEMO COMPONENTS
   ════════════════════════════════════════════════════════════ */

function DLColor() {
  const swatches = [
    { label: "Background", value: T.bg },
    { label: "Surface", value: T.surface, onBg: true },
    { label: "Foreground", value: T.fg },
    { label: "Accent", value: T.accent },
    { label: "Border", value: T.borderStrong },
    { label: "FG Secondary", value: T.fg2 },
    { label: "Success", value: T.successFg },
    { label: "Warning", value: T.warningFg },
    { label: "Danger", value: T.dangerFg },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: FONT }}>
      {/* Aurora gradient swatch — the signature foundation */}
      <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${T.borderMd}` }}>
        <div style={{ height: 48, background: T.gradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Aurora Gradient</span>
        </div>
      </div>
      {/* Color swatches */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
        {swatches.map(s => (
          <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: s.onBg ? T.bg : "transparent",
            }}>
              <div style={{
                width: "100%", height: "100%", borderRadius: 10,
                background: s.value,
                border: `1px solid ${T.borderMd}`,
              }} />
            </div>
            <span style={{ fontSize: 9, color: T.fg2, fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DLIcons() {
  const icons = ["search", "settings", "home", "favorite", "person", "mail", "star", "edit", "delete", "add", "close", "check"];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontFamily: FONT }}>
      {icons.map(i => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, width: 48 }}>
          <AIcon name={i} size={20} color={T.fg2} />
          <span style={{ fontSize: 8, color: T.fg3 }}>{i}</span>
        </div>
      ))}
    </div>
  );
}

function DLTypography() {
  const styles = [
    { label: "Display", size: 28, weight: 700 },
    { label: "H1", size: 22, weight: 700 },
    { label: "H2", size: 18, weight: 600 },
    { label: "H3", size: 15, weight: 600 },
    { label: "Body", size: 13, weight: 400 },
    { label: "Caption", size: 11, weight: 400 },
    { label: "Overline", size: 10, weight: 600, transform: "uppercase", spacing: "0.08em" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: FONT }}>
      {styles.map(s => (
        <div key={s.label} style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: 9, color: T.fg3, width: 50, flexShrink: 0 }}>{s.label}</span>
          <span style={{ fontSize: s.size, fontWeight: s.weight, color: T.fg, textTransform: s.transform, letterSpacing: s.spacing }}>
            The quick brown fox
          </span>
        </div>
      ))}
    </div>
  );
}

function DLElevation() {
  const levels = [
    { label: "Level 0", blur: "0px", bg: T.surface, border: T.border },
    { label: "Level 1", blur: "8px", bg: T.surfaceMd, border: T.borderMd },
    { label: "Level 2", blur: "16px", bg: T.surfaceLg, border: T.borderMd },
    { label: "Level 3", blur: "24px", bg: T.surfaceLg, border: T.borderStrong },
  ];
  return (
    <div style={{ background: T.gradient, borderRadius: 12, padding: 16, fontFamily: FONT }}>
      <div style={{ display: "flex", gap: 10 }}>
        {levels.map(l => (
          <div key={l.label} style={{ width: 80, height: 56, borderRadius: 12, background: l.bg, border: `1px solid ${l.border}`, backdropFilter: `blur(${l.blur}) saturate(140%)`, WebkitBackdropFilter: `blur(${l.blur}) saturate(140%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 9, color: T.fg3 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DLSpacing() {
  const steps = [4, 8, 12, 16, 24, 32];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: FONT }}>
      {steps.map(s => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, color: T.fg3, width: 30, textAlign: "right" }}>{s}px</span>
          <div style={{ width: s * 4, height: 8, borderRadius: 4, background: T.accentSurface, border: `1px solid ${T.borderAccent}` }} />
        </div>
      ))}
    </div>
  );
}

function DLTokens() { return null; }
function DLAccessibility() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: FONT, fontSize: 12, color: T.fg2 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><AIcon name="check_circle" size={16} color={T.successFg} /> WCAG 2.1 AA — 4.5:1 text contrast</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><AIcon name="check_circle" size={16} color={T.successFg} /> Focus rings — 2px accent outline</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><AIcon name="check_circle" size={16} color={T.successFg} /> Touch targets — 44px minimum</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><AIcon name="check_circle" size={16} color={T.successFg} /> Reduced motion — respects prefers-reduced-motion</div>
    </div>
  );
}

function DLDensity() {
  const levels = [
    { name: "High", h: 20, desc: "Compact — dense data views" },
    { name: "Medium", h: 28, desc: "Default — balanced readability" },
    { name: "Low", h: 36, desc: "Relaxed — comfortable spacing" },
    { name: "Touch", h: 44, desc: "Mobile — 44px touch targets" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: FONT }}>
      {levels.map(l => (
        <div key={l.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: l.h, height: l.h, borderRadius: 6, background: T.accentSurface, border: `1px solid ${T.borderAccent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: T.accent }}>{l.h}</span>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.fg }}>{l.name}</div>
            <div style={{ fontSize: 10, color: T.fg3 }}>{l.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DLContent() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: FONT, fontSize: 12, color: T.fg2 }}>
      <div><strong style={{ color: T.fg }}>Voice:</strong> Concise, premium, confident</div>
      <div><strong style={{ color: T.fg }}>Tense:</strong> Present tense, active verbs</div>
      <div><strong style={{ color: T.fg }}>Case:</strong> Sentence case for all UI text</div>
      <div><strong style={{ color: T.fg }}>Tone:</strong> Professional but approachable</div>
    </div>
  );
}

/* ── Component Demos ── */

function Buttons() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: FONT }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="a-btn a-btn-primary">Primary</button>
        <button className="a-btn a-btn-secondary">Secondary</button>
        <button className="a-btn a-btn-outline">Outline</button>
        <button className="a-btn a-btn-ghost">Ghost</button>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="a-btn a-btn-primary" disabled>Disabled</button>
        <button className="a-btn a-btn-secondary" disabled>Disabled</button>
      </div>
    </div>
  );
}

function Inputs() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, fontFamily: FONT, maxWidth: 280 }}>
      <div className="a-input-wrap">
        <label className="a-input-label">Full Name</label>
        <input className="a-input" placeholder="Enter your name" readOnly />
      </div>
      <div className="a-input-wrap">
        <label className="a-input-label">Email</label>
        <input className="a-input" placeholder="you@example.com" readOnly />
      </div>
    </div>
  );
}

function Checkboxes() {
  const [checks, setChecks] = useState([true, false, true]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: FONT }}>
      {["Option A", "Option B", "Option C"].map((label, i) => (
        <div key={label} className={`a-checkbox${checks[i] ? " checked" : ""}`} onClick={() => { const n = [...checks]; n[i] = !n[i]; setChecks(n); }} tabIndex={0} role="checkbox" aria-checked={checks[i]}>
          <div className="a-cb-box">{checks[i] && <AIcon name="check" size={12} color={T.accentFg} />}</div>
          {label}
        </div>
      ))}
    </div>
  );
}

function Radios() {
  const [sel, setSel] = useState(0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, fontFamily: FONT }}>
      {["Small", "Medium", "Large"].map((label, i) => (
        <div key={label} className={`a-radio${sel === i ? " selected" : ""}`} onClick={() => setSel(i)} tabIndex={0} role="radio" aria-checked={sel === i}>
          <div className="a-radio-circle">{sel === i && <div style={{ width: 8, height: 8, borderRadius: 4, background: T.accent }} />}</div>
          {label}
        </div>
      ))}
    </div>
  );
}

function Switches() {
  const [on1, setOn1] = useState(true);
  const [on2, setOn2] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button className={`a-switch${on1 ? " on" : ""}`} onClick={() => setOn1(!on1)} role="switch" aria-checked={on1}><div className="a-sw-thumb" /></button>
        <span style={{ fontSize: 13, color: T.fg }}>Dark mode</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button className={`a-switch${on2 ? " on" : ""}`} onClick={() => setOn2(!on2)} role="switch" aria-checked={on2}><div className="a-sw-thumb" /></button>
        <span style={{ fontSize: 13, color: T.fg }}>Notifications</span>
      </div>
    </div>
  );
}

function Tabs() {
  const [active, setActive] = useState(0);
  const tabs = ["General", "Security", "Billing", "Notifications"];
  return (
    <div style={{ fontFamily: FONT }}>
      <div className="a-tabs">
        {tabs.map((t, i) => (
          <button key={t} className={`a-tab${active === i ? " active" : ""}`} onClick={() => setActive(i)}>{t}</button>
        ))}
      </div>
      <div style={{ padding: "12px 0", fontSize: 12, color: T.fg2 }}>Content for {tabs[active]} tab.</div>
    </div>
  );
}

function Cards() {
  const cards = [
    { t: "Total Revenue", v: "$42,800", change: "+12.5%", up: true, icon: "trending_up" },
    { t: "Active Users", v: "1,247", change: "+8.3%", up: true, icon: "group" },
    { t: "Conversion", v: "3.2%", change: "-0.4%", up: false, icon: "swap_horiz" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, fontFamily: FONT }}>
      {cards.map(c => (
        <div key={c.t} className="a-card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: T.fg3, fontWeight: 500 }}>{c.t}</span>
            <AIcon name={c.icon} size={16} color={T.fg3} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.fg, letterSpacing: "-0.02em" }}>{c.v}</div>
          <div style={{ fontSize: 11, color: c.up ? T.successFg : T.dangerFg, marginTop: 6, fontWeight: 500 }}>{c.change} from last month</div>
        </div>
      ))}
    </div>
  );
}

function Badges() {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontFamily: FONT }}>
      <span className="a-badge a-badge-accent">Active</span>
      <span className="a-badge a-badge-default">Default</span>
      <span className="a-badge a-badge-success">Success</span>
      <span className="a-badge a-badge-warning">Warning</span>
      <span className="a-badge a-badge-danger">Error</span>
    </div>
  );
}

function Avatars() {
  const people = [{ i: "SH", c: T.accent }, { i: "JD", c: T.warningFg }, { i: "AB", c: T.dangerFg }];
  return (
    <div style={{ display: "flex", gap: 8, fontFamily: FONT }}>
      {people.map(p => (
        <div key={p.i} className="a-avatar" style={{ color: p.c, background: `${p.c}15`, borderColor: `${p.c}40` }}>{p.i}</div>
      ))}
    </div>
  );
}

function Alerts() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: FONT }}>
      <div className="a-alert a-alert-info"><AIcon name="info" size={16} color={T.infoFg} /><span>New update available.</span></div>
      <div className="a-alert a-alert-success"><AIcon name="check_circle" size={16} color={T.successFg} /><span>Changes saved successfully.</span></div>
      <div className="a-alert a-alert-warning"><AIcon name="warning" size={16} color={T.warningFg} /><span>API rate limit approaching.</span></div>
      <div className="a-alert a-alert-danger"><AIcon name="error" size={16} color={T.dangerFg} /><span>Connection failed.</span></div>
    </div>
  );
}

function Progress() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, fontFamily: FONT }}>
      {[{ l: "Upload", p: 72 }, { l: "Processing", p: 45 }, { l: "Complete", p: 100 }].map(bar => (
        <div key={bar.l}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.fg2, marginBottom: 4 }}><span>{bar.l}</span><span>{bar.p}%</span></div>
          <div className="a-progress-track"><div className="a-progress-fill" style={{ width: `${bar.p}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

function Tooltips() {
  return (
    <div style={{ fontFamily: FONT, position: "relative", height: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <button className="a-btn a-btn-secondary">Hover me</button>
      <div className="a-tooltip" style={{ position: "absolute", top: -30, left: "50%", transform: "translateX(-50%)" }}>This is a tooltip</div>
    </div>
  );
}

function Dropdowns() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ fontFamily: FONT, position: "relative", display: "inline-block" }}>
      <button className="a-dropdown-trigger" onClick={() => setOpen(!open)}>
        <span>Select option</span>
        <AIcon name={open ? "expand_less" : "expand_more"} size={16} color={T.fg3} />
      </button>
      {open && (
        <div className="a-dropdown-menu">
          {["Option A", "Option B", "Option C"].map(o => (
            <div key={o} className="a-dropdown-item" onClick={() => setOpen(false)}>{o}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function DialogDemo() {
  return (
    <div style={{ fontFamily: FONT }}>
      <div className="a-dialog" style={{ position: "relative", maxWidth: 320 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: T.fg, marginBottom: 8 }}>Confirm action</div>
        <div style={{ fontSize: 12, color: T.fg2, marginBottom: 16 }}>Are you sure you want to proceed? This cannot be undone.</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="a-btn a-btn-ghost">Cancel</button>
          <button className="a-btn a-btn-primary">Confirm</button>
        </div>
      </div>
    </div>
  );
}

function Accordion() {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ fontFamily: FONT, maxWidth: 320 }}>
      <div className="a-accordion">
        <button className="a-accordion-header" onClick={() => setOpen(!open)}>
          <span>What is ausos DS?</span>
          <AIcon name={open ? "expand_less" : "expand_more"} size={16} color={T.fg3} />
        </button>
        {open && <div className="a-accordion-body">A glassmorphism design system with frosted surfaces, muted accents, and semantic token architecture.</div>}
      </div>
    </div>
  );
}

function Breadcrumbs() {
  const items = ["Home", "Projects", "Design Hub"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 12 }}>
      {items.map((item, i) => (
        <span key={item} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: i === items.length - 1 ? T.fg : T.fg3, fontWeight: i === items.length - 1 ? 600 : 400, cursor: "pointer" }}>{item}</span>
          {i < items.length - 1 && <AIcon name="chevron_right" size={14} color={T.fg3} />}
        </span>
      ))}
    </div>
  );
}

function DataTable() {
  const rows = [
    { name: "Dashboard", status: "Active", users: "1,247" },
    { name: "Analytics", status: "Pending", users: "892" },
    { name: "Reports", status: "Active", users: "2,104" },
  ];
  return (
    <div style={{ fontFamily: FONT, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}`, backdropFilter: T.glass }}>
      <table className="a-table">
        <thead><tr><th>Name</th><th>Status</th><th>Users</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.name}>
              <td style={{ fontWeight: 500 }}>{r.name}</td>
              <td><span className={`a-badge ${r.status === "Active" ? "a-badge-success" : "a-badge-warning"}`}>{r.status}</span></td>
              <td>{r.users}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Pattern Demos ── */

function PatDashboard() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: FONT }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[{ l: "Revenue", v: "$42.8K", c: "+12%", up: true }, { l: "Users", v: "1,247", c: "+8%", up: true }, { l: "Growth", v: "+18%", c: "+3%", up: true }].map(s => (
          <div key={s.l} className="a-card" style={{ padding: 14 }}>
            <div style={{ fontSize: 10, color: T.fg3, fontWeight: 500 }}>{s.l}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.fg, margin: "4px 0" }}>{s.v}</div>
            <div style={{ fontSize: 10, color: s.up ? T.successFg : T.dangerFg, fontWeight: 500 }}>{s.c} vs last month</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PatForm() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, fontFamily: FONT, maxWidth: 320 }}>
      <div className="a-input-wrap"><label className="a-input-label">Full Name *</label><input className="a-input" defaultValue="Jane Doe" readOnly /></div>
      <div className="a-input-wrap"><label className="a-input-label">Email *</label><input className="a-input" defaultValue="jane@company.com" readOnly /></div>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button className="a-btn a-btn-primary">Submit</button>
        <button className="a-btn a-btn-secondary">Cancel</button>
      </div>
    </div>
  );
}

function PatListDetail() {
  const [sel, setSel] = useState(0);
  const items = [{ t: "Dashboard Report", d: "Q4 revenue analysis" }, { t: "User Metrics", d: "Monthly active users" }, { t: "System Alerts", d: "Health monitoring" }];
  return (
    <div style={{ display: "flex", gap: 1, fontFamily: FONT, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}` }}>
      <div style={{ width: 160, borderRight: `1px solid ${T.border}`, background: T.surface, backdropFilter: T.glass }}>
        {items.map((item, i) => (
          <div key={item.t} className={`a-sidebar-item${sel === i ? " active" : ""}`} onClick={() => setSel(i)} style={{ borderRadius: 0 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 500 }}>{item.t}</div>
              <div style={{ fontSize: 9, color: T.fg3, marginTop: 1 }}>{item.d}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.fg }}>{items[sel].t}</div>
        <div style={{ fontSize: 11, color: T.fg2, marginTop: 4 }}>{items[sel].d}</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PREVIEWS — Small thumbnail cards for the landing grid
   ════════════════════════════════════════════════════════════ */
const PREVIEWS = {
  buttons: () => <div style={{display:"flex",gap:4}}><button className="a-btn a-btn-primary" style={{height:20,fontSize:10,minWidth:0,padding:"0 8px"}}>Primary</button><button className="a-btn a-btn-secondary" style={{height:20,fontSize:10,minWidth:0,padding:"0 8px"}}>Secondary</button></div>,
  inputs: () => <div className="a-input" style={{height:18,fontSize:9,padding:"0 6px",maxWidth:120}}>Input text</div>,
  cards: () => <div className="a-card" style={{padding:6,borderRadius:6}}><div style={{fontSize:9,fontWeight:600,color:T.fg}}>Card</div><div style={{fontSize:7,color:T.fg3}}>Content</div></div>,
  tabs: () => <div style={{display:"flex",gap:0,borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:8,color:T.accent,borderBottom:`1px solid ${T.accent}`,padding:"2px 6px"}}>Tab 1</span><span style={{fontSize:8,color:T.fg3,padding:"2px 6px"}}>Tab 2</span></div>,
  badges: () => <div style={{display:"flex",gap:3}}><span className="a-badge a-badge-accent" style={{height:14,fontSize:8,padding:"0 5px"}}>Active</span><span className="a-badge a-badge-success" style={{height:14,fontSize:8,padding:"0 5px"}}>Done</span></div>,
};

/* ════════════════════════════════════════════════════════════
   COMPS ARRAY — The master component list with render functions
   ════════════════════════════════════════════════════════════ */
const COMPS = [
  // Foundations
  { id: "dl-color", name: "Color", cat: "Foundations", desc: "Dark aurora palette with glassmorphism surfaces. Muted teal accent, white-opacity layers.", render: DLColor },
  { id: "dl-icons", name: "Iconography", cat: "Foundations", desc: "Material Symbols Outlined icons with muted white tones. Density-responsive sizing.", render: DLIcons },
  { id: "dl-typography", name: "Typography", cat: "Foundations", desc: "DM Sans type scale. 7 styles from Caption to Display. White-opacity hierarchy.", render: DLTypography },
  { id: "dl-elevation", name: "Elevation", cat: "Foundations", desc: "4 glass elevation levels using backdrop-filter blur + white-opacity borders.", render: DLElevation },
  { id: "dl-spacing", name: "Spacing", cat: "Foundations", desc: "4px base grid. Proportional scale. Adjusts with density.", render: DLSpacing },
  { id: "dl-tokens", name: "Token Architecture", cat: "Foundations", desc: "Semantic CSS variables: --a-bg, --a-surface, --a-fg, --a-accent, --a-border.", render: DLTokens },
  { id: "dl-a11y", name: "Accessibility", cat: "Foundations", desc: "WCAG 2.1 AA. 4.5:1 contrast on glass, focus rings, 44px touch targets.", render: DLAccessibility },
  { id: "dl-density", name: "Density", cat: "Foundations", desc: "4 levels: High (20px), Medium (28px), Low (36px), Touch (44px).", render: DLDensity },
  { id: "dl-content", name: "Content Design", cat: "Foundations", desc: "Concise, premium voice. Sentence case. Present tense.", render: DLContent },
  { id: "tokens", name: "Tokens", cat: "Foundations", desc: "Token reference for all design tokens with contrast ratios.", render: () => null },
  { id: "audit", name: "Design Audit", cat: "Foundations", desc: "Paste code to audit for raw hex values and accessibility issues.", render: () => null },
  // Components
  { id: "charts", name: "Charts & Dataviz", cat: "Components & Patterns", desc: "12 chart types with glass card containers.", render: () => null },
  { id: "buttons", name: "Buttons", cat: "Components & Patterns", desc: "4 appearances: primary, secondary, outline, ghost. Glass surfaces.", render: Buttons },
  { id: "inputs", name: "Text Input", cat: "Components & Patterns", desc: "Glass surface input with accent focus ring.", render: Inputs },
  { id: "checkboxes", name: "Checkbox", cat: "Components & Patterns", desc: "Teal fill when checked. Glass-bordered unchecked.", render: Checkboxes },
  { id: "radios", name: "Radio Buttons", cat: "Components & Patterns", desc: "Teal ring + inner dot. Subtle glass border.", render: Radios },
  { id: "switches", name: "Switch", cat: "Components & Patterns", desc: "Glass track with teal fill. Smooth thumb animation.", render: Switches },
  { id: "tabs", name: "Tabs", cat: "Components & Patterns", desc: "Glass underline indicator. Muted-to-accent label transition.", render: Tabs },
  { id: "cards", name: "Cards", cat: "Components & Patterns", desc: "Frosted glass cards with backdrop-blur.", render: Cards },
  { id: "badges", name: "Badges", cat: "Components & Patterns", desc: "Glass pill badges with status variants.", render: Badges },
  { id: "avatars", name: "Avatars", cat: "Components & Patterns", desc: "Glass-bordered circle with initials.", render: Avatars },
  { id: "alerts", name: "Alerts", cat: "Components & Patterns", desc: "Glass alert bars with status tinting.", render: Alerts },
  { id: "progress", name: "Progress", cat: "Components & Patterns", desc: "Glass-track progress bar with teal fill.", render: Progress },
  { id: "tooltips", name: "Tooltips", cat: "Components & Patterns", desc: "Frosted glass tooltip.", render: Tooltips },
  { id: "dropdowns", name: "Dropdown", cat: "Components & Patterns", desc: "Glass surface dropdown menu.", render: Dropdowns },
  { id: "dialog", name: "Dialog", cat: "Components & Patterns", desc: "Glass modal with frosted backdrop.", render: DialogDemo },
  { id: "accordion", name: "Accordion", cat: "Components & Patterns", desc: "Collapsible glass sections.", render: Accordion },
  { id: "breadcrumbs", name: "Breadcrumbs", cat: "Components & Patterns", desc: "Subtle path navigation.", render: Breadcrumbs },
  { id: "data-table", name: "Data Table", cat: "Components & Patterns", desc: "Glass-row striping with sortable headers.", render: DataTable },
  { id: "ag-grid", name: "AG Grid", cat: "Components & Patterns", desc: "Enterprise data grid with glass theming, sorting, filtering, and density scaling.", render: () => null },
  // Patterns
  { id: "pat-dashboard", name: "Analytical Dashboard", cat: "Patterns", desc: "Glass stat cards + charts + data tables.", render: PatDashboard },
  { id: "pat-form", name: "Forms", cat: "Patterns", desc: "Glass input fields + validation + button bar.", render: PatForm },
  { id: "pat-list-detail", name: "List-Detail", cat: "Patterns", desc: "Master list + glass detail pane.", render: PatListDetail },
];
