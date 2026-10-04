import { beforeEach, describe, expect, it } from "vitest";
import { decodeShareState, encodeShareState, type SharedCanvas } from "../shareState";
import { useBuilder } from "@/store/useBuilder";
import { exportHTML } from "../export/htmlExporter";
import { exportReact } from "../export/reactExporter";
import ts from "typescript";

const base: SharedCanvas = {
  v: 1, designSystem: "salt", mode: "light", density: "medium",
  canvasSpacing: "tight", deviceMode: "desktop", themeKey: null, activeTemplateId: null,
  headerBlocks: [], sidebarBlocks: [], footerBlocks: [],
  blocks: [{ id: "safe", type: "PageTitle", props: { text: "Safe canvas" } }],
};
const hostileTypes = ['x" data-pwned="yes', 'x--><img src=x onerror=alert(1)>', 'x*/}{alert(1)}{/*'];

beforeEach(() => useBuilder.setState({ ...base, pages: [], activePageId: null, themeKey: "jpm-light" }));

describe("shared code generation trust boundary", () => {
  it.each([...hostileTypes, "UnknownBlock", "constructor", "__proto__"])("rejects unknown or hostile block type %s", (type) => {
    const payload = { ...base, blocks: [{ id: "bad", type, props: {} }] };
    expect(decodeShareState(encodeShareState(payload))).toBeNull();
  });

  it.each(['medium" data-pwned="yes', 'medium*/}{alert(1)}{/*', "", "spacious"])("rejects unknown density %s", (density) => {
    expect(decodeShareState(encodeShareState({ ...base, density }))).toBeNull();
  });

  it("validates nested blocks and inactive multi-page bodies", () => {
    const child = { id: "bad", type: hostileTypes[0], props: {} };
    const group = { id: "group", type: "LayoutGroup", props: {}, children: [child, base.blocks[0]] };
    const decoded = decodeShareState(encodeShareState({ ...base, blocks: [group] }));
    // Existing nested-block policy drops invalid children, retaining valid siblings.
    expect(decoded?.blocks[0].children).toEqual([base.blocks[0]]);
    const pages = [{ id: "one", name: "One", body: base.blocks }, { id: "two", name: "Two", body: [child] }];
    expect(decodeShareState(encodeShareState({ ...base, v: 2, pages, activePageId: "one" }))).toBeNull();
  });

  it.each(["high", "medium", "low", "touch"])("valid canvas round-trips and exports at %s density", (density) => {
    const decoded = decodeShareState(encodeShareState({ ...base, density }));
    expect(decoded).not.toBeNull();
    useBuilder.setState({ ...decoded!, themeKey: "jpm-light" });
    expect(exportHTML()).toContain("Safe canvas");
    expect(exportReact()).toContain("Safe canvas");
  });

  it.each(hostileTypes)("HTML exporter escapes the fallback class and comment for %s", (type) => {
    useBuilder.setState({ blocks: [{ id: "bad", type, props: {} }] });
    const doc = new DOMParser().parseFromString(exportHTML(), "text/html");
    expect(doc.querySelector("[data-pwned], [onerror]")).toBeNull();
    expect([...doc.querySelectorAll("main div")].some(el => el.getAttribute("class") === type.toLowerCase())).toBe(true);
  });

  it.each(hostileTypes)("React exporter keeps hostile type inert: %s", (type) => {
    useBuilder.setState({ blocks: [{ id: "bad", type, props: {} }] });
    const code = exportReact();
    const file = ts.createSourceFile("Dashboard.tsx", code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const injected: string[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isJsxAttribute(node) && node.name.getText(file) === "data-pwned") injected.push("attribute");
      if (ts.isCallExpression(node) && node.expression.getText(file) === "alert") injected.push("expression");
      ts.forEachChild(node, visit);
    };
    visit(file);
    expect(injected).toEqual([]);
    const result = ts.transpileModule(code, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX }, reportDiagnostics: true });
    expect(result.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error)).toEqual([]);
  });

  it("React exporter escapes density even when a caller bypasses shared-link decoding", () => {
    useBuilder.setState({ density: 'medium" data-pwned="yes' });
    expect(exportReact()).toContain('data-density="medium&quot; data-pwned=&quot;yes"');
  });
});
