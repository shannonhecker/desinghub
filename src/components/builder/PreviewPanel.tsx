"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
  MessageSquare,
  Database,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Bot,
  Send,
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
import { useCloudStorage } from "@/lib/firebase";
import { undo as canvasUndo, redo as canvasRedo } from "@/lib/builderHistory";
import { CompareView } from "./CompareView";
import { buildShareUrl } from "@/lib/shareState";
import { BLOCK_TO_ID } from "@/lib/componentMaps";
import { PreviewCanvas, CodeViewer, makeBlockId } from "./PreviewCanvas";
import { ComponentLibrary } from "./ComponentLibrary";
import { ComponentRenderer } from "./ComponentRenderer";
import { LIBRARY_BLUEPRINTS } from "@/lib/blockRegistry";
import { SortableBlock } from "./SortableBlock";
import { ZoneDropContainer } from "./ZoneDropContainer";

/* ── Viewport presets ── */
const PRESETS: Record<DeviceMode, { width: number; height: number; label: string }> = {
  desktop: { width: 1200, height: 800, label: "1200 \u00d7 800" },
  tablet: { width: 768, height: 1024, label: "768 \u00d7 1024" },
  mobile: { width: 375, height: 812, label: "375 \u00d7 812" },
};

/* ── Icon map for sidebar nav items ── */
const NAV_ICON_MAP: Record<string, typeof MessageSquare> = {
  chat: MessageSquare,
  database: Database,
  settings: Settings,
  bar_chart: BarChart3,
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
   PreviewBar - single consolidated toolbar (Phase F.2)
   Replaces the old two-row DeviceControls + PreviewToolbar.

   Layout (left → right):
     [← Chat]  [↶ ↷]  [🖥 📱 📞]  [Salt · M3 · Fluent · ausos]
     [🌓]  [Compare]  [High · Medium · Low]  [</> Code]  [⋯]

   Rare actions (Refresh, Pop-out, Library toggle, Share,
   Download) moved behind the ⋯ overflow menu. Density labels
   are normalised to High / Medium / Low across all DSes so
   users see a consistent control regardless of which system
   is active.
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
  const canvasViewMode = useBuilder((s) => s.canvasViewMode);
  const toggleCanvasViewMode = useBuilder((s) => s.toggleCanvasViewMode);
  const toggleComponentLibrary = useBuilder((s) => s.toggleComponentLibrary);
  const componentLibraryOpen = useBuilder((s) => s.componentLibraryOpen);
  const compareMode = useBuilder((s) => s.compareMode);
  const toggleCompareMode = useBuilder((s) => s.toggleCompareMode);

  const [overflowOpen, setOverflowOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied" | "too-long" | "error">("idle");

  const overflowRef = useRef<HTMLDivElement | null>(null);

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

  const dsSystems: { key: "salt" | "m3" | "fluent" | "ausos" | "carbon"; label: string }[] = [
    { key: "salt", label: "Salt DS" },
    { key: "m3", label: "Material 3" },
    { key: "fluent", label: "Fluent 2" },
    { key: "ausos", label: "ausos" },
    { key: "carbon", label: "Carbon" },
  ];

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
    const params = new URLSearchParams({
      preview: "1", ds: designSystem, mode, type: interfaceType,
      components: selectedComponents.join(","),
    });
    window.open(
      `${window.location.origin}${basePath}/builder?${params}`,
      "design-hub-preview", "width=900,height=700"
    );
    setOverflowOpen(false);
  };

  const handleShare = async () => {
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

      <span className="preview-bar-sep" aria-hidden="true" />

      {/* Device toggle */}
      <div className="preview-bar-group">
        {devices.map(({ key, Icon, label }) => (
          <button
            key={key}
            className={`preview-bar-btn preview-bar-btn-icon${deviceMode === key ? " preview-bar-btn-active" : ""}`}
            onClick={() => setDeviceMode(key)}
            title={`${label} (${preset.label})`}
            aria-label={`${label} viewport`}
            aria-pressed={deviceMode === key}
          >
            <Icon size={16} strokeWidth={deviceMode === key ? 2.2 : 1.6} />
          </button>
        ))}
      </div>

      <span className="preview-bar-sep" aria-hidden="true" />

      {/* DS Switcher - center, labels visible */}
      <div className="preview-bar-group preview-bar-group-ds" role="group" aria-label="Design system">
        {dsSystems.map((s) => (
          <button
            key={s.key}
            className={`preview-bar-btn preview-bar-btn-ds${designSystem === s.key ? " preview-bar-btn-active" : ""}`}
            onClick={() => setDesignSystem(s.key)}
            title={`Switch canvas to ${s.label}`}
            aria-label={`Switch to ${s.label}`}
            aria-pressed={designSystem === s.key}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Spacer pushes remaining controls to the right on wide viewports */}
      <span className="preview-bar-spacer" aria-hidden="true" />

      {/* Theme toggle - moved from Bar 1 so it lives with canvas controls */}
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

      <span className="preview-bar-sep" aria-hidden="true" />

      {/* Compare DS - headline moat feature */}
      <button
        className={`preview-bar-btn preview-bar-btn-pill${compareMode ? " preview-bar-btn-active" : ""}`}
        onClick={toggleCompareMode}
        title={compareMode ? "Exit compare mode" : "Compare this canvas in all 4 design systems"}
        aria-label="Toggle compare design systems"
        aria-pressed={compareMode}
      >
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 14, marginRight: 4 }}>compare</span>
        Compare
      </button>

      <span className="preview-bar-sep" aria-hidden="true" />

      {/* Density - normalised labels across DSes */}
      <div className="preview-bar-group preview-bar-group-density" role="group" aria-label="Canvas density">
        {densityOptions.map((d) => (
          <button
            key={d.key}
            className={`preview-bar-btn preview-bar-btn-density${density === d.key ? " preview-bar-btn-active" : ""}`}
            onClick={() => setDensity(d.key)}
            title={`${d.label} density · ${d.hint}`}
            aria-label={`${d.label} density`}
            aria-pressed={density === d.key}
          >
            {d.label}
          </button>
        ))}
      </div>

      <span className="preview-bar-sep" aria-hidden="true" />

      {/* Code view toggle - prominent per user spec */}
      <button
        className={`preview-bar-btn preview-bar-btn-pill${canvasViewMode === "code" ? " preview-bar-btn-active" : ""}`}
        onClick={toggleCanvasViewMode}
        title={canvasViewMode === "code" ? "Show UI preview" : "Show JSON schema"}
        aria-label={canvasViewMode === "code" ? "Show UI preview" : "Show code view"}
        aria-pressed={canvasViewMode === "code"}
      >
        <span className="preview-bar-code-glyph" aria-hidden="true">&lt;/&gt;</span>
        <span className="preview-bar-btn-label">Code</span>
      </button>

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

  return (
    <header className="bp-header">
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
                onRemove={() => removeBlockFromZone("header", block.id)}
              >
                <div
                  className="bp-header-brand"
                  onClick={(e) => { e.stopPropagation(); setSelectedBlock(block.id, "header"); }}
                >
                  <div className="bp-logo-mark">
                    <Bot size={compact ? 14 : 16} strokeWidth={2.4} />
                  </div>
                  {!compact && (
                    <span
                      className="bp-logo-text bp-zone-editable"
                      contentEditable
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
                onRemove={() => removeBlockFromZone("header", block.id)}
              >
                <div
                  className="bp-status-pill"
                  onClick={(e) => { e.stopPropagation(); setSelectedBlock(block.id, "header"); }}
                >
                  <span className="bp-status-dot" />
                  <span
                    className="bp-status-label bp-zone-editable"
                    contentEditable
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
              onRemove={() => removeBlockFromZone("header", block.id)}
            >
              <div onClick={(e) => { e.stopPropagation(); setSelectedBlock(block.id, "header"); }}>
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
      animate={{ width: collapsed ? 48 : width }}
      transition={{ type: "spring", stiffness: 340, damping: 32 }}
    >
      <nav className="bp-sidebar-nav">
        <ZoneDropContainer zoneId="sidebar" blocks={sidebarBlocks} direction="vertical">
          {sidebarBlocks.map((block) => {
            /* Native NavItem rendering */
            if (block.type === "NavItem") {
              const iconKey = block.props.icon as string;
              const Icon = NAV_ICON_MAP[iconKey] ?? MessageSquare;
              const active = block.props.active as boolean;
              return (
                <SortableBlock
                  key={block.id}
                  id={block.id}
                  zone="sidebar"
                  isSelected={selectedBlockId === block.id}
                  onRemove={() => removeBlockFromZone("sidebar", block.id)}
                >
                  <div className="bp-nav-item-row">
                    <button
                      className={`bp-nav-item${active ? " bp-nav-item--active" : ""}`}
                      title={block.props.label as string}
                      onClick={(e) => { e.stopPropagation(); handleSetActive(block.id); setSelectedBlock(block.id, "sidebar"); }}
                    >
                      <Icon size={18} strokeWidth={active ? 2.2 : 1.5} />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            className="bp-nav-label"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <span
                              className="bp-zone-editable"
                              contentEditable
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
                          </motion.span>
                        )}
                      </AnimatePresence>
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
                onRemove={() => removeBlockFromZone("sidebar", block.id)}
              >
                <div
                  className="zone-block-sidebar"
                  onClick={(e) => { e.stopPropagation(); setSelectedBlock(block.id, "sidebar"); }}
                >
                  <ComponentRenderer type={block.type} system={designSystem} blockId={block.id} {...block.props} />
                </div>
              </SortableBlock>
            );
          })}
        </ZoneDropContainer>
        {!collapsed && (
          <button className="bp-nav-add-btn" onClick={handleAddNavItem}>
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>add</span>
            Add item
          </button>
        )}
      </nav>

      <button className="bp-sidebar-toggle" onClick={onToggle} title="Toggle sidebar">
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

  return (
    <footer className="bp-footer">
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
                onRemove={() => removeBlockFromZone("footer", block.id)}
              >
                <div onClick={(e) => { e.stopPropagation(); setSelectedBlock(block.id, "footer"); }}>
                  <span
                    className="bp-zone-editable"
                    contentEditable
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
                    contentEditable
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
              onRemove={() => removeBlockFromZone("footer", block.id)}
            >
              <div onClick={(e) => { e.stopPropagation(); setSelectedBlock(block.id, "footer"); }}>
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

function CanvasDndProvider({ children }: { children: React.ReactNode }) {
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
        if (!over) { activeItemRef.current = null; return; }

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
      {children}

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
  const previewKey = useBuilder((s) => s.previewKey);
  const deviceMode = useBuilder((s) => s.deviceMode);
  const messages = useBuilder((s) => s.messages);
  const designSystem = useBuilder((s) => s.designSystem);
  const density = useBuilder((s) => s.density);
  const componentLibraryOpen = useBuilder((s) => s.componentLibraryOpen);
  const canvasViewMode = useBuilder((s) => s.canvasViewMode);
  const blocks = useBuilder((s) => s.blocks);
  const compareMode = useBuilder((s) => s.compareMode);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const hasContent = messages.some((m) => m.role === "ai");
  const isMobile = deviceMode === "mobile";
  const preset = PRESETS[deviceMode];
  const frameWidth = deviceMode === "desktop" ? "100%" : preset.width;
  const isCodeView = canvasViewMode === "code";

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed((v) => !v);
  }, []);

  /* ── Component library sidebar resize ── */
  const compBodyRef = useRef<HTMLDivElement>(null);
  const [compSidebarWidth, setCompSidebarWidth] = useState(240);
  const isCompDragging = useRef(false);
  const [compDragActive, setCompDragActive] = useState(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isCompDragging.current || !compBodyRef.current) return;
      e.preventDefault();
      const rect = compBodyRef.current.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
      setCompSidebarWidth(Math.max(180, Math.min(400, newWidth)));
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
      const newWidth = rect.right - touch.clientX;
      setCompSidebarWidth(Math.max(180, Math.min(400, newWidth)));
    };
    const onTouchEnd = () => {
      if (isCompDragging.current) {
        isCompDragging.current = false;
        setCompDragActive(false);
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

  const startCompDrag = () => {
    isCompDragging.current = true;
    setCompDragActive(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  /* ── Dashboard sidebar resize ── */
  const [dashSidebarWidth, setDashSidebarWidth] = useState(180);

  return (
    <div className={`preview-side ${previewOpen ? "open" : ""}`}>
      {/* Single consolidated preview toolbar (Phase F.2) */}
      <PreviewBar />

      {/* Main builder area - DndContext wraps viewport + right sidebar */}
      <CanvasDndProvider>
        <div
          className="preview-builder-body"
          ref={compBodyRef}
          style={componentLibraryOpen ? { "--comp-sidebar-width": `${compSidebarWidth}px` } as React.CSSProperties : undefined}
        >
          {/* Center: Viewport */}
          <div className="bp-viewport-wrapper">
            {compareMode ? (
              /* Compare DS mode - 2x2 grid covering the full viewport */
              <CompareView />
            ) : (
              /* Device Frame - animated width */
              <motion.div
                className="bp-device-frame"
                animate={{ width: frameWidth, maxHeight: preset.height }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
              >
                {/* Code view - covers the entire dashboard area */}
                {isCodeView ? (
                  <CodeViewer blocks={blocks} />
                ) : (
                  /* SaaS Dashboard layout - scoped to the selected design system */
                  <div className={`bp-dashboard preview-${designSystem} density-${density}`} key={previewKey}>
                    <DashboardHeader compact={isMobile} />

                    <div className="bp-body">
                      {!isMobile && (
                        <DashboardSidebar
                          collapsed={sidebarCollapsed}
                          onToggle={handleSidebarToggle}
                          width={dashSidebarWidth}
                          onWidthChange={setDashSidebarWidth}
                        />
                      )}

                      {/* Resize handle for dashboard sidebar */}
                      {!isMobile && !sidebarCollapsed && (
                        <DashboardSidebarResizeHandle
                          width={dashSidebarWidth}
                          onWidthChange={setDashSidebarWidth}
                        />
                      )}

                      <main className="bp-main">
                        {hasContent ? (
                          <PreviewCanvas />
                        ) : (
                          <DefaultChatArea messageKey={previewKey} />
                        )}
                      </main>
                    </div>

                    <DashboardFooter />
                  </div>
                )}
              </motion.div>
            )}
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
  const density = useBuilder((s) => s.density);
  const mode = useBuilder((s) => s.mode);
  const messages = useBuilder((s) => s.messages);
  const previewKey = useBuilder((s) => s.previewKey);
  const componentLibraryOpen = useBuilder((s) => s.componentLibraryOpen);
  const canvasViewMode = useBuilder((s) => s.canvasViewMode);
  const blocks = useBuilder((s) => s.blocks);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const hasContent = messages.some((m) => m.role === "ai");
  const isCodeView = canvasViewMode === "code";

  return (
    <div className={`standalone-preview ${mode === "light" ? "builder-light" : ""}`}>
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

      {/* Full dashboard canvas - DndContext wraps viewport + sidebar */}
      <CanvasDndProvider>
        <div className="preview-builder-body">
          <div className="standalone-preview-canvas">
            {isCodeView ? (
              <CodeViewer blocks={blocks} />
            ) : (
            <div className={`bp-dashboard preview-${designSystem} density-${density}`} key={previewKey}>
              <DashboardHeader compact={false} />
              <div className="bp-body">
                <DashboardSidebar
                  collapsed={sidebarCollapsed}
                  onToggle={() => setSidebarCollapsed((v) => !v)}
                />
                <main className="bp-main">
                  <PreviewCanvas />
                </main>
              </div>
              <DashboardFooter />
            </div>
            )}
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
