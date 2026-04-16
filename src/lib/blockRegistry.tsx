"use client";

import React from "react";
import { useBuilder } from "@/store/useBuilder";

/* ═══════════════════════════════════════════════════════════
   Block Registry — schema-driven single source of truth.
   Each block type declares its fields as data. A generic
   SchemaFields component renders them — no hand-written
   field components needed.
   ═══════════════════════════════════════════════════════════ */

/* ── Shared inspector field wrapper ── */
function InspectorField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="inspector-field">
      <label className="inspector-field-label">{label}</label>
      {children}
    </div>
  );
}

/* ── Generic hook: read block + updater (searches all zones) ── */
type ZoneId = 'body' | 'header' | 'sidebar' | 'footer';
const ZONE_KEYS = ['blocks', 'headerBlocks', 'sidebarBlocks', 'footerBlocks'] as const;
const ZONE_IDS: ZoneId[] = ['body', 'header', 'sidebar', 'footer'];

function useBlockProps(blockId: string) {
  const block = useBuilder((s) => {
    for (const key of ZONE_KEYS) {
      const found = s[key].find((b) => b.id === blockId);
      if (found) return found;
    }
    return null;
  });
  const updateZoneBlockProps = useBuilder((s) => s.updateZoneBlockProps);
  const zone: ZoneId = useBuilder((s) => {
    for (let i = 0; i < ZONE_KEYS.length; i++) {
      if (s[ZONE_KEYS[i]].some((b) => b.id === blockId)) return ZONE_IDS[i];
    }
    return 'body';
  });
  return {
    props: block?.props ?? {},
    set: (patch: Record<string, unknown>) => updateZoneBlockProps(zone, blockId, patch),
  };
}

/* ═══════════════════════════════════════════════════════════
   Field Schema — declarative field definitions
   ═══════════════════════════════════════════════════════════ */

type FieldDef =
  | { type: "text"; propKey: string; label: string; placeholder?: string }
  | { type: "textarea"; propKey: string; label: string; rows?: number }
  | { type: "select"; propKey: string; label: string; options: { value: string; label: string }[] }
  | { type: "toggle"; propKey: string; label: string }
  | { type: "range"; propKey: string; label: string; min?: number; max?: number; suffix?: string }
  | { type: "static"; text: string };

/* ── Generic SchemaFields renderer ── */
function SchemaFields({ blockId, fields }: { blockId: string; fields: FieldDef[] }) {
  const { props, set } = useBlockProps(blockId);
  return (
    <div>
      {fields.map((f, i) => {
        switch (f.type) {
          case "text":
            return (
              <InspectorField key={i} label={f.label}>
                <input className="inspector-input" type="text" value={(props[f.propKey] as string) ?? ""} placeholder={f.placeholder}
                  onChange={(e) => set({ [f.propKey]: e.target.value })} />
              </InspectorField>
            );
          case "textarea":
            return (
              <InspectorField key={i} label={f.label}>
                <textarea className="inspector-input" rows={f.rows ?? 3} value={(props[f.propKey] as string) ?? ""}
                  onChange={(e) => set({ [f.propKey]: e.target.value })} style={{ resize: "vertical", lineHeight: 1.5 }} />
              </InspectorField>
            );
          case "select":
            return (
              <InspectorField key={i} label={f.label}>
                <select className="inspector-select" value={(props[f.propKey] as string) ?? f.options[0]?.value}
                  onChange={(e) => set({ [f.propKey]: e.target.value })}>
                  {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </InspectorField>
            );
          case "toggle": {
            const checked = Boolean(props[f.propKey]);
            return (
              <InspectorField key={i} label={f.label}>
                <button className={`inspector-toggle-btn${checked ? " active" : ""}`} onClick={() => set({ [f.propKey]: !checked })} style={{ width: "100%" }}>
                  {checked ? "On" : "Off"}
                </button>
              </InspectorField>
            );
          }
          case "range": {
            const val = Number(props[f.propKey] ?? f.min ?? 0);
            return (
              <InspectorField key={i} label={`${f.label} (${val}${f.suffix ?? ""})`}>
                <input className="inspector-input" type="range" min={f.min ?? 0} max={f.max ?? 100} value={val}
                  onChange={(e) => set({ [f.propKey]: Number(e.target.value) })} style={{ width: "100%" }} />
              </InspectorField>
            );
          }
          case "static":
            return <div key={i} style={{ padding: "4px 0", fontSize: 11, opacity: 0.5 }}>{f.text}</div>;
        }
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Block type definitions — data only, no hand-written components
   ═══════════════════════════════════════════════════════════ */

const STATUS_OPTIONS = [
  { value: "default", label: "Default" }, { value: "info", label: "Info" },
  { value: "success", label: "Success" }, { value: "warning", label: "Warning" }, { value: "error", label: "Error" },
];
const PRESENCE_OPTIONS = [
  { value: "", label: "None" }, { value: "available", label: "Available" },
  { value: "busy", label: "Busy" }, { value: "away", label: "Away" }, { value: "offline", label: "Offline" },
];
const NAV_ICON_OPTIONS = [
  { value: "chat", label: "Chat" }, { value: "database", label: "Database" },
  { value: "settings", label: "Settings" }, { value: "bar_chart", label: "Bar Chart" },
  { value: "home", label: "Home" }, { value: "person", label: "Person" },
  { value: "search", label: "Search" }, { value: "notifications", label: "Notifications" },
];

interface BlockDef {
  type: string;
  label: string;
  icon: string;
  defaults: Record<string, unknown>;
  fields: FieldDef[];
}

const BLOCK_DEFS: BlockDef[] = [
  /* ── UI Components ── */
  { type: "SimulatedButton", label: "Button", icon: "smart_button", defaults: { variant: "primary", label: "New Button" }, fields: [
    { type: "text", propKey: "label", label: "Label" },
    { type: "select", propKey: "variant", label: "Variant", options: [{ value: "primary", label: "Primary (CTA)" }, { value: "secondary", label: "Secondary" }, { value: "outline", label: "Outline" }, { value: "ghost", label: "Ghost / Text" }] },
  ]},
  { type: "SimulatedTitle", label: "Title / Heading", icon: "title", defaults: { level: "h2", text: "New Heading" }, fields: [
    { type: "text", propKey: "text", label: "Text" },
    { type: "select", propKey: "level", label: "Level", options: [{ value: "h1", label: "H1" }, { value: "h2", label: "H2" }, { value: "h3", label: "H3" }, { value: "h4", label: "H4" }] },
  ]},
  { type: "SimulatedTextInput", label: "Text Input", icon: "text_fields", defaults: { placeholder: "Enter text...", label: "Label" }, fields: [
    { type: "text", propKey: "label", label: "Label" }, { type: "text", propKey: "placeholder", label: "Placeholder" },
  ]},
  { type: "Alert", label: "Alert", icon: "warning", defaults: { variant: "info", title: "Update Available", message: "A new version is ready." }, fields: [
    { type: "text", propKey: "title", label: "Title" }, { type: "text", propKey: "message", label: "Message" },
    { type: "select", propKey: "variant", label: "Variant", options: [{ value: "info", label: "Info" }, { value: "success", label: "Success" }, { value: "warning", label: "Warning" }, { value: "error", label: "Error" }] },
  ]},
  { type: "SimulatedCard", label: "Card", icon: "credit_card", defaults: { title: "New Card", content: "Card content goes here." }, fields: [
    { type: "text", propKey: "title", label: "Title" }, { type: "textarea", propKey: "content", label: "Content" },
  ]},
  { type: "SimulatedBadge", label: "Badge", icon: "label", defaults: { label: "New Badge", status: "default" }, fields: [
    { type: "text", propKey: "label", label: "Label" }, { type: "select", propKey: "status", label: "Status", options: STATUS_OPTIONS },
  ]},
  { type: "SimulatedChatMessage", label: "Chat Message", icon: "chat_bubble", defaults: { role: "user", message: "Can you help me build a dashboard?" }, fields: [
    { type: "select", propKey: "role", label: "Role", options: [{ value: "user", label: "User" }, { value: "system", label: "System / AI" }] },
    { type: "textarea", propKey: "message", label: "Message" },
  ]},
  { type: "SimulatedChart", label: "Chart", icon: "bar_chart", defaults: { title: "Monthly Revenue", dataPoints: "40,70,45,90,65" }, fields: [
    { type: "text", propKey: "title", label: "Title" }, { type: "text", propKey: "dataPoints", label: "Data Points", placeholder: "e.g. 40,70,45,90,65" },
  ]},

  /* ── Form Controls ── */
  { type: "SimulatedCheckbox", label: "Checkbox", icon: "check_box", defaults: { label: "Accept terms and conditions", defaultChecked: false }, fields: [
    { type: "text", propKey: "label", label: "Label" }, { type: "toggle", propKey: "defaultChecked", label: "Checked" },
  ]},
  { type: "SimulatedSwitch", label: "Toggle Switch", icon: "toggle_on", defaults: { label: "Enable Notifications", defaultOn: false }, fields: [
    { type: "text", propKey: "label", label: "Label" }, { type: "toggle", propKey: "defaultOn", label: "Default On" },
  ]},
  { type: "SimulatedDropdown", label: "Dropdown", icon: "arrow_drop_down_circle", defaults: { placeholder: "Select an option" }, fields: [
    { type: "text", propKey: "placeholder", label: "Placeholder" },
  ]},

  /* ── Data Display ── */
  { type: "SimulatedDataTable", label: "Data Table", icon: "table_chart", defaults: {}, fields: [
    { type: "static", text: "Click cells on the canvas to edit data" },
  ]},
  { type: "SimulatedProgress", label: "Progress Bar", icon: "percent", defaults: { label: "Uploading assets...", value: 50 }, fields: [
    { type: "text", propKey: "label", label: "Label" }, { type: "range", propKey: "value", label: "Value", max: 100, suffix: "%" },
  ]},
  { type: "SimulatedAvatar", label: "Avatar", icon: "account_circle", defaults: { initials: "AB", size: "md", presence: "available" }, fields: [
    { type: "text", propKey: "initials", label: "Initials", placeholder: "AB" },
    { type: "select", propKey: "size", label: "Size", options: [{ value: "sm", label: "Small" }, { value: "md", label: "Medium" }, { value: "lg", label: "Large" }] },
    { type: "select", propKey: "presence", label: "Presence", options: PRESENCE_OPTIONS },
  ]},

  /* ── Navigation & Layout ── */
  { type: "SimulatedTabs", label: "Tabs", icon: "tab", defaults: { tabsCsv: "General, Security, Notifications" }, fields: [
    { type: "text", propKey: "tabsCsv", label: "Tab Labels (comma-separated)", placeholder: "General, Security, Notifications" },
  ]},
  { type: "SimulatedBreadcrumb", label: "Breadcrumb", icon: "chevron_right", defaults: { pathCsv: "Home, Projects, Design Hub" }, fields: [
    { type: "text", propKey: "pathCsv", label: "Path (comma-separated)", placeholder: "Home, Projects, Design Hub" },
  ]},
  { type: "SimulatedAccordion", label: "Accordion", icon: "expand_more", defaults: { title: "Advanced Settings", content: "Configure deployment environments, manage API keys, and set up custom domains." }, fields: [
    { type: "text", propKey: "title", label: "Title" }, { type: "textarea", propKey: "content", label: "Content", rows: 3 },
  ]},

  /* ── Overlays & Feedback ── */
  { type: "SimulatedDialog", label: "Dialog", icon: "open_in_new", defaults: { title: "Confirm Delete", message: "This action cannot be undone. All data will be permanently removed." }, fields: [
    { type: "text", propKey: "title", label: "Title" }, { type: "textarea", propKey: "message", label: "Message", rows: 2 },
  ]},
  { type: "SimulatedTooltip", label: "Tooltip", icon: "info", defaults: { text: "This is a simulated tooltip", buttonLabel: "Hover me" }, fields: [
    { type: "text", propKey: "text", label: "Tooltip Text" }, { type: "text", propKey: "buttonLabel", label: "Button Label" },
  ]},
  { type: "SimulatedDatePicker", label: "Date Picker", icon: "calendar_today", defaults: { month: "October", year: 2026 }, fields: [
    { type: "text", propKey: "month", label: "Month", placeholder: "October" }, { type: "text", propKey: "year", label: "Year", placeholder: "2026" },
  ]},

  /* ── Highcharts ── */
  { type: "HighchartLine", label: "Line Chart", icon: "show_chart", defaults: { chartType: "line", title: "Monthly Revenue" }, fields: [{ type: "text", propKey: "title", label: "Title" }] },
  { type: "HighchartArea", label: "Area Chart", icon: "area_chart", defaults: { chartType: "area", title: "User Growth" }, fields: [{ type: "text", propKey: "title", label: "Title" }] },
  { type: "HighchartColumn", label: "Column Chart", icon: "insert_chart", defaults: { chartType: "column", title: "Sales by Region" }, fields: [{ type: "text", propKey: "title", label: "Title" }] },
  { type: "HighchartPie", label: "Pie Chart", icon: "pie_chart", defaults: { chartType: "pie", title: "Market Share" }, fields: [{ type: "text", propKey: "title", label: "Title" }] },
  { type: "HighchartScatter", label: "Scatter Plot", icon: "scatter_plot", defaults: { chartType: "scatter", title: "Risk vs Return" }, fields: [{ type: "text", propKey: "title", label: "Title" }] },
  { type: "HighchartBar", label: "Bar Chart", icon: "align_horizontal_left", defaults: { chartType: "bar", title: "Top Performers" }, fields: [{ type: "text", propKey: "title", label: "Title" }] },
  { type: "HighchartDonut", label: "Donut Chart", icon: "donut_large", defaults: { chartType: "donut", title: "Portfolio Allocation" }, fields: [{ type: "text", propKey: "title", label: "Title" }] },
  { type: "HighchartSpline", label: "Spline Chart", icon: "timeline", defaults: { chartType: "spline", title: "Temperature Trend" }, fields: [{ type: "text", propKey: "title", label: "Title" }] },
  { type: "HighchartStackedColumn", label: "Stacked Column", icon: "stacked_bar_chart", defaults: { chartType: "stacked-column", title: "Revenue Breakdown" }, fields: [{ type: "text", propKey: "title", label: "Title" }] },
  { type: "HighchartGauge", label: "Gauge", icon: "speed", defaults: { chartType: "gauge", title: "System Health", value: 87 }, fields: [
    { type: "text", propKey: "title", label: "Title" }, { type: "range", propKey: "value", label: "Value", max: 100, suffix: "%" },
  ]},
  { type: "HighchartHeatmap", label: "Heatmap", icon: "grid_on", defaults: { chartType: "heatmap", title: "Correlation Matrix" }, fields: [{ type: "text", propKey: "title", label: "Title" }] },
  { type: "HighchartTreemap", label: "Treemap", icon: "grid_view", defaults: { chartType: "treemap", title: "Portfolio Treemap" }, fields: [{ type: "text", propKey: "title", label: "Title" }] },

  /* ── Remaining UI Kit ── */
  { type: "SimulatedRadioGroup", label: "Radio Buttons", icon: "radio_button_checked", defaults: { label: "Select option", optionsCsv: "Option A, Option B, Option C", defaultIndex: 0 }, fields: [
    { type: "text", propKey: "label", label: "Label" }, { type: "text", propKey: "optionsCsv", label: "Options (comma-separated)", placeholder: "Option A, Option B, Option C" },
  ]},
  { type: "SimulatedSlider", label: "Slider", icon: "tune", defaults: { label: "Volume", min: 0, max: 100, value: 50 }, fields: [
    { type: "text", propKey: "label", label: "Label" }, { type: "range", propKey: "value", label: "Value", max: 100 },
  ]},
  { type: "SimulatedNumberInput", label: "Number Input", icon: "pin", defaults: { label: "Quantity", value: 1, min: 0, max: 99, step: 1 }, fields: [
    { type: "text", propKey: "label", label: "Label" }, { type: "text", propKey: "value", label: "Default Value" }, { type: "text", propKey: "step", label: "Step" },
  ]},
  { type: "SimulatedMultilineInput", label: "Multiline Input", icon: "notes", defaults: { label: "Description", placeholder: "Enter description...", rows: 3 }, fields: [
    { type: "text", propKey: "label", label: "Label" }, { type: "text", propKey: "placeholder", label: "Placeholder" },
    { type: "select", propKey: "rows", label: "Rows", options: [{ value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" }, { value: "6", label: "6" }] },
  ]},
  { type: "SimulatedPill", label: "Pill / Tag", icon: "sell", defaults: { label: "Tag", status: "default", dismissible: true }, fields: [
    { type: "text", propKey: "label", label: "Label" }, { type: "select", propKey: "status", label: "Status", options: STATUS_OPTIONS }, { type: "toggle", propKey: "dismissible", label: "Dismissible" },
  ]},
  { type: "SimulatedToggleButton", label: "Toggle Button", icon: "toggle_on", defaults: { label: "Bold", defaultPressed: false }, fields: [
    { type: "text", propKey: "label", label: "Label" }, { type: "toggle", propKey: "defaultPressed", label: "Default Pressed" },
  ]},
  { type: "SimulatedSegmentedGroup", label: "Segmented Group", icon: "view_column", defaults: { optionsCsv: "Day, Week, Month", defaultIndex: 0 }, fields: [
    { type: "text", propKey: "optionsCsv", label: "Options (comma-separated)", placeholder: "Day, Week, Month" },
  ]},
  { type: "SimulatedLink", label: "Link", icon: "link", defaults: { text: "Learn more", showIcon: true }, fields: [
    { type: "text", propKey: "text", label: "Text" }, { type: "toggle", propKey: "showIcon", label: "Show Arrow Icon" },
  ]},
  { type: "SimulatedListBox", label: "List Box", icon: "list", defaults: { itemsCsv: "Apple, Banana, Cherry, Date, Elderberry", multiSelect: false }, fields: [
    { type: "text", propKey: "itemsCsv", label: "Items (comma-separated)", placeholder: "Apple, Banana, Cherry" }, { type: "toggle", propKey: "multiSelect", label: "Multi-select" },
  ]},
  { type: "SimulatedComboBox", label: "ComboBox", icon: "search", defaults: { placeholder: "Search...", itemsCsv: "United States, United Kingdom, Canada, Australia, Germany" }, fields: [
    { type: "text", propKey: "placeholder", label: "Placeholder" }, { type: "text", propKey: "itemsCsv", label: "Items (comma-separated)" },
  ]},
  { type: "SimulatedFileDropZone", label: "File Drop Zone", icon: "upload_file", defaults: { label: "Drag & drop files here", acceptTypes: ".png, .jpg, .pdf" }, fields: [
    { type: "text", propKey: "label", label: "Label" }, { type: "text", propKey: "acceptTypes", label: "Accepted Types" },
  ]},

  /* ── Missing DS components ── */
  { type: "SimulatedTree", label: "Tree", icon: "account_tree", defaults: { itemsCsv: "Documents > Work > Reports, Documents > Personal, Images > Vacation, Images > Family" }, fields: [
    { type: "text", propKey: "itemsCsv", label: "Tree items (Parent > Child, ...)", placeholder: "Docs > Work, Docs > Personal" },
  ]},
  { type: "SimulatedRating", label: "Rating", icon: "star_half", defaults: { label: "Rating", max: 5, value: 3 }, fields: [
    { type: "text", propKey: "label", label: "Label" }, { type: "range", propKey: "value", label: "Value", min: 1, max: 5 },
  ]},
  { type: "SimulatedSkeleton", label: "Skeleton", icon: "hourglass_empty", defaults: { variant: "card" }, fields: [
    { type: "select", propKey: "variant", label: "Variant", options: [{ value: "card", label: "Card" }, { value: "text", label: "Text" }, { value: "avatar", label: "Avatar" }] },
  ]},
  { type: "SimulatedSearchbox", label: "Searchbox", icon: "search", defaults: { placeholder: "Search..." }, fields: [
    { type: "text", propKey: "placeholder", label: "Placeholder" },
  ]},
  { type: "SimulatedTokenizedInput", label: "Tokenized Input", icon: "label", defaults: { label: "Recipients", tokensCsv: "alice@co.com, bob@co.com" }, fields: [
    { type: "text", propKey: "label", label: "Label" }, { type: "text", propKey: "tokensCsv", label: "Initial tokens (comma-separated)" },
  ]},
  { type: "SimulatedNavDrawer", label: "Nav Drawer", icon: "menu_open", defaults: { itemsCsv: "Home, Dashboard, Settings, Profile, Help" }, fields: [
    { type: "text", propKey: "itemsCsv", label: "Items (comma-separated)", placeholder: "Home, Dashboard, Settings" },
  ]},
  { type: "SimulatedPopover", label: "Popover", icon: "chat_bubble_outline", defaults: { title: "Popover Title", content: "Additional information displayed in a popover." }, fields: [
    { type: "text", propKey: "title", label: "Title" }, { type: "textarea", propKey: "content", label: "Content", rows: 2 },
  ]},
  { type: "SimulatedPersona", label: "Persona", icon: "person", defaults: { name: "Jane Doe", role: "Senior Designer", presence: "available" }, fields: [
    { type: "text", propKey: "name", label: "Name" }, { type: "text", propKey: "role", label: "Role" },
    { type: "select", propKey: "presence", label: "Presence", options: PRESENCE_OPTIONS.filter(o => o.value !== "") },
  ]},
  { type: "SimulatedAvatarGroup", label: "Avatar Group", icon: "group", defaults: { namesCsv: "AB, CD, EF, GH, IJ, KL", max: 4 }, fields: [
    { type: "text", propKey: "namesCsv", label: "Names (comma-separated)", placeholder: "AB, CD, EF, GH" }, { type: "text", propKey: "max", label: "Max visible" },
  ]},

  /* ── Stat Card ── */
  { type: "SimulatedStatCard", label: "Stat Card", icon: "monitoring", defaults: { label: "Revenue", value: "$42.8K", pct: 60, colSpan: 1 }, fields: [
    { type: "text", propKey: "label", label: "Label" }, { type: "text", propKey: "value", label: "Value" },
    { type: "range", propKey: "pct", label: "Progress", max: 100, suffix: "%" },
  ]},

  /* ── Zone-specific types ── */
  { type: "AppBrand", label: "App Brand", icon: "branding_watermark", defaults: { label: "App Name" }, fields: [
    { type: "text", propKey: "label", label: "Brand Name" },
  ]},
  { type: "StatusPill", label: "Status Pill", icon: "circle", defaults: { label: "Active" }, fields: [
    { type: "text", propKey: "label", label: "Status Label" },
  ]},
  { type: "NavItem", label: "Nav Item", icon: "menu", defaults: { label: "New Item", icon: "chat", active: false }, fields: [
    { type: "text", propKey: "label", label: "Label" }, { type: "select", propKey: "icon", label: "Icon", options: NAV_ICON_OPTIONS },
  ]},
  { type: "FooterText", label: "Footer Text", icon: "short_text", defaults: { label: "Footer text", version: "v1.0" }, fields: [
    { type: "text", propKey: "label", label: "Text" }, { type: "text", propKey: "version", label: "Version" },
  ]},
];

/* ═══════════════════════════════════════════════════════════
   Lookup helpers — same public API as before
   ═══════════════════════════════════════════════════════════ */

/** Library blueprints for drag-and-drop */
export const LIBRARY_BLUEPRINTS = BLOCK_DEFS.map((b, i) => ({
  id: `lib-${i}`,
  type: b.type,
  label: b.label,
  icon: b.icon,
  defaults: b.defaults,
}));

/** type → Fields component (for PropertiesInspector) — auto-generated from schema */
export const TYPE_FIELDS: Record<string, React.FC<{ blockId: string }>> =
  Object.fromEntries(BLOCK_DEFS.map((b) => [
    b.type,
    ({ blockId }: { blockId: string }) => <SchemaFields blockId={blockId} fields={b.fields} />,
  ]));
