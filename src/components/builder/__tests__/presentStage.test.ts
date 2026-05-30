/* ════════════════════════════════════════════════════════════
   PR-A (2026-05-30): Present mode = full-stage read-only stage.
   ════════════════════════════════════════════════════════════
   Pins the structural decisions so a later refactor can't
   silently regress them:
     - BuilderApp early-returns <PresentStage/> when in preview,
       after the isStandalone return + after all hooks.
     - PresentStage renders data-builder-mode="preview" (NOT a
       3rd mode value) so it inherits the chrome-hide cascade,
       and wraps the shared <BuilderCanvas> in a read-only
       CanvasDndProvider.
     - PresentBar is construction-only (device / DS badge / theme
       / share / exit), aliases the two setMode functions, and
       has no faux URL bar / traffic-light dots.
     - The canvas render path is unified: both PreviewSidePanel
       and StandalonePreview consume <BuilderCanvas>.
     - --bc-stage token + .present-stage backdrop exist.
   Source-pin (no RTL harness in this repo yet).
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const builderDir = join(process.cwd(), "src", "components", "builder");

const builderAppSrc = readFileSync(join(builderDir, "BuilderApp.tsx"), "utf8");
const previewPanelSrc = readFileSync(join(builderDir, "PreviewPanel.tsx"), "utf8");
const presentStageSrc = readFileSync(join(builderDir, "PresentStage.tsx"), "utf8");
const presentBarSrc = readFileSync(join(builderDir, "PresentBar.tsx"), "utf8");
const builderCss = readFileSync(join(builderDir, "builder.css"), "utf8");
const chromeTokens = readFileSync(join(builderDir, "chrome-tokens.css"), "utf8");

describe("BuilderApp enters Present mode via early-return", () => {
  it("imports PresentStage", () => {
    expect(builderAppSrc).toMatch(/import\s*\{\s*PresentStage\s*\}\s*from\s*["']\.\/PresentStage["']/);
  });

  it("early-returns <PresentStage/> when builderMode === 'preview'", () => {
    expect(builderAppSrc).toMatch(/if\s*\(\s*builderMode\s*===\s*"preview"\s*\)\s*return\s*<PresentStage\s*\/>/);
  });

  it("the preview early-return sits after the isStandalone early-return", () => {
    const standaloneIdx = builderAppSrc.indexOf("if (isStandalone) return <StandalonePreview />");
    const presentIdx = builderAppSrc.search(/if\s*\(\s*builderMode\s*===\s*"preview"\s*\)\s*return\s*<PresentStage/);
    expect(standaloneIdx).toBeGreaterThan(-1);
    expect(presentIdx).toBeGreaterThan(standaloneIdx);
  });
});

describe("PresentStage is a read-only full-stage shell", () => {
  it("root carries data-builder-mode=\"preview\" (not a 3rd mode value)", () => {
    expect(presentStageSrc).toMatch(/data-builder-mode="preview"/);
    expect(presentStageSrc).not.toMatch(/data-builder-mode="present"/);
  });

  it("wraps the shared BuilderCanvas in a read-only CanvasDndProvider", () => {
    expect(presentStageSrc).toMatch(/<CanvasDndProvider readOnly>/);
    expect(presentStageSrc).toMatch(/<BuilderCanvas framed responsive resizableSidebar allowEmptyState \/>/);
  });

  it("imports the canvas pieces from PreviewPanel (one render path)", () => {
    expect(presentStageSrc).toMatch(/import\s*\{[^}]*\bCanvasDndProvider\b[^}]*\bBuilderCanvas\b[^}]*\}\s*from\s*["']\.\/PreviewPanel["']/);
  });

  it("captures + restores focus on enter/exit", () => {
    expect(presentStageSrc).toMatch(/document\.activeElement/);
    expect(presentStageSrc).toMatch(/stageRef\.current\?\.focus\(\)/);
  });
});

describe("PresentBar is construction-only and aliases setMode", () => {
  it("aliases the two setMode functions (useBuilder theme vs usePreviewMode edit/preview)", () => {
    expect(presentBarSrc).toMatch(/from\s*["']@\/store\/usePreviewMode["']/);
    expect(presentBarSrc).toMatch(/usePreviewMode\(\(s\)\s*=>\s*s\.setMode\)/);
    // The light/dark theme setter is aliased so it never crosses the exit setter.
    expect(presentBarSrc).toMatch(/const\s+setThemeMode\s*=\s*useBuilder\(\(s\)\s*=>\s*s\.setMode\)/);
  });

  it("Exit returns to edit mode", () => {
    expect(presentBarSrc).toMatch(/setBuilderMode\("edit"\)/);
  });

  it("device buttons expose aria-pressed (non-colour active cue)", () => {
    expect(presentBarSrc).toMatch(/aria-pressed=\{deviceMode === key\}/);
  });

  it("has NO faux URL bar or traffic-light dots", () => {
    expect(presentBarSrc).not.toMatch(/preview-dot|traffic|url-bar|address-bar/i);
  });

  it("omits power-user controls (undo / redo / Components / Export / density)", () => {
    expect(presentBarSrc).not.toMatch(/canvasUndo|canvasRedo|toggleComponentLibrary|ExportPanel|setDensity/);
  });
});

describe("Canvas render path is unified", () => {
  it("PreviewPanel exports BuilderCanvas, DeviceFrame, CanvasDndProvider, DSPreviewStyles", () => {
    expect(previewPanelSrc).toMatch(/export function BuilderCanvas\(/);
    expect(previewPanelSrc).toMatch(/export function DeviceFrame\(/);
    expect(previewPanelSrc).toMatch(/export function CanvasDndProvider\(/);
    expect(previewPanelSrc).toMatch(/export function DSPreviewStyles\(/);
  });

  it("PreviewSidePanel renders the framed BuilderCanvas", () => {
    expect(previewPanelSrc).toMatch(/<BuilderCanvas framed responsive resizableSidebar allowEmptyState \/>/);
  });

  it("StandalonePreview renders the plain BuilderCanvas", () => {
    expect(previewPanelSrc).toMatch(/<BuilderCanvas \/>/);
  });

  it("DeviceFrame guards its spring with useReducedMotion", () => {
    expect(previewPanelSrc).toMatch(/useReducedMotion/);
    expect(previewPanelSrc).toMatch(/reduceMotion\s*\?\s*\{\s*duration:\s*0\s*\}/);
  });
});

describe("Stage backdrop is a neutral, theme-aware token", () => {
  it("--bc-stage is declared in both dark (:root) and light (.builder-light) scopes", () => {
    const matches = chromeTokens.match(/--bc-stage:/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it(".present-stage paints var(--bc-stage)", () => {
    expect(builderCss).toMatch(/\.present-stage\s*\{[\s\S]*?background:\s*var\(--bc-stage\)/);
  });

  it("present-bar uses UNPREFIXED backdrop-filter only (lightningcss safe)", () => {
    expect(builderCss).toMatch(/\.present-bar\s*\{[\s\S]*?backdrop-filter:\s*blur/);
    expect(builderCss).not.toMatch(/-webkit-backdrop-filter:[^;]*;\s*\n\s*backdrop-filter/);
  });
});
