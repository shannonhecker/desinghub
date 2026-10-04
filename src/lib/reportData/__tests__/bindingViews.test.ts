/* The binding views added for the Sustainable Investment reports: record
   grids, single values, signed parts with a sum, ranks, and selections made
   from a chart. */
import { describe, it, expect } from "vitest";
import { resolveBinding, nextSelection, type DataBinding } from "../binding";
import type { ReportDataset } from "../types";

const dataset: ReportDataset = {
  id: "t",
  label: "T",
  baseCurrency: "GBP",
  tables: [
    {
      id: "securities",
      label: "Securities",
      grain: "One row per security",
      fields: [
        { key: "name", label: "Security", role: "dimension" },
        { key: "country", label: "Country", role: "dimension" },
        { key: "stage", label: "Stage", role: "dimension" },
        { key: "value", label: "Value", role: "measure", format: "currency" },
        { key: "score", label: "Score", role: "measure" },
        { key: "trend", label: "Trend", role: "dimension" },
      ],
      rows: [
        { name: "Alpha", country: "GB", stage: "House", value: 100, score: 8, trend: "1,2,3" },
        { name: "Beta", country: "US", stage: "Target", value: 300, score: 4, trend: "3,2,1" },
        { name: "Gamma", country: "FR", stage: "Target", value: 200, score: 6, trend: "2,2,2" },
      ],
    },
    {
      id: "funnel",
      label: "Funnel",
      grain: "One row per step",
      fields: [{ key: "step", label: "Step", role: "dimension" }, { key: "count", label: "Count", role: "measure" }],
      rows: [{ step: "Universe", count: 10 }, { step: "House", count: -4 }, { step: "Other", count: -3 }],
    },
    { id: "fx", label: "FX", grain: "One row per currency", fields: [{ key: "currency", label: "Currency", role: "dimension" }, { key: "rate", label: "Rate", role: "measure" }], rows: [{ currency: "USD", rate: 2 }] },
  ],
};

const records: DataBinding = {
  table: "securities",
  view: "records",
  measures: [],
  display: [],
  records: [
    { field: "name", label: "Security" },
    { field: "country", label: "Country", cell: { type: "flag" } },
    { field: "value", label: "Value", kind: "currency", money: true },
    { field: "score", label: "Score", kind: "number", cell: { type: "heat" } },
    { field: "delta", label: "Change", kind: "percent", cell: { type: "delta", sparkField: "trend" } },
  ],
  filters: [{ field: "stage", state: "select:stage", ignore: ["Universe"] }],
  sort: { by: "value", dir: "desc" },
  selectState: "select:security",
};

describe("records view", () => {
  it("lists the table's rows with the binding's columns, sorted, carrying the cells", () => {
    const b = resolveBinding(records, dataset, {});
    if (b?.view !== "grid") throw new Error("expected a grid");
    expect(b.rows.map((r) => r.name)).toEqual(["Beta", "Gamma", "Alpha"]);
    expect(b.columns.map((c) => ("field" in c ? c.field : c.header))).toEqual(["name", "country", "value", "score", "delta"]);
    expect(b.columns[1]).toMatchObject({ cell: { type: "flag" } });
    /* The sparkline a delta cell reads travels with the row. */
    expect(b.rows[0].trend).toBe("3,2,1");
    expect(b.selectState).toBe("select:security");
  });

  it("filters by report state, converts money, numbers the rows when ranked", () => {
    const b = resolveBinding({ ...records, rank: true }, dataset, { "select:stage": "Target", currency: "USD" });
    if (b?.view !== "grid") throw new Error("expected a grid");
    expect(b.rows.map((r) => [r._rank, r.name, r.value])).toEqual([[1, "Beta", 600], [2, "Gamma", 400]]);
    expect(b.columns[0]).toMatchObject({ field: "_rank", header: "#" });
    expect(b.columns[3]).toMatchObject({ field: "value", currency: "USD" });
  });

  it("a state value that means everything is not a filter", () => {
    const b = resolveBinding(records, dataset, { "select:stage": "Universe" });
    expect(b?.view === "grid" && b.rows.length).toBe(3);
  });
});

describe("value view", () => {
  it("is one figure over the rows that pass the filters", () => {
    const binding: DataBinding = {
      table: "securities", view: "value",
      measures: [{ field: "score", agg: "wavg", weight: "value" }],
      display: [{ key: "score", label: "Score" }],
      filters: [{ field: "stage", state: "select:stage" }],
    };
    expect(resolveBinding(binding, dataset, {})).toEqual({ view: "value", value: 5.3333 });
    expect(resolveBinding(binding, dataset, { "select:stage": "House" })).toEqual({ view: "value", value: 8 });
  });
});

describe("parts for a waterfall", () => {
  const funnel: DataBinding = {
    table: "funnel", view: "parts", groupBy: "step",
    measures: [{ field: "count" }], display: [{ key: "count", label: "Count" }],
    signedParts: true, sumPart: "Target", selectState: "select:stage", selectClears: ["Universe", "Target"],
  };
  it("keeps the steps down and closes with a sum", () => {
    const b = resolveBinding(funnel, dataset, { "select:stage": "House" });
    if (b?.view !== "parts") throw new Error("expected parts");
    expect(b.seriesData).toEqual([{ name: "Universe", y: 10 }, { name: "House", y: -4 }, { name: "Other", y: -3 }, { name: "Target", y: 0, isSum: true }]);
    expect(b.selected).toBe("House");
  });
  it("without signedParts a pie still drops what it cannot draw", () => {
    const b = resolveBinding({ ...funnel, signedParts: false, sumPart: undefined }, dataset, {});
    expect(b?.view === "parts" && b.seriesData.map((p) => p.name)).toEqual(["Universe"]);
  });
});

describe("nextSelection", () => {
  it("selects a label, and clears on the same label or one that means everything", () => {
    expect(nextSelection({ selected: undefined }, "House")).toBe("House");
    expect(nextSelection({ selected: "House" }, "House")).toBeNull();
    expect(nextSelection({ selected: "House", selectClears: ["Universe"] }, "Universe")).toBeNull();
    expect(nextSelection({}, "")).toBeNull();
  });
});
