import { describe, it, expect } from "vitest";
import { parseTemplateCommand, parseReportFilterCommand, collectReportControls, describeReportFilterCommand } from "../reportCommand";
import { performanceAnalytics } from "../financeTemplates";

describe("parseTemplateCommand", () => {
  it("recognises a request for a template, with or without a theme", () => {
    expect(parseTemplateCommand("use the risk analytics template")).toEqual({ templateId: "risk-analytics" });
    expect(parseTemplateCommand("Performance Analytics template please")).toEqual({ templateId: "performance-analytics" });
    expect(parseTemplateCommand("load the performance report in Carbon, light mode")).toEqual({ templateId: "performance-analytics", designSystem: "carbon", mode: "light" });
    expect(parseTemplateCommand("open the landing page template")).toEqual({ templateId: "landing-page" });
  });

  it("leaves anything that asks for more to the model", () => {
    expect(parseTemplateCommand("use the risk analytics template and add a liquidity chart")).toBeNull();
    expect(parseTemplateCommand("what is in risk analytics")).toBeNull();
    expect(parseTemplateCommand("build a dashboard")).toBeNull();
    expect(parseTemplateCommand("risk analytics")).toBeNull();
  });
});

describe("parseReportFilterCommand", () => {
  const controls = collectReportControls([...performanceAnalytics.header, ...performanceAnalytics.body]);

  it("finds the template's filters and View by controls", () => {
    expect(controls.filter((c) => c.kind === "filter").map((c) => c.key)).toEqual(["feeType", "currency", "periodicity", "benchmark"]);
    expect(controls.filter((c) => c.kind === "viewBy").length).toBeGreaterThanOrEqual(3);
  });

  it("sets a filter named by one of its choices", () => {
    expect(parseReportFilterCommand("show it in USD", controls)?.changes).toEqual([{ key: "currency", value: "USD", label: "Currency", kind: "filter" }]);
    expect(parseReportFilterCommand("switch to gross of fees", controls)?.changes).toEqual([{ key: "feeType", value: "Gross of fees", label: "Fee type", kind: "filter" }]);
  });

  it("a shared View by choice applies to every panel that has it; naming a panel narrows it", () => {
    const all = parseReportFilterCommand("view by sector", controls)!;
    expect(all.changes.length).toBeGreaterThan(1);
    expect(all.changes.every((c) => c.value === "Sector" && c.kind === "viewBy")).toBe(true);
    const one = parseReportFilterCommand("show allocation by sector", controls)!;
    expect(one.changes.map((c) => c.label)).toEqual(["Allocation"]);
    expect(describeReportFilterCommand(one)).toBe("Allocation now shows Sector.");
  });

  it("reports nothing to change when the choice is already current", () => {
    const cmd = parseReportFilterCommand("show it in GBP", controls)!;
    expect(cmd.changes).toEqual([]);
    expect(describeReportFilterCommand(cmd)).toBe("That is already selected.");
  });

  it("leaves anything that asks for more to the model", () => {
    expect(parseReportFilterCommand("add a chart of USD exposure", controls)).toBeNull();
    expect(parseReportFilterCommand("make the title bigger", controls)).toBeNull();
    expect(parseReportFilterCommand("view by sector", [])).toBeNull();
  });
});
