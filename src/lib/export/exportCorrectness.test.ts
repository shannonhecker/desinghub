import { describe, it, expect } from "vitest";
import { blockToRealJsx } from "../componentApiRegistry";

describe("PR-2 export correctness", () => {
  it("Fluent/MUI/Carbon/uoaui StatCard never emits NaN for non-numeric pct", () => {
    for (const ds of ["m3", "fluent", "carbon", "uoaui"] as const) {
      const out = blockToRealJsx(ds, { type: "SimulatedStatCard", props: { label: "Rev", value: "$1.2M", pct: "12%" } });
      expect(out, `${ds} statcard`).not.toMatch(/NaN/);
    }
  });
  it("Progress never emits NaN for non-numeric value", () => {
    for (const ds of ["salt", "m3", "fluent", "carbon"] as const) {
      const out = blockToRealJsx(ds, { type: "SimulatedProgress", props: { label: "L", value: "abc" } });
      if (out) expect(out, `${ds} progress`).not.toMatch(/NaN/);
    }
  });
  it("MUI Popover is self-contained (no undeclared open/anchorEl/handleClose)", () => {
    const out = blockToRealJsx("m3", { type: "SimulatedPopover", props: { title: "T", content: "C" } })!;
    expect(out).toContain("Paper");
    expect(out).not.toMatch(/open=\{open\}|anchorEl|handleClose/);
  });
  it("MUI Dialog has no undeclared handleClose", () => {
    const out = blockToRealJsx("m3", { type: "SimulatedDialog", props: { title: "T", message: "M" } })!;
    expect(out).not.toMatch(/handleClose/);
    expect(out).toContain("onClose={() => {}}");
  });
  it("Carbon NumberInput is uncontrolled (defaultValue, no bare controlled value=)", () => {
    const out = blockToRealJsx("carbon", { type: "SimulatedNumberInput", props: { label: "Qty", value: 5 } })!;
    expect(out).toContain("defaultValue=");
    expect(out).not.toMatch(/ value=\{/);
  });
  it("NumberInput non-numeric value falls back, not NaN", () => {
    for (const ds of ["salt", "m3", "fluent", "carbon", "uoaui"] as const) {
      const out = blockToRealJsx(ds, { type: "SimulatedNumberInput", props: { label: "L", value: "xyz", min: "a", max: "b", step: "c" } });
      if (out) expect(out, `${ds} numberinput`).not.toMatch(/NaN/);
    }
  });
});
