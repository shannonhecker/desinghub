"use client";

import React from "react";
import { useBuilder, type DesignSystem } from "@/store/useBuilder";
import { Sidebar } from "./Sidebar";
import { ChatPanel } from "./ChatPanel";
import { SettingsPanel } from "./SettingsPanel";
import { PreviewPanel } from "./PreviewPanel";
import "./builder.css";

const DS_LABELS: Record<DesignSystem, string> = {
  salt: "Salt DS",
  m3: "Material 3",
  fluent: "Fluent 2",
};

export function BuilderApp() {
  const {
    mode,
    designSystem,
    setDesignSystem,
    sidebarCollapsed,
    toggleSidebar,
    toggleSettings,
    togglePreview,
  } = useBuilder();

  return (
    <div className={`builder-shell ${mode === "light" ? "builder-light" : ""}`}>
      {/* Ambient glow */}
      <div className="ambient-glow" style={{ top: -150, right: "20%" }} />
      <div className="ambient-glow" style={{ bottom: -150, left: "10%" }} />

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="main-content">
        {/* Top bar */}
        <div className="top-bar">
          <div className="top-bar-left">
            {/* Hamburger for mobile / collapsed sidebar */}
            {sidebarCollapsed && (
              <button className="hamburger-btn" onClick={toggleSidebar} style={{ display: "flex" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>menu</span>
              </button>
            )}

            {/* Design system selector */}
            <select
              className="model-selector"
              value={designSystem}
              onChange={(e) => setDesignSystem(e.target.value as DesignSystem)}
            >
              {(["salt", "m3", "fluent"] as const).map((ds) => (
                <option key={ds} value={ds}>{DS_LABELS[ds]}</option>
              ))}
            </select>
          </div>

          <div className="top-bar-right">
            <button className="top-bar-btn" onClick={toggleSettings}>
              <span className="icon material-symbols-outlined">settings</span>
              Configuration
            </button>
            <button className="top-bar-btn" onClick={togglePreview}>
              <span className="icon material-symbols-outlined">download</span>
              Export
            </button>
          </div>
        </div>

        {/* Chat / Hero */}
        <ChatPanel />
      </div>

      {/* Settings drawer */}
      <SettingsPanel />

      {/* Preview overlay */}
      <PreviewPanel />
    </div>
  );
}
