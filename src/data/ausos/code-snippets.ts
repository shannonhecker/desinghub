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
};
