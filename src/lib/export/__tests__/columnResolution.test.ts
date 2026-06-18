import { describe, it, expect } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import { computeItemStyle } from "@/lib/layoutResolver";
import { exportHTML } from "../htmlExporter";
import { exportReact } from "../reactExporter";

/* P3-2a: the body column COUNT is a grid RESOLUTION; `fr` stays a canonical-12
   PROPORTION. span-in-N = normalizeColumns(fr, N) = round(fr/12 * N), which
   preserves the proportion at any resolution — so canvas + every exporter agree
   when columns != 12. A 6fr ("half") block must read as half on an 8-col grid
   (span 4), a 12-col grid (span 6), and a 16-col grid (span 8). */
function setCanvas(ds: string, columns: number, blocks: unknown[]) {
  useBuilder.setState({
    designSystem: ds as never,
    mode: "light" as never,
    density: "medium",
    headerBlocks: [],
    sidebarBlocks: [],
    footerBlocks: [],
    blocks: blocks as never,
    zoneLayouts: { body: { mode: "grid", columns, gap: 3 } } as never,
  });
}
const card = (id: string, width: string) => ({ id, type: "SimulatedCard", props: { title: id }, layout: { width } });
const gc = (s: Record<string, unknown>) => s.gridColumn;

describe("P3-2a — column count = grid resolution, fr = canonical-12 proportion", () => {
  it("canvas: a 6fr (half) block scales with the column count", () => {
    const zl = (columns: number) => ({ mode: "grid" as const, columns, gap: 3 });
    expect(gc(computeItemStyle({ layout: { width: "6fr" } } as never, zl(12) as never) as never)).toBe("span 6");
    expect(gc(computeItemStyle({ layout: { width: "6fr" } } as never, zl(8) as never) as never)).toBe("span 4");
    expect(gc(computeItemStyle({ layout: { width: "6fr" } } as never, zl(16) as never) as never)).toBe("span 8");
    // back-compat: 12-col unchanged; full-row fill stays full
    expect(gc(computeItemStyle({ layout: { width: "fill" } } as never, zl(8) as never) as never)).toBe("1 / -1");
  });

  it("html: 8-col body renders a repeat(8) grid with the proportional span", () => {
    setCanvas("uoaui", 8, [card("a", "6fr")]);
    const html = exportHTML();
    expect(html).toContain("grid-template-columns: repeat(8, 1fr)");
    expect(html).toContain("grid-column: span 4"); // 6fr of 8 = half
  });

  it("CROSS-EXPORTER PARITY at 8 cols: N-col renderers all use 8 + span 4", () => {
    setCanvas("uoaui", 8, [card("a", "6fr")]);
    expect(exportHTML()).toContain("grid-column: span 4");
    const uo = exportReact();
    expect(uo).toContain("repeat(8, 1fr)");
    expect(uo).toContain("span 4");

    setCanvas("salt", 8, [card("a", "6fr")]);
    const salt = exportReact();
    expect(salt).toContain("columns={8}");
    expect(salt).toContain("colSpan={4}");

    setCanvas("fluent", 8, [card("a", "6fr")]);
    expect(exportReact()).toContain("repeat(8, 1fr)");
  });

  it("fixed-native DSs keep the proportion at their own resolution", () => {
    setCanvas("m3", 8, [card("a", "6fr")]);
    expect(exportReact()).toContain("size={6}"); // MUI is 12-col → half = 6
    setCanvas("carbon", 8, [card("a", "6fr")]);
    expect(exportReact()).toContain("lg={8}"); // Carbon is 16-col → half = 8
  });
});
