"use client";

import React, { useState, useMemo, useRef } from "react";
import { useDesignHub, type SystemId } from "@/store/useDesignHub";
import { useTheme } from "@/contexts/ThemeContext";
import { getSystemInfo } from "@/data/registry";
import { categorizeTokens, checkContrast, contrastPartner, mergeTheme, exportThemeJSON, importThemeJSON } from "@/lib/themeBuilder";
import { isValidHex } from "@/lib/sanitizeCSS";
import { showToast } from "@/lib/toast";

type HistoryEntry = { key: string; prev: string | undefined };

const HISTORY_CAP = 5;
const isHex = (v: string) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);

/* Which token each system uses for the roles the preview draws. Same
   mapping the UI kit shell uses, so an edit shows up where that token is
   really applied. */
const PREVIEW_KEYS: Record<SystemId, Record<"bg" | "bg2" | "fg" | "fg2" | "accent" | "accentFg" | "accentText" | "border", string>> = {
  salt:   { bg: "bg", bg2: "bg2", fg: "fg", fg2: "fg2", accent: "accent", accentFg: "accentFg", accentText: "accentText", border: "border" },
  m3:     { bg: "surface", bg2: "surfaceContainerLow", fg: "onSurface", fg2: "onSurfaceVariant", accent: "primary", accentFg: "onPrimary", accentText: "primary", border: "outlineVariant" },
  fluent: { bg: "bg1", bg2: "bg2", fg: "fg1", fg2: "fg2", accent: "brandBg", accentFg: "fgOnBrand", accentText: "brandFg1", border: "stroke2" },
  carbon: { bg: "bg", bg2: "bg2", fg: "fg", fg2: "fg2", accent: "buttonPrimary", accentFg: "textOnColor", accentText: "accentText", border: "border" },
  uoaui:  { bg: "bg", bg2: "bg2", fg: "fg", fg2: "fg2", accent: "accent", accentFg: "accentFg", accentText: "accentHover", border: "border" },
};

/** Remount on system or mode change: overrides are edits to one base theme,
    so carrying them into another would show colours that theme never had. */
export function ThemeBuilder() {
  const activeSystem = useDesignHub((s) => s.activeSystem);
  const t = useTheme();
  return <ThemeBuilderInner key={`${activeSystem}:${t.bg}:${t.fg}`} />;
}

function ThemeBuilderInner() {
  const activeSystem = useDesignHub((s) => s.activeSystem);
  const t = useTheme();
  const sysInfo = getSystemInfo(activeSystem);
  const baseName = (t.T.name as string) || sysInfo.name;
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [copied, setCopied] = useState(false);

  /* Undo ring, capped at five steps. Each entry keeps the token and the
     value it had before the change (undefined when it was not overridden). */
  const history = useRef<HistoryEntry[]>([]);
  const [historyLen, setHistoryLen] = useState(0);

  const mergedTheme = useMemo(() => mergeTheme(t.T, overrides), [t.T, overrides]);
  const categories = useMemo(() => categorizeTokens(mergedTheme), [mergedTheme]);
  const pk = PREVIEW_KEYS[activeSystem];
  const pageBg = String(mergedTheme[pk.bg] ?? t.bg);

  const pushHistory = (entry: HistoryEntry) => {
    const next = [...history.current, entry];
    if (next.length > HISTORY_CAP) next.shift();
    history.current = next;
    setHistoryLen(next.length);
  };

  const applyValue = (key: string, value: string) => {
    if (overrides[key] === value || (!(key in overrides) && t.T[key] === value)) return;
    pushHistory({ key, prev: overrides[key] });
    setOverrides({ ...overrides, [key]: value });
  };

  /* The text field keeps a draft while it is being typed: a half-typed hex
     is not a colour yet, so it is held back until it is valid. */
  const handleHexInput = (key: string, value: string) => {
    setDrafts((d) => ({ ...d, [key]: value }));
    if (isValidHex(value) && isHex(value)) applyValue(key, value);
  };
  const clearDraft = (key: string) => setDrafts((d) => {
    if (!(key in d)) return d;
    const next = { ...d };
    delete next[key];
    return next;
  });

  const resetToken = (key: string) => {
    if (!(key in overrides)) return;
    pushHistory({ key, prev: overrides[key] });
    const next = { ...overrides };
    delete next[key];
    setOverrides(next);
    clearDraft(key);
  };

  const undoLast = () => {
    const last = history.current[history.current.length - 1];
    if (!last) return;
    const next = { ...overrides };
    if (last.prev === undefined) delete next[last.key];
    else next[last.key] = last.prev;
    setOverrides(next);
    clearDraft(last.key);
    history.current = history.current.slice(0, -1);
    setHistoryLen(history.current.length);
  };

  const resetAll = () => {
    if (Object.keys(overrides).length === 0) return;
    history.current = [];
    setHistoryLen(0);
    setOverrides({});
    setDrafts({});
    showToast("All colours reset to the base theme", { icon: "restart_alt" });
  };

  const handleExport = async () => {
    const json = exportThemeJSON(overrides, { ds: activeSystem, baseName });
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast("Theme JSON copied", { icon: "content_copy" });
    } catch {
      showToast("Clipboard unavailable. Select and copy manually.", { icon: "warning" });
    }
  };

  const handleImport = () => {
    const result = importThemeJSON(importText);
    if (!result) {
      setImportError("This is not theme JSON. Paste the text copied with Copy JSON: an object with an \"overrides\" list of token names and colours.");
      return;
    }
    if (result.meta?.ds && result.meta.ds !== activeSystem) {
      const from = (() => { try { return getSystemInfo(result.meta!.ds as SystemId).name; } catch { return result.meta!.ds; } })();
      setImportError(`This theme was made for ${from}. Switch to that system above, then apply it.`);
      return;
    }
    const usable: Record<string, string> = {};
    for (const [key, value] of Object.entries(result.overrides)) {
      if (typeof value === "string" && typeof t.T[key] === "string" && isValidHex(value)) usable[key] = value;
    }
    const count = Object.keys(usable).length;
    if (count === 0) {
      setImportError(`None of these tokens exist in ${baseName}. Check the theme was copied from the same system and mode.`);
      return;
    }
    setOverrides(usable);
    setDrafts({});
    history.current = [];
    setHistoryLen(0);
    setShowImport(false);
    setImportText("");
    setImportError("");
    showToast(`${count} ${count === 1 ? "colour" : "colours"} applied`, { icon: "check" });
  };

  const overrideCount = Object.keys(overrides).length;
  const canUndo = historyLen > 0;
  const pv = (role: keyof typeof pk) => String(mergedTheme[pk[role]] ?? "");

  return (
    <main id="main-content" className="tool-main">
      <div className="tool-head">
        <div>
          <h1>Theme builder</h1>
          <p className="tool-lede">
            Change any hex colour in {baseName} and check it in the preview. Changes stay on this page until you copy them as JSON.
          </p>
        </div>
        <div className="tool-actions">
          {canUndo && (
            <button type="button" className="tool-btn" onClick={undoLast}>
              <span className="material-symbols-outlined" aria-hidden="true">undo</span>
              Undo
            </button>
          )}
          {overrideCount > 0 && (
            <button type="button" className="tool-btn" onClick={resetAll}>Reset all</button>
          )}
          <button type="button" className="tool-btn" onClick={() => { setShowImport((v) => !v); setImportError(""); }} aria-expanded={showImport} aria-controls="theme-import-panel">
            <span className="material-symbols-outlined" aria-hidden="true">upload</span>
            Import
          </button>
          <button
            type="button"
            className="tool-btn is-primary"
            onClick={handleExport}
            disabled={overrideCount === 0}
            aria-describedby="theme-status"
          >
            <span className="material-symbols-outlined" aria-hidden="true">{copied ? "check" : "content_copy"}</span>
            {copied ? "Copied" : "Copy JSON"}
          </button>
        </div>
      </div>
      <p id="theme-status" className="tool-count" role="status" aria-live="polite">
        {overrideCount > 0
          ? `${overrideCount} ${overrideCount === 1 ? "colour" : "colours"} changed from ${baseName}.`
          : "No changes yet. Copy JSON becomes available after the first change."}
      </p>

      {showImport && (
        <div className="theme-import" id="theme-import-panel">
          <label htmlFor="theme-import">Theme JSON</label>
          <textarea
            id="theme-import"
            value={importText}
            onChange={(e) => { setImportText(e.target.value); if (importError) setImportError(""); }}
            placeholder={'{ "overrides": { "accent": "#0A66C2" } }'}
            aria-invalid={importError ? true : undefined}
            aria-describedby={importError ? "theme-import-error" : undefined}
            spellCheck={false}
          />
          {importError && (
            <p id="theme-import-error" className="theme-import-error" role="alert">
              <span className="material-symbols-outlined" aria-hidden="true">error</span>
              {importError}
            </p>
          )}
          <div className="tool-actions">
            <button type="button" className="tool-btn is-primary" onClick={handleImport} disabled={!importText.trim()}>Apply</button>
            <button type="button" className="tool-btn" onClick={() => { setShowImport(false); setImportError(""); }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="theme-layout">
        <div>
          {Object.entries(categories).map(([catName, tokens], idx) => (
            <section key={catName} className="tool-section" style={idx === 0 ? { marginTop: 0 } : undefined} aria-labelledby={`theme-cat-${catName}`}>
              <h2 id={`theme-cat-${catName}`}>{catName} <span>{tokens.length}</span></h2>
              <div className="theme-grid">
                {tokens.map(({ key, value }) => {
                  const isOverridden = key in overrides;
                  const editable = isHex(value);
                  const draft = drafts[key];
                  const invalid = draft !== undefined && !(isValidHex(draft) && isHex(draft));
                  /* Measured against the surface the token is meant for
                     (onPrimary on primary), else the page background. Both
                     sides follow the edits, so the ratio stays live. */
                  const partner = contrastPartner(key, mergedTheme);
                  const against = partner ? String(mergedTheme[partner]) : pageBg;
                  const onWhat = partner ?? "the page background";
                  const contrast = catName !== "Background" && editable && isHex(against) ? checkContrast(value, against) : null;
                  return (
                    <div key={key} className={`theme-token${isOverridden ? " is-changed" : ""}`}>
                      <div className="theme-token-swatch">
                        <span className="token-swatch" style={{ "--swatch": value } as React.CSSProperties} aria-hidden="true" />
                        {editable && (
                          <input
                            type="color"
                            value={value.length === 4 ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}` : value}
                            onChange={(e) => { clearDraft(key); applyValue(key, e.target.value); }}
                            aria-label={`Pick a colour for ${key}`}
                          />
                        )}
                      </div>
                      <div className="theme-token-body">
                        <div className="theme-token-name">{key}</div>
                        <div className="theme-token-meta">
                          {editable ? (
                            <>
                              <label htmlFor={`hex-${key}`} className="sr-only">{`Hex value for ${key}`}</label>
                              <input
                                id={`hex-${key}`}
                                type="text"
                                value={draft ?? value}
                                onChange={(e) => handleHexInput(key, e.target.value.trim())}
                                onBlur={() => clearDraft(key)}
                                aria-invalid={invalid ? true : undefined}
                                spellCheck={false}
                                autoComplete="off"
                                maxLength={7}
                              />
                            </>
                          ) : (
                            <code title={`${value} (not a hex colour, so it cannot be edited here)`}>{value}</code>
                          )}
                          {contrast && (
                            <span
                              className="theme-ratio"
                              data-pass={contrast.passAA}
                              title={`${contrast.passAA ? "Meets" : "Below"} WCAG AA for text on ${onWhat}`}
                            >
                              <span aria-hidden="true">{contrast.ratio.toFixed(1)}:1</span>
                              <span className="sr-only">{`Contrast ${contrast.ratio.toFixed(1)} to 1 on ${onWhat}, ${contrast.passAA ? "meets" : "below"} AA for text`}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      {isOverridden && (
                        <button type="button" className="theme-reset" onClick={() => resetToken(key)} title="Reset to the base colour" aria-label={`Reset ${key} to the base colour`}>
                          <span className="material-symbols-outlined" aria-hidden="true">restart_alt</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <aside className="theme-preview-wrap" aria-labelledby="theme-preview-title">
          <h2 id="theme-preview-title">Preview</h2>
          <div
            className="theme-preview"
            data-testid="theme-preview"
            style={{
              "--pv-bg": pv("bg"), "--pv-bg2": pv("bg2"), "--pv-fg": pv("fg"), "--pv-fg2": pv("fg2"),
              "--pv-accent": pv("accent"), "--pv-accent-fg": pv("accentFg"), "--pv-accent-text": pv("accentText"),
              "--pv-border": pv("border"),
            } as React.CSSProperties}
          >
            <h3>Portfolio summary</h3>
            <p>Quarter to date, all desks</p>
            <div className="theme-preview-card">
              <dl>
                <dt>Net exposure</dt><dd>42.8m</dd>
                <dt>Open positions</dt><dd>1,204</dd>
                <dt>Limit used</dt><dd>61%</dd>
              </dl>
            </div>
            <div className="theme-preview-row">
              <span className="pv-primary">Approve</span>
              <span className="pv-secondary">Review</span>
              <span className="pv-link">View report</span>
            </div>
          </div>
          <p className="tool-note">
            Drawn with {pk.bg}, {pk.bg2}, {pk.fg}, {pk.fg2}, {pk.accent}, {pk.accentFg} and {pk.border}.
          </p>
        </aside>
      </div>
    </main>
  );
}
