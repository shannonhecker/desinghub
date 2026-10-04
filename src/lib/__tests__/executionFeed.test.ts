import { describe, it, expect } from "vitest";
import { executionDataset, EXECUTION_ORDERS, MINUTE, parseExecutionTime } from "../reportData/executionDataset";
import { tableOf } from "../reportData/types";
import { EXECUTION_KEYS, resolveExecution } from "../executionModel";
import { createTicker, feedBaseView, FEED_SEED, withFeed, type FeedSample } from "../executionFeed";

const dataset = executionDataset();
const BUY = { [EXECUTION_KEYS.order]: EXECUTION_ORDERS[0] };
const SELL = { [EXECUTION_KEYS.order]: EXECUTION_ORDERS[1] };
const run = (state: Record<string, string>, n: number, seed = FEED_SEED): FeedSample[] => {
  const ticker = createTicker(feedBaseView(dataset, state)!, seed);
  return Array.from({ length: n }, () => ticker.next());
};

describe("createTicker", () => {
  it("is repeatable: the same view and seed give the same session; another seed does not", () => {
    expect(run(BUY, 120)).toEqual(run(BUY, 120));
    expect(run(BUY, 20, FEED_SEED + 1).map((s) => s.mid)).not.toEqual(run(BUY, 20).map((s) => s.mid));
  });

  it("starts one minute after the last session bar and adds one bar a minute", () => {
    const base = feedBaseView(dataset, BUY)!;
    const samples = run(BUY, 30);
    expect(samples[0].time).toBe(base.times[base.times.length - 1] + MINUTE);
    samples.forEach((s, i) => { expect(s.step).toBe(i + 1); if (i) expect(s.time - samples[i - 1].time).toBe(MINUTE); });
  });

  it("always quotes bid < mid < ask", () => {
    for (const s of [...run(BUY, 400), ...run(SELL, 400)]) {
      expect(s.bid).toBeLessThan(s.mid);
      expect(s.mid).toBeLessThan(s.ask);
    }
  });

  it("a working order's percent done never falls, never passes 100, and it fills from time to time", () => {
    const base = feedBaseView(dataset, BUY)!;
    const samples = run(BUY, 600);
    let before = base.pct[base.pct.length - 1]!;
    for (const s of samples) {
      expect(s.pct).not.toBeNull();
      expect(s.pct!).toBeGreaterThanOrEqual(before);
      expect(s.pct!).toBeLessThanOrEqual(100);
      before = s.pct!;
    }
    expect(samples[samples.length - 1].pct!).toBeGreaterThan(base.pct[base.pct.length - 1]!);
    const fills = samples.filter((s) => s.fill);
    expect(fills.length).toBeGreaterThan(3);
    /* Once done, no more fills. */
    const doneAt = samples.findIndex((s) => s.pct === 100);
    if (doneAt >= 0) expect(samples.slice(doneAt + 1).some((s) => s.fill)).toBe(false);
  });

  it("a filled order's own series freeze while the market keeps moving", () => {
    const samples = run(SELL, 200);
    for (const s of samples) {
      expect(s.limit).toBeNull();
      expect(s.avgFill).toBeNull();
      expect(s.pct).toBeNull();
      expect(s.fill).toBeNull();
    }
    /* The market: the mid moves on most bars. */
    const moves = samples.filter((s, i) => i > 0 && s.mid !== samples[i - 1].mid).length;
    expect(moves).toBeGreaterThan(samples.length / 2);
  });
});

describe("withFeed", () => {
  const snapshot = JSON.stringify(dataset);

  it("appends the feed's bars to a copy: the dataset itself is never written to", () => {
    const samples = run(BUY, 90);
    const live = withFeed(dataset, EXECUTION_ORDERS[0], samples);
    expect(live).not.toBe(dataset);
    expect(JSON.stringify(dataset)).toBe(snapshot);
    expect(tableOf(live, "market")!.rows.length).toBe(tableOf(dataset, "market")!.rows.length + 90);
    expect(withFeed(dataset, EXECUTION_ORDERS[0], [])).toBe(dataset);
  });

  it("the working order's chart, header figures and statistics follow the feed", () => {
    const samples = run(BUY, 300);
    const live = withFeed(dataset, EXECUTION_ORDERS[0], samples);
    const before = resolveExecution(dataset, BUY)!;
    const after = resolveExecution(live, BUY)!;
    expect(after.times.length).toBe(before.times.length + 300);
    const last = samples[samples.length - 1];
    expect(after.bid[after.bid.length - 1]).toBeCloseTo(last.bid, 5);
    expect(after.pct[after.pct.length - 1]).toBeCloseTo(last.pct!, 2);
    const newFills = samples.filter((s) => s.fill).length;
    expect(after.fills.length).toBe(before.fills.length + newFills);
    expect(after.order.fills).toBe(before.order.fills + newFills);
    expect(after.order.pctDone).toBe(Math.round(last.pct!));
    const order = tableOf(live, "orders")!.rows[0];
    expect(Number(order.passivePct) + Number(order.aggressivePct)).toBeCloseTo(100, 1);
    expect(parseExecutionTime(tableOf(live, "market")!.rows.at(-1)!.time)).toBe(last.time);
  });

  it("a filled order keeps its fills, statistics and series; only the market moves", () => {
    const samples = run(SELL, 120);
    const live = withFeed(dataset, EXECUTION_ORDERS[1], samples);
    expect(tableOf(live, "fills")!.rows).toEqual(tableOf(dataset, "fills")!.rows);
    expect(tableOf(live, "orders")!.rows).toEqual(tableOf(dataset, "orders")!.rows);
    expect(tableOf(live, "orderBars")!.rows).toEqual(tableOf(dataset, "orderBars")!.rows);
    const after = resolveExecution(live, SELL)!;
    expect(after.limit.slice(-120).every((v) => v === null)).toBe(true);
    expect(after.mid.slice(-120)).toHaveLength(120);
  });
});
