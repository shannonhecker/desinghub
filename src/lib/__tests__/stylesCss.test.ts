import { describe, it, expect } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import { buildStylesCss, buildTokenBlock, officialPalette, DS_VAR_ALIAS } from "../export/stylesCss";
import { exportViteBootstrap } from "../export/viteExporter";
import type { SystemId } from "@/lib/componentApiRegistry";

const SYSTEMS: SystemId[] = ["salt", "m3", "fluent", "carbon", "uoaui"];
const UOAUI_PURPLE = "#8A58C9";

function fileFromBootstrap(script: string, path: string): string {
  const start = script.indexOf(`cat > "${path}" <<'`);
  if (start === -1) throw new Error(`file ${path} not found in bootstrap`);
  const m = script.slice(start).match(/<<'([^']+)'\n/);
  if (!m) throw new Error("delimiter not found");
  const after = start + (m.index ?? 0) + m[0].length;
  const end = script.indexOf(`\n${m[1]}\n`, after);
  return script.slice(after, end === -1 ? undefined : end);
}

describe("stylesCss — per-DS token block (the export was uoaui purple for every DS)", () => {
  it("each DS gets its own accent from its official token source, not the uoaui palette", () => {
    const accents = Object.fromEntries(SYSTEMS.map((s) => [s, officialPalette(s, "light").accent.toLowerCase()]));
    expect(accents.salt).toBe("#1b7f9e");
    expect(accents.carbon).toBe("#0f62fe");
    expect(accents.m3).toBe("#6750a4");
    expect(accents.fluent).toBe("#0f6cbd");
    /* uoaui's light theme uses a darker accent for contrast; dark is the brand purple. */
    expect(officialPalette("uoaui", "dark").accent.toLowerCase()).toBe(UOAUI_PURPLE.toLowerCase());
    expect(accents.uoaui).toMatch(/^#[0-9a-f]{6}$/);
    for (const s of SYSTEMS.filter((x) => x !== "uoaui")) {
      expect(buildTokenBlock(s, "dark").toLowerCase()).not.toContain(UOAUI_PURPLE.toLowerCase());
    }
  });

  it("M3 values come from MUI's generated --mui-* sheet (parsed, not hand-typed)", () => {
    const dark = officialPalette("m3", "dark");
    const light = officialPalette("m3", "light");
    expect(light.accent.toLowerCase()).toBe("#6750a4");
    expect(dark.accent.toLowerCase()).toBe("#d0bcff");
    expect(light.bg).not.toBe(dark.bg);
    expect(light.radius).toMatch(/px$/);
  });

  it(":root carries the builder's mode (not the OS preference) and both modes are available via data-mode", () => {
    const dark = buildTokenBlock("carbon", "dark");
    const light = buildTokenBlock("carbon", "light");
    expect(dark).not.toContain("prefers-color-scheme");
    expect(dark).toMatch(/:root \{\n\s+--bg: #161616;/);
    expect(light).toMatch(/:root \{\n\s+--bg: #ffffff;/);
    expect(dark).toContain('.dashboard-layout[data-mode="light"]');
    expect(dark).toContain('.dashboard-layout[data-mode="dark"]');
  });

  it("inside the app root every slot aliases the DS's own CSS variable with the literal as fallback", () => {
    for (const s of SYSTEMS) {
      const block = buildTokenBlock(s, "dark");
      const alias = DS_VAR_ALIAS[s];
      expect(block).toContain(`--accent: var(${alias.accent}, ${officialPalette(s, "dark").accent})`);
      expect(block).toContain(`--bg: var(${alias.bg}, ${officialPalette(s, "dark").bg})`);
    }
    expect(buildTokenBlock("salt", "light")).toContain("var(--salt-actionable-bold-background, #1B7F9E)");
    expect(buildTokenBlock("carbon", "light")).toContain("var(--cds-interactive, #0f62fe)");
    expect(buildTokenBlock("fluent", "light")).toContain("var(--colorBrandBackground, #0f6cbd)");
  });

  it("never emits a self-referencing custom property (a var() cycle is guaranteed-invalid)", () => {
    for (const s of SYSTEMS) {
      const css = buildStylesCss(s, "light");
      for (const line of css.split("\n")) {
        const m = line.match(/^\s+(--[a-z-]+):\s*(.+);$/);
        if (m) expect(m[2]).not.toMatch(new RegExp(`var\\(${m[1]}[,)]`));
      }
    }
  });

  it("keeps the DS-agnostic primitives the exporters' markup depends on", () => {
    const css = buildStylesCss("salt", "light");
    for (const sel of [".dashboard-layout {", ".zone-body {", ".btn {", ".card {", ".form-field {", ".skip-link:focus", "@media (max-width: 768px)"]) {
      expect(css).toContain(sel);
    }
  });
});

describe("viteExporter — src/styles.css is per-DS and per-mode", () => {
  it("a Carbon dark canvas ships Carbon's official dark palette + --cds-* aliases", () => {
    useBuilder.setState({ designSystem: "carbon", mode: "dark", blocks: [], headerBlocks: [], sidebarBlocks: [], footerBlocks: [] } as never);
    const css = fileFromBootstrap(exportViteBootstrap(), "src/styles.css");
    expect(css).toContain("Carbon DS tokens");
    expect(css).toContain("--accent: #4589ff");
    expect(css).toContain("var(--cds-interactive, #0f62fe)");
    expect(css.toLowerCase()).not.toContain(UOAUI_PURPLE.toLowerCase());
  });

  it("a Salt light canvas ships Salt's palette and --salt-* aliases", () => {
    useBuilder.setState({ designSystem: "salt", mode: "light", blocks: [], headerBlocks: [], sidebarBlocks: [], footerBlocks: [] } as never);
    const css = fileFromBootstrap(exportViteBootstrap(), "src/styles.css");
    expect(css).toMatch(/:root \{\n\s+--bg: #FFFFFF;/);
    expect(css).toContain("var(--salt-actionable-bold-background, #1B7F9E)");
  });
});
