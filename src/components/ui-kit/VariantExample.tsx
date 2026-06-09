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
}

export interface VariantExampleProps {
  componentId: string;
  /** Generic appearance key (per component): button solid/tonal/elevated/outlined/text;
   *  card elevated/filled/outlined; field filled/outlined. */
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

  return null;
}
