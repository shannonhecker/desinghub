/**
 * ComponentAPIRegistry (roadmap P2) — the single source of truth that turns a
 * builder block into REAL design-system component JSX, sourced from each DS's
 * official API. Replaces reactExporter's generic `className="btn"` pseudocode
 * so generated code actually imports + uses the real components.
 *
 * Seeded with all five DSs: Salt, Material 3 (@mui/material), Fluent 2
 * (@fluentui/react-components), Carbon (@carbon/react), and uoaui — the in-house
 * DS, which has no npm package: it is className + --a-* token CSS, so it emits
 * a-* classNames + a side-effect stylesheet import rather than component imports.
 * We never fabricate an API; each DS's facts are sourced from its official
 * package surface (Salt sentiment/appearance, MUI variant/color, Fluent
 * appearance, Carbon kind/labelText, uoaui a-* classes) cross-checked against
 * src/data/<ds>. Where a block has no real per-DS equivalent (e.g. Carbon ships
 * no Avatar/Rating/Tree-list, uoaui ships no slider/skeleton), the block is
 * intentionally OMITTED so reactExporter falls back to honest generic markup
 * rather than emit a fabricated component or prop.
 *
 * Whole-canvas coverage (roadmap P2 / issue #2): the original five blocks
 * (Button/TextInput/Checkbox/Switch/Card) are extended to ~38 more blocks per
 * DS. Mappings + honest omissions are sourced from a verified per-DS blueprint
 * (research + adversarial verify); corrections from the verify pass are applied
 * (MUI NumberInput slotProps over deprecated inputProps; Salt lab/core split
 * imports for Metric/ContactDetails/TokenizedInput composites).
 */

import { jsxText, jsxAttr } from "./export/escape";

export type SystemId = "salt" | "m3" | "fluent" | "carbon" | "uoaui";

/** A single package's named imports, or a side-effect import when names=[]. */
export interface ImportSpec {
  from: string;
  names: string[];
}

/** A block's import requirement: a single package's spec, an array of specs
    (multi-package composite), or a prop-aware function returning specs (when a
    composite's icon import depends on the block's props). */
export type ImportRequirement =
  | ImportSpec
  | ImportSpec[]
  | ((props: Record<string, unknown>) => ImportSpec[]);

export interface ComponentApiEntry {
  /** The real import(s) this block needs. A composite may span packages (e.g.
      Salt Metric from lab + Card from core, or MUI Tree from two x-tree-view
      entry points), so imports may be one spec, an array, or a prop-fn. */
  imports: ImportRequirement;
  /** Render the real DS-component JSX string for a builder block's props. */
  toJsx: (props: Record<string, unknown>) => string;
}

const s = (v: unknown, fallback = ""): string => String(v ?? fallback);

/* Carbon's TextInput/Checkbox/Toggle/etc require a unique `id` — derive a stable
   slug from the label so generated code is valid out of the box. */
const slug = (v: unknown, fallback = "field"): string =>
  s(v).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || fallback;

/* Split a comma-separated builder field ("Day, Week, Month") into trimmed,
   non-empty items. Used by tabs/segmented/radio/breadcrumb/listbox/etc. */
const csv = (v: unknown, fallback: string[] = []): string[] => {
  const parts = s(v)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return parts.length ? parts : fallback;
};

/* Coerce a builder field to a finite number. User/AI content can be a string
   like "12%", and `Number("12%")` is NaN — `?? fallback` only catches null, so
   `value={${num(p.pct, 0)}}` could emit `value={NaN}`. This guards it. */
const num = (v: unknown, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/* Parse a tree CSV of "Parent > Child > Grandchild" paths into a nested map.
   Returns an ordered tree of { label, children } nodes. */
interface TreeNodeData {
  label: string;
  children: TreeNodeData[];
}
function parseTree(v: unknown, fallback: string[] = []): TreeNodeData[] {
  const paths = csv(v, fallback).map((p) => p.split(">").map((seg) => seg.trim()).filter(Boolean));
  const roots: TreeNodeData[] = [];
  for (const path of paths) {
    let level = roots;
    for (const label of path) {
      let node = level.find((n) => n.label === label);
      if (!node) {
        node = { label, children: [] };
        level.push(node);
      }
      level = node.children;
    }
  }
  return roots;
}

/* ════════════════════════════════════════════════════════════════════
   SALT — @salt-ds/core (production) + @salt-ds/lab (RC) + @salt-ds/icons
   ════════════════════════════════════════════════════════════════════ */

const SALT_CORE = "@salt-ds/core";
const SALT_LAB = "@salt-ds/lab";
const SALT_ICONS = "@salt-ds/icons";

/* Generic block `variant` -> Salt's official sentiment + appearance.
   Salt API: sentiment = accented|neutral|positive|caution|negative,
   appearance = solid|bordered|transparent (NOT filled/outlined/text). */
function saltButtonAttrs(props: Record<string, unknown>): string {
  const variant = s(props.variant, "primary");
  const map: Record<string, { sentiment: string; appearance: string }> = {
    primary: { sentiment: "accented", appearance: "solid" },
    secondary: { sentiment: "neutral", appearance: "bordered" },
    outline: { sentiment: "neutral", appearance: "bordered" },
    ghost: { sentiment: "neutral", appearance: "transparent" },
    danger: { sentiment: "negative", appearance: "solid" },
    destructive: { sentiment: "negative", appearance: "solid" },
  };
  const { sentiment, appearance } = map[variant] ?? map.primary;
  return `sentiment="${sentiment}" appearance="${appearance}"`;
}

/* Salt Banner uses `status` (ValidationStatus: info|success|warning|error) —
   note 'success' not 'positive' for the inline-alert status. */
function saltAlertStatus(variant: string): string {
  const map: Record<string, string> = { info: "info", success: "success", warning: "warning", error: "error" };
  return map[variant] ?? "info";
}

/* Avatar size -> Salt size multiplier (1 base, 2 large, …). */
function saltAvatarSize(size: string): number {
  return ({ sm: 1, md: 2, lg: 4 } as Record<string, number>)[size] ?? 2;
}

const SALT: Record<string, ComponentApiEntry> = {
  SimulatedButton: {
    imports: { from: SALT_CORE, names: ["Button"] },
    toJsx: (p) => `<Button ${saltButtonAttrs(p)}>${jsxText(p.label, "Button")}</Button>`,
  },
  SimulatedTextInput: {
    imports: { from: SALT_CORE, names: ["FormField", "FormFieldLabel", "Input"] },
    toJsx: (p) =>
      `<FormField>\n  <FormFieldLabel>${jsxText(p.label, "Label")}</FormFieldLabel>\n  <Input placeholder="${jsxAttr(p.placeholder)}" />\n</FormField>`,
  },
  SimulatedCheckbox: {
    imports: { from: SALT_CORE, names: ["Checkbox"] },
    toJsx: (p) => `<Checkbox label="${jsxAttr(p.label)}"${p.defaultChecked ? " defaultChecked" : ""} />`,
  },
  SimulatedSwitch: {
    imports: { from: SALT_CORE, names: ["Switch"] },
    toJsx: (p) => `<Switch label="${jsxAttr(p.label)}"${p.defaultOn ? " defaultChecked" : ""} />`,
  },
  SimulatedCard: {
    imports: { from: SALT_CORE, names: ["Card"] },
    toJsx: (p) => `<Card>\n  <h3>${jsxText(p.title, "Card")}</h3>\n  <p>${jsxText(p.content)}</p>\n</Card>`,
  },

  /* ── extended coverage ── */
  SimulatedTitle: {
    imports: { from: SALT_CORE, names: ["H1", "H2", "H3", "H4"] },
    toJsx: (p) => {
      const tag = ({ h1: "H1", h2: "H2", h3: "H3", h4: "H4" } as Record<string, string>)[s(p.level, "h2")] ?? "H2";
      return `<${tag}>${jsxText(p.text, "Heading")}</${tag}>`;
    },
  },
  SimulatedToggleButton: {
    imports: { from: SALT_CORE, names: ["ToggleButton"] },
    toJsx: (p) =>
      `<ToggleButton value="${slug(p.label, "toggle")}"${p.defaultPressed ? " selected" : ""}>${jsxText(p.label, "Toggle")}</ToggleButton>`,
  },
  SimulatedSegmentedGroup: {
    imports: { from: SALT_CORE, names: ["SegmentedButtonGroup", "Button"] },
    toJsx: (p) => {
      const opts = csv(p.optionsCsv, ["Day", "Week", "Month"]);
      const di = num(p.defaultIndex, 0);
      const children = opts
        .map((o, i) => `  <Button${i === di ? ' sentiment="accented"' : ""}>${jsxText(o)}</Button>`)
        .join("\n");
      return `<SegmentedButtonGroup>\n${children}\n</SegmentedButtonGroup>`;
    },
  },
  SimulatedLink: {
    imports: p2(() => ({ from: SALT_CORE, names: ["Link"] }), () => ({ from: SALT_ICONS, names: ["ChevronRightIcon"] })),
    toJsx: (p) =>
      p.showIcon
        ? `<Link href="#" IconComponent={ChevronRightIcon}>${jsxText(p.text, "Learn more")}</Link>`
        : `<Link href="#">${jsxText(p.text, "Learn more")}</Link>`,
  },
  SimulatedMultilineInput: {
    imports: { from: SALT_CORE, names: ["FormField", "FormFieldLabel", "MultilineInput"] },
    toJsx: (p) =>
      `<FormField>\n  <FormFieldLabel>${jsxText(p.label, "Label")}</FormFieldLabel>\n  <MultilineInput placeholder="${jsxAttr(p.placeholder)}" rows={${num(p.rows, 3)}} />\n</FormField>`,
  },
  SimulatedNumberInput: {
    imports: { from: SALT_CORE, names: ["FormField", "FormFieldLabel", "NumberInput"] },
    toJsx: (p) =>
      `<FormField>\n  <FormFieldLabel>${jsxText(p.label, "Label")}</FormFieldLabel>\n  <NumberInput defaultValue={${num(p.value, 1)}} min={${num(p.min, 0)}} max={${num(p.max, 99)}} step={${num(p.step, 1)}} />\n</FormField>`,
  },
  SimulatedDatePicker: {
    imports: { from: SALT_LAB, names: ["DatePicker", "DatePickerSingleInput", "DatePickerOverlay", "DatePickerSinglePanel"] },
    toJsx: () =>
      `<DatePicker selectionVariant="single">\n  <DatePickerSingleInput />\n  <DatePickerOverlay>\n    <DatePickerSinglePanel />\n  </DatePickerOverlay>\n</DatePicker>`,
  },
  SimulatedSlider: {
    imports: { from: SALT_CORE, names: ["FormField", "FormFieldLabel", "Slider"] },
    toJsx: (p) =>
      `<FormField>\n  <FormFieldLabel>${jsxText(p.label, "Label")}</FormFieldLabel>\n  <Slider min={${num(p.min, 0)}} max={${num(p.max, 100)}} defaultValue={${num(p.value, 50)}} />\n</FormField>`,
  },
  SimulatedRadioGroup: {
    imports: { from: SALT_CORE, names: ["FormField", "FormFieldLabel", "RadioButtonGroup", "RadioButton"] },
    toJsx: (p) => {
      const opts = csv(p.optionsCsv, ["Option A", "Option B", "Option C"]);
      const di = num(p.defaultIndex, 0);
      const buttons = opts.map((o) => `    <RadioButton label="${jsxAttr(o)}" value="${slug(o)}" />`).join("\n");
      const dv = slug(opts[di] ?? opts[0]);
      return `<FormField>\n  <FormFieldLabel>${jsxText(p.label, "Label")}</FormFieldLabel>\n  <RadioButtonGroup defaultValue="${dv}">\n${buttons}\n  </RadioButtonGroup>\n</FormField>`;
    },
  },
  SimulatedDropdown: {
    imports: { from: SALT_CORE, names: ["Dropdown", "Option"] },
    toJsx: (p) =>
      `<Dropdown placeholder="${jsxAttr(p.placeholder, "Select an option")}">\n  <Option value="option-1">Option 1</Option>\n  <Option value="option-2">Option 2</Option>\n</Dropdown>`,
  },
  SimulatedComboBox: {
    imports: { from: SALT_CORE, names: ["ComboBox", "Option"] },
    toJsx: (p) => {
      const opts = csv(p.itemsCsv, ["United States", "United Kingdom", "Canada"]);
      const children = opts.map((o) => `  <Option value="${jsxAttr(o)}">${jsxText(o)}</Option>`).join("\n");
      return `<ComboBox placeholder="${jsxAttr(p.placeholder, "Search...")}">\n${children}\n</ComboBox>`;
    },
  },
  SimulatedSearchbox: {
    imports: p2(() => ({ from: SALT_CORE, names: ["Input"] }), () => ({ from: SALT_ICONS, names: ["SearchIcon"] })),
    toJsx: (p) => `<Input placeholder="${jsxAttr(p.placeholder, "Search...")}" startAdornment={<SearchIcon />} />`,
  },
  SimulatedRating: {
    imports: { from: SALT_CORE, names: ["FormField", "FormFieldLabel", "Rating"] },
    toJsx: (p) =>
      `<FormField>\n  <FormFieldLabel>${jsxText(p.label, "Rating")}</FormFieldLabel>\n  <Rating max={${num(p.max, 5)}} defaultValue={${num(p.value, 3)}} />\n</FormField>`,
  },
  SimulatedTokenizedInput: {
    /* FormField/FormFieldLabel from core; TokenizedInput from lab — split. */
    imports: p2(
      () => ({ from: SALT_CORE, names: ["FormField", "FormFieldLabel"] }),
      () => ({ from: SALT_LAB, names: ["TokenizedInput"] }),
    ),
    toJsx: (p) => {
      const tokens = csv(p.tokensCsv, ["alice@co.com", "bob@co.com"]);
      const arr = tokens.map((t) => JSON.stringify(t)).join(", ");
      return `<FormField>\n  <FormFieldLabel>${jsxText(p.label, "Label")}</FormFieldLabel>\n  <TokenizedInput defaultSelected={[${arr}]} />\n</FormField>`;
    },
  },
  /* SimulatedFileDropZone uses Salt FileDropZone (core, composable). */
  SimulatedFileDropZone: {
    imports: { from: SALT_CORE, names: ["FileDropZone", "FileDropZoneIcon", "FileDropZoneTrigger"] },
    toJsx: (p) => {
      const accept = csv(p.acceptTypes, [".png", ".jpg", ".pdf"]).join(",");
      return `<FileDropZone>\n  <FileDropZoneIcon />\n  <strong>${jsxText(p.label, "Drag & drop files here")}</strong>\n  <FileDropZoneTrigger accept="${jsxAttr(accept)}" />\n</FileDropZone>`;
    },
  },
  SimulatedDataTable: {
    imports: { from: SALT_CORE, names: ["Table", "THead", "TBody", "TH", "TR", "TD"] },
    toJsx: () =>
      `<Table>\n  <THead>\n    <TR>\n      <TH>Name</TH>\n      <TH>Status</TH>\n    </TR>\n  </THead>\n  <TBody>\n    <TR>\n      <TD>Jane Doe</TD>\n      <TD>Active</TD>\n    </TR>\n    <TR>\n      <TD>John Roe</TD>\n      <TD>Pending</TD>\n    </TR>\n  </TBody>\n</Table>`,
  },
  SimulatedStatCard: {
    /* Metric family from lab; Card chrome from core — split import. */
    imports: p2(
      () => ({ from: SALT_CORE, names: ["Card"] }),
      () => ({ from: SALT_LAB, names: ["Metric", "MetricHeader", "MetricContent"] }),
    ),
    toJsx: (p) =>
      `<Card>\n  <Metric>\n    <MetricHeader title="${jsxAttr(p.label, "Metric")}" />\n    <MetricContent value="${jsxAttr(p.value, "0")}" />\n  </Metric>\n</Card>`,
  },
  SimulatedListBox: {
    imports: { from: SALT_CORE, names: ["ListBox", "Option"] },
    toJsx: (p) => {
      const opts = csv(p.itemsCsv, ["Apple", "Banana", "Cherry"]);
      const children = opts.map((o) => `  <Option value="${jsxAttr(o)}">${jsxText(o)}</Option>`).join("\n");
      return `<ListBox${p.multiSelect ? " multiselect" : ""}>\n${children}\n</ListBox>`;
    },
  },
  SimulatedTree: {
    imports: { from: SALT_CORE, names: ["Tree", "TreeNode", "TreeNodeTrigger", "TreeNodeLabel"] },
    toJsx: (p) => {
      const tree = parseTree(p.itemsCsv, ["Documents > Work", "Documents > Personal"]);
      const render = (nodes: TreeNodeData[], depth: number): string =>
        nodes
          .map((n) => {
            const pad = "  ".repeat(depth + 1);
            const inner = `${pad}  <TreeNodeTrigger>\n${pad}    <TreeNodeLabel>${jsxText(n.label)}</TreeNodeLabel>\n${pad}  </TreeNodeTrigger>`;
            const kids = n.children.length ? `\n${render(n.children, depth + 1)}` : "";
            return `${pad}<TreeNode value="${slug(n.label)}">\n${inner}${kids}\n${pad}</TreeNode>`;
          })
          .join("\n");
      return `<Tree aria-label="File browser">\n${render(tree, 0)}\n</Tree>`;
    },
  },
  SimulatedProgress: {
    imports: { from: SALT_CORE, names: ["LinearProgress"] },
    toJsx: (p) => `<LinearProgress aria-label="${jsxAttr(p.label, "Progress")}" value={${num(p.value, 50)}} />`,
  },
  SimulatedAvatar: {
    imports: { from: SALT_CORE, names: ["Avatar"] },
    toJsx: (p) => `<Avatar name="${jsxAttr(p.initials, "?")}" size={${saltAvatarSize(s(p.size, "md"))}} />`,
  },
  /* SimulatedAvatarGroup — OMIT: Salt core/lab ship no AvatarGroup. */
  SimulatedBadge: {
    /* Salt Badge is a count overlay (value + children); it has no sentiment/
       status prop, so status is honestly dropped (verify-confirmed). */
    imports: { from: SALT_CORE, names: ["Badge", "Button"] },
    toJsx: (p) => `<Badge value={1}>\n  <Button>${jsxText(p.label, "Badge")}</Button>\n</Badge>`,
  },
  SimulatedPill: {
    imports: { from: SALT_CORE, names: ["Pill"] },
    toJsx: (p) => `<Pill onClick={() => {}}>${jsxText(p.label, "Tag")}</Pill>`,
  },
  SimulatedPersona: {
    imports: { from: SALT_LAB, names: ["ContactDetails", "ContactAvatar", "ContactPrimaryInfo", "ContactSecondaryInfo"] },
    toJsx: (p) =>
      `<ContactDetails variant="mini">\n  <ContactAvatar />\n  <ContactPrimaryInfo text="${jsxAttr(p.name, "Name")}" />\n  <ContactSecondaryInfo text="${jsxAttr(p.role, "")}" />\n</ContactDetails>`,
  },
  SimulatedTabs: {
    imports: { from: SALT_CORE, names: ["Tabs", "TabBar", "TabList", "Tab", "TabPanel"] },
    toJsx: (p) => {
      const tabs = csv(p.tabsCsv, ["General", "Security", "Notifications"]);
      const first = slug(tabs[0]);
      const tabEls = tabs.map((t) => `      <Tab value="${slug(t)}">${jsxText(t)}</Tab>`).join("\n");
      const panels = tabs.map((t) => `  <TabPanel value="${slug(t)}">${jsxText(t)} content</TabPanel>`).join("\n");
      return `<Tabs defaultValue="${first}">\n  <TabBar>\n    <TabList>\n${tabEls}\n    </TabList>\n  </TabBar>\n${panels}\n</Tabs>`;
    },
  },
  SimulatedBreadcrumb: {
    imports: { from: SALT_LAB, names: ["Breadcrumbs", "Breadcrumb"] },
    toJsx: (p) => {
      const path = csv(p.pathCsv, ["Home", "Projects", "Design Hub"]);
      const items = path
        .map((seg, i) => (i === path.length - 1 ? `  <Breadcrumb>${jsxText(seg)}</Breadcrumb>` : `  <Breadcrumb href="#">${jsxText(seg)}</Breadcrumb>`))
        .join("\n");
      return `<Breadcrumbs>\n${items}\n</Breadcrumbs>`;
    },
  },
  SimulatedNavDrawer: {
    imports: { from: SALT_CORE, names: ["Drawer", "NavigationItem"] },
    toJsx: (p) => {
      const items = csv(p.itemsCsv, ["Home", "Dashboard", "Settings"]);
      const links = items
        .map((it, i) => `    <NavigationItem href="#" orientation="vertical"${i === 0 ? " active" : ""}>${jsxText(it)}</NavigationItem>`)
        .join("\n");
      return `<Drawer open position="left">\n  <nav>\n${links}\n  </nav>\n</Drawer>`;
    },
  },
  Alert: {
    imports: { from: SALT_CORE, names: ["Banner", "BannerContent"] },
    toJsx: (p) => {
      const status = saltAlertStatus(s(p.variant, "info"));
      /* title + message are concatenated into BannerContent children; escape
         both as JSX children. (A bare `${jsxText(a)} ${jsxText(b)}` of two
         expression-or-text fragments is valid JSX.) */
      const title = s(p.title) ? `${jsxText(p.title)} ` : "";
      return `<Banner status="${status}">\n  <BannerContent>${title}${jsxText(p.message)}</BannerContent>\n</Banner>`;
    },
  },
  /* SimulatedSkeleton — OMIT: Salt has no shimmer placeholder (only Spinner). */
  SimulatedTooltip: {
    imports: { from: SALT_CORE, names: ["Tooltip", "Button"] },
    toJsx: (p) =>
      `<Tooltip content="${jsxAttr(p.text, "Tooltip")}">\n  <Button>${jsxText(p.buttonLabel, "Hover me")}</Button>\n</Tooltip>`,
  },
  SimulatedPopover: {
    imports: { from: SALT_CORE, names: ["Overlay", "OverlayTrigger", "OverlayPanel", "OverlayPanelContent", "Button"] },
    toJsx: (p) =>
      `<Overlay>\n  <OverlayTrigger>\n    <Button>Open</Button>\n  </OverlayTrigger>\n  <OverlayPanel>\n    <OverlayPanelContent>\n      <h3>${jsxText(p.title, "Popover")}</h3>\n      <p>${jsxText(p.content)}</p>\n    </OverlayPanelContent>\n  </OverlayPanel>\n</Overlay>`,
  },
  SimulatedDialog: {
    imports: { from: SALT_CORE, names: ["Dialog", "DialogHeader", "DialogContent", "DialogActions", "Button"] },
    toJsx: (p) =>
      `<Dialog open>\n  <DialogHeader header="${jsxAttr(p.title, "Dialog")}" />\n  <DialogContent>${jsxText(p.message)}</DialogContent>\n  <DialogActions>\n    <Button appearance="bordered" sentiment="neutral">Cancel</Button>\n    <Button sentiment="negative">Confirm</Button>\n  </DialogActions>\n</Dialog>`,
  },
  SimulatedAccordion: {
    /* value is optional on a standalone Accordion (verify-corrected); the
       emitted value="…" is still valid and groups gracefully if wrapped. */
    imports: { from: SALT_CORE, names: ["Accordion", "AccordionHeader", "AccordionPanel"] },
    toJsx: (p) =>
      `<Accordion value="${slug(p.title, "section")}">\n  <AccordionHeader>${jsxText(p.title, "Section")}</AccordionHeader>\n  <AccordionPanel>${jsxText(p.content)}</AccordionPanel>\n</Accordion>`,
  },
  /* SimulatedChatMessage — OMIT: no Salt chat/message component. */
  AppBrand: {
    imports: { from: SALT_CORE, names: ["Text"] },
    toJsx: (p) => `<Text styleAs="h4"><strong>${jsxText(p.label, "App Name")}</strong></Text>`,
  },
  StatusPill: {
    imports: { from: SALT_CORE, names: ["StatusIndicator", "Text"] },
    toJsx: (p) =>
      `<span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>\n  <StatusIndicator status="success" />\n  <Text>${jsxText(p.label, "Active")}</Text>\n</span>`,
  },
  NavItem: {
    imports: { from: SALT_CORE, names: ["NavigationItem"] },
    toJsx: (p) =>
      `<NavigationItem href="#"${p.active ? " active" : ""} orientation="vertical">${jsxText(p.label, "Nav")}</NavigationItem>`,
  },
  FooterText: {
    imports: { from: SALT_CORE, names: ["Text"] },
    toJsx: (p) =>
      `<footer>\n  <Text variant="secondary">${jsxText(p.label, "Footer")}</Text>\n  <Text variant="secondary" styleAs="label">${jsxText(p.version, "v1.0")}</Text>\n</footer>`,
  },
};

/* ════════════════════════════════════════════════════════════════════
   MATERIAL 3 — @mui/material (+ @mui/x-* for tree/date-picker)
   ════════════════════════════════════════════════════════════════════ */

const MUI = "@mui/material";

/* Generic block `variant` -> Material 3 (MUI) Button props. MUI Button API:
   variant = contained|outlined|text; color = primary|secondary|error|... */
function m3ButtonAttrs(props: Record<string, unknown>): string {
  const variant = s(props.variant, "primary");
  const map: Record<string, string> = {
    primary: 'variant="contained"',
    secondary: 'variant="outlined"',
    outline: 'variant="outlined"',
    ghost: 'variant="text"',
    danger: 'variant="contained" color="error"',
    destructive: 'variant="contained" color="error"',
  };
  return map[variant] ?? map.primary;
}

/* status -> MUI Chip color (info/success/warning/error/default). */
function muiChipColor(status: string): string {
  const map: Record<string, string> = {
    default: "default", info: "info", success: "success", warning: "warning", error: "error",
  };
  return map[status] ?? "default";
}

const M3: Record<string, ComponentApiEntry> = {
  SimulatedButton: {
    imports: { from: MUI, names: ["Button"] },
    toJsx: (p) => `<Button ${m3ButtonAttrs(p)}>${jsxText(p.label, "Button")}</Button>`,
  },
  SimulatedTextInput: {
    imports: { from: MUI, names: ["TextField"] },
    toJsx: (p) => `<TextField label="${jsxAttr(p.label, "Label")}" placeholder="${jsxAttr(p.placeholder)}" variant="outlined" />`,
  },
  SimulatedCheckbox: {
    imports: { from: MUI, names: ["Checkbox", "FormControlLabel"] },
    toJsx: (p) => `<FormControlLabel control={<Checkbox${p.defaultChecked ? " defaultChecked" : ""} />} label="${jsxAttr(p.label)}" />`,
  },
  SimulatedSwitch: {
    imports: { from: MUI, names: ["FormControlLabel", "Switch"] },
    toJsx: (p) => `<FormControlLabel control={<Switch${p.defaultOn ? " defaultChecked" : ""} />} label="${jsxAttr(p.label)}" />`,
  },
  SimulatedCard: {
    imports: { from: MUI, names: ["Card", "CardContent"] },
    toJsx: (p) => `<Card>\n  <CardContent>\n    <h3>${jsxText(p.title, "Card")}</h3>\n    <p>${jsxText(p.content)}</p>\n  </CardContent>\n</Card>`,
  },

  /* ── extended coverage ── */
  SimulatedTitle: {
    imports: { from: MUI, names: ["Typography"] },
    toJsx: (p) => {
      const level = s(p.level, "h2");
      const variant = ({ h1: "h3", h2: "h4", h3: "h5", h4: "h6" } as Record<string, string>)[level] ?? "h4";
      return `<Typography variant="${variant}" component="${level}">${jsxText(p.text, "Heading")}</Typography>`;
    },
  },
  SimulatedToggleButton: {
    imports: { from: MUI, names: ["ToggleButton"] },
    toJsx: (p) =>
      `<ToggleButton value="${slug(p.label, "toggle")}" selected={${p.defaultPressed ? "true" : "false"}} aria-label="${jsxAttr(p.label, "Toggle")}">${jsxText(p.label, "Toggle")}</ToggleButton>`,
  },
  SimulatedSegmentedGroup: {
    imports: { from: MUI, names: ["ToggleButtonGroup", "ToggleButton"] },
    toJsx: (p) => {
      const opts = csv(p.optionsCsv, ["Day", "Week", "Month"]);
      const di = num(p.defaultIndex, 0);
      const children = opts.map((o) => `  <ToggleButton value="${slug(o)}">${jsxText(o)}</ToggleButton>`).join("\n");
      return `<ToggleButtonGroup exclusive value="${slug(opts[di] ?? opts[0])}" aria-label="view">\n${children}\n</ToggleButtonGroup>`;
    },
  },
  SimulatedLink: {
    imports: { from: MUI, names: ["Link"] },
    toJsx: (p) => `<Link href="#" underline="hover">${jsxText(p.text, "Learn more")}</Link>`,
  },
  SimulatedMultilineInput: {
    imports: { from: MUI, names: ["TextField"] },
    toJsx: (p) =>
      `<TextField label="${jsxAttr(p.label, "Label")}" placeholder="${jsxAttr(p.placeholder)}" multiline rows={${num(p.rows, 3)}} variant="outlined" fullWidth />`,
  },
  SimulatedNumberInput: {
    /* verify-corrected: slotProps.htmlInput (works MUI v6.5+/v7); the old
       inputProps is deprecated in v6 and removed in v7. */
    imports: { from: MUI, names: ["TextField"] },
    toJsx: (p) =>
      `<TextField type="number" label="${jsxAttr(p.label, "Label")}" defaultValue={${num(p.value, 1)}} slotProps={{ htmlInput: { min: ${num(p.min, 0)}, max: ${num(p.max, 99)}, step: ${num(p.step, 1)} } }} variant="outlined" />`,
  },
  SimulatedDatePicker: {
    /* @mui/x-date-pickers DatePicker requires a LocalizationProvider + a date
       adapter (dayjs) at runtime; without that wrapper the exported app throws.
       Use the provider-free native-date TextField so generated M3 code runs. */
    imports: { from: MUI, names: ["TextField"] },
    toJsx: (p) => `<TextField type="date" label="${jsxAttr(p.label, "Date")}" slotProps={{ inputLabel: { shrink: true } }} variant="outlined" />`,
  },
  SimulatedSlider: {
    imports: { from: MUI, names: ["Slider"] },
    toJsx: (p) =>
      `<Slider defaultValue={${num(p.value, 50)}} min={${num(p.min, 0)}} max={${num(p.max, 100)}} aria-label="${jsxAttr(p.label, "Slider")}" />`,
  },
  SimulatedRadioGroup: {
    imports: { from: MUI, names: ["FormControl", "FormLabel", "RadioGroup", "FormControlLabel", "Radio"] },
    toJsx: (p) => {
      const opts = csv(p.optionsCsv, ["Option A", "Option B", "Option C"]);
      const di = num(p.defaultIndex, 0);
      const items = opts
        .map((o) => `    <FormControlLabel value="${slug(o)}" control={<Radio />} label="${jsxAttr(o)}" />`)
        .join("\n");
      return `<FormControl>\n  <FormLabel>${jsxText(p.label, "Label")}</FormLabel>\n  <RadioGroup defaultValue="${slug(opts[di] ?? opts[0])}">\n${items}\n  </RadioGroup>\n</FormControl>`;
    },
  },
  SimulatedDropdown: {
    imports: { from: MUI, names: ["FormControl", "InputLabel", "Select", "MenuItem"] },
    toJsx: (p) =>
      `<FormControl fullWidth>\n  <InputLabel id="sel-label">${jsxText(p.placeholder, "Select an option")}</InputLabel>\n  <Select labelId="sel-label" label="${jsxAttr(p.placeholder, "Select an option")}" defaultValue="">\n    <MenuItem value="opt1">Option 1</MenuItem>\n    <MenuItem value="opt2">Option 2</MenuItem>\n  </Select>\n</FormControl>`,
  },
  SimulatedComboBox: {
    imports: { from: MUI, names: ["Autocomplete", "TextField"] },
    toJsx: (p) => {
      const opts = csv(p.itemsCsv, ["United States", "United Kingdom", "Canada"]);
      const arr = opts.map((o) => JSON.stringify(o)).join(", ");
      return `<Autocomplete\n  options={[${arr}]}\n  renderInput={(params) => <TextField {...params} label="${jsxAttr(p.placeholder, "Search...")}" variant="outlined" />}\n/>`;
    },
  },
  SimulatedSearchbox: {
    imports: p2(() => ({ from: MUI, names: ["TextField", "InputAdornment"] }), () => ({ from: "@mui/icons-material/Search", names: ["default as SearchIcon"] })),
    toJsx: (p) =>
      `<TextField placeholder="${jsxAttr(p.placeholder, "Search...")}" variant="outlined" size="small" InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }} />`,
  },
  SimulatedRating: {
    imports: { from: MUI, names: ["Rating"] },
    toJsx: (p) => `<Rating name="rating" defaultValue={${num(p.value, 3)}} max={${num(p.max, 5)}} />`,
  },
  SimulatedTokenizedInput: {
    imports: { from: MUI, names: ["Autocomplete", "TextField", "Chip"] },
    toJsx: (p) => {
      const tokens = csv(p.tokensCsv, ["alice@co.com", "bob@co.com"]);
      const arr = tokens.map((t) => JSON.stringify(t)).join(", ");
      return `<Autocomplete\n  multiple\n  freeSolo\n  options={[]}\n  defaultValue={[${arr}]}\n  renderTags={(value, getTagProps) => value.map((opt, i) => { const { key, ...tagProps } = getTagProps({ index: i }); return <Chip key={key} label={opt} {...tagProps} />; })}\n  renderInput={(params) => <TextField {...params} label="${jsxAttr(p.label, "Label")}" variant="outlined" />}\n/>`;
    },
  },
  /* SimulatedFileDropZone — OMIT: @mui/material ships no dropzone component. */
  SimulatedDataTable: {
    imports: { from: MUI, names: ["Table", "TableHead", "TableBody", "TableRow", "TableCell", "TableContainer", "Paper"] },
    toJsx: () =>
      `<TableContainer component={Paper}>\n  <Table aria-label="data table">\n    <TableHead>\n      <TableRow><TableCell>Name</TableCell><TableCell>Status</TableCell></TableRow>\n    </TableHead>\n    <TableBody>\n      <TableRow><TableCell>Jane Doe</TableCell><TableCell>Active</TableCell></TableRow>\n      <TableRow><TableCell>John Roe</TableCell><TableCell>Pending</TableCell></TableRow>\n    </TableBody>\n  </Table>\n</TableContainer>`,
  },
  SimulatedStatCard: {
    imports: { from: MUI, names: ["Card", "CardContent", "Typography", "LinearProgress"] },
    toJsx: (p) =>
      `<Card variant="outlined">\n  <CardContent>\n    <Typography variant="body2" color="text.secondary">${jsxText(p.label, "Metric")}</Typography>\n    <Typography variant="h4">${jsxText(p.value, "0")}</Typography>\n    <LinearProgress variant="determinate" value={${num(p.pct, 0)}} sx={{ mt: 1 }} />\n  </CardContent>\n</Card>`,
  },
  SimulatedListBox: {
    imports: { from: MUI, names: ["List", "ListItem", "ListItemButton", "ListItemText"] },
    toJsx: (p) => {
      const opts = csv(p.itemsCsv, ["Apple", "Banana", "Cherry"]);
      const items = opts
        .map((o) => `  <ListItem disablePadding><ListItemButton><ListItemText primary="${jsxAttr(o)}" /></ListItemButton></ListItem>`)
        .join("\n");
      return `<List>\n${items}\n</List>`;
    },
  },
  SimulatedTree: {
    imports: p2(
      () => ({ from: "@mui/x-tree-view/SimpleTreeView", names: ["SimpleTreeView"] }),
      () => ({ from: "@mui/x-tree-view/TreeItem", names: ["TreeItem"] }),
    ),
    toJsx: (p) => {
      const tree = parseTree(p.itemsCsv, ["Documents > Work", "Documents > Personal"]);
      const render = (nodes: TreeNodeData[], prefix: string, depth: number): string =>
        nodes
          .map((n) => {
            const id = prefix ? `${prefix}-${slug(n.label)}` : slug(n.label);
            const pad = "  ".repeat(depth + 1);
            if (!n.children.length) return `${pad}<TreeItem itemId="${id}" label="${jsxAttr(n.label)}" />`;
            return `${pad}<TreeItem itemId="${id}" label="${jsxAttr(n.label)}">\n${render(n.children, id, depth + 1)}\n${pad}</TreeItem>`;
          })
          .join("\n");
      return `<SimpleTreeView>\n${render(tree, "", 0)}\n</SimpleTreeView>`;
    },
  },
  SimulatedProgress: {
    imports: { from: MUI, names: ["LinearProgress"] },
    toJsx: (p) => `<LinearProgress variant="determinate" value={${num(p.value, 50)}} />`,
  },
  SimulatedAvatar: {
    imports: { from: MUI, names: ["Avatar"] },
    toJsx: (p) => {
      const dim = ({ sm: 28, md: 40, lg: 56 } as Record<string, number>)[s(p.size, "md")] ?? 40;
      return `<Avatar sx={{ width: ${dim}, height: ${dim} }}>${jsxText(p.initials, "?")}</Avatar>`;
    },
  },
  SimulatedAvatarGroup: {
    imports: { from: MUI, names: ["AvatarGroup", "Avatar"] },
    toJsx: (p) => {
      const names = csv(p.namesCsv, ["AB", "CD", "EF"]);
      const max = num(p.max, 4);
      const items = names.map((n) => `  <Avatar>${jsxText(n)}</Avatar>`).join("\n");
      return `<AvatarGroup max={${max}}>\n${items}\n</AvatarGroup>`;
    },
  },
  SimulatedBadge: {
    /* MUI Badge is a count overlay; a labeled status badge maps to Chip. */
    imports: { from: MUI, names: ["Chip"] },
    toJsx: (p) => `<Chip label="${jsxAttr(p.label, "Badge")}" color="${muiChipColor(s(p.status, "default"))}" size="small" />`,
  },
  SimulatedPill: {
    imports: { from: MUI, names: ["Chip"] },
    toJsx: (p) =>
      `<Chip label="${jsxAttr(p.label, "Tag")}" color="${muiChipColor(s(p.status, "default"))}"${p.dismissible ? " onDelete={() => {}}" : ""} />`,
  },
  SimulatedPersona: {
    imports: { from: MUI, names: ["ListItem", "ListItemAvatar", "Avatar", "ListItemText"] },
    toJsx: (p) =>
      `<ListItem>\n  <ListItemAvatar><Avatar>${jsxText(slug(p.name, "p").slice(0, 2).toUpperCase())}</Avatar></ListItemAvatar>\n  <ListItemText primary="${jsxAttr(p.name, "Name")}" secondary="${jsxAttr(p.role)}" />\n</ListItem>`,
  },
  SimulatedTabs: {
    imports: { from: MUI, names: ["Tabs", "Tab"] },
    toJsx: (p) => {
      const tabs = csv(p.tabsCsv, ["General", "Security", "Notifications"]);
      const tabEls = tabs.map((t) => `  <Tab label="${jsxAttr(t)}" />`).join("\n");
      return `<Tabs value={0} aria-label="tabs">\n${tabEls}\n</Tabs>`;
    },
  },
  SimulatedBreadcrumb: {
    imports: { from: MUI, names: ["Breadcrumbs", "Link", "Typography"] },
    toJsx: (p) => {
      const path = csv(p.pathCsv, ["Home", "Projects", "Design Hub"]);
      const items = path
        .map((seg, i) =>
          i === path.length - 1
            ? `  <Typography color="text.primary">${jsxText(seg)}</Typography>`
            : `  <Link underline="hover" color="inherit" href="#">${jsxText(seg)}</Link>`,
        )
        .join("\n");
      return `<Breadcrumbs aria-label="breadcrumb">\n${items}\n</Breadcrumbs>`;
    },
  },
  SimulatedNavDrawer: {
    imports: { from: MUI, names: ["Drawer", "List", "ListItem", "ListItemButton", "ListItemText"] },
    toJsx: (p) => {
      const items = csv(p.itemsCsv, ["Home", "Dashboard", "Settings"]);
      const links = items
        .map((it) => `    <ListItem disablePadding><ListItemButton><ListItemText primary="${jsxAttr(it)}" /></ListItemButton></ListItem>`)
        .join("\n");
      return `<Drawer variant="permanent" anchor="left">\n  <List>\n${links}\n  </List>\n</Drawer>`;
    },
  },
  Alert: {
    imports: { from: MUI, names: ["Alert", "AlertTitle"] },
    toJsx: (p) =>
      `<Alert severity="${jsxAttr(p.variant, "info")}">\n  <AlertTitle>${jsxText(p.title, "Alert")}</AlertTitle>\n  ${jsxText(p.message)}\n</Alert>`,
  },
  SimulatedSkeleton: {
    imports: { from: MUI, names: ["Skeleton"] },
    toJsx: (p) => {
      const variant = s(p.variant, "card");
      if (variant === "text") return `<Skeleton variant="text" />`;
      if (variant === "avatar") return `<Skeleton variant="circular" width={40} height={40} />`;
      return `<Skeleton variant="rectangular" width={280} height={140} />`;
    },
  },
  SimulatedTooltip: {
    imports: { from: MUI, names: ["Tooltip", "Button"] },
    toJsx: (p) => `<Tooltip title="${jsxAttr(p.text, "Tooltip")}">\n  <Button>${jsxText(p.buttonLabel, "Hover me")}</Button>\n</Tooltip>`,
  },
  SimulatedPopover: {
    /* MUI Popover is controlled (open/anchorEl/onClose); the exported Dashboard()
       wrapper has no state, so emit the popover's content surface as a static
       Paper instead of referencing undeclared identifiers. Honest + compiles. */
    imports: { from: MUI, names: ["Paper", "Typography"] },
    toJsx: (p) =>
      `<Paper elevation={3} sx={{ p: 2, maxWidth: 320 }}>\n  <Typography variant="subtitle2" gutterBottom>${jsxText(p.title, "Popover")}</Typography>\n  <Typography variant="body2">${jsxText(p.content)}</Typography>\n</Paper>`,
  },
  SimulatedDialog: {
    imports: { from: MUI, names: ["Dialog", "DialogTitle", "DialogContent", "DialogContentText", "DialogActions", "Button"] },
    toJsx: (p) =>
      `<Dialog open onClose={() => {}}>\n  <DialogTitle>${jsxText(p.title, "Dialog")}</DialogTitle>\n  <DialogContent>\n    <DialogContentText>${jsxText(p.message)}</DialogContentText>\n  </DialogContent>\n  <DialogActions>\n    <Button onClick={() => {}}>Cancel</Button>\n    <Button color="error" onClick={() => {}}>Confirm</Button>\n  </DialogActions>\n</Dialog>`,
  },
  SimulatedAccordion: {
    imports: { from: MUI, names: ["Accordion", "AccordionSummary", "AccordionDetails", "Typography"] },
    toJsx: (p) =>
      `<Accordion>\n  <AccordionSummary>\n    <Typography>${jsxText(p.title, "Section")}</Typography>\n  </AccordionSummary>\n  <AccordionDetails>\n    <Typography>${jsxText(p.content)}</Typography>\n  </AccordionDetails>\n</Accordion>`,
  },
  /* SimulatedChatMessage — OMIT: @mui/material ships no chat-bubble component. */
  AppBrand: {
    imports: { from: MUI, names: ["Typography"] },
    toJsx: (p) => `<Typography variant="h6" noWrap component="div">${jsxText(p.label, "App Name")}</Typography>`,
  },
  StatusPill: {
    imports: { from: MUI, names: ["Chip"] },
    toJsx: (p) => `<Chip label="${jsxAttr(p.label, "Active")}" color="success" size="small" variant="outlined" />`,
  },
  NavItem: {
    imports: { from: MUI, names: ["ListItem", "ListItemButton", "ListItemIcon", "ListItemText", "Icon"] },
    toJsx: (p) =>
      `<ListItem disablePadding>\n  <ListItemButton selected={${p.active ? "true" : "false"}}>\n    <ListItemIcon><Icon>${jsxText(p.icon, "home")}</Icon></ListItemIcon>\n    <ListItemText primary="${jsxAttr(p.label, "Nav")}" />\n  </ListItemButton>\n</ListItem>`,
  },
  FooterText: {
    imports: { from: MUI, names: ["Typography"] },
    toJsx: (p) => `<Typography variant="body2" color="text.secondary">${jsxText(p.label, "Footer")} · ${jsxText(p.version, "v1.0")}</Typography>`,
  },
};

/* ════════════════════════════════════════════════════════════════════
   FLUENT 2 — @fluentui/react-components (+ react-datepicker-compat,
   react-nav-preview, react-icons for composites that live outside core)
   ════════════════════════════════════════════════════════════════════ */

const FLUENT_CORE = "@fluentui/react-components";

/* Generic block `variant` -> Fluent 2 Button appearance.
   Fluent v9 has no native destructive appearance — danger = subtle + the real
   --colorPaletteRedForeground1 token (a CSS var FluentProvider injects). */
function fluentButtonAttrs(props: Record<string, unknown>): string {
  const variant = s(props.variant, "primary");
  const map: Record<string, string> = {
    primary: 'appearance="primary"',
    secondary: 'appearance="secondary"',
    outline: 'appearance="outline"',
    ghost: 'appearance="subtle"',
    danger: 'appearance="subtle" style={{ color: "var(--colorPaletteRedForeground1)" }}',
    destructive: 'appearance="subtle" style={{ color: "var(--colorPaletteRedForeground1)" }}',
  };
  return map[variant] ?? map.primary;
}

/* status -> Fluent Badge color enum (brand|danger|informative|success|warning). */
function fluentBadgeColor(status: string): string {
  const map: Record<string, string> = {
    default: "brand", info: "informative", success: "success", warning: "warning", error: "danger",
  };
  return map[status] ?? "brand";
}

/* nav icon name -> @fluentui/react-icons component (24 Regular). */
function fluentIconName(icon: string): string {
  const map: Record<string, string> = {
    chat: "Chat24Regular", database: "Database24Regular", settings: "Settings24Regular",
    bar_chart: "DataBarVertical24Regular", home: "Home24Regular", person: "Person24Regular",
    search: "Search24Regular", notifications: "Alert24Regular",
  };
  return map[icon] ?? "Home24Regular";
}

const FLUENT: Record<string, ComponentApiEntry> = {
  SimulatedButton: {
    imports: { from: FLUENT_CORE, names: ["Button"] },
    toJsx: (p) => `<Button ${fluentButtonAttrs(p)}>${jsxText(p.label, "Button")}</Button>`,
  },
  SimulatedTextInput: {
    imports: { from: FLUENT_CORE, names: ["Field", "Input"] },
    toJsx: (p) =>
      `<Field label="${jsxAttr(p.label, "Label")}">\n  <Input placeholder="${jsxAttr(p.placeholder)}" />\n</Field>`,
  },
  SimulatedCheckbox: {
    imports: { from: FLUENT_CORE, names: ["Checkbox"] },
    toJsx: (p) => `<Checkbox label="${jsxAttr(p.label)}"${p.defaultChecked ? " defaultChecked" : ""} />`,
  },
  SimulatedSwitch: {
    imports: { from: FLUENT_CORE, names: ["Switch"] },
    toJsx: (p) => `<Switch label="${jsxAttr(p.label)}"${p.defaultOn ? " defaultChecked" : ""} />`,
  },
  SimulatedCard: {
    imports: { from: FLUENT_CORE, names: ["Card", "CardHeader"] },
    toJsx: (p) =>
      `<Card>\n  <CardHeader header="${jsxAttr(p.title, "Card")}" description="${jsxAttr(p.content)}" />\n</Card>`,
  },

  /* ── extended coverage ── */
  SimulatedTitle: {
    imports: { from: FLUENT_CORE, names: ["Title1", "Title2", "Title3", "Subtitle2"] },
    toJsx: (p) => {
      const level = s(p.level, "h2");
      const comp = ({ h1: "Title1", h2: "Title2", h3: "Title3", h4: "Subtitle2" } as Record<string, string>)[level] ?? "Title2";
      return `<${comp} as="${level}">${jsxText(p.text, "Heading")}</${comp}>`;
    },
  },
  SimulatedToggleButton: {
    imports: { from: FLUENT_CORE, names: ["ToggleButton"] },
    toJsx: (p) =>
      `<ToggleButton appearance="subtle" defaultChecked={${p.defaultPressed ? "true" : "false"}}>${jsxText(p.label, "Toggle")}</ToggleButton>`,
  },
  SimulatedSegmentedGroup: {
    imports: { from: FLUENT_CORE, names: ["Toolbar", "ToggleButton"] },
    toJsx: (p) => {
      const opts = csv(p.optionsCsv, ["Day", "Week", "Month"]);
      const di = num(p.defaultIndex, 0);
      const children = opts
        .map((o, i) => `  <ToggleButton appearance="subtle"${i === di ? " checked" : ""}>${jsxText(o)}</ToggleButton>`)
        .join("\n");
      return `<Toolbar aria-label="Segmented">\n${children}\n</Toolbar>`;
    },
  },
  SimulatedLink: {
    imports: { from: FLUENT_CORE, names: ["Link"] },
    toJsx: (p) => `<Link href="#">${jsxText(p.text, "Learn more")}</Link>`,
  },
  SimulatedMultilineInput: {
    imports: { from: FLUENT_CORE, names: ["Field", "Textarea"] },
    toJsx: (p) =>
      `<Field label="${jsxAttr(p.label, "Label")}">\n  <Textarea placeholder="${jsxAttr(p.placeholder)}" rows={${num(p.rows, 3)}} />\n</Field>`,
  },
  SimulatedNumberInput: {
    imports: { from: FLUENT_CORE, names: ["Field", "SpinButton"] },
    toJsx: (p) =>
      `<Field label="${jsxAttr(p.label, "Label")}">\n  <SpinButton defaultValue={${num(p.value, 1)}} min={${num(p.min, 0)}} max={${num(p.max, 99)}} step={${num(p.step, 1)}} />\n</Field>`,
  },
  SimulatedDatePicker: {
    imports: { from: "@fluentui/react-datepicker-compat", names: ["DatePicker"] },
    toJsx: () => `<DatePicker placeholder="Select a date..." />`,
  },
  SimulatedSlider: {
    imports: { from: FLUENT_CORE, names: ["Field", "Slider"] },
    toJsx: (p) =>
      `<Field label="${jsxAttr(p.label, "Label")}">\n  <Slider min={${num(p.min, 0)}} max={${num(p.max, 100)}} defaultValue={${num(p.value, 50)}} />\n</Field>`,
  },
  SimulatedRadioGroup: {
    imports: { from: FLUENT_CORE, names: ["Field", "RadioGroup", "Radio"] },
    toJsx: (p) => {
      const opts = csv(p.optionsCsv, ["Option A", "Option B", "Option C"]);
      const di = num(p.defaultIndex, 0);
      const radios = opts.map((o) => `    <Radio value="${slug(o)}" label="${jsxAttr(o)}" />`).join("\n");
      return `<Field label="${jsxAttr(p.label, "Label")}">\n  <RadioGroup defaultValue="${slug(opts[di] ?? opts[0])}">\n${radios}\n  </RadioGroup>\n</Field>`;
    },
  },
  SimulatedDropdown: {
    imports: { from: FLUENT_CORE, names: ["Dropdown", "Option"] },
    toJsx: (p) =>
      `<Dropdown placeholder="${jsxAttr(p.placeholder, "Select an option")}">\n  <Option>Option 1</Option>\n  <Option>Option 2</Option>\n  <Option>Option 3</Option>\n</Dropdown>`,
  },
  SimulatedComboBox: {
    imports: { from: FLUENT_CORE, names: ["Combobox", "Option"] },
    toJsx: (p) => {
      const opts = csv(p.itemsCsv, ["United States", "United Kingdom", "Canada"]);
      const children = opts.map((o) => `  <Option>${jsxText(o)}</Option>`).join("\n");
      return `<Combobox placeholder="${jsxAttr(p.placeholder, "Search...")}">\n${children}\n</Combobox>`;
    },
  },
  SimulatedSearchbox: {
    /* SearchBox is stable-exported from react-components in recent v9; older
       minors need @fluentui/react-search (verify note, not a blocker). */
    imports: { from: FLUENT_CORE, names: ["SearchBox"] },
    toJsx: (p) => `<SearchBox placeholder="${jsxAttr(p.placeholder, "Search...")}" />`,
  },
  SimulatedRating: {
    imports: { from: FLUENT_CORE, names: ["Field", "Rating"] },
    toJsx: (p) =>
      `<Field label="${jsxAttr(p.label, "Rating")}">\n  <Rating defaultValue={${num(p.value, 3)}} max={${num(p.max, 5)}} />\n</Field>`,
  },
  SimulatedTokenizedInput: {
    imports: { from: FLUENT_CORE, names: ["Field", "TagGroup", "Tag"] },
    toJsx: (p) => {
      const tokens = csv(p.tokensCsv, ["alice@co.com", "bob@co.com"]);
      const tags = tokens
        .map((t) => `    <Tag dismissible value="${slug(t)}">${jsxText(t)}</Tag>`)
        .join("\n");
      return `<Field label="${jsxAttr(p.label, "Label")}">\n  <TagGroup>\n${tags}\n  </TagGroup>\n</Field>`;
    },
  },
  /* SimulatedFileDropZone — OMIT: Fluent v9 has no file-drop component. */
  SimulatedDataTable: {
    imports: { from: FLUENT_CORE, names: ["Table", "TableHeader", "TableRow", "TableHeaderCell", "TableBody", "TableCell"] },
    toJsx: () =>
      `<Table>\n  <TableHeader>\n    <TableRow>\n      <TableHeaderCell>Name</TableHeaderCell>\n      <TableHeaderCell>Status</TableHeaderCell>\n    </TableRow>\n  </TableHeader>\n  <TableBody>\n    <TableRow>\n      <TableCell>Jane Doe</TableCell>\n      <TableCell>Active</TableCell>\n    </TableRow>\n  </TableBody>\n</Table>`,
  },
  SimulatedStatCard: {
    imports: { from: FLUENT_CORE, names: ["Card", "CardHeader", "Title3", "Caption1", "ProgressBar"] },
    toJsx: (p) =>
      `<Card>\n  <CardHeader header={<Caption1>${jsxText(p.label, "Metric")}</Caption1>} />\n  <Title3>${jsxText(p.value, "0")}</Title3>\n  <ProgressBar value={${(num(p.pct, 0) / 100).toString()}} />\n</Card>`,
  },
  SimulatedListBox: {
    imports: { from: FLUENT_CORE, names: ["Listbox", "Option"] },
    toJsx: (p) => {
      const opts = csv(p.itemsCsv, ["Apple", "Banana", "Cherry"]);
      const children = opts.map((o) => `  <Option>${jsxText(o)}</Option>`).join("\n");
      return `<Listbox aria-label="List"${p.multiSelect ? " multiselect" : ""}>\n${children}\n</Listbox>`;
    },
  },
  SimulatedTree: {
    imports: { from: FLUENT_CORE, names: ["Tree", "TreeItem", "TreeItemLayout"] },
    toJsx: (p) => {
      const tree = parseTree(p.itemsCsv, ["Documents > Work", "Documents > Personal"]);
      const render = (nodes: TreeNodeData[], depth: number): string =>
        nodes
          .map((n) => {
            const pad = "  ".repeat(depth + 1);
            if (!n.children.length)
              return `${pad}<TreeItem itemType="leaf" value="${slug(n.label)}"><TreeItemLayout>${jsxText(n.label)}</TreeItemLayout></TreeItem>`;
            return `${pad}<TreeItem itemType="branch" value="${slug(n.label)}">\n${pad}  <TreeItemLayout>${jsxText(n.label)}</TreeItemLayout>\n${pad}  <Tree>\n${render(n.children, depth + 2)}\n${pad}  </Tree>\n${pad}</TreeItem>`;
          })
          .join("\n");
      return `<Tree aria-label="Files">\n${render(tree, 0)}\n</Tree>`;
    },
  },
  SimulatedProgress: {
    imports: { from: FLUENT_CORE, names: ["Field", "ProgressBar"] },
    toJsx: (p) =>
      `<Field label="${jsxAttr(p.label, "Progress")}">\n  <ProgressBar value={${(num(p.value, 50) / 100).toString()}} />\n</Field>`,
  },
  SimulatedAvatar: {
    imports: { from: FLUENT_CORE, names: ["Avatar"] },
    toJsx: (p) => {
      const size = ({ sm: 24, md: 32, lg: 48 } as Record<string, number>)[s(p.size, "md")] ?? 32;
      const presence = s(p.presence);
      const badge = presence ? ` badge={{ status: "${jsxAttr(presence)}" }}` : "";
      return `<Avatar name="${jsxAttr(p.initials, "?")}" size={${size}}${badge} />`;
    },
  },
  SimulatedAvatarGroup: {
    imports: { from: FLUENT_CORE, names: ["AvatarGroup", "AvatarGroupItem"] },
    toJsx: (p) => {
      const names = csv(p.namesCsv, ["AB", "CD", "EF"]);
      const items = names.map((n) => `  <AvatarGroupItem name="${jsxAttr(n)}" />`).join("\n");
      return `<AvatarGroup>\n${items}\n</AvatarGroup>`;
    },
  },
  SimulatedBadge: {
    imports: { from: FLUENT_CORE, names: ["Badge"] },
    toJsx: (p) => `<Badge appearance="filled" color="${fluentBadgeColor(s(p.status, "default"))}">${jsxText(p.label, "Badge")}</Badge>`,
  },
  SimulatedPill: {
    imports: { from: FLUENT_CORE, names: ["Tag"] },
    toJsx: (p) => `<Tag appearance="filled"${p.dismissible ? " dismissible" : ""}>${jsxText(p.label, "Tag")}</Tag>`,
  },
  SimulatedPersona: {
    imports: { from: FLUENT_CORE, names: ["Persona"] },
    toJsx: (p) => {
      const presence = s(p.presence);
      const pres = presence ? ` presence={{ status: "${jsxAttr(presence)}" }}` : "";
      return `<Persona name="${jsxAttr(p.name, "Name")}" secondaryText="${jsxAttr(p.role)}"${pres} avatar={{ color: "colorful" }} />`;
    },
  },
  SimulatedTabs: {
    imports: { from: FLUENT_CORE, names: ["TabList", "Tab"] },
    toJsx: (p) => {
      const tabs = csv(p.tabsCsv, ["General", "Security", "Notifications"]);
      const tabEls = tabs.map((t) => `  <Tab value="${slug(t)}">${jsxText(t)}</Tab>`).join("\n");
      return `<TabList defaultSelectedValue="${slug(tabs[0])}">\n${tabEls}\n</TabList>`;
    },
  },
  SimulatedBreadcrumb: {
    imports: { from: FLUENT_CORE, names: ["Breadcrumb", "BreadcrumbItem", "BreadcrumbButton", "BreadcrumbDivider"] },
    toJsx: (p) => {
      const path = csv(p.pathCsv, ["Home", "Projects", "Design Hub"]);
      const parts: string[] = [];
      path.forEach((seg, i) => {
        const current = i === path.length - 1 ? " current" : "";
        parts.push(`  <BreadcrumbItem><BreadcrumbButton${current}>${jsxText(seg)}</BreadcrumbButton></BreadcrumbItem>`);
        if (i < path.length - 1) parts.push("  <BreadcrumbDivider />");
      });
      return `<Breadcrumb aria-label="Breadcrumb">\n${parts.join("\n")}\n</Breadcrumb>`;
    },
  },
  SimulatedNavDrawer: {
    imports: { from: "@fluentui/react-nav-preview", names: ["NavDrawer", "NavDrawerBody", "NavItem"] },
    toJsx: (p) => {
      const items = csv(p.itemsCsv, ["Home", "Dashboard", "Settings"]);
      const links = items
        .map((it) => `    <NavItem value="${slug(it)}" href="#">${jsxText(it)}</NavItem>`)
        .join("\n");
      return `<NavDrawer open type="inline" selectedValue="${slug(items[0])}">\n  <NavDrawerBody>\n${links}\n  </NavDrawerBody>\n</NavDrawer>`;
    },
  },
  Alert: {
    imports: { from: FLUENT_CORE, names: ["MessageBar", "MessageBarBody", "MessageBarTitle"] },
    toJsx: (p) =>
      `<MessageBar intent="${jsxAttr(p.variant, "info")}">\n  <MessageBarBody>\n    <MessageBarTitle>${jsxText(p.title, "Alert")}</MessageBarTitle>\n    ${jsxText(p.message)}\n  </MessageBarBody>\n</MessageBar>`,
  },
  SimulatedSkeleton: {
    imports: { from: FLUENT_CORE, names: ["Skeleton", "SkeletonItem"] },
    toJsx: (p) => {
      const shape = s(p.variant, "card") === "avatar" ? "circle" : "rectangle";
      return `<Skeleton aria-label="Loading">\n  <SkeletonItem shape="${shape}" />\n</Skeleton>`;
    },
  },
  SimulatedTooltip: {
    imports: { from: FLUENT_CORE, names: ["Tooltip", "Button"] },
    toJsx: (p) =>
      `<Tooltip content="${jsxAttr(p.text, "Tooltip")}" relationship="label">\n  <Button>${jsxText(p.buttonLabel, "Hover me")}</Button>\n</Tooltip>`,
  },
  SimulatedPopover: {
    imports: { from: FLUENT_CORE, names: ["Popover", "PopoverTrigger", "PopoverSurface", "Button"] },
    toJsx: (p) =>
      `<Popover>\n  <PopoverTrigger disableButtonEnhancement>\n    <Button>${jsxText(p.title, "Popover")}</Button>\n  </PopoverTrigger>\n  <PopoverSurface>${jsxText(p.content)}</PopoverSurface>\n</Popover>`,
  },
  SimulatedDialog: {
    imports: { from: FLUENT_CORE, names: ["Dialog", "DialogSurface", "DialogTitle", "DialogBody", "DialogActions", "Button"] },
    toJsx: (p) =>
      `<Dialog>\n  <DialogSurface>\n    <DialogTitle>${jsxText(p.title, "Dialog")}</DialogTitle>\n    <DialogBody>${jsxText(p.message)}</DialogBody>\n    <DialogActions>\n      <Button appearance="secondary">Cancel</Button>\n      <Button appearance="primary">Confirm</Button>\n    </DialogActions>\n  </DialogSurface>\n</Dialog>`,
  },
  SimulatedAccordion: {
    imports: { from: FLUENT_CORE, names: ["Accordion", "AccordionItem", "AccordionHeader", "AccordionPanel"] },
    toJsx: (p) =>
      `<Accordion collapsible>\n  <AccordionItem value="1">\n    <AccordionHeader>${jsxText(p.title, "Section")}</AccordionHeader>\n    <AccordionPanel>${jsxText(p.content)}</AccordionPanel>\n  </AccordionItem>\n</Accordion>`,
  },
  /* SimulatedChatMessage — OMIT: chat lives only in @fluentui-copilot (out of scope). */
  AppBrand: {
    imports: { from: FLUENT_CORE, names: ["Title3"] },
    toJsx: (p) => `<Title3 as="span">${jsxText(p.label, "App Name")}</Title3>`,
  },
  StatusPill: {
    imports: { from: FLUENT_CORE, names: ["Badge"] },
    toJsx: (p) => `<Badge appearance="filled" color="success">${jsxText(p.label, "Active")}</Badge>`,
  },
  NavItem: {
    imports: p2(
      () => ({ from: "@fluentui/react-nav-preview", names: ["NavItem"] }),
      (p) => ({ from: "@fluentui/react-icons", names: [fluentIconName(s(p.icon, "home"))] }),
    ),
    toJsx: (p) =>
      `<NavItem value="${slug(p.label, "item")}" href="#" icon={<${fluentIconName(s(p.icon, "home"))} />}>${jsxText(p.label, "Nav")}</NavItem>`,
  },
  FooterText: {
    imports: { from: FLUENT_CORE, names: ["Caption1"] },
    toJsx: (p) => `<Caption1 as="p">${jsxText(p.label, "Footer")} · ${jsxText(p.version, "v1.0")}</Caption1>`,
  },
};

/* ════════════════════════════════════════════════════════════════════
   CARBON — @carbon/react (+ @carbon/icons-react for icon composites)
   ════════════════════════════════════════════════════════════════════ */

const CARBON_PKG = "@carbon/react";
const CARBON_ICONS = "@carbon/icons-react";

/* Generic block `variant` -> Carbon Button kind.
   Carbon API: kind = primary|secondary|tertiary|ghost|danger.
   tertiary is Carbon's bordered/outline button; danger is the destructive kind. */
function carbonButtonAttrs(props: Record<string, unknown>): string {
  const variant = s(props.variant, "primary");
  const map: Record<string, string> = {
    primary: 'kind="primary"',
    secondary: 'kind="secondary"',
    outline: 'kind="tertiary"',
    ghost: 'kind="ghost"',
    danger: 'kind="danger"',
    destructive: 'kind="danger"',
  };
  return map[variant] ?? map.primary;
}

/* status -> Carbon Tag type (gray|blue|green|warm-gray|red). */
function carbonTagType(status: string): string {
  const map: Record<string, string> = {
    default: "gray", info: "blue", success: "green", warning: "warm-gray", error: "red",
  };
  return map[status] ?? "gray";
}

/* StatusPill label heuristic -> Carbon Tag type. */
function carbonStatusType(label: string): string {
  const l = label.toLowerCase();
  if (/(active|online|success|live)/.test(l)) return "green";
  if (/(pending|warning)/.test(l)) return "warm-gray";
  if (/(inactive|error|offline|failed)/.test(l)) return "red";
  return "gray";
}

/* nav icon name -> @carbon/icons-react component. */
function carbonIconName(icon: string): string {
  const map: Record<string, string> = {
    chat: "Chat", database: "DataBase", settings: "Settings", bar_chart: "ChartColumn",
    home: "Home", person: "User", search: "Search", notifications: "Notification",
  };
  return map[icon] ?? "Home";
}

const CARBON: Record<string, ComponentApiEntry> = {
  SimulatedButton: {
    imports: { from: CARBON_PKG, names: ["Button"] },
    toJsx: (p) => `<Button ${carbonButtonAttrs(p)}>${jsxText(p.label, "Button")}</Button>`,
  },
  SimulatedTextInput: {
    imports: { from: CARBON_PKG, names: ["TextInput"] },
    toJsx: (p) =>
      `<TextInput id="${slug(p.label, "input")}" labelText="${jsxAttr(p.label, "Label")}" placeholder="${jsxAttr(p.placeholder)}" />`,
  },
  SimulatedCheckbox: {
    imports: { from: CARBON_PKG, names: ["Checkbox"] },
    toJsx: (p) =>
      `<Checkbox id="${slug(p.label, "checkbox")}" labelText="${jsxAttr(p.label)}"${p.defaultChecked ? " defaultChecked" : ""} />`,
  },
  SimulatedSwitch: {
    imports: { from: CARBON_PKG, names: ["Toggle"] },
    toJsx: (p) =>
      `<Toggle id="${slug(p.label, "toggle")}" labelText="${jsxAttr(p.label)}"${p.defaultOn ? " defaultToggled" : ""} />`,
  },
  SimulatedCard: {
    imports: { from: CARBON_PKG, names: ["Tile"] },
    toJsx: (p) => `<Tile>\n  <h3>${jsxText(p.title, "Card")}</h3>\n  <p>${jsxText(p.content)}</p>\n</Tile>`,
  },

  /* ── extended coverage ── */
  /* SimulatedTitle — OMIT: Carbon ships no Heading component (cds--type-* classes only). */
  /* SimulatedToggleButton — OMIT: Carbon has no pressable toggle-button (Toggle is a switch). */
  SimulatedSegmentedGroup: {
    imports: { from: CARBON_PKG, names: ["ContentSwitcher", "Switch"] },
    toJsx: (p) => {
      const opts = csv(p.optionsCsv, ["Day", "Week", "Month"]);
      const di = num(p.defaultIndex, 0);
      const switches = opts.map((o) => `  <Switch name="${slug(o)}" text="${jsxAttr(o)}" />`).join("\n");
      return `<ContentSwitcher selectedIndex={${di}} onChange={() => {}}>\n${switches}\n</ContentSwitcher>`;
    },
  },
  SimulatedLink: {
    imports: p2(() => ({ from: CARBON_PKG, names: ["Link"] }), () => ({ from: CARBON_ICONS, names: ["ArrowRight"] })),
    toJsx: (p) =>
      p.showIcon
        ? `<Link href="#" renderIcon={ArrowRight}>${jsxText(p.text, "Learn more")}</Link>`
        : `<Link href="#">${jsxText(p.text, "Learn more")}</Link>`,
  },
  SimulatedMultilineInput: {
    imports: { from: CARBON_PKG, names: ["TextArea"] },
    toJsx: (p) =>
      `<TextArea id="${slug(p.label, "textarea")}" labelText="${jsxAttr(p.label, "Label")}" placeholder="${jsxAttr(p.placeholder)}" rows={${num(p.rows, 3)}} />`,
  },
  SimulatedNumberInput: {
    /* NumberInput uses `label` (NOT labelText) and requires a unique id. */
    imports: { from: CARBON_PKG, names: ["NumberInput"] },
    toJsx: (p) =>
      `<NumberInput id="${slug(p.label, "number")}" label="${jsxAttr(p.label, "Label")}" defaultValue={${num(p.value, 1)}} min={${num(p.min, 0)}} max={${num(p.max, 99)}} step={${num(p.step, 1)}} />`,
  },
  SimulatedDatePicker: {
    imports: { from: CARBON_PKG, names: ["DatePicker", "DatePickerInput"] },
    toJsx: () =>
      `<DatePicker datePickerType="single">\n  <DatePickerInput id="date-picker" labelText="Date" placeholder="mm/dd/yyyy" />\n</DatePicker>`,
  },
  SimulatedSlider: {
    imports: { from: CARBON_PKG, names: ["Slider"] },
    toJsx: (p) =>
      `<Slider id="${slug(p.label, "slider")}" labelText="${jsxAttr(p.label, "Label")}" value={${num(p.value, 50)}} min={${num(p.min, 0)}} max={${num(p.max, 100)}} step={1} />`,
  },
  SimulatedRadioGroup: {
    imports: { from: CARBON_PKG, names: ["RadioButtonGroup", "RadioButton"] },
    toJsx: (p) => {
      const opts = csv(p.optionsCsv, ["Option A", "Option B", "Option C"]);
      const di = num(p.defaultIndex, 0);
      const buttons = opts
        .map((o) => `  <RadioButton id="${slug(o)}" value="${slug(o)}" labelText="${jsxAttr(o)}" />`)
        .join("\n");
      return `<RadioButtonGroup name="${slug(p.label, "group")}" legendText="${jsxAttr(p.label, "Label")}" defaultSelected="${slug(opts[di] ?? opts[0])}">\n${buttons}\n</RadioButtonGroup>`;
    },
  },
  SimulatedDropdown: {
    imports: { from: CARBON_PKG, names: ["Dropdown"] },
    toJsx: (p) =>
      `<Dropdown id="dropdown" titleText="" label="${jsxAttr(p.placeholder, "Select an option")}" items={["Option 1", "Option 2", "Option 3"]} itemToString={(item) => item ?? ""} />`,
  },
  SimulatedComboBox: {
    imports: { from: CARBON_PKG, names: ["ComboBox"] },
    toJsx: (p) => {
      const opts = csv(p.itemsCsv, ["United States", "United Kingdom", "Canada"]);
      const arr = opts.map((o) => JSON.stringify(o)).join(", ");
      return `<ComboBox id="combobox" titleText="" placeholder="${jsxAttr(p.placeholder, "Search...")}" items={[${arr}]} itemToString={(item) => item ?? ""} />`;
    },
  },
  SimulatedSearchbox: {
    imports: { from: CARBON_PKG, names: ["Search"] },
    toJsx: (p) =>
      `<Search id="search" labelText="Search" placeholder="${jsxAttr(p.placeholder, "Search...")}" size="md" />`,
  },
  /* SimulatedRating — OMIT: Carbon ships no Rating/star component. */
  SimulatedTokenizedInput: {
    imports: { from: CARBON_PKG, names: ["FilterableMultiSelect"] },
    toJsx: (p) => {
      const tokens = csv(p.tokensCsv, ["alice@co.com", "bob@co.com"]);
      const arr = tokens.map((t) => JSON.stringify(t)).join(", ");
      return `<FilterableMultiSelect id="${slug(p.label, "multiselect")}" titleText="${jsxAttr(p.label, "Label")}" placeholder="Add item" items={[${arr}]} itemToString={(item) => item ?? ""} initialSelectedItems={[${arr}]} />`;
    },
  },
  SimulatedFileDropZone: {
    imports: { from: CARBON_PKG, names: ["FileUploaderDropContainer"] },
    toJsx: (p) => {
      const accept = csv(p.acceptTypes, [".png", ".jpg", ".pdf"]).map((t) => JSON.stringify(t)).join(", ");
      return `<FileUploaderDropContainer labelText="${jsxAttr(p.label, "Drag & drop files here")}" accept={[${accept}]} multiple onAddFiles={() => {}} />`;
    },
  },
  SimulatedDataTable: {
    imports: { from: CARBON_PKG, names: ["DataTable", "Table", "TableHead", "TableHeader", "TableRow", "TableBody", "TableCell"] },
    toJsx: () =>
      `<DataTable rows={[{ id: "1", name: "Jane Doe", status: "Active" }]} headers={[{ key: "name", header: "Name" }, { key: "status", header: "Status" }]}>\n  {({ rows, headers, getHeaderProps, getRowProps }) => (\n    <Table>\n      <TableHead>\n        <TableRow>\n          {headers.map((h) => (\n            <TableHeader {...getHeaderProps({ header: h })} key={h.key}>{h.header}</TableHeader>\n          ))}\n        </TableRow>\n      </TableHead>\n      <TableBody>\n        {rows.map((row) => (\n          <TableRow {...getRowProps({ row })} key={row.id}>\n            {row.cells.map((c) => <TableCell key={c.id}>{c.value}</TableCell>)}\n          </TableRow>\n        ))}\n      </TableBody>\n    </Table>\n  )}\n</DataTable>`,
  },
  SimulatedStatCard: {
    imports: { from: CARBON_PKG, names: ["Tile"] },
    toJsx: (p) =>
      `<Tile>\n  <p className="cds--type-label-01">${jsxText(p.label, "Metric")}</p>\n  <p className="cds--type-heading-04">${jsxText(p.value, "0")}</p>\n  <span style={{ color: "var(--cds-support-success)" }}>+${num(p.pct, 0)}%</span>\n</Tile>`,
  },
  /* SimulatedListBox — OMIT: Carbon ListBox is an internal select sub-primitive, not standalone. */
  SimulatedTree: {
    imports: { from: CARBON_PKG, names: ["TreeView", "TreeNode"] },
    toJsx: (p) => {
      const tree = parseTree(p.itemsCsv, ["Documents > Work", "Documents > Personal"]);
      const render = (nodes: TreeNodeData[], prefix: string, depth: number): string =>
        nodes
          .map((n) => {
            const id = prefix ? `${prefix}-${slug(n.label)}` : slug(n.label);
            const pad = "  ".repeat(depth + 1);
            if (!n.children.length) return `${pad}<TreeNode id="${id}" label="${jsxAttr(n.label)}" />`;
            return `${pad}<TreeNode id="${id}" label="${jsxAttr(n.label)}">\n${render(n.children, id, depth + 1)}\n${pad}</TreeNode>`;
          })
          .join("\n");
      return `<TreeView label="Files" hideLabel>\n${render(tree, "", 0)}\n</TreeView>`;
    },
  },
  SimulatedProgress: {
    imports: { from: CARBON_PKG, names: ["ProgressBar"] },
    toJsx: (p) =>
      `<ProgressBar label="${jsxAttr(p.label, "Progress")}" helperText="${num(p.value, 50)}%" value={${num(p.value, 50)}} max={100} />`,
  },
  /* SimulatedAvatar — OMIT: Carbon ships no first-party Avatar (compose markup). */
  /* SimulatedAvatarGroup — OMIT: Carbon has neither Avatar nor AvatarGroup. */
  SimulatedBadge: {
    imports: { from: CARBON_PKG, names: ["Tag"] },
    toJsx: (p) => `<Tag type="${carbonTagType(s(p.status, "default"))}">${jsxText(p.label, "Badge")}</Tag>`,
  },
  SimulatedPill: {
    /* dismissible -> DismissibleTag (current API); else plain Tag. */
    imports: p2(
      () => ({ from: CARBON_PKG, names: ["DismissibleTag"] }),
      () => ({ from: CARBON_PKG, names: ["Tag"] }),
    ),
    toJsx: (p) =>
      p.dismissible
        ? `<DismissibleTag type="${carbonTagType(s(p.status, "default"))}" text="${jsxAttr(p.label, "Tag")}" title="Remove" onClose={() => {}} />`
        : `<Tag type="${carbonTagType(s(p.status, "default"))}">${jsxText(p.label, "Tag")}</Tag>`,
  },
  /* SimulatedPersona — OMIT: Carbon has no Persona (and no Avatar to build it from). */
  SimulatedTabs: {
    imports: { from: CARBON_PKG, names: ["Tabs", "TabList", "Tab", "TabPanels", "TabPanel"] },
    toJsx: (p) => {
      const tabs = csv(p.tabsCsv, ["General", "Security", "Notifications"]);
      const tabEls = tabs.map((t) => `    <Tab>${jsxText(t)}</Tab>`).join("\n");
      const panels = tabs.map((t) => `    <TabPanel>${jsxText(t)}</TabPanel>`).join("\n");
      return `<Tabs>\n  <TabList aria-label="Tabs">\n${tabEls}\n  </TabList>\n  <TabPanels>\n${panels}\n  </TabPanels>\n</Tabs>`;
    },
  },
  SimulatedBreadcrumb: {
    imports: { from: CARBON_PKG, names: ["Breadcrumb", "BreadcrumbItem"] },
    toJsx: (p) => {
      const path = csv(p.pathCsv, ["Home", "Projects", "Design Hub"]);
      const items = path
        .map((seg, i) =>
          i === path.length - 1
            ? `  <BreadcrumbItem isCurrentPage>${jsxText(seg)}</BreadcrumbItem>`
            : `  <BreadcrumbItem href="#">${jsxText(seg)}</BreadcrumbItem>`,
        )
        .join("\n");
      return `<Breadcrumb>\n${items}\n</Breadcrumb>`;
    },
  },
  SimulatedNavDrawer: {
    imports: { from: CARBON_PKG, names: ["SideNav", "SideNavItems", "SideNavLink"] },
    toJsx: (p) => {
      const items = csv(p.itemsCsv, ["Home", "Dashboard", "Settings"]);
      const links = items
        .map((it, i) => `    <SideNavLink href="#"${i === 0 ? " isActive" : ""}>${jsxText(it)}</SideNavLink>`)
        .join("\n");
      return `<SideNav aria-label="Side navigation" expanded isFixedNav>\n  <SideNavItems>\n${links}\n  </SideNavItems>\n</SideNav>`;
    },
  },
  Alert: {
    imports: { from: CARBON_PKG, names: ["InlineNotification"] },
    toJsx: (p) =>
      `<InlineNotification kind="${jsxAttr(p.variant, "info")}" title="${jsxAttr(p.title, "Alert")}" subtitle="${jsxAttr(p.message)}" />`,
  },
  SimulatedSkeleton: {
    imports: { from: CARBON_PKG, names: ["SkeletonText", "SkeletonPlaceholder"] },
    toJsx: (p) => {
      const variant = s(p.variant, "card");
      if (variant === "text") return `<SkeletonText heading />`;
      if (variant === "avatar")
        return `<SkeletonPlaceholder style={{ borderRadius: "50%", width: "2.5rem", height: "2.5rem" }} />`;
      return `<SkeletonPlaceholder style={{ width: "100%", height: "8rem" }} />`;
    },
  },
  SimulatedTooltip: {
    imports: { from: CARBON_PKG, names: ["Tooltip", "Button"] },
    toJsx: (p) =>
      `<Tooltip label="${jsxAttr(p.text, "Tooltip")}" align="bottom">\n  <Button kind="ghost">${jsxText(p.buttonLabel, "Hover me")}</Button>\n</Tooltip>`,
  },
  SimulatedPopover: {
    imports: { from: CARBON_PKG, names: ["Popover", "PopoverContent"] },
    toJsx: (p) =>
      `<Popover open align="bottom">\n  <button type="button">Anchor</button>\n  <PopoverContent>\n    <p className="cds--type-heading-compact-01">${jsxText(p.title, "Popover")}</p>\n    <p className="cds--type-body-01">${jsxText(p.content)}</p>\n  </PopoverContent>\n</Popover>`,
  },
  SimulatedDialog: {
    /* Carbon's Dialog component is named Modal. */
    imports: { from: CARBON_PKG, names: ["Modal"] },
    toJsx: (p) =>
      `<Modal open modalHeading="${jsxAttr(p.title, "Dialog")}" primaryButtonText="Confirm" secondaryButtonText="Cancel" danger onRequestClose={() => {}}>\n  <p>${jsxText(p.message)}</p>\n</Modal>`,
  },
  SimulatedAccordion: {
    imports: { from: CARBON_PKG, names: ["Accordion", "AccordionItem"] },
    toJsx: (p) =>
      `<Accordion>\n  <AccordionItem title="${jsxAttr(p.title, "Section")}">\n    ${jsxText(p.content)}\n  </AccordionItem>\n</Accordion>`,
  },
  /* SimulatedChatMessage — OMIT: chat lives in @carbon/ai-chat (separate experimental pkg). */
  AppBrand: {
    imports: { from: CARBON_PKG, names: ["HeaderName"] },
    toJsx: (p) => `<HeaderName href="#" prefix="">${jsxText(p.label, "App Name")}</HeaderName>`,
  },
  StatusPill: {
    imports: { from: CARBON_PKG, names: ["Tag"] },
    toJsx: (p) => `<Tag type="${carbonStatusType(s(p.label, "Active"))}">${jsxText(p.label, "Active")}</Tag>`,
  },
  NavItem: {
    imports: p2(
      () => ({ from: CARBON_PKG, names: ["SideNavLink"] }),
      (p) => ({ from: CARBON_ICONS, names: [carbonIconName(s(p.icon, "home"))] }),
    ),
    toJsx: (p) =>
      `<SideNavLink href="#" renderIcon={${carbonIconName(s(p.icon, "home"))}} isActive={${p.active ? "true" : "false"}}>${jsxText(p.label, "Nav")}</SideNavLink>`,
  },
  /* FooterText — OMIT: @carbon/react has no Footer component (styled <footer> fallback). */
};

/* ════════════════════════════════════════════════════════════════════
   UOAUI — in-house CSS DS. Every "import" is the same side-effect
   stylesheet (the --a-* tokens + .a-* rules); no named component exports.
   Where uoaui has no real class/demo (slider, rating, dropzone, skeleton),
   the block is OMITTED so reactExporter falls back to honest generic markup.
   ════════════════════════════════════════════════════════════════════ */

/* Generic block `variant` -> uoaui button class suffix. uoaui has NO danger
   button variant, so danger falls to primary (the closest real class). */
function uoauiButtonClass(props: Record<string, unknown>): string {
  const variant = s(props.variant, "primary");
  const map: Record<string, string> = {
    primary: "a-btn-primary",
    secondary: "a-btn-secondary",
    outline: "a-btn-outline",
    ghost: "a-btn-ghost",
    danger: "a-btn-primary",
    destructive: "a-btn-primary",
  };
  return map[variant] ?? map.primary;
}

/* status -> uoaui badge variant class (no 'info' variant; accent is closest). */
function uoauiBadgeClass(status: string): string {
  const map: Record<string, string> = {
    default: "a-badge-default", info: "a-badge-accent", success: "a-badge-success",
    warning: "a-badge-warning", error: "a-badge-danger",
  };
  return map[status] ?? "a-badge-default";
}

const uoauiImport: ImportSpec = { from: "./uoaui-theme.css", names: [] };

const UOAUI: Record<string, ComponentApiEntry> = {
  SimulatedButton: {
    imports: uoauiImport,
    toJsx: (p) => `<button className="a-btn ${uoauiButtonClass(p)}">${jsxText(p.label, "Button")}</button>`,
  },
  SimulatedTextInput: {
    imports: uoauiImport,
    toJsx: (p) =>
      `<div className="a-input-wrap">\n  <label className="a-input-label">${jsxText(p.label, "Label")}</label>\n  <input className="a-input" placeholder="${jsxAttr(p.placeholder)}" />\n</div>`,
  },
  SimulatedCheckbox: {
    imports: uoauiImport,
    toJsx: (p) => {
      const checked = !!p.defaultChecked;
      return `<label className="a-checkbox${checked ? " checked" : ""}">\n  <span className="a-cb-box">${checked ? "✓" : ""}</span>\n  ${jsxText(p.label)}\n</label>`;
    },
  },
  /* SimulatedSwitch — OMIT: uoaui ships no switch/toggle class. */
  SimulatedCard: {
    imports: uoauiImport,
    toJsx: (p) => `<div className="a-card">\n  <h3>${jsxText(p.title, "Card")}</h3>\n  <p>${jsxText(p.content)}</p>\n</div>`,
  },

  /* ── extended coverage (className composites over real .a-* classes) ── */
  SimulatedTitle: {
    imports: uoauiImport,
    toJsx: (p) => {
      const tag = ({ h1: "h1", h2: "h2", h3: "h3", h4: "h4" } as Record<string, string>)[s(p.level, "h2")] ?? "h2";
      return `<${tag} className="a-title">${jsxText(p.text, "Heading")}</${tag}>`;
    },
  },
  SimulatedToggleButton: {
    imports: uoauiImport,
    toJsx: (p) => {
      const pressed = !!p.defaultPressed;
      const cls = pressed ? "a-btn a-btn-primary" : "a-btn a-btn-secondary";
      return `<button type="button" className="${cls}" aria-pressed={${pressed ? "true" : "false"}}>${jsxText(p.label, "Toggle")}</button>`;
    },
  },
  SimulatedSegmentedGroup: {
    imports: uoauiImport,
    toJsx: (p) => {
      const opts = csv(p.optionsCsv, ["Day", "Week", "Month"]);
      const di = num(p.defaultIndex, 0);
      const buttons = opts
        .map(
          (o, i) =>
            `  <button type="button" role="tab" aria-selected={${i === di ? "true" : "false"}} className="a-tab${i === di ? " active" : ""}">${jsxText(o)}</button>`,
        )
        .join("\n");
      return `<div className="a-tabs" role="tablist" aria-label="View">\n${buttons}\n</div>`;
    },
  },
  SimulatedLink: {
    imports: uoauiImport,
    toJsx: (p) =>
      p.showIcon
        ? `<a href="#" className="a-link">${jsxText(p.text, "Learn more")}<span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span></a>`
        : `<a href="#" className="a-link">${jsxText(p.text, "Learn more")}</a>`,
  },
  SimulatedMultilineInput: {
    imports: uoauiImport,
    toJsx: (p) =>
      `<div className="a-input-wrap">\n  <label className="a-input-label">${jsxText(p.label, "Label")}</label>\n  <textarea className="a-input" rows={${num(p.rows, 3)}} placeholder="${jsxAttr(p.placeholder)}" style={{ height: "auto", paddingTop: 8 }} />\n</div>`,
  },
  SimulatedNumberInput: {
    imports: uoauiImport,
    toJsx: (p) =>
      `<div className="a-input-wrap">\n  <label className="a-input-label">${jsxText(p.label, "Label")}</label>\n  <input className="a-input" type="number" defaultValue={${num(p.value, 1)}} min={${num(p.min, 0)}} max={${num(p.max, 99)}} step={${num(p.step, 1)}} />\n</div>`,
  },
  /* SimulatedDatePicker — uoaui has a real role=grid calendar demo (no class);
     emit the accent-highlighted grid the DS itself uses. */
  SimulatedDatePicker: {
    imports: uoauiImport,
    toJsx: (p) => {
      const label = `${s(p.month, "October")} ${s(p.year, "2026")}`;
      return `<div className="a-datepicker">\n  <div className="a-dp-header"><button type="button" aria-label="Previous month"><span className="material-symbols-outlined">chevron_left</span></button><span aria-live="polite">${jsxText(label)}</span><button type="button" aria-label="Next month"><span className="material-symbols-outlined">chevron_right</span></button></div>\n  <div role="grid" aria-label="${jsxAttr(label)}" style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>\n    {["Mo","Tu","We","Th","Fr","Sa","Su"].map((d) => <div key={d} role="columnheader">{d}</div>)}\n    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <button key={d} type="button" role="gridcell" aria-pressed={d === 15} style={{ background: d === 15 ? "var(--a-accent)" : "transparent", color: d === 15 ? "var(--a-accent-fg)" : "var(--a-fg)", borderRadius: 9999, border: "none", width: 32, height: 32 }}>{d}</button>)}\n  </div>\n</div>`;
    },
  },
  /* SimulatedSlider — OMIT: no real uoaui slider/range class. */
  SimulatedRadioGroup: {
    imports: uoauiImport,
    toJsx: (p) => {
      const opts = csv(p.optionsCsv, ["Option A", "Option B", "Option C"]);
      const di = num(p.defaultIndex, 0);
      const rows = opts
        .map((o, i) =>
          i === di
            ? `  <div className="a-radio selected" role="radio" aria-checked={true} tabIndex={0}><div className="a-radio-circle"><div style={{ width: 8, height: 8, borderRadius: 4, background: "var(--a-accent)" }} /></div>${jsxText(o)}</div>`
            : `  <div className="a-radio" role="radio" aria-checked={false} tabIndex={-1}><div className="a-radio-circle" />${jsxText(o)}</div>`,
        )
        .join("\n");
      return `<div role="radiogroup" aria-label="${jsxAttr(p.label, "Select option")}">\n${rows}\n</div>`;
    },
  },
  SimulatedDropdown: {
    imports: uoauiImport,
    toJsx: (p) =>
      `<div className="a-dropdown">\n  <button type="button" className="a-dropdown-trigger" aria-haspopup="listbox" aria-expanded={false}>\n    <span>${jsxText(p.placeholder, "Select an option")}</span>\n    <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>\n  </button>\n  <ul className="a-dropdown-menu" role="listbox" aria-label="${jsxAttr(p.placeholder, "Select an option")}" hidden>\n    <li className="a-dropdown-item" role="option" aria-selected={false}>Option A</li>\n    <li className="a-dropdown-item" role="option" aria-selected={false}>Option B</li>\n  </ul>\n</div>`,
  },
  SimulatedComboBox: {
    imports: uoauiImport,
    toJsx: (p) => {
      const opts = csv(p.itemsCsv, ["United States", "United Kingdom", "Canada"]);
      const items = opts
        .map((o) => `    <li className="a-dropdown-item" role="option" aria-selected={false}>${jsxText(o)}</li>`)
        .join("\n");
      return `<div className="a-dropdown">\n  <input className="a-input" role="combobox" aria-expanded={false} aria-autocomplete="list" aria-controls="cb-list" placeholder="${jsxAttr(p.placeholder, "Search...")}" />\n  <ul id="cb-list" className="a-dropdown-menu" role="listbox" hidden>\n${items}\n  </ul>\n</div>`;
    },
  },
  SimulatedSearchbox: {
    imports: uoauiImport,
    toJsx: (p) =>
      `<div className="a-input-wrap" style={{ position: "relative" }}>\n  <span className="material-symbols-outlined" aria-hidden="true" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>search</span>\n  <input className="a-input" type="search" placeholder="${jsxAttr(p.placeholder, "Search...")}" aria-label="Search" style={{ paddingLeft: 34 }} />\n</div>`,
  },
  /* SimulatedRating — OMIT: no real uoaui rating/star class. */
  SimulatedTokenizedInput: {
    imports: uoauiImport,
    toJsx: (p) => {
      const tokens = csv(p.tokensCsv, ["alice@co.com", "bob@co.com"]);
      const chips = tokens
        .map(
          (t) =>
            `    <span className="a-badge a-badge-default">${jsxText(t)}<span className="material-symbols-outlined" style={{ fontSize: 14, cursor: "pointer" }}>close</span></span>`,
        )
        .join("\n");
      return `<div className="a-input-wrap">\n  <label className="a-input-label">${jsxText(p.label, "Label")}</label>\n  <div className="a-input" style={{ display: "flex", flexWrap: "wrap", gap: 6, height: "auto", alignItems: "center", paddingTop: 6, paddingBottom: 6 }}>\n${chips}\n    <input style={{ border: "none", background: "transparent", outline: "none", flex: 1, color: "var(--a-fg)" }} aria-label="Add item" />\n  </div>\n</div>`;
    },
  },
  /* SimulatedFileDropZone — OMIT: no real uoaui dropzone class. */
  SimulatedDataTable: {
    imports: uoauiImport,
    toJsx: () =>
      `<div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--a-border)", backdropFilter: "blur(16px) saturate(140%)" }}>\n  <table className="a-table">\n    <thead><tr><th>Name</th><th>Status</th><th>Users</th></tr></thead>\n    <tbody>\n      <tr><td style={{ fontWeight: 500 }}>Dashboard</td><td><span className="a-badge a-badge-success">Active</span></td><td>1,247</td></tr>\n      <tr><td style={{ fontWeight: 500 }}>Analytics</td><td><span className="a-badge a-badge-warning">Pending</span></td><td>892</td></tr>\n    </tbody>\n  </table>\n</div>`,
  },
  SimulatedStatCard: {
    imports: uoauiImport,
    toJsx: (p) =>
      `<div className="a-card" style={{ padding: 16 }}>\n  <div style={{ fontSize: 11, color: "var(--a-fg-3)", fontWeight: 500 }}>${jsxText(p.label, "Metric")}</div>\n  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--a-fg)", letterSpacing: "-0.02em", margin: "6px 0 10px" }}>${jsxText(p.value, "0")}</div>\n  <div className="a-progress-track"><div className="a-progress-fill" style={{ width: "${num(p.pct, 0)}%" }} /></div>\n</div>`,
  },
  SimulatedListBox: {
    imports: uoauiImport,
    toJsx: (p) => {
      const opts = csv(p.itemsCsv, ["Apple", "Banana", "Cherry"]);
      const items = opts
        .map(
          (o, i) =>
            `  <li className="a-dropdown-item" role="option" aria-selected={${i === 0 ? "true" : "false"}} tabIndex={0}>${jsxText(o)}</li>`,
        )
        .join("\n");
      const multi = p.multiSelect ? " aria-multiselectable={true}" : "";
      return `<ul className="a-dropdown-menu" role="listbox" aria-label="Items"${multi} style={{ position: "static" }}>\n${items}\n</ul>`;
    },
  },
  SimulatedTree: {
    imports: uoauiImport,
    toJsx: (p) => {
      const tree = parseTree(p.itemsCsv, ["Documents > Work", "Documents > Personal"]);
      const render = (nodes: TreeNodeData[], depth: number): string =>
        nodes
          .map((n) => {
            const pad = "  ".repeat(depth + 1);
            const icon = n.children.length ? "folder" : "description";
            const row = `${pad}<li role="treeitem"${n.children.length ? " aria-expanded={true}" : ""}>\n${pad}  <div className="a-sidebar-item"><span className="material-symbols-outlined">${icon}</span>${jsxText(n.label)}</div>`;
            if (!n.children.length) return `${row}</li>`;
            return `${row}\n${pad}  <ul role="group" style={{ listStyle: "none", paddingLeft: 16 }}>\n${render(n.children, depth + 2)}\n${pad}  </ul>\n${pad}</li>`;
          })
          .join("\n");
      return `<ul role="tree" aria-label="Files" style={{ listStyle: "none", margin: 0, padding: 0 }}>\n${render(tree, 0)}\n</ul>`;
    },
  },
  SimulatedProgress: {
    imports: uoauiImport,
    toJsx: (p) =>
      `<div>\n  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--a-fg-2)", marginBottom: 4 }}><span>${jsxText(p.label, "Progress")}</span><span>${num(p.value, 50)}%</span></div>\n  <div className="a-progress-track"><div className="a-progress-fill" style={{ width: "${num(p.value, 50)}%" }} /></div>\n</div>`,
  },
  SimulatedAvatar: {
    imports: uoauiImport,
    toJsx: (p) => {
      const presence = s(p.presence);
      const dotColor = ({
        available: "var(--a-success-fg)", busy: "var(--a-danger-fg)",
        away: "var(--a-warning-fg)", offline: "var(--a-fg-3)",
      } as Record<string, string>)[presence];
      const dot = dotColor
        ? `\n  <span style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: "${dotColor}", border: "2px solid var(--a-bg)" }} aria-hidden="true" />`
        : "";
      return `<div style={{ position: "relative", display: "inline-flex" }}>\n  <div className="a-avatar">${jsxText(p.initials, "?")}</div>${dot}\n</div>`;
    },
  },
  SimulatedAvatarGroup: {
    imports: uoauiImport,
    toJsx: (p) => {
      const names = csv(p.namesCsv, ["AB", "CD", "EF"]);
      const max = num(p.max, 4);
      const shown = names.slice(0, max);
      const overflow = names.length - max;
      const avatars = shown
        .map(
          (n, i) =>
            `  <div className="a-avatar" style={{ marginLeft: ${i === 0 ? 0 : -8}, border: "2px solid var(--a-bg)" }}>${jsxText(n)}</div>`,
        )
        .join("\n");
      const extra =
        overflow > 0
          ? `\n  <div className="a-avatar" style={{ marginLeft: -8, border: "2px solid var(--a-bg)", color: "var(--a-fg-2)" }}>+${overflow}</div>`
          : "";
      return `<div style={{ display: "flex" }}>\n${avatars}${extra}\n</div>`;
    },
  },
  SimulatedBadge: {
    imports: uoauiImport,
    toJsx: (p) => `<span className="a-badge ${uoauiBadgeClass(s(p.status, "default"))}">${jsxText(p.label, "Badge")}</span>`,
  },
  SimulatedPill: {
    imports: uoauiImport,
    toJsx: (p) => {
      const cls = uoauiBadgeClass(s(p.status, "default"));
      const close = p.dismissible
        ? `<button type="button" aria-label="Remove ${jsxAttr(s(p.label, "Tag"))}" style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", marginLeft: 4, color: "inherit" }}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span></button>`
        : "";
      return `<span className="a-badge ${cls}">${jsxText(p.label, "Tag")}${close}</span>`;
    },
  },
  SimulatedPersona: {
    imports: uoauiImport,
    toJsx: (p) => {
      const presence = s(p.presence);
      const dotColor = ({
        available: "var(--a-success-fg)", busy: "var(--a-danger-fg)",
        away: "var(--a-warning-fg)", offline: "var(--a-fg-3)",
      } as Record<string, string>)[presence] ?? "var(--a-success-fg)";
      return `<div style={{ display: "flex", alignItems: "center", gap: 10 }}>\n  <div style={{ position: "relative", display: "inline-flex" }}>\n    <div className="a-avatar">${slug(p.name, "p").slice(0, 2).toUpperCase()}</div>\n    <span style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: "${dotColor}", border: "2px solid var(--a-bg)" }} aria-hidden="true" />\n  </div>\n  <div>\n    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--a-fg)" }}>${jsxText(p.name, "Name")}</div>\n    <div style={{ fontSize: 11, color: "var(--a-fg-3)" }}>${jsxText(p.role)}</div>\n  </div>\n</div>`;
    },
  },
  SimulatedTabs: {
    imports: uoauiImport,
    toJsx: (p) => {
      const tabs = csv(p.tabsCsv, ["General", "Security", "Notifications"]);
      const buttons = tabs
        .map(
          (t, i) =>
            `    <button type="button" role="tab" id="tab-${i}" aria-selected={${i === 0 ? "true" : "false"}} aria-controls="panel-${i}" tabIndex={${i === 0 ? 0 : -1}} className="a-tab${i === 0 ? " active" : ""}">${jsxText(t)}</button>`,
        )
        .join("\n");
      return `<div>\n  <div className="a-tabs" role="tablist" aria-label="Sections">\n${buttons}\n  </div>\n  <div id="panel-0" role="tabpanel" aria-labelledby="tab-0">Content for ${jsxText(tabs[0])} tab.</div>\n</div>`;
    },
  },
  SimulatedBreadcrumb: {
    imports: uoauiImport,
    toJsx: (p) => {
      const path = csv(p.pathCsv, ["Home", "Projects", "Design Hub"]);
      const parts: string[] = [];
      path.forEach((seg, i) => {
        if (i === path.length - 1) {
          parts.push(`  <li><span aria-current="page" style={{ color: "var(--a-fg)", fontWeight: 600 }}>${jsxText(seg)}</span></li>`);
        } else {
          parts.push(`  <li><a href="#" style={{ color: "var(--a-fg-3)" }}>${jsxText(seg)}</a></li>`);
          parts.push(`  <li aria-hidden="true"><span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--a-fg-3)" }}>chevron_right</span></li>`);
        }
      });
      return `<nav aria-label="Breadcrumb"><ol style={{ display: "flex", alignItems: "center", gap: 6, listStyle: "none", margin: 0, padding: 0, fontSize: 12 }}>\n${parts.join("\n")}\n</ol></nav>`;
    },
  },
  SimulatedNavDrawer: {
    imports: uoauiImport,
    toJsx: (p) => {
      const items = csv(p.itemsCsv, ["Home", "Dashboard", "Settings"]);
      const links = items
        .map((it, i) => `  <button type="button" className="a-sidebar-item${i === 0 ? " active" : ""}">${jsxText(it)}</button>`)
        .join("\n");
      return `<nav aria-label="Main" style={{ width: 240, background: "var(--a-surface)", backdropFilter: "blur(16px) saturate(140%)", borderRight: "1px solid var(--a-border)", padding: 8 }}>\n${links}\n</nav>`;
    },
  },
  Alert: {
    imports: uoauiImport,
    toJsx: (p) => {
      const variant = s(p.variant, "info");
      const cls = ({ info: "a-alert-info", success: "a-alert-success", warning: "a-alert-warning", error: "a-alert-danger" } as Record<string, string>)[variant] ?? "a-alert-info";
      const icon = ({ info: "info", success: "check_circle", warning: "warning", error: "error" } as Record<string, string>)[variant] ?? "info";
      const role = variant === "warning" || variant === "error" ? "alert" : "status";
      return `<div className="a-alert ${cls}" role="${role}" aria-live="polite"><span className="material-symbols-outlined" aria-hidden="true">${icon}</span><div><strong>${jsxText(p.title, "Alert")}</strong><div>${jsxText(p.message)}</div></div></div>`;
    },
  },
  /* SimulatedSkeleton — OMIT: no real uoaui skeleton/shimmer class. */
  SimulatedTooltip: {
    imports: uoauiImport,
    toJsx: (p) =>
      `<div style={{ position: "relative", display: "inline-flex" }}>\n  <button type="button" className="a-btn a-btn-secondary" aria-describedby="tt-1">${jsxText(p.buttonLabel, "Hover me")}</button>\n  <div id="tt-1" role="tooltip" className="a-tooltip" style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" }}>${jsxText(p.text, "Tooltip")}</div>\n</div>`,
  },
  SimulatedPopover: {
    imports: uoauiImport,
    toJsx: (p) =>
      `<div style={{ position: "relative", display: "inline-block" }}>\n  <button type="button" className="a-btn a-btn-secondary" aria-haspopup="dialog" aria-expanded={false}>More info</button>\n  <div role="dialog" aria-label="${jsxAttr(p.title, "Popover")}" className="a-dropdown-menu" style={{ padding: 14, minWidth: 220 }}>\n    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--a-fg)", marginBottom: 4 }}>${jsxText(p.title, "Popover")}</div>\n    <div style={{ fontSize: 12, color: "var(--a-fg-2)" }}>${jsxText(p.content)}</div>\n  </div>\n</div>`,
  },
  SimulatedDialog: {
    imports: uoauiImport,
    toJsx: (p) =>
      `<div className="a-dialog-backdrop">\n  <div className="a-dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">\n    <div id="dlg-title" style={{ fontSize: 16, fontWeight: 600, color: "var(--a-fg)", marginBottom: 8 }}>${jsxText(p.title, "Dialog")}</div>\n    <div style={{ fontSize: 12, color: "var(--a-fg-2)", marginBottom: 16 }}>${jsxText(p.message)}</div>\n    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>\n      <button type="button" className="a-btn a-btn-ghost">Cancel</button>\n      <button type="button" className="a-btn a-btn-primary">Confirm</button>\n    </div>\n  </div>\n</div>`,
  },
  SimulatedAccordion: {
    imports: uoauiImport,
    toJsx: (p) =>
      `<div className="a-accordion">\n  <button type="button" className="a-accordion-header" aria-expanded={true} aria-controls="acc-body">\n    <span>${jsxText(p.title, "Section")}</span>\n    <span className="material-symbols-outlined" aria-hidden="true">expand_less</span>\n  </button>\n  <div id="acc-body" className="a-accordion-body">${jsxText(p.content)}</div>\n</div>`,
  },
  SimulatedChatMessage: {
    imports: uoauiImport,
    toJsx: (p) => {
      const isUser = s(p.role, "user") === "user";
      const dir = isUser ? "row-reverse" : "row";
      const avatar = isUser ? "You" : "AI";
      const bubble = isUser
        ? `<div className="a-card" style={{ padding: "10px 14px", background: "var(--a-accent-surface)", borderColor: "var(--a-border-accent)", maxWidth: "75%", cursor: "default" }}>${jsxText(p.message)}</div>`
        : `<div className="a-card" style={{ padding: "10px 14px", maxWidth: "75%", cursor: "default" }}>${jsxText(p.message)}</div>`;
      return `<div style={{ display: "flex", gap: 8, flexDirection: "${dir}", alignItems: "flex-start" }}>\n  <div className="a-avatar">${avatar}</div>\n  ${bubble}\n</div>`;
    },
  },
  AppBrand: {
    imports: uoauiImport,
    toJsx: (p) =>
      `<div style={{ display: "flex", alignItems: "center", gap: 8 }}>\n  <span style={{ width: 24, height: 24, borderRadius: 8, background: "var(--a-accent-gradient, var(--a-accent))" }} aria-hidden="true" />\n  <span style={{ fontWeight: 700, color: "var(--a-fg)", letterSpacing: "-0.01em" }}>${jsxText(p.label, "App Name")}</span>\n</div>`,
  },
  StatusPill: {
    imports: uoauiImport,
    toJsx: (p) =>
      `<span className="a-badge a-badge-success"><span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", marginRight: 6, display: "inline-block" }} aria-hidden="true" />${jsxText(p.label, "Active")}</span>`,
  },
  NavItem: {
    imports: uoauiImport,
    toJsx: (p) =>
      `<button type="button" className="a-sidebar-item${p.active ? " active" : ""}" aria-current={${p.active ? '"page"' : "false"}}><span className="material-symbols-outlined" aria-hidden="true">${jsxText(p.icon, "chat")}</span>${jsxText(p.label, "Nav")}</button>`,
  },
  FooterText: {
    imports: uoauiImport,
    toJsx: (p) =>
      `<footer style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--a-fg-3)" }}>\n  <span>${jsxText(p.label, "Footer")}</span>\n  <span className="a-badge a-badge-default">${jsxText(p.version, "v1.0")}</span>\n</footer>`,
  },
};

/* p2 builds a per-prop array of import specs for composites that span packages
   (e.g. Salt Link = core Link + icons ChevronRightIcon, where the icon's name
   may depend on props). Each fn receives the block props at collect time. */
function p2(
  ...specs: Array<(props: Record<string, unknown>) => ImportSpec>
): (props: Record<string, unknown>) => ImportSpec[] {
  return (props) => specs.map((fn) => fn(props));
}

/* Per-DS registries. All five DSs seeded. uoaui is className/CSS-based; the
   other four import real component packages. */
const REGISTRY: Partial<Record<SystemId, Record<string, ComponentApiEntry>>> = {
  salt: SALT,
  m3: M3,
  fluent: FLUENT,
  carbon: CARBON,
  uoaui: UOAUI,
};

export function resolveComponentApi(system: SystemId, blockType: string): ComponentApiEntry | null {
  return REGISTRY[system]?.[blockType] ?? null;
}

export function blockToRealJsx(
  system: SystemId,
  block: { type: string; props?: Record<string, unknown> },
): string | null {
  const entry = resolveComponentApi(system, block.type);
  if (!entry) return null;
  return entry.toJsx(block.props ?? {});
}

/** Normalise an entry's imports (a single spec, an array, or a prop-fn that
    returns specs) into a flat list of ImportSpec for the given block props. */
function specsFor(entry: ComponentApiEntry, props: Record<string, unknown>): ImportSpec[] {
  const imp = typeof entry.imports === "function" ? (entry.imports as (p: Record<string, unknown>) => ImportSpec[])(props) : entry.imports;
  return Array.isArray(imp) ? imp : [imp];
}

/** Deduped, sorted import statements (one per package) for a set of blocks.
    Multi-package composites (e.g. Salt Metric+Card, MUI x-tree-view) and
    prop-dependent icon imports are flattened and grouped by package. */
export function collectImports(
  system: SystemId,
  blocks: string[] | Array<{ type: string; props?: Record<string, unknown> }>,
): string[] {
  const byPkg = new Map<string, Set<string>>();
  for (const b of blocks) {
    const type = typeof b === "string" ? b : b.type;
    const props = typeof b === "string" ? {} : b.props ?? {};
    const entry = resolveComponentApi(system, type);
    if (!entry) continue;
    for (const spec of specsFor(entry, props)) {
      const set = byPkg.get(spec.from) ?? new Set<string>();
      spec.names.forEach((n) => set.add(n));
      byPkg.set(spec.from, set);
    }
  }
  return [...byPkg.entries()].map(([from, names]) =>
    names.size === 0
      ? `import "${from}";` /* side-effect import (e.g. uoaui's CSS-only theme) */
      : `import { ${[...names].sort().join(", ")} } from "${from}";`,
  );
}
