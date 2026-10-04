import { describe, it, expect, vi } from "vitest";
import type Highcharts from "highcharts";
import { executionDataset, EXECUTION_ORDERS, MINUTE, parseExecutionTime } from "@/lib/reportData/executionDataset";
import { EXECUTION_KEYS, resolveExecution } from "@/lib/executionModel";
import { createTicker, feedBaseView, withFeed } from "@/lib/executionFeed";
import type { ThemeVars } from "../SimulatedHighchart";
import { applyFeedView, axisEnd, barCountdown, buildExecutionOptions, executionSeriesData, type ChartFrame } from "../executionChartOptions";

const vars: ThemeVars = { primary: "teal", bg: "white", fg: "black", fgSec: "gray", fgTer: "silver", surface: "white", border: "silver", positive: "green", warning: "orange", negative: "red" };
const palette = ["navy", "olive", "purple", "maroon", "fuchsia", "lime", "aqua"];
const dataset = executionDataset();
const BUY = { [EXECUTION_KEYS.order]: EXECUTION_ORDERS[0] };

function feedOf(n: number, state: Record<string, string> = BUY) {
  const ticker = createTicker(feedBaseView(dataset, state)!);
  return Array.from({ length: n }, () => ticker.next());
}

/** A stand-in for a drawn chart: series by id that record what was done to them. */
function fakeChart(frame: ChartFrame) {
  const series = new Map<string, { data: { update: ReturnType<typeof vi.fn> }[]; added: unknown[]; addPoint: (p: unknown) => void }>();
  for (const [id, count] of Object.entries(frame.counts)) {
    const s = { data: Array.from({ length: count }, () => ({ update: vi.fn() })), added: [] as unknown[], addPoint(p: unknown) { s.added.push(p); s.data.push({ update: vi.fn() }); } };
    series.set(id, s);
  }
  const axisUpdate = vi.fn();
  const chart = {
    get: (id: string) => series.get(id),
    xAxis: [{ update: axisUpdate }],
    yAxis: [{}, { removePlotLine: vi.fn(), addPlotLine: vi.fn() }],
    redraw: vi.fn(),
  };
  return { chart: chart as unknown as Highcharts.Chart, series, axisUpdate };
}

describe("executionChartOptions", () => {
  it("names every series it draws, so the feed can find them", () => {
    const frame: ChartFrame = { view: resolveExecution(dataset, BUY)!, countdown: null, counts: {} };
    const o = buildExecutionOptions(frame, vars, palette, { width: 900, height: 600 }, () => {});
    const ids = (o.series as { id?: string }[]).map((s) => s.id).filter(Boolean);
    expect(ids).toEqual(expect.arrayContaining(["pct", "bid", "ask", "mid", "limit", "avg", "twap", "arrival", "rtp", "trades", "volume"]));
    /* The chart is given its container's size: it never draws at a guessed width. */
    expect(o.chart).toMatchObject({ width: 900, height: 600 });
    expect(frame.counts.bid).toBe(frame.view.times.length);
  });

  it("the bar countdown: none on one minute; minutes left in the bucket otherwise", () => {
    const at = Date.UTC(2026, 0, 5, 16, 42);
    expect(barCountdown(resolveExecution(dataset, BUY)!, at)).toBeNull();
    const five = resolveExecution(dataset, { ...BUY, [EXECUTION_KEYS.interval]: "5m" })!;
    expect(barCountdown(five, at)).toBe("3m");
    expect(barCountdown(five, at + 2 * MINUTE)).toBe("1m");
    expect(barCountdown(five, at + 3 * MINUTE)).toBe("5m");
  });

  it("a feed bar is appended in place: one new point per series, the last one moved, one redraw", () => {
    const state = BUY;
    const before = resolveExecution(dataset, state)!;
    const frame: ChartFrame = { view: before, countdown: null, counts: {} };
    buildExecutionOptions(frame, vars, palette, { width: 900, height: 600 }, () => {});
    const { chart, series, axisUpdate } = fakeChart(frame);
    const next = resolveExecution(withFeed(dataset, EXECUTION_ORDERS[0], feedOf(1)), state)!;
    expect(applyFeedView(chart, frame, next, vars, palette, null, false)).toBe(true);
    expect(series.get("bid")!.added).toHaveLength(1);
    expect(series.get("pct")!.added).toHaveLength(1);
    expect(series.get("bid")!.data[before.times.length - 1].update).toHaveBeenCalledTimes(1);
    /* The new bar walks into the room kept on the right: the axis stays. */
    expect(axisUpdate).not.toHaveBeenCalled();
    expect(frame.axisMax).toBe(axisEnd(before.times.length));
    expect((chart.redraw as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
    expect(frame.view).toBe(next);
    expect(frame.counts.bid).toBe(before.times.length + 1);
  });

  it("the time axis steps out only when the bars reach its end", () => {
    const before = resolveExecution(dataset, BUY)!;
    const frame: ChartFrame = { view: before, countdown: null, counts: {} };
    const o = buildExecutionOptions(frame, vars, palette, { width: 900, height: 600 }, () => {});
    expect((o.xAxis as { max: number }).max).toBe(axisEnd(before.times.length));
    expect(axisEnd(150) - (150 - 0.5)).toBe(12);
    const { chart, axisUpdate } = fakeChart(frame);
    const samples = feedOf(14);
    let steps = 0;
    for (let i = 1; i <= samples.length; i++) {
      const next = resolveExecution(withFeed(dataset, EXECUTION_ORDERS[0], samples.slice(0, i)), BUY)!;
      expect(applyFeedView(chart, frame, next, vars, palette, null, false)).toBe(true);
      steps = axisUpdate.mock.calls.length;
      expect(frame.axisMax!).toBeGreaterThan(next.times.length - 0.5);
    }
    expect(steps).toBe(1);
  });

  it("on a five-minute interval the last bucket moves until a new one opens", () => {
    const state = { ...BUY, [EXECUTION_KEYS.interval]: "5m" };
    const frame: ChartFrame = { view: resolveExecution(dataset, state)!, countdown: null, counts: {} };
    buildExecutionOptions(frame, vars, palette, { width: 900, height: 600 }, () => {});
    const { chart, series } = fakeChart(frame);
    const samples = feedOf(6);
    let added = 0;
    for (let i = 1; i <= samples.length; i++) {
      const next = resolveExecution(withFeed(dataset, EXECUTION_ORDERS[0], samples.slice(0, i)), state)!;
      expect(applyFeedView(chart, frame, next, vars, palette, barCountdown(next, samples[i - 1].time), false)).toBe(true);
      added = series.get("candles")?.added.length ?? series.get("bid")!.added.length;
    }
    /* Six minutes from 16:42 open two five-minute buckets (16:45, 16:50) at most. */
    expect(added).toBeLessThanOrEqual(2);
    expect(added).toBeGreaterThanOrEqual(1);
    expect(parseExecutionTime("2026-01-05 16:42")).toBe(samples[0].time);
  });

  it("asks for a rebuild when the chart holds more bars than the view (a reset)", () => {
    const withBars = resolveExecution(withFeed(dataset, EXECUTION_ORDERS[0], feedOf(3)), BUY)!;
    const frame: ChartFrame = { view: withBars, countdown: null, counts: {} };
    buildExecutionOptions(frame, vars, palette, { width: 900, height: 600 }, () => {});
    const { chart } = fakeChart(frame);
    expect(applyFeedView(chart, frame, resolveExecution(dataset, BUY)!, vars, palette, null, false)).toBe(false);
  });

  it("the series data agree with the view", () => {
    const view = resolveExecution(dataset, BUY)!;
    const d = executionSeriesData(view, vars, palette);
    expect(d.bid).toHaveLength(view.times.length);
    expect(d.trades).toHaveLength(view.fills.length);
  });
});
