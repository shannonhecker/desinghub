/* ════════════════════════════════════════════════════════════
   Inspector progressive disclosure — reduce the per-block
   COMPONENTS panel's cognitive load. Source-pin.
   ════════════════════════════════════════════════════════════
   Pins: (1) InspectorSubgroup collapsible exists; (2) Layout leads
   with Width + Align (core), min/max/grow/margin in a collapsed
   Advanced subgroup; (3) Accent collapses unless the block overrides
   global; (4) Zone Layout collapses by default but is STILL rendered
   (deliberately NOT hidden — it edits the zone's flow, and you only
   select blocks, so hiding it on leaf blocks would orphan zone-flow
   access). Visual feel is verified on the Vercel preview.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "src", "components", "builder");
const cl = readFileSync(join(dir, "ComponentLibrary.tsx"), "utf8");
const css = readFileSync(join(dir, "builder.css"), "utf8");

describe("inspector progressive disclosure", () => {
  it("defines an InspectorSubgroup collapsible", () => {
    expect(cl).toMatch(/function InspectorSubgroup\(/);
  });

  it("Layout leads with Width + Align (core); min/max/grow/margin in an Advanced subgroup", () => {
    const sg = cl.indexOf('<InspectorSubgroup id="layout-advanced"');
    expect(sg).toBeGreaterThan(-1);
    // Align is core → appears before the Advanced subgroup
    expect(cl.indexOf('inspector-field-label">Align')).toBeGreaterThan(-1);
    expect(cl.indexOf('inspector-field-label">Align')).toBeLessThan(sg);
    // Min/Max + Margin are advanced → inside the subgroup (after it opens)
    expect(cl.indexOf("Min width (px)")).toBeGreaterThan(sg);
    expect(cl.indexOf("Margin (px)")).toBeGreaterThan(sg);
  });

  it("Accent collapses unless the block overrides global", () => {
    expect(cl).toMatch(/title="Accent" defaultOpen=\{Boolean\(current\)\}/);
  });

  it("Zone Layout collapses by default but stays rendered (not hidden)", () => {
    expect(cl).toMatch(/title=\{`\$\{label\} Zone Layout`\} defaultOpen=\{false\}/);
    // Still rendered unconditionally — NOT gated to container types.
    expect(cl).toMatch(/<ZoneLayoutSection zone=/);
  });

  it("has inspector-subgroup styling", () => {
    expect(css).toMatch(/\.inspector-subgroup\b/);
  });
});
