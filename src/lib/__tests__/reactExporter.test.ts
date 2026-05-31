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

  it("falls back to generic markup for an un-registered DS (carbon, not yet seeded)", () => {
    setCanvas("carbon", [{ id: "b1", type: "SimulatedButton", props: { label: "X", variant: "primary" } }]);
    const code = exportReact();
    expect(code).toContain('className="btn'); // graceful fallback, not a crash
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
});
