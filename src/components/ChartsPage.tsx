"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { getTheme, getFont, getSystemInfo } from "@/data/registry";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

function getChartTheme(system: string, T: any, font: string): Partial<Highcharts.Options> {
  if (system === "salt") {
    return {
      colors: [T.accent, T.info, T.positive, T.caution, T.negative, "#8B5CF6", "#EC4899", "#F59E0B"],
      chart: { backgroundColor: T.bg, style: { fontFamily: font } },
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
      chart: { backgroundColor: T.surface, style: { fontFamily: font }, borderRadius: 12 },
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
    chart: { backgroundColor: T.bg1, style: { fontFamily: font }, borderRadius: 8 },
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
      ...t, chart: { ...t.chart, type: "line" },
      title: { ...t.title, text: "Monthly Revenue" },
      xAxis: { ...t.xAxis as any, categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] },
      yAxis: { ...t.yAxis as any, title: { ...((t.yAxis as any)?.title || {}), text: "Revenue ($K)" } },
      series: [
        { name: "2024", data: [120, 134, 145, 152, 168, 185], type: "line" },
        { name: "2025", data: [140, 155, 162, 178, 195, 210], type: "line" },
      ],
      credits: { enabled: false },
    }),
  },
  {
    id: "area", name: "Area Chart", category: "Core",
    getOptions: (t) => ({
      ...t, chart: { ...t.chart, type: "area" },
      title: { ...t.title, text: "User Growth" },
      xAxis: { ...t.xAxis as any, categories: ["Q1", "Q2", "Q3", "Q4"] },
      series: [
        { name: "Free", data: [5000, 8200, 12400, 18000], type: "area" },
        { name: "Pro", data: [1200, 2400, 4100, 6800], type: "area" },
      ],
      plotOptions: { area: { fillOpacity: 0.3 } },
      credits: { enabled: false },
    }),
  },
  {
    id: "column", name: "Column Chart", category: "Core",
    getOptions: (t) => ({
      ...t, chart: { ...t.chart, type: "column" },
      title: { ...t.title, text: "Sales by Region" },
      xAxis: { ...t.xAxis as any, categories: ["NA", "EMEA", "APAC", "LATAM"] },
      series: [
        { name: "Q3", data: [420, 380, 290, 180], type: "column" },
        { name: "Q4", data: [480, 410, 340, 210], type: "column" },
      ],
      credits: { enabled: false },
    }),
  },
  {
    id: "pie", name: "Pie Chart", category: "Core",
    getOptions: (t) => ({
      ...t, chart: { ...t.chart, type: "pie" },
      title: { ...t.title, text: "Market Share" },
      series: [{
        name: "Share", type: "pie",
        data: [
          { name: "Product A", y: 45 }, { name: "Product B", y: 26 },
          { name: "Product C", y: 17 }, { name: "Other", y: 12 },
        ],
      }],
      plotOptions: { pie: { allowPointSelect: true, dataLabels: { enabled: true, format: "{point.name}: {point.percentage:.0f}%", style: { fontSize: "11px" } } } },
      credits: { enabled: false },
    }),
  },
  {
    id: "scatter", name: "Scatter Plot", category: "Core",
    getOptions: (t) => ({
      ...t, chart: { ...t.chart, type: "scatter" },
      title: { ...t.title, text: "Risk vs Return" },
      xAxis: { ...t.xAxis as any, title: { text: "Risk (%)" } },
      yAxis: { ...t.yAxis as any, title: { text: "Return (%)" } },
      series: [
        { name: "Equities", type: "scatter", data: [[8, 12], [10, 15], [12, 11], [15, 18], [6, 8], [9, 14]] },
        { name: "Bonds", type: "scatter", data: [[2, 3], [3, 4], [4, 5], [3, 3.5], [2.5, 4.2]] },
      ],
      credits: { enabled: false },
    }),
  },
  {
    id: "bar", name: "Bar Chart", category: "Core",
    getOptions: (t) => ({
      ...t, chart: { ...t.chart, type: "bar" },
      title: { ...t.title, text: "Top Performers" },
      xAxis: { ...t.xAxis as any, categories: ["Alice", "Bob", "Carol", "Dan", "Eve"] },
      series: [{ name: "Score", data: [95, 88, 82, 76, 71], type: "bar" }],
      credits: { enabled: false },
    }),
  },
  {
    id: "donut", name: "Donut Chart", category: "Core",
    getOptions: (t) => ({
      ...t, chart: { ...t.chart, type: "pie" },
      title: { ...t.title, text: "Portfolio Allocation" },
      series: [{
        name: "Allocation", type: "pie", innerSize: "60%",
        data: [
          { name: "Equities", y: 55 }, { name: "Bonds", y: 25 },
          { name: "Alternatives", y: 12 }, { name: "Cash", y: 8 },
        ],
      }],
      credits: { enabled: false },
    }),
  },
  {
    id: "gauge", name: "Gauge", category: "Advanced",
    getOptions: (t) => ({
      ...t,
      chart: { ...t.chart, type: "solidgauge", height: 280 },
      title: { ...t.title, text: "System Health" },
      pane: { center: ["50%", "70%"], size: "100%", startAngle: -90, endAngle: 90, background: [{ backgroundColor: (t.colors as string[])?.[0] + "20", innerRadius: "60%", outerRadius: "100%", shape: "arc", borderWidth: 0 }] },
      yAxis: { min: 0, max: 100, lineWidth: 0, tickWidth: 0, minorTickInterval: null as any, labels: { enabled: false } },
      series: [{ name: "Health", data: [87], type: "solidgauge" as any, dataLabels: { format: "<span style='font-size:24px;font-weight:600'>{y}%</span>", borderWidth: 0, y: -20 }, innerRadius: "60%", radius: "100%" }],
      credits: { enabled: false },
    }),
  },
  {
    id: "heatmap", name: "Heatmap", category: "Advanced",
    getOptions: (t) => {
      const colors = t.colors as string[] || ["#1B7F9E"];
      return {
        ...t,
        chart: { ...t.chart, type: "heatmap" },
        title: { ...t.title, text: "Correlation Matrix" },
        xAxis: { ...t.xAxis as any, categories: ["A", "B", "C", "D"] },
        yAxis: { ...t.yAxis as any, categories: ["A", "B", "C", "D"], title: undefined },
        colorAxis: { min: -1, max: 1, stops: [[0, "#E52135"], [0.5, "#F5F7F8"], [1, colors[0]]] },
        series: [{
          name: "Correlation", type: "heatmap",
          data: [[0,0,1],[0,1,0.8],[0,2,0.3],[0,3,-0.2],[1,0,0.8],[1,1,1],[1,2,0.5],[1,3,0.1],[2,0,0.3],[2,1,0.5],[2,2,1],[2,3,0.7],[3,0,-0.2],[3,1,0.1],[3,2,0.7],[3,3,1]],
          dataLabels: { enabled: true, format: "{point.value:.1f}", style: { fontSize: "11px" } },
        }],
        credits: { enabled: false },
      };
    },
  },
  {
    id: "treemap", name: "Treemap", category: "Advanced",
    getOptions: (t) => ({
      ...t,
      chart: { ...t.chart, type: "treemap" },
      title: { ...t.title, text: "Portfolio Treemap" },
      series: [{
        type: "treemap", layoutAlgorithm: "squarified",
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
    id: "candlestick", name: "Candlestick", category: "Financial",
    getOptions: (t) => {
      const colors = t.colors as string[] || ["#1B7F9E"];
      return {
        ...t,
        chart: { ...t.chart, type: "candlestick" },
        title: { ...t.title, text: "AAPL Stock Price" },
        xAxis: { ...t.xAxis as any, categories: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
        yAxis: { ...t.yAxis as any, title: { text: "Price ($)" } },
        series: [{
          type: "candlestick", name: "AAPL",
          data: [[175, 182, 173, 180], [180, 185, 178, 184], [184, 186, 181, 183], [183, 188, 182, 187], [187, 190, 185, 189]],
          color: "#E52135", upColor: colors[0] || "#00875D",
        }],
        credits: { enabled: false },
      };
    },
  },
];

function ChartCard({ chart, theme }: { chart: ChartDef; theme: Partial<Highcharts.Options> }) {
  const options = useMemo(() => chart.getOptions(theme), [chart, theme]);
  return (
    <div style={{ background: "#16213e", borderRadius: 8, border: "1px solid #2a2a4a", padding: 16 }}>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}

export function ChartsPage() {
  const store = useDesignHub();
  const { activeSystem } = store;
  const sysInfo = getSystemInfo(activeSystem);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const T = activeSystem === "salt"
    ? getTheme("salt", store.salt.themeKey)
    : activeSystem === "m3"
    ? getTheme("m3", store.m3.themeKey, store.m3.customColor, store.m3.isDarkCustom)
    : getTheme("fluent", store.fluent.themeKey);

  const font = getFont(activeSystem);
  const chartTheme = useMemo(() => getChartTheme(activeSystem, T, font), [activeSystem, T, font]);

  const categories = [...new Set(CHARTS.map((c) => c.category))];
  const filtered = selectedCategory ? CHARTS.filter((c) => c.category === selectedCategory) : CHARTS;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Charts & Data Visualization</h2>
      <p style={{ fontSize: 13, color: "#707080", marginBottom: 16 }}>
        Highcharts themed with {sysInfo.name} tokens. Charts auto-adapt to theme, mode, and density.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setSelectedCategory(null)}
          style={{
            padding: "4px 12px", fontSize: 12, borderRadius: 16,
            background: !selectedCategory ? sysInfo.color : "transparent",
            color: !selectedCategory ? "#fff" : "#a0a0b0",
            border: `1px solid ${!selectedCategory ? sysInfo.color : "#2a2a4a"}`,
            cursor: "pointer", fontFamily: "inherit", fontWeight: 500,
          }}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: "4px 12px", fontSize: 12, borderRadius: 16,
              background: selectedCategory === cat ? sysInfo.color : "transparent",
              color: selectedCategory === cat ? "#fff" : "#a0a0b0",
              border: `1px solid ${selectedCategory === cat ? sysInfo.color : "#2a2a4a"}`,
              cursor: "pointer", fontFamily: "inherit", fontWeight: 500,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 16 }}>
        {filtered.map((chart) => (
          <ChartCard key={chart.id} chart={chart} theme={chartTheme} />
        ))}
      </div>
    </div>
  );
}
