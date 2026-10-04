/**
 * sustainableDataset - the sample dataset behind the Sustainable Investment
 * report templates (ESG, Climate, Screening, Screening Changes).
 *
 * One security-level table that all four reports read, so their totals agree,
 * every "View by" re-groups real rows and a selection genuinely filters.
 * Figures are invented and deterministic (seeded): the canvas renders the
 * same on every load and tests can assert on it.
 *
 * Money is in GBP. Scores run 0 to 10. Emissions are tonnes of CO2
 * equivalent. Trend fields hold a short list of numbers ("3, 4, 2"), which a
 * grid draws as a sparkline and the record panel as a line.
 */

import { FX_RATES } from "./financeDataset";
import type { DataRow, DataTable, ReportDataset } from "./types";

export const SUSTAINABLE_DATASET_ID = "sustainable";

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
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export const SI_ACCOUNTS = ["Global Sustainable Equity", "Responsible Multi-Asset", "Climate Transition Bond"] as const;
export const SI_STAGES = ["House", "Non SI", "Top Down", "Bottom Up", "Target Fund"] as const;
export const SI_RATINGS = ["AAA", "AA", "A", "BBB", "BB", "B", "CCC"] as const;
export const SI_ALIGNMENTS = ["1.5C", "<2C", ">2C", ">2.5C", "Not Rated"] as const;
export const SI_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"] as const;

type AssetClass = "Equities" | "Corporate Bonds" | "Government Bonds";

/* Per sector: a typical ESG level (0-10) and a carbon intensity level
   (tCO2e per £m invested). Energy is carbon heavy and scores low on E;
   technology the reverse. */
const SECTOR: Record<string, { industry: string; esg: number; carbon: number }> = {
  Energy: { industry: "Oil, Gas & Consumable Fuels", esg: 4.1, carbon: 410 },
  Utilities: { industry: "Electric Utilities", esg: 5.6, carbon: 330 },
  Materials: { industry: "Chemicals", esg: 5.0, carbon: 260 },
  Industrials: { industry: "Machinery", esg: 6.2, carbon: 120 },
  "Consumer Staples": { industry: "Food Products", esg: 6.6, carbon: 70 },
  "Health Care": { industry: "Pharmaceuticals", esg: 7.1, carbon: 28 },
  Financials: { industry: "Banks", esg: 6.8, carbon: 12 },
  "Information Technology": { industry: "Software", esg: 7.8, carbon: 16 },
  "Communication Services": { industry: "Telecommunication Services", esg: 6.4, carbon: 34 },
  Sovereign: { industry: "Government", esg: 6.9, carbon: 48 },
};

/* [security, issuer, account index, asset class, sector, region, country, market value £m, screening stage index] */
type Seed = [string, string, number, AssetClass, string, string, string, number, number];
const SECURITIES: Seed[] = [
  ["Vireo Systems Ord", "Vireo Systems", 0, "Equities", "Information Technology", "North America", "US", 148, 4],
  ["Halden Capital Ord", "Halden Capital", 0, "Equities", "Financials", "North America", "US", 126, 4],
  ["Brightwater Health Ord", "Brightwater Health", 0, "Equities", "Health Care", "Europe", "CH", 112, 4],
  ["Orrin Holdings Ord", "Orrin Holdings", 0, "Equities", "Industrials", "Europe", "DE", 98, 3],
  ["Larkfield Foods Ord", "Larkfield Foods", 0, "Equities", "Consumer Staples", "United Kingdom", "GB", 84, 4],
  ["Ardent Telecom Ord", "Ardent Telecom", 0, "Equities", "Communication Services", "Europe", "FR", 76, 3],
  ["Kestrel Financial Ord", "Kestrel Financial", 0, "Equities", "Financials", "United Kingdom", "GB", 71, 4],
  ["Solace Renewables Ord", "Solace Renewables", 0, "Equities", "Utilities", "Europe", "ES", 64, 4],
  ["Tidewater Energy Ord", "Tidewater Energy", 0, "Equities", "Energy", "North America", "US", 58, 0],
  ["Calloway Pharma Ord", "Calloway Pharma", 0, "Equities", "Health Care", "North America", "US", 54, 4],
  ["Nimbus Cloud Ord", "Nimbus Cloud", 0, "Equities", "Information Technology", "Asia Pacific", "JP", 49, 3],
  ["Ferrous Materials Ord", "Ferrous Materials", 0, "Equities", "Materials", "Asia Pacific", "AU", 41, 1],
  ["Meridian Rail Ord", "Meridian Rail", 0, "Equities", "Industrials", "United Kingdom", "GB", 38, 2],
  ["Pinecrest Utilities Ord", "Pinecrest Utilities", 0, "Equities", "Utilities", "North America", "CA", 33, 2],

  ["Vireo Systems ADR", "Vireo Systems", 1, "Equities", "Information Technology", "North America", "US", 92, 4],
  ["Brightwater Health ADR", "Brightwater Health", 1, "Equities", "Health Care", "Europe", "CH", 81, 4],
  ["Larkfield Foods 4.2% 2031", "Larkfield Foods", 1, "Corporate Bonds", "Consumer Staples", "United Kingdom", "GB", 74, 4],
  ["Halden Capital 4.9% 2030", "Halden Capital", 1, "Corporate Bonds", "Financials", "North America", "US", 69, 4],
  ["UK Green Gilt 0.875% 2033", "UK Treasury", 1, "Government Bonds", "Sovereign", "United Kingdom", "GB", 118, 4],
  ["Bund 2.3% 2034", "Federal Republic of Germany", 1, "Government Bonds", "Sovereign", "Europe", "DE", 96, 4],
  ["Solace Renewables 3.6% 2032", "Solace Renewables", 1, "Corporate Bonds", "Utilities", "Europe", "ES", 57, 4],
  ["Orrin Holdings 5.0% 2029", "Orrin Holdings", 1, "Corporate Bonds", "Industrials", "Europe", "DE", 52, 3],
  ["Castellan Chemicals Ord", "Castellan Chemicals", 1, "Equities", "Materials", "Europe", "NL", 44, 1],
  ["Ardent Telecom 4.4% 2030", "Ardent Telecom", 1, "Corporate Bonds", "Communication Services", "Europe", "FR", 39, 3],
  ["Tidewater Energy 5.1% 2031", "Tidewater Energy", 1, "Corporate Bonds", "Energy", "North America", "US", 35, 0],
  ["Nimbus Cloud ADR", "Nimbus Cloud", 1, "Equities", "Information Technology", "Asia Pacific", "JP", 31, 3],

  ["UK Green Gilt 1.5% 2053", "UK Treasury", 2, "Government Bonds", "Sovereign", "United Kingdom", "GB", 104, 4],
  ["OAT Verte 1.75% 2039", "French Republic", 2, "Government Bonds", "Sovereign", "Europe", "FR", 88, 4],
  ["Solace Renewables 4.1% 2036", "Solace Renewables", 2, "Corporate Bonds", "Utilities", "Europe", "ES", 79, 4],
  ["Pinecrest Utilities 4.8% 2035", "Pinecrest Utilities", 2, "Corporate Bonds", "Utilities", "North America", "CA", 66, 2],
  ["Meridian Rail 3.9% 2034", "Meridian Rail", 2, "Corporate Bonds", "Industrials", "United Kingdom", "GB", 61, 2],
  ["Ferrous Materials 5.6% 2030", "Ferrous Materials", 2, "Corporate Bonds", "Materials", "Asia Pacific", "AU", 47, 1],
  ["Castellan Chemicals 4.7% 2031", "Castellan Chemicals", 2, "Corporate Bonds", "Materials", "Europe", "NL", 42, 1],
  ["Tidewater Energy 6.0% 2034", "Tidewater Energy", 2, "Corporate Bonds", "Energy", "North America", "US", 38, 0],
  ["Northgate Power 5.3% 2033", "Northgate Power", 2, "Corporate Bonds", "Energy", "Europe", "NO", 34, 0],
  ["Kestrel Financial 4.1% 2029", "Kestrel Financial", 2, "Corporate Bonds", "Financials", "United Kingdom", "GB", 29, 4],
];

const INSTRUMENT: Record<AssetClass, string> = { Equities: "Equity", "Corporate Bonds": "Corporate Bond", "Government Bonds": "Government Bond" };

function ratingOf(score: number): (typeof SI_RATINGS)[number] {
  if (score >= 8.2) return "AAA";
  if (score >= 7.2) return "AA";
  if (score >= 6.3) return "A";
  if (score >= 5.4) return "BBB";
  if (score >= 4.5) return "BB";
  if (score >= 3.6) return "B";
  return "CCC";
}
const ratingRank = (r: string): number => SI_RATINGS.indexOf(r as (typeof SI_RATINGS)[number]);

/** Implied temperature (°C) from carbon intensity: heavier emitters run hotter. */
function temperatureOf(carbon: number): number {
  return round(clamp(1.4 + Math.log10(Math.max(1, carbon)) * 0.52, 1.4, 3.4), 1);
}
function alignmentOf(temperature: number, sovereign: boolean, rated: boolean): (typeof SI_ALIGNMENTS)[number] {
  if (!rated || sovereign) return "Not Rated";
  if (temperature <= 1.7) return "1.5C";
  if (temperature < 2.0) return "<2C";
  if (temperature <= 2.5) return ">2C";
  return ">2.5C";
}

/** A short trend ending at `end`, having started at `start`, with a little
 *  noise, as a list of numbers. */
function trend(rand: () => number, start: number, end: number, points: number, places: number, noise: number): string {
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const wobble = i === 0 || i === points - 1 ? 0 : (rand() - 0.5) * noise;
    out.push(round(start + (end - start) * t + wobble, places));
  }
  return out.join(", ");
}

function buildSecurities(): DataRow[] {
  const rand = seeded(20241231);
  const totalMv = SECURITIES.reduce((a, s) => a + s[7], 0);
  const seenIssuer = new Set<string>();
  const rows: DataRow[] = SECURITIES.map(([name, issuer, accountIndex, assetClass, sector, region, country, mvMillions, stageIndex]) => {
    const profile = SECTOR[sector];
    const sovereign = sector === "Sovereign";
    const marketValue = mvMillions * 1_000_000;
    const coverage = sovereign ? 0.82 : 0.9 + rand() * 0.1;

    /* Pillar scores around the sector's level. */
    const envScore = round(clamp(profile.esg + (rand() - 0.5) * 2.2 - (profile.carbon > 200 ? 0.9 : 0), 1, 9.6));
    const socScore = round(clamp(profile.esg + (rand() - 0.5) * 2.0, 1, 9.6));
    const govScore = round(clamp(profile.esg + 0.4 + (rand() - 0.5) * 1.8, 1, 9.6));
    const keyIssue = round(envScore * 0.4 + socScore * 0.3 + govScore * 0.3);
    const corpScore = round(clamp(keyIssue + (rand() - 0.5) * 0.8, 1, 9.8));

    /* Emissions scale with money invested and the sector's intensity. */
    const intensity = profile.carbon * (0.75 + rand() * 0.5);
    const scope1 = Math.round(mvMillions * intensity * 0.62);
    const scope2 = Math.round(mvMillions * intensity * 0.38);
    const scope3 = Math.round((scope1 + scope2) * (1.6 + rand() * 1.4));
    const intensityEvic = round(intensity, 1);
    const intensityRev = round(intensity * (1.5 + rand() * 0.9), 1);
    const temperature = temperatureOf(intensity);

    /* Period start (January) vs period end (September). */
    const scope1Pct = round((rand() - 0.42) * 24, 1);
    const scope1Start = Math.round(scope1 / (1 + scope1Pct / 100));
    const eScoreStart = round(clamp(envScore - (rand() - 0.4) * 1.4, 1, 9.6));
    const socStart = round(clamp(socScore - (rand() - 0.5) * 0.9, 1, 9.6));
    const govStart = round(clamp(govScore - (rand() - 0.5) * 0.7, 1, 9.6));
    const corpStart = round(clamp(corpScore - (rand() - 0.42) * 1.3, 1, 9.8));
    const rating = ratingOf(corpScore);
    const ratingStart = ratingOf(corpStart);
    const move = ratingRank(ratingStart) - ratingRank(rating);
    const posFlag = Math.max(0, Math.round((rand() - 0.55) * 6));
    const negFlag = -Math.max(0, Math.round((rand() - 0.6) * 5));
    const controversy = Math.round((rand() - 0.5) * 3.4);

    const firstOfIssuer = !seenIssuer.has(issuer);
    seenIssuer.add(issuer);

    return {
      security: name,
      issuer,
      account: SI_ACCOUNTS[accountIndex],
      assetClass,
      sector,
      industry: profile.industry,
      region,
      country,
      instrumentGroup: INSTRUMENT[assetClass],
      entity: `${issuer.split(" ")[0]} ${sovereign ? "DMO" : assetClass === "Equities" ? "Plc" : "Finance"}`,
      ticker: issuer.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase(),
      stage: SI_STAGES[stageIndex],
      alignment: alignmentOf(temperature, sovereign, coverage > 0.86),
      rating,
      ratingStart,
      ratingMove: move > 0 ? "Upgraded" : move < 0 ? "Downgraded" : "Unchanged",

      marketValue,
      coveredMv: Math.round(marketValue * coverage),
      nav: Math.round(marketValue * 1.012),
      positions: 1,
      issuers: firstOfIssuer ? 1 : 0,
      weight: round((mvMillions / totalMv) * 100, 2),
      keyIssue,
      corpScore,
      envScore,
      socScore,
      govScore,
      scope1,
      scope2,
      scope3,
      totalScope12: scope1 + scope2,
      intensityEvic,
      intensityRev,
      temperature,
      carbonCoverage: round(coverage * 100, 1),

      scope1Start,
      scope1Pct,
      eScoreStart,
      socStart,
      govStart,
      corpStart,
      posFlag,
      negFlag,
      controversy,
      scope1Trend: trend(rand, scope1Start, scope1, SI_MONTHS.length, 0, scope1 * 0.05),
      eTrend: trend(rand, eScoreStart, envScore, SI_MONTHS.length, 2, 0.5),
    };
  });

  /* Each score relative to the portfolio's weighted average: what a
     "relative contributors" ranking sorts by. */
  const wavg = (field: string): number => rows.reduce((a, r) => a + (r[field] as number) * (r.marketValue as number), 0) / (totalMv * 1_000_000);
  const base = { keyIssue: wavg("keyIssue"), envScore: wavg("envScore"), socScore: wavg("socScore"), govScore: wavg("govScore") };
  for (const r of rows) {
    r.relKeyIssue = round((r.keyIssue as number) - base.keyIssue);
    r.relEnv = round((r.envScore as number) - base.envScore);
    r.relSoc = round((r.socScore as number) - base.socScore);
    r.relGov = round((r.govScore as number) - base.govScore);
  }
  return rows;
}

const SECURITIES_TABLE = (rows: DataRow[]): DataTable => ({
  id: "securities",
  label: "Securities",
  grain: "One row per security held in an account",
  fields: [
    { key: "security", label: "Security", role: "dimension" },
    { key: "issuer", label: "Issuer", role: "dimension" },
    { key: "account", label: "Account", role: "dimension" },
    { key: "assetClass", label: "Asset class", role: "dimension" },
    { key: "sector", label: "GICS sector", role: "dimension" },
    { key: "industry", label: "GICS industry", role: "dimension" },
    { key: "region", label: "Region", role: "dimension" },
    { key: "country", label: "Country of risk", role: "dimension", help: "ISO 3166 two-letter code" },
    { key: "instrumentGroup", label: "Instrument group", role: "dimension" },
    { key: "entity", label: "Entity", role: "dimension" },
    { key: "ticker", label: "Ticker", role: "dimension" },
    { key: "stage", label: "Screening stage", role: "dimension", help: "House, Non SI, Top Down, Bottom Up or Target Fund" },
    { key: "alignment", label: "Alignment", role: "dimension", help: "1.5C, <2C, >2C, >2.5C or Not Rated" },
    { key: "rating", label: "ESG rating (period end)", role: "dimension" },
    { key: "ratingStart", label: "ESG rating (period start)", role: "dimension" },
    { key: "ratingMove", label: "Rating movement", role: "dimension", help: "Upgraded, Downgraded or Unchanged" },
    { key: "marketValue", label: "Market value", role: "measure", format: "currency" },
    { key: "coveredMv", label: "Covered market value", role: "measure", format: "currency" },
    { key: "nav", label: "NAV", role: "measure", format: "currency" },
    { key: "positions", label: "Positions", role: "measure", help: "1 per row" },
    { key: "issuers", label: "Issuers", role: "measure", help: "1 on the first row of each issuer, else 0" },
    { key: "weight", label: "Weight %", role: "measure", format: "percent" },
    { key: "keyIssue", label: "Weighted-average key issue score", role: "measure" },
    { key: "corpScore", label: "Industry-adjusted corporate score", role: "measure" },
    { key: "envScore", label: "Environmental pillar score", role: "measure" },
    { key: "socScore", label: "Social pillar score", role: "measure" },
    { key: "govScore", label: "Governance pillar score", role: "measure" },
    { key: "relKeyIssue", label: "Key issue score vs portfolio", role: "measure" },
    { key: "relEnv", label: "Environmental score vs portfolio", role: "measure" },
    { key: "relSoc", label: "Social score vs portfolio", role: "measure" },
    { key: "relGov", label: "Governance score vs portfolio", role: "measure" },
    { key: "scope1", label: "Scope 1 emissions", role: "measure", help: "tCO2e, period end" },
    { key: "scope2", label: "Scope 2 emissions", role: "measure", help: "tCO2e" },
    { key: "scope3", label: "Scope 3 emissions", role: "measure", help: "tCO2e" },
    { key: "totalScope12", label: "Total scope 1 & 2 emissions", role: "measure", help: "tCO2e" },
    { key: "intensityEvic", label: "Scope 1 & 2 intensity (EVIC)", role: "measure" },
    { key: "intensityRev", label: "Scope 1 & 2 intensity (revenue)", role: "measure" },
    { key: "temperature", label: "Implied temperature", role: "measure", help: "degrees C" },
    { key: "carbonCoverage", label: "Carbon coverage %", role: "measure", format: "percent" },
    { key: "scope1Start", label: "Scope 1 emissions (period start)", role: "measure" },
    { key: "scope1Pct", label: "Scope 1 change %", role: "measure", format: "percent" },
    { key: "eScoreStart", label: "E score (period start)", role: "measure" },
    { key: "socStart", label: "S score (period start)", role: "measure" },
    { key: "govStart", label: "G score (period start)", role: "measure" },
    { key: "corpStart", label: "Corporate score (period start)", role: "measure" },
    { key: "posFlag", label: "Positive flag change", role: "measure" },
    { key: "negFlag", label: "Negative flag change", role: "measure" },
    { key: "controversy", label: "Controversies change", role: "measure" },
    { key: "scope1Trend", label: "Scope 1 trend", role: "dimension", help: "Nine monthly values separated by commas, Jan to Sep" },
    { key: "eTrend", label: "E score trend", role: "dimension", help: "Nine monthly values separated by commas, Jan to Sep" },
  ],
  rows,
});

/* ── ESG trend: one row per account, periodicity and period ── */
const TREND_PERIODS: Record<string, string[]> = {
  Monthly: ["Aug 24", "Sep 24", "Oct 24", "Nov 24", "Dec 24"],
  Quarterly: ["Q1 24", "Q2 24", "Q3 24", "Q4 24"],
  Yearly: ["2021", "2022", "2023", "2024"],
};
export const SI_PERIODICITIES = Object.keys(TREND_PERIODS);

function buildEsgTrend(securities: DataRow[]): DataRow[] {
  const rand = seeded(7_042);
  const rows: DataRow[] = [];
  for (const account of SI_ACCOUNTS) {
    const own = securities.filter((r) => r.account === account);
    const mv = own.reduce((a, r) => a + (r.marketValue as number), 0);
    const end = (field: string): number => own.reduce((a, r) => a + (r[field] as number) * (r.marketValue as number), 0) / mv;
    for (const [periodicity, periods] of Object.entries(TREND_PERIODS)) {
      /* Scores drift up into the latest period; a longer horizon starts lower. */
      const span = periodicity === "Yearly" ? 1.1 : periodicity === "Quarterly" ? 0.6 : 0.3;
      periods.forEach((period, i) => {
        const back = (periods.length - 1 - i) / (periods.length - 1);
        const at = (field: string): number => round(clamp(end(field) - span * back + (i === periods.length - 1 ? 0 : (rand() - 0.5) * 0.25), 0, 10));
        rows.push({ account, periodicity, period, order: i + 1, marketValue: mv, envScore: at("envScore"), socScore: at("socScore"), govScore: at("govScore"), esgScore: at("keyIssue") });
      });
    }
  }
  return rows;
}

const ESG_TREND_TABLE = (rows: DataRow[]): DataTable => ({
  id: "esgTrend",
  label: "ESG trend",
  grain: "One row per account, periodicity and period",
  fields: [
    { key: "account", label: "Account", role: "dimension" },
    { key: "periodicity", label: "Periodicity", role: "dimension", help: SI_PERIODICITIES.join(", ") },
    { key: "period", label: "Period", role: "dimension" },
    { key: "order", label: "Order", role: "measure", help: "Position of the period in its series, from 1" },
    { key: "marketValue", label: "Market value", role: "measure", format: "currency", help: "Weight of the account when accounts are averaged" },
    { key: "envScore", label: "E", role: "measure" },
    { key: "socScore", label: "S", role: "measure" },
    { key: "govScore", label: "G", role: "measure" },
    { key: "esgScore", label: "ESG", role: "measure" },
  ],
  rows,
});

/* ── Screening funnel: the universe, then what each screen removes ── */
const FUNNEL_TABLE: DataTable = {
  id: "screeningFunnel",
  label: "Screening funnel",
  grain: "One row per screening step",
  fields: [
    { key: "step", label: "Step", role: "dimension" },
    { key: "order", label: "Order", role: "measure" },
    { key: "securities", label: "Securities", role: "measure", help: "The universe, then the number each screen removes (negative)" },
  ],
  rows: [
    { step: "Universe", order: 1, securities: 1513 },
    { step: "House", order: 2, securities: -500 },
    { step: "Non SI", order: 3, securities: -200 },
    { step: "Top Down", order: 4, securities: -150 },
    { step: "Bottom Up", order: 5, securities: -150 },
  ],
};

const FX_TABLE: DataTable = {
  id: "fx",
  label: "Currency rates",
  grain: "One row per currency",
  fields: [
    { key: "currency", label: "Currency", role: "dimension" },
    { key: "rate", label: "Rate", role: "measure", help: "Units of this currency per 1 GBP" },
  ],
  rows: FX_RATES,
};

let cached: ReportDataset | null = null;

export function sustainableDataset(): ReportDataset {
  if (cached) return cached;
  const securities = buildSecurities();
  cached = {
    id: SUSTAINABLE_DATASET_ID,
    label: "Sustainable investment",
    baseCurrency: "GBP",
    tables: [SECURITIES_TABLE(securities), ESG_TREND_TABLE(buildEsgTrend(securities)), FUNNEL_TABLE, FX_TABLE],
  };
  return cached;
}
