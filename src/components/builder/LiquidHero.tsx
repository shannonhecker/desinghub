"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
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

/* ═══════════════════════════════════════════════════════════
   Liquid Morphing Orb — SVG feTurbulence + feDisplacementMap
   ═══════════════════════════════════════════════════════════ */

function LiquidOrb({ darkMode }: { darkMode: boolean }) {
  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let t = 0;
    const animate = () => {
      t += 0.0008;
      if (turbRef.current) {
        const bx = 0.012 + Math.sin(t * 0.7) * 0.004;
        const by = 0.014 + Math.cos(t * 0.9) * 0.004;
        turbRef.current.setAttribute("baseFrequency", `${bx.toFixed(4)} ${by.toFixed(4)}`);
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const filterId = "lh-liquid-distort";

  return (
    <div className="lh-orb-wrap">
      <svg className="lh-svg-defs" width="0" height="0" aria-hidden="true">
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence
              ref={turbRef}
              type="fractalNoise"
              baseFrequency="0.012 0.014"
              numOctaves={3}
              seed={42}
              stitchTiles="stitch"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={darkMode ? 60 : 45}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          <radialGradient id="lh-orb-gradient" cx="35%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="40%" stopColor="#3B82F6" />
            <stop offset="75%" stopColor="#2DD4BF" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0.6" />
          </radialGradient>
        </defs>
      </svg>

      <motion.div
        className="lh-orb-body"
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      >
        <div
          className={`lh-orb-disc ${darkMode ? "lh-orb-disc--dark" : "lh-orb-disc--light"}`}
          style={{ filter: `url(#${filterId})` }}
        >
          <svg viewBox="0 0 400 400" className="lh-orb-svg">
            <circle cx="200" cy="200" r="180" fill="url(#lh-orb-gradient)" />
          </svg>
        </div>
      </motion.div>

      {darkMode && <div className="lh-orb-glow" aria-hidden="true" />}

      <div className={`lh-orb-ring ${darkMode ? "lh-orb-ring--dark" : "lh-orb-ring--light"}`} aria-hidden="true" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Hero Section — headline + orb
   ═══════════════════════════════════════════════════════════ */

function HeroSection({ darkMode }: { darkMode: boolean }) {
  return (
    <section className={`lh-hero ${darkMode ? "lh-dark" : "lh-light"}`}>
      <div className="lh-hero-glow" aria-hidden="true" />

      <div className="lh-hero-content">
        <div className="lh-hero-copy">
          <div className="lh-tag">
            <span className="lh-tag-dot" />
            AI-Powered Design
          </div>
          <h1 className="lh-headline">
            Build AI Agents That Look as Smart as They Are.
          </h1>
          <p className="lh-subheadline">
            Deploy high-performance, branded AI agents that automate your
            workflow in under 5 minutes.
          </p>
          <div className="lh-cta-row">
            <button className="lh-btn lh-btn--primary">Get Started Free</button>
            <button className="lh-btn lh-btn--ghost">Watch Demo</button>
          </div>
        </div>

        <div className="lh-hero-orb">
          <LiquidOrb darkMode={darkMode} />
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Device Preview System
   ═══════════════════════════════════════════════════════════ */

type DeviceMode = "desktop" | "tablet" | "mobile";

const PRESETS: Record<DeviceMode, { width: number; height: number; label: string }> = {
  desktop: { width: 1200, height: 800, label: "1200 × 800" },
  tablet: { width: 768, height: 1024, label: "768 × 1024" },
  mobile: { width: 375, height: 812, label: "375 × 812" },
};

const NAV_ITEMS = [
  { icon: MessageSquare, label: "Chat", active: true },
  { icon: Database, label: "Data", active: false },
  { icon: Settings, label: "Settings", active: false },
  { icon: BarChart3, label: "Analytics", active: false },
];

const SAMPLE_MESSAGES = [
  { role: "user" as const, text: "Summarize yesterday's sales data" },
  { role: "ai" as const, text: "Yesterday's total revenue was $14,280 across 142 orders. Top category: Electronics (+12% vs. prior day)." },
  { role: "user" as const, text: "Show me a breakdown by region" },
];

function PreviewControls({
  device,
  onDeviceChange,
  onRefresh,
  darkMode,
}: {
  device: DeviceMode;
  onDeviceChange: (d: DeviceMode) => void;
  onRefresh: () => void;
  darkMode: boolean;
}) {
  const devices: { key: DeviceMode; Icon: typeof Monitor }[] = [
    { key: "desktop", Icon: Monitor },
    { key: "tablet", Icon: Tablet },
    { key: "mobile", Icon: Smartphone },
  ];

  return (
    <div className={`lh-pv-controls ${darkMode ? "lh-dark" : "lh-light"}`}>
      <div className="lh-pv-controls-left">
        {devices.map(({ key, Icon }) => (
          <button
            key={key}
            className={`lh-pv-device-btn${device === key ? " lh-pv-device-btn--active" : ""}`}
            onClick={() => onDeviceChange(key)}
          >
            <Icon size={18} strokeWidth={device === key ? 2.2 : 1.6} />
          </button>
        ))}
      </div>
      <span className="lh-pv-dimensions">{PRESETS[device].label}</span>
      <button className="lh-pv-refresh-btn" onClick={onRefresh}>
        <RotateCcw size={15} strokeWidth={2} />
        Refresh
      </button>
    </div>
  );
}

function PreviewDashboard({ isMobile, refreshKey, darkMode }: { isMobile: boolean; refreshKey: number; darkMode: boolean }) {
  const [collapsed, setCollapsed] = useState(isMobile);

  useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

  return (
    <div className={`lh-pv-dashboard ${darkMode ? "lh-dark" : "lh-light"}`} key={refreshKey}>
      {/* Header */}
      <header className="lh-pv-header">
        <div className="lh-pv-header-brand">
          <div className="lh-pv-logo"><Bot size={isMobile ? 14 : 16} strokeWidth={2.4} /></div>
          {!isMobile && <span className="lh-pv-logo-text">AI Agent</span>}
        </div>
        <div className="lh-pv-status"><span className="lh-pv-status-dot" />Active</div>
      </header>

      <div className="lh-pv-body">
        {/* Sidebar */}
        {!isMobile && (
          <motion.aside
            className="lh-pv-sidebar"
            animate={{ width: collapsed ? 48 : 180 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
          >
            <nav className="lh-pv-sidebar-nav">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.label}
                  className={`lh-pv-nav-item${item.active ? " lh-pv-nav-item--active" : ""}`}
                  title={item.label}
                >
                  <item.icon size={18} strokeWidth={item.active ? 2.2 : 1.5} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        className="lh-pv-nav-label"
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
            <button className="lh-pv-sidebar-toggle" onClick={() => setCollapsed((v) => !v)}>
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </motion.aside>
        )}

        {/* Chat area */}
        <main className="lh-pv-main">
          <div className="lh-pv-messages">
            {SAMPLE_MESSAGES.map((msg, i) => (
              <motion.div
                key={`${refreshKey}-${i}`}
                className={`lh-pv-msg lh-pv-msg--${msg.role}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.25 }}
              >
                {msg.role === "ai" && (
                  <div className="lh-pv-msg-avatar"><Bot size={14} strokeWidth={2.4} /></div>
                )}
                <div className="lh-pv-msg-bubble">{msg.text}</div>
              </motion.div>
            ))}
          </div>
          <div className="lh-pv-chat-input">
            <input type="text" placeholder="Ask the AI agent…" readOnly className="lh-pv-chat-field" />
            <button className="lh-pv-chat-send"><Send size={14} strokeWidth={2.4} /></button>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="lh-pv-footer">
        <span>Powered by Design Hub</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>v1.0</span>
      </footer>
    </div>
  );
}

function DevicePreview({ darkMode }: { darkMode: boolean }) {
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDeviceChange = useCallback((d: DeviceMode) => {
    setDevice(d);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const preset = PRESETS[device];
  const isMobile = device === "mobile";

  return (
    <div className={`lh-pv-root ${darkMode ? "lh-dark" : "lh-light"}`}>
      <PreviewControls device={device} onDeviceChange={handleDeviceChange} onRefresh={handleRefresh} darkMode={darkMode} />
      <div className="lh-pv-viewport">
        <motion.div
          className="lh-pv-frame"
          animate={{ width: preset.width, maxHeight: preset.height }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
        >
          <PreviewDashboard isMobile={isMobile} refreshKey={refreshKey} darkMode={darkMode} />
        </motion.div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Export — Hero + Preview
   ═══════════════════════════════════════════════════════════ */

export function LiquidHero({ darkMode = true }: { darkMode?: boolean }) {
  return (
    <div className={`lh-page ${darkMode ? "lh-dark" : "lh-light"}`}>
      <HeroSection darkMode={darkMode} />
      <DevicePreview darkMode={darkMode} />
    </div>
  );
}
