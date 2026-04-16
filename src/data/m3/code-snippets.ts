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

// Active indicator pill — used inside BottomNavigation or NavigationRail
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

{/* Visually hidden, appears on Tab focus — WCAG 2.4.1 */}
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

{/* Navigation Rail — permanent side nav with icon + label */}
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

// HCT color space — dynamic color from source seed
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
<Paper elevation={0}>Level 0 — Surface</Paper>
<Paper elevation={1}>Level 1 — Surface Container Low</Paper>
<Paper elevation={2}>Level 2 — Surface Container</Paper>
<Paper elevation={3}>Level 3 — Surface Container High</Paper>
<Paper elevation={4}>Level 4 — Surface Container Highest</Paper>`,
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
    react: `// M3 design tokens — CSS custom properties
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
    react: `// WCAG 2.1 AA — Material accessibility requirements:
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
};
