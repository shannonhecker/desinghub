/**
 * financeDataset - the sample dataset behind the finance report templates.
 *
 * One consistent, holdings-level dataset for a fictional multi-asset manager:
 * the Risk and Performance reports are both views of it, so their totals
 * agree, every "View by" re-groups real rows, and a selected fund re-scopes
 * every panel. Figures are invented and deterministic (seeded), so the canvas
 * renders the same on every load and tests can assert on it.
 *
 * Money is in GBP. Returns and risk percentages are percent values.
 */

import type { DataRow, DataTable, ReportDataset } from "./types";

/* ── Deterministic pseudo-random (mulberry32) ── */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const round = (v: number, places = 2): number => Number(v.toFixed(places));

/* ── Reference lists ── */
export const FUNDS = [
  "Global Multi-Asset Growth",
  "Responsible Equity Leaders",
  "Diversified Alternatives",
  "Sterling Corporate Bond",
  "Emerging Markets Income",
] as const;

type AssetClass = "Equity" | "Government Bond" | "Corporate Bond" | "Private Assets" | "Cash";

/* Per asset class: 20-day 95% VaR as a share of market value, and the base
   net portfolio / benchmark returns for 1M, 3M, YTD, 1Y. */
const PROFILE: Record<AssetClass, { var: number; ret: [number, number, number, number]; bmk: [number, number, number, number] }> = {
  Equity: { var: 0.058, ret: [3.1, 8.6, 13.4, 15.2], bmk: [3.3, 9.4, 13.0, 14.6] },
  "Government Bond": { var: 0.021, ret: [0.9, 0.4, 2.2, 3.1], bmk: [1.0, 0.3, 2.0, 2.9] },
  "Corporate Bond": { var: 0.029, ret: [1.4, 0.6, 3.8, 4.6], bmk: [1.4, 0.3, 3.5, 4.2] },
  "Private Assets": { var: 0.047, ret: [0.3, 1.1, 4.4, 6.0], bmk: [0.2, 1.9, 5.8, 7.4] },
  Cash: { var: 0.002, ret: [0.4, 1.2, 4.6, 5.0], bmk: [0.4, 1.2, 4.7, 5.1] },
};

/* [security, issuer, fund index, asset class, region, sector, currency, strategy, market value £m] */
type Seed = [string, string, number, AssetClass, string, string, string, string, number];
const HOLDINGS: Seed[] = [
  ["Halden Capital Ord", "Halden Capital", 0, "Equity", "North America", "Financials", "USD", "Core", 142],
  ["Vireo Systems Ord", "Vireo Systems", 0, "Equity", "North America", "Information Technology", "USD", "Growth", 128],
  ["Orrin Holdings Ord", "Orrin Holdings", 0, "Equity", "Europe", "Industrials", "EUR", "Core", 96],
  ["Larkfield Retail Ord", "Larkfield Retail", 0, "Equity", "United Kingdom", "Consumer", "GBP", "Core", 74],
  ["US Treasury 4.25% 2034", "US Treasury", 0, "Government Bond", "North America", "Sovereign", "USD", "Income", 168],
  ["UK Gilt 3.75% 2038", "UK Treasury", 0, "Government Bond", "United Kingdom", "Sovereign", "GBP", "Income", 121],
  ["Tidewater Energy 5.1% 2031", "Tidewater Energy", 0, "Corporate Bond", "North America", "Energy", "USD", "Income", 88],
  ["Northgate Infrastructure LP", "Northgate Partners", 0, "Private Assets", "Europe", "Infrastructure", "EUR", "Alternatives", 112],
  ["Sterling Liquidity Fund", "Meridian Liquidity", 0, "Cash", "United Kingdom", "Cash", "GBP", "Liquidity", 91],

  ["Calloway Pharma Ord", "Calloway Pharma", 1, "Equity", "North America", "Health Care", "USD", "Growth", 206],
  ["Vireo Systems Ord", "Vireo Systems", 1, "Equity", "North America", "Information Technology", "USD", "Growth", 184],
  ["Ardent Telecom Ord", "Ardent Telecom", 1, "Equity", "Europe", "Communication", "EUR", "Core", 152],
  ["Kestrel Financial Ord", "Kestrel Financial", 1, "Equity", "United Kingdom", "Financials", "GBP", "Core", 139],
  ["Sora Robotics Ord", "Sora Robotics", 1, "Equity", "Asia Pacific", "Industrials", "JPY", "Growth", 118],
  ["Halden Capital Ord", "Halden Capital", 1, "Equity", "North America", "Financials", "USD", "Core", 104],
  ["Alder Renewables Ord", "Alder Renewables", 1, "Equity", "Europe", "Energy", "EUR", "Growth", 97],
  ["Sterling Liquidity Fund", "Meridian Liquidity", 1, "Cash", "United Kingdom", "Cash", "GBP", "Liquidity", 62],

  ["Northgate Infrastructure LP", "Northgate Partners", 2, "Private Assets", "Europe", "Infrastructure", "EUR", "Alternatives", 178],
  ["Cedar Row Private Credit", "Cedar Row Capital", 2, "Private Assets", "North America", "Financials", "USD", "Alternatives", 156],
  ["Pacific Timberland Trust", "Pacific Timberland", 2, "Private Assets", "Asia Pacific", "Real Assets", "AUD", "Alternatives", 94],
  ["Stannum Metals Ord", "Stannum Metals", 2, "Equity", "Asia Pacific", "Materials", "AUD", "Growth", 81],
  ["Brigg Logistics 6.2% 2030", "Brigg Logistics", 2, "Corporate Bond", "Europe", "Industrials", "EUR", "Income", 68],
  ["Sterling Liquidity Fund", "Meridian Liquidity", 2, "Cash", "United Kingdom", "Cash", "GBP", "Liquidity", 43],

  ["Kestrel Financial 4.9% 2032", "Kestrel Financial", 3, "Corporate Bond", "United Kingdom", "Financials", "GBP", "Income", 124],
  ["Larkfield Retail 5.4% 2029", "Larkfield Retail", 3, "Corporate Bond", "United Kingdom", "Consumer", "GBP", "Income", 98],
  ["Ardent Telecom 4.6% 2033", "Ardent Telecom", 3, "Corporate Bond", "Europe", "Communication", "EUR", "Income", 86],
  ["Orrin Holdings 5.0% 2030", "Orrin Holdings", 3, "Corporate Bond", "Europe", "Industrials", "EUR", "Income", 72],
  ["UK Gilt 4.5% 2030", "UK Treasury", 3, "Government Bond", "United Kingdom", "Sovereign", "GBP", "Income", 64],
  ["Sterling Liquidity Fund", "Meridian Liquidity", 3, "Cash", "United Kingdom", "Cash", "GBP", "Liquidity", 28],

  ["Republic of Indara 6.8% 2035", "Republic of Indara", 4, "Government Bond", "Emerging Markets", "Sovereign", "USD", "Income", 96],
  ["Republic of Calder 7.4% 2032", "Republic of Calder", 4, "Government Bond", "Emerging Markets", "Sovereign", "USD", "Income", 84],
  ["Stannum Metals 7.1% 2029", "Stannum Metals", 4, "Corporate Bond", "Emerging Markets", "Materials", "USD", "Income", 71],
  ["Tidewater Energy 6.4% 2030", "Tidewater Energy", 4, "Corporate Bond", "Emerging Markets", "Energy", "USD", "Income", 58],
  ["Sora Robotics Ord", "Sora Robotics", 4, "Equity", "Asia Pacific", "Industrials", "JPY", "Growth", 47],
  ["Sterling Liquidity Fund", "Meridian Liquidity", 4, "Cash", "United Kingdom", "Cash", "GBP", "Liquidity", 19],
];

/* Fund-level tilt on returns (percentage points) so funds differ. */
const FUND_TILT = [0.1, 0.35, 1.9, -0.05, 0.2];

function buildHoldings(): DataRow[] {
  const rand = seeded(20241231);
  const jitter = (spread: number) => (rand() - 0.5) * 2 * spread;
  return HOLDINGS.map(([security, issuer, fundIndex, assetClass, region, sector, currency, strategy, mvM]) => {
    const p = PROFILE[assetClass];
    const marketValue = mvM * 1_000_000;
    const varPct = p.var * (1 + jitter(0.12));
    const var95 = marketValue * varPct;
    const tilt = FUND_TILT[fundIndex];
    const ret = (i: number) => round(p.ret[i] + tilt * (i === 0 ? 0.3 : 1) + jitter(i === 0 ? 0.25 : 0.9));
    const bmk = (i: number) => round(p.bmk[i] + jitter(0.05));
    return {
      security,
      issuer,
      fund: FUNDS[fundIndex],
      assetClass,
      region,
      sector,
      currency,
      strategy,
      marketValue,
      var95: Math.round(var95),
      ivar95: Math.round(var95 * (0.96 + jitter(0.04))),
      mvar95: Math.round(var95 * (0.99 + jitter(0.06))),
      cvar95: Math.round(var95 * (1.23 + jitter(0.03))),
      port1m: ret(0), bmk1m: bmk(0),
      port3m: ret(1), bmk3m: bmk(1),
      portYtd: ret(2), bmkYtd: bmk(2),
      port1y: ret(3), bmk1y: bmk(3),
    };
  });
}

const HOLDING_FIELDS: DataTable["fields"] = [
  { key: "security", label: "Security", role: "dimension", help: "Name of the holding." },
  { key: "issuer", label: "Issuer", role: "dimension" },
  { key: "fund", label: "Fund", role: "dimension", help: "Fund or account the holding belongs to." },
  { key: "assetClass", label: "Asset class", role: "dimension" },
  { key: "region", label: "Region", role: "dimension" },
  { key: "sector", label: "Sector", role: "dimension" },
  { key: "currency", label: "Currency", role: "dimension", help: "ISO code of the holding's currency." },
  { key: "strategy", label: "Strategy", role: "dimension" },
  { key: "marketValue", label: "Market value", role: "measure", format: "currency", help: "In the base currency." },
  { key: "var95", label: "VaR 95% (20D)", role: "measure", format: "currency" },
  { key: "ivar95", label: "IVaR 95% (20D)", role: "measure", format: "currency" },
  { key: "mvar95", label: "MVaR 95% (20D)", role: "measure", format: "currency" },
  { key: "cvar95", label: "CVaR 95% (20D)", role: "measure", format: "currency" },
  { key: "port1m", label: "Portfolio 1M", role: "measure", format: "percent", help: "Net return, percent." },
  { key: "bmk1m", label: "Benchmark 1M", role: "measure", format: "percent" },
  { key: "port3m", label: "Portfolio 3M", role: "measure", format: "percent" },
  { key: "bmk3m", label: "Benchmark 3M", role: "measure", format: "percent" },
  { key: "portYtd", label: "Portfolio YTD", role: "measure", format: "percent" },
  { key: "bmkYtd", label: "Benchmark YTD", role: "measure", format: "percent" },
  { key: "port1y", label: "Portfolio 1Y", role: "measure", format: "percent" },
  { key: "bmk1y", label: "Benchmark 1Y", role: "measure", format: "percent" },
];

/* ── Risk contribution: VaR split by risk type, per fund and asset class ── */
export const RISK_TYPES = ["Equity", "Rates", "FX", "Issuer", "Vega"] as const;
const RISK_MIX: Record<AssetClass, number[]> = {
  Equity: [0.72, 0.03, 0.14, 0.09, 0.02],
  "Government Bond": [0.0, 0.78, 0.16, 0.05, 0.01],
  "Corporate Bond": [0.04, 0.52, 0.12, 0.31, 0.01],
  "Private Assets": [0.46, 0.12, 0.18, 0.22, 0.02],
  Cash: [0.0, 0.7, 0.3, 0.0, 0.0],
};

function buildRiskContribution(holdings: DataRow[]): DataRow[] {
  const byKey = new Map<string, number>();
  for (const h of holdings) {
    const key = `${h.fund}\u0000${h.assetClass}`;
    byKey.set(key, (byKey.get(key) ?? 0) + (h.var95 as number));
  }
  const rows: DataRow[] = [];
  for (const [key, var95] of byKey) {
    const [fund, assetClass] = key.split("\u0000");
    RISK_MIX[assetClass as AssetClass].forEach((share, i) => {
      rows.push({ fund, assetClass, riskType: RISK_TYPES[i], riskAmount: Math.round(var95 * share) });
    });
  }
  return rows;
}

/* ── VaR history: 24 months per fund ── */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function buildVarHistory(holdings: DataRow[]): DataRow[] {
  const rand = seeded(77);
  const rows: DataRow[] = [];
  FUNDS.forEach((fund, f) => {
    const mv = holdings.filter((h) => h.fund === fund).reduce((a, h) => a + (h.marketValue as number), 0);
    const level = 2.2 + f * 0.35;
    for (let i = 0; i < 24; i++) {
      const t = i / 23;
      const cycle = Math.sin(t * Math.PI * 1.6 - 0.6 + f * 0.4);
      const portfolio = round(Math.max(0.3, level * 0.55 + 1.9 * cycle + (rand() - 0.5) * 0.3));
      const benchmark = round(Math.max(0.3, portfolio - 0.12 + (rand() - 0.5) * 0.2));
      const active = round(level + 0.9 * Math.sin(t * Math.PI * 5 + f) + (rand() - 0.5) * 0.5);
      rows.push({ month: `${MONTHS[i % 12]} ${i < 12 ? "23" : "24"}`, fund, marketValue: mv, activeVar: active, portfolioVar: portfolio, benchmarkVar: benchmark });
    }
  });
  return rows;
}

/* ── Allocation history: quarterly weights, drifting toward today's mix ── */
const QUARTERS = ["Q1 23", "Q2 23", "Q3 23", "Q4 23", "Q1 24", "Q2 24", "Q3 24", "Q4 24"];
const DRIFT: Record<AssetClass, number> = { Equity: -0.12, "Government Bond": 0.2, "Corporate Bond": 0.12, "Private Assets": -0.16, Cash: 0.3 };

function buildAllocationHistory(holdings: DataRow[]): DataRow[] {
  const rows: DataRow[] = [];
  QUARTERS.forEach((period, q) => {
    const back = (QUARTERS.length - 1 - q) / (QUARTERS.length - 1);
    const combos = new Map<string, number>();
    for (const h of holdings) {
      const key = [h.fund, h.assetClass, h.region, h.sector].join("\u0000");
      const factor = 1 + DRIFT[h.assetClass as AssetClass] * back;
      combos.set(key, (combos.get(key) ?? 0) + (h.marketValue as number) * factor * (1 - 0.06 * back));
    }
    for (const [key, marketValue] of combos) {
      const [fund, assetClass, region, sector] = key.split("\u0000");
      rows.push({ period, fund, assetClass, region, sector, marketValue: Math.round(marketValue) });
    }
  });
  return rows;
}

/* ── Investment trend: net fund and benchmark returns per period, for each
   periodicity. The fee drag per point is stored so "gross" can add it back. ── */
export const PERIODICITIES = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"] as const;
const TREND: Record<(typeof PERIODICITIES)[number], { count: number; drag: number }> = {
  Daily: { count: 30, drag: 0.0025 },
  Weekly: { count: 26, drag: 0.012 },
  Monthly: { count: 13, drag: 0.05 },
  Quarterly: { count: 8, drag: 0.15 },
  Yearly: { count: 5, drag: 0.6 },
};

function trendLabel(periodicity: (typeof PERIODICITIES)[number], back: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const anchor = new Date(Date.UTC(2024, 11, 31));
  if (periodicity === "Daily" || periodicity === "Weekly") {
    const d = new Date(anchor.getTime() - back * (periodicity === "Daily" ? 1 : 7) * 86_400_000);
    return `${pad(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]}`;
  }
  if (periodicity === "Monthly") {
    const d = new Date(Date.UTC(2024, 11 - back, 1));
    return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
  }
  if (periodicity === "Quarterly") {
    const index = 3 - back;
    const year = 2024 + Math.floor(index / 4);
    return `Q${((index % 4) + 4) % 4 + 1} ${String(year).slice(2)}`;
  }
  return String(2024 - back);
}

function buildTrend(holdings: DataRow[]): DataRow[] {
  const rand = seeded(4242);
  const rows: DataRow[] = [];
  for (const periodicity of PERIODICITIES) {
    const { count, drag } = TREND[periodicity];
    /* Shorter periods move less: scale the swing with the period length. */
    const swing = { Daily: 0.35, Weekly: 0.8, Monthly: 2.4, Quarterly: 4.2, Yearly: 8.5 }[periodicity];
    FUNDS.forEach((fund, f) => {
      const mv = holdings.filter((h) => h.fund === fund).reduce((a, h) => a + (h.marketValue as number), 0);
      for (let i = 0; i < count; i++) {
        const t = count > 1 ? i / (count - 1) : 0;
        const wave = Math.sin(t * Math.PI * 3.2 + f * 0.7);
        const gross = swing * (0.35 + wave) + (rand() - 0.5) * swing * 0.5 + FUND_TILT[f] * 0.1;
        const benchmark = swing * (0.3 + Math.sin(t * Math.PI * 3.2 + f * 0.7 + 0.35)) + (rand() - 0.5) * swing * 0.3;
        rows.push({
          periodicity,
          period: trendLabel(periodicity, count - 1 - i),
          fund,
          marketValue: mv,
          fundReturn: round(gross - drag, 3),
          benchmarkReturn: round(benchmark, 3),
          feeDrag: drag,
        });
      }
    });
  }
  return rows;
}

export const FX_RATES: DataRow[] = [
  { currency: "GBP", rate: 1 },
  { currency: "USD", rate: 1.27 },
  { currency: "EUR", rate: 1.17 },
  { currency: "JPY", rate: 191 },
  { currency: "CHF", rate: 1.12 },
  { currency: "CAD", rate: 1.71 },
  { currency: "AUD", rate: 1.92 },
];

export const FINANCE_DATASET_ID = "portfolio";

let cached: ReportDataset | null = null;

/** The sample portfolio dataset. Built once; treat it as read-only. */
export function financeDataset(): ReportDataset {
  if (cached) return cached;
  const holdings = buildHoldings();
  const dims = (keys: string[]) => HOLDING_FIELDS.filter((f) => keys.includes(f.key));
  cached = {
    id: FINANCE_DATASET_ID,
    label: "Portfolio",
    baseCurrency: "GBP",
    tables: [
      { id: "holdings", label: "Holdings", grain: "One row per holding in a fund", fields: HOLDING_FIELDS, rows: holdings },
      {
        id: "riskContribution", label: "Risk contribution", grain: "One row per fund, asset class and risk type",
        fields: [
          ...dims(["fund", "assetClass"]),
          { key: "riskType", label: "Risk type", role: "dimension" },
          { key: "riskAmount", label: "Risk amount", role: "measure", format: "currency", help: "VaR attributed to this risk type, in the base currency." },
        ],
        rows: buildRiskContribution(holdings),
      },
      {
        id: "varHistory", label: "VaR history", grain: "One row per fund and month",
        fields: [
          { key: "month", label: "Month", role: "dimension", help: "Rows are shown in the order given." },
          ...dims(["fund"]),
          { key: "marketValue", label: "Market value", role: "measure", format: "currency", help: "Used to weight the fund when funds are combined." },
          { key: "activeVar", label: "VaR (MC) - Active", role: "measure", format: "percent" },
          { key: "portfolioVar", label: "Portfolio VaR", role: "measure", format: "percent" },
          { key: "benchmarkVar", label: "Benchmark VaR", role: "measure", format: "percent" },
        ],
        rows: buildVarHistory(holdings),
      },
      {
        id: "allocationHistory", label: "Allocation history", grain: "One row per period, fund, asset class, region and sector",
        fields: [
          { key: "period", label: "Period", role: "dimension", help: "Rows are shown in the order given." },
          ...dims(["fund", "assetClass", "region", "sector"]),
          { key: "marketValue", label: "Market value", role: "measure", format: "currency" },
        ],
        rows: buildAllocationHistory(holdings),
      },
      {
        id: "trend", label: "Investment trend", grain: "One row per periodicity, period and fund",
        fields: [
          { key: "periodicity", label: "Periodicity", role: "dimension", help: "Daily, Weekly, Monthly, Quarterly or Yearly." },
          { key: "period", label: "Period", role: "dimension", help: "Rows are shown in the order given." },
          ...dims(["fund"]),
          { key: "marketValue", label: "Market value", role: "measure", format: "currency", help: "Used to weight the fund when funds are combined." },
          { key: "fundReturn", label: "Fund return", role: "measure", format: "percent", help: "Net of fees, percent." },
          { key: "benchmarkReturn", label: "Benchmark return", role: "measure", format: "percent" },
          { key: "feeDrag", label: "Fee drag", role: "measure", format: "percent", help: "Added back to the fund return when Fee type is Gross of fees." },
        ],
        rows: buildTrend(holdings),
      },
      {
        id: "fx", label: "FX rates", grain: "One row per currency",
        fields: [
          { key: "currency", label: "Currency", role: "dimension", help: "ISO code." },
          { key: "rate", label: "Rate", role: "measure", help: "Units of this currency per one unit of the base currency." },
        ],
        rows: FX_RATES,
      },
    ],
  };
  return cached;
}
