import type { Block, InterfaceType, ZoneLayout, ZoneId } from "@/store/useBuilder";
import {
  analyticsKpis,
  analyticsRevenueTrend,
  analyticsSignupsByChannel,
  analyticsRevenueByPlan,
  analyticsOrders,
  crmKpis,
  crmContacts as crmContactsData,
  settingsProfile,
  settingsNotifications,
  landingBrand,
  landingHero,
  landingFeatures,
  landingStats,
  landingPricing,
  landingTestimonials,
  landingRevenueTrend,
  authContent,
} from "@/lib/sampleData";
import { pickImage, getImageById } from "@/lib/sampleImages";

/* ══════════════════════════════════════════════════════════════
   Builder Templates - realistic full-layout starting points.

   Each template populates all four canvas zones (header, sidebar,
   body, footer) with recognizable content and realistic mock data
   rather than empty labels. Clicking a pattern card in the hero
   applies one of these templates instantly - no wizard prompts.

   Zone contracts (enforced by UI):
   - headerBlocks   → AppBrand | StatusPill
   - sidebarBlocks  → NavItem (icon: chat|database|settings|bar_chart|home|person|search|notifications)
   - blocks (body)  → any simulated component type; layout.width
                      accepts "fill" / "auto" / "{N}px" / "{N}%" /
                      "{N}fr". Legacy props.colSpan still accepted
                      via the resolver but this file uses the new
                      layout.width shape.
   - footerBlocks   → FooterText
   ══════════════════════════════════════════════════════════════ */

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
] as const;

export type TemplateId = typeof VALID_TEMPLATE_IDS[number];

export interface BuilderTemplate {
  id: TemplateId;
  label: string;
  /** One-line description shown on the pattern card. */
  desc: string;
  /** Material Symbol name for the pattern card icon. */
  icon: string;
  /** Stored in useBuilder.interfaceType so existing machinery keeps working. */
  interfaceType: InterfaceType;
  /** Component IDs, kept in sync with blocks for the library/chip UI. */
  selectedComponents: string[];
  /** Zone block arrays - applied directly to the canvas state. */
  header: Block[];
  sidebar: Block[];
  body: Block[];
  footer: Block[];
  /** Optional per-zone layout overrides applied on template apply (e.g. a
   *  12-col grid body so patterns render as clean canonical rows instead of
   *  a single wrapping flex row). Zones omitted here reset to the defaults. */
  zoneLayouts?: Partial<Record<ZoneId, ZoneLayout>>;
  /** Assistant chat message shown after the template is applied. */
  aiResponse: string;
}

/* Simple ID factory - templates need stable ids for sortable keys
   even when multiple templates are applied in sequence. */
let tplCounter = 0;
const tid = (prefix: string) => `tpl-${prefix}-${++tplCounter}`;

/* ──────────────────────────────────────────────────────────────
   1. Analytics Dashboard (Mixpanel-style)
   ────────────────────────────────────────────────────────────── */
const analyticsDashboard: BuilderTemplate = {
  id: "analytics-dashboard",
  label: "Analytics Dashboard",
  desc: "KPI row, revenue chart, data table, and activity feed",
  icon: "monitoring",
  interfaceType: "dashboard",
  selectedComponents: ["progress", "table", "buttons"],
  /* 12-col grid body so the canonical rows render cleanly (scope bar 8/2/2,
     KPIs 3/3/3/3, hero 12, charts 6/6, table 12) instead of one wrapping row. */
  zoneLayouts: { body: { mode: "grid", columns: 12, gap: 12 } },
  header: [
    { id: tid("ad-brand"), type: "AppBrand", props: { label: "Acme Analytics" } },
    { id: tid("ad-status"), type: "StatusPill", props: { label: "Live" } },
  ],
  sidebar: [
    { id: tid("ad-nav-1"), type: "NavItem", props: { label: "Overview", icon: "home", active: true } },
    { id: tid("ad-nav-2"), type: "NavItem", props: { label: "Events", icon: "bar_chart", active: false } },
    { id: tid("ad-nav-3"), type: "NavItem", props: { label: "Users", icon: "person", active: false } },
    { id: tid("ad-nav-4"), type: "NavItem", props: { label: "Funnels", icon: "database", active: false } },
    { id: tid("ad-nav-5"), type: "NavItem", props: { label: "Settings", icon: "settings", active: false } },
  ],
  body: [
    /* Section heading - full width (own row). Inline date-range + export
       scope controls deferred to a proper header scope-bar slice. */
    { id: tid("ad-title"), type: "SimulatedTitle", props: { text: "Revenue overview", level: "h3" }, layout: { width: "12fr" } },
    /* KPI row - 4 cards (3 cols each), lead metric first. label + value come
       from the shared analyticsKpis dataset; the `pct` here drives the card's
       progress bar (a fill width, not the signed delta), so it stays a sensible
       0-100 magnitude rather than the dataset's period-over-period delta. */
    { id: tid("ad-kpi-1"), type: "SimulatedStatCard", props: { label: analyticsKpis[0].label, value: analyticsKpis[0].value, pct: 72 }, layout: { width: "3fr" } },
    { id: tid("ad-kpi-2"), type: "SimulatedStatCard", props: { label: analyticsKpis[1].label, value: analyticsKpis[1].value, pct: 64 }, layout: { width: "3fr" } },
    { id: tid("ad-kpi-3"), type: "SimulatedStatCard", props: { label: analyticsKpis[2].label, value: analyticsKpis[2].value, pct: 21 }, layout: { width: "3fr" } },
    { id: tid("ad-kpi-4"), type: "SimulatedStatCard", props: { label: analyticsKpis[3].label, value: analyticsKpis[3].value, pct: 38 }, layout: { width: "3fr" } },
    /* Hero trend - full width (12 cols), headline metric vs previous period */
    { id: tid("ad-hero"), type: "HighchartArea", props: { chartType: "area", title: "Revenue, last 30 days vs previous", categories: analyticsRevenueTrend.categories, series: analyticsRevenueTrend.series }, layout: { width: "12fr" } },
    /* 2-up supporting row - 6/6 */
    { id: tid("ad-chart-2"), type: "HighchartColumn", props: { chartType: "column", title: "Signups by channel", categories: analyticsSignupsByChannel.categories, series: analyticsSignupsByChannel.series }, layout: { width: "6fr" } },
    { id: tid("ad-chart-3"), type: "HighchartDonut", props: { chartType: "donut", title: "Revenue by plan", seriesData: analyticsRevenueByPlan }, layout: { width: "6fr" } },
    /* Detail table - 12 cols, kept LAST so the granular view follows the KPI + chart overview (canonical reading order) */
    { id: tid("ad-table"), type: "SimulatedDataTable", props: { columns: analyticsOrders.columns, rows: analyticsOrders.rows }, layout: { width: "12fr" } },
  ],
  footer: [
    { id: tid("ad-ftr"), type: "FooterText", props: { label: "Last updated 2 min ago", version: "v2.4" } },
  ],
  aiResponse:
    "Built an **Analytics Dashboard** with a KPI row (MRR, active users, churn), a revenue chart, a recent-activity table, and a daily-events breakdown. Ask me to regenerate the data, swap chart types, add a funnel view, or try it in a different design system.",
};

/* ──────────────────────────────────────────────────────────────
   2. Settings Page (Notion-style)
   ────────────────────────────────────────────────────────────── */
const settingsPage: BuilderTemplate = {
  id: "settings-page",
  label: "Settings Page",
  desc: "Grouped sections with toggles, inputs, and a danger zone",
  icon: "settings",
  interfaceType: "form",
  selectedComponents: ["inputs", "switches", "buttons", "form-field"],
  /* 12-col grid body so settings render as a clean vertical form (each section
     heading + setting on its own row) instead of a scattered wrapping flex row. */
  zoneLayouts: { body: { mode: "grid", columns: 12, gap: 12 } },
  header: [
    { id: tid("sp-brand"), type: "AppBrand", props: { label: "Workspace" } },
    { id: tid("sp-status"), type: "StatusPill", props: { label: "Saved" } },
  ],
  sidebar: [
    { id: tid("sp-nav-1"), type: "NavItem", props: { label: "Profile", icon: "person", active: true } },
    { id: tid("sp-nav-2"), type: "NavItem", props: { label: "Notifications", icon: "notifications", active: false } },
    { id: tid("sp-nav-3"), type: "NavItem", props: { label: "Security", icon: "settings", active: false } },
    { id: tid("sp-nav-4"), type: "NavItem", props: { label: "Workspace", icon: "database", active: false } },
    { id: tid("sp-nav-5"), type: "NavItem", props: { label: "Billing", icon: "home", active: false } },
  ],
  body: [
    /* Profile section - heading (own row) -> avatar + change-photo row -> fields (own rows) */
    { id: tid("sp-t1"), type: "SimulatedTitle", props: { text: "Profile", level: "h3" }, layout: { width: "12fr" } },
    { id: tid("sp-avatar"), type: "SimulatedAvatar", props: { initials: settingsProfile.initials, src: getImageById(settingsProfile.avatarId)?.url, size: "lg", presence: "available" }, layout: { width: "2fr" } },
    { id: tid("sp-btn-photo"), type: "SimulatedButton", props: { label: "Change photo", variant: "secondary" }, layout: { width: "4fr" } },
    { id: tid("sp-name"), type: "SimulatedTextInput", props: { label: "Full name", placeholder: settingsProfile.fullName }, layout: { width: "12fr" } },
    { id: tid("sp-email"), type: "SimulatedTextInput", props: { label: "Work email", placeholder: settingsProfile.email }, layout: { width: "12fr" } },

    /* Preferences section - one setting per row (label left / switch right) */
    { id: tid("sp-t2"), type: "SimulatedTitle", props: { text: "Preferences", level: "h3" }, layout: { width: "12fr" } },
    { id: tid("sp-sw-1"), type: "SimulatedSwitch", props: { label: settingsNotifications[0].label, defaultOn: settingsNotifications[0].defaultOn }, layout: { width: "12fr" } },
    { id: tid("sp-sw-2"), type: "SimulatedSwitch", props: { label: settingsNotifications[1].label, defaultOn: settingsNotifications[1].defaultOn }, layout: { width: "12fr" } },
    { id: tid("sp-sw-3"), type: "SimulatedSwitch", props: { label: settingsNotifications[3].label, defaultOn: settingsNotifications[3].defaultOn }, layout: { width: "12fr" } },

    /* Danger zone - isolated last */
    { id: tid("sp-t3"), type: "SimulatedTitle", props: { text: "Danger zone", level: "h3" }, layout: { width: "12fr" } },
    { id: tid("sp-alert"), type: "Alert", props: { title: "Delete account", message: "This permanently removes your workspace and cannot be undone.", variant: "error" }, layout: { width: "12fr" } },
    { id: tid("sp-btn-delete"), type: "SimulatedButton", props: { label: "Delete account", variant: "ghost" }, layout: { width: "4fr" } },
  ],
  footer: [
    { id: tid("sp-ftr"), type: "FooterText", props: { label: "Changes save automatically", version: "v1.0" } },
  ],
  aiResponse:
    "Built a **Settings Page** with grouped sections - Profile (avatar + name + email), Preferences (three toggles), and a Danger Zone with a delete alert. Ask me to add a section, change the nav items, or switch design systems.",
};

/* ──────────────────────────────────────────────────────────────
   3. CRM Contacts / Data Explorer (Linear-style)
   ────────────────────────────────────────────────────────────── */
const crmContacts: BuilderTemplate = {
  id: "crm-contacts",
  label: "CRM Contacts",
  desc: "Search, filters, rich data table, and pipeline stats",
  icon: "contacts",
  interfaceType: "dashboard",
  selectedComponents: ["table", "inputs", "buttons", "progress"],
  /* 12-col grid body: toolbar (search 8 / filter 4) -> KPI summary 4/4/4 -> table 12. */
  zoneLayouts: { body: { mode: "grid", columns: 12, gap: 12 } },
  header: [
    { id: tid("crm-brand"), type: "AppBrand", props: { label: "Contacts" } },
    { id: tid("crm-status"), type: "StatusPill", props: { label: "247 records" } },
  ],
  sidebar: [
    { id: tid("crm-nav-1"), type: "NavItem", props: { label: "All Contacts", icon: "person", active: true } },
    { id: tid("crm-nav-2"), type: "NavItem", props: { label: "Companies", icon: "database", active: false } },
    { id: tid("crm-nav-3"), type: "NavItem", props: { label: "Deals", icon: "bar_chart", active: false } },
    { id: tid("crm-nav-4"), type: "NavItem", props: { label: "Activities", icon: "chat", active: false } },
    { id: tid("crm-nav-5"), type: "NavItem", props: { label: "Reports", icon: "home", active: false } },
  ],
  body: [
    /* Search + filter row */
    { id: tid("crm-search"), type: "SimulatedSearchbox", props: { placeholder: "Search by name, company, email..." }, layout: { width: "8fr" } },
    { id: tid("crm-filter"), type: "SimulatedDropdown", props: { placeholder: "All statuses" }, layout: { width: "4fr" } },
    /* Pipeline KPIs - overview first, before the detailed table (standard
       dashboard reading order). label + value from the shared crmKpis dataset;
       `pct` is the card's progress-bar fill width (a 0-100 magnitude), not the
       dataset's signed period-over-period delta. */
    { id: tid("crm-kpi-1"), type: "SimulatedStatCard", props: { label: crmKpis[0].label, value: crmKpis[0].value, pct: 30 }, layout: { width: "4fr" } },
    { id: tid("crm-kpi-2"), type: "SimulatedStatCard", props: { label: crmKpis[1].label, value: crmKpis[1].value, pct: 74 }, layout: { width: "4fr" } },
    { id: tid("crm-kpi-3"), type: "SimulatedStatCard", props: { label: crmKpis[2].label, value: crmKpis[2].value, pct: 58 }, layout: { width: "4fr" } },
    /* Main data table - 12 cols, last. columns + rows come from crmContacts so
       resolveCell matches each cell by its header key (Name/Company/Status/...). */
    { id: tid("crm-table"), type: "SimulatedDataTable", props: { columns: crmContactsData.columns, rows: crmContactsData.rows }, layout: { width: "12fr" } },
  ],
  footer: [
    { id: tid("crm-ftr"), type: "FooterText", props: { label: "Showing 247 of 1,247 contacts", version: "v3.2" } },
  ],
  aiResponse:
    "Built a **CRM Contacts** view with search, a status filter, a realistic contacts table, and a pipeline-stats row (new-this-week, active leads, deals closed). Ask me to add a detail drawer, filter chips, or change the pipeline metrics.",
};

/* ──────────────────────────────────────────────────────────────
   4. Login → Dashboard (full flow)
   ────────────────────────────────────────────────────────────── */
const loginFlow: BuilderTemplate = {
  id: "login-flow",
  label: "Login → Dashboard",
  desc: "Auth card with inputs and OAuth, paired with the post-login dashboard",
  icon: "login",
  interfaceType: "form",
  selectedComponents: ["inputs", "buttons", "sim-title"],
  /* 12-col grid body: single-column auth form, each field its own row;
     remember (8) + forgot link (4) share a row. */
  zoneLayouts: { body: { mode: "grid", columns: 12, gap: 12 } },
  header: [
    { id: tid("lf-brand"), type: "AppBrand", props: { label: authContent.brand } },
    { id: tid("lf-status"), type: "StatusPill", props: { label: "Secure" } },
  ],
  sidebar: [
    /* Minimal sidebar for the login state - user hasn't authenticated yet */
    { id: tid("lf-nav-1"), type: "NavItem", props: { label: "Sign in", icon: "person", active: true } },
    { id: tid("lf-nav-2"), type: "NavItem", props: { label: "Create account", icon: "home", active: false } },
    { id: tid("lf-nav-3"), type: "NavItem", props: { label: "Help", icon: "chat", active: false } },
  ],
  body: [
    /* Screen 1 - Login (copy + placeholders from the shared authContent set) */
    { id: tid("lf-title"), type: "SimulatedTitle", props: { text: authContent.title, level: "h2" }, layout: { width: "12fr" } },
    { id: tid("lf-sub"), type: "SimulatedTitle", props: { text: authContent.subtitle, level: "h4" }, layout: { width: "12fr" } },
    { id: tid("lf-email"), type: "SimulatedTextInput", props: { label: "Work email", placeholder: authContent.emailPlaceholder }, layout: { width: "12fr" } },
    { id: tid("lf-pass"), type: "SimulatedTextInput", props: { label: "Password", placeholder: authContent.passwordPlaceholder }, layout: { width: "12fr" } },
    { id: tid("lf-remember"), type: "SimulatedCheckbox", props: { label: "Keep me signed in for 30 days", defaultChecked: false }, layout: { width: "8fr" } },
    { id: tid("lf-forgot"), type: "SimulatedLink", props: { text: "Forgot password?", showIcon: false }, layout: { width: "4fr" } },
    { id: tid("lf-signin"), type: "SimulatedButton", props: { label: "Sign in", variant: "primary" }, layout: { width: "12fr" } },
    { id: tid("lf-google"), type: "SimulatedButton", props: { label: authContent.oauth[0], variant: "outline" }, layout: { width: "12fr" } },
    { id: tid("lf-github"), type: "SimulatedButton", props: { label: authContent.oauth[1], variant: "outline" }, layout: { width: "12fr" } },
    /* Flow hint - connects to the post-login dashboard */
    { id: tid("lf-alert"), type: "Alert", props: { title: "After sign-in", message: "Ask me to 'show the dashboard' and I'll swap in where users land after authenticating.", variant: "info" }, layout: { width: "12fr" } },
  ],
  footer: [
    { id: tid("lf-ftr"), type: "FooterText", props: { label: `© 2026 ${authContent.brand}, Inc.`, version: "Privacy · Terms" } },
  ],
  aiResponse:
    "Built a **Login** screen with email + password, two OAuth buttons (Google, GitHub), a remember-me checkbox, and a forgot-password link. Say **'show the dashboard'** and I'll swap in the post-login landing page for the full flow.",
};

/* ──────────────────────────────────────────────────────────────
   5. Landing Page (marketing — full-width, top nav)
   Layout structure from the Finpay reference (top nav, hero with a
   product visual, feature trio, social-proof stats, a trend chart,
   pricing, closing CTA). Built from OUR blocks/tokens — no left
   sidebar, so it renders full-width via the showSidebar gate.
   ────────────────────────────────────────────────────────────── */
const landingPage: BuilderTemplate = {
  id: "landing-page",
  label: "Landing Page",
  desc: "Marketing page: hero, features, stats, pricing, and a closing CTA",
  icon: "rocket_launch",
  interfaceType: "landing",
  selectedComponents: ["sim-title", "buttons", "cards", "progress"],
  zoneLayouts: { body: { mode: "grid", columns: 12, gap: 16 } },
  /* Top nav: brand + nav links + a primary CTA (rendered horizontally). */
  header: [
    { id: tid("lp-brand"), type: "AppBrand", props: { label: landingBrand } },
    { id: tid("lp-nav-1"), type: "SimulatedLink", props: { text: "Product", showIcon: false } },
    { id: tid("lp-nav-2"), type: "SimulatedLink", props: { text: "Pricing", showIcon: false } },
    { id: tid("lp-nav-3"), type: "SimulatedLink", props: { text: "Customers", showIcon: false } },
    { id: tid("lp-cta"), type: "SimulatedButton", props: { label: landingHero.primaryCta, variant: "primary" } },
  ],
  sidebar: [],
  body: [
    /* Hero: headline + supporting visual, then subtitle + email capture.
       Copy + hero image come from the shared landingHero set. */
    { id: tid("lp-hero-title"), type: "SimulatedTitle", props: { text: landingHero.headline, level: "h1" }, layout: { width: "7fr" } },
    { id: tid("lp-hero-img"), type: "SimulatedImage", props: { alt: getImageById(landingHero.heroImageId)?.alt ?? "Product preview", ratio: "4:3", caption: "", src: getImageById(landingHero.heroImageId)?.url ?? pickImage("hero").url }, layout: { width: "5fr" } },
    { id: tid("lp-hero-sub"), type: "SimulatedTitle", props: { text: landingHero.subhead, level: "h4" }, layout: { width: "7fr" } },
    { id: tid("lp-hero-email"), type: "SimulatedTextInput", props: { label: "", placeholder: "Your work email" }, layout: { width: "5fr" } },
    { id: tid("lp-hero-btn"), type: "SimulatedButton", props: { label: landingHero.primaryCta, variant: "primary" }, layout: { width: "3fr" } },
    /* Feature trio (from landingFeatures). */
    { id: tid("lp-feat-title"), type: "SimulatedTitle", props: { text: "Built to grow with you", level: "h3" }, layout: { width: "12fr" } },
    { id: tid("lp-feat-1"), type: "SimulatedCard", props: { title: landingFeatures[0].title, content: landingFeatures[0].body }, layout: { width: "4fr" } },
    { id: tid("lp-feat-2"), type: "SimulatedCard", props: { title: landingFeatures[1].title, content: landingFeatures[1].body }, layout: { width: "4fr" } },
    { id: tid("lp-feat-3"), type: "SimulatedCard", props: { title: landingFeatures[2].title, content: landingFeatures[2].body }, layout: { width: "4fr" } },
    /* Social-proof stats (from landingStats). pct is the card bar fill width. */
    { id: tid("lp-stat-title"), type: "SimulatedTitle", props: { text: "Teams everywhere trust us", level: "h3" }, layout: { width: "12fr" } },
    { id: tid("lp-stat-1"), type: "SimulatedStatCard", props: { label: landingStats[0].label, value: landingStats[0].value, pct: 78 }, layout: { width: "4fr" } },
    { id: tid("lp-stat-2"), type: "SimulatedStatCard", props: { label: landingStats[1].label, value: landingStats[1].value, pct: 64 }, layout: { width: "4fr" } },
    { id: tid("lp-stat-3"), type: "SimulatedStatCard", props: { label: landingStats[2].label, value: landingStats[2].value, pct: 92 }, layout: { width: "4fr" } },
    /* Customer voices (from landingTestimonials) - rendered as quote cards. */
    { id: tid("lp-quote-title"), type: "SimulatedTitle", props: { text: "What teams are saying", level: "h3" }, layout: { width: "12fr" } },
    { id: tid("lp-quote-1"), type: "SimulatedCard", props: { title: `${landingTestimonials[0].name}, ${landingTestimonials[0].role}`, content: landingTestimonials[0].quote }, layout: { width: "6fr" } },
    { id: tid("lp-quote-2"), type: "SimulatedCard", props: { title: `${landingTestimonials[1].name}, ${landingTestimonials[1].role}`, content: landingTestimonials[1].quote }, layout: { width: "6fr" } },
    /* Trend chart (from landingRevenueTrend). */
    { id: tid("lp-chart-title"), type: "SimulatedTitle", props: { text: "Steady, predictable growth", level: "h3" }, layout: { width: "12fr" } },
    { id: tid("lp-chart"), type: "HighchartArea", props: { chartType: "area", title: "Revenue, last 6 months", categories: landingRevenueTrend.categories, series: landingRevenueTrend.series }, layout: { width: "12fr" } },
    /* Pricing (from landingPricing). */
    { id: tid("lp-price-title"), type: "SimulatedTitle", props: { text: "Simple pricing", level: "h3" }, layout: { width: "12fr" } },
    { id: tid("lp-price-1"), type: "SimulatedCard", props: { title: `${landingPricing[1].name}, ${landingPricing[1].price}${landingPricing[1].cadence}`, content: landingPricing[1].features.join(", ") + "." }, layout: { width: "6fr" } },
    { id: tid("lp-price-2"), type: "SimulatedCard", props: { title: `${landingPricing[2].name}, ${landingPricing[2].price}`, content: landingPricing[2].features.join(", ") + "." }, layout: { width: "6fr" } },
    /* Closing CTA. */
    { id: tid("lp-cta-title"), type: "SimulatedTitle", props: { text: "Ready to level up?", level: "h2" }, layout: { width: "8fr" } },
    { id: tid("lp-cta-btn"), type: "SimulatedButton", props: { label: landingHero.primaryCta, variant: "primary" }, layout: { width: "4fr" } },
  ],
  footer: [
    { id: tid("lp-ftr"), type: "FooterText", props: { label: `© 2026 ${landingBrand}, Inc.`, version: "Privacy · Terms" } },
  ],
  aiResponse:
    "Built a **Landing Page**: top nav, a hero with email capture, a feature trio, social-proof stats, a growth chart, simple pricing, and a closing CTA. Ask me to swap sections, change the copy, or try it in another design system.",
};

/* ──────────────────────────────────────────────────────────────
   Registry + accessor
   ────────────────────────────────────────────────────────────── */
export const BUILDER_TEMPLATES: Record<TemplateId, BuilderTemplate> = {
  "analytics-dashboard": analyticsDashboard,
  "settings-page": settingsPage,
  "crm-contacts": crmContacts,
  "login-flow": loginFlow,
  "landing-page": landingPage,
};

export function getTemplate(id: TemplateId): BuilderTemplate {
  return BUILDER_TEMPLATES[id];
}

/** Ordered list for the pattern card grid in the hero. */
export const TEMPLATE_ORDER: TemplateId[] = [
  "analytics-dashboard",
  "settings-page",
  "crm-contacts",
  "login-flow",
  "landing-page",
];

/** Used when the Login→Dashboard flow is progressed via chat. */
export function getLoginDashboardBody(): Block[] {
  let i = 0;
  const nid = (p: string) => `tpl-dash-${p}-${++i}`;
  return [
    /* KPI row - 3 × ⅓. The standalone full-width "Welcome back, Sarah"
       stat card was redundant chrome (a greeting forced into a metric
       tile); the post-login dashboard now opens straight on real KPIs. */
    { id: nid("kpi1"), type: "SimulatedStatCard", props: { label: "Tasks", value: "7 open", pct: -2 }, layout: { width: "33.333%" } },
    { id: nid("kpi2"), type: "SimulatedStatCard", props: { label: "Messages", value: "24", pct: 11 }, layout: { width: "33.333%" } },
    { id: nid("kpi3"), type: "SimulatedStatCard", props: { label: "Meetings today", value: "3", pct: 0 }, layout: { width: "33.333%" } },
    { id: nid("chart"), type: "HighchartArea", props: { chartType: "area", title: "Activity - last 7 days" }, layout: { width: "fill" } },
    { id: nid("table"), type: "SimulatedDataTable", props: { }, layout: { width: "fill" } },
  ];
}
