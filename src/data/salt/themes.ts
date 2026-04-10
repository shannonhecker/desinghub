export const BASE_LIGHT = {
  bg: "#FFFFFF", bg2: "#F5F7F8", bg3: "#E2E4E5", bgInv: "#101820",
  fg: "#000000", fg2: "#4C5157", fg3: "#72777D", fgDis: "#B1B5B9", fgInv: "#FFFFFF",
  border: "#B1B5B9", borderStrong: "#72777D", borderFocus: "#000000",
  positive: "#00875D", positiveWeak: "#EAF5F2", positiveFg: "#005637",
  negative: "#E52135", negativeWeak: "#FFECEA", negativeFg: "#910D1E",
  caution: "#C75300", cautionWeak: "#FFECD9", cautionFg: "#813600",
  info: "#0078CF", infoWeak: "#EAF6FF", infoFg: "#00457E",
  shadow: "rgba(0,0,0,0.10)", shadowMed: "rgba(0,0,0,0.15)", shadowHigh: "rgba(0,0,0,0.20)",
};

export const BASE_DARK = {
  bg: "#101820", bg2: "#1A2229", bg3: "#26292B", bgInv: "#FFFFFF",
  fg: "#FFFFFF", fg2: "#D3D5D8", fg3: "#91959A", fgDis: "#5F646A", fgInv: "#101820",
  border: "#5F646A", borderStrong: "#91959A", borderFocus: "#FFFFFF",
  positive: "#53B087", positiveWeak: "#002915", positiveFg: "#B8E5D1",
  negative: "#FF5D57", negativeWeak: "#450002", negativeFg: "#FFC1BA",
  caution: "#EB7B39", cautionWeak: "#422000", cautionFg: "#FFC6A1",
  info: "#669CE8", infoWeak: "#001736", infoFg: "#C7DEFF",
  shadow: "rgba(0,0,0,0.50)", shadowMed: "rgba(0,0,0,0.55)", shadowHigh: "rgba(0,0,0,0.65)",
};

export const THEMES: Record<string, any> = {
  "jpm-light": { ...BASE_LIGHT, name: "JPM Brand Light", short: "JPM Light", theme: "jpm",
    accent: "#1B7F9E", accentHover: "#12647E", accentActive: "#033142", accentWeak: "#DBF5F7", accentFg: "#FFFFFF", accentText: "#1B7F9E" },
  "jpm-dark": { ...BASE_DARK, name: "JPM Brand Dark", short: "JPM Dark", theme: "jpm",
    accent: "#1B7F9E", accentHover: "#4CA1C2", accentActive: "#83C0D6", accentWeak: "#033142", accentFg: "#FFFFFF", accentText: "#4CA1C2" },
  "legacy-light": { ...BASE_LIGHT, name: "Legacy (UITK) Light", short: "Legacy Light", theme: "legacy",
    accent: "#0078CF", accentHover: "#005EA6", accentActive: "#002D59", accentWeak: "#EAF6FF", accentFg: "#FFFFFF", accentText: "#0078CF" },
  "legacy-dark": { ...BASE_DARK, name: "Legacy (UITK) Dark", short: "Legacy Dark", theme: "legacy",
    accent: "#0078CF", accentHover: "#669CE8", accentActive: "#9ABDF5", accentWeak: "#002D59", accentFg: "#FFFFFF", accentText: "#669CE8" },
};

export const FONT = "'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif";

export const DENSITY_MAP: Record<string, { h: number; sp: number; fs: number; cr: number; pad: number; h1: number; gap: number; sideW: number; mainP: number; cardMin: number; demoP: number; demoCr: number }> = {
  high:   { h: 20, sp: 4,  fs: 11, cr: 3,  pad: 6,  h1: 16, gap: 6,  sideW: 180, mainP: 16, cardMin: 140, demoP: 12, demoCr: 4 },
  medium: { h: 28, sp: 8,  fs: 12, cr: 4,  pad: 8,  h1: 18, gap: 8,  sideW: 220, mainP: 20, cardMin: 180, demoP: 16, demoCr: 6 },
  low:    { h: 36, sp: 12, fs: 13, cr: 6,  pad: 12, h1: 20, gap: 10, sideW: 260, mainP: 24, cardMin: 200, demoP: 20, demoCr: 8 },
  touch:  { h: 44, sp: 16, fs: 14, cr: 8,  pad: 16, h1: 24, gap: 12, sideW: 280, mainP: 28, cardMin: 220, demoP: 24, demoCr: 10 },
};

export function buildCSS(T: any) {
  return `
* { box-sizing:border-box; margin:0; padding:0; }
:root { --dur-fast:150ms; --dur-norm:200ms; --dur-slow:300ms; --ease:cubic-bezier(0.2,0,0,1); }
@media(prefers-reduced-motion:reduce){*,*::before,*::after{transition-duration:0.01ms!important;animation-duration:0.01ms!important;}}

.s-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:var(--cr,4px);font-family:${FONT};font-weight:600;cursor:pointer;border:1px solid transparent;outline:none;transition:background var(--dur-fast) var(--ease),border-color var(--dur-fast) var(--ease);padding:0 var(--pad,12px);height:var(--h,28px);font-size:var(--fs,12px);}
.s-btn:focus-visible{outline:2px solid ${T.borderFocus};outline-offset:2px;}
.s-btn:disabled{opacity:0.4;cursor:default;pointer-events:none;}
.s-btn-solid{background:${T.accent};color:${T.accentFg};}
.s-btn-solid:hover{background:${T.accentHover};}
.s-btn-solid:active{background:${T.accentActive};}
.s-btn-bordered{background:transparent;color:${T.accent};border-color:${T.accent};}
.s-btn-bordered:hover{background:${T.accentWeak};}
.s-btn-transparent{background:transparent;color:${T.accent};}
.s-btn-transparent:hover{background:${T.bg2};}
.s-btn-neutral{background:${T.bg2};color:${T.fg};border-color:${T.border};}
.s-btn-neutral:hover{background:${T.bg3};}
.s-btn-negative{background:${T.negative};color:#fff;}
.s-btn-negative:hover{background:${T.negativeFg};}

.s-input{height:var(--h,28px);border:1px solid ${T.border};border-bottom:2px solid ${T.borderStrong};border-radius:var(--cr,4px) var(--cr,4px) 0 0;padding:0 var(--pad,8px);font-size:var(--fs,12px);font-family:${FONT};color:${T.fg};background:${T.bg};outline:none;transition:border-color var(--dur-fast) var(--ease);}
.s-input:hover{border-color:${T.borderStrong};}
.s-input:focus{border-bottom-color:${T.accent};}
.s-input::placeholder{color:${T.fg3};}
.s-input:disabled{background:${T.bg2};color:${T.fgDis};border-color:${T.bg3};}

.s-card{border-radius:var(--cr,6px);background:${T.bg};border:1px solid ${T.border};cursor:pointer;outline:none;transition:box-shadow var(--dur-norm) var(--ease),background var(--dur-fast) var(--ease);overflow:hidden;}
.s-card:hover{box-shadow:0 2px 6px ${T.shadowMed};background:${T.bg2};}
.s-card:focus-visible{outline:2px solid ${T.borderFocus};outline-offset:2px;}

.s-tab{padding:8px 12px;font-size:var(--fs,12px);font-weight:400;font-family:${FONT};color:${T.fg2};background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;outline:none;transition:color var(--dur-fast),border-color var(--dur-fast);}
.s-tab:hover{color:${T.fg};}
.s-tab.active{color:${T.accentText||T.accent};border-bottom-color:${T.accentText||T.accent};font-weight:600;}
.s-tab:focus-visible{outline:2px solid ${T.borderFocus};outline-offset:-2px;}

.s-sidebar-item{display:block;width:100%;padding:6px 10px;border-radius:var(--cr,4px);border:none;background:transparent;cursor:pointer;font-family:${FONT};font-size:var(--fs,12px);text-align:left;color:${T.fg2};transition:background var(--dur-fast) var(--ease);outline:none;}
.s-sidebar-item:hover{background:${T.bg2};color:${T.fg};}
.s-sidebar-item.active{background:${T.accentWeak};color:${T.accentText||T.accent};font-weight:600;}

.s-checkbox{width:16px;height:16px;border:2px solid ${T.borderStrong};border-radius:3px;background:${T.bg};cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all var(--dur-fast);}
.s-checkbox.checked{background:${T.accent};border-color:${T.accent};}

.s-radio{width:16px;height:16px;border:2px solid ${T.borderStrong};border-radius:50%;background:${T.bg};cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all var(--dur-fast);}
.s-radio.checked{border-color:${T.accent};}

.s-switch{width:36px;height:20px;border-radius:10px;background:${T.bg3};cursor:pointer;position:relative;transition:background var(--dur-fast);}
.s-switch.on{background:${T.accent};}
.s-switch-thumb{width:14px;height:14px;border-radius:50%;background:${T.bg};position:absolute;top:3px;left:3px;transition:left var(--dur-fast) var(--ease);}
.s-switch.on .s-switch-thumb{left:19px;}

.s-banner{padding:10px 14px;border-radius:var(--cr,4px);border-left:4px solid;font-family:${FONT};font-size:var(--fs,12px);}
.s-badge{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;border-radius:10px;font-size:11px;font-weight:600;font-family:${FONT};}

.s-tooltip{position:absolute;background:${T.bgInv};color:${T.fgInv};padding:6px 10px;border-radius:var(--cr,4px);font-size:11px;font-family:${FONT};white-space:nowrap;pointer-events:none;z-index:100;}
.s-progress{height:4px;background:${T.bg3};border-radius:2px;overflow:hidden;}
.s-progress-bar{height:100%;background:${T.accent};border-radius:2px;transition:width var(--dur-norm);}

.s-accordion-header{display:flex;align-items:center;justify-content:space-between;width:100%;padding:10px 12px;background:none;border:none;border-bottom:1px solid ${T.border};cursor:pointer;font-family:${FONT};font-size:var(--fs,12px);color:${T.fg};font-weight:600;}
.s-divider{height:1px;background:${T.border};width:100%;}
`;
}

export function densityCSS(density: string) {
  const d = DENSITY_MAP[density];
  if (!d) return '';
  return `
    .s-btn, .s-input { --h: ${d.h}px; --fs: ${d.fs}px; --cr: ${d.cr}px; --pad: ${d.pad}px; }
  `;
}
