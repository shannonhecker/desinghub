/**
 * executionOrders - the FX Execution template's sample order workflow, as data.
 *
 * Pure. A ticket is a draft of text fields; `validateTicket` checks it (a
 * positive finite notional, a price inside a sane band of the market) and
 * returns the sample order it describes. `amendLimit` lays the reader's
 * limit-price amendments over a resolved view: the limit series gains a
 * step at the bar the amendment was made on, and the LMT tag follows.
 * `compareOrders` is the ten measures of the Compare dialog.
 *
 * Sample data only. Nothing here, or anywhere in the workflow, sends an
 * order: a confirmed ticket or amendment only changes what this tab shows
 * until the feed is reset.
 * Design note: docs/superpowers/specs/2026-10-06-fx-execution-trading-design.md (PR D)
 */

import type { ExecutionView } from "./executionModel";
import { parseExecutionTime } from "./reportData/executionDataset";
import { tableOf, type DataRow, type ReportDataset } from "./reportData/types";

/** What every confirmation says, word for word. */
export const SAMPLE_CONFIRMATION = "Sample order. Nothing was sent.";
/** A tenth of a pip: the price grid of every ticket, drag and amendment. */
export const PRICE_STEP = 0.00001;
/** A price may be at most this share of the market away from it. */
export const PRICE_BAND = 0.01;
/** Arrow keys step a tenth of a pip; with Shift, a pip. */
const LARGE_STEP = 10;

export const ORDER_TYPES = ["Limit", "Market", "Stop", "Take profit"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];
export const START_OPTIONS = ["Now", "Delayed"] as const;
export const GOOD_TILL = ["GTC", "GTD", "Day"] as const;
/** The sample account every ticket books to (invented). */
export const SAMPLE_ACCOUNT = "MA-SAMPLE-01";
export type Side = "BUY" | "SELL";

export interface Market { bid: number; ask: number }

/** A ticket as the reader edits it: text fields, validated on Submit. */
export interface TicketDraft {
  side: Side;
  type: OrderType;
  venue: string;
  notional: string;
  price: string;
  iceberg: string;
  start: (typeof START_OPTIONS)[number];
  goodTill: (typeof GOOD_TILL)[number];
}

/** A ticket that passed validation. */
export interface SampleOrder {
  side: Side;
  type: OrderType;
  venue: string;
  notional: number;
  price: number;
  iceberg: number | null;
  start: string;
  goodTill: string;
}

export type TicketErrors = Partial<Record<"notional" | "price" | "iceberg", string>>;

const decimals = (v: number) => v.toFixed(5);

/** A price on the 0.00001 grid, without float residue (1.37654, not 1.3765400000000001). */
export function snapPrice(value: number): number {
  return Number((Math.round(value / PRICE_STEP) * PRICE_STEP).toFixed(5));
}

/** One step up or down the grid; `large` steps a pip. */
export function stepPrice(price: number, direction: 1 | -1, large = false): number {
  return snapPrice(price + direction * PRICE_STEP * (large ? LARGE_STEP : 1));
}

/** "1,000,000", "2500000", "1.5m", "250k" as a number; null for anything else. */
export function parseAmount(text: string): number | null {
  const t = text.trim().toLowerCase().replace(/,/g, "");
  const m = /^(-?\d+(?:\.\d+)?)([km]?)$/.exec(t);
  if (!m) return null;
  const value = Number(m[1]) * (m[2] === "m" ? 1_000_000 : m[2] === "k" ? 1_000 : 1);
  return Number.isFinite(value) ? value : null;
}

/** A price typed by the reader, snapped; null for text or a non-finite value. */
export function parsePrice(text: string): number | null {
  const t = text.trim();
  if (!/^\d+(?:\.\d+)?$/.test(t)) return null;
  const value = Number(t);
  return Number.isFinite(value) ? snapPrice(value) : null;
}

export const formatAmount = (value: number): string => Math.round(value).toLocaleString("en-US");

/** The prices a ticket or amendment may use: one percent either side of the mid. */
export function priceBand(market: Market): { min: number; max: number } {
  const mid = (market.bid + market.ask) / 2;
  return { min: snapPrice(mid * (1 - PRICE_BAND)), max: snapPrice(mid * (1 + PRICE_BAND)) };
}

/** The order type a ticket opens with: the caller's, else the original's
 *  convention (a SELL is a stop, a BUY a limit). */
export function defaultOrderType(side: Side, requested?: OrderType): OrderType {
  return requested ?? (side === "SELL" ? "Stop" : "Limit");
}

/** A fresh ticket for a side at a price. */
export function draftTicket({ side, price, type, venue = "" }: { side: Side; price: number; market: Market; type?: OrderType; venue?: string }): TicketDraft {
  return { side, type: defaultOrderType(side, type), venue, notional: formatAmount(1_000_000), price: decimals(snapPrice(price)), iceberg: "", start: "Now", goodTill: "GTC" };
}

function checkPrice(text: string, market: Market): { price: number } | { error: string } {
  const price = parsePrice(text);
  const band = priceBand(market);
  if (price === null) return { error: "Enter a price, like 1.37650." };
  if (price < band.min || price > band.max) return { error: `Enter a price between ${decimals(band.min)} and ${decimals(band.max)}.` };
  return { price };
}

/** Check a ticket. On success, the sample order it describes. */
export function validateTicket(draft: TicketDraft, market: Market): { ok: true; order: SampleOrder } | { ok: false; errors: TicketErrors } {
  const errors: TicketErrors = {};
  const notional = parseAmount(draft.notional);
  if (notional === null || !(notional > 0)) errors.notional = "Enter a notional above zero, like 1,000,000.";
  let price = draft.side === "BUY" ? market.ask : market.bid;
  if (draft.type !== "Market") {
    const checked = checkPrice(draft.price, market);
    if ("error" in checked) errors.price = checked.error;
    else price = checked.price;
  }
  let iceberg: number | null = null;
  if (draft.iceberg.trim()) {
    iceberg = parseAmount(draft.iceberg);
    if (iceberg === null || !(iceberg > 0)) errors.iceberg = "Enter an iceberg above zero, or leave it empty.";
    else if (notional !== null && iceberg > notional) errors.iceberg = "The iceberg can't be larger than the notional.";
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, order: { side: draft.side, type: draft.type, venue: draft.venue, notional: notional!, price, iceberg, start: draft.start, goodTill: draft.goodTill } };
}

/** The BID tag dropped at a price: above the market stages a SELL take
 *  profit, below it a BUY limit (as in the original). */
export function stagedTicket(price: number, market: number): { side: Side; type: OrderType; price: number } {
  const p = snapPrice(price);
  return p >= market ? { side: "SELL", type: "Take profit", price: p } : { side: "BUY", type: "Limit", price: p };
}

/* ── Amendments ── */

/** A filled order is history: only a working one can be amended. */
export const canAmend = (order: { status: string }): boolean => order.status !== "Filled";

/** Check a new limit price for an order. */
export function validateAmendment(order: { status: string }, text: string, market: Market): { ok: true; price: number } | { ok: false; error: string } {
  if (!canAmend(order)) return { ok: false, error: "This order is filled, so its limit can't be amended." };
  const checked = checkPrice(text, market);
  return "error" in checked ? { ok: false, error: checked.error } : { ok: true, price: checked.price };
}

/** A confirmed amendment: from the bar starting at `time` (UTC ms) on, the
 *  order's limit is `price`. */
export interface Amendment { order: string; time: number; price: number }

/** The view with the amendments for its order laid over its limit series
 *  (a copy; the view itself when nothing applies). Each amendment holds from
 *  the bar that contains its time; a later one takes over from its own bar. */
export function amendLimit(view: ExecutionView, amendments: readonly Amendment[]): ExecutionView {
  if (!canAmend(view.order)) return view;
  const mine = amendments.filter((a) => a.order === view.order.id).sort((a, b) => a.time - b.time);
  if (mine.length === 0) return view;
  const limit = view.limit.slice();
  let changed = false;
  for (const a of mine) {
    /* The bar that holds the amended minute: the last one starting at or before it. */
    let from = -1;
    for (let i = view.times.length - 1; i >= 0; i--) if (view.times[i] <= a.time) { from = i; break; }
    if (from < 0 || (from === view.times.length - 1 && a.time - view.times[from] > bucketSpan(view))) continue;
    for (let i = from; i < limit.length; i++) if (limit[i] !== null) { limit[i] = a.price; changed = true; }
  }
  if (!changed) return view;
  let last: number | null = null;
  for (let i = limit.length - 1; i >= 0 && last === null; i--) last = limit[i];
  const pills = view.pills.map((p) => (p.key === "limit" && last !== null ? { ...p, value: last } : p));
  return { ...view, limit, pills };
}

/** How long one bar of the view lasts (the gap between two bars, at least a minute). */
function bucketSpan(view: ExecutionView): number {
  const n = view.times.length;
  const gap = n > 1 ? view.times[n - 1] - view.times[n - 2] : 60_000;
  return Math.max(60_000, gap) - 1;
}

/* ── Compare ── */

export const COMPARE_MEASURES = [
  "Status", "Duration", "Amount done", "Fills", "Passive %", "Slippage vs arrival", "Avg fill vs TWAP", "Avg spread capture", "Avg 1-bar markout", "Top venue",
] as const;

export type Tone = "up" | "down" | "flat";
export interface CompareTable {
  orders: { id: string; side: string; status: string }[];
  rows: { measure: (typeof COMPARE_MEASURES)[number]; values: string[]; tones?: Tone[] }[];
}

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const pips = (v: number): string => {
  const r = Math.round(v * 100) / 100;
  return r === 0 ? "0.00 pips" : `${r > 0 ? "+" : "-"}${Math.abs(r).toFixed(2)} pips`;
};
const toneOf = (text: string): Tone => (text.startsWith("+") ? "up" : text.startsWith("-") ? "down" : "flat");

/** The Compare dialog's table: ten measures for each order, read from the
 *  orders table and averaged over each order's fills. Pass the dataset with
 *  the feed laid over it and the shown order's figures follow the feed. */
export function compareOrders(dataset: ReportDataset): CompareTable {
  const orders = tableOf(dataset, "orders")?.rows ?? [];
  const fills = tableOf(dataset, "fills")?.rows ?? [];
  const per = orders.map((o) => {
    const mine = fills.filter((f) => f.order === o.order);
    const mean = (k: string) => (mine.length ? mine.reduce((a, f) => a + num(f[k]), 0) / mine.length : 0);
    const total = mine.reduce((a, f) => a + num(f.volume), 0);
    const byVenue = new Map<string, number>();
    for (const f of mine) byVenue.set(String(f.venue), (byVenue.get(String(f.venue)) ?? 0) + num(f.volume));
    const [topName, topVolume] = [...byVenue.entries()].sort((a, b) => b[1] - a[1])[0] ?? [String(o.topVenue ?? ""), 0];
    return {
      Status: String(o.status ?? ""),
      Duration: String(o.duration ?? ""),
      "Amount done": `EUR ${formatAmount(num(o.amountDone))}`,
      Fills: String(Math.round(num(o.fills))),
      "Passive %": `${num(o.passivePct).toFixed(1)} %`,
      "Slippage vs arrival": pips(num(o.slippageArrival)),
      "Avg fill vs TWAP": pips(num(o.fillVsTwap)),
      "Avg spread capture": pips(mean("slippage")),
      "Avg 1-bar markout": pips(mean("markout")),
      "Top venue": total > 0 ? `${topName} ${((topVolume / total) * 100).toFixed(1)}%` : topName,
    } as Record<(typeof COMPARE_MEASURES)[number], string>;
  });
  const signed = new Set<string>(["Slippage vs arrival", "Avg fill vs TWAP", "Avg spread capture", "Avg 1-bar markout"]);
  return {
    orders: orders.map((o) => ({ id: String(o.order), side: String(o.side), status: String(o.status) })),
    rows: COMPARE_MEASURES.map((measure) => {
      const values = per.map((p) => p[measure]);
      return signed.has(measure) ? { measure, values, tones: values.map(toneOf) } : { measure, values };
    }),
  };
}

/** Each order's percent done over the session, by session bar (the Compare
 *  dialog's small chart): x is the bar's position, so the inactive gap in
 *  the clock takes no room, as on the main chart. */
export function percentDoneSeries(dataset: ReportDataset): { id: string; side: string; points: [number, number][] }[] {
  const orders = tableOf(dataset, "orders")?.rows ?? [];
  const bars = tableOf(dataset, "orderBars")?.rows ?? [];
  return orders.map((o) => {
    const mine = bars
      .filter((b: DataRow) => b.order === o.order && typeof b.pctDone === "number")
      .sort((a, b) => parseExecutionTime(a.time) - parseExecutionTime(b.time));
    return { id: String(o.order), side: String(o.side), points: mine.map((b, i): [number, number] => [i, num(b.pctDone)]) };
  });
}
