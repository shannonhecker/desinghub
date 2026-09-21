import { describe, it, expect } from "vitest";
import {
  DENSITY_LEVELS,
  coerceDensity,
  muiSize,
  muiSize2,
  fluentSize,
  fluentSize2,
  fluentCheckboxSize,
  carbonSize,
  carbonSize2,
  carbonDensityTier,
} from "../densitySize";

describe("densitySize — one shared level, five sizing vocabularies", () => {
  it("coerces unknown store values to medium and keeps the four levels", () => {
    for (const d of DENSITY_LEVELS) expect(coerceDensity(d)).toBe(d);
    expect(coerceDensity("small")).toBe("medium"); // Fluent's UI-Kit size slot
    expect(coerceDensity(undefined)).toBe("medium");
    expect(coerceDensity(42)).toBe("medium");
  });

  it("maps the ladder monotonically in every system (high ≤ medium ≤ low = touch)", () => {
    expect(DENSITY_LEVELS.map(muiSize)).toEqual(["small", "medium", "large", "large"]);
    expect(DENSITY_LEVELS.map(muiSize2)).toEqual(["small", "medium", "medium", "medium"]);
    expect(DENSITY_LEVELS.map(fluentSize)).toEqual(["small", "medium", "large", "large"]);
    expect(DENSITY_LEVELS.map(fluentSize2)).toEqual(["small", "medium", "medium", "medium"]);
    expect(DENSITY_LEVELS.map(fluentCheckboxSize)).toEqual(["medium", "medium", "large", "large"]);
    expect(DENSITY_LEVELS.map(carbonSize)).toEqual(["sm", "md", "lg", "lg"]);
    expect(DENSITY_LEVELS.map(carbonSize2)).toEqual(["sm", "md", "md", "md"]);
    expect(DENSITY_LEVELS.map(carbonDensityTier)).toEqual(["compact", "normal", "spacious", "spacious"]);
  });

  it("medium is every system's default size, so the default canvas is unchanged", () => {
    expect(muiSize("medium")).toBe("medium");
    expect(fluentSize("medium")).toBe("medium");
    expect(carbonSize("medium")).toBe("md");
    expect(carbonDensityTier("medium")).toBe("normal");
  });
});
