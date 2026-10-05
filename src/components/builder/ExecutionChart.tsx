"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { BoxSelect, CalendarDays, CandlestickChart, ChevronsRight, Clock, Layers, Maximize2, Table2, ZoomIn, ZoomOut } from "lucide-react";
import { useBuilder, type DesignSystem } from "@/store/useBuilder";
import { ensureHighchartsModules } from "@/lib/highchartsInit";
import { getPalette } from "@/lib/categoricalPalettes";
import { panelHeightOf } from "@/lib/panelMetrics";
import {
  EXECUTION_CHART_STYLES, EXECUTION_INTERVALS, EXECUTION_KEYS, EXECUTION_OVERLAYS, EXECUTION_RANGES,
  executionRangeStart, executionRows, rangeCovering, resolveExecution, toggleOverlay,
} from "@/lib/executionModel";
import { goToPlan, goToSpan } from "@/lib/chartViewport";
import { dataDays } from "@/lib/calendarGrid";
import { parseExecutionTime } from "@/lib/reportData/executionDataset";
import { tableOf } from "@/lib/reportData/types";
import type { SystemId } from "@/lib/componentApiRegistry";
import { RealComponentRenderer } from "@/components/ui-kit/RealComponentRenderer";
import { executionOrderOf, feedSwitchedOn, type FeedSample } from "@/lib/executionFeed";
import type { GridColumn } from "@/lib/dataGridModel";
import { readThemeVars, type ThemeVars } from "./SimulatedHighchart";
import { applyFeedView, barCountdown, buildExecutionOptions, drawPills, NARROW_CHART, type ChartFrame } from "./executionChartOptions";
import { ExecutionRail, type RailMenu, type RailTool } from "./ExecutionRail";
import { SimulatedDataGrid } from "./SimulatedDataGrid";
import { usePreviewReadOnly } from "./previewReadOnly";
import { useCanvasDataset } from "./useBoundData";
import { liveDataset, useExecutionFeed } from "./useExecutionFeed";
import { MIN_BARS, useChartNavigation } from "./useChartNavigation";
import { GoToDialog } from "./ExecutionDialogs";

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

const STAMP_DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const STAMP_TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
/** A Go to window for the chip: "5 Jan 10:15 to 11:45", or both days when it spans two. */
function windowLabel(from: number, to: number): string {
  const a = `${STAMP_DAY.format(from)} ${STAMP_TIME.format(from)}`;
  return STAMP_DAY.format(from) === STAMP_DAY.format(to) ? `${a} to ${STAMP_TIME.format(to)}` : `${a} to ${STAMP_DAY.format(to)} ${STAMP_TIME.format(to)}`;
}
/** What each range preset shows (its tooltip, as in the original). */
const RANGE_HINTS: Record<string, string> = { "1D": "The session", "3D": "The last 3 days", "5D": "The last 5 days", "1W": "The last week", "1M": "The last month", "3M": "The last 3 months", YTD: "This year to date", Order: "The order, first bar to last" };
const KEYS_HELP = "Arrow keys pan, plus and minus zoom time, Page Up and Page Down zoom price, 0 resets, End goes back to the latest bar. With a mouse, hold Control or Command and scroll to zoom.";
const isMac = (): boolean => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform ?? "");

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
  const view = useMemo(() => (dataset ? resolveExecution(dataset, reportState) : null), [dataset, reportState]);
  const showTable = reportState[VIEW_KEY] === "Table";
  /* The sample feed: live while presenting with it switched on. Its bars
     are added to the drawn chart in place (below); Edit stays static. */
  const feed = useExecutionFeed({ dataset, state: reportState, active: readOnly && feedSwitchedOn(reportState) });
  const peek = readOnly ? feed.peek : NO_SAMPLES;
  const order = dataset ? executionOrderOf(dataset, reportState) : null;
  const liveView = (samples: readonly FeedSample[]) => (dataset && order && samples.length ? resolveExecution(liveDataset(dataset, order, samples), reportState) : view);

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
  const keysHelpId = React.useId();
  const palette = useMemo(() => getPalette(system), [system]);

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
      view: dataset && order && samples.length ? resolveExecution(liveDataset(dataset, order, samples), reportState) ?? view : view,
      countdown: null,
      counts: {},
    };
    const options = buildExecutionOptions(frame, vars, palette, { width: widthRef.current, height: chartHeight, narrow }, (venue) => onVenueRef.current(venue));
    options.chart = {
      ...options.chart,
      events: {
        render() {
          drawPills(this, frame, vars, palette, pillsRef);
          /* How many bars the drawn chart holds (tests read it). */
          this.container?.closest(".dh-exec")?.setAttribute("data-chart-bars", String(frame.view.times.length));
        },
      },
    };
    return { options, frame };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `feed.generation` and `rebuilds` start the chart afresh; one feed bar must not.
  }, [view, vars, palette, chartHeight, hasWidth, narrow, peek, feed.generation, rebuilds]);

  /* Pan, zoom, box zoom, press and hold, keys: a local viewport, live
     while presenting, never report state. */
  const navigable = readOnly && !showTable;
  const nav = useChartNavigation({
    chartRef, plotRef, enabled: navigable,
    viewKey: `${view?.order.id}|${view?.interval}|${view?.range}`,
    build: built,
    axisMax: () => built?.frame.axisMax ?? 0,
    lastBar: () => (built ? built.frame.view.times.length - 1 : 0),
    accent: vars?.primary ?? "currentColor",
  });
  /* Go to: the calendar chip and its dialog. */
  const gotoRef = useRef<HTMLButtonElement>(null);
  const [gotoOpen, setGotoOpen] = useState(false);
  const [gotoMounted, setGotoMounted] = useState(false);
  const [customLabel, setCustomLabel] = useState<string | null>(null);
  const pendingGoTo = useRef<{ from: number; to: number; range: string } | null>(null);
  const sessionStart = useMemo(() => {
    const market = dataset ? tableOf(dataset, "market")?.rows ?? [] : [];
    return parseExecutionTime(market.find((r) => r.period !== "History")?.time);
  }, [dataset]);
  /* Days the chart can reach: with sample data, no further back than the longest range. */
  const gotoDays = useMemo(() => {
    if (!gotoMounted || !dataset || !Number.isFinite(sessionStart)) return [];
    const reach = executionRangeStart("3M", sessionStart);
    const times = (tableOf(dataset, "market")?.rows ?? []).map((r) => parseExecutionTime(r.time)).filter((t) => Number.isFinite(t) && t >= reach);
    const live = built?.frame.view.times ?? [];
    return [...dataDays([...times, ...live])].sort();
  }, [gotoMounted, dataset, sessionStart, built]);
  const goTo = (from: number, to: number): string | null => {
    if (!view || !dataset) return "The chart is not ready yet.";
    const shown = built?.frame.view.times ?? view.times;
    const noBars = "No bars in that window. Try a wider one.";
    /* The bars already on the chart answer it, unless the window starts
       before them and a longer range holds more of it (goToPlan). */
    const startsBefore = shown.length > 0 && shown[0] > from;
    const range = startsBefore || !shown.length ? rangeCovering(from, sessionStart) : null;
    const samples = peek();
    const source = order && samples.length ? liveDataset(dataset, order, samples) : dataset;
    const wider = range && range !== view.range ? resolveExecution(source, { ...reportState, [EXECUTION_KEYS.range]: range }) : null;
    const plan = goToPlan(shown, wider?.times ?? null, from, to);
    if (plan === "here") {
      const here = goToSpan(shown, from, to, MIN_BARS);
      if (!here) return noBars;
      nav.showSpan(here);
      setCustomLabel(windowLabel(from, to));
      return null;
    }
    if (plan === "none" || !range) return startsBefore && !range ? "That is further back than the sample data reaches." : noBars;
    pendingGoTo.current = { from, to, range };
    setReportState(EXECUTION_KEYS.range, range);
    return null;
  };
  /* A Go to that needed a longer range: shown once the chart has it. */
  useEffect(() => {
    const p = pendingGoTo.current;
    if (!p || !built || built.frame.view.range !== p.range) return;
    pendingGoTo.current = null;
    const span = goToSpan(built.frame.view.times, p.from, p.to, MIN_BARS);
    if (span) { nav.showSpan(span); setCustomLabel(windowLabel(p.from, p.to)); }
  }, [built, nav]);

  /* Each feed bar: the new points go onto the drawn series, with the
     header and the side panels in the same render. */
  const samples = readOnly ? feed.samples : null;
  const running = feed.running;
  useEffect(() => {
    const chart = chartRef.current?.chart;
    if (!built || !chart || !samples || samples.length === 0 || !dataset || !order) return;
    const next = resolveExecution(liveDataset(dataset, order, samples), reportState);
    if (!next) return;
    const countdown = running ? barCountdown(next, samples[samples.length - 1].time) : null;
    if (!applyFeedView(chart, built.frame, next, vars!, palette, countdown, !prefersReducedMotion(), nav.holdTime)) setRebuilds((n) => n + 1);
  }, [built, samples, running, dataset, order, reportState, vars, palette, nav.holdTime]);
  /* The grid can still be settling when the chart is created (the panels
     beside it mount in the same pass), so the width it was built with may
     be stale by the time it is in the page. Correct it in the same commit,
     before the browser paints. */
  useLayoutEffect(() => {
    const chart = chartRef.current?.chart;
    const width = plotRef.current?.clientWidth ?? 0;
    if (chart && width > 0 && chart.chartWidth !== width) chart.setSize(width, undefined, false);
  }, [built]);
  const custom = navigable && nav.status.custom && customLabel !== null;
  /* On a narrow panel the range row scrolls: bring the window's chip into view. */
  useEffect(() => { const row = gotoRef.current?.parentElement; if (custom && row) row.scrollLeft = row.scrollWidth; }, [custom, customLabel]);
  const options = built?.options ?? null;
  const tableView = showTable ? liveView(readOnly ? feed.samples : []) : null;

  if (!view) {
    return <section ref={rootRef} className="dh-panel dh-exec" style={{ "--dh-panel-h": `${height}px` } as React.CSSProperties} aria-label="Execution"><p className="dh-exec-empty">No execution data.</p></section>;
  }

  const set = (key: string, value: string) => setReportState(key, value);
  const icon = { size: 16, strokeWidth: 1.8, "aria-hidden": true } as const;
  /* The rail's Zoom group (live while presenting; shown, at rest, in Edit). */
  const off = !navigable;
  const zoomTools: RailTool[] = [
    { key: "box", label: "Box zoom", icon: <BoxSelect {...icon} />, onClick: nav.toggleBoxZoom, pressed: navigable && nav.status.boxArmed, disabled: off },
    { key: "in", label: "Zoom in", icon: <ZoomIn {...icon} />, onClick: nav.zoomIn, disabled: off },
    { key: "out", label: "Zoom out", icon: <ZoomOut {...icon} />, onClick: nav.zoomOut, disabled: off || !nav.status.zoomed },
    { key: "reset", label: "Reset view", icon: <Maximize2 {...icon} />, onClick: () => { setCustomLabel(null); nav.reset(); }, disabled: off || !nav.status.zoomed },
    ...(navigable && nav.status.away ? [{ key: "live", label: "Back to live: show the latest bar", title: "Back to live", icon: <ChevronsRight {...icon} />, onClick: nav.backToLive, tone: "live" as const }] : []),
  ];
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
      <ExecutionRail menus={menus} tools={zoomTools} toolsNote={off ? "while presenting" : undefined} />
      <div className="dh-exec-main">
        <div
          ref={plotRef}
          className={`dh-exec-plot${navigable ? " is-navigable" : ""}${nav.status.boxArmed ? " is-boxing" : ""}`}
          style={{ height: chartHeight }}
          data-zoomed={navigable && nav.status.zoomed ? "true" : undefined}
          data-away={navigable && nav.status.away ? "true" : undefined}
          data-pinned={nav.status.pinned ? "true" : undefined}
          {...(navigable ? { tabIndex: 0, role: "group", "aria-label": `${view.pair} chart`, "aria-describedby": keysHelpId, onKeyDown: nav.onKeyDown } : {})}
        >
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
          {navigable ? <span id={keysHelpId} className="dh-exec-sr">{KEYS_HELP}</span> : null}
          {navigable && nav.status.wheelNote ? (
            /* Shown for a moment when a plain wheel scrolls the page past the chart (the keys help says the same). */
            <div className="dh-exec-wheel-note" aria-hidden="true">Hold {isMac() ? "\u2318" : "Ctrl"} and scroll to zoom</div>
          ) : null}
          {navigable && nav.status.hint ? (
            <div className="dh-exec-hint" role="note">
              <p>Press and hold the chart to see the values under it.</p>
              <RealComponentRenderer system={system as SystemId} type="SimulatedButton" mode={mode === "dark" ? "dark" : "light"} saltDensity="medium" props={{ label: "Got it", variant: "ghost", onClick: nav.dismissHint }} />
            </div>
          ) : null}
        </div>
        <div className="dh-exec-ranges" role="group" aria-label="Range" data-range={view.range}>
          {EXECUTION_RANGES.map((r) => {
            const on = r === view.range && !custom;
            return (
              <button key={r} type="button" className={`dh-exec-range${on ? " is-active" : ""}`} aria-pressed={on} title={RANGE_HINTS[r]} onClick={() => { setCustomLabel(null); if (r === view.range) nav.reset(); setReportState(EXECUTION_KEYS.range, r); }}>
                {r === "Order" ? "Order" : r}
              </button>
            );
          })}
          <button
            ref={gotoRef} type="button" className={`dh-exec-range dh-exec-range-goto${custom ? " is-active" : ""}`}
            aria-label={custom ? `Go to: showing ${customLabel}. Choose another date or range` : "Go to a date or range"}
            title={navigable ? "Go to a date or range" : "Go to (while presenting)"} aria-haspopup="dialog" aria-pressed={custom}
            aria-disabled={navigable ? undefined : true}
            onClick={navigable ? () => { setGotoMounted(true); setGotoOpen(true); } : undefined}
          >
            <CalendarDays size={15} strokeWidth={1.8} aria-hidden="true" />
            {custom ? <span>{customLabel}</span> : null}
          </button>
        </div>
      </div>
      {gotoMounted ? (
        <GoToDialog system={system} mode={mode === "dark" ? "dark" : "light"} open={gotoOpen} onClose={() => setGotoOpen(false)} launcher={gotoRef} days={gotoDays} onGo={goTo} />
      ) : null}
    </section>
  );
}
