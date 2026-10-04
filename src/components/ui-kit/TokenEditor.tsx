"use client";

import React, { useState, useMemo } from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { useTheme } from "@/contexts/ThemeContext";
import { getSystemInfo } from "@/data/registry";
import { categorizeTokens, checkContrast, contrastPartner, exportThemeJSON } from "@/lib/themeBuilder";
import { showToast } from "@/lib/toast";

const isHex = (v: string) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);

/**
 * Token reference: every colour token of the system and mode in view, in one
 * searchable table. Read-only by design. Values are copied one at a time or
 * all together as JSON; editing lives in the theme builder.
 */
export function TokenEditor() {
  const activeSystem = useDesignHub((s) => s.activeSystem);
  const t = useTheme();
  const sysInfo = getSystemInfo(activeSystem);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const categories = useMemo(() => categorizeTokens(t.T), [t.T]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
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
  const hasResults = filteredCount > 0;
  const modeName = (t.T.name as string) || sysInfo.name;

  const handleCopyAll = async () => {
    const allTokens: Record<string, string> = {};
    for (const tokens of Object.values(categories)) {
      for (const { key, value } of tokens) allTokens[key] = value;
    }
    const json = exportThemeJSON(allTokens, { ds: activeSystem, baseName: modeName });
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast(`${totalTokens} ${sysInfo.name} tokens copied`, { icon: "content_copy" });
    } catch {
      showToast("Clipboard unavailable. Select and copy manually.", { icon: "warning" });
    }
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Copied ${label}`, { icon: "content_copy" });
    } catch {
      showToast("Clipboard unavailable", { icon: "warning" });
    }
  };

  const statusText = search.trim()
    ? `${filteredCount} of ${totalTokens} tokens match`
    : `${totalTokens} colour tokens in ${Object.keys(categories).length} groups`;

  return (
    <main id="main-content" className="tool-main">
      <div className="tool-head">
        <div>
          <h1>Token reference</h1>
          <p className="tool-lede">
            Every colour token in {modeName}. Select a value to copy it, or copy the whole set as JSON.
          </p>
        </div>
        <div className="tool-actions">
          <button type="button" className="tool-btn is-primary" onClick={handleCopyAll}>
            <span className="material-symbols-outlined" aria-hidden="true">{copied ? "check" : "content_copy"}</span>
            {copied ? "Copied" : "Copy JSON"}
          </button>
        </div>
      </div>

      <div className="tool-search">
        <span className="material-symbols-outlined" aria-hidden="true">search</span>
        <label htmlFor="token-search" className="sr-only">Search tokens</label>
        <input
          id="token-search"
          type="search"
          placeholder="Search by token name or value"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-describedby="token-search-status"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <p id="token-search-status" className="tool-count" role="status" aria-live="polite">{statusText}</p>

      {Object.entries(filteredCategories).map(([catName, tokens]) => {
        /* A ratio only means something for a colour drawn on top of
           another, so background tokens are left blank. */
        const showContrast = catName !== "Background";
        return (
          <section key={catName} className="tool-section" aria-labelledby={`token-cat-${catName}`}>
            <h2 id={`token-cat-${catName}`}>{catName} <span>{tokens.length}</span></h2>
            <div className="token-table-scroll">
              <table className="token-table">
                <caption className="sr-only">{catName} tokens</caption>
                <thead>
                  <tr>
                    <th scope="col" className="col-token">Token</th>
                    <th scope="col">Value</th>
                    <th scope="col" className="col-contrast">Contrast</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map(({ key, value }) => {
                    /* Measured against the surface the token is meant for
                       (onPrimary on primary), else the page background. */
                    const partner = contrastPartner(key, t.T);
                    const against = partner ? String(t.T[partner]) : t.bg;
                    const contrast = showContrast && isHex(value) && isHex(against) ? checkContrast(value, against) : null;
                    return (
                      <tr key={key}>
                        <th scope="row">
                          <span className="token-name">
                            <span className="token-swatch" style={{ "--swatch": value } as React.CSSProperties} aria-hidden="true" />
                            <span>{key}</span>
                          </span>
                        </th>
                        <td className="cell-value">
                          <button type="button" className="token-copy" onClick={() => copyText(value, value)} aria-label={`Copy ${key} value ${value}`}>
                            <span>{value}</span>
                            <span className="material-symbols-outlined" aria-hidden="true">content_copy</span>
                          </button>
                        </td>
                        <td className="cell-contrast">
                          {contrast ? (
                            <span className="token-ratio">
                              <b>{contrast.ratio.toFixed(1)}:1</b> on {partner ?? "page"}
                              <em>{contrast.passAA ? "AA text" : contrast.ratio >= 3 ? "AA large text" : "below AA"}</em>
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {!hasResults && (
        <div className="tool-empty">
          <strong>No tokens match &ldquo;{search.trim()}&rdquo;</strong>
          Search by part of a token name, such as accent or border, or by a hex value.
          <div>
            <button type="button" className="tool-btn" onClick={() => setSearch("")}>Clear search</button>
          </div>
        </div>
      )}
    </main>
  );
}
