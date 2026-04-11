"use client";

import React from "react";
import Link from "next/link";
import { useBuilder } from "@/store/useBuilder";

export function Sidebar() {
  const {
    sidebarCollapsed,
    toggleSidebar,
    clearChat,
    messages,
    mode,
    setMode,
  } = useBuilder();

  const hasChat = messages.length > 0;

  return (
    <>
      {!sidebarCollapsed && (
        <div className="sidebar-backdrop" onClick={toggleSidebar} style={{ display: "none" }} />
      )}

      <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">DH</div>
            <span className="sidebar-logo-text">Design Hub</span>
          </div>
          <button className="sidebar-collapse-btn" onClick={toggleSidebar} aria-label="Collapse sidebar">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
          </button>
        </div>

        <div className="sidebar-body">
          <div className="sidebar-section-title">Chat</div>
          <ul className="sidebar-nav">
            <li className={!hasChat ? "active" : ""} onClick={clearChat}>
              <span className="nav-icon material-symbols-outlined">add_circle</span>
              New Chat
            </li>
          </ul>

          <div className="sidebar-section-title">History</div>
          <ul className="sidebar-nav">
            {hasChat ? (
              <li className="active">
                <span className="nav-icon material-symbols-outlined">chat_bubble</span>
                Current Session
              </li>
            ) : (
              <li style={{ color: "var(--b-fg3)", cursor: "default", fontSize: 12 }}>
                <span className="nav-icon material-symbols-outlined" style={{ fontSize: 16 }}>history</span>
                No history yet
              </li>
            )}
          </ul>

          <div className="sidebar-section-title">Saved</div>
          <ul className="sidebar-nav">
            <li style={{ color: "var(--b-fg3)", cursor: "default", fontSize: 12 }}>
              <span className="nav-icon material-symbols-outlined" style={{ fontSize: 16 }}>bookmark_border</span>
              No saved chats
            </li>
          </ul>
        </div>

        {/* Theme toggle */}
        <div className="theme-toggle">
          <button className={`theme-toggle-btn ${mode === "dark" ? "active" : ""}`} onClick={() => setMode("dark")}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>dark_mode</span>
            Dark
          </button>
          <button className={`theme-toggle-btn ${mode === "light" ? "active" : ""}`} onClick={() => setMode("light")}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>light_mode</span>
            Light
          </button>
        </div>

        {/* UI Kit link */}
        <Link href="/" className="sidebar-uikit-link">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>view_quilt</span>
          UI Kit Overview
        </Link>
      </aside>

      <style>{`@media (max-width: 768px) { .sidebar-backdrop { display: block !important; } }`}</style>
    </>
  );
}
