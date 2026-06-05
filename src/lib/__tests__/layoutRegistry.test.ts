import { describe, it, expect } from "vitest";
import { resolveLayoutApi, layoutToJsx, collectLayoutImports } from "../layoutRegistry";

/* Phase 0 of the DS-owned layout registry. layoutToJsx turns an abstract
   layout primitive (grid/stack/row) + pre-rendered children into REAL per-DS
   layout-component JSX. Every API here was source-verified against the
   installed package in node_modules (Salt 1.63, MUI 9, Carbon 1.108, Fluent
   9.74); uoaui is className + density-px CSS (no npm package). */
const child = (jsx: string, span?: number) => ({ jsx, span });

describe("layoutRegistry — Salt @salt-ds/core", () => {
  it("grid -> GridLayout + GridItem colSpan", () => {
    const jsx = layoutToJsx("salt", "grid", { columns: 12, gap: 3 }, [
      child("<Card>A</Card>", 6),
      child("<Card>B</Card>", 6),
    ])!;
    expect(jsx).toContain("<GridLayout columns={12} gap={3}>");
    expect(jsx).toContain("<GridItem colSpan={6}><Card>A</Card></GridItem>");
  });
  it("stack -> StackLayout, row -> FlexLayout", () => {
    expect(layoutToJsx("salt", "stack", {}, [child("<X/>")])!).toContain("<StackLayout");
    expect(layoutToJsx("salt", "row", {}, [child("<X/>")])!).toContain("<FlexLayout");
  });
  it("imports are deduped + sorted (grid appears twice; all three primitives)", () => {
    expect(collectLayoutImports("salt", ["grid", "stack", "row", "grid"])).toContain(
      'import { FlexLayout, GridItem, GridLayout, StackLayout } from "@salt-ds/core";',
    );
  });
});

describe("layoutRegistry — M3 @mui/material (v9 unified Grid)", () => {
  it("grid -> Grid container + Grid size (12-col)", () => {
    const jsx = layoutToJsx("m3", "grid", { gap: 2 }, [child("<Card>A</Card>", 6)])!;
    expect(jsx).toContain("<Grid container spacing={2}>");
    expect(jsx).toContain("<Grid size={6}><Card>A</Card></Grid>");
  });
  it("stack -> Stack, row -> Stack direction=row", () => {
    expect(layoutToJsx("m3", "stack", {}, [child("<X/>")])!).toContain("<Stack");
    expect(layoutToJsx("m3", "row", {}, [child("<X/>")])!).toContain('direction="row"');
  });
  it("imports", () => {
    expect(collectLayoutImports("m3", ["grid", "stack"])).toContain('import { Grid, Stack } from "@mui/material";');
  });
});

describe("layoutRegistry — Carbon @carbon/react (16-col grid)", () => {
  it("grid -> Grid + Column with 16-col-normalized span", () => {
    const jsx = layoutToJsx("carbon", "grid", {}, [child("<Tile>A</Tile>", 6)])!;
    expect(jsx).toContain("<Grid>");
    expect(jsx).toContain("<Column lg={8}><Tile>A</Tile></Column>"); // 6/12*16 = 8
  });
  it("stack -> Stack gap; row -> Stack orientation=horizontal", () => {
    expect(layoutToJsx("carbon", "stack", { gap: 5 }, [child("<X/>")])!).toContain("<Stack gap={5}>");
    expect(layoutToJsx("carbon", "row", {}, [child("<X/>")])!).toContain('orientation="horizontal"');
  });
  it("imports", () => {
    expect(collectLayoutImports("carbon", ["grid", "stack"])).toContain('import { Column, Grid, Stack } from "@carbon/react";');
  });
});

describe("layoutRegistry — Fluent (idiomatic token CSS, no layout component)", () => {
  it("grid -> CSS grid with Fluent spacing tokens + span", () => {
    const jsx = layoutToJsx("fluent", "grid", {}, [child("<Card>A</Card>", 6)])!;
    expect(jsx).toContain('display: "grid"');
    expect(jsx).toContain('gridColumn: "span 6"');
    expect(jsx).toContain("tokens.spacingHorizontalM");
  });
  it("imports the tokens object", () => {
    expect(collectLayoutImports("fluent", ["grid"])).toContain('import { tokens } from "@fluentui/react-components";');
  });
});

describe("layoutRegistry — uoaui (className + density-px CSS)", () => {
  it("grid -> .a-grid with span on items", () => {
    const jsx = layoutToJsx("uoaui", "grid", {}, [child("<div className='a-card'>A</div>", 6)])!;
    expect(jsx).toContain('className="a-grid"');
    expect(jsx).toContain('gridColumn: "span 6"');
  });
  it("stack -> .a-stack, row -> .a-row", () => {
    expect(layoutToJsx("uoaui", "stack", {}, [child("<X/>")])!).toContain('className="a-stack"');
    expect(layoutToJsx("uoaui", "row", {}, [child("<X/>")])!).toContain('className="a-row"');
  });
  it("emits no import line (className ships with the global a-* stylesheet)", () => {
    expect(collectLayoutImports("uoaui", ["grid", "stack", "row"])).toEqual([]);
  });
});

describe("layoutRegistry — fallback", () => {
  it("resolveLayoutApi returns null for an unknown primitive", () => {
    expect(resolveLayoutApi("salt", "bogus" as never)).toBeNull();
    expect(layoutToJsx("salt", "bogus" as never, {}, [child("<X/>")])).toBeNull();
  });
});
