import { describe, it, expect } from "vitest";
import {
  KIT_CATALOG,
  kitByCategory,
  kitEntry,
  kitExportCode,
} from "../kitCatalog";
import { LIBRARY_BLUEPRINTS } from "../blockRegistry";
import { blockToRealJsx, collectImports } from "../componentApiRegistry";

/* #6 — /ui-kit and /builder share ONE source of truth. The kit catalog is a
   projection of the builder's BLOCK_DEFS (via LIBRARY_BLUEPRINTS), and
   kitExportCode reuses blockToRealJsx + collectImports VERBATIM so the kit
   shows the EXACT per-DS handoff code the builder export emits. */

describe("kitCatalog — kit IS the builder's vocabulary (derived from BLOCK_DEFS)", () => {
  const builderTypes = new Set(LIBRARY_BLUEPRINTS.map((b) => b.type));
  /* Zone-chrome + LayoutGroup need group/zone context, not a standalone demo,
     so they're intentionally excluded from the kit gallery. */
  const HIDDEN = ["LayoutGroup", "AppBrand", "StatusPill", "NavItem", "FooterText"];

  it("lists builder block types sourced from BLOCK_DEFS / LIBRARY_BLUEPRINTS", () => {
    expect(KIT_CATALOG.length).toBeGreaterThan(0);
    for (const entry of KIT_CATALOG) {
      expect(builderTypes.has(entry.type)).toBe(true);
    }
  });

  it("includes core builder blocks (Button / Text Input / Card)", () => {
    const types = KIT_CATALOG.map((e) => e.type);
    expect(types).toContain("SimulatedButton");
    expect(types).toContain("SimulatedTextInput");
    expect(types).toContain("SimulatedCard");
  });

  it("excludes zone-chrome + LayoutGroup (no standalone demo)", () => {
    const types = KIT_CATALOG.map((e) => e.type);
    for (const hidden of HIDDEN) expect(types).not.toContain(hidden);
  });

  it("carries each block's builder defaults verbatim", () => {
    const button = kitEntry("SimulatedButton");
    expect(button).not.toBeNull();
    expect(button!.defaults).toMatchObject({ variant: "primary", label: "New Button" });
  });

  it("groups entries by the builder's own library categories", () => {
    const groups = kitByCategory();
    expect(groups.length).toBeGreaterThan(0);
    const actions = groups.find((g) => g.key === "actions");
    expect(actions?.items.map((e) => e.type)).toContain("SimulatedButton");
  });
});

describe("kitExportCode — shows the EXACT per-DS code the builder exports", () => {
  it('Salt button returns the real <Button sentiment=...> + @salt-ds/core import', () => {
    const { code, imports, isReal } = kitExportCode("salt", "SimulatedButton");
    expect(isReal).toBe(true);
    /* SimulatedButton's builder defaults are { variant: "primary", label: "New Button" }. */
    expect(code).toBe('<Button sentiment="accented" appearance="solid">New Button</Button>');
    expect(imports).toContain('import { Button } from "@salt-ds/core";');
  });

  it("is byte-identical to blockToRealJsx + collectImports for the same defaults", () => {
    const entry = kitEntry("SimulatedButton")!;
    const { code, imports } = kitExportCode("salt", "SimulatedButton");
    expect(code).toBe(
      blockToRealJsx("salt", { type: "SimulatedButton", props: entry.defaults }),
    );
    expect(imports).toEqual(collectImports("salt", ["SimulatedButton"]));
  });

  it("emits each DS's real component API for the same block (no generic pseudocode)", () => {
    expect(kitExportCode("m3", "SimulatedButton").code).toContain('variant="contained"');
    expect(kitExportCode("m3", "SimulatedButton").imports).toContain(
      'import { Button } from "@mui/material";',
    );
    expect(kitExportCode("fluent", "SimulatedButton").code).toContain('appearance="primary"');
    expect(kitExportCode("carbon", "SimulatedButton").code).toContain('kind="primary"');
    expect(kitExportCode("uoaui", "SimulatedButton").code).toContain('className="a-btn');
  });

  it("flags isReal=false when the registry has no entry for that block+DS", () => {
    /* uoaui intentionally omits SimulatedSwitch, so the kit shows the gap
       rather than a fabricated component. */
    expect(kitExportCode("uoaui", "SimulatedSwitch").isReal).toBe(false);
    expect(kitExportCode("uoaui", "SimulatedSwitch").code).toBe("");
  });
});
