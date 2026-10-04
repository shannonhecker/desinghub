import { describe, it, expect } from "vitest";
import { panelContentHeight, panelHeightOf, viewByOf, PANEL_DEFAULT_HEIGHT, PANEL_HEADER_HEIGHT, PANEL_PADDING } from "../panelMetrics";

describe("panelMetrics", () => {
  it("content height is what the header and bottom padding leave", () => {
    expect(panelContentHeight(360)).toBe(360 - PANEL_HEADER_HEIGHT - PANEL_PADDING);
    expect(panelContentHeight(10)).toBe(0);
  });

  it("reads a block's height, falling back to the default for nonsense", () => {
    expect(panelHeightOf({ height: 320 })).toBe(320);
    expect(panelHeightOf({ height: "348" })).toBe(348);
    expect(panelHeightOf({})).toBe(PANEL_DEFAULT_HEIGHT);
    expect(panelHeightOf({ height: "tall" })).toBe(PANEL_DEFAULT_HEIGHT);
    expect(panelHeightOf({ height: 12 })).toBe(PANEL_DEFAULT_HEIGHT);
  });

  it("reads View by choices from an array or a comma-separated string", () => {
    expect(viewByOf({ viewBy: ["Fund", " Account ", ""] })).toEqual(["Fund", "Account"]);
    expect(viewByOf({ viewByCsv: "Asset type, Region" })).toEqual(["Asset type", "Region"]);
    expect(viewByOf({})).toEqual([]);
  });
});
