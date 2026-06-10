"use client";

/* ════════════════════════════════════════════════════════════
   VariantExample — a small, component-appropriate live example of one
   variant, rendered from theme tokens (colour-free, skins per DS).
   ════════════════════════════════════════════════════════════
   The Overview "Variants" cards show what each variant looks like, not
   just its name. A button variant is a pill; a card variant is a mini
   card; a text-field variant is an input. This switches on the component
   type + a generic style key so the same data shape drives every DS.
   ════════════════════════════════════════════════════════════ */

import React from "react";

export interface VariantExampleTheme {
  bg: string;
  bg2: string;
  fg: string;
  fg2: string;
  accent: string;
  accentText: string;
  border: string;
  font: string;
  /* Optional accent companions (required on ActiveTheme; optional here so
     test mocks and partial themes stay simple). */
  accentWeak?: string;
  accentFg?: string;
  /* Optional semantic status slots (mirrors ActiveTheme) - undefined
     where the active DS has no real token for that role. */
  successBg?: string; successFg?: string; successStrong?: string; successStrongFg?: string;
  warningBg?: string; warningFg?: string; warningStrong?: string; warningStrongFg?: string;
  dangerBg?: string; dangerFg?: string; dangerStrong?: string; dangerStrongFg?: string;
  infoBg?: string; infoFg?: string; infoStrong?: string; infoStrongFg?: string;
}

export interface VariantExampleProps {
  componentId: string;
  /** Generic appearance key (per component): button solid/tonal/elevated/outlined/text;
   *  card elevated/filled/outlined; field filled/outlined; chip
   *  assist/filter/input/suggestion; badge dot/count. */
  style: string;
  label: string;
  t: VariantExampleTheme;
}

export function VariantExample({ componentId, style, label, t }: VariantExampleProps) {
  /* ── Button → a pill ── */
  if (componentId === "button") {
    const map: Record<string, React.CSSProperties> = {
      solid: { background: t.accent, color: t.accentText, border: "1px solid transparent" },
      tonal: { background: `color-mix(in srgb, ${t.accent} 24%, ${t.bg})`, color: t.fg, border: "1px solid transparent" },
      elevated: { background: t.bg2, color: t.accent, border: `1px solid ${t.border}`, boxShadow: "0 2px 7px rgba(0,0,0,0.24)" },
      outlined: { background: "transparent", color: t.accent, border: `1px solid ${t.border}` },
      text: { background: "transparent", color: t.accent, border: "1px solid transparent" },
    };
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", height: 38,
        padding: style === "text" ? "0 8px" : "0 22px",
        borderRadius: 999, font: `600 14px/1 ${t.font}`, letterSpacing: 0.2,
        whiteSpace: "nowrap", ...(map[style] ?? map.solid),
      }}>{label}</span>
    );
  }

  /* ── Card → a mini card ── */
  if (componentId === "card") {
    const map: Record<string, React.CSSProperties> = {
      elevated: { background: t.bg2, border: "1px solid transparent", boxShadow: "0 3px 12px rgba(0,0,0,0.30)" },
      filled: { background: `color-mix(in srgb, ${t.accent} 9%, ${t.bg2})`, border: "1px solid transparent" },
      outlined: { background: t.bg, border: `1px solid ${t.border}` },
    };
    return (
      <div style={{ width: 200, borderRadius: 16, padding: 14, display: "grid", gap: 9, ...(map[style] ?? map.elevated) }}>
        <div style={{ height: 64, borderRadius: 9, background: `color-mix(in srgb, ${t.accent} 20%, ${t.bg2})` }} />
        <div style={{ height: 8, width: "62%", borderRadius: 5, background: t.fg, opacity: 0.78 }} />
        <div style={{ height: 7, width: "92%", borderRadius: 5, background: t.fg2, opacity: 0.5 }} />
      </div>
    );
  }

  /* ── Text field → an input ── */
  if (componentId === "textInput") {
    const filled = style === "filled";
    return (
      <div style={{ width: 210, display: "grid", gap: 5 }}>
        <span style={{ color: t.fg2, font: `500 11px/1 ${t.font}`, paddingLeft: filled ? 12 : 0 }}>Label</span>
        <div style={{
          height: 44,
          display: "flex", alignItems: "center", padding: "0 14px",
          color: t.fg, font: `400 14px/1 ${t.font}`,
          background: filled ? `color-mix(in srgb, ${t.fg} 7%, ${t.bg})` : "transparent",
          border: filled ? "none" : `1px solid ${t.border}`,
          borderBottom: filled ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
          borderRadius: filled ? "8px 8px 0 0" : 8,
        }}>Value</div>
      </div>
    );
  }

  /* ── Chip → an M3 chip, one per type ── */
  if (componentId === "chip") {
    /* Type-distinct: each chip type carries its signature affordance —
       assist is elevated with a leading icon, filter shows its selected
       tonal fill + check, input has the trailing remove, suggestion is
       the plain outlined baseline. M3 spec: 32dp container, 8dp corner,
       label-large, 18dp icons, 8dp padding on the icon side / 16dp on
       the text side. */
    /* Salt's two chip primitives ride the same branch at Salt metrics:
       20px container, 4px corner, label in 12px. Pill carries its selected
       look (accentWeak fill + accent border); Tag is the neutral removable
       entry with a trailing close. */
    const salt = style === "salt-pill" || style === "salt-tag";
    const map: Record<string, React.CSSProperties> = {
      assist: { background: t.bg2, color: t.fg, border: "1px solid transparent", boxShadow: "0 2px 7px rgba(0,0,0,0.24)" },
      filter: { background: `color-mix(in srgb, ${t.accent} 24%, ${t.bg})`, color: t.fg, border: "1px solid transparent" },
      input: { background: "transparent", color: t.fg, border: `1px solid ${t.border}` },
      suggestion: { background: "transparent", color: t.fg, border: `1px solid ${t.border}` },
      "salt-pill": { background: t.accentWeak ?? t.bg2, color: t.accentText, border: `1px solid ${t.accent}` },
      "salt-tag": { background: t.bg2, color: t.fg2, border: `1px solid ${t.border}` },
    };
    const icon = (name: string, extra?: React.CSSProperties) => (
      <span className="material-symbols-outlined" aria-hidden style={{ fontSize: salt ? 14 : 18, lineHeight: 1, ...extra }}>
        {name}
      </span>
    );
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: salt ? 4 : 8, height: salt ? 20 : 32,
        padding:
          style === "salt-pill" ? "0 8px"
          : style === "salt-tag" ? "0 4px 0 8px"
          : style === "input" ? "0 8px 0 16px"
          : style === "suggestion" ? "0 16px"
          : "0 16px 0 8px",
        borderRadius: salt ? 4 : 8, font: `500 ${salt ? 12 : 14}px/1 ${t.font}`, letterSpacing: 0.1,
        whiteSpace: "nowrap", ...(map[style] ?? map.suggestion),
      }}>
        {style === "assist" && icon("event", { color: t.accent })}
        {style === "filter" && icon("check")}
        {label}
        {style === "input" && icon("close", { color: t.fg2 })}
        {style === "salt-tag" && icon("close", { color: t.fg2 })}
      </span>
    );
  }

  /* ── Badge → a true M3 badge, anchored top-right on a host glyph ── */
  if (componentId === "badge") {
    /* M3 canon: small badge is a 6dp error-colour dot; large badge is a
       16dp-tall counter pill (min-width 16dp, 8dp corner, label-small).
       dangerStrong/dangerStrongFg are optional on the theme type (some
       DSs carry no real error token), so TS needs the ?? fallback to
       accent - it is never hit for m3, which always supplies them. */
    /* Fluent's appearance ladder is a bare counter pill, not an anchored
       notification: 20px tall, 10px corner, label in 12px semibold. */
    if (style.startsWith("fluent-")) {
      const fluentMap: Record<string, React.CSSProperties> = {
        "fluent-filled": { background: t.accent, color: t.accentFg ?? t.accentText },
        "fluent-tint": {
          background: `color-mix(in srgb, ${t.accent} 15%, ${t.bg})`,
          color: t.accent,
          border: `1px solid color-mix(in srgb, ${t.accent} 30%, ${t.bg})`,
        },
        "fluent-outline": { background: "transparent", border: `1px solid ${t.accent}`, color: t.accent },
        "fluent-ghost": { color: t.accent },
      };
      return (
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          height: 20, minWidth: 20, borderRadius: 10, padding: "0 6px",
          font: `600 12px/1 ${t.font}`, whiteSpace: "nowrap", boxSizing: "border-box",
          ...(fluentMap[style] ?? fluentMap["fluent-filled"]),
        }}>3</span>
      );
    }

    /* uoaui's glass badges are bare labelled status pills, no host glyph:
       22px tall, fully rounded, label in 11px. Status variants borrow a
       quarter of their own text colour for the hairline border. */
    if (style.startsWith("glass-")) {
      const statusBorder = "1px solid color-mix(in srgb, currentColor 25%, transparent)";
      const glassMap: Record<string, { css: React.CSSProperties; text: string }> = {
        "glass-accent": {
          css: { background: `color-mix(in srgb, ${t.accent} 10%, transparent)`, color: t.fg2, border: `1px solid ${t.border}` },
          text: "Beta",
        },
        "glass-default": {
          css: { background: t.bg2, color: t.fg2, border: `1px solid ${t.border}` },
          text: "Default",
        },
        "glass-danger": { css: { background: t.dangerBg, color: t.dangerFg, border: statusBorder }, text: "Error" },
        "glass-success": { css: { background: t.successBg, color: t.successFg, border: statusBorder }, text: "Done" },
        "glass-warning": { css: { background: t.warningBg, color: t.warningFg, border: statusBorder }, text: "Hold" },
      };
      const glass = glassMap[style] ?? glassMap["glass-default"];
      return (
        <span style={{
          display: "inline-flex", alignItems: "center", height: 22, borderRadius: 9999,
          padding: "0 10px", font: `500 11px/1 ${t.font}`, whiteSpace: "nowrap",
          boxSizing: "border-box", ...glass.css,
        }}>{glass.text}</span>
      );
    }

    /* Anchored notification markers (M3 + Salt) share the 16px counter
       recipe; only the semantic fill differs. */
    const counter = (bg: string, fg: string): React.CSSProperties => ({
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      height: 16, minWidth: 16, borderRadius: 8, padding: "0 4px",
      font: `500 11px/1 ${t.font}`, background: bg, color: fg,
    });
    const map: Record<string, React.CSSProperties> = {
      dot: { width: 6, height: 6, borderRadius: 999, background: t.dangerStrong ?? t.accent },
      "salt-dot": { width: 8, height: 8, borderRadius: 999, background: t.accent },
      count: counter(t.dangerStrong ?? t.accent, t.dangerStrongFg ?? t.accentText),
      "salt-accent": counter(t.accent, t.accentFg ?? t.accentText),
      "salt-positive": counter(t.successStrong ?? t.accent, t.successStrongFg ?? t.accentText),
      "salt-caution": counter(t.warningStrong ?? t.accent, t.warningStrongFg ?? t.accentText),
      "salt-negative": counter(t.dangerStrong ?? t.accent, t.dangerStrongFg ?? t.accentText),
    };
    const badge = map[style] ?? map.count;
    const isDot = style === "dot" || style === "salt-dot";
    return (
      <span style={{ position: "relative", display: "inline-flex", padding: "4px 8px 0 0" }}>
        {/* Neutral host glyph: badges read as badges only when anchored,
            mirroring the icon anchor in the M3 docs demos. */}
        <span style={{ width: 24, height: 24, borderRadius: 6, background: t.bg2, border: `1px solid ${t.border}` }} />
        <span style={{ position: "absolute", top: 0, right: 0, boxSizing: "border-box", ...badge }}>
          {isDot ? null : "3"}
        </span>
      </span>
    );
  }

  return null;
}
