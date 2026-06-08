/* ════════════════════════════════════════════════════════════
   Data-table data model — sanitize + shared defaults.
   ════════════════════════════════════════════════════════════
   The SimulatedDataTable block stores its data as props.columns
   (string[]) and props.rows (string[][]). Two concerns live here:

   1. DEFAULT_TABLE_* — the single source of sample data. BOTH the
      edit renderer (SimulatedUI) and the preview renderers
      (RealComponentRenderer / realBlockMap) import these, so a
      fresh table is useful immediately and edit == preview (they
      used to hardcode different fallbacks — the edit≠preview bug).

   2. sanitizeGeneratedTable — turns untrusted AI (or pasted) output
      into a bounded, all-strings {columns, rows} before it's written
      to a block and rendered into the DOM. Caps column/row counts
      and cell length, coerces every cell to a trimmed string, and
      normalises both array-rows and object-rows.
   ════════════════════════════════════════════════════════════ */

export const MAX_TABLE_COLUMNS = 6;
export const MAX_TABLE_ROWS = 50;
export const MAX_CELL_LEN = 120;

/** Shared sample data — imported by every table renderer so edit and
    preview agree, and a freshly-added table reads as a real table. */
export const DEFAULT_TABLE_COLUMNS: readonly string[] = ["Name", "Status", "Role"];
export const DEFAULT_TABLE_ROWS: readonly (readonly string[])[] = [
  ["Ava Chen", "Active", "Lead"],
  ["Sam Okoro", "Away", "Engineer"],
  ["Mia Park", "Active", "Designer"],
];

export interface TableData {
  columns: string[];
  rows: string[][];
}

const cell = (v: unknown): string =>
  (typeof v === "string" ? v : String(v ?? "")).trim().slice(0, MAX_CELL_LEN);

/* Sanitize untrusted table data into a safe, bounded shape. Returns
   null when there are no usable columns, so the caller can fall back
   to DEFAULT_TABLE_* rather than render a headless table. */
export function sanitizeGeneratedTable(raw: unknown): TableData | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;

  const columns = Array.isArray(obj.columns)
    ? obj.columns.map(cell).filter((c) => c.length > 0).slice(0, MAX_TABLE_COLUMNS)
    : [];
  if (columns.length === 0) return null;

  const rawRows = Array.isArray(obj.rows) ? obj.rows : [];
  const rows = rawRows.slice(0, MAX_TABLE_ROWS).map((r) => {
    /* Accept array-rows (["Ava","Active"]) and object-rows
       ({Name:"Ava",Status:"Active"}); pad/truncate to column count. */
    const lookup = Array.isArray(r)
      ? (i: number) => r[i]
      : typeof r === "object" && r !== null
        ? (i: number) => (r as Record<string, unknown>)[columns[i]]
        : (i: number) => (i === 0 ? r : undefined);
    return columns.map((_, i) => cell(lookup(i)));
  });

  return { columns, rows };
}
