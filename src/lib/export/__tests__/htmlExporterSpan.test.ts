import { describe, it, expect } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import { exportHTML } from "../htmlExporter";
import { exportReact } from "../reactExporter";
import { exportViteBootstrap } from "../viteExporter";

/* P3-0: the runnable exporters must agree on per-block grid SPAN before any new
   grid placement field ships. htmlExporter used to hardcode an auto-fill body
   grid and ignore every block's width; now it honors `grid-column: span N` from
   the SAME spanOf reactExporter uses. These tests pin the fix + the cross-
   exporter parity invariant (the gate for all later P3 grid work). */
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
const card = (id: string, width?: string) => ({
  id,
  type: "SimulatedCard",
  props: { title: id, content: "x" },
  ...(width ? { layout: { width } } : {}),
});

describe("htmlExporter — body grid honors per-block span (P3-0)", () => {
  it("uses a real 12-col grid, not the old auto-fill tiles", () => {
    setGridCanvas("uoaui", [card("a", "6fr")]);
    const html = exportHTML();
    expect(html).toContain("grid-template-columns: repeat(12, 1fr)");
    expect(html).not.toContain("minmax(280px");
    // stays responsive: collapses to one column on mobile
    expect(html).toContain("grid-template-columns: 1fr");
  });

  it("a 6fr block emits grid-column: span 6", () => {
    setGridCanvas("uoaui", [card("a", "6fr")]);
    expect(exportHTML()).toContain("grid-column: span 6");
  });

  it("a % width maps proportionally (50% -> span 6)", () => {
    setGridCanvas("uoaui", [card("a", "50%")]);
    expect(exportHTML()).toContain("grid-column: span 6");
  });

  it("missing width spans the full row (span 12) — back-compat", () => {
    setGridCanvas("uoaui", [card("a")]);
    expect(exportHTML()).toContain("grid-column: span 12");
  });

  it("CROSS-EXPORTER PARITY (P3-1): HTML, React AND Vite agree on span for the same block", () => {
    setGridCanvas("uoaui", [card("a", "6fr")]);
    const html = exportHTML();
    const react = exportReact();
    const vite = exportViteBootstrap(); // App.tsx IS exportReact(), embedded in the project
    // HTML emits kebab `grid-column: span 6`; React + Vite (uoaui) emit camelCase
    // `gridColumn: "span 6"`. All three derive from the shared spanOf → same span.
    expect(html).toContain("grid-column: span 6");
    expect(react).toContain("span 6");
    expect(vite).toContain("span 6");
  });

  it("Vite shell grid matches the canvas + html (12-col, not the old 3-col)", () => {
    setGridCanvas("uoaui", [card("a", "6fr")]);
    const vite = exportViteBootstrap();
    expect(vite).toContain("grid-template-columns: repeat(12, 1fr)");
    expect(vite).not.toContain("grid-template-columns: repeat(3, 1fr)");
  });
});
