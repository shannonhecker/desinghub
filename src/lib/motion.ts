/**
 * Motion spec for Design Hub (ausos.ai).
 *
 * Single source of truth for site-wide animation timing + easing.
 * Values match the token system's shared primitives in
 * src/data/_shared/primitives.ts where possible; exported here in
 * GSAP-friendly units (seconds, cubic-bezier strings).
 *
 * Rules this module enforces:
 *   - Durations cluster on 150ms (hover / micro) and 300ms (layout / reveal).
 *   - Default easing is Material standard cubic-bezier(0.2, 0, 0, 1).
 *     Mirrors M3_MOTION.easing.standard and the ausos house curve.
 *   - Every animation respects prefers-reduced-motion — consumers either
 *     pass the guarded timeline helpers below, or call isReducedMotion()
 *     themselves and skip animation entirely.
 *   - Transform + opacity only for performance-critical paths (hero, scroll
 *     reveals). Layout properties (width/height/padding) allowed in
 *     content-context animations but not hot paths.
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* Register ScrollTrigger plugin once at module load. `typeof window` guard
   keeps this tree-shaken from SSR render paths. */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ── Durations (seconds — GSAP native unit) ─────────────────────────────── */

/** 0.15s = 150ms — hover, focus, micro-state transitions. */
export const DUR_FAST = 0.15;

/** 0.30s = 300ms — layout changes, reveal, page transitions. Default. */
export const DUR_BASE = 0.3;

/** 0.60s = 600ms — emphasized reveals, hero orchestration, large movement. */
export const DUR_SLOW = 0.6;

/* ── Easing (cubic-bezier strings) ──────────────────────────────────────── */

/** Material standard. Fastest path with gentle arrival — default for most. */
export const EASE_STANDARD = "cubic-bezier(0.2, 0, 0, 1)";

/** Material emphasized-decelerate — heroes + entrance reveals. */
export const EASE_EMPHASIZED_DECEL = "cubic-bezier(0.05, 0.7, 0.1, 1)";

/** Material emphasized-accelerate — exits + dismissals. */
export const EASE_EMPHASIZED_ACCEL = "cubic-bezier(0.3, 0, 0.8, 0.15)";

/** Linear — progress bars, indeterminate motion. */
export const EASE_LINEAR = "none"; // GSAP's linear keyword

/* ── Reduced-motion guard ───────────────────────────────────────────────── */

/** True if the user has set prefers-reduced-motion: reduce. */
export function isReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/* ── Hero entrance orchestrator ─────────────────────────────────────────── */

/**
 * Animates hero-level elements (brand / headline / divider / body / CTA /
 * systems / footer) on a staggered timeline matching the original CSS
 * hero-enter cascade. Returns the GSAP timeline for callers that want to
 * kill() it on unmount.
 *
 * Under reduced motion, the timeline resolves immediately with all targets
 * at their final state — no animation.
 */
export function heroEnterTimeline(container: Element | null): gsap.core.Timeline | null {
  if (!container || typeof window === "undefined") return null;

  const targets = container.querySelectorAll<HTMLElement>("[data-hero-enter]");
  if (targets.length === 0) return null;

  if (isReducedMotion()) {
    // Snap to final state, no animation.
    gsap.set(targets, { opacity: 1, y: 0 });
    return null;
  }

  const tl = gsap.timeline();
  tl.set(targets, { opacity: 0, y: 16, willChange: "transform, opacity" });
  tl.to(targets, {
    opacity: 1,
    y: 0,
    duration: DUR_SLOW,
    ease: EASE_EMPHASIZED_DECEL,
    stagger: 0.08,
  });
  tl.set(targets, { willChange: "auto" });
  return tl;
}

/* ── Scroll-triggered reveal ────────────────────────────────────────────── */

export interface RevealOpts {
  /** When to trigger. Default "top 85%" — fire when element is 15% into viewport. */
  start?: string;
  /** End anchor. Default "top 60%". */
  end?: string;
  /** Initial Y offset in px. Default 24. */
  offset?: number;
  /** Duration override. Default DUR_BASE. */
  duration?: number;
  /** Easing override. Default EASE_EMPHASIZED_DECEL. */
  ease?: string;
  /** Stagger across multiple targets. Default 0.06s. */
  stagger?: number;
  /** Don't un-reveal on scroll-back. Default true (one-shot). */
  once?: boolean;
}

/**
 * Attach a scroll-triggered fade-up reveal to one or more elements.
 * Returns a cleanup function that kills the ScrollTrigger — call in
 * useEffect cleanup.
 */
export function revealOnScroll(
  targets: Element | Element[] | NodeListOf<Element> | null,
  opts: RevealOpts = {},
): () => void {
  if (!targets || typeof window === "undefined") return () => {};
  const els = targets instanceof Element ? [targets] : Array.from(targets);
  if (els.length === 0) return () => {};

  if (isReducedMotion()) {
    gsap.set(els, { opacity: 1, y: 0 });
    return () => {};
  }

  const {
    start = "top 85%",
    end = "top 60%",
    offset = 24,
    duration = DUR_BASE,
    ease = EASE_EMPHASIZED_DECEL,
    stagger = 0.06,
    once = true,
  } = opts;

  gsap.set(els, { opacity: 0, y: offset, willChange: "transform, opacity" });

  const trigger = ScrollTrigger.create({
    trigger: els[0],
    start,
    end,
    once,
    onEnter: () => {
      gsap.to(els, {
        opacity: 1,
        y: 0,
        duration,
        ease,
        stagger,
        onComplete: () => gsap.set(els, { willChange: "auto" }),
      });
    },
  });

  return () => trigger.kill();
}

/* ── Re-exports for consumers that want raw gsap access ─────────────────── */

export { gsap, ScrollTrigger };
