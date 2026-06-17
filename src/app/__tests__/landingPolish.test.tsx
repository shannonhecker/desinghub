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

/* ── 7. CTA band label contrast: WCAG 1.4.3 worst-case proof ──── */
/* The CTA band label sits over .lsl-cta-aurora, whose radials scale
   and drift with scroll, so the label cannot rely on the clean
   #0A0E1A band: the proof composites the band bg plus EVERY radial
   peak stacked at one point (the maximum tint any animation position
   can place under the label) using plain sRGB alpha-over math. The
   gradients interpolate in oklab, but each 0% stop IS the authored
   stop color, so the peak composite is interpolation-space
   independent. All colors are parsed from landing.css (var fallbacks
   resolved recursively), so a future tint or label tweak fails this
   test loudly instead of shipping a silent AA regression. */

type RGBA = [number, number, number, number];

function cssVarFallback(css: string, name: string): string {
  // Definition shape: --name: var(--a-..., FALLBACK);
  const m = css.match(
    new RegExp(`${name}:\\s*var\\([^,()]+,\\s*(.+?)\\)\\s*;`),
  );
  if (!m) throw new Error(`No var fallback literal found for ${name}`);
  return m[1].trim();
}

function parseColor(css: string, value: string): RGBA {
  const v = value.trim();
  const viaVar = v.match(/^var\((--[\w-]+)\)$/);
  if (viaVar) return parseColor(css, cssVarFallback(css, viaVar[1]));
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

function ruleBody(css: string, selector: string): string {
  const m = css.match(
    new RegExp(selector.replace(/[.\\]/g, "\\$&") + "\\s*\\{([^}]+)\\}"),
  );
  if (!m) throw new Error(`Rule not found: ${selector}`);
  return m[1];
}

/* Parsed lazily inside each test so a missing rule fails THESE tests
   with a readable error instead of killing the whole suite at collect. */
function readCtaContrastInputs() {
  const css = readFileSync(CSS_PATH, "utf8");

  // Opaque band background behind the aurora.
  const bandBg = parseColor(css, cssVarFallback(css, "--lsl-bg"));

  // Every radial peak (the 0% stop) inside .lsl-cta-aurora. The zero-alpha
  // end-stops sit at 70%/75% and never match this pattern.
  const aurora = ruleBody(css, ".landing-southleft .lsl-cta-aurora");
  const peaks = Array.from(
    aurora.matchAll(/(var\(--[\w-]+\)|rgba\([^()]*\))\s+0%/g),
  ).map((m) => parseColor(css, m[1]));

  // The CTA-band-scoped label color override.
  const labelDecl = ruleBody(
    css,
    ".landing-southleft .lsl-cta-band .lsl-section-label",
  ).match(/color:\s*([^;]+);/);
  if (!labelDecl) throw new Error("CTA band label color override missing");
  const label = parseColor(css, labelDecl[1]);

  return { bandBg, peaks, label };
}

describe("CTA band label contrast (WCAG 1.4.3, small mono text, AA 4.5:1)", () => {
  it("parses exactly the three authored aurora radial peaks", () => {
    const { peaks } = readCtaContrastInputs();
    expect(peaks).toHaveLength(3);
  });

  it("label clears AA on the worst-case composite (band bg + all radial peaks stacked)", () => {
    const { bandBg, peaks, label } = readCtaContrastInputs();
    // CSS paints the FIRST listed gradient topmost, so composite bottom-up.
    const worstBg = [...peaks]
      .reverse()
      .reduce((base, peak) => over(base, peak), bandBg);
    const fg = over(worstBg, label);
    const ratio = contrastRatio(toHex(fg), toHex(worstBg));
    expect(ratio).toBeGreaterThanOrEqual(4.5); // WCAG 1.4.3 floor
    expect(ratio).toBeGreaterThanOrEqual(4.7); // house margin so tint tweaks fail loudly
  });

  it("label still clears AA with margin on the clean band background", () => {
    const { bandBg, label } = readCtaContrastInputs();
    const fg = over(bandBg, label);
    const ratio = contrastRatio(toHex(fg), toHex(bandBg));
    expect(ratio).toBeGreaterThanOrEqual(4.7);
  });
});

/* ── 8. Showcase reskin gallery ──────────────────────────────── */

describe("showcase reskin gallery", () => {
  const sectionOf = (el: HTMLElement): HTMLElement => {
    const s = el.querySelector<HTMLElement>("#showcase");
    if (!s) throw new Error("#showcase section not found");
    return s;
  };

  it("sits immediately after the trust strip and before #services", () => {
    const el = renderPage();
    const main = el.querySelector("main")!;
    const kids = Array.from(main.children);
    const trustIdx = kids.findIndex((c) => c.classList.contains("lsl-trust"));
    const showIdx = kids.findIndex((c) => c.id === "showcase");
    const servIdx = kids.findIndex((c) => c.id === "services");
    expect(trustIdx).toBeGreaterThanOrEqual(0);
    expect(showIdx).toBe(trustIdx + 1);
    expect(servIdx).toBeGreaterThan(showIdx);
  });

  it("exposes a labelled tablist with exactly 5 tabs in canonical order", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const tablist = sec.querySelector('[role="tablist"]');
    expect(tablist).not.toBeNull();
    expect(tablist?.getAttribute("aria-label")).toBeTruthy();
    const tabs = Array.from(sec.querySelectorAll('[role="tab"]'));
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
    const tabs = Array.from(
      sec.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );
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
    const tabs = Array.from(sec.querySelectorAll('[role="tab"]'));
    tabs.forEach((tab) => {
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

  it("maps every system to its own capture slug", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const srcs = Array.from(
      sec.querySelectorAll<HTMLImageElement>("img.lsl-showcase-shot"),
    ).map((img) => img.getAttribute("src"));
    expect(new Set(srcs)).toEqual(
      new Set([
        "/showcase/salt.webp",
        "/showcase/md3.webp",
        "/showcase/fluent.webp",
        "/showcase/carbon.webp",
        "/showcase/uoaui.webp",
      ]),
    );
  });

  it("the default capture has descriptive, honest alt text", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const salt = sec.querySelector<HTMLImageElement>(
      "#lsl-showcase-panel-salt img",
    );
    expect(salt?.getAttribute("src")).toBe("/showcase/salt.webp");
    const alt = salt?.getAttribute("alt") ?? "";
    expect(alt).toMatch(/Salt DS/);
    expect(alt).toMatch(/dashboard/i);
    expect(alt).not.toMatch(/mock|placeholder|illustration/i);
    expect(alt.length).toBeGreaterThan(20);
  });

  it("every capture reserves layout (width/height) and defers below-fold load", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const imgs = Array.from(
      sec.querySelectorAll<HTMLImageElement>("img.lsl-showcase-shot"),
    );
    expect(imgs).toHaveLength(5);
    imgs.forEach((img) => {
      expect(img.getAttribute("width")).toBeTruthy();
      expect(img.getAttribute("height")).toBeTruthy();
      // The section is below the fold, so every capture defers and never
      // competes with the hero on initial load.
      expect(img.getAttribute("loading")).toBe("lazy");
    });
  });

  it("every alt string is dash-free, descriptive display copy", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const alts = Array.from(
      sec.querySelectorAll<HTMLImageElement>("img.lsl-showcase-shot"),
    ).map((img) => img.getAttribute("alt") ?? "");
    expect(alts).toHaveLength(5);
    alts.forEach((alt) => {
      // STOP-class no-dash rule applies to alt copy too (read aloud by AT).
      expect(alt).not.toMatch(/[–—]/);
      expect(alt.length).toBeGreaterThan(20);
    });
  });

  it("clicking a tab switches the selected tab and the visible panel", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const carbon = Array.from(
      sec.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    ).find((t) => norm(t.textContent) === "Carbon")!;
    act(() =>
      carbon.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    );
    const selected = Array.from(sec.querySelectorAll('[role="tab"]')).filter(
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
    ).toBe("/showcase/carbon.webp");
  });

  it("holds a single-selection invariant across every tab", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const tabs = Array.from(
      sec.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );
    tabs.forEach((tab) => {
      act(() => tab.dispatchEvent(new MouseEvent("click", { bubbles: true })));
      const sel = Array.from(sec.querySelectorAll('[role="tab"]')).filter(
        (t) => t.getAttribute("aria-selected") === "true",
      );
      expect(sel).toHaveLength(1);
      const vis = Array.from(
        sec.querySelectorAll('[role="tabpanel"]'),
      ).filter((p) => p.getAttribute("aria-hidden") !== "true");
      expect(vis).toHaveLength(1);
    });
  });

  it("gallery copy carries no em/en dashes and frames captures honestly", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    expect(sec.textContent).not.toMatch(/[–—]/);
    const heading = norm(sec.querySelector(".lsl-section-heading")?.textContent);
    const lede = norm(sec.querySelector(".lsl-section-lede")?.textContent);
    const caption = norm(sec.querySelector(".lsl-showcase-caption")?.textContent);
    const copy = `${heading} ${lede} ${caption}`;
    // The moat claim: ONE dashboard rendered by all five systems.
    expect(copy).toMatch(/dashboard|app/i);
    // Positive honesty: these are described as real builder output, not art.
    expect(copy).toMatch(/real|capture|builder|present mode/i);
    // The captures are explicitly disclaimed as NOT mockups (the word "mock"
    // may appear, but only inside a negation, e.g. "not redrawn mockups").
    expect(copy).toMatch(/not\b[^.]*\bmock|real builder output/i);
  });

  it("drives the visual crossfade via data-active on exactly the active panel", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    let activePanels = sec.querySelectorAll(
      '[role="tabpanel"][data-active="true"]',
    );
    expect(activePanels).toHaveLength(1);
    expect(activePanels[0].id).toBe("lsl-showcase-panel-salt");
    expect((activePanels[0] as HTMLElement).getAttribute("tabindex")).toBe("0");

    const carbon = Array.from(
      sec.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    ).find((t) => norm(t.textContent) === "Carbon")!;
    act(() => carbon.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    activePanels = sec.querySelectorAll('[role="tabpanel"][data-active="true"]');
    expect(activePanels).toHaveLength(1);
    expect(activePanels[0].id).toBe("lsl-showcase-panel-carbon");
    // the now-inactive salt panel drops both the visual flag and focusability
    const salt = sec.querySelector("#lsl-showcase-panel-salt")!;
    expect(salt.getAttribute("data-active")).toBeNull();
    expect(salt.getAttribute("tabindex")).toBeNull();
  });

  it("arrow keys move selection AND focus, wrapping at both ends", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const tabs = Array.from(
      sec.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );
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
    const tabs = Array.from(
      sec.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );
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

describe("showcase gallery CSS contract", () => {
  const css = readFileSync(CSS_PATH, "utf8");

  it("guards the crossfade under prefers-reduced-motion", () => {
    expect(reduceBlocks(css)).toContain(".lsl-showcase-panel");
  });

  it("the showcase rules use lsl tokens and leak no raw hex", () => {
    const showcaseRules = (
      css.match(/\.lsl-showcase[^{]*\{[^}]*\}/g) ?? []
    ).join("\n");
    expect(showcaseRules.length).toBeGreaterThan(0);
    expect(showcaseRules).toMatch(/var\(--lsl-/);
    expect(showcaseRules).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });
});
