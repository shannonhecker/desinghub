/**
 * executionFeed - the FX Execution template's sample live feed, as data.
 *
 * Pure. `createTicker(view, seed)` continues a session one bar at a time:
 * every `next()` is the next one-minute bar (a random walk of the mid, the
 * bid and ask around it, the session TWAP) and, for a working order, its
 * limit price, average fill, percent done and now and then a fill. The same
 * view and seed always give the same bars. A filled order's own series stay
 * where they ended (`null`); only the market moves.
 *
 * `withFeed(dataset, order, samples)` lays the bars over a COPY of the
 * dataset so the blocks that read tables (the header, the statistics, the
 * gauge, the donut) can follow the feed. The bars are session-only: they are
 * never written to the dataset, the cloud snapshot, a share or an export.
 *
 * Sample data only: nothing here connects to a market or sends an order.
 * Design note: docs/superpowers/specs/2026-10-06-fx-execution-trading-design.md (PR A)
 */

import { EXECUTION_KEYS, resolveExecution, type ExecutionView } from "./executionModel";
import { executionTime, MINUTE, seeded } from "./reportData/executionDataset";
import type { ReportState } from "./reportData/binding";
import { tableOf, type DataRow, type ReportDataset } from "./reportData/types";

/** The seed every session starts from (and Reset returns to). */
export const FEED_SEED = 20260107;
/** One new bar per this many milliseconds while the feed is live. */
export const FEED_TICK_MS = 1000;
/** The feed stops after this many bars (a day of one-minute bars); Reset starts it again. */
export const FEED_MAX_BARS = 1440;

const HALF_SPREAD = 0.00004;
/** Size of one step of the mid's random walk. */
const WALK = 0.000045;
/** Share of the order each bar works, and the share between two fills. */
const STEP_MIN = 0.05;
const STEP_SPAN = 0.2;
const CLIP_MIN = 2.5;
const CLIP_SPAN = 2.5;
/** How likely a fill takes the largest venue, the next, and so on. */
const VENUE_WEIGHTS = [0.4, 0.22, 0.15, 0.12, 0.11];
const PIP = 10_000;

const round = (v: number, places = 5): number => Number(v.toFixed(places));

export interface FeedFill {
  price: number;
  /** Millions of the base currency. */
  volume: number;
  venue: string;
  passive: boolean;
  /** Pips against the mid; positive is favourable for the order's side. */
  slippage: number;
  markout: number;
}

export interface FeedSample {
  /** 1 for the first bar of the feed, then 2, 3 ... */
  step: number;
  /** Start of the bar (UTC ms), one minute after the one before. */
  time: number;
  bid: number;
  ask: number;
  mid: number;
  /** Session TWAP including this bar. */
  twap: number;
  /** The order's own series: null once it is filled (they freeze). */
  limit: number | null;
  avgFill: number | null;
  pct: number | null;
  fill: FeedFill | null;
}

export interface Ticker {
  /** The order the ticker works. */
  readonly order: string;
  next(): FeedSample;
}

/** The view a ticker continues: the selected order over the session, one
 *  bar a minute, whatever interval or range the chart is showing. */
export function feedBaseView(dataset: ReportDataset, state: ReportState): ExecutionView | null {
  return resolveExecution(dataset, { ...state, [EXECUTION_KEYS.interval]: "1m", [EXECUTION_KEYS.range]: "1D" });
}

/** The order the page shows (the state's, else the first), as resolveExecution picks it. */
export function executionOrderOf(dataset: ReportDataset, state: ReportState): string | null {
  const rows = tableOf(dataset, "orders")?.rows ?? [];
  const row = rows.find((r) => r.order === state[EXECUTION_KEYS.order]) ?? rows[0];
  return row && typeof row.order === "string" ? row.order : null;
}

/** True unless the report has the feed switched off. */
export const feedSwitchedOn = (state: ReportState): boolean => state[EXECUTION_KEYS.live] !== "Off";

const lastOf = (values: (number | null)[]): number | null => {
  for (let i = values.length - 1; i >= 0; i--) if (values[i] !== null) return values[i];
  return null;
};

function pickVenue(venues: string[], r: number): string {
  const weights = VENUE_WEIGHTS.slice(0, venues.length);
  const total = weights.reduce((a, w) => a + w, 0);
  let cum = 0;
  for (let i = 0; i < weights.length; i++) {
    cum += weights[i] / total;
    if (r < cum) return venues[i];
  }
  return venues[venues.length - 1];
}

/** A ticker that continues `view` (see feedBaseView) from its last bar. */
export function createTicker(view: ExecutionView, seed: number = FEED_SEED): Ticker {
  const rnd = seeded(seed);
  const n = view.times.length - 1;
  let time = view.times[n];
  let mid = view.mid[n];
  let twapCount = view.times.length;
  let twapSum = (lastOf(view.twap) ?? mid) * twapCount;
  let pct = lastOf(view.pct) ?? 0;
  let avgFill = lastOf(view.avgFill) ?? mid;
  const limit = lastOf(view.limit);
  const working = view.order.status !== "Filled" && pct < 100;
  const sign = view.order.side === "SELL" ? -1 : 1;
  const venues = view.venues.length ? view.venues : ["Venue"];
  let worked = 0;
  let step = 0;

  return {
    order: view.order.id,
    next(): FeedSample {
      step += 1;
      time += MINUTE;
      mid += (rnd() - 0.5) * WALK;
      const m = round(mid);
      twapSum += m;
      twapCount += 1;
      const sample: FeedSample = {
        step, time, bid: round(m - HALF_SPREAD), ask: round(m + HALF_SPREAD), mid: m, twap: round(twapSum / twapCount),
        limit: null, avgFill: null, pct: null, fill: null,
      };
      if (!working) return sample;

      avgFill += (m - avgFill) * 0.04 + (rnd() - 0.5) * 0.00001;
      const progress = pct < 100 ? STEP_MIN + rnd() * STEP_SPAN : 0;
      pct = Math.min(100, pct + progress);
      worked += progress;
      if (pct < 100 && worked > CLIP_MIN + rnd() * CLIP_SPAN) {
        const price = round(avgFill + (rnd() - 0.5) * 0.00004);
        const slippage = round((m - price) * PIP * sign, 2);
        sample.fill = { price, volume: round(4 + rnd() * 9, 2), venue: pickVenue(venues, rnd()), passive: rnd() < 0.65, slippage, markout: slippage };
        worked = 0;
      }
      sample.limit = limit;
      sample.avgFill = round(avgFill);
      sample.pct = round(pct, 2);
      return sample;
    },
  };
}

/* ── The feed laid over the tables ── */

function durationMinutes(text: unknown): number | null {
  const m = typeof text === "string" ? /^(\d+)h (\d+)m$/.exec(text) : null;
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
const formatDuration = (minutes: number): string => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;

/** The dataset with the feed's bars appended, for `order`; the dataset
 *  itself when there are none. Never writes to `dataset`. */
export function withFeed(dataset: ReportDataset, order: string, samples: readonly FeedSample[]): ReportDataset {
  if (samples.length === 0) return dataset;
  const marketRows: DataRow[] = samples.map((s) => ({ time: executionTime(s.time), period: "Session", bid: s.bid, ask: s.ask, mid: s.mid, twap: s.twap }));
  const worked = samples.filter((s) => s.pct !== null);
  const barRows: DataRow[] = worked.map((s) => ({ order, time: executionTime(s.time), limitPrice: s.limit, pctDone: s.pct, avgFill: s.avgFill }));
  const fillRows: DataRow[] = samples.flatMap((s) => (s.fill ? [{
    order, time: executionTime(s.time), venue: s.fill.venue, liquidity: s.fill.passive ? "Passive" : "Aggressive",
    price: s.fill.price, volume: s.fill.volume, slippage: s.fill.slippage, markout: s.fill.markout,
  }] : []));

  const tables = dataset.tables.map((t) => {
    if (t.id === "market") return { ...t, rows: [...t.rows, ...marketRows] };
    if (t.id === "orderBars" && barRows.length) return { ...t, rows: [...t.rows, ...barRows] };
    if (t.id === "fills" && fillRows.length) return { ...t, rows: [...t.rows, ...fillRows] };
    if (t.id === "orders" && worked.length) {
      const allFills = [...(tableOf(dataset, "fills")?.rows ?? []).filter((r) => r.order === order), ...fillRows];
      return { ...t, rows: t.rows.map((r) => (r.order === order ? orderFollowingFeed(r, allFills, worked, samples[samples.length - 1]) : r)) };
    }
    return t;
  });
  return { ...dataset, tables };
}

/** An order's statistics after the feed has worked it further. */
function orderFollowingFeed(row: DataRow, fills: DataRow[], worked: FeedSample[], last: FeedSample): DataRow {
  const lastWorked = worked[worked.length - 1];
  const sign = row.side === "SELL" ? -1 : 1;
  const volume = fills.reduce((a, f) => a + (Number(f.volume) || 0), 0);
  const passive = fills.filter((f) => f.liquidity === "Passive").reduce((a, f) => a + (Number(f.volume) || 0), 0);
  const passivePct = volume ? round((passive / volume) * 100, 2) : 0;
  const byVenue = new Map<string, number>();
  for (const f of fills) byVenue.set(String(f.venue), (byVenue.get(String(f.venue)) ?? 0) + (Number(f.volume) || 0));
  const topVenue = [...byVenue.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? row.topVenue;
  const avg = lastWorked.avgFill ?? 0;
  const arrival = Number(row.arrivalMid);
  const minutes = durationMinutes(row.duration);
  return {
    ...row,
    status: lastWorked.pct === 100 ? "Filled" : row.status,
    duration: minutes === null ? row.duration : formatDuration(minutes + worked.length),
    amountDone: Math.round((volume * 1_000_000) / 12_500) * 12_500,
    fills: fills.length,
    pctDone: round(lastWorked.pct ?? 0, 0),
    passivePct,
    aggressivePct: round(100 - passivePct, 2),
    slippageArrival: Number.isFinite(arrival) ? round((arrival - avg) * PIP * sign, 2) : row.slippageArrival,
    fillVsTwap: round((last.twap - avg) * PIP * sign, 2),
    topVenue,
  };
}
