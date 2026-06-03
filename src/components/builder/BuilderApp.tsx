"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useBuilder } from "@/store/useBuilder";
import {
  canonicalDesignSystem,
  canonicalBuilderMode,
  canonicalInterfaceType,
} from "@/lib/dsParam";
/* useCloudStorage is still indirectly used via SessionsDrawer + useAutoSave;
 * no direct import here since BuilderApp no longer owns the save/load UI. */
import { ChatPanel } from "./ChatPanel";
import { SettingsPanel } from "./SettingsPanel";
import { PreviewSidePanel, StandalonePreview } from "./PreviewPanel";
import { PresentStage } from "./PresentStage";
import { ExportPanel } from "./ExportPanel";
import { TemplatesDrawer } from "./TemplatesDrawer";
import { SessionsDrawer } from "./SessionsDrawer";
import { SaveIndicator } from "./SaveIndicator";
import { SlashInserter } from "./SlashInserter";
import { BlockContextMenu } from "./BlockContextMenu";
import { usePreviewMode } from "@/store/usePreviewMode";
import { useInspectorPin } from "@/store/useInspectorPin";
import { useBuilderShortcuts, isEditableTarget } from "@/lib/useBuilderShortcuts";
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
    chatOpen: isChatOpen, setChatOpen,
    chatMode, chatPlacement, setChatPlacement,
    blocks: bodyBlocks, headerBlocks, sidebarBlocks, footerBlocks, activeTemplateId,
    toggleSessionsDrawer, startNewSession,
  } = useBuilder();

  /* Floating chat is a fixed overlay card over a full-bleed canvas; docked
     chat is the legacy left column that splits width with the preview. */
  const chatFloating = chatMode === "floating";

  /* Whether the user has anything on the canvas yet. Drives the floating
     card's size: roomy while the canvas is empty (onboarding has room to
     breathe), compact once there's a canvas to float over. NB: this is
     content presence, NOT `previewOpen` (which toggles the separate
     read-only preview side panel and stays off during normal editing). */
  const hasCanvasContent =
    bodyBlocks.length > 0 ||
    headerBlocks.length > 0 ||
    sidebarBlocks.length > 0 ||
    footerBlocks.length > 0 ||
    Boolean(activeTemplateId);

  /* #15 moveable chat: drag the floating card by its grip, then on release
     snap to the nearest edge (left/right/bottom) if close, else keep a free
     position. We move the card directly via the ref during the drag (no
     per-move React re-render — same reasoning as the resize-handle) and commit
     the final placement to the store on pointer-up. */
  const chatFloatRef = useRef<HTMLElement | null>(null);
  const startChatDrag = React.useCallback((e: React.PointerEvent) => {
    const card = chatFloatRef.current;
    if (!card) return;
    if ((e.target as HTMLElement).closest("button")) return; // let header controls work
    e.preventDefault();
    const rect = card.getBoundingClientRect();
    const offX = e.clientX - rect.left;
    const offY = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;
    card.style.transition = "none";
    let curX = rect.left;
    let curY = rect.top;
    const onMove = (ev: PointerEvent) => {
      curX = Math.max(8, Math.min(window.innerWidth - w - 8, ev.clientX - offX));
      curY = Math.max(8, Math.min(window.innerHeight - h - 8, ev.clientY - offY));
      card.style.left = `${curX}px`;
      card.style.top = `${curY}px`;
      card.style.right = "auto";
      card.style.bottom = "auto";
      card.style.margin = "0";
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      card.style.transition = "";
      const SNAP = 48;
      const nearLeft = curX <= SNAP;
      const nearRight = curX + w >= window.innerWidth - SNAP;
      const nearBottom = curY + h >= window.innerHeight - SNAP;
      let dock: "free" | "left" | "right" | "bottom" = "free";
      if (nearBottom && !nearLeft && !nearRight) dock = "bottom";
      else if (nearRight) dock = "right";
      else if (nearLeft) dock = "left";
      setChatPlacement({ dock, x: Math.round(curX), y: Math.round(curY) });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [setChatPlacement]);

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
     reflects the choice. Sa+uoaui share lineage; salt also gets
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
      /* uoaui's glass tint inherits Salt's accent via --salt-palette-accent. */
      if (designSystem === "uoaui") {
        root.style.setProperty("--salt-palette-accent", accentOverride);
      }
    }
  }, [designSystem, accentOverride]);

  const [isStandalone, setIsStandalone] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  /* Register Cmd+Z / Cmd+Shift+Z for canvas undo/redo.
     Initialized once, scoped to the builder tree. */
  useBuilderShortcuts();

  /* ── Preview-mode (Phase E1, 2026-05-29) ──
     Two modes: "edit" (default) and "preview". Preview hides all
     editor chrome (selection borders, hover labels, drag handles,
     remove + swap buttons, chip rail, resize handles) while
     leaving rendered content fully interactive.
     Shortcut: Shift+Cmd+P (Mac) / Shift+Ctrl+P (other) toggles.
     Esc from Preview returns to Edit. The listener no-ops when
     focus is inside an input / textarea / contenteditable so we
     never steal keystrokes from the user typing. */
  const builderMode = usePreviewMode((s) => s.mode);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof HTMLElement && isEditableTarget(t)) return;
      const k = e.key.toLowerCase();
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.shiftKey && k === "p") {
        e.preventDefault();
        usePreviewMode.getState().toggle();
        return;
      }
      if (e.key === "Escape") {
        const s = usePreviewMode.getState();
        if (s.mode === "preview") {
          e.preventDefault();
          s.setMode("edit");
          return;
        }
        /* Phase E2: Esc in Edit mode releases the hover-inspector
           pin (if any). No-op when nothing is pinned, so this never
           steals an Escape from another consumer. */
        const ip = useInspectorPin.getState();
        if (ip.pinnedBlockId != null) {
          e.preventDefault();
          ip.unpin();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /* Phase E2: click-outside releases the inspector pin. Any
     pointerdown that isn't inside a [data-block-id] subtree (so
     not on a block, not on the inspector controls) clears the
     pin. The block's own pointerdown re-pins it immediately, so
     clicking from one pinned block to another reads as a swap,
     not as a release-then-pin. Mouse-driven only — keyboard
     equivalent is Esc above. */
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest("[data-block-id]")) return;
      const ip = useInspectorPin.getState();
      if (ip.pinnedBlockId != null) ip.unpin();
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

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
      deviceMode: s.deviceMode,
      themeKey: s.themeKey,
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
    /* Canonicalize external input. Casting `params.get("ds") as DesignSystem`
       used to flow `"md3"` straight to `setDesignSystem`, where the themeMap
       lookup returned undefined and the next property read crashed the app.
       `canonicalDesignSystem` also maps user-friendly aliases (md3 → m3). */
    const ds = canonicalDesignSystem(params.get("ds"));
    const m = canonicalBuilderMode(params.get("mode"));
    const density = params.get("density");
    const themeKey = params.get("themeKey");

    if (params.get("preview") === "1") {
      /* New pop-outs carry ?shared=<hash>: the fork effect below hydrates
         the full canvas, then flips isStandalone AFTER, so the standalone
         view mounts already-populated (no empty flash). Old bookmarks
         (?preview=1&ds=&mode=&type=&components=, no hash) have nothing to
         hydrate, so apply those params + go standalone immediately. */
      if (!params.get("shared")) {
        const t = canonicalInterfaceType(params.get("type"));
        const c = params.get("components");
        if (ds) setDesignSystem(ds);
        if (m) setMode(m);
        if (t) setInterfaceType(t);
        if (c) setSelectedComponents(c.split(","));
        setIsStandalone(true);
      }
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
    /* A pop-out (?preview=1&shared=) hydrates here, then flips to standalone
       AFTER so StandalonePreview mounts populated, not empty. Captured now,
       before the URL cleanup below clears the query. */
    const isPopout = params.get("preview") === "1";
    (async () => {
      try {
        const { decodeShareState } = await import("@/lib/shareState");
        const state = decodeShareState(hash);
        if (!state) {
          /* Bad hash in a pop-out: still go standalone (empty) rather than
             stranding the pop-out window on the full editor shell. */
          if (isPopout) setIsStandalone(true);
          return;
        }
        const store = useBuilder.getState();
        store.setDesignSystem(state.designSystem);
        store.setMode(state.mode);
        store.setDensity(state.density);
        store.setHeaderBlocks(state.headerBlocks);
        store.setSidebarBlocks(state.sidebarBlocks);
        store.setBlocks(state.blocks);
        store.setFooterBlocks(state.footerBlocks);
        if (state.activeTemplateId) store.setActiveTemplateId(state.activeTemplateId);
        /* deviceMode + themeKey (PR-C schema). themeKey is applied LAST,
           after setMode above, because setMode derives a dialect-specific
           default themeKey that the explicit one must override — do not
           reorder. Only override when a themeKey was actually shared
           (legacy links decode themeKey as null → keep setMode's default). */
        store.setDeviceMode(state.deviceMode);
        if (state.themeKey) store.setThemeKey(state.themeKey);
        store.setPreviewOpen(true);
        /* Pop-out: now that the canvas is populated, flip to standalone. */
        if (isPopout) setIsStandalone(true);
        // Clean the URL so reload doesn't trigger another apply
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, "", newUrl);
      } catch {
        /* Decoding or import failed - silently ignore; user lands on an empty builder */
        if (isPopout) setIsStandalone(true);
      }
    })();
  }, []);

  /* handleSaveProject + handleLoadProject removed - SessionsDrawer
     owns session load/save/delete now, and auto-save handles persistence. */

  if (isStandalone) return <StandalonePreview />;

  /* Present mode is a full-stage, read-only experience that REPLACES the
     editor shell (it renders data-builder-mode="preview" itself to inherit
     the chrome-hide cascade). Early-return after the standalone check and
     after all hooks above, so the global Shift+Cmd+P / Esc listeners stay
     mounted and can toggle back to edit. */
  if (builderMode === "preview") return <PresentStage />;

  return (
    <div
      className={`builder-shell ${mode === "light" ? "builder-light" : ""}`}
      data-builder-mode={builderMode}
    >
      {/* Skip link is provided once by the root layout (app/layout.tsx),
          targeting this shell's <main id="main-content"> below. A per-shell
          link here was a duplicate "Skip to main content" (WCAG 2.4.1/4.1.2). */}

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
                alt="uoaui"
                className="uoaui-logo-img"
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

          {/* Right: UI Kit + Export. The Edit/Preview toggle moved into the
              canvas toolbar (PreviewBar) — it's a canvas control and now lives
              beside Compare / device / DS there. Shortcut Shift+Cmd+P still
              toggles; Esc from Preview still returns to Edit. */}
          <div className="top-bar-right">
            {/* UI Kit, passes current ds/mode/density/themeKey so
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

        {/* ── Content: chat + resizable preview ──
             Docked mode: chat is a flex column that splits width with the
             preview (resize-handle between them). Floating mode: chat is
             lifted out into a fixed overlay card (below), so the canvas
             goes full-bleed — we flag `chat-collapsed` to hand the preview
             the full width via the existing rule. */}
        <div
          className={`content-split ${previewOpen ? "has-preview" : ""} ${(!isChatOpen || chatFloating) ? "chat-collapsed" : ""}`}
          ref={containerRef}
          style={
            previewOpen && isChatOpen && !chatFloating
              ? ({ "--chat-width": `${splitPos}%` } as React.CSSProperties)
              : undefined
          }
        >
          {!chatFloating && (
            <div className={`chat-slide ${isChatOpen ? "chat-slide-open" : "chat-slide-closed"}`}>
              <ChatPanel />
            </div>
          )}

          {previewOpen && isChatOpen && !chatFloating && (
            <div
              className={`resize-handle ${dragActive ? "dragging" : ""}`}
              onMouseDown={startDrag}
              onTouchStart={startDragTouch}
              aria-hidden="true"
            />
          )}

          <PreviewSidePanel />
        </div>

        {/* ── Floating chat card — overlays the full-bleed canvas, grows
             from the corner-FAB origin. Roomier while onboarding (no
             preview yet), compact once there's a canvas to sit over. ── */}
        {chatFloating && isChatOpen && (
          <aside
            ref={chatFloatRef}
            className={`chat-float ${hasCanvasContent ? "chat-float-compact" : "chat-float-onboarding"}${
              chatPlacement && chatPlacement.dock !== "free" ? ` chat-float-pin-${chatPlacement.dock}` : ""
            }`}
            style={
              chatPlacement && chatPlacement.dock === "free"
                ? { left: chatPlacement.x, top: chatPlacement.y, right: "auto", bottom: "auto", margin: 0 }
                : undefined
            }
            aria-label="uoaui assistant"
          >
            {/* #15 drag handle — grab to move; release near an edge to pin. */}
            <div
              className="chat-float-grip"
              onPointerDown={startChatDrag}
              title="Drag to move. Release near an edge to pin."
              aria-hidden="true"
            >
              <span className="material-symbols-outlined">drag_indicator</span>
            </div>
            <ChatPanel />
          </aside>
        )}

        {/* ── Copyright - in-flow below chat, never overlaps content ── */}
        <div className="builder-copyright-fixed" aria-hidden="true">
          &copy; {new Date().getFullYear()} uoaui. All rights reserved.
        </div>
      </main>

      {/* Collapsed-chat corner FAB (4.3): when the chat is tucked away while
          editing, it lives as a floating corner button so the canvas gets the
          space and the chat is one tap away. The preview-toolbar chevron
          collapses it; this brings it back. */}
      {!isChatOpen && (
        <button
          type="button"
          className="chat-reopen-fab"
          onClick={() => setChatOpen(true)}
          title="Open chat"
          aria-label="Open chat"
        >
          <span className="material-symbols-outlined" aria-hidden="true">forum</span>
        </button>
      )}

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
