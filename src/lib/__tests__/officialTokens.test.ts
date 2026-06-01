import { describe, it, expect } from "vitest";
import {
  TOKEN_SOURCE,
  isOfficialTokenSource,
  cdsVarName,
  buildCarbonTokenCSS,
  getCarbonOfficialTokens,
  getOfficialTokenList,
} from "@/lib/officialTokens";
import { buildM3TokenCSS, buildFluentTokenCSS } from "@/lib/officialM3FluentTokens";
import {
  getUiKitGroup,
  GROUP_MAP,
  COMPONENT_ROUTES,
  BUILDER_BLOCKS,
} from "@/components/ui-kit/uiKitGroups";

describe("uiKitGroups — single IA source of truth", () => {
  it("routes tokens/audit/builder-blocks to Tools, not Foundations", () => {
    expect(getUiKitGroup("tokens", "Foundations")).toBe("Tools");
    expect(getUiKitGroup("audit", "Foundations")).toBe("Tools");
    expect(getUiKitGroup("builder-blocks", "Foundations")).toBe("Tools");
  });

  it("keeps real foundation entries in Foundations", () => {
    expect(getUiKitGroup("dl-color", "Foundations")).toBe("Foundations");
    expect(getUiKitGroup("dl-typography", "Foundations")).toBe("Foundations");
  });

  it("maps component/pattern categories to Components", () => {
    expect(getUiKitGroup("buttons", "Components & Patterns")).toBe("Components");
    expect(getUiKitGroup("pat-form", "Patterns")).toBe("Components");
  });

  it("every GROUP_MAP override id has a matching COMPONENT_ROUTES entry (no orphan nav)", () => {
    for (const id of Object.keys(GROUP_MAP)) {
      expect(COMPONENT_ROUTES[id]).toBeDefined();
    }
  });

  it("BUILDER_BLOCKS id is grouped as Tools", () => {
    expect(GROUP_MAP[BUILDER_BLOCKS.id]).toBe("Tools");
  });
});

describe("officialTokens — provenance", () => {
  it("marks Salt + Carbon + M3 + Fluent official, only uoaui facsimile (PR-2b)", () => {
    expect(TOKEN_SOURCE.salt).toBe("official");
    expect(TOKEN_SOURCE.carbon).toBe("official");
    expect(TOKEN_SOURCE.m3).toBe("official");
    expect(TOKEN_SOURCE.fluent).toBe("official");
    expect(TOKEN_SOURCE.uoaui).toBe("facsimile"); // in-house DS, no official pkg
    expect(isOfficialTokenSource("salt")).toBe(true);
    expect(isOfficialTokenSource("m3")).toBe(true);
    expect(isOfficialTokenSource("fluent")).toBe(true);
    expect(isOfficialTokenSource("uoaui")).toBe(false);
  });

  it("the four external DSs have a curated official token list; uoaui does not", () => {
    expect(getOfficialTokenList("salt").length).toBeGreaterThan(0);
    expect(getOfficialTokenList("carbon").length).toBeGreaterThan(0);
    expect(getOfficialTokenList("m3").length).toBeGreaterThan(0);
    expect(getOfficialTokenList("fluent").length).toBeGreaterThan(0);
    expect(getOfficialTokenList("uoaui")).toEqual([]);
  });
});

describe("officialTokens — Carbon --cds-* var naming", () => {
  it("converts camelCase token keys to canonical --cds-* names", () => {
    expect(cdsVarName("borderStrong01")).toBe("--cds-border-strong-01");
    expect(cdsVarName("layer01")).toBe("--cds-layer-01");
    expect(cdsVarName("textPrimary")).toBe("--cds-text-primary");
    expect(cdsVarName("supportError")).toBe("--cds-support-error");
    expect(cdsVarName("interactive")).toBe("--cds-interactive");
    expect(cdsVarName("backgroundInverse")).toBe("--cds-background-inverse");
  });
});

describe("officialTokens — Carbon CSS is scoped + official", () => {
  const css = buildCarbonTokenCSS();

  it("scopes every block under .preview-carbon (never :root / html / body)", () => {
    // Bare default block (PR-2a) so official vars resolve before a theme attr
    // is set, plus the per-theme [data-cds-theme] blocks.
    expect(css).toContain(".preview-carbon{");
    expect(css).toContain('.preview-carbon[data-cds-theme="white"]');
    expect(css).toContain('.preview-carbon[data-cds-theme="g100"]');
    // Leak-safety contract: no global selectors anywhere.
    expect(css).not.toMatch(/(^|[\s,}])(:root|html|body|\*)\s*\{/);
  });

  it("emits ONLY --cds-* custom properties (no resets / component rules)", () => {
    // Strip the .preview-carbon selectors (bare default block + the
    // [data-cds-theme] per-theme blocks), then every declaration left must be
    // a --cds-* custom property.
    const decls = css
      .replace(/\.preview-carbon(\[[^\]]*\])?\{/g, "")
      .replace(/\}/g, ";");
    const props = decls.split(";").map(s => s.trim()).filter(Boolean);
    expect(props.length).toBeGreaterThan(50);
    for (const p of props) expect(p.startsWith("--cds-")).toBe(true);
  });

  it("carries the genuine published Carbon values", () => {
    const white = getCarbonOfficialTokens("white");
    expect(white["--cds-background"]).toBe("#ffffff");
    expect(white["--cds-interactive"]).toBe("#0f62fe");
    const g100 = getCarbonOfficialTokens("g100");
    expect(g100["--cds-background"]).toBe("#161616");
    expect(g100["--cds-interactive"]).toBe("#4589ff");
  });
});

describe("officialM3FluentTokens — M3 (@mui/material) CSS is scoped + official", () => {
  const css = buildM3TokenCSS();
  const flat = css.replace(/\n/g, "");

  it("scopes every block under .preview-m3 (never :root / html / body)", () => {
    expect(css).toContain(".preview-m3{");
    expect(css).toContain(".builder-light .preview-m3{");
    // Leak-safety contract: no global selectors anywhere.
    expect(css).not.toMatch(/(^|[\s,}])(:root|html|body|\*)\s*\{/);
  });

  it("emits ONLY --mui-* custom properties (no resets / component rules)", () => {
    const decls = css
      .replace(/(\.builder-light\s)?\.preview-m3\{/g, "")
      .replace(/\}/g, ";");
    const props = decls.split(";").map((s) => s.trim()).filter(Boolean);
    expect(props.length).toBeGreaterThan(50);
    for (const p of props) expect(p.startsWith("--mui-")).toBe(true);
  });

  it("carries the genuine published Material UI palette values (dark base / light override)", () => {
    // Dark = builder base scope; official MUI default dark primary is #90caf9.
    expect(flat).toMatch(/\.preview-m3\{[^}]*--mui-palette-primary-main:#90caf9/);
    // Light override = official MUI default light primary #1976d2.
    expect(flat).toMatch(/\.builder-light \.preview-m3\{[^}]*--mui-palette-primary-main:#1976d2/);
    // Background tokens are genuine MUI values.
    expect(flat).toMatch(/\.preview-m3\{[^}]*--mui-palette-background-default:#121212/);
  });
});

describe("officialM3FluentTokens — Fluent (@fluentui/react-theme) CSS is scoped + official", () => {
  const css = buildFluentTokenCSS();
  const flat = css.replace(/\n/g, "");

  it("scopes every block under .preview-fluent (never :root / html / body)", () => {
    expect(css).toContain(".preview-fluent{");
    expect(css).toContain(".builder-light .preview-fluent{");
    expect(css).not.toMatch(/(^|[\s,}])(:root|html|body|\*)\s*\{/);
  });

  it("emits ONLY -- custom properties (no resets / component rules)", () => {
    const decls = css
      .replace(/(\.builder-light\s)?\.preview-fluent\{/g, "")
      .replace(/\}/g, ";");
    // Fluent values can contain ';' inside font stacks? No — token values are
    // single colour/length/font-family strings without literal ';'. Filter empties.
    const props = decls.split(";").map((s) => s.trim()).filter(Boolean);
    expect(props.length).toBeGreaterThan(50);
    for (const p of props) expect(p.startsWith("--")).toBe(true);
  });

  it("carries the genuine published Fluent web{Light,Dark}Theme values", () => {
    // Dark = base; official dark brand background is #115ea3.
    expect(flat).toMatch(/\.preview-fluent\{[^}]*--colorBrandBackground:#115ea3/);
    // Light override = official light brand background #0f6cbd.
    expect(flat).toMatch(/\.builder-light \.preview-fluent\{[^}]*--colorBrandBackground:#0f6cbd/);
    // Neutral background dark value.
    expect(flat).toMatch(/\.preview-fluent\{[^}]*--colorNeutralBackground1:#292929/);
  });
});
