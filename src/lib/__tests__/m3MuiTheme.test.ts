/* ════════════════════════════════════════════════════════════
   m3MuiTheme: the app's Material 3 theme for MUI, one source of truth.

   The builder, the UI library, the FX dialogs and menus and the exported
   React code all read it. These tests pin the roles to the app's own M3
   tokens, the contrast of every pair a label is drawn in, the shapes and
   the type, and the rule that keeps the builder's geometry: the "slot"
   fit changes colour, corner, case and state, never a control's size.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { THEMES } from "@/data/m3/themes";
import { contrastRatio } from "@/lib/contrastUtils";
import { buildM3Theme, m3Roles, m3ThemeOptions, m3ThemeSource, stateLayer } from "@/lib/m3MuiTheme";

const MODES = ["light", "dark"] as const;

describe("roles come from the app's Material 3 tokens", () => {
  for (const mode of MODES) {
    it(`${mode}: every role is the token of that name`, () => {
      const roles = m3Roles(mode);
      for (const key of ["primary", "onPrimary", "secondaryContainer", "onSecondaryContainer", "surface", "onSurface", "onSurfaceVariant", "outline", "outlineVariant", "error", "onError"] as const) {
        expect(roles[key], key).toBe(THEMES[mode][key]);
      }
    });
  }

  it("a token set passed in (the library's own, perhaps a custom colour) wins", () => {
    const roles = m3Roles("light", { ...THEMES.light, primary: "#006A6A", onPrimary: "#FFFFFF" });
    expect(roles.primary).toBe("#006A6A");
    expect(buildM3Theme({ mode: "light", tokens: { ...THEMES.light, primary: "#006A6A" } }).palette.primary.main).toBe("#006A6A");
  });
});

describe("contrast: every pair a label is drawn in", () => {
  const TEXT_PAIRS = [
    ["onPrimary", "primary"],
    ["onSecondary", "secondary"],
    ["onPrimaryContainer", "primaryContainer"],
    ["onSecondaryContainer", "secondaryContainer"],
    ["onError", "error"],
    ["onErrorContainer", "errorContainer"],
    ["onSurface", "surface"],
    ["onSurface", "surfaceContainerHigh"],
    ["onSurfaceVariant", "surface"],
    ["onSurfaceVariant", "surfaceContainerHigh"],
    /* A text or outlined button's label, and a link, on the page. */
    ["primary", "surface"],
    ["primary", "surfaceContainerHigh"],
    ["error", "surface"],
  ] as const;
  for (const mode of MODES) {
    for (const [fg, bg] of TEXT_PAIRS) {
      it(`${mode}: ${fg} on ${bg} is at least 4.5:1`, () => {
        const roles = m3Roles(mode);
        expect(contrastRatio(roles[fg], roles[bg])).toBeGreaterThanOrEqual(4.5);
      });
    }
    it(`${mode}: the outline is at least 3:1 on the surface`, () => {
      const roles = m3Roles(mode);
      expect(contrastRatio(roles.outline, roles.surface)).toBeGreaterThanOrEqual(3);
    });
    it(`${mode}: a hovered filled button keeps its label readable`, () => {
      const roles = m3Roles(mode);
      const hover = stateLayer(roles.primary, roles.onPrimary, 0.08);
      expect(contrastRatio(roles.onPrimary, hover)).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe("the MUI theme", () => {
  for (const mode of MODES) {
    for (const fit of ["slot", "spec"] as const) {
      it(`${mode}, ${fit}: palette, shape and type are Material 3`, () => {
        const roles = m3Roles(mode);
        const theme = buildM3Theme({ mode, fit });
        expect(theme.palette.mode).toBe(mode);
        expect(theme.palette.primary.main).toBe(roles.primary);
        expect(theme.palette.primary.contrastText).toBe(roles.onPrimary);
        expect(theme.palette.secondary.main).toBe(roles.secondary);
        expect(theme.palette.error.main).toBe(roles.error);
        expect(theme.palette.background.default).toBe(roles.surface);
        expect(theme.palette.text.primary).toBe(roles.onSurface);
        expect(theme.palette.text.secondary).toBe(roles.onSurfaceVariant);
        expect(theme.palette.divider).toBe(roles.outlineVariant);
        expect(String(theme.typography.fontFamily)).toMatch(/^Roboto/);
        expect(theme.typography.button.textTransform).toBe("none");
        expect(theme.typography.button.fontWeight).toBe(500);
        const button = theme.components?.MuiButton?.styleOverrides?.root as Record<string, unknown>;
        expect(button.borderRadius, "fully rounded").toBe(9999);
        expect(theme.components?.MuiButton?.defaultProps?.disableElevation).toBe(true);
        const field = theme.components?.MuiOutlinedInput?.styleOverrides?.root as Record<string, unknown>;
        expect(field.borderRadius, "extra-small corner").toBe(4);
        const chip = theme.components?.MuiChip?.styleOverrides?.root as Record<string, unknown>;
        expect(chip.borderRadius).toBe(8);
      });
    }
  }

  it("density becomes MUI's default sizes, as the builder's density map asks", () => {
    const sizes = (density: "high" | "medium" | "low" | "touch") => {
      const c = buildM3Theme({ mode: "light", density }).components!;
      return [c.MuiButton?.defaultProps?.size, c.MuiTextField?.defaultProps?.size, c.MuiChip?.defaultProps?.size, c.MuiSwitch?.defaultProps?.size, c.MuiTable?.defaultProps?.size];
    };
    expect(sizes("high")).toEqual(["small", "small", "small", "small", "small"]);
    expect(sizes("medium")).toEqual(["medium", "medium", "medium", "medium", "medium"]);
    expect(sizes("low")).toEqual(["large", "medium", "medium", "medium", "medium"]);
    expect(sizes("touch")).toEqual(["large", "medium", "medium", "medium", "medium"]);
  });
});

describe("fit: the builder's slots against the specification's sizes", () => {
  const SIZE_KEYS = ["height", "minHeight", "width", "minWidth", "padding", "paddingTop", "paddingBottom", "fontSize", "lineHeight"];

  it("slot: button, chip and text field overrides set no size of their own", () => {
    for (const mode of MODES) {
      const c = buildM3Theme({ mode, fit: "slot" }).components!;
      for (const [name, part] of [["MuiButton", "root"], ["MuiChip", "root"], ["MuiOutlinedInput", "root"], ["MuiToggleButton", "root"], ["MuiMenuItem", "root"], ["MuiDialogTitle", "root"]] as const) {
        const style = (c[name]?.styleOverrides as Record<string, Record<string, unknown>> | undefined)?.[part] ?? {};
        for (const key of SIZE_KEYS) expect(Object.keys(style), `${name}.${part} sets no ${key}`).not.toContain(key);
      }
    }
  });

  it("slot: the switch keeps MUI's box and draws Material's track inside it", () => {
    const sw = buildM3Theme({ mode: "light", fit: "slot" }).components!.MuiSwitch!.styleOverrides!.root as Record<string, unknown>;
    /* MUI's medium root is 58 by 38: 3px of padding leaves the 52 by 32 track. */
    expect(sw.width).toBeUndefined();
    expect(sw.height).toBeUndefined();
    expect(sw.padding).toBe(3);
    const track = sw["& .MuiSwitch-track"] as Record<string, unknown>;
    expect(track.borderRadius).toBe(9999);
    expect(String(track.border)).toMatch(/^2px solid/);
  });

  it("spec: the library keeps Material's own sizes", () => {
    const c = buildM3Theme({ mode: "light", fit: "spec", tokens: THEMES.light }).components!;
    const button = c.MuiButton!.styleOverrides!.root as Record<string, unknown>;
    expect(button.height).toBe(40);
    expect(button.padding).toBe("0 24px");
    const sw = c.MuiSwitch!.styleOverrides!.root as Record<string, unknown>;
    expect(sw.width).toBe(52);
    expect(sw.height).toBe(32);
    const chip = c.MuiChip!.styleOverrides!.root as Record<string, unknown>;
    expect(chip.height).toBe(32);
  });
});

describe("the theme is data, so the export can write it out", () => {
  it("options survive a JSON round trip unchanged", () => {
    for (const mode of MODES) {
      const options = m3ThemeOptions({ mode, density: "medium", fit: "slot" });
      expect(JSON.parse(JSON.stringify(options))).toEqual(options);
    }
  });

  it("the written source is the same theme, starting with the palette and mode", () => {
    const source = m3ThemeSource({ mode: "dark", density: "medium" });
    expect(source.startsWith('{ palette: { mode: "dark"')).toBe(true);
    expect(source).toContain(THEMES.dark.primary);
    expect(source).toContain(THEMES.dark.onPrimary);
    expect(source).toContain('textTransform: "none"');
    /* It is an expression: evaluating it gives back the options. */
    const evaluated = new Function(`return (${source});`)();
    expect(evaluated).toEqual(m3ThemeOptions({ mode: "dark", density: "medium", fit: "slot" }));
  });
});
