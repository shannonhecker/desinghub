/* ════════════════════════════════════════════════════════════
   Zone-aware prop resolution for edit-canvas block renderers.
   ════════════════════════════════════════════════════════════
   Bug: SimulatedDataTableBlock (and its co-located sibling
   renderers) resolved props ONLY from s.blocks (the body zone), so
   a block placed in header/sidebar/footer rendered defaults and
   ignored its AI-passed props (e.g. a table's columns/rows).

   The builder can't mount in jsdom (per datatableAiDescribe.test.ts /
   scrubNumberField.test.ts precedent), so we pin the source-level
   contract: a shared any-zone resolver exists, the table renderer
   uses it, and the single-zone lookup pattern is gone from the
   pass-through renderers.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const renderer = readFileSync(
  join(process.cwd(), "src", "components", "builder", "ComponentRenderer.tsx"),
  "utf8",
);

describe("shared any-zone block resolver", () => {
  it("the shared resolver hook walks every zone array", () => {
    expect(renderer).toMatch(/function useBlockInAnyZone\(/);
    const hookSrc = renderer.slice(renderer.indexOf("function useBlockInAnyZone"));
    expect(hookSrc.slice(0, 1600)).toMatch(/for \(const key of ZONE_KEYS\)/);
  });

  it("SimulatedDataTableBlock resolves props AND writes via the any-zone hook", () => {
    const start = renderer.indexOf("function SimulatedDataTableBlock");
    expect(start).toBeGreaterThan(-1);
    const body = renderer.slice(start, renderer.indexOf("return (", start));
    expect(body).toContain("useBlockInAnyZone(blockId)");
    expect(body).not.toContain("blocks.find((b) => b.id === blockId)");
    /* The describe-bar write must be zone-aware too, not the body-only
       store.updateBlockProps. */
    expect(body).toContain("update({ columns: payload.columns");
    expect(body).not.toContain("updateBlockProps(blockId");
  });

  it("no pass-through renderer keeps the body-only two-line lookup", () => {
    /* The contiguous pattern only ever existed in the simple prop
       pass-through renderers; the legacy wizard-group renderers
       interleave other hooks between the two lines and are tracked
       separately (they also write via body-only updateBlockProps). */
    const bodyOnlyPair =
      /const blocks = useBuilder\(\(s\) => s\.blocks\);\n\s*const block = blockId \? blocks\.find\(\(b\) => b\.id === blockId\) : null;/;
    expect(renderer).not.toMatch(bodyOnlyPair);
  });
});
