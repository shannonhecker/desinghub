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

// Fluent 2 has no built-in Pagination - compose with Buttons
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

// Fluent 2 has no built-in Stepper - compose with tokens
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

// Fluent 2 themed chart - uses Fluent color tokens
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
    html: `<!-- Fluent 2 token architecture - CSS custom properties -->
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

// Fluent 2 has no built-in Splitter - compose with tokens
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
  "dl-color": {
    react: `// Fluent 2 color tokens - tokens from @fluentui/tokens
import { tokens } from "@fluentui/react-components";

<div style={{
  background: tokens.colorNeutralBackground1,
  color: tokens.colorNeutralForeground1,
  border: \`1px solid \${tokens.colorNeutralStroke1}\`,
}}>
  Fluent themed card
</div>

// Brand colours: tokens.colorBrandBackground, colorBrandForeground1`,
    html: `<style>
  .f-card {
    background: var(--colorNeutralBackground1);
    color: var(--colorNeutralForeground1);
    border: 1px solid var(--colorNeutralStroke1);
  }
</style>`,
  },
  "dl-typography": {
    react: `// Fluent 2 type scale - Segoe UI Variable
import { Title1, Title2, Title3, Subtitle1, Body1, Caption1 } from "@fluentui/react-components";

<Title1>68px / 92 line-height</Title1>
<Title2>40px</Title2>
<Title3>28px</Title3>
<Subtitle1>20px</Subtitle1>
<Body1>14px body copy</Body1>
<Caption1>12px caption</Caption1>`,
    html: `<h1 style="font: var(--fontWeightSemibold) var(--fontSizeHero1000)/var(--lineHeightHero1000) var(--fontFamilyBase);">Title1</h1>`,
  },
  "dl-spacing": {
    react: `// Fluent 2 spacing - design tokens
const spacing = {
  xxs: "var(--spacingHorizontalXXS)", // 2px
  xs:  "var(--spacingHorizontalXS)",  // 4px
  s:   "var(--spacingHorizontalS)",   // 8px
  m:   "var(--spacingHorizontalM)",   // 12px
  l:   "var(--spacingHorizontalL)",   // 16px
  xl:  "var(--spacingHorizontalXL)",  // 20px
  xxl: "var(--spacingHorizontalXXL)", // 24px
};`,
    html: `<div style="padding: var(--spacingVerticalM) var(--spacingHorizontalL); gap: var(--spacingHorizontalS);">
  Spaced with Fluent tokens
</div>`,
  },
  "dl-elevation": {
    react: `// Fluent 2 elevation - shadow tokens
import { tokens } from "@fluentui/react-components";

<div style={{ boxShadow: tokens.shadow2 }}>Shadow 2 (card)</div>
<div style={{ boxShadow: tokens.shadow8 }}>Shadow 8 (menu)</div>
<div style={{ boxShadow: tokens.shadow16 }}>Shadow 16 (popover)</div>
<div style={{ boxShadow: tokens.shadow28 }}>Shadow 28 (dialog)</div>
<div style={{ boxShadow: tokens.shadow64 }}>Shadow 64 (command)</div>`,
    html: `<div style="box-shadow: var(--shadow8);">Elevated menu</div>`,
  },
  "dl-a11y": {
    react: `// Fluent 2 a11y
// - 4.5:1 text contrast (3:1 for large)
// - Focus indicator: 2px solid colorStrokeFocus2 (high contrast)
// - Touch targets: 32px default, 44px dense disabled
// - Motion: prefers-reduced-motion respected by all components

<Button
  icon={<SearchIcon />}
  aria-label="Search"
/>

<FluentProvider theme={highContrastTheme}>
  <App />
</FluentProvider>`,
    html: `<button class="f-Button" aria-label="Search">
  <span class="material-symbols-outlined" aria-hidden="true">search</span>
</button>`,
  },
  "dl-density": {
    react: `// Fluent 2 size - component-level prop (not provider-level)
<Button size="small">Small</Button>   // 24px
<Button size="medium">Medium</Button>  // 32px default
<Button size="large">Large</Button>   // 40px

<Input size="small" />
<Input size="large" />`,
    html: `<button class="f-Button f-Button--small">Small</button>
<button class="f-Button f-Button--medium">Medium</button>
<button class="f-Button f-Button--large">Large</button>`,
  },
  "dl-content": {
    react: `// Fluent 2 content design
// - Clear, helpful, respectful - Microsoft style guide
// - Title case for UI labels, headings
// - Sentence case for long-form, descriptions
// - Keep button labels short (<20 chars)

<Button>Save changes</Button>                        // Good
<Button>Click to save your changes now</Button>      // Bad

<MessageBar intent="error">
  We couldn't save your work. Check your connection and try again.
</MessageBar>`,
    html: `<label class="f-Label">Full Name</label>
<span class="f-HelperText">Used on your profile and sign-in</span>`,
  },
  "dl-icons": {
    react: `// Fluent 2 icons - @fluentui/react-icons
// 4,000+ tree-shakeable SVG React components
import { Search24Regular, Search24Filled, Settings20Regular } from "@fluentui/react-icons";

<Search24Regular />
<Search24Filled />
<Settings20Regular className="custom" />

// Naming: {Name}{Size}{Style} where Style = Regular | Filled`,
    html: `<!-- Use inline SVG or npm install @fluentui/react-icons-font -->
<svg width="24" height="24" viewBox="0 0 24 24"><!-- ... --></svg>`,
  },
  "dl-motion": {
    react: `// Fluent 2 motion - 5 duration tokens + 4 easings
// durationUltraFast (50ms) ultraFast fast (100) normal (200) slow (300) slower (400) ultraSlow (500)
// curveAccelerateMax easeOut easeIn curveDecelerateMid

import { tokens } from "@fluentui/react-components";

<div style={{
  transition: \`opacity \${tokens.durationNormal} \${tokens.curveEasyEase}\`,
}}>
  Animated with Fluent motion tokens
</div>`,
    html: `<style>
  .f-fade {
    transition: opacity var(--durationNormal) var(--curveEasyEase);
  }
</style>`,
  },
  "dl-shapes": {
    react: `// Fluent 2 shape tokens - border-radius
import { tokens } from "@fluentui/react-components";

tokens.borderRadiusNone;      // 0
tokens.borderRadiusSmall;     // 2px
tokens.borderRadiusMedium;    // 4px (default)
tokens.borderRadiusLarge;     // 6px
tokens.borderRadiusXLarge;    // 8px
tokens.borderRadiusCircular;  // 10000px (pill)

<Card style={{ borderRadius: tokens.borderRadiusLarge }}>6px corners</Card>`,
    html: `<div style="border-radius: var(--borderRadiusMedium);">4px corners</div>
<div style="border-radius: var(--borderRadiusCircular);">Pill</div>`,
  },
  link: {
    react: `// Fluent 2 Link component
import { Link } from "@fluentui/react-components";

<Link href="/docs">Read the docs</Link>
<Link href="/privacy" appearance="subtle">Privacy policy</Link>
<Link disabled>Disabled link</Link>
<Link inline>inline within text</Link>`,
    html: `<a href="/docs" class="f-Link">Read the docs</a>
<a href="/privacy" class="f-Link f-Link--subtle">Privacy policy</a>`,
  },
  tokens: {
    react: `// Fluent 2 tokens surface - @fluentui/tokens
import { tokens } from "@fluentui/react-components";

// Categories: color, font, spacing, border, shadow, duration, curve
const theme = {
  bg: tokens.colorNeutralBackground1,
  fg: tokens.colorNeutralForeground1,
  brand: tokens.colorBrandBackground,
  radius: tokens.borderRadiusMedium,
  shadow: tokens.shadow8,
};`,
    html: `<!-- Fluent tokens via CSS vars on FluentProvider -->
<div class="fui-FluentProvider" style="--colorBrandBackground: #0F6CBD;">
  <button style="background: var(--colorBrandBackground);">Brand button</button>
</div>`,
  },
  audit: {
    react: `// Fluent 2 audit checklist
// - Use tokens from @fluentui/tokens (not raw hex)
// - Size prop uses small | medium | large (not arbitrary px)
// - Focus visible via Fluent's focus-indicator
// - High-contrast theme tested

// Dev-time inspection
import { webLightTheme } from "@fluentui/react-components";
console.log("Brand:", webLightTheme.colorBrandBackground);`,
    html: `<!-- BAD  --><div style="background: #0F6CBD; padding: 12px;">...</div>
<!-- GOOD --><div style="background: var(--colorBrandBackground); padding: var(--spacingVerticalM);">...</div>`,
  },
  "pat-app-shell": {
    react: `// App shell pattern
import { Card } from "@fluentui/react-components";

function AppShell() {
  return <Card>{/* App shell */}</Card>;
}`,
    html: `<!-- App shell: Header + sidebar + main + footer shell. Wraps your app with consistent chrome. -->
<section class="pattern-app-shell">
  <h2>App shell</h2>
  <p>Header + sidebar + main + footer shell. Wraps your app with consistent chrome.</p>
</section>`,
  },
  "pat-dashboard": {
    react: `// Analytics Dashboard - full zone layout (matches Builder "Analytics Dashboard")
import { Card, CardHeader, Body1, Title1, Title3, Caption1, Badge,
         ProgressBar } from "@fluentui/react-components";
import { Home24Regular, DataArea24Regular, Person24Regular,
         DataFunnel24Regular, Settings24Regular } from "@fluentui/react-icons";

function AnalyticsDashboard() {
  const kpis = [
    { label: "MRR", value: "$48,200", pct: 12 },
    { label: "Active users", value: "12,847", pct: 8 },
    { label: "Churn rate", value: "2.1%", pct: -3 },
  ];

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="shell-header">
        <Title3>Acme Analytics</Title3>
        <Badge appearance="filled" color="success">Live</Badge>
      </header>

      {/* Sidebar */}
      <aside className="shell-sidebar">
        <nav>
          <a className="nav-item is-active"><Home24Regular /> Overview</a>
          <a className="nav-item"><DataArea24Regular /> Events</a>
          <a className="nav-item"><Person24Regular /> Users</a>
          <a className="nav-item"><DataFunnel24Regular /> Funnels</a>
          <a className="nav-item"><Settings24Regular /> Settings</a>
        </nav>
      </aside>

      {/* Body */}
      <main className="shell-body">
        <section className="grid-3">
          {kpis.map((k) => (
            <Card key={k.label}>
              <CardHeader header={<Caption1>{k.label}</Caption1>} />
              <Title1>{k.value}</Title1>
              <Body1 style={{ color: k.pct >= 0 ? "var(--colorPaletteGreenForeground1)" : "var(--colorPaletteRedForeground1)" }}>
                {k.pct >= 0 ? "+" : ""}{k.pct}%
              </Body1>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader header={<Title3>Revenue - last 30 days</Title3>} />
          <AreaChart data={revenue} />
        </Card>

        <Card>
          <DataGrid items={activityRows} columns={activityCols} />
        </Card>

        <section className="grid-2-1">
          <Card>
            <CardHeader header={<Title3>Daily events</Title3>} />
            <ColumnChart data={daily} />
          </Card>
          <Card>
            <Body1>Monthly plan usage</Body1>
            <ProgressBar value={0.64} />
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="shell-footer">
        <Caption1>Last updated 2 min ago - v2.4</Caption1>
      </footer>
    </div>
  );
}`,
    html: `<!-- Analytics Dashboard - zone-based layout with KPI row, revenue chart, data table -->
<div class="app-shell">
  <header class="shell-header">
    <span class="brand">Acme Analytics</span>
    <span class="f-badge f-badge-success">Live</span>
  </header>

  <aside class="shell-sidebar">
    <a class="nav-item is-active">Overview</a>
    <a class="nav-item">Events</a>
    <a class="nav-item">Users</a>
    <a class="nav-item">Funnels</a>
    <a class="nav-item">Settings</a>
  </aside>

  <main class="shell-body">
    <section class="grid-3">
      <article class="f-card"><small>MRR</small><h1>$48,200</h1><span class="pos">+12%</span></article>
      <article class="f-card"><small>Active users</small><h1>12,847</h1><span class="pos">+8%</span></article>
      <article class="f-card"><small>Churn rate</small><h1>2.1%</h1><span class="neg">-3%</span></article>
    </section>

    <article class="f-card chart">Revenue - last 30 days</article>
    <article class="f-card datagrid">Activity table</article>

    <section class="grid-2-1">
      <article class="f-card chart">Daily events</article>
      <article class="f-card"><small>Monthly plan usage</small><progress value="64" max="100"></progress></article>
    </section>
  </main>

  <footer class="shell-footer">Last updated 2 min ago - v2.4</footer>
</div>`,
  },
  "pat-data-table": {
    react: `// CRM Contacts / Data Table Page - full zone layout (matches Builder "CRM Contacts")
import { Card, CardHeader, SearchBox, Dropdown, Option, DataGrid,
         DataGridHeader, DataGridRow, DataGridBody, DataGridCell,
         Title1, Title3, Body1, Caption1, Badge } from "@fluentui/react-components";
import { Person24Regular, DataPie24Regular, DataBarHorizontal24Regular,
         Chat24Regular, Home24Regular } from "@fluentui/react-icons";

function CRMContacts() {
  return (
    <div className="app-shell">
      <header className="shell-header">
        <Title3>Contacts</Title3>
        <Badge appearance="outline">247 records</Badge>
      </header>

      <aside className="shell-sidebar">
        <nav>
          <a className="nav-item is-active"><Person24Regular /> All Contacts</a>
          <a className="nav-item"><DataPie24Regular /> Companies</a>
          <a className="nav-item"><DataBarHorizontal24Regular /> Deals</a>
          <a className="nav-item"><Chat24Regular /> Activities</a>
          <a className="nav-item"><Home24Regular /> Reports</a>
        </nav>
      </aside>

      <main className="shell-body">
        {/* Search + filter row */}
        <section className="grid-2-1">
          <SearchBox placeholder="Search by name, company, email..." />
          <Dropdown defaultValue="All statuses">
            <Option>All statuses</Option>
            <Option>Active</Option>
            <Option>Pending</Option>
            <Option>Archived</Option>
          </Dropdown>
        </section>

        {/* Main data table */}
        <Card>
          <DataGrid items={contacts} columns={contactCols} sortable>
            <DataGridHeader />
            <DataGridBody>{(row) => <DataGridRow>{row.cells}</DataGridRow>}</DataGridBody>
          </DataGrid>
        </Card>

        {/* Pipeline KPIs */}
        <section className="grid-3">
          {[
            { label: "New this week", value: "24", pct: 12 },
            { label: "Active leads", value: "89", pct: 5 },
            { label: "Deals closed (MTD)", value: "$12.4K", pct: 18 },
          ].map((k) => (
            <Card key={k.label}>
              <CardHeader header={<Caption1>{k.label}</Caption1>} />
              <Title1>{k.value}</Title1>
              <Body1 style={{ color: "var(--colorPaletteGreenForeground1)" }}>+{k.pct}%</Body1>
            </Card>
          ))}
        </section>
      </main>

      <footer className="shell-footer">
        <Caption1>Showing 247 of 1,247 contacts - v3.2</Caption1>
      </footer>
    </div>
  );
}`,
    html: `<!-- CRM Contacts / Data Table Page - search, filters, rich data table, pipeline stats -->
<div class="app-shell">
  <header class="shell-header">
    <span class="brand">Contacts</span>
    <span class="f-badge f-badge-outline">247 records</span>
  </header>

  <aside class="shell-sidebar">
    <a class="nav-item is-active">All Contacts</a>
    <a class="nav-item">Companies</a>
    <a class="nav-item">Deals</a>
    <a class="nav-item">Activities</a>
    <a class="nav-item">Reports</a>
  </aside>

  <main class="shell-body">
    <section class="grid-2-1">
      <div class="f-searchbox">
        <input type="search" placeholder="Search by name, company, email..." />
      </div>
      <select class="f-dropdown">
        <option>All statuses</option>
        <option>Active</option>
        <option>Pending</option>
      </select>
    </section>

    <article class="f-card datagrid">Contacts table</article>

    <section class="grid-3">
      <article class="f-card"><small>New this week</small><h1>24</h1><span class="pos">+12%</span></article>
      <article class="f-card"><small>Active leads</small><h1>89</h1><span class="pos">+5%</span></article>
      <article class="f-card"><small>Deals closed (MTD)</small><h1>$12.4K</h1><span class="pos">+18%</span></article>
    </section>
  </main>

  <footer class="shell-footer">Showing 247 of 1,247 contacts - v3.2</footer>
</div>`,
  },
  "pat-form": {
    react: `// Form pattern
import { Card } from "@fluentui/react-components";

function Form() {
  return <Card>{/* Form */}</Card>;
}`,
    html: `<!-- Form: Grouped sections with inputs, validation, and a save bar. -->
<section class="pattern-form">
  <h2>Form</h2>
  <p>Grouped sections with inputs, validation, and a save bar.</p>
</section>`,
  },
  "pat-list-detail": {
    react: `// List + detail pattern
import { Card } from "@fluentui/react-components";

function ListDetail() {
  return <Card>{/* List + detail */}</Card>;
}`,
    html: `<!-- List + detail: Master list on the left, detail pane on the right. Standard CRM/email layout. -->
<section class="pattern-list-detail">
  <h2>List + detail</h2>
  <p>Master list on the left, detail pane on the right. Standard CRM/email layout.</p>
</section>`,
  },
  "pat-login": {
    react: `// Login / Auth - full auth flow (matches Builder "Login -> Dashboard")
import { Card, Input, Field, Button, Checkbox, Link, MessageBar, MessageBarBody,
         MessageBarTitle, Title1, Title3, Body1, Caption1, Badge } from "@fluentui/react-components";

function Login() {
  return (
    <div className="auth-shell">
      <header className="auth-header">
        <Title3>Acme</Title3>
        <Badge appearance="tint" color="success">Secure</Badge>
      </header>

      <main className="auth-body">
        <Card className="auth-card">
          <Title1>Sign in to Acme</Title1>
          <Body1>Welcome back - enter your details to continue.</Body1>

          <Field label="Work email">
            <Input type="email" placeholder="you@company.com" />
          </Field>

          <Field label="Password">
            <Input type="password" placeholder="Enter your password" />
          </Field>

          <div className="auth-row">
            <Checkbox label="Keep me signed in for 30 days" />
            <Link href="/forgot">Forgot password?</Link>
          </div>

          <Button appearance="primary" size="large">Sign in</Button>
          <Button appearance="outline">Continue with Microsoft</Button>
          <Button appearance="outline">Continue with Google</Button>

          <MessageBar intent="info">
            <MessageBarBody>
              <MessageBarTitle>After sign-in</MessageBarTitle>
              You land on the dashboard.
            </MessageBarBody>
          </MessageBar>
        </Card>
      </main>

      <footer className="auth-footer">
        <Caption1>(c) 2026 Acme, Inc. - Privacy - Terms</Caption1>
      </footer>
    </div>
  );
}`,
    html: `<!-- Login / Auth - auth card with email + password + OAuth + remember-me -->
<div class="auth-shell">
  <header class="auth-header">
    <span class="brand">Acme</span>
    <span class="f-badge f-badge-success">Secure</span>
  </header>

  <main class="auth-body">
    <form class="f-card auth-card">
      <h1>Sign in to Acme</h1>
      <p class="muted">Welcome back - enter your details to continue.</p>

      <label class="f-field"><span>Work email</span><input class="f-input" type="email" placeholder="you@company.com" /></label>
      <label class="f-field"><span>Password</span><input class="f-input" type="password" placeholder="Enter your password" /></label>

      <div class="auth-row">
        <label><input type="checkbox" /> Keep me signed in for 30 days</label>
        <a href="/forgot">Forgot password?</a>
      </div>

      <button class="f-btn f-btn-primary" type="submit">Sign in</button>
      <button class="f-btn f-btn-outline" type="button">Continue with Microsoft</button>
      <button class="f-btn f-btn-outline" type="button">Continue with Google</button>

      <div class="f-messagebar f-messagebar-info">
        <strong>After sign-in</strong>
        <p>You land on the dashboard.</p>
      </div>
    </form>
  </main>

  <footer class="auth-footer">(c) 2026 Acme, Inc. - Privacy - Terms</footer>
</div>`,
  },
  "pat-search": {
    react: `// Search pattern
import { Card } from "@fluentui/react-components";

function Search() {
  return <Card>{/* Search */}</Card>;
}`,
    html: `<!-- Search: Search input + filter chips + result list with empty / loading states. -->
<section class="pattern-search">
  <h2>Search</h2>
  <p>Search input + filter chips + result list with empty / loading states.</p>
</section>`,
  },
  "pat-settings": {
    react: `// Settings Page - full zone layout (matches Builder "Settings Page")
import { Card, Input, Field, Switch, Button, Avatar, Divider,
         MessageBar, MessageBarBody, MessageBarTitle,
         Title1, Title3, Body1, Caption1, Badge } from "@fluentui/react-components";
import { Person24Regular, Alert24Regular, Shield24Regular,
         Storage24Regular, Wallet24Regular } from "@fluentui/react-icons";

function SettingsPage() {
  return (
    <div className="app-shell">
      <header className="shell-header">
        <Title3>Workspace</Title3>
        <Badge appearance="tint" color="success">Saved</Badge>
      </header>

      <aside className="shell-sidebar">
        <nav>
          <a className="nav-item is-active"><Person24Regular /> Profile</a>
          <a className="nav-item"><Alert24Regular /> Notifications</a>
          <a className="nav-item"><Shield24Regular /> Security</a>
          <a className="nav-item"><Storage24Regular /> Workspace</a>
          <a className="nav-item"><Wallet24Regular /> Billing</a>
        </nav>
      </aside>

      <main className="shell-body">
        {/* Profile section */}
        <section className="settings-group">
          <Title1>Profile</Title1>
          <div className="avatar-row">
            <Avatar name="Sarah Chen" size={56} />
            <Button appearance="outline">Change photo</Button>
          </div>
          <Field label="Full name"><Input placeholder="Sarah Chen" /></Field>
          <Field label="Work email"><Input placeholder="sarah@acme.co" /></Field>
        </section>

        {/* Preferences section */}
        <section className="settings-group">
          <Title1>Preferences</Title1>
          <Switch label="Email notifications" defaultChecked />
          <Switch label="Weekly digest email" />
          <Switch label="Product updates & marketing" />
        </section>

        <Divider />

        {/* Danger zone */}
        <section className="settings-group">
          <Title1>Danger zone</Title1>
          <MessageBar intent="error">
            <MessageBarBody>
              <MessageBarTitle>Delete account</MessageBarTitle>
              This permanently removes your workspace and cannot be undone.
            </MessageBarBody>
          </MessageBar>
          <Button appearance="subtle" style={{ color: "var(--colorPaletteRedForeground1)" }}>
            Delete account
          </Button>
        </section>
      </main>

      <footer className="shell-footer">
        <Caption1>Changes save automatically - v1.0</Caption1>
      </footer>
    </div>
  );
}`,
    html: `<!-- Settings Page - grouped sections with toggles, inputs, and a danger zone -->
<div class="app-shell">
  <header class="shell-header">
    <span class="brand">Workspace</span>
    <span class="f-badge f-badge-success">Saved</span>
  </header>

  <aside class="shell-sidebar">
    <a class="nav-item is-active">Profile</a>
    <a class="nav-item">Notifications</a>
    <a class="nav-item">Security</a>
    <a class="nav-item">Workspace</a>
    <a class="nav-item">Billing</a>
  </aside>

  <main class="shell-body">
    <section class="settings-group">
      <h2>Profile</h2>
      <div class="avatar-row">
        <div class="f-avatar f-avatar-lg">SC</div>
        <button class="f-btn f-btn-outline">Change photo</button>
      </div>
      <label class="f-field"><span>Full name</span><input class="f-input" placeholder="Sarah Chen" /></label>
      <label class="f-field"><span>Work email</span><input class="f-input" placeholder="sarah@acme.co" /></label>
    </section>

    <section class="settings-group">
      <h2>Preferences</h2>
      <label class="switch-row"><input type="checkbox" role="switch" checked /> Email notifications</label>
      <label class="switch-row"><input type="checkbox" role="switch" /> Weekly digest email</label>
      <label class="switch-row"><input type="checkbox" role="switch" /> Product updates & marketing</label>
    </section>

    <hr class="f-divider" />

    <section class="settings-group">
      <h2>Danger zone</h2>
      <div class="f-messagebar f-messagebar-error">
        <strong>Delete account</strong>
        <p>This permanently removes your workspace and cannot be undone.</p>
      </div>
      <button class="f-btn f-btn-subtle f-btn-danger">Delete account</button>
    </section>
  </main>

  <footer class="shell-footer">Changes save automatically - v1.0</footer>
</div>`,
  },
  "pat-wizard": {
    react: `// Wizard pattern
import { Card } from "@fluentui/react-components";

function Wizard() {
  return <Card>{/* Wizard */}</Card>;
}`,
    html: `<!-- Wizard: Multi-step flow with progress indicator + back/next controls. -->
<section class="pattern-wizard">
  <h2>Wizard</h2>
  <p>Multi-step flow with progress indicator + back/next controls.</p>
</section>`,
  },
};
