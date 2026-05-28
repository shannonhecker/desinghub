"use client";

/**
 * /landing-southleft — sibling prototype to evaluate a restrained,
 * editorial-minimal direction (inspired by southleft.com) against the
 * orbital/maximalist direction on feat/hero-orbital-tension (PR #140).
 *
 * Scoping: all styles live behind .landing-southleft (see ./landing-southleft.css).
 * No --dh-* / --a-* / DS tokens are redefined. Local tokens are --lsl-*.
 *
 * Scroll: globals.css gates page-scroll behind :has(.hero). The root
 * element carries both `landing-southleft` and `hero` so this page scrolls
 * without us touching globals.
 *
 * Motion: minimal fade-in on scroll only. No parallax, no chromatic, no
 * cursor effects (those belong to PR #140's direction).
 *
 * Copy rule (Shannon, project-wide): no em-dashes / en-dashes in display
 * copy. Colons, commas, periods only.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import "./landing.css";

/** uoaui mark (the "ao" with macron). Inline so we can recolor parts
    independently — body cream, macron orange-coral. Source: public/aologo.svg. */
function UoauiMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="26 96 356 216"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path className="lsl-mark-body" d="M107.705 148.072C123.184 148.072 136.998 151.701 149.146 158.961C161.49 166.024 171.188 175.737 178.242 188.097C185.492 200.458 189.215 214.487 189.411 230.183V299.345C189.411 302.68 188.333 305.427 186.178 307.585C184.023 309.547 181.279 310.528 177.948 310.528C174.618 310.528 171.875 309.547 169.72 307.585C167.564 305.427 166.487 302.68 166.487 299.345V281.451C160.475 289.898 152.834 296.844 143.561 302.288C132.393 308.762 119.657 312 105.354 312C90.267 312 76.7471 308.468 64.7951 301.404C52.8431 294.145 43.34 284.335 36.2864 271.974C29.4288 259.613 26 245.683 26 230.183C26 214.487 29.5266 200.458 36.5802 188.097C43.8299 175.737 53.6273 166.024 65.9713 158.961C78.3152 151.701 92.2266 148.072 107.705 148.072Z" />
      <path className="lsl-mark-body" d="M300.295 147.864C315.969 147.864 329.881 151.4 342.029 158.472C354.373 165.544 364.072 175.269 371.126 187.645C378.18 200.022 381.804 214.167 382 230.079C382 245.795 378.375 259.841 371.126 272.218C364.072 284.594 354.373 294.319 342.029 301.391C329.881 308.463 315.969 312 300.295 312C284.62 312 270.611 308.463 258.267 301.391C245.923 294.319 236.223 284.594 229.169 272.218C222.116 259.841 218.589 245.795 218.589 230.079C218.589 214.167 222.116 200.022 229.169 187.645C236.223 175.269 245.923 165.544 258.267 158.472C270.61 151.4 284.62 147.864 300.295 147.864Z" />
      <path className="lsl-mark-macron" d="M326.673 96C329.808 96 332.454 96.9829 334.609 98.9475C336.96 100.912 338.136 103.466 338.136 106.609C338.136 109.949 336.96 112.601 334.609 114.565C332.454 116.333 329.808 117.217 326.673 117.217H273.622C270.487 117.217 267.744 116.333 265.392 114.565C263.237 112.601 262.159 109.949 262.159 106.609C262.159 103.466 263.237 100.912 265.392 98.9475C267.744 96.9829 270.487 96 273.622 96H326.673Z" />
    </svg>
  );
}

/* ── Card hero graphics ─────────────────────────────────────────────────
   Miniature builder-derived demonstrations. Each one ANIMATES the
   specific behaviour the card claims. Hand-rolled SVG + CSS keyframes
   (no GSAP). All respect prefers-reduced-motion via .css. */

/** Card 1: a single mini-card morphs through the five DS styles —
    rendering Salt → Material 3 → Fluent → Carbon → uoaui in turn.
    Demonstrates "Five systems, side by side": the SAME comp, swapped. */
function GraphicSystemMorph() {
  return (
    <svg viewBox="0 0 320 220" className="lsl-graphic lsl-g-morph" aria-hidden="true">
      {/* Builder canvas hairline */}
      <rect x="20" y="20" width="280" height="180" rx="12"
            fill="none" stroke="currentColor" strokeOpacity="0.10" strokeWidth="1" />
      {/* The morphing card surface */}
      <rect className="lsl-morph-card"
            x="60" y="50" width="200" height="120"
            rx="8" fill="#FFFFFF" />
      {/* Title line */}
      <rect x="76" y="68" width="90" height="8" rx="2"
            fill="#1E1E1E" opacity="0.85" className="lsl-morph-ink" />
      {/* Body lines */}
      <rect x="76" y="86" width="150" height="5" rx="2"
            fill="#1E1E1E" opacity="0.32" className="lsl-morph-ink-faint" />
      <rect x="76" y="96" width="120" height="5" rx="2"
            fill="#1E1E1E" opacity="0.32" className="lsl-morph-ink-faint" />
      {/* Button — morphs radius + fill across systems */}
      <rect className="lsl-morph-btn"
            x="76" y="128" width="74" height="26"
            rx="6" fill="#0D7A95" />
      {/* Mono label below — five stacked, opacity-cycled to match the
          morph step. Only one visible at a time. */}
      {["SALT", "MATERIAL 3", "FLUENT 2", "CARBON", "UOAUI"].map((label, i) => (
        <text
          key={label}
          x="160"
          y="194"
          textAnchor="middle"
          className={`lsl-morph-label lsl-morph-label-${i + 1}`}
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

/** Card 2: tokens emit from a left-side rail and fly into a component
    card on the right, changing its surface + accent on each strike.
    Demonstrates "Tokens travel with the block". */
function GraphicTokenFlow() {
  return (
    <svg viewBox="0 0 320 220" className="lsl-graphic lsl-g-tokens" aria-hidden="true">
      {/* Token rail (left) */}
      <rect x="20" y="30" width="68" height="160" rx="8"
            fill="currentColor" fillOpacity="0.05"
            stroke="currentColor" strokeOpacity="0.14" />
      {/* Token rail rows */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="30" y={46 + i * 36} width="14" height="14" rx="3"
                fill={["#A78BFA", "#F0B5A4", "#A78BFA", "currentColor"][i]} />
          <rect x="50" y={50 + i * 36} width="30" height="6" rx="2"
                fill="currentColor" opacity="0.5" />
        </g>
      ))}
      {/* Component card (right) — surface contrasts wrapper bg via .lsl-tokens-target */}
      <rect className="lsl-tokens-target"
            x="148" y="50" width="148" height="120" rx="12" />
      <rect x="166" y="68" width="84" height="8" rx="2" fill="currentColor" opacity="0.85"
            className="lsl-on-tokens-target" />
      <rect x="166" y="86" width="110" height="5" rx="2" fill="currentColor" opacity="0.30"
            className="lsl-on-tokens-target" />
      <rect x="166" y="96" width="90" height="5" rx="2" fill="currentColor" opacity="0.30"
            className="lsl-on-tokens-target" />
      <rect className="lsl-tokens-target-btn"
            x="166" y="124" width="64" height="24" rx="12" fill="#A78BFA" />
      {/* Travelling token (animated) */}
      <circle className="lsl-token-particle lsl-token-particle-1" r="6" fill="#A78BFA" />
      <circle className="lsl-token-particle lsl-token-particle-2" r="6" fill="#F0B5A4" />
    </svg>
  );
}

/** Card 3: a component thumbnail lifts off the sidebar palette,
    follows an arc, settles into the canvas drop-zone.
    Demonstrates "Sketch in real components" (drag and drop). */
function GraphicDragDrop() {
  return (
    <svg viewBox="0 0 320 220" className="lsl-graphic lsl-g-drag" aria-hidden="true">
      {/* Sidebar palette */}
      <rect x="20" y="20" width="86" height="180" rx="8"
            fill="currentColor" fillOpacity="0.05"
            stroke="currentColor" strokeOpacity="0.14" />
      <rect x="32" y="36" width="62" height="36" rx="6" fill="currentColor" opacity="0.35" />
      <rect x="32" y="80" width="62" height="36" rx="6" fill="currentColor" opacity="0.35" />
      <rect x="32" y="124" width="62" height="36" rx="6"
            className="lsl-drag-source" fill="currentColor" opacity="0.35" />
      <rect x="32" y="168" width="62" height="20" rx="6" fill="currentColor" opacity="0.35" />
      {/* Canvas */}
      <rect x="126" y="20" width="174" height="180" rx="8"
            fill="currentColor" fillOpacity="0.03"
            stroke="currentColor" strokeOpacity="0.14"
            strokeDasharray="4 4" />
      {/* Drop-zone hint, fades out as the ghost lands */}
      <rect className="lsl-drag-target"
            x="154" y="92" width="118" height="40" rx="6"
            fill="rgba(167,139,250,0.10)" stroke="#A78BFA" strokeDasharray="3 3" />
      {/* Travelling ghost (animated from sidebar → canvas) */}
      <rect className="lsl-drag-ghost"
            x="32" y="124" width="62" height="36" rx="6"
            fill="#A78BFA" />
    </svg>
  );
}

/** Card 4: a prompt input "types" then three variant cards stagger-in
    below. Demonstrates "Brief it, get variants back". */
function GraphicBriefVariants() {
  return (
    <svg viewBox="0 0 320 220" className="lsl-graphic lsl-g-brief" aria-hidden="true">
      {/* Prompt input */}
      <rect x="20" y="22" width="280" height="42" rx="10"
            fill="currentColor" fillOpacity="0.05"
            stroke="currentColor" strokeOpacity="0.20" />
      {/* Mono prompt-prefix glyph */}
      <text x="36" y="48" className="lsl-brief-prefix">/</text>
      {/* Typing line — width animates 0 → 220 */}
      <rect className="lsl-brief-typing"
            x="50" y="42" width="0" height="6" rx="2" fill="currentColor" opacity="0.85" />
      {/* Cursor — blinks at end of typing range */}
      <rect className="lsl-brief-cursor"
            x="50" y="36" width="2" height="18" fill="#F0B5A4" />
      {/* Three variant cards (animate-in stagger) */}
      <rect className="lsl-brief-variant lsl-brief-variant-1"
            x="20"  y="92" width="88" height="100" rx="8"
            fill="currentColor" fillOpacity="0.05"
            stroke="currentColor" strokeOpacity="0.22" />
      <rect className="lsl-brief-variant lsl-brief-variant-2"
            x="116" y="92" width="88" height="100" rx="8"
            fill="currentColor" fillOpacity="0.05"
            stroke="currentColor" strokeOpacity="0.22" />
      <rect className="lsl-brief-variant lsl-brief-variant-3"
            x="212" y="92" width="88" height="100" rx="8"
            fill="currentColor" fillOpacity="0.05"
            stroke="currentColor" strokeOpacity="0.22" />
      {/* Variant content lines */}
      {[20, 116, 212].map((x, i) => (
        <g key={i} className={`lsl-brief-variant lsl-brief-variant-${i + 1}`}>
          <rect x={x + 12} y="108" width="40" height="6" rx="2" fill="currentColor" opacity="0.85" />
          <rect x={x + 12} y="124" width="56" height="4" rx="2" fill="currentColor" opacity="0.30" />
          <rect x={x + 12} y="134" width="48" height="4" rx="2" fill="currentColor" opacity="0.30" />
          <rect x={x + 12} y="162" width="44" height="18" rx="9"
                fill={i === 1 ? "#A78BFA" : "#F0B5A4"} opacity={i === 1 ? 1 : 0.7} />
        </g>
      ))}
    </svg>
  );
}

const GRAPHIC_MAP = {
  stack: GraphicSystemMorph,
  flow: GraphicTokenFlow,
  grid: GraphicDragDrop,
  crescent: GraphicBriefVariants,
} as const;

/** Up-right arrow icon, top-right corner of each card. */
function ArrowUpRight() {
  return (
    <svg viewBox="0 0 24 24" className="lsl-card-arrow" aria-hidden="true">
      <path
        d="M7 17 L17 7 M9 7 H17 V15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** Mock of a "card with a button" component rendered with one DS's
    signature: surface color, ink color, card radius, button radius,
    stroke. Hand-rolled, not pulled from the real DS packages. */
function SystemCardMock({ spec }: { spec: SystemSpec }) {
  return (
    <svg viewBox="0 0 220 160" className="lsl-syscard-svg" aria-hidden="true">
      {/* Card surface */}
      <rect
        x="6" y="6" width="208" height="148"
        rx={spec.radius}
        fill={spec.surface}
        stroke={spec.stroke ?? "none"}
        strokeWidth={spec.stroke ? 1 : 0}
      />
      {/* Title line (full opacity) */}
      <rect x="22" y="24" width="100" height="10" rx="2" fill={spec.ink} opacity="0.92" />
      {/* Body lines (faded) */}
      <rect x="22" y="46" width="170" height="6" rx="2" fill={spec.ink} opacity="0.34" />
      <rect x="22" y="58" width="140" height="6" rx="2" fill={spec.ink} opacity="0.34" />
      <rect x="22" y="70" width="158" height="6" rx="2" fill={spec.ink} opacity="0.34" />
      {/* Primary button */}
      <rect
        x="22" y="108"
        width="78" height="30"
        rx={spec.btnRadius}
        fill={spec.brand}
      />
      <rect x="36" y="118" width="50" height="10" rx="2" fill="#FFFFFF" opacity="0.94" />
    </svg>
  );
}

/* ── Content (kept local — prototype, not a CMS surface) ────────────── */

const NAV_LINKS = [
  { href: "#services", label: "Workbench" },
  { href: "#projects", label: "Featured" },
  { href: "#voices", label: "Voices" },
  { href: "#about", label: "About" },
] as const;

type ServiceTone = "dark" | "cream";
type ServiceGraphic = "stack" | "flow" | "grid" | "crescent";
interface Service {
  heading: string;
  bullets: readonly string[];
  tone: ServiceTone;
  graphic: ServiceGraphic;
  href: string;
}

const SERVICES: readonly Service[] = [
  {
    heading: "Five systems, side by side",
    bullets: [
      "Drop a Salt card. See it as Material 3, Fluent, Carbon, uoaui.",
      "Demo the same brief to five stakeholders at once.",
      "Decide which system fits before you commit a codebase to it.",
      "No swap penalty: the comp carries across renderers.",
    ],
    tone: "dark",
    graphic: "stack",
    href: "/builder",
  },
  {
    heading: "Tokens travel with the block",
    bullets: [
      "Swap a block, tokens follow it.",
      "Spacing, radius, color, density resolve through the right layer.",
      "No hardcoded hex, no inline overrides leaking in.",
      "Token diff surfaced inline whenever you change a system.",
    ],
    tone: "dark",
    graphic: "flow",
    href: "/token-editor",
  },
  {
    heading: "Sketch in real components",
    bullets: [
      "Compose at the speed of a presentation tool.",
      "Drop production components, not lorem rectangles.",
      "LayoutGroups and row primitives keep the diff readable.",
      "Every drag is keyboard-reachable too.",
    ],
    tone: "dark",
    graphic: "grid",
    href: "/builder",
  },
  {
    heading: "Brief it, get variants back",
    bullets: [
      "Hand the canvas a brief, get three layouts back.",
      "Audit contrast and density without leaving the page.",
      "Pressure-test against the scenarios you care about.",
      "Your canvas stays the source of truth, not the screenshot.",
    ],
    tone: "dark",
    graphic: "crescent",
    href: "/builder",
  },
] as const;

/* The "same comp, five systems" strip. Each entry mocks the visual
   signature of one design system rendering the same card-with-button
   primitive. Hand-rolled SVG, not real components — the canvas is the
   source of truth, this is the brochure. */
interface SystemSpec {
  name: string;
  /** Brand-ish chip color used as a hint of the DS palette. */
  brand: string;
  /** Card background. */
  surface: string;
  /** Card text color. */
  ink: string;
  /** Border-radius the DS prefers for cards. */
  radius: number;
  /** Border-radius the DS prefers for buttons (Carbon = 0, M3 = 20). */
  btnRadius: number;
  /** Subtle stroke around the card (Carbon-flat / Salt-bordered / etc). */
  stroke: string | null;
  href: string;
}

const SYSTEMS: readonly SystemSpec[] = [
  {
    name: "Salt DS",
    brand: "#0D7A95",  // Salt accent teal
    surface: "#FFFFFF",
    ink: "#1E1E1E",
    radius: 6,
    btnRadius: 6,
    stroke: "rgba(0,0,0,0.10)",
    href: "/builder?ds=salt",
  },
  {
    name: "Material 3",
    brand: "#6750A4",  // M3 primary purple
    surface: "#FEF7FF",
    ink: "#1D1B20",
    radius: 16,
    btnRadius: 20,
    stroke: null,
    href: "/builder?ds=md3",
  },
  {
    name: "Fluent 2",
    brand: "#0F6CBD",  // Fluent brand blue
    surface: "#FAFAFA",
    ink: "#242424",
    radius: 4,
    btnRadius: 4,
    stroke: "rgba(0,0,0,0.08)",
    href: "/builder?ds=fluent",
  },
  {
    name: "Carbon",
    brand: "#0F62FE",  // IBM blue
    surface: "#F4F4F4",
    ink: "#161616",
    radius: 0,
    btnRadius: 0,
    stroke: null,
    href: "/builder?ds=carbon",
  },
  {
    name: "uoaui",
    brand: "#A78BFA",  // Teal Input — uoaui primary
    surface: "rgba(255,255,255,0.06)",
    ink: "#FFFFFF",
    radius: 14,
    btnRadius: 999,
    stroke: "rgba(255,255,255,0.18)",
    href: "/builder?ds=uoaui",
  },
] as const;

/* Token primitives shown verbatim in the "tokens you can read" section.
   Pulled from --dh-* / --lsl-* / brand vars so they read as the actual
   surface of the design system, not decorative swatches. */

const COLOR_TOKENS = [
  { name: "--lsl-accent",  hex: "#A78BFA",                 role: "Purple Compute · primary" },
  { name: "--lsl-amber",   hex: "#F0B5A4",                 role: "Peach Output · secondary" },
  { name: "--lsl-teal",    hex: "#3DDCC4",                 role: "Teal Input · signal"      },
  { name: "--lsl-bg",      hex: "#0A0E1A",                 role: "Midnight Canvas · surface" },
  { name: "--lsl-fg",      hex: "rgba(255,255,255,0.92)",  role: "Ink · high emphasis"      },
  { name: "--lsl-fg-muted",hex: "rgba(255,255,255,0.65)",  role: "Ink · medium"             },
] as const;

const TYPE_TOKENS = [
  { sample: "Display 800", spec: "Bricolage Grotesque · 80px · −0.028em",  fam: "display" },
  { sample: "Section 800", spec: "Bricolage Grotesque · 40px · −0.025em",  fam: "display" },
  { sample: "Body",         spec: "Inter · 16.5px · 1.55",                   fam: "sans" },
  { sample: "TOKEN / 01",   spec: "IBM Plex Mono · 12px · uppercase",        fam: "mono" },
] as const;

const SPACE_TOKENS = [
  { v: 4,  name: "01" },
  { v: 8,  name: "02" },
  { v: 12, name: "03" },
  { v: 16, name: "04" },
  { v: 24, name: "06" },
  { v: 32, name: "08" },
  { v: 48, name: "12" },
] as const;

/* ── Hooks ───────────────────────────────────────────────────────────── */

/** Toggle the sticky nav background once the user scrolls past the hero.
    Threshold: 80% of viewport height — keeps the nav fully transparent
    through the entire brand-moment hero scroll. Glass only kicks in when
    the user crosses into the service-card content below. */
function useScrolledNav(): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return scrolled;
}

/**
 * Minimal IntersectionObserver-driven reveal. Avoids pulling GSAP for what
 * is fundamentally one opacity + 12px translate per element. Respects
 * prefers-reduced-motion via CSS (see landing-southleft.css).
 */
function useRevealOnScroll(rootRef: React.RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;
    const targets = root.querySelectorAll<HTMLElement>("[data-reveal]");
    if (targets.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-revealed", "true");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );

    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [rootRef]);
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function LandingSouthleftPage() {
  const rootRef = useRef<HTMLElement>(null);
  const scrolled = useScrolledNav();
  useRevealOnScroll(rootRef);

  return (
    // `hero` class is required to enable page scroll (see globals.css :has(.hero)).
    <main
      id="main-content"
      ref={rootRef}
      className="landing-southleft hero"
    >
      {/* ── Nav ── */}
      <nav className="lsl-nav" data-scrolled={scrolled} aria-label="Primary">
        <div className="lsl-container lsl-nav-inner">
          <Link href="/" className="lsl-logo" aria-label="uoaui.ai home">
            <UoauiMark className="lsl-logo-mark-svg" />
            <span className="lsl-logo-word">uoaui.ai</span>
          </Link>
          <ul className="lsl-nav-links">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a className="lsl-nav-link" href={l.href}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <Link href="/builder" className="lsl-cta">
            Open the workbench
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lsl-hero" aria-labelledby="lsl-hero-headline">
        {/* Aurora wash — cyan + pale glow, matches portfolio's .proj-nda-glow
            motif. Pure decoration, kept under content. */}
        <div className="lsl-hero-aurora" aria-hidden="true" />

        <div className="lsl-container">
          <p className="lsl-hero-eyebrow" data-reveal>
            uoaui.ai / dark-mode first
          </p>
          <h1
            id="lsl-hero-headline"
            className="lsl-hero-headline"
            data-reveal
          >
            A visual web builder for designers who <em>think in systems</em>.
          </h1>
          <p className="lsl-hero-sub" data-reveal>
            UI Kit plus private-preview Builder across Salt, Material 3,
            Fluent 2, Carbon, and the uoaui system. Token-aware, dark-mode
            first, with vibrant aurora accents.
          </p>
          <div className="lsl-hero-actions" data-reveal>
            <Link href="/builder" className="lsl-cta">
              Open the workbench
            </Link>
            <a className="lsl-hero-secondary" href="#demo">
              Watch the demo
              <span aria-hidden="true">{"→"}</span>
            </a>
          </div>

          {/* Demo video — restored from the portfolio. Matches the
              shannonhecker.com/project-uoaui.html cover treatment:
              autoplay/muted/loop/playsinline + theme-aware framing. */}
          <figure
            id="demo"
            className="lsl-hero-demo"
            data-reveal
            aria-label="uoaui.ai builder walkthrough"
          >
            <div className="lsl-hero-demo-frame">
              <video
                className="lsl-hero-demo-video"
                src="/uoaui-demo.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
              />
              <div className="lsl-hero-demo-shield" aria-hidden="true" />
            </div>
            <figcaption className="lsl-hero-demo-caption">
              Live capture · Workbench across Salt, Material 3, Fluent 2,
              Carbon, and uoaui
            </figcaption>
          </figure>
        </div>
      </section>

      <hr className="lsl-rule" />

      {/* ── Services / what it does ── */}
      <section
        id="services"
        className="lsl-section"
        aria-labelledby="lsl-services-heading"
      >
        <div className="lsl-container">
          <p className="lsl-section-label" data-reveal>canvas / overview</p>
          <h2
            id="lsl-services-heading"
            className="lsl-section-heading"
            data-reveal
          >
            A working canvas for design-system decisions.
          </h2>
          <p className="lsl-section-lede" data-reveal>
            Built for the part of the process where teams compare, audit, and
            hand off across systems. The four moves below cover the day to day.
          </p>

          <div className="lsl-services">
            {SERVICES.map((s, idx) => {
              const Graphic = GRAPHIC_MAP[s.graphic];
              const num = String(idx + 1).padStart(2, "0");
              return (
                <Link
                  key={s.heading}
                  href={s.href}
                  className="lsl-service-card"
                  data-tone={s.tone}
                  data-reveal
                >
                  <ArrowUpRight />
                  <div className="lsl-service-content">
                    <p className="lsl-service-num">{num}</p>
                    <h3 className="lsl-service-heading">{s.heading}</h3>
                    <ul className="lsl-service-bullets">
                      {s.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="lsl-service-figure">
                    <Graphic />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <hr className="lsl-rule" />

      {/* ── Same comp, five systems ── */}
      <section
        id="projects"
        className="lsl-section"
        aria-labelledby="lsl-systems-heading"
      >
        <div className="lsl-container">
          <p className="lsl-section-label" data-reveal>
            systems / side-by-side
          </p>
          <h2
            id="lsl-systems-heading"
            className="lsl-section-heading"
            data-reveal
          >
            The same card. Five renderings.
          </h2>
          <p className="lsl-section-lede" data-reveal>
            Pick a system to compose with. Swap later without rewriting the
            comp. Tokens carry the design intent across renderers.
          </p>

          <div className="lsl-systems" data-reveal>
            {SYSTEMS.map((s) => (
              <Link
                key={s.name}
                href={s.href}
                className="lsl-syscard"
                data-system={s.name.toLowerCase().replace(/\s+/g, "-")}
              >
                <div className="lsl-syscard-frame">
                  <SystemCardMock spec={s} />
                </div>
                <p className="lsl-syscard-label">{s.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <hr className="lsl-rule" />

      {/* ── Tokens you can read ── */}
      <section
        id="voices"
        className="lsl-section"
        aria-labelledby="lsl-tokens-heading"
      >
        <div className="lsl-container">
          <p className="lsl-section-label" data-reveal>tokens / primitives</p>
          <h2
            id="lsl-tokens-heading"
            className="lsl-section-heading"
            data-reveal
          >
            Tokens you can read.
          </h2>
          <p className="lsl-section-lede" data-reveal>
            The unit of portability across five systems. Same primitives,
            different rendering. Below is a slice of the actual canvas.
          </p>

          <div className="lsl-tokens" data-reveal>
            {/* Colour column */}
            <div className="lsl-tokens-col">
              <p className="lsl-tokens-col-label">color</p>
              <ul className="lsl-tokens-list">
                {COLOR_TOKENS.map((t) => (
                  <li key={t.name} className="lsl-token-row">
                    <span
                      className="lsl-token-swatch"
                      style={{ background: t.hex }}
                      aria-hidden="true"
                    />
                    <span className="lsl-token-meta">
                      <span className="lsl-token-name">{t.name}</span>
                      <span className="lsl-token-detail">
                        {t.hex} · {t.role}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Type column */}
            <div className="lsl-tokens-col">
              <p className="lsl-tokens-col-label">type</p>
              <ul className="lsl-tokens-list">
                {TYPE_TOKENS.map((t) => (
                  <li key={t.sample} className="lsl-token-row">
                    <span
                      className="lsl-token-typesample"
                      data-fam={t.fam}
                    >
                      {t.sample}
                    </span>
                    <span className="lsl-token-detail">{t.spec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Spacing column */}
            <div className="lsl-tokens-col">
              <p className="lsl-tokens-col-label">space</p>
              <ul className="lsl-tokens-list lsl-tokens-list-space">
                {SPACE_TOKENS.map((t) => (
                  <li key={t.name} className="lsl-token-row lsl-token-row-space">
                    <span className="lsl-token-name lsl-token-name-mono">
                      {t.name}
                    </span>
                    <span
                      className="lsl-token-bar"
                      style={{ width: `${t.v * 3}px` }}
                      aria-hidden="true"
                    />
                    <span className="lsl-token-detail">{t.v}px</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <hr className="lsl-rule" />

      {/* ── Footer ── */}
      <footer
        id="about"
        className="lsl-footer"
        aria-labelledby="lsl-footer-heading"
      >
        <h2 id="lsl-footer-heading" className="sr-only">
          Site footer
        </h2>
        <div className="lsl-container">
          <div className="lsl-footer-brand">
            <div className="lsl-footer-brand-lockup">
              <UoauiMark className="lsl-footer-brand-mark-svg" />
              <p className="lsl-footer-brand-mark">uoaui.ai</p>
            </div>
            <p className="lsl-footer-brand-body">
              A workbench for designing across five systems. Built by a
              design engineer who got tired of choosing.
            </p>
          </div>

          <div className="lsl-footer-fine">
            <span>{"©"} {new Date().getFullYear()} uoaui.ai</span>
            <span>Built with restraint.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
