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

/* The six semantic buckets a status/stage pill can resolve to. Each DS maps
   these onto its own native tag palette (see carbonTagType / muiChipColor /
   tagColor / the uoaui badge map, all keyed off this union), so the funnel
   reads as a progression in every system, not a wall of grey. */
export type StatusClass = "success" | "warning" | "neutral" | "info" | "indigo" | "error";

/* CRM lifecycle funnel, cool -> warm = closer to won. Matched on the EXACT
   normalised value so only real lifecycle stages map; any other string still
   falls through to the generic POSITIVE / WARNING / NEGATIVE sets below, then
   neutral. Both the spelled-out and abbreviated forms are recognised. */
const STAGE: Record<string, StatusClass> = {
  "lead": "neutral",
  "marketing qualified lead": "info",
  "mql": "info",
  "sales qualified lead": "indigo",
  "sql": "indigo",
  "opportunity": "warning",
  "customer": "success",
};

const POSITIVE = new Set([
  "active", "success", "paid", "healthy", "online", "done",
  "complete", "completed", "approved", "open", "won", "live", "subscribed",
]);
const WARNING = new Set([
  "pending", "warning", "in progress", "at risk", "review", "overdue", "hold", "draft",
]);
/* Hard-negative states (a refund, a lost deal, a churned account). Previously
   these fell through to neutral grey, reading the same as a brand-new lead. */
const NEGATIVE = new Set([
  "refunded", "failed", "churned", "cancelled", "canceled", "lost",
  "rejected", "declined", "expired", "suspended", "blocked", "inactive", "offline",
]);

export function statusToClass(status: unknown): StatusClass {
  const s = String(status ?? "").trim().toLowerCase();
  if (s in STAGE) return STAGE[s];
  if (NEGATIVE.has(s)) return "error";
  if (POSITIVE.has(s)) return "success";
  if (WARNING.has(s)) return "warning";
  return "neutral";
}
