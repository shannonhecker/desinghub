import { describe, it, expect } from "vitest";
import { computeItemStyle, computeGroupItemStyle } from "../layoutResolver";
import type { Block, ZoneLayout } from "@/store/useBuilder";

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
