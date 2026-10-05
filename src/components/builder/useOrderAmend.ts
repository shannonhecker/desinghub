"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import Highcharts from "highcharts";
import type HighchartsReact from "highcharts-react-official";
import { create } from "zustand";
import { formatPrice, type ExecutionView } from "@/lib/executionModel";
import { amendLimit, canAmend, SAMPLE_CONFIRMATION, snapPrice, stagedTicket, validateAmendment, type Side } from "@/lib/executionOrders";
import type { ReportDataset } from "@/lib/reportData/types";
import type { DesignSystem } from "@/store/useBuilder";
import type { ThemeVars } from "./SimulatedHighchart";
import { layoutTags, pillColors, type ChartFrame } from "./executionChartOptions";
import { orderActions, showToast, useOrderSession } from "./useOrderSession";
import { OrderTagLayer } from "./OrderTagLayer";
import { OrderWorkflow } from "./OrderWorkflow";

/* ══════════════════════════════════════════════════════════
   useOrderAmend - the chart's order gestures, while presenting.

   Grab the working order's limit line, or its LMT tag, and drag it: a
   dashed preview with "LMT → price" follows, snapped to 0.00001; on
   release the limit series steps to it and a toast confirms (the design
   note, PR D). Drag the BID tag: release above the market stages a SELL
   take profit ticket, below a BUY limit. A tap or click on a tag opens
   its price menu. Escape cancels a drag. The keyboard does the same on
   the focused tag: arrows step the price, Enter amends (or stages), the
   menu key opens the menu.

   Prices come from the drawn axis (toValue / toPixels) at the moment of
   the gesture, so they stay right however the chart has been zoomed or
   panned. Edit is static: nothing here is mounted there.
   ══════════════════════════════════════════════════════════ */

/** How near the limit line a press grabs it (chart pixels). */
const LINE_GRAB = 6;
const PREVIEW_DASH = "6,4";
const READOUT_PAD = 4;
const READOUT_GAP = 6;
const READOUT_FONT = 11;
/** A placed order's label: its text and padding, as tall as the layout allows for. */
const PLACED_HEIGHT = 20;

export type TagKey = "limit" | "bid";
export interface TagBox { key: TagKey; price: number; top: number; left: number; width: number; height: number }
export interface TagState {
  boxes: TagBox[];
  /** The order can be amended (it is working). */
  working: boolean;
  /** The side of the order on screen. */
  side: Side | null;
  /** The prices the axis shows (a slider's min and max). */
  range: { min: number; max: number } | null;
}
/** Where the tags are drawn: the layer of buttons over them follows. */
export const useTagStore = create<TagState>(() => ({ boxes: [], working: false, side: null, range: null }));

/** What the tag layer can ask the chart to do. */
export interface OrderChartApi {
  /** Draw the drag preview for a tag at a price (null clears it). */
  preview(key: TagKey, price: number | null): void;
  /** The price under a pointer event, snapped, clamped to the plot. */
  priceAt(event: PointerEvent | React.PointerEvent): number | null;
  /** Commit a drag or a keyboard step: amend the limit, or stage a ticket. */
  commit(key: TagKey, price: number, launcher: HTMLElement | null): void;
}

interface Options {
  chartRef: React.RefObject<HighchartsReact.RefObject | null>;
  plotRef: React.RefObject<HTMLDivElement | null>;
  /** Presenting (or a shared preview): the gestures are live. */
  active: boolean;
  dataset: ReportDataset | null;
  vars: ThemeVars | null;
  palette: string[];
  system: DesignSystem;
  /** View: Table. There is no chart, so no tags to grab. */
  table?: boolean;
}

/** A colour laid over an opaque one, as one opaque colour (a glass card over
 *  the page): a label's backing must hide the lines behind it. */
function opaqueOver(color: string, under: string): string {
  const [r, g, b, a = 1] = Highcharts.color(color).rgba;
  const [ur, ug, ub] = Highcharts.color(under).rgba;
  if (![r, g, b, ur, ug, ub].every(Number.isFinite)) return under;
  const mix = (top: number, low: number) => Math.round(top * a + low * (1 - a));
  return `rgb(${mix(r, ur)}, ${mix(g, ug)}, ${mix(b, ub)})`;
}

const marketOf = (view: ExecutionView) => ({ bid: view.last?.bid ?? view.bid[view.bid.length - 1], ask: view.last?.ask ?? view.ask[view.ask.length - 1] });

/** This session's limit amendments laid over a view, while presenting
 *  (Edit shows the report as saved). Stable until an amendment is made. */
export function useSessionAmend(active: boolean): (view: ExecutionView | null) => ExecutionView | null {
  const amendments = useOrderSession((s) => s.amendments);
  return useCallback((view) => (view && active ? amendLimit(view, amendments) : view), [active, amendments]);
}

export function useOrderAmend({ chartRef, plotRef, active, dataset, vars, palette, system, table = false }: Options) {
  const placed = useOrderSession((s) => s.placed);
  const frameRef = useRef<ChartFrame | null>(null);
  const drawn = useRef<Highcharts.SVGElement[]>([]);
  const previewEls = useRef<Highcharts.SVGElement[]>([]);
  const previewState = useRef<{ key: TagKey; price: number } | null>(null);
  const env = useRef({ dataset, vars, palette, active, placed });
  useLayoutEffect(() => { env.current = { dataset, vars, palette, active, placed }; }, [dataset, vars, palette, active, placed]);

  const chart = () => chartRef.current?.chart ?? null;
  /* The axis the limit is drawn on (the price pane), asked of the series itself. */
  const priceAxis = (c: Highcharts.Chart) => (c.get("limit") as Highcharts.Series | undefined)?.yAxis ?? c.yAxis[1];

  const clearPreview = () => { previewEls.current.forEach((el) => el.destroy()); previewEls.current = []; };

  /** A read-out tag ("LMT → 1.37620") right-aligned inside the plot, just
   *  above its line, clear of the price tags in the gutter. */
  const drawPreview = useCallback((key: TagKey, price: number) => {
    const c = chart();
    const v = env.current.vars;
    clearPreview();
    if (!c || !v) return;
    const axis = priceAxis(c);
    const y = axis.toPixels(price, false);
    if (!Number.isFinite(y)) return;
    const colors = pillColors(key, v, env.current.palette);
    const left = c.plotLeft;
    const right = c.plotLeft + c.plotWidth;
    const line = c.renderer.path(["M", left, y, "L", right, y] as unknown as Highcharts.SVGPathArray)
      .attr({ stroke: colors.fill, "stroke-width": key === "bid" ? 2.5 : 1.6, dashstyle: "Dash", "stroke-dasharray": PREVIEW_DASH, zIndex: 8, class: `dh-order-preview dh-order-preview-${key}` })
      .add();
    const side = frameRef.current?.view.last ? stagedTicket(price, frameRef.current.view.last.bid) : null;
    const text = key === "limit" ? `LMT → ${formatPrice(price)}` : `${side?.side ?? "BUY"} ${side?.type === "Take profit" ? "TP" : "LMT"} ${formatPrice(price)}`;
    const label = c.renderer.label(text, right, y)
      .attr({ fill: colors.fill, r: READOUT_PAD * 2, padding: READOUT_PAD, zIndex: 10 })
      .css({ color: colors.text, fontSize: `${READOUT_FONT}px`, fontWeight: "600" })
      .addClass("dh-order-readout")
      .add();
    const box = label.getBBox();
    const top = Math.max(c.plotTop, y - box.height - READOUT_GAP / 2);
    label.attr({ x: right - box.width - READOUT_GAP, y: top });
    previewEls.current = [line, label];
    previewState.current = { key, price };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- reads the chart through refs

  /* Sample orders confirmed this session: a dashed line at each price,
     labelled "SAMPLE BUY 1.37650" at the plot's left edge. */
  const drawPlaced = (c: Highcharts.Chart, view: ExecutionView) => {
    drawn.current.forEach((el) => el.destroy());
    drawn.current = [];
    const v = env.current.vars;
    if (!v || !env.current.active) return;
    const axis = priceAxis(c);
    const top = (axis as unknown as { top: number }).top;
    const shown = env.current.placed
      .filter((p) => p.order === view.order.id)
      .map((o) => ({ o, y: axis.toPixels(o.price, false) }))
      .filter(({ y }) => Number.isFinite(y) && y >= top && y <= top + axis.len);
    /* Each label is a small tag at the plot's left edge, centred on its line
       where there is room and moved clear of its neighbours where there is
       not (the price tags' own layout, on the other edge). Its backing is
       the panel's colour, so no line runs through the words. */
    const ys = layoutTags(shown.map((s) => s.y), top, top + axis.len, PLACED_HEIGHT, 2);
    const backing = opaqueOver(v.card ?? v.surface, v.bg);
    const tone = (side: Side) => (side === "BUY" ? v.positive : v.negative);
    /* Every line first, then the labels over them. */
    for (const { o, y } of shown) {
      drawn.current.push(c.renderer.path(["M", c.plotLeft, y, "L", c.plotLeft + c.plotWidth, y] as unknown as Highcharts.SVGPathArray)
        .attr({ stroke: tone(o.side), "stroke-width": 1, "stroke-dasharray": "2,3", zIndex: 6, class: "dh-order-placed" }).add());
    }
    shown.forEach(({ o }, i) => {
      drawn.current.push(c.renderer.label(`SAMPLE ${o.side} ${formatPrice(o.price)}`, c.plotLeft + READOUT_GAP, ys[i] - PLACED_HEIGHT / 2)
        .attr({ fill: backing, r: READOUT_PAD, padding: READOUT_PAD, zIndex: 7 })
        .css({ color: tone(o.side), fontSize: `${READOUT_FONT - 1}px`, fontWeight: "600" })
        .addClass("dh-order-placed-label")
        .add());
    });
  };

  /** Called from the chart's render event (one line in ExecutionChart). */
  const onRender = useCallback((c: Highcharts.Chart, frame: ChartFrame) => {
    frameRef.current = frame;
    const view = frame.view;
    drawPlaced(c, view);
    if (previewState.current) drawPreview(previewState.current.key, previewState.current.price);
    /* The tags' boxes, in the plot's own (unscaled) pixels. */
    const plot = plotRef.current;
    const svg = c.container?.querySelector("svg");
    const boxes: TagBox[] = [];
    if (plot && svg) {
      const scale = svg.getBoundingClientRect().width / (c.chartWidth || 1) || 1;
      const origin = c.container.getBoundingClientRect();
      for (const key of ["limit", "bid"] as TagKey[]) {
        const pill = view.pills.find((p) => p.key === key);
        const el = c.container.querySelector(`.dh-exec-pill-${key}`);
        if (!pill || !el) continue;
        const r = el.getBoundingClientRect();
        boxes.push({ key, price: pill.value, top: (r.top - origin.top) / scale, left: (r.left - origin.left) / scale, width: r.width / scale, height: r.height / scale });
      }
    }
    const prev = useTagStore.getState();
    const working = canAmend(view.order);
    const side = view.order.side === "SELL" ? "SELL" : "BUY";
    const ex = priceAxis(c).getExtremes();
    const range = Number.isFinite(ex.min) && Number.isFinite(ex.max) ? { min: snapPrice(ex.min), max: snapPrice(ex.max) } : null;
    const same = prev.working === working && prev.side === side && prev.range?.min === range?.min && prev.range?.max === range?.max && prev.boxes.length === boxes.length
      && prev.boxes.every((b, i) => b.key === boxes[i].key && b.price === boxes[i].price && Math.abs(b.top - boxes[i].top) < 0.5 && Math.abs(b.left - boxes[i].left) < 0.5 && Math.abs(b.width - boxes[i].width) < 0.5);
    if (!same) useTagStore.setState({ boxes, working, side, range });
    /* The drawn limit series' last two points (tests read the step from it). */
    const ys = ((c.get("limit") as Highcharts.Series | undefined)?.points ?? []).map((p) => p.y).filter((y): y is number => typeof y === "number");
    c.container.closest(".dh-exec")?.setAttribute("data-limit-tail", ys.slice(-2).map(formatPrice).join(","));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- reads everything through refs

  const api = useMemo<OrderChartApi>(() => ({
    preview(key, price) {
      if (price === null) { clearPreview(); previewState.current = null; return; }
      drawPreview(key, price);
    },
    priceAt(event) {
      const c = chart();
      if (!c) return null;
      (c.pointer as unknown as { chartPosition: unknown }).chartPosition = null;
      const e = c.pointer.normalize(event as unknown as PointerEvent);
      const axis = priceAxis(c);
      const top = (axis as unknown as { top: number }).top;
      const y = Math.min(Math.max(e.chartY, top), top + axis.len);
      return snapPrice(axis.toValue(y, false));
    },
    commit(key, price, launcher) {
      const view = frameRef.current?.view;
      if (!view) return;
      const market = marketOf(view);
      if (key === "bid") {
        orderActions.openTicket(stagedTicket(price, market.bid), launcher);
        return;
      }
      const current = view.pills.find((p) => p.key === "limit")?.value;
      if (!canAmend(view.order) || (current !== undefined && snapPrice(current) === snapPrice(price))) return;
      /* The drop commits (the design note, PR D): the limit steps from the
         view's last bar on and the one toast confirms. Focus goes to the LMT
         tag, the drag's keyboard twin. */
      const tag = launcher ?? plotRef.current?.querySelector<HTMLElement>(".dh-order-tag-limit") ?? null;
      const checked = validateAmendment(view.order, formatPrice(price), market);
      if (!checked.ok) { showToast(checked.error); tag?.focus(); return; }
      orderActions.amend({ order: view.order.id, time: view.times[view.times.length - 1], price: checked.price });
      showToast(SAMPLE_CONFIRMATION);
      tag?.focus();
    },
  }), [drawPreview]); // eslint-disable-line react-hooks/exhaustive-deps -- the chart is read through refs

  /* Grab the limit line itself (mouse and pen; on touch the tag and its
     menu do it, so a finger on the plot still scrolls the page). */
  useEffect(() => {
    const plot = plotRef.current;
    if (!active || !plot) return;
    const near = (e: PointerEvent): boolean => {
      const c = chart();
      const view = frameRef.current?.view;
      if (!c || !view || !canAmend(view.order) || e.pointerType === "touch") return false;
      const limit = view.pills.find((p) => p.key === "limit")?.value;
      if (limit === undefined) return false;
      (c.pointer as unknown as { chartPosition: unknown }).chartPosition = null;
      const n = c.pointer.normalize(e);
      if (n.chartX < c.plotLeft || n.chartX > c.plotLeft + c.plotWidth) return false;
      return Math.abs(priceAxis(c).toPixels(limit, false) - n.chartY) <= LINE_GRAB;
    };
    let drag: { id: number; price: number | null } | null = null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !drag) return;
      e.stopPropagation();
      e.preventDefault();
      if (plot.hasPointerCapture(drag.id)) plot.releasePointerCapture(drag.id);
      drag = null;
      api.preview("limit", null);
      plot.style.cursor = "";
    };
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || !near(e)) return;
      /* Ours: the chart's own press (pan, tooltip) does not start. */
      e.stopPropagation();
      e.preventDefault();
      drag = { id: e.pointerId, price: null };
      try { plot.setPointerCapture(e.pointerId); } catch { /* no such pointer: the moves still reach the plot */ }
      plot.style.cursor = "ns-resize";
    };
    const move = (e: PointerEvent) => {
      if (!drag) { plot.style.cursor = near(e) ? "ns-resize" : ""; return; }
      e.stopPropagation();
      const price = api.priceAt(e);
      if (price === null) return;
      drag.price = price;
      api.preview("limit", price);
    };
    const up = (e: PointerEvent) => {
      if (!drag) return;
      e.stopPropagation();
      const price = drag.price;
      if (plot.hasPointerCapture(drag.id)) plot.releasePointerCapture(drag.id);
      drag = null;
      api.preview("limit", null);
      plot.style.cursor = "";
      if (price !== null) api.commit("limit", price, null);
    };
    /* A cancelled press (the system took the pointer) amends nothing. */
    const cancel = (e: PointerEvent) => {
      if (!drag) return;
      e.stopPropagation();
      drag = null;
      api.preview("limit", null);
      plot.style.cursor = "";
    };
    plot.addEventListener("pointerdown", down, true);
    plot.addEventListener("pointermove", move, true);
    plot.addEventListener("pointerup", up, true);
    plot.addEventListener("pointercancel", cancel, true);
    window.addEventListener("keydown", onKey, true);
    return () => {
      plot.removeEventListener("pointerdown", down, true);
      plot.removeEventListener("pointermove", move, true);
      plot.removeEventListener("pointerup", up, true);
      plot.removeEventListener("pointercancel", cancel, true);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [active, api, plotRef]); // eslint-disable-line react-hooks/exhaustive-deps -- chart() reads a ref

  /* Leaving Present, or a new chart: no stale preview or lines. */
  useEffect(() => () => { clearPreview(); previewState.current = null; drawn.current.forEach((el) => el.destroy()); drawn.current = []; }, [active]);
  /* Table view (or Edit): the chart is gone, and so are its tags' targets. */
  const tags = active && !table;
  useEffect(() => {
    if (tags) return;
    previewState.current = null;
    useTagStore.setState({ boxes: [], range: null });
  }, [tags]);
  /* A confirmed sample order is drawn at once (no chart rebuild). */
  useEffect(() => {
    const c = chart();
    if (c && frameRef.current) drawPlaced(c, frameRef.current.view);
  }, [placed, active]); // eslint-disable-line react-hooks/exhaustive-deps -- drawPlaced reads refs

  const overlay = active
    ? React.createElement(React.Fragment, null,
        // eslint-disable-next-line react-hooks/refs -- the api reads the chart only in event handlers, never while rendering
        tags ? React.createElement(OrderTagLayer, { api }) : null,
        React.createElement(OrderWorkflow, { system, dataset, vars, palette }))
    : null;

  return { onRender, overlay };
}
