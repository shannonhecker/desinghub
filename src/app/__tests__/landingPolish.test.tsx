/* ════════════════════════════════════════════════════════════
   Landing ("product studio" direction): structure, copy, instrument
   and reduced-motion contract tests.

   Covers the 2026-10 landing brief (site-quality task 9):
   - First viewport: two-line headline, one line of supporting copy,
     the real prompt, and the instrument (real captures of one screen in
     two design systems at once, with a divider the visitor drags).
   - IA: nav Systems / Workflow / Export / UI Kit, sections #systems,
     #workflow, #export, #cta, footer #about.
   - Truthful copy only: the three unverified claims are gone, the
     captures are described as captures, the walkthrough is a real
     screen recording of the builder.
   - Handoff: the prompt carries the chosen system and mode into the
     builder; system links and the report link use real builder params.
   - No content hidden behind JS reveals; hero h1 paints at opacity 1.
   - No em/en dashes anywhere in rendered display copy (STOP-class).
   - Reduced motion: every CSS animation/transition is guarded, the
     divider never sweeps; the video never autoplays and only downloads
     on play.

   Uses react-dom/client + act() directly (no RTL in the repo),
   matching codePanel.test.tsx.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import LandingPage from "../page";
import { EXPORT_SAMPLES } from "../landingExports";
import { INTENT_DWELL_MS, isHoverPointer, prefetchFor, savesData } from "../landingPrefetch";
import { SYSTEMS, differences, traits } from "../landingSystems";
import { contrastRatio } from "@/lib/contrastUtils";

const CSS_PATH = resolve(process.cwd(), "src/app/landing.css");
const PAGE_PATH = resolve(process.cwd(), "src/app/page.tsx");

/* ── jsdom shims ─────────────────────────────────────────────── */

function stubMatchMedia(reduceMatches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? reduceMatches : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

beforeAll(() => {
  // react-dom/client + act() without RTL needs this flag.
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  class IOStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  // @ts-expect-error — jsdom has no IntersectionObserver
  window.IntersectionObserver = IOStub;
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  stubMatchMedia(false);
});

let root: Root | null = null;
let container: HTMLDivElement | null = null;

afterEach(() => {
  if (root) {
    const r = root;
    act(() => r.unmount());
    root = null;
  }
  container?.remove();
  container = null;
});

function renderPage(): HTMLElement {
  container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container!);
    root.render(<LandingPage />);
  });
  return container;
}

const norm = (s: string | null | undefined) =>
  (s ?? "").replace(/\s+/g, " ").trim();

/* ── 1. IA: nav labels + section ids ─────────────────────────── */

describe("nav + anchor IA", () => {
  it("nav links read Systems / Workflow / Export / UI Kit with matching targets", () => {
    const el = renderPage();
    const links = Array.from(
      el.querySelectorAll<HTMLAnchorElement>(".lsl-nav-link"),
    ).map((a) => [norm(a.textContent), a.getAttribute("href")]);
    expect(links).toEqual([
      ["Systems", "#systems"],
      ["Workflow", "#workflow"],
      ["Export", "#export"],
      ["UI Kit", "/ui-kit"],
    ]);
  });

  it("every in-page nav anchor resolves to a section on the page", () => {
    const el = renderPage();
    const anchors = Array.from(
      el.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'),
    ).map((a) => a.getAttribute("href")!);
    expect(anchors.length).toBeGreaterThanOrEqual(3);
    anchors.forEach((href) => expect(el.querySelector(href)).not.toBeNull());
  });

  it("section ids #systems, #workflow, #export, #cta exist; retired ids are gone", () => {
    const el = renderPage();
    expect(el.querySelector("#systems")).not.toBeNull();
    expect(el.querySelector("#workflow")).not.toBeNull();
    expect(el.querySelector("#export")).not.toBeNull();
    expect(el.querySelector("#cta")).not.toBeNull();
    expect(el.querySelector("#services")).toBeNull();
    expect(el.querySelector("#tokens")).toBeNull();
    expect(el.querySelector("#projects")).toBeNull();
    expect(el.querySelector("#voices")).toBeNull();
  });

  it("landing.css carries no stale #projects / #voices selectors", () => {
    const css = readFileSync(CSS_PATH, "utf8");
    expect(css).not.toMatch(/#projects\b/);
    expect(css).not.toMatch(/#voices\b/);
  });

  it("the nav action and the footer reach the real product routes", () => {
    const el = renderPage();
    expect(
      norm(el.querySelector<HTMLAnchorElement>('.lsl-nav a[href="/builder"]')?.textContent),
    ).toBe("Open the builder");
    const footerHrefs = Array.from(
      el.querySelectorAll<HTMLAnchorElement>("#about .lsl-footer-list a"),
    ).map((a) => a.getAttribute("href"));
    expect(footerHrefs).toEqual(["/builder", "/ui-kit", "/theme-builder", "/token-editor"]);
  });
});

/* ── 2. Copy ─────────────────────────────────────────────────── */

describe("copy", () => {
  it("hero headline is two lines, one sentence each", () => {
    const el = renderPage();
    const h1 = el.querySelector("#lsl-hero-headline");
    const lines = Array.from(h1?.querySelectorAll("span") ?? []).map((s) =>
      norm(s.textContent),
    );
    expect(lines).toEqual(["One finance screen.", "Five design systems."]);
    expect(norm(h1?.textContent)).toBe("One finance screen. Five design systems.");
    // No single-word accent inside the headline.
    expect(h1?.querySelector("em")).toBeNull();
  });

  it("hero carries one line of concrete supporting copy", () => {
    const el = renderPage();
    expect(norm(el.querySelector(".lsl-hero-sub")?.textContent)).toBe(
      "Describe the screen. Switch the system. Export code that runs.",
    );
  });

  it("has no decorative eyebrow or section labels", () => {
    const el = renderPage();
    expect(el.querySelector(".lsl-hero-eyebrow")).toBeNull();
    expect(el.querySelector(".lsl-section-label")).toBeNull();
  });

  it("does not make the three claims the product cannot demonstrate", () => {
    const el = renderPage();
    const text = norm(el.textContent);
    // Automatic three-layout generation, inline token diffs, and keyboard
    // parity for EVERY drag were audited against the builder and removed.
    expect(text).not.toMatch(/three layouts/i);
    expect(text).not.toMatch(/token diff/i);
    expect(text).not.toMatch(/every drag/i);
    // No invented social proof.
    expect(text).not.toMatch(/trusted by|customers|teams use/i);
  });

  it("systems heading and lede say what the strip shows", () => {
    const el = renderPage();
    expect(norm(el.querySelector("#systems .lsl-section-heading")?.textContent)).toBe(
      "The layout holds. The system changes.",
    );
    expect(norm(el.querySelector("#systems .lsl-section-lede")?.textContent)).toBe(
      "The same search field and the same report card, whole, on each system's own surface. The corners, the typeface and the accent come from that system's components and tokens. The content stays where you put it.",
    );
  });

  it("workflow is a three-step sequence: describe, edit, present", () => {
    const el = renderPage();
    expect(norm(el.querySelector("#workflow .lsl-section-heading")?.textContent)).toBe(
      "From one sentence to a finished screen.",
    );
    const steps = Array.from(el.querySelectorAll("#workflow ol.lsl-steps > li"));
    expect(
      steps.map((s) => norm(s.querySelector(".lsl-step-play span:last-child")?.textContent)),
    ).toEqual(["Describe it", "Edit it", "Present it"]);
    // The keyboard claim is the narrow, verified one (reorder + resize).
    expect(norm(steps[1].textContent)).toContain(
      "Reordering and resizing work from the keyboard too.",
    );
  });

  it("export section shows real files, one tab per format", () => {
    const el = renderPage();
    expect(norm(el.querySelector("#export .lsl-section-heading")?.textContent)).toBe(
      "Leave with code, not a screenshot.",
    );
    const tabs = Array.from(el.querySelectorAll('#export [role="tab"]'));
    expect(tabs.map((t) => norm(t.textContent))).toEqual([
      "dashboard.tsx",
      "dashboard.html",
    ]);
    // No file on the landing carries the exporter's old product name.
    expect(norm(el.querySelector("#export")?.textContent)).not.toMatch(/design.?hub/i);
    for (const sample of EXPORT_SAMPLES) expect(sample.file + sample.source).not.toMatch(/design.?hub/i);
    expect(tabs.filter((t) => t.getAttribute("aria-selected") === "true")).toHaveLength(1);
    // The lede names all six formats the Export Code dialog offers.
    const lede = norm(el.querySelector("#export .lsl-section-lede")?.textContent);
    for (const word of ["React", "Vite", "HTML", "tokens", "SVG", "Figma"]) {
      expect(lede).toContain(word);
    }
    // And it claims only what the viewer shows: two of the six, as excerpts.
    expect(lede).toMatch(/^Six formats: /);
    expect(lede).toMatch(/the opening lines of two of the six, exactly as the builder wrote them\.$/);
    expect(tabs).toHaveLength(2);
    expect(lede).not.toMatch(/These are the files/);
  });

  it("export excerpt is real exporter output with the design system's own imports", () => {
    const el = renderPage();
    const code = el.querySelector("#export pre")?.textContent ?? "";
    expect(code).toContain('import { SaltProvider } from "@salt-ds/core";');
    expect(code).toContain('import "@salt-ds/theme/index.css";');
    expect(code).toContain("export default function Dashboard() {");
    // The syntax tint must not alter the text.
    expect(code).toBe(EXPORT_SAMPLES[0].source);
    expect(code.split("\n")).toHaveLength(20);
    expect(norm(el.querySelector("#export .lsl-code-more")?.textContent)).toBe(
      "Lines 1 to 20 of 128",
    );
  });

  it("every export sample states its true length and switches by click and arrow key", () => {
    for (const s of EXPORT_SAMPLES) {
      expect(s.source.split("\n")).toHaveLength(s.shown);
      expect(s.total).toBeGreaterThan(s.from + s.shown - 1);
      expect(s.source).not.toMatch(/[–—]/);
    }
    const el = renderPage();
    const tabs = Array.from(el.querySelectorAll<HTMLButtonElement>('#export [role="tab"]'));
    act(() => {
      tabs[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    expect(el.querySelector("#export pre")?.textContent).toBe(EXPORT_SAMPLES[1].source);
    expect(el.querySelector("#lsl-code-panel")?.getAttribute("aria-labelledby")).toBe(tabs[1].id);
    expect(norm(el.querySelector("#export .lsl-code-more")?.textContent)).toBe("Lines 1 to 9 of 545");
    tabs[1].focus();
    act(() => {
      tabs[1].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    });
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[0]);
    expect(norm(el.querySelector("#export .lsl-code-caption")?.textContent)).toContain(
      "exactly as the builder wrote it",
    );
  });

  it("CTA band closes on the prompt, with both secondary routes", () => {
    const el = renderPage();
    const band = el.querySelector("#cta");
    expect(norm(band?.querySelector(".lsl-cta-heading")?.textContent)).toBe(
      "Start with one sentence.",
    );
    expect(norm(band?.querySelector(".lsl-section-lede")?.textContent)).toBe(
      "Pick the system, describe the screen, and the builder opens with both.",
    );
    expect(band?.querySelector('form[action="/builder"] input[name="prompt"]')).not.toBeNull();
    const primary = band?.querySelector<HTMLAnchorElement>('a[href="/builder"]');
    expect(norm(primary?.textContent)).toBe("Open the builder");
    const secondary = band?.querySelector<HTMLAnchorElement>('a[href="/ui-kit"]');
    expect(norm(secondary?.textContent)).toBe("Browse the UI Kit");
  });

  it("footer copy stays verbatim", () => {
    const el = renderPage();
    const footer = el.querySelector("#about");
    const body = norm(footer?.textContent);
    expect(body).toContain(
      "A workbench for designing across five systems. Built by a design engineer who got tired of choosing.",
    );
    expect(body).toContain("Built with restraint.");
  });

  it("rendered display copy contains no em or en dashes", () => {
    const el = renderPage();
    expect(el.textContent).not.toMatch(/[–—]/);
  });
});

/* ── 3. First paint: nothing waits on JS ─────────────────────── */

describe("first paint", () => {
  it("no content is hidden behind a scroll reveal", () => {
    const el = renderPage();
    // The old page set opacity 0 on 34 [data-reveal] nodes until an
    // IntersectionObserver fired; without JS the page stayed blank.
    expect(el.querySelectorAll("[data-reveal]")).toHaveLength(0);
    expect(readFileSync(CSS_PATH, "utf8")).not.toMatch(/data-reveal/);
  });

  it("both captures in the frame load eagerly at high priority, split down the middle", () => {
    const el = renderPage();
    const imgs = Array.from(
      el.querySelectorAll<HTMLImageElement>("#showcase img.lsl-showcase-shot"),
    );
    expect(imgs).toHaveLength(2);
    imgs.forEach((img) => expect(img.getAttribute("loading")).toBe("eager"));
    // Only the left capture claims high priority, so two images do not
    // compete for the largest paint.
    expect(imgs.map((img) => img.getAttribute("fetchpriority"))).toEqual(["high", "auto"]);
    // First paint is the resting state: no sweep is pending.
    expect(
      (el.querySelector("#showcase") as HTMLElement).style.getPropertyValue("--split-n"),
    ).toBe("0.5");
  });

  it("headline, prompt and instrument share the hero section", () => {
    const el = renderPage();
    const hero = el.querySelector("section.lsl-hero");
    expect(hero?.querySelector("#lsl-hero-headline")).not.toBeNull();
    expect(hero?.querySelector("form.lsl-hero-prompt")).not.toBeNull();
    expect(hero?.querySelector("#showcase")).not.toBeNull();
  });
});

/* ── 4. User-controlled concept animation ────────────────────── */

describe("video WCAG 2.2.2 gating", () => {
  it("keeps demo bytes deferred and playback under user control", () => {
    stubMatchMedia(false);
    const el = renderPage();
    const video = el.querySelector("video");
    expect(video?.hasAttribute("autoplay")).toBe(false);
    expect(video?.hasAttribute("loop")).toBe(false);
    expect(video?.getAttribute("preload")).toBe("none");
    expect(video?.hasAttribute("controls")).toBe(true);
    expect(video?.getAttribute("poster")).toBeTruthy();
    expect(video?.getAttribute("aria-hidden")).not.toBe("true");
  });

  it("does not autoplay or loop under prefers-reduced-motion", async () => {
    // framer-motion caches the reduced-motion state at module level in
    // motion-dom (lazy init on first useReducedMotion call), so flipping
    // the matchMedia stub alone is not seen by a later render. Set the
    // shared refs directly for this case, then restore.
    const { prefersReducedMotion, hasReducedMotionListener } = await import(
      "motion-dom"
    );
    const prevPref = prefersReducedMotion.current;
    const prevHas = hasReducedMotionListener.current;
    hasReducedMotionListener.current = true; // block re-init from matchMedia
    prefersReducedMotion.current = true;
    try {
      const el = renderPage();
      const video = el.querySelector("video");
      expect(video?.hasAttribute("autoplay")).toBe(false);
      expect(video?.hasAttribute("loop")).toBe(false);
    } finally {
      prefersReducedMotion.current = prevPref;
      hasReducedMotionListener.current = prevHas;
    }
  });

  it("the walkthrough is the real recording, with its own frame as poster", () => {
    const el = renderPage();
    const fig = el.querySelector("#demo");
    const video = fig?.querySelector("video");
    expect(video?.getAttribute("src")).toBe("/builder-walkthrough.mp4");
    expect(video?.getAttribute("poster")).toBe("/showcase/builder-recording-poster.webp");
    expect(existsSync(resolve(process.cwd(), "public/builder-walkthrough.mp4"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "public/showcase/builder-recording-poster.webp"))).toBe(true);
    const caption = norm(fig?.querySelector("figcaption")?.textContent);
    expect(caption).toMatch(/screen recording of the builder/i);
    expect(caption).toMatch(/nothing loads until you press play/i);
    expect(norm(el.textContent)).not.toMatch(/live capture|concept animation/i);
  });

  it("the old concept clip stays in the repo but the page no longer references it", () => {
    expect(existsSync(resolve(process.cwd(), "public/uoaui-demo.mp4"))).toBe(true);
    expect(readFileSync(PAGE_PATH, "utf8")).not.toContain("uoaui-demo.mp4");
  });

  it("each chapter button seeks the recording and plays it, and only then", () => {
    const el = renderPage();
    const video = el.querySelector<HTMLVideoElement>("#demo video")!;
    const play = vi.fn().mockResolvedValue(undefined);
    video.play = play;
    Object.defineProperty(video, "readyState", { value: 1, configurable: true });
    const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>("#workflow .lsl-step-play"));
    expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual([
      "Describe it: play the recording from 0:00",
      "Edit it: play the recording from 0:04",
      "Present it: play the recording from 0:08",
    ]);
    expect(play).not.toHaveBeenCalled();
    act(() => {
      buttons[2].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(video.currentTime).toBe(8);
    expect(play).toHaveBeenCalledTimes(1);
    // The playing chapter is marked on the timeline.
    act(() => {
      video.dispatchEvent(new Event("timeupdate", { bubbles: true }));
    });
    const current = el.querySelectorAll('#workflow .lsl-step[data-current="true"]');
    expect(current).toHaveLength(1);
    expect(norm(current[0].querySelector(".lsl-step-play span:last-child")?.textContent)).toBe(
      "Present it",
    );
  });
});

/* ── 5. Reduced-motion CSS guards ────────────────────────────── */

function reduceBlocks(css: string): string {
  // Concatenate the body of every @media (prefers-reduced-motion: reduce) block.
  const out: string[] = [];
  const re = /@media[^{]*prefers-reduced-motion:\s*reduce[^{]*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    let depth = 1;
    let i = re.lastIndex;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      i++;
    }
    out.push(css.slice(re.lastIndex, i - 1));
  }
  return out.join("\n");
}

describe("reduced-motion guards in landing.css", () => {
  const css = readFileSync(CSS_PATH, "utf8");
  const guarded = reduceBlocks(css);

  it("has at least one prefers-reduced-motion block", () => {
    expect(guarded.length).toBeGreaterThan(0);
  });

  it.each([
    ".lsl-nav", // entrance fade killed
    ".lsl-nav-link", // underline-grow appears instantly
    ".lsl-cta", // hover fill applies instantly
    ".lsl-hero-prompt-submit", // hover fill applies instantly
    ".lsl-split-grip", // divider grip hover scale killed
    ".lsl-chip", // chip state applies instantly
    ".lsl-step", // chapter rail applies instantly
    ".lsl-code-tab", // file tab applies instantly
    ".lsl-showcase-tab", // tab colour/underline shift applies instantly
    ".lsl-mode-btn", // mode control applies instantly
    ".lsl-syscard", // lift killed
    ".lsl-cta-textlink", // underline appears instantly
  ])("guards %s", (selector) => {
    expect(guarded).toContain(selector);
  });

  it("every keyframes animation applied outside the guard is named inside a reduce block or restored to a static state", () => {
    // Strip reduce blocks, find `animation: <name>` usages, and require the
    // selector's class to also appear inside some reduce block.
    const unguarded = css.replace(
      /@media[^{]*prefers-reduced-motion:\s*reduce[^{]*\{[\s\S]*?\n\}/g,
      "",
    );
    const ruleRe = /\.landing-southleft\s+([^{}]+)\{[^{}]*animation:[^{}]*\}/g;
    let m: RegExpExecArray | null;
    const offenders: string[] = [];
    let seen = 0;
    while ((m = ruleRe.exec(unguarded))) {
      seen++;
      const selector = m[1].trim();
      const cls = selector.match(/\.[\w-]+/)?.[0];
      if (cls && !guarded.includes(cls.replace(/-\d+$/, "-"))) {
        offenders.push(selector);
      }
    }
    expect(seen).toBeGreaterThanOrEqual(1); // the nav fade is the only CSS animation
    expect(offenders).toEqual([]);
  });

  it("the divider sweep is driven from script and gated on the motion preference", () => {
    // No CSS animation or transition moves the divider, so there is nothing
    // for a stylesheet to leave running under reduced motion.
    expect(css).not.toMatch(/\.lsl-(compare-layer|split-line)[^{]*\{[^}]*(animation|transition):/);
    const src = readFileSync(PAGE_PATH, "utf8");
    expect(src).toContain('window.matchMedia("(prefers-reduced-motion: reduce)").matches');
  });

  it("no looping animation anywhere on the page", () => {
    expect(css).not.toMatch(/\binfinite\b/);
  });
});

/* ── 6. Structure ────────────────────────────────────────────── */

describe("section structure", () => {
  it("sections run hero, systems, workflow, export, cta inside main; footer after", () => {
    const el = renderPage();
    const main = el.querySelector("main");
    const kids = Array.from(main?.children ?? []);
    expect(kids[0]?.classList.contains("lsl-hero")).toBe(true);
    expect(kids.map((c) => c.id).filter(Boolean)).toEqual(["systems", "workflow", "export", "cta"]);
    expect(main?.nextElementSibling?.id).toBe("about");
  });

  it("landmarks: one main for the content, with the banner and footer outside it", () => {
    const el = renderPage();
    expect(el.querySelectorAll("main")).toHaveLength(1);
    const main = el.querySelector("main")!;
    expect(main.id).toBe("main-content"); // the skip link's target
    const header = el.querySelector("header");
    expect(header?.querySelector('nav[aria-label="Primary"]')).not.toBeNull();
    expect(main.contains(header)).toBe(false);
    expect(main.contains(el.querySelector("footer"))).toBe(false);
    // The prompt is a build form, not a search landmark.
    expect(el.querySelector('[role="search"]')).toBeNull();
  });

  it("every section is labelled by its own heading", () => {
    const el = renderPage();
    const sections = el.querySelectorAll("main > section");
    expect(sections).toHaveLength(5);
    sections.forEach((sec) => {
      const id = sec.getAttribute("aria-labelledby");
      expect(id).toBeTruthy();
      expect(sec.querySelector(`#${id}`)).not.toBeNull();
    });
    expect(el.querySelectorAll("h1")).toHaveLength(1);
  });

  it("page.tsx keeps the sanctioned dual backdrop-filter inline pattern only in useNavGlassStyle", () => {
    const src = readFileSync(PAGE_PATH, "utf8");
    expect(src).toContain("WebkitBackdropFilter: backdropFilter");
    // The dual-prefix form must never appear in the CSS file.
    const cssSrc = readFileSync(CSS_PATH, "utf8");
    expect(cssSrc).not.toMatch(/-webkit-backdrop-filter/);
  });

  it("carries no decorative aurora or blob layers", () => {
    const el = renderPage();
    expect(el.querySelector(".lsl-hero-aurora, .lsl-cta-aurora")).toBeNull();
    expect(readFileSync(CSS_PATH, "utf8")).not.toMatch(/radial-gradient/);
  });
});

/* ── 7. Text contrast: WCAG 1.4.3 on the page background ─────── */
/* The page is one flat background now (the drifting aurora that the old
   composite proof guarded is gone), so the proof is direct: every text
   colour token, composited over --lsl-bg, must clear AA for body text.
   Colours are parsed from landing.css so a token tweak fails loudly. */

type RGBA = [number, number, number, number];

function cssVarFallback(css: string, name: string): string {
  // Definition shape: --name: var(--a-..., FALLBACK);
  const m = css.match(
    new RegExp(`${name}:\\s*var\\([^,()]+,\\s*(.+?)\\)\\s*;`),
  );
  if (!m) throw new Error(`No var fallback literal found for ${name}`);
  return m[1].trim();
}

function parseColor(value: string): RGBA {
  const v = value.trim();
  const rgba = v.match(
    /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/,
  );
  if (rgba) return [+rgba[1], +rgba[2], +rgba[3], +rgba[4]];
  const hex = v.match(/^#([0-9a-fA-F]{6})$/);
  if (hex) {
    const h = hex[1];
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
      1,
    ];
  }
  throw new Error(`Unparseable CSS color: ${value}`);
}

/* sRGB alpha-over: composite a translucent layer onto an opaque base. */
function over(base: RGBA, layer: RGBA): RGBA {
  const a = layer[3];
  return [
    layer[0] * a + base[0] * (1 - a),
    layer[1] * a + base[1] * (1 - a),
    layer[2] * a + base[2] * (1 - a),
    1,
  ];
}

function toHex(c: RGBA): string {
  return (
    "#" +
    c
      .slice(0, 3)
      .map((v) => Math.round(v).toString(16).padStart(2, "0"))
      .join("")
  );
}

describe("text contrast on the page background (WCAG 1.4.3, AA 4.5:1)", () => {
  const css = readFileSync(CSS_PATH, "utf8");
  const token = (name: string) => parseColor(cssVarFallback(css, name));
  const ratioOn = (fg: string, bg: string) => {
    const base = token(bg);
    return contrastRatio(toHex(over(base, token(fg))), toHex(base));
  };

  it.each([
    ["--lsl-fg", "--lsl-bg"],
    ["--lsl-fg-muted", "--lsl-bg"], // ledes, captions, step bodies
    ["--lsl-fg-subtle", "--lsl-bg-elevated"], // prompt placeholder
    ["--lsl-accent", "--lsl-bg"], // step numbers, "Build in" links
    ["--lsl-fg-muted", "--lsl-bg-soft"], // code panel meta
    ["--lsl-teal", "--lsl-bg-soft"], // code strings
    ["--lsl-accent", "--lsl-bg-soft"], // code keywords
  ])("%s on %s clears AA", (fg, bg) => {
    expect(ratioOn(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("the prompt submit label clears AA on the accent fill", () => {
    const ratio = contrastRatio(toHex(token("--lsl-bg")), toHex(token("--lsl-accent")));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("uses no text colour below the audited tokens", () => {
    // Every `color:` in the file resolves to an audited token (or inherit).
    const colours = Array.from(css.matchAll(/[^-]color:\s*([^;]+);/g)).map((m) =>
      m[1].trim(),
    );
    const allowed = /^(var\(--lsl-(fg|fg-strong|fg-muted|fg-subtle|accent|accent-hover|bg|teal)\)|inherit)$/;
    expect(colours.filter((c) => !allowed.test(c))).toEqual([]);
  });
});

/* ── 8. The instrument (hero system switcher) ────────────────── */

describe("instrument", () => {
  const sectionOf = (el: HTMLElement): HTMLElement => {
    const s = el.querySelector<HTMLElement>("#showcase");
    if (!s) throw new Error("#showcase instrument not found");
    return s;
  };
  const tabsOf = (sec: HTMLElement) =>
    Array.from(sec.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const tab = (sec: HTMLElement, name: string) =>
    tabsOf(sec).find((t) => norm(t.textContent) === name)!;
  const rightOf = (sec: HTMLElement) =>
    Array.from(sec.querySelectorAll<HTMLInputElement>('[role="radiogroup"] input[type="radio"]'));
  const right = (sec: HTMLElement, id: string) => rightOf(sec).find((r) => r.value === id)!;
  const click = (node: Element) =>
    act(() => {
      node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  const leftImg = (sec: HTMLElement) =>
    sec.querySelector<HTMLImageElement>('[role="tabpanel"] img.lsl-showcase-shot');
  const rightImg = (sec: HTMLElement) =>
    sec.querySelector<HTMLImageElement>(".lsl-compare-layer img.lsl-showcase-shot");
  const splitOf = (sec: HTMLElement) => sec.style.getPropertyValue("--split-n");
  const modeBtn = (sec: HTMLElement, label: string) =>
    Array.from(sec.querySelectorAll<HTMLButtonElement>(".lsl-mode-btn")).find(
      (b) => norm(b.textContent) === label,
    )!;
  const NAMES = ["Salt DS", "Material 3", "Fluent 2", "Carbon", "uoaui"];
  const IDS = ["salt", "md3", "fluent", "carbon", "uoaui"];

  it("lives in the hero, not below the fold", () => {
    const el = renderPage();
    expect(sectionOf(el).closest("section")?.classList.contains("lsl-hero")).toBe(true);
  });

  it("has two plainly labelled controls: Left tabs and Right options", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const tablist = sec.querySelector('[role="tablist"]')!;
    const group = sec.querySelector('[role="radiogroup"]')!;
    const nameOf = (node: Element) =>
      norm(sec.querySelector(`#${node.getAttribute("aria-labelledby")}`)?.textContent);
    expect(nameOf(tablist)).toBe("Left");
    expect(nameOf(group)).toBe("Right");
    // The labels are visible text, not hidden.
    sec.querySelectorAll(".lsl-side-label").forEach((l) =>
      expect(l.classList.contains("sr-only")).toBe(false),
    );
    expect(tabsOf(sec).map((t) => norm(t.textContent))).toEqual(NAMES);
    expect(rightOf(sec).map((r) => r.value)).toEqual(IDS);
    expect(
      rightOf(sec).map((r) => norm(r.closest("label")?.textContent)),
    ).toEqual(NAMES);
  });

  /* The first pair a visitor sees is one whose primary buttons read in both
     modes (Material 3's dark capture has a pale label on pale lilac). */
  it("starts with Salt on the left and uoaui on the right, in dark mode", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const tabs = tabsOf(sec);
    const selected = tabs.filter((t) => t.getAttribute("aria-selected") === "true");
    expect(selected.map((t) => norm(t.textContent))).toEqual(["Salt DS"]);
    // Roving tabindex.
    expect(selected[0].getAttribute("tabindex")).toBe("0");
    tabs
      .filter((t) => t.getAttribute("aria-selected") !== "true")
      .forEach((t) => expect(t.getAttribute("tabindex")).toBe("-1"));
    expect(rightOf(sec).filter((r) => r.checked).map((r) => r.value)).toEqual(["uoaui"]);
    expect(leftImg(sec)?.getAttribute("src")).toBe("/showcase/cmp-salt-dark.webp");
    expect(rightImg(sec)?.getAttribute("src")).toBe("/showcase/cmp-uoaui-dark.webp");
    // Material 3 is still there to pick, on either side.
    expect(tab(sec, "Material 3")).toBeTruthy();
    expect(right(sec, "md3").disabled).toBe(false);
    expect(modeBtn(sec, "Dark").getAttribute("aria-pressed")).toBe("true");
  });

  it("uses one stable tabpanel that every tab controls and the selected tab labels", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const panels = sec.querySelectorAll('[role="tabpanel"]');
    expect(panels).toHaveLength(1);
    const panel = panels[0];
    tabsOf(sec).forEach((t) => expect(t.getAttribute("aria-controls")).toBe(panel.id));
    expect(panel.getAttribute("aria-labelledby")).toBe(tab(sec, "Salt DS").id);
    expect(panel.getAttribute("tabindex")).toBe("0");
    click(tab(sec, "Carbon"));
    expect(sec.querySelectorAll('[role="tabpanel"]')[0]).toBe(panel);
    expect(panel.getAttribute("aria-labelledby")).toBe(tab(sec, "Carbon").id);
  });

  it("maps every system and mode to its own capture, wide and phone", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const seen = new Set<string>();
    for (const mode of ["light", "dark"] as const) {
      click(modeBtn(sec, mode === "light" ? "Light" : "Dark"));
      NAMES.forEach((label, i) => {
        click(tab(sec, label));
        const img = leftImg(sec);
        expect(img?.getAttribute("src")).toBe(`/showcase/cmp-${IDS[i]}-${mode}.webp`);
        const phone = img?.parentElement?.querySelector("source");
        expect(phone?.getAttribute("srcset")).toBe(`/showcase/cmp-${IDS[i]}-${mode}-phone.webp`);
        expect(phone?.getAttribute("media")).toBe("(max-width: 640px)");
        seen.add(img!.getAttribute("src")!);
      });
    }
    expect(seen.size).toBe(10);
  });

  it("every capture the page references exists in public/showcase", () => {
    const files = new Set<string>(["builder-recording-poster.webp"]);
    for (const id of IDS) {
      files.add(`part-search-${id}.webp`);
      files.add(`part-card-${id}.webp`);
      for (const mode of ["light", "dark"]) {
        files.add(`cmp-${id}-${mode}.webp`);
        files.add(`cmp-${id}-${mode}-phone.webp`);
      }
    }
    expect(files.size).toBe(31);
    files.forEach((f) =>
      expect(existsSync(resolve(process.cwd(), "public/showcase", f)), f).toBe(true),
    );
    // And every /showcase path written in the page is one of them.
    const src = readFileSync(PAGE_PATH, "utf8");
    Array.from(src.matchAll(/\/showcase\/([\w-]+\.webp)/g)).forEach((m) =>
      expect(files.has(m[1]), m[1]).toBe(true),
    );
  });

  it("both captures have descriptive, honest alt text", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const left = leftImg(sec)?.getAttribute("alt") ?? "";
    const rightAlt = rightImg(sec)?.getAttribute("alt") ?? "";
    expect(left).toMatch(/Analytics Dashboard screen rendered in Salt DS, dark mode/);
    expect(rightAlt).toMatch(/Analytics Dashboard screen rendered in uoaui, dark mode/);
    for (const alt of [left, rightAlt]) {
      expect(alt).toMatch(/search field/);
      expect(alt).not.toMatch(/mock|placeholder|illustration/i);
      // STOP-class no-dash rule applies to alt copy too (read aloud by AT).
      expect(alt).not.toMatch(/[–—]/);
    }
    // The second capture is content, not decoration.
    expect(sec.querySelector(".lsl-compare-layer")?.hasAttribute("aria-hidden")).toBe(false);
  });

  it("every capture reserves layout (width/height) so nothing shifts", () => {
    const el = renderPage();
    const imgs = Array.from(el.querySelectorAll<HTMLImageElement>("img"));
    expect(imgs.length).toBeGreaterThanOrEqual(12);
    imgs.forEach((img) => {
      expect(img.getAttribute("width")).toBeTruthy();
      expect(img.getAttribute("height")).toBeTruthy();
    });
    // Below-the-fold captures defer and never compete with the hero.
    const strip = Array.from(
      el.querySelectorAll<HTMLImageElement>("#systems img"),
    );
    expect(strip).toHaveLength(10); // a search field and a card per system
    strip.forEach((img) => {
      expect(img.getAttribute("loading")).toBe("lazy");
      expect(img.getAttribute("alt") ?? "").toMatch(/^The whole /);
    });
    expect(new Set(strip.map((img) => img.getAttribute("src"))).size).toBe(10);
  });

  it("a Left tab changes only the left side", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    click(tab(sec, "Carbon"));
    expect(tab(sec, "Carbon").getAttribute("aria-selected")).toBe("true");
    expect(tabsOf(sec).filter((t) => t.getAttribute("aria-selected") === "true")).toHaveLength(1);
    expect(leftImg(sec)?.getAttribute("src")).toBe("/showcase/cmp-carbon-dark.webp");
    // The right side is untouched.
    expect(rightImg(sec)?.getAttribute("src")).toBe("/showcase/cmp-uoaui-dark.webp");
    expect(right(sec, "uoaui").checked).toBe(true);
  });

  it("a Right option changes only the right side", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    click(right(sec, "md3"));
    expect(rightOf(sec).filter((r) => r.checked).map((r) => r.value)).toEqual(["md3"]);
    expect(rightImg(sec)?.getAttribute("src")).toBe("/showcase/cmp-md3-dark.webp");
    expect(leftImg(sec)?.getAttribute("src")).toBe("/showcase/cmp-salt-dark.webp");
    expect(tab(sec, "Salt DS").getAttribute("aria-selected")).toBe("true");
  });

  it("the left system cannot also be picked on the right", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    expect(rightOf(sec).filter((r) => r.disabled).map((r) => r.value)).toEqual(["salt"]);
    click(tab(sec, "Fluent 2"));
    expect(rightOf(sec).filter((r) => r.disabled).map((r) => r.value)).toEqual(["fluent"]);
  });

  it("picking the right-hand system on the left swaps the two, and says so", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    click(tab(sec, "uoaui"));
    expect(leftImg(sec)?.getAttribute("src")).toBe("/showcase/cmp-uoaui-dark.webp");
    expect(rightImg(sec)?.getAttribute("src")).toBe("/showcase/cmp-salt-dark.webp");
    expect(right(sec, "salt").checked).toBe(true);
    expect(norm(sec.querySelector('.lsl-diff[aria-live="polite"]')?.textContent)).toMatch(
      /^uoaui on the left, Salt DS on the right\./,
    );
  });

  it("keeps the same two img elements and swaps their sources", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const l = leftImg(sec);
    const r = rightImg(sec);
    click(tab(sec, "Carbon"));
    click(right(sec, "md3"));
    click(modeBtn(sec, "Light"));
    // No remount: the old picture stays on screen until the new one decodes.
    expect(leftImg(sec)).toBe(l);
    expect(rightImg(sec)).toBe(r);
    expect(l?.getAttribute("src")).toBe("/showcase/cmp-carbon-light.webp");
    expect(r?.getAttribute("src")).toBe("/showcase/cmp-md3-light.webp");
  });

  it("while a new capture loads the divider stays put, and the waiting side says so", async () => {
    const el = renderPage();
    const sec = sectionOf(el);
    expect(splitOf(sec)).toBe("0.5");
    expect(sec.hasAttribute("data-waiting")).toBe(false);
    // The frame never sits at an edge (one system on both halves) waiting
    // for a capture: both systems stay on screen until it arrives.
    click(tab(sec, "Carbon"));
    expect(splitOf(sec)).toBe("0.5");
    expect(sec.getAttribute("data-waiting")).toBe("left");
    click(right(sec, "md3"));
    expect(splitOf(sec)).toBe("0.5");
    expect(sec.getAttribute("data-waiting")).toBe("right");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });
    expect(splitOf(sec)).toBe("0.5");
    // The waiting side's name goes quiet; nothing else changes.
    const css = readFileSync(CSS_PATH, "utf8");
    expect(css).toMatch(
      /\.lsl-instrument\[data-waiting="right"\] \.lsl-corner\[data-side="right"\]\s*\{\s*color:\s*var\(--lsl-fg-subtle\);/,
    );
    // When the capture settles the divider goes to that side's edge and
    // leaves it in the same moment.
    act(() => {
      rightImg(sec)!.dispatchEvent(new Event("load"));
    });
    expect(splitOf(sec)).toBe("1");
    expect(sec.hasAttribute("data-waiting")).toBe(false);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });
    expect(Number(splitOf(sec))).toBeLessThan(1);
    expect(Number(splitOf(sec))).toBeGreaterThan(0.5);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 700));
    });
    expect(splitOf(sec)).toBe("0.5");
    // The slider's own value and text stay at rest; they are not rewritten
    // while the divider is moving.
    const range = sec.querySelector<HTMLInputElement>(".lsl-split-range")!;
    expect(range.value).toBe("50");
    expect(range.getAttribute("aria-valuetext")).toBe("Carbon 50 percent, Material 3 50 percent");
  });

  it("under reduced motion a change leaves the divider where it is", () => {
    stubMatchMedia(true);
    try {
      const el = renderPage();
      const sec = sectionOf(el);
      click(tab(sec, "Carbon"));
      click(right(sec, "md3"));
      expect(leftImg(sec)?.getAttribute("src")).toBe("/showcase/cmp-carbon-dark.webp");
      expect(splitOf(sec)).toBe("0.5");
    } finally {
      stubMatchMedia(false);
    }
  });

  it("the divider is a labelled slider: input moves it and names both sides", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const range = sec.querySelector<HTMLInputElement>('input[type="range"].lsl-split-range')!;
    expect(range.getAttribute("aria-label")).toBe("Divider between Salt DS and uoaui");
    expect(range.min).toBe("0");
    expect(range.max).toBe("100");
    expect(range.value).toBe("50");
    expect(range.getAttribute("aria-valuetext")).toBe("Salt DS 50 percent, uoaui 50 percent");
    // React listens for the native input event on a range control.
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    act(() => {
      setValue.call(range, "30");
      range.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(splitOf(sec)).toBe("0.3");
    expect(range.getAttribute("aria-valuetext")).toBe("Salt DS 30 percent, uoaui 70 percent");
    // The visible line and grip are decoration for the real control.
    expect(sec.querySelector(".lsl-split-line")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("names each side inside the frame, next to the divider", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const chips = () =>
      Array.from(sec.querySelectorAll(".lsl-showcase-viewport .lsl-corner")).map((c) => [
        c.getAttribute("data-side"),
        norm(c.textContent),
      ]);
    expect(chips()).toEqual([
      ["left", "Salt DS"],
      ["right", "uoaui"],
    ]);
    click(right(sec, "carbon"));
    expect(chips()).toEqual([
      ["left", "Salt DS"],
      ["right", "Carbon"],
    ]);
    // They follow the divider (both move with --split-cq) and are clamped
    // to the frame's corners, so they cannot be cut off at either edge.
    const css = readFileSync(CSS_PATH, "utf8");
    expect(css).toMatch(/\.lsl-corner\[data-side="left"\]\s*\{[^}]*left:\s*var\(--lsl-float-gap\);[^}]*max\(0px, calc\(var\(--split-cq\)/);
    expect(css).toMatch(/\.lsl-corner\[data-side="right"\]\s*\{[^}]*right:\s*var\(--lsl-float-gap\);[^}]*min\(0px, calc\(var\(--split-cq\)/);
    // Their size and shadow come from tokens, not literals.
    const corner = css.match(/\.landing-southleft \.lsl-corner \{([^}]*)\}/)![1];
    expect(corner).toMatch(/box-shadow:\s*var\(--lsl-shadow-float\)/);
    expect(corner).toMatch(/height:\s*var\(--lsl-float-h\)/);
    expect(corner).toMatch(/font-size:\s*var\(--lsl-float-text\)/);
    expect(corner).not.toMatch(/rgba\(/);
    expect(corner).not.toMatch(/\d+px/);
    // They ride in the board's empty band with the grip, never over the
    // last row of the table.
    expect(corner).toMatch(/top:\s*var\(--grip-y\)/);
    expect(corner).not.toMatch(/bottom:/);
    expect(css).toMatch(/\.lsl-split-grip\s*\{[^}]*top:\s*var\(--grip-y\)/);
    // A raised tone on a dark board, so the chip reads as a chip.
    expect(corner).toMatch(/background:\s*var\(--float-chip\)/);
    expect(css).toMatch(/\.lsl-showcase-viewport\s*\{[^}]*--float-chip:\s*var\(--lsl-bg-elevated\)/);
    // Near an edge the losing side lets go of its name, so the two never
    // overlap: gone below 12 percent on the left and above 88 on the right.
    expect(css).toMatch(/\.lsl-showcase-viewport\s*\{[^}]*--chip-lo:\s*0\.12;/);
    expect(css).toMatch(/\.lsl-corner\[data-side="left"\]\s*\{[^}]*opacity:\s*clamp\(0, calc\(\(var\(--split-n, 0\.5\) - var\(--chip-lo\)\) \* 25\), 1\)/);
    expect(css).toMatch(/\.lsl-corner\[data-side="right"\]\s*\{[^}]*opacity:\s*clamp\(0, calc\(\(1 - var\(--chip-lo\) - var\(--split-n, 0\.5\)\) \* 25\), 1\)/);
  });

  it("the legend shows the accent as a swatch and a plain name, never as spoken hex", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const sides = Array.from(sec.querySelectorAll(".lsl-legend-side")).map((p) => norm(p.textContent));
    expect(sides).toEqual([
      "Salt DSOpen Sans, 4px corners, steel blue",
      "uoauiInter, 12px corners, violet",
    ]);
    const swatches = Array.from(sec.querySelectorAll<HTMLElement>(".lsl-legend .lsl-swatch"));
    expect(swatches.map((s) => s.getAttribute("title"))).toEqual(["#2670A9", "#8A58C9"]);
    swatches.forEach((s) => {
      expect(s.getAttribute("aria-hidden")).toBe("true");
      expect(s.style.getPropertyValue("--swatch")).toBe(s.getAttribute("title"));
    });
    const live = sec.querySelector('.lsl-diff[aria-live="polite"]');
    expect(norm(live?.textContent)).toBe(
      "Salt DS on the left, uoaui on the right. What differs: Open Sans against Inter, 4px corners against 12px corners, steel blue against violet.",
    );
    // No hex digits anywhere in what is read aloud or shown as text.
    expect(sec.textContent).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    click(tab(sec, "Fluent 2"));
    click(right(sec, "salt"));
    // Fluent and Salt share 4px corners, so corners are not claimed as a difference.
    expect(norm(live?.textContent)).toBe(
      "Fluent 2 on the left, Salt DS on the right. What differs: Segoe UI against Open Sans, deep blue against steel blue.",
    );
  });

  it("caption carries no em/en dashes and frames the captures honestly", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    expect(sec.textContent).not.toMatch(/[–—]/);
    const caption = norm(sec.querySelector(".lsl-showcase-caption")?.textContent);
    // The screen is named as it is titled, and its template as the builder names it.
    expect(caption).toMatch(/Analytics Dashboard screen/);
    expect(caption).toMatch(/Analytics Home template/);
    // Positive honesty: described as real builder output, captured.
    expect(caption).toMatch(/real builder output/i);
    // The word "redrawn" appears only inside a negation.
    expect(caption).toMatch(/not redrawn/i);
  });

  it("light/dark control swaps both captures and reports its state", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const group = sec.querySelector('.lsl-mode[role="group"]');
    expect(group?.getAttribute("aria-label")).toBeTruthy();
    expect(modeBtn(sec, "Dark").getAttribute("aria-pressed")).toBe("true");
    expect(modeBtn(sec, "Light").getAttribute("aria-pressed")).toBe("false");
    click(modeBtn(sec, "Light"));
    expect(modeBtn(sec, "Light").getAttribute("aria-pressed")).toBe("true");
    expect(modeBtn(sec, "Dark").getAttribute("aria-pressed")).toBe("false");
    expect(leftImg(sec)?.getAttribute("src")).toBe("/showcase/cmp-salt-light.webp");
    expect(rightImg(sec)?.getAttribute("src")).toBe("/showcase/cmp-uoaui-light.webp");
    expect(leftImg(sec)?.getAttribute("alt")).toMatch(/light mode/);
    // The accent named in the legend follows the mode (uoaui's is muted violet in light).
    expect(norm(sec.querySelectorAll(".lsl-legend-side")[1].textContent)).toBe(
      "uoauiInter, 12px corners, muted violet",
    );
  });

  it("when only the icon toggle shows, the hidden mode button hands focus to its sibling", async () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const light = modeBtn(sec, "Light");
    light.focus();
    // jsdom lays nothing out, so offsetParent is null: exactly the case
    // where the pressed button is display:none.
    await act(async () => {
      light.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });
    expect(document.activeElement).toBe(modeBtn(sec, "Dark"));
    expect(modeBtn(sec, "Dark").getAttribute("aria-pressed")).toBe("false");
  });

  it("arrow keys move the Left selection AND focus, wrapping at both ends", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const tabs = tabsOf(sec);
    const press = (t: HTMLButtonElement, key: string) => {
      t.focus();
      const ev = new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
      });
      act(() => {
        t.dispatchEvent(ev);
      });
      return ev;
    };
    // ArrowRight from Salt goes to Material 3, selected and focused. The
    // right side does not change.
    const ev1 = press(tabs[0], "ArrowRight");
    expect(ev1.defaultPrevented).toBe(true);
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[1]);
    expect(right(sec, "uoaui").checked).toBe(true);
    // ArrowLeft from Salt (index 0) wraps (guards negative modulo) and steps
    // over uoaui (it is on the right) to Carbon.
    const ev2 = press(tabs[0], "ArrowLeft");
    expect(ev2.defaultPrevented).toBe(true);
    expect(tabs[3].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[3]);
    expect(right(sec, "uoaui").checked).toBe(true);
    // ArrowRight from Carbon steps over uoaui and wraps back to Salt.
    press(tabs[3], "ArrowRight");
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[0]);
  });

  it("a full lap of arrow keys never changes the Right side", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const tabs = tabsOf(sec);
    click(right(sec, "carbon")); // the visitor's own Right choice
    const visited: string[] = [];
    for (let i = 0; i < 8; i++) {
      const current = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
      tabs[current].focus();
      act(() => {
        tabs[current].dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }),
        );
      });
      visited.push(norm(tabs.find((t) => t.getAttribute("aria-selected") === "true")!.textContent));
      expect(rightOf(sec).filter((r) => r.checked).map((r) => r.value)).toEqual(["carbon"]);
      expect(rightImg(sec)?.getAttribute("src")).toBe("/showcase/cmp-carbon-dark.webp");
    }
    // Every other system is reachable; Carbon is stepped over.
    expect(visited).toEqual([
      "Material 3", "Fluent 2", "uoaui", "Salt DS", "Material 3", "Fluent 2", "uoaui", "Salt DS",
    ]);
    // Home and End obey the same rule.
    click(right(sec, "uoaui"));
    tabs[1].focus();
    act(() => {
      tabs[1].dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }));
    });
    expect(tab(sec, "Carbon").getAttribute("aria-selected")).toBe("true");
    expect(right(sec, "uoaui").checked).toBe(true);
  });

  it("a mode change re-keys a waiting sweep, and the sweep runs once the capture settles", async () => {
    const el = renderPage();
    const sec = sectionOf(el);
    click(tab(sec, "Carbon")); // waiting for carbon-dark, divider at rest
    expect(splitOf(sec)).toBe("0.5");
    expect(sec.getAttribute("data-waiting")).toBe("left");
    click(modeBtn(sec, "Light")); // now the frame needs carbon-light instead
    expect(leftImg(sec)?.getAttribute("src")).toBe("/showcase/cmp-carbon-light.webp");
    expect(splitOf(sec)).toBe("0.5");
    expect(sec.getAttribute("data-waiting")).toBe("left");
    // The capture that settles is the light one: the sweep must still run,
    // from the left edge.
    act(() => {
      leftImg(sec)!.dispatchEvent(new Event("load"));
    });
    expect(splitOf(sec)).toBe("0");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 900));
    });
    expect(splitOf(sec)).toBe("0.5");
    expect(sec.hasAttribute("data-waiting")).toBe(false);
  });

  it("a capture that fails to load still releases the sweep", async () => {
    const el = renderPage();
    const sec = sectionOf(el);
    click(right(sec, "md3")); // waiting for md3-dark, divider at rest
    expect(splitOf(sec)).toBe("0.5");
    act(() => {
      rightImg(sec)!.dispatchEvent(new Event("error"));
    });
    expect(splitOf(sec)).toBe("1"); // released: the sweep starts from the right edge
    await act(async () => {
      await new Promise((r) => setTimeout(r, 900));
    });
    expect(splitOf(sec)).toBe("0.5");
  });

  it("a settled capture sweeps at once on the next change", async () => {
    const el = renderPage();
    const sec = sectionOf(el);
    click(tab(sec, "Carbon"));
    await act(async () => {
      leftImg(sec)!.dispatchEvent(new Event("load"));
      await new Promise((r) => setTimeout(r, 900));
    });
    click(tab(sec, "Salt DS"));
    click(tab(sec, "Carbon")); // carbon-dark is already settled: no waiting
    expect(Number(splitOf(sec))).toBeLessThan(0.5);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 900));
    });
    expect(splitOf(sec)).toBe("0.5");
  });

  it("a sweep that starts at once drops an older one that was still waiting", async () => {
    const el = renderPage();
    const sec = sectionOf(el);
    click(right(sec, "md3"));
    await act(async () => {
      rightImg(sec)!.dispatchEvent(new Event("load")); // md3-dark has settled
      await new Promise((r) => setTimeout(r, 900));
    });
    click(right(sec, "carbon")); // waits for carbon-dark, which never arrives
    expect(splitOf(sec)).toBe("0.5");
    click(right(sec, "md3")); // settled: sweeps straight away
    await act(async () => {
      await new Promise((r) => setTimeout(r, 900));
    });
    expect(splitOf(sec)).toBe("0.5");
    // Nothing is left waiting: a mode change and its capture do not set off
    // a sweep nobody asked for.
    click(modeBtn(sec, "Light"));
    await act(async () => {
      rightImg(sec)!.dispatchEvent(new Event("load"));
      await new Promise((r) => setTimeout(r, 120));
    });
    expect(splitOf(sec)).toBe("0.5");
  });

  it("the divider always arrives: a timer finishes a sweep whose frames stop coming", async () => {
    const el = renderPage();
    const sec = sectionOf(el);
    click(right(sec, "md3"));
    // From here on the page gets no animation frames (a throttled tab).
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    try {
      act(() => {
        rightImg(sec)!.dispatchEvent(new Event("load"));
      });
      expect(splitOf(sec)).toBe("1");
      await act(async () => {
        await new Promise((r) => setTimeout(r, 800));
      });
      // Not parked on one system: the sweep's own length plus a short grace.
      expect(splitOf(sec)).toBe("0.5");
    } finally {
      raf.mockRestore();
    }
  });

  it("a page that is not being drawn skips the sweep and shows both systems at once", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    click(right(sec, "md3"));
    const hidden = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    try {
      act(() => {
        rightImg(sec)!.dispatchEvent(new Event("load"));
      });
      expect(splitOf(sec)).toBe("0.5");
    } finally {
      hidden.mockRestore();
    }
  });

  it("the Left tab of the system on the right says why the arrow keys step over it", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const hinted = () =>
      tabsOf(sec)
        .filter((t) => t.hasAttribute("aria-describedby"))
        .map((t) => norm(t.textContent));
    expect(hinted()).toEqual(["uoaui"]);
    const hint = sec.querySelector(`#${tab(sec, "uoaui").getAttribute("aria-describedby")}`);
    expect(norm(hint?.textContent)).toBe(
      "Showing on the right. Choose it here to swap the two sides.",
    );
    // Present for assistive technology, not drawn.
    expect(hint?.classList.contains("sr-only")).toBe(true);
    // The hint follows the Right side, and only that tab carries it.
    click(right(sec, "carbon"));
    expect(hinted()).toEqual(["Carbon"]);
    // Choosing that tab is still the announced swap.
    click(tab(sec, "Carbon"));
    expect(tab(sec, "Carbon").getAttribute("aria-selected")).toBe("true");
    expect(right(sec, "salt").checked).toBe(true);
    expect(hinted()).toEqual(["Salt DS"]);
  });

  it("Home/End jump to ends, Up/Down alias Left/Right, other keys pass through", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const tabs = tabsOf(sec);
    const press = (t: HTMLButtonElement, key: string) => {
      t.focus();
      const ev = new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
      });
      act(() => {
        t.dispatchEvent(ev);
      });
      return ev;
    };
    press(tabs[0], "End");
    expect(tabs[3].getAttribute("aria-selected")).toBe("true"); // uoaui, the last, is on the right
    expect(document.activeElement).toBe(tabs[3]);
    press(tabs[3], "Home");
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[0]);
    press(tabs[0], "ArrowDown");
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    press(tabs[1], "ArrowUp");
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    // An unrelated key neither preventDefaults nor changes selection.
    const ev = press(tabs[0], "a");
    expect(ev.defaultPrevented).toBe(false);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
  });
});

/* ── 8b. The facts in the legend come from the product ──────── */

describe("legend facts are pinned to their sources", () => {
  const builderCss = readFileSync(
    resolve(process.cwd(), "src/components/builder/builder.css"),
    "utf8",
  );
  /** The builder's own token block for a system: `.preview-<id> { ... }`. */
  const block = (builderId: string) => {
    const m = builderCss.match(new RegExp(`\\n\\.preview-${builderId} \\{([^}]*)\\}`));
    if (!m) throw new Error(`No .preview-${builderId} block in builder.css`);
    return m[1];
  };
  const decl = (body: string, name: string) => {
    const m = body.match(new RegExp(`${name}:\\s*([^;]+);`));
    if (!m) throw new Error(`No ${name}`);
    return m[1].trim();
  };
  /** Resolve `var(--x, fallback)` against the upstream package where one exists. */
  const radiusOf = (builderId: string): string => {
    const raw = decl(block(builderId), "--ds-radius");
    if (builderId === "fluent") {
      // --ds-radius: var(--borderRadiusMedium, ...): read the official token.
      expect(raw).toMatch(/^var\(--borderRadiusMedium,/);
      const tokens = readFileSync(
        resolve(process.cwd(), "node_modules/@fluentui/tokens/lib-commonjs/global/borderRadius.js"),
        "utf8",
      );
      return tokens.match(/borderRadiusMedium:\s*'([^']+)'/)![1];
    }
    const viaVar = raw.match(/^var\([^,]+,\s*([^)]+)\)$/);
    const value = (viaVar ? viaVar[1] : raw).trim();
    return value === "0" ? "0px" : value;
  };

  it.each(SYSTEMS.map((s) => [s.name, s] as const))("%s: typeface is the builder's --ds-font", (_name, s) => {
    const fontDecl = decl(block(s.builderId), "--ds-font");
    // The first quoted family in the stack is the system's typeface.
    const first = fontDecl.match(/'([^']+)'/)![1];
    expect(s.font).toBe(first);
  });

  it.each(SYSTEMS.map((s) => [s.name, s] as const))("%s: corner radius is the builder's --ds-radius", (_name, s) => {
    expect(s.corners).toBe(radiusOf(s.builderId));
  });

  it.each(
    SYSTEMS.flatMap((s) =>
      (["light", "dark"] as const).map((mode) => [s.name, mode, s] as const),
    ),
  )("%s %s: the accent swatch is a colour the capture really contains", async (_name, mode, s) => {
    const { default: sharp } = await import("sharp");
    const { data, info } = await sharp(
      resolve(process.cwd(), `public/showcase/cmp-${s.id}-${mode}.webp`),
    )
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const hex = s.accent[mode].hex;
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    let hits = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      if (Math.abs(data[i] - r) <= 10 && Math.abs(data[i + 1] - g) <= 10 && Math.abs(data[i + 2] - b) <= 10) hits++;
    }
    // The primary button is roughly 70 x 35 CSS px at 2x: several thousand pixels.
    expect(hits).toBeGreaterThan(3000);
  });

  it("phrases are built from those facts, with no hex in them", () => {
    for (const s of SYSTEMS) {
      for (const mode of ["light", "dark"] as const) {
        expect(traits(s, mode)).toContain(s.font);
        expect(traits(s, mode)).toContain(s.accent[mode].name);
        expect(traits(s, mode)).not.toMatch(/#/);
        for (const o of SYSTEMS) expect(differences(s, o, mode)).not.toMatch(/#/);
      }
    }
  });

  it("the specimen sheets sit on each system's own dark surface", async () => {
    const { default: sharp } = await import("sharp");
    for (const s of SYSTEMS) {
      const { data } = await sharp(resolve(process.cwd(), `public/showcase/part-search-${s.id}.webp`))
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(s.surface.slice(i, i + 2), 16));
      // Top-left pixel of the strip is the canvas ground.
      expect(Math.abs(data[0] - r) + Math.abs(data[1] - g) + Math.abs(data[2] - b)).toBeLessThanOrEqual(12);
    }
  });
});

/* ── 9. Handoff into the builder ─────────────────────────────── */

describe("builder handoff", () => {
  const click = (node: Element) =>
    act(() => {
      node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

  it("the prompt is a native GET form to /builder with a required, labelled field", () => {
    const el = renderPage();
    const form = el.querySelector<HTMLFormElement>(".lsl-hero form.lsl-hero-prompt");
    expect(form?.getAttribute("action")).toBe("/builder");
    expect(form?.getAttribute("method")).toBe("get");
    const input = form?.querySelector<HTMLInputElement>('input[name="prompt"]');
    expect(input?.required).toBe(true);
    expect(form?.querySelector(`label[for="${input?.id}"]`)).not.toBeNull();
    expect(norm(form?.querySelector('button[type="submit"]')?.textContent)).toBe("Build it");
  });

  it("the prompt carries the instrument's system and mode into the builder", () => {
    const el = renderPage();
    const hidden = (form: Element, name: string) =>
      form.querySelector<HTMLInputElement>(`input[type="hidden"][name="${name}"]`)?.value;
    const forms = Array.from(el.querySelectorAll("form.lsl-hero-prompt"));
    expect(forms).toHaveLength(2); // hero + closing band
    const hero = forms[0];
    const band = forms[1];
    /** The closing band sends the system through visible radio chips. */
    const chosen = () =>
      band.querySelector<HTMLInputElement>('input[type="radio"][name="ds"]:checked')?.value;
    expect(band.querySelectorAll('input[type="radio"][name="ds"]')).toHaveLength(5);
    expect(band.querySelector('input[type="hidden"][name="ds"]')).toBeNull();
    expect(hidden(hero, "ds")).toBe("salt");
    expect(chosen()).toBe("salt");
    forms.forEach((f) => expect(hidden(f, "mode")).toBe("dark"));
    const sec = el.querySelector("#showcase")!;
    click(
      Array.from(sec.querySelectorAll('[role="tab"]')).find(
        (t) => norm(t.textContent) === "Material 3",
      )!,
    );
    click(
      Array.from(sec.querySelectorAll(".lsl-mode-btn")).find(
        (b) => norm(b.textContent) === "Light",
      )!,
    );
    expect(hidden(hero, "ds")).toBe("md3");
    expect(chosen()).toBe("md3");
    forms.forEach((f) => expect(hidden(f, "mode")).toBe("light"));

    // And the other way: a chip in the closing band drives the hero.
    const carbon = band.querySelector<HTMLInputElement>('input[type="radio"][value="carbon"]')!;
    click(carbon);
    expect(chosen()).toBe("carbon");
    expect(hidden(hero, "ds")).toBe("carbon");
    expect(
      sec.querySelector('[role="tab"][aria-selected="true"]')?.textContent,
    ).toBe("Carbon");
    // Each form submits exactly one ds value, and the instrument's own
    // right-side picker never leaks into either form.
    forms.forEach((f) => {
      const data = new FormData(f as HTMLFormElement);
      expect(data.getAll("ds")).toHaveLength(1);
      expect(Array.from(data.keys()).sort()).toEqual(["ds", "mode", "prompt"]);
    });
  });

  it("arrow keys through the chips step over the hero's right-hand system", () => {
    const el = renderPage();
    const band = el.querySelector("#cta fieldset.lsl-chips")!;
    const sec = el.querySelector("#showcase")!;
    const rightChecked = () =>
      sec.querySelector<HTMLInputElement>('[role="radiogroup"] input:checked')?.value;
    const chosen = () => band.querySelector<HTMLInputElement>("input:checked")?.value;
    expect(rightChecked()).toBe("uoaui");
    const seen: (string | undefined)[] = [];
    for (let i = 0; i < 5; i++) {
      const current = band.querySelector<HTMLInputElement>("input:checked")!;
      const ev = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true });
      act(() => {
        current.dispatchEvent(ev);
      });
      expect(ev.defaultPrevented).toBe(true);
      seen.push(chosen());
      expect(rightChecked()).toBe("uoaui"); // never rewritten from the keyboard
      expect(document.activeElement).toBe(band.querySelector("input:checked"));
    }
    expect(seen).toEqual(["md3", "fluent", "carbon", "salt", "md3"]);
    // A click on the right-hand system is an explicit choice: it swaps.
    click(band.querySelector<HTMLInputElement>('input[value="uoaui"]')!);
    expect(chosen()).toBe("uoaui");
    expect(rightChecked()).toBe("md3");
  });

  it("the chips are a labelled group of real radios", () => {
    const el = renderPage();
    const set = el.querySelector("#cta fieldset.lsl-chips");
    expect(norm(set?.querySelector("legend")?.textContent)).toBe("Start in");
    expect(
      Array.from(set?.querySelectorAll("label") ?? []).map((l) => norm(l.textContent)),
    ).toEqual(["Salt DS", "Material 3", "Fluent 2", "Carbon", "uoaui"]);
  });

  it("prompt ids are unique so each label names its own field", () => {
    const el = renderPage();
    const ids = Array.from(el.querySelectorAll('input[name="prompt"]')).map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each system card opens the builder in that system", () => {
    const el = renderPage();
    const cards = Array.from(
      el.querySelectorAll<HTMLAnchorElement>("#systems a.lsl-syscard"),
    ).map((a) => [norm(a.querySelector(".lsl-syscard-name")?.textContent), a.getAttribute("href")]);
    expect(cards).toEqual([
      ["Salt DS", "/builder?ds=salt"],
      ["Material 3", "/builder?ds=md3"],
      ["Fluent 2", "/builder?ds=fluent"],
      ["Carbon", "/builder?ds=carbon"],
      ["uoaui", "/builder?ds=uoaui"],
    ]);
  });

  it("the report link uses the template's own chat command", () => {
    const el = renderPage();
    const link = Array.from(el.querySelectorAll<HTMLAnchorElement>("#showcase a")).find(
      (a) => norm(a.textContent) === "Open this screen in the builder",
    );
    expect(link?.getAttribute("href")).toBe("/builder?prompt=Build+me+an+Analytics+Home");
  });
});

describe("instrument CSS contract", () => {
  const css = readFileSync(CSS_PATH, "utf8");

  it("owner rule: no harsh outlines on the page's own chrome", () => {
    // Containers separate by tone. The only borders left are 2px state
    // markers (tab underlines, the chapter rail), never a 1px box.
    const boxed = Array.from(
      css.matchAll(/\n([^\n{}]+)\{[^}]*\bborder:\s*1px solid ([^;]+);/g),
    ).filter((m) => !/transparent|var\(--lsl-(accent|fg-strong)\)/.test(m[2]));
    expect(boxed.map((m) => m[1].trim())).toEqual([]);
    // The bright 22% rule is never used to draw a box or a divider.
    expect(css).not.toMatch(/border(-top|-bottom|-left|-right)?:\s*1px solid var\(--lsl-rule-strong\)/);
    // No accent-coloured ring marks a container as selected.
    expect(css).not.toMatch(/:checked[^{]*\{[^}]*border-color/);
    // The one permitted edge is the low-contrast hairline token.
    expect(css).toMatch(/--lsl-edge-soft:\s*0 0 0 1px var\(--lsl-rule\);/);
    // Keyboard focus keeps its ring.
    expect(css).toMatch(/a:focus-visible,[\s\S]*?outline:\s*2px solid var\(--lsl-accent\)/);
  });

  it("the divider line and the clip share one position expression", () => {
    expect(css).toMatch(/--split-x:\s*calc\(22px \+ \(100% - 44px\) \* var\(--split-n, 0\.5\)\)/);
    expect(css).toMatch(/\.lsl-compare-layer\s*\{[^}]*clip-path:\s*inset\(0 0 0 var\(--split-x\)\)/);
    expect(css).toMatch(/\.lsl-split-line\s*\{[^}]*left:\s*var\(--split-x\)/);
    // The slider keeps vertical page scrolling on touch screens.
    expect(css).toMatch(/\.lsl-split-range\s*\{[^}]*touch-action:\s*pan-y/);
  });

  it("system tabs wrap; no control row hides behind a scroll container", () => {
    expect(css).toMatch(/\.lsl-showcase-tabs\s*\{[^}]*flex-wrap:\s*wrap/);
    const tabRules = (css.match(/\.lsl-(showcase|code)-tabs[^{]*\{[^}]*\}/g) ?? []).join("\n");
    expect(tabRules).not.toMatch(/overflow-x/);
  });

  it("the divider is one 1px line, and the frame never scales the board past its real size", () => {
    const line = css.match(/\.landing-southleft \.lsl-split-line \{([^}]*)\}/)![1];
    expect(line).toMatch(/width:\s*1px/);
    // No second edge beside it (that read as a grey double line on a light board).
    expect(line).not.toMatch(/box-shadow/);
    expect(line).toMatch(/background:\s*color-mix\(in srgb, var\(--float-ink\) 70%, transparent\)/);
    expect(css).toMatch(/\.lsl-showcase-viewport\[data-mode="light"\]\s*\{[^}]*--float-ink:\s*var\(--lsl-bg\)/);
    // The wide board is 1420 px at device pixel ratio 2: 710 CSS px.
    expect(readFileSync(PAGE_PATH, "utf8")).toMatch(/const SHOT = \{ w: 1420, /);
    expect(css).toMatch(/--lsl-board-w:\s*710px/);
    expect(css).toMatch(/\.landing-southleft \.lsl-instrument \{[^}]*max-width:\s*var\(--lsl-board-w\)/);
    expect(css).not.toMatch(/\.lsl-instrument\s*\{\s*max-width:\s*none/);
  });

  it("reserves the frame with an aspect-ratio so the swap cannot shift layout", () => {
    expect(css).toMatch(/\.lsl-showcase-viewport\s*\{[^}]*aspect-ratio:\s*1420\s*\/\s*528/);
  });

  it("the showcase rules use lsl tokens and leak no raw hex", () => {
    const showcaseRules = (
      css.match(/\.lsl-showcase[^{]*\{[^}]*\}/g) ?? []
    ).join("\n");
    expect(showcaseRules.length).toBeGreaterThan(0);
    expect(showcaseRules).toMatch(/var\(--lsl-/);
    expect(showcaseRules).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });

  it("raw hex appears only in the token definitions", () => {
    const body = css.slice(css.indexOf("background: var(--lsl-bg);"));
    expect(body).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it("caps the hero display size for phones, with the landing's tokens kept in landing.css", () => {
    // 9vw is 34px on a 375px phone; the 28px floor keeps "Five design
    // systems." on one line down to 320px.
    expect(css).toMatch(/--lsl-text-display-l:\s*clamp\(28px,\s*9vw,\s*55px\)/);
    expect(css).toMatch(/--lsl-text-display-sm:\s*clamp\(28px,\s*3vw,\s*40px\)/);
    const globals = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
    expect(globals).not.toMatch(/--lsl-text-display-(l|sm):/);
  });
});

/* ── 10. Prefetch waits for intent ───────────────────────────── */

describe("prefetch waits for intent", () => {
  const setSaveData = (saveData: boolean | undefined) =>
    Object.defineProperty(navigator, "connection", {
      value: saveData === undefined ? undefined : { saveData },
      configurable: true,
    });

  afterEach(() => {
    setSaveData(undefined);
    vi.useRealTimers();
  });

  const heavyLinks = () =>
    [...container!.querySelectorAll<HTMLAnchorElement>("a[href]")].filter((a) =>
      /^\/(builder|ui-kit|theme-builder|token-editor)/.test(a.getAttribute("href") ?? ""));

  it("no link to another route asks Next to prefetch on sight", () => {
    renderPage();
    expect(heavyLinks().length).toBeGreaterThanOrEqual(12);
    const src = readFileSync(PAGE_PATH, "utf8");
    /* Every <Link> either never prefetches or takes its prefetch from intent. */
    const links = [...src.matchAll(/<Link\s[\s\S]*?href=/g)].map((m) => m[0]);
    expect(links.length).toBeGreaterThanOrEqual(10);
    for (const link of links) expect(link, link).toMatch(/prefetch=\{false\}|\{\.\.\.intent\(/);
  });

  it("a route is only warmed once it has been reached for", () => {
    expect(prefetchFor(new Set(), "/builder")).toBe(false);
    expect(prefetchFor(new Set(["/builder"]), "/builder")).toBe(null);
    expect(prefetchFor(new Set(["/builder"]), "/ui-kit")).toBe(false);
  });

  it("a mouse or a pen can hover; a finger cannot", () => {
    expect(isHoverPointer("mouse")).toBe(true);
    expect(isHoverPointer("pen")).toBe(true);
    expect(isHoverPointer("touch")).toBe(false);
    expect(INTENT_DWELL_MS).toBeGreaterThanOrEqual(50);
    expect(INTENT_DWELL_MS).toBeLessThanOrEqual(150);
  });

  it("honours a request to save data", () => {
    expect(savesData()).toBe(false);
    setSaveData(false);
    expect(savesData()).toBe(false);
    setSaveData(true);
    expect(savesData()).toBe(true);
  });
});
