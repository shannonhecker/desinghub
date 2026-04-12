"use client";

import React from "react";
import { useBuilder } from "@/store/useBuilder";
import type { SavedProject } from "@/lib/firebase";

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  projects: SavedProject[];
  loading: boolean;
  onProjectLoad: (p: SavedProject) => void;
  onProjectsOpen: () => void;
}

export function GeminiSidebar({
  isOpen,
  onToggle,
  projects,
  loading,
  onProjectLoad,
  onProjectsOpen,
}: Props) {
  const { clearChat } = useBuilder();

  return (
    <aside className={`gemini-sidebar ${isOpen ? "gsb-open" : "gsb-closed"}`}>
      {/* gsb-inner is always 260 px — the outer aside clips it to icon-rail width */}
      <div className="gsb-inner">

        {/* ── Header row: hamburger (always visible) + logo (hidden when closed) ── */}
        <div className="gsb-header">
          {/* Hamburger is the FIRST element so it stays inside the 52 px rail */}
          <button
            className="gsb-icon-btn gsb-hamburger"
            onClick={onToggle}
            title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              {isOpen ? "menu_open" : "menu"}
            </span>
          </button>

          {/* Logo mark + wordmark — slide out with the sidebar */}
          <div className="gsb-brand gsb-hide-when-closed">
            <div className="ausos-logo-mark">
              <div className="ausos-dot ausos-dot-sm" />
              <div className="ausos-dot-group">
                <div className="ausos-dash" />
                <div className="ausos-dot ausos-dot-lg" />
              </div>
            </div>
            <span className="gsb-wordmark">ausōs</span>
          </div>
        </div>

        {/* ── New Chat — icon-only when collapsed ── */}
        <button className="gsb-new-chat-btn" onClick={clearChat} title="New chat">
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
            edit_square
          </span>
          <span className="gsb-btn-label">New chat</span>
        </button>

        {/* ── Projects — icon-only when collapsed ── */}
        <button className="gsb-nav-btn" onClick={onProjectsOpen} title="My Projects">
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
            folder_open
          </span>
          <span className="gsb-btn-label">Projects</span>
        </button>

        {/* ── Session history — fully hidden in icon rail ── */}
        <div className="gsb-section-label gsb-hide-when-closed">Recent</div>

        <div className="gsb-history-list gsb-hide-when-closed">
          {loading ? (
            <span className="gsb-empty">Loading…</span>
          ) : projects.length === 0 ? (
            <span className="gsb-empty">No previous projects</span>
          ) : (
            projects.map((p) => (
              <button
                key={p.id}
                className="gsb-history-item"
                onClick={() => onProjectLoad(p)}
                title={p.name}
              >
                <span
                  className="material-symbols-outlined gsb-hist-icon"
                  style={{ fontSize: 15 }}
                >
                  forum
                </span>
                <span className="gsb-hist-name">{p.name}</span>
              </button>
            ))
          )}
        </div>

      </div>
    </aside>
  );
}
