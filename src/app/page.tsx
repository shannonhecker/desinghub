"use client";

/**
 * Landing page: "product studio" direction.
 *
 * One idea, executed fully: the same finance report changing design systems.
 * The hero pairs a two-line headline and the real prompt with an instrument
 * that swaps Present-mode captures of ONE report (the ESG Analytics template)
 * across the five systems, in light and dark. Every image under
 * /public/showcase is a capture of the running builder; nothing is redrawn.
 *
 * Scoping: all styles live behind .landing-southleft (see ./landing.css).
 * Local tokens are --lsl-*; no --dh-* / --a-* / DS tokens are redefined.
 *
 * Scroll: globals.css gates page scroll behind :has(.hero). The root element
 * carries both `landing-southleft` and `hero` so this page scrolls without
 * touching globals.
 *
 * Motion: one moment only, the system wipe, and it answers the visitor's own
 * action. No scroll reveals: all content is visible without JavaScript.
 *
 * Copy rule (Shannon, project-wide): no em dashes or en dashes in display
 * copy. Colons, commas, periods only.
 */

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
} from "framer-motion";
import Link from "next/link";

import "./landing.css";

/** uoaui mark (the "ao" with macron). Inline so we can recolor parts
    independently: body white, macron accent. Source: public/aologo.svg. */
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

/** Scroll-linked glass for the sticky nav.
 *
 * Rather than snapping on at a threshold, the glass *builds in* as the user
 * scrolls: blur radius, saturation, background tint, hairline border and drop
 * shadow all ramp 0 to full across the first GLASS_RANGE px of scroll. Returns
 * a style object of MotionValues to spread onto a <motion.nav>.
 *
 * Why JS-driven inline styles instead of the old `[data-scrolled]` CSS rule:
 * lightningcss strips the unprefixed `backdrop-filter` from minified CSS when
 * both prefixed + unprefixed are authored (issue #695), so the class-based
 * glass shipped `-webkit-`-only and never painted in Chrome / Firefox /
 * Safari 18+. Inline styles bypass CSS minification, and we emit BOTH
 * `backdropFilter` and `WebkitBackdropFilter` so every engine gets a value.
 *
 * Motion safety: the effect is a pure function of scroll position (no
 * time-based animation), which is already reduced-motion-appropriate. When
 * `prefers-reduced-motion` is set we additionally collapse the ramp to a near-
 * instant snap so there is no gradual visual change at all. */
const GLASS_RANGE_PX = 360; // scroll distance over which the glass reaches full

function useNavGlassStyle() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const range = reduce ? [0, 1] : [0, GLASS_RANGE_PX];

  const blur = useTransform(scrollY, range, [0, 40], { clamp: true });
  const saturate = useTransform(scrollY, range, [100, 190], { clamp: true });
  const tint = useTransform(scrollY, range, [0, 0.5], { clamp: true });
  const borderAlpha = useTransform(scrollY, range, [0, 0.1], { clamp: true });
  const shadowAlpha = useTransform(scrollY, range, [0, 0.45], { clamp: true });
  // Inset top highlight ramps too, so at the default (top, y=0) the nav is
  // FULLY transparent - no colour, no border, no highlight line - and the
  // glossy/blur glass only appears as the user scrolls.
  const highlightAlpha = useTransform(scrollY, range, [0, 0.05], { clamp: true });

  const backdropFilter = useMotionTemplate`saturate(${saturate}%) blur(${blur}px)`;
  const backgroundColor = useMotionTemplate`rgba(10, 14, 26, ${tint})`;
  const borderBottomColor = useMotionTemplate`rgba(255, 255, 255, ${borderAlpha})`;
  const boxShadow = useMotionTemplate`inset 0 1px 0 rgba(255, 255, 255, ${highlightAlpha}), 0 12px 40px rgba(0, 0, 0, ${shadowAlpha})`;

  return {
    backdropFilter,
    WebkitBackdropFilter: backdropFilter,
    backgroundColor,
    borderBottomColor,
    boxShadow,
  };
}

/* ── Content ─────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { href: "#systems", label: "Systems" },
  { href: "#workflow", label: "Workflow" },
  { href: "#export", label: "Export" },
  { href: "/ui-kit", label: "UI Kit" },
] as const;

type SystemId = "salt" | "md3" | "fluent" | "carbon" | "uoaui";
type Mode = "light" | "dark";

interface SystemSpec {
  id: SystemId;
  name: string;
  /** The system's own brand colour. Only tints the active tab underline and
      the wipe edge; the captures themselves are the source of truth. */
  brand: string;
  /** What visibly changes in this system's rendering of the report. */
  trait: string;
}

const SYSTEMS: readonly SystemSpec[] = [
  { id: "salt", name: "Salt DS", brand: "#2670A9", trait: "Square cards, steel blue accent" },
  { id: "md3", name: "Material 3", brand: "#D0BCFF", trait: "Rounded surfaces, tonal violet" },
  { id: "fluent", name: "Fluent 2", brand: "#479EF5", trait: "Quiet borders, Fluent blue" },
  { id: "carbon", name: "Carbon", brand: "#4589FF", trait: "Flat tiles, IBM blue" },
  { id: "uoaui", name: "uoaui", brand: "#A78BFA", trait: "Midnight surfaces, violet accent" },
] as const;

const DEFAULT_SYSTEM: SystemId = "salt";
const DEFAULT_MODE: Mode = "light";

/** Present-mode captures of the ESG Analytics template. Desktop frames are
    1760x1067, phone frames 752x1280. See public/showcase. */
const SHOT = { w: 1760, h: 1067, phoneW: 752, phoneH: 1280 } as const;
const PHONE_QUERY = "(max-width: 640px)";

function shotSrc(id: SystemId, mode: Mode, phone = false): string {
  return `/showcase/esg-${id}-${mode}${phone ? "-phone" : ""}.webp`;
}

function shotAlt(name: string, mode: Mode): string {
  return `The ESG Analytics report rendered in ${name}, ${mode} mode: a summary table of three funds, four score gauges, a rating distribution chart and a sector breakdown, captured from the builder's Present mode.`;
}

/** The builder builds this exact report from this message, with no model
    call (it is the template's own chat command). */
const REPORT_HANDOFF = "/builder?prompt=Build+me+an+ESG+Analytics";

const STEPS = [
  {
    title: "Describe it",
    body: "Type what the report is for, or start from one of 13 finance templates: risk, performance, ESG, climate, screening, FX execution and more.",
  },
  {
    title: "Edit it",
    body: "Select any block and tell the chat what to change. Drag components in from the library and resize them on the grid. Reordering and resizing work from the keyboard too.",
  },
  {
    title: "Present it",
    body: "Switch design system, light or dark, and desktop, tablet or phone without rebuilding. Share the canvas as a link.",
  },
] as const;

const EXPORTS = [
  { name: "React (TSX)", body: "A component file and its stylesheet, importing the real design-system packages." },
  { name: "Vite project", body: "One script that sets up a React and TypeScript project around the report." },
  { name: "HTML", body: "A single page you can open in a browser." },
  { name: "Tokens (JSON)", body: "The active system's tokens in W3C Design Tokens format." },
  { name: "Figma (SVG)", body: "Measured from the live canvas. Imports as editable layers." },
  { name: "SVG", body: "A wireframe of the canvas regions and blocks." },
] as const;

/* First lines of dashboard.tsx as the React exporter wrote it for the ESG
   report in Salt DS, dark mode (captured 2026-10-04). Verbatim: the file's
   first 20 lines, nothing edited. */
const EXPORT_EXCERPT = `"use client";

import React from "react";
import "./styles.css";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "highcharts/highcharts-more";
import "highcharts/modules/solid-gauge";
import "highcharts/modules/heatmap";
import "highcharts/modules/treemap";
import { NavigationItem } from "@salt-ds/core";
import { GridItem, GridLayout, StackLayout } from "@salt-ds/core";
import { SaltProvider } from "@salt-ds/core";
import "@salt-ds/theme/index.css";

export default function Dashboard() {
  return (
    <SaltProvider mode="dark" density="medium">
    <div className="dashboard-layout" data-mode="dark" data-density="medium">
      <a className="skip-link" href="#main-content">Skip to main content</a>`;

/** Light syntax tint for the excerpt: strings and keywords only. The text is
    untouched, so what you read is what the exporter wrote. */
const CODE_TOKEN = /("[^"]*")|\b(import|from|export|default|function|return)\b/g;
function CodeExcerpt({ source }: { source: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of source.matchAll(CODE_TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) parts.push(source.slice(last, at));
    parts.push(
      <span key={at} className={m[1] ? "lsl-code-str" : "lsl-code-kw"}>
        {m[0]}
      </span>,
    );
    last = at + m[0].length;
  }
  parts.push(source.slice(last));
  return <code>{parts}</code>;
}

/** Next prefetches every Link in view, and the builder route is about 2 MB
 *  of script. That is a good trade on a desktop (the handoff is instant) and
 *  a poor one on a phone, so prefetch is opt-in: wide, fine-pointer screens
 *  that have not asked to save data. Everyone else loads the builder on tap. */
const PREFETCH_QUERY = "(min-width: 1241px) and (pointer: fine)";
function subscribePrefetch(onChange: () => void): () => void {
  if (typeof window.matchMedia !== "function") return () => {};
  const mq = window.matchMedia(PREFETCH_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
function canPrefetch(): boolean {
  if (typeof window.matchMedia !== "function") return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !conn?.saveData && window.matchMedia(PREFETCH_QUERY).matches;
}
function useBuilderPrefetch(): false | null {
  const ok = useSyncExternalStore(subscribePrefetch, canPrefetch, () => false);
  return ok ? null : false;
}

/* ── Hero prompt ─────────────────────────────────────────────────────── */

/** The cold-start entry point. A native GET form: submitting navigates to
 *  /builder?prompt=...&ds=...&mode=... with no client JS or router context,
 *  so it works in SSR, in the test renderer and with JS disabled. The builder
 *  reads the prompt, ds and mode query params. The hidden fields carry the
 *  instrument's current system and mode, so the builder opens the way the
 *  visitor left the preview. `required` blocks an empty submit natively. */
function PromptForm({ id, system, mode }: { id: string; system: SystemId; mode: Mode }) {
  return (
    <form className="lsl-hero-prompt" action="/builder" method="get" role="search">
      <label className="lsl-hero-prompt-label" htmlFor={id}>
        Describe the report you want to build
      </label>
      <div className="lsl-hero-prompt-field">
        <input
          id={id}
          name="prompt"
          type="text"
          className="lsl-hero-prompt-input"
          placeholder="Risk summary by fund"
          autoComplete="off"
          enterKeyHint="go"
          required
        />
        <input type="hidden" name="ds" value={system} />
        <input type="hidden" name="mode" value={mode} />
        <button type="submit" className="lsl-hero-prompt-submit">
          Build it
        </button>
      </div>
    </form>
  );
}

/* ── The instrument ──────────────────────────────────────────────────── */

function SunIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="10" cy="10" r="3.4" />
      <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M16.2 12.1A6.8 6.8 0 0 1 7.9 3.8a6.8 6.8 0 1 0 8.3 8.3Z" />
    </svg>
  );
}

/** One capture. Reports when its pixels are decoded so the wipe never
 *  reveals an empty frame. */
function Shot({
  id,
  mode,
  alt,
  eager,
  onReady,
}: {
  id: SystemId;
  mode: Mode;
  alt: string;
  eager: boolean;
  onReady?: () => void;
}) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth > 0) onReady?.();
    // Mount-only: a keyed remount handles every later change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <picture>
      <source
        media={PHONE_QUERY}
        srcSet={shotSrc(id, mode, true)}
        width={SHOT.phoneW}
        height={SHOT.phoneH}
      />
      {/* Plain img inside <picture>: the phone source is art direction (a
          different capture), which next/image does not express. */}
      <img
        ref={ref}
        className={alt ? "lsl-showcase-shot" : "lsl-showcase-ghost-shot"}
        src={shotSrc(id, mode)}
        width={SHOT.w}
        height={SHOT.h}
        alt={alt}
        loading={eager ? "eager" : undefined}
        fetchPriority={eager ? "high" : undefined}
        decoding={eager ? "sync" : "async"}
        onLoad={onReady}
      />
    </picture>
  );
}

/** The hero instrument: an ARIA tablist (one tab per design system) plus a
 *  light/dark control, swapping Present-mode captures of the SAME report.
 *  The frame is fixed by aspect-ratio so only the rendering changes, which is
 *  the point. Roving tabindex + arrow keys + Home/End per the WAI-ARIA tabs
 *  pattern. A change wipes the new skin across the old one; under reduced
 *  motion it is an instant swap (see landing.css). */
function Instrument({
  system,
  mode,
  onChange,
  prefetch,
}: {
  system: SystemId;
  mode: Mode;
  onChange: (system: SystemId, mode: Mode) => void;
  prefetch: false | null;
}) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  /* What was on screen before the last change; it stays underneath while the
     new capture wipes in. Null until the visitor first drives the control, so
     the first paint carries no animation (LCP safe). */
  const [prev, setPrev] = useState<{ system: SystemId; mode: Mode } | null>(null);
  const key = `${system}-${mode}`;
  const [readyKey, setReadyKey] = useState<string | null>(null);

  const change = (nextSystem: SystemId, nextMode: Mode) => {
    if (nextSystem === system && nextMode === mode) return;
    setPrev({ system, mode });
    onChange(nextSystem, nextMode);
  };

  /* On phones only the mode you can switch TO is shown (see landing.css), so
     the pressed button disappears on click. Hand focus to its sibling. */
  const modeRef = useRef<HTMLDivElement>(null);
  const changeMode = (next: Mode) => {
    change(system, next);
    requestAnimationFrame(() => {
      const group = modeRef.current;
      const focused = document.activeElement as HTMLElement | null;
      if (!group || !focused || !group.contains(focused)) return;
      if (focused.offsetParent === null) {
        group.querySelector<HTMLButtonElement>('[aria-pressed="false"]')?.focus();
      }
    });
  };

  const selectAt = (i: number) => {
    const n = (i + SYSTEMS.length) % SYSTEMS.length;
    change(SYSTEMS[n].id, mode);
    tabRefs.current[n]?.focus();
  };

  const onTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        selectAt(i + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        selectAt(i - 1);
        break;
      case "Home":
        e.preventDefault();
        selectAt(0);
        break;
      case "End":
        e.preventDefault();
        selectAt(SYSTEMS.length - 1);
        break;
    }
  };

  /* Warm the other captures once the page is idle, so a switch wipes straight
     to a decoded image. Skipped when the visitor asked to save data. */
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    const phone = window.matchMedia(PHONE_QUERY).matches;
    const warm = () => {
      const other: Mode = mode === "dark" ? "light" : "dark";
      const urls = [
        ...SYSTEMS.filter((s) => s.id !== system).map((s) => shotSrc(s.id, mode, phone)),
        shotSrc(system, other, phone),
      ];
      for (const url of urls) {
        const img = new Image();
        img.fetchPriority = "low";
        img.src = url;
      }
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (h: number) => void;
    };
    if (w.requestIdleCallback) {
      const h = w.requestIdleCallback(warm, { timeout: 2500 });
      return () => w.cancelIdleCallback?.(h);
    }
    const t = window.setTimeout(warm, 1200);
    return () => window.clearTimeout(t);
  }, [system, mode]);

  const active = SYSTEMS.find((s) => s.id === system) ?? SYSTEMS[0];

  return (
    <figure
      id="showcase"
      className="lsl-instrument"
      style={{ "--showcase-brand": active.brand } as React.CSSProperties}
    >
      <div className="lsl-instrument-bar">
        <div
          className="lsl-showcase-tabs"
          role="tablist"
          aria-label="Render the report in a design system"
        >
          {SYSTEMS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              id={`lsl-showcase-tab-${s.id}`}
              aria-selected={system === s.id}
              aria-controls={`lsl-showcase-panel-${s.id}`}
              tabIndex={system === s.id ? 0 : -1}
              className="lsl-showcase-tab"
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              onClick={() => change(s.id, mode)}
              onKeyDown={(e) => onTabKeyDown(e, i)}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div ref={modeRef} className="lsl-mode" role="group" aria-label="Colour mode of the report">
          <button
            type="button"
            className="lsl-mode-btn"
            aria-pressed={mode === "light"}
            onClick={() => changeMode("light")}
          >
            <SunIcon />
            <span>Light</span>
          </button>
          <button
            type="button"
            className="lsl-mode-btn"
            aria-pressed={mode === "dark"}
            onClick={() => changeMode("dark")}
          >
            <MoonIcon />
            <span>Dark</span>
          </button>
        </div>
      </div>

      <div className="lsl-showcase-viewport" data-mode={mode}>
        {prev && (
          <div className="lsl-showcase-ghost" aria-hidden="true">
            <Shot id={prev.system} mode={prev.mode} alt="" eager={false} />
          </div>
        )}
        {SYSTEMS.map((s) => {
          const isActive = system === s.id;
          return (
            <div
              key={s.id}
              role="tabpanel"
              id={`lsl-showcase-panel-${s.id}`}
              aria-labelledby={`lsl-showcase-tab-${s.id}`}
              className="lsl-showcase-panel"
              data-active={isActive ? "true" : undefined}
              aria-hidden={isActive ? undefined : true}
              tabIndex={isActive ? 0 : undefined}
            >
              {isActive && (
                <div
                  key={key}
                  className="lsl-showcase-layer"
                  data-animate={prev ? "true" : undefined}
                  data-ready={readyKey === key ? "true" : undefined}
                >
                  <Shot
                    id={s.id}
                    mode={mode}
                    alt={shotAlt(s.name, mode)}
                    eager={!prev}
                    onReady={() => setReadyKey(key)}
                  />
                </div>
              )}
            </div>
          );
        })}
        {prev && (
          <span
            key={`edge-${key}`}
            className="lsl-showcase-edge"
            data-ready={readyKey === key ? "true" : undefined}
            aria-hidden="true"
          />
        )}
      </div>

      <figcaption className="lsl-showcase-caption">
        <span>
          The ESG Analytics template in Present mode. Real builder output,
          captured, not redrawn.
        </span>
        <Link prefetch={prefetch} className="lsl-inline-link" href={REPORT_HANDOFF}>
          Open this report in the builder
        </Link>
      </figcaption>
    </figure>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const navGlass = useNavGlassStyle();
  const prefetch = useBuilderPrefetch();
  const [system, setSystem] = useState<SystemId>(DEFAULT_SYSTEM);
  const [mode, setMode] = useState<Mode>(DEFAULT_MODE);

  return (
    // `hero` class is required to enable page scroll (see globals.css :has(.hero)).
    <main id="main-content" className="landing-southleft hero">
      {/* ── Nav ── */}
      <motion.nav className="lsl-nav" style={navGlass} aria-label="Primary">
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
          <Link prefetch={prefetch} href="/builder" className="lsl-cta lsl-nav-cta">
            Open the builder
          </Link>
        </div>
      </motion.nav>

      {/* ── Hero: headline, prompt and the instrument in one viewport ── */}
      <section className="lsl-hero" aria-labelledby="lsl-hero-headline">
        <div className="lsl-container lsl-hero-grid">
          <div className="lsl-hero-copy">
            <h1 id="lsl-hero-headline" className="lsl-hero-headline">
              <span>One finance report.</span>{" "}
              <span>Five design systems.</span>
            </h1>
            <p className="lsl-hero-sub">
              Describe the report. Switch the system. Export code that runs.
            </p>
            <PromptForm id="lsl-hero-prompt-input" system={system} mode={mode} />
            <p className="lsl-hero-alt">
              No brief yet?{" "}
              <Link prefetch={prefetch} className="lsl-inline-link" href="/builder">
                Start from a template
              </Link>
            </p>
          </div>
          <Instrument
            system={system}
            mode={mode}
            prefetch={prefetch}
            onChange={(s, m) => {
              setSystem(s);
              setMode(m);
            }}
          />
        </div>
      </section>

      {/* ── Systems: the same report, five at once ── */}
      <section id="systems" className="lsl-section" aria-labelledby="lsl-systems-heading">
        <div className="lsl-container">
          <div className="lsl-section-head">
            <h2 id="lsl-systems-heading" className="lsl-section-heading">
              <span>The layout holds.</span> <span>The system changes.</span>
            </h2>
            <p className="lsl-section-lede">
              The same report at phone width in all five systems. Each one is
              rendered with that system&apos;s own components and tokens, so
              corners, type, colour and density change while the content stays
              where you put it.
            </p>
          </div>
          <ul className="lsl-systems">
            {SYSTEMS.map((s) => (
              <li key={s.id} className="lsl-systems-item">
                <Link prefetch={prefetch}
                  href={`/builder?ds=${s.id}`}
                  className="lsl-syscard"
                  style={{ "--syscard-brand": s.brand } as React.CSSProperties}
                >
                  <span className="lsl-syscard-frame">
                    {/* Plain img: a static capture with fixed dimensions. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={shotSrc(s.id, "dark", true)}
                      width={SHOT.phoneW}
                      height={SHOT.phoneH}
                      loading="lazy"
                      decoding="async"
                      alt={`The report at phone width in ${s.name}, dark mode.`}
                    />
                  </span>
                  <span className="lsl-syscard-name">{s.name}</span>
                  <span className="lsl-syscard-trait">{s.trait}</span>
                  <span className="lsl-syscard-go">Build in {s.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Workflow: describe, edit, present ── */}
      <section id="workflow" className="lsl-section" aria-labelledby="lsl-workflow-heading">
        <div className="lsl-container">
          <div className="lsl-section-head">
            <h2 id="lsl-workflow-heading" className="lsl-section-heading">
              <span>From one sentence</span> <span>to a finished report.</span>
            </h2>
            <p className="lsl-section-lede">
              The canvas is built from real components, so what you edit is
              what you present and what you export.
            </p>
          </div>

          <div className="lsl-workflow-grid">
          <figure className="lsl-demo">
            <div className="lsl-demo-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="lsl-demo-shot"
                src="/showcase/builder-edit.webp"
                width={2000}
                height={1250}
                loading="lazy"
                decoding="async"
                alt="The builder in Edit mode: the chat panel on the left offers the five design systems, and the ESG report on the canvas has its score gauge selected for editing."
              />
            </div>
            <figcaption className="lsl-demo-caption">
              The builder in Edit mode: chat on the left, the live canvas on
              the right, one gauge selected.
            </figcaption>
          </figure>

          <ol className="lsl-steps">
            {STEPS.map((step, i) => (
              <li key={step.title} className="lsl-step">
                <span className="lsl-step-num" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="lsl-step-title">{step.title}</h3>
                <p className="lsl-step-body">{step.body}</p>
              </li>
            ))}
          </ol>
          </div>

          <figure id="demo" className="lsl-concept" aria-label="Concept animation">
            <div className="lsl-concept-frame">
              {/* Playback is explicit for every visitor; the poster is the
                  animation's own frame, so nothing downloads until play. */}
              <video
                className="lsl-concept-video"
                src="/uoaui-demo.mp4"
                muted
                playsInline
                preload="none"
                poster="/showcase/concept-poster.webp"
                controls
                aria-label="Concept animation: one layout moving through five design systems"
              />
            </div>
            <figcaption className="lsl-concept-caption">
              <strong>Prefer to watch?</strong> A 28 second concept animation
              of one layout moving through the five systems. It is an
              illustration of the idea, not a recording of the builder. No
              sound.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── Export: real output ── */}
      <section id="export" className="lsl-section" aria-labelledby="lsl-export-heading">
        <div className="lsl-container lsl-export-grid">
          <div className="lsl-export-copy">
            <h2 id="lsl-export-heading" className="lsl-section-heading">
              <span>Leave with code,</span> <span>not a screenshot.</span>
            </h2>
            <p className="lsl-section-lede">
              Every report exports six ways. The React export imports the
              design system&apos;s own packages, so it runs as the system
              intended.
            </p>
            <dl className="lsl-exports">
              {EXPORTS.map((x) => (
                <div key={x.name} className="lsl-export-row">
                  <dt>{x.name}</dt>
                  <dd>{x.body}</dd>
                </div>
              ))}
            </dl>
          </div>
          <figure className="lsl-code">
            <div className="lsl-code-bar">
              <span className="lsl-code-file">dashboard.tsx</span>
              <span className="lsl-code-meta">Salt DS, dark</span>
            </div>
            <pre className="lsl-code-pre" role="region" tabIndex={0} aria-label="Excerpt of the exported dashboard.tsx">
              <CodeExcerpt source={EXPORT_EXCERPT} />
            </pre>
            <figcaption className="lsl-code-caption">
              The first lines of the React export for the report above, as the
              builder wrote them.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section id="cta" className="lsl-section lsl-cta-band" aria-labelledby="lsl-cta-heading">
        <div className="lsl-container">
          <h2 id="lsl-cta-heading" className="lsl-cta-heading">
            Start with one sentence.
          </h2>
          <p className="lsl-section-lede">
            Describe a report and see it in five systems.
          </p>
          <PromptForm id="lsl-cta-prompt-input" system={system} mode={mode} />
          <div className="lsl-cta-actions">
            <Link prefetch={prefetch} href="/builder" className="lsl-cta-textlink">
              Open the builder
            </Link>
            <Link prefetch={prefetch} href="/ui-kit" className="lsl-cta-textlink">
              Browse the UI Kit
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="about" className="lsl-footer" aria-labelledby="lsl-footer-heading">
        <h2 id="lsl-footer-heading" className="sr-only">
          Site footer
        </h2>
        <div className="lsl-container">
          <div className="lsl-footer-top">
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
            <ul className="lsl-footer-list" aria-label="Product">
              <li><Link prefetch={prefetch} href="/builder">Builder</Link></li>
              <li><Link prefetch={prefetch} href="/ui-kit">UI Kit</Link></li>
              <li><Link prefetch={prefetch} href="/theme-builder">Theme builder</Link></li>
              <li><Link prefetch={prefetch} href="/token-editor">Token editor</Link></li>
            </ul>
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
