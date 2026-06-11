/* ════════════════════════════════════════════════════════════
   FoundationPage text-role contrast proof.

   FoundationPage renders its eyebrow / context / desc in the theme's
   `fg2` text role (ThemeContext slot). This test PROVES the choice:
   for EVERY shipped default theme across all five DSs (18 themes:
   Salt 4, M3 6, Fluent 2, uoaui 2, Carbon 4) the fg2 role clears
   WCAG AA 4.5:1 for small text against the page background (`bg`
   slot). It also documents WHY fg3 was rejected: fg3 fails AA on at
   least one shipped theme (M3 light outline #79747E on #FEF7FF
   ≈ 4.32:1; uoaui dark #6B7280 on #0B1120 ≈ 3.91:1).

   Slot → token mapping mirrors ThemeContext.computeTheme()'s `n()`
   accessor exactly; if ThemeContext remaps a slot this test must be
   updated in the same commit.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { getTheme, getThemeKeys } from "@/data/registry";
import type { SystemId } from "@/store/useDesignHub";
import { contrastRatio } from "@/lib/contrastUtils";

/* ThemeContext slot mapping (see computeTheme): per-system token names
   backing the normalized bg / fg2 / fg3 slots. */
const SLOTS: Record<SystemId, { bg: string; fg2: string; fg3: string }> = {
  salt:   { bg: "bg",      fg2: "fg2",              fg3: "fg3" },
  m3:     { bg: "surface", fg2: "onSurfaceVariant", fg3: "outline" },
  fluent: { bg: "bg1",     fg2: "fg2",              fg3: "fg3" },
  uoaui:  { bg: "bg",      fg2: "fg2",              fg3: "fg3" },
  carbon: { bg: "bg",      fg2: "fg2",              fg3: "fg3" },
};

const SYSTEMS: SystemId[] = ["salt", "m3", "fluent", "uoaui", "carbon"];

describe("FoundationPage text role (fg2) clears WCAG AA 4.5:1 on every shipped default theme", () => {
  const evidence: string[] = [];

  for (const system of SYSTEMS) {
    for (const key of getThemeKeys(system)) {
      it(`${system}/${key}: fg2 vs bg >= 4.5`, () => {
        const T = getTheme(system, key);
        const slots = SLOTS[system];
        const bg = T[slots.bg] as string;
        const fg2 = T[slots.fg2] as string;
        const fg3 = T[slots.fg3] as string;
        const r2 = contrastRatio(fg2, bg);
        const r3 = contrastRatio(fg3, bg);
        evidence.push(
          `${system}/${key}: fg2 ${fg2} on ${bg} = ${r2.toFixed(2)}:1 (fg3 ${fg3} = ${r3.toFixed(2)}:1)`,
        );
        expect(
          r2,
          `${system}/${key} fg2 ${fg2} on ${bg} = ${r2.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it("documents the fg3 failures that forced the role switch", () => {
    const m3Light = getTheme("m3", "light");
    const uoauiDark = getTheme("uoaui", "dark");
    expect(contrastRatio(m3Light.outline, m3Light.surface)).toBeLessThan(4.5);
    expect(contrastRatio(uoauiDark.fg3, uoauiDark.bg)).toBeLessThan(4.5);
    // Emit the per-theme table for PR evidence.
    console.log("\nFoundationPage contrast evidence:\n" + evidence.join("\n"));
  });
});
