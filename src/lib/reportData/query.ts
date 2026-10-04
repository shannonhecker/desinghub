/**
 * query - group, pivot and aggregate one table.
 *
 * The whole "pivot tool": rows grouped by one dimension, optionally another
 * dimension pivoted into columns, any number of aggregated measures, filters,
 * a sort, a top-N limit, percent-of-total, and a total row. Pure functions
 * over plain rows - no grid library involved, so the result can feed a chart
 * and a grid alike.
 */

import type { DataRow, DataTable, DataValue } from "./types";

export type Aggregation = "sum" | "avg" | "min" | "max" | "count" | "first" | "last" | "wavg";

export interface MeasureSpec {
  /** Field to aggregate. */
  field: string;
  /** Default "sum". "wavg" is an average weighted by `weight`. */
  agg?: Aggregation;
  /** Weight field for "wavg". */
  weight?: string;
  /** Key for this measure in the result. Default: the field key. */
  as?: string;
  /** Multiply the aggregated value (e.g. a currency rate). Default 1. */
  scale?: number;
}

export interface FilterSpec {
  field: string;
  /** Keep rows whose value is one of these. An empty list keeps everything. */
  in: DataValue[];
}

export interface QuerySpec {
  /** Row dimension. Omitted = one group holding every row. */
  groupBy?: string;
  /** Column dimension. */
  pivotBy?: string;
  measures: MeasureSpec[];
  filters?: FilterSpec[];
  /** Sort groups by a measure key (summed across pivots), or by "label". */
  sort?: { by: string; dir?: "asc" | "desc" };
  /** Keep the first N groups after sorting. */
  limit?: number;
  /** Express every value as a percent: of the grand total, or of its group. */
  share?: "total" | "group";
  /** Add an aggregate over all groups. */
  total?: boolean;
}

/** Values of one group: measureKey -> value, and for a pivoted query
 *  `${pivot}\u0000${measureKey}` -> value. */
export type CellMap = Record<string, number | null>;

export interface QueryResult {
  /** Group labels, in display order. */
  groups: string[];
  /** Pivot labels, in display order ([] when not pivoted). */
  pivots: string[];
  /** Measure keys, in spec order. */
  measures: string[];
  /** One CellMap per group, aligned with `groups`. */
  cells: CellMap[];
  /** Aggregate over all groups (present when spec.total). */
  total?: CellMap;
}

export const ALL_GROUP = "All";
const SEP = "\u0000";

export const cellKey = (pivot: string | null, measure: string): string =>
  pivot === null ? measure : `${pivot}${SEP}${measure}`;

const label = (v: DataValue): string => (v === null || v === undefined || v === "" ? "(blank)" : String(v));
const num = (v: DataValue): number | null => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

function aggregate(rows: DataRow[], m: MeasureSpec): number | null {
  const agg = m.agg ?? "sum";
  if (agg === "count") return rows.length * (m.scale ?? 1);
  const values: number[] = [];
  const weights: number[] = [];
  for (const r of rows) {
    const v = num(r[m.field]);
    if (v === null) continue;
    values.push(v);
    if (agg === "wavg") weights.push(num(r[m.weight ?? ""]) ?? 0);
  }
  if (values.length === 0) return null;
  let out: number;
  switch (agg) {
    case "sum": out = values.reduce((a, b) => a + b, 0); break;
    case "avg": out = values.reduce((a, b) => a + b, 0) / values.length; break;
    case "min": out = Math.min(...values); break;
    case "max": out = Math.max(...values); break;
    case "first": out = values[0]; break;
    case "last": out = values[values.length - 1]; break;
    case "wavg": {
      const w = weights.reduce((a, b) => a + b, 0);
      if (w === 0) return null;
      out = values.reduce((a, v, i) => a + v * weights[i], 0) / w;
      break;
    }
  }
  return out * (m.scale ?? 1);
}

function cellsFor(rows: DataRow[], spec: QuerySpec, pivots: string[]): CellMap {
  const out: CellMap = {};
  if (!spec.pivotBy) {
    for (const m of spec.measures) out[cellKey(null, m.as ?? m.field)] = aggregate(rows, m);
    return out;
  }
  const byPivot = new Map<string, DataRow[]>();
  for (const r of rows) {
    const p = label(r[spec.pivotBy]);
    const list = byPivot.get(p);
    if (list) list.push(r);
    else byPivot.set(p, [r]);
  }
  for (const p of pivots) {
    const pr = byPivot.get(p) ?? [];
    for (const m of spec.measures) out[cellKey(p, m.as ?? m.field)] = pr.length ? aggregate(pr, m) : null;
  }
  return out;
}

/** Sum of a group's values for one measure, across pivots. */
function measureTotal(cells: CellMap, measure: string, pivots: string[]): number {
  if (pivots.length === 0) return cells[cellKey(null, measure)] ?? 0;
  return pivots.reduce((a, p) => a + (cells[cellKey(p, measure)] ?? 0), 0);
}

export function runQuery(table: DataTable, spec: QuerySpec): QueryResult {
  let rows = table.rows;
  for (const f of spec.filters ?? []) {
    if (f.in.length === 0) continue;
    const allowed = new Set(f.in.map(label));
    rows = rows.filter((r) => allowed.has(label(r[f.field])));
  }

  /* Groups and pivots keep first-appearance order, so the table's own row
     order is the default display order. */
  const groupRows = new Map<string, DataRow[]>();
  const pivotSet = new Set<string>();
  for (const r of rows) {
    const g = spec.groupBy ? label(r[spec.groupBy]) : ALL_GROUP;
    const list = groupRows.get(g);
    if (list) list.push(r);
    else groupRows.set(g, [r]);
    if (spec.pivotBy) pivotSet.add(label(r[spec.pivotBy]));
  }
  const pivots = [...pivotSet];
  const measures = spec.measures.map((m) => m.as ?? m.field);

  let entries = [...groupRows.entries()].map(([group, gr]) => ({ group, cells: cellsFor(gr, spec, pivots) }));
  const total = spec.total || spec.share === "total" ? cellsFor(rows, spec, pivots) : undefined;

  if (spec.sort) {
    const dir = spec.sort.dir === "asc" ? 1 : -1;
    const by = spec.sort.by;
    entries = [...entries].sort((a, b) =>
      by === "label"
        ? dir * a.group.localeCompare(b.group)
        : dir * (measureTotal(a.cells, by, pivots) - measureTotal(b.cells, by, pivots)),
    );
  }
  if (spec.limit !== undefined) entries = entries.slice(0, Math.max(0, spec.limit));

  if (spec.share) {
    const grand: Record<string, number> = {};
    if (spec.share === "total" && total) for (const m of measures) grand[m] = measureTotal(total, m, pivots);
    const toShare = (cells: CellMap): CellMap => {
      const out: CellMap = {};
      for (const m of measures) {
        const denom = spec.share === "total" ? grand[m] : measureTotal(cells, m, pivots);
        const keys = pivots.length ? pivots.map((p) => cellKey(p, m)) : [cellKey(null, m)];
        for (const k of keys) {
          const v = cells[k];
          out[k] = v === null || v === undefined || !denom ? null : (v / denom) * 100;
        }
      }
      return out;
    };
    entries = entries.map((e) => ({ group: e.group, cells: toShare(e.cells) }));
    return {
      groups: entries.map((e) => e.group),
      pivots,
      measures,
      cells: entries.map((e) => e.cells),
      ...(spec.total && total ? { total: toShare(total) } : {}),
    };
  }

  return {
    groups: entries.map((e) => e.group),
    pivots,
    measures,
    cells: entries.map((e) => e.cells),
    ...(spec.total && total ? { total } : {}),
  };
}
