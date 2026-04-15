import React, { useState, useEffect, useRef } from "react";

/* ── EXPORTED FOR DESIGN HUB ── */
export { THEMES as FLUENT_THEMES, buildCSS as fluentBuildCSS, COMPS as FLUENT_COMPS, CATS as FLUENT_CATS, FIcon, FONT as FLUENT_FONT };
export function setFluentT(theme) { T = theme; }
export function getFluentT() { return T; }
export function getFluentPreviews() { return PREVIEWS; }
export function getFluentDemoComponent(id) {
  const comp = COMPS.find(c => c.id === id);
  return comp ? comp.render : null;
}
export function getFluentSizeCSS(size) {
  const sizeMap = {
    small:  { h: 24, pad: 8,  fs: 12, iconS: 16, sideW: 220, sidePad: 10, mainPad: 20, cardMin: 160, gap: 8,  bodyFs: 12, labelFs: 12, headFs: 24, subFs: 11, gridGap: 8,  cardPad: 10, sideItemPad: "5px 8px", sideFs: 11, topBarH: 36, cardRadius: 4 },
    medium: { h: 32, pad: 12, fs: 14, iconS: 20, sideW: 260, sidePad: 12, mainPad: 32, cardMin: 200, gap: 10, bodyFs: 14, labelFs: 14, headFs: 28, subFs: 12, gridGap: 10, cardPad: 14, sideItemPad: "8px 12px", sideFs: 13, topBarH: 44, cardRadius: 8 },
    large:  { h: 40, pad: 16, fs: 14, iconS: 24, sideW: 300, sidePad: 16, mainPad: 40, cardMin: 240, gap: 14, bodyFs: 14, labelFs: 16, headFs: 36, subFs: 14, gridGap: 14, cardPad: 18, sideItemPad: "10px 14px", sideFs: 14, topBarH: 52, cardRadius: 8 },
  };
  const sz = sizeMap[size] || sizeMap.medium;
  return `
    .f-btn{height:${sz.h}px;padding:0 ${sz.pad}px;font-size:${sz.fs}px;min-width:${sz.h*3}px;border-radius:${sz.cardRadius/2}px;}
    .f-btn-sm{height:${sizeMap.small.h}px;padding:0 ${sizeMap.small.pad}px;font-size:${sizeMap.small.fs}px;}
    .f-btn-lg{height:${sizeMap.large.h}px;padding:0 ${sizeMap.large.pad}px;font-size:${sizeMap.large.fs}px;}
    .f-input{height:${sz.h}px;font-size:${sz.fs}px;padding:0 ${sz.pad-2}px;}
    .f-input-label{font-size:${sz.labelFs}px;}
    .f-checkbox{font-size:${sz.fs}px;gap:${sz.gap-2}px;}
    .f-cb-box{width:${sz.iconS-4}px;height:${sz.iconS-4}px;}
    .f-radio{font-size:${sz.fs}px;gap:${sz.gap-2}px;}
    .f-radio-circle{width:${sz.iconS-4}px;height:${sz.iconS-4}px;border-radius:${(sz.iconS-4)/2}px;}
    .f-tab{padding:${Math.max(6,sz.pad-2)}px ${sz.pad}px;font-size:${sz.fs}px;}
    .f-menu-item{padding:${Math.max(4,sz.pad-4)}px ${sz.pad-2}px;font-size:${sz.fs}px;}
    .f-badge{height:${sz.h-12}px;min-width:${sz.h-12}px;font-size:${sz.fs-2}px;}
    .f-msgbar{padding:${Math.max(4,sz.pad-4)}px ${sz.pad}px;font-size:${sz.fs}px;}
    .f-card{border-radius:${sz.cardRadius}px;}
    .f-avatar{width:${sz.h}px;height:${sz.h}px;font-size:${sz.fs}px;}
    .f-switch{width:${sz.h+8}px;height:${sz.h/1.6}px;border-radius:${sz.h}px;}
    .f-switch .f-sw-thumb{width:${sz.h/2.3}px;height:${sz.h/2.3}px;border-radius:${sz.h}px;}
    .f-switch.on .f-sw-thumb{left:${sz.h-6}px;}
    .f-sidebar-item{padding:${sz.sideItemPad};font-size:${sz.sideFs}px;}
  `;
}

/* ── FLUENT 2 THEME PALETTES ── */
const THEMES = {
  light: {
    name: "Light",
    bg1: "#FFFFFF", bg2: "#FAFAFA", bg3: "#F5F5F5", bg4: "#F0F0F0", bg5: "#EBEBEB", bg6: "#E6E6E6",
    bgInverted: "#292929", bgStatic: "#333333", bgDisabled: "#F0F0F0",
    subtleBg: "transparent", subtleBgHover: "#F5F5F5", subtleBgPressed: "#E0E0E0", subtleBgSelected: "#EBEBEB",
    cardBg: "#FAFAFA", cardBgHover: "#FFFFFF", cardBgPressed: "#F5F5F5",
    fg1: "#242424", fg2: "#424242", fg3: "#616161", fg4: "#707070", fgDisabled: "#BDBDBD",
    fgInverted: "#FFFFFF", fgOnBrand: "#FFFFFF",
    brandBg: "#0F6CBD", brandBgHover: "#115EA3", brandBgPressed: "#0C3B5E", brandBgSelected: "#0F548C",
    brandBg2: "#EBF3FC", brandFg1: "#0F6CBD", brandFg2: "#115EA3", brandFgLink: "#115EA3",
    brandStroke1: "#0F6CBD",
    strokeAccessible: "#616161", stroke1: "#D1D1D1", stroke2: "#E0E0E0", stroke3: "#F0F0F0", strokeDisabled: "#E0E0E0",
    shadowAmbient: "rgba(0,0,0,0.12)", shadowKey: "rgba(0,0,0,0.14)",
    dangerBg1: "#FDF3F4", dangerBg3: "#C50F1F", dangerFg1: "#B10E1C",
    successBg1: "#F1FAF1", successBg3: "#107C10", successFg1: "#0E700E",
    warningBg1: "#FFF9F5", warningBg3: "#F7630C", warningFg1: "#BC4B09",
  },
  dark: {
    name: "Dark",
    bg1: "#292929", bg2: "#1F1F1F", bg3: "#141414", bg4: "#0A0A0A", bg5: "#000000", bg6: "#333333",
    bgInverted: "#FFFFFF", bgStatic: "#3D3D3D", bgDisabled: "#141414",
    subtleBg: "transparent", subtleBgHover: "#383838", subtleBgPressed: "#2E2E2E", subtleBgSelected: "#333333",
    cardBg: "#333333", cardBgHover: "#3D3D3D", cardBgPressed: "#2E2E2E",
    fg1: "#FFFFFF", fg2: "#D6D6D6", fg3: "#ADADAD", fg4: "#999999", fgDisabled: "#5C5C5C",
    fgInverted: "#242424", fgOnBrand: "#FFFFFF",
    brandBg: "#115EA3", brandBgHover: "#0F6CBD", brandBgPressed: "#0C3B5E", brandBgSelected: "#0F548C",
    brandBg2: "#082338", brandFg1: "#479EF5", brandFg2: "#62ABF5", brandFgLink: "#479EF5",
    brandStroke1: "#479EF5",
    strokeAccessible: "#ADADAD", stroke1: "#666666", stroke2: "#525252", stroke3: "#3D3D3D", strokeDisabled: "#424242",
    shadowAmbient: "rgba(0,0,0,0.24)", shadowKey: "rgba(0,0,0,0.28)",
    dangerBg1: "#3B0509", dangerBg3: "#C50F1F", dangerFg1: "#ECA3A3",
    successBg1: "#052505", successBg3: "#107C10", successFg1: "#9CD49C",
    warningBg1: "#3D1D00", warningBg3: "#F7630C", warningFg1: "#F7C5A0",
  },
};

let T = THEMES.light;

/* ── FLUENT FONT STACK ── */
const FONT = "'Segoe UI', 'Segoe UI Web (West European)', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif";

/* ── GLOBAL STYLES ── */
const buildCSS = (T) => `
@import url('https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;600;700&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }

/* Fluent 2 Motion Tokens */
:root {
  --f-dur-ultra-fast: 50ms;
  --f-dur-faster: 100ms;
  --f-dur-fast: 150ms;
  --f-dur-normal: 200ms;
  --f-dur-gentle: 250ms;
  --f-dur-slow: 300ms;
  --f-curve-decel-mid: cubic-bezier(0.1, 0.9, 0.2, 1);
  --f-curve-accel-mid: cubic-bezier(0.7, 0, 1, 0.5);
  --f-curve-easy-ease: cubic-bezier(0.33, 0, 0.67, 1);
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}

/* === BUTTONS === */
.f-btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; height:32px; min-width:96px; border-radius:4px; padding:0 12px; font-family:${FONT}; font-size:14px; font-weight:600; cursor:pointer; border:1px solid transparent; outline:none; position:relative; overflow:hidden; transition:background var(--f-dur-fast) var(--f-curve-easy-ease), border-color var(--f-dur-fast) var(--f-curve-easy-ease), color var(--f-dur-fast) var(--f-curve-easy-ease); }
.f-btn:focus-visible { outline:2px solid ${T.fg1}; outline-offset:2px; }
.f-btn:disabled { opacity:0.38; cursor:default; pointer-events:none; }

.f-btn-primary { background:${T.brandBg}; color:${T.fgOnBrand}; }
.f-btn-primary:hover { background:${T.brandBgHover}; }
.f-btn-primary:active { background:${T.brandBgPressed}; }

.f-btn-secondary { background:${T.bg1}; color:${T.fg1}; border-color:${T.stroke1}; }
.f-btn-secondary:hover { background:${T.bg3}; border-color:${T.strokeAccessible}; }
.f-btn-secondary:active { background:${T.bg4}; }

.f-btn-outline { background:transparent; color:${T.brandFg1}; border-color:${T.brandStroke1}; }
.f-btn-outline:hover { background:${T.brandBg2}; }
.f-btn-outline:active { background:${T.brandBg2}; color:${T.brandBgHover}; }

.f-btn-subtle { background:transparent; color:${T.fg1}; }
.f-btn-subtle:hover { background:${T.subtleBgHover}; }
.f-btn-subtle:active { background:${T.subtleBgPressed}; }

.f-btn-transparent { background:transparent; color:${T.fg1}; border:none; }
.f-btn-transparent:hover { background:transparent; color:${T.fg1}; }
.f-btn-transparent:active { background:transparent; color:${T.fg1}; }

.f-btn-sm { height:24px; padding:0 8px; font-size:12px; min-width:64px; }
.f-btn-lg { height:40px; padding:0 16px; font-size:14px; }

/* === INPUT === */
.f-input-wrap { display:flex; flex-direction:column; gap:4px; }
.f-input-label { font-size:14px; font-weight:600; color:${T.fg1}; font-family:${FONT}; }
.f-input { height:32px; border:1px solid ${T.stroke1}; border-bottom:2px solid ${T.strokeAccessible}; border-radius:4px; padding:0 10px; font-size:14px; font-family:${FONT}; color:${T.fg1}; background:${T.bg1}; outline:none; transition:border-color var(--f-dur-fast) var(--f-curve-easy-ease); }
.f-input:hover { border-color:${T.strokeAccessible}; }
.f-input:focus { border-bottom:2px solid ${T.brandBg}; }
.f-input::placeholder { color:${T.fg3}; }
.f-input:disabled { background:${T.bgDisabled}; color:${T.fgDisabled}; border-color:${T.strokeDisabled}; }

/* === CHECKBOX === */
.f-checkbox { display:inline-flex; align-items:center; gap:8px; cursor:pointer; font-family:${FONT}; font-size:14px; color:${T.fg1}; outline:none; }
.f-checkbox:focus-visible .f-cb-box { outline:2px solid ${T.fg1}; outline-offset:2px; }
.f-cb-box { width:16px; height:16px; border:1px solid ${T.strokeAccessible}; border-radius:3px; display:flex; align-items:center; justify-content:center; transition:all var(--f-dur-fast) var(--f-curve-easy-ease); flex-shrink:0; }
.f-checkbox:hover .f-cb-box { border-color:${T.brandBg}; }
.f-checkbox.checked .f-cb-box { background:${T.brandBg}; border-color:${T.brandBg}; }
.f-checkbox.checked:hover .f-cb-box { background:${T.brandBgHover}; border-color:${T.brandBgHover}; }

/* === RADIO === */
.f-radio { display:flex; align-items:center; gap:8px; cursor:pointer; font-family:${FONT}; font-size:14px; color:${T.fg1}; padding:4px 0; outline:none; }
.f-radio-circle { width:16px; height:16px; border-radius:8px; border:1px solid ${T.strokeAccessible}; display:flex; align-items:center; justify-content:center; transition:all var(--f-dur-fast) var(--f-curve-easy-ease); flex-shrink:0; }
.f-radio:hover .f-radio-circle { border-color:${T.brandBg}; }
.f-radio.selected .f-radio-circle { border-color:${T.brandBg}; border-width:2px; }

/* === SWITCH / TOGGLE === */
.f-switch { width:40px; height:20px; border-radius:10px; background:${T.bg5}; border:1px solid ${T.strokeAccessible}; cursor:pointer; position:relative; outline:none; transition:all var(--f-dur-slow) var(--f-curve-decel-mid); padding:0; }
.f-switch:focus-visible { outline:2px solid ${T.fg1}; outline-offset:2px; }
.f-switch .f-sw-thumb { position:absolute; width:14px; height:14px; border-radius:7px; background:${T.fg1}; top:2px; left:2px; transition:all var(--f-dur-slow) var(--f-curve-decel-mid); }
.f-switch.on { background:${T.brandBg}; border-color:${T.brandBg}; }
.f-switch.on .f-sw-thumb { left:22px; background:${T.fgOnBrand}; }
.f-switch:disabled { opacity:0.38; cursor:default; }

/* === CARD === */
.f-card { border-radius:8px; background:${T.cardBg}; border:1px solid ${T.stroke2}; cursor:pointer; outline:none; transition:background var(--f-dur-fast) var(--f-curve-easy-ease), box-shadow var(--f-dur-gentle) var(--f-curve-easy-ease); overflow:hidden; }
.f-card:hover { background:${T.cardBgHover}; box-shadow:0 2px 4px ${T.shadowKey}, 0 0 2px ${T.shadowAmbient}; }
.f-card:active { background:${T.cardBgPressed}; box-shadow:none; }
.f-card:focus-visible { outline:2px solid ${T.fg1}; outline-offset:2px; }

/* === BADGE === */
.f-badge { display:inline-flex; align-items:center; justify-content:center; min-width:20px; height:20px; border-radius:10000px; padding:0 6px; font-size:12px; font-weight:600; font-family:${FONT}; }
.f-badge-brand { background:${T.brandBg}; color:${T.fgOnBrand}; }
.f-badge-danger { background:${T.dangerBg3}; color:white; }
.f-badge-success { background:${T.successBg3}; color:white; }
.f-badge-warning { background:${T.warningBg3}; color:white; }
.f-badge-subtle { background:${T.bg4}; color:${T.fg2}; }

/* === AVATAR === */
.f-avatar { width:32px; height:32px; border-radius:10000px; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:600; font-family:${FONT}; color:${T.fgOnBrand}; background:${T.brandBg}; flex-shrink:0; }
.f-avatar-sm { width:24px; height:24px; font-size:11px; }
.f-avatar-lg { width:48px; height:48px; font-size:20px; }

/* === DIVIDER === */
.f-divider { height:1px; background:${T.stroke2}; width:100%; }

/* === TOOLTIP === */
.f-tooltip-wrap { position:relative; display:inline-block; }
.f-tooltip-tip { position:absolute; bottom:calc(100% + 6px); left:50%; transform:translateX(-50%); background:${T.bgInverted}; color:${T.fgInverted}; border-radius:4px; padding:6px 10px; font-size:12px; font-family:${FONT}; white-space:nowrap; opacity:0; pointer-events:none; transition:opacity var(--f-dur-fast) var(--f-curve-decel-mid); box-shadow:0 4px 8px ${T.shadowKey}, 0 0 2px ${T.shadowAmbient}; }
.f-tooltip-wrap:hover .f-tooltip-tip { opacity:1; }

/* === DIALOG === */
.f-dialog { width:480px; max-width:90vw; border-radius:8px; background:${T.bg1}; box-shadow:0 14px 28px ${T.shadowKey}, 0 0 8px ${T.shadowAmbient}; padding:24px; font-family:${FONT}; border:1px solid ${T.stroke2}; }

/* === PROGRESS === */
.f-progress { width:100%; height:2px; border-radius:1px; background:${T.bg5}; overflow:hidden; }
.f-progress-bar { height:100%; background:${T.brandBg}; border-radius:1px; transition:width var(--f-dur-slow) var(--f-curve-easy-ease); }

/* === SPINNER === */
@keyframes f-spin { to { transform:rotate(360deg); } }
.f-spinner { width:28px; height:28px; border:3px solid ${T.bg5}; border-top-color:${T.brandBg}; border-radius:50%; animation:f-spin 0.6s linear infinite; }

/* === TAB === */
.f-tablist { display:flex; border-bottom:1px solid ${T.stroke2}; }
.f-tab { padding:10px 16px; font-size:14px; font-weight:400; font-family:${FONT}; color:${T.fg2}; background:none; border:none; border-bottom:2px solid transparent; cursor:pointer; outline:none; transition:color var(--f-dur-fast), border-color var(--f-dur-fast); }
.f-tab:hover { color:${T.fg1}; }
.f-tab.active { color:${T.brandFg1}; border-bottom-color:${T.brandBg}; font-weight:600; }
.f-tab:focus-visible { outline:2px solid ${T.fg1}; outline-offset:-2px; }

/* === SLIDER === */
.f-slider input[type=range] { -webkit-appearance:none; width:100%; height:4px; background:${T.bg5}; border-radius:2px; outline:none; cursor:pointer; }
.f-slider input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:10px; background:${T.brandBg}; border:2px solid ${T.bg1}; box-shadow:0 1px 2px ${T.shadowKey}; cursor:pointer; transition:transform var(--f-dur-fast); }
.f-slider input[type=range]::-webkit-slider-thumb:hover { transform:scale(1.15); }
.f-slider input[type=range]:focus-visible::-webkit-slider-thumb { outline:2px solid ${T.fg1}; outline-offset:2px; }

/* === MESSAGE BAR === */
.f-msgbar { display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:4px; font-family:${FONT}; font-size:14px; }
.f-msgbar-info { background:${T.brandBg2}; color:${T.brandFg2}; border:1px solid ${T.brandStroke1}40; }
.f-msgbar-success { background:${T.successBg1}; color:${T.successFg1}; }
.f-msgbar-warning { background:${T.warningBg1}; color:${T.warningFg1}; }
.f-msgbar-danger { background:${T.dangerBg1}; color:${T.dangerFg1}; }

/* === MENU === */
.f-menu { width:200px; border-radius:4px; background:${T.bg1}; box-shadow:0 4px 8px ${T.shadowKey}, 0 0 2px ${T.shadowAmbient}; padding:4px; font-family:${FONT}; border:1px solid ${T.stroke2}; }
.f-menu-item { padding:8px 10px; font-size:14px; color:${T.fg1}; cursor:pointer; border-radius:4px; transition:background var(--f-dur-faster); border:none; width:100%; text-align:left; background:transparent; font-family:${FONT}; outline:none; }
.f-menu-item:hover { background:${T.subtleBgHover}; }
.f-menu-item:active { background:${T.subtleBgPressed}; }
.f-menu-item:focus-visible { outline:2px solid ${T.fg1}; outline-offset:-2px; }

/* === LINK === */
.f-link { color:${T.brandFgLink}; text-decoration:none; font-family:${FONT}; cursor:pointer; transition:color var(--f-dur-fast); }
.f-link:hover { text-decoration:underline; color:${T.brandFg2}; }

/* === SIDEBAR NAV === */
.f-sidebar-item { display:block; width:100%; padding:8px 12px; border-radius:4px; border:none; background:transparent; cursor:pointer; font-family:${FONT}; font-size:13px; text-align:left; color:${T.fg2}; transition:background var(--f-dur-faster) var(--f-curve-easy-ease); outline:none; }
.f-sidebar-item:hover { background:${T.subtleBgHover}; color:${T.fg1}; }
.f-sidebar-item.active { background:${T.subtleBgSelected}; color:${T.brandFg1}; font-weight:600; }
`;

/* ── FLUENT ICONS (SVG inline) ── */
const FIcon = ({ name, size = 20, color }) => {
  const icons = {
    check: <path d="M4.5 12.75l6 6 9-13.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
    close: <><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></>,
    info: <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" /><path d="M12 8h.01M12 11v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>,
    warn: <><path d="M12 2L2 20h20L12 2z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" /><path d="M12 10v4M12 16.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>,
    success: <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" /><path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>,
    error: <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" /><path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>,
    person: <><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></>,
    search: <><circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" /><path d="M15 15l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></>,
    chevronDown: <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
    sun: <><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>,
    moon: <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" style={{ color: color || "currentColor", flexShrink: 0 }}>{icons[name] || null}</svg>;
};

/* ── COMPONENT DEMOS ── */
function Buttons() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <button className="f-btn f-btn-primary">Primary</button>
        <button className="f-btn f-btn-secondary">Secondary</button>
        <button className="f-btn f-btn-outline">Outline</button>
        <button className="f-btn f-btn-subtle">Subtle</button>
        <button className="f-btn f-btn-transparent">Transparent</button>
        <button className="f-btn f-btn-primary" disabled>Disabled</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <button className="f-btn f-btn-primary f-btn-sm">Small</button>
        <button className="f-btn f-btn-primary">Medium</button>
        <button className="f-btn f-btn-primary f-btn-lg">Large</button>
      </div>
    </div>
  );
}

function Inputs() {
  const [v1, setV1] = useState(""); const [v2, setV2] = useState("");
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
      <div className="f-input-wrap" style={{ width: 240 }}>
        <label className="f-input-label">Full name</label>
        <input className="f-input" value={v1} onChange={e => setV1(e.target.value)} placeholder="Enter your name" />
      </div>
      <div className="f-input-wrap" style={{ width: 240 }}>
        <label className="f-input-label">Email</label>
        <input className="f-input" value={v2} onChange={e => setV2(e.target.value)} placeholder="you@example.com" />
      </div>
      <div className="f-input-wrap" style={{ width: 240 }}>
        <label className="f-input-label" style={{ color: T.fgDisabled }}>Disabled</label>
        <input className="f-input" disabled placeholder="Cannot edit" />
      </div>
    </div>
  );
}

function Checkboxes() {
  const [checks, setChecks] = useState([true, false, false]);
  const toggle = (i) => setChecks(c => { const n = [...c]; n[i] = !n[i]; return n; });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {["Notifications", "Email updates", "SMS alerts"].map((l, i) => (
        <div key={i} className={`f-checkbox${checks[i] ? " checked" : ""}`} tabIndex={0} role="checkbox" aria-checked={checks[i]} onClick={() => toggle(i)} onKeyDown={e => e.key === " " && (e.preventDefault(), toggle(i))}>
          <div className="f-cb-box">{checks[i] && <FIcon name="check" size={12} color={T.fgOnBrand} />}</div>
          <span>{l}</span>
        </div>
      ))}
    </div>
  );
}

function Radios() {
  const [sel, setSel] = useState(0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {["Option A", "Option B", "Option C"].map((l, i) => (
        <div key={i} className={`f-radio${sel === i ? " selected" : ""}`} tabIndex={0} role="radio" aria-checked={sel === i} onClick={() => setSel(i)} onKeyDown={e => e.key === " " && setSel(i)}>
          <div className="f-radio-circle">{sel === i && <div style={{ width: 8, height: 8, borderRadius: 4, background: T.brandBg }} />}</div>
          <span>{l}</span>
        </div>
      ))}
    </div>
  );
}

function Switches() {
  const [s1, setS1] = useState(true); const [s2, setS2] = useState(false);
  return (
    <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
      {[[s1, setS1, "Wi-Fi"], [s2, setS2, "Bluetooth"]].map(([val, set, label], i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className={`f-switch${val ? " on" : ""}`} onClick={() => set(!val)} role="switch" aria-checked={val}><div className="f-sw-thumb" /></button>
          <span style={{ fontFamily: FONT, fontSize: 14, color: T.fg1 }}>{label}</span>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button className="f-switch" disabled><div className="f-sw-thumb" /></button>
        <span style={{ fontFamily: FONT, fontSize: 14, color: T.fgDisabled }}>Disabled</span>
      </div>
    </div>
  );
}

function Cards() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
      {[["Meeting notes", "Updated 2 hours ago"], ["Project plan", "Updated yesterday"], ["Design review", "Updated 3 days ago"]].map(([title, sub], i) => (
        <button key={i} className="f-card" style={{ width: 220, textAlign: "left", fontFamily: FONT }}>
          <div style={{ height: 80, background: `linear-gradient(135deg, ${T.brandBg2}, ${T.bg4})` }} />
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.fg1 }}>{title}</div>
            <div style={{ fontSize: 12, color: T.fg3, marginTop: 4 }}>{sub}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function Badges() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
      <span className="f-badge f-badge-brand">3</span>
      <span className="f-badge f-badge-danger">Error</span>
      <span className="f-badge f-badge-success">Done</span>
      <span className="f-badge f-badge-warning">Warn</span>
      <span className="f-badge f-badge-subtle">Draft</span>
      <div style={{ position: "relative", display: "inline-flex" }}>
        <div className="f-avatar"><FIcon name="person" size={18} color={T.fgOnBrand} /></div>
        <span className="f-badge f-badge-danger" style={{ position: "absolute", top: -4, right: -6, height: 16, minWidth: 16, fontSize: 10, padding: "0 4px" }}>5</span>
      </div>
    </div>
  );
}

function Avatars() {
  const initials = ["AS", "BK", "CL", "DM"];
  const colors = [T.brandBg, "#C50F1F", "#107C10", "#F7630C"];
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      {initials.map((i, idx) => (
        <div key={idx} className={`f-avatar${idx === 0 ? " f-avatar-sm" : idx === 3 ? " f-avatar-lg" : ""}`} style={{ background: colors[idx] }}>{i}</div>
      ))}
    </div>
  );
}

function Tabs() {
  const [tab, setTab] = useState(0);
  return (
    <div>
      <div className="f-tablist">
        {["Overview", "Activity", "Files", "Settings"].map((l, i) => (
          <button key={i} className={`f-tab${tab === i ? " active" : ""}`} onClick={() => setTab(i)}>{l}</button>
        ))}
      </div>
      <div style={{ padding: 16, fontSize: 14, color: T.fg2, fontFamily: FONT }}>Content for "{["Overview", "Activity", "Files", "Settings"][tab]}" tab.</div>
    </div>
  );
}

function SliderDemo() {
  const [v, setV] = useState(50);
  return (
    <div style={{ width: "100%" }}>
      <div style={{ fontFamily: FONT, fontSize: 12, color: T.fg3, marginBottom: 8 }}>Volume: {v}%</div>
      <div className="f-slider"><input type="range" min={0} max={100} value={v} onChange={e => setV(+e.target.value)} /></div>
    </div>
  );
}

function MessageBars() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
      <div className="f-msgbar f-msgbar-info"><FIcon name="info" size={18} /> This is an informational message.</div>
      <div className="f-msgbar f-msgbar-success"><FIcon name="success" size={18} /> Operation completed successfully.</div>
      <div className="f-msgbar f-msgbar-warning"><FIcon name="warn" size={18} /> Please review before continuing.</div>
      <div className="f-msgbar f-msgbar-danger"><FIcon name="error" size={18} /> An error occurred. Please try again.</div>
    </div>
  );
}

function Dialogs() {
  return (
    <div className="f-dialog">
      <div style={{ fontSize: 20, fontWeight: 600, color: T.fg1, marginBottom: 12 }}>Delete this file?</div>
      <div style={{ fontSize: 14, color: T.fg2, lineHeight: 1.5, marginBottom: 20 }}>This action cannot be undone. The file will be permanently removed from your storage.</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="f-btn f-btn-secondary">Cancel</button>
        <button className="f-btn f-btn-primary" style={{ background: T.dangerBg3 }}>Delete</button>
      </div>
    </div>
  );
}

function Menus() {
  return (
    <div className="f-menu">
      {["Cut", "Copy", "Paste", null, "Select all", "Find and replace"].map((item, i) => item === null
        ? <div key={i} className="f-divider" style={{ margin: "4px 0" }} />
        : <button key={i} className="f-menu-item">{item}</button>
      )}
    </div>
  );
}

function ProgressDemo() {
  const [v, setV] = useState(60);
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontFamily: FONT, fontSize: 12, color: T.fg3, marginBottom: 6 }}>Upload progress: {v}%</div>
        <div className="f-progress"><div className="f-progress-bar" style={{ width: `${v}%` }} /></div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="f-spinner" />
        <span style={{ fontFamily: FONT, fontSize: 14, color: T.fg2 }}>Loading...</span>
      </div>
      <input type="range" min={0} max={100} value={v} onChange={e => setV(+e.target.value)} style={{ width: 200 }} />
      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.fg1, marginBottom: 6 }}>Error State</div>
        <div style={{ height: 2, borderRadius: 1, background: "#FDE7E9" }}><div style={{ width: "40%", height: "100%", borderRadius: 1, background: T.statusDanger || "#D13438" }} /></div>
      </div>
      <div style={{ fontSize: 12, color: T.fg3, marginTop: 4 }}>States: Determinate, Indeterminate (animated), Error (danger color). Linear bar and circular spinner variants.</div>
    </div>
  );
}
function Tooltips() {
  return (
    <div style={{ display: "flex", gap: 24 }}>
      <div className="f-tooltip-wrap">
        <button className="f-btn f-btn-secondary">Hover me</button>
        <div className="f-tooltip-tip">This is a tooltip</div>
      </div>
      <div className="f-tooltip-wrap">
        <button className="f-btn f-btn-subtle">Another one</button>
        <div className="f-tooltip-tip">More information here</div>
      </div>
    </div>
  );
}

function Links() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: FONT, fontSize: 14 }}>
      <a className="f-link" href="#" onClick={e => e.preventDefault()}>Standard link</a>
      <a className="f-link" href="#" onClick={e => e.preventDefault()}>Learn more about Fluent 2</a>
      <span style={{ color: T.fg2 }}>Text with an <a className="f-link" href="#" onClick={e => e.preventDefault()}>inline link</a> inside it.</span>
    </div>
  );
}

function Dividers() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
      <div style={{ fontFamily: FONT, fontSize: 14, color: T.fg2 }}>Content above divider</div>
      <div className="f-divider" />
      <div style={{ fontFamily: FONT, fontSize: 14, color: T.fg2 }}>Content below divider</div>
      <div className="f-divider" style={{ marginLeft: 16 }} />
      <div style={{ fontFamily: FONT, fontSize: 14, color: T.fg3 }}>Inset divider above</div>
    </div>
  );
}

/* ── DESIGN LANGUAGE SECTIONS ── */

function DLIcons() {
  const cats = [
    {name:"Actions",samples:["check","close","search","edit"]},
    {name:"Arrows",samples:["chevronDown"]},
    {name:"Communication",samples:["person","info"]},
    {name:"Status",samples:["success","error","warn","info"]},
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontFamily: FONT, fontSize: 14, color: T.fg2, lineHeight: 1.6 }}>
        Fluent System Icons — 4,000+ SVG icons in Regular and Filled variants. Available via <code style={{ background: T.bg4, padding: "1px 4px", borderRadius: 2, fontSize: 12 }}>fluentui react-icons</code>. Icons tree-shake to only bundle what you import.
      </div>

      <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.fg1, marginBottom: 4 }}>Variants: Regular + Filled</div>
      <div style={{ display: "flex", gap: 24 }}>
        {["Regular (outline)","Filled (solid)"].map(v => (
          <div key={v} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {["check","close","info","error","person","search"].map(ic => (
                <FIcon key={ic} name={ic} size={22} color={T.fg1} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: T.fg2, fontFamily: FONT }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.fg1, marginTop: 8 }}>Usage Guidelines</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          ["Regular", "Default state. Use for navigation, toolbars, and most UI contexts."],
          ["Filled", "Selected/active state. Use toggle buttons: Regular when off, Filled when on."],
          ["Sizing", "Icons default to 1em. Recommended: 16px (compact), 20px (default), 24px (touch), 28/32px (illustrations)."],
          ["Color", "Inherit from parent via currentColor. Status icons use semantic colors."],
        ].map(([title, desc]) => (
          <div key={title} style={{ padding: "8px 12px", borderRadius: 4, border: `1px solid ${T.stroke2}`, background: T.bg2 }}>
            <span style={{ fontWeight: 600, fontSize: 12, color: T.fg1, fontFamily: FONT }}>{title}: </span>
            <span style={{ fontSize: 12, color: T.fg2, fontFamily: FONT }}>{desc}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, color: T.fg3, fontFamily: FONT }}>
        Install: npm i fluentui react-icons · Import: SearchRegular from fluentui/react-icons package
      </div>
    </div>
  );
}

function DLColor() {
  const neutrals = [
    ["grey[98]","#FAFAFA"],["grey[96]","#F5F5F5"],["grey[94]","#F0F0F0"],["grey[92]","#EBEBEB"],["grey[88]","#E0E0E0"],
    ["grey[82]","#D1D1D1"],["grey[74]","#BDBDBD"],["grey[62]","#9E9E9E"],["grey[50]","#808080"],["grey[38]","#616161"],
    ["grey[26]","#424242"],["grey[14]","#242424"],["grey[8]","#141414"],["grey[4]","#0A0A0A"]
  ];
  const brand = [
    ["brand[160]","#EBF3FC"],["brand[140]","#B4D6FA"],["brand[120]","#77B7F7"],["brand[100]","#479EF5"],
    ["brand[80]","#0F6CBD"],["brand[70]","#115EA3"],["brand[60]","#0F548C"],["brand[40]","#0C3B5E"],["brand[20]","#082338"],["brand[10]","#061724"]
  ];
  const status = [
    { name: "Danger", bg: "#C50F1F", fg: "#FDF3F4" },
    { name: "Success", bg: "#107C10", fg: "#F1FAF1" },
    { name: "Warning", bg: "#F7630C", fg: "#FFF9F5" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.fg1, marginBottom: 8 }}>Neutral Palette</div>
        <div style={{ fontSize: 12, color: T.fg3, fontFamily: FONT, marginBottom: 12, lineHeight: 1.5 }}>Grays that ground the interface — surfaces, text, and layout elements. Components get darker on interaction.</div>
        <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {neutrals.map(([name, hex]) => (
            <div key={name} title={`${name}: ${hex}`} style={{ width: 48, height: 48, borderRadius: 4, background: hex, border: `1px solid ${T.stroke2}`, display: "flex", alignItems: "flex-end", padding: 3 }}>
              <span style={{ fontSize: 8, color: parseInt(hex.slice(1), 16) > 0x888888 ? "#242424" : "#FFFFFF", fontFamily: "monospace" }}>{hex.slice(1, 4)}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.fg1, marginBottom: 8 }}>Brand Color Ramp</div>
        <div style={{ fontSize: 12, color: T.fg3, fontFamily: FONT, marginBottom: 12, lineHeight: 1.5 }}>Default Microsoft Blue. Used for primary actions, selected states, and brand identity. 16 shades from brand[10] to brand[160].</div>
        <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {brand.map(([name, hex]) => (
            <div key={name} title={`${name}: ${hex}`} style={{ width: 56, height: 48, borderRadius: 4, background: hex, display: "flex", alignItems: "flex-end", padding: 3 }}>
              <span style={{ fontSize: 8, color: parseInt(hex.slice(1), 16) > 0x888888 ? "#242424" : "#FFFFFF", fontFamily: "monospace" }}>{name.split("[")[1]?.replace("]","")}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.fg1, marginBottom: 8 }}>Semantic / Status Colors</div>
        <div style={{ display: "flex", gap: 8 }}>
          {status.map(s => (
            <div key={s.name} style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
              <div style={{ width: 56, height: 40, borderRadius: 4, background: s.bg }} />
              <div style={{ width: 56, height: 24, borderRadius: 4, background: s.fg, border: `1px solid ${T.stroke2}` }} />
              <span style={{ fontSize: 10, color: T.fg3, fontFamily: FONT }}>{s.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.fg1, marginBottom: 8 }}>Interaction States</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {[["Rest", T.brandBg], ["Hover", T.brandBgHover], ["Pressed", T.brandBgPressed], ["Selected", T.brandBgSelected]].map(([label, bg]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 64, height: 32, borderRadius: 4, background: bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontFamily: FONT, fontWeight: 600 }}>{label}</div>
              <span style={{ fontSize: 9, color: T.fg3, fontFamily: "monospace" }}>{bg}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: T.fg3, fontFamily: FONT, marginTop: 8 }}>Components get progressively <strong>darker</strong> as interaction deepens. Focus uses stroke, not color change.</div>
      </div>
    </div>
  );
}

function DLTypography() {
  // Official Fluent 2 type ramp — 17 named styles from @fluentui/tokens
  // Source: packages/tokens/src/global/typographyStyles.ts (microsoft/fluentui)
  // fontFamilyBase: 'Segoe UI', 'Segoe UI Web (West European)', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif
  // Naming pattern: base = Regular (400), Strong = Semibold (600), Stronger = Bold (700)
  // Subtitle 1 lh = 28px (lineHeightBase500) — NOT 26px
  const ramp = [
    // [name, cssKey, sizePx, lineHeightPx, weight]
    ["Display",            "display",          68, 92, 600],
    ["Large Title",        "largeTitle",        40, 52, 600],
    ["Title 1",            "title1",            32, 40, 600],
    ["Title 2",            "title2",            28, 36, 600],
    ["Title 3",            "title3",            24, 32, 600],
    ["Subtitle 1",         "subtitle1",         20, 28, 600],
    ["Subtitle 2 Stronger","subtitle2Stronger", 16, 22, 700],
    ["Subtitle 2",         "subtitle2",         16, 22, 600],
    ["Body 2",             "body2",             16, 22, 400],
    ["Body 1 Stronger",    "body1Stronger",     14, 20, 700],
    ["Body 1 Strong",      "body1Strong",       14, 20, 600],
    ["Body 1",             "body1",             14, 20, 400],
    ["Caption 1 Stronger", "caption1Stronger",  12, 16, 700],
    ["Caption 1 Strong",   "caption1Strong",    12, 16, 600],
    ["Caption 1",          "caption1",          12, 16, 400],
    ["Caption 2 Strong",   "caption2Strong",    10, 14, 600],
    ["Caption 2",          "caption2",          10, 14, 400],
  ];

  const weightLabel = w => w === 700 ? "Bold" : w === 600 ? "Semibold" : "Regular";
  const weightColor = w => w === 700 ? T.statusDanger || "#C50F1F" : w === 600 ? T.brandFg1 : T.fg3;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Intro */}
      <div style={{ fontSize: 12, color: T.fg3, fontFamily: FONT, lineHeight: 1.6 }}>
        17 named styles using <strong style={{ color: T.fg1 }}>fontFamilyBase</strong>. Pattern: base = Regular (400), <strong style={{ color: T.fg1 }}>Strong</strong> = Semibold (600), <strong style={{ color: T.fg1 }}>Stronger</strong> = Bold (700). All sizes in fixed px. No letter-spacing tokens defined.
      </div>

      {/* Font family tokens */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { token: "fontFamilyBase",    value: "'Segoe UI', 'Segoe UI Web (West European)', -apple-system, BlinkMacSystemFont, Roboto, sans-serif", note: "All 17 type ramp styles" },
          { token: "fontFamilyMonospace", value: "Consolas, 'Courier New', Courier, monospace",                                                       note: "Code / pre-formatted" },
          { token: "fontFamilyNumeric",   value: "Bahnschrift, 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",                      note: "Numeric / tabular data" },
        ].map(f => (
          <div key={f.token} style={{ flex: 1, minWidth: 180, padding: "8px 12px", borderRadius: 4, background: T.bg3, border: `1px solid ${T.stroke2}` }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.brandFg1, fontFamily: "monospace", marginBottom: 3 }}>{f.token}</div>
            <div style={{ fontSize: 9, color: T.fg3, fontFamily: "monospace", lineHeight: 1.5, marginBottom: 4, wordBreak: "break-all" }}>{f.value}</div>
            <div style={{ fontSize: 10, color: T.fg2, fontFamily: FONT }}>{f.note}</div>
          </div>
        ))}
      </div>

      {/* Type ramp table */}
      <div style={{ borderRadius: 6, border: `1px solid ${T.stroke2}`, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "50px 1fr 48px 60px 70px 80px", padding: "6px 12px", background: T.bg3, borderBottom: `1px solid ${T.stroke2}`, fontSize: 10, fontWeight: 600, color: T.fg2, fontFamily: FONT, gap: 8, alignItems: "center" }}>
          <span>Sample</span>
          <span>Style name</span>
          <span style={{ textAlign: "right" }}>Size</span>
          <span style={{ textAlign: "right" }}>Line Ht</span>
          <span>Weight</span>
          <span style={{ textAlign: "right" }}>CSS key</span>
        </div>
        {ramp.map(([name, key, size, lh, weight], i) => {
          const renderSize = Math.min(size, 28);
          return (
            <div key={name} style={{
              display: "grid", gridTemplateColumns: "50px 1fr 48px 60px 70px 80px",
              padding: "5px 12px", gap: 8, alignItems: "center",
              borderBottom: i < ramp.length - 1 ? `1px solid ${T.stroke3}` : "none",
              background: i % 2 === 0 ? "transparent" : `${T.bg3}60`,
            }}>
              <span style={{ fontFamily: FONT, fontSize: renderSize, fontWeight: weight, lineHeight: 1.2, color: T.fg1 }}>Ag</span>
              <span style={{ fontSize: 11, color: T.fg2, fontFamily: FONT }}>{name}</span>
              <span style={{ fontSize: 11, color: T.fg3, fontFamily: "monospace", textAlign: "right" }}>{size}px</span>
              <span style={{ fontSize: 11, color: T.fg3, fontFamily: "monospace", textAlign: "right" }}>{lh}px</span>
              <span style={{ fontSize: 10, color: weightColor(weight), fontFamily: FONT, fontWeight: weight }}>{weightLabel(weight)}</span>
              <span style={{ fontSize: 9, color: T.fg3, fontFamily: "monospace", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{key}</span>
            </div>
          );
        })}
      </div>

      {/* Weight showcase */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.fg1, fontFamily: FONT, marginBottom: 8 }}>Weight Scale — fontWeightRegular / fontWeightMedium / fontWeightSemibold / fontWeightBold</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[["Regular", 400, "body1"], ["Medium", 500, "—"], ["Semibold", 600, "body1Strong"], ["Bold", 700, "body1Stronger"]].map(([label, w, example]) => (
            <div key={label} style={{ flex: 1, minWidth: 120, padding: "10px 14px", borderRadius: 4, background: T.bg3, border: `1px solid ${T.stroke2}` }}>
              <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: w, color: T.fg1, lineHeight: 1.3 }}>Aa Bb</div>
              <div style={{ fontSize: 10, color: T.fg3, fontFamily: FONT, marginTop: 4 }}>{label} · {w}</div>
              <div style={{ fontSize: 9, color: T.brandFg1, fontFamily: "monospace", marginTop: 2 }}>{example}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DLElevation() {
  const shadows = [
    ["shadow2", "0 1px 2px rgba(0,0,0,0.14), 0 0 2px rgba(0,0,0,0.12)", "Cards, FAB pressed"],
    ["shadow4", "0 2px 4px rgba(0,0,0,0.14), 0 0 2px rgba(0,0,0,0.12)", "Cards, grid items"],
    ["shadow8", "0 4px 8px rgba(0,0,0,0.14), 0 0 2px rgba(0,0,0,0.12)", "Raised cards, command bars"],
    ["shadow16", "0 8px 16px rgba(0,0,0,0.14), 0 0 2px rgba(0,0,0,0.12)", "Dropdowns, tooltips"],
    ["shadow28", "0 14px 28px rgba(0,0,0,0.14), 0 0 8px rgba(0,0,0,0.12)", "Dialogs, modals"],
    ["shadow64", "0 32px 64px rgba(0,0,0,0.14), 0 0 8px rgba(0,0,0,0.12)", "Fullscreen overlays"],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 12, color: T.fg3, fontFamily: FONT, lineHeight: 1.5 }}>Fluent shadows combine a <strong>key shadow</strong> (sharp, directional) and an <strong>ambient shadow</strong> (soft, diffused). Named by blur pixel value.</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {shadows.map(([name, shadow, usage]) => (
          <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: 80, height: 80, borderRadius: 8, background: T.bg1, boxShadow: shadow, border: `1px solid ${T.stroke3}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.fg2, fontFamily: FONT }}>{name}</span>
            </div>
            <span style={{ fontSize: 10, color: T.fg3, fontFamily: FONT, textAlign: "center", maxWidth: 80 }}>{usage}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: T.fg3, fontFamily: FONT }}>Dark theme doubles shadow opacities. Windows uses strokes instead of key shadows.</div>
    </div>
  );
}

function DLShapes() {
  const radii = [
    ["None", 0, "Nav bars, tab bars"], ["Small", 2, "Small badges"], ["Medium", 4, "Buttons, inputs"],
    ["Large", 6, "Large buttons"], ["XLarge", 8, "Bottom sheets"], ["2XLarge", 12, "Modals, dialogs"], ["Circle", 10000, "Avatars, pills"],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.fg1, marginBottom: 8 }}>Four Fundamental Forms</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[["Rectangle", 4, "80px", "48px"], ["Circle", 10000, "48px", "48px"], ["Pill", 10000, "96px", "32px"]].map(([name, r, w, h]) => (
            <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ width: w, height: h, borderRadius: r, background: T.brandBg2, border: `1px solid ${T.brandStroke1}40` }} />
              <span style={{ fontSize: 11, color: T.fg2, fontFamily: FONT }}>{name}</span>
            </div>
          ))}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <svg width="80" height="48" viewBox="0 0 80 48"><rect x="4" y="4" width="72" height="36" rx="4" fill={T.brandBg2} stroke={T.brandStroke1+"40"} /><polygon points="40,44 34,36 46,36" fill={T.brandBg2} stroke={T.brandStroke1+"40"} strokeLinejoin="round" /></svg>
            <span style={{ fontSize: 11, color: T.fg2, fontFamily: FONT }}>Beak</span>
          </div>
        </div>
      </div>
      <div>
        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.fg1, marginBottom: 8 }}>Corner Radius Tokens</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {radii.map(([name, r, usage]) => (
            <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 48, height: 48, borderRadius: Math.min(r, 24), background: T.bg3, border: `2px solid ${T.strokeAccessible}` }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: T.fg1, fontFamily: FONT }}>{name}</span>
              <span style={{ fontSize: 9, color: T.fg3, fontFamily: "monospace" }}>{r === 10000 ? "50%" : `${r}px`}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.fg1, marginBottom: 8 }}>Stroke Thickness</div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {[["Thin", 1], ["Thick", 2], ["Thicker", 3], ["Thickest", 4]].map(([name, w]) => (
            <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 48, height: 0, borderTop: `${w}px solid ${T.strokeAccessible}` }} />
              <span style={{ fontSize: 10, color: T.fg2, fontFamily: FONT }}>{name} ({w}px)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DLSpacing() {
  const spacing = [2, 4, 6, 8, 10, 12, 16, 20, 24, 32];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 12, color: T.fg3, fontFamily: FONT, lineHeight: 1.5 }}>4px base unit. Values 2, 6, 10 exist for icon alignment. Used consistently across all components and platforms.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {spacing.map(s => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: T.fg3, fontFamily: "monospace", width: 30, textAlign: "right" }}>{s}px</span>
            <div style={{ width: s * 4, height: 16, borderRadius: 2, background: T.brandBg, opacity: 0.4 + (s / 40) }} />
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: T.fg3, fontFamily: FONT }}>Within components, smaller spacers (4–8px) ensure tight relationships. In layouts, larger spacers (16–32px) create section separation and visual rhythm.</div>
    </div>
  );
}

function DLMotion() {
  const [playing, setPlaying] = useState(false);
  const durations = [["Ultra Fast", 50], ["Faster", 100], ["Fast", 150], ["Normal", 200], ["Gentle", 250], ["Slow", 300], ["Slower", 400]];
  const easings = [
    ["Decelerate Mid", "cubic-bezier(0.1,0.9,0.2,1)", "Entries"],
    ["Accelerate Mid", "cubic-bezier(0.7,0,1,0.5)", "Exits"],
    ["Easy Ease", "cubic-bezier(0.33,0,0.67,1)", "Standard"],
    ["Linear", "linear", "Opacity fades"],
  ];

  // Trigger initial animation on mount
  useEffect(() => {
    const id = setTimeout(() => setPlaying(true), 150);
    return () => clearTimeout(id);
  }, []);

  // Replay: collapse bars to 0 instantly (transition off), then re-expand with transitions
  const replay = () => {
    setPlaying(false);
    setTimeout(() => setPlaying(true), 80);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontSize: 12, color: T.fg3, fontFamily: FONT, lineHeight: 1.5 }}>Motion should be <strong>functional</strong>, <strong>natural</strong>, <strong>consistent</strong>, and <strong>appealing</strong>. It defines relationships, provides feedback, and guides attention.</div>
      <div>
        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.fg1, marginBottom: 8 }}>Duration Scale</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {durations.map(([name, ms]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: T.fg3, fontFamily: "monospace", width: 50, textAlign: "right" }}>{ms}ms</span>
              {/* width toggles 0 → target so the CSS transition actually fires */}
              <div style={{
                width: playing ? `${ms / 2}px` : 0,
                height: 14, borderRadius: 2, background: T.brandBg,
                transition: playing ? `width ${ms}ms ease` : "none",
                opacity: 0.5 + (ms / 800),
              }} />
              <span style={{ fontSize: 11, color: T.fg2, fontFamily: FONT }}>{name}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.fg1, marginBottom: 8 }}>Easing Curves</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {easings.map(([name, curve, usage]) => (
            <div key={name} style={{ padding: "8px 12px", borderRadius: 4, background: T.bg3, border: `1px solid ${T.stroke2}`, minWidth: 140 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.fg1, fontFamily: FONT }}>{name}</div>
              <div style={{ fontSize: 10, color: T.fg3, fontFamily: "monospace", marginTop: 2 }}>{curve}</div>
              <div style={{ fontSize: 10, color: T.brandFg1, fontFamily: FONT, marginTop: 4 }}>{usage}</div>
            </div>
          ))}
        </div>
      </div>
      <button className="f-btn f-btn-outline" onClick={replay} style={{ alignSelf: "flex-start" }}>Replay Animations</button>
    </div>
  );
}

function DLAccessibility() {
  const checks = [
    { area: "Color Contrast", rule: "Standard text ≥ 4.5:1", pass: true, example: `${T.fg1} on ${T.bg1}` },
    { area: "Large Text Contrast", rule: "Large text (18.5px bold / 24px) ≥ 3:1", pass: true, example: `${T.fg2} on ${T.bg1}` },
    { area: "UI Components", rule: "Interactive elements ≥ 3:1 against adjacent", pass: true, example: `${T.strokeAccessible} on ${T.bg1}` },
    { area: "Focus Indicator", rule: "2px thick stroke, visible on all backgrounds", pass: true, example: "Inner black + outer white ring" },
    { area: "Touch Targets", rule: "≥ 44×44px (mobile), ≥ 32×32px (desktop)", pass: true, example: "Buttons, checkboxes, radios" },
    { area: "Zoom Support", rule: "Content reflows at 400% zoom (320px breakpoint)", pass: true, example: "No horizontal scrolling" },
    { area: "Text Zoom", rule: "Text zoom up to 200% without clipping", pass: true, example: "No content loss" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontSize: 12, color: T.fg3, fontFamily: FONT, lineHeight: 1.6 }}>
        Microsoft's inclusive design philosophy: <em>recognize and remedy exclusion, solve for one and extend to many, learn from diversity</em>. All Fluent components meet or surpass WCAG 2.1 AA standards.
      </div>

      {/* Checklist */}
      <div>
        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.fg1, marginBottom: 10 }}>Accessibility Checklist</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {checks.map(c => (
            <div key={c.area} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 4, background: T.bg3, border: `1px solid ${T.stroke3}` }}>
              <FIcon name="success" size={16} color={T.successFg1} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.fg1, fontFamily: FONT }}>{c.area}</div>
                <div style={{ fontSize: 11, color: T.fg3, fontFamily: FONT }}>{c.rule}</div>
              </div>
              <span style={{ fontSize: 10, color: T.fg4, fontFamily: "monospace" }}>{c.example}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Focus Management */}
      <div>
        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.fg1, marginBottom: 8 }}>Focus Management</div>
        <div style={{ fontSize: 12, color: T.fg3, fontFamily: FONT, lineHeight: 1.5, marginBottom: 10 }}>
          Focus follows a "Z" pattern: left to right, top to bottom. Focus must never be "lost" after closing a dialog or temporary UI — it returns to the trigger element.
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="f-btn f-btn-secondary">Tab to me</button>
          <button className="f-btn f-btn-secondary">Then me</button>
          <button className="f-btn f-btn-primary">Then me</button>
        </div>
        <div style={{ fontSize: 11, color: T.fg3, fontFamily: FONT, marginTop: 6 }}>Try pressing Tab — the 2px focus ring appears without changing the button's color. This distinguishes keyboard from mouse interaction.</div>
      </div>

      {/* Contrast Demo */}
      <div>
        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.fg1, marginBottom: 8 }}>Color Contrast</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { bg: T.bg1, fg: T.fg1, label: "FG1 on BG1", ratio: "14.5:1" },
            { bg: T.bg1, fg: T.fg2, label: "FG2 on BG1", ratio: "8.5:1" },
            { bg: T.bg1, fg: T.fg3, label: "FG3 on BG1", ratio: "4.6:1" },
            { bg: T.brandBg, fg: T.fgOnBrand, label: "On Brand", ratio: "4.8:1" },
            { bg: T.bg1, fg: T.fgDisabled, label: "Disabled", ratio: "1.9:1" },
          ].map(c => (
            <div key={c.label} style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
              <div style={{ width: 80, height: 40, borderRadius: 4, background: c.bg, border: `1px solid ${T.stroke2}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: c.fg, fontSize: 12, fontWeight: 600, fontFamily: FONT }}>Aa</span>
              </div>
              <span style={{ fontSize: 10, color: T.fg2, fontFamily: FONT }}>{c.label}</span>
              <span style={{ fontSize: 9, color: parseFloat(c.ratio) >= 4.5 ? T.successFg1 : parseFloat(c.ratio) >= 3 ? T.warningFg1 : T.dangerFg1, fontFamily: "monospace", fontWeight: 600 }}>{c.ratio} {parseFloat(c.ratio) >= 4.5 ? "✓ AA" : parseFloat(c.ratio) >= 3 ? "~ Large" : "✗ Fail"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Keyboard Patterns */}
      <div>
        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.fg1, marginBottom: 8 }}>Keyboard Patterns</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            ["Tab / Shift+Tab", "Move focus between interactive elements"],
            ["Enter / Space", "Activate buttons, toggle checkboxes/switches"],
            ["Arrow keys", "Navigate within radio groups, tabs, menus"],
            ["Escape", "Close dialogs, menus, popups — return focus to trigger"],
            ["Home / End", "Jump to first/last item in a list or menu"],
          ].map(([key, desc]) => (
            <div key={key} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: `1px solid ${T.stroke3}` }}>
              <code style={{ fontSize: 11, background: T.bg4, padding: "2px 6px", borderRadius: 3, fontFamily: "monospace", color: T.fg1, whiteSpace: "nowrap", flexShrink: 0 }}>{key}</code>
              <span style={{ fontSize: 12, color: T.fg2, fontFamily: FONT }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ARIA & Semantics */}
      <div>
        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.fg1, marginBottom: 8 }}>Semantic HTML & ARIA</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            ["Use semantic HTML elements", "button not div, input not span, nav, main, header, footer"],
            ["Add ARIA roles when needed", 'role="checkbox", role="switch", role="tablist", role="dialog"'],
            ["Provide accessible labels", "aria-label, aria-labelledby, or visible <label> for every input"],
            ["Communicate state", "aria-checked, aria-selected, aria-expanded, aria-disabled"],
            ["Alt text for images", "Descriptive alt text for informative images, empty alt for decorative"],
            ["Live regions for updates", 'aria-live="polite" for status messages, "assertive" for errors'],
          ].map(([title, detail]) => (
            <div key={title} style={{ padding: "8px 12px", borderRadius: 4, background: T.bg3, border: `1px solid ${T.stroke3}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.fg1, fontFamily: FONT }}>{title}</div>
              <div style={{ fontSize: 11, color: T.fg3, fontFamily: "monospace", marginTop: 2 }}>{detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* High Contrast */}
      <div>
        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.fg1, marginBottom: 8 }}>High Contrast Mode</div>
        <div style={{ fontSize: 12, color: T.fg3, fontFamily: FONT, lineHeight: 1.5 }}>
          Windows High Contrast Mode overrides all colors with system colors. Use the <code style={{ background: T.bg4, padding: "1px 4px", borderRadius: 2, fontSize: 11 }}>forced-colors: active</code> media query to ensure components remain visible and functional. Never rely solely on color to convey meaning — always pair with text, icons, or borders.
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <div style={{ padding: "8px 16px", borderRadius: 4, background: "#000", color: "#FFFFFF", border: "2px solid #FFFFFF", fontSize: 12, fontFamily: FONT, fontWeight: 600 }}>HC Button</div>
          <div style={{ padding: "8px 16px", borderRadius: 4, background: "#000", color: "#FFFF00", border: "2px solid #FFFF00", fontSize: 12, fontFamily: FONT, fontWeight: 600 }}>HC Link</div>
          <div style={{ padding: "8px 16px", borderRadius: 4, background: "#1AEBFF", color: "#000", fontSize: 12, fontFamily: FONT, fontWeight: 600 }}>HC Selected</div>
        </div>
      </div>

      {/* Resources */}
      <div>
        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.fg1, marginBottom: 6 }}>Resources</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            ["WCAG 2.1 Techniques", "w3.org/WAI/WCAG21/Techniques/"],
            ["WAI-ARIA Authoring Practices", "w3.org/WAI/ARIA/apg/"],
            ["Microsoft Inclusive Design", "inclusive.microsoft.design"],
            ["A11y Focus Order (Figma Plugin)", "figma.com/community/plugin/731310036968334777"],
          ].map(([name, url]) => (
            <a key={name} className="f-link" href={`https://${url}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>{name} →</a>
          ))}
        </div>
      </div>
    </div>
  );
}

function DLDensity() {
  const sizes = [
    { name: "Small", h: 24, pad: 8, fs: 12, usage: "High-density data tables, toolbars, dense dashboards" },
    { name: "Medium", h: 32, pad: 12, fs: 14, usage: "Default for most UI — balanced density and comfort" },
    { name: "Large", h: 40, pad: 16, fs: 14, usage: "Touch-friendly, onboarding flows, marketing CTAs" },
  ];
  const components = [
    ["Button", 24, 32, 40],
    ["Input / Combobox", 24, 32, 40],
    ["Checkbox box", 12, 16, 16],
    ["Radio circle", 12, 16, 16],
    ["Badge", 12, 20, 28],
    ["Tab", 28, 36, 44],
    ["Menu item", 24, 32, 40],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontSize: 12, color: T.fg3, fontFamily: FONT, lineHeight: 1.6 }}>
        Fluent 2 uses <strong>component size variants</strong> (Small / Medium / Large) rather than a global numeric density scale. Each size adjusts height, padding, and sometimes font size — but icon sizes, horizontal gaps, and font weight stay consistent. Use the <strong>S · M · L</strong> toggle in the sidebar to see all components resize live.
      </div>

      {/* Size comparison */}
      <div>
        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.fg1, marginBottom: 10 }}>Size Variants</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {sizes.map(s => (
            <div key={s.name} style={{ flex: 1, minWidth: 160, padding: 12, borderRadius: 6, background: T.bg3, border: `1px solid ${T.stroke2}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 32, height: s.h, borderRadius: 4, background: T.brandBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: T.fgOnBrand, fontSize: 10, fontWeight: 600, fontFamily: FONT }}>{s.name[0]}</span>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.fg1, fontFamily: FONT }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: T.fg3, fontFamily: "monospace" }}>{s.h}px height</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: T.fg2, fontFamily: FONT, lineHeight: 1.4 }}>{s.usage}</div>
              <div style={{ fontSize: 10, color: T.fg4, fontFamily: "monospace", marginTop: 6 }}>padding: 0 {s.pad}px · font: {s.fs}px</div>
            </div>
          ))}
        </div>
      </div>

      {/* Component height table */}
      <div>
        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.fg1, marginBottom: 8 }}>Component Heights by Size</div>
        <div style={{ borderRadius: 4, border: `1px solid ${T.stroke2}`, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 60px", background: T.bg3, padding: "8px 12px", gap: 8, fontSize: 11, fontWeight: 600, color: T.fg2, fontFamily: FONT }}>
            <span>Component</span><span style={{ textAlign: "center" }}>Small</span><span style={{ textAlign: "center" }}>Medium</span><span style={{ textAlign: "center" }}>Large</span>
          </div>
          {components.map(([name, sm, md, lg]) => (
            <div key={name} style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 60px", padding: "6px 12px", gap: 8, fontSize: 12, color: T.fg1, fontFamily: FONT, borderTop: `1px solid ${T.stroke3}` }}>
              <span>{name}</span>
              <span style={{ textAlign: "center", fontFamily: "monospace", fontSize: 11 }}>{sm}px</span>
              <span style={{ textAlign: "center", fontFamily: "monospace", fontSize: 11, fontWeight: 600, color: T.brandFg1 }}>{md}px</span>
              <span style={{ textAlign: "center", fontFamily: "monospace", fontSize: 11 }}>{lg}px</span>
            </div>
          ))}
        </div>
      </div>

      {/* What changes */}
      <div>
        <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: T.fg1, marginBottom: 8 }}>What Changes vs. What Stays</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ padding: 12, borderRadius: 4, background: T.successBg1, border: `1px solid ${T.successFg1}30` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.successFg1, fontFamily: FONT, marginBottom: 6 }}>✓ Changes with size</div>
            <div style={{ fontSize: 11, color: T.fg2, fontFamily: FONT, lineHeight: 1.5 }}>
              Component height<br/>Vertical padding<br/>Font size (Small uses 12px)<br/>Badge dimensions<br/>Touch target area
            </div>
          </div>
          <div style={{ padding: 12, borderRadius: 4, background: T.bg3, border: `1px solid ${T.stroke2}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.fg2, fontFamily: FONT, marginBottom: 6 }}>✗ Stays constant</div>
            <div style={{ fontSize: 11, color: T.fg3, fontFamily: FONT, lineHeight: 1.5 }}>
              Icon size (20px)<br/>Horizontal gaps<br/>Font weight<br/>Border radius<br/>Colors & elevation
            </div>
          </div>
        </div>
      </div>

      {/* Windows density note */}
      <div style={{ padding: 10, borderRadius: 4, background: T.brandBg2, border: `1px solid ${T.brandStroke1}30`, fontSize: 12, color: T.brandFg2, fontFamily: FONT, lineHeight: 1.5 }}>
        <strong>Windows note:</strong> WinUI uses "Standard" (40×40 epx grid) and "Compact" density resource dictionaries. Compact reduces vertical margins by ~25%. On web, use the Small/Medium/Large size props on each component.
      </div>
    </div>
  );
}

function FluentContentDesign() {
  const tips = [
    { title: "Keep it simple", desc: "Use plain language. Short sentences and fragments are easier to scan.", do: "Turn on notifications", dont: "You can enable the notification feature in your account settings" },
    { title: "Get to the point fast", desc: "Make choices and next steps obvious. Prune every excess word.", do: "3 files deleted", dont: "The 3 files you selected have been successfully deleted from your storage" },
    { title: "Talk like a person", desc: "Write informally, conversationally — like you're talking one-on-one.", do: "Something went wrong. Try again.", dont: "An unexpected error has occurred. Please retry the operation." },
  ];
  const rules = [
    ["Present tense", "\"File uploads\" not \"File will upload\""],
    ["Active voice", "\"You saved the file\" not \"The file was saved\""],
    ["Second person", "\"Your files\" — avoid \"I\", \"we\", \"us\""],
    ["Sentence case", "Capitalize only first word + proper nouns"],
    ["No exclamation marks", "Use only for celebrations. Don't shout."],
    ["Minimal punctuation", "Skip periods on buttons, labels, headers"],
    ["No directional terms", "Avoid \"above\", \"below\", \"right\", \"left\""],
    ["Descriptive link text", "\"Learn more about pricing\" not \"Click here\""],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: FONT }}>
      <div style={{ fontSize: 12, color: T.fg3, lineHeight: 1.6 }}>
        Content design is thinking about how to give your audience the information they need when they need it. Words are a design material — as essential as color or iconography.
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: T.fg1, marginBottom: 10 }}>Writing Principles</div>
        {tips.map(t => (
          <div key={t.title} style={{ borderRadius: 6, border: `1px solid ${T.stroke2}`, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ padding: "10px 14px", background: T.bg3 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.fg1 }}>{t.title}</div>
              <div style={{ fontSize: 11, color: T.fg3, marginTop: 2 }}>{t.desc}</div>
            </div>
            <div style={{ display: "flex" }}>
              <div style={{ flex: 1, padding: "8px 14px", borderRight: `1px solid ${T.stroke3}` }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: T.successFg1, textTransform: "uppercase", marginBottom: 3 }}>✓ Do</div>
                <div style={{ fontSize: 12, color: T.fg1 }}>{t.do}</div>
              </div>
              <div style={{ flex: 1, padding: "8px 14px" }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: T.dangerFg1, textTransform: "uppercase", marginBottom: 3 }}>✗ Don't</div>
                <div style={{ fontSize: 12, color: T.fg1 }}>{t.dont}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: T.fg1, marginBottom: 8 }}>Style Rules</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {rules.map(([rule, ex]) => (
            <div key={rule} style={{ display: "flex", gap: 10, padding: "5px 0", borderBottom: `1px solid ${T.stroke3}` }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.fg1, minWidth: 140, flexShrink: 0 }}>{rule}</span>
              <span style={{ fontSize: 12, color: T.fg3 }}>{ex}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: 10, borderRadius: 6, background: T.brandBg2, border: `1px solid ${T.brandStroke1}30`, fontSize: 12, color: T.brandFg2, lineHeight: 1.5 }}>
        <strong>Platform note:</strong> Windows, Android, and web use <strong>sentence case</strong>. iOS and macOS use <strong>title case</strong>. Adapt capitalization to the platform.
      </div>
    </div>
  );
}

/* ── COMPONENT REGISTRY ── */
const CATS = ["Foundations", "Components & Patterns", "Patterns"];
const COMPS = [
  // Design Language
  { id: "dl-icons", name: "Iconography", cat: "Foundations", desc: "Fluent System Icons — 4,000+ SVG icons in Regular and Filled variants. Tree-shakeable via fluentui react-icons.", render: DLIcons },
  { id: "dl-color", name: "Color", cat: "Foundations", desc: "Three palettes — Neutral (grays), Brand (blue), and Shared/Status (semantic). Components darken on interaction. Focus uses stroke, not color.", render: DLColor },
  { id: "dl-typography", name: "Typography", cat: "Foundations", desc: "Segoe UI type ramp with 16 styles. Clear semantic roles from Caption to Display. Regular and Semibold weights create hierarchy.", render: DLTypography },
  { id: "dl-elevation", name: "Elevation", cat: "Foundations", desc: "Six shadow levels (shadow2–64) using key + ambient dual shadows. Dark theme doubles opacity. Windows uses strokes instead.", render: DLElevation },
  { id: "dl-shapes", name: "Shapes", cat: "Foundations", desc: "Four forms (Rectangle, Circle, Pill, Beak). Corner radius from None (0) to Circle (50%). Stroke thickness tokens (1–4px).", render: DLShapes },
  { id: "dl-spacing", name: "Spacing", cat: "Foundations", desc: "4px base unit with ramp (2–32px). Values 2, 6, 10 for icon alignment. Consistent across all components and platforms.", render: DLSpacing },
  { id: "dl-motion", name: "Motion", cat: "Foundations", desc: "Duration tokens (50–400ms). Easing curves for entries (decelerate), exits (accelerate), and standard (easy ease).", render: DLMotion },
  // Foundations
  { id: "dl-a11y", name: "Accessibility", cat: "Foundations", desc: "WCAG 2.1 AA compliance. Contrast checklist, focus management, keyboard patterns, ARIA semantics, High Contrast Mode support.", render: DLAccessibility },
  { id: "dl-density", name: "Density & Size", cat: "Foundations", desc: "Component size variants (Small 24px / Medium 32px / Large 40px). Height, padding, and font adjust — icons, gaps, and colors stay constant.", render: DLDensity },
  { id: "dl-content", name: "Content Design", cat: "Foundations", desc: "UX writing principles: simple, direct, human. Style rules for tense, voice, capitalization, punctuation, and accessibility.", render: FluentContentDesign },
  { id: "tokens", name: "Tokens", cat: "Foundations", desc: "Token reference for all design tokens — colors, spacing, typography, and elevation with contrast ratios.", render: () => null },
  { id: "audit", name: "Design Audit", cat: "Foundations", desc: "Paste code to audit for raw hex values, wrong APIs, accessibility issues, and dark mode compliance.", render: () => null },
  // Patterns
  { id: "pat-dashboard", name: "Analytical Dashboard", cat: "Patterns", desc: "Stat cards, charts, and data tables composed into an analytics overview.", render: function(){
    return <div style={{display:"flex",flexDirection:"column",gap:12,fontFamily:FONT}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {[{l:"Revenue",v:"$42.8K",p:60},{l:"Users",v:"1,247",p:75},{l:"Growth",v:"+18%",p:90}].map(s=>
          <div key={s.l} style={{background:T.bg1,border:`1px solid ${T.stroke2}`,borderRadius:4,padding:10}}>
            <div style={{fontSize:10,color:T.fg3}}>{s.l}</div>
            <div style={{fontSize:16,fontWeight:600,color:T.fg1}}>{s.v}</div>
            <div style={{height:3,borderRadius:2,background:T.stroke2,marginTop:6}}><div style={{width:`${s.p}%`,height:"100%",borderRadius:2,background:T.brandBg}}/></div>
          </div>
        )}
      </div>
      <div style={{fontSize:10,color:T.fg3}}>Dashboard pattern: stat cards + charts + data tables.</div>
    </div>;
  }},
  { id: "pat-form", name: "Forms", cat: "Patterns", desc: "Input fields, validation, and button bar composed into a data entry form.", render: function(){
    return <div style={{display:"flex",flexDirection:"column",gap:10,fontFamily:FONT,maxWidth:320}}>
      <div><label style={{fontSize:12,fontWeight:600,color:T.fg1}}>Full Name *</label><div className="f-input" style={{marginTop:4}}>Jane Doe</div></div>
      <div><label style={{fontSize:12,fontWeight:600,color:T.fg1}}>Email *</label><div className="f-input" style={{marginTop:4}}>jane@company.com</div></div>
      <div style={{display:"flex",gap:8,marginTop:4}}><button className="f-btn f-btn-primary">Submit</button><button className="f-btn f-btn-secondary">Cancel</button></div>
    </div>;
  }},
  { id: "pat-list-detail", name: "List-Detail", cat: "Patterns", desc: "Master list alongside detail pane for email, files, or settings.", render: function(){
    const [sel,setSel]=useState(0);
    const items=[{t:"Dashboard Report",d:"Q4 revenue analysis"},{t:"User Metrics",d:"Monthly active users"},{t:"System Alerts",d:"Health monitoring"}];
    return <div style={{display:"flex",border:`1px solid ${T.stroke2}`,borderRadius:4,overflow:"hidden",height:160,fontFamily:FONT}}>
      <div style={{width:150,background:T.bg2,borderRight:`1px solid ${T.stroke2}`}}>
        {items.map((it,i)=><div key={i} onClick={()=>setSel(i)} style={{padding:"8px 12px",fontSize:12,cursor:"pointer",background:sel===i?T.subtleBgSelected:"transparent",color:sel===i?T.brandFg1:T.fg1,fontWeight:sel===i?600:400}}>{it.t}</div>)}
      </div>
      <div style={{flex:1,padding:12}}><div style={{fontSize:14,fontWeight:600,color:T.fg1}}>{items[sel].t}</div><div style={{fontSize:12,color:T.fg3,marginTop:4}}>{items[sel].d}</div></div>
    </div>;
  }},
  { id: "pat-app-shell", name: "App Shell", cat: "Patterns", desc: "Header, nav sidebar, content area, and footer in a Fluent application layout.", render: function(){
    return <div style={{border:`1px solid ${T.stroke2}`,borderRadius:4,overflow:"hidden",fontFamily:FONT,fontSize:11}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 12px",background:T.bg2,borderBottom:`1px solid ${T.stroke2}`}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:20,height:20,borderRadius:4,background:T.brandBg,display:"flex",alignItems:"center",justifyContent:"center",color:T.fgOnBrand,fontSize:9,fontWeight:600}}>A</div><span style={{fontWeight:600,color:T.fg1}}>App Name</span></div>
        <div style={{width:20,height:20,borderRadius:10,background:T.bg4}}/>
      </div>
      <div style={{display:"flex",height:90}}>
        <div style={{width:44,background:T.bg2,borderRight:`1px solid ${T.stroke2}`,display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"6px 0"}}>
          {["home","dashboard","settings"].map((i,idx)=><div key={i} style={{width:32,height:24,borderRadius:4,background:idx===0?T.subtleBgSelected:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}><span className="material-symbols-outlined" style={{fontSize:14,color:idx===0?T.brandFg1:T.fg3}}>{i}</span></div>)}
        </div>
        <div style={{flex:1,padding:8,display:"flex",alignItems:"center",justifyContent:"center",color:T.fg3}}>Main Content</div>
      </div>
      <div style={{padding:"3px 12px",borderTop:`1px solid ${T.stroke2}`,background:T.bg2,fontSize:9,color:T.fg3}}>Footer · v1.0</div>
    </div>;
  }},
  { id: "pat-login", name: "Login / Auth", cat: "Patterns", desc: "Authentication form with brand header, inputs, and primary button.", render: function(){
    return <div style={{maxWidth:260,margin:"0 auto",fontFamily:FONT}}>
      <div style={{textAlign:"center",marginBottom:12}}>
        <div style={{width:40,height:40,borderRadius:4,background:T.brandBg,display:"inline-flex",alignItems:"center",justifyContent:"center",color:T.fgOnBrand,fontSize:18,fontWeight:600,marginBottom:6}}>A</div>
        <div style={{fontSize:16,fontWeight:600,color:T.fg1}}>Welcome back</div>
        <div style={{fontSize:12,color:T.fg3}}>Sign in to your account</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <div className="f-input" style={{fontSize:12}}>Email</div>
        <div className="f-input" style={{fontSize:12}}>Password</div>
        <button className="f-btn f-btn-primary" style={{width:"100%",marginTop:4}}>Sign In</button>
      </div>
    </div>;
  }},
  { id: "pat-settings", name: "Settings Page", cat: "Patterns", desc: "Navigation list with form sections for application preferences.", render: function(){
    const [tab,setTab]=useState(0);
    const tabs=["General","Security","Notifications"];
    return <div style={{display:"flex",border:`1px solid ${T.stroke2}`,borderRadius:4,overflow:"hidden",height:150,fontFamily:FONT}}>
      <div style={{width:120,background:T.bg2,borderRight:`1px solid ${T.stroke2}`,padding:4}}>
        {tabs.map((t,i)=><div key={t} onClick={()=>setTab(i)} style={{padding:"6px 10px",fontSize:12,cursor:"pointer",borderRadius:4,background:tab===i?T.subtleBgSelected:"transparent",color:tab===i?T.brandFg1:T.fg2,fontWeight:tab===i?600:400,marginBottom:2}}>{t}</div>)}
      </div>
      <div style={{flex:1,padding:12}}>
        <div style={{fontSize:14,fontWeight:600,color:T.fg1,marginBottom:8}}>{tabs[tab]}</div>
        <div className="f-input" style={{marginBottom:6,fontSize:11}}>Display Name</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontSize:11,color:T.fg2}}>Dark Mode</span><div style={{width:28,height:14,borderRadius:7,background:T.brandBg,cursor:"pointer",position:"relative"}}><div style={{width:10,height:10,borderRadius:5,background:T.fgOnBrand,position:"absolute",top:2,right:2}}/></div></div>
      </div>
    </div>;
  }},
  { id: "pat-search", name: "Search Results", cat: "Patterns", desc: "Searchbox with filterable result cards and pagination.", render: function(){
    return <div style={{display:"flex",flexDirection:"column",gap:8,fontFamily:FONT}}>
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",border:`1px solid ${T.stroke2}`,borderRadius:4,background:T.bg1}}>
        <span className="material-symbols-outlined" style={{fontSize:16,color:T.fg3}}>search</span>
        <span style={{fontSize:12,color:T.fg3}}>Search components...</span>
      </div>
      <div style={{display:"flex",gap:4}}>
        {["All","Actions","Inputs","Navigation"].map((f,i)=><button key={f} className={`f-btn ${i===0?"f-btn-primary":"f-btn-secondary"}`} style={{fontSize:10,padding:"2px 8px",height:24,minWidth:0}}>{f}</button>)}
      </div>
      {[{t:"Button",d:"Primary, Default, Outline, Subtle"},{t:"Input",d:"Underline accent on focus"},{t:"Tabs",d:"Underline active indicator"}].map(r=>
        <div key={r.t} style={{padding:8,border:`1px solid ${T.stroke2}`,borderRadius:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:12,fontWeight:600,color:T.fg1}}>{r.t}</div><div style={{fontSize:10,color:T.fg3}}>{r.d}</div></div>
          <span className="material-symbols-outlined" style={{fontSize:14,color:T.fg3}}>chevron_right</span>
        </div>
      )}
    </div>;
  }},
  { id: "pat-wizard", name: "Wizard / Stepper", cat: "Patterns", desc: "Multi-step form with progress steps and validation.", render: function(){
    const [step,setStep]=useState(1);
    return <div style={{fontFamily:FONT}}>
      <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:12}}>
        {["Account","Profile","Review"].map((s,i)=><React.Fragment key={s}>
          {i>0&&<div style={{flex:1,height:2,background:i<=step?T.brandBg:T.stroke2}}/>}
          <div onClick={()=>setStep(i)} style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer"}}>
            <div style={{width:22,height:22,borderRadius:11,background:i<=step?T.brandBg:T.stroke2,color:i<=step?T.fgOnBrand:T.fg3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:600}}>{i<step?"✓":i+1}</div>
            <span style={{fontSize:11,color:i===step?T.fg1:T.fg3,fontWeight:i===step?600:400}}>{s}</span>
          </div>
        </React.Fragment>)}
      </div>
      <div style={{border:`1px solid ${T.stroke2}`,borderRadius:4,padding:12,minHeight:50}}>
        <div style={{fontSize:13,fontWeight:600,color:T.fg1,marginBottom:4}}>Step {step+1}: {["Account","Profile","Review"][step]}</div>
        <div style={{fontSize:11,color:T.fg3}}>{step===2?"Review your information.":"Enter your details."}</div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
        <button className="f-btn f-btn-secondary" onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0} style={{opacity:step===0?0.3:1}}>Back</button>
        <button className="f-btn f-btn-primary" onClick={()=>setStep(Math.min(2,step+1))}>{step===2?"Submit":"Next"}</button>
      </div>
    </div>;
  }},
  { id: "pat-data-table", name: "Data Table Page", cat: "Patterns", desc: "Filter bar, sortable data grid, and pagination for tabular data views.", render: function(){
    const cols=["Name","Status","Amount","Date"];
    const rows=[["Jane Doe","Active","$1,200","Apr 12"],["John Smith","Pending","$890","Apr 11"],["Alice Chen","Active","$2,340","Apr 10"]];
    return <div style={{fontFamily:FONT}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{display:"flex",gap:4}}>
          <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",border:`1px solid ${T.stroke2}`,borderRadius:4,fontSize:11,color:T.fg3}}><span className="material-symbols-outlined" style={{fontSize:14}}>filter_list</span>Filter</div>
          <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",border:`1px solid ${T.stroke2}`,borderRadius:4,fontSize:11,color:T.fg3}}><span className="material-symbols-outlined" style={{fontSize:14}}>search</span>Search</div>
        </div>
        <button className="f-btn f-btn-primary" style={{fontSize:11,padding:"2px 10px",height:28,minWidth:0}}>Export</button>
      </div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,border:`1px solid ${T.stroke2}`,borderRadius:4}}>
        <thead><tr>{cols.map(c=><th key={c} style={{textAlign:"left",padding:"8px 10px",borderBottom:`1px solid ${T.stroke2}`,color:T.fg2,fontWeight:600,fontSize:11}}>{c}</th>)}</tr></thead>
        <tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j} style={{padding:"8px 10px",borderBottom:`1px solid ${T.stroke2}`,color:j===1?(c==="Active"?(T.successFg1||"#107C10"):(T.warningFg1||"#C19C00")):T.fg1,fontWeight:j===1?600:400}}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>;
  }},
  { id: "charts", name: "Charts & Dataviz", cat: "Patterns", desc: "12 chart types: line, area, column, pie, scatter, bar, donut, spline, stacked column, gauge, heatmap, treemap.", render: () => null },
  { id: "ag-grid", name: "AG Grid", cat: "Components & Patterns", desc: "AG Grid data table themed with Fluent 2 tokens. Sorting, filtering, pagination, row selection.", render: () => null },
  { id: "buttons", name: "Buttons", cat: "Components & Patterns", desc: "Primary, Secondary, Outline, Subtle, Transparent variants in 3 sizes. Hover darkens background.", render: Buttons },
  { id: "inputs", name: "Text Input", cat: "Components & Patterns", desc: "Labeled text input with bottom-border accent on focus. Fluent's signature underline pattern.", render: Inputs },
  { id: "checkboxes", name: "Checkbox", cat: "Components & Patterns", desc: "Click to toggle. Brand-colored fill when checked. Hover shows brand border.", render: Checkboxes },
  { id: "radios", name: "Radio Group", cat: "Components & Patterns", desc: "Single selection. Fluent inner dot pattern with brand border.", render: Radios },
  { id: "switches", name: "Switch", cat: "Components & Patterns", desc: "Toggle on/off. Brand fill when on, thumb slides with decelerate easing.", render: Switches },
  { id: "slider", name: "Slider", cat: "Components & Patterns", desc: "Drag thumb to select a value. Brand-colored thumb with hover scale.", render: SliderDemo },
  { id: "cards", name: "Cards", cat: "Components & Patterns", desc: "Hover lifts with shadow. Background shifts lighter. Subtle stroke border.", render: Cards },
  { id: "badges", name: "Badges", cat: "Components & Patterns", desc: "Brand, danger, success, warning, subtle variants. Pill-shaped counters.", render: Badges },
  { id: "avatars", name: "Avatars", cat: "Components & Patterns", desc: "Circular initials in 3 sizes (24/32/48). Customizable background colors.", render: Avatars },
  { id: "tabs", name: "Tabs", cat: "Components & Patterns", desc: "Underline-style tabs. Active tab shows brand underline and semibold weight.", render: Tabs },
  { id: "messagebars", name: "Message Bars", cat: "Components & Patterns", desc: "Info, success, warning, danger. Semantic backgrounds with status icons.", render: MessageBars },
  { id: "dialogs", name: "Dialog", cat: "Components & Patterns", desc: "Modal with shadow28 elevation. Title, body, action buttons. 8px radius.", render: Dialogs },
  { id: "menus", name: "Menu", cat: "Components & Patterns", desc: "Dropdown menu with subtle hover. Dividers separate sections. 4px radius.", render: Menus },
  { id: "progress", name: "Progress", cat: "Components & Patterns", desc: "Linear progress bar (2px) and circular spinner. Brand-colored.", render: ProgressDemo },
  { id: "tooltips", name: "Tooltips", cat: "Components & Patterns", desc: "Hover-triggered popover. Inverted background. Fade-in with decelerate easing.", render: Tooltips },
  { id: "links", name: "Links", cat: "Components & Patterns", desc: "Brand-colored text links. Underline on hover. Darker on press.", render: Links },
  { id: "dividers", name: "Dividers", cat: "Components & Patterns", desc: "1px stroke2 line. Optional inset for grouped content.", render: Dividers },
];

/* ── MINI PREVIEWS for landing page cards ── */
const PREVIEWS = {
  "dl-color": () => (
    <div style={{ display: "flex", gap: 2, padding: "8px 0" }}>
      {["#EBF3FC","#B4D6FA","#77B7F7","#479EF5","#0F6CBD","#115EA3","#0C3B5E"].map(c => <div key={c} style={{ width: 16, height: 16, borderRadius: 3, background: c }} />)}
    </div>
  ),
  "dl-typography": () => (
    <div style={{ fontFamily: FONT, padding: "6px 0", display: "flex", flexDirection: "column", gap: 1 }}>
      <span style={{ fontSize: 18, fontWeight: 600, color: T.fg1, lineHeight: 1 }}>Title</span>
      <span style={{ fontSize: 12, color: T.fg2 }}>Body text</span>
      <span style={{ fontSize: 9, color: T.fg3 }}>Caption</span>
    </div>
  ),
  "dl-elevation": () => (
    <div style={{ display: "flex", gap: 6, padding: "8px 0", alignItems: "flex-end" }}>
      {[2, 8, 28].map(s => <div key={s} style={{ width: 28, height: 20 + s / 2, borderRadius: 4, background: T.bg1, boxShadow: `0 ${s / 2}px ${s}px rgba(0,0,0,0.14), 0 0 2px rgba(0,0,0,0.12)`, border: `1px solid ${T.stroke3}` }} />)}
    </div>
  ),
  "dl-shapes": () => (
    <div style={{ display: "flex", gap: 6, padding: "8px 0", alignItems: "center" }}>
      <div style={{ width: 24, height: 18, borderRadius: 3, background: T.brandBg2, border: `1px solid ${T.brandStroke1}40` }} />
      <div style={{ width: 20, height: 20, borderRadius: 10, background: T.brandBg2, border: `1px solid ${T.brandStroke1}40` }} />
      <div style={{ width: 32, height: 14, borderRadius: 7, background: T.brandBg2, border: `1px solid ${T.brandStroke1}40` }} />
    </div>
  ),
  "dl-spacing": () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "8px 0" }}>
      {[4, 8, 16, 24].map(s => <div key={s} style={{ width: s * 3, height: 6, borderRadius: 1, background: T.brandBg, opacity: 0.3 + s / 30 }} />)}
    </div>
  ),
  "dl-motion": () => (
    <div style={{ display: "flex", gap: 4, padding: "8px 0", alignItems: "center" }}>
      {[50, 150, 300].map(d => <div key={d} style={{ width: 20, height: 14, borderRadius: 2, background: T.brandBg, opacity: 0.4 + d / 500 }} />)}
      <span style={{ fontSize: 9, color: T.fg3, fontFamily: "monospace" }}>ms</span>
    </div>
  ),
  "dl-a11y": () => (
    <div style={{ display: "flex", gap: 4, padding: "8px 0", alignItems: "center" }}>
      <div style={{ width: 18, height: 18, borderRadius: 9, border: `2px solid ${T.successFg1}`, display: "flex", alignItems: "center", justifyContent: "center" }}><FIcon name="check" size={10} color={T.successFg1} /></div>
      <span style={{ fontSize: 9, color: T.fg3, fontFamily: FONT }}>WCAG AA</span>
    </div>
  ),
  "dl-density": () => (
    <div style={{ display: "flex", gap: 3, padding: "8px 0", alignItems: "flex-end" }}>
      {[{h:14,w:32,l:"S"},{h:18,w:40,l:"M"},{h:22,w:48,l:"L"}].map(d => (
        <div key={d.l} style={{ width: d.w, height: d.h, borderRadius: 3, background: T.brandBg, display: "flex", alignItems: "center", justifyContent: "center", color: T.fgOnBrand, fontSize: 8, fontWeight: 600, fontFamily: FONT }}>{d.l}</div>
      ))}
    </div>
  ),
  "dl-content": () => (
    <div style={{ padding: "8px 0", fontSize: 8, color: T.fg3, lineHeight: 1.3, fontFamily: FONT }}>✓ Save changes?<br/><span style={{ color: T.dangerFg1 }}>✗ Click to save</span></div>
  ),
  buttons: () => (
    <div style={{ display: "flex", gap: 4, padding: "8px 0" }}>
      <div style={{ height: 20, padding: "0 8px", borderRadius: 3, background: T.brandBg, color: T.fgOnBrand, fontSize: 9, fontWeight: 600, fontFamily: FONT, display: "flex", alignItems: "center" }}>Primary</div>
      <div style={{ height: 20, padding: "0 8px", borderRadius: 3, background: T.bg1, border: `1px solid ${T.stroke1}`, fontSize: 9, fontFamily: FONT, display: "flex", alignItems: "center", color: T.fg1 }}>Secondary</div>
    </div>
  ),
  inputs: () => (
    <div style={{ padding: "8px 0" }}>
      <div style={{ height: 20, borderRadius: 3, background: T.bg1, border: `1px solid ${T.stroke1}`, borderBottom: `2px solid ${T.brandBg}`, padding: "0 6px", display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: 9, color: T.fg3, fontFamily: FONT }}>Enter text...</span>
      </div>
    </div>
  ),
  checkboxes: () => (
    <div style={{ display: "flex", gap: 6, padding: "8px 0", alignItems: "center" }}>
      <div style={{ width: 12, height: 12, borderRadius: 2, background: T.brandBg, display: "flex", alignItems: "center", justifyContent: "center" }}><FIcon name="check" size={8} color={T.fgOnBrand} /></div>
      <div style={{ width: 12, height: 12, borderRadius: 2, border: `1px solid ${T.strokeAccessible}` }} />
      <span style={{ fontSize: 9, color: T.fg3, fontFamily: FONT }}>Options</span>
    </div>
  ),
  radios: () => (
    <div style={{ display: "flex", gap: 6, padding: "8px 0", alignItems: "center" }}>
      <div style={{ width: 12, height: 12, borderRadius: 6, border: `2px solid ${T.brandBg}`, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 5, height: 5, borderRadius: 3, background: T.brandBg }} /></div>
      <div style={{ width: 12, height: 12, borderRadius: 6, border: `1px solid ${T.strokeAccessible}` }} />
    </div>
  ),
  switches: () => (
    <div style={{ display: "flex", gap: 6, padding: "8px 0", alignItems: "center" }}>
      <div style={{ width: 28, height: 14, borderRadius: 7, background: T.brandBg, position: "relative" }}><div style={{ width: 10, height: 10, borderRadius: 5, background: T.fgOnBrand, position: "absolute", top: 2, left: 16 }} /></div>
      <div style={{ width: 28, height: 14, borderRadius: 7, background: T.bg5, border: `1px solid ${T.strokeAccessible}`, position: "relative" }}><div style={{ width: 10, height: 10, borderRadius: 5, background: T.fg1, position: "absolute", top: 1, left: 2 }} /></div>
    </div>
  ),
  slider: () => (
    <div style={{ padding: "10px 0", position: "relative" }}>
      <div style={{ height: 3, borderRadius: 1.5, background: T.bg5, position: "relative" }}>
        <div style={{ width: "60%", height: "100%", borderRadius: 1.5, background: T.brandBg }} />
        <div style={{ width: 10, height: 10, borderRadius: 5, background: T.brandBg, border: `2px solid ${T.bg1}`, position: "absolute", top: -3.5, left: "58%" }} />
      </div>
    </div>
  ),
  cards: () => (
    <div style={{ padding: "6px 0" }}>
      <div style={{ borderRadius: 4, background: T.bg1, border: `1px solid ${T.stroke2}`, overflow: "hidden" }}>
        <div style={{ height: 16, background: `linear-gradient(135deg, ${T.brandBg2}, ${T.bg4})` }} />
        <div style={{ padding: "4px 6px" }}><div style={{ width: 40, height: 4, borderRadius: 1, background: T.fg1, opacity: 0.5 }} /><div style={{ width: 28, height: 3, borderRadius: 1, background: T.fg3, opacity: 0.3, marginTop: 3 }} /></div>
      </div>
    </div>
  ),
  badges: () => (
    <div style={{ display: "flex", gap: 4, padding: "8px 0", alignItems: "center" }}>
      <span style={{ minWidth: 14, height: 14, borderRadius: 7, background: T.brandBg, color: T.fgOnBrand, fontSize: 8, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>3</span>
      <span style={{ minWidth: 14, height: 14, borderRadius: 7, background: T.dangerBg3, color: "white", fontSize: 8, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>!</span>
      <span style={{ minWidth: 14, height: 14, borderRadius: 7, background: T.successBg3, color: "white", fontSize: 8, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>✓</span>
    </div>
  ),
  avatars: () => (
    <div style={{ display: "flex", gap: 4, padding: "8px 0" }}>
      {[["A", T.brandBg, 16], ["B", "#C50F1F", 20], ["C", "#107C10", 24]].map(([i, bg, s]) => (
        <div key={i} style={{ width: s, height: s, borderRadius: s, background: bg, color: T.fgOnBrand, fontSize: s * 0.45, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>{i}</div>
      ))}
    </div>
  ),
  tabs: () => (
    <div style={{ display: "flex", gap: 0, padding: "6px 0", borderBottom: `1px solid ${T.stroke2}` }}>
      <div style={{ padding: "3px 8px", fontSize: 9, fontWeight: 600, color: T.brandFg1, borderBottom: `2px solid ${T.brandBg}`, fontFamily: FONT }}>Active</div>
      <div style={{ padding: "3px 8px", fontSize: 9, color: T.fg3, fontFamily: FONT }}>Tab 2</div>
    </div>
  ),
  messagebars: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "6px 0" }}>
      {[[T.brandBg2, T.brandFg2], [T.successBg1, T.successFg1], [T.dangerBg1, T.dangerFg1]].map(([bg, fg], i) => (
        <div key={i} style={{ height: 10, borderRadius: 2, background: bg, borderLeft: `2px solid ${fg}` }} />
      ))}
    </div>
  ),
  dialogs: () => (
    <div style={{ padding: "6px 0" }}>
      <div style={{ borderRadius: 4, background: T.bg1, border: `1px solid ${T.stroke2}`, padding: 6, boxShadow: `0 4px 8px ${T.shadowKey}` }}>
        <div style={{ width: 36, height: 3, borderRadius: 1, background: T.fg1, opacity: 0.6, marginBottom: 4 }} />
        <div style={{ width: 56, height: 2, borderRadius: 1, background: T.fg3, opacity: 0.3, marginBottom: 6 }} />
        <div style={{ display: "flex", gap: 3, justifyContent: "flex-end" }}>
          <div style={{ width: 24, height: 10, borderRadius: 2, border: `1px solid ${T.stroke1}` }} />
          <div style={{ width: 24, height: 10, borderRadius: 2, background: T.brandBg }} />
        </div>
      </div>
    </div>
  ),
  menus: () => (
    <div style={{ padding: "6px 0" }}>
      <div style={{ borderRadius: 3, background: T.bg1, border: `1px solid ${T.stroke2}`, padding: 3, boxShadow: `0 2px 4px ${T.shadowKey}` }}>
        {["Cut", "Copy", "Paste"].map(l => <div key={l} style={{ padding: "2px 6px", fontSize: 8, color: T.fg2, fontFamily: FONT, borderRadius: 2 }}>{l}</div>)}
      </div>
    </div>
  ),
  progress: () => (
    <div style={{ display: "flex", gap: 8, padding: "8px 0", alignItems: "center" }}>
      <div style={{ flex: 1, height: 3, borderRadius: 1.5, background: T.bg5 }}><div style={{ width: "65%", height: "100%", borderRadius: 1.5, background: T.brandBg }} /></div>
      <div style={{ width: 14, height: 14, border: `2px solid ${T.bg5}`, borderTopColor: T.brandBg, borderRadius: 7 }} />
    </div>
  ),
  tooltips: () => (
    <div style={{ padding: "8px 0", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
      <div style={{ padding: "2px 6px", borderRadius: 3, background: T.bgInverted, color: T.fgInverted, fontSize: 8, fontFamily: FONT }}>Tooltip</div>
      <div style={{ width: 40, height: 14, borderRadius: 3, border: `1px solid ${T.stroke1}`, background: T.bg1 }} />
    </div>
  ),
  links: () => (
    <div style={{ padding: "8px 0", fontFamily: FONT }}>
      <span style={{ fontSize: 10, color: T.brandFgLink, textDecoration: "underline" }}>Learn more →</span>
    </div>
  ),
  dividers: () => (
    <div style={{ padding: "8px 0", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ width: "100%", height: 1, background: T.stroke2 }} />
      <div style={{ width: "80%", height: 1, background: T.stroke2, marginLeft: 12 }} />
    </div>
  ),
  charts: () => <div style={{display:"flex",gap:2,alignItems:"flex-end",padding:"6px 0"}}>{[35,55,40,70,50].map((h,i)=><div key={i} style={{width:8,height:h/3,borderRadius:2,background:[T.brandBg,T.dangerBg3,T.successBg3,T.warningBg3,"#8B5CF6"][i]}}/>)}</div>,
  "pat-dashboard": () => <div style={{display:"flex",gap:3}}>{["$42K","1.2K","+18%"].map((v,i)=><div key={i} style={{fontSize:7,fontWeight:600,color:T.fg1,background:T.cardBg,border:`1px solid ${T.stroke2}`,borderRadius:4,padding:"2px 4px"}}>{v}</div>)}</div>,
  "pat-form": () => <div style={{display:"flex",flexDirection:"column",gap:2}}><div style={{height:10,borderRadius:4,background:T.bg1,border:`1px solid ${T.stroke1}`,borderBottom:`2px solid ${T.brandBg}`}}/><div style={{height:10,borderRadius:4,background:T.bg1,border:`1px solid ${T.stroke1}`}}/></div>,
  "pat-list-detail": () => <div style={{display:"flex",gap:1,height:20}}><div style={{width:24,background:T.bg2,borderRadius:4,padding:1}}><div style={{height:4,borderRadius:2,background:T.subtleBgSelected,marginBottom:1}}/></div><div style={{flex:1,background:T.bg1,borderRadius:4,border:`1px solid ${T.stroke2}`}}/></div>,
  "pat-app-shell": () => <div style={{display:"flex",flexDirection:"column",height:24,borderRadius:4,border:`1px solid ${T.stroke2}`,overflow:"hidden"}}><div style={{height:6,background:T.bg2}}/><div style={{display:"flex",flex:1}}><div style={{width:12,background:T.bg2,borderRight:`1px solid ${T.stroke2}`}}/><div style={{flex:1}}/></div></div>,
  "pat-login": () => <div style={{display:"flex",justifyContent:"center"}}><div style={{width:40,borderRadius:4,border:`1px solid ${T.stroke2}`,padding:3}}><div style={{height:4,borderRadius:2,background:T.brandBg,marginBottom:2}}/><div style={{height:6,borderRadius:4,background:T.bg2,marginBottom:2}}/><div style={{height:6,borderRadius:4,background:T.brandBg}}/></div></div>,
  "pat-settings": () => <div style={{display:"flex",gap:1,height:20}}><div style={{width:16}}>{["⚙","🔔"].map((i,idx)=><div key={idx} style={{fontSize:6,padding:1,color:idx===0?T.brandFg1:T.fg3}}>{i}</div>)}</div><div style={{flex:1,border:`1px solid ${T.stroke2}`,borderRadius:4}}/></div>,
  "pat-search": () => <div><div style={{height:10,borderRadius:4,background:T.bg2,padding:"0 3px",fontSize:6,color:T.fg3,display:"flex",alignItems:"center"}}>🔍 Search</div><div style={{display:"flex",gap:2,marginTop:2}}>{[1,2].map(i=><div key={i} style={{flex:1,height:8,borderRadius:4,background:T.bg2}}/>)}</div></div>,
  "pat-wizard": () => <div style={{display:"flex",gap:2,alignItems:"center"}}>{[1,2,3].map(s=><><div key={s} style={{width:10,height:10,borderRadius:5,background:s===1?T.brandBg:s===2?T.brandBg2:"transparent",border:`1.5px solid ${s<=2?T.brandBg:T.stroke1}`,fontSize:5,color:s===1?T.fgOnBrand:s===2?T.brandFg1:T.fg3,display:"flex",alignItems:"center",justifyContent:"center"}}>{s}</div>{s<3&&<div style={{flex:1,height:1,background:s===1?T.brandBg:T.stroke2}}/>}</>)}</div>,
  "pat-data-table": () => <div style={{borderRadius:4,border:`1px solid ${T.stroke2}`,overflow:"hidden"}}><div style={{display:"flex",padding:2,borderBottom:`1px solid ${T.stroke2}`}}><span style={{flex:1,fontSize:6,fontWeight:600,color:T.fg2}}>Name</span><span style={{fontSize:6,fontWeight:600,color:T.fg2}}>Val</span></div><div style={{padding:2,fontSize:6,color:T.fg1}}>Row 1</div></div>,
};

/* ── APP ── */
export default function App() {
  const [sel, setSel] = useState(null);
  const [q, setQ] = useState("");
  const [sb, setSb] = useState(true);
  const [themeKey, setThemeKey] = useState("light");
  const [size, setSize] = useState("medium");
  const [ctrlOpen, setCtrlOpen] = useState(true); // small | medium | large

  T = THEMES[themeKey];
  const CSS = buildCSS(T);
  
  // Fluent 2 size variants: height + padding + font adjustments
  const sizeMap = {
    small:  { h: 24, pad: 8,  fs: 12, iconS: 16, sideW: 220, sidePad: 10, mainPad: 20, cardMin: 160, gap: 8,  bodyFs: 12, labelFs: 12, headFs: 24, subFs: 11, gridGap: 8,  cardPad: 10, sideItemPad: "5px 8px", sideFs: 11, topBarH: 36, cardRadius: 4 },
    medium: { h: 32, pad: 12, fs: 14, iconS: 20, sideW: 260, sidePad: 12, mainPad: 32, cardMin: 200, gap: 10, bodyFs: 14, labelFs: 14, headFs: 28, subFs: 12, gridGap: 10, cardPad: 14, sideItemPad: "8px 12px", sideFs: 13, topBarH: 44, cardRadius: 8 },
    large:  { h: 40, pad: 16, fs: 14, iconS: 24, sideW: 300, sidePad: 16, mainPad: 40, cardMin: 240, gap: 14, bodyFs: 14, labelFs: 16, headFs: 36, subFs: 14, gridGap: 14, cardPad: 18, sideItemPad: "10px 14px", sideFs: 14, topBarH: 52, cardRadius: 8 },
  };
  const sz = sizeMap[size];
  const sizeCSS = `
    /* Component sizes */
    .f-btn { height:${sz.h}px; padding:0 ${sz.pad}px; font-size:${sz.fs}px; min-width:${sz.h * 3}px; border-radius:${sz.cardRadius / 2}px; }
    .f-btn-sm { height:${sizeMap.small.h}px; padding:0 ${sizeMap.small.pad}px; font-size:${sizeMap.small.fs}px; min-width:${sizeMap.small.h * 2.5}px; }
    .f-btn-lg { height:${sizeMap.large.h}px; padding:0 ${sizeMap.large.pad}px; font-size:${sizeMap.large.fs}px; }
    .f-input { height:${sz.h}px; font-size:${sz.fs}px; padding:0 ${sz.pad - 2}px; }
    .f-input-label { font-size:${sz.labelFs}px; }
    .f-checkbox { font-size:${sz.fs}px; gap:${sz.gap - 2}px; }
    .f-cb-box { width:${sz.iconS - 4}px; height:${sz.iconS - 4}px; }
    .f-radio { font-size:${sz.fs}px; gap:${sz.gap - 2}px; }
    .f-radio-circle { width:${sz.iconS - 4}px; height:${sz.iconS - 4}px; border-radius:${(sz.iconS - 4) / 2}px; }
    .f-tab { padding:${Math.max(6, sz.pad - 2)}px ${sz.pad}px; font-size:${sz.fs}px; }
    .f-menu-item { padding:${Math.max(4, sz.pad - 4)}px ${sz.pad - 2}px; font-size:${sz.fs}px; }
    .f-badge { height:${sz.h - 12}px; min-width:${sz.h - 12}px; font-size:${sz.fs - 2}px; }
    .f-msgbar { padding:${Math.max(4, sz.pad - 4)}px ${sz.pad}px; font-size:${sz.fs}px; }
    .f-card { border-radius:${sz.cardRadius}px; }
    .f-dialog { padding:${sz.mainPad * 0.6}px; border-radius:${sz.cardRadius}px; }
    .f-avatar { width:${sz.h}px; height:${sz.h}px; font-size:${sz.fs}px; }
    .f-avatar-sm { width:${sizeMap.small.h}px; height:${sizeMap.small.h}px; font-size:${sizeMap.small.fs}px; }
    .f-avatar-lg { width:${sizeMap.large.h + 8}px; height:${sizeMap.large.h + 8}px; font-size:${sizeMap.large.fs + 4}px; }
    .f-switch { width:${sz.h + 8}px; height:${sz.h / 1.6}px; border-radius:${sz.h}px; }
    .f-switch .f-sw-thumb { width:${sz.h / 2.3}px; height:${sz.h / 2.3}px; border-radius:${sz.h}px; }
    .f-switch.on .f-sw-thumb { left:${sz.h - 6}px; }
    .f-divider { margin:${sz.gap / 2}px 0; }
    /* Layout */
    .f-sidebar-item { padding:${sz.sideItemPad}; font-size:${sz.sideFs}px; }
  `;

  const fl = COMPS.filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()));
  const sc = COMPS.find(c => c.id === sel);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: FONT, background: T.bg2, transition: "background 200ms" }}>
      <style>{CSS}{sizeCSS}</style>

      {/* Sidebar */}
      <aside style={{ width: sb ? sz.sideW : 0, overflow: "hidden", background: T.bg1, borderRight: `1px solid ${T.stroke2}`, transition: "width 250ms cubic-bezier(0.1,0.9,0.2,1)", display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0 }}>
        <div style={{ padding: `${sz.sidePad + 4}px ${sz.sidePad}px ${sz.sidePad - 4}px`, minWidth: sz.sideW }}>
          <div style={{ display: "flex", alignItems: "center", gap: sz.gap - 2, marginBottom: sz.gap + 4 }}>
            <div style={{ width: sz.h - 4, height: sz.h - 4, borderRadius: Math.max(4, sz.cardRadius - 2), background: T.brandBg, display: "flex", alignItems: "center", justifyContent: "center", color: T.fgOnBrand, fontWeight: 700, fontSize: sz.sideFs - 1 }}>F2</div>
            <div><div style={{ fontWeight: 600, fontSize: sz.bodyFs, color: T.fg1, lineHeight: 1.2 }}>Fluent 2</div><div style={{ fontSize: sz.sideFs - 3, color: T.fg3 }}>Interactive Components</div></div>
          </div>

          <button onClick={() => setCtrlOpen(!ctrlOpen)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: `${sz.gap - 4}px 0`, marginBottom: ctrlOpen ? 4 : 0, fontFamily: FONT }}>
            <span style={{ fontSize: sz.sideFs - 3, fontWeight: 600, color: T.fg3, textTransform: "uppercase", letterSpacing: "0.06em" }}>Controls</span>
            <FIcon name="chevronDown" size={12} color={T.fg3} />
          </button>
          {ctrlOpen && <><div style={{ fontSize: sz.sideFs - 3, fontWeight: 600, color: T.fg3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Theme</div>
          <div style={{ display: "flex", gap: 4, marginBottom: sz.gap }}>
            {Object.entries(THEMES).map(([key, theme]) => (
              <button key={key} onClick={() => setThemeKey(key)} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: `${sz.gap - 4}px ${sz.pad}px`, borderRadius: 4, cursor: "pointer", fontFamily: FONT, fontSize: sz.sideFs - 1,
                border: themeKey === key ? `2px solid ${T.brandBg}` : `1px solid ${T.stroke1}`,
                background: themeKey === key ? T.brandBg2 : "transparent",
                color: themeKey === key ? T.brandFg1 : T.fg2, fontWeight: themeKey === key ? 600 : 400,
                transition: "all 150ms",
              }}>
                <FIcon name={key === "light" ? "sun" : "moon"} size={14} />
                {theme.name}
              </button>
            ))}
          </div>

          {/* Size */}
          <div style={{ fontSize: sz.sideFs - 3, fontWeight: 600, color: T.fg3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Size</div>
          <div style={{ display: "flex", gap: 0, marginBottom: sz.gap, borderRadius: 4, overflow: "hidden", border: `1px solid ${T.stroke1}` }}>
            {[["small", "S · 24"], ["medium", "M · 32"], ["large", "L · 40"]].map(([key, label]) => (
              <button key={key} onClick={() => setSize(key)} style={{
                flex: 1, padding: `${sz.gap - 4}px 0`, border: "none", cursor: "pointer", fontFamily: FONT, fontSize: sz.sideFs - 3, fontWeight: size === key ? 600 : 400,
                background: size === key ? T.brandBg : "transparent",
                color: size === key ? T.fgOnBrand : T.fg2,
                transition: "all 150ms",
              }}>{label}</button>
            ))}
          </div>

          </>}
          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: `${sz.gap - 4}px ${sz.pad}px`, borderRadius: 4, background: T.bg3, border: `1px solid ${T.stroke2}`, marginBottom: sz.gap - 2 }}>
            <FIcon name="search" size={sz.iconS - 4} color={T.fg3} />
            <input type="text" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} style={{ border: "none", background: "transparent", outline: "none", fontSize: sz.sideFs, color: T.fg1, width: "100%", fontFamily: FONT }} />
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: `0 ${sz.sidePad - 4}px ${sz.sidePad}px`, minWidth: sz.sideW }}>
          {CATS.map(cat => {
            const items = fl.filter(c => c.cat === cat);
            if (!items.length) return null;
            return <div key={cat} style={{ marginBottom: 4 }}>
              <div style={{ padding: `${sz.gap - 4}px 4px 2px`, fontSize: sz.sideFs - 3, fontWeight: 700, color: T.fg3, textTransform: "uppercase", letterSpacing: "0.08em" }}>{cat}</div>
              {items.map(c => <button key={c.id} onClick={() => setSel(c.id)} className={`f-sidebar-item${sel === c.id ? " active" : ""}`}>{c.name}</button>)}
            </div>;
          })}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: sz.gap, padding: `${sz.gap - 2}px ${sz.sidePad + 4}px`, borderBottom: `1px solid ${T.stroke2}`, background: T.bg1, minHeight: sz.topBarH }}>
          <button className="f-btn f-btn-subtle" onClick={() => setSb(!sb)} style={{ minWidth: "auto", width: sz.h, height: sz.h, padding: 0 }}>☰</button>
          <span style={{ fontSize: sz.sideFs, color: T.fg3, flex: 1 }}>{sc ? `${sc.cat} / ${sc.name}` : "Fluent 2 Interactive Documentation"}</span>
          <span style={{ fontSize: sz.sideFs - 2, color: T.fg3, background: T.bg3, padding: `${sz.gap / 3}px ${sz.gap}px`, borderRadius: 10000 }}>{T.name} · {size.charAt(0).toUpperCase() + size.slice(1)} ({sz.h}px)</span>
        </div>

        <div style={{ padding: sz.mainPad }}>
          {sc ? (
            <div style={{ maxWidth: 800 }}>
              <button onClick={() => setSel(null)} className="f-link" style={{ fontSize: sz.sideFs - 1, marginBottom: sz.gap, display: "inline-block" }}>← Back to all</button>
              <h1 style={{ fontSize: sz.headFs, fontWeight: 600, margin: `0 0 ${sz.gap - 4}px`, color: T.fg1, lineHeight: 1.2 }}>{sc.name}</h1>
              <p style={{ fontSize: sz.bodyFs, color: T.fg3, margin: `0 0 ${sz.mainPad * 0.75}px`, lineHeight: 1.5 }}>{sc.desc}</p>
              <div style={{ padding: sz.mainPad * 0.75, borderRadius: sz.cardRadius, background: T.bg1, border: `1px solid ${T.stroke2}` }}>
                <sc.render />
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              <h1 style={{ fontSize: sz.headFs + 12, fontWeight: 600, margin: `0 0 ${sz.gap}px`, color: T.fg1, lineHeight: 1.1 }}>Fluent 2 <span style={{ color: T.brandFg1 }}>Interactive Library</span></h1>
              <p style={{ fontSize: sz.bodyFs, lineHeight: 1.6, color: T.fg3, maxWidth: 560, margin: `0 0 ${sz.gap - 2}px` }}>Microsoft's Fluent 2 design system components with real interactive states. Hover, focus, click — every state matches the official Fluent tokens.</p>
              <p style={{ fontSize: sz.sideFs - 1, color: T.brandFg1, margin: `0 0 ${sz.mainPad}px`, fontWeight: 600 }}>Try it: switch to Dark theme. Change size to Small for a dense layout. Tab for focus rings.</p>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${sz.cardMin}px, 1fr))`, gap: sz.gridGap }}>
                {COMPS.map(c => {
                  const Preview = PREVIEWS[c.id];
                  return (
                    <button key={c.id} onClick={() => setSel(c.id)} className="f-card" style={{ width: "100%", textAlign: "left" }}>
                      <div style={{ padding: `${sz.cardPad - 4}px ${sz.cardPad}px ${sz.cardPad - 2}px` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontSize: sz.bodyFs, fontWeight: 600, color: T.fg1 }}>{c.name}</div>
                            <div style={{ fontSize: sz.subFs, color: T.fg4, marginTop: 1 }}>{c.cat}</div>
                          </div>
                        </div>
                        {Preview && <div style={{ pointerEvents: "none", marginTop: 4 }}><Preview /></div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
