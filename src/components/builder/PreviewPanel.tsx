"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
  MessageSquare,
  Database,
  Settings,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Bot,
  Send,
  Home,
  User,
  Bell,
  Search,
} from "lucide-react";
import {
  DndContext,
  pointerWithin,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  type CollisionDetection,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useBuilder, type DeviceMode, type Block, type ZoneId } from "@/store/useBuilder";
import { getTheme, getFullCSS } from "@/data/registry";
import { sanitizeCSS } from "@/lib/sanitizeCSS";
import { getPreviewOfficialScope } from "@/lib/officialTokens";
import type { SystemId } from "@/store/useDesignHub";
import { useCloudStorage } from "@/lib/firebase";
import { undo as canvasUndo, redo as canvasRedo } from "@/lib/builderHistory";
import { CompareView } from "./CompareView";
import { buildShareUrl, buildSharedCanvas } from "@/lib/shareState";
import { BLOCK_TO_ID } from "@/lib/componentMaps";
import { PreviewCanvas, CodeViewer, makeBlockId } from "./PreviewCanvas";
import { ComponentLibrary } from "./ComponentLibrary";
import { ComponentRenderer } from "./ComponentRenderer";
import { showToast } from "@/lib/toast";
import { LIBRARY_BLUEPRINTS } from "@/lib/blockRegistry";
import { SortableBlock } from "./SortableBlock";
import { ZoneDropContainer } from "./ZoneDropContainer";
import { PreviewToggle } from "./PreviewToggle";
import { usePreviewMode } from "@/store/usePreviewMode";
import { PreviewReadOnlyContext, usePreviewReadOnly } from "./previewReadOnly";

/* ══════════════════════════════════════════════════════════
   DSPreviewStyles - injects design-system CSS into the builder.
   ══════════════════════════════════════════════════════════
   Salt / M3 / Fluent / uoaui ship their component styling through
   pre-baked .s-*, .m3-*, .f-*, .a-* rules in builder.css, but the
   Carbon .cb-* rules live in carbonBuildCSS() (so they can read the
   active Carbon theme). We mirror the DesignHubApp pattern here and
   dangerouslySetInnerHTML the sanitised Carbon CSS (tokens + .cb-*
   rules) whenever designSystem === "carbon", so the /builder canvas
   gets the same styling as /ui-kit. Returns null for other DSes - no
   injection required. */
export function DSPreviewStyles() {
  const designSystem = useBuilder((s) => s.designSystem);
  const themeKey = useBuilder((s) => s.themeKey);
  const density = useBuilder((s) => s.density);

  /* Build the Carbon stylesheet UNCONDITIONALLY inside useMemo (returns
     null for non-Carbon systems). The hook must run on every render: a
     prior version early-returned for non-Carbon BEFORE this useMemo, so
     switching the design system to/from Carbon changed the hook count and
     crashed the whole builder with React #310 ("Rendered fewer hooks than
     expected"). All hooks stay above any conditional return.

     - Carbon theme keys ("white"/"g10"/"g90"/"g100") pass through; fall
       back to "white" for anything unexpected.
     - The shared density labels (high/medium/low/touch) map to Carbon's
       ladder (compact/normal/spacious); "touch" routes to spacious.
     - getFullCSS does non-trivial string assembly, so memoize on the raw
       inputs to avoid re-running on unrelated parent re-renders. */
  const css = useMemo(() => {
    if (designSystem !== "carbon") return null;
    const resolvedTheme = ["white", "g10", "g90", "g100"].includes(themeKey) ? themeKey : "white";
    const T = getTheme("carbon", resolvedTheme);
    const densityMap: Record<string, string> = {
      high: "compact",
      medium: "normal",
      low: "spacious",
      touch: "spacious",
    };
    const carbonDensity = densityMap[density] ?? "normal";
    return sanitizeCSS(getFullCSS("carbon", T, carbonDensity));
  }, [designSystem, themeKey, density]);

  if (!css) return null;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

/* ── Viewport presets ── */
const PRESETS: Record<DeviceMode, { width: number; height: number; label: string }> = {
  desktop: { width: 1200, height: 800, label: "1200 \u00d7 800" },
  tablet: { width: 768, height: 1024, label: "768 \u00d7 1024" },
  mobile: { width: 375, height: 812, label: "375 \u00d7 812" },
};

/* ── Icon map for sidebar nav items ──
   Covers every icon key the builder templates use, plus a small set of
   commonly-requested extras. Templates that previously hit the
   MessageSquare fallback (home, person) now resolve to the deliberate
   icon — matters for visual consistency since lucide icons have
   slightly different content centring inside their viewBox. */
const NAV_ICON_MAP: Record<string, typeof MessageSquare> = {
  chat: MessageSquare,
  database: Database,
  settings: Settings,
  /* BarChart2 (symmetric three-bar glyph, visual centre at x=12) instead of
     BarChart3/ChartColumn — the latter's L-axis pulls its visual centre to
     ~x=10.5, which made the Events nav row read indented vs its siblings. The
     old margin-left:-1px compensation was a no-op (box + gap shifted together)
     so the misalignment never resolved until the glyph itself was swapped. */
  bar_chart: BarChart2,
  home: Home,
  person: User,
  notifications: Bell,
  search: Search,
};

/* ── Sample chat messages for the empty state ── */
const SAMPLE_MESSAGES = [
  { role: "user" as const, text: "Summarize yesterday\u2019s sales data" },
  { role: "ai" as const, text: "Yesterday\u2019s total revenue was $14,280 across 142 orders. Top category: Electronics (+12% vs. prior day)." },
  { role: "user" as const, text: "Show me a breakdown by region" },
];

/* ══════════════════════════════════════════════════════════
   Device Controls - top bar with Desktop / Tablet / Mobile
   ══════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════
   PreviewBar - single consolidated toolbar (Phase F.2; zoned declutter)
   Replaces the old two-row DeviceControls + PreviewToolbar.

   Three zones (two spacers between them):
     LEFT:   [← Chat] | [↶ ↷ undo/redo]
     CENTER: [🖥 📱 📞 device segment]  ( Edit | Preview )
     RIGHT:  [ <ActiveDS> ▾ ]  [🌓]  [Components]  [⋯]

   The five DS buttons collapsed into ONE labelled dropdown
   (preview-bar-ds-trigger -> preview-bar-ds-menu). Device buttons
   are wrapped in a connected segmented control. Compare, Density,
   Code and the rare actions (Refresh, Pop-out, Library toggle)
   live behind the ⋯ overflow menu. Density labels are normalised
   to High / Medium / Low across all DSes.
   ══════════════════════════════════════════════════════════ */
function PreviewBar() {
  const deviceMode = useBuilder((s) => s.deviceMode);
  const setDeviceMode = useBuilder((s) => s.setDeviceMode);
  const bumpPreview = useBuilder((s) => s.bumpPreview);
  const chatOpen = useBuilder((s) => s.chatOpen);
  const toggleChat = useBuilder((s) => s.toggleChat);
  const designSystem = useBuilder((s) => s.designSystem);
  const setDesignSystem = useBuilder((s) => s.setDesignSystem);
  const mode = useBuilder((s) => s.mode);
  const setMode = useBuilder((s) => s.setMode);
  const interfaceType = useBuilder((s) => s.interfaceType);
  const selectedComponents = useBuilder((s) => s.selectedComponents);
  const colorOverrides = useBuilder((s) => s.colorOverrides);
  const density = useBuilder((s) => s.density);
  const setDensity = useBuilder((s) => s.setDensity);
  const canvasSpacing = useBuilder((s) => s.canvasSpacing);
  const setCanvasSpacing = useBuilder((s) => s.setCanvasSpacing);
  const canvasViewMode = useBuilder((s) => s.canvasViewMode);
  const toggleCanvasViewMode = useBuilder((s) => s.toggleCanvasViewMode);
  const toggleComponentLibrary = useBuilder((s) => s.toggleComponentLibrary);
  /* Gate the relocated Edit/Preview toggle on real content — same signal as
     PreviewPanel's hasContent. PreviewBar only renders when the preview is
     open (which already implies content), so this is belt-and-braces. */
  const hasBuilderContent = useBuilder(
    (s) =>
      s.messages.some((m) => m.role === "ai") ||
      s.blocks.length > 0 ||
      s.selectedBlockId !== null,
  );
  const componentLibraryOpen = useBuilder((s) => s.componentLibraryOpen);
  const compareMode = useBuilder((s) => s.compareMode);
  const toggleCompareMode = useBuilder((s) => s.toggleCompareMode);
  /* Zone customization (PR2): show/hide peripheral panels. */
  const zoneLayouts = useBuilder((s) => s.zoneLayouts);
  const setZoneLayout = useBuilder((s) => s.setZoneLayout);

  const [overflowOpen, setOverflowOpen] = useState(false);
  const [dsMenuOpen, setDsMenuOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied" | "too-long" | "error">("idle");

  const overflowRef = useRef<HTMLDivElement | null>(null);
  const dsMenuRef = useRef<HTMLDivElement | null>(null);

  /* Dismiss overflow menu on outside click + Esc */
  useEffect(() => {
    if (!overflowOpen) return;
    const onDown = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOverflowOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [overflowOpen]);

  /* Dismiss DS dropdown on outside click + Esc (mirrors the overflow pattern). */
  useEffect(() => {
    if (!dsMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (dsMenuRef.current && !dsMenuRef.current.contains(e.target as Node)) {
        setDsMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDsMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [dsMenuOpen]);

  const dsSystems: { key: "salt" | "m3" | "fluent" | "uoaui" | "carbon"; label: string }[] = [
    { key: "salt", label: "Salt DS" },
    { key: "m3", label: "Material 3" },
    { key: "fluent", label: "Fluent 2" },
    { key: "uoaui", label: "uoaui DS" },
    { key: "carbon", label: "Carbon" },
  ];
  const activeDsLabel = dsSystems.find((s) => s.key === designSystem)?.label ?? "Design system";

  const preset = PRESETS[deviceMode];
  const devices: { key: DeviceMode; Icon: typeof Monitor; label: string }[] = [
    { key: "desktop", Icon: Monitor, label: "Desktop" },
    { key: "tablet", Icon: Tablet, label: "Tablet" },
    { key: "mobile", Icon: Smartphone, label: "Mobile" },
  ];

  const modKey = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform) ? "⌘" : "Ctrl";

  const handlePopOut = () => {
    const basePath =
      typeof window !== "undefined"
        ? ((window as unknown as Record<string, Record<string, string>>).__NEXT_DATA__?.basePath || "")
        : "";
    /* Route the pop-out through the share encoder so the FULL canvas
       travels to the new window: all four zone block arrays plus
       deviceMode + themeKey. Previously this passed only ds/mode/
       selectedComponents, so the pop-out rendered an EMPTY canvas
       (selectedComponents never drives the standalone render). The pop-out
       URL reuses the ?shared= fork flow (BuilderApp hydrates from the hash)
       plus ?preview=1 to land in standalone mode. */
    const s = useBuilder.getState();
    /* buildSharedCanvas → v:2 when multi-page so the pop-out carries the full
       page set (not just the active page); v:1 otherwise. */
    const { hash, tooLong } = buildShareUrl(buildSharedCanvas(s));
    if (tooLong) {
      showToast("Canvas too large to pop out. Try the share link instead.", { icon: "error" });
      setOverflowOpen(false);
      return;
    }
    window.open(
      `${window.location.origin}${basePath}/builder?preview=1&shared=${hash}`,
      "design-hub-preview", "width=900,height=700"
    );
    setOverflowOpen(false);
  };

  const handleShare = async () => {
    const s = useBuilder.getState();
    const { url, tooLong } = buildShareUrl(buildSharedCanvas(s));
    if (tooLong) {
      setShareState("too-long");
      setTimeout(() => setShareState("idle"), 3000);
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2000);
    } catch {
      setShareState("error");
      setTimeout(() => setShareState("idle"), 2500);
    }
    setOverflowOpen(false);
  };

  const handleDownload = () => {
    setDownloading(true);
    const config = {
      designSystem, mode, density, interfaceType,
      selectedComponents, colorOverrides,
      generatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${interfaceType}-${designSystem}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloading(false), 1500);
    setOverflowOpen(false);
  };

  const handleRefresh = () => {
    bumpPreview();
    setOverflowOpen(false);
  };

  const handleToggleLibrary = () => {
    toggleComponentLibrary();
    setOverflowOpen(false);
  };

  /* Consistent density labels across DSes - replaces the old
     DS-specific labels (HD/MD/LD vs Small/Medium/Large) that
     confused users. */
  const densityOptions = [
    { key: "high",   label: "High",   hint: "Tight spacing" },
    { key: "medium", label: "Medium", hint: "Default" },
    { key: "low",    label: "Low",    hint: "Roomy spacing" },
  ];

  return (
    <div className="preview-bar">
      {/* Chat collapse */}
      <button
        className="preview-bar-btn preview-bar-btn-icon"
        onClick={toggleChat}
        title={chatOpen ? "Collapse chat" : "Expand chat"}
        aria-label={chatOpen ? "Collapse chat" : "Expand chat"}
      >
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>
          {chatOpen ? "chevron_left" : "chevron_right"}
        </span>
      </button>

      <span className="preview-bar-sep" aria-hidden="true" />

      {/* Undo / Redo */}
      <div className="preview-bar-group">
        <button
          className="preview-bar-btn preview-bar-btn-icon"
          onClick={() => canvasUndo()}
          title={`Undo · ${modKey}+Z`}
          aria-label={`Undo (${modKey}+Z)`}
        >
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>undo</span>
        </button>
        <button
          className="preview-bar-btn preview-bar-btn-icon"
          onClick={() => canvasRedo()}
          title={`Redo · ${modKey}+Shift+Z`}
          aria-label={`Redo (${modKey}+Shift+Z)`}
        >
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>redo</span>
        </button>
      </div>

      {/* ── Spacer 1: pushes the CENTER zone (device + Edit/Preview) away
             from the LEFT zone (collapse + undo/redo). ── */}
      <span className="preview-bar-spacer" aria-hidden="true" />

      {/* ── CENTER ZONE ── */}
      {/* Device segmented control — connected outline, dividers between,
          active segment FILLED + bolder icon (selection is not colour-only). */}
      <div className="preview-bar-segment" role="group" aria-label="Viewport size">
        {devices.map(({ key, Icon, label }) => (
          <button
            key={key}
            className={`preview-bar-btn preview-bar-btn-icon${deviceMode === key ? " preview-bar-btn-active" : ""}`}
            onClick={() => setDeviceMode(key)}
            title={`${label} (${preset.label})`}
            aria-label={`${label} viewport`}
            aria-pressed={deviceMode === key}
          >
            <Icon size={16} strokeWidth={deviceMode === key ? 2.4 : 1.6} />
          </button>
        ))}
      </div>

      {/* Edit/Preview mode toggle — sits with the device control in the
          centre zone. Shown only once there's content; PreviewBar itself
          renders only when the preview is open. Shortcut Shift+Cmd+P. */}
      {hasBuilderContent && <PreviewToggle />}

      {/* ── Spacer 2: pushes the RIGHT zone (DS / theme / Components / ⋯)
             to the far edge, giving the bar three readable zones. ── */}
      <span className="preview-bar-spacer" aria-hidden="true" />

      {/* ── RIGHT ZONE ── */}
      {/* Active design-system dropdown — replaces the 5-button row. Trigger
          shows the active DS label + caret; the menu lists all 5 systems
          and checks the current one. Compare lives in the ⋯ overflow now. */}
      <div className="preview-bar-ds-wrap" ref={dsMenuRef}>
        <button
          className={`preview-bar-ds-trigger${dsMenuOpen ? " preview-bar-btn-active" : ""}`}
          onClick={() => setDsMenuOpen((v) => !v)}
          title="Switch the canvas design system"
          aria-label={`Design system: ${activeDsLabel}`}
          aria-haspopup="menu"
          aria-expanded={dsMenuOpen}
        >
          <span className="preview-bar-ds-label">{activeDsLabel}</span>
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>
            {dsMenuOpen ? "expand_less" : "expand_more"}
          </span>
        </button>
        {dsMenuOpen && (
          <div className="preview-bar-ds-menu" role="menu" aria-label="Design system">
            {dsSystems.map((s) => (
              <button
                key={s.key}
                className={`preview-bar-ds-item${designSystem === s.key ? " preview-bar-ds-item-active" : ""}`}
                role="menuitem"
                aria-checked={designSystem === s.key}
                onClick={() => { setDesignSystem(s.key); setDsMenuOpen(false); }}
                title={`Switch canvas to ${s.label}`}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  {designSystem === s.key ? "check" : "palette"}
                </span>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <span className="preview-bar-sep" aria-hidden="true" />

      {/* Theme toggle - lives with the canvas controls */}
      <button
        className="preview-bar-btn preview-bar-btn-icon"
        onClick={() => setMode(mode === "dark" ? "light" : "dark")}
        title={mode === "dark" ? "Switch canvas to light mode" : "Switch canvas to dark mode"}
        aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>
          {mode === "dark" ? "light_mode" : "dark_mode"}
        </span>
      </button>

      {/* Density + Code + Compare live in the ⋯ overflow menu — power-user
         toggles that don't need primary bar weight. Keeps the canvas row
         focused on device / DS / mode. */}

      {/* Reopen component library — only visible when the panel is
         closed. When open, the in-panel × button handles close. */}
      {!componentLibraryOpen && (
        <>
          <span className="preview-bar-sep" aria-hidden="true" />
          <button
            className="preview-bar-btn preview-bar-btn-pill"
            onClick={handleToggleLibrary}
            title="Show component library (⌘.)"
            aria-label="Show component library"
            aria-pressed={false}
          >
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
              style={{ fontSize: 14, marginRight: 4 }}
            >
              category
            </span>
            Components
          </button>
        </>
      )}

      {/* ⋯ overflow menu - rare actions */}
      <div className="preview-bar-overflow-wrap" ref={overflowRef}>
        <button
          className={`preview-bar-btn preview-bar-btn-icon${overflowOpen ? " preview-bar-btn-active" : ""}`}
          onClick={() => setOverflowOpen((v) => !v)}
          title="More actions"
          aria-label="More canvas actions"
          aria-haspopup="menu"
          aria-expanded={overflowOpen}
        >
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 18 }}>more_horiz</span>
        </button>
        {overflowOpen && (
          <div className="preview-bar-overflow" role="menu">
            <button
              className={`preview-bar-overflow-item${canvasViewMode === "code" ? " preview-bar-overflow-item-active" : ""}`}
              role="menuitemcheckbox"
              aria-checked={canvasViewMode === "code"}
              onClick={() => { toggleCanvasViewMode(); setOverflowOpen(false); }}
            >
              <span className="preview-bar-code-glyph" aria-hidden="true" style={{ fontSize: 13, width: 18, textAlign: "center" }}>&lt;/&gt;</span>
              {canvasViewMode === "code" ? "Show UI preview" : "Show code view"}
            </button>
            <div className="preview-bar-overflow-divider" />
            {/* Canvas spacing — WYSIWYG (tight, matches the rendered/exported UI)
                vs Comfortable (roomier per-block spacing for fiddly editing). */}
            <button
              className={`preview-bar-overflow-item${canvasSpacing === "comfortable" ? " preview-bar-overflow-item-active" : ""}`}
              role="menuitemcheckbox"
              aria-checked={canvasSpacing === "comfortable"}
              onClick={() => { setCanvasSpacing(canvasSpacing === "tight" ? "comfortable" : "tight"); setOverflowOpen(false); }}
              title="Tight matches the real UI; Comfortable adds editing room"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {canvasSpacing === "comfortable" ? "check" : "fit_screen"}
              </span>
              Comfortable spacing
            </button>
            <div className="preview-bar-overflow-divider" />
            {/* Density submenu — checkmark on active. Normalised labels
                across DSes (High / Medium / Low / Touch etc.). */}
            <div className="preview-bar-overflow-group-label" aria-hidden="true">Density</div>
            {densityOptions.map((d) => (
              <button
                key={d.key}
                className={`preview-bar-overflow-item${density === d.key ? " preview-bar-overflow-item-active" : ""}`}
                role="menuitemradio"
                aria-checked={density === d.key}
                onClick={() => { setDensity(d.key); setOverflowOpen(false); }}
                title={d.hint}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  {density === d.key ? "check" : "density_medium"}
                </span>
                {d.label}
              </button>
            ))}
            <div className="preview-bar-overflow-divider" />
            {/* Compare design systems — relocated from the bar to declutter.
                Checkmark reflects the live compareMode state. */}
            <button
              className={`preview-bar-overflow-item${compareMode ? " preview-bar-overflow-item-active" : ""}`}
              role="menuitemcheckbox"
              aria-checked={compareMode}
              onClick={() => { toggleCompareMode(); setOverflowOpen(false); }}
            >
              <span className="material-symbols-outlined" aria-hidden="true">compare</span>
              {compareMode ? "Exit compare mode" : "Compare design systems"}
            </button>
            <div className="preview-bar-overflow-divider" />
            {/* Panels (PR2): show/hide the peripheral zones. Hiding keeps the
                zone's blocks, so toggling back restores its content. */}
            <div className="preview-bar-overflow-group-label" aria-hidden="true">Panels</div>
            {([
              { z: "header", label: "Header" },
              { z: "sidebar", label: "Left panel" },
              { z: "footer", label: "Footer" },
            ] as const).map(({ z, label }) => {
              const visible = zoneLayouts[z].visible !== false;
              return (
                <button
                  key={z}
                  className={`preview-bar-overflow-item${visible ? " preview-bar-overflow-item-active" : ""}`}
                  role="menuitemcheckbox"
                  aria-checked={visible}
                  onClick={() => setZoneLayout(z, { visible: !visible })}
                  title={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {visible ? "check_box" : "check_box_outline_blank"}
                  </span>
                  {label}
                </button>
              );
            })}
            <div className="preview-bar-overflow-divider" />
            <button className="preview-bar-overflow-item" role="menuitem" onClick={handleToggleLibrary}>
              <span className="material-symbols-outlined" aria-hidden="true">category</span>
              {componentLibraryOpen ? "Hide component library" : "Show component library"}
            </button>
            <button className="preview-bar-overflow-item" role="menuitem" onClick={handleRefresh}>
              <span className="material-symbols-outlined" aria-hidden="true">refresh</span>
              Refresh preview
            </button>
            <button className="preview-bar-overflow-item" role="menuitem" onClick={handlePopOut}>
              <span className="material-symbols-outlined" aria-hidden="true">open_in_new</span>
              Pop out to window
            </button>
            <div className="preview-bar-overflow-divider" />
            <div className="preview-bar-overflow-hint">
              Share and download moved to the top-bar <strong>Export</strong> menu.
            </div>
          </div>
        )}
      </div>
      <span className="bp-dimensions-sr" aria-live="polite">{preset.label}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   P2 Frames — FrameTab + ZoneAddBar
   ══════════════════════════════════════════════════════════
   A Figma-like frame label that pins to a peripheral frame
   (header / sidebar / footer) in EDIT mode only. It names the
   frame and carries a remove (×) affordance. Removing a frame
   routes through setZoneVisible(zone, false) (undo-safe; keeps
   the zone's blocks) and surfaces an Undo toast.

   When a frame is hidden, ZoneAddBar renders an "+ Add <frame>"
   chip so it can be brought back. Both are chrome (— bc-* tokens,
   AA, focus rings, keyboard-activatable) and never render under
   [data-builder-mode="preview"] (gated on readOnly).
   ══════════════════════════════════════════════════════════ */
const FRAME_META: Record<"header" | "sidebar" | "footer", { label: string; icon: string }> = {
  header:  { label: "Header",  icon: "top_panel_open" },
  sidebar: { label: "Sidebar", icon: "left_panel_open" },
  footer:  { label: "Footer",  icon: "bottom_panel_open" },
};

function FrameTab({ zone }: { zone: "header" | "sidebar" | "footer" }) {
  const readOnly = usePreviewReadOnly();
  const setZoneVisible = useBuilder((s) => s.setZoneVisible);
  if (readOnly) return null;
  const meta = FRAME_META[zone];
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoneVisible(zone, false);
    showToast(`${meta.label} removed`, {
      icon: "delete",
      durationMs: 4000,
      action: { label: "Undo", onClick: () => setZoneVisible(zone, true) },
    });
  };
  return (
    <div className={`bp-frame-tab bp-frame-tab-${zone}`} contentEditable={false} aria-hidden={false}>
      <span className="material-symbols-outlined bp-frame-tab-icon" aria-hidden="true">{meta.icon}</span>
      <span className="bp-frame-tab-label">{meta.label}</span>
      <button
        type="button"
        className="bp-frame-tab-remove"
        onClick={handleRemove}
        title={`Remove ${meta.label.toLowerCase()}`}
        aria-label={`Remove ${meta.label.toLowerCase()} frame`}
      >
        <span className="material-symbols-outlined" aria-hidden="true">close</span>
      </button>
    </div>
  );
}

/* Add-frame strip — renders a chip for each currently-hidden peripheral frame
   so a removed frame can be restored. Hidden entirely in preview mode and when
   every frame is already present. */
function ZoneAddBar() {
  const readOnly = usePreviewReadOnly();
  const zoneLayouts = useBuilder((s) => s.zoneLayouts);
  const setZoneVisible = useBuilder((s) => s.setZoneVisible);
  if (readOnly) return null;
  const hidden = (["header", "sidebar", "footer"] as const).filter(
    (z) => zoneLayouts[z].visible === false,
  );
  if (hidden.length === 0) return null;
  return (
    <div className="bp-zone-add-bar" role="group" aria-label="Add a removed frame">
      {hidden.map((z) => {
        const meta = FRAME_META[z];
        return (
          <button
            key={z}
            type="button"
            className="bp-zone-add-chip"
            onClick={() => setZoneVisible(z, true)}
            title={`Add ${meta.label.toLowerCase()}`}
          >
            <span className="material-symbols-outlined" aria-hidden="true">add</span>
            <span>{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Dashboard Header - sticky top bar inside device frame
   Driven by headerBlocks from store; labels are inline-editable
   ══════════════════════════════════════════════════════════ */
function DashboardHeader({ compact }: { compact: boolean }) {
  const headerBlocks = useBuilder((s) => s.headerBlocks);
  const designSystem = useBuilder((s) => s.designSystem);
  const updateHeaderBlockProps = useBuilder((s) => s.updateHeaderBlockProps);
  const removeBlockFromZone = useBuilder((s) => s.removeBlockFromZone);
  const setSelectedBlock = useBuilder((s) => s.setSelectedBlock);
  const selectedBlockId = useBuilder((s) => s.selectedBlockId);
  const readOnly = usePreviewReadOnly();

  return (
    <header className="bp-header">
      <FrameTab zone="header" />
      <ZoneDropContainer zoneId="header" blocks={headerBlocks} direction="horizontal">
        {headerBlocks.map((block) => {
          /* Native zone types get custom rendering */
          if (block.type === "AppBrand") {
            return (
              <SortableBlock
                key={block.id}
                id={block.id}
                zone="header"
                compact
                isSelected={selectedBlockId === block.id}
                onRemove={() => { removeBlockFromZone("header", block.id); showToast("Block deleted", { icon: "delete", durationMs: 4000, action: { label: "Undo", onClick: canvasUndo } }); }}
              >
                <div
                  className="bp-header-brand"
                  onClick={readOnly ? undefined : (e) => { e.stopPropagation(); setSelectedBlock(block.id, "header"); }}
                >
                  <div className="bp-logo-mark">
                    <Bot size={compact ? 14 : 16} strokeWidth={2.4} />
                  </div>
                  {!compact && (
                    <span
                      className="bp-logo-text bp-zone-editable"
                      contentEditable={!readOnly}
                      suppressContentEditableWarning
                      onBlur={(e) =>
                        updateHeaderBlockProps(block.id, { label: e.currentTarget.textContent ?? "" })
                      }
                    >
                      {block.props.label as string}
                    </span>
                  )}
                </div>
              </SortableBlock>
            );
          }
          if (block.type === "StatusPill") {
            return (
              <SortableBlock
                key={block.id}
                id={block.id}
                zone="header"
                compact
                isSelected={selectedBlockId === block.id}
                onRemove={() => { removeBlockFromZone("header", block.id); showToast("Block deleted", { icon: "delete", durationMs: 4000, action: { label: "Undo", onClick: canvasUndo } }); }}
              >
                <div
                  className="bp-status-pill"
                  onClick={readOnly ? undefined : (e) => { e.stopPropagation(); setSelectedBlock(block.id, "header"); }}
                >
                  <span className="bp-status-dot" />
                  <span
                    className="bp-status-label bp-zone-editable"
                    contentEditable={!readOnly}
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      updateHeaderBlockProps(block.id, { label: e.currentTarget.textContent ?? "" })
                    }
                  >
                    {block.props.label as string}
                  </span>
                </div>
              </SortableBlock>
            );
          }
          /* Any other component type dropped into header */
          return (
            <SortableBlock
              key={block.id}
              id={block.id}
              zone="header"
              compact
              isSelected={selectedBlockId === block.id}
              onRemove={() => { removeBlockFromZone("header", block.id); showToast("Block deleted", { icon: "delete", durationMs: 4000, action: { label: "Undo", onClick: canvasUndo } }); }}
            >
              <div onClick={readOnly ? undefined : (e) => { e.stopPropagation(); setSelectedBlock(block.id, "header"); }}>
                <ComponentRenderer type={block.type} system={designSystem} blockId={block.id} {...block.props} />
              </div>
            </SortableBlock>
          );
        })}
      </ZoneDropContainer>
    </header>
  );
}

/* ══════════════════════════════════════════════════════════
   Dashboard Sidebar Resize Handle - drag to resize the nav sidebar
   ══════════════════════════════════════════════════════════ */
function DashboardSidebarResizeHandle({
  width,
  onWidthChange,
}: {
  width: number;
  onWidthChange: (w: number) => void;
}) {
  const startRef = useRef<{ x: number; startWidth: number } | null>(null);
  const [active, setActive] = useState(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startRef.current = { x: e.clientX, startWidth: width };
    setActive(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [width]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!startRef.current) return;
    const delta = e.clientX - startRef.current.x;
    const newWidth = Math.max(120, Math.min(280, startRef.current.startWidth + delta));
    onWidthChange(newWidth);
  }, [onWidthChange]);

  const handlePointerUp = useCallback(() => {
    startRef.current = null;
    setActive(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  return (
    <div
      className={`bp-sidebar-resize-handle${active ? " is-active" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      title="Drag to resize sidebar"
    />
  );
}

/* ══════════════════════════════════════════════════════════
   Dashboard Sidebar - collapsible nav
   Driven by sidebarBlocks; labels are inline-editable; items can be added/removed
   ══════════════════════════════════════════════════════════ */
function DashboardSidebar({
  collapsed,
  onToggle,
  width = 180,
  onWidthChange,
}: {
  collapsed: boolean;
  onToggle: () => void;
  width?: number;
  onWidthChange?: (w: number) => void;
}) {
  const sidebarBlocks = useBuilder((s) => s.sidebarBlocks);
  const designSystem = useBuilder((s) => s.designSystem);
  const updateSidebarBlockProps = useBuilder((s) => s.updateSidebarBlockProps);
  const setSidebarBlocks = useBuilder((s) => s.setSidebarBlocks);
  const removeBlockFromZone = useBuilder((s) => s.removeBlockFromZone);
  const setSelectedBlock = useBuilder((s) => s.setSelectedBlock);
  const selectedBlockId = useBuilder((s) => s.selectedBlockId);
  const openNavPage = useBuilder((s) => s.openNavPage);
  const activePageId = useBuilder((s) => s.activePageId);
  const readOnly = usePreviewReadOnly();

  const handleSetActive = (id: string) => {
    setSidebarBlocks(
      sidebarBlocks.map((b) => ({ ...b, props: { ...b.props, active: b.id === id } }))
    );
  };

  const handleAddNavItem = () => {
    const newBlock: Block = {
      id: `nav-${Date.now()}`,
      type: "NavItem",
      props: { label: "New Item", icon: "chat", active: false },
    };
    setSidebarBlocks([...sidebarBlocks, newBlock]);
  };

  return (
    <motion.aside
      className="bp-sidebar"
      data-collapsed={collapsed ? "true" : undefined}
      animate={{ width: collapsed ? 48 : width }}
      transition={{ type: "spring", stiffness: 340, damping: 32 }}
    >
      {!collapsed && <FrameTab zone="sidebar" />}
      <nav className="bp-sidebar-nav">
        <ZoneDropContainer zoneId="sidebar" blocks={sidebarBlocks} direction="vertical">
          {sidebarBlocks.map((block) => {
            /* Native NavItem rendering */
            if (block.type === "NavItem") {
              const iconKey = block.props.icon as string;
              const Icon = NAV_ICON_MAP[iconKey] ?? MessageSquare;
              /* Once the canvas is split into pages, the active tab follows the
                 active page; before that it uses the cosmetic `active` prop. */
              const active = activePageId != null ? activePageId === block.id : (block.props.active as boolean);
              return (
                <SortableBlock
                  key={block.id}
                  id={block.id}
                  zone="sidebar"
                  isSelected={selectedBlockId === block.id}
                  onRemove={() => { removeBlockFromZone("sidebar", block.id); showToast("Block deleted", { icon: "delete", durationMs: 4000, action: { label: "Undo", onClick: canvasUndo } }); }}
                >
                  <div className="bp-nav-item-row">
                    <button
                      className={`bp-nav-item${active ? " bp-nav-item--active" : ""}`}
                      title={block.props.label as string}
                      aria-current={active ? "page" : undefined}
                      /* Multi-page: a tab click switches the body to that page
                         (creating it empty on first visit) in BOTH modes. In
                         edit it also selects the NavItem for styling; in preview
                         it only navigates. handleSetActive keeps the cosmetic
                         `active` prop in sync so the lazy page-seed can find the
                         active nav. */
                      onClick={(e) => {
                        e.stopPropagation();
                        openNavPage(block.id, String(block.props.label ?? "Page"));
                        handleSetActive(block.id);
                        if (!readOnly) setSelectedBlock(block.id, "sidebar");
                      }}
                    >
                      <Icon size={18} strokeWidth={active ? 2.2 : 1.5} />
                      {/* Plain span — was previously a framer-motion
                         <motion.span> animating width 0→auto, but that
                         left the inline `style` attribute in an
                         inconsistent state for some rows (Events
                         specifically), causing the label to render with
                         a stale wide measurement that shoved the text
                         to the right of the row. The collapsed state
                         is now CSS-only via .bp-nav-item-row.is-collapsed
                         (see builder.css). */}
                      {!collapsed && (
                        <span className="bp-nav-label">
                          <span
                            className="bp-zone-editable"
                            contentEditable={!readOnly}
                            suppressContentEditableWarning
                            onClick={(e) => e.stopPropagation()}
                            onBlur={(e) =>
                              updateSidebarBlockProps(block.id, {
                                label: e.currentTarget.textContent ?? "",
                              })
                            }
                          >
                            {block.props.label as string}
                          </span>
                        </span>
                      )}
                    </button>
                  </div>
                </SortableBlock>
              );
            }
            /* Any other component type dropped into sidebar */
            return (
              <SortableBlock
                key={block.id}
                id={block.id}
                zone="sidebar"
                isSelected={selectedBlockId === block.id}
                onRemove={() => { removeBlockFromZone("sidebar", block.id); showToast("Block deleted", { icon: "delete", durationMs: 4000, action: { label: "Undo", onClick: canvasUndo } }); }}
              >
                <div
                  className="zone-block-sidebar"
                  onClick={readOnly ? undefined : (e) => { e.stopPropagation(); setSelectedBlock(block.id, "sidebar"); }}
                >
                  <ComponentRenderer type={block.type} system={designSystem} blockId={block.id} {...block.props} />
                </div>
              </SortableBlock>
            );
          })}
        </ZoneDropContainer>
        {!collapsed && !readOnly && (
          <button className="bp-nav-add-btn" onClick={handleAddNavItem}>
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>add</span>
            Add item
          </button>
        )}
      </nav>

      <button
        className="bp-sidebar-toggle"
        onClick={onToggle}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        type="button"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </motion.aside>
  );
}

/* ══════════════════════════════════════════════════════════
   Default Chat - shown when canvas has no blocks
   ══════════════════════════════════════════════════════════ */
function DefaultChatArea({ messageKey }: { messageKey: number }) {
  return (
    <div className="bp-chat-area">
      <div className="bp-messages" key={messageKey}>
        {SAMPLE_MESSAGES.map((msg, i) => (
          <motion.div
            key={`${messageKey}-${i}`}
            className={`bp-msg bp-msg--${msg.role}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.25 }}
          >
            {msg.role === "ai" && (
              <div className="bp-msg-avatar">
                <Bot size={14} strokeWidth={2.4} />
              </div>
            )}
            <div className="bp-msg-bubble">{msg.text}</div>
          </motion.div>
        ))}
      </div>
      <div className="bp-chat-input">
        <input type="text" placeholder="Ask the AI agent\u2026" readOnly className="bp-chat-field" />
        <button className="bp-chat-send">
          <Send size={14} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Dashboard Footer
   Driven by footerBlocks; text is inline-editable
   ══════════════════════════════════════════════════════════ */
function DashboardFooter() {
  const footerBlocks = useBuilder((s) => s.footerBlocks);
  const designSystem = useBuilder((s) => s.designSystem);
  const updateFooterBlockProps = useBuilder((s) => s.updateFooterBlockProps);
  const removeBlockFromZone = useBuilder((s) => s.removeBlockFromZone);
  const setSelectedBlock = useBuilder((s) => s.setSelectedBlock);
  const selectedBlockId = useBuilder((s) => s.selectedBlockId);
  const readOnly = usePreviewReadOnly();

  return (
    <footer className="bp-footer">
      <FrameTab zone="footer" />
      <ZoneDropContainer zoneId="footer" blocks={footerBlocks} direction="horizontal">
        {footerBlocks.map((block) => {
          /* Native FooterText rendering */
          if (block.type === "FooterText") {
            return (
              <SortableBlock
                key={block.id}
                id={block.id}
                zone="footer"
                compact
                isSelected={selectedBlockId === block.id}
                onRemove={() => { removeBlockFromZone("footer", block.id); showToast("Block deleted", { icon: "delete", durationMs: 4000, action: { label: "Undo", onClick: canvasUndo } }); }}
              >
                <div onClick={readOnly ? undefined : (e) => { e.stopPropagation(); setSelectedBlock(block.id, "footer"); }}>
                  <span
                    className="bp-zone-editable"
                    contentEditable={!readOnly}
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      updateFooterBlockProps(block.id, { label: e.currentTarget.textContent ?? "" })
                    }
                  >
                    {block.props.label as string}
                  </span>
                  <span className="bp-footer-sep">&middot;</span>
                  <span
                    className="bp-zone-editable"
                    contentEditable={!readOnly}
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      updateFooterBlockProps(block.id, { version: e.currentTarget.textContent ?? "" })
                    }
                  >
                    {block.props.version as string}
                  </span>
                </div>
              </SortableBlock>
            );
          }
          /* Any other component type dropped into footer */
          return (
            <SortableBlock
              key={block.id}
              id={block.id}
              zone="footer"
              compact
              isSelected={selectedBlockId === block.id}
              onRemove={() => { removeBlockFromZone("footer", block.id); showToast("Block deleted", { icon: "delete", durationMs: 4000, action: { label: "Undo", onClick: canvasUndo } }); }}
            >
              <div onClick={readOnly ? undefined : (e) => { e.stopPropagation(); setSelectedBlock(block.id, "footer"); }}>
                <ComponentRenderer type={block.type} system={designSystem} blockId={block.id} {...block.props} />
              </div>
            </SortableBlock>
          );
        })}
      </ZoneDropContainer>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════════
   DeviceFrame - animated viewport frame around the dashboard.
   ══════════════════════════════════════════════════════════
   Extracted from PreviewSidePanel's inline motion.div so the
   exact same frame can be reused by the full-stage Present mode
   (PresentStage). Width/height come from the active device
   preset; desktop is fluid (100%), tablet/mobile are fixed.

   The spring is now wrapped in useReducedMotion — when a user
   prefers reduced motion the width/height changes apply
   instantly (duration 0) instead of springing. No guard existed
   on the inline version; this is an additive a11y improvement. */
export function DeviceFrame({ children }: { children: React.ReactNode }) {
  const deviceMode = useBuilder((s) => s.deviceMode);
  const reduceMotion = useReducedMotion();
  const preset = PRESETS[deviceMode];
  const frameWidth = deviceMode === "desktop" ? "100%" : preset.width;
  return (
    <motion.div
      className="bp-device-frame"
      animate={{ width: frameWidth, maxHeight: preset.height }}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28 }}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   BuilderCanvas - the single dashboard render path.
   ══════════════════════════════════════════════════════════
   ONE source of truth for the canvas, consumed by three shells:
   PreviewSidePanel (in-app, framed + responsive), StandalonePreview
   (?preview=1 pop-out, plain), and PresentStage (full-stage Present
   mode, framed + responsive). Previously this JSX was duplicated
   inline in PreviewSidePanel and StandalonePreview with no reuse
   seam — the root cause the rethink set out to fix.

   Read-only is NOT a prop here: it flows via PreviewReadOnlyContext
   (provided by the CanvasDndProvider each shell wraps this in), so
   the same tree is honest-read-only or editable purely by context.

   Flags map the genuine differences between the existing call sites:
     - framed             wrap in DeviceFrame (+ Compare swaps the
                          whole frame for CompareView). Side panel +
                          Present: true. Standalone: false.
     - responsive         compact header + hide sidebar on mobile.
                          Side panel + Present: true. Standalone: false
                          (always desktop layout, like the pop-out today).
     - resizableSidebar   sidebar width control + drag handle. Side
                          panel + Present: true. Standalone: false.
     - allowEmptyState    show the demo chat when there's no content.
                          Side panel + Present: true. Standalone: false. */
interface BuilderCanvasProps {
  framed?: boolean;
  responsive?: boolean;
  resizableSidebar?: boolean;
  allowEmptyState?: boolean;
}

export function BuilderCanvas({
  framed = false,
  responsive = false,
  resizableSidebar = false,
  allowEmptyState = false,
}: BuilderCanvasProps) {
  const designSystem = useBuilder((s) => s.designSystem);
  const density = useBuilder((s) => s.density);
  const previewKey = useBuilder((s) => s.previewKey);
  const canvasViewMode = useBuilder((s) => s.canvasViewMode);
  const blocks = useBuilder((s) => s.blocks);
  const messages = useBuilder((s) => s.messages);
  const selectedBlockId = useBuilder((s) => s.selectedBlockId);
  const deviceMode = useBuilder((s) => s.deviceMode);
  const compareMode = useBuilder((s) => s.compareMode);
  const mode = useBuilder((s) => s.mode);
  const themeKey = useBuilder((s) => s.themeKey);

  /* Official-token scope wiring (#9 PR-2a): for Salt/Carbon, add the
     `.salt-theme`[data-mode] / `[data-cds-theme]` scope so the official
     `--salt-*` / `--cds-*` vars resolve on the preview wrapper and the
     `.preview-<ds>` bridge in builder.css reads genuine DS token values.
     No-op for M3/Fluent/uoaui (still facsimile). */
  const officialScope = getPreviewOfficialScope(
    designSystem as SystemId,
    mode === "light" ? "light" : "dark",
    themeKey,
  );

  const isMobile = deviceMode === "mobile";
  const isCodeView = canvasViewMode === "code";
  /* Same content gate as the old inline call sites: real blocks or a
     live selection or an AI message — not the seeded zone blocks. */
  const hasContent =
    messages.some((m) => m.role === "ai") ||
    blocks.length > 0 ||
    selectedBlockId !== null;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  /* PR3: the sidebar (left panel) width persists via zoneLayouts.sidebar.size
     (a TRACKED_KEY) instead of ephemeral local state, so a resize survives
     reload + sessions instead of snapping back to 180. */
  const dashSidebarWidth = useBuilder((s) => s.zoneLayouts.sidebar.size ?? 180);
  const setZoneLayoutFn = useBuilder((s) => s.setZoneLayout);
  const setDashSidebarWidth = useCallback((w: number) => setZoneLayoutFn("sidebar", { size: w }), [setZoneLayoutFn]);
  const handleSidebarToggle = useCallback(() => setSidebarCollapsed((v) => !v), []);
  /* Full-width support: a template/layout with no sidebar blocks (landing,
     ecommerce, blog, portfolio — top-nav marketing pages) should render
     full-width, not show an empty rail. Dropping a sidebar block from the
     library re-populates sidebarBlocks and the rail returns. */
  const sidebarBlockCount = useBuilder((s) => s.sidebarBlocks.length);

  /* Zone customization (PR2): per-zone visibility. Undefined defaults to
     visible. Removing a zone hides it but keeps its blocks (re-adding via
     the Panels menu restores them). Body is always shown. */
  const headerVisible = useBuilder((s) => s.zoneLayouts.header.visible !== false);
  const sidebarVisible = useBuilder((s) => s.zoneLayouts.sidebar.visible !== false);
  const footerVisible = useBuilder((s) => s.zoneLayouts.footer.visible !== false);

  /* Responsive shells compact the header + drop the sidebar on the
     mobile device; the standalone pop-out stays full desktop layout.
     Also hidden when there are no sidebar blocks (full-width layouts). */
  const compact = responsive && isMobile;
  const showSidebar = sidebarVisible && !(responsive && isMobile) && sidebarBlockCount > 0;

  const dashboard = isCodeView ? (
    <CodeViewer blocks={blocks} />
  ) : (
    <div
      className={`bp-dashboard preview-${designSystem} density-${density}${officialScope.className ? ` ${officialScope.className}` : ""}`}
      key={previewKey}
      {...officialScope.attrs}
    >
      <ZoneAddBar />
      {headerVisible && <DashboardHeader compact={compact} />}

      <div className="bp-body">
        {showSidebar && (
          <DashboardSidebar
            collapsed={sidebarCollapsed}
            onToggle={handleSidebarToggle}
            width={resizableSidebar ? dashSidebarWidth : undefined}
            onWidthChange={resizableSidebar ? setDashSidebarWidth : undefined}
          />
        )}

        {/* Resize handle only when the sidebar is resizable + open. The
            handle is also CSS-hidden under [data-builder-mode="preview"],
            so it never shows in Present mode regardless of this flag. */}
        {resizableSidebar && showSidebar && !sidebarCollapsed && (
          <DashboardSidebarResizeHandle
            width={dashSidebarWidth}
            onWidthChange={setDashSidebarWidth}
          />
        )}

        <main className="bp-main">
          {allowEmptyState && !hasContent ? (
            <DefaultChatArea messageKey={previewKey} />
          ) : (
            <PreviewCanvas />
          )}
        </main>
      </div>

      {footerVisible && <DashboardFooter />}
    </div>
  );

  if (!framed) return dashboard;
  /* Framed shells: Compare mode swaps the entire device frame for the
     four-up CompareView (unchanged behaviour from the side panel). */
  return compareMode ? <CompareView /> : <DeviceFrame>{dashboard}</DeviceFrame>;
}

/* ══════════════════════════════════════════════════════════
   Preview Toolbar - DS switcher + density + canvas actions
   Consolidated: removed redundant Add button, repositioned
   code toggle next to primary builder controls.
   ══════════════════════════════════════════════════════════ */
/* PreviewToolbar removed in Phase F.2 - its contents were merged
   into the new single-row PreviewBar above. Both call sites now
   render <PreviewBar /> once. */

/* ══════════════════════════════════════════════════════════
   CanvasDndProvider - shared DnD context wrapping both the
   canvas (drop target) and the ComponentLibrary (drag source)
   so drag-and-drop works across the layout boundary.
   ══════════════════════════════════════════════════════════ */
/* ── Helper: resolve which zone an "over" target belongs to ── */
function resolveZone(overId: string | number, overData: Record<string, unknown> | undefined): ZoneId | null {
  if (overData?.zone) return overData.zone as ZoneId;
  const id = String(overId);
  if (id.startsWith("zone-")) return id.replace("zone-", "") as ZoneId;
  return null;
}

/* ── Helper: resolve which LayoutGroup id (if any) an "over" target
     belongs to. Returns the group id when the drop target is either
     the group's droppable zone (`group-<id>`) OR a sortable child of
     that group (its data payload carries `parentGroupId`). */
function resolveGroupId(overId: string | number, overData: Record<string, unknown> | undefined): string | null {
  if (overData?.parentGroupId) return overData.parentGroupId as string;
  const id = String(overId);
  if (id.startsWith("group-")) return id.replace("group-", "");
  return null;
}

/* ── Custom collision detection: pointerWithin → closestCenter fallback ── */
const multiZoneCollision: CollisionDetection = (args) => {
  const pw = pointerWithin(args);
  if (pw.length > 0) return pw;
  return closestCenter(args);
};

export function CanvasDndProvider({ children, readOnly = false }: { children: React.ReactNode; readOnly?: boolean }) {
  const blocks = useBuilder((s) => s.blocks);
  const headerBlocks = useBuilder((s) => s.headerBlocks);
  const sidebarBlocks = useBuilder((s) => s.sidebarBlocks);
  const footerBlocks = useBuilder((s) => s.footerBlocks);
  const setBlocks = useBuilder((s) => s.setBlocks);
  const setSelectedComponents = useBuilder((s) => s.setSelectedComponents);
  const setSelectedBlock = useBuilder((s) => s.setSelectedBlock);
  const setZoneBlocks = useBuilder((s) => s.setZoneBlocks);
  const addBlockToZone = useBuilder((s) => s.addBlockToZone);
  const moveBlockBetweenZones = useBuilder((s) => s.moveBlockBetweenZones);
  /* Group mutations - MVP for nested LayoutGroup blocks. */
  const addBlockToGroup = useBuilder((s) => s.addBlockToGroup);
  const moveBlockIntoGroup = useBuilder((s) => s.moveBlockIntoGroup);
  const removeBlockFromGroup = useBuilder((s) => s.removeBlockFromGroup);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  /* Track the dragged item's current zone/group + original position
     for cancel recovery. `parentGroupId` is non-null when the drag
     originated from inside a LayoutGroup's children array. */
  const activeItemRef = useRef<{
    id: string;
    zone: ZoneId;
    originalZone: ZoneId;
    originalIndex: number;
    parentGroupId?: string;
  } | null>(null);

  /* ── DnD sensors ── */
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 10 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  });
  const sensors = useSensors(
    mouseSensor,
    touchSensor,
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /* ── Helper: get zone blocks array by zone ID ── */
  const getZoneArr = useCallback((zone: ZoneId): Block[] => {
    switch (zone) {
      case "body": return blocks;
      case "header": return headerBlocks;
      case "sidebar": return sidebarBlocks;
      case "footer": return footerBlocks;
    }
  }, [blocks, headerBlocks, sidebarBlocks, footerBlocks]);

  /* ── Find which zone a block ID lives in ── */
  const findBlockZone = useCallback((blockId: string): ZoneId | null => {
    if (blocks.some((b) => b.id === blockId)) return "body";
    if (headerBlocks.some((b) => b.id === blockId)) return "header";
    if (sidebarBlocks.some((b) => b.id === blockId)) return "sidebar";
    if (footerBlocks.some((b) => b.id === blockId)) return "footer";
    return null;
  }, [blocks, headerBlocks, sidebarBlocks, footerBlocks]);

  /* ── Body-only sync for selectedComponents ── */
  const syncBodyToStore = useCallback(
    (updated: Block[]) => {
      setBlocks(updated);
      const ids = updated
        .map((b) => BLOCK_TO_ID[b.type])
        .filter(Boolean) as string[];
      setSelectedComponents(ids);
    },
    [setBlocks, setSelectedComponents]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = String(event.active.id);
    setActiveDragId(id);

    /* If dragging an existing block, record its zone + index */
    if (!event.active.data.current?.fromLibrary) {
      const parentGroupId = event.active.data.current?.parentGroupId as string | undefined;
      if (parentGroupId) {
        /* Dragging a child of a LayoutGroup. The zone field is kept
           as "body" for cancel recovery since body is where the group
           lives; originalIndex is the child's index within the group. */
        const state = useBuilder.getState();
        const group =
          state.blocks.find((b) => b.id === parentGroupId) ||
          state.headerBlocks.find((b) => b.id === parentGroupId) ||
          state.sidebarBlocks.find((b) => b.id === parentGroupId) ||
          state.footerBlocks.find((b) => b.id === parentGroupId);
        const idx = group?.children?.findIndex((c) => c.id === id) ?? -1;
        activeItemRef.current = {
          id,
          zone: "body",
          originalZone: "body",
          originalIndex: idx,
          parentGroupId,
        };
        return;
      }
      const zone = (event.active.data.current?.zone as ZoneId) || findBlockZone(id);
      if (zone) {
        const arr = getZoneArr(zone);
        const idx = arr.findIndex((b) => b.id === id);
        activeItemRef.current = { id, zone, originalZone: zone, originalIndex: idx };
      }
    }
  }, [findBlockZone, getZoneArr]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.data.current?.fromLibrary) return;

    const activeInfo = activeItemRef.current;
    if (!activeInfo) return;

    /* Drags originating inside a LayoutGroup are MVP-locked to
       add/reorder/ungroup. Skip cross-zone transfers entirely
       while the source lives inside a group. */
    if (activeInfo.parentGroupId) return;

    /* Drags whose pointer is over a group (or a child of one) are
       committed on dragEnd via moveBlockIntoGroup, not on hover.
       Skipping here avoids oscillating between zone.add and
       group.add during pointer movement. */
    const overData = over.data.current as Record<string, unknown> | undefined;
    if (resolveGroupId(over.id, overData)) return;

    const sourceZone = activeInfo.zone;
    const targetZone = resolveZone(over.id, overData);
    if (!targetZone || sourceZone === targetZone) return;

    /* Cross-zone move: find target index */
    const targetArr = getZoneArr(targetZone);
    const overIndex = targetArr.findIndex((b) => b.id === String(over.id));
    const toIndex = overIndex >= 0 ? overIndex : targetArr.length;

    moveBlockBetweenZones(sourceZone, targetZone, activeInfo.id, toIndex);
    activeItemRef.current = { ...activeInfo, zone: targetZone };
  }, [getZoneArr, moveBlockBetweenZones]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;

      /* Case 1: Library blueprint dropped */
      if (active.data.current?.fromLibrary) {
        if (!over) {
          activeItemRef.current = null;
          /* Issue #76: invalid library drop used to fail silently — block
             snapped back with no explanation. Tell the user a zone is
             expected. */
          showToast("Couldn't drop here — try inside a zone on the canvas", { icon: "error" });
          return;
        }

        const { type, defaults } = active.data.current as {
          type: string;
          defaults: Record<string, unknown>;
        };
        const overData = over.data.current as Record<string, unknown> | undefined;

        /* 1a. Drop into a LayoutGroup's interior. MVP rule: groups-in-
           groups are out of scope, so LayoutGroup blueprints fall back
           to body-zone behaviour even when the pointer is over a group. */
        const groupId = resolveGroupId(over.id, overData);
        if (groupId && type !== "LayoutGroup") {
          const newId = makeBlockId();
          const newBlock: Block = { id: newId, type, props: { ...defaults } };
          /* If the hover target is a sortable child, insert just
             before it; otherwise append at end. */
          const state = useBuilder.getState();
          const group =
            state.blocks.find((b) => b.id === groupId) ||
            state.headerBlocks.find((b) => b.id === groupId) ||
            state.sidebarBlocks.find((b) => b.id === groupId) ||
            state.footerBlocks.find((b) => b.id === groupId);
          const kids = group?.children ?? [];
          const overIdx = kids.findIndex((b) => b.id === String(over.id));
          const insertAt = overIdx >= 0 ? overIdx : kids.length;
          addBlockToGroup(groupId, newBlock, insertAt);
          setSelectedBlock(newId, "body");
          activeItemRef.current = null;
          return;
        }

        /* 1b. Drop onto a top-level zone. */
        const targetZone = resolveZone(over.id, overData) || "body";
        const newId = makeBlockId();
        const newBlock: Block = { id: newId, type, props: { ...defaults } };

        const targetArr = getZoneArr(targetZone);
        const overIndex = targetArr.findIndex((b) => b.id === String(over.id));
        const insertAt = overIndex >= 0 ? overIndex : 0;

        addBlockToZone(targetZone, newBlock, insertAt);

        /* Only sync selectedComponents for body drops */
        if (targetZone === "body") {
          const s = useBuilder.getState();
          const ids = s.blocks
            .map((b) => BLOCK_TO_ID[b.type])
            .filter(Boolean) as string[];
          setSelectedComponents(ids);
        }

        setSelectedBlock(newId, targetZone);
        activeItemRef.current = null;
        return;
      }

      const activeInfo = activeItemRef.current;
      const overData = over?.data.current as Record<string, unknown> | undefined;

      /* Issue #94: existing-block drag dropped without a valid target.
         Used to leave the user wondering whether anything happened —
         block snaps back silently. Tell them. */
      if (activeInfo && !over) {
        showToast("Couldn't move here — try a zone in the canvas", { icon: "error" });
        activeItemRef.current = null;
        return;
      }

      /* Case 2: Existing block dragged. Four sub-cases: */

      /* 2a. Source is inside a group - reorder within group only
             (MVP: cross-zone moves from group are out of scope). */
      if (activeInfo?.parentGroupId && over && active.id !== over.id) {
        const srcGroupId = activeInfo.parentGroupId;
        const overGroupId = resolveGroupId(over.id, overData);
        if (overGroupId === srcGroupId) {
          const state = useBuilder.getState();
          const group =
            state.blocks.find((b) => b.id === srcGroupId) ||
            state.headerBlocks.find((b) => b.id === srcGroupId) ||
            state.sidebarBlocks.find((b) => b.id === srcGroupId) ||
            state.footerBlocks.find((b) => b.id === srcGroupId);
          const kids = group?.children ?? [];
          const oldIndex = kids.findIndex((c) => c.id === active.id);
          const newIndex = kids.findIndex((c) => c.id === over.id);
          if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
            /* Remove-then-reinsert gives arrayMove semantics when
               the re-insertion index matches the target index from
               the original array (removal shifts elements before
               splice-in, so this mirrors arr.splice semantics). */
            const moved = kids[oldIndex];
            removeBlockFromGroup(srcGroupId, String(active.id));
            addBlockToGroup(srcGroupId, moved, newIndex);
          }
        }
        activeItemRef.current = null;
        return;
      }

      /* 2b. Source is a top-level block, destination is a group's
             interior - move zone → group. */
      if (over && activeInfo && !activeInfo.parentGroupId) {
        const overGroupId = resolveGroupId(over.id, overData);
        if (overGroupId && active.id !== overGroupId) {
          const state = useBuilder.getState();
          const group =
            state.blocks.find((b) => b.id === overGroupId) ||
            state.headerBlocks.find((b) => b.id === overGroupId) ||
            state.sidebarBlocks.find((b) => b.id === overGroupId) ||
            state.footerBlocks.find((b) => b.id === overGroupId);
          const kids = group?.children ?? [];
          const overIdx = kids.findIndex((b) => b.id === String(over.id));
          const destIndex = overIdx >= 0 ? overIdx : kids.length;
          /* Skip if the moved block is itself a LayoutGroup - no
             groups inside groups (MVP). */
          const arr = getZoneArr(activeInfo.zone);
          const src = arr.find((b) => b.id === activeInfo.id);
          if (src && src.type !== "LayoutGroup") {
            moveBlockIntoGroup(activeInfo.zone, activeInfo.id, overGroupId, destIndex);
            activeItemRef.current = null;
            return;
          }
        }
      }

      /* 2c. Reorder within same zone (existing behaviour). */
      if (over && active.id !== over.id) {
        const zone = activeInfo?.zone || "body";
        const arr = getZoneArr(zone);
        const oldIndex = arr.findIndex((b) => b.id === active.id);
        const newIndex = arr.findIndex((b) => b.id === over.id);

        if (oldIndex >= 0 && newIndex >= 0) {
          const reordered = arrayMove(arr, oldIndex, newIndex);
          if (zone === "body") {
            syncBodyToStore(reordered);
          } else {
            setZoneBlocks(zone, reordered);
          }
        }
      }

      activeItemRef.current = null;
    },
    [
      getZoneArr,
      addBlockToZone,
      addBlockToGroup,
      moveBlockIntoGroup,
      removeBlockFromGroup,
      syncBodyToStore,
      setZoneBlocks,
      setSelectedBlock,
      setSelectedComponents,
    ]
  );

  const handleDragCancel = useCallback(() => {
    const info = activeItemRef.current;
    if (info && info.zone !== info.originalZone) {
      /* Restore block to original zone/index */
      moveBlockBetweenZones(info.zone, info.originalZone, info.id, info.originalIndex);
    }
    setActiveDragId(null);
    activeItemRef.current = null;
  }, [moveBlockBetweenZones]);

  /* ── Resolve drag overlay content ── */
  const activeBlueprintLabel = activeDragId
    ? LIBRARY_BLUEPRINTS.find((bp) => bp.id === activeDragId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={multiZoneCollision}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <PreviewReadOnlyContext.Provider value={readOnly}>
        {children}
      </PreviewReadOnlyContext.Provider>

      {/* Drag overlay - ghost preview while dragging from library */}
      <DragOverlay dropAnimation={null}>
        {activeBlueprintLabel ? (
          <div className="lib-drag-overlay">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {activeBlueprintLabel.icon}
            </span>
            <span>{activeBlueprintLabel.label}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/* ══════════════════════════════════════════════════════════
   PreviewSidePanel - the main exported panel for BuilderApp
   Layout: [ DeviceControls ] [ Toolbar ] [ Viewport | ComponentSidebar ]
   DndContext wraps both the viewport and the right sidebar
   so dragging from the library onto the canvas works.
   ══════════════════════════════════════════════════════════ */
export function PreviewSidePanel() {
  const previewOpen = useBuilder((s) => s.previewOpen);
  const componentLibraryOpen = useBuilder((s) => s.componentLibraryOpen);
  /* Preview mode → render the canvas read-only (suppress inline edit, +Add,
     selection-driven editing) while keeping the product's own hover/focus.
     The canvas itself now lives in <BuilderCanvas> (one shared render path);
     this shell only owns the chat-split panel chrome + component library. */
  const builderMode = usePreviewMode((s) => s.mode);

  /* ── Component library sidebar resize ── */
  const compBodyRef = useRef<HTMLDivElement>(null);
  const [compSidebarWidth, setCompSidebarWidth] = useState(240);
  const isCompDragging = useRef(false);
  const [compDragActive, setCompDragActive] = useState(false);

  useEffect(() => {
    /* rAF-throttle the component-library sidebar resize. Same
       rationale as the chat-split resize in BuilderApp.tsx — coalesce
       per-pointer setState calls into one update per paint frame. */
    let rafId: number | null = null;
    let pendingWidth: number | null = null;
    const flush = () => {
      rafId = null;
      if (pendingWidth !== null) {
        setCompSidebarWidth(pendingWidth);
        pendingWidth = null;
      }
    };
    const schedule = (width: number) => {
      pendingWidth = Math.max(180, Math.min(400, width));
      if (rafId === null) rafId = requestAnimationFrame(flush);
    };

    const onMove = (e: MouseEvent) => {
      if (!isCompDragging.current || !compBodyRef.current) return;
      e.preventDefault();
      const rect = compBodyRef.current.getBoundingClientRect();
      schedule(rect.right - e.clientX);
    };
    const onUp = () => {
      if (isCompDragging.current) {
        isCompDragging.current = false;
        setCompDragActive(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isCompDragging.current || !compBodyRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = compBodyRef.current.getBoundingClientRect();
      schedule(rect.right - touch.clientX);
    };
    const onTouchEnd = () => {
      if (isCompDragging.current) {
        isCompDragging.current = false;
        setCompDragActive(false);
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

  const startCompDrag = () => {
    isCompDragging.current = true;
    setCompDragActive(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <div className={`preview-side ${previewOpen ? "open" : ""}`}>
      {/* Inject DS-specific CSS (Carbon tokens + .cb-* component rules). */}
      <DSPreviewStyles />
      {/* Single consolidated preview toolbar (Phase F.2) */}
      <PreviewBar />

      {/* Main builder area - DndContext wraps viewport + right sidebar */}
      <CanvasDndProvider readOnly={builderMode === "preview"}>
        <div
          className="preview-builder-body"
          ref={compBodyRef}
          style={componentLibraryOpen ? { "--comp-sidebar-width": `${compSidebarWidth}px` } as React.CSSProperties : undefined}
        >
          {/* Center: Viewport — the canvas itself is the shared
              <BuilderCanvas>: framed (device frame + Compare swap),
              responsive (compact/hidden sidebar on mobile), resizable
              sidebar, and empty-state-aware, matching this shell's
              prior inline behaviour exactly. */}
          <div className="bp-viewport-wrapper">
            <BuilderCanvas framed responsive resizableSidebar allowEmptyState />
          </div>

          {/* Resize handle for component library */}
          {componentLibraryOpen && (
            <div
              className={`comp-resize-handle${compDragActive ? " dragging" : ""}`}
              onMouseDown={startCompDrag}
              onTouchStart={startCompDrag}
              aria-hidden="true"
            />
          )}

          {/* Right: Component Library Sidebar */}
          {componentLibraryOpen && (
            <aside className="component-sidebar">
              <ComponentLibrary />
            </aside>
          )}
        </div>
      </CanvasDndProvider>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Standalone Preview - for pop-out window
   ══════════════════════════════════════════════════════════ */
export function StandalonePreview() {
  const designSystem = useBuilder((s) => s.designSystem);
  const mode = useBuilder((s) => s.mode);
  const componentLibraryOpen = useBuilder((s) => s.componentLibraryOpen);

  return (
    <div className={`standalone-preview ${mode === "light" ? "builder-light" : ""}`}>
      {/* Inject DS-specific CSS (Carbon tokens + .cb-* component rules). */}
      <DSPreviewStyles />
      {/* Window chrome bar */}
      <div className="standalone-preview-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <span className="preview-dot" style={{ background: "#ff5f57" }} />
            <span className="preview-dot" style={{ background: "#febc2e" }} />
            <span className="preview-dot" style={{ background: "#28c840" }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--b-fg)" }}>
            Design Hub Preview
          </span>
        </div>
        <span className="preview-badge-inline">
          {designSystem.toUpperCase()} &middot; {mode}
        </span>
      </div>

      {/* Single consolidated preview toolbar (Phase F.2) */}
      <PreviewBar />

      {/* Full dashboard canvas - DndContext wraps viewport + sidebar.
          The ?preview=1 pop-out is ALWAYS read-only (it reads useBuilder, not
          usePreviewMode, so it had no gating before — this is the fix). */}
      <CanvasDndProvider readOnly>
        <div className="preview-builder-body">
          <div className="standalone-preview-canvas">
            {/* Shared canvas, unframed + non-responsive so the pop-out
                keeps its full-desktop layout. Read-only flows from the
                wrapping CanvasDndProvider's context (value=true). */}
            <BuilderCanvas />
          </div>

          {/* Right: Component Library Sidebar in standalone */}
          {componentLibraryOpen && (
            <aside className="component-sidebar">
              <ComponentLibrary />
            </aside>
          )}
        </div>
      </CanvasDndProvider>
    </div>
  );
}
