/* ════════════════════════════════════════════════════════════
   Landing ("product studio" direction): structure, copy, instrument
   and reduced-motion contract tests.

   Covers the 2026-10 landing brief (site-quality task 9):
   - First viewport: two-line headline, one line of supporting copy,
     the real prompt, and the instrument (real captures of one report
     across five design systems, light and dark).
   - IA: nav Systems / Workflow / Export / UI Kit, sections #systems,
     #workflow, #export, #cta, footer #about.
   - Truthful copy only: the three unverified claims are gone, the
     captures are described as captures, the concept animation is
     labelled as an illustration.
   - Handoff: the prompt carries the chosen system and mode into the
     builder; system links and the report link use real builder params.
   - No content hidden behind JS reveals; hero h1 paints at opacity 1.
   - No em/en dashes anywhere in rendered display copy (STOP-class).
   - Reduced motion: every CSS animation/transition is guarded; the
     concept video never autoplays and only downloads on play.

   Uses react-dom/client + act() directly (no RTL in the repo),
   matching codePanel.test.tsx.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { existsSync, readFileSync } from "node:fs";
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
    expect(lines).toEqual(["One finance report.", "Five design systems."]);
    expect(norm(h1?.textContent)).toBe("One finance report. Five design systems.");
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
      "The same report at phone width in all five systems. Each one is rendered with that system's own components and tokens, so corners, type, colour and density change while the content stays where you put it.",
    );
  });

  it("workflow is a three-step sequence: describe, edit, present", () => {
    const el = renderPage();
    expect(norm(el.querySelector("#workflow .lsl-section-heading")?.textContent)).toBe(
      "From one sentence to a finished report.",
    );
    const steps = Array.from(el.querySelectorAll("#workflow ol.lsl-steps > li"));
    expect(
      steps.map((s) => norm(s.querySelector(".lsl-step-title")?.textContent)),
    ).toEqual(["Describe it", "Edit it", "Present it"]);
    // The keyboard claim is the narrow, verified one (reorder + resize).
    expect(norm(steps[1].textContent)).toContain(
      "Reordering and resizing work from the keyboard too.",
    );
  });

  it("export section lists the six real export formats", () => {
    const el = renderPage();
    expect(norm(el.querySelector("#export .lsl-section-heading")?.textContent)).toBe(
      "Leave with code, not a screenshot.",
    );
    const names = Array.from(el.querySelectorAll("#export dl dt")).map((d) =>
      norm(d.textContent),
    );
    expect(names).toEqual([
      "React (TSX)",
      "Vite project",
      "HTML",
      "Tokens (JSON)",
      "Figma (SVG)",
      "SVG",
    ]);
    expect(el.querySelectorAll("#export dl dd")).toHaveLength(6);
  });

  it("export excerpt is real exporter output with the design system's own imports", () => {
    const el = renderPage();
    const code = el.querySelector("#export pre")?.textContent ?? "";
    expect(code).toContain('import { SaltProvider } from "@salt-ds/core";');
    expect(code).toContain('import "@salt-ds/theme/index.css";');
    expect(code).toContain("export default function Dashboard() {");
    // The syntax tint must not alter the text.
    expect(code.split("\n")).toHaveLength(20);
  });

  it("CTA band closes on the prompt, with both secondary routes", () => {
    const el = renderPage();
    const band = el.querySelector("#cta");
    expect(norm(band?.querySelector(".lsl-cta-heading")?.textContent)).toBe(
      "Start with one sentence.",
    );
    expect(norm(band?.querySelector(".lsl-section-lede")?.textContent)).toBe(
      "Describe a report and see it in five systems.",
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

  it("the default capture loads eagerly at high priority and is never clipped", () => {
    const el = renderPage();
    const img = el.querySelector<HTMLImageElement>("#showcase img.lsl-showcase-shot");
    expect(img?.getAttribute("loading")).toBe("eager");
    expect(img?.getAttribute("fetchpriority")).toBe("high");
    // The wipe only arms after the visitor's own action.
    expect(
      el.querySelector("#showcase .lsl-showcase-layer")?.hasAttribute("data-animate"),
    ).toBe(false);
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

  it("labels the animation as an illustration, never as a recording of the product", () => {
    const el = renderPage();
    const fig = el.querySelector("#demo");
    const caption = norm(fig?.querySelector("figcaption")?.textContent);
    expect(caption).toMatch(/concept animation/i);
    expect(caption).toMatch(/not a recording of the builder/i);
    expect(norm(el.textContent)).not.toMatch(/live capture/i);
    // Its poster is its own frame, not a product capture.
    expect(fig?.querySelector("video")?.getAttribute("poster")).toBe(
      "/showcase/concept-poster.webp",
    );
  });

  it("shows the real builder as a still, with honest alt text", () => {
    const el = renderPage();
    const shot = el.querySelector<HTMLImageElement>("#workflow img.lsl-demo-shot");
    expect(shot?.getAttribute("src")).toBe("/showcase/builder-edit.webp");
    expect(shot?.getAttribute("width")).toBeTruthy();
    expect(shot?.getAttribute("height")).toBeTruthy();
    expect(shot?.getAttribute("loading")).toBe("lazy");
    expect(shot?.getAttribute("alt")).toMatch(/Edit mode/);
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
    ".lsl-showcase-layer", // system wipe becomes an instant swap
    ".lsl-showcase-edge", // wipe edge line never shows
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
    expect(seen).toBeGreaterThanOrEqual(3); // nav fade, wipe, wipe edge
    expect(offenders).toEqual([]);
  });

  it("the wipe is fully disabled under reduced motion (no clip, no animation)", () => {
    expect(guarded).toMatch(
      /\.lsl-showcase-layer\[data-animate="true"\][^{]*\{[^}]*animation:\s*none;[^}]*clip-path:\s*none;/,
    );
  });

  it("no looping animation anywhere on the page", () => {
    expect(css).not.toMatch(/\binfinite\b/);
  });
});

/* ── 6. Structure ────────────────────────────────────────────── */

describe("section structure", () => {
  it("sections run hero, systems, workflow, export, cta, footer", () => {
    const el = renderPage();
    const main = el.querySelector("main");
    const kids = Array.from(main?.children ?? []);
    expect(kids[1]?.classList.contains("lsl-hero")).toBe(true);
    const ids = kids.map((c) => c.id).filter(Boolean);
    expect(ids).toEqual(["systems", "workflow", "export", "cta", "about"]);
  });

  it("every section is labelled by its own heading", () => {
    const el = renderPage();
    el.querySelectorAll("main > section").forEach((sec) => {
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
        expect(img?.getAttribute("src")).toBe(`/showcase/esg-${id}-${mode}.webp`);
        const phone = img?.parentElement?.querySelector("source");
        expect(phone?.getAttribute("srcset")).toBe(
          `/showcase/esg-${id}-${mode}-phone.webp`,
        );
        expect(phone?.getAttribute("media")).toBe("(max-width: 640px)");
        seen.add(img!.getAttribute("src")!);
      }
    }
    expect(seen.size).toBe(10);
  });

  it("every capture the page references exists in public/showcase", () => {
    const src = readFileSync(PAGE_PATH, "utf8");
    const files = new Set<string>(
      Array.from(src.matchAll(/\/showcase\/([\w-]+\.webp)/g)).map((m) => m[1]),
    );
    for (const id of ["salt", "md3", "fluent", "carbon", "uoaui"]) {
      for (const mode of ["light", "dark"]) {
        files.add(`esg-${id}-${mode}.webp`);
        files.add(`esg-${id}-${mode}-phone.webp`);
      }
    }
    expect(files.size).toBe(22);
    files.forEach((f) =>
      expect(existsSync(resolve(process.cwd(), "public/showcase", f)), f).toBe(true),
    );
  });

  it("the default capture has descriptive, honest alt text", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    const salt = sec.querySelector<HTMLImageElement>(
      "#lsl-showcase-panel-salt img",
    );
    expect(salt?.getAttribute("src")).toBe("/showcase/esg-salt-light.webp");
    const alt = salt?.getAttribute("alt") ?? "";
    expect(alt).toMatch(/Salt DS/);
    expect(alt).toMatch(/report/i);
    expect(alt).toMatch(/light mode/);
    expect(alt).not.toMatch(/mock|placeholder|illustration/i);
    expect(alt.length).toBeGreaterThan(20);
  });

  it("every capture reserves layout (width/height) so nothing shifts", () => {
    const el = renderPage();
    const imgs = Array.from(el.querySelectorAll<HTMLImageElement>("img"));
    expect(imgs.length).toBeGreaterThanOrEqual(7);
    imgs.forEach((img) => {
      expect(img.getAttribute("width")).toBeTruthy();
      expect(img.getAttribute("height")).toBeTruthy();
    });
    // Below-the-fold captures defer and never compete with the hero.
    const strip = Array.from(
      el.querySelectorAll<HTMLImageElement>("#systems img"),
    );
    expect(strip).toHaveLength(5);
    strip.forEach((img) => expect(img.getAttribute("loading")).toBe("lazy"));
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
    ).toBe("/showcase/esg-carbon-light.webp");
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
    expect(caption).toMatch(/ESG Analytics template/);
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

  it("a switch keeps the previous capture underneath and arms the wipe", () => {
    const el = renderPage();
    const sec = sectionOf(el);
    expect(sec.querySelector(".lsl-showcase-ghost")).toBeNull();
    click(tabsOf(sec).find((t) => norm(t.textContent) === "Material 3")!);
    const ghost = sec.querySelector(".lsl-showcase-ghost");
    expect(ghost?.getAttribute("aria-hidden")).toBe("true");
    const ghostImg = ghost?.querySelector("img");
    expect(ghostImg?.getAttribute("src")).toBe("/showcase/esg-salt-light.webp");
    expect(ghostImg?.getAttribute("alt")).toBe(""); // decorative duplicate
    expect(
      sec.querySelector(".lsl-showcase-layer")?.getAttribute("data-animate"),
    ).toBe("true");
    // The wipe waits for the new capture to decode before it runs.
    expect(sec.querySelector(".lsl-showcase-layer")?.hasAttribute("data-ready")).toBe(false);
    act(() => {
      activeImg(sec)!.dispatchEvent(new Event("load"));
    });
    expect(
      sec.querySelector(".lsl-showcase-layer")?.getAttribute("data-ready"),
    ).toBe("true");
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
    expect(activeImg(sec)?.getAttribute("src")).toBe("/showcase/esg-salt-dark.webp");
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
    forms.forEach((f) => {
      expect(hidden(f, "ds")).toBe("salt");
      expect(hidden(f, "mode")).toBe("light");
    });
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
    forms.forEach((f) => {
      expect(hidden(f, "ds")).toBe("md3");
      expect(hidden(f, "mode")).toBe("dark");
    });
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
      (a) => norm(a.textContent) === "Open this report in the builder",
    );
    expect(link?.getAttribute("href")).toBe("/builder?prompt=Build+me+an+ESG+Analytics");
  });
});

describe("instrument CSS contract", () => {
  const css = readFileSync(CSS_PATH, "utf8");

  it("guards the wipe under prefers-reduced-motion", () => {
    expect(reduceBlocks(css)).toContain(".lsl-showcase-layer");
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

  it("caps the hero display size for phones in the shared type scale", () => {
    const globals = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
    expect(globals).toMatch(/--lsl-text-display-l:\s*clamp\(34px,/);
    expect(css).toMatch(/\.lsl-hero-headline\s*\{[^}]*font-size:\s*var\(--lsl-text-display-l\)/);
  });
});
