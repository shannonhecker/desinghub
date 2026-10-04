import { describe, it, expect } from "vitest";
import { executionDataset, EXECUTION_ORDERS, EXECUTION_VENUES, parseExecutionTime, executionTime } from "../reportData/executionDataset";
import { sampleDataset } from "../reportData/registry";
import { tableOf } from "../reportData/types";
import { EXECUTION_KEYS, executionRows, formatPips, hiddenOverlays, resolveExecution, splitQuote, toggleOverlay } from "../executionModel";

const dataset = executionDataset();
const view = (state: Record<string, string> = {}) => resolveExecution(dataset, state)!;

describe("execution dataset", () => {
  it("is registered, deterministic, and holds a session, a history and two orders", () => {
    expect(sampleDataset("execution")).toBe(dataset);
    expect(dataset.tables.map((t) => t.id)).toEqual(["orders", "market", "orderBars", "fills", "states"]);
    const market = tableOf(dataset, "market")!.rows;
    expect(market.filter((r) => r.period === "Session")).toHaveLength(150);
    expect(market.filter((r) => r.period === "History").length).toBeGreaterThan(1000);
    expect(tableOf(dataset, "orders")!.rows.map((r) => [r.order, r.side, r.status])).toEqual([[EXECUTION_ORDERS[0], "BUY", "Working"], [EXECUTION_ORDERS[1], "SELL", "Filled"]]);
    /* Every value a field declares is present; times round-trip. */
    for (const t of dataset.tables) for (const r of t.rows) for (const f of t.fields) expect(r, `${t.id}.${f.key}`).toHaveProperty(f.key);
    expect(executionTime(parseExecutionTime("2026-01-05 09:59"))).toBe("2026-01-05 09:59");
  });

  it("an order's statistics agree with its fills", () => {
    for (const order of tableOf(dataset, "orders")!.rows) {
      const fills = tableOf(dataset, "fills")!.rows.filter((f) => f.order === order.order);
      expect(order.fills).toBe(fills.length);
      const volume = fills.reduce((a, f) => a + Number(f.volume), 0);
      const passive = fills.filter((f) => f.liquidity === "Passive").reduce((a, f) => a + Number(f.volume), 0);
      expect(Number(order.passivePct)).toBeCloseTo((passive / volume) * 100, 1);
      expect(Number(order.passivePct) + Number(order.aggressivePct)).toBeCloseTo(100, 1);
      expect(EXECUTION_VENUES).toContain(order.topVenue);
    }
  });
});

describe("resolveExecution", () => {
  it("at rest: the working order over the session, one bar a minute, as lines", () => {
    const v = view();
    expect(v.order).toMatchObject({ id: EXECUTION_ORDERS[0], side: "BUY", status: "Working" });
    expect([v.interval, v.chartStyle, v.range]).toEqual(["1m", "Line", "1D"]);
    expect(v.times).toHaveLength(150);
    expect(v.bid.every((b, i) => b < v.mid[i] && v.mid[i] < v.ask[i])).toBe(true);
    /* The order starts after its delay: no average fill before then. */
    expect(v.avgFill.slice(0, 18).every((x) => x === null)).toBe(true);
    expect(v.avgFill[18]).not.toBeNull();
    expect(v.bands.map((b) => [b.state, b.from, b.to])).toEqual([["Delay start", 0, 18], ["Suspend", 55, 70], ["Outside limit price", 100, 118]]);
    expect(v.pills.map((p) => p.label)).toEqual(["LMT", "RTP", "ARR", "AVG", "BID"]);
    expect(v.fills.length).toBe(v.order.fills);
    expect(v.fills.every((f) => !f.dim && f.x >= 18 && f.x < 150)).toBe(true);
  });

  it("interval groups the bars; a bar shows its closing values and a real range", () => {
    const one = view();
    const five = view({ [EXECUTION_KEYS.interval]: "5m" });
    expect(five.times.length).toBeLessThan(one.times.length / 4);
    expect(five.mid[five.mid.length - 1]).toBe(one.mid[one.mid.length - 1]);
    for (const [o, h, l, c] of five.candles) { expect(h).toBeGreaterThanOrEqual(Math.max(o, c)); expect(l).toBeLessThanOrEqual(Math.min(o, c)); }
    /* Every fill still lands on a bar. */
    expect(five.fills.every((f) => f.x >= 0 && f.x < five.times.length)).toBe(true);
    expect(five.fills).toHaveLength(one.fills.length);
  });

  it("range reaches back into the history; Order trims to the order's own bars", () => {
    const day = view();
    const week = view({ [EXECUTION_KEYS.range]: "1W" });
    const quarter = view({ [EXECUTION_KEYS.range]: "3M" });
    expect(week.times.length).toBeGreaterThan(day.times.length);
    expect(quarter.times.length).toBeGreaterThan(week.times.length);
    /* The session is still at the end, with the order's series on it. */
    expect(week.pct[week.pct.length - 1]).toBe(day.pct[day.pct.length - 1]);
    expect(week.bands).toHaveLength(3);
    const sell = view({ [EXECUTION_KEYS.order]: EXECUTION_ORDERS[1], [EXECUTION_KEYS.range]: "Order" });
    expect(sell.times).toHaveLength(112);
    expect(sell.pct[sell.pct.length - 1]).toBe(100);
  });

  it("the other order: its own series, fills and benchmarks, no states", () => {
    const sell = view({ [EXECUTION_KEYS.order]: EXECUTION_ORDERS[1] });
    expect(sell.order).toMatchObject({ side: "SELL", status: "Filled", pctDone: 100 });
    expect(sell.bands).toEqual([]);
    expect(sell.arrivalMid).not.toBe(view().arrivalMid);
    expect(sell.mid).toEqual(view().mid);
  });

  it("selecting a venue dims the others' fills", () => {
    const v = view();
    const venue = v.venues[0];
    const picked = view({ [EXECUTION_KEYS.venue]: venue });
    expect(picked.selectedVenue).toBe(venue);
    expect(picked.fills.filter((f) => !f.dim).every((f) => f.venue === venue)).toBe(true);
    expect(picked.fills.some((f) => f.dim)).toBe(true);
    /* A venue that is not this order's selects nothing. */
    expect(view({ [EXECUTION_KEYS.venue]: "Nowhere" }).selectedVenue).toBeNull();
  });

  it("hidden overlays leave the pills they own", () => {
    const hidden = view({ [EXECUTION_KEYS.hidden]: "Benchmarks, avg market fill" });
    expect(hidden.hidden).toEqual(["Avg market fill", "Benchmarks"]);
    expect(hidden.pills.map((p) => p.label)).toEqual(["LMT", "BID"]);
    expect(hiddenOverlays(toggleOverlay("Volume", "Gridlines"))).toEqual(["Volume", "Gridlines"]);
    expect(toggleOverlay("Volume, Gridlines", "Volume")).toBe("Gridlines");
  });

  it("an unknown choice falls back; an empty dataset draws nothing", () => {
    expect(view({ [EXECUTION_KEYS.interval]: "7m", [EXECUTION_KEYS.chart]: "Bars", [EXECUTION_KEYS.range]: "9Y", [EXECUTION_KEYS.order]: "X" })).toMatchObject({ interval: "1m", chartStyle: "Line", range: "1D", order: { id: EXECUTION_ORDERS[0] } });
    expect(resolveExecution({ ...dataset, tables: [] }, {})).toBeNull();
  });

  it("the header's last bar, the rows of the table, and the formats", () => {
    const v = view();
    expect(v.last!.close).toBe(v.mid[149]);
    expect(v.last!.changePips).toBeCloseTo((v.mid[149] - v.mid[148]) * 10_000, 6);
    const rows = executionRows(v);
    expect(rows).toHaveLength(150);
    expect(Object.keys(rows[0])).toEqual(["time", "bid", "ask", "mid", "pctDone", "avgFill", "fill"]);
    expect(rows.filter((r) => r.fill !== null).length).toBeGreaterThan(5);
    expect(splitQuote(1.37627)).toEqual({ handle: "1.37", pips: "627" });
    expect([formatPips(0.426), formatPips(-1.2, "p")]).toEqual(["+0.43 pips", "-1.20p"]);
  });
});
