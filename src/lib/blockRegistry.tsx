"use client";

import React from "react";
import { useBuilder, type Block } from "@/store/useBuilder";
import {
  SAMPLE_IMAGES,
  SAMPLE_IMAGE_CATEGORIES,
  getImagesByCategory,
  publicAssetUrl,
  type SampleImageCategory,
} from "@/lib/sampleImages";
import { DsControlScope, DsText, DsSelect, DsToggle, supportsDsControls, useMounted, type Mode } from "@/components/builder/DsInspectorControls";
import type { SystemId } from "@/lib/componentApiRegistry";

/* ═══════════════════════════════════════════════════════════
   Block Registry - schema-driven single source of truth.
   Each block type declares its fields as data. A generic
   SchemaFields component renders them - no hand-written
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

/* Walks top-level blocks plus one level of LayoutGroup children
   looking for the given id. Returns the block + the parent group's
   id when the match is nested, or `parentGroupId: null` when the
   match is top-level. */
function findTopOrChild(blocks: Block[], id: string): { block: Block; parentGroupId: string | null } | null {
  for (const b of blocks) {
    if (b.id === id) return { block: b, parentGroupId: null };
    if (b.children) {
      for (const c of b.children) {
        if (c.id === id) return { block: c, parentGroupId: b.id };
      }
    }
  }
  return null;
}

function useBlockProps(blockId: string) {
  /* Split selectors so each returns either null, a primitive, or a
     store-owned reference. Returning a fresh wrapper object
     (`{ ...found, key }`) every render triggered React error #185
     (infinite re-render loop) via Zustand's reference equality. */
  const block = useBuilder((s) => {
    for (const key of ZONE_KEYS) {
      const found = findTopOrChild(s[key] as Block[], blockId);
      if (found) return found.block;
    }
    return null;
  });
  const parentGroupId = useBuilder((s) => {
    for (const key of ZONE_KEYS) {
      const found = findTopOrChild(s[key] as Block[], blockId);
      if (found) return found.parentGroupId;
    }
    return null;
  });
  const updateZoneBlockProps = useBuilder((s) => s.updateZoneBlockProps);
  const updateGroupChildProps = useBuilder((s) => s.updateGroupChildProps);
  const zone: ZoneId = useBuilder((s) => {
    for (let i = 0; i < ZONE_KEYS.length; i++) {
      const found = findTopOrChild(s[ZONE_KEYS[i]] as Block[], blockId);
      if (found) return ZONE_IDS[i];
    }
    return 'body';
  });
  return {
    props: block?.props ?? {},
    set: (patch: Record<string, unknown>) => {
      if (parentGroupId) {
        updateGroupChildProps(parentGroupId, blockId, patch);
      } else {
        updateZoneBlockProps(zone, blockId, patch);
      }
    },
  };
}

/* ═══════════════════════════════════════════════════════════
   Field Schema - declarative field definitions
   ═══════════════════════════════════════════════════════════ */

type FieldDef =
  | { type: "text"; propKey: string; label: string; placeholder?: string }
  | { type: "textarea"; propKey: string; label: string; rows?: number }
  | { type: "select"; propKey: string; label: string; options: { value: string; label: string }[] }
  | { type: "toggle"; propKey: string; label: string }
  | { type: "range"; propKey: string; label: string; min?: number; max?: number; suffix?: string }
  /** Stock-image picker: a categorized grid of verified stock photos +
     a paste-your-own-URL input. Writes a URL to `propKey` (the block's
     `src`). */
  | { type: "image"; propKey: string; label: string }
  | { type: "static"; text: string }
  /** Custom action button rendered inline inside the inspector.
     Used by LayoutGroup's "Ungroup" affordance. The action reads
     the block's location in the store and mutates accordingly. */
  | { type: "action"; label: string; action: "ungroup" };

/* ── Chart fields ──
   A chart's kind is its `chartType` prop, so swapping it in place is one
   select. The two families take different data (series over categories vs.
   named parts of a whole), so each offers only the kinds its data can draw. */
const PANEL_FIELDS: FieldDef[] = [
  { type: "text", propKey: "subtitle", label: "Subtitle", placeholder: "e.g. (Stacked)" },
  { type: "toggle", propKey: "panel", label: "Framed panel" },
  { type: "text", propKey: "viewByCsv", label: "View by options", placeholder: "Asset type, Region" },
  { type: "range", propKey: "height", label: "Height", min: 200, max: 640, suffix: "px" },
];
const CATEGORY_CHART_FIELDS: FieldDef[] = [
  { type: "text", propKey: "title", label: "Title" },
  { type: "select", propKey: "chartType", label: "Chart type", options: [
    { value: "column", label: "Column" },
    { value: "stacked-column", label: "Stacked column" },
    { value: "bar", label: "Bar" },
    { value: "stacked-bar", label: "Stacked bar" },
    { value: "line", label: "Line" },
    { value: "spline", label: "Spline" },
    { value: "area", label: "Area" },
    { value: "stacked-area", label: "Stacked area" },
    { value: "combination", label: "Combination" },
  ]},
  ...PANEL_FIELDS,
];
const PART_CHART_FIELDS: FieldDef[] = [
  { type: "text", propKey: "title", label: "Title" },
  { type: "select", propKey: "chartType", label: "Chart type", options: [
    { value: "donut", label: "Donut" },
    { value: "pie", label: "Pie" },
  ]},
  { type: "text", propKey: "centerLabel", label: "Centre label (donut)", placeholder: "e.g. a total" },
  ...PANEL_FIELDS,
];


/* ── Stock-image picker ──
   Categorized grid of HTTP-200-verified stock photos (from
   src/lib/sampleImages.ts) plus a paste-your-own-URL input. Clicking a
   thumbnail writes that image's URL onto the block's `src` prop; the
   selected thumbnail gets a ring. URLs resolve anywhere (no API key), so
   exported code emits <img src="https://images...."> that just works. */
const CATEGORY_LABELS: Record<SampleImageCategory, string> = {
  "product-ui": "Product",
  people: "People",
  "office-business": "Office",
  "nature-lifestyle": "Nature",
  "abstract-texture": "Abstract",
};

function ImagePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  /* Default the open tab to the category of the current image, else the
     first category. */
  const initialCat =
    SAMPLE_IMAGES.find((img) => img.url === value)?.category ??
    SAMPLE_IMAGE_CATEGORIES[0];
  const [activeCat, setActiveCat] = React.useState<SampleImageCategory>(initialCat);
  const images = getImagesByCategory(activeCat);

  return (
    <div className="img-picker">
      <div className="img-picker-tabs" role="tablist" aria-label="Image categories">
        {SAMPLE_IMAGE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={cat === activeCat}
            className={`img-picker-tab${cat === activeCat ? " is-active" : ""}`}
            onClick={() => setActiveCat(cat)}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="img-picker-grid">
        {images.map((img) => {
          const selected = img.url === value;
          return (
            <button
              key={img.id}
              type="button"
              className={`img-picker-tile${selected ? " is-selected" : ""}`}
              title={img.alt}
              aria-label={img.alt}
              aria-pressed={selected}
              onClick={() => onChange(img.url)}
            >
              <img src={publicAssetUrl(img.url)} alt="" loading="lazy" />
              {selected ? (
                <span className="img-picker-check material-symbols-outlined" aria-hidden="true">
                  check
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <label className="img-picker-url-label">
        Or paste your own URL
        <input
          className="inspector-input img-picker-url"
          type="url"
          inputMode="url"
          placeholder="https://example.com/photo.jpg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>

      {value ? (
        <button
          type="button"
          className="img-picker-clear"
          onClick={() => onChange("")}
        >
          Clear image
        </button>
      ) : null}
    </div>
  );
}

/* ── Schema-driven inspector renderer ──
   Text/Select/Toggle render as the ACTIVE DS's real components (Salt/M3/Fluent)
   wrapped once in DsControlScope; the rest stay neutral. Carbon/uoaui fall back
   to neutral controls until their scope machinery lands (supportsDsControls).
   `useDs` is gated on client mount (same signal as DsControlScope) so the DS
   controls never render a frame before their provider exists. */
function SchemaFields({ blockId, fields }: { blockId: string; fields: FieldDef[] }) {
  const { props, set } = useBlockProps(blockId);
  const system = useBuilder((s) => s.designSystem) as SystemId;
  const mode = (useBuilder((s) => s.mode) === "dark" ? "dark" : "light") as Mode;
  const mounted = useMounted();
  const useDs = mounted && supportsDsControls(system);
  return (
    <DsControlScope system={system} mode={mode}>
      {fields.map((f, i) => {
        switch (f.type) {
          case "text":
            return (
              <InspectorField key={i} label={f.label}>
                {useDs ? (
                  <DsText system={system} ariaLabel={f.label} value={(props[f.propKey] as string) ?? ""} placeholder={f.placeholder}
                    onChange={(v) => set({ [f.propKey]: v })} />
                ) : (
                  <input className="inspector-input" type="text" value={(props[f.propKey] as string) ?? ""} placeholder={f.placeholder}
                    onChange={(e) => set({ [f.propKey]: e.target.value })} />
                )}
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
                {useDs ? (
                  <DsSelect system={system} ariaLabel={f.label} value={(props[f.propKey] as string) ?? f.options[0]?.value ?? ""} options={f.options}
                    onChange={(v) => set({ [f.propKey]: v })} />
                ) : (
                  <select className="inspector-select" value={(props[f.propKey] as string) ?? f.options[0]?.value}
                    onChange={(e) => set({ [f.propKey]: e.target.value })}>
                    {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                )}
              </InspectorField>
            );
          case "toggle": {
            const checked = Boolean(props[f.propKey]);
            return (
              <InspectorField key={i} label={f.label}>
                {useDs ? (
                  <DsToggle system={system} ariaLabel={f.label} checked={checked} onChange={(v) => set({ [f.propKey]: v })} />
                ) : (
                  <button className={`inspector-toggle-btn${checked ? " active" : ""}`} onClick={() => set({ [f.propKey]: !checked })} style={{ width: "100%" }}>
                    {checked ? "On" : "Off"}
                  </button>
                )}
              </InspectorField>
            );
          }
          case "range": {
            const val = Number(props[f.propKey] ?? f.min ?? 0);
            return (
              <InspectorField key={i} label={`${f.label} (${val}${f.suffix ?? ""})`}>
                <input className="inspector-input" type="range" aria-label={f.label} min={f.min ?? 0} max={f.max ?? 100} value={val}
                  onChange={(e) => set({ [f.propKey]: Number(e.target.value) })} style={{ width: "100%" }} />
              </InspectorField>
            );
          }
          case "image":
            return (
              <InspectorField key={i} label={f.label}>
                <ImagePicker
                  value={(props[f.propKey] as string) ?? ""}
                  onChange={(url) => set({ [f.propKey]: url })}
                />
              </InspectorField>
            );
          case "static":
            return <div key={i} style={{ padding: "4px 0", fontSize: 11, opacity: 0.5 }}>{f.text}</div>;
          case "action":
            return <ActionButton key={i} blockId={blockId} label={f.label} action={f.action} />;
        }
      })}
    </DsControlScope>
  );
}

/* ── Inspector action button (currently: Ungroup).
      Finds the block's zone by walking all four zones and calls
      the matching store mutation. Stays inside blockRegistry
      so TYPE_FIELDS can declare actions declaratively. */
function ActionButton({
  blockId,
  label,
  action,
}: {
  blockId: string;
  label: string;
  action: "ungroup";
}) {
  const ungroupBlock = useBuilder((s) => s.ungroupBlock);
  const setSelectedBlock = useBuilder((s) => s.setSelectedBlock);
  const zone: ZoneId = useBuilder((s) => {
    for (let i = 0; i < ZONE_KEYS.length; i++) {
      if (s[ZONE_KEYS[i]].some((b) => b.id === blockId)) return ZONE_IDS[i];
    }
    return "body";
  });

  const handleClick = () => {
    if (action === "ungroup") {
      ungroupBlock(zone, blockId);
      setSelectedBlock(null, null);
    }
  };

  return (
    <div className="inspector-field">
      <button
        type="button"
        className="inspector-toggle-btn"
        style={{ width: "100%" }}
        onClick={handleClick}
      >
        {label}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Block type definitions - data only, no hand-written components
   ═══════════════════════════════════════════════════════════ */

const STATUS_OPTIONS = [
  { value: "default", label: "Default" }, { value: "info", label: "Info" },
  { value: "success", label: "Success" }, { value: "warning", label: "Warning" }, { value: "error", label: "Error" },
];
const PRESENCE_OPTIONS = [
  { value: "", label: "None" }, { value: "available", label: "Available" },
  { value: "busy", label: "Busy" }, { value: "away", label: "Away" }, { value: "offline", label: "Offline" },
];
const TONE_OPTIONS = [
  { value: "surface", label: "Surface" }, { value: "dark", label: "Dark" },
  { value: "inverse", label: "Inverse" }, { value: "accent", label: "Accent" },
  { value: "transparent", label: "Transparent" },
];
const NAV_ICON_OPTIONS = [
  { value: "chat", label: "Chat" }, { value: "database", label: "Database" },
  { value: "settings", label: "Settings" }, { value: "bar_chart", label: "Bar Chart" },
  { value: "home", label: "Home" }, { value: "person", label: "Person" },
  { value: "search", label: "Search" }, { value: "notifications", label: "Notifications" },
  { value: "shield", label: "Shield" }, { value: "trending_up", label: "Trend" },
  { value: "layers", label: "Layers" }, { value: "filter", label: "Filter" },
];

interface BlockDef {
  type: string;
  label: string;
  icon: string;
  defaults: Record<string, unknown>;
  fields: FieldDef[];
}

const BLOCK_DEFS: BlockDef[] = [
  /* ── Layout primitives ── */
  {
    /* LayoutGroup: a container block that stacks (or rows) its
       children as a single draggable/resizable unit. Body-only for
       MVP; grid mode is explicitly out-of-scope. */
    type: "LayoutGroup",
    label: "Group column",
    icon: "view_agenda",
    defaults: { direction: "stack", gap: 12, padding: 0 },
    fields: [
      { type: "select", propKey: "direction", label: "Direction", options: [
        { value: "stack", label: "Stack (vertical)" },
        { value: "row", label: "Row (horizontal)" },
      ] },
      { type: "range", propKey: "gap", label: "Gap", min: 0, max: 48, suffix: "px" },
      { type: "range", propKey: "padding", label: "Padding", min: 0, max: 48, suffix: "px" },
      { type: "action", label: "Ungroup", action: "ungroup" },
    ],
  },
  {
    /* Spacer: a flow GUTTER — an empty, sized flex/grid child that pushes
       siblings apart. NOT a positioning device: it has no x/y, only a size
       on one axis. Exports as an aria-hidden div with a width|height token +
       flexShrink:0, so it stays responsive across all 5 design systems. */
    type: "Spacer",
    label: "Spacer",
    icon: "space_bar",
    defaults: { size: 24, axis: "h" },
    fields: [
      { type: "range", propKey: "size", label: "Size", min: 0, max: 400, suffix: "px" },
      { type: "select", propKey: "axis", label: "Axis", options: [
        { value: "h", label: "Horizontal" },
        { value: "v", label: "Vertical" },
      ] },
    ],
  },

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
  { type: "SimulatedImage", label: "Image", icon: "image", defaults: { alt: "Image", ratio: "16:9", caption: "", src: "" }, fields: [
    { type: "image", propKey: "src", label: "Image" },
    { type: "text", propKey: "alt", label: "Alt text" },
    { type: "select", propKey: "ratio", label: "Aspect ratio", options: [{ value: "16:9", label: "16:9 (wide)" }, { value: "4:3", label: "4:3" }, { value: "1:1", label: "1:1 (square)" }, { value: "3:2", label: "3:2" }, { value: "21:9", label: "21:9 (ultrawide)" }] },
    { type: "text", propKey: "caption", label: "Caption" },
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
    { type: "text", propKey: "label", label: "Label", placeholder: "e.g. Currency" },
    { type: "text", propKey: "value", label: "Selected value" },
    { type: "text", propKey: "optionsCsv", label: "Options (comma separated)", placeholder: "GBP, USD, EUR" },
    { type: "text", propKey: "placeholder", label: "Placeholder" },
  ]},

  /* ── Data Display ── */
  { type: "SimulatedDataTable", label: "Data Table", icon: "table_chart", defaults: {}, fields: [
    { type: "static", text: "Use the Describe bar above the table to fill it with AI, e.g. \"8 customers with plan and MRR\"." },
  ]},
  { type: "SimulatedProgress", label: "Progress Bar", icon: "percent", defaults: { label: "Uploading assets...", value: 50 }, fields: [
    { type: "text", propKey: "label", label: "Label" }, { type: "range", propKey: "value", label: "Value", max: 100, suffix: "%" },
  ]},
  { type: "SimulatedAvatar", label: "Avatar", icon: "account_circle", defaults: { initials: "AB", size: "md", presence: "available", src: "" }, fields: [
    { type: "image", propKey: "src", label: "Photo (optional)" },
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
  { type: "HighchartLine", label: "Line Chart", icon: "show_chart", defaults: { chartType: "line", title: "Monthly Revenue" }, fields: CATEGORY_CHART_FIELDS },
  { type: "HighchartArea", label: "Area Chart", icon: "area_chart", defaults: { chartType: "area", title: "User Growth" }, fields: CATEGORY_CHART_FIELDS },
  { type: "HighchartColumn", label: "Column Chart", icon: "insert_chart", defaults: { chartType: "column", title: "Sales by Region" }, fields: CATEGORY_CHART_FIELDS },
  { type: "HighchartPie", label: "Pie Chart", icon: "pie_chart", defaults: { chartType: "pie", title: "Market Share" }, fields: PART_CHART_FIELDS },
  { type: "HighchartScatter", label: "Scatter Plot", icon: "scatter_plot", defaults: { chartType: "scatter", title: "Risk vs Return" }, fields: [{ type: "text", propKey: "title", label: "Title" }] },
  { type: "HighchartBar", label: "Bar Chart", icon: "align_horizontal_left", defaults: { chartType: "bar", title: "Top Performers" }, fields: CATEGORY_CHART_FIELDS },
  { type: "HighchartDonut", label: "Donut Chart", icon: "donut_large", defaults: { chartType: "donut", title: "Portfolio Allocation" }, fields: PART_CHART_FIELDS },
  { type: "HighchartSpline", label: "Spline Chart", icon: "timeline", defaults: { chartType: "spline", title: "Temperature Trend" }, fields: CATEGORY_CHART_FIELDS },
  { type: "HighchartStackedColumn", label: "Stacked Column", icon: "stacked_bar_chart", defaults: { chartType: "stacked-column", title: "Revenue Breakdown" }, fields: CATEGORY_CHART_FIELDS },
  { type: "HighchartStackedBar", label: "Stacked Bar", icon: "stacked_bar_chart", defaults: { chartType: "stacked-bar", title: "Exposure by currency" }, fields: CATEGORY_CHART_FIELDS },
  { type: "HighchartStackedArea", label: "Stacked Area", icon: "area_chart", defaults: { chartType: "stacked-area", title: "Allocation history" }, fields: CATEGORY_CHART_FIELDS },
  { type: "HighchartCombination", label: "Combination Chart", icon: "multiline_chart", defaults: { chartType: "combination", title: "Value at risk" }, fields: CATEGORY_CHART_FIELDS },
  { type: "HighchartWaterfall", label: "Waterfall", icon: "waterfall_chart", defaults: { chartType: "waterfall", title: "Bridge" }, fields: CATEGORY_CHART_FIELDS },
  { type: "HighchartRadar", label: "Radar", icon: "radar", defaults: { chartType: "radar", title: "Capability profile" }, fields: CATEGORY_CHART_FIELDS },
  { type: "HighchartCorridor", label: "Pathway Corridor", icon: "ssid_chart", defaults: { chartType: "corridor", title: "Pathway" }, fields: CATEGORY_CHART_FIELDS },
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
  /* ── Report blocks: entity header, metric tile, verdict, launcher, hero ── */
  { type: "EntityHeader", label: "Entity Header", icon: "badge", defaults: { title: "Entity" }, fields: [
    { type: "text", propKey: "title", label: "Title" },
    { type: "text", propKey: "eyebrow", label: "Eyebrow" },
  ]},
  { type: "MetricTile", label: "Metric Tile", icon: "counter_1", defaults: { label: "Metric", value: "0" }, fields: [
    { type: "text", propKey: "label", label: "Label" },
    { type: "text", propKey: "value", label: "Value" },
  ]},
  { type: "VerdictCard", label: "Verdict Card", icon: "verified", defaults: { title: "Verdict" }, fields: [
    { type: "text", propKey: "title", label: "Title" },
    { type: "text", propKey: "chip", label: "Chip" },
    { type: "text", propKey: "footnote", label: "Footnote" },
  ]},
  { type: "LauncherCard", label: "Launcher Card", icon: "open_in_new", defaults: { title: "Report", description: "What this report shows.", actionLabel: "Open report" }, fields: [
    { type: "text", propKey: "title", label: "Title" },
    { type: "text", propKey: "tag", label: "Tag" },
    { type: "textarea", propKey: "description", label: "Description" },
    { type: "text", propKey: "actionLabel", label: "Button" },
  ]},
  { type: "HeroSearch", label: "Hero with Search", icon: "search", defaults: { title: "Analytics", subtitle: "Search for a report.", placeholder: "Search", buttonLabel: "Search" }, fields: [
    { type: "text", propKey: "title", label: "Title" },
    { type: "text", propKey: "subtitle", label: "Subtitle" },
    { type: "text", propKey: "placeholder", label: "Placeholder" },
    { type: "text", propKey: "buttonLabel", label: "Button" },
  ]},
  /* ── Record panel: the detail of the row a grid has selected ── */
  { type: "RecordPanel", label: "Record Detail", icon: "contact_page", defaults: { title: "Detail", height: 360, emptyText: "Select a row to see its detail." }, fields: [
    { type: "text", propKey: "title", label: "Title" },
    { type: "text", propKey: "emptyText", label: "Empty text" },
  ]},
  /* ── Data grid (AG Grid): grouped headers, pinned column, formatted numbers ── */
  { type: "DataGrid", label: "Data Grid", icon: "table_rows", defaults: {
      title: "Holdings", height: 320,
      columns: [
        { field: "name", header: "Holding", flex: 2 },
        { field: "class", header: "Asset class" },
        { field: "value", header: "Market value", kind: "currency", compact: true },
        { field: "weight", header: "Weight", kind: "percent" },
        { field: "ret", header: "1M return", kind: "percent", signed: true },
      ],
      rows: [
        { name: "Total", class: "", value: 48_600_000, weight: 100, ret: 1.84, _bold: true },
        { name: "Halden Capital Ord", class: "Equity", value: 18_200_000, weight: 37.45, ret: 3.1 },
        { name: "UK Gilt 3.75% 2038", class: "Government Bond", value: 14_900_000, weight: 30.66, ret: 0.9 },
        { name: "Tidewater Energy 5.1% 2031", class: "Corporate Bond", value: 9_700_000, weight: 19.96, ret: 1.4 },
        { name: "Sterling Liquidity Fund", class: "Cash", value: 5_800_000, weight: 11.93, ret: -0.1 },
      ],
    }, fields: [
    { type: "text", propKey: "title", label: "Title" },
    { type: "text", propKey: "subtitle", label: "Subtitle" },
    { type: "text", propKey: "viewByCsv", label: "View by options", placeholder: "Fund, Asset class" },
    { type: "range", propKey: "height", label: "Height", min: 200, max: 640, suffix: "px" },
  ]},

  /* ── Application chrome ── */
  { type: "TopNav", label: "Top Navigation", icon: "web_asset", defaults: { brand: "Brand", linksCsv: "Home, Products, Reports, Resources", active: "Home", tone: "dark", chevrons: false, account: "" }, fields: [
    { type: "text", propKey: "brand", label: "Brand" },
    { type: "select", propKey: "logo", label: "Logo", options: [{ value: "letter", label: "Letter mark" }, { value: "none", label: "None" }] },
    { type: "text", propKey: "linksCsv", label: "Links (comma separated)" },
    { type: "text", propKey: "active", label: "Active link" },
    { type: "toggle", propKey: "chevrons", label: "Menu chevrons" },
    { type: "text", propKey: "account", label: "Account name", placeholder: "\"none\" hides the account" },
    { type: "select", propKey: "tone", label: "Tone", options: TONE_OPTIONS },
  ]},
  { type: "InstrumentHeader", label: "Instrument Header", icon: "candlestick_chart", defaults: { symbol: "Instrument", note: "Sample data" }, fields: [
    { type: "text", propKey: "note", label: "Data note" },
  ]},
  { type: "ExecutionChart", label: "Execution Chart", icon: "show_chart", defaults: { height: 640 }, fields: [
    { type: "range", propKey: "height", label: "Height", min: 480, max: 960, suffix: "px" },
  ]},
  { type: "ContextBar", label: "Context Bar", icon: "tune", defaults: { title: "Page", tone: "surface", filters: [{ label: "Period", stateKey: "period", value: "Monthly", options: ["Daily", "Monthly", "Yearly"] }] }, fields: [
    { type: "text", propKey: "title", label: "Title" },
    { type: "select", propKey: "tone", label: "Tone", options: TONE_OPTIONS },
  ]},
  { type: "TabStrip", label: "Tab Strip", icon: "tab", defaults: { tabsCsv: "Overview, Reports, Settings", active: "Overview", tone: "dark", addButton: false }, fields: [
    { type: "text", propKey: "tabsCsv", label: "Tabs (comma separated)" },
    { type: "text", propKey: "active", label: "Active tab" },
    { type: "toggle", propKey: "addButton", label: "Add button" },
    { type: "select", propKey: "tone", label: "Tone", options: TONE_OPTIONS },
  ]},
  { type: "PageTitle", label: "Page Title", icon: "title", defaults: { text: "Page title" }, fields: [
    { type: "text", propKey: "text", label: "Title" },
    { type: "text", propKey: "caption", label: "Caption" },
  ]},
  { type: "NavGroup", label: "Nav Group Label", icon: "segment", defaults: { label: "Section" }, fields: [
    { type: "text", propKey: "label", label: "Label" },
  ]},
  { type: "FooterText", label: "Footer Text", icon: "short_text", defaults: { label: "Footer text", version: "v1.0" }, fields: [
    { type: "text", propKey: "label", label: "Text" }, { type: "text", propKey: "version", label: "Version" },
  ]},
];

/* ═══════════════════════════════════════════════════════════
   Lookup helpers - same public API as before
   ═══════════════════════════════════════════════════════════ */

/** Library blueprints for drag-and-drop */
export const LIBRARY_BLUEPRINTS = BLOCK_DEFS.map((b, i) => ({
  id: `lib-${i}`,
  type: b.type,
  label: b.label,
  icon: b.icon,
  defaults: b.defaults,
}));

/* ── Library search aliases (synonyms) ──
   The library search matches block label + type. These extra keywords let
   users find blocks by what they call them ("photo" -> Image, "kpi" -> Stat
   Card, "graph" -> a chart) so search doesn't dead-end on exact wording.
   Curated for the common misses; absent types just fall back to label/type. */
export const SEARCH_ALIASES: Record<string, string[]> = {
  Spacer: ["gap", "space", "divider", "blank", "empty", "gutter"],
  SimulatedImage: ["photo", "picture", "media", "pic", "img", "thumbnail", "hero image"],
  SimulatedButton: ["cta", "btn", "action", "submit"],
  SimulatedTextInput: ["field", "textbox", "text field", "form field"],
  SimulatedMultilineInput: ["textarea", "multiline", "paragraph input"],
  SimulatedDataTable: ["grid", "spreadsheet", "rows", "data grid"],
  SimulatedStatCard: ["kpi", "metric", "stat", "number"],
  SimulatedDropdown: ["select", "picker", "menu"],
  SimulatedComboBox: ["autocomplete", "typeahead", "search select"],
  SimulatedCheckbox: ["tickbox", "check"],
  SimulatedSwitch: ["toggle"],
  SimulatedSearchbox: ["search", "filter", "find"],
  SimulatedDatePicker: ["calendar", "date"],
  SimulatedNavDrawer: ["menu", "navigation", "side nav"],
  SimulatedTabs: ["segments", "tab bar"],
  SimulatedAvatar: ["profile", "user", "person"],
  SimulatedBadge: ["tag", "chip", "status label"],
  SimulatedPill: ["chip", "tag"],
  Alert: ["notification", "banner", "toast", "message"],
  SimulatedTitle: ["heading", "headline", "h1", "h2", "title"],
  SimulatedProgress: ["progress bar", "loading", "loader"],
  SimulatedSkeleton: ["loading", "placeholder", "shimmer"],
  HighchartLine: ["graph", "trend", "line graph"],
  HighchartColumn: ["bar chart", "graph", "bars"],
  HighchartBar: ["bar chart", "graph"],
  HighchartPie: ["pie", "share"],
  HighchartDonut: ["donut", "doughnut", "ring chart"],
};

/* ── Semantic sub-categories for the body-zone tile grid ──
   Used by ComponentLibrary to break ~45 tiles into expand/collapse
   accordions so users don't scroll an endless wall. Zone-specific
   types (AppBrand, StatusPill, NavItem, FooterText) are not in this
   map — they're grouped by zone already and don't need sub-cats. */
export type LibraryCategory =
  | "actions"
  | "inputs"
  | "data-display"
  | "charts"
  | "navigation"
  | "feedback"
  | "containment"
  | "content"
  | "layout";

export const LIBRARY_CATEGORY_ORDER: {
  key: LibraryCategory;
  label: string;
  icon: string;
}[] = [
  { key: "actions",      label: "Actions",      icon: "smart_button" },
  { key: "inputs",       label: "Inputs",       icon: "input" },
  { key: "data-display", label: "Data display", icon: "data_object" },
  { key: "charts",       label: "Charts",       icon: "bar_chart" },
  { key: "navigation",   label: "Navigation",   icon: "menu" },
  { key: "feedback",     label: "Feedback",     icon: "info" },
  { key: "containment",  label: "Containment",  icon: "inventory_2" },
  { key: "content",      label: "Content",      icon: "subject" },
  { key: "layout",       label: "Layout",       icon: "space_bar" },
];

export const BLOCK_CATEGORY: Record<string, LibraryCategory> = {
  /* Layout */
  Spacer: "layout",

  /* Actions */
  SimulatedButton: "actions",
  SimulatedToggleButton: "actions",
  SimulatedSegmentedGroup: "actions",
  SimulatedLink: "actions",

  /* Inputs */
  SimulatedTextInput: "inputs",
  SimulatedMultilineInput: "inputs",
  SimulatedNumberInput: "inputs",
  SimulatedDatePicker: "inputs",
  SimulatedSlider: "inputs",
  SimulatedCheckbox: "inputs",
  SimulatedRadioGroup: "inputs",
  SimulatedSwitch: "inputs",
  SimulatedDropdown: "inputs",
  SimulatedComboBox: "inputs",
  SimulatedSearchbox: "inputs",
  SimulatedRating: "inputs",
  SimulatedTokenizedInput: "inputs",
  SimulatedFileDropZone: "inputs",

  /* Data display */
  SimulatedDataTable: "data-display",
  DataGrid: "data-display",
  SimulatedStatCard: "data-display",
  SimulatedListBox: "data-display",
  SimulatedTree: "data-display",
  SimulatedProgress: "data-display",
  SimulatedAvatar: "data-display",
  SimulatedAvatarGroup: "data-display",
  SimulatedBadge: "data-display",
  SimulatedPill: "data-display",
  SimulatedPersona: "data-display",

  /* Charts */
  SimulatedChart: "charts",
  HighchartLine: "charts",
  HighchartArea: "charts",
  HighchartColumn: "charts",
  HighchartPie: "charts",
  HighchartScatter: "charts",
  HighchartBar: "charts",
  HighchartDonut: "charts",
  HighchartSpline: "charts",
  HighchartStackedColumn: "charts",
  HighchartGauge: "charts",
  HighchartHeatmap: "charts",
  HighchartTreemap: "charts",
  HighchartCombination: "charts",
  HighchartWaterfall: "charts",
  HighchartRadar: "charts",
  HighchartCorridor: "charts",
  HighchartStackedBar: "charts",
  HighchartStackedArea: "charts",

  /* Navigation */
  PageTitle: "content",
  TopNav: "navigation",
  TabStrip: "navigation",
  ContextBar: "navigation",
  InstrumentHeader: "navigation",
  ExecutionChart: "charts",
  NavGroup: "navigation",
  SimulatedTabs: "navigation",
  SimulatedBreadcrumb: "navigation",
  SimulatedNavDrawer: "navigation",

  /* Feedback */
  Alert: "feedback",
  SimulatedSkeleton: "feedback",
  SimulatedTooltip: "feedback",
  SimulatedPopover: "feedback",
  SimulatedDialog: "feedback",

  /* Containment */
  SimulatedCard: "containment",
  SimulatedAccordion: "containment",
  LayoutGroup: "containment",

  /* Content */
  SimulatedTitle: "content",
  SimulatedImage: "content",
  SimulatedChatMessage: "content",
};

export function categoryFor(type: string): LibraryCategory | null {
  return BLOCK_CATEGORY[type] ?? null;
}

/** type → Fields component (for PropertiesInspector) - auto-generated from schema */
export const TYPE_FIELDS: Record<string, React.FC<{ blockId: string }>> =
  Object.fromEntries(BLOCK_DEFS.map((b) => [
    b.type,
    ({ blockId }: { blockId: string }) => <SchemaFields blockId={blockId} fields={b.fields} />,
  ]));
