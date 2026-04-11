"use client";

import React from "react";
import { useBuilder } from "@/store/useBuilder";
import { ChatPanel } from "./ChatPanel";
import { SettingsPanel } from "./SettingsPanel";
import { PreviewPanel } from "./PreviewPanel";
import { ExportActions } from "./ExportActions";
import "./builder.css";

export function BuilderApp() {
  const { mode, settingsOpen, toggleSettings, toggleMobilePreview } = useBuilder();

  return (
    <div className={`builder-shell ${mode === "light" ? "builder-light" : ""}`}>
      {/* Ambient glow effects */}
      <div className="ambient-glow" style={{ top: -100, left: -100 }} />
      <div className="ambient-glow" style={{ bottom: -100, right: "30%" }} />

      {/* LEFT — Chat + Controls */}
      <div className="builder-left">
        {/* Header */}
        <div className="builder-header">
          <div className="builder-logo">
            <div className="builder-logo-icon">AI</div>
            <span className="builder-logo-text">Design Hub Builder</span>
          </div>
          <div className="builder-header-actions">
            {/* Mobile preview toggle */}
            <button
              className="b-btn b-btn-ghost b-btn-icon"
              onClick={toggleMobilePreview}
              title="Toggle preview"
              aria-label="Toggle preview panel"
              style={{ display: "none" }}
              id="mobile-preview-btn"
            >
              👁
            </button>
            <button
              className="b-btn b-btn-secondary b-btn-sm"
              onClick={toggleSettings}
            >
              {settingsOpen ? "✕ Close" : "⚙ Customize"}
            </button>
          </div>
        </div>

        {/* Chat */}
        <ChatPanel />

        {/* Settings overlay */}
        <SettingsPanel />
      </div>

      {/* RIGHT — Preview */}
      <PreviewPanel />

      {/* Mobile: show preview toggle + preview */}
      <style>{`
        @media (max-width: 768px) {
          #mobile-preview-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
