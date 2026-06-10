"use client";

/* ════════════════════════════════════════════════════════════
   AnatomyDiagram — UI-Kit "Specs ‣ Anatomy" primitive.
   ════════════════════════════════════════════════════════════
   Mirrors m3.material.io's component-anatomy section: a schematic of
   the component on a dotted-grid stage, numbered callout badges keyed
   to a legend, and dp measurement annotations (the signature pink
   bracket). Everything is driven by COMPONENT_ANATOMY data and skins
   from the active theme `t` — the SAME primitive reads per-DS once each
   system supplies its anatomy entry. Seeded for the M3 Button pilot.
   ════════════════════════════════════════════════════════════ */

import React, { Fragment } from "react";
import type { ComponentAnatomy } from "@/data/ui-kit-meta";

/** Theme slots the diagram reads — a structural subset of ActiveTheme. */
export interface AnatomyTheme {
  fg: string;
  bg: string;
  accent: string;
  accentText: string;
  border: string;
  fg2: string;
  fg3: string;
  font: string;
}

export interface AnatomyDiagramProps {
  anatomy: ComponentAnatomy;
  t: AnatomyTheme;
  /** Label rendered inside the schematic specimen. */
  specimen?: string;
  /** Measurement-overlay colour. A cross-DS doc affordance, not a DS
   *  token — defaults to the M3 doc pink via the --dh-measure token. */
  measureColor?: string;
  /** Picks the schematic shape (same switch pattern as VariantExample):
   *  "badge" renders an M3 chip with leading + trailing icons so the icon
   *  callouts anchor to real parts; anything else keeps the button pill. */
  componentId?: string;
}

export function AnatomyDiagram({
  anatomy,
  t,
  specimen = "Label",
  measureColor = "var(--dh-measure, #e5398b)",
  componentId,
}: AnatomyDiagramProps) {
  const { parts, measures } = anatomy;
  const height = measures.find((m) => /height/i.test(m.label));

  return (
    <div className="dh-anatomy">
      {/* Dotted-grid stage — backdrop dots + border skin from theme. */}
      <div
        className="dh-anatomy-stage"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 340,
          padding: 96,
          borderRadius: 16,
          border: `1px solid ${t.border}`,
          background: t.bg,
          backgroundImage: `radial-gradient(${t.border} 1.3px, transparent 1.3px)`,
          backgroundSize: "18px 18px",
          backgroundPosition: "center",
          overflow: "hidden",
        }}
      >
        {/* Specimen wrapper — callouts + overlays anchor to this box. */}
        <div className="dh-anatomy-spec" style={{ position: "relative" }}>
          {/* The component schematic, theme-skinned. The button pill draws
              40dp at 1.3x (52px); the chip draws 32dp at the same 1.3x
              (42px, 8dp corner -> 10px, 18dp icons -> 23px). */}
          {componentId === "badge" ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                height: 42,
                padding: "0 10px",
                borderRadius: 10,
                background: t.bg,
                border: `1.5px solid ${t.border}`,
                color: t.fg,
                font: `500 18px/1 ${t.font}`,
                letterSpacing: 0.1,
                whiteSpace: "nowrap",
              }}
            >
              <span className="material-symbols-outlined" aria-hidden style={{ fontSize: 23, lineHeight: 1, color: t.accent }}>
                event
              </span>
              {specimen}
              <span className="material-symbols-outlined" aria-hidden style={{ fontSize: 23, lineHeight: 1, color: t.fg2 }}>
                close
              </span>
            </div>
          ) : (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 52,
                padding: "0 30px",
                borderRadius: 999,
                background: t.accent,
                color: t.accentText,
                font: `500 16px/1 ${t.font}`,
                letterSpacing: 0.1,
                boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
                whiteSpace: "nowrap",
              }}
            >
              {specimen}
            </div>
          )}

          {/* Signature pink height bracket on the left edge. */}
          {height && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: -22,
                top: 0,
                bottom: 0,
                width: 0,
                borderLeft: `1.5px dashed ${measureColor}`,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: -6,
                  top: "50%",
                  transform: "translate(-100%,-50%)",
                  color: t.fg,
                  font: `600 11px/1 ${t.font}`,
                  whiteSpace: "nowrap",
                }}
              >
                {height.value}
              </span>
            </div>
          )}

          {/* Numbered callout badges, anchored by percent within the stage.
              Anchors outside 0–100 push the badge off the specimen (small
              schematics like the chip would otherwise be buried under their
              own callouts) — those get a vertical leader tick connecting the
              badge back to the specimen edge. */}
          {parts.map((p) => {
            const above = p.y < 0;
            const below = p.y > 100;
            return (
              <Fragment key={p.n}>
                {(above || below) && (
                  <span
                    aria-hidden
                    className="dh-anatomy-tick"
                    style={{
                      position: "absolute",
                      left: `${p.x}%`,
                      top: above ? `${p.y}%` : "100%",
                      height: above ? `${-p.y}%` : `${p.y - 100}%`,
                      width: 0,
                      borderLeft: `1.5px solid ${t.fg3}`,
                      transform: "translateX(-50%)",
                    }}
                  />
                )}
                <span
                  className="dh-anatomy-callout"
                  style={{
                    position: "absolute",
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    transform: "translate(-50%,-50%)",
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: t.fg,
                    color: t.bg,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    font: `600 12px/1 ${t.font}`,
                    boxShadow: `0 0 0 2px ${t.bg}`,
                  }}
                >
                  {p.n}
                </span>
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* Legend (parts) + dp measures, below the stage. */}
      <div
        className="dh-anatomy-meta"
        style={{ display: "flex", flexWrap: "wrap", gap: "20px 48px", marginTop: 18 }}
      >
        <ol
          className="dh-anatomy-legend"
          style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}
        >
          {parts.map((p) => (
            <li
              key={p.n}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: t.fg2,
                font: `400 13px/1.3 ${t.font}`,
              }}
            >
              <span
                aria-hidden
                style={{
                  flex: "0 0 auto",
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  background: t.fg,
                  color: t.bg,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  font: `600 11px/1 ${t.font}`,
                }}
              >
                {p.n}
              </span>
              {p.label}
            </li>
          ))}
        </ol>

        {measures.length > 0 && (
          <dl
            className="dh-anatomy-measures"
            style={{
              margin: 0,
              display: "grid",
              gridTemplateColumns: "auto auto",
              gap: "8px 14px",
              alignContent: "start",
            }}
          >
            {measures.map((m) => (
              <Fragment key={m.label}>
                <dt style={{ color: t.fg3, font: `400 13px/1.3 ${t.font}` }}>{m.label}</dt>
                <dd style={{ margin: 0, color: t.fg, font: `600 13px/1.3 ${t.font}` }}>
                  {m.value}
                </dd>
              </Fragment>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
