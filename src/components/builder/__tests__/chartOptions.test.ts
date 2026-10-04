import { describe, it, expect } from "vitest";
import { buildChartOptions, resolvePointColor, type ThemeVars } from "../SimulatedHighchart";

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

/* eslint-disable @typescript-eslint/no-explicit-any */
describe("slice 2 chart kinds and options", () => {
  it("waterfall: steps in order, a sum bar, no legend", () => {
    const o = buildChartOptions("waterfall", theme as any, vars, {
      seriesData: [{ name: "Universe", y: 1500 }, { name: "House", y: -500 }, { name: "Target", y: 0, isSum: true } as any],
    }) as any;
    expect(o.chart.type).toBe("waterfall");
    expect(o.xAxis.categories).toEqual(["Universe", "House", "Target"]);
    /* Every step carries its own colour, selected or not. */
    expect(o.series[0].data.map((d: any) => ({ name: d.name, y: d.y, isSum: d.isSum }))).toEqual([
      { name: "Universe", y: 1500, isSum: undefined },
      { name: "House", y: -500, isSum: undefined },
      { name: "Target", y: undefined, isSum: true },
    ]);
    expect(o.series[0].data.every((d: any) => typeof d.color === "string" && d.color)).toBe(true);
    expect(o.legend.enabled).toBe(false);
  });

  it("gauge: a percentage dial by default, a score dial with valueMax and decimals", () => {
    const pct = buildChartOptions("gauge", theme as any, vars, { value: 87 }) as any;
    expect(pct.yAxis.max).toBe(100);
    expect(pct.series[0].dataLabels.format).toContain("{y}%");
    const score = buildChartOptions("gauge", theme as any, vars, { value: 6.42, valueMax: 10, valueDecimals: 2 }) as any;
    expect(score.yAxis.max).toBe(10);
    expect(score.series[0].dataLabels.format).toContain("{y:.2f}<");
    expect(score.series[0].dataLabels.format).not.toContain("%");
  });

  it("pointColors: tone names follow the theme, anything else is used as given", () => {
    expect(resolvePointColor("good", vars)).toBe(vars.positive);
    expect(resolvePointColor("bad", vars)).toBe(vars.negative);
    expect(resolvePointColor("#123456", vars)).toBe("#123456");
    const o = buildChartOptions("column", theme as any, vars, {
      categories: ["CC", "BB", "AA"],
      series: [{ name: "Distribution", data: [10, 30, 60] }],
      pointColors: ["bad", "mid", "good"],
    }) as any;
    expect(o.series[0].data).toEqual([
      { y: 10, color: vars.negative },
      { y: 30, color: vars.warning },
      { y: 60, color: vars.positive },
    ]);
  });

  it("selected: the other points are dimmed, the selected one keeps its colour", () => {
    const o = buildChartOptions("column", theme as any, vars, {
      categories: ["A", "B"],
      series: [{ name: "S", data: [1, 2] }],
      pointColors: ["#ff0000", "#00ff00"],
      selected: "B",
    }) as any;
    expect(o.series[0].data[0].color).toMatch(/^rgba\(255,0,0,0\.28\)$/);
    expect(o.series[0].data[1].color).toBe("#00ff00");
  });

  it("onSelectPoint: points are clickable and report their name", () => {
    const picked: string[] = [];
    const o = buildChartOptions("waterfall", theme as any, vars, { onSelectPoint: (n) => picked.push(n) }) as any;
    expect(o.plotOptions.series.cursor).toBe("pointer");
    o.plotOptions.series.point.events.click.call({ name: "House" });
    o.plotOptions.series.point.events.click.call({ category: "Rates" });
    expect(picked).toEqual(["House", "Rates"]);
  });
});

describe("slice 3 chart kinds", () => {
  it("radar: a polar line chart on a polygon grid, lines closing on the spokes", () => {
    const o = buildChartOptions("radar", theme as any, vars, {
      categories: ["A", "B", "C"],
      series: [{ name: "Entity", data: [1, 2, 3] }, { name: "Peers", data: [2, 2, 2], dashStyle: "ShortDash" }],
    }) as any;
    expect(o.chart.polar).toBe(true);
    expect(o.yAxis.gridLineInterpolation).toBe("polygon");
    expect(o.xAxis.categories).toEqual(["A", "B", "C"]);
    expect(o.series.map((s: any) => [s.name, s.pointPlacement, s.dashStyle])).toEqual([["Entity", "on", undefined], ["Peers", "on", "ShortDash"]]);
  });

  it("corridor: a dashed ceiling, the band down to the path, and the path", () => {
    const o = buildChartOptions("corridor", theme as any, vars, {
      categories: ["2030", "2040", "2050"],
      series: [{ name: "Budget", data: [40, 20, 0] }, { name: "Projected", data: [30, 15, 0] }],
      bandName: "Undershoot",
    }) as any;
    expect(o.series.map((s: any) => [s.type, s.name])).toEqual([["line", "Budget"], ["arearange", "Undershoot"], ["area", "Projected"]]);
    expect(o.series[0].dashStyle).toBe("Dash");
    expect(o.series[1].data).toEqual([[30, 40], [15, 20], [0, 0]]);
  });

  it("yAxisCategories: positions on the value axis are shown as labels, in the tooltip too", () => {
    const o = buildChartOptions("line", theme as any, vars, {
      categories: ["Q1", "Q2"],
      series: [{ name: "Entity", data: [4, 5] }],
      yAxisCategories: ["CCC", "B", "BB", "BBB", "A", "AA", "AAA"],
    }) as any;
    expect(o.yAxis.categories).toHaveLength(7);
    expect(o.yAxis.max).toBe(6);
    const tip = o.tooltip.formatter.call({ x: "Q2", points: [{ y: 5, series: { name: "Entity" } }] });
    expect(tip).toContain("Entity: <b>AA</b>");
  });
});

