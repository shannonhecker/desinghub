import { describe, expect, it } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { ChromeIcon } from "../ChromeIcon";
import { chromeIconNames, chromeIconNode, createChromeIconElement, hasChromeIcon } from "@/lib/chromeIcons";
import { BUILDER_TEMPLATES } from "@/lib/builderTemplates";
import { LIBRARY_BLUEPRINTS, LIBRARY_CATEGORY_ORDER } from "@/lib/blockRegistry";
import { MODE_OPTIONS, TYPE_OPTIONS } from "@/lib/wizardFlow";

/**
 * The builder chrome draws inline SVG icons, never icon-font ligatures.
 *
 * A ligature is the icon's name as text ("content_copy") that a font turns
 * into a glyph; with the font slow or blocked every control showed letters.
 */
const ROOT = resolve(__dirname, "../../../..");
const BUILDER = join(ROOT, "src/components/builder");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "__tests__" ? [] : files(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}
const read = (path: string) => readFileSync(path, "utf8");
function render(node: ReactElement) {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(node);
  return { container };
}
const rel = (path: string) => path.slice(ROOT.length + 1);

describe("chrome icons", () => {
  it("draws an SVG one em square in the current colour, hidden from assistive technology", () => {
    const { container } = render(<ChromeIcon name="content_copy" className="lib-zone-icon" style={{ fontSize: 14 }} />);
    const svg = container.querySelector("svg")!;
    expect(svg.classList.contains("chrome-icon")).toBe(true);
    expect(svg.classList.contains("lib-zone-icon")).toBe(true);
    expect(svg.getAttribute("data-icon")).toBe("content_copy");
    expect(svg.getAttribute("width")).toBe("1em");
    expect(svg.getAttribute("height")).toBe("1em");
    expect(svg.getAttribute("stroke")).toBe("currentColor");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.style.fontSize).toBe("14px");
    expect(svg.textContent).toBe("");
    expect(svg.querySelectorAll("path, rect, circle, line, polyline").length).toBeGreaterThan(0);
  });

  it("the filled style fills with the current colour", () => {
    const { container } = render(<ChromeIcon name="send" filled />);
    expect(container.querySelector("svg")!.getAttribute("fill")).toBe("currentColor");
    const outline = render(<ChromeIcon name="send" />);
    expect(outline.container.querySelector("svg")!.getAttribute("fill")).toBe("none");
  });

  it("a name with no icon draws a neutral mark, never its letters", () => {
    const { container } = render(<ChromeIcon name="not_an_icon_name" />);
    const svg = container.querySelector("svg")!;
    expect(svg.textContent).toBe("");
    expect(container.textContent).toBe("");
    expect(svg.getAttribute("data-icon-missing")).toBe("true");
    expect(svg.querySelectorAll("path").length).toBeGreaterThan(0);
  });

  it("no ligature is left in the chrome's source: only canvas content keeps the icon font", () => {
    const left = [...files(BUILDER), join(ROOT, "src/lib/toast.ts"), join(ROOT, "src/lib/blockRegistry.tsx")]
      .filter((f) => read(f).includes("material-symbols-outlined"))
      .map(rel);
    /* SimulatedUI draws the blocks on the canvas: a block's icon belongs to
       the design system on show. */
    expect(left).toEqual(["src/components/builder/SimulatedUI.tsx"]);
  });

  it("the component library's own controls draw SVG too: only specimens keep the icon font", () => {
    const left = files(join(ROOT, "src/components"))
      .filter((f) => !f.startsWith(BUILDER) && read(f).includes("material-symbols-outlined"))
      .map(rel)
      .sort();
    /* Each of these draws a design system's component, not the library's
       chrome: an anatomy diagram, the iconography foundation, a variant
       example and the real-component renderers. */
    expect(left).toEqual([
      "src/components/ui-kit/AnatomyDiagram.tsx",
      "src/components/ui-kit/FoundationThumb.tsx",
      "src/components/ui-kit/RealComponentRenderer.tsx",
      "src/components/ui-kit/VariantExample.tsx",
      "src/components/ui-kit/realBlockMap.ts",
    ]);
    for (const css of ["src/components/ui-kit/kit-chrome.css", "src/components/ui-kit/tool-page.css"]) {
      expect(read(join(ROOT, css)), css).not.toContain("material-symbols-outlined");
    }
    /* Names the library takes from data or picks in code. */
    for (const name of ["palette", "fact_check", "widgets", "build", "table_rows", "format_paint", "check_circle", "cancel", "keyboard", "hearing", "contrast"]) {
      expect(hasChromeIcon(name), name).toBe(true);
    }
  });

  it("every icon a chrome call site names has an icon", () => {
    const missing: string[] = [];
    for (const file of [...files(join(ROOT, "src/components")), ...files(join(ROOT, "src/app")), join(ROOT, "src/lib/blockRegistry.tsx")]) {
      const text = read(file);
      for (const tag of text.matchAll(/<ChromeIcon\b[^>]*?\bname=(?:"([a-z_0-9]+)"|\{([^}]*)\})/g)) {
        const names = tag[1] ? [tag[1]] : [...tag[2].matchAll(/"([a-z_0-9]+)"/g)].map((m) => m[1]);
        /* Words in a condition (`mode === "dark"`) are not icon names. */
        const conditions = tag[2] ? [...tag[2].matchAll(/===\s*"([a-z_0-9-]+)"/g)].map((m) => m[1]) : [];
        for (const name of names) if (!conditions.includes(name) && !hasChromeIcon(name)) missing.push(`${rel(file)}: ${name}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("every icon named by data the chrome draws has an icon", () => {
    const named = new Map<string, string>();
    const add = (where: string, name: unknown) => { if (typeof name === "string" && name && name !== "none") named.set(name, where); };
    for (const t of Object.values(BUILDER_TEMPLATES)) add(`template ${t.id}`, t.icon);
    for (const b of LIBRARY_BLUEPRINTS) add(`blueprint ${b.id}`, b.icon);
    for (const c of LIBRARY_CATEGORY_ORDER) add(`library category ${c.key}`, c.icon);
    for (const o of TYPE_OPTIONS) add(`wizard type ${o.value}`, o.icon);
    for (const o of MODE_OPTIONS) add(`wizard mode ${o.value}`, o.icon);
    /* Menus, toolbars, tool cards and toasts keep their icon names beside the
       code that draws them. */
    const literal = /\bicon(?::|=)\s*"([a-z_0-9]+)"/g;
    for (const name of ["BlockContextMenu.tsx", "SwapMenu.tsx", "ZoneLayoutOverlay.tsx", "cards/ToolUseCard.tsx", "ComponentLibrary.tsx", "ReportDataButton.tsx"]) {
      for (const m of read(join(BUILDER, name)).matchAll(literal)) add(name, m[1]);
    }
    const zoneIcons = read(join(BUILDER, "BlockContextMenu.tsx")).match(/const ZONE_ICON[^{]*\{([^}]*)\}/)![1];
    for (const m of zoneIcons.matchAll(/:\s*"([a-z_0-9]+)"/g)) add("zone menu", m[1]);
    for (const m of read(join(BUILDER, "cards/ToolUseCard.tsx")).matchAll(/:\s*"([a-z_]+)",?\s*$/gm)) add("tool card", m[1]);
    const preview = read(join(BUILDER, "PreviewPanel.tsx"));
    for (const m of preview.matchAll(/label: "[^"]+",\s*icon: "([a-z_0-9]+)"/g)) add("PreviewPanel.tsx", m[1]);
    for (const file of files(join(ROOT, "src"))) {
      for (const m of read(file).matchAll(/showToast\([^;]*?\bicon:\s*(?:[^"]*?\?\s*)?"([a-z_0-9]+)"(?:\s*:\s*"([a-z_0-9]+)")?/g)) {
        add(`toast in ${rel(file)}`, m[1]);
        add(`toast in ${rel(file)}`, m[2]);
      }
    }
    expect(named.size).toBeGreaterThan(90);
    const missing = [...named].filter(([name]) => !hasChromeIcon(name)).map(([name, where]) => `${name} (${where})`);
    expect(missing).toEqual([]);
  });

  it("every drawing has ink, and none carries a class a design-system stylesheet could match", () => {
    expect(chromeIconNames().length).toBeGreaterThan(150);
    for (const name of chromeIconNames()) {
      const node = chromeIconNode(name);
      expect(node.length, name).toBeGreaterThan(0);
      for (const [tag, attrs] of node) {
        expect(["path", "rect", "circle", "line", "polyline", "polygon", "ellipse"], `${name}: <${tag}>`).toContain(tag);
        expect(Object.keys(attrs), name).not.toContain("class");
      }
    }
    /* The builder's stylesheets match class names by substring
       ([class*="-table"], [class*="-link"]): the icon's only class is its own. */
    const { container } = render(<ChromeIcon name="table_chart" />);
    expect(container.querySelector("svg")!.getAttribute("class")).toBe("chrome-icon");
  });

  it("code with no React draws the same icon (the toast)", () => {
    const { container } = render(<ChromeIcon name="check_circle" className="dh-toast-icon" />);
    const fromReact = container.querySelector("svg")!;
    const fromDom = createChromeIconElement("check_circle", "dh-toast-icon");
    expect(fromDom.getAttribute("class")).toBe(fromReact.getAttribute("class"));
    expect(fromDom.innerHTML).toBe(fromReact.innerHTML);
    for (const attr of ["viewBox", "width", "height", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "aria-hidden", "data-icon"]) {
      expect(fromDom.getAttribute(attr), attr).toBe(fromReact.getAttribute(attr));
    }
  });
});
