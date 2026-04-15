import { describe, it, expect } from "vitest";
import {
  hexToRGB,
  relativeLuminance,
  contrastRatio,
  meetsAA,
  meetsAAA,
  formatRatio,
  isHex,
} from "../contrastUtils";

describe("hexToRGB", () => {
  it("parses 6-digit hex", () => {
    expect(hexToRGB("#ffffff")).toEqual([255, 255, 255]);
    expect(hexToRGB("#000000")).toEqual([0, 0, 0]);
    expect(hexToRGB("#1B7F9E")).toEqual([27, 127, 158]);
  });

  it("parses 3-digit shorthand hex", () => {
    expect(hexToRGB("#fff")).toEqual([255, 255, 255]);
    expect(hexToRGB("#000")).toEqual([0, 0, 0]);
    expect(hexToRGB("#abc")).toEqual([170, 187, 204]);
  });

  it("works without # prefix", () => {
    expect(hexToRGB("ff0000")).toEqual([255, 0, 0]);
  });
});

describe("relativeLuminance", () => {
  it("returns 1 for white", () => {
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 4);
  });

  it("returns 0 for black", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 4);
  });

  it("returns ~0.2126 for pure red", () => {
    expect(relativeLuminance("#ff0000")).toBeCloseTo(0.2126, 3);
  });
});

describe("contrastRatio", () => {
  it("returns 21:1 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("returns 1:1 for same color", () => {
    expect(contrastRatio("#1B7F9E", "#1B7F9E")).toBeCloseTo(1, 4);
  });

  it("is symmetric", () => {
    const r1 = contrastRatio("#1B7F9E", "#ffffff");
    const r2 = contrastRatio("#ffffff", "#1B7F9E");
    expect(r1).toBeCloseTo(r2, 4);
  });
});

describe("meetsAA", () => {
  it("passes at 4.5:1 for normal text", () => {
    expect(meetsAA(4.5)).toBe(true);
    expect(meetsAA(4.49)).toBe(false);
  });

  it("passes at 3:1 for large text", () => {
    expect(meetsAA(3.0, true)).toBe(true);
    expect(meetsAA(2.99, true)).toBe(false);
  });
});

describe("meetsAAA", () => {
  it("passes at 7:1 for normal text", () => {
    expect(meetsAAA(7.0)).toBe(true);
    expect(meetsAAA(6.99)).toBe(false);
  });

  it("passes at 4.5:1 for large text", () => {
    expect(meetsAAA(4.5, true)).toBe(true);
    expect(meetsAAA(4.49, true)).toBe(false);
  });
});

describe("formatRatio", () => {
  it("formats with 2 decimal places", () => {
    expect(formatRatio(4.5)).toBe("4.50:1");
    expect(formatRatio(21)).toBe("21.00:1");
  });
});

describe("isHex", () => {
  it("accepts valid 3/6/8-digit hex with #", () => {
    expect(isHex("#fff")).toBe(true);
    expect(isHex("#ffffff")).toBe(true);
    expect(isHex("#ffffffaa")).toBe(true);
  });

  it("rejects without #", () => {
    expect(isHex("ffffff")).toBe(false);
  });

  it("rejects invalid characters", () => {
    expect(isHex("#gggggg")).toBe(false);
  });

  it("rejects wrong lengths", () => {
    expect(isHex("#ff")).toBe(false);
    expect(isHex("#fffff")).toBe(false);
  });
});
