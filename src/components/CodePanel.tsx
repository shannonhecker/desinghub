"use client";

import React, { useState } from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { getComponents, getSystemInfo } from "@/data/registry";

/* ═══════════════════════════════════════════════════════════
   Salt DS — React + HTML code snippets
   All use proper Salt API — no hardcoded hex values
   ═══════════════════════════════════════════════════════════ */
const SALT_CODE: Record<string, { react: string; html: string }> = {
  buttons: {
    react: `import { Button } from "@salt-ds/core";

// Appearances: solid (default), bordered, transparent
// Sentiments: accented, neutral, positive, caution, negative
<Button sentiment="accented" appearance="solid">
  Submit
</Button>
<Button sentiment="neutral" appearance="bordered">
  Cancel
</Button>
<Button sentiment="negative" appearance="solid">
  Delete
</Button>`,
    html: `<button class="saltButton saltButton-solid saltButton-accented">
  Submit
</button>

<style>
  .saltButton {
    height: var(--salt-size-base);
    padding: 0 var(--salt-spacing-100);
    border-radius: var(--salt-palette-corner-weak);
    font-family: var(--salt-text-fontFamily);
  }
</style>`,
  },
  pills: {
    react: `import { Pill } from "@salt-ds/core";

// Pill = selectable tag for filtering/categorization
<Pill onClick={handleToggle}>Category</Pill>
<Pill selected>Active Filter</Pill>
<Pill disabled>Locked</Pill>`,
    html: `<button class="saltPill" role="option">
  Category
</button>
<button class="saltPill saltPill-selected" aria-selected="true">
  Active Filter
</button>`,
  },
  tag: {
    react: `import { Tag } from "@salt-ds/core";

// Tag = dismissible label (vs Pill which is selectable)
<Tag onDismiss={handleDismiss}>Removable</Tag>
<Tag variant="primary">Primary</Tag>
<Tag variant="secondary">Secondary</Tag>`,
    html: `<span class="saltTag">
  Removable
  <button class="saltTag-dismiss" aria-label="Remove">&times;</button>
</span>`,
  },
  link: {
    react: `import { Link } from "@salt-ds/core";

// Variants: accent (default), primary, secondary
<Link href="/dashboard" variant="accent">Dashboard</Link>
<Link href="/settings" variant="primary">Settings</Link>
<Link href="#" variant="secondary" target="_blank">
  External Link
</Link>`,
    html: `<a class="saltLink saltLink-accent" href="/dashboard">
  Dashboard
</a>`,
  },
  inputs: {
    react: `import { Input, FormField, FormFieldLabel, FormFieldHelperText } from "@salt-ds/core";

<FormField>
  <FormFieldLabel>Label</FormFieldLabel>
  <Input placeholder="Enter text..." />
  <FormFieldHelperText>Helper text</FormFieldHelperText>
</FormField>

// With validation
<FormField validationStatus="error">
  <FormFieldLabel>Email</FormFieldLabel>
  <Input defaultValue="invalid" />
  <FormFieldHelperText>Invalid email address</FormFieldHelperText>
</FormField>`,
    html: `<div class="saltFormField">
  <label class="saltFormFieldLabel">Label</label>
  <input class="saltInput" placeholder="Enter text..." />
  <span class="saltFormFieldHelperText">Helper text</span>
</div>`,
  },
  checkboxes: {
    react: `import { Checkbox, CheckboxGroup } from "@salt-ds/core";

<CheckboxGroup>
  <Checkbox label="Option A" defaultChecked />
  <Checkbox label="Option B" />
  <Checkbox label="Option C" disabled />
</CheckboxGroup>`,
    html: `<div role="group" class="saltCheckboxGroup">
  <label class="saltCheckbox">
    <input type="checkbox" checked /> Option A
  </label>
  <label class="saltCheckbox">
    <input type="checkbox" /> Option B
  </label>
</div>`,
  },
  radios: {
    react: `import { RadioButton, RadioButtonGroup } from "@salt-ds/core";

<RadioButtonGroup defaultValue="a">
  <RadioButton label="Option A" value="a" />
  <RadioButton label="Option B" value="b" />
  <RadioButton label="Option C" value="c" disabled />
</RadioButtonGroup>`,
    html: `<fieldset class="saltRadioButtonGroup" role="radiogroup">
  <label class="saltRadioButton">
    <input type="radio" name="group" value="a" checked />
    Option A
  </label>
</fieldset>`,
  },
  switches: {
    react: `import { Switch } from "@salt-ds/core";

<Switch label="Notifications" defaultChecked />
<Switch label="Dark mode" />
<Switch label="Locked" disabled />`,
    html: `<label class="saltSwitch">
  <input type="checkbox" role="switch" checked />
  <span>Notifications</span>
</label>`,
  },
  slider: {
    react: `import { Slider } from "@salt-ds/core";

<Slider min={0} max={100} defaultValue={50} />
<Slider min={0} max={100} defaultValue={[20, 80]} />`,
    html: `<input type="range" class="saltSlider"
  min="0" max="100" value="50" />`,
  },
  dropdown: {
    react: `import { Dropdown, Option } from "@salt-ds/core";

<Dropdown defaultSelected={["option-1"]}>
  <Option value="option-1">Profile</Option>
  <Option value="option-2">Settings</Option>
  <Option value="option-3" disabled>Billing</Option>
</Dropdown>`,
    html: `<div class="saltDropdown">
  <button class="saltDropdown-trigger">Select...</button>
  <div class="saltDropdown-list" role="listbox">
    <div class="saltDropdown-option" role="option">Profile</div>
  </div>
</div>`,
  },
  calendar: {
    react: `import { DatePicker, DatePickerSingleInput,
  DatePickerOverlay, DatePickerSinglePanel } from "@salt-ds/core";

<DatePicker selectionVariant="single">
  <DatePickerSingleInput />
  <DatePickerOverlay>
    <DatePickerSinglePanel />
  </DatePickerOverlay>
</DatePicker>`,
    html: `<div class="saltDatePicker">
  <input class="saltDatePickerInput" placeholder="DD MMM YYYY" />
</div>`,
  },
  tabs: {
    react: `import { TabBar, Tab, TabPanel } from "@salt-ds/core";

<TabBar>
  <Tab label="Overview" />
  <Tab label="Details" />
  <Tab label="Settings" />
</TabBar>
<TabPanel>Content for the active tab.</TabPanel>`,
    html: `<div role="tablist" class="saltTabBar">
  <button role="tab" aria-selected="true">Overview</button>
  <button role="tab">Details</button>
</div>
<div role="tabpanel">Content</div>`,
  },
  menu: {
    react: `import { Menu, MenuItem, MenuTrigger, MenuPanel } from "@salt-ds/core";

<Menu>
  <MenuTrigger>
    <Button appearance="transparent">Options</Button>
  </MenuTrigger>
  <MenuPanel>
    <MenuItem>Edit</MenuItem>
    <MenuItem>Duplicate</MenuItem>
    <MenuItem disabled>Delete</MenuItem>
  </MenuPanel>
</Menu>`,
    html: `<div class="saltMenu" role="menu">
  <button class="saltMenuItem" role="menuitem">Edit</button>
  <button class="saltMenuItem" role="menuitem">Duplicate</button>
</div>`,
  },
  stepper: {
    react: `import { StepperBar, Step } from "@salt-ds/core";

<StepperBar activeStep={1}>
  <Step label="Account" status="completed" />
  <Step label="Profile" status="active" />
  <Step label="Review" status="pending" />
</StepperBar>`,
    html: `<div class="saltStepper" role="list">
  <div class="saltStep saltStep-completed">Account</div>
  <div class="saltStep saltStep-active">Profile</div>
  <div class="saltStep saltStep-pending">Review</div>
</div>`,
  },
  pagination: {
    react: `import { Pagination, Paginator } from "@salt-ds/core";

<Pagination count={10} defaultPage={1}>
  <Paginator />
</Pagination>`,
    html: `<nav class="saltPagination" aria-label="Pagination">
  <button aria-label="Previous">&laquo;</button>
  <button aria-current="page">1</button>
  <button>2</button>
  <button aria-label="Next">&raquo;</button>
</nav>`,
  },
  banners: {
    react: `import { Banner, BannerContent, BannerActions } from "@salt-ds/core";

// Statuses: info, success, warning, error
<Banner status="info">
  <BannerContent>
    A new version is available.
  </BannerContent>
  <BannerActions>
    <Button appearance="transparent">Update</Button>
  </BannerActions>
</Banner>`,
    html: `<div class="saltBanner saltBanner-info" role="alert">
  <div class="saltBannerContent">A new version is available.</div>
</div>`,
  },
  dialog: {
    react: `import { Dialog, DialogHeader, DialogContent, DialogActions,
  DialogCloseButton } from "@salt-ds/core";

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogHeader header="Confirm Action" />
  <DialogContent>
    Are you sure you want to proceed?
  </DialogContent>
  <DialogActions>
    <Button appearance="bordered" onClick={handleClose}>Cancel</Button>
    <Button sentiment="accented" onClick={handleConfirm}>Confirm</Button>
  </DialogActions>
  <DialogCloseButton />
</Dialog>`,
    html: `<dialog class="saltDialog" open>
  <h2 class="saltDialogHeader">Confirm Action</h2>
  <div class="saltDialogContent">Are you sure?</div>
  <div class="saltDialogActions">
    <button class="saltButton">Cancel</button>
    <button class="saltButton saltButton-accented">Confirm</button>
  </div>
</dialog>`,
  },
  badges: {
    react: `import { Badge } from "@salt-ds/core";

// Sentiments: accented, positive, caution, negative
<Badge value={5} sentiment="accented" />
<Badge value="New" sentiment="positive" />
<Badge sentiment="negative" />`,
    html: `<span class="saltBadge saltBadge-accented">5</span>`,
  },
  avatars: {
    react: `import { Avatar } from "@salt-ds/core";

// Sizes scale with density
<Avatar name="Jane Doe" />
<Avatar name="JS" src="/avatars/js.png" />
<Avatar name="AO" size={2} />`,
    html: `<div class="saltAvatar" aria-label="Jane Doe">
  <span class="saltAvatar-initials">JD</span>
</div>`,
  },
  tooltips: {
    react: `import { Tooltip } from "@salt-ds/core";

<Tooltip content="More information here">
  <Button appearance="transparent">Hover me</Button>
</Tooltip>`,
    html: `<div class="saltTooltip" role="tooltip">
  More information here
</div>`,
  },
  progress: {
    react: `import { LinearProgress, CircularProgress } from "@salt-ds/core";

// Determinate
<LinearProgress value={65} />

// Indeterminate
<CircularProgress />`,
    html: `<div class="saltLinearProgress" role="progressbar"
  aria-valuenow="65" aria-valuemin="0" aria-valuemax="100">
  <div class="saltLinearProgress-bar" style="width: 65%"></div>
</div>`,
  },
  toast: {
    react: `import { Toast, ToastContent, ToastActions } from "@salt-ds/core";

<Toast status="success">
  <ToastContent>Changes saved successfully.</ToastContent>
  <ToastActions>
    <Button appearance="transparent">Undo</Button>
  </ToastActions>
</Toast>`,
    html: `<div class="saltToast saltToast-success" role="alert">
  <div class="saltToastContent">Changes saved successfully.</div>
</div>`,
  },
  spinner: {
    react: `import { Spinner } from "@salt-ds/core";

// Sizes scale with density
<Spinner />
<Spinner size="large" />`,
    html: `<div class="saltSpinner" role="status" aria-label="Loading">
  <svg class="saltSpinner-svg" viewBox="0 0 28 28"></svg>
</div>`,
  },
  cards: {
    react: `import { Card, InteractableCard } from "@salt-ds/core";

<Card>
  <h3>Card Title</h3>
  <p>Card content with description text.</p>
</Card>

<InteractableCard onClick={handleClick}>
  <h3>Clickable Card</h3>
  <p>Click to navigate or select.</p>
</InteractableCard>`,
    html: `<div class="saltCard">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>`,
  },
  accordion: {
    react: `import { Accordion, AccordionSection, AccordionHeader,
  AccordionPanel } from "@salt-ds/core";

<Accordion>
  <AccordionSection>
    <AccordionHeader>Section 1</AccordionHeader>
    <AccordionPanel>Content for section 1.</AccordionPanel>
  </AccordionSection>
  <AccordionSection>
    <AccordionHeader>Section 2</AccordionHeader>
    <AccordionPanel>Content for section 2.</AccordionPanel>
  </AccordionSection>
</Accordion>`,
    html: `<div class="saltAccordion">
  <button class="saltAccordionHeader" aria-expanded="true">
    Section 1
  </button>
  <div class="saltAccordionPanel">Content</div>
</div>`,
  },
  drawer: {
    react: `import { Drawer, DrawerCloseButton } from "@salt-ds/core";

<Drawer open={isOpen} onOpenChange={setIsOpen} position="left">
  <DrawerCloseButton />
  <h2>Settings</h2>
  <p>Drawer content here.</p>
</Drawer>`,
    html: `<div class="saltDrawer saltDrawer-left" role="dialog">
  <button class="saltDrawer-close" aria-label="Close">&times;</button>
  <h2>Settings</h2>
</div>`,
  },
  panel: {
    react: `import { Panel } from "@salt-ds/core";

// Variants: primary, secondary, tertiary
<Panel variant="primary">
  <h3>Panel Title</h3>
  <p>Panel content.</p>
</Panel>`,
    html: `<div class="saltPanel saltPanel-primary">
  <h3>Panel Title</h3>
  <p>Panel content.</p>
</div>`,
  },
  table: {
    react: `import { Table, TableRow, TableCell, TableHeader } from "@salt-ds/core";

<Table>
  <TableHeader>
    <TableRow>
      <TableCell>Name</TableCell>
      <TableCell>Status</TableCell>
    </TableRow>
  </TableHeader>
  <TableRow>
    <TableCell>Jane Doe</TableCell>
    <TableCell>Active</TableCell>
  </TableRow>
</Table>`,
    html: `<table class="saltTable">
  <thead>
    <tr><th>Name</th><th>Status</th></tr>
  </thead>
  <tbody>
    <tr><td>Jane Doe</td><td>Active</td></tr>
  </tbody>
</table>`,
  },
  dividers: {
    react: `import { Divider } from "@salt-ds/core";

// Variants: primary, secondary, tertiary
<Divider />
<Divider variant="secondary" />`,
    html: `<hr class="saltDivider" />`,
  },
  overlay: {
    react: `import { Overlay, OverlayTrigger, OverlayPanel } from "@salt-ds/core";

<Overlay>
  <OverlayTrigger>
    <Button>Show overlay</Button>
  </OverlayTrigger>
  <OverlayPanel>
    <h3>Overlay Content</h3>
    <p>Additional information here.</p>
  </OverlayPanel>
</Overlay>`,
    html: `<div class="saltOverlay" role="dialog">
  <div class="saltOverlayPanel">Content</div>
  <div class="saltScrim"></div>
</div>`,
  },
  charts: {
    react: `import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

// Salt DS themed chart — uses CSS variable bridge
const theme = {
  colors: [
    "var(--salt-palette-accent)",
    "var(--salt-status-positive-foreground)",
    "var(--salt-status-warning-foreground)",
    "var(--salt-status-negative-foreground)",
  ],
  chart: { backgroundColor: "transparent" },
  title: { style: { color: "var(--salt-content-primary-foreground)" } },
  xAxis: { gridLineColor: "transparent", lineColor: "var(--salt-separable-borderColor)" },
  yAxis: { gridLineColor: "var(--salt-separable-borderColor)" },
  tooltip: { backgroundColor: "var(--salt-container-primary-background)" },
};

<HighchartsReact
  highcharts={Highcharts}
  options={{
    ...theme,
    chart: { ...theme.chart, type: "line" },
    title: { text: "Monthly Revenue" },
    series: [{ name: "2024", data: [120, 134, 145, 152, 168, 185] }],
  }}
/>`,
    html: `<!-- Highcharts CDN -->
<script src="https://code.highcharts.com/highcharts.js"></script>
<div id="chart-container"></div>

<script>
Highcharts.chart('chart-container', {
  chart: { type: 'line', backgroundColor: 'transparent' },
  title: { text: 'Monthly Revenue' },
  series: [{ name: '2024', data: [120, 134, 145, 152, 168, 185] }],
  colors: ['#1B7F9E', '#36b37e', '#ffab00', '#de350b'],
  credits: { enabled: false }
});
</script>`,
  },
};

/* ═══════════════════════════════════════════════════════════
   Material 3 — React + HTML code snippets
   ═══════════════════════════════════════════════════════════ */
const M3_CODE: Record<string, { react: string; html: string }> = {
  buttons: {
    react: `import Button from "@mui/material/Button";

// Variants: contained, outlined, text
<Button variant="contained">Filled</Button>
<Button variant="outlined">Outlined</Button>
<Button variant="text">Text</Button>

// Color: primary, secondary, error, info, success, warning
<Button variant="contained" color="error">Delete</Button>`,
    html: `<button class="mdc-button mdc-button--raised">
  <span class="mdc-button__label">Filled</span>
</button>`,
  },
  inputs: {
    react: `import TextField from "@mui/material/TextField";

// Variants: filled (default), outlined, standard
<TextField label="Name" variant="filled" />
<TextField label="Email" variant="outlined" />
<TextField label="Error" error helperText="Required field" />`,
    html: `<label class="mdc-text-field mdc-text-field--filled">
  <span class="mdc-floating-label">Name</span>
  <input class="mdc-text-field__input" type="text" />
</label>`,
  },
  checkboxes: {
    react: `import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";

<FormGroup>
  <FormControlLabel control={<Checkbox defaultChecked />} label="Option A" />
  <FormControlLabel control={<Checkbox />} label="Option B" />
  <FormControlLabel control={<Checkbox disabled />} label="Disabled" />
</FormGroup>`,
    html: `<div class="mdc-form-field">
  <div class="mdc-checkbox">
    <input type="checkbox" class="mdc-checkbox__native-control" />
  </div>
  <label>Option A</label>
</div>`,
  },
  radios: {
    react: `import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";

<RadioGroup defaultValue="a">
  <FormControlLabel value="a" control={<Radio />} label="Option A" />
  <FormControlLabel value="b" control={<Radio />} label="Option B" />
</RadioGroup>`,
    html: `<div class="mdc-radio">
  <input type="radio" class="mdc-radio__native-control" name="group" />
</div>`,
  },
  cards: {
    react: `import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";

<Card variant="elevation">
  <CardContent>
    <h3>Card Title</h3>
    <p>Card content here.</p>
  </CardContent>
  <CardActions>
    <Button size="small">Learn More</Button>
  </CardActions>
</Card>`,
    html: `<div class="mdc-card mdc-card--elevated">
  <div class="mdc-card__content">Elevated Card</div>
</div>`,
  },
  chips: {
    react: `import Chip from "@mui/material/Chip";

<Chip label="Filter" onClick={handleClick} />
<Chip label="Selected" color="primary" onDelete={handleDelete} />
<Chip label="Outlined" variant="outlined" />`,
    html: `<span class="mdc-chip">
  <span class="mdc-chip__text">Filter</span>
</span>`,
  },
  switches: {
    react: `import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";

<FormControlLabel control={<Switch defaultChecked />} label="Active" />
<FormControlLabel control={<Switch />} label="Inactive" />
<FormControlLabel control={<Switch disabled />} label="Disabled" />`,
    html: `<label><input type="checkbox" role="switch" checked /> Active</label>`,
  },
  tabs: {
    react: `import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

<Tabs value={value} onChange={handleChange}>
  <Tab label="Tab 1" />
  <Tab label="Tab 2" />
  <Tab label="Tab 3" />
</Tabs>`,
    html: `<div class="mdc-tab-bar" role="tablist">
  <button class="mdc-tab mdc-tab--active" role="tab">Tab 1</button>
  <button class="mdc-tab" role="tab">Tab 2</button>
</div>`,
  },
  slider: {
    react: `import Slider from "@mui/material/Slider";

<Slider defaultValue={50} aria-label="Volume" />
<Slider defaultValue={[20, 80]} aria-label="Range" />`,
    html: `<input type="range" class="mdc-slider" min="0" max="100" />`,
  },
  dialog: {
    react: `import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

<Dialog open={open} onClose={handleClose}>
  <DialogTitle>Confirm Action</DialogTitle>
  <DialogContent>Are you sure?</DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancel</Button>
    <Button variant="contained" onClick={handleConfirm}>
      Confirm
    </Button>
  </DialogActions>
</Dialog>`,
    html: `<dialog class="mdc-dialog" open>
  <h2 class="mdc-dialog__title">Confirm</h2>
  <div class="mdc-dialog__content">Are you sure?</div>
</dialog>`,
  },
  menu: {
    react: `import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

<Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
  <MenuItem onClick={handleClose}>Edit</MenuItem>
  <MenuItem onClick={handleClose}>Duplicate</MenuItem>
  <MenuItem disabled>Delete</MenuItem>
</Menu>`,
    html: `<ul class="mdc-menu mdc-list" role="menu">
  <li class="mdc-list-item" role="menuitem">Edit</li>
</ul>`,
  },
  banners: {
    react: `import Alert from "@mui/material/Alert";

// Severity: info, success, warning, error
<Alert severity="info">Informational message.</Alert>
<Alert severity="success">Operation completed.</Alert>
<Alert severity="error" onClose={handleClose}>
  Something went wrong.
</Alert>`,
    html: `<div class="mdc-banner" role="alert">
  <div class="mdc-banner__text">Informational message.</div>
</div>`,
  },
  badges: {
    react: `import Badge from "@mui/material/Badge";

<Badge badgeContent={4} color="primary">
  <MailIcon />
</Badge>
<Badge badgeContent={99} color="error" max={99}>
  <NotificationsIcon />
</Badge>`,
    html: `<span class="mdc-badge" data-badge="4">
  <span class="material-symbols-outlined">mail</span>
</span>`,
  },
  avatars: {
    react: `import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";

<Avatar alt="Jane Doe" src="/avatar.jpg" />
<Avatar>JD</Avatar>
<AvatarGroup max={3}>
  <Avatar alt="User 1" src="/u1.jpg" />
  <Avatar alt="User 2" src="/u2.jpg" />
</AvatarGroup>`,
    html: `<div class="mdc-avatar">
  <span>JD</span>
</div>`,
  },
  tooltips: {
    react: `import Tooltip from "@mui/material/Tooltip";

<Tooltip title="More information">
  <Button>Hover me</Button>
</Tooltip>`,
    html: `<div class="mdc-tooltip" role="tooltip">More information</div>`,
  },
  progress: {
    react: `import LinearProgress from "@mui/material/LinearProgress";
import CircularProgress from "@mui/material/CircularProgress";

<LinearProgress variant="determinate" value={65} />
<CircularProgress />`,
    html: `<div class="mdc-linear-progress" role="progressbar">
  <div class="mdc-linear-progress__bar" style="width: 65%"></div>
</div>`,
  },
  accordion: {
    react: `import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";

<Accordion>
  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
    Section 1
  </AccordionSummary>
  <AccordionDetails>
    Content for section 1.
  </AccordionDetails>
</Accordion>`,
    html: `<div class="mdc-accordion">
  <button class="mdc-accordion__header" aria-expanded="true">
    Section 1
  </button>
  <div class="mdc-accordion__content">Content</div>
</div>`,
  },
  table: {
    react: `import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

<Table>
  <TableHead>
    <TableRow>
      <TableCell>Name</TableCell>
      <TableCell>Status</TableCell>
    </TableRow>
  </TableHead>
  <TableBody>
    <TableRow>
      <TableCell>Jane Doe</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>`,
    html: `<table class="mdc-data-table__table">
  <thead><tr><th>Name</th><th>Status</th></tr></thead>
  <tbody><tr><td>Jane Doe</td><td>Active</td></tr></tbody>
</table>`,
  },
  drawer: {
    react: `import Drawer from "@mui/material/Drawer";

<Drawer anchor="left" open={open} onClose={handleClose}>
  <h2>Navigation</h2>
  <List>
    <ListItem>Dashboard</ListItem>
    <ListItem>Settings</ListItem>
  </List>
</Drawer>`,
    html: `<aside class="mdc-drawer" role="dialog">
  <nav class="mdc-drawer__content">
    <a class="mdc-list-item" href="#">Dashboard</a>
  </nav>
</aside>`,
  },
  dividers: {
    react: `import Divider from "@mui/material/Divider";

<Divider />
<Divider variant="inset" />
<Divider orientation="vertical" flexItem />`,
    html: `<hr class="mdc-list-divider" />`,
  },
  pagination: {
    react: `import Pagination from "@mui/material/Pagination";

<Pagination count={10} page={page} onChange={handleChange} />
<Pagination count={10} variant="outlined" shape="rounded" />`,
    html: `<nav class="mdc-pagination" aria-label="Pagination">
  <button>&laquo;</button>
  <button aria-current="page">1</button>
  <button>&raquo;</button>
</nav>`,
  },
  stepper: {
    react: `import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";

<Stepper activeStep={1}>
  <Step completed><StepLabel>Account</StepLabel></Step>
  <Step><StepLabel>Profile</StepLabel></Step>
  <Step><StepLabel>Review</StepLabel></Step>
</Stepper>`,
    html: `<div class="mdc-stepper" role="list">
  <div class="mdc-step mdc-step--completed">Account</div>
  <div class="mdc-step mdc-step--active">Profile</div>
</div>`,
  },
  dropdown: {
    react: `import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

<Select value={value} onChange={handleChange} label="Role">
  <MenuItem value="admin">Admin</MenuItem>
  <MenuItem value="editor">Editor</MenuItem>
  <MenuItem value="viewer">Viewer</MenuItem>
</Select>`,
    html: `<select class="mdc-select">
  <option value="admin">Admin</option>
  <option value="editor">Editor</option>
</select>`,
  },
  spinner: {
    react: `import CircularProgress from "@mui/material/CircularProgress";

<CircularProgress />
<CircularProgress size={24} />`,
    html: `<div class="mdc-circular-progress" role="progressbar">
  <svg class="mdc-circular-progress__circle"></svg>
</div>`,
  },
  toast: {
    react: `import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

<Snackbar open={open} autoHideDuration={4000} onClose={handleClose}>
  <Alert severity="success" onClose={handleClose}>
    Changes saved!
  </Alert>
</Snackbar>`,
    html: `<div class="mdc-snackbar">
  <div class="mdc-snackbar__surface">Changes saved!</div>
</div>`,
  },
  charts: {
    react: `import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

// Material 3 themed chart — uses M3 color tokens
const theme = {
  colors: [
    "var(--md-sys-color-primary)",
    "var(--md-sys-color-tertiary)",
    "var(--md-sys-color-secondary)",
    "var(--md-sys-color-error)",
  ],
  chart: { backgroundColor: "transparent" },
  title: { style: { color: "var(--md-sys-color-on-surface)" } },
  xAxis: { lineColor: "var(--md-sys-color-outline-variant)" },
  yAxis: { gridLineColor: "var(--md-sys-color-outline-variant)" },
  tooltip: { backgroundColor: "var(--md-sys-color-surface-container-high)" },
};

<HighchartsReact
  highcharts={Highcharts}
  options={{
    ...theme,
    chart: { ...theme.chart, type: "column" },
    title: { text: "Sales by Region" },
    series: [{ name: "Q4", data: [480, 410, 340, 210] }],
  }}
/>`,
    html: `<script src="https://code.highcharts.com/highcharts.js"></script>
<div id="chart-container"></div>

<script>
Highcharts.chart('chart-container', {
  chart: { type: 'column', backgroundColor: 'transparent' },
  title: { text: 'Sales by Region' },
  series: [{ name: 'Q4', data: [480, 410, 340, 210] }],
  colors: ['#6750A4', '#7D5260', '#625B71', '#B3261E'],
  credits: { enabled: false }
});
</script>`,
  },
};

/* ═══════════════════════════════════════════════════════════
   Fluent 2 — React + HTML code snippets
   ═══════════════════════════════════════════════════════════ */
const FLUENT_CODE: Record<string, { react: string; html: string }> = {
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
};

/* ═══════════════════════════════════════════════════════════
   Code Block — single-pass tokenizer, CSS class highlighting
   ═══════════════════════════════════════════════════════════ */
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* Single-pass tokenizer — avoids cascading regex corruption */
  const escaped = code
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const tokenRe = /(\/\/[^\n]+|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*")|(\b(?:import|from|const|let|function|return|export|default|type|interface)\b)|(&lt;\/?[A-Z]\w*)|(\b\w+)(?==)/g;

  let highlighted = "";
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(escaped)) !== null) {
    highlighted += escaped.slice(lastIdx, m.index);
    if (m[1])      highlighted += `<span class="syn-comment">${m[1]}</span>`;
    else if (m[2]) highlighted += `<span class="syn-string">${m[2]}</span>`;
    else if (m[3]) highlighted += `<span class="syn-keyword">${m[3]}</span>`;
    else if (m[4]) highlighted += `<span class="syn-component">${m[4]}</span>`;
    else if (m[5]) highlighted += `<span class="syn-prop">${m[5]}</span>`;
    lastIdx = tokenRe.lastIndex;
  }
  highlighted += escaped.slice(lastIdx);

  return (
    <div className="code-block-wrapper">
      <button className="code-block-copy" onClick={copy}>
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre className="code-block-pre">
        <code className="code-block-body" dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CodePanel — entry point
   ═══════════════════════════════════════════════════════════ */
export function CodePanel({ componentId }: { componentId: string }) {
  const { activeSystem } = useDesignHub();
  const [codeTab, setCodeTab] = useState<"react" | "html">("react");
  const components = getComponents(activeSystem);
  const comp = components.find((c) => c.id === componentId);
  const sysInfo = getSystemInfo(activeSystem);

  const codeMap = activeSystem === "salt" ? SALT_CODE : activeSystem === "m3" ? M3_CODE : FLUENT_CODE;
  const snippets = codeMap[componentId];

  return (
    <div className="code-panel">
      <button
        className="code-panel-back"
        onClick={() => useDesignHub.getState().setSelectedComponent(null)}
      >
        ← Back to all
      </button>
      <h2 className="code-panel-title">{comp?.name} — Code</h2>
      <p className="code-panel-subtitle">
        {sysInfo.name} implementation with correct imports and API
      </p>

      {snippets ? (
        <>
          <div className="code-panel-tabs">
            {(["react", "html"] as const).map((t) => (
              <button
                key={t}
                className={`code-panel-tab ${codeTab === t ? "active" : ""}`}
                onClick={() => setCodeTab(t)}
              >
                {t === "react" ? "React + TypeScript" : "HTML + CSS"}
              </button>
            ))}
          </div>
          <CodeBlock code={snippets[codeTab]} language={codeTab === "react" ? "tsx" : "html"} />
        </>
      ) : (
        <div className="code-panel-empty">
          Code snippets for <strong>{comp?.name}</strong> coming soon.
          <br />
          <span>Check the {sysInfo.name} documentation for current API reference.</span>
        </div>
      )}
    </div>
  );
}
