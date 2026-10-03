/**
 * financeTemplates - the finance report templates.
 *
 * Rebuilt from the owner's own analytics dashboards as builder templates:
 * one DS-agnostic Block[] per report, drawn by the registry in every design
 * system. Names, brand and figures are neutral and illustrative.
 *
 * Layout rules these templates follow so every panel lands on the same
 * pixels in every design system:
 *   - 12-column grid body, `Nfr` widths, every row sums to 12.
 *   - Every block has a pinned height: panels through their `height` prop
 *     (the frame sets the box), the context row through `layout.height`.
 *   - Blocks stay top-level (no groups).
 */

import type { Block } from "@/store/useBuilder";
import type { BuilderTemplate } from "./builderTemplates";
import {
  FINANCE_AS_OF,
  FINANCE_BRAND,
  FINANCE_CURRENCIES,
  performanceAllocation,
  performanceAllocationHistory,
  performanceAllocationTotal,
  performanceBreakdownColumns,
  performanceBreakdownRows,
  performanceInvestmentTrend,
  performanceResultsColumns,
  performanceResultsRows,
  performanceReturnsByAccount,
  riskContributionByType,
  riskMarketValueByCurrency,
  riskSummaryColumns,
  riskSummaryRows,
  riskTopIssuers,
  riskValueAtRisk,
} from "./financeSampleData";

/** Height of the context row (title + filters): fits the tallest system's
 *  labelled select. */
const CONTEXT_ROW_HEIGHT = "64px";
const BODY_LAYOUT = { mode: "grid", columns: 12, gap: 16 } as const;

const navItems = (prefix: string, active: string): Block[] =>
  [
    ["Overview", "home"],
    ["Performance", "trending_up"],
    ["Risk", "shield"],
    ["Holdings", "layers"],
    ["Screening", "filter"],
    ["Settings", "settings"],
  ].map(([label, icon]) => ({
    id: `tpl-${prefix}-nav-${label.toLowerCase()}`,
    type: "NavItem",
    props: { label, icon, active: label === active },
  }));

const chrome = (prefix: string, active: string) => ({
  header: [
    { id: `tpl-${prefix}-brand`, type: "AppBrand", props: { label: FINANCE_BRAND } },
    { id: `tpl-${prefix}-status`, type: "StatusPill", props: { label: "Dec 2024" } },
  ] as Block[],
  sidebar: navItems(prefix, active),
  footer: [
    { id: `tpl-${prefix}-footer`, type: "FooterText", props: { label: "Illustrative data", version: "Dec 2024" } },
  ] as Block[],
});

const filter = (id: string, label: string, value: string, optionsCsv: string, width: string): Block => ({
  id,
  type: "SimulatedDropdown",
  props: { label, value, optionsCsv },
  layout: { width: width as `${number}fr`, height: CONTEXT_ROW_HEIGHT, align: "center" },
});

/* ── Risk Analytics ─────────────────────────────────────────── */

export const riskAnalytics: BuilderTemplate = {
  id: "risk-analytics",
  label: "Risk Analytics",
  desc: "Value-at-risk summary grid, exposure and contribution charts, and a VaR trend",
  icon: "shield",
  category: "finance",
  uniformStructure: true,
  interfaceType: "dashboard",
  selectedComponents: ["table", "inputs"],
  zoneLayouts: { body: BODY_LAYOUT },
  ...chrome("risk", "Risk"),
  body: [
    { id: "tpl-risk-title", type: "SimulatedTitle", props: { text: "Risk", level: "h2" }, layout: { width: "9fr", height: CONTEXT_ROW_HEIGHT, align: "center" } },
    filter("tpl-risk-currency", "Currency", "GBP", FINANCE_CURRENCIES, "3fr"),

    {
      id: "tpl-risk-summary", type: "DataGrid",
      props: {
        title: "Risk summary", subtitle: FINANCE_AS_OF, height: 280,
        viewBy: ["Fund", "Account", "Asset class", "Currency", "Sector", "Strategy"],
        columns: riskSummaryColumns, rows: riskSummaryRows,
      },
      layout: { width: "12fr" },
    },

    {
      id: "tpl-risk-market-value", type: "HighchartStackedBar",
      props: {
        chartType: "stacked-bar", panel: true, height: 380,
        title: "Market value by currency", subtitle: "(Stacked)",
        viewBy: ["Asset type", "Currency", "Region"],
        categories: riskMarketValueByCurrency.categories, series: riskMarketValueByCurrency.series,
        yAxisFormat: "{value}%",
      },
      layout: { width: "4fr" },
    },
    {
      id: "tpl-risk-contribution", type: "HighchartColumn",
      props: {
        chartType: "column", panel: true, height: 380,
        title: "Contribution by risk type", subtitle: "(Clustered)",
        categories: riskContributionByType.categories, series: riskContributionByType.series,
        yAxisFormat: "{value}%",
      },
      layout: { width: "4fr" },
    },
    {
      id: "tpl-risk-issuers", type: "HighchartStackedBar",
      props: {
        chartType: "stacked-bar", panel: true, height: 380,
        title: "Top 10 issuers by exposure", subtitle: "(Stacked)",
        categories: riskTopIssuers.categories, series: riskTopIssuers.series,
        yAxisFormat: "{value}%",
      },
      layout: { width: "4fr" },
    },

    {
      id: "tpl-risk-var", type: "HighchartCombination",
      props: {
        chartType: "combination", panel: true, height: 400,
        title: "Value at risk", subtitle: "(Combination)",
        categories: riskValueAtRisk.categories, series: riskValueAtRisk.series,
        yAxisFormat: "{value}%", secondaryAxisFormat: "{value}%",
      },
      layout: { width: "12fr" },
    },
  ],
  aiResponse:
    "Built **Risk Analytics**: a risk summary grid (PV, VaR, IVaR, MVaR and CVaR by fund), market value by currency, contribution by risk type, top issuers by exposure, and a two-year value-at-risk trend. Ask me to swap a chart type, change the currency, add a panel, or try it in another design system.",
};

/* ── Performance Analytics ──────────────────────────────────── */

export const performanceAnalytics: BuilderTemplate = {
  id: "performance-analytics",
  label: "Performance Analytics",
  desc: "Multi-period results grid, returns and allocation charts, and an investment trend",
  icon: "trending_up",
  category: "finance",
  uniformStructure: true,
  interfaceType: "dashboard",
  selectedComponents: ["table", "inputs"],
  zoneLayouts: { body: BODY_LAYOUT },
  ...chrome("perf", "Performance"),
  body: [
    { id: "tpl-perf-title", type: "SimulatedTitle", props: { text: "Performance", level: "h2" }, layout: { width: "4fr", height: CONTEXT_ROW_HEIGHT, align: "center" } },
    filter("tpl-perf-fee", "Fee type", "Net of fees", "Net of fees, Gross of fees", "2fr"),
    filter("tpl-perf-currency", "Currency", "GBP", FINANCE_CURRENCIES, "2fr"),
    filter("tpl-perf-periodicity", "Periodicity", "Monthly", "Daily, Weekly, Monthly, Quarterly, Yearly", "2fr"),
    filter("tpl-perf-benchmark", "Benchmark", "Primary", "Primary, Secondary, Custom, None", "2fr"),

    {
      id: "tpl-perf-results", type: "DataGrid",
      props: {
        title: "Performance results", subtitle: FINANCE_AS_OF, height: 432,
        viewBy: ["Account", "Asset class", "Region"],
        columns: performanceResultsColumns, rows: performanceResultsRows,
      },
      layout: { width: "12fr" },
    },

    {
      id: "tpl-perf-breakdown", type: "DataGrid",
      props: {
        title: "Dimension breakdown", height: 360,
        viewBy: ["Asset type", "Security", "Region"],
        columns: performanceBreakdownColumns, rows: performanceBreakdownRows,
      },
      layout: { width: "4fr" },
    },
    {
      id: "tpl-perf-returns", type: "HighchartColumn",
      props: {
        chartType: "column", panel: true, height: 360,
        title: "Returns by account", subtitle: "(Clustered)",
        categories: performanceReturnsByAccount.categories, series: performanceReturnsByAccount.series,
        yAxisFormat: "{value}%",
      },
      layout: { width: "4fr" },
    },
    {
      id: "tpl-perf-allocation", type: "HighchartDonut",
      props: {
        chartType: "donut", panel: true, height: 360,
        title: "Allocation", subtitle: "(Donut)",
        viewBy: ["Asset type", "Region", "Sector"],
        seriesData: performanceAllocation, centerLabel: performanceAllocationTotal,
      },
      layout: { width: "4fr" },
    },

    {
      id: "tpl-perf-history", type: "HighchartStackedArea",
      props: {
        chartType: "stacked-area", panel: true, height: 360,
        title: "Allocation history", subtitle: "(Area)",
        categories: performanceAllocationHistory.categories, series: performanceAllocationHistory.series,
        yAxisFormat: "{value}%",
      },
      layout: { width: "6fr" },
    },
    {
      id: "tpl-perf-trend", type: "HighchartCombination",
      props: {
        chartType: "combination", panel: true, height: 360,
        title: "Investment trend", subtitle: "(Combination)",
        viewBy: ["All", "Fund", "Benchmark"],
        categories: performanceInvestmentTrend.categories, series: performanceInvestmentTrend.series,
        yAxisFormat: "{value}%",
      },
      layout: { width: "6fr" },
    },
  ],
  aiResponse:
    "Built **Performance Analytics**: a multi-period results grid (portfolio, benchmark and excess), a dimension breakdown, returns by account, allocation, allocation history and an investment trend. Ask me to swap a chart type, change a filter, add a panel, or try it in another design system.",
};
