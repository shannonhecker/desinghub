/**
 * financeSampleData - illustrative data for the finance report templates
 * (Risk Analytics, Performance Analytics).
 *
 * Invented figures for a fictional multi-asset manager. Nothing here is real
 * fund, issuer or client data. Percentages are percent values (4.5 = 4.5%).
 */

import type { GridColumn, GridRow } from "./dataGridModel";
import type { ChartSeries } from "@/components/builder/SimulatedHighchart";

export const FINANCE_BRAND = "Meridian Analytics";
export const FINANCE_AS_OF = "as of Dec 2024";
export const FINANCE_CURRENCIES = "GBP, USD, EUR, JPY, CHF, CAD, AUD";

interface CategoryChart {
  categories: string[];
  series: ChartSeries[];
}

/* ── Risk ─────────────────────────────────────────────────── */

const riskMeasure = (header: string, field: string): GridColumn => ({
  header,
  children: [
    { field, header: "Value", kind: "currency", compact: true },
    { field: `${field}Pct`, header: "(%)", kind: "percent", width: 84 },
  ],
});

export const riskSummaryColumns: GridColumn[] = [
  { field: "view", header: "Fund", pinned: true, flex: 2 },
  { field: "pv", header: "PV", kind: "currency", compact: true },
  { field: "pvPct", header: "(%)", kind: "percent", width: 84 },
  riskMeasure("VaR 95% (20D)", "var"),
  riskMeasure("IVaR 95% (20D)", "ivar"),
  riskMeasure("MVaR 95% (20D)", "mvar"),
  riskMeasure("CVaR 95% (20D)", "cvar"),
];

export const riskSummaryRows: GridRow[] = [
  { view: "Aggregate", _bold: true, pv: 2_840_000_000, pvPct: 100, var: 124_960_000, varPct: 4.4, ivar: 121_550_000, ivarPct: 4.28, mvar: 124_960_000, mvarPct: 4.4, cvar: 153_930_000, cvarPct: 5.42 },
  { view: "Global Multi-Asset Growth", pv: 1_020_000_000, pvPct: 35.92, var: 36_110_000, varPct: 3.54, ivar: 34_270_000, ivarPct: 3.36, mvar: 33_150_000, mvarPct: 3.25, cvar: 45_290_000, cvarPct: 4.44 },
  { view: "Responsible Equity Leaders", pv: 1_180_000_000, pvPct: 41.55, var: 66_430_000, varPct: 5.63, ivar: 62_890_000, ivarPct: 5.33, mvar: 69_860_000, mvarPct: 5.92, cvar: 79_300_000, cvarPct: 6.72 },
  { view: "Emerging Markets Income", pv: 640_000_000, pvPct: 22.53, var: 26_050_000, varPct: 4.07, ivar: 27_580_000, ivarPct: 4.31, mvar: 25_090_000, mvarPct: 3.92, cvar: 33_020_000, cvarPct: 5.16 },
];

const ASSET_CLASSES = ["Bonds", "Equity", "Private Assets"] as const;

export const riskMarketValueByCurrency: CategoryChart = {
  categories: ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "SEK", "HKD", "SGD"],
  series: [
    { name: ASSET_CLASSES[0], data: [13.6, 10.2, 4.4, 2.8, 3.1, 2.3, 1.6, 1.1, 0.8, 0.5] },
    { name: ASSET_CLASSES[1], data: [37.2, 12.9, 6.6, 4.8, 4.5, 5.1, 3.2, 2.4, 1.5, 0.7] },
    { name: ASSET_CLASSES[2], data: [8.9, 2.4, 0.9, 0.8, 0, 0, 0, 0, 0, 0] },
  ],
};

export const riskContributionByType: CategoryChart = {
  categories: ["VaR MC", "FX", "Equity", "Rates", "Issuer", "Vega"],
  series: [
    { name: "Aggregate", data: [94, 21, 84, 9, 15, 3] },
    { name: ASSET_CLASSES[0], data: [5, 6, 2, 29, 10, 1] },
    { name: ASSET_CLASSES[1], data: [76, 13, 70, 3, 21, 2] },
    { name: ASSET_CLASSES[2], data: [14, 3, 13, 2, 6, 0] },
  ],
};

export const riskTopIssuers: CategoryChart = {
  categories: [
    "Halden Capital", "Orrin Holdings", "Tidewater Energy", "Calloway Pharma", "Vireo Systems",
    "Stannum Metals", "Kestrel Financial", "Ardent Telecom", "Larkfield Retail", "Brigg Logistics",
  ],
  series: [
    { name: ASSET_CLASSES[0], data: [0.42, 0.31, 0.58, 0.22, 0.12, 0.88, 0.21, 0.33, 0.09, 0.18] },
    { name: ASSET_CLASSES[1], data: [5.41, 4.76, 3.18, 2.71, 2.36, 0.64, 1.02, 0.71, 0.48, 0.29] },
    { name: ASSET_CLASSES[2], data: [0.28, 0.22, 0.37, 0.11, 0.19, 0, 0.08, 0, 0, 0] },
  ],
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const riskValueAtRisk: CategoryChart = {
  categories: [...MONTHS.map((m) => `${m} 23`), ...MONTHS.map((m) => `${m} 24`)],
  series: [
    { name: "VaR (MC) - Active (right axis)", type: "column", yAxis: 1, data: [3.1, 3.4, 2.6, 3.2, 3.5, 2.6, 3.5, 3.7, 3.5, 3.6, 2.7, 3.5, 2.7, 3.5, 3.2, 2.6, 2.0, 2.4, 4.4, 4.1, 3.5, 3.4, 3.2, 3.5] },
    { name: "Portfolio", type: "line", data: [0.9, 0.7, 0.9, 1.1, 1.4, 1.9, 3.3, 3.5, 3.4, 3.5, 4.3, 4.6, 4.3, 3.9, 3.4, 2.5, 1.5, 1.7, 1.8, 1.5, 0.9, 0.7, 0.6, 0.5] },
    { name: "Benchmark", type: "line", dashStyle: "ShortDash", data: [0.8, 0.7, 1.0, 1.2, 1.3, 2.0, 3.4, 3.5, 3.5, 3.6, 4.4, 4.5, 4.2, 3.8, 3.3, 2.4, 1.6, 1.6, 1.7, 1.5, 1.0, 0.8, 0.7, 0.6] },
  ],
};

/* ── Performance ──────────────────────────────────────────── */

const period = (header: string, key: string): GridColumn => ({
  header,
  children: [
    { field: `port${key}`, header: "Port", kind: "percent", width: 78, signed: true },
    { field: `bmk${key}`, header: "Bmk", kind: "percent", width: 78, signed: true },
    { field: `excess${key}`, header: "Excess", kind: "percent", width: 84, signed: true },
  ],
});

export const performanceResultsColumns: GridColumn[] = [
  { field: "account", header: "Account", pinned: true, width: 232 },
  { field: "currency", header: "Currency", width: 96 },
  { field: "marketValue", header: "Market Value", kind: "currency", compact: true, width: 124 },
  { field: "pctTotal", header: "% of Total", kind: "percent", width: 104 },
  period("1 Month", "1m"),
  period("3 Month", "3m"),
  period("YTD", "Ytd"),
  period("1 Year", "1y"),
];

const perfRow = (account: string, marketValue: number, pctTotal: number, r: number[], extra: GridRow = {}): GridRow => ({
  account, currency: "GBP", marketValue, pctTotal,
  port1m: r[0], bmk1m: r[1], excess1m: +(r[0] - r[1]).toFixed(2),
  port3m: r[2], bmk3m: r[3], excess3m: +(r[2] - r[3]).toFixed(2),
  portYtd: r[4], bmkYtd: r[5], excessYtd: +(r[4] - r[5]).toFixed(2),
  port1y: r[6], bmk1y: r[7], excess1y: +(r[6] - r[7]).toFixed(2),
  ...extra,
});

export const performanceResultsRows: GridRow[] = [
  perfRow("Total", 3_962_400_000, 100, [2.41, 2.18, 3.96, 3.61, 9.84, 9.12, 11.27, 10.48], { _bold: true }),
  perfRow("Global Multi-Asset Growth", 1_214_800_000, 30.66, [3.02, 3.11, -4.86, -3.42, 7.94, 8.61, 9.15, 9.88], { _indent: 1 }),
  perfRow("Responsible Equity Leaders", 1_087_300_000, 27.44, [3.24, 3.31, 8.62, 9.71, 14.38, 13.9, 16.02, 15.11], { _indent: 1 }),
  perfRow("Diversified Alternatives", 612_500_000, 15.46, [5.18, 0.81, 15.7, 2.4, 15.7, 6.92, 18.31, 8.04], { _indent: 1 }),
  perfRow("Sterling Corporate Bond", 428_900_000, 10.82, [1.38, 1.41, 0.42, 0.17, 3.86, 3.52, 4.61, 4.18], { _indent: 1 }),
  perfRow("Emerging Markets Income", 241_700_000, 6.1, [1.69, 1.72, 0.28, 0.24, 5.12, 5.48, 6.34, 6.71], { _indent: 1 }),
  perfRow("Private Equity Secondaries", 204_600_000, 5.16, [0.16, 0.19, -0.11, 2.21, 4.02, 6.35, 5.27, 7.92], { _indent: 1 }),
  perfRow("Real Assets Income", 172_600_000, 4.36, [0.44, 0.32, 1.21, 1.34, 4.48, 4.11, 5.06, 4.62], { _indent: 1 }),
];

export const performanceBreakdownColumns: GridColumn[] = [
  { field: "dimension", header: "Asset type", pinned: true, flex: 2 },
  { field: "marketValue", header: "Market Value", kind: "currency", compact: true },
  { field: "ret1m", header: "1M", kind: "percent", width: 76, signed: true },
  { field: "retYtd", header: "YTD", kind: "percent", width: 80, signed: true },
];

export const performanceBreakdownRows: GridRow[] = [
  { dimension: "Equity", marketValue: 1_862_300_000, ret1m: 3.12, retYtd: 12.84 },
  { dimension: "Government Bond", marketValue: 713_200_000, ret1m: 0.96, retYtd: 2.31 },
  { dimension: "Corporate Bond", marketValue: 594_400_000, ret1m: 1.41, retYtd: 3.92 },
  { dimension: "Private Assets", marketValue: 475_500_000, ret1m: 0.21, retYtd: 4.36 },
  { dimension: "Cash and Other", marketValue: 317_000_000, ret1m: -0.04, retYtd: -0.38 },
];

export const performanceReturnsByAccount: CategoryChart = {
  categories: ["1 Month", "3 Month", "YTD", "1 Year"],
  series: [
    { name: "Portfolio", data: [2.41, 3.96, 9.84, 11.27] },
    { name: "Benchmark", data: [2.18, 3.61, 9.12, 10.48] },
    { name: "Excess", data: [0.23, 0.35, 0.72, 0.79] },
  ],
};

export const performanceAllocation = [
  { name: "Equity", y: 47 },
  { name: "Government Bond", y: 18 },
  { name: "Corporate Bond", y: 15 },
  { name: "Private Assets", y: 12 },
  { name: "Cash and Other", y: 8 },
];
export const performanceAllocationTotal = "£3.96bn";

export const performanceAllocationHistory: CategoryChart = {
  categories: ["Q1 23", "Q2 23", "Q3 23", "Q4 23", "Q1 24", "Q2 24", "Q3 24", "Q4 24"],
  series: [
    { name: "Equity", data: [41, 42, 43, 44, 45, 46, 46, 47] },
    { name: "Government Bond", data: [22, 21, 21, 20, 20, 19, 19, 18] },
    { name: "Corporate Bond", data: [17, 17, 16, 16, 15, 15, 15, 15] },
    { name: "Private Assets", data: [10, 10, 11, 11, 11, 12, 12, 12] },
    { name: "Cash and Other", data: [10, 10, 9, 9, 9, 8, 8, 8] },
  ],
};

export const performanceInvestmentTrend: CategoryChart = {
  categories: ["Feb 24", "Apr 24", "Jun 24", "Aug 24", "Oct 24", "Dec 24"],
  series: [
    { name: "Fund", type: "column", data: [-1.9, -0.8, 5.6, 7.1, -0.6, 1.6] },
    { name: "Benchmark", type: "column", data: [-2.4, -1.1, 4.5, 5.8, -0.4, 2.2] },
    { name: "Excess", type: "line", data: [0.5, 0.3, 1.1, 1.3, -0.2, -0.6] },
  ],
};
