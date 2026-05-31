/* ── Generic data-table cell resolution ──
 *
 *  The Simulated / exported data table must render ANY domain shape the model
 *  emits, not just the legacy {name,status,role,date} roster. `columns` are
 *  the headers; a `row` may be:
 *    - an object keyed by the column headers  ({ "Plant": "Fern", ... })
 *    - the legacy positional object           ({ name, status, role, date })
 *    - a plain array                          (["Fern", "2d", "Healthy"])
 *
 *  Every value is coerced to a string so a missing/extra field can never crash
 *  the render. (The old code called `row.status.toLowerCase()` directly and
 *  threw "Cannot read properties of undefined" the moment the model passed a
 *  domain row without a `status` field, taking down the whole builder page.) */

export type TableRow = Record<string, unknown> | ReadonlyArray<unknown> | unknown;

/* Used only as a last-resort fallback so older {name,status,role,date} rows
   still line up under arbitrary column headers by position. */
const LEGACY_FIELDS = ["name", "status", "role", "date"];

function stringify(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object") return "";
  return String(v);
}

export function resolveCell(row: TableRow, column: string, index: number): string {
  if (row == null) return "";
  if (Array.isArray(row)) return stringify(row[index]);
  if (typeof row === "object") {
    const obj = row as Record<string, unknown>;
    // 1. exact header key
    if (Object.prototype.hasOwnProperty.call(obj, column)) return stringify(obj[column]);
    // 2. case-insensitive header key
    const lc = column.toLowerCase();
    const ciKey = Object.keys(obj).find((k) => k.toLowerCase() === lc);
    if (ciKey) return stringify(obj[ciKey]);
    // 3. legacy positional field name
    const legacy = LEGACY_FIELDS[index];
    if (legacy && Object.prototype.hasOwnProperty.call(obj, legacy)) return stringify(obj[legacy]);
    // 4. positional over the object's own values
    return stringify(Object.values(obj)[index]);
  }
  // primitive row maps to the first column only
  return index === 0 ? stringify(row) : "";
}

export function isStatusColumn(column: string): boolean {
  const c = column.trim().toLowerCase();
  return c === "status" || c === "stage" || c === "state";
}

const POSITIVE = new Set([
  "active", "success", "paid", "healthy", "online", "done",
  "complete", "completed", "approved", "open", "won", "live",
]);
const WARNING = new Set([
  "pending", "warning", "in progress", "at risk", "review", "overdue", "hold", "draft",
]);

export function statusToClass(status: unknown): "success" | "warning" | "neutral" {
  const s = String(status ?? "").trim().toLowerCase();
  if (POSITIVE.has(s)) return "success";
  if (WARNING.has(s)) return "warning";
  return "neutral";
}
