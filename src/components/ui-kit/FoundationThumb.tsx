"use client";

import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useDesignHub } from "@/store/useDesignHub";
import { conceptOf } from "./kitEquivalence";

/**
 * Graphic-first thumbnail for a Foundations tile, drawn from the active
 * system's own tokens: its palette, typeface, spacing unit, elevation steps,
 * corner and density. A foundation page is prose, so cropping it into a tile
 * sliced sentences mid-word; a picture of the thing says more at a glance.
 */
export function FoundationThumb({ id }: { id: string }) {
  const t = useTheme();
  const state = useDesignHub();
  const sys = state.activeSystem;
  const key = conceptOf(sys, id) ?? "";
  const ramp = [t.accent, t.accentWeak, t.successStrong ?? t.successFg, t.warningStrong ?? t.warningFg, t.dangerStrong ?? t.dangerFg, t.infoStrong ?? t.infoFg, t.fg, t.fg2, t.fg3, t.bg3, t.bg2]
    .filter((c): c is string => typeof c === "string" && c.length > 0)
    .filter((c, i, a) => a.indexOf(c) === i);
  const unit = sys === "carbon" ? 2 : 4;
  const corner = sys === "carbon" ? 0 : sys === "m3" ? 16 : sys === "uoaui" ? 14 : 8;

  switch (key) {
    case "f-color":
    case "f-palette":
    case "f-state-layers":
      return (
        <div className="kit-ft kit-ft-color" aria-hidden="true">
          {ramp.slice(0, 10).map((c) => <span key={c} style={{ background: c }} />)}
        </div>
      );
    case "f-type":
    case "f-content":
      return (
        <div className="kit-ft kit-ft-type" aria-hidden="true" style={{ fontFamily: t.font }}>
          <span style={{ fontSize: 44, fontWeight: 700 }}>Aa</span>
          <span style={{ fontSize: 22, fontWeight: 500 }}>Heading</span>
          <span style={{ fontSize: 14 }}>Body text at 14</span>
          <span style={{ fontSize: 12, color: t.fg2 }}>Caption 12</span>
        </div>
      );
    case "f-spacing":
      return (
        <div className="kit-ft kit-ft-spacing" aria-hidden="true">
          {[1, 2, 3, 4, 6, 8].map((n) => (
            <span key={n}><i style={{ width: n * unit * 2, background: t.accent }} /><b>{n * unit}</b></span>
          ))}
        </div>
      );
    case "f-elevation":
      return (
        <div className="kit-ft kit-ft-elevation" aria-hidden="true">
          {[0, 1, 2, 3].map((n) => (
            <span key={n} style={{ background: t.bg, borderRadius: corner, boxShadow: n === 0 ? "none" : `0 ${n * 2}px ${n * 6}px color-mix(in srgb, ${t.fg} ${8 + n * 6}%, transparent)`, transform: `translateY(${-n * 4}px)` }} />
          ))}
        </div>
      );
    case "f-icons":
      return (
        <div className="kit-ft kit-ft-icons material-symbols-outlined" aria-hidden="true" style={{ color: t.fg }}>
          {["search", "settings", "favorite", "home", "mail", "calendar_month", "bar_chart", "person"].map((i) => <span key={i}>{i}</span>)}
        </div>
      );
    case "f-density":
      return (
        <div className="kit-ft kit-ft-density" aria-hidden="true">
          {[20, 28, 36, 44].map((h) => (
            <span key={h} style={{ height: h, borderRadius: Math.min(corner, 6), background: t.accentWeak, color: t.accentText, fontFamily: t.font }}>{h}</span>
          ))}
        </div>
      );
    case "f-shape":
      return (
        <div className="kit-ft kit-ft-shape" aria-hidden="true">
          {[0, 4, 8, 16, 28].map((r) => <span key={r} style={{ borderRadius: r, background: t.accent }} />)}
        </div>
      );
    case "f-motion":
      return (
        <div className="kit-ft kit-ft-motion" aria-hidden="true">
          {[70, 110, 240, 400].map((ms, i) => <span key={ms} style={{ width: `${30 + i * 20}%`, background: t.accent, opacity: 1 - i * 0.2 }}><b style={{ color: t.fg2, fontFamily: t.font }}>{ms}ms</b></span>)}
        </div>
      );
    case "f-tokens":
    case "f-mapping":
      return (
        <div className="kit-ft kit-ft-tokens" aria-hidden="true" style={{ fontFamily: t.font, color: t.fg2 }}>
          <span><i style={{ background: t.accent }} />primitive</span>
          <span><i style={{ background: t.accentWeak }} />semantic</span>
          <span><i style={{ background: t.bg3 }} />component</span>
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
