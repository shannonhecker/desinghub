/* No layout option may make content disappear (5 Oct: switching a grid body
   to Row, or picking a distribution, collapsed every block to nothing). */
import { describe, it, expect } from "vitest";
import { computeItemStyle } from "@/lib/layoutResolver";
import type { Block } from "@/store/useBuilder";

const block = (width: string): Block => ({ id: "b", type: "HighchartColumn", props: {}, layout: { width } } as Block);

describe("fr widths outside a grid, and distribution inside one", () => {
  it("row: an fr share becomes a percentage of the line, less one gap; never a raw fr length", () => {
    const s = computeItemStyle(block("4fr"), { mode: "row", gap: 24 });
    expect(String(s.width)).toBe("calc(33.3333% - 24px)");
    expect(String(s.flex)).toContain("calc(33.3333% - 24px)");
    expect(JSON.stringify(s)).not.toMatch(/\dfr/);
  });
  it("row without a gap: a plain percentage", () => {
    expect(String(computeItemStyle(block("6fr"), { mode: "row" }).width)).toBe("50%");
  });
  it("stack: an fr block takes the full width", () => {
    const s = computeItemStyle(block("4fr"), { mode: "stack", gap: 12, align: "center" });
    expect(s.width).toBe("100%");
    expect(JSON.stringify(s)).not.toMatch(/\dfr/);
  });
  for (const justify of ["center", "end", "space-between", "space-around"] as const) {
    it(`grid with justify ${justify}: a spanning block keeps filling its span`, () => {
      const s = computeItemStyle(block("4fr"), { mode: "grid", columns: 12, justify });
      expect(s.gridColumn).toBe("span 4");
      expect(s.justifySelf).toBe("stretch");
    });
  }
  it("grid at defaults is unchanged: no justify-self on a spanning block", () => {
    expect(computeItemStyle(block("4fr"), { mode: "grid", columns: 12 }).justifySelf).toBeUndefined();
  });
  it("grid: a hug block stays pinned to the start whatever the distribution", () => {
    expect(computeItemStyle(block("auto"), { mode: "grid", columns: 12, justify: "center" }).justifySelf).toBe("start");
  });
});
