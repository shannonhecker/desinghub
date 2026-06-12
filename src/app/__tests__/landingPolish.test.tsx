/* ════════════════════════════════════════════════════════════
   Landing polish (motion pass + IA rename + CTA band) — structure,
   copy, and reduced-motion contract tests.

   Covers the 2026-06 landing brief:
   - IA fix: nav labels Workbench / Systems / Tokens / About, section
     ids #projects → #systems and #voices → #tokens, new #cta band.
   - Copy: locked brand lines verbatim + sharpened ledes + CTA copy.
   - LCP: hero h1 must NOT carry data-reveal (paints at opacity 1).
   - No em/en dashes anywhere in rendered display copy (STOP-class).
   - Reduced motion: every new CSS animation/transition is guarded in
     a prefers-reduced-motion block; video autoplay stays gated.

   Uses react-dom/client + act() directly (no RTL in the repo),
   matching codePanel.test.tsx.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import LandingPage from "../page";

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

describe("nav + anchor IA rename", () => {
  it("nav links read Workbench / Systems / Tokens / About with matching anchors", () => {
    const el = renderPage();
    const links = Array.from(
      el.querySelectorAll<HTMLAnchorElement>(".lsl-nav-link"),
    ).map((a) => [norm(a.textContent), a.getAttribute("href")]);
    expect(links).toEqual([
      ["Workbench", "#services"],
      ["Systems", "#systems"],
      ["Tokens", "#tokens"],
      ["About", "#about"],
    ]);
  });

  it("section ids #systems, #tokens, #cta exist; #projects and #voices are gone", () => {
    const el = renderPage();
    expect(el.querySelector("#systems")).not.toBeNull();
    expect(el.querySelector("#tokens")).not.toBeNull();
    expect(el.querySelector("#cta")).not.toBeNull();
    expect(el.querySelector("#projects")).toBeNull();
    expect(el.querySelector("#voices")).toBeNull();
  });

  it("landing.css carries no stale #projects / #voices selectors", () => {
    const css = readFileSync(CSS_PATH, "utf8");
    expect(css).not.toMatch(/#projects\b/);
    expect(css).not.toMatch(/#voices\b/);
  });
});

/* ── 2. Copy: locked lines verbatim + sharpened rewrites ─────── */

describe("copy", () => {
  it("hero headline is the verbatim brand positioning line", () => {
    const el = renderPage();
    const h1 = el.querySelector("#lsl-hero-headline");
    expect(norm(h1?.textContent)).toBe(
      "A visual web builder for designers who think in systems.",
    );
    expect(h1?.querySelector("em")).not.toBeNull();
  });

  it("hero eyebrow leads with the differentiator", () => {
    const el = renderPage();
    expect(norm(el.querySelector(".lsl-hero-eyebrow")?.textContent)).toBe(
      "uoaui.ai / five systems, one canvas",
    );
  });

  it("hero sub keeps sentence one verbatim and lands the product proof", () => {
    const el = renderPage();
    const sub = norm(el.querySelector(".lsl-hero-sub")?.textContent);
    expect(sub).toContain(
      "UI Kit plus private-preview Builder across Salt, Material 3, Fluent 2, Carbon, and the uoaui system.",
    );
    expect(sub).toContain(
      "The canvas renders real components, and the export is code you can run.",
    );
    expect(sub).not.toContain("aurora accents");
  });

  it("services lede is the sharpened active-verb version", () => {
    const el = renderPage();
    const lede = norm(el.querySelector("#services .lsl-section-lede")?.textContent);
    expect(lede).toBe(
      "Compare, audit, and hand off across systems without leaving the canvas. Four moves cover the day to day.",
    );
  });

  it("systems heading is kept and the lede lands reversibility", () => {
    const el = renderPage();
    expect(norm(el.querySelector("#systems .lsl-section-heading")?.textContent)).toBe(
      "The same card. Five renderings.",
    );
    const lede = norm(el.querySelector("#systems .lsl-section-lede")?.textContent);
    expect(lede).toBe(
      "Pick a system to compose with. Swap later without rewriting the comp. Tokens carry the intent, the renderer is a choice you can unmake.",
    );
  });

  it("tokens heading is kept and the lede sharpens the not-a-style-guide line", () => {
    const el = renderPage();
    expect(norm(el.querySelector("#tokens .lsl-section-heading")?.textContent)).toBe(
      "Tokens you can read.",
    );
    const lede = norm(el.querySelector("#tokens .lsl-section-lede")?.textContent);
    expect(lede).toBe(
      "The unit of portability across five systems. Same primitives, different rendering. This is a slice of the actual canvas, not a style guide.",
    );
  });

  it("CTA band carries the new label, heading, body and both CTAs", () => {
    const el = renderPage();
    const band = el.querySelector("#cta");
    expect(norm(band?.querySelector(".lsl-section-label")?.textContent)).toBe(
      "builder / private preview",
    );
    expect(norm(band?.querySelector(".lsl-section-heading")?.textContent)).toBe(
      "Stop choosing. Start composing.",
    );
    expect(norm(band?.querySelector(".lsl-section-lede")?.textContent)).toBe(
      "Open the workbench, drop a block, and watch five systems render it. The export is real code, ready to run.",
    );
    const primary = band?.querySelector<HTMLAnchorElement>('a[href="/builder"]');
    expect(norm(primary?.textContent)).toBe("Open the workbench");
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

  it("all 4 service headings and 16 bullets stay verbatim", () => {
    const el = renderPage();
    const headings = Array.from(
      el.querySelectorAll("#services .lsl-service-heading"),
    ).map((h) => norm(h.textContent));
    expect(headings).toEqual([
      "Five systems, side by side",
      "Tokens travel with the block",
      "Sketch in real components",
      "Brief it, get variants back",
    ]);
    expect(el.querySelectorAll("#services .lsl-service-bullets li")).toHaveLength(16);
  });

  it("rendered display copy contains no em or en dashes", () => {
    const el = renderPage();
    expect(el.textContent).not.toMatch(/[–—]/);
  });
});

/* ── 3. LCP fix: hero h1 paints at opacity 1 ─────────────────── */

describe("LCP", () => {
  it("hero h1 does NOT carry data-reveal; eyebrow / sub / actions / demo still do", () => {
    const el = renderPage();
    expect(el.querySelector("#lsl-hero-headline")?.hasAttribute("data-reveal")).toBe(false);
    expect(el.querySelector(".lsl-hero-eyebrow")?.hasAttribute("data-reveal")).toBe(true);
    expect(el.querySelector(".lsl-hero-sub")?.hasAttribute("data-reveal")).toBe(true);
    expect(el.querySelector(".lsl-hero-actions")?.hasAttribute("data-reveal")).toBe(true);
    expect(el.querySelector(".lsl-hero-demo")?.hasAttribute("data-reveal")).toBe(true);
  });
});

/* ── 4. Hero do-not-touch: video gating untouched ────────────── */

describe("video WCAG 2.2.2 gating", () => {
  it("autoplays + loops when motion is allowed", () => {
    stubMatchMedia(false);
    const el = renderPage();
    const video = el.querySelector("video");
    expect(video?.hasAttribute("autoplay")).toBe(true);
    expect(video?.hasAttribute("loop")).toBe(true);
    expect(video?.getAttribute("preload")).toBe("metadata");
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
    ".lsl-nav", // entrance slide → opacity-only fade
    ".lsl-nav-link", // underline-grow appears instantly
    ".lsl-hero-headline", // rise + spotlight sweep killed
    ".lsl-hero-demo", // frame settle killed
    ".lsl-rule", // divider draw killed
    ".lsl-hero-secondary", // arrow nudge killed
    ".lsl-syscard", // lift becomes instant ring-only
    ".lsl-token-bar", // bars render final
    ".lsl-token-swatch", // swatches render final
    ".lsl-cta-textlink", // underline-grow appears instantly
    ".lsl-mark-macron", // macron rendered complete
    "[data-reveal]", // IO reveals fall back to static
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
    while ((m = ruleRe.exec(unguarded))) {
      const selector = m[1].trim();
      const cls = selector.match(/\.[\w-]+/)?.[0];
      if (cls && !guarded.includes(cls.replace(/-\d+$/, "-"))) {
        offenders.push(selector);
      }
    }
    expect(offenders).toEqual([]);
  });
});

/* ── 6. Structure: section order with CTA band inserted ──────── */

describe("section structure", () => {
  it("CTA band sits between tokens and footer", () => {
    const el = renderPage();
    const main = el.querySelector("main");
    const ids = Array.from(main?.children ?? [])
      .map((c) => c.id)
      .filter(Boolean);
    expect(ids).toEqual(
      expect.arrayContaining(["services", "systems", "tokens", "cta", "about"]),
    );
    const tokensIdx = ids.indexOf("tokens");
    const ctaIdx = ids.indexOf("cta");
    const aboutIdx = ids.indexOf("about");
    expect(ctaIdx).toBeGreaterThan(tokensIdx);
    expect(aboutIdx).toBeGreaterThan(ctaIdx);
  });

  it("dividers carry data-reveal for the draw-in", () => {
    const el = renderPage();
    const rules = el.querySelectorAll("hr.lsl-rule[data-reveal]");
    expect(rules.length).toBeGreaterThanOrEqual(4);
  });

  it("page.tsx keeps the sanctioned dual backdrop-filter inline pattern only in useNavGlassStyle", () => {
    const src = readFileSync(PAGE_PATH, "utf8");
    expect(src).toContain("WebkitBackdropFilter: backdropFilter");
    // The dual-prefix form must never appear in the CSS file.
    const cssSrc = readFileSync(CSS_PATH, "utf8");
    expect(cssSrc).not.toMatch(/-webkit-backdrop-filter/);
  });
});
