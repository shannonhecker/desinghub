/**
 * sampleData — realistic, domain-coherent content for populating builder
 * templates and freshly-dragged blocks, so previews read like real products
 * rather than "Metric 1 / Lorem ipsum / $8%".
 *
 * Organised by domain (analytics, crm, settings, landing, auth). Shapes mirror
 * what the block renderers already consume:
 *   - KPI / StatsCards:  { label, value, pct }
 *   - DataTable:         { columns, rows }
 *   - column/area chart: { categories, series: [{ name, data }] }
 *   - donut/pie chart:   [{ name, y }]
 *
 * Coherent universe (owner decision 2026-06-02): the analytics dashboard is
 * *Northwind's own* internal tool, so the same company names recur across
 * dashboard data and the landing brand rather than colliding by accident.
 *
 * Pairs with sampleImages.ts (avatars / hero imagery). See `pickImage`.
 */

export type SampleDomain = "analytics" | "crm" | "settings" | "landing" | "auth";

export interface Kpi {
  label: string;
  value: string;
  /** Period-over-period delta as a signed percentage (e.g. 12, -3). */
  pct: number;
}

export interface TableData {
  columns: string[];
  rows: Array<Record<string, string>>;
}

export interface ChartSeries {
  categories: string[];
  series: Array<{ name: string; data: number[] }>;
}

export interface DonutSlice {
  name: string;
  y: number;
}

export interface PricingTier {
  name: string;
  price: string;
  cadence: string;
  features: string[];
  featured?: boolean;
}

export interface FeatureCard {
  title: string;
  body: string;
  icon: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  /** id into sampleImages SAMPLE_IMAGES (people category). */
  avatarId: string;
}

/* ── ANALYTICS (Northwind's internal product analytics) ─────────────────── */

export const analyticsKpis: Kpi[] = [
  { label: "MRR", value: "$48,200", pct: 12 },
  { label: "Active users", value: "12,847", pct: 8 },
  { label: "Churn rate", value: "2.1%", pct: -3 },
  { label: "ARPU", value: "$38", pct: 4 },
];

/** Revenue, last 30 days vs the prior 30 (realistic upward drift + noise). */
export const analyticsRevenueTrend: ChartSeries = {
  categories: ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
  series: [
    { name: "This period", data: [9800, 11200, 10600, 12400] },
    { name: "Prior period", data: [8600, 9100, 9400, 9900] },
  ],
};

/** Sign-ups by acquisition channel. */
export const analyticsSignupsByChannel: ChartSeries = {
  categories: ["Organic", "Paid", "Referral", "Social"],
  series: [{ name: "Sign-ups", data: [328, 214, 137, 92] }],
};

/** Revenue by plan tier. */
export const analyticsRevenueByPlan: DonutSlice[] = [
  { name: "Free", y: 18 },
  { name: "Pro", y: 47 },
  { name: "Enterprise", y: 35 },
];

export const analyticsOrders: TableData = {
  columns: ["Order", "Status", "Customer", "Updated"],
  rows: [
    { Order: "#10472", Status: "Paid", Customer: "Globex Ltd.", Updated: "2h ago" },
    { Order: "#10471", Status: "Pending", Customer: "Initech", Updated: "Yesterday" },
    { Order: "#10468", Status: "Paid", Customer: "Soylent Corp.", Updated: "2d ago" },
    { Order: "#10463", Status: "Refunded", Customer: "Hooli", Updated: "3d ago" },
    { Order: "#10459", Status: "Paid", Customer: "Stark Industries", Updated: "4d ago" },
  ],
};

/* ── CRM ────────────────────────────────────────────────────────────────── */

export const crmKpis: Kpi[] = [
  { label: "New this week", value: "24", pct: 15 },
  { label: "Active deals", value: "89", pct: 6 },
  { label: "Pipeline value", value: "$1.2M", pct: 9 },
  { label: "Win rate", value: "34%", pct: -2 },
];

export const crmContacts: TableData = {
  columns: ["Name", "Company", "Status", "Owner", "Last contact"],
  rows: [
    { Name: "Priya Shah", Company: "Globex Ltd.", Status: "Active", Owner: "A. Chen", "Last contact": "1h ago" },
    { Name: "Marco Rossi", Company: "Initech", Status: "Lead", Owner: "J. Patel", "Last contact": "Yesterday" },
    { Name: "Lena Ortiz", Company: "Soylent Corp.", Status: "Active", Owner: "A. Chen", "Last contact": "2d ago" },
    { Name: "Daniel Cho", Company: "Hooli", Status: "Churned", Owner: "M. Lewis", "Last contact": "1w ago" },
    { Name: "Aisha Bello", Company: "Stark Industries", Status: "Active", Owner: "J. Patel", "Last contact": "3d ago" },
    { Name: "Tom Becker", Company: "Wayne Enterprises", Status: "Lead", Owner: "M. Lewis", "Last contact": "5d ago" },
  ],
};

/* ── SETTINGS ───────────────────────────────────────────────────────────── */

export interface SettingsProfile {
  fullName: string;
  email: string;
  /** Avatar fallback initials. */
  initials: string;
  /** id into sampleImages (people category) for the avatar photo. */
  avatarId: string;
  role: string;
}

export const settingsProfile: SettingsProfile = {
  fullName: "Sarah Chen",
  email: "sarah.chen@northwind.co",
  initials: "SC",
  avatarId: "people-avatar-young-woman",
  role: "Product Lead",
};

export interface SettingsToggle {
  label: string;
  description: string;
  defaultOn: boolean;
}

export const settingsNotifications: SettingsToggle[] = [
  { label: "Email notifications", description: "Weekly summary and billing receipts", defaultOn: true },
  { label: "Product updates", description: "New features and changelog highlights", defaultOn: true },
  { label: "Mentions", description: "When a teammate @mentions you", defaultOn: true },
  { label: "Marketing emails", description: "Tips, offers, and event invites", defaultOn: false },
];

/* ── LANDING (Northwind, the product) ───────────────────────────────────── */

export const landingBrand = "Northwind";

export const landingHero = {
  eyebrow: "Analytics for product teams",
  headline: "See what your product is really doing.",
  subhead: "Northwind turns raw events into the three numbers that matter, so your team ships with evidence instead of opinions.",
  primaryCta: "Start free",
  secondaryCta: "Book a demo",
  heroImageId: "product-ui-analytics-dashboard-laptop",
};

export const landingFeatures: FeatureCard[] = [
  { title: "Live dashboards", body: "Revenue, retention, and activation in one view that updates as events land.", icon: "monitoring" },
  { title: "One source of truth", body: "Every team reads the same numbers. No more dueling spreadsheets.", icon: "hub" },
  { title: "Secure by default", body: "SOC 2 Type II, SSO, and row-level access controls out of the box.", icon: "shield" },
];

export const landingStats: Kpi[] = [
  { label: "Active teams", value: "3,200+", pct: 0 },
  { label: "Events / day", value: "1.4B", pct: 0 },
  { label: "Uptime", value: "99.98%", pct: 0 },
];

export const landingPricing: PricingTier[] = [
  { name: "Starter", price: "$0", cadence: "/mo", features: ["1 project", "7-day history", "Community support"] },
  { name: "Pro", price: "$29", cadence: "/mo", features: ["Unlimited projects", "1-year history", "SSO", "Priority support"], featured: true },
  { name: "Enterprise", price: "Custom", cadence: "", features: ["Unlimited history", "SAML + SCIM", "Dedicated CSM", "99.99% SLA"] },
];

export const landingTestimonials: Testimonial[] = [
  { quote: "We cut our reporting time from a day to a glance.", name: "Marco Rossi", role: "VP Product, Initech", avatarId: "people-portrait-man-dark-jacket" },
  { quote: "The whole team finally trusts one set of numbers.", name: "Aisha Bello", role: "Growth Lead, Stark Industries", avatarId: "people-portrait-businesswoman" },
];

/** Revenue, last 6 months (landing-page chart). */
export const landingRevenueTrend: ChartSeries = {
  categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  series: [{ name: "Revenue", data: [128, 156, 171, 198, 224, 268] }],
};

/* ── AUTH ───────────────────────────────────────────────────────────────── */

export const authContent = {
  brand: "Northwind",
  title: "Welcome back",
  subtitle: "Sign in to your Northwind workspace.",
  emailPlaceholder: "you@northwind.co",
  passwordPlaceholder: "Enter your password",
  oauth: ["Continue with Google", "Continue with GitHub"],
};

/* ── CLUSTER-B ENRICHMENT (2026-06-03 template realism) ─────────────────── */

/** Daily active users, last 14 days (analytics 2nd chart row). */
export const analyticsDau: ChartSeries = {
  categories: ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "D11", "D12", "D13", "D14"],
  series: [{ name: "DAU", data: [8200, 8600, 9100, 8900, 9400, 9800, 10200, 9900, 10600, 11100, 10800, 11500, 12100, 12800] }],
};

/** Sessions by device (analytics donut). */
export const analyticsByDevice: DonutSlice[] = [
  { name: "Desktop", y: 58 },
  { name: "Mobile", y: 34 },
  { name: "Tablet", y: 8 },
];

/** Contacts added, last 30 days by week (CRM chart). */
export const crmContactsAdded: ChartSeries = {
  categories: ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
  series: [{ name: "Added", data: [42, 51, 47, 63] }],
};

/** Pipeline by status (CRM donut). */
export const crmByStatus: DonutSlice[] = [
  { name: "Active", y: 58 },
  { name: "Lead", y: 30 },
  { name: "Churned", y: 12 },
];

/** Connected integrations (settings page enrichment). */
export interface IntegrationItem {
  name: string;
  desc: string;
  connected: boolean;
}
export const settingsIntegrations: IntegrationItem[] = [
  { name: "Slack", desc: "Post alerts and daily summaries to a channel.", connected: true },
  { name: "Google Analytics", desc: "Sync measurement IDs and import goals.", connected: false },
  { name: "GitHub", desc: "Link commits and deploys to releases.", connected: false },
];

/** Resource / article cards with imagery (landing page enrichment). */
export interface ResourceCard {
  title: string;
  body: string;
  /** id into sampleImages SAMPLE_IMAGES. */
  imageId: string;
}
export const landingResources: ResourceCard[] = [
  { title: "How Initech cut reporting time 90%", body: "A field guide to event-based analytics for product teams.", imageId: "office-business-colleagues-at-laptop" },
  { title: "The 3 metrics that predict churn", body: "Stop drowning in dashboards. Track what moves the needle.", imageId: "office-business-planning-meeting" },
  { title: "Ship with evidence, not opinions", body: "How modern teams turn raw events into decisions.", imageId: "product-ui-marketing-analytics-laptop" },
];

/* ── lookup helpers ─────────────────────────────────────────────────────── */

export const SAMPLE_DOMAINS: SampleDomain[] = [
  "analytics",
  "crm",
  "settings",
  "landing",
  "auth",
];
