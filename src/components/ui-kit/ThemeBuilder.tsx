"use client";

import React, { useState, useMemo } from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { useTheme } from "@/contexts/ThemeContext";
import { getSystemInfo } from "@/data/registry";
import { categorizeTokens, checkContrast, mergeTheme, exportThemeJSON, importThemeJSON } from "@/lib/themeBuilder";
import { isValidHex } from "@/lib/sanitizeCSS";

export function ThemeBuilder() {
  const activeSystem = useDesignHub((s) => s.activeSystem);
  const t = useTheme();
  const sysInfo = getSystemInfo(activeSystem);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [copied, setCopied] = useState(false);

  const mergedTheme = useMemo(() => mergeTheme(t.T, overrides), [t.T, overrides]);
  const categories = useMemo(() => categorizeTokens(mergedTheme), [mergedTheme]);

  const handleColorChange = (key: string, value: string) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const handleHexInput = (key: string, value: string) => {
    if (isValidHex(value)) {
      setOverrides((prev) => ({ ...prev, [key]: value }));
    }
  };

  const resetToken = (key: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const resetAll = () => setOverrides({});

  const handleExport = async () => {
    const json = exportThemeJSON(overrides, { ds: activeSystem, baseName: t.T.name || sysInfo.name });
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    const result = importThemeJSON(importText);
    if (result) {
      setOverrides(result.overrides);
      setShowImport(false);
      setImportText("");
    }
  };

  const overrideCount = Object.keys(overrides).length;

  return (
    <div style={{ padding: 32, fontFamily: t.font, color: t.fg, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0, color: t.fg }}>Theme Builder</h1>
          <p style={{ fontSize: 14, color: t.fg2, marginTop: 4 }}>
            {sysInfo.name} — {overrideCount > 0 ? `${overrideCount} custom overrides` : "Base theme"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowImport((v) => !v)} style={{
            padding: "8px 14px", borderRadius: 6, border: `1px solid ${t.border}`,
            background: "transparent", color: t.fg2, cursor: "pointer", fontSize: 13, fontFamily: t.font,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle", marginRight: 4 }}>upload</span>
            Import
          </button>
          <button onClick={handleExport} disabled={overrideCount === 0} style={{
            padding: "8px 14px", borderRadius: 6, border: "none",
            background: overrideCount > 0 ? t.accent : t.border, color: overrideCount > 0 ? t.accentFg : t.fg3,
            cursor: overrideCount > 0 ? "pointer" : "not-allowed", fontSize: 13, fontFamily: t.font,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle", marginRight: 4 }}>
              {copied ? "check" : "content_copy"}
            </span>
            {copied ? "Copied!" : "Export JSON"}
          </button>
          {overrideCount > 0 && (
            <button onClick={resetAll} style={{
              padding: "8px 14px", borderRadius: 6, border: `1px solid ${t.border}`,
              background: "transparent", color: t.fg2, cursor: "pointer", fontSize: 13, fontFamily: t.font,
            }}>
              Reset All
            </button>
          )}
        </div>
      </div>

      {/* Import panel */}
      {showImport && (
        <div style={{ marginBottom: 24, padding: 16, background: t.bg2, borderRadius: 8, border: `1px solid ${t.border}` }}>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste theme JSON here..."
            rows={4}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: `1px solid ${t.border}`, background: t.bg, color: t.fg, fontFamily: "monospace", fontSize: 12, resize: "vertical" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={handleImport} style={{ padding: "6px 12px", borderRadius: 4, border: "none", background: t.accent, color: t.accentFg, cursor: "pointer", fontSize: 12 }}>
              Apply
            </button>
            <button onClick={() => setShowImport(false)} style={{ padding: "6px 12px", borderRadius: 4, border: `1px solid ${t.border}`, background: "transparent", color: t.fg2, cursor: "pointer", fontSize: 12 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Token categories */}
      {Object.entries(categories).map(([catName, tokens]) => (
        <div key={catName} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, color: t.fg2, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>{catName}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {tokens.map(({ key, value }) => {
              const isOverridden = key in overrides;
              const original = t.T[key];
              const bgForContrast = mergedTheme.bg || mergedTheme.surface || "#ffffff";
              const contrast = value.startsWith("#") && bgForContrast.startsWith("#") ? checkContrast(value, bgForContrast) : null;

              return (
                <div key={key} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                  borderRadius: 6, border: `1px solid ${isOverridden ? t.accent : t.border}`,
                  background: isOverridden ? `${t.accent}08` : "transparent",
                }}>
                  {/* Color swatch + picker */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 6, border: `1px solid ${t.border}`,
                      background: value.startsWith("linear-gradient") ? value : value,
                    }} />
                    {value.startsWith("#") && (
                      <input
                        type="color"
                        value={value.slice(0, 7)}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: 28, height: 28 }}
                      />
                    )}
                  </div>

                  {/* Token info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: t.fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{key}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleHexInput(key, e.target.value)}
                        style={{ fontSize: 10, color: t.fg3, fontFamily: "monospace", background: "transparent", border: "none", padding: 0, width: 70, outline: "none" }}
                      />
                      {contrast && (
                        <span style={{
                          fontSize: 9, fontWeight: 600, padding: "1px 4px", borderRadius: 3,
                          background: contrast.passAA ? "rgba(0,180,0,0.15)" : "rgba(255,0,0,0.15)",
                          color: contrast.passAA ? "#0a0" : "#c00",
                        }}>
                          {contrast.ratio.toFixed(1)}:1
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reset button */}
                  {isOverridden && (
                    <button onClick={() => resetToken(key)} title="Reset to default" style={{
                      background: "none", border: "none", cursor: "pointer", padding: 2, color: t.fg3, flexShrink: 0,
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>undo</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
