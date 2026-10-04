/* The Sustainable Investment templates: structure, and that every bound
   block resolves against the sample dataset. */
import { describe, it, expect } from "vitest";
import { esgAnalytics, climateAnalytics, screening, screeningChangesTemplate } from "../sustainableTemplates";
import { BUILDER_TEMPLATES, TEMPLATE_ORDER, templateCategory, hasUniformStructure } from "../builderTemplates";
import { TEMPLATE_SUMMARIES } from "../templateIds";
import { LIBRARY_BLUEPRINTS } from "../blockRegistry";
import { resolveBinding, type DataBinding } from "../reportData/binding";
import { isRecordBinding, resolveRecord } from "../recordPanelModel";
import { sustainableDataset } from "../reportData/sustainableDataset";
import { leafColumns } from "../dataGridModel";
import { parseTemplateCommand } from "../reportCommand";

const TEMPLATES = [esgAnalytics, climateAnalytics, screening, screeningChangesTemplate];
const dataset = sustainableDataset();
const known = new Set(LIBRARY_BLUEPRINTS.map((b) => b.type));

describe("sustainable templates - structure", () => {
  for (const tpl of TEMPLATES) {
    it(`${tpl.label}: registered, in the Finance category, with a summary and uniform structure`, () => {
      expect(BUILDER_TEMPLATES[tpl.id]).toBe(tpl);
      expect(TEMPLATE_ORDER).toContain(tpl.id);
      expect(templateCategory(tpl.id)).toBe("finance");
      expect(hasUniformStructure(tpl.id)).toBe(true);
      expect(TEMPLATE_SUMMARIES[tpl.id].startsWith(tpl.label)).toBe(true);
      expect(tpl.datasetId).toBe("sustainable");
    });

    it(`${tpl.label}: unique ids, known block types, a height on every body block and a fold for narrow frames`, () => {
      const all = [...tpl.header, ...tpl.sidebar, ...tpl.body, ...tpl.footer];
      expect(new Set(all.map((b) => b.id)).size).toBe(all.length);
      for (const b of all) expect(known.has(b.type), `${b.id}: ${b.type}`).toBe(true);
      for (const b of tpl.body) {
        const height = b.props.height ?? b.layout?.height;
        expect(height, `${b.id} height`).toBeTruthy();
        if (b.layout?.width !== "12fr") {
          expect(b.layout?.spanTablet, `${b.id} spanTablet`).toBeGreaterThanOrEqual(3);
          expect(b.layout?.spanPhone, `${b.id} spanPhone`).toBeGreaterThanOrEqual(6);
        }
      }
    });

    it(`${tpl.label}: body rows add up to 12 columns`, () => {
      let run = 0;
      for (const b of tpl.body) {
        const fr = parseFloat(String(b.layout?.width ?? "12"));
        run += fr;
        expect(run, `row overflows at ${b.id}`).toBeLessThanOrEqual(12);
        if (run === 12) run = 0;
      }
      expect(run).toBe(0);
    });

    it(`${tpl.label}: the two-bar header, the grouped sidebar with its page active, no footer`, () => {
      expect(tpl.header.map((b) => b.type)).toEqual(["TopNav", "TabStrip"]);
      expect(tpl.sidebar.filter((b) => b.type === "NavGroup").map((b) => b.props.label)).toEqual(["Portfolio", "Screening", "Issuer report", "Scorecard"]);
      expect(tpl.sidebar.filter((b) => b.type === "NavItem" && b.props.active)).toHaveLength(1);
      expect(tpl.zoneLayouts?.footer?.visible).toBe(false);
      expect(tpl.zoneLayouts?.sidebar?.visible).not.toBe(false);
    });

    it(`${tpl.label}: every binding resolves, with data`, () => {
      for (const b of tpl.body) {
        const binding = b.props.binding;
        if (!binding) continue;
        if (isRecordBinding(binding)) {
          expect(resolveRecord(binding, dataset, {}), b.id).toBeNull();
          const first = String(dataset.tables[0].rows[0][binding.keyField]);
          const record = resolveRecord(binding, dataset, { [binding.state]: first });
          expect(record?.title, b.id).toBe(first);
          expect(record!.sections.length, b.id).toBeGreaterThan(2);
          continue;
        }
        const bound = resolveBinding(binding as DataBinding, dataset, {});
        expect(bound, b.id).not.toBeNull();
        if (bound!.view === "grid") {
          expect(bound!.rows.length, b.id).toBeGreaterThan(2);
          const fields = leafColumns(bound!.columns).map((c) => c.field);
          expect(new Set(fields).size, `${b.id} duplicate columns`).toBe(fields.length);
        } else if (bound!.view === "series") {
          expect(bound!.categories.length, b.id).toBeGreaterThan(1);
          expect(bound!.series.length, b.id).toBeGreaterThan(0);
        } else if (bound!.view === "parts") {
          expect(bound!.seriesData.length, b.id).toBeGreaterThan(1);
        } else {
          expect(bound!.value, b.id).toBeGreaterThan(0);
        }
      }
    });
  }
});

describe("sustainable templates - behaviour", () => {
  const bindingOf = (tpl: typeof esgAnalytics, id: string) => tpl.body.find((b) => b.id === id)!.props.binding as DataBinding;

  it("ESG: selecting an account re-scopes the gauges and the rating distribution", () => {
    const gauge = bindingOf(esgAnalytics, "tpl-esg-gauge-e");
    const all = resolveBinding(gauge, dataset, {});
    const one = resolveBinding(gauge, dataset, { "select:esg": "Climate Transition Bond" });
    expect(all).toMatchObject({ view: "value" });
    expect(one).not.toEqual(all);
    /* The Total row means everything. */
    expect(resolveBinding(gauge, dataset, { "select:esg": "Total" })).toEqual(all);
  });

  it("ESG: the rating distribution runs best to worst and the summary's first column follows View by", () => {
    const ratings = resolveBinding(bindingOf(esgAnalytics, "tpl-esg-ratings"), dataset, {});
    if (ratings?.view !== "series") throw new Error("expected series");
    const order = ["AAA", "AA", "A", "BBB", "BB", "B", "CCC"];
    expect(ratings.categories).toEqual(order.filter((r) => ratings.categories.includes(r)));
    const summary = bindingOf(esgAnalytics, "tpl-esg-summary");
    const bySector = resolveBinding(summary, dataset, { "viewBy:tpl-esg-summary": "Sector" });
    expect(bySector?.view === "grid" && leafColumns(bySector.columns)[0].header).toBe("Sector");
    expect(bySector?.view === "grid" && bySector.rows[0]).toMatchObject({ _group: "Total", _bold: true });
  });

  it("ESG: periodicity changes the trend's periods", () => {
    const trend = bindingOf(esgAnalytics, "tpl-esg-trend");
    const monthly = resolveBinding(trend, dataset, {});
    const yearly = resolveBinding(trend, dataset, { periodicity: "Yearly" });
    expect(monthly?.view === "series" && monthly.categories).toEqual(["Aug 24", "Sep 24", "Oct 24", "Nov 24", "Dec 24"]);
    expect(yearly?.view === "series" && yearly.categories).toEqual(["2021", "2022", "2023", "2024"]);
  });

  it("Climate: currency converts money and leaves emissions alone", () => {
    const summary = bindingOf(climateAnalytics, "tpl-climate-summary");
    const gbp = resolveBinding(summary, dataset, {});
    const usd = resolveBinding(summary, dataset, { currency: "USD" });
    if (gbp?.view !== "grid" || usd?.view !== "grid") throw new Error("expected grids");
    expect(usd.rows[0].marketValue).toBeCloseTo((gbp.rows[0].marketValue as number) * 1.27, 0);
    expect(usd.rows[0].totalScope12).toBe(gbp.rows[0].totalScope12);
  });

  it("Screening: the waterfall closes at the target, and a selected stage filters the universe", () => {
    const funnel = resolveBinding(bindingOf(screening, "tpl-screening-funnel"), dataset, {});
    if (funnel?.view !== "parts") throw new Error("expected parts");
    expect(funnel.seriesData.map((p) => p.name)).toEqual(["Universe", "House", "Non SI", "Top Down", "Bottom Up", "Target Fund"]);
    expect(funnel.seriesData[5]).toMatchObject({ isSum: true });
    const universe = bindingOf(screening, "tpl-screening-universe");
    const all = resolveBinding(universe, dataset, {});
    const house = resolveBinding(universe, dataset, { "select:stage": "House" });
    const reset = resolveBinding(universe, dataset, { "select:stage": "Universe" });
    if (all?.view !== "grid" || house?.view !== "grid" || reset?.view !== "grid") throw new Error("expected grids");
    expect(house.rows.length).toBeGreaterThan(0);
    expect(house.rows.length).toBeLessThan(all.rows.length);
    expect(reset.rows.length).toBe(all.rows.length);
  });

  it("Changes: the grid carries chips, a sparkline delta, badges, a toned word and a heat cell", () => {
    const grid = resolveBinding(bindingOf(screeningChangesTemplate, "tpl-changes-grid"), dataset, {});
    if (grid?.view !== "grid") throw new Error("expected a grid");
    const cells = leafColumns(grid.columns).map((c) => c.cell?.type).filter(Boolean);
    expect(cells).toEqual(["flag", "deltaChip", "deltaChip", "deltaChip", "delta", "badge", "badge", "toneText", "heat", "sparkline"]);
    expect(String(grid.rows[0].scope1Trend).split(",")).toHaveLength(9);
    expect(grid.columns.filter((c) => "children" in c).map((c) => c.header)).toEqual(["Overall flags", "Scope 1 emissions", "ESG rating", "E score"]);
  });

  it("the chat knows the four templates by name", () => {
    expect(parseTemplateCommand("use the esg analytics template")).toEqual({ templateId: "esg-analytics" });
    expect(parseTemplateCommand("climate analytics template in carbon")).toEqual({ templateId: "climate-analytics", designSystem: "carbon" });
    expect(parseTemplateCommand("open the screening changes template")).toEqual({ templateId: "screening-changes" });
    expect(parseTemplateCommand("use the screening template")).toEqual({ templateId: "screening" });
  });
});
