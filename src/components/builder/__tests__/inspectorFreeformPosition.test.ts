/* ════════════════════════════════════════════════════════════
   Inspector position controls for Snap grid (2D) — source-pin.
   ════════════════════════════════════════════════════════════
   Pins three additions to LayoutSection (house style: regex over
   ComponentLibrary.tsx + builder.css text, see
   inspectorDisclosure.test.ts — brittle to refactors by design):

   (1) Order control — freeform + body + grid-zone only. Up/Down are
       momentary buttons over the EXISTING moveBlockUp/moveBlockDown
       adjacent swaps; array order stays the single ordering authority
       (moat rule: no stored row field, no new store actions).
   (2) Span-aware clamp on the shipped Column start field — the UI max
       now matches what normalizeColumnStart already enforces at
       render/export time (cols - span + 1), in ALL placement modes.
   (3) Honesty hints — non-spanning explicit widths can't take a pin
       (freeform only), and M3 export auto-places by order so a set
       pin only applies in the other systems.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "src", "components", "builder");
const cl = readFileSync(join(dir, "ComponentLibrary.tsx"), "utf8");
const css = readFileSync(join(dir, "builder.css"), "utf8");

describe("inspector Order control (freeform only)", () => {
  it("gates on placementMode freeform + body zone + grid layout + top-level index", () => {
    // Selector reads the canonical placement-mode flag…
    expect(cl).toMatch(/placementMode === "freeform"/);
    // …and the gate mirrors the drag-path gate: body zone + grid layout
    // (gridCols !== null) + top-level block (nested group children hide it).
    expect(cl).toMatch(
      /isFreeform && zone === "body" && gridCols !== null && bodyIndex !== -1/,
    );
  });

  it("wires Up/Down to the existing adjacent-swap store actions", () => {
    expect(cl).toMatch(/moveBlockUp\(zone, block\.id\)/);
    expect(cl).toMatch(/moveBlockDown\(zone, block\.id\)/);
  });

  it("dims at bounds via aria-disabled (focus preserved) with guarded onClick", () => {
    expect(cl).toMatch(/aria-disabled=\{bodyIndex === 0\}/);
    expect(cl).toMatch(/aria-disabled=\{bodyIndex === bodyCount - 1\}/);
    // Activation is guarded in the handler — never an unguarded call.
    expect(cl).toMatch(/if \(bodyIndex !== 0\) moveBlockUp\(zone, block\.id\);/);
    expect(cl).toMatch(
      /if \(bodyIndex !== bodyCount - 1\) moveBlockDown\(zone, block\.id\);/,
    );
    expect(cl).not.toMatch(/onClick=\{\(\) => moveBlockUp\(/);
    expect(cl).not.toMatch(/onClick=\{\(\) => moveBlockDown\(/);
  });

  it("announces the N of M readout politely", () => {
    expect(cl).toMatch(
      /<span aria-live="polite">\{bodyIndex \+ 1\} of \{bodyCount\}<\/span>/,
    );
  });

  it("labels the group and buttons with the shipped reorder vocabulary", () => {
    expect(cl).toMatch(/aria-label="Reorder block"/);
    expect(cl).toMatch(/aria-label="Move up"/);
    expect(cl).toMatch(/aria-label="Move down"/);
  });

  it("carries the reading-order honesty line in AA-verified scope copy", () => {
    expect(cl).toMatch(
      /<p className="inspector-section-scope">Blocks flow in reading order\. Vertical position is approximate \(exports pack to flow\)\.<\/p>/,
    );
  });

  it("keeps the moat: no gridRow vocabulary anywhere in the Inspector", () => {
    expect(cl).not.toMatch(/gridRow/);
  });
});

describe("Column start span-aware clamp", () => {
  it("derives the max start from the block's resolved span", () => {
    expect(cl).toMatch(/gridCols - displaySpan \+ 1/);
    expect(cl).toMatch(/max=\{maxStart\}/);
    expect(cl).toMatch(/Math\.min\(maxStart, n\)/);
  });

  it("no longer offers the un-clamped column-count max on the field", () => {
    expect(cl).not.toMatch(/max=\{gridCols\}/);
    expect(cl).not.toMatch(/Math\.min\(gridCols, n\)/);
  });
});

describe("Column start honesty hints", () => {
  it("non-spanning hint: freeform only, explicit non-fill widths only", () => {
    expect(cl).toMatch(
      /<p className="inspector-section-scope">Column pin needs a % or fr width\.<\/p>/,
    );
    // Fill is the default width — the hint deliberately excludes it
    // (showing it on every untouched block would be noise).
    expect(cl).toMatch(/!isSpanning && w !== undefined && w !== "fill"/);
  });

  it("M3 hint: only when a pin is actually set on an M3 canvas", () => {
    expect(cl).toMatch(
      /<p className="inspector-section-scope">Material export auto-places by order; the column pin applies in the other systems\.<\/p>/,
    );
    expect(cl).toMatch(/=== "m3"/);
    expect(cl).toMatch(/gridCol !== undefined/);
  });
});

describe("builder.css companion rules", () => {
  it("aria-disabled toggle buttons share the disabled dim treatment", () => {
    expect(css).toMatch(/\.inspector-toggle-btn\[aria-disabled="true"\]/);
    // …including the hover companion (no hover highlight while dimmed).
    expect(css).toMatch(/\.inspector-toggle-btn\[aria-disabled="true"\]:hover/);
  });

  it("order buttons meet the WCAG 2.5.8 minimum target size", () => {
    expect(css).toMatch(/\.inspector-order-btn\s*\{[^}]*min-height/);
  });
});
