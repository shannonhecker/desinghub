import { describe, it, expect } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import { exportViteBootstrap } from "../export/viteExporter";

function setCanvas(designSystem: string, blocks: Array<{ id: string; type: string; props: Record<string, unknown> }>) {
  useBuilder.setState({
    designSystem: designSystem as never,
    mode: "light" as never,
    density: "medium",
    headerBlocks: [],
    sidebarBlocks: [],
    blocks: blocks as never,
    footerBlocks: [],
  });
}

/* The exported Vite bootstrap script must install the REAL official DS
   package(s) for the selected design system (so downloaded code runs against
   the genuine API), plus Highcharts when the canvas contains chart blocks, and
   must emit src/uoaui-theme.css for the CSS-only uoaui DS. */
describe("viteExporter — exported package.json installs real DS deps", () => {
  it("Salt canvas → @salt-ds/core in the generated package.json", () => {
    setCanvas("salt", [{ id: "b1", type: "SimulatedButton", props: { label: "Submit", variant: "primary" } }]);
    const script = exportViteBootstrap();
    expect(script).toContain('"@salt-ds/core"');
    expect(script).toContain('"@salt-ds/theme"');
  });

  it("M3 canvas → @mui/material in the generated package.json", () => {
    setCanvas("m3", [{ id: "b1", type: "SimulatedButton", props: { label: "Submit", variant: "primary" } }]);
    const script = exportViteBootstrap();
    expect(script).toContain('"@mui/material"');
  });

  it("Fluent canvas → @fluentui/react-components in the generated package.json", () => {
    setCanvas("fluent", [{ id: "b1", type: "SimulatedButton", props: { label: "Submit", variant: "primary" } }]);
    const script = exportViteBootstrap();
    expect(script).toContain('"@fluentui/react-components"');
  });

  it("Carbon canvas → @carbon/react in the generated package.json", () => {
    setCanvas("carbon", [{ id: "b1", type: "SimulatedButton", props: { label: "Submit", variant: "primary" } }]);
    const script = exportViteBootstrap();
    expect(script).toContain('"@carbon/react"');
    expect(script).toContain('"@carbon/styles"');
  });

  it("canvas with a Highchart block → highcharts in the generated package.json", () => {
    setCanvas("salt", [{ id: "b1", type: "HighchartLine", props: { title: "Revenue" } }]);
    const script = exportViteBootstrap();
    expect(script).toContain('"highcharts"');
    expect(script).toContain('"highcharts-react-official"');
  });

  it("canvas WITHOUT charts → no highcharts dep", () => {
    setCanvas("salt", [{ id: "b1", type: "SimulatedButton", props: { label: "Submit", variant: "primary" } }]);
    const script = exportViteBootstrap();
    expect(script).not.toContain('"highcharts"');
  });

  it("uoaui canvas → script writes src/uoaui-theme.css and adds no DS package", () => {
    setCanvas("uoaui", [{ id: "b1", type: "SimulatedButton", props: { label: "Submit", variant: "primary" } }]);
    const script = exportViteBootstrap();
    expect(script).toContain("src/uoaui-theme.css");
    expect(script).toContain(".a-btn"); // the theme stylesheet content is emitted
    expect(script).not.toContain("@uoaui/core"); // no fabricated runtime package
  });

  /* The uoaui stylesheet must style the classNames the registry actually emits
     (componentApiRegistry: a-input-label, a-cb-box) — not assumed names — or
     exported uoaui inputs/checkboxes render unstyled. */
  it("uoaui theme styles the exact classNames the registry emits", () => {
    setCanvas("uoaui", [
      { id: "i1", type: "SimulatedTextInput", props: { label: "Email" } },
      { id: "c1", type: "SimulatedCheckbox", props: { label: "Agree", defaultChecked: true } },
    ]);
    const script = exportViteBootstrap();
    expect(script).toContain(".a-input-label"); // registry emits className="a-input-label"
    expect(script).toContain(".a-cb-box");      // registry emits the <span className="a-cb-box">
  });

  /* Regression: appTsxSource() used to prepend its own `import React` on top of
     the one exportReact() already emits → "Duplicate identifier 'React'" under
     `tsc -b`, and it displaced the leading "use client" off line 1. Caught only
     by a real scaffold build, not by substring tests. */
  it("exported App.tsx does not double-import React (chart canvas)", () => {
    setCanvas("uoaui", [{ id: "c", type: "HighchartColumn", props: { chartType: "column", title: "Rev" } }]);
    const script = exportViteBootstrap();
    expect(script).not.toMatch(/import React from "react";\s*\n\s*\nimport React from "react";/);
    expect(script).not.toContain('import React from "react";\n\n"use client";');
  });

  /* Dep ↔ usage coherence: when charts are present the embedded App.tsx must
     actually import Highcharts (not just list the dep), so the installed
     package isn't dead weight. */
  it("chart canvas → the embedded App.tsx imports Highcharts (dep is actually used)", () => {
    setCanvas("salt", [{ id: "c1", type: "HighchartLine", props: { chartType: "line", title: "Revenue" } }]);
    const script = exportViteBootstrap();
    expect(script).toContain('"highcharts"');                                   // installed
    expect(script).toContain('import HighchartsReact from "highcharts-react-official";'); // used
  });
});
