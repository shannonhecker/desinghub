import { useState, useEffect, useRef, createContext, useContext } from "react";

/* ── EXPORTED FOR DESIGN HUB ── */
export { THEMES as M3_THEMES, buildCSS as m3BuildCSS, COMPS as M3_COMPS, CATS as M3_CATS, MATERIAL_COLORS, I as M3Icon };
export { generateM3Theme };
export function setM3T(theme) { T = theme; }
export function getM3T() { return T; }
export function getM3DemoComponent(id) {
  const comp = COMPS.find(c => c.id === id);
  return comp ? comp.render : null;
}
export function getM3DensityCSS(density) {
  if (density === 0) return '';
  const d = density * 4;
  const btnH = 40 + d, tfH = 56 + d, chipH = 32 + d, tabH = 48 + d;
  const fabSmH = 40 + d, fabMdH = 56 + d, ibH = 40 + d, navH = 80 + d * 2;
  const menuPadV = Math.max(6, 12 + d), dpDay = Math.max(24, 32 + d);
  return `
    .m3-btn{height:${btnH}px;} .m3-tf{height:${tfH}px;}
    .m3-tf-filled .m3-tf-content{padding-top:${Math.max(4,8+d)}px;}
    .m3-tf-label{font-size:${tfH<=48?14:16}px;}
    .m3-tf-filled:focus-within .m3-tf-label,.m3-tf-filled .m3-tf-label.up{top:${Math.max(4,8+d)}px;}
    .m3-chip{height:${Math.max(24,chipH)}px;}
    .m3-switch{width:${52+d}px;height:${32+d}px;border-radius:${(32+d)/2}px;}
    .m3-tab{padding:${Math.max(4,12+d)}px 24px;}
    .m3-nav-pill{height:${Math.max(24,32+d)}px;} .m3-nav-item{height:${navH}px;}
    .m3-fab{width:${fabMdH}px;height:${fabMdH}px;} .m3-fab-sm{width:${fabSmH}px;height:${fabSmH}px;}
    .m3-ib{width:${ibH}px;height:${ibH}px;} .m3-menu-item{padding:${menuPadV}px 12px;}
    .m3-dp-day{width:${dpDay}px;height:${dpDay}px;font-size:${dpDay<=28?12:14}px;}
  `;
}
export function getM3Previews() { return M3_PREVIEWS; }
export function getM3LayoutDensity(density) {
  return {
    0:    { sideW: 260, mainP: 28, cardMin: 220, gap: 10, topP: "10px 20px", sideP: "18px 14px 10px", sideFontSize: 13, navP: "8px 10px" },
    [-1]: { sideW: 240, mainP: 24, cardMin: 200, gap: 8,  topP: "8px 16px",  sideP: "14px 12px 8px",  sideFontSize: 13, navP: "7px 9px" },
    [-2]: { sideW: 220, mainP: 20, cardMin: 180, gap: 8,  topP: "6px 14px",  sideP: "12px 10px 6px",  sideFontSize: 12, navP: "6px 8px" },
    [-3]: { sideW: 200, mainP: 16, cardMin: 160, gap: 6,  topP: "4px 12px",  sideP: "10px 8px 4px",   sideFontSize: 12, navP: "5px 8px" },
  }[density] || { sideW: 260, mainP: 28, cardMin: 220, gap: 10, topP: "10px 20px", sideP: "18px 14px 10px", sideFontSize: 13, navP: "8px 10px" };
}

/* ── ALL M3 THEME PALETTES (from Figma Design Kit) ── */
const THEMES = {
  light: {
    name: "Light", primary: "#6750A4", onPrimary: "#FFFFFF",
    primaryContainer: "#EADDFF", onPrimaryContainer: "#21005D",
    secondary: "#625B71", onSecondary: "#FFFFFF",
    secondaryContainer: "#E8DEF8", onSecondaryContainer: "#1D192B",
    tertiary: "#7D5260", tertiaryContainer: "#FFD8E4", onTertiaryContainer: "#31111D",
    error: "#B3261E", onError: "#FFFFFF", errorContainer: "#F9DEDC", onErrorContainer: "#410E0B",
    surface: "#FEF7FF", surfaceContainerLowest: "#FFFFFF", surfaceContainerLow: "#F7F2FA",
    surfaceContainer: "#F3EDF7", surfaceContainerHigh: "#ECE6F0", surfaceContainerHighest: "#E6E0E9",
    onSurface: "#1D1B20", onSurfaceVariant: "#49454F",
    outline: "#79747E", outlineVariant: "#CAC4D0",
    inverseSurface: "#322F35", inverseOnSurface: "#F5EFF7", inversePrimary: "#D0BCFF",
    onTertiary: "#FFFFFF", surfaceDim: "#DED8E1", surfaceBright: "#FEF7FF", shadow: "#000000", scrim: "#000000",
  },
  dark: {
    name: "Dark", primary: "#D0BCFF", onPrimary: "#381E72",
    primaryContainer: "#4F378B", onPrimaryContainer: "#EADDFF",
    secondary: "#CCC2DC", onSecondary: "#332D41",
    secondaryContainer: "#4A4458", onSecondaryContainer: "#E8DEF8",
    tertiary: "#EFB8C8", tertiaryContainer: "#633B48", onTertiaryContainer: "#FFD8E4",
    error: "#F2B8B5", onError: "#601410", errorContainer: "#8C1D18", onErrorContainer: "#F9DEDC",
    surface: "#141218", surfaceContainerLowest: "#0F0D13", surfaceContainerLow: "#1D1B20",
    surfaceContainer: "#211F26", surfaceContainerHigh: "#2B2930", surfaceContainerHighest: "#36343B",
    onSurface: "#E6E0E9", onSurfaceVariant: "#CAC4D0",
    outline: "#938F99", outlineVariant: "#49454F",
    inverseSurface: "#E6E0E9", inverseOnSurface: "#322F35", inversePrimary: "#6750A4",
    onTertiary: "#492532", surfaceDim: "#141218", surfaceBright: "#3B383E", shadow: "#000000", scrim: "#000000",
  },
  lightMediumContrast: {
    name: "Light Medium Contrast", primary: "#4B3487", onPrimary: "#FFFFFF",
    primaryContainer: "#6B54A4", onPrimaryContainer: "#FFFFFF",
    secondary: "#473F55", onSecondary: "#FFFFFF",
    secondaryContainer: "#645C73", onSecondaryContainer: "#FFFFFF",
    tertiary: "#5F3745", tertiaryContainer: "#7F5262", onTertiaryContainer: "#FFFFFF",
    error: "#8C0009", onError: "#FFFFFF", errorContainer: "#DA342E", onErrorContainer: "#FFFFFF",
    surface: "#FEF7FF", surfaceContainerLowest: "#FFFFFF", surfaceContainerLow: "#F7F2FA",
    surfaceContainer: "#F3EDF7", surfaceContainerHigh: "#ECE6F0", surfaceContainerHighest: "#E6E0E9",
    onSurface: "#1D1B20", onSurfaceVariant: "#454050",
    outline: "#61596D", outlineVariant: "#7D7689",
    inverseSurface: "#322F35", inverseOnSurface: "#F5EFF7", inversePrimary: "#D0BCFF",
    onTertiary: "#FFFFFF", surfaceDim: "#DED8E1", surfaceBright: "#FEF7FF", shadow: "#000000", scrim: "#000000",
  },
  lightHighContrast: {
    name: "Light High Contrast", primary: "#29085C", onPrimary: "#FFFFFF",
    primaryContainer: "#4B3487", onPrimaryContainer: "#FFFFFF",
    secondary: "#261E33", onSecondary: "#FFFFFF",
    secondaryContainer: "#473F55", onSecondaryContainer: "#FFFFFF",
    tertiary: "#3B1124", tertiaryContainer: "#5F3745", onTertiaryContainer: "#FFFFFF",
    error: "#4E0002", onError: "#FFFFFF", errorContainer: "#8C0009", onErrorContainer: "#FFFFFF",
    surface: "#FEF7FF", surfaceContainerLowest: "#FFFFFF", surfaceContainerLow: "#F7F2FA",
    surfaceContainer: "#F3EDF7", surfaceContainerHigh: "#ECE6F0", surfaceContainerHighest: "#E6E0E9",
    onSurface: "#000000", onSurfaceVariant: "#26212E",
    outline: "#454050", outlineVariant: "#454050",
    inverseSurface: "#322F35", inverseOnSurface: "#FFFFFF", inversePrimary: "#F0E4FF",
    onTertiary: "#FFFFFF", surfaceDim: "#DED8E1", surfaceBright: "#FEF7FF", shadow: "#000000", scrim: "#000000",
  },
  darkMediumContrast: {
    name: "Dark Medium Contrast", primary: "#D4C1FF", onPrimary: "#1F0057",
    primaryContainer: "#9B82DB", onPrimaryContainer: "#000000",
    secondary: "#D0C6E1", onSecondary: "#18122B",
    secondaryContainer: "#958DA5", onSecondaryContainer: "#000000",
    tertiary: "#F3BCCC", tertiaryContainer: "#B5869A", onTertiaryContainer: "#000000",
    error: "#FFBAB1", onError: "#370001", errorContainer: "#FF5449", onErrorContainer: "#000000",
    surface: "#141218", surfaceContainerLowest: "#0F0D13", surfaceContainerLow: "#1D1B20",
    surfaceContainer: "#211F26", surfaceContainerHigh: "#2B2930", surfaceContainerHighest: "#36343B",
    onSurface: "#FFF7FF", onSurfaceVariant: "#CFC8D5",
    outline: "#A7A0AD", outlineVariant: "#86808D",
    inverseSurface: "#E6E0E9", inverseOnSurface: "#2B2930", inversePrimary: "#503C8E",
    onTertiary: "#492532", surfaceDim: "#141218", surfaceBright: "#3B383E", shadow: "#000000", scrim: "#000000",
  },
  darkHighContrast: {
    name: "Dark High Contrast", primary: "#FFF9FF", onPrimary: "#000000",
    primaryContainer: "#D4C1FF", onPrimaryContainer: "#000000",
    secondary: "#FFF9FF", onSecondary: "#000000",
    secondaryContainer: "#D0C6E1", onSecondaryContainer: "#000000",
    tertiary: "#FFF9F9", tertiaryContainer: "#F3BCCC", onTertiaryContainer: "#000000",
    error: "#FFF9F9", onError: "#000000", errorContainer: "#FFBAB1", onErrorContainer: "#000000",
    surface: "#141218", surfaceContainerLowest: "#0F0D13", surfaceContainerLow: "#1D1B20",
    surfaceContainer: "#211F26", surfaceContainerHigh: "#2B2930", surfaceContainerHighest: "#36343B",
    onSurface: "#FFFFFF", onSurfaceVariant: "#FFF9FF",
    outline: "#CFC8D5", outlineVariant: "#CFC8D5",
    inverseSurface: "#E6E0E9", inverseOnSurface: "#000000", inversePrimary: "#2F1565",
    onTertiary: "#492532", surfaceDim: "#141218", surfaceBright: "#3B383E", shadow: "#000000", scrim: "#000000",
  },
};

const ThemeContext = createContext(THEMES.light);
const useTheme = () => useContext(ThemeContext);

/* ── GOOGLE MATERIAL COLOR PALETTES (500 shade as primary source) ── */
const MATERIAL_COLORS = [
  { name: "Red", hex: "#F44336" },
  { name: "Pink", hex: "#E91E63" },
  { name: "Purple", hex: "#9C27B0" },
  { name: "Deep Purple", hex: "#673AB7" },
  { name: "Indigo", hex: "#3F51B5" },
  { name: "Blue", hex: "#2196F3" },
  { name: "Light Blue", hex: "#03A9F4" },
  { name: "Cyan", hex: "#00BCD4" },
  { name: "Teal", hex: "#009688" },
  { name: "Green", hex: "#4CAF50" },
  { name: "Light Green", hex: "#8BC34A" },
  { name: "Lime", hex: "#CDDC39" },
  { name: "Yellow", hex: "#FFEB3B" },
  { name: "Amber", hex: "#FFC107" },
  { name: "Orange", hex: "#FF9800" },
  { name: "Deep Orange", hex: "#FF5722" },
  { name: "Brown", hex: "#795548" },
  { name: "Blue Grey", hex: "#607D8B" },
];

/* ── Simple M3 theme generator from a source color ── */
function hexToHSL(hex) {
  let r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
  let max = Math.max(r,g,b), min = Math.min(r,g,b), h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; } else {
    let d = max - min; s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    if (max === r) h = ((g-b)/d + (g<b?6:0))/6;
    else if (max === g) h = ((b-r)/d+2)/6;
    else h = ((r-g)/d+4)/6;
  }
  return [h*360, s*100, l*100];
}
function hslToHex(h,s,l) {
  s/=100; l/=100;
  const a = s*Math.min(l,1-l);
  const f = n => { const k=(n+h/30)%12; return l-a*Math.max(Math.min(k-3,9-k,1),-1); };
  return '#'+[f(0),f(8),f(4)].map(x => Math.round(x*255).toString(16).padStart(2,'0')).join('');
}
function generateM3Theme(sourceHex, isDark = false) {
  const [h,s] = hexToHSL(sourceHex);
  const p = (tone) => hslToHex(h, Math.max(48, s), tone);
  const n = (tone) => hslToHex(h, 4, tone);
  const nv = (tone) => hslToHex(h, 8, tone);
  const sec = (tone) => hslToHex(h, 16, tone);
  const ter = (tone) => hslToHex((h+60)%360, 24, tone);
  const err = (tone) => hslToHex(25, 80, tone);

  if (isDark) {
    return {
      name: "Custom Dark", primary: p(80), onPrimary: p(20),
      primaryContainer: p(30), onPrimaryContainer: p(90),
      secondary: sec(80), onSecondary: sec(20),
      secondaryContainer: sec(30), onSecondaryContainer: sec(90),
      tertiary: ter(80), onTertiary: ter(20), tertiaryContainer: ter(30), onTertiaryContainer: ter(90),
      error: err(80), onError: err(20), errorContainer: err(30), onErrorContainer: err(90),
      surface: n(6), surfaceDim: n(6), surfaceBright: n(24),
      surfaceContainerLowest: n(4), surfaceContainerLow: n(10),
      surfaceContainer: n(12), surfaceContainerHigh: n(17), surfaceContainerHighest: n(22),
      onSurface: n(90), onSurfaceVariant: nv(80),
      outline: nv(60), outlineVariant: nv(30),
      inverseSurface: n(90), inverseOnSurface: n(20), inversePrimary: p(40),
      shadow: "#000000", scrim: "#000000",
    };
  }
  return {
    name: "Custom Light", primary: p(40), onPrimary: "#FFFFFF",
    primaryContainer: p(90), onPrimaryContainer: p(10),
    secondary: sec(40), onSecondary: "#FFFFFF",
    secondaryContainer: sec(90), onSecondaryContainer: sec(10),
    tertiary: ter(40), onTertiary: "#FFFFFF", tertiaryContainer: ter(90), onTertiaryContainer: ter(10),
    error: err(40), onError: "#FFFFFF", errorContainer: err(90), onErrorContainer: err(10),
    surface: n(98), surfaceDim: n(87), surfaceBright: n(98),
    surfaceContainerLowest: "#FFFFFF", surfaceContainerLow: n(96),
    surfaceContainer: n(94), surfaceContainerHigh: n(92), surfaceContainerHighest: n(90),
    onSurface: n(10), onSurfaceVariant: nv(30),
    outline: nv(50), outlineVariant: nv(80),
    inverseSurface: n(20), inverseOnSurface: n(95), inversePrimary: p(80),
    shadow: "#000000", scrim: "#000000",
  };
}

/* helper: build T reference for compatibility */
let T = THEMES.light;

/* ── GLOBAL STYLES — function of active theme ── */
const buildCSS = (T) => `
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
* { box-sizing: border-box; }
.mi { font-family:'Material Symbols Outlined'; font-weight:normal; font-style:normal; font-size:24px; line-height:1; letter-spacing:normal; text-transform:none; display:inline-block; white-space:nowrap; word-wrap:normal; direction:ltr; -webkit-font-smoothing:antialiased; font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; }
.mi.filled { font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24; }
.mi.sm { font-size:20px; }
.mi.xs { font-size:18px; }
.mi.lg { font-size:36px; }

/* === M3 MOTION TOKENS === */
:root {
  --m3-ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --m3-ease-standard-decel: cubic-bezier(0, 0, 0, 1);
  --m3-ease-standard-accel: cubic-bezier(0.3, 0, 1, 1);
  --m3-ease-emphasized: cubic-bezier(0.2, 0, 0, 1);
  --m3-ease-emphasized-decel: cubic-bezier(0.05, 0.7, 0.1, 1);
  --m3-ease-emphasized-accel: cubic-bezier(0.3, 0, 0.8, 0.15);
  --m3-dur-short1: 50ms;
  --m3-dur-short2: 100ms;
  --m3-dur-short3: 150ms;
  --m3-dur-short4: 200ms;
  --m3-dur-medium1: 250ms;
  --m3-dur-medium2: 300ms;
  --m3-dur-medium4: 400ms;
  --m3-dur-long1: 450ms;
  --m3-dur-long2: 500ms;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
}

/* === BUTTONS === */
.m3-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; height:40px; border-radius:20px; padding:0 24px; font-family:Roboto,sans-serif; font-size:14px; font-weight:500; letter-spacing:0.1px; cursor:pointer; border:none; outline:none; transition:box-shadow var(--m3-dur-short4) var(--m3-ease-standard), background var(--m3-dur-short3) var(--m3-ease-standard); position:relative; overflow:hidden; }
.m3-btn::after { content:''; position:absolute; inset:0; border-radius:inherit; opacity:0; transition:opacity var(--m3-dur-short3) var(--m3-ease-standard); pointer-events:none; }
.m3-btn:focus-visible { outline:2px solid ${T.primary}; outline-offset:2px; }

.m3-btn-filled { background:${T.primary}; color:${T.onPrimary}; }
.m3-btn-filled::after { background:${T.onPrimary}; }
.m3-btn-filled:hover::after { opacity:0.08; }
.m3-btn-filled:active::after { opacity:0.12; }
.m3-btn-filled:disabled { background:${T.onSurface}1f; color:${T.onSurface}61; cursor:default; opacity:0.38; }
.m3-btn-filled:disabled::after { display:none; }

.m3-btn-outlined { background:transparent; color:${T.primary}; border:1px solid ${T.outline}; }
.m3-btn-outlined::after { background:${T.primary}; }
.m3-btn-outlined:hover::after { opacity:0.08; }
.m3-btn-outlined:active::after { opacity:0.12; }
.m3-btn-outlined:disabled { color:${T.onSurface}61; border-color:${T.onSurface}1f; opacity:0.38; }

.m3-btn-text { background:transparent; color:${T.primary}; padding:0 12px; }
.m3-btn-text::after { background:${T.primary}; }
.m3-btn-text:hover::after { opacity:0.08; }
.m3-btn-text:active::after { opacity:0.12; }

.m3-btn-elevated { background:${T.surfaceContainerLow}; color:${T.primary}; box-shadow:0 1px 3px 1px rgba(0,0,0,0.06), 0 1px 2px 0 rgba(0,0,0,0.08); }
.m3-btn-elevated::after { background:${T.primary}; }
.m3-btn-elevated:hover { box-shadow:0 2px 6px 2px rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.06); }
.m3-btn-elevated:hover::after { opacity:0.08; }
.m3-btn-elevated:active::after { opacity:0.12; }

.m3-btn-tonal { background:${T.secondaryContainer}; color:${T.onSecondaryContainer}; }
.m3-btn-tonal::after { background:${T.onSecondaryContainer}; }
.m3-btn-tonal:hover::after { opacity:0.08; }
.m3-btn-tonal:active::after { opacity:0.12; }

/* === TEXT FIELDS === */
.m3-tf-wrap { display:flex; flex-direction:column; gap:4px; }
.m3-tf { position:relative; height:56px; display:flex; align-items:center; padding:0 16px; gap:8px; transition:background var(--m3-dur-short4) var(--m3-ease-standard), color var(--m3-dur-short3) var(--m3-ease-standard), border-color var(--m3-dur-short3) var(--m3-ease-standard), box-shadow var(--m3-dur-short4) var(--m3-ease-standard); cursor:text; }
.m3-tf-filled { background:${T.surfaceContainerHighest}; border-radius:4px 4px 0 0; border:none; border-bottom:1px solid ${T.outline}; }
.m3-tf-filled:hover { border-bottom-color:${T.onSurface}; }
.m3-tf-filled:hover::before { content:''; position:absolute; inset:0; background:${T.onSurface}; opacity:0.08; border-radius:4px 4px 0 0; pointer-events:none; }
.m3-tf-filled:focus-within { border-bottom:2px solid ${T.primary}; }
.m3-tf-filled.m3-tf-error { border-bottom:2px solid ${T.error}; }
.m3-tf-filled:disabled, .m3-tf-filled.m3-tf-disabled { opacity:0.38; pointer-events:none; background:${T.onSurface}08; }

.m3-tf-outlined { background:transparent; border-radius:4px; border:1px solid ${T.outline}; }
.m3-tf-outlined:hover { border-color:${T.onSurface}; }
.m3-tf-outlined:focus-within { border:3px solid ${T.primary}; padding:0 14px; }
.m3-tf-outlined.m3-tf-error { border:2px solid ${T.error}; padding:0 15px; }
.m3-tf-outlined.m3-tf-disabled { opacity:0.38; pointer-events:none; border-color:${T.onSurface}1f; }

.m3-tf input { border:none; outline:none; background:transparent; width:100%; font-size:16px; font-family:Roboto,sans-serif; color:${T.onSurface}; letter-spacing:0.5px; padding:0; line-height:24px; }
.m3-tf input::placeholder { color:transparent; }
.m3-tf:focus-within input::placeholder { color:${T.onSurfaceVariant}; }
.m3-tf input:disabled { color:${T.onSurface}61; }

.m3-tf-content { position:relative; flex:1; min-width:0; display:flex; flex-direction:column; justify-content:center; height:100%; }
.m3-tf-filled .m3-tf-content { padding-top:8px; }
.m3-tf-outlined .m3-tf-content { padding-top:0; }

.m3-tf-label { position:absolute; left:0; top:50%; transform:translateY(-50%); font-size:16px; color:${T.onSurfaceVariant}; font-family:Roboto,sans-serif; transition:all var(--m3-dur-short3) var(--m3-ease-standard) cubic-bezier(0.2,0,0,1); pointer-events:none; letter-spacing:0.5px; line-height:16px; }

/* Label moves up when focused or has value */
.m3-tf-filled:focus-within .m3-tf-label,
.m3-tf-filled .m3-tf-label.up { top:8px; transform:translateY(0); font-size:12px; letter-spacing:0.4px; color:${T.primary}; }
.m3-tf-filled .m3-tf-label.up { color:${T.onSurfaceVariant}; }
.m3-tf-filled:focus-within .m3-tf-label { color:${T.primary}; }

.m3-tf-outlined:focus-within .m3-tf-label,
.m3-tf-outlined .m3-tf-label.up { top:0; transform:translateY(-50%); font-size:12px; letter-spacing:0.4px; background:${T.surface}; padding:0 4px; margin-left:-4px; color:${T.primary}; }
.m3-tf-outlined .m3-tf-label.up { color:${T.onSurfaceVariant}; }
.m3-tf-outlined:focus-within .m3-tf-label { color:${T.primary}; }

.m3-tf-error .m3-tf-label, .m3-tf-error:focus-within .m3-tf-label, .m3-tf-error .m3-tf-label.up { color:${T.error}!important; }
.m3-tf-helper { font-size:12px; color:${T.onSurfaceVariant}; padding-left:16px; font-family:Roboto,sans-serif; letter-spacing:0.4px; line-height:16px; min-height:16px; }
.m3-tf-error + .m3-tf-helper { color:${T.error}; }
.m3-tf-icon { color:${T.onSurfaceVariant}; flex-shrink:0; display:flex; align-items:center; }
.m3-tf-error .m3-tf-icon-trail { color:${T.error}; }

/* === CHIPS === */
.m3-chip { display:inline-flex; align-items:center; gap:8px; height:32px; border-radius:8px; padding:0 16px; font-family:Roboto,sans-serif; font-size:14px; font-weight:500; cursor:pointer; border:1px solid ${T.outline}; background:transparent; color:${T.onSurfaceVariant}; position:relative; overflow:hidden; outline:none; transition:background var(--m3-dur-short4) var(--m3-ease-standard), color var(--m3-dur-short3) var(--m3-ease-standard), border-color var(--m3-dur-short3) var(--m3-ease-standard), box-shadow var(--m3-dur-short4) var(--m3-ease-standard); }
.m3-chip::after { content:''; position:absolute; inset:0; border-radius:inherit; opacity:0; transition:opacity var(--m3-dur-short3) var(--m3-ease-standard); pointer-events:none; background:${T.onSurfaceVariant}; }
.m3-chip:hover::after { opacity:0.08; }
.m3-chip:active::after { opacity:0.12; }
.m3-chip:focus-visible { outline:2px solid ${T.primary}; outline-offset:2px; }
.m3-chip.selected { background:${T.secondaryContainer}; color:${T.onSecondaryContainer}; border:none; }
.m3-chip.selected::after { background:${T.onSecondaryContainer}; }
.m3-chip:disabled { opacity:0.38; cursor:default; }

/* === CARDS === */
.m3-card { border-radius:12px; overflow:hidden; cursor:pointer; transition:box-shadow var(--m3-dur-medium1) var(--m3-ease-emphasized), background-color var(--m3-dur-short4) var(--m3-ease-standard), border-color var(--m3-dur-short3) var(--m3-ease-standard); outline:none; position:relative; width:200px; }
.m3-card::after { content:''; position:absolute; inset:0; border-radius:inherit; opacity:0; transition:opacity var(--m3-dur-short3) var(--m3-ease-standard); pointer-events:none; background:${T.onSurface}; z-index:1; }
.m3-card:hover::after { opacity:0.08; }
.m3-card:active::after { opacity:0.10; }
.m3-card:focus-visible { outline:2px solid ${T.primary}; outline-offset:2px; }
/* M3 Elevated: tonal shift surface-container-low → surface-container on hover */
.m3-card-elevated { background:${T.surfaceContainerLow}; box-shadow:0 1px 3px 1px rgba(0,0,0,0.06), 0 1px 2px 0 rgba(0,0,0,0.08); }
.m3-card-elevated:hover { background:${T.surfaceContainer}; box-shadow:0 2px 6px 2px rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.06); }
/* M3 Filled: stays surface-container-highest, state layer provides change */
.m3-card-filled { background:${T.surfaceContainerHighest}; }
.m3-card-filled:hover { box-shadow:0 1px 3px 1px rgba(0,0,0,0.06), 0 1px 2px 0 rgba(0,0,0,0.08); }
/* M3 Outlined: stays surface, subtle shadow + state layer */
.m3-card-outlined { background:${T.surface}; border:1px solid ${T.outlineVariant}; }
.m3-card-outlined:hover { background:${T.surfaceContainerLowest}; box-shadow:0 1px 3px 1px rgba(0,0,0,0.06), 0 1px 2px 0 rgba(0,0,0,0.08); }

/* === SWITCH === */
.m3-switch { width:52px; height:32px; border-radius:16px; position:relative; cursor:pointer; border:2px solid ${T.outline}; background:${T.surfaceContainerHighest}; padding:0; outline:none; transition:all var(--m3-dur-short4) var(--m3-ease-standard); }
.m3-switch:focus-visible { outline:2px solid ${T.primary}; outline-offset:2px; }
.m3-switch .thumb { position:absolute; border-radius:999px; background:${T.outline}; transition:all var(--m3-dur-short4) var(--m3-ease-standard) cubic-bezier(0.2,0,0,1); display:flex; align-items:center; justify-content:center; font-size:11px; }
.m3-switch:not(.on) .thumb { width:16px; height:16px; top:6px; left:6px; }
.m3-switch:not(.on):hover .thumb { width:24px; height:24px; top:2px; left:2px; }
.m3-switch:not(.on):active .thumb { width:28px; height:28px; top:0; left:0; }
.m3-switch.on { background:${T.primary}; border-color:${T.primary}; }
.m3-switch.on .thumb { background:${T.onPrimary}; width:24px; height:24px; top:2px; left:24px; color:${T.onPrimaryContainer}; }
.m3-switch.on:hover .thumb { width:28px; height:28px; top:0; left:20px; }
.m3-switch.on:active .thumb { width:28px; height:28px; top:0; left:20px; }
.m3-switch:disabled { opacity:0.38; cursor:default; }
/* State layer circle */
.m3-switch::before { content:''; position:absolute; width:40px; height:40px; border-radius:20px; top:-6px; transition:all var(--m3-dur-short4) var(--m3-ease-standard), background var(--m3-dur-short3) var(--m3-ease-standard); background:transparent; pointer-events:none; }
.m3-switch:not(.on)::before { left:-2px; }
.m3-switch.on::before { left:14px; }
.m3-switch:hover::before { background:${T.onSurface}14; }
.m3-switch:active::before { background:${T.onSurface}1f; }

/* === CHECKBOX === */
.m3-cb { display:inline-flex; align-items:center; gap:12px; cursor:pointer; font-family:Roboto,sans-serif; font-size:14px; color:${T.onSurface}; outline:none; }
.m3-cb:focus-visible .m3-cb-box { outline:2px solid ${T.primary}; outline-offset:2px; }
.m3-cb .m3-cb-box { width:18px; height:18px; border-radius:2px; border:2px solid ${T.onSurfaceVariant}; display:flex; align-items:center; justify-content:center; transition:background var(--m3-dur-short4) var(--m3-ease-standard), color var(--m3-dur-short3) var(--m3-ease-standard), border-color var(--m3-dur-short3) var(--m3-ease-standard), box-shadow var(--m3-dur-short4) var(--m3-ease-standard); position:relative; overflow:hidden; }
.m3-cb .m3-cb-box::after { content:''; position:absolute; inset:0; opacity:0; transition:opacity var(--m3-dur-short3) var(--m3-ease-standard); background:${T.onSurface}; pointer-events:none; }
.m3-cb:hover .m3-cb-box::after { opacity:0.08; }
.m3-cb:active .m3-cb-box::after { opacity:0.12; }
.m3-cb.checked .m3-cb-box { background:${T.primary}; border-color:${T.primary}; }
.m3-cb.checked .m3-cb-box::after { background:${T.onPrimary}; }

/* === RADIO === */
.m3-radio { display:flex; align-items:center; gap:12px; cursor:pointer; font-family:Roboto,sans-serif; font-size:14px; color:${T.onSurface}; outline:none; padding:4px 0; }
.m3-radio:focus-visible .m3-radio-circle { outline:2px solid ${T.primary}; outline-offset:2px; }
.m3-radio .m3-radio-circle { width:20px; height:20px; border-radius:10px; border:2px solid ${T.onSurfaceVariant}; display:flex; align-items:center; justify-content:center; transition:background var(--m3-dur-short4) var(--m3-ease-standard), color var(--m3-dur-short3) var(--m3-ease-standard), border-color var(--m3-dur-short3) var(--m3-ease-standard), box-shadow var(--m3-dur-short4) var(--m3-ease-standard); position:relative; }
.m3-radio:hover .m3-radio-circle::before { content:''; position:absolute; width:40px; height:40px; border-radius:20px; background:${T.onSurface}14; }
.m3-radio:active .m3-radio-circle::before { content:''; position:absolute; width:40px; height:40px; border-radius:20px; background:${T.onSurface}1f; }
.m3-radio.selected .m3-radio-circle { border-color:${T.primary}; }
.m3-radio.selected:hover .m3-radio-circle::before { background:${T.primary}14; }

/* === FAB === */
.m3-fab { display:inline-flex; align-items:center; justify-content:center; border:none; cursor:pointer; font-family:Roboto,sans-serif; font-weight:500; position:relative; overflow:hidden; outline:none; transition:box-shadow var(--m3-dur-medium1) var(--m3-ease-emphasized); box-shadow:0 4px 8px 3px rgba(0,0,0,0.08), 0 1px 3px 0 rgba(0,0,0,0.12); }
.m3-fab::after { content:''; position:absolute; inset:0; border-radius:inherit; opacity:0; transition:opacity var(--m3-dur-short3) var(--m3-ease-standard); pointer-events:none; }
.m3-fab:hover { box-shadow:0 6px 10px 4px rgba(0,0,0,0.08), 0 2px 3px 0 rgba(0,0,0,0.12); }
.m3-fab:hover::after { opacity:0.08; }
.m3-fab:active::after { opacity:0.12; }
.m3-fab:focus-visible { outline:2px solid ${T.primary}; outline-offset:2px; }
.m3-fab-primary { background:${T.primaryContainer}; color:${T.onPrimaryContainer}; }
.m3-fab-primary::after { background:${T.onPrimaryContainer}; }
.m3-fab-tertiary { background:${T.tertiaryContainer}; color:${T.onTertiaryContainer}; }
.m3-fab-tertiary::after { background:${T.onTertiaryContainer}; }
.m3-fab-surface { background:${T.surfaceContainerHigh}; color:${T.primary}; }
.m3-fab-surface::after { background:${T.primary}; }
.m3-fab-sm { width:40px; height:40px; border-radius:12px; font-size:24px; }
.m3-fab-md { width:56px; height:56px; border-radius:16px; font-size:24px; }
.m3-fab-lg { width:96px; height:96px; border-radius:28px; font-size:36px; }
.m3-fab-ext { height:56px; border-radius:16px; padding:0 20px; gap:12px; font-size:14px; letter-spacing:0.1px; }

/* === ICON BUTTON === */
.m3-ib { width:40px; height:40px; border-radius:20px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:20px; border:none; outline:none; position:relative; overflow:hidden; transition:background var(--m3-dur-short4) var(--m3-ease-standard), color var(--m3-dur-short3) var(--m3-ease-standard), border-color var(--m3-dur-short3) var(--m3-ease-standard), box-shadow var(--m3-dur-short4) var(--m3-ease-standard); padding:0; }
.m3-ib::after { content:''; position:absolute; inset:0; border-radius:inherit; opacity:0; transition:opacity var(--m3-dur-short3) var(--m3-ease-standard); pointer-events:none; }
.m3-ib:hover::after { opacity:0.08; }
.m3-ib:active::after { opacity:0.12; }
.m3-ib:focus-visible { outline:2px solid ${T.primary}; outline-offset:2px; }
.m3-ib:disabled { opacity:0.38; cursor:default; }
.m3-ib:disabled::after { display:none; }
.m3-ib-std { background:transparent; color:${T.onSurfaceVariant}; }
.m3-ib-std::after { background:${T.onSurfaceVariant}; }
.m3-ib-std.sel { color:${T.primary}; }
.m3-ib-filled { background:${T.surfaceContainerHighest}; color:${T.primary}; }
.m3-ib-filled::after { background:${T.primary}; }
.m3-ib-filled.sel { background:${T.primary}; color:${T.onPrimary}; }
.m3-ib-filled.sel::after { background:${T.onPrimary}; }
.m3-ib-tonal { background:${T.surfaceContainerHighest}; color:${T.onSurfaceVariant}; }
.m3-ib-tonal::after { background:${T.onSurfaceVariant}; }
.m3-ib-tonal.sel { background:${T.secondaryContainer}; color:${T.onSecondaryContainer}; }
.m3-ib-tonal.sel::after { background:${T.onSecondaryContainer}; }
.m3-ib-out { background:transparent; color:${T.onSurfaceVariant}; border:1px solid ${T.outline}; }
.m3-ib-out::after { background:${T.onSurfaceVariant}; }
.m3-ib-out.sel { background:${T.inverseSurface}; color:${T.inverseOnSurface}; border:none; }
.m3-ib-out.sel::after { background:${T.inverseOnSurface}; }

/* === NAV BAR === */
.m3-nav { display:flex; height:80px; background:${T.surfaceContainer}; justify-content:space-around; align-items:center; box-shadow:0 2px 6px 2px rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.06); }
.m3-nav-item { display:flex; flex-direction:column; align-items:center; gap:4px; background:none; border:none; cursor:pointer; padding:12px 0; min-width:64px; outline:none; }
.m3-nav-item:focus-visible { outline:2px solid ${T.primary}; outline-offset:-2px; border-radius:8px; }
.m3-nav-pill { height:32px; border-radius:16px; display:flex; align-items:center; justify-content:center; transition:width var(--m3-dur-medium2) var(--m3-ease-emphasized-decel), background var(--m3-dur-short4) var(--m3-ease-standard); position:relative; overflow:hidden; }
.m3-nav-pill::after { content:''; position:absolute; inset:0; border-radius:inherit; opacity:0; transition:opacity var(--m3-dur-short3) var(--m3-ease-standard); background:${T.onSurface}; pointer-events:none; }
.m3-nav-item:hover .m3-nav-pill::after { opacity:0.08; }
.m3-nav-item:active .m3-nav-pill::after { opacity:0.12; }

/* === TABS === */
.m3-tabs { display:flex; border-bottom:1px solid ${T.surfaceContainerHighest}; }
.m3-tab { flex:1; height:48px; display:flex; align-items:center; justify-content:center; background:none; border:none; cursor:pointer; font-family:Roboto,sans-serif; font-size:14px; font-weight:500; color:${T.onSurfaceVariant}; position:relative; overflow:hidden; outline:none; transition:color var(--m3-dur-short3) var(--m3-ease-standard); }
.m3-tab::after { content:''; position:absolute; inset:0; opacity:0; transition:opacity var(--m3-dur-short3) var(--m3-ease-standard); background:${T.primary}; pointer-events:none; }
.m3-tab:hover::after { opacity:0.08; }
.m3-tab:active::after { opacity:0.12; }
.m3-tab:focus-visible { outline:2px solid ${T.primary}; outline-offset:-2px; }
.m3-tab.active { color:${T.primary}; font-weight:600; }

/* === SLIDER === */
.m3-slider { position:relative; height:40px; display:flex; align-items:center; width:100%; }
.m3-slider input[type=range] { -webkit-appearance:none; width:100%; height:4px; background:${T.surfaceContainerHighest}; border-radius:2px; outline:none; cursor:pointer; }
.m3-slider input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:10px; background:${T.primary}; box-shadow:0 1px 2px rgba(0,0,0,0.3); cursor:pointer; transition:transform var(--m3-dur-short3) var(--m3-ease-standard); }
.m3-slider input[type=range]::-webkit-slider-thumb:hover { transform:scale(1.2); }
.m3-slider input[type=range]::-webkit-slider-thumb:active { transform:scale(1.4); }
.m3-slider input[type=range]:focus-visible::-webkit-slider-thumb { outline:2px solid ${T.primary}; outline-offset:2px; }

/* === SNACKBAR === */
.m3-snackbar { display:inline-flex; align-items:center; gap:8px; min-height:48px; border-radius:4px; background:${T.inverseSurface}; padding:0 8px 0 16px; font-family:Roboto,sans-serif; box-shadow:0 4px 8px 3px rgba(0,0,0,0.08), 0 1px 3px 0 rgba(0,0,0,0.1); }
.m3-snackbar-text { font-size:14px; color:${T.inverseOnSurface}; padding:14px 0; }
.m3-snackbar-action { background:none; border:none; color:${T.inversePrimary}; font-size:14px; font-weight:500; cursor:pointer; font-family:Roboto,sans-serif; padding:0 8px; border-radius:4px; position:relative; overflow:hidden; outline:none; }
.m3-snackbar-action:hover { background:${T.inversePrimary}14; }
.m3-snackbar-action:focus-visible { outline:2px solid ${T.inversePrimary}; }
.m3-snackbar-close { background:none; border:none; color:${T.inverseOnSurface}; font-size:16px; cursor:pointer; padding:0 8px; border-radius:20px; }
.m3-snackbar-close:hover { background:${T.inverseOnSurface}14; }

/* === DIALOG === */
.m3-dialog { width:312px; border-radius:28px; background:${T.surfaceContainerHigh}; box-shadow:0 4px 8px 3px rgba(0,0,0,0.08), 0 1px 3px 0 rgba(0,0,0,0.1); padding:24px; font-family:Roboto,sans-serif; }

/* === PROGRESS === */
.m3-progress-linear { width:100%; height:4px; border-radius:2px; background:${T.surfaceContainerHighest}; overflow:hidden; }
.m3-progress-linear-bar { height:100%; background:${T.primary}; border-radius:2px; transition:width var(--m3-dur-medium2) var(--m3-ease-standard); }
@keyframes m3-indeterminate { 0%{transform:translateX(-100%)} 100%{transform:translateX(350%)} }
.m3-progress-indet .m3-progress-linear-bar { width:40%!important; animation:m3-indeterminate 1.5s infinite ease-in-out; }

/* === TOOLTIP === */
.m3-tooltip-wrap { position:relative; display:inline-block; }
.m3-tooltip-tip { position:absolute; bottom:calc(100% + 8px); left:50%; transform:translateX(-50%); background:${T.inverseSurface}; color:${T.inverseOnSurface}; border-radius:4px; padding:6px 8px; font-size:12px; font-family:Roboto,sans-serif; white-space:nowrap; opacity:0; pointer-events:none; transition:opacity var(--m3-dur-short3) var(--m3-ease-standard); }
.m3-tooltip-wrap:hover .m3-tooltip-tip, .m3-tooltip-wrap:focus-within .m3-tooltip-tip { opacity:1; }

/* === DIVIDER === */
.m3-divider { height:1px; background:${T.outlineVariant}; width:100%; }
.m3-divider-inset { margin-left:16px; }

/* === BADGE === */
.m3-badge { min-width:16px; height:16px; border-radius:8px; background:${T.error}; color:${T.onError}; font-size:11px; font-weight:600; display:flex; align-items:center; justify-content:center; padding:0 4px; font-family:Roboto,sans-serif; }
.m3-badge-dot { width:6px; height:6px; border-radius:3px; background:${T.error}; }

/* === MENU === */
.m3-menu { width:200px; border-radius:4px; background:${T.surfaceContainer}; box-shadow:0 2px 6px 2px rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.06); padding:8px 0; font-family:Roboto,sans-serif; }
.m3-menu-item { padding:12px 16px; font-size:14px; color:${T.onSurface}; cursor:pointer; position:relative; overflow:hidden; }
.m3-menu-item:hover { background:${T.onSurface}14; }
.m3-menu-item:active { background:${T.onSurface}1f; }
.m3-menu-item:focus-visible { background:${T.onSurface}1f; outline:none; }

/* === BOTTOM SHEET === */
.m3-sheet { border-radius:28px 28px 0 0; background:${T.surfaceContainerLow}; box-shadow:0 4px 8px 3px rgba(0,0,0,0.08), 0 1px 3px 0 rgba(0,0,0,0.1); padding:0 24px 24px; font-family:Roboto,sans-serif; }
.m3-sheet-handle { width:32px; height:4px; border-radius:2px; background:${T.onSurfaceVariant}66; margin:12px auto; }

/* === DATE PICKER === */
.m3-dp { border-radius:28px; background:${T.surfaceContainerHigh}; padding:16px; font-family:Roboto,sans-serif; }
.m3-dp-day { width:32px; height:32px; border-radius:16px; border:none; cursor:pointer; font-size:13px; font-family:Roboto,sans-serif; background:transparent; color:${T.onSurface}; display:flex; align-items:center; justify-content:center; margin:1px auto; transition:all var(--m3-dur-short2) var(--m3-ease-standard); outline:none; }
.m3-dp-day:hover { background:${T.onSurface}14; }
.m3-dp-day:focus-visible { outline:2px solid ${T.primary}; }
.m3-dp-day.sel { background:${T.primary}; color:${T.onPrimary}; font-weight:600; }
.m3-dp-day.sel:hover { background:${T.primary}dd; }
`;

/* ── ICON HELPER ── */
const I = ({ n, filled, sm, xs, lg, style }) => <span className={`mi${filled ? " filled" : ""}${sm ? " sm" : ""}${xs ? " xs" : ""}${lg ? " lg" : ""}`} style={style}>{n}</span>;

/* ── CUSTOM M3 DROPDOWN ── */
function M3Dropdown({ label, value, displayValue, items, onSelect, renderItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {label && <div style={{ fontSize: 10, fontWeight: 700, color: T.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 2px 4px" }}>{label}</div>}
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
        borderRadius: 8, border: `1px solid ${open ? T.primary : T.outline}`,
        background: T.surfaceContainerHigh, color: T.onSurface, cursor: "pointer",
        fontFamily: "Roboto,sans-serif", fontSize: 13, textAlign: "left", outline: "none",
        transition: "border-color 150ms cubic-bezier(0.2,0,0,1)",
      }}
      onFocus={e => e.currentTarget.style.borderColor = T.primary}
      onBlur={e => { if (!open) e.currentTarget.style.borderColor = T.outline; }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayValue || "Select…"}</span>
        <I n={open ? "arrow_drop_up" : "arrow_drop_down"} sm style={{ color: T.onSurfaceVariant, flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
          background: T.surfaceContainer, borderRadius: 12,
          boxShadow: "0 2px 6px 2px rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.06)",
          padding: "8px 0", maxHeight: 280, overflowY: "auto",
          border: `1px solid ${T.outlineVariant}40`,
        }}>
          {items.map((item, i) => {
            const isSelected = item.key === value;
            return (
              <button key={item.key || i} onClick={() => { onSelect(item); setOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 16px", border: "none", cursor: "pointer",
                  background: isSelected ? T.secondaryContainer : "transparent",
                  color: isSelected ? T.onSecondaryContainer : T.onSurface,
                  fontFamily: "Roboto,sans-serif", fontSize: 13, textAlign: "left",
                  fontWeight: isSelected ? 600 : 400, outline: "none",
                  transition: "background 100ms cubic-bezier(0.2,0,0,1)",
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = T.onSurface + "14"; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                onFocus={e => { if (!isSelected) e.currentTarget.style.background = T.onSurface + "1f"; }}
                onBlur={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                {renderItem ? renderItem(item, isSelected) : (
                  <>
                    {isSelected && <I n="check" sm style={{ color: T.primary, flexShrink: 0 }} />}
                    <span style={{ flex: 1 }}>{item.label}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── COMPONENTS ── */

function Buttons() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <button className="m3-btn m3-btn-filled">Filled</button>
        <button className="m3-btn m3-btn-outlined">Outlined</button>
        <button className="m3-btn m3-btn-text">Text</button>
        <button className="m3-btn m3-btn-elevated">Elevated</button>
        <button className="m3-btn m3-btn-tonal">Tonal</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <button className="m3-btn m3-btn-filled"><I n="add" xs /> With Icon</button>
        <button className="m3-btn m3-btn-filled" disabled>Disabled</button>
        <button className="m3-btn m3-btn-outlined" disabled>Disabled</button>
        <button className="m3-btn m3-btn-tonal" disabled>Disabled</button>
      </div>
    </div>
  );
}

function TextFields() {
  const [v1, setV1] = useState(""); const [v2, setV2] = useState(""); const [v3, setV3] = useState(""); const [v4, setV4] = useState(""); const [v5, setV5] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {[["filled", v1, setV1, "Full name", "As shown on ID", false, false, false],
          ["filled", v2, setV2, "Search", "Search anything", true, true, false],
          ["filled", v3, setV3, "Email", "Required field", false, true, true]
        ].map(([style, val, set, label, helper, lead, trail, err], i) => (
          <div key={i} className="m3-tf-wrap" style={{ width: 230 }}>
            <div className={`m3-tf m3-tf-${style}${err ? " m3-tf-error" : ""}`}>
              {lead && <span className="m3-tf-icon"><I n="search" sm /></span>}
              <div className={`m3-tf-content`}>
                <label className={`m3-tf-label${val ? " up" : ""}`}>{label}</label>
                <input value={val} onChange={e => set(e.target.value)} />
              </div>
              {trail && <span className="m3-tf-icon m3-tf-icon-trail" style={{ cursor: "pointer" }}>{err ? <I n="error" sm /> : <I n="cancel" sm />}</span>}
            </div>
            <div className="m3-tf-helper">{helper}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {[["outlined", v4, setV4, "Username", "Choose a username", false, false, false, false],
          ["outlined", v5, setV5, "Password", "Min 8 characters", false, true, false, false],
          ["outlined", "", () => {}, "Disabled", "Cannot edit", false, false, false, true]
        ].map(([style, val, set, label, helper, lead, trail, err, dis], i) => (
          <div key={i} className="m3-tf-wrap" style={{ width: 230 }}>
            <div className={`m3-tf m3-tf-${style}${err ? " m3-tf-error" : ""}${dis ? " m3-tf-disabled" : ""}`}>
              <div className={`m3-tf-content`}>
                <label className={`m3-tf-label${val ? " up" : ""}`}>{label}</label>
                <input value={val} onChange={e => set(e.target.value)} disabled={dis} />
              </div>
              {trail && <span className="m3-tf-icon m3-tf-icon-trail"><I n="cancel" sm /></span>}
            </div>
            <div className="m3-tf-helper">{helper}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Chips() {
  const [sel, setSel] = useState({ 0: true, 1: false, 2: false, 3: true });
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {["Design", "Code", "React", "Active"].map((l, i) => (
        <button key={i} className={`m3-chip${sel[i] ? " selected" : ""}`} onClick={() => setSel({ ...sel, [i]: !sel[i] })}>
          {sel[i] && <I n="check" xs />}{l}
        </button>
      ))}
      <button className="m3-chip" disabled>Disabled</button>
    </div>
  );
}

function Cards() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
      {[["elevated", "Elevated"], ["filled", "Filled"], ["outlined", "Outlined"]].map(([v, label]) => (
        <button key={v} className={`m3-card m3-card-${v}`} tabIndex={0}>
          <div style={{ height: 100, background: `linear-gradient(135deg, ${T.primaryContainer}, ${T.tertiaryContainer})` }} />
          <div style={{ padding: 16, position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: T.onSurface, fontFamily: "Roboto,sans-serif" }}>{label}</div>
            <div style={{ fontSize: 14, color: T.onSurfaceVariant, fontFamily: "Roboto,sans-serif", marginTop: 4 }}>Supporting text</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function Switches() {
  const [s1, setS1] = useState(true); const [s2, setS2] = useState(false); const [s3, setS3] = useState(true);
  return (
    <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
      {[[s1, setS1, "Wi-Fi", false], [s2, setS2, "Bluetooth", false], [s3, setS3, "With Icon", false]].map(([val, set, label, dis], i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "Roboto,sans-serif", fontSize: 14, color: T.onSurface }}>{label}</span>
          <button className={`m3-switch${val ? " on" : ""}`} onClick={() => set(!val)} disabled={dis} role="switch" aria-checked={val}>
            <div className="thumb">{i === 2 && (val ? <I n="check" style={{ fontSize: 16 }} /> : <I n="close" style={{ fontSize: 16 }} />)}</div>
          </button>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: "Roboto,sans-serif", fontSize: 14, color: T.onSurface }}>Disabled</span>
        <button className="m3-switch" disabled role="switch" aria-checked={false}><div className="thumb" /></button>
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
        <div key={i} className={`m3-cb${checks[i] ? " checked" : ""}`} tabIndex={0} role="checkbox" aria-checked={checks[i]}
          onClick={() => toggle(i)}
          onKeyDown={e => { if (e.key === " ") { e.preventDefault(); toggle(i); } }}>
          <div className="m3-cb-box">{checks[i] && <I n="check" style={{ color: T.onPrimary, fontSize: 14, zIndex: 1 }} />}</div>
          <span>{l}</span>
        </div>
      ))}
    </div>
  );
}

function Radios() {
  const [sel, setSel] = useState(1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {["Small", "Medium", "Large"].map((l, i) => (
        <label key={i} className={`m3-radio${sel === i ? " selected" : ""}`} tabIndex={0} onClick={() => setSel(i)} onKeyDown={e => e.key === " " && setSel(i)}>
          <div className="m3-radio-circle">{sel === i && <div style={{ width: 10, height: 10, borderRadius: 5, background: T.primary, zIndex: 1 }} />}</div>
          {l}
        </label>
      ))}
    </div>
  );
}

function Sliders() {
  const [v1, setV1] = useState(40); const [v2, setV2] = useState(75);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
      <div><span style={{ fontFamily: "Roboto,sans-serif", fontSize: 12, color: T.onSurfaceVariant }}>Volume: {v1}%</span><div className="m3-slider"><input type="range" min={0} max={100} value={v1} onChange={e => setV1(+e.target.value)} /></div></div>
      <div><span style={{ fontFamily: "Roboto,sans-serif", fontSize: 12, color: T.onSurfaceVariant }}>Brightness: {v2}%</span><div className="m3-slider"><input type="range" min={0} max={100} value={v2} onChange={e => setV2(+e.target.value)} /></div></div>
    </div>
  );
}

function Fabs() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
      <button className="m3-fab m3-fab-primary m3-fab-sm" aria-label="Add"><I n="add" /></button>
      <button className="m3-fab m3-fab-primary m3-fab-md" aria-label="Add"><I n="add" /></button>
      <button className="m3-fab m3-fab-primary m3-fab-lg" aria-label="Add"><I n="add" lg /></button>
      <button className="m3-fab m3-fab-primary m3-fab-ext"><I n="add" /> Create</button>
      <button className="m3-fab m3-fab-tertiary m3-fab-md" aria-label="Add"><I n="add" /></button>
      <button className="m3-fab m3-fab-surface m3-fab-md" aria-label="Add"><I n="add" /></button>
    </div>
  );
}

function IconButtons() {
  const [s, setS] = useState({ 0: false, 1: true, 2: false, 3: true, 4: false, 5: false, 6: true });
  const toggle = i => setS(p => ({ ...p, [i]: !p[i] }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button className={`m3-ib m3-ib-std${s[0] ? " sel" : ""}`} onClick={() => toggle(0)}>{s[0] ? <I n="favorite" filled /> : <I n="favorite" />}</button>
        <button className={`m3-ib m3-ib-filled${s[1] ? " sel" : ""}`} onClick={() => toggle(1)}><I n="edit" /></button>
        <button className={`m3-ib m3-ib-tonal${s[2] ? " sel" : ""}`} onClick={() => toggle(2)}><I n="notifications" /></button>
        <button className={`m3-ib m3-ib-out${s[3] ? " sel" : ""}`} onClick={() => toggle(3)}><I n="star" /></button>
        <button className="m3-ib m3-ib-std" disabled><I n="more_vert" /></button>
      </div>
    </div>
  );
}

function NavBar() {
  const [a, setA] = useState(0);
  const items = [{ i: "home", l: "Home" }, { i: "search", l: "Search" }, { i: "inventory_2", l: "Library" }, { i: "person", l: "Profile" }];
  return (
    <div className="m3-nav" style={{ borderRadius: 16, overflow: "hidden" }}>
      {items.map((item, i) => (
        <button key={i} className="m3-nav-item" onClick={() => setA(i)}>
          <div className="m3-nav-pill" style={{ width: a === i ? 64 : 32, background: a === i ? T.secondaryContainer : "transparent" }}>
            <I n={item.i} style={{ zIndex: 1 }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: a === i ? 700 : 500, color: a === i ? T.onSurface : T.onSurfaceVariant, fontFamily: "Roboto,sans-serif" }}>{item.l}</span>
        </button>
      ))}
    </div>
  );
}

function TabsComp() {
  const [a1, setA1] = useState(0); const [a2, setA2] = useState(0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
      <div>
        <div style={{ fontFamily: "Roboto,sans-serif", fontSize: 12, color: T.onSurfaceVariant, marginBottom: 4 }}>Primary</div>
        <div className="m3-tabs">
          {["Tab 1", "Tab 2", "Tab 3"].map((t, i) => (
            <button key={i} className={`m3-tab${a1 === i ? " active" : ""}`} onClick={() => setA1(i)}>
              <span style={{ zIndex: 1 }}>{t}</span>
              {a1 === i && <div style={{ position: "absolute", bottom: 0, left: "25%", right: "25%", height: 3, borderRadius: "3px 3px 0 0", background: T.primary, zIndex: 1 }} />}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontFamily: "Roboto,sans-serif", fontSize: 12, color: T.onSurfaceVariant, marginBottom: 4 }}>Secondary</div>
        <div className="m3-tabs">
          {["All", "Unread", "Starred"].map((t, i) => (
            <button key={i} className={`m3-tab${a2 === i ? " active" : ""}`} onClick={() => setA2(i)}>
              <span style={{ zIndex: 1 }}>{t}</span>
              {a2 === i && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, borderRadius: "3px 3px 0 0", background: T.primary, zIndex: 1 }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Dialog() {
  return (
    <div className="m3-dialog">
      <div style={{ fontSize: 24, fontWeight: 400, color: T.onSurface, marginBottom: 16 }}>Dialog Title</div>
      <div style={{ fontSize: 14, color: T.onSurfaceVariant, lineHeight: 1.5, marginBottom: 24 }}>A dialog provides critical information or requires a decision.</div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button className="m3-btn m3-btn-text">Cancel</button>
        <button className="m3-btn m3-btn-text">Accept</button>
      </div>
    </div>
  );
}

function Snackbars() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="m3-snackbar"><span className="m3-snackbar-text">Photo saved</span></div>
      <div className="m3-snackbar"><span className="m3-snackbar-text">Conversation archived</span><button className="m3-snackbar-action">Undo</button></div>
      <div className="m3-snackbar"><span className="m3-snackbar-text">Can't connect</span><button className="m3-snackbar-action">Retry</button><button className="m3-snackbar-close"><I n="close" sm /></button></div>
    </div>
  );
}

function Progress() {
  const [v, setV] = useState(0);
  useEffect(() => { const i = setInterval(() => setV(p => p >= 100 ? 0 : p + 0.5), 30); return () => clearInterval(i); }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
      <div><span style={{ fontFamily: "Roboto,sans-serif", fontSize: 12, color: T.onSurfaceVariant }}>Determinate — {Math.round(v)}%</span><div className="m3-progress-linear"><div className="m3-progress-linear-bar" style={{ width: `${v}%` }} /></div></div>
      <div><span style={{ fontFamily: "Roboto,sans-serif", fontSize: 12, color: T.onSurfaceVariant }}>Indeterminate</span><div className="m3-progress-linear m3-progress-indet"><div className="m3-progress-linear-bar" /></div></div>
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <svg width={48} height={48} viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }}>
          <circle cx={24} cy={24} r={18} fill="none" stroke={T.surfaceContainerHighest} strokeWidth={4} />
          <circle cx={24} cy={24} r={18} fill="none" stroke={T.primary} strokeWidth={4} strokeDasharray={`${(v / 100) * 113.1} 113.1`} strokeLinecap="round" style={{ transition: "stroke-dasharray 50ms" }} />
        </svg>
        <span style={{ fontFamily: "Roboto,sans-serif", fontSize: 13, color: T.onSurfaceVariant }}>{Math.round(v)}%</span>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 4 }}>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: T.errorContainer }}><div style={{ width: "40%", height: "100%", borderRadius: 2, background: T.error }} /></div>
        <span style={{ fontSize: 11, color: T.error }}>Error</span>
      </div>
      <div style={{ fontSize: 12, color: T.onSurfaceVariant, marginTop: 4 }}>States: Determinate (0-100%), Indeterminate (animated), Error (error color). Linear and circular variants.</div>
    </div>
  );
}

function Tooltips() {
  return (
    <div style={{ display: "flex", gap: 24, alignItems: "center", paddingTop: 40 }}>
      <div className="m3-tooltip-wrap"><button className="m3-ib m3-ib-std" aria-label="Favorite"><I n="favorite" /></button><div className="m3-tooltip-tip">Add to favorites</div></div>
      <div className="m3-tooltip-wrap"><button className="m3-ib m3-ib-std" aria-label="Share"><I n="share" /></button><div className="m3-tooltip-tip">Share</div></div>
      <div className="m3-tooltip-wrap"><button className="m3-ib m3-ib-std" aria-label="More"><I n="more_vert" /></button><div className="m3-tooltip-tip">More options</div></div>
    </div>
  );
}

function Badges() {
  return (
    <div style={{ display: "flex", gap: 28, alignItems: "center", paddingTop: 8 }}>
      {[[0, "notifications", "dot"], [3, "mail", "count"], [128, "chat", "count"]].map(([count, icon, type], i) => (
        <div key={i} style={{ position: "relative", display: "inline-block" }}>
          <button className="m3-ib m3-ib-std" aria-label={icon}><I n={icon} /></button>
          <div style={{ position: "absolute", top: type === "dot" ? 6 : 0, right: type === "dot" ? 6 : -4 }}>
            {type === "dot" ? <div className="m3-badge-dot" /> : <div className="m3-badge">{count}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function Menu() {
  return (
    <div className="m3-menu">
      {["Cut", "Copy", "Paste"].map((item, i) => <div key={i} className="m3-menu-item" tabIndex={0}>{item}</div>)}
      <div className="m3-divider" />
      <div className="m3-menu-item" tabIndex={0}>Select All</div>
    </div>
  );
}

function BottomSheet() {
  return (
    <div className="m3-sheet" style={{ width: 260 }}>
      <div className="m3-sheet-handle" />
      <div style={{ fontSize: 16, fontWeight: 500, color: T.onSurface, marginBottom: 8 }}>Bottom Sheet</div>
      <div style={{ fontSize: 14, color: T.onSurfaceVariant, lineHeight: 1.5 }}>Supplementary content anchored to the bottom.</div>
    </div>
  );
}

function DatePicker() {
  const [sel, setSel] = useState(15);
  return (
    <div className="m3-dp" style={{ width: 260 }}>
      <div style={{ padding: "4px 0 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 14, color: T.onSurfaceVariant }}>April 2026</span>
        <div style={{ display: "flex", gap: 2 }}><button className="m3-ib m3-ib-std"><I n="chevron_left" /></button><button className="m3-ib m3-ib-std"><I n="chevron_right" /></button></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, textAlign: "center" }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} style={{ fontSize: 11, color: T.onSurfaceVariant, padding: 4, fontWeight: 500 }}>{d}</div>)}
        {[0, 0, 0, 0].map((_, i) => <div key={"e" + i} />)}
        {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
          <button key={d} className={`m3-dp-day${sel === d ? " sel" : ""}`} onClick={() => setSel(d)}>{d}</button>
        ))}
      </div>
    </div>
  );
}

function Dividers() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      <span style={{ fontFamily: "Roboto,sans-serif", fontSize: 12, color: T.onSurfaceVariant }}>Full width</span>
      <div className="m3-divider" />
      <span style={{ fontFamily: "Roboto,sans-serif", fontSize: 12, color: T.onSurfaceVariant }}>Inset</span>
      <div className="m3-divider m3-divider-inset" />
    </div>
  );
}

/* ═══════════════════════════════════════════
   THEME & COLOR GUIDANCE PAGES
   ═══════════════════════════════════════════ */

function ColorRolesGuide() {
  const roles = [
    { group: "Primary", desc: "Your main brand/action color. Used for the most important actions and key components.", tokens: [
      { name: "primary", use: "Filled buttons, FAB, active indicators, links", color: T.primary, on: T.onPrimary },
      { name: "onPrimary", use: "Text/icons on primary fills", color: T.onPrimary, on: T.primary },
      { name: "primaryContainer", use: "Tonal buttons, selected chips, nav indicator", color: T.primaryContainer, on: T.onPrimaryContainer },
      { name: "onPrimaryContainer", use: "Text/icons on primaryContainer", color: T.onPrimaryContainer, on: T.primaryContainer },
    ]},
    { group: "Secondary", desc: "Less prominent components. Expands color expression without competing with primary.", tokens: [
      { name: "secondary", use: "Secondary buttons, toggles", color: T.secondary, on: T.onSecondary },
      { name: "onSecondary", use: "Text/icons on secondary", color: T.onSecondary, on: T.secondary },
      { name: "secondaryContainer", use: "Filter chips, tonal buttons, nav pill", color: T.secondaryContainer, on: T.onSecondaryContainer },
      { name: "onSecondaryContainer", use: "Text/icons on secondaryContainer", color: T.onSecondaryContainer, on: T.secondaryContainer },
    ]},
    { group: "Tertiary", desc: "Contrasting accents that balance primary and secondary. Draws attention to specific elements.", tokens: [
      { name: "tertiary", use: "Accent actions, category indicators", color: T.tertiary || T.primary, on: "#FFFFFF" },
      { name: "tertiaryContainer", use: "Accent cards, decorative highlights", color: T.tertiaryContainer, on: T.onTertiaryContainer },
      { name: "onTertiaryContainer", use: "Text/icons on tertiaryContainer", color: T.onTertiaryContainer, on: T.tertiaryContainer },
    ]},
    { group: "Error", desc: "Critical actions and error states. Immediately draws user attention to problems.", tokens: [
      { name: "error", use: "Error text, destructive buttons, error icons", color: T.error, on: T.onError },
      { name: "onError", use: "Text/icons on error fills", color: T.onError, on: T.error },
      { name: "errorContainer", use: "Error banners, error text field background", color: T.errorContainer, on: T.onErrorContainer },
      { name: "onErrorContainer", use: "Text/icons on errorContainer", color: T.onErrorContainer, on: T.errorContainer },
    ]},
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: T.onSurfaceVariant, margin: 0 }}>
        Color roles are semantic assignments — they define <em>what a color is for</em>, not what it looks like. The same role maps to different hex values across light, dark, and contrast themes. Always use roles, never hardcode hex values.
      </p>
      {roles.map(r => (
        <div key={r.group}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: T.onSurface, margin: "0 0 4px", fontFamily: "Roboto,sans-serif" }}>{r.group}</h3>
          <p style={{ fontSize: 13, color: T.onSurfaceVariant, margin: "0 0 12px", lineHeight: 1.5 }}>{r.desc}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
            {r.tokens.map(t => (
              <div key={t.name} style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${T.outlineVariant}40` }}>
                <div style={{ height: 48, background: t.color, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 12px" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: t.on, fontFamily: "Roboto,sans-serif" }}>{t.name}</span>
                </div>
                <div style={{ padding: "8px 12px", background: T.surfaceContainerLow }}>
                  <div style={{ fontSize: 11, fontFamily: "monospace", color: T.onSurfaceVariant }}>{t.color}</div>
                  <div style={{ fontSize: 11, color: T.onSurface, marginTop: 2, lineHeight: 1.4 }}>{t.use}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SurfaceGuide() {
  const surfaces = [
    { name: "surface", color: T.surface, desc: "Page background, app canvas" },
    { name: "surfaceContainerLowest", color: T.surfaceContainerLowest, desc: "Lowest depth — content cards" },
    { name: "surfaceContainerLow", color: T.surfaceContainerLow, desc: "Low — sidebar, elevated cards" },
    { name: "surfaceContainer", color: T.surfaceContainer, desc: "Default — nav bars, menus" },
    { name: "surfaceContainerHigh", color: T.surfaceContainerHigh, desc: "High — search, dialogs, inputs" },
    { name: "surfaceContainerHighest", color: T.surfaceContainerHighest, desc: "Highest — text field fills" },
  ];
  const outlines = [
    { name: "outline", color: T.outline, desc: "Input borders, strong dividers" },
    { name: "outlineVariant", color: T.outlineVariant, desc: "Subtle separators, decorative dividers" },
  ];
  const inverse = [
    { name: "inverseSurface", color: T.inverseSurface, desc: "Snackbar background" },
    { name: "inverseOnSurface", color: T.inverseOnSurface, desc: "Snackbar text" },
    { name: "inversePrimary", color: T.inversePrimary, desc: "Actions on inverse surface" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: T.onSurfaceVariant, margin: 0 }}>
        Surface colors create depth and hierarchy through tonal elevation. Higher containers are more prominent. In M3, elevation is expressed through color tone rather than shadow alone.
      </p>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: T.onSurface, margin: "0 0 12px" }}>Surface Elevation Scale</h3>
        <div style={{ display: "flex", gap: 0, borderRadius: 16, overflow: "hidden", border: `1px solid ${T.outlineVariant}40` }}>
          {surfaces.map(s => (
            <div key={s.name} style={{ flex: 1, padding: "20px 8px 12px", background: s.color, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: s.color, border: `1px solid ${T.outline}40`, boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
              <div style={{ fontSize: 9, fontWeight: 600, color: T.onSurface, textAlign: "center", wordBreak: "break-all", fontFamily: "monospace" }}>{s.name.replace("surfaceContainer","sC-").replace("surface","surf")}</div>
              <div style={{ fontSize: 9, color: T.onSurfaceVariant, textAlign: "center", lineHeight: 1.3 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: T.onSurface, margin: "0 0 8px" }}>Outline & Borders</h3>
        <div style={{ display: "flex", gap: 8 }}>
          {outlines.map(o => (
            <div key={o.name} style={{ flex: 1, padding: 16, borderRadius: 12, border: `2px solid ${o.color}`, background: T.surface }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.onSurface, fontFamily: "monospace" }}>{o.name}</div>
              <div style={{ fontSize: 11, color: T.onSurfaceVariant, marginTop: 4 }}>{o.desc}</div>
              <div style={{ fontSize: 11, fontFamily: "monospace", color: T.onSurfaceVariant, marginTop: 2 }}>{o.color}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: T.onSurface, margin: "0 0 8px" }}>Inverse Colors</h3>
        <div style={{ padding: 16, borderRadius: 12, background: T.inverseSurface, display: "flex", gap: 16, flexWrap: "wrap" }}>
          {inverse.map(i => (
            <div key={i.name} style={{ flex: "1 1 120px" }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: i.color, marginBottom: 6, border: `1px solid ${T.inverseOnSurface}33` }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: T.inverseOnSurface, fontFamily: "monospace" }}>{i.name}</div>
              <div style={{ fontSize: 11, color: T.inverseOnSurface + "cc" }}>{i.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StateLayers() {
  const states = [
    { name: "Hover", opacity: "8%", hex: "14", desc: "Mouse enters the component boundary" },
    { name: "Focus", opacity: "12%", hex: "1f", desc: "Keyboard focus via Tab or programmatic focus" },
    { name: "Pressed", opacity: "12%", hex: "1f", desc: "Active pointer down / touch contact" },
    { name: "Dragged", opacity: "16%", hex: "29", desc: "Element is being dragged" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: T.onSurfaceVariant, margin: 0 }}>
        State layers are semi-transparent overlays using the component's content color. They communicate interactivity without changing the component's base color. The overlay color always matches the "on" color of the container.
      </p>
      <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${T.outlineVariant}40` }}>
        {states.map((s, i) => (
          <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", borderBottom: i < states.length - 1 ? `1px solid ${T.outlineVariant}30` : "none" }}>
            <div style={{ width: 48, height: 36, borderRadius: 8, background: T.primary, position: "relative", overflow: "hidden", flexShrink: 0 }}>
              <div style={{ position: "absolute", inset: 0, background: T.onPrimary, opacity: parseInt(s.hex, 16) / 255 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.onSurface }}>{s.name}</div>
              <div style={{ fontSize: 12, color: T.onSurfaceVariant }}>{s.desc}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.primary, fontFamily: "monospace" }}>{s.opacity}</div>
              <div style={{ fontSize: 11, color: T.onSurfaceVariant, fontFamily: "monospace" }}>0x{s.hex}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: 16, borderRadius: 12, background: T.primaryContainer + "44", border: `1px solid ${T.primary}22` }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.onSurface, marginBottom: 6 }}><I n="info" sm style={{ verticalAlign: "middle", marginRight: 6, color: T.primary }} />How to Apply</div>
        <div style={{ fontSize: 12, color: T.onSurfaceVariant, lineHeight: 1.6 }}>
          Use a <code style={{ background: T.surfaceContainerHighest, padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>::after</code> pseudo-element with the content color at the state opacity. For a filled button (primary background), the state layer uses <code style={{ background: T.surfaceContainerHighest, padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>onPrimary</code> at 8% on hover. For an outlined button (transparent background), use <code style={{ background: T.surfaceContainerHighest, padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>primary</code> at 8%.
        </div>
      </div>
    </div>
  );
}

function ThemingGuide() {
  const guidelines = [
    { icon: "palette", title: "5 Key Colors Generate Everything", desc: "Primary, Secondary, Tertiary, Neutral, and Neutral Variant. The M3 algorithm derives all tonal palettes (13 tones each) from these 5 source colors using the HCT color space." },
    { icon: "tune", title: "HCT Color Space", desc: "Hue (0–360°) defines the color family. Chroma controls saturation/purity. Tone (0–100) controls lightness — this is the key to accessible contrast, as tone differences directly map to contrast ratios." },
    { icon: "contrast", title: "Accessible by Default", desc: "M3 color pairings guarantee minimum 3:1 contrast. Primary/onPrimary, Container/onContainer pairs are built to meet WCAG AA. Tone differences of 40+ between paired roles ensure readability." },
    { icon: "dark_mode", title: "Dark Theme ≠ Inverted Colors", desc: "Dark themes don't simply invert the light palette. Surface uses very dark grays (not pure black), primary shifts to lighter tones (tone 80 vs 40), and containers use darker tones (tone 30 vs 90)." },
    { icon: "auto_awesome", title: "Dynamic Color", desc: "On Android 12+, M3 can extract colors from the user's wallpaper and generate a personalized scheme. The same tonal mapping ensures accessibility regardless of the source color." },
    { icon: "swap_horiz", title: "Never Mix Pairs", desc: "Always pair primary with onPrimary, primaryContainer with onPrimaryContainer. Never pair primary with onPrimaryContainer — the contrast ratios aren't guaranteed to be accessible." },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: T.onSurfaceVariant, margin: "0 0 4px" }}>
        The M3 theming system transforms a single source color into a complete, accessible color scheme. Understanding these principles ensures your UI stays coherent across all theme modes.
      </p>
      {guidelines.map((g, i) => (
        <div key={i} style={{ display: "flex", gap: 14, padding: 16, borderRadius: 12, background: T.surfaceContainerLow, border: `1px solid ${T.outlineVariant}30` }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: T.primaryContainer, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <I n={g.icon} sm style={{ color: T.onPrimaryContainer }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.onSurface, marginBottom: 4 }}>{g.title}</div>
            <div style={{ fontSize: 13, color: T.onSurfaceVariant, lineHeight: 1.55 }}>{g.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ColorMappingGuide() {
  const mappings = [
    { component: "Filled Button", container: "primary", content: "onPrimary", state: "onPrimary @ 8%" },
    { component: "Tonal Button", container: "secondaryContainer", content: "onSecondaryContainer", state: "onSecondaryContainer @ 8%" },
    { component: "Outlined Button", container: "transparent", content: "primary", state: "primary @ 8%" },
    { component: "FAB", container: "primaryContainer", content: "onPrimaryContainer", state: "onPrimaryContainer @ 8%" },
    { component: "Text Field (Filled)", container: "surfaceContainerHighest", content: "onSurface", state: "onSurface @ 8%" },
    { component: "Card (Elevated)", container: "surfaceContainerLow", content: "onSurface", state: "onSurface @ 8%" },
    { component: "Navigation Bar", container: "surfaceContainer", content: "onSurfaceVariant", state: "onSurface @ 8%" },
    { component: "Nav Active Pill", container: "secondaryContainer", content: "onSecondaryContainer", state: "—" },
    { component: "Dialog", container: "surfaceContainerHigh", content: "onSurface", state: "—" },
    { component: "Snackbar", container: "inverseSurface", content: "inverseOnSurface", state: "—" },
    { component: "Chip (Selected)", container: "secondaryContainer", content: "onSecondaryContainer", state: "onSecondaryContainer @ 8%" },
    { component: "Switch (On)", container: "primary", content: "onPrimary", state: "primary @ 8%" },
    { component: "Error State", container: "error", content: "onError", state: "onError @ 8%" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: T.onSurfaceVariant, margin: 0 }}>
        Every M3 component maps to specific color roles. This table shows which token applies where — use it to ensure custom components follow the same patterns.
      </p>
      <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${T.outlineVariant}40` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr", padding: "8px 12px", fontSize: 10, fontWeight: 700, color: T.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.06em", background: T.surfaceContainerHigh }}>
          <span>Component</span><span>Container</span><span>Content</span><span>State Layer</span>
        </div>
        {mappings.map((m, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr", padding: "8px 12px", fontSize: 12, borderBottom: i < mappings.length - 1 ? `1px solid ${T.outlineVariant}25` : "none", alignItems: "center" }}>
            <span style={{ fontWeight: 500, color: T.onSurface }}>{m.component}</span>
            <span style={{ fontFamily: "monospace", fontSize: 10, color: T.primary }}>{m.container}</span>
            <span style={{ fontFamily: "monospace", fontSize: 10, color: T.onSurfaceVariant }}>{m.content}</span>
            <span style={{ fontFamily: "monospace", fontSize: 10, color: T.onSurfaceVariant }}>{m.state}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FullPalettePreview() {
  const allTokens = Object.entries(T).filter(([k]) => k !== "name");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: T.onSurfaceVariant, margin: 0 }}>
        All color tokens in the current theme ({T.name}). Switch themes in the sidebar to see how every token changes across Light, Dark, and Contrast modes.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 6 }}>
        {allTokens.map(([key, val]) => (
          <div key={key} style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${T.outlineVariant}40` }}>
            <div style={{ height: 32, background: val }} />
            <div style={{ padding: "4px 8px", background: T.surfaceContainerLow }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: T.onSurface, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{key}</div>
              <div style={{ fontSize: 9, color: T.onSurfaceVariant, fontFamily: "monospace" }}>{val}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── COMPONENT LIST ── */
/* ── M3 ACCESSIBILITY ── */
function M3Icons() {
  const axes = [
    { name: "Fill", range: "0–1", desc: "0 = outlined, 1 = filled. Animate on selection." },
    { name: "Weight", range: "100–700", desc: "Stroke weight. 400 = regular. Match to body text." },
    { name: "Grade", range: "-25–200", desc: "Fine thickness. -25 for light-on-dark." },
    { name: "Optical Size", range: "20–48dp", desc: "Adjusts stroke for size. Smaller = thicker." },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 14, color: T.onSurfaceVariant, lineHeight: 1.6 }}>
        Material Symbols — 2,500+ variable font icons in 3 styles (Outlined, Rounded, Sharp). Loaded via Google Fonts CDN with 4 adjustable axes.
      </div>
      <div style={{ fontSize: 16, fontWeight: 500, color: T.onSurface }}>3 Styles</div>
      <div style={{ display: "flex", gap: 16 }}>
        {["Outlined","Rounded","Sharp"].map(style => (
          <div key={style} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["search","favorite","settings","home","star","info"].map(ic => (
                <I key={ic} n={ic} sm />
              ))}
            </div>
            <span style={{ fontSize: 12, color: T.onSurfaceVariant }}>{style}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 16, fontWeight: 500, color: T.onSurface, marginTop: 4 }}>Variable Font Axes</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {axes.map(a => (
          <div key={a.name} style={{ padding: "8px 12px", borderRadius: 12, border: `1px solid ${T.outlineVariant}40`, background: T.surfaceContainerLowest }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: T.onSurface }}>{a.name}</span>
              <span style={{ fontSize: 11, color: T.onSurfaceVariant, fontFamily: "monospace" }}>{a.range}</span>
            </div>
            <div style={{ fontSize: 12, color: T.onSurfaceVariant, marginTop: 2 }}>{a.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 16, fontWeight: 500, color: T.onSurface, marginTop: 4 }}>Sizing</div>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
        {[{s:20,l:"20dp"},{s:24,l:"24dp"},{s:40,l:"40dp"},{s:48,l:"48dp"}].map(z => (
          <div key={z.s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <I n="settings" style={{ fontSize: z.s }} />
            <span style={{ fontSize: 10, color: T.onSurfaceVariant }}>{z.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function M3Accessibility() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "Roboto,sans-serif" }}>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: T.onSurfaceVariant, margin: 0 }}>
        M3 is built with accessibility as a core design value. Tonal palettes guarantee contrast, touch targets are enforced, and reduced motion is supported by default.
      </p>
      <div>
        <div style={{ fontSize: 16, fontWeight: 500, color: T.onSurface, marginBottom: 8 }}>Contrast Requirements</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { bg: T.surface, fg: T.onSurface, label: "onSurface", ratio: "15:1" },
            { bg: T.surface, fg: T.onSurfaceVariant, label: "onSurfaceVariant", ratio: "7:1" },
            { bg: T.primary, fg: T.onPrimary, label: "onPrimary", ratio: "7.5:1" },
            { bg: T.primaryContainer, fg: T.onPrimaryContainer, label: "onPrimaryContainer", ratio: "12:1" },
            { bg: T.surface, fg: T.outline, label: "outline", ratio: "4.6:1" },
          ].map(c => (
            <div key={c.label} style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
              <div style={{ width: 72, height: 36, borderRadius: 12, background: c.bg, border: `1px solid ${T.outlineVariant}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: c.fg, fontSize: 12, fontWeight: 500 }}>Aa</span>
              </div>
              <span style={{ fontSize: 10, color: T.onSurfaceVariant }}>{c.label}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: parseFloat(c.ratio) >= 4.5 ? "#0E700E" : "#B3261E", fontFamily: "monospace" }}>{c.ratio} ✓</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 500, color: T.onSurface, marginBottom: 8 }}>Focus Indicators</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          <button className="f-btn f-btn-primary" style={{ background: T.primary, color: T.onPrimary, height: 36, borderRadius: 20, border: "none", padding: "0 20px", fontFamily: "Roboto,sans-serif", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Tab to me</button>
          <button className="m3-btn m3-btn-outlined">Then me</button>
          <button className="m3-btn m3-btn-tonal">Then me</button>
        </div>
        <p style={{ fontSize: 12, color: T.onSurfaceVariant, margin: 0 }}>Press Tab — a 2px primary outline ring appears with 2px offset. Every interactive M3 component supports <code style={{ background: T.surfaceContainerHigh, padding: "1px 4px", borderRadius: 4, fontSize: 11 }}>:focus-visible</code>.</p>
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 500, color: T.onSurface, marginBottom: 8 }}>Touch Targets</div>
        <p style={{ fontSize: 12, color: T.onSurfaceVariant, margin: "0 0 8px" }}>Minimum 48×48dp for all interactive elements. Even if visually smaller (e.g. checkbox 18dp, radio 20dp), the hit area extends to 48dp via padding.</p>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 4, border: `2px dashed ${T.outline}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 18, height: 18, borderRadius: 2, background: T.primary }} />
          </div>
          <span style={{ fontSize: 11, color: T.onSurfaceVariant }}>Visual: 18dp · Touch target: 48dp</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 500, color: T.onSurface, marginBottom: 6 }}>Keyboard Patterns</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {[["Tab / Shift+Tab", "Move focus between elements"], ["Enter / Space", "Activate buttons, toggle switches/checkboxes"], ["Arrow keys", "Navigate radio groups, tabs, menus"], ["Escape", "Close dialogs, menus — return focus to trigger"]].map(([key, desc]) => (
            <div key={key} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: `1px solid ${T.outlineVariant}30` }}>
              <code style={{ fontSize: 11, background: T.surfaceContainerHigh, padding: "2px 6px", borderRadius: 6, fontFamily: "monospace", color: T.onSurface, whiteSpace: "nowrap", flexShrink: 0 }}>{key}</code>
              <span style={{ fontSize: 12, color: T.onSurfaceVariant }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 500, color: T.onSurface, marginBottom: 6 }}>ARIA & Semantics</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[["role='checkbox'", "Checkboxes with aria-checked"], ["role='switch'", "Switch toggles with aria-checked"], ["role='radio'", "Radio buttons with aria-checked within radiogroup"], ["role='tablist'", "Tab containers with role='tab' items"], ["role='dialog'", "Dialogs with aria-modal and aria-labelledby"]].map(([role, desc]) => (
            <div key={role} style={{ padding: "6px 10px", borderRadius: 8, background: T.surfaceContainer }}>
              <code style={{ fontSize: 11, color: T.primary, fontFamily: "monospace" }}>{role}</code>
              <span style={{ fontSize: 11, color: T.onSurfaceVariant, marginLeft: 8 }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: 12, borderRadius: 12, background: T.primaryContainer, border: `1px solid ${T.primary}20` }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: T.onPrimaryContainer }}>Reduced Motion</div>
        <p style={{ fontSize: 11, color: T.onPrimaryContainer, margin: "4px 0 0", opacity: 0.8 }}>All M3 transitions respect <code style={{ fontFamily: "monospace" }}>prefers-reduced-motion: reduce</code>. Animation durations collapse to near-zero. State changes remain visible but instant.</p>
      </div>
    </div>
  );
}

/* ── M3 COMPONENT PREVIEWS ── */
/* ── M3 CONTENT DESIGN ── */
function M3ContentDesign() {
  const principles = [
    { title: "Be concise", desc: "Write short, scannable text focused on a limited number of ideas. Prune every excess word.", do: "Save changes?", dont: "Would you like to save the changes you have made to this document before closing?" },
    { title: "Be direct", desc: "Use simple, direct language. If there's a simpler way to say it, use it. Lead with the objective.", do: "To remove a photo, drag it to the trash", dont: "You can remove a photo by dragging it to the trash" },
    { title: "Be useful", desc: "Only describe what's necessary. Reveal detail as users explore. Don't front-load complexity.", do: "Delete this photo?", dont: "Are you sure you want to delete this photo? This action is permanent and cannot be undone. The photo will be removed from your library." },
  ];
  const patterns = [
    { type: "Button labels", rule: "Use verbs. 1–2 words. Match the action.", good: "Save", bad: "Click here to save" },
    { type: "Error messages", rule: "Say what happened + how to fix it.", good: "No internet connection. Check your Wi-Fi.", bad: "Error 503" },
    { type: "Empty states", rule: "Explain what goes here + how to start.", good: "No messages yet. Start a conversation.", bad: "Nothing to show" },
    { type: "Confirmation", rule: "State the action + consequence.", good: "Delete 3 files? You can't undo this.", bad: "Are you sure?" },
    { type: "Success", rule: "Confirm completion. Brief.", good: "Password updated", bad: "Your password has been successfully updated!" },
    { type: "Labels & hints", rule: "Sentence case. No periods.", good: "Email address", bad: "Enter Your Email Address Here." },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "Roboto,sans-serif" }}>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: T.onSurfaceVariant, margin: 0 }}>
        Content design makes interfaces usable through clear, concise language. Words are a design material — as important as color, typography, and spacing.
      </p>
      <div>
        <div style={{ fontSize: 18, fontWeight: 400, color: T.onSurface, marginBottom: 12 }}>Writing Principles</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {principles.map(p => (
            <div key={p.title} style={{ borderRadius: 12, border: `1px solid ${T.outlineVariant}40`, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", background: T.surfaceContainer }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.onSurface }}>{p.title}</div>
                <div style={{ fontSize: 12, color: T.onSurfaceVariant, marginTop: 2 }}>{p.desc}</div>
              </div>
              <div style={{ display: "flex", gap: 0 }}>
                <div style={{ flex: 1, padding: "10px 16px", background: "#E8F5E920", borderRight: `1px solid ${T.outlineVariant}20` }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#0E700E", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>✓ Do</div>
                  <div style={{ fontSize: 13, color: T.onSurface }}>{p.do}</div>
                </div>
                <div style={{ flex: 1, padding: "10px 16px", background: "#FDECEA20" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#B3261E", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>✗ Don't</div>
                  <div style={{ fontSize: 13, color: T.onSurface }}>{p.dont}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 400, color: T.onSurface, marginBottom: 10 }}>Content Patterns</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
          {patterns.map(p => (
            <div key={p.type} style={{ padding: 12, borderRadius: 12, background: T.surfaceContainerLowest, border: `1px solid ${T.outlineVariant}30` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.onSurface, marginBottom: 2 }}>{p.type}</div>
              <div style={{ fontSize: 11, color: T.onSurfaceVariant, marginBottom: 8 }}>{p.rule}</div>
              <div style={{ fontSize: 12, color: "#0E700E", marginBottom: 2 }}>✓ {p.good}</div>
              <div style={{ fontSize: 12, color: "#B3261E" }}>✗ {p.bad}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 400, color: T.onSurface, marginBottom: 8 }}>Style Rules</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            ["Sentence case", "Capitalize only the first word + proper nouns. Never ALL CAPS."],
            ["Present tense", "\"File uploads\" not \"File will be uploaded\""],
            ["Active voice", "\"You deleted 3 files\" not \"3 files were deleted\""],
            ["Second person", "\"Your files\" not \"My files\" (except for ownership emphasis)"],
            ["No periods in UI", "Skip periods on buttons, labels, headings, menu items"],
            ["Numerals", "Use \"3\" not \"three\". Exception: mixing — \"Enter two 3s\""],
          ].map(([rule, example]) => (
            <div key={rule} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: `1px solid ${T.outlineVariant}20` }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.onSurface, minWidth: 120 }}>{rule}</span>
              <span style={{ fontSize: 12, color: T.onSurfaceVariant }}>{example}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const M3_PREVIEWS = {
  buttons: () => <div style={{ display: "flex", gap: 4 }}><div style={{ height: 18, padding: "0 8px", borderRadius: 9, background: T.primary, color: T.onPrimary, fontSize: 8, fontWeight: 500, display: "flex", alignItems: "center" }}>Filled</div><div style={{ height: 18, padding: "0 8px", borderRadius: 9, border: `1px solid ${T.outline}`, fontSize: 8, color: T.primary, display: "flex", alignItems: "center" }}>Outlined</div></div>,
  "text-fields": () => <div style={{ height: 22, borderRadius: "4px 4px 0 0", background: T.surfaceContainerHighest, borderBottom: `2px solid ${T.primary}`, padding: "0 6px", display: "flex", alignItems: "center" }}><span style={{ fontSize: 8, color: T.onSurfaceVariant }}>Label</span></div>,
  chips: () => <div style={{ display: "flex", gap: 3 }}><div style={{ height: 16, padding: "0 6px", borderRadius: 4, background: T.secondaryContainer, fontSize: 8, color: T.onSecondaryContainer, display: "flex", alignItems: "center", gap: 2 }}>✓ Active</div><div style={{ height: 16, padding: "0 6px", borderRadius: 4, border: `1px solid ${T.outline}`, fontSize: 8, color: T.onSurfaceVariant, display: "flex", alignItems: "center" }}>Chip</div></div>,
  cards: () => <div style={{ borderRadius: 6, overflow: "hidden", border: `1px solid ${T.outlineVariant}` }}><div style={{ height: 16, background: `linear-gradient(135deg, ${T.primaryContainer}, ${T.tertiaryContainer || T.primaryContainer})` }} /><div style={{ padding: 4 }}><div style={{ width: 32, height: 3, borderRadius: 1, background: T.onSurface, opacity: 0.4 }} /></div></div>,
  switches: () => <div style={{ display: "flex", gap: 4, alignItems: "center" }}><div style={{ width: 24, height: 12, borderRadius: 6, background: T.primary, position: "relative" }}><div style={{ width: 10, height: 10, borderRadius: 5, background: T.onPrimary, position: "absolute", top: 1, left: 13 }} /></div><div style={{ width: 24, height: 12, borderRadius: 6, background: T.surfaceContainerHighest, border: `1px solid ${T.outline}`, position: "relative" }}><div style={{ width: 6, height: 6, borderRadius: 3, background: T.outline, position: "absolute", top: 2, left: 2 }} /></div></div>,
  checkboxes: () => <div style={{ display: "flex", gap: 4, alignItems: "center" }}><div style={{ width: 10, height: 10, borderRadius: 1, background: T.primary, display: "flex", alignItems: "center", justifyContent: "center", color: T.onPrimary, fontSize: 7 }}>✓</div><div style={{ width: 10, height: 10, borderRadius: 1, border: `1.5px solid ${T.onSurfaceVariant}` }} /></div>,
  radios: () => <div style={{ display: "flex", gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: 5, border: `2px solid ${T.primary}`, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 4, height: 4, borderRadius: 2, background: T.primary }} /></div><div style={{ width: 10, height: 10, borderRadius: 5, border: `1.5px solid ${T.onSurfaceVariant}` }} /></div>,
  sliders: () => <div style={{ position: "relative", height: 12, display: "flex", alignItems: "center" }}><div style={{ width: "100%", height: 3, borderRadius: 1, background: T.surfaceContainerHighest }}><div style={{ width: "55%", height: "100%", borderRadius: 1, background: T.primary }} /></div><div style={{ width: 8, height: 8, borderRadius: 4, background: T.primary, position: "absolute", left: "53%" }} /></div>,
  fabs: () => <div style={{ display: "flex", gap: 4 }}><div style={{ width: 24, height: 24, borderRadius: 6, background: T.primaryContainer, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>+</div><div style={{ width: 18, height: 18, borderRadius: 5, background: T.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: T.primary }}>✎</div></div>,
  "icon-buttons": () => <div style={{ display: "flex", gap: 3 }}>{["♡", "★", "⋮"].map(i => <div key={i} style={{ width: 18, height: 18, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: T.onSurfaceVariant }}>{i}</div>)}</div>,
  "nav-bar": () => <div style={{ display: "flex", gap: 2, background: T.surfaceContainer, borderRadius: 4, padding: 3 }}>{[true,false,false].map((a,i) => <div key={i} style={{ flex: 1, height: 12, borderRadius: 6, background: a ? T.secondaryContainer : "transparent" }} />)}</div>,
  tabs: () => <div style={{ display: "flex", borderBottom: `1px solid ${T.outlineVariant}`, gap: 0 }}><div style={{ padding: "2px 6px", fontSize: 8, fontWeight: 600, color: T.primary, borderBottom: `2px solid ${T.primary}` }}>Tab</div><div style={{ padding: "2px 6px", fontSize: 8, color: T.onSurfaceVariant }}>Tab 2</div></div>,
  dialogs: () => <div style={{ borderRadius: 8, background: T.surfaceContainerHigh, padding: 5, boxShadow: `0 4px 8px rgba(0,0,0,0.08)` }}><div style={{ width: 28, height: 2.5, borderRadius: 1, background: T.onSurface, opacity: 0.5, marginBottom: 3 }} /><div style={{ display: "flex", gap: 2, justifyContent: "flex-end" }}><div style={{ width: 18, height: 8, borderRadius: 4, background: T.primary }} /></div></div>,
  snackbar: () => <div style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 2, background: T.inverseSurface, padding: "3px 6px" }}><span style={{ fontSize: 7, color: T.inverseOnSurface }}>Message</span><span style={{ fontSize: 7, color: T.inversePrimary }}>Action</span></div>,
  progress: () => <div style={{ display: "flex", gap: 6, alignItems: "center" }}><div style={{ flex: 1, height: 3, borderRadius: 1, background: T.surfaceContainerHighest }}><div style={{ width: "60%", height: "100%", borderRadius: 1, background: T.primary }} /></div><div style={{ width: 12, height: 12, border: `2px solid ${T.surfaceContainerHighest}`, borderTopColor: T.primary, borderRadius: 6 }} /></div>,
  tooltips: () => <div style={{ padding: "2px 5px", borderRadius: 4, background: T.inverseSurface, color: T.inverseOnSurface, fontSize: 7 }}>Tooltip</div>,
  badges: () => <div style={{ display: "flex", gap: 3, alignItems: "center" }}><div style={{ minWidth: 10, height: 10, borderRadius: 5, background: T.error, color: T.onError, fontSize: 6, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 2px" }}>3</div><div style={{ width: 5, height: 5, borderRadius: 3, background: T.error }} /></div>,
  menus: () => <div style={{ borderRadius: 3, background: T.surfaceContainer, padding: 2, boxShadow: `0 2px 4px rgba(0,0,0,0.08)` }}>{["Edit","Copy","Delete"].map(l => <div key={l} style={{ padding: "1.5px 5px", fontSize: 7, color: T.onSurface }}>{l}</div>)}</div>,
  "bottom-sheets": () => <div style={{ borderRadius: "8px 8px 0 0", background: T.surfaceContainerLow, padding: "4px 12px" }}><div style={{ width: 20, height: 3, borderRadius: 2, background: T.onSurfaceVariant, margin: "0 auto 3px", opacity: 0.4 }} /><div style={{ width: 40, height: 2, borderRadius: 1, background: T.onSurface, opacity: 0.3 }} /></div>,
  dividers: () => <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><div style={{ height: 1, background: T.outlineVariant }} /><div style={{ height: 1, background: T.outlineVariant, marginLeft: 10 }} /></div>,
  "date-pickers": () => <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1 }}>{[14,15,16,17].map(d => <div key={d} style={{ width: 14, height: 14, borderRadius: 7, background: d===15 ? T.primary : "transparent", color: d===15 ? T.onPrimary : T.onSurface, fontSize: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>{d}</div>)}</div>,
  "guide-color-roles": () => <div style={{ display: "flex", gap: 2 }}>{[T.primary, T.secondary, T.tertiary||T.primary, T.error].map((c,i) => <div key={i} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />)}</div>,
  "guide-surfaces": () => <div style={{ display: "flex", gap: 1 }}>{[T.surfaceContainerLowest, T.surfaceContainerLow, T.surfaceContainer, T.surfaceContainerHigh, T.surfaceContainerHighest].map((c,i) => <div key={i} style={{ width: 14, height: 20, background: c, borderRadius: 2 }} />)}</div>,
  "guide-state-layers": () => <div style={{ display: "flex", gap: 2, alignItems: "center" }}>{["8%","12%","16%"].map(o => <div key={o} style={{ width: 22, height: 14, borderRadius: 3, background: T.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 6, color: T.onSurface }}>{o}</div>)}</div>,
  "guide-theming": () => <div style={{ display: "flex", gap: 2 }}>{["#F44336","#2196F3","#4CAF50","#FF9800"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: 5, background: c }} />)}</div>,
  "guide-mapping": () => <div style={{ fontSize: 7, color: T.onSurfaceVariant, lineHeight: 1.3 }}>primary → button<br/>surface → card</div>,
  "guide-palette": () => <div style={{ display: "flex", gap: 1 }}>{[T.primary, T.primaryContainer, T.secondary, T.secondaryContainer, T.surface, T.surfaceContainer].map((c,i) => <div key={i} style={{ width: 10, height: 14, borderRadius: 2, background: c, border: `0.5px solid ${T.outlineVariant}40` }} />)}</div>,
  "a11y": () => <div style={{ display: "flex", gap: 3, alignItems: "center" }}><div style={{ width: 14, height: 14, borderRadius: 7, border: `1.5px solid #0E700E`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#0E700E" }}>✓</div><span style={{ fontSize: 8, color: T.onSurfaceVariant }}>WCAG AA</span></div>,
  "content-design": () => <div style={{ fontSize: 8, color: T.onSurfaceVariant, lineHeight: 1.3 }}>✓ Save<br/>✗ Click here</div>,
  charts: () => <div style={{display:"flex",gap:2,alignItems:"flex-end",padding:"4px 0"}}>{[35,55,40,70,50].map((h,i)=><div key={i} style={{width:8,height:h/3,borderRadius:2,background:[T.primary,T.secondary,T.tertiary,T.error,"#4CAF50"][i]}}/>)}</div>,
  "pat-dashboard": () => <div style={{display:"flex",gap:3}}>{["$42K","1.2K","+18%"].map((v,i)=><div key={i} style={{fontSize:7,fontWeight:600,color:T.onSurface,background:T.surfaceContainerLow||T.surface,border:`1px solid ${T.outlineVariant}`,borderRadius:8,padding:"2px 4px"}}>{v}</div>)}</div>,
  "pat-form": () => <div style={{display:"flex",flexDirection:"column",gap:2}}><div style={{height:10,borderRadius:"4px 4px 0 0",background:T.surfaceContainerHighest||T.surface,borderBottom:`2px solid ${T.primary}`}}/><div style={{height:10,borderRadius:"4px 4px 0 0",background:T.surfaceContainerHighest||T.surface,borderBottom:`1px solid ${T.outline}`}}/></div>,
  "pat-list-detail": () => <div style={{display:"flex",gap:1,height:20}}><div style={{width:24,background:T.surfaceContainerLow||T.surface,borderRadius:8,padding:1}}><div style={{height:4,borderRadius:4,background:T.primaryContainer,marginBottom:1}}/></div><div style={{flex:1,background:T.surface,borderRadius:8,border:`1px solid ${T.outlineVariant}`}}/></div>,
  "pat-app-shell": () => <div style={{display:"flex",flexDirection:"column",height:24,borderRadius:8,border:`1px solid ${T.outlineVariant}`,overflow:"hidden"}}><div style={{height:6,background:T.surfaceContainerLow||T.surface}}/><div style={{display:"flex",flex:1}}><div style={{width:10,background:T.surfaceContainerLow||T.surface}}/><div style={{flex:1}}/></div></div>,
  "pat-login": () => <div style={{display:"flex",justifyContent:"center"}}><div style={{width:40,borderRadius:8,border:`1px solid ${T.outlineVariant}`,padding:3}}><div style={{height:4,borderRadius:4,background:T.primary,marginBottom:2}}/><div style={{height:6,borderRadius:4,background:T.surfaceContainerHighest||T.surface,marginBottom:2}}/><div style={{height:6,borderRadius:16,background:T.primary}}/></div></div>,
  "pat-settings": () => <div style={{display:"flex",gap:1,height:20}}><div style={{width:16,borderRadius:8}}>{["⚙","🔔"].map((i,idx)=><div key={idx} style={{fontSize:6,padding:1,color:idx===0?T.primary:T.onSurfaceVariant}}>{i}</div>)}</div><div style={{flex:1,borderRadius:8,border:`1px solid ${T.outlineVariant}`}}/></div>,
  "pat-search": () => <div><div style={{height:10,borderRadius:16,background:T.surfaceContainerHighest||T.surface,padding:"0 3px",fontSize:6,color:T.onSurfaceVariant,display:"flex",alignItems:"center"}}>🔍 Search</div><div style={{display:"flex",gap:2,marginTop:2}}>{[1,2].map(i=><div key={i} style={{flex:1,height:8,borderRadius:8,background:T.surfaceContainerLow||T.surface}}/>)}</div></div>,
  "pat-wizard": () => <div style={{display:"flex",gap:2,alignItems:"center"}}>{[1,2,3].map(s=><><div key={s} style={{width:10,height:10,borderRadius:5,background:s===1?T.primary:s===2?T.primaryContainer:"transparent",border:`1.5px solid ${s<=2?T.primary:T.outline}`,fontSize:5,color:s===1?T.onPrimary:s===2?T.primary:T.onSurfaceVariant,display:"flex",alignItems:"center",justifyContent:"center"}}>{s}</div>{s<3&&<div style={{flex:1,height:1,background:s===1?T.primary:T.outlineVariant}}/>}</>)}</div>,
  "pat-data-table": () => <div style={{borderRadius:8,border:`1px solid ${T.outlineVariant}`,overflow:"hidden"}}><div style={{display:"flex",padding:2,borderBottom:`1px solid ${T.outlineVariant}`}}><span style={{flex:1,fontSize:6,fontWeight:500,color:T.onSurfaceVariant}}>Name</span><span style={{fontSize:6,fontWeight:500,color:T.onSurfaceVariant}}>Val</span></div><div style={{padding:2,fontSize:6,color:T.onSurface}}>Row 1</div></div>,
};

/* ── M3 PATTERN DEMOS ── */
function M3PatDashboard(){
  return <div style={{display:"flex",flexDirection:"column",gap:12,fontFamily:"Roboto,sans-serif"}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
      {[{l:"Revenue",v:"$42.8K",p:60},{l:"Users",v:"1,247",p:75},{l:"Growth",v:"+18%",p:90}].map(s=>
        <div key={s.l} className="m3-card m3-card-elevated" style={{padding:12,borderRadius:12,cursor:"default"}}>
          <div style={{fontSize:11,color:T.onSurfaceVariant}}>{s.l}</div>
          <div style={{fontSize:18,fontWeight:500,color:T.onSurface}}>{s.v}</div>
          <div style={{height:4,borderRadius:2,background:T.surfaceContainerHighest,marginTop:8}}><div style={{width:`${s.p}%`,height:"100%",borderRadius:2,background:T.primary}}/></div>
        </div>
      )}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:8}}>
      <div className="m3-card m3-card-outlined" style={{padding:14,borderRadius:12,cursor:"default"}}>
        <div style={{fontSize:12,fontWeight:500,color:T.onSurface,marginBottom:8}}>Monthly Revenue</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:4,height:60}}>
          {[40,65,50,80,70,90,75].map((h,i)=><div key={i} style={{flex:1,background:T.primary,borderRadius:4,height:`${h}%`,opacity:0.6+i*0.05}}/>)}
        </div>
      </div>
      <div className="m3-card m3-card-filled" style={{padding:14,borderRadius:12,cursor:"default"}}>
        <div style={{fontSize:12,fontWeight:500,color:T.onSurface,marginBottom:8}}>By Region</div>
        {[{l:"NA",w:80},{l:"EMEA",w:65},{l:"APAC",w:45}].map(r=>
          <div key={r.l} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
            <span style={{fontSize:10,color:T.onSurfaceVariant,width:30}}>{r.l}</span>
            <div style={{flex:1,height:6,borderRadius:3,background:T.surfaceContainerHighest}}><div style={{width:`${r.w}%`,height:"100%",borderRadius:3,background:T.tertiary}}/></div>
          </div>
        )}
      </div>
    </div>
  </div>;
}
function M3PatForm(){
  return <div style={{display:"flex",flexDirection:"column",gap:12,fontFamily:"Roboto,sans-serif",maxWidth:320}}>
    <div><label style={{fontSize:12,fontWeight:500,color:T.onSurfaceVariant}}>Full Name *</label><div style={{height:56,border:`1px solid ${T.outline}`,borderRadius:4,padding:"8px 16px",marginTop:4,display:"flex",alignItems:"center",color:T.onSurfaceVariant,fontSize:14}}>Jane Doe</div></div>
    <div><label style={{fontSize:12,fontWeight:500,color:T.onSurfaceVariant}}>Email *</label><div style={{height:56,border:`1px solid ${T.outline}`,borderRadius:4,padding:"8px 16px",marginTop:4,display:"flex",alignItems:"center",color:T.onSurfaceVariant,fontSize:14}}>jane@company.com</div></div>
    <div style={{display:"flex",gap:8,marginTop:4}}><button className="m3-btn m3-btn-filled" style={{borderRadius:20}}>Submit</button><button className="m3-btn m3-btn-outlined" style={{borderRadius:20}}>Cancel</button></div>
  </div>;
}
function M3PatListDetail(){
  const [sel,setSel]=useState(0);
  const items=[{t:"Dashboard Report",d:"Q4 revenue analysis"},{t:"User Metrics",d:"Monthly active users"},{t:"System Alerts",d:"Health monitoring"}];
  return <div style={{display:"flex",border:`1px solid ${T.outlineVariant}`,borderRadius:12,overflow:"hidden",height:180,fontFamily:"Roboto,sans-serif"}}>
    <div style={{width:160,background:T.surfaceContainerLow}}>
      {items.map((it,i)=><div key={i} onClick={()=>setSel(i)} style={{padding:"12px 16px",fontSize:13,cursor:"pointer",background:sel===i?T.secondaryContainer:"transparent",color:sel===i?T.onSecondaryContainer:T.onSurface,fontWeight:sel===i?500:400,borderRadius:sel===i?"0 28px 28px 0":"0"}}>{it.t}</div>)}
    </div>
    <div style={{flex:1,padding:16,background:T.surface}}>
      <div style={{fontSize:16,fontWeight:500,color:T.onSurface,marginBottom:4}}>{items[sel].t}</div>
      <div style={{fontSize:13,color:T.onSurfaceVariant}}>{items[sel].d}</div>
      <div style={{marginTop:12,display:"flex",gap:8}}><button className="m3-btn m3-btn-tonal" style={{borderRadius:20,fontSize:12}}>Edit</button><button className="m3-btn m3-btn-text" style={{fontSize:12}}>Delete</button></div>
    </div>
  </div>;
}
function M3PatLogin(){
  return <div style={{maxWidth:280,margin:"0 auto",fontFamily:"Roboto,sans-serif"}}>
    <div style={{textAlign:"center",marginBottom:16}}>
      <div style={{width:48,height:48,borderRadius:16,background:T.primaryContainer,display:"inline-flex",alignItems:"center",justifyContent:"center",color:T.onPrimaryContainer,fontSize:20,fontWeight:500,marginBottom:8}}>A</div>
      <div style={{fontSize:22,fontWeight:400,color:T.onSurface}}>Welcome back</div>
      <div style={{fontSize:14,color:T.onSurfaceVariant}}>Sign in to your account</div>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{height:56,border:`1px solid ${T.outline}`,borderRadius:4,padding:"8px 16px",display:"flex",alignItems:"center",color:T.onSurfaceVariant,fontSize:14}}>Email</div>
      <div style={{height:56,border:`1px solid ${T.outline}`,borderRadius:4,padding:"8px 16px",display:"flex",alignItems:"center",color:T.onSurfaceVariant,fontSize:14}}>Password</div>
      <button className="m3-btn m3-btn-filled" style={{borderRadius:20,width:"100%",marginTop:4}}>Sign In</button>
    </div>
  </div>;
}
function M3PatWizard(){
  const [step,setStep]=useState(1);
  return <div style={{fontFamily:"Roboto,sans-serif"}}>
    <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:16}}>
      {["Account","Profile","Review"].map((s,i)=><React.Fragment key={s}>
        {i>0&&<div style={{flex:1,height:2,background:i<=step?T.primary:T.outlineVariant}}/>}
        <div onClick={()=>setStep(i)} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}>
          <div style={{width:24,height:24,borderRadius:12,background:i<=step?T.primary:T.surfaceContainerHighest,color:i<=step?T.onPrimary:T.onSurfaceVariant,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:500}}>{i<step?"✓":i+1}</div>
          <span style={{fontSize:12,color:i===step?T.onSurface:T.onSurfaceVariant,fontWeight:i===step?500:400}}>{s}</span>
        </div>
      </React.Fragment>)}
    </div>
    <div className="m3-card m3-card-outlined" style={{padding:16,borderRadius:12,minHeight:60,cursor:"default"}}>
      <div style={{fontSize:14,fontWeight:500,color:T.onSurface,marginBottom:8}}>Step {step+1}: {["Account","Profile","Review"][step]}</div>
      <div style={{fontSize:13,color:T.onSurfaceVariant}}>{step===2?"Review your information and submit.":"Enter your details below."}</div>
    </div>
    <div style={{display:"flex",justifyContent:"space-between",marginTop:12}}>
      <button className="m3-btn m3-btn-outlined" onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0} style={{borderRadius:20,opacity:step===0?0.38:1}}>Back</button>
      <button className="m3-btn m3-btn-filled" onClick={()=>setStep(Math.min(2,step+1))} style={{borderRadius:20}}>{step===2?"Submit":"Next"}</button>
    </div>
  </div>;
}

function M3PatAppShell(){
  return <div style={{border:`1px solid ${T.outlineVariant}`,borderRadius:12,overflow:"hidden",fontFamily:"Roboto,sans-serif",fontSize:11}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 16px",background:T.surface,borderBottom:`1px solid ${T.outlineVariant}`}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}><span className="material-symbols-outlined" style={{fontSize:18,color:T.onSurface}}>menu</span><span style={{fontSize:16,fontWeight:400,color:T.onSurface,letterSpacing:"-0.25px"}}>App Name</span></div>
      <div style={{width:28,height:28,borderRadius:14,background:T.primaryContainer}}/>
    </div>
    <div style={{display:"flex",height:110}}>
      <div style={{width:56,background:T.surfaceContainerLow,display:"flex",flexDirection:"column",alignItems:"center",gap:6,paddingTop:8}}>
        {[{i:"home",a:true},{i:"dashboard",a:false},{i:"settings",a:false}].map(n=>
          <div key={n.i} style={{width:40,padding:"4px 0",borderRadius:20,background:n.a?T.secondaryContainer:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <span className="material-symbols-outlined" style={{fontSize:18,color:n.a?T.onSecondaryContainer:T.onSurfaceVariant}}>{n.i}</span>
          </div>
        )}
      </div>
      <div style={{flex:1,padding:12,display:"flex",alignItems:"center",justifyContent:"center",color:T.onSurfaceVariant}}>Main Content Area</div>
    </div>
    <div style={{display:"flex",justifyContent:"space-around",padding:"6px 0",borderTop:`1px solid ${T.outlineVariant}`,background:T.surfaceContainer}}>
      {["home","search","person"].map((i,idx)=><div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
        <div style={{width:32,height:18,borderRadius:9,background:idx===0?T.secondaryContainer:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}><span className="material-symbols-outlined" style={{fontSize:16,color:idx===0?T.onSecondaryContainer:T.onSurfaceVariant}}>{i}</span></div>
      </div>)}
    </div>
  </div>;
}
function M3PatSettings(){
  const [tab,setTab]=useState(0);
  const tabs=["General","Security","Notifications"];
  return <div style={{display:"flex",border:`1px solid ${T.outlineVariant}`,borderRadius:12,overflow:"hidden",height:160,fontFamily:"Roboto,sans-serif"}}>
    <div style={{width:56,background:T.surfaceContainerLow,display:"flex",flexDirection:"column",alignItems:"center",gap:8,paddingTop:12}}>
      {tabs.map((t,i)=><div key={t} onClick={()=>setTab(i)} style={{width:40,padding:"4px 0",borderRadius:20,background:tab===i?T.secondaryContainer:"transparent",display:"flex",flexDirection:"column",alignItems:"center",cursor:"pointer"}}>
        <span className="material-symbols-outlined" style={{fontSize:18,color:tab===i?T.onSecondaryContainer:T.onSurfaceVariant}}>{["settings","lock","notifications"][i]}</span>
      </div>)}
    </div>
    <div style={{flex:1,padding:16}}>
      <div style={{fontSize:16,fontWeight:500,color:T.onSurface,marginBottom:12}}>{tabs[tab]}</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <div style={{height:40,border:`1px solid ${T.outline}`,borderRadius:4,padding:"8px 16px",display:"flex",alignItems:"center",color:T.onSurfaceVariant,fontSize:13}}>Display Name</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontSize:13,color:T.onSurfaceVariant}}>Dark Mode</span><div style={{width:32,height:18,borderRadius:9,background:T.primary,cursor:"pointer",position:"relative"}}><div style={{width:14,height:14,borderRadius:7,background:T.onPrimary,position:"absolute",top:2,right:2}}/></div></div>
      </div>
    </div>
  </div>;
}
function M3PatSearch(){
  return <div style={{display:"flex",flexDirection:"column",gap:10,fontFamily:"Roboto,sans-serif"}}>
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",borderRadius:28,background:T.surfaceContainerHighest}}>
      <span className="material-symbols-outlined" style={{fontSize:20,color:T.onSurfaceVariant}}>search</span>
      <span style={{fontSize:14,color:T.onSurfaceVariant}}>Search components...</span>
    </div>
    <div style={{display:"flex",gap:6}}>
      {["All","Actions","Inputs","Navigation"].map((f,i)=><button key={f} className={`m3-btn ${i===0?"m3-btn-filled":"m3-btn-outlined"}`} style={{borderRadius:20,fontSize:12,padding:"0 12px",height:28}}>{f}</button>)}
    </div>
    {[{t:"Button",d:"5 variants: Filled, Outlined, Text"},{t:"Text Field",d:"Filled and Outlined variants"},{t:"Tabs",d:"Primary indicator bar"}].map(r=>
      <div key={r.t} className="m3-card m3-card-outlined" style={{padding:12,borderRadius:12,cursor:"default",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontSize:13,fontWeight:500,color:T.onSurface}}>{r.t}</div><div style={{fontSize:11,color:T.onSurfaceVariant,marginTop:2}}>{r.d}</div></div>
        <span className="material-symbols-outlined" style={{fontSize:18,color:T.onSurfaceVariant}}>chevron_right</span>
      </div>
    )}
  </div>;
}
function M3PatFeed(){
  return <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,fontFamily:"Roboto,sans-serif"}}>
    {[{t:"Material 3 Expressive",d:"New components and motion",img:"palette"},{t:"Dynamic Color",d:"Personalized color themes",img:"colorize"},{t:"Adaptive Layouts",d:"Canonical layout patterns",img:"devices"},{t:"Design Tokens",d:"Systematic theming approach",img:"token"}].map(card=>
      <div key={card.t} className="m3-card m3-card-filled" style={{borderRadius:12,overflow:"hidden",cursor:"default"}}>
        <div style={{height:60,background:T.primaryContainer,display:"flex",alignItems:"center",justifyContent:"center"}}><span className="material-symbols-outlined" style={{fontSize:28,color:T.onPrimaryContainer}}>{card.img}</span></div>
        <div style={{padding:12}}>
          <div style={{fontSize:13,fontWeight:500,color:T.onSurface}}>{card.t}</div>
          <div style={{fontSize:11,color:T.onSurfaceVariant,marginTop:2}}>{card.d}</div>
        </div>
      </div>
    )}
  </div>;
}
function M3PatDataTable(){
  const cols=["Name","Status","Amount","Date"];
  const rows=[["Jane Doe","Active","$1,200","Apr 12"],["John Smith","Pending","$890","Apr 11"],["Alice Chen","Active","$2,340","Apr 10"]];
  return <div style={{fontFamily:"Roboto,sans-serif"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <div style={{display:"flex",gap:6}}>
        <div style={{display:"flex",alignItems:"center",gap:4,padding:"6px 12px",borderRadius:20,background:T.surfaceContainerHighest,fontSize:12,color:T.onSurfaceVariant}}><span className="material-symbols-outlined" style={{fontSize:16}}>filter_list</span>Filter</div>
        <div style={{display:"flex",alignItems:"center",gap:4,padding:"6px 12px",borderRadius:20,background:T.surfaceContainerHighest,fontSize:12,color:T.onSurfaceVariant}}><span className="material-symbols-outlined" style={{fontSize:16}}>search</span>Search</div>
      </div>
      <button className="m3-btn m3-btn-tonal" style={{borderRadius:20,fontSize:12}}>Export</button>
    </div>
    <div className="m3-card m3-card-outlined" style={{borderRadius:12,overflow:"hidden",cursor:"default"}}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
      <thead><tr>{cols.map(c=><th key={c} style={{textAlign:"left",padding:"10px 16px",borderBottom:`1px solid ${T.outlineVariant}`,color:T.onSurfaceVariant,fontWeight:500,fontSize:12}}>{c}</th>)}</tr></thead>
      <tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j} style={{padding:"10px 16px",borderBottom:`1px solid ${T.outlineVariant}`,color:j===1?(c==="Active"?T.tertiary:T.error):T.onSurface,fontWeight:j===1?500:400}}>{c}</td>)}</tr>)}</tbody>
    </table>
    </div>
  </div>;
}

const COMPS = [
  { id: "pat-dashboard", name: "Analytical Dashboard", cat: "Patterns", desc: "Stat cards, charts, and data tables composed into an analytics overview.", render: M3PatDashboard },
  { id: "pat-form", name: "Forms", cat: "Patterns", desc: "Text fields, validation, and button bar composed into a data entry form.", render: M3PatForm },
  { id: "pat-list-detail", name: "List-Detail", cat: "Patterns", desc: "M3 canonical layout — master list alongside detail pane.", render: M3PatListDetail },
  { id: "pat-app-shell", name: "App Shell", cat: "Patterns", desc: "Top app bar, navigation rail, content area, and bottom nav.", render: M3PatAppShell },
  { id: "pat-login", name: "Login / Auth", cat: "Patterns", desc: "Authentication form with brand header, text fields, and filled buttons.", render: M3PatLogin },
  { id: "pat-settings", name: "Settings Page", cat: "Patterns", desc: "Navigation rail with form sections for application configuration.", render: M3PatSettings },
  { id: "pat-search", name: "Search Results", cat: "Patterns", desc: "Search bar with filterable result cards and pagination.", render: M3PatSearch },
  { id: "pat-wizard", name: "Wizard / Stepper", cat: "Patterns", desc: "Multi-step form with stepper indicator and validation.", render: M3PatWizard },
  { id: "pat-feed", name: "Feed", cat: "Patterns", desc: "M3 canonical layout — scrollable grid of content cards (news, social).", render: M3PatFeed },
  { id: "pat-data-table", name: "Data Table Page", cat: "Patterns", desc: "Filter bar, sortable data grid, and pagination for tabular data views.", render: M3PatDataTable },
  { id: "charts", name: "Charts & Dataviz", cat: "Patterns", desc: "12 chart types: line, area, column, pie, scatter, bar, donut, spline, stacked column, gauge, heatmap, treemap.", render: () => null },
  { id: "ag-grid", name: "AG Grid", cat: "Components & Patterns", desc: "AG Grid data table themed with Material 3 tokens. Sorting, filtering, pagination, row selection.", render: () => null },
  { id: "buttons", name: "Buttons", cat: "Components & Patterns", desc: "Hover, focus (Tab), press, and disabled states all respond to real interaction.", render: Buttons },
  { id: "text-fields", name: "Text Fields", cat: "Components & Patterns", desc: "Click to focus (border thickens + turns primary, label floats). Hover for state layer. Type to see input. Error variant has red border + icon.", render: TextFields },
  { id: "chips", name: "Chips", cat: "Components & Patterns", desc: "Click to toggle selected (fill + checkmark). Hover and focus-visible states via CSS.", render: Chips },
  { id: "cards", name: "Cards", cat: "Components & Patterns", desc: "Hover raises elevation. Focus-visible shows outline. Active shows pressed state layer.", render: Cards },
  { id: "switches", name: "Switches", cat: "Components & Patterns", desc: "Click to toggle. Thumb resizes: 16dp→24dp on hover→28dp on press. State layer circle appears.", render: Switches },
  { id: "checkboxes", name: "Checkboxes", cat: "Components & Patterns", desc: "Click or Space to toggle. Hover shows state layer. Focus-visible shows outline.", render: Checkboxes },
  { id: "radios", name: "Radio Buttons", cat: "Components & Patterns", desc: "Click to select. Hover shows 40dp state layer circle. One selection at a time.", render: Radios },
  { id: "sliders", name: "Sliders", cat: "Components & Patterns", desc: "Drag thumb or click track. Thumb scales up on hover and press.", render: Sliders },
  { id: "fabs", name: "FAB", cat: "Components & Patterns", desc: "Hover raises elevation (Level 3→4). State layers on press. Focus-visible ring.", render: Fabs },
  { id: "icon-buttons", name: "Icon Buttons", cat: "Components & Patterns", desc: "Click to toggle selected. 4 variants with different fill behaviors. Hover/press state layers.", render: IconButtons },
  { id: "nav-bar", name: "Navigation Bar", cat: "Components & Patterns", desc: "Click items. Active shows 64dp pill indicator. Hover shows state layer on pill.", render: NavBar },
  { id: "tabs", name: "Tabs", cat: "Components & Patterns", desc: "Click to switch. Hover shows primary state layer. Active shows indicator bar.", render: TabsComp },
  { id: "dialogs", name: "Dialogs", cat: "Components & Patterns", desc: "Action buttons respond to hover/focus/press. Dialog container at Level 3 elevation.", render: Dialog },
  { id: "snackbar", name: "Snackbar", cat: "Components & Patterns", desc: "Action and close buttons respond to hover/focus.", render: Snackbars },
  { id: "progress", name: "Progress Indicators", cat: "Components & Patterns", desc: "Animated linear and circular indicators. Determinate fills in real-time.", render: Progress },
  { id: "tooltips", name: "Tooltips", cat: "Components & Patterns", desc: "Hover or focus the icon buttons to see tooltips appear.", render: Tooltips },
  { id: "badges", name: "Badges", cat: "Components & Patterns", desc: "Dot and count badges anchored to interactive icon buttons.", render: Badges },
  { id: "menus", name: "Menus", cat: "Components & Patterns", desc: "Hover and focus-visible highlights on menu items. Tab through items.", render: Menu },
  { id: "bottom-sheets", name: "Bottom Sheets", cat: "Components & Patterns", desc: "Drag handle and content layout.", render: BottomSheet },
  { id: "dividers", name: "Dividers", cat: "Components & Patterns", desc: "Full-width and inset dividers.", render: Dividers },
  { id: "date-pickers", name: "Date Pickers", cat: "Components & Patterns", desc: "Click days to select. Hover shows surface overlay. Focus-visible shows ring. Nav buttons interactive.", render: DatePicker },
  // Foundations
  { id: "dl-icons", name: "Iconography", cat: "Foundations", desc: "Material Symbols — 2,500+ variable font icons. 3 styles (Outlined/Rounded/Sharp), 4 axes (Fill, Weight, Grade, Optical Size).", render: M3Icons },
  { id: "a11y", name: "Accessibility", cat: "Foundations", desc: "WCAG AA contrast, focus indicators, touch targets (48dp), keyboard patterns, ARIA roles, reduced motion.", render: M3Accessibility },
  { id: "content-design", name: "Content Design", cat: "Foundations", desc: "UX writing principles: concise, direct, useful. Content patterns for buttons, errors, empty states, confirmations.", render: M3ContentDesign },
  { id: "tokens", name: "Tokens", cat: "Foundations", desc: "Token reference for all design tokens — colors, spacing, typography, and elevation with contrast ratios.", render: () => null },
  { id: "audit", name: "Design Audit", cat: "Foundations", desc: "Paste code to audit for raw hex values, wrong APIs, accessibility issues, and dark mode compliance.", render: () => null },
  // Guides
  { id: "guide-color-roles", name: "Color Roles", cat: "Foundations", desc: "Primary, Secondary, Tertiary, Error — what each accent color group is for and where to use it.", render: ColorRolesGuide },
  { id: "guide-surfaces", name: "Surfaces & Depth", cat: "Foundations", desc: "Surface container scale, outline tokens, and inverse colors for building visual hierarchy.", render: SurfaceGuide },
  { id: "guide-state-layers", name: "State Layers", cat: "Foundations", desc: "Hover (8%), Focus (12%), Pressed (12%), Dragged (16%) — how to apply interactive overlays.", render: StateLayers },
  { id: "guide-theming", name: "Theming Principles", cat: "Foundations", desc: "HCT color space, tonal palettes, dark theme rules, dynamic color, and accessible pairing rules.", render: ThemingGuide },
  { id: "guide-mapping", name: "Component Mapping", cat: "Foundations", desc: "Which color token maps to which component — container, content, and state layer assignments.", render: ColorMappingGuide },
  { id: "guide-palette", name: "Full Palette", cat: "Foundations", desc: "All tokens in the current theme visualized. Switch themes to compare values side by side.", render: FullPalettePreview },
];
const CATS = ["Foundations", "Components & Patterns", "Patterns"];

/* ── APP ── */
export default function App() {
  const [sel, setSel] = useState(null);
  const [q, setQ] = useState("");
  const [sb, setSb] = useState(true);
  const [themeKey, setThemeKey] = useState("light");
  const [customColor, setCustomColor] = useState("#6750A4");
  const [isDarkCustom, setIsDarkCustom] = useState(false);
  const [density, setDensity] = useState(0);
  const [ctrlOpen, setCtrlOpen] = useState(true); // 0=default, -1=comfortable, -2=compact, -3=most compact
  
  // Update global T reference when theme changes
  T = themeKey === "custom" ? generateM3Theme(customColor, isDarkCustom) : THEMES[themeKey];
  const CSS = buildCSS(T);
  const d = density * 4; // density offset in px (e.g. -1 → -4px)
  // M3 Density: ONLY vertical height/padding changes. Font size, horizontal padding, icon size, and gaps stay constant.
  // Layout density: sidebar, main padding, card grid scale for visual consistency across systems.
  const L = { // Layout density
    0:    { sideW: 260, mainP: 28, cardMin: 220, gap: 10, topP: "10px 20px", sideP: "18px 14px 10px", sideFontSize: 13, navP: "8px 10px" },
    [-1]: { sideW: 240, mainP: 24, cardMin: 200, gap: 8,  topP: "8px 16px",  sideP: "14px 12px 8px",  sideFontSize: 13, navP: "7px 9px" },
    [-2]: { sideW: 220, mainP: 20, cardMin: 180, gap: 8,  topP: "6px 14px",  sideP: "12px 10px 6px",  sideFontSize: 12, navP: "6px 8px" },
    [-3]: { sideW: 200, mainP: 16, cardMin: 160, gap: 6,  topP: "4px 12px",  sideP: "10px 8px 4px",   sideFontSize: 12, navP: "5px 8px" },
  }[density];
  const btnH = 40 + d;
  const tfH = 56 + d;
  const chipH = 32 + d;
  const tabH = 48 + d;
  const navH = 80 + d * 2;
  const ibH = 40 + d;
  const fabSmH = 40 + d;
  const fabMdH = 56 + d;
  const menuPadV = Math.max(6, 12 + d);
  const dpDay = Math.max(24, 32 + d);
  const densityCSS = density === 0 ? "" : `
    /* === DENSITY SCALE ${density} === */
    /* Heights decrease by 4dp per step. Font sizes, horizontal padding, gaps, and icon sizes are UNCHANGED. */
    .m3-btn { height:${btnH}px; }
    .m3-tf { height:${tfH}px; }
    .m3-tf-filled .m3-tf-content { padding-top:${Math.max(4, 8 + d)}px; }
    .m3-tf-label { font-size:${tfH <= 48 ? 14 : 16}px; }
    .m3-tf-filled:focus-within .m3-tf-label,
    .m3-tf-filled .m3-tf-label.up { top:${Math.max(4, 8 + d)}px; }
    .m3-chip { height:${Math.max(24, chipH)}px; }
    .m3-switch { width:${52 + d}px; height:${32 + d}px; border-radius:${(32 + d) / 2}px; }
    .m3-switch:not(.on) .thumb { width:${Math.max(12, 16 + d)}px; height:${Math.max(12, 16 + d)}px; top:${Math.max(4, 6 + d / 2)}px; left:${Math.max(4, 6 + d / 2)}px; }
    .m3-switch.on .thumb { width:${Math.max(16, 24 + d)}px; height:${Math.max(16, 24 + d)}px; top:${Math.max(0, 2 + d / 2)}px; left:${24 + d / 2}px; }
    .m3-ib { width:${ibH}px; height:${ibH}px; border-radius:${ibH / 2}px; }
    .m3-fab-sm { width:${fabSmH}px; height:${fabSmH}px; }
    .m3-fab-md { width:${fabMdH}px; height:${fabMdH}px; }
    .m3-nav { height:${navH}px; }
    .m3-nav-pill { height:${32 + d}px; border-radius:${(32 + d) / 2}px; }
    .m3-tab { height:${tabH}px; }
    .m3-snackbar { min-height:${48 + d}px; }
    .m3-menu-item { padding:${menuPadV}px 16px; }
    .m3-dp-day { width:${dpDay}px; height:${dpDay}px; border-radius:${dpDay / 2}px; font-size:${dpDay <= 24 ? 11 : 13}px; }
    /* Touch target: ensure 48dp min even when visual is smaller */
    ${density <= -2 ? `.m3-btn::before, .m3-chip::before, .m3-ib::before { content:''; position:absolute; min-width:48px; min-height:48px; }` : ""}
  `;
  
  const fl = COMPS.filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()));
  const sc = COMPS.find(c => c.id === sel);

  return (
    <ThemeContext.Provider value={T}>
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Roboto,sans-serif", background: T.surface, transition: "background 300ms cubic-bezier(0.2,0,0,1)" }}>
      <style>{CSS}{densityCSS}</style>

      <aside style={{ width: sb ? L.sideW : 0, overflow: "hidden", background: T.surfaceContainerLow, borderRight: `1px solid ${T.outlineVariant}40`, transition: "width 250ms cubic-bezier(0.05,0.7,0.1,1), background 300ms cubic-bezier(0.2,0,0,1)", display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0 }}>
        <div style={{ padding: L.sideP, minWidth: L.sideW }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${T.primary}, ${T.tertiary || T.primary})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>M3</div>
            <div><div style={{ fontWeight: 700, fontSize: 14, color: T.onSurface, lineHeight: 1.2 }}>Material 3</div><div style={{ fontSize: 10, color: T.onSurfaceVariant }}>Interactive Components</div></div>
          </div>
          
          <button onClick={() => setCtrlOpen(!ctrlOpen)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: "4px 0", marginBottom: ctrlOpen ? 4 : 0, fontFamily: "Roboto,sans-serif" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.08em" }}>Controls</span>
            <I n="expand_more" sm style={{ color: T.onSurfaceVariant }} />
          </button>
          {ctrlOpen && <>{/* ── THEME SWITCHER ── */}
          <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            <M3Dropdown
              label="Mode"
              value={themeKey === "custom" ? "__custom__" : themeKey}
              displayValue={themeKey === "custom" ? `Custom (${customColor})` : T.name}
              items={[
                ...Object.entries(THEMES).map(([key, theme]) => ({
                  key, label: theme.name, primary: theme.primary, surface: theme.surface, outline: theme.outline,
                })),
                ...(themeKey === "custom" ? [{ key: "__custom__", label: `Custom (${customColor})`, primary: T.primary, surface: T.surface, outline: T.outline }] : []),
              ]}
              onSelect={(item) => { if (item.key !== "__custom__") setThemeKey(item.key); }}
              renderItem={(item, isSel) => (
                <>
                  <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 6, background: item.primary, border: `1px solid ${(item.outline || T.outline)}40` }} />
                    <div style={{ width: 12, height: 12, borderRadius: 6, background: item.surface, border: `1px solid ${(item.outline || T.outline)}40` }} />
                  </div>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {isSel && <I n="check" sm style={{ color: T.primary, flexShrink: 0 }} />}
                </>
              )}
            />
            
            <M3Dropdown
              label="Material Palette"
              value={themeKey === "custom" ? customColor : ""}
              displayValue={themeKey === "custom" ? (MATERIAL_COLORS.find(c => c.hex === customColor)?.name || "Custom") + ` — ${customColor}` : "Choose a color…"}
              items={MATERIAL_COLORS.map(c => ({ key: c.hex, label: c.name, hex: c.hex }))}
              onSelect={(item) => { setCustomColor(item.hex); setThemeKey("custom"); }}
              renderItem={(item, isSel) => (
                <>
                  <div style={{ width: 16, height: 16, borderRadius: 8, background: item.hex, border: `1px solid ${T.outlineVariant}`, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <span style={{ fontSize: 11, color: T.onSurfaceVariant, fontFamily: "monospace" }}>{item.hex}</span>
                  {isSel && <I n="check" sm style={{ color: T.primary, flexShrink: 0 }} />}
                </>
              )}
            />

            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ position: "relative", width: 28, height: 28, borderRadius: 8, overflow: "hidden", border: `1px solid ${T.outlineVariant}`, flexShrink: 0 }}>
                <input type="color" value={customColor} onChange={e => { setCustomColor(e.target.value); setThemeKey("custom"); }} style={{ position: "absolute", inset: -4, width: 36, height: 36, cursor: "pointer", border: "none" }} />
              </div>
              <span style={{ fontSize: 11, color: T.onSurfaceVariant, fontFamily: "monospace", flex: 1 }}>{customColor}</span>
              <button onClick={() => setIsDarkCustom(!isDarkCustom)} style={{
                fontSize: 10, padding: "3px 10px", borderRadius: 100, cursor: "pointer", fontFamily: "Roboto,sans-serif",
                border: `1px solid ${T.outlineVariant}`, background: isDarkCustom ? T.inverseSurface : "transparent",
                color: isDarkCustom ? T.inverseOnSurface : T.onSurfaceVariant,
              }}><I n={isDarkCustom ? "dark_mode" : "light_mode"} style={{ fontSize: 14, verticalAlign: "middle", marginRight: 2 }} />{isDarkCustom ? "Dark" : "Light"}</button>
            </div>
          </div>

          {/* ── DENSITY & SIZE SELECTOR ── */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 2px 4px" }}>Density</div>
            <div style={{ display: "flex", gap: 4 }}>
              {[
                { scale: 0, label: "Default", icon: "view_agenda" },
                { scale: -1, label: "Comfortable", icon: "view_headline" },
                { scale: -2, label: "Compact", icon: "view_list" },
                { scale: -3, label: "Dense", icon: "density_small" },
              ].map(d => (
                <button key={d.scale} onClick={() => setDensity(d.scale)} title={`${d.label} (${d.scale === 0 ? "0" : d.scale})`} style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  padding: "6px 4px", borderRadius: 8, cursor: "pointer", fontFamily: "Roboto,sans-serif",
                  border: density === d.scale ? `2px solid ${T.primary}` : `1px solid ${T.outlineVariant}60`,
                  background: density === d.scale ? T.primaryContainer : "transparent",
                  color: density === d.scale ? T.onPrimaryContainer : T.onSurfaceVariant,
                  transition: "all 150ms cubic-bezier(0.2,0,0,1)",
                }}>
                  <I n={d.icon} sm />
                  <span style={{ fontSize: 9, fontWeight: density === d.scale ? 600 : 400 }}>{d.label}</span>
                </button>
              ))}
            </div>
            <div style={{ fontSize: 10, color: T.onSurfaceVariant, marginTop: 4, padding: "0 2px", fontFamily: "Roboto,sans-serif", lineHeight: 1.4 }}>
              Scale: {density} · Button: {40 + density * 4}dp · Field: {56 + density * 4}dp · Chip: {Math.max(24, 32 + density * 4)}dp
              {density !== 0 && <span style={{ display: "block", fontSize: 9, color: T.outline, marginTop: 2 }}>Font sizes, horizontal padding, and icon sizes unchanged</span>}
            </div>
          </div>

          </>}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 28, background: T.surfaceContainerHigh, marginBottom: 10 }}>
            <I n="search" sm style={{ color: T.onSurfaceVariant }} />
            <input type="text" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: T.onSurface, width: "100%", fontFamily: "Roboto,sans-serif" }} />
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "0 6px 14px", minWidth: L.sideW }}>
          {CATS.map(cat => {
            const items = fl.filter(c => c.cat === cat);
            if (!items.length) return null;
            return <div key={cat} style={{ marginBottom: 4 }}>
              <div style={{ padding: "5px 6px 2px", fontSize: 10, fontWeight: 700, color: T.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.08em" }}>{cat}</div>
              {items.map(c => <button key={c.id} onClick={() => setSel(c.id)} className="m3-menu-item" style={{ display: "block", width: "100%", textAlign: "left", fontSize: L.sideFontSize, borderRadius: 8, padding: L.navP, border: "none", fontWeight: sel === c.id ? 600 : 400, color: sel === c.id ? T.onPrimaryContainer : T.onSurface, background: sel === c.id ? T.primaryContainer : "transparent", fontFamily: "Roboto,sans-serif", marginBottom: 1, cursor: "pointer" }}>{c.name}</button>)}
            </div>;
          })}
        </div>
      </aside>

      <main style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: L.topP, borderBottom: `1px solid ${T.outlineVariant}30`, display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, background: T.surface + "ee", backdropFilter: "blur(12px)", zIndex: 10 }}>
          <button className="m3-ib m3-ib-std" onClick={() => setSb(!sb)}><I n="menu" /></button>
          <span style={{ fontSize: 13, color: T.onSurfaceVariant, flex: 1 }}>{sc ? `${sc.cat} / ${sc.name}` : "Material 3 Interactive Documentation"}</span>
          <span style={{ fontSize: 11, color: T.onSurfaceVariant, background: T.surfaceContainerHigh, padding: "4px 10px", borderRadius: 100 }}>{T.name} · {density === 0 ? "Default" : density === -1 ? "Comfortable" : density === -2 ? "Compact" : "Dense"}</span>
        </div>

        <div style={{ padding: `24px ${L.mainP}px 50px` }}>
          {sc ? (
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              <div style={{ display: "inline-block", padding: "3px 12px", borderRadius: 100, background: T.primaryContainer, color: T.onPrimaryContainer, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>{sc.cat}</div>
              <h1 style={{ fontSize: 34, fontWeight: 400, margin: "0 0 8px", color: T.onSurface }}>{sc.name}</h1>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: T.onSurfaceVariant, margin: "0 0 24px", maxWidth: 640 }}>{sc.desc}</p>
              <div style={{ background: T.surfaceContainerLowest, border: `1px solid ${T.outlineVariant}40`, borderRadius: 20, padding: L.mainP }}>
                <sc.render />
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              <h1 style={{ fontSize: 40, fontWeight: 400, margin: "0 0 10px", color: T.onSurface, lineHeight: 1.1 }}>Material 3 <span style={{ color: T.primary }}>Interactive Library</span></h1>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: T.onSurfaceVariant, maxWidth: 560, margin: "0 0 8px" }}>Every component responds to real interaction — hover, Tab for focus, click to press. Switch between all 6 Figma theme modes in the sidebar: Light, Dark, Medium Contrast, and High Contrast.</p>
              <p style={{ fontSize: 12, color: T.primary, margin: `0 0 ${L.mainP}px`, fontWeight: 500 }}>Try it: switch to Dark theme in the sidebar. Hover buttons for state layers. Tab for focus rings. Click to toggle.</p>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${L.cardMin}px, 1fr))`, gap: L.gap }}>
                {COMPS.map(c => {
                  const Preview = M3_PREVIEWS[c.id];
                  return (
                    <button key={c.id} onClick={() => setSel(c.id)} className="m3-card m3-card-outlined" style={{ width: "100%", textAlign: "left" }}>
                      <div style={{ padding: "12px 16px", position: "relative", zIndex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: T.onSurface }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: T.onSurfaceVariant, marginTop: 1 }}>{c.cat}</div>
                        {Preview && <div style={{ pointerEvents: "none", marginTop: 6 }}><Preview /></div>}
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
    </ThemeContext.Provider>
  );
}
