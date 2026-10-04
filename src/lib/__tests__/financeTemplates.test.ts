import { describe, it, expect } from "vitest";
import { riskAnalytics, performanceAnalytics } from "../financeTemplates";
import { BUILDER_TEMPLATES, TEMPLATE_ORDER, VALID_TEMPLATE_IDS, hasUniformStructure, templateCategory } from "../builderTemplates";
import { resolveBinding, type DataBinding, type ReportState } from "../reportData/binding";
import { financeDataset, FUNDS } from "../reportData/financeDataset";
import { GROUP_FIELD } from "../reportData/shape";
import { isColumnGroup, leafColumns } from "../dataGridModel";
import { viewByStateKey } from "../panelMetrics";
import type { Block } from "@/store/useBuilder";

const dataset = financeDataset();
const templates = [riskAnalytics, performanceAnalytics];
const block = (tpl: typeof riskAnalytics, id: string): Block => tpl.body.find((b) => b.id === id)!;
const bound = (tpl: typeof riskAnalytics, id: string, state: ReportState = {}) =>
  resolveBinding(block(tpl, id).props.binding as DataBinding, dataset, state)!;
const fr = (b: Block) => Number(String(b.layout?.width ?? "").replace("fr", ""));

describe("finance templates - registration", () => {
  it("are registered, ordered, categorised and pin their structure", () => {
    for (const t of templates) {
      expect(VALID_TEMPLATE_IDS).toContain(t.id);
      expect(TEMPLATE_ORDER).toContain(t.id);
      expect(BUILDER_TEMPLATES[t.id]).toBe(t);
      expect(templateCategory(t.id)).toBe("finance");
      expect(hasUniformStructure(t.id)).toBe(true);
    }
    expect(templateCategory("analytics-dashboard")).toBe("general");
    expect(hasUniformStructure("analytics-dashboard")).toBe(false);
    expect(hasUniformStructure(null)).toBe(false);
  });

  it("use neutral names: no client names anywhere in the template", () => {
    for (const t of templates) expect(JSON.stringify(t)).not.toMatch(/j\.?\s?p\.?\s?morgan|jpm|barclays|chase/i);
  });
});

describe("finance templates - application chrome", () => {
  it("a flush, stacked, dark header of a top bar, a tab strip and the context bar; no sidebar, no footer", () => {
    for (const t of templates) {
      expect(t.header.map((b) => b.type)).toEqual(["TopNav", "TabStrip", "ContextBar"]);
      expect(t.zoneLayouts?.header).toMatchObject({ mode: "stack", gap: 0, flush: true, tone: "dark" });
      expect(t.zoneLayouts?.sidebar?.visible).toBe(false);
      expect(t.zoneLayouts?.footer?.visible).toBe(false);
      expect(t.sidebar).toEqual([]);
      expect(t.footer).toEqual([]);
    }
  });

  it("each report's tab strip marks its own workspace", () => {
    expect(riskAnalytics.header[1].props.active).toBe("Risk");
    expect(performanceAnalytics.header[1].props.active).toBe("Performance");
    for (const t of templates) expect(String(t.header[1].props.tabsCsv).split(", ")).toContain(t.header[1].props.active);
  });
});

describe("finance templates - layout rules for identical positions in every design system", () => {
  it("body is a 12-column grid and every row sums to 12", () => {
    for (const t of templates) {
      expect(t.zoneLayouts?.body).toMatchObject({ mode: "grid", columns: 12 });
      let run = 0;
      for (const b of t.body) {
        expect(fr(b), `${b.id} width`).toBeGreaterThan(0);
        run += fr(b);
        expect(run, `row overflow at ${b.id}`).toBeLessThanOrEqual(12);
        if (run === 12) run = 0;
      }
      expect(run, `${t.id} last row`).toBe(0);
    }
  });

  it("every block has a pinned height, and blocks in a row share it", () => {
    for (const t of templates) {
      let run = 0;
      let rowHeight: number | null = null;
      for (const b of t.body) {
        const h = typeof b.props.height === "number" ? b.props.height : Number(String(b.layout?.height ?? "").replace("px", ""));
        expect(h, `${b.id} height`).toBeGreaterThan(0);
        if (rowHeight === null) rowHeight = h;
        expect(h, `${b.id} row height`).toBe(rowHeight);
        run += fr(b);
        if (run === 12) { run = 0; rowHeight = null; }
      }
    }
  });

  it("every panel is top-level and data-bound; every filter is a report control", () => {
    for (const t of templates) {
      for (const b of t.body) {
        expect(b.children, b.id).toBeUndefined();
        if (b.type === "DataGrid" || b.type.startsWith("Highchart")) expect(b.props.binding, b.id).toBeTruthy();
        if (b.type === "SimulatedDropdown") expect(typeof b.props.stateKey, b.id).toBe("string");
      }
      expect(t.datasetId).toBe(dataset.id);
    }
  });
});

describe("finance templates - every binding resolves to real content", () => {
  it("with default state, no panel is empty", () => {
    for (const t of templates) {
      for (const b of t.body.filter((x) => x.props.binding)) {
        const d = bound(t, b.id);
        if (d.view === "grid") { expect(d.rows.length, b.id).toBeGreaterThan(1); expect(d.columns.length, b.id).toBeGreaterThan(1); }
        if (d.view === "series") { expect(d.categories.length, b.id).toBeGreaterThan(1); expect(d.series.length, b.id).toBeGreaterThan(0); }
        if (d.view === "parts") expect(d.seriesData.length, b.id).toBeGreaterThan(1);
      }
    }
  });
});

describe("Risk Analytics - interactions", () => {
  const summary = (state: ReportState = {}) => { const d = bound(riskAnalytics, "tpl-risk-summary", state); if (d.view !== "grid") throw new Error(); return d; };

  it("summary: an Aggregate row then one row per fund, with grouped VaR columns", () => {
    const d = summary();
    /* Each fund, then the asset classes it holds, indented under it. */
    expect(d.rows.filter((r) => !r._indent).map((r) => r[GROUP_FIELD])).toEqual(["Aggregate", ...FUNDS]);
    const children = d.rows.filter((r) => r._indent === 1);
    expect(children.length).toBeGreaterThan(FUNDS.length);
    expect(new Set(children.map((r) => r._select))).toEqual(new Set(FUNDS));
    expect(d.rows.every((r) => Number(r._indent ?? 0) <= 1)).toBe(true);
    expect(d.rows[0]).toMatchObject({ _bold: true, pvPct: 100 });
    expect(d.columns.filter(isColumnGroup).map((g) => g.header)).toEqual(["VaR 95% (20D)", "IVaR 95% (20D)", "MVaR 95% (20D)", "CVaR 95% (20D)"]);
  });

  it("View by re-groups the summary", () => {
    const d = summary({ [viewByStateKey("tpl-risk-summary")]: "Asset class" });
    expect(d.columns[0]).toMatchObject({ header: "Asset class" });
    expect(d.rows.map((r) => r[GROUP_FIELD])).toContain("Equity");
  });

  it("Currency converts money and leaves percentages alone", () => {
    const gbp = summary().rows[0];
    const usd = summary({ currency: "USD" }).rows[0];
    expect(usd.marketValue).toBeCloseTo((gbp.marketValue as number) * 1.27, 0);
    expect(usd.var95Pct).toBe(gbp.var95Pct);
    expect(leafColumns(summary({ currency: "USD" }).columns)[1]).toMatchObject({ currency: "USD" });
  });

  it("selecting a fund in the summary re-scopes every chart below it", () => {
    const fund = FUNDS[3]; // the bond fund: no equity
    for (const id of ["tpl-risk-market-value", "tpl-risk-contribution", "tpl-risk-issuers", "tpl-risk-var"]) {
      const all = JSON.stringify(bound(riskAnalytics, id));
      const scoped = JSON.stringify(bound(riskAnalytics, id, { "select:risk": fund }));
      expect(scoped, id).not.toBe(all);
    }
    const issuers = bound(riskAnalytics, "tpl-risk-issuers", { "select:risk": fund });
    expect(issuers.view === "series" && issuers.series.map((s) => s.name)).not.toContain("Equity");
  });

  it("selecting the Aggregate row is the same as no selection", () => {
    expect(bound(riskAnalytics, "tpl-risk-issuers", { "select:risk": "Aggregate" })).toEqual(bound(riskAnalytics, "tpl-risk-issuers"));
  });

  it("a selection made under another View by filters on that dimension", () => {
    const d = bound(riskAnalytics, "tpl-risk-market-value", { [viewByStateKey("tpl-risk-summary")]: "Asset class", "select:risk": "Equity" });
    expect(d.view === "series" && d.series.map((s) => s.name)).toEqual(["Equity"]);
  });

  it("stacked share charts add up to 100%", () => {
    for (const id of ["tpl-risk-contribution"]) {
      const d = bound(riskAnalytics, id);
      if (d.view !== "series") throw new Error();
      const total = d.series.flatMap((s) => s.data).reduce((a: number, v) => a + (v ?? 0), 0);
      expect(total, id).toBeCloseTo(100, 1);
    }
  });

  it("the VaR trend keeps each series' mark and axis", () => {
    const d = bound(riskAnalytics, "tpl-risk-var");
    if (d.view !== "series") throw new Error();
    expect(d.categories).toHaveLength(24);
    expect(d.series.map((s) => [s.type, s.yAxis ?? 0])).toEqual([["column", 1], ["line", 0], ["line", 0]]);
    expect(d.series[2].dashStyle).toBe("ShortDash");
  });
});

describe("Performance Analytics - interactions", () => {
  const results = (state: ReportState = {}) => { const d = bound(performanceAnalytics, "tpl-perf-results", state); if (d.view !== "grid") throw new Error(); return d; };
  const total = (state: ReportState = {}) => results(state).rows[0];

  it("results: a Total row then one row per account, grouped by period", () => {
    const d = results();
    expect(d.rows.filter((r) => !r._indent).map((r) => r[GROUP_FIELD])).toEqual(["Total", ...FUNDS]);
    expect(d.rows.filter((r) => r._indent === 1).length).toBeGreaterThan(FUNDS.length);
    expect(d.columns.filter(isColumnGroup).map((g) => g.header)).toEqual(["1 Month", "3 Month", "YTD", "1 Year"]);
    expect(total().excess1m).toBeCloseTo((total().port1m as number) - (total().bmk1m as number), 2);
  });

  it("Gross of fees adds the period's fee drag to the portfolio, not the benchmark", () => {
    const net = total();
    const gross = total({ feeType: "Gross of fees" });
    expect(gross.port1m).toBeCloseTo((net.port1m as number) + 0.05, 2);
    expect(gross.port1y).toBeCloseTo((net.port1y as number) + 0.6, 2);
    expect(gross.bmk1y).toBe(net.bmk1y);
    expect(gross.excess1y).toBeCloseTo((net.excess1y as number) + 0.6, 2);
  });

  it("Benchmark: Secondary and Custom scale it, None removes benchmark and excess columns", () => {
    const primary = total();
    expect(total({ benchmark: "Secondary" }).bmk1y).toBeCloseTo((primary.bmk1y as number) * 0.9, 2);
    expect(total({ benchmark: "Custom" }).bmk1y).toBeCloseTo((primary.bmk1y as number) * 1.08, 2);
    const none = results({ benchmark: "None" });
    const headers = leafColumns(none.columns).map((c) => c.header);
    expect(headers).not.toContain("Bmk");
    expect(headers).not.toContain("Excess");
    expect(headers.filter((h) => h === "Port")).toHaveLength(4);
  });

  it("selecting an account re-scopes returns, breakdown, allocation, history and trend", () => {
    const fund = FUNDS[1];
    for (const id of ["tpl-perf-breakdown", "tpl-perf-returns", "tpl-perf-allocation", "tpl-perf-history", "tpl-perf-trend"]) {
      expect(JSON.stringify(bound(performanceAnalytics, id, { "select:performance": fund })), id).not.toBe(JSON.stringify(bound(performanceAnalytics, id)));
    }
    const returns = bound(performanceAnalytics, "tpl-perf-returns", { "select:performance": fund });
    const row = results().rows.find((r) => r[GROUP_FIELD] === fund)!;
    expect(returns.view === "series" && returns.series[0].data[0]).toBeCloseTo(row.port1m as number, 2);
  });

  it("the returns chart agrees with the Total row (the original's two disagreed)", () => {
    const d = bound(performanceAnalytics, "tpl-perf-returns");
    if (d.view !== "series") throw new Error();
    expect(d.categories).toEqual(["1 Month", "3 Month", "YTD", "1 Year"]);
    expect(d.series.map((s) => s.name)).toEqual(["Portfolio", "Benchmark", "Excess"]);
    expect(d.series[0].data[2]).toBeCloseTo(total().portYtd as number, 2);
    expect(d.series[1].data[2]).toBeCloseTo(total().bmkYtd as number, 2);
  });

  it("Periodicity reshapes the trend; its View by picks which bars show", () => {
    const monthly = bound(performanceAnalytics, "tpl-perf-trend");
    const yearly = bound(performanceAnalytics, "tpl-perf-trend", { periodicity: "Yearly" });
    expect(monthly.view === "series" && monthly.categories).toHaveLength(13);
    expect(yearly.view === "series" && yearly.categories).toHaveLength(5);
    const fundOnly = bound(performanceAnalytics, "tpl-perf-trend", { [viewByStateKey("tpl-perf-trend")]: "Fund" });
    expect(fundOnly.view === "series" && fundOnly.series.map((s) => s.name)).toEqual(["Fund", "Excess"]);
    const none = bound(performanceAnalytics, "tpl-perf-trend", { benchmark: "None" });
    expect(none.view === "series" && none.series.map((s) => s.name)).toEqual(["Fund"]);
  });

  it("allocation: parts per View by, with the converted total for the donut centre", () => {
    const d = bound(performanceAnalytics, "tpl-perf-allocation", { currency: "USD" });
    if (d.view !== "parts") throw new Error();
    expect(d.centerValue).toBeCloseTo((total().marketValue as number) * 1.27, 0);
    const region = bound(performanceAnalytics, "tpl-perf-allocation", { [viewByStateKey("tpl-perf-allocation")]: "Region" });
    expect(region.view === "parts" && region.seriesData.map((p) => p.name)).toContain("Europe");
  });

  it("allocation history weights add up to 100% in every period", () => {
    const d = bound(performanceAnalytics, "tpl-perf-history");
    if (d.view !== "series") throw new Error();
    d.categories.forEach((_, i) => {
      expect(d.series.reduce((a, s) => a + (s.data[i] ?? 0), 0)).toBeCloseTo(100, 1);
    });
  });
});

/* Narrow frames: every body block says how it folds, so no panel is left at
   an unusable half-width on a phone. */
import { describe as describeNarrow, it as itNarrow, expect as expectNarrow } from "vitest";
import { riskAnalytics as riskTpl, performanceAnalytics as perfTpl } from "../financeTemplates";
import { computeItemStyle } from "../layoutResolver";

describeNarrow("finance templates on tablet and phone", () => {
  for (const tpl of [riskTpl, perfTpl]) {
    itNarrow(`${tpl.label}: every block narrower than the full row declares its tablet and phone span`, () => {
      for (const b of tpl.body) {
        if (b.layout?.width === "12fr") continue;
        expectNarrow(b.layout?.spanTablet, b.id).toBeGreaterThanOrEqual(3);
        expectNarrow(b.layout?.spanPhone, b.id).toBeGreaterThanOrEqual(6);
      }
    });
    itNarrow(`${tpl.label}: panels are full width on a phone and at least half on a tablet`, () => {
      for (const b of tpl.body.filter((x) => x.type === "DataGrid" || x.type.startsWith("Highchart"))) {
        if (b.layout?.width === "12fr") continue;
        expectNarrow(b.layout?.spanPhone, b.id).toBe(12);
        expectNarrow(b.layout?.spanTablet, b.id).toBeGreaterThanOrEqual(6);
      }
    });
  }

  itNarrow("the resolver publishes the spans as custom properties in a grid zone", () => {
    const style = computeItemStyle({ id: "x", type: "DataGrid", props: {}, layout: { width: "4fr", spanTablet: 6, spanPhone: 12 } }, { mode: "grid", columns: 12 }) as Record<string, unknown>;
    expectNarrow(style.gridColumn).toBe("span 4");
    expectNarrow(style["--span-tablet"]).toBe(6);
    expectNarrow(style["--span-phone"]).toBe(12);
    const plain = computeItemStyle({ id: "y", type: "DataGrid", props: {}, layout: { width: "4fr", spanTablet: 40 } }, { mode: "grid", columns: 12 }) as Record<string, unknown>;
    expectNarrow(plain["--span-tablet"]).toBeUndefined();
  });
});
