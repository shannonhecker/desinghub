/* Carbon code snippets - Phase 2a.
   Keyed by componentId matching entries in CARBON_COMPS. React
   snippets import from @carbon/react; HTML snippets show the raw
   markup with .cb-* class names scoped by carbonBuildCSS. */

import type { CodeSnippets } from "../salt/types";

export const CARBON_CODE: CodeSnippets = {
  /* ── Foundations ── */
  "dl-color": {
    react: `// Carbon colour tokens (via @carbon/react's theme tokens)
import { Theme } from "@carbon/react";

<Theme theme="white">
  <div style={{ color: "var(--cds-text-primary)" }}>
    Primary text on white surface.
  </div>
</Theme>

// Semantic role tokens (preferred over raw hex):
// - $interactive      → #0f62fe (brand blue)
// - $background       → #ffffff (white theme)
// - $layer-01 / 02    → elevated surfaces
// - $text-primary     → #161616
// - $support-error    → #da1e28
// - $support-success  → #24a148`,
    html: `<!-- Carbon CSS vars exposed by @carbon/styles -->
<style>
  .card {
    background: var(--cds-layer-01);
    color: var(--cds-text-primary);
    border: 1px solid var(--cds-border-subtle);
  }
</style>`,
  },

  "dl-typography": {
    react: `// IBM Plex Sans type scale - 17 steps, productive + expressive
import "@carbon/react/scss/type";

<h1 className="cds--type-display-01">Display 01 - 42px / 300</h1>
<h2 className="cds--type-heading-04">Heading 04 - 28px</h2>
<h3 className="cds--type-heading-02">Heading 02 - 20px</h3>
<p className="cds--type-body-02">Body 02 - 16px</p>
<p className="cds--type-body-01">Body 01 - 14px</p>
<span className="cds--type-helper-text-01">Helper - 12px</span>`,
    html: `<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
<style>
  body { font-family: 'IBM Plex Sans', sans-serif; }
  .display-01 { font: 300 42px/1.2 'IBM Plex Sans'; }
</style>`,
  },

  "dl-spacing": {
    react: `// Carbon spacing tokens - 2px base. Keep layouts on the scale.
<div style={{ padding: "var(--cds-spacing-05)" }}>  {/* 16px */}
  Content
</div>

// Full scale:
// spacing-01 = 2px   spacing-06 = 24px
// spacing-02 = 4px   spacing-07 = 32px
// spacing-03 = 8px   spacing-08 = 40px
// spacing-04 = 12px  spacing-09 = 48px
// spacing-05 = 16px  spacing-10 = 64px`,
    html: `<style>
  :root {
    --s-01: 2px; --s-02: 4px; --s-03: 8px; --s-04: 12px;
    --s-05: 16px; --s-06: 24px; --s-07: 32px; --s-08: 40px;
  }
  .row { display: flex; gap: var(--s-05); padding: var(--s-05); }
</style>`,
  },

  "dl-elevation": {
    react: `// Carbon is visually flat but uses shadow tokens for overlays.
// Tiles + modals lift via box-shadow; inline content stays flat.
<div style={{ boxShadow: "var(--cds-shadow-raised)" }}>Raised</div>
<div style={{ boxShadow: "var(--cds-shadow-elevated)" }}>Elevated</div>
<div style={{ boxShadow: "var(--cds-shadow-overflow)" }}>Overflow</div>`,
    html: `<style>
  .raised    { box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
  .floating  { box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
  .overflow  { box-shadow: 0 4px 12px rgba(0,0,0,0.16); }
  .modal     { box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
</style>`,
  },

  "dl-icons": {
    react: `// @carbon/icons-react ships 2,000+ icons as tree-shakeable React components.
import { Search, Add, Close, Settings } from "@carbon/icons-react";

<Search size={16} />
<Add size={20} />
<Close size={24} />
<Settings size={32} />`,
    html: `<!-- Production uses @carbon/icons-react -->
<svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor">
  <!-- Carbon SVG path here -->
</svg>`,
  },

  "dl-tokens": {
    react: `// Semantic token layer - sit above raw @carbon/colors.
// Role-based naming makes theme switching painless.
import { usePrefix } from "@carbon/react";

// CSS custom property access
<div style={{
  background: "var(--cds-layer-01)",
  color: "var(--cds-text-primary)",
  borderBottom: "1px solid var(--cds-border-strong)",
}}>
  Themed surface
</div>`,
    html: `<style>
  :root {
    --cds-interactive: #0f62fe;
    --cds-background: #ffffff;
    --cds-layer-01: #f4f4f4;
    --cds-text-primary: #161616;
    --cds-support-error: #da1e28;
  }
</style>`,
  },

  "dl-density": {
    react: `// Carbon density ladder - compact / normal / spacious.
// Control heights: 24 / 32 / 48px.

<Button size="sm">Compact</Button>   {/* 24px */}
<Button>Normal</Button>              {/* 32px */}
<Button size="lg">Spacious</Button>  {/* 48px */}
<Button size="xl">Extra</Button>     {/* 64px */}`,
    html: `<style>
  .cb-btn-sm { height: 24px; font-size: 12px; }
  .cb-btn    { height: 32px; font-size: 14px; }
  .cb-btn-lg { height: 48px; font-size: 14px; }
</style>`,
  },

  "dl-a11y": {
    react: `// Accessibility conventions Carbon enforces:
// - aria-label on icon-only buttons
// - Label association via <FormLabel>
// - Focus ring via inset box-shadow
// - WCAG 2.1 AA contrast on all 4 themes

<IconButton kind="ghost" label="Search">
  <Search size={16} />
</IconButton>`,
    html: `<button aria-label="Search" class="cb-btn cb-btn-ghost">
  <svg class="cb-icon" aria-hidden="true">...</svg>
</button>`,
  },

  "dl-motion": {
    react: `// Carbon motion tokens - duration + easing pairs.
import { motion } from "@carbon/motion";

// Fast-01 (70ms) - button hover, focus
// Fast-02 (110ms) - menu open, tooltip
// Moderate-01 (150ms) - panel slide
// Moderate-02 (240ms) - modal fade
// Slow-01 (400ms) - page transitions`,
    html: `<style>
  .cb-btn { transition: background 70ms cubic-bezier(0.2,0,0.38,0.9); }
</style>`,
  },

  /* ── Components ── */
  buttons: {
    react: `import { Button } from "@carbon/react";

// 5 kinds: primary, secondary, tertiary, ghost, danger
<Button kind="primary">Primary action</Button>
<Button kind="secondary">Secondary</Button>
<Button kind="tertiary">Tertiary</Button>
<Button kind="ghost">Ghost</Button>
<Button kind="danger">Delete</Button>

// 4 sizes: sm, md (default), lg, xl
<Button size="sm">Small</Button>
<Button size="xl">Extra large</Button>`,
    html: `<button class="cb-btn cb-btn-primary">Primary</button>
<button class="cb-btn cb-btn-secondary">Secondary</button>
<button class="cb-btn cb-btn-tertiary">Tertiary</button>
<button class="cb-btn cb-btn-ghost">Ghost</button>
<button class="cb-btn cb-btn-danger">Delete</button>`,
  },

  "icon-button": {
    react: `import { IconButton } from "@carbon/react";
import { Search } from "@carbon/icons-react";

<IconButton label="Search" kind="ghost">
  <Search />
</IconButton>`,
    html: `<button class="cb-btn cb-btn-ghost" aria-label="Search">
  <svg aria-hidden="true">...</svg>
</button>`,
  },

  inputs: {
    react: `import { TextInput, TextArea } from "@carbon/react";

<TextInput
  id="email"
  labelText="Work email"
  placeholder="you@company.com"
  helperText="We never share your email."
/>

<TextArea
  id="message"
  labelText="Message"
  placeholder="Type here..."
  rows={4}
/>`,
    html: `<div class="cb-input-wrap">
  <label class="cb-input-label">Work email</label>
  <input class="cb-input" placeholder="you@company.com" />
  <span class="cb-input-helper">We never share your email.</span>
</div>`,
  },

  search: {
    react: `import { Search } from "@carbon/react";

<Search
  labelText="Search components"
  placeholder="Find components"
  size="md"
/>`,
    html: `<div class="cb-search">
  <svg class="cb-search-icon" aria-hidden="true">...</svg>
  <input class="cb-input" placeholder="Find components" />
</div>`,
  },

  checkboxes: {
    react: `import { Checkbox } from "@carbon/react";

<Checkbox id="opt-a" labelText="Option A" defaultChecked />
<Checkbox id="opt-b" labelText="Option B" />
<Checkbox id="opt-c" labelText="Disabled" disabled />`,
    html: `<label class="cb-checkbox">
  <span class="cb-cb-box checked"></span>
  Option A
</label>`,
  },

  radios: {
    react: `import { RadioButtonGroup, RadioButton } from "@carbon/react";

<RadioButtonGroup name="size" defaultSelected="medium">
  <RadioButton id="sm" value="small" labelText="Small" />
  <RadioButton id="md" value="medium" labelText="Medium" />
  <RadioButton id="lg" value="large" labelText="Large" />
</RadioButtonGroup>`,
    html: `<label class="cb-radio">
  <span class="cb-radio-circle checked"></span>
  Medium
</label>`,
  },

  switches: {
    react: `import { Toggle } from "@carbon/react";

<Toggle
  id="notif"
  labelText="Email notifications"
  defaultToggled
/>`,
    html: `<div class="cb-toggle on">
  <span class="cb-toggle-track"><span class="cb-toggle-thumb"></span></span>
  Email notifications
</div>`,
  },

  tabs: {
    react: `import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@carbon/react";

<Tabs>
  <TabList aria-label="Component tabs">
    <Tab>Overview</Tab>
    <Tab>Usage</Tab>
    <Tab>Code</Tab>
    <Tab>Accessibility</Tab>
  </TabList>
  <TabPanels>
    <TabPanel>Overview content</TabPanel>
    <TabPanel>Usage content</TabPanel>
    <TabPanel>Code content</TabPanel>
    <TabPanel>Accessibility content</TabPanel>
  </TabPanels>
</Tabs>`,
    html: `<div class="cb-tabs">
  <button class="cb-tab active">Overview</button>
  <button class="cb-tab">Usage</button>
  <button class="cb-tab">Code</button>
</div>`,
  },

  tags: {
    react: `import { Tag } from "@carbon/react";

<Tag type="gray">Default</Tag>
<Tag type="blue">Interactive</Tag>
<Tag type="green">Success</Tag>
<Tag type="warm-gray">Warning</Tag>
<Tag type="red">Error</Tag>`,
    html: `<span class="cb-tag">Default</span>
<span class="cb-tag cb-tag-blue">Interactive</span>
<span class="cb-tag cb-tag-green">Success</span>
<span class="cb-tag cb-tag-red">Error</span>`,
  },

  cards: {
    react: `import { Tile, ClickableTile } from "@carbon/react";

<ClickableTile>
  <h4 className="cds--type-heading-03">Active users</h4>
  <p className="cds--type-body-01">12,847</p>
  <span style={{ color: "var(--cds-support-success)" }}>+8%</span>
</ClickableTile>`,
    html: `<div class="cb-tile cb-tile-clickable">
  <div>Active users</div>
  <h1>12,847</h1>
  <span style="color: #24a148;">+8%</span>
</div>`,
  },

  alerts: {
    react: `import { InlineNotification } from "@carbon/react";

<InlineNotification
  kind="success"
  title="Deployment succeeded"
  subtitle="Production is now serving v2.4."
/>
<InlineNotification
  kind="warning"
  title="Upcoming maintenance"
  subtitle="System will be offline Sunday 03:00 UTC."
/>
<InlineNotification
  kind="error"
  title="Couldn't save"
  subtitle="Check your connection and try again."
/>`,
    html: `<div class="cb-notif cb-notif-success">
  <strong>Deployment succeeded</strong>
  <p>Production is now serving v2.4.</p>
</div>`,
  },

  progress: {
    react: `import { ProgressBar } from "@carbon/react";

<ProgressBar
  label="Upload in progress"
  helperText="64%"
  value={64}
  max={100}
/>`,
    html: `<div class="cb-progress">
  <div>Upload in progress</div>
  <div class="cb-progress-track">
    <div class="cb-progress-fill" style="width: 64%"></div>
  </div>
  <div>64%</div>
</div>`,
  },

  loading: {
    react: `import { Loading } from "@carbon/react";

<Loading description="Loading data" withOverlay={false} />`,
    html: `<div class="cb-loading" role="status" aria-label="Loading"></div>`,
  },

  accordion: {
    react: `import { Accordion, AccordionItem } from "@carbon/react";

<Accordion>
  <AccordionItem title="What is Carbon?">
    Carbon is IBM's open-source design system.
  </AccordionItem>
  <AccordionItem title="How do I install?">
    npm install @carbon/react
  </AccordionItem>
  <AccordionItem title="Is it accessible?">
    Yes. WCAG 2.1 AA coverage across all components.
  </AccordionItem>
</Accordion>`,
    html: `<div class="cb-accordion">
  <div class="cb-accordion-item">
    <div class="cb-accordion-head">What is Carbon?</div>
    <div class="cb-accordion-body">Carbon is IBM's open-source design system.</div>
  </div>
</div>`,
  },

  breadcrumbs: {
    react: `import { Breadcrumb, BreadcrumbItem } from "@carbon/react";

<Breadcrumb>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem href="/components">Components</BreadcrumbItem>
  <BreadcrumbItem isCurrentPage>Buttons</BreadcrumbItem>
</Breadcrumb>`,
    html: `<nav class="cb-crumb">
  <a href="/">Home</a>
  <span class="cb-crumb-sep">/</span>
  <a href="/components">Components</a>
  <span class="cb-crumb-sep">/</span>
  <span>Buttons</span>
</nav>`,
  },

  "data-table": {
    react: `import { DataTable, Table, TableHead, TableHeader,
  TableRow, TableBody, TableCell } from "@carbon/react";

const headers = [
  { key: "name", header: "Name" },
  { key: "status", header: "Status" },
  { key: "role", header: "Role" },
  { key: "last", header: "Last active" },
];

<DataTable rows={rows} headers={headers}>
  {({ rows, headers, getHeaderProps, getRowProps }) => (
    <Table>
      <TableHead>
        <TableRow>
          {headers.map((h) => <TableHeader {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow {...getRowProps({ row })}>
            {row.cells.map((c) => <TableCell key={c.id}>{c.value}</TableCell>)}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )}
</DataTable>`,
    html: `<table class="cb-table">
  <thead><tr><th>Name</th><th>Status</th><th>Role</th><th>Last active</th></tr></thead>
  <tbody>
    <tr><td>Jane Doe</td><td><span class="cb-tag cb-tag-green">Active</span></td><td>Admin</td><td>2 hrs ago</td></tr>
  </tbody>
</table>`,
  },

  dialog: {
    react: `import { Modal } from "@carbon/react";

<Modal
  open={open}
  onRequestClose={() => setOpen(false)}
  modalHeading="Delete this project?"
  primaryButtonText="Delete"
  secondaryButtonText="Cancel"
  danger
>
  <p>This action is permanent. All associated deployments and logs will be removed.</p>
</Modal>`,
    html: `<div class="cb-modal">
  <div class="cb-modal-head">Delete this project?</div>
  <div class="cb-modal-body">This action is permanent.</div>
  <div class="cb-modal-actions">
    <button class="cb-btn cb-btn-ghost">Cancel</button>
    <button class="cb-btn cb-btn-danger">Delete</button>
  </div>
</div>`,
  },

  tooltips: {
    react: `import { Tooltip } from "@carbon/react";

<Tooltip label="Carbon tooltip">
  <Button kind="ghost">Hover me</Button>
</Tooltip>`,
    html: `<div class="cb-tooltip">
  <button class="cb-btn cb-btn-ghost">Hover me</button>
  <span class="cb-tooltip-bubble">Carbon tooltip</span>
</div>`,
  },

  avatars: {
    react: `// Carbon doesn't ship a first-party Avatar component - compose from
// primitives (div with background + initials). Use @carbon/colors for
// tinting by user.
<div
  className="cb-avatar"
  style={{ background: "var(--cds-interactive)" }}
  aria-label="Jane Doe"
>
  JD
</div>`,
    html: `<div class="cb-avatar" aria-label="Jane Doe">JD</div>`,
  },

  link: {
    react: `import { Link } from "@carbon/react";

<Link href="https://carbondesignsystem.com">
  Carbon Design System
</Link>

<Link href="/docs" inline>
  Read the docs
</Link>`,
    html: `<a class="cb-link" href="/">Read the docs</a>`,
  },

  slider: {
    react: `import { Slider } from "@carbon/react";

<Slider
  labelText="Volume"
  value={40}
  min={0}
  max={100}
  step={1}
/>`,
    html: `<div class="cb-slider">
  <label>Volume</label>
  <div class="cb-slider-track">
    <div class="cb-slider-fill" style="width: 40%;"></div>
    <span class="cb-slider-thumb" style="left: 40%;"></span>
  </div>
</div>`,
  },

  dropdowns: {
    react: `import { Dropdown } from "@carbon/react";

<Dropdown
  id="region"
  titleText="Choose a region"
  items={["North America", "EMEA", "APAC", "LATAM"]}
  label="North America"
/>`,
    html: `<div class="cb-dropdown">
  <label class="cb-input-label">Choose a region</label>
  <div class="cb-dropdown-trigger">
    <span>North America</span>
    <svg aria-hidden="true">...</svg>
  </div>
</div>`,
  },

  "dl-shape": {
    react: `// Carbon corners are flat (0px) across controls. Only pills + avatars round.
// Shape tokens:
//   $border-radius-0  = 0px   - buttons, inputs, tiles (default)
//   $border-radius-1  = 4px   - reserved
//   $border-radius-pill = 16px - tags, notifications badges
// Compose with border-radius: 50% for avatars.
<div style={{ borderRadius: "var(--cds-border-radius)" }}>Sharp corner</div>
<Tag>Pill (16px)</Tag>
<Avatar style={{ borderRadius: "50%" }} />`,
    html: `<style>
  .sharp   { border-radius: 0; }
  .pill    { border-radius: 16px; }
  .circle  { border-radius: 50%; }
</style>`,
  },

  "structured-list": {
    react: `import { StructuredListWrapper, StructuredListHead, StructuredListRow,
  StructuredListCell, StructuredListBody } from "@carbon/react";

<StructuredListWrapper>
  <StructuredListHead>
    <StructuredListRow head>
      <StructuredListCell head>Release</StructuredListCell>
      <StructuredListCell head>Notes</StructuredListCell>
    </StructuredListRow>
  </StructuredListHead>
  <StructuredListBody>
    <StructuredListRow>
      <StructuredListCell>v2.4</StructuredListCell>
      <StructuredListCell>Popover + AI.</StructuredListCell>
    </StructuredListRow>
  </StructuredListBody>
</StructuredListWrapper>`,
    html: `<table class="cb-table">
  <thead><tr><th>Release</th><th>Notes</th></tr></thead>
  <tbody><tr><td>v2.4</td><td>Popover + AI.</td></tr></tbody>
</table>`,
  },

  pagination: {
    react: `import { Pagination } from "@carbon/react";

<Pagination
  pageSize={10}
  pageSizes={[10, 20, 30, 40, 50]}
  totalItems={247}
  onChange={({ page, pageSize }) => console.log(page, pageSize)}
/>`,
    html: `<div class="cb-pagination">
  <span>Items per page: 10</span>
  <span>1 – 10 of 247</span>
  <div><button aria-label="Prev">‹</button> <span>1 / 25</span> <button aria-label="Next">›</button></div>
</div>`,
  },

  "content-switcher": {
    react: `import { ContentSwitcher, Switch } from "@carbon/react";

<ContentSwitcher onChange={(e) => console.log(e.name)}>
  <Switch name="all" text="All" />
  <Switch name="active" text="Active" />
  <Switch name="archived" text="Archived" />
</ContentSwitcher>`,
    html: `<div class="cb-switcher">
  <button class="cb-switcher-btn active">All</button>
  <button class="cb-switcher-btn">Active</button>
  <button class="cb-switcher-btn">Archived</button>
</div>`,
  },

  skeleton: {
    react: `import { SkeletonText, SkeletonPlaceholder, ButtonSkeleton } from "@carbon/react";

<SkeletonText heading />
<SkeletonText width="60%" />
<SkeletonText width="80%" />
<ButtonSkeleton size="lg" />`,
    html: `<div class="cb-skeleton" style="height: 24px; width: 60%"></div>
<div class="cb-skeleton" style="height: 16px; width: 90%"></div>
<div class="cb-skeleton" style="height: 32px; width: 100px"></div>`,
  },

  popover: {
    react: `import { Popover, PopoverContent } from "@carbon/react";
import { useState } from "react";

const [open, setOpen] = useState(false);

<Popover open={open} align="bottom">
  <button onClick={() => setOpen(!open)}>Anchor</button>
  <PopoverContent className="p-4">
    <p>Popover title</p>
    <p>Context-rich content.</p>
  </PopoverContent>
</Popover>`,
    html: `<div class="cb-popover" role="tooltip">
  <strong>Popover title</strong>
  <p>Context-rich content anchored to a trigger.</p>
</div>`,
  },

  /* ── Patterns ── */
  "pat-dashboard": {
    react: `import { Grid, Column, Tile, DataTable } from "@carbon/react";

function AnalyticsDashboard() {
  return (
    <Grid>
      <Column sm={4} md={2} lg={4}>
        <Tile><h4>Active users</h4><span>12,847</span></Tile>
      </Column>
      <Column sm={4} md={2} lg={4}>
        <Tile><h4>MRR</h4><span>$48,200</span></Tile>
      </Column>
      <Column sm={4} md={2} lg={4}>
        <Tile><h4>Churn</h4><span>2.1%</span></Tile>
      </Column>
      <Column sm={4} md={8} lg={12}>
        <DataTable rows={rows} headers={headers} />
      </Column>
    </Grid>
  );
}`,
    html: `<div class="cb-grid">
  <article class="cb-tile"><small>Active users</small><h1>12,847</h1></article>
  <article class="cb-tile"><small>MRR</small><h1>$48,200</h1></article>
  <article class="cb-tile"><small>Churn</small><h1>2.1%</h1></article>
  <table class="cb-table">...</table>
</div>`,
  },

  "pat-form": {
    react: `import { Form, Stack, TextInput, TextArea, Button } from "@carbon/react";

<Form>
  <Stack gap={5}>
    <TextInput id="name" labelText="Full name" />
    <TextInput id="email" labelText="Work email" />
    <TextArea id="bio" labelText="Bio" rows={4} />
    <div>
      <Button kind="ghost">Cancel</Button>
      <Button kind="primary">Save changes</Button>
    </div>
  </Stack>
</Form>`,
    html: `<form class="cb-form">
  <label class="cb-input-wrap"><span>Full name</span><input class="cb-input" /></label>
  <label class="cb-input-wrap"><span>Work email</span><input class="cb-input" /></label>
  <div class="cb-form-actions">
    <button class="cb-btn cb-btn-ghost">Cancel</button>
    <button class="cb-btn cb-btn-primary">Save changes</button>
  </div>
</form>`,
  },

  "pat-login": {
    react: `import { Form, Stack, TextInput, PasswordInput, Button, Link } from "@carbon/react";
import { ArrowRight } from "@carbon/icons-react";

function Login() {
  return (
    <div style={{ maxWidth: 360 }}>
      <h1>Log in</h1>
      <p>Enter your IBMid to continue.</p>
      <Form>
        <Stack gap={5}>
          <TextInput id="ibmid" labelText="IBMid" placeholder="name@example.com" />
          <PasswordInput id="pwd" labelText="Password" />
          <Button kind="primary" renderIcon={ArrowRight}>Continue</Button>
          <Link href="/forgot">Forgot your IBMid?</Link>
        </Stack>
      </Form>
    </div>
  );
}`,
    html: `<form class="cb-login">
  <h1>Log in</h1>
  <p>Enter your IBMid to continue.</p>
  <label class="cb-input-wrap"><span>IBMid</span><input class="cb-input" /></label>
  <label class="cb-input-wrap"><span>Password</span><input class="cb-input" type="password" /></label>
  <button class="cb-btn cb-btn-primary">Continue →</button>
  <a class="cb-link">Forgot your IBMid?</a>
</form>`,
  },

  "pat-list-detail": {
    react: `// List + detail: selection on the left, details on the right.
import { SideNav, SideNavItems, SideNavLink } from "@carbon/react";

<div className="list-detail">
  <SideNav aria-label="Projects" expanded>
    <SideNavItems>
      <SideNavLink isActive>Project Apollo</SideNavLink>
      <SideNavLink>Project Zeus</SideNavLink>
      <SideNavLink>Project Hermes</SideNavLink>
    </SideNavItems>
  </SideNav>
  <main style={{ padding: 24 }}>
    <h2>Project Apollo</h2>
    <p>Last updated 3 hours ago.</p>
  </main>
</div>`,
    html: `<div class="list-detail" style="display:flex;">
  <aside>
    <a class="cb-sidenav-item active">Project Apollo</a>
    <a class="cb-sidenav-item">Project Zeus</a>
    <a class="cb-sidenav-item">Project Hermes</a>
  </aside>
  <main>Detail pane…</main>
</div>`,
  },

  "pat-search": {
    react: `import { Search, Tag, StructuredListWrapper } from "@carbon/react";

<Search labelText="Search" placeholder="Find components" />

<div style={{ display: "flex", gap: 8, marginTop: 12 }}>
  <Tag type="blue" filter>Category: Foundations</Tag>
  <Tag type="gray" filter>Type: Component</Tag>
</div>

<StructuredListWrapper>{/* results */}</StructuredListWrapper>`,
    html: `<div class="cb-search-wrap">
  <span class="cb-search-icon">🔍</span>
  <input class="cb-input" placeholder="Find components" />
</div>
<div class="filter-row">
  <span class="cb-tag cb-tag-blue">Category: Foundations ×</span>
  <span class="cb-tag cb-tag-gray">Type: Component ×</span>
</div>`,
  },

  "pat-app-shell": {
    react: `import { Header, HeaderName, SideNav, SideNavItems, SideNavLink,
  Content, SkipToContent } from "@carbon/react";
import { Home, Settings, DocumentBlank } from "@carbon/icons-react";

function Shell({ children }) {
  return (
    <>
      <Header aria-label="Carbon">
        <SkipToContent />
        <HeaderName href="/" prefix="IBM">Design Hub</HeaderName>
      </Header>
      <SideNav aria-label="Main" expanded>
        <SideNavItems>
          <SideNavLink renderIcon={Home} isActive>Home</SideNavLink>
          <SideNavLink renderIcon={DocumentBlank}>Docs</SideNavLink>
          <SideNavLink renderIcon={Settings}>Settings</SideNavLink>
        </SideNavItems>
      </SideNav>
      <Content>{children}</Content>
    </>
  );
}`,
    html: `<div class="cb-shell">
  <header class="cb-header">
    <span class="cb-header-name"><strong>IBM</strong> Design Hub</span>
  </header>
  <aside class="cb-sidenav">
    <a class="cb-nav-item is-active">Home</a>
    <a class="cb-nav-item">Docs</a>
    <a class="cb-nav-item">Settings</a>
  </aside>
  <main class="cb-content"><!-- ... --></main>
</div>`,
  },
};
