/**
 * generalTemplatePages - the destinations behind the general templates'
 * sidebar items (Analytics Dashboard, CRM Contacts, Login). Every nav item a
 * template shows opens one of these, so selecting a destination never lands
 * on an empty canvas. Sample content only, in the same block vocabulary and
 * 12-column grid as each template's first page.
 */
import type { Block, Page, ZoneLayout } from "@/store/useBuilder";
import {
  analyticsByDevice,
  analyticsDau,
  analyticsOrders,
  analyticsRevenueByPlan,
  analyticsRevenueTrend,
  authContent,
  crmByStatus,
  crmContactsAdded,
  type TableData,
} from "./sampleData";

export const GRID_BODY: ZoneLayout = { mode: "grid", columns: 12, gap: 12 };

type Width = 2 | 3 | 4 | 6 | 8 | 9 | 12;
const w = (n: Width) => ({ width: `${n}fr` as const });

/** Block builders, ids namespaced by page so every page's ids are unique. */
export function blocksFor(prefix: string) {
  let n = 0;
  const id = (kind: string) => `tpl-${prefix}-${kind}-${++n}`;
  return {
    title: (text: string, level: "h2" | "h3" | "h4" = "h3", width: Width = 12): Block => ({ id: id("title"), type: "SimulatedTitle", props: { text, level }, layout: w(width) }),
    stat: (label: string, value: string, pct: number, width: Width = 3): Block => ({ id: id("kpi"), type: "SimulatedStatCard", props: { label, value, pct }, layout: w(width) }),
    chart: (type: "HighchartArea" | "HighchartColumn" | "HighchartLine" | "HighchartBar" | "HighchartStackedColumn", title: string, data: { categories: string[]; series: { name: string; data: number[] }[] }, width: Width = 12): Block => ({
      id: id("chart"), type, props: { chartType: type.replace("Highchart", "").replace("StackedColumn", "stacked-column").toLowerCase(), title, categories: data.categories, series: data.series }, layout: w(width),
    }),
    donut: (title: string, seriesData: { name: string; y: number }[], width: Width = 4): Block => ({ id: id("donut"), type: "HighchartDonut", props: { chartType: "donut", title, seriesData }, layout: w(width) }),
    table: (data: TableData): Block => ({ id: id("table"), type: "SimulatedDataTable", props: { columns: data.columns, rows: data.rows }, layout: w(12) }),
    dropdown: (value: string, width: Width = 3): Block => ({ id: id("dropdown"), type: "SimulatedDropdown", props: { value, placeholder: value }, layout: w(width) }),
    button: (label: string, variant: "primary" | "secondary" | "ghost" | "outline", width: Width = 3): Block => ({ id: id("button"), type: "SimulatedButton", props: { label, variant }, layout: w(width) }),
    search: (placeholder: string, width: Width = 9): Block => ({ id: id("search"), type: "SimulatedSearchbox", props: { placeholder }, layout: w(width) }),
    input: (label: string, value: string, width: Width = 12): Block => ({ id: id("input"), type: "SimulatedTextInput", props: { label, value, placeholder: value }, layout: w(width) }),
    field: (label: string, placeholder: string, width: Width = 12): Block => ({ id: id("input"), type: "SimulatedTextInput", props: { label, placeholder }, layout: w(width) }),
    toggle: (label: string, defaultOn: boolean): Block => ({ id: id("switch"), type: "SimulatedSwitch", props: { label, defaultOn }, layout: w(12) }),
    check: (label: string, width: Width = 12): Block => ({ id: id("check"), type: "SimulatedCheckbox", props: { label, defaultChecked: false }, layout: w(width) }),
    card: (title: string, content: string, width: Width = 4): Block => ({ id: id("card"), type: "SimulatedCard", props: { title, content }, layout: w(width) }),
    link: (text: string, width: Width = 12): Block => ({ id: id("link"), type: "SimulatedLink", props: { text, showIcon: false }, layout: w(width) }),
    alert: (title: string, message: string, variant: "info" | "error" | "success" | "warning"): Block => ({ id: id("alert"), type: "Alert", props: { title, message, variant }, layout: w(12) }),
    progress: (label: string, value: number): Block => ({ id: id("progress"), type: "SimulatedProgress", props: { label, value }, layout: w(12) }),
  };
}

/** Pair each sidebar item with its page by label. The first (active) item
 *  is the template body itself, so it needs no entry. */
export function navPages(sidebar: Block[], bodies: Record<string, Block[]>, bodyLayout: ZoneLayout = GRID_BODY): Page[] {
  return sidebar
    .filter((b) => b.type === "NavItem" && typeof b.props.label === "string" && bodies[b.props.label as string])
    .map((b) => ({ id: b.id, name: String(b.props.label), body: bodies[b.props.label as string], bodyLayout }));
}

/* ── Analytics Dashboard ───────────────────────────────────────── */

function analyticsEvents(): Block[] {
  const b = blocksFor("ad-events");
  return [
    b.title("Events", "h3", 6), b.dropdown("Last 30 days"), b.button("Export CSV", "secondary"),
    b.stat("Events tracked", "18.4M", 76), b.stat("Unique event types", "142", 58), b.stat("Events per user", "36.2", 44), b.stat("Ingestion delay", "1.8 s", 12),
    b.chart("HighchartColumn", "Events per day, last 14 days", {
      categories: ["Sep 21", "Sep 22", "Sep 23", "Sep 24", "Sep 25", "Sep 26", "Sep 27", "Sep 28", "Sep 29", "Sep 30", "Oct 1", "Oct 2", "Oct 3", "Oct 4"],
      series: [{ name: "Events (thousands)", data: [512, 548, 601, 590, 622, 410, 388, 575, 640, 668, 702, 689, 451, 430] }],
    }),
    b.table({
      columns: ["Event", "Count", "Users", "Per user", "Change"],
      rows: [
        { Event: "page_viewed", Count: "6,204,118", Users: "182,440", "Per user": "34.0", Change: "+8%" },
        { Event: "report_opened", Count: "1,948,302", Users: "96,210", "Per user": "20.3", Change: "+14%" },
        { Event: "filter_changed", Count: "1,120,877", Users: "71,035", "Per user": "15.8", Change: "+5%" },
        { Event: "export_started", Count: "214,560", Users: "38,902", "Per user": "5.5", Change: "-2%" },
        { Event: "invite_sent", Count: "18,744", Users: "9,118", "Per user": "2.1", Change: "+21%" },
        { Event: "plan_upgraded", Count: "1,206", Users: "1,190", "Per user": "1.0", Change: "+3%" },
      ],
    }),
  ];
}

function analyticsUsers(): Block[] {
  const b = blocksFor("ad-users");
  return [
    b.title("Users", "h3", 9), b.dropdown("Last 14 days"),
    b.stat("Daily active", "41,208", 64), b.stat("Weekly active", "128,560", 72), b.stat("Monthly active", "312,904", 81), b.stat("Stickiness, DAU/MAU", "13.2%", 33),
    b.chart("HighchartArea", "Daily active users, last 14 days", analyticsDau, 8), b.donut("Sessions by device", analyticsByDevice),
    b.table({
      columns: ["User", "Company", "Plan", "Sessions", "Last seen", "Status"],
      rows: [
        { User: "Priya Raghavan", Company: "Northwind Traders", Plan: "Team", Sessions: "214", "Last seen": "2 min ago", Status: "Active" },
        { User: "Marcus Bell", Company: "Helios Cloud", Plan: "Enterprise", Sessions: "188", "Last seen": "1 h ago", Status: "Active" },
        { User: "Yuki Tanaka", Company: "Meridian Labs", Plan: "Pro", Sessions: "96", "Last seen": "Yesterday", Status: "Active" },
        { User: "Elena Vasquez", Company: "BrightPath Education", Plan: "Team", Sessions: "41", "Last seen": "6 days ago", Status: "Pending" },
        { User: "Tom Okonkwo", Company: "VantaPay", Plan: "Enterprise", Sessions: "12", "Last seen": "3 weeks ago", Status: "Inactive" },
      ],
    }),
  ];
}

function analyticsFunnels(): Block[] {
  const b = blocksFor("ad-funnels");
  return [
    b.title("Signup to paid", "h3", 9), b.dropdown("Last 30 days"),
    b.stat("Visitors", "84,120", 100), b.stat("Signed up", "9,842", 58), b.stat("Activated", "4,705", 36), b.stat("Paid", "1,186", 14),
    b.chart("HighchartBar", "Conversion by step", {
      categories: ["Visited", "Signed up", "Created a report", "Invited a teammate", "Paid"],
      series: [{ name: "Users", data: [84120, 9842, 4705, 2310, 1186] }],
    }, 8),
    b.card("Biggest drop", "88% of visitors leave before signing up.", 4),
    b.table({
      columns: ["Step", "Users", "Conversion", "From previous", "Median time"],
      rows: [
        { Step: "Visited", Users: "84,120", Conversion: "100%", "From previous": "", "Median time": "" },
        { Step: "Signed up", Users: "9,842", Conversion: "11.7%", "From previous": "11.7%", "Median time": "4 min" },
        { Step: "Created a report", Users: "4,705", Conversion: "5.6%", "From previous": "47.8%", "Median time": "1 day" },
        { Step: "Invited a teammate", Users: "2,310", Conversion: "2.7%", "From previous": "49.1%", "Median time": "3 days" },
        { Step: "Paid", Users: "1,186", Conversion: "1.4%", "From previous": "51.3%", "Median time": "12 days" },
      ],
    }),
  ];
}

function analyticsRetention(): Block[] {
  const b = blocksFor("ad-retention");
  return [
    b.title("Retention", "h3", 9), b.dropdown("Weekly cohorts"),
    b.stat("Week 1 retention", "46%", 46), b.stat("Week 4 retention", "31%", 31), b.stat("Week 8 retention", "24%", 24), b.stat("Resurrected users", "1,412", 18),
    b.chart("HighchartLine", "Share of cohort still active", {
      categories: ["Week 0", "Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
      series: [
        { name: "Aug 4 cohort", data: [100, 44, 37, 33, 30, 28, 27] },
        { name: "Aug 18 cohort", data: [100, 47, 39, 35, 32, 30, 29] },
        { name: "Sep 1 cohort", data: [100, 49, 41, 36, 33, 31, 30] },
      ],
    }),
    b.table({
      columns: ["Cohort", "Users", "Week 1", "Week 2", "Week 3", "Week 4"],
      rows: [
        { Cohort: "Aug 4", Users: "2,904", "Week 1": "44%", "Week 2": "37%", "Week 3": "33%", "Week 4": "30%" },
        { Cohort: "Aug 11", Users: "3,118", "Week 1": "45%", "Week 2": "38%", "Week 3": "34%", "Week 4": "31%" },
        { Cohort: "Aug 18", Users: "3,260", "Week 1": "47%", "Week 2": "39%", "Week 3": "35%", "Week 4": "32%" },
        { Cohort: "Aug 25", Users: "3,402", "Week 1": "48%", "Week 2": "40%", "Week 3": "35%", "Week 4": "32%" },
        { Cohort: "Sep 1", Users: "3,577", "Week 1": "49%", "Week 2": "41%", "Week 3": "36%", "Week 4": "33%" },
      ],
    }),
  ];
}

function analyticsRevenue(): Block[] {
  const b = blocksFor("ad-revenue");
  return [
    b.title("Revenue", "h3", 6), b.dropdown("Last 30 days"), b.button("Export CSV", "secondary"),
    b.stat("Annual run rate", "$1.48M", 74), b.stat("Average revenue per account", "$412", 52), b.stat("Net revenue retention", "112%", 88), b.stat("Refunds", "$3,940", 9),
    b.chart("HighchartArea", "Revenue, last 30 days vs previous", analyticsRevenueTrend, 8), b.donut("Revenue by plan", analyticsRevenueByPlan),
    b.table(analyticsOrders),
  ];
}

function analyticsSettings(): Block[] {
  const b = blocksFor("ad-settings");
  return [
    b.title("Workspace settings"),
    b.input("Workspace name", "Northwind Analytics", 8), b.dropdown("Keep raw events for 13 months", 4),
    b.title("Tracking", "h4"),
    b.toggle("Track anonymous visitors", true),
    b.toggle("Mask IP addresses", true),
    b.toggle("Send a weekly digest to admins", false),
    b.title("Data access", "h4"),
    b.field("Project token", "nw_live_****************", 9), b.button("Regenerate", "secondary"),
    b.alert("Changes apply to new events", "Events already collected keep the settings they were captured with.", "info"),
  ];
}

export const analyticsDashboardBodies = (): Record<string, Block[]> => ({
  Events: analyticsEvents(), Users: analyticsUsers(), Funnels: analyticsFunnels(),
  Retention: analyticsRetention(), Revenue: analyticsRevenue(), Settings: analyticsSettings(),
});

/* ── CRM ───────────────────────────────────────────────────────── */

function crmCompanies(): Block[] {
  const b = blocksFor("crm-companies");
  return [
    b.search("Search companies by name or domain"), b.button("Add company", "primary"),
    b.stat("Companies", "1,126", 54), b.stat("Customers", "214", 19), b.stat("Open deals", "87", 31), b.stat("Average deal", "$18.4k", 46),
    b.table({
      columns: ["Company", "Industry", "Contacts", "Owner", "Open deals", "Stage"],
      rows: [
        { Company: "Northwind Trading", Industry: "Logistics", Contacts: "14", Owner: "Sasha Lin", "Open deals": "2", Stage: "Customer" },
        { Company: "Helios Cloud", Industry: "Software", Contacts: "9", Owner: "Devin Okafor", "Open deals": "1", Stage: "Opportunity" },
        { Company: "Meridian Labs", Industry: "Research", Contacts: "6", Owner: "Sasha Lin", "Open deals": "1", Stage: "Sales qualified lead" },
        { Company: "BrightPath Education", Industry: "Education", Contacts: "4", Owner: "Unassigned", "Open deals": "0", Stage: "Lead" },
        { Company: "VantaPay", Industry: "Payments", Contacts: "11", Owner: "Devin Okafor", "Open deals": "3", Stage: "Opportunity" },
        { Company: "Atlas Freight", Industry: "Logistics", Contacts: "7", Owner: "Sasha Lin", "Open deals": "1", Stage: "Customer" },
      ],
    }),
  ];
}

function crmDeals(): Block[] {
  const b = blocksFor("crm-deals");
  return [
    b.title("Deals", "h3", 9), b.button("New deal", "primary"),
    b.stat("Pipeline value", "$1.62M", 68), b.stat("Weighted forecast", "$604k", 41), b.stat("Win rate", "27%", 27), b.stat("Average cycle", "38 days", 38),
    b.chart("HighchartStackedColumn", "Pipeline by stage, $ thousands", {
      categories: ["Discovery", "Demo", "Proposal", "Negotiation", "Closed won"],
      series: [{ name: "New business", data: [320, 260, 210, 140, 96] }, { name: "Expansion", data: [120, 140, 90, 70, 54] }],
    }, 8),
    b.donut("Deals by owner", [{ name: "Sasha Lin", y: 34 }, { name: "Devin Okafor", y: 29 }, { name: "Mara Silva", y: 16 }, { name: "Unassigned", y: 8 }]),
    b.table({
      columns: ["Deal", "Company", "Amount", "Stage", "Owner", "Close date"],
      rows: [
        { Deal: "Platform renewal", Company: "Northwind Trading", Amount: "$48,000", Stage: "Negotiation", Owner: "Sasha Lin", "Close date": "Oct 18" },
        { Deal: "Analytics add-on", Company: "Helios Cloud", Amount: "$22,500", Stage: "Proposal", Owner: "Devin Okafor", "Close date": "Oct 25" },
        { Deal: "Team expansion", Company: "VantaPay", Amount: "$36,000", Stage: "Demo", Owner: "Devin Okafor", "Close date": "Nov 8" },
        { Deal: "Pilot", Company: "Meridian Labs", Amount: "$9,800", Stage: "Discovery", Owner: "Sasha Lin", "Close date": "Nov 22" },
        { Deal: "Annual plan", Company: "Atlas Freight", Amount: "$27,400", Stage: "Closed won", Owner: "Sasha Lin", "Close date": "Sep 30" },
      ],
    }),
  ];
}

function crmActivities(): Block[] {
  const b = blocksFor("crm-activities");
  return [
    b.title("Activities", "h3", 9), b.button("Log activity", "primary"),
    b.stat("Due today", "12", 40), b.stat("Overdue", "3", 10), b.stat("Calls this week", "46", 58), b.stat("Meetings this week", "18", 36),
    b.table({
      columns: ["Activity", "Contact", "Type", "Owner", "Due", "Status"],
      rows: [
        { Activity: "Renewal call", Contact: "Priya Raghavan", Type: "Call", Owner: "Sasha Lin", Due: "Today, 14:00", Status: "Pending" },
        { Activity: "Send proposal", Contact: "Marcus Bell", Type: "Email", Owner: "Devin Okafor", Due: "Today, 17:00", Status: "Pending" },
        { Activity: "Product demo", Contact: "Tom Okonkwo", Type: "Meeting", Owner: "Devin Okafor", Due: "Tomorrow, 10:30", Status: "Scheduled" },
        { Activity: "Check in after trial", Contact: "Yuki Tanaka", Type: "Email", Owner: "Sasha Lin", Due: "Oct 2", Status: "Overdue" },
        { Activity: "Quarterly review", Contact: "Hannah Cole", Type: "Meeting", Owner: "Sasha Lin", Due: "Sep 30", Status: "Done" },
      ],
    }),
    b.chart("HighchartColumn", "Activities logged, last 6 weeks", {
      categories: ["Aug 25", "Sep 1", "Sep 8", "Sep 15", "Sep 22", "Sep 29"],
      series: [{ name: "Calls", data: [38, 42, 40, 51, 44, 46] }, { name: "Meetings", data: [12, 15, 14, 19, 16, 18] }, { name: "Emails", data: [96, 104, 99, 118, 110, 121] }],
    }),
  ];
}

function crmReports(): Block[] {
  const b = blocksFor("crm-reports");
  return [
    b.title("Reports", "h3", 9), b.dropdown("This quarter"),
    b.chart("HighchartArea", "Contacts added, last 30 days", crmContactsAdded, 8), b.donut("Pipeline by status", crmByStatus),
    b.chart("HighchartColumn", "Closed won by month, $ thousands", { categories: ["May", "Jun", "Jul", "Aug", "Sep"], series: [{ name: "Closed won", data: [182, 204, 176, 231, 248] }] }, 6),
    b.chart("HighchartBar", "Win rate by source", { categories: ["Referral", "Website", "Events", "Outbound", "Partners"], series: [{ name: "Win rate %", data: [38, 24, 21, 14, 31] }] }, 6),
  ];
}

export const crmBodies = (): Record<string, Block[]> => ({
  Companies: crmCompanies(), Deals: crmDeals(), Activities: crmActivities(), Reports: crmReports(),
});

/* ── Login ─────────────────────────────────────────────────────── */

function loginCreateAccount(): Block[] {
  const b = blocksFor("lf-create");
  return [
    b.title("Create your account", "h2"),
    b.title(`Start a free 14-day trial of ${authContent.brand}. No card needed.`, "h4"),
    b.button(authContent.oauth[0], "outline", 12), b.button(authContent.oauth[1], "outline", 12),
    b.field("Full name", "Alex Morgan"),
    b.field("Work email", authContent.emailPlaceholder),
    b.field("Password", "At least 12 characters"),
    b.check("I agree to the Terms and Privacy Policy"),
    b.button("Create account", "primary", 12),
    b.link("Already have an account? Sign in"),
  ];
}

function loginHelp(): Block[] {
  const b = blocksFor("lf-help");
  return [
    b.title("Help with signing in", "h2"),
    b.search("Search help articles", 12),
    b.card("Reset your password", "Use Forgot password on the sign-in screen and we'll email a link that works for 30 minutes.", 6),
    b.card("Single sign-on", "If your company uses Google or Microsoft, choose that button. Your admin manages access.", 6),
    b.card("Two-factor codes", "Lost your phone? Use a backup code, or ask an admin to reset two-factor for you.", 6),
    b.card("Locked out", "After 5 wrong attempts we pause sign-in for 15 minutes to keep your account safe.", 6),
    b.alert("Still stuck?", "Our support team replies within one working day.", "info"),
    b.button("Contact support", "secondary", 4),
  ];
}

export const loginBodies = (): Record<string, Block[]> => ({
  "Create account": loginCreateAccount(), Help: loginHelp(),
});
