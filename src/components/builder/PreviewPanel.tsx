"use client";

import React, { useState, useCallback } from "react";
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
import { useBuilder, type DeviceMode, type Block } from "@/store/useBuilder";
import { useCloudStorage } from "@/lib/firebase";
import { PreviewCanvas } from "./PreviewCanvas";

/* ── Viewport presets ── */
const PRESETS: Record<DeviceMode, { width: number; height: number; label: string }> = {
  desktop: { width: 1200, height: 800, label: "1200 × 800" },
  tablet: { width: 768, height: 1024, label: "768 × 1024" },
  mobile: { width: 375, height: 812, label: "375 × 812" },
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
  { role: "user" as const, text: "Summarize yesterday's sales data" },
  { role: "ai" as const, text: "Yesterday's total revenue was $14,280 across 142 orders. Top category: Electronics (+12% vs. prior day)." },
  { role: "user" as const, text: "Show me a breakdown by region" },
];

/* ══════════════════════════════════════════════════════════
   Device Controls — top bar with Desktop / Tablet / Mobile
   ══════════════════════════════════════════════════════════ */
function DeviceControls() {
  const deviceMode = useBuilder((s) => s.deviceMode);
  const setDeviceMode = useBuilder((s) => s.setDeviceMode);
  const bumpPreview = useBuilder((s) => s.bumpPreview);
  const chatOpen = useBuilder((s) => s.chatOpen);
  const toggleChat = useBuilder((s) => s.toggleChat);
  const designSystem = useBuilder((s) => s.designSystem);
  const mode = useBuilder((s) => s.mode);
  const interfaceType = useBuilder((s) => s.interfaceType);
  const selectedComponents = useBuilder((s) => s.selectedComponents);

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

      <span className="bp-dimensions">{preset.label}</span>

      <button className="bp-refresh-btn" onClick={bumpPreview} title="Reset layout">
        <RotateCcw size={15} strokeWidth={2} />
        <span>Refresh</span>
      </button>

      {/* Pop out — opens preview in its own window */}
      <button className="bp-popout-btn" onClick={handlePopOut} title="Pop out preview">
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_new</span>
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Dashboard Header — sticky top bar inside device frame
   Driven by headerBlocks from store; labels are inline-editable
   ══════════════════════════════════════════════════════════ */
function DashboardHeader({ compact }: { compact: boolean }) {
  const headerBlocks = useBuilder((s) => s.headerBlocks);
  const updateHeaderBlockProps = useBuilder((s) => s.updateHeaderBlockProps);

  return (
    <header className="bp-header">
      {headerBlocks.map((block) => {
        if (block.type === "AppBrand") {
          return (
            <div key={block.id} className="bp-header-brand">
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
          );
        }
        if (block.type === "StatusPill") {
          return (
            <div key={block.id} className="bp-status-pill">
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
          );
        }
        return null;
      })}
    </header>
  );
}

/* ══════════════════════════════════════════════════════════
   Dashboard Sidebar — collapsible nav
   Driven by sidebarBlocks; labels are inline-editable; items can be added/removed
   ══════════════════════════════════════════════════════════ */
function DashboardSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const sidebarBlocks = useBuilder((s) => s.sidebarBlocks);
  const updateSidebarBlockProps = useBuilder((s) => s.updateSidebarBlockProps);
  const setSidebarBlocks = useBuilder((s) => s.setSidebarBlocks);

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

  const handleRemoveNavItem = (id: string) => {
    setSidebarBlocks(sidebarBlocks.filter((b) => b.id !== id));
  };

  return (
    <motion.aside
      className="bp-sidebar"
      animate={{ width: collapsed ? 48 : 180 }}
      transition={{ type: "spring", stiffness: 340, damping: 32 }}
    >
      <nav className="bp-sidebar-nav">
        {sidebarBlocks.map((block) => {
          if (block.type !== "NavItem") return null;
          const iconKey = block.props.icon as string;
          const Icon = NAV_ICON_MAP[iconKey] ?? MessageSquare;
          const active = block.props.active as boolean;
          return (
            <div key={block.id} className="bp-nav-item-row">
              <button
                className={`bp-nav-item${active ? " bp-nav-item--active" : ""}`}
                title={block.props.label as string}
                onClick={() => handleSetActive(block.id)}
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
              {!collapsed && (
                <button
                  className="bp-nav-remove-btn"
                  onClick={(e) => { e.stopPropagation(); handleRemoveNavItem(block.id); }}
                  title="Remove item"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
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
   Default Chat — shown when canvas has no blocks
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
        <input type="text" placeholder="Ask the AI agent…" readOnly className="bp-chat-field" />
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
  const updateFooterBlockProps = useBuilder((s) => s.updateFooterBlockProps);

  return (
    <footer className="bp-footer">
      {footerBlocks.map((block) => {
        if (block.type === "FooterText") {
          return (
            <React.Fragment key={block.id}>
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
              <span className="bp-footer-sep">·</span>
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
            </React.Fragment>
          );
        }
        return null;
      })}
    </footer>
  );
}

/* ══════════════════════════════════════════════════════════
   Preview Toolbar — DS switcher + density + canvas actions
   ══════════════════════════════════════════════════════════ */
function PreviewToolbar() {
  const designSystem = useBuilder((s) => s.designSystem);
  const setDesignSystem = useBuilder((s) => s.setDesignSystem);
  const density = useBuilder((s) => s.density);
  const setDensity = useBuilder((s) => s.setDensity);
  const toggleComponentLibrary = useBuilder((s) => s.toggleComponentLibrary);
  const componentLibraryOpen = useBuilder((s) => s.componentLibraryOpen);
  const toggleAddMenu = useBuilder((s) => s.toggleAddMenu);
  const canvasViewMode = useBuilder((s) => s.canvasViewMode);
  const toggleCanvasViewMode = useBuilder((s) => s.toggleCanvasViewMode);
  const mode = useBuilder((s) => s.mode);
  const interfaceType = useBuilder((s) => s.interfaceType);
  const selectedComponents = useBuilder((s) => s.selectedComponents);
  const colorOverrides = useBuilder((s) => s.colorOverrides);

  const { saving, saveProject } = useCloudStorage();
  const [downloading, setDownloading] = useState(false);

  const handleQuickSave = async () => {
    const now = new Date();
    const defaultName = `${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    const name = window.prompt("Save project as:", defaultName);
    if (name === null) return;
    try { await saveProject(name.trim() || defaultName); } catch { /* surfaced by hook */ }
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

  const systems: { key: "salt" | "m3" | "fluent"; label: string }[] = [
    { key: "salt", label: "Salt DS" },
    { key: "m3", label: "Material 3" },
    { key: "fluent", label: "Fluent 2" },
  ];

  return (
    <div className="preview-toolbar">
      {/* UI Kit Switcher */}
      <div className="preview-toolbar-group">
        {systems.map((s) => (
          <button
            key={s.key}
            className={`preview-toolbar-btn${designSystem === s.key ? " preview-toolbar-btn-active" : ""}`}
            onClick={() => setDesignSystem(s.key)}
          >
            {s.label}
          </button>
        ))}
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

      {/* Canvas Actions */}
      <div className="preview-toolbar-group">
        <button
          className={`preview-toolbar-btn${componentLibraryOpen ? " preview-toolbar-btn-active" : ""}`}
          onClick={toggleComponentLibrary}
          title="Component Library"
        >
          <span className="material-symbols-outlined preview-toolbar-icon">category</span>
        </button>
        <button className="preview-toolbar-btn" onClick={toggleAddMenu} title="Add Component">
          <span className="material-symbols-outlined preview-toolbar-icon">add_box</span>
        </button>
        <button
          className={`preview-toolbar-btn${canvasViewMode === 'code' ? " preview-toolbar-btn-active preview-toolbar-code-active" : ""}`}
          onClick={toggleCanvasViewMode}
          title={canvasViewMode === 'code' ? "Show UI preview" : "Show JSON schema"}
        >
          <span className="preview-toolbar-code-label">&lt;/&gt;</span>
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
        <button
          className="preview-toolbar-btn"
          onClick={handleQuickSave}
          disabled={saving}
          title="Save project"
        >
          <span className="material-symbols-outlined preview-toolbar-icon">
            {saving ? "hourglass_top" : "save"}
          </span>
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PreviewSidePanel — the main exported panel for BuilderApp
   Wraps everything in a device frame with header/sidebar/footer
   ══════════════════════════════════════════════════════════ */
export function PreviewSidePanel() {
  const previewOpen = useBuilder((s) => s.previewOpen);
  const previewKey = useBuilder((s) => s.previewKey);
  const deviceMode = useBuilder((s) => s.deviceMode);
  const messages = useBuilder((s) => s.messages);
  const designSystem = useBuilder((s) => s.designSystem);
  const density = useBuilder((s) => s.density);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const hasContent = messages.some((m) => m.role === "ai");
  const isMobile = deviceMode === "mobile";
  const preset = PRESETS[deviceMode];
  const frameWidth = deviceMode === "desktop" ? "100%" : preset.width;

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed((v) => !v);
  }, []);

  return (
    <div className={`preview-side ${previewOpen ? "open" : ""}`}>
      {/* Device controls — always visible */}
      <DeviceControls />

      {/* Toolbar — always visible */}
      <PreviewToolbar />

      {/* Viewport wrapper — the "stage" */}
      <div className="bp-viewport-wrapper">
        {/* Device Frame — animated width */}
        <motion.div
          className="bp-device-frame"
          animate={{ width: frameWidth, maxHeight: preset.height }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
        >
          {/* SaaS Dashboard layout — scoped to the selected design system */}
          <div className={`bp-dashboard preview-${designSystem} density-${density}`} key={previewKey}>
            <DashboardHeader compact={isMobile} />

            <div className="bp-body">
              {!isMobile && (
                <DashboardSidebar
                  collapsed={sidebarCollapsed}
                  onToggle={handleSidebarToggle}
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
        </motion.div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Standalone Preview — for pop-out window
   ══════════════════════════════════════════════════════════ */
export function StandalonePreview() {
  const designSystem = useBuilder((s) => s.designSystem);
  const density = useBuilder((s) => s.density);
  const mode = useBuilder((s) => s.mode);
  const messages = useBuilder((s) => s.messages);
  const previewKey = useBuilder((s) => s.previewKey);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const hasContent = messages.some((m) => m.role === "ai");

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

      {/* Full dashboard canvas */}
      <div className="standalone-preview-canvas">
        <div className={`bp-dashboard preview-${designSystem} density-${density}`} key={previewKey}>
          <DashboardHeader compact={false} />
          <div className="bp-body">
            <DashboardSidebar
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed((v) => !v)}
            />
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
      </div>
    </div>
  );
}
