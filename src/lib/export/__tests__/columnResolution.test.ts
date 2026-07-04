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

/* P3-3: a per-block column-start resolves to each DS's own grid resolution and
   stays proportional, exactly like the span. The CSS-grid DSs (Salt / Carbon /
   Fluent / uoaui) emit `<start> / span <n>`; M3 (MUI Grid is flexbox, no
   absolute column-start) auto-places — a documented honest limitation. */
describe("P3-3 — per-block column-start resolves per DS", () => {
  const pinned = (id: string, width: string, gridCol: number) =>
    ({ id, type: "SimulatedCard", props: { title: id }, layout: { width, gridCol } });

  it("Salt (CSS-grid GridLayout) carries the start as an inline gridColumn beside colSpan", () => {
    setCanvas("salt", 12, [pinned("a", "6fr", 7)]);
    const salt = exportReact();
    expect(salt).toContain("colSpan={6}");
    expect(salt).toContain("7 / span 6"); // inline start overrides the colSpan class
  });

  it("Carbon scales the start to its native 16-col grid (proportional)", () => {
    setCanvas("carbon", 12, [pinned("a", "6fr", 7)]);
    const carbon = exportReact();
    expect(carbon).toContain("lg={8}"); // 6fr -> half of 16
    expect(carbon).toContain("9 / span 8"); // gridCol 7 (50%) -> start 9 of 16
  });

  it("Fluent (inline CSS grid) emits the start in its gridColumn", () => {
    setCanvas("fluent", 12, [pinned("a", "6fr", 7)]);
    expect(exportReact()).toContain("7 / span 6");
  });

  it("uoaui resolves the start at a non-12 resolution too", () => {
    setCanvas("uoaui", 8, [pinned("a", "6fr", 7)]);
    expect(exportReact()).toContain("5 / span 4"); // 6fr->span4, gridCol7(50%)->start5 of 8
  });

  it("M3 (MUI flexbox Grid) auto-places — span only, no start (documented)", () => {
    setCanvas("m3", 12, [pinned("a", "6fr", 7)]);
    const m3 = exportReact();
    expect(m3).toContain("size={6}");
    expect(m3).not.toContain("7 / span"); // MUI Grid cannot express an absolute start
  });

  it("an un-pinned block stays byte-identical per DS (no start prefix)", () => {
    setCanvas("salt", 12, [card("a", "6fr")]);
    expect(exportReact()).not.toContain("/ span");
    setCanvas("carbon", 12, [card("a", "6fr")]);
    expect(exportReact()).not.toContain("/ span");
  });
});
