"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { SharedCanvas } from "@/lib/shareState";
import type { DesignSystem } from "@/store/useBuilder";
import { ComponentRenderer } from "./ComponentRenderer";
import "./builder.css";

const DS_LABEL: Record<DesignSystem, string> = {
  salt: "Salt DS",
  m3: "Material 3",
  fluent: "Fluent 2",
  ausos: "ausos DS",
};

const DS_COLOR: Record<DesignSystem, string> = {
  salt: "#1B7F9E",
  m3: "#6750A4",
  fluent: "#0F6CBD",
  ausos: "#7E6BC4",
};

/* ══════════════════════════════════════════════════════════
   SharedPreview - read-only renderer for /preview/share/[hash]
   Shows a banner with share metadata, the live DS switcher (so
   viewers can preview the same layout across all four systems),
   and the four zones rendered via ComponentRenderer.
   ══════════════════════════════════════════════════════════ */
export function SharedPreview({ state, hash }: { state: SharedCanvas; hash: string }) {
  const [activeDs, setActiveDs] = useState<DesignSystem>(state.designSystem);
  const [mode, setMode] = useState(state.mode);
  const [copied, setCopied] = useState(false);

  const density = state.density;
  const wrapperClass = mode === "light" ? "shared-preview builder-light" : "shared-preview";

  const handleCopy = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  };

  const handleFork = () => {
    if (typeof window === "undefined") return;
    // Stash the state for the Builder to pick up (Phase C edible fork).
    // For now, navigate to /builder with the hash as a query param so the
    // Builder can opt-in-load it via an effect.
    window.location.href = `/builder?shared=${encodeURIComponent(hash)}`;
  };

  return (
    <div className={wrapperClass}>
      {/* Chrome bar */}
      <header className="shared-preview-header">
        <div className="shared-preview-brand">
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 18, marginRight: 6 }}>
            share
          </span>
          <strong>Shared preview</strong>
          <span className="shared-preview-sep">·</span>
          <span style={{ color: "var(--b-fg2)" }}>Design Hub</span>
        </div>

        {/* DS switcher - viewers can compare across all four systems */}
        <div className="shared-preview-ds-row" role="group" aria-label="Choose a design system to preview">
          {(Object.keys(DS_LABEL) as DesignSystem[]).map((ds) => (
            <button
              key={ds}
              className={`hero-ds-chip ${activeDs === ds ? "active" : ""}`}
              onClick={() => setActiveDs(ds)}
              aria-pressed={activeDs === ds}
            >
              <span className="hero-ds-dot" style={{ background: DS_COLOR[ds] }} aria-hidden="true" />
              {DS_LABEL[ds]}
            </button>
          ))}
        </div>

        <div className="shared-preview-actions">
          <button
            className="shared-preview-btn shared-preview-btn-ghost"
            onClick={() => setMode(mode === "light" ? "dark" : "light")}
            title="Toggle light / dark"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>
              {mode === "light" ? "dark_mode" : "light_mode"}
            </span>
          </button>
          <button
            className="shared-preview-btn shared-preview-btn-ghost"
            onClick={handleCopy}
            title="Copy share link"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16, marginRight: 4 }}>
              {copied ? "check" : "link"}
            </span>
            {copied ? "Copied" : "Copy link"}
          </button>
          <button
            className="shared-preview-btn shared-preview-btn-primary"
            onClick={handleFork}
            title="Open this canvas in the Builder"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16, marginRight: 4 }}>
              edit
            </span>
            Fork & edit
          </button>
          <Link href="/" className="shared-preview-btn shared-preview-btn-ghost">
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16, marginRight: 4 }}>
              home
            </span>
            Home
          </Link>
        </div>
      </header>

      {/* Canvas - reuses the same bp-dashboard CSS classes so the themed
          styling flows identically to the Builder preview. */}
      <div className="shared-preview-body">
        <div className={`bp-dashboard preview-${activeDs} density-${density}`}>
          <header className="bp-header shared-mini-zone">
            {state.headerBlocks.map((b) => (
              <div key={b.id}>
                <ComponentRenderer type={b.type} system={activeDs} blockId={b.id} {...b.props} />
              </div>
            ))}
          </header>
          <div className="bp-body">
            <nav className="bp-sidebar shared-mini-zone">
              {state.sidebarBlocks.map((b) => (
                <div key={b.id}>
                  <ComponentRenderer type={b.type} system={activeDs} blockId={b.id} {...b.props} />
                </div>
              ))}
            </nav>
            <main className="bp-main shared-preview-main">
              {state.blocks.length === 0 ? (
                <div className="shared-preview-empty">
                  This shared canvas is empty. Fork it to start building.
                </div>
              ) : (
                <div className="shared-preview-grid">
                  {state.blocks.map((b) => {
                    const colSpan = Math.max(
                      1,
                      Math.min(3, (b.props.colSpan as number | undefined) ?? 3),
                    );
                    return (
                      <div key={b.id} style={{ gridColumn: `span ${colSpan}` }}>
                        <ComponentRenderer type={b.type} system={activeDs} blockId={b.id} {...b.props} />
                      </div>
                    );
                  })}
                </div>
              )}
            </main>
          </div>
          <footer className="bp-footer shared-mini-zone">
            {state.footerBlocks.map((b) => (
              <div key={b.id}>
                <ComponentRenderer type={b.type} system={activeDs} blockId={b.id} {...b.props} />
              </div>
            ))}
          </footer>
        </div>
      </div>
    </div>
  );
}
