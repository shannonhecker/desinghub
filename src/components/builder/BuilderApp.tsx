"use client";

import React from "react";
import { useBuilder } from "@/store/useBuilder";
import { Sidebar } from "./Sidebar";
import { ChatPanel } from "./ChatPanel";
import { SettingsPanel } from "./SettingsPanel";
import "./builder.css";

export function BuilderApp() {
  const { mode, sidebarCollapsed, toggleSidebar } = useBuilder();

  return (
    <div className={`builder-shell ${mode === "light" ? "builder-light" : ""}`}>
      <Sidebar />

      <div className="main-content">
        {/* Top bar — minimal */}
        <div className="top-bar">
          {sidebarCollapsed && (
            <button className="hamburger-btn" onClick={toggleSidebar}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>menu</span>
            </button>
          )}
        </div>

        <ChatPanel />
      </div>

      <SettingsPanel />
    </div>
  );
}
