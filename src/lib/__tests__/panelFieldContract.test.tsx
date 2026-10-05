/* ════════════════════════════════════════════════════════════
   Panel Content fields are real: every field a general block offers writes
   a prop that the renderers draw in all five design systems.

   READS is built by reading the renderers (RealComponentRenderer's Salt /
   M3 / Fluent branches, realBlockMap's uoaui / Carbon entries, the
   Simulated fallback in ComponentRenderer, and the props applied before any
   of them in blockPropAdjust). A field added to the registry that no
   renderer reads fails here. KNOWN_PARTIAL lists fields some systems still
   ignore, so that list can only shrink.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, afterEach, beforeAll } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { BLOCK_FIELD_KEYS } from "@/lib/blockRegistry";
import { adjustBlockProps, adjustTableProps } from "@/lib/blockPropAdjust";
import { RealComponentRenderer } from "@/components/ui-kit/RealComponentRenderer";

const CHART_KEYS = ["title", "chartType", "hideLegend", "panel", "subtitle", "viewByCsv", "height"];
const PART_CHART_KEYS = ["title", "chartType", "centerLabel", "panel", "subtitle", "viewByCsv", "height"];

const READS: Record<string, string[]> = {
  SimulatedButton: ["label", "variant", "disabled"],
  SimulatedTitle: ["text", "level"],
  SimulatedTextInput: ["label", "placeholder", "value", "validationStatus", "disabled"],
  Alert: ["title", "message", "variant"],
  SimulatedCard: ["title", "content"],
  SimulatedBadge: ["label", "status"],
  SimulatedCheckbox: ["label", "defaultChecked"],
  SimulatedSwitch: ["label", "defaultOn"],
  SimulatedDropdown: ["label", "value", "optionsCsv", "placeholder"],
  SimulatedDataTable: ["maxRows", "hiddenColumnsCsv"],
  SimulatedStatCard: ["label", "value", "pct", "hideProgress"],
  SimulatedAvatar: ["src", "initials", "size", "presence"],
  SimulatedPill: ["label", "status", "dismissible"],
  SimulatedLink: ["text", "showIcon"],
  SimulatedProgress: ["label", "value"],
  SimulatedSearchbox: ["placeholder"],
  SimulatedAccordion: ["title", "content"],
  SimulatedSegmentedGroup: ["optionsCsv"],
  NavItem: ["label", "icon"],
  AppBrand: ["label"],
  StatusPill: ["label"],
  FooterText: ["label", "version"],
  HighchartLine: CHART_KEYS,
  HighchartArea: CHART_KEYS,
  HighchartColumn: CHART_KEYS,
  HighchartBar: CHART_KEYS,
  HighchartSpline: CHART_KEYS,
  HighchartStackedColumn: CHART_KEYS,
  HighchartPie: PART_CHART_KEYS,
  HighchartDonut: PART_CHART_KEYS,
  HighchartScatter: ["title"],
  HighchartHeatmap: ["title"],
  HighchartTreemap: ["title"],
  HighchartGauge: ["title", "value"],
};

/* Fields that some systems still ignore (system names in the value). */
const KNOWN_PARTIAL: Record<string, Record<string, string[]>> = {
  SimulatedAvatar: { presence: ["salt", "m3", "fluent"] },
  SimulatedPill: { dismissible: ["salt", "carbon"] },
  SimulatedLink: { showIcon: ["m3", "fluent"] },
  SimulatedProgress: { label: ["salt", "m3"] },
  NavItem: { icon: ["salt", "fluent", "carbon"] },
};

describe("panel Content fields vs renderers", () => {
  for (const [type, reads] of Object.entries(READS)) {
    it(`${type}: every field writes a prop the renderers read`, () => {
      const keys = BLOCK_FIELD_KEYS[type];
      expect(keys, `${type} is in the registry`).toBeDefined();
      for (const k of keys) expect(reads, `${type}.${k}`).toContain(k);
    });
  }

  it("covers every block on the Analytics Dashboard template", () => {
    for (const type of ["SimulatedTitle", "SimulatedDropdown", "SimulatedButton", "SimulatedStatCard", "HighchartArea", "HighchartColumn", "HighchartDonut", "SimulatedDataTable", "NavItem", "AppBrand", "StatusPill", "FooterText"]) {
      expect(READS[type], type).toBeDefined();
    }
  });

  it("the data table offers real controls, not only a hint", () => {
    expect(BLOCK_FIELD_KEYS.SimulatedDataTable).toEqual(expect.arrayContaining(["maxRows", "hiddenColumnsCsv"]));
  });

  it("known partial fields are still offered (the list only shrinks)", () => {
    for (const [type, fields] of Object.entries(KNOWN_PARTIAL)) {
      for (const k of Object.keys(fields)) expect(BLOCK_FIELD_KEYS[type]).toContain(k);
    }
  });
});

describe("data table rows shown / hidden columns", () => {
  const props = { columns: ["Order", "Customer", "Status"], rows: [["#1", "Ada", "Paid"], ["#2", "Bo", "Due"], ["#3", "Cy", "Paid"]] };

  it("an untouched table is passed through unchanged", () => {
    expect(adjustBlockProps("SimulatedDataTable", props)).toBe(props);
    expect(adjustTableProps({ ...props, maxRows: "" }).rows).toBe(props.rows);
  });

  it("rows shown caps the rows", () => {
    expect((adjustTableProps({ ...props, maxRows: "2" }).rows as unknown[]).length).toBe(2);
  });

  it("hidden columns drop the column and keep each cell under its header", () => {
    const out = adjustTableProps({ ...props, hiddenColumnsCsv: "customer" });
    expect(out.columns).toEqual(["Order", "Status"]);
    expect(out.rows).toEqual([{ Order: "#1", Customer: "Ada", Status: "Paid" }, { Order: "#2", Customer: "Bo", Status: "Due" }, { Order: "#3", Customer: "Cy", Status: "Paid" }]);
  });

  it("hiding every column keeps them all", () => {
    expect(adjustTableProps({ ...props, hiddenColumnsCsv: "Order, Customer, Status" }).columns).toEqual(props.columns);
  });
});

/* ── Render tests: the new props change the real component in every system ── */
beforeAll(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  if (typeof globalThis.ResizeObserver === "undefined") {
    globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
  }
  if (typeof window.matchMedia !== "function") {
    window.matchMedia = ((q: string) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  }
});

let root: Root | null = null;
let container: HTMLDivElement | null = null;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

function render(system: "salt" | "m3" | "fluent" | "uoaui" | "carbon", type: string, props: Record<string, unknown>): HTMLDivElement {
  container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container!);
    root.render(<RealComponentRenderer system={system} type={type} mode="light" saltDensity="medium" props={props} />);
  });
  return container;
}
const SYSTEMS = ["salt", "m3", "fluent", "uoaui", "carbon"] as const;
const progressSelector = '[role="progressbar"], .a-progress-track';

describe("new controls change the rendered block in all five systems", () => {
  for (const system of SYSTEMS) {
    it(`${system}: stat card hides its progress bar`, () => {
      const on = render(system, "SimulatedStatCard", { label: "MRR", value: "$1", pct: 40 });
      expect(on.querySelector(progressSelector)).not.toBeNull();
      act(() => root?.unmount()); on.remove();
      const off = render(system, "SimulatedStatCard", { label: "MRR", value: "$1", pct: 40, hideProgress: true });
      expect(off.querySelector(progressSelector)).toBeNull();
    });

    it(`${system}: data table shows the capped rows and drops a hidden column`, () => {
      const props = adjustTableProps({ columns: ["Order", "Customer", "Status"], rows: [["#1", "Ada", "Paid"], ["#2", "Bo", "Due"], ["#3", "Cy", "Paid"]], maxRows: "2", hiddenColumnsCsv: "Customer" });
      const el = render(system, "SimulatedDataTable", props);
      expect(el.querySelectorAll("tbody tr").length).toBe(2);
      expect(el.textContent).not.toContain("Ada");
      expect(el.textContent).not.toContain("Customer");
      expect(el.textContent).toContain("#2");
    });

    it(`${system}: button disabled`, () => {
      const el = render(system, "SimulatedButton", { label: "Export", variant: "secondary", disabled: true });
      expect(el.querySelector("button")!.disabled).toBe(true);
    });

    it(`${system}: text input disabled and value`, () => {
      const el = render(system, "SimulatedTextInput", { label: "Name", value: "Ada", disabled: true });
      const input = el.querySelector("input")!;
      expect(input.disabled).toBe(true);
      expect(input.value).toBe("Ada");
    });
  }

  it("salt: a badge status shows a status indicator", () => {
    const plain = render("salt", "SimulatedBadge", { label: "New", status: "default" });
    const plainHtml = plain.innerHTML;
    act(() => root?.unmount()); plain.remove();
    const el = render("salt", "SimulatedBadge", { label: "New", status: "error" });
    expect(el.innerHTML).not.toBe(plainHtml);
  });
});
