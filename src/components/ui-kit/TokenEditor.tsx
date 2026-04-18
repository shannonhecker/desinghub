"use client";

import React, { useState, useMemo } from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { useTheme } from "@/contexts/ThemeContext";
import { getSystemInfo } from "@/data/registry";
import { categorizeTokens, exportThemeJSON } from "@/lib/themeBuilder";

export function TokenEditor() {
  const activeSystem = useDesignHub((s) => s.activeSystem);
  const t = useTheme();
  const sysInfo = getSystemInfo(activeSystem);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const categories = useMemo(() => categorizeTokens(t.T), [t.T]);

  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    const q = search.toLowerCase();
    const result: Record<string, { key: string; value: string }[]> = {};
    for (const [cat, tokens] of Object.entries(categories)) {
      const filtered = tokens.filter(
        (tok) => tok.key.toLowerCase().includes(q) || tok.value.toLowerCase().includes(q)
      );
      if (filtered.length > 0) result[cat] = filtered;
    }
    return result;
  }, [categories, search]);

  const totalTokens = Object.values(categories).reduce((sum, arr) => sum + arr.length, 0);

  const handleExportAll = async () => {
    const allTokens: Record<string, string> = {};
    for (const tokens of Object.values(categories)) {
      for (const { key, value } of tokens) allTokens[key] = value;
    }
    const json = exportThemeJSON(allTokens, { ds: activeSystem, baseName: t.T.name || sysInfo.name });
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: 32, fontFamily: t.font, color: t.fg, maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0, color: t.fg }}>Token Editor</h1>
          <p style={{ fontSize: 14, color: t.fg2, marginTop: 4 }}>
            {sysInfo.name} - {totalTokens} color tokens
          </p>
        </div>
        <button onClick={handleExportAll} style={{
          padding: "8px 14px", borderRadius: 6, border: "none",
          background: t.accent, color: t.accentFg, cursor: "pointer", fontSize: 13, fontFamily: t.font,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle", marginRight: 4 }}>
            {copied ? "check" : "download"}
          </span>
          {copied ? "Copied!" : "Export All"}
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <span className="material-symbols-outlined" style={{
          position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
          fontSize: 18, color: t.fg3, pointerEvents: "none",
        }}>search</span>
        <input
          type="text"
          placeholder="Search tokens..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "10px 12px 10px 36px", borderRadius: 8,
            border: `1px solid ${t.border}`, background: t.bg2, color: t.fg,
            fontSize: 14, fontFamily: t.font, outline: "none",
          }}
        />
      </div>

      {/* Token table by category */}
      {Object.entries(filteredCategories).map(([catName, tokens]) => (
        <div key={catName} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 11, fontWeight: 700, color: t.fg2, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
            {catName} ({tokens.length})
          </h2>
          <div style={{
            border: `1px solid ${t.border}`, borderRadius: 8, overflow: "hidden",
          }}>
            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "36px 1fr 1fr 80px", gap: 8,
              padding: "8px 12px", background: t.bg2, fontSize: 10, fontWeight: 600,
              color: t.fg3, textTransform: "uppercase", letterSpacing: 0.5,
            }}>
              <span />
              <span>Token</span>
              <span>Value</span>
              <span>CSS Var</span>
            </div>
            {/* Rows */}
            {tokens.map(({ key, value }, i) => (
              <div key={key} style={{
                display: "grid", gridTemplateColumns: "36px 1fr 1fr 80px", gap: 8,
                padding: "8px 12px", alignItems: "center",
                borderTop: i > 0 ? `1px solid ${t.border}` : "none",
                fontSize: 13,
              }}>
                {/* Swatch */}
                <div style={{
                  width: 24, height: 24, borderRadius: 4,
                  border: `1px solid ${t.border}`,
                  background: value,
                }} />
                {/* Token name */}
                <span style={{ fontWeight: 500, color: t.fg }}>{key}</span>
                {/* Value */}
                <span style={{ fontFamily: "monospace", fontSize: 11, color: t.fg2 }}>{value}</span>
                {/* CSS var */}
                <span style={{ fontFamily: "monospace", fontSize: 10, color: t.fg3 }}>
                  --{key}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {Object.keys(filteredCategories).length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: t.fg3 }}>
          No tokens match "{search}"
        </div>
      )}
    </div>
  );
}
