/**
 * shape - turn a query result into what a chart or a grid block takes.
 */

import { cellKey, type CellMap, type QueryResult } from "./query";
import type { GridColumn, GridColumnKind, GridLeafColumn, GridRow } from "../dataGridModel";

export interface MeasureDisplay {
  /** Measure key in the query result. */
  key: string;
  label: string;
  kind?: GridColumnKind;
  decimals?: number;
  compact?: boolean;
  signed?: boolean;
  currency?: string;
  width?: number;
}

export interface CategorySeries {
  categories: string[];
  series: { name: string; data: (number | null)[] }[];
}

const round = (v: number | null | undefined, places = 4): number | null =>
  v === null || v === undefined ? null : Number(v.toFixed(places));

/** Categories + series for the category charts (column, bar, line, area...).
 *  Not pivoted: one series per measure. Pivoted: one series per pivot value
 *  (and per measure, when there is more than one). */
export function toCategorySeries(result: QueryResult, measures: MeasureDisplay[]): CategorySeries {
  const categories = result.groups;
  if (result.pivots.length === 0) {
    return {
      categories,
      series: measures.map((m) => ({ name: m.label, data: result.cells.map((c) => round(c[cellKey(null, m.key)])) })),
    };
  }
  const single = measures.length === 1;
  return {
    categories,
    series: result.pivots.flatMap((p) =>
      measures.map((m) => ({
        name: single ? p : `${p} - ${m.label}`,
        data: result.cells.map((c) => round(c[cellKey(p, m.key)])),
      })),
    ),
  };
}

/** Named parts of a whole for pie / donut: one part per group. Parts with no
 *  value or a non-positive value are dropped (a pie cannot draw them). */
export function toParts(result: QueryResult, measureKey: string): { name: string; y: number }[] {
  return result.groups
    .map((name, i) => ({ name, y: round(result.cells[i][cellKey(null, measureKey)]) }))
    .filter((p): p is { name: string; y: number } => p.y !== null && p.y > 0);
}

/** Field name used for the group column in grid rows. */
export const GROUP_FIELD = "_group";

const leaf = (field: string, header: string, m: MeasureDisplay): GridLeafColumn => ({
  field,
  header,
  kind: m.kind ?? "number",
  ...(m.decimals !== undefined ? { decimals: m.decimals } : {}),
  ...(m.compact ? { compact: true } : {}),
  ...(m.signed ? { signed: true } : {}),
  ...(m.currency ? { currency: m.currency } : {}),
  ...(m.width ? { width: m.width } : {}),
});

/** Grid field for a (pivot, measure) cell. Field names avoid dots, which AG
 *  Grid would read as a nested path. */
export const gridField = (pivotIndex: number | null, measureKey: string): string =>
  pivotIndex === null ? measureKey : `p${pivotIndex}_${measureKey}`;

/** Columns + rows for a Data Grid block. A pivoted result becomes one column
 *  group per pivot value; the total, when present, is the first row, bold. */
export function toGrid(
  result: QueryResult,
  measures: MeasureDisplay[],
  opts: { groupHeader: string; totalLabel?: string; groupWidth?: number; groupMinWidth?: number },
): { columns: GridColumn[]; rows: GridRow[] } {
  /* A fixed-width group column is pinned (the grid is expected to scroll
     sideways); otherwise it flexes to fill the width the measures leave.
     AG Grid does not flex a pinned column, so the two do not combine. */
  const groupColumn: GridLeafColumn = {
    field: GROUP_FIELD,
    header: opts.groupHeader,
    ...(opts.groupWidth ? { width: opts.groupWidth, pinned: true } : { flex: 2 }),
    ...(opts.groupMinWidth ? { minWidth: opts.groupMinWidth } : {}),
  };
  const columns: GridColumn[] = [groupColumn];
  if (result.pivots.length === 0) {
    for (const m of measures) columns.push(leaf(gridField(null, m.key), m.label, m));
  } else if (measures.length === 1) {
    /* One figure: the pivot value IS the column header. A group header
       repeating the same measure name under every column would be noise. */
    const m = measures[0];
    result.pivots.forEach((p, pi) => {
      columns.push({ ...leaf(gridField(pi, m.key), p, m), ...(m.width ? {} : { minWidth: Math.max(88, p.length * 8 + 28) }) });
    });
  } else {
    result.pivots.forEach((p, pi) => {
      columns.push({ header: p, children: measures.map((m) => leaf(gridField(pi, m.key), m.label, m)) });
    });
  }

  const toRow = (group: string, cells: CellMap, extra: GridRow = {}): GridRow => {
    const row: GridRow = { [GROUP_FIELD]: group, ...extra };
    if (result.pivots.length === 0) {
      for (const m of measures) row[gridField(null, m.key)] = round(cells[cellKey(null, m.key)]);
    } else {
      result.pivots.forEach((p, pi) => {
        for (const m of measures) row[gridField(pi, m.key)] = round(cells[cellKey(p, m.key)]);
      });
    }
    return row;
  };

  const rows = result.groups.map((g, i) => toRow(g, result.cells[i]));
  if (result.total) rows.unshift(toRow(opts.totalLabel ?? "Total", result.total, { _bold: true }));
  return { columns, rows };
}

/** The data behind a category chart as a grid: one row per category, one
 *  column per series. Shown under the chart when a panel is expanded. */
export function seriesToGrid(
  header: string,
  categories: string[],
  series: { name: string; data: (number | null)[] }[],
  kind: GridColumnKind = "number",
): { columns: GridColumn[]; rows: GridRow[] } {
  return {
    columns: [{ field: GROUP_FIELD, header, flex: 2, minWidth: 140 }, ...series.map((s, i) => ({ field: `s${i}`, header: s.name, kind, signed: true }))],
    rows: categories.map((c, r) => {
      const row: GridRow = { [GROUP_FIELD]: c };
      series.forEach((s, i) => { row[`s${i}`] = s.data[r] ?? null; });
      return row;
    }),
  };
}

/** The parts of a pie / donut as a grid: part, value, share. */
export function partsToGrid(header: string, parts: { name: string; y: number }[], valueColumn: GridLeafColumn): { columns: GridColumn[]; rows: GridRow[] } {
  const total = parts.reduce((a, p) => a + p.y, 0);
  return {
    columns: [
      { field: GROUP_FIELD, header, flex: 2, minWidth: 140 },
      { ...valueColumn, field: "value" },
      { field: "share", header: "Share", kind: "percent" },
    ],
    rows: parts.map((p) => ({ [GROUP_FIELD]: p.name, value: p.y, share: total ? Number(((p.y / total) * 100).toFixed(4)) : null })),
  };
}
