"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  MonitorSmartphone,
  Pause,
  PanelsTopLeft,
  Play,
  Share2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import "./hero.css";

const navItems = [
  { label: "Home", href: "#main-content" },
  { label: "Demo", href: "#demo" },
  { label: "Systems", href: "#systems" },
  { label: "Workflow", href: "#workflow" },
  { label: "Studio", href: "#features" },
  { label: "Export", href: "#export" },
];

const systems = [
  {
    key: "salt",
    name: "Salt DS",
    detail: "Dense operational surfaces with precise spacing, clear state, and trader-grade controls.",
    signal: "High density",
  },
  {
    key: "m3",
    name: "Material 3",
    detail: "Adaptive surfaces, tonal hierarchy, and expressive product rhythm from one prompt.",
    signal: "Adaptive",
  },
  {
    key: "fluent",
    name: "Fluent 2",
    detail: "Calm command patterns for dashboards, forms, navigation, and review workflows.",
    signal: "Command",
  },
  {
    key: "carbon",
    name: "Carbon",
    detail: "Crisp enterprise layouts for data grids, reporting, release checks, and handoff.",
    signal: "Data first",
  },
  {
    key: "ausos",
    name: "ausos",
    detail: "Glass-native AI workspace patterns that keep prompts, variants, and exports visible.",
    signal: "AI native",
  },
];

const workflow = [
  {
    eyebrow: "01",
    title: "Prompt",
    body: "Describe the product surface, audience, density, and design-system direction.",
  },
  {
    eyebrow: "02",
    title: "Generate",
    body: "Get a structured interface draft with real controls, data, and responsive states.",
  },
  {
    eyebrow: "03",
    title: "Compare",
    body: "Move the same idea through Salt, Material, Fluent, Carbon, and ausos treatments.",
  },
  {
    eyebrow: "04",
    title: "Ship",
    body: "Share the selected direction or export clean HTML, React, and Vite handoff paths.",
  },
];

const features = [
  {
    icon: Sparkles,
    title: "Prompt canvas",
    body: "Turn a product brief into a visible interface direction while the context stays close.",
  },
  {
    icon: SlidersHorizontal,
    title: "Theme studio",
    body: "Tune mode, contrast, density, and token choices without rebuilding the surface.",
  },
  {
    icon: MonitorSmartphone,
    title: "Responsive frames",
    body: "Review desktop, tablet, and mobile layouts inside the same focused workspace.",
  },
  {
    icon: Share2,
    title: "Review links",
    body: "Send compact previews that are polished enough for critique and stakeholder review.",
  },
  {
    icon: Download,
    title: "Export routes",
    body: "Move from generated canvas to HTML, React, or Vite without losing system intent.",
  },
  {
    icon: PanelsTopLeft,
    title: "Component depth",
    body: "Compose navigation, forms, charts, data grids, overlays, and layout primitives.",
  },
];

const markers = [
  { key: "salt", label: "Salt", meta: "20.4s", position: "top-left", glyph: "01" },
  { key: "m3", label: "Material", meta: "2.8k", position: "top-right", glyph: "02" },
  { key: "fluent", label: "Fluent", meta: "19.3k", position: "left", glyph: "03" },
  { key: "carbon", label: "Carbon", meta: "1.4k", position: "right", glyph: "04" },
];

const proof = [
  { value: "5", label: "design languages from one brief" },
  { value: "Token-aware", label: "mode, contrast, and density controls" },
  { value: "Responsive", label: "desktop, tablet, and mobile previews" },
  { value: "Handoff", label: "share links plus HTML, React, and Vite exports" },
];

const partnerLogos = ["Vercel", "loom", "Cash App", "Loops", "zapier", "ramp", "Raycast"];

const DEMO_STEP_DURATION_MS = 6000;

const previewSystems = [
  { key: "salt", label: "Salt" },
  { key: "m3", label: "M3" },
  { key: "fluent", label: "Fluent" },
  { key: "carbon", label: "Carbon" },
  { key: "ausos", label: "ausos" },
] as const;

type PreviewSystemKey = (typeof previewSystems)[number]["key"];
type PreviewLayout = "trade" | "material" | "command" | "carbon" | "glass";

type PreviewDemoStep = {
  id: string;
  phase: "prompt" | "generate" | "compare" | "tune" | "share";
  system: PreviewSystemKey;
  layout: PreviewLayout;
  status: string;
  prompt: string;
  toolbar: [string, string, string];
  surfaceLabel: string;
  title: string;
  body: string;
  metrics: Array<{ label: string; value: string }>;
  rows: Array<{ label: string; value: string; meta: string }>;
  chart: number[];
  shareLabel: string;
  exportLabel: string;
};

const previewDemoSteps: PreviewDemoStep[] = [
  {
    id: "prompt",
    phase: "prompt",
    system: "salt",
    layout: "trade",
    status: "Prompt ready",
    prompt: "Build a Salt DS trading operations board with status, exposure, and approval queues.",
    toolbar: ["Desktop", "Dark", "Dense"],
    surfaceLabel: "Salt DS surface",
    title: "Trading Operations",
    body: "Compact controls, visible risk signals, and high-density rows for enterprise review.",
    metrics: [
      { label: "Exposure", value: "$84.2m" },
      { label: "Orders", value: "128" },
      { label: "Health", value: "97%" },
    ],
    rows: [
      { label: "EMEA flow", value: "$21.4m", meta: "+4.2%" },
      { label: "APAC risk", value: "Low", meta: "2 alerts" },
      { label: "Approvals", value: "18", meta: "6 urgent" },
    ],
    chart: [48, 72, 58, 86, 66, 94],
    shareLabel: "Desk review ready",
    exportLabel: "Salt variant",
  },
  {
    id: "generate",
    phase: "generate",
    system: "m3",
    layout: "material",
    status: "Generating UI",
    prompt: "Generate the same product view in Material 3 with adaptive cards and soft hierarchy.",
    toolbar: ["Tablet", "Light", "Comfortable"],
    surfaceLabel: "Material 3 variant",
    title: "Growth Snapshot",
    body: "Rounded surfaces, tonal emphasis, and campaign cards arranged for quick decisions.",
    metrics: [
      { label: "Leads", value: "3.4k" },
      { label: "CTR", value: "8.7%" },
      { label: "Spend", value: "$12k" },
    ],
    rows: [
      { label: "Organic", value: "42%", meta: "+8%" },
      { label: "Paid search", value: "31%", meta: "+3%" },
      { label: "Lifecycle", value: "27%", meta: "steady" },
    ],
    chart: [54, 78, 64, 90, 72, 98],
    shareLabel: "M3 preview live",
    exportLabel: "Tokens mapped",
  },
  {
    id: "compare",
    phase: "compare",
    system: "fluent",
    layout: "command",
    status: "Comparing systems",
    prompt: "Show the same dashboard in Fluent with softer navigation and compact states.",
    toolbar: ["Desktop", "Dark", "Comfortable"],
    surfaceLabel: "Fluent variant",
    title: "Service Command Center",
    body: "Incidents, queue pressure, and SLA signals shift into a calmer enterprise layout.",
    metrics: [
      { label: "Incidents", value: "24" },
      { label: "SLA", value: "99.1%" },
      { label: "Queue", value: "36" },
    ],
    rows: [
      { label: "Billing queue", value: "12", meta: "triage" },
      { label: "Platform SLA", value: "99.1%", meta: "on track" },
      { label: "Field ops", value: "8", meta: "watch" },
    ],
    chart: [62, 46, 74, 68, 88, 58],
    shareLabel: "Compare link live",
    exportLabel: "Variant saved",
  },
  {
    id: "tune",
    phase: "tune",
    system: "carbon",
    layout: "carbon",
    status: "Tuning theme",
    prompt: "Tune the approved view as a Carbon data workspace for dense enterprise reporting.",
    toolbar: ["Desktop", "High contrast", "Dense"],
    surfaceLabel: "Carbon data view",
    title: "Release Readiness",
    body: "Square panels, crisp dividers, and clear operational states for handoff review.",
    metrics: [
      { label: "Checks", value: "32" },
      { label: "Ready", value: "96%" },
      { label: "Exports", value: "3" },
    ],
    rows: [
      { label: "Accessibility", value: "Pass", meta: "AA" },
      { label: "Regression", value: "31/32", meta: "1 review" },
      { label: "Package", value: "React", meta: "ready" },
    ],
    chart: [72, 54, 82, 48, 76, 88],
    shareLabel: "Carbon review",
    exportLabel: "React export",
  },
  {
    id: "share",
    phase: "share",
    system: "ausos",
    layout: "glass",
    status: "Ready to share",
    prompt: "Package the ausos AI workspace with glass panels, preview link, and clean handoff.",
    toolbar: ["Desktop", "Glass", "Balanced"],
    surfaceLabel: "ausos workspace",
    title: "AI Builder Handoff",
    body: "Translucent panels, prompt context, and share states stay polished without hiding content.",
    metrics: [
      { label: "Prompts", value: "14" },
      { label: "Variants", value: "5" },
      { label: "Shared", value: "Live" },
    ],
    rows: [
      { label: "Preview room", value: "Open", meta: "3 viewers" },
      { label: "Design notes", value: "Synced", meta: "AI summary" },
      { label: "Export path", value: "Vite", meta: "queued" },
    ],
    chart: [66, 82, 74, 92, 80, 96],
    shareLabel: "Share link copied",
    exportLabel: "ausos handoff",
  },
];

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(query.matches);

    updatePreference();
    query.addEventListener("change", updatePreference);
    return () => query.removeEventListener("change", updatePreference);
  }, []);

  return reducedMotion;
}

function useContentParallax(disabled: boolean) {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (typeof window === "undefined" || !root) return;

    const resetMotion = () => {
      root.style.setProperty("--content-shift", "0px");
      root.style.setProperty("--spark-shift", "0px");
      root.style.setProperty("--card-lift", "0px");
      root.style.setProperty("--heading-shift", "0px");
      root.style.setProperty("--content-depth", "0");
    };

    if (disabled) {
      resetMotion();
      return;
    }

    let frameId = 0;
    const mobileQuery = window.matchMedia("(max-width: 640px)");

    const updateMotion = () => {
      frameId = 0;

      if (mobileQuery.matches) {
        resetMotion();
        return;
      }

      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const viewportHeight = Math.max(window.innerHeight, 1);
      const rawProgress = (scrollY - viewportHeight * 0.5) / (viewportHeight * 2.8);
      const progress = Math.min(1, Math.max(0, rawProgress));
      const eased = progress * progress * (3 - 2 * progress);

      root.style.setProperty("--content-shift", `${(-18 * eased).toFixed(2)}px`);
      root.style.setProperty("--spark-shift", `${(scrollY * 0.075).toFixed(2)}px`);
      root.style.setProperty("--card-lift", `${(-8 * eased).toFixed(2)}px`);
      root.style.setProperty("--heading-shift", `${(-12 * eased).toFixed(2)}px`);
      root.style.setProperty("--content-depth", eased.toFixed(3));
    };

    const requestUpdate = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateMotion);
    };

    updateMotion();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    mobileQuery.addEventListener("change", requestUpdate);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      mobileQuery.removeEventListener("change", requestUpdate);
    };
  }, [disabled]);

  return rootRef;
}

function ContentAtmosphere() {
  return (
    <div className="content-atmosphere" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

function PreviewSurface({ step }: { step: PreviewDemoStep }) {
  return (
    <div className={`preview-layout preview-layout--${step.layout}`}>
      <div className="preview-hero-card">
        <span>{step.surfaceLabel}</span>
        <strong>{step.title}</strong>
        <p>{step.body}</p>
      </div>
      <div className="preview-metrics">
        {step.metrics.map((metric) => (
          <div className="preview-metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <div className="preview-detail-list" aria-label={`${step.surfaceLabel} details`}>
        {step.rows.map((row) => (
          <div className="preview-detail-row" key={row.label}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
            <em>{row.meta}</em>
          </div>
        ))}
      </div>
      <div className="preview-chart" aria-hidden="true">
        {step.chart.map((height, index) => (
          <span
            key={`${step.id}-${index}`}
            style={{
              height: `${height}%`,
              animationDelay: `${index * 0.12}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function HeroPreviewDemo() {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const step = previewDemoSteps[stepIndex];
  const demoPaused = isPaused || reducedMotion;

  useEffect(() => {
    if (reducedMotion) {
      setStepIndex(0);
      return;
    }

    if (isPaused) return;

    const intervalId = window.setInterval(() => {
      setStepIndex((current) => (current + 1) % previewDemoSteps.length);
    }, DEMO_STEP_DURATION_MS);

    return () => window.clearInterval(intervalId);
  }, [isPaused, reducedMotion]);

  const controlLabel = reducedMotion
    ? "Preview demo paused for reduced motion"
    : isPaused
      ? "Play preview demo"
      : "Pause preview demo";

  return (
    <div
      className="hero-product"
      data-preview-stage={step.phase}
      data-preview-system={step.system}
      data-preview-layout={step.layout}
      data-preview-paused={demoPaused ? "true" : "false"}
      aria-label="Design Hub preview demo"
    >
      <div className="preview-topbar">
        <div className="preview-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className="preview-title">Design Hub Builder</span>
        <span className="preview-status" aria-live="polite">
          {step.status}
        </span>
        <button
          className="preview-demo-control"
          type="button"
          aria-label={controlLabel}
          title={controlLabel}
          disabled={reducedMotion}
          onClick={() => setIsPaused((paused) => !paused)}
        >
          {isPaused || reducedMotion ? (
            <Play size={14} strokeWidth={2} aria-hidden="true" />
          ) : (
            <Pause size={14} strokeWidth={2} aria-hidden="true" />
          )}
        </button>
        <span className="preview-progress-track" aria-hidden="true">
          <span key={step.id} />
        </span>
      </div>
      <div className="preview-shell">
        <aside className="preview-sidebar" aria-label="System tabs">
          {previewSystems.map((system) => (
            <span
              className={`preview-tab${system.key === step.system ? " preview-tab--active" : ""}`}
              key={system.key}
              aria-current={system.key === step.system ? "true" : undefined}
            >
              {system.label}
            </span>
          ))}
        </aside>
        <div className="preview-canvas">
          <div className="preview-prompt">
            <Sparkles size={14} strokeWidth={2} aria-hidden="true" />
            <span className="preview-copy-swap" key={`prompt-${step.id}`}>
              {step.prompt}
            </span>
          </div>
          <div className="preview-board" key={`board-${step.id}`}>
            <div className="preview-toolbar">
              {step.toolbar.map((item) => (
                <span className="preview-copy-swap" key={item}>
                  {item}
                </span>
              ))}
            </div>
            <PreviewSurface step={step} />
          </div>
        </div>
      </div>
      <div className="preview-float preview-float--share">
        <Share2 size={15} strokeWidth={2} aria-hidden="true" />
        <span className="preview-copy-swap" key={`share-${step.id}`}>
          {step.shareLabel}
        </span>
      </div>
      <div className="preview-float preview-float--export">
        <Download size={15} strokeWidth={2} aria-hidden="true" />
        <span className="preview-copy-swap" key={`export-${step.id}`}>
          {step.exportLabel}
        </span>
      </div>
    </div>
  );
}

export function HeroHeader() {
  const reducedMotion = usePrefersReducedMotion();
  const landingRef = useContentParallax(reducedMotion);

  return (
    <main id="main-content" className="hero landing-page" ref={landingRef}>
      <section className="hero-stage" aria-labelledby="landing-title">
        <div className="hero-stage-shell">
          <nav className="landing-nav" aria-label="Primary">
            <Link href="/" className="landing-brand" aria-label="ausos home">
              <span className="landing-brand-mark" aria-hidden="true">
                <img src="/aologo.svg" alt="" className="landing-brand-logo" />
              </span>
            </Link>

            <div className="landing-nav-links" aria-label="Landing sections">
              {navItems.map((item) => (
                <a href={item.href} key={item.href}>
                  {item.label}
                </a>
              ))}
            </div>

            <Link href="/login" className="landing-nav-cta">
              <span>Create Account</span>
              <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
            </Link>
          </nav>

          <div className="stage-light stage-light--right" aria-hidden="true" />
          <div className="stage-light stage-light--left" aria-hidden="true" />
          <div className="stage-grid" aria-hidden="true" />

          <div className="stage-track stage-track--top-left" aria-hidden="true" />
          <div className="stage-track stage-track--left" aria-hidden="true" />
          <div className="stage-track stage-track--right" aria-hidden="true" />
          <div className="stage-track stage-track--bottom" aria-hidden="true" />
          <div className="stage-motion-lines" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          {markers.map((marker) => (
            <div className={`stage-marker stage-marker--${marker.position}`} key={marker.key}>
              <span className="stage-marker-icon" aria-hidden="true">
                {marker.glyph}
              </span>
              <span>
                <strong>{marker.label}</strong>
                <em>{marker.meta}</em>
              </span>
            </div>
          ))}

          <a className="stage-play" href="#demo" aria-label="Jump to live builder demo">
            <Play size={18} fill="currentColor" strokeWidth={1.8} aria-hidden="true" />
          </a>

          <div className="hero-copy">
            <div className="hero-kicker">
              <Sparkles size={13} strokeWidth={1.8} aria-hidden="true" />
              Unlock your system stack
              <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
            </div>
            <h1 id="landing-title" className="hero-headline">
              ausos for <span>Design Flow</span>
            </h1>
            <p className="hero-body">
              Prototype, compare, and hand off production-ready interfaces across Salt DS,
              Material 3, Fluent 2, Carbon, and ausos from one quiet AI workspace.
            </p>
            <div className="hero-actions">
              <Link href="/login" className="landing-btn landing-btn--dark">
                <span>Open App</span>
                <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
              </Link>
              <a href="#workflow" className="landing-btn landing-btn--light">
                <span>Discover More</span>
              </a>
            </div>
          </div>

          <div className="stage-corner-note stage-corner-note--left">
            <span aria-hidden="true">+</span>
            <strong>02/03</strong>
            <em>Scroll down</em>
          </div>

          <div className="stage-corner-note stage-corner-note--right">
            <strong>Design horizons</strong>
            <span aria-hidden="true" />
          </div>

          <div className="stage-logo-rail" aria-label="Previewed with modern product teams">
            {partnerLogos.map((logo) => (
              <span key={logo}>{logo}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="proof-strip" aria-label="Product proof points">
        {proof.map((item) => (
          <div className="proof-item" key={item.value}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </section>

      <section id="demo" className="landing-section demo-section" aria-labelledby="demo-title">
        <ContentAtmosphere />
        <div className="section-heading demo-heading content-parallax-heading">
          <span className="section-kicker">Live demo</span>
          <h2 id="demo-title">See the builder move from prompt to handoff.</h2>
        </div>
        <div className="demo-frame content-card-grid">
          <HeroPreviewDemo />
        </div>
      </section>

      <section id="systems" className="landing-section systems-section">
        <ContentAtmosphere />
        <div className="section-heading content-parallax-heading">
          <span className="section-kicker">Systems</span>
          <h2>One interface idea, five distinct product languages.</h2>
          <p>
            ausos keeps each system's rhythm intact, from dense trading screens to softer
            review surfaces and glass-native AI workspaces.
          </p>
        </div>
        <div className="system-grid content-card-grid">
          {systems.map((system) => (
            <article className="system-card content-card" data-system={system.key} key={system.name}>
              <span className="system-card-signal">{system.signal}</span>
              <h3>{system.name}</h3>
              <p>{system.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="landing-section workflow-section">
        <ContentAtmosphere />
        <div className="section-heading content-parallax-heading">
          <span className="section-kicker">Workflow</span>
          <h2>A focused path from prompt to handoff.</h2>
        </div>
        <div className="workflow-grid content-card-grid">
          {workflow.map((item) => (
            <article className="workflow-step content-card" key={item.eyebrow}>
              <span>{item.eyebrow}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="landing-section features-section">
        <ContentAtmosphere />
        <div className="section-heading content-parallax-heading">
          <span className="section-kicker">Studio</span>
          <h2>Polished enough for critique, practical enough for production.</h2>
          <p>
            The product work stays visible: prompt context, system comparison, responsive
            review, and export all sit inside the same workspace.
          </p>
        </div>
        <div className="feature-grid content-card-grid">
          {features.map(({ icon: Icon, title, body }) => (
            <article className="feature-card content-card" key={title}>
              <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="export" className="landing-section export-section">
        <ContentAtmosphere />
        <div className="export-panel content-card">
          <div>
            <span className="section-kicker">Private studio</span>
            <h2>Start with a prompt. Leave with a system-aware interface.</h2>
            <p>
              Build the first direction, compare it across product languages, and carry the
              selected surface into review, sharing, and export.
            </p>
          </div>
          <ul className="export-list" aria-label="Supported handoff paths">
            <li><CheckCircle2 size={17} strokeWidth={2} aria-hidden="true" /> Share previews</li>
            <li><CheckCircle2 size={17} strokeWidth={2} aria-hidden="true" /> Export React</li>
            <li><CheckCircle2 size={17} strokeWidth={2} aria-hidden="true" /> Export HTML</li>
          </ul>
          <Link href="/login" className="landing-btn landing-btn--light">
            <span>Enter Studio</span>
            <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <span>ausos</span>
        <span>AI-powered design-system builder</span>
      </footer>
    </main>
  );
}
