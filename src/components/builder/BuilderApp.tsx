"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useBuilder } from "@/store/useBuilder";
import type { DesignSystem, BuilderMode, InterfaceType } from "@/store/useBuilder";
/* useCloudStorage is still indirectly used via SessionsDrawer + useAutoSave;
 * no direct import here since BuilderApp no longer owns the save/load UI. */
import { ChatPanel } from "./ChatPanel";
import { SettingsPanel } from "./SettingsPanel";
import { PreviewSidePanel, StandalonePreview } from "./PreviewPanel";
import { ExportPanel } from "./ExportPanel";
import { TemplatesDrawer } from "./TemplatesDrawer";
import { SessionsDrawer } from "./SessionsDrawer";
import { SaveIndicator } from "./SaveIndicator";
import { SlashInserter } from "./SlashInserter";
import { useBuilderShortcuts } from "@/lib/useBuilderShortcuts";
import { useAutoSave } from "@/lib/useAutoSave";
import "./builder.css";

const WaveScene = dynamic(
  () => import("./WaveHero").then((m) => m.WaveScene),
  { ssr: false }
);

export function BuilderApp() {
  const {
    mode, previewOpen, togglePreview, setMode,
    setDesignSystem, setInterfaceType, setSelectedComponents,
    chatOpen: isChatOpen,
    toggleSessionsDrawer, startNewSession,
  } = useBuilder();

  /* Auto-save subscription - kicks in the moment a session is started
     (either by picking a template or sending a first message). */
  useAutoSave();

  const [isStandalone, setIsStandalone] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  /* Register Cmd+Z / Cmd+Shift+Z for canvas undo/redo.
     Initialized once, scoped to the builder tree. */
  useBuilderShortcuts();

  // ── Export modal ──
  const [exportOpen, setExportOpen] = useState(false);

  /* ── Resizable drag bar ── */
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitPos, setSplitPos] = useState(55);
  const isDragging = useRef(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      const pos = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPos(Math.max(30, Math.min(75, pos)));
    };
    const onUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        setDragActive(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    // Touch equivalents - allow the resize handle to be dragged on tablets
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      e.preventDefault(); // prevents page scroll while resizing
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const pos = ((touch.clientX - rect.left) / rect.width) * 100;
      setSplitPos(Math.max(30, Math.min(75, pos)));
    };
    const onTouchEnd = () => {
      if (isDragging.current) {
        isDragging.current = false;
        setDragActive(false);
        document.body.style.userSelect = "";
      }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  /* ── Header scroll detection ── */
  useEffect(() => {
    const scrollEl = document.querySelector(".chat-scroll");
    if (!scrollEl) return;
    const onScroll = () => setHeaderScrolled(scrollEl.scrollTop > 40);
    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", onScroll);
  }, []);

  const startDrag = () => {
    isDragging.current = true;
    setDragActive(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  // Touch equivalent for the resize handle (tablets)
  const startDragTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    isDragging.current = true;
    setDragActive(true);
    document.body.style.userSelect = "none";
  };

  /* ── Pop-out mode ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("preview") === "1") {
      const ds = params.get("ds") as DesignSystem | null;
      const m = params.get("mode") as BuilderMode | null;
      const t = params.get("type") as InterfaceType | null;
      const c = params.get("components");
      if (ds) setDesignSystem(ds);
      if (m) setMode(m);
      if (t) setInterfaceType(t);
      if (c) setSelectedComponents(c.split(","));
      setIsStandalone(true);
    }
  }, [setDesignSystem, setMode, setInterfaceType, setSelectedComponents]);

  /* ── Fork from shared preview - pick up ?shared=<hash> and apply ──
     Triggered when a viewer clicks "Fork & edit" on /preview/share/[hash].
     Sets the full zone state, opens the preview, and clears the URL so
     reloads don't re-apply. Runs once on mount. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const hash = params.get("shared");
    if (!hash) return;
    (async () => {
      try {
        const { decodeShareState } = await import("@/lib/shareState");
        const state = decodeShareState(hash);
        if (!state) return;
        const store = useBuilder.getState();
        store.setDesignSystem(state.designSystem);
        store.setMode(state.mode);
        store.setDensity(state.density);
        store.setHeaderBlocks(state.headerBlocks);
        store.setSidebarBlocks(state.sidebarBlocks);
        store.setBlocks(state.blocks);
        store.setFooterBlocks(state.footerBlocks);
        if (state.activeTemplateId) store.setActiveTemplateId(state.activeTemplateId);
        store.setPreviewOpen(true);
        // Clean the URL so reload doesn't trigger another apply
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, "", newUrl);
      } catch {
        /* Decoding or import failed - silently ignore; user lands on an empty builder */
      }
    })();
  }, []);

  /* handleSaveProject + handleLoadProject removed - SessionsDrawer
     owns session load/save/delete now, and auto-save handles persistence. */

  if (isStandalone) return <StandalonePreview />;

  return (
    <div className={`builder-shell ${mode === "light" ? "builder-light" : ""}`}>

      {/* Liquid gradient background */}
      <div className="liquid-bg" aria-hidden="true">
        <WaveScene />
      </div>

      {/* GeminiSidebar removed - replaced by SessionsDrawer (left slide-in).
          isSidebarOpen is kept in state only to preserve any related CSS
          hooks; it's no longer used to toggle a visible sidebar. */}

      {/* ── Main content area ── */}
      <div className="main-content">

        {/* ── Top bar ── */}
        <div className={`top-bar ${headerScrolled ? "scrolled" : ""}`}>

          {/* Left: sessions toggle + logo + new-session + save indicator */}
          <div className="top-bar-left">
            <button
              className="top-bar-btn icon-only sidebar-toggle-btn"
              onClick={toggleSessionsDrawer}
              title="Open sessions"
              aria-label="Open sessions drawer"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>menu</span>
            </button>
            <button
              className="top-bar-logo top-bar-logo-btn"
              onClick={startNewSession}
              title="Start a new session"
              aria-label="Start a new session"
            >
              <img
                src="/aologo.svg"
                alt="ausōs"
                className="ausos-logo-img"
              />
            </button>
            <button
              className="top-bar-btn icon-only top-bar-new-session"
              onClick={startNewSession}
              title="New session"
              aria-label="Start a new session"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit_square</span>
            </button>
            <SaveIndicator />
          </div>

          {/* Right: all existing controls unchanged */}
          <div className="top-bar-right">

            {/* Dark / Light toggle */}
            <button
              className="top-bar-btn icon-only"
              onClick={() => setMode(mode === "dark" ? "light" : "dark")}
              title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {mode === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>

            {/* UI Kit */}
            <Link href="/ui-kit" className="top-bar-btn" title="UI Kit Overview">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>palette</span>
              UI Kit
            </Link>

            {/* Export */}
            <button className="top-bar-btn" onClick={() => setExportOpen(true)} title="Export code">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>code</span>
              Export
            </button>

            {/* Preview toggle */}
            <button
              className={`top-bar-btn preview-toggle-btn ${previewOpen ? "active" : ""}`}
              onClick={togglePreview}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>visibility</span>
              Preview
            </button>
          </div>
        </div>

        {/* ── Content: chat + resizable preview ── */}
        <div
          className={`content-split ${previewOpen ? "has-preview" : ""} ${!isChatOpen ? "chat-collapsed" : ""}`}
          ref={containerRef}
          style={
            previewOpen && isChatOpen
              ? ({ "--chat-width": `${splitPos}%` } as React.CSSProperties)
              : undefined
          }
        >
          <div className={`chat-slide ${isChatOpen ? "chat-slide-open" : "chat-slide-closed"}`}>
            <ChatPanel />
          </div>

          {previewOpen && isChatOpen && (
            <div
              className={`resize-handle ${dragActive ? "dragging" : ""}`}
              onMouseDown={startDrag}
              onTouchStart={startDragTouch}
              aria-hidden="true"
            />
          )}

          <PreviewSidePanel />
        </div>

        {/* ── Copyright - in-flow below chat, never overlaps content ── */}
        <div className="builder-copyright-fixed" aria-hidden="true">
          &copy; {new Date().getFullYear()} ausōs. All rights reserved.
        </div>
      </div>

      <SettingsPanel />

      {/* ── Templates drawer - opened via the hero's "Browse templates"
           link, or programmatically from anywhere in the builder. ── */}
      <TemplatesDrawer />

      {/* ── Sessions drawer - left slide-in, opened via the top-left
           menu hamburger. Replaces the old "My Projects" modal. ── */}
      <SessionsDrawer />

      {/* ── Slash-command inserter - "/" anywhere outside inputs
           opens a Notion-style component picker overlay. ── */}
      <SlashInserter />

      {/* ── Export modal ── */}
      {exportOpen && <ExportPanel onClose={() => setExportOpen(false)} />}

    </div>
  );
}
