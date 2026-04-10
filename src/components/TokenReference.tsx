"use client";

import React, { useMemo } from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { getTheme, getSystemInfo, activateTheme } from "@/data/registry";
import { contrastRatio, formatRatio, meetsAA, isHex } from "@/lib/contrastUtils";

interface TokenEntry {
  name: string;
  value: string;
  category: string;
}

function extractTokens(theme: any, system: string): TokenEntry[] {
  const tokens: TokenEntry[] = [];
  const catMap: Record<string, string> = {};

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
    for (const [cat, keys] of Object.entries(cats)) {
      for (const key of keys) {
        if (theme[key]) tokens.push({ name: key, value: theme[key], category: cat });
      }
    }
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
    for (const [cat, keys] of Object.entries(cats)) {
      for (const key of keys) {
        if (theme[key]) tokens.push({ name: key, value: theme[key], category: cat });
      }
    }
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
    for (const [cat, keys] of Object.entries(cats)) {
      for (const key of keys) {
        if (theme[key]) tokens.push({ name: key, value: theme[key], category: cat });
      }
    }
  }
  return tokens;
}

function TokenSwatch({ token, bgToken }: { token: TokenEntry; bgToken: string }) {
  const isColor = isHex(token.value);
  const ratio = isColor && isHex(bgToken) ? contrastRatio(token.value, bgToken) : null;
  const passes = ratio ? meetsAA(ratio) : null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "6px 0",
      borderBottom: "1px solid #2a2a4a",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 6,
        background: token.value, border: "1px solid #2a2a4a",
        flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#e0e0e0" }}>{token.name}</div>
        <div style={{ fontSize: 11, color: "#707080", fontFamily: "monospace" }}>{token.value}</div>
      </div>
      {ratio !== null && (
        <div style={{
          fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 8,
          background: passes ? "#00875D20" : "#E5213520",
          color: passes ? "#53B087" : "#FF5D57",
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
    : getTheme("fluent", store.fluent.themeKey);

  const tokens = useMemo(() => extractTokens(T, activeSystem), [T, activeSystem]);
  const bgToken = activeSystem === "salt" ? T.bg : activeSystem === "m3" ? T.surface : T.bg1;

  const categories = [...new Set(tokens.map((t) => t.category))];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
        Token Reference
      </h2>
      <p style={{ fontSize: 13, color: "#707080", marginBottom: 20 }}>
        {sysInfo.name} — {tokens.length} tokens · {T.name || "Current theme"} · Contrast ratios against background ({bgToken})
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
        {categories.map((cat) => (
          <div key={cat} style={{ background: "#16213e", borderRadius: 8, padding: 16, border: "1px solid #2a2a4a" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: sysInfo.color, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
              {cat}
            </div>
            {tokens.filter((t) => t.category === cat).map((t) => (
              <TokenSwatch key={t.name} token={t} bgToken={bgToken} />
            ))}
          </div>
        ))}
      </div>

      {/* Spacing Scale */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 12 }}>Spacing Scale</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          {(activeSystem === "salt" ? [4, 8, 12, 16, 20, 24, 32] : activeSystem === "m3" ? [4, 8, 12, 16, 24, 32, 48, 64] : [2, 4, 6, 8, 10, 12, 16, 20, 24, 32]).map((s) => (
            <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: s, height: s, background: sysInfo.color, borderRadius: 2, opacity: 0.6 }} />
              <span style={{ fontSize: 10, color: "#707080" }}>{s}px</span>
            </div>
          ))}
        </div>
      </div>

      {/* Typography Scale */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 12 }}>Typography Scale</h3>
        <div style={{ background: "#16213e", borderRadius: 8, padding: 16, border: "1px solid #2a2a4a" }}>
          {(activeSystem === "salt"
            ? [{ label: "Display", size: 46 }, { label: "H1", size: 36 }, { label: "H2", size: 28 }, { label: "H3", size: 24 }, { label: "H4", size: 18 }, { label: "Body", size: 14 }, { label: "Label", size: 12 }, { label: "Caption", size: 11 }]
            : activeSystem === "m3"
            ? [{ label: "Display Large", size: 57 }, { label: "Display Medium", size: 45 }, { label: "Headline Large", size: 32 }, { label: "Title Large", size: 22 }, { label: "Title Medium", size: 16 }, { label: "Body Large", size: 16 }, { label: "Body Medium", size: 14 }, { label: "Label Large", size: 14 }, { label: "Label Small", size: 11 }]
            : [{ label: "Display", size: 40 }, { label: "Title 1", size: 28 }, { label: "Title 2", size: 24 }, { label: "Title 3", size: 20 }, { label: "Subtitle 1", size: 18 }, { label: "Body 1", size: 14 }, { label: "Caption 1", size: 12 }, { label: "Caption 2", size: 10 }]
          ).map((t) => (
            <div key={t.label} style={{ display: "flex", alignItems: "baseline", gap: 12, padding: "4px 0", borderBottom: "1px solid #2a2a4a" }}>
              <span style={{ fontSize: 10, color: "#707080", width: 100, flexShrink: 0 }}>{t.label}</span>
              <span style={{ fontSize: t.size, color: "#e0e0e0", fontWeight: t.size > 20 ? 600 : 400, lineHeight: 1.3 }}>Ag</span>
              <span style={{ fontSize: 10, color: "#707080" }}>{t.size}px</span>
            </div>
          ))}
        </div>
      </div>

      {/* Shadow Scale */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 12 }}>Elevation / Shadow</h3>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {(activeSystem === "salt"
            ? [{ label: "100", shadow: `0 1px 3px ${T.shadow}` }, { label: "200", shadow: `0 2px 6px ${T.shadowMed}` }, { label: "300", shadow: `0 4px 12px ${T.shadowMed}` }, { label: "400", shadow: `0 8px 24px ${T.shadowHigh}` }]
            : activeSystem === "m3"
            ? [{ label: "Level 0", shadow: "none" }, { label: "Level 1", shadow: "0 1px 2px rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15)" }, { label: "Level 2", shadow: "0 1px 2px rgba(0,0,0,0.3), 0 2px 6px 2px rgba(0,0,0,0.15)" }, { label: "Level 3", shadow: "0 1px 3px rgba(0,0,0,0.3), 0 4px 8px 3px rgba(0,0,0,0.15)" }]
            : [{ label: "2", shadow: `0 1px 2px ${T.shadowAmbient}` }, { label: "4", shadow: `0 2px 4px ${T.shadowAmbient}, 0 0 2px ${T.shadowKey}` }, { label: "8", shadow: `0 4px 8px ${T.shadowAmbient}, 0 0 2px ${T.shadowKey}` }, { label: "28", shadow: `0 14px 28px ${T.shadowAmbient}, 0 0 8px ${T.shadowKey}` }]
          ).map((s) => (
            <div key={s.label} style={{
              width: 80, height: 80, borderRadius: 8,
              background: activeSystem === "salt" ? T.bg : activeSystem === "m3" ? T.surfaceContainerLow : T.cardBg,
              boxShadow: s.shadow, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, color: activeSystem === "salt" ? T.fg2 : activeSystem === "m3" ? T.onSurfaceVariant : T.fg2,
              border: `1px solid ${activeSystem === "salt" ? T.border : activeSystem === "m3" ? T.outlineVariant : T.stroke2}`,
            }}>
              {s.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
