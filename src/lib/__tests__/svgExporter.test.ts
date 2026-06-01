import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { useBuilder } from "@/store/useBuilder";
import { exportSvg } from "../export/svgExporter";
import { exportFigmaSvg, sanitizeSvg } from "../export/figmaSvgExporter";

/* Read the figmaSvgExporter SOURCE so we can assert it targets the corrected
   selectors + the renamed SvgNode interface (the design got the selector
   wrong). Resolved from process.cwd() (the repo root under vitest), since
   import.meta.url is not a file: URL under the jsdom transform. */
function readFigmaExporterSource(): string {
  return readFileSync(
    path.resolve(process.cwd(), "src/lib/export/figmaSvgExporter.ts"),
    "utf8",
  );
}

/* Mirror reactExporter.test.ts: set a populated canvas via setState. */
function setCanvas(
  designSystem: string,
  mode: "light" | "dark",
  zones: {
    header?: Array<{ id: string; type: string; props: Record<string, unknown> }>;
    sidebar?: Array<{ id: string; type: string; props: Record<string, unknown> }>;
    body?: Array<{ id: string; type: string; props: Record<string, unknown>; children?: unknown[] }>;
    footer?: Array<{ id: string; type: string; props: Record<string, unknown> }>;
  },
) {
  useBuilder.setState({
    designSystem: designSystem as never,
    mode: mode as never,
    density: "medium",
    headerBlocks: (zones.header ?? []) as never,
    sidebarBlocks: (zones.sidebar ?? []) as never,
    blocks: (zones.body ?? []) as never,
    footerBlocks: (zones.footer ?? []) as never,
  });
}

describe("svgExporter — store-based wireframe SVG (Figma-editable)", () => {
  it("returns a real <svg> document string", () => {
    setCanvas("salt", "light", {
      body: [{ id: "b1", type: "SimulatedTitle", props: { text: "Dashboard" } }],
    });
    const svg = exportSvg();
    expect(typeof svg).toBe("string");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("xmlns=\"http://www.w3.org/2000/svg\"");
  });

  it("NEVER emits <foreignObject> (Figma can't import it as editable layers)", () => {
    setCanvas("salt", "dark", {
      header: [{ id: "h1", type: "AppBrand", props: { label: "Acme" } }],
      sidebar: [{ id: "n1", type: "NavItem", props: { label: "Home", active: true } }],
      body: [
        { id: "b1", type: "SimulatedCard", props: { title: "Card", content: "Body" } },
        { id: "c1", type: "HighchartLine", props: { title: "Revenue", chartType: "line" } },
      ],
      footer: [{ id: "f1", type: "FooterText", props: { label: "Powered by", version: "v1" } }],
    });
    const svg = exportSvg();
    expect(svg).not.toContain("foreignObject");
  });

  it("emits a named <g> per zone that has blocks", () => {
    setCanvas("m3", "light", {
      header: [{ id: "h1", type: "AppBrand", props: { label: "Brand" } }],
      sidebar: [{ id: "n1", type: "NavItem", props: { label: "Home" } }],
      body: [{ id: "b1", type: "SimulatedStatCard", props: { label: "Users", value: "1.2k", pct: 60 } }],
      footer: [{ id: "f1", type: "FooterText", props: { label: "Footer" } }],
    });
    const svg = exportSvg();
    expect(svg).toContain('id="zone-header"');
    expect(svg).toContain('id="zone-sidebar"');
    expect(svg).toContain('id="zone-body"');
    expect(svg).toContain('id="zone-footer"');
  });

  it("omits empty zones (no <g> for a zone with no blocks)", () => {
    setCanvas("salt", "light", {
      body: [{ id: "b1", type: "SimulatedTitle", props: { text: "Solo" } }],
    });
    const svg = exportSvg();
    expect(svg).toContain('id="zone-body"');
    expect(svg).not.toContain('id="zone-header"');
    expect(svg).not.toContain('id="zone-sidebar"');
    expect(svg).not.toContain('id="zone-footer"');
  });

  it("emits a named <g> per block built from primitives", () => {
    setCanvas("salt", "light", {
      body: [{ id: "card7", type: "SimulatedCard", props: { title: "Sales", content: "Q3" } }],
    });
    const svg = exportSvg();
    expect(svg).toContain('id="block-SimulatedCard-card7"');
    expect(svg).toContain("<rect");
    expect(svg).toContain("<text");
  });

  it("includes a block's title/label text in the output", () => {
    setCanvas("salt", "light", {
      body: [
        { id: "b1", type: "SimulatedTitle", props: { text: "Quarterly Report" } },
        { id: "b2", type: "SimulatedStatCard", props: { label: "Revenue", value: "42", pct: 80 } },
      ],
    });
    const svg = exportSvg();
    expect(svg).toContain("Quarterly Report");
    expect(svg).toContain("Revenue");
  });

  it("tints output with the active DS accent (salt=#1B7F9E)", () => {
    setCanvas("salt", "light", {
      body: [{ id: "b1", type: "SimulatedButton", props: { label: "Go", variant: "primary" } }],
    });
    const svg = exportSvg();
    expect(svg).toContain("#1B7F9E");
  });

  it("uses the m3 accent (#6750A4) for an m3 canvas", () => {
    setCanvas("m3", "light", {
      body: [{ id: "b1", type: "SimulatedButton", props: { label: "Go" } }],
    });
    expect(exportSvg()).toContain("#6750A4");
  });

  it("walks one level of LayoutGroup children", () => {
    setCanvas("salt", "light", {
      body: [
        {
          id: "grp1",
          type: "LayoutGroup",
          props: { direction: "stack" },
          children: [{ id: "kid1", type: "SimulatedCard", props: { title: "Nested", content: "" } }],
        },
      ],
    });
    const svg = exportSvg();
    expect(svg).toContain('id="block-LayoutGroup-grp1"');
    expect(svg).toContain('id="block-SimulatedCard-kid1"');
    expect(svg).toContain("Nested");
  });

  it("escapes XML-special characters in user copy", () => {
    setCanvas("salt", "light", {
      body: [{ id: "b1", type: "SimulatedTitle", props: { text: "A & B <C>" } }],
    });
    const svg = exportSvg();
    expect(svg).toContain("&amp;");
    expect(svg).not.toMatch(/A & B/);
  });
});

describe("figmaSvgExporter — DOM-measured (guarded when no canvas)", () => {
  it("returns null when no canvas is mounted (jsdom has no live layout)", () => {
    /* jsdom defines document but querySelector finds no canvas root, OR
       getBoundingClientRect returns a zero box — either way: null. */
    expect(exportFigmaSvg()).toBeNull();
  });

  it("source targets the CORRECTED live-canvas selectors (not .dashboard-layout)", () => {
    const src = readFigmaExporterSource();
    expect(src).toContain(".present-stage-viewport .bp-dashboard");
    expect(src).toContain(".present-stage-viewport");
    expect(src).toContain(".bp-dashboard");
    /* The blueprint's wrong selector must NOT be a live-DOM query target. */
    expect(src).not.toContain('".dashboard-layout"');
    expect(src).not.toContain('".present-stage-viewport .dashboard-layout"');
  });

  it("renames the local node interface to SvgNode (no DOM `Node` shadowing)", () => {
    const src = readFigmaExporterSource();
    expect(src).toContain("interface SvgNode");
    expect(src).not.toContain("interface Node ");
    /* DOM Node global must remain usable for the text-node check. */
    expect(src).toContain("Node.TEXT_NODE");
  });

  it("sanitizeSvg strips foreignObject / script / style / event handlers from a chart SVG", () => {
    const dirty =
      '<svg onload="alert(1)"><foreignObject><div>x</div></foreignObject>' +
      '<script>evil()</script><style>*{}</style>' +
      '<rect width="10" height="10" onclick="boom()" /></svg>';
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toContain("foreignObject");
    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("<style");
    expect(clean).not.toContain("onload=");
    expect(clean).not.toContain("onclick=");
    expect(clean).toContain('<rect width="10" height="10"'); // real geometry preserved
  });
});
