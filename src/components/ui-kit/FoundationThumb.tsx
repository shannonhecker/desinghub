"use client";

import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useDesignHub, type SystemId } from "@/store/useDesignHub";
import { M3_DENSITY, M3_SHAPE } from "@/data/m3/tokens";
import { SIcon, FIcon, CIcon } from "@/data/registry";
import { conceptOf } from "./kitEquivalence";

/**
 * Graphic-first thumbnail for a Foundations tile, drawn from the active
 * system's own tokens. A foundation page is prose, so cropping it into a tile
 * sliced sentences mid-word; a picture of the thing says more at a glance.
 *
 * Two rules. Every concept has its own graphic, so two tiles on one wall never
 * show the same picture. And every number printed here is that system's own:
 * the scales below are the ones each system's foundation page lists (the page
 * is the source; where a system states no value, no numeral is drawn).
 */

/* Control heights per density or size step, as each Density page states them. */
const DENSITY_STEPS: Record<SystemId, { label: string; h: number }[]> = {
  salt: [20, 28, 36, 44].map((h) => ({ label: String(h), h })),
  uoaui: [20, 28, 36, 44].map((h) => ({ label: String(h), h })),
  fluent: [24, 32, 40].map((h) => ({ label: String(h), h })),
  carbon: [24, 32, 40, 48, 64, 80].map((h) => ({ label: String(h), h })),
  /* Material states density as an offset; the height is its button's. */
  m3: Object.values(M3_DENSITY).map((d) => ({ label: String(d.offset), h: parseInt(d.btnH, 10) })),
};

/* Spacing steps as each Spacing page lists them. Salt names its steps
   (the pixel value changes with density), the others are pixels. */
const SPACING_STEPS: Partial<Record<SystemId, { label: string; w: number }[]>> = {
  salt: [[25, 1], [50, 2], [100, 4], [150, 6], [200, 8], [300, 12]].map(([t, px]) => ({ label: String(t), w: px * 8 })),
  uoaui: [2, 4, 8, 12, 16, 24].map((px) => ({ label: String(px), w: px * 4 })),
  fluent: [4, 8, 12, 16, 20, 24].map((px) => ({ label: String(px), w: px * 4 })),
  carbon: [2, 4, 8, 12, 16, 24].map((px) => ({ label: String(px), w: px * 4 })),
};

/* Duration tokens in milliseconds, as each Motion page lists them. */
const MOTION_STEPS: Partial<Record<SystemId, number[]>> = {
  carbon: [70, 110, 150, 240, 400, 700],
  fluent: [50, 100, 150, 200, 300, 400],
};

/* Corner steps, as each Shape page lists them. "full" is a circle or pill. */
const SHAPE_STEPS: Partial<Record<SystemId, (number | "full")[]>> = {
  m3: Object.values(M3_SHAPE).map((v) => (v === "9999px" ? "full" : parseInt(v, 10) || 0)),
  fluent: [0, 2, 4, 6, 8, 12, "full"],
  carbon: [0, 16, "full"],
};

/* Icon names each system's own icon component draws (see its Iconography
   page). */
type IconComponent = React.ComponentType<{ name: string; size?: number; color?: string }>;
const OWN_ICONS: Partial<Record<SystemId, { Icon: IconComponent; names: string[] }>> = {
  salt: { Icon: SIcon as IconComponent, names: ["search", "settings", "home", "person", "notification", "bookmark", "edit", "filter"] },
  fluent: { Icon: FIcon as IconComponent, names: ["search", "person", "info", "success", "warn", "check", "sun", "moon"] },
  carbon: { Icon: CIcon as IconComponent, names: ["search", "settings", "home", "person", "notifications", "bookmark", "edit", "calendar_today"] },
};

const hexes = (T: Record<string, unknown>) =>
  Object.values(T).filter((v): v is string => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v)).filter((c, i, a) => a.indexOf(c) === i);

export function FoundationThumb({ id }: { id: string }) {
  const t = useTheme();
  const sys = useDesignHub((s) => s.activeSystem);
  const key = conceptOf(sys, id) ?? "";
  const T = t.T as Record<string, unknown>;
  const tok = (k: string, fallback: string) => (typeof T[k] === "string" ? (T[k] as string) : fallback);
  const corner = sys === "carbon" ? 0 : sys === "m3" ? 16 : sys === "uoaui" ? 14 : 8;

  switch (key) {
    /* Colour: the working roles as a ramp of tall swatches. */
    case "f-color": {
      const ramp = [t.accent, t.accentWeak, t.successStrong ?? t.successFg, t.warningStrong ?? t.warningFg, t.dangerStrong ?? t.dangerFg, t.infoStrong ?? t.infoFg, t.fg, t.fg2, t.fg3, t.bg3, t.bg2]
        .filter((c): c is string => typeof c === "string" && c.length > 0)
        .filter((c, i, a) => a.indexOf(c) === i);
      return (
        <div className="kit-ft kit-ft-color" aria-hidden="true">
          {ramp.slice(0, 10).map((c) => <span key={c} style={{ background: c }} />)}
        </div>
      );
    }
    /* Full palette: every colour token in the theme, as a mosaic. */
    case "f-palette":
      return (
        <div className="kit-ft kit-ft-mosaic" aria-hidden="true">
          {hexes(T).slice(0, 40).map((c) => <span key={c} style={{ background: c }} />)}
        </div>
      );
    /* State layers: the accent laid over the surface at each stated opacity. */
    case "f-state-layers":
      return (
        <div className="kit-ft kit-ft-layers" aria-hidden="true" style={{ fontFamily: t.font }}>
          {[["Hover", 8], ["Focus", 12], ["Pressed", 12], ["Dragged", 16]].map(([name, pct]) => (
            <span key={name} style={{ background: `color-mix(in srgb, ${t.accent} ${pct}%, ${t.bg})`, color: t.fg }}>
              <b>{pct}%</b><i>{name}</i>
            </span>
          ))}
        </div>
      );
    case "f-type":
      return (
        <div className="kit-ft kit-ft-type" aria-hidden="true" style={{ fontFamily: t.font }}>
          <span className="is-display">Aa</span>
          <span className="is-heading">Heading</span>
          <span className="is-body">Body text</span>
          <span className="is-caption" style={{ color: t.fg2 }}>Caption</span>
        </div>
      );
    /* Content design: words in an interface, a label and the lines under it. */
    case "f-content":
      return (
        <div className="kit-ft kit-ft-content" aria-hidden="true">
          <span className="is-title" style={{ background: t.fg }} />
          <span style={{ background: t.fg3, width: "92%" }} />
          <span style={{ background: t.fg3, width: "78%" }} />
          <span style={{ background: t.fg3, width: "56%" }} />
          <span className="is-action" style={{ background: t.accent, borderRadius: Math.min(corner, 20) }}><i style={{ background: t.accentFg }} /></span>
        </div>
      );
    case "f-spacing": {
      const steps = SPACING_STEPS[sys];
      if (!steps) return null;
      return (
        <div className="kit-ft kit-ft-spacing" aria-hidden="true" style={{ fontFamily: t.font }}>
          {steps.map((s) => (
            <span key={s.label}><b>{s.label}</b><i style={{ width: s.w, background: t.accent }} /></span>
          ))}
        </div>
      );
    }
    case "f-elevation":
      return (
        <div className="kit-ft kit-ft-elevation" aria-hidden="true">
          {[0, 1, 2, 3].map((n) => (
            <span key={n} style={{ background: t.bg, borderRadius: corner, boxShadow: n === 0 ? "none" : `0 ${n * 2}px ${n * 6}px color-mix(in srgb, ${t.fg} ${8 + n * 6}%, transparent)`, transform: `translateY(${-n * 4}px)` }} />
          ))}
        </div>
      );
    /* Iconography: the system's own icon set. Salt, Fluent and Carbon draw
       through the icon component their pages use; Material and uoaui both
       use Material Symbols. */
    case "f-icons": {
      const Own = OWN_ICONS[sys];
      if (Own) {
        return (
          <div className="kit-ft kit-ft-icons" aria-hidden="true" style={{ color: t.fg }}>
            {Own.names.map((name) => <span key={name}><Own.Icon name={name} size={26} color={t.fg} /></span>)}
          </div>
        );
      }
      return (
        <div className="kit-ft kit-ft-icons material-symbols-outlined" aria-hidden="true" style={{ color: t.fg }}>
          {["search", "settings", "favorite", "home", "mail", "calendar_month", "bar_chart", "person"].map((i) => <span key={i}>{i}</span>)}
        </div>
      );
    }
    case "f-density": {
      const steps = DENSITY_STEPS[sys];
      const tallest = Math.max(...steps.map((s) => s.h));
      /* Heights are true to the pixel up to 48; Carbon's 64 and 80 are drawn
         to scale so the ladder fits the tile. */
      const k = tallest > 48 ? 96 / tallest : 1;
      return (
        <div className="kit-ft kit-ft-density" aria-hidden="true" data-steps={steps.length}>
          {steps.map((s) => (
            <span key={s.label} style={{ height: Math.round(s.h * k), borderRadius: Math.min(corner, 6), background: t.accentWeak, color: t.accentText, fontFamily: t.font }}>{s.label}</span>
          ))}
        </div>
      );
    }
    case "f-shape": {
      const steps = SHAPE_STEPS[sys] ?? [corner];
      return (
        <div className="kit-ft kit-ft-shape" aria-hidden="true" data-steps={steps.length}>
          {steps.map((r, i) => <span key={i} style={{ borderRadius: r === "full" ? "50%" : r, background: t.accent }} />)}
        </div>
      );
    }
    case "f-motion": {
      const steps = MOTION_STEPS[sys];
      if (!steps) return null;
      const longest = Math.max(...steps);
      return (
        <div className="kit-ft kit-ft-motion" aria-hidden="true" style={{ fontFamily: t.font }}>
          {steps.map((ms) => (
            <span key={ms}><i style={{ width: `${Math.max(6, (ms / longest) * 100)}%`, background: t.accent }} /><b style={{ color: t.fg2 }}>{ms}ms</b></span>
          ))}
        </div>
      );
    }
    /* Token architecture: each system's own model, not one borrowed diagram. */
    case "f-tokens": {
      if (sys === "salt") {
        return (
          <div className="kit-ft kit-ft-stack" aria-hidden="true" style={{ fontFamily: t.font }}>
            {[["Characteristic", t.accent, t.accentFg], ["Palette", t.accentWeak, t.accentText], ["Foundation", t.bg3, t.fg]].map(([name, bg, fg]) => (
              <span key={name} style={{ background: bg, color: fg }}>{name}</span>
            ))}
          </div>
        );
      }
      if (sys === "m3") {
        const roles = ["primary", "secondary", "tertiary"];
        const cap = (r: string) => r[0].toUpperCase() + r.slice(1);
        return (
          <div className="kit-ft kit-ft-tonal" aria-hidden="true">
            {roles.map((r) => (
              <span key={r}>
                {[tok(r, t.accent), tok(`on${cap(r)}`, t.accentFg), tok(`${r}Container`, t.accentWeak), tok(`on${cap(r)}Container`, t.accentText)].map((c, i) => <i key={i} style={{ background: c }} />)}
              </span>
            ))}
          </div>
        );
      }
      const rows: [string, string][] = sys === "carbon"
        ? [["$interactive", tok("interactive", t.accent)], ["$layer", tok("layer01", t.bg2)], ["$field", tok("field01", t.bg2)], ["$text", tok("textPrimary", t.fg)]]
        : [["--a-bg", t.bg], ["--a-surface", t.bg2], ["--a-accent", t.accent], ["--a-fg", t.fg]];
      return (
        <div className="kit-ft kit-ft-tokens" aria-hidden="true" style={{ color: t.fg2 }}>
          {rows.map(([name, c]) => <span key={name}><i style={{ background: c }} /><code>{name}</code></span>)}
        </div>
      );
    }
    /* Component mapping: a colour role on the left, the part it paints on the
       right (a filled action, a tonal action, a field). */
    case "f-mapping":
      return (
        <div className="kit-ft kit-ft-mapping" aria-hidden="true">
          {[
            [tok("primary", t.accent), "is-pill"],
            [tok("secondaryContainer", t.accentWeak), "is-pill"],
            [tok("surfaceContainerHighest", t.bg3), "is-field"],
          ].map(([c, shape], i) => (
            <span key={i}>
              <i className="is-dot" style={{ background: c }} />
              <i className="is-line" style={{ background: t.fg3 }} />
              <i className={shape} style={{ background: c, borderBottomColor: shape === "is-field" ? tok("onSurfaceVariant", t.fg2) : undefined }} />
            </span>
          ))}
        </div>
      );
    case "f-a11y":
      return (
        <div className="kit-ft kit-ft-a11y" aria-hidden="true" style={{ fontFamily: t.font }}>
          <span style={{ background: t.accent, color: t.accentFg }}>Aa</span>
          <span style={{ background: t.bg, color: t.fg, boxShadow: `inset 0 0 0 2px ${t.focusRing}` }}>Aa</span>
          <span style={{ background: t.bg2, color: t.fg2 }}>Aa</span>
        </div>
      );
    default:
      return null;
  }
}
