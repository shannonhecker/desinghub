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
import {
  SYSTEMS,
  differences,
  specOf,
  type Accent,
  type Mode,
  type SystemId,
} from "./landingSystems";
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

const DEFAULT_SYSTEM: SystemId = "salt";
const DEFAULT_COMPARE: SystemId = "md3";
const DEFAULT_MODE: Mode = "dark";
const DEFAULT_SPLIT = 50;

/** Present-mode captures of the Analytics Home template, at device pixel
    ratio 2. Each frame is a board of whole controls cut from that one screen
    and set on the system's own surface: the search field with its button,
    the workspace tabs, the Class and Theme filters and the first rows of the
    table. Nothing is redrawn or resized: on a 1440 screen every control is
    shown at its real size. The parts were chosen so that each half of the
    frame holds a primary control or an accent, plus a control whose shape
    differs between systems (see the task report for the measurements).
    Wide boards are 710x317 CSS px, phone boards 361x296. */
const SHOT = { w: 1420, h: 634, phoneW: 722, phoneH: 592 } as const;
const PHONE_QUERY = "(max-width: 640px)";

function shotSrc(id: SystemId, mode: Mode, phone = false): string {
  return `/showcase/cmp-${id}-${mode}${phone ? "-phone" : ""}.webp`;
}

function shotAlt(name: string, mode: Mode): string {
  return `Parts of the Analytics Dashboard screen rendered in ${name}, ${mode} mode: the search field and its button, the workspace tabs, the Class and Theme filters and the first rows of the dashboards table, captured from the builder's Present mode.`;
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
    body: "Type what the screen is for, or start from one of 13 finance templates: risk, performance, ESG, climate, screening, FX execution and more.",
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
  skip,
}: {
  id: string;
  system: SystemId;
  mode: Mode;
  onSystem?: (id: SystemId) => void;
  /** The system on the hero's right side: arrow keys step over it, so the
      keyboard never changes a side the visitor did not pick. */
  skip?: SystemId;
}) {
  const chipsRef = useRef<HTMLFieldSetElement>(null);
  const onChipKey = (e: React.KeyboardEvent<HTMLFieldSetElement>) => {
    const step =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step || !onSystem) return;
    e.preventDefault();
    const at = SYSTEMS.findIndex((s) => s.id === system);
    let n = (at + step + SYSTEMS.length) % SYSTEMS.length;
    if (SYSTEMS[n].id === skip) n = (n + step + SYSTEMS.length) % SYSTEMS.length;
    onSystem(SYSTEMS[n].id);
    chipsRef.current?.querySelectorAll<HTMLInputElement>("input")[n]?.focus();
  };
  return (
    <form className="lsl-hero-prompt" action="/builder" method="get">
      {onSystem && (
        <fieldset className="lsl-chips" ref={chipsRef} onKeyDown={onChipKey}>
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
        Describe the screen you want to build
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

/** One capture, as a stable element: its sources change, it never remounts,
 *  so the old picture stays on screen until the new one has decoded. Reports
 *  when the current source has settled (decoded, or failed). */
function Shot({
  id,
  mode,
  alt,
  priority,
  onSettled,
}: {
  id: SystemId;
  mode: Mode;
  alt: string;
  priority: "high" | "auto";
  onSettled: (key: string) => void;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const key = `${id}-${mode}`;
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete) onSettled(key);
    // Re-check whenever the source changes (a cached image fires no event
    // we can rely on across browsers).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
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
        fetchPriority={priority}
        decoding="async"
        onLoad={() => onSettled(key)}
        onError={() => onSettled(key)}
      />
    </picture>
  );
}

function Swatch({ accent }: { accent: Accent }) {
  return (
    <span
      className="lsl-swatch"
      style={{ "--swatch": accent.hex } as React.CSSProperties}
      title={accent.hex}
      aria-hidden="true"
    />
  );
}

const SWEEP_MS = 560;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** The hero instrument: one real screen, two design systems, one divider.
 *
 *  Two plain controls choose the sides: the "Left" tabs and the "Right"
 *  options. Nothing changes a side the visitor did not pick, with one
 *  exception that is announced: choosing the system that is already on the
 *  other side swaps the two. Drag the divider (pointer or touch), or focus
 *  it and use the arrow keys: it is a native range input. A change sweeps
 *  the new capture in from its own edge once it has decoded.
 *
 *  ARIA: a tablist (roving tabindex, arrow keys, Home/End) with one stable
 *  tabpanel, a radiogroup, a labelled slider, and a pressed-state pair for
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
  const figureRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<HTMLDivElement>(null);
  /* Where the divider rests, 0 to 100: how much of the frame the left system
     takes. React owns this value. While a sweep runs, the moving position is
     written straight to the --split-n custom property and React is left
     alone, so the slider's value text is not rewritten sixty times a second. */
  const [rest, setRest] = useState(DEFAULT_SPLIT);
  const restRef = useRef(DEFAULT_SPLIT);
  const raf = useRef(0);
  const touched = useRef(false);
  const inView = useRef(false);
  const demoDone = useRef(false);
  /* Captures that have settled, by "system-mode". */
  const settled = useRef(new Set<string>());
  /* A sweep waiting for its capture: which key, and from which edge. */
  const pending = useRef<{ key: string; from: 0 | 100 } | null>(null);

  const leftKey = `${system}-${mode}`;
  const rightKey = `${compare}-${mode}`;

  const motionOk = () =>
    typeof window.matchMedia === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const paint = (v: number) =>
    figureRef.current?.style.setProperty("--split-n", String(v / 100));
  const stop = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = 0;
  };
  /** Move the divider through a list of [target, duration] legs. */
  const run = (from: number, legs: readonly (readonly [number, number])[]) => {
    stop();
    let i = 0;
    let start = 0;
    let origin = from;
    const tick = (now: number) => {
      if (!start) start = now;
      const [to, ms] = legs[i];
      const t = Math.min(1, (now - start) / ms);
      paint(origin + (to - origin) * easeInOut(t));
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

  /** One short demonstration, once: the divider travels right, left, and
   *  home. It waits until the frame is in view AND both captures have
   *  settled, and never runs under reduced motion or after a touch. */
  const maybeDemo = () => {
    if (demoDone.current || touched.current || !inView.current) return;
    if (!settled.current.has(leftKey) || !settled.current.has(rightKey)) return;
    if (!motionOk()) return;
    demoDone.current = true;
    run(restRef.current, [
      [76, 620],
      [26, 900],
      [restRef.current, 620],
    ]);
  };

  const onSettled = (key: string) => {
    settled.current.add(key);
    const p = pending.current;
    if (p && p.key === key) {
      pending.current = null;
      run(p.from, [[restRef.current, SWEEP_MS]]);
    }
    maybeDemo();
  };

  useEffect(() => {
    const node = viewportRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        inView.current = true;
        io.disconnect();
        maybeDemo();
      },
      { threshold: 0.6 },
    );
    io.observe(node);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Start a sweep for a side that just changed: park the divider on that
   *  side's edge (the other capture covers the frame), then travel to rest
   *  once the new capture has settled. */
  const sweep = (key: string, from: 0 | 100) => {
    if (!motionOk()) return;
    stop();
    paint(from);
    if (settled.current.has(key)) run(from, [[restRef.current, SWEEP_MS]]);
    else pending.current = { key, from };
  };

  const setLeft = (next: SystemId) => {
    if (next === system) return;
    touched.current = true;
    // Picking the system that is on the right swaps the two sides.
    const nextRight = next === compare ? system : compare;
    onChange(next, nextRight, mode);
    sweep(`${next}-${mode}`, 0);
  };
  const setRight = (next: SystemId) => {
    if (next === compare || next === system) return;
    touched.current = true;
    onChange(system, next, mode);
    sweep(`${next}-${mode}`, 100);
  };

  const onSplitInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    touched.current = true;
    stop();
    pending.current = null;
    const v = Number(e.target.value);
    restRef.current = v;
    setRest(v);
    paint(v);
  };

  /* When only the icon toggle is shown (see landing.css) the pressed button
     disappears on click. Hand focus to its sibling. */
  const changeMode = (next: Mode) => {
    if (next === mode) return;
    touched.current = true;
    /* A sweep still waiting for its capture now waits for that system's
       capture in the new mode, so the divider can never stay parked. */
    const p = pending.current;
    if (p) {
      const waiting = p.from === 0 ? system : compare;
      pending.current = { key: `${waiting}-${next}`, from: p.from };
    }
    onChange(system, compare, next);
    requestAnimationFrame(() => {
      const group = modeRef.current;
      const focused = document.activeElement as HTMLElement | null;
      if (!group || !focused || !group.contains(focused)) return;
      if (focused.offsetParent === null) {
        group.querySelector<HTMLButtonElement>('[aria-pressed="false"]')?.focus();
      }
    });
  };

  /* Arrow keys walk the Left row but step over the system that is on the
     right: a side the visitor did not pick never changes from the keyboard.
     (A click or Enter on that tab is an explicit choice, and swaps.) */
  const selectAt = (i: number, step: 1 | -1) => {
    let n = (i + SYSTEMS.length) % SYSTEMS.length;
    if (SYSTEMS[n].id === compare) n = (n + step + SYSTEMS.length) % SYSTEMS.length;
    setLeft(SYSTEMS[n].id);
    tabRefs.current[n]?.focus();
  };

  const onTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        selectAt(i + 1, 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        selectAt(i - 1, -1);
        break;
      case "Home":
        e.preventDefault();
        selectAt(0, 1);
        break;
      case "End":
        e.preventDefault();
        selectAt(SYSTEMS.length - 1, -1);
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

  return (
    <figure
      ref={figureRef}
      id="showcase"
      className="lsl-instrument"
      style={
        {
          "--showcase-brand": a.brand,
          "--compare-brand": b.brand,
          "--split-n": rest / 100,
        } as React.CSSProperties
      }
    >
      <div className="lsl-instrument-bar">
        <div className="lsl-sides">
          <div className="lsl-side">
            <span className="lsl-side-label" id="lsl-side-left">
              Left
            </span>
            <div className="lsl-showcase-tabs" role="tablist" aria-labelledby="lsl-side-left">
              {SYSTEMS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  id={`lsl-showcase-tab-${s.id}`}
                  aria-selected={system === s.id}
                  aria-controls="lsl-showcase-panel"
                  tabIndex={system === s.id ? 0 : -1}
                  className="lsl-showcase-tab"
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  onClick={() => setLeft(s.id)}
                  onKeyDown={(e) => onTabKeyDown(e, i)}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <div className="lsl-side">
            <span className="lsl-side-label" id="lsl-side-right">
              Right
            </span>
            <div className="lsl-showcase-tabs" role="radiogroup" aria-labelledby="lsl-side-right">
              {SYSTEMS.map((s) => (
                <label
                  key={s.id}
                  className="lsl-showcase-tab lsl-side-option"
                  data-checked={compare === s.id ? "true" : undefined}
                  data-disabled={system === s.id ? "true" : undefined}
                >
                  <input
                    type="radio"
                    name="lsl-right-side"
                    value={s.id}
                    checked={compare === s.id}
                    disabled={system === s.id}
                    onChange={() => setRight(s.id)}
                  />
                  <span>{s.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="lsl-stage">
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
      <div ref={viewportRef} className="lsl-showcase-viewport" data-mode={mode}>
        <div
          role="tabpanel"
          id="lsl-showcase-panel"
          aria-labelledby={`lsl-showcase-tab-${system}`}
          className="lsl-showcase-panel"
          data-system={system}
          tabIndex={0}
        >
          <Shot id={system} mode={mode} alt={shotAlt(a.name, mode)} priority="high" onSettled={onSettled} />
        </div>
        <div className="lsl-compare-layer" data-system={compare}>
          <Shot id={compare} mode={mode} alt={shotAlt(b.name, mode)} priority="auto" onSettled={onSettled} />
        </div>
        <input
          className="lsl-split-range"
          type="range"
          min={0}
          max={100}
          step={1}
          value={rest}
          onChange={onSplitInput}
          aria-label={`Divider between ${a.name} and ${b.name}`}
          aria-valuetext={`${a.name} ${rest} percent, ${b.name} ${100 - rest} percent`}
        />
        <span className="lsl-split-line" aria-hidden="true">
          <span className="lsl-split-grip">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.5 5.5 3.5 10l4 4.5M12.5 5.5l4 4.5-4 4.5" />
            </svg>
          </span>
        </span>
        {/* Which system is on which side, said inside the frame. The legend
            below carries the same names for assistive technology. */}
        <span className="lsl-corner" data-side="left" aria-hidden="true">
          {a.name}
        </span>
        <span className="lsl-corner" data-side="right" aria-hidden="true">
          {b.name}
        </span>
      </div>
      </div>

      <div className="lsl-legend">
        <p className="lsl-legend-side" data-side="left">
          <span className="lsl-legend-name">{a.name}</span>
          <span className="lsl-legend-traits">
            {a.font}, {a.corners === "0px" ? "square corners" : `${a.corners} corners`},{" "}
            <Swatch accent={a.accent[mode]} />
            {a.accent[mode].name}
          </span>
        </p>
        <p className="lsl-legend-side" data-side="right">
          <span className="lsl-legend-name">{b.name}</span>
          <span className="lsl-legend-traits">
            {b.font}, {b.corners === "0px" ? "square corners" : `${b.corners} corners`},{" "}
            <Swatch accent={b.accent[mode]} />
            {b.accent[mode].name}
          </span>
        </p>
      </div>
      {/* The same comparison as one sentence, announced after a change. */}
      <p className="lsl-diff sr-only" aria-live="polite">
        {a.name} on the left, {b.name} on the right. What differs:{" "}
        {differences(a, b, mode)}.
      </p>

      <figcaption className="lsl-showcase-caption">
        <span>
          Controls from the Analytics Dashboard screen (the builder&apos;s
          Analytics Home template), cut whole and set side by side. Real
          builder output, captured, not redrawn.
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
          A 22 second screen recording of the builder: pick a template, edit a
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
          Lines {sample.from} to {sample.from + sample.shown - 1} of {sample.total}
        </p>
      </div>
      <figcaption className="lsl-code-caption">
        <strong>{sample.format}.</strong> {sample.note} Exported from the
        Analytics Dashboard screen in Salt DS, dark, exactly as the builder
        wrote it.
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

  /** From the closing band's chips: sets the left side, like the tabs.
   *  Picking the system that is on the right swaps the two. */
  const chooseSystem = (next: SystemId) => {
    if (next === system) return;
    if (next === compare) setCompare(system);
    setSystem(next);
  };

  return (
    // `hero` class is required to enable page scroll (see globals.css :has(.hero)).
    <div className="landing-southleft hero">
      <header className="lsl-header">
        <motion.nav className="lsl-nav" style={navGlass} aria-label="Primary">
          <div className="lsl-container lsl-nav-inner">
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
          </div>
        </motion.nav>
      </header>

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
                Describe the screen. Switch the system. Export code that runs.
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
                The same search field and the same report card, whole, on each
                system&apos;s own surface. The corners, the typeface and the
                accent come from that system&apos;s components and tokens. The
                content stays where you put it.
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
                    <span
                      className="lsl-syscard-frame"
                      style={{ "--sheet": s.surface } as React.CSSProperties}
                    >
                      {/* Plain img: static captures with fixed dimensions. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/showcase/part-search-${s.id}.webp`}
                        width={730}
                        height={144}
                        loading="lazy"
                        decoding="async"
                        alt={`The whole search field and its button in ${s.name}, dark mode.`}
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/showcase/part-card-${s.id}.webp`}
                        width={730}
                        height={656}
                        loading="lazy"
                        decoding="async"
                        alt={`The whole Portfolio report card in ${s.name}, dark mode.`}
                      />
                    </span>
                    <span className="lsl-syscard-name">{s.name}</span>
                    <span className="lsl-syscard-trait">
                      {s.font}. {s.corners === "0px" ? "Square corners" : `${s.corners} corners`}.{" "}
                      <Swatch accent={s.accent.dark} />
                      <span className="lsl-syscard-accent">{s.accent.dark.name}</span>
                    </span>
                    <span className="lsl-syscard-go">Build in {s.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="lsl-systems-hint">Swipe sideways for all five.</p>
          </div>
        </section>

        {/* ── Workflow: describe, edit, present ── */}
        <section id="workflow" className="lsl-section lsl-band" aria-labelledby="lsl-workflow-heading">
          <div className="lsl-container">
            <div className="lsl-section-head">
              <h2 id="lsl-workflow-heading" className="lsl-section-heading">
                <span>From one sentence</span> <span>to a finished screen.</span>
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
                Pick the system, describe the screen, and the builder opens
                with both.
              </p>
            </div>
            <div className="lsl-cta-panel">
              <PromptForm
                id="lsl-cta-prompt-input"
                system={system}
                mode={mode}
                onSystem={chooseSystem}
                skip={compare}
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
