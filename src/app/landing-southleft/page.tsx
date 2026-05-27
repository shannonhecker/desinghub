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

import "./landing-southleft.css";

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

/* ── Content (kept local — prototype, not a CMS surface) ────────────── */

const NAV_LINKS = [
  { href: "#services", label: "Workbench" },
  { href: "#projects", label: "Featured" },
  { href: "#voices", label: "Voices" },
  { href: "#about", label: "About" },
] as const;

const SERVICES = [
  {
    num: "01",
    heading: "Five systems, one canvas",
    body: "Compose with Salt, Material 3, Fluent 2, Carbon, and uoaui side by side. No context switching, no theme re-plumbing.",
  },
  {
    num: "02",
    heading: "Token-aware switching",
    body: "Swap a block from Salt to Carbon and every spacing, radius, and color resolves through the right token layer. Nothing hardcoded.",
  },
  {
    num: "03",
    heading: "Drag and drop composition",
    body: "Sketch a page as fast as you would in a presentation tool. Components stay real, accessible, production-shaped.",
  },
  {
    num: "04",
    heading: "Assisted authoring",
    body: "Generate variants, audit contrast, and pressure-test layouts against a brief without leaving the canvas.",
  },
] as const;

const PROJECTS = [
  {
    label: "Case study",
    heading: "A workbench for product teams choosing between design systems.",
    body: "uoaui.ai started as a side-by-side comparison tool. It is now a working canvas where designers and engineers prototype the same screen in five systems, then read the trade-offs across tokens, density, and accessibility.",
    link: "Read the build notes",
    href: "#",
  },
  {
    label: "Field notes",
    heading: "Tokens are the abstraction. Everything else is rendering.",
    body: "A long-form look at why token layers, not components, are the unit of portability across design systems. Practical patterns from shipping uoaui.ai, plus the moments the abstraction breaks down.",
    link: "Read the essay",
    href: "#",
  },
] as const;

const QUOTES = [
  {
    text: "It is the first tool that treats five design systems as peers instead of asking us to pick a winner before we have the data.",
    name: "Design lead",
    org: "Fintech platform team",
  },
  {
    text: "The token-switching is the bit that surprised the engineers. The same composition holds up across Salt and Carbon without a rewrite.",
    name: "Staff engineer",
    org: "Internal tooling group",
  },
  {
    text: "Feels like a sketchbook, behaves like a production component library. That gap is usually where these tools fall apart.",
    name: "Principal designer",
    org: "Enterprise SaaS",
  },
] as const;

/* ── Hooks ───────────────────────────────────────────────────────────── */

/** Toggle the sticky nav background once the user scrolls past the hero crest. */
function useScrolledNav(): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
        <div className="lsl-container">
          <p className="lsl-hero-eyebrow" data-reveal>
            uoaui.ai, the design-system workbench
          </p>
          <h1
            id="lsl-hero-headline"
            className="lsl-hero-headline"
            data-reveal
          >
            Design across five systems, <em>without picking a winner</em>.
          </h1>
          <p className="lsl-hero-sub" data-reveal>
            A canvas for product teams that need to reason about Salt, Material
            3, Fluent 2, Carbon, and uoaui as peers. Token-aware, drag and
            drop, and built so the prototype and the production shape rhyme.
          </p>
          <div className="lsl-hero-actions" data-reveal>
            <Link href="/builder" className="lsl-cta">
              Open the workbench
            </Link>
            <a className="lsl-hero-secondary" href="#services">
              See what it does
              <span aria-hidden="true">{"→"}</span>
            </a>
          </div>
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
          <p className="lsl-section-label" data-reveal>What it does</p>
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

          <div className="lsl-services" data-reveal>
            {SERVICES.map((s) => (
              <article key={s.num} className="lsl-service">
                <p className="lsl-service-num">{s.num}</p>
                <h3 className="lsl-service-heading">{s.heading}</h3>
                <p className="lsl-service-body">{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <hr className="lsl-rule" />

      {/* ── Featured projects ── */}
      <section
        id="projects"
        className="lsl-section"
        aria-labelledby="lsl-projects-heading"
      >
        <div className="lsl-container">
          <p className="lsl-section-label" data-reveal>Featured</p>
          <h2
            id="lsl-projects-heading"
            className="lsl-section-heading"
            data-reveal
          >
            Recent work and writing.
          </h2>
          <p className="lsl-section-lede" data-reveal>
            Two pieces that sit closest to how the workbench is being used in
            production today.
          </p>

          <div className="lsl-projects">
            {PROJECTS.map((p, idx) => (
              <article
                key={p.heading}
                className="lsl-project"
                data-flip={idx % 2 === 1}
                data-reveal
              >
                {/*
                  TODO: replace with real screenshots. public/examples/ only
                  contains design-references.md right now — Shannon to drop
                  workbench captures into public/landing-southleft/ and swap
                  the placeholder for <Image src=… />.
                */}
                <div className="lsl-project-figure">
                  <span className="lsl-project-figure-placeholder">
                    Screenshot placeholder
                  </span>
                </div>
                <div className="lsl-project-body">
                  <p className="lsl-project-label">{p.label}</p>
                  <h3 className="lsl-project-heading">{p.heading}</h3>
                  <p>{p.body}</p>
                  <a className="lsl-project-link" href={p.href}>
                    {p.link}
                    <span aria-hidden="true">{"→"}</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <hr className="lsl-rule" />

      {/* ── Testimonials ── */}
      <section
        id="voices"
        className="lsl-section-tight"
        aria-labelledby="lsl-voices-heading"
      >
        <div className="lsl-container">
          <p className="lsl-section-label" data-reveal>Voices</p>
          <h2
            id="lsl-voices-heading"
            className="lsl-section-heading"
            data-reveal
          >
            How teams describe it.
          </h2>
        </div>
        <div
          className="lsl-quotes"
          data-reveal
          role="region"
          aria-label="Testimonials, scroll horizontally"
          tabIndex={0}
        >
          {QUOTES.map((q) => (
            <figure key={q.text} className="lsl-quote">
              <div>
                <p className="lsl-quote-mark" aria-hidden="true">
                  {"“"}
                </p>
                <blockquote className="lsl-quote-text">{q.text}</blockquote>
              </div>
              <figcaption className="lsl-quote-attrib">
                <strong>{q.name}</strong>, {q.org}
              </figcaption>
            </figure>
          ))}
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
          <div className="lsl-footer-grid">
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

            <div>
              <p className="lsl-footer-col-label">Product</p>
              <ul className="lsl-footer-list">
                <li><a href="/builder">Workbench</a></li>
                <li><a href="/ui-kit">UI kit</a></li>
                <li><a href="/theme-builder">Theme builder</a></li>
                <li><a href="/token-editor">Token editor</a></li>
              </ul>
            </div>

            <div>
              <p className="lsl-footer-col-label">Company</p>
              <ul className="lsl-footer-list">
                <li><a href="#">About</a></li>
                <li><a href="#">Writing</a></li>
                <li><a href="#">Changelog</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>

            <div>
              <p className="lsl-footer-col-label">Elsewhere</p>
              <ul className="lsl-footer-list">
                <li><a href="https://github.com/shannonhecker">GitHub</a></li>
                <li><a href="#">LinkedIn</a></li>
                <li><a href="#">Read.cv</a></li>
                <li><a href="#">RSS</a></li>
              </ul>
            </div>
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
