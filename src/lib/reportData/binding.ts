/**
 * binding - how a chart or grid block reads the report dataset.
 *
 * A block with a `binding` prop does not carry its own categories, series or
 * rows: they are derived, on every render, from the dataset and the canvas's
 * report state (the context filters, each panel's "View by", the master
 * grid's selected row). Change a filter and every bound block re-derives.
 */

import type { GridColumn, GridRow } from "../dataGridModel";
import { applyComputed, type ComputedSpec } from "./computed";
import { cellKey, runQuery, type FilterSpec, type MeasureSpec, type QueryResult } from "./query";
import { GROUP_FIELD, gridField, toCategorySeries, toGrid, toParts, type MeasureDisplay } from "./shape";
import { fieldOf, tableOf, type ReportDataset } from "./types";

/** Canvas report state: filter values, "View by" choices, selections. */
export type ReportState = Record<string, string>;

/** A setting that follows report state: the state's current value is looked
 *  up in `options` (e.g. the "View by" label "Asset class" -> field
 *  "assetClass"). */
export interface FromState<T> {
  state: string;
  options: Record<string, T>;
  fallback: T;
}
export type Dyn<T> = T | FromState<T>;

function isFromState<T>(v: Dyn<T>): v is FromState<T> {
  return typeof v === "object" && v !== null && "state" in v && "options" in v;
}

export function dyn<T>(v: Dyn<T>, state: ReportState): T {
  if (!isFromState(v)) return v;
  const current = state[v.state];
  return current !== undefined && current in v.options ? v.options[current] : v.fallback;
}

export interface SeriesStyle {
  type?: "column" | "line" | "spline" | "area";
  yAxis?: 0 | 1;
  dashStyle?: "Solid" | "Dash" | "ShortDash" | "Dot";
}

export interface BoundMeasure extends MeasureDisplay {
  /** A money amount: converted to the selected currency. */
  money?: boolean;
  /** How this measure is drawn in a combination chart. */
  style?: SeriesStyle;
}

/** A rule that applies while a piece of report state has one of the given
 *  values: scale some measures, add to some, or hide some. */
export interface Adjustment {
  when: { state: string; in: string[] };
  scale?: { keys: string[]; factor: number };
  offsets?: Record<string, number>;
  omit?: string[];
}

export interface BindingFilter {
  field: string;
  /** Fixed value, or... */
  value?: string;
  /** ...the value of this report state. */
  state?: string;
  /** State values that mean "no filter" (e.g. the Total row being selected). */
  ignore?: string[];
}

export interface DataBinding {
  table: string;
  /** series: categories + series (column, bar, line, area, combination).
   *  parts: named parts of a whole (pie, donut).
   *  grid: columns + rows.
   *  matrix: measures laid out as categories (periods) x series. */
  view: "series" | "parts" | "grid" | "matrix";
  groupBy?: Dyn<string>;
  pivotBy?: Dyn<string | null>;
  measures: MeasureSpec[];
  computed?: ComputedSpec[];
  /** The measures shown, in display order. */
  display: BoundMeasure[];
  filters?: BindingFilter[];
  adjustments?: Adjustment[];
  sort?: { by: string; dir?: "asc" | "desc" };
  limit?: number;
  share?: "total" | "group";
  /** Label of the total row (grid). Omitted = no total row. */
  total?: string;
  /** Header of the grid's first column. Default: the group field's label. */
  groupHeader?: Dyn<string>;
  /** Grid: wrap display measures under group headers (e.g. one per period). */
  columnGroups?: { header: string; keys: string[] }[];
  /** Grid: clicking a row stores its label in this report state. */
  selectState?: string;
  /** matrix: category labels, and for each series the measure key per category. */
  matrix?: { categories: string[]; series: { name: string; keys: string[]; style?: SeriesStyle }[] };
  /** parts: show the grand total of this measure in the middle of a donut. */
  centerMeasure?: string;
}

export type BoundData =
  | { view: "series"; categories: string[]; series: { name: string; data: (number | null)[]; type?: SeriesStyle["type"]; yAxis?: 0 | 1; dashStyle?: SeriesStyle["dashStyle"] }[] }
  | { view: "parts"; seriesData: { name: string; y: number }[]; centerValue: number | null }
  | { view: "grid"; columns: GridColumn[]; rows: GridRow[]; selectState?: string; selected?: string };

/** State key holding the selected currency code. */
export const CURRENCY_STATE = "currency";
/** Table of currency rates: one row per currency, `rate` units per base unit. */
export const FX_TABLE = "fx";

export function currencyRate(dataset: ReportDataset, code: string | undefined): number {
  if (!code || code === dataset.baseCurrency) return 1;
  const row = tableOf(dataset, FX_TABLE)?.rows.find((r) => r.currency === code);
  const rate = typeof row?.rate === "number" ? row.rate : Number(row?.rate);
  return Number.isFinite(rate) && rate > 0 ? rate : 1;
}

const active = (a: Adjustment, state: ReportState): boolean => a.when.in.includes(state[a.when.state] ?? "");

/** Derive a bound block's data. Returns null when the table is missing, so
 *  the caller can fall back to the block's own static props. */
export function resolveBinding(binding: DataBinding, dataset: ReportDataset, state: ReportState): BoundData | null {
  const table = tableOf(dataset, binding.table);
  if (!table) return null;

  const groupBy = binding.groupBy !== undefined ? dyn(binding.groupBy, state) : undefined;
  const pivotBy = binding.pivotBy !== undefined ? (dyn(binding.pivotBy, state) ?? undefined) : undefined;

  const filters: FilterSpec[] = [];
  for (const f of binding.filters ?? []) {
    const value = f.value ?? (f.state ? state[f.state] : undefined);
    if (value === undefined || value === "" || f.ignore?.includes(value)) continue;
    filters.push({ field: f.field, in: [value] });
  }

  const adjustments = (binding.adjustments ?? []).filter((a) => active(a, state));
  const omitted = new Set(adjustments.flatMap((a) => a.omit ?? []));
  const display = binding.display.filter((m) => !omitted.has(m.key));

  /* Order matters: state adjustments act on the aggregated base measures,
     the binding's own computed measures build on those, and the currency
     conversion comes last (ratios are already taken, so they are unaffected). */
  const computed: ComputedSpec[] = [];
  for (const a of adjustments) {
    for (const key of a.scale?.keys ?? []) computed.push({ as: key, op: "adjust", of: [key], factor: a.scale!.factor });
    for (const [key, offset] of Object.entries(a.offsets ?? {})) computed.push({ as: key, op: "adjust", of: [key], offset });
  }
  computed.push(...(binding.computed ?? []));
  const currency = state[CURRENCY_STATE] ?? dataset.baseCurrency;
  const rate = currencyRate(dataset, currency);
  if (rate !== 1) {
    for (const m of binding.display) if (m.money) computed.push({ as: m.key, op: "adjust", of: [m.key], factor: rate });
  }

  const base = runQuery(table, {
    groupBy,
    pivotBy,
    measures: binding.measures,
    filters,
    sort: binding.sort,
    limit: binding.limit,
    share: binding.share,
    total: true,
  });
  const result: QueryResult = applyComputed(base, computed);
  const shown = display.map((m) => (m.money ? { ...m, currency } : m));

  if (binding.view === "matrix" && binding.matrix) {
    /* One group (everything that passes the filters): its measures are laid
       out as categories x series. */
    const cells = result.total ?? result.cells[0] ?? {};
    return {
      view: "series",
      categories: binding.matrix.categories,
      series: binding.matrix.series
        .filter((s) => !s.keys.some((k) => omitted.has(k)))
        .map((s) => ({
          name: s.name,
          data: s.keys.map((k) => {
            const v = cells[cellKey(null, k)];
            return v === null || v === undefined ? null : Number(v.toFixed(4));
          }),
          ...s.style,
        })),
    };
  }

  if (binding.view === "parts") {
    const key = shown[0]?.key ?? result.measures[0];
    const center = binding.centerMeasure ? (result.total?.[cellKey(null, binding.centerMeasure)] ?? null) : null;
    return { view: "parts", seriesData: toParts(result, key), centerValue: center };
  }

  if (binding.view === "grid") {
    const header = binding.groupHeader !== undefined ? dyn(binding.groupHeader, state) : (groupBy ? (fieldOf(table, groupBy)?.label ?? groupBy) : "");
    const withTotal: QueryResult = binding.total ? result : { ...result, total: undefined };
    const grid = toGrid(withTotal, shown, { groupHeader: header, totalLabel: binding.total });
    const columns = binding.columnGroups && result.pivots.length === 0 ? groupColumns(grid.columns, binding.columnGroups) : grid.columns;
    return {
      view: "grid",
      columns,
      rows: grid.rows,
      ...(binding.selectState ? { selectState: binding.selectState, selected: state[binding.selectState] } : {}),
    };
  }

  /* series */
  const cs = toCategorySeries(result, shown);
  const styleByName = new Map(shown.map((m) => [m.label, m.style]));
  return {
    view: "series",
    categories: cs.categories,
    series: cs.series.map((s) => ({ ...s, ...(result.pivots.length === 0 ? styleByName.get(s.name) : undefined) })),
  };
}

/** Wrap flat measure columns under group headers; columns not named by any
 *  group stay where they are. */
function groupColumns(columns: GridColumn[], groups: { header: string; keys: string[] }[]): GridColumn[] {
  const out: GridColumn[] = [];
  const placed = new Set<string>();
  for (const c of columns) {
    if ("children" in c) { out.push(c); continue; }
    if (c.field === GROUP_FIELD) { out.push(c); continue; }
    if (placed.has(c.field)) continue;
    const g = groups.find((grp) => grp.keys.some((k) => gridField(null, k) === c.field));
    if (!g) { out.push(c); continue; }
    const children = columns.filter(
      (x): x is Exclude<GridColumn, { children: unknown }> => !("children" in x) && g.keys.some((k) => gridField(null, k) === x.field),
    );
    children.forEach((x) => placed.add(x.field));
    if (children.length) out.push({ header: g.header, children });
  }
  return out;
}
