import { describe, it, expect } from "vitest";
import {
  canonicalDesignSystem,
  canonicalBuilderMode,
  canonicalInterfaceType,
} from "../dsParam";

describe("canonicalDesignSystem", () => {
  it("returns canonical keys as-is", () => {
    expect(canonicalDesignSystem("salt")).toBe("salt");
    expect(canonicalDesignSystem("m3")).toBe("m3");
    expect(canonicalDesignSystem("fluent")).toBe("fluent");
    expect(canonicalDesignSystem("uoaui")).toBe("uoaui");
    expect(canonicalDesignSystem("carbon")).toBe("carbon");
  });

  it("aliases md3 / material / material3 to m3", () => {
    expect(canonicalDesignSystem("md3")).toBe("m3");
    expect(canonicalDesignSystem("material")).toBe("m3");
    expect(canonicalDesignSystem("material3")).toBe("m3");
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(canonicalDesignSystem("MD3")).toBe("m3");
    expect(canonicalDesignSystem("  Salt  ")).toBe("salt");
  });

  it("returns null for unknown input", () => {
    expect(canonicalDesignSystem("xyz")).toBeNull();
    expect(canonicalDesignSystem("")).toBeNull();
    expect(canonicalDesignSystem(null)).toBeNull();
    expect(canonicalDesignSystem(undefined)).toBeNull();
  });
});

describe("canonicalBuilderMode", () => {
  it("returns canonical modes", () => {
    expect(canonicalBuilderMode("light")).toBe("light");
    expect(canonicalBuilderMode("dark")).toBe("dark");
    expect(canonicalBuilderMode("Dark")).toBe("dark");
  });

  it("returns null for unknown input", () => {
    expect(canonicalBuilderMode("auto")).toBeNull();
    expect(canonicalBuilderMode(null)).toBeNull();
  });
});

describe("canonicalInterfaceType", () => {
  it("returns canonical types", () => {
    expect(canonicalInterfaceType("dashboard")).toBe("dashboard");
    expect(canonicalInterfaceType("landing")).toBe("landing");
    expect(canonicalInterfaceType("portfolio")).toBe("portfolio");
  });

  it("returns null for unknown input", () => {
    expect(canonicalInterfaceType("app")).toBeNull();
    expect(canonicalInterfaceType(null)).toBeNull();
  });
});
