/**
 * sustainableTemplates - the Sustainable Investment reports as builder
 * templates: ESG Analytics, Climate Analytics, Screening, Screening Changes.
 *
 * Same rules as financeTemplates.ts: one DS-agnostic block list per template,
 * every block with an explicit height, a 12-column body. They share the
 * finance chrome (dark two-bar header) and add the section's left sidebar.
 *
 * Every chart and grid is BOUND to the `sustainable` sample dataset
 * (reportData/sustainableDataset.ts): a filter, a "View by" or a selected
 * row re-derives the panels from the same security-level rows, and an
 * uploaded workbook redraws the report.
 */

import type { Block } from "@/store/useBuilder";
import type { BuilderTemplate } from "./builderTemplates";
import {
  AS_OF,
  BODY_LAYOUT,
  CONTEXT_ROW_HEIGHT,
  CURRENCIES,
  FINANCE_BRAND,
  FULL,
  HALF,
  PERCENT_CHART,
  WORKSPACES,
  filter,
  sum,
  viewBy,
  viewByHeader,
  weighted,
} from "./financeTemplates";
import type { GridCell } from "./dataGridModel";
import type { RecordBinding } from "./recordPanelModel";
import type { BindingFilter, BoundMeasure, DataBinding, RecordColumn } from "./reportData/binding";
import { SI_MONTHS, SI_PERIODICITIES, SUSTAINABLE_DATASET_ID } from "./reportData/sustainableDataset";

const TITLE = "Sustainable Investment";
const PERIODICITY_STATE = "periodicity";

/* ── Chrome: the finance header, plus the section's sidebar ── */
const PAGES: [group: string, label: string, icon: string][] = [
  ["Portfolio", "ESG", "shield"],
  ["Portfolio", "Climate", "trending_up"],
  ["Screening", "Screening", "filter"],
  ["Screening", "Changes", "layers"],
];

const chrome = (prefix: string, activePage: string) => {
  const sidebar: Block[] = [];
  let group = "";
  PAGES.forEach(([g, label, icon], i) => {
    if (g !== group) {
      group = g;
      sidebar.push({ id: `tpl-${prefix}-group-${g.toLowerCase()}`, type: "NavGroup", props: { label: g } });
    }
    sidebar.push({ id: `tpl-${prefix}-nav-${i}`, type: "NavItem", props: { label, icon, active: label === activePage } });
  });
  return {
    header: [
      {
        id: `tpl-${prefix}-topnav`, type: "TopNav",
        props: { brand: FINANCE_BRAND, linksCsv: "Manager, Solutions, Apps, Resources", active: "Manager", chevrons: true, account: "", tone: "dark" },
      },
      {
        id: `tpl-${prefix}-tabs`, type: "TabStrip",
        props: { label: "Workspaces", tabsCsv: WORKSPACES, active: TITLE, addButton: true, tone: "dark" },
      },
    ] as Block[],
    sidebar,
    footer: [] as Block[],
  };
};

const CHROME_LAYOUTS = {
  header: { mode: "stack", gap: 0, flush: true, tone: "dark" },
  sidebar: { mode: "stack", gap: 2, align: "stretch" },
  footer: { mode: "row", gap: 8, wrap: false, align: "center", visible: false },
} as const;

/* ── Cells and measures ── */
const HEAT: GridCell = { type: "heat" };
/** Implied temperature: cooler is better. */
const TEMPERATURE: GridCell = { type: "heat", thresholds: [{ min: 2.5, tone: "bad" }, { min: 2, tone: "mid" }, { tone: "good" }] };

const score = (key: string, label: string, extra: Partial<BoundMeasure> = {}): BoundMeasure => ({ key, label, kind: "number", decimals: 2, width: 56, cell: HEAT, ...extra });
const money = (key: string, label: string, extra: Partial<BoundMeasure> = {}): BoundMeasure => ({ key, label, kind: "currency", compact: true, money: true, width: 96, ...extra });
const count = (key: string, label: string, extra: Partial<BoundMeasure> = {}): BoundMeasure => ({ key, label, kind: "number", decimals: 0, width: 84, ...extra });
const tonnes = (key: string, label: string, extra: Partial<BoundMeasure> = {}): BoundMeasure => ({ key, label, kind: "number", decimals: 2, compact: true, width: 104, ...extra });
const weightBar = (label = "Weight %"): BoundMeasure => ({ key: "weight", label, kind: "percent", decimals: 1, width: 112, cell: { type: "bar", scale: "columnMax", tone: "accent" } });

const SCORE_CHART = { yAxisMax: 10, valueDecimals: 2 };
const TONNES_CHART = { valueDecimals: 0, valueSuffix: " tCO2e" };

/* ══════════════════════════════════════════════════════════════
   ESG Analytics
   ══════════════════════════════════════════════════════════════ */

const ESG_SUMMARY = "tpl-esg-summary";
const ESG_SELECT = "select:esg";
const TOTAL = "Total";
const ESG_DIMENSIONS = { Account: "account", "Asset class": "assetClass", Sector: "sector", Issuer: "issuer" };
/** Re-scope a panel to the row selected in the summary grid. */
const esgScope: BindingFilter = { field: viewBy(ESG_SUMMARY, ESG_DIMENSIONS), state: ESG_SELECT, ignore: [TOTAL] };

const esgSummary: DataBinding = {
  table: "securities",
  view: "grid",
  groupBy: viewBy(ESG_SUMMARY, ESG_DIMENSIONS),
  groupHeader: viewByHeader(ESG_SUMMARY, ESG_DIMENSIONS),
  measures: [
    sum("marketValue"), sum("coveredMv"), sum("nav"), sum("positions"), sum("issuers"),
    weighted("keyIssue"), weighted("corpScore"), weighted("envScore"), weighted("socScore"), weighted("govScore"),
  ],
  display: [
    money("marketValue", "Market value"),
    money("coveredMv", "Covered"),
    money("nav", "NAV"),
    count("positions", "Positions"),
    count("issuers", "Issuers"),
    score("keyIssue", "Key issue", { cell: undefined, width: 84 }),
    score("corpScore", "Corporate", { width: 84 }),
    score("envScore", "E", { width: 72 }),
    score("socScore", "S", { width: 72 }),
    score("govScore", "G", { width: 72 }),
  ],
  columnGroups: [
    { header: "Value", keys: ["marketValue", "coveredMv", "nav"] },
    { header: "Holdings", keys: ["positions", "issuers"] },
    { header: "Scores", keys: ["keyIssue", "corpScore"] },
    { header: "Pillar scores", keys: ["envScore", "socScore", "govScore"] },
  ],
  sort: { by: "marketValue", dir: "desc" },
  limit: 8,
  groupMinWidth: 150,
  total: TOTAL,
  selectState: ESG_SELECT,
  selectClears: [TOTAL],
};

const gauge = (id: string, title: string, field: string, color: string): Block => ({
  id, type: "HighchartGauge",
  props: {
    chartType: "gauge", panel: true, height: 220, title, valueMax: 10, valueDecimals: 2, pointColors: [color],
    binding: { table: "securities", view: "value", measures: [weighted(field)], display: [{ key: field, label: title }], filters: [esgScope] } satisfies DataBinding,
  },
  layout: { width: "2fr", spanTablet: 3, spanPhone: 6 },
});

const esgRatings: DataBinding = {
  table: "securities",
  view: "series",
  groupBy: "rating",
  measures: [sum("marketValue"), { field: "ratingRank", agg: "avg" }],
  display: [{ key: "marketValue", label: "Distribution" }],
  share: "total",
  sort: { by: "ratingRank", dir: "asc" },
  filters: [esgScope],
};
/** Rating buckets by name, so a distribution that misses a bucket keeps its colours. */
const RATING_COLORS = { AAA: "good", AA: "good", A: "good", BBB: "mid", BB: "mid", B: "bad", CCC: "bad" };

const ESG_BREAKDOWN = "tpl-esg-breakdown";
const ESG_BREAKDOWN_DIMENSIONS = { Sector: "sector", Industry: "industry", Region: "region", "Asset class": "assetClass" };
const esgBreakdown: DataBinding = {
  table: "securities",
  view: "grid",
  groupBy: viewBy(ESG_BREAKDOWN, ESG_BREAKDOWN_DIMENSIONS),
  groupHeader: viewByHeader(ESG_BREAKDOWN, ESG_BREAKDOWN_DIMENSIONS),
  measures: [sum("weight"), weighted("keyIssue"), weighted("envScore"), weighted("socScore"), weighted("govScore")],
  display: [weightBar(), score("keyIssue", "Wtd avg", { cell: undefined, width: 72 }), score("envScore", "E"), score("socScore", "S"), score("govScore", "G")],
  sort: { by: "weight", dir: "desc" },
  limit: 9,
  groupMinWidth: 110,
  filters: [esgScope],
};

const esgTrend: DataBinding = {
  table: "esgTrend",
  view: "series",
  groupBy: "period",
  measures: [weighted("envScore"), weighted("socScore"), weighted("govScore"), weighted("esgScore"), { field: "order", agg: "avg" }],
  display: [
    { key: "envScore", label: "E", style: { type: "column" } },
    { key: "socScore", label: "S", style: { type: "column" } },
    { key: "govScore", label: "G", style: { type: "column" } },
    { key: "esgScore", label: "ESG", style: { type: "spline" } },
  ],
  sort: { by: "order", dir: "asc" },
  filters: [{ field: "periodicity", state: PERIODICITY_STATE, fallback: "Monthly" }, esgScope],
};

const contributors = (groupBy: string, dir: "asc" | "desc", display: BoundMeasure[]): DataBinding => ({
  table: "securities",
  view: "grid",
  groupBy,
  rank: true,
  measures: [
    sum("weight"), weighted("keyIssue"), weighted("envScore"), weighted("socScore"), weighted("govScore"),
    weighted("relKeyIssue"), weighted("relEnv"), weighted("relSoc"), weighted("relGov"),
  ],
  display,
  sort: { by: "relKeyIssue", dir },
  limit: 10,
  groupMinWidth: 110,
  filters: [esgScope],
});
const WEIGHT: BoundMeasure = { key: "weight", label: "Weight %", kind: "percent", decimals: 2, width: 74 };
const rel = (key: string, label: string): BoundMeasure => ({ key, label, kind: "number", decimals: 2, signed: true, width: 56 });

export const esgAnalytics: BuilderTemplate = {
  id: "esg-analytics",
  label: "ESG Analytics",
  desc: "ESG summary grid that drives score gauges, a rating distribution, a pillar trend and contributor rankings",
  icon: "eco",
  category: "finance",
  uniformStructure: true,
  datasetId: SUSTAINABLE_DATASET_ID,
  interfaceType: "dashboard",
  selectedComponents: ["table", "inputs"],
  zoneLayouts: { body: BODY_LAYOUT, ...CHROME_LAYOUTS },
  ...chrome("esg", "ESG"),
  body: [
    { id: "tpl-esg-title", type: "PageTitle", props: { text: TITLE }, layout: { width: "6fr", height: CONTEXT_ROW_HEIGHT, align: "center", ...FULL } },
    filter("tpl-esg-currency", "Currency", "currency", "GBP", CURRENCIES, "3fr", { spanTablet: 6, spanPhone: 6 }),
    filter("tpl-esg-periodicity", "Periodicity", PERIODICITY_STATE, "Monthly", SI_PERIODICITIES, "3fr", { spanTablet: 6, spanPhone: 6 }),

    {
      id: ESG_SUMMARY, type: "DataGrid",
      props: { title: "Summary", subtitle: AS_OF, height: 300, viewBy: Object.keys(ESG_DIMENSIONS), binding: esgSummary },
      layout: { width: "12fr" },
    },

    gauge("tpl-esg-gauge-esg", "ESG score", "keyIssue", "accent"),
    gauge("tpl-esg-gauge-e", "E score", "envScore", "good"),
    gauge("tpl-esg-gauge-s", "S score", "socScore", "accent"),
    gauge("tpl-esg-gauge-g", "G score", "govScore", "mid"),
    {
      id: "tpl-esg-ratings", type: "HighchartColumn",
      props: { chartType: "column", panel: true, height: 220, title: "Rating distribution", legend: false, binding: esgRatings, pointColorsByName: RATING_COLORS, ...PERCENT_CHART, valueDecimals: 1 },
      layout: { width: "4fr", ...FULL },
    },

    {
      id: ESG_BREAKDOWN, type: "DataGrid",
      props: { title: "Dimension breakdown", height: 400, viewBy: Object.keys(ESG_BREAKDOWN_DIMENSIONS), binding: esgBreakdown },
      layout: { width: "6fr", ...FULL },
    },
    {
      id: "tpl-esg-trend", type: "HighchartCombination",
      props: { chartType: "combination", panel: true, height: 400, title: "ESG trend", subtitle: "(Clustered)", binding: esgTrend, ...SCORE_CHART },
      layout: { width: "6fr", ...FULL },
    },

    {
      id: "tpl-esg-top", type: "DataGrid",
      props: {
        title: "Top relative contributors", subtitle: "by issuer", height: 432,
        binding: contributors("issuer", "desc", [WEIGHT, score("keyIssue", "Key issue", { cell: undefined, width: 72 }), score("envScore", "E"), score("socScore", "S"), score("govScore", "G")]),
      },
      layout: { width: "6fr", ...FULL },
    },
    {
      id: "tpl-esg-bottom", type: "DataGrid",
      props: {
        title: "Bottom relative contributors", subtitle: "by sector, vs portfolio", height: 432,
        binding: contributors("sector", "asc", [WEIGHT, { ...rel("relKeyIssue", "Key issue"), width: 72 }, rel("relEnv", "E"), rel("relSoc", "S"), rel("relGov", "G")]),
      },
      layout: { width: "6fr", ...FULL },
    },
  ],
  aiResponse:
    "Built **ESG Analytics**: select a row in the summary to re-scope the gauges, rating distribution, trend and rankings to it. **Periodicity** changes the trend's horizon, **Currency** the money columns, and each grid's **View by** re-groups it. Ask me to swap a panel, add one, or try another design system.",
};

/* ══════════════════════════════════════════════════════════════
   Climate Analytics
   ══════════════════════════════════════════════════════════════ */

const CLIMATE_SUMMARY = "tpl-climate-summary";
const CLIMATE_SELECT = "select:climate";
const CLIMATE_DIMENSIONS = { Account: "account", "Asset class": "assetClass", Issuer: "issuer", Sector: "sector" };
const climateScope: BindingFilter = { field: viewBy(CLIMATE_SUMMARY, CLIMATE_DIMENSIONS), state: CLIMATE_SELECT, ignore: [TOTAL] };
const CHART_DIMENSIONS = { "Asset class": "assetClass", Sector: "sector", Region: "region" };

const climateSummary: DataBinding = {
  table: "securities",
  view: "grid",
  groupBy: viewBy(CLIMATE_SUMMARY, CLIMATE_DIMENSIONS),
  groupHeader: viewByHeader(CLIMATE_SUMMARY, CLIMATE_DIMENSIONS),
  measures: [
    sum("marketValue"), sum("coveredMv"), sum("totalScope12"), sum("scope3"),
    weighted("intensityEvic"), weighted("intensityRev"), weighted("temperature"), weighted("envScore"), weighted("carbonCoverage"),
  ],
  display: [
    money("marketValue", "Market value"),
    money("coveredMv", "Covered"),
    tonnes("totalScope12", "Scope 1 & 2"),
    tonnes("scope3", "Scope 3", { width: 96 }),
    { key: "intensityEvic", label: "EVIC", kind: "number", decimals: 1, width: 88 },
    { key: "intensityRev", label: "Revenue", kind: "number", decimals: 1, width: 88 },
    { key: "temperature", label: "Implied °C", kind: "number", decimals: 1, width: 88, cell: TEMPERATURE },
    score("envScore", "E score", { decimals: 1, width: 76 }),
    { key: "carbonCoverage", label: "Coverage", kind: "percent", decimals: 1, width: 84 },
  ],
  columnGroups: [
    { header: "Market value", keys: ["marketValue", "coveredMv"] },
    { header: "Emissions (tCO2e)", keys: ["totalScope12", "scope3"] },
    { header: "Scope 1 & 2 intensity", keys: ["intensityEvic", "intensityRev"] },
    { header: "Alignment", keys: ["temperature", "envScore", "carbonCoverage"] },
  ],
  sort: { by: "marketValue", dir: "desc" },
  limit: 8,
  groupMinWidth: 150,
  total: TOTAL,
  selectState: CLIMATE_SELECT,
  selectClears: [TOTAL],
};

const climateAlignment: DataBinding = {
  table: "securities", view: "series", groupBy: "alignment",
  measures: [sum("marketValue"), { field: "alignmentRank", agg: "avg" }],
  display: [{ key: "marketValue", label: "Alignment" }],
  share: "total",
  sort: { by: "alignmentRank", dir: "asc" },
  filters: [climateScope],
};

const CLIMATE_EMISSIONS = "tpl-climate-emissions";
const climateEmissions: DataBinding = {
  table: "securities", view: "series",
  groupBy: viewBy(CLIMATE_EMISSIONS, CHART_DIMENSIONS),
  measures: [sum("scope1"), sum("scope2"), sum("scope3")],
  display: [{ key: "scope1", label: "Scope 1" }, { key: "scope2", label: "Scope 2" }, { key: "scope3", label: "Scope 3" }],
  sort: { by: "scope1", dir: "desc" },
  limit: 5,
  filters: [climateScope],
};

const CLIMATE_INTENSITY = "tpl-climate-intensity";
const climateIntensity: DataBinding = {
  table: "securities", view: "series",
  groupBy: viewBy(CLIMATE_INTENSITY, CHART_DIMENSIONS),
  measures: [weighted("intensityEvic")],
  display: [{ key: "intensityEvic", label: "Intensity (EVIC)" }],
  sort: { by: "intensityEvic", dir: "desc" },
  limit: 5,
  filters: [climateScope],
};

const emissionsShare = (blockId: string, dimensions: Record<string, string>): DataBinding => ({
  table: "securities", view: "parts",
  groupBy: viewBy(blockId, dimensions),
  measures: [sum("totalScope12")],
  display: [{ key: "totalScope12", label: "Scope 1 & 2 emissions" }],
  centerMeasure: "totalScope12",
  sort: { by: "totalScope12", dir: "desc" },
  limit: 8,
  filters: [climateScope],
});
const CLIMATE_CONTRIBUTION = "tpl-climate-contribution";
const CLIMATE_TOTAL = "tpl-climate-total";

const CLIMATE_BREAKDOWN = "tpl-climate-breakdown";
const CLIMATE_BREAKDOWN_DIMENSIONS = { Sector: "sector", "Asset class": "assetClass", Issuer: "issuer" };
const climateBreakdown: DataBinding = {
  table: "securities", view: "grid",
  groupBy: viewBy(CLIMATE_BREAKDOWN, CLIMATE_BREAKDOWN_DIMENSIONS),
  groupHeader: viewByHeader(CLIMATE_BREAKDOWN, CLIMATE_BREAKDOWN_DIMENSIONS),
  measures: [sum("weight"), sum("totalScope12"), weighted("intensityEvic"), weighted("intensityRev"), weighted("envScore")],
  display: [
    weightBar("Weight"),
    tonnes("totalScope12", "Scope 1 & 2", { width: 96 }),
    { key: "intensityEvic", label: "EVIC", kind: "number", decimals: 1, width: 72 },
    { key: "intensityRev", label: "Revenue", kind: "number", decimals: 1, width: 80 },
    score("envScore", "E", { decimals: 1, width: 60 }),
  ],
  sort: { by: "weight", dir: "desc" },
  limit: 9,
  groupMinWidth: 120,
  filters: [climateScope],
};

const CLIMATE_TOP = "tpl-climate-top";
const CLIMATE_TOP_DIMENSIONS = { Issuer: "issuer", Sector: "sector", "Asset class": "assetClass" };
const climateTop: DataBinding = {
  table: "securities", view: "grid",
  groupBy: viewBy(CLIMATE_TOP, CLIMATE_TOP_DIMENSIONS),
  groupHeader: viewByHeader(CLIMATE_TOP, CLIMATE_TOP_DIMENSIONS),
  rank: true,
  measures: [sum("weight"), weighted("intensityEvic")],
  display: [WEIGHT, { key: "intensityEvic", label: "Carbon intensity (scope 1 & 2)", kind: "number", decimals: 1, width: 210 }],
  sort: { by: "intensityEvic", dir: "desc" },
  limit: 10,
  groupMinWidth: 150,
  filters: [climateScope],
};

const climateContributors: DataBinding = {
  table: "securities", view: "series", groupBy: "issuer",
  measures: [sum("totalScope12")],
  display: [{ key: "totalScope12", label: "Share of scope 1 & 2" }],
  share: "total",
  sort: { by: "totalScope12", dir: "desc" },
  limit: 10,
  filters: [climateScope],
};

const QUARTER = { width: "3fr" as const, ...HALF };

export const climateAnalytics: BuilderTemplate = {
  id: "climate-analytics",
  label: "Climate Analytics",
  desc: "Emissions summary grid that drives alignment, emissions, intensity and contribution charts, with carbon rankings",
  icon: "thermostat",
  category: "finance",
  uniformStructure: true,
  datasetId: SUSTAINABLE_DATASET_ID,
  interfaceType: "dashboard",
  selectedComponents: ["table", "inputs"],
  zoneLayouts: { body: BODY_LAYOUT, ...CHROME_LAYOUTS },
  ...chrome("climate", "Climate"),
  body: [
    { id: "tpl-climate-title", type: "PageTitle", props: { text: TITLE }, layout: { width: "9fr", height: CONTEXT_ROW_HEIGHT, align: "center", spanTablet: 8, spanPhone: 12 } },
    filter("tpl-climate-currency", "Currency", "currency", "GBP", CURRENCIES, "3fr", { spanTablet: 4, spanPhone: 12 }),

    {
      id: CLIMATE_SUMMARY, type: "DataGrid",
      props: { title: "Summary", subtitle: AS_OF, height: 300, viewBy: Object.keys(CLIMATE_DIMENSIONS), binding: climateSummary },
      layout: { width: "12fr" },
    },

    {
      id: "tpl-climate-alignment", type: "HighchartBar",
      props: { chartType: "bar", panel: true, height: 340, title: "Alignment", legend: false, binding: climateAlignment, ...PERCENT_CHART, valueDecimals: 1 },
      layout: QUARTER,
    },
    {
      id: CLIMATE_EMISSIONS, type: "HighchartStackedColumn",
      props: { chartType: "stacked-column", panel: true, height: 340, title: "Emissions", labelWrap: true, viewBy: Object.keys(CHART_DIMENSIONS), binding: climateEmissions, ...TONNES_CHART },
      layout: QUARTER,
    },
    {
      id: CLIMATE_INTENSITY, type: "HighchartColumn",
      props: { chartType: "column", panel: true, height: 340, title: "Intensity", labelWrap: true, viewBy: Object.keys(CHART_DIMENSIONS), legend: false, binding: climateIntensity, valueDecimals: 1 },
      layout: QUARTER,
    },
    {
      id: CLIMATE_CONTRIBUTION, type: "HighchartDonut",
      props: { chartType: "donut", panel: true, height: 340, title: "Contribution", viewBy: Object.keys(CHART_DIMENSIONS), binding: emissionsShare(CLIMATE_CONTRIBUTION, CHART_DIMENSIONS) },
      layout: QUARTER,
    },

    {
      id: CLIMATE_BREAKDOWN, type: "DataGrid",
      props: { title: "Dimension breakdown", height: 400, viewBy: Object.keys(CLIMATE_BREAKDOWN_DIMENSIONS), binding: climateBreakdown },
      layout: { width: "7fr", ...FULL },
    },
    {
      id: CLIMATE_TOTAL, type: "HighchartDonut",
      props: { chartType: "donut", panel: true, height: 400, title: "Scope 1 & 2 emissions", subtitle: "(tCO2e)", viewBy: Object.keys(CLIMATE_BREAKDOWN_DIMENSIONS), binding: emissionsShare(CLIMATE_TOTAL, CLIMATE_BREAKDOWN_DIMENSIONS) },
      layout: { width: "5fr", ...FULL },
    },

    {
      id: CLIMATE_TOP, type: "DataGrid",
      props: { title: "Top carbon intensity", height: 432, viewBy: Object.keys(CLIMATE_TOP_DIMENSIONS), binding: climateTop },
      layout: { width: "6fr", ...FULL },
    },
    {
      id: "tpl-climate-contributors", type: "HighchartColumn",
      props: { chartType: "column", panel: true, height: 432, title: "Top contributors to scope 1 & 2", subtitle: "(Column)", legend: false, binding: climateContributors, ...PERCENT_CHART, valueDecimals: 1 },
      layout: { width: "6fr", ...FULL },
    },
  ],
  aiResponse:
    "Built **Climate Analytics**: select a row in the summary to re-scope every chart and ranking to it. Each panel's **View by** re-groups it; **Currency** converts the money columns. Ask me to swap a chart type, add a panel, or try another design system.",
};

/* ══════════════════════════════════════════════════════════════
   Screening and Screening Changes
   ══════════════════════════════════════════════════════════════ */

const STAGE_SELECT = "select:stage";
const SECURITY_SELECT = "select:security";
const UNIVERSE = "Universe";

const screeningFunnel: DataBinding = {
  table: "screeningFunnel",
  view: "parts",
  groupBy: "step",
  measures: [sum("securities"), { field: "order", agg: "avg" }],
  display: [{ key: "securities", label: "Securities" }],
  sort: { by: "order", dir: "asc" },
  signedParts: true,
  sumPart: "Target Fund",
  selectState: STAGE_SELECT,
  selectClears: [UNIVERSE],
};

const FLAG: GridCell = { type: "flag" };
const universeColumns: RecordColumn[] = [
  { field: "security", label: "Security name", minWidth: 190 },
  { field: "country", label: "Country of risk", width: 124, cell: FLAG },
  { field: "instrumentGroup", label: "Instrument group", width: 150 },
  { field: "sector", label: "Sector", width: 180 },
  { field: "entity", label: "Entity name", width: 150 },
];
const screeningUniverse: DataBinding = {
  table: "securities",
  view: "records",
  measures: [],
  display: [],
  records: universeColumns,
  filters: [{ field: "stage", state: STAGE_SELECT, ignore: [UNIVERSE] }],
  sort: { by: "security", dir: "asc" },
  selectState: SECURITY_SELECT,
};

const PERIOD_COLUMNS = ["January", "September"];
const securityDetail: RecordBinding = {
  table: "securities",
  keyField: "security",
  state: SECURITY_SELECT,
  sections: [
    {
      type: "pairs",
      items: [
        { label: "Country of risk", field: "country", as: "flag" },
        { label: "Sector", field: "sector" },
        { label: "Entity", field: "entity" },
        { label: "Ticker", field: "ticker" },
        { label: "ESG rating", field: "rating", as: "badge" },
        { label: "Market value", field: "marketValue", kind: "currency", compact: true, money: true },
      ],
    },
    {
      type: "table", title: "Climate (tCO2e)", columns: PERIOD_COLUMNS,
      rows: [{ label: "Scope 1 emissions", fields: ["scope1Start", "scope1"], change: { from: "scope1Start", to: "scope1", upIsGood: false } }],
    },
    {
      type: "table", title: "ESG scores", columns: PERIOD_COLUMNS, decimals: 2,
      rows: [
        { label: "Corporate", fields: ["corpStart", "corpScore"], change: { from: "corpStart", to: "corpScore" } },
        { label: "Environmental", fields: ["eScoreStart", "envScore"], change: { from: "eScoreStart", to: "envScore" } },
        { label: "Social", fields: ["socStart", "socScore"], change: { from: "socStart", to: "socScore" } },
        { label: "Governance", fields: ["govStart", "govScore"], change: { from: "govStart", to: "govScore" } },
      ],
    },
    { type: "trend", title: "Scope 1 emissions", field: "scope1Trend", categories: [...SI_MONTHS], seriesName: "Scope 1 (tCO2e)" },
  ],
};

const detailPanel = (id: string, height: number, width: `${number}fr` = "4fr"): Block => ({
  id, type: "RecordPanel",
  props: { title: "Security detail", height, emptyText: "Select a security to see its flags, emissions and scores.", binding: securityDetail },
  layout: { width, ...FULL },
});

export const screening: BuilderTemplate = {
  id: "screening",
  label: "Screening",
  desc: "Screening waterfall that filters the security universe, with a detail panel for the selected security",
  icon: "filter_alt",
  category: "finance",
  uniformStructure: true,
  datasetId: SUSTAINABLE_DATASET_ID,
  interfaceType: "dashboard",
  selectedComponents: ["table"],
  zoneLayouts: { body: BODY_LAYOUT, ...CHROME_LAYOUTS },
  ...chrome("screening", "Screening"),
  body: [
    { id: "tpl-screening-title", type: "PageTitle", props: { text: TITLE }, layout: { width: "12fr", height: CONTEXT_ROW_HEIGHT, align: "center" } },
    {
      id: "tpl-screening-funnel", type: "HighchartWaterfall",
      props: { chartType: "waterfall", panel: true, height: 360, title: "Screening summary", subtitle: "(Waterfall)", binding: screeningFunnel, valueDecimals: 0 },
      layout: { width: "12fr" },
    },
    {
      id: "tpl-screening-universe", type: "DataGrid",
      props: { title: "Universe details", height: 460, binding: screeningUniverse },
      layout: { width: "8fr", ...FULL },
    },
    detailPanel("tpl-screening-detail", 460),
  ],
  aiResponse:
    "Built **Screening**: click a bar of the waterfall to list the securities that screen removed (click **Universe** to see them all), and click a security to open its detail. Ask me to add a panel or try another design system.",
};

const chip = (upIsGood = true): GridCell => ({ type: "deltaChip", upIsGood });
const changesColumns: RecordColumn[] = [
  /* Sized to fit the full-width panel without scrolling sideways, with room
     for the vertical scrollbar. */
  { field: "security", label: "Security name", minWidth: 140 },
  { field: "country", label: "Country", width: 72, cell: FLAG },
  { field: "sector", label: "Sector", width: 116 },
  { field: "posFlag", label: "Positive", kind: "number", decimals: 0, width: 66, cell: chip() },
  { field: "negFlag", label: "Negative", kind: "number", decimals: 0, width: 68, cell: chip() },
  { field: "controversy", label: "Controv.", kind: "number", decimals: 0, width: 68, cell: chip(false) },
  { field: "scope1", label: "Value", kind: "number", decimals: 0, width: 62 },
  { field: "scope1Pct", label: "Change", kind: "percent", decimals: 1, width: 124, cell: { type: "delta", upIsGood: false, sparkField: "scope1Trend" } },
  { field: "ratingStart", label: "Start", width: 48, cell: { type: "badge" } },
  { field: "rating", label: "End", width: 48, cell: { type: "badge" } },
  { field: "ratingMove", label: "Movement", width: 94, cell: { type: "toneText", tones: { Upgraded: "good", Downgraded: "bad" } } },
  { field: "envScore", label: "Value", kind: "number", decimals: 2, width: 56, cell: HEAT },
  { field: "eTrend", label: "Trend", width: 68, cell: { type: "sparkline", tone: "accent" } },
];
const screeningChanges: DataBinding = {
  table: "securities",
  view: "records",
  measures: [],
  display: [],
  records: changesColumns,
  columnGroups: [
    { header: "Overall flags", keys: ["posFlag", "negFlag"] },
    { header: "Scope 1 emissions", keys: ["scope1", "scope1Pct"] },
    { header: "ESG rating", keys: ["ratingStart", "rating", "ratingMove"] },
    { header: "E score", keys: ["envScore", "eTrend"] },
  ],
  sort: { by: "security", dir: "asc" },
  selectState: SECURITY_SELECT,
};

export const screeningChangesTemplate: BuilderTemplate = {
  id: "screening-changes",
  label: "Screening Changes",
  desc: "Period-change grid with flag chips, emissions sparklines and rating badges, with a security detail panel",
  icon: "compare_arrows",
  category: "finance",
  uniformStructure: true,
  datasetId: SUSTAINABLE_DATASET_ID,
  interfaceType: "dashboard",
  selectedComponents: ["table"],
  zoneLayouts: { body: BODY_LAYOUT, ...CHROME_LAYOUTS },
  ...chrome("changes", "Changes"),
  body: [
    { id: "tpl-changes-title", type: "PageTitle", props: { text: TITLE }, layout: { width: "12fr", height: CONTEXT_ROW_HEIGHT, align: "center" } },
    {
      id: "tpl-changes-grid", type: "DataGrid",
      props: { title: "Changes", subtitle: "January to September", height: 480, binding: screeningChanges },
      layout: { width: "12fr" },
    },
    /* Under the grid, full width: its sections sit side by side. */
    detailPanel("tpl-changes-detail", 300, "12fr"),
  ],
  aiResponse:
    "Built **Screening Changes**: each row shows what changed for a security over the period - flags, scope 1 emissions, ESG rating and E score. Click a security to open its detail. Ask me to add a panel or try another design system.",
};
