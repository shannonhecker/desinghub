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

describe("computeGroupItemStyle — horizontal groups are gap-aware like zones", () => {
  const group = (direction: string, gap: number): Block =>
    ({ id: "g1", type: "LayoutGroup", props: { direction, gap }, children: [] } as Block);

  it("subtracts the group's gap from a % child basis in a row group", () => {
    const style = computeGroupItemStyle(withWidth("50%"), group("row", 12));
    expect(style.flex).toBe("0 1 calc(50% - 12px)");
  });
});
