/* ════════════════════════════════════════════════════════════
   Export render fidelity + accessibility (the wedge polish).
   ════════════════════════════════════════════════════════════
   Guards five regressions in the exporters:
   (a) every shell class the react/vite exporters emit has a real
       selector in viteExporter's STYLES_CSS (no dead .app-* rules,
       no orphaned .zone-* markup);
   (b) every html variant/alert/tab/badge class the htmlExporter
       emits has a selector in exportHTML()'s <style>;
   (c) exportHTML output carries :focus(-visible) rings for the
       interactive selectors;
   (d) exportReact maps zones to semantic landmarks
       (<header>/<aside>/<main>/<footer>), not bare <div>s;
   (e) an empty-canvas vite export ships only react + react-dom —
       no DS provider packages until a real component is on canvas.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import { exportReact } from "./reactExporter";
import { exportHTML } from "./htmlExporter";
import { exportViteBootstrap } from "./viteExporter";

/* eslint-disable @typescript-eslint/no-explicit-any */
function setCanvas(opts: {
  designSystem?: string;
  header?: any[];
  sidebar?: any[];
  body?: any[];
  footer?: any[];
}) {
  useBuilder.setState({
    designSystem: (opts.designSystem ?? "salt") as never,
    mode: "light" as never,
    density: "medium",
    headerBlocks: (opts.header ?? []) as never,
    sidebarBlocks: (opts.sidebar ?? []) as never,
    blocks: (opts.body ?? []) as never,
    footerBlocks: (opts.footer ?? []) as never,
    zoneLayouts: {} as never,
  });
}

/* Pull the body of a here-doc'd file out of the bootstrap shell script.
   exportViteBootstrap emits `cat > "<path>" <<'EOF_N'\n<contents>\nEOF_N`. */
function fileFromBootstrap(script: string, path: string): string {
  const start = script.indexOf(`cat > "${path}" <<'`);
  if (start === -1) throw new Error(`file ${path} not found in bootstrap`);
  const delimMatch = script.slice(start).match(/<<'([^']+)'\n/);
  if (!delimMatch) throw new Error(`delimiter for ${path} not found`);
  const delim = delimMatch[1];
  const afterHeader = start + (delimMatch.index ?? 0) + delimMatch[0].length;
  const end = script.indexOf(`\n${delim}\n`, afterHeader);
  return script.slice(afterHeader, end === -1 ? undefined : end);
}

/* Every shell class the react/vite shell can emit (confirmed against
   reactExporter: dashboard-layout, the four zone-* fallbacks, layout-group,
   sim-image, avatar, footer-text, app-brand, status-pill). */
const SHELL_CLASSES = [
  "dashboard-layout",
  "zone-header",
  "zone-sidebar",
  "zone-body",
  "zone-footer",
  "layout-group",
  "sim-image",
  "avatar",
  "footer-text",
  "app-brand",
  "status-pill",
];

describe("(a) STYLES_CSS has a real rule for every emitted shell class", () => {
  it("vite styles.css defines every shell selector reactExporter emits", () => {
    setCanvas({});
    const css = fileFromBootstrap(exportViteBootstrap(), "src/styles.css");
    for (const cls of SHELL_CLASSES) {
      expect(css, `missing selector .${cls}`).toMatch(new RegExp(`\\.${cls}\\b`));
    }
  });

  it("vite styles.css has NO dead .app-* shell selectors (they are never emitted)", () => {
    setCanvas({});
    const css = fileFromBootstrap(exportViteBootstrap(), "src/styles.css");
    for (const dead of ["app-header", "app-footer", "app-body", "app-sidebar", "app-main", "app-root"]) {
      expect(css, `dead selector .${dead} still present`).not.toMatch(new RegExp(`\\.${dead}\\b`));
    }
  });

  it("vite styles.css stacks the shell on mobile (one column under 768px)", () => {
    setCanvas({});
    const css = fileFromBootstrap(exportViteBootstrap(), "src/styles.css");
    expect(css).toMatch(/@media\s*\(max-width:\s*768px\)/);
  });

  it("vite styles.css gives interactive selectors a visible :focus-visible ring", () => {
    setCanvas({});
    const css = fileFromBootstrap(exportViteBootstrap(), "src/styles.css");
    expect(css).toMatch(/:focus-visible/);
    // .btn sets border:0, so its ring MUST be outline or box-shadow, not border.
    // The selector may be comma-grouped — match from `.btn:focus-visible` to the
    // next declaration block.
    const btnFocus = css.match(/\.btn:focus-visible[^{]*\{[^}]*\}/);
    expect(btnFocus, ".btn:focus-visible rule missing").not.toBeNull();
    expect(btnFocus![0]).toMatch(/outline|box-shadow/);
  });
});

describe("(b) exportHTML <style> has a rule for every emitted variant/alert/tab/badge class", () => {
  it("covers every btn / alert / badge variant + .tab the markup can emit", () => {
    setCanvas({});
    const html = exportHTML();
    const required = [
      // button variants from BUTTON_VARIANTS
      "btn-secondary",
      "btn-outline",
      "btn-ghost",
      // alert variants from ALERT_VARIANTS
      "alert-info",
      "alert-success",
      "alert-warning",
      "alert-error",
      // badge statuses from BADGE_STATUSES
      "badge-info",
      "badge-success",
      "badge-warning",
      "badge-error",
      // tabs
      "tab",
    ];
    // assert against the <style> block only
    const styleBlock = html.slice(html.indexOf("<style>"), html.indexOf("</style>"));
    for (const cls of required) {
      expect(styleBlock, `missing selector .${cls}`).toMatch(new RegExp(`\\.${cls}\\b`));
    }
  });

  it("base .alert carries a non-color signal, not border-left alone", () => {
    setCanvas({});
    const html = exportHTML();
    const styleBlock = html.slice(html.indexOf("<style>"), html.indexOf("</style>"));
    const alertRule = styleBlock.match(/\.alert\s*\{[^}]*\}/);
    expect(alertRule, ".alert base rule missing").not.toBeNull();
    // a textual/icon prefix (::before content) is the non-color signal
    expect(styleBlock).toMatch(/\.alert[^{]*::before\s*\{[^}]*content/);
  });
});

describe("(c) exportHTML carries focus rings for interactive selectors", () => {
  it("has a :focus-visible rule in the <style> block", () => {
    setCanvas({});
    const html = exportHTML();
    const styleBlock = html.slice(html.indexOf("<style>"), html.indexOf("</style>"));
    expect(styleBlock).toMatch(/:focus-visible/);
  });
});

describe("(d) exportReact maps zones to semantic landmarks", () => {
  it("emits <main id=\"main-content\"> for the body zone always (not a bare div)", () => {
    setCanvas({ body: [{ id: "b1", type: "SimulatedTitle", props: { text: "Hi", level: 2 } }] });
    const jsx = exportReact();
    expect(jsx).toContain('<main id="main-content"');
    // the zone-* className is KEPT so the shell CSS still applies, but it must
    // hang off the semantic tag, never a <div>.
    expect(jsx).not.toContain('<div className="zone-body"');
  });

  it("emits <header> and <footer> for those zones (not bare divs)", () => {
    setCanvas({
      header: [{ id: "h1", type: "AppBrand", props: { label: "Brand" } }],
      body: [{ id: "b1", type: "SimulatedTitle", props: { text: "Hi", level: 2 } }],
      footer: [{ id: "f1", type: "FooterText", props: { label: "Co", version: "1.0" } }],
    });
    const jsx = exportReact();
    expect(jsx).toContain("<header");
    expect(jsx).toContain("<footer");
    expect(jsx).not.toContain('<div className="zone-header"');
    expect(jsx).not.toContain('<div className="zone-footer"');
  });

  it("emits <aside> when a sidebar zone exists (not a bare div)", () => {
    setCanvas({
      sidebar: [{ id: "s1", type: "NavItem", props: { label: "Home", icon: "home", active: true } }],
      body: [{ id: "b1", type: "SimulatedTitle", props: { text: "Hi", level: 2 } }],
    });
    const jsx = exportReact();
    expect(jsx).toContain("<aside");
    expect(jsx).not.toContain('<div className="zone-sidebar"');
  });
});

describe("(e) empty-canvas vite export ships only react + react-dom", () => {
  it("package.json deps == {react, react-dom} for an empty salt canvas", () => {
    setCanvas({ designSystem: "salt" });
    const pkgJson = fileFromBootstrap(exportViteBootstrap(), "package.json");
    const pkg = JSON.parse(pkgJson);
    expect(Object.keys(pkg.dependencies).sort()).toEqual(["react", "react-dom"]);
  });
});
