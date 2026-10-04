/**
 * issuerDataset - the sample dataset behind the issuer-level report
 * templates (Issuer Climate, Business Involvement, Controversies, Entity
 * Comparison), the Governance Scorecard and the Analytics Home page.
 *
 * Five invented issuers. Everything a page shows about an issuer is a row
 * (or a few rows) of these tables keyed by the issuer's name, so choosing
 * another issuer re-reads the same panels from other rows, and an uploaded
 * workbook redraws the reports. Figures are invented and deterministic.
 */

import { FX_RATES } from "./financeDataset";
import type { DataRow, DataTable, ReportDataset } from "./types";

export const ISSUER_DATASET_ID = "issuer";

const round = (v: number, places = 2): number => Number(v.toFixed(places));

export const RATING_SCALE = ["CCC", "B", "BB", "BBB", "A", "AA", "AAA"] as const;
export const ISSUER_QUARTERS = ["Q1 23", "Q2 23", "Q3 23", "Q4 23", "Q1 24"] as const;
export const PATHWAY_YEARS = [2030, 2032, 2034, 2036, 2038, 2040, 2042, 2044, 2046, 2048, 2050] as const;

interface Issuer {
  name: string; legalName: string; sector: string; industry: string; region: string; country: string;
  isin: string; ticker: string; marketCap: string; marketCapValue: number; rating: (typeof RATING_SCALE)[number];
  /** Emissions scale relative to the base profile. */
  k: number;
  /** Involvement scale. */
  inv: number;
  esg: [esg: number, e: number, s: number, g: number];
  controversy: { environment: number[]; social: number[]; governance: number };
  temperature: number;
  ratingPath: number[];
}

const ISSUERS: Issuer[] = [
  {
    name: "Avocado Inc", legalName: "Avocado Technologies Inc", sector: "Information Technology", industry: "Technology Hardware", region: "North America", country: "US",
    isin: "US0378331005", ticker: "AVCD", marketCap: "Mega", marketCapValue: 2_840_000_000_000, rating: "AA", k: 0.7, inv: 0.2,
    esg: [78, 74, 71, 86], controversy: { environment: [1, 0, 1, 0], social: [2, 1, 3, 1], governance: 1 }, temperature: 1.6, ratingPath: [4, 4, 5, 5, 5],
  },
  {
    name: "Brightline Telecom", legalName: "Brightline Telecom Group Plc", sector: "Communication Services", industry: "Diversified Telecommunication", region: "Europe", country: "GB",
    isin: "GB0030913577", ticker: "BRTL", marketCap: "Large", marketCapValue: 18_600_000_000, rating: "A", k: 1.0, inv: 0.5,
    esg: [69, 66, 72, 70], controversy: { environment: [0, 1, 0, 0], social: [1, 2, 2, 0], governance: 2 }, temperature: 1.9, ratingPath: [3, 3, 4, 4, 4],
  },
  {
    name: "Helios Energy", legalName: "Helios Energy SA", sector: "Energy", industry: "Oil, Gas & Consumable Fuels", region: "Europe", country: "FR",
    isin: "FR0000120271", ticker: "HLEN", marketCap: "Large", marketCapValue: 96_400_000_000, rating: "BB", k: 3.4, inv: 2.6,
    esg: [48, 36, 55, 58], controversy: { environment: [4, 6, 3, 5], social: [2, 1, 3, 2], governance: 4 }, temperature: 2.9, ratingPath: [3, 2, 2, 2, 2],
  },
  {
    name: "Northwind Pharma", legalName: "Northwind Pharmaceuticals AG", sector: "Health Care", industry: "Pharmaceuticals", region: "Europe", country: "CH",
    isin: "CH0012005267", ticker: "NWPH", marketCap: "Large", marketCapValue: 184_000_000_000, rating: "AAA", k: 0.5, inv: 0.3,
    esg: [84, 80, 83, 88], controversy: { environment: [0, 0, 1, 1], social: [1, 3, 0, 1], governance: 0 }, temperature: 1.5, ratingPath: [5, 5, 5, 6, 6],
  },
  {
    name: "Meridian Banc", legalName: "Meridian Bancorp Ltd", sector: "Financials", industry: "Banks", region: "Asia Pacific", country: "AU",
    isin: "AU000000MBC4", ticker: "MBNC", marketCap: "Mid", marketCapValue: 9_300_000_000, rating: "BBB", k: 0.9, inv: 1.2,
    esg: [61, 58, 60, 66], controversy: { environment: [0, 1, 0, 0], social: [3, 2, 1, 1], governance: 3 }, temperature: 2.3, ratingPath: [2, 3, 3, 3, 3],
  },
];
export const ISSUER_NAMES = ISSUERS.map((i) => i.name);

const ENV_CATEGORIES = ["Biodiversity", "Energy", "Water", "Toxic Waste"];
const SOC_CATEGORIES = ["Human Rights", "Customer Relations", "Labor Rights", "Supply Chain"];

/* Involvement: [group, activity, base max % revenue, tie threshold]. */
const ACTIVITIES: [string, string, number, number][] = [
  ["Entertainment & Lifestyle", "Adult Entertainment", 0.6, 1.0],
  ["Entertainment & Lifestyle", "Alcohol", 2.4, 1.0],
  ["Entertainment & Lifestyle", "Gambling", 1.1, 1.0],
  ["Fossil Fuels & Energy", "Fossil Fuels", 4.2, 1.0],
  ["Fossil Fuels & Energy", "Nuclear Power", 1.6, 1.0],
  ["Weapons & Defence", "Cluster Munitions", 0.2, 0.4],
  ["Weapons & Defence", "Landmines", 0.1, 0.4],
  ["Weapons & Defence", "Weapons", 1.8, 1.0],
];

/* Base emissions profile, scaled by each issuer's `k`. */
const BASE = { total: 182, mktCap: 96, evic: 74, scope1: 4.2, scope2: 2.6, scope3: 11.4 };
/* Cohort averages, relative to the base. */
const COHORTS: [label: string, set: string, factor: number][] = [
  ["GICS industry average", "GICS industry", 1.25],
  ["Asset class average", "Asset class", 1.05],
  ["Region average", "Region", 0.92],
  ["Sector average", "Sector", 1.4],
];
const SCOPE_COHORTS: [label: string, set: string, factor: number][] = [
  ["GICS industry average", "GICS industry average", 1.25],
  ["Universe average", "Universe average", 1.0],
  ["Region average", "Region average", 0.92],
];
const SUMMARY_METRICS: [label: string, base: number][] = [
  ["Total carbon emissions $/m", BASE.total],
  ["Carbon intensity (mkt cap)", BASE.mktCap],
  ["Carbon intensity (EVIC)", BASE.evic],
];

function buildEntities(): DataRow[] {
  return ISSUERS.map((i) => {
    const aligned = i.temperature <= 2;
    /* The 2030 point of the pathway against its ceiling. */
    const pathPct = round(Math.min(100, (projectedAt(i, 0) / budgetAt(0)) * 100), 0);
    const undershoot = round(budgetAt(0) - projectedAt(i, 0), 1);
    const ties = ACTIVITIES.filter(([, , base, threshold]) => base * i.inv >= threshold);
    const tiesIn = (group: string): number => ties.filter(([g]) => g === group).length;
    const env = i.controversy.environment.reduce((a, b) => a + b, 0);
    const soc = i.controversy.social.reduce((a, b) => a + b, 0);
    return {
      name: i.name, legalName: i.legalName, sector: i.sector, industry: i.industry, region: i.region, country: i.country,
      isin: i.isin, ticker: i.ticker, marketCap: i.marketCap, marketCapValue: i.marketCapValue, asOf: "Dec 2024",
      rating: i.rating,
      temperature: i.temperature,
      alignmentStatus: aligned ? "Aligned" : "Misaligned",
      alignmentLabel: `${i.temperature.toFixed(1)}°C ${aligned ? "aligned" : "misaligned"}`,
      alignmentTone: aligned ? "good" : "bad",
      alignmentCaption: aligned ? "On a credible net-zero pathway" : "Off a credible net-zero pathway",
      pathPct, undershoot, undershootTone: undershoot > 0 ? "good" : "bad",
      esgScore: i.esg[0], envScore: i.esg[1], socScore: i.esg[2], govScore: i.esg[3],
      controversyEnv: env, controversySoc: soc, controversyGov: i.controversy.governance,
      humanRights: i.controversy.social[0], customers: i.controversy.social[1], labourRights: i.controversy.social[2] + i.controversy.social[3],
      involvementHealth: 0,
      involvementEntertainment: tiesIn("Entertainment & Lifestyle"),
      involvementWeapons: tiesIn("Weapons & Defence"),
      involvementEnergy: tiesIn("Fossil Fuels & Energy"),
      involvementPractices: 0,
      positiveFlags: Math.round(i.esg[3] / 8),
      negativeFlags: i.controversy.governance,
    };
  });
}

/* The carbon budget ceiling falls in a straight line to zero in 2050; an
   issuer's projected emissions follow it, scaled by how hot it runs. */
function budgetAt(index: number): number {
  return round(40 * (1 - index / (PATHWAY_YEARS.length - 1)), 1);
}
function projectedAt(issuer: Issuer, index: number): number {
  const ratio = 0.55 + (issuer.temperature - 1.5) * 0.42;
  const tail = issuer.temperature > 2 ? 6 * (index / (PATHWAY_YEARS.length - 1)) : 0;
  return round(Math.max(0, budgetAt(index) * ratio + tail), 1);
}

/** One long table for every "this issuer against something" chart: `chart`
 *  names the chart, `set` says what the row is ("Entity" for the issuer's own
 *  figures, else the benchmark it belongs to), `category` and `series` place
 *  the value. */
function buildSeries(): DataRow[] {
  const rows: DataRow[] = [];
  const push = (entity: string, chart: string, set: string, category: string, series: string, value: number, order: number) =>
    rows.push({ entity, chart, set, category, series, value: round(value), order });

  for (const i of ISSUERS) {
    /* Emissions summary: the issuer and each cohort average, per metric. */
    SUMMARY_METRICS.forEach(([metric, base], m) => {
      push(i.name, "emissionsSummary", "Entity", metric, i.name, base * i.k, m + 1);
      for (const [label, set, factor] of COHORTS) push(i.name, "emissionsSummary", set, metric, label, base * factor * (0.9 + i.k * 0.1), m + 1);
    });
    /* Scope emissions: the issuer beside a chosen average. */
    const scopes: [string, number][] = [["Scope 1", BASE.scope1], ["Scope 2", BASE.scope2], ["Scope 3", BASE.scope3]];
    for (const [scope, base] of scopes) {
      push(i.name, "scopeVsAverage", "Entity", i.name, scope, base * i.k, 1);
      for (const [label, set, factor] of SCOPE_COHORTS) push(i.name, "scopeVsAverage", set, label, scope, base * factor, 2);
      /* The same figures keyed for a comparison between two issuers. */
      push(i.name, "scope", "Entity", i.name, scope, base * i.k, 1);
    }
    /* Involvement radar: max % revenue per activity, and peer aggregates. */
    ACTIVITIES.forEach(([, activity, base], a) => {
      push(i.name, "involvement", "Entity", activity, i.name, base * i.inv, a + 1);
      for (const [label, set, factor] of [["GICS industry peers", "GICS industry", 1.1], ["GICS sector peers", "GICS sector", 0.9], ["Region peers", "Region", 0.75], ["Market cap peers", "Market cap", 1.3]] as [string, string, number][]) {
        push(i.name, "involvement", set, activity, label, base * factor, a + 1);
      }
    });
    /* ESG scores, intensity and the rating trend, for comparisons. */
    (["ESG", "E", "S", "G"] as const).forEach((label, s) => push(i.name, "esgScores", "Entity", label, i.name, i.esg[s], s + 1));
    SUMMARY_METRICS.forEach(([metric, base], m) => push(i.name, "intensity", "Entity", metric, i.name, base * i.k, m + 1));
    ISSUER_QUARTERS.forEach((quarter, q) => push(i.name, "ratingTrend", "Entity", quarter, i.name, i.ratingPath[q], q + 1));
  }
  return rows;
}

function buildPathway(): DataRow[] {
  return ISSUERS.flatMap((i) => PATHWAY_YEARS.map((year, y) => ({ entity: i.name, year: String(year), order: y + 1, budget: budgetAt(y), projected: projectedAt(i, y) })));
}

/* Peer rankings are cohort data: the same for every issuer. */
const PEERS: [cohort: string, entity: string, evic: number, mktCap: number, total: number][] = [
  ["GICS industry", "Quartz Devices", 31, 42, 96], ["GICS industry", "Lumen Circuits", 44, 58, 121], ["GICS industry", "Avocado Inc", 52, 67, 127],
  ["GICS industry", "Orbit Semiconductors", 68, 81, 164], ["GICS industry", "Tessera Systems", 83, 104, 208],
  ["Universe", "Northwind Pharma", 37, 48, 91], ["Universe", "Avocado Inc", 52, 67, 127], ["Universe", "Meridian Banc", 67, 86, 164],
  ["Universe", "Brightline Telecom", 74, 96, 182], ["Universe", "Helios Energy", 252, 326, 619],
];

function buildInvolvement(): DataRow[] {
  return ISSUERS.flatMap((i) =>
    ACTIVITIES.map(([group, activity, base, threshold]) => {
      const revenue = round(base * i.inv);
      const tie = revenue >= threshold;
      return { entity: i.name, group, activity, tie: tie ? "Yes" : "No", maxRevenue: tie ? revenue : null };
    }),
  );
}

function buildControversies(): DataRow[] {
  const split = (n: number): [number, number, number] => {
    const very = Math.floor(n / 4);
    const severe = Math.floor((n - very) / 3);
    return [n - very - severe, severe, very];
  };
  return ISSUERS.flatMap((i) => {
    const rows: DataRow[] = [];
    const add = (pillar: string, category: string | null, n: number) => {
      const [moderate, severe, verySevere] = split(n);
      rows.push({ entity: i.name, pillar, category, total: n, moderate, severe, verySevere });
    };
    ENV_CATEGORIES.forEach((c, k) => add("Environment", c, i.controversy.environment[k]));
    SOC_CATEGORIES.forEach((c, k) => add("Social", c, i.controversy.social[k]));
    /* Governance has no categories of its own: a heading row only. */
    add("Governance", null, i.controversy.governance);
    return rows;
  });
}

/* Scorecard indicators: the same for every issuer. */
const POSITIVE: [category: string, indicator: string, flag: number, value: number, status: string][] = [
  ["Corporate Governance", "Independent board majority", 1, 78, "Met"],
  ["Corporate Governance", "Separate chair and chief executive", 1, 1, "Met"],
  ["Corporate Governance", "Audit committee independence", 1, 100, "Met"],
  ["Corporate Governance", "Board gender diversity above 30%", 0, 27, "Below Target"],
  ["Corporate Governance", "Executive pay linked to sustainability", 1, 20, "In Place"],
  ["Corporate Governance", "Annual director elections", 0, 0, "Not Met"],
  ["Product & Service Mix", "Revenue from clean technology", 1, 18, "Met"],
  ["Product & Service Mix", "Revenue from energy efficiency", 1, 12, "Met"],
  ["Product & Service Mix", "Sustainable product certification", 1, 64, "Met"],
  ["Product & Service Mix", "Circular design programme", 0, 0, "Not Met"],
  ["Product & Service Mix", "Access to essential services", 1, 9, "In Place"],
  ["Product & Service Mix", "Green financing raised", 1, 1400, "Met"],
  ["Product & Service Mix", "Product safety recalls avoided", 1, 0, "Met"],
  ["Product & Service Mix", "Responsible sourcing coverage", 0, 58, "Below Target"],
  ["Product & Service Mix", "Lifecycle assessments published", 1, 31, "Met"],
  ["Operational Risks", "Certified environmental management", 1, 86, "Met"],
  ["Operational Risks", "Supplier audits completed", 0, 41, "Below Target"],
];
const NEGATIVE: [category: string, indicator: string, flag: number, value: string, status: string][] = [
  ["Corporate Governance", "Combined chair and chief executive", 0, "No", "Clear"],
  ["Corporate Governance", "Dual-class share structure", 1, "Yes", "Raised"],
  ["Corporate Governance", "Related-party transactions", 0, "-", "Unknown"],
  ["Corporate Governance", "Auditor tenure above 20 years", 1, "24", "Raised"],
  ["Corporate Governance", "Votes against pay above 20%", 0, "8", "Clear"],
  ["Corporate Governance", "Overboarded directors", 1, "2", "Raised"],
  ["Controversies", "Open regulatory investigations", 1, "3", "Raised"],
  ["Controversies", "Fines in the last three years", 0, "0", "Clear"],
  ["Operational Risks", "Sites in water-stressed areas", 1, "5", "Raised"],
];
export const SCORECARD_CATEGORIES = ["Corporate Governance", "Controversies", "Operational Risks", "Product & Service Mix"] as const;

function buildIndicators(): DataRow[] {
  return [
    ...POSITIVE.map(([category, indicator, flag, value, status]) => ({ category, polarity: "Positive", indicator, flag, value: String(value), status })),
    ...NEGATIVE.map(([category, indicator, flag, value, status]) => ({ category, polarity: "Negative", indicator, flag, value, status })),
  ];
}

function buildCategories(indicators: DataRow[]): DataRow[] {
  return SCORECARD_CATEGORIES.map((category) => ({
    category,
    positive: indicators.filter((r) => r.category === category && r.polarity === "Positive" && r.flag === 1).length,
    negative: indicators.filter((r) => r.category === category && r.polarity === "Negative" && r.flag === 1).length,
  }));
}

function buildReference(): DataRow[] {
  return ISSUERS.flatMap((i) => {
    const row = (group: string, indicator: string, value: string): DataRow => ({ entity: i.name, group, indicator, value });
    return [
      row("Identifiers", "Legal name", i.legalName),
      row("Identifiers", "ISIN", i.isin),
      row("Identifiers", "Ticker", i.ticker),
      row("Identifiers", "Country of domicile", i.country),
      row("Identifiers", "Country of risk", i.country),
      row("Identifiers", "Listing currency", i.country === "GB" ? "GBP" : i.country === "US" ? "USD" : i.country === "AU" ? "AUD" : i.country === "CH" ? "CHF" : "EUR"),
      row("Classification", "GICS sector", i.sector),
      row("Classification", "GICS industry", i.industry),
      row("Classification", "Region", i.region),
      row("Classification", "Market cap band", i.marketCap),
      row("Classification", "ESG rating", i.rating),
      row("Classification", "Alignment", `${i.temperature.toFixed(1)}°C`),
    ];
  });
}

const DASHBOARDS: DataRow[] = [
  { name: "Sustainable Investment Portfolio Report", fusionClass: "Holdings", theme: "Sustainable Investment", description: "ESG, climate and screening views of a portfolio." },
  { name: "Sustainable Investment Issuer Report", fusionClass: "Company", theme: "Sustainable Investment", description: "Climate, involvement and controversies for one issuer." },
  { name: "Performance", fusionClass: "Holdings", theme: "Performance", description: "Multi-period returns against benchmark, with allocation." },
  { name: "Risk", fusionClass: "Holdings", theme: "Risk", description: "Value at risk, exposures and risk contribution." },
  { name: "Screening", fusionClass: "Holdings", theme: "Screening", description: "The screening funnel and the security universe." },
  { name: "Governance Scorecard", fusionClass: "Company", theme: "Other", description: "Positive and negative governance indicators for one issuer." },
];

const dim = (key: string, label: string, help?: string) => ({ key, label, role: "dimension" as const, ...(help ? { help } : {}) });
const mea = (key: string, label: string, help?: string) => ({ key, label, role: "measure" as const, ...(help ? { help } : {}) });

let cached: ReportDataset | null = null;

export function issuerDataset(): ReportDataset {
  if (cached) return cached;
  const indicators = buildIndicators();
  const tables: DataTable[] = [
    {
      id: "entities", label: "Entities", grain: "One row per issuer",
      fields: [
        dim("name", "Entity"), dim("legalName", "Legal name"), dim("sector", "GICS sector"), dim("industry", "GICS industry"), dim("region", "Region"),
        dim("country", "Country of risk", "ISO 3166 two-letter code"), dim("isin", "ISIN"), dim("ticker", "Ticker"), dim("marketCap", "Market cap band"),
        { key: "marketCapValue", label: "Market cap", role: "measure", format: "currency" }, dim("asOf", "As of"), dim("rating", "ESG rating"),
        mea("temperature", "Implied temperature", "degrees C"), dim("alignmentStatus", "Alignment status", "Aligned or Misaligned"), dim("alignmentLabel", "Alignment"),
        dim("alignmentTone", "Alignment tone", "good or bad"), dim("alignmentCaption", "Alignment caption"),
        mea("pathPct", "2030 path as % of ceiling"), mea("undershoot", "Budget undershoot (Mt)"), dim("undershootTone", "Undershoot tone", "good or bad"),
        mea("esgScore", "ESG score"), mea("envScore", "E score"), mea("socScore", "S score"), mea("govScore", "G score"),
        mea("controversyEnv", "Environment controversies"), mea("controversySoc", "Social controversies"), mea("controversyGov", "Governance controversies"),
        mea("humanRights", "Human rights"), mea("customers", "Customers"), mea("labourRights", "Labour rights & supply chain"),
        mea("involvementHealth", "Health and wellness ties"), mea("involvementEntertainment", "Entertainment and lifestyle ties"), mea("involvementWeapons", "Weapons and defence ties"),
        mea("involvementEnergy", "Fossil fuels and energy ties"), mea("involvementPractices", "Business practices ties"),
        mea("positiveFlags", "Positive flags"), mea("negativeFlags", "Negative flags"),
      ],
      rows: buildEntities(),
    },
    {
      id: "issuerSeries", label: "Issuer series", grain: "One row per issuer, chart, set, category and series",
      fields: [
        dim("entity", "Entity"), dim("chart", "Chart", "Which chart the row belongs to"), dim("set", "Set", '"Entity" for the issuer\'s own figures, else the benchmark'),
        dim("category", "Category"), dim("series", "Series"), mea("value", "Value"), mea("order", "Order", "Position of the category, from 1"),
      ],
      rows: buildSeries(),
    },
    {
      id: "pathway", label: "Net-zero pathway", grain: "One row per issuer and year",
      fields: [dim("entity", "Entity"), dim("year", "Year"), mea("order", "Order"), mea("budget", "Carbon budget ceiling (Mt)"), mea("projected", "Projected emissions (Mt)")],
      rows: buildPathway(),
    },
    {
      id: "peers", label: "Peers", grain: "One row per cohort and peer",
      fields: [dim("cohort", "Cohort", "GICS industry or Universe"), dim("entity", "Entity"), mea("evic", "Carbon intensity (EVIC)"), mea("mktCap", "Carbon intensity (mkt cap)"), mea("totalEmissions", "Total carbon emissions")],
      rows: PEERS.map(([cohort, entity, evic, mktCap, totalEmissions]) => ({ cohort, entity, evic, mktCap, totalEmissions })),
    },
    {
      id: "involvement", label: "Business involvement", grain: "One row per issuer and activity",
      fields: [dim("entity", "Entity"), dim("group", "Involvement group"), dim("activity", "Business involvement"), dim("tie", "Any tie", "Yes or No"), mea("maxRevenue", "Maximum % revenue")],
      rows: buildInvolvement(),
    },
    {
      id: "controversies", label: "Controversies", grain: "One row per issuer, pillar and category",
      fields: [dim("entity", "Entity"), dim("pillar", "Pillar"), dim("category", "Category", "Empty for a pillar with no categories"), mea("total", "Total count"), mea("moderate", "Moderate"), mea("severe", "Severe"), mea("verySevere", "Very severe")],
      rows: buildControversies(),
    },
    {
      id: "indicators", label: "Scorecard indicators", grain: "One row per indicator",
      fields: [dim("category", "Category"), dim("polarity", "Polarity", "Positive or Negative"), dim("indicator", "Indicator"), mea("flag", "Flag", "1 when met (positive) or raised (negative)"), dim("value", "Value"), dim("status", "Status")],
      rows: indicators,
    },
    {
      id: "categories", label: "Scorecard categories", grain: "One row per category",
      fields: [dim("category", "Category"), mea("positive", "Positive indicators met"), mea("negative", "Negative indicators raised")],
      rows: buildCategories(indicators),
    },
    {
      id: "reference", label: "Reference", grain: "One row per issuer and reference item",
      fields: [dim("entity", "Entity"), dim("group", "Group", "Identifiers or Classification"), dim("indicator", "Indicator"), dim("value", "Value")],
      rows: buildReference(),
    },
    {
      id: "dashboards", label: "Dashboards", grain: "One row per dashboard",
      fields: [dim("name", "Name"), dim("fusionClass", "Class"), dim("theme", "Theme"), dim("description", "Description")],
      rows: DASHBOARDS,
    },
    {
      id: "fx", label: "Currency rates", grain: "One row per currency",
      fields: [dim("currency", "Currency"), mea("rate", "Rate", "Units of this currency per 1 GBP")],
      rows: FX_RATES,
    },
  ];
  cached = { id: ISSUER_DATASET_ID, label: "Issuer reports", baseCurrency: "GBP", tables };
  return cached;
}
