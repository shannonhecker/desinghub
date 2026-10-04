"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useBuilder } from "@/store/useBuilder";

/* ═══════════════════════════════════════════════════════════
   SimulatedHighchart - renders any of the 15 Highcharts
   chart types inside the builder canvas, themed via
   --ds-* CSS variables inherited from the preview wrapper.

   Bridges the CSS-variable world (builder canvas) with
   Highcharts (which needs JS color strings) by reading
   computed styles at render time.
   ═══════════════════════════════════════════════════════════ */

import { ensureHighchartsModules } from "@/lib/highchartsInit";
import { getPalette } from "@/lib/categoricalPalettes";
import type { DesignSystem } from "@/store/useBuilder";

/* ── Read --ds-* CSS variables from a DOM element ── */
export interface ThemeVars {
  primary: string;
  bg: string;
  fg: string;
  fgSec: string;
  fgTer: string;
  surface: string;
  border: string;
  positive: string;
  warning: string;
  negative: string;
}

function readThemeVars(el: HTMLElement): ThemeVars {
  const cs = getComputedStyle(el);
  const v = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb;
  return {
    primary: v("--ds-primary", "#1B7F9E"),
    bg: v("--ds-bg", "#101820"),
    fg: v("--ds-fg", "#E2E4E5"),
    fgSec: v("--ds-fg-secondary", "#B0B4B8"),
    fgTer: v("--ds-fg-tertiary", "#808488"),
    surface: v("--ds-surface", "#1C2830"),
    border: v("--ds-border", "#3C4850"),
    positive: v("--ds-status-positive", "#36b37e"),
    warning: v("--ds-status-warning", "#ffab00"),
    negative: v("--ds-status-negative", "#de350b"),
  };
}

/* ── Build base Highcharts theme from resolved CSS vars ──
 *   `palette` is the 12-colour categorical palette for the active DS,
 *   merged from `/lib/categoricalPalettes.ts`. When a block specifies
 *   its own `seriesColors` (per-chart override set by chat or picker),
 *   those take precedence over this palette slot-for-slot. */
function baseTheme(
  v: ThemeVars,
  palette: string[],
  seriesColors?: string[]
): Partial<Highcharts.Options> {
  /* Overlay seriesColors onto the palette - keeps unspecified slots
   *  filled by the DS palette instead of bleeding through to hardcoded
   *  defaults. */
  const colors = palette.map((p, i) => seriesColors?.[i] ?? p);
  return {
    colors,
    chart: { backgroundColor: "transparent", style: { fontFamily: "inherit" }, height: 250 },
    title: { style: { color: v.fg, fontSize: "13px", fontWeight: "600" }, align: "left" },
    xAxis: {
      gridLineColor: "transparent",
      lineColor: v.border,
      tickColor: v.border,
      labels: { style: { color: v.fgTer, fontSize: "10px" } },
      title: { style: { color: v.fgSec, fontSize: "10px" } },
    },
    yAxis: {
      gridLineColor: v.border + "30",
      lineColor: "transparent",
      tickColor: "transparent",
      labels: { style: { color: v.fgTer, fontSize: "10px" } },
      title: { style: { color: v.fgSec, fontSize: "10px" } },
    },
    tooltip: {
      backgroundColor: v.surface,
      borderColor: v.border,
      style: { color: v.fg, fontSize: "11px" },
      borderRadius: 6,
    },
    legend: {
      itemStyle: { color: v.fgSec, fontSize: "10px", fontWeight: "500" },
      itemHoverStyle: { color: v.fg },
    },
    plotOptions: { series: { borderWidth: 0, animation: { duration: prefersReducedMotion() ? 0 : 500 } } },
    credits: { enabled: false },
  };
}

/* Read prefers-reduced-motion at call time. SSR-safe: `window` may be
   undefined during the initial render on the server, default to false
   (i.e. animations enabled) so the SSR markup matches the client's
   pre-hydration state. The chart is only constructed after mount. */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/* ── Chart-specific option builders ── */

export type HighchartType =
  | "line" | "area" | "column" | "pie" | "scatter"
  | "bar" | "donut" | "gauge" | "heatmap" | "treemap"
  | "spline" | "stacked-column"
  | "combination" | "stacked-bar" | "stacked-area"
  | "waterfall";

/** One data series. `type`, `yAxis` and `dashStyle` only matter to the
 *  combination chart, where each series picks its own mark and axis. */
export interface ChartSeries {
  name: string;
  data: (number | null)[];
  type?: "column" | "line" | "spline" | "area";
  /** 0 = left axis (default), 1 = right axis. */
  yAxis?: 0 | 1;
  dashStyle?: "Solid" | "Dash" | "ShortDash" | "Dot";
}

/** Everything a chart block can say about itself. */
export interface ChartProps {
  title?: string;
  value?: number;
  /** Domain data the template/model can pass so charts aren't generic. */
  seriesData?: { name: string; y: number }[];
  categories?: string[];
  series?: ChartSeries[];
  /** Chart height in px (default 250). */
  height?: number;
  /** Drop the in-chart title (a framed panel shows it in its header). */
  hideTitle?: boolean;
  /** Highcharts label format for the value axis, e.g. "{value}%". */
  yAxisFormat?: string;
  yAxisTitle?: string;
  /** Right-hand axis of a combination chart. */
  secondaryAxisFormat?: string;
  secondaryAxisTitle?: string;
  /** Text drawn in the middle of a donut (e.g. a total). */
  centerLabel?: string;
  /** false hides the legend. */
  legend?: boolean;
  /** Upper bound of the value axis (e.g. 100 for shares of a whole). */
  yAxisMax?: number;
  /** Tooltip number format: decimal places and a suffix such as "%". */
  valueDecimals?: number;
  valueSuffix?: string;
  /** Gauge: the top of its scale (default 100, shown as a percentage). */
  valueMax?: number;
  /** One colour per point of the first series (a column coloured by bucket,
   *  a waterfall's steps). A tone name - "good", "mid", "bad", "neutral",
   *  "accent" - follows the design system; anything else is a CSS colour. */
  pointColors?: string[];
  /** Name of the selected point; the others are dimmed. */
  selected?: string;
  /** Makes points clickable: called with the clicked point's name. */
  onSelectPoint?: (name: string) => void;
}

/** A point colour: a tone name resolved against the theme, or a CSS colour. */
export function resolvePointColor(color: string, v: ThemeVars): string {
  switch (color) {
    case "good": return v.positive;
    case "mid": return v.warning;
    case "bad": return v.negative;
    case "accent": return v.primary;
    case "neutral": return v.fgTer;
    default: return color;
  }
}

/** Opacity of the points that are not the selected one. */
const DIMMED_POINT_OPACITY = 0.28;

/** Per-point colours and selection for the first series: every point gets
 *  an explicit colour (from `pointColors`, else the palette / series colour),
 *  dimmed when another point is selected. */
function applyPointStyling(o: Highcharts.Options, v: ThemeVars, props: ChartProps, colorByPoint: boolean): void {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const series = (o.series as any[] | undefined)?.[0];
  if (!series || !Array.isArray(series.data)) return;
  if (!props.pointColors?.length && !props.selected) return;
  const palette = ((o.colors as string[] | undefined) ?? []).filter(Boolean);
  const categories = ((o.xAxis as any)?.categories as string[] | undefined) ?? [];
  series.data = series.data.map((point: any, i: number) => {
    const obj = point !== null && typeof point === "object" && !Array.isArray(point) ? { ...point } : { y: point };
    const name = String(obj.name ?? categories[i] ?? "");
    const own = props.pointColors?.[i];
    const base = own
      ? resolvePointColor(own, v)
      : obj.color ?? (colorByPoint ? palette[i % Math.max(1, palette.length)] : series.color ?? palette[0]) ?? v.primary;
    const dimmed = Boolean(props.selected) && name !== props.selected;
    return { ...obj, color: dimmed ? (Highcharts.color(base).setOpacity(DIMMED_POINT_OPACITY).get("rgba") as string) : base };
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

/** Options for one chart: the per-type build, then the settings every type
 *  shares (height, title, axis format, legend, donut centre label). */
export function buildChartOptions(
  chartType: HighchartType,
  t: Partial<Highcharts.Options>,
  v: ThemeVars,
  props: ChartProps,
): Highcharts.Options {
  const o = chartOptions(chartType, t, v, props);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  if (props.height) o.chart = { ...(o.chart as any), height: props.height };
  if (props.hideTitle) o.title = { ...(o.title as any), text: undefined };
  if (props.legend === false) o.legend = { ...(o.legend as any), enabled: false };
  if (props.valueDecimals !== undefined || props.valueSuffix) {
    o.tooltip = {
      ...(o.tooltip as any),
      ...(props.valueDecimals !== undefined ? { valueDecimals: props.valueDecimals } : {}),
      ...(props.valueSuffix ? { valueSuffix: props.valueSuffix } : {}),
    };
  }
  /* Value-axis format + title apply to the single-axis types; the
     combination chart builds its own pair of axes. */
  if (o.yAxis && !Array.isArray(o.yAxis) && chartType !== "gauge" && chartType !== "heatmap") {
    const y = o.yAxis as any;
    if (props.yAxisFormat) y.labels = { ...y.labels, format: props.yAxisFormat };
    if (props.yAxisMax !== undefined) y.max = props.yAxisMax;
    if (props.yAxisTitle !== undefined || props.hideTitle) {
      y.title = { ...y.title, text: props.yAxisTitle || undefined };
    }
  }
  /* A framed pie / donut names its parts in the legend, with their share,
     instead of leader-line labels: in a compact panel the labels squeeze the
     ring to a fraction of the space and collide with a centre label. */
  if (props.hideTitle && (chartType === "donut" || chartType === "pie")) {
    const pie = { ...((o.plotOptions as any)?.pie ?? {}), dataLabels: { enabled: false }, showInLegend: true };
    if (chartType === "donut") o.series = (o.series as any[]).map((s) => ({ ...s, innerSize: "68%" }));
    o.plotOptions = { ...(o.plotOptions as any), pie };
    o.legend = {
      ...(o.legend as any),
      /* Beyond a handful of parts the legend pages at three rows: a
         breakdown with a dozen parts must not take the ring's space. */
      ...(pieParts(o) > PIE_LEGEND_FREE_ITEMS ? { maxHeight: PIE_LEGEND_MAX_HEIGHT } : {}),
      navigation: { activeColor: v.fg, inactiveColor: v.fgTer, style: { color: v.fgSec }, arrowSize: 9 },
      labelFormatter(this: { name: string; percentage?: number }) {
        return this.percentage === undefined ? this.name : `${this.name} ${Math.round(this.percentage)}%`;
      },
    };
  }
  applyPointStyling(o, v, props, chartType === "pie" || chartType === "donut" || chartType === "waterfall");
  if (props.onSelectPoint) {
    const onSelect = props.onSelectPoint;
    const series = { ...((o.plotOptions as any)?.series ?? {}) };
    o.plotOptions = {
      ...(o.plotOptions as any),
      series: {
        ...series,
        cursor: "pointer",
        point: {
          events: {
            click(this: { name?: string; category?: string | number }) {
              onSelect(String(this.name ?? this.category ?? ""));
            },
          },
        },
      },
    };
  }
  if (props.centerLabel && chartType === "donut") {
    o.chart = { ...(o.chart as any), dhCenter: { text: props.centerLabel, color: v.fg }, events: { render: renderCenterLabel } };
  }
  /* The accessibility module describes the chart to assistive tech; give it
     the title even when the visible title is hidden. */
  o.accessibility = { ...(o.accessibility as any), description: props.title || undefined };
  /* eslint-enable @typescript-eslint/no-explicit-any */
  return o;
}

const CENTER_LABEL_FONT_SIZE = 15;
const CENTER_LABEL_MIN_FONT_SIZE = 9;
/** Share of the ring's hole the centre label may span. */
const CENTER_LABEL_FILL = 0.78;
const PIE_LEGEND_MAX_HEIGHT = 56;
/** Up to this many parts the legend is shown whole. */
const PIE_LEGEND_FREE_ITEMS = 6;
function pieParts(o: Highcharts.Options): number {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const data = (o.series as any[] | undefined)?.[0]?.data;
  return Array.isArray(data) ? data.length : 0;
}

/** Highcharts `render` handler that keeps one text label centred on the pie.
 *  Runs on every redraw, so the label follows a resize. Its text and colour
 *  are read from the chart's CURRENT options each time (chart.dhCenter): the
 *  handler is bound once, but the options change with the theme and data. */
function renderCenterLabel(this: Highcharts.Chart) {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const chart = this as any;
  const center = chart.options?.chart?.dhCenter as { text: string; color: string } | undefined;
  const series = chart.series?.[0];
  if (!center || !series?.center) return;
  const [cx, cy] = series.center as number[];
  if (!chart.dhCenterLabel) {
    chart.dhCenterLabel = chart.renderer.text(center.text, 0, 0).attr({ align: "center", zIndex: 5 }).add();
  }
  chart.dhCenterLabel.css({ color: center.color, fontSize: `${CENTER_LABEL_FONT_SIZE}px`, fontWeight: "600" });
  chart.dhCenterLabel.attr({ text: center.text, visibility: "inherit" });
  /* Fit the hole: shrink the text when the ring is small, and drop it when
     it would be too small to read rather than let it run over the ring. */
  const hole = Number((series.center as number[])[3]) || 0;
  let box = chart.dhCenterLabel.getBBox();
  if (hole > 0 && box.width > hole * CENTER_LABEL_FILL) {
    const size = Math.floor((CENTER_LABEL_FONT_SIZE * hole * CENTER_LABEL_FILL) / box.width);
    if (size < CENTER_LABEL_MIN_FONT_SIZE) {
      chart.dhCenterLabel.attr({ visibility: "hidden" });
      return;
    }
    chart.dhCenterLabel.css({ fontSize: `${size}px` });
    box = chart.dhCenterLabel.getBBox();
  }
  chart.dhCenterLabel.attr({ x: chart.plotLeft + cx, y: chart.plotTop + cy + box.height / 4 });
}

function chartOptions(
  chartType: HighchartType,
  t: Partial<Highcharts.Options>,
  v: ThemeVars,
  props: ChartProps,
): Highcharts.Options {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const tc = t.chart as any;
  const tt = t.title as any;
  const tx = t.xAxis as any;
  const ty = t.yAxis as any;

  switch (chartType) {
    /* ── Core charts ── */

    case "line":
      return {
        ...t,
        chart: { ...tc, type: "line" },
        title: { ...tt, text: props.title || "Monthly Revenue" },
        xAxis: { ...tx, categories: props.categories ?? ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] },
        yAxis: { ...ty, title: { ...ty.title, text: "Revenue ($K)" } },
        series: props.series
          ? props.series.map((s) => ({ ...s, type: "line" as const }))
          : [
              /* Realistic monthly revenue: organic upward drift with month-to-month
                 noise (not a clean monotonic ramp), prior year tracking below. */
              { name: "This year", data: [128, 121, 142, 138, 159, 174], type: "line" as const },
              { name: "Last year", data: [104, 112, 109, 126, 131, 140], type: "line" as const },
            ],
      };

    case "area":
      return {
        ...t,
        chart: { ...tc, type: "area" },
        title: { ...tt, text: props.title || "Revenue trend" },
        xAxis: { ...tx, categories: props.categories ?? ["Wk 1", "Wk 2", "Wk 3", "Wk 4"] },
        series: props.series
          ? props.series.map((s) => ({ ...s, type: "area" as const }))
          : [
              /* Weekly revenue with believable variance (a dip in wk 3, not a
                 textbook doubling) and a prior-period baseline below it. */
              { name: "This period", data: [9800, 11200, 10600, 12400], type: "area" as const },
              { name: "Prior period", data: [8600, 9100, 9400, 9900], type: "area" as const },
            ],
        plotOptions: { ...t.plotOptions, area: { fillOpacity: 0.25 } },
      };

    case "column":
      return {
        ...t,
        chart: { ...tc, type: "column" },
        title: { ...tt, text: props.title || "Sales by Region" },
        xAxis: { ...tx, categories: props.categories ?? ["NA", "EMEA", "APAC", "LATAM"] },
        series: props.series
          ? props.series.map((s) => ({ ...s, type: "column" as const }))
          : [
              /* Uneven regional spread with quarter-on-quarter growth that isn't
                 uniform (APAC jumps hardest, LATAM barely moves). */
              { name: "Q3", data: [412, 357, 268, 174], type: "column" as const },
              { name: "Q4", data: [468, 389, 341, 192], type: "column" as const },
            ],
      };

    case "pie":
      return {
        ...t,
        chart: { ...tc, type: "pie" },
        title: { ...tt, text: props.title || "Market Share" },
        series: [{
          name: "Share", type: "pie" as const,
          data: props.seriesData?.length ? props.seriesData : [
            /* Realistic share split: a clear leader, a long tail, an "Other"
               bucket - shares that sum to 100 without being round numbers. */
            { name: "Direct", y: 38 },
            { name: "Organic search", y: 27 },
            { name: "Referral", y: 19 },
            { name: "Social", y: 11 },
            { name: "Other", y: 5 },
          ],
        }],
        plotOptions: {
          ...t.plotOptions,
          pie: {
            allowPointSelect: true,
            dataLabels: {
              enabled: true,
              format: "{point.name}: {point.percentage:.0f}%",
              style: { fontSize: "10px", color: v.fgSec, textOutline: "none" },
            },
          },
        },
      };

    case "scatter":
      return {
        ...t,
        chart: { ...tc, type: "scatter" },
        title: { ...tt, text: props.title || "Risk vs Return" },
        xAxis: { ...tx, title: { ...tx.title, text: "Risk (%)" } },
        yAxis: { ...ty, title: { ...ty.title, text: "Return (%)" } },
        series: [
          { name: "Equities", type: "scatter" as const, data: [[8, 12], [10, 15], [12, 11], [15, 18], [6, 8], [9, 14]] },
          { name: "Bonds", type: "scatter" as const, data: [[2, 3], [3, 4], [4, 5], [3, 3.5], [2.5, 4.2]] },
        ],
      };

    case "bar":
      return {
        ...t,
        chart: { ...tc, type: "bar" },
        title: { ...tt, text: props.title || "Top Performers" },
        xAxis: { ...tx, categories: props.categories ?? ["Alice", "Bob", "Carol", "Dan", "Eve"] },
        series: props.series
          ? props.series.map((s) => ({ ...s, type: "bar" as const }))
          : [{ name: "Deals closed", data: [47, 41, 33, 28, 19], type: "bar" as const }],
      };

    case "donut":
      return {
        ...t,
        chart: { ...tc, type: "pie" },
        title: { ...tt, text: props.title || "Breakdown" },
        series: [{
          name: "Share", type: "pie" as const, innerSize: "60%",
          data: props.seriesData?.length ? props.seriesData : [
            /* Plan-tier split: paid Pro leads, a meaningful free base, a small
               enterprise slice - shares summing to 100, not even thirds. */
            { name: "Free", y: 31 },
            { name: "Pro", y: 46 },
            { name: "Enterprise", y: 23 },
          ],
        }],
        plotOptions: {
          ...t.plotOptions,
          pie: {
            dataLabels: {
              enabled: true,
              format: "{point.name}: {point.percentage:.0f}%",
              style: { fontSize: "10px", color: v.fgSec, textOutline: "none" },
            },
          },
        },
      };

    case "spline":
      return {
        ...t,
        chart: { ...tc, type: "spline" },
        title: { ...tt, text: props.title || "Temperature Trend" },
        xAxis: { ...tx, categories: props.categories ?? ["6am", "9am", "12pm", "3pm", "6pm", "9pm"] },
        series: props.series
          ? props.series.map((s) => ({ ...s, type: "spline" as const }))
          : [
              { name: "Today", data: [14, 18, 24, 27, 22, 16], type: "spline" as const },
              { name: "Yesterday", data: [12, 16, 22, 25, 20, 14], type: "spline" as const },
            ],
      };

    case "stacked-column":
      return {
        ...t,
        chart: { ...tc, type: "column" },
        title: { ...tt, text: props.title || "Revenue Breakdown" },
        xAxis: { ...tx, categories: props.categories ?? ["Q1", "Q2", "Q3", "Q4"] },
        plotOptions: { ...t.plotOptions, column: { stacking: "normal" } },
        series: props.series
          ? props.series.map((s) => ({ ...s, type: "column" as const }))
          : [
              { name: "Services", data: [120, 135, 148, 162], type: "column" as const },
              { name: "Products", data: [80, 95, 110, 125], type: "column" as const },
              { name: "Licensing", data: [40, 45, 52, 58], type: "column" as const },
            ],
      };

    case "stacked-bar":
      return {
        ...t,
        chart: { ...tc, type: "bar" },
        title: { ...tt, text: props.title || "Exposure by currency" },
        xAxis: { ...tx, categories: props.categories ?? ["USD", "EUR", "GBP", "JPY"] },
        /* reversedStacks off so the segments run in legend order, left to
           right, instead of the first series landing at the far end. */
        yAxis: { ...ty, reversedStacks: false },
        plotOptions: { ...t.plotOptions, bar: { stacking: "normal" } },
        series: props.series
          ? props.series.map((s) => ({ name: s.name, data: s.data, type: "bar" as const }))
          : [
              { name: "Bonds", data: [22, 14, 9, 4], type: "bar" as const },
              { name: "Equity", data: [31, 12, 11, 6], type: "bar" as const },
            ],
      };

    case "stacked-area":
      return {
        ...t,
        chart: { ...tc, type: "areaspline" },
        title: { ...tt, text: props.title || "Allocation history" },
        xAxis: { ...tx, categories: props.categories ?? ["Q1", "Q2", "Q3", "Q4"] },
        plotOptions: {
          ...t.plotOptions,
          areaspline: { stacking: "normal", fillOpacity: 0.5, lineWidth: 1, marker: { enabled: false } },
        },
        series: props.series
          ? props.series.map((s) => ({ name: s.name, data: s.data, type: "areaspline" as const }))
          : [
              { name: "Bonds", data: [38, 36, 37, 35], type: "areaspline" as const },
              { name: "Equity", data: [44, 47, 45, 48], type: "areaspline" as const },
              { name: "Private assets", data: [18, 17, 18, 17], type: "areaspline" as const },
            ],
      };

    /* Columns and lines on shared categories; each series chooses its mark
       and, optionally, the right-hand axis. */
    case "combination": {
      const series: ChartSeries[] = props.series ?? [
        { name: "Active", data: [4.1, 4.4, 3.9, 4.8, 5.2, 4.9], type: "column", yAxis: 1 },
        { name: "Portfolio", data: [11.2, 11.9, 11.4, 12.6, 13.1, 12.8], type: "line" },
        { name: "Benchmark", data: [10.4, 10.8, 10.9, 11.7, 12.0, 11.9], type: "line", dashStyle: "ShortDash" },
      ];
      const hasSecondary = series.some((s) => s.yAxis === 1);
      const primaryAxis = {
        ...ty,
        title: { ...ty.title, text: props.yAxisTitle || undefined },
        labels: { ...ty.labels, ...(props.yAxisFormat ? { format: props.yAxisFormat } : {}) },
      };
      const secondaryAxis = {
        ...ty,
        opposite: true,
        gridLineWidth: 0,
        title: { ...ty.title, text: props.secondaryAxisTitle || undefined },
        labels: { ...ty.labels, ...(props.secondaryAxisFormat ? { format: props.secondaryAxisFormat } : {}) },
      };
      return {
        ...t,
        chart: { ...tc },
        title: { ...tt, text: props.title || "Value at risk" },
        xAxis: { ...tx, categories: props.categories ?? ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] },
        yAxis: hasSecondary ? [primaryAxis, secondaryAxis] : primaryAxis,
        tooltip: { ...t.tooltip, shared: true },
        plotOptions: {
          ...t.plotOptions,
          line: { marker: { enabled: false } },
          spline: { marker: { enabled: false } },
        },
        series: series.map((s) => ({
          name: s.name,
          data: s.data,
          type: (s.type ?? "column") as any,
          yAxis: hasSecondary ? (s.yAxis ?? 0) : 0,
          ...(s.dashStyle ? { dashStyle: s.dashStyle } : {}),
          /* Columns sit behind the lines. */
          zIndex: (s.type ?? "column") === "column" ? 1 : 2,
        })),
      };
    }

    /* ── Advanced charts ── */

    case "gauge": {
      const val = props.value ?? 87;
      /* A score gauge names its own scale (valueMax: 10) and decimals; with
         neither, the gauge is the original percentage dial. */
      const max = props.valueMax ?? 100;
      const suffix = props.valueSuffix ?? (props.valueMax === undefined ? "%" : "");
      const number = props.valueDecimals !== undefined ? `{y:.${props.valueDecimals}f}` : "{y}";
      return {
        ...t,
        chart: { ...tc, type: "solidgauge", height: 250 },
        title: { ...tt, text: props.title || "System Health" },
        tooltip: { enabled: false },
        pane: {
          center: ["50%", "70%"], size: "100%", startAngle: -90, endAngle: 90,
          background: [{
            backgroundColor: v.primary + "20",
            innerRadius: "60%", outerRadius: "100%",
            shape: "arc" as const, borderWidth: 0,
          }],
        },
        yAxis: {
          min: 0, max, lineWidth: 0, tickWidth: 0,
          minorTickInterval: null as any,
          labels: { enabled: false },
        },
        series: [{
          name: "Health", data: [val], type: "solidgauge" as any,
          dataLabels: {
            format: `<span style="font-size:22px;font-weight:600;color:${v.fg}">${number}${suffix}</span>`,
            borderWidth: 0, y: -20,
          },
          innerRadius: "60%", radius: "100%",
        }],
      };
    }

    case "waterfall": {
      /* Steps that add to or take from a running total, then a sum bar. A
         part flagged `isSum` shows the running total at that point. */
      const steps = (props.seriesData as ({ name: string; y: number; isSum?: boolean })[] | undefined) ?? [
        { name: "Opening", y: 1200 },
        { name: "New", y: 340 },
        { name: "Churn", y: -180 },
        { name: "Expansion", y: 120 },
        { name: "Closing", y: 0, isSum: true },
      ];
      return {
        ...t,
        chart: { ...tc, type: "waterfall" },
        title: { ...tt, text: props.title || "Bridge" },
        xAxis: { ...tx, type: "category", categories: steps.map((s) => s.name) },
        legend: { enabled: false },
        series: [{
          name: props.title || "Value",
          type: "waterfall" as any,
          data: steps.map((s) => (s.isSum ? { name: s.name, isSum: true } : { name: s.name, y: s.y })),
          lineWidth: 1,
          lineColor: v.border,
          dashStyle: "Dot",
          borderWidth: 0,
          dataLabels: {
            enabled: true,
            inside: false,
            style: { fontSize: "11px", fontWeight: "500", color: v.fgSec, textOutline: "none" },
          },
        }] as any,
      };
    }

    case "heatmap":
      return {
        ...t,
        chart: { ...tc, type: "heatmap" },
        title: { ...tt, text: props.title || "Correlation Matrix" },
        xAxis: { ...tx, categories: ["A", "B", "C", "D"] },
        yAxis: { ...ty, categories: ["A", "B", "C", "D"], title: undefined, reversed: true },
        colorAxis: {
          min: -1, max: 1,
          stops: [[0, v.negative], [0.5, v.bg], [1, v.primary]],
        },
        series: [{
          name: "Correlation", type: "heatmap" as const, borderWidth: 1,
          data: [
            [0, 0, 1], [0, 1, 0.8], [0, 2, 0.3], [0, 3, -0.2],
            [1, 0, 0.8], [1, 1, 1], [1, 2, 0.5], [1, 3, 0.1],
            [2, 0, 0.3], [2, 1, 0.5], [2, 2, 1], [2, 3, 0.7],
            [3, 0, -0.2], [3, 1, 0.1], [3, 2, 0.7], [3, 3, 1],
          ],
          dataLabels: {
            enabled: true, format: "{point.value:.1f}",
            style: { fontSize: "10px", textOutline: "none", color: v.fg },
          },
        }],
        legend: { enabled: false },
      };

    case "treemap":
      return {
        ...t,
        chart: { ...tc, type: "treemap" },
        title: { ...tt, text: props.title || "Portfolio Treemap" },
        series: [{
          type: "treemap" as const, layoutAlgorithm: "squarified",
          data: [
            { name: "Tech", value: 35, colorValue: 1 },
            { name: "Healthcare", value: 20, colorValue: 2 },
            { name: "Finance", value: 18, colorValue: 3 },
            { name: "Energy", value: 12, colorValue: 4 },
            { name: "Consumer", value: 10, colorValue: 5 },
            { name: "Industrial", value: 5, colorValue: 6 },
          ],
        }],
      };

    default:
      return { ...t, title: { ...tt, text: props.title || "Chart" } };
  }
}

/* ═══════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════ */

interface SimulatedHighchartProps {
  chartType: HighchartType;
  title?: string;
  value?: number;
  system: DesignSystem;
  /** Per-chart colour override. Position-indexed — entry 0 overrides
   *  the first series, entry 1 the second, etc. Holes in the array
   *  fall back to the DS's categorical palette. Set via the chart
   *  inspector or by Claude emitting `updateBlockProps` with this
   *  array. */
  seriesColors?: string[];
  /** Domain chart data so templates/model output isn't generic. */
  seriesData?: { name: string; y: number }[];
  categories?: string[];
  series?: ChartSeries[];
  /** Height, axis formats, legend, donut centre label, hidden title. */
  height?: number;
  hideTitle?: boolean;
  yAxisFormat?: string;
  yAxisTitle?: string;
  secondaryAxisFormat?: string;
  secondaryAxisTitle?: string;
  centerLabel?: string;
  legend?: boolean;
  yAxisMax?: number;
  valueDecimals?: number;
  valueSuffix?: string;
  valueMax?: number;
  pointColors?: string[];
  selected?: string;
  onSelectPoint?: (name: string) => void;
}

const DEFAULT_CHART_HEIGHT = 250;

export function SimulatedHighchart({
  chartType, title, value, system, seriesColors, seriesData, categories, series,
  height, hideTitle, yAxisFormat, yAxisTitle, secondaryAxisFormat, secondaryAxisTitle, centerLabel, legend, valueDecimals, valueSuffix, yAxisMax,
  valueMax, pointColors, selected, onSelectPoint,
}: SimulatedHighchartProps) {
  /* The click handler is read through a ref so a new function identity each
     render does not rebuild the chart. */
  const onSelectRef = useRef(onSelectPoint);
  useEffect(() => { onSelectRef.current = onSelectPoint; }, [onSelectPoint]);
  const selectable = Boolean(onSelectPoint);
  const pointColorsKey = pointColors ? pointColors.join("|") : "";
  const mode = useBuilder((s) => s.mode);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const [vars, setVars] = useState<ThemeVars | null>(null);

  /* ensureHighchartsModules registers all Highcharts modules globally.
     Run once on mount, not on every render — module registration is
     idempotent but not free, and calling it from the render body fires
     on every streaming-induced re-render. */
  useEffect(() => {
    ensureHighchartsModules();
  }, []);

  /* Destroy the chart instance on unmount. HighchartsReact does not
     auto-destroy, so leaks accumulate across template/DS switches and
     block-remove cycles — each leaked chart keeps ResizeObservers and
     animation timers alive. */
  useEffect(() => {
    return () => {
      chartRef.current?.chart?.destroy();
    };
  }, []);

  /* Read CSS vars on mount and when system/mode changes */
  useEffect(() => {
    if (!wrapperRef.current) return;
    const id = requestAnimationFrame(() => {
      if (wrapperRef.current) setVars(readThemeVars(wrapperRef.current));
    });
    return () => cancelAnimationFrame(id);
  }, [system, mode]);

  /* Resolve the DS categorical palette once per system change. */
  const palette = useMemo(() => getPalette(system), [system]);

  /* Memoise the colour-signature of seriesColors so useMemo below can
   *  rely on a primitive dep rather than a fresh array reference. */
  const seriesColorsKey = useMemo(
    () => (seriesColors ? seriesColors.join("|") : ""),
    [seriesColors],
  );

  const options = useMemo(() => {
    if (!vars) return null;
    return buildChartOptions(
      chartType,
      baseTheme(vars, palette, seriesColors),
      vars,
      {
        title, value, seriesData, categories, series, height, hideTitle, yAxisFormat, yAxisTitle, secondaryAxisFormat, secondaryAxisTitle, centerLabel, legend, valueDecimals, valueSuffix, yAxisMax,
        valueMax, pointColors, selected,
        ...(selectable ? { onSelectPoint: (name: string) => onSelectRef.current?.(name) } : {}),
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vars, chartType, title, value, palette, seriesColorsKey, seriesData, categories, series, height, hideTitle, yAxisFormat, yAxisTitle, secondaryAxisFormat, secondaryAxisTitle, centerLabel, legend, valueDecimals, valueSuffix, yAxisMax, valueMax, pointColorsKey, selected, selectable]);

  const boxHeight = height ?? DEFAULT_CHART_HEIGHT;
  return (
    <div ref={wrapperRef} style={{ width: "100%", minHeight: boxHeight }}>
      {options ? (
        <HighchartsReact ref={chartRef} highcharts={Highcharts} options={options} />
      ) : (
        <div style={{
          height: boxHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.3,
          fontSize: 12,
        }}>
          Loading chart…
        </div>
      )}
    </div>
  );
}
