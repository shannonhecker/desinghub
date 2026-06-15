"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ZoneId, LayoutProps, LayoutWidth } from "@/store/useBuilder";
import { useBuilder, findBlockInTree } from "@/store/useBuilder";
import { computeSiblingSnap, type SiblingCandidate } from "@/lib/siblingSnap";
import { useInspectorPin } from "@/store/useInspectorPin";
import { usePreviewReadOnly } from "./previewReadOnly";
import { ACCENT_KEY_BY_DS, ACCENT_VAR_BY_DS } from "@/data/_shared/accentPresets";
import { ResizeHUD } from "./ResizeHUD";
import { HoverInspector } from "./HoverInspector";

/* Snap points (percent) and magnetic pull distance (px) applied
   to the experimental right-edge handle. Pull is translated to
   a percent window based on the container's current width so the
   snap feels consistent on narrow and wide zones alike. */
/* 33.333 / 66.666 (not 33 / 66) so dragging to a third emits the exact
   same width as the Inspector's ⅓ / ⅔ presets — drag and preset agree,
   and the active-preset highlight survives an on-canvas nudge. */
const SNAP_POINTS_PCT: readonly number[] = [25, 33.333, 50, 66.666, 75, 100];
const SNAP_PULL_PX = 6;
/* Hysteresis: once snapped, require the pointer to travel this
   much past the snap point before unsnapping. Matches Figma-feel
   — snap "sticks" until deliberately pulled away. */
const SNAP_RELEASE_PX = 10;

/* ════════════════════════════════════════════════════════════
   Experimental single-handle resize + HUD + snap guide
   ════════════════════════════════════════════════════════════ */

interface ExperimentalResizeProps {
  zone: ZoneId;
  blockId: string;
  /** Current width from block.layout.width — used to seed aria
     valuenow and HUD fallbacks on first drag. */
  currentWidth: LayoutWidth | undefined;
  onWidth: (width: string) => void;
  /** P3 height engine: current height token (block.layout.height) for ARIA
     seeding, and the writer the bottom + corner handles drive. When omitted
     the height handles are not rendered (back-compat / capability gate). */
  currentHeight?: LayoutWidth | undefined;
  onHeight?: (height: string) => void;
  minWidth?: number;
  maxWidth?: number;
  /** Floor / ceiling (px) for the height drag clamp. */
  minHeight?: number;
  maxHeight?: number;
  /** Zone flow mode — drives the default unit (stack → px, else %). */
  zoneMode: "stack" | "row" | "grid";
}

function ExperimentalResize({
  zone: _zone,
  blockId: _blockId,
  currentWidth,
  onWidth,
  currentHeight,
  onHeight,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
  zoneMode,
}: ExperimentalResizeProps) {
  void _zone;
  void _blockId;

  /* Active unit during interaction. Can flip mid-drag via the
     HUD's unit toggle or window-level P / % keys. */
  const defaultUnit: "px" | "%" = zoneMode === "stack" ? "px" : "%";
  const [unit, setUnit] = useState<"px" | "%">(defaultUnit);

  /* Drag state: live width in px + containerWidth for % conversion. */
  const [dragState, setDragState] = useState<{
    widthPx: number;
    containerWidth: number;
    containerRect: DOMRect;
    snapPct: number | null;
    /* Active sibling smart-guide lines (viewport x) — one per aligned
       reference. Empty when the edge isn't snapped to a sibling. */
    siblingGuides: { pos: number }[];
  } | null>(null);

  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [liveMessage, setLiveMessage] = useState<string>("");

  /* ── P3 height drag state ── separate from width so a corner drag can run
     both simultaneously without one clobbering the other's start baseline.
     Height is always px in this phase (single-box height has no meaningful
     percentage parent), so the HUD shows px. */
  const [heightDrag, setHeightDrag] = useState<{ heightPx: number } | null>(null);
  const heightStartRef = useRef<{ y: number; startHeight: number } | null>(null);
  const keyboardHeightRef = useRef<number | null>(null);
  const keyboardHeightResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRef = useRef<{ x: number; startWidth: number; containerWidth: number; containerRect: DOMRect } | null>(null);

  /* Direct refs on the block + container so we can re-sample
     getBoundingClientRect() on scroll/resize without doing a
     closest() traversal every frame (P0-2). */
  const blockElRef = useRef<HTMLElement | null>(null);
  const containerElRef = useRef<HTMLElement | null>(null);

  /* Running width for keyboard interactions (P0-1). We keep a
     px value that represents the last committed width so that
     successive arrow keys don't each re-measure a pre-drag
     rect — especially important when currentWidth is a token
     like "fill" / "auto" / "50%" that may not round-trip through
     the resolver. Reset after ~300ms of keyboard inactivity so a
     fresh keyboard interaction re-seeds from currentWidth. */
  const keyboardWidthRef = useRef<number | null>(null);
  const keyboardResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Snap hysteresis state (P0-3): once we snap to a point, require
     the pointer to move further away than the capture threshold
     before unsnapping. Prevents the 1–2px jitter band. */
  const isSnappedRef = useRef<boolean>(false);
  const lastSnapPctRef = useRef<number | null>(null);

  /* Sibling smart-guide state (P7). Candidates (sibling edge/center
     viewport-x) are sampled once at pointer-down; blockLeft anchors
     the moving right edge; the snapped/lastPos refs carry the same
     hysteresis the percent snap uses, scoped to sibling lines. */
  const siblingCandidatesRef = useRef<SiblingCandidate[]>([]);
  const blockLeftRef = useRef<number>(0);
  const siblingSnappedRef = useRef<boolean>(false);
  const lastSiblingPosRef = useRef<number | null>(null);

  /* Seed unit from current width on mount / when the block
     changes so the HUD shows a sensible unit from the first
     pointer-down. */
  useEffect(() => {
    if (typeof currentWidth === "string") {
      if (currentWidth.endsWith("px")) {
        setUnit("px");
        return;
      }
      if (currentWidth.endsWith("%")) {
        setUnit("%");
        return;
      }
    }
    if (typeof currentWidth === "number") setUnit("px");
  }, [currentWidth]);

  /* Helper — compute width for emit + nearest-snap magnetic pull.
     P0-3: add hysteresis so once snapped, the pointer has to
     travel past a wider release threshold before the snap breaks
     (matches Figma feel — snap "sticks" until deliberately pulled
     away). Also emits the exact snap percent when snapped so the
     guide label never disagrees with the width (33.333… stays
     33.333 rather than rounding to 33). */
  const applyWidth = useCallback(
    (rawPx: number, containerWidth: number, activeUnit: "px" | "%") => {
      const minPx = minWidth ?? 80;
      const maxPx = maxWidth ?? containerWidth;
      let nextPx = Math.max(minPx, Math.min(maxPx, rawPx));

      /* Find the nearest snap point (in %) and the px offset to it. */
      const pctRaw = (nextPx / containerWidth) * 100;
      let nearestPct = SNAP_POINTS_PCT[0];
      let bestDelta = Math.abs(pctRaw - nearestPct);
      for (const p of SNAP_POINTS_PCT) {
        const d = Math.abs(pctRaw - p);
        if (d < bestDelta) {
          bestDelta = d;
          nearestPct = p;
        }
      }

      /* Convert thresholds to % windows so magnetic pull feels
         the same on any container width. Capture at SNAP_PULL_PX
         (6), release at SNAP_RELEASE_PX (10) — hysteresis gap. */
      const capturePct = (SNAP_PULL_PX / containerWidth) * 100;
      const releasePct = (SNAP_RELEASE_PX / containerWidth) * 100;

      let snappedPct: number | null = null;
      const alreadySnapped =
        isSnappedRef.current && lastSnapPctRef.current !== null;
      const nearSameSnap =
        alreadySnapped && lastSnapPctRef.current === nearestPct;

      /* Decide whether we're currently inside a snap zone. If the
         previous frame was snapped to THIS snap point, use the
         wider release zone; otherwise use the tighter capture
         zone. This prevents oscillation at the boundary. */
      const threshold = nearSameSnap ? releasePct : capturePct;
      if (bestDelta <= threshold) {
        snappedPct = nearestPct;
        /* Use the exact snap-point px so the guide and emitted
           width agree. */
        nextPx = Math.max(minPx, Math.min(maxPx, (nearestPct / 100) * containerWidth));
      }

      /* Commit the snap state for the next call. */
      isSnappedRef.current = snappedPct !== null;
      lastSnapPctRef.current = snappedPct;

      /* When snapped, emit the EXACT snap-point value — otherwise
         33.333% would round to 33 and disagree with the snap
         guide label. Unsnapped: normal round to nearest integer. */
      let widthString: string;
      if (activeUnit === "px") {
        widthString = `${Math.round(nextPx)}px`;
      } else if (snappedPct !== null) {
        /* Emit trimmed exact percent (e.g. "33.333333%") — strip
           trailing zeros / decimal point for tidy output. */
        const exact = snappedPct.toString();
        widthString = `${exact}%`;
      } else {
        widthString = `${Math.round((nextPx / containerWidth) * 100)}%`;
      }

      return { nextPx, widthString, snapPct: snappedPct, nearestPct };
    },
    [minWidth, maxWidth],
  );

  /* Resolve a LayoutWidth token to a concrete px value given a
     container width. Used to seed keyboardWidthRef on the first
     arrow key so the baseline is correct for tokens like "fill" /
     "auto" / "50%" that don't round-trip cleanly through the
     resolver. */
  const resolveWidthToPx = useCallback(
    (width: LayoutWidth | undefined, containerWidth: number, measuredPx: number): number => {
      if (typeof width === "number") return width;
      if (typeof width === "string") {
        if (width.endsWith("px")) {
          const n = parseFloat(width);
          return Number.isFinite(n) ? n : measuredPx;
        }
        if (width.endsWith("%")) {
          const n = parseFloat(width);
          return Number.isFinite(n) ? (n / 100) * containerWidth : measuredPx;
        }
        /* "fill", "auto", "Nfr" — fall back to the measured px so
           the first keystroke produces a delta consistent with the
           visible rendering. */
        return measuredPx;
      }
      return measuredPx;
    },
    [],
  );

  /* ── Pointer drag ── */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const blockEl = (e.currentTarget as HTMLElement).closest(".canvas-block") as HTMLElement | null;
      const wrapperEl = blockEl?.parentElement as HTMLElement | null;
      const containerEl = wrapperEl?.closest(".zone-drop-container") as HTMLElement | null;
      const startWidth = wrapperEl?.getBoundingClientRect().width ?? 240;
      const containerWidth = containerEl?.clientWidth ?? 720;
      const containerRect = containerEl?.getBoundingClientRect() ?? new DOMRect(0, 0, containerWidth, 0);

      /* Cache refs so scroll/resize listeners can re-sample
         without traversing the DOM every time (P0-2). */
      blockElRef.current = blockEl;
      containerElRef.current = containerEl;

      /* Reset snap hysteresis at the start of each drag so we
         don't carry state across separate interactions (P0-3). */
      isSnappedRef.current = false;
      lastSnapPctRef.current = null;

      /* P7: sample sibling snap-lines once at pointer-down (mirrors
         MarqueeLayer's rect sweep). Each sibling in this zone offers
         its left edge, center, and right edge as candidates the
         resized right edge can align to. Sampled once — siblings to
         the right may reflow as this block grows, same as Figma's
         gesture-start sampling. */
      const zoneAttr = blockEl?.getAttribute("data-zone");
      const selfId = blockEl?.getAttribute("data-block-id");
      const cands: SiblingCandidate[] = [];
      if (containerEl && zoneAttr) {
        containerEl
          .querySelectorAll<HTMLElement>(`[data-block-id][data-zone="${zoneAttr}"]`)
          .forEach((el) => {
            const sid = el.getAttribute("data-block-id");
            if (!sid || sid === selfId) return;
            const r = el.getBoundingClientRect();
            cands.push({ pos: r.left, kind: "edge", siblingId: sid });
            cands.push({ pos: r.left + r.width / 2, kind: "center", siblingId: sid });
            cands.push({ pos: r.right, kind: "edge", siblingId: sid });
          });
      }
      siblingCandidatesRef.current = cands;
      blockLeftRef.current = blockEl?.getBoundingClientRect().left ?? 0;
      siblingSnappedRef.current = false;
      lastSiblingPosRef.current = null;

      startRef.current = { x: e.clientX, startWidth, containerWidth, containerRect };
      setDragState({ widthPx: startWidth, containerWidth, containerRect, snapPct: null, siblingGuides: [] });
      setAnchorRect(blockEl?.getBoundingClientRect() ?? null);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current) return;
      const { x: startX, startWidth, containerWidth, containerRect } = startRef.current;
      const delta = e.clientX - startX;
      const rawPx = startWidth + delta;

      const { nextPx, widthString, snapPct } = applyWidth(rawPx, containerWidth, unit);

      /* P7 sibling smart-guide layer — POINTER ONLY. applyWidth is
         reused by keyboard arrow-resize, which must stay precise, so
         the sibling magnetism lives here, never inside applyWidth. If
         the resized right edge lands within pull of a sibling line it
         wins over the percent grid and we draw a guide per coincident
         reference. */
      let finalPx = nextPx;
      let finalWidthString = widthString;
      let finalSnapPct = snapPct;
      let siblingGuides: { pos: number }[] = [];
      const cands = siblingCandidatesRef.current;
      if (cands.length > 0) {
        const edgeX = blockLeftRef.current + nextPx;
        const snap = computeSiblingSnap({
          edge: edgeX,
          candidates: cands,
          wasSnapped: siblingSnappedRef.current,
          lastSnapPos: lastSiblingPosRef.current,
        });
        if (snap.snappedPos !== null) {
          const desiredPx = snap.snappedPos - blockLeftRef.current;
          const minPx = minWidth ?? 80;
          const maxPx = maxWidth ?? containerWidth;
          /* Only honour the sibling snap if the block can actually
             reach that width — otherwise the guide would lie. */
          if (desiredPx >= minPx && desiredPx <= maxPx) {
            finalPx = desiredPx;
            finalWidthString =
              unit === "px"
                ? `${Math.round(desiredPx)}px`
                : `${Math.round((desiredPx / containerWidth) * 100)}%`;
            finalSnapPct = null; /* one guide system at a time — hide the % line */
            siblingGuides = snap.guides.map((g) => ({ pos: g.pos }));
          }
        }
        siblingSnappedRef.current = snap.snappedPos !== null;
        lastSiblingPosRef.current = snap.snappedPos;
      }

      onWidth(finalWidthString);

      setDragState({ widthPx: finalPx, containerWidth, containerRect, snapPct: finalSnapPct, siblingGuides });

      /* Update the anchor rect so HUD tracks the resized block's
         new top-right corner. Prefer the cached ref over closest(). */
      const blockEl = blockElRef.current
        ?? ((e.currentTarget as HTMLElement).closest(".canvas-block") as HTMLElement | null);
      setAnchorRect(blockEl?.getBoundingClientRect() ?? null);
    },
    [applyWidth, onWidth, unit, minWidth, maxWidth],
  );

  const handlePointerUp = useCallback(() => {
    startRef.current = null;
    setDragState(null);
    /* Keep anchorRect briefly so HUD can fade — simpler to just
       clear it immediately; HUD unmounts. */
    setAnchorRect(null);
    /* Clear the cached DOM refs to avoid holding detached nodes. */
    blockElRef.current = null;
    containerElRef.current = null;
    /* Reset snap hysteresis so the next drag starts fresh (P0-3). */
    isSnappedRef.current = false;
    lastSnapPctRef.current = null;
    /* Reset sibling smart-guide state too (P7). */
    siblingCandidatesRef.current = [];
    siblingSnappedRef.current = false;
    lastSiblingPosRef.current = null;
    /* Reset keyboard baseline so the next keyboard interaction
       re-seeds from the now-committed currentWidth (P0-1). */
    keyboardWidthRef.current = null;
  }, []);

  /* ── P3 height drag (bottom handle) ── px-based vertical resize that
     reuses the same min/max clamp + HUD machinery as width. Snap is
     intentionally not applied to height in this phase (Figma height-snap is
     content/sibling based — out of scope; bottom + corner is enough here). */
  const clampHeight = useCallback(
    (rawPx: number): number => {
      const minPx = minHeight ?? 40;
      const maxPx = maxHeight ?? 4000;
      return Math.max(minPx, Math.min(maxPx, rawPx));
    },
    [minHeight, maxHeight],
  );

  const handleHeightPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const blockEl = (e.currentTarget as HTMLElement).closest(".canvas-block") as HTMLElement | null;
      const wrapperEl = blockEl?.parentElement as HTMLElement | null;
      const startHeight = wrapperEl?.getBoundingClientRect().height ?? 120;
      blockElRef.current = blockEl;
      heightStartRef.current = { y: e.clientY, startHeight };
      setHeightDrag({ heightPx: startHeight });
      setAnchorRect(blockEl?.getBoundingClientRect() ?? null);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  const handleHeightPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!heightStartRef.current || !onHeight) return;
      const { y: startY, startHeight } = heightStartRef.current;
      const nextPx = clampHeight(startHeight + (e.clientY - startY));
      onHeight(`${Math.round(nextPx)}px`);
      setHeightDrag({ heightPx: nextPx });
      const blockEl = blockElRef.current
        ?? ((e.currentTarget as HTMLElement).closest(".canvas-block") as HTMLElement | null);
      setAnchorRect(blockEl?.getBoundingClientRect() ?? null);
    },
    [clampHeight, onHeight],
  );

  const handleHeightPointerUp = useCallback(() => {
    heightStartRef.current = null;
    setHeightDrag(null);
    setAnchorRect(null);
    blockElRef.current = null;
    keyboardHeightRef.current = null;
  }, []);

  /* ── P3 corner drag (bottom-right) ── runs BOTH the width X-math (with snap)
     and the height Y-math at once, so dragging the corner resizes both axes
     like Figma. Reuses applyWidth + clampHeight; no new math. */
  const handleCornerPointerDown = useCallback(
    (e: React.PointerEvent) => {
      handlePointerDown(e);
      // seed the height baseline too
      const blockEl = (e.currentTarget as HTMLElement).closest(".canvas-block") as HTMLElement | null;
      const wrapperEl = blockEl?.parentElement as HTMLElement | null;
      const startHeight = wrapperEl?.getBoundingClientRect().height ?? 120;
      heightStartRef.current = { y: e.clientY, startHeight };
      setHeightDrag({ heightPx: startHeight });
    },
    [handlePointerDown],
  );

  const handleCornerPointerMove = useCallback(
    (e: React.PointerEvent) => {
      handlePointerMove(e);
      if (heightStartRef.current && onHeight) {
        const { y: startY, startHeight } = heightStartRef.current;
        const nextPx = clampHeight(startHeight + (e.clientY - startY));
        onHeight(`${Math.round(nextPx)}px`);
        setHeightDrag({ heightPx: nextPx });
      }
    },
    [handlePointerMove, clampHeight, onHeight],
  );

  const handleCornerPointerUp = useCallback(() => {
    handlePointerUp();
    handleHeightPointerUp();
  }, [handlePointerUp, handleHeightPointerUp]);

  /* ── P3 height keyboard (bottom handle slider) ── ArrowUp / ArrowDown step
     the px height; Shift = 1px fine step. Mirrors the width keyboard path. */
  const handleHeightKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      if (!onHeight) return;
      e.preventDefault();
      const handleEl = e.currentTarget;
      const blockEl = handleEl.closest(".canvas-block") as HTMLElement | null;
      const wrapperEl = blockEl?.parentElement as HTMLElement | null;
      const measuredPx = wrapperEl?.getBoundingClientRect().height ?? 120;
      if (keyboardHeightRef.current === null) {
        keyboardHeightRef.current =
          typeof currentHeight === "number"
            ? currentHeight
            : typeof currentHeight === "string" && currentHeight.endsWith("px")
              ? parseFloat(currentHeight) || measuredPx
              : measuredPx;
      }
      const sign = e.key === "ArrowDown" ? 1 : -1;
      const step = e.shiftKey ? 1 : 8;
      const nextPx = clampHeight(keyboardHeightRef.current + sign * step);
      onHeight(`${Math.round(nextPx)}px`);
      keyboardHeightRef.current = nextPx;
      if (keyboardHeightResetTimerRef.current) clearTimeout(keyboardHeightResetTimerRef.current);
      keyboardHeightResetTimerRef.current = setTimeout(() => {
        keyboardHeightRef.current = null;
        keyboardHeightResetTimerRef.current = null;
      }, 300);
      setLiveMessage(`Height ${Math.round(nextPx)} pixels`);
    },
    [onHeight, clampHeight, currentHeight],
  );

  /* P0-2: During an active drag, re-sample the anchor rect and
     containerRect whenever the window scrolls or resizes. Using
     capture:true on scroll catches nested scroll containers too
     (the builder canvas often lives inside a scrolling panel).
     Listeners tear down when the drag ends. */
  useEffect(() => {
    if (!dragState) return;

    const resample = () => {
      const blockEl = blockElRef.current;
      const containerEl = containerElRef.current;

      if (blockEl) {
        setAnchorRect(blockEl.getBoundingClientRect());
      }

      if (containerEl && startRef.current) {
        const containerRect = containerEl.getBoundingClientRect();
        const containerWidth = containerEl.clientWidth;
        /* Update the source-of-truth containerRect in both
           startRef (used by handlers) and dragState (used for the
           snap guide portal). */
        startRef.current = {
          ...startRef.current,
          containerRect,
          containerWidth,
        };
        setDragState((prev) =>
          prev ? { ...prev, containerRect, containerWidth } : prev,
        );
      }
    };

    window.addEventListener("scroll", resample, true);
    window.addEventListener("resize", resample);
    return () => {
      window.removeEventListener("scroll", resample, true);
      window.removeEventListener("resize", resample);
    };
  }, [dragState]);

  /* ── Keyboard resize (slider role) ──
     P0-1: Seed a running width ref from currentWidth on the first
     keystroke (or after the debounce window elapses), then
     advance the ref with each committed delta. This fixes drift
     for tokens like "fill" / "auto" / "50%" where re-measuring
     the wrapper each keystroke doesn't round-trip. */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

      e.preventDefault();

      const handleEl = e.currentTarget;
      const blockEl = handleEl.closest(".canvas-block") as HTMLElement | null;
      const wrapperEl = blockEl?.parentElement as HTMLElement | null;
      const containerEl = wrapperEl?.closest(".zone-drop-container") as HTMLElement | null;
      const measuredPx = wrapperEl?.getBoundingClientRect().width ?? 240;
      const containerWidth = containerEl?.clientWidth ?? 720;

      /* Seed the running width ref if we don't have one yet. */
      if (keyboardWidthRef.current === null) {
        keyboardWidthRef.current = resolveWidthToPx(
          currentWidth,
          containerWidth,
          measuredPx,
        );
      }
      const startWidth = keyboardWidthRef.current;

      const sign = e.key === "ArrowRight" ? 1 : -1;

      /* Step sizes:
         - Default: 8px or 2% (depending on active unit)
         - Shift:   1px or 0.5%
         - Alt:     0.5% (always %) */
      let deltaPx: number;
      let stepUnit: "px" | "%" = unit;
      if (e.altKey) {
        stepUnit = "%";
        deltaPx = (0.5 / 100) * containerWidth;
      } else if (e.shiftKey) {
        deltaPx = unit === "px" ? 1 : (0.5 / 100) * containerWidth;
      } else {
        deltaPx = unit === "px" ? 8 : (2 / 100) * containerWidth;
      }

      const nextRaw = startWidth + sign * deltaPx;
      const { nextPx, widthString } = applyWidth(nextRaw, containerWidth, stepUnit);
      onWidth(widthString);

      /* Advance the running baseline with the clamped/snapped
         result so the next keystroke builds on the committed
         width, not a stale measurement. */
      keyboardWidthRef.current = nextPx;

      /* Debounce-reset the baseline after ~300ms of no keypress
         so a fresh interaction re-seeds from currentWidth
         (handles external edits between keystrokes). */
      if (keyboardResetTimerRef.current) {
        clearTimeout(keyboardResetTimerRef.current);
      }
      keyboardResetTimerRef.current = setTimeout(() => {
        keyboardWidthRef.current = null;
        keyboardResetTimerRef.current = null;
      }, 300);

      /* Announce the actual committed width (post-clamp, post-snap)
         so the SR announcement aligns with aria-valuenow + visual. */
      const announced = stepUnit === "px"
        ? `Width ${Math.round(nextPx)} pixels`
        : `Width ${Math.round((nextPx / containerWidth) * 100)} percent`;
      setLiveMessage(announced);
    },
    [applyWidth, onWidth, unit, currentWidth, resolveWidthToPx],
  );

  /* Clean up the keyboard debounce timers on unmount. */
  useEffect(() => {
    return () => {
      if (keyboardResetTimerRef.current) {
        clearTimeout(keyboardResetTimerRef.current);
        keyboardResetTimerRef.current = null;
      }
      if (keyboardHeightResetTimerRef.current) {
        clearTimeout(keyboardHeightResetTimerRef.current);
        keyboardHeightResetTimerRef.current = null;
      }
    };
  }, []);

  /* Compute aria-valuenow + valuetext from the current width token.
     Falls back to 100 / full-width when no explicit width is set. */
  const { valueNow, valueText, valueMin, valueMax } = (() => {
    /* Prefer a percent-based readout — it's the most portable
       announcement regardless of container width. */
    if (typeof currentWidth === "string") {
      if (currentWidth.endsWith("%")) {
        const n = parseFloat(currentWidth);
        return {
          valueNow: Number.isFinite(n) ? Math.round(n) : 100,
          valueText: `${Math.round(Number.isFinite(n) ? n : 100)} percent`,
          valueMin: 10,
          valueMax: 100,
        };
      }
      if (currentWidth.endsWith("px")) {
        const n = parseFloat(currentWidth);
        return {
          valueNow: Number.isFinite(n) ? Math.round(n) : 240,
          valueText: `${Math.round(Number.isFinite(n) ? n : 240)} pixels`,
          valueMin: minWidth ?? 80,
          valueMax: maxWidth ?? 2000,
        };
      }
    }
    if (typeof currentWidth === "number") {
      return {
        valueNow: Math.round(currentWidth),
        valueText: `${Math.round(currentWidth)} pixels`,
        valueMin: minWidth ?? 80,
        valueMax: maxWidth ?? 2000,
      };
    }
    /* fill / auto / undefined → report 100% */
    return { valueNow: 100, valueText: "100 percent", valueMin: 10, valueMax: 100 };
  })();

  /* HUD value (live during drag, derived from dragState). */
  const hudValue = dragState
    ? unit === "px"
      ? dragState.widthPx
      : (dragState.widthPx / dragState.containerWidth) * 100
    : valueNow;

  /* Snap guide info — only rendered during drag. */
  const snapGuide = dragState ? (() => {
    const rect = dragState.containerRect;
    const nearestPct = (() => {
      const pctRaw = (dragState.widthPx / dragState.containerWidth) * 100;
      let n = SNAP_POINTS_PCT[0];
      let best = Math.abs(pctRaw - n);
      for (const p of SNAP_POINTS_PCT) {
        const d = Math.abs(pctRaw - p);
        if (d < best) {
          best = d;
          n = p;
        }
      }
      return n;
    })();
    const x = rect.left + (nearestPct / 100) * rect.width;
    const snapped = dragState.snapPct === nearestPct;
    return { x, top: rect.top, height: rect.height, pct: nearestPct, snapped };
  })() : null;

  /* ── P3 height ARIA + HUD ── height is reported in px (the only sensible
     readout for a single-box height). undefined / auto / fill → report the
     live drag value or a 120px fallback. */
  const heightAria = (() => {
    if (typeof currentHeight === "number") return Math.round(currentHeight);
    if (typeof currentHeight === "string" && currentHeight.endsWith("px")) {
      const n = parseFloat(currentHeight);
      return Number.isFinite(n) ? Math.round(n) : 120;
    }
    return 120;
  })();
  const heightHudValue = heightDrag ? heightDrag.heightPx : heightAria;

  return (
    <>
      {/* Single right-edge handle. role="slider" for a11y. */}
      <div
        className="block-resize-handle block-resize-handle--experimental"
        role="slider"
        tabIndex={0}
        aria-orientation="horizontal"
        aria-label="Resize width"
        aria-valuemin={valueMin}
        aria-valuemax={valueMax}
        aria-valuenow={valueNow}
        aria-valuetext={valueText}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        title="Drag or use arrow keys to resize"
      >
        <div className="block-resize-grip" />
      </div>

      {/* P3: bottom-edge handle drives height. role="slider", vertical
          orientation. Only rendered when the parent wired onHeight. */}
      {onHeight && (
        <div
          className="block-resize-handle block-resize-handle--experimental block-resize-handle--bottom"
          role="slider"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label="Resize height"
          aria-valuemin={minHeight ?? 40}
          aria-valuemax={maxHeight ?? 4000}
          aria-valuenow={heightAria}
          aria-valuetext={`${heightAria} pixels`}
          onPointerDown={handleHeightPointerDown}
          onPointerMove={handleHeightPointerMove}
          onPointerUp={handleHeightPointerUp}
          onPointerCancel={handleHeightPointerUp}
          onKeyDown={handleHeightKeyDown}
          title="Drag or use up/down arrow keys to resize height"
        >
          <div className="block-resize-grip block-resize-grip--horizontal" />
        </div>
      )}

      {/* P3: bottom-right corner handle drives BOTH width + height at once. */}
      {onHeight && (
        <div
          className="block-resize-corner block-resize-corner--experimental"
          role="slider"
          tabIndex={0}
          aria-label="Resize width and height"
          aria-valuenow={heightAria}
          aria-valuetext={`${valueText}, ${heightAria} pixels`}
          onPointerDown={handleCornerPointerDown}
          onPointerMove={handleCornerPointerMove}
          onPointerUp={handleCornerPointerUp}
          onPointerCancel={handleCornerPointerUp}
          title="Drag to resize width and height"
        >
          <div className="block-resize-grip-corner" />
        </div>
      )}

      {/* Screen-reader live region for keyboard resize announcements. */}
      <span className="bc-sr-only" role="status" aria-live="polite">{liveMessage}</span>

      {/* HUD overlay for height / corner drag — px readout. */}
      {(heightDrag) && typeof document !== "undefined" && createPortal(
        <ResizeHUD
          value={heightHudValue}
          unit="px"
          onUnitChange={() => { /* height is px-only in P3 */ }}
          anchorRect={anchorRect}
          min={minHeight ?? 40}
          max={maxHeight ?? 4000}
        />,
        document.body,
      )}

      {/* HUD overlay — only during drag. Portalled to body so it
         escapes any overflow:hidden ancestor. */}
      {dragState && typeof document !== "undefined" && createPortal(
        <ResizeHUD
          value={hudValue}
          unit={unit}
          onUnitChange={setUnit}
          anchorRect={anchorRect}
          min={valueMin}
          max={valueMax}
        />,
        document.body,
      )}

      {/* Snap guide — only during drag. Portalled to body so it
         sits on top of everything else. */}
      {snapGuide && typeof document !== "undefined" && createPortal(
        <div
          className={`bc-snap-guide${snapGuide.snapped ? " is-snapped" : ""}`}
          style={{
            position: "fixed",
            left: snapGuide.x,
            top: snapGuide.top,
            height: snapGuide.height,
          }}
          aria-hidden="true"
        >
          <span className="bc-snap-guide__label">{`${snapGuide.pct}%`}</span>
        </div>,
        document.body,
      )}

      {/* P7 sibling smart-guides — one magenta line per aligned
          reference. Portalled to body so they sit above everything,
          spanning the zone container's vertical extent. */}
      {dragState && dragState.siblingGuides.length > 0 && typeof document !== "undefined" && createPortal(
        <>
          {dragState.siblingGuides.map((g, i) => (
            <div
              key={i}
              className="bc-sibling-guide"
              style={{
                position: "fixed",
                left: g.pos,
                top: dragState.containerRect.top,
                height: dragState.containerRect.height,
              }}
              aria-hidden="true"
            />
          ))}
        </>,
        document.body,
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════════ */

interface SortableBlockProps {
  id: string;
  zone?: ZoneId;
  /** When this block is a child of a LayoutGroup, the parent
     group's id. The drag-end handler reads this off the sortable
     data payload to route reorders into the correct children
     array instead of the body zone. */
  parentGroupId?: string;
  compact?: boolean;
  isSelected?: boolean;
  /** New layout-system hook. Writes a width string
     ("{N}px" / "{N}%") directly to the block's layout.width. */
  onWidthChange?: (width: string) => void;
  /** P3 height engine hook. Writes a height string ("{N}px") to the block's
     layout.height. When provided, the bottom + corner resize handles render. */
  onHeightChange?: (height: string) => void;
  /** Passed through to the resize handles to clamp during drag. */
  layoutHints?: Pick<LayoutProps, "minWidth" | "maxWidth" | "minHeight" | "maxHeight">;
  /** Current width token from block.layout.width — only consumed
     by the experimental flow (ARIA + HUD seeding). */
  currentWidth?: LayoutWidth;
  /** Current height token from block.layout.height — ARIA + HUD seeding. */
  currentHeight?: LayoutWidth;
  onSwapClick?: () => void;
  onRemove?: () => void;
  children: React.ReactNode;
}

export function SortableBlock({
  id,
  zone,
  parentGroupId,
  compact,
  isSelected,
  onWidthChange,
  onHeightChange,
  layoutHints,
  currentWidth,
  currentHeight,
  onSwapClick,
  onRemove,
  children,
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({ id, data: { zone, parentGroupId } });

  const zoneLayouts = useBuilder((s) => s.zoneLayouts);
  const zoneMode = zone ? (zoneLayouts[zone]?.mode ?? "row") : "row";
  const selectedBlockIds = useBuilder((s) => s.selectedBlockIds);
  const primarySelectedId = useBuilder((s) => s.selectedBlockId);
  const toggleBlockSelection = useBuilder((s) => s.toggleBlockSelection);
  const openBlockContextMenu = useBuilder((s) => s.openBlockContextMenu);
  const setSelection = useBuilder((s) => s.setSelection);

  /* Issue #13: per-block accent override. Look the block up in the
     store (zone + id). If it has its own `colorOverrides.<accentKey>`,
     scope the per-DS accent CSS var on this block's subtree so the
     rendered DS component picks up the local hex instead of global. */
  const designSystemForAccent = useBuilder((s) => s.designSystem);
  const blockOverrideAccent = useBuilder((s) => {
    if (!zone) return undefined;
    const arr = zone === "body" ? s.blocks
      : zone === "header" ? s.headerBlocks
      : zone === "sidebar" ? s.sidebarBlocks
      : s.footerBlocks;
    /* C-1 fix: recurse so blocks inside LayoutGroup are reachable. */
    const found = findBlockInTree(arr, id);
    if (!found?.colorOverrides) return undefined;
    return found.colorOverrides[ACCENT_KEY_BY_DS[s.designSystem]];
  });

  /* Secondary highlight: block is in the multi-selection but isn't
     the primary inspector focus. Dashed outline via CSS. */
  const isSecondarySelected =
    !!zone &&
    selectedBlockIds.includes(id) &&
    primarySelectedId !== id;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    /* Issue #13: per-block accent override scopes the per-DS accent
       CSS var to this block's subtree. Without this property, the
       block inherits the global var from :root. */
    ...(blockOverrideAccent
      ? ({ [ACCENT_VAR_BY_DS[designSystemForAccent]]: blockOverrideAccent } as React.CSSProperties)
      : {}),
  };

  /* Issue #80: one-shot pulse on the drag handle when a block first
     mounts, so a brand-new block teaches the affordance. Class is
     applied for 600ms then removed. CSS keyframe respects
     prefers-reduced-motion (no animation if user prefers it). */
  const [isNewlyMounted, setIsNewlyMounted] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setIsNewlyMounted(false), 600);
    return () => window.clearTimeout(t);
  }, []);

  /* Block element ref forwarded to dnd-kit via setNodeRef. */
  const setRefs = useCallback(
    (el: HTMLElement | null) => {
      setNodeRef(el);
    },
    [setNodeRef],
  );

  const cls = [
    "canvas-block",
    "sortable-block",
    isDragging && "is-dragging",
    isSelected && "is-selected",
    isSecondarySelected && "is-selected-multi",
    compact && "zone-block-compact",
    "canvas-block--experimental",
    isNewlyMounted && "is-newly-mounted",
    /* Drop indicator: show when another item is being sorted and this item is shifting */
    isSorting && !isDragging && "is-sorting-peer",
  ]
    .filter(Boolean)
    .join(" ");

  /* Shift-click: toggle membership of this block in the multi-
     selection. Runs in capture phase so it wins over the parent's
     onClick + stopPropagation. */
  const handleClickCapture = (e: React.MouseEvent) => {
    if (!zone || readOnly) return;
    if (!e.shiftKey) return;
    e.stopPropagation();
    e.preventDefault();
    toggleBlockSelection(id, zone);
  };

  /* ── Hover-inspector pointer + click wiring (E2) ──
     Pointer enter/leave drives useInspectorPin's hovered state;
     plain click pins the block. We intentionally DO NOT call
     preventDefault on the click so rendered block content (links,
     buttons in the preview) can still fire their own handlers.
     Sidebar zone is excluded — PR #167 keeps the rail chrome-free,
     and Phase E1 + HoverInspector both bail out on that zone. */
  const setInspectorHover = useInspectorPin((s) => s.setHover);
  const pinInspector = useInspectorPin((s) => s.pin);
  /* Read-only (Preview / Present / ?preview=1): suppress every editor
     affordance — selection, multi-select, inspector-pin, context menu —
     per the previewReadOnly contract. Editable canvas → context default false. */
  const readOnly = usePreviewReadOnly();

  const handlePointerEnter = () => {
    if (!zone || zone === "sidebar") return;
    setInspectorHover(id);
  };
  const handlePointerLeave = () => {
    if (!zone || zone === "sidebar") return;
    setInspectorHover(null);
  };
  const handleClick = (e: React.MouseEvent) => {
    if (!zone || zone === "sidebar" || readOnly) return;
    /* Shift-click is consumed by handleClickCapture already. */
    if (e.shiftKey) return;
    pinInspector(id);
  };

  /* Right-click: open the context menu at cursor. If this block
     isn't already in the current selection, replace selection with
     just this block so menu actions target what the user clicked. */
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!zone || readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    if (!selectedBlockIds.includes(id)) {
      setSelection([id], zone);
    }
    openBlockContextMenu(id, zone, e.clientX, e.clientY);
  };

  /* Parse minWidth/maxWidth hints (strings) to px for the drag
     clamp. Percent/fraction hints aren't converted here - we
     only clamp when a concrete px value is provided. */
  const minPx = typeof layoutHints?.minWidth === "string" && layoutHints.minWidth.endsWith("px")
    ? parseFloat(layoutHints.minWidth)
    : typeof layoutHints?.minWidth === "number" ? layoutHints.minWidth : undefined;
  const maxPx = typeof layoutHints?.maxWidth === "string" && layoutHints.maxWidth.endsWith("px")
    ? parseFloat(layoutHints.maxWidth)
    : typeof layoutHints?.maxWidth === "number" ? layoutHints.maxWidth : undefined;
  /* Height clamp hints (px) — parsed the same way as width. */
  const minHPx = typeof layoutHints?.minHeight === "string" && layoutHints.minHeight.endsWith("px")
    ? parseFloat(layoutHints.minHeight)
    : typeof layoutHints?.minHeight === "number" ? layoutHints.minHeight : undefined;
  const maxHPx = typeof layoutHints?.maxHeight === "string" && layoutHints.maxHeight.endsWith("px")
    ? parseFloat(layoutHints.maxHeight)
    : typeof layoutHints?.maxHeight === "number" ? layoutHints.maxHeight : undefined;

  const handleWidthChange = (w: string) => onWidthChange?.(w);
  const handleHeightChange = (h: string) => onHeightChange?.(h);

  const resizable = !!onWidthChange && !compact && !!zone;

  return (
    <div
      ref={setRefs}
      style={style}
      className={cls}
      data-block-id={id}
      data-zone={zone}
      onClickCapture={handleClickCapture}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onContextMenu={handleContextMenu}
      {...attributes}
    >
      {/* Drop-between indicator line */}
      {isSorting && !isDragging && (
        <div className="block-drop-indicator" />
      )}

      {/* Hover-inspector (Phase E2): replaces the always-on handle /
          remove / swap chrome. Renders nothing unless this block is
          hovered (after HOVER_DELAY_MS) or pinned. Bails out in
          Preview mode + on the sidebar zone for the same reasons
          the old per-block chrome did. Drag activator is forwarded
          so dnd-kit still owns the gesture. */}
      <HoverInspector
        blockId={id}
        zone={zone}
        dragHandleRef={setActivatorNodeRef}
        dragListeners={listeners as Record<string, unknown> | undefined}
        isNewlyMounted={isNewlyMounted}
        onRemove={onRemove}
        onSwapClick={!compact ? onSwapClick : undefined}
      />

      {/* Width is edited in the Inspector's Layout section (the unified
          Width control). The on-canvas SizeChipRail was retired in
          Phase 2; on-canvas drag-resize remains via ExperimentalResize. */}
      {children}

      {/* On-canvas resize: single right-edge handle + HUD + snap guide.
          Issue #8: gated on `isSelected` so idle / hovered blocks don't
          render the handle (matches the chip-rail's visibility). */}
      {isSelected && resizable && zone && (
        <ExperimentalResize
          zone={zone}
          blockId={id}
          currentWidth={currentWidth}
          onWidth={handleWidthChange}
          currentHeight={currentHeight}
          onHeight={onHeightChange ? handleHeightChange : undefined}
          minWidth={minPx}
          maxWidth={maxPx}
          minHeight={minHPx}
          maxHeight={maxHPx}
          zoneMode={zoneMode}
        />
      )}
    </div>
  );
}

