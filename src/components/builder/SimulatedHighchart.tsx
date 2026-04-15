"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useBuilder } from "@/store/useBuilder";

/* ═══════════════════════════════════════════════════════════
   SimulatedHighchart — renders any of the 12 Highcharts
   chart types inside the builder canvas, themed via
   --ds-* CSS variables inherited from the preview wrapper.

   Bridges the CSS-variable world (builder canvas) with
   Highcharts (which needs JS color strings) by reading
   computed styles at render time.
   ═══════════════════════════════════════════════════════════ */

import { ensureHighchartsModules } from "@/lib/highchartsInit";

/* ── Read --ds-* CSS variables from a DOM element ── */
interface ThemeVars {
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

/* ── Build base Highcharts theme from resolved CSS vars ── */
function baseTheme(v: ThemeVars): Partial<Highcharts.Options> {
  return {
    colors: [v.primary, v.positive, v.warning, v.negative, "#8B5CF6", "#EC4899", "#F59E0B", "#06B6D4"],
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
    plotOptions: { series: { borderWidth: 0, animation: { duration: 500 } } },
    credits: { enabled: false },
  };
}

/* ── Chart-specific option builders ── */

export type HighchartType =
  | "line" | "area" | "column" | "pie" | "scatter"
  | "bar" | "donut" | "gauge" | "heatmap" | "treemap"
  | "spline" | "stacked-column";

function chartOptions(
  chartType: HighchartType,
  t: Partial<Highcharts.Options>,
  v: ThemeVars,
  props: { title?: string; value?: number },
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
        xAxis: { ...tx, categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] },
        yAxis: { ...ty, title: { ...ty.title, text: "Revenue ($K)" } },
        series: [
          { name: "2024", data: [120, 134, 145, 152, 168, 185], type: "line" as const },
          { name: "2025", data: [140, 155, 162, 178, 195, 210], type: "line" as const },
        ],
      };

    case "area":
      return {
        ...t,
        chart: { ...tc, type: "area" },
        title: { ...tt, text: props.title || "User Growth" },
        xAxis: { ...tx, categories: ["Q1", "Q2", "Q3", "Q4"] },
        series: [
          { name: "Free", data: [5000, 8200, 12400, 18000], type: "area" as const },
          { name: "Pro", data: [1200, 2400, 4100, 6800], type: "area" as const },
        ],
        plotOptions: { ...t.plotOptions, area: { fillOpacity: 0.25 } },
      };

    case "column":
      return {
        ...t,
        chart: { ...tc, type: "column" },
        title: { ...tt, text: props.title || "Sales by Region" },
        xAxis: { ...tx, categories: ["NA", "EMEA", "APAC", "LATAM"] },
        series: [
          { name: "Q3", data: [420, 380, 290, 180], type: "column" as const },
          { name: "Q4", data: [480, 410, 340, 210], type: "column" as const },
        ],
      };

    case "pie":
      return {
        ...t,
        chart: { ...tc, type: "pie" },
        title: { ...tt, text: props.title || "Market Share" },
        series: [{
          name: "Share", type: "pie" as const,
          data: [
            { name: "Product A", y: 45 },
            { name: "Product B", y: 26 },
            { name: "Product C", y: 17 },
            { name: "Other", y: 12 },
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
        xAxis: { ...tx, categories: ["Alice", "Bob", "Carol", "Dan", "Eve"] },
        series: [{ name: "Score", data: [95, 88, 82, 76, 71], type: "bar" as const }],
      };

    case "donut":
      return {
        ...t,
        chart: { ...tc, type: "pie" },
        title: { ...tt, text: props.title || "Portfolio Allocation" },
        series: [{
          name: "Allocation", type: "pie" as const, innerSize: "60%",
          data: [
            { name: "Equities", y: 55 },
            { name: "Bonds", y: 25 },
            { name: "Alternatives", y: 12 },
            { name: "Cash", y: 8 },
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
        xAxis: { ...tx, categories: ["6am", "9am", "12pm", "3pm", "6pm", "9pm"] },
        series: [
          { name: "Today", data: [14, 18, 24, 27, 22, 16], type: "spline" as const },
          { name: "Yesterday", data: [12, 16, 22, 25, 20, 14], type: "spline" as const },
        ],
      };

    case "stacked-column":
      return {
        ...t,
        chart: { ...tc, type: "column" },
        title: { ...tt, text: props.title || "Revenue Breakdown" },
        xAxis: { ...tx, categories: ["Q1", "Q2", "Q3", "Q4"] },
        plotOptions: { ...t.plotOptions, column: { stacking: "normal" } },
        series: [
          { name: "Services", data: [120, 135, 148, 162], type: "column" as const },
          { name: "Products", data: [80, 95, 110, 125], type: "column" as const },
          { name: "Licensing", data: [40, 45, 52, 58], type: "column" as const },
        ],
      };

    /* ── Advanced charts ── */

    case "gauge": {
      const val = props.value ?? 87;
      return {
        ...t,
        chart: { ...tc, type: "solidgauge", height: 250 },
        title: { ...tt, text: props.title || "System Health" },
        pane: {
          center: ["50%", "70%"], size: "100%", startAngle: -90, endAngle: 90,
          background: [{
            backgroundColor: v.primary + "20",
            innerRadius: "60%", outerRadius: "100%",
            shape: "arc" as const, borderWidth: 0,
          }],
        },
        yAxis: {
          min: 0, max: 100, lineWidth: 0, tickWidth: 0,
          minorTickInterval: null as any,
          labels: { enabled: false },
        },
        series: [{
          name: "Health", data: [val], type: "solidgauge" as any,
          dataLabels: {
            format: `<span style="font-size:22px;font-weight:600;color:${v.fg}">{y}%</span>`,
            borderWidth: 0, y: -20,
          },
          innerRadius: "60%", radius: "100%",
        }],
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
  system: "salt" | "m3" | "fluent";
}

export function SimulatedHighchart({ chartType, title, value, system }: SimulatedHighchartProps) {
  ensureHighchartsModules();
  const mode = useBuilder((s) => s.mode);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [vars, setVars] = useState<ThemeVars | null>(null);

  /* Read CSS vars on mount and when system/mode changes */
  useEffect(() => {
    if (!wrapperRef.current) return;
    const id = requestAnimationFrame(() => {
      if (wrapperRef.current) setVars(readThemeVars(wrapperRef.current));
    });
    return () => cancelAnimationFrame(id);
  }, [system, mode]);

  const options = useMemo(() => {
    if (!vars) return null;
    return chartOptions(chartType, baseTheme(vars), vars, { title, value });
  }, [vars, chartType, title, value]);

  return (
    <div ref={wrapperRef} style={{ width: "100%", minHeight: 250 }}>
      {options ? (
        <HighchartsReact highcharts={Highcharts} options={options} />
      ) : (
        <div style={{
          height: 250,
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
