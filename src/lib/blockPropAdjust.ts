/* Panel controls that every design system honours because they are applied
   once, before a block's props reach any renderer (the five real systems and
   the Simulated fallback alike). Each adjustment is a no-op on a block that
   has not set its control, so a block's default output never changes. */

import { DEFAULT_TABLE_COLUMNS, DEFAULT_TABLE_ROWS } from "@/lib/tableData";
import { resolveCell } from "@/lib/tableCells";

/** Data table: `maxRows` caps the rows shown; `hiddenColumnsCsv` names
 *  columns to leave out (case-insensitive). */
export function adjustTableProps(props: Record<string, unknown>): Record<string, unknown> {
  const maxRows = Number(props.maxRows);
  const hidden = typeof props.hiddenColumnsCsv === "string"
    ? props.hiddenColumnsCsv.split(",").map((c) => c.trim().toLowerCase()).filter(Boolean)
    : [];
  const capRows = Number.isFinite(maxRows) && maxRows > 0;
  if (!capRows && hidden.length === 0) return props;

  const columns = Array.isArray(props.columns) ? (props.columns as string[]) : [...DEFAULT_TABLE_COLUMNS];
  let rows = Array.isArray(props.rows) ? (props.rows as unknown[]) : DEFAULT_TABLE_ROWS.map((r) => [...r]);
  if (capRows) rows = rows.slice(0, Math.floor(maxRows));

  if (hidden.length === 0) return { ...props, rows };
  const kept = columns.filter((c) => !hidden.includes(String(c).toLowerCase()));
  /* Never hide every column: an empty table reads as a broken block. */
  if (kept.length === 0) return { ...props, rows };
  /* Cells resolve by header name (or position), so re-key each row by its
     column before dropping columns; positions would shift otherwise. */
  const keyed = rows.map((row) => Object.fromEntries(columns.map((c, i) => [c, resolveCell(row, c, i)])));
  return { ...props, columns: kept, rows: keyed };
}

/** Applies the adjustment for `type`, or returns `props` unchanged. */
export function adjustBlockProps(type: string, props: Record<string, unknown>): Record<string, unknown> {
  if (type === "SimulatedDataTable") return adjustTableProps(props);
  return props;
}
