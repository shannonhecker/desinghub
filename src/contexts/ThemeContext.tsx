"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useDesignHub, type SystemId } from "@/store/useDesignHub";
import { getTheme, getFullCSS, getFont, activateTheme } from "@/data/registry";

/* ── Types ── */

interface Scale {
  navH: number; navF: number; labF: number; tabH: number;
  hdrH: number; gap: number; panelW: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ThemeTokens = Record<string, any>;

export interface ActiveTheme {
  T: ThemeTokens;
  css: string;
  font: string;
  bg: string; bg2: string; bg3: string;
  fg: string; fg2: string; fg3: string;
  accent: string; accentFg: string; accentWeak: string; accentText: string;
  border: string; borderStrong: string; borderSubtle: string;
  focusRing: string;
  /* Optional semantic status slots - left undefined where the active DS
     has no real token for that role (no invented colours). Bg/Fg = the
     tinted (weak) pair; Strong/StrongFg = the solid (filled) pair. */
  successBg?: string; successFg?: string; successStrong?: string; successStrongFg?: string;
  warningBg?: string; warningFg?: string; warningStrong?: string; warningStrongFg?: string;
  dangerBg?: string; dangerFg?: string; dangerStrong?: string; dangerStrongFg?: string;
  infoBg?: string; infoFg?: string; infoStrong?: string; infoStrongFg?: string;
  activeSystem: SystemId;
  densityOrSize: string | number;
  scale: Scale;
}

/* ── Computation (extracted from useActiveTheme) ── */

function computeScale(activeSystem: SystemId, densityOrSize: string | number): Scale {
  if (activeSystem === "salt") {
    const d = densityOrSize as string;
    return d === "high"  ? { navH: 20, navF: 11, labF: 9,  tabH: 24, hdrH: 36, gap: 4,  panelW: 220 }
         : d === "low"   ? { navH: 36, navF: 13, labF: 11, tabH: 40, hdrH: 48, gap: 8,  panelW: 260 }
         : d === "touch" ? { navH: 44, navF: 14, labF: 12, tabH: 48, hdrH: 56, gap: 10, panelW: 288 }
         :                 { navH: 28, navF: 12, labF: 10, tabH: 32, hdrH: 40, gap: 6,  panelW: 240 };
  }
  if (activeSystem === "m3") {
    const d = densityOrSize as number;
    return d === -3 ? { navH: 36, navF: 12, labF: 10, tabH: 36, hdrH: 44, gap: 7,  panelW: 230 }
         : d === -2 ? { navH: 40, navF: 13, labF: 10, tabH: 40, hdrH: 48, gap: 8,  panelW: 240 }
         : d === -1 ? { navH: 44, navF: 14, labF: 11, tabH: 44, hdrH: 52, gap: 9,  panelW: 256 }
         :            { navH: 48, navF: 14, labF: 11, tabH: 48, hdrH: 56, gap: 10, panelW: 268 };
  }
  if (activeSystem === "fluent") {
    const d = densityOrSize as string;
    return d === "small" ? { navH: 24, navF: 11, labF: 9,  tabH: 28, hdrH: 36, gap: 4,  panelW: 220 }
         : d === "large" ? { navH: 40, navF: 14, labF: 11, tabH: 42, hdrH: 50, gap: 8,  panelW: 264 }
         :                 { navH: 32, navF: 13, labF: 10, tabH: 36, hdrH: 44, gap: 6,  panelW: 240 };
  }
  if (activeSystem === "carbon") {
    /* Carbon uses compact / normal / spacious ladder matching the
       Carbon spacing scale. Matches CARBON_DENSITY_MAP in registry. */
    const d = densityOrSize as string;
    return d === "compact"  ? { navH: 24, navF: 11, labF: 9,  tabH: 28, hdrH: 36, gap: 4,  panelW: 220 }
         : d === "spacious" ? { navH: 48, navF: 14, labF: 11, tabH: 48, hdrH: 56, gap: 10, panelW: 280 }
         :                    { navH: 32, navF: 13, labF: 10, tabH: 36, hdrH: 44, gap: 8,  panelW: 256 };
  }
  // uoaui
  const d = densityOrSize as string;
  return d === "high"  ? { navH: 20, navF: 11, labF: 9,  tabH: 24, hdrH: 36, gap: 4,  panelW: 220 }
       : d === "low"   ? { navH: 36, navF: 13, labF: 11, tabH: 40, hdrH: 48, gap: 8,  panelW: 260 }
       : d === "touch" ? { navH: 44, navF: 14, labF: 12, tabH: 48, hdrH: 56, gap: 10, panelW: 288 }
       :                 { navH: 28, navF: 12, labF: 10, tabH: 32, hdrH: 40, gap: 6,  panelW: 240 };
}

function computeTheme(
  activeSystem: SystemId,
  saltThemeKey: string,
  saltDensity: string,
  m3ThemeKey: string,
  m3Density: number,
  m3CustomColor: string,
  m3IsDarkCustom: boolean,
  fluentThemeKey: string,
  fluentSize: string,
  uoauiThemeKey: string,
  uoauiDensity: string,
  uoauiAccentColor: string,
  carbonThemeKey: string,
  carbonDensity: string,
): ActiveTheme {
  let T = activeSystem === "salt"
    ? getTheme("salt", saltThemeKey)
    : activeSystem === "m3"
    ? getTheme("m3", m3ThemeKey, m3CustomColor, m3IsDarkCustom)
    : activeSystem === "fluent"
    ? getTheme("fluent", fluentThemeKey)
    : activeSystem === "carbon"
    ? getTheme("carbon", carbonThemeKey)
    : getTheme("uoaui", uoauiThemeKey);

  // Apply custom accent color for uoaui
  if (activeSystem === "uoaui" && uoauiAccentColor && uoauiAccentColor !== T.accent) {
    const c = uoauiAccentColor;
    const lighter = c + "CC";
    const charts = T.chart ? [...T.chart] : [];
    if (charts.length > 0) charts[0] = c;
    T = {
      ...T, accent: c, accentHover: c, accentActive: c,
      accentGradient: `linear-gradient(135deg, ${lighter} 0%, ${c} 100%)`,
      accentSurface: `${c}14`, accentSurfaceHover: `${c}22`,
      borderAccent: `${c}40`, infoFg: c, infoBorder: `${c}30`, chart: charts,
    };
  }

  activateTheme(activeSystem, T);

  const densityOrSize: string | number =
    activeSystem === "salt" ? saltDensity
    : activeSystem === "m3" ? m3Density
    : activeSystem === "fluent" ? fluentSize
    : activeSystem === "carbon" ? carbonDensity
    : uoauiDensity;

  const css = getFullCSS(activeSystem, T, densityOrSize);
  const font = getFont(activeSystem);

  /* Normalized token accessors - one slot per system. Carbon's
     theme tokens use the same field names as salt/uoaui (bg, fg,
     accent, etc.) so most carbon slots reuse salt's key names;
     where Carbon diverges (layer/field tokens in Phase 2), we'll
     override with a carbon-specific key. */
  const n = (salt: string, m3: string, fluent: string, uoaui: string, carbon: string) =>
    activeSystem === "salt" ? T[salt]
    : activeSystem === "m3" ? T[m3]
    : activeSystem === "fluent" ? T[fluent]
    : activeSystem === "carbon" ? T[carbon]
    : T[uoaui];

  /* Like n(), but for OPTIONAL semantic slots: pass undefined where the
     DS has no real token for the role, and the slot stays undefined
     rather than borrowing a wrong colour. */
  const ns = (salt?: string, m3?: string, fluent?: string, uoaui?: string, carbon?: string): string | undefined =>
    activeSystem === "salt" ? (salt ? T[salt] : undefined)
    : activeSystem === "m3" ? (m3 ? T[m3] : undefined)
    : activeSystem === "fluent" ? (fluent ? T[fluent] : undefined)
    : activeSystem === "carbon" ? (carbon ? T[carbon] : undefined)
    : (uoaui ? T[uoaui] : undefined);

  /* Carbon's solid warning chip is canon black-on-yellow (white on
     #f1c21b fails contrast at 1.68:1): the near-black ink is textPrimary
     in the light themes and textInverse in the dark themes. */
  const carbonIsDark = carbonThemeKey === "g90" || carbonThemeKey === "g100";

  return {
    T, css, font,
    bg: n("bg", "surface", "bg1", "bg", "bg"),
    bg2: n("bg2", "surfaceContainerLow", "bg2", "bg2", "bg2"),
    bg3: n("bg3", "surfaceContainer", "bg3", "bg3", "bg3"),
    fg: n("fg", "onSurface", "fg1", "fg", "fg"),
    fg2: n("fg2", "onSurfaceVariant", "fg2", "fg2", "fg2"),
    fg3: n("fg3", "outline", "fg3", "fg3", "fg3"),
    accent: n("accent", "primary", "brandBg", "accent", "accent"),
    accentFg: n("accentFg", "onPrimary", "fgOnBrand", "accentFg", "accentFg"),
    accentWeak: n("accentWeak", "primaryContainer", "brandBg2", "accentSurface", "accentWeak"),
    accentText: activeSystem === "salt" ? (T.accentText || T.accent)
      : activeSystem === "m3" ? T.primary
      : activeSystem === "fluent" ? T.brandFg1
      : activeSystem === "carbon" ? T.accentText
      : T.accent,
    border: n("border", "outlineVariant", "stroke2", "border", "border"),
    borderStrong: n("borderStrong", "outline", "strokeAccessible", "borderStrong", "borderStrong"),
    /* Softer line for DECORATIVE dividers only (hero rule, card preview
       separators, sidebar/header). Solid-border DSs are mixed to ~55% so the
       line reads lighter; uoaui's border is already a low-alpha rgba, so
       mixing it further would erase it — keep it as-is there. Functional
       borders (inputs, outlines, dropdown triggers) keep the full `border`. */
    borderSubtle: activeSystem === "uoaui"
      ? n("border", "outlineVariant", "stroke2", "border", "border")
      : `color-mix(in srgb, ${n("border", "outlineVariant", "stroke2", "border", "border")} 55%, transparent)`,
    /* Per-DS focus-ring color. Carbon ships a real $focus token; Fluent's
       --colorStrokeFocus2 resolves to the high-contrast neutral (fg1); the
       rest use their accent (Salt's focus ring is 2px solid accent, M3 =
       primary, uoaui = --a-accent). Consumed via the --dh-focus-ring CSS
       var on .uikit-section-toggle in globals.css. */
    focusRing: activeSystem === "carbon" ? (T.focus ?? T.accent)
      : activeSystem === "fluent" ? (T.fg1 ?? T.fg)
      : n("accent", "primary", "brandBg", "accent", "accent"),
    /* ── Semantic status slots (optional) ──
       M3 only defines the error role family; success/warning/info stay
       undefined. Fluent ships no info palette here. Carbon's tinted pairs
       come from the v11 tag tokens; it has no yellow tag, so warningBg/Fg
       stay undefined. uoaui has tinted pairs only (no solid variant). */
    successBg: ns("positiveWeak", undefined, "successBg1", "successBg", "tagBackgroundGreen"),
    successFg: ns("positiveFg", undefined, "successFg1", "successFg", "tagColorGreen"),
    successStrong: ns("positive", undefined, "successBg3", undefined, "supportSuccess"),
    successStrongFg: ns("fgInv", undefined, "fgOnBrand", undefined, "textInverse"),
    warningBg: ns("cautionWeak", undefined, "warningBg1", "warningBg", undefined),
    warningFg: ns("cautionFg", undefined, "warningFg1", "warningFg", undefined),
    warningStrong: ns("caution", undefined, "warningBg3", undefined, "supportWarning"),
    warningStrongFg: activeSystem === "carbon"
      ? (carbonIsDark ? T.textInverse : T.textPrimary)
      : ns("fgInv", undefined, "fgOnBrand", undefined, undefined),
    dangerBg: ns("negativeWeak", "errorContainer", "dangerBg1", "dangerBg", "tagBackgroundRed"),
    dangerFg: ns("negativeFg", "onErrorContainer", "dangerFg1", "dangerFg", "tagColorRed"),
    dangerStrong: ns("negative", "error", "dangerBg3", undefined, "supportError"),
    dangerStrongFg: ns("fgInv", "onError", "fgOnBrand", undefined, "textInverse"),
    infoBg: ns("infoWeak", undefined, undefined, "infoBg", "tagBackgroundBlue"),
    infoFg: ns("infoFg", undefined, undefined, "infoFg", "tagColorBlue"),
    infoStrong: ns("info", undefined, undefined, undefined, "supportInfo"),
    infoStrongFg: ns("fgInv", undefined, undefined, undefined, "textInverse"),
    activeSystem,
    densityOrSize,
    scale: computeScale(activeSystem, densityOrSize),
  };
}

/* ── Context ── */

const ThemeContext = createContext<ActiveTheme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Subscribe to only the store slices that affect theme computation
  const activeSystem = useDesignHub((s) => s.activeSystem);
  const saltThemeKey = useDesignHub((s) => s.salt.themeKey);
  const saltDensity = useDesignHub((s) => s.salt.density);
  const m3ThemeKey = useDesignHub((s) => s.m3.themeKey);
  const m3Density = useDesignHub((s) => s.m3.density);
  const m3CustomColor = useDesignHub((s) => s.m3.customColor);
  const m3IsDarkCustom = useDesignHub((s) => s.m3.isDarkCustom);
  const fluentThemeKey = useDesignHub((s) => s.fluent.themeKey);
  const fluentSize = useDesignHub((s) => s.fluent.size);
  const uoauiThemeKey = useDesignHub((s) => s.uoaui.themeKey);
  const uoauiDensity = useDesignHub((s) => s.uoaui.density);
  const uoauiAccentColor = useDesignHub((s) => s.uoaui.accentColor);
  const carbonThemeKey = useDesignHub((s) => s.carbon.themeKey);
  const carbonDensity = useDesignHub((s) => s.carbon.density);

  const theme = useMemo(
    () => computeTheme(
      activeSystem, saltThemeKey, saltDensity,
      m3ThemeKey, m3Density, m3CustomColor, m3IsDarkCustom,
      fluentThemeKey, fluentSize,
      uoauiThemeKey, uoauiDensity, uoauiAccentColor,
      carbonThemeKey, carbonDensity,
    ),
    [
      activeSystem, saltThemeKey, saltDensity,
      m3ThemeKey, m3Density, m3CustomColor, m3IsDarkCustom,
      fluentThemeKey, fluentSize,
      uoauiThemeKey, uoauiDensity, uoauiAccentColor,
      carbonThemeKey, carbonDensity,
    ],
  );

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Read the memoized theme from context. Must be called inside <ThemeProvider>.
 * This replaces the old useActiveTheme() - zero computation on re-render.
 */
export function useTheme(): ActiveTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
