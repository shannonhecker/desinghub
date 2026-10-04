/* Template ids and a one-line summary of each, with no other imports: the
   chat route declares them to the model (tool enum + system prompt) and must
   not pull the templates themselves, with their sample data, onto the
   server. `builderTemplates.ts` re-exports the id list and a test keeps the
   summaries in step with the templates. */

/* Source-of-truth list of valid template ids. Both the type and the
   runtime allow-list derive from this so a new template can be added
   in one place without drift. The API route uses VALID_TEMPLATE_IDS
   to reject anything else, defending against prompt-injection via the
   templateId field. */
export const VALID_TEMPLATE_IDS = [
  "analytics-dashboard",
  "settings-page",
  "crm-contacts",
  "login-flow",
  "landing-page",
  "risk-analytics",
  "performance-analytics",
  "esg-analytics",
  "climate-analytics",
  "screening",
  "screening-changes",
  "issuer-climate",
  "issuer-involvement",
  "issuer-controversies",
  "entity-comparison",
  "governance-scorecard",
  "analytics-home",
  "fx-execution",
] as const;

export type TemplateId = (typeof VALID_TEMPLATE_IDS)[number];

/** What each template is, for the model: when to offer or apply it. */
export const TEMPLATE_SUMMARIES: Record<TemplateId, string> = {
  "analytics-dashboard": "Analytics Dashboard - scope bar, KPI row, revenue trend, supporting charts and an orders table",
  "settings-page": "Settings Page - profile, notifications, members, billing, security and a danger zone",
  "crm-contacts": "CRM Contacts - saved views, KPI strip, search and filters, pipeline charts and a contacts table",
  "login-flow": "Login → Dashboard - a centred sign-in card with SSO and email/password, paired with the post-login dashboard",
  "landing-page": "Landing Page - hero, stats, features, testimonials, pricing, FAQ and a closing call to action",
  "risk-analytics":
    "Risk Analytics (finance, data-driven) - a risk summary grid by fund, market value and risk contribution charts, top issuers, value at risk over time; currency filter; selecting a fund in the grid filters the charts",
  "esg-analytics":
    "ESG Analytics (finance, data-driven) - an ESG summary grid by account that drives four score gauges, a rating distribution, a dimension breakdown, an E/S/G trend and top / bottom contributor rankings; currency and periodicity filters; has a left sidebar",
  "climate-analytics":
    "Climate Analytics (finance, data-driven) - an emissions summary grid with grouped headers that drives alignment, emissions, intensity and contribution charts, a dimension breakdown and carbon rankings; currency filter",
  screening:
    "Screening (finance, data-driven) - a screening waterfall whose bars filter the security universe grid, and a detail panel for the selected security",
  "screening-changes":
    "Screening Changes (finance, data-driven) - a period-change grid with flag chips, emissions sparklines, rating badges and score heat cells, and a detail panel for the selected security",
  "issuer-climate":
    "Issuer Climate (finance, data-driven) - one issuer's emissions against a benchmark, its net-zero pathway corridor, an alignment verdict card, scope emissions and two peer rankings; an Entity filter chooses the issuer",
  "issuer-involvement":
    "Issuer Business Involvement (finance, data-driven) - five involvement count tiles, a grouped detail grid and a peer radar for one issuer; Entity filter",
  "issuer-controversies":
    "Issuer Controversies (finance, data-driven) - three controversy score tiles and a severity grid grouped by pillar for one issuer; Entity filter",
  "entity-comparison":
    "Entity Comparison (finance, data-driven) - two issuers side by side: summary cards, an involvement radar, ESG scores, a rating trend, emissions and controversies; Entity and Compare with filters",
  "governance-scorecard":
    "Governance Scorecard (finance, data-driven) - four category cards that filter positive and negative indicator grids, and a reference grid, for one issuer; Entity filter",
  "fx-execution":
    "FX Execution (finance, data-driven) - one algo order worked through a session: a chart of market, limit price, fills by venue and percent done with its own interval, chart type, overlay and range controls; an order statistics list, a passive / aggressive gauge and a venue donut; two orders to switch between",
  "analytics-home":
    "Analytics Home (finance) - a start page: a hero with search, four launcher cards that open the report templates, and a filterable list of dashboards",
  "performance-analytics":
    "Performance Analytics (finance, data-driven) - a results grid by account over 1M/3M/YTD/1Y against benchmark, a breakdown grid, returns chart, allocation donut, allocation history, investment trend; fee type, currency, periodicity and benchmark filters",
};
