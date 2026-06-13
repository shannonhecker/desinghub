/* ════════════════════════════════════════════════════════════
   FoundationPage text-role contrast proof — against the PAINTED stage.

   FoundationPage renders its eyebrow / context / desc in the theme's
   `fg2` text role (ThemeContext slot). That text does NOT sit on the
   raw `bg` token: DesignHubApp paints a per-DS stage behind the page
   (stageTint.getStageBg) — M3 gets surfaceContainerLow, Carbon is
   seam-matched to bg, Salt/Fluent get a 3% fg color-mix tint, and
   uoaui rides transparent over the app-level aurora gradient
   (DesignHubApp: `background: t.T.gradient`). This test resolves the
   EFFECTIVE painted background through the same getStageBg code path
   the page uses, then proves fg2 clears WCAG AA 4.5:1 for small text
   on EVERY shipped default theme across all five DSs (18 themes:
   Salt 4, M3 6, Fluent 2, uoaui 2, Carbon 4). For gradients every
   stop is asserted; for color-mix the mixed color is computed.

   It also documents WHY fg3 was rejected: fg3 fails AA on at least
   one shipped painted stage (M3 light outline #79747E on
   surfaceContainerLow #F7F2FA; uoaui dark #6B7280 over the aurora
   gradient ≈ 3.9:1 at its darkest stop).

   Slot → token mapping mirrors ThemeContext.computeTheme()'s `n()`
   accessor exactly; if ThemeContext remaps a slot, or stageTint.ts /
   DesignHubApp change what they paint, this test must be updated in
   the same commit. resolveStageColors() throws on any stage value it
   cannot reduce to hex colors, so silent drift fails loudly.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { getTheme, getThemeKeys, MATERIAL_COLORS } from "@/data/registry";
import type { SystemId } from "@/store/useDesignHub";
import { contrastRatio, hexToRGB, isHex } from "@/lib/contrastUtils";
import { getStageBg } from "../stageTint";
import type { ActiveTheme } from "@/contexts/ThemeContext";

/* ThemeContext slot mapping (see computeTheme): per-system token names
   backing the normalized bg / bg2 / fg / fg2 / fg3 slots. getStageBg
   reads activeSystem, T, bg, bg2 and fg off ActiveTheme. */
const SLOTS: Record<
  SystemId,
  { bg: string; bg2: string; fg: string; fg2: string; fg3: string }
> = {
  salt:   { bg: "bg",      bg2: "bg2",                 fg: "fg",        fg2: "fg2",              fg3: "fg3" },
  m3:     { bg: "surface", bg2: "surfaceContainerLow", fg: "onSurface", fg2: "onSurfaceVariant", fg3: "outline" },
  fluent: { bg: "bg1",     bg2: "bg2",                 fg: "fg1",       fg2: "fg2",              fg3: "fg3" },
  uoaui:  { bg: "bg",      bg2: "bg2",                 fg: "fg",        fg2: "fg2",              fg3: "fg3" },
  carbon: { bg: "bg",      bg2: "bg2",                 fg: "fg",        fg2: "fg2",              fg3: "fg3" },
};

const SYSTEMS: SystemId[] = ["salt", "m3", "fluent", "uoaui", "carbon"];

/* Minimal ActiveTheme stub carrying exactly the slots getStageBg and
   this proof consume. Cast is safe: getStageBg only reads
   activeSystem / T / bg / bg2 / fg. */
function toActiveTheme(system: SystemId, T: Record<string, unknown>): ActiveTheme {
  const s = SLOTS[system];
  return {
    T,
    activeSystem: system,
    bg: T[s.bg] as string,
    bg2: T[s.bg2] as string,
    fg: T[s.fg] as string,
    fg2: T[s.fg2] as string,
    fg3: T[s.fg3] as string,
  } as unknown as ActiveTheme;
}

/* CSS color-mix(in srgb, c1 p%, c2) interpolates the gamma-encoded
   sRGB channels — a plain per-channel weighted average. */
function mixSrgb(hex1: string, pct: number, hex2: string): string {
  const a = hexToRGB(hex1);
  const b = hexToRGB(hex2);
  const p = pct / 100;
  return (
    "#" +
    a
      .map((v, i) => Math.round(v * p + b[i] * (1 - p)))
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

const HEX6 = /^#[0-9a-fA-F]{6}$/;

/* Resolve the EFFECTIVE painted stage color(s) for a theme via the
   same code path the page uses. Throws on anything it cannot reduce
   to opaque 6-digit hex, so a future stage-tint drift (new gradient
   syntax, rgba stops, a different color-mix shape) fails the suite
   instead of silently passing against the wrong background. */
function resolveStageColors(t: ActiveTheme): string[] {
  const stage = getStageBg(t);

  if (stage === "transparent") {
    /* uoaui: the stage is transparent ON PURPOSE so DesignHubApp's
       app-level wash shows through — `background: t.T.gradient`
       (DesignHubApp shell root). Text can sit over any point of the
       gradient, so every stop must clear AA. */
    const gradient = t.T.gradient as string;
    const stops =
      gradient.match(/#[0-9a-fA-F]+|rgba?\([^)]*\)|hsla?\([^)]*\)/g) ?? [];
    if (stops.length === 0 || !stops.every((s) => HEX6.test(s))) {
      throw new Error(
        `Cannot resolve gradient stops to opaque hex: "${gradient}" — update resolveStageColors alongside the uoaui gradient token.`,
      );
    }
    return stops;
  }

  const mix = stage.match(
    /^color-mix\(in srgb, (#[0-9a-fA-F]{6}) (\d+(?:\.\d+)?)%, (#[0-9a-fA-F]{6})\)$/,
  );
  if (mix) return [mixSrgb(mix[1], parseFloat(mix[2]), mix[3])];

  if (isHex(stage) && HEX6.test(stage)) return [stage];

  throw new Error(
    `Unresolvable stage background "${stage}" for ${t.activeSystem} — update resolveStageColors to match stageTint.getStageBg.`,
  );
}

/* Worst-case (minimum) contrast of a foreground over every painted
   stage color. */
function worstCase(fg: string, stops: string[]): { ratio: number; stop: string } {
  let ratio = Infinity;
  let stop = stops[0];
  for (const s of stops) {
    const r = contrastRatio(fg, s);
    if (r < ratio) {
      ratio = r;
      stop = s;
    }
  }
  return { ratio, stop };
}

const ALL_THEMES: Array<[SystemId, string]> = SYSTEMS.flatMap((system) =>
  getThemeKeys(system).map((key): [SystemId, string] => [system, key]),
);

describe("FoundationPage text role (fg2) clears WCAG AA 4.5:1 on the PAINTED stage of every shipped default theme", () => {
  const evidence: string[] = [];

  it("covers all 18 shipped default themes", () => {
    expect(ALL_THEMES.length).toBe(18);
  });

  for (const [system, key] of ALL_THEMES) {
    it(`${system}/${key}: fg2 vs painted stage >= 4.5`, () => {
      const t = toActiveTheme(system, getTheme(system, key));
      const stops = resolveStageColors(t);
      const { ratio, stop } = worstCase(t.fg2, stops);
      evidence.push(
        `${system}/${key}: fg2 ${t.fg2} worst ${ratio.toFixed(2)}:1 on ${stop}` +
          (stops.length > 1 ? ` (worst of ${stops.length} gradient stops)` : ""),
      );
      expect(
        ratio,
        `${system}/${key} fg2 ${t.fg2} on painted stage ${stop} = ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(4.5);
    });
  }

  it("documents the fg3 failures (on the painted stage) that forced the fg2 role choice", () => {
    /* Regression context: fg3 was rejected because it fails AA on at
       least one shipped painted stage. If either starts passing, the
       role choice can be revisited — but that is a deliberate design
       decision, not a silent flip. */
    const m3Light = toActiveTheme("m3", getTheme("m3", "light"));
    const m3Worst = worstCase(m3Light.fg3, resolveStageColors(m3Light));
    expect(m3Worst.ratio, "m3/light fg3 (outline) on surfaceContainerLow").toBeLessThan(4.5);

    const uoauiDark = toActiveTheme("uoaui", getTheme("uoaui", "dark"));
    const uoWorst = worstCase(uoauiDark.fg3, resolveStageColors(uoauiDark));
    expect(uoWorst.ratio, "uoaui/dark fg3 over the aurora gradient").toBeLessThan(4.5);

    // Emit the per-theme table for PR evidence.
    console.log(
      "\nFoundationPage painted-stage contrast evidence:\n" + evidence.join("\n"),
    );
  });
});

/* ── Custom M3 themes (dynamic color from a source hex) ──────────────────
   The 18-theme loop above covers only the BUILT-IN themes. The custom
   dynamic-color path — getTheme('m3','custom', sourceHex, isDark) ->
   generateM3Theme — derives BOTH the painted stage (surfaceContainerLow)
   and fg2 (onSurfaceVariant) from the source hue, so its contrast is
   hue-DEPENDENT and is NOT exercised by the built-in proof. Pin that every
   Material source color, in light and dark, keeps fg2 over the painted stage
   at AA 4.5:1. NOTE: must use the FOUR-arg getTheme signature; the two-arg
   form falls through to the built-in 'light' theme and would silently
   re-test a default instead of the dynamic path. ALL_THEMES / toBe(18) above
   are intentionally left untouched — this is a separate, additive block. */
describe("FoundationPage fg2 clears AA 4.5:1 on the painted stage for CUSTOM M3 themes (18 Material source colors x light/dark)", () => {
  const evidence: string[] = [];

  for (const c of MATERIAL_COLORS as Array<{ name: string; hex: string }>) {
    for (const isDark of [false, true]) {
      const mode = isDark ? "dark" : "light";
      it(`m3/custom ${c.name} (${mode}): fg2 vs painted stage >= 4.5`, () => {
        const t = toActiveTheme("m3", getTheme("m3", "custom", c.hex, isDark));
        const stops = resolveStageColors(t);
        const { ratio, stop } = worstCase(t.fg2, stops);
        evidence.push(
          `m3/custom ${c.name} ${mode}: fg2 ${t.fg2} worst ${ratio.toFixed(2)}:1 on ${stop}`,
        );
        expect(
          ratio,
          `m3/custom ${c.name} ${mode} fg2 ${t.fg2} on painted stage ${stop} = ${ratio.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it("documents the custom-theme painted-stage contrast table", () => {
    console.log(
      "\nCustom M3 painted-stage contrast evidence:\n" + evidence.join("\n"),
    );
  });
});
