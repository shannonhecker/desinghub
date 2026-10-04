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
  "performance-analytics":
    "Performance Analytics (finance, data-driven) - a results grid by account over 1M/3M/YTD/1Y against benchmark, a breakdown grid, returns chart, allocation donut, allocation history, investment trend; fee type, currency, periodicity and benchmark filters",
};
