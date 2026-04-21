"use client";

import React from "react";

/* ══════════════════════════════════════════════════════════
   MiniPreview - stylized per-component-type mini-renders.
   Used in the component library tiles (80×50) and in the
   hover preview fly-out (240×140).

   Each "category" below renders a lightweight SVG shape that
   captures the component's silhouette well enough for users
   to recognize it at a glance. This is deliberately NOT a
   real rendering - that would be 60+ full-component loads
   just for the panel.

   Categorization keeps us to ~10 shapes instead of 60 bespoke
   SVGs. ZONE icons fall through to a generic outlined square
   with a material symbol in the center.
   ══════════════════════════════════════════════════════════ */

const ACCENT = "#9484D6";
const FG = "currentColor";
const MUTED = "rgba(128, 128, 128, 0.35)";
const BG = "rgba(128, 128, 128, 0.15)";

type Category =
  | "layout-group"  // LayoutGroup (Group column)
  | "action"        // Button, ToggleButton, SegmentedGroup
  | "input"         // TextInput, NumberInput, Searchbox, etc.
  | "binary"        // Checkbox, Switch
  | "status"        // Badge, Pill
  | "avatar"        // Avatar, Persona
  | "avatar-group"  // AvatarGroup
  | "container"     // Card, Accordion, Dialog, Alert
  | "stat"          // StatCard, Progress
  | "data"          // DataTable, ListBox, Tree, NavDrawer
  | "chart-line"    // HighchartLine, HighchartArea, HighchartSpline
  | "chart-bar"     // HighchartColumn, HighchartBar, HighchartStackedColumn, SimulatedChart
  | "chart-pie"     // HighchartPie, HighchartDonut, HighchartGauge
  | "chart-scatter" // HighchartScatter
  | "chart-grid"    // HighchartHeatmap, HighchartTreemap
  | "text"          // Title, Link
  | "breadcrumb"    // Breadcrumb
  | "tabs"          // Tabs
  | "slider"        // Slider, Rating
  | "radio"         // RadioGroup
  | "tooltip"       // Tooltip, Popover
  | "skeleton"      // Skeleton
  | "date"          // DatePicker
  | "dropdown"      // Dropdown, ComboBox
  | "filedrop"      // FileDropZone
  | "chat"          // ChatMessage
  | "zone-brand"    // AppBrand
  | "zone-status"   // StatusPill
  | "zone-nav"      // NavItem
  | "zone-footer"   // FooterText
  | "generic";

const CATEGORY_BY_TYPE: Record<string, Category> = {
  /* Layout primitives */
  LayoutGroup: "layout-group",

  /* Actions */
  SimulatedButton: "action",
  SimulatedToggleButton: "action",
  SimulatedSegmentedGroup: "action",

  /* Inputs */
  SimulatedTextInput: "input",
  SimulatedNumberInput: "input",
  SimulatedMultilineInput: "input",
  SimulatedSearchbox: "input",
  SimulatedTokenizedInput: "input",

  /* Binary toggles */
  SimulatedCheckbox: "binary",
  SimulatedSwitch: "binary",

  /* Status chips */
  SimulatedBadge: "status",
  SimulatedPill: "status",

  /* Avatars */
  SimulatedAvatar: "avatar",
  SimulatedPersona: "avatar",
  SimulatedAvatarGroup: "avatar-group",

  /* Containers */
  SimulatedCard: "container",
  SimulatedAccordion: "container",
  SimulatedDialog: "container",
  Alert: "container",

  /* Stats */
  SimulatedStatCard: "stat",
  SimulatedProgress: "stat",

  /* Data */
  SimulatedDataTable: "data",
  SimulatedListBox: "data",
  SimulatedTree: "data",
  SimulatedNavDrawer: "data",

  /* Charts */
  SimulatedChart: "chart-bar",
  HighchartLine: "chart-line",
  HighchartArea: "chart-line",
  HighchartSpline: "chart-line",
  HighchartColumn: "chart-bar",
  HighchartBar: "chart-bar",
  HighchartStackedColumn: "chart-bar",
  HighchartPie: "chart-pie",
  HighchartDonut: "chart-pie",
  HighchartGauge: "chart-pie",
  HighchartScatter: "chart-scatter",
  HighchartHeatmap: "chart-grid",
  HighchartTreemap: "chart-grid",

  /* Text */
  SimulatedTitle: "text",
  SimulatedLink: "text",

  /* Breadcrumb */
  SimulatedBreadcrumb: "breadcrumb",

  /* Tabs */
  SimulatedTabs: "tabs",

  /* Slider / rating */
  SimulatedSlider: "slider",
  SimulatedRating: "slider",

  /* Radio */
  SimulatedRadioGroup: "radio",

  /* Tooltip / popover */
  SimulatedTooltip: "tooltip",
  SimulatedPopover: "tooltip",

  /* Skeleton */
  SimulatedSkeleton: "skeleton",

  /* Date / dropdown / filedrop / chat */
  SimulatedDatePicker: "date",
  SimulatedDropdown: "dropdown",
  SimulatedComboBox: "dropdown",
  SimulatedFileDropZone: "filedrop",
  SimulatedChatMessage: "chat",

  /* Zone blocks */
  AppBrand: "zone-brand",
  StatusPill: "zone-status",
  NavItem: "zone-nav",
  FooterText: "zone-footer",
};

function categoryFor(type: string): Category {
  return CATEGORY_BY_TYPE[type] ?? "generic";
}

/* ── Shape renderers - each fills the 80×50 viewBox and draws
 *    a recognizable silhouette for the category. ── */

function Action() {
  return (
    <>
      <rect x="8" y="18" width="64" height="14" rx="4" fill={ACCENT} />
    </>
  );
}
function Input() {
  return (
    <>
      <rect x="8" y="14" width="64" height="22" rx="3" fill="none" stroke={MUTED} strokeWidth="1" />
      <line x1="14" y1="20" x2="14" y2="30" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="18" y="23" width="26" height="4" rx="1" fill={BG} />
    </>
  );
}
function Binary() {
  return (
    <>
      {/* Switch-style: pill with dot on the right (active) */}
      <rect x="20" y="20" width="26" height="12" rx="6" fill={ACCENT} opacity="0.3" />
      <circle cx="40" cy="26" r="5" fill={ACCENT} />
      <rect x="52" y="23" width="20" height="3" rx="1" fill={BG} />
      <rect x="52" y="28" width="14" height="3" rx="1" fill={BG} />
    </>
  );
}
function Status() {
  return (
    <>
      <rect x="16" y="17" width="22" height="10" rx="5" fill={ACCENT} opacity="0.5" />
      <rect x="42" y="17" width="18" height="10" rx="5" fill={MUTED} />
      <rect x="16" y="31" width="28" height="10" rx="5" fill={MUTED} />
    </>
  );
}
function Avatar() {
  return (
    <>
      <circle cx="20" cy="25" r="10" fill={ACCENT} opacity="0.6" />
      <rect x="36" y="20" width="30" height="4" rx="1" fill={BG} />
      <rect x="36" y="27" width="20" height="3" rx="1" fill={MUTED} />
    </>
  );
}
function AvatarGroup() {
  return (
    <>
      {[18, 28, 38, 48].map((cx, i) => (
        <circle key={cx} cx={cx} cy={25} r="8" fill={i === 0 ? ACCENT : BG} stroke={FG} strokeWidth="1.5" strokeOpacity="0.2" />
      ))}
      <circle cx="58" cy="25" r="8" fill={MUTED} />
    </>
  );
}
function Container() {
  return (
    <>
      <rect x="8" y="8" width="64" height="34" rx="3" fill="none" stroke={MUTED} strokeWidth="1" />
      <rect x="12" y="13" width="28" height="4" rx="1" fill={ACCENT} opacity="0.7" />
      <rect x="12" y="21" width="52" height="2.5" rx="1" fill={BG} />
      <rect x="12" y="26" width="46" height="2.5" rx="1" fill={BG} />
      <rect x="12" y="31" width="38" height="2.5" rx="1" fill={BG} />
    </>
  );
}
function Stat() {
  return (
    <>
      <rect x="8" y="8" width="64" height="34" rx="3" fill="none" stroke={MUTED} strokeWidth="1" />
      <rect x="12" y="12" width="20" height="3" rx="1" fill={BG} />
      <rect x="12" y="18" width="28" height="8" rx="1" fill={ACCENT} />
      <rect x="12" y="32" width="40" height="3" rx="1" fill={ACCENT} opacity="0.5" />
      <rect x="54" y="32" width="14" height="3" rx="1" fill={BG} />
    </>
  );
}
function Data() {
  return (
    <>
      <rect x="6" y="8" width="68" height="34" rx="2" fill="none" stroke={MUTED} strokeWidth="1" />
      <line x1="6" y1="16" x2="74" y2="16" stroke={MUTED} strokeWidth="0.75" />
      <line x1="6" y1="22" x2="74" y2="22" stroke={MUTED} strokeWidth="0.5" />
      <line x1="6" y1="28" x2="74" y2="28" stroke={MUTED} strokeWidth="0.5" />
      <line x1="6" y1="34" x2="74" y2="34" stroke={MUTED} strokeWidth="0.5" />
      <rect x="10" y="11" width="18" height="3" rx="1" fill={BG} />
      <rect x="10" y="18" width="14" height="2.5" rx="1" fill={BG} />
      <rect x="10" y="24" width="18" height="2.5" rx="1" fill={BG} />
      <rect x="10" y="30" width="12" height="2.5" rx="1" fill={BG} />
      <rect x="10" y="36" width="16" height="2.5" rx="1" fill={BG} />
      <rect x="54" y="11" width="16" height="3" rx="1.5" fill={ACCENT} opacity="0.4" />
    </>
  );
}
function ChartLine() {
  return (
    <>
      <rect x="8" y="8" width="64" height="34" rx="2" fill="none" stroke={MUTED} strokeWidth="1" />
      <path
        d="M 12 34 L 22 28 L 32 32 L 42 20 L 52 25 L 62 14 L 68 18"
        fill="none"
        stroke={ACCENT}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 12 34 L 22 28 L 32 32 L 42 20 L 52 25 L 62 14 L 68 18 L 68 40 L 12 40 Z"
        fill={ACCENT}
        opacity="0.2"
      />
    </>
  );
}
function ChartBar() {
  return (
    <>
      <rect x="8" y="8" width="64" height="34" rx="2" fill="none" stroke={MUTED} strokeWidth="1" />
      {[
        { x: 14, h: 18 },
        { x: 24, h: 26 },
        { x: 34, h: 14 },
        { x: 44, h: 22 },
        { x: 54, h: 30 },
        { x: 64, h: 20 },
      ].map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={40 - b.h}
          width="6"
          height={b.h}
          rx="1"
          fill={i === 4 ? ACCENT : ACCENT}
          opacity={i === 4 ? 1 : 0.45}
        />
      ))}
    </>
  );
}
function ChartPie() {
  return (
    <>
      <circle cx="40" cy="25" r="15" fill="none" stroke={MUTED} strokeWidth="1.5" />
      <path d="M 40 25 L 40 10 A 15 15 0 0 1 53 32 Z" fill={ACCENT} />
      <path d="M 40 25 L 53 32 A 15 15 0 0 1 32 37 Z" fill={ACCENT} opacity="0.55" />
    </>
  );
}
function ChartScatter() {
  return (
    <>
      <rect x="8" y="8" width="64" height="34" rx="2" fill="none" stroke={MUTED} strokeWidth="1" />
      {[
        [16, 34], [22, 30], [26, 25], [30, 28], [36, 20], [40, 22],
        [46, 18], [52, 24], [58, 16], [62, 30], [66, 22],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.8" fill={ACCENT} opacity={0.5 + (i % 3) * 0.15} />
      ))}
    </>
  );
}
function ChartGrid() {
  return (
    <>
      <rect x="8" y="8" width="64" height="34" rx="2" fill="none" stroke={MUTED} strokeWidth="1" />
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1, 2, 3, 4, 5, 6].map((col) => {
          const i = row * 7 + col;
          const opacity = ((i * 37) % 10) / 10;
          return (
            <rect
              key={`${row}-${col}`}
              x={12 + col * 8}
              y={13 + row * 6}
              width="6"
              height="4"
              rx="1"
              fill={ACCENT}
              opacity={opacity * 0.9 + 0.1}
            />
          );
        })
      )}
    </>
  );
}
function Text() {
  return (
    <>
      <rect x="8" y="14" width="42" height="6" rx="1" fill={ACCENT} opacity="0.7" />
      <rect x="8" y="24" width="62" height="3" rx="1" fill={BG} />
      <rect x="8" y="30" width="52" height="3" rx="1" fill={BG} />
      <rect x="8" y="36" width="30" height="3" rx="1" fill={BG} />
    </>
  );
}
function Breadcrumb() {
  return (
    <>
      {[14, 30, 48, 62].map((x, i) => (
        <rect
          key={x}
          x={x}
          y={22}
          width={i === 3 ? 8 : 12}
          height="6"
          rx="1.5"
          fill={i === 3 ? ACCENT : BG}
          opacity={i === 3 ? 0.9 : 1}
        />
      ))}
      <text x="25" y="26.5" fontSize="6" fill={MUTED} textAnchor="middle">›</text>
      <text x="41" y="26.5" fontSize="6" fill={MUTED} textAnchor="middle">›</text>
      <text x="56" y="26.5" fontSize="6" fill={MUTED} textAnchor="middle">›</text>
    </>
  );
}
function Tabs() {
  return (
    <>
      <line x1="8" y1="20" x2="72" y2="20" stroke={MUTED} strokeWidth="1" />
      <rect x="10" y="13" width="14" height="7" rx="1" fill={ACCENT} opacity="0.85" />
      <line x1="10" y1="19.5" x2="24" y2="19.5" stroke={ACCENT} strokeWidth="1.5" />
      <rect x="28" y="15" width="12" height="5" rx="1" fill={BG} />
      <rect x="44" y="15" width="12" height="5" rx="1" fill={BG} />
      <rect x="60" y="15" width="10" height="5" rx="1" fill={BG} />
      <rect x="10" y="28" width="56" height="3" rx="1" fill={BG} opacity="0.6" />
      <rect x="10" y="34" width="44" height="3" rx="1" fill={BG} opacity="0.4" />
    </>
  );
}
function Slider() {
  return (
    <>
      <line x1="12" y1="25" x2="68" y2="25" stroke={MUTED} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="25" x2="42" y2="25" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="42" cy="25" r="4" fill={ACCENT} />
    </>
  );
}
function Radio() {
  return (
    <>
      {[12, 22, 32].map((cy, i) => (
        <g key={cy}>
          <circle cx="14" cy={cy + 5} r="4" fill="none" stroke={MUTED} strokeWidth="1" />
          {i === 0 && <circle cx="14" cy={cy + 5} r="2" fill={ACCENT} />}
          <rect x="22" y={cy + 3.5} width={30 - i * 4} height="3" rx="1" fill={BG} />
        </g>
      ))}
    </>
  );
}
function Tooltip() {
  return (
    <>
      <rect x="20" y="12" width="44" height="18" rx="4" fill={ACCENT} opacity="0.85" />
      <path d="M 36 30 L 40 36 L 44 30 Z" fill={ACCENT} opacity="0.85" />
      <rect x="24" y="17" width="30" height="2.5" rx="1" fill="rgba(255,255,255,0.85)" />
      <rect x="24" y="22" width="20" height="2.5" rx="1" fill="rgba(255,255,255,0.55)" />
    </>
  );
}
function Skeleton() {
  return (
    <>
      <rect x="8" y="14" width="50" height="4" rx="2" fill={BG} />
      <rect x="8" y="22" width="62" height="4" rx="2" fill={BG} opacity="0.7" />
      <rect x="8" y="30" width="38" height="4" rx="2" fill={BG} opacity="0.5" />
    </>
  );
}
function Date() {
  return (
    <>
      <rect x="12" y="10" width="56" height="32" rx="3" fill="none" stroke={MUTED} strokeWidth="1" />
      <line x1="12" y1="17" x2="68" y2="17" stroke={MUTED} strokeWidth="0.75" />
      {[0, 1, 2, 3, 4].map((col) => (
        [0, 1].map((row) => (
          <rect
            key={`${col}-${row}`}
            x={17 + col * 10}
            y={22 + row * 9}
            width="5"
            height="5"
            rx="0.5"
            fill={col === 2 && row === 0 ? ACCENT : BG}
          />
        ))
      ))}
    </>
  );
}
function Dropdown() {
  return (
    <>
      <rect x="10" y="14" width="60" height="14" rx="3" fill="none" stroke={MUTED} strokeWidth="1" />
      <rect x="14" y="19" width="28" height="4" rx="1" fill={BG} />
      <path d="M 58 19 L 62 23 L 66 19" fill="none" stroke={ACCENT} strokeWidth="1.25" strokeLinecap="round" />
      <rect x="10" y="30" width="60" height="10" rx="2" fill={ACCENT} opacity="0.12" stroke={MUTED} strokeWidth="0.75" />
    </>
  );
}
function FileDrop() {
  return (
    <>
      <rect x="8" y="8" width="64" height="34" rx="3" fill="none" stroke={ACCENT} strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
      <path d="M 40 17 L 40 30 M 34 23 L 40 17 L 46 23" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="28" y="33" width="24" height="2.5" rx="1" fill={BG} />
    </>
  );
}
function Chat() {
  return (
    <>
      <rect x="8" y="11" width="40" height="12" rx="5" fill={BG} />
      <rect x="32" y="28" width="40" height="12" rx="5" fill={ACCENT} opacity="0.6" />
    </>
  );
}
function ZoneBrand() {
  return (
    <>
      <rect x="18" y="18" width="14" height="14" rx="3" fill={ACCENT} opacity="0.85" />
      <rect x="36" y="22" width="28" height="3.5" rx="1" fill={BG} />
      <rect x="36" y="28" width="18" height="2.5" rx="1" fill={MUTED} />
    </>
  );
}
function ZoneStatus() {
  return (
    <>
      <rect x="22" y="20" width="36" height="10" rx="5" fill={ACCENT} opacity="0.25" stroke={ACCENT} strokeWidth="1" />
      <circle cx="28" cy="25" r="2.5" fill={ACCENT} />
      <rect x="34" y="23" width="20" height="4" rx="1" fill={ACCENT} opacity="0.55" />
    </>
  );
}
function ZoneNav() {
  return (
    <>
      {[14, 22, 30].map((y, i) => (
        <g key={y}>
          <rect x="12" y={y} width="3" height="3" rx="0.5" fill={i === 0 ? ACCENT : MUTED} />
          <rect x="18" y={y + 0.5} width={i === 0 ? 30 : 24} height="2" rx="1" fill={i === 0 ? ACCENT : BG} opacity={i === 0 ? 0.9 : 0.6} />
        </g>
      ))}
    </>
  );
}
function ZoneFooter() {
  return (
    <>
      <line x1="8" y1="20" x2="72" y2="20" stroke={MUTED} strokeWidth="0.75" />
      <rect x="12" y="27" width="28" height="3" rx="1" fill={BG} />
      <rect x="46" y="27" width="22" height="3" rx="1" fill={MUTED} />
    </>
  );
}
function Generic() {
  return (
    <>
      <rect x="12" y="12" width="56" height="26" rx="3" fill={BG} stroke={MUTED} strokeWidth="0.75" />
      <circle cx="40" cy="25" r="4" fill={ACCENT} opacity="0.6" />
    </>
  );
}

function LayoutGroupShape() {
  /* Three stacked bars inside a container - reads immediately as
     "a column of blocks". Matches the user's "3 progress bars
     on top of each other" mental model for the feature. */
  return (
    <>
      <rect x="18" y="8" width="44" height="34" rx="3" fill="none" stroke={ACCENT} strokeDasharray="2 2" strokeWidth="0.9" />
      <rect x="22" y="12" width="36" height="7" rx="1.5" fill={ACCENT} opacity="0.55" />
      <rect x="22" y="22" width="36" height="7" rx="1.5" fill={ACCENT} opacity="0.55" />
      <rect x="22" y="32" width="36" height="7" rx="1.5" fill={ACCENT} opacity="0.55" />
    </>
  );
}

const RENDERERS: Record<Category, React.FC> = {
  "layout-group": LayoutGroupShape,
  action: Action,
  input: Input,
  binary: Binary,
  status: Status,
  avatar: Avatar,
  "avatar-group": AvatarGroup,
  container: Container,
  stat: Stat,
  data: Data,
  "chart-line": ChartLine,
  "chart-bar": ChartBar,
  "chart-pie": ChartPie,
  "chart-scatter": ChartScatter,
  "chart-grid": ChartGrid,
  text: Text,
  breadcrumb: Breadcrumb,
  tabs: Tabs,
  slider: Slider,
  radio: Radio,
  tooltip: Tooltip,
  skeleton: Skeleton,
  date: Date,
  dropdown: Dropdown,
  filedrop: FileDrop,
  chat: Chat,
  "zone-brand": ZoneBrand,
  "zone-status": ZoneStatus,
  "zone-nav": ZoneNav,
  "zone-footer": ZoneFooter,
  generic: Generic,
};

export function MiniPreview({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const cat = categoryFor(type);
  const Shape = RENDERERS[cat];
  return (
    <svg
      viewBox="0 0 80 50"
      width="100%"
      height="100%"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={`${type} preview`}
    >
      <Shape />
    </svg>
  );
}
