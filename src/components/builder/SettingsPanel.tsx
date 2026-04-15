"use client";

import React from "react";
import { useBuilder, type DesignSystem, type InterfaceType } from "@/store/useBuilder";

const DS_OPTIONS: { id: DesignSystem; label: string }[] = [
  { id: "salt", label: "Salt DS (J.P. Morgan)" },
  { id: "m3", label: "Material 3 (Google)" },
  { id: "fluent", label: "Fluent 2 (Microsoft)" },
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
  ausos: [
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
    { value: "touch", label: "Touch" },
  ],
};

const AVAILABLE_COMPONENTS: Record<DesignSystem, string[]> = {
  salt: ["buttons", "inputs", "cards", "tabs", "banners", "dialog", "badges", "avatars", "tooltips", "progress", "accordion", "form-field", "menu", "drawer", "table", "date-picker", "checkboxes", "radios", "switches", "slider"],
  m3: ["buttons", "text-fields", "chips", "cards", "switches", "checkboxes", "radios", "sliders", "fabs", "icon-buttons", "nav-bar", "tabs", "dialogs", "snackbar", "progress", "tooltips", "badges", "menus", "date-pickers"],
  fluent: ["buttons", "inputs", "checkboxes", "radios", "switches", "slider", "cards", "badges", "avatars", "tabs", "messagebars", "dialogs", "menus", "progress", "tooltips", "links", "dividers"],
  ausos: ["buttons", "inputs", "cards", "tabs", "badges", "avatars", "checkboxes", "radios", "switches", "slider", "alerts", "progress", "tooltips", "dialog", "accordion", "table", "dropdowns"],
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
  ausos: [
    { key: "accent", label: "Accent" },
    { key: "bg", label: "Background" },
    { key: "fg", label: "Foreground" },
    { key: "successFg", label: "Success" },
    { key: "dangerFg", label: "Error" },
    { key: "warningFg", label: "Warning" },
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
            <div className="settings-toggle-row">
              <button className={`settings-toggle-btn ${mode === "light" ? "active" : ""}`} onClick={() => setMode("light")}>Light</button>
              <button className={`settings-toggle-btn ${mode === "dark" ? "active" : ""}`} onClick={() => setMode("dark")}>Dark</button>
            </div>
          </div>

          {/* Density */}
          <div className="settings-group">
            <label>Density / Size</label>
            <div className="settings-toggle-row">
              {densityOptions.map((o) => (
                <button key={o.value} className={`settings-toggle-btn ${density === o.value ? "active" : ""}`} onClick={() => setDensity(o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
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
            {colorKeys.map((c) => (
              <div key={c.key} className="color-row">
                <span className="color-label">{c.label}</span>
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
