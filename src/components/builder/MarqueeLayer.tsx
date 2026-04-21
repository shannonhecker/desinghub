"use client";

import React, { useRef, useState, useCallback } from "react";
import { useBuilder, type ZoneId } from "@/store/useBuilder";

/* ══════════════════════════════════════════════════════════
   MarqueeLayer — rubber-band rectangle-select for canvas blocks.

   Drop one inside a zone's scroll container. On mousedown on the
   layer itself (never on a child block), it starts tracking and
   renders a positioned rect until mouseup. On release, it walks
   every `[data-block-id][data-zone=X]` element inside the zone,
   intersects each bounding rect with the marquee rect, and calls
   setSelection with the matching ids.

   The layer's children render normally — only the empty-canvas
   gutter triggers marquee drag. Right-click, modifier keys, or
   touch are ignored so DndKit keeps priority on blocks.
   ══════════════════════════════════════════════════════════ */

interface MarqueeLayerProps {
  zone: ZoneId;
  children: React.ReactNode;
  className?: string;
}

interface MarqueeBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

const MIN_DRAG_PX = 4;

export function MarqueeLayer({ zone, children, className }: MarqueeLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const setSelection = useBuilder((s) => s.setSelection);
  const clearSelection = useBuilder((s) => s.clearSelection);

  const [marquee, setMarquee] = useState<MarqueeBounds | null>(null);
  const dragStart = useRef<{ x: number; y: number; containerX: number; containerY: number } | null>(null);

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      /* Left-click only, no modifier — let shift/meta clicks through to
         block selection handlers. */
      if (e.button !== 0) return;
      if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
      /* Only start if the mousedown lands on empty canvas — anywhere
         outside a block. Walk ancestors looking for [data-block-id];
         if we find one, the click is on a block and DndKit's pointer
         sensor should win. */
      const targetEl = e.target as HTMLElement;
      if (targetEl.closest("[data-block-id]")) return;
      /* Also bail if the click is on an interactive control (drag
         handle, drop-zone hint, etc.) that sits in the canvas
         chrome but isn't a block. */
      if (targetEl.closest("button, input, textarea, [role='button']")) return;

      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        containerX: rect.left,
        containerY: rect.top,
      };
      /* Don't commit to a marquee rect until the pointer has moved a
         few pixels — avoids stray rectangles on single clicks. */

      const onMove = (ev: MouseEvent) => {
        const start = dragStart.current;
        if (!start) return;
        const dx = ev.clientX - start.x;
        const dy = ev.clientY - start.y;
        if (Math.abs(dx) < MIN_DRAG_PX && Math.abs(dy) < MIN_DRAG_PX && !marquee) return;
        const left = Math.min(start.x, ev.clientX) - start.containerX;
        const top = Math.min(start.y, ev.clientY) - start.containerY;
        const width = Math.abs(dx);
        const height = Math.abs(dy);
        setMarquee({ left, top, width, height });
      };

      const onUp = (ev: MouseEvent) => {
        const start = dragStart.current;
        dragStart.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("keydown", onKey);

        /* Viewport-space marquee rect. */
        const left = Math.min(start!.x, ev.clientX);
        const top = Math.min(start!.y, ev.clientY);
        const right = Math.max(start!.x, ev.clientX);
        const bottom = Math.max(start!.y, ev.clientY);
        const dragged = right - left >= MIN_DRAG_PX || bottom - top >= MIN_DRAG_PX;

        setMarquee(null);

        if (!dragged) {
          /* A click on empty canvas clears selection — matches Figma. */
          clearSelection();
          return;
        }

        const container = containerRef.current;
        if (!container) return;
        const candidates = container.querySelectorAll<HTMLElement>(
          `[data-block-id][data-zone="${zone}"]`,
        );
        const ids: string[] = [];
        candidates.forEach((el) => {
          const r = el.getBoundingClientRect();
          /* Standard AABB intersect — ignore blocks entirely outside
             the marquee. Any overlap counts. */
          if (r.right < left || r.left > right || r.bottom < top || r.top > bottom) return;
          const id = el.getAttribute("data-block-id");
          if (id) ids.push(id);
        });
        if (ids.length > 0) {
          setSelection(ids, zone);
        } else {
          clearSelection();
        }
      };

      const onKey = (ev: KeyboardEvent) => {
        if (ev.key === "Escape") {
          dragStart.current = null;
          setMarquee(null);
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("mouseup", onUp);
          window.removeEventListener("keydown", onKey);
        }
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      window.addEventListener("keydown", onKey);
    },
    [zone, setSelection, clearSelection, marquee],
  );

  return (
    <div
      ref={containerRef}
      className={`marquee-layer-container${className ? " " + className : ""}`}
      onMouseDown={onMouseDown}
      style={{ position: "relative" }}
    >
      {children}
      {marquee && (
        <div
          className="marquee-rect"
          style={{
            left: marquee.left,
            top: marquee.top,
            width: marquee.width,
            height: marquee.height,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
