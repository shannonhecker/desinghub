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
  border: string; borderStrong: string;
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
  // ausos
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
  ausosThemeKey: string,
  ausosDensity: string,
  ausosAccentColor: string,
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
    : getTheme("ausos", ausosThemeKey);

  // Apply custom accent color for ausos
  if (activeSystem === "ausos" && ausosAccentColor && ausosAccentColor !== T.accent) {
    const c = ausosAccentColor;
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
    : ausosDensity;

  const css = getFullCSS(activeSystem, T, densityOrSize);
  const font = getFont(activeSystem);

  /* Normalized token accessors - one slot per system. Carbon's
     theme tokens use the same field names as salt/ausos (bg, fg,
     accent, etc.) so most carbon slots reuse salt's key names;
     where Carbon diverges (layer/field tokens in Phase 2), we'll
     override with a carbon-specific key. */
  const n = (salt: string, m3: string, fluent: string, ausos: string, carbon: string) =>
    activeSystem === "salt" ? T[salt]
    : activeSystem === "m3" ? T[m3]
    : activeSystem === "fluent" ? T[fluent]
    : activeSystem === "carbon" ? T[carbon]
    : T[ausos];

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
  const ausosThemeKey = useDesignHub((s) => s.ausos.themeKey);
  const ausosDensity = useDesignHub((s) => s.ausos.density);
  const ausosAccentColor = useDesignHub((s) => s.ausos.accentColor);
  const carbonThemeKey = useDesignHub((s) => s.carbon.themeKey);
  const carbonDensity = useDesignHub((s) => s.carbon.density);

  const theme = useMemo(
    () => computeTheme(
      activeSystem, saltThemeKey, saltDensity,
      m3ThemeKey, m3Density, m3CustomColor, m3IsDarkCustom,
      fluentThemeKey, fluentSize,
      ausosThemeKey, ausosDensity, ausosAccentColor,
      carbonThemeKey, carbonDensity,
    ),
    [
      activeSystem, saltThemeKey, saltDensity,
      m3ThemeKey, m3Density, m3CustomColor, m3IsDarkCustom,
      fluentThemeKey, fluentSize,
      ausosThemeKey, ausosDensity, ausosAccentColor,
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
