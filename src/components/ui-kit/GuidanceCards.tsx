"use client";

/**
 * GuidanceCards (W8-P4) — the do / don't usage guidance block, in the spirit of
 * the m3.material.io and spec.fluentui.com "Do / Don't" panels.
 *
 * Reads COMPONENT_GUIDANCE[id] from src/data/ui-kit-meta.ts and renders two
 * columns: a positive "Do" card and a cautionary "Don't" card.
 *
 * ACCESSIBILITY (locked owner decision): guidance is NEVER color-only. Each
 * column carries an explicit "Do:" / "Don't:" text label AND a glyph icon
 * (check / block) in addition to the success/error token color, so the meaning
 * survives for color-blind / monochrome / high-contrast users (WCAG 1.4.1 Use
 * of Color). The success/error accent is sourced from the active DS's own status
 * token where the theme exposes one, falling back to the theme accent / a neutral
 * danger red.
 *
 * Pure presentation — reads the theme only. Works light + dark.
 */

import React from "react";
import type { ActiveTheme } from "@/contexts/ThemeContext";
import type { ComponentGuidance } from "@/data/ui-kit-meta";
import { relativeLuminance } from "@/lib/contrastUtils";

interface GuidanceCardsProps {
  guidance: ComponentGuidance;
  t: ActiveTheme;
}

/* AA-strength success / error fallback text tokens, chosen for the active
   theme's surface. The guidance card surface (t.bg2) swaps light/dark with the
   active DS, so a single hex can't clear WCAG AA in both modes; we pick the
   on-dark vs on-light --dh-* status token from the surface luminance.
   (relativeLuminance only parses hex; theme bg values are hex, anything else
   defaults to dark.) Verified ≥6.25:1 (light) / ≥7.66:1 (dark) on real card
   surfaces — replaces the prior raw #2e7d32 / #c62828 fallbacks. */
function statusFallbacks(bg: string): { ok: string; bad: string } {
  let isLight = false;
  if (typeof bg === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(bg)) {
    isLight = relativeLuminance(bg) > 0.4;
  }
  return isLight
    ? { ok: "var(--dh-success-fg-on-light)", bad: "var(--dh-error-fg-on-light)" }
    : { ok: "var(--dh-success-fg-on-dark)", bad: "var(--dh-error-fg-on-dark)" };
}

/* Resolve a positive / negative status color from the active DS theme. Each DS
   exposes status tokens under different field names on the theme object; we pick
   the first that exists and fall back to the mode-aware --dh-* status tokens so
   the block never renders an undefined color and never drops below AA. */
function statusColors(t: ActiveTheme): { ok: string; okFg: string; bad: string; badFg: string } {
  const T = t.T as Record<string, unknown>;
  const pick = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = T[k];
      if (typeof v === "string" && v) return v;
    }
    return undefined;
  };
  const fallback = statusFallbacks(t.bg2);
  const ok =
    pick(
      "successFg", "successBorder", "positiveFg", "positiveBorder",
      "success", "positive", "support-success", "supportSuccess",
    ) ?? fallback.ok;
  const bad =
    pick(
      "dangerFg", "dangerBorder", "errorFg", "negativeFg", "negativeBorder",
      "error", "danger", "negative", "support-error", "supportError",
    ) ?? fallback.bad;
  return { ok, okFg: t.fg, bad, badFg: t.fg };
}

function GuidanceColumn({
  kind,
  items,
  accent,
  t,
}: {
  kind: "do" | "dont";
  items: string[];
  accent: string;
  t: ActiveTheme;
}) {
  const isDo = kind === "do";
  const label = isDo ? "Do" : "Don't";
  /* Material-Symbols glyphs (the app already loads this font app-wide). The
      icon is decorative reinforcement; the visible "Do:" / "Don't:" text below
      carries the meaning for assistive tech. */
  const glyph = isDo ? "check_circle" : "cancel";

  return (
    <section
      className="dh-guidance-card"
      style={{
        background: t.bg2,
        borderColor: t.border,
        /* A 3px status rail on the leading edge — reinforced by icon + text,
           never the only signal. */
        boxShadow: `inset 3px 0 0 0 ${accent}`,
      }}
      aria-label={`${label} guidance`}
    >
      <header className="dh-guidance-head">
        <span
          className="material-symbols-outlined dh-guidance-icon"
          aria-hidden="true"
          style={{ color: accent }}
        >
          {glyph}
        </span>
        <span className="dh-guidance-label" style={{ color: accent }}>
          {label}:
        </span>
      </header>
      <ul className="dh-guidance-list">
        {items.map((item, i) => (
          <li key={i} className="dh-guidance-item" style={{ color: t.fg2 }}>
            <span
              className="material-symbols-outlined dh-guidance-bullet"
              aria-hidden="true"
              style={{ color: accent }}
            >
              {isDo ? "check" : "block"}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GuidanceCards({ guidance, t }: GuidanceCardsProps) {
  if (!guidance) return null;
  const { ok, bad } = statusColors(t);

  return (
    <div className="dh-guidance-grid">
      <GuidanceColumn kind="do" items={guidance.dos} accent={ok} t={t} />
      <GuidanceColumn kind="dont" items={guidance.donts} accent={bad} t={t} />
    </div>
  );
}
