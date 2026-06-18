"use client";

import React from "react";
import { useBuilder, normalizeGap, type ZoneId, type ZoneLayout, type LayoutMode, type LayoutAlign, type LayoutJustify } from "@/store/useBuilder";

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
      { v: "space-around", icon: "view_agenda", label: "Space around" },
    ];
  }
  return [
    { v: "start", icon: "format_align_left", label: "Pack to start" },
    { v: "center", icon: "format_align_center", label: "Center" },
    { v: "end", icon: "format_align_right", label: "Pack to end" },
    { v: "space-between", icon: "view_week", label: "Space between" },
    { v: "space-around", icon: "view_column", label: "Space around" },
  ];
}

/* ── Gap snap-handle ──────────────────────────────────────────
   The zone's gap may ONLY take a design-token value. "Snapping" here
   is magnetism on this token scale: the drag math is throwaway; the
   single committed artifact is ZoneLayout.gap (which the resolver
   already emits as `gap: Npx`). No coordinate is ever stored. */
export const GAP_STOPS = [0, 4, 8, 12, 16, 24, 32] as const;

/** Snap an arbitrary px gap to the nearest token stop (clamped to range). */
export function snapGapToToken(px: number): number {
  let best: number = GAP_STOPS[0];
  let bestDist = Infinity;
  for (const stop of GAP_STOPS) {
    const d = Math.abs(stop - px);
    if (d < bestDist) { bestDist = d; best = stop; }
  }
  return best;
}

/** Step to the adjacent token stop from the current value (dir +1 / -1). */
export function stepGap(current: number, dir: 1 | -1): number {
  const i = GAP_STOPS.indexOf(snapGapToToken(current) as (typeof GAP_STOPS)[number]);
  const next = Math.max(0, Math.min(GAP_STOPS.length - 1, i + dir));
  return GAP_STOPS[next];
}

const PX_PER_STOP = 16; // horizontal drag distance to advance one token stop

function GapScrubber({ zoneId, zoneLayout }: { zoneId: ZoneId; zoneLayout: ZoneLayout }) {
  const setZoneLayout = useBuilder((s) => s.setZoneLayout);
  const g = normalizeGap(zoneLayout.gap);
  const currentGap = g ? Math.max(g.row, g.col) : 8;
  const dragRef = React.useRef<{ startX: number; startIndex: number } | null>(null);

  /* Write a uniform gap (both axes) — the inspector keeps independent
     row/col control; the on-canvas handle is the quick uniform path. */
  const commit = (n: number) => {
    if (n !== currentGap) setZoneLayout(zoneId, { gap: { row: n, col: n } });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const idx = GAP_STOPS.indexOf(snapGapToToken(currentGap) as (typeof GAP_STOPS)[number]);
    dragRef.current = { startX: e.clientX, startIndex: idx < 0 ? 0 : idx };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const steps = Math.round((e.clientX - dragRef.current.startX) / PX_PER_STOP);
    const ni = Math.max(0, Math.min(GAP_STOPS.length - 1, dragRef.current.startIndex + steps));
    commit(GAP_STOPS[ni]);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    dragRef.current = null;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); commit(stepGap(currentGap, 1)); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); commit(stepGap(currentGap, -1)); }
  };

  return (
    <div
      className="zlo-gap"
      role="slider"
      tabIndex={0}
      aria-label="Gap between items"
      aria-valuemin={0}
      aria-valuemax={32}
      aria-valuenow={currentGap}
      aria-valuetext={`${currentGap}px`}
      title={`Gap ${currentGap}px — drag or arrow keys to snap`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={onKeyDown}
    >
      <span className="material-symbols-outlined" aria-hidden="true">width</span>
      <span className="zlo-gap-val">{currentGap}</span>
    </div>
  );
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
      <span className="zlo-sep" aria-hidden="true" />
      <GapScrubber zoneId={zoneId} zoneLayout={zoneLayout} />
    </div>
  );
}
