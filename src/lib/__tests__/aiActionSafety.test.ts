import { beforeEach, describe, expect, it } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import { applyAIActions } from "../applyAIActions";
beforeEach(() => useBuilder.setState(useBuilder.getInitialState(), true));
describe("AI action validation", () => {
  it("rejects unknown themes, component IDs and unsafe color overrides", () => {
    const before = useBuilder.getState();
    const report = applyAIActions([
      { action: "setThemeKey", value: "invented-theme" },
      { action: "setComponents", value: ["cards", "unknown-id"] },
      { action: "setColorOverride", value: { key: "__proto__", color: "#fff" } },
      { action: "setColorOverride", value: { key: "accent", color: "red; background:url(https://evil.test)" } },
    ]);
    expect(report.applied).toBe(0);
    expect(report.skipped).toHaveLength(4);
    expect(useBuilder.getState()).toBe(before);
  });
  it("clamps finite layout values and discards nonfinite or CSS input", () => {
    applyAIActions([{ action: "addBlock", value: { type: "SimulatedCard", layout: { width: "999999px", margin: -50, gridCol: 999, minHeight: Infinity, maxHeight: "url(https://evil.test)" } } }]);
    expect(useBuilder.getState().blocks[0].layout).toEqual({ width: "4096px", margin: 0, gridCol: 12 });
    applyAIActions([{ action: "setZoneLayout", value: { zone: "body", layout: { columns: 999, gap: { row: -1, col: 999 }, padding: { t: 999, r: -4, b: 8, l: Infinity }, size: 999999 } } }]);
    expect(useBuilder.getState().zoneLayouts.body).toMatchObject({ columns: 12, gap: { row: 0, col: 128 }, padding: { t: 128, r: 0, b: 8, l: 0 }, size: 2048 });
  });
});
