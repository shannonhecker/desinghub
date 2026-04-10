export const THEMES: Record<string, any> = {
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
    brandBg: "#0F6CBD", brandBgHover: "#2886DE", brandBgPressed: "#115EA3", brandBgSelected: "#0F548C",
    brandBg2: "#082338", brandFg1: "#479EF5", brandFg2: "#62ABF5", brandFgLink: "#479EF5",
    brandStroke1: "#479EF5",
    strokeAccessible: "#ADADAD", stroke1: "#666666", stroke2: "#525252", stroke3: "#3D3D3D", strokeDisabled: "#424242",
    shadowAmbient: "rgba(0,0,0,0.24)", shadowKey: "rgba(0,0,0,0.28)",
    dangerBg1: "#3B0509", dangerBg3: "#C50F1F", dangerFg1: "#ECA3A3",
    successBg1: "#052505", successBg3: "#107C10", successFg1: "#9CD49C",
    warningBg1: "#3D1D00", warningBg3: "#F7630C", warningFg1: "#F7C5A0",
  },
};

export const FONT = "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif";

export const SIZE_MAP: Record<string, { h: number; fs: number; pad: number; radius: number; headFs: number; gap: number; sideW: number; mainPad: number; cardMin: number; cardRadius: number }> = {
  small:  { h: 24, fs: 12, pad: 8,  radius: 4, headFs: 16, gap: 6,  sideW: 200, mainPad: 16, cardMin: 160, cardRadius: 6 },
  medium: { h: 32, fs: 14, pad: 12, radius: 4, headFs: 20, gap: 8,  sideW: 240, mainPad: 20, cardMin: 200, cardRadius: 8 },
  large:  { h: 40, fs: 14, pad: 16, radius: 4, headFs: 24, gap: 10, sideW: 280, mainPad: 24, cardMin: 220, cardRadius: 8 },
};

export function buildCSS(T: any) {
  return `
* { box-sizing:border-box; margin:0; padding:0; }
:root { --f-dur-ultra-fast:50ms; --f-dur-faster:100ms; --f-dur-fast:150ms; --f-dur-normal:200ms; --f-dur-gentle:250ms; --f-dur-slow:300ms; --f-curve-decel-mid:cubic-bezier(0.1,0.9,0.2,1); --f-curve-accel-mid:cubic-bezier(0.7,0,1,0.5); --f-curve-easy-ease:cubic-bezier(0.33,0,0.67,1); }
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;transition-duration:0.01ms!important;}}

.f-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:32px;min-width:96px;border-radius:4px;padding:0 12px;font-family:${FONT};font-size:14px;font-weight:600;cursor:pointer;border:1px solid transparent;outline:none;position:relative;overflow:hidden;transition:background var(--f-dur-fast) var(--f-curve-easy-ease),border-color var(--f-dur-fast),color var(--f-dur-fast);}
.f-btn:focus-visible{outline:2px solid ${T.fg1};outline-offset:2px;}
.f-btn:disabled{opacity:0.38;cursor:default;pointer-events:none;}
.f-btn-primary{background:${T.brandBg};color:${T.fgOnBrand};}
.f-btn-primary:hover{background:${T.brandBgHover};}
.f-btn-primary:active{background:${T.brandBgPressed};}
.f-btn-default{background:${T.bg1};color:${T.fg1};border-color:${T.stroke1};}
.f-btn-default:hover{background:${T.bg3};border-color:${T.strokeAccessible};}
.f-btn-outline{background:transparent;color:${T.brandFg1};border-color:${T.brandStroke1};}
.f-btn-outline:hover{background:${T.brandBg2};}
.f-btn-subtle{background:transparent;color:${T.fg1};}
.f-btn-subtle:hover{background:${T.subtleBgHover};}
.f-btn-sm{height:24px;padding:0 8px;font-size:12px;min-width:64px;}
.f-btn-lg{height:40px;padding:0 16px;font-size:14px;}

.f-input-wrap{display:flex;flex-direction:column;gap:4px;}
.f-input-label{font-size:14px;font-weight:600;color:${T.fg1};font-family:${FONT};}
.f-input{height:32px;border:1px solid ${T.stroke1};border-bottom:2px solid ${T.strokeAccessible};border-radius:4px;padding:0 10px;font-size:14px;font-family:${FONT};color:${T.fg1};background:${T.bg1};outline:none;transition:border-color var(--f-dur-fast);}
.f-input:hover{border-color:${T.strokeAccessible};}
.f-input:focus{border-bottom:2px solid ${T.brandBg};}
.f-input::placeholder{color:${T.fg3};}
.f-input:disabled{background:${T.bgDisabled};color:${T.fgDisabled};border-color:${T.strokeDisabled};}

.f-card{border-radius:8px;background:${T.cardBg};border:1px solid ${T.stroke2};cursor:pointer;outline:none;transition:box-shadow var(--f-dur-fast),background var(--f-dur-fast);overflow:hidden;}
.f-card:hover{box-shadow:0 2px 4px ${T.shadowAmbient},0 4px 8px ${T.shadowKey};background:${T.cardBgHover};}
.f-card:focus-visible{outline:2px solid ${T.fg1};outline-offset:2px;}

.f-checkbox{width:16px;height:16px;border:1px solid ${T.strokeAccessible};border-radius:2px;background:${T.bg1};cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all var(--f-dur-fast);}
.f-checkbox.checked{background:${T.brandBg};border-color:${T.brandBg};}

.f-radio{width:16px;height:16px;border:1px solid ${T.strokeAccessible};border-radius:50%;background:${T.bg1};cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all var(--f-dur-fast);}
.f-radio.checked{border-color:${T.brandBg};border-width:2px;}

.f-switch{width:40px;height:20px;border-radius:10px;background:${T.bg4};border:1px solid ${T.strokeAccessible};cursor:pointer;position:relative;transition:all var(--f-dur-fast);}
.f-switch.on{background:${T.brandBg};border-color:${T.brandBg};}
.f-switch-thumb{width:14px;height:14px;border-radius:50%;background:${T.bg1};position:absolute;top:2px;left:2px;transition:left var(--f-dur-fast) var(--f-curve-decel-mid);}
.f-switch.on .f-switch-thumb{left:22px;}

.f-tab{padding:10px 16px;font-family:${FONT};font-size:14px;font-weight:400;color:${T.fg2};background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;transition:all var(--f-dur-fast);}
.f-tab:hover{color:${T.fg1};background:${T.subtleBgHover};}
.f-tab.active{color:${T.brandFg1};border-bottom-color:${T.brandBg};font-weight:600;}

.f-badge{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;border-radius:10px;font-size:12px;font-weight:600;font-family:${FONT};}
.f-avatar{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;font-weight:600;font-family:${FONT};color:#fff;}

.f-messagebar{padding:10px 14px;border-radius:4px;font-family:${FONT};font-size:14px;display:flex;align-items:center;gap:8px;}
.f-divider{height:1px;background:${T.stroke2};width:100%;}
.f-progress{height:2px;background:${T.bg4};border-radius:1px;overflow:hidden;}
.f-progress-bar{height:100%;background:${T.brandBg};border-radius:1px;transition:width var(--f-dur-normal);}
.f-tooltip{position:absolute;background:${T.bgInverted};color:${T.fgInverted};padding:6px 12px;border-radius:4px;font-size:12px;font-family:${FONT};white-space:nowrap;pointer-events:none;z-index:100;}
`;
}

export function sizeCSS(size: string) {
  const s = SIZE_MAP[size];
  if (!s || size === 'medium') return '';
  return `
    .f-btn { height: ${s.h}px; font-size: ${s.fs}px; padding: 0 ${s.pad}px; }
    .f-input { height: ${s.h}px; font-size: ${s.fs}px; }
    .f-tab { padding: ${Math.max(6, s.h / 4)}px 16px; font-size: ${s.fs}px; }
  `;
}
