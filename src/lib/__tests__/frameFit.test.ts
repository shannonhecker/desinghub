import { describe, it, expect } from "vitest";
import { fitFrame, FRAME_PRESETS } from "../frameFit";

describe("fitFrame - scale the frame to the stage, never re-flow it", () => {
  const { width, height } = FRAME_PRESETS.desktop;

  it("leaves the frame unscaled when the stage is at least the design width", () => {
    expect(fitFrame(width, height, 1320, 760)).toEqual({ zoom: 1, maxHeight: 800 });
    expect(fitFrame(width, height, 1800, 1000)).toEqual({ zoom: 1, maxHeight: 800 });
  });

  it("leaves the frame unscaled before the stage has been measured", () => {
    expect(fitFrame(width, height, 0, 0)).toEqual({ zoom: 1, maxHeight: 800 });
  });

  it("scales down to the stage width when the stage is narrower (Edit with panels docked)", () => {
    const fit = fitFrame(width, height, 825, 760);
    expect(fit.zoom).toBe(0.625);
    /* The scaled frame must never be wider than the stage. */
    expect(width * fit.zoom).toBeLessThanOrEqual(825);
  });

  it("grows the height cap so a scaled frame fills the stage height", () => {
    const fit = fitFrame(width, height, 660, 700);
    expect(fit.zoom).toBe(0.5);
    expect(fit.maxHeight).toBe(1400);
  });

  it("never shrinks the height cap below the preset", () => {
    expect(fitFrame(width, height, 1188, 300).maxHeight).toBe(800);
  });

  it("floors the scale so the scaled width cannot exceed the stage", () => {
    for (const avail of [333, 777, 1001, 1319]) {
      expect(width * fitFrame(width, height, avail, 600).zoom).toBeLessThanOrEqual(avail);
    }
  });

  it("fits the tablet and mobile presets the same way", () => {
    expect(fitFrame(FRAME_PRESETS.tablet.width, FRAME_PRESETS.tablet.height, 390, 800).zoom).toBe(0.507);
    expect(fitFrame(FRAME_PRESETS.mobile.width, FRAME_PRESETS.mobile.height, 390, 800).zoom).toBe(1);
  });
});
