import { describe, it, expect } from "vitest";
import { BUILDER_TEMPLATES } from "../builderTemplates";

/* Sub-slice 1A: the analytics-dashboard pattern follows the researched
   inverted-pyramid canonical structure (scope bar -> 4 KPI cards lead ->
   full-width hero trend -> 2-up supporting charts -> one detail table last),
   with clean widths that don't trip the row-mode gap/percentage wrap. */
const ad = BUILDER_TEMPLATES["analytics-dashboard"];

describe("analytics-dashboard canonical structure", () => {
  it("leads with a KPI row of 4 stat cards (not 3)", () => {
    expect(ad.body.filter((b) => b.type === "SimulatedStatCard")).toHaveLength(4);
  });

  it("KPIs come before any chart (lead, not buried)", () => {
    const firstKpi = ad.body.findIndex((b) => b.type === "SimulatedStatCard");
    const firstChart = ad.body.findIndex((b) => b.type.startsWith("Highchart"));
    expect(firstKpi).toBeGreaterThanOrEqual(0);
    expect(firstChart).toBeGreaterThan(firstKpi);
  });

  it("has a hero chart plus a 2-up supporting row (>= 3 charts)", () => {
    expect(ad.body.filter((b) => b.type.startsWith("Highchart")).length).toBeGreaterThanOrEqual(3);
  });

  it("ends with a single data table", () => {
    expect(ad.body[ad.body.length - 1].type).toBe("SimulatedDataTable");
  });

  it("uses clean body widths (no bare % mixed with fill that wraps)", () => {
    const widths = ad.body.map((b) => b.layout?.width).filter(Boolean) as string[];
    expect(widths.every((w) => ["fill", "25%", "50%", "auto"].includes(w))).toBe(true);
  });
});
