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
function DeviceControls() {
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

  const dsSystems: { key: "salt" | "m3" | "fluent" | "ausos"; label: string }[] = [
    { key: "salt", label: "Salt DS" },
    { key: "m3", label: "Material 3" },
    { key: "fluent", label: "Fluent 2" },
    { key: "ausos", label: "ausos" },
  ];

  const preset = PRESETS[deviceMode];
  const devices: { key: DeviceMode; Icon: typeof Monitor }[] = [
    { key: "desktop", Icon: Monitor },
    { key: "tablet", Icon: Tablet },
    { key: "mobile", Icon: Smartphone },
  ];

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
  };

  return (
    <div className="bp-controls">
      {/* Chat collapse toggle */}
      <button
        className="preview-toolbar-collapse-btn"
        onClick={toggleChat}
        title={chatOpen ? "Collapse chat" : "Expand chat"}
        aria-label={chatOpen ? "Collapse chat" : "Expand chat"}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          {chatOpen ? "chevron_left" : "chevron_right"}
        </span>
      </button>

      <div className="bp-controls-left">
        {devices.map(({ key, Icon }) => (
          <button
            key={key}
            className={`bp-device-btn${deviceMode === key ? " bp-device-btn--active" : ""}`}
            onClick={() => setDeviceMode(key)}
            title={key.charAt(0).toUpperCase() + key.slice(1)}
          >
            <Icon size={18} strokeWidth={deviceMode === key ? 2.2 : 1.6} />
          </button>
        ))}
      </div>

      {/* DS Switcher - center */}
      <div className="preview-toolbar-group" style={{ flex: 1, justifyContent: "center" }}>
        {dsSystems.map((s) => (
          <button
            key={s.key}
            className={`preview-toolbar-btn${designSystem === s.key ? " preview-toolbar-btn-active" : ""}`}
            onClick={() => setDesignSystem(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <span className="bp-dimensions">{preset.label}</span>

      {/* Light/Dark mode toggle */}
      <button
        className="bp-device-btn"
        onClick={() => setMode(mode === "dark" ? "light" : "dark")}
        title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          {mode === "dark" ? "light_mode" : "dark_mode"}
        </span>
      </button>

      <button className="bp-refresh-btn" onClick={bumpPreview} title="Reset layout">
        <RotateCcw size={15} strokeWidth={2} />
        <span>Refresh</span>
      </button>

      {/* Pop out - opens preview in its own window */}
      <button className="bp-popout-btn" onClick={handlePopOut} title="Pop out preview">
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_new</span>
      </button>
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
function PreviewToolbar() {
  const designSystem = useBuilder((s) => s.designSystem);
  const setDesignSystem = useBuilder((s) => s.setDesignSystem);
  const density = useBuilder((s) => s.density);
  const setDensity = useBuilder((s) => s.setDensity);
  const toggleComponentLibrary = useBuilder((s) => s.toggleComponentLibrary);
  const componentLibraryOpen = useBuilder((s) => s.componentLibraryOpen);
  const canvasViewMode = useBuilder((s) => s.canvasViewMode);
  const toggleCanvasViewMode = useBuilder((s) => s.toggleCanvasViewMode);
  const mode = useBuilder((s) => s.mode);
  const interfaceType = useBuilder((s) => s.interfaceType);
  const selectedComponents = useBuilder((s) => s.selectedComponents);
  const colorOverrides = useBuilder((s) => s.colorOverrides);

  /* handleQuickSave removed: auto-save now persists the canvas to the
     current session on every change (see /lib/useAutoSave). The old
     window.prompt flow and the toolbar Save button are gone. Users
     manage sessions via the left SessionsDrawer instead. */
  const [downloading, setDownloading] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied" | "too-long" | "error">("idle");

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
  };

  const systems: { key: "salt" | "m3" | "fluent" | "ausos"; label: string }[] = [
    { key: "salt", label: "Salt DS" },
    { key: "m3", label: "Material 3" },
    { key: "fluent", label: "Fluent 2" },
    { key: "ausos", label: "ausos" },
  ];

  const modKey = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform) ? "⌘" : "Ctrl";
  const compareMode = useBuilder((s) => s.compareMode);
  const toggleCompareMode = useBuilder((s) => s.toggleCompareMode);

  return (
    <div className="preview-toolbar">
      {/* Undo / Redo */}
      <div className="preview-toolbar-group">
        <button
          className="preview-toolbar-btn"
          onClick={() => canvasUndo()}
          title={`Undo (${modKey}+Z)`}
          aria-label="Undo"
        >
          <span className="material-symbols-outlined preview-toolbar-icon">undo</span>
        </button>
        <button
          className="preview-toolbar-btn"
          onClick={() => canvasRedo()}
          title={`Redo (${modKey}+Shift+Z)`}
          aria-label="Redo"
        >
          <span className="material-symbols-outlined preview-toolbar-icon">redo</span>
        </button>
      </div>

      {/* Compare DS - headline moat feature */}
      <div className="preview-toolbar-group">
        <button
          className={`preview-toolbar-btn preview-toolbar-compare${compareMode ? " preview-toolbar-btn-active" : ""}`}
          onClick={toggleCompareMode}
          title={compareMode ? "Exit compare mode" : "Compare this canvas in all 4 design systems"}
          aria-label="Toggle compare design systems"
          aria-pressed={compareMode}
        >
          <span className="material-symbols-outlined preview-toolbar-icon">compare</span>
          <span className="preview-toolbar-compare-label">Compare</span>
        </button>
      </div>

      {/* Density */}
      <div className="preview-toolbar-group">
        {(designSystem === "salt"
          ? [{ key: "high", label: "High" }, { key: "medium", label: "Medium" }, { key: "low", label: "Low" }]
          : designSystem === "m3"
          ? [{ key: "high", label: "HD" }, { key: "medium", label: "MD" }, { key: "low", label: "LD" }]
          : [{ key: "high", label: "Small" }, { key: "medium", label: "Medium" }, { key: "low", label: "Large" }]
        ).map((d) => (
          <button
            key={d.key}
            className={`preview-toolbar-btn${density === d.key ? " preview-toolbar-btn-active" : ""}`}
            onClick={() => setDensity(d.key)}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Canvas Actions - code toggle, library toggle, download, save */}
      <div className="preview-toolbar-group">
        <button
          className={`preview-toolbar-btn${canvasViewMode === 'code' ? " preview-toolbar-btn-active preview-toolbar-code-active" : ""}`}
          onClick={toggleCanvasViewMode}
          title={canvasViewMode === 'code' ? "Show UI preview" : "Show JSON schema"}
        >
          <span className="preview-toolbar-code-label">&lt;/&gt;</span>
        </button>
        <button
          className={`preview-toolbar-btn${componentLibraryOpen ? " preview-toolbar-btn-active" : ""}`}
          onClick={toggleComponentLibrary}
          title={componentLibraryOpen ? "Hide component library" : "Show component library"}
        >
          <span className="material-symbols-outlined preview-toolbar-icon">category</span>
        </button>
        <button
          className="preview-toolbar-btn"
          onClick={handleShare}
          title={
            shareState === "too-long"
              ? "Canvas too large to share as a link - use Download instead"
              : shareState === "error"
              ? "Clipboard unavailable"
              : "Copy a shareable preview link"
          }
          aria-label="Share preview link"
        >
          <span className="material-symbols-outlined preview-toolbar-icon">
            {shareState === "copied" ? "check" : shareState === "too-long" || shareState === "error" ? "warning" : "share"}
          </span>
        </button>
        <button
          className="preview-toolbar-btn"
          onClick={handleDownload}
          disabled={downloading}
          title="Download config JSON"
        >
          <span className="material-symbols-outlined preview-toolbar-icon">
            {downloading ? "hourglass_top" : "download"}
          </span>
        </button>
        {/* Save button removed - auto-save handles persistence now.
            The top-bar SaveIndicator shows save state. */}
      </div>
    </div>
  );
}

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

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  /* Track the dragged item's current zone + original position for cancel recovery */
  const activeItemRef = useRef<{
    id: string;
    zone: ZoneId;
    originalZone: ZoneId;
    originalIndex: number;
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

    const sourceZone = activeInfo.zone;
    const targetZone = resolveZone(over.id, over.data.current as Record<string, unknown> | undefined);
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

      /* Case 1: Library blueprint dropped onto a zone */
      if (active.data.current?.fromLibrary) {
        if (!over) { activeItemRef.current = null; return; }

        const { type, defaults } = active.data.current as {
          type: string;
          defaults: Record<string, unknown>;
        };
        const targetZone = resolveZone(over.id, over.data.current as Record<string, unknown> | undefined) || "body";
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

      /* Case 2: Reorder within same zone */
      if (over && active.id !== over.id) {
        const activeInfo = activeItemRef.current;
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
    [getZoneArr, addBlockToZone, syncBodyToStore, setZoneBlocks, setSelectedBlock, setSelectedComponents]
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
      {/* Device controls - always visible */}
      <DeviceControls />

      {/* Toolbar - always visible */}
      <PreviewToolbar />

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

      {/* DS / density toolbar */}
      <PreviewToolbar />

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
