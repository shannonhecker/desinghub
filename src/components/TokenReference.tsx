"use client";

import React, { useMemo } from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { getTheme, getSystemInfo, getFont, activateTheme } from "@/data/registry";
import { contrastRatio, formatRatio, meetsAA, isHex } from "@/lib/contrastUtils";

interface TokenEntry {
  name: string;
  value: string;
  category: string;
}

function extractTokens(theme: any, system: string): TokenEntry[] {
  const tokens: TokenEntry[] = [];

  if (system === "salt") {
    const cats: Record<string, string[]> = {
      "Background": ["bg", "bg2", "bg3", "bgInv"],
      "Foreground": ["fg", "fg2", "fg3", "fgDis", "fgInv"],
      "Border": ["border", "borderStrong", "borderFocus"],
      "Accent": ["accent", "accentHover", "accentActive", "accentWeak", "accentFg", "accentText"],
      "Positive": ["positive", "positiveWeak", "positiveFg"],
      "Negative": ["negative", "negativeWeak", "negativeFg"],
      "Caution": ["caution", "cautionWeak", "cautionFg"],
      "Info": ["info", "infoWeak", "infoFg"],
      "Shadow": ["shadow", "shadowMed", "shadowHigh"],
    };
    for (const [cat, keys] of Object.entries(cats))
      for (const key of keys)
        if (theme[key]) tokens.push({ name: key, value: theme[key], category: cat });
  } else if (system === "m3") {
    const cats: Record<string, string[]> = {
      "Primary": ["primary", "onPrimary", "primaryContainer", "onPrimaryContainer"],
      "Secondary": ["secondary", "onSecondary", "secondaryContainer", "onSecondaryContainer"],
      "Tertiary": ["tertiary", "tertiaryContainer", "onTertiaryContainer"],
      "Error": ["error", "onError", "errorContainer", "onErrorContainer"],
      "Surface": ["surface", "surfaceContainerLowest", "surfaceContainerLow", "surfaceContainer", "surfaceContainerHigh", "surfaceContainerHighest"],
      "On Surface": ["onSurface", "onSurfaceVariant"],
      "Outline": ["outline", "outlineVariant"],
      "Inverse": ["inverseSurface", "inverseOnSurface", "inversePrimary"],
    };
    for (const [cat, keys] of Object.entries(cats))
      for (const key of keys)
        if (theme[key]) tokens.push({ name: key, value: theme[key], category: cat });
  } else if (system === "ausos") {
    const cats: Record<string, string[]> = {
      "Background": ["bg", "bg2", "bg3", "bg4"],
      "Surface": ["surface", "surfaceHover", "surfaceActive", "surfaceMd", "surfaceLg"],
      "Card": ["cardBg", "cardBgHover"],
      "Foreground": ["fg", "fg2", "fg3", "fgDisabled"],
      "Accent": ["accent", "accentHover", "accentActive", "accentFg", "accentSurface", "accentSurfaceHover"],
      "Border": ["border", "borderMd", "borderStrong", "borderAccent"],
      "Status - Danger": ["dangerBg", "dangerFg", "dangerBorder"],
      "Status - Success": ["successBg", "successFg", "successBorder"],
      "Status - Warning": ["warningBg", "warningFg", "warningBorder"],
      "Status - Info": ["infoBg", "infoFg", "infoBorder"],
    };
    for (const [cat, keys] of Object.entries(cats))
      for (const key of keys)
        if (theme[key]) tokens.push({ name: key, value: theme[key], category: cat });
  } else {
    const cats: Record<string, string[]> = {
      "Background": ["bg1", "bg2", "bg3", "bg4", "bg5", "bg6", "bgInverted", "bgDisabled"],
      "Card": ["cardBg", "cardBgHover", "cardBgPressed"],
      "Foreground": ["fg1", "fg2", "fg3", "fg4", "fgDisabled", "fgInverted", "fgOnBrand"],
      "Brand": ["brandBg", "brandBgHover", "brandBgPressed", "brandBg2", "brandFg1", "brandFg2", "brandFgLink", "brandStroke1"],
      "Stroke": ["strokeAccessible", "stroke1", "stroke2", "stroke3", "strokeDisabled"],
      "Shadow": ["shadowAmbient", "shadowKey"],
      "Danger": ["dangerBg1", "dangerBg3", "dangerFg1"],
      "Success": ["successBg1", "successBg3", "successFg1"],
      "Warning": ["warningBg1", "warningBg3", "warningFg1"],
    };
    for (const [cat, keys] of Object.entries(cats))
      for (const key of keys)
        if (theme[key]) tokens.push({ name: key, value: theme[key], category: cat });
  }
  return tokens;
}

interface SwatchColors { cardBg: string; border: string; fg: string; fg3: string; positive: string; negative: string }

function TokenSwatch({ token, bgToken, colors }: { token: TokenEntry; bgToken: string; colors: SwatchColors }) {
  const isColor = isHex(token.value);
  const ratio = isColor && isHex(bgToken) ? contrastRatio(token.value, bgToken) : null;
  const passes = ratio ? meetsAA(ratio) : null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "7px 0",
      borderBottom: `1px solid ${colors.border}`,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 6, flexShrink: 0,
        background: isColor ? token.value : "transparent",
        /* Swatches need to delineate against dark cards (bg5 #000000 on
           near-black cards vanished). Using fg3 — one step more contrast
           than the default border token while staying themed. */
        border: `1px solid ${colors.fg3}`,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: colors.fg }}>{token.name}</div>
        <div style={{ fontSize: 11, color: colors.fg3, fontFamily: "monospace" }}>{token.value}</div>
      </div>
      {ratio !== null && (
        <div style={{
          fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 8, whiteSpace: "nowrap",
          background: passes ? colors.positive + "20" : colors.negative + "20",
          color: passes ? colors.positive : colors.negative,
        }}>
          {formatRatio(ratio)} {passes ? "AA ✓" : "AA ✗"}
        </div>
      )}
    </div>
  );
}

export function TokenReference() {
  const store = useDesignHub();
  const { activeSystem } = store;
  const sysInfo = getSystemInfo(activeSystem);

  const T = activeSystem === "salt"
    ? getTheme("salt", store.salt.themeKey)
    : activeSystem === "m3"
    ? getTheme("m3", store.m3.themeKey, store.m3.customColor, store.m3.isDarkCustom)
    : activeSystem === "ausos"
    ? getTheme("ausos", store.ausos.themeKey)
    : getTheme("fluent", store.fluent.themeKey);

  activateTheme(activeSystem, T);
  const font = getFont(activeSystem);

  const tokens = useMemo(() => extractTokens(T, activeSystem), [T, activeSystem]);

  // Derive semantic colors from active DS tokens
  const n = (s: string, m: string, a: string, f: string) =>
    activeSystem === "salt" ? T[s] : activeSystem === "m3" ? T[m] : activeSystem === "ausos" ? T[a] : T[f];
  const pageBg   = n("bg2", "surface", "bg2", "bg2");
  const cardBg   = n("bg", "surfaceContainerLow", "surface", "bg1");
  const border   = n("border", "outlineVariant", "borderMd", "stroke2");
  const fg       = n("fg", "onSurface", "fg", "fg1");
  const fg3      = n("fg3", "onSurfaceVariant", "fg3", "fg3");
  const accent   = n("accent", "primary", "accent", "brandBg");
  const bgToken  = n("bg", "surface", "bg", "bg1");

  const positive = activeSystem === "ausos" ? (T.successFg || "#4ADE80") : activeSystem === "salt" ? (T.positive || "#36b37e") : activeSystem === "m3" ? (T.tertiary || "#36b37e") : (T.successFg1 || "#107C10");
  const negative = activeSystem === "ausos" ? (T.dangerFg || "#F87171") : activeSystem === "salt" ? (T.negative || "#de350b") : activeSystem === "m3" ? (T.error || "#B3261E") : (T.dangerFg1 || "#D13438");
  const swatchColors: SwatchColors = { cardBg, border, fg, fg3, positive, negative };
  const categories = [...new Set(tokens.map((t) => t.category))];

  return (
    <div style={{ padding: 24, background: pageBg, minHeight: "100%", fontFamily: font }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: fg, marginBottom: 4 }}>
        Token Reference
      </h2>
      <p style={{ fontSize: 13, color: fg3, marginBottom: 20 }}>
        {sysInfo.name} - {tokens.length} tokens · {T.name || "Current theme"} · Contrast ratios against background ({bgToken})
      </p>

      {/* Token grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
        {categories.map((cat) => (
          <div key={cat} style={{
            background: cardBg, borderRadius: activeSystem === "m3" ? 12 : 8,
            padding: 16, border: `1px solid ${border}`,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: accent,
              textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8,
            }}>
              {cat}
            </div>
            {tokens.filter((t) => t.category === cat).map((t) => (
              <TokenSwatch key={t.name} token={t} bgToken={bgToken} colors={swatchColors} />
            ))}
          </div>
        ))}
      </div>

      {/* Spacing Scale */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: fg, marginBottom: 12 }}>Spacing Scale</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          {(activeSystem === "salt"
            ? [4, 8, 12, 16, 20, 24, 32]
            : activeSystem === "m3"
            ? [4, 8, 12, 16, 24, 32, 48, 64]
            : activeSystem === "ausos"
            ? [2, 4, 8, 12, 16, 24, 32, 40, 48, 64]
            : [2, 4, 6, 8, 10, 12, 16, 20, 24, 32]
          ).map((s) => (
            <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: s, height: s, background: accent, borderRadius: 2, opacity: 0.7 }} />
              <span style={{ fontSize: 10, color: fg3 }}>{s}px</span>
            </div>
          ))}
        </div>
      </div>

      {/* Typography Scale */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: fg, marginBottom: 12 }}>Typography Scale</h3>
        <div style={{
          background: cardBg, borderRadius: activeSystem === "m3" ? 12 : 8,
          padding: 16, border: `1px solid ${border}`,
        }}>
          {(activeSystem === "salt"
            ? [{ label: "Display", size: 46 }, { label: "H1", size: 36 }, { label: "H2", size: 28 }, { label: "H3", size: 24 }, { label: "H4", size: 18 }, { label: "Body", size: 14 }, { label: "Label", size: 12 }, { label: "Caption", size: 11 }]
            : activeSystem === "m3"
            ? [{ label: "Display Large", size: 57 }, { label: "Display Medium", size: 45 }, { label: "Headline Large", size: 32 }, { label: "Title Large", size: 22 }, { label: "Title Medium", size: 16 }, { label: "Body Large", size: 16 }, { label: "Body Medium", size: 14 }, { label: "Label Large", size: 14 }, { label: "Label Small", size: 11 }]
            : activeSystem === "ausos"
            ? [{ label: "Display", size: 38 }, { label: "Headline", size: 19 }, { label: "Title", size: 16 }, { label: "Body", size: 15 }, { label: "Label", size: 12 }, { label: "Caption", size: 11 }]
            : [{ label: "Display", size: 40 }, { label: "Title 1", size: 28 }, { label: "Title 2", size: 24 }, { label: "Title 3", size: 20 }, { label: "Subtitle 1", size: 18 }, { label: "Body 1", size: 14 }, { label: "Caption 1", size: 12 }, { label: "Caption 2", size: 10 }]
          ).map((t) => (
            <div key={t.label} style={{
              display: "flex", alignItems: "baseline", gap: 12,
              padding: "5px 0", borderBottom: `1px solid ${border}`,
            }}>
              <span style={{ fontSize: 10, color: fg3, width: 110, flexShrink: 0 }}>{t.label}</span>
              <span style={{ fontSize: t.size, color: fg, fontWeight: t.size > 20 ? 600 : 400, lineHeight: 1.2 }}>Ag</span>
              <span style={{ fontSize: 10, color: fg3 }}>{t.size}px</span>
            </div>
          ))}
        </div>
      </div>

      {/* Elevation / Shadow */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: fg, marginBottom: 12 }}>Elevation / Shadow</h3>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {(activeSystem === "salt"
            ? [{ label: "100", shadow: `0 1px 3px ${T.shadow}` }, { label: "200", shadow: `0 2px 6px ${T.shadowMed}` }, { label: "300", shadow: `0 4px 12px ${T.shadowMed}` }, { label: "400", shadow: `0 8px 24px ${T.shadowHigh}` }]
            : activeSystem === "m3"
            ? [{ label: "Level 0", shadow: "none" }, { label: "Level 1", shadow: "0 1px 2px rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15)" }, { label: "Level 2", shadow: "0 1px 2px rgba(0,0,0,0.3), 0 2px 6px 2px rgba(0,0,0,0.15)" }, { label: "Level 3", shadow: "0 1px 3px rgba(0,0,0,0.3), 0 4px 8px 3px rgba(0,0,0,0.15)" }]
            : activeSystem === "ausos"
            ? [{ label: "Glass 0", shadow: T.insetHighlight || "none" }, { label: "Glass 1", shadow: `${T.shadow}` }, { label: "Glass 2", shadow: `${T.shadowLg}` }, { label: "Glass 3", shadow: `${T.shadowLg}, ${T.insetHighlight}` }]
            : [{ label: "2", shadow: `0 1px 2px ${T.shadowAmbient}` }, { label: "4", shadow: `0 2px 4px ${T.shadowAmbient}, 0 0 2px ${T.shadowKey}` }, { label: "8", shadow: `0 4px 8px ${T.shadowAmbient}, 0 0 2px ${T.shadowKey}` }, { label: "28", shadow: `0 14px 28px ${T.shadowAmbient}, 0 0 8px ${T.shadowKey}` }]
          ).map((s) => (
            <div key={s.label} style={{
              width: 80, height: 80, borderRadius: activeSystem === "m3" ? 12 : 8,
              background: cardBg, boxShadow: s.shadow,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, color: fg3, border: `1px solid ${border}`,
            }}>
              {s.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
