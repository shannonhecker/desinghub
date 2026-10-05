import { describe, it, expect } from "vitest";
import { categorizeTokens, contrastPartner, exportThemeJSON, importThemeJSON } from "@/lib/themeBuilder";

describe("categorizeTokens", () => {
  it("files Material 'on' roles under Foreground, not Background or Accent", () => {
    const cats = categorizeTokens({
      surface: "#FEF7FF", onSurface: "#1D1B20", onSurfaceVariant: "#49454F",
      primary: "#6750A4", onPrimary: "#FFFFFF", onPrimaryContainer: "#21005D",
      inverseSurface: "#322F35", inverseOnSurface: "#F5EFF7",
    });
    const keys = (c: string) => (cats[c] ?? []).map((t) => t.key);
    expect(keys("Foreground")).toEqual(expect.arrayContaining(["onSurface", "onSurfaceVariant", "onPrimary", "onPrimaryContainer", "inverseOnSurface"]));
    expect(keys("Background")).toEqual(["surface", "inverseSurface"]);
    expect(keys("Accent")).toEqual(["primary"]);
  });

  it("keeps only colour-like string values and drops empty groups", () => {
    const cats = categorizeTokens({ bg: "#fff", name: "Light", radius: 4, shadow: "0 1px 2px #000" });
    expect(Object.keys(cats)).toEqual(["Background"]);
  });
});

describe("contrastPartner", () => {
  it("pairs an 'on' role with its own container", () => {
    const theme = { primary: "#6750A4", onPrimary: "#FFFFFF", inverseSurface: "#322F35", inverseOnSurface: "#F5EFF7" };
    expect(contrastPartner("onPrimary", theme)).toBe("primary");
    expect(contrastPartner("inverseOnSurface", theme)).toBe("inverseSurface");
  });

  it("pairs accent, inverse and status foregrounds with their fills", () => {
    expect(contrastPartner("accentFg", { accent: "#1B7F9E" })).toBe("accent");
    expect(contrastPartner("fgOnBrand", { brandBg: "#0F6CBD" })).toBe("brandBg");
    expect(contrastPartner("fgInv", { bgInv: "#101820" })).toBe("bgInv");
    expect(contrastPartner("positiveFg", { positiveWeak: "#EAF5F2" })).toBe("positiveWeak");
    expect(contrastPartner("dangerFg1", { dangerBg1: "#FDF3F4" })).toBe("dangerBg1");
  });

  it("falls back to the page background when there is no usable partner", () => {
    expect(contrastPartner("fg2", { bg: "#fff", fg2: "#444" })).toBeNull();
    /* The partner exists but is translucent, so no ratio can be computed. */
    expect(contrastPartner("accentFg", { accent: "rgba(138,88,201,0.5)" })).toBeNull();
  });
});

describe("theme JSON round trip", () => {
  it("exports and re-imports overrides with their system", () => {
    const json = exportThemeJSON({ accent: "#D6336C" }, { ds: "salt", baseName: "JPM Brand Light" });
    expect(importThemeJSON(json)).toEqual({ overrides: { accent: "#D6336C" }, meta: { ds: "salt", baseName: "JPM Brand Light" } });
  });

  it("rejects text that is not theme JSON", () => {
    expect(importThemeJSON("{ not json")).toBeNull();
    expect(importThemeJSON('{"colors":{}}')).toBeNull();
  });
});
