import { describe, it, expect } from "vitest";
import { crossAxisAlignOptions, mainAxisJustifyOptions } from "../ZoneLayoutOverlay";

/**
 * The on-canvas align/justify overlay maps to the SAME container tokens the
 * inspector writes (align-items / justify-content) — export-neutral. These
 * tests pin the orientation logic: icons/labels must flip with the zone's flow
 * axis so "align" reads correctly in a row (vertical) vs a stack (horizontal).
 */
describe("ZoneLayoutOverlay — orientation-adaptive options", () => {
  it("exposes the four cross-axis align values + the four main-axis justify values", () => {
    expect(crossAxisAlignOptions("row").map((o) => o.v)).toEqual(["start", "center", "end", "stretch"]);
    expect(mainAxisJustifyOptions("row").map((o) => o.v)).toEqual(["start", "center", "end", "space-between"]);
  });

  it("row/grid → align uses VERTICAL (top/middle/bottom) icons", () => {
    const icons = crossAxisAlignOptions("row").map((o) => o.icon);
    expect(icons).toContain("align_vertical_top");
    expect(icons).toContain("align_vertical_bottom");
    expect(crossAxisAlignOptions("grid")).toEqual(crossAxisAlignOptions("row"));
  });

  it("stack → align flips to HORIZONTAL (left/center/right) icons", () => {
    const icons = crossAxisAlignOptions("stack").map((o) => o.icon);
    expect(icons).toContain("align_horizontal_left");
    expect(icons).toContain("align_horizontal_right");
    expect(icons).not.toContain("align_vertical_top");
  });

  it("justify orientation flips too (row=horizontal packing, stack=vertical packing)", () => {
    expect(mainAxisJustifyOptions("row").map((o) => o.icon)).toContain("format_align_left");
    expect(mainAxisJustifyOptions("stack").map((o) => o.icon)).toContain("vertical_align_top");
  });

  it("every option carries a human label (a11y title)", () => {
    for (const o of [...crossAxisAlignOptions("row"), ...mainAxisJustifyOptions("stack")]) {
      expect(o.label.length).toBeGreaterThan(2);
    }
  });
});
