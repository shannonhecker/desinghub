import { describe, it, expect } from "vitest";
import { applyPanelConfig, defaultAggregation, readPanelConfig, weightField, type PanelConfig } from "../panelConfig";
import { resolveBinding, type DataBinding } from "../binding";
import { financeDataset } from "../financeDataset";
import { riskAnalytics, performanceAnalytics } from "../../financeTemplates";
import { fieldOf, tableOf } from "../types";
import { GROUP_FIELD } from "../shape";
import { viewByStateKey } from "../../panelMetrics";

const ds = financeDataset();
const holdings = tableOf(ds, "holdings")!;
const block = (id: string) => [...riskAnalytics.body, ...performanceAnalytics.body].find((b) => b.id === id)!;

describe("readPanelConfig", () => {
  it("reads a chart panel: kind, rows, pivot, values, share, limit", () => {
    expect(readPanelConfig(block("tpl-risk-market-value"), holdings, {})).toEqual({
      view: "chart", chartType: "stacked-bar", rows: "currency", columns: "assetClass",
      values: [{ field: "marketValue", agg: "sum" }], share: "total", limit: 10,
    });
  });

  it("follows the panel's current View by", () => {
    const c = readPanelConfig(block("tpl-risk-market-value"), holdings, { [viewByStateKey("tpl-risk-market-value")]: "Region" });
    expect(c.rows).toBe("region");
  });

  it("reads a grid panel and lists only real table fields as values", () => {
    const c = readPanelConfig(block("tpl-risk-summary"), holdings, {});
    expect(c.view).toBe("grid");
    expect(c.rows).toBe("fund");
    expect(c.values.map((v) => v.field)).toEqual(["marketValue", "var95", "ivar95", "mvar95", "cvar95"]);
  });
});

describe("defaults", () => {
  it("money adds up; percentages are weighted by the table's money measure", () => {
    expect(weightField(holdings)).toBe("marketValue");
    expect(defaultAggregation(fieldOf(holdings, "marketValue")!, holdings)).toBe("sum");
    expect(defaultAggregation(fieldOf(holdings, "port1m")!, holdings)).toBe("wavg");
  });
});

describe("applyPanelConfig - the pivot tool", () => {
  const base: PanelConfig = { view: "grid", chartType: "column", rows: "region", columns: "assetClass", values: [{ field: "marketValue", agg: "sum" }], share: "none", limit: null };
  const resolve = (b: { props: Record<string, unknown> }, state = {}) => resolveBinding(b.props.binding as DataBinding, ds, state)!;

  it("turns a chart into a pivot grid: rows by region, a column group per asset class, a total", () => {
    const next = applyPanelConfig(block("tpl-risk-market-value"), base, holdings);
    expect(next.type).toBe("DataGrid");
    const d = resolve(next);
    if (d.view !== "grid") throw new Error();
    expect(d.rows[0][GROUP_FIELD]).toBe("Total");
    expect(d.rows.map((r) => r[GROUP_FIELD])).toContain("Europe");
    expect(d.columns.map((c) => c.header)).toContain("Equity");
    expect(next.props.viewBy).toBeUndefined();
    expect(next.props.title).toBe("Market value");
    expect(next.props.height).toBe(380);
  });

  it("keeps following the master grid's selection", () => {
    const next = applyPanelConfig(block("tpl-risk-market-value"), base, holdings);
    const all = resolve(next);
    const scoped = resolve(next, { "select:risk": "Sterling Corporate Bond" });
    expect(JSON.stringify(scoped)).not.toBe(JSON.stringify(all));
  });

  it("turns a grid into a chart of another kind, with several values", () => {
    const next = applyPanelConfig(block("tpl-risk-summary"), { ...base, view: "chart", chartType: "column", rows: "fund", columns: null, values: [{ field: "var95", agg: "sum" }, { field: "cvar95", agg: "sum" }] }, holdings);
    expect(next.type).toBe("HighchartColumn");
    expect(next.props.chartType).toBe("column");
    const d = resolve(next);
    expect(d.view === "series" && d.series.map((s) => s.name)).toEqual(["VaR 95% (20D)", "CVaR 95% (20D)"]);
  });

  it("weighted averages use the table's money measure; shares become percentages capped at 100", () => {
    const avg = applyPanelConfig(block("tpl-risk-summary"), { ...base, view: "chart", chartType: "column", rows: "fund", columns: null, values: [{ field: "port1m", agg: "wavg" }] }, holdings);
    expect((avg.props.binding as DataBinding).measures[0]).toEqual({ field: "port1m", agg: "wavg", weight: "marketValue" });
    expect(avg.props.yAxisFormat).toBe("{value}%");
    const share = applyPanelConfig(block("tpl-risk-summary"), { ...base, view: "chart", chartType: "stacked-column", rows: "region", columns: "assetClass", share: "group" }, holdings);
    expect(share.props).toMatchObject({ yAxisFormat: "{value}%", yAxisMax: 100 });
  });

  it("a donut takes one value and no pivot, and shows the total in the middle", () => {
    const next = applyPanelConfig(block("tpl-risk-market-value"), { ...base, view: "chart", chartType: "donut", rows: "sector", columns: "assetClass", values: [{ field: "marketValue", agg: "sum" }, { field: "var95", agg: "sum" }] }, holdings);
    expect(next.type).toBe("HighchartDonut");
    const b = next.props.binding as DataBinding;
    expect(b.view).toBe("parts");
    expect(b.pivotBy).toBeUndefined();
    expect(b.measures).toHaveLength(1);
    expect(b.centerMeasure).toBe("marketValue");
    const d = resolve(next);
    expect(d.view === "parts" && d.seriesData.length).toBeGreaterThan(3);
  });

  it("top N sorts by the first value", () => {
    const next = applyPanelConfig(block("tpl-risk-issuers"), { ...base, view: "chart", chartType: "bar", rows: "issuer", columns: null, limit: 5 }, holdings);
    const d = resolve(next);
    if (d.view !== "series") throw new Error();
    expect(d.categories).toHaveLength(5);
    const values = d.series[0].data as number[];
    expect([...values].sort((a, b) => b - a)).toEqual(values);
  });

  it("ignores a pivot equal to the rows, and unknown fields", () => {
    const next = applyPanelConfig(block("tpl-risk-market-value"), { ...base, rows: "region", columns: "region", values: [{ field: "marketValue", agg: "sum" }, { field: "nope", agg: "sum" }] }, holdings);
    const b = next.props.binding as DataBinding;
    expect(b.pivotBy).toBeUndefined();
    expect(b.measures.map((m) => m.field)).toEqual(["marketValue"]);
  });

  it("round-trips: reading back an applied configuration gives the same configuration", () => {
    const config: PanelConfig = { view: "chart", chartType: "stacked-bar", rows: "sector", columns: "region", values: [{ field: "marketValue", agg: "sum" }], share: "total", limit: 8 };
    const next = applyPanelConfig(block("tpl-risk-market-value"), config, holdings);
    expect(readPanelConfig(next, holdings, {})).toEqual(config);
  });
});
