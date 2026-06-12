/* ════════════════════════════════════════════════════════════
   Phase D, surgical fix verification tests.
   2026-05-29 builder UX cleanup PR (S1, S2, S3, S4, S5, A1).

   These tests pin the structural decisions made in the chrome-
   leakage cleanup so a future refactor cannot silently regress
   them. They read source files directly (no React renderer
   needed) to assert that:

   1. SortableBlock gates drag handle / remove / swap / colspan
      behind `zone !== "sidebar"` (S1 + A1 prerequisite).
   2. SortableBlock no longer attaches the legacy
      `bc-rail-${chipRailPlacement}` wrapper class (replaced by
      Floating UI flip middleware).
   5. chrome-tokens.css declares the new `--builder-selection-*`
      token namespace and a matching light-mode override (S3).
   6. builder.css selection rule references
      var(--builder-selection-color), not var(--ds-primary) (S3).
   7. builder.css contains a [data-zone="sidebar"] suppression
      rule (S1 belt-and-braces).
   8. .bp-sidebar-toggle uses --bc-* chrome tokens, not --ds-*
      content tokens (S4).
   9. .bp-sidebar-resize-handle uses --bc-accent + idle dot
      hint via ::before AND ::after (S5).
   10. prefers-reduced-motion blocks present on the new
       transitions (cross-cutting reduce-motion constraint).
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const builderDir = join(process.cwd(), "src", "components", "builder");
const sortableBlock = readFileSync(join(builderDir, "SortableBlock.tsx"), "utf8");
const chromeTokens = readFileSync(join(builderDir, "chrome-tokens.css"), "utf8");
const builderCss = readFileSync(join(builderDir, "builder.css"), "utf8");

describe("S1 / A1, sidebar chrome gating (E2 refactor: now lives inside HoverInspector)", () => {
  /* E2 (2026-05-29) moved the per-block edit chrome (handle / remove /
     swap) out of SortableBlock's direct JSX and into <HoverInspector>.
     The sidebar bail-out moved with it. These tests now verify the new
     architecture: SortableBlock mounts <HoverInspector>, HoverInspector
     bails out on sidebar zone. */
  const hoverInspector = readFileSync(join(builderDir, "HoverInspector.tsx"), "utf8");

  it("SortableBlock mounts <HoverInspector> with zone forwarded", () => {
    expect(sortableBlock).toMatch(/<HoverInspector[\s\S]*?zone=\{zone\}/);
  });

  it("HoverInspector returns null when zone === 'sidebar'", () => {
    expect(hoverInspector).toMatch(/zone\s*===\s*"sidebar"/);
  });

  it("emits data-zone attribute so CSS belt-and-braces can target sidebar", () => {
    expect(sortableBlock).toMatch(/data-zone=\{zone\}/);
  });

  it("no longer wraps with the legacy bc-rail-${placement} class", () => {
    expect(sortableBlock).not.toMatch(/bc-rail-\$\{chipRailPlacement\}/);
  });
});

describe("S3, selection token namespace", () => {
  it("chrome-tokens.css declares --builder-selection-color and --builder-selection-ring", () => {
    expect(chromeTokens).toMatch(/--builder-selection-color:/);
    expect(chromeTokens).toMatch(/--builder-selection-ring:/);
    expect(chromeTokens).toMatch(/--builder-selection-outline-width:/);
  });

  it("chrome-tokens.css provides a light-mode override under .builder-light", () => {
    const match = chromeTokens.match(/\.builder-light\s*\{([\s\S]*?)\n\}/);
    expect(match, ".builder-light scope should exist in chrome-tokens.css").not.toBeNull();
    expect(match![1]).toMatch(/--builder-selection-color:/);
  });

  it("the new selection token resolves to a value distinct from --ds-primary brand tokens", () => {
    // Sanity: --builder-selection-color must be a literal color, not a var() reference
    // back into the per-DS chain (which is the very thing we are decoupling from).
    expect(chromeTokens).not.toMatch(/--builder-selection-color:\s*var\(--ds-/);
    expect(chromeTokens).not.toMatch(/--builder-selection-color:\s*var\(--salt-/);
  });

  it("builder.css .canvas-block.is-selected uses --builder-selection-color, not --ds-primary", () => {
    const match = builderCss.match(/\.canvas-block\.is-selected\s*\{([\s\S]*?)\n\}/);
    expect(match).not.toBeNull();
    const body = match![1];
    expect(body).toMatch(/var\(--builder-selection-color\)/);
    expect(body).not.toMatch(/outline:\s*\d+px\s+solid\s+var\(--ds-primary\)/);
  });
});

describe("S1, builder.css belt-and-braces sidebar zone gate", () => {
  it("hides chrome inside [data-zone='sidebar'] even if the JSX gate regresses", () => {
    expect(builderCss).toMatch(/\[data-zone="sidebar"\][\s\S]*display:\s*none/);
  });
});

describe("A1, body-zone selection chrome docks above the block", () => {
  /* E2 (2026-05-29): inspector chrome now lives inside <HoverInspector>,
     a child of .canvas-block. The legacy direct-child docking shift rule
     below is preserved as a no-op for any future regression that puts
     chrome back as a direct child of .canvas-block. The active visual
     "is-pinned" state ships via .hover-inspector.is-pinned styling
     (outline + corner badges); the docking shift is no longer the
     primary affordance. */
  it("preserves legacy direct-child docking shift rule (no-op now, regression guard)", () => {
    expect(builderCss).toMatch(
      /\.canvas-block\.is-selected:not\(\[data-zone="sidebar"\]\)[\s\S]*top:\s*calc\(/,
    );
  });

  it("ships .hover-inspector.is-pinned outline + corner badges as the new pin state", () => {
    expect(builderCss).toMatch(/\.hover-inspector\.is-pinned\s+\.hover-inspector-outline\s*\{/);
    expect(builderCss).toMatch(/\.hover-inspector-corner--tl/);
    expect(builderCss).toMatch(/\.hover-inspector-corner--br/);
  });
});

describe("S4, collapse button uses chrome tokens", () => {
  it(".bp-sidebar-toggle rule references --bc-* tokens, not --ds-* content tokens", () => {
    const match = builderCss.match(/\.bp-sidebar-toggle\s*\{([\s\S]*?)\n\}/);
    expect(match).not.toBeNull();
    const body = match![1];
    expect(body).toMatch(/var\(--bc-/);
    expect(body).not.toMatch(/var\(--ds-border\)/);
    expect(body).not.toMatch(/var\(--ds-radius\)/);
    expect(body).not.toMatch(/var\(--ds-fg-secondary\)/);
  });

  it(".bp-sidebar-toggle hover transition is wrapped in prefers-reduced-motion", () => {
    expect(builderCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.bp-sidebar-toggle[\s\S]*transition:\s*none/,
    );
  });
});

describe("QW1, Present-entry animation replay suppression", () => {
  /* Quick win 1 (2026-06-11 builder UX analysis): PresentStage mounts a
     fresh BuilderCanvas, so the canvas-block-in entrance animation
     (260ms scale pop, fill-mode backwards) replayed on EVERY block each
     time Present mode opened. The E1 preview chrome gate now also kills
     the animation; this pins the rule so a future builder.css refactor
     cannot silently drop it. */
  it("the preview-gated .canvas-block rule contains animation: none", () => {
    const match = builderCss.match(
      /\[data-builder-mode="preview"\] \.canvas-block\s*\{([\s\S]*?)\n\}/,
    );
    expect(
      match,
      'E1 gate must contain a plain [data-builder-mode="preview"] .canvas-block rule',
    ).not.toBeNull();
    expect(match![1]).toMatch(/animation:\s*none/);
  });
});

describe("S5, resizer idle affordance + reduce-motion", () => {
  it(".bp-sidebar-resize-handle has BOTH ::before and ::after idle dots", () => {
    expect(builderCss).toMatch(
      /\.bp-sidebar-resize-handle::before,\s*\n\s*\.bp-sidebar-resize-handle::after/,
    );
  });

  it("resizer hover uses --bc-accent (chrome) not --ds-primary (brand)", () => {
    // Capture the hover rule block.
    const hoverMatch = builderCss.match(
      /\.bp-sidebar-resize-handle:hover::before[\s\S]*?\n\}/,
    );
    expect(hoverMatch).not.toBeNull();
    expect(hoverMatch![0]).toMatch(/var\(--bc-accent\)/);
    expect(hoverMatch![0]).not.toMatch(/var\(--ds-primary\)/);
  });

  it("resizer transition honors prefers-reduced-motion", () => {
    expect(builderCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.bp-sidebar-resize-handle::before[\s\S]*transition:\s*none/,
    );
  });
});
