"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
import { BlockContextMenu } from "./BlockContextMenu";
import { useBuilderShortcuts } from "@/lib/useBuilderShortcuts";
import { useAutoSave } from "@/lib/useAutoSave";
import { useBackendStatus } from "@/lib/useBackendStatus";
import { resolveStructurePadding } from "@/lib/structurePadding";
import { ACCENT_VAR_BY_DS, ACCENT_KEY_BY_DS } from "@/data/_shared/accentPresets";
import "./builder.css";

export function BuilderApp() {
  const {
    mode, previewOpen, setMode,
    designSystem, density, themeKey,
    setDesignSystem, setInterfaceType, setSelectedComponents,
    chatOpen: isChatOpen,
    toggleSessionsDrawer, startNewSession,
  } = useBuilder();

  /* Auto-save subscription - kicks in the moment a session is started
     (either by picking a template or sending a first message). */
  useAutoSave();

  /* One-shot /api/health probe to learn which backend-gated features
     (Anthropic, Firebase) are configured. Populates the store so
     ChatPanel / SaveIndicator can show calm "off" affordances instead
     of letting the first API call fail loudly. */
  useBackendStatus();

  /* Structure padding: emit CSS vars whenever DS or size changes so
     builder.css's --dh-pad-* references resolve to the right value.
     `:root`-scoped so every nested zone / canvas / block reads the
     same scale. */
  const structurePadding = useBuilder((s) => s.structurePadding);
  useEffect(() => {
    const v = resolveStructurePadding(designSystem, structurePadding);
    const root = document.documentElement;
    root.style.setProperty('--dh-pad-canvas', `${v.canvas}px`);
    root.style.setProperty('--dh-pad-zone', `${v.zone}px`);
    root.style.setProperty('--dh-pad-block', `${v.block}px`);
    root.style.setProperty('--dh-pad-gap', `${v.gap}px`);
  }, [designSystem, structurePadding]);

  /* Accent override: when a user sets `colorOverrides.accent` in
     SettingsPanel, paint the per-DS accent CSS var so the canvas
     reflects the choice. Sa+ausos share lineage; salt also gets
     the override so glass tints follow. */
  const colorOverrides = useBuilder((s) => s.colorOverrides);
  const accentOverride = colorOverrides[ACCENT_KEY_BY_DS[designSystem]];
  useEffect(() => {
    const root = document.documentElement;
    /* C-2 fix: clear every DS's accent var first so a DS switch
       doesn't strand the previous DS's value on :root (Salt → Carbon
       used to leave --salt-palette-accent set forever). */
    Object.values(ACCENT_VAR_BY_DS).forEach((v) => root.style.removeProperty(v));
    root.style.removeProperty("--salt-palette-accent");
    if (accentOverride) {
      root.style.setProperty(ACCENT_VAR_BY_DS[designSystem], accentOverride);
      /* ausos's glass tint inherits Salt's accent via --salt-palette-accent. */
      if (designSystem === "ausos") {
        root.style.setProperty("--salt-palette-accent", accentOverride);
      }
    }
  }, [designSystem, accentOverride]);

  const [isStandalone, setIsStandalone] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  /* Register Cmd+Z / Cmd+Shift+Z for canvas undo/redo.
     Initialized once, scoped to the builder tree. */
  useBuilderShortcuts();

  // ── Export modal ──
  const [exportOpen, setExportOpen] = useState(false);

  /* Export dropdown state + share/download (P3.3) - merged from the
     preview-bar overflow menu so users have ONE place to hand off a
     canvas (share link / JSON / code / Vite). */
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportShareState, setExportShareState] = useState<"idle" | "copied" | "too-long" | "error">("idle");
  const [exportDownloading, setExportDownloading] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExportMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [exportMenuOpen]);

  const handleExportShare = async () => {
    const { buildShareUrl } = await import("@/lib/shareState");
    const s = useBuilder.getState();
    const { url, tooLong } = buildShareUrl({
      v: 1,
      designSystem: s.designSystem,
      mode: s.mode,
      density: s.density,
      activeTemplateId: s.activeTemplateId,
      headerBlocks: s.headerBlocks,
      sidebarBlocks: s.sidebarBlocks,
      blocks: s.blocks,
      footerBlocks: s.footerBlocks,
    });
    if (tooLong) {
      setExportShareState("too-long");
      setTimeout(() => setExportShareState("idle"), 3000);
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setExportShareState("copied");
      setTimeout(() => setExportShareState("idle"), 2000);
    } catch {
      setExportShareState("error");
      setTimeout(() => setExportShareState("idle"), 2500);
    }
    setExportMenuOpen(false);
  };

  const handleExportDownloadJson = () => {
    setExportDownloading(true);
    const s = useBuilder.getState();
    const config = {
      designSystem: s.designSystem, mode: s.mode, density: s.density,
      interfaceType: s.interfaceType, selectedComponents: s.selectedComponents,
      colorOverrides: s.colorOverrides,
      headerBlocks: s.headerBlocks, sidebarBlocks: s.sidebarBlocks,
      blocks: s.blocks, footerBlocks: s.footerBlocks,
      generatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${s.interfaceType}-${s.designSystem}-canvas.json`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExportDownloading(false), 1500);
    setExportMenuOpen(false);
  };

  const handleOpenExportModal = () => {
    setExportMenuOpen(false);
    setExportOpen(true);
  };

  /* ── Resizable drag bar ── */
  const containerRef = useRef<HTMLDivElement>(null);
  /* Issue #9: default 20% so the canvas dominates when preview is open.
     User can drag the resize handle to adjust; clamp lowered from 30 to
     15 below so the default reads as a comfortable mid-point. */
  const [splitPos, setSplitPos] = useState(20);
  const isDragging = useRef(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    /* rAF-throttle the resize move handlers. Without this, every
       mouse/touch event fires setSplitPos synchronously (60–120 Hz),
       triggering full content-split re-renders per pointermove.
       With rAF, we coalesce to one update per paint frame. */
    let rafId: number | null = null;
    let pendingPos: number | null = null;
    const flush = () => {
      rafId = null;
      if (pendingPos !== null) {
        setSplitPos(pendingPos);
        pendingPos = null;
      }
    };
    const schedule = (pos: number) => {
      pendingPos = Math.max(15, Math.min(75, pos));
      if (rafId === null) rafId = requestAnimationFrame(flush);
    };

    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      schedule(((e.clientX - rect.left) / rect.width) * 100);
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
      schedule(((touch.clientX - rect.left) / rect.width) * 100);
    };
    const onTouchEnd = () => {
      if (isDragging.current) {
        isDragging.current = false;
        setDragActive(false);
        // Clear stranded cursor if touchend fires before mouseup.
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
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

  /* ── Pop-out mode + handoff from /ui-kit ──
     Two URL-param flows live in this effect:
       - ?preview=1 — pop-out PreviewPanel (existing)
       - ?ds=&mode=&density=&themeKey= — handoff from UI Kit so the
         user lands on the same DS/mode/density they were exploring.
     The handoff flow is fire-and-forget: read params, apply state,
     leave URL alone (no replaceState) so the link stays bookmarkable
     and screenshot-friendly. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ds = params.get("ds") as DesignSystem | null;
    const m = params.get("mode") as BuilderMode | null;
    const density = params.get("density");
    const themeKey = params.get("themeKey");

    if (params.get("preview") === "1") {
      const t = params.get("type") as InterfaceType | null;
      const c = params.get("components");
      if (ds) setDesignSystem(ds);
      if (m) setMode(m);
      if (t) setInterfaceType(t);
      if (c) setSelectedComponents(c.split(","));
      setIsStandalone(true);
      return;
    }

    /* Handoff from UI Kit. Apply ds first so its themeMap doesn't
       overwrite a more specific themeKey we received. */
    if (ds) setDesignSystem(ds);
    if (themeKey) useBuilder.getState().setThemeKey(themeKey);
    if (m) setMode(m);
    if (density) useBuilder.getState().setDensity(density);
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
      {/* Skip link — visually hidden until keyboard focused. WCAG 2.1
          2.4.1 Bypass Blocks. Sends users past the top-bar straight to
          the chat + canvas split inside <main id="main-content">. */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* GeminiSidebar removed - replaced by SessionsDrawer (left slide-in).
          isSidebarOpen is kept in state only to preserve any related CSS
          hooks; it's no longer used to toggle a visible sidebar. */}

      {/* ── Main content area ── */}
      <main id="main-content" className="main-content">

        {/* ── Top bar ── */}
        <div className={`top-bar ${headerScrolled ? "scrolled" : ""}`}>

          {/* Left: sessions toggle (ghost) + brand logo + new-session + save indicator.
              Hamburger stays muted so the brand mark holds primary anchor weight. */}
          <div className="top-bar-left">
            <button
              className="top-bar-btn icon-only sidebar-toggle-btn top-bar-btn-ghost"
              onClick={toggleSessionsDrawer}
              title="Open sessions"
              aria-label="Open sessions drawer"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>menu</span>
            </button>
            <Link
              href="/"
              className="top-bar-logo"
              title="Design Hub home"
              aria-label="Design Hub home"
            >
              <img
                src="/aologo.svg"
                alt="ausōs"
                className="ausos-logo-img"
              />
            </Link>
            <button
              className="top-bar-btn icon-only top-bar-new-session"
              onClick={startNewSession}
              title="Start a new session"
              aria-label="Start a new session"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit_square</span>
            </button>
            <SaveIndicator />
          </div>

          {/* Right: UI Kit + Export. Dark/light toggle + Preview button
              removed in Phase F.1 - theme lives in the preview toolbar,
              and Preview toggle was redundant since the canvas is always
              the workspace. */}
          <div className="top-bar-right">
            {/* UI Kit — passes current ds/mode/density/themeKey so
                UI Kit lands on the same configuration the user is
                already exploring in Builder. */}
            <Link
              href={`/ui-kit?ds=${designSystem}&mode=${mode}&density=${encodeURIComponent(density)}&themeKey=${encodeURIComponent(themeKey)}`}
              className="top-bar-btn"
              title="UI Kit overview"
              aria-label="Open UI Kit overview"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">palette</span>
              UI Kit
            </Link>

            {/* Export dropdown - consolidates Share link, JSON download,
                and the code / HTML / Vite modal into a single menu so
                users have one place to hand off a canvas (P3.3). */}
            <div className="top-bar-export-wrap" ref={exportMenuRef}>
              <button
                className={`top-bar-btn ${exportMenuOpen ? "active" : ""}`}
                onClick={() => setExportMenuOpen((v) => !v)}
                title="Export or share the current canvas"
                aria-label="Export canvas"
                aria-haspopup="menu"
                aria-expanded={exportMenuOpen}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">ios_share</span>
                Export
                <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16, marginLeft: 2 }}>
                  {exportMenuOpen ? "expand_less" : "expand_more"}
                </span>
              </button>
              {exportMenuOpen && (
                <div className="top-bar-export-menu" role="menu">
                  <button
                    type="button"
                    className="top-bar-export-item"
                    role="menuitem"
                    onClick={handleExportShare}
                    title="Copy a shareable preview URL to the clipboard"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">
                      {exportShareState === "copied" ? "check"
                        : exportShareState === "too-long" || exportShareState === "error" ? "warning"
                        : "link"}
                    </span>
                    <div className="top-bar-export-item-text">
                      <span className="top-bar-export-item-title">
                        {exportShareState === "copied" ? "Link copied to clipboard"
                          : exportShareState === "too-long" ? "Canvas too large to share"
                          : exportShareState === "error" ? "Clipboard unavailable"
                          : "Copy share link"}
                      </span>
                      <span className="top-bar-export-item-desc">
                        Stateless URL. Anyone with the link sees the canvas.
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="top-bar-export-item"
                    role="menuitem"
                    onClick={handleExportDownloadJson}
                    disabled={exportDownloading}
                    title="Download the canvas as a JSON config"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">
                      {exportDownloading ? "hourglass_top" : "download"}
                    </span>
                    <div className="top-bar-export-item-text">
                      <span className="top-bar-export-item-title">Download canvas JSON</span>
                      <span className="top-bar-export-item-desc">
                        Full state snapshot - blocks, DS, mode, density.
                      </span>
                    </div>
                  </button>
                  <div className="top-bar-export-divider" />
                  <button
                    type="button"
                    className="top-bar-export-item"
                    role="menuitem"
                    onClick={handleOpenExportModal}
                    title="Generate React / HTML / Vite project code"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">code_blocks</span>
                    <div className="top-bar-export-item-text">
                      <span className="top-bar-export-item-title">Export as code...</span>
                      <span className="top-bar-export-item-desc">
                        React TSX, HTML, or a full Vite project bootstrap.
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>
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
      </main>

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

      {/* ── Block context menu - singleton; renders only when open ── */}
      <BlockContextMenu />

      {/* ── Export modal ── */}
      {exportOpen && <ExportPanel onClose={() => setExportOpen(false)} />}

    </div>
  );
}
