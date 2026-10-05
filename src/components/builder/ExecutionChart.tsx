"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { CandlestickChart, Clock, Layers, Table2 } from "lucide-react";
import { useBuilder, type DesignSystem } from "@/store/useBuilder";
import { ensureHighchartsModules } from "@/lib/highchartsInit";
import { getPalette } from "@/lib/categoricalPalettes";
import { panelHeightOf } from "@/lib/panelMetrics";
import {
  EXECUTION_CHART_STYLES, EXECUTION_INTERVALS, EXECUTION_KEYS, EXECUTION_OVERLAYS, EXECUTION_RANGES,
  executionRows, resolveExecution, toggleOverlay,
} from "@/lib/executionModel";
import { executionOrderOf, feedSwitchedOn, type FeedSample } from "@/lib/executionFeed";
import type { GridColumn } from "@/lib/dataGridModel";
import { readThemeVars, type ThemeVars } from "./SimulatedHighchart";
import { applyFeedView, barCountdown, buildExecutionOptions, drawPills, NARROW_CHART, type ChartFrame } from "./executionChartOptions";
import { ExecutionRail, type RailMenu } from "./ExecutionRail";
import { SimulatedDataGrid } from "./SimulatedDataGrid";
import { usePreviewReadOnly } from "./previewReadOnly";
import { useCanvasDataset } from "./useBoundData";
import { liveDataset, useExecutionFeed } from "./useExecutionFeed";
import { useOrderAmend, useSessionAmend } from "./useOrderAmend"; // FX D: sample orders

/* ══════════════════════════════════════════════════════════
   ExecutionChart - one order worked through a session.

   The market (bid, ask, mid, or candles), the order's limit price,
   average fill and percent done, its fills by venue, the periods it
   was held back, and its benchmarks, on one time axis. Down the left
   edge, the chart's own controls (interval, chart type, overlays,
   chart or table); under it, the range presets. Every choice is
   report state, so the chat can make it too.

   The view is data (executionModel.ts); this file only draws it.
   ══════════════════════════════════════════════════════════ */

/** Report-state key: "Table" swaps the chart for its bars as a grid. */
const VIEW_KEY = "fxView";
const RAIL_WIDTH = 44;
/* On a phone (the panel narrower than PHONE_PANEL): a slimmer rail and a
   chart that fits a phone screen rather than the desktop column's height. */
const RAIL_WIDTH_PHONE = 36;
const PHONE_PANEL = 480;
const PHONE_HEIGHT = 520;
const RANGE_ROW = 44;
const PAD = 12;

const TABLE_COLUMNS: GridColumn[] = [
  { field: "time", header: "Time", minWidth: 130, flex: 2 },
  { field: "bid", header: "Bid", kind: "number", decimals: 5, width: 96 },
  { field: "ask", header: "Ask", kind: "number", decimals: 5, width: 96 },
  { field: "mid", header: "Mid", kind: "number", decimals: 5, width: 96 },
  { field: "pctDone", header: "% done", kind: "number", decimals: 1, width: 84 },
  { field: "avgFill", header: "Avg fill", kind: "number", decimals: 5, width: 96 },
  { field: "fill", header: "Fill (m)", kind: "number", decimals: 2, width: 84 },
];

const NO_SAMPLES = (): readonly FeedSample[] => [];
const prefersReducedMotion = (): boolean => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function ExecutionChartBlock({ system, blockId }: { system: DesignSystem; blockId?: string }) {
  const block = useBuilder((s) => (blockId ? s.blocks.find((b) => b.id === blockId) : undefined));
  const reportState = useBuilder((s) => s.reportState);
  const setReportState = useBuilder((s) => s.setReportState);
  const mode = useBuilder((s) => s.mode);
  const dataset = useCanvasDataset();
  const readOnly = usePreviewReadOnly();
  const [phone, setPhone] = useState(false);
  const fullHeight = panelHeightOf(block?.props ?? {});
  const height = phone ? Math.min(fullHeight, PHONE_HEIGHT) : fullHeight;
  const rail = phone ? RAIL_WIDTH_PHONE : RAIL_WIDTH;
  const amend = useSessionAmend(readOnly); // FX D: this session's limit amendments, laid over each view below
  const view = useMemo(() => (dataset ? amend(resolveExecution(dataset, reportState)) : null), [dataset, reportState, amend]);
  const showTable = reportState[VIEW_KEY] === "Table";
  /* The sample feed: live while presenting with it switched on. Its bars
     are added to the drawn chart in place (below); Edit stays static. */
  const feed = useExecutionFeed({ dataset, state: reportState, active: readOnly && feedSwitchedOn(reportState) });
  const peek = readOnly ? feed.peek : NO_SAMPLES;
  const order = dataset ? executionOrderOf(dataset, reportState) : null;
  const liveView = (samples: readonly FeedSample[]) => (dataset && order && samples.length ? amend(resolveExecution(liveDataset(dataset, order, samples), reportState)) : view);

  const rootRef = useRef<HTMLElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const pillsRef = useRef<Highcharts.SVGElement[]>([]);
  const [vars, setVars] = useState<ThemeVars | null>(null);
  /* The plot's width lives outside the options: a resize is applied to the
     drawn chart (setSize), never a rebuild, so later zoom and pan survive it.
     Only crossing the phone width rebuilds (the price gutter changes). */
  const widthRef = useRef(0);
  const [hasWidth, setHasWidth] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [rebuilds, setRebuilds] = useState(0);
  const palette = useMemo(() => getPalette(system), [system]);
  const orders = useOrderAmend({ chartRef, plotRef, active: readOnly, dataset, vars, palette, system }); // FX D: limit drag, BID staging, price menus, dialogs, toast

  useEffect(() => { ensureHighchartsModules(); }, []);
  /* Colours and width are read before the first paint, so the chart is
     drawn once, at its container's width (it used to draw narrow and
     reflow a moment later). */
  useLayoutEffect(() => {
    if (rootRef.current) setVars({ ...readThemeVars(rootRef.current), card: getComputedStyle(rootRef.current).backgroundColor });
  }, [system, mode]);
  const hasView = view !== null;
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setPhone(el.clientWidth > 0 && el.clientWidth < PHONE_PANEL);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasView]);
  useLayoutEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const measure = () => {
      const width = el.clientWidth;
      widthRef.current = width;
      setHasWidth(width > 0);
      setNarrow(width > 0 && width < NARROW_CHART);
      return width;
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    /* The stage can still be settling its frame when the chart mounts. A
       resize is applied to the drawn chart at once, in the observer (after
       layout, before paint), so no frame shows it at a stale width. */
    const observer = new ResizeObserver(() => {
      const width = measure();
      const chart = chartRef.current?.chart;
      if (chart && width > 0 && chart.chartWidth !== width) chart.setSize(width, undefined, false);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasView, showTable]);
  useEffect(() => () => { chartRef.current?.chart?.destroy(); }, []);

  const chartHeight = height - RANGE_ROW - PAD;
  const onVenueRef = useRef<(venue: string) => void>(() => {});
  useEffect(() => { onVenueRef.current = (venue) => setReportState(EXECUTION_KEYS.venue, reportState[EXECUTION_KEYS.venue] === venue ? null : venue); }, [reportState, setReportState]);
  /* Built when the report, the theme, the size or the feed's session
     changes; a feed bar does not rebuild it. */
  const built = useMemo(() => {
    if (!view || !vars || !hasWidth) return null;
    const samples = peek();
    const frame: ChartFrame = {
      view: dataset && order && samples.length ? amend(resolveExecution(liveDataset(dataset, order, samples), reportState)) ?? view : view,
      countdown: null,
      counts: {},
    };
    const options = buildExecutionOptions(frame, vars, palette, { width: widthRef.current, height: chartHeight, narrow }, (venue) => onVenueRef.current(venue));
    options.chart = {
      ...options.chart,
      events: {
        render() {
          drawPills(this, frame, vars, palette, pillsRef);
          orders.onRender(this, frame); // FX D
          /* How many bars the drawn chart holds (tests read it). */
          this.container?.closest(".dh-exec")?.setAttribute("data-chart-bars", String(frame.view.times.length));
        },
      },
    };
    return { options, frame };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `feed.generation` and `rebuilds` start the chart afresh; one feed bar must not.
  }, [view, vars, palette, chartHeight, hasWidth, narrow, peek, feed.generation, rebuilds]);

  /* Each feed bar: the new points go onto the drawn series, with the
     header and the side panels in the same render. */
  const samples = readOnly ? feed.samples : null;
  const running = feed.running;
  useEffect(() => {
    const chart = chartRef.current?.chart;
    if (!built || !chart || !samples || samples.length === 0 || !dataset || !order) return;
    const next = amend(resolveExecution(liveDataset(dataset, order, samples), reportState));
    if (!next) return;
    const countdown = running ? barCountdown(next, samples[samples.length - 1].time) : null;
    if (!applyFeedView(chart, built.frame, next, vars!, palette, countdown, !prefersReducedMotion())) setRebuilds((n) => n + 1);
  }, [built, samples, running, dataset, order, reportState, vars, palette, amend]);
  /* The grid can still be settling when the chart is created (the panels
     beside it mount in the same pass), so the width it was built with may
     be stale by the time it is in the page. Correct it in the same commit,
     before the browser paints. */
  useLayoutEffect(() => {
    const chart = chartRef.current?.chart;
    const width = plotRef.current?.clientWidth ?? 0;
    if (chart && width > 0 && chart.chartWidth !== width) chart.setSize(width, undefined, false);
  }, [built]);
  const options = built?.options ?? null;
  const tableView = showTable ? liveView(readOnly ? feed.samples : []) : null;

  if (!view) {
    return <section ref={rootRef} className="dh-panel dh-exec" style={{ "--dh-panel-h": `${height}px` } as React.CSSProperties} aria-label="Execution"><p className="dh-exec-empty">No execution data.</p></section>;
  }

  const set = (key: string, value: string) => setReportState(key, value);
  const menus: RailMenu[] = [
    { key: "interval", label: "Interval", icon: <span className="dh-exec-rail-text">{view.interval}</span>, items: Object.keys(EXECUTION_INTERVALS).map((i) => ({ label: i, active: i === view.interval, onPick: () => set(EXECUTION_KEYS.interval, i) })) },
    { key: "chart", label: "Chart type", icon: <CandlestickChart size={16} strokeWidth={1.8} aria-hidden="true" />, items: EXECUTION_CHART_STYLES.map((c) => ({ label: c, active: c === view.chartStyle, onPick: () => set(EXECUTION_KEYS.chart, c) })) },
    { key: "overlays", label: "Overlays", icon: <Layers size={16} strokeWidth={1.8} aria-hidden="true" />, multi: true, items: EXECUTION_OVERLAYS.map((o) => ({ label: o, active: !view.hidden.includes(o), onPick: () => setReportState(EXECUTION_KEYS.hidden, toggleOverlay(reportState[EXECUTION_KEYS.hidden], o)) })) },
    { key: "view", label: "View", icon: showTable ? <Table2 size={16} strokeWidth={1.8} aria-hidden="true" /> : <Clock size={16} strokeWidth={1.8} aria-hidden="true" />, items: ["Chart", "Table"].map((m) => ({ label: m, active: (m === "Table") === showTable, onPick: () => set(VIEW_KEY, m) })) },
  ];

  return (
    <section
      ref={rootRef}
      className="dh-panel dh-exec"
      style={{ "--dh-panel-h": `${height}px`, "--dh-exec-rail": `${rail}px`, "--dh-exec-range": `${RANGE_ROW}px`, "--dh-exec-pad": `${PAD}px` } as React.CSSProperties}
      aria-label={`${view.pair} execution`}
      data-feed-bars={readOnly ? feed.samples.length : 0}
      /* While presenting, the chart's controls are its own: using one must
         not select the block for the amend composer. */
      onClick={readOnly ? (e) => e.stopPropagation() : undefined}
    >
      <ExecutionRail menus={menus} />
      <div className="dh-exec-main">
        <div ref={plotRef} className="dh-exec-plot" style={{ height: chartHeight }}>
          {showTable ? (
            /* The table follows the feed. */
            <SimulatedDataGrid columns={TABLE_COLUMNS} rows={executionRows(tableView ?? view)} height={chartHeight} label={`${view.pair} bars`} />
          ) : options ? (
            /* Rebuilt, not patched, when the options change: the set of
               series differs between chart types, orders and overlays, and a
               patch matches series by position. A feed bar is patched in
               (applyFeedView), never rebuilt. */
            <HighchartsReact ref={chartRef} highcharts={Highcharts} options={options} immutable />
          ) : null}
          {orders.overlay /* FX D */}
        </div>
        <div className="dh-exec-ranges" role="group" aria-label="Range">
          {EXECUTION_RANGES.map((r) => (
            <button key={r} type="button" className={`dh-exec-range${r === view.range ? " is-active" : ""}`} aria-pressed={r === view.range} onClick={() => setReportState(EXECUTION_KEYS.range, r)}>
              {r === "Order" ? "Order" : r}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
