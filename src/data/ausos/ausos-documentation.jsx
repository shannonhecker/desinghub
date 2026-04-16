import React, { useState } from "react";

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
    .a-input{height:${sz.h+8}px;font-size:${sz.fs}px;padding:0 ${sz.pad+2}px;border-radius:${Math.round(sz.cardRadius/2)}px ${Math.round(sz.cardRadius/2)}px 0 0;}
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
    .a-sidebar-item{padding:${sz.sideItemPad};font-size:${sz.sideFs}px;border-radius:${Math.round(sz.cardRadius/2)}px;}
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
    // Accent — muted violet (darker, less vivid for better text contrast)
    accent: "#7E6BC4", accentHover: "#8D7DD0", accentActive: "#6F5CB5",
    accentGradient: "linear-gradient(135deg, #8D7DD0 0%, #7E6BC4 50%, #6F5CB5 100%)",
    accentSurface: "rgba(126,107,196,0.10)", accentSurfaceHover: "rgba(126,107,196,0.16)",
    accentFg: "#ffffff",
    // Borders — WCAG 3:1 for UI components on dark bg
    border: "rgba(255,255,255,0.10)", borderMd: "rgba(255,255,255,0.20)", borderStrong: "#6B7280",
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
    // Accent — muted violet (matching dark theme tone)
    accent: "#6B5AA8", accentHover: "#5C4B98", accentActive: "#4D3C88",
    accentGradient: "linear-gradient(135deg, #7E6BC4 0%, #6B5AA8 50%, #5C4B98 100%)",
    accentSurface: "rgba(107,90,168,0.06)", accentSurfaceHover: "rgba(107,90,168,0.10)",
    accentFg: "#FFFFFF",
    // Borders — WCAG 3:1 compliant for UI components
    border: "rgba(0,0,0,0.12)", borderMd: "rgba(0,0,0,0.25)", borderStrong: "#9688AD",
    borderAccent: "rgba(107,90,168,0.25)",
    // Elevation — purple-tinted shadows
    shadow: "0 2px 8px rgba(100,60,180,0.06), 0 8px 24px rgba(100,60,180,0.04)",
    shadowLg: "0 4px 12px rgba(100,60,180,0.08), 0 12px 36px rgba(100,60,180,0.06)",
    glass: "blur(20px) saturate(130%)", glassLg: "blur(28px) saturate(140%)",
    insetHighlight: "inset 0 1px 0 rgba(255,255,255,0.7)",
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

let T = THEMES.light;

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
/* Smooth micro-transitions on all elements */
*, *::before, *::after { transition: background-color 200ms, color 150ms, border-color 200ms, box-shadow 250ms, opacity 200ms, transform 200ms; }
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

/* === INPUT (M3-style underline with white bg) === */
.a-input-wrap { display:flex; flex-direction:column; gap:4px; }
.a-input-label { font-size:12px; font-weight:600; color:${T.fg2}; font-family:${FONT}; text-transform:uppercase; letter-spacing:0.04em; }
.a-input { height:40px; border:none; border-bottom:2px solid ${T.borderStrong}; border-radius:10px 10px 0 0; padding:0 14px; font-size:14px; font-family:${FONT}; color:${T.fg}; background:${T.surface}; outline:none; transition:border-color var(--a-dur-fast) var(--a-ease); }
.a-input:hover { border-bottom-color:${T.fg2}; }
.a-input:focus { border-bottom-color:${T.accent}; }
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
.a-switch { width:44px; height:24px; border-radius:12px; background:${T.borderMd}; border:2px solid ${T.borderStrong}; cursor:pointer; position:relative; outline:none; transition:all var(--a-dur-mid) var(--a-ease); padding:0; }
.a-switch:focus-visible { outline:2px solid ${T.accent}; outline-offset:2px; }
.a-switch .a-sw-thumb { position:absolute; width:16px; height:16px; border-radius:8px; background:#ffffff; top:2px; left:2px; transition:all var(--a-dur-mid) var(--a-ease); box-shadow:0 1px 3px rgba(0,0,0,0.15); }
.a-switch.on { background:${T.accent}; border-color:${T.accent}; }
.a-switch.on .a-sw-thumb { left:22px; background:#ffffff; }

/* === TABS === */
.a-tabs { display:flex; border-bottom:1px solid ${T.border}; gap:0; }
.a-tab { padding:8px 14px; font-family:${FONT}; font-size:13px; font-weight:500; color:${T.fg3}; cursor:pointer; background:transparent; border:none; border-bottom:2px solid transparent; transition:all var(--a-dur-fast) var(--a-ease); outline:none; }
.a-tab:hover { color:${T.fg}; background:${T.surface}; }
.a-tab.active { color:${T.fg}; border-bottom-color:${T.accent}; font-weight:600; }
.a-tab:focus-visible { outline:2px solid ${T.accent}; outline-offset:-2px; }

/* === CARD === */
.a-card { border-radius:16px; background:${T.cardBg}; border:1px solid ${T.borderMd}; backdrop-filter:${T.glass}; -webkit-backdrop-filter:${T.glass}; cursor:pointer; outline:none; transition:background var(--a-dur-fast) var(--a-ease), border-color var(--a-dur-fast) var(--a-ease), box-shadow var(--a-dur-mid) var(--a-ease); overflow:hidden; box-shadow:${T.insetHighlight}, 0 2px 8px rgba(0,0,0,0.08); }
.a-card:hover { background:${T.cardBgHover}; border-color:${T.borderStrong}; box-shadow:${T.shadow}, ${T.insetHighlight}; transform:translateY(-1px); }
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
.a-alert { display:flex; align-items:flex-start; gap:10px; padding:12px 16px; border-radius:12px; font-family:${FONT}; font-size:12px; backdrop-filter:${T.glass}; -webkit-backdrop-filter:${T.glass}; border:1px solid; box-shadow:${T.insetHighlight}; }
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
.a-dialog { background:${T.surfaceLg}; backdrop-filter:${T.glassLg}; -webkit-backdrop-filter:${T.glassLg}; border:1px solid ${T.borderMd}; border-radius:20px; padding:28px; min-width:320px; box-shadow:${T.shadowLg}, ${T.insetHighlight}; font-family:${FONT}; }

/* === DATA TABLE === */
.a-table { width:100%; border-collapse:separate; border-spacing:0; font-family:${FONT}; font-size:12px; }
.a-table th { padding:8px 10px; text-align:left; font-weight:600; font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:${T.fg3}; border-bottom:1px solid ${T.borderMd}; background:transparent; }
.a-table td { padding:8px 10px; border-bottom:1px solid ${T.border}; color:${T.fg}; }
.a-table tr:hover td { background:${T.surface}; }

/* === ACCORDION === */
.a-accordion { border:1px solid ${T.borderStrong}; border-radius:14px; overflow:hidden; backdrop-filter:${T.glass}; }
.a-accordion-header { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; cursor:pointer; font-family:${FONT}; font-size:13px; font-weight:600; color:${T.fg}; background:${T.surface}; border:none; width:100%; outline:none; transition:background var(--a-dur-fast) var(--a-ease); }
.a-accordion-header:hover { background:${T.surfaceHover}; }
.a-accordion-body { padding:10px 14px; font-size:12px; color:${T.fg2}; border-top:1px solid ${T.border}; }

/* === DROPDOWN === */
.a-dropdown { position:relative; display:inline-block; }
.a-dropdown-trigger { display:flex; align-items:center; justify-content:space-between; gap:8px; height:40px; padding:0 14px; border:none; border-bottom:2px solid ${T.borderStrong}; border-radius:10px 10px 0 0; background:${T.surface}; backdrop-filter:${T.glass}; color:${T.fg}; font-family:${FONT}; font-size:13px; cursor:pointer; transition:border-color var(--a-dur-fast); }
.a-dropdown-trigger:hover { border-bottom-color:${T.fg2}; }
.a-dropdown-menu { position:absolute; top:calc(100% + 4px); left:0; right:0; background:${T.bg2}; backdrop-filter:${T.glassLg}; border:1px solid ${T.borderMd}; border-radius:14px; box-shadow:${T.shadowLg}; overflow:hidden; z-index:10; }
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
  const steps = [
    { value: 2, token: "spacing-25" },
    { value: 4, token: "spacing-50" },
    { value: 8, token: "spacing-100" },
    { value: 12, token: "spacing-150" },
    { value: 16, token: "spacing-200" },
    { value: 24, token: "spacing-300" },
    { value: 32, token: "spacing-400" },
    { value: 40, token: "spacing-500" },
    { value: 48, token: "spacing-600" },
    { value: 64, token: "spacing-800" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, fontFamily: FONT }}>
      {steps.map(s => (
        <div key={s.value} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: T.fg3, width: 32, textAlign: "right", fontWeight: 600 }}>{s.value}</span>
          <div style={{ width: s.value * 3, height: 12, borderRadius: 4, background: T.accent, opacity: 0.6 }} />
          <span style={{ fontSize: 10, color: T.fg3, fontFamily: "monospace" }}>--a-{s.token}</span>
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
    <div style={{ background: T.gradient, borderRadius: 16, padding: 16 }}>
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
    <div style={{ fontFamily: FONT, background: T.gradient, borderRadius: 16, padding: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="a-dialog" style={{ position: "relative", maxWidth: 300 }}>
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

function DatePickerDemo() {
  const [sel, setSel] = useState(15);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  return (
    <div style={{ fontFamily: FONT, maxWidth: 280 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <AIcon name="chevron_left" size={18} color={T.fg3} />
        <span style={{ fontSize: 14, fontWeight: 600, color: T.fg }}>April 2026</span>
        <AIcon name="chevron_right" size={18} color={T.fg3} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, textAlign: "center" }}>
        {weekdays.map(d => <div key={d} style={{ fontSize: 10, color: T.fg3, fontWeight: 600, padding: "4px 0" }}>{d}</div>)}
        {/* Offset for April 2026 starting on Wednesday */}
        {[null, null].map((_, i) => <div key={`e${i}`} />)}
        {days.map(d => (
          <button key={d} onClick={() => setSel(d)} style={{
            width: 32, height: 32, borderRadius: 9999, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: sel === d ? 600 : 400, fontFamily: FONT,
            background: sel === d ? T.accent : "transparent",
            color: sel === d ? T.accentFg : d === new Date().getDate() ? T.accent : T.fg,
            transition: "background 0.15s, color 0.15s",
          }}>{d}</button>
        ))}
      </div>
    </div>
  );
}

/* ── Pattern Demos ── */

function PatDashboard() {
  const stats = [
    { label: "Total Revenue", value: "$42,800", change: "+12.5%", up: true, icon: "trending_up", sparkline: [30, 45, 35, 55, 48, 65, 72] },
    { label: "Active Users", value: "1,247", change: "+8.3%", up: true, icon: "group", sparkline: [20, 28, 32, 30, 38, 42, 45] },
    { label: "Conversion Rate", value: "3.2%", change: "-0.4%", up: false, icon: "swap_horiz", sparkline: [40, 38, 42, 35, 33, 30, 28] },
    { label: "Avg. Session", value: "4m 32s", change: "+18%", up: true, icon: "timer", sparkline: [15, 22, 28, 35, 30, 40, 48] },
  ];
  const tableRows = [
    { name: "Dashboard Pro", status: "Active", users: "2,104", revenue: "$12,400" },
    { name: "Analytics Suite", status: "Active", users: "1,847", revenue: "$9,200" },
    { name: "CRM Module", status: "Pending", users: "892", revenue: "$4,600" },
    { name: "Reports Engine", status: "Active", users: "1,403", revenue: "$7,800" },
  ];
  return (
    <div style={{ background: T.gradient, borderRadius: 16, padding: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: FONT }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: T.fg }}>Dashboard</div>
            <div style={{ fontSize: 11, color: T.fg3, marginTop: 2 }}>Overview for April 2026</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="a-btn a-btn-ghost" style={{ height: 28, fontSize: 11, minWidth: 0, padding: "0 10px" }}>Export</button>
            <button className="a-btn a-btn-primary" style={{ height: 28, fontSize: 11, minWidth: 0, padding: "0 10px" }}>+ Add Widget</button>
          </div>
        </div>
        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {stats.map(s => (
            <div key={s.label} className="a-card" style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: T.fg3, fontWeight: 500 }}>{s.label}</span>
                <AIcon name={s.icon} size={14} color={T.fg3} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: T.fg, letterSpacing: "-0.02em" }}>{s.value}</div>
              {/* Mini sparkline */}
              <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 20, margin: "8px 0 4px" }}>
                {s.sparkline.map((v, i) => (
                  <div key={i} style={{ flex: 1, height: `${(v / 80) * 100}%`, borderRadius: 2, background: i === s.sparkline.length - 1 ? T.accent : `${T.accent}40` }} />
                ))}
              </div>
              <div style={{ fontSize: 10, color: s.up ? T.successFg : T.dangerFg, fontWeight: 500 }}>
                {s.change} from last month
              </div>
            </div>
          ))}
        </div>
        {/* Data Table */}
        <div className="a-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.fg }}>Recent Projects</div>
          </div>
          <table className="a-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Users</th>
                <th style={{ textAlign: "right" }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map(r => (
                <tr key={r.name}>
                  <td style={{ fontWeight: 500 }}>{r.name}</td>
                  <td><span className={`a-badge ${r.status === "Active" ? "a-badge-success" : "a-badge-warning"}`} style={{ fontSize: 10 }}>{r.status}</span></td>
                  <td>{r.users}</td>
                  <td style={{ textAlign: "right", fontWeight: 500 }}>{r.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
  /* Foundations */
  "dl-color": () => <div style={{display:"flex",gap:2,padding:"6px 0"}}>{[T.bg,T.surface,T.fg,T.accent,T.borderStrong,T.successFg,T.warningFg,T.dangerFg].map((c,i)=><div key={i} style={{width:14,height:14,borderRadius:4,background:c,border:`1px solid ${T.borderMd}`}}/>)}</div>,
  "dl-icons": () => <div style={{display:"flex",gap:4,padding:"6px 0"}}>{["search","settings","home"].map(i=><span key={i} className="material-symbols-outlined" style={{fontSize:14,color:T.fg3}}>{i}</span>)}</div>,
  "dl-typography": () => <div style={{fontFamily:FONT,padding:"4px 0",display:"flex",flexDirection:"column",gap:1}}><span style={{fontSize:14,fontWeight:700,color:T.fg,lineHeight:1}}>Aa</span><span style={{fontSize:9,color:T.fg2}}>{FONT.split(",")[0].replace(/'/g,"")}</span></div>,
  "dl-elevation": () => <div style={{display:"flex",gap:4,padding:"6px 0",alignItems:"flex-end"}}>{[0,8,16].map(b=><div key={b} style={{width:24,height:18+b/2,borderRadius:6,background:T.surface,border:`1px solid ${T.borderMd}`,backdropFilter:`blur(${b}px)`}}/>)}</div>,
  "dl-spacing": () => <div style={{display:"flex",flexDirection:"column",gap:2,padding:"6px 0"}}>{[4,8,16,24].map(s=><div key={s} style={{width:s*3,height:4,borderRadius:2,background:T.accent,opacity:0.5}}/>)}</div>,
  "dl-tokens": () => <div style={{fontSize:8,color:T.fg3,fontFamily:"monospace",padding:"6px 0",lineHeight:1.6}}>--a-bg<br/>--a-surface<br/>--a-accent</div>,
  "dl-a11y": () => <div style={{display:"flex",alignItems:"center",gap:4,padding:"6px 0"}}><span className="material-symbols-outlined" style={{fontSize:16,color:T.successFg}}>check_circle</span><span style={{fontSize:9,color:T.fg2}}>AA</span></div>,
  "dl-density": () => <div style={{display:"flex",gap:3,padding:"6px 0",alignItems:"flex-end"}}>{[12,18,24,32].map(h=><div key={h} style={{width:14,height:h,borderRadius:4,background:T.accentSurface,border:`1px solid ${T.borderMd}`}}/>)}</div>,
  "dl-content": () => <div style={{fontSize:9,color:T.fg2,padding:"6px 0",lineHeight:1.5}}>Clear · Direct<br/>Human voice</div>,
  tokens: () => <div style={{display:"flex",gap:2,padding:"6px 0"}}>{[T.accent,T.fg,T.bg,T.successFg].map((c,i)=><div key={i} style={{width:12,height:12,borderRadius:3,background:c,border:`1px solid ${T.borderMd}`}}/>)}</div>,
  audit: () => <div style={{display:"flex",gap:2,padding:"6px 0"}}>{["check","check","close"].map((i,idx)=><span key={idx} className="material-symbols-outlined" style={{fontSize:12,color:idx<2?T.successFg:T.dangerFg}}>{i}</span>)}</div>,
  /* Components */
  buttons: () => <div style={{display:"flex",gap:4}}><button className="a-btn a-btn-primary" style={{height:20,fontSize:9,minWidth:0,padding:"0 8px"}}>Primary</button><button className="a-btn a-btn-secondary" style={{height:20,fontSize:9,minWidth:0,padding:"0 8px"}}>Secondary</button></div>,
  inputs: () => <div style={{height:18,borderBottom:`2px solid ${T.borderStrong}`,borderRadius:"4px 4px 0 0",background:T.surface,padding:"0 6px",fontSize:9,color:T.fg3,display:"flex",alignItems:"center",maxWidth:120}}>Enter text...</div>,
  checkboxes: () => <div style={{display:"flex",gap:4}}><div style={{width:14,height:14,borderRadius:4,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:10,color:"#fff"}}>✓</span></div><div style={{width:14,height:14,borderRadius:4,border:`2px solid ${T.borderStrong}`}}/></div>,
  radios: () => <div style={{display:"flex",gap:4}}><div style={{width:14,height:14,borderRadius:7,border:`2px solid ${T.accent}`,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:6,height:6,borderRadius:3,background:T.accent}}/></div><div style={{width:14,height:14,borderRadius:7,border:`2px solid ${T.borderStrong}`}}/></div>,
  switches: () => <div style={{width:28,height:16,borderRadius:8,background:T.accent,position:"relative"}}><div style={{width:10,height:10,borderRadius:5,background:"#fff",position:"absolute",top:3,left:15,boxShadow:"0 1px 2px rgba(0,0,0,0.2)"}}/></div>,
  cards: () => <div style={{padding:6,borderRadius:8,background:T.cardBg,border:`1px solid ${T.borderMd}`}}><div style={{fontSize:9,fontWeight:600,color:T.fg}}>Card</div><div style={{fontSize:7,color:T.fg3}}>Content</div></div>,
  tabs: () => <div style={{display:"flex",gap:0,borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:8,color:T.accent,borderBottom:`2px solid ${T.accent}`,padding:"2px 6px",fontWeight:600}}>Tab 1</span><span style={{fontSize:8,color:T.fg3,padding:"2px 6px"}}>Tab 2</span></div>,
  badges: () => <div style={{display:"flex",gap:3}}><span className="a-badge a-badge-accent" style={{height:14,fontSize:8,padding:"0 5px"}}>Active</span><span className="a-badge a-badge-success" style={{height:14,fontSize:8,padding:"0 5px"}}>Done</span></div>,
  avatars: () => <div style={{display:"flex",gap:3}}>{["SH","JD"].map(i=><div key={i} style={{width:20,height:20,borderRadius:10,background:T.accentSurface,border:`1px solid ${T.borderMd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:600,color:T.accent}}>{i}</div>)}</div>,
  alerts: () => <div style={{display:"flex",gap:3,padding:"4px 0"}}>{[T.infoFg,T.successFg,T.warningFg,T.dangerFg].map((c,i)=><div key={i} style={{width:8,height:8,borderRadius:4,background:c}}/>)}</div>,
  progress: () => <div style={{padding:"6px 0"}}><div style={{height:4,borderRadius:2,background:T.borderMd,overflow:"hidden"}}><div style={{width:"65%",height:"100%",borderRadius:2,background:T.accent}}/></div></div>,
  tooltips: () => <div style={{fontSize:8,color:T.fg,background:T.surface,border:`1px solid ${T.borderMd}`,borderRadius:6,padding:"3px 6px"}}>Tooltip</div>,
  dropdowns: () => <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:8,color:T.fg3,borderBottom:`2px solid ${T.borderStrong}`,borderRadius:"4px 4px 0 0",background:T.surface,padding:"3px 6px",maxWidth:100}}><span>Select...</span><span style={{fontSize:10}}>▾</span></div>,
  dialog: () => <div style={{width:50,height:35,borderRadius:8,background:T.surface,border:`1px solid ${T.borderMd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,color:T.fg3}}>Modal</div>,
  accordion: () => <div style={{borderRadius:6,border:`1px solid ${T.borderMd}`,overflow:"hidden"}}><div style={{padding:"3px 6px",fontSize:8,fontWeight:600,color:T.fg,background:T.surface}}>Section ▾</div></div>,
  breadcrumbs: () => <div style={{display:"flex",gap:2,fontSize:8,color:T.fg3}}>Home <span style={{opacity:0.4}}>/</span> <span style={{color:T.fg,fontWeight:500}}>Page</span></div>,
  "date-picker": () => <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,padding:"4px 0"}}>{Array.from({length:7},(_,i)=><div key={i} style={{width:8,height:8,borderRadius:4,fontSize:5,textAlign:"center",background:i===3?T.accent:"transparent",color:i===3?T.accentFg:T.fg3,display:"flex",alignItems:"center",justifyContent:"center"}}>{i+10}</div>)}</div>,
  "data-table": () => <div style={{fontSize:7,color:T.fg3}}><div style={{display:"flex",gap:8,borderBottom:`1px solid ${T.borderMd}`,padding:"2px 0",fontWeight:600}}>Name<span>Status</span></div><div style={{display:"flex",gap:8,padding:"2px 0"}}>Item<span style={{color:T.successFg}}>✓</span></div></div>,
  "ag-grid": () => <div style={{fontSize:7,color:T.fg3,border:`1px solid ${T.borderMd}`,borderRadius:4,overflow:"hidden"}}><div style={{background:T.surface,padding:"2px 4px",fontWeight:600,borderBottom:`1px solid ${T.borderMd}`}}>AG Grid</div><div style={{padding:"2px 4px"}}>Data rows</div></div>,
  charts: () => <div style={{display:"flex",gap:2,alignItems:"flex-end",padding:"6px 0"}}>{[40,65,45,80,55].map((h,i)=><div key={i} style={{width:8,height:h/3,borderRadius:2,background:T.chart?T.chart[i%T.chart.length]:T.accent,opacity:0.8}}/>)}</div>,
  /* Patterns */
  "pat-dashboard": () => <div style={{display:"flex",gap:3}}>{["$42K","1.2K","+18%"].map((v,i)=><div key={i} style={{fontSize:7,fontWeight:700,color:T.fg,background:T.cardBg,border:`1px solid ${T.borderMd}`,borderRadius:4,padding:"3px 4px",lineHeight:1}}>{v}</div>)}</div>,
  "pat-form": () => <div style={{display:"flex",flexDirection:"column",gap:2}}><div style={{height:10,borderBottom:`1px solid ${T.borderStrong}`,borderRadius:"3px 3px 0 0",background:T.surface,width:60}}/><div style={{height:10,borderBottom:`1px solid ${T.borderStrong}`,borderRadius:"3px 3px 0 0",background:T.surface,width:60}}/></div>,
  "pat-list-detail": () => <div style={{display:"flex",gap:1,fontSize:7}}><div style={{width:24,background:T.surface,borderRadius:"3px 0 0 3px",padding:2,color:T.fg3}}>List</div><div style={{flex:1,padding:2,color:T.fg}}>Detail</div></div>,
  "pat-app-shell": () => <div style={{display:"flex",flexDirection:"column",height:24,borderRadius:6,border:`1px solid ${T.borderMd}`,overflow:"hidden"}}><div style={{height:6,background:T.surface}}/><div style={{display:"flex",flex:1}}><div style={{width:12,background:T.surface,borderRight:`1px solid ${T.borderMd}`}}/><div style={{flex:1}}/></div></div>,
  "pat-login": () => <div style={{display:"flex",justifyContent:"center"}}><div style={{width:40,borderRadius:6,border:`1px solid ${T.borderMd}`,padding:3}}><div style={{height:4,borderRadius:3,background:T.accent,marginBottom:2}}/><div style={{height:6,borderRadius:3,background:T.surface,borderBottom:`1px solid ${T.borderStrong}`,marginBottom:2}}/><div style={{height:6,borderRadius:9999,background:T.accent}}/></div></div>,
  "pat-settings": () => <div style={{display:"flex",gap:1,height:20}}><div style={{width:16}}>{["⚙","🔔"].map((i,idx)=><div key={idx} style={{fontSize:6,padding:1,color:idx===0?T.accent:T.fg3}}>{i}</div>)}</div><div style={{flex:1,border:`1px solid ${T.borderMd}`,borderRadius:6}}/></div>,
  "pat-search": () => <div><div style={{height:10,borderRadius:6,background:T.surface,borderBottom:`1px solid ${T.borderStrong}`,padding:"0 3px",fontSize:6,color:T.fg3,display:"flex",alignItems:"center"}}>🔍 Search</div><div style={{display:"flex",gap:2,marginTop:2}}>{[1,2].map(i=><div key={i} style={{flex:1,height:8,borderRadius:4,background:T.cardBg,border:`1px solid ${T.borderMd}`}}/>)}</div></div>,
  "pat-wizard": () => <div style={{display:"flex",gap:2,alignItems:"center"}}>{[1,2,3].map(s=><><div key={s} style={{width:10,height:10,borderRadius:5,background:s===1?T.accent:s===2?T.accentSurface:"transparent",border:`1.5px solid ${s<=2?T.accent:T.borderStrong}`,fontSize:5,color:s===1?T.accentFg:s===2?T.accent:T.fg3,display:"flex",alignItems:"center",justifyContent:"center"}}>{s}</div>{s<3&&<div style={{flex:1,height:1,background:s===1?T.accent:T.borderMd}}/>}</>)}</div>,
  "pat-data-table": () => <div style={{borderRadius:6,border:`1px solid ${T.borderMd}`,overflow:"hidden"}}><div style={{display:"flex",padding:2,borderBottom:`1px solid ${T.borderMd}`}}><span style={{flex:1,fontSize:6,fontWeight:600,color:T.fg3}}>Name</span><span style={{fontSize:6,fontWeight:600,color:T.fg3}}>Val</span></div><div style={{padding:2,fontSize:6,color:T.fg}}>Row 1</div></div>,
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
  { id: "date-picker", name: "Date Picker", cat: "Components & Patterns", desc: "Calendar date selector with accent highlight.", render: DatePickerDemo },
  { id: "data-table", name: "Data Table", cat: "Components & Patterns", desc: "Glass-row striping with sortable headers.", render: DataTable },
  { id: "ag-grid", name: "AG Grid", cat: "Components & Patterns", desc: "Enterprise data grid with glass theming, sorting, filtering, and density scaling.", render: () => null },
  // Patterns
  { id: "pat-dashboard", name: "Analytical Dashboard", cat: "Patterns", desc: "Glass stat cards + charts + data tables.", render: PatDashboard },
  { id: "pat-form", name: "Forms", cat: "Patterns", desc: "Glass input fields + validation + button bar.", render: PatForm },
  { id: "pat-list-detail", name: "List-Detail", cat: "Patterns", desc: "Master list + glass detail pane.", render: PatListDetail },
  { id: "pat-app-shell", name: "App Shell", cat: "Patterns", desc: "Header, glass sidebar, content area, footer.", render: function() {
    return <div style={{fontFamily:FONT,borderRadius:12,border:`1px solid ${T.borderMd}`,overflow:"hidden",height:140}}>
      <div style={{height:28,background:T.surface,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",padding:"0 10px",fontSize:11,fontWeight:600,color:T.fg}}>App Shell</div>
      <div style={{display:"flex",flex:1,height:112}}>
        <div style={{width:60,background:T.surface,borderRight:`1px solid ${T.border}`,padding:6}}>{["Home","Data","Settings"].map((n,i)=><div key={n} style={{padding:"4px 6px",fontSize:9,borderRadius:6,color:i===0?T.accent:T.fg3,background:i===0?T.accentSurface:"transparent",marginBottom:2}}>{n}</div>)}</div>
        <div style={{flex:1,padding:10,fontSize:10,color:T.fg2}}>Content area</div>
      </div>
    </div>;
  }},
  { id: "pat-login", name: "Login / Auth", cat: "Patterns", desc: "Auth form with glass inputs and accent button.", render: function() {
    return <div style={{fontFamily:FONT,maxWidth:240,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:12}}><div style={{fontSize:16,fontWeight:700,color:T.fg}}>Sign in</div><div style={{fontSize:10,color:T.fg3}}>Enter your credentials</div></div>
      <div className="a-input-wrap" style={{marginBottom:8}}><label className="a-input-label">Email</label><input className="a-input" readOnly defaultValue="user@example.com"/></div>
      <div className="a-input-wrap" style={{marginBottom:12}}><label className="a-input-label">Password</label><input className="a-input" type="password" readOnly defaultValue="••••••••"/></div>
      <button className="a-btn a-btn-primary" style={{width:"100%"}}>Sign in</button>
    </div>;
  }},
  { id: "pat-settings", name: "Settings Page", cat: "Patterns", desc: "Navigation sidebar with form sections.", render: function() {
    return <div style={{fontFamily:FONT,display:"flex",gap:12}}>
      <div style={{width:80}}>{["General","Security","Notifs"].map((n,i)=><div key={n} className={`a-sidebar-item${i===0?" active":""}`} style={{fontSize:10,marginBottom:2}}>{n}</div>)}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:600,color:T.fg,marginBottom:8}}>General</div>
        <div className="a-input-wrap" style={{marginBottom:6}}><label className="a-input-label">Display Name</label><input className="a-input" readOnly defaultValue="Jane Doe"/></div>
        <div style={{display:"flex",alignItems:"center",gap:8,fontSize:11,color:T.fg}}><button className={`a-switch on`} role="switch"><div className="a-sw-thumb"/></button>Dark mode</div>
      </div>
    </div>;
  }},
  { id: "pat-search", name: "Search Results", cat: "Patterns", desc: "Search input with filterable glass cards.", render: function() {
    return <div style={{fontFamily:FONT}}>
      <input className="a-input" readOnly defaultValue="Dashboard templates" style={{width:"100%",marginBottom:10}}/>
      <div style={{display:"flex",gap:6,marginBottom:8}}>{["All","Free","Pro"].map((f,i)=><button key={f} className={`a-btn ${i===0?"a-btn-primary":"a-btn-ghost"}`} style={{height:24,fontSize:10,minWidth:0,padding:"0 10px"}}>{f}</button>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{["Dashboard Kit","Admin Panel"].map(t=><div key={t} className="a-card" style={{padding:8}}><div style={{fontSize:10,fontWeight:600,color:T.fg}}>{t}</div><div style={{fontSize:8,color:T.fg3}}>Template</div></div>)}</div>
    </div>;
  }},
  { id: "pat-wizard", name: "Wizard / Stepper", cat: "Patterns", desc: "Multi-step form with progress indicator.", render: function() {
    const steps=["Details","Review","Done"];
    return <div style={{fontFamily:FONT}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14}}>{steps.map((s,i)=><><div key={s} style={{width:24,height:24,borderRadius:12,background:i===0?T.accent:i===1?T.accentSurface:"transparent",border:i>1?`2px solid ${T.borderStrong}`:"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:600,color:i===0?T.accentFg:i===1?T.accent:T.fg3}}>{i+1}</div>{i<2&&<div style={{flex:1,height:2,borderRadius:1,background:i===0?T.accent:T.borderMd}}/>}</>)}</div>
      <div style={{fontSize:12,fontWeight:600,color:T.fg,marginBottom:6}}>Step 1: Details</div>
      <div className="a-input-wrap"><label className="a-input-label">Name</label><input className="a-input" readOnly defaultValue="My Project"/></div>
    </div>;
  }},
  { id: "pat-data-table", name: "Data Table Page", cat: "Patterns", desc: "Filter bar, sortable glass grid, pagination.", render: function() {
    return <div style={{fontFamily:FONT}}>
      <div style={{display:"flex",gap:6,marginBottom:8}}><input className="a-input" readOnly placeholder="Filter..." style={{flex:1}}/><button className="a-btn a-btn-primary" style={{minWidth:0,padding:"0 12px"}}>Export</button></div>
      <div style={{borderRadius:10,border:`1px solid ${T.borderMd}`,overflow:"hidden"}}>
        <table className="a-table" style={{width:"100%"}}><thead><tr><th>Name</th><th>Status</th><th>Users</th></tr></thead>
        <tbody>{[{n:"Dashboard",s:"Active",u:"1,247"},{n:"Reports",s:"Pending",u:"892"}].map(r=><tr key={r.n}><td style={{fontWeight:500}}>{r.n}</td><td><span className={`a-badge ${r.s==="Active"?"a-badge-success":"a-badge-warning"}`} style={{fontSize:9}}>{r.s}</span></td><td>{r.u}</td></tr>)}</tbody></table>
      </div>
    </div>;
  }},
];
