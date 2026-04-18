import type { CodeSnippets } from "../salt/types";

export const M3_CODE: CodeSnippets = {
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

// Material 3 themed chart - uses M3 color tokens
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
  "bottom-sheets": {
    react: `import { BottomSheet } from "@mui/material";

<BottomSheet open={isOpen} onDismiss={() => setIsOpen(false)}>
  <div style={{ padding: 24 }}>
    <h3>Bottom Sheet</h3>
    <p>Drag the handle to resize or dismiss.</p>
  </div>
</BottomSheet>`,
    html: `<div class="mdc-bottom-sheet" role="dialog">
  <div class="mdc-bottom-sheet__drag-handle"></div>
  <div class="mdc-bottom-sheet__content">Content</div>
</div>`,
  },
  "date-pickers": {
    react: `import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

<LocalizationProvider dateAdapter={AdapterDayjs}>
  <DatePicker
    label="Select date"
    value={value}
    onChange={(newValue) => setValue(newValue)}
  />
</LocalizationProvider>`,
    html: `<div class="mdc-date-picker">
  <input type="date" class="mdc-text-field__input" />
</div>`,
  },
  fabs: {
    react: `import { Fab } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

// Sizes: small, medium, large
<Fab color="primary" aria-label="add">
  <AddIcon />
</Fab>
<Fab variant="extended" color="primary">
  <AddIcon sx={{ mr: 1 }} />
  Create
</Fab>`,
    html: `<button class="mdc-fab" aria-label="Add">
  <span class="material-symbols-outlined">add</span>
</button>`,
  },
  "icon-buttons": {
    react: `import { IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

// Variants: standard, outlined, filled, filled-tonal
<IconButton aria-label="delete">
  <DeleteIcon />
</IconButton>
<IconButton color="primary" aria-label="settings">
  <SettingsIcon />
</IconButton>`,
    html: `<button class="mdc-icon-button" aria-label="Delete">
  <span class="material-symbols-outlined">delete</span>
</button>`,
  },
  "nav-bar": {
    react: `import { BottomNavigation, BottomNavigationAction } from "@mui/material";

<BottomNavigation
  value={value}
  onChange={(_, newValue) => setValue(newValue)}
  showLabels
>
  <BottomNavigationAction label="Home" icon={<HomeIcon />} />
  <BottomNavigationAction label="Search" icon={<SearchIcon />} />
  <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
</BottomNavigation>`,
    html: `<nav class="mdc-bottom-navigation">
  <a class="mdc-bottom-navigation__action mdc-bottom-navigation__action--active">
    <span class="material-symbols-outlined">home</span>
    <span>Home</span>
  </a>
</nav>`,
  },
  snackbar: {
    react: `import { Snackbar, Alert } from "@mui/material";

<Snackbar
  open={open}
  autoHideDuration={4000}
  onClose={handleClose}
  anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
>
  <Alert severity="success" onClose={handleClose}>
    Changes saved successfully!
  </Alert>
</Snackbar>`,
    html: `<div class="mdc-snackbar mdc-snackbar--open">
  <div class="mdc-snackbar__surface">
    <div class="mdc-snackbar__label">Changes saved!</div>
    <div class="mdc-snackbar__actions">
      <button class="mdc-button">Undo</button>
    </div>
  </div>
</div>`,
  },
  "ag-grid": {
    react: `import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

// Material 3 themed AG Grid
const m3Theme = themeQuartz.withParams({
  accentColor: "var(--md-sys-color-primary)",
  backgroundColor: "var(--md-sys-color-surface)",
  foregroundColor: "var(--md-sys-color-on-surface)",
  headerBackgroundColor: "var(--md-sys-color-surface-container-low)",
  headerTextColor: "var(--md-sys-color-on-surface-variant)",
  borderColor: "var(--md-sys-color-outline-variant)",
  fontFamily: "Roboto, sans-serif",
  fontSize: 14,
  spacing: 8,
  borderRadius: 12,
});

<div style={{ height: 400 }}>
  <AgGridReact
    theme={m3Theme}
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
    accentColor: '#6750A4',
    backgroundColor: '#FFFBFE',
    foregroundColor: '#1C1B1F',
    borderColor: '#CAC4D0',
    borderRadius: 12
  }),
  rowData: [...],
  columnDefs: [...]
});
</script>`,
  },
  "text-fields": {
    react: `import { TextField } from "@mui/material";

// Variants: filled (default), outlined
<TextField label="Name" variant="filled" />
<TextField label="Email" variant="outlined" />
<TextField
  label="Password"
  type="password"
  error
  helperText="Required field"
/>`,
    html: `<div class="mdc-text-field mdc-text-field--filled">
  <input class="mdc-text-field__input" />
  <label class="mdc-floating-label">Name</label>
</div>`,
  },
  calendar: {
    react: `import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

<LocalizationProvider dateAdapter={AdapterDayjs}>
  <DateCalendar
    value={value}
    onChange={(newValue) => setValue(newValue)}
  />
</LocalizationProvider>`,
    html: `<div class="mdc-calendar" role="grid" aria-label="Month view">
  <table>
    <thead><tr><th>S</th><th>M</th><th>T</th></tr></thead>
    <tbody>
      <tr><td><button>1</button></td><td><button>2</button></td></tr>
    </tbody>
  </table>
</div>`,
  },
  carousel: {
    react: `import { Box, IconButton, MobileStepper } from "@mui/material";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";

<Box sx={{ position: "relative" }}>
  <Box sx={{ display: "flex", overflow: "hidden" }}>
    {items.map((item, i) => (
      <Box key={i} sx={{ minWidth: "100%" }}>{item}</Box>
    ))}
  </Box>
  <MobileStepper
    steps={items.length}
    activeStep={activeStep}
    nextButton={
      <IconButton onClick={handleNext}><KeyboardArrowRight /></IconButton>
    }
    backButton={
      <IconButton onClick={handleBack}><KeyboardArrowLeft /></IconButton>
    }
  />
</Box>`,
    html: `<div class="mdc-carousel" role="region" aria-label="Carousel">
  <div class="mdc-carousel__track">
    <div class="mdc-carousel__slide">Slide 1</div>
    <div class="mdc-carousel__slide">Slide 2</div>
  </div>
  <div class="mdc-carousel__dots">
    <span class="mdc-carousel__dot mdc-carousel__dot--active"></span>
    <span class="mdc-carousel__dot"></span>
  </div>
</div>`,
  },
  collapsible: {
    react: `import { Collapse, Button } from "@mui/material";

const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(!open)}>
  {open ? "Hide" : "Show"} Content
</Button>
<Collapse in={open}>
  <div>Collapsible content area.</div>
</Collapse>`,
    html: `<button aria-expanded="false" aria-controls="panel1">Toggle</button>
<div id="panel1" class="mdc-collapse" hidden>
  Collapsible content area.
</div>`,
  },
  "combo-box": {
    react: `import { Autocomplete, TextField } from "@mui/material";

<Autocomplete
  options={["Apple", "Banana", "Cherry"]}
  renderInput={(params) => (
    <TextField {...params} label="Fruit" variant="outlined" />
  )}
  onChange={(_, value) => setValue(value)}
/>`,
    html: `<div class="mdc-menu-surface--anchor">
  <input class="mdc-text-field__input" role="combobox"
    aria-autocomplete="list" aria-expanded="false" />
  <ul class="mdc-list" role="listbox">
    <li class="mdc-list-item" role="option">Apple</li>
  </ul>
</div>`,
  },
  "data-grid": {
    react: `import { DataGrid } from "@mui/x-data-grid";

const columns = [
  { field: "name", headerName: "Name", width: 180 },
  { field: "status", headerName: "Status", width: 120 },
];

<DataGrid
  rows={rows}
  columns={columns}
  pageSize={10}
  checkboxSelection
  sortingOrder={["asc", "desc"]}
/>`,
    html: `<table class="mdc-data-table__table" aria-label="Data grid">
  <thead>
    <tr><th sortable>Name</th><th sortable>Status</th></tr>
  </thead>
  <tbody>
    <tr><td>Jane Doe</td><td>Active</td></tr>
  </tbody>
</table>`,
  },
  "date-picker": {
    react: `import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

<LocalizationProvider dateAdapter={AdapterDayjs}>
  <DatePicker
    label="Select date"
    value={value}
    onChange={(newValue) => setValue(newValue)}
  />
</LocalizationProvider>`,
    html: `<div class="mdc-date-picker">
  <input type="date" class="mdc-text-field__input" />
</div>`,
  },
  "file-drop": {
    react: `import { Box, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

<Box
  onDrop={handleDrop}
  onDragOver={(e) => e.preventDefault()}
  sx={{
    border: "2px dashed",
    borderColor: "var(--md-sys-color-outline)",
    borderRadius: 3,
    p: 4,
    textAlign: "center",
  }}
>
  <CloudUploadIcon sx={{ fontSize: 48 }} />
  <Typography>Drag files here or click to upload</Typography>
</Box>`,
    html: `<div class="mdc-file-drop" role="button" tabindex="0"
  style="border: 2px dashed var(--md-sys-color-outline); padding: 32px; text-align: center;">
  <span class="material-symbols-outlined">cloud_upload</span>
  <p>Drag files here or click to upload</p>
</div>`,
  },
  "form-field": {
    react: `import { TextField, FormControl, FormHelperText } from "@mui/material";

<FormControl error={hasError} fullWidth>
  <TextField
    label="Email"
    variant="outlined"
    error={hasError}
  />
  <FormHelperText>
    {hasError ? "Invalid email address" : "We'll never share your email."}
  </FormHelperText>
</FormControl>`,
    html: `<div class="mdc-form-field">
  <div class="mdc-text-field mdc-text-field--outlined">
    <input class="mdc-text-field__input" />
    <label class="mdc-floating-label">Email</label>
  </div>
  <div class="mdc-text-field-helper-line">
    <p class="mdc-text-field-helper-text">Helper text</p>
  </div>
</div>`,
  },
  "interactable-card": {
    react: `import { Card, CardContent, CardActionArea } from "@mui/material";

<Card>
  <CardActionArea onClick={handleClick}>
    <CardContent>
      <h3>Clickable Card</h3>
      <p>Tap or click to interact. State layer on hover.</p>
    </CardContent>
  </CardActionArea>
</Card>`,
    html: `<div class="mdc-card mdc-card--interactive" tabindex="0" role="button">
  <div class="mdc-card__ripple"></div>
  <div class="mdc-card__content">Clickable Card</div>
</div>`,
  },
  link: {
    react: `import { Link, Typography } from "@mui/material";

<Typography>
  Visit the <Link href="/docs">documentation</Link> for details.
</Typography>
<Link href="/settings" underline="hover" color="primary">
  Settings
</Link>`,
    html: `<a class="mdc-link" href="/docs"
  style="color: var(--md-sys-color-primary); text-decoration: none;">
  Documentation
</a>`,
  },
  "list-box": {
    react: `import { List, ListItem, ListItemButton, ListItemText } from "@mui/material";

<List>
  {options.map((opt) => (
    <ListItem key={opt} disablePadding>
      <ListItemButton
        selected={selected === opt}
        onClick={() => setSelected(opt)}
      >
        <ListItemText primary={opt} />
      </ListItemButton>
    </ListItem>
  ))}
</List>`,
    html: `<ul class="mdc-list" role="listbox" aria-label="Options">
  <li class="mdc-list-item mdc-list-item--selected" role="option"
    aria-selected="true">Option A</li>
  <li class="mdc-list-item" role="option">Option B</li>
</ul>`,
  },
  "multiline-input": {
    react: `import { TextField } from "@mui/material";

<TextField
  label="Description"
  variant="outlined"
  multiline
  rows={4}
/>
<TextField
  label="Notes"
  variant="filled"
  multiline
  minRows={2}
  maxRows={6}
/>`,
    html: `<div class="mdc-text-field mdc-text-field--outlined mdc-text-field--textarea">
  <textarea class="mdc-text-field__input" rows="4"></textarea>
  <label class="mdc-floating-label">Description</label>
</div>`,
  },
  "nav-item": {
    react: `import { BottomNavigationAction } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";

// Active indicator pill - used inside BottomNavigation or NavigationRail
<BottomNavigationAction
  label="Home"
  icon={<HomeIcon />}
  showLabel
/>`,
    html: `<a class="mdc-navigation-item mdc-navigation-item--active" href="#">
  <span class="mdc-navigation-item__indicator"></span>
  <span class="material-symbols-outlined">home</span>
  <span class="mdc-navigation-item__label">Home</span>
</a>`,
  },
  "number-input": {
    react: `import { TextField, IconButton, Stack } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

<Stack direction="row" alignItems="center" spacing={1}>
  <IconButton onClick={() => setValue((v) => v - 1)}>
    <RemoveIcon />
  </IconButton>
  <TextField
    type="number"
    value={value}
    onChange={(e) => setValue(Number(e.target.value))}
    inputProps={{ min: 0, max: 100 }}
    sx={{ width: 80 }}
  />
  <IconButton onClick={() => setValue((v) => v + 1)}>
    <AddIcon />
  </IconButton>
</Stack>`,
    html: `<div class="mdc-number-input">
  <button class="mdc-icon-button" aria-label="Decrease">
    <span class="material-symbols-outlined">remove</span>
  </button>
  <input type="number" class="mdc-text-field__input" value="1" min="0" />
  <button class="mdc-icon-button" aria-label="Increase">
    <span class="material-symbols-outlined">add</span>
  </button>
</div>`,
  },
  overlay: {
    react: `import { Backdrop, CircularProgress } from "@mui/material";

<Backdrop
  open={open}
  onClick={handleClose}
  sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
>
  <CircularProgress color="inherit" />
</Backdrop>`,
    html: `<div class="mdc-dialog__scrim"
  style="position: fixed; inset: 0; background: rgba(0,0,0,0.32); z-index: 1000;">
</div>`,
  },
  panel: {
    react: `import { Paper, Typography, Box } from "@mui/material";

<Paper elevation={2} sx={{ p: 3 }}>
  <Typography variant="h6" gutterBottom>Panel Header</Typography>
  <Box>Panel body content.</Box>
</Paper>`,
    html: `<div class="mdc-card mdc-card--elevated" style="padding: 24px;">
  <h3>Panel Header</h3>
  <div>Panel body content.</div>
</div>`,
  },
  pills: {
    react: `import { Chip, Stack } from "@mui/material";

<Stack direction="row" spacing={1}>
  <Chip
    label="Featured"
    color="primary"
    variant={selected ? "filled" : "outlined"}
    onClick={() => setSelected(!selected)}
  />
  <Chip label="New" color="secondary" clickable />
  <Chip label="Sale" color="error" clickable />
</Stack>`,
    html: `<span class="mdc-chip mdc-chip--filter mdc-chip--selected">
  <span class="material-symbols-outlined">check</span>
  <span class="mdc-chip__text">Featured</span>
</span>
<span class="mdc-chip mdc-chip--filter">
  <span class="mdc-chip__text">New</span>
</span>`,
  },
  "segmented-btn": {
    react: `import { ToggleButtonGroup, ToggleButton } from "@mui/material";

<ToggleButtonGroup
  value={value}
  exclusive
  onChange={handleChange}
  aria-label="View mode"
>
  <ToggleButton value="day">Day</ToggleButton>
  <ToggleButton value="week">Week</ToggleButton>
  <ToggleButton value="month">Month</ToggleButton>
</ToggleButtonGroup>`,
    html: `<div class="mdc-segmented-button" role="group">
  <button class="mdc-segmented-button__segment mdc-segmented-button__segment--selected">
    Day
  </button>
  <button class="mdc-segmented-button__segment">Week</button>
  <button class="mdc-segmented-button__segment">Month</button>
</div>`,
  },
  "skip-link": {
    react: `import { Link } from "@mui/material";

{/* Visually hidden, appears on Tab focus - WCAG 2.4.1 */}
<Link
  href="#main-content"
  sx={{
    position: "absolute",
    left: "-9999px",
    "&:focus": { left: 16, top: 16, zIndex: 9999 },
  }}
>
  Skip to main content
</Link>`,
    html: `<a class="mdc-skip-link" href="#main-content"
  style="position: absolute; left: -9999px;">
  Skip to main content
</a>`,
  },
  splitter: {
    react: `import { Box } from "@mui/material";

{/* Drag handle to resize panes */}
<Box sx={{ display: "flex", height: 400 }}>
  <Box sx={{ flex: leftWidth, overflow: "auto" }}>Left pane</Box>
  <Box
    onMouseDown={handleDragStart}
    sx={{
      width: 8,
      cursor: "col-resize",
      bgcolor: "var(--md-sys-color-outline-variant)",
    }}
  />
  <Box sx={{ flex: 1, overflow: "auto" }}>Right pane</Box>
</Box>`,
    html: `<div style="display: flex; height: 400px;">
  <div style="flex: 1;">Left pane</div>
  <div role="separator" aria-orientation="vertical" tabindex="0"
    style="width: 8px; cursor: col-resize;
           background: var(--md-sys-color-outline-variant);">
  </div>
  <div style="flex: 1;">Right pane</div>
</div>`,
  },
  "static-list": {
    react: `import { List, ListItem, ListItemText, ListItemIcon } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";

<List>
  <ListItem>
    <ListItemIcon><StarIcon /></ListItemIcon>
    <ListItemText primary="Item 1" secondary="Description" />
  </ListItem>
  <ListItem>
    <ListItemIcon><StarIcon /></ListItemIcon>
    <ListItemText primary="Item 2" secondary="Description" />
  </ListItem>
</List>`,
    html: `<ul class="mdc-list" role="list">
  <li class="mdc-list-item">
    <span class="material-symbols-outlined">star</span>
    <span class="mdc-list-item__text">Item 1</span>
  </li>
</ul>`,
  },
  tag: {
    react: `import { Chip } from "@mui/material";

<Chip label="React" onDelete={handleDelete} />
<Chip label="TypeScript" onDelete={handleDelete} color="primary" />
<Chip label="M3" onDelete={handleDelete} variant="outlined" />`,
    html: `<span class="mdc-chip">
  <span class="mdc-chip__text">React</span>
  <button class="mdc-chip__icon mdc-chip__icon--trailing"
    aria-label="Remove">
    <span class="material-symbols-outlined">close</span>
  </button>
</span>`,
  },
  "toggle-btn": {
    react: `import { IconButton } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";

<IconButton
  color={toggled ? "primary" : "default"}
  onClick={() => setToggled(!toggled)}
  aria-pressed={toggled}
>
  {toggled ? <FavoriteIcon /> : <FavoriteBorderIcon />}
</IconButton>`,
    html: `<button class="mdc-icon-button mdc-icon-button--toggle"
  aria-pressed="false" aria-label="Favorite">
  <span class="material-symbols-outlined">favorite</span>
</button>`,
  },
  "vert-nav": {
    react: `import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText }
  from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import SettingsIcon from "@mui/icons-material/Settings";

{/* Navigation Rail - permanent side nav with icon + label */}
<Drawer variant="permanent" sx={{ width: 80 }}>
  <List>
    <ListItem disablePadding>
      <ListItemButton selected sx={{ flexDirection: "column" }}>
        <ListItemIcon><HomeIcon /></ListItemIcon>
        <ListItemText primary="Home" />
      </ListItemButton>
    </ListItem>
    <ListItem disablePadding>
      <ListItemButton sx={{ flexDirection: "column" }}>
        <ListItemIcon><SettingsIcon /></ListItemIcon>
        <ListItemText primary="Settings" />
      </ListItemButton>
    </ListItem>
  </List>
</Drawer>`,
    html: `<nav class="mdc-navigation-rail" aria-label="Main navigation">
  <a class="mdc-navigation-rail__item mdc-navigation-rail__item--active">
    <span class="mdc-navigation-rail__indicator"></span>
    <span class="material-symbols-outlined">home</span>
    <span>Home</span>
  </a>
  <a class="mdc-navigation-rail__item">
    <span class="material-symbols-outlined">settings</span>
    <span>Settings</span>
  </a>
</nav>`,
  },
  /* ── Foundation snippets ── */
  "dl-color": {
    react: `import { ThemeProvider, createTheme } from "@mui/material";

// HCT color space - dynamic color from source seed
const theme = createTheme({
  palette: {
    primary: { main: "#6750A4" },   // Source color
    secondary: { main: "#625B71" },
    tertiary: { main: "#7D5260" },
    error: { main: "#B3261E" },
  },
});

<ThemeProvider theme={theme}>
  <App />
</ThemeProvider>`,
    html: `<style>
:root {
  --md-sys-color-primary: #6750A4;
  --md-sys-color-on-primary: #FFFFFF;
  --md-sys-color-secondary: #625B71;
  --md-sys-color-tertiary: #7D5260;
  --md-sys-color-error: #B3261E;
  --md-sys-color-surface: #FFFBFE;
  --md-sys-color-on-surface: #1C1B1F;
}
</style>`,
  },
  "dl-typography": {
    react: `import { Typography } from "@mui/material";

{/* M3 type scale: Display, Headline, Title, Body, Label */}
<Typography variant="h1">Display Large</Typography>
<Typography variant="h4">Headline Medium</Typography>
<Typography variant="h6">Title Large</Typography>
<Typography variant="body1">Body Large</Typography>
<Typography variant="caption">Label Small</Typography>`,
    html: `<style>
:root {
  --md-sys-typescale-display-large: 400 57px/64px Roboto;
  --md-sys-typescale-headline-medium: 400 28px/36px Roboto;
  --md-sys-typescale-title-large: 400 22px/28px Roboto;
  --md-sys-typescale-body-large: 400 16px/24px Roboto;
  --md-sys-typescale-label-small: 500 11px/16px Roboto;
}
</style>
<h1 style="font: var(--md-sys-typescale-display-large)">Display</h1>`,
  },
  "dl-elevation": {
    react: `import { Paper } from "@mui/material";

{/* M3 uses tonal color elevation, not drop shadows */}
<Paper elevation={0}>Level 0 - Surface</Paper>
<Paper elevation={1}>Level 1 - Surface Container Low</Paper>
<Paper elevation={2}>Level 2 - Surface Container</Paper>
<Paper elevation={3}>Level 3 - Surface Container High</Paper>
<Paper elevation={4}>Level 4 - Surface Container Highest</Paper>`,
    html: `<style>
:root {
  --md-sys-color-surface: #FFFBFE;
  --md-sys-color-surface-container-low: #F7F2FA;
  --md-sys-color-surface-container: #F3EDF7;
  --md-sys-color-surface-container-high: #ECE6F0;
  --md-sys-color-surface-container-highest: #E6E0E9;
}
</style>
<div style="background: var(--md-sys-color-surface-container)">
  Level 2
</div>`,
  },
  "dl-spacing": {
    react: `import { Box, Stack } from "@mui/material";

{/* 4dp base grid. MUI spacing(n) = n * 8px */}
<Stack spacing={1}>{/* 8px gap */}
  <Box sx={{ p: 1 }}>8px padding</Box>
  <Box sx={{ p: 2 }}>16px padding</Box>
  <Box sx={{ p: 3 }}>24px padding</Box>
</Stack>`,
    html: `<style>
:root {
  /* 4dp base grid */
  --md-sys-spacing-xs: 4px;
  --md-sys-spacing-sm: 8px;
  --md-sys-spacing-md: 16px;
  --md-sys-spacing-lg: 24px;
  --md-sys-spacing-xl: 32px;
}
</style>
<div style="padding: var(--md-sys-spacing-md)">16px padding</div>`,
  },
  "dl-tokens": {
    react: `// M3 design tokens - CSS custom properties
// Color: --md-sys-color-primary, --md-sys-color-on-primary, etc.
// Type:  --md-sys-typescale-body-large, etc.
// Shape: --md-sys-shape-corner-medium (12px)

import { createTheme } from "@mui/material";

const theme = createTheme({
  cssVariables: true, // enables CSS variable output
});`,
    html: `<style>
:root {
  /* Color tokens */
  --md-sys-color-primary: #6750A4;
  --md-sys-color-on-primary: #FFFFFF;
  --md-sys-color-surface: #FFFBFE;

  /* Typescale tokens */
  --md-sys-typescale-body-large: 400 16px/24px Roboto;

  /* Shape tokens */
  --md-sys-shape-corner-small: 8px;
  --md-sys-shape-corner-medium: 12px;
  --md-sys-shape-corner-large: 16px;
}
</style>`,
  },
  "dl-density": {
    react: `import { Button, TextField, createTheme, ThemeProvider } from "@mui/material";

// Density offset: 0 (default), -1, -2, -3. Each step = -4dp.
const denseTheme = createTheme({
  components: {
    MuiButton: { defaultProps: { size: "small" } },
    MuiTextField: { defaultProps: { size: "small" } },
  },
});

<ThemeProvider theme={denseTheme}>
  <Button variant="contained">Dense Button</Button>
  <TextField label="Dense Field" />
</ThemeProvider>`,
    html: `<style>
/* Density scale: each step removes 4dp of height */
.density-0 { height: 48px; }  /* default */
.density-1 { height: 44px; }  /* -1 */
.density-2 { height: 40px; }  /* -2 */
.density-3 { height: 36px; }  /* -3 */
</style>
<button class="mdc-button density-2">Dense Button</button>`,
  },
  "dl-content": {
    react: `// Material writing guidelines: clear, concise, useful.
// - Use sentence case for titles and labels
// - Lead with the objective ("Save changes" not "Changes will be saved")
// - Error messages: say what happened + how to fix it

<DialogTitle>Delete this file?</DialogTitle>
<DialogContent>
  This action can't be undone. The file will be permanently removed.
</DialogContent>
<DialogActions>
  <Button>Cancel</Button>
  <Button variant="contained" color="error">Delete</Button>
</DialogActions>`,
    html: `<!-- Material content guidelines -->
<!-- Use sentence case: "Save changes" not "Save Changes" -->
<!-- Lead with action: "Delete file?" not "Are you sure?" -->
<!-- Error: what happened + fix: "No internet. Check your connection." -->

<div class="mdc-dialog__content">
  <p>This action can't be undone.</p>
</div>`,
  },
  "dl-a11y": {
    react: `// WCAG 2.1 AA - Material accessibility requirements:
// - 48dp minimum touch targets
// - 4.5:1 text contrast, 3:1 for large text
// - State layers provide visual feedback (hover 8%, focus 12%)
// - All interactive elements keyboard-accessible

<Button
  variant="contained"
  aria-label="Save document"
  sx={{ minHeight: 48 }}
>
  Save
</Button>
<IconButton aria-label="Close dialog">
  <CloseIcon />
</IconButton>`,
    html: `<!-- WCAG 2.1 AA checklist -->
<!-- Touch targets: min 48x48dp -->
<!-- Text contrast: 4.5:1 (normal), 3:1 (large) -->
<!-- Focus indicator: visible outline on :focus-visible -->

<button class="mdc-button" style="min-height: 48px;"
  aria-label="Save document">
  Save
</button>
<button class="mdc-icon-button" aria-label="Close">
  <span class="material-symbols-outlined">close</span>
</button>`,
  },
  a11y: {
    react: `// Material 3 a11y - builds on WCAG 2.1 AA
// - Dynamic color ensures contrast across tonal surfaces
// - State layers provide visible hover/focus/pressed feedback
// - Touch targets >= 48dp
// - Focus ring: 2px solid primary, 2px offset

<IconButton aria-label="Settings">
  <SettingsIcon />
</IconButton>

// Use MUI's built-in TransitionGroup for motion-reduce support`,
    html: `<button class="mdc-icon-button" aria-label="Settings" style="min-width: 48px; min-height: 48px;">
  <span class="material-symbols-outlined">settings</span>
</button>`,
  },
  "content-design": {
    react: `// M3 content design - warm, empowering, clear
// - Sentence case everywhere except proper nouns
// - Descriptive link text (not "click here")
// - Progressive disclosure in forms
// - Empty states explain what will appear

<Typography variant="body2" color="text.secondary">
  No tasks yet. Create one to get started.
</Typography>`,
    html: `<label class="mdc-text-field__label">Email address</label>
<p class="mdc-text-field__helper-line">We'll never share your email.</p>`,
  },
  dialogs: {
    react: `// Material 3 Dialog (full, basic, fullscreen)
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

<Dialog open={open} onClose={onClose}>
  <DialogTitle>Delete project?</DialogTitle>
  <DialogContent>
    This permanently removes all files. This cannot be undone.
  </DialogContent>
  <DialogActions>
    <Button onClick={onClose}>Cancel</Button>
    <Button variant="filled" color="error">Delete</Button>
  </DialogActions>
</Dialog>`,
    html: `<div class="mdc-dialog" role="alertdialog" aria-labelledby="title">
  <div class="mdc-dialog__surface">
    <h2 id="title" class="mdc-dialog__title">Delete project?</h2>
    <div class="mdc-dialog__content">This cannot be undone.</div>
    <div class="mdc-dialog__actions">
      <button class="mdc-button">Cancel</button>
      <button class="mdc-button mdc-button--filled">Delete</button>
    </div>
  </div>
</div>`,
  },
  "dl-icons": {
    react: `// Material Symbols - 2,500+ icons via variable font
// Styles: Outlined, Rounded, Sharp
// Fill (0 outline, 1 filled), Grade (-25..200), Opsz (20-48), Wght (100-700)

<span className="material-symbols-outlined">search</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>

// MUI icon component
import { Search } from "@mui/icons-material";
<Search />`,
    html: `<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
<span class="material-symbols-outlined">search</span>
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">favorite</span>`,
  },
  "guide-color-roles": {
    react: `// M3 color roles - semantic, not descriptive
// primary / onPrimary / primaryContainer / onPrimaryContainer
// secondary / tertiary / error / surface / onSurface

import { useTheme } from "@mui/material";

function MyCard() {
  const theme = useTheme();
  return (
    <Card sx={{
      bgcolor: "primaryContainer.main",
      color: "onPrimaryContainer.main",
    }}>
      Primary container surface
    </Card>
  );
}`,
    html: `<div style="background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container);">
  Primary container
</div>`,
  },
  "guide-mapping": {
    react: `// M3 role mapping - each UI surface gets a semantic pairing
// App bar     -> surface / onSurface
// FAB         -> primaryContainer / onPrimaryContainer
// Buttons     -> primary / onPrimary
// Errors      -> errorContainer / onErrorContainer

<AppBar sx={{ bgcolor: "surface.main", color: "onSurface.main" }} />
<Fab sx={{ bgcolor: "primaryContainer.main", color: "onPrimaryContainer.main" }} />`,
    html: `<header style="background: var(--md-sys-color-surface);">
  <h1 style="color: var(--md-sys-color-on-surface);">App</h1>
</header>`,
  },
  "guide-palette": {
    react: `// M3 tonal palette - 13 tones (0-100) per color role
// Generated from a source color via HCT color space

// Derive at build time
import { argbFromHex, themeFromSourceColor } from "@material/material-color-utilities";

const theme = themeFromSourceColor(argbFromHex("#6750A4"));
// theme.palettes.primary.tone(40) -> #6750A4 at tone 40`,
    html: `<!-- 13 tones generated from source colour -->
<style>
  :root {
    --md-ref-palette-primary0: #000000;
    --md-ref-palette-primary10: #21005D;
    --md-ref-palette-primary40: #6750A4;
    --md-ref-palette-primary100: #FFFFFF;
  }
</style>`,
  },
  "guide-state-layers": {
    react: `// M3 state layers - colour overlay on hover / focus / pressed
// Opacity: hover 8%, focus 12%, pressed 12%, dragged 16%

// MUI handles this automatically via component variants:
<Button variant="filled">Hover me</Button>

// Manual state layer
<div
  onMouseEnter={() => setHover(true)}
  style={{
    position: "relative",
    "--state-opacity": hover ? 0.08 : 0,
  }}
>
  <div className="state-layer" style={{
    position: "absolute", inset: 0,
    background: "currentColor",
    opacity: "var(--state-opacity)",
  }} />
  Content
</div>`,
    html: `<style>
  .mdc-button:hover::before { opacity: 0.08; }
  .mdc-button:focus::before { opacity: 0.12; }
  .mdc-button:active::before { opacity: 0.12; }
</style>`,
  },
  "guide-surfaces": {
    react: `// M3 surface elevation - 6 container levels
// surface (0dp) -> surfaceContainerLowest (1dp) ... -> surfaceContainerHighest (4dp)
// Each adds a tonal overlay (primary at 5-14% based on elevation)

<Card sx={{ bgcolor: "surface.main" }}>Lowest surface</Card>
<Card sx={{ bgcolor: "surfaceContainerLow.main" }}>Low</Card>
<Card sx={{ bgcolor: "surfaceContainer.main" }}>Default</Card>
<Card sx={{ bgcolor: "surfaceContainerHigh.main" }}>High</Card>`,
    html: `<div style="background: var(--md-sys-color-surface-container);">Default surface</div>`,
  },
  "guide-theming": {
    react: `// M3 theming - ThemeProvider + dynamic color

import { ThemeProvider, createTheme } from "@mui/material";
import { themeFromSourceColor, argbFromHex } from "@material/material-color-utilities";

const md3Theme = themeFromSourceColor(argbFromHex("#6750A4"));
const mui = createTheme({
  palette: {
    primary: { main: "#" + md3Theme.palettes.primary.tone(40).toString(16) },
  },
});

<ThemeProvider theme={mui}><App /></ThemeProvider>`,
    html: `<link rel="stylesheet" href="https://unpkg.com/@material-design/material-web/dist/styles.css" />
<div class="md-sys-theme-primary">Themed</div>`,
  },
  menus: {
    react: `// M3 Menu - dropdown from button or icon trigger
import { Menu, MenuItem, IconButton } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

function OverflowMenu() {
  const [anchor, setAnchor] = useState(null);
  return (
    <>
      <IconButton onClick={e => setAnchor(e.currentTarget)}>
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleDuplicate}>Duplicate</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
    </>
  );
}`,
    html: `<ul class="mdc-menu-surface" role="menu">
  <li class="mdc-list-item" role="menuitem"><span>Edit</span></li>
  <li class="mdc-list-item" role="menuitem"><span>Duplicate</span></li>
  <li class="mdc-list-item" role="menuitem"><span>Delete</span></li>
</ul>`,
  },
  sliders: {
    react: `// M3 Slider - continuous or discrete
import { Slider } from "@mui/material";

<Slider defaultValue={50} />
<Slider defaultValue={[20, 80]} />
<Slider step={10} marks min={0} max={100} valueLabelDisplay="auto" />`,
    html: `<div class="mdc-slider">
  <input type="range" class="mdc-slider__input" min="0" max="100" value="50" />
</div>`,
  },
  tokens: {
    react: `// M3 design tokens - 3 tiers
// Reference (md-ref-*)  - raw values (palettes, typescale)
// System (md-sys-*)     - semantic roles (color, motion, elevation)
// Component (md-comp-*) - component-specific tokens

// System tokens you'll use most:
const tokens = {
  bg: "var(--md-sys-color-background)",
  surface: "var(--md-sys-color-surface)",
  primary: "var(--md-sys-color-primary)",
  onPrimary: "var(--md-sys-color-on-primary)",
  radius: "var(--md-sys-shape-corner-medium)",
};`,
    html: `<div style="background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container);">
  M3 tokenised surface
</div>`,
  },
  audit: {
    react: `// M3 audit checklist
// - Colour role used (not raw hex)
// - Touch target >= 48dp
// - State layer visible on interactive elements
// - Typescale from md-sys-typescale-* (not arbitrary px)
// - Elevation uses tonal surface (not drop shadow in light mode)

// Automated check
const violations = document.querySelectorAll('[style*="#"]:not([style*="var(--md"])');
console.warn(\`\${violations.length} hardcoded colour violations\`, violations);`,
    html: `<!-- BAD  --><button style="background: #6750A4;">Click</button>
<!-- GOOD --><button style="background: var(--md-sys-color-primary);">Click</button>`,
  },
  "pat-app-shell": {
    react: `// App shell pattern
import { Stack } from "@mui/material";

function AppShell() {
  return <Stack>{/* App shell */}</Stack>;
}`,
    html: `<!-- App shell: Header + sidebar + main + footer shell. Wraps your app with consistent chrome. -->
<section class="pattern-app-shell">
  <h2>App shell</h2>
  <p>Header + sidebar + main + footer shell. Wraps your app with consistent chrome.</p>
</section>`,
  },
  "pat-dashboard": {
    react: `// Analytics Dashboard - full zone layout (matches Builder "Analytics Dashboard")
import { AppBar, Toolbar, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
         Card, CardContent, Typography, Stack, LinearProgress, Chip } from "@mui/material";
import { Home, BarChart, Person, Storage, Settings } from "@mui/icons-material";

function AnalyticsDashboard() {
  const kpis = [
    { label: "MRR", value: "$48,200", pct: 12 },
    { label: "Active users", value: "12,847", pct: 8 },
    { label: "Churn rate", value: "2.1%", pct: -3 },
  ];

  return (
    <Stack sx={{ minHeight: "100vh", bgcolor: "surface.main" }}>
      <AppBar position="static" color="surface" elevation={0}>
        <Toolbar>
          <Typography variant="titleLarge" sx={{ flex: 1 }}>Acme Analytics</Typography>
          <Chip label="Live" color="primary" size="small" />
        </Toolbar>
      </AppBar>

      <Stack direction="row" sx={{ flex: 1 }}>
        <Drawer variant="permanent" PaperProps={{ sx: { width: 240, position: "relative" } }}>
          <List>
            <ListItemButton selected><ListItemIcon><Home /></ListItemIcon><ListItemText primary="Overview" /></ListItemButton>
            <ListItemButton><ListItemIcon><BarChart /></ListItemIcon><ListItemText primary="Events" /></ListItemButton>
            <ListItemButton><ListItemIcon><Person /></ListItemIcon><ListItemText primary="Users" /></ListItemButton>
            <ListItemButton><ListItemIcon><Storage /></ListItemIcon><ListItemText primary="Funnels" /></ListItemButton>
            <ListItemButton><ListItemIcon><Settings /></ListItemIcon><ListItemText primary="Settings" /></ListItemButton>
          </List>
        </Drawer>

        <Stack spacing={2} sx={{ flex: 1, p: 3 }}>
          {/* KPI row */}
          <Stack direction="row" spacing={2}>
            {kpis.map((k) => (
              <Card key={k.label} variant="filled" sx={{ flex: 1 }}>
                <CardContent>
                  <Typography variant="labelMedium">{k.label}</Typography>
                  <Typography variant="displaySmall">{k.value}</Typography>
                  <Typography color={k.pct >= 0 ? "primary" : "error"}>
                    {k.pct >= 0 ? "+" : ""}{k.pct}%
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>

          <Card variant="filled">
            <CardContent>
              <Typography variant="titleMedium">Revenue - last 30 days</Typography>
              <AreaChart data={revenue} />
            </CardContent>
          </Card>

          <Card variant="filled">
            <CardContent>
              <DataGrid rows={activityRows} columns={activityCols} />
            </CardContent>
          </Card>

          <Stack direction="row" spacing={2}>
            <Card variant="filled" sx={{ flex: 2 }}>
              <CardContent><Typography>Daily events</Typography><ColumnChart /></CardContent>
            </Card>
            <Card variant="filled" sx={{ flex: 1 }}>
              <CardContent>
                <Typography>Monthly plan usage</Typography>
                <LinearProgress variant="determinate" value={64} />
              </CardContent>
            </Card>
          </Stack>
        </Stack>
      </Stack>

      <Stack direction="row" sx={{ p: 1, borderTop: 1, borderColor: "outlineVariant.main" }}>
        <Typography variant="bodySmall">Last updated 2 min ago - v2.4</Typography>
      </Stack>
    </Stack>
  );
}`,
    html: `<!-- Analytics Dashboard - zone-based layout with KPI row, revenue chart, data table -->
<div class="app-shell">
  <header class="m3-top-app-bar">
    <span class="m3-headline">Acme Analytics</span>
    <span class="m3-chip m3-chip-assist">Live</span>
  </header>

  <aside class="m3-nav-drawer">
    <a class="m3-nav-item m3-nav-active"><span class="material-symbols-outlined">home</span> Overview</a>
    <a class="m3-nav-item"><span class="material-symbols-outlined">bar_chart</span> Events</a>
    <a class="m3-nav-item"><span class="material-symbols-outlined">person</span> Users</a>
    <a class="m3-nav-item"><span class="material-symbols-outlined">database</span> Funnels</a>
    <a class="m3-nav-item"><span class="material-symbols-outlined">settings</span> Settings</a>
  </aside>

  <main class="shell-body">
    <section class="grid-3">
      <article class="m3-card"><small>MRR</small><h1>$48,200</h1><span class="pos">+12%</span></article>
      <article class="m3-card"><small>Active users</small><h1>12,847</h1><span class="pos">+8%</span></article>
      <article class="m3-card"><small>Churn rate</small><h1>2.1%</h1><span class="neg">-3%</span></article>
    </section>

    <article class="m3-card chart">Revenue - last 30 days</article>
    <article class="m3-card datagrid">Activity table</article>

    <section class="grid-2-1">
      <article class="m3-card chart">Daily events</article>
      <article class="m3-card"><small>Monthly plan usage</small><progress value="64" max="100"></progress></article>
    </section>
  </main>

  <footer class="shell-footer">Last updated 2 min ago - v2.4</footer>
</div>`,
  },
  "pat-data-table": {
    react: `// CRM Contacts / Data Table Page - full zone layout (matches Builder "CRM Contacts")
import { AppBar, Toolbar, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
         Card, CardContent, TextField, MenuItem, Stack, Typography, Chip, InputAdornment } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Search, Person, Storage, BarChart, Chat, Home } from "@mui/icons-material";

function CRMContacts() {
  return (
    <Stack sx={{ minHeight: "100vh" }}>
      <AppBar position="static" color="surface" elevation={0}>
        <Toolbar>
          <Typography variant="titleLarge" sx={{ flex: 1 }}>Contacts</Typography>
          <Chip label="247 records" size="small" />
        </Toolbar>
      </AppBar>

      <Stack direction="row" sx={{ flex: 1 }}>
        <Drawer variant="permanent" PaperProps={{ sx: { width: 240, position: "relative" } }}>
          <List>
            <ListItemButton selected><ListItemIcon><Person /></ListItemIcon><ListItemText primary="All Contacts" /></ListItemButton>
            <ListItemButton><ListItemIcon><Storage /></ListItemIcon><ListItemText primary="Companies" /></ListItemButton>
            <ListItemButton><ListItemIcon><BarChart /></ListItemIcon><ListItemText primary="Deals" /></ListItemButton>
            <ListItemButton><ListItemIcon><Chat /></ListItemIcon><ListItemText primary="Activities" /></ListItemButton>
            <ListItemButton><ListItemIcon><Home /></ListItemIcon><ListItemText primary="Reports" /></ListItemButton>
          </List>
        </Drawer>

        <Stack spacing={2} sx={{ flex: 1, p: 3 }}>
          {/* Search + filter row */}
          <Stack direction="row" spacing={2}>
            <TextField
              placeholder="Search by name, company, email..."
              sx={{ flex: 2 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            />
            <TextField select defaultValue="all" sx={{ flex: 1 }}>
              <MenuItem value="all">All statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </TextField>
          </Stack>

          {/* Main data table */}
          <Card variant="filled">
            <DataGrid rows={contacts} columns={contactCols} autoHeight />
          </Card>

          {/* Pipeline KPIs */}
          <Stack direction="row" spacing={2}>
            {[
              { label: "New this week", value: "24", pct: 12 },
              { label: "Active leads", value: "89", pct: 5 },
              { label: "Deals closed (MTD)", value: "$12.4K", pct: 18 },
            ].map((k) => (
              <Card key={k.label} variant="filled" sx={{ flex: 1 }}>
                <CardContent>
                  <Typography variant="labelMedium">{k.label}</Typography>
                  <Typography variant="displaySmall">{k.value}</Typography>
                  <Typography color="primary">+{k.pct}%</Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
}`,
    html: `<!-- CRM Contacts / Data Table Page - search, filters, rich data table, pipeline stats -->
<div class="app-shell">
  <header class="m3-top-app-bar">
    <span class="m3-headline">Contacts</span>
    <span class="m3-chip m3-chip-assist">247 records</span>
  </header>

  <aside class="m3-nav-drawer">
    <a class="m3-nav-item m3-nav-active"><span class="material-symbols-outlined">person</span> All Contacts</a>
    <a class="m3-nav-item"><span class="material-symbols-outlined">database</span> Companies</a>
    <a class="m3-nav-item"><span class="material-symbols-outlined">bar_chart</span> Deals</a>
    <a class="m3-nav-item"><span class="material-symbols-outlined">chat</span> Activities</a>
    <a class="m3-nav-item"><span class="material-symbols-outlined">home</span> Reports</a>
  </aside>

  <main class="shell-body">
    <section class="grid-2-1">
      <div class="m3-text-field m3-filled">
        <span class="material-symbols-outlined">search</span>
        <input type="search" placeholder="Search by name, company, email..." />
      </div>
      <div class="m3-text-field m3-filled">
        <select><option>All statuses</option><option>Active</option><option>Pending</option></select>
      </div>
    </section>

    <article class="m3-card datagrid">Contacts table</article>

    <section class="grid-3">
      <article class="m3-card"><small>New this week</small><h1>24</h1><span class="pos">+12%</span></article>
      <article class="m3-card"><small>Active leads</small><h1>89</h1><span class="pos">+5%</span></article>
      <article class="m3-card"><small>Deals closed (MTD)</small><h1>$12.4K</h1><span class="pos">+18%</span></article>
    </section>
  </main>

  <footer class="shell-footer">Showing 247 of 1,247 contacts - v3.2</footer>
</div>`,
  },
  "pat-form": {
    react: `// Form pattern
import { Stack } from "@mui/material";

function Form() {
  return <Stack>{/* Form */}</Stack>;
}`,
    html: `<!-- Form: Grouped sections with inputs, validation, and a save bar. -->
<section class="pattern-form">
  <h2>Form</h2>
  <p>Grouped sections with inputs, validation, and a save bar.</p>
</section>`,
  },
  "pat-list-detail": {
    react: `// List + detail pattern
import { Stack } from "@mui/material";

function ListDetail() {
  return <Stack>{/* List + detail */}</Stack>;
}`,
    html: `<!-- List + detail: Master list on the left, detail pane on the right. Standard CRM/email layout. -->
<section class="pattern-list-detail">
  <h2>List + detail</h2>
  <p>Master list on the left, detail pane on the right. Standard CRM/email layout.</p>
</section>`,
  },
  "pat-login": {
    react: `// Login / Auth - full auth flow (matches Builder "Login -> Dashboard")
import { AppBar, Toolbar, Card, CardContent, TextField, Button, Checkbox, FormControlLabel,
         Stack, Typography, Link, Chip, Alert, AlertTitle } from "@mui/material";

function Login() {
  return (
    <Stack sx={{ minHeight: "100vh" }}>
      <AppBar position="static" color="surface" elevation={0}>
        <Toolbar>
          <Typography variant="titleLarge" sx={{ flex: 1 }}>Acme</Typography>
          <Chip label="Secure" size="small" color="primary" />
        </Toolbar>
      </AppBar>

      <Stack sx={{ flex: 1, alignItems: "center", justifyContent: "center", p: 4 }}>
        <Card variant="filled" sx={{ width: "100%", maxWidth: 420 }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="headlineMedium">Sign in to Acme</Typography>
              <Typography variant="bodyMedium" color="onSurfaceVariant">
                Welcome back - enter your details to continue.
              </Typography>

              <TextField variant="filled" label="Work email" type="email" placeholder="you@company.com" />
              <TextField variant="filled" label="Password" type="password" placeholder="Enter your password" />

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <FormControlLabel control={<Checkbox />} label="Keep me signed in for 30 days" />
                <Link href="/forgot">Forgot password?</Link>
              </Stack>

              <Button variant="filled" size="large">Sign in</Button>
              <Button variant="outlined">Continue with Google</Button>
              <Button variant="outlined">Continue with GitHub</Button>

              <Alert severity="info">
                <AlertTitle>After sign-in</AlertTitle>
                You land on the dashboard.
              </Alert>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Stack direction="row" sx={{ p: 1, borderTop: 1, borderColor: "outlineVariant.main" }}>
        <Typography variant="bodySmall">(c) 2026 Acme, Inc. - Privacy - Terms</Typography>
      </Stack>
    </Stack>
  );
}`,
    html: `<!-- Login / Auth - auth card with email + password + OAuth + remember-me -->
<div class="auth-shell">
  <header class="m3-top-app-bar">
    <span class="m3-headline">Acme</span>
    <span class="m3-chip m3-chip-assist">Secure</span>
  </header>

  <main class="auth-body">
    <form class="m3-card auth-card">
      <h1 class="m3-headline-medium">Sign in to Acme</h1>
      <p class="m3-body-medium">Welcome back - enter your details to continue.</p>

      <label class="m3-text-field m3-filled">
        <span>Work email</span>
        <input type="email" placeholder="you@company.com" />
      </label>
      <label class="m3-text-field m3-filled">
        <span>Password</span>
        <input type="password" placeholder="Enter your password" />
      </label>

      <div class="auth-row">
        <label><input type="checkbox" /> Keep me signed in for 30 days</label>
        <a href="/forgot">Forgot password?</a>
      </div>

      <button class="m3-btn m3-btn-filled" type="submit">Sign in</button>
      <button class="m3-btn m3-btn-outlined" type="button">Continue with Google</button>
      <button class="m3-btn m3-btn-outlined" type="button">Continue with GitHub</button>

      <div class="m3-alert m3-alert-info">
        <strong>After sign-in</strong>
        <p>You land on the dashboard.</p>
      </div>
    </form>
  </main>

  <footer class="shell-footer">(c) 2026 Acme, Inc. - Privacy - Terms</footer>
</div>`,
  },
  "pat-search": {
    react: `// Search pattern
import { Stack } from "@mui/material";

function Search() {
  return <Stack>{/* Search */}</Stack>;
}`,
    html: `<!-- Search: Search input + filter chips + result list with empty / loading states. -->
<section class="pattern-search">
  <h2>Search</h2>
  <p>Search input + filter chips + result list with empty / loading states.</p>
</section>`,
  },
  "pat-settings": {
    react: `// Settings Page - full zone layout (matches Builder "Settings Page")
import { AppBar, Toolbar, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
         Card, CardContent, TextField, Switch, FormControlLabel, Button, Avatar,
         Alert, AlertTitle, Divider, Stack, Typography, Chip } from "@mui/material";
import { Person, Notifications, Settings, Storage, Home } from "@mui/icons-material";

function SettingsPage() {
  return (
    <Stack sx={{ minHeight: "100vh" }}>
      <AppBar position="static" color="surface" elevation={0}>
        <Toolbar>
          <Typography variant="titleLarge" sx={{ flex: 1 }}>Workspace</Typography>
          <Chip label="Saved" size="small" color="primary" />
        </Toolbar>
      </AppBar>

      <Stack direction="row" sx={{ flex: 1 }}>
        <Drawer variant="permanent" PaperProps={{ sx: { width: 240, position: "relative" } }}>
          <List>
            <ListItemButton selected><ListItemIcon><Person /></ListItemIcon><ListItemText primary="Profile" /></ListItemButton>
            <ListItemButton><ListItemIcon><Notifications /></ListItemIcon><ListItemText primary="Notifications" /></ListItemButton>
            <ListItemButton><ListItemIcon><Settings /></ListItemIcon><ListItemText primary="Security" /></ListItemButton>
            <ListItemButton><ListItemIcon><Storage /></ListItemIcon><ListItemText primary="Workspace" /></ListItemButton>
            <ListItemButton><ListItemIcon><Home /></ListItemIcon><ListItemText primary="Billing" /></ListItemButton>
          </List>
        </Drawer>

        <Stack spacing={3} sx={{ flex: 1, p: 3 }}>
          {/* Profile section */}
          <section>
            <Typography variant="titleLarge" gutterBottom>Profile</Typography>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Avatar sx={{ width: 56, height: 56 }}>SC</Avatar>
              <Button variant="outlined">Change photo</Button>
            </Stack>
            <Stack spacing={2}>
              <TextField variant="filled" label="Full name" placeholder="Sarah Chen" />
              <TextField variant="filled" label="Work email" placeholder="sarah@acme.co" />
            </Stack>
          </section>

          {/* Preferences section */}
          <section>
            <Typography variant="titleLarge" gutterBottom>Preferences</Typography>
            <Stack>
              <FormControlLabel control={<Switch defaultChecked />} label="Email notifications" />
              <FormControlLabel control={<Switch />} label="Weekly digest email" />
              <FormControlLabel control={<Switch />} label="Product updates & marketing" />
            </Stack>
          </section>

          <Divider />

          {/* Danger zone */}
          <section>
            <Typography variant="titleLarge" gutterBottom>Danger zone</Typography>
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Delete account</AlertTitle>
              This permanently removes your workspace and cannot be undone.
            </Alert>
            <Button variant="text" color="error">Delete account</Button>
          </section>
        </Stack>
      </Stack>

      <Stack direction="row" sx={{ p: 1, borderTop: 1, borderColor: "outlineVariant.main" }}>
        <Typography variant="bodySmall">Changes save automatically - v1.0</Typography>
      </Stack>
    </Stack>
  );
}`,
    html: `<!-- Settings Page - grouped sections with toggles, inputs, and a danger zone -->
<div class="app-shell">
  <header class="m3-top-app-bar">
    <span class="m3-headline">Workspace</span>
    <span class="m3-chip m3-chip-assist">Saved</span>
  </header>

  <aside class="m3-nav-drawer">
    <a class="m3-nav-item m3-nav-active"><span class="material-symbols-outlined">person</span> Profile</a>
    <a class="m3-nav-item"><span class="material-symbols-outlined">notifications</span> Notifications</a>
    <a class="m3-nav-item"><span class="material-symbols-outlined">settings</span> Security</a>
    <a class="m3-nav-item"><span class="material-symbols-outlined">database</span> Workspace</a>
    <a class="m3-nav-item"><span class="material-symbols-outlined">home</span> Billing</a>
  </aside>

  <main class="shell-body">
    <section class="settings-group">
      <h2 class="m3-title-large">Profile</h2>
      <div class="avatar-row">
        <div class="m3-avatar m3-avatar-lg">SC</div>
        <button class="m3-btn m3-btn-outlined">Change photo</button>
      </div>
      <label class="m3-text-field m3-filled"><span>Full name</span><input placeholder="Sarah Chen" /></label>
      <label class="m3-text-field m3-filled"><span>Work email</span><input placeholder="sarah@acme.co" /></label>
    </section>

    <section class="settings-group">
      <h2 class="m3-title-large">Preferences</h2>
      <label class="switch-row"><input type="checkbox" role="switch" checked /> Email notifications</label>
      <label class="switch-row"><input type="checkbox" role="switch" /> Weekly digest email</label>
      <label class="switch-row"><input type="checkbox" role="switch" /> Product updates & marketing</label>
    </section>

    <hr class="m3-divider" />

    <section class="settings-group">
      <h2 class="m3-title-large">Danger zone</h2>
      <div class="m3-alert m3-alert-error">
        <strong>Delete account</strong>
        <p>This permanently removes your workspace and cannot be undone.</p>
      </div>
      <button class="m3-btn m3-btn-text m3-btn-error">Delete account</button>
    </section>
  </main>

  <footer class="shell-footer">Changes save automatically - v1.0</footer>
</div>`,
  },
  "pat-wizard": {
    react: `// Wizard pattern
import { Stack } from "@mui/material";

function Wizard() {
  return <Stack>{/* Wizard */}</Stack>;
}`,
    html: `<!-- Wizard: Multi-step flow with progress indicator + back/next controls. -->
<section class="pattern-wizard">
  <h2>Wizard</h2>
  <p>Multi-step flow with progress indicator + back/next controls.</p>
</section>`,
  },
  "pat-feed": {
    react: `// M3 feed pattern - infinite scroll card list
import { List, ListItem, Card, Avatar } from "@mui/material";
import InfiniteScroll from "react-infinite-scroll-component";

function Feed({ posts, loadMore, hasMore }) {
  return (
    <InfiniteScroll dataLength={posts.length} next={loadMore} hasMore={hasMore}>
      <List>
        {posts.map(p => (
          <Card key={p.id} sx={{ mb: 2 }}>
            <Stack direction="row" spacing={2}>
              <Avatar src={p.author.avatar} />
              <div>
                <Typography variant="subtitle2">{p.author.name}</Typography>
                <Typography>{p.content}</Typography>
              </div>
            </Stack>
          </Card>
        ))}
      </List>
    </InfiniteScroll>
  );
}`,
    html: `<!-- Feed: Scrollable card list with posts, comments, and infinite scroll. -->
<section class="pattern-feed">
  <h2>Feed</h2>
  <p>Scrollable card list with posts, comments, and infinite scroll.</p>
</section>`,
  },
};
