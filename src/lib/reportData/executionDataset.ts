/**
 * executionDataset - the sample dataset behind the FX Execution template.
 *
 * One currency pair over one session, and two algo orders worked in it: a
 * BUY still working and a SELL that filled. The market (bid, ask, mid) is
 * shared; each order has its own limit price, percent done, average fill,
 * fills and execution states. An hourly history before the session backs the
 * longer range presets.
 *
 * Everything is a row of a plain table, so the workbook a user downloads and
 * uploads redraws the page. Figures are invented and deterministic (seeded):
 * the page renders the same on every load and tests can assert on it. Venue
 * names and order ids are invented.
 */

import type { DataRow, DataTable, ReportDataset } from "./types";

export const EXECUTION_DATASET_ID = "execution";

/* ── Deterministic pseudo-random (mulberry32) ── */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const round = (v: number, places = 5): number => Number(v.toFixed(places));

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
/** Minutes of the focus session. */
const SESSION_BARS = 150;
/** Bar at which the session pauses (an inactive period follows). */
const PAUSE_AT = 130;
const SESSION_START = Date.UTC(2026, 0, 5, 9, 59);
const SESSION_RESUME = Date.UTC(2026, 0, 5, 16, 22);
const HISTORY_START = Date.UTC(2025, 9, 1);
const HOLIDAYS = new Set(["2025-12-25", "2025-12-26", "2026-01-01"]);
const HALF_SPREAD = 0.00004;

export const EXECUTION_PAIR = "EURUSD";
export const EXECUTION_ORDERS = ["FO-0002LQD", "FO-0002LQE"] as const;
export const EXECUTION_VENUES = ["Meridian Pool", "Apex ECN", "Harbor Spot", "Parity FX", "Crest Markets"] as const;
export const EXECUTION_STATES = ["Delay start", "Suspend", "Outside limit price"] as const;

/** "2026-01-05 09:59": the time format of every table (UTC). */
export function executionTime(ms: number): string {
  return new Date(ms).toISOString().slice(0, 16).replace("T", " ");
}
/** The reverse of executionTime; NaN for anything else. */
export function parseExecutionTime(v: unknown): number {
  return typeof v === "string" ? Date.parse(`${v.trim().replace(" ", "T")}:00Z`) : NaN;
}

const barTime = (i: number): number => (i < PAUSE_AT ? SESSION_START + i * MINUTE : SESSION_RESUME + (i - PAUSE_AT) * MINUTE);
const isTradingHour = (t: number): boolean => {
  const d = new Date(t);
  const dow = d.getUTCDay();
  return dow >= 1 && dow <= 5 && !HOLIDAYS.has(d.toISOString().slice(0, 10));
};

/* [state, from bar, to bar] for the working BUY order. */
const BUY_STATES: [state: (typeof EXECUTION_STATES)[number], from: number, to: number][] = [
  ["Delay start", 0, 18],
  ["Suspend", 55, 70],
  ["Outside limit price", 100, 118],
];
const stateAt = (i: number) => BUY_STATES.find(([, from, to]) => i >= from && i < to)?.[0] ?? null;

const pick = (weights: number[], r: number): number => {
  let cum = 0;
  for (let i = 0; i < weights.length; i++) {
    cum += weights[i];
    if (r < cum) return i;
  }
  return weights.length - 1;
};

interface Fill { bar: number; price: number; volume: number; venue: number; passive: boolean; slippage: number; markout: number }
interface OrderSeries {
  id: string; side: "BUY" | "SELL"; status: "Working" | "Filled";
  limit: (number | null)[]; pct: (number | null)[]; avgFill: (number | null)[];
  fills: Fill[]; arrivalMid: number; riskTransfer: number; clips: number; firstBar: number; lastBar: number;
}

function build(): { mid: number[]; history: { t: number; mid: number }[]; orders: OrderSeries[]; twap: number[] } {
  const rnd = seeded(20260105);
  const mid: number[] = [];
  const limit: number[] = [];
  const pct: number[] = [];
  let m = 1.3765;
  let p = 0;
  for (let i = 0; i < SESSION_BARS; i++) {
    m += (rnd() - 0.5) * 0.000045;
    mid.push(m);
    limit.push(i < 45 ? 1.37612 : i < 95 ? 1.37655 : 1.37699);
    const s = stateAt(i);
    const step = !s ? 0.42 + rnd() * 0.4 : s === "Outside limit price" ? 0.08 + rnd() * 0.15 : 0;
    p = Math.min(100, p + step);
    pct.push(p);
  }

  /* The BUY order: starts after its delay, fills in clips as it works. */
  const buyAvg: (number | null)[] = new Array(SESSION_BARS).fill(null);
  const buyFills: Fill[] = [];
  let af = mid[18] - 0.00003;
  let acc = 0;
  for (let i = 18; i < SESSION_BARS; i++) {
    af += (mid[i] - af) * 0.04 + (rnd() - 0.5) * 0.00001;
    buyAvg[i] = af;
    acc += pct[i] - pct[i - 1];
    if (acc > 3.5 + rnd() * 3) {
      buyFills.push({ bar: i, price: af + (rnd() - 0.5) * 0.00004, volume: 4 + rnd() * 9, venue: pick([0.45, 0.2, 0.12, 0.12, 0.11], rnd()), passive: rnd() < 0.65, slippage: 0, markout: 0 });
      acc = 0;
    }
  }

  /* Hourly history, walked backwards from the session's open. */
  const times: number[] = [];
  for (let t = HISTORY_START; t <= SESSION_START - HOUR; t += HOUR) if (isTradingHour(t)) times.push(t);
  const history: { t: number; mid: number }[] = new Array(times.length);
  let hm = mid[0];
  for (let j = times.length - 1; j >= 0; j--) {
    hm += (rnd() - 0.5) * 0.00035 + (1.3765 - hm) * 0.002;
    history[j] = { t: times[j], mid: hm };
  }

  const twap: number[] = [];
  let sum = 0;
  mid.forEach((v, i) => { sum += v; twap.push(sum / (i + 1)); });

  /* A BUY is better filled below the mid: positive = favourable, in pips. */
  for (const f of buyFills) {
    f.slippage = (mid[f.bar] - f.price) * 10_000;
    f.markout = (mid[Math.min(f.bar + 1, SESSION_BARS - 1)] - f.price) * 10_000;
  }

  /* The SELL order: works from the open and completes before the pause. */
  const rnd2 = seeded(20260106);
  const DONE_AT = 112;
  const sellLimit: (number | null)[] = new Array(SESSION_BARS).fill(null);
  const sellPct: (number | null)[] = new Array(SESSION_BARS).fill(null);
  const sellAvg: (number | null)[] = new Array(SESSION_BARS).fill(null);
  const sellFills: Fill[] = [];
  let sp = 0;
  let saf = mid[0] + 0.00002;
  let sacc = 0;
  for (let i = 0; i < DONE_AT; i++) {
    sellLimit[i] = i < 40 ? mid[0] - 0.00034 : i < 80 ? mid[0] - 0.00012 : mid[0] + 0.0001;
    const before = sp;
    sp = Math.min(100, sp + 0.75 + rnd2() * 0.55);
    sellPct[i] = sp;
    saf += (mid[i] - saf) * 0.05 + (rnd2() - 0.5) * 0.00001;
    sellAvg[i] = saf;
    sacc += sp - before;
    if (sacc > 4 + rnd2() * 3.5) {
      sellFills.push({ bar: i, price: saf + (rnd2() - 0.5) * 0.00004, volume: 6 + rnd2() * 12, venue: pick([0.18, 0.32, 0.1, 0.12, 0.28], rnd2()), passive: rnd2() < 0.55, slippage: 0, markout: 0 });
      sacc = 0;
    }
  }
  for (let i = DONE_AT; i < SESSION_BARS; i++) { sellPct[i] = 100; sellAvg[i] = saf; }
  for (const f of sellFills) {
    f.slippage = (f.price - mid[f.bar]) * 10_000;
    f.markout = (f.price - mid[Math.min(f.bar + 1, SESSION_BARS - 1)]) * 10_000;
  }

  const orders: OrderSeries[] = [
    { id: EXECUTION_ORDERS[0], side: "BUY", status: "Working", limit, pct, avgFill: buyAvg, fills: buyFills, arrivalMid: mid[18], riskTransfer: mid[18] + 0.00013, clips: 6, firstBar: 0, lastBar: SESSION_BARS - 1 },
    { id: EXECUTION_ORDERS[1], side: "SELL", status: "Filled", limit: sellLimit, pct: sellPct, avgFill: sellAvg, fills: sellFills, arrivalMid: mid[0], riskTransfer: mid[0] - 0.00013, clips: 9, firstBar: 0, lastBar: DONE_AT - 1 },
  ];
  return { mid, history, orders, twap };
}

function buildTables(): DataTable[] {
  const { mid, history, orders, twap } = build();

  const market: DataRow[] = [
    ...history.map((b) => ({ time: executionTime(b.t), period: "History", bid: round(b.mid - HALF_SPREAD), ask: round(b.mid + HALF_SPREAD), mid: round(b.mid), twap: null })),
    ...mid.map((v, i) => ({ time: executionTime(barTime(i)), period: "Session", bid: round(v - HALF_SPREAD), ask: round(v + HALF_SPREAD), mid: round(v), twap: round(twap[i]) })),
  ];

  const orderBars: DataRow[] = orders.flatMap((o) =>
    mid.map((_, i) => ({ order: o.id, time: executionTime(barTime(i)), limitPrice: o.limit[i] === null ? null : round(o.limit[i]!), pctDone: o.pct[i] === null ? null : round(o.pct[i]!, 2), avgFill: o.avgFill[i] === null ? null : round(o.avgFill[i]!) })),
  );

  const fills: DataRow[] = orders.flatMap((o) =>
    o.fills.map((f) => ({
      order: o.id, time: executionTime(barTime(f.bar)), venue: EXECUTION_VENUES[f.venue], liquidity: f.passive ? "Passive" : "Aggressive",
      price: round(f.price), volume: round(f.volume, 2), slippage: round(f.slippage, 2), markout: round(f.markout, 2),
    })),
  );

  const states: DataRow[] = BUY_STATES.map(([state, from, to]) => ({ order: EXECUTION_ORDERS[0], state, from: executionTime(barTime(from)), to: executionTime(barTime(to)) }));

  const orderRows: DataRow[] = orders.map((o) => {
    const volume = o.fills.reduce((a, f) => a + f.volume, 0);
    const passive = o.fills.filter((f) => f.passive).reduce((a, f) => a + f.volume, 0);
    const lastAvg = o.avgFill[o.lastBar] ?? 0;
    const sign = o.side === "BUY" ? 1 : -1;
    const minutes = Math.round((barTime(o.lastBar) - barTime(o.firstBar)) / MINUTE);
    const byVenue = EXECUTION_VENUES.map((_, v) => o.fills.filter((f) => f.venue === v).reduce((a, f) => a + f.volume, 0));
    return {
      order: o.id, pair: EXECUTION_PAIR, description: "EUR/USD (Bid)", side: o.side, status: o.status, algo: "Percentile",
      duration: `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`,
      amountDone: Math.round(volume * 1_000_000 / 12_500) * 12_500,
      clips: o.clips,
      fills: o.fills.length,
      fillsTarget: o.status === "Filled" ? o.fills.length : 270,
      pctDone: round(o.pct[o.lastBar] ?? 0, 0),
      passivePct: round((passive / volume) * 100, 2),
      aggressivePct: round(100 - (passive / volume) * 100, 2),
      /* Pips; positive is favourable for the order's side. */
      slippageArrival: round((o.arrivalMid - lastAvg) * 10_000 * sign, 2),
      fillVsTwap: round((twap[o.lastBar] - lastAvg) * 10_000 * sign, 2),
      arrivalMid: round(o.arrivalMid),
      riskTransfer: round(o.riskTransfer),
      topVenue: EXECUTION_VENUES[byVenue.indexOf(Math.max(...byVenue))],
    };
  });

  return [
    {
      id: "orders", label: "Orders", grain: "One row per order",
      fields: [
        { key: "order", label: "Order", role: "dimension" },
        { key: "pair", label: "Pair", role: "dimension" },
        { key: "description", label: "Description", role: "dimension" },
        { key: "side", label: "Side", role: "dimension", help: "BUY or SELL." },
        { key: "status", label: "Status", role: "dimension", help: "Working or Filled." },
        { key: "algo", label: "Algo", role: "dimension" },
        { key: "duration", label: "Duration", role: "dimension" },
        { key: "topVenue", label: "Top venue", role: "dimension" },
        { key: "amountDone", label: "Amount done", role: "measure", help: "In the base currency of the pair." },
        { key: "clips", label: "Number of clips", role: "measure" },
        { key: "fills", label: "Number of fills", role: "measure" },
        { key: "fillsTarget", label: "Expected fills", role: "measure" },
        { key: "pctDone", label: "Percent done", role: "measure", format: "percent" },
        { key: "passivePct", label: "Passive %", role: "measure", format: "percent" },
        { key: "aggressivePct", label: "Aggressive %", role: "measure", format: "percent" },
        { key: "slippageArrival", label: "Slippage vs arrival", role: "measure", help: "Pips; positive is favourable." },
        { key: "fillVsTwap", label: "Avg fill vs TWAP", role: "measure", help: "Pips; positive is favourable." },
        { key: "arrivalMid", label: "Arrival mid", role: "measure" },
        { key: "riskTransfer", label: "Risk transfer price", role: "measure" },
      ],
      rows: orderRows,
    },
    {
      id: "market", label: "Market", grain: "One row per bar: hourly history, then one-minute bars for the session",
      fields: [
        { key: "time", label: "Time", role: "dimension", help: "UTC, as YYYY-MM-DD HH:MM. Rows are read in the order given." },
        { key: "period", label: "Period", role: "dimension", help: "History or Session." },
        { key: "bid", label: "Bid", role: "measure" },
        { key: "ask", label: "Ask", role: "measure" },
        { key: "mid", label: "Mid", role: "measure" },
        { key: "twap", label: "Session TWAP", role: "measure" },
      ],
      rows: market,
    },
    {
      id: "orderBars", label: "Order bars", grain: "One row per order and session bar",
      fields: [
        { key: "order", label: "Order", role: "dimension" },
        { key: "time", label: "Time", role: "dimension", help: "Matches a Session row of the Market sheet." },
        { key: "limitPrice", label: "Limit price", role: "measure" },
        { key: "pctDone", label: "Percent done", role: "measure", format: "percent" },
        { key: "avgFill", label: "Average fill", role: "measure" },
      ],
      rows: orderBars,
    },
    {
      id: "fills", label: "Fills", grain: "One row per fill",
      fields: [
        { key: "order", label: "Order", role: "dimension" },
        { key: "time", label: "Time", role: "dimension" },
        { key: "venue", label: "Venue", role: "dimension" },
        { key: "liquidity", label: "Liquidity", role: "dimension", help: "Passive or Aggressive." },
        { key: "price", label: "Price", role: "measure" },
        { key: "volume", label: "Volume (m)", role: "measure", help: "Millions of the base currency." },
        { key: "slippage", label: "Spread capture", role: "measure", help: "Pips against the mid at the fill; positive is favourable." },
        { key: "markout", label: "Markout", role: "measure", help: "Pips against the mid one bar later." },
      ],
      rows: fills,
    },
    {
      id: "states", label: "Execution states", grain: "One row per order and state period",
      fields: [
        { key: "order", label: "Order", role: "dimension" },
        { key: "state", label: "State", role: "dimension", help: "Delay start, Suspend or Outside limit price." },
        { key: "from", label: "From", role: "dimension" },
        { key: "to", label: "To", role: "dimension" },
      ],
      rows: states,
    },
  ];
}

let cached: ReportDataset | null = null;

/** The sample execution dataset. Built once; treat it as read-only. */
export function executionDataset(): ReportDataset {
  if (cached) return cached;
  cached = { id: EXECUTION_DATASET_ID, label: "FX execution", baseCurrency: "EUR", tables: buildTables() };
  return cached;
}
