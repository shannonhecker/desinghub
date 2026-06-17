import { describe, it, expect } from "vitest";
import { JUSTIFY_STOPS, justifyFromDrag, justifyLabel } from "../JustifyHandle";

/**
 * The distribute-handle drags through the FULL justify range (incl.
 * space-around, which the discrete overlay buttons omit) and commits ONLY the
 * container justify token — no coordinate. These pin the drag→value mapping.
 */
describe("JustifyHandle — drag-to-distribute mapping", () => {
  it("covers the full justify spectrum in order", () => {
    expect([...JUSTIFY_STOPS]).toEqual(["start", "center", "end", "space-between", "space-around"]);
  });

  it("maps drag distance to a stop, ~24px per step, clamped both ends", () => {
    expect(justifyFromDrag(0, 0)).toBe("start");
    expect(justifyFromDrag(0, 24)).toBe("center");   // 1 step
    expect(justifyFromDrag(0, 48)).toBe("end");      // 2 steps
    expect(justifyFromDrag(0, 1000)).toBe("space-around"); // clamp top
    expect(justifyFromDrag(2, -1000)).toBe("start");       // clamp bottom
  });

  it("steps relative to the starting value", () => {
    expect(justifyFromDrag(1, 24)).toBe("end");   // center +1 → end
    expect(justifyFromDrag(3, -24)).toBe("end");  // space-between -1 → end
  });

  it("gives every value a human label", () => {
    expect(justifyLabel("space-between")).toMatch(/between/i);
    expect(justifyLabel("space-around")).toMatch(/around/i);
    expect(justifyLabel("start")).toBe("Start");
  });
});
