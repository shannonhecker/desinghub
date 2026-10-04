/**
 * executionChartOptions - the FX Execution chart's Highcharts options, and
 * how a feed bar is added to a drawn chart in place.
 *
 * Pure (no React): the view and the theme in, options out. The formatters
 * and the price tags read the view through a `ChartFrame` the chart block
 * keeps, so when the feed adds a bar the chart is patched, not rebuilt:
 * `applyFeedView` appends the new points to every series, moves the last
 * bucket, the latest-price line and the tags, and redraws once.
 */

import Highcharts from "highcharts";
import {
  EXECUTION_INTERVALS, formatBarStamp, formatBarTime, formatPips, formatPrice,
  type ExecutionOverlay, type ExecutionPill, type ExecutionView,
} from "@/lib/executionModel";
import { MINUTE } from "@/lib/reportData/executionDataset";
import type { ThemeVars } from "./SimulatedHighchart";

/** Room on the right for the price axis and its tags. */
export const PRICE_GUTTER = 92;
const PILL_HEIGHT = 20;
/** Share of the plot the volume strip takes, at the bottom. */
const VOLUME_SHARE = 18;
/** Width a time label needs on the axis. */
const TICK_ROOM = 84;
/** Below this chart width, the phone treatment. */
const NARROW_CHART = 420;
/* Type sizes inside the chart (Highcharts takes them as CSS lengths). */
const SMALL = `${10}px`;
const TIP = `${11}px`;
/* Palette slots for the two order lines (past the five the venues use). */
const LIMIT_COLOR = 5;
const TWAP_COLOR = 6;
const STATE_TONES: Record<string, keyof ThemeVars> = { "Delay start": "fgTer", Suspend: "warning", "Outside limit price": "negative" };
/** How long the chart takes to slide a new bar in. */
export const FEED_REDRAW = { duration: 400, easing: "easeOutQuad" } as const;

const alpha = (color: string, opacity: number): string => Highcharts.color(color).setOpacity(opacity).get("rgba") as string;

/** What the chart's formatters and tags read; the block swaps `view` in
 *  as the feed moves on. */
export interface ChartFrame {
  view: ExecutionView;
  /** "closes in 3m" under the BID tag on an interval above a minute, while the feed runs. */
  countdown: string | null;
  /** How many points each series holds (to append the rest). */
  counts: Record<string, number>;
}

/** Minutes until the bar the latest one-minute bar belongs to closes
 *  ("3m"); null on the one-minute interval. */
export function barCountdown(view: ExecutionView, latestBarTime: number): string | null {
  const minutes = EXECUTION_INTERVALS[view.interval] ?? 1;
  if (minutes <= 1) return null;
  const span = minutes * MINUTE;
  const closes = (Math.floor(latestBarTime / span) + 1) * span;
  return `${Math.max(1, Math.round((closes - latestBarTime) / MINUTE))}m`;
}

type Datum = [number, number | null] | [number, number, number, number, number] | Highcharts.PointOptionsObject;

/** Every series' points, by series id. Shared by the options and the in-place feed. */
export function executionSeriesData(view: ExecutionView, v: ThemeVars, palette: string[]): Record<string, Datum[]> {
  const n = view.times.length;
  const xy = (values: (number | null)[]): Datum[] => values.map((y, x) => [x, y] as [number, number | null]);
  const venueColor = (venue: string) => palette[Math.max(0, view.venues.indexOf(venue)) % palette.length];
  const benchmark = (value: number | null): Datum[] => (value === null ? [] : [[0, value], [n - 1, value]]);
  return {
    pct: xy(view.pct),
    bid: xy(view.bid),
    ask: xy(view.ask),
    mid: xy(view.mid),
    candles: view.candles.map(([o, h, l, c], x) => [x, o, h, l, c] as [number, number, number, number, number]),
    limit: xy(view.limit),
    avg: xy(view.avgFill),
    twap: xy(view.twap),
    arrival: benchmark(view.arrivalMid),
    rtp: benchmark(view.riskTransfer),
    trades: view.fills.map((f) => ({
      x: f.x, y: f.price, color: alpha(venueColor(f.venue), f.dim ? 0.14 : 1),
      marker: { radius: 2 + f.volume * 0.35, symbol: "circle", lineWidth: 1, lineColor: v.card ?? v.surface },
      custom: { venue: f.venue, volume: f.volume, passive: f.passive, slippage: f.slippage },
    })),
    volume: view.fills.filter((f) => !f.dim).map((f) => [f.x, f.volume] as [number, number]),
  };
}

/** Series whose last point can change as a bar fills (a bucket of several minutes). */
const APPEND_ONLY = new Set(["trades", "volume"]);

export function buildExecutionOptions(frame: ChartFrame, v: ThemeVars, palette: string[], size: { width: number; height: number }, onVenue: (venue: string) => void): Highcharts.Options {
  const view = frame.view;
  const n = view.times.length;
  const shows = (overlay: ExecutionOverlay) => !view.hidden.includes(overlay);
  const data = executionSeriesData(view, v, palette);
  frame.counts = Object.fromEntries(Object.entries(data).map(([id, d]) => [id, d.length]));
  const line = { type: "line" as const, step: "left" as const, yAxis: 1, marker: { enabled: false }, states: { hover: { lineWidthPlus: 0 } } };
  const plotShare = shows("Volume") ? 100 - VOLUME_SHARE : 100;
  const acrossDays = () => { const t = frame.view.times; return t[t.length - 1] - t[0] > 36 * 60 * 60 * 1000; };

  const market: Highcharts.SeriesOptionsType[] =
    view.chartStyle === "Line"
      ? [
          { ...line, id: "bid", name: "Bid", data: data.bid, color: v.fgSec, lineWidth: 1.6 } as Highcharts.SeriesOptionsType,
          { ...line, id: "ask", name: "Ask", data: data.ask, color: v.negative, lineWidth: 1.2 } as Highcharts.SeriesOptionsType,
          ...(shows("Mid line") ? [{ ...line, id: "mid", name: "Mid", data: data.mid, color: v.fgTer, lineWidth: 1, dashStyle: "Dot" as const } as Highcharts.SeriesOptionsType] : []),
        ]
      : [{
          id: "candles",
          type: view.chartStyle === "Candlestick" ? "candlestick" : "ohlc",
          name: "Market", yAxis: 1,
          data: data.candles,
          color: v.negative, upColor: v.positive, lineColor: v.negative, upLineColor: v.positive,
          /* A candle is a column underneath: without this the price axis
             would stretch down to zero. */
          threshold: null,
        } as Highcharts.SeriesOptionsType];

  const benchmark = (id: string, name: string, value: number | null): Highcharts.SeriesOptionsType[] =>
    value === null || !shows("Benchmarks")
      ? []
      : [{ type: "line", id, name, yAxis: 1, data: data[id] as [number, number][], color: v.fgSec, lineWidth: 1, dashStyle: "ShortDot", marker: { enabled: false }, enableMouseTracking: false }];

  return {
    chart: {
      backgroundColor: "transparent", style: { fontFamily: "inherit" }, width: size.width, height: size.height,
      spacing: [8, 0, 0, 0], marginRight: PRICE_GUTTER, animation: false,
      /* Each axis keeps its own scale (percent done is 0 to 100 whatever the price range is). */
      alignTicks: false,
    },
    title: { text: undefined },
    credits: { enabled: false },
    accessibility: { description: `${view.pair} execution: market, limit price, fills and percent done for order ${view.order.id}.` },
    xAxis: {
      min: -0.5, max: n - 0.5,
      lineColor: v.border, tickLength: 0,
      crosshair: { dashStyle: "Dash", color: v.fgTer, width: 1 },
      /* As many time labels as the plot has room for. */
      tickPositioner() {
        const count = frame.view.times.length;
        const room = Math.max(2, Math.floor((this.chart.plotWidth || 600) / TICK_ROOM));
        const step = Math.max(1, Math.round(count / room));
        const out: number[] = [];
        for (let i = Math.floor(step / 2); i < count; i += step) out.push(i);
        return out;
      },
      labels: { rotation: 0, style: { color: v.fgTer, fontSize: SMALL, textOverflow: "none", whiteSpace: "nowrap" }, formatter() { const t = frame.view.times[Math.round(Number(this.value))]; return t === undefined ? "" : formatBarTime(t, acrossDays()); } },
      plotBands: view.bands.map((b) => ({ id: b.state, from: b.from - 0.5, to: b.to - 0.5, color: alpha(v[STATE_TONES[b.state] ?? "fgTer"] as string, 0.14) })),
    },
    yAxis: [
      {
        title: { text: "% done", style: { color: v.fgTer, fontSize: SMALL } }, min: 0, max: 100, tickPositions: [0, 20, 40, 60, 80, 100], endOnTick: false, startOnTick: false, height: `${plotShare}%`,
        gridLineColor: alpha(v.border, 0.4), gridLineWidth: shows("Gridlines") ? 1 : 0,
        labels: { style: { color: v.fgTer, fontSize: SMALL } },
      },
      {
        title: { text: undefined }, opposite: true, height: `${plotShare}%`, gridLineWidth: 0, startOnTick: false, endOnTick: false,
        labels: { align: "left", x: 8, style: { color: v.fgTer, fontSize: SMALL, textOverflow: "none", whiteSpace: "nowrap" }, formatter() { return formatPrice(Number(this.value)); } },
        /* The latest price, across the plot. */
        plotLines: [latestPriceLine(view, v)],
      },
      { title: { text: undefined }, top: `${plotShare}%`, height: `${100 - plotShare}%`, labels: { enabled: false }, gridLineWidth: 0, visible: shows("Volume") },
    ],
    legend: {
      itemStyle: { color: v.fgSec, fontSize: SMALL, fontWeight: "400" }, itemHoverStyle: { color: v.fg }, itemHiddenStyle: { color: v.fgTer },
      symbolHeight: 8, symbolWidth: 16, margin: 8, padding: 4,
    },
    tooltip: {
      shared: true, backgroundColor: v.card ?? v.surface, borderColor: v.border, borderRadius: 4, shadow: false,
      style: { color: v.fg, fontSize: TIP },
      formatter() {
        const points = (this as unknown as { points?: Highcharts.Point[] }).points ?? [this as unknown as Highcharts.Point];
        const x = Math.round(Number(points[0].x));
        const times = frame.view.times;
        const head = `<span style="color:${v.fgTer}">${formatBarStamp(times[x] ?? times[0])}</span>`;
        const rows = points.map((p) => {
          const o = p.options as { custom?: { venue: string; volume: number; passive: boolean; slippage: number } };
          if (o.custom) return `<span style="color:${String(p.color)}">●</span> ${o.custom.venue}: <b>${formatPrice(Number(p.y))}</b> · ${o.custom.volume.toFixed(1)}m · ${o.custom.passive ? "passive" : "aggressive"} · ${formatPips(o.custom.slippage, "p")}`;
          const value = p.series.name === "Percent done" ? `${Number(p.y).toFixed(1)}%` : p.series.name === "Volume" ? `${Number(p.y).toFixed(1)}m` : formatPrice(Number((p as unknown as { close?: number }).close ?? p.y));
          return `<span style="color:${String(p.series.color)}">●</span> ${p.series.name}: <b>${value}</b>`;
        });
        return [head, ...rows].join("<br/>");
      },
    },
    /* On a phone the plot keeps the width: the percent axis loses its
       labels (the area still reads against the gridlines) and the legend goes. */
    responsive: {
      rules: [{
        condition: { maxWidth: NARROW_CHART },
        chartOptions: { yAxis: [{ labels: { enabled: false }, title: { text: undefined } }, {}, {}], legend: { enabled: false } },
      }],
    },
    plotOptions: {
      series: { animation: false, turboThreshold: 0, states: { inactive: { opacity: 1 } }, events: { legendItemClick() { return true; } } },
    },
    series: [
      ...(shows("Percent done")
        ? [{
            type: "area" as const, id: "pct", name: "Percent done", yAxis: 0, step: "left" as const, data: data.pct, color: v.primary, lineWidth: 1.6, marker: { enabled: false },
            fillColor: { linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, stops: [[0, alpha(v.primary, 0.28)], [1, alpha(v.primary, 0.02)]] as [number, string][] },
          }]
        : []),
      ...market,
      { ...line, id: "limit", name: "Limit price", data: data.limit, color: palette[LIMIT_COLOR % palette.length], lineWidth: 1.4, dashStyle: "Dash" },
      ...(shows("Avg market fill") ? [{ ...line, id: "avg", name: "Avg market fill", data: data.avg, color: v.fg, lineWidth: 1.3 }] : []),
      ...(shows("Session TWAP") ? [{ ...line, id: "twap", step: undefined, name: "Session TWAP", data: data.twap, color: palette[TWAP_COLOR % palette.length], lineWidth: 1.2, dashStyle: "LongDash" as const }] : []),
      ...benchmark("arrival", "Arrival mid", view.arrivalMid),
      ...benchmark("rtp", "Risk transfer price", view.riskTransfer),
      {
        type: "scatter", id: "trades", name: "Trades", yAxis: 1, color: palette[0], cursor: "pointer",
        data: data.trades,
        point: { events: { click() { const o = this.options as { custom?: { venue: string } }; if (o.custom) onVenue(o.custom.venue); } } },
      },
      ...(shows("Volume")
        ? [{ type: "column" as const, id: "volume", name: "Volume", yAxis: 2, data: data.volume, color: alpha(v.primary, 0.55), pointWidth: 3, borderWidth: 0 }]
        : []),
      /* The held-back periods, as legend entries. */
      ...view.bands.map((b) => ({ type: "area" as const, name: b.state, data: [] as number[], color: alpha(v[STATE_TONES[b.state] ?? "fgTer"] as string, 0.5), enableMouseTracking: false, events: { legendItemClick: () => false } })),
    ] as Highcharts.SeriesOptionsType[],
  };
}

const LATEST_LINE = "latest-price";
function latestPriceLine(view: ExecutionView, v: ThemeVars): Highcharts.YAxisPlotLinesOptions {
  return { id: LATEST_LINE, value: view.bid[view.bid.length - 1], color: alpha(v.positive, 0.55), dashStyle: "ShortDash", width: 1, zIndex: 4 };
}

/**
 * The feed moved on: put `next` in the frame and patch the chart in place.
 * New points are appended to each series and the last one updated (a bucket
 * of several minutes fills over several bars); nothing is rebuilt. Returns
 * false when the chart cannot be patched (fewer bars than it holds), and
 * the caller rebuilds it.
 */
export function applyFeedView(chart: Highcharts.Chart, frame: ChartFrame, next: ExecutionView, v: ThemeVars, palette: string[], countdown: string | null, animate: boolean): boolean {
  const data = executionSeriesData(next, v, palette);
  for (const [id, points] of Object.entries(data)) {
    const series = chart.get(id) as Highcharts.Series | undefined;
    const held = frame.counts[id] ?? 0;
    if (points.length < held) return false;
    if (!series) { frame.counts[id] = points.length; continue; }
    if (!APPEND_ONLY.has(id) && held > 0) {
      const last = series.data[held - 1];
      if (!last) return false;
      last.update(points[held - 1] as Highcharts.PointOptionsType, false, false);
    }
    for (let i = held; i < points.length; i++) series.addPoint(points[i] as Highcharts.PointOptionsType, false, false, false);
    frame.counts[id] = points.length;
  }
  frame.view = next;
  frame.countdown = countdown;
  chart.xAxis[0]?.update({ max: next.times.length - 0.5 }, false);
  const price = chart.yAxis[1];
  if (price) {
    price.removePlotLine(LATEST_LINE);
    price.addPlotLine(latestPriceLine(next, v));
  }
  chart.redraw(animate ? FEED_REDRAW : false);
  return true;
}

/** Draw the price tags against the right-hand axis, pushed apart where they
 *  would overlap; under the BID tag, the bar countdown when there is one. */
export function drawPills(chart: Highcharts.Chart, frame: ChartFrame, v: ThemeVars, palette: string[], store: { current: Highcharts.SVGElement[] }): void {
  store.current.forEach((el) => el.destroy());
  store.current = [];
  const axis = chart.yAxis[1];
  if (!axis) return;
  const top = chart.plotTop;
  const bottom = chart.plotTop + axis.len;
  const pills: ExecutionPill[] = frame.view.pills;
  const placed = pills
    .map((p) => ({ p, y: axis.toPixels(p.value, false) }))
    .filter(({ y }) => Number.isFinite(y))
    .map(({ p, y }) => ({ p, y: Math.min(bottom - PILL_HEIGHT / 2, Math.max(top + PILL_HEIGHT / 2, y)) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < placed.length; i++) if (placed[i].y - placed[i - 1].y < PILL_HEIGHT + 2) placed[i].y = placed[i - 1].y + PILL_HEIGHT + 2;
  const fill: Partial<Record<ExecutionPill["key"], string>> = { bid: v.positive, limit: palette[LIMIT_COLOR % palette.length] };
  const card = v.card ?? v.surface;
  const x = chart.plotLeft + chart.plotWidth + 4;
  for (const { p, y } of placed) {
    const solid = fill[p.key];
    const label = chart.renderer
      .label(`${p.label} ${formatPrice(p.value)}`, x, y - PILL_HEIGHT / 2)
      .attr({ fill: solid ?? card, stroke: solid ?? v.fgTer, "stroke-width": 1, r: PILL_HEIGHT / 2, padding: 4, zIndex: 9 })
      .css({ color: solid ? card : v.fg, fontSize: SMALL, fontWeight: "600" })
      .addClass(`dh-exec-pill dh-exec-pill-${p.key}`)
      .add();
    store.current.push(label);
    if (p.key === "bid" && frame.countdown) {
      const note = chart.renderer
        .text(`closes in ${frame.countdown}`, x + 4, y + PILL_HEIGHT / 2 + 12)
        .css({ color: v.fgTer, fontSize: SMALL })
        .attr({ zIndex: 9, class: "dh-exec-countdown" })
        .add();
      store.current.push(note);
    }
  }
}
