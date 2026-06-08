/* ════════════════════════════════════════════════════════════
   Data-table data model — sanitize + shared defaults.
   ════════════════════════════════════════════════════════════
   sanitizeGeneratedTable is the side-effect-free core that turns
   untrusted AI (or pasted) table output into a safe, bounded
   {columns, rows} shape before it's written to a block and rendered
   into the DOM. DEFAULT_TABLE_* are the single source of sample
   data shared by BOTH the edit renderer and the preview renderers,
   so a fresh table is useful immediately and edit == preview.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import {
  sanitizeGeneratedTable,
  DEFAULT_TABLE_COLUMNS,
  DEFAULT_TABLE_ROWS,
  MAX_TABLE_COLUMNS,
  MAX_TABLE_ROWS,
} from "../tableData";

describe("sanitizeGeneratedTable", () => {
  it("accepts a well-formed columns + array-rows payload", () => {
    const r = sanitizeGeneratedTable({
      columns: ["Name", "Status"],
      rows: [["Ava", "Active"], ["Sam", "Away"]],
    });
    expect(r).toEqual({ columns: ["Name", "Status"], rows: [["Ava", "Active"], ["Sam", "Away"]] });
  });

  it("returns null when there are no usable columns (caller falls back to defaults)", () => {
    expect(sanitizeGeneratedTable({ rows: [["x"]] })).toBeNull();
    expect(sanitizeGeneratedTable({ columns: [] })).toBeNull();
    expect(sanitizeGeneratedTable(null)).toBeNull();
    expect(sanitizeGeneratedTable("nope")).toBeNull();
  });

  it("caps columns at MAX_TABLE_COLUMNS", () => {
    const many = Array.from({ length: MAX_TABLE_COLUMNS + 4 }, (_, i) => `C${i}`);
    const r = sanitizeGeneratedTable({ columns: many, rows: [] });
    expect(r?.columns).toHaveLength(MAX_TABLE_COLUMNS);
  });

  it("caps rows at MAX_TABLE_ROWS", () => {
    const rows = Array.from({ length: MAX_TABLE_ROWS + 10 }, (_, i) => [`r${i}`]);
    const r = sanitizeGeneratedTable({ columns: ["A"], rows });
    expect(r?.rows).toHaveLength(MAX_TABLE_ROWS);
  });

  it("coerces non-string cells to strings (numbers, booleans)", () => {
    const r = sanitizeGeneratedTable({ columns: ["N", "Ok"], rows: [[42, true]] });
    expect(r?.rows[0]).toEqual(["42", "true"]);
  });

  it("pads a short row and truncates a long row to the column count", () => {
    const r = sanitizeGeneratedTable({
      columns: ["A", "B", "C"],
      rows: [["only-a"], ["a", "b", "c", "d", "e"]],
    });
    expect(r?.rows[0]).toEqual(["only-a", "", ""]);
    expect(r?.rows[1]).toEqual(["a", "b", "c"]);
  });

  it("maps object-shaped rows by column name (AI sometimes returns objects)", () => {
    const r = sanitizeGeneratedTable({
      columns: ["Name", "Status"],
      rows: [{ Name: "Ava", Status: "Active" }],
    });
    expect(r?.rows[0]).toEqual(["Ava", "Active"]);
  });

  it("trims whitespace and drops blank columns", () => {
    const r = sanitizeGeneratedTable({ columns: ["  Name  ", "   ", "Role"], rows: [] });
    expect(r?.columns).toEqual(["Name", "Role"]);
  });
});

describe("shared table defaults", () => {
  it("ship non-empty sample data so a fresh table is useful (and edit == preview)", () => {
    expect(DEFAULT_TABLE_COLUMNS.length).toBeGreaterThan(0);
    expect(DEFAULT_TABLE_ROWS.length).toBeGreaterThan(0);
  });

  it("every default row matches the default column count", () => {
    for (const row of DEFAULT_TABLE_ROWS) {
      expect(row).toHaveLength(DEFAULT_TABLE_COLUMNS.length);
    }
  });
});
