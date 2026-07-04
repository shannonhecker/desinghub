import { describe, it, expect } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import { exportHTML } from "../htmlExporter";
import { exportViteBootstrap } from "../viteExporter";

/* Responsive mobile fix (P3-3 / P4 Phase 0b). The body grid collapses to one
   column at 768px (`.zone-body -> 1fr`), but each block keeps its INLINE
   grid-column — `7 / span 6` for a P3-3 pin, `span 6` for a wide block. On a
   1-col grid those spawn phantom implicit columns and overflow off-screen, and
   an inline style CANNOT be overridden by a media query. The breakpoint must
   therefore neutralize the grid-item placement with
   `.zone-body > .grid-item { grid-column: auto !important }` so pinned / wide
   blocks stack cleanly on mobile. (html + vite raw-CSS-grid exports; the React
   export leans on the DS components' own responsiveness.) */

function setGridCanvas(ds: string) {
  useBuilder.setState({
    designSystem: ds as never,
    mode: "light" as never,
    density: "medium",
    headerBlocks: [],
    sidebarBlocks: [],
    footerBlocks: [],
    // a pinned block (the worst case: a non-1 start that overflows a 1-col grid)
    blocks: [{ id: "a", type: "SimulatedCard", props: { title: "A" }, layout: { width: "6fr", gridCol: 7 } }] as never,
    zoneLayouts: { body: { mode: "grid", columns: 12, gap: 12 } } as never,
  });
}

/* Capture the `max-width: 768px` media block (handles single- and multi-line). */
function mobileMedia(css: string): string {
  const m = css.match(/@media\s*\([^)]*max-width:\s*768px[^)]*\)\s*\{[\s\S]*?\}\s*\}/);
  return m ? m[0] : "";
}

describe("export responsive — mobile collapse neutralizes inline grid placement", () => {
  it("html: the 768px breakpoint resets .grid-item grid-column so a pin can't overflow", () => {
    setGridCanvas("uoaui");
    const mq = mobileMedia(exportHTML());
    expect(mq, "768px media query present").toContain("grid-template-columns: 1fr");
    expect(mq, "grid-item placement neutralized on mobile").toMatch(/\.grid-item\s*\{[^}]*grid-column:\s*auto/);
  });

  it("vite: the 768px breakpoint resets .grid-item grid-column too", () => {
    setGridCanvas("uoaui");
    const mq = mobileMedia(exportViteBootstrap());
    expect(mq).toContain("grid-template-columns: 1fr");
    expect(mq).toMatch(/\.grid-item\s*\{[^}]*grid-column:\s*auto/);
  });

  it("the reset uses !important so it overrides the inline grid-column", () => {
    setGridCanvas("uoaui");
    expect(mobileMedia(exportHTML())).toMatch(/grid-column:\s*auto\s*!important/);
    expect(mobileMedia(exportViteBootstrap())).toMatch(/grid-column:\s*auto\s*!important/);
  });
});
