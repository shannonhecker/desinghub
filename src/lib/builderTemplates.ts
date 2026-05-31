import type { Block, InterfaceType } from "@/store/useBuilder";

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
    /* Scope bar - title + range preset + export (canonical dashboard header line) */
    { id: tid("ad-title"), type: "SimulatedTitle", props: { text: "Revenue overview", level: "h3" }, layout: { width: "fill" } },
    { id: tid("ad-range"), type: "SimulatedSegmentedGroup", props: { optionsCsv: "7d,30d,90d" }, layout: { width: "auto" } },
    { id: tid("ad-export"), type: "SimulatedButton", props: { variant: "outline", label: "Export" }, layout: { width: "auto" } },
    /* KPI row - 4 cards, lead metric first, signed delta (never color-only) */
    { id: tid("ad-kpi-1"), type: "SimulatedStatCard", props: { label: "MRR", value: "$48,200", pct: 12 }, layout: { width: "25%" } },
    { id: tid("ad-kpi-2"), type: "SimulatedStatCard", props: { label: "Active users", value: "12,847", pct: 8 }, layout: { width: "25%" } },
    { id: tid("ad-kpi-3"), type: "SimulatedStatCard", props: { label: "Churn rate", value: "2.1%", pct: -3 }, layout: { width: "25%" } },
    { id: tid("ad-kpi-4"), type: "SimulatedStatCard", props: { label: "ARPU", value: "$38", pct: 5 }, layout: { width: "25%" } },
    /* Hero trend - full width, headline metric vs previous period */
    { id: tid("ad-hero"), type: "HighchartArea", props: { chartType: "area", title: "Revenue, last 30 days vs previous" }, layout: { width: "fill" } },
    /* 2-up supporting row - 6/6 */
    { id: tid("ad-chart-2"), type: "HighchartColumn", props: { chartType: "column", title: "Signups by channel" }, layout: { width: "50%" } },
    { id: tid("ad-chart-3"), type: "HighchartDonut", props: { chartType: "donut", title: "Revenue by plan" }, layout: { width: "50%" } },
    /* Detail table - kept LAST so the granular view follows the KPI + chart overview (canonical reading order) */
    { id: tid("ad-table"), type: "SimulatedDataTable", props: { columns: ["Order", "Status", "Customer", "Updated"], rows: [{ name: "#10472", status: "Paid", role: "Northwind Co.", date: "2h ago" }, { name: "#10471", status: "Pending", role: "Globex Ltd.", date: "Yesterday" }, { name: "#10468", status: "Paid", role: "Initech", date: "2d ago" }] }, layout: { width: "fill" } },
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
    /* Profile section */
    { id: tid("sp-t1"), type: "SimulatedTitle", props: { text: "Profile", level: "h2" }, layout: { width: "fill" } },
    { id: tid("sp-avatar"), type: "SimulatedAvatar", props: { initials: "SC", size: "lg", presence: "available" }, layout: { width: "33.333%" } },
    { id: tid("sp-btn-photo"), type: "SimulatedButton", props: { label: "Change photo", variant: "secondary" }, layout: { width: "66.666%" } },
    { id: tid("sp-name"), type: "SimulatedTextInput", props: { label: "Full name", placeholder: "Sarah Chen" }, layout: { width: "fill" } },
    { id: tid("sp-email"), type: "SimulatedTextInput", props: { label: "Work email", placeholder: "sarah@acme.co" }, layout: { width: "fill" } },

    /* Preferences section */
    { id: tid("sp-t2"), type: "SimulatedTitle", props: { text: "Preferences", level: "h2" }, layout: { width: "fill" } },
    { id: tid("sp-sw-1"), type: "SimulatedSwitch", props: { label: "Email notifications", defaultOn: true }, layout: { width: "fill" } },
    { id: tid("sp-sw-2"), type: "SimulatedSwitch", props: { label: "Weekly digest email", defaultOn: false }, layout: { width: "fill" } },
    { id: tid("sp-sw-3"), type: "SimulatedSwitch", props: { label: "Product updates & marketing", defaultOn: false }, layout: { width: "fill" } },

    /* Danger zone */
    { id: tid("sp-t3"), type: "SimulatedTitle", props: { text: "Danger zone", level: "h2" }, layout: { width: "fill" } },
    { id: tid("sp-alert"), type: "Alert", props: { title: "Delete account", message: "This permanently removes your workspace and cannot be undone.", variant: "error" }, layout: { width: "fill" } },
    { id: tid("sp-btn-delete"), type: "SimulatedButton", props: { label: "Delete account", variant: "ghost" }, layout: { width: "33.333%" } },
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
    { id: tid("crm-search"), type: "SimulatedSearchbox", props: { placeholder: "Search by name, company, email..." }, layout: { width: "66.666%" } },
    { id: tid("crm-filter"), type: "SimulatedDropdown", props: { placeholder: "All statuses" }, layout: { width: "33.333%" } },
    /* Pipeline KPIs - overview first, before the detailed table (standard dashboard reading order) */
    { id: tid("crm-kpi-1"), type: "SimulatedStatCard", props: { label: "New this week", value: "24", pct: 12 }, layout: { width: "33.333%" } },
    { id: tid("crm-kpi-2"), type: "SimulatedStatCard", props: { label: "Active leads", value: "89", pct: 5 }, layout: { width: "33.333%" } },
    { id: tid("crm-kpi-3"), type: "SimulatedStatCard", props: { label: "Deals closed (MTD)", value: "$12.4K", pct: 18 }, layout: { width: "33.333%" } },
    /* Main data table - last */
    { id: tid("crm-table"), type: "SimulatedDataTable", props: { columns: ["Contact", "Stage", "Owner", "Updated"], rows: [{ name: "Priya Shah", status: "Active", role: "A. Chen", date: "1h ago" }, { name: "Marco Rossi", status: "Pending", role: "J. Patel", date: "Yesterday" }, { name: "Lena Ortiz", status: "Active", role: "A. Chen", date: "3d ago" }] }, layout: { width: "fill" } },
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
  header: [
    { id: tid("lf-brand"), type: "AppBrand", props: { label: "Acme" } },
    { id: tid("lf-status"), type: "StatusPill", props: { label: "Secure" } },
  ],
  sidebar: [
    /* Minimal sidebar for the login state - user hasn't authenticated yet */
    { id: tid("lf-nav-1"), type: "NavItem", props: { label: "Sign in", icon: "person", active: true } },
    { id: tid("lf-nav-2"), type: "NavItem", props: { label: "Create account", icon: "home", active: false } },
    { id: tid("lf-nav-3"), type: "NavItem", props: { label: "Help", icon: "chat", active: false } },
  ],
  body: [
    /* Screen 1 - Login */
    { id: tid("lf-title"), type: "SimulatedTitle", props: { text: "Sign in to Acme", level: "h1" }, layout: { width: "fill" } },
    { id: tid("lf-sub"), type: "SimulatedTitle", props: { text: "Welcome back - enter your details to continue.", level: "h4" }, layout: { width: "fill" } },
    { id: tid("lf-email"), type: "SimulatedTextInput", props: { label: "Work email", placeholder: "you@company.com" }, layout: { width: "fill" } },
    { id: tid("lf-pass"), type: "SimulatedTextInput", props: { label: "Password", placeholder: "Enter your password" }, layout: { width: "fill" } },
    { id: tid("lf-remember"), type: "SimulatedCheckbox", props: { label: "Keep me signed in for 30 days", defaultChecked: false }, layout: { width: "66.666%" } },
    { id: tid("lf-forgot"), type: "SimulatedLink", props: { text: "Forgot password?", showIcon: false }, layout: { width: "33.333%" } },
    { id: tid("lf-signin"), type: "SimulatedButton", props: { label: "Sign in", variant: "primary" }, layout: { width: "fill" } },
    { id: tid("lf-google"), type: "SimulatedButton", props: { label: "Continue with Google", variant: "outline" }, layout: { width: "fill" } },
    { id: tid("lf-github"), type: "SimulatedButton", props: { label: "Continue with GitHub", variant: "outline" }, layout: { width: "fill" } },
    /* Flow hint - connects to the post-login dashboard */
    { id: tid("lf-alert"), type: "Alert", props: { title: "After sign-in", message: "Ask me to 'show the dashboard' and I'll swap in where users land after authenticating.", variant: "info" }, layout: { width: "fill" } },
  ],
  footer: [
    { id: tid("lf-ftr"), type: "FooterText", props: { label: "© 2026 Acme, Inc.", version: "Privacy · Terms" } },
  ],
  aiResponse:
    "Built a **Login** screen with email + password, two OAuth buttons (Google, GitHub), a remember-me checkbox, and a forgot-password link. Say **'show the dashboard'** and I'll swap in the post-login landing page for the full flow.",
};

/* ──────────────────────────────────────────────────────────────
   Registry + accessor
   ────────────────────────────────────────────────────────────── */
export const BUILDER_TEMPLATES: Record<TemplateId, BuilderTemplate> = {
  "analytics-dashboard": analyticsDashboard,
  "settings-page": settingsPage,
  "crm-contacts": crmContacts,
  "login-flow": loginFlow,
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
