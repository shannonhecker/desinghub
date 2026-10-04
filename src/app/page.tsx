"use client";

/**
 * Landing page: "product studio" direction.
 *
 * One idea, executed fully: the same finance screen in two design systems at
 * once, with a divider the visitor drags. The hero pairs a two-line headline
 * and the real prompt with that instrument. Every image under
 * /public/showcase is a capture of the running builder (the Analytics Home
 * template in Present mode, 5 systems x light/dark); nothing is redrawn. The
 * walkthrough video is a screen recording of the builder.
 *
 * Scoping: all styles live behind .landing-southleft (see ./landing.css).
 * Local tokens are --lsl-*; no --dh-* / --a-* / DS tokens are redefined.
 *
 * Scroll: globals.css gates page scroll behind :has(.hero). The root element
 * carries both `landing-southleft` and `hero` so this page scrolls without
 * touching globals.
 *
 * Motion: the divider. It sweeps when the visitor picks a system and makes
 * one short pass on first view; both are skipped under reduced motion. No
 * scroll reveals: all content is visible without JavaScript.
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

import { EXPORT_SAMPLES } from "./landingExports";
import { canPrefetchBuilder, subscribePrefetch } from "./landingPrefetch";
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
  /** Tint for the active tab underline and the divider on the dark page. */
  brand: string;
  /* What this system brings to the screen. Measured from the builder's own
     DOM in Present mode (getComputedStyle on the report body, the search
     field and the primary button), light mode, 2026-10-04. */
  font: string;
  corners: string;
  accent: string;
}

const SYSTEMS: readonly SystemSpec[] = [
  { id: "salt", name: "Salt DS", brand: "#5B9BD1", font: "Open Sans", corners: "4px", accent: "#2670A9" },
  { id: "md3", name: "Material 3", brand: "#D0BCFF", font: "Roboto", corners: "12px", accent: "#6750A4" },
  { id: "fluent", name: "Fluent 2", brand: "#479EF5", font: "Segoe UI", corners: "4px", accent: "#0F6CBD" },
  { id: "carbon", name: "Carbon", brand: "#78A9FF", font: "IBM Plex Sans", corners: "0px", accent: "#0F62FE" },
  { id: "uoaui", name: "uoaui", brand: "#A78BFA", font: "Inter", corners: "12px", accent: "#6B5AA8" },
] as const;

const specOf = (id: SystemId): SystemSpec => SYSTEMS.find((s) => s.id === id) ?? SYSTEMS[0];

const DEFAULT_SYSTEM: SystemId = "salt";
const DEFAULT_COMPARE: SystemId = "md3";
const DEFAULT_MODE: Mode = "light";
const DEFAULT_SPLIT = 50;

/** Present-mode captures of the Analytics Home template. Desktop frames are
    1760x1067, phone frames 752x1280. See public/showcase. */
const SHOT = { w: 1760, h: 1067, phoneW: 752, phoneH: 1280 } as const;
const PHONE_QUERY = "(max-width: 640px)";

function shotSrc(id: SystemId, mode: Mode, phone = false): string {
  return `/showcase/home-${id}-${mode}${phone ? "-phone" : ""}.webp`;
}

function shotAlt(name: string, mode: Mode): string {
  return `The Analytics Home screen rendered in ${name}, ${mode} mode: a search field with its button, four featured report cards with tags, and a filterable list of dashboards, captured from the builder's Present mode.`;
}

/** The facts as one plain phrase. */
function traits(s: SystemSpec): string {
  return `${s.font}, ${s.corners} corners, ${s.accent} accent`;
}

/** What actually differs between two systems, in words. Only real
    differences are named: Salt and Fluent share 4px corners, so corners are
    left out for that pair. */
function differences(a: SystemSpec, b: SystemSpec): string {
  const parts = [`${a.font} against ${b.font}`];
  if (a.corners !== b.corners) parts.push(`${a.corners} corners against ${b.corners}`);
  parts.push(`${a.accent} against ${b.accent}`);
  return parts.join(", ");
}

/** The builder builds this exact screen from this message, with no model
    call (it is the template's own chat command). */
const REPORT_HANDOFF = "/builder?prompt=Build+me+an+Analytics+Home";

/* The three chapters of the walkthrough recording, with the second each
   starts at (logged by the recording script). */
const STEPS = [
  {
    at: 0,
    title: "Describe it",
    body: "Type what the report is for, or start from one of 13 finance templates: risk, performance, ESG, climate, screening, FX execution and more.",
  },
  {
    at: 4.4,
    title: "Edit it",
    body: "Select any block and tell the chat what to change. Drag components in from the library and resize them on the grid. Reordering and resizing work from the keyboard too.",
  },
  {
    at: 8,
    title: "Present it",
    body: "Switch design system, light or dark, and desktop, tablet or phone without rebuilding. Share the canvas as a link.",
  },
] as const;

const clock = (s: number) => `0:${String(Math.floor(s)).padStart(2, "0")}`;

/* ── Small pieces ────────────────────────────────────────────────────── */

/** Light syntax tint for an excerpt: strings and keywords only. The text is
    untouched, so what you read is what the exporter wrote. */
const CODE_TOKEN = /("[^"\n]*")|\b(import|from|export|default|function|return|set|if|then|fi|exit|cd|echo)\b/g;
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

function useBuilderPrefetch(): false | null {
  const ok = useSyncExternalStore(subscribePrefetch, canPrefetchBuilder, () => false);
  return ok ? null : false;
}

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

/* ── Prompt ──────────────────────────────────────────────────────────── */

/** The cold-start entry point. A native GET form: submitting navigates to
 *  /builder?prompt=...&ds=...&mode=... with no client JS or router context,
 *  so it works in SSR, in the test renderer and with JS disabled. The builder
 *  reads the prompt, ds and mode query params. `required` blocks an empty
 *  submit natively.
 *
 *  The system travels with the prompt: as a hidden field that follows the
 *  instrument (hero), or as five visible radio chips (closing band). */
function PromptForm({
  id,
  system,
  mode,
  onSystem,
}: {
  id: string;
  system: SystemId;
  mode: Mode;
  onSystem?: (id: SystemId) => void;
}) {
  return (
    <form className="lsl-hero-prompt" action="/builder" method="get">
      {onSystem && (
        <fieldset className="lsl-chips">
          <legend className="lsl-chips-legend">Start in</legend>
          {SYSTEMS.map((s) => (
            <label
              key={s.id}
              className="lsl-chip"
              style={{ "--chip-brand": s.brand } as React.CSSProperties}
            >
              <input
                type="radio"
                name="ds"
                value={s.id}
                checked={system === s.id}
                onChange={() => onSystem(s.id)}
              />
              <span>{s.name}</span>
            </label>
          ))}
        </fieldset>
      )}
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
        {!onSystem && <input type="hidden" name="ds" value={system} />}
        <input type="hidden" name="mode" value={mode} />
        <button type="submit" className="lsl-hero-prompt-submit">
          Build it
        </button>
      </div>
    </form>
  );
}

/* ── The instrument ──────────────────────────────────────────────────── */

/** One capture. Reports when it has settled (decoded, or failed) so a sweep
 *  never waits on a broken image and never reveals an empty frame. */
function Shot({
  id,
  mode,
  alt,
  onSettled,
}: {
  id: SystemId;
  mode: Mode;
  alt: string;
  onSettled: () => void;
}) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete) onSettled();
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
        className="lsl-showcase-shot"
        src={shotSrc(id, mode)}
        width={SHOT.w}
        height={SHOT.h}
        alt={alt}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        onLoad={onSettled}
        onError={onSettled}
      />
    </picture>
  );
}

const SWEEP_MS = 560;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** The hero instrument: one real screen, two design systems, one divider.
 *
 *  The selected tab's system is on the left of the divider and the system
 *  you came from is on the right. Drag the divider (pointer or touch), or
 *  focus it and use the arrow keys: it is a native range input. Choosing a
 *  tab sweeps the new system in from the left edge to where the divider was.
 *
 *  ARIA: a tablist with roving tabindex + arrow keys + Home/End per the
 *  WAI-ARIA tabs pattern, a labelled slider, and a pressed-state pair for
 *  light/dark. Under reduced motion nothing sweeps: systems swap in place. */
function Instrument({
  system,
  compare,
  mode,
  onChange,
  prefetch,
}: {
  system: SystemId;
  compare: SystemId;
  mode: Mode;
  onChange: (system: SystemId, compare: SystemId, mode: Mode) => void;
  prefetch: false | null;
}) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<HTMLDivElement>(null);
  /* Divider position, 0 to 100: how much of the frame the selected system
     takes. `rest` is where the visitor (or the default) left it. */
  const [split, setSplit] = useState(DEFAULT_SPLIT);
  const rest = useRef(DEFAULT_SPLIT);
  const raf = useRef(0);
  const touched = useRef(false);
  /* Captures that have settled, by "system-mode". A sweep waits for its
     incoming capture; a system only becomes the right-hand side once it has
     actually been seen. */
  const [settled, setSettled] = useState<ReadonlySet<string>>(() => new Set());
  const [sweepFor, setSweepFor] = useState<string | null>(null);

  const baseKey = `${system}-${mode}`;
  const compareKey = `${compare}-${mode}`;
  const settle = (key: string) =>
    setSettled((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));

  const motionOk = () =>
    typeof window.matchMedia === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const stop = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = 0;
  };
  /** Run the divider through a list of [target, duration] legs. */
  const run = (from: number, legs: readonly (readonly [number, number])[]) => {
    stop();
    let i = 0;
    let start = 0;
    let origin = from;
    const tick = (now: number) => {
      if (!start) start = now;
      const [to, ms] = legs[i];
      const t = Math.min(1, (now - start) / ms);
      setSplit(origin + (to - origin) * easeInOut(t));
      if (t < 1) {
        raf.current = requestAnimationFrame(tick);
      } else if (++i < legs.length) {
        origin = to;
        start = 0;
        raf.current = requestAnimationFrame(tick);
      } else {
        raf.current = 0;
      }
    };
    raf.current = requestAnimationFrame(tick);
  };
  useEffect(() => stop, []);

  const change = (nextSystem: SystemId, nextMode: Mode) => {
    if (nextSystem === system && nextMode === mode) return;
    touched.current = true;
    if (nextSystem === system) {
      onChange(system, compare, nextMode);
      return;
    }
    /* The system you leave moves to the right, unless it never rendered
       (a fast A, B, C): then the right-hand side stays as it was. */
    const nextCompare =
      settled.has(baseKey) || nextSystem === compare ? system : compare;
    onChange(nextSystem, nextCompare, nextMode);
    if (motionOk()) {
      stop();
      setSplit(0);
      setSweepFor(`${nextSystem}-${nextMode}`);
    }
  };

  /* Sweep the new system in once its capture has settled. */
  useEffect(() => {
    if (!sweepFor || sweepFor !== baseKey || !settled.has(baseKey)) return;
    setSweepFor(null);
    run(0, [[rest.current, SWEEP_MS]]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sweepFor, baseKey, settled]);

  /* One short demonstration, once, when the frame is first in view: the
     divider travels right, left, and home. Skipped under reduced motion and
     as soon as the visitor touches anything. */
  useEffect(() => {
    const node = viewportRef.current;
    if (!node || typeof IntersectionObserver === "undefined" || !motionOk()) return;
    let timer = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        timer = window.setTimeout(() => {
          if (touched.current) return;
          run(DEFAULT_SPLIT, [
            [76, 620],
            [26, 900],
            [DEFAULT_SPLIT, 620],
          ]);
        }, 900);
      },
      { threshold: 0.6 },
    );
    io.observe(node);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSplitInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    touched.current = true;
    stop();
    setSweepFor(null);
    const v = Number(e.target.value);
    rest.current = v;
    setSplit(v);
  };

  /* On phones only the mode you can switch TO is shown (see landing.css), so
     the pressed button disappears on click. Hand focus to its sibling. */
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

  /* Warm the other captures once the page is idle, so a switch sweeps
     straight to a decoded image. Skipped when the visitor asked to save data. */
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    const phone = window.matchMedia(PHONE_QUERY).matches;
    const warm = () => {
      const other: Mode = mode === "dark" ? "light" : "dark";
      const urls = [
        ...SYSTEMS.filter((s) => s.id !== system && s.id !== compare).map((s) =>
          shotSrc(s.id, mode, phone),
        ),
        shotSrc(system, other, phone),
        shotSrc(compare, other, phone),
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
  }, [system, compare, mode]);

  const a = specOf(system);
  const b = specOf(compare);
  const pct = Math.round(split);

  return (
    <figure
      id="showcase"
      className="lsl-instrument"
      style={
        {
          "--showcase-brand": a.brand,
          "--compare-brand": b.brand,
          "--split-n": split / 100,
        } as React.CSSProperties
      }
    >
      <div className="lsl-instrument-bar">
        <div
          className="lsl-showcase-tabs"
          role="tablist"
          aria-label="Design system on the left of the divider"
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
              data-compare={compare === s.id ? "true" : undefined}
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
        <div ref={modeRef} className="lsl-mode" role="group" aria-label="Colour mode of the screen">
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

      <div ref={viewportRef} className="lsl-showcase-viewport" data-mode={mode}>
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
                <Shot
                  key={baseKey}
                  id={s.id}
                  mode={mode}
                  alt={shotAlt(s.name, mode)}
                  onSettled={() => settle(baseKey)}
                />
              )}
            </div>
          );
        })}
        <div className="lsl-compare-layer" data-system={compare}>
          <Shot
            key={compareKey}
            id={compare}
            mode={mode}
            alt={shotAlt(b.name, mode)}
            onSettled={() => settle(compareKey)}
          />
        </div>
        <input
          className="lsl-split-range"
          type="range"
          min={0}
          max={100}
          step={1}
          value={pct}
          onChange={onSplitInput}
          aria-label={`Divider between ${a.name} and ${b.name}`}
          aria-valuetext={`${a.name} ${pct} percent, ${b.name} ${100 - pct} percent`}
        />
        <span className="lsl-split-line" aria-hidden="true">
          <span className="lsl-split-grip">
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.5 5.5 3.5 10l4 4.5M12.5 5.5l4 4.5-4 4.5" />
            </svg>
          </span>
        </span>
      </div>

      <div className="lsl-legend">
        <p className="lsl-legend-side">
          <span className="lsl-legend-name" data-side="left">{a.name}</span>
          <span className="lsl-legend-traits">{traits(a)}</span>
        </p>
        <p className="lsl-legend-side" data-side="right">
          <span className="lsl-legend-name" data-side="right">{b.name}</span>
          <span className="lsl-legend-traits">{traits(b)}</span>
        </p>
      </div>
      {/* The same comparison as one sentence, announced after a switch. */}
      <p className="lsl-diff sr-only" aria-live="polite">
        {a.name} on the left, {b.name} on the right. What differs:{" "}
        {differences(a, b)}.
      </p>

      <figcaption className="lsl-showcase-caption">
        <span>
          Analytics Home template, Present mode. Real builder output,
          captured, not redrawn.
        </span>
        <Link prefetch={prefetch} className="lsl-inline-link" href={REPORT_HANDOFF}>
          Open this screen in the builder
        </Link>
      </figcaption>
    </figure>
  );
}

/* ── Workflow: the recording with its three chapters ─────────────────── */

function Workflow() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [chapter, setChapter] = useState(-1);

  const playFrom = (at: number) => {
    const v = videoRef.current;
    if (!v) return;
    const seek = () => {
      v.currentTime = at;
    };
    // preload="none": nothing is loaded until this click asks for it.
    if (v.readyState >= 1) seek();
    else v.addEventListener("loadedmetadata", seek, { once: true });
    void v.play()?.catch(() => {});
  };

  const onTime = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const t = e.currentTarget.currentTime;
    let i = -1;
    STEPS.forEach((s, n) => {
      if (t >= s.at) i = n;
    });
    setChapter(i);
  };

  return (
    <div className="lsl-workflow-grid">
      <figure id="demo" className="lsl-demo" aria-label="Builder walkthrough">
        <div className="lsl-demo-frame">
          {/* Playback is explicit for every visitor; the poster is a frame of
              the recording, so nothing downloads until play. */}
          <video
            ref={videoRef}
            className="lsl-demo-video"
            src="/builder-walkthrough.mp4"
            muted
            playsInline
            preload="none"
            poster="/showcase/builder-recording-poster.webp"
            controls
            aria-label="Builder walkthrough video"
            onTimeUpdate={onTime}
            onEnded={() => setChapter(-1)}
          />
        </div>
        <figcaption className="lsl-demo-caption">
          A 21 second screen recording of the builder: pick a template, edit a
          card, present it in five systems. No sound. Nothing loads until you
          press play.
        </figcaption>
      </figure>

      <ol className="lsl-steps">
        {STEPS.map((step, i) => (
          <li key={step.title} className="lsl-step" data-current={chapter === i ? "true" : undefined}>
            <h3 className="lsl-step-title">
              <button
                type="button"
                className="lsl-step-play"
                onClick={() => playFrom(step.at)}
                aria-label={`${step.title}: play the recording from ${clock(step.at)}`}
              >
                <span className="lsl-step-time">{clock(step.at)}</span>
                <span>{step.title}</span>
              </button>
            </h3>
            <p className="lsl-step-body">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ── Export: real output, one file at a time ─────────────────────────── */

function ExportViewer() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const sample = EXPORT_SAMPLES[active];

  const move = (i: number) => {
    const n = (i + EXPORT_SAMPLES.length) % EXPORT_SAMPLES.length;
    setActive(n);
    refs.current[n]?.focus();
  };
  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      move(i + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      move(i - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      move(0);
    } else if (e.key === "End") {
      e.preventDefault();
      move(EXPORT_SAMPLES.length - 1);
    }
  };

  return (
    <figure className="lsl-code">
      <div className="lsl-code-tabs" role="tablist" aria-label="Exported files">
        {EXPORT_SAMPLES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            id={`lsl-code-tab-${s.id}`}
            aria-selected={active === i}
            aria-controls="lsl-code-panel"
            tabIndex={active === i ? 0 : -1}
            className="lsl-code-tab"
            ref={(el) => {
              refs.current[i] = el;
            }}
            onClick={() => setActive(i)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {s.file}
          </button>
        ))}
      </div>
      <div
        id="lsl-code-panel"
        role="tabpanel"
        aria-labelledby={`lsl-code-tab-${sample.id}`}
        className="lsl-code-panel"
      >
        <pre className="lsl-code-pre" tabIndex={0}>
          <CodeExcerpt source={sample.source} />
        </pre>
        <p className="lsl-code-more">
          Lines 1 to {sample.shown} of {sample.total}
        </p>
      </div>
      <figcaption className="lsl-code-caption">
        <strong>{sample.format}.</strong> {sample.note} Exported from the
        screen above in Salt DS, dark, exactly as the builder wrote it.
      </figcaption>
    </figure>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const navGlass = useNavGlassStyle();
  const prefetch = useBuilderPrefetch();
  const [system, setSystem] = useState<SystemId>(DEFAULT_SYSTEM);
  const [compare, setCompare] = useState<SystemId>(DEFAULT_COMPARE);
  const [mode, setMode] = useState<Mode>(DEFAULT_MODE);

  /** From the closing band's chips: same rule as the tabs, no sweep. */
  const chooseSystem = (next: SystemId) => {
    if (next === system) return;
    setCompare(system);
    setSystem(next);
  };

  return (
    // `hero` class is required to enable page scroll (see globals.css :has(.hero)).
    <div className="landing-southleft hero">
      <motion.header className="lsl-nav" style={navGlass}>
        <nav className="lsl-container lsl-nav-inner" aria-label="Primary">
            <Link prefetch={false} href="/" className="lsl-logo" aria-label="uoaui.ai home">
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
        </nav>
      </motion.header>

      <main id="main-content">
        {/* ── Hero: headline, prompt and the instrument in one viewport ── */}
        <section className="lsl-hero" aria-labelledby="lsl-hero-headline">
          <div className="lsl-container lsl-hero-grid">
            <div className="lsl-hero-copy">
              <h1 id="lsl-hero-headline" className="lsl-hero-headline">
                <span>One finance screen.</span>{" "}
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
              compare={compare}
              mode={mode}
              prefetch={prefetch}
              onChange={(s, c, m) => {
                setSystem(s);
                setCompare(c);
                setMode(m);
              }}
            />
          </div>
        </section>

        {/* ── Systems: the same two parts, five at once ── */}
        <section id="systems" className="lsl-section" aria-labelledby="lsl-systems-heading">
          <div className="lsl-container">
            <div className="lsl-section-head">
              <h2 id="lsl-systems-heading" className="lsl-section-heading">
                <span>The layout holds.</span> <span>The system changes.</span>
              </h2>
              <p className="lsl-section-lede">
                The same search field and the same report card, cut from the
                real canvas in each system. The corners, the typeface and the
                accent come from that system&apos;s own components and tokens.
                The content stays where you put it.
              </p>
            </div>
            <ul className="lsl-systems">
              {SYSTEMS.map((s) => (
                <li key={s.id} className="lsl-systems-item">
                  <Link
                    prefetch={prefetch}
                    href={`/builder?ds=${s.id}`}
                    className="lsl-syscard"
                    style={{ "--syscard-brand": s.brand } as React.CSSProperties}
                  >
                    <span className="lsl-syscard-frame">
                      {/* Plain img: static captures with fixed dimensions. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/showcase/part-search-${s.id}.webp`}
                        width={744}
                        height={204}
                        loading="lazy"
                        decoding="async"
                        alt={`The search field and its button in ${s.name}.`}
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/showcase/part-card-${s.id}.webp`}
                        width={786}
                        height={948}
                        loading="lazy"
                        decoding="async"
                        alt={`The Portfolio report card in ${s.name}.`}
                      />
                    </span>
                    <span className="lsl-syscard-name">{s.name}</span>
                    <span className="lsl-syscard-trait">
                      {s.font}. {s.corners} corners. Accent {s.accent}.
                    </span>
                    <span className="lsl-syscard-go">Build in {s.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Workflow: describe, edit, present ── */}
        <section id="workflow" className="lsl-section lsl-band" aria-labelledby="lsl-workflow-heading">
          <div className="lsl-container">
            <div className="lsl-section-head">
              <h2 id="lsl-workflow-heading" className="lsl-section-heading">
                <span>From one sentence</span> <span>to a finished report.</span>
              </h2>
              <p className="lsl-section-lede">
                The canvas is built from real components, so what you edit is
                what you present and what you export. Pick a chapter to watch
                it happen.
              </p>
            </div>
            <Workflow />
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
                Six formats: React, a Vite project, HTML, design tokens, and
                two kinds of SVG, one of them measured for Figma. These are
                the files, not a description of them.
              </p>
              <p className="lsl-export-proof">
                We ran the Vite export of this screen: it installed, passed
                the TypeScript check and built.
              </p>
            </div>
            <ExportViewer />
          </div>
        </section>

        {/* ── Closing band: the prompt, with the system in hand ── */}
        <section id="cta" className="lsl-section lsl-cta-band" aria-labelledby="lsl-cta-heading">
          <div className="lsl-container lsl-cta-grid">
            <div>
              <h2 id="lsl-cta-heading" className="lsl-cta-heading">
                <span>Start with</span> <span>one sentence.</span>
              </h2>
              <p className="lsl-section-lede">
                Pick the system, describe the report, and the builder opens
                with both.
              </p>
            </div>
            <div className="lsl-cta-panel">
              <PromptForm
                id="lsl-cta-prompt-input"
                system={system}
                mode={mode}
                onSystem={chooseSystem}
              />
              <div className="lsl-cta-actions">
                <Link prefetch={prefetch} href="/builder" className="lsl-cta-textlink">
                  Open the builder
                </Link>
                <Link prefetch={prefetch} href="/ui-kit" className="lsl-cta-textlink">
                  Browse the UI Kit
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

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
    </div>
  );
}
