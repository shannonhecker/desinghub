import { describe, it, expect } from "vitest";
import { buildChartOptions, type ThemeVars } from "../SimulatedHighchart";

const vars: ThemeVars = {
  primary: "#1B7F9E", bg: "#fff", fg: "#111", fgSec: "#444", fgTer: "#777",
  surface: "#f5f5f5", border: "#ccc", positive: "#0a0", warning: "#fa0", negative: "#d00",
};
const theme = {
  chart: { backgroundColor: "transparent", height: 250 },
  title: { style: {} },
  xAxis: { labels: {}, title: {} },
  yAxis: { labels: {}, title: {} },
  tooltip: {},
  legend: {},
  plotOptions: { series: {} },
};
/* eslint-disable @typescript-eslint/no-explicit-any */
const build = (type: Parameters<typeof buildChartOptions>[0], props: Parameters<typeof buildChartOptions>[3]) =>
  buildChartOptions(type, theme as any, vars, props) as any;

describe("buildChartOptions - combination", () => {
  const series = [
    { name: "VaR (MC) - Active", data: [1, 2, 3], type: "column" as const, yAxis: 1 as const },
    { name: "Portfolio", data: [4, 5, 6], type: "line" as const },
    { name: "Benchmark", data: [3, 4, 5], type: "line" as const, dashStyle: "ShortDash" as const },
  ];
  const o = build("combination", { title: "Value at Risk", categories: ["Jan", "Feb", "Mar"], series, yAxisFormat: "{value}%", secondaryAxisFormat: "{value}m" });

  it("each series keeps its own mark, axis and dash", () => {
    expect(o.series.map((s: any) => s.type)).toEqual(["column", "line", "line"]);
    expect(o.series.map((s: any) => s.yAxis)).toEqual([1, 0, 0]);
    expect(o.series[2].dashStyle).toBe("ShortDash");
  });

  it("builds a left axis and an opposite right axis, each with its format", () => {
    expect(o.yAxis).toHaveLength(2);
    expect(o.yAxis[0].labels.format).toBe("{value}%");
    expect(o.yAxis[1].opposite).toBe(true);
    expect(o.yAxis[1].labels.format).toBe("{value}m");
  });

  it("uses one axis when no series asks for the right-hand one", () => {
    const single = build("combination", { series: [{ name: "A", data: [1], type: "column" }, { name: "B", data: [2], type: "line" }] });
    expect(Array.isArray(single.yAxis)).toBe(false);
    expect(single.series.every((s: any) => s.yAxis === 0)).toBe(true);
  });

  it("shares the tooltip and draws columns behind lines", () => {
    expect(o.tooltip.shared).toBe(true);
    expect(o.series[0].zIndex).toBeLessThan(o.series[1].zIndex);
  });
});

describe("buildChartOptions - stacked bar and stacked area", () => {
  it("stacked bar is a horizontal bar chart with normal stacking", () => {
    const o = build("stacked-bar", { categories: ["USD", "EUR"], series: [{ name: "Bonds", data: [1, 2] }, { name: "Equity", data: [3, 4] }] });
    expect(o.chart.type).toBe("bar");
    expect(o.plotOptions.bar.stacking).toBe("normal");
    expect(o.series.map((s: any) => s.type)).toEqual(["bar", "bar"]);
    expect(o.xAxis.categories).toEqual(["USD", "EUR"]);
  });

  it("stacked area is a stacked areaspline without point markers", () => {
    const o = build("stacked-area", { series: [{ name: "Bonds", data: [1, 2] }] });
    expect(o.chart.type).toBe("areaspline");
    expect(o.plotOptions.areaspline.stacking).toBe("normal");
    expect(o.plotOptions.areaspline.marker.enabled).toBe(false);
  });
});

describe("buildChartOptions - settings every type shares", () => {
  it("height overrides the default", () => {
    expect(build("column", { height: 288 }).chart.height).toBe(288);
    expect(build("column", {}).chart.height).toBe(250);
  });

  it("hideTitle drops the in-chart title and the default axis title", () => {
    const o = build("column", { title: "Contribution by Risk type", hideTitle: true });
    expect(o.title.text).toBeUndefined();
    expect(o.yAxis.title.text).toBeUndefined();
    /* The title still describes the chart to assistive tech. */
    expect(o.accessibility.description).toBe("Contribution by Risk type");
  });

  it("applies the value-axis format and title", () => {
    const o = build("stacked-bar", { yAxisFormat: "{value}%", yAxisTitle: "Share" });
    expect(o.yAxis.labels.format).toBe("{value}%");
    expect(o.yAxis.title.text).toBe("Share");
  });

  it("legend: false hides the legend", () => {
    expect(build("column", { legend: false }).legend.enabled).toBe(false);
    expect(build("column", {}).legend.enabled).toBeUndefined();
  });

  it("a donut with a centre label installs a render handler; other types do not", () => {
    const donut = build("donut", { centerLabel: "£1.2bn" });
    expect(typeof donut.chart.events.render).toBe("function");
    /* Text and colour travel in the options, so a theme change repaints it. */
    expect(donut.chart.dhCenter).toEqual({ text: "£1.2bn", color: vars.fg });
    expect(build("pie", { centerLabel: "£1.2bn" }).chart.events).toBeUndefined();
    expect(build("donut", {}).chart.events).toBeUndefined();
  });
});
