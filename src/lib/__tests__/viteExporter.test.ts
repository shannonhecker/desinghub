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
});
