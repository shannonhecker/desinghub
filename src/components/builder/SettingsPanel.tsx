"use client";

import React from "react";
import { useBuilder, type DesignSystem, type InterfaceType } from "@/store/useBuilder";
import { ACCENT_PRESETS, ACCENT_KEY_BY_DS } from "@/data/_shared/accentPresets";

/* Issue #12: per-DS theme-key options. Wired to store.setThemeKey. */
const THEME_KEYS: Record<DesignSystem, { value: string; label: string }[]> = {
  salt: [
    { value: "jpm-light", label: "JPM Light" },
    { value: "jpm-dark", label: "JPM Dark" },
    { value: "legacy-light", label: "Legacy Light" },
    { value: "legacy-dark", label: "Legacy Dark" },
  ],
  carbon: [
    { value: "white", label: "White" },
    { value: "g10", label: "Gray 10" },
    { value: "g90", label: "Gray 90" },
    { value: "g100", label: "Gray 100" },
  ],
  m3: [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "light-mc", label: "Medium-contrast Light" },
    { value: "dark-mc", label: "Medium-contrast Dark" },
  ],
  fluent: [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ],
  uoaui: [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ],
};

const DS_OPTIONS: { id: DesignSystem; label: string }[] = [
  { id: "salt", label: "Salt DS (J.P. Morgan)" },
  { id: "m3", label: "Material 3 (Google)" },
  { id: "fluent", label: "Fluent 2 (Microsoft)" },
  { id: "uoaui", label: "uoaui DS" },
  { id: "carbon", label: "Carbon DS (IBM)" },
];

const INTERFACE_OPTIONS: { id: InterfaceType; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "landing", label: "Landing Page" },
  { id: "form", label: "Form / Wizard" },
  { id: "ecommerce", label: "E-Commerce" },
  { id: "blog", label: "Blog / Content" },
  { id: "portfolio", label: "Portfolio" },
];

const DENSITY_OPTIONS: Record<DesignSystem, { value: string; label: string }[]> = {
  salt: [
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
    { value: "touch", label: "Touch" },
  ],
  m3: [
    { value: "0", label: "Default" },
    { value: "-1", label: "-1" },
    { value: "-2", label: "-2" },
    { value: "-3", label: "-3" },
  ],
  fluent: [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
  ],
  uoaui: [
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
    { value: "touch", label: "Touch" },
  ],
  /* Carbon density ladder - mirrors Carbon's spacing-scale semantics
     (compact = 24px control height, normal = 32px, spacious = 48px). */
  carbon: [
    { value: "compact", label: "Compact" },
    { value: "normal", label: "Normal" },
    { value: "spacious", label: "Spacious" },
  ],
};

const AVAILABLE_COMPONENTS: Record<DesignSystem, string[]> = {
  salt: ["buttons", "inputs", "image", "cards", "tabs", "banners", "dialog", "badges", "avatars", "tooltips", "progress", "accordion", "form-field", "menu", "drawer", "table", "date-picker", "checkboxes", "radios", "switches", "slider"],
  m3: ["buttons", "text-fields", "image", "chips", "cards", "switches", "checkboxes", "radios", "sliders", "fabs", "icon-buttons", "nav-bar", "tabs", "dialogs", "snackbar", "progress", "tooltips", "badges", "menus", "date-pickers"],
  fluent: ["buttons", "inputs", "image", "checkboxes", "radios", "switches", "slider", "cards", "badges", "avatars", "tabs", "messagebars", "dialogs", "menus", "progress", "tooltips", "links", "dividers"],
  uoaui: ["buttons", "inputs", "image", "cards", "tabs", "badges", "avatars", "checkboxes", "radios", "switches", "slider", "alerts", "progress", "tooltips", "dialog", "accordion", "table", "dropdowns"],
  carbon: ["buttons", "text-input", "image", "checkboxes", "radios", "toggles", "dropdowns", "sliders", "tabs", "tags", "notifications", "modals", "tooltips", "accordion", "data-table", "progress-bar", "breadcrumb", "pagination", "tiles", "forms", "menus"],
};

const COLOR_KEYS: Record<DesignSystem, { key: string; label: string }[]> = {
  salt: [
    { key: "accent", label: "Accent" },
    { key: "bg", label: "Background" },
    { key: "fg", label: "Foreground" },
    { key: "positive", label: "Success" },
    { key: "negative", label: "Error" },
    { key: "caution", label: "Warning" },
  ],
  m3: [
    { key: "primary", label: "Primary" },
    { key: "secondary", label: "Secondary" },
    { key: "tertiary", label: "Tertiary" },
    { key: "surface", label: "Surface" },
    { key: "error", label: "Error" },
  ],
  fluent: [
    { key: "brandBg", label: "Brand" },
    { key: "bg1", label: "Background" },
    { key: "fg1", label: "Foreground" },
    { key: "dangerBg3", label: "Danger" },
    { key: "successBg3", label: "Success" },
  ],
  uoaui: [
    { key: "accent", label: "Accent" },
    { key: "bg", label: "Background" },
    { key: "fg", label: "Foreground" },
    { key: "successFg", label: "Success" },
    { key: "dangerFg", label: "Error" },
    { key: "warningFg", label: "Warning" },
  ],
  /* Carbon uses semantic role tokens (interactive, text, support) rather
     than raw color names. The "key" values here match fields on the
     Carbon theme object so the color picker reads/writes the right slot. */
  carbon: [
    { key: "accent", label: "Interactive" },
    { key: "bg", label: "Background" },
    { key: "fg", label: "Text primary" },
    { key: "positive", label: "Support success" },
    { key: "negative", label: "Support error" },
    { key: "warning", label: "Support warning" },
  ],
};

const DEFAULT_COLORS: Record<string, string> = {
  accent: "#1B7F9E", bg: "#FFFFFF", fg: "#000000",
  positive: "#00875D", negative: "#E52135", caution: "#C75300",
  primary: "#6750A4", secondary: "#625B71", tertiary: "#7D5260",
  surface: "#FEF7FF", error: "#B3261E",
  brandBg: "#0F6CBD", bg1: "#FFFFFF", fg1: "#242424",
  dangerBg3: "#C50F1F", successBg3: "#107C10",
};

export function SettingsPanel() {
  const {
    settingsOpen, toggleSettings,
    designSystem, setDesignSystem,
    mode, setMode,
    density, setDensity,
    structurePadding, setStructurePadding,
    placementMode, setPlacementMode,
    themeKey, setThemeKey,
    interfaceType, setInterfaceType,
    selectedComponents, toggleComponent,
    colorOverrides, setColorOverride, resetColors, hasOverrides,
  } = useBuilder();

  const densityOptions = DENSITY_OPTIONS[designSystem];
  const components = AVAILABLE_COMPONENTS[designSystem];
  const colorKeys = COLOR_KEYS[designSystem];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`settings-overlay ${settingsOpen ? "open" : ""}`}
        onClick={toggleSettings}
      />

      {/* Panel */}
      <div className={`settings-panel ${settingsOpen ? "open" : ""}`}>
        <div className="settings-header">
          <span>Configuration</span>
          <button className="settings-close" onClick={toggleSettings} aria-label="Close settings">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        <div className="settings-body">
          {/* Design System */}
          <div className="settings-group">
            <label>Design System</label>
            <select
              className="settings-select"
              value={designSystem}
              onChange={(e) => setDesignSystem(e.target.value as DesignSystem)}
            >
              {DS_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Interface Type */}
          <div className="settings-group">
            <label>Interface Type</label>
            <select
              className="settings-select"
              value={interfaceType}
              onChange={(e) => setInterfaceType(e.target.value as InterfaceType)}
            >
              {INTERFACE_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Mode */}
          <div className="settings-group">
            <label>Mode</label>
            <div className="settings-toggle-row" role="radiogroup" aria-label="Mode">
              <button type="button" role="radio" aria-checked={mode === "light"} className={`settings-toggle-btn ${mode === "light" ? "active" : ""}`} onClick={() => setMode("light")}>Light</button>
              <button type="button" role="radio" aria-checked={mode === "dark"} className={`settings-toggle-btn ${mode === "dark" ? "active" : ""}`} onClick={() => setMode("dark")}>Dark</button>
            </div>
          </div>

          {/* Theme key — per-DS canonical theme variants (Salt jpm/legacy
              × light/dark; Carbon white/g10/g90/g100; M3 + uoaui + Fluent
              light/dark; M3 also exposes medium-contrast pairs). Mode
              toggle still rewrites this automatically when the user
              flips light/dark; picking a value here overrides until the
              next mode toggle. */}
          <div className="settings-group">
            <label>Theme</label>
            <select
              className="settings-select"
              value={themeKey}
              onChange={(e) => setThemeKey(e.target.value)}
            >
              {THEME_KEYS[designSystem].map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Density */}
          <div className="settings-group">
            <label>Density / Size</label>
            <div className="settings-toggle-row" role="radiogroup" aria-label="Density / Size">
              {densityOptions.map((o) => (
                <button key={o.value} type="button" role="radio" aria-checked={density === o.value} className={`settings-toggle-btn ${density === o.value ? "active" : ""}`} onClick={() => setDensity(o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Structure padding (S / M / L) — orthogonal to density.
              Drives canvas, zone, block, and inter-block gap with
              DS-native values. */}
          <div className="settings-group">
            <label>Structure padding</label>
            <div className="settings-toggle-row" role="radiogroup" aria-label="Structure padding">
              {(["small", "medium", "large"] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={structurePadding === size}
                  className={`settings-toggle-btn ${structurePadding === size ? "active" : ""}`}
                  onClick={() => setStructurePadding(size)}
                >
                  {size === "small" ? "S" : size === "medium" ? "M" : "L"}
                </button>
              ))}
            </div>
          </div>

          {/* Placement mode (Auto / Grid / Freeform) — how a dropped block
              resolves its position inside a zone. Auto = today's responsive
              flow (export-safe default). Grid + Freeform are scaffolded for the
              placement roadmap; they land disabled with a "Soon" pill so the
              picker is honest rather than a no-op that reads as fake. */}
          <div className="settings-group">
            <label>Placement</label>
            <div className="settings-toggle-row" role="radiogroup" aria-label="Placement mode">
              {([
                { v: "auto", label: "Auto", ready: true, tip: "Responsive flow: blocks auto-place (export-safe)" },
                { v: "grid", label: "Grid", ready: true, tip: "Work on the body column grid: pick columns + see guides" },
                { v: "freeform", label: "Freeform", ready: false, tip: "Coming soon: opt-in free positioning" },
              ] as const).map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  role="radio"
                  aria-checked={placementMode === opt.v}
                  aria-disabled={opt.ready ? undefined : true}
                  disabled={!opt.ready}
                  className={`settings-toggle-btn ${placementMode === opt.v ? "active" : ""}${opt.ready ? "" : " soon"}`}
                  onClick={() => opt.ready && setPlacementMode(opt.v)}
                  title={opt.tip}
                >
                  {opt.label}
                  {!opt.ready && <span className="settings-toggle-soon" aria-hidden="true">Soon</span>}
                </button>
              ))}
            </div>
            <p className="settings-group-hint">How dropped blocks resolve position. Auto keeps your export responsive.</p>
          </div>

          {/* Components */}
          <div className="settings-group">
            <label>Components</label>
            <div className="comp-chips">
              {components.map((c) => (
                <button key={c} className={`comp-chip ${selectedComponents.includes(c) ? "selected" : ""}`} onClick={() => toggleComponent(c)}>
                  {c.replace(/-/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Color Overrides */}
          <div className="settings-group">
            <label>
              Color Overrides
              {hasOverrides && (
                <button onClick={resetColors} style={{
                  float: "right", fontSize: 10, color: "var(--b-accent2)", background: "none",
                  border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  Reset
                </button>
              )}
            </label>
            {colorKeys.map((c, idx) => (
              <div key={c.key} className="color-row">
                <span className="color-label">{c.label}</span>
                {/* Issue #11: per-DS preset swatch grid only on the
                    primary accent row (index 0 — matches ACCENT_KEY_BY_DS
                    target). Native color picker still serves as fallback
                    for any custom hex. */}
                {idx === 0 && c.key === ACCENT_KEY_BY_DS[designSystem] && (
                  <div className="accent-preset-row" role="radiogroup" aria-label="Accent preset">
                    {ACCENT_PRESETS[designSystem].map((p) => {
                      const isActive = (colorOverrides[c.key] ?? "").toLowerCase() === p.hex.toLowerCase();
                      return (
                        <button
                          key={p.hex}
                          type="button"
                          role="radio"
                          aria-checked={isActive}
                          aria-label={p.label}
                          title={p.label}
                          className={`accent-preset-swatch${isActive ? " is-active" : ""}`}
                          style={{ background: p.hex }}
                          onClick={() => setColorOverride(c.key, p.hex)}
                        />
                      );
                    })}
                  </div>
                )}
                <input
                  type="color"
                  className="color-swatch"
                  value={colorOverrides[c.key] || DEFAULT_COLORS[c.key] || "#7c3aed"}
                  onChange={(e) => setColorOverride(c.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
