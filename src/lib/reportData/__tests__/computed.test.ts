import { describe, it, expect } from "vitest";
import { runQuery } from "../query";
import { applyComputed } from "../computed";
import type { DataTable } from "../types";

const table: DataTable = {
  id: "h", label: "H", grain: "", fields: [],
  rows: [
    { fund: "Growth", mv: 600, var: 30, port: 4, bmk: 3 },
    { fund: "Growth", mv: 400, var: 10, port: 2, bmk: 2.5 },
    { fund: "Income", mv: 1000, var: 20, port: 1, bmk: 1.2 },
  ],
};
const base = () =>
  runQuery(table, {
    groupBy: "fund",
    total: true,
    measures: [
      { field: "mv" },
      { field: "var" },
      { field: "port", agg: "wavg", weight: "mv" },
      { field: "bmk", agg: "wavg", weight: "mv" },
    ],
  });

describe("applyComputed", () => {
  it("percentOf: a ratio of two aggregates, per group and for the total", () => {
    const r = applyComputed(base(), [{ as: "varPct", op: "percentOf", of: ["var", "mv"] }]);
    expect(r.cells[0].varPct).toBeCloseTo(4);
    expect(r.cells[1].varPct).toBeCloseTo(2);
    expect(r.total?.varPct).toBeCloseTo(3);
    expect(r.measures).toContain("varPct");
  });

  it("diff: excess is portfolio minus benchmark, on the weighted averages", () => {
    const r = applyComputed(base(), [{ as: "excess", op: "diff", of: ["port", "bmk"] }]);
    expect(r.cells[0].port).toBeCloseTo(3.2);
    expect(r.cells[0].bmk).toBeCloseTo(2.8);
    expect(r.cells[0].excess).toBeCloseTo(0.4);
  });

  it("shareOfTotal: each group's share of the grand total; the total is 100", () => {
    const r = applyComputed(base(), [{ as: "mvPct", op: "shareOfTotal", of: ["mv"] }]);
    expect(r.cells.map((c) => c.mvPct)).toEqual([50, 50]);
    expect(r.total?.mvPct).toBe(100);
  });

  it("adjust: scale then offset, in place when `as` names an existing measure", () => {
    const r = applyComputed(base(), [
      { as: "bmk", op: "adjust", of: ["bmk"], factor: 0.9 },
      { as: "port", op: "adjust", of: ["port"], offset: 0.05 },
      { as: "excess", op: "diff", of: ["port", "bmk"] },
    ]);
    expect(r.cells[1].bmk).toBeCloseTo(1.08);
    expect(r.cells[1].port).toBeCloseTo(1.05);
    expect(r.cells[1].excess).toBeCloseTo(-0.03);
    expect(r.measures.filter((m) => m === "bmk")).toHaveLength(1);
  });

  it("a missing operand or a zero denominator gives null, not NaN or Infinity", () => {
    const empty: DataTable = { ...table, rows: [{ fund: "A", mv: 0, var: 5 }, { fund: "B", var: 5 }] };
    const r = applyComputed(runQuery(empty, { groupBy: "fund", measures: [{ field: "mv" }, { field: "var" }] }), [{ as: "varPct", op: "percentOf", of: ["var", "mv"] }]);
    expect(r.cells.map((c) => c.varPct)).toEqual([null, null]);
  });

  it("works per pivot column", () => {
    const pivoted: DataTable = { ...table, rows: table.rows.map((r, i) => ({ ...r, ccy: i === 0 ? "USD" : "EUR" })) };
    const r = applyComputed(runQuery(pivoted, { groupBy: "fund", pivotBy: "ccy", measures: [{ field: "mv" }, { field: "var" }] }), [{ as: "varPct", op: "percentOf", of: ["var", "mv"] }]);
    expect(r.cells[0]["USD\u0000varPct"]).toBeCloseTo(5);
    expect(r.cells[0]["EUR\u0000varPct"]).toBeCloseTo(2.5);
  });
});
