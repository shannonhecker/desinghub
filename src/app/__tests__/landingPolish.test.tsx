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
import { canPrefetchBuilder, PREFETCH_QUERY } from "../landingPrefetch";
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
      "Describe the report. Switch the system. Export code that runs.",
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
      "The same search field and the same report card, cut from the real canvas in each system. The corners, the typeface and the accent come from that system's own components and tokens. The content stays where you put it.",
    );
  });

  it("workflow is a three-step sequence: describe, edit, present", () => {
    const el = renderPage();
    expect(norm(el.querySelector("#workflow .lsl-section-heading")?.textContent)).toBe(
      "From one sentence to a finished report.",
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
      "design-hub-project.sh",
      "dashboard.html",
      "tokens.json",
    ]);
    expect(tabs.filter((t) => t.getAttribute("aria-selected") === "true")).toHaveLength(1);
    // The lede names all six formats the Export Code dialog offers.
    const lede = norm(el.querySelector("#export .lsl-section-lede")?.textContent);
    for (const word of ["React", "Vite", "HTML", "tokens", "SVG", "Figma"]) {
      expect(lede).toContain(word);
    }
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
      expect(s.total).toBeGreaterThan(s.shown);
      expect(s.source).not.toMatch(/[–—]/);
    }
    const el = renderPage();
    const tabs = Array.from(el.querySelectorAll<HTMLButtonElement>('#export [role="tab"]'));
    act(() => {
      tabs[3].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(tabs[3].getAttribute("aria-selected")).toBe("true");
    expect(el.querySelector("#export pre")?.textContent).toBe(EXPORT_SAMPLES[3].source);
    expect(el.querySelector("#lsl-code-panel")?.getAttribute("aria-labelledby")).toBe(tabs[3].id);
    tabs[3].focus();
    act(() => {
      tabs[3].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
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
      "Pick the system, describe the report, and the builder opens with both.",
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
    imgs.forEach((img) => {
      expect(img.getAttribute("loading")).toBe("eager");
      expect(img.getAttribute("fetchpriority")).toBe("high");
    });
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
  const click = (node: Element) =>
    act(() => {
      node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  const activeImg = (sec: HTMLElement) =>
    sec.querySelector<HTMLImageElement>(
      '[role="tabpanel"][data-active="true"] img.lsl-showcase-shot',
    );
  /** jsdom never loads images: tell the instrument its captures settled. */
  const settle = (sec: HTMLElement, type = "load") =>
    act(() => {
      sec
        .querySelectorAll("img.lsl-showcase-shot")
        .forEach((img) => img.dispatchEvent(new Event(type)));
    });
  const compareImg = (sec: HTMLElement) =>
    sec.querySelector<HTMLImageElement>(".lsl-compare-layer img.lsl-showcase-shot");
  const splitOf = (sec: HTMLElement) => sec.style.getPropertyValue("--split-n");
  const modeBtn = (sec: HTMLElement, label: string) =>
    Array.from(sec.querySelectorAll<HTMLButtonElement>(".lsl-mode-btn")).find(
      (b) => norm(b.textContent) === label,
    )!;

  it("lives in the hero, not below the fold", () => {
    const el = renderPage();
    expect(sectionOf(el).closest("section")?.classList.contains("lsl-hero")).toBe(true);
  });

  it("exposes a labelled tablist with exactly 5 tabs in canonical order", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const tablist = sec.querySelector('[role="tablist"]');
    expect(tablist).not.toBeNull();
    expect(tablist?.getAttribute("aria-label")).toBeTruthy();
    const tabs = tabsOf(sec);
    expect(tabs).toHaveLength(5);
    expect(tabs.map((t) => norm(t.textContent))).toEqual([
      "Salt DS",
      "Material 3",
      "Fluent 2",
      "Carbon",
      "uoaui",
    ]);
  });

  it("selects Salt by default with a roving tabindex", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const tabs = tabsOf(sec);
    const selected = tabs.filter(
      (t) => t.getAttribute("aria-selected") === "true",
    );
    expect(selected).toHaveLength(1);
    expect(norm(selected[0].textContent)).toBe("Salt DS");
    expect(selected[0].getAttribute("tabindex")).toBe("0");
    tabs
      .filter((t) => t.getAttribute("aria-selected") !== "true")
      .forEach((t) => expect(t.getAttribute("tabindex")).toBe("-1"));
  });

  it("wires each tab to its panel and shows exactly one panel", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    tabsOf(sec).forEach((tab) => {
      const panelId = tab.getAttribute("aria-controls")!;
      const panel = sec.querySelector(`#${panelId}`);
      expect(panel).not.toBeNull();
      expect(panel?.getAttribute("aria-labelledby")).toBe(tab.id);
    });
    const visible = Array.from(
      sec.querySelectorAll('[role="tabpanel"]'),
    ).filter((p) => p.getAttribute("aria-hidden") !== "true");
    expect(visible).toHaveLength(1);
  });

  it("maps every system and mode to its own capture, desktop and phone", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const seen = new Set<string>();
    for (const mode of ["light", "dark"] as const) {
      click(modeBtn(sec, mode === "light" ? "Light" : "Dark"));
      for (const [label, id] of [
        ["Salt DS", "salt"],
        ["Material 3", "md3"],
        ["Fluent 2", "fluent"],
        ["Carbon", "carbon"],
        ["uoaui", "uoaui"],
      ] as const) {
        click(tabsOf(sec).find((t) => norm(t.textContent) === label)!);
        const img = activeImg(sec);
        expect(img?.getAttribute("src")).toBe(`/showcase/home-${id}-${mode}.webp`);
        const phone = img?.parentElement?.querySelector("source");
        expect(phone?.getAttribute("srcset")).toBe(
          `/showcase/home-${id}-${mode}-phone.webp`,
        );
        expect(phone?.getAttribute("media")).toBe("(max-width: 640px)");
        seen.add(img!.getAttribute("src")!);
      }
    }
    expect(seen.size).toBe(10);
  });

  it("every capture the page references exists in public/showcase", () => {
    const files = new Set<string>(["builder-recording-poster.webp"]);
    for (const id of ["salt", "md3", "fluent", "carbon", "uoaui"]) {
      files.add(`part-search-${id}.webp`);
      files.add(`part-card-${id}.webp`);
      for (const mode of ["light", "dark"]) {
        files.add(`home-${id}-${mode}.webp`);
        files.add(`home-${id}-${mode}-phone.webp`);
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

  it("the default capture has descriptive, honest alt text", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const salt = sec.querySelector<HTMLImageElement>(
      "#lsl-showcase-panel-salt img",
    );
    expect(salt?.getAttribute("src")).toBe("/showcase/home-salt-light.webp");
    const alt = salt?.getAttribute("alt") ?? "";
    expect(alt).toMatch(/Salt DS/);
    expect(alt).toMatch(/Analytics Home/);
    expect(alt).toMatch(/search field/);
    expect(alt).toMatch(/light mode/);
    expect(alt).not.toMatch(/mock|placeholder|illustration/i);
    expect(alt.length).toBeGreaterThan(20);
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
      expect((img.getAttribute("alt") ?? "").length).toBeGreaterThan(20);
    });
    expect(new Set(strip.map((img) => img.getAttribute("src"))).size).toBe(10);
  });

  it("every alt string is dash-free, descriptive display copy", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const alts: string[] = [];
    tabsOf(sec).forEach((tab) => {
      click(tab);
      alts.push(activeImg(sec)?.getAttribute("alt") ?? "");
    });
    expect(new Set(alts).size).toBe(5);
    alts.forEach((alt) => {
      // STOP-class no-dash rule applies to alt copy too (read aloud by AT).
      expect(alt).not.toMatch(/[–—]/);
      expect(alt.length).toBeGreaterThan(20);
    });
  });

  it("clicking a tab switches the selected tab and the visible panel", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const carbon = tabsOf(sec).find((t) => norm(t.textContent) === "Carbon")!;
    click(carbon);
    const selected = tabsOf(sec).filter(
      (t) => t.getAttribute("aria-selected") === "true",
    );
    expect(selected).toHaveLength(1);
    expect(norm(selected[0].textContent)).toBe("Carbon");
    const visible = Array.from(
      sec.querySelectorAll('[role="tabpanel"]'),
    ).filter((p) => p.getAttribute("aria-hidden") !== "true");
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe("lsl-showcase-panel-carbon");
    expect(
      visible[0].querySelector("img")?.getAttribute("src"),
    ).toBe("/showcase/home-carbon-light.webp");
  });

  it("holds a single-selection invariant across every tab", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    tabsOf(sec).forEach((tab) => {
      click(tab);
      const sel = tabsOf(sec).filter(
        (t) => t.getAttribute("aria-selected") === "true",
      );
      expect(sel).toHaveLength(1);
      const vis = Array.from(
        sec.querySelectorAll('[role="tabpanel"]'),
      ).filter((p) => p.getAttribute("aria-hidden") !== "true");
      expect(vis).toHaveLength(1);
    });
  });

  it("caption carries no em/en dashes and frames the captures honestly", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    expect(sec.textContent).not.toMatch(/[–—]/);
    const caption = norm(sec.querySelector(".lsl-showcase-caption")?.textContent);
    // Positive honesty: described as real builder output, captured.
    expect(caption).toMatch(/Analytics Home template/);
    expect(caption).toMatch(/Present mode/);
    expect(caption).toMatch(/real builder output/i);
    // The word "redrawn" appears only inside a negation.
    expect(caption).toMatch(/not redrawn/i);
  });

  it("drives the visible panel via data-active on exactly the active panel", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    let activePanels = sec.querySelectorAll(
      '[role="tabpanel"][data-active="true"]',
    );
    expect(activePanels).toHaveLength(1);
    expect(activePanels[0].id).toBe("lsl-showcase-panel-salt");
    expect((activePanels[0] as HTMLElement).getAttribute("tabindex")).toBe("0");

    click(tabsOf(sec).find((t) => norm(t.textContent) === "Carbon")!);

    activePanels = sec.querySelectorAll('[role="tabpanel"][data-active="true"]');
    expect(activePanels).toHaveLength(1);
    expect(activePanels[0].id).toBe("lsl-showcase-panel-carbon");
    // the now-inactive salt panel drops both the visual flag and focusability
    const salt = sec.querySelector("#lsl-showcase-panel-salt")!;
    expect(salt.getAttribute("data-active")).toBeNull();
    expect(salt.getAttribute("tabindex")).toBeNull();
  });

  it("shows two systems at once: the selected one and Material 3 by default", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    expect(activeImg(sec)?.getAttribute("src")).toBe("/showcase/home-salt-light.webp");
    expect(compareImg(sec)?.getAttribute("src")).toBe("/showcase/home-md3-light.webp");
    // The second capture is content, not decoration: it has its own alt.
    expect(compareImg(sec)?.getAttribute("alt")).toMatch(/Material 3, light mode/);
    expect(sec.querySelector(".lsl-compare-layer")?.hasAttribute("aria-hidden")).toBe(false);
    // The tab row marks which system is on the right.
    const marked = tabsOf(sec).filter((t) => t.getAttribute("data-compare") === "true");
    expect(marked.map((t) => norm(t.textContent))).toEqual(["Material 3"]);
  });

  it("a switch moves the system you left to the right and starts the sweep from the left edge", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    settle(sec);
    click(tabsOf(sec).find((t) => norm(t.textContent) === "Carbon")!);
    expect(activeImg(sec)?.getAttribute("src")).toBe("/showcase/home-carbon-light.webp");
    expect(compareImg(sec)?.getAttribute("src")).toBe("/showcase/home-salt-light.webp");
    // Until the new capture settles the old system covers the frame, so the
    // sweep never reveals an empty image.
    expect(splitOf(sec)).toBe("0");
  });

  it("a fast A, B, C never puts an unseen capture on the right", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    settle(sec); // Salt and Material 3 are on screen
    click(tabsOf(sec).find((t) => norm(t.textContent) === "Fluent 2")!);
    // Fluent has not settled when the visitor moves on to Carbon.
    click(tabsOf(sec).find((t) => norm(t.textContent) === "Carbon")!);
    expect(activeImg(sec)?.getAttribute("src")).toBe("/showcase/home-carbon-light.webp");
    expect(compareImg(sec)?.getAttribute("src")).toBe("/showcase/home-salt-light.webp");
  });

  it("a capture that fails to load still settles, so nothing waits on it", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    settle(sec, "error");
    click(tabsOf(sec).find((t) => norm(t.textContent) === "uoaui")!);
    // Salt counted as settled (by its error), so it became the right side.
    expect(compareImg(sec)?.getAttribute("src")).toBe("/showcase/home-salt-light.webp");
  });

  it("under reduced motion a switch leaves the divider where it is", () => {
    stubMatchMedia(true);
    try {
      const el = renderPage();
      const sec = sectionOf(el);
      settle(sec);
      click(tabsOf(sec).find((t) => norm(t.textContent) === "Carbon")!);
      expect(activeImg(sec)?.getAttribute("src")).toBe("/showcase/home-carbon-light.webp");
      expect(splitOf(sec)).toBe("0.5");
    } finally {
      stubMatchMedia(false);
    }
  });

  it("the divider is a labelled slider: input moves it and names both sides", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const range = sec.querySelector<HTMLInputElement>('input[type="range"].lsl-split-range')!;
    expect(range.getAttribute("aria-label")).toBe("Divider between Salt DS and Material 3");
    expect(range.min).toBe("0");
    expect(range.max).toBe("100");
    expect(range.value).toBe("50");
    expect(range.getAttribute("aria-valuetext")).toBe("Salt DS 50 percent, Material 3 50 percent");
    // React listens for the native input event on a range control.
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    act(() => {
      setValue.call(range, "30");
      range.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(splitOf(sec)).toBe("0.3");
    expect(range.getAttribute("aria-valuetext")).toBe("Salt DS 30 percent, Material 3 70 percent");
    // The visible line and grip are decoration for the real control.
    expect(sec.querySelector(".lsl-split-line")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("names what each side brings, from measured values, and announces the difference", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const sides = () =>
      Array.from(sec.querySelectorAll(".lsl-legend-side")).map((p) => norm(p.textContent));
    expect(sides()).toEqual([
      "Salt DSOpen Sans, 4px corners, #2670A9 accent",
      "Material 3Roboto, 12px corners, #6750A4 accent",
    ]);
    const live = sec.querySelector('.lsl-diff[aria-live="polite"]');
    expect(norm(live?.textContent)).toBe(
      "Salt DS on the left, Material 3 on the right. What differs: Open Sans against Roboto, 4px corners against 12px, #2670A9 against #6750A4.",
    );
    settle(sec);
    click(tabsOf(sec).find((t) => norm(t.textContent) === "Fluent 2")!);
    expect(sides()[0]).toBe("Fluent 2Segoe UI, 4px corners, #0F6CBD accent");
    // Fluent and Salt share 4px corners, so corners are not claimed as a difference.
    expect(norm(live?.textContent)).toBe(
      "Fluent 2 on the left, Salt DS on the right. What differs: Segoe UI against Open Sans, #0F6CBD against #2670A9.",
    );
  });

  it("on phones the hidden mode button hands focus to the one that replaced it", async () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const dark = modeBtn(sec, "Dark");
    dark.focus();
    // jsdom lays nothing out, so offsetParent is null: exactly the phone
    // case, where the pressed button is display:none.
    await act(async () => {
      dark.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });
    expect(document.activeElement).toBe(modeBtn(sec, "Light"));
    expect(modeBtn(sec, "Light").getAttribute("aria-pressed")).toBe("false");
  });

  it("light/dark control swaps the capture and reports its state", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const group = sec.querySelector('.lsl-mode[role="group"]');
    expect(group?.getAttribute("aria-label")).toBeTruthy();
    expect(modeBtn(sec, "Light").getAttribute("aria-pressed")).toBe("true");
    expect(modeBtn(sec, "Dark").getAttribute("aria-pressed")).toBe("false");
    click(modeBtn(sec, "Dark"));
    expect(modeBtn(sec, "Dark").getAttribute("aria-pressed")).toBe("true");
    expect(modeBtn(sec, "Light").getAttribute("aria-pressed")).toBe("false");
    expect(activeImg(sec)?.getAttribute("src")).toBe("/showcase/home-salt-dark.webp");
    expect(activeImg(sec)?.getAttribute("alt")).toMatch(/dark mode/);
  });

  it("arrow keys move selection AND focus, wrapping at both ends", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const tabs = tabsOf(sec);
    const press = (tab: HTMLButtonElement, key: string) => {
      tab.focus();
      const ev = new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
      });
      act(() => {
        tab.dispatchEvent(ev);
      });
      return ev;
    };
    // ArrowRight from Salt -> Material 3, both selected and focused.
    const ev1 = press(tabs[0], "ArrowRight");
    expect(ev1.defaultPrevented).toBe(true);
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[1]);
    // ArrowLeft from Salt (index 0) wraps to uoaui (guards negative modulo).
    const ev2 = press(tabs[0], "ArrowLeft");
    expect(ev2.defaultPrevented).toBe(true);
    expect(tabs[4].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[4]);
    // ArrowRight from uoaui (last) wraps back to Salt.
    press(tabs[4], "ArrowRight");
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[0]);
  });

  it("Home/End jump to ends, Up/Down alias Left/Right, other keys pass through", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const tabs = tabsOf(sec);
    const press = (tab: HTMLButtonElement, key: string) => {
      tab.focus();
      const ev = new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
      });
      act(() => {
        tab.dispatchEvent(ev);
      });
      return ev;
    };
    press(tabs[0], "End");
    expect(tabs[4].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[4]);
    press(tabs[4], "Home");
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
    forms.forEach((f) => expect(hidden(f, "mode")).toBe("light"));
    const sec = el.querySelector("#showcase")!;
    click(
      Array.from(sec.querySelectorAll('[role="tab"]')).find(
        (t) => norm(t.textContent) === "Material 3",
      )!,
    );
    click(
      Array.from(sec.querySelectorAll(".lsl-mode-btn")).find(
        (b) => norm(b.textContent) === "Dark",
      )!,
    );
    expect(hidden(hero, "ds")).toBe("md3");
    expect(chosen()).toBe("md3");
    forms.forEach((f) => expect(hidden(f, "mode")).toBe("dark"));

    // And the other way: a chip in the closing band drives the hero.
    const carbon = band.querySelector<HTMLInputElement>('input[type="radio"][value="carbon"]')!;
    click(carbon);
    expect(chosen()).toBe("carbon");
    expect(hidden(hero, "ds")).toBe("carbon");
    expect(
      sec.querySelector('[role="tab"][aria-selected="true"]')?.textContent,
    ).toBe("Carbon");
    // Each form submits exactly one ds value.
    forms.forEach((f) => expect(new FormData(f as HTMLFormElement).getAll("ds")).toHaveLength(1));
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

  it("reserves the frame with an aspect-ratio so the swap cannot shift layout", () => {
    expect(css).toMatch(/\.lsl-showcase-viewport\s*\{[^}]*aspect-ratio:\s*1760\s*\/\s*1067/);
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

/* ── 10. Builder prefetch gating ─────────────────────────────── */

describe("builder prefetch gating", () => {
  const setMedia = (matches: boolean) => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === PREFETCH_QUERY ? matches : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  };
  const setSaveData = (saveData: boolean | undefined) =>
    Object.defineProperty(navigator, "connection", {
      value: saveData === undefined ? undefined : { saveData },
      configurable: true,
    });

  afterEach(() => {
    setSaveData(undefined);
    stubMatchMedia(false);
  });

  it("asks only wide, fine-pointer screens", () => {
    expect(PREFETCH_QUERY).toBe("(min-width: 1241px) and (pointer: fine)");
  });

  it("allows prefetch on a desktop that has not asked to save data", () => {
    setMedia(true);
    expect(canPrefetchBuilder()).toBe(true);
  });

  it("refuses on phones and narrow or touch screens", () => {
    setMedia(false);
    expect(canPrefetchBuilder()).toBe(false);
  });

  it("refuses when the visitor asked to save data, even on a desktop", () => {
    setMedia(true);
    setSaveData(true);
    expect(canPrefetchBuilder()).toBe(false);
  });
});
