import { describe, it, expect } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import { buildDesignTokens, classify, exportDesignTokens, designTokensFilename } from "../export/tokensExporter";

type Group = Record<string, { $type: string; $value: string | number; $extensions?: Record<string, unknown> }>;

function allTokens(doc: Record<string, unknown>): Group {
  const out: Group = {};
  for (const [k, v] of Object.entries(doc)) {
    if (k.startsWith("$")) continue;
    Object.assign(out, v as Group);
  }
  return out;
}

describe("tokensExporter — classify", () => {
  it("maps raw values onto DTCG scalar types and rejects composites", () => {
    expect(classify("x", "#0f62fe")).toEqual({ $type: "color", $value: "#0f62fe" });
    expect(classify("x", "rgba(0,0,0,0.5)")?.$type).toBe("color");
    expect(classify("x", "12px")).toEqual({ $type: "dimension", $value: "12px" });
    expect(classify("x", "1.5rem")?.$type).toBe("dimension");
    expect(classify("x", "150ms")).toEqual({ $type: "duration", $value: "150ms" });
    expect(classify("fontWeightBold", "700")).toEqual({ $type: "fontWeight", $value: 700 });
    expect(classify("fontFamilyBase", "'Segoe UI', sans-serif")?.$type).toBe("fontFamily");
    expect(classify("shadow4", "0 0 2px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.14)")).toBeNull();
    expect(classify("curveEasyEase", "cubic-bezier(0.33,0,0.67,1)")).toBeNull();
    expect(classify("gradient", "linear-gradient(135deg, #000 0%, #fff 100%)")).toBeNull();
    expect(classify("x", "")).toBeNull();
  });
});

describe("tokensExporter — official sources per DS", () => {
  it("Carbon: every --cds-* colour from @carbon/themes for the active theme, with the CSS var recorded", () => {
    const doc = buildDesignTokens("carbon", "dark", "g100", new Date("2026-01-01T00:00:00Z"));
    const cds = doc.cds as Group;
    expect(cds["background"]).toEqual({ $type: "color", $value: "#161616", $extensions: { "com.designhub.cssVar": "--cds-background" } });
    expect(cds["interactive"].$value).toBe("#4589ff");
    expect(Object.keys(cds).length).toBeGreaterThan(200);
    expect(doc.$extensions["com.designhub"]).toMatchObject({ system: "carbon", mode: "dark", themeKey: "g100", source: "official" });
  });

  it("Carbon: an unknown theme key falls back to the mode's default theme", () => {
    expect(buildDesignTokens("carbon", "light", "nope").$extensions["com.designhub"].themeKey).toBe("white");
    expect(buildDesignTokens("carbon", "dark", "").$extensions["com.designhub"].themeKey).toBe("g100");
  });

  it("M3: --mui-* from MUI's generated sheet, M3 baseline palette, per mode", () => {
    const light = buildDesignTokens("m3", "light", "light").mui as Group;
    const dark = buildDesignTokens("m3", "dark", "dark").mui as Group;
    expect(String(light["palette-primary-main"].$value).toLowerCase()).toBe("#6750a4");
    expect(String(dark["palette-primary-main"].$value).toLowerCase()).toBe("#d0bcff");
    expect(light["palette-primary-main"].$extensions).toEqual({ "com.designhub.cssVar": "--mui-palette-primary-main" });
    expect(light["shape-borderRadius"].$type).toBe("dimension");
  });

  it("Fluent: colours, radii, spacing, durations and fonts are typed; shadows and curves are skipped", () => {
    const f = buildDesignTokens("fluent", "light", "light").fluent as Group;
    expect(f.colorBrandBackground).toMatchObject({ $type: "color", $value: "#0f6cbd" });
    expect(f.borderRadiusMedium.$type).toBe("dimension");
    expect(f.spacingHorizontalM.$type).toBe("dimension");
    expect(f.durationFast.$type).toBe("duration");
    expect(f.fontFamilyBase.$type).toBe("fontFamily");
    expect(f.fontWeightRegular).toMatchObject({ $type: "fontWeight", $value: 400 });
    expect(f.shadow4).toBeUndefined();
    expect(f.curveEasyEase).toBeUndefined();
    expect(f.colorBrandBackground.$extensions).toEqual({ "com.designhub.cssVar": "--colorBrandBackground" });
  });

  it("uoaui: the in-house theme table, marked facsimile, with the a-* vars where they exist", () => {
    const doc = buildDesignTokens("uoaui", "dark", "dark");
    const a = doc.a as Group;
    expect(doc.$extensions["com.designhub"].source).toBe("facsimile");
    expect(String(a.accent.$value).toLowerCase()).toBe("#8a58c9");
    expect(a.accent.$extensions).toEqual({ "com.designhub.cssVar": "--a-accent" });
    expect(a.gradient).toBeUndefined(); // composite, skipped
  });

  it("Salt: off-DOM the curated set is empty and the note says to export from the running builder", () => {
    const doc = buildDesignTokens("salt", "light", "jpm-light");
    expect(Object.keys(doc.salt as Group)).toHaveLength(0);
    expect(doc.$extensions["com.designhub"].note).toMatch(/running builder/);
  });

  it("every emitted token has a non-empty $value and a DTCG $type, and the document round-trips as JSON", () => {
    for (const [sys, mode] of [["carbon", "light"], ["m3", "dark"], ["fluent", "dark"], ["uoaui", "light"]] as const) {
      const doc = buildDesignTokens(sys, mode, "");
      const tokens = allTokens(doc as unknown as Record<string, unknown>);
      expect(Object.keys(tokens).length).toBeGreaterThan(5);
      for (const t of Object.values(tokens)) {
        expect(["color", "dimension", "duration", "number", "fontFamily", "fontWeight"]).toContain(t.$type);
        expect(String(t.$value)).not.toBe("");
      }
      expect(JSON.parse(JSON.stringify(doc))).toEqual(doc);
    }
  });
});

describe("tokensExporter — canvas entry points", () => {
  it("exportDesignTokens serialises the active DS + mode and names the file after them", () => {
    useBuilder.setState({ designSystem: "fluent", mode: "dark", themeKey: "dark" } as never);
    const parsed = JSON.parse(exportDesignTokens());
    expect(parsed.$extensions["com.designhub"]).toMatchObject({ system: "fluent", mode: "dark" });
    expect(parsed.fluent.colorNeutralBackground1.$value).toBe("#292929");
    expect(designTokensFilename()).toBe("design-tokens.fluent.dark.json");
  });
});
