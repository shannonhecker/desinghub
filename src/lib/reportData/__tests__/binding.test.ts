import { describe, it, expect } from "vitest";
import { resolveBinding, dyn, currencyRate, type DataBinding } from "../binding";
import { GROUP_FIELD } from "../shape";
import { isColumnGroup } from "../../dataGridModel";
import type { ReportDataset } from "../types";

const dataset: ReportDataset = {
  id: "t", label: "T", baseCurrency: "GBP",
  tables: [
    {
      id: "holdings", label: "Holdings", grain: "",
      fields: [
        { key: "fund", label: "Fund", role: "dimension" },
        { key: "assetClass", label: "Asset class", role: "dimension" },
        { key: "mv", label: "Market value", role: "measure", format: "currency" },
      ],
      rows: [
        { fund: "Growth", assetClass: "Equity", mv: 600, var: 30, port1m: 4, bmk1m: 3, port3m: 6, bmk3m: 5 },
        { fund: "Growth", assetClass: "Bonds", mv: 400, var: 10, port1m: 2, bmk1m: 2.5, port3m: 3, bmk3m: 3 },
        { fund: "Income", assetClass: "Bonds", mv: 1000, var: 20, port1m: 1, bmk1m: 1.2, port3m: 2, bmk3m: 2.5 },
      ],
    },
    { id: "fx", label: "FX", grain: "", fields: [], rows: [{ currency: "GBP", rate: 1 }, { currency: "USD", rate: 1.25 }] },
  ],
};

const wavg = (field: string) => ({ field, agg: "wavg" as const, weight: "mv" });

describe("dyn", () => {
  it("follows report state through its options, else the fallback", () => {
    const viewBy = { state: "viewBy:g", options: { Fund: "fund", "Asset class": "assetClass" }, fallback: "fund" };
    expect(dyn(viewBy, {})).toBe("fund");
    expect(dyn(viewBy, { "viewBy:g": "Asset class" })).toBe("assetClass");
    expect(dyn(viewBy, { "viewBy:g": "Nonsense" })).toBe("fund");
    expect(dyn("fund", { any: "thing" })).toBe("fund");
  });
});

describe("resolveBinding - grid", () => {
  const summary: DataBinding = {
    table: "holdings",
    view: "grid",
    groupBy: { state: "viewBy:summary", options: { Fund: "fund", "Asset class": "assetClass" }, fallback: "fund" },
    groupHeader: { state: "viewBy:summary", options: { Fund: "Fund", "Asset class": "Asset class" }, fallback: "Fund" },
    measures: [{ field: "mv" }, { field: "var" }],
    computed: [
      { as: "mvPct", op: "shareOfTotal", of: ["mv"] },
      { as: "varPct", op: "percentOf", of: ["var", "mv"] },
    ],
    display: [
      { key: "mv", label: "PV", kind: "currency", money: true },
      { key: "mvPct", label: "(%)", kind: "percent" },
      { key: "var", label: "Value", kind: "currency", money: true },
      { key: "varPct", label: "(%)", kind: "percent" },
    ],
    columnGroups: [{ header: "VaR 95%", keys: ["var", "varPct"] }],
    total: "Aggregate",
    selectState: "select:fund",
  };

  it("derives rows, a bold total, percent-of-total and ratio columns", () => {
    const d = resolveBinding(summary, dataset, {});
    if (d?.view !== "grid") throw new Error("expected a grid");
    expect(d.rows[0]).toMatchObject({ [GROUP_FIELD]: "Aggregate", _bold: true, mv: 2000, mvPct: 100, var: 60, varPct: 3 });
    expect(d.rows[1]).toMatchObject({ [GROUP_FIELD]: "Growth", mv: 1000, mvPct: 50, var: 40, varPct: 4 });
    expect(d.columns[0]).toMatchObject({ field: GROUP_FIELD, header: "Fund" });
    const group = d.columns[3];
    expect(isColumnGroup(group) && group.header).toBe("VaR 95%");
    expect(isColumnGroup(group) && group.children.map((c) => c.field)).toEqual(["var", "varPct"]);
    expect(d.selectState).toBe("select:fund");
  });

  it("View by re-groups the same data and renames the first column", () => {
    const d = resolveBinding(summary, dataset, { "viewBy:summary": "Asset class" });
    if (d?.view !== "grid") throw new Error("expected a grid");
    expect(d.columns[0]).toMatchObject({ header: "Asset class" });
    expect(d.rows.map((r) => r[GROUP_FIELD])).toEqual(["Aggregate", "Equity", "Bonds"]);
    expect(d.rows[2]).toMatchObject({ mv: 1400, var: 30 });
  });

  it("currency converts money columns only, and stamps the currency code", () => {
    const d = resolveBinding(summary, dataset, { currency: "USD" });
    if (d?.view !== "grid") throw new Error("expected a grid");
    expect(d.rows[1]).toMatchObject({ mv: 1250, mvPct: 50, var: 50, varPct: 4 });
    expect(d.columns[1]).toMatchObject({ currency: "USD" });
    expect(currencyRate(dataset, "USD")).toBe(1.25);
    expect(currencyRate(dataset, "XXX")).toBe(1);
  });

  it("reports the selected row from state", () => {
    const d = resolveBinding(summary, dataset, { "select:fund": "Income" });
    expect(d?.view === "grid" && d.selected).toBe("Income");
  });
});

describe("resolveBinding - master grid selection filters other blocks", () => {
  const byClass: DataBinding = {
    table: "holdings",
    view: "series",
    groupBy: "assetClass",
    measures: [{ field: "mv" }],
    display: [{ key: "mv", label: "Market value" }],
    filters: [{ field: "fund", state: "select:fund", ignore: ["Aggregate"] }],
  };

  it("no selection (or the total row) shows everything", () => {
    for (const state of [{}, { "select:fund": "Aggregate" }]) {
      const d = resolveBinding(byClass, dataset, state);
      expect(d?.view === "series" && d.series[0].data).toEqual([600, 1400]);
    }
  });

  it("a selected fund re-scopes the chart to that fund", () => {
    const d = resolveBinding(byClass, dataset, { "select:fund": "Growth" });
    expect(d?.view === "series" && d.categories).toEqual(["Equity", "Bonds"]);
    expect(d?.view === "series" && d.series[0].data).toEqual([600, 400]);
  });
});

describe("resolveBinding - matrix with fee and benchmark rules", () => {
  const returns: DataBinding = {
    table: "holdings",
    view: "matrix",
    measures: [wavg("port1m"), wavg("bmk1m"), wavg("port3m"), wavg("bmk3m")],
    adjustments: [
      { when: { state: "feeType", in: ["Gross of fees"] }, offsets: { port1m: 0.05, port3m: 0.15 } },
      { when: { state: "benchmark", in: ["Secondary"] }, scale: { keys: ["bmk1m", "bmk3m"], factor: 0.9 } },
      { when: { state: "benchmark", in: ["None"] }, omit: ["bmk1m", "bmk3m", "ex1m", "ex3m"] },
    ],
    computed: [
      { as: "ex1m", op: "diff", of: ["port1m", "bmk1m"] },
      { as: "ex3m", op: "diff", of: ["port3m", "bmk3m"] },
    ],
    display: [],
    filters: [{ field: "fund", state: "select:fund", ignore: ["Total"] }],
    matrix: {
      categories: ["1 Month", "3 Month"],
      series: [
        { name: "Portfolio", keys: ["port1m", "port3m"] },
        { name: "Benchmark", keys: ["bmk1m", "bmk3m"] },
        { name: "Excess", keys: ["ex1m", "ex3m"], style: { type: "line" } },
      ],
    },
  };

  it("lays measures out as periods x series, market-value weighted", () => {
    const d = resolveBinding(returns, dataset, {});
    if (d?.view !== "series") throw new Error("expected series");
    expect(d.categories).toEqual(["1 Month", "3 Month"]);
    expect(d.series.map((s) => s.name)).toEqual(["Portfolio", "Benchmark", "Excess"]);
    expect(d.series[0].data).toEqual([2.1, 3.4]);
    expect(d.series[2].data[0]).toBeCloseTo(2.1 - 2);
    expect(d.series[2].type).toBe("line");
  });

  it("gross of fees adds the drag to the portfolio (and so to excess), not the benchmark", () => {
    const d = resolveBinding(returns, dataset, { feeType: "Gross of fees" });
    if (d?.view !== "series") throw new Error("expected series");
    expect(d.series[0].data).toEqual([2.15, 3.55]);
    expect(d.series[1].data[0]).toBeCloseTo(2);
    expect(d.series[2].data[0]).toBeCloseTo(0.15);
  });

  it("a secondary benchmark scales the benchmark; None removes benchmark and excess", () => {
    const secondary = resolveBinding(returns, dataset, { benchmark: "Secondary" });
    expect(secondary?.view === "series" && secondary.series[1].data[0]).toBeCloseTo(1.8);
    const none = resolveBinding(returns, dataset, { benchmark: "None" });
    expect(none?.view === "series" && none.series.map((s) => s.name)).toEqual(["Portfolio"]);
  });

  it("is re-scoped by the selected row", () => {
    const d = resolveBinding(returns, dataset, { "select:fund": "Income" });
    expect(d?.view === "series" && d.series[0].data).toEqual([1, 2]);
  });
});

describe("resolveBinding - parts and series styles", () => {
  it("parts carry the converted grand total for the donut centre", () => {
    const d = resolveBinding(
      { table: "holdings", view: "parts", groupBy: "assetClass", measures: [{ field: "mv" }], display: [{ key: "mv", label: "Market value", money: true }], centerMeasure: "mv" },
      dataset,
      { currency: "USD" },
    );
    if (d?.view !== "parts") throw new Error("expected parts");
    expect(d.seriesData).toEqual([{ name: "Equity", y: 750 }, { name: "Bonds", y: 1750 }]);
    expect(d.centerValue).toBe(2500);
  });

  it("series keep each measure's mark, axis and dash", () => {
    const d = resolveBinding(
      {
        table: "holdings", view: "series", groupBy: "fund",
        measures: [{ field: "var" }, wavg("port1m")],
        display: [
          { key: "var", label: "VaR", style: { type: "column", yAxis: 1 } },
          { key: "port1m", label: "Portfolio", style: { type: "line", dashStyle: "ShortDash" } },
        ],
      },
      dataset,
      {},
    );
    if (d?.view !== "series") throw new Error("expected series");
    expect(d.series[0]).toMatchObject({ name: "VaR", type: "column", yAxis: 1 });
    expect(d.series[1]).toMatchObject({ name: "Portfolio", type: "line", dashStyle: "ShortDash" });
  });

  it("a missing table resolves to null so the block can fall back to its own props", () => {
    expect(resolveBinding({ table: "nope", view: "series", measures: [], display: [] }, dataset, {})).toBeNull();
  });
});
