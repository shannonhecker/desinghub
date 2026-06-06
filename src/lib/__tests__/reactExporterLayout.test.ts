import { describe, it, expect } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import { exportReact } from "../export/reactExporter";

/* Phase: wire the DS-owned layout registry into the export path. A grid-mode
   body zone must emit each DS's REAL grid primitive (not a generic zone div),
   carrying each block's canonical 12-fr span normalized to the DS's grid. */
function setGridCanvas(ds: string, blocks: unknown[]) {
  useBuilder.setState({
    designSystem: ds as never,
    mode: "light" as never,
    density: "medium",
    headerBlocks: [],
    sidebarBlocks: [],
    footerBlocks: [],
    blocks: blocks as never,
    zoneLayouts: { body: { mode: "grid", columns: 12, gap: 3 } } as never,
  });
}
const card = (id: string, span: number) => ({
  id,
  type: "SimulatedCard",
  props: { title: id, content: "x" },
  layout: { width: `${span}fr` },
});

describe("reactExporter — body grid emits real DS layout primitives", () => {
  it("Salt: GridLayout + GridItem colSpan + @salt-ds/core layout IMPORT line", () => {
    setGridCanvas("salt", [card("a", 6), card("b", 6)]);
    const code = exportReact();
    expect(code).toContain("<GridLayout columns={12}");
    expect(code).toContain("<GridItem colSpan={6}>");
    // assert the IMPORT line end-to-end (not just the JSX usage) — guards the
    // layoutImports wiring in exportReact.
    expect(code).toMatch(/import \{[^}]*\bGridLayout\b[^}]*\} from "@salt-ds\/core";/);
    expect(code).not.toContain('className="zone-body"'); // no generic div for the body
  });

  it("Carbon: Grid + Column lg normalized to 16-col (6fr -> lg=8) + import line", () => {
    setGridCanvas("carbon", [card("a", 6)]);
    const code = exportReact();
    expect(code).toContain("<Grid>");
    expect(code).toContain("<Column lg={8}>");
    expect(code).toMatch(/import \{[^}]*\bColumn\b[^}]*\} from "@carbon\/react";/);
  });

  it("M3: Grid container + Grid size (12-col) + import line", () => {
    setGridCanvas("m3", [card("a", 6)]);
    const code = exportReact();
    expect(code).toContain("<Grid container");
    expect(code).toContain("<Grid size={6}>");
    expect(code).toMatch(/import \{[^}]*\bGrid\b[^}]*\} from "@mui\/material";/);
  });

  it("spanOf: % width maps proportionally (50% of 12 -> colSpan 6)", () => {
    setGridCanvas("salt", [{ ...card("a", 6), layout: { width: "50%" } } as never]);
    expect(exportReact()).toContain("<GridItem colSpan={6}>");
  });

  it("spanOf: missing/fill width spans the full native row (colSpan 12)", () => {
    setGridCanvas("salt", [{ id: "a", type: "SimulatedCard", props: { title: "a", content: "x" } } as never]);
    expect(exportReact()).toContain("<GridItem colSpan={12}>");
  });

  it("M3 SearchBox emits MUI v9 slotProps, NOT the removed InputProps (export pins MUI ^9)", () => {
    setGridCanvas("m3", [{ id: "s", type: "SimulatedSearchbox", props: { placeholder: "Find" }, layout: { width: "12fr" } } as never]);
    const code = exportReact();
    expect(code).toContain("slotProps={{ input:");
    expect(code).not.toContain("InputProps=");
  });
});
