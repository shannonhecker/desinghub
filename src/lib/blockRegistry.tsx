"use client";

import React from "react";
import { useBuilder } from "@/store/useBuilder";

/* ═══════════════════════════════════════════════════════════
   Block Registry — single source of truth for:
   • Library blueprints (drag-and-drop)
   • Property editors (inspector fields)
   • Type metadata (label, icon)

   Adding a new component? Just add an entry here.
   Both ComponentLibrary and PropertiesInspector read from this.
   ═══════════════════════════════════════════════════════════ */

/* ── Shared inspector field wrapper ── */
function InspectorField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="inspector-field">
      <label className="inspector-field-label">{label}</label>
      {children}
    </div>
  );
}

/* ── Generic hook: read block + updater (searches all zones) ── */
function useBlockProps(blockId: string) {
  const blocks = useBuilder((s) => s.blocks);
  const headerBlocks = useBuilder((s) => s.headerBlocks);
  const sidebarBlocks = useBuilder((s) => s.sidebarBlocks);
  const footerBlocks = useBuilder((s) => s.footerBlocks);
  const updateBlockProps = useBuilder((s) => s.updateBlockProps);
  const updateHeaderBlockProps = useBuilder((s) => s.updateHeaderBlockProps);
  const updateSidebarBlockProps = useBuilder((s) => s.updateSidebarBlockProps);
  const updateFooterBlockProps = useBuilder((s) => s.updateFooterBlockProps);

  let block = blocks.find((b) => b.id === blockId);
  let update = updateBlockProps;
  if (!block) { block = headerBlocks.find((b) => b.id === blockId); update = updateHeaderBlockProps; }
  if (!block) { block = sidebarBlocks.find((b) => b.id === blockId); update = updateSidebarBlockProps; }
  if (!block) { block = footerBlocks.find((b) => b.id === blockId); update = updateFooterBlockProps; }

  return {
    props: block?.props ?? {},
    set: (patch: Record<string, unknown>) => update(blockId, patch),
  };
}

/* ── Reusable field helpers ── */
function TextField({ blockId, propKey, label, placeholder }: {
  blockId: string; propKey: string; label: string; placeholder?: string;
}) {
  const { props, set } = useBlockProps(blockId);
  return (
    <InspectorField label={label}>
      <input
        className="inspector-input"
        type="text"
        value={(props[propKey] as string) ?? ""}
        placeholder={placeholder}
        onChange={(e) => set({ [propKey]: e.target.value })}
      />
    </InspectorField>
  );
}

function TextAreaField({ blockId, propKey, label, rows = 3 }: {
  blockId: string; propKey: string; label: string; rows?: number;
}) {
  const { props, set } = useBlockProps(blockId);
  return (
    <InspectorField label={label}>
      <textarea
        className="inspector-input"
        rows={rows}
        value={(props[propKey] as string) ?? ""}
        onChange={(e) => set({ [propKey]: e.target.value })}
        style={{ resize: "vertical", lineHeight: 1.5 }}
      />
    </InspectorField>
  );
}

function SelectField({ blockId, propKey, label, options }: {
  blockId: string; propKey: string; label: string;
  options: { value: string; label: string }[];
}) {
  const { props, set } = useBlockProps(blockId);
  return (
    <InspectorField label={label}>
      <select
        className="inspector-select"
        value={(props[propKey] as string) ?? options[0]?.value}
        onChange={(e) => set({ [propKey]: e.target.value })}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </InspectorField>
  );
}

function ToggleField({ blockId, propKey, label }: {
  blockId: string; propKey: string; label: string;
}) {
  const { props, set } = useBlockProps(blockId);
  const checked = Boolean(props[propKey]);
  return (
    <InspectorField label={label}>
      <button
        className={`inspector-toggle-btn${checked ? " active" : ""}`}
        onClick={() => set({ [propKey]: !checked })}
        style={{ width: "100%" }}
      >
        {checked ? "On" : "Off"}
      </button>
    </InspectorField>
  );
}

/* ═══════════════════════════════════════════════════════════
   Block type definitions
   ═══════════════════════════════════════════════════════════ */

interface BlockRegistryEntry {
  type: string;
  label: string;
  icon: string;
  defaults: Record<string, unknown>;
  Fields: React.FC<{ blockId: string }>;
}

/* ── Property editor components ── */

function ButtonFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="label" label="Label" />
      <SelectField blockId={blockId} propKey="variant" label="Variant" options={[
        { value: "primary", label: "Primary (CTA)" },
        { value: "secondary", label: "Secondary" },
        { value: "outline", label: "Outline" },
        { value: "ghost", label: "Ghost / Text" },
      ]} />
    </div>
  );
}

function TitleFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="text" label="Text" />
      <SelectField blockId={blockId} propKey="level" label="Level" options={[
        { value: "h1", label: "H1" },
        { value: "h2", label: "H2" },
        { value: "h3", label: "H3" },
        { value: "h4", label: "H4" },
      ]} />
    </div>
  );
}

function TextInputFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="label" label="Label" />
      <TextField blockId={blockId} propKey="placeholder" label="Placeholder" />
    </div>
  );
}

function AlertFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="title" label="Title" />
      <TextField blockId={blockId} propKey="message" label="Message" />
      <SelectField blockId={blockId} propKey="variant" label="Variant" options={[
        { value: "info", label: "Info" },
        { value: "success", label: "Success" },
        { value: "warning", label: "Warning" },
        { value: "error", label: "Error" },
      ]} />
    </div>
  );
}

function CardFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="title" label="Title" />
      <TextAreaField blockId={blockId} propKey="content" label="Content" />
    </div>
  );
}

function BadgeFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="label" label="Label" />
      <SelectField blockId={blockId} propKey="status" label="Status" options={[
        { value: "default", label: "Default" },
        { value: "info", label: "Info" },
        { value: "success", label: "Success" },
        { value: "warning", label: "Warning" },
        { value: "error", label: "Error" },
      ]} />
    </div>
  );
}

function ChatMessageFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <SelectField blockId={blockId} propKey="role" label="Role" options={[
        { value: "user", label: "User" },
        { value: "system", label: "System / AI" },
      ]} />
      <TextAreaField blockId={blockId} propKey="message" label="Message" />
    </div>
  );
}

function ChartFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="title" label="Title" />
      <TextField blockId={blockId} propKey="dataPoints" label="Data Points" placeholder="e.g. 40,70,45,90,65" />
    </div>
  );
}

/* ── Batch 1: Form Controls ── */

function CheckboxFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="label" label="Label" />
      <ToggleField blockId={blockId} propKey="defaultChecked" label="Checked" />
    </div>
  );
}

function SwitchFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="label" label="Label" />
      <ToggleField blockId={blockId} propKey="defaultOn" label="Default On" />
    </div>
  );
}

function DropdownFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="placeholder" label="Placeholder" />
    </div>
  );
}

/* ── Batch 2: Data Display ── */

function DataTableFields(_: { blockId: string }) {
  // DataTable rows are edited inline on the canvas; no inspector fields needed yet
  return (
    <div style={{ padding: "4px 0", fontSize: 11, opacity: 0.5 }}>
      Click cells on the canvas to edit data
    </div>
  );
}

function ProgressFields({ blockId }: { blockId: string }) {
  const { props, set } = useBlockProps(blockId);
  const value = Number(props.value ?? 50);
  return (
    <div>
      <TextField blockId={blockId} propKey="label" label="Label" />
      <InspectorField label={`Value (${value}%)`}>
        <input
          className="inspector-input"
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => set({ value: Number(e.target.value) })}
          style={{ width: "100%" }}
        />
      </InspectorField>
    </div>
  );
}

function AvatarFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="initials" label="Initials" placeholder="AB" />
      <SelectField blockId={blockId} propKey="size" label="Size" options={[
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
      ]} />
      <SelectField blockId={blockId} propKey="presence" label="Presence" options={[
        { value: "", label: "None" },
        { value: "available", label: "Available" },
        { value: "busy", label: "Busy" },
        { value: "away", label: "Away" },
        { value: "offline", label: "Offline" },
      ]} />
    </div>
  );
}

/* ── Batch 3: Navigation & Layout ── */

function TabsFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="tabsCsv" label="Tab Labels (comma-separated)" placeholder="General, Security, Notifications" />
    </div>
  );
}

function BreadcrumbFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="pathCsv" label="Path (comma-separated)" placeholder="Home, Projects, Design Hub" />
    </div>
  );
}

function AccordionFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="title" label="Title" />
      <TextAreaField blockId={blockId} propKey="content" label="Content" rows={3} />
    </div>
  );
}

/* ── Batch 4: Overlays & Feedback ── */

function DialogFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="title" label="Title" />
      <TextAreaField blockId={blockId} propKey="message" label="Message" rows={2} />
    </div>
  );
}

function TooltipFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="text" label="Tooltip Text" />
      <TextField blockId={blockId} propKey="buttonLabel" label="Button Label" />
    </div>
  );
}

function DatePickerFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="month" label="Month" placeholder="October" />
      <TextField blockId={blockId} propKey="year" label="Year" placeholder="2026" />
    </div>
  );
}

/* ── Batch 6: Remaining UI Kit components ── */

function RadioGroupFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="label" label="Label" />
      <TextField blockId={blockId} propKey="optionsCsv" label="Options (comma-separated)" placeholder="Option A, Option B, Option C" />
    </div>
  );
}

function SliderFields({ blockId }: { blockId: string }) {
  const { props, set } = useBlockProps(blockId);
  const value = Number(props.value ?? 50);
  return (
    <div>
      <TextField blockId={blockId} propKey="label" label="Label" />
      <InspectorField label={`Value (${value})`}>
        <input className="inspector-input" type="range" min={0} max={100} value={value}
          onChange={(e) => set({ value: Number(e.target.value) })} style={{ width: "100%" }} />
      </InspectorField>
    </div>
  );
}

function NumberInputFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="label" label="Label" />
      <TextField blockId={blockId} propKey="value" label="Default Value" />
      <TextField blockId={blockId} propKey="step" label="Step" />
    </div>
  );
}

function MultilineInputFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="label" label="Label" />
      <TextField blockId={blockId} propKey="placeholder" label="Placeholder" />
      <SelectField blockId={blockId} propKey="rows" label="Rows" options={[
        { value: "2", label: "2" }, { value: "3", label: "3" },
        { value: "4", label: "4" }, { value: "6", label: "6" },
      ]} />
    </div>
  );
}

function PillFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="label" label="Label" />
      <SelectField blockId={blockId} propKey="status" label="Status" options={[
        { value: "default", label: "Default" }, { value: "info", label: "Info" },
        { value: "success", label: "Success" }, { value: "warning", label: "Warning" },
        { value: "error", label: "Error" },
      ]} />
      <ToggleField blockId={blockId} propKey="dismissible" label="Dismissible" />
    </div>
  );
}

function ToggleButtonFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="label" label="Label" />
      <ToggleField blockId={blockId} propKey="defaultPressed" label="Default Pressed" />
    </div>
  );
}

function SegmentedGroupFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="optionsCsv" label="Options (comma-separated)" placeholder="Day, Week, Month" />
    </div>
  );
}

function LinkFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="text" label="Text" />
      <ToggleField blockId={blockId} propKey="showIcon" label="Show Arrow Icon" />
    </div>
  );
}

function ListBoxFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="itemsCsv" label="Items (comma-separated)" placeholder="Apple, Banana, Cherry" />
      <ToggleField blockId={blockId} propKey="multiSelect" label="Multi-select" />
    </div>
  );
}

function ComboBoxFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="placeholder" label="Placeholder" />
      <TextField blockId={blockId} propKey="itemsCsv" label="Items (comma-separated)" />
    </div>
  );
}

function FileDropZoneFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="label" label="Label" />
      <TextField blockId={blockId} propKey="acceptTypes" label="Accepted Types" />
    </div>
  );
}

/* ── Stat Card ── */

function StatCardFields({ blockId }: { blockId: string }) {
  const { props, set } = useBlockProps(blockId);
  const pct = Number(props.pct ?? 60);
  return (
    <div>
      <TextField blockId={blockId} propKey="label" label="Label" />
      <TextField blockId={blockId} propKey="value" label="Value" />
      <InspectorField label={`Progress (${pct}%)`}>
        <input
          className="inspector-input"
          type="range"
          min={0}
          max={100}
          value={pct}
          onChange={(e) => set({ pct: Number(e.target.value) })}
          style={{ width: "100%" }}
        />
      </InspectorField>
    </div>
  );
}

/* ── Zone-specific types ── */

function AppBrandFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="label" label="Brand Name" />
    </div>
  );
}

function StatusPillFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="label" label="Status Label" />
    </div>
  );
}

function NavItemFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="label" label="Label" />
      <SelectField blockId={blockId} propKey="icon" label="Icon" options={[
        { value: "chat", label: "Chat" },
        { value: "database", label: "Database" },
        { value: "settings", label: "Settings" },
        { value: "bar_chart", label: "Bar Chart" },
        { value: "home", label: "Home" },
        { value: "person", label: "Person" },
        { value: "search", label: "Search" },
        { value: "notifications", label: "Notifications" },
      ]} />
    </div>
  );
}

function FooterTextFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="label" label="Text" />
      <TextField blockId={blockId} propKey="version" label="Version" />
    </div>
  );
}

/* ── Batch 5: Highcharts ── */

function HighchartTitleFields({ blockId }: { blockId: string }) {
  return (
    <div>
      <TextField blockId={blockId} propKey="title" label="Title" />
    </div>
  );
}

function HighchartGaugeFields({ blockId }: { blockId: string }) {
  const { props, set } = useBlockProps(blockId);
  const value = Number(props.value ?? 87);
  return (
    <div>
      <TextField blockId={blockId} propKey="title" label="Title" />
      <InspectorField label={`Value (${value}%)`}>
        <input
          className="inspector-input"
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => set({ value: Number(e.target.value) })}
          style={{ width: "100%" }}
        />
      </InspectorField>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Registry — the single source of truth
   ═══════════════════════════════════════════════════════════ */

const BLOCK_REGISTRY: BlockRegistryEntry[] = [
  /* ── Existing ── */
  {
    type: "SimulatedButton",
    label: "Button",
    icon: "smart_button",
    defaults: { variant: "primary", label: "New Button" },
    Fields: ButtonFields,
  },
  {
    type: "SimulatedTitle",
    label: "Title / Heading",
    icon: "title",
    defaults: { level: "h2", text: "New Heading" },
    Fields: TitleFields,
  },
  {
    type: "SimulatedTextInput",
    label: "Text Input",
    icon: "text_fields",
    defaults: { placeholder: "Enter text...", label: "Label" },
    Fields: TextInputFields,
  },
  {
    type: "Alert",
    label: "Alert",
    icon: "warning",
    defaults: { variant: "info", title: "Update Available", message: "A new version is ready." },
    Fields: AlertFields,
  },
  {
    type: "SimulatedCard",
    label: "Card",
    icon: "credit_card",
    defaults: { title: "New Card", content: "Card content goes here." },
    Fields: CardFields,
  },
  {
    type: "SimulatedBadge",
    label: "Badge",
    icon: "label",
    defaults: { label: "New Badge", status: "default" },
    Fields: BadgeFields,
  },
  {
    type: "SimulatedChatMessage",
    label: "Chat Message",
    icon: "chat_bubble",
    defaults: { role: "user", message: "Can you help me build a dashboard?" },
    Fields: ChatMessageFields,
  },
  {
    type: "SimulatedChart",
    label: "Chart",
    icon: "bar_chart",
    defaults: { title: "Monthly Revenue", dataPoints: "40,70,45,90,65" },
    Fields: ChartFields,
  },

  /* ── Batch 1: Form Controls ── */
  {
    type: "SimulatedCheckbox",
    label: "Checkbox",
    icon: "check_box",
    defaults: { label: "Accept terms and conditions", defaultChecked: false },
    Fields: CheckboxFields,
  },
  {
    type: "SimulatedSwitch",
    label: "Toggle Switch",
    icon: "toggle_on",
    defaults: { label: "Enable Notifications", defaultOn: false },
    Fields: SwitchFields,
  },
  {
    type: "SimulatedDropdown",
    label: "Dropdown",
    icon: "arrow_drop_down_circle",
    defaults: { placeholder: "Select an option" },
    Fields: DropdownFields,
  },

  /* ── Batch 2: Data Display ── */
  {
    type: "SimulatedDataTable",
    label: "Data Table",
    icon: "table_chart",
    defaults: {},
    Fields: DataTableFields,
  },
  {
    type: "SimulatedProgress",
    label: "Progress Bar",
    icon: "percent",
    defaults: { label: "Uploading assets...", value: 50 },
    Fields: ProgressFields,
  },
  {
    type: "SimulatedAvatar",
    label: "Avatar",
    icon: "account_circle",
    defaults: { initials: "AB", size: "md", presence: "available" },
    Fields: AvatarFields,
  },

  /* ── Batch 3: Navigation & Layout ── */
  {
    type: "SimulatedTabs",
    label: "Tabs",
    icon: "tab",
    defaults: { tabsCsv: "General, Security, Notifications" },
    Fields: TabsFields,
  },
  {
    type: "SimulatedBreadcrumb",
    label: "Breadcrumb",
    icon: "chevron_right",
    defaults: { pathCsv: "Home, Projects, Design Hub" },
    Fields: BreadcrumbFields,
  },
  {
    type: "SimulatedAccordion",
    label: "Accordion",
    icon: "expand_more",
    defaults: { title: "Advanced Settings", content: "Configure deployment environments, manage API keys, and set up custom domains." },
    Fields: AccordionFields,
  },

  /* ── Batch 4: Overlays & Feedback ── */
  {
    type: "SimulatedDialog",
    label: "Dialog",
    icon: "open_in_new",
    defaults: { title: "Confirm Delete", message: "This action cannot be undone. All data will be permanently removed." },
    Fields: DialogFields,
  },
  {
    type: "SimulatedTooltip",
    label: "Tooltip",
    icon: "info",
    defaults: { text: "This is a simulated tooltip", buttonLabel: "Hover me" },
    Fields: TooltipFields,
  },
  {
    type: "SimulatedDatePicker",
    label: "Date Picker",
    icon: "calendar_today",
    defaults: { month: "October", year: 2026 },
    Fields: DatePickerFields,
  },

  /* ── Batch 5: Highcharts ── */
  {
    type: "HighchartLine",
    label: "Line Chart",
    icon: "show_chart",
    defaults: { chartType: "line", title: "Monthly Revenue" },
    Fields: HighchartTitleFields,
  },
  {
    type: "HighchartArea",
    label: "Area Chart",
    icon: "area_chart",
    defaults: { chartType: "area", title: "User Growth" },
    Fields: HighchartTitleFields,
  },
  {
    type: "HighchartColumn",
    label: "Column Chart",
    icon: "insert_chart",
    defaults: { chartType: "column", title: "Sales by Region" },
    Fields: HighchartTitleFields,
  },
  {
    type: "HighchartPie",
    label: "Pie Chart",
    icon: "pie_chart",
    defaults: { chartType: "pie", title: "Market Share" },
    Fields: HighchartTitleFields,
  },
  {
    type: "HighchartScatter",
    label: "Scatter Plot",
    icon: "scatter_plot",
    defaults: { chartType: "scatter", title: "Risk vs Return" },
    Fields: HighchartTitleFields,
  },
  {
    type: "HighchartBar",
    label: "Bar Chart",
    icon: "align_horizontal_left",
    defaults: { chartType: "bar", title: "Top Performers" },
    Fields: HighchartTitleFields,
  },
  {
    type: "HighchartDonut",
    label: "Donut Chart",
    icon: "donut_large",
    defaults: { chartType: "donut", title: "Portfolio Allocation" },
    Fields: HighchartTitleFields,
  },
  {
    type: "HighchartSpline",
    label: "Spline Chart",
    icon: "timeline",
    defaults: { chartType: "spline", title: "Temperature Trend" },
    Fields: HighchartTitleFields,
  },
  {
    type: "HighchartStackedColumn",
    label: "Stacked Column",
    icon: "stacked_bar_chart",
    defaults: { chartType: "stacked-column", title: "Revenue Breakdown" },
    Fields: HighchartTitleFields,
  },
  {
    type: "HighchartGauge",
    label: "Gauge",
    icon: "speed",
    defaults: { chartType: "gauge", title: "System Health", value: 87 },
    Fields: HighchartGaugeFields,
  },
  {
    type: "HighchartHeatmap",
    label: "Heatmap",
    icon: "grid_on",
    defaults: { chartType: "heatmap", title: "Correlation Matrix" },
    Fields: HighchartTitleFields,
  },
  {
    type: "HighchartTreemap",
    label: "Treemap",
    icon: "grid_view",
    defaults: { chartType: "treemap", title: "Portfolio Treemap" },
    Fields: HighchartTitleFields,
  },

  /* ── Batch 6: Remaining UI Kit ── */
  {
    type: "SimulatedRadioGroup",
    label: "Radio Buttons",
    icon: "radio_button_checked",
    defaults: { label: "Select option", optionsCsv: "Option A, Option B, Option C", defaultIndex: 0 },
    Fields: RadioGroupFields,
  },
  {
    type: "SimulatedSlider",
    label: "Slider",
    icon: "tune",
    defaults: { label: "Volume", min: 0, max: 100, value: 50 },
    Fields: SliderFields,
  },
  {
    type: "SimulatedNumberInput",
    label: "Number Input",
    icon: "pin",
    defaults: { label: "Quantity", value: 1, min: 0, max: 99, step: 1 },
    Fields: NumberInputFields,
  },
  {
    type: "SimulatedMultilineInput",
    label: "Multiline Input",
    icon: "notes",
    defaults: { label: "Description", placeholder: "Enter description...", rows: 3 },
    Fields: MultilineInputFields,
  },
  {
    type: "SimulatedPill",
    label: "Pill / Tag",
    icon: "sell",
    defaults: { label: "Tag", status: "default", dismissible: true },
    Fields: PillFields,
  },
  {
    type: "SimulatedToggleButton",
    label: "Toggle Button",
    icon: "toggle_on",
    defaults: { label: "Bold", defaultPressed: false },
    Fields: ToggleButtonFields,
  },
  {
    type: "SimulatedSegmentedGroup",
    label: "Segmented Group",
    icon: "view_column",
    defaults: { optionsCsv: "Day, Week, Month", defaultIndex: 0 },
    Fields: SegmentedGroupFields,
  },
  {
    type: "SimulatedLink",
    label: "Link",
    icon: "link",
    defaults: { text: "Learn more", showIcon: true },
    Fields: LinkFields,
  },
  {
    type: "SimulatedListBox",
    label: "List Box",
    icon: "list",
    defaults: { itemsCsv: "Apple, Banana, Cherry, Date, Elderberry", multiSelect: false },
    Fields: ListBoxFields,
  },
  {
    type: "SimulatedComboBox",
    label: "ComboBox",
    icon: "search",
    defaults: { placeholder: "Search...", itemsCsv: "United States, United Kingdom, Canada, Australia, Germany" },
    Fields: ComboBoxFields,
  },
  {
    type: "SimulatedFileDropZone",
    label: "File Drop Zone",
    icon: "upload_file",
    defaults: { label: "Drag & drop files here", acceptTypes: ".png, .jpg, .pdf" },
    Fields: FileDropZoneFields,
  },

  /* ── Individual Stat Card ── */
  {
    type: "SimulatedStatCard",
    label: "Stat Card",
    icon: "monitoring",
    defaults: { label: "Revenue", value: "$42.8K", pct: 60, colSpan: 1 },
    Fields: StatCardFields,
  },

  /* ── Zone-specific types ── */
  {
    type: "AppBrand",
    label: "App Brand",
    icon: "branding_watermark",
    defaults: { label: "App Name" },
    Fields: AppBrandFields,
  },
  {
    type: "StatusPill",
    label: "Status Pill",
    icon: "circle",
    defaults: { label: "Active" },
    Fields: StatusPillFields,
  },
  {
    type: "NavItem",
    label: "Nav Item",
    icon: "menu",
    defaults: { label: "New Item", icon: "chat", active: false },
    Fields: NavItemFields,
  },
  {
    type: "FooterText",
    label: "Footer Text",
    icon: "short_text",
    defaults: { label: "Footer text", version: "v1.0" },
    Fields: FooterTextFields,
  },
];

/* ── Lookup helpers ── */

/** Library blueprints for drag-and-drop (auto-generated from registry) */
export const LIBRARY_BLUEPRINTS = BLOCK_REGISTRY.map((b, i) => ({
  id: `lib-${i}`,
  type: b.type,
  label: b.label,
  icon: b.icon,
  defaults: b.defaults,
}));

/** type → Fields component (for PropertiesInspector) */
export const TYPE_FIELDS: Record<string, React.FC<{ blockId: string }>> =
  Object.fromEntries(BLOCK_REGISTRY.map((b) => [b.type, b.Fields]));
