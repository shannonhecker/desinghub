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
 * Coherent universe (owner decision 2026-06-02): every template tells one
 * company's story — *Northwind*, a product-analytics SaaS. The analytics
 * dashboard is Northwind's own tool; CRM/settings/auth are its workspace; the
 * landing page sells it. Names, plans, and people recur across domains rather
 * than colliding by accident.
 *
 * Pairs with sampleImages.ts (avatars / hero imagery). See `pickImage`.
 *
 * 2026-06-06 enrichment: data deepened to real-product grade (researched
 * best-practice content per template) — richer KPIs, multi-column tables with
 * real names/values, members + invoices + billing for settings, and a landing
 * FAQ. Status values stay within the success/warning/neutral pill map in
 * tableCells.ts (a richer stage-pill palette is a separate follow-up).
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
  { label: "MRR", value: "$128,450", pct: 8.2 },
  { label: "Active users", value: "24,318", pct: 12.4 },
  { label: "Net MRR churn", value: "2.4%", pct: -0.6 },
  { label: "Activation rate", value: "41.7%", pct: 3.1 },
];

/** Secondary headline metrics, surfaced on request / in a denser variant. */
export const analyticsSecondaryKpis: Kpi[] = [
  { label: "ARR", value: "$1.54M", pct: 9 },
  { label: "CAC", value: "$312", pct: -4 },
  { label: "LTV:CAC", value: "4.8x", pct: 6 },
  { label: "NPS", value: "52", pct: 4 },
];

/** Revenue, last 30 days vs the prior 30 (current ≈ $128.4k vs prev ≈ $118.7k). */
export const analyticsRevenueTrend: ChartSeries = {
  categories: ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
  series: [
    { name: "This period", data: [29800, 32400, 31600, 34650] },
    { name: "Prior period", data: [27600, 29100, 30400, 31600] },
  ],
};

/** Sign-ups by acquisition channel (last 30 days). */
export const analyticsSignupsByChannel: ChartSeries = {
  categories: ["Organic", "Paid search", "Referral", "Social", "Direct"],
  series: [{ name: "Sign-ups", data: [1240, 860, 540, 410, 320] }],
};

/** Revenue by plan tier. */
export const analyticsRevenueByPlan: DonutSlice[] = [
  { name: "Pro", y: 52 },
  { name: "Team", y: 31 },
  { name: "Enterprise", y: 12 },
  { name: "Free trial", y: 5 },
];

/** Recent orders / invoices (analytics detail table). Status ∈ {Paid, Pending,
   Refunded} so the Status column renders sensible pills under tableCells. */
export const analyticsOrders: TableData = {
  columns: ["Order", "Customer", "Plan", "Seats", "Amount", "Status", "Date"],
  rows: [
    { Order: "#INV-10482", Customer: "Northwind Traders", Plan: "Team", Seats: "25", Amount: "$1,250.00", Status: "Paid", Date: "Jun 4" },
    { Order: "#INV-10481", Customer: "Acme Corp", Plan: "Enterprise", Seats: "120", Amount: "$9,600.00", Status: "Pending", Date: "Jun 4" },
    { Order: "#INV-10480", Customer: "Globex", Plan: "Pro", Seats: "8", Amount: "$192.00", Status: "Paid", Date: "Jun 3" },
    { Order: "#INV-10478", Customer: "Initech", Plan: "Team", Seats: "30", Amount: "$1,500.00", Status: "Paid", Date: "Jun 2" },
    { Order: "#INV-10475", Customer: "Soylent Corp", Plan: "Pro", Seats: "12", Amount: "$288.00", Status: "Refunded", Date: "Jun 1" },
  ],
};

/* ── CRM ────────────────────────────────────────────────────────────────── */

export const crmKpis: Kpi[] = [
  { label: "Total contacts", value: "4,812", pct: 6.2 },
  { label: "New this month", value: "318", pct: 11 },
  { label: "Marketing qualified leads", value: "1,204", pct: 8 },
  { label: "Active deals", value: "87", pct: 4 },
];

/** Contacts index (spreadsheet-grade). The "Stage" header is a status column
   (tableCells.isStatusColumn) so stages render as pills. Real HubSpot-canonical
   lifecycle stage names; richer per-stage colours are a follow-up. */
export const crmContacts: TableData = {
  columns: ["Name", "Company", "Title", "Stage", "Owner", "Phone", "Last activity"],
  rows: [
    { Name: "Priya Raghavan", Company: "Northwind Trading", Title: "VP of Engineering", Stage: "Customer", Owner: "Sasha Lin", Phone: "+1 (415) 555-0142", "Last activity": "2h ago" },
    { Name: "Marcus Bell", Company: "Helios Cloud", Title: "Head of Procurement", Stage: "Sales qualified lead", Owner: "Devin Okafor", Phone: "+44 20 7946 0991", "Last activity": "Yesterday" },
    { Name: "Yuki Tanaka", Company: "Meridian Labs", Title: "Product Manager", Stage: "Marketing qualified lead", Owner: "Sasha Lin", Phone: "+81 3-4567-8901", "Last activity": "3 days ago" },
    { Name: "Elena Vasquez", Company: "BrightPath Education", Title: "Director of Ops", Stage: "Lead", Owner: "Unassigned", Phone: "+1 (312) 555-0198", "Last activity": "1 week ago" },
    { Name: "Tom Okonkwo", Company: "VantaPay", Title: "CTO", Stage: "Opportunity", Owner: "Devin Okafor", Phone: "+1 (646) 555-0177", "Last activity": "12 min ago" },
  ],
};

/* ── SETTINGS ───────────────────────────────────────────────────────────── */

export interface SettingsProfile {
  fullName: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  jobTitle: string;
  timezone: string;
  /** Avatar fallback initials. */
  initials: string;
  /** id into sampleImages (people category) for the avatar photo. */
  avatarId: string;
  role: string;
}

export const settingsProfile: SettingsProfile = {
  fullName: "Sarah Chen",
  displayName: "Sarah",
  email: "sarah.chen@northwind.co",
  emailVerified: true,
  jobTitle: "Product Lead",
  timezone: "(GMT+00:00) London",
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
  { label: "Mentions", description: "When a teammate @mentions you", defaultOn: true },
  { label: "Comments on your items", description: "Replies and new comments", defaultOn: true },
  { label: "Weekly digest", description: "Monday summary of activity", defaultOn: true },
  { label: "Billing receipts", description: "Invoices and payment confirmations", defaultOn: true },
  { label: "Product updates", description: "New features and changelog", defaultOn: true },
  { label: "Marketing emails", description: "Tips, offers, and event invites", defaultOn: false },
];

/** Members & roles table (settings). "Status" column → pills (Active/Pending). */
export const settingsMembers: TableData = {
  columns: ["Member", "Role", "Status", "Last active"],
  rows: [
    { Member: "Sarah Chen", Role: "Owner", Status: "Active", "Last active": "2 min ago" },
    { Member: "Marcus Webb", Role: "Admin", Status: "Active", "Last active": "1 hr ago" },
    { Member: "Priya Nair", Role: "Member", Status: "Active", "Last active": "Yesterday" },
    { Member: "Diego Alvarez", Role: "Guest", Status: "Active", "Last active": "3 days ago" },
    { Member: "jordan.lee@northwind.co", Role: "Member", Status: "Pending", "Last active": "Invited Jun 3" },
  ],
};

/** Invoice history table (settings → billing). */
export const settingsInvoices: TableData = {
  columns: ["Date", "Invoice", "Amount", "Status", "Download"],
  rows: [
    { Date: "Jun 1, 2026", Invoice: "INV-2026-0042", Amount: "$300.00", Status: "Paid", Download: "PDF" },
    { Date: "May 1, 2026", Invoice: "INV-2026-0039", Amount: "$300.00", Status: "Paid", Download: "PDF" },
    { Date: "Apr 1, 2026", Invoice: "INV-2026-0036", Amount: "$264.00", Status: "Paid", Download: "PDF" },
  ],
};

export interface BillingPlan {
  plan: string;
  pricePerSeat: string;
  seats: number;
  seatsUsed: number;
  renews: string;
  billedMonthly: string;
  paymentMethod: string;
  billingEmail: string;
}

export const settingsBilling: BillingPlan = {
  plan: "Business",
  pricePerSeat: "$12 / seat / mo",
  seats: 25,
  seatsUsed: 18,
  renews: "Jul 1, 2026",
  billedMonthly: "$300.00",
  paymentMethod: "Visa ending in 4242 · Expires 08/2027",
  billingEmail: "billing@northwind.co",
};

/* ── LANDING (Northwind, the product) ───────────────────────────────────── */

export const landingBrand = "Northwind";

export const landingHero = {
  eyebrow: "New: AI insights in every plan",
  headline: "Know what your product is really doing.",
  subhead: "Northwind turns raw events into the handful of numbers that matter, so your team ships with evidence instead of opinions.",
  primaryCta: "Start free",
  secondaryCta: "Book a demo",
  /** No credit card / trust microcopy under the CTA. */
  microcopy: "No credit card required. Free for up to 5 teammates.",
  heroImageId: "product-ui-analytics-dashboard-laptop",
};

export const landingFeatures: FeatureCard[] = [
  { title: "Live dashboards", body: "Revenue, retention, and activation in one view that updates the moment events land. No refresh, no exports.", icon: "monitoring" },
  { title: "One source of truth", body: "Every team reads the same numbers from the same definitions. No more dueling spreadsheets.", icon: "hub" },
  { title: "AI insights", body: "Ask a question in plain English and get the chart, the cohort, and the why, in seconds.", icon: "auto_awesome" },
];

export const landingStats: Kpi[] = [
  { label: "Uptime", value: "99.99%", pct: 0 },
  { label: "Teams onboard", value: "8,400+", pct: 0 },
  { label: "Events / day", value: "3.2B", pct: 0 },
  { label: "Rated on G2", value: "4.8/5", pct: 0 },
];

export const landingPricing: PricingTier[] = [
  { name: "Starter", price: "$0", cadence: "/mo", features: ["1 project", "7-day history", "Up to 5 teammates", "Community support"] },
  { name: "Team", price: "$12", cadence: " per user/mo", features: ["Unlimited projects", "1-year history", "SSO", "AI insights", "Priority support"], featured: true },
  { name: "Enterprise", price: "Custom", cadence: "", features: ["Unlimited history", "SAML + SCIM", "Dedicated CSM", "99.99% SLA"] },
];

export const landingTestimonials: Testimonial[] = [
  { quote: "We cut our weekly reporting from a full day to a glance, and the whole team finally trusts one set of numbers.", name: "Marco Rossi", role: "VP Product, Initech", avatarId: "people-portrait-man-dark-jacket" },
  { quote: "Activation went up 18% in a quarter because we could finally see exactly where new users dropped off.", name: "Aisha Bello", role: "Growth Lead, Stark Industries", avatarId: "people-portrait-businesswoman" },
];

/** Revenue, last 6 months (landing-page chart). */
export const landingRevenueTrend: ChartSeries = {
  categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  series: [{ name: "Revenue", data: [128, 156, 171, 198, 224, 268] }],
};

export interface FaqItem {
  q: string;
  a: string;
}

export const landingFaq: FaqItem[] = [
  { q: "Is my data secure?", a: "Yes. Northwind is SOC 2 Type II certified, encrypts data in transit and at rest, and supports row-level access controls." },
  { q: "Can I import my existing events?", a: "Bring history in via our SDKs, a CSV, or a warehouse sync. Most teams are live in under an hour." },
  { q: "What happens after the free trial?", a: "Nothing breaks. You drop to the free Starter plan and keep your last 7 days of history until you upgrade." },
  { q: "Do you offer SSO and SAML?", a: "SSO is on Team and above; SAML + SCIM provisioning ships with Enterprise." },
];

/* ── AUTH ───────────────────────────────────────────────────────────────── */

export const authContent = {
  brand: "Northwind",
  title: "Sign in to Northwind",
  subtitle: "Welcome back, enter your details.",
  emailPlaceholder: "you@company.com",
  passwordPlaceholder: "Enter your password",
  oauth: ["Continue with Google", "Continue with Microsoft"],
};

/* ── CLUSTER-B ENRICHMENT (2026-06-03 template realism) ─────────────────── */

/** Daily active users, last 14 days (analytics 2nd chart row). */
export const analyticsDau: ChartSeries = {
  categories: ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "D11", "D12", "D13", "D14"],
  series: [{ name: "DAU", data: [8200, 8600, 9100, 8900, 9400, 9800, 10200, 9900, 10600, 11100, 10800, 11500, 12100, 12800] }],
};

/** Sessions by device (analytics donut). */
export const analyticsByDevice: DonutSlice[] = [
  { name: "Desktop", y: 64 },
  { name: "Mobile", y: 28 },
  { name: "Tablet", y: 8 },
];

/** Contacts added, last 30 days by week (CRM chart). */
export const crmContactsAdded: ChartSeries = {
  categories: ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
  series: [{ name: "Added", data: [68, 74, 81, 95] }],
};

/** Pipeline by status (CRM donut). */
export const crmByStatus: DonutSlice[] = [
  { name: "Customer", y: 42 },
  { name: "Opportunity", y: 18 },
  { name: "Qualified", y: 26 },
  { name: "Lead", y: 14 },
];

/** Connected integrations (settings page enrichment). */
export interface IntegrationItem {
  name: string;
  desc: string;
  connected: boolean;
}
export const settingsIntegrations: IntegrationItem[] = [
  { name: "Slack", desc: "Post alerts and daily summaries to a channel.", connected: true },
  { name: "Google Workspace", desc: "Sync calendar and sign in with SSO.", connected: false },
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
  { title: "How Initech cut reporting time 90%", body: "A field guide to event-based analytics for product teams.", imageId: "product-ui-marketing-analytics-laptop" },
  { title: "The 3 metrics that predict churn", body: "Stop drowning in dashboards. Track what moves the needle.", imageId: "office-business-planning-meeting" },
  { title: "Ship with evidence, not opinions", body: "How modern teams turn raw events into decisions.", imageId: "generated-saas-collaboration" },
];

/* ── lookup helpers ─────────────────────────────────────────────────────── */

export const SAMPLE_DOMAINS: SampleDomain[] = [
  "analytics",
  "crm",
  "settings",
  "landing",
  "auth",
];
