import { describe, it, expect } from "vitest";
import { computeItemStyle, computeGroupItemStyle, computeContainerStyle } from "../layoutResolver";
import type { Block, ZoneLayout } from "@/store/useBuilder";

describe("computeContainerStyle — main-axis justify is additive (no regression)", () => {
  it("grid mode emits NO justify-items by default (fill/span items must keep stretching to their span)", () => {
    const style = computeContainerStyle({ mode: "grid", columns: 12 });
    expect(style.justifyItems).toBeUndefined();
  });

  it("grid mode honors an explicit justify", () => {
    const style = computeContainerStyle({ mode: "grid", columns: 12, justify: "center" });
    expect(style.justifyItems).toBe("center");
  });

  it("flex mode emits NO justify-content by default", () => {
    const style = computeContainerStyle({ mode: "row" });
    expect(style.justifyContent).toBeUndefined();
  });

  it("flex (row) mode maps an explicit justify to justify-content", () => {
    const style = computeContainerStyle({ mode: "row", justify: "center" });
    expect(style.justifyContent).toBe("center");
  });

  it("flex (row) mode supports space-between distribution", () => {
    const style = computeContainerStyle({ mode: "row", justify: "space-between" });
    expect(style.justifyContent).toBe("space-between");
  });
});

describe("computeItemStyle — fixed-width grid items pin to start (#298)", () => {
  it("a px-width block in a grid gets justifySelf:start so it does not float centered in its track", () => {
    const block = { id: "b1", type: "SimulatedStatCard", props: {}, layout: { width: "240px" } } as Block;
    const style = computeItemStyle(block, { mode: "grid", columns: 12 });
    expect(style.justifySelf).toBe("start");
  });

  it("does NOT pin fill/span grid items (they must keep stretching to their column span)", () => {
    const fill = { id: "b2", type: "SimulatedStatCard", props: {}, layout: { width: "fill" } } as Block;
    const style = computeItemStyle(fill, { mode: "grid", columns: 12 });
    expect(style.justifySelf).toBeUndefined();
  });
});

/* Minimal body block carrying a given layout.width. The cast keeps the
   helper readable without fighting the LayoutWidth template-literal union. */
const withWidth = (width: unknown): Block =>
  ({ id: "b1", type: "SimulatedStatCard", props: {}, layout: { width: width as never } } as Block);

const ROW: ZoneLayout = { mode: "row", gap: 12, wrap: true, align: "stretch" };
const STACK: ZoneLayout = { mode: "stack", gap: 12, align: "stretch" };

describe("computeItemStyle — row-mode percentage basis is gap-aware", () => {
  it("subtracts the container gap from a % flex-basis so a 33.333%×3 row does not wrap", () => {
    const style = computeItemStyle(withWidth("33.333%"), ROW);
    // 3 items at calc(33.333% - 12px) + 2×12px gap = 100% - 12px → fits one row
    expect(style.flex).toBe("0 1 calc(33.333% - 12px)");
    expect(style.width).toBe("calc(33.333% - 12px)");
  });

  it("compensates the 66.666% / 33.333% secondary row too", () => {
    expect(computeItemStyle(withWidth("66.666%"), ROW).flex).toBe("0 1 calc(66.666% - 12px)");
    expect(computeItemStyle(withWidth("33.333%"), ROW).flex).toBe("0 1 calc(33.333% - 12px)");
  });

  it("does NOT compensate when the row has no gap", () => {
    const style = computeItemStyle(withWidth("33.333%"), { mode: "row", gap: 0, wrap: true });
    expect(style.flex).toBe("0 1 33.333%");
  });
});

describe("computeItemStyle — non-percentage / non-row widths are untouched", () => {
  it("leaves a fixed px width literal in a row (no gap math)", () => {
    const style = computeItemStyle(withWidth("240px"), ROW);
    expect(style.flex).toBe("0 0 240px");
    expect(style.width).toBe("240px");
  });

  it("leaves a % width literal in STACK mode (its gap is vertical)", () => {
    const style = computeItemStyle(withWidth("50%"), STACK);
    expect(style.flex).toBe("0 1 50%");
    expect(style.width).toBe("50%");
  });

  it("keeps fill as a growing item in a row", () => {
    expect(computeItemStyle(withWidth("fill"), ROW).flex).toBe("1 1 auto");
  });
});

describe("computeItemStyle — sliver guard floors over-narrow explicit widths", () => {
  const GRID: ZoneLayout = { mode: "grid", columns: 12, gap: 12 };
  const withMin = (width: unknown, minWidth: unknown): Block =>
    ({ id: "b1", type: "SimulatedStatCard", props: {}, layout: { width: width as never, minWidth: minWidth as never } } as Block);

  it("floors a typo'd 3% to a usable min-width in a row (no more vertical ladder)", () => {
    expect(computeItemStyle(withWidth("3%"), ROW).minWidth).toBe("80px");
  });

  it("floors a tiny 3% in a grid too", () => {
    expect(computeItemStyle(withWidth("3%"), GRID).minWidth).toBe("80px");
  });

  it("floors a fat-fingered tiny px width", () => {
    expect(computeItemStyle(withWidth("12px"), ROW).minWidth).toBe("80px");
  });

  it("leaves normal widths alone — no sliver floor on 33%/50%/fill", () => {
    // 33% in a row resolves minWidth via the gap-aware path, not the sliver floor
    expect(computeItemStyle(withWidth("50%"), STACK).minWidth).toBeUndefined();
    expect(computeItemStyle(withWidth("fill"), STACK).minWidth).toBeUndefined();
    expect(computeItemStyle(withWidth("240px"), ROW).minWidth).toBeUndefined();
  });

  it("respects an explicit minWidth instead of the sliver floor", () => {
    expect(computeItemStyle(withMin("3%", 120), ROW).minWidth).toBe("120px");
  });
});

describe("computeGroupItemStyle — horizontal groups are gap-aware like zones", () => {
  const group = (direction: string, gap: number): Block =>
    ({ id: "g1", type: "LayoutGroup", props: { direction, gap }, children: [] } as Block);

  it("subtracts the group's gap from a % child basis in a row group", () => {
    const style = computeGroupItemStyle(withWidth("50%"), group("row", 12));
    expect(style.flex).toBe("0 1 calc(50% - 12px)");
  });
});

/* ── P3 height engine — counter-axis Hug / Fill / Fixed × stack / row / grid ──
   Height reuses the LayoutWidth union: 'auto' = Hug, 'fill' = Fill (stretch),
   '{N}px' / '{N}%' = Fixed. undefined height = Hug (no-op; back-compat). */
describe("computeItemStyle — P3 height (counter-axis) Hug/Fill/Fixed", () => {
  const GRID: ZoneLayout = { mode: "grid", columns: 12, gap: 12 };
  const withLayout = (layout: Record<string, unknown>): Block =>
    ({ id: "b1", type: "SimulatedStatCard", props: {}, layout: layout as never } as Block);

  it("undefined height is a no-op (back-compat — pre-P3 saved blocks unchanged)", () => {
    expect(computeItemStyle(withLayout({ width: "fill" }), STACK).height).toBeUndefined();
    expect(computeItemStyle(withLayout({ width: "fill" }), ROW).height).toBeUndefined();
    expect(computeItemStyle(withLayout({ width: "fill" }), GRID).height).toBeUndefined();
  });

  it("Hug (auto) → height:auto in every mode", () => {
    expect(computeItemStyle(withLayout({ height: "auto" }), STACK).height).toBe("auto");
    expect(computeItemStyle(withLayout({ height: "auto" }), ROW).height).toBe("auto");
    expect(computeItemStyle(withLayout({ height: "auto" }), GRID).height).toBe("auto");
  });

  it("Fixed px height → explicit height in every mode", () => {
    expect(computeItemStyle(withLayout({ height: "240px" }), STACK).height).toBe("240px");
    expect(computeItemStyle(withLayout({ height: "240px" }), ROW).height).toBe("240px");
    expect(computeItemStyle(withLayout({ height: "240px" }), GRID).height).toBe("240px");
  });

  it("Fixed % height → explicit percent height", () => {
    expect(computeItemStyle(withLayout({ height: "60%" }), GRID).height).toBe("60%");
  });

  it("Fill in STACK (vertical main axis) → flexGrow:1 + height:100%", () => {
    const style = computeItemStyle(withLayout({ height: "fill" }), STACK);
    expect(style.flexGrow).toBe(1);
    expect(style.height).toBe("100%");
  });

  it("Fill in ROW / GRID (height is cross axis) → alignSelf:stretch + height:100%", () => {
    const row = computeItemStyle(withLayout({ height: "fill" }), ROW);
    expect(row.alignSelf).toBe("stretch");
    expect(row.height).toBe("100%");
    const grid = computeItemStyle(withLayout({ height: "fill" }), GRID);
    expect(grid.alignSelf).toBe("stretch");
    expect(grid.height).toBe("100%");
  });

  it("minHeight / maxHeight project even when height is Hug (undefined)", () => {
    const style = computeItemStyle(withLayout({ minHeight: "100px", maxHeight: "400px" }), STACK);
    expect(style.minHeight).toBe("100px");
    expect(style.maxHeight).toBe("400px");
    expect(style.height).toBeUndefined();
  });

  it("height sizing does not disturb width sizing (axes are independent)", () => {
    const style = computeItemStyle(withLayout({ width: "240px", height: "120px" }), ROW);
    expect(style.flex).toBe("0 0 240px"); // width path intact
    expect(style.width).toBe("240px");
    expect(style.height).toBe("120px");   // height path applied
  });
});
