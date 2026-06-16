/* ════════════════════════════════════════════════════════════
   COMPONENT_ANATOMY.button — cross-DS coverage.
   Pure data assertions: the AnatomyDiagram default branch already draws
   the button-pill schematic, so anatomy for each DS is data only. This
   locks in that all five design systems carry a well-formed button
   anatomy (parts + measures) so the Specs ‣ Anatomy section lights up
   across the matrix.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import {
  COMPONENT_ANATOMY,
  type DesignSystemId,
  type ComponentAnatomy,
} from "@/data/ui-kit-meta";

const ALL_DS: DesignSystemId[] = ["salt", "m3", "fluent", "carbon", "uoaui"];

describe("COMPONENT_ANATOMY.button", () => {
  it("is defined", () => {
    expect(COMPONENT_ANATOMY.button).toBeDefined();
  });

  it.each(ALL_DS)("has a well-formed entry for %s", (ds) => {
    const anatomy = COMPONENT_ANATOMY.button?.[ds] as ComponentAnatomy | undefined;
    expect(anatomy, `button.${ds} should exist`).toBeDefined();
    if (!anatomy) return;

    // parts: non-empty, each with numeric n + label + numeric x/y anchors.
    expect(Array.isArray(anatomy.parts)).toBe(true);
    expect(anatomy.parts.length).toBeGreaterThan(0);
    for (const part of anatomy.parts) {
      expect(typeof part.n).toBe("number");
      expect(typeof part.label).toBe("string");
      expect(part.label.length).toBeGreaterThan(0);
      expect(typeof part.x).toBe("number");
      expect(typeof part.y).toBe("number");
    }

    // measures: non-empty, each with a label + display value.
    expect(Array.isArray(anatomy.measures)).toBe(true);
    expect(anatomy.measures.length).toBeGreaterThan(0);
    for (const measure of anatomy.measures) {
      expect(typeof measure.label).toBe("string");
      expect(measure.label.length).toBeGreaterThan(0);
      expect(typeof measure.value).toBe("string");
      expect(measure.value.length).toBeGreaterThan(0);
    }
  });

  it("covers exactly the five design systems", () => {
    const keys = Object.keys(COMPONENT_ANATOMY.button ?? {}).sort();
    expect(keys).toEqual([...ALL_DS].sort());
  });
});
