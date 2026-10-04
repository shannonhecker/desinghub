/* The issuer reports, the scorecard and the home page: structure, and that
   every bound block resolves against the sample dataset. */
import { describe, it, expect } from "vitest";
import { issuerClimate, issuerInvolvement, issuerControversies, entityComparison, governanceScorecard, analyticsHome } from "../issuerTemplates";
import { BUILDER_TEMPLATES, TEMPLATE_ORDER, templateCategory, hasUniformStructure, VALID_TEMPLATE_IDS } from "../builderTemplates";
import { TEMPLATE_SUMMARIES } from "../templateIds";
import { LIBRARY_BLUEPRINTS } from "../blockRegistry";
import { resolveBinding, type DataBinding } from "../reportData/binding";
import { isRecordBinding, isRowLookup, lookupRow, resolveRecord } from "../recordPanelModel";
import { issuerDataset, ISSUER_NAMES } from "../reportData/issuerDataset";
import { leafColumns } from "../dataGridModel";
import { parseTemplateCommand } from "../reportCommand";
import { viewByStateKey } from "../panelMetrics";

const TEMPLATES = [issuerClimate, issuerInvolvement, issuerControversies, entityComparison, governanceScorecard, analyticsHome];
const dataset = issuerDataset();
const known = new Set(LIBRARY_BLUEPRINTS.map((b) => b.type));
const isQuery = (b: unknown): b is DataBinding => typeof b === "object" && b !== null && Array.isArray((b as DataBinding).measures);
const bindingOf = (tpl: typeof issuerClimate, id: string) => tpl.body.find((b) => b.id === id)!.props.binding as DataBinding;

describe("issuer templates - structure", () => {
  for (const tpl of TEMPLATES) {
    it(`${tpl.label}: registered, Finance, uniform, summarised`, () => {
      expect(BUILDER_TEMPLATES[tpl.id]).toBe(tpl);
      expect(TEMPLATE_ORDER).toContain(tpl.id);
      expect(templateCategory(tpl.id)).toBe("finance");
      expect(hasUniformStructure(tpl.id)).toBe(true);
      expect(TEMPLATE_SUMMARIES[tpl.id].startsWith(tpl.label)).toBe(true);
    });

    it(`${tpl.label}: unique ids, known block types, heights, narrow-frame folds, rows of 12`, () => {
      const all = [...tpl.header, ...tpl.sidebar, ...tpl.body, ...tpl.footer];
      expect(new Set(all.map((b) => b.id)).size).toBe(all.length);
      for (const b of all) expect(known.has(b.type), `${b.id}: ${b.type}`).toBe(true);
      let run = 0;
      for (const b of tpl.body) {
        expect(b.props.height ?? b.layout?.height, `${b.id} height`).toBeTruthy();
        /* A block that fills its cell says so in its props too. */
        if (typeof b.props.height === "number" && b.layout?.height) expect(b.layout.height, b.id).toBe(`${b.props.height}px`);
        if (b.layout?.width !== "12fr") {
          expect(b.layout?.spanTablet, `${b.id} spanTablet`).toBeGreaterThanOrEqual(3);
          expect(b.layout?.spanPhone, `${b.id} spanPhone`).toBeGreaterThanOrEqual(6);
        }
        run += parseFloat(String(b.layout?.width ?? "12"));
        expect(run, `row overflows at ${b.id}`).toBeLessThanOrEqual(12);
        if (run === 12) run = 0;
      }
      expect(run).toBe(0);
    });

    it(`${tpl.label}: every binding resolves, with data, for every issuer`, () => {
      for (const entity of ISSUER_NAMES) {
        const state = { entity };
        for (const b of tpl.body) {
          const binding = b.props.binding;
          if (!binding) continue;
          if (isRecordBinding(binding)) {
            expect(resolveRecord(binding, dataset, state)?.sections.length, b.id).toBeGreaterThan(0);
          } else if (isQuery(binding)) {
            const bound = resolveBinding(binding, dataset, state);
            expect(bound, b.id).not.toBeNull();
            if (bound!.view === "grid") expect(bound!.rows.length, `${b.id} ${entity}`).toBeGreaterThan(0);
            if (bound!.view === "series") {
              /* An issuer compared with itself is one category. */
              expect(bound!.categories.length, `${b.id} ${entity}`).toBeGreaterThan(0);
              expect(bound!.series.length, `${b.id} ${entity}`).toBeGreaterThan(0);
            }
          } else if (isRowLookup(binding)) {
            expect(lookupRow(binding, dataset, state), b.id).not.toBeNull();
          }
        }
      }
    });
  }

  it("launcher cards point at templates that exist", () => {
    for (const b of analyticsHome.body.filter((x) => x.type === "LauncherCard")) {
      expect(VALID_TEMPLATE_IDS).toContain(b.props.templateId);
    }
  });
});

describe("issuer templates - behaviour", () => {
  it("Issuer Climate: the entity's bars sit beside the benchmark its View by names", () => {
    const summary = bindingOf(issuerClimate, "tpl-ic-summary");
    const industry = resolveBinding(summary, dataset, {});
    const region = resolveBinding(summary, dataset, { entity: "Helios Energy", [viewByStateKey("tpl-ic-summary")]: "Region" });
    if (industry?.view !== "series" || region?.view !== "series") throw new Error("expected series");
    expect(industry.series.map((s) => s.name)).toEqual(["Avocado Inc", "GICS industry average"]);
    expect(region.series.map((s) => s.name)).toEqual(["Helios Energy", "Region average"]);
    expect(industry.categories).toEqual(["Total carbon emissions $/m", "Carbon intensity (mkt cap)", "Carbon intensity (EVIC)"]);
  });

  it("Issuer Climate: a peer grid shows the one metric its View by names, ranked by it", () => {
    const id = "tpl-ic-universe-peers";
    const evic = resolveBinding(bindingOf(issuerClimate, id), dataset, {});
    const total = resolveBinding(bindingOf(issuerClimate, id), dataset, { [viewByStateKey(id)]: "Total emissions" });
    if (evic?.view !== "grid" || total?.view !== "grid") throw new Error("expected grids");
    expect(leafColumns(evic.columns).map((c) => c.header)).toEqual(["#", "Entity", "Intensity (EVIC)"]);
    expect(leafColumns(total.columns).map((c) => c.header)).toEqual(["#", "Entity", "Total emissions"]);
    const values = total.rows.map((r) => r.totalEmissions as number);
    expect(values).toEqual([...values].sort((a, b) => a - b));
    expect(total.rows.map((r) => r._rank)).toEqual([1, 2, 3, 4, 5]);
  });

  it("Business Involvement: the detail grid groups activities and counts the ties", () => {
    const grid = resolveBinding(bindingOf(issuerInvolvement, "tpl-ib-details"), dataset, { entity: "Helios Energy" });
    if (grid?.view !== "grid") throw new Error("expected a grid");
    const headings = grid.rows.filter((r) => r._heading);
    expect(headings.map((r) => r.activity)).toEqual(["Entertainment & Lifestyle", "Fossil Fuels & Energy", "Weapons & Defence"]);
    const entity = lookupRow({ table: "entities", keyField: "name", key: "Helios Energy" }, dataset, {})!;
    expect(headings.map((r) => r.count)).toEqual([entity.involvementEntertainment, entity.involvementEnergy, entity.involvementWeapons]);
    expect(grid.rows.filter((r) => !r._heading).every((r) => r._indent === 1)).toBe(true);
  });

  it("Controversies: pillar headings carry their categories' totals; Governance is a heading only", () => {
    const grid = resolveBinding(bindingOf(issuerControversies, "tpl-ico-grid"), dataset, {});
    if (grid?.view !== "grid") throw new Error("expected a grid");
    const labels = grid.rows.map((r) => r.category);
    expect(labels[0]).toBe("Environment");
    expect(labels[labels.length - 1]).toBe("Governance");
    const env = grid.rows[0];
    expect(env.total).toBe(grid.rows.slice(1, 5).reduce((a, r) => a + (r.total as number), 0));
  });

  it("Entity Comparison: both issuers in every chart, and the comparator follows its filter", () => {
    const scores = bindingOf(entityComparison, "tpl-ec-scores");
    const def = resolveBinding(scores, dataset, {});
    const other = resolveBinding(scores, dataset, { entity: "Meridian Banc", comparator: "Northwind Pharma" });
    if (def?.view !== "series" || other?.view !== "series") throw new Error("expected series");
    expect(def.series.map((s) => s.name)).toEqual(["Avocado Inc", "Helios Energy"]);
    expect(other.series.map((s) => s.name).sort()).toEqual(["Meridian Banc", "Northwind Pharma"]);
    expect(def.categories).toEqual(["ESG", "E", "S", "G"]);
  });

  it("Scorecard: a category filters both indicator grids, and View by swaps the second column", () => {
    const id = "tpl-sc-positive";
    const governance = resolveBinding(bindingOf(governanceScorecard, id), dataset, {});
    const product = resolveBinding(bindingOf(governanceScorecard, id), dataset, { "select:category": "Product & Service Mix", [viewByStateKey(id)]: "Status" });
    if (governance?.view !== "grid" || product?.view !== "grid") throw new Error("expected grids");
    expect(governance.rows).toHaveLength(6);
    expect(product.rows).toHaveLength(9);
    expect(leafColumns(governance.columns).map((c) => c.header)).toEqual(["Indicator", "Flags"]);
    expect(leafColumns(product.columns).map((c) => [c.header, c.cell?.type])).toEqual([["Indicator", undefined], ["Status", "chip"]]);
    const reference = resolveBinding(bindingOf(governanceScorecard, "tpl-sc-reference"), dataset, { [viewByStateKey("tpl-sc-reference")]: "Identifiers" });
    expect(reference?.view === "grid" && reference.rows.length).toBe(6);
  });

  it("Home: the class and theme filters narrow the list", () => {
    const grid = bindingOf(analyticsHome, "tpl-home-grid");
    const all = resolveBinding(grid, dataset, {});
    const company = resolveBinding(grid, dataset, { homeClass: "Company" });
    const both = resolveBinding(grid, dataset, { homeClass: "Company", homeTheme: "Other" });
    expect(all?.view === "grid" && all.rows.length).toBe(6);
    expect(company?.view === "grid" && company.rows.length).toBe(2);
    expect(both?.view === "grid" && both.rows.map((r) => r.name)).toEqual(["Governance Scorecard"]);
  });

  it("the chat knows the six templates by name", () => {
    expect(parseTemplateCommand("use the issuer climate template")).toEqual({ templateId: "issuer-climate" });
    expect(parseTemplateCommand("open the business involvement template")).toEqual({ templateId: "issuer-involvement" });
    expect(parseTemplateCommand("use the issuer controversies template")).toEqual({ templateId: "issuer-controversies" });
    expect(parseTemplateCommand("entity comparison template in fluent")).toEqual({ templateId: "entity-comparison", designSystem: "fluent" });
    expect(parseTemplateCommand("use the governance scorecard template")).toEqual({ templateId: "governance-scorecard" });
    expect(parseTemplateCommand("use the analytics home template")).toEqual({ templateId: "analytics-home" });
  });
});
