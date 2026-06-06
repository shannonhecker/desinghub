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
  settingsMembers,
  settingsInvoices,
  settingsBilling,
  landingBrand,
  landingHero,
  landingFeatures,
  landingStats,
  landingPricing,
  landingTestimonials,
  landingRevenueTrend,
  landingFaq,
  analyticsDau,
  analyticsByDevice,
  crmContactsAdded,
  crmByStatus,
  settingsIntegrations,
  landingResources,
  authContent,
} from "@/lib/sampleData";
import { pickImage, getImageById } from "@/lib/sampleImages";

/* ══════════════════════════════════════════════════════════════
   Builder Templates - realistic full-layout starting points.

   Each template populates all four canvas zones (header, sidebar,
   body, footer) with recognizable content and realistic mock data
   rather than empty labels. Clicking a pattern card in the hero
   applies one of these templates instantly - no wizard prompts.

   2026-06-06: enriched to real-product grade (researched best-practice
   structure + content per template). Content stays within block types
   that have a real-DS export mapping; status values stay within the
   tableCells success/warning/neutral pill map. Eyebrow uses a Pill (not
   Badge) and FAQ uses Q/A cards (not Accordion) because those two
   components don't yet accept item props - both noted for the Preview/
   component-coverage pass.

   Zone contracts (enforced by UI):
   - headerBlocks   → AppBrand | StatusPill | (landing: SimulatedLink / SimulatedButton)
   - sidebarBlocks  → NavItem (icon: chat|database|settings|bar_chart|home|person|search|notifications)
   - blocks (body)  → any simulated component type; layout.width
                      accepts "fill" / "auto" / "{N}px" / "{N}%" /
                      "{N}fr".
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
   1. Analytics Dashboard (product analytics — Mixpanel/Amplitude class)
   ────────────────────────────────────────────────────────────── */
const analyticsDashboard: BuilderTemplate = {
  id: "analytics-dashboard",
  label: "Analytics Dashboard",
  desc: "Scope bar, KPI row, revenue trend, supporting charts, and an orders table",
  icon: "monitoring",
  interfaceType: "dashboard",
  selectedComponents: ["progress", "table", "buttons", "inputs"],
  /* 12-col grid body so the canonical rows render cleanly (scope bar 6/3/3,
     KPIs 3/3/3/3, hero 12, charts 6/6, table 12). */
  zoneLayouts: { body: { mode: "grid", columns: 12, gap: 12 } },
  header: [
    { id: tid("ad-brand"), type: "AppBrand", props: { label: "Northwind Analytics" } },
    { id: tid("ad-status"), type: "StatusPill", props: { label: "Live" } },
  ],
  sidebar: [
    { id: tid("ad-nav-1"), type: "NavItem", props: { label: "Overview", icon: "home", active: true } },
    { id: tid("ad-nav-2"), type: "NavItem", props: { label: "Events", icon: "bar_chart", active: false } },
    { id: tid("ad-nav-3"), type: "NavItem", props: { label: "Users", icon: "person", active: false } },
    { id: tid("ad-nav-4"), type: "NavItem", props: { label: "Funnels", icon: "database", active: false } },
    { id: tid("ad-nav-5"), type: "NavItem", props: { label: "Retention", icon: "database", active: false } },
    { id: tid("ad-nav-6"), type: "NavItem", props: { label: "Revenue", icon: "bar_chart", active: false } },
    { id: tid("ad-nav-7"), type: "NavItem", props: { label: "Settings", icon: "settings", active: false } },
  ],
  body: [
    /* Scope bar - section title + date-range + export (canonical dashboard header row) */
    { id: tid("ad-title"), type: "SimulatedTitle", props: { text: "Revenue overview", level: "h3" }, layout: { width: "6fr" } },
    { id: tid("ad-range"), type: "SimulatedDropdown", props: { placeholder: "Last 30 days" }, layout: { width: "3fr" } },
    { id: tid("ad-export"), type: "SimulatedButton", props: { label: "Export CSV", variant: "secondary" }, layout: { width: "3fr" } },
    /* KPI row - 4 cards (3 cols each), lead metric first. label + value from the
       shared analyticsKpis dataset; `pct` drives the card's progress-bar fill
       (a 0-100 magnitude), not the dataset's signed delta. */
    { id: tid("ad-kpi-1"), type: "SimulatedStatCard", props: { label: analyticsKpis[0].label, value: analyticsKpis[0].value, pct: 82 }, layout: { width: "3fr" } },
    { id: tid("ad-kpi-2"), type: "SimulatedStatCard", props: { label: analyticsKpis[1].label, value: analyticsKpis[1].value, pct: 64 }, layout: { width: "3fr" } },
    { id: tid("ad-kpi-3"), type: "SimulatedStatCard", props: { label: analyticsKpis[2].label, value: analyticsKpis[2].value, pct: 24 }, layout: { width: "3fr" } },
    { id: tid("ad-kpi-4"), type: "SimulatedStatCard", props: { label: analyticsKpis[3].label, value: analyticsKpis[3].value, pct: 42 }, layout: { width: "3fr" } },
    /* Hero trend - full width, headline metric vs previous period */
    { id: tid("ad-hero"), type: "HighchartArea", props: { chartType: "area", title: "Revenue, last 30 days vs previous", categories: analyticsRevenueTrend.categories, series: analyticsRevenueTrend.series }, layout: { width: "12fr" } },
    /* Supporting charts - 6/6 */
    { id: tid("ad-chart-2"), type: "HighchartColumn", props: { chartType: "column", title: "Signups by channel", categories: analyticsSignupsByChannel.categories, series: analyticsSignupsByChannel.series }, layout: { width: "6fr" } },
    { id: tid("ad-chart-3"), type: "HighchartDonut", props: { chartType: "donut", title: "Revenue by plan", seriesData: analyticsRevenueByPlan }, layout: { width: "6fr" } },
    /* 2nd chart row: DAU trend + device split, 6/6. */
    { id: tid("ad-chart-4"), type: "HighchartColumn", props: { chartType: "column", title: "Daily active users, last 14 days", categories: analyticsDau.categories, series: analyticsDau.series }, layout: { width: "6fr" } },
    { id: tid("ad-chart-5"), type: "HighchartDonut", props: { chartType: "donut", title: "Sessions by device", seriesData: analyticsByDevice }, layout: { width: "6fr" } },
    /* Detail table - 12 cols, kept LAST (canonical reading order). Order/Customer/
       Plan/Seats/Amount/Status/Date; Status cells render as pills via tableCells. */
    { id: tid("ad-table"), type: "SimulatedDataTable", props: { columns: analyticsOrders.columns, rows: analyticsOrders.rows }, layout: { width: "12fr" } },
  ],
  footer: [
    { id: tid("ad-ftr"), type: "FooterText", props: { label: "Updated 2 min ago", version: "v2.4" } },
  ],
  aiResponse:
    "Built an **Analytics Dashboard** with a scope bar (date range + export), a KPI row (MRR, active users, net MRR churn, activation), a revenue-vs-previous trend, signups-by-channel and revenue-by-plan charts, a DAU + device-split row, and a recent-orders table with status pills. Ask me to regenerate the data, swap chart types, add a funnel, or try it in a different design system.",
};

/* ──────────────────────────────────────────────────────────────
   2. Settings Page (full SaaS settings IA)
   ────────────────────────────────────────────────────────────── */
const settingsPage: BuilderTemplate = {
  id: "settings-page",
  label: "Settings Page",
  desc: "Profile, notifications, members, billing, security, and a danger zone",
  icon: "settings",
  interfaceType: "form",
  selectedComponents: ["inputs", "switches", "buttons", "table", "progress"],
  /* 12-col grid body so settings render as a clean vertical form (each section
     heading + setting on its own row) instead of a scattered wrapping flex row. */
  zoneLayouts: { body: { mode: "grid", columns: 12, gap: 12 } },
  header: [
    { id: tid("sp-brand"), type: "AppBrand", props: { label: "Northwind" } },
    { id: tid("sp-status"), type: "StatusPill", props: { label: "All changes saved" } },
  ],
  sidebar: [
    { id: tid("sp-nav-1"), type: "NavItem", props: { label: "Profile", icon: "person", active: true } },
    { id: tid("sp-nav-2"), type: "NavItem", props: { label: "Notifications", icon: "notifications", active: false } },
    { id: tid("sp-nav-3"), type: "NavItem", props: { label: "Members", icon: "person", active: false } },
    { id: tid("sp-nav-4"), type: "NavItem", props: { label: "Billing", icon: "home", active: false } },
    { id: tid("sp-nav-5"), type: "NavItem", props: { label: "Security", icon: "settings", active: false } },
    { id: tid("sp-nav-6"), type: "NavItem", props: { label: "Integrations", icon: "database", active: false } },
  ],
  body: [
    /* PROFILE */
    { id: tid("sp-t1"), type: "SimulatedTitle", props: { text: "Profile", level: "h3" }, layout: { width: "12fr" } },
    { id: tid("sp-avatar"), type: "SimulatedAvatar", props: { initials: settingsProfile.initials, src: getImageById(settingsProfile.avatarId)?.url, size: "lg", presence: "available" }, layout: { width: "2fr" } },
    { id: tid("sp-btn-photo"), type: "SimulatedButton", props: { label: "Upload photo", variant: "secondary" }, layout: { width: "4fr" } },
    { id: tid("sp-btn-remove"), type: "SimulatedButton", props: { label: "Remove", variant: "ghost" }, layout: { width: "3fr" } },
    /* Current-value fields: `value` renders solid in the read-only Preview (real
       Salt/MUI Input show value); `placeholder` mirrors it so the edit canvas
       (which reads placeholder) stays populated rather than blank. */
    { id: tid("sp-name"), type: "SimulatedTextInput", props: { label: "Full name", value: settingsProfile.fullName, placeholder: settingsProfile.fullName }, layout: { width: "12fr" } },
    { id: tid("sp-email"), type: "SimulatedTextInput", props: { label: "Work email", value: settingsProfile.email, placeholder: settingsProfile.email }, layout: { width: "12fr" } },
    { id: tid("sp-tz"), type: "SimulatedDropdown", props: { placeholder: settingsProfile.timezone }, layout: { width: "12fr" } },

    /* NOTIFICATIONS - one setting per row (label left / switch right) */
    { id: tid("sp-t2"), type: "SimulatedTitle", props: { text: "Notifications", level: "h3" }, layout: { width: "12fr" } },
    { id: tid("sp-sw-1"), type: "SimulatedSwitch", props: { label: settingsNotifications[0].label, defaultOn: settingsNotifications[0].defaultOn }, layout: { width: "12fr" } },
    { id: tid("sp-sw-2"), type: "SimulatedSwitch", props: { label: settingsNotifications[1].label, defaultOn: settingsNotifications[1].defaultOn }, layout: { width: "12fr" } },
    { id: tid("sp-sw-3"), type: "SimulatedSwitch", props: { label: settingsNotifications[2].label, defaultOn: settingsNotifications[2].defaultOn }, layout: { width: "12fr" } },
    { id: tid("sp-sw-4"), type: "SimulatedSwitch", props: { label: settingsNotifications[3].label, defaultOn: settingsNotifications[3].defaultOn }, layout: { width: "12fr" } },
    { id: tid("sp-sw-5"), type: "SimulatedSwitch", props: { label: settingsNotifications[4].label, defaultOn: settingsNotifications[4].defaultOn }, layout: { width: "12fr" } },
    { id: tid("sp-sw-6"), type: "SimulatedSwitch", props: { label: settingsNotifications[5].label, defaultOn: settingsNotifications[5].defaultOn }, layout: { width: "12fr" } },

    /* MEMBERS & ROLES */
    { id: tid("sp-t-mem"), type: "SimulatedTitle", props: { text: "Members & roles", level: "h3" }, layout: { width: "12fr" } },
    { id: tid("sp-mem-search"), type: "SimulatedSearchbox", props: { placeholder: "Search members" }, layout: { width: "8fr" } },
    { id: tid("sp-mem-invite"), type: "SimulatedButton", props: { label: "Invite people", variant: "primary" }, layout: { width: "4fr" } },
    { id: tid("sp-mem-table"), type: "SimulatedDataTable", props: { columns: settingsMembers.columns, rows: settingsMembers.rows }, layout: { width: "12fr" } },
    { id: tid("sp-mem-seats"), type: "SimulatedProgress", props: { label: `${settingsBilling.seatsUsed} of ${settingsBilling.seats} seats used`, value: 72 }, layout: { width: "12fr" } },

    /* BILLING & PLAN */
    { id: tid("sp-t-bill"), type: "SimulatedTitle", props: { text: "Billing & plan", level: "h3" }, layout: { width: "12fr" } },
    { id: tid("sp-bill-card"), type: "SimulatedCard", props: { title: `${settingsBilling.plan} · ${settingsBilling.pricePerSeat}`, content: `${settingsBilling.seats} seats · Renews ${settingsBilling.renews} · ${settingsBilling.billedMonthly} billed monthly` }, layout: { width: "8fr" } },
    { id: tid("sp-bill-upgrade"), type: "SimulatedButton", props: { label: "Upgrade", variant: "secondary" }, layout: { width: "4fr" } },
    { id: tid("sp-bill-table"), type: "SimulatedDataTable", props: { columns: settingsInvoices.columns, rows: settingsInvoices.rows }, layout: { width: "12fr" } },

    /* SECURITY */
    { id: tid("sp-t-sec"), type: "SimulatedTitle", props: { text: "Security", level: "h3" }, layout: { width: "12fr" } },
    { id: tid("sp-sec-2fa"), type: "SimulatedSwitch", props: { label: "Two-factor authentication (Authenticator app)", defaultOn: true }, layout: { width: "12fr" } },
    { id: tid("sp-sec-sso"), type: "Alert", props: { title: "Single sign-on", message: "SAML SSO is available on the Enterprise plan.", variant: "info" }, layout: { width: "12fr" } },

    /* INTEGRATIONS */
    { id: tid("sp-t-int"), type: "SimulatedTitle", props: { text: "Integrations", level: "h3" }, layout: { width: "12fr" } },
    { id: tid("sp-int-1"), type: "SimulatedCard", props: { title: settingsIntegrations[0].name, content: settingsIntegrations[0].desc }, layout: { width: "4fr" } },
    { id: tid("sp-int-2"), type: "SimulatedCard", props: { title: settingsIntegrations[1].name, content: settingsIntegrations[1].desc }, layout: { width: "4fr" } },
    { id: tid("sp-int-3"), type: "SimulatedCard", props: { title: settingsIntegrations[2].name, content: settingsIntegrations[2].desc }, layout: { width: "4fr" } },
    { id: tid("sp-int-key"), type: "SimulatedTextInput", props: { label: "API key", placeholder: "sk_live_****************" }, layout: { width: "8fr" } },
    { id: tid("sp-int-regen"), type: "SimulatedButton", props: { label: "Regenerate", variant: "secondary" }, layout: { width: "4fr" } },

    /* DANGER ZONE - isolated last */
    { id: tid("sp-t3"), type: "SimulatedTitle", props: { text: "Danger zone", level: "h3" }, layout: { width: "12fr" } },
    { id: tid("sp-alert"), type: "Alert", props: { title: "Delete workspace", message: "This permanently removes Northwind, all projects, and member access. This cannot be undone.", variant: "error" }, layout: { width: "12fr" } },
    { id: tid("sp-btn-delete"), type: "SimulatedButton", props: { label: "Delete workspace", variant: "ghost" }, layout: { width: "4fr" } },
  ],
  footer: [
    { id: tid("sp-ftr"), type: "FooterText", props: { label: "Changes save automatically", version: "v2.4.1" } },
  ],
  aiResponse:
    "Built a **Settings Page** with the full SaaS IA - Profile (avatar, name, email, timezone), Notifications (six toggles), Members & roles (search, invite, a members table + seat usage), Billing & plan (current plan card + invoice history), Security (2FA + SSO), Integrations, and a Danger Zone. Ask me to add a section, change the nav, or switch design systems.",
};

/* ──────────────────────────────────────────────────────────────
   3. CRM Contacts / Data Explorer (HubSpot/Salesforce class)
   ────────────────────────────────────────────────────────────── */
const crmContacts: BuilderTemplate = {
  id: "crm-contacts",
  label: "CRM Contacts",
  desc: "Saved views, KPI strip, search + filters, pipeline charts, and a contacts table",
  icon: "contacts",
  interfaceType: "dashboard",
  selectedComponents: ["table", "inputs", "buttons", "segmented", "pill"],
  /* 12-col grid body: views tab (12) -> KPI strip 3/3/3/3 -> toolbar 8/4 ->
     filter chips -> charts 8/4 -> table 12. */
  zoneLayouts: { body: { mode: "grid", columns: 12, gap: 12 } },
  header: [
    { id: tid("crm-brand"), type: "AppBrand", props: { label: "Northwind CRM" } },
    { id: tid("crm-status"), type: "StatusPill", props: { label: "4,812 records" } },
  ],
  sidebar: [
    { id: tid("crm-nav-1"), type: "NavItem", props: { label: "All Contacts", icon: "person", active: true } },
    { id: tid("crm-nav-2"), type: "NavItem", props: { label: "Companies", icon: "database", active: false } },
    { id: tid("crm-nav-3"), type: "NavItem", props: { label: "Deals", icon: "bar_chart", active: false } },
    { id: tid("crm-nav-4"), type: "NavItem", props: { label: "Activities", icon: "chat", active: false } },
    { id: tid("crm-nav-5"), type: "NavItem", props: { label: "Reports", icon: "home", active: false } },
  ],
  body: [
    /* Saved-view tabs */
    { id: tid("crm-views"), type: "SimulatedSegmentedGroup", props: { optionsCsv: "All contacts,My contacts,Unassigned,MQLs", defaultIndex: 0 }, layout: { width: "12fr" } },
    /* KPI strip - 4 cards. label + value from crmKpis; pct = bar fill width. */
    { id: tid("crm-kpi-1"), type: "SimulatedStatCard", props: { label: crmKpis[0].label, value: crmKpis[0].value, pct: 62 }, layout: { width: "3fr" } },
    { id: tid("crm-kpi-2"), type: "SimulatedStatCard", props: { label: crmKpis[1].label, value: crmKpis[1].value, pct: 31 }, layout: { width: "3fr" } },
    { id: tid("crm-kpi-3"), type: "SimulatedStatCard", props: { label: crmKpis[2].label, value: crmKpis[2].value, pct: 48 }, layout: { width: "3fr" } },
    { id: tid("crm-kpi-4"), type: "SimulatedStatCard", props: { label: crmKpis[3].label, value: crmKpis[3].value, pct: 35 }, layout: { width: "3fr" } },
    /* Toolbar - search + lifecycle filter */
    { id: tid("crm-search"), type: "SimulatedSearchbox", props: { placeholder: "Search name, email, company, or phone" }, layout: { width: "8fr" } },
    { id: tid("crm-filter"), type: "SimulatedDropdown", props: { placeholder: "Lifecycle stage" }, layout: { width: "4fr" } },
    /* Active-filter chips */
    { id: tid("crm-chip-1"), type: "SimulatedPill", props: { label: "Customer", dismissible: true }, layout: { width: "2fr" } },
    { id: tid("crm-chip-2"), type: "SimulatedPill", props: { label: "Owner: Sasha Lin", dismissible: true }, layout: { width: "3fr" } },
    /* Pipeline charts - contacts-added trend (8) + status split (4) */
    { id: tid("crm-chart-1"), type: "HighchartArea", props: { chartType: "area", title: "Contacts added, last 30 days", categories: crmContactsAdded.categories, series: crmContactsAdded.series }, layout: { width: "8fr" } },
    { id: tid("crm-chart-2"), type: "HighchartDonut", props: { chartType: "donut", title: "Pipeline by status", seriesData: crmByStatus }, layout: { width: "4fr" } },
    /* Main data table - 12 cols, last. Name/Company/Title/Stage/Owner/Phone/Last
       activity; the Stage column renders as pills via tableCells. */
    { id: tid("crm-table"), type: "SimulatedDataTable", props: { columns: crmContactsData.columns, rows: crmContactsData.rows }, layout: { width: "12fr" } },
  ],
  footer: [
    { id: tid("crm-ftr"), type: "FooterText", props: { label: "Showing 1-25 of 4,812", version: "v3.2" } },
  ],
  aiResponse:
    "Built a **CRM Contacts** workspace - saved-view tabs, a KPI strip (total contacts, new this month, MQLs, active deals), a search + lifecycle-filter toolbar with active-filter chips, pipeline charts, and a spreadsheet-grade contacts table (name, company, title, stage, owner, phone, last activity). Ask me to add a detail drawer, change the columns, or switch design systems.",
};

/* ──────────────────────────────────────────────────────────────
   4. Login → Dashboard (auth flow)
   ────────────────────────────────────────────────────────────── */
const loginFlow: BuilderTemplate = {
  id: "login-flow",
  label: "Login → Dashboard",
  desc: "Centered auth card with SSO, email/password, paired with the post-login dashboard",
  icon: "login",
  interfaceType: "form",
  selectedComponents: ["inputs", "buttons", "sim-title"],
  /* 12-col grid body: single-column auth card, each field its own row;
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
    /* Centered auth card (research: auth is a centered card, not a top banner —
       the full-bleed hero image was dropped; a 50/50 split isn't expressible in
       the 12-col flow grid). Copy + placeholders from the shared authContent. */
    { id: tid("lf-title"), type: "SimulatedTitle", props: { text: authContent.title, level: "h2" }, layout: { width: "12fr" } },
    { id: tid("lf-sub"), type: "SimulatedTitle", props: { text: authContent.subtitle, level: "h4" }, layout: { width: "12fr" } },
    /* SSO first (the dominant real-product pattern), then email/password */
    { id: tid("lf-google"), type: "SimulatedButton", props: { label: authContent.oauth[0], variant: "outline" }, layout: { width: "12fr" } },
    { id: tid("lf-ms"), type: "SimulatedButton", props: { label: authContent.oauth[1], variant: "outline" }, layout: { width: "12fr" } },
    { id: tid("lf-email"), type: "SimulatedTextInput", props: { label: "Work email", placeholder: authContent.emailPlaceholder }, layout: { width: "12fr" } },
    { id: tid("lf-pass"), type: "SimulatedTextInput", props: { label: "Password", placeholder: authContent.passwordPlaceholder }, layout: { width: "12fr" } },
    { id: tid("lf-remember"), type: "SimulatedCheckbox", props: { label: "Keep me signed in for 30 days", defaultChecked: false }, layout: { width: "8fr" } },
    { id: tid("lf-forgot"), type: "SimulatedLink", props: { text: "Forgot password?", showIcon: false }, layout: { width: "4fr" } },
    { id: tid("lf-signin"), type: "SimulatedButton", props: { label: "Sign in", variant: "primary" }, layout: { width: "12fr" } },
    /* Flow hint - connects to the post-login dashboard */
    { id: tid("lf-alert"), type: "Alert", props: { title: "After sign-in", message: "Ask me to 'show the dashboard' and I'll swap in where users land after authenticating.", variant: "info" }, layout: { width: "12fr" } },
  ],
  footer: [
    { id: tid("lf-ftr"), type: "FooterText", props: { label: `© 2026 ${authContent.brand}, Inc.`, version: "Privacy · Terms" } },
  ],
  aiResponse:
    "Built a **Sign in** screen - SSO (Google, Microsoft), email + password, a keep-me-signed-in checkbox, and a forgot-password link, on a centered auth card. Say **'show the dashboard'** and I'll swap in the post-login landing for the full flow.",
};

/* ──────────────────────────────────────────────────────────────
   5. Landing Page (marketing — full-width, top nav)
   Researched best-practice SaaS structure: top nav, hero with a
   product visual + email capture, stats proof, feature trio,
   testimonials, blog cards, growth chart, 3-tier pricing, FAQ,
   closing CTA. Built from OUR blocks/tokens — no left sidebar.
   ────────────────────────────────────────────────────────────── */
const landingPage: BuilderTemplate = {
  id: "landing-page",
  label: "Landing Page",
  desc: "Hero, stats, features, testimonials, pricing, FAQ, and a closing CTA",
  icon: "rocket_launch",
  interfaceType: "landing",
  selectedComponents: ["sim-title", "image", "buttons", "cards", "pill"],
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
    /* Hero: eyebrow pill -> headline + product visual -> subhead -> email capture */
    { id: tid("lp-eyebrow"), type: "SimulatedPill", props: { label: landingHero.eyebrow, dismissible: false }, layout: { width: "12fr" } },
    { id: tid("lp-hero-title"), type: "SimulatedTitle", props: { text: landingHero.headline, level: "h1" }, layout: { width: "7fr" } },
    { id: tid("lp-hero-img"), type: "SimulatedImage", props: { alt: getImageById(landingHero.heroImageId)?.alt ?? "Product preview", ratio: "4:3", caption: "", src: getImageById(landingHero.heroImageId)?.url ?? pickImage("product").url }, layout: { width: "5fr" } },
    { id: tid("lp-hero-sub"), type: "SimulatedTitle", props: { text: landingHero.subhead, level: "h4" }, layout: { width: "12fr" } },
    { id: tid("lp-hero-email"), type: "SimulatedTextInput", props: { label: "", placeholder: "Your work email" }, layout: { width: "9fr" } },
    { id: tid("lp-hero-btn"), type: "SimulatedButton", props: { label: landingHero.primaryCta, variant: "primary" }, layout: { width: "3fr" } },
    /* Stats proof strip - 4 big numbers (from landingStats). pct = bar fill. */
    { id: tid("lp-stat-title"), type: "SimulatedTitle", props: { text: "Trusted by fast-moving teams", level: "h3" }, layout: { width: "12fr" } },
    { id: tid("lp-stat-1"), type: "SimulatedStatCard", props: { label: landingStats[0].label, value: landingStats[0].value, pct: 99 }, layout: { width: "3fr" } },
    { id: tid("lp-stat-2"), type: "SimulatedStatCard", props: { label: landingStats[1].label, value: landingStats[1].value, pct: 84 }, layout: { width: "3fr" } },
    { id: tid("lp-stat-3"), type: "SimulatedStatCard", props: { label: landingStats[2].label, value: landingStats[2].value, pct: 92 }, layout: { width: "3fr" } },
    { id: tid("lp-stat-4"), type: "SimulatedStatCard", props: { label: landingStats[3].label, value: landingStats[3].value, pct: 96 }, layout: { width: "3fr" } },
    /* Feature trio (from landingFeatures). */
    { id: tid("lp-feat-title"), type: "SimulatedTitle", props: { text: "Built to grow with you", level: "h3" }, layout: { width: "12fr" } },
    { id: tid("lp-feat-1"), type: "SimulatedCard", props: { title: landingFeatures[0].title, content: landingFeatures[0].body }, layout: { width: "4fr" } },
    { id: tid("lp-feat-2"), type: "SimulatedCard", props: { title: landingFeatures[1].title, content: landingFeatures[1].body }, layout: { width: "4fr" } },
    { id: tid("lp-feat-3"), type: "SimulatedCard", props: { title: landingFeatures[2].title, content: landingFeatures[2].body }, layout: { width: "4fr" } },
    /* Customer voices (from landingTestimonials) - quote cards. */
    { id: tid("lp-quote-title"), type: "SimulatedTitle", props: { text: "What teams are saying", level: "h3" }, layout: { width: "12fr" } },
    { id: tid("lp-quote-1"), type: "SimulatedCard", props: { title: `${landingTestimonials[0].name}, ${landingTestimonials[0].role}`, content: landingTestimonials[0].quote }, layout: { width: "6fr" } },
    { id: tid("lp-quote-2"), type: "SimulatedCard", props: { title: `${landingTestimonials[1].name}, ${landingTestimonials[1].role}`, content: landingTestimonials[1].quote }, layout: { width: "6fr" } },
    /* Resources / articles - image row (4/4/4) over caption row (4/4/4). */
    { id: tid("lp-res-title"), type: "SimulatedTitle", props: { text: "From the blog", level: "h3" }, layout: { width: "12fr" } },
    { id: tid("lp-res-img-1"), type: "SimulatedImage", props: { alt: getImageById(landingResources[0].imageId)?.alt ?? "Article", ratio: "16:9", caption: "", src: getImageById(landingResources[0].imageId)?.url }, layout: { width: "4fr" } },
    { id: tid("lp-res-img-2"), type: "SimulatedImage", props: { alt: getImageById(landingResources[1].imageId)?.alt ?? "Article", ratio: "16:9", caption: "", src: getImageById(landingResources[1].imageId)?.url }, layout: { width: "4fr" } },
    { id: tid("lp-res-img-3"), type: "SimulatedImage", props: { alt: getImageById(landingResources[2].imageId)?.alt ?? "Article", ratio: "16:9", caption: "", src: getImageById(landingResources[2].imageId)?.url }, layout: { width: "4fr" } },
    { id: tid("lp-res-1"), type: "SimulatedCard", props: { title: landingResources[0].title, content: landingResources[0].body }, layout: { width: "4fr" } },
    { id: tid("lp-res-2"), type: "SimulatedCard", props: { title: landingResources[1].title, content: landingResources[1].body }, layout: { width: "4fr" } },
    { id: tid("lp-res-3"), type: "SimulatedCard", props: { title: landingResources[2].title, content: landingResources[2].body }, layout: { width: "4fr" } },
    /* Trend chart (from landingRevenueTrend). */
    { id: tid("lp-chart-title"), type: "SimulatedTitle", props: { text: "Steady, predictable growth", level: "h3" }, layout: { width: "12fr" } },
    { id: tid("lp-chart"), type: "HighchartArea", props: { chartType: "area", title: "Revenue, last 6 months", categories: landingRevenueTrend.categories, series: landingRevenueTrend.series }, layout: { width: "12fr" } },
    /* Pricing - all 3 tiers (Starter / Team [most popular] / Enterprise). */
    { id: tid("lp-price-title"), type: "SimulatedTitle", props: { text: "Simple pricing", level: "h3" }, layout: { width: "12fr" } },
    { id: tid("lp-price-1"), type: "SimulatedCard", props: { title: `${landingPricing[0].name} · ${landingPricing[0].price}${landingPricing[0].cadence}`, content: landingPricing[0].features.join(" · ") + "." }, layout: { width: "4fr" } },
    { id: tid("lp-price-2"), type: "SimulatedCard", props: { title: `${landingPricing[1].name} · ${landingPricing[1].price}${landingPricing[1].cadence} (Most popular)`, content: landingPricing[1].features.join(" · ") + "." }, layout: { width: "4fr" } },
    { id: tid("lp-price-3"), type: "SimulatedCard", props: { title: `${landingPricing[2].name} · ${landingPricing[2].price}`, content: landingPricing[2].features.join(" · ") + "." }, layout: { width: "4fr" } },
    /* FAQ - Q/A cards (Accordion doesn't accept item props yet). */
    { id: tid("lp-faq-title"), type: "SimulatedTitle", props: { text: "Questions", level: "h3" }, layout: { width: "12fr" } },
    { id: tid("lp-faq-1"), type: "SimulatedCard", props: { title: landingFaq[0].q, content: landingFaq[0].a }, layout: { width: "6fr" } },
    { id: tid("lp-faq-2"), type: "SimulatedCard", props: { title: landingFaq[1].q, content: landingFaq[1].a }, layout: { width: "6fr" } },
    { id: tid("lp-faq-3"), type: "SimulatedCard", props: { title: landingFaq[2].q, content: landingFaq[2].a }, layout: { width: "6fr" } },
    { id: tid("lp-faq-4"), type: "SimulatedCard", props: { title: landingFaq[3].q, content: landingFaq[3].a }, layout: { width: "6fr" } },
    /* Closing CTA. */
    { id: tid("lp-cta-title"), type: "SimulatedTitle", props: { text: "Bring your team together today", level: "h2" }, layout: { width: "8fr" } },
    { id: tid("lp-cta-btn"), type: "SimulatedButton", props: { label: landingHero.primaryCta, variant: "primary" }, layout: { width: "4fr" } },
  ],
  footer: [
    { id: tid("lp-ftr"), type: "FooterText", props: { label: `© 2026 ${landingBrand}, Inc.`, version: "Privacy · Terms" } },
  ],
  aiResponse:
    "Built a **Landing Page**: top nav, a hero with an eyebrow, product visual, and email capture, a 4-stat proof strip, a feature trio, customer quotes, blog cards, a growth chart, three pricing tiers, an FAQ, and a closing CTA. Ask me to swap sections, change the copy, or try it in another design system.",
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

/** Used when the Login→Dashboard flow is progressed via chat. Mirrors the
 *  enriched analytics dashboard so the post-login surface is real-product grade
 *  (greeting + KPIs + revenue trend + recent orders), reusing the shared data. */
export function getLoginDashboardBody(): Block[] {
  let i = 0;
  const nid = (p: string) => `tpl-dash-${p}-${++i}`;
  return [
    { id: nid("greet"), type: "SimulatedTitle", props: { text: `Good morning, ${settingsProfile.displayName}`, level: "h3" }, layout: { width: "fill" } },
    { id: nid("kpi1"), type: "SimulatedStatCard", props: { label: analyticsKpis[0].label, value: analyticsKpis[0].value, pct: 82 }, layout: { width: "33.333%" } },
    { id: nid("kpi2"), type: "SimulatedStatCard", props: { label: analyticsKpis[1].label, value: analyticsKpis[1].value, pct: 64 }, layout: { width: "33.333%" } },
    { id: nid("kpi3"), type: "SimulatedStatCard", props: { label: analyticsKpis[3].label, value: analyticsKpis[3].value, pct: 42 }, layout: { width: "33.333%" } },
    { id: nid("chart"), type: "HighchartArea", props: { chartType: "area", title: "Revenue, last 30 days vs previous", categories: analyticsRevenueTrend.categories, series: analyticsRevenueTrend.series }, layout: { width: "fill" } },
    { id: nid("table"), type: "SimulatedDataTable", props: { columns: analyticsOrders.columns, rows: analyticsOrders.rows }, layout: { width: "fill" } },
  ];
}
