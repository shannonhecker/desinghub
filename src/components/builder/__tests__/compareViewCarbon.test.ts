/* ════════════════════════════════════════════════════════════
   CompareView, IBM Carbon as the 5th quadrant (moat correctness).
   ════════════════════════════════════════════════════════════
   CompareView is the "see the same canvas across every design
   system at once" surface. It shipped with only four entries in
   its SYSTEMS array (salt / m3 / fluent / uoaui) even though the
   rest of the app treats Carbon as a first-class DS (DS_ORDER,
   the chat system prompt, the DesignSystem union, the exporters
   all include it) and the adjacent toolbar button promises to
   "Compare all design systems". A four-up grid that silently
   drops Carbon undersells the cross-DS moat.

   These tests read the source file directly (no React renderer
   needed, matching chromeLeakageFixes.test.ts) and assert:

   1. SYSTEMS lists five design systems, including carbon, with
      the IBM brand blue and "IBM Carbon" label.
   2. The user-facing copy says "five design systems" / "all",
      not "four".
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const builderDir = join(process.cwd(), "src", "components", "builder");
const compareView = readFileSync(join(builderDir, "CompareView.tsx"), "utf8");

/* Pull the SYSTEMS array literal out of the source so we can count
   its entries and read their keys without importing the (unexported)
   const into a React renderer. */
function systemsBlock(src: string): string {
  const start = src.indexOf("const SYSTEMS");
  expect(start).toBeGreaterThan(-1);
  // The array literal ends at the first "];" after the declaration.
  const end = src.indexOf("];", start);
  expect(end).toBeGreaterThan(start);
  return src.slice(start, end);
}

describe("CompareView, SYSTEMS array", () => {
  const block = systemsBlock(compareView);

  it("lists exactly five design systems", () => {
    const keys = [...block.matchAll(/key:\s*"([a-z0-9]+)"/g)].map((m) => m[1]);
    expect(keys).toHaveLength(5);
    expect(new Set(keys).size).toBe(5);
  });

  it("includes the four existing systems plus carbon", () => {
    const keys = [...block.matchAll(/key:\s*"([a-z0-9]+)"/g)].map((m) => m[1]);
    expect(keys).toContain("salt");
    expect(keys).toContain("m3");
    expect(keys).toContain("fluent");
    expect(keys).toContain("uoaui");
    expect(keys).toContain("carbon");
  });

  it("gives carbon the IBM brand blue and an IBM Carbon label/org", () => {
    // The carbon entry line.
    const carbonLine = block
      .split("\n")
      .find((l) => /key:\s*"carbon"/.test(l));
    expect(carbonLine).toBeDefined();
    expect(carbonLine!).toMatch(/#0[fF]62[fF][eE]/); // IBM blue60
    expect(carbonLine!).toMatch(/IBM Carbon/);
    expect(carbonLine!).toMatch(/IBM/);
  });
});

describe("CompareView, copy reflects all five systems", () => {
  it("no longer claims 'four design systems'", () => {
    expect(compareView).not.toMatch(/four design systems/i);
  });

  it("the banner names five design systems", () => {
    expect(compareView).toMatch(/five design systems/i);
  });
});
