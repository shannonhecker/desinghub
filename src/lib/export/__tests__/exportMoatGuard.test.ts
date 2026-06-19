import { describe, it, expect } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import { exportHTML } from "../htmlExporter";
import { exportReact } from "../reactExporter";
import { exportViteBootstrap } from "../viteExporter";

/* ── P4 Freeform MOAT GUARD ─────────────────────────────────────────────────
   The product's differentiator is runnable, CLEAN DS code: a block is laid out
   with flex/grid, never absolutely positioned. P4 Freeform (drag a block to a
   free 2D position) is the feature most tempted to ship `position: absolute` /
   `transform: translate()` straight into export — the throwaway-markup trap that
   would kill the moat.

   This guard locks the invariant NOW, before any freeform code exists, so the
   moment an exporter emits block-level absolute positioning the build breaks.
   A block cannot be absolutely positioned without `position: absolute`, so
   guarding that token (plus transform/translate, which have ZERO legitimate use
   in exports today) catches every absolute-placement leak across all 5 DS.

   Whitelisted: the a11y skip-link is the ONLY legitimate `position: absolute`
   (it visually-hides off-screen until focus); its lines are stripped before the
   assertion. Future legitimate transforms (e.g. an animation) would extend the
   whitelist deliberately — never silently.
   ───────────────────────────────────────────────────────────────────────── */

// A battery of the layout shapes a freeform engine would be tempted to place
// absolutely: spans, a column-pin, a fixed-px box, a full-row block, a nested
// row group. If any exporter ever positions one of these with absolute/transform,
// this test fails.
const BATTERY = [
  { id: "a", type: "SimulatedCard", props: { title: "A" }, layout: { width: "6fr", gridCol: 7 } },
  { id: "b", type: "SimulatedStatCard", props: { title: "B" }, layout: { width: "33.333%" } },
  { id: "c", type: "SimulatedChart", props: { title: "C" }, layout: { width: "fill" } },
  { id: "d", type: "SimulatedCard", props: { title: "D" }, layout: { width: "240px" } },
  {
    id: "e",
    type: "LayoutGroup",
    props: { direction: "row", gap: 12 },
    children: [
      { id: "e1", type: "SimulatedCard", props: { title: "E1" }, layout: { width: "50%" } },
      { id: "e2", type: "SimulatedCard", props: { title: "E2" }, layout: { width: "50%" } },
    ],
  },
];

const DS_LIST = ["salt", "m3", "carbon", "fluent", "uoaui"] as const;

function setCanvas(ds: string) {
  useBuilder.setState({
    designSystem: ds as never,
    mode: "light" as never,
    density: "medium",
    headerBlocks: [],
    sidebarBlocks: [],
    footerBlocks: [],
    blocks: BATTERY as never,
    zoneLayouts: { body: { mode: "grid", columns: 12, gap: 12 } } as never,
  });
}

/* Strip the whitelisted a11y skip-link rules (the only legitimate
   position:absolute in an export), leaving the block + layout layer. */
function blockLayer(exported: string): string {
  return exported
    .split("\n")
    .filter((line) => !line.includes("skip-link"))
    .join("\n");
}

function assertNoAbsolutePositioning(exported: string, label: string) {
  const body = blockLayer(exported);
  expect(body, `${label}: position:absolute leaked past the chrome whitelist`).not.toMatch(/position:\s*absolute/);
  // `(?<!text-)` lets the typography property `text-transform` through while
  // still catching a real positioning `transform:` (or vendor-prefixed
  // `-webkit-transform:`). The guard is fail-closed: any genuine transform /
  // translate / absolute on a block trips the build and must be consciously
  // whitelisted, never slipped in — that is what keeps the export moat intact.
  expect(body, `${label}: transform leaked into export`).not.toMatch(/(?<!text-)transform\s*:/);
  expect(body, `${label}: translate() leaked into export`).not.toMatch(/translate\s*\(/);
}

describe("export moat guard — no block is ever absolutely positioned (P4 Freeform invariant)", () => {
  for (const ds of DS_LIST) {
    it(`${ds}: HTML export keeps every block in flex/grid flow`, () => {
      setCanvas(ds);
      assertNoAbsolutePositioning(exportHTML(), `${ds}/html`);
    });
    it(`${ds}: React export keeps every block in flex/grid flow`, () => {
      setCanvas(ds);
      assertNoAbsolutePositioning(exportReact(), `${ds}/react`);
    });
    it(`${ds}: Vite export keeps every block in flex/grid flow`, () => {
      setCanvas(ds);
      assertNoAbsolutePositioning(exportViteBootstrap(), `${ds}/vite`);
    });
  }
});
