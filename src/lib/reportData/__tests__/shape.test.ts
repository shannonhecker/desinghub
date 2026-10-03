import { describe, it, expect } from "vitest";
import { runQuery } from "../query";
import { toCategorySeries, toGrid, toParts, GROUP_FIELD } from "../shape";
import { isColumnGroup } from "../../dataGridModel";
import type { DataTable } from "../types";

const table: DataTable = {
  id: "holdings", label: "Holdings", grain: "", fields: [],
  rows: [
    { fund: "Growth", assetClass: "Equity", currency: "USD", mv: 600, var: 30 },
    { fund: "Growth", assetClass: "Bonds", currency: "USD", mv: 200, var: 4 },
    { fund: "Income", assetClass: "Bonds", currency: "EUR", mv: 700, var: 14 },
    { fund: "Income", assetClass: "Equity", currency: "USD", mv: 300, var: 15 },
    { fund: "Income", assetClass: "Cash", currency: "EUR", mv: 0, var: 0 },
  ],
};
const mv = { key: "mv", label: "Market value", kind: "currency" as const, compact: true };
const vr = { key: "var", label: "VaR", kind: "currency" as const };

describe("toCategorySeries", () => {
  it("not pivoted: one series per measure", () => {
    const cs = toCategorySeries(runQuery(table, { groupBy: "fund", measures: [{ field: "mv" }, { field: "var" }] }), [mv, vr]);
    expect(cs.categories).toEqual(["Growth", "Income"]);
    expect(cs.series).toEqual([
      { name: "Market value", data: [800, 1000] },
      { name: "VaR", data: [34, 29] },
    ]);
  });

  it("pivoted: one series per pivot value, with gaps as null", () => {
    const cs = toCategorySeries(runQuery(table, { groupBy: "currency", pivotBy: "assetClass", measures: [{ field: "mv" }] }), [mv]);
    expect(cs.categories).toEqual(["USD", "EUR"]);
    expect(cs.series.map((s) => s.name)).toEqual(["Equity", "Bonds", "Cash"]);
    expect(cs.series[0].data).toEqual([900, null]);
    expect(cs.series[2].data).toEqual([null, 0]);
  });
});

describe("toParts", () => {
  it("one part per group, dropping empty and non-positive parts", () => {
    expect(toParts(runQuery(table, { groupBy: "assetClass", measures: [{ field: "mv" }] }), "mv")).toEqual([
      { name: "Equity", y: 900 },
      { name: "Bonds", y: 900 },
    ]);
  });
});

describe("toGrid", () => {
  it("flat: a pinned group column, one column per measure, total first and bold", () => {
    const g = toGrid(runQuery(table, { groupBy: "fund", measures: [{ field: "mv" }, { field: "var" }], total: true }), [mv, vr], { groupHeader: "Fund", totalLabel: "Aggregate" });
    expect(g.columns).toEqual([
      { field: GROUP_FIELD, header: "Fund", pinned: true, flex: 2 },
      { field: "mv", header: "Market value", kind: "currency", compact: true },
      { field: "var", header: "VaR", kind: "currency" },
    ]);
    expect(g.rows[0]).toEqual({ [GROUP_FIELD]: "Aggregate", _bold: true, mv: 1800, var: 63 });
    expect(g.rows[1]).toEqual({ [GROUP_FIELD]: "Growth", mv: 800, var: 34 });
  });

  it("pivoted: one column group per pivot value", () => {
    const g = toGrid(runQuery(table, { groupBy: "fund", pivotBy: "currency", measures: [{ field: "mv" }] }), [mv], { groupHeader: "Fund" });
    expect(g.columns).toHaveLength(3);
    const usd = g.columns[1];
    expect(isColumnGroup(usd) && usd.header).toBe("USD");
    expect(isColumnGroup(usd) && usd.children[0].field).toBe("p0_mv");
    expect(g.rows[0]).toEqual({ [GROUP_FIELD]: "Growth", p0_mv: 800, p1_mv: null });
    expect(g.rows[1]).toEqual({ [GROUP_FIELD]: "Income", p0_mv: 300, p1_mv: 700 });
  });
});
