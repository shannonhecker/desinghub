/**
 * workbook - a report dataset as an Excel workbook, and back.
 *
 * Download: one sheet per table (the sample data, as a filled-in example)
 * plus a Guide sheet that says what each sheet and column is. Upload: the
 * same workbook with the user's real figures, read tolerantly and validated,
 * so a client demo can run on real data.
 *
 * The functions here are pure (sheets in, dataset out). The file reading and
 * writing live in workbookFile.ts, which lazy-loads the xlsx libraries.
 */

import type { DataField, DataRow, DataTable, DataValue, ReportDataset } from "./types";

export type SheetCell = string | number | boolean | Date | null | undefined;

export interface WorkbookSheet {
  /** Sheet (tab) name. */
  name: string;
  /** Rows of cells; the first row is the header. */
  rows: SheetCell[][];
  /** Column widths, in characters. */
  widths?: number[];
}

export const GUIDE_SHEET = "Guide";
/** Excel's limit on a sheet name. */
const SHEET_NAME_MAX = 31;
/** Upload limits: keep a pasted export from freezing the browser tab or
 *  overflowing the session's local storage. */
export const MAX_ROWS_PER_TABLE = 20_000;
export const MAX_COLUMNS_PER_TABLE = 60;

const sheetName = (table: DataTable): string => table.label.slice(0, SHEET_NAME_MAX);

/* ── Dataset -> sheets ─────────────────────────────────────── */

export function datasetToSheets(dataset: ReportDataset): WorkbookSheet[] {
  const guide: SheetCell[][] = [
    [`${dataset.label} data template`],
    ["Replace the example rows on each sheet with your own data, then upload this file to see the report on your figures."],
    [],
    ["How it works"],
    ["1. Each sheet is one table. Keep the sheet names and the header row as they are."],
    ["2. Add as many rows as you need. Blank rows are ignored."],
    ["3. Text columns group and filter the report. Number columns are the figures that get added up or averaged."],
    [`4. Money is in ${dataset.baseCurrency}. Percentages are plain numbers: write 4.5 for 4.5%.`],
    ["5. You can add your own columns. A new text column becomes something you can group by; a new number column becomes a figure."],
    ["6. A sheet you leave out keeps the example data."],
    [],
    ["Sheet", "Column", "Type", "What it is"],
  ];
  for (const t of dataset.tables) {
    guide.push([sheetName(t), "", "", t.grain]);
    for (const f of t.fields) {
      guide.push(["", f.label, f.role === "measure" ? `Number${f.format === "percent" ? " (percent)" : f.format === "currency" ? " (money)" : ""}` : "Text", f.help ?? ""]);
    }
  }

  const sheets: WorkbookSheet[] = [{ name: GUIDE_SHEET, rows: guide, widths: [26, 26, 18, 80] }];
  for (const t of dataset.tables) {
    sheets.push({
      name: sheetName(t),
      rows: [t.fields.map((f) => f.label), ...t.rows.map((r) => t.fields.map((f) => r[f.key] ?? null))],
      widths: t.fields.map((f) => Math.min(40, Math.max(12, f.label.length + 4, f.role === "dimension" ? 18 : 14))),
    });
  }
  return sheets;
}

/* ── Sheets -> dataset ─────────────────────────────────────── */

export interface WorkbookIssue {
  level: "error" | "warning";
  /** Sheet the issue is about; omitted for file-level issues. */
  sheet?: string;
  message: string;
}

export interface WorkbookImport {
  /** The dataset to use: uploaded tables where they were valid, the base
   *  (sample) tables otherwise. null when nothing usable was found. */
  dataset: ReportDataset | null;
  issues: WorkbookIssue[];
  /** Tables taken from the upload, with their row counts. */
  imported: { table: string; rows: number }[];
}

const norm = (v: unknown): string => String(v ?? "").trim().toLowerCase().replace(/[\s_\-]+/g, " ");

/** A stable key for a column the template does not know: "Risk rating" -> riskRating. */
function keyFromHeader(header: string, taken: Set<string>): string {
  const words = header.trim().replace(/[^A-Za-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
  let key = words.map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase())).join("") || "column";
  if (/^[0-9]/.test(key)) key = `c${key}`;
  let unique = key;
  for (let i = 2; taken.has(unique); i++) unique = `${key}${i}`;
  return unique;
}

/** Read a cell as a number: plain numbers, and text such as "1,234.50",
 *  "£1.2m" is NOT expanded (ambiguous) but "4.5%", "(120)" and "£1,200" are. */
export function parseNumber(v: SheetCell): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "boolean" || v instanceof Date || v === null || v === undefined) return null;
  let s = v.trim();
  if (!s) return null;
  const negative = /^\(.*\)$/.test(s);
  if (negative) s = s.slice(1, -1);
  s = s.replace(/[,\s%]/g, "").replace(/^[£$€¥]|^[A-Z]{1,3}\$?(?=[-\d.])/, "");
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? (negative ? -n : n) : null;
}

const toText = (v: SheetCell): string | null => {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  return s === "" ? null : s;
};

function importTable(base: DataTable, data: SheetCell[][], issues: WorkbookIssue[]): DataTable | null {
  const sheet = sheetName(base);
  const header = (data[0] ?? []).map((h) => String(h ?? "").trim());
  if (header.every((h) => h === "")) {
    issues.push({ level: "error", sheet, message: "The first row must be the column headers." });
    return null;
  }
  if (header.length > MAX_COLUMNS_PER_TABLE) {
    issues.push({ level: "error", sheet, message: `Too many columns (${header.length}). The limit is ${MAX_COLUMNS_PER_TABLE}.` });
    return null;
  }

  /* Match headers to the template's fields by label or key. */
  const byName = new Map<string, DataField>();
  for (const f of base.fields) {
    byName.set(norm(f.label), f);
    byName.set(norm(f.key), f);
  }
  const taken = new Set(base.fields.map((f) => f.key));
  const columns: { index: number; field: DataField; known: boolean }[] = [];
  const seen = new Set<string>();
  header.forEach((h, index) => {
    if (!h) return;
    const known = byName.get(norm(h));
    if (known) {
      if (seen.has(known.key)) {
        issues.push({ level: "warning", sheet, message: `Column "${h}" appears twice; the first one is used.` });
        return;
      }
      seen.add(known.key);
      columns.push({ index, field: known, known: true });
    } else {
      const key = keyFromHeader(h, taken);
      taken.add(key);
      columns.push({ index, field: { key, label: h, role: "dimension" }, known: false });
    }
  });

  const missing = base.fields.filter((f) => !seen.has(f.key));
  if (missing.length) {
    issues.push({ level: "error", sheet, message: `Missing column${missing.length > 1 ? "s" : ""}: ${missing.map((f) => f.label).join(", ")}.` });
    return null;
  }

  const body = data.slice(1).filter((r) => r.some((c) => toText(c) !== null));
  if (body.length === 0) {
    issues.push({ level: "error", sheet, message: "No data rows." });
    return null;
  }
  if (body.length > MAX_ROWS_PER_TABLE) {
    issues.push({ level: "error", sheet, message: `Too many rows (${body.length.toLocaleString("en-GB")}). The limit is ${MAX_ROWS_PER_TABLE.toLocaleString("en-GB")}.` });
    return null;
  }

  /* A column the template does not know is a number column when nearly all
     of its filled cells read as numbers; otherwise it is text. */
  for (const c of columns) {
    if (c.known) continue;
    const filled = body.map((r) => r[c.index]).filter((v) => toText(v) !== null);
    const numeric = filled.filter((v) => parseNumber(v) !== null).length;
    if (filled.length > 0 && numeric / filled.length >= 0.9) c.field = { ...c.field, role: "measure" };
    issues.push({ level: "warning", sheet, message: `New column "${c.field.label}" added as a ${c.field.role === "measure" ? "number" : "text"} column.` });
  }

  let badNumbers = 0;
  const rows: DataRow[] = body.map((r) => {
    const row: DataRow = {};
    for (const c of columns) {
      const cell = r[c.index];
      let value: DataValue;
      if (c.field.role === "measure") {
        value = parseNumber(cell);
        if (value === null && toText(cell) !== null) badNumbers++;
      } else {
        value = toText(cell);
      }
      row[c.field.key] = value;
    }
    return row;
  });
  if (badNumbers > 0) {
    issues.push({ level: "warning", sheet, message: `${badNumbers} cell${badNumbers > 1 ? "s" : ""} in number columns could not be read as numbers and were left blank.` });
  }

  /* Template fields first, in template order; new columns after. */
  const fields = [...base.fields, ...columns.filter((c) => !c.known).map((c) => c.field)];
  return { ...base, fields, rows };
}

/** Build a dataset from uploaded sheets, against the template's dataset.
 *  A table whose sheet is missing or invalid keeps the template's data. */
export function sheetsToDataset(base: ReportDataset, sheets: { sheet: string; data: SheetCell[][] }[]): WorkbookImport {
  const issues: WorkbookIssue[] = [];
  const imported: WorkbookImport["imported"] = [];
  const bySheet = new Map(sheets.map((s) => [norm(s.sheet), s.data]));

  const tables = base.tables.map((t) => {
    const data = bySheet.get(norm(sheetName(t))) ?? bySheet.get(norm(t.id));
    if (!data) return t;
    const table = importTable(t, data, issues);
    if (!table) return t;
    imported.push({ table: t.label, rows: table.rows.length });
    return table;
  });

  const known = new Set([norm(GUIDE_SHEET), ...base.tables.flatMap((t) => [norm(sheetName(t)), norm(t.id)])]);
  for (const s of sheets) {
    if (!known.has(norm(s.sheet))) issues.push({ level: "warning", sheet: s.sheet, message: "This sheet is not part of the template and was ignored." });
  }

  if (imported.length === 0) {
    if (!issues.some((i) => i.level === "error")) {
      issues.push({ level: "error", message: `No sheet matched the template. Expected sheets named: ${base.tables.map(sheetName).join(", ")}.` });
    }
    return { dataset: null, issues, imported };
  }
  return { dataset: { ...base, tables }, issues, imported };
}
