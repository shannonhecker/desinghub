/* ════════════════════════════════════════════════════════════
   HoverInspector (Phase E2, 2026-05-29 builder UX cleanup)
   ════════════════════════════════════════════════════════════
   Replaces the always-on per-block chrome (handle / remove /
   swap visible on every block at all times) with a hover-
   activated inspector pattern. Lifted from the Phase A research
   memo (Pattern 2 + Pattern 3: hover-revealed chrome with
   click-to-pin, Lovable convention).

   Visual states:
     idle    : nothing rendered. Block has no outline.
     hover   : 1px dashed outline (--bc-border). Inspector
               controls fade in after HOVER_DELAY_MS so
               passing-by mouse movement doesn't strobe the
               chrome.
     pinned  : 2px solid outline (--builder-selection-color)
               + 4 corner badges. Inspector controls visible.

   Behaviour:
     - Mounted as a CHILD of SortableBlock. The wrapping
       SortableBlock attaches pointerenter/leave + click that
       feeds useInspectorPin.
     - Renders nothing if the block is neither hovered NOR
       pinned.
     - Renders nothing if [data-builder-mode="preview"] is
       active on the root (Phase E1 takes precedence). Read
       directly from usePreviewMode for a sub-render gate
       rather than relying on CSS cascade alone — saves the
       portalled badges / outline DOM in Preview mode.
     - prefers-reduced-motion: reveal is instant. The 80ms
       delay is bypassed via a media-query listener. The
       fade-in transition is gated by --bc-duration-fast
       which is already 0ms under the global reduce-motion
       rule in chrome-tokens.css.
     - Pinned + Esc + click-outside handled by BuilderApp's
       window-level listener — this component only emits the
       chrome.

   Tokens (no raw hex / no new visuals):
     --bc-border             : hover outline
     --builder-selection-*   : pinned outline + ring
     --bc-bg-raised          : inspector control surface
     --bc-fg / --bc-fg-muted : control color
     --bc-radius-xs / -sm    : 3px / 6px max (anti-slop rule)
     --bc-duration-fast      : 120ms (reduce-motion → 0)
   ════════════════════════════════════════════════════════════ */

"use client";

import React, { useEffect, useRef, useState } from "react";
import type { ZoneId } from "@/store/useBuilder";
import { useInspectorPin } from "@/store/useInspectorPin";
import { usePreviewMode } from "@/store/usePreviewMode";

/* Hover-reveal delay. Phase A research pinned this at the
   Lovable convention (~80ms): long enough that flicking the
   pointer across stacked blocks doesn't strobe; short enough
   that intentional hover feels immediate. Exported as a named
   constant so the structural test (and any future tuning) has
   a stable handle. */
export const HOVER_DELAY_MS = 80;

interface HoverInspectorProps {
  blockId: string;
  zone: ZoneId | undefined;
  /** Drag activator element ref + listeners — passed through
     from useSortable on the host SortableBlock so the handle
     remains a real dnd-kit activator. */
  dragHandleRef?: (el: HTMLElement | null) => void;
  dragListeners?: Record<string, unknown>;
  isNewlyMounted?: boolean;
  onSwapClick?: () => void;
  onRemove?: () => void;
}

export function HoverInspector({
  blockId,
  zone,
  dragHandleRef,
  dragListeners,
  isNewlyMounted,
  onSwapClick,
  onRemove,
}: HoverInspectorProps) {
  const mode = usePreviewMode((s) => s.mode);
  const hoveredBlockId = useInspectorPin((s) => s.hoveredBlockId);
  const pinnedBlockId = useInspectorPin((s) => s.pinnedBlockId);

  const isHovered = hoveredBlockId === blockId;
  const isPinned = pinnedBlockId === blockId;

  /* Reduce-motion check — instant reveal when the user opts
     out. Re-evaluated on mount + when the OS-level setting
     flips so the inspector respects live changes. */
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /* Active = the inspector chrome is currently rendered.
     Pinned beats hover (no delay on a pinned block).
     Hover applies the HOVER_DELAY_MS gate unless reduce-
     motion is on, in which case reveal is instant. */
  const [hoverActive, setHoverActive] = useState(false);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isHovered) {
      /* pointer left — kill any pending delay timer and
         drop hover-active immediately. */
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }
      setHoverActive(false);
      return;
    }

    if (reduceMotion) {
      setHoverActive(true);
      return;
    }

    delayTimerRef.current = setTimeout(() => {
      setHoverActive(true);
      delayTimerRef.current = null;
    }, HOVER_DELAY_MS);

    return () => {
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }
    };
  }, [isHovered, reduceMotion]);

  /* Preview-mode gate — nothing renders regardless of
     hover/pin state. Phase E1 takes precedence. */
  if (mode === "preview") return null;

  /* Sidebar zone gate — PR #167 stripped per-block chrome
     from the sidebar rail. Honour the same constraint here
     so a NavItem under the pointer doesn't grow inspector
     controls that would overlap the icon + label. */
  if (zone === "sidebar") return null;

  /* Render only when active (hover-after-delay OR pinned). */
  if (!hoverActive && !isPinned) return null;

  const containerClass = [
    "hover-inspector",
    isPinned ? "is-pinned" : "is-hovered",
    isNewlyMounted ? "is-newly-mounted" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClass} data-inspector-block-id={blockId} aria-hidden={!isPinned}>
      {/* Outline layer — sits behind chrome controls. Hover
          and pin emit different styling via the wrapper class
          (is-pinned vs is-hovered). */}
      <div className="hover-inspector-outline" />

      {/* Corner badges — only on the pinned state. 4 small
          markers at each corner (anti-slop rule: 1-2px sharp). */}
      {isPinned && (
        <>
          <div className="hover-inspector-corner hover-inspector-corner--tl" />
          <div className="hover-inspector-corner hover-inspector-corner--tr" />
          <div className="hover-inspector-corner hover-inspector-corner--bl" />
          <div className="hover-inspector-corner hover-inspector-corner--br" />
        </>
      )}

      {/* Inspector control rail — drag handle + remove + swap.
          Sits above the block bounds via .canvas-block-handle
          docking rules in builder.css (PR #167 A1). */}
      {dragHandleRef && (
        <div
          ref={dragHandleRef}
          className={`canvas-block-handle${isNewlyMounted ? " is-newly-mounted" : ""}`}
          {...(dragListeners ?? {})}
          title="Drag to reorder"
          role="button"
          tabIndex={0}
          aria-roledescription="sortable"
          aria-label="Drag handle"
          onClick={(e) => {
            /* Don't pin the block when clicking the drag handle —
               dnd-kit owns this gesture. */
            e.stopPropagation();
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1 }}>
            &#x2807;
          </span>
        </div>
      )}

      {onRemove && (
        <button
          className="canvas-block-remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove block"
          type="button"
        >
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
            style={{ fontSize: 14 }}
          >
            close
          </span>
        </button>
      )}

      {onSwapClick && (
        <button
          className="canvas-block-swap"
          onClick={(e) => {
            e.stopPropagation();
            onSwapClick();
          }}
          aria-label="Swap component"
          type="button"
        >
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
            style={{ fontSize: 14 }}
          >
            swap_horiz
          </span>
        </button>
      )}
    </div>
  );
}
