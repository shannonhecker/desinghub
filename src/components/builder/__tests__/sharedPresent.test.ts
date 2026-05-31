/* ════════════════════════════════════════════════════════════
   PR-E: shared link (/preview/share/[hash]) unified onto PresentStage.
   Source-pin (no RTL harness). Visual feel verified on Vercel preview.
   ════════════════════════════════════════════════════════════
   Pins: (1) PresentBar gains a "recipient" variant (Fork & edit + Home,
   no editor exit, no DS switcher per Decision #5); (2) PresentStage
   forwards barVariant + sharedHash; (3) SharedPreview hydrates the store
   one-shot (useMemo, synchronous — no flash) with themeKey AFTER setMode,
   then renders the recipient PresentStage; (4) the bespoke SharedPreview
   chrome (ComponentRenderer render + DS switcher) is removed.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "src", "components", "builder");
const bar = readFileSync(join(dir, "PresentBar.tsx"), "utf8");
const stage = readFileSync(join(dir, "PresentStage.tsx"), "utf8");
const shared = readFileSync(join(dir, "SharedPreview.tsx"), "utf8");

describe("PR-E: shared link unified onto PresentStage", () => {
  it("PresentBar has a recipient variant: Fork & edit + Home, no editor exit", () => {
    expect(bar).toMatch(/variant\?: "author" \| "recipient"/);
    expect(bar).toMatch(/variant === "recipient"/);
    expect(bar).toMatch(/Fork &amp; edit/);
    expect(bar).toMatch(/\/builder\?shared=\$\{sharedHash\}/);
  });

  it("PresentStage forwards barVariant + sharedHash to PresentBar", () => {
    expect(stage).toMatch(/barVariant/);
    expect(stage).toMatch(/<PresentBar variant=\{barVariant\} sharedHash=\{sharedHash\} \/>/);
  });

  it("SharedPreview hydrates the store once-per-hash (ref-guarded) then renders the recipient PresentStage", () => {
    // Ref-guarded render-phase hydration: synchronous (no flash), one-shot
    // per distinct share link, re-hydrates only when the hash changes.
    expect(shared).toMatch(/useRef<string \| null>\(null\)/);
    expect(shared).toMatch(/hydratedHash\.current !== hash/);
    expect(shared).toMatch(/store\.setDeviceMode\(state\.deviceMode\)/);
    expect(shared).toMatch(/if \(state\.themeKey\) store\.setThemeKey/);
    expect(shared).toMatch(/<PresentStage barVariant="recipient" sharedHash=\{hash\} \/>/);
  });

  it("SharedPreview applies themeKey AFTER setMode (override the derived default)", () => {
    const m = shared.indexOf("store.setMode(state.mode)");
    const t = shared.indexOf("store.setThemeKey(state.themeKey)");
    expect(m).toBeGreaterThan(-1);
    expect(t).toBeGreaterThan(m);
  });

  it("SharedPreview dropped the bespoke chrome (no ComponentRenderer / DS switcher)", () => {
    expect(shared).not.toMatch(/ComponentRenderer/);
    expect(shared).not.toMatch(/shared-preview-ds-row/);
  });
});
