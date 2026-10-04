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
  GRID_TONES,
  RATING_TONES,
  barShare,
  cellOf,
  columnMax,
  deltaView,
  flagEmoji,
  formatGridValue,
  heatTone,
  isColumnGroup,
  isNegativeCell,
  isNumericKind,
  leafColumns,
  readGridColumns,
  readGridRows,
  sparkPoints,
  sparkPolyline,
  valueTone,
  type GridCell,
  type GridColumn,
  type GridLeafColumn,
  type GridRow,
  type GridTone,
} from "@/lib/dataGridModel";
import { dropdownModel } from "@/lib/dropdownModel";
import { panelContentHeight, panelHeightOf, viewByOf } from "@/lib/panelMetrics";
import type { ResolvedRecord, ResolvedSection } from "@/lib/recordPanelModel";
import { GROUP_FIELD, partsToGrid, seriesToGrid } from "@/lib/reportData/shape";
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
  /** ` style=...` attribute fixing a width as a percentage (a bar cell's fill). */
  widthPct: (pct: number) => string;
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
  widthPct: (pct) => ` style={{ width: "${pct}%" }}`,
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
  widthPct: (pct) => ` style="width: ${pct}%"`,
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

/* ── Rich cells (GridCell) ──
   The canvas draws these with RichCell (SimulatedDataGrid.tsx); the export
   writes the same picture as static markup. A tone is a class (tone-good,
   tone-mid, tone-bad, tone-accent, tone-neutral) that sets --tone to the
   exported status variable, so one rule per cell kind covers every tone. */

const SPARK_WIDTH = 56;
const SPARK_HEIGHT = 18;
const GRID_ARROW_SIZE = 12;
const RECORD_ARROW_SIZE = 13;

/** The tone class. The tone becomes a class name, so only the known tones pass. */
function toneClass(tone: unknown): string {
  return `tone-${GRID_TONES.includes(tone as GridTone) ? (tone as GridTone) : "neutral"}`;
}

/** An arrow as inline SVG (no icon library in exported code). Decorative:
 *  the direction is also written as text where it is not otherwise said. */
function arrow(d: Dialect, direction: "up" | "down", size: number): string {
  const path = direction === "up" ? "M12 19V5M5 12l7-7 7 7" : "M12 5v14M19 12l-7 7-7-7";
  return `<svg ${d.cls}="cell-arrow" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="${path}" /></svg>`;
}

const srOnly = (d: Dialect, text: string): string => `<span ${d.cls}="visually-hidden">${text}</span>`;

/** A sparkline as an inline SVG polyline; "" for fewer than two points. */
function sparkSvg(d: Dialect, value: unknown, tone: unknown): string {
  const points = sparkPolyline(sparkPoints(value), SPARK_WIDTH, SPARK_HEIGHT);
  if (!points) return "";
  return `<svg ${d.cls}="cell-spark ${toneClass(tone)}" width="${SPARK_WIDTH}" height="${SPARK_HEIGHT}" viewBox="0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}" fill="none" stroke="currentColor" aria-hidden="true"><polyline points="${points}" /></svg>`;
}

/** Rich cells whose content is left-aligned even in a numeric column. */
function isLeftAlignedCell(cell: GridCell | null): boolean {
  return cell !== null && (cell.type === "bar" || cell.type === "flag" || cell.type === "toneText");
}

/** What a rich cell draws inside its <td>. `text` is the column's formatted
 *  value, already escaped. A heat cell is ordinary text (its tint is on the
 *  <td>), so it is not handled here. */
function richCellContent(d: Dialect, cell: GridCell, column: GridLeafColumn, row: GridRow, text: string, max: number): string {
  const value = row[column.field];
  switch (cell.type) {
    case "bar": {
      const pct = Math.round(barShare(cell, value, max) * 1000) / 10;
      return (
        `<span ${d.cls}="cell-bar ${toneClass(cell.tone ?? "accent")}">` +
        `<span ${d.cls}="cell-bar-track" aria-hidden="true"><span ${d.cls}="cell-bar-fill"${d.widthPct(pct)}></span></span>` +
        `<span ${d.cls}="cell-bar-value">${text}</span></span>`
      );
    }
    case "deltaChip": {
      const view = deltaView(value, cell.upIsGood ?? true);
      if (!view || view.direction === "flat") return "";
      const amount = formatGridValue({ ...column, kind: column.kind ?? "number", decimals: column.decimals ?? 0 }, view.magnitude);
      return `<span ${d.cls}="cell-chip ${toneClass(view.tone)}">${arrow(d, view.direction, GRID_ARROW_SIZE)}${view.direction === "up" ? "+" : "-"}${d.text(amount)}</span>`;
    }
    case "delta": {
      const view = deltaView(value, cell.upIsGood ?? true);
      const spark = cell.sparkField ? sparkSvg(d, row[cell.sparkField], "neutral") : "";
      if (!view) return spark;
      const amount = d.text(formatGridValue(column, view.magnitude));
      const delta =
        view.direction === "flat"
          ? `<span ${d.cls}="cell-delta is-flat">${amount}</span>`
          : `<span ${d.cls}="cell-delta ${toneClass(view.tone)}">${arrow(d, view.direction, GRID_ARROW_SIZE)}${srOnly(d, view.direction === "up" ? "Up" : "Down")}${amount}</span>`;
      return `<span ${d.cls}="cell-delta-wrap">${spark}${delta}</span>`;
    }
    case "sparkline":
      return sparkSvg(d, value, cell.tone ?? "neutral");
    case "badge": {
      if (value === null || value === undefined || value === "") return "";
      return `<span ${d.cls}="cell-badge ${toneClass(valueTone(cell.tones ?? RATING_TONES, value, cell.fallback ?? "bad"))}">${d.text(String(value))}</span>`;
    }
    case "toneText": {
      const tone = valueTone(cell.tones, value);
      return `<span ${d.cls}="cell-tonetext ${tone === "neutral" ? "is-neutral" : toneClass(tone)}">${d.text(String(value ?? ""))}</span>`;
    }
    case "flag": {
      const flag = flagEmoji(value);
      return `<span ${d.cls}="cell-flag">${flag ? `<span aria-hidden="true">${flag}</span>` : ""}<span ${d.cls}="cell-flag-code">${d.text(String(value ?? ""))}</span></span>`;
    }
    case "rank":
      return text ? `<span ${d.cls}="cell-rank">${text}</span>` : "";
    default:
      return text;
  }
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
  /* Rich cells, per leaf. A numeric column whose cell is left-aligned on the
     canvas (bar, flag, toned text) is not right-aligned here either. */
  const cells = leaves.map(cellOf);
  const rightAligned = leaves.map((c, i) => isNumericKind(c.kind) && !isLeftAlignedCell(cells[i]));
  /* Bar cells scaled to the column need its largest value. */
  const maxOf = leaves.map((c, i) => {
    const cell = cells[i];
    return cell?.type === "bar" && cell.scale === "columnMax" ? columnMax(rows, c.field) : 0;
  });
  /* The column that labels a row: the first one, after a rank column ("#")
     when the grid counts its rows. */
  const labelIndex = Math.max(0, cells.findIndex((cell) => cell?.type !== "rank"));

  head.push(
    `<tr>${leaves
      .map((c, i) => `<th scope="col"${classAttr(d, rightAligned[i] ? ["num"] : [])}>${d.text(c.header)}</th>`)
      .join("")}</tr>`,
  );

  const body = rows.map((row) => {
    const rowClasses = [
      ...(row._bold ? ["is-total"] : []),
      ...(opts.selected && String(row[leaves[labelIndex].field] ?? "") === opts.selected ? ["is-selected"] : []),
    ];
    const tds = leaves.map((c, i) => {
      const value = row[c.field];
      const text = d.text(formatGridValue(c, value));
      const cell = cells[i];
      const content = cell && cell.type !== "heat" ? richCellContent(d, cell, c, row, text, maxOf[i]) : text;
      if (i === labelIndex && !isNumericKind(c.kind)) {
        const level = typeof row._indent === "number" ? Math.min(MAX_INDENT, Math.max(0, Math.round(row._indent))) : 0;
        return `<th scope="row"${level > 0 ? ` data-indent="${level}"` : ""}>${content}</th>`;
      }
      const tone = cell?.type === "heat" ? heatTone(cell, value) : null;
      const classes = [
        ...(rightAligned[i] ? ["num"] : []),
        ...(isNegativeCell(c, value) ? ["is-negative"] : []),
        ...(tone ? ["cell-heat", toneClass(tone)] : []),
      ];
      return `<td${classAttr(d, classes)}>${content}</td>`;
    });
    return `<tr${classAttr(d, rowClasses)}>${tds.join("")}</tr>`;
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

function chartParts(raw: unknown): { name: string; y: number; isSum?: boolean }[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (pt): pt is { name: string; y: number; isSum?: boolean } =>
      Boolean(pt) && typeof pt === "object" && typeof (pt as { name: unknown }).name === "string" && Number.isFinite((pt as { y: unknown }).y as number),
  );
}

const chartTypeOf = (p: Record<string, unknown>): string => (typeof p.chartType === "string" ? p.chartType : "");
const decimalsOf = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(10, Math.round(v))) : undefined;

/** A waterfall's steps as a table: each step's change and the running total
 *  after it; a sum step shows the total reached. */
function waterfallGrid(parts: { name: string; y: number; isSum?: boolean }[], decimals: number | undefined): { columns: GridColumn[]; rows: GridRow[] } {
  let running = 0;
  const rows: GridRow[] = parts.map((step) => {
    if (step.isSum) return { [GROUP_FIELD]: step.name, change: null, total: running, _bold: true };
    running = Number((running + step.y).toFixed(4));
    return { [GROUP_FIELD]: step.name, change: step.y, total: running };
  });
  const number = { kind: "number" as const, ...(decimals !== undefined ? { decimals } : {}) };
  return {
    columns: [
      { field: GROUP_FIELD, header: "Step" },
      { field: "change", header: "Change", signed: true, ...number },
      { field: "total", header: "Running total", ...number },
    ],
    rows,
  };
}

/** A gauge's reading as text, written the way the dial writes it: the value
 *  with its decimals and suffix, "of <max>" when the gauge names its scale. */
export function gaugeValueText(p: Record<string, unknown>): string {
  const value = typeof p.value === "number" && Number.isFinite(p.value) ? p.value : 87;
  const max = typeof p.valueMax === "number" && Number.isFinite(p.valueMax) ? p.valueMax : undefined;
  const decimals = decimalsOf(p.valueDecimals);
  const suffix = typeof p.valueSuffix === "string" && p.valueSuffix.trim() ? p.valueSuffix : max === undefined ? "%" : "";
  const reading = `${decimals !== undefined ? value.toFixed(decimals) : String(value)}${suffix}`;
  return max === undefined ? reading : `${reading} of ${max}`;
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
  /* The selected point (set only by a chart whose points select) marks its row. */
  const selected = str(p.selectedPoint) || undefined;
  const type = chartTypeOf(p);
  let table: string[];
  if (type === "gauge" && p.panel === true) {
    /* A dial has no table behind it: its reading, as text. */
    table = [`<p ${d.cls}="chart-value">${d.text(gaugeValueText(p))}</p>`];
  } else if (type === "waterfall" && parts.length > 0) {
    const grid = waterfallGrid(parts, decimalsOf(p.valueDecimals));
    table = tableLines(d, grid.columns, grid.rows, { label, selected });
  } else if (series.length > 0) {
    const categories = Array.isArray(p.categories) ? p.categories.map((c) => String(c)) : series[0].data.map((_, i) => String(i + 1));
    const grid = seriesToGrid("", categories, series, percent ? "percent" : "number");
    table = tableLines(d, grid.columns, grid.rows, { label, selected });
  } else if (parts.length > 0) {
    const grid = partsToGrid("", parts, { field: "value", header: "Value", kind: "number", compact: true });
    table = tableLines(d, grid.columns, grid.rows, { label, selected });
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

/* ── Record panel: the detail of the record a grid has selected ──
   Blocks arrive with `record` resolved (materialise.ts), or without it when
   nothing is selected. The canvas draws this with RecordPanel.tsx. */

export const RECORD_PANEL_BLOCK_TYPE = "RecordPanel";
/** Height of the trend chart, as on the canvas. */
export const RECORD_TREND_HEIGHT = 150;

type TrendSection = Extract<ResolvedSection, { type: "trend" }>;

/** The resolved record of a materialised Record Panel block, or null. */
export function recordOf(block: Block): ResolvedRecord | null {
  const r = block.props?.record as ResolvedRecord | undefined;
  return r && typeof r === "object" && typeof r.title === "string" && Array.isArray(r.sections) ? r : null;
}

/** A trend draws only with two points or more (as on the canvas). */
const trendDraws = (section: ResolvedSection): section is TrendSection => section.type === "trend" && section.points.length >= 2;

/** True when the block is a Record Panel whose selected record has a trend to
 *  draw: the React export then needs the chart helper. */
export function recordPanelHasTrend(block: Block): boolean {
  return block.type === RECORD_PANEL_BLOCK_TYPE && (recordOf(block)?.sections.some(trendDraws) ?? false);
}

function recordHeading(d: Dialect, title: string | undefined): string[] {
  return title ? [`<h3 ${d.cls}="record-heading">${d.text(title)}</h3>`] : [];
}

function recordSectionLines(d: Dialect, section: ResolvedSection, trend: ((section: TrendSection) => string[]) | undefined): string[] {
  if (section.type === "pairs") {
    return [
      `<dl ${d.cls}="record-pairs">`,
      ...section.items.map((item) => {
        const flag = item.flag ? `<span aria-hidden="true">${item.flag} </span>` : "";
        const value = item.tone ? `<span ${d.cls}="cell-badge ${toneClass(item.tone)}">${d.text(item.text)}</span>` : d.text(item.text);
        return `  <div ${d.cls}="record-pair"><dt>${d.text(item.label)}</dt><dd>${flag}${value}</dd></div>`;
      }),
      "</dl>",
    ];
  }
  if (section.type === "table") {
    const hasChange = section.rows.some((r) => r.change);
    const head = [
      `<th scope="col">${srOnly(d, "Measure")}</th>`,
      ...section.columns.map((c) => `<th scope="col">${d.text(c)}</th>`),
      ...(hasChange ? ['<th scope="col">Change</th>'] : []),
    ];
    const rows = section.rows.map((r) => {
      const change = !hasChange
        ? ""
        : r.change && r.change.direction !== "flat"
          ? `<td><span ${d.cls}="record-change ${toneClass(r.change.tone)}">${arrow(d, r.change.direction, RECORD_ARROW_SIZE)}${srOnly(d, r.change.direction === "up" ? "Up" : "Down")}</span></td>`
          : `<td><span ${d.cls}="record-flat"><span aria-hidden="true">-</span>${srOnly(d, "No change")}</span></td>`;
      return `<tr><th scope="row">${d.text(r.label)}</th>${r.cells.map((c) => `<td>${d.text(c)}</td>`).join("")}${change}</tr>`;
    });
    return [
      `<div ${d.cls}="record-section">`,
      ...nest(recordHeading(d, section.title)),
      `  <table ${d.cls}="record-table">`,
      "    <thead>",
      `      <tr>${head.join("")}</tr>`,
      "    </thead>",
      "    <tbody>",
      ...rows.map((l) => "      " + l),
      "    </tbody>",
      "  </table>",
      "</div>",
    ];
  }
  if (!trendDraws(section)) return [];
  /* The trend: a chart where the dialect has a chart runtime, else its points. */
  const body = trend
    ? trend(section)
    : [
        `<table ${d.cls}="record-table">`,
        "  <thead>",
        `    <tr><th scope="col">Period</th><th scope="col">${d.text(section.seriesName)}</th></tr>`,
        "  </thead>",
        "  <tbody>",
        ...section.points.map((v, i) => `    <tr><th scope="row">${d.text(section.categories[i] ?? String(i + 1))}</th><td>${d.text(String(v))}</td></tr>`),
        "  </tbody>",
        "</table>",
      ];
  return [`<div ${d.cls}="record-section">`, ...nest(recordHeading(d, section.title)), ...nest(body), "</div>"];
}

/** A Record Panel block as a framed panel. With a record: its name as the
 *  title (the block's title beside it), then pairs as a <dl>, tables, and
 *  the trend - drawn by `trend` when given (the React chart), else listed as
 *  a table of points. With nothing selected: the block's title and its
 *  empty-state text. */
export function recordPanelLines(d: Dialect, block: Block, trend?: (section: TrendSection) => string[]): string[] {
  const p = block.props ?? {};
  const record = recordOf(block);
  const blockTitle = str(p.title) || "Detail";
  const spec: PanelSpec = {
    title: record ? record.title : blockTitle,
    subtitle: record ? blockTitle : "",
    height: panelHeightOf(p),
    viewBy: [],
    viewByValue: "",
  };
  const body = record
    ? [`<div ${d.cls}="record">`, ...nest(record.sections.flatMap((section) => recordSectionLines(d, section, trend))), "</div>"]
    : [
        `<div ${d.cls}="record record-empty">`,
        `  <p>${d.text(str(p.emptyText) || "Select a row to see its detail.")}</p>`,
        "</div>",
      ];
  return panelLines(d, spec, body);
}

/** True when the canvas draws rich grid cells, a record panel or a framed
 *  gauge: the stylesheet then carries their rules (REPORT_RICH_CSS). */
export function usesRichReport(blocks: Block[]): boolean {
  return blocks.some((b) => {
    if (b.type === RECORD_PANEL_BLOCK_TYPE) return true;
    /* A framed gauge exports its reading as text in the page export. */
    if (b.props?.chartType === "gauge" && b.props?.panel === true) return true;
    if (b.type === "DataGrid" && leafColumns(readGridColumns(b.props?.columns)).some((c) => cellOf(c) !== null)) return true;
    return b.children?.length ? usesRichReport(b.children) : false;
  });
}

/** Lines for a chrome, data-grid or record-panel block, or null when the block is not one. */
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
    case RECORD_PANEL_BLOCK_TYPE:
      return recordPanelLines(d, block);
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
