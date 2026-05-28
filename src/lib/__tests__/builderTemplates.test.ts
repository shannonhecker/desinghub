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

  it("returns a template for every InterfaceType", () => {
    // After Task 2 lands, all 6 InterfaceTypes resolve to a template.
    expect(getFirstTemplateForInterface("dashboard")).not.toBeNull();
    expect(getFirstTemplateForInterface("form")).not.toBeNull();
    expect(getFirstTemplateForInterface("landing")).not.toBeNull();
    expect(getFirstTemplateForInterface("ecommerce")).not.toBeNull();
    expect(getFirstTemplateForInterface("blog")).not.toBeNull();
    expect(getFirstTemplateForInterface("portfolio")).not.toBeNull();
  });
});

describe("new interface templates", () => {
  it("returns marketing-landing for landing", () => {
    const t = getFirstTemplateForInterface("landing");
    expect(t).not.toBeNull();
    expect(t!.id).toBe("marketing-landing");
    expect(t!.interfaceType).toBe("landing");
    expect(t!.body.length).toBeGreaterThan(0);
    expect(t!.header.length).toBeGreaterThan(0);
    expect(t!.footer.length).toBeGreaterThan(0);
  });

  it("returns product-page for ecommerce", () => {
    const t = getFirstTemplateForInterface("ecommerce");
    expect(t).not.toBeNull();
    expect(t!.id).toBe("product-page");
  });

  it("returns article for blog", () => {
    const t = getFirstTemplateForInterface("blog");
    expect(t).not.toBeNull();
    expect(t!.id).toBe("article");
  });

  it("returns case-study-grid for portfolio", () => {
    const t = getFirstTemplateForInterface("portfolio");
    expect(t).not.toBeNull();
    expect(t!.id).toBe("case-study-grid");
  });
});
