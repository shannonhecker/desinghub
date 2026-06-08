/* ════════════════════════════════════════════════════════════
   Scrubbable NumberField (P6) — component + wiring contract.
   ════════════════════════════════════════════════════════════
   The builder right-rail can't render in jsdom (heavy provider
   tree), so — following inspectorDisclosure.test.ts — we assert
   the source-level contract: the field keeps a real focusable
   number input (a11y), exposes a drag handle wired to the pure
   applyScrubDelta math, and is actually wired into every numeric
   inspector field in ComponentLibrary.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "src", "components", "builder");
const snf = readFileSync(join(dir, "ScrubNumberField.tsx"), "utf8");
const cl = readFileSync(join(dir, "ComponentLibrary.tsx"), "utf8");
const css = readFileSync(join(dir, "builder.css"), "utf8");

describe("ScrubNumberField component", () => {
  it("keeps a real focusable number input (native keyboard + screen-reader)", () => {
    expect(snf).toMatch(/type="number"/);
    expect(snf).toMatch(/aria-label/);
  });

  it("drives value changes through the pure applyScrubDelta core", () => {
    expect(snf).toMatch(/import\s*\{[^}]*applyScrubDelta[^}]*\}\s*from\s*["']@\/lib\/scrub["']/);
    expect(snf).toMatch(/applyScrubDelta\(/);
  });

  it("captures the pointer so a drag doesn't start a dnd-kit reorder", () => {
    expect(snf).toMatch(/setPointerCapture/);
    // dnd-kit activation is suppressed: the handle stops propagation on down
    expect(snf).toMatch(/stopPropagation/);
  });

  it("Shift held → coarse scrub (passes shiftKey as `coarse`)", () => {
    expect(snf).toMatch(/coarse:\s*[^,)]*shiftKey/);
  });

  it("renders the three handle layouts the inspector needs", () => {
    expect(snf).toMatch(/"stacked"/);
    expect(snf).toMatch(/"cell"/);
    expect(snf).toMatch(/"inline"/);
  });
});

describe("ScrubNumberField CSS affordance", () => {
  it("the drag handle advertises horizontal scrubbing via ew-resize cursor", () => {
    expect(css).toMatch(/\.inspector-scrub-handle\b/);
    expect(css).toMatch(/cursor:\s*ew-resize/);
  });
});

describe("ComponentLibrary wires ScrubNumberField into every numeric field", () => {
  it("imports ScrubNumberField", () => {
    expect(cl).toMatch(/import\s*\{?\s*ScrubNumberField\s*\}?\s*from\s*["']\.\/ScrubNumberField["']/);
  });

  it("no raw numeric inspector inputs remain in the layout/zone sections", () => {
    // Every <input type="number"> in the inspector must now be a ScrubNumberField.
    const rawNumberInputs = cl.match(/type="number"/g) ?? [];
    expect(rawNumberInputs.length).toBe(0);
  });

  it("preserves the label texts the disclosure contract depends on", () => {
    // inspectorDisclosure.test.ts asserts these strings exist; the swap must keep them.
    expect(cl).toMatch(/Min width \(px\)/);
    expect(cl).toMatch(/Margin \(px\)/);
  });

  it("covers the headline custom width + height fields", () => {
    expect(cl).toMatch(/Custom width value/);
    expect(cl).toMatch(/Custom height value/);
  });
});
