import { describe, it, expect } from "vitest";
import { resolveRecord, isRecordBinding, type RecordBinding } from "../recordPanelModel";
import type { ReportDataset } from "../reportData/types";

const dataset: ReportDataset = {
  id: "t", label: "T", baseCurrency: "GBP",
  tables: [
    {
      id: "securities", label: "Securities", grain: "One row per security", fields: [],
      rows: [
        { name: "Alpha Plc", country: "GB", sector: "Energy", rating: "AA", value: 1_500_000, s1Start: 120, s1End: 150, eStart: 5.5, eEnd: 6.25, ghg: "10, 12, 15" },
        { name: "Beta Inc", country: "US", sector: "Tech", rating: "CCC", value: 10, s1Start: 9, s1End: 9, eStart: 2, eEnd: 1, ghg: "" },
      ],
    },
    { id: "fx", label: "FX", grain: "", fields: [], rows: [{ currency: "USD", rate: 2 }] },
  ],
};

const binding: RecordBinding = {
  table: "securities", keyField: "name", state: "select:security",
  sections: [
    { type: "pairs", items: [
      { label: "Country of risk", field: "country", as: "flag" },
      { label: "Sector", field: "sector" },
      { label: "Rating", field: "rating", as: "badge" },
      { label: "Market value", field: "value", kind: "currency", compact: true, money: true },
    ] },
    { type: "table", title: "Climate", columns: ["Start", "End"], rows: [{ label: "Scope 1", fields: ["s1Start", "s1End"], change: { from: "s1Start", to: "s1End", upIsGood: false } }] },
    { type: "table", title: "ESG", columns: ["Start", "End"], decimals: 2, rows: [{ label: "E score", fields: ["eStart", "eEnd"], change: { from: "eStart", to: "eEnd" } }] },
    { type: "trend", title: "GHG emissions", field: "ghg", categories: ["Jan", "Feb", "Mar"] },
  ],
};

describe("resolveRecord", () => {
  it("is null until a record is selected, and for a selection the table does not have", () => {
    expect(resolveRecord(binding, dataset, {})).toBeNull();
    expect(resolveRecord(binding, dataset, { "select:security": "Nobody" })).toBeNull();
  });

  it("lays the selected record out as pairs, tables and a trend", () => {
    const r = resolveRecord(binding, dataset, { "select:security": "Alpha Plc" })!;
    expect(r.title).toBe("Alpha Plc");
    expect(r.sections[0]).toEqual({ type: "pairs", items: [
      { label: "Country of risk", text: "GB", flag: "🇬🇧" },
      { label: "Sector", text: "Energy" },
      { label: "Rating", text: "AA", tone: "good" },
      { label: "Market value", text: "£1.50m" },
    ] });
    /* Emissions up is bad; a score up is good. */
    expect(r.sections[1]).toEqual({ type: "table", title: "Climate", columns: ["Start", "End"], rows: [{ label: "Scope 1", cells: ["120", "150"], change: { direction: "up", tone: "bad", magnitude: 30 } }] });
    expect(r.sections[2]).toMatchObject({ rows: [{ cells: ["5.50", "6.25"], change: { direction: "up", tone: "good" } }] });
    expect(r.sections[3]).toEqual({ type: "trend", title: "GHG emissions", categories: ["Jan", "Feb", "Mar"], points: [10, 12, 15], seriesName: "GHG emissions" });
  });

  it("converts money to the selected currency and copes with an empty trend", () => {
    const r = resolveRecord(binding, dataset, { "select:security": "Beta Inc", currency: "USD" })!;
    expect((r.sections[0] as { items: { text: string; tone?: string }[] }).items[3].text).toBe("US$20.00");
    expect((r.sections[0] as { items: { tone?: string }[] }).items[2].tone).toBe("bad");
    expect(r.sections[1]).toMatchObject({ rows: [{ change: { direction: "flat" } }] });
    expect(r.sections[3]).toMatchObject({ points: [], categories: [] });
  });

  it("recognises a record binding", () => {
    expect(isRecordBinding(binding)).toBe(true);
    expect(isRecordBinding({ table: "x" })).toBe(false);
    expect(isRecordBinding(null)).toBe(false);
  });
});
