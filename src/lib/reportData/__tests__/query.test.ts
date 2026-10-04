import { describe, it, expect } from "vitest";
import { runQuery, cellKey, ALL_GROUP } from "../query";
import type { DataTable } from "../types";

const holdings: DataTable = {
  id: "holdings",
  label: "Holdings",
  grain: "One row per holding",
  fields: [
    { key: "fund", label: "Fund", role: "dimension" },
    { key: "assetClass", label: "Asset class", role: "dimension" },
    { key: "currency", label: "Currency", role: "dimension" },
    { key: "marketValue", label: "Market value", role: "measure", format: "currency" },
    { key: "ret", label: "Return", role: "measure", format: "percent" },
  ],
  rows: [
    { fund: "Growth", assetClass: "Equity", currency: "USD", marketValue: 600, ret: 4 },
    { fund: "Growth", assetClass: "Bonds", currency: "USD", marketValue: 200, ret: 1 },
    { fund: "Growth", assetClass: "Equity", currency: "EUR", marketValue: 200, ret: 2 },
    { fund: "Income", assetClass: "Bonds", currency: "EUR", marketValue: 700, ret: 1.5 },
    { fund: "Income", assetClass: "Equity", currency: "USD", marketValue: 300, ret: 3 },
  ],
};

describe("runQuery - group and aggregate", () => {
  it("groups by a dimension and sums a measure, in first-appearance order", () => {
    const r = runQuery(holdings, { groupBy: "fund", measures: [{ field: "marketValue" }] });
    expect(r.groups).toEqual(["Growth", "Income"]);
    expect(r.cells.map((c) => c.marketValue)).toEqual([1000, 1000]);
    expect(r.pivots).toEqual([]);
  });

  it("re-groups by any other dimension (View by)", () => {
    const r = runQuery(holdings, { groupBy: "assetClass", measures: [{ field: "marketValue" }] });
    expect(r.groups).toEqual(["Equity", "Bonds"]);
    expect(r.cells.map((c) => c.marketValue)).toEqual([1100, 900]);
  });

  it("supports avg, min, max, count and a weighted average", () => {
    const r = runQuery(holdings, {
      groupBy: "fund",
      measures: [
        { field: "ret", agg: "avg", as: "avgRet" },
        { field: "ret", agg: "min", as: "minRet" },
        { field: "ret", agg: "max", as: "maxRet" },
        { field: "ret", agg: "count", as: "n" },
        { field: "ret", agg: "wavg", weight: "marketValue", as: "wRet" },
      ],
    });
    const growth = r.cells[0];
    expect(growth.avgRet).toBeCloseTo(7 / 3);
    expect(growth.minRet).toBe(1);
    expect(growth.maxRet).toBe(4);
    expect(growth.n).toBe(3);
    expect(growth.wRet).toBeCloseTo((4 * 600 + 1 * 200 + 2 * 200) / 1000);
  });

  it("without groupBy, everything is one group", () => {
    const r = runQuery(holdings, { measures: [{ field: "marketValue" }] });
    expect(r.groups).toEqual([ALL_GROUP]);
    expect(r.cells[0].marketValue).toBe(2000);
  });

  it("scale multiplies the aggregate (currency conversion)", () => {
    const r = runQuery(holdings, { measures: [{ field: "marketValue", scale: 1.25 }] });
    expect(r.cells[0].marketValue).toBe(2500);
  });
});

describe("runQuery - pivot", () => {
  it("pivots a second dimension into columns", () => {
    const r = runQuery(holdings, { groupBy: "currency", pivotBy: "assetClass", measures: [{ field: "marketValue" }] });
    expect(r.groups).toEqual(["USD", "EUR"]);
    expect(r.pivots).toEqual(["Equity", "Bonds"]);
    expect(r.cells[0][cellKey("Equity", "marketValue")]).toBe(900);
    expect(r.cells[0][cellKey("Bonds", "marketValue")]).toBe(200);
    expect(r.cells[1][cellKey("Bonds", "marketValue")]).toBe(700);
  });

  it("a group with no rows for a pivot gets null, not zero", () => {
    const sparse: DataTable = { ...holdings, rows: holdings.rows.filter((r) => !(r.currency === "EUR" && r.assetClass === "Equity")) };
    const r = runQuery(sparse, { groupBy: "currency", pivotBy: "assetClass", measures: [{ field: "marketValue" }] });
    expect(r.cells[1][cellKey("Equity", "marketValue")]).toBeNull();
  });
});

describe("runQuery - filter, sort, limit, share, total", () => {
  it("filters rows before grouping (master grid selection)", () => {
    const r = runQuery(holdings, {
      groupBy: "assetClass",
      measures: [{ field: "marketValue" }],
      filters: [{ field: "fund", in: ["Income"] }],
    });
    expect(r.groups).toEqual(["Bonds", "Equity"]);
    expect(r.cells.map((c) => c.marketValue)).toEqual([700, 300]);
  });

  it("an empty filter list keeps every row", () => {
    const r = runQuery(holdings, { measures: [{ field: "marketValue" }], filters: [{ field: "fund", in: [] }] });
    expect(r.cells[0].marketValue).toBe(2000);
  });

  it("sorts by a measure and keeps the top N", () => {
    const r = runQuery(holdings, {
      groupBy: "currency",
      pivotBy: "assetClass",
      measures: [{ field: "marketValue" }],
      sort: { by: "marketValue", dir: "desc" },
      limit: 1,
    });
    expect(r.groups).toEqual(["USD"]);
  });

  it("sorts by label", () => {
    const r = runQuery(holdings, { groupBy: "assetClass", measures: [{ field: "marketValue" }], sort: { by: "label", dir: "asc" } });
    expect(r.groups).toEqual(["Bonds", "Equity"]);
  });

  it("share: 'total' expresses each cell as a percent of the grand total", () => {
    const r = runQuery(holdings, { groupBy: "currency", pivotBy: "assetClass", measures: [{ field: "marketValue" }], share: "total" });
    expect(r.cells[0][cellKey("Equity", "marketValue")]).toBeCloseTo(45);
    const sum = r.cells.flatMap((c) => Object.values(c)).reduce((a: number, v) => a + (v ?? 0), 0);
    expect(sum).toBeCloseTo(100);
  });

  it("share: 'group' expresses each cell as a percent of its own row", () => {
    const r = runQuery(holdings, { groupBy: "fund", pivotBy: "assetClass", measures: [{ field: "marketValue" }], share: "group" });
    expect(r.cells[0][cellKey("Equity", "marketValue")]).toBeCloseTo(80);
    expect(r.cells[0][cellKey("Bonds", "marketValue")]).toBeCloseTo(20);
  });

  it("total adds an aggregate over all groups, unaffected by limit", () => {
    const r = runQuery(holdings, { groupBy: "fund", measures: [{ field: "marketValue" }], total: true, limit: 1 });
    expect(r.groups).toHaveLength(1);
    expect(r.total?.marketValue).toBe(2000);
  });

  it("blank dimension values group under (blank); non-numeric measures are skipped", () => {
    const messy: DataTable = { ...holdings, rows: [{ fund: null, marketValue: "12" }, { fund: "", marketValue: "n/a" }, { fund: "A", marketValue: 3 }] };
    const r = runQuery(messy, { groupBy: "fund", measures: [{ field: "marketValue" }] });
    expect(r.groups).toEqual(["(blank)", "A"]);
    expect(r.cells.map((c) => c.marketValue)).toEqual([12, 3]);
  });
});
