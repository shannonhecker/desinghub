/* ════════════════════════════════════════════════════════════
   Scrubbable NumberField — pure scrub math (P6).
   ════════════════════════════════════════════════════════════
   `applyScrubDelta` is the side-effect-free core shared by the
   inspector drag gesture and its keyboard path. Tested directly
   (the codebase's convention for pure layout/export math), so the
   React plumbing in ScrubNumberField stays a thin shell.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { applyScrubDelta, SCRUB_COARSE_MULTIPLIER } from "../scrub";

describe("applyScrubDelta", () => {
  it("drags right by N px → adds N at the default step of 1", () => {
    expect(applyScrubDelta({ start: 100, units: 5 })).toBe(105);
  });

  it("drags left (negative units) → decrements", () => {
    expect(applyScrubDelta({ start: 100, units: -12 })).toBe(88);
  });

  it("Shift (coarse) multiplies the step by 10", () => {
    expect(applyScrubDelta({ start: 100, units: 3, coarse: true })).toBe(130);
    expect(SCRUB_COARSE_MULTIPLIER).toBe(10);
  });

  it("a per-unit step scales the movement (keyboard ±1 unit × step)", () => {
    expect(applyScrubDelta({ start: 24, units: 1, step: 8 })).toBe(32);
    expect(applyScrubDelta({ start: 24, units: -1, step: 8 })).toBe(16);
  });

  it("step and coarse compose (1 unit × step 8 × ×10)", () => {
    expect(applyScrubDelta({ start: 0, units: 1, step: 8, coarse: true })).toBe(80);
  });

  it("clamps to min", () => {
    expect(applyScrubDelta({ start: 4, units: -20, min: 0 })).toBe(0);
  });

  it("clamps to max", () => {
    expect(applyScrubDelta({ start: 90, units: 50, max: 100 })).toBe(100);
  });

  it("rounds to an integer (sub-pixel drag deltas never leak through)", () => {
    expect(applyScrubDelta({ start: 10, units: 2.6 })).toBe(13);
    expect(applyScrubDelta({ start: 10, units: 0.4 })).toBe(10);
  });

  it("respects both bounds at once", () => {
    expect(applyScrubDelta({ start: 5, units: 0, min: 1, max: 12 })).toBe(5);
    expect(applyScrubDelta({ start: 5, units: 100, min: 1, max: 12 })).toBe(12);
    expect(applyScrubDelta({ start: 5, units: -100, min: 1, max: 12 })).toBe(1);
  });
});
