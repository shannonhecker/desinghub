"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sun, Moon, MessageSquare, Zap, Brain, BarChart3,
  ArrowRight, Play, Sparkles,
} from "lucide-react";
import Link from "next/link";
import "./hero.css";

/* ═══════════════════════════════════════════════════════════════
   HeroHeader — Nexa AI-Inspired Glass Morphism Hero
   3D Glassmorphism · Animated Mesh Orb · Floating UI Nodes
   ═══════════════════════════════════════════════════════════════ */

// ─── Types ────────────────────────────────────────────────────

type Theme = "dark" | "light";

interface CardConfig {
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  title: string;
  status: string;
  accent: string;
  x: number;  // % offset from center (−50…+50)
  y: number;
  delay: number;
  duration: number;
  bob: number;
}

// ─── Floating Card Definitions ────────────────────────────────

const CARDS: CardConfig[] = [
  {
    Icon: MessageSquare,
    title: "Chat Agent",
    status: "3 active conversations",
    accent: "#8B5CF6",
    x: -38, y: -36,
    delay: 0,   duration: 5.5, bob: 14,
  },
  {
    Icon: BarChart3,
    title: "Analytics",
    status: "12.4K events/hr",
    accent: "#06B6D4",
    x: 36,  y: -30,
    delay: 1.2, duration: 4.8, bob: 11,
  },
  {
    Icon: Zap,
    title: "Auto-Responder",
    status: "24ms latency",
    accent: "#6366F1",
    x: -34, y: 32,
    delay: 0.6, duration: 5.2, bob: 15,
  },
  {
    Icon: Brain,
    title: "Smart Router",
    status: "98.4% accuracy",
    accent: "#EC4899",
    x: 36,  y: 34,
    delay: 1.8, duration: 4.5, bob: 12,
  },
];

// ─── Deterministic Particles (SSR-safe — no Math.random) ──────

const PARTICLES = Array.from({ length: 25 }, (_, i) => ({
  top:      ((i * 37 + 13) % 93) + 3,
  left:     ((i * 53 + 7)  % 93) + 3,
  size:     1 + (i % 3),
  delay:    (i * 0.42) % 6,
  duration: 4 + (i % 5) * 1.3,
  opacity:  0.06 + (i % 4) * 0.04,
}));

// ─── SVG Connector Helpers ───────────────────────────────────

const VB = 520;
const C  = VB / 2;

function connectorPath(card: CardConfig, index: number) {
  const absX = C + (card.x / 100) * VB;
  const absY = C + (card.y / 100) * VB;
  const dx   = absX - C;
  const dy   = absY - C;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const orbR = 145;
  const edgeX = C + (dx / dist) * orbR;
  const edgeY = C + (dy / dist) * orbR;
  const midX  = (absX + edgeX) / 2;
  const midY  = (absY + edgeY) / 2;
  const perpX = -(dy / dist) * 22;
  const perpY =  (dx / dist) * 22;
  const sign  = index % 2 ? 1 : -1;
  return {
    absX, absY, edgeX, edgeY,
    ctrlX: midX + perpX * sign,
    ctrlY: midY + perpY * sign,
  };
}

// ─── Component ────────────────────────────────────────────────

export function HeroHeader() {
  const [theme, setTheme] = useState<Theme>("dark");
  const isDark = theme === "dark";

  return (
    <section className={`hero-section ${isDark ? "hero-dark" : "hero-light"}`}>

      {/* ═══ Liquid Glass Blob Scene ═══ */}
      <div className="hero-blob-scene" aria-hidden="true">
        <div className="hero-blob hero-blob--1" />
        <div className="hero-blob hero-blob--2" />
        <div className="hero-blob hero-blob--3" />
      </div>

      {/* ═══ Background Layers ═══ */}

      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div className="hero-grid-bg">
          <div className="hero-grid-plane" />
        </div>
      </div>

      <div className="hero-ambient hero-ambient-1" />
      <div className="hero-ambient hero-ambient-2" />

      {/* Particles — Framer Motion continuous loop (works in React 19) */}
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            top: `${p.top}%`,
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "var(--h-particle-color)",
            pointerEvents: "none",
          }}
          animate={{ y: [-10, 10, -10], opacity: [p.opacity, p.opacity * 3.5, p.opacity] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
        />
      ))}

      {/* ═══ Theme Toggle ═══ */}

      <button
        className="hero-toggle"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label="Toggle theme"
      >
        {/* key forces remount → re-triggers CSS entrance animation */}
        <div key={theme} className="hero-icon-spin-in">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </div>
      </button>

      {/* ═══ Content ═══ */}

      <div className="hero-content">
        <div className="hero-grid">

          {/* ── Left: Marketing Copy ── */}
          <div className="hero-copy">

            <div className="hero-fade-up" style={{ animationDelay: "0s" }}>
              <span className="hero-badge">
                <Sparkles size={13} />
                Next-Gen AI Platform
              </span>
            </div>

            <h1 className="hero-h1 hero-fade-up" style={{ animationDelay: "0.15s" }}>
              Build AI Agents{" "}
              <span className="hero-gradient-text">That Look as Smart</span>{" "}
              as They Are.
            </h1>

            <p className="hero-sub hero-fade-up" style={{ animationDelay: "0.3s" }}>
              Ship production-ready AI agents with stunning interfaces. From
              prototype to deployment in minutes — zero code required.
            </p>

            <div className="hero-ctas hero-fade-up" style={{ animationDelay: "0.45s" }}>
              <Link href="/builder">
                <button className="hero-cta-primary">
                  Start Building Free
                  <ArrowRight size={16} />
                </button>
              </Link>
              <button className="hero-cta-ghost">
                <Play size={14} />
                View Templates
              </button>
            </div>

            <div className="hero-proof hero-fade-up" style={{ animationDelay: "0.6s" }}>
              <div className="hero-avatars">
                {["#8B5CF6", "#06B6D4", "#6366F1", "#EC4899"].map((bg, i) => (
                  <div key={i} style={{ background: bg, zIndex: 4 - i }} />
                ))}
              </div>
              <span>
                Trusted by <strong>2,400+</strong> teams worldwide
              </span>
            </div>

            <div className="hero-stats hero-fade-up" style={{ animationDelay: "0.75s" }}>
              <div><strong>99.9%</strong><span>Uptime</span></div>
              <div><strong>50ms</strong><span>Response</span></div>
              <div><strong>10M+</strong><span>API Calls</span></div>
            </div>
          </div>

          {/* ── Right: Glass Orb Visual ── */}
          <div className="hero-visual">
            <div className="hero-visual-inner">

              {/* SVG Connectors */}
              <svg
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
                viewBox={`0 0 ${VB} ${VB}`}
                fill="none"
              >
                <defs>
                  <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.15" />
                  </linearGradient>
                  <filter id="glow"><feGaussianBlur stdDeviation="3" /></filter>
                </defs>
                {CARDS.map((card, i) => {
                  const p = connectorPath(card, i);
                  const d = `M ${p.absX} ${p.absY} Q ${p.ctrlX} ${p.ctrlY} ${p.edgeX} ${p.edgeY}`;
                  return (
                    <g key={i}>
                      <path d={d} stroke="url(#cg)" strokeWidth="4" filter="url(#glow)" opacity="var(--h-conn-opacity-glow)" />
                      <path d={d} stroke="url(#cg)" strokeWidth="1.5" strokeDasharray="5 7" strokeLinecap="round" opacity="var(--h-conn-opacity-dash)">
                        <animate attributeName="stroke-dashoffset" values="12;0" dur={`${1.8 + i * 0.25}s`} repeatCount="indefinite" />
                      </path>
                    </g>
                  );
                })}
              </svg>

              {/* Glass Orb — CSS entrance, no Framer Motion */}
              <div className="hero-orb-wrap">
                <div className="hero-orb-enter">
                  <div className="hero-orb-halo" />
                  <div className="hero-orb-shell">
                    <div className="hero-mesh-primary" />
                    <div className="hero-mesh-accent" />
                    <div className="hero-orb-hotspot"><div /></div>
                    <div className="hero-orb-refraction" />
                  </div>
                </div>
              </div>

              {/* Floating Cards — CSS entrance + Framer Motion continuous bobbing */}
              {CARDS.map((card, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${50 + card.x}%`,
                    top: `${50 + card.y}%`,
                    transform: "translate(-50%, -50%)",
                    zIndex: 20,
                  }}
                >
                  <div
                    className="hero-card-pop"
                    style={{ animationDelay: `${0.5 + i * 0.15}s` }}
                  >
                    <motion.div
                      animate={{ y: [0, -card.bob, 0] }}
                      transition={{
                        duration: card.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: card.delay,
                      }}
                    >
                      <div className="hero-card">
                        <div className="hero-card-row">
                          <div
                            className="hero-card-icon"
                            style={{ background: `${card.accent}${isDark ? "20" : "12"}` }}
                          >
                            <card.Icon size={13} style={{ color: card.accent }} />
                          </div>
                          <div>
                            <div className="hero-card-title">{card.title}</div>
                            <div className="hero-card-status">
                              <div className="hero-card-dot" style={{ background: card.accent }} />
                              <span className="hero-card-label">{card.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
