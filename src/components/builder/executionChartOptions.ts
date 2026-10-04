/**
 * executionChartOptions - the FX Execution chart's Highcharts options, and
 * how a feed bar is added to a drawn chart in place.
 *
 * No React. `buildExecutionOptions` returns options and also fills in the
 * `ChartFrame` it is given (point counts, axis end): the frame is the
 * contract between the options and the in-place updates, for this PR and
 * the navigation and drawing PRs after it. The formatters
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
export const NARROW_CHART = 420;
/** The price gutter on a phone: the tags set in a smaller size. */
export const PRICE_GUTTER_NARROW = 76;
const TAG_NARROW = `${9}px`;
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
  /** The time axis's right end, past the last bar (see axisEnd). */
  axisMax?: number;
  /** Drawn at phone width: a narrower price gutter and smaller tags. */
  narrow?: boolean;
}

/** Empty bars kept to the right of the last one, about a twentieth of the
 *  plot on any interval: the feed's bars walk into them, and the axis steps
 *  out again only when they run out (the plot does not squeeze every bar). */
export function axisEnd(bars: number): number {
  return bars - 0.5 + Math.max(2, Math.ceil(bars * 0.05));
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

export function buildExecutionOptions(frame: ChartFrame, v: ThemeVars, palette: string[], size: { width: number; height: number; narrow?: boolean }, onVenue: (venue: string) => void): Highcharts.Options {
  const view = frame.view;
  const n = view.times.length;
  const shows = (overlay: ExecutionOverlay) => !view.hidden.includes(overlay);
  const data = executionSeriesData(view, v, palette);
  frame.counts = Object.fromEntries(Object.entries(data).map(([id, d]) => [id, d.length]));
  frame.axisMax = axisEnd(n);
  frame.narrow = Boolean(size.narrow);
  const line = { type: "line" as const, step: "left" as const, yAxis: 1, marker: { enabled: false }, states: { hover: { lineWidthPlus: 0 } } };
  const plotShare = shows("Volume") ? 100 - VOLUME_SHARE : 100;
  /* Dates when the bars on screen span more than a day and a half, times otherwise. */
  const acrossDays = (axis?: { min?: number | null; max?: number | null }) => {
    const t = frame.view.times;
    const lo = Math.max(0, Math.min(t.length - 1, Math.ceil(axis?.min ?? 0)));
    const hi = Math.max(0, Math.min(t.length - 1, Math.floor(axis?.max ?? t.length - 1)));
    return t[hi] - t[lo] > 36 * 60 * 60 * 1000;
  };

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
      spacing: [8, 0, 0, 0], marginRight: size.narrow ? PRICE_GUTTER_NARROW : PRICE_GUTTER, animation: false,
      /* Each axis keeps its own scale (percent done is 0 to 100 whatever the price range is). */
      alignTicks: false,
    },
    title: { text: undefined },
    credits: { enabled: false },
    accessibility: { description: `${view.pair} execution: market, limit price, fills and percent done for order ${view.order.id}.` },
    xAxis: {
      min: -0.5, max: frame.axisMax,
      lineColor: v.border, tickLength: 0,
      crosshair: { dashStyle: "Dash", color: v.fgTer, width: 1 },
      /* The fewest bars a zoomed view shows (useChartNavigation's MIN_BARS). */
      minRange: 5,
      /* As many time labels as the plot has room for, over the bars on
         screen. A label sits on every `step`th bar counted from the first,
         so panning moves the labels with their bars. */
      tickPositioner() {
        const count = frame.view.times.length;
        const lo = Math.max(0, Math.ceil(this.min ?? 0));
        const hi = Math.min(count - 1, Math.floor(this.max ?? count - 1));
        const room = Math.max(2, Math.floor((this.chart.plotWidth || 600) / TICK_ROOM));
        const step = Math.max(1, Math.round((hi - lo + 1) / room));
        const offset = Math.floor(step / 2);
        const out: number[] = [];
        for (let i = lo + ((((offset - lo) % step) + step) % step); i <= hi; i += step) out.push(i);
        return out;
      },
      labels: { rotation: 0, style: { color: v.fgTer, fontSize: SMALL, textOverflow: "none", whiteSpace: "nowrap" }, formatter() { const t = frame.view.times[Math.round(Number(this.value))]; return t === undefined ? "" : formatBarTime(t, acrossDays(this.axis)); } },
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
      /* A finger moving over the chart scrolls the page or pans; press and
         hold shows the values (useChartNavigation). */
      followTouchMove: false,
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
/** Who decides the time axis when a bar arrives: given the latest bar's
 *  position before and after, the span to show, or null to leave the axis to
 *  the walk-in step (the full view). The navigation hook passes its own. */
export type HoldTime = (before: number, after: number) => { min: number; max: number } | null;

export function applyFeedView(chart: Highcharts.Chart, frame: ChartFrame, next: ExecutionView, v: ThemeVars, palette: string[], countdown: string | null, animate: boolean, holdTime?: HoldTime): boolean {
  const lastBefore = frame.view.times.length - 1;
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
  const bars = next.times.length;
  if (frame.axisMax === undefined || bars - 0.5 > frame.axisMax - 1) {
    frame.axisMax = axisEnd(bars);
    /* The full view's end. A zoomed view's own extremes survive an axis
       update (Highcharts keeps userMin / userMax). */
    chart.xAxis[0]?.update({ max: frame.axisMax }, false);
  }
  /* A zoomed or panned view is the reader's: it holds still, or moves on
     with the bars when it shows the latest one. */
  const held = holdTime?.(lastBefore, bars - 1);
  if (held) chart.xAxis[0]?.setExtremes(held.min, held.max, false, false);
  const price = chart.yAxis[1];
  if (price) {
    price.removePlotLine(LATEST_LINE);
    price.addPlotLine(latestPriceLine(next, v));
  }
  chart.redraw(animate ? FEED_REDRAW : false);
  return true;
}

/* ── Price tags ── */

/** Where each tag goes (centres, in the order given): inside the plot, at
 *  least `h + gap` apart, as near its price as that allows. */
export function layoutTags(ys: number[], top: number, bottom: number, h: number, gap: number): number[] {
  const min = top + h / 2;
  const max = bottom - h / 2;
  const step = h + gap;
  const order = ys.map((y, i) => ({ y: Math.min(max, Math.max(min, y)), i })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < order.length; k++) if (order[k].y - order[k - 1].y < step) order[k].y = order[k - 1].y + step;
  /* Pushed past the bottom: walk them back up. */
  if (order.length && order[order.length - 1].y > max) {
    order[order.length - 1].y = max;
    for (let k = order.length - 2; k >= 0; k--) if (order[k + 1].y - order[k].y < step) order[k].y = order[k + 1].y - step;
  }
  const out = new Array<number>(ys.length);
  for (const o of order) out[o.i] = o.y;
  return out;
}

/** A colour as [r, g, b] (0 to 255): hex, rgb() / rgba(), white or black. */
function rgbOf(color: string): [number, number, number] {
  if (color === "white") return [255, 255, 255];
  if (color === "black") return [0, 0, 0];
  const [r, g, b] = Highcharts.color(color).rgba;
  return [r ?? 0, g ?? 0, b ?? 0];
}
function luminance(color: string): number {
  const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = rgbOf(color);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
/** WCAG contrast between two colours (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
const AA = 4.5;

/** A tag's colours. BID and LMT are solid (the system's positive colour, the
 *  limit line's colour); the others are outlined on the card. Text is white
 *  or black, whichever reads better, and a solid fill is deepened or
 *  lightened until the text reaches 4.5:1. */
export function pillColors(key: ExecutionPill["key"], v: ThemeVars, palette: string[]): { fill: string; stroke: string; text: string } {
  const card = v.card ?? v.surface;
  const solid = key === "bid" ? v.positive : key === "limit" ? palette[LIMIT_COLOR % palette.length] : null;
  if (!solid) return { fill: card, stroke: v.fgTer, text: v.fg };
  const text = contrastRatio("white", solid) >= contrastRatio("black", solid) ? "white" : "black";
  let fill = Highcharts.color(solid).get("rgb") as string;
  for (let i = 0; i < 20 && contrastRatio(text, fill) < AA; i++) fill = Highcharts.color(fill).brighten(text === "white" ? -0.06 : 0.06).get("rgb") as string;
  return { fill, stroke: fill, text };
}

/** Draw the price tags against the right-hand axis, kept apart; under the
 *  BID tag, the bar countdown when there is one. A price-axis label a tag
 *  would cover is hidden while the tag is there. */
export function drawPills(chart: Highcharts.Chart, frame: ChartFrame, v: ThemeVars, palette: string[], store: { current: Highcharts.SVGElement[] }): void {
  store.current.forEach((el) => el.destroy());
  store.current = [];
  const axis = chart.yAxis[1];
  if (!axis) return;
  const top = chart.plotTop;
  const bottom = chart.plotTop + axis.len;
  const pills = frame.view.pills
    .map((p) => ({ p, y: axis.toPixels(p.value, false) }))
    .filter(({ y }) => Number.isFinite(y));
  const ys = layoutTags(pills.map((t) => t.y), top, bottom, PILL_HEIGHT, 2);
  const x = chart.plotLeft + chart.plotWidth + 4;
  /* The bands the tags (and the countdown) take on the axis. */
  const taken: [number, number][] = [];
  pills.forEach(({ p }, i) => {
    const y = ys[i];
    const c = pillColors(p.key, v, palette);
    const label = chart.renderer
      .label(`${p.label} ${formatPrice(p.value)}`, x, y - PILL_HEIGHT / 2)
      .attr({ fill: c.fill, stroke: c.stroke, "stroke-width": 1, r: PILL_HEIGHT / 2, padding: 4, zIndex: 9 })
      .css({ color: c.text, fontSize: frame.narrow ? TAG_NARROW : SMALL, fontWeight: "600" })
      .addClass(`dh-exec-pill dh-exec-pill-${p.key}`)
      .add();
    store.current.push(label);
    taken.push([y - PILL_HEIGHT / 2, y + PILL_HEIGHT / 2]);
    if (p.key === "bid" && frame.countdown) {
      const note = chart.renderer
        .text(`closes in ${frame.countdown}`, x + 4, y + PILL_HEIGHT / 2 + 12)
        .css({ color: v.fgTer, fontSize: SMALL })
        .attr({ zIndex: 9, class: "dh-exec-countdown" })
        .add();
      store.current.push(note);
      taken.push([y + PILL_HEIGHT / 2, y + PILL_HEIGHT / 2 + 16]);
    }
  });
  /* A label is about one line tall around its tick. */
  const half = PILL_HEIGHT / 2;
  for (const tick of Object.values(axis.ticks)) {
    const el = tick.label;
    if (!el) continue;
    const ty = axis.toPixels(Number(tick.pos), false);
    const covered = !Number.isFinite(ty) || ty < top + half / 2 || taken.some(([a, b]) => ty + half > a && ty - half < b);
    el.attr({ opacity: covered ? 0 : 1 });
  }
}
