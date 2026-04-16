import type { CodeSnippets } from "../salt/types";

export const FLUENT_CODE: CodeSnippets = {
  buttons: {
    react: `import { Button } from "@fluentui/react-components";

// appearance: primary, secondary, outline, subtle, transparent
// size: small, medium (default), large
<Button appearance="primary">Primary</Button>
<Button appearance="secondary">Default</Button>
<Button appearance="outline">Outline</Button>
<Button appearance="subtle">Subtle</Button>`,
    html: `<button class="fui-Button fui-Button--primary">Primary</button>
<button class="fui-Button fui-Button--outline">Outline</button>`,
  },
  inputs: {
    react: `import { Input, Label, Field } from "@fluentui/react-components";

<Field label="Full name">
  <Input placeholder="Enter your name" />
</Field>

<Field label="Email" validationState="error" validationMessage="Required">
  <Input defaultValue="invalid" />
</Field>`,
    html: `<div class="fui-Field">
  <label class="fui-Label">Full name</label>
  <input class="fui-Input" placeholder="Enter your name" />
</div>`,
  },
  checkboxes: {
    react: `import { Checkbox } from "@fluentui/react-components";

<Checkbox label="Option A" defaultChecked />
<Checkbox label="Option B" />
<Checkbox label="Disabled" disabled />`,
    html: `<label class="fui-Checkbox">
  <input type="checkbox" checked />
  <span>Option A</span>
</label>`,
  },
  radios: {
    react: `import { Radio, RadioGroup } from "@fluentui/react-components";

<RadioGroup defaultValue="a">
  <Radio value="a" label="Option A" />
  <Radio value="b" label="Option B" />
  <Radio value="c" label="Option C" disabled />
</RadioGroup>`,
    html: `<div class="fui-RadioGroup" role="radiogroup">
  <label class="fui-Radio">
    <input type="radio" name="group" value="a" checked />
    Option A
  </label>
</div>`,
  },
  cards: {
    react: `import { Card, CardHeader, CardPreview } from "@fluentui/react-components";

<Card>
  <CardPreview>
    <img src="preview.png" alt="Preview" />
  </CardPreview>
  <CardHeader header="Card Title" description="Description text" />
</Card>`,
    html: `<div class="fui-Card">
  <div class="fui-CardHeader">Card Title</div>
</div>`,
  },
  switches: {
    react: `import { Switch } from "@fluentui/react-components";

<Switch label="Notifications" defaultChecked />
<Switch label="Dark mode" />
<Switch label="Locked" disabled />`,
    html: `<label class="fui-Switch">
  <input type="checkbox" role="switch" />
  <span>Notifications</span>
</label>`,
  },
  tabs: {
    react: `import { TabList, Tab } from "@fluentui/react-components";

<TabList>
  <Tab value="home">Home</Tab>
  <Tab value="activity">Activity</Tab>
  <Tab value="settings">Settings</Tab>
</TabList>`,
    html: `<div role="tablist" class="fui-TabList">
  <button role="tab" aria-selected="true">Home</button>
  <button role="tab">Activity</button>
</div>`,
  },
  slider: {
    react: `import { Slider } from "@fluentui/react-components";

<Slider defaultValue={50} min={0} max={100} />`,
    html: `<input type="range" class="fui-Slider" min="0" max="100" />`,
  },
  dropdown: {
    react: `import { Dropdown, Option } from "@fluentui/react-components";

<Dropdown placeholder="Select a role">
  <Option>Admin</Option>
  <Option>Editor</Option>
  <Option disabled>Viewer</Option>
</Dropdown>`,
    html: `<select class="fui-Dropdown">
  <option>Admin</option>
  <option>Editor</option>
</select>`,
  },
  dialog: {
    react: `import { Dialog, DialogTrigger, DialogSurface, DialogTitle,
  DialogBody, DialogActions } from "@fluentui/react-components";

<Dialog>
  <DialogTrigger>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogSurface>
    <DialogTitle>Confirm Action</DialogTitle>
    <DialogBody>Are you sure you want to proceed?</DialogBody>
    <DialogActions>
      <DialogTrigger><Button>Cancel</Button></DialogTrigger>
      <Button appearance="primary">Confirm</Button>
    </DialogActions>
  </DialogSurface>
</Dialog>`,
    html: `<dialog class="fui-Dialog" open>
  <h2>Confirm Action</h2>
  <p>Are you sure?</p>
</dialog>`,
  },
  menu: {
    react: `import { Menu, MenuTrigger, MenuPopover, MenuList,
  MenuItem } from "@fluentui/react-components";

<Menu>
  <MenuTrigger>
    <Button>Options</Button>
  </MenuTrigger>
  <MenuPopover>
    <MenuList>
      <MenuItem>Edit</MenuItem>
      <MenuItem>Duplicate</MenuItem>
      <MenuItem disabled>Delete</MenuItem>
    </MenuList>
  </MenuPopover>
</Menu>`,
    html: `<div class="fui-Menu" role="menu">
  <button class="fui-MenuItem" role="menuitem">Edit</button>
</div>`,
  },
  banners: {
    react: `import { MessageBar, MessageBarBody, MessageBarTitle,
  MessageBarActions } from "@fluentui/react-components";

// Intent: info, success, warning, error
<MessageBar intent="info">
  <MessageBarBody>
    <MessageBarTitle>Info</MessageBarTitle>
    A new version is available.
  </MessageBarBody>
  <MessageBarActions>
    <Button size="small">Update</Button>
  </MessageBarActions>
</MessageBar>`,
    html: `<div class="fui-MessageBar" role="alert">
  <p>A new version is available.</p>
</div>`,
  },
  badges: {
    react: `import { Badge, CounterBadge } from "@fluentui/react-components";

// Appearance: filled, ghost, outline, tint
// Color: brand, danger, important, informative, severe, subtle, success, warning
<Badge appearance="filled" color="brand" />
<CounterBadge count={5} appearance="filled" />
<Badge appearance="ghost" color="success" />`,
    html: `<span class="fui-Badge fui-Badge--brand">5</span>`,
  },
  avatars: {
    react: `import { Avatar, AvatarGroup } from "@fluentui/react-components";

<Avatar name="Jane Doe" image={{ src: "/avatar.jpg" }} />
<Avatar name="JS" size={48} />
<AvatarGroup>
  <Avatar name="User 1" />
  <Avatar name="User 2" />
</AvatarGroup>`,
    html: `<span class="fui-Avatar" aria-label="Jane Doe">JD</span>`,
  },
  tooltips: {
    react: `import { Tooltip } from "@fluentui/react-components";

<Tooltip content="More information" relationship="label">
  <Button>Hover me</Button>
</Tooltip>`,
    html: `<div class="fui-Tooltip" role="tooltip">More info</div>`,
  },
  progress: {
    react: `import { ProgressBar, Spinner } from "@fluentui/react-components";

<ProgressBar value={0.65} />
<Spinner size="medium" label="Loading..." />`,
    html: `<div class="fui-ProgressBar" role="progressbar">
  <div class="fui-ProgressBar__bar" style="width: 65%"></div>
</div>`,
  },
  accordion: {
    react: `import { Accordion, AccordionItem, AccordionHeader,
  AccordionPanel } from "@fluentui/react-components";

<Accordion>
  <AccordionItem value="1">
    <AccordionHeader>Section 1</AccordionHeader>
    <AccordionPanel>Content for section 1.</AccordionPanel>
  </AccordionItem>
  <AccordionItem value="2">
    <AccordionHeader>Section 2</AccordionHeader>
    <AccordionPanel>Content for section 2.</AccordionPanel>
  </AccordionItem>
</Accordion>`,
    html: `<div class="fui-Accordion">
  <button class="fui-AccordionHeader" aria-expanded="true">
    Section 1
  </button>
  <div class="fui-AccordionPanel">Content</div>
</div>`,
  },
  table: {
    react: `import { Table, TableHeader, TableRow, TableHeaderCell,
  TableBody, TableCell } from "@fluentui/react-components";

<Table>
  <TableHeader>
    <TableRow>
      <TableHeaderCell>Name</TableHeaderCell>
      <TableHeaderCell>Status</TableHeaderCell>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Jane Doe</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>`,
    html: `<table class="fui-Table">
  <thead><tr><th>Name</th><th>Status</th></tr></thead>
  <tbody><tr><td>Jane Doe</td><td>Active</td></tr></tbody>
</table>`,
  },
  drawer: {
    react: `import { Drawer, DrawerHeader, DrawerHeaderTitle,
  DrawerBody } from "@fluentui/react-components";

<Drawer open={open} onOpenChange={setOpen} position="start">
  <DrawerHeader>
    <DrawerHeaderTitle>Settings</DrawerHeaderTitle>
  </DrawerHeader>
  <DrawerBody>
    <p>Drawer content here.</p>
  </DrawerBody>
</Drawer>`,
    html: `<aside class="fui-Drawer" role="dialog">
  <h2>Settings</h2>
  <div class="fui-DrawerBody">Content</div>
</aside>`,
  },
  dividers: {
    react: `import { Divider } from "@fluentui/react-components";

<Divider />
<Divider appearance="brand" />
<Divider inset />`,
    html: `<hr class="fui-Divider" />`,
  },
  pagination: {
    react: `import { Button } from "@fluentui/react-components";

// Fluent 2 has no built-in Pagination — compose with Buttons
<div role="navigation" aria-label="Pagination">
  <Button appearance="subtle" icon={<ChevronLeftIcon />} />
  <Button appearance="primary">1</Button>
  <Button appearance="subtle">2</Button>
  <Button appearance="subtle">3</Button>
  <Button appearance="subtle" icon={<ChevronRightIcon />} />
</div>`,
    html: `<nav aria-label="Pagination">
  <button>&laquo;</button>
  <button aria-current="page">1</button>
  <button>&raquo;</button>
</nav>`,
  },
  spinner: {
    react: `import { Spinner } from "@fluentui/react-components";

<Spinner size="tiny" />
<Spinner size="medium" label="Loading..." />
<Spinner size="large" />`,
    html: `<div class="fui-Spinner" role="status">
  <span>Loading...</span>
</div>`,
  },
  toast: {
    react: `import { Toaster, useToastController, Toast, ToastTitle,
  ToastBody } from "@fluentui/react-components";

const { dispatchToast } = useToastController();
dispatchToast(
  <Toast>
    <ToastTitle>Success</ToastTitle>
    <ToastBody>Changes saved successfully.</ToastBody>
  </Toast>,
  { intent: "success" }
);`,
    html: `<div class="fui-Toast" role="alert">
  <strong>Success</strong>
  <p>Changes saved.</p>
</div>`,
  },
  stepper: {
    react: `import { Button } from "@fluentui/react-components";

// Fluent 2 has no built-in Stepper — compose with tokens
<div role="list" aria-label="Progress">
  <div role="listitem" aria-current="step">
    <span>1. Account</span>
  </div>
  <div role="listitem">
    <span>2. Profile</span>
  </div>
</div>`,
    html: `<div role="list" aria-label="Progress">
  <div role="listitem">1. Account</div>
  <div role="listitem" aria-current="step">2. Profile</div>
</div>`,
  },
  charts: {
    react: `import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

// Fluent 2 themed chart — uses Fluent color tokens
const theme = {
  colors: [
    "var(--colorBrandBackground)",
    "var(--colorPaletteGreenBackground3)",
    "var(--colorPaletteYellowForeground2)",
    "var(--colorPaletteRedBackground3)",
  ],
  chart: { backgroundColor: "transparent" },
  title: { style: { color: "var(--colorNeutralForeground1)" } },
  xAxis: { lineColor: "var(--colorNeutralStroke2)" },
  yAxis: { gridLineColor: "var(--colorNeutralStroke2)" },
  tooltip: { backgroundColor: "var(--colorNeutralBackground1)" },
};

<HighchartsReact
  highcharts={Highcharts}
  options={{
    ...theme,
    chart: { ...theme.chart, type: "area" },
    title: { text: "User Growth" },
    series: [
      { name: "Free", data: [5000, 8200, 12400, 18000] },
      { name: "Pro", data: [1200, 2400, 4100, 6800] },
    ],
  }}
/>`,
    html: `<script src="https://code.highcharts.com/highcharts.js"></script>
<div id="chart-container"></div>

<script>
Highcharts.chart('chart-container', {
  chart: { type: 'area', backgroundColor: 'transparent' },
  title: { text: 'User Growth' },
  series: [
    { name: 'Free', data: [5000, 8200, 12400, 18000] },
    { name: 'Pro', data: [1200, 2400, 4100, 6800] }
  ],
  colors: ['#0F6CBD', '#107C10', '#C19C00', '#D13438'],
  credits: { enabled: false }
});
</script>`,
  },
  "ag-grid": {
    react: `import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

// Fluent 2 themed AG Grid
const fluentTheme = themeQuartz.withParams({
  accentColor: "var(--colorBrandBackground)",
  backgroundColor: "var(--colorNeutralBackground1)",
  foregroundColor: "var(--colorNeutralForeground1)",
  headerBackgroundColor: "var(--colorNeutralBackground2)",
  headerTextColor: "var(--colorNeutralForeground2)",
  borderColor: "var(--colorNeutralStroke2)",
  fontFamily: "'Segoe UI', sans-serif",
  fontSize: 13,
  spacing: 6,
  borderRadius: 4,
});

<div style={{ height: 400 }}>
  <AgGridReact
    theme={fluentTheme}
    rowData={data}
    columnDefs={columnDefs}
    rowSelection="multiple"
    pagination
  />
</div>`,
    html: `<script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script>
<div id="grid" style="height: 400px"></div>

<script>
const grid = agGrid.createGrid(document.getElementById('grid'), {
  theme: agGrid.themeQuartz.withParams({
    accentColor: '#0F6CBD',
    backgroundColor: '#FFFFFF',
    foregroundColor: '#242424',
    borderColor: '#E0E0E0',
    borderRadius: 4
  }),
  rowData: [...],
  columnDefs: [...]
});
</script>`,
  },
  dialogs: {
    react: `import { Dialog, DialogSurface, DialogTitle,
  DialogBody, DialogActions, DialogTrigger,
  Button } from "@fluentui/react-components";

<Dialog>
  <DialogTrigger disableButtonEnhancement>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogSurface>
    <DialogTitle>Confirm Action</DialogTitle>
    <DialogBody>Are you sure you want to proceed?</DialogBody>
    <DialogActions>
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="secondary">Cancel</Button>
      </DialogTrigger>
      <Button appearance="primary">Confirm</Button>
    </DialogActions>
  </DialogSurface>
</Dialog>`,
    html: `<dialog class="fui-DialogSurface" open>
  <h2 class="fui-DialogTitle">Confirm Action</h2>
  <div class="fui-DialogBody">Are you sure?</div>
  <div class="fui-DialogActions">
    <button class="fui-Button">Cancel</button>
    <button class="fui-Button fui-Button--primary">Confirm</button>
  </div>
</dialog>`,
  },
  links: {
    react: `import { Link } from "@fluentui/react-components";

<Link href="/dashboard">Dashboard</Link>
<Link href="/settings" appearance="subtle">Settings</Link>
<Link href="https://example.com" target="_blank" inline>
  External Link
</Link>`,
    html: `<a class="fui-Link" href="/dashboard">Dashboard</a>`,
  },
  menus: {
    react: `import { Menu, MenuTrigger, MenuPopover,
  MenuList, MenuItem, MenuDivider,
  Button } from "@fluentui/react-components";

<Menu>
  <MenuTrigger disableButtonEnhancement>
    <Button>Options</Button>
  </MenuTrigger>
  <MenuPopover>
    <MenuList>
      <MenuItem>Edit</MenuItem>
      <MenuItem>Duplicate</MenuItem>
      <MenuDivider />
      <MenuItem>Delete</MenuItem>
    </MenuList>
  </MenuPopover>
</Menu>`,
    html: `<div class="fui-MenuPopover" role="menu">
  <div class="fui-MenuItem" role="menuitem">Edit</div>
  <div class="fui-MenuItem" role="menuitem">Duplicate</div>
  <hr class="fui-MenuDivider" />
  <div class="fui-MenuItem" role="menuitem">Delete</div>
</div>`,
  },
  messagebars: {
    react: `import { MessageBar, MessageBarTitle,
  MessageBarBody, MessageBarActions,
  Button } from "@fluentui/react-components";

// Intents: info, success, warning, error
<MessageBar intent="success">
  <MessageBarBody>
    <MessageBarTitle>Success</MessageBarTitle>
    Your changes have been saved.
  </MessageBarBody>
  <MessageBarActions>
    <Button appearance="transparent" size="small">Undo</Button>
  </MessageBarActions>
</MessageBar>`,
    html: `<div class="fui-MessageBar" role="alert">
  <div class="fui-MessageBarBody">
    <strong>Success</strong> Changes saved.
  </div>
</div>`,
  },
  "dl-tokens": {
    react: `import { FluentProvider, webLightTheme,
  webDarkTheme } from "@fluentui/react-components";

// Fluent 2 tokens are CSS custom properties injected by FluentProvider
// Colors: --colorBrandBackground, --colorNeutralForeground1, etc.
// Typography: --fontFamilyBase, --fontSizeBase300, --fontWeightSemibold
// Spacing: --spacingHorizontalM, --spacingVerticalL
// Border radius: --borderRadiusMedium, --borderRadiusLarge

<FluentProvider theme={webLightTheme}>
  <App />
</FluentProvider>`,
    html: `<!-- Fluent 2 token architecture — CSS custom properties -->
<style>
  :root {
    --colorBrandBackground: #0F6CBD;
    --colorNeutralForeground1: #242424;
    --colorNeutralBackground1: #FFFFFF;
    --fontFamilyBase: 'Segoe UI', sans-serif;
    --fontSizeBase300: 14px;
    --spacingHorizontalM: 12px;
    --spacingVerticalL: 16px;
    --borderRadiusMedium: 4px;
  }
</style>`,
  },
  calendar: {
    react: `import { Calendar } from "@fluentui/react-calendar-compat";

<Calendar
  showMonthPickerAsOverlay
  onSelectDate={(date) => console.log(date)}
/>`,
    html: `<div class="f-Calendar" role="grid" aria-label="Calendar">
  <table>
    <thead><tr><th>Su</th><th>Mo</th><th>Tu</th><th>We</th><th>Th</th><th>Fr</th><th>Sa</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td></tr>
    </tbody>
  </table>
</div>`,
  },
  carousel: {
    react: `import { Carousel, CarouselCard, CarouselNav,
  CarouselNavButton } from "@fluentui/react-components";

<Carousel>
  <CarouselCard>
    <img src="slide-1.png" alt="Slide 1" />
  </CarouselCard>
  <CarouselCard>
    <img src="slide-2.png" alt="Slide 2" />
  </CarouselCard>
  <CarouselNav>
    {() => <CarouselNavButton />}
  </CarouselNav>
</Carousel>`,
    html: `<div class="f-Carousel" role="region" aria-roledescription="carousel">
  <div class="f-CarouselCard" role="group" aria-label="Slide 1">
    <img src="slide-1.png" alt="Slide 1" />
  </div>
  <nav class="f-CarouselNav">
    <button aria-label="Previous">&lsaquo;</button>
    <button aria-label="Next">&rsaquo;</button>
  </nav>
</div>`,
  },
  collapsible: {
    react: `import { useState } from "react";
import { Button } from "@fluentui/react-components";

const [open, setOpen] = useState(false);

<div>
  <Button onClick={() => setOpen(!open)}>
    {open ? "Hide" : "Show"} Content
  </Button>
  {open && (
    <div className="f-Collapsible__body">
      Collapsible content goes here.
    </div>
  )}
</div>`,
    html: `<div class="f-Collapsible">
  <button class="f-Collapsible__trigger" aria-expanded="false">
    Show Content
  </button>
  <div class="f-Collapsible__body" hidden>
    Collapsible content goes here.
  </div>
</div>`,
  },
  "combo-box": {
    react: `import { Combobox, Option } from "@fluentui/react-components";

<Combobox placeholder="Search or select...">
  <Option>Red</Option>
  <Option>Green</Option>
  <Option>Blue</Option>
</Combobox>`,
    html: `<div class="fui-Combobox" role="combobox" aria-expanded="false">
  <input class="fui-Combobox__input" placeholder="Search or select..." />
  <ul class="fui-Listbox" role="listbox">
    <li role="option">Red</li>
    <li role="option">Green</li>
  </ul>
</div>`,
  },
  "data-grid": {
    react: `import { DataGrid, DataGridHeader, DataGridRow,
  DataGridHeaderCell, DataGridBody,
  DataGridCell } from "@fluentui/react-components";

const columns = [
  { columnId: "name", renderHeaderCell: () => "Name" },
  { columnId: "status", renderHeaderCell: () => "Status" },
];

<DataGrid items={items} columns={columns} sortable>
  <DataGridHeader>
    <DataGridRow>
      {({ renderHeaderCell }) => (
        <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
      )}
    </DataGridRow>
  </DataGridHeader>
  <DataGridBody>
    {({ item }) => (
      <DataGridRow>
        <DataGridCell>{item.name}</DataGridCell>
        <DataGridCell>{item.status}</DataGridCell>
      </DataGridRow>
    )}
  </DataGridBody>
</DataGrid>`,
    html: `<table class="fui-DataGrid" role="grid">
  <thead>
    <tr><th role="columnheader" aria-sort="ascending">Name</th><th>Status</th></tr>
  </thead>
  <tbody>
    <tr><td>Jane Doe</td><td>Active</td></tr>
  </tbody>
</table>`,
  },
  "date-picker": {
    react: `import { DatePicker } from "@fluentui/react-datepicker-compat";
import { Field } from "@fluentui/react-components";

<Field label="Start date">
  <DatePicker
    placeholder="Select a date..."
    onSelectDate={(date) => console.log(date)}
  />
</Field>`,
    html: `<div class="f-DatePicker">
  <label class="fui-Label">Start date</label>
  <input class="fui-Input" placeholder="Select a date..." />
  <div class="f-DatePicker__calendar" role="dialog" hidden>
    <!-- Calendar grid rendered here -->
  </div>
</div>`,
  },
  "file-drop": {
    react: `import { makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  dropZone: {
    border: \`2px dashed \${tokens.colorNeutralStroke1}\`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalXXL,
    textAlign: "center",
    "&:hover": { borderColor: tokens.colorBrandStroke1 },
  },
});

<div
  className={styles.dropZone}
  onDragOver={(e) => e.preventDefault()}
  onDrop={handleDrop}
>
  Drag & drop files here
</div>`,
    html: `<div class="f-FileDropZone" role="button" tabindex="0">
  <p>Drag &amp; drop files here</p>
  <input type="file" hidden />
</div>`,
  },
  "form-field": {
    react: `import { Field, Input } from "@fluentui/react-components";

// validationState: success, warning, error
<Field
  label="Email"
  validationState="error"
  validationMessage="Please enter a valid email."
  hint="We'll never share your email."
>
  <Input type="email" />
</Field>`,
    html: `<div class="fui-Field">
  <label class="fui-Label">Email</label>
  <input class="fui-Input" type="email" aria-invalid="true" />
  <span class="fui-Field__validationMessage">Please enter a valid email.</span>
</div>`,
  },
  "interactable-card": {
    react: `import { Card, CardHeader } from "@fluentui/react-components";

// Selectable card with interactive prop
<Card
  appearance="filled-alternative"
  selected={isSelected}
  onSelectionChange={handleSelect}
>
  <CardHeader
    header="Selectable Card"
    description="Click to select this card."
  />
</Card>`,
    html: `<div class="fui-Card fui-Card--selectable" tabindex="0"
  role="option" aria-selected="false">
  <div class="fui-CardHeader">Selectable Card</div>
</div>`,
  },
  "list-box": {
    react: `import { Listbox, Option } from "@fluentui/react-components";

<Listbox aria-label="Choose a color" multiselect>
  <Option>Red</Option>
  <Option>Green</Option>
  <Option>Blue</Option>
</Listbox>`,
    html: `<ul class="fui-Listbox" role="listbox" aria-label="Choose a color"
  aria-multiselectable="true">
  <li class="fui-Option" role="option">Red</li>
  <li class="fui-Option" role="option">Green</li>
  <li class="fui-Option" role="option">Blue</li>
</ul>`,
  },
  "multiline-input": {
    react: `import { Textarea, Field } from "@fluentui/react-components";

<Field label="Description">
  <Textarea
    placeholder="Enter details..."
    appearance="outline"
    resize="vertical"
  />
</Field>`,
    html: `<div class="fui-Field">
  <label class="fui-Label">Description</label>
  <textarea class="fui-Textarea" placeholder="Enter details..."
    rows="4"></textarea>
</div>`,
  },
  "nav-item": {
    react: `import { NavCategory, NavCategoryItem, NavItem,
  NavSub } from "@fluentui/react-nav-preview";

<NavItem href="/home" value="home" icon={<HomeIcon />}>
  Home
</NavItem>
<NavCategory value="settings">
  <NavCategoryItem icon={<SettingsIcon />}>Settings</NavCategoryItem>
  <NavSub>
    <NavItem href="/settings/general" value="general">General</NavItem>
    <NavItem href="/settings/account" value="account">Account</NavItem>
  </NavSub>
</NavCategory>`,
    html: `<nav class="f-Nav" role="navigation">
  <a class="f-NavItem f-NavItem--active" href="/home">Home</a>
  <a class="f-NavItem" href="/settings">Settings</a>
</nav>`,
  },
  "number-input": {
    react: `import { SpinButton, Field } from "@fluentui/react-components";

<Field label="Quantity">
  <SpinButton defaultValue={1} min={0} max={100} step={1} />
</Field>`,
    html: `<div class="fui-Field">
  <label class="fui-Label">Quantity</label>
  <div class="fui-SpinButton">
    <input type="number" value="1" min="0" max="100" />
    <button aria-label="Increment">+</button>
    <button aria-label="Decrement">-</button>
  </div>
</div>`,
  },
  overlay: {
    react: `import { Dialog, DialogSurface } from "@fluentui/react-components";
import { makeStyles, tokens } from "@fluentui/react-components";

// Fluent 2 uses Dialog's built-in backdrop as overlay
<Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
  <DialogSurface>
    {/* Content behind the overlay scrim */}
  </DialogSurface>
</Dialog>`,
    html: `<div class="f-Overlay" role="presentation"
  style="position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:1000">
</div>`,
  },
  panel: {
    react: `import { Card, CardHeader, makeStyles,
  tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  panel: {
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
});

<div className={styles.panel}>
  <h3>Panel Title</h3>
  <p>Panel content goes here.</p>
</div>`,
    html: `<section class="f-Panel">
  <header class="f-Panel__header"><h3>Panel Title</h3></header>
  <div class="f-Panel__body">Panel content goes here.</div>
</section>`,
  },
  pills: {
    react: `import { InteractionTag, InteractionTagPrimary,
  TagGroup } from "@fluentui/react-components";

<TagGroup onDismiss={handleDismiss}>
  <InteractionTag>
    <InteractionTagPrimary hasSecondaryAction>
      React
    </InteractionTagPrimary>
  </InteractionTag>
  <InteractionTag>
    <InteractionTagPrimary hasSecondaryAction>
      TypeScript
    </InteractionTagPrimary>
  </InteractionTag>
</TagGroup>`,
    html: `<div class="fui-TagGroup" role="listbox">
  <span class="fui-Tag" role="option">React
    <button aria-label="Remove">&times;</button>
  </span>
  <span class="fui-Tag" role="option">TypeScript
    <button aria-label="Remove">&times;</button>
  </span>
</div>`,
  },
  "segmented-btn": {
    react: `import { ToggleButton, Toolbar } from "@fluentui/react-components";

// Compose ToggleButton group for segmented control
<Toolbar aria-label="View mode">
  <ToggleButton appearance="primary" checked={view === "grid"}
    onClick={() => setView("grid")}>Grid</ToggleButton>
  <ToggleButton appearance="primary" checked={view === "list"}
    onClick={() => setView("list")}>List</ToggleButton>
  <ToggleButton appearance="primary" checked={view === "table"}
    onClick={() => setView("table")}>Table</ToggleButton>
</Toolbar>`,
    html: `<div class="f-SegmentedButton" role="group" aria-label="View mode">
  <button class="fui-ToggleButton fui-ToggleButton--checked">Grid</button>
  <button class="fui-ToggleButton">List</button>
  <button class="fui-ToggleButton">Table</button>
</div>`,
  },
  "skip-link": {
    react: `import { Link, makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  skipLink: {
    position: "absolute",
    left: "-10000px",
    "&:focus": {
      left: tokens.spacingHorizontalM,
      top: tokens.spacingVerticalM,
      zIndex: 1000,
    },
  },
});

<Link className={styles.skipLink} href="#main-content">
  Skip to main content
</Link>`,
    html: `<a class="f-SkipLink" href="#main-content">
  Skip to main content
</a>
<style>
  .f-SkipLink { position: absolute; left: -10000px; }
  .f-SkipLink:focus { left: 12px; top: 12px; z-index: 1000; }
</style>`,
  },
  splitter: {
    react: `import { makeStyles, tokens } from "@fluentui/react-components";

// Fluent 2 has no built-in Splitter — compose with tokens
const useStyles = makeStyles({
  container: { display: "flex", height: "100%" },
  pane: { overflow: "auto" },
  handle: {
    width: "4px",
    cursor: "col-resize",
    backgroundColor: tokens.colorNeutralStroke2,
    "&:hover": { backgroundColor: tokens.colorBrandStroke1 },
  },
});

<div className={styles.container}>
  <div className={styles.pane} style={{ width: leftWidth }}>Left</div>
  <div className={styles.handle} onMouseDown={startResize} />
  <div className={styles.pane} style={{ flex: 1 }}>Right</div>
</div>`,
    html: `<div class="f-Splitter" style="display:flex;height:100%">
  <div class="f-Splitter__pane" style="width:300px">Left</div>
  <div class="f-Splitter__handle" role="separator"
    aria-valuenow="300" tabindex="0"></div>
  <div class="f-Splitter__pane" style="flex:1">Right</div>
</div>`,
  },
  "static-list": {
    react: `import { makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  list: { listStyle: "none", padding: 0, margin: 0 },
  item: {
    padding: \`\${tokens.spacingVerticalS} \${tokens.spacingHorizontalM}\`,
    borderBottom: \`1px solid \${tokens.colorNeutralStroke2}\`,
  },
});

<ul className={styles.list}>
  <li className={styles.item}>Item One</li>
  <li className={styles.item}>Item Two</li>
  <li className={styles.item}>Item Three</li>
</ul>`,
    html: `<ul class="f-StaticList" role="list">
  <li class="f-StaticList__item">Item One</li>
  <li class="f-StaticList__item">Item Two</li>
  <li class="f-StaticList__item">Item Three</li>
</ul>`,
  },
  tag: {
    react: `import { Tag, TagGroup } from "@fluentui/react-components";

// appearance: filled, outline, brand
<TagGroup onDismiss={handleDismiss}>
  <Tag appearance="filled" dismissible>Design</Tag>
  <Tag appearance="outline" dismissible>Engineering</Tag>
  <Tag appearance="brand" dismissible>Product</Tag>
</TagGroup>`,
    html: `<div class="fui-TagGroup">
  <span class="fui-Tag fui-Tag--filled">Design
    <button class="fui-Tag__dismiss" aria-label="Remove">&times;</button>
  </span>
  <span class="fui-Tag fui-Tag--outline">Engineering
    <button class="fui-Tag__dismiss" aria-label="Remove">&times;</button>
  </span>
</div>`,
  },
  "toggle-btn": {
    react: `import { ToggleButton } from "@fluentui/react-components";

<ToggleButton appearance="primary">Bold</ToggleButton>
<ToggleButton appearance="subtle" icon={<StarIcon />}>
  Favorite
</ToggleButton>
<ToggleButton appearance="outline" disabled>
  Disabled
</ToggleButton>`,
    html: `<button class="fui-ToggleButton" aria-pressed="false">Bold</button>
<button class="fui-ToggleButton fui-ToggleButton--checked"
  aria-pressed="true">Favorite</button>`,
  },
  "vert-nav": {
    react: `import { Nav, NavItem } from "@fluentui/react-nav-preview";
import { HomeIcon, SettingsIcon, PersonIcon } from "@fluentui/react-icons";

<Nav aria-label="Main navigation">
  <NavItem href="/home" value="home" icon={<HomeIcon />}>
    Home
  </NavItem>
  <NavItem href="/profile" value="profile" icon={<PersonIcon />}>
    Profile
  </NavItem>
  <NavItem href="/settings" value="settings" icon={<SettingsIcon />}>
    Settings
  </NavItem>
</Nav>`,
    html: `<nav class="f-VertNav" role="navigation" aria-label="Main navigation">
  <a class="f-VertNav__item f-VertNav__item--active" href="/home">Home</a>
  <a class="f-VertNav__item" href="/profile">Profile</a>
  <a class="f-VertNav__item" href="/settings">Settings</a>
</nav>`,
  },
};
