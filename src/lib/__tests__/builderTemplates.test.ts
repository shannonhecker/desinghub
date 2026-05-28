import { describe, it, expect } from "vitest";
import { getFirstTemplateForInterface, BUILDER_TEMPLATES } from "../builderTemplates";

describe("getFirstTemplateForInterface", () => {
  it("returns the alphabetically-first dashboard template", () => {
    const t = getFirstTemplateForInterface("dashboard");
    expect(t).not.toBeNull();
    expect(t!.interfaceType).toBe("dashboard");
    // alphabetically-first of {analytics-dashboard, crm-contacts}
    expect(t!.id).toBe("analytics-dashboard");
  });

  it("returns the alphabetically-first form template", () => {
    const t = getFirstTemplateForInterface("form");
    expect(t).not.toBeNull();
    expect(t!.interfaceType).toBe("form");
    // alphabetically-first of {login-flow, settings-page}
    expect(t!.id).toBe("login-flow");
  });

  it("returns null for interfaces with no matching template", () => {
    expect(getFirstTemplateForInterface("landing")).toBeNull();
    expect(getFirstTemplateForInterface("ecommerce")).toBeNull();
    expect(getFirstTemplateForInterface("blog")).toBeNull();
    expect(getFirstTemplateForInterface("portfolio")).toBeNull();
  });
});
