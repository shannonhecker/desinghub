import { describe, it, expect } from "vitest";
import { datasetToSheets, sheetsToDataset, parseNumber, GUIDE_SHEET, MAX_ROWS_PER_TABLE, type SheetCell } from "../workbook";
import { financeDataset } from "../financeDataset";
import { tableOf, type ReportDataset } from "../types";

const base: ReportDataset = {
  id: "t", label: "Test", baseCurrency: "GBP",
  tables: [
    {
      id: "holdings", label: "Holdings", grain: "One row per holding",
      fields: [
        { key: "fund", label: "Fund", role: "dimension" },
        { key: "assetClass", label: "Asset class", role: "dimension" },
        { key: "marketValue", label: "Market value", role: "measure", format: "currency" },
      ],
      rows: [{ fund: "Sample", assetClass: "Equity", marketValue: 100 }],
    },
    { id: "fx", label: "FX rates", grain: "", fields: [{ key: "currency", label: "Currency", role: "dimension" }, { key: "rate", label: "Rate", role: "measure" }], rows: [{ currency: "GBP", rate: 1 }] },
  ],
};
const sheet = (name: string, ...rows: SheetCell[][]) => ({ sheet: name, data: rows });

describe("parseNumber", () => {
  it("reads plain numbers and common spreadsheet text forms", () => {
    expect(parseNumber(12.5)).toBe(12.5);
    expect(parseNumber("1,234.50")).toBe(1234.5);
    expect(parseNumber("4.5%")).toBe(4.5);
    expect(parseNumber("£1,200")).toBe(1200);
    expect(parseNumber("US$9.5")).toBe(9.5);
    expect(parseNumber("(120)")).toBe(-120);
    expect(parseNumber("-0.4")).toBe(-0.4);
    expect(parseNumber(0)).toBe(0);
  });
  it("returns null for blanks and for text that is not a number", () => {
    for (const v of ["", "  ", "n/a", "12abc", "£1.2m", null, undefined, true, new Date(0)]) expect(parseNumber(v as SheetCell), String(v)).toBeNull();
  });
});

describe("datasetToSheets", () => {
  const sheets = datasetToSheets(financeDataset());
  it("writes a guide sheet then one sheet per table, with the labels as headers", () => {
    expect(sheets[0].name).toBe(GUIDE_SHEET);
    expect(sheets.slice(1).map((s) => s.name)).toEqual(financeDataset().tables.map((t) => t.label));
    const holdings = sheets.find((s) => s.name === "Holdings")!;
    expect(holdings.rows[0].slice(0, 3)).toEqual(["Security", "Issuer", "Fund"]);
    expect(holdings.rows).toHaveLength(tableOf(financeDataset(), "holdings")!.rows.length + 1);
  });
  it("the guide lists every column of every table", () => {
    const text = sheets[0].rows.flat().join("|");
    for (const t of financeDataset().tables) for (const f of t.fields) expect(text, `${t.id}.${f.key}`).toContain(f.label);
  });
  it("sheet names fit Excel's 31-character limit and are unique", () => {
    const names = sheets.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
    for (const n of names) expect(n.length).toBeLessThanOrEqual(31);
  });
});

describe("sheetsToDataset", () => {
  it("round-trips the sample dataset unchanged", () => {
    const ds = financeDataset();
    const sheets = datasetToSheets(ds).map((s) => ({ sheet: s.name, data: s.rows }));
    const result = sheetsToDataset(ds, sheets);
    expect(result.issues).toEqual([]);
    expect(result.imported.map((i) => i.table)).toEqual(ds.tables.map((t) => t.label));
    expect(result.dataset).toEqual(ds);
  });

  it("takes the user's rows, matching headers by label or key in any order and case", () => {
    const r = sheetsToDataset(base, [sheet("holdings", ["MARKET VALUE", "fund", "asset_class"], ["1,500", " Alpha ", "Bonds"], [250, "Beta", "Equity"])]);
    expect(r.issues).toEqual([]);
    expect(tableOf(r.dataset!, "holdings")!.rows).toEqual([
      { marketValue: 1500, fund: "Alpha", assetClass: "Bonds" },
      { marketValue: 250, fund: "Beta", assetClass: "Equity" },
    ]);
    expect(r.imported).toEqual([{ table: "Holdings", rows: 2 }]);
  });

  it("a sheet left out keeps the sample data", () => {
    const r = sheetsToDataset(base, [sheet("Holdings", ["Fund", "Asset class", "Market value"], ["A", "Equity", 1])]);
    expect(tableOf(r.dataset!, "fx")!.rows).toEqual(base.tables[1].rows);
  });

  it("ignores blank rows and keeps zero", () => {
    const r = sheetsToDataset(base, [sheet("Holdings", ["Fund", "Asset class", "Market value"], ["A", "Equity", 0], [null, "", null], ["B", "Bonds", 5])]);
    expect(tableOf(r.dataset!, "holdings")!.rows.map((x) => x.marketValue)).toEqual([0, 5]);
  });

  it("a missing required column is an error and the sample table is kept", () => {
    const r = sheetsToDataset(base, [sheet("Holdings", ["Fund", "Market value"], ["A", 1]), sheet("FX rates", ["Currency", "Rate"], ["USD", 1.3])]);
    expect(r.issues).toContainEqual({ level: "error", sheet: "Holdings", message: "Missing column: Asset class." });
    expect(tableOf(r.dataset!, "holdings")!.rows).toEqual(base.tables[0].rows);
    expect(r.imported).toEqual([{ table: "FX rates", rows: 1 }]);
  });

  it("unreadable numbers are left blank and reported, not turned into zero", () => {
    const r = sheetsToDataset(base, [sheet("Holdings", ["Fund", "Asset class", "Market value"], ["A", "Equity", "n/a"], ["B", "Bonds", 7])]);
    expect(tableOf(r.dataset!, "holdings")!.rows[0].marketValue).toBeNull();
    expect(r.issues[0]).toMatchObject({ level: "warning", sheet: "Holdings" });
    expect(r.issues[0].message).toMatch(/1 cell in number columns/);
  });

  it("a new column is added: numbers as a figure, text as something to group by", () => {
    const r = sheetsToDataset(base, [
      sheet("Holdings", ["Fund", "Asset class", "Market value", "Risk rating", "Duration (yrs)"], ["A", "Equity", 1, "High", 4.2], ["B", "Bonds", 2, "Low", "6.1"]),
    ]);
    const t = tableOf(r.dataset!, "holdings")!;
    expect(t.fields.slice(3)).toEqual([
      { key: "riskRating", label: "Risk rating", role: "dimension" },
      { key: "durationYrs", label: "Duration (yrs)", role: "measure" },
    ]);
    expect(t.rows[1]).toMatchObject({ riskRating: "Low", durationYrs: 6.1 });
    expect(r.issues.filter((i) => i.level === "warning")).toHaveLength(2);
  });

  it("rejects an oversized sheet", () => {
    const rows: SheetCell[][] = Array.from({ length: MAX_ROWS_PER_TABLE + 1 }, (_, i) => [`F${i}`, "Equity", i]);
    const r = sheetsToDataset(base, [sheet("Holdings", ["Fund", "Asset class", "Market value"], ...rows)]);
    expect(r.dataset).toBeNull();
    expect(r.issues[0].message).toMatch(/Too many rows/);
  });

  it("a workbook with no matching sheet imports nothing and says what was expected", () => {
    const r = sheetsToDataset(base, [sheet("Sheet1", ["a"], [1])]);
    expect(r.dataset).toBeNull();
    expect(r.issues.map((i) => i.level)).toEqual(["warning", "error"]);
    expect(r.issues[1].message).toContain("Holdings, FX rates");
  });

  it("dates in a text column become ISO dates; header-only and empty sheets are errors", () => {
    const dated = sheetsToDataset(base, [sheet("Holdings", ["Fund", "Asset class", "Market value"], [new Date(Date.UTC(2024, 11, 31)), "Equity", 1])]);
    expect(tableOf(dated.dataset!, "holdings")!.rows[0].fund).toBe("2024-12-31");
    expect(sheetsToDataset(base, [sheet("Holdings", ["Fund", "Asset class", "Market value"])]).issues[0].message).toBe("No data rows.");
    expect(sheetsToDataset(base, [sheet("Holdings", [])]).issues[0].message).toBe("The first row must be the column headers.");
  });
});
