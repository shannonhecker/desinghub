import { describe, it, expect } from "vitest";
import { formatGridValue, isNegativeCell, leafColumns, readGridColumns, readGridRows, isColumnGroup } from "../dataGridModel";

describe("dataGridModel - formatting", () => {
  it("formats numbers, percents and currency by column kind", () => {
    expect(formatGridValue({ field: "v", header: "V", kind: "number" }, 1234.5)).toBe("1,234.50");
    expect(formatGridValue({ field: "v", header: "V", kind: "number", decimals: 0 }, 1234.5)).toBe("1,235");
    expect(formatGridValue({ field: "v", header: "V", kind: "percent" }, 12.345)).toBe("12.35%");
    expect(formatGridValue({ field: "v", header: "V", kind: "currency" }, 1250000)).toBe("£1,250,000");
    expect(formatGridValue({ field: "v", header: "V", kind: "currency", currency: "USD", decimals: 2 }, 9.5)).toBe("US$9.50");
  });

  it("compact abbreviates large values instead of truncating them", () => {
    expect(formatGridValue({ field: "v", header: "V", kind: "currency", compact: true }, 2_840_000_000)).toBe("£2.84bn");
    expect(formatGridValue({ field: "v", header: "V", kind: "currency", compact: true }, 124_960_000)).toBe("£124.96m");
    expect(formatGridValue({ field: "v", header: "V", kind: "number", compact: true, decimals: 1 }, 15_300)).toBe("15.3k");
  });

  it("keeps zero, and shows nothing for a missing value", () => {
    expect(formatGridValue({ field: "v", header: "V", kind: "percent" }, 0)).toBe("0.00%");
    expect(formatGridValue({ field: "v", header: "V", kind: "number" }, null)).toBe("");
    expect(formatGridValue({ field: "v", header: "V", kind: "number" }, undefined)).toBe("");
    expect(formatGridValue({ field: "v", header: "V" }, "")).toBe("");
  });

  it("passes text through, and non-numeric text in a numeric column", () => {
    expect(formatGridValue({ field: "v", header: "V" }, "Global Equity")).toBe("Global Equity");
    expect(formatGridValue({ field: "v", header: "V", kind: "number" }, "n/a")).toBe("n/a");
  });

  it("negative colouring only applies to signed columns", () => {
    expect(isNegativeCell({ field: "v", header: "V", kind: "percent", signed: true }, -0.4)).toBe(true);
    expect(isNegativeCell({ field: "v", header: "V", kind: "percent", signed: true }, 0.4)).toBe(false);
    expect(isNegativeCell({ field: "v", header: "V", kind: "percent" }, -0.4)).toBe(false);
  });
});

describe("dataGridModel - reading a block's props", () => {
  const columns = [
    { field: "fund", header: "Fund", pinned: true },
    { header: "VaR 95% (20D)", children: [{ field: "var", header: "Value", kind: "currency" }, { field: "varPct", header: "(%)", kind: "percent" }] },
  ];

  it("keeps leaves and groups, and flattens to leaves in display order", () => {
    const read = readGridColumns(columns);
    expect(read).toHaveLength(2);
    expect(isColumnGroup(read[1])).toBe(true);
    expect(leafColumns(read).map((c) => c.field)).toEqual(["fund", "var", "varPct"]);
  });

  it("drops malformed columns instead of crashing", () => {
    expect(readGridColumns([null, 3, { header: "No field" }, { field: "ok" }, { header: "Empty group", children: [] }]))
      .toEqual([{ field: "ok", header: "ok" }]);
    expect(readGridColumns("nope")).toEqual([]);
  });

  it("reads rows and drops non-objects", () => {
    expect(readGridRows([{ fund: "A" }, null, "x", [1]])).toEqual([{ fund: "A" }]);
    expect(readGridRows(undefined)).toEqual([]);
  });
});
