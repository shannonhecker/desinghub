"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { CandlestickChart, Check, Clock, Layers, Table2 } from "lucide-react";
import { useBuilder, type DesignSystem } from "@/store/useBuilder";
import { ensureHighchartsModules } from "@/lib/highchartsInit";
import { getPalette } from "@/lib/categoricalPalettes";
import { panelHeightOf } from "@/lib/panelMetrics";
import {
  EXECUTION_CHART_STYLES, EXECUTION_INTERVALS, EXECUTION_KEYS, EXECUTION_OVERLAYS, EXECUTION_RANGES,
  executionRows, formatBarStamp, formatBarTime, formatPips, formatPrice, resolveExecution, toggleOverlay,
  type ExecutionPill, type ExecutionView,
} from "@/lib/executionModel";
import type { GridColumn } from "@/lib/dataGridModel";
import { readThemeVars, type ThemeVars } from "./SimulatedHighchart";
import { SimulatedDataGrid } from "./SimulatedDataGrid";
import { usePreviewReadOnly } from "./previewReadOnly";
import { useCanvasDataset } from "./useBoundData";

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
const RANGE_ROW = 44;
const PAD = 12;
/** Room on the right for the price axis and its tags. */
const PRICE_GUTTER = 92;
const PILL_HEIGHT = 20;
/** Share of the plot the volume strip takes, at the bottom. */
const VOLUME_SHARE = 18;
/** Width a time label needs on the axis. */
const TICK_ROOM = 84;
/** Below this chart width, the phone treatment. */
const NARROW_CHART = 420;
/* Type sizes inside the chart (Highcharts takes them as CSS lengths). */
const SMALL = `${10}px`;
const TIP = `${11}px`;
/* Palette slots for the two order lines (past the five the venues use). */
const LIMIT_COLOR = 5;
const TWAP_COLOR = 6;
const STATE_TONES: Record<string, keyof ThemeVars> = { "Delay start": "fgTer", Suspend: "warning", "Outside limit price": "negative" };

const TABLE_COLUMNS: GridColumn[] = [
  { field: "time", header: "Time", minWidth: 130, flex: 2 },
  { field: "bid", header: "Bid", kind: "number", decimals: 5, width: 96 },
  { field: "ask", header: "Ask", kind: "number", decimals: 5, width: 96 },
  { field: "mid", header: "Mid", kind: "number", decimals: 5, width: 96 },
  { field: "pctDone", header: "% done", kind: "number", decimals: 1, width: 84 },
  { field: "avgFill", header: "Avg fill", kind: "number", decimals: 5, width: 96 },
  { field: "fill", header: "Fill (m)", kind: "number", decimals: 2, width: 84 },
];

const alpha = (color: string, opacity: number): string => Highcharts.color(color).setOpacity(opacity).get("rgba") as string;

function buildOptions(view: ExecutionView, v: ThemeVars, palette: string[], height: number, onVenue: (venue: string) => void): Highcharts.Options {
  const n = view.times.length;
  const acrossDays = view.times[n - 1] - view.times[0] > 36 * 60 * 60 * 1000;
  const shows = (overlay: (typeof EXECUTION_OVERLAYS)[number]) => !view.hidden.includes(overlay);
  const venueColor = (venue: string) => palette[Math.max(0, view.venues.indexOf(venue)) % palette.length];
  const line = { type: "line" as const, step: "left" as const, yAxis: 1, marker: { enabled: false }, states: { hover: { lineWidthPlus: 0 } } };
  const xy = (values: (number | null)[]) => values.map((y, x) => [x, y] as [number, number | null]);
  const plotShare = shows("Volume") ? 100 - VOLUME_SHARE : 100;

  const market: Highcharts.SeriesOptionsType[] =
    view.chartStyle === "Line"
      ? [
          { ...line, name: "Bid", data: xy(view.bid), color: v.fgSec, lineWidth: 1.6 },
          { ...line, name: "Ask", data: xy(view.ask), color: v.negative, lineWidth: 1.2 },
          ...(shows("Mid line") ? [{ ...line, name: "Mid", data: xy(view.mid), color: v.fgTer, lineWidth: 1, dashStyle: "Dot" as const }] : []),
        ]
      : [{
          type: view.chartStyle === "Candlestick" ? "candlestick" : "ohlc",
          name: "Market", yAxis: 1,
          data: view.candles.map(([o, h, l, c], x) => [x, o, h, l, c]),
          color: v.negative, upColor: v.positive, lineColor: v.negative, upLineColor: v.positive,
          /* A candle is a column underneath: without this the price axis
             would stretch down to zero. */
          threshold: null,
        } as Highcharts.SeriesOptionsType];

  const benchmark = (name: string, value: number | null): Highcharts.SeriesOptionsType[] =>
    value === null || !shows("Benchmarks")
      ? []
      : [{ type: "line", name, yAxis: 1, data: [[0, value], [n - 1, value]], color: v.fgSec, lineWidth: 1, dashStyle: "ShortDot", marker: { enabled: false }, enableMouseTracking: false }];

  return {
    chart: {
      backgroundColor: "transparent", style: { fontFamily: "inherit" }, height,
      spacing: [8, 0, 0, 0], marginRight: PRICE_GUTTER, animation: false,
      /* Each axis keeps its own scale (percent done is 0 to 100 whatever the price range is). */
      alignTicks: false,
    },
    title: { text: undefined },
    credits: { enabled: false },
    accessibility: { description: `${view.pair} execution: market, limit price, fills and percent done for order ${view.order.id}.` },
    xAxis: {
      min: -0.5, max: n - 0.5,
      lineColor: v.border, tickLength: 0,
      crosshair: { dashStyle: "Dash", color: v.fgTer, width: 1 },
      /* As many time labels as the plot has room for. */
      tickPositioner() {
        const room = Math.max(2, Math.floor((this.chart.plotWidth || 600) / TICK_ROOM));
        const step = Math.max(1, Math.round(n / room));
        const out: number[] = [];
        for (let i = Math.floor(step / 2); i < n; i += step) out.push(i);
        return out;
      },
      labels: { rotation: 0, style: { color: v.fgTer, fontSize: SMALL, textOverflow: "none", whiteSpace: "nowrap" }, formatter() { const t = view.times[Math.round(Number(this.value))]; return t === undefined ? "" : formatBarTime(t, acrossDays); } },
      plotBands: view.bands.map((b) => ({ id: b.state, from: b.from - 0.5, to: b.to - 0.5, color: alpha(v[STATE_TONES[b.state] ?? "fgTer"] as string, 0.14) })),
    },
    yAxis: [
      {
        title: { text: "% done", style: { color: v.fgTer, fontSize: SMALL } }, min: 0, max: 100, tickPositions: [0, 20, 40, 60, 80, 100], endOnTick: false, startOnTick: false, height: `${plotShare}%`,
        gridLineColor: alpha(v.border, 0.4), gridLineWidth: shows("Gridlines") ? 1 : 0,
        labels: { style: { color: v.fgTer, fontSize: SMALL } },
      },
      {
        title: { text: undefined }, opposite: true, height: `${plotShare}%`, gridLineWidth: 0, startOnTick: false, endOnTick: false,
        labels: { align: "left", x: 8, style: { color: v.fgTer, fontSize: SMALL, textOverflow: "none", whiteSpace: "nowrap" }, formatter() { return formatPrice(Number(this.value)); } },
      },
      { title: { text: undefined }, top: `${plotShare}%`, height: `${100 - plotShare}%`, labels: { enabled: false }, gridLineWidth: 0, visible: shows("Volume") },
    ],
    legend: {
      itemStyle: { color: v.fgSec, fontSize: SMALL, fontWeight: "400" }, itemHoverStyle: { color: v.fg }, itemHiddenStyle: { color: v.fgTer },
      symbolHeight: 8, symbolWidth: 16, margin: 8, padding: 4,
    },
    tooltip: {
      shared: true, backgroundColor: v.card ?? v.surface, borderColor: v.border, borderRadius: 4, shadow: false,
      style: { color: v.fg, fontSize: TIP },
      formatter() {
        const points = (this as unknown as { points?: Highcharts.Point[] }).points ?? [this as unknown as Highcharts.Point];
        const x = Math.round(Number(points[0].x));
        const head = `<span style="color:${v.fgTer}">${formatBarStamp(view.times[x] ?? view.times[0])}</span>`;
        const rows = points.map((p) => {
          const o = p.options as { custom?: { venue: string; volume: number; passive: boolean; slippage: number } };
          if (o.custom) return `<span style="color:${String(p.color)}">●</span> ${o.custom.venue}: <b>${formatPrice(Number(p.y))}</b> · ${o.custom.volume.toFixed(1)}m · ${o.custom.passive ? "passive" : "aggressive"} · ${formatPips(o.custom.slippage, "p")}`;
          const value = p.series.name === "Percent done" ? `${Number(p.y).toFixed(1)}%` : p.series.name === "Volume" ? `${Number(p.y).toFixed(1)}m` : formatPrice(Number((p as unknown as { close?: number }).close ?? p.y));
          return `<span style="color:${String(p.series.color)}">●</span> ${p.series.name}: <b>${value}</b>`;
        });
        return [head, ...rows].join("<br/>");
      },
    },
    /* On a phone the plot keeps the width: the percent axis loses its
       labels (the area still reads against the gridlines) and the legend goes. */
    responsive: {
      rules: [{
        condition: { maxWidth: NARROW_CHART },
        chartOptions: { yAxis: [{ labels: { enabled: false }, title: { text: undefined } }, {}, {}], legend: { enabled: false } },
      }],
    },
    plotOptions: {
      series: { animation: false, turboThreshold: 0, states: { inactive: { opacity: 1 } }, events: { legendItemClick() { return true; } } },
    },
    series: [
      ...(shows("Percent done")
        ? [{
            type: "area" as const, name: "Percent done", yAxis: 0, step: "left" as const, data: xy(view.pct), color: v.primary, lineWidth: 1.6, marker: { enabled: false },
            fillColor: { linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, stops: [[0, alpha(v.primary, 0.28)], [1, alpha(v.primary, 0.02)]] as [number, string][] },
          }]
        : []),
      ...market,
      { ...line, name: "Limit price", data: xy(view.limit), color: palette[LIMIT_COLOR % palette.length], lineWidth: 1.4, dashStyle: "Dash" },
      ...(shows("Avg market fill") ? [{ ...line, name: "Avg market fill", data: xy(view.avgFill), color: v.fg, lineWidth: 1.3 }] : []),
      ...(shows("Session TWAP") ? [{ ...line, step: undefined, name: "Session TWAP", data: xy(view.twap), color: palette[TWAP_COLOR % palette.length], lineWidth: 1.2, dashStyle: "LongDash" as const }] : []),
      ...benchmark("Arrival mid", view.arrivalMid),
      ...benchmark("Risk transfer price", view.riskTransfer),
      {
        type: "scatter", name: "Trades", yAxis: 1, color: palette[0], cursor: "pointer",
        data: view.fills.map((f) => ({
          x: f.x, y: f.price, color: alpha(venueColor(f.venue), f.dim ? 0.14 : 1),
          marker: { radius: 2 + f.volume * 0.35, symbol: "circle", lineWidth: 1, lineColor: v.card ?? v.surface },
          custom: { venue: f.venue, volume: f.volume, passive: f.passive, slippage: f.slippage },
        })),
        point: { events: { click() { const o = this.options as { custom?: { venue: string } }; if (o.custom) onVenue(o.custom.venue); } } },
      },
      ...(shows("Volume")
        ? [{ type: "column" as const, name: "Volume", yAxis: 2, data: view.fills.filter((f) => !f.dim).map((f) => [f.x, f.volume]), color: alpha(v.primary, 0.55), pointWidth: 3, borderWidth: 0 }]
        : []),
      /* The held-back periods, as legend entries. */
      ...view.bands.map((b) => ({ type: "area" as const, name: b.state, data: [] as number[], color: alpha(v[STATE_TONES[b.state] ?? "fgTer"] as string, 0.5), enableMouseTracking: false, events: { legendItemClick: () => false } })),
    ] as Highcharts.SeriesOptionsType[],
  };
}

/** Draw the price tags against the right-hand axis, pushed apart where they
 *  would overlap. */
function drawPills(chart: Highcharts.Chart, pills: ExecutionPill[], v: ThemeVars, palette: string[], store: { current: Highcharts.SVGElement[] }): void {
  store.current.forEach((el) => el.destroy());
  store.current = [];
  const axis = chart.yAxis[1];
  if (!axis) return;
  const top = chart.plotTop;
  const bottom = chart.plotTop + axis.len;
  const placed = pills
    .map((p) => ({ p, y: axis.toPixels(p.value, false) }))
    .filter(({ y }) => Number.isFinite(y))
    .map(({ p, y }) => ({ p, y: Math.min(bottom - PILL_HEIGHT / 2, Math.max(top + PILL_HEIGHT / 2, y)) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < placed.length; i++) if (placed[i].y - placed[i - 1].y < PILL_HEIGHT + 2) placed[i].y = placed[i - 1].y + PILL_HEIGHT + 2;
  const fill: Partial<Record<ExecutionPill["key"], string>> = { bid: v.positive, limit: palette[LIMIT_COLOR % palette.length] };
  const card = v.card ?? v.surface;
  for (const { p, y } of placed) {
    const solid = fill[p.key];
    const label = chart.renderer
      .label(`${p.label} ${formatPrice(p.value)}`, chart.plotLeft + chart.plotWidth + 4, y - PILL_HEIGHT / 2)
      .attr({ fill: solid ?? card, stroke: solid ?? v.fgTer, "stroke-width": 1, r: PILL_HEIGHT / 2, padding: 4, zIndex: 9 })
      .css({ color: solid ? card : v.fg, fontSize: SMALL, fontWeight: "600" })
      .add();
    store.current.push(label);
  }
}

interface RailMenu { key: string; label: string; icon: React.ReactNode; items: { label: string; active: boolean; onPick: () => void }[]; multi?: boolean }

export function ExecutionChartBlock({ system, blockId }: { system: DesignSystem; blockId?: string }) {
  const block = useBuilder((s) => (blockId ? s.blocks.find((b) => b.id === blockId) : undefined));
  const reportState = useBuilder((s) => s.reportState);
  const setReportState = useBuilder((s) => s.setReportState);
  const mode = useBuilder((s) => s.mode);
  const dataset = useCanvasDataset();
  const readOnly = usePreviewReadOnly();
  const height = panelHeightOf(block?.props ?? {});
  const view = useMemo(() => (dataset ? resolveExecution(dataset, reportState) : null), [dataset, reportState]);
  const showTable = reportState[VIEW_KEY] === "Table";

  const rootRef = useRef<HTMLElement>(null);
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const pillsRef = useRef<Highcharts.SVGElement[]>([]);
  const [vars, setVars] = useState<ThemeVars | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const palette = useMemo(() => getPalette(system), [system]);

  useEffect(() => { ensureHighchartsModules(); }, []);
  useEffect(() => {
    const id = requestAnimationFrame(() => { if (rootRef.current) setVars({ ...readThemeVars(rootRef.current), card: getComputedStyle(rootRef.current).backgroundColor }); });
    return () => cancelAnimationFrame(id);
  }, [system, mode]);
  useEffect(() => () => { chartRef.current?.chart?.destroy(); }, []);

  /* A flyout closes on a click outside it and on Escape. */
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest?.(".dh-exec-rail")) setOpen(null); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(null); } };
    document.addEventListener("mousedown", away);
    window.addEventListener("keydown", key, true);
    return () => { document.removeEventListener("mousedown", away); window.removeEventListener("keydown", key, true); };
  }, [open]);

  const chartHeight = height - RANGE_ROW - PAD;
  const onVenueRef = useRef<(venue: string) => void>(() => {});
  useEffect(() => { onVenueRef.current = (venue) => setReportState(EXECUTION_KEYS.venue, reportState[EXECUTION_KEYS.venue] === venue ? null : venue); }, [reportState, setReportState]);
  const options = useMemo(() => {
    if (!view || !vars) return null;
    const o = buildOptions(view, vars, palette, chartHeight, (venue) => onVenueRef.current(venue));
    o.chart = { ...o.chart, events: { render() { drawPills(this, view.pills, vars, palette, pillsRef); } } };
    return o;
  }, [view, vars, palette, chartHeight]);

  if (!view) {
    return <section ref={rootRef} className="dh-panel dh-exec" style={{ "--dh-panel-h": `${height}px` } as React.CSSProperties} aria-label="Execution"><p className="dh-exec-empty">No execution data.</p></section>;
  }

  const set = (key: string, value: string) => { setReportState(key, value); setOpen(null); };
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
      style={{ "--dh-panel-h": `${height}px`, "--dh-exec-rail": `${RAIL_WIDTH}px`, "--dh-exec-range": `${RANGE_ROW}px`, "--dh-exec-pad": `${PAD}px` } as React.CSSProperties}
      aria-label={`${view.pair} execution`}
      /* While presenting, the chart's controls are its own: using one must
         not select the block for the amend composer. */
      onClick={readOnly ? (e) => e.stopPropagation() : undefined}
    >
      <div className="dh-exec-rail" role="toolbar" aria-label="Chart tools" aria-orientation="vertical">
        {menus.map((m) => (
          <div key={m.key} className="dh-exec-rail-group">
            <button type="button" className={`dh-exec-rail-btn${open === m.key ? " is-open" : ""}`} aria-label={m.label} title={m.label} aria-haspopup="menu" aria-expanded={open === m.key} onClick={() => setOpen(open === m.key ? null : m.key)}>
              {m.icon}
            </button>
            {open === m.key ? (
              <div className="dh-exec-flyout" role="menu" aria-label={m.label}>
                <p className="dh-exec-flyout-title">{m.label}</p>
                {m.items.map((item) => (
                  <button key={item.label} type="button" className="dh-exec-flyout-item" role={m.multi ? "menuitemcheckbox" : "menuitemradio"} aria-checked={item.active} onClick={item.onPick}>
                    <span className="dh-exec-flyout-check" aria-hidden="true">{item.active ? <Check size={14} strokeWidth={2.2} /> : null}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="dh-exec-main">
        <div className="dh-exec-plot" style={{ height: chartHeight }}>
          {showTable ? (
            <SimulatedDataGrid columns={TABLE_COLUMNS} rows={executionRows(view)} height={chartHeight} label={`${view.pair} bars`} />
          ) : options ? (
            /* Rebuilt, not patched, when the options change: the set of
               series differs between chart types, orders and overlays, and a
               patch matches series by position. */
            <HighchartsReact ref={chartRef} highcharts={Highcharts} options={options} immutable />
          ) : null}
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
