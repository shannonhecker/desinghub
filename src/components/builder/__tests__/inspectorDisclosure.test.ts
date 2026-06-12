/* ════════════════════════════════════════════════════════════
   Inspector progressive disclosure — reduce the per-block
   COMPONENTS panel's cognitive load. Source-pin.
   ════════════════════════════════════════════════════════════
   Pins: (1) InspectorSubgroup collapsible exists; (2) the Size section
   leads with the W/H size row + Align (core), min/max/grow/margin in a
   collapsed Advanced subgroup; (3) Accent collapses unless the block
   overrides global; (4) the Auto-layout cluster (formerly "Zone Layout")
   leads expanded but is STILL rendered unconditionally (deliberately NOT
   hidden — it edits the container's flow, and you only select blocks, so
   gating it to container types would orphan auto-layout access).

   P1 (flat-Figma inspector): the per-block sizing section is titled
   "Size" and leads with a W/H size row using Fixed/Hug/Fill LABELS (the
   store still writes the LayoutWidth union); the container-flow section is
   titled "Auto layout" and now defaults open (Figma leads with it).
   Visual feel is verified on the Vercel preview.
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

  it("Size section leads with W/H size row + Align (core); min/max/grow/margin in an Advanced subgroup", () => {
    const sg = cl.indexOf('<InspectorSubgroup id="layout-advanced"');
    expect(sg).toBeGreaterThan(-1);
    // The section is titled "Size" and leads with a W/H dimensions row
    // (Figma-style: each axis is a value field + a Fill/Hug/px/% dropdown).
    expect(cl).toMatch(/<InspectorSection id="layout" title="Size">/);
    const sizeRow = cl.indexOf('className="inspector-dim-cell"');
    expect(sizeRow).toBeGreaterThan(-1);
    expect(sizeRow).toBeLessThan(sg);
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

  it("Auto layout cluster leads expanded but stays rendered (not hidden)", () => {
    // Visual QA batch 1 (2026-06): still titled "Auto layout" and still
    // rendered for EVERY selection (it edits the container's flow), but
    // leaf selections now collapse it by default — component properties
    // lead the stack. Behavioural coverage in visualQaBatch1.test.tsx.
    expect(cl).toMatch(/title="Auto layout" defaultOpen=\{!leaf\}>/);
    expect(cl).toMatch(/<ZoneLayoutSection\b/);
  });

  it("has inspector-subgroup styling", () => {
    expect(css).toMatch(/\.inspector-subgroup\b/);
  });
});
