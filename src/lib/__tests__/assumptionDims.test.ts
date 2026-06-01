import { describe, it, expect } from "vitest";
import {
  buildAssumptionDims,
  audienceUnguessable,
  cycleNext,
  DS_ORDER,
  IFACE_ORDER,
  DENSITY_ORDER,
} from "../assumptionDims";

describe("buildAssumptionDims", () => {
  const base = {
    designSystem: "salt" as const,
    interfaceType: "dashboard" as const,
    mode: "dark" as const,
    density: "medium",
  };

  it("produces exactly 4 dims in iface/ds/mode/density order", () => {
    const dims = buildAssumptionDims(base);
    expect(dims).toHaveLength(4);
    expect(dims.map((d) => d.key)).toEqual(["iface", "ds", "mode", "density"]);
  });

  it("labels each dim from the current store value", () => {
    const dims = buildAssumptionDims(base);
    const byKey = Object.fromEntries(dims.map((d) => [d.key, d]));
    expect(byKey.iface.label).toBe("dashboard");
    expect(byKey.ds.label).toBe("Salt DS");
    expect(byKey.mode.label).toBe("dark");
    expect(byKey.density.label).toBe("medium density");
  });

  it("cycles each dim to the next value and builds a matching imperative", () => {
    const dims = buildAssumptionDims(base);
    const byKey = Object.fromEntries(dims.map((d) => [d.key, d]));

    // dashboard -> form
    expect(byKey.iface.nextValue).toBe("form");
    expect(byKey.iface.imperative).toBe("Make it a form instead");

    // salt -> m3 (uses the display label in the imperative)
    expect(byKey.ds.nextValue).toBe("m3");
    expect(byKey.ds.imperative).toBe("Use Material 3 instead");

    // dark -> light
    expect(byKey.mode.nextValue).toBe("light");
    expect(byKey.mode.imperative).toBe("Switch to light mode");

    // medium -> low
    expect(byKey.density.nextValue).toBe("low");
    expect(byKey.density.imperative).toBe("Use low density");
  });

  it("gives every dim an aria-label that states the current value", () => {
    const dims = buildAssumptionDims(base);
    expect(dims.every((d) => d.ariaLabel.toLowerCase().includes("currently"))).toBe(
      true,
    );
    const ds = dims.find((d) => d.key === "ds")!;
    expect(ds.ariaLabel).toContain("currently Salt DS");
  });

  it("light mode flips to dark", () => {
    const dims = buildAssumptionDims({ ...base, mode: "light" });
    const mode = dims.find((d) => d.key === "mode")!;
    expect(mode.nextValue).toBe("dark");
    expect(mode.imperative).toBe("Switch to dark mode");
  });

  it("handles a density value outside the canonical order (Carbon tier)", () => {
    // 'normal' is not in DENSITY_ORDER -> cycleNext returns the first entry
    const dims = buildAssumptionDims({ ...base, density: "normal" });
    const density = dims.find((d) => d.key === "density")!;
    expect(density.label).toBe("normal density");
    expect(density.nextValue).toBe("high");
  });

  it("wraps cycles at the end of each order", () => {
    const dims = buildAssumptionDims({
      designSystem: "carbon",
      interfaceType: "portfolio",
      mode: "dark",
      density: "touch",
    });
    const byKey = Object.fromEntries(dims.map((d) => [d.key, d]));
    expect(byKey.ds.nextValue).toBe("salt"); // carbon is last -> wraps
    expect(byKey.iface.nextValue).toBe("dashboard"); // portfolio is last -> wraps
    expect(byKey.density.nextValue).toBe("high"); // touch is last -> wraps
  });
});

describe("cycleNext", () => {
  it("advances within the order", () => {
    expect(cycleNext(DS_ORDER, "salt")).toBe("m3");
    expect(cycleNext(IFACE_ORDER, "form")).toBe("landing");
    expect(cycleNext(DENSITY_ORDER, "high")).toBe("medium");
  });

  it("wraps at the end", () => {
    expect(cycleNext(DS_ORDER, "carbon")).toBe("salt");
  });

  it("returns the first entry for an unknown value", () => {
    expect(cycleNext(DENSITY_ORDER, "spacious")).toBe("high");
  });
});

describe("audienceUnguessable", () => {
  it("gates an app-like prompt with no audience signal", () => {
    expect(audienceUnguessable("a dashboard for my SaaS")).toBe(true);
    expect(audienceUnguessable("build me an analytics tool")).toBe(true);
  });

  it("does NOT gate when an internal signal is present", () => {
    expect(audienceUnguessable("an internal admin dashboard for the team")).toBe(
      false,
    );
    expect(audienceUnguessable("an ops console for staff")).toBe(false);
  });

  it("does NOT gate when a public signal is present", () => {
    expect(audienceUnguessable("a public marketing landing page")).toBe(false);
    expect(audienceUnguessable("a customer-facing portal")).toBe(false);
  });

  it("does NOT gate a non-app-like prompt (errs toward building)", () => {
    expect(audienceUnguessable("a thing for my users")).toBe(false);
    expect(audienceUnguessable("a recipe page")).toBe(false);
  });
});
