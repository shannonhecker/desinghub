"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { getTheme, getFont, getSystemInfo, activateTheme } from "@/data/registry";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

// Initialize Highcharts modules once via dynamic import
let modulesLoaded = false;
function ensureModules() {
  if (modulesLoaded || typeof window === "undefined") return;
  modulesLoaded = true;
  /* eslint-disable @typescript-eslint/no-require-imports */
  const mods = [
    require("highcharts/highcharts-more"),
    require("highcharts/modules/solid-gauge"),
    require("highcharts/modules/heatmap"),
    require("highcharts/modules/treemap"),
  ];
  mods.forEach((m) => {
    const init = typeof m === "function" ? m : m?.default;
    if (typeof init === "function") init(Highcharts);
  });
}

function getChartTheme(system: string, T: any, font: string): Partial<Highcharts.Options> {
  if (system === "salt") {
    return {
      colors: [T.accent, T.info, T.positive, T.caution, T.negative, "#8B5CF6", "#EC4899", "#F59E0B"],
      chart: { backgroundColor: "transparent", style: { fontFamily: font } },
      title: { style: { color: T.fg, fontSize: "16px", fontWeight: "600" } },
      subtitle: { style: { color: T.fg2 } },
      xAxis: { gridLineColor: T.bg3, lineColor: T.border, tickColor: T.border, labels: { style: { color: T.fg3, fontSize: "11px" } }, title: { style: { color: T.fg2 } } },
      yAxis: { gridLineColor: T.bg3, lineColor: T.border, tickColor: T.border, labels: { style: { color: T.fg3, fontSize: "11px" } }, title: { style: { color: T.fg2 } } },
      tooltip: { backgroundColor: T.bg, borderColor: T.border, style: { color: T.fg, fontSize: "12px" } },
      legend: { itemStyle: { color: T.fg2, fontSize: "11px" }, itemHoverStyle: { color: T.fg } },
      plotOptions: { series: { borderWidth: 0 } },
    };
  }
  if (system === "m3") {
    return {
      colors: [T.primary, T.secondary, T.tertiary, T.error, "#4CAF50", "#FF9800", "#2196F3", "#E91E63"],
      chart: { backgroundColor: "transparent", style: { fontFamily: font } },
      title: { style: { color: T.onSurface, fontSize: "16px", fontWeight: "500" } },
      subtitle: { style: { color: T.onSurfaceVariant } },
      xAxis: { gridLineColor: T.outlineVariant, lineColor: T.outline, labels: { style: { color: T.onSurfaceVariant, fontSize: "12px" } } },
      yAxis: { gridLineColor: T.outlineVariant, lineColor: T.outline, labels: { style: { color: T.onSurfaceVariant, fontSize: "12px" } } },
      tooltip: { backgroundColor: T.inverseSurface, borderColor: "transparent", style: { color: T.inverseOnSurface, fontSize: "14px" }, borderRadius: 4 },
      legend: { itemStyle: { color: T.onSurfaceVariant }, itemHoverStyle: { color: T.onSurface } },
    };
  }
  // Fluent
  return {
    colors: [T.brandBg, T.dangerBg3, T.successBg3, T.warningBg3, "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"],
    chart: { backgroundColor: "transparent", style: { fontFamily: font } },
    title: { style: { color: T.fg1, fontSize: "14px", fontWeight: "600" } },
    subtitle: { style: { color: T.fg2 } },
    xAxis: { gridLineColor: T.stroke3, lineColor: T.stroke1, labels: { style: { color: T.fg3, fontSize: "12px" } } },
    yAxis: { gridLineColor: T.stroke3, lineColor: T.stroke1, labels: { style: { color: T.fg3, fontSize: "12px" } } },
    tooltip: { backgroundColor: T.bgInverted, borderColor: "transparent", style: { color: T.fgInverted, fontSize: "12px" }, borderRadius: 4 },
    legend: { itemStyle: { color: T.fg2 }, itemHoverStyle: { color: T.fg1 } },
  };
}

interface ChartDef {
  id: string;
  name: string;
  category: string;
  getOptions: (theme: Partial<Highcharts.Options>) => Highcharts.Options;
}

const CHARTS: ChartDef[] = [
  {
    id: "line", name: "Line Chart", category: "Core",
    getOptions: (t) => ({
      ...t, chart: { ...(t.chart as any), type: "line" },
      title: { ...(t.title as any), text: "Monthly Revenue" },
      xAxis: { ...(t.xAxis as any), categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] },
      yAxis: { ...(t.yAxis as any), title: { text: "Revenue ($K)" } },
      series: [
        { name: "2024", data: [120, 134, 145, 152, 168, 185], type: "line" as const },
        { name: "2025", data: [140, 155, 162, 178, 195, 210], type: "line" as const },
      ],
      credits: { enabled: false },
    }),
  },
  {
    id: "area", name: "Area Chart", category: "Core",
    getOptions: (t) => ({
      ...t, chart: { ...(t.chart as any), type: "area" },
      title: { ...(t.title as any), text: "User Growth" },
      xAxis: { ...(t.xAxis as any), categories: ["Q1", "Q2", "Q3", "Q4"] },
      series: [
        { name: "Free", data: [5000, 8200, 12400, 18000], type: "area" as const },
        { name: "Pro", data: [1200, 2400, 4100, 6800], type: "area" as const },
      ],
      plotOptions: { area: { fillOpacity: 0.3 } },
      credits: { enabled: false },
    }),
  },
  {
    id: "column", name: "Column Chart", category: "Core",
    getOptions: (t) => ({
      ...t, chart: { ...(t.chart as any), type: "column" },
      title: { ...(t.title as any), text: "Sales by Region" },
      xAxis: { ...(t.xAxis as any), categories: ["NA", "EMEA", "APAC", "LATAM"] },
      series: [
        { name: "Q3", data: [420, 380, 290, 180], type: "column" as const },
        { name: "Q4", data: [480, 410, 340, 210], type: "column" as const },
      ],
      credits: { enabled: false },
    }),
  },
  {
    id: "pie", name: "Pie Chart", category: "Core",
    getOptions: (t) => ({
      ...t, chart: { ...(t.chart as any), type: "pie" },
      title: { ...(t.title as any), text: "Market Share" },
      series: [{ name: "Share", type: "pie" as const, data: [
        { name: "Product A", y: 45 }, { name: "Product B", y: 26 },
        { name: "Product C", y: 17 }, { name: "Other", y: 12 },
      ]}],
      plotOptions: { pie: { allowPointSelect: true, dataLabels: { enabled: true, format: "{point.name}: {point.percentage:.0f}%", style: { fontSize: "11px" } } } },
      credits: { enabled: false },
    }),
  },
  {
    id: "scatter", name: "Scatter Plot", category: "Core",
    getOptions: (t) => ({
      ...t, chart: { ...(t.chart as any), type: "scatter" },
      title: { ...(t.title as any), text: "Risk vs Return" },
      xAxis: { ...(t.xAxis as any), title: { text: "Risk (%)" } },
      yAxis: { ...(t.yAxis as any), title: { text: "Return (%)" } },
      series: [
        { name: "Equities", type: "scatter" as const, data: [[8,12],[10,15],[12,11],[15,18],[6,8],[9,14]] },
        { name: "Bonds", type: "scatter" as const, data: [[2,3],[3,4],[4,5],[3,3.5],[2.5,4.2]] },
      ],
      credits: { enabled: false },
    }),
  },
  {
    id: "bar", name: "Bar Chart", category: "Core",
    getOptions: (t) => ({
      ...t, chart: { ...(t.chart as any), type: "bar" },
      title: { ...(t.title as any), text: "Top Performers" },
      xAxis: { ...(t.xAxis as any), categories: ["Alice", "Bob", "Carol", "Dan", "Eve"] },
      series: [{ name: "Score", data: [95, 88, 82, 76, 71], type: "bar" as const }],
      credits: { enabled: false },
    }),
  },
  {
    id: "donut", name: "Donut Chart", category: "Core",
    getOptions: (t) => ({
      ...t, chart: { ...(t.chart as any), type: "pie" },
      title: { ...(t.title as any), text: "Portfolio Allocation" },
      series: [{ name: "Allocation", type: "pie" as const, innerSize: "60%",
        data: [{ name: "Equities", y: 55 }, { name: "Bonds", y: 25 }, { name: "Alternatives", y: 12 }, { name: "Cash", y: 8 }],
      }],
      credits: { enabled: false },
    }),
  },
  {
    id: "gauge", name: "Gauge", category: "Advanced",
    getOptions: (t) => ({
      ...t,
      chart: { ...(t.chart as any), type: "solidgauge", height: 280 },
      title: { ...(t.title as any), text: "System Health" },
      pane: { center: ["50%", "70%"], size: "100%", startAngle: -90, endAngle: 90,
        background: [{ backgroundColor: ((t.colors as string[])?.[0] || "#1B7F9E") + "20", innerRadius: "60%", outerRadius: "100%", shape: "arc" as const, borderWidth: 0 }] },
      yAxis: { min: 0, max: 100, lineWidth: 0, tickWidth: 0, minorTickInterval: null as any, labels: { enabled: false } },
      series: [{ name: "Health", data: [87], type: "solidgauge" as any,
        dataLabels: { format: '<span style="font-size:24px;font-weight:600">{y}%</span>', borderWidth: 0, y: -20 },
        innerRadius: "60%", radius: "100%" }],
      credits: { enabled: false },
    }),
  },
  {
    id: "heatmap", name: "Heatmap", category: "Advanced",
    getOptions: (t) => {
      const accentColor = (t.colors as string[])?.[0] || "#1B7F9E";
      return {
        ...t, chart: { ...(t.chart as any), type: "heatmap" },
        title: { ...(t.title as any), text: "Correlation Matrix" },
        xAxis: { ...(t.xAxis as any), categories: ["A", "B", "C", "D"] },
        yAxis: { ...(t.yAxis as any), categories: ["A", "B", "C", "D"], title: undefined, reversed: true },
        colorAxis: { min: -1, max: 1, stops: [[0, "#E52135"], [0.5, "#F5F7F8"], [1, accentColor]] },
        series: [{ name: "Correlation", type: "heatmap" as const, borderWidth: 1,
          data: [[0,0,1],[0,1,0.8],[0,2,0.3],[0,3,-0.2],[1,0,0.8],[1,1,1],[1,2,0.5],[1,3,0.1],[2,0,0.3],[2,1,0.5],[2,2,1],[2,3,0.7],[3,0,-0.2],[3,1,0.1],[3,2,0.7],[3,3,1]],
          dataLabels: { enabled: true, format: "{point.value:.1f}", style: { fontSize: "11px", textOutline: "none" } },
        }],
        credits: { enabled: false },
      };
    },
  },
  {
    id: "treemap", name: "Treemap", category: "Advanced",
    getOptions: (t) => ({
      ...t, chart: { ...(t.chart as any), type: "treemap" },
      title: { ...(t.title as any), text: "Portfolio Treemap" },
      series: [{ type: "treemap" as const, layoutAlgorithm: "squarified",
        data: [
          { name: "Tech", value: 35, colorValue: 1 }, { name: "Healthcare", value: 20, colorValue: 2 },
          { name: "Finance", value: 18, colorValue: 3 }, { name: "Energy", value: 12, colorValue: 4 },
          { name: "Consumer", value: 10, colorValue: 5 }, { name: "Industrial", value: 5, colorValue: 6 },
        ],
      }],
      credits: { enabled: false },
    }),
  },
  {
    id: "spline", name: "Spline Chart", category: "Core",
    getOptions: (t) => ({
      ...t, chart: { ...(t.chart as any), type: "spline" },
      title: { ...(t.title as any), text: "Temperature Trend" },
      xAxis: { ...(t.xAxis as any), categories: ["6am", "9am", "12pm", "3pm", "6pm", "9pm"] },
      series: [
        { name: "Today", data: [14, 18, 24, 27, 22, 16], type: "spline" as const },
        { name: "Yesterday", data: [12, 16, 22, 25, 20, 14], type: "spline" as const },
      ],
      credits: { enabled: false },
    }),
  },
  {
    id: "stacked-column", name: "Stacked Column", category: "Core",
    getOptions: (t) => ({
      ...t, chart: { ...(t.chart as any), type: "column" },
      title: { ...(t.title as any), text: "Revenue Breakdown" },
      xAxis: { ...(t.xAxis as any), categories: ["Q1", "Q2", "Q3", "Q4"] },
      plotOptions: { column: { stacking: "normal" } },
      series: [
        { name: "Services", data: [120, 135, 148, 162], type: "column" as const },
        { name: "Products", data: [80, 95, 110, 125], type: "column" as const },
        { name: "Licensing", data: [40, 45, 52, 58], type: "column" as const },
      ],
      credits: { enabled: false },
    }),
  },
];

function ChartCard({ chart, theme, bg, border }: { chart: ChartDef; theme: Partial<Highcharts.Options>; bg: string; border: string }) {
  const options = useMemo(() => chart.getOptions(theme), [chart, theme]);
  return (
    <div style={{ background: bg, borderRadius: 8, border: `1px solid ${border}`, overflow: "hidden" }}>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}

export function ChartsPage() {
  ensureModules();
  const store = useDesignHub();
  const { activeSystem } = store;
  const sysInfo = getSystemInfo(activeSystem);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const T = activeSystem === "salt"
    ? getTheme("salt", store.salt.themeKey)
    : activeSystem === "m3"
    ? getTheme("m3", store.m3.themeKey, store.m3.customColor, store.m3.isDarkCustom)
    : getTheme("fluent", store.fluent.themeKey);

  activateTheme(activeSystem, T);
  const font = getFont(activeSystem);
  const chartTheme = useMemo(() => getChartTheme(activeSystem, T, font), [activeSystem, T, font]);

  const bg = activeSystem === "salt" ? T.bg : activeSystem === "m3" ? T.surfaceContainerLow : T.bg2;
  const fg = activeSystem === "salt" ? T.fg : activeSystem === "m3" ? T.onSurface : T.fg1;
  const fg3 = activeSystem === "salt" ? T.fg3 : activeSystem === "m3" ? T.onSurfaceVariant : T.fg3;
  const border = activeSystem === "salt" ? T.border : activeSystem === "m3" ? T.outlineVariant : T.stroke2;
  const accent = activeSystem === "salt" ? T.accent : activeSystem === "m3" ? T.primary : T.brandBg;
  const accentFg = activeSystem === "salt" ? T.accentFg : activeSystem === "m3" ? T.onPrimary : T.fgOnBrand;

  // Use the DS's chip/filter classes
  const chipClass = activeSystem === "salt" ? "s-btn" : activeSystem === "m3" ? "m3-chip" : "f-btn";

  const categories = [...new Set(CHARTS.map(c => c.category))];
  const filtered = selectedCategory ? CHARTS.filter(c => c.category === selectedCategory) : CHARTS;

  return (
    <div style={{ padding: 24, fontFamily: font }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: fg, marginBottom: 4 }}>Charts & Data Visualization</h2>
      <p style={{ fontSize: 13, color: fg3, marginBottom: 16 }}>
        Highcharts themed with {sysInfo.name} tokens. Charts auto-adapt to theme, mode, and density.
      </p>

      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {[null, ...categories].map(cat => {
          const isActive = selectedCategory === cat;
          if (activeSystem === "m3") {
            return (
              <button key={cat || "all"} className={`m3-chip ${isActive ? "selected" : ""}`}
                onClick={() => setSelectedCategory(cat)} style={{ fontSize: 12 }}>
                {cat || "All"}
              </button>
            );
          }
          const cls = activeSystem === "salt"
            ? `s-btn ${isActive ? "s-btn-solid" : "s-btn-bordered"}`
            : `f-btn ${isActive ? "f-btn-primary" : "f-btn-outline"}`;
          return (
            <button key={cat || "all"} className={cls} onClick={() => setSelectedCategory(cat)}
              style={{ fontSize: 12, minWidth: "auto", padding: "0 12px", height: 28 }}>
              {cat || "All"}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 16 }}>
        {filtered.map(chart => (
          <ChartCard key={chart.id} chart={chart} theme={chartTheme} bg={bg} border={border} />
        ))}
      </div>
    </div>
  );
}
