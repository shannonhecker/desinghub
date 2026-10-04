/**
 * panelConfig - the "pivot tool": what a user can change about a data-bound
 * panel, and how that becomes the block's binding.
 *
 * A panel's configuration is small and uniform whatever it started as:
 * draw it as a chart (of some kind) or a grid; group rows by one dimension;
 * optionally pivot another into columns (series); pick the figures and how
 * each is aggregated; show values as-is or as shares; keep the top N. The
 * same model works on the sample data and on an uploaded workbook's own
 * columns.
 */

import { dyn, type BoundMeasure, type DataBinding, type DataLevel, type ReportState } from "./binding";
import type { Aggregation } from "./query";
import { fieldOf, measuresOf, type DataField, type DataTable } from "./types";

export type PanelView = "chart" | "grid";

/** Chart kinds a configured panel can be drawn as, with their block type. */
export const PANEL_CHART_TYPES = [
  { value: "column", label: "Column", block: "HighchartColumn" },
  { value: "stacked-column", label: "Stacked column", block: "HighchartStackedColumn" },
  { value: "bar", label: "Bar", block: "HighchartBar" },
  { value: "stacked-bar", label: "Stacked bar", block: "HighchartStackedBar" },
  { value: "line", label: "Line", block: "HighchartLine" },
  { value: "area", label: "Area", block: "HighchartArea" },
  { value: "stacked-area", label: "Stacked area", block: "HighchartStackedArea" },
  { value: "combination", label: "Combination", block: "HighchartCombination" },
  { value: "donut", label: "Donut", block: "HighchartDonut" },
  { value: "pie", label: "Pie", block: "HighchartPie" },
] as const;
export type PanelChartType = (typeof PANEL_CHART_TYPES)[number]["value"];

const PART_CHARTS = new Set<string>(["donut", "pie"]);

export const AGGREGATIONS: { value: Aggregation; label: string }[] = [
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "wavg", label: "Weighted average" },
  { value: "min", label: "Minimum" },
  { value: "max", label: "Maximum" },
  { value: "count", label: "Count" },
];

export interface PanelValue {
  field: string;
  agg: Aggregation;
}

export interface PanelConfig {
  view: PanelView;
  chartType: PanelChartType;
  /** Dimension the rows (or chart categories) are grouped by. */
  rows: string | null;
  /** Dimension pivoted into columns (or chart series). */
  columns: string | null;
  values: PanelValue[];
  share: "none" | "total" | "group";
  /** Keep the top N groups by the first value; null = all. */
  limit: number | null;
}

/** A matrix panel (measures laid out as periods x series) has a hand-built
 *  layout the pivot model cannot express; it can still be re-configured, but
 *  doing so replaces that layout. */
export function isHandBuilt(binding: DataBinding): boolean {
  return binding.view === "matrix";
}

/** The field money-weighted averages are weighted by: the table's first
 *  currency measure, if it has one. */
export function weightField(table: DataTable): string | undefined {
  return measuresOf(table).find((f) => f.format === "currency")?.key;
}

/** The sensible default aggregation for a figure: percentages average
 *  (weighted, when the table has a weight), everything else adds up. */
export function defaultAggregation(field: DataField, table: DataTable): Aggregation {
  if (field.format === "percent") return weightField(table) && weightField(table) !== field.key ? "wavg" : "avg";
  return "sum";
}

/** Read a panel's current configuration out of its block. */
export function readPanelConfig(
  block: { type: string; props: Record<string, unknown> },
  table: DataTable,
  state: ReportState,
): PanelConfig {
  const binding = block.props.binding as DataBinding;
  const view: PanelView = block.type === "DataGrid" ? "grid" : "chart";
  const chartType = PANEL_CHART_TYPES.some((c) => c.value === block.props.chartType) ? (block.props.chartType as PanelChartType) : "column";
  const rows = binding.groupBy !== undefined ? dyn(binding.groupBy, state) : null;
  const columns = binding.pivotBy !== undefined ? dyn(binding.pivotBy, state) : null;
  /* Only real table fields: computed measures are not something the pivot
     model offers as a value. */
  const values: PanelValue[] = binding.measures
    .filter((m) => fieldOf(table, m.field)?.role === "measure")
    .filter((m, i, all) => all.findIndex((x) => x.field === m.field) === i)
    .map((m) => ({ field: m.field, agg: m.agg ?? "sum" }));
  return {
    view,
    chartType,
    rows: rows && fieldOf(table, rows) ? rows : null,
    columns: columns && fieldOf(table, columns) ? columns : null,
    values,
    share: binding.share ?? "none",
    limit: binding.limit ?? null,
  };
}

function displayFor(field: DataField, agg: Aggregation, share: PanelConfig["share"]): BoundMeasure {
  if (agg === "count") return { key: field.key, label: `${field.label} (count)`, kind: "number", decimals: 0 };
  if (share !== "none") return { key: field.key, label: field.label, kind: "percent" };
  if (field.format === "currency") return { key: field.key, label: field.label, kind: "currency", compact: true, money: true };
  if (field.format === "percent") return { key: field.key, label: field.label, kind: "percent", signed: true };
  return { key: field.key, label: field.label, kind: "number" };
}

/** Build the block (type + props) for a configuration. The panel keeps its
 *  title, height, frame and its scope filters (so it still follows the master
 *  grid); the query and its display are rebuilt from the configuration. */
export function applyPanelConfig(
  block: { type: string; props: Record<string, unknown> },
  config: PanelConfig,
  table: DataTable,
): { type: string; props: Record<string, unknown> } {
  const previous = block.props.binding as DataBinding;
  const weight = weightField(table);
  const values = config.values.filter((v) => fieldOf(table, v.field));
  const isParts = config.view === "chart" && PART_CHARTS.has(config.chartType);
  /* A pie has one ring: no pivot, one value. */
  const columns = isParts ? null : config.columns && config.columns !== config.rows ? config.columns : null;
  const shown = isParts ? values.slice(0, 1) : values;
  const share = isParts ? "none" : config.share;

  const binding: DataBinding = {
    table: previous.table,
    view: config.view === "grid" ? "grid" : isParts ? "parts" : "series",
    ...(config.rows ? { groupBy: config.rows } : {}),
    ...(columns ? { pivotBy: columns } : {}),
    measures: shown.map((v) => {
      const weighted = v.agg === "wavg" && weight && weight !== v.field;
      return { field: v.field, agg: v.agg === "wavg" && !weighted ? "avg" : v.agg, ...(weighted ? { weight } : {}) };
    }),
    display: shown.map((v) => displayFor(fieldOf(table, v.field)!, v.agg, share)),
    ...(previous.filters ? { filters: previous.filters } : {}),
    ...(share !== "none" ? { share } : {}),
    ...(config.limit && shown[0] ? { limit: config.limit, sort: { by: shown[0].field, dir: "desc" as const } } : {}),
    ...(config.view === "grid" ? { total: previous.total ?? "Total" } : {}),
    ...(config.view === "grid" && previous.selectState ? { selectState: previous.selectState } : {}),
    ...(config.view === "grid" && previous.hierarchy ? { hierarchy: previous.hierarchy, dataLevel: previous.dataLevel, expanded: previous.expanded } : {}),
    ...(isParts && shown[0] && fieldOf(table, shown[0].field)?.format === "currency" ? { centerMeasure: shown[0].field } : {}),
  };

  /* Drop what the old layout owned: its "View by" choices (rows are now
     explicit) and chart settings that described the old figures. */
  const { viewBy: _viewBy, viewByCsv: _viewByCsv, yAxisFormat: _f, yAxisMax: _m, secondaryAxisFormat: _s, valueSuffix: _v, valueDecimals: _d, centerLabel: _c, ...rest } = block.props;
  void _viewBy; void _viewByCsv; void _f; void _m; void _s; void _v; void _d; void _c;
  const percent = share !== "none" || shown.every((v) => fieldOf(table, v.field)?.format === "percent" && v.agg !== "count");
  const chartProps =
    config.view === "chart"
      ? {
          chartType: config.chartType,
          panel: true,
          valueDecimals: 2,
          ...(percent && !isParts ? { yAxisFormat: "{value}%", valueSuffix: "%" } : {}),
          ...(share !== "none" && config.chartType.startsWith("stacked") ? { yAxisMax: 100 } : {}),
        }
      : {};
  const type = config.view === "grid" ? "DataGrid" : PANEL_CHART_TYPES.find((c) => c.value === config.chartType)!.block;
  return { type, props: { ...rest, ...chartProps, binding } };
}

/* ── Data level ──
   How far down its hierarchy a grid goes: the groups alone, each level under
   them in turn, or the last level on its own. */

export interface DataLevelOption {
  level: DataLevel;
  label: string;
  /** The path of the rows, outermost first. */
  path: string;
}

/** The data levels a grid binding offers; empty when it has no hierarchy. */
export function dataLevelOptions(binding: DataBinding, table: DataTable, state: ReportState): DataLevelOption[] {
  if (binding.view !== "grid" || !binding.hierarchy?.length) return [];
  const groupBy = binding.groupBy !== undefined ? dyn(binding.groupBy, state) : null;
  const label = (key: string) => fieldOf(table, key)?.label ?? key;
  const levels = binding.hierarchy.filter((k) => k !== groupBy && fieldOf(table, k));
  if (!groupBy || levels.length === 0) return [];
  const group = binding.groupHeader !== undefined ? dyn(binding.groupHeader, state) : label(groupBy);
  const path = (n: number) => [group, ...levels.slice(0, n).map(label)].join(" > ");
  const options: DataLevelOption[] = [];
  for (let n = levels.length; n >= 0; n--) {
    options.push({ level: n, label: n === levels.length ? "Full hierarchy" : n === 0 ? `${group} only` : `${group} and ${label(levels[n - 1]).toLowerCase()}`, path: path(n) });
  }
  const last = label(levels[levels.length - 1]);
  options.push({ level: "leaf", label: `${last} level`, path: last });
  return options;
}

/** The option the configured panel shows. The configuration is edited with
 *  the panel expanded, so this is the EXPANDED level: the one chosen by hand,
 *  or the full hierarchy. */
export function currentDataLevel(binding: DataBinding, options: DataLevelOption[]): DataLevelOption | undefined {
  const max = options.reduce((m, o) => (typeof o.level === "number" ? Math.max(m, o.level) : m), 0);
  const chosen = binding.expanded?.dataLevel ?? max;
  const level = chosen === "leaf" ? "leaf" : Math.min(max, Math.max(0, chosen));
  return options.find((o) => o.level === level);
}

/** Set the data level. A level chosen by hand also holds when the panel is
 *  expanded (which otherwise opens the full hierarchy). */
export function withDataLevel(binding: DataBinding, level: DataLevel): DataBinding {
  return { ...binding, dataLevel: level, expanded: { ...binding.expanded, dataLevel: level } };
}
