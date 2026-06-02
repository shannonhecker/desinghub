import { describe, it, expect } from "vitest";
import {
  WIZARD_STEPS,
  stepIndex,
  nextStep,
  prevStep,
  interfaceTypeToTemplateId,
  interfaceTypeToBuildPrompt,
  densityLabel,
  buildSummarySentence,
  buildSummaryParts,
  DS_OPTIONS,
  MODE_OPTIONS,
} from "../wizardFlow";

describe("wizardFlow - step machine", () => {
  it("has exactly the five visible steps in order", () => {
    expect(WIZARD_STEPS).toEqual(["type", "style", "details", "audience", "confirm"]);
  });

  it("stepIndex is 1-based across the flow", () => {
    expect(stepIndex("type")).toBe(1);
    expect(stepIndex("style")).toBe(2);
    expect(stepIndex("details")).toBe(3);
    expect(stepIndex("audience")).toBe(4);
    expect(stepIndex("confirm")).toBe(5);
  });

  it("nextStep walks type -> ... -> confirm -> done", () => {
    expect(nextStep("type")).toBe("style");
    expect(nextStep("style")).toBe("details");
    expect(nextStep("details")).toBe("audience");
    expect(nextStep("audience")).toBe("confirm");
    expect(nextStep("confirm")).toBe("done");
    expect(nextStep("done")).toBe("done");
  });

  it("prevStep walks back and clamps at type", () => {
    expect(prevStep("confirm")).toBe("audience");
    expect(prevStep("audience")).toBe("details");
    expect(prevStep("details")).toBe("style");
    expect(prevStep("style")).toBe("type");
    expect(prevStep("type")).toBe("type");
  });
});

describe("wizardFlow - interfaceType mapping", () => {
  it("maps dashboard, form + landing onto shipped templates", () => {
    expect(interfaceTypeToTemplateId("dashboard")).toBe("analytics-dashboard");
    expect(interfaceTypeToTemplateId("form")).toBe("settings-page");
    expect(interfaceTypeToTemplateId("landing")).toBe("landing-page");
  });

  it("returns null for types with no template (route to layout preset)", () => {
    expect(interfaceTypeToTemplateId("ecommerce")).toBeNull();
    expect(interfaceTypeToTemplateId("blog")).toBeNull();
    expect(interfaceTypeToTemplateId("portfolio")).toBeNull();
  });

  it("build prompt is recognised by the layout-preset fast-path phrasing", () => {
    expect(interfaceTypeToBuildPrompt("landing")).toBe("Build a landing");
    expect(interfaceTypeToBuildPrompt("ecommerce")).toBe("Build a ecommerce");
    expect(interfaceTypeToBuildPrompt("portfolio")).toBe("Build a portfolio");
  });
});

describe("wizardFlow - density labels", () => {
  it("uses the canonical ladder for non-Carbon DSes", () => {
    expect(densityLabel("high", "salt")).toBe("High");
    expect(densityLabel("medium", "m3")).toBe("Medium");
    expect(densityLabel("low", "fluent")).toBe("Low");
    expect(densityLabel("touch", "uoaui")).toBe("Touch");
  });

  it("relabels for Carbon (compact/normal/spacious)", () => {
    expect(densityLabel("high", "carbon")).toBe("Compact");
    expect(densityLabel("medium", "carbon")).toBe("Normal");
    expect(densityLabel("low", "carbon")).toBe("Spacious");
  });
});

describe("wizardFlow - confirm summary", () => {
  it("builds the canonical one-sentence summary", () => {
    expect(
      buildSummarySentence({
        interfaceType: "dashboard",
        designSystem: "salt",
        mode: "light",
        density: "medium",
        audience: "internal",
      }),
    ).toBe("A Dashboard, built with Salt, light at medium density, for an internal tool.");
  });

  it("uses the correct article and audience phrasing for a public e-commerce store", () => {
    const parts = buildSummaryParts({
      interfaceType: "ecommerce",
      designSystem: "m3",
      mode: "dark",
      density: "high",
      audience: "public",
    });
    expect(parts.article).toBe("An");
    expect(parts.type).toBe("E-commerce store");
    expect(parts.ds).toBe("Material 3");
    expect(parts.look).toBe("dark at high density");
    expect(parts.audience).toBe("a public-facing site");
  });
});

describe("wizardFlow - onboarding option lists", () => {
  it("offers the five design systems in display order", () => {
    expect(DS_OPTIONS.map((o) => o.value)).toEqual([
      "salt",
      "m3",
      "fluent",
      "uoaui",
      "carbon",
    ]);
    DS_OPTIONS.forEach((o) => expect(o.label.length).toBeGreaterThan(0));
  });

  it("offers light then dark theme options with icons", () => {
    expect(MODE_OPTIONS.map((o) => o.value)).toEqual(["light", "dark"]);
    expect(MODE_OPTIONS.map((o) => o.icon)).toEqual(["light_mode", "dark_mode"]);
  });
});
