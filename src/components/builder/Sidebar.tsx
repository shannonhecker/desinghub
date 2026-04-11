"use client";

import React from "react";
import Link from "next/link";
import { useBuilder } from "@/store/useBuilder";

const DS_LABELS: Record<string, string> = {
  salt: "Salt DS",
  m3: "Material 3",
  fluent: "Fluent 2",
};

export function Sidebar() {
  const {
    sidebarCollapsed,
    toggleSidebar,
    designSystem,
    setDesignSystem,
    clearChat,
    messages,
  } = useBuilder();

  const isHome = messages.length === 0;

  return (
    <>
      {/* Mobile backdrop */}
      {!sidebarCollapsed && (
        <div
          className="sidebar-backdrop"
          onClick={toggleSidebar}
          style={{ display: "none" }}
        />
      )}

      <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">DH</div>
            <span className="sidebar-logo-text">Design Hub</span>
          </div>
          <button
            className="sidebar-collapse-btn"
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              chevron_left
            </span>
          </button>
        </div>

        {/* New Chat */}
        <button className="sidebar-new-chat" onClick={clearChat}>
          <span className="icon material-symbols-outlined" style={{ fontSize: 18 }}>
            add
          </span>
          New Chat
        </button>

        <div className="sidebar-body">
          {/* Features */}
          <div className="sidebar-section-title">Features</div>
          <ul className="sidebar-nav">
            <li className={isHome ? "active" : ""} onClick={() => { if (messages.length > 0) clearChat(); }}>
              <span className="nav-icon material-symbols-outlined">chat</span>
              Chat
            </li>
            <li>
              <span className="nav-icon material-symbols-outlined">bookmark</span>
              Saved
            </li>
            <li>
              <span className="nav-icon material-symbols-outlined">auto_stories</span>
              Library
            </li>
            <li>
              <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, color: "inherit", textDecoration: "none" }}>
                <span className="nav-icon material-symbols-outlined">view_quilt</span>
                UI Kit Overview
              </Link>
            </li>
          </ul>

          {/* Design Systems */}
          <div className="sidebar-section-title">Design Systems</div>
          <ul className="sidebar-nav">
            {(["salt", "m3", "fluent"] as const).map((ds) => (
              <li
                key={ds}
                className={designSystem === ds ? "active" : ""}
                onClick={() => setDesignSystem(ds)}
              >
                <span className="nav-icon material-symbols-outlined">
                  {ds === "salt" ? "palette" : ds === "m3" ? "widgets" : "dashboard"}
                </span>
                {DS_LABELS[ds]}
              </li>
            ))}
          </ul>

          {/* Workspaces */}
          <div className="sidebar-section-title">Workspaces</div>
          <ul className="sidebar-nav">
            <li>
              <span className="nav-icon material-symbols-outlined">folder</span>
              Dashboard
            </li>
            <li>
              <span className="nav-icon material-symbols-outlined">folder</span>
              Landing Page
            </li>
            <li>
              <span className="nav-icon material-symbols-outlined">folder</span>
              Form Builder
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-icon">
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "white" }}>
              auto_awesome
            </span>
          </div>
          <div className="sidebar-footer-title">Upgrade to Pro</div>
          <div className="sidebar-footer-text">
            Unlock advanced theming, export to Figma, and team collaboration.
          </div>
          <button className="sidebar-footer-btn">Upgrade</button>
        </div>
      </aside>

      {/* Mobile styles for backdrop */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar-backdrop { display: block !important; }
        }
      `}</style>
    </>
  );
}
