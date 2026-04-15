import type { CodeSnippets } from "./types";

export const SALT_CODE: CodeSnippets = {
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
  "combo-box": {
    react: `import { ComboBox, Option } from "@salt-ds/core";

<ComboBox>
  <Option value="us">United States</Option>
  <Option value="uk">United Kingdom</Option>
  <Option value="ca">Canada</Option>
</ComboBox>`,
    html: `<div class="saltComboBox">
  <input class="saltComboBox-input" placeholder="Search..." />
  <div class="saltComboBox-list" role="listbox">
    <div role="option">United States</div>
  </div>
</div>`,
  },
  "data-grid": {
    react: `import { AgGridReact } from "ag-grid-react";
import "@salt-ds/ag-grid-theme/salt-ag-theme.css";

const columnDefs = [
  { field: "name", sortable: true },
  { field: "status" },
  { field: "value", type: "numericColumn" },
];

<div className="ag-theme-salt" style={{ height: 300 }}>
  <AgGridReact
    rowData={data}
    columnDefs={columnDefs}
    rowSelection="multiple"
  />
</div>`,
    html: `<div class="ag-theme-salt" style="height:300px">
  <!-- ag-Grid renders here -->
</div>`,
  },
  "date-picker": {
    react: `import { DatePicker, DatePickerSingleInput,
  DatePickerOverlay, DatePickerSinglePanel,
  DatePickerActions } from "@salt-ds/lab";
import { LocalizationProvider } from "@salt-ds/lab";

<LocalizationProvider>
  <DatePicker selectionVariant="single">
    <DatePickerSingleInput />
    <DatePickerOverlay>
      <DatePickerSinglePanel />
      <DatePickerActions />
    </DatePickerOverlay>
  </DatePicker>
</LocalizationProvider>`,
    html: `<div class="saltDatePicker">
  <input class="saltInput" placeholder="DD MMM YYYY" />
</div>`,
  },
  "file-drop": {
    react: `import { FileDropZone, FileDropZoneIcon,
  FileDropZoneTrigger } from "@salt-ds/core";

<FileDropZone onDrop={handleDrop}>
  <FileDropZoneIcon />
  <strong>Drop files here or</strong>
  <FileDropZoneTrigger />
</FileDropZone>`,
    html: `<div class="saltFileDropZone" role="button">
  <span>Drop files here</span>
</div>`,
  },
  "form-field": {
    react: `import { FormField, FormFieldLabel,
  FormFieldHelperText, Input } from "@salt-ds/core";

<FormField validationStatus="error" necessity="required">
  <FormFieldLabel>Email Address</FormFieldLabel>
  <Input defaultValue="invalid" />
  <FormFieldHelperText>Please enter a valid email</FormFieldHelperText>
</FormField>`,
    html: `<div class="saltFormField saltFormField-error">
  <label class="saltFormFieldLabel">Email</label>
  <input class="saltInput" />
  <span class="saltFormFieldHelperText">Error message</span>
</div>`,
  },
  "list-box": {
    react: `import { ListBox, Option } from "@salt-ds/core";

<ListBox>
  <Option value="1">Apple</Option>
  <Option value="2">Banana</Option>
  <Option value="3" disabled>Cherry</Option>
</ListBox>`,
    html: `<div class="saltListBox" role="listbox">
  <div role="option" aria-selected="true">Apple</div>
  <div role="option">Banana</div>
</div>`,
  },
  "multiline-input": {
    react: `import { MultilineInput, FormField, FormFieldLabel } from "@salt-ds/core";

<FormField>
  <FormFieldLabel>Description</FormFieldLabel>
  <MultilineInput
    rows={4}
    placeholder="Enter description..."
    bordered
  />
</FormField>`,
    html: `<textarea class="saltMultilineInput" rows="4"
  placeholder="Enter description..."></textarea>`,
  },
  "number-input": {
    react: `import { Input } from "@salt-ds/core";

// Salt uses Input with type="number" + stepper buttons
<FormField>
  <FormFieldLabel>Quantity</FormFieldLabel>
  <Input type="number" defaultValue={1} min={0} max={99} step={1} />
</FormField>`,
    html: `<input class="saltInput" type="number"
  min="0" max="99" step="1" value="1" />`,
  },
  "nav-item": {
    react: `import { NavigationItem } from "@salt-ds/core";

<NavigationItem href="/dashboard" active>
  Dashboard
</NavigationItem>
<NavigationItem href="/settings">
  Settings
</NavigationItem>`,
    html: `<a class="saltNavigationItem saltNavigationItem-active"
  href="/dashboard">Dashboard</a>`,
  },
  "vert-nav": {
    react: `import { VerticalNavigation, VerticalNavigationItem,
  VerticalNavigationGroup } from "@salt-ds/core";

<VerticalNavigation>
  <VerticalNavigationItem href="/" active>Home</VerticalNavigationItem>
  <VerticalNavigationGroup label="Settings">
    <VerticalNavigationItem href="/profile">Profile</VerticalNavigationItem>
    <VerticalNavigationItem href="/security">Security</VerticalNavigationItem>
  </VerticalNavigationGroup>
</VerticalNavigation>`,
    html: `<nav class="saltVerticalNavigation">
  <a class="saltVerticalNavigationItem active" href="/">Home</a>
  <div class="saltVerticalNavigationGroup">
    <span>Settings</span>
    <a href="/profile">Profile</a>
  </div>
</nav>`,
  },
  "toggle-btn": {
    react: `import { ToggleButton, ToggleButtonGroup } from "@salt-ds/core";

<ToggleButtonGroup>
  <ToggleButton value="bold">Bold</ToggleButton>
  <ToggleButton value="italic">Italic</ToggleButton>
  <ToggleButton value="underline">Underline</ToggleButton>
</ToggleButtonGroup>`,
    html: `<div class="saltToggleButtonGroup" role="group">
  <button class="saltToggleButton" aria-pressed="true">Bold</button>
  <button class="saltToggleButton">Italic</button>
</div>`,
  },
  "segmented-btn": {
    react: `import { SegmentedButtonGroup, Button } from "@salt-ds/core";

<SegmentedButtonGroup>
  <Button>Day</Button>
  <Button>Week</Button>
  <Button>Month</Button>
</SegmentedButtonGroup>`,
    html: `<div class="saltSegmentedButtonGroup" role="group">
  <button class="saltButton saltButton-solid">Day</button>
  <button class="saltButton saltButton-bordered">Week</button>
  <button class="saltButton saltButton-bordered">Month</button>
</div>`,
  },
  "skip-link": {
    react: `import { SkipLink } from "@salt-ds/core";

<SkipLink targetId="main-content">
  Skip to main content
</SkipLink>`,
    html: `<a class="saltSkipLink" href="#main-content">
  Skip to main content
</a>`,
  },
  carousel: {
    react: `import { Carousel, CarouselSlide } from "@salt-ds/core";

<Carousel>
  <CarouselSlide>Slide 1 content</CarouselSlide>
  <CarouselSlide>Slide 2 content</CarouselSlide>
  <CarouselSlide>Slide 3 content</CarouselSlide>
</Carousel>`,
    html: `<div class="saltCarousel" role="region" aria-label="Carousel">
  <div class="saltCarouselSlide">Slide 1</div>
</div>`,
  },
  "interactable-card": {
    react: `import { InteractableCard } from "@salt-ds/core";

<InteractableCard onClick={handleClick} selected={isSelected}>
  <h3>Card Title</h3>
  <p>Click to select this card.</p>
</InteractableCard>`,
    html: `<div class="saltInteractableCard" role="button" tabindex="0">
  <h3>Card Title</h3>
  <p>Clickable card</p>
</div>`,
  },
  collapsible: {
    react: `import { Collapsible } from "@salt-ds/core";

<Collapsible open={isOpen}>
  <p>Collapsible content here.</p>
</Collapsible>`,
    html: `<div class="saltCollapsible" aria-expanded="true">
  <p>Content</p>
</div>`,
  },
  splitter: {
    react: `import { Splitter, SplitterPanel } from "@salt-ds/core";

<Splitter orientation="horizontal">
  <SplitterPanel>Left pane</SplitterPanel>
  <SplitterPanel>Right pane</SplitterPanel>
</Splitter>`,
    html: `<div class="saltSplitter">
  <div class="saltSplitterPanel">Left</div>
  <div class="saltSplitter-handle" role="separator"></div>
  <div class="saltSplitterPanel">Right</div>
</div>`,
  },
  "static-list": {
    react: `import { StaticList, StaticListItem } from "@salt-ds/core";

<StaticList>
  <StaticListItem>Item 1</StaticListItem>
  <StaticListItem>Item 2</StaticListItem>
  <StaticListItem>Item 3</StaticListItem>
</StaticList>`,
    html: `<ul class="saltStaticList">
  <li class="saltStaticListItem">Item 1</li>
  <li class="saltStaticListItem">Item 2</li>
</ul>`,
  },
};
