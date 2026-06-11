/* ════════════════════════════════════════════════════════════
   Present-mode canvas-spacing parity (2026-06-11).
   ════════════════════════════════════════════════════════════
   BuilderApp's edit shell carries BOTH data-builder-mode AND
   data-canvas-spacing. PresentStage REPLACES that shell (early
   return), so if it only sets data-builder-mode, no ancestor
   carries data-canvas-spacing in preview and the tight gate
   ([data-canvas-spacing="tight"] .canvas-block { padding:0;
   margin-bottom:0; border-width:0; }) never applies — preview
   blocks pick up the editor-only 12px padding / 8px margin /
   1px border while edit shows 0/0/0. Preview must MIRROR the
   store's canvasSpacing so both modes share one box model.

   Part 1 mounts PresentStage for real (react-dom/client + act,
   same harness as dsPreviewStylesHooks.test.tsx — no RTL in
   this repo) and asserts the root attribute tracks the store
   for the full 'tight' | 'comfortable' union.
   Part 2 is a source-pin regression in the style of
   chromeLeakageFixes.test.ts: both shells must derive the
   attribute from the same store selector, so they cannot
   disagree for the same store state.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, afterEach, beforeAll } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { useBuilder } from "@/store/useBuilder";
import { PresentStage } from "../PresentStage";

const builderDir = join(process.cwd(), "src", "components", "builder");
const builderAppSrc = readFileSync(join(builderDir, "BuilderApp.tsx"), "utf8");
const presentStageSrc = readFileSync(join(builderDir, "PresentStage.tsx"), "utf8");

/* jsdom has no matchMedia; framer-motion's useReducedMotion (used by
   DeviceFrame inside BuilderCanvas) probes it on mount. */
beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }
});

let root: Root | null = null;
let container: HTMLDivElement | null = null;

afterEach(() => {
  if (root) {
    const r = root;
    act(() => r.unmount());
    root = null;
  }
  container?.remove();
  container = null;
});

function mountStage() {
  container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container!);
    root.render(<PresentStage />);
  });
  const stage = container.querySelector<HTMLElement>(".present-stage");
  expect(stage, ".present-stage root should mount").not.toBeNull();
  return stage!;
}

describe("PresentStage mirrors the store's canvasSpacing on its root", () => {
  /* The exact union from useBuilder.ts: canvasSpacing: 'tight' | 'comfortable' */
  (["tight", "comfortable"] as const).forEach((spacing) => {
    it(`carries data-canvas-spacing="${spacing}" when the store holds '${spacing}'`, () => {
      act(() => {
        useBuilder.setState({ canvasSpacing: spacing });
      });
      const stage = mountStage();
      expect(stage.getAttribute("data-canvas-spacing")).toBe(spacing);
      /* And the existing mode attribute is untouched. */
      expect(stage.getAttribute("data-builder-mode")).toBe("preview");
    });
  });

  it("tracks live store updates (toggling spacing while presenting)", () => {
    act(() => {
      useBuilder.setState({ canvasSpacing: "tight" });
    });
    const stage = mountStage();
    act(() => {
      useBuilder.setState({ canvasSpacing: "comfortable" });
    });
    expect(stage.getAttribute("data-canvas-spacing")).toBe("comfortable");
  });
});

describe("Edit shell and PresentStage agree on the attribute (source-pin regression)", () => {
  it("BuilderApp's edit shell still derives data-canvas-spacing from the store", () => {
    expect(builderAppSrc).toMatch(/useBuilder\(\(s\)\s*=>\s*s\.canvasSpacing\)/);
    expect(builderAppSrc).toMatch(/data-canvas-spacing=\{canvasSpacing\}/);
  });

  it("PresentStage derives data-canvas-spacing from the SAME store selector", () => {
    expect(presentStageSrc).toMatch(/useBuilder\(\(s\)\s*=>\s*s\.canvasSpacing\)/);
    expect(presentStageSrc).toMatch(/data-canvas-spacing=\{canvasSpacing\}/);
  });

  it("neither shell hardcodes a spacing literal into the attribute", () => {
    /* JSX-attribute position only (leading whitespace) — code comments may
       legitimately cite the CSS selector [data-canvas-spacing="tight"]. */
    expect(builderAppSrc).not.toMatch(/\sdata-canvas-spacing="(tight|comfortable)"/);
    expect(presentStageSrc).not.toMatch(/\sdata-canvas-spacing="(tight|comfortable)"/);
  });
});
