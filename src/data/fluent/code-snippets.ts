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
};
