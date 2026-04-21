"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { useTheme } from "@/contexts/ThemeContext";
import { getSystemInfo } from "@/data/registry";
import { categorizeTokens, checkContrast, mergeTheme, exportThemeJSON, importThemeJSON } from "@/lib/themeBuilder";
import { isValidHex } from "@/lib/sanitizeCSS";
import { showToast } from "@/lib/toast";

type HistoryEntry = { key: string; prev: string | undefined; next: string };

const HISTORY_CAP = 5;

export function ThemeBuilder() {
  const activeSystem = useDesignHub((s) => s.activeSystem);
  const t = useTheme();
  const sysInfo = getSystemInfo(activeSystem);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [copied, setCopied] = useState(false);

  /* Undo ring — caps at 5 entries. Each entry records the token key,
     the prior value (undefined if the token wasn't overridden yet),
     and the new value, so undoing either restores the override or
     removes it. */
  const history = useRef<HistoryEntry[]>([]);
  const [historyLen, setHistoryLen] = useState(0);

  /* Transient "Saved" chip — a gentle confirmation that lives for 1.2s
     after any change, then fades. Replaces the implicit "mystery save"
     that made overrides feel risky. */
  const [savedFlash, setSavedFlash] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashSaved = useCallback(() => {
    setSavedFlash(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedFlash(false), 1200);
  }, []);

  useEffect(() => () => {
    if (savedTimer.current) clearTimeout(savedTimer.current);
  }, []);

  const mergedTheme = useMemo(() => mergeTheme(t.T, overrides), [t.T, overrides]);
  const categories = useMemo(() => categorizeTokens(mergedTheme), [mergedTheme]);

  const pushHistory = (entry: HistoryEntry) => {
    const next = [...history.current, entry];
    if (next.length > HISTORY_CAP) next.shift();
    history.current = next;
    setHistoryLen(next.length);
  };

  const handleColorChange = (key: string, value: string) => {
    setOverrides((prev) => {
      if (prev[key] === value) return prev;
      pushHistory({ key, prev: prev[key], next: value });
      flashSaved();
      return { ...prev, [key]: value };
    });
  };

  const handleHexInput = (key: string, value: string) => {
    if (!isValidHex(value)) return;
    setOverrides((prev) => {
      if (prev[key] === value) return prev;
      pushHistory({ key, prev: prev[key], next: value });
      flashSaved();
      return { ...prev, [key]: value };
    });
  };

  const resetToken = (key: string) => {
    setOverrides((prev) => {
      if (!(key in prev)) return prev;
      pushHistory({ key, prev: prev[key], next: "" });
      flashSaved();
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const undoLast = () => {
    const last = history.current[history.current.length - 1];
    if (!last) return;
    setOverrides((prev) => {
      const next = { ...prev };
      if (last.prev === undefined) {
        delete next[last.key];
      } else {
        next[last.key] = last.prev;
      }
      return next;
    });
    history.current = history.current.slice(0, -1);
    setHistoryLen(history.current.length);
  };

  const resetAll = () => {
    if (Object.keys(overrides).length === 0) return;
    /* Snapshot the current state into history so resetAll is itself
       undoable — pushes one entry per overridden token (capped by
       HISTORY_CAP). */
    const snapshot = Object.entries(overrides).slice(-HISTORY_CAP);
    history.current = snapshot.map(([key, prev]) => ({ key, prev, next: "" }));
    setHistoryLen(history.current.length);
    setOverrides({});
    flashSaved();
  };

  const handleExport = async () => {
    const json = exportThemeJSON(overrides, { ds: activeSystem, baseName: t.T.name || sysInfo.name });
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast("Theme JSON copied to clipboard", { icon: "content_copy" });
    } catch {
      showToast("Clipboard unavailable — select and copy manually", { icon: "warning" });
    }
  };

  const handleImport = () => {
    const result = importThemeJSON(importText);
    if (result) {
      setOverrides(result.overrides);
      history.current = [];
      setHistoryLen(0);
      setShowImport(false);
      setImportText("");
      flashSaved();
    }
  };

  const overrideCount = Object.keys(overrides).length;
  const canUndo = historyLen > 0;

  return (
    <main id="main-content" style={{ padding: 32, fontFamily: t.font, color: t.fg, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0, color: t.fg }}>Theme Builder</h1>
            {/* Saved chip — transient, non-blocking */}
            <span
              role="status"
              aria-live="polite"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 10px",
                borderRadius: "var(--dh-curve-pill)",
                background: `${t.accent}14`,
                color: t.accent,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.2,
                opacity: savedFlash ? 1 : 0,
                transform: savedFlash ? "translateY(0)" : "translateY(-2px)",
                transition: "opacity 160ms ease, transform 160ms ease",
                pointerEvents: "none",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 12 }} aria-hidden="true">
                check
              </span>
              Saved
            </span>
          </div>
          <p style={{ fontSize: 14, color: t.fg2, marginTop: 4 }}>
            {sysInfo.name} — {overrideCount > 0 ? `${overrideCount} custom override${overrideCount === 1 ? "" : "s"}` : "Base theme"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {canUndo && (
            <button
              onClick={undoLast}
              title={`Undo last change (${historyLen} step${historyLen === 1 ? "" : "s"} available)`}
              style={{
                padding: "8px 12px",
                borderRadius: "var(--dh-curve-sm)",
                border: `1px solid ${t.border}`,
                background: "transparent",
                color: t.fg2,
                cursor: "pointer",
                fontSize: 13,
                fontFamily: t.font,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">undo</span>
              Undo
            </button>
          )}
          <button
            onClick={() => setShowImport((v) => !v)}
            aria-expanded={showImport}
            style={{
              padding: "8px 14px",
              borderRadius: "var(--dh-curve-sm)",
              border: `1px solid ${t.border}`,
              background: "transparent",
              color: t.fg2,
              cursor: "pointer",
              fontSize: 13,
              fontFamily: t.font,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle", marginRight: 4 }} aria-hidden="true">upload</span>
            Import
          </button>
          <button
            onClick={handleExport}
            disabled={overrideCount === 0}
            style={{
              padding: "8px 14px",
              borderRadius: "var(--dh-curve-sm)",
              border: "none",
              background: overrideCount > 0 ? t.accent : t.border,
              color: overrideCount > 0 ? t.accentFg : t.fg3,
              cursor: overrideCount > 0 ? "pointer" : "not-allowed",
              fontSize: 13,
              fontFamily: t.font,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle", marginRight: 4 }} aria-hidden="true">
              {copied ? "check" : "content_copy"}
            </span>
            {copied ? "Copied!" : "Export JSON"}
          </button>
          {overrideCount > 0 && (
            <button
              onClick={resetAll}
              style={{
                padding: "8px 14px",
                borderRadius: "var(--dh-curve-sm)",
                border: `1px solid ${t.border}`,
                background: "transparent",
                color: t.fg2,
                cursor: "pointer",
                fontSize: 13,
                fontFamily: t.font,
              }}
            >
              Reset All
            </button>
          )}
        </div>
      </div>

      {/* Import panel */}
      {showImport && (
        <div style={{ marginBottom: 24, padding: 16, background: t.bg2, borderRadius: "var(--dh-curve-md)", border: `1px solid ${t.border}` }}>
          <label htmlFor="theme-import" className="sr-only">Theme JSON to import</label>
          <textarea
            id="theme-import"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste theme JSON here..."
            rows={4}
            style={{ width: "100%", padding: 8, borderRadius: "var(--dh-curve-sm)", border: `1px solid ${t.border}`, background: t.bg, color: t.fg, fontFamily: "monospace", fontSize: 12, resize: "vertical" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={handleImport} style={{ padding: "6px 12px", borderRadius: "var(--dh-curve-sm)", border: "none", background: t.accent, color: t.accentFg, cursor: "pointer", fontSize: 12 }}>
              Apply
            </button>
            <button onClick={() => setShowImport(false)} style={{ padding: "6px 12px", borderRadius: "var(--dh-curve-sm)", border: `1px solid ${t.border}`, background: "transparent", color: t.fg2, cursor: "pointer", fontSize: 12 }}>
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
              const bgForContrast = mergedTheme.bg || mergedTheme.surface || "#ffffff";
              const contrast = value.startsWith("#") && bgForContrast.startsWith("#") ? checkContrast(value, bgForContrast) : null;

              return (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: "var(--dh-curve-sm)",
                    border: `1px solid ${isOverridden ? t.accent : t.border}`,
                    background: isOverridden ? `${t.accent}08` : "transparent",
                  }}
                >
                  {/* Color swatch + picker */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "var(--dh-curve-sm)",
                        border: `1px solid ${t.border}`,
                        background: value.startsWith("linear-gradient") ? value : value,
                      }}
                      aria-hidden="true"
                    />
                    {value.startsWith("#") && (
                      <input
                        type="color"
                        value={value.slice(0, 7)}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        aria-label={`Pick a color for ${key}`}
                        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: 28, height: 28 }}
                      />
                    )}
                  </div>

                  {/* Token info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: t.fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{key}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
                      <label htmlFor={`hex-${key}`} className="sr-only">{`Hex value for ${key}`}</label>
                      <input
                        id={`hex-${key}`}
                        type="text"
                        value={value}
                        onChange={(e) => handleHexInput(key, e.target.value)}
                        style={{ fontSize: 10, color: t.fg3, fontFamily: "monospace", background: "transparent", border: "none", padding: 0, width: 70, outline: "none" }}
                      />
                      {contrast && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 600,
                            padding: "1px 4px",
                            borderRadius: "var(--dh-curve-sm)",
                            background: contrast.passAA ? "rgba(0,180,0,0.15)" : "rgba(255,0,0,0.15)",
                            color: contrast.passAA ? "#0a0" : "#c00",
                          }}
                          aria-label={`Contrast ratio ${contrast.ratio.toFixed(1)} to 1, ${contrast.passAA ? "passes" : "fails"} WCAG AA`}
                        >
                          {contrast.ratio.toFixed(1)}:1
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reset button */}
                  {isOverridden && (
                    <button
                      onClick={() => resetToken(key)}
                      title="Reset to default"
                      aria-label={`Reset ${key} to default`}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 2,
                        color: t.fg3,
                        flexShrink: 0,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden="true">undo</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </main>
  );
}
