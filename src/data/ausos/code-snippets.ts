import type { CodeSnippets } from '../salt/types';

export const AUSOS_CODE: CodeSnippets = {
  buttons: {
    react: `import { Button } from "@ausos/core";

// 4 appearances: primary, secondary, ghost, outline
<Button appearance="primary">Primary</Button>
<Button appearance="secondary">Secondary</Button>
<Button appearance="outline">Outline</Button>
<Button appearance="ghost">Ghost</Button>

// Disabled state
<Button appearance="primary" disabled>Disabled</Button>`,
    html: `<button class="a-btn a-btn-primary">Primary</button>
<button class="a-btn a-btn-secondary">Secondary</button>
<button class="a-btn a-btn-outline">Outline</button>
<button class="a-btn a-btn-ghost">Ghost</button>
<button class="a-btn a-btn-primary" disabled>Disabled</button>`
  },
  inputs: {
    react: `import { Input, FormField } from "@ausos/core";

<FormField label="Full Name">
  <Input placeholder="Enter your name" />
</FormField>

<FormField label="Email">
  <Input type="email" placeholder="you@example.com" />
</FormField>`,
    html: `<div class="a-input-wrap">
  <label class="a-input-label">Full Name</label>
  <input class="a-input" placeholder="Enter your name" />
</div>`
  },
  checkboxes: {
    react: `import { Checkbox } from "@ausos/core";

<Checkbox label="Option A" checked />
<Checkbox label="Option B" />
<Checkbox label="Option C" disabled />`,
    html: `<label class="a-checkbox checked">
  <span class="a-cb-box">✓</span>
  Option A
</label>
<label class="a-checkbox">
  <span class="a-cb-box"></span>
  Option B
</label>`
  },
  radios: {
    react: `import { RadioGroup, Radio } from "@ausos/core";

<RadioGroup label="Size" value="medium">
  <Radio value="small" label="Small" />
  <Radio value="medium" label="Medium" />
  <Radio value="large" label="Large" />
</RadioGroup>`,
    html: `<div class="a-radio selected">
  <span class="a-radio-circle"><span></span></span>
  Medium
</div>
<div class="a-radio">
  <span class="a-radio-circle"></span>
  Large
</div>`
  },
  switches: {
    react: `import { Switch } from "@ausos/core";

<Switch label="Dark mode" checked />
<Switch label="Notifications" />`,
    html: `<button class="a-switch on" role="switch" aria-checked="true">
  <div class="a-sw-thumb"></div>
</button>
<button class="a-switch" role="switch" aria-checked="false">
  <div class="a-sw-thumb"></div>
</button>`
  },
  tabs: {
    react: `import { Tabs, Tab } from "@ausos/core";

<Tabs value="general">
  <Tab value="general" label="General" />
  <Tab value="security" label="Security" />
  <Tab value="billing" label="Billing" />
</Tabs>`,
    html: `<div class="a-tabs">
  <button class="a-tab active">General</button>
  <button class="a-tab">Security</button>
  <button class="a-tab">Billing</button>
</div>`
  },
  cards: {
    react: `import { Card } from "@ausos/core";

<Card>
  <Card.Header>Analytics</Card.Header>
  <Card.Body>Track key metrics and performance.</Card.Body>
</Card>`,
    html: `<div class="a-card" style="padding: 16px">
  <h3>Analytics</h3>
  <p>Track key metrics and performance.</p>
</div>`
  },
  badges: {
    react: `import { Badge } from "@ausos/core";

<Badge variant="accent">Active</Badge>
<Badge variant="success">Done</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Error</Badge>`,
    html: `<span class="a-badge a-badge-accent">Active</span>
<span class="a-badge a-badge-success">Done</span>
<span class="a-badge a-badge-warning">Pending</span>
<span class="a-badge a-badge-danger">Error</span>`
  },
  avatars: {
    react: `import { Avatar } from "@ausos/core";

<Avatar initials="SH" />
<Avatar initials="JD" color="warning" />
<Avatar initials="AB" color="danger" />`,
    html: `<div class="a-avatar">SH</div>
<div class="a-avatar">JD</div>`
  },
  alerts: {
    react: `import { Alert } from "@ausos/core";

<Alert variant="info">New update available.</Alert>
<Alert variant="success">Changes saved.</Alert>
<Alert variant="warning">API rate limit approaching.</Alert>
<Alert variant="danger">Connection failed.</Alert>`,
    html: `<div class="a-alert a-alert-info">
  <span class="material-symbols-outlined">info</span>
  New update available.
</div>
<div class="a-alert a-alert-success">
  <span class="material-symbols-outlined">check_circle</span>
  Changes saved.
</div>`
  },
  progress: {
    react: `import { Progress } from "@ausos/core";

<Progress value={72} label="Upload" />
<Progress value={45} label="Processing" />`,
    html: `<div class="a-progress-track">
  <div class="a-progress-fill" style="width: 72%"></div>
</div>`
  },
  tooltips: {
    react: `import { Tooltip, Button } from "@ausos/core";

<Tooltip content="This is a tooltip">
  <Button>Hover me</Button>
</Tooltip>`,
    html: `<div class="a-tooltip">This is a tooltip</div>`
  },
  dropdowns: {
    react: `import { Dropdown } from "@ausos/core";

<Dropdown
  placeholder="Select option"
  options={["Option A", "Option B", "Option C"]}
/>`,
    html: `<div class="a-dropdown">
  <button class="a-dropdown-trigger">
    Select option <span>▾</span>
  </button>
  <div class="a-dropdown-menu">
    <div class="a-dropdown-item">Option A</div>
    <div class="a-dropdown-item">Option B</div>
  </div>
</div>`
  },
  dialog: {
    react: `import { Dialog, Button } from "@ausos/core";

<Dialog open title="Confirm action">
  <p>Are you sure? This cannot be undone.</p>
  <Dialog.Actions>
    <Button appearance="ghost">Cancel</Button>
    <Button appearance="primary">Confirm</Button>
  </Dialog.Actions>
</Dialog>`,
    html: `<div class="a-dialog-backdrop">
  <div class="a-dialog">
    <h3>Confirm action</h3>
    <p>Are you sure?</p>
    <div>
      <button class="a-btn a-btn-ghost">Cancel</button>
      <button class="a-btn a-btn-primary">Confirm</button>
    </div>
  </div>
</div>`
  },
  accordion: {
    react: `import { Accordion } from "@ausos/core";

<Accordion title="What is ausos DS?">
  A glassmorphism design system with frosted surfaces
  and semantic token architecture.
</Accordion>`,
    html: `<div class="a-accordion">
  <button class="a-accordion-header">
    What is ausos DS? <span>▾</span>
  </button>
  <div class="a-accordion-body">
    A glassmorphism design system...
  </div>
</div>`
  },
  breadcrumbs: {
    react: `import { Breadcrumbs, BreadcrumbItem } from "@ausos/core";

<Breadcrumbs>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem href="/projects">Projects</BreadcrumbItem>
  <BreadcrumbItem current>Design Hub</BreadcrumbItem>
</Breadcrumbs>`,
    html: `<nav>
  <a href="/">Home</a> / <a href="/projects">Projects</a> / <span>Design Hub</span>
</nav>`
  },
  "data-table": {
    react: `import { Table } from "@ausos/core";

<Table
  columns={[
    { key: "name", header: "Name" },
    { key: "status", header: "Status" },
    { key: "users", header: "Users" },
  ]}
  rows={[
    { name: "Dashboard", status: "Active", users: "1,247" },
    { name: "Analytics", status: "Pending", users: "892" },
  ]}
/>`,
    html: `<table class="a-table">
  <thead>
    <tr><th>Name</th><th>Status</th><th>Users</th></tr>
  </thead>
  <tbody>
    <tr><td>Dashboard</td><td>Active</td><td>1,247</td></tr>
  </tbody>
</table>`
  },
  "date-picker": {
    react: `import { DatePicker } from "@ausos/core";

<DatePicker
  label="Start date"
  value={new Date(2026, 3, 15)}
  onChange={(date) => console.log(date)}
/>`,
    html: `<!-- Date picker renders a calendar grid -->
<div class="a-input-wrap">
  <label class="a-input-label">Start date</label>
  <input class="a-input" value="Apr 15, 2026" readonly />
</div>`
  },
  "ag-grid": {
    react: `import { AgGridReact } from "ag-grid-react";
import { themeQuartz } from "ag-grid-community";

// ausos glass theme for AG Grid
const ausosTheme = themeQuartz.withParams({
  accentColor: "#7E6BC4",
  backgroundColor: "#0b1120",
  foregroundColor: "#E8EAED",
  headerBackgroundColor: "#0e1428",
  borderColor: "rgba(255,255,255,0.12)",
  borderRadius: 12,
  fontFamily: "'Inter', sans-serif",
});

<AgGridReact theme={ausosTheme} rowData={data} columnDefs={cols} />`,
    html: `<!-- AG Grid requires JavaScript initialization -->
<div id="grid" class="ag-theme-quartz" style="height: 400px"></div>`
  },

  // ── New Components (gap fill) ──
  pills: {
    react: `<div style={{ display: "flex", gap: 6 }}>
  <button className="a-pill active">All</button>
  <button className="a-pill">Design</button>
  <button className="a-pill">Code</button>
</div>`,
    html: `<div style="display: flex; gap: 6px">
  <button class="a-pill active">All</button>
  <button class="a-pill">Design</button>
</div>`
  },
  "toggle-btn": {
    react: `<button className={\`a-toggle-btn \${pressed ? "active" : ""}\`}
  onClick={() => setPressed(!pressed)}>
  <span className="material-symbols-outlined">format_bold</span>
</button>`,
    html: `<button class="a-toggle-btn active">Bold</button>`
  },
  "segmented-btn": {
    react: `<div className="a-segmented-group">
  <button className="a-seg-btn active">Day</button>
  <button className="a-seg-btn">Week</button>
  <button className="a-seg-btn">Month</button>
</div>`,
    html: `<div class="a-segmented-group">
  <button class="a-seg-btn active">Day</button>
  <button class="a-seg-btn">Week</button>
</div>`
  },
  link: {
    react: `<a className="a-link" href="#">Learn more
  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
</a>`,
    html: `<a class="a-link" href="#">Learn more &rarr;</a>`
  },
  slider: {
    react: `<div className="a-slider-wrap">
  <label>Volume</label>
  <input type="range" className="a-slider" min={0} max={100} value={50}
    onChange={(e) => setValue(Number(e.target.value))} />
</div>`,
    html: `<label>Volume</label>
<input type="range" class="a-slider" min="0" max="100" value="50" />`
  },
  "number-input": {
    react: `<div className="a-number-input">
  <label>Quantity</label>
  <div className="a-number-input-wrap">
    <button onClick={() => setVal(v => v - 1)}>-</button>
    <input type="number" value={val} onChange={(e) => setVal(Number(e.target.value))} />
    <button onClick={() => setVal(v => v + 1)}>+</button>
  </div>
</div>`,
    html: `<div class="a-number-input-wrap">
  <button>-</button>
  <input type="number" value="1" />
  <button>+</button>
</div>`
  },
  "multiline-input": {
    react: `<div className="a-form-field">
  <label>Description</label>
  <textarea className="a-textarea" rows={3}
    placeholder="Enter description..." />
</div>`,
    html: `<label>Description</label>
<textarea class="a-textarea" rows="3" placeholder="Enter description..."></textarea>`
  },
  "combo-box": {
    react: `<div className="a-combo-box">
  <input className="a-input" placeholder="Search countries..."
    value={query} onChange={(e) => setQuery(e.target.value)} />
  {open && (
    <div className="a-combo-menu">
      {filtered.map(item => (
        <button key={item} className="a-combo-option">{item}</button>
      ))}
    </div>
  )}
</div>`,
    html: `<input class="a-input" placeholder="Search..." />
<div class="a-combo-menu">
  <button class="a-combo-option">United States</button>
  <button class="a-combo-option">Canada</button>
</div>`
  },
  "list-box": {
    react: `<div className="a-list-box" role="listbox">
  {items.map(item => (
    <button key={item} role="option"
      className={\`a-list-item \${selected === item ? "selected" : ""}\`}
      onClick={() => setSelected(item)}>
      {item}
    </button>
  ))}
</div>`,
    html: `<div class="a-list-box" role="listbox">
  <button class="a-list-item selected" role="option">Apple</button>
  <button class="a-list-item" role="option">Banana</button>
</div>`
  },
  "file-drop": {
    react: `<div className="a-file-drop"
  onDragOver={(e) => e.preventDefault()}
  onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
  <span className="material-symbols-outlined">upload_file</span>
  <p>Drag & drop files here</p>
  <span className="a-file-drop-hint">.png, .jpg, .pdf</span>
</div>`,
    html: `<div class="a-file-drop">
  <span class="material-symbols-outlined">upload_file</span>
  <p>Drag &amp; drop files here</p>
</div>`
  },
  dividers: {
    react: `{/* Horizontal */}
<hr className="a-divider" />

{/* Vertical — inside a flex row */}
<div style={{ display: "flex", alignItems: "stretch" }}>
  <span>Left</span>
  <div className="a-divider-v" />
  <span>Right</span>
</div>`,
    html: `<hr class="a-divider" />
<div class="a-divider-v" style="height: 24px"></div>`
  },
  spinner: {
    react: `<div className="a-spinner" role="progressbar" aria-label="Loading">
  <svg viewBox="0 0 24 24" width={24} height={24}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
      fill="none" strokeDasharray="50 20" />
  </svg>
</div>`,
    html: `<div class="a-spinner" role="progressbar">
  <svg viewBox="0 0 24 24" width="24" height="24">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"
      fill="none" stroke-dasharray="50 20" />
  </svg>
</div>`
  },
  toast: {
    react: `<div className="a-toast a-toast-success">
  <span className="material-symbols-outlined">check_circle</span>
  <span>Changes saved successfully</span>
  <button className="a-toast-close" onClick={dismiss}>
    <span className="material-symbols-outlined">close</span>
  </button>
</div>`,
    html: `<div class="a-toast a-toast-success">
  <span class="material-symbols-outlined">check_circle</span>
  <span>Changes saved</span>
  <button class="a-toast-close">&times;</button>
</div>`
  },
  stepper: {
    react: `<div className="a-stepper">
  <div className="a-step completed">
    <div className="a-step-circle">1</div>
    <span>Details</span>
  </div>
  <div className="a-step-line" />
  <div className="a-step active">
    <div className="a-step-circle">2</div>
    <span>Review</span>
  </div>
  <div className="a-step-line" />
  <div className="a-step">
    <div className="a-step-circle">3</div>
    <span>Done</span>
  </div>
</div>`,
    html: `<div class="a-stepper">
  <div class="a-step completed"><div class="a-step-circle">1</div><span>Details</span></div>
  <div class="a-step-line"></div>
  <div class="a-step active"><div class="a-step-circle">2</div><span>Review</span></div>
</div>`
  },
  menu: {
    react: `<div className="a-menu" role="menu">
  <button className="a-menu-item" role="menuitem">
    <span className="material-symbols-outlined">edit</span> Edit
  </button>
  <button className="a-menu-item" role="menuitem">
    <span className="material-symbols-outlined">content_copy</span> Duplicate
  </button>
  <hr className="a-divider" />
  <button className="a-menu-item danger" role="menuitem">
    <span className="material-symbols-outlined">delete</span> Delete
  </button>
</div>`,
    html: `<div class="a-menu" role="menu">
  <button class="a-menu-item" role="menuitem">Edit</button>
  <hr class="a-divider" />
  <button class="a-menu-item danger" role="menuitem">Delete</button>
</div>`
  },
  tag: {
    react: `<span className="a-tag">
  Design
  <button className="a-tag-dismiss" onClick={onRemove}>
    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
  </button>
</span>`,
    html: `<span class="a-tag">Design <button class="a-tag-dismiss">&times;</button></span>`
  },

  // ── Foundations ──
  "dl-color": {
    react: `// ausos DS color tokens
const colors = {
  bg: "var(--a-bg)",           // #0b1120 (dark) / #FFFFFF (light)
  surface: "var(--a-surface)", // Glass surface
  fg: "var(--a-fg)",           // Primary text
  fg2: "var(--a-fg2)",         // Secondary text
  accent: "var(--a-accent)",   // Violet accent
  border: "var(--a-border)",   // Decorative borders
  borderStrong: "var(--a-border-strong)", // Input borders (3:1)
};`,
    html: `<!-- Use CSS custom properties for all colors -->
<style>
  .card { background: var(--a-surface); border: 1px solid var(--a-border); }
  .text { color: var(--a-fg); }
  .accent { color: var(--a-accent); }
</style>`
  },
  "dl-icons": {
    react: `// Material Symbols Outlined icons
<span className="material-symbols-outlined">search</span>
<span className="material-symbols-outlined">settings</span>
<span className="material-symbols-outlined">home</span>

// With ausos muted styling
<span className="material-symbols-outlined"
  style={{ fontSize: 20, color: "var(--a-fg2)" }}>
  favorite
</span>`,
    html: `<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
<span class="material-symbols-outlined">search</span>`
  },
  "dl-typography": {
    react: `// ausos type scale — Inter font
const typeScale = {
  display:  { size: 48, weight: 300 },
  headline: { size: 22, weight: 600 },
  title:    { size: 16, weight: 600 },
  body:     { size: 15, weight: 400 },
  label:    { size: 12, weight: 500 },
  caption:  { size: 11, weight: 400 },
};

<h1 style={{ fontSize: 48, fontWeight: 300 }}>Display</h1>
<h2 style={{ fontSize: 22, fontWeight: 600 }}>Headline</h2>
<p style={{ fontSize: 15, fontWeight: 400 }}>Body text</p>`,
    html: `<style>
  body { font-family: 'Inter', sans-serif; }
  .display { font-size: 48px; font-weight: 300; }
  .headline { font-size: 22px; font-weight: 600; }
  .body { font-size: 15px; font-weight: 400; }
</style>`
  },
  "dl-elevation": {
    react: `// 4 glass elevation levels via backdrop-filter
const elevations = {
  level0: { backdropFilter: "none" },
  level1: { backdropFilter: "blur(8px) saturate(140%)" },
  level2: { backdropFilter: "blur(16px) saturate(140%)" },
  level3: { backdropFilter: "blur(24px) saturate(150%)" },
};

<div style={{
  background: "rgba(255,255,255,0.06)",
  backdropFilter: "blur(16px) saturate(140%)",
  border: "1px solid rgba(255,255,255,0.10)",
}}>
  Glass panel
</div>`,
    html: `<div style="backdrop-filter: blur(16px) saturate(140%);
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.10);">
  Glass panel
</div>`
  },
  "dl-spacing": {
    react: `// ausos spacing scale (4px base grid)
const spacing = {
  25: 2, 50: 4, 100: 8, 150: 12,
  200: 16, 300: 24, 400: 32,
  500: 40, 600: 48, 800: 64,
};

<div style={{ padding: "var(--a-spacing-200)" }}>16px padding</div>
<div style={{ gap: "var(--a-spacing-100)" }}>8px gap</div>`,
    html: `<div style="padding: 16px; gap: 8px;">
  <!-- Use 4px grid multiples -->
</div>`
  },
  "dl-tokens": {
    react: `// 3-layer token architecture
// Foundation → Semantic → Component

// Foundation (raw values)
const foundation = { teal500: "#7E6BC4", grey900: "#0b1120" };

// Semantic (role-based)
const semantic = {
  accent: "var(--a-accent)",    // → foundation.violet
  bg: "var(--a-bg)",            // → foundation.grey900
  surface: "var(--a-surface)",  // → rgba(255,255,255,0.06)
};

// Component (scoped)
// .a-btn-primary { background: var(--a-accent); }`,
    html: `<style>
:root {
  --a-bg: #0b1120;
  --a-surface: rgba(255,255,255,0.06);
  --a-fg: #E8EAED;
  --a-accent: #7E6BC4;
  --a-border: rgba(255,255,255,0.06);
}
</style>`
  },
  "dl-a11y": {
    react: `// WCAG 2.1 AA compliance
// Text contrast: 4.5:1 minimum (normal), 3:1 (large/UI)
// Touch targets: 44px minimum
// Focus rings: 2px accent outline

<button style={{
  minHeight: 44,           // Touch target
  outline: "none",
}}>
  {/* Focus ring via CSS */}
</button>

// CSS: .a-btn:focus-visible { outline: 2px solid var(--a-accent); }`,
    html: `<!-- Accessibility checklist -->
<!-- ✅ 4.5:1 text contrast -->
<!-- ✅ 3:1 UI component contrast -->
<!-- ✅ 44px touch targets -->
<!-- ✅ 2px focus rings -->
<!-- ✅ prefers-reduced-motion support -->`
  },
  "dl-density": {
    react: `// 4 density levels
const densities = {
  high:   { height: 24, fontSize: 11, gap: 6 },
  medium: { height: 32, fontSize: 13, gap: 8 },  // default
  low:    { height: 40, fontSize: 14, gap: 10 },
  touch:  { height: 48, fontSize: 15, gap: 14 },
};

<AusosProvider density="medium">
  <App />
</AusosProvider>`,
    html: `<!-- Density scales all component sizes -->
<div class="density-medium">
  <button class="a-btn a-btn-primary">Medium (32px)</button>
</div>`
  },
  "dl-content": {
    react: `// Content design principles
// ✅ Concise — say more with less
// ✅ Present tense — "Save changes" not "Changes will be saved"
// ✅ Active voice — "Enter your name" not "Your name should be entered"
// ✅ Sentence case — "Sign in" not "Sign In"
// ✅ No jargon — "Something went wrong" not "Error 500"`,
    html: `<!-- UX writing guidelines -->
<!-- Button: "Save" not "Submit" -->
<!-- Error: "Connection lost" not "ERR_NETWORK" -->
<!-- Empty: "No results yet" not "null" -->`
  },
  tokens: {
    react: `// Token reference — import and use
import { tokens } from "@ausos/core";

// Color tokens
tokens.color.bg;      // "#0b1120"
tokens.color.accent;  // "#7E6BC4"
tokens.color.fg;      // "#E8EAED"

// Spacing tokens
tokens.spacing[100];   // 8
tokens.spacing[200];   // 16

// Typography tokens
tokens.type.display;   // { size: 48, weight: 300 }`,
    html: `<style>
  /* All tokens available as CSS custom properties */
  .element {
    color: var(--a-fg);
    background: var(--a-surface);
    padding: var(--a-spacing-200);
    border-radius: var(--a-radius);
  }
</style>`
  },
  audit: {
    react: `// Design audit — check your code for violations
import { audit } from "@ausos/tools";

const result = audit(myComponent);
// Returns: {
//   rawHex: ["#ff0000 on line 12"],  // Use tokens instead
//   contrast: [{ ratio: 2.1, element: ".label" }],
//   a11y: ["Missing aria-label on icon button"],
// }`,
    html: `<!-- Audit checks for: -->
<!-- ❌ Raw hex values (use var(--a-*) tokens) -->
<!-- ❌ Contrast below 4.5:1 -->
<!-- ❌ Missing ARIA labels -->
<!-- ❌ Touch targets below 44px -->`
  },
  charts: {
    react: `import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

// ausos chart theme
const ausosTheme = {
  colors: T.chart, // 10-color palette
  chart: { backgroundColor: "transparent" },
  xAxis: { gridLineColor: "var(--a-border)" },
  yAxis: { gridLineColor: "var(--a-border)" },
  tooltip: { borderRadius: 12 },
};

<HighchartsReact highcharts={Highcharts} options={{
  ...ausosTheme,
  series: [{ data: [1, 3, 2, 4] }],
}} />`,
    html: `<!-- Highcharts with ausos theme -->
<div id="chart"></div>
<script>
  Highcharts.chart('chart', {
    colors: ['#7E6BC4', '#f46a9b', '#27aeef'],
    chart: { backgroundColor: 'transparent' },
  });
</script>`
  },

  // ── Patterns ──
  "pat-dashboard": {
    react: `// Analytical Dashboard pattern
import { Card, Table, Badge, Progress } from "@ausos/core";

<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
  <Card>
    <div style={{ fontSize: 11, color: "var(--a-fg3)" }}>Revenue</div>
    <div style={{ fontSize: 20, fontWeight: 700 }}>$42,800</div>
    <Progress value={72} />
    <span style={{ color: "var(--a-success)" }}>+12.5%</span>
  </Card>
  {/* ... more stat cards */}
</div>

<Table columns={cols} rows={data} />`,
    html: `<div class="a-card" style="padding: 16px">
  <small>Revenue</small>
  <h2>$42,800</h2>
  <div class="a-progress-track">
    <div class="a-progress-fill" style="width: 72%"></div>
  </div>
</div>`
  },
  "pat-form": {
    react: `import { FormField, Input, Button } from "@ausos/core";

<form>
  <FormField label="Full Name" required>
    <Input placeholder="Jane Doe" />
  </FormField>
  <FormField label="Email" required>
    <Input type="email" placeholder="jane@company.com" />
  </FormField>
  <div style={{ display: "flex", gap: 8 }}>
    <Button appearance="primary">Submit</Button>
    <Button appearance="secondary">Cancel</Button>
  </div>
</form>`,
    html: `<form>
  <div class="a-input-wrap">
    <label class="a-input-label">Full Name</label>
    <input class="a-input" placeholder="Jane Doe" />
  </div>
  <button class="a-btn a-btn-primary">Submit</button>
</form>`
  },
  "pat-list-detail": {
    react: `// List-Detail pattern
<div style={{ display: "flex", gap: 1 }}>
  <aside style={{ width: 240 }}>
    <SidebarItem active>Dashboard Report</SidebarItem>
    <SidebarItem>User Metrics</SidebarItem>
    <SidebarItem>System Alerts</SidebarItem>
  </aside>
  <main style={{ flex: 1 }}>
    <h2>Dashboard Report</h2>
    <p>Q4 revenue analysis...</p>
  </main>
</div>`,
    html: `<div style="display: flex">
  <nav style="width: 240px">
    <button class="a-sidebar-item active">Dashboard</button>
    <button class="a-sidebar-item">Metrics</button>
  </nav>
  <main style="flex: 1">Content</main>
</div>`
  },
  "pat-app-shell": {
    react: `// App Shell pattern
<div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
  <header className="a-header">App Name</header>
  <div style={{ display: "flex", flex: 1 }}>
    <nav style={{ width: 240 }}>
      <SidebarItem icon="home" active>Home</SidebarItem>
      <SidebarItem icon="data">Data</SidebarItem>
      <SidebarItem icon="settings">Settings</SidebarItem>
    </nav>
    <main style={{ flex: 1 }}>Content</main>
  </div>
</div>`,
    html: `<div style="display: flex; flex-direction: column; height: 100vh">
  <header>App Shell</header>
  <div style="display: flex; flex: 1">
    <nav><button class="a-sidebar-item active">Home</button></nav>
    <main>Content</main>
  </div>
</div>`
  },
  "pat-login": {
    react: `import { Input, Button } from "@ausos/core";

<div style={{ maxWidth: 400, margin: "0 auto" }}>
  <h1>Sign in</h1>
  <p>Enter your credentials</p>
  <FormField label="Email">
    <Input type="email" />
  </FormField>
  <FormField label="Password">
    <Input type="password" />
  </FormField>
  <Button appearance="primary" fullWidth>Sign in</Button>
</div>`,
    html: `<div style="max-width: 400px; margin: 0 auto">
  <h1>Sign in</h1>
  <div class="a-input-wrap">
    <label class="a-input-label">Email</label>
    <input class="a-input" type="email" />
  </div>
  <button class="a-btn a-btn-primary" style="width: 100%">Sign in</button>
</div>`
  },
  "pat-settings": {
    react: `import { SidebarItem, Input, Switch } from "@ausos/core";

<div style={{ display: "flex", gap: 24 }}>
  <nav style={{ width: 200 }}>
    <SidebarItem active>General</SidebarItem>
    <SidebarItem>Security</SidebarItem>
    <SidebarItem>Notifications</SidebarItem>
  </nav>
  <main>
    <h2>General Settings</h2>
    <FormField label="Display Name">
      <Input defaultValue="Jane Doe" />
    </FormField>
    <Switch label="Dark mode" checked />
  </main>
</div>`,
    html: `<div style="display: flex; gap: 24px">
  <nav>
    <button class="a-sidebar-item active">General</button>
    <button class="a-sidebar-item">Security</button>
  </nav>
  <main>
    <h2>General</h2>
    <div class="a-input-wrap"><input class="a-input" value="Jane" /></div>
  </main>
</div>`
  },
  "pat-search": {
    react: `import { Input, Button, Card } from "@ausos/core";

<Input placeholder="Search templates..." fullWidth />
<div style={{ display: "flex", gap: 8 }}>
  <Button appearance="primary">All</Button>
  <Button appearance="ghost">Free</Button>
  <Button appearance="ghost">Pro</Button>
</div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
  <Card>Dashboard Kit</Card>
  <Card>Admin Panel</Card>
</div>`,
    html: `<input class="a-input" placeholder="Search..." />
<div>
  <button class="a-btn a-btn-primary">All</button>
  <button class="a-btn a-btn-ghost">Free</button>
</div>
<div class="a-card">Dashboard Kit</div>`
  },
  "pat-wizard": {
    react: `import { Stepper, Step, Input, Button } from "@ausos/core";

<Stepper activeStep={0}>
  <Step label="Details" />
  <Step label="Review" />
  <Step label="Done" />
</Stepper>

<h2>Step 1: Details</h2>
<FormField label="Project Name">
  <Input defaultValue="My Project" />
</FormField>
<Button appearance="primary">Next</Button>`,
    html: `<div style="display: flex; gap: 8px; align-items: center">
  <div class="a-badge a-badge-accent">1</div>
  <div style="flex: 1; height: 2px; background: var(--a-accent)"></div>
  <div class="a-badge a-badge-default">2</div>
  <div style="flex: 1; height: 2px; background: var(--a-border)"></div>
  <div class="a-badge a-badge-default">3</div>
</div>`
  },
  "pat-data-table": {
    react: `import { Input, Button, Table, Badge } from "@ausos/core";

<div style={{ display: "flex", gap: 8 }}>
  <Input placeholder="Filter..." style={{ flex: 1 }} />
  <Button appearance="primary">Export</Button>
</div>

<Table
  columns={[
    { key: "name", header: "Project" },
    { key: "status", header: "Status", render: (v) => <Badge variant={v === "Active" ? "success" : "warning"}>{v}</Badge> },
    { key: "users", header: "Users" },
    { key: "revenue", header: "Revenue", align: "right" },
  ]}
  rows={data}
/>`,
    html: `<input class="a-input" placeholder="Filter..." />
<button class="a-btn a-btn-primary">Export</button>
<table class="a-table">
  <thead><tr><th>Project</th><th>Status</th><th>Users</th></tr></thead>
  <tbody>
    <tr>
      <td>Dashboard</td>
      <td><span class="a-badge a-badge-success">Active</span></td>
      <td>1,247</td>
    </tr>
  </tbody>
</table>`
  },
};
