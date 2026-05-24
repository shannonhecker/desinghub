"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Download,
  Eye,
  Layers,
  MonitorSmartphone,
  Palette,
  Pause,
  PanelsTopLeft,
  Play,
  Rocket,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { heroEnterTimeline, revealOnScroll, useReducedMotion } from "@/lib/motion";
import { getBentoGraphic } from "./landing/BentoGraphics";
import "./hero.css";

const ACCESS_EMAIL = "shannonheckerchen@gmail.com";
const ACCESS_MAILTO = `mailto:${ACCESS_EMAIL}?subject=uoaui%20studio%20access`;

const navItems = [
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
    detail: "IBM UI Shell chrome with the four canonical theme keys (white, g10, g90, g100), flat-radius grammar, and the electric-blue interactive accent. Replicated to match carbondesignsystem.com.",
    signal: "Data first",
  },
  {
    key: "uoaui",
    name: "uoaui",
    detail: "Glass-native AI workspace patterns that keep prompts, variants, and exports visible.",
    signal: "AI native",
  },
];

const workflow = [
  {
    eyebrow: "01",
    title: "Prompt",
    body: "Describe the surface. Use the slash-command inserter (\"/\") to drop a known component, or pick a starting template.",
  },
  {
    eyebrow: "02",
    title: "Generate",
    body: "The canvas builds across header, sidebar, body, and footer zones using each system's real components — not generic placeholders.",
  },
  {
    eyebrow: "03",
    title: "Compare",
    body: "Switch the same canvas through Salt, Material 3, Fluent 2, Carbon, and uoaui. Tokens, density, and chrome update in place.",
  },
  {
    eyebrow: "04",
    title: "Ship",
    body: "Export three ways: stateless share link, JSON canvas snapshot, or a React TSX / HTML / Vite project. Sessions auto-save in the background.",
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

const proof = [
  { icon: Layers, value: "5 systems", label: "Salt, Material, Fluent, Carbon, and uoaui from one brief" },
  { icon: MonitorSmartphone, value: "Responsive", label: "desktop, tablet, and mobile previews" },
  { icon: Code2, value: "Exports", label: "React, HTML, and Vite handoff paths" },
  { icon: Eye, value: "Review links", label: "private previews ready for stakeholder critique" },
];

const bentoProof = [
  {
    key: "systems",
    title: "Compare system directions",
    body: "Move the same product brief through enterprise, Material, Fluent, Carbon, and uoaui treatments.",
    visual: ["Salt", "M3", "Fluent", "Carbon", "uoaui"],
  },
  {
    key: "frames",
    title: "Responsive from the start",
    body: "Review desktop, tablet, and mobile frames before a direction leaves the studio.",
    visual: ["Desktop", "Tablet", "Mobile"],
  },
  {
    key: "handoff",
    title: "Handoff-ready outputs",
    body: "Carry the selected interface into React, HTML, or Vite without losing system intent.",
    visual: ["React", "HTML", "Vite"],
  },
  {
    key: "review",
    title: "Private review rooms",
    body: "Share a polished preview link while the prompt, variants, and export context stay visible.",
    visual: ["Preview", "Notes", "Export"],
  },
];

const audienceCards = [
  {
    icon: Users,
    title: "Product teams",
    body: "Explore product surfaces before committing design and engineering time.",
    tags: ["Dashboards", "Forms", "Flows"],
  },
  {
    icon: Palette,
    title: "Design-system owners",
    body: "Stress-test how one interface behaves across density, tone, and component rules.",
    tags: ["Tokens", "States", "Patterns"],
  },
  {
    icon: Rocket,
    title: "Founders and agencies",
    body: "Turn a rough product brief into review-ready UI for pitches, demos, and handoff.",
    tags: ["Pitch", "Preview", "Export"],
  },
];

const DEMO_STEP_DURATION_MS = 6000;

const previewSystems = [
  { key: "salt", label: "Salt" },
  { key: "m3", label: "M3" },
  { key: "fluent", label: "Fluent" },
  { key: "carbon", label: "Carbon" },
  { key: "uoaui", label: "uoaui" },
] as const;

type PreviewSystemKey = (typeof previewSystems)[number]["key"];
type PreviewLayout = "trade" | "material" | "command" | "carbon" | "glass";

type PreviewDemoStep = {
  id: string;
  mode: "light" | "dark";
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

type AccessRequestSource = "hero" | "export";

type AccessRequestStatus = "idle" | "submitting" | "success" | "error";

function trackLandingEvent(event: string, params?: Record<string, string>) {
  if (typeof window === "undefined") return;
  const target = window as Window & {
    dataLayer?: Array<Record<string, unknown>>;
  };
  target.dataLayer?.push({ event, ...params });
}

const previewDemoSteps: PreviewDemoStep[] = [
  {
    id: "prompt",
    mode: "light",
    phase: "prompt",
    system: "salt",
    layout: "trade",
    status: "Prompt ready",
    prompt: "Build a Salt DS trading operations board with status, exposure, and approval queues.",
    toolbar: ["Desktop", "Light", "Dense"],
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
    mode: "light",
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
    mode: "light",
    phase: "compare",
    system: "fluent",
    layout: "command",
    status: "Comparing systems",
    prompt: "Show the same dashboard in Fluent with softer navigation and compact states.",
    toolbar: ["Desktop", "Light", "Comfortable"],
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
    mode: "light",
    phase: "tune",
    system: "carbon",
    layout: "carbon",
    status: "Tuning theme",
    prompt: "Tune the approved view as a Carbon data workspace for dense enterprise reporting.",
    toolbar: ["Desktop", "Light", "Dense"],
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
    mode: "light",
    phase: "share",
    system: "uoaui",
    layout: "glass",
    status: "Ready to share",
    prompt: "Package the uoaui AI workspace with glass panels, preview link, and clean handoff.",
    toolbar: ["Desktop", "Light", "Balanced"],
    surfaceLabel: "uoaui workspace",
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
    exportLabel: "uoaui handoff",
  },
];

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
  return <div className="content-atmosphere" aria-hidden="true" />;
}

function useHaloPointer(
  disabled: boolean,
  rootRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const root = rootRef.current;
    if (typeof window === "undefined" || !root || disabled) return;
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(max-width: 768px)").matches) return;

    let frameId = 0;
    let pendingX = 50;
    let pendingY = 35;

    const apply = () => {
      frameId = 0;
      root.style.setProperty("--hero-mouse-x", `${pendingX.toFixed(1)}%`);
      root.style.setProperty("--hero-mouse-y", `${pendingY.toFixed(1)}%`);
      /* Also expose 0-1 fractions for transform calc() math —
         used by the orbital 3D tilt. */
      root.style.setProperty("--hero-mouse-px", (pendingX / 100).toFixed(3));
      root.style.setProperty("--hero-mouse-py", (pendingY / 100).toFixed(3));
    };

    const onMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      pendingX = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
      pendingY = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
      if (frameId) return;
      frameId = window.requestAnimationFrame(apply);
    };

    apply();
    root.addEventListener("pointermove", onMove);
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      root.removeEventListener("pointermove", onMove);
    };
  }, [disabled, rootRef]);
}

function OrbitRing({
  variant,
  paused,
}: {
  variant: "systems";
  paused?: boolean;
}) {
  const base =
    `orbit-ring orbit-ring--${variant}` +
    (paused ? " orbit-ring--paused" : "");

  return (
    <>
      <svg
        className={`${base} orbit-ring--ring-only`}
        viewBox="0 0 800 480"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <ellipse cx="400" cy="240" rx="380" ry="220" className="orbit-ring__path" />
      </svg>
      <svg
        className={`${base} orbit-ring--spark-only`}
        viewBox="0 0 800 480"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <ellipse cx="400" cy="240" rx="380" ry="220" className="orbit-ring__spark" />
      </svg>
    </>
  );
}

function StudioConstellation() {
  return (
    <>
      <svg
        className="studio-constellation studio-constellation--lines-only"
        viewBox="0 0 1200 480"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line className="studio-edge" x1="200" y1="140" x2="600" y2="140" />
        <line className="studio-edge" x1="600" y1="140" x2="1000" y2="140" />
        <line className="studio-edge" x1="200" y1="340" x2="600" y2="340" />
        <line className="studio-edge" x1="600" y1="340" x2="1000" y2="340" />
        <line className="studio-edge" x1="200" y1="140" x2="200" y2="340" />
        <line className="studio-edge" x1="600" y1="140" x2="600" y2="340" />
        <line className="studio-edge" x1="1000" y1="140" x2="1000" y2="340" />
        <line className="studio-edge studio-edge--accent" x1="200" y1="140" x2="600" y2="340" />
        <line className="studio-edge studio-edge--accent" x1="1000" y1="140" x2="600" y2="340" />

        {[
          [200, 140],
          [600, 140],
          [1000, 140],
          [200, 340],
          [600, 340],
          [1000, 340],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} className="studio-node" cx={cx} cy={cy} r="3" />
        ))}
      </svg>

      <svg
        className="studio-constellation studio-constellation--sparks-only"
        viewBox="0 0 1200 480"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line className="studio-spark studio-spark--1" x1="200" y1="140" x2="600" y2="140" />
        <line className="studio-spark studio-spark--2" x1="600" y1="140" x2="600" y2="340" />
        <line className="studio-spark studio-spark--3" x1="200" y1="340" x2="1000" y2="340" />
      </svg>
    </>
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

function RequestAccessModal({
  open,
  source,
  onClose,
}: {
  open: boolean;
  source: AccessRequestSource;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<AccessRequestStatus>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setStatus("idle");
      setMessage("");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    trackLandingEvent("access_request_submit", { source });

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      company: String(formData.get("company") || ""),
      useCase: String(formData.get("useCase") || ""),
      note: String(formData.get("note") || ""),
      source,
    };

    try {
      const response = await fetch("/api/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => ({}))) as {
        stored?: boolean;
        emailed?: boolean;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Unable to send request.");
      }

      form.reset();
      setStatus("success");
      setMessage(
        result.emailed
          ? "Request sent. Shannon will follow up with access details."
          : result.stored
          ? "Request sent. Shannon will follow up with access details."
          : "Request entered. Email Shannon if you want to ensure delivery.",
      );
      trackLandingEvent("access_request_success", {
        source,
        stored: result.stored ? "true" : "false",
        emailed: result.emailed ? "true" : "false",
      });
    } catch {
      setStatus("error");
      setMessage(`Something went wrong. Email ${ACCESS_EMAIL} for access.`);
      trackLandingEvent("access_request_error", { source });
    }
  };

  return (
    <div className="access-modal" role="dialog" aria-modal="true" aria-labelledby="access-title">
      <button className="access-modal__scrim" type="button" aria-label="Close access form" onClick={onClose} />
      <section className="access-modal__panel">
        <button className="access-modal__close" type="button" aria-label="Close access form" onClick={onClose}>
          <X size={15} strokeWidth={2} aria-hidden="true" />
        </button>
        <span className="section-kicker">Private preview</span>
        <h2 id="access-title">Request studio access.</h2>
        <p>
          Tell me where uoaui fits in your workflow. I will use this to prioritize
          access and shape the builder around real product work.
        </p>

        <form className="access-form" onSubmit={handleSubmit}>
          <label>
            <span>Name</span>
            <input name="name" autoComplete="name" required />
          </label>
          <label>
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            <span>Company or team</span>
            <input name="company" autoComplete="organization" />
          </label>
          <label>
            <span>Main use case</span>
            <select name="useCase" defaultValue="product-team" required>
              <option value="product-team">Product team prototyping</option>
              <option value="design-system">Design-system exploration</option>
              <option value="agency">Agency or client demos</option>
              <option value="founder">Founder product mockups</option>
            </select>
          </label>
          <label className="access-form__wide">
            <span>What would you like to build?</span>
            <textarea name="note" rows={3} />
          </label>

          {message && (
            <p className={`access-form__message access-form__message--${status}`} role="status">
              {message}
            </p>
          )}

          <button className="landing-btn landing-btn--light access-form__submit" type="submit" disabled={status === "submitting"}>
            <span>{status === "submitting" ? "Sending..." : "Send Request"}</span>
            <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        </form>

        <p className="access-modal__fallback">
          Prefer email? <a href={ACCESS_MAILTO}>Email Shannon</a>.
        </p>
      </section>
    </div>
  );
}

function HeroPreviewDemo() {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const reducedMotion = useReducedMotion();
  const step = previewDemoSteps[stepIndex];
  const previewMode = step.mode;
  const demoPaused = isPaused || reducedMotion || isHovering;

  useEffect(() => {
    if (reducedMotion) {
      setStepIndex(0);
      return;
    }

    if (isPaused || isHovering) return;

    const intervalId = window.setInterval(() => {
      setStepIndex((current) => (current + 1) % previewDemoSteps.length);
    }, DEMO_STEP_DURATION_MS);

    return () => window.clearInterval(intervalId);
  }, [isPaused, isHovering, reducedMotion]);

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
      data-preview-mode={previewMode}
      data-preview-paused={demoPaused ? "true" : "false"}
      aria-label="Design Hub preview demo"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onFocusCapture={() => setIsHovering(true)}
      onBlurCapture={() => setIsHovering(false)}
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
      <div className="preview-stepper" aria-label="Demo flow">
        {previewDemoSteps.map((demoStep, index) => (
          <button
            type="button"
            className={`preview-step${index === stepIndex ? " preview-step--active" : ""}`}
            key={demoStep.id}
            aria-pressed={index === stepIndex}
            onClick={() => {
              setStepIndex(index);
              setIsPaused(true);
              trackLandingEvent("demo_step_select", { step: demoStep.phase });
            }}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {demoStep.phase}
          </button>
        ))}
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

/* Split text into per-character spans for the cascade reveal.
   aria-hidden on the spans, aria-label on the parent preserves
   screen-reader output as one continuous string (WCAG 1.3.1, 4.1.2). */
function splitChars(text: string, opts: { lineDelay: number; charStep?: number }) {
  const { lineDelay, charStep = 28 } = opts;
  return text.split("").map((char, i) => (
    <span
      key={`${lineDelay}-${i}`}
      className="hero-char"
      style={{ ["--char-delay" as string]: `${lineDelay + i * charStep}ms` }}
    >
      {char === " " ? " " : char}
    </span>
  ));
}

/* ───────────── Hero orbital comp (Marketeam-inspired) ──────────────
   5 DS chips orbit on 2 elliptical rings around a center surface
   that morphs through each system's visual language. Tension-accent
   headline lives in a left column; this comp lives in the right.
   Pauses on reduced motion + on hover/focus. */

type OrbitalSystemKey = "salt" | "m3" | "fluent" | "carbon" | "uoaui";

const ORBITAL_SYSTEMS: Array<{
  key: OrbitalSystemKey;
  label: string;
  short: string;
  angle: number;
  ring: "outer" | "inner";
}> = [
  { key: "salt", label: "Salt DS", short: "Salt", angle: -76, ring: "outer" },
  { key: "m3", label: "Material 3", short: "M3", angle: 38, ring: "outer" },
  { key: "fluent", label: "Fluent 2", short: "Fluent", angle: 96, ring: "inner" },
  { key: "carbon", label: "Carbon", short: "Carbon", angle: 162, ring: "outer" },
  { key: "uoaui", label: "uoaui", short: "uoaui", angle: -142, ring: "inner" },
];

function HeroOrbital({ paused }: { paused: boolean }) {
  const [systemIndex, setSystemIndex] = useState(0);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setSystemIndex((i) => (i + 1) % ORBITAL_SYSTEMS.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [paused]);

  const active = ORBITAL_SYSTEMS[systemIndex];

  return (
    <div
      className={`hero-orbital${paused ? " hero-orbital--paused" : ""}`}
      data-system={active.key}
      aria-hidden="true"
    >
      <svg
        className="hero-orbital__rings"
        viewBox="0 0 600 600"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <ellipse className="hero-orbital__ring hero-orbital__ring--outer" cx="300" cy="300" rx="278" ry="248" />
        <ellipse className="hero-orbital__ring hero-orbital__ring--inner" cx="300" cy="300" rx="206" ry="176" />
        <ellipse className="hero-orbital__ring hero-orbital__ring--core" cx="300" cy="300" rx="136" ry="116" />
      </svg>

      <div className="hero-orbital__glow" aria-hidden="true" />

      <div className="hero-orbital__chips">
        {ORBITAL_SYSTEMS.map((system) => (
          <span
            key={system.key}
            className={`hero-orbital__chip hero-orbital__chip--${system.ring}${
              system.key === active.key ? " is-active" : ""
            }`}
            style={{ ["--chip-angle" as string]: `${system.angle}deg` }}
            data-system={system.key}
          >
            <span className="hero-orbital__chip-dot" aria-hidden="true" />
            <span className="hero-orbital__chip-label">{system.short}</span>
          </span>
        ))}
      </div>

      <div className="hero-orbital__center" data-system={active.key}>
        <div className="hero-orbital__surface">
          <div className="hero-orbital__chrome">
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <strong key={active.key}>{active.label}</strong>
          </div>
          <div className="hero-orbital__body">
            <div className="hero-orbital__prompt">
              <Sparkles size={11} strokeWidth={1.8} aria-hidden="true" />
              <span>Build a review-ready dashboard</span>
            </div>
            <div className="hero-orbital__card" key={active.key}>
              <span className="hero-orbital__eyebrow">Generated surface</span>
              <strong>Revenue Operations</strong>
              <div className="hero-orbital__stats">
                <span><b>5</b>Variants</span>
                <span><b>3</b>Frames</span>
                <span><b>96%</b>Ready</span>
              </div>
              <div className="hero-orbital__bars" aria-hidden="true">
                {[54, 76, 62, 88, 70, 94].map((h, i) => (
                  <span key={i} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <span className="hero-orbital__tag">5 systems · 1 builder</span>
      </div>
    </div>
  );
}

export function HeroHeader() {
  const reducedMotion = useReducedMotion();
  const landingRef = useContentParallax(reducedMotion);
  const [accessModalSource, setAccessModalSource] = useState<AccessRequestSource | null>(null);
  /* Sticky nav scroll-state — adds `landing-nav--scrolled` once the user
     has moved past the hero's first viewport, which triggers the
     condensed visual treatment (denser bg, smaller chip, tighter chrome). */
  const [navScrolled, setNavScrolled] = useState(false);
  const proofRef = useRef<HTMLElement | null>(null);
  const systemGridRef = useRef<HTMLUListElement | null>(null);
  const workflowGridRef = useRef<HTMLOListElement | null>(null);
  const featureGridRef = useRef<HTMLDListElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);

  useHaloPointer(reducedMotion, landingRef);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 200);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openAccessModal = (source: AccessRequestSource) => {
    setAccessModalSource(source);
    trackLandingEvent("access_request_open", { source });
  };

  useEffect(() => {
    const root = landingRef.current;
    if (!root) return;
    const tl = heroEnterTimeline(root);
    return () => {
      tl?.kill();
    };
  }, [landingRef]);

  /* Custom cursor — peach dot follows the pointer; expands to a
     ring when hovering interactive elements. Hides the native
     cursor via body class. Skips on touch devices + reduced motion.
     mix-blend-mode: difference inverts against any bg color. */
  useEffect(() => {
    if (reducedMotion) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;
    const el = cursorRef.current;
    if (!el) return;

    let frameId = 0;
    let px = 0;
    let py = 0;

    const apply = () => {
      frameId = 0;
      el.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%)`;
    };

    const onMove = (e: MouseEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (frameId) return;
      frameId = window.requestAnimationFrame(apply);
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const hoverable = target.closest(
        'button, a, [role="button"], .hero-orbital__chip, label, input, textarea, select, .preview-step, .preview-demo-control',
      );
      el.dataset.state = hoverable ? "hover" : "default";
    };

    document.body.classList.add("custom-cursor-active");
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    return () => {
      document.body.classList.remove("custom-cursor-active");
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
    };
  }, [reducedMotion]);

  /* Scroll parallax — page bg drifts at 20% scroll rate (slow → reads
     as depth), workflow numerals drift at 60% (fast → passes content).
     rAF-throttled. Skips when prefers-reduced-motion. */
  useEffect(() => {
    if (reducedMotion) return;
    const root = landingRef.current;
    if (!root || typeof window === "undefined") return;

    let frame = 0;
    const numerals = Array.from(
      document.querySelectorAll<HTMLElement>(".landing-page .workflow-numeral"),
    );

    const apply = () => {
      frame = 0;
      const y = window.scrollY;
      root.style.setProperty("--bg-parallax-y", `${(y * 0.2).toFixed(1)}px`);
      const numeralShift = `${(y * 0.06).toFixed(1)}px`;
      for (const n of numerals) n.style.setProperty("--numeral-shift", numeralShift);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [reducedMotion, landingRef]);

  useEffect(() => {
    /* Section heading reveals — kicker → h2 → body stagger as each
       section enters the viewport. */
    const headings = document.querySelectorAll(".landing-page .section-heading");
    const headingCleanups = Array.from(headings).map((h) =>
      revealOnScroll(h.querySelectorAll(".section-kicker, h2, p"), { stagger: 0.08, offset: 32 }),
    );

    /* Pull quote — the audience pullquote gets its own reveal so the
       italic-serif moment lands distinctly. */
    const pullquoteCleanup = revealOnScroll(
      document.querySelectorAll(".landing-page .section-pullquote"),
      { offset: 40, duration: 0.6 },
    );

    /* Proof + bento + audience + systems + workflow + features +
       export — content children stagger in per section. Selectors
       match the current JSX (post-orbital refactor). */
    const cleanups = [
      proofRef.current && revealOnScroll(proofRef.current.querySelectorAll(".proof-flow-item"), { stagger: 0.06 }),
      revealOnScroll(document.querySelectorAll(".landing-page .proof-row"), { stagger: 0.12, offset: 32 }),
      revealOnScroll(document.querySelectorAll(".landing-page .audience-row"), { stagger: 0.1, offset: 28 }),
      revealOnScroll(document.querySelectorAll(".landing-page .demo-frame"), { offset: 40, duration: 0.6 }),
      systemGridRef.current && revealOnScroll(systemGridRef.current.querySelectorAll(".system-row"), { stagger: 0.08, offset: 20 }),
      workflowGridRef.current && revealOnScroll(workflowGridRef.current.querySelectorAll(".workflow-step-flow"), { stagger: 0.12, offset: 32 }),
      featureGridRef.current && revealOnScroll(featureGridRef.current.querySelectorAll(".feature-list-row"), { stagger: 0.06, offset: 16 }),
      revealOnScroll(document.querySelectorAll(".landing-page .export-cta > *"), { stagger: 0.08, offset: 24 }),
      pullquoteCleanup,
      ...headingCleanups,
    ];

    return () => {
      for (const c of cleanups) if (typeof c === "function") c();
    };
  }, []);

  return (
    <main id="main-content" className="hero landing-page" ref={landingRef}>
      <nav
        className={`landing-nav landing-nav--sticky${navScrolled ? " landing-nav--scrolled" : ""}`}
        aria-label="Primary"
        data-hero-enter
      >
        <Link href="/" className="landing-brand" aria-label="uoaui home">
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

        <Link href="/login" className="landing-nav-cta" onClick={() => trackLandingEvent("enter_studio_click", { source: "nav" })}>
          <span>Enter Studio</span>
          <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
        </Link>
      </nav>
      <section className="hero-stage hero-stage--orbital" aria-labelledby="landing-title">
        <div className="hero-bezel" aria-hidden="true">
          <div className="hero-bezel__wash" />
          <div className="hero-bezel__grain" />
        </div>
        <div className="hero-stage-shell hero-stage-shell--orbital">
          <div className="hero-orbital-grid">
            <div className="hero-copy hero-copy--orbital">
              <div className="hero-kicker" data-hero-enter>
                <Sparkles size={13} strokeWidth={1.8} aria-hidden="true" />
                AI builder for five enterprise design systems
              </div>
              <h1
                id="landing-title"
                className="hero-headline hero-headline--tension"
                aria-label="Design-system fluency you thought was out of reach."
              >
                <span className="hero-headline__line" aria-hidden="true">
                  {splitChars("Design-system fluency", { lineDelay: 0 })}
                </span>
                <br aria-hidden="true" />
                <span className="hero-headline__line" aria-hidden="true">
                  {splitChars("you thought was", { lineDelay: 380 })}
                </span>
                <br aria-hidden="true" />
                <em className="hero-headline__accent" aria-hidden="true">out of reach.</em>
              </h1>
              <p className="hero-headline__resolution" data-hero-enter>
                Now one prompt away.
              </p>
              <div className="hero-actions" data-hero-enter>
                <button type="button" className="landing-btn landing-btn--light" onClick={() => openAccessModal("hero")}>
                  <span>Request Access</span>
                  <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
                </button>
                <a href="#demo" className="landing-btn landing-btn--outline" onClick={() => trackLandingEvent("view_demo_click", { source: "hero" })}>
                  <span>View Demo</span>
                </a>
              </div>
              <p className="hero-microcopy" data-hero-enter>
                262 documented components. Three handoff paths. Private preview.
              </p>
            </div>

            <div className="hero-orbital-stage" data-hero-enter>
              <HeroOrbital paused={reducedMotion} />
            </div>
          </div>
        </div>
      </section>

      <section className="proof-strip-flow" aria-label="Product proof points" ref={proofRef}>
        {proof.map(({ icon: Icon, value, label }) => (
          <div className="proof-flow-item" key={value}>
            <Icon size={20} strokeWidth={1.8} aria-hidden="true" className="proof-flow-icon" />
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>

      <section className="landing-section bento-section section-band" aria-labelledby="bento-title">
        <ContentAtmosphere />
        <div className="section-heading content-parallax-heading">
          <span className="section-kicker">Product proof</span>
          <h2 id="bento-title">Every output stays tied to real interface <em className="section-accent">work.</em></h2>
          <p>
            uoaui is built around the pieces teams review: system language, responsive
            framing, export path, and the context behind each decision.
          </p>
        </div>
        <div className="proof-rows">
          {bentoProof.map((item, index) => (
            <article
              className={`proof-row proof-row--${item.key}`}
              data-flip={index % 2 === 1 ? "true" : "false"}
              key={item.key}
            >
              <div className="proof-row-visual">
                <div className="proof-row-graphic" aria-hidden="false">
                  {getBentoGraphic(item.key)}
                </div>
                <div className="proof-row-chips" aria-hidden="true">
                  {item.visual.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
              </div>
              <div className="proof-row-copy">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section audience-section section-band" aria-labelledby="audience-title">
        <ContentAtmosphere />
        <div className="section-heading content-parallax-heading">
          <span className="section-kicker">Built for</span>
          <h2 id="audience-title">For the <em className="section-accent">messy middle</em> between product brief and polished UI.</h2>
          <p>
            uoaui is being built by Shannon for early product exploration: the moment
            when a brief needs to become a credible interface direction fast.
          </p>
        </div>
        <blockquote className="section-pullquote audience-pullquote">
          <span className="section-pullquote-label">Founder note</span>
          <p>
            The goal is not another generic AI mockup surface. It is a practical studio
            for comparing design-system directions with enough structure to critique,
            share, and hand off.
          </p>
        </blockquote>
        <div className="audience-rows">
          {audienceCards.map(({ icon: Icon, title, body, tags }) => (
            <article className="audience-row" key={title}>
              <span className="audience-row-icon" aria-hidden="true">
                <Icon size={22} strokeWidth={1.7} />
              </span>
              <h3>{title}</h3>
              <p>{body}</p>
              <div className="audience-row-tags" aria-label={`${title} examples`}>
                {tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="demo" className="landing-section demo-section" aria-labelledby="demo-title">
        <ContentAtmosphere />
        <div className="section-heading demo-heading content-parallax-heading">
          <span className="section-kicker">Live demo</span>
          <h2 id="demo-title">See the builder move from prompt to <em className="section-accent">handoff.</em></h2>
          <p>Follow the complete loop: Prompt -&gt; Generate -&gt; Compare -&gt; Tune -&gt; Export.</p>
        </div>
        <div className="demo-frame content-card-grid">
          <HeroPreviewDemo />
        </div>
      </section>

      <section id="systems" className="landing-section systems-section section-band">
        <ContentAtmosphere />
        <div className="section-heading content-parallax-heading">
          <span className="section-kicker">Systems</span>
          <h2>One interface idea, <em className="section-accent">five distinct</em> product languages.</h2>
          <p>
            uoaui keeps each system's rhythm intact, from dense trading screens to softer
            review surfaces and glass-native AI workspaces.
          </p>
        </div>
        <div className="system-bar-wrap">
          <OrbitRing variant="systems" />
          <ul className="system-bar" ref={systemGridRef}>
            {systems.map((system) => (
              <li className="system-row" data-system={system.key} key={system.name}>
                <span className="system-row-dot" aria-hidden="true" />
                <h3 className="system-row-name">{system.name}</h3>
                <span className="system-row-signal">{system.signal}</span>
                <p className="system-row-detail">{system.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="workflow" className="landing-section workflow-section section-band">
        <ContentAtmosphere />
        <div className="section-heading content-parallax-heading">
          <span className="section-kicker">Workflow</span>
          <h2>A focused path from prompt to <em className="section-accent">handoff.</em></h2>
        </div>
        <ol className="workflow-flow" ref={workflowGridRef}>
          {workflow.map((item) => (
            <li className="workflow-step-flow" key={item.eyebrow}>
              <span className="workflow-numeral" aria-hidden="true">{item.eyebrow}</span>
              <h3 className="workflow-title">{item.title}</h3>
              <p className="workflow-body">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="features" className="landing-section features-section section-band">
        <ContentAtmosphere />
        <div className="section-heading content-parallax-heading">
          <span className="section-kicker">Studio</span>
          <h2>Polished enough for <em className="section-accent">critique,</em> practical enough for production.</h2>
          <p>
            The product work stays visible: prompt context, system comparison, responsive
            review, and export all sit inside the same workspace.
          </p>
        </div>
        <div className="feature-list-wrap">
          <StudioConstellation />
          <dl className="feature-list" ref={featureGridRef}>
            {features.map(({ icon: Icon, title, body }) => (
              <div className="feature-list-row" key={title}>
                <dt className="feature-list-term">
                  <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                  <span>{title}</span>
                </dt>
                <dd className="feature-list-detail">{body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="export" className="landing-section export-section section-band section-band--cta">
        <ContentAtmosphere />
        <div className="export-cta">
          <span className="section-kicker">Private studio</span>
          <h2>Start with a prompt. Leave with a <em className="section-accent">system-aware</em> interface.</h2>
          <p>
            Build the first direction, compare it across product languages, and carry the
            selected surface into review, sharing, and export.
          </p>
          <ul className="export-cta-list" aria-label="Supported handoff paths">
            <li><CheckCircle2 size={17} strokeWidth={2} aria-hidden="true" /> Share previews</li>
            <li><CheckCircle2 size={17} strokeWidth={2} aria-hidden="true" /> Export React</li>
            <li><CheckCircle2 size={17} strokeWidth={2} aria-hidden="true" /> Export HTML</li>
          </ul>
          <button type="button" className="landing-btn landing-btn--light export-cta-btn" onClick={() => openAccessModal("export")}>
            <span>Request Access</span>
            <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <span>uoaui</span>
        <span>AI-powered design-system builder</span>
      </footer>
      <RequestAccessModal
        open={accessModalSource !== null}
        source={accessModalSource ?? "hero"}
        onClose={() => setAccessModalSource(null)}
      />
      <div ref={cursorRef} className="custom-cursor" aria-hidden="true" />
    </main>
  );
}
