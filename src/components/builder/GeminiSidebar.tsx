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
  /** @deprecated kept for back-compat; no longer used inside sidebar */
  onProjectsOpen?: () => void;
}

export function GeminiSidebar({
  isOpen,
  onToggle,
  projects,
  loading,
  onProjectLoad,
}: Props) {
  const { clearChat } = useBuilder();

  return (
    <aside className={`gemini-sidebar ${isOpen ? "gsb-open" : "gsb-closed"}`}>
      {/* gsb-inner is always 260 px - the outer aside clips it to icon-rail width */}
      <div className="gsb-inner">

        {/* ── Close button ── */}
        <div className="gsb-header">
          <button
            className="gsb-icon-btn gsb-close-btn"
            onClick={onToggle}
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              chevron_left
            </span>
          </button>
        </div>

        {/* ── New Chat ── */}
        <button className="gsb-new-chat-btn" onClick={clearChat} title="New chat">
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
            edit_square
          </span>
          <span className="gsb-btn-label">New chat</span>
        </button>

        {/* ── Projects section - header + inline list ── */}
        <div className="gsb-section-label gsb-hide-when-closed">Projects</div>

        <div className="gsb-history-list gsb-hide-when-closed">
          {loading ? (
            <span className="gsb-empty">Loading…</span>
          ) : projects.length === 0 ? (
            <span className="gsb-empty">No saved projects yet</span>
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
                  folder_open
                </span>
                <div className="gsb-hist-meta">
                  <span className="gsb-hist-name">{p.name}</span>
                  <span className="gsb-hist-date">
                    {p.updatedAt.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

      </div>
    </aside>
  );
}
