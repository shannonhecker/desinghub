"use client";

import React, { useState, useMemo } from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { useTheme } from "@/contexts/ThemeContext";
import { getSystemInfo } from "@/data/registry";
import { categorizeTokens, exportThemeJSON } from "@/lib/themeBuilder";
import { showToast } from "@/lib/toast";

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
        (tok) => tok.key.toLowerCase().includes(q) || tok.value.toLowerCase().includes(q),
      );
      if (filtered.length > 0) result[cat] = filtered;
    }
    return result;
  }, [categories, search]);

  const totalTokens = Object.values(categories).reduce((sum, arr) => sum + arr.length, 0);
  const filteredCount = Object.values(filteredCategories).reduce((sum, arr) => sum + arr.length, 0);
  const hasResults = Object.keys(filteredCategories).length > 0;

  const handleExportAll = async () => {
    const allTokens: Record<string, string> = {};
    for (const tokens of Object.values(categories)) {
      for (const { key, value } of tokens) allTokens[key] = value;
    }
    const json = exportThemeJSON(allTokens, { ds: activeSystem, baseName: t.T.name || sysInfo.name });
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast(`${totalTokens} ${sysInfo.name} tokens copied`, { icon: "content_copy" });
    } catch {
      showToast("Clipboard unavailable — select and copy manually", { icon: "warning" });
    }
  };

  return (
    <main id="main-content" style={{ padding: 32, fontFamily: t.font, color: t.fg, maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0, color: t.fg }}>Token Editor</h1>
          <p style={{ fontSize: 14, color: t.fg2, marginTop: 4 }}>
            {sysInfo.name} — {totalTokens} color tokens
          </p>
        </div>
        <button
          onClick={handleExportAll}
          style={{
            padding: "8px 14px",
            borderRadius: "var(--dh-curve-sm)",
            border: "none",
            background: t.accent,
            color: t.accentFg,
            cursor: "pointer",
            fontSize: 13,
            fontFamily: t.font,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle", marginRight: 4 }} aria-hidden="true">
            {copied ? "check" : "download"}
          </span>
          {copied ? "Copied!" : "Export All"}
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <span
          className="material-symbols-outlined"
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 18,
            color: t.fg3,
            pointerEvents: "none",
          }}
          aria-hidden="true"
        >
          search
        </span>
        <label htmlFor="token-search" className="sr-only">Search tokens</label>
        <input
          id="token-search"
          type="text"
          placeholder="Search tokens..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-describedby="token-search-status"
          style={{
            width: "100%",
            padding: "10px 12px 10px 36px",
            borderRadius: "var(--dh-curve-sm)",
            border: `1px solid ${t.border}`,
            background: t.bg2,
            color: t.fg,
            fontSize: 14,
            fontFamily: t.font,
            outline: "none",
          }}
        />
        {/* Live search count announcement for assistive tech */}
        <div id="token-search-status" role="status" aria-live="polite" className="sr-only">
          {search
            ? `${filteredCount} ${filteredCount === 1 ? "token" : "tokens"} match "${search}"`
            : `${totalTokens} tokens`}
        </div>
      </div>

      {/* Token table by category */}
      {Object.entries(filteredCategories).map(([catName, tokens]) => (
        <section key={catName} style={{ marginBottom: 28 }} aria-labelledby={`token-cat-${catName}`}>
          <h2
            id={`token-cat-${catName}`}
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: t.fg2,
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {catName} ({tokens.length})
          </h2>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: `1px solid ${t.border}`,
              borderRadius: "var(--dh-curve-sm)",
              overflow: "hidden",
              tableLayout: "fixed",
            }}
          >
            <caption className="sr-only">{catName} tokens</caption>
            <thead>
              <tr style={{ background: t.bg2 }}>
                <th
                  scope="col"
                  style={{
                    width: 36,
                    padding: "8px 12px",
                    textAlign: "left",
                    fontSize: 10,
                    fontWeight: 600,
                    color: t.fg3,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                  aria-label="Color swatch"
                />
                <th
                  scope="col"
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    fontSize: 10,
                    fontWeight: 600,
                    color: t.fg3,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Token
                </th>
                <th
                  scope="col"
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    fontSize: 10,
                    fontWeight: 600,
                    color: t.fg3,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Value
                </th>
                <th
                  scope="col"
                  style={{
                    width: 120,
                    padding: "8px 12px",
                    textAlign: "left",
                    fontSize: 10,
                    fontWeight: 600,
                    color: t.fg3,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  CSS Var
                </th>
              </tr>
            </thead>
            <tbody>
              {tokens.map(({ key, value }, i) => (
                <tr
                  key={key}
                  style={{
                    borderTop: i > 0 ? `1px solid ${t.border}` : "none",
                    fontSize: 13,
                  }}
                >
                  <td style={{ padding: "8px 12px", verticalAlign: "middle" }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "var(--dh-curve-sm)",
                        border: `1px solid ${t.border}`,
                        background: value,
                      }}
                      aria-hidden="true"
                    />
                  </td>
                  <th scope="row" style={{ padding: "8px 12px", fontWeight: 500, color: t.fg, textAlign: "left" }}>
                    {key}
                  </th>
                  <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11, color: t.fg2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {value}
                  </td>
                  <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 10, color: t.fg3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    --{key}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      {!hasResults && (
        <div style={{ textAlign: "center", padding: 48, color: t.fg3 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 36, marginBottom: 8, opacity: 0.5 }} aria-hidden="true">
            search_off
          </span>
          <p style={{ margin: "0 0 4px", fontSize: 14, color: t.fg2, fontWeight: 500 }}>
            No tokens match &ldquo;{search}&rdquo;
          </p>
          <p style={{ margin: 0, fontSize: 12, color: t.fg3 }}>
            Try <em>color</em>, <em>spacing</em>, or a hex value.
          </p>
        </div>
      )}
    </main>
  );
}
