"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Layers3,
  MonitorSmartphone,
  Pause,
  PanelsTopLeft,
  Play,
  Share2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { HeroBeam } from "./hero-beam/HeroBeam";
import { heroEnterTimeline, revealOnScroll } from "@/lib/motion";
import "./hero.css";

const LandingScrollFlight = dynamic(() => import("./LandingScrollFlight"), { ssr: false });

const systems = [
  { name: "Salt DS", detail: "Enterprise trading workflows" },
  { name: "Material 3", detail: "Adaptive product surfaces" },
  { name: "Fluent 2", detail: "Microsoft-style app patterns" },
  { name: "Carbon", detail: "Data-dense IBM interfaces" },
  { name: "ausos", detail: "Glass-native AI workspaces" },
];

const workflow = [
  {
    eyebrow: "01",
    title: "Prompt the interface",
    body: "Describe the product surface, audience, and components you need.",
  },
  {
    eyebrow: "02",
    title: "Compare systems",
    body: "Review the same concept across Salt DS, Material 3, Fluent 2, Carbon, and ausos.",
  },
  {
    eyebrow: "03",
    title: "Refine and ship",
    body: "Tune theme, density, preview states, share the result, and export when ready.",
  },
];

const features = [
  {
    icon: Sparkles,
    title: "AI prompt workflow",
    body: "Generate structured interface drafts from natural language, then keep refining in the builder.",
  },
  {
    icon: SlidersHorizontal,
    title: "Theme and density controls",
    body: "Switch modes, contrast levels, and density scales without rebuilding the same screen.",
  },
  {
    icon: MonitorSmartphone,
    title: "Responsive previews",
    body: "Check desktop, tablet, and mobile layouts inside the same workspace.",
  },
  {
    icon: Share2,
    title: "Shareable previews",
    body: "Create a compact preview link for review without exposing the whole workspace.",
  },
  {
    icon: Download,
    title: "Export options",
    body: "Move from generated canvas to HTML, React, or Vite project handoff paths.",
  },
  {
    icon: PanelsTopLeft,
    title: "Component coverage",
    body: "Explore buttons, forms, navigation, data grids, charts, overlays, and layout primitives.",
  },
];

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

    const advanceStep = () => {
      setStepIndex((current) => (current + 1) % previewDemoSteps.length);
    };
    const intervalId = window.setInterval(advanceStep, DEMO_STEP_DURATION_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPaused, reducedMotion]);

  const controlLabel = reducedMotion
    ? "Preview demo paused for reduced motion"
    : isPaused
      ? "Play preview demo"
      : "Pause preview demo";

  return (
    <div
      className="hero-product hero-enter"
      data-hero-enter
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
          <span />
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
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("js-enhanced");
    const tl = heroEnterTimeline(mainRef.current);

    const cleanups = Array.from(
      mainRef.current?.querySelectorAll<HTMLElement>("[data-reveal-group]") ?? [],
    ).map((group) =>
      revealOnScroll(group.querySelectorAll("[data-reveal]"), {
        start: "top 82%",
        end: "top 58%",
        offset: 28,
        stagger: 0.07,
      }),
    );

    return () => {
      tl?.kill();
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return (
    <main id="main-content" className="hero landing-page" ref={mainRef}>
      <LandingScrollFlight />
      <section className="hero-stage" aria-labelledby="landing-title">
        <HeroBeam />
        <div className="hero-ambient" aria-hidden="true" />
        <div className="hero-noise" aria-hidden="true" />

        <nav className="landing-nav hero-enter" data-hero-enter aria-label="Primary">
          <Link href="/" className="landing-brand" aria-label="ausos home">
            <span className="landing-brand-mark" aria-hidden="true">
              <img src="/aologo.svg" alt="" className="landing-brand-logo" />
            </span>
            <span>ausos</span>
          </Link>
          <div className="landing-nav-links" aria-label="Landing sections">
            <a href="#systems">Systems</a>
            <a href="#workflow">Workflow</a>
            <a href="#features">Features</a>
            <a href="#export">Export</a>
          </div>
          <Link href="/login" className="landing-nav-cta">
            <span>Start</span>
            <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
          </Link>
        </nav>

        <div className="hero-layout">
          <div className="hero-copy">
            <div className="hero-kicker hero-enter" data-hero-enter>
              <Sparkles size={16} strokeWidth={1.8} aria-hidden="true" />
              AI design system workspace
            </div>
            <h1 id="landing-title" className="hero-headline hero-enter" data-hero-enter>
              Design systems that move from prompt to production.
            </h1>
            <p className="hero-body hero-enter" data-hero-enter>
              Prototype product interfaces across Salt DS, Material 3, Fluent 2, Carbon,
              and ausos in one AI-powered builder.
            </p>
            <div className="hero-actions hero-enter" data-hero-enter>
              <Link href="/login" className="landing-btn landing-btn--primary">
                <span>Start Building</span>
                <ArrowRight size={17} strokeWidth={2} aria-hidden="true" />
              </Link>
              <a href="#workflow" className="landing-btn landing-btn--ghost">
                <Layers3 size={17} strokeWidth={1.8} aria-hidden="true" />
                <span>View Workflow</span>
              </a>
            </div>
            <div className="hero-system-row hero-enter" data-hero-enter aria-label="Supported design systems">
              {systems.map((system) => (
                <span key={system.name}>{system.name}</span>
              ))}
            </div>
          </div>

          <HeroPreviewDemo />
        </div>
      </section>

      <section className="proof-strip" data-reveal-group aria-label="Product proof points">
        <div className="proof-item" data-reveal>
          <strong>5</strong>
          <span>design systems</span>
        </div>
        <div className="proof-item" data-reveal>
          <strong>Theme</strong>
          <span>mode, contrast, density</span>
        </div>
        <div className="proof-item" data-reveal>
          <strong>Preview</strong>
          <span>desktop, tablet, mobile</span>
        </div>
        <div className="proof-item" data-reveal>
          <strong>Export</strong>
          <span>HTML, React, Vite</span>
        </div>
      </section>

      <section id="systems" className="landing-section systems-section" data-reveal-group>
        <div className="section-heading" data-reveal>
          <span className="section-kicker">Systems</span>
          <h2>One prompt surface for five distinct design languages.</h2>
          <p>
            Keep each system character intact while exploring the same product idea across
            enterprise, material, fluent, carbon, and glass-native interfaces.
          </p>
        </div>
        <div className="system-grid">
          {systems.map((system) => (
            <article className="system-card" key={system.name} data-reveal>
              <span className="system-card-dot" aria-hidden="true" />
              <h3>{system.name}</h3>
              <p>{system.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="landing-section workflow-section" data-reveal-group>
        <div className="section-heading" data-reveal>
          <span className="section-kicker">Workflow</span>
          <h2>From first prompt to design-system handoff.</h2>
        </div>
        <div className="workflow-grid">
          {workflow.map((item) => (
            <article className="workflow-step" key={item.eyebrow} data-reveal>
              <span>{item.eyebrow}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="landing-section features-section" data-reveal-group>
        <div className="section-heading" data-reveal>
          <span className="section-kicker">Features</span>
          <h2>Built for design engineers who need to compare, refine, and hand off.</h2>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, body }) => (
            <article className="feature-card" key={title} data-reveal>
              <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="export" className="landing-section export-section" data-reveal-group>
        <div className="export-panel" data-reveal>
          <div>
            <span className="section-kicker">Ready</span>
            <h2>Start with a prompt. Leave with a system-aware interface.</h2>
            <p>
              Build, preview, share, and export from a single workspace tuned for real
              product UI.
            </p>
          </div>
          <ul className="export-list" aria-label="Supported handoff paths">
            <li><CheckCircle2 size={17} strokeWidth={2} aria-hidden="true" /> Share previews</li>
            <li><CheckCircle2 size={17} strokeWidth={2} aria-hidden="true" /> Export React</li>
            <li><CheckCircle2 size={17} strokeWidth={2} aria-hidden="true" /> Export HTML</li>
          </ul>
          <Link href="/login" className="landing-btn landing-btn--primary">
            <span>Start Building</span>
            <ArrowRight size={17} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <span>ausos</span>
        <span>AI-powered design system builder</span>
      </footer>
    </main>
  );
}
