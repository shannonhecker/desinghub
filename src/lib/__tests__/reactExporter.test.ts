import { describe, it, expect } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import { exportReact } from "../export/reactExporter";

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

/* P3: reactExporter must emit REAL DS component code via the ComponentAPIRegistry,
   not the old `className="btn"` pseudocode — for DSs/blocks the registry covers. */
describe("reactExporter — real DS code for registry-covered blocks", () => {
  it("Salt button → real <Button sentiment/appearance> + @salt-ds/core import + provider", () => {
    setCanvas("salt", [{ id: "b1", type: "SimulatedButton", props: { label: "Submit", variant: "primary" } }]);
    const code = exportReact();
    expect(code).toContain('import { Button } from "@salt-ds/core";');
    expect(code).toContain("SaltProvider");
    expect(code).toContain('<Button sentiment="accented" appearance="solid">Submit</Button>');
    expect(code).not.toContain('className="btn'); // no pseudocode for the salt button
  });

  it("falls back to generic markup for an intentionally-omitted block (uoaui ships no switch)", () => {
    setCanvas("uoaui", [{ id: "b1", type: "SimulatedSwitch", props: { label: "Wifi", defaultOn: true } }]);
    const code = exportReact();
    expect(code).toContain('className="switch"'); // graceful generic fallback, not a crash
  });

  it("falls back to generic markup for an un-registered block in Salt", () => {
    setCanvas("salt", [{ id: "b1", type: "SimulatedBreadcrumb", props: { pathCsv: "Home, Settings" } }]);
    const code = exportReact();
    expect(code).toContain('className="breadcrumb"');
  });

  it("M3 button → real MUI <Button variant=contained> + @mui/material import + ThemeProvider/createTheme", () => {
    setCanvas("m3", [{ id: "b1", type: "SimulatedButton", props: { label: "Submit", variant: "primary" } }]);
    const code = exportReact();
    expect(code).toContain('import { Button } from "@mui/material";');
    expect(code).toContain('import { ThemeProvider, createTheme } from "@mui/material";');
    expect(code).toContain("createTheme({ palette: { mode:");
    expect(code).toContain('<Button variant="contained">Submit</Button>');
    expect(code).not.toContain('className="btn');
  });

  it("Fluent button → real <Button appearance> + FluentProvider theme + @fluentui/react-components import", () => {
    setCanvas("fluent", [{ id: "b1", type: "SimulatedButton", props: { label: "Submit", variant: "primary" } }]);
    const code = exportReact();
    expect(code).toContain('from "@fluentui/react-components";');
    expect(code).toContain("FluentProvider theme={webLightTheme}");
    expect(code).toContain('<Button appearance="primary">Submit</Button>');
    expect(code).not.toContain('className="btn');
  });

  it("Carbon button → real <Button kind> + <Theme theme> + @carbon/react import + styles css", () => {
    setCanvas("carbon", [{ id: "b1", type: "SimulatedButton", props: { label: "Submit", variant: "primary" } }]);
    const code = exportReact();
    expect(code).toContain('from "@carbon/react";');
    expect(code).toContain('import "@carbon/styles/css/styles.css";');
    expect(code).toContain('<Theme theme="white">');
    expect(code).toContain('<Button kind="primary">Submit</Button>');
    expect(code).not.toContain('className="btn');
  });

  it("uoaui button → a-* classNames + side-effect uoaui-theme.css import + NO provider wrapper", () => {
    setCanvas("uoaui", [{ id: "b1", type: "SimulatedButton", props: { label: "Submit", variant: "primary" } }]);
    const code = exportReact();
    expect(code).toContain('import "./uoaui-theme.css";');
    expect(code).toContain('<button className="a-btn a-btn-primary">Submit</button>');
    expect(code).not.toContain("UoauiProvider"); // no fabricated provider package
    expect(code).not.toContain('className="btn'); // real a-btn, not generic pseudocode
  });
});

/* #3: charts must export RUNNABLE Highcharts, not a dead <div className="chart-placeholder">. */
describe("reactExporter — real Highcharts export bridge", () => {
  it("a chart block emits <ChartBlock>, highcharts imports, and a ChartBlock definition", () => {
    setCanvas("salt", [{ id: "c1", type: "HighchartLine", props: { chartType: "line", title: "Monthly Revenue" } }]);
    const code = exportReact();
    expect(code).toContain("<ChartBlock");
    expect(code).toContain('type="line"');
    expect(code).toContain('title="Monthly Revenue"');
    expect(code).toContain('import HighchartsReact from "highcharts-react-official";');
    expect(code).toContain('import Highcharts from "highcharts";');
    expect(code).toContain("function ChartBlock");
    expect(code).not.toContain("chart-placeholder"); // the dead placeholder is gone
    expect(code.startsWith('"use client";')).toBe(true); // client component for Next App Router portability
  });

  it("SimulatedChart maps to a line ChartBlock and threads the builder mode", () => {
    setCanvas("m3", [{ id: "c1", type: "SimulatedChart", props: { title: "Trend" } }]);
    const code = exportReact();
    expect(code).toContain('<ChartBlock type="line"');
    expect(code).toContain('mode="light"'); // setCanvas sets mode: "light"
  });

  it("a no-chart canvas does NOT emit chart imports or the helper", () => {
    setCanvas("salt", [{ id: "b1", type: "SimulatedButton", props: { label: "Submit", variant: "primary" } }]);
    const code = exportReact();
    expect(code).not.toContain("highcharts-react-official");
    expect(code).not.toContain("function ChartBlock");
    expect(code).not.toContain("<ChartBlock");
    expect(code.startsWith('"use client"')).toBe(false); // no charts → plain presentational file
  });
});
