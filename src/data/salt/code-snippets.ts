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

// Salt DS themed chart - uses CSS variable bridge
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
  "ag-grid": {
    react: `import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

// Salt DS themed AG Grid
const saltTheme = themeQuartz.withParams({
  accentColor: "var(--salt-palette-accent)",
  backgroundColor: "var(--salt-container-primary-background)",
  foregroundColor: "var(--salt-content-primary-foreground)",
  headerBackgroundColor: "var(--salt-container-secondary-background)",
  headerTextColor: "var(--salt-content-secondary-foreground)",
  borderColor: "var(--salt-separable-borderColor)",
  fontFamily: "Open Sans, sans-serif",
  fontSize: 12,
  spacing: 6,
  borderRadius: 4,
});

<div style={{ height: 400 }}>
  <AgGridReact
    theme={saltTheme}
    rowData={data}
    columnDefs={columnDefs}
    rowSelection="multiple"
    pagination
  />
</div>`,
    html: `<!-- AG Grid + Salt DS Theme -->
<script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script>
<div id="grid" style="height: 400px"></div>

<script>
const grid = agGrid.createGrid(document.getElementById('grid'), {
  theme: agGrid.themeQuartz.withParams({
    accentColor: '#1B7F9E',
    backgroundColor: '#101820',
    foregroundColor: '#E2E4E5',
    borderColor: '#3C4850'
  }),
  rowData: [...],
  columnDefs: [...]
});
</script>`,
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
  "dl-color": {
    react: `// Salt DS color tokens - 3-layer architecture
const colors = {
  accent: "var(--salt-palette-accent)",
  neutral: "var(--salt-palette-neutral)",
  positive: "var(--salt-palette-positive)",
  caution: "var(--salt-palette-caution)",
  negative: "var(--salt-palette-negative)",
  bg: "var(--salt-container-primary-background)",
  fg: "var(--salt-content-primary-foreground)",
};

<div style={{ background: colors.bg, color: colors.fg }}>
  Salt DS themed content
</div>`,
    html: `<style>
  .salt-card {
    background: var(--salt-container-primary-background);
    color: var(--salt-content-primary-foreground);
    border: 1px solid var(--salt-separable-primary-borderColor);
  }
  .salt-accent { color: var(--salt-palette-accent); }
</style>`,
  },
  "dl-typography": {
    react: `// Salt type scale - Open Sans + Amplitude. Density-responsive.
const typeScale = {
  display1: { size: 32, weight: 300, lineHeight: 1.3 },
  display2: { size: 24, weight: 300, lineHeight: 1.3 },
  h1: { size: 20, weight: 600, lineHeight: 1.3 },
  h2: { size: 16, weight: 600, lineHeight: 1.3 },
  h3: { size: 14, weight: 600, lineHeight: 1.3 },
  action: { size: 13, weight: 600, lineHeight: 1.3 },
  body: { size: 13, weight: 400, lineHeight: 1.3 },
  label: { size: 12, weight: 400, lineHeight: 1.3 },
  help: { size: 11, weight: 400, lineHeight: 1.3 },
};

import { Text, H1, Display1 } from "@salt-ds/core";
<Display1>Display</Display1>
<H1>Heading</H1>
<Text>Body text at 13px</Text>`,
    html: `<h1 style="font: var(--salt-text-h1-font); color: var(--salt-content-primary-foreground);">Heading</h1>
<p style="font: var(--salt-text-font);">Body copy</p>`,
  },
  "dl-spacing": {
    react: `// Salt spacing - 4px base grid, density-responsive
// Scale: 25 (1px), 50 (2px), 100 (4px), 150 (6px), 200 (8px),
// 300 (12px), 400 (16px), 500 (20px), 600 (24px)
<div style={{
  padding: "var(--salt-spacing-300)",
  gap: "var(--salt-spacing-200)",
}}>
  Content with 12px padding and 8px gaps
</div>`,
    html: `<style>
  .spaced {
    padding: var(--salt-spacing-300);
    gap: var(--salt-spacing-200);
    margin-bottom: var(--salt-spacing-100);
  }
</style>`,
  },
  "dl-elevation": {
    react: `// Salt elevation - 4 shadow levels
<div style={{ boxShadow: "var(--salt-overlayable-shadow-100)" }}>
  Low elevation (subtle card)
</div>
<div style={{ boxShadow: "var(--salt-overlayable-shadow-200)" }}>
  Medium elevation (dropdown)
</div>
<div style={{ boxShadow: "var(--salt-overlayable-shadow-400)" }}>
  High elevation (modal, popover)
</div>`,
    html: `<div class="salt-card" style="box-shadow: var(--salt-overlayable-shadow-200);">
  Elevation 200 (overlay)
</div>`,
  },
  "dl-tokens": {
    react: `// Salt 3-layer token architecture:
// 1. Foundation: --salt-color-teal-500 (raw)
// 2. Palette: --salt-palette-accent (mode-aware)
// 3. Characteristic: --salt-actionable-bold-background (semantic)

// Always prefer characteristic tokens - they cascade correctly
// across light/dark and density changes.
<button style={{
  background: "var(--salt-actionable-bold-background)",
  color: "var(--salt-actionable-bold-foreground)",
  height: "var(--salt-size-base)",
  padding: "0 var(--salt-spacing-100)",
}}>
  Tokenized button
</button>`,
    html: `<style>
  button {
    background: var(--salt-actionable-bold-background);
    color: var(--salt-actionable-bold-foreground);
    height: var(--salt-size-base);
  }
</style>`,
  },
  "dl-a11y": {
    react: `// Salt a11y baseline - WCAG 2.1 AA
// - 4.5:1 text contrast, 3:1 for large text / UI components
// - Focus ring: 2px solid accent, 2px offset
// - Touch targets: 44px (Touch density), 28px (Medium)
// - ARIA labels on icon-only buttons

<Button aria-label="Close dialog" onClick={onClose}>
  <CloseIcon />
</Button>

// Skip link for keyboard users
<a href="#main" className="skip-link">Skip to main content</a>`,
    html: `<button aria-label="Close dialog" class="saltButton">
  <span class="material-symbols-outlined">close</span>
</button>
<a href="#main" class="salt-skip-link">Skip to main content</a>`,
  },
  "dl-density": {
    react: `// Salt density - 4 levels, all on 4px scaling grid
import { SaltProvider } from "@salt-ds/core";

// High (20px base), Medium (28px default), Low (36px), Touch (44px)
<SaltProvider density="medium" mode="light">
  <App />
</SaltProvider>

// All tokens scale proportionally:
// --salt-size-base, --salt-spacing-100, --salt-text-fontSize`,
    html: `<!-- Scope density via data attribute -->
<div data-mode="light" data-density="medium">
  <!-- All Salt components inside inherit this density -->
</div>`,
  },
  "dl-content": {
    react: `// Salt content design - simple, direct, human
// - Present tense, active voice
// - Sentence case for labels, headings
// - Say what it does, not how
// - Error messages: explain the problem + how to fix

// Good: "Save changes"        Bad: "Please click to save"
// Good: "Email is required"   Bad: "Error: empty field"
// Good: "3 items selected"    Bad: "You have selected 3 items"

<Button>Save changes</Button>
<FormFieldHelperText validationStatus="error">
  Email is required
</FormFieldHelperText>`,
    html: `<label class="saltFormLabel">Full name</label>
<span class="saltFormHelperText">Shown on your profile</span>`,
  },
  "dl-icons": {
    react: `// Salt icons - ~430 SVG icons, 2 styles (Default outline, Solid filled)
import { SearchIcon, CloseIcon, AddSolidIcon } from "@salt-ds/icons";

// Size multiplier: 1 = base, 2 = large
<SearchIcon size={1} />
<CloseIcon size={2} />
<AddSolidIcon />

// Icon-only button - always add aria-label
<Button aria-label="Search" variant="secondary">
  <SearchIcon />
</Button>`,
    html: `<!-- Salt icons ship as React SVG components; for static HTML use inline SVG or Material Symbols -->
<span class="material-symbols-outlined">search</span>`,
  },
  tokens: {
    react: `// Salt token reference - discover tokens via theme-next.css
// Group ordering: foundation -> palette -> characteristic.
// Check contrast ratios at each layer before shipping.

// Inspect at runtime
const bg = getComputedStyle(document.documentElement)
  .getPropertyValue("--salt-container-primary-background");
console.log("Theme background:", bg);`,
    html: `<!-- Drop this in a dev build to visualise every token -->
<script>
  const styles = getComputedStyle(document.documentElement);
  const vars = Array.from(document.styleSheets)
    .flatMap(s => [...s.cssRules])
    .flatMap(r => [...r.style || []])
    .filter(n => n.startsWith("--salt-"));
  console.table(vars.map(n => ({ token: n, value: styles.getPropertyValue(n) })));
</script>`,
  },
  audit: {
    react: `// Salt design audit checklist
// Run this on any PR touching UI:

const auditChecks = {
  rawHex: /#[0-9a-f]{3,8}/i,         // Never commit raw hex
  rawPx: /: (\d+)px(?![a-z-])/i,    // Use spacing tokens, not raw px
  wrongAppearance: /appearance=["']filled|outlined|text["']/,
  // Salt uses: solid | bordered | transparent (NOT Material variants)
};

// CI snippet - grep sources for violations:
// grep -rE '#[0-9a-f]{6}|[: ](\d+)px|appearance="filled"' src/`,
    html: `<!-- Audit reference: Salt DS common violations -->
<!-- BAD  --><div style="color: #1B7F9E; padding: 12px;">...</div>
<!-- GOOD --><div style="color: var(--salt-palette-accent); padding: var(--salt-spacing-300);">...</div>`,
  },
  "pat-app-shell": {
    react: `// App shell pattern - header + sidebar + main + footer
function AppShell({ children }) {
  return (
    <div className="shell">
      <header className="shell-header">
        <Logo />
        <GlobalSearch />
        <UserMenu />
      </header>
      <aside className="shell-sidebar">
        <nav>
          <NavItem icon={<HomeIcon />}>Home</NavItem>
          <NavItem icon={<ChartIcon />}>Analytics</NavItem>
          <NavItem icon={<SettingsIcon />}>Settings</NavItem>
        </nav>
      </aside>
      <main className="shell-main">{children}</main>
      <footer className="shell-footer">© 2026 Acme</footer>
    </div>
  );
}`,
    html: `<!-- App shell: Header + sidebar + main + footer shell. Wraps your app with consistent chrome. -->
<section class="pattern-app-shell">
  <h2>App shell</h2>
  <p>Header + sidebar + main + footer shell. Wraps your app with consistent chrome.</p>
</section>`,
  },
  "pat-dashboard": {
    react: `// Analytics Dashboard - full zone layout (matches Builder "Analytics Dashboard")
import { Card, H1, H4, Text, Button, StackLayout, FlexLayout } from "@salt-ds/core";

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
        <H4>Acme Analytics</H4>
        <span className="status-pill">Live</span>
      </header>

      {/* Sidebar */}
      <aside className="shell-sidebar">
        <nav>
          <a className="nav-item active">Overview</a>
          <a className="nav-item">Events</a>
          <a className="nav-item">Users</a>
          <a className="nav-item">Funnels</a>
          <a className="nav-item">Settings</a>
        </nav>
      </aside>

      {/* Body */}
      <main className="shell-body">
        <FlexLayout gap={2}>
          {kpis.map((k) => (
            <Card key={k.label} variant="secondary" style={{ flex: 1 }}>
              <Text styleAs="label">{k.label}</Text>
              <H1>{k.value}</H1>
              <Text color={k.pct >= 0 ? "positive" : "negative"}>
                {k.pct >= 0 ? "+" : ""}{k.pct}%
              </Text>
            </Card>
          ))}
        </FlexLayout>

        <Card variant="secondary">
          <H4>Revenue - last 30 days</H4>
          <AreaChart data={revenue} />
        </Card>

        <Card variant="secondary">
          <DataGrid rowData={activityRows} columns={activityCols} />
        </Card>

        <FlexLayout gap={2}>
          <Card variant="secondary" style={{ flex: 2 }}>
            <H4>Daily events</H4>
            <ColumnChart data={daily} />
          </Card>
          <Card variant="secondary" style={{ flex: 1 }}>
            <Text>Monthly plan usage</Text>
            <progress value={64} max={100} />
          </Card>
        </FlexLayout>
      </main>

      {/* Footer */}
      <footer className="shell-footer">
        <Text>Last updated 2 min ago</Text>
        <Text>v2.4</Text>
      </footer>
    </div>
  );
}`,
    html: `<!-- Analytics Dashboard - zone-based layout with KPI row, revenue chart, data table, and activity feed -->
<div class="app-shell">
  <header class="shell-header">
    <span class="brand">Acme Analytics</span>
    <span class="status-pill">Live</span>
  </header>

  <aside class="shell-sidebar">
    <a class="nav-item is-active">Overview</a>
    <a class="nav-item">Events</a>
    <a class="nav-item">Users</a>
    <a class="nav-item">Funnels</a>
    <a class="nav-item">Settings</a>
  </aside>

  <main class="shell-body">
    <!-- KPI row (3 cards) -->
    <section class="grid-3">
      <article class="saltCard"><small>MRR</small><h1>$48,200</h1><span class="pos">+12%</span></article>
      <article class="saltCard"><small>Active users</small><h1>12,847</h1><span class="pos">+8%</span></article>
      <article class="saltCard"><small>Churn rate</small><h1>2.1%</h1><span class="neg">-3%</span></article>
    </section>

    <!-- Revenue chart (full width) -->
    <article class="saltCard chart">Revenue - last 30 days</article>

    <!-- Data table -->
    <article class="saltCard datagrid">Activity feed</article>

    <!-- Secondary row: 2/3 chart + 1/3 progress -->
    <section class="grid-2-1">
      <article class="saltCard chart">Daily events</article>
      <article class="saltCard"><small>Monthly plan usage</small><progress value="64" max="100"></progress></article>
    </section>
  </main>

  <footer class="shell-footer">Last updated 2 min ago - v2.4</footer>
</div>

<style>
  .app-shell {
    display: grid;
    grid-template-columns: 240px 1fr;
    grid-template-rows: 56px 1fr 40px;
    grid-template-areas: "header header" "sidebar body" "footer footer";
    min-height: 100vh;
    background: var(--salt-container-primary-background);
    font-family: var(--salt-typography-fontFamily);
  }
  .shell-header { grid-area: header; display: flex; align-items: center; justify-content: space-between; padding: 0 var(--salt-spacing-200); border-bottom: 1px solid var(--salt-separable-tertiary-borderColor); }
  .shell-sidebar { grid-area: sidebar; padding: var(--salt-spacing-200); border-right: 1px solid var(--salt-separable-tertiary-borderColor); }
  .shell-body { grid-area: body; padding: var(--salt-spacing-300); display: grid; gap: var(--salt-spacing-200); }
  .shell-footer { grid-area: footer; display: flex; align-items: center; padding: 0 var(--salt-spacing-200); border-top: 1px solid var(--salt-separable-tertiary-borderColor); }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--salt-spacing-200); }
  .grid-2-1 { display: grid; grid-template-columns: 2fr 1fr; gap: var(--salt-spacing-200); }
  .nav-item { display: block; padding: var(--salt-spacing-100) var(--salt-spacing-150); border-radius: var(--salt-curve-100); color: var(--salt-content-primary-foreground); text-decoration: none; }
  .nav-item.is-active { background: var(--salt-actionable-secondary-background-hover); }
</style>`,
  },
  "pat-data-table": {
    react: `// CRM Contacts / Data Table Page - full zone layout (matches Builder "CRM Contacts")
import { Input, Dropdown, Button, Card, H1, Text, FlexLayout } from "@salt-ds/core";
import { DataGrid } from "@salt-ds/data-grid";
import { SearchIcon } from "@salt-ds/icons";

function CRMContacts() {
  return (
    <div className="app-shell">
      <header className="shell-header">
        <span className="brand">Contacts</span>
        <span className="status-pill">247 records</span>
      </header>

      <aside className="shell-sidebar">
        <nav>
          <a className="nav-item is-active">All Contacts</a>
          <a className="nav-item">Companies</a>
          <a className="nav-item">Deals</a>
          <a className="nav-item">Activities</a>
          <a className="nav-item">Reports</a>
        </nav>
      </aside>

      <main className="shell-body">
        {/* Search + filter row */}
        <FlexLayout gap={2}>
          <Input
            placeholder="Search by name, company, email..."
            startAdornment={<SearchIcon />}
            style={{ flex: 2 }}
          />
          <Dropdown source={["All statuses", "Active", "Pending", "Archived"]} style={{ flex: 1 }} />
        </FlexLayout>

        {/* Main data table */}
        <Card variant="secondary">
          <DataGrid rowData={contacts} columns={contactCols} />
        </Card>

        {/* Pipeline KPIs */}
        <FlexLayout gap={2}>
          {[
            { label: "New this week", value: "24", pct: 12 },
            { label: "Active leads", value: "89", pct: 5 },
            { label: "Deals closed (MTD)", value: "$12.4K", pct: 18 },
          ].map((k) => (
            <Card key={k.label} variant="secondary" style={{ flex: 1 }}>
              <Text styleAs="label">{k.label}</Text>
              <H1>{k.value}</H1>
              <Text color="positive">+{k.pct}%</Text>
            </Card>
          ))}
        </FlexLayout>
      </main>

      <footer className="shell-footer">
        <Text>Showing 247 of 1,247 contacts - v3.2</Text>
      </footer>
    </div>
  );
}`,
    html: `<!-- CRM Contacts / Data Table Page - search, filters, rich data table, pipeline stats -->
<div class="app-shell">
  <header class="shell-header">
    <span class="brand">Contacts</span>
    <span class="status-pill">247 records</span>
  </header>

  <aside class="shell-sidebar">
    <a class="nav-item is-active">All Contacts</a>
    <a class="nav-item">Companies</a>
    <a class="nav-item">Deals</a>
    <a class="nav-item">Activities</a>
    <a class="nav-item">Reports</a>
  </aside>

  <main class="shell-body">
    <!-- Search + filter row -->
    <section class="grid-2-1">
      <input class="saltInput" type="search" placeholder="Search by name, company, email..." />
      <select class="saltDropdown">
        <option>All statuses</option>
        <option>Active</option>
        <option>Pending</option>
      </select>
    </section>

    <!-- Data table -->
    <article class="saltCard datagrid">Contacts table</article>

    <!-- Pipeline KPIs -->
    <section class="grid-3">
      <article class="saltCard"><small>New this week</small><h1>24</h1><span class="pos">+12%</span></article>
      <article class="saltCard"><small>Active leads</small><h1>89</h1><span class="pos">+5%</span></article>
      <article class="saltCard"><small>Deals closed (MTD)</small><h1>$12.4K</h1><span class="pos">+18%</span></article>
    </section>
  </main>

  <footer class="shell-footer">Showing 247 of 1,247 contacts - v3.2</footer>
</div>`,
  },
  "pat-form": {
    react: `// Multi-section form pattern
import { H2, FormField, FormFieldLabel, Input, Switch, Button } from "@salt-ds/core";

function ContactForm() {
  return (
    <form>
      <H2>Contact details</H2>
      <FormField><FormFieldLabel>Name</FormFieldLabel><Input /></FormField>
      <FormField><FormFieldLabel>Email</FormFieldLabel><Input type="email" /></FormField>

      <H2>Preferences</H2>
      <Switch label="Subscribe to newsletter" />

      <footer>
        <Button>Cancel</Button>
        <Button sentiment="accented" appearance="solid">Save</Button>
      </footer>
    </form>
  );
}`,
    html: `<!-- Form: Grouped sections with inputs, validation, and a save bar. -->
<section class="pattern-form">
  <h2>Form</h2>
  <p>Grouped sections with inputs, validation, and a save bar.</p>
</section>`,
  },
  "pat-list-detail": {
    react: `// Master/detail list pattern
import { StaticList, StaticListItem } from "@salt-ds/lab";

function ListDetail() {
  const [selected, setSelected] = useState(items[0]);
  return (
    <div className="split">
      <aside>
        <StaticList>
          {items.map(i => (
            <StaticListItem key={i.id} onClick={() => setSelected(i)}>
              {i.name}
            </StaticListItem>
          ))}
        </StaticList>
      </aside>
      <main>{selected && <DetailPane item={selected} />}</main>
    </div>
  );
}`,
    html: `<!-- List + detail: Master list on the left, detail pane on the right. Standard CRM/email layout. -->
<section class="pattern-list-detail">
  <h2>List + detail</h2>
  <p>Master list on the left, detail pane on the right. Standard CRM/email layout.</p>
</section>`,
  },
  "pat-login": {
    react: `// Login / Auth - full auth flow (matches Builder "Login -> Dashboard")
import { Card, Button, Input, FormField, FormFieldLabel, Checkbox, H1, H4, Text, Link, Banner, BannerContent, StackLayout } from "@salt-ds/core";

function Login() {
  return (
    <div className="auth-shell">
      <header className="auth-header">
        <span className="brand">Acme</span>
        <span className="status-pill">Secure</span>
      </header>

      <main className="auth-body">
        <Card variant="secondary" className="auth-card">
          <StackLayout gap={2}>
            <H1>Sign in to Acme</H1>
            <H4>Welcome back - enter your details to continue.</H4>

            <FormField>
              <FormFieldLabel>Work email</FormFieldLabel>
              <Input placeholder="you@company.com" />
            </FormField>

            <FormField>
              <FormFieldLabel>Password</FormFieldLabel>
              <Input type="password" placeholder="Enter your password" />
            </FormField>

            <div className="auth-row">
              <Checkbox label="Keep me signed in for 30 days" />
              <Link href="/forgot">Forgot password?</Link>
            </div>

            <Button sentiment="accented" appearance="solid">Sign in</Button>

            <Button appearance="bordered">Continue with Google</Button>
            <Button appearance="bordered">Continue with GitHub</Button>

            <Banner status="info">
              <BannerContent>
                After sign-in you land on the dashboard.
              </BannerContent>
            </Banner>
          </StackLayout>
        </Card>
      </main>

      <footer className="auth-footer">
        <Text>(c) 2026 Acme, Inc. - Privacy - Terms</Text>
      </footer>
    </div>
  );
}`,
    html: `<!-- Login / Auth - auth card with email + password + OAuth + remember-me -->
<div class="auth-shell">
  <header class="auth-header">
    <span class="brand">Acme</span>
    <span class="status-pill">Secure</span>
  </header>

  <main class="auth-body">
    <form class="saltCard auth-card">
      <h1>Sign in to Acme</h1>
      <p class="muted">Welcome back - enter your details to continue.</p>

      <label class="form-field">
        <span>Work email</span>
        <input class="saltInput" type="email" placeholder="you@company.com" />
      </label>

      <label class="form-field">
        <span>Password</span>
        <input class="saltInput" type="password" placeholder="Enter your password" />
      </label>

      <div class="auth-row">
        <label><input type="checkbox" /> Keep me signed in for 30 days</label>
        <a href="/forgot">Forgot password?</a>
      </div>

      <button class="saltButton saltButton-accented saltButton-solid" type="submit">Sign in</button>
      <button class="saltButton saltButton-bordered" type="button">Continue with Google</button>
      <button class="saltButton saltButton-bordered" type="button">Continue with GitHub</button>

      <div class="saltBanner saltBanner-info">
        After sign-in you land on the dashboard.
      </div>
    </form>
  </main>

  <footer class="auth-footer">(c) 2026 Acme, Inc. - Privacy - Terms</footer>
</div>

<style>
  .auth-shell {
    display: grid;
    grid-template-rows: 56px 1fr 40px;
    min-height: 100vh;
    background: var(--salt-container-primary-background);
  }
  .auth-header, .auth-footer { display: flex; align-items: center; justify-content: space-between; padding: 0 var(--salt-spacing-200); }
  .auth-header { border-bottom: 1px solid var(--salt-separable-tertiary-borderColor); }
  .auth-footer { border-top: 1px solid var(--salt-separable-tertiary-borderColor); }
  .auth-body { display: grid; place-items: center; padding: var(--salt-spacing-400); }
  .auth-card { width: 100%; max-width: 420px; display: grid; gap: var(--salt-spacing-200); padding: var(--salt-spacing-300); }
  .auth-row { display: flex; align-items: center; justify-content: space-between; }
</style>`,
  },
  "pat-search": {
    react: `// Search page pattern
import { Input, Pill, Spinner } from "@salt-ds/core";

function SearchPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState([]);
  return (
    <>
      <Input placeholder="Search" value={query} onChange={e => setQuery(e.target.value)} />
      <div className="filters">
        {FILTERS.map(f => (
          <Pill key={f} selected={filters.includes(f)} onClick={() => toggle(f)}>{f}</Pill>
        ))}
      </div>
      {loading ? <Spinner /> : <ResultsList results={results} />}
    </>
  );
}`,
    html: `<!-- Search: Search input + filter chips + result list with empty / loading states. -->
<section class="pattern-search">
  <h2>Search</h2>
  <p>Search input + filter chips + result list with empty / loading states.</p>
</section>`,
  },
  "pat-settings": {
    react: `// Settings Page - full zone layout (matches Builder "Settings Page")
import { Card, H2, Button, Switch, Input, FormField, FormFieldLabel, Avatar, Banner, BannerContent, Divider, Text, StackLayout } from "@salt-ds/core";

function SettingsPage() {
  return (
    <div className="app-shell">
      <header className="shell-header">
        <span className="brand">Workspace</span>
        <span className="status-pill">Saved</span>
      </header>

      <aside className="shell-sidebar">
        <nav>
          <a className="nav-item is-active">Profile</a>
          <a className="nav-item">Notifications</a>
          <a className="nav-item">Security</a>
          <a className="nav-item">Workspace</a>
          <a className="nav-item">Billing</a>
        </nav>
      </aside>

      <main className="shell-body">
        <StackLayout gap={3}>
          {/* Profile section */}
          <section>
            <H2>Profile</H2>
            <div className="avatar-row">
              <Avatar size={2} name="Sarah Chen" />
              <Button appearance="bordered">Change photo</Button>
            </div>
            <FormField>
              <FormFieldLabel>Full name</FormFieldLabel>
              <Input placeholder="Sarah Chen" />
            </FormField>
            <FormField>
              <FormFieldLabel>Work email</FormFieldLabel>
              <Input placeholder="sarah@acme.co" />
            </FormField>
          </section>

          {/* Preferences section */}
          <section>
            <H2>Preferences</H2>
            <Switch label="Email notifications" defaultChecked />
            <Switch label="Weekly digest email" />
            <Switch label="Product updates & marketing" />
          </section>

          <Divider />

          {/* Danger zone */}
          <section>
            <H2>Danger zone</H2>
            <Banner status="error">
              <BannerContent>
                <Text styleAs="h4">Delete account</Text>
                <Text>This permanently removes your workspace and cannot be undone.</Text>
              </BannerContent>
            </Banner>
            <Button sentiment="negative" appearance="transparent">Delete account</Button>
          </section>
        </StackLayout>
      </main>

      <footer className="shell-footer">
        <Text>Changes save automatically - v1.0</Text>
      </footer>
    </div>
  );
}`,
    html: `<!-- Settings Page - grouped sections with toggles, inputs, and a danger zone -->
<div class="app-shell">
  <header class="shell-header">
    <span class="brand">Workspace</span>
    <span class="status-pill">Saved</span>
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
        <div class="saltAvatar saltAvatar-lg">SC</div>
        <button class="saltButton saltButton-bordered">Change photo</button>
      </div>
      <label class="form-field"><span>Full name</span><input class="saltInput" placeholder="Sarah Chen" /></label>
      <label class="form-field"><span>Work email</span><input class="saltInput" placeholder="sarah@acme.co" /></label>
    </section>

    <section class="settings-group">
      <h2>Preferences</h2>
      <label class="switch-row"><input type="checkbox" role="switch" checked /> Email notifications</label>
      <label class="switch-row"><input type="checkbox" role="switch" /> Weekly digest email</label>
      <label class="switch-row"><input type="checkbox" role="switch" /> Product updates & marketing</label>
    </section>

    <hr class="saltDivider" />

    <section class="settings-group">
      <h2>Danger zone</h2>
      <div class="saltBanner saltBanner-error">
        <strong>Delete account</strong>
        <p>This permanently removes your workspace and cannot be undone.</p>
      </div>
      <button class="saltButton saltButton-negative saltButton-transparent">Delete account</button>
    </section>
  </main>

  <footer class="shell-footer">Changes save automatically - v1.0</footer>
</div>`,
  },
  "pat-wizard": {
    react: `// Multi-step wizard pattern
import { StepperInput, Button } from "@salt-ds/core";

function Wizard() {
  const [step, setStep] = useState(0);
  return (
    <>
      <progress value={step} max={steps.length} />
      <h2>{steps[step].title}</h2>
      {steps[step].component}
      <footer>
        <Button onClick={() => setStep(s => s - 1)} disabled={step === 0}>Back</Button>
        <Button sentiment="accented" onClick={() => setStep(s => s + 1)}>Next</Button>
      </footer>
    </>
  );
}`,
    html: `<!-- Wizard: Multi-step flow with progress indicator + back/next controls. -->
<section class="pattern-wizard">
  <h2>Wizard</h2>
  <p>Multi-step flow with progress indicator + back/next controls.</p>
</section>`,
  },
};
