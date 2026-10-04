"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Highcharts from "highcharts";
import type HighchartsReact from "highcharts-react-official";
import {
  backToLive as liveSpan, boxSpans, clampTime, followFeed, FULL_VIEW, isAwayFromLive, isFullView, keyAction,
  panPrice, panTime, scalePrice, scaleTime, wheelFactor, ZOOM_STEP, zoomPrice, zoomTime,
  type PriceLimits, type Span, type TimeBounds, type Viewport,
} from "@/lib/chartViewport";

/* ══════════════════════════════════════════════════════════
   useChartNavigation - the FX Execution chart's own viewport.

   Wheel, drag, pinch, axis drags, double-click, box zoom, press and hold,
   keys and the rail's buttons all move ONE local viewport (a time span and
   a price span; null is the full view). It lives here, in refs, and is
   applied to the drawn chart directly: it is never report state, never
   saved, shared or exported, and a gesture never re-renders the page. The
   React state below changes only when something the rail shows flips
   (zoomed, away from the latest bar, box zoom armed, value pinned).

   Live only while presenting (`enabled`): in Edit no listener is attached,
   so the builder's own select, move and resize gestures are untouched.

   The boundary for the feed (applyFeedView) and later PRs: `holdTime`,
   `viewport()`, `setViewport()`, `reset()`, the status and the actions.
   ══════════════════════════════════════════════════════════ */

/** The fewest bars a view shows. */
export const MIN_BARS = 5;
/** A price view no narrower than a pip. */
const MIN_PRICE_SPAN = 0.0001;
/** Press this long without moving to pin the values. */
export const HOLD_DELAY = 450;
/** Movement (CSS pixels) that turns a press into a drag. */
const DRAG_SLOP = 4;
/** A box zoom smaller than this (pixels a side) is a click, not a box. */
const BOX_SLOP = 8;
/** Pixels of an axis drag that scale it by e. */
const AXIS_DRAG_SCALE = 300;
/** How far below the plot the time axis's labels reach. */
const TIME_AXIS_BAND = 28;
const HINT_KEY = "uoaui:fx-hold-hint";

export interface NavigationStatus {
  /** Not the full view on some axis. */
  zoomed: boolean;
  /** The latest bar is off screen: the feed's new bars are not in view. */
  away: boolean;
  boxArmed: boolean;
  /** Press and hold is showing the values under the pointer. */
  pinned: boolean;
  /** The one-time "press and hold" hint. */
  hint: boolean;
  /** The view is a Go to window, untouched since (the range chips show it). */
  custom: boolean;
}

export interface ChartNavigation {
  status: NavigationStatus;
  zoomIn(): void;
  zoomOut(): void;
  /** The full view on both axes, following the feed. */
  reset(): void;
  /** Same zoom, the latest bar in view, the price axis automatic. */
  backToLive(): void;
  toggleBoxZoom(): void;
  /** Show a span of bar positions (Go to); the status says `custom` until the view is moved. */
  showSpan(span: Span): void;
  dismissHint(): void;
  /** The plot wrapper's keys (arrows, plus, minus, Page Up / Down, 0, Home, End, Escape). */
  onKeyDown(e: React.KeyboardEvent<HTMLElement>): void;
  /** For applyFeedView: the time extremes to hold when the last bar moves
   *  from `before` to `after`, or null to leave the axis to the walk-in step. */
  holdTime(before: number, after: number): Span | null;
  /** The current viewport (a copy). */
  viewport(): Viewport;
  setViewport(v: Viewport): void;
}

interface Options {
  chartRef: React.RefObject<HighchartsReact.RefObject | null>;
  plotRef: React.RefObject<HTMLElement | null>;
  /** Presenting (or a shared preview) with the chart showing. */
  enabled: boolean;
  /** Changes when bar positions change meaning (order, interval, range): the viewport resets. */
  viewKey: string;
  /** Changes when the chart was rebuilt: the viewport is applied again. */
  build: unknown;
  /** The time axis's right end (bars plus walk-in room). */
  axisMax: () => number;
  /** Position of the latest bar. */
  lastBar: () => number;
  /** The box zoom rectangle's colour. */
  accent: string;
}

type Region = "plot" | "price" | "time" | null;
type Drag =
  | { mode: "press"; x: number; y: number; span: Span; price: Span; yManual: boolean; id: number }
  | { mode: "pan"; x: number; y: number; span: Span; price: Span; yManual: boolean; id: number }
  | { mode: "inspect"; id: number }
  | { mode: "price-scale"; y: number; price: Span; id: number }
  | { mode: "time-scale"; x: number; span: Span; id: number }
  | { mode: "box"; x: number; y: number; ex: number; ey: number; id: number }
  | { mode: "pinch"; span: Span; dist: number; anchor: number };

const readHint = (): boolean => {
  try { return typeof window !== "undefined" && window.localStorage.getItem(HINT_KEY) === null; } catch { return false; }
};
const storeHint = () => {
  try { window.localStorage.setItem(HINT_KEY, "1"); } catch { /* storage blocked: the hint shows again next visit */ }
};

export function useChartNavigation(o: Options): ChartNavigation {
  const vp = useRef<Viewport>({ ...FULL_VIEW });
  const [status, setStatusState] = useState<NavigationStatus>({ zoomed: false, away: false, boxArmed: false, pinned: false, hint: false, custom: false });
  const statusRef = useRef(status);
  const setStatus = useCallback((patch: Partial<NavigationStatus>) => {
    const next = { ...statusRef.current, ...patch };
    const s = statusRef.current;
    if (next.zoomed === s.zoomed && next.away === s.away && next.boxArmed === s.boxArmed && next.pinned === s.pinned && next.hint === s.hint && next.custom === s.custom) return;
    statusRef.current = next;
    setStatusState(next);
  }, []);
  /* The latest options, for listeners attached once. */
  const opts = useRef(o);
  useLayoutEffect(() => { opts.current = o; });
  const hintSeen = useRef(false);

  const chart = (): Highcharts.Chart | null => opts.current.chartRef.current?.chart ?? null;
  const timeBounds = (): TimeBounds => ({ min: -0.5, max: opts.current.axisMax(), minSpan: MIN_BARS });
  const priceLimits = (c: Highcharts.Chart): PriceLimits => {
    const e = c.yAxis[1]?.getExtremes();
    const range = e && Number.isFinite(e.dataMax) && Number.isFinite(e.dataMin) ? e.dataMax - e.dataMin : 0;
    return { minSpan: MIN_PRICE_SPAN, maxSpan: Math.max(0.01, range * 10) };
  };
  /** What the axes show now (the automatic extremes for a full-view axis). */
  const shown = (c: Highcharts.Chart): { x: Span; y: Span } => {
    const x = c.xAxis[0].getExtremes();
    const y = c.yAxis[1].getExtremes();
    return { x: vp.current.x ?? { min: x.min, max: x.max }, y: vp.current.y ?? { min: y.min, max: y.max } };
  };

  /** Put the viewport on the drawn chart, in one redraw. */
  const apply = useCallback((next: Viewport, redraw = true, custom = false) => {
    vp.current = { x: next.x ? { ...next.x } : null, y: next.y ? { ...next.y } : null };
    const c = chart();
    if (c) {
      const x = c.xAxis[0];
      const y = c.yAxis[1];
      if (next.x) x.setExtremes(next.x.min, next.x.max, false, false);
      else {
        const max = opts.current.axisMax();
        if (x.options.max !== max) x.update({ max }, false);
        x.setExtremes(undefined, undefined, false, false);
      }
      if (y) y.setExtremes(next.y?.min, next.y?.max, false, false);
      if (redraw) c.redraw(false);
    }
    /* What is on screen, on the plot element (tests and later PRs read it):
       "min,max" per axis, absent for the full view. */
    const el = opts.current.plotRef.current;
    if (el) {
      const put = (key: "viewX" | "viewY", span: Span | null) => { if (span) el.dataset[key] = spanText(span); else delete el.dataset[key]; };
      put("viewX", vp.current.x);
      put("viewY", vp.current.y);
    }
    const away = isAwayFromLive(vp.current.x, opts.current.lastBar());
    setStatus({ zoomed: !isFullView(vp.current), away, custom });
    if (!isFullView(vp.current) && !hintSeen.current) {
      hintSeen.current = true;
      if (readHint()) setStatus({ hint: true });
    }
  }, [setStatus]);

  /* Bar positions change meaning: start from the full view. */
  const lastKey = useRef(o.viewKey);
  useEffect(() => {
    if (lastKey.current !== o.viewKey) {
      lastKey.current = o.viewKey;
      vp.current = { ...FULL_VIEW };
      const el = opts.current.plotRef.current;
      if (el) { delete el.dataset.viewX; delete el.dataset.viewY; }
      setStatus({ zoomed: false, away: false, custom: false });
    }
  }, [o.viewKey, setStatus]);
  /* A rebuilt chart (theme, overlays, chart type, a feed reset) keeps the
     reader's view, kept inside the bars it now has. In Edit: the full view. */
  useEffect(() => {
    if (!o.enabled) {
      if (!isFullView(vp.current)) apply({ ...FULL_VIEW });
      setStatus({ boxArmed: false, pinned: false });
      return;
    }
    if (isFullView(vp.current)) return;
    apply({ x: vp.current.x ? clampTime(vp.current.x, timeBounds()) : null, y: vp.current.y }, true, statusRef.current.custom);
  }, [o.build, o.enabled, apply, setStatus]);

  const zoomBy = useCallback((factor: number, axis: "time" | "price") => {
    const c = chart();
    if (!c) return;
    const now = shown(c);
    if (axis === "price") {
      const centre = (now.y.min + now.y.max) / 2;
      apply({ x: vp.current.x, y: zoomPrice(now.y, centre, factor, priceLimits(c)) });
      return;
    }
    /* Following the feed, the latest bar stays put; otherwise the centre. */
    const last = opts.current.lastBar();
    const anchor = isAwayFromLive(vp.current.x, last) ? (now.x.min + now.x.max) / 2 : Math.min(now.x.max, last + 0.5);
    apply({ x: zoomTime(vp.current.x, anchor, factor, timeBounds()), y: vp.current.y });
  }, [apply]);

  const reset = useCallback(() => { apply({ ...FULL_VIEW }); }, [apply]);
  const backToLive = useCallback(() => { apply({ x: liveSpan(vp.current.x, timeBounds()), y: null }); },
    [apply]);
  const boxArmed = useRef(false);
  const toggleBoxZoom = useCallback(() => {
    boxArmed.current = !boxArmed.current;
    setStatus({ boxArmed: boxArmed.current });
  }, [setStatus]);
  const disarmBox = useCallback(() => { boxArmed.current = false; setStatus({ boxArmed: false }); }, [setStatus]);
  const dismissHint = useCallback(() => { storeHint(); setStatus({ hint: false }); }, [setStatus]);

  /* ── Pointer, wheel and double-click on the plot (Present only) ── */
  useEffect(() => {
    const el = o.plotRef.current;
    if (!o.enabled || !el) return;
    let drag: Drag | null = null;
    let hold: ReturnType<typeof setTimeout> | null = null;
    let box: Highcharts.SVGElement | null = null;
    let swallowClick = false;
    const touches = new Map<number, { x: number; y: number }>();

    const norm = (e: MouseEvent | PointerEvent, c: Highcharts.Chart) => {
      /* The page may have scrolled or the frame zoomed since the last event. */
      (c.pointer as unknown as { chartPosition?: unknown }).chartPosition = undefined;
      return c.pointer.normalize(e);
    };
    const regionOf = (c: Highcharts.Chart, x: number, y: number): Region => {
      const inX = x >= c.plotLeft && x <= c.plotLeft + c.plotWidth;
      const priceBottom = c.plotTop + (c.yAxis[1]?.len ?? c.plotHeight);
      if (x > c.plotLeft + c.plotWidth && y >= c.plotTop && y <= priceBottom) return "price";
      if (inX && y > c.plotTop + c.plotHeight && y <= c.plotTop + c.plotHeight + TIME_AXIS_BAND) return "time";
      if (inX && y >= c.plotTop && y <= c.plotTop + c.plotHeight) return "plot";
      return null;
    };
    const setRegion = (r: Region | "grab" | "box") => {
      const v = r ?? "";
      if (el.dataset.navRegion !== v) el.dataset.navRegion = v;
    };
    const clearHold = () => { if (hold) { clearTimeout(hold); hold = null; } };
    const inspect = (c: Highcharts.Chart, e: PointerEvent) => {
      const ev = norm(e, c);
      const points = c.series
        .filter((s) => s.visible && (s.options as { enableMouseTracking?: boolean }).enableMouseTracking !== false && s.points?.length)
        .map((s) => s.searchPoint(ev as unknown as Highcharts.PointerEventObject, true))
        .filter((p): p is Highcharts.Point => Boolean(p));
      if (!points.length) return;
      c.tooltip.refresh(points);
      c.xAxis[0].drawCrosshair(ev as unknown as Highcharts.PointerEventObject, points[0]);
    };
    const endInspect = (c: Highcharts.Chart | null) => {
      c?.tooltip.hide(0);
      c?.xAxis[0]?.hideCrosshair();
      setStatus({ pinned: false });
    };

    const onPointerDown = (e: PointerEvent) => {
      const c = chart();
      if (!c || e.button !== 0) return;
      const p = norm(e, c);
      const region = regionOf(c, p.chartX, p.chartY);
      if (!region) return;
      if (e.pointerType === "touch") {
        touches.set(e.pointerId, { x: p.chartX, y: p.chartY });
        if (touches.size === 2 && region !== null) {
          /* Two fingers: pinch to zoom time around their middle. */
          clearHold();
          if (drag?.mode === "inspect") endInspect(c);
          const [a, b] = [...touches.values()];
          const now = shown(c);
          drag = { mode: "pinch", span: now.x, dist: Math.max(1, Math.abs(a.x - b.x)), anchor: c.xAxis[0].toValue((a.x + b.x) / 2) };
          return;
        }
        if (touches.size > 2) return;
      }
      const now = shown(c);
      if (region === "price") {
        drag = { mode: "price-scale", y: p.chartY, price: now.y, id: e.pointerId };
      } else if (region === "time") {
        drag = { mode: "time-scale", x: p.chartX, span: now.x, id: e.pointerId };
      } else if (boxArmed.current) {
        drag = { mode: "box", x: p.chartX, y: p.chartY, ex: p.chartX, ey: p.chartY, id: e.pointerId };
      } else {
        drag = { mode: "press", x: p.chartX, y: p.chartY, span: now.x, price: now.y, yManual: vp.current.y !== null, id: e.pointerId };
        clearHold();
        hold = setTimeout(() => {
          if (drag?.mode !== "press") return;
          drag = { mode: "inspect", id: drag.id };
          setRegion("plot");
          setStatus({ pinned: true });
          if (statusRef.current.hint) dismissHint();
          inspect(c, e);
        }, HOLD_DELAY);
      }
      if (drag.mode !== "press") e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch { /* the pointer is already gone */ }
    };

    const onPointerMove = (e: PointerEvent) => {
      const c = chart();
      if (!c) return;
      const p = norm(e, c);
      if (e.pointerType === "touch" && touches.has(e.pointerId)) touches.set(e.pointerId, { x: p.chartX, y: p.chartY });
      if (!drag) {
        if (e.pointerType === "mouse") setRegion(boxArmed.current && regionOf(c, p.chartX, p.chartY) === "plot" ? "box" : regionOf(c, p.chartX, p.chartY));
        return;
      }
      if (drag.mode === "pinch") {
        if (touches.size < 2) return;
        const [a, b] = [...touches.values()];
        const dist = Math.max(1, Math.abs(a.x - b.x));
        const span = zoomTime(drag.span, drag.anchor, drag.dist / dist, timeBounds());
        apply({ x: span, y: vp.current.y });
        return;
      }
      if ("id" in drag && drag.id !== e.pointerId) return;
      if (drag.mode === "inspect") { inspect(c, e); return; }
      if (drag.mode === "press") {
        if (Math.abs(p.chartX - drag.x) + Math.abs(p.chartY - drag.y) < DRAG_SLOP) return;
        clearHold();
        drag = { ...drag, mode: "pan" };
        setRegion("grab");
      }
      e.preventDefault();
      swallowClick = true;
      el.dataset.dragging = "";
      if (drag.mode === "pan") {
        const perPx = (drag.span.max - drag.span.min) / c.plotWidth;
        const x = panTime(drag.span, (drag.x - p.chartX) * perPx, timeBounds());
        /* Vertically too, once the price scale is manual (not on touch: a
           vertical swipe scrolls the page). */
        let y = vp.current.y;
        if (drag.yManual && e.pointerType !== "touch") {
          const yPerPx = (drag.price.max - drag.price.min) / (c.yAxis[1]?.len ?? c.plotHeight);
          y = panPrice(drag.price, (p.chartY - drag.y) * yPerPx);
        }
        apply({ x: clampTime(x, timeBounds()), y });
      } else if (drag.mode === "price-scale") {
        apply({ x: vp.current.x, y: scalePrice(drag.price, Math.exp((p.chartY - drag.y) / AXIS_DRAG_SCALE), priceLimits(c)) });
      } else if (drag.mode === "time-scale") {
        apply({ x: scaleTime(drag.span, Math.exp(-(p.chartX - drag.x) / AXIS_DRAG_SCALE), timeBounds()), y: vp.current.y });
      } else if (drag.mode === "box") {
        const ex = Math.min(Math.max(p.chartX, c.plotLeft), c.plotLeft + c.plotWidth);
        const ey = Math.min(Math.max(p.chartY, c.plotTop), c.plotTop + (c.yAxis[1]?.len ?? c.plotHeight));
        drag = { ...drag, ex, ey };
        const rect = { x: Math.min(drag.x, ex), y: Math.min(drag.y, ey), width: Math.abs(ex - drag.x), height: Math.abs(ey - drag.y) };
        if (!box) {
          box = c.renderer.rect(rect.x, rect.y, rect.width, rect.height, 2)
            .attr({ fill: alpha(opts.current.accent, 0.1), stroke: alpha(opts.current.accent, 0.55), "stroke-width": 1, dashstyle: "ShortDash", zIndex: 10 })
            .addClass("dh-exec-box")
            .add();
        } else box.attr(rect);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      touches.delete(e.pointerId);
      clearHold();
      const c = chart();
      const d = drag;
      if (d?.mode === "pinch") { if (touches.size < 2) drag = null; return; }
      if (!d || ("id" in d && d.id !== e.pointerId)) return;
      drag = null;
      delete el.dataset.dragging;
      try { el.releasePointerCapture(e.pointerId); } catch { /* not captured */ }
      setRegion(null);
      if (d.mode === "inspect") { endInspect(c); return; }
      if (d.mode === "box") {
        box?.destroy();
        box = null;
        if (c && e.type === "pointerup" && Math.abs(d.ex - d.x) > BOX_SLOP && Math.abs(d.ey - d.y) > BOX_SLOP) {
          const x = c.xAxis[0];
          const y = c.yAxis[1];
          apply(boxSpans({ x: x.toValue(d.x), y: y.toValue(d.y) }, { x: x.toValue(d.ex), y: y.toValue(d.ey) }, timeBounds(), priceLimits(c)));
          swallowClick = true;
        }
        /* One box, then the tool switches itself off. */
        disarmBox();
      }
    };

    /* A drag must not also click a fill (which selects its venue). */
    const onClickCapture = (e: MouseEvent) => {
      if (!swallowClick) return;
      swallowClick = false;
      e.stopPropagation();
      e.preventDefault();
    };
    const onPointerDownReset = () => { swallowClick = false; };

    const onWheel = (e: WheelEvent) => {
      const c = chart();
      if (!c) return;
      const p = norm(e, c);
      const region = regionOf(c, p.chartX, p.chartY);
      /* Off the plot and its axes the page scrolls as usual. */
      if (!region) return;
      e.preventDefault();
      const now = shown(c);
      if (region === "price") {
        apply({ x: vp.current.x, y: zoomPrice(now.y, c.yAxis[1].toValue(p.chartY), wheelFactor(e.deltaY, e.deltaMode), priceLimits(c)) });
        return;
      }
      /* A sideways swipe (a trackpad) pans time. */
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        const perPx = (now.x.max - now.x.min) / c.plotWidth;
        if (vp.current.x || e.deltaX < 0) apply({ x: clampTime(panTime(now.x, e.deltaX * perPx, timeBounds()), timeBounds()), y: vp.current.y });
        return;
      }
      apply({ x: zoomTime(vp.current.x, c.xAxis[0].toValue(p.chartX), wheelFactor(e.deltaY, e.deltaMode), timeBounds()), y: vp.current.y });
    };

    const onDoubleClick = (e: MouseEvent) => {
      const c = chart();
      if (!c) return;
      const p = norm(e, c);
      const region = regionOf(c, p.chartX, p.chartY);
      if (region === "price") apply({ x: vp.current.x, y: null });
      else if (region) apply({ ...FULL_VIEW });
    };

    const onLeave = () => { if (!drag) setRegion(null); };

    el.addEventListener("pointerdown", onPointerDownReset, true);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("click", onClickCapture, true);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("dblclick", onDoubleClick);
    return () => {
      clearHold();
      box?.destroy();
      el.removeEventListener("pointerdown", onPointerDownReset, true);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("click", onClickCapture, true);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("dblclick", onDoubleClick);
      delete el.dataset.navRegion;
    };
  }, [o.enabled, o.plotRef, apply, disarmBox, dismissHint, setStatus]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    if (!opts.current.enabled || e.target !== e.currentTarget || e.altKey || e.ctrlKey || e.metaKey) return;
    /* Escape cancels the box zoom tool, and only that (not Present). */
    if (e.key === "Escape" && boxArmed.current) { e.preventDefault(); e.stopPropagation(); disarmBox(); return; }
    const action = keyAction(e.key, e.shiftKey);
    const c = chart();
    if (!action || !c) return;
    e.preventDefault();
    const now = shown(c);
    switch (action.kind) {
      case "panTime": {
        if (!vp.current.x && action.by > 0) return;
        apply({ x: clampTime(panTime(now.x, action.by * (now.x.max - now.x.min), timeBounds()), timeBounds()), y: vp.current.y });
        return;
      }
      case "panPrice": apply({ x: vp.current.x, y: panPrice(now.y, action.by * (now.y.max - now.y.min)) }); return;
      case "zoom": zoomBy(action.in ? 1 / ZOOM_STEP : ZOOM_STEP, action.axis); return;
      case "reset": reset(); return;
      case "live": backToLive(); return;
    }
  }, [apply, backToLive, disarmBox, reset, zoomBy]);

  const holdTime = useCallback((before: number, after: number): Span | null => {
    if (!vp.current.x) return null;
    const next = followFeed(vp.current.x, before, after);
    vp.current = { ...vp.current, x: next };
    const el = opts.current.plotRef.current;
    if (el && next) el.dataset.viewX = spanText(next);
    return next;
  }, []);

  return {
    status,
    zoomIn: useCallback(() => zoomBy(1 / ZOOM_STEP, "time"), [zoomBy]),
    zoomOut: useCallback(() => zoomBy(ZOOM_STEP, "time"), [zoomBy]),
    reset,
    backToLive,
    toggleBoxZoom,
    showSpan: useCallback((span: Span) => apply({ x: clampTime(span, timeBounds()), y: null }, true, true),
      [apply]),
    dismissHint,
    onKeyDown,
    holdTime,
    viewport: useCallback(() => ({ x: vp.current.x ? { ...vp.current.x } : null, y: vp.current.y ? { ...vp.current.y } : null }), []),
    setViewport: apply,
  };
}

/** A span as "min,max" (six decimals: enough for a price). */
function spanText(s: Span): string {
  return `${Math.round(s.min * 1e6) / 1e6},${Math.round(s.max * 1e6) / 1e6}`;
}

/** A colour at an opacity, for the box zoom rectangle. */
function alpha(color: string, opacity: number): string {
  return Highcharts.color(color).setOpacity(opacity).get("rgba") as string;
}
