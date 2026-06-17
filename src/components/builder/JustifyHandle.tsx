"use client";

import React from "react";
import { useBuilder, type ZoneId, type ZoneLayout, type LayoutJustify } from "@/store/useBuilder";

/* ══════════════════════════════════════════════════════════
   JustifyHandle — Placement P2 (distribute-handle).

   A direct-manipulation grip on the zone's MAIN-AXIS end edge (right
   for row/grid, bottom for stack). Drag it along the main axis to
   cycle the zone's distribution: start → center → end → space-between
   → space-around, with travel resistance (~24px per stop) and a live
   badge. Complements the discrete Distribute buttons (it's the Figma-
   style "grab the edge and redistribute" gesture, and exposes the
   space-around value the buttons omit).

   Container-level ONLY: it writes setZoneLayout({ justify }) — the
   same token the resolver already maps per-DS and the exporter already
   forwards. No coordinate, no per-block offset (the moat boundary).
   ══════════════════════════════════════════════════════════ */

export const JUSTIFY_STOPS = ["start", "center", "end", "space-between", "space-around"] as const;
export type JustifyStop = (typeof JUSTIFY_STOPS)[number];

const PX_PER_JUSTIFY_STEP = 24;

/** Map a drag distance (px along the main axis) from a starting stop index to
    a justify value, clamped to the range. */
export function justifyFromDrag(startIndex: number, deltaPx: number): JustifyStop {
  const i = Math.max(0, Math.min(JUSTIFY_STOPS.length - 1, startIndex + Math.round(deltaPx / PX_PER_JUSTIFY_STEP)));
  return JUSTIFY_STOPS[i];
}

const LABELS: Record<JustifyStop, string> = {
  start: "Start",
  center: "Center",
  end: "End",
  "space-between": "Space between",
  "space-around": "Space around",
};
export function justifyLabel(v: JustifyStop): string {
  return LABELS[v];
}

export function JustifyHandle({ zoneId, zoneLayout }: { zoneId: ZoneId; zoneLayout: ZoneLayout }) {
  const setZoneLayout = useBuilder((s) => s.setZoneLayout);
  const vertical = zoneLayout.mode === "stack"; // stack's main axis is vertical
  const current = (zoneLayout.justify ?? "start") as JustifyStop;
  const [dragging, setDragging] = React.useState(false);
  const cleanupRef = React.useRef<(() => void) | null>(null);
  React.useEffect(() => () => cleanupRef.current?.(), []); // tidy listeners on unmount

  /* `start` is the default — clear it (undefined) so saved projects stay lean
     and back-compatible, mirroring the inspector + the Distribute buttons. */
  const commit = (v: JustifyStop) => {
    if (v !== current) setZoneLayout(zoneId, { justify: v === "start" ? undefined : (v as LayoutJustify) });
  };

  /* Drag tracking lives on `window` (not pointer capture): the grip is small,
     so the pointer leaves it on the first move. Window listeners track the
     whole gesture regardless of what's under the cursor. We dedupe locally so
     each token boundary commits once. */
  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startCoord = vertical ? e.clientY : e.clientX;
    const startIndex = JUSTIFY_STOPS.indexOf(current);
    let last = current;
    setDragging(true);
    const move = (ev: PointerEvent) => {
      const v = justifyFromDrag(startIndex, (vertical ? ev.clientY : ev.clientX) - startCoord);
      if (v !== last) { last = v; setZoneLayout(zoneId, { justify: v === "start" ? undefined : (v as LayoutJustify) }); }
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      cleanupRef.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    cleanupRef.current = up;
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = JUSTIFY_STOPS.indexOf(current);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); commit(JUSTIFY_STOPS[Math.min(JUSTIFY_STOPS.length - 1, i + 1)]); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); commit(JUSTIFY_STOPS[Math.max(0, i - 1)]); }
  };

  return (
    <div
      className={`zone-justify-handle${vertical ? " is-vertical" : " is-horizontal"}${dragging ? " is-dragging" : ""}`}
      role="slider"
      tabIndex={0}
      aria-label="Distribute items"
      aria-valuetext={justifyLabel(current)}
      title={`Distribute: ${justifyLabel(current)} — drag or arrow keys`}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    >
      <span className="zone-justify-grip" aria-hidden="true" />
      {dragging && <span className="zone-justify-badge" aria-hidden="true">{justifyLabel(current)}</span>}
    </div>
  );
}
