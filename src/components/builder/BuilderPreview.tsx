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

/* ── Viewport presets ── */
type DeviceMode = "desktop" | "tablet" | "mobile";

interface DevicePreset {
  width: number | "100%";
  height: number;
  label: string;
}

const PRESETS: Record<DeviceMode, DevicePreset> = {
  desktop: { width: 1200, height: 800, label: "1200 × 800" },
  tablet: { width: 768, height: 1024, label: "768 × 1024" },
  mobile: { width: 375, height: 812, label: "375 × 812" },
};

/* ── Sidebar nav items ── */
const NAV_ITEMS = [
  { icon: MessageSquare, label: "Chat", active: true },
  { icon: Database, label: "Data", active: false },
  { icon: Settings, label: "Settings", active: false },
  { icon: BarChart3, label: "Analytics", active: false },
];

/* ── Fake chat messages for the preview ── */
const SAMPLE_MESSAGES = [
  { role: "user" as const, text: "Summarize yesterday's sales data" },
  {
    role: "ai" as const,
    text: "Yesterday's total revenue was $14,280 across 142 orders. Top category: Electronics (+12% vs. prior day).",
  },
  { role: "user" as const, text: "Show me a breakdown by region" },
];

/* ══════════════════════════════════════════════════════════
   Device Controls — top bar above the viewport
   ══════════════════════════════════════════════════════════ */
function DeviceControls({
  device,
  onDeviceChange,
  onRefresh,
}: {
  device: DeviceMode;
  onDeviceChange: (d: DeviceMode) => void;
  onRefresh: () => void;
}) {
  const preset = PRESETS[device];
  const devices: { key: DeviceMode; Icon: typeof Monitor }[] = [
    { key: "desktop", Icon: Monitor },
    { key: "tablet", Icon: Tablet },
    { key: "mobile", Icon: Smartphone },
  ];

  return (
    <div className="bp-controls">
      <div className="bp-controls-left">
        {devices.map(({ key, Icon }) => (
          <button
            key={key}
            className={`bp-device-btn${device === key ? " bp-device-btn--active" : ""}`}
            onClick={() => onDeviceChange(key)}
            title={key.charAt(0).toUpperCase() + key.slice(1)}
          >
            <Icon size={18} strokeWidth={device === key ? 2.2 : 1.6} />
          </button>
        ))}
      </div>

      <span className="bp-dimensions">
        {typeof preset.width === "number" ? preset.label : `100% × ${preset.height}`}
      </span>

      <button className="bp-refresh-btn" onClick={onRefresh} title="Reset layout">
        <RotateCcw size={15} strokeWidth={2} />
        <span>Refresh</span>
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Dashboard Header
   ══════════════════════════════════════════════════════════ */
function DashboardHeader({ compact }: { compact: boolean }) {
  return (
    <header className="bp-header">
      <div className="bp-header-brand">
        <div className="bp-logo-mark">
          <Bot size={compact ? 14 : 16} strokeWidth={2.4} />
        </div>
        {!compact && <span className="bp-logo-text">AI Agent</span>}
      </div>
      <div className="bp-status-pill">
        <span className="bp-status-dot" />
        <span className="bp-status-label">Active</span>
      </div>
    </header>
  );
}

/* ══════════════════════════════════════════════════════════
   Sidebar
   ══════════════════════════════════════════════════════════ */
function DashboardSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.aside
      className="bp-sidebar"
      animate={{ width: collapsed ? 48 : 180 }}
      transition={{ type: "spring", stiffness: 340, damping: 32 }}
    >
      <nav className="bp-sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={`bp-nav-item${item.active ? " bp-nav-item--active" : ""}`}
            title={item.label}
          >
            <item.icon size={18} strokeWidth={item.active ? 2.2 : 1.5} />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  className="bp-nav-label"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        ))}
      </nav>

      <button className="bp-sidebar-toggle" onClick={onToggle} title="Toggle sidebar">
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </motion.aside>
  );
}

/* ══════════════════════════════════════════════════════════
   Chat content area
   ══════════════════════════════════════════════════════════ */
function ChatArea({ messageKey }: { messageKey: number }) {
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
        <input
          type="text"
          placeholder="Ask the AI agent…"
          readOnly
          className="bp-chat-field"
        />
        <button className="bp-chat-send">
          <Send size={14} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Footer
   ══════════════════════════════════════════════════════════ */
function DashboardFooter() {
  return (
    <footer className="bp-footer">
      <span>Powered by Design Hub</span>
      <span className="bp-footer-sep">·</span>
      <span>v1.0</span>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════════
   Main BuilderPreview component
   ══════════════════════════════════════════════════════════ */
export function BuilderPreview() {
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDeviceChange = useCallback((d: DeviceMode) => {
    setDevice(d);
    if (d === "mobile") setSidebarCollapsed(true);
    else setSidebarCollapsed(false);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setSidebarCollapsed(device === "mobile");
  }, [device]);

  const preset = PRESETS[device];
  const frameWidth = typeof preset.width === "number" ? preset.width : "100%";
  const isMobile = device === "mobile";

  return (
    <div className="bp-root">
      <DeviceControls
        device={device}
        onDeviceChange={handleDeviceChange}
        onRefresh={handleRefresh}
      />

      {/* Viewport wrapper — light gray bg */}
      <div className="bp-viewport-wrapper">
        {/* Device frame with animated size */}
        <motion.div
          className="bp-device-frame"
          animate={{
            width: frameWidth,
            maxHeight: preset.height,
          }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
        >
          {/* Dashboard layout */}
          <div className="bp-dashboard" key={refreshKey}>
            <DashboardHeader compact={isMobile} />

            <div className="bp-body">
              {!isMobile && (
                <DashboardSidebar
                  collapsed={sidebarCollapsed}
                  onToggle={() => setSidebarCollapsed((v) => !v)}
                />
              )}

              <main className="bp-main">
                <ChatArea messageKey={refreshKey} />
              </main>
            </div>

            <DashboardFooter />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
