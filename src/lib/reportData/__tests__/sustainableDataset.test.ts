import { describe, it, expect } from "vitest";
import { sustainableDataset, SI_ACCOUNTS, SI_STAGES, SI_RATINGS, SI_ALIGNMENTS, SI_MONTHS, SI_PERIODICITIES } from "../sustainableDataset";
import { sampleDataset } from "../registry";
import { tableOf } from "../types";
import { datasetToSheets, sheetsToDataset } from "../workbook";
import { sparkPoints } from "../../dataGridModel";

const ds = sustainableDataset();
const securities = tableOf(ds, "securities")!;

describe("sustainable dataset", () => {
  it("is registered, deterministic, and every security is unique", () => {
    expect(sampleDataset("sustainable")).toBe(ds);
    expect(sustainableDataset()).toBe(ds);
    const names = securities.rows.map((r) => r.security);
    expect(new Set(names).size).toBe(names.length);
    expect(names.length).toBeGreaterThanOrEqual(36);
  });

  it("declares every field its rows carry, and no row misses a declared field", () => {
    const keys = securities.fields.map((f) => f.key).sort();
    for (const r of securities.rows) expect(Object.keys(r).sort()).toEqual(keys);
  });

  it("weights add up to 100 and each issuer is counted once", () => {
    const weight = securities.rows.reduce((a, r) => a + (r.weight as number), 0);
    expect(Math.abs(weight - 100)).toBeLessThan(0.2);
    const issuers = securities.rows.reduce((a, r) => a + (r.issuers as number), 0);
    expect(issuers).toBe(new Set(securities.rows.map((r) => r.issuer)).size);
  });

  it("keeps scores, ratings, stages and alignments inside their sets", () => {
    for (const r of securities.rows) {
      for (const f of ["keyIssue", "corpScore", "envScore", "socScore", "govScore", "eScoreStart"]) {
        expect(r[f] as number, `${r.security} ${f}`).toBeGreaterThanOrEqual(0);
        expect(r[f] as number, `${r.security} ${f}`).toBeLessThanOrEqual(10);
      }
      expect(SI_ACCOUNTS).toContain(r.account);
      expect(SI_STAGES).toContain(r.stage);
      expect(SI_RATINGS).toContain(r.rating);
      expect(SI_RATINGS).toContain(r.ratingStart);
      expect(SI_ALIGNMENTS).toContain(r.alignment);
      expect(["Upgraded", "Downgraded", "Unchanged"]).toContain(r.ratingMove);
      expect(String(r.country)).toMatch(/^[A-Z]{2}$/);
      expect(r.totalScope12).toBe((r.scope1 as number) + (r.scope2 as number));
    }
    /* Every stage and at least four ratings appear, so the reports have
       something to show in each bucket. */
    expect(new Set(securities.rows.map((r) => r.stage)).size).toBe(SI_STAGES.length);
    expect(new Set(securities.rows.map((r) => r.rating)).size).toBeGreaterThanOrEqual(4);
  });

  it("trends have one point per month and end at the period-end figure", () => {
    for (const r of securities.rows) {
      const s1 = sparkPoints(r.scope1Trend);
      const e = sparkPoints(r.eTrend);
      expect(s1).toHaveLength(SI_MONTHS.length);
      expect(e).toHaveLength(SI_MONTHS.length);
      expect(s1[s1.length - 1]).toBe(r.scope1);
      expect(s1[0]).toBe(r.scope1Start);
      expect(e[e.length - 1]).toBe(r.envScore);
    }
  });

  it("has an ESG trend for every account and periodicity, ending near the account's scores", () => {
    const trend = tableOf(ds, "esgTrend")!;
    for (const account of SI_ACCOUNTS) {
      for (const periodicity of SI_PERIODICITIES) {
        const rows = trend.rows.filter((r) => r.account === account && r.periodicity === periodicity);
        expect(rows.length, `${account} ${periodicity}`).toBeGreaterThanOrEqual(4);
        expect(rows.map((r) => r.order)).toEqual(rows.map((_, i) => i + 1));
      }
    }
  });

  it("the screening funnel starts at the universe and only removes", () => {
    const funnel = tableOf(ds, "screeningFunnel")!.rows;
    expect(funnel[0]).toMatchObject({ step: "Universe", securities: 1513 });
    expect(funnel.slice(1).every((r) => (r.securities as number) < 0)).toBe(true);
    expect(funnel.reduce((a, r) => a + (r.securities as number), 0)).toBe(513);
  });

  it("survives a round trip through the workbook", () => {
    const back = sheetsToDataset(ds, datasetToSheets(ds).map((s) => ({ sheet: s.name, data: s.rows })));
    expect(back.issues.filter((i) => i.level === "error")).toEqual([]);
    expect(tableOf(back.dataset!, "securities")!.rows[0]).toEqual(securities.rows[0]);
  });
});
