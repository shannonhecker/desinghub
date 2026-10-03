import { describe, it, expect } from "vitest";
import { financeDataset, FUNDS, PERIODICITIES, RISK_TYPES } from "../financeDataset";
import { runQuery } from "../query";
import { applyComputed } from "../computed";
import { tableOf } from "../types";

const ds = financeDataset();
const holdings = tableOf(ds, "holdings")!;

describe("financeDataset - one consistent portfolio", () => {
  it("is deterministic", () => {
    expect(financeDataset()).toBe(ds);
    expect(holdings.rows[0].var95).toBe(holdings.rows[0].var95);
    expect(holdings.rows).toHaveLength(35);
  });

  it("every table's rows only use declared fields, and every field appears", () => {
    for (const t of ds.tables) {
      const keys = new Set(t.fields.map((f) => f.key));
      for (const r of t.rows) for (const k of Object.keys(r)) expect(keys.has(k), `${t.id}.${k}`).toBe(true);
      for (const k of keys) expect(t.rows.some((r) => r[k] !== undefined), `${t.id}.${k} unused`).toBe(true);
    }
  });

  it("covers all five funds, and the same total whichever way it is grouped", () => {
    const total = holdings.rows.reduce((a, r) => a + (r.marketValue as number), 0);
    for (const dim of ["fund", "assetClass", "region", "sector", "currency", "strategy"]) {
      const r = runQuery(holdings, { groupBy: dim, measures: [{ field: "marketValue" }] });
      expect(r.cells.reduce((a, c) => a + (c.marketValue ?? 0), 0), dim).toBe(total);
    }
    expect(runQuery(holdings, { groupBy: "fund", measures: [{ field: "marketValue" }] }).groups).toEqual([...FUNDS]);
  });

  it("VaR is a plausible share of market value for every fund", () => {
    const r = applyComputed(
      runQuery(holdings, { groupBy: "fund", measures: [{ field: "marketValue" }, { field: "var95" }], total: true }),
      [{ as: "varPct", op: "percentOf", of: ["var95", "marketValue"] }],
    );
    for (const c of [...r.cells, r.total!]) {
      expect(c.varPct!).toBeGreaterThan(1.5);
      expect(c.varPct!).toBeLessThan(7);
    }
  });

  it("the risk contribution table sums back to the holdings' VaR", () => {
    const contribution = tableOf(ds, "riskContribution")!;
    const sum = contribution.rows.reduce((a, r) => a + (r.riskAmount as number), 0);
    const var95 = holdings.rows.reduce((a, r) => a + (r.var95 as number), 0);
    expect(Math.abs(sum - var95) / var95).toBeLessThan(0.001);
    expect(new Set(contribution.rows.map((r) => r.riskType))).toEqual(new Set(RISK_TYPES));
  });

  it("history tables cover every fund for every period", () => {
    const varHistory = tableOf(ds, "varHistory")!;
    expect(varHistory.rows).toHaveLength(24 * FUNDS.length);
    const trend = tableOf(ds, "trend")!;
    for (const p of PERIODICITIES) {
      const rows = trend.rows.filter((r) => r.periodicity === p);
      expect(rows.length % FUNDS.length, p).toBe(0);
      expect(new Set(rows.map((r) => r.period)).size, p).toBe(rows.length / FUNDS.length);
    }
    const months = runQuery(varHistory, { groupBy: "month", measures: [{ field: "portfolioVar", agg: "avg" }] }).groups;
    expect(months[0]).toBe("Jan 23");
    expect(months[23]).toBe("Dec 24");
  });

  it("the latest allocation period matches today's holdings", () => {
    const history = tableOf(ds, "allocationHistory")!;
    const latest = history.rows.filter((r) => r.period === "Q4 24").reduce((a, r) => a + (r.marketValue as number), 0);
    const today = holdings.rows.reduce((a, r) => a + (r.marketValue as number), 0);
    expect(latest).toBe(today);
  });

  it("has an fx rate for the base currency of exactly 1", () => {
    expect(tableOf(ds, "fx")!.rows.find((r) => r.currency === ds.baseCurrency)?.rate).toBe(1);
  });
});
