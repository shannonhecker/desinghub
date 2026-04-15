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
};
