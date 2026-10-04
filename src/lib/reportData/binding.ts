/**
 * binding - how a chart or grid block reads the report dataset.
 *
 * A block with a `binding` prop does not carry its own categories, series or
 * rows: they are derived, on every render, from the dataset and the canvas's
 * report state (the context filters, each panel's "View by", the master
 * grid's selected row). Change a filter and every bound block re-derives.
 */

import type { GridCell, GridColumn, GridColumnKind, GridLeafColumn, GridRow } from "../dataGridModel";
import { applyComputed, type ComputedSpec } from "./computed";
import { cellKey, runQuery, type FilterSpec, type MeasureSpec, type QueryResult } from "./query";
import { GROUP_FIELD, RANK_FIELD, gridField, toCategorySeries, toGrid, toParts, type MeasureDisplay } from "./shape";
import { fieldOf, tableOf, type DataRow, type ReportDataset } from "./types";

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
  /** Computed measures that only apply while the rule is active. */
  computed?: ComputedSpec[];
}

export interface BindingFilter {
  /** Field to filter on. Can follow state: a chart filtered by the master
   *  grid's selection must filter on whatever the master is grouped by. A
   *  filter on a field this table does not have is skipped, so a table with
   *  fewer dimensions simply stays unfiltered. */
  field: Dyn<string>;
  /** Fixed value, or... */
  value?: string;
  /** ...the value of this report state. */
  state?: string;
  /** State values that mean "no filter" (e.g. the Total row being selected). */
  ignore?: string[];
  /** Value to filter by while the state is unset (e.g. the default periodicity). */
  fallback?: string;
  /** A second state whose value is kept as well (the entity AND the one it
   *  is compared with), with its own fallback. */
  alsoState?: string;
  alsoFallback?: string;
  /** Values that are always kept alongside (the entity's own rows next to
   *  the chosen benchmark's). */
  extra?: string[];
}

/** One column of a "records" grid: a field of the table, shown as it is. */
export interface RecordColumn {
  field: string;
  label: string;
  kind?: GridColumnKind;
  decimals?: number;
  compact?: boolean;
  signed?: boolean;
  /** A money amount: converted to the selected currency. */
  money?: boolean;
  width?: number;
  minWidth?: number;
  flex?: number;
  pinned?: boolean;
  cell?: GridCell;
  /** Show the column only while a state has one of these values ("" = the
   *  state is unset): a "View by" that swaps one column for another. */
  showWhen?: { state: string; in: string[] };
}

/** Lay a records grid out as group headings with their rows indented beneath. */
export interface GroupRows {
  /** Field the rows are grouped by; its value is the heading. */
  by: string;
  /** Column (a record column's field) that shows the heading and, on the
   *  rows beneath, the row's own label. */
  labelColumn: string;
  /** Fields summed onto the heading row. */
  sums?: string[];
  /** Counts shown on the heading row: rows whose `field` equals `equals`. */
  counts?: { as: string; field: string; equals: string }[];
}

export type DataLevel = number | "leaf";

/** The levels a grid binding shows under each group, for a grouping. */
export function levelsOf(binding: Pick<DataBinding, "hierarchy" | "dataLevel">, groupBy: string | null): string[] {
  const all = (binding.hierarchy ?? []).filter((k) => k !== groupBy);
  return typeof binding.dataLevel === "number" ? all.slice(0, Math.max(0, binding.dataLevel)) : [];
}

export interface ExpandedView {
  /** Keep a limit when expanded (default: none). */
  limit?: number;
  /** grid: the data level when expanded (default: the full hierarchy). */
  dataLevel?: DataLevel;
  /** chart: a grid shown under the chart instead of the chart's own values. */
  table?: DataBinding;
}

export interface DataBinding {
  table: string;
  /** series: categories + series (column, bar, line, area, combination).
   *  parts: named parts of a whole (pie, donut, waterfall).
   *  grid: columns + rows, aggregated by group.
   *  matrix: measures laid out as categories (periods) x series.
   *  records: the table's own rows, one per record, as a grid.
   *  value: one figure over everything that passes the filters (a gauge). */
  view: "series" | "parts" | "grid" | "matrix" | "records" | "value";
  groupBy?: Dyn<string>;
  pivotBy?: Dyn<string | null>;
  measures: MeasureSpec[];
  computed?: ComputedSpec[];
  /** The measures shown, in display order. */
  display: BoundMeasure[];
  filters?: BindingFilter[];
  adjustments?: Adjustment[];
  sort?: { by: Dyn<string>; dir?: "asc" | "desc" };
  limit?: number;
  share?: "total" | "group";
  /** records: group headings with indented rows. */
  groupRows?: GroupRows;
  /** grid: the levels available UNDER each group, outermost first (an
   *  account, then its asset classes, then its securities). */
  hierarchy?: string[];
  /** grid: how much of the hierarchy is shown. A number is how many levels
   *  sit under each group (0 = the groups alone); "leaf" lists the last
   *  level on its own, flat. Parent rows are bold, children indented. */
  dataLevel?: DataLevel;
  /** What the panel shows when it is EXPANDED to the full canvas: more of
   *  the same data. Any `limit` is lifted by default (the top ten becomes
   *  all of them); a grid can go a level deeper; a chart can put a fuller
   *  breakdown under itself. */
  expanded?: ExpandedView;
  /** Label of the total row (grid). Omitted = no total row. */
  total?: string;
  /** Header of the grid's first column. Default: the group field's label. */
  groupHeader?: Dyn<string>;
  /** Grid: fixed width of the first column, which is then pinned (for a grid
   *  wide enough to scroll sideways). Default: it flexes to fill. */
  groupWidth?: number;
  /** Grid: minimum width of a flexible first column. */
  groupMinWidth?: number;
  /** Grid: wrap display measures under group headers (e.g. one per period). */
  columnGroups?: { header: string; keys: string[] }[];
  /** Clicking a grid row or a chart point stores its label in this report
   *  state; clicking it again (or one of `selectClears`) clears it. */
  selectState?: string;
  /** Labels whose selection means "nothing selected" (a Total row, the first
   *  step of a waterfall). */
  selectClears?: string[];
  /** Grid: number the rows in a narrow first column. */
  rank?: boolean;
  /** records: the columns, in order. The first one labels the row. */
  records?: RecordColumn[];
  /** parts: keep zero and negative parts (a waterfall's steps down). */
  signedParts?: boolean;
  /** parts: add a closing part that shows the running total. */
  sumPart?: string;
  /** matrix: category labels, and for each series the measure key per category. */
  matrix?: { categories: string[]; series: { name: string; keys: string[]; style?: SeriesStyle }[] };
  /** parts: show the grand total of this measure in the middle of a donut. */
  centerMeasure?: string;
}

/** The fuller breakdown an expanded chart shows under itself. */
export interface BoundDetail { columns: GridColumn[]; rows: GridRow[] }

export interface ResolveOptions {
  /** The panel is expanded to the full canvas. */
  expanded?: boolean;
}

/** A selection a bound block can make: the state it writes, the current
 *  value, and the labels that clear it. */
export interface BoundSelection {
  selectState?: string;
  selected?: string;
  selectClears?: string[];
}

export type BoundData =
  | ({ view: "series"; categories: string[]; series: { name: string; data: (number | null)[]; type?: SeriesStyle["type"]; yAxis?: 0 | 1; dashStyle?: SeriesStyle["dashStyle"] }[]; detail?: BoundDetail } & BoundSelection)
  | ({ view: "parts"; seriesData: { name: string; y: number; isSum?: boolean }[]; centerValue: number | null; /** The centre value is money (shown in the selected currency). */ centerMoney?: boolean; detail?: BoundDetail } & BoundSelection)
  | ({ view: "grid"; columns: GridColumn[]; rows: GridRow[] } & BoundSelection)
  | { view: "value"; value: number | null };

/** How a donut's centre total is written: money in the selected currency,
 *  anything else as a compact number. */
export function centerColumn(money: boolean | undefined, currency: string | undefined): GridLeafColumn {
  return money
    ? { field: "", header: "", kind: "currency", compact: true, currency }
    : { field: "", header: "", kind: "number", compact: true, decimals: 2 };
}

/** What a click on `label` should store: null clears the selection (the
 *  same label again, or a label that means "everything"). */
export function nextSelection(bound: BoundSelection, label: string): string | null {
  if (!label || label === bound.selected || bound.selectClears?.includes(label)) return null;
  return label;
}

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
export function resolveBinding(source: DataBinding, dataset: ReportDataset, state: ReportState, options: ResolveOptions = {}): BoundData | null {
  const table = tableOf(dataset, source.table);
  if (!table) return null;
  /* Expanded: the same binding with its limit lifted and, for a grid, its
     deeper level. */
  const expanded = options.expanded === true;
  const binding: DataBinding = expanded
    ? {
        ...source,
        limit: source.expanded?.limit,
        ...(source.hierarchy ? { dataLevel: source.expanded?.dataLevel ?? source.hierarchy.length } : {}),
      }
    : source;
  const detail = (): { detail?: BoundDetail } => {
    if (!expanded || !source.expanded?.table) return {};
    const bound = resolveBinding(source.expanded.table, dataset, state, { expanded: true });
    return bound?.view === "grid" ? { detail: { columns: bound.columns, rows: bound.rows } } : {};
  };

  /* "leaf": the last level of the hierarchy on its own, as a flat list. Its
     rows are not groups of the master grid, so they select nothing. */
  const leaf = binding.view === "grid" && binding.dataLevel === "leaf" ? binding.hierarchy?.at(-1) : undefined;
  const groupBy = leaf ?? (binding.groupBy !== undefined ? dyn(binding.groupBy, state) : undefined);
  const pivotBy = binding.pivotBy !== undefined ? (dyn(binding.pivotBy, state) ?? undefined) : undefined;

  const filters: FilterSpec[] = [];
  for (const f of binding.filters ?? []) {
    const value = f.value ?? (f.state ? (state[f.state] ?? f.fallback) : undefined);
    if (value === undefined || value === "" || f.ignore?.includes(value)) continue;
    const field = dyn(f.field, state);
    if (!fieldOf(table, field)) continue;
    const also = f.alsoState ? (state[f.alsoState] ?? f.alsoFallback) : undefined;
    filters.push({ field, in: [value, ...(also ? [also] : []), ...(f.extra ?? [])] });
  }

  const selection: BoundSelection = binding.selectState && !leaf
    ? { selectState: binding.selectState, selected: state[binding.selectState], ...(binding.selectClears ? { selectClears: binding.selectClears } : {}) }
    : {};

  if (binding.view === "records") {
    return { view: "grid", ...recordsGrid(binding, table.rows, filters, dataset, state), ...selection };
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
    computed.push(...(a.computed ?? []));
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
    sort: binding.sort ? { by: dyn(binding.sort.by, state), dir: binding.sort.dir } : undefined,
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
      ...detail(),
    };
  }

  if (binding.view === "value") {
    const key = shown[0]?.key ?? result.measures[0];
    const v = (result.total ?? result.cells[0] ?? {})[cellKey(null, key)];
    return { view: "value", value: v === null || v === undefined ? null : Number(v.toFixed(4)) };
  }

  if (binding.view === "parts") {
    const key = shown[0]?.key ?? result.measures[0];
    const center = binding.centerMeasure ? (result.total?.[cellKey(null, binding.centerMeasure)] ?? null) : null;
    const parts: { name: string; y: number; isSum?: boolean }[] = binding.signedParts
      ? result.groups.flatMap((name, i) => {
          const v = result.cells[i][cellKey(null, key)];
          return v === null || v === undefined ? [] : [{ name, y: Number(v.toFixed(4)) }];
        })
      : toParts(result, key);
    if (binding.sumPart) parts.push({ name: binding.sumPart, y: 0, isSum: true });
    const centerMoney = Boolean(binding.centerMeasure && shown.find((m) => m.key === binding.centerMeasure)?.money);
    return { view: "parts", seriesData: parts, centerValue: center, ...(centerMoney ? { centerMoney: true } : {}), ...selection, ...detail() };
  }

  if (binding.view === "grid") {
    const header = binding.groupHeader !== undefined && !leaf ? dyn(binding.groupHeader, state) : (groupBy ? (fieldOf(table, groupBy)?.label ?? groupBy) : "");
    const withTotal: QueryResult = binding.total ? result : { ...result, total: undefined };
    const grid = toGrid(withTotal, shown, { groupHeader: header, totalLabel: binding.total, groupWidth: binding.groupWidth, groupMinWidth: binding.groupMinWidth, rank: binding.rank });
    const columns = binding.columnGroups && result.pivots.length === 0 ? groupColumns(grid.columns, binding.columnGroups) : grid.columns;
    /* Deeper levels: under each group, the same measures by the next
       dimension of the hierarchy, and so on down. Shares stay shares of the
       grand total. */
    const levels = groupBy && result.pivots.length === 0 ? levelsOf(binding, groupBy).filter((k) => fieldOf(table, k)) : [];
    if (levels.length > 0 && groupBy) {
      const sort = binding.sort ? { by: dyn(binding.sort.by, state), dir: binding.sort.dir } : undefined;
      const under = (scope: FilterSpec[], parent: string, top: string, depth: number): GridRow[] => {
        const dim = levels[depth - 1];
        const sub = applyComputed(runQuery(table, { groupBy: dim, measures: binding.measures, filters: scope, sort }), computed, result.total);
        const children = toGrid(sub, shown, { groupHeader: header }).rows;
        /* A level that only repeats its parent adds nothing. */
        if (children.length === 1 && children[0][GROUP_FIELD] === parent) return [];
        return children.flatMap((c, i) => {
          const deeper = depth < levels.length ? under([...scope, { field: dim, in: [sub.groups[i]] }], sub.groups[i], top, depth + 1) : [];
          /* A child row belongs to its group: selecting it selects the group. */
          return [{ ...c, _indent: depth, _select: top, ...(deeper.length ? { _bold: true } : {}) }, ...deeper];
        });
      };
      const head = binding.total ? [grid.rows[0]] : [];
      const groups = binding.total ? grid.rows.slice(1) : grid.rows;
      const rows: GridRow[] = [...head];
      result.groups.forEach((g, i) => {
        const children = under([...filters, { field: groupBy, in: [g] }], g, g, 1);
        rows.push(children.length ? { ...groups[i], _bold: true } : groups[i], ...children);
      });
      return { view: "grid", columns, rows, ...selection };
    }
    return { view: "grid", columns, rows: grid.rows, ...selection };
  }

  /* series */
  const cs = toCategorySeries(result, shown);
  const styleByName = new Map(shown.map((m) => [m.label, m.style]));
  return {
    view: "series",
    categories: cs.categories,
    series: cs.series.map((s) => ({ ...s, ...(result.pivots.length === 0 ? styleByName.get(s.name) : undefined) })),
    ...selection,
    ...detail(),
  };
}

/** A "records" grid: the table's rows that pass the filters, sorted and cut,
 *  one row per record, with the binding's columns. */
function recordsGrid(
  binding: DataBinding,
  rows: DataRow[],
  filters: FilterSpec[],
  dataset: ReportDataset,
  state: ReportState,
): { columns: GridColumn[]; rows: GridRow[] } {
  const cols = (binding.records ?? []).filter((c) => !c.showWhen || c.showWhen.in.includes(state[c.showWhen.state] ?? ""));
  const currency = state[CURRENCY_STATE] ?? dataset.baseCurrency;
  const rate = currencyRate(dataset, currency);
  let kept = rows.filter((r) => filters.every((f) => f.in.length === 0 || f.in.includes(r[f.field] as never)));
  if (binding.sort) {
    const by = dyn(binding.sort.by, state);
    const sign = binding.sort.dir === "asc" ? 1 : -1;
    kept = [...kept].sort((a, b) => {
      const x = a[by];
      const y = b[by];
      if (typeof x === "number" && typeof y === "number") return (x - y) * sign;
      return String(x ?? "").localeCompare(String(y ?? "")) * sign;
    });
  }
  if (binding.limit) kept = kept.slice(0, binding.limit);

  const leaves: GridLeafColumn[] = cols.map((c, i) => ({
    field: c.field,
    header: c.label,
    ...(c.kind ? { kind: c.kind } : {}),
    ...(c.decimals !== undefined ? { decimals: c.decimals } : {}),
    ...(c.compact ? { compact: true } : {}),
    ...(c.signed ? { signed: true } : {}),
    ...(c.money ? { currency } : {}),
    ...(c.width ? { width: c.width } : {}),
    ...(c.minWidth ? { minWidth: c.minWidth } : {}),
    ...(c.flex ? { flex: c.flex } : i === 0 && !c.width ? { flex: 2 } : {}),
    ...(c.pinned ? { pinned: true } : {}),
    ...(c.cell ? { cell: c.cell } : {}),
  }));
  /* Fields a cell reads besides its own (a delta's sparkline). */
  const extra = cols.flatMap((c) => (c.cell?.type === "delta" && c.cell.sparkField ? [c.cell.sparkField] : []));
  const gridRows: GridRow[] = kept.map((r, i) => {
    const row: GridRow = binding.rank ? { [RANK_FIELD]: i + 1 } : {};
    for (const c of cols) {
      const v = r[c.field];
      row[c.field] = c.money && typeof v === "number" ? Number((v * rate).toFixed(4)) : v;
    }
    for (const f of extra) row[f] = r[f];
    return row;
  });
  const columns: GridColumn[] = binding.columnGroups ? groupColumns(leaves, binding.columnGroups) : leaves;
  if (binding.rank) columns.unshift({ field: RANK_FIELD, header: "#", kind: "number", decimals: 0, width: 48, cell: { type: "rank" } });
  if (binding.groupRows) return { columns, rows: groupedRows(binding.groupRows, kept, gridRows) };
  return { columns, rows: gridRows };
}

/** Group headings (in order of first appearance), each followed by its rows,
 *  indented. A heading carries the sums and counts of its rows. */
function groupedRows(spec: GroupRows, source: DataRow[], rows: GridRow[]): GridRow[] {
  const order: string[] = [];
  const members = new Map<string, number[]>();
  source.forEach((r, i) => {
    const key = String(r[spec.by] ?? "");
    if (!members.has(key)) { members.set(key, []); order.push(key); }
    members.get(key)!.push(i);
  });
  const out: GridRow[] = [];
  for (const key of order) {
    const idx = members.get(key)!;
    const heading: GridRow = { [spec.labelColumn]: key, _bold: true, _heading: true };
    for (const f of spec.sums ?? []) {
      heading[f] = idx.reduce((a, i) => a + (typeof source[i][f] === "number" ? (source[i][f] as number) : 0), 0);
    }
    for (const c of spec.counts ?? []) heading[c.as] = idx.filter((i) => String(source[i][c.field] ?? "") === c.equals).length;
    out.push(heading);
    for (const i of idx) {
      /* A group with no rows of its own is a heading only (its single source
         row has no label). */
      if (rows[i][spec.labelColumn] === null || rows[i][spec.labelColumn] === undefined || rows[i][spec.labelColumn] === "") continue;
      out.push({ ...rows[i], _indent: 1 });
    }
  }
  return out;
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
