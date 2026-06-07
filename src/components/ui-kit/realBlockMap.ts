/**
 * realBlockMap (W6-P2a, +Carbon W6-P2b) — a per-DS map of `blockType -> render
 * function` for the CORE set of builder blocks (Button, TextInput, Checkbox,
 * Switch, Card), returning the REAL design-system markup for that block.
 *
 * SCOPE: this file implements `uoaui` (className + `--a-*` token CSS, no npm
 * package) and `carbon` (real @carbon/react components).
 *
 *   - uoaui: each render fn composes the real `.a-*` classes (e.g.
 *     `<button className="a-btn a-btn-primary">`), sourced from
 *     componentApiRegistry's UOAUI `toJsx` entries and the live demos in
 *     src/data/uoaui/uoaui-documentation.jsx. Styling is injected by
 *     RealComponentRenderer's UoauiReal subtree (the existing getFullCSS /
 *     uoauiBuildCSS theme mechanism) — uoaui render fns emit DOM, never CSS.
 *
 *   - carbon (W6-P2b): each render fn returns a REAL @carbon/react component
 *     (Button kind=…, TextInput labelText + id, Checkbox labelText + id, Toggle
 *     for Switch labelText + id, Tile for Card) — prop mapping mirrors the
 *     CARBON entries in componentApiRegistry. The ~950 KB @carbon/styles global
 *     sheet is scoped at build time to `.carbon-live-scope` and lazy-loaded by
 *     CarbonScopeStyles; RealComponentRenderer's CarbonReal subtree wraps these
 *     in that scope + the `cds--white`/`cds--g100` theme so --cds-* resolve.
 *
 * STRUCTURE: the map is keyed by SystemId; Salt/M3/Fluent still render via
 * RealComponentRenderer's provider subtrees (they have no global reset, so they
 * don't need this scoped-CSS path) and are intentionally absent here.
 *
 * The render fns are pure (no hooks, no state) so they're safe to call from the
 * mounted-gated, read-only RealComponentRenderer. Inputs/controls are rendered
 * inert (readOnly / static state) to match the store-free gallery demo.
 */

import React from "react";
import {
  Button as CarbonButton,
  TextInput as CarbonTextInput,
  Checkbox as CarbonCheckbox,
  Toggle as CarbonToggle,
  Tile as CarbonTile,
  Link as CarbonLink,
  Tag as CarbonTag,
  InlineNotification as CarbonInlineNotification,
  HeaderName as CarbonHeaderName,
  ProgressBar as CarbonProgressBar,
  Dropdown as CarbonDropdown,
  Search as CarbonSearch,
  Accordion as CarbonAccordion,
  AccordionItem as CarbonAccordionItem,
  Table as CarbonTable,
  TableHead as CarbonTableHead,
  TableHeader as CarbonTableHeader,
  TableRow as CarbonTableRow,
  TableBody as CarbonTableBody,
  TableCell as CarbonTableCell,
} from "@carbon/react";
import { ArrowRight } from "@carbon/icons-react";
import { resolveCell, isStatusColumn, statusToClass } from "@/lib/tableCells";
import type { SystemId } from "@/lib/componentApiRegistry";

/** Coerce a builder field to a string with a fallback (mirrors registry `s`). */
const s = (v: unknown, fallback = ""): string => String(v ?? fallback);

/** Stable slug from a label (mirrors registry `slug`) — Carbon's TextInput /
    Checkbox / Toggle require a unique `id`, derived from the label. */
const slug = (v: unknown, fallback = "field"): string =>
  s(v).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || fallback;

/** Resolve a Carbon control's DOM id: prefer an explicit, cell-unique `id` from
    the caller (e.g. VariantsMatrix salts variant+state so cells don't collide);
    otherwise derive from the label. Carbon requires this id to be unique per page,
    and the variants matrix renders the same label in every cell. */
const fieldId = (p: Record<string, unknown>, fallback: string): string =>
  p.id != null && s(p.id) ? s(p.id) : slug(p.label, fallback);

/** Coerce a builder field to a finite number with a fallback (mirrors registry `num`). */
const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/** Split a CSV field into trimmed options with a fallback (mirrors registry `csv`). */
const csv = (v: unknown, fallback: string[] = []): string[] => {
  const parts = s(v).split(",").map((t) => t.trim()).filter(Boolean);
  return parts.length ? parts : fallback;
};

/* Carbon Tag `type` union (from @carbon/react Tag). */
type CarbonTagType = "outline" | "gray" | "blue" | "green" | "warm-gray" | "red" | "cyan" | "magenta" | "purple" | "teal" | "cool-gray" | "high-contrast";

/* status -> Carbon Tag `type` (mirrors carbonTagType in componentApiRegistry). */
function carbonTagType(status: string): CarbonTagType {
  const map: Record<string, CarbonTagType> = {
    default: "gray", info: "blue", success: "green", warning: "warm-gray", error: "red",
  };
  return map[status] ?? "gray";
}

/* StatusPill label -> Carbon Tag `type` heuristic (mirrors carbonStatusType). */
function carbonStatusType(label: string): CarbonTagType {
  const l = label.toLowerCase();
  if (/(active|online|success|live)/.test(l)) return "green";
  if (/(pending|warning)/.test(l)) return "warm-gray";
  if (/(inactive|error|offline|failed)/.test(l)) return "red";
  return "gray";
}

/** A render fn takes the block's resolved props and returns the real markup. */
export type RealBlockRenderer = (props: Record<string, unknown>) => React.ReactNode;

/* ── uoaui: variant -> button class suffix (mirrors uoauiButtonClass in
   componentApiRegistry). uoaui has NO danger button, so danger falls to
   primary — the closest real class. ── */
function uoauiButtonClass(variant: string): string {
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

/* ════════════════════════════════════════════════════════════════════
   UOAUI core blocks — real `.a-*` markup (CSS injected by UoauiReal).
   ════════════════════════════════════════════════════════════════════ */
const UOAUI_REAL: Partial<Record<string, RealBlockRenderer>> = {
  SimulatedButton: (p) =>
    React.createElement(
      "button",
      {
        type: "button",
        className: `a-btn ${uoauiButtonClass(s(p.variant, "primary"))}`,
        disabled: Boolean(p.disabled),
      },
      s(p.label, "Button"),
    ),

  SimulatedTextInput: (p) => {
    const status = s(p.validationStatus); // "" | error | warning | success
    return React.createElement(
      "div",
      { className: `a-input-wrap${status ? ` a-input-${status}` : ""}` },
      React.createElement("label", { className: "a-input-label" }, s(p.label, "Label")),
      React.createElement("input", {
        className: "a-input",
        placeholder: s(p.placeholder),
        value: s(p.value) || undefined,
        disabled: Boolean(p.disabled),
        readOnly: true,
      }),
    );
  },

  SimulatedCheckbox: (p) => {
    const checked = Boolean(p.defaultChecked);
    const indeterminate = Boolean(p.indeterminate);
    const mark = indeterminate ? "–" : checked ? "✓" : "";
    return React.createElement(
      "label",
      {
        className: `a-checkbox${checked || indeterminate ? " checked" : ""}${p.disabled ? " disabled" : ""}`,
        "aria-disabled": p.disabled ? "true" : undefined,
      },
      React.createElement("span", { className: "a-cb-box", "aria-hidden": "true" }, mark),
      s(p.label),
    );
  },

  /* uoaui DOES ship a real `.a-switch` CSS class (see uoauiBuildCSS / the
     Switches demo) — it's only OMITTED from the registry's className exporter
     because the on/off behaviour needs runtime state to emit honest static JSX.
     For the read-only live demo we render the on/off CSS state directly. */
  SimulatedSwitch: (p) => {
    const on = Boolean(p.defaultOn);
    const disabled = Boolean(p.disabled);
    return React.createElement(
      "button",
      {
        type: "button",
        className: `a-switch${on ? " on" : ""}${disabled ? " disabled" : ""}`,
        role: "switch",
        "aria-checked": on,
        "aria-label": s(p.label, "Switch"),
        disabled,
      },
      React.createElement("span", { className: "a-sw-thumb" }),
    );
  },

  SimulatedCard: (p) =>
    React.createElement(
      "div",
      { className: "a-card" },
      React.createElement("h3", { style: { margin: "0 0 4px" } }, s(p.title, "Card")),
      React.createElement("p", { style: { margin: 0 } }, s(p.content)),
    ),

  /* ── extended coverage (PR-3) — uoaui has no a-title/a-link class, so Title is
     a bare heading + Link a styled anchor; the rest use real .a-* classes. ── */
  SimulatedTitle: (p) => {
    const level = s(p.level, "h2");
    const tag = ({ h1: "h1", h2: "h2", h3: "h3", h4: "h4" } as Record<string, string>)[level] ?? "h2";
    return React.createElement(tag, { style: { margin: 0, color: "var(--a-fg)" } }, s(p.text, "Heading"));
  },

  SimulatedLink: (p) => {
    const children: React.ReactNode[] = [s(p.text, "Learn more")];
    if (p.showIcon) {
      children.push(
        React.createElement(
          "span",
          { className: "material-symbols-outlined", style: { fontSize: 16 }, "aria-hidden": "true" },
          "arrow_forward",
        ),
      );
    }
    return React.createElement(
      "a",
      { href: "#", style: { color: "var(--a-accent)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 } },
      ...children,
    );
  },

  SimulatedBadge: (p) => {
    const badgeClass = ({ default: "a-badge-default", info: "a-badge-accent", success: "a-badge-success", warning: "a-badge-warning", error: "a-badge-danger" } as Record<string, string>)[s(p.status, "default")] ?? "a-badge-default";
    return React.createElement("span", { className: `a-badge ${badgeClass}` }, s(p.label, "Badge"));
  },

  SimulatedPill: (p) => {
    const badgeClass = ({ default: "a-badge-default", info: "a-badge-accent", success: "a-badge-success", warning: "a-badge-warning", error: "a-badge-danger" } as Record<string, string>)[s(p.status, "default")] ?? "a-badge-default";
    const children: React.ReactNode[] = [s(p.label, "Tag")];
    if (p.dismissible) {
      children.push(
        React.createElement(
          "span",
          { className: "material-symbols-outlined", style: { fontSize: 14, marginLeft: 4 }, "aria-hidden": "true" },
          "close",
        ),
      );
    }
    return React.createElement("span", { className: `a-badge ${badgeClass}` }, ...children);
  },

  Alert: (p) => {
    const variant = s(p.variant, "info");
    const alertClass = ({ info: "a-alert-info", success: "a-alert-success", warning: "a-alert-warning", error: "a-alert-danger" } as Record<string, string>)[variant] ?? "a-alert-info";
    const icon = ({ info: "info", success: "check_circle", warning: "warning", error: "error" } as Record<string, string>)[variant] ?? "info";
    return React.createElement(
      "div",
      { className: `a-alert ${alertClass}`, role: variant === "warning" || variant === "error" ? "alert" : "status" },
      React.createElement("span", { className: "material-symbols-outlined", "aria-hidden": "true" }, icon),
      React.createElement(
        "div",
        null,
        React.createElement("strong", null, s(p.title, "Alert")),
        React.createElement("div", null, s(p.message)),
      ),
    );
  },

  AppBrand: (p) =>
    React.createElement(
      "div",
      { style: { display: "flex", alignItems: "center", gap: 8 } },
      React.createElement("span", { style: { width: 24, height: 24, borderRadius: 8, background: "var(--a-accent)" }, "aria-hidden": "true" }),
      React.createElement("span", { style: { fontWeight: 700, color: "var(--a-fg)", letterSpacing: "-0.01em" } }, s(p.label, "App Name")),
    ),

  StatusPill: (p) =>
    React.createElement(
      "span",
      { className: "a-badge a-badge-success" },
      React.createElement("span", { style: { width: 6, height: 6, borderRadius: "50%", background: "currentColor", marginRight: 6, display: "inline-block" }, "aria-hidden": "true" }),
      s(p.label, "Active"),
    ),

  FooterText: (p) =>
    React.createElement(
      "footer",
      { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--a-fg-3)" } },
      React.createElement("span", null, s(p.label, "Footer")),
      React.createElement("span", { className: "a-badge a-badge-default" }, s(p.version, "v1.0")),
    ),

  SimulatedProgress: (p) => {
    const value = num(p.value, 50);
    return React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        { style: { display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--a-fg-2)", marginBottom: 4 } },
        React.createElement("span", null, s(p.label, "Progress")),
        React.createElement("span", null, `${value}%`),
      ),
      React.createElement("div", { className: "a-progress-track" }, React.createElement("div", { className: "a-progress-fill", style: { width: `${value}%` } })),
    );
  },

  SimulatedAvatar: (p) => {
    const presence = s(p.presence);
    const dotColor = ({ available: "var(--a-success-fg)", busy: "var(--a-danger-fg)", away: "var(--a-warning-fg)", offline: "var(--a-fg-3)" } as Record<string, string>)[presence];
    const dot = dotColor
      ? React.createElement("span", { style: { position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: dotColor, border: "2px solid var(--a-bg)" }, "aria-hidden": "true" })
      : null;
    return React.createElement(
      "div",
      { style: { position: "relative", display: "inline-flex" } },
      React.createElement("div", { className: "a-avatar" }, s(p.initials, "?")),
      dot,
    );
  },

  /* ── PR-4 mid-complexity coverage (real .a-* classes verified to exist). ── */
  SimulatedStatCard: (p) => {
    const pct = num(p.pct, 0);
    return React.createElement(
      "div",
      { className: "a-card", style: { padding: 16 } },
      React.createElement("div", { style: { fontSize: 11, color: "var(--a-fg-3)", fontWeight: 500 } }, s(p.label, "Metric")),
      React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: "var(--a-fg)", letterSpacing: "-0.02em", margin: "6px 0 10px" } }, s(p.value, "0")),
      React.createElement("div", { className: "a-progress-track" }, React.createElement("div", { className: "a-progress-fill", style: { width: `${pct}%` } })),
    );
  },

  SimulatedDropdown: (p) =>
    React.createElement(
      "div",
      { className: "a-dropdown" },
      React.createElement(
        "button",
        { type: "button", className: "a-dropdown-trigger", "aria-haspopup": "listbox" },
        React.createElement("span", null, s(p.placeholder, "Select an option")),
        React.createElement("span", { className: "material-symbols-outlined", "aria-hidden": "true" }, "expand_more"),
      ),
    ),

  SimulatedSearchbox: (p) =>
    React.createElement(
      "div",
      { className: "a-input-wrap", style: { position: "relative" } },
      React.createElement("span", { className: "material-symbols-outlined", "aria-hidden": "true", style: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" } }, "search"),
      React.createElement("input", { className: "a-input", type: "search", placeholder: s(p.placeholder, "Search..."), "aria-label": "Search", readOnly: true, style: { paddingLeft: 34 } }),
    ),

  SimulatedSegmentedGroup: (p) => {
    const opts = csv(p.optionsCsv, ["Day", "Week", "Month"]);
    const di = num(p.defaultIndex, 0);
    return React.createElement(
      "div",
      { className: "a-tabs", role: "tablist", "aria-label": "View" },
      ...opts.map((o, i) => React.createElement("button", { key: i, type: "button", role: "tab", "aria-selected": i === di, className: `a-tab${i === di ? " active" : ""}` }, s(o))),
    );
  },

  SimulatedAccordion: (p) =>
    React.createElement(
      "div",
      { className: "a-accordion" },
      React.createElement(
        "button",
        { type: "button", className: "a-accordion-header", "aria-expanded": true },
        React.createElement("span", null, s(p.title, "Section")),
        React.createElement("span", { className: "material-symbols-outlined", "aria-hidden": "true" }, "expand_less"),
      ),
      React.createElement("div", { className: "a-accordion-body" }, s(p.content)),
    ),

  NavItem: (p) =>
    React.createElement(
      "button",
      { type: "button", className: `a-sidebar-item${Boolean(p.active) ? " active" : ""}`, "aria-current": Boolean(p.active) ? "page" : undefined },
      React.createElement("span", { className: "material-symbols-outlined", "aria-hidden": "true" }, s(p.icon, "chat")),
      s(p.label, "Nav"),
    ),

  /* PR-5: real .a-table over the columns/rows; status columns -> .a-badge pills. */
  SimulatedDataTable: (p) => {
    const columns = Array.isArray(p.columns) ? (p.columns as string[]) : ["Name", "Status"];
    const rows = Array.isArray(p.rows) ? (p.rows as unknown[]) : [];
    if (rows.length === 0) {
      return React.createElement("div", { style: { padding: 24, textAlign: "center", opacity: 0.6, fontSize: 13 } }, "No data yet. Describe the records you want, or add rows.");
    }
    return React.createElement(
      "table",
      { className: "a-table" },
      React.createElement("thead", null, React.createElement("tr", null, ...columns.map((c) => React.createElement("th", { key: c }, c)))),
      React.createElement(
        "tbody",
        null,
        ...rows.map((row, ri) =>
          React.createElement(
            "tr",
            { key: ri },
            ...columns.map((col, ci) => {
              const v = resolveCell(row, col, ci);
              if (isStatusColumn(col)) {
                const badgeClass = ({ success: "a-badge-success", warning: "a-badge-warning", neutral: "a-badge-default" } as Record<string, string>)[statusToClass(v)] ?? "a-badge-default";
                return React.createElement("td", { key: ci }, React.createElement("span", { className: `a-badge ${badgeClass}` }, v));
              }
              return React.createElement("td", { key: ci }, v);
            }),
          ),
        ),
      ),
    );
  },
};

/* ── carbon: variant -> Carbon Button `kind` (mirrors carbonButtonAttrs in
   componentApiRegistry). Carbon API: kind = primary|secondary|tertiary|ghost|
   danger; tertiary is the bordered/outline button, danger the destructive kind. ── */
type CarbonButtonKind = "primary" | "secondary" | "tertiary" | "ghost" | "danger";
function carbonButtonKind(variant: string): CarbonButtonKind {
  const map: Record<string, CarbonButtonKind> = {
    primary: "primary",
    secondary: "secondary",
    outline: "tertiary",
    ghost: "ghost",
    danger: "danger",
    destructive: "danger",
  };
  return map[variant] ?? "primary";
}

/* ════════════════════════════════════════════════════════════════════
   CARBON core blocks — real @carbon/react components (W6-P2b). The global
   @carbon/styles reset is scoped to `.carbon-live-scope` (build-time, via
   public/carbon-scoped.css) + theme class, both supplied by CarbonReal in
   RealComponentRenderer. Inputs render inert (readOnly / defaultChecked) for
   the store-free gallery demo.
   ════════════════════════════════════════════════════════════════════ */
const CARBON_REAL: Partial<Record<string, RealBlockRenderer>> = {
  SimulatedButton: (p) =>
    React.createElement(
      CarbonButton,
      { kind: carbonButtonKind(s(p.variant, "primary")), disabled: Boolean(p.disabled) },
      s(p.label, "Button"),
    ),

  SimulatedTextInput: (p) => {
    const status = s(p.validationStatus);
    return React.createElement(CarbonTextInput, {
      id: fieldId(p, "input"),
      labelText: s(p.label, "Label"),
      placeholder: s(p.placeholder),
      value: s(p.value) || undefined,
      invalid: status === "error",
      invalidText: status === "error" ? "This field has an error" : undefined,
      warn: status === "warning",
      warnText: status === "warning" ? "This field has a warning" : undefined,
      disabled: Boolean(p.disabled),
      readOnly: true,
    });
  },

  SimulatedCheckbox: (p) =>
    React.createElement(CarbonCheckbox, {
      id: fieldId(p, "checkbox"),
      labelText: s(p.label),
      checked: Boolean(p.defaultChecked),
      indeterminate: Boolean(p.indeterminate),
      disabled: Boolean(p.disabled),
      readOnly: true,
    }),

  /* Carbon's Switch maps to Toggle (a labelled on/off switch). */
  SimulatedSwitch: (p) =>
    React.createElement(CarbonToggle, {
      id: fieldId(p, "toggle"),
      labelText: s(p.label, "Switch"),
      toggled: Boolean(p.defaultOn),
      disabled: Boolean(p.disabled),
      readOnly: true,
    }),

  /* Carbon's Card maps to Tile. */
  SimulatedCard: (p) =>
    React.createElement(
      CarbonTile,
      null,
      React.createElement("h3", { style: { margin: "0 0 4px" } }, s(p.title, "Card")),
      React.createElement("p", { style: { margin: 0 } }, s(p.content)),
    ),

  /* ── extended coverage (PR-3). Carbon ships no Heading / Footer / Avatar
     component, so SimulatedTitle / FooterText / SimulatedAvatar are OMITTED here
     and fall back to Simulated (honest) via canRenderReal. ── */
  SimulatedLink: (p) =>
    React.createElement(
      CarbonLink,
      { href: "#", renderIcon: p.showIcon ? ArrowRight : undefined },
      s(p.text, "Learn more"),
    ),

  SimulatedBadge: (p) =>
    React.createElement(CarbonTag, { type: carbonTagType(s(p.status, "default")) }, s(p.label, "Badge")),

  /* Always render a plain CarbonTag (text-visible). DismissibleTag rendered as an
     empty grey block in the scoped dark stage, so we drop the × affordance in
     favour of a readable tag. */
  SimulatedPill: (p) =>
    React.createElement(CarbonTag, { type: carbonTagType(s(p.status, "default")) }, s(p.label, "Tag")),

  Alert: (p) =>
    React.createElement(CarbonInlineNotification, {
      kind: s(p.variant, "info") as "info" | "error" | "success" | "warning",
      title: s(p.title, "Alert"),
      subtitle: s(p.message),
      lowContrast: true,
      hideCloseButton: true,
    }),

  AppBrand: (p) =>
    React.createElement(CarbonHeaderName, { href: "#", prefix: "" }, s(p.label, "App Name")),

  StatusPill: (p) =>
    React.createElement(CarbonTag, { type: carbonStatusType(s(p.label, "Active")) }, s(p.label, "Active")),

  SimulatedProgress: (p) =>
    React.createElement(CarbonProgressBar, {
      label: s(p.label, "Progress"),
      helperText: `${num(p.value, 50)}%`,
      value: num(p.value, 50),
      max: 100,
    }),

  /* ── PR-4 mid-complexity coverage. NavItem renders without an icon (mapping
     material-symbol names to @carbon/icons-react components is deferred). ── */
  /* A row of Carbon Buttons (selected=primary, rest=tertiary) — readable in both
     themes, unlike ContentSwitcher whose selected segment went dark-on-dark in the
     scoped dark stage. */
  SimulatedSegmentedGroup: (p) => {
    const opts = csv(p.optionsCsv, ["Day", "Week", "Month"]);
    const di = num(p.defaultIndex, 0);
    return React.createElement(
      "div",
      { style: { display: "inline-flex" } },
      ...opts.map((o, i) => React.createElement(CarbonButton, { key: slug(o), kind: i === di ? "primary" : "tertiary", size: "sm" }, s(o))),
    );
  },

  SimulatedDropdown: (p) =>
    React.createElement(CarbonDropdown, {
      id: fieldId(p, "dropdown"),
      titleText: "",
      label: s(p.placeholder, "Select an option"),
      items: ["Option 1", "Option 2", "Option 3"],
      itemToString: (item: unknown) => s(item),
    }),

  SimulatedSearchbox: (p) =>
    React.createElement(CarbonSearch, {
      id: fieldId(p, "search"),
      labelText: "Search",
      placeholder: s(p.placeholder, "Search..."),
      size: "md",
    }),

  SimulatedStatCard: (p) =>
    React.createElement(
      CarbonTile,
      null,
      React.createElement("p", { className: "cds--type-label-01" }, s(p.label, "Metric")),
      React.createElement("p", { className: "cds--type-heading-04" }, s(p.value, "0")),
      React.createElement("span", { style: { color: "var(--cds-support-success)" } }, `+${num(p.pct, 0)}%`),
    ),

  SimulatedAccordion: (p) =>
    React.createElement(
      CarbonAccordion,
      null,
      React.createElement(CarbonAccordionItem, { title: s(p.title, "Section") }, s(p.content)),
    ),

  NavItem: (p) =>
    React.createElement(CarbonLink, { href: "#" }, s(p.label, "Nav")),

  /* PR-5: plain Carbon Table (not the DataTable render-prop) over the real
     columns/rows; status columns render as Carbon Tags. */
  SimulatedDataTable: (p) => {
    const columns = Array.isArray(p.columns) ? (p.columns as string[]) : ["Name", "Status"];
    const rows = Array.isArray(p.rows) ? (p.rows as unknown[]) : [];
    if (rows.length === 0) {
      return React.createElement("div", { style: { padding: 24, textAlign: "center", opacity: 0.6, fontSize: 13 } }, "No data yet. Describe the records you want, or add rows.");
    }
    return React.createElement(
      CarbonTable,
      null,
      React.createElement(
        CarbonTableHead,
        null,
        React.createElement(CarbonTableRow, null, ...columns.map((c) => React.createElement(CarbonTableHeader, { key: c, id: slug(c) }, c))),
      ),
      React.createElement(
        CarbonTableBody,
        null,
        ...rows.map((row, ri) =>
          React.createElement(
            CarbonTableRow,
            { key: ri },
            ...columns.map((col, ci) => {
              const v = resolveCell(row, col, ci);
              return React.createElement(
                CarbonTableCell,
                { key: ci },
                isStatusColumn(col) ? React.createElement(CarbonTag, { type: carbonTagType(statusToClass(v)) }, v) : v,
              );
            }),
          ),
        ),
      ),
    );
  },
};

/**
 * Per-DS real-block map. `uoaui` (className/CSS) and `carbon` (@carbon/react)
 * are implemented here; Salt/M3/Fluent are intentionally empty (they render via
 * RealComponentRenderer's provider subtrees — no global reset to scope).
 */
export const realBlockMap: Record<SystemId, Partial<Record<string, RealBlockRenderer>>> = {
  salt: {},
  m3: {},
  fluent: {},
  carbon: CARBON_REAL,
  uoaui: UOAUI_REAL,
};

/** The real-block renderer for (system, blockType), or undefined when none. */
export function getRealBlockRenderer(system: SystemId, blockType: string): RealBlockRenderer | undefined {
  return realBlockMap[system]?.[blockType];
}
