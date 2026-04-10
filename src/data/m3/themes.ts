export const THEMES: Record<string, any> = {
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
  },
};

export const MATERIAL_COLORS = [
  { name: "Red", hex: "#F44336" }, { name: "Pink", hex: "#E91E63" },
  { name: "Purple", hex: "#9C27B0" }, { name: "Deep Purple", hex: "#673AB7" },
  { name: "Indigo", hex: "#3F51B5" }, { name: "Blue", hex: "#2196F3" },
  { name: "Light Blue", hex: "#03A9F4" }, { name: "Cyan", hex: "#00BCD4" },
  { name: "Teal", hex: "#009688" }, { name: "Green", hex: "#4CAF50" },
  { name: "Light Green", hex: "#8BC34A" }, { name: "Lime", hex: "#CDDC39" },
  { name: "Yellow", hex: "#FFEB3B" }, { name: "Amber", hex: "#FFC107" },
  { name: "Orange", hex: "#FF9800" }, { name: "Deep Orange", hex: "#FF5722" },
  { name: "Brown", hex: "#795548" }, { name: "Blue Grey", hex: "#607D8B" },
];

export const FONT = "'Roboto', sans-serif";

export function hexToHSL(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s * 100, l * 100];
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function generateM3Theme(sourceHex: string, isDark: boolean): any {
  const [h, s] = hexToHSL(sourceHex);
  if (isDark) {
    return {
      ...THEMES.dark, name: "Custom Dark",
      primary: hslToHex(h, Math.min(s, 80), 80),
      onPrimary: hslToHex(h, Math.min(s, 30), 20),
      primaryContainer: hslToHex(h, Math.min(s, 60), 30),
      onPrimaryContainer: hslToHex(h, Math.min(s, 80), 90),
      secondary: hslToHex(h + 15, Math.min(s * 0.5, 40), 80),
      tertiary: hslToHex(h + 60, Math.min(s * 0.7, 50), 80),
    };
  }
  return {
    ...THEMES.light, name: "Custom Light",
    primary: hslToHex(h, Math.min(s, 80), 40),
    onPrimary: "#FFFFFF",
    primaryContainer: hslToHex(h, Math.min(s, 80), 90),
    onPrimaryContainer: hslToHex(h, Math.min(s, 60), 10),
    secondary: hslToHex(h + 15, Math.min(s * 0.5, 40), 40),
    tertiary: hslToHex(h + 60, Math.min(s * 0.7, 50), 40),
  };
}

export function buildCSS(T: any) {
  return `
* { box-sizing:border-box; margin:0; padding:0; }
:root { --m3-ease-standard:cubic-bezier(0.2,0,0,1); --m3-ease-emphasized:cubic-bezier(0.2,0,0,1); --m3-dur-short1:50ms; --m3-dur-short2:100ms; --m3-dur-short3:150ms; --m3-dur-medium1:200ms; --m3-dur-medium2:300ms; --m3-dur-long1:450ms; }
@media(prefers-reduced-motion:reduce){*,*::before,*::after{transition-duration:0.01ms!important;animation-duration:0.01ms!important;}}

.m3-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;min-width:48px;border-radius:20px;padding:0 24px;font-family:${FONT};font-size:14px;font-weight:500;letter-spacing:0.1px;cursor:pointer;border:none;outline:none;position:relative;overflow:hidden;transition:box-shadow var(--m3-dur-short3) var(--m3-ease-standard),background var(--m3-dur-short3);}
.m3-btn:focus-visible{outline:2px solid ${T.primary};outline-offset:2px;}
.m3-btn:disabled{opacity:0.38;cursor:default;pointer-events:none;}
.m3-btn-filled{background:${T.primary};color:${T.onPrimary};}
.m3-btn-filled:hover{box-shadow:0 1px 2px rgba(0,0,0,0.3),0 1px 3px 1px rgba(0,0,0,0.15);}
.m3-btn-outlined{background:transparent;color:${T.primary};border:1px solid ${T.outline};}
.m3-btn-outlined:hover{background:${T.primary}14;}
.m3-btn-text{background:transparent;color:${T.primary};padding:0 12px;}
.m3-btn-text:hover{background:${T.primary}14;}
.m3-btn-elevated{background:${T.surfaceContainerLow};color:${T.primary};box-shadow:0 1px 2px rgba(0,0,0,0.3),0 1px 3px 1px rgba(0,0,0,0.15);}
.m3-btn-elevated:hover{box-shadow:0 1px 2px rgba(0,0,0,0.3),0 2px 6px 2px rgba(0,0,0,0.15);}
.m3-btn-tonal{background:${T.secondaryContainer};color:${T.onSecondaryContainer};}
.m3-btn-tonal:hover{box-shadow:0 1px 2px rgba(0,0,0,0.3),0 1px 3px 1px rgba(0,0,0,0.15);}

.m3-card{border-radius:12px;overflow:hidden;cursor:pointer;outline:none;transition:box-shadow var(--m3-dur-short3) var(--m3-ease-standard);}
.m3-card:focus-visible{outline:2px solid ${T.primary};outline-offset:2px;}
.m3-card-elevated{background:${T.surfaceContainerLow};box-shadow:0 1px 2px rgba(0,0,0,0.3),0 1px 3px 1px rgba(0,0,0,0.15);}
.m3-card-elevated:hover{box-shadow:0 1px 2px rgba(0,0,0,0.3),0 2px 6px 2px rgba(0,0,0,0.15);}
.m3-card-filled{background:${T.surfaceContainerHighest};}
.m3-card-outlined{background:${T.surface};border:1px solid ${T.outlineVariant};}

.m3-chip{display:inline-flex;align-items:center;gap:8px;height:32px;padding:0 16px;border-radius:8px;border:1px solid ${T.outline};background:transparent;color:${T.onSurfaceVariant};font-family:${FONT};font-size:14px;cursor:pointer;transition:all var(--m3-dur-short3);}
.m3-chip.selected{background:${T.secondaryContainer};color:${T.onSecondaryContainer};border-color:transparent;}
.m3-chip:hover{background:${T.onSurface}14;}

.m3-tf{height:56px;position:relative;border-radius:4px 4px 0 0;}
.m3-tf-filled{background:${T.surfaceContainerHighest};}
.m3-tf-outlined{background:transparent;border:1px solid ${T.outline};border-radius:4px;}
.m3-tf input{width:100%;height:100%;border:none;background:transparent;padding:20px 16px 4px;font-family:${FONT};font-size:16px;color:${T.onSurface};outline:none;}
.m3-tf-filled{border-bottom:2px solid ${T.onSurfaceVariant};}
.m3-tf-filled:focus-within{border-bottom-color:${T.primary};}
.m3-tf-outlined:focus-within{border-color:${T.primary};border-width:2px;}
.m3-tf-label{position:absolute;left:16px;top:50%;transform:translateY(-50%);font-family:${FONT};font-size:16px;color:${T.onSurfaceVariant};pointer-events:none;transition:all var(--m3-dur-short3);}
.m3-tf-filled:focus-within .m3-tf-label,.m3-tf-label.up{top:8px;transform:none;font-size:12px;color:${T.primary};}

.m3-switch{width:52px;height:32px;border-radius:16px;background:${T.surfaceContainerHighest};border:2px solid ${T.outline};cursor:pointer;position:relative;transition:all var(--m3-dur-short3);}
.m3-switch.on{background:${T.primary};border-color:${T.primary};}
.m3-switch-thumb{width:16px;height:16px;border-radius:50%;background:${T.outline};position:absolute;top:50%;transform:translateY(-50%);left:6px;transition:all var(--m3-dur-short3) var(--m3-ease-standard);}
.m3-switch.on .m3-switch-thumb{left:28px;width:24px;height:24px;background:${T.onPrimary};margin-top:0;}

.m3-tab{padding:12px 24px;font-family:${FONT};font-size:14px;font-weight:500;color:${T.onSurfaceVariant};background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;transition:all var(--m3-dur-short3);}
.m3-tab:hover{color:${T.onSurface};background:${T.primary}08;}
.m3-tab.active{color:${T.primary};border-bottom-color:${T.primary};font-weight:600;}

.m3-badge{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:${T.error};color:${T.onError};font-size:11px;font-weight:500;font-family:${FONT};}
.m3-badge-dot{width:6px;height:6px;border-radius:3px;background:${T.error};padding:0;min-width:0;}

.m3-divider{height:1px;background:${T.outlineVariant};width:100%;}
.m3-progress{height:4px;background:${T.surfaceContainerHighest};border-radius:2px;overflow:hidden;}
.m3-progress-bar{height:100%;background:${T.primary};border-radius:2px;transition:width var(--m3-dur-medium1);}

.m3-fab{display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:16px;background:${T.primaryContainer};color:${T.onPrimaryContainer};border:none;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.3),0 2px 6px 2px rgba(0,0,0,0.15);transition:box-shadow var(--m3-dur-short3);}
.m3-fab:hover{box-shadow:0 1px 3px rgba(0,0,0,0.3),0 4px 8px 3px rgba(0,0,0,0.15);}

.m3-tooltip{position:absolute;background:${T.inverseSurface};color:${T.inverseOnSurface};padding:8px 16px;border-radius:4px;font-size:14px;font-family:${FONT};white-space:nowrap;pointer-events:none;z-index:100;}
`;
}

export function densityCSS(density: number) {
  if (density === 0) return '';
  const d = density * 4;
  return `
    .m3-btn { height: ${40 + d}px; }
    .m3-tf { height: ${56 + d}px; }
    .m3-chip { height: ${32 + d}px; }
    .m3-switch { width: ${52 + d}px; height: ${32 + d}px; border-radius: ${(32 + d) / 2}px; }
    .m3-tab { padding: ${Math.max(4, 12 + d)}px 24px; }
    .m3-fab { width: ${56 + d * 2}px; height: ${56 + d * 2}px; }
  `;
}
