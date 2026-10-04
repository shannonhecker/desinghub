/**
 * issuerTemplates - the issuer-level reports, the governance scorecard and
 * the home page as builder templates: Issuer Climate, Issuer Business
 * Involvement, Issuer Controversies, Entity Comparison, Governance
 * Scorecard, Analytics Home.
 *
 * Same rules as the other finance templates: one DS-agnostic block list
 * each, every block with an explicit height, a 12-column body, bound to a
 * sample dataset (`issuer`). The issuer shown is report state: the "Entity"
 * filter sets it, and every panel reads its rows.
 */

import type { Block } from "@/store/useBuilder";
import type { BuilderTemplate } from "./builderTemplates";
import { BODY_LAYOUT, CONTEXT_ROW_HEIGHT, FINANCE_BRAND, FULL, HALF, WORKSPACES, filter } from "./financeTemplates";
import { SI_CHROME_LAYOUTS, SI_TITLE, siChrome } from "./sustainableTemplates";
import type { GridCell, GridTone } from "./dataGridModel";
import { viewByStateKey } from "./panelMetrics";
import type { RecordBinding, RowLookup } from "./recordPanelModel";
import type { BindingFilter, DataBinding, RecordColumn } from "./reportData/binding";
import { ISSUER_DATASET_ID, ISSUER_NAMES, ISSUER_QUARTERS, RATING_SCALE, SCORECARD_CATEGORIES } from "./reportData/issuerDataset";

const ENTITY_STATE = "entity";
const COMPARATOR_STATE = "comparator";
const DEFAULT_ENTITY = ISSUER_NAMES[0];
const DEFAULT_COMPARATOR = ISSUER_NAMES[2];

/** The row of the chosen entity. */
const entityRow: RowLookup = { table: "entities", keyField: "name", state: ENTITY_STATE, fallback: DEFAULT_ENTITY };
const comparatorRow: RowLookup = { table: "entities", keyField: "name", state: COMPARATOR_STATE, fallback: DEFAULT_COMPARATOR };
/** Keep the chosen entity's rows. */
const forEntity: BindingFilter = { field: "entity", state: ENTITY_STATE, fallback: DEFAULT_ENTITY };
/** Keep the rows of the entity and of the one it is compared with. */
const forPair: BindingFilter = { ...forEntity, alsoState: COMPARATOR_STATE, alsoFallback: DEFAULT_COMPARATOR };

const base = (id: BuilderTemplate["id"], label: string, desc: string, icon: string): Pick<BuilderTemplate, "id" | "label" | "desc" | "icon" | "category" | "uniformStructure" | "datasetId" | "interfaceType" | "selectedComponents"> => ({
  id, label, desc, icon,
  category: "finance",
  uniformStructure: true,
  datasetId: ISSUER_DATASET_ID,
  interfaceType: "dashboard",
  selectedComponents: ["table", "inputs"],
});

const title = (prefix: string, width: `${number}fr`, narrow = { spanTablet: 12, spanPhone: 12 }): Block => ({
  id: `tpl-${prefix}-title`, type: "PageTitle", props: { text: SI_TITLE }, layout: { width, height: CONTEXT_ROW_HEIGHT, align: "center", ...narrow },
});
const entityFilter = (prefix: string, width = "4fr"): Block =>
  filter(`tpl-${prefix}-entity`, "Entity", ENTITY_STATE, DEFAULT_ENTITY, ISSUER_NAMES, width, { spanTablet: 12, spanPhone: 12 });

const header = (prefix: string, facts: [label: string, field: string][], extra: Record<string, unknown> = {}): Block => ({
  id: `tpl-${prefix}-header`, type: "EntityHeader",
  props: { binding: entityRow, height: 72, facts: facts.map(([label, field]) => ({ label, field })), ...extra },
  layout: { width: "12fr", height: "72px" },
});

/** A chart over the long `issuerSeries` table: categories x series for one
 *  chart, for the chosen entity (or pair), in the table's own order. */
const seriesChart = (chart: string, filters: BindingFilter[]): DataBinding => ({
  table: "issuerSeries",
  view: "series",
  groupBy: "category",
  pivotBy: "series",
  measures: [{ field: "value" }, { field: "order", agg: "avg" }],
  display: [{ key: "value", label: "Value" }],
  sort: { by: "order", dir: "asc" },
  filters: [{ field: "chart", value: chart }, ...filters],
});
/** The entity's own rows beside the benchmark a panel's "View by" names. */
const againstBenchmark = (blockId: string, fallback: string): BindingFilter => ({ field: "set", state: viewByStateKey(blockId), fallback, extra: ["Entity"] });
const OWN: BindingFilter = { field: "set", value: "Entity" };

/* ══════════════════════════════════════════════════════════════
   Issuer Climate
   ══════════════════════════════════════════════════════════════ */

const IC_SUMMARY = "tpl-ic-summary";
const IC_SCOPE = "tpl-ic-scope";
const SUMMARY_BENCHMARKS = ["GICS industry", "Asset class", "Region", "Sector"];
const SCOPE_BENCHMARKS = ["GICS industry average", "Universe average", "Region average"];

const pathway: DataBinding = {
  table: "pathway",
  view: "series",
  groupBy: "year",
  measures: [{ field: "budget", agg: "avg" }, { field: "projected", agg: "avg" }, { field: "order", agg: "avg" }],
  display: [{ key: "budget", label: "Net zero 2050 alignment" }, { key: "projected", label: "Projected emissions" }],
  sort: { by: "order", dir: "asc" },
  filters: [forEntity],
};

const PEER_METRICS = { "Intensity (EVIC)": "evic", "Intensity (mkt cap)": "mktCap", "Total emissions": "totalEmissions" };
const peers = (blockId: string, cohort: string): DataBinding => {
  const state = viewByStateKey(blockId);
  const labels = Object.keys(PEER_METRICS);
  const keys = Object.values(PEER_METRICS);
  return {
    table: "peers",
    view: "grid",
    groupBy: "entity",
    groupHeader: "Entity",
    rank: true,
    measures: keys.map((field) => ({ field })),
    display: labels.map((label, i) => ({ key: keys[i], label, kind: "number" as const, decimals: 0, width: 150 })),
    /* Show only the metric the "View by" names (the first while unset). */
    adjustments: labels.map((label, i) => ({ when: { state, in: i === 0 ? ["", label] : [label] }, omit: keys.filter((k) => k !== keys[i]) })),
    sort: { by: { state, options: PEER_METRICS, fallback: keys[0] }, dir: "asc" },
    filters: [{ field: "cohort", value: cohort }],
    groupMinWidth: 130,
  };
};

export const issuerClimate: BuilderTemplate = {
  ...base("issuer-climate", "Issuer Climate", "An issuer's emissions against a benchmark, its net-zero pathway, an alignment verdict and peer rankings", "thermostat"),
  zoneLayouts: { body: BODY_LAYOUT, ...SI_CHROME_LAYOUTS },
  ...siChrome("ic", "issuer-climate"),
  body: [
    title("ic", "8fr"),
    entityFilter("ic"),
    header("ic", [["GICS sector", "sector"], ["Region", "region"], ["ISIN", "isin"], ["As of", "asOf"]]),

    {
      id: IC_SUMMARY, type: "HighchartColumn",
      props: { chartType: "column", panel: true, height: 360, title: "Emissions summary", subtitle: "(Clustered)", viewBy: SUMMARY_BENCHMARKS, labelWrap: true, valueDecimals: 0, binding: seriesChart("emissionsSummary", [forEntity, againstBenchmark(IC_SUMMARY, "GICS industry")]) },
      layout: { width: "5fr", ...FULL },
    },
    {
      id: "tpl-ic-pathway", type: "HighchartCorridor",
      props: { chartType: "corridor", panel: true, height: 360, title: "Net-zero 2050 alignment", subtitle: "(Mt CO2e)", bandName: "Carbon budget undershoot", valueDecimals: 1, binding: pathway },
      layout: { width: "4fr", ...HALF },
    },
    {
      id: "tpl-ic-verdict", type: "VerdictCard",
      props: {
        title: "Portfolio alignment", height: 360, binding: entityRow,
        chip: "Net zero 2050", heroField: "temperature", heroUnit: "°C", statusField: "alignmentStatus", toneField: "alignmentTone", captionField: "alignmentCaption",
        progress: { label: "2030 path vs budget", field: "pathPct", suffix: "% of ceiling" },
        stats: [{ label: "Budget undershoot", field: "undershoot", suffix: " Mt", decimals: 1, toneField: "undershootTone" }, { label: "ESG rating", field: "rating" }],
        footnote: "Implied warming against the industry pathway.",
      },
      layout: { width: "3fr", ...HALF },
    },

    {
      id: IC_SCOPE, type: "HighchartStackedColumn",
      props: { chartType: "stacked-column", panel: true, height: 360, title: "Scope 1, 2 & 3 emissions", viewBy: SCOPE_BENCHMARKS, labelWrap: true, valueDecimals: 1, binding: seriesChart("scopeVsAverage", [forEntity, againstBenchmark(IC_SCOPE, SCOPE_BENCHMARKS[0])]) },
      layout: { width: "4fr", ...FULL },
    },
    {
      id: "tpl-ic-industry-peers", type: "DataGrid",
      props: { title: "Industry peers", height: 360, viewBy: Object.keys(PEER_METRICS), binding: peers("tpl-ic-industry-peers", "GICS industry") },
      layout: { width: "4fr", ...HALF },
    },
    {
      id: "tpl-ic-universe-peers", type: "DataGrid",
      props: { title: "Universe entities", height: 360, viewBy: Object.keys(PEER_METRICS), binding: peers("tpl-ic-universe-peers", "Universe") },
      layout: { width: "4fr", ...HALF },
    },
  ],
  aiResponse:
    "Built **Issuer Climate**: choose an **Entity** to re-read every panel for that issuer. Each chart's **View by** changes the benchmark it is set against; the peer grids' **View by** changes the metric they rank by. Ask me to add a panel or try another design system.",
};

/* ══════════════════════════════════════════════════════════════
   Issuer Business Involvement
   ══════════════════════════════════════════════════════════════ */

const tile = (id: string, label: string, icon: string, field: string, width: `${number}fr`, narrow: { spanTablet: number; spanPhone: number }, extra: Record<string, unknown> = {}): Block => ({
  id, type: "MetricTile",
  props: { label, icon, field, height: 112, binding: entityRow, ...extra },
  layout: { width, height: "112px", ...narrow },
});

const TIE: GridCell = { type: "dot", tones: { Yes: "bad" }, hollow: ["No"] };
const involvementDetail: DataBinding = {
  table: "involvement",
  view: "records",
  measures: [],
  display: [],
  records: [
    { field: "activity", label: "Involvement group / activity", minWidth: 200 },
    { field: "count", label: "Ties", kind: "number", decimals: 0, width: 64 },
    { field: "tie", label: "Any tie", width: 96, cell: TIE },
    { field: "maxRevenue", label: "Max % revenue", kind: "percent", decimals: 2, width: 130 },
  ],
  groupRows: { by: "group", labelColumn: "activity", counts: [{ as: "count", field: "tie", equals: "Yes" }] },
  filters: [forEntity],
};

const IB_RADAR = "tpl-ib-radar";
const RADAR_PEERS = ["GICS industry", "GICS sector", "Region", "Market cap"];

export const issuerInvolvement: BuilderTemplate = {
  ...base("issuer-involvement", "Issuer Business Involvement", "Five involvement counts, a grouped detail grid and a peer radar for one issuer", "category"),
  zoneLayouts: { body: BODY_LAYOUT, ...SI_CHROME_LAYOUTS },
  ...siChrome("ib", "issuer-involvement"),
  body: [
    title("ib", "8fr"),
    entityFilter("ib"),
    header("ib", [["GICS industry", "industry"], ["Country of risk", "country"], ["Market cap", "marketCap"]]),

    tile("tpl-ib-health", "Health and wellness", "health", "involvementHealth", "2fr", { spanTablet: 4, spanPhone: 6 }),
    tile("tpl-ib-entertainment", "Entertainment", "entertainment", "involvementEntertainment", "2fr", { spanTablet: 4, spanPhone: 6 }),
    tile("tpl-ib-weapons", "Weapons & defence", "weapons", "involvementWeapons", "2fr", { spanTablet: 4, spanPhone: 6 }),
    tile("tpl-ib-energy", "Fossil fuels and energy", "energy", "involvementEnergy", "3fr", { spanTablet: 6, spanPhone: 6 }),
    tile("tpl-ib-practices", "Business practices", "practices", "involvementPractices", "3fr", { spanTablet: 6, spanPhone: 12 }),

    {
      id: "tpl-ib-details", type: "DataGrid",
      props: { title: "Details", height: 460, binding: involvementDetail },
      layout: { width: "6fr", ...FULL },
    },
    {
      id: IB_RADAR, type: "HighchartRadar",
      props: { chartType: "radar", panel: true, height: 460, title: "Peer comparison", subtitle: "(Max % revenue)", viewBy: RADAR_PEERS, yAxisFormat: "{value}%", valueDecimals: 2, valueSuffix: "%", binding: seriesChart("involvement", [forEntity, againstBenchmark(IB_RADAR, "GICS industry")]) },
      layout: { width: "6fr", ...FULL },
    },
  ],
  aiResponse:
    "Built **Issuer Business Involvement**: choose an **Entity** to re-read the counts, the detail grid and the radar. The radar's **View by** changes the peers it is compared with. Ask me to add a panel or try another design system.",
};

/* ══════════════════════════════════════════════════════════════
   Issuer Controversies
   ══════════════════════════════════════════════════════════════ */

const severity = (field: string, label: string, tone: GridTone): RecordColumn => ({ field, label, kind: "number", decimals: 0, width: 120, cell: { type: "dot", tone, hideZero: true } });
const controversyDetail: DataBinding = {
  table: "controversies",
  view: "records",
  measures: [],
  display: [],
  records: [
    { field: "category", label: "Group", minWidth: 220 },
    { field: "total", label: "Total count", kind: "number", decimals: 0, width: 120 },
    severity("moderate", "Moderate", "neutral"),
    severity("severe", "Severe", "mid"),
    severity("verySevere", "Very severe", "bad"),
  ],
  groupRows: { by: "pillar", labelColumn: "category", sums: ["total", "moderate", "severe", "verySevere"] },
  filters: [forEntity],
};

export const issuerControversies: BuilderTemplate = {
  ...base("issuer-controversies", "Issuer Controversies", "Three controversy score cards and a severity grid grouped by pillar for one issuer", "report"),
  zoneLayouts: { body: BODY_LAYOUT, ...SI_CHROME_LAYOUTS },
  ...siChrome("ico", "issuer-controversies"),
  body: [
    title("ico", "8fr"),
    entityFilter("ico"),
    header("ico", [["GICS industry", "industry"], ["Country of risk", "country"], ["Market cap", "marketCap"]]),

    tile("tpl-ico-env", "Environment", "environment", "controversyEnv", "3fr", { spanTablet: 6, spanPhone: 6 }),
    tile("tpl-ico-soc", "Social", "social", "controversySoc", "6fr", FULL, {
      subs: [
        { label: "Human rights", field: "humanRights", icon: "rights" },
        { label: "Labour & supply chain", field: "labourRights", icon: "labour" },
        { label: "Customers", field: "customers", icon: "customers" },
      ],
    }),
    tile("tpl-ico-gov", "Governance", "governance", "controversyGov", "3fr", { spanTablet: 6, spanPhone: 6 }),

    {
      id: "tpl-ico-grid", type: "DataGrid",
      props: { title: "Controversies", subtitle: "by category and severity", height: 476, binding: controversyDetail },
      layout: { width: "12fr" },
    },
  ],
  aiResponse:
    "Built **Issuer Controversies**: choose an **Entity** to re-read the score cards and the severity grid. Ask me to add a panel or try another design system.",
};

/* ══════════════════════════════════════════════════════════════
   Entity Comparison
   ══════════════════════════════════════════════════════════════ */

const summaryCard = (id: string, lookup: RowLookup & { state: string }): Block => ({
  id, type: "RecordPanel",
  props: {
    title: "Entity", height: 340, clearable: false,
    binding: {
      ...lookup,
      sections: [{
        type: "pairs",
        items: [
          { label: "ESG rating", field: "rating", as: "badge" },
          { label: "Ticker", field: "ticker" },
          { label: "GICS sector", field: "sector" },
          { label: "GICS industry", field: "industry" },
          { label: "Market cap", field: "marketCap" },
          { label: "Country of risk", field: "country", as: "flag" },
          { label: "ESG score", field: "esgScore" },
          { label: "Alignment", field: "alignmentLabel" },
        ],
      }],
    } satisfies RecordBinding,
  },
  layout: { width: "4fr", ...HALF },
});

const pairChart = (chart: string): DataBinding => seriesChart(chart, [forPair, OWN]);

export const entityComparison: BuilderTemplate = {
  ...base("entity-comparison", "Entity Comparison", "Two issuers side by side: summaries, involvement radar, ESG scores, rating trend, emissions and controversies", "compare"),
  zoneLayouts: { body: BODY_LAYOUT, ...SI_CHROME_LAYOUTS },
  ...siChrome("ec", "issuer-comparison"),
  body: [
    title("ec", "4fr"),
    filter("tpl-ec-entity", "Entity", ENTITY_STATE, DEFAULT_ENTITY, ISSUER_NAMES, "4fr", { spanTablet: 6, spanPhone: 12 }),
    filter("tpl-ec-comparator", "Compare with", COMPARATOR_STATE, DEFAULT_COMPARATOR, ISSUER_NAMES, "4fr", { spanTablet: 6, spanPhone: 12 }),

    summaryCard("tpl-ec-subject", { ...entityRow, state: ENTITY_STATE }),
    summaryCard("tpl-ec-comparator-card", { ...comparatorRow, state: COMPARATOR_STATE }),
    {
      id: "tpl-ec-radar", type: "HighchartRadar",
      props: { chartType: "radar", panel: true, height: 340, title: "Involvement", subtitle: "(Max % revenue)", yAxisFormat: "{value}%", valueDecimals: 2, valueSuffix: "%", binding: pairChart("involvement") },
      layout: { width: "4fr", ...FULL },
    },

    {
      id: "tpl-ec-scores", type: "HighchartBar",
      props: { chartType: "bar", panel: true, height: 320, title: "ESG scores", subtitle: "(Clustered)", yAxisMax: 100, valueDecimals: 0, binding: pairChart("esgScores") },
      layout: { width: "6fr", ...FULL },
    },
    {
      id: "tpl-ec-rating", type: "HighchartLine",
      props: { chartType: "line", panel: true, height: 320, title: "ESG rating trend", subtitle: "(Line)", yAxisCategories: [...RATING_SCALE], categories: [...ISSUER_QUARTERS], binding: pairChart("ratingTrend") },
      layout: { width: "6fr", ...FULL },
    },

    {
      id: "tpl-ec-emissions", type: "HighchartStackedColumn",
      props: { chartType: "stacked-column", panel: true, height: 340, title: "Emissions", subtitle: "(Stacked)", labelWrap: true, valueDecimals: 1, binding: pairChart("scope") },
      layout: { width: "4fr", ...HALF },
    },
    {
      id: "tpl-ec-intensity", type: "HighchartColumn",
      props: { chartType: "column", panel: true, height: 340, title: "Emissions intensity", subtitle: "(Clustered)", labelWrap: true, valueDecimals: 0, binding: pairChart("intensity") },
      layout: { width: "4fr", ...HALF },
    },
    {
      id: "tpl-ec-controversies", type: "HighchartColumn",
      props: { chartType: "column", panel: true, height: 340, title: "Controversies", subtitle: "(Count)", valueDecimals: 0, binding: pairChart("controversyCounts") },
      layout: { width: "4fr", ...FULL },
    },
  ],
  aiResponse:
    "Built **Entity Comparison**: choose an **Entity** and what to **Compare with**; every chart and both summaries follow. Ask me to add a panel or try another design system.",
};

/* ══════════════════════════════════════════════════════════════
   Governance Scorecard
   ══════════════════════════════════════════════════════════════ */

const CATEGORY_STATE = "select:category";
const DEFAULT_CATEGORY = SCORECARD_CATEGORIES[0];

const categoryTile = (category: string, i: number): Block => ({
  id: `tpl-sc-category-${i}`, type: "MetricTile",
  props: {
    label: category,
    binding: { table: "categories", keyField: "category", key: category } satisfies RowLookup,
    chips: [{ field: "positive", tone: "good", label: "Positive indicators met" }, { field: "negative", tone: "bad", label: "Negative indicators raised" }],
    selectState: CATEGORY_STATE, selectValue: category, selectDefault: DEFAULT_CATEGORY,
    height: 96,
  },
  layout: { width: "3fr", height: "96px", spanTablet: 6, spanPhone: 12 },
});

const indicators = (blockId: string, polarity: "Positive" | "Negative", views: [label: string, column: RecordColumn][]): DataBinding => {
  const state = viewByStateKey(blockId);
  return {
    table: "indicators",
    view: "records",
    measures: [],
    display: [],
    records: [
      { field: "indicator", label: "Indicator", minWidth: 180 },
      ...views.map(([label, column], i) => ({ ...column, showWhen: { state, in: i === 0 ? ["", label] : [label] } })),
    ],
    filters: [{ field: "polarity", value: polarity }, { field: "category", state: CATEGORY_STATE, fallback: DEFAULT_CATEGORY }],
  };
};
const flagChip = (tone: GridTone): RecordColumn => ({ field: "flag", label: "Flags", kind: "number", decimals: 0, width: 88, cell: { type: "chip", variant: "solid", tones: { 1: tone }, fallback: "neutral" } });
const VALUE: RecordColumn = { field: "value", label: "Value", width: 88 };
const statusChip = (tones: Record<string, GridTone>): RecordColumn => ({ field: "status", label: "Status", width: 120, cell: { type: "chip", variant: "tint", tones, fallback: "neutral" } });

const SC_POSITIVE = "tpl-sc-positive";
const SC_NEGATIVE = "tpl-sc-negative";
const SC_REFERENCE = "tpl-sc-reference";
const POSITIVE_VIEWS: [string, RecordColumn][] = [["Flags", flagChip("good")], ["Value", VALUE], ["Status", statusChip({ Met: "good", "Not Met": "bad" })]];
const NEGATIVE_VIEWS: [string, RecordColumn][] = [["Value", VALUE], ["Flags", flagChip("bad")], ["Status", statusChip({ Raised: "bad", Clear: "good" })]];

const reference: DataBinding = {
  table: "reference",
  view: "records",
  measures: [],
  display: [],
  records: [{ field: "indicator", label: "Indicator", minWidth: 150 }, { field: "value", label: "Value", minWidth: 150, flex: 2 }],
  filters: [forEntity, { field: "group", state: viewByStateKey(SC_REFERENCE), ignore: ["All"] }],
};

export const governanceScorecard: BuilderTemplate = {
  ...base("governance-scorecard", "Governance Scorecard", "Four category cards that filter positive and negative indicator grids, with a reference grid for one issuer", "fact_check"),
  zoneLayouts: { body: BODY_LAYOUT, ...SI_CHROME_LAYOUTS },
  ...siChrome("sc", "scorecard"),
  body: [
    title("sc", "8fr"),
    entityFilter("sc"),
    header("sc", [["GICS sector", "sector"], ["Ticker", "ticker"]], {
      badges: [{ field: "positiveFlags", tone: "good", label: "Positive flags" }, { field: "negativeFlags", tone: "bad", label: "Negative flags" }],
    }),

    ...SCORECARD_CATEGORIES.map(categoryTile),

    {
      id: SC_POSITIVE, type: "DataGrid",
      props: { title: "Positive", height: 440, viewBy: POSITIVE_VIEWS.map(([l]) => l), binding: indicators(SC_POSITIVE, "Positive", POSITIVE_VIEWS) },
      layout: { width: "4fr", ...FULL },
    },
    {
      id: SC_NEGATIVE, type: "DataGrid",
      props: { title: "Negative", height: 440, viewBy: NEGATIVE_VIEWS.map(([l]) => l), binding: indicators(SC_NEGATIVE, "Negative", NEGATIVE_VIEWS) },
      layout: { width: "4fr", ...FULL },
    },
    {
      id: SC_REFERENCE, type: "DataGrid",
      props: { title: "Reference", height: 440, viewBy: ["All", "Identifiers", "Classification"], binding: reference },
      layout: { width: "4fr", ...FULL },
    },
  ],
  aiResponse:
    "Built **Governance Scorecard**: click a category card to filter the positive and negative indicators to it; each grid's **View by** changes what its second column shows. Choose an **Entity** to change the header and the reference grid. Ask me to add a panel or try another design system.",
};

/* ══════════════════════════════════════════════════════════════
   Analytics Home
   ══════════════════════════════════════════════════════════════ */

const HOME_NAV: [label: string, icon: string][] = [["Dashboards", "home"], ["Configuration", "settings"], ["Approvals", "notifications"], ["Reports", "database"]];

const launcher = (i: number, name: string, tag: string, templateId: BuilderTemplate["id"], description: string, accent?: "mid"): Block => ({
  id: `tpl-home-launcher-${i}`, type: "LauncherCard",
  props: { title: name, tag, tagTone: tag === "Company" ? "mid" : "accent", templateId, description, actionLabel: "Open report", height: 300, ...(accent ? { accent } : {}) },
  layout: { width: "3fr", height: "300px", spanTablet: 6, spanPhone: 12 },
});

const dashboards: DataBinding = {
  table: "dashboards",
  view: "records",
  measures: [],
  display: [],
  records: [
    { field: "name", label: "Name", minWidth: 240 },
    { field: "fusionClass", label: "Class", width: 120 },
    { field: "theme", label: "Theme", width: 190 },
    { field: "description", label: "Description", minWidth: 280, flex: 3 },
  ],
  filters: [{ field: "fusionClass", state: "homeClass", ignore: ["All"] }, { field: "theme", state: "homeTheme", ignore: ["All"] }],
};

export const analyticsHome: BuilderTemplate = {
  ...base("analytics-home", "Analytics Home", "A hero with search, four launcher cards that open the reports, and a filterable list of dashboards", "home"),
  zoneLayouts: { body: BODY_LAYOUT, ...SI_CHROME_LAYOUTS },
  header: [
    { id: "tpl-home-topnav", type: "TopNav", props: { brand: FINANCE_BRAND, linksCsv: "Manager, Solutions, Apps, Resources", active: "Manager", chevrons: true, account: "", tone: "dark" } },
    { id: "tpl-home-tabs", type: "TabStrip", props: { label: "Workspaces", tabsCsv: WORKSPACES, active: "Home", addButton: true, tone: "dark" } },
  ],
  sidebar: HOME_NAV.map(([label, icon], i) => ({ id: `tpl-home-nav-${i}`, type: "NavItem", props: { label, icon, active: i === 0 } })),
  footer: [],
  body: [
    {
      id: "tpl-home-hero", type: "HeroSearch",
      props: { title: "Analytics Dashboard", subtitle: "Search for a comprehensive range of reports and performance.", placeholder: "Search by entity, sector or ticker", buttonLabel: "Search", height: 168 },
      layout: { width: "12fr", height: "168px" },
    },
    { id: "tpl-home-featured", type: "PageTitle", props: { text: "Featured" }, layout: { width: "12fr", height: "48px", align: "center" } },
    launcher(0, "Portfolio report", "Holdings", "esg-analytics", "ESG, climate and screening views of a portfolio."),
    launcher(1, "Issuer report", "Company", "issuer-climate", "Climate, involvement and controversies for one issuer.", "mid"),
    launcher(2, "Performance", "Holdings", "performance-analytics", "Multi-period returns against benchmark, with allocation."),
    launcher(3, "Risk", "Holdings", "risk-analytics", "Value at risk, exposures and risk contribution."),

    { id: "tpl-home-all", type: "PageTitle", props: { text: "All dashboards" }, layout: { width: "6fr", height: CONTEXT_ROW_HEIGHT, align: "center", spanTablet: 12, spanPhone: 12 } },
    filter("tpl-home-class", "Class", "homeClass", "All", ["All", "Holdings", "Company"], "3fr", { spanTablet: 6, spanPhone: 6 }),
    filter("tpl-home-theme", "Theme", "homeTheme", "All", ["All", "Sustainable Investment", "Performance", "Risk", "Screening", "Other"], "3fr", { spanTablet: 6, spanPhone: 6 }),
    {
      id: "tpl-home-grid", type: "DataGrid",
      props: { title: "Dashboards", height: 320, binding: dashboards },
      layout: { width: "12fr" },
    },
  ],
  aiResponse:
    "Built **Analytics Home**: a start page for the reports. While presenting, **Open report** on a card opens that template; the **Class** and **Theme** filters narrow the list. Ask me to change a card, add one, or try another design system.",
};
