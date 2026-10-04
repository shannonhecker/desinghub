/**
 * executionModel - what the FX Execution chart and its header show, as data.
 *
 * Pure: the dataset's tables and the report state in, one view out. The
 * chart block draws the view; the export writes it; tests assert on it.
 *
 * Bars are addressed by POSITION (0, 1, 2 ...), not by time: the time is a
 * label. So an inactive period, a weekend or a holiday takes no room on the
 * axis, and hourly history can sit beside one-minute session bars.
 */

import { MINUTE, parseExecutionTime } from "./reportData/executionDataset";
import type { ReportState } from "./reportData/binding";
import { tableOf, type DataRow, type ReportDataset } from "./reportData/types";

/** Report-state keys the chart's controls read and write. */
export const EXECUTION_KEYS = {
  order: "fxOrder",
  interval: "fxInterval",
  chart: "fxChart",
  range: "fxRange",
  hidden: "fxHidden",
  venue: "select:venue",
} as const;

export const EXECUTION_INTERVALS: Record<string, number> = { "1m": 1, "3m": 3, "5m": 5, "15m": 15, "30m": 30, "1h": 60, "2h": 120 };
export const EXECUTION_CHART_STYLES = ["Line", "Candlestick", "OHLC"] as const;
export type ExecutionChartStyle = (typeof EXECUTION_CHART_STYLES)[number];
/** Range presets: days of history shown before the session ("Order" and
 *  "1D" show the session alone; "YTD" from the first of January). */
export const EXECUTION_RANGES = ["1D", "3D", "5D", "1W", "1M", "3M", "YTD", "Order"] as const;
export type ExecutionRange = (typeof EXECUTION_RANGES)[number];
const RANGE_DAYS: Partial<Record<ExecutionRange, number>> = { "3D": 3, "5D": 5, "1W": 7, "1M": 30, "3M": 92 };
/** Things the reader can take off the chart. */
export const EXECUTION_OVERLAYS = ["Mid line", "Avg market fill", "Session TWAP", "Benchmarks", "Percent done", "Volume", "Gridlines"] as const;
export type ExecutionOverlay = (typeof EXECUTION_OVERLAYS)[number];

export interface ExecutionFill {
  /** Position of the bar the fill belongs to. */
  x: number;
  time: number;
  price: number;
  volume: number;
  venue: string;
  passive: boolean;
  slippage: number;
  /** True when another venue is selected: drawn faint. */
  dim: boolean;
}

export interface ExecutionBand { state: string; from: number; to: number }

export interface ExecutionPill { key: "bid" | "avg" | "limit" | "arrival" | "riskTransfer"; label: string; value: number }

export interface ExecutionView {
  pair: string;
  description: string;
  order: { id: string; side: string; status: string; algo: string; pctDone: number; fills: number; fillsTarget: number };
  orders: { id: string; side: string; status: string }[];
  interval: string;
  chartStyle: ExecutionChartStyle;
  range: ExecutionRange;
  hidden: ExecutionOverlay[];
  /** Start time of each bar, by position. */
  times: number[];
  bid: number[];
  ask: number[];
  mid: number[];
  /** [open, high, low, close] per bar. */
  candles: [number, number, number, number][];
  limit: (number | null)[];
  avgFill: (number | null)[];
  twap: (number | null)[];
  pct: (number | null)[];
  fills: ExecutionFill[];
  bands: ExecutionBand[];
  arrivalMid: number | null;
  riskTransfer: number | null;
  /** The order's venues, largest first (the order the donut draws them in). */
  venues: string[];
  selectedVenue: string | null;
  pills: ExecutionPill[];
  /** The latest bar, for the header. */
  last: { open: number; high: number; low: number; close: number; bid: number; ask: number; changePips: number; changePct: number } | null;
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const text = (v: unknown, fallback = ""): string => (typeof v === "string" && v ? v : fallback);

function choice<T extends string>(value: string | undefined, options: readonly T[], fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback;
}

/** The overlays a state value hides ("Volume, Gridlines"). */
export function hiddenOverlays(value: string | undefined): ExecutionOverlay[] {
  const names = (value ?? "").split(",").map((s) => s.trim().toLowerCase());
  return EXECUTION_OVERLAYS.filter((o) => names.includes(o.toLowerCase()));
}
/** The state value after showing or hiding one overlay. */
export function toggleOverlay(value: string | undefined, overlay: ExecutionOverlay): string {
  const hidden = hiddenOverlays(value);
  return (hidden.includes(overlay) ? hidden.filter((o) => o !== overlay) : [...hidden, overlay]).join(", ");
}

export function resolveExecution(dataset: ReportDataset, state: ReportState): ExecutionView | null {
  const orderRows = tableOf(dataset, "orders")?.rows ?? [];
  const market = tableOf(dataset, "market")?.rows ?? [];
  if (orderRows.length === 0 || market.length === 0) return null;

  const orderRow = orderRows.find((r) => r.order === state[EXECUTION_KEYS.order]) ?? orderRows[0];
  const orderId = text(orderRow.order);
  const interval = state[EXECUTION_KEYS.interval] && state[EXECUTION_KEYS.interval] in EXECUTION_INTERVALS ? state[EXECUTION_KEYS.interval] : "1m";
  const chartStyle = choice(state[EXECUTION_KEYS.chart], EXECUTION_CHART_STYLES, "Line");
  const range = choice(state[EXECUTION_KEYS.range], EXECUTION_RANGES, "1D");
  const hidden = hiddenOverlays(state[EXECUTION_KEYS.hidden]);
  const forOrder = (r: DataRow) => r.order === orderId;

  const orderBars = (tableOf(dataset, "orderBars")?.rows ?? []).filter(forOrder);
  const barByTime = new Map<number, DataRow>();
  for (const r of orderBars) barByTime.set(parseExecutionTime(r.time), r);

  /* The window: the session, plus the history the range reaches back to. */
  const session = market.filter((r) => r.period !== "History");
  const sessionStart = parseExecutionTime(session[0]?.time);
  let from = sessionStart;
  if (range === "YTD") from = Date.UTC(new Date(sessionStart).getUTCFullYear(), 0, 1);
  else if (RANGE_DAYS[range]) from = sessionStart - RANGE_DAYS[range]! * 24 * 60 * MINUTE;
  let to = Infinity;
  if (range === "Order") {
    /* From the order's first bar to its last working one. */
    const worked = orderBars.filter((r) => num(r.limitPrice) !== null).map((r) => parseExecutionTime(r.time));
    if (worked.length) { from = Math.min(...worked); to = Math.max(...worked); }
  }

  /* Group the bars of the window into buckets of the interval. */
  const span = EXECUTION_INTERVALS[interval] * MINUTE;
  const times: number[] = [];
  const bid: number[] = [];
  const ask: number[] = [];
  const mid: number[] = [];
  const candles: [number, number, number, number][] = [];
  const limit: (number | null)[] = [];
  const avgFill: (number | null)[] = [];
  const twap: (number | null)[] = [];
  const pct: (number | null)[] = [];
  const positionOf = new Map<number, number>();
  let bucket: number | null = null;
  let previousClose: number | null = null;
  for (const r of market) {
    const t = parseExecutionTime(r.time);
    const b = num(r.bid);
    const a = num(r.ask);
    const m = num(r.mid);
    if (!Number.isFinite(t) || t < from || t > to || b === null || a === null || m === null) continue;
    const key = Math.floor(t / span);
    if (bucket === null || key !== bucket) {
      bucket = key;
      times.push(t);
      /* A bar opens where the last one closed (one mid per bar would make
         every one-minute candle flat). */
      const open: number = previousClose ?? m;
      candles.push([open, Math.max(a, open), Math.min(b, open), m]);
      bid.push(b); ask.push(a); mid.push(m);
      limit.push(null); avgFill.push(null); twap.push(null); pct.push(null);
    }
    const i = times.length - 1;
    const c = candles[i];
    c[1] = Math.max(c[1], a, m);
    c[2] = Math.min(c[2], b, m);
    c[3] = m;
    previousClose = m;
    /* A bucket shows its closing values. */
    bid[i] = b; ask[i] = a; mid[i] = m;
    if (num(r.twap) !== null) twap[i] = num(r.twap);
    const ob = barByTime.get(t);
    if (ob) {
      if (num(ob.limitPrice) !== null) limit[i] = num(ob.limitPrice);
      if (num(ob.avgFill) !== null) avgFill[i] = num(ob.avgFill);
      if (num(ob.pctDone) !== null) pct[i] = num(ob.pctDone);
    }
    positionOf.set(t, i);
  }
  if (times.length === 0) return null;

  /* A time that is not a bar's own (a state's end) lands on the last bar at
     or before it. */
  const positionAt = (t: number): number => {
    const exact = positionOf.get(t);
    if (exact !== undefined) return exact;
    let at = 0;
    for (let i = 0; i < times.length; i++) { if (times[i] <= t) at = i; else break; }
    return at;
  };

  const fillRows = (tableOf(dataset, "fills")?.rows ?? []).filter(forOrder);
  const volumeByVenue = new Map<string, number>();
  for (const r of fillRows) volumeByVenue.set(text(r.venue), (volumeByVenue.get(text(r.venue)) ?? 0) + (num(r.volume) ?? 0));
  const venues = [...volumeByVenue.entries()].sort((x, y) => y[1] - x[1]).map(([name]) => name);
  const selected = state[EXECUTION_KEYS.venue];
  const selectedVenue = selected && venues.includes(selected) ? selected : null;
  const fills: ExecutionFill[] = fillRows
    .map((r) => ({ r, t: parseExecutionTime(r.time) }))
    .filter(({ t }) => Number.isFinite(t) && t >= from && t <= to)
    .map(({ r, t }) => ({
      x: positionAt(t), time: t, price: num(r.price) ?? 0, volume: num(r.volume) ?? 0, venue: text(r.venue),
      passive: r.liquidity === "Passive", slippage: num(r.slippage) ?? 0,
      dim: selectedVenue !== null && r.venue !== selectedVenue,
    }));

  const bands: ExecutionBand[] = (tableOf(dataset, "states")?.rows ?? [])
    .filter(forOrder)
    .map((r) => ({ state: text(r.state), from: parseExecutionTime(r.from), to: parseExecutionTime(r.to) }))
    .filter((b) => Number.isFinite(b.from) && Number.isFinite(b.to) && b.to >= times[0] && b.from <= times[times.length - 1] + span)
    .map((b) => ({ state: b.state, from: positionAt(Math.max(b.from, times[0])), to: positionAt(b.to) }));

  const lastOf = (values: (number | null)[]): number | null => { for (let i = values.length - 1; i >= 0; i--) if (values[i] !== null) return values[i]; return null; };
  const n = times.length - 1;
  const arrivalMid = num(orderRow.arrivalMid);
  const riskTransfer = num(orderRow.riskTransfer);
  const pills: ExecutionPill[] = [];
  const pill = (key: ExecutionPill["key"], label: string, value: number | null) => { if (value !== null) pills.push({ key, label, value }); };
  pill("limit", "LMT", lastOf(limit));
  if (!hidden.includes("Benchmarks")) { pill("riskTransfer", "RTP", riskTransfer); pill("arrival", "ARR", arrivalMid); }
  if (!hidden.includes("Avg market fill")) pill("avg", "AVG", lastOf(avgFill));
  pill("bid", "BID", bid[n]);

  const [open, high, low, close] = candles[n];
  const before = n > 0 ? candles[n - 1][3] : open;
  return {
    pair: text(orderRow.pair, "Pair"),
    description: text(orderRow.description),
    order: { id: orderId, side: text(orderRow.side), status: text(orderRow.status), algo: text(orderRow.algo), pctDone: num(orderRow.pctDone) ?? 0, fills: num(orderRow.fills) ?? 0, fillsTarget: num(orderRow.fillsTarget) ?? 0 },
    orders: orderRows.map((r) => ({ id: text(r.order), side: text(r.side), status: text(r.status) })),
    interval, chartStyle, range, hidden,
    times, bid, ask, mid, candles, limit, avgFill, twap, pct,
    fills, bands, arrivalMid, riskTransfer, venues, selectedVenue, pills,
    last: { open, high, low, close, bid: bid[n], ask: ask[n], changePips: (close - before) * 10_000, changePct: before ? ((close - before) / before) * 100 : 0 },
  };
}

/* ── Formatting ── */

/** A price to five decimals. */
export const formatPrice = (v: number): string => v.toFixed(5);
/** A signed pip figure ("+0.43 pips"). */
export const formatPips = (v: number, unit = " pips"): string => `${v >= 0 ? "+" : ""}${v.toFixed(2)}${unit}`;

/** A quote split the way a dealer reads it: the handle, then the pips. */
export function splitQuote(price: number): { handle: string; pips: string } {
  const s = price.toFixed(5);
  return { handle: s.slice(0, 4), pips: s.slice(4) };
}

const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
const DAY = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
/** An axis label for a bar: the time within a day, the date across days. */
export function formatBarTime(t: number, acrossDays: boolean): string {
  return acrossDays ? DAY.format(t) : TIME.format(t);
}
/** A full label for a tooltip or a table row. */
export function formatBarStamp(t: number): string {
  return `${DAY.format(t)} ${TIME.format(t)}`;
}

/** The view's bars as rows (the expanded panel's table). */
export function executionRows(view: ExecutionView): Record<string, string | number | null>[] {
  const fillsAt = new Map<number, number>();
  for (const f of view.fills) fillsAt.set(f.x, (fillsAt.get(f.x) ?? 0) + f.volume);
  return view.times.map((t, i) => ({
    time: formatBarStamp(t), bid: view.bid[i], ask: view.ask[i], mid: view.mid[i],
    pctDone: view.pct[i], avgFill: view.avgFill[i], fill: fillsAt.get(i) ?? null,
  }));
}
