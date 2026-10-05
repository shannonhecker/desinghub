import { describe, it, expect } from "vitest";
import type { PanelConfig } from "../panelConfig";
import { withAggregated, addColumn, addGroup, availableTree, canPivot, canRemoveColumn, moveColumn, removeColumn, removeGroup, setAggregation } from "../panelConfigDialog";
import { financeDataset } from "../financeDataset";
import { dimensionsOf, measuresOf, tableOf } from "../types";

const holdings = tableOf(financeDataset(), "holdings")!;
const dims = dimensionsOf(holdings);
const mets = measuresOf(holdings);
const base: PanelConfig = { view: "grid", chartType: "column", rows: null, columns: null, values: [{ field: mets[0].key, agg: "sum" }], share: "none", limit: null };

describe("availableTree", () => {
  it("lists dimensions then metrics with their tags and a total count", () => {
    const t = availableTree(holdings, base, "columns");
    expect(t.groups.map((g) => g.id)).toEqual(["dimensions", "metrics"]);
    expect(t.groups[0].leaves.every((l) => l.tag === "abc")).toBe(true);
    expect(t.groups[1].leaves.every((l) => l.tag === "123")).toBe(true);
    expect(t.count).toBe(dims.length + mets.length);
  });

  it("on Columns only unchosen metrics are addable; on Groups only unchosen dimensions", () => {
    const cols = availableTree(holdings, base, "columns");
    expect(cols.groups[0].leaves.some((l) => l.addable)).toBe(false);
    expect(cols.groups[1].leaves.find((l) => l.key === mets[0].key)!.addable).toBe(false);
    expect(cols.groups[1].leaves.find((l) => l.key === mets[1].key)!.addable).toBe(true);
    const groups = availableTree(holdings, { ...base, rows: dims[0].key }, "groups");
    expect(groups.groups[1].leaves.some((l) => l.addable)).toBe(false);
    expect(groups.groups[0].leaves.find((l) => l.key === dims[0].key)!.addable).toBe(false);
    expect(groups.groups[0].leaves.find((l) => l.key === dims[1].key)!.addable).toBe(true);
    const full = availableTree(holdings, { ...base, rows: dims[0].key, columns: dims[1].key }, "groups");
    expect(full.groups[0].leaves.some((l) => l.addable)).toBe(false);
  });

  it("filters by name, case-insensitively, and drops empty groups", () => {
    const label = mets[0].label;
    const t = availableTree(holdings, base, "columns", label.toUpperCase());
    expect(t.groups.flatMap((g) => g.leaves).some((l) => l.label === label)).toBe(true);
    expect(t.count).toBe(t.groups.reduce((n, g) => n + g.leaves.length, 0));
    const none = availableTree(holdings, base, "columns", "zzz no such field");
    expect(none).toEqual({ groups: [], count: 0 });
  });
});

describe("columns", () => {
  it("adds a metric with its default aggregation, never a dimension or a duplicate", () => {
    const c = addColumn(base, mets[1].key, holdings);
    expect(c.values.map((v) => v.field)).toEqual([mets[0].key, mets[1].key]);
    expect(addColumn(c, mets[1].key, holdings)).toBe(c);
    expect(addColumn(c, dims[0].key, holdings)).toBe(c);
  });

  it("removes, but keeps at least one figure", () => {
    expect(canRemoveColumn(base)).toBe(false);
    expect(removeColumn(base, mets[0].key)).toBe(base);
    const two = addColumn(base, mets[1].key, holdings);
    expect(removeColumn(two, mets[0].key).values.map((v) => v.field)).toEqual([mets[1].key]);
  });

  it("moves up and down within bounds", () => {
    const two = addColumn(base, mets[1].key, holdings);
    expect(moveColumn(two, mets[1].key, -1).values.map((v) => v.field)).toEqual([mets[1].key, mets[0].key]);
    expect(moveColumn(two, mets[0].key, -1)).toBe(two);
    expect(moveColumn(two, mets[1].key, 1)).toBe(two);
  });

  it("sets one figure's aggregation", () => {
    expect(setAggregation(base, mets[0].key, "max").values[0]).toEqual({ field: mets[0].key, agg: "max" });
  });
});

describe("groups", () => {
  it("fills the row group, then the column group, then refuses", () => {
    const one = addGroup(base, dims[0].key, holdings);
    expect(one.rows).toBe(dims[0].key);
    const two = addGroup(one, dims[1].key, holdings);
    expect(two.columns).toBe(dims[1].key);
    expect(addGroup(two, dims[2].key, holdings)).toBe(two);
    expect(addGroup(base, mets[0].key, holdings)).toBe(base);
  });

  it("a pie or donut takes a row group only", () => {
    const donut: PanelConfig = { ...base, view: "chart", chartType: "donut", rows: dims[0].key };
    expect(canPivot(donut)).toBe(false);
    expect(addGroup(donut, dims[1].key, holdings)).toBe(donut);
    expect(availableTree(holdings, donut, "groups").groups[0].leaves.some((l) => l.addable)).toBe(false);
    expect(canPivot({ ...donut, chartType: "bar" })).toBe(true);
  });

  it("removes a slot; the column group moves up when the row group goes", () => {
    const two = { ...base, rows: dims[0].key, columns: dims[1].key };
    expect(removeGroup(two, "rows")).toMatchObject({ rows: dims[1].key, columns: null });
    expect(removeGroup({ ...base, rows: dims[0].key }, "rows")).toMatchObject({ rows: null, columns: null });
    expect(removeGroup(two, "columns")).toMatchObject({ rows: dims[0].key, columns: null });
  });
});

describe("Aggregated", () => {
  const binding = { table: "holdings", view: "grid", groupBy: "fund", hierarchy: ["fund", "assetClass", "security"], measures: [], display: [] } as unknown as import("../binding").DataBinding;
  it("off then on gives back the binding it opened with", () => {
    const off = withAggregated(binding, binding, false, 2);
    expect(off.dataLevel).toBe("leaf");
    expect(withAggregated(off, binding, true, 2)).toEqual(binding);
    const set = { ...binding, dataLevel: 1, expanded: { dataLevel: 1 } } as typeof binding;
    expect(withAggregated(withAggregated(set, set, false, 2), set, true, 2)).toEqual(set);
  });
  it("opened at the leaf, on is the full hierarchy", () => {
    const leaf = { ...binding, dataLevel: "leaf", expanded: { dataLevel: "leaf" } } as typeof binding;
    expect(withAggregated(leaf, leaf, true, 2)).toMatchObject({ dataLevel: 2, expanded: { dataLevel: 2 } });
  });
});
