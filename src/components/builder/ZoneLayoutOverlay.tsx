"use client";

import React from "react";
import { useBuilder, type ZoneId, type ZoneLayout, type LayoutMode, type LayoutAlign, type LayoutJustify } from "@/store/useBuilder";

/* ══════════════════════════════════════════════════════════
   ZoneLayoutOverlay — Placement P2 (align/justify handles).

   A small on-canvas control cluster, pinned to a zone's top-right
   and revealed on zone hover (Edit mode only). It exposes the two
   container-level layout tokens — cross-axis ALIGN (align-items) and
   main-axis DISTRIBUTE (justify-content/justify-items) — so the
   designer can re-align a zone without opening the inspector.

   It is a pure shortcut to setZoneLayout: the SAME tokens the
   inspector writes, so it is export-neutral by construction (align /
   justify already resolve per-DS in computeContainerStyle and export
   via reactExporter). It NEVER writes a coordinate or a per-block
   offset — that boundary is the moat.

   Icons + labels adapt to the zone's flow axis: in a row/grid the
   main axis is horizontal (cross = vertical → Top/Middle/Bottom); in
   a stack the main axis is vertical (cross = horizontal → Left/
   Center/Right). The option helpers are pure + exported for tests.
   ══════════════════════════════════════════════════════════ */

export interface AlignOption { v: LayoutAlign; icon: string; label: string }
export interface JustifyOption { v: LayoutJustify; icon: string; label: string }

/** Cross-axis (align-items) options, oriented to the zone's flow. */
export function crossAxisAlignOptions(mode: LayoutMode): AlignOption[] {
  if (mode === "stack") {
    // Vertical main axis → cross axis is horizontal.
    return [
      { v: "start", icon: "align_horizontal_left", label: "Align left" },
      { v: "center", icon: "align_horizontal_center", label: "Align center" },
      { v: "end", icon: "align_horizontal_right", label: "Align right" },
      { v: "stretch", icon: "width", label: "Stretch to fill" },
    ];
  }
  // Row / grid → cross axis is vertical.
  return [
    { v: "start", icon: "align_vertical_top", label: "Align top" },
    { v: "center", icon: "align_vertical_center", label: "Align middle" },
    { v: "end", icon: "align_vertical_bottom", label: "Align bottom" },
    { v: "stretch", icon: "height", label: "Stretch to fill" },
  ];
}

/** Main-axis (justify) distribution options, oriented to the zone's flow. */
export function mainAxisJustifyOptions(mode: LayoutMode): JustifyOption[] {
  if (mode === "stack") {
    return [
      { v: "start", icon: "vertical_align_top", label: "Pack to top" },
      { v: "center", icon: "vertical_align_center", label: "Center" },
      { v: "end", icon: "vertical_align_bottom", label: "Pack to bottom" },
      { v: "space-between", icon: "expand", label: "Space between" },
    ];
  }
  return [
    { v: "start", icon: "format_align_left", label: "Pack to start" },
    { v: "center", icon: "format_align_center", label: "Center" },
    { v: "end", icon: "format_align_right", label: "Pack to end" },
    { v: "space-between", icon: "view_week", label: "Space between" },
  ];
}

interface ZoneLayoutOverlayProps {
  zoneId: ZoneId;
  zoneLayout: ZoneLayout | undefined;
}

export function ZoneLayoutOverlay({ zoneId, zoneLayout }: ZoneLayoutOverlayProps) {
  const setZoneLayout = useBuilder((s) => s.setZoneLayout);
  if (!zoneLayout || zoneLayout.visible === false) return null;

  const mode = zoneLayout.mode;
  const alignOpts = crossAxisAlignOptions(mode);
  const justifyOpts = mainAxisJustifyOptions(mode);
  const activeAlign = zoneLayout.align ?? "stretch";
  const activeJustify = zoneLayout.justify ?? "start";

  return (
    <div className="zone-layout-overlay" role="group" aria-label={`${zoneId} layout`} data-zone={zoneId}>
      <div className="zlo-group" role="radiogroup" aria-label="Align items">
        {alignOpts.map((o) => (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={activeAlign === o.v}
            aria-label={o.label}
            title={o.label}
            className={`zlo-btn${activeAlign === o.v ? " active" : ""}`}
            onClick={() => setZoneLayout(zoneId, { align: o.v })}
          >
            <span className="material-symbols-outlined" aria-hidden="true">{o.icon}</span>
          </button>
        ))}
      </div>
      <span className="zlo-sep" aria-hidden="true" />
      <div className="zlo-group" role="radiogroup" aria-label="Distribute">
        {justifyOpts.map((o) => (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={activeJustify === o.v}
            aria-label={o.label}
            title={o.label}
            className={`zlo-btn${activeJustify === o.v ? " active" : ""}`}
            /* `start` is the default; clear it (undefined) to keep saved
               projects lean + back-compatible, mirroring the inspector. */
            onClick={() => setZoneLayout(zoneId, { justify: o.v === "start" ? undefined : o.v })}
          >
            <span className="material-symbols-outlined" aria-hidden="true">{o.icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
