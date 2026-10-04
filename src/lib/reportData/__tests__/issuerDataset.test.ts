import { describe, it, expect } from "vitest";
import { issuerDataset, ISSUER_NAMES, RATING_SCALE, ISSUER_QUARTERS, PATHWAY_YEARS, SCORECARD_CATEGORIES } from "../issuerDataset";
import { sampleDataset } from "../registry";
import { tableOf } from "../types";
import { datasetToSheets, sheetsToDataset } from "../workbook";

const ds = issuerDataset();
const rows = (id: string) => tableOf(ds, id)!.rows;

describe("issuer dataset", () => {
  it("is registered and deterministic", () => {
    expect(sampleDataset("issuer")).toBe(ds);
    expect(issuerDataset()).toBe(ds);
    expect(ISSUER_NAMES).toHaveLength(5);
  });

  it("every table's rows carry exactly the fields it declares", () => {
    for (const t of ds.tables) {
      const keys = t.fields.map((f) => f.key).sort();
      for (const r of t.rows) expect(Object.keys(r).sort(), t.id).toEqual(keys);
    }
  });

  it("an entity's counts agree with its detail rows", () => {
    for (const e of rows("entities")) {
      const name = e.name as string;
      const ties = rows("involvement").filter((r) => r.entity === name && r.tie === "Yes");
      const tiesIn = (g: string) => ties.filter((r) => r.group === g).length;
      expect(e.involvementEntertainment, name).toBe(tiesIn("Entertainment & Lifestyle"));
      expect(e.involvementEnergy, name).toBe(tiesIn("Fossil Fuels & Energy"));
      expect(e.involvementWeapons, name).toBe(tiesIn("Weapons & Defence"));
      const pillar = (p: string) => rows("controversies").filter((r) => r.entity === name && r.pillar === p).reduce((a, r) => a + (r.total as number), 0);
      expect(e.controversyEnv, name).toBe(pillar("Environment"));
      expect(e.controversySoc, name).toBe(pillar("Social"));
      expect(e.controversyGov, name).toBe(pillar("Governance"));
      expect((e.humanRights as number) + (e.customers as number) + (e.labourRights as number), name).toBe(e.controversySoc);
      expect(RATING_SCALE).toContain(e.rating);
      expect(["good", "bad"]).toContain(e.alignmentTone);
    }
  });

  it("a controversy's severities add up to its total, and a tie has a revenue figure", () => {
    for (const r of rows("controversies")) expect((r.moderate as number) + (r.severe as number) + (r.verySevere as number)).toBe(r.total);
    for (const r of rows("involvement")) expect(r.maxRevenue === null).toBe(r.tie === "No");
  });

  it("has every chart's series for every issuer", () => {
    const series = rows("issuerSeries");
    for (const name of ISSUER_NAMES) {
      const own = series.filter((r) => r.entity === name);
      expect(own.filter((r) => r.chart === "ratingTrend")).toHaveLength(ISSUER_QUARTERS.length);
      expect(own.filter((r) => r.chart === "esgScores")).toHaveLength(4);
      expect(own.filter((r) => r.chart === "emissionsSummary" && r.set === "Entity")).toHaveLength(3);
      expect(own.filter((r) => r.chart === "emissionsSummary" && r.set === "GICS industry")).toHaveLength(3);
      expect(own.filter((r) => r.chart === "involvement" && r.set === "Entity")).toHaveLength(8);
      expect(rows("pathway").filter((r) => r.entity === name)).toHaveLength(PATHWAY_YEARS.length);
    }
    for (const r of series.filter((x) => x.chart === "ratingTrend")) {
      expect(r.value as number).toBeGreaterThanOrEqual(0);
      expect(r.value as number).toBeLessThan(RATING_SCALE.length);
    }
  });

  it("the pathway's ceiling falls to zero and an aligned issuer stays under it", () => {
    const aligned = rows("entities").find((e) => e.alignmentTone === "good")!.name;
    const path = rows("pathway").filter((r) => r.entity === aligned);
    expect(path[path.length - 1].budget).toBe(0);
    expect(path.every((r) => (r.projected as number) <= (r.budget as number))).toBe(true);
  });

  it("scorecard categories count the indicators that are met or raised", () => {
    const cats = rows("categories");
    expect(cats.map((c) => c.category)).toEqual([...SCORECARD_CATEGORIES]);
    const governance = cats[0];
    expect(governance.positive).toBe(rows("indicators").filter((r) => r.category === "Corporate Governance" && r.polarity === "Positive" && r.flag === 1).length);
    expect(governance.negative).toBeGreaterThan(0);
  });

  it("survives a round trip through the workbook, blanks included", () => {
    const back = sheetsToDataset(ds, datasetToSheets(ds).map((s) => ({ sheet: s.name, data: s.rows })));
    expect(back.issues.filter((i) => i.level === "error")).toEqual([]);
    expect(tableOf(back.dataset!, "entities")!.rows[0]).toEqual(rows("entities")[0]);
    const noTie = rows("involvement").findIndex((r) => r.tie === "No");
    expect(tableOf(back.dataset!, "involvement")!.rows[noTie].maxRevenue ?? null).toBeNull();
  });
});
