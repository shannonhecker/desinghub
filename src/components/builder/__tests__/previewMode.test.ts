/* ════════════════════════════════════════════════════════════
   Phase E1, Preview-mode toggle verification tests
   2026-05-29 builder UX cleanup PR.

   Pins the structural decisions made in E1 so a future
   refactor cannot silently regress them. Mix of:
     - Runtime tests on the Zustand store (default, toggle,
       setMode).
     - Source-pinning tests on PreviewToggle.tsx, BuilderApp.tsx,
       chrome-tokens.css, and builder.css to assert ARIA, the
       data-builder-mode attribute, keyboard shortcuts, the
       input-focus guard, and the chrome-gating selectors.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { usePreviewMode } from "@/store/usePreviewMode";

const builderDir = join(process.cwd(), "src", "components", "builder");
const storeDir = join(process.cwd(), "src", "store");

const previewToggleSrc = readFileSync(join(builderDir, "PreviewToggle.tsx"), "utf8");
const builderAppSrc = readFileSync(join(builderDir, "BuilderApp.tsx"), "utf8");
const builderCss = readFileSync(join(builderDir, "builder.css"), "utf8");
const chromeTokens = readFileSync(join(builderDir, "chrome-tokens.css"), "utf8");
const previewModeStoreSrc = readFileSync(join(storeDir, "usePreviewMode.ts"), "utf8");

function resetStore() {
  usePreviewMode.setState({ mode: "edit" });
}

describe("usePreviewMode store", () => {
  beforeEach(resetStore);

  it("defaults to edit mode", () => {
    expect(usePreviewMode.getState().mode).toBe("edit");
  });

  it("toggle() flips edit -> preview -> edit", () => {
    usePreviewMode.getState().toggle();
    expect(usePreviewMode.getState().mode).toBe("preview");
    usePreviewMode.getState().toggle();
    expect(usePreviewMode.getState().mode).toBe("edit");
  });

  it("setMode('preview') sets explicitly", () => {
    usePreviewMode.getState().setMode("preview");
    expect(usePreviewMode.getState().mode).toBe("preview");
  });

  it("setMode('edit') sets explicitly", () => {
    usePreviewMode.getState().setMode("preview");
    usePreviewMode.getState().setMode("edit");
    expect(usePreviewMode.getState().mode).toBe("edit");
  });

  it("exports BuilderMode type union via store source", () => {
    expect(previewModeStoreSrc).toMatch(/export\s+type\s+BuilderMode\s*=\s*"edit"\s*\|\s*"preview"/);
  });
});

describe("PreviewToggle ARIA + brand mapping", () => {
  it("includes aria-label 'Edit mode' segment", () => {
    expect(previewToggleSrc).toContain('aria: "Edit mode"');
  });

  it("includes aria-label 'Preview mode' segment", () => {
    expect(previewToggleSrc).toContain('aria: "Preview mode"');
  });

  it("renders aria-pressed on each segment", () => {
    expect(previewToggleSrc).toMatch(/aria-pressed=\{active\}/);
  });

  it("reads from + writes to usePreviewMode", () => {
    expect(previewToggleSrc).toContain('from "@/store/usePreviewMode"');
    expect(previewToggleSrc).toMatch(/usePreviewMode\(\(s\)\s*=>\s*s\.mode\)/);
    expect(previewToggleSrc).toMatch(/usePreviewMode\(\(s\)\s*=>\s*s\.setMode\)/);
  });
});

describe("BuilderApp root mounts data-builder-mode + keyboard listener", () => {
  it("root element carries data-builder-mode attribute bound to store", () => {
    expect(builderAppSrc).toMatch(/data-builder-mode=\{builderMode\}/);
  });

  it("renders <PreviewToggle /> in the top-bar", () => {
    expect(builderAppSrc).toMatch(/<PreviewToggle\s*\/>/);
  });

  it("keyboard listener handles Shift+Cmd+P (metaKey || ctrlKey + shiftKey + 'p')", () => {
    expect(builderAppSrc).toMatch(/metaKey\s*\|\|\s*e\.ctrlKey/);
    expect(builderAppSrc).toMatch(/e\.shiftKey/);
    expect(builderAppSrc).toMatch(/k\s*===\s*"p"/);
  });

  it("keyboard listener handles Escape", () => {
    expect(builderAppSrc).toMatch(/e\.key\s*===\s*"Escape"/);
  });

  it("listener no-ops when focus is inside an input", () => {
    expect(builderAppSrc).toMatch(/t\.tagName\s*===\s*"INPUT"/);
    expect(builderAppSrc).toMatch(/t\.tagName\s*===\s*"TEXTAREA"/);
    expect(builderAppSrc).toMatch(/t\.isContentEditable/);
  });

  it("only Escape return-to-edit when currently in preview (no-op when edit)", () => {
    // s.mode === "preview" guard around the Escape branch
    expect(builderAppSrc).toMatch(/s\.mode\s*===\s*"preview"/);
  });
});

describe("chrome-tokens.css exposes E1 brand tokens", () => {
  it("declares --brand-teal with the Teal Input hex", () => {
    expect(chromeTokens).toMatch(/--brand-teal:\s*#49D0BE/);
  });

  it("declares --brand-peach with the Peach Output hex", () => {
    expect(chromeTokens).toMatch(/--brand-peach:\s*#E5A999/);
  });
});

describe("builder.css gates edit chrome behind [data-builder-mode='edit']", () => {
  const gated = [
    ".canvas-block-handle",
    ".canvas-block-remove",
    ".canvas-block-swap",
    ".bc-chip-rail",
    ".bp-sidebar-resize-handle",
    ".canvas-block.is-selected",
    ".canvas-block:hover",
  ];

  for (const sel of gated) {
    it(`references ${sel} under [data-builder-mode="edit"] at least once`, () => {
      const re = new RegExp(
        `\\[data-builder-mode="edit"\\][^{]*${sel.replace(/[.()]/g, "\\$&")}`,
      );
      expect(builderCss).toMatch(re);
    });
  }

  it("hides chrome under [data-builder-mode='preview'] with display:none", () => {
    expect(builderCss).toMatch(/\[data-builder-mode="preview"\][\s\S]*display:\s*none/);
  });

  it("does NOT gate .bp-sidebar-toggle (layout control, intentional)", () => {
    // The collapse button must remain visible in both modes.
    expect(builderCss).not.toMatch(
      /\[data-builder-mode="preview"\][^{}]*\.bp-sidebar-toggle/,
    );
  });
});

describe("PreviewToggle CSS honours reduce-motion", () => {
  it("preview-toggle-segment transition is wrapped in prefers-reduced-motion", () => {
    expect(builderCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.preview-toggle-segment[\s\S]*transition:\s*none/,
    );
  });

  it("preview-toggle pill keeps a 6px max radius (--bc-radius-sm)", () => {
    const match = builderCss.match(/\.preview-toggle\s*\{([\s\S]*?)\n\}/);
    expect(match).not.toBeNull();
    expect(match![1]).toMatch(/border-radius:\s*var\(--bc-radius-sm/);
  });
});
