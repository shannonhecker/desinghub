/**
 * reportMarkup - the markup of the report blocks, written once for both
 * runnable dialects (JSX for the React / Vite export, HTML for the page
 * export): the framed panel, the data table, the application chrome
 * (TopNav, TabStrip, NavGroup, PageTitle) and the plain dropdown.
 *
 * Every emitter takes a Dialect (the handful of places JSX and HTML differ:
 * the class attribute, escaping, inline style, a select's chosen option) and
 * returns LINES with relative two-space nesting; the caller indents them.
 * The class names here are the ones stylesCss.ts (REPORT_CSS) styles.
 *
 * Blocks arrive already materialised (materialise.ts): static props only.
 */

import type { Block, ZoneLayout, ZoneTone } from "@/store/useBuilder";
import { ZONE_TONES } from "@/store/useBuilder";
import {
  formatGridValue,
  isColumnGroup,
  isNegativeCell,
  isNumericKind,
  leafColumns,
  readGridColumns,
  readGridRows,
  type GridColumn,
  type GridRow,
} from "@/lib/dataGridModel";
import { dropdownModel } from "@/lib/dropdownModel";
import { panelContentHeight, panelHeightOf, viewByOf } from "@/lib/panelMetrics";
import { partsToGrid, seriesToGrid } from "@/lib/reportData/shape";
import { jsxText, jsxAttr, htmlText, htmlAttr } from "./escape";

/* ── Dialects ── */

export interface Dialect {
  /** Name of the class attribute. */
  cls: "className" | "class";
  /** Name of a label's `for` attribute. */
  labelFor: "htmlFor" | "for";
  /** Escape text in children position. */
  text: (v: unknown, fallback?: string) => string;
  /** Escape a value inside a double-quoted attribute. */
  attr: (v: unknown, fallback?: string) => string;
  /** ` style=...` attribute fixing a height in px. */
  height: (px: number) => string;
  /** ` colSpan=...` attribute. */
  colSpan: (n: number) => string;
  /** ` tabIndex=...` attribute making an element keyboard-focusable. */
  focusable: string;
  /** Attribute(s) on a <select> naming its chosen value ("" in HTML, where
   *  the chosen <option> carries `selected`). */
  selectValue: (value: string) => string;
  /** Attribute on the chosen <option> ("" in JSX). */
  optionSelected: string;
}

export const JSX_DIALECT: Dialect = {
  cls: "className",
  labelFor: "htmlFor",
  text: jsxText,
  attr: jsxAttr,
  height: (px) => ` style={{ height: ${px} }}`,
  colSpan: (n) => ` colSpan={${n}}`,
  focusable: " tabIndex={0}",
  selectValue: (value) => ` defaultValue="${jsxAttr(value)}"`,
  optionSelected: "",
};

export const HTML_DIALECT: Dialect = {
  cls: "class",
  labelFor: "for",
  text: htmlText,
  attr: htmlAttr,
  height: (px) => ` style="height: ${px}px"`,
  colSpan: (n) => ` colspan="${n}"`,
  focusable: ' tabindex="0"',
  selectValue: () => "",
  optionSelected: " selected",
};

/** Indent a block of lines and join them. */
export function indentLines(lines: string[], pad: string): string {
  return lines.map((l) => pad + l).join("\n");
}

const nest = (lines: string[]): string[] => lines.map((l) => "  " + l);

const csv = (v: unknown, fallback: string[]): string[] => {
  const parts = String(v ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  return parts.length ? parts : fallback;
};
const str = (v: unknown): string => (typeof v === "string" && v.trim() ? v : "");

/* ── Block types this module draws ── */

export const CHROME_BLOCK_TYPES = new Set<string>(["TopNav", "TabStrip", "NavGroup", "PageTitle"]);

/* ── Tones and zones ── */

/** A known tone, or null: the value becomes an attribute, so it is never free text. */
export function toneOf(v: unknown): ZoneTone | null {
  return ZONE_TONES.includes(v as ZoneTone) ? (v as ZoneTone) : null;
}

/** The data attributes a zone's landmark carries: its tone, whether it runs
 *  flush, and (sidebar) the side it docks to. "" when the layout sets none. */
export function zoneAttrs(layout: ZoneLayout | undefined): string {
  if (!layout) return "";
  const tone = toneOf(layout.tone);
  return `${tone ? ` data-tone="${tone}"` : ""}${layout.flush === true ? ' data-flush="true"' : ""}${layout.side === "right" ? ' data-side="right"' : ""}`;
}

/* ── Select ── */

function selectLines(d: Dialect, attrs: string, options: string[], value: string, placeholder?: string): string[] {
  const opts = options.map((o) => `  <option value="${d.attr(o)}"${o === value ? d.optionSelected : ""}>${d.text(o)}</option>`);
  /* Nothing chosen: lead with the placeholder as the (empty) chosen option. */
  const lead = !value && placeholder ? [`  <option value=""${d.optionSelected}>${d.text(placeholder)}</option>`] : [];
  return [`<select${attrs}${d.selectValue(value)}>`, ...lead, ...opts, "</select>"];
}

/** The plain (non design-system) dropdown: its label, options and chosen value. */
export function dropdownLines(d: Dialect, block: Block, id: string): string[] {
  const m = dropdownModel(block.props ?? {});
  if (!m.label) {
    return selectLines(d, ` ${d.cls}="dropdown" aria-label="${d.attr(m.placeholder)}"`, m.options, m.value, m.placeholder);
  }
  return [
    `<div ${d.cls}="form-field">`,
    `  <label ${d.labelFor}="${id}">${d.text(m.label)}</label>`,
    ...nest(selectLines(d, ` id="${id}" ${d.cls}="dropdown"`, m.options, m.value, m.placeholder)),
    "</div>",
  ];
}

/* ── Framed panel ── */

export interface PanelSpec {
  title: string;
  subtitle: string;
  /** Overall height in px. */
  height: number;
  /** "View by" choices; empty hides the select. */
  viewBy: string[];
  viewByValue: string;
}

/** A chart or grid block's panel settings, read the way the canvas reads them. */
export function panelSpecOf(block: Block): PanelSpec {
  const p = block.props ?? {};
  const viewBy = viewByOf(p);
  return {
    title: typeof p.title === "string" ? p.title : "",
    subtitle: str(p.subtitle),
    height: panelHeightOf(p),
    viewBy,
    viewByValue: str(p.viewByValue) || viewBy[0] || "",
  };
}

/** The framed panel a chart or grid sits in: a <section> with a header
 *  (title, subtitle, "View by") over the body. */
export function panelLines(d: Dialect, spec: PanelSpec, body: string[]): string[] {
  const label = spec.title ? ` aria-label="${d.attr(spec.title)}"` : "";
  const heading = [
    `<div ${d.cls}="panel-heading">`,
    ...(spec.title ? [`  <h2 ${d.cls}="panel-title">${d.text(spec.title)}</h2>`] : []),
    ...(spec.subtitle ? [`  <span ${d.cls}="panel-subtitle">${d.text(spec.subtitle)}</span>`] : []),
    "</div>",
  ];
  const viewBy = spec.viewBy.length
    ? selectLines(d, ` ${d.cls}="panel-viewby" aria-label="View by"`, spec.viewBy, spec.viewByValue)
    : [];
  return [
    `<section ${d.cls}="panel"${label}${d.height(spec.height)}>`,
    `  <header ${d.cls}="panel-header">`,
    ...nest(nest(heading)),
    ...nest(nest(viewBy)),
    "  </header>",
    `  <div ${d.cls}="panel-body">`,
    ...nest(nest(body)),
    "  </div>",
    "</section>",
  ];
}

/* ── Data table ── */

/** Indent levels the stylesheet draws (data-indent="1".."3"). */
const MAX_INDENT = 3;

const classAttr = (d: Dialect, names: string[]): string => (names.length ? ` ${d.cls}="${names.join(" ")}"` : "");

/** A semantic table for a grid's columns and rows: a group-header row when
 *  the columns are grouped, right-aligned formatted numbers, negative cells
 *  and total rows flagged. Wrapped in a scrollable, focusable region. */
export function tableLines(
  d: Dialect,
  columns: GridColumn[],
  rows: GridRow[],
  opts: { label: string; selected?: string; height?: number },
): string[] {
  const leaves = leafColumns(columns);
  if (leaves.length === 0) return [`<p ${d.cls}="panel-empty">No data</p>`];
  const label = opts.label || "Data";

  const head: string[] = [];
  if (columns.some(isColumnGroup)) {
    /* Group-header row: each group spans its children; a run of ungrouped
       columns is one empty cell. */
    const cells: string[] = [];
    let run = 0;
    const flush = () => {
      if (run > 0) cells.push(`<td${run > 1 ? d.colSpan(run) : ""}></td>`);
      run = 0;
    };
    for (const c of columns) {
      if (!isColumnGroup(c)) {
        run += 1;
        continue;
      }
      flush();
      cells.push(`<th scope="colgroup"${d.colSpan(c.children.length)}>${d.text(c.header)}</th>`);
    }
    flush();
    head.push(`<tr ${d.cls}="data-table-groups">${cells.join("")}</tr>`);
  }
  head.push(
    `<tr>${leaves
      .map((c) => `<th scope="col"${classAttr(d, isNumericKind(c.kind) ? ["num"] : [])}>${d.text(c.header)}</th>`)
      .join("")}</tr>`,
  );

  const body = rows.map((row) => {
    const rowClasses = [
      ...(row._bold ? ["is-total"] : []),
      ...(opts.selected && String(row[leaves[0].field] ?? "") === opts.selected ? ["is-selected"] : []),
    ];
    const cells = leaves.map((c, i) => {
      const value = row[c.field];
      const content = d.text(formatGridValue(c, value));
      const numeric = isNumericKind(c.kind);
      if (i === 0 && !numeric) {
        const level = typeof row._indent === "number" ? Math.min(MAX_INDENT, Math.max(0, Math.round(row._indent))) : 0;
        return `<th scope="row"${level > 0 ? ` data-indent="${level}"` : ""}>${content}</th>`;
      }
      const classes = [...(numeric ? ["num"] : []), ...(isNegativeCell(c, value) ? ["is-negative"] : [])];
      return `<td${classAttr(d, classes)}>${content}</td>`;
    });
    return `<tr${classAttr(d, rowClasses)}>${cells.join("")}</tr>`;
  });

  return [
    `<div ${d.cls}="table-scroll" role="region" aria-label="${d.attr(label)}"${d.focusable}${opts.height ? d.height(opts.height) : ""}>`,
    `  <table ${d.cls}="data-table">`,
    "    <thead>",
    ...head.map((l) => "      " + l),
    "    </thead>",
    "    <tbody>",
    ...body.map((l) => "      " + l),
    "    </tbody>",
    "  </table>",
    "</div>",
  ];
}

/** A Data Grid block: its table, framed unless `panel: false`. */
export function dataGridLines(d: Dialect, block: Block): string[] {
  const p = block.props ?? {};
  const spec = panelSpecOf(block);
  const columns = readGridColumns(p.columns);
  const rows = readGridRows(p.rows);
  const selected = str(p.selectedRow) || undefined;
  const label = spec.title || "Data grid";
  if (p.panel === false) return tableLines(d, columns, rows, { label, selected, height: spec.height });
  return panelLines(d, spec, tableLines(d, columns, rows, { label, selected }));
}

/* ── Chart data as a table (HTML export, which has no chart runtime) ── */

interface ChartSeriesLike { name: string; data: (number | null)[] }

function chartSeries(raw: unknown): ChartSeriesLike[] {
  if (!Array.isArray(raw)) return [];
  const out: ChartSeriesLike[] = [];
  for (const s of raw) {
    if (!s || typeof s !== "object" || !Array.isArray((s as ChartSeriesLike).data)) continue;
    const r = s as ChartSeriesLike;
    out.push({
      name: typeof r.name === "string" && r.name.trim() ? r.name : "Series",
      data: r.data.map((v) => (typeof v === "number" && Number.isFinite(v) ? v : null)),
    });
  }
  return out;
}

function chartParts(raw: unknown): { name: string; y: number }[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (pt): pt is { name: string; y: number } =>
      Boolean(pt) && typeof pt === "object" && typeof (pt as { name: unknown }).name === "string" && Number.isFinite((pt as { y: unknown }).y as number),
  );
}

/** True when a chart block carries data of its own (categories + series, or parts). */
export function chartHasData(block: Block): boolean {
  const p = block.props ?? {};
  return chartSeries(p.series).length > 0 || chartParts(p.seriesData).length > 0;
}

/** The data behind a chart as a table (the table the canvas shows under an
 *  expanded chart), framed when the chart is a panel. */
export function chartDataLines(d: Dialect, block: Block): string[] {
  const p = block.props ?? {};
  const spec = panelSpecOf(block);
  const label = `${spec.title || "Chart"} data`;
  const series = chartSeries(p.series);
  const parts = chartParts(p.seriesData);
  const percent = typeof p.valueSuffix === "string" && p.valueSuffix.includes("%");
  let table: string[];
  if (series.length > 0) {
    const categories = Array.isArray(p.categories) ? p.categories.map((c) => String(c)) : series[0].data.map((_, i) => String(i + 1));
    const grid = seriesToGrid("", categories, series, percent ? "percent" : "number");
    table = tableLines(d, grid.columns, grid.rows, { label });
  } else if (parts.length > 0) {
    const grid = partsToGrid("", parts, { field: "value", header: "Value", kind: "number", compact: true });
    table = tableLines(d, grid.columns, grid.rows, { label });
  } else {
    table = [`<p ${d.cls}="panel-empty">No data</p>`];
  }
  const centre = str(p.centerLabel);
  const figure = [
    `<figure ${d.cls}="chart-data">`,
    ...(centre ? [`  <figcaption ${d.cls}="chart-data-total">${d.text(centre)}</figcaption>`] : []),
    ...nest(table),
    "</figure>",
  ];
  return p.panel === true ? panelLines(d, spec, figure) : figure;
}

/** Height left for a framed chart inside its panel. */
export function framedChartHeight(block: Block): number {
  return panelContentHeight(panelHeightOf(block.props ?? {}));
}

/* ── Application chrome ── */

/** TopNav: brand (with its initial mark), primary links, account. */
export function topNavLines(d: Dialect, props: Record<string, unknown>): string[] {
  const brand = String(props.brand ?? "Brand");
  const links = csv(props.linksCsv, []);
  const active = String(props.active ?? links[0] ?? "");
  const tone = toneOf(props.tone) ?? "dark";
  const account = String(props.account ?? "");
  const chevron = props.chevrons !== false ? ' data-chevron="true"' : "";
  const out = [`<div ${d.cls}="topnav" data-tone="${tone}">`, `  <div ${d.cls}="topnav-brand">`];
  if (props.logo !== "none") {
    out.push(`    <span ${d.cls}="topnav-mark" aria-hidden="true">${d.text(brand.trim().charAt(0).toUpperCase() || "B")}</span>`);
  }
  out.push(`    <span ${d.cls}="topnav-name">${d.text(brand)}</span>`, "  </div>");
  if (links.length > 0) {
    out.push(`  <span ${d.cls}="topnav-divider" aria-hidden="true"></span>`, `  <nav ${d.cls}="topnav-links" aria-label="Primary">`);
    for (const label of links) {
      out.push(`    <a ${d.cls}="topnav-link" href="#"${label === active ? ' aria-current="page"' : ""}${chevron}>${d.text(label)}</a>`);
    }
    out.push("  </nav>");
  }
  out.push(`  <span ${d.cls}="topnav-spacer"></span>`);
  if (props.account !== "none") {
    out.push(`  <div ${d.cls}="topnav-account" data-chevron="true">`, `    <span ${d.cls}="topnav-avatar" aria-hidden="true"></span>`);
    if (account) out.push(`    <span ${d.cls}="topnav-account-name">${d.text(account)}</span>`);
    out.push("  </div>");
  }
  out.push("</div>");
  return out;
}

/** TabStrip: workspace / section tabs, the active one marked. */
export function tabStripLines(d: Dialect, props: Record<string, unknown>): string[] {
  const tabs = csv(props.tabsCsv, ["Overview", "Reports"]);
  const active = String(props.active ?? tabs[0]);
  const tone = toneOf(props.tone) ?? "dark";
  const out = [`<nav ${d.cls}="tabstrip" data-tone="${tone}" aria-label="${d.attr(String(props.label ?? "Workspaces"))}">`];
  for (const label of tabs) {
    out.push(`  <a ${d.cls}="tabstrip-tab" href="#"${label === active ? ' aria-current="page"' : ""}>${d.text(label)}</a>`);
  }
  if (props.addButton === true) out.push(`  <span ${d.cls}="tabstrip-add" aria-hidden="true">+</span>`);
  out.push("</nav>");
  return out;
}

/** NavGroup: a section label in the sidebar. */
export function navGroupLines(d: Dialect, props: Record<string, unknown>): string[] {
  return [`<p ${d.cls}="nav-group">${d.text(String(props.label ?? "Section"))}</p>`];
}

/** PageTitle: the page's <h1> and an optional caption. */
export function pageTitleLines(d: Dialect, props: Record<string, unknown>): string[] {
  return [
    `<div ${d.cls}="page-title-wrap">`,
    `  <h1 ${d.cls}="page-title">${d.text(String(props.text ?? "Page title"))}</h1>`,
    ...(props.caption ? [`  <p ${d.cls}="page-caption">${d.text(String(props.caption))}</p>`] : []),
    "</div>",
  ];
}

/** Lines for a chrome or data-grid block, or null when the block is not one. */
export function reportBlockLines(d: Dialect, block: Block): string[] | null {
  const p = block.props ?? {};
  switch (block.type) {
    case "TopNav":
      return topNavLines(d, p);
    case "TabStrip":
      return tabStripLines(d, p);
    case "NavGroup":
      return navGroupLines(d, p);
    case "PageTitle":
      return pageTitleLines(d, p);
    case "DataGrid":
      return dataGridLines(d, block);
    default:
      return null;
  }
}

/** True when the canvas uses the application-chrome model (toned / flush /
 *  right-docked / hidden zones, or chrome blocks). The React exporter then
 *  wraps every zone in its landmark even when a design system's own layout
 *  primitive lays the zone out, so the tone, the flush header and the shell
 *  grid have an element to sit on. */
export function usesChromeShell(
  zones: Block[][],
  layouts: Partial<Record<"header" | "sidebar" | "footer", ZoneLayout | undefined>>,
): boolean {
  for (const zone of ["header", "sidebar", "footer"] as const) {
    const l = layouts[zone];
    if (l && (l.visible === false || l.flush === true || l.side === "right" || toneOf(l.tone))) return true;
  }
  return zones.some((blocks) => blocks.some((b) => CHROME_BLOCK_TYPES.has(b.type)));
}

/* The shell grid reserves a sidebar track. On an application-chrome canvas
   the root says when there is no sidebar to fill it, or when it docks right,
   so the stylesheet can drop or move the track. Other canvases keep the
   root exactly as it was. */
export function shellSidebarAttr(hasSidebar: boolean, right: boolean, chromeShell: boolean): string {
  if (!chromeShell) return "";
  if (!hasSidebar) return ' data-sidebar="none"';
  return right ? ' data-sidebar="right"' : "";
}
