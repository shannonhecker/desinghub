import { describe, it, expect } from "vitest";
import { riskAnalytics, performanceAnalytics } from "../../financeTemplates";
import { levelsOf, resolveBinding, type DataBinding } from "../binding";
import { financeDataset, FUNDS } from "../financeDataset";
import { currentDataLevel, dataLevelOptions, withDataLevel, applyPanelConfig, readPanelConfig } from "../panelConfig";
import { GROUP_FIELD } from "../shape";
import { tableOf } from "../types";
import { HTML_DIALECT, contextBarLines } from "../../export/reportMarkup";
import { materialiseBlock } from "../../export/materialise";

const dataset = financeDataset();
const holdings = tableOf(dataset, "holdings")!;
const results = performanceAnalytics.body.find((b) => b.id === "tpl-perf-results")!;
const binding = results.props.binding as DataBinding;
const grid = (b: DataBinding, state = {}, expanded = false) => {
  const d = resolveBinding(b, dataset, state, { expanded })!;
  if (d.view !== "grid") throw new Error("not a grid");
  return d;
};
const depth = (rows: { _indent?: unknown }[]) => Math.max(...rows.map((r) => Number(r._indent ?? 0)));

describe("data level: how far down its hierarchy a grid goes", () => {
  it("in place: each group, then the first level under it", () => {
    const d = grid(binding);
    expect(depth(d.rows)).toBe(1);
    expect(d.rows[0]).toMatchObject({ [GROUP_FIELD]: "Total", _bold: true });
    const fund = d.rows[1];
    expect(fund).toMatchObject({ [GROUP_FIELD]: FUNDS[0], _bold: true });
    /* The children of a group add up to it, and select it. */
    const at = d.rows.indexOf(fund);
    const next = d.rows.findIndex((r, i) => i > at && !r._indent);
    const children = d.rows.slice(at + 1, next);
    expect(children.length).toBeGreaterThan(1);
    expect(children.every((r) => r._indent === 1 && r._select === FUNDS[0])).toBe(true);
    expect(children.reduce((n, r) => n + Number(r.marketValue), 0)).toBeCloseTo(Number(fund.marketValue), 2);
    expect(children.reduce((n, r) => n + Number(r.pctTotal), 0)).toBeCloseTo(Number(fund.pctTotal), 2);
  });

  it("expanded: the full hierarchy, down to the securities", () => {
    const d = grid(binding, {}, true);
    expect(depth(d.rows)).toBe(2);
    expect(d.rows.length).toBeGreaterThan(grid(binding).rows.length);
    /* A row with rows under it is bold; the leaves are not. */
    d.rows.forEach((r, i) => {
      const hasChildren = Number(d.rows[i + 1]?._indent ?? 0) > Number(r._indent ?? 0);
      if (i > 0) expect(Boolean(r._bold), String(r[GROUP_FIELD])).toBe(hasChildren);
    });
  });

  it("0 shows the groups alone; \"leaf\" lists the last level flat and selects nothing", () => {
    expect(grid({ ...binding, dataLevel: 0 }).rows.map((r) => r[GROUP_FIELD])).toEqual(["Total", ...FUNDS]);
    const leaf = grid({ ...binding, dataLevel: "leaf" });
    expect(depth(leaf.rows)).toBe(0);
    expect(leaf.columns[0]).toMatchObject({ header: "Security" });
    expect(leaf.rows.length).toBeGreaterThan(FUNDS.length + 1);
    expect(leaf.selectState).toBeUndefined();
  });

  it("a level that is the grouping itself is skipped", () => {
    const state = { "viewBy:tpl-perf-results": "Asset class" };
    expect(levelsOf({ ...binding, dataLevel: 2 }, "assetClass")).toEqual(["security"]);
    expect(depth(grid(binding, state).rows)).toBe(1);
  });

  it("the Risk summary has the same hierarchy", () => {
    const risk = riskAnalytics.body.find((b) => b.id === "tpl-risk-summary")!.props.binding as DataBinding;
    expect(depth(grid(risk).rows)).toBe(1);
    expect(depth(grid(risk, {}, true).rows)).toBe(2);
  });
});

describe("data level in the panel's configuration", () => {
  it("offers the full hierarchy, each shorter path, and the leaf level", () => {
    const options = dataLevelOptions(binding, holdings, {});
    expect(options.map((o) => [o.level, o.label, o.path])).toEqual([
      [2, "Full hierarchy", "Account > Asset class > Security"],
      [1, "Account and asset class", "Account > Asset class"],
      [0, "Account only", "Account"],
      ["leaf", "Security level", "Security"],
    ]);
    /* The configuration is edited expanded: the full hierarchy until a level
       is chosen. */
    expect(currentDataLevel(binding, options)?.level).toBe(2);
    expect(dataLevelOptions({ ...binding, hierarchy: undefined }, holdings, {})).toEqual([]);
  });

  it("a chosen level holds in place and expanded", () => {
    const chosen = withDataLevel(binding, 0);
    expect(depth(grid(chosen).rows)).toBe(0);
    expect(depth(grid(chosen, {}, true).rows)).toBe(0);
    expect(currentDataLevel(chosen, dataLevelOptions(chosen, holdings, {}))?.label).toBe("Account only");
  });

  it("re-configuring the grid keeps its hierarchy", () => {
    const config = readPanelConfig(results, holdings, {});
    const next = applyPanelConfig(results, config, holdings).props.binding as DataBinding;
    expect(next.hierarchy).toEqual(["assetClass", "security"]);
    expect(next.dataLevel).toBe(1);
  });
});

describe("expanded charts", () => {
  it("lift a top-N limit", () => {
    const issuers = riskAnalytics.body.find((b) => b.id === "tpl-risk-issuers")!.props.binding as DataBinding;
    const inPlace = resolveBinding(issuers, dataset, {})!;
    const expanded = resolveBinding(issuers, dataset, {}, { expanded: true })!;
    if (inPlace.view !== "series" || expanded.view !== "series") throw new Error();
    expect(inPlace.categories).toHaveLength(10);
    expect(expanded.categories.length).toBeGreaterThan(10);
  });

  it("carry a deeper table of their own when the binding names one", () => {
    const allocation = performanceAnalytics.body.find((b) => b.id === "tpl-perf-allocation")!.props.binding as DataBinding;
    const inPlace = resolveBinding(allocation, dataset, {})!;
    const expanded = resolveBinding(allocation, dataset, {}, { expanded: true })!;
    if (inPlace.view !== "parts" || expanded.view !== "parts") throw new Error();
    expect(inPlace.detail).toBeUndefined();
    expect(expanded.seriesData).toEqual(inPlace.seriesData);
    const detail = expanded.detail!;
    expect(detail.rows[0]).toMatchObject({ [GROUP_FIELD]: "Total", pctTotal: 100 });
    expect(depth(detail.rows)).toBe(1);
    /* One bold row per slice, in the slices' order. */
    expect(detail.rows.slice(1).filter((r) => !r._indent).map((r) => r[GROUP_FIELD])).toEqual(inPlace.seriesData.map((p) => p.name));
  });
});

describe("context bar export", () => {
  const bar = performanceAnalytics.header.find((b) => b.type === "ContextBar")!;

  it("the page title and each filter as a labelled select holding the report's value", () => {
    const html = contextBarLines(HTML_DIALECT, materialiseBlock(bar, dataset, { currency: "USD" })).join("\n");
    expect(html).toContain('<h1 class="page-title">Performance</h1>');
    expect([...html.matchAll(/<label for="[^"]+">([^<]+)<\/label>/g)].map((m) => m[1])).toEqual(["Fee type", "Currency", "Periodicity", "Benchmark"]);
    expect(html).toContain('<option value="USD" selected>USD</option>');
    expect(html).not.toContain("stateKey");
  });
});

describe("shares on a hierarchy grid: every row at every level", () => {
  const block = { type: results.type, props: results.props };
  const configured = (share: "total" | "group") => {
    const config = { ...readPanelConfig(block, holdings, {}), share };
    return applyPanelConfig(block, config, holdings).props.binding as DataBinding;
  };
  const key = (b: DataBinding) => b.display[0].key;

  it("% of total: child rows are shares of the grand total, and siblings add up to their parent", () => {
    const b = configured("total");
    const d = grid(b, {}, true);
    const k = key(b);
    const rows = d.rows.filter((r) => r[GROUP_FIELD] !== "Total");
    expect(depth(rows)).toBeGreaterThan(1);
    for (const r of rows) expect(Number(r[k])).toBeLessThanOrEqual(100.0001);
    /* Each parent equals the sum of its direct children (cells are rounded to 4 places). */
    rows.forEach((r, i) => {
      const level = Number(r._indent ?? 0);
      const kids: number[] = [];
      for (let j = i + 1; j < rows.length && Number(rows[j]._indent ?? 0) > level; j++) {
        if (Number(rows[j]._indent ?? 0) === level + 1) kids.push(Number(rows[j][k]));
      }
      if (kids.length) expect(kids.reduce((a, v) => a + v, 0)).toBeCloseTo(Number(r[k]), 2);
    });
  });

  it("% of row: child rows take the same share as their level's rows (no raw values)", () => {
    const b = configured("group");
    const d = grid(b, {}, true);
    const k = key(b);
    const top = d.rows.find((r) => !r._indent && r[GROUP_FIELD] !== "Total")!;
    for (const r of d.rows.filter((x) => Number(x._indent ?? 0) > 0)) expect(r[k]).toBe(top[k]);
  });
});
