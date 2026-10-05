import { describe, it, expect, vi } from "vitest";
import type Highcharts from "highcharts";
import { executionDataset, EXECUTION_ORDERS, MINUTE, parseExecutionTime } from "@/lib/reportData/executionDataset";
import { EXECUTION_KEYS, resolveExecution } from "@/lib/executionModel";
import { createTicker, feedBaseView, withFeed } from "@/lib/executionFeed";
import type { ThemeVars } from "../SimulatedHighchart";
import { applyFeedView, axisEnd, barCountdown, buildExecutionOptions, contrastRatio, executionSeriesData, layoutTags, pillColors, type ChartFrame } from "../executionChartOptions";

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
  const setExtremes = vi.fn();
  const chart = {
    get: (id: string) => series.get(id),
    xAxis: [{ update: axisUpdate, setExtremes }],
    yAxis: [{}, { removePlotLine: vi.fn(), addPlotLine: vi.fn() }],
    redraw: vi.fn(),
  };
  return { chart: chart as unknown as Highcharts.Chart, series, axisUpdate, setExtremes };
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
    /* About a twentieth of the plot, at least two bars, on any interval. */
    expect(axisEnd(150) - (150 - 0.5)).toBe(8);
    expect(axisEnd(30) - (30 - 0.5)).toBe(2);
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

  it("a zoomed view decides the time axis: held still when panned back, moved on when it shows the latest bar", () => {
    const before = resolveExecution(dataset, BUY)!;
    const frame: ChartFrame = { view: before, countdown: null, counts: {} };
    buildExecutionOptions(frame, vars, palette, { width: 900, height: 600 }, () => {});
    const { chart, setExtremes } = fakeChart(frame);
    const samples = feedOf(2);
    const last = before.times.length - 1;
    /* Panned back: the view says hold this span; the axis is set to it, not yanked. */
    const held = vi.fn(() => ({ min: 20, max: 60 }));
    const next = resolveExecution(withFeed(dataset, EXECUTION_ORDERS[0], samples.slice(0, 1)), BUY)!;
    expect(applyFeedView(chart, frame, next, vars, palette, null, false, held)).toBe(true);
    expect(held).toHaveBeenCalledWith(last, last + 1);
    expect(setExtremes).toHaveBeenLastCalledWith(20, 60, false, false);
    /* The full view: no extremes are set; the walk-in step owns the axis. */
    setExtremes.mockClear();
    const next2 = resolveExecution(withFeed(dataset, EXECUTION_ORDERS[0], samples), BUY)!;
    expect(applyFeedView(chart, frame, next2, vars, palette, null, false, () => null)).toBe(true);
    expect(setExtremes).not.toHaveBeenCalled();
    expect((chart.redraw as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(2);
  });

  it("time labels: as many as fit the bars on screen, in the same places while panning, dates only across days", () => {
    const frame: ChartFrame = { view: resolveExecution(dataset, BUY)!, countdown: null, counts: {} };
    const o = buildExecutionOptions(frame, vars, palette, { width: 900, height: 600 }, () => {});
    const x = o.xAxis as Highcharts.XAxisOptions;
    const ticks = (min: number, max: number) => (x.tickPositioner as (this: unknown) => number[]).call({ min, max, chart: { plotWidth: 840 } });
    const full = ticks(-0.5, axisEnd(150));
    const zoomed = ticks(40.5, 60.5);
    expect(zoomed.every((t) => t >= 41 && t <= 60)).toBe(true);
    expect(zoomed.length).toBeGreaterThanOrEqual(5);
    expect(zoomed[1] - zoomed[0]).toBeLessThan(full[1] - full[0]);
    /* Panned by a bar: the labels stay on the same bars. */
    const panned = ticks(41.5, 61.5);
    expect(panned.filter((t) => zoomed.includes(t)).length).toBeGreaterThanOrEqual(zoomed.length - 1);
    /* Three months, zoomed into one session: times, not dates. */
    const long = { ...BUY, [EXECUTION_KEYS.range]: "3M" };
    const lf: ChartFrame = { view: resolveExecution(dataset, long)!, countdown: null, counts: {} };
    const lo = buildExecutionOptions(lf, vars, palette, { width: 900, height: 600 }, () => {});
    const n = lf.view.times.length;
    const label = (value: number, min: number, max: number) => ((lo.xAxis as Highcharts.XAxisOptions).labels!.formatter as (this: unknown) => string).call({ value, axis: { min, max } });
    expect(label(n - 10, n - 30, n - 1)).toMatch(/^\d{2}:\d{2}$/);
    expect(label(10, -0.5, n)).toMatch(/^\d{2} [A-Z][a-z]{2}$/);
    /* Across days, two labels on one day: the date once, then the time. */
    const day = (i: number) => new Date(lf.view.times[i]).toISOString().slice(0, 10);
    const i = lf.view.times.findIndex((_, k) => k > 0 && k + 1 < n && day(k) === day(k + 1) && day(k - 1) !== day(k));
    const withTicks = (value: number, tickPositions: number[]) => ((lo.xAxis as Highcharts.XAxisOptions).labels!.formatter as (this: unknown) => string).call({ value, axis: { min: -0.5, max: n, tickPositions } });
    expect(withTicks(i, [i - 1, i, i + 1])).toMatch(/^\d{2} [A-Z][a-z]{2}$/);
    expect(withTicks(i + 1, [i - 1, i, i + 1])).toMatch(/^\d{2}:\d{2}$/);
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

  it("price tags never overlap one another and stay inside the plot", () => {
    const H = 20;
    const check = (ys: number[], top: number, bottom: number) => {
      const out = layoutTags(ys, top, bottom, H, 2);
      const sorted = [...out].sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(H + 2 - 1e-9);
      for (const y of out) { expect(y).toBeGreaterThanOrEqual(top + H / 2); expect(y).toBeLessThanOrEqual(bottom - H / 2); }
      return out;
    };
    /* Three at the same price near the bottom: pushed up, not off the plot. */
    check([395, 396, 397], 0, 400);
    check([5, 5, 6, 200], 0, 400);
    /* Apart already: untouched. */
    expect(check([50, 150, 250], 0, 400)).toEqual([50, 150, 250]);
  });

  it("every tag's text reads at 4.5:1 or better on its fill, light and dark", () => {
    const themes: ThemeVars[] = [
      { ...vars, card: "rgb(255,255,255)", fg: "rgb(20,20,20)", positive: "rgb(46,125,50)" },
      { ...vars, card: "rgb(32,34,38)", fg: "rgb(235,235,235)", positive: "rgb(102,187,106)" },
    ];
    const palettes = [[0, 0, 0, 0, 0, "rgb(120,90,200)", 0].map(String), [0, 0, 0, 0, 0, "rgb(200,170,255)", 0].map(String), [0, 0, 0, 0, 0, "rgb(150,130,230)", 0].map(String)];
    for (const v of themes) for (const p of palettes) for (const key of ["bid", "limit", "avg", "arrival", "riskTransfer"] as const) {
      const c = pillColors(key, v, p);
      expect(contrastRatio(c.text, c.fill), `${key} ${c.text} on ${c.fill}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
