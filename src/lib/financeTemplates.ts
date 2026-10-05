/**
 * financeTemplates - the finance report templates.
 *
 * Rebuilt from the owner's own analytics dashboards as builder templates:
 * one DS-agnostic Block[] per report, drawn by the registry in every design
 * system. Names, brand and figures are neutral and illustrative.
 *
 * The reports are DATA-BOUND: every grid and chart carries a `binding` and
 * derives its content from the "portfolio" dataset (reportData/
 * financeDataset.ts) and the canvas's report state. So the context filters
 * convert and re-derive, each panel's "View by" re-groups, and selecting a
 * row in a report's master grid re-scopes the other panels to that row.
 *
 * Layout rules these templates follow so every panel lands on the same
 * pixels in every design system:
 *   - 12-column grid body, `Nfr` widths, every row sums to 12.
 *   - Every block has a pinned height: panels through their `height` prop
 *     (the frame sets the box), the context row through `layout.height`.
 *   - Blocks stay top-level (no groups).
 *   - uniformStructure pins header height and canvas padding.
 */

import type { Block } from "@/store/useBuilder";
import type { BuilderTemplate } from "./builderTemplates";
import { viewByStateKey } from "./panelMetrics";
import type { Adjustment, BindingFilter, BoundMeasure, DataBinding, FromState } from "./reportData/binding";
import type { ComputedSpec } from "./reportData/computed";
import { FINANCE_DATASET_ID, FX_RATES, PERIODICITIES } from "./reportData/financeDataset";
import type { MeasureSpec } from "./reportData/query";

export const FINANCE_BRAND = "Meridian Analytics";
export const AS_OF = "as of Dec 2024";

/** Height of the context row (title + filters): fits the tallest system's
 *  labelled select. */
export const CONTEXT_ROW_HEIGHT = "64px";
/** The report canvas: 12 columns, one gutter between panels (the same as
 *  the canvas padding, see --dh-report-gutter). */
export const BODY_LAYOUT = { mode: "grid", columns: 12, gap: 24 } as const;

/* ── Report state keys ── */
const FEE_STATE = "feeType";
const PERIODICITY_STATE = "periodicity";
const BENCHMARK_STATE = "benchmark";
const GROSS = "Gross of fees";

/* ── Chrome ──
   The application shell of the original reports: a dark top bar (brand,
   primary links, account) over a dark tab strip of workspaces, with no
   sidebar and no footer. Both bars are ordinary blocks in a flush, stacked
   header, so they can be edited, re-toned, reordered or removed. */
export const WORKSPACES = "Home, Performance, Risk, Sustainable Investment";

/** One filter of a page's context bar: a labelled dropdown whose value is
 *  report state. */
export interface ContextFilter { label: string; stateKey: string; value: string; options: string[] }
export const filter = (label: string, stateKey: string, value: string, options: readonly string[]): ContextFilter => ({ label, stateKey, value, options: [...options] });
/** The context bar under the workspace tabs: the page's title and filters. */
export const contextBar = (prefix: string, title: string, filters: ContextFilter[]): Block => ({
  id: `tpl-${prefix}-context`, type: "ContextBar", props: { title, filters, tone: "surface" },
});

/** Which template each workspace tab opens while presenting. */
export const WORKSPACE_TEMPLATES = {
  Home: "analytics-home",
  Performance: "performance-analytics",
  Risk: "risk-analytics",
  "Sustainable Investment": "esg-analytics",
} as const;

const chrome = (prefix: string, active: string, filters: ContextFilter[]) => ({
  header: [
    {
      id: `tpl-${prefix}-topnav`, type: "TopNav",
      props: { brand: FINANCE_BRAND, linksCsv: "Manager, Solutions, Apps, Resources", active: "Manager", chevrons: true, account: "", tone: "dark" },
    },
    {
      id: `tpl-${prefix}-tabs`, type: "TabStrip",
      props: { label: "Workspaces", tabsCsv: WORKSPACES, active, addButton: true, tone: "dark", templates: WORKSPACE_TEMPLATES },
    },
    contextBar(prefix, active, filters),
  ] as Block[],
  sidebar: [] as Block[],
  footer: [] as Block[],
});

const CHROME_LAYOUTS = {
  header: { mode: "stack", gap: 0, flush: true, tone: "dark" },
  sidebar: { mode: "stack", gap: 2, align: "stretch", visible: false },
  footer: { mode: "row", gap: 8, wrap: false, align: "center", visible: false },
} as const;

/* How a block folds on a narrower frame (LayoutProps.spanTablet / spanPhone,
   of 12 columns). Panels are never narrower than half a tablet or the full
   width of a phone; the page title takes its own row. */
export type Narrow = { spanTablet: number; spanPhone: number };
export const FULL: Narrow = { spanTablet: 12, spanPhone: 12 };
export const HALF: Narrow = { spanTablet: 6, spanPhone: 12 };

export const CURRENCIES = FX_RATES.map((r) => String(r.currency));

/** A "View by" that follows a panel's select: label -> field. */
export const viewBy = (blockId: string, options: Record<string, string>): FromState<string> => ({
  state: viewByStateKey(blockId),
  options,
  fallback: Object.values(options)[0],
});
/** The same choice, as the column header (label -> label). */
export const viewByHeader = (blockId: string, options: Record<string, string>): FromState<string> => ({
  state: viewByStateKey(blockId),
  options: Object.fromEntries(Object.keys(options).map((k) => [k, k])),
  fallback: Object.keys(options)[0],
});

export const sum = (field: string): MeasureSpec => ({ field });
export const weighted = (field: string): MeasureSpec => ({ field, agg: "wavg", weight: "marketValue" });
const pct = (key: string, label: string, extra: Partial<BoundMeasure> = {}): BoundMeasure => ({ key, label, kind: "percent", width: 82, ...extra });
const money = (key: string, label: string, extra: Partial<BoundMeasure> = {}): BoundMeasure => ({ key, label, kind: "currency", compact: true, money: true, width: 104, ...extra });

export const PERCENT_CHART = { yAxisFormat: "{value}%", valueDecimals: 2, valueSuffix: "%" };
/** Stacked shares of a whole: the axis stops at 100%. */
const SHARE_CHART = { ...PERCENT_CHART, yAxisMax: 100 };

/* ══════════════════════════════════════════════════════════════
   Risk Analytics
   ══════════════════════════════════════════════════════════════ */

const RISK_SUMMARY = "tpl-risk-summary";
const RISK_SELECT = "select:risk";
const RISK_TOTAL = "Aggregate";
const RISK_DIMENSIONS = { Fund: "fund", "Asset class": "assetClass", Currency: "currency", Sector: "sector", Region: "region", Strategy: "strategy" };
/** Re-scope a panel to the row selected in the risk summary grid: filter on
 *  whatever dimension that grid is currently grouped by. */
const riskScope: BindingFilter = { field: viewBy(RISK_SUMMARY, RISK_DIMENSIONS), state: RISK_SELECT, ignore: [RISK_TOTAL] };

const RISK_MEASURES: [key: string, header: string][] = [
  ["var95", "VaR 95% (20D)"],
  ["ivar95", "IVaR 95% (20D)"],
  ["mvar95", "MVaR 95% (20D)"],
  ["cvar95", "CVaR 95% (20D)"],
];

const riskSummary: DataBinding = {
  table: "holdings",
  view: "grid",
  groupBy: viewBy(RISK_SUMMARY, RISK_DIMENSIONS),
  groupHeader: viewByHeader(RISK_SUMMARY, RISK_DIMENSIONS),
  measures: [sum("marketValue"), ...RISK_MEASURES.map(([k]) => sum(k))],
  computed: [
    { as: "pvPct", op: "shareOfTotal", of: ["marketValue"] },
    ...RISK_MEASURES.map(([k]): ComputedSpec => ({ as: `${k}Pct`, op: "percentOf", of: [k, "marketValue"] })),
  ],
  /* Sized to fit the full-width panel without scrolling sideways. */
  display: [
    money("marketValue", "PV", { width: 92 }),
    pct("pvPct", "(%)", { width: 84 }),
    ...RISK_MEASURES.flatMap(([k]) => [money(k, "Value", { width: 92 }), pct(`${k}Pct`, "(%)", { width: 70 })]),
  ],
  groupMinWidth: 180,
  columnGroups: RISK_MEASURES.map(([k, header]) => ({ header, keys: [k, `${k}Pct`] })),
  total: RISK_TOTAL,
  selectState: RISK_SELECT,
  /* Total, then each group, then what it holds; expanded goes down to the
     securities. */
  hierarchy: ["assetClass", "security"],
  dataLevel: 1,
};

const RISK_MARKET_VALUE = "tpl-risk-market-value";
const riskMarketValue: DataBinding = {
  table: "holdings",
  view: "series",
  groupBy: viewBy(RISK_MARKET_VALUE, { Currency: "currency", Region: "region", Sector: "sector" }),
  pivotBy: "assetClass",
  measures: [sum("marketValue")],
  display: [{ key: "marketValue", label: "Market value" }],
  share: "total",
  sort: { by: "marketValue", dir: "desc" },
  limit: 10,
  filters: [riskScope],
};

const riskContribution: DataBinding = {
  table: "riskContribution",
  view: "series",
  groupBy: "riskType",
  pivotBy: "assetClass",
  measures: [sum("riskAmount")],
  display: [{ key: "riskAmount", label: "Risk" }],
  share: "total",
  filters: [riskScope],
};

const riskIssuers: DataBinding = {
  table: "holdings",
  view: "series",
  groupBy: "issuer",
  pivotBy: "assetClass",
  measures: [sum("marketValue")],
  display: [{ key: "marketValue", label: "Exposure" }],
  share: "total",
  sort: { by: "marketValue", dir: "desc" },
  limit: 10,
  filters: [riskScope],
};

const riskVar: DataBinding = {
  table: "varHistory",
  view: "series",
  groupBy: "month",
  measures: [weighted("activeVar"), weighted("portfolioVar"), weighted("benchmarkVar")],
  display: [
    { key: "activeVar", label: "VaR (MC) - Active (right axis)", style: { type: "column", yAxis: 1 } },
    { key: "portfolioVar", label: "Portfolio", style: { type: "line" } },
    { key: "benchmarkVar", label: "Benchmark", style: { type: "line", dashStyle: "ShortDash" } },
  ],
  filters: [riskScope],
};

export const riskAnalytics: BuilderTemplate = {
  id: "risk-analytics",
  label: "Risk Analytics",
  desc: "Value-at-risk summary driving exposure, contribution and VaR trend charts",
  icon: "shield",
  category: "finance",
  uniformStructure: true,
  datasetId: FINANCE_DATASET_ID,
  interfaceType: "dashboard",
  selectedComponents: ["table", "inputs"],
  zoneLayouts: { body: BODY_LAYOUT, ...CHROME_LAYOUTS },
  ...chrome("risk", "Risk", [filter("Currency", "currency", "GBP", CURRENCIES)]),
  body: [
    {
      id: RISK_SUMMARY, type: "DataGrid",
      props: { title: "Risk summary", subtitle: AS_OF, height: 572, viewBy: Object.keys(RISK_DIMENSIONS), binding: riskSummary },
      layout: { width: "12fr" },
    },

    {
      id: RISK_MARKET_VALUE, type: "HighchartStackedBar",
      props: { chartType: "stacked-bar", panel: true, height: 380, title: "Market value", viewBy: ["Currency", "Region", "Sector"], binding: riskMarketValue, ...PERCENT_CHART },
      layout: { width: "4fr", ...HALF },
    },
    {
      id: "tpl-risk-contribution", type: "HighchartColumn",
      props: { chartType: "stacked-column", panel: true, height: 380, title: "Contribution by risk type", subtitle: "(Stacked)", binding: riskContribution, ...PERCENT_CHART },
      layout: { width: "4fr", ...HALF },
    },
    {
      id: "tpl-risk-issuers", type: "HighchartStackedBar",
      props: { chartType: "stacked-bar", panel: true, height: 380, title: "Top 10 issuers by exposure", subtitle: "(Stacked)", binding: riskIssuers, ...PERCENT_CHART },
      layout: { width: "4fr", ...FULL },
    },

    {
      id: "tpl-risk-var", type: "HighchartCombination",
      props: { chartType: "combination", panel: true, height: 400, title: "Value at risk", subtitle: "(Combination)", binding: riskVar, ...PERCENT_CHART, secondaryAxisFormat: "{value}%" },
      layout: { width: "12fr" },
    },
  ],
  aiResponse:
    "Built **Risk Analytics**: a risk summary grid (PV, VaR, IVaR, MVaR and CVaR) that drives the panels below it. Select a row to re-scope the market value, risk contribution, top issuers and value-at-risk charts to it; change **View by** to re-group; change **Currency** to convert. Ask me to swap a chart type, add a panel, or try it in another design system.",
};

/* ══════════════════════════════════════════════════════════════
   Performance Analytics
   ══════════════════════════════════════════════════════════════ */

const PERF_RESULTS = "tpl-perf-results";
const PERF_SELECT = "select:performance";
const PERF_TOTAL = "Total";
const PERF_DIMENSIONS = { Account: "fund", "Asset class": "assetClass", Region: "region" };
const perfScope: BindingFilter = { field: viewBy(PERF_RESULTS, PERF_DIMENSIONS), state: PERF_SELECT, ignore: [PERF_TOTAL] };

const PERIODS: [suffix: string, header: string, feeDrag: number][] = [
  ["1m", "1 Month", 0.05],
  ["3m", "3 Month", 0.15],
  ["Ytd", "YTD", 0.45],
  ["1y", "1 Year", 0.6],
];
const portKeys = PERIODS.map(([s]) => `port${s}`);
const bmkKeys = PERIODS.map(([s]) => `bmk${s}`);
const excessKeys = PERIODS.map(([s]) => `excess${s}`);

/** Returns are stored net of fees. Gross adds each period's fee drag back to
 *  the portfolio (never the benchmark). A secondary or custom benchmark
 *  scales the benchmark; "None" removes benchmark and excess. */
const returnRules: Adjustment[] = [
  { when: { state: FEE_STATE, in: [GROSS] }, offsets: Object.fromEntries(PERIODS.map(([s, , drag]) => [`port${s}`, drag])) },
  { when: { state: BENCHMARK_STATE, in: ["Secondary"] }, scale: { keys: bmkKeys, factor: 0.9 } },
  { when: { state: BENCHMARK_STATE, in: ["Custom"] }, scale: { keys: bmkKeys, factor: 1.08 } },
  { when: { state: BENCHMARK_STATE, in: ["None"] }, omit: [...bmkKeys, ...excessKeys] },
];
const returnMeasures: MeasureSpec[] = [...portKeys, ...bmkKeys].map(weighted);
const excess: ComputedSpec[] = PERIODS.map(([s]) => ({ as: `excess${s}`, op: "diff", of: [`port${s}`, `bmk${s}`] }));

const perfResults: DataBinding = {
  table: "holdings",
  view: "grid",
  groupBy: viewBy(PERF_RESULTS, PERF_DIMENSIONS),
  groupHeader: viewByHeader(PERF_RESULTS, PERF_DIMENSIONS),
  measures: [sum("marketValue"), ...returnMeasures],
  adjustments: returnRules,
  computed: [{ as: "pctTotal", op: "shareOfTotal", of: ["marketValue"] }, ...excess],
  /* Sixteen columns, sized so all four periods fit the full-width panel
     without scrolling sideways; the account column takes what is left. */
  display: [
    money("marketValue", "Market value", { width: 96 }),
    pct("pctTotal", "% of total", { width: 80 }),
    ...PERIODS.flatMap(([s]) => [
      pct(`port${s}`, "Port", { width: 66 }),
      pct(`bmk${s}`, "Bmk", { width: 66 }),
      pct(`excess${s}`, "Excess", { width: 66, signed: true }),
    ]),
  ],
  columnGroups: PERIODS.map(([s, header]) => ({ header, keys: [`port${s}`, `bmk${s}`, `excess${s}`] })),
  groupMinWidth: 180,
  total: PERF_TOTAL,
  selectState: PERF_SELECT,
  /* Total, then each group, then what it holds. Expanded (or "Data level"
     in the panel's configuration) goes down to the securities. */
  hierarchy: ["assetClass", "security"],
  dataLevel: 1,
};

const PERF_BREAKDOWN = "tpl-perf-breakdown";
const BREAKDOWN_DIMENSIONS = { "Asset type": "assetClass", Security: "security", Region: "region" };
const perfBreakdown: DataBinding = {
  table: "holdings",
  view: "grid",
  groupBy: viewBy(PERF_BREAKDOWN, BREAKDOWN_DIMENSIONS),
  groupHeader: viewByHeader(PERF_BREAKDOWN, BREAKDOWN_DIMENSIONS),
  measures: [sum("marketValue"), weighted("port1m"), weighted("portYtd")],
  adjustments: [returnRules[0]],
  display: [
    money("marketValue", "Market value", { width: 96 }),
    pct("port1m", "1M", { width: 64, signed: true }),
    pct("portYtd", "YTD", { width: 70, signed: true }),
  ],
  groupMinWidth: 120,
  total: PERF_TOTAL,
  filters: [perfScope],
};

const perfReturns: DataBinding = {
  table: "holdings",
  view: "matrix",
  measures: returnMeasures,
  adjustments: returnRules,
  computed: excess,
  display: [],
  filters: [perfScope],
  matrix: {
    categories: PERIODS.map(([, header]) => header),
    series: [
      { name: "Portfolio", keys: portKeys },
      { name: "Benchmark", keys: bmkKeys },
      { name: "Excess", keys: excessKeys },
    ],
  },
  /* Expanded: the same returns, account by account and asset class by
     asset class. */
  expanded: {
    table: {
      table: "holdings",
      view: "grid",
      groupBy: "fund",
      groupHeader: "Account",
      measures: returnMeasures,
      adjustments: returnRules,
      computed: excess,
      display: PERIODS.flatMap(([s]) => [
        pct(`port${s}`, "Port", { width: 84 }),
        pct(`bmk${s}`, "Bmk", { width: 84 }),
        pct(`excess${s}`, "Excess", { width: 84, signed: true }),
      ]),
      columnGroups: PERIODS.map(([s, header]) => ({ header, keys: [`port${s}`, `bmk${s}`, `excess${s}`] })),
      total: PERF_TOTAL,
      filters: [perfScope],
      hierarchy: ["assetClass"],
    },
  },
};

const PERF_ALLOCATION = "tpl-perf-allocation";
const ALLOCATION_DIMENSIONS = { "Asset type": "assetClass", Region: "region", Sector: "sector" };
const perfAllocation: DataBinding = {
  table: "holdings",
  view: "parts",
  groupBy: viewBy(PERF_ALLOCATION, ALLOCATION_DIMENSIONS),
  measures: [sum("marketValue")],
  display: [{ key: "marketValue", label: "Market value", money: true }],
  centerMeasure: "marketValue",
  sort: { by: "marketValue", dir: "desc" },
  filters: [perfScope],
  /* Expanded: each slice, then the securities in it, with their returns. */
  expanded: {
    table: {
      table: "holdings",
      view: "grid",
      groupBy: viewBy(PERF_ALLOCATION, ALLOCATION_DIMENSIONS),
      groupHeader: viewByHeader(PERF_ALLOCATION, ALLOCATION_DIMENSIONS),
      measures: [sum("marketValue"), weighted("port1m"), weighted("port3m"), weighted("portYtd"), weighted("port1y")],
      adjustments: [returnRules[0]],
      computed: [{ as: "pctTotal", op: "shareOfTotal", of: ["marketValue"] }],
      display: [
        money("marketValue", "Market value", { width: 120 }),
        pct("pctTotal", "% of total", { width: 96 }),
        ...PERIODS.map(([s, header]) => pct(`port${s}`, header, { width: 96, signed: true })),
      ],
      sort: { by: "marketValue", dir: "desc" },
      total: PERF_TOTAL,
      filters: [perfScope],
      hierarchy: ["security"],
    },
  },
};

const PERF_HISTORY = "tpl-perf-history";
const perfHistory: DataBinding = {
  table: "allocationHistory",
  view: "series",
  groupBy: "period",
  pivotBy: viewBy(PERF_HISTORY, ALLOCATION_DIMENSIONS),
  measures: [sum("marketValue")],
  display: [{ key: "marketValue", label: "Weight" }],
  share: "group",
  filters: [perfScope],
};

const PERF_TREND = "tpl-perf-trend";
const perfTrend: DataBinding = {
  table: "trend",
  view: "series",
  groupBy: "period",
  measures: [weighted("fundReturn"), weighted("benchmarkReturn"), { field: "feeDrag", agg: "avg" }],
  adjustments: [
    { when: { state: FEE_STATE, in: [GROSS] }, computed: [{ as: "fundReturn", op: "sum", of: ["fundReturn", "feeDrag"] }] },
    { when: { state: BENCHMARK_STATE, in: ["Secondary"] }, scale: { keys: ["benchmarkReturn"], factor: 0.9 } },
    { when: { state: BENCHMARK_STATE, in: ["Custom"] }, scale: { keys: ["benchmarkReturn"], factor: 1.08 } },
    { when: { state: BENCHMARK_STATE, in: ["None"] }, omit: ["benchmarkReturn", "excess"] },
    { when: { state: viewByStateKey(PERF_TREND), in: ["Fund"] }, omit: ["benchmarkReturn"] },
    { when: { state: viewByStateKey(PERF_TREND), in: ["Benchmark"] }, omit: ["fundReturn"] },
  ],
  computed: [{ as: "excess", op: "diff", of: ["fundReturn", "benchmarkReturn"] }],
  display: [
    { key: "fundReturn", label: "Fund", style: { type: "column" } },
    { key: "benchmarkReturn", label: "Benchmark", style: { type: "column" } },
    { key: "excess", label: "Excess", style: { type: "line" } },
  ],
  filters: [{ field: "periodicity", state: PERIODICITY_STATE, fallback: "Monthly" }, perfScope],
};

export const performanceAnalytics: BuilderTemplate = {
  id: "performance-analytics",
  label: "Performance Analytics",
  desc: "Multi-period results driving returns, allocation and trend charts",
  icon: "trending_up",
  category: "finance",
  uniformStructure: true,
  datasetId: FINANCE_DATASET_ID,
  interfaceType: "dashboard",
  selectedComponents: ["table", "inputs"],
  zoneLayouts: { body: BODY_LAYOUT, ...CHROME_LAYOUTS },
  ...chrome("perf", "Performance", [
    filter("Fee type", FEE_STATE, "Net of fees", ["Net of fees", GROSS]),
    filter("Currency", "currency", "GBP", CURRENCIES),
    filter("Periodicity", PERIODICITY_STATE, "Monthly", PERIODICITIES),
    filter("Benchmark", BENCHMARK_STATE, "Primary", ["Primary", "Secondary", "Custom", "None"]),
  ]),
  body: [
    {
      id: PERF_RESULTS, type: "DataGrid",
      props: { title: "Performance results", subtitle: AS_OF, height: 572, viewBy: Object.keys(PERF_DIMENSIONS), binding: perfResults },
      layout: { width: "12fr" },
    },

    {
      id: PERF_BREAKDOWN, type: "DataGrid",
      props: { title: "Breakdown", height: 360, viewBy: Object.keys(BREAKDOWN_DIMENSIONS), binding: perfBreakdown },
      layout: { width: "4fr", ...HALF },
    },
    {
      id: "tpl-perf-returns", type: "HighchartColumn",
      props: { chartType: "column", panel: true, height: 360, title: "Returns", subtitle: "(Clustered)", binding: perfReturns, ...PERCENT_CHART },
      layout: { width: "4fr", ...HALF },
    },
    {
      id: PERF_ALLOCATION, type: "HighchartDonut",
      props: { chartType: "donut", panel: true, height: 360, title: "Allocation", viewBy: Object.keys(ALLOCATION_DIMENSIONS), binding: perfAllocation },
      layout: { width: "4fr", ...HALF },
    },

    {
      id: PERF_HISTORY, type: "HighchartStackedArea",
      props: { chartType: "stacked-area", panel: true, height: 360, title: "Allocation history", viewBy: Object.keys(ALLOCATION_DIMENSIONS), binding: perfHistory, ...SHARE_CHART },
      layout: { width: "6fr", ...HALF },
    },
    {
      id: PERF_TREND, type: "HighchartCombination",
      props: { chartType: "combination", panel: true, height: 360, title: "Investment trend", viewBy: ["All", "Fund", "Benchmark"], binding: perfTrend, ...PERCENT_CHART },
      layout: { width: "6fr", ...FULL },
    },
  ],
  aiResponse:
    "Built **Performance Analytics**: a multi-period results grid that drives the panels below it. Select a row to re-scope returns, allocation and trend to it; **Fee type**, **Benchmark**, **Periodicity** and **Currency** re-derive the numbers; each panel's **View by** re-groups. Ask me to swap a chart type, add a panel, or try it in another design system.",
};
