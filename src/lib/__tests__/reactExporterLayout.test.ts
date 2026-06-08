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

/* ── P3 export twin: a block's height (Fixed / Fill) must survive into the
   generated code on EVERY DS — even where the DS grid primitive (GridItem /
   Column) can't set height, the registry wraps the child in a styled div (the
   export trap). Asserts Salt (real component primitive) + Fluent (CSS-div DS). */
describe("reactExporter — P3 height projection reaches generated code", () => {
  const cardH = (id: string, height: string) => ({
    id,
    type: "SimulatedCard",
    props: { title: id, content: "x" },
    layout: { width: "6fr", height },
  });

  it("Salt grid: a Fixed 240px block emits height:\"240px\" inside the GridItem (wrapper div)", () => {
    setGridCanvas("salt", [cardH("a", "240px")]);
    const code = exportReact();
    // GridItem can't take height → registry wraps the child in <div style={{ height: "240px" }}>
    expect(code).toMatch(/<GridItem colSpan=\{6\}><div style=\{\{ height: "240px" \}\}>/);
  });

  it("Fluent grid (CSS-div DS): Fixed 240px merges into the column div's style", () => {
    setGridCanvas("fluent", [cardH("a", "240px")]);
    const code = exportReact();
    // Fluent already wraps each child in a <div style={{ gridColumn… }}> → height merges in
    expect(code).toMatch(/gridColumn: "span \d+", height: "240px"/);
  });

  it("Fill height projects height:\"100%\" (stretch) into generated code (Salt)", () => {
    setGridCanvas("salt", [cardH("a", "fill")]);
    const code = exportReact();
    expect(code).toContain('height: "100%"');
  });

  it("min/max height project even when height mode is Hug (no explicit height)", () => {
    setGridCanvas("salt", [{
      id: "a",
      type: "SimulatedCard",
      props: { title: "a", content: "x" },
      layout: { width: "6fr", minHeight: "120px", maxHeight: "400px" },
    } as never]);
    const code = exportReact();
    expect(code).toContain('minHeight: "120px"');
    expect(code).toContain('maxHeight: "400px"');
  });

  it("a block with NO height sizing emits NO wrapper div (lean output, common case)", () => {
    setGridCanvas("salt", [{
      id: "a",
      type: "SimulatedCard",
      props: { title: "a", content: "x" },
      layout: { width: "6fr" },
    } as never]);
    const code = exportReact();
    // GridItem child is the card JSX directly, no intervening height div
    expect(code).not.toMatch(/<GridItem colSpan=\{6\}><div style=\{\{ height/);
  });

  it("stack mode: Fixed height wraps each child via joinKids (Salt StackLayout)", () => {
    useBuilder.setState({
      designSystem: "salt" as never,
      mode: "light" as never,
      density: "medium",
      headerBlocks: [],
      sidebarBlocks: [],
      footerBlocks: [],
      blocks: [{
        id: "a",
        type: "SimulatedCard",
        props: { title: "a", content: "x" },
        layout: { height: "200px" },
      }] as never,
      zoneLayouts: { body: { mode: "stack", gap: 3 } } as never,
    });
    const code = exportReact();
    expect(code).toContain("<StackLayout");
    expect(code).toContain('<div style={{ height: "200px" }}>');
  });
});

/* ── P4 export twin: a zone's justify (main-axis distribution) + align
   (cross-axis) must survive into generated code on EVERY DS — natively where a
   DS layout primitive supports it (Salt FlexLayout justify/align prop), via a
   CSS-wrapper style fallback where it does not (Fluent/uoaui/Carbon divs, Salt
   GridLayout). Asserts Salt (real component primitive) + Fluent (CSS-div DS). */
describe("reactExporter — P4 justify/align projection reaches generated code", () => {
  const card = (id: string, span: number) => ({
    id,
    type: "SimulatedCard",
    props: { title: id, content: "x" },
    layout: { width: `${span}fr` },
  });

  function setRowCanvas(ds: string, justify: string, align: string) {
    useBuilder.setState({
      designSystem: ds as never,
      mode: "light" as never,
      density: "medium",
      headerBlocks: [],
      sidebarBlocks: [],
      footerBlocks: [],
      blocks: [card("a", 6), card("b", 6)] as never,
      zoneLayouts: { body: { mode: "row", gap: 3, justify, align } } as never,
    });
  }

  it("Salt row: space-between + center reach FlexLayout as NATIVE justify/align props", () => {
    setRowCanvas("salt", "space-between", "center");
    const code = exportReact();
    expect(code).toContain('<FlexLayout gap={3} justify="space-between" align="center">');
  });

  it("Fluent row (CSS-div DS): space-between + center merge into the container div style", () => {
    setRowCanvas("fluent", "space-between", "center");
    const code = exportReact();
    expect(code).toContain('justifyContent: "space-between"');
    expect(code).toContain('alignItems: "center"');
  });

  it("Salt grid: justify wraps GridLayout in a styled grid div (GridLayout has no justify prop)", () => {
    useBuilder.setState({
      designSystem: "salt" as never,
      mode: "light" as never,
      density: "medium",
      headerBlocks: [],
      sidebarBlocks: [],
      footerBlocks: [],
      blocks: [card("a", 6), card("b", 6)] as never,
      zoneLayouts: { body: { mode: "grid", columns: 12, gap: 3, justify: "center", align: "end" } } as never,
    });
    const code = exportReact();
    // grid justify -> justify-items; cross-axis -> align-items; wraps the GridLayout
    expect(code).toMatch(/<div style=\{\{ display: "grid", justifyItems: "center", alignItems: "flex-end" \}\}><GridLayout/);
  });

  it("a zone with NO justify/align emits NO style/native attr (lean output, common case)", () => {
    setGridCanvas("salt", [card("a", 6)]);
    const code = exportReact();
    expect(code).not.toContain("justifyContent");
    expect(code).not.toContain("justifyItems");
    expect(code).not.toContain('justify="');
  });
});
