/* ════════════════════════════════════════════════════════════
   Data table — AI-describe wiring + edit/preview unification.
   ════════════════════════════════════════════════════════════
   The route hits the live API and the builder can't mount in jsdom,
   so (per scrubNumberField.test.ts) we assert the source-level
   contract: the route is hardened + uses the pure sanitizer, the
   edit wrapper wires describe→fetch→store, the table renders the
   describe bar, and ALL renderers share one default source so edit
   and preview can't diverge again.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (...p: string[]) => readFileSync(join(process.cwd(), ...p), "utf8");
const route = read("src", "app", "api", "builder", "generate-table", "route.ts");
const renderer = read("src", "components", "builder", "ComponentRenderer.tsx");
const simUi = read("src", "components", "builder", "SimulatedUI.tsx");
const realRenderer = read("src", "components", "ui-kit", "RealComponentRenderer.tsx");
const realMap = read("src", "components", "ui-kit", "realBlockMap.ts");

describe("generate-table route is hardened and uses the pure sanitizer", () => {
  it("rate-limits, validates the description, and bounds via sanitizeGeneratedTable", () => {
    expect(route).toMatch(/checkRateLimit\(/);
    expect(route).toMatch(/description/);
    expect(route).toMatch(/import\s*\{[^}]*sanitizeGeneratedTable[^}]*\}\s*from\s*["']@\/lib\/tableData["']/);
    expect(route).toMatch(/sanitizeGeneratedTable\(/);
  });

  it("uses the project model constant, not a hardcoded model id", () => {
    expect(route).toMatch(/import\s*\{[^}]*MODEL_ID[^}]*\}\s*from\s*["']@\/lib\/chatSystem["']/);
    expect(route).toMatch(/model:\s*MODEL_ID/);
  });
});

describe("edit wrapper wires describe → generate-table → store", () => {
  it("posts to the route and writes the result onto the block props", () => {
    expect(renderer).toMatch(/\/api\/builder\/generate-table/);
    expect(renderer).toMatch(/updateBlockProps\(/);
    expect(renderer).toMatch(/onGenerate=\{/);
  });
});

describe("table renders the describe bar (the long-promised affordance)", () => {
  it("shows a labelled describe input + generate action gated on onGenerate", () => {
    expect(simUi).toMatch(/onGenerate/);
    expect(simUi).toMatch(/aria-label="Describe the records you want"/);
    expect(simUi).toMatch(/Generate/);
  });
});

describe("every renderer shares one default source (edit == preview)", () => {
  it("edit + both preview renderers import the shared table defaults", () => {
    for (const src of [simUi, realRenderer, realMap]) {
      expect(src).toMatch(/import\s*\{[^}]*DEFAULT_TABLE_COLUMNS[^}]*\}\s*from\s*["']@\/lib\/tableData["']/);
    }
  });

  it("no renderer keeps the old divergent 2-column hardcoded fallback", () => {
    for (const src of [realRenderer, realMap]) {
      expect(src).not.toMatch(/:\s*\["Name",\s*"Status"\]/);
    }
  });
});
