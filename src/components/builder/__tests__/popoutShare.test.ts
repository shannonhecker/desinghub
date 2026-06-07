/* ════════════════════════════════════════════════════════════
   PR-D: pop-out routes through the share encoder + shared-fork
   hydrates deviceMode/themeKey. Source-pin (no RTL harness here).
   ════════════════════════════════════════════════════════════
   Pins: (1) handlePopOut encodes the FULL canvas via buildShareUrl
   and opens /builder?preview=1&shared=<hash> (fixes the empty pop-out
   that previously sent only selectedComponents); (2) the ?shared= fork
   effect applies deviceMode + themeKey, with themeKey AFTER setMode so
   it overrides setMode's dialect-derived default; (3) the pop-out flips
   to standalone AFTER hydration (no empty flash) and the ?preview=1
   effect defers to the fork when a hash is present.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const builderDir = join(process.cwd(), "src", "components", "builder");
const previewPanelSrc = readFileSync(join(builderDir, "PreviewPanel.tsx"), "utf8");
const builderAppSrc = readFileSync(join(builderDir, "BuilderApp.tsx"), "utf8");

const popout = previewPanelSrc.match(/const handlePopOut = \(\) => \{[\s\S]*?\n  \};/)?.[0] ?? "";

describe("PR-D: pop-out routes through the share encoder (fixes empty pop-out)", () => {
  it("handlePopOut encodes the full canvas via buildShareUrl(buildSharedCanvas(s))", () => {
    /* Phase 2 (multi-page) moved the field-mapping into buildSharedCanvas
       (lazy v:1/v:2), which is covered behaviourally by shareState.multipage
       round-trips. The pop-out now just routes the current store state through
       it — so the full canvas (incl. all pages when multi-page) travels. */
    expect(popout).toMatch(/buildShareUrl\(buildSharedCanvas\(s\)\)/);
  });

  it("opens /builder?preview=1&shared=<hash> and preserves the pop-out window size", () => {
    expect(popout).toMatch(/\/builder\?preview=1&shared=\$\{hash\}/);
    expect(popout).toMatch(/width=900,height=700/);
  });

  it("bails with a toast (no window) when the canvas is too large to encode", () => {
    expect(popout).toMatch(/if \(tooLong\)/);
  });

  it("no longer sends selectedComponents as the pop-out payload", () => {
    expect(popout).not.toMatch(/components: selectedComponents\.join/);
  });
});

describe("PR-D: shared-fork hydrates deviceMode + themeKey (themeKey last)", () => {
  it("applies setDeviceMode + setThemeKey", () => {
    expect(builderAppSrc).toMatch(/store\.setDeviceMode\(state\.deviceMode\)/);
    expect(builderAppSrc).toMatch(/store\.setThemeKey\(state\.themeKey\)/);
  });

  it("applies themeKey AFTER setMode so it overrides setMode's derived default", () => {
    const mIdx = builderAppSrc.indexOf("store.setMode(state.mode)");
    const tIdx = builderAppSrc.indexOf("store.setThemeKey(state.themeKey)");
    expect(mIdx).toBeGreaterThan(-1);
    expect(tIdx).toBeGreaterThan(mIdx);
  });

  it("only overrides themeKey when one was shared (legacy null keeps setMode's default)", () => {
    expect(builderAppSrc).toMatch(/if \(state\.themeKey\) store\.setThemeKey/);
  });
});

describe("PR-D: pop-out flips to standalone AFTER hydration (no empty flash)", () => {
  it("fork effect captures isPopout and flips standalone after populating", () => {
    expect(builderAppSrc).toMatch(/const isPopout = params\.get\("preview"\) === "1"/);
    expect(builderAppSrc).toMatch(/if \(isPopout\) setIsStandalone\(true\)/);
  });

  it("?preview=1 effect defers standalone to the fork when ?shared is present", () => {
    expect(builderAppSrc).toMatch(/if \(!params\.get\("shared"\)\)/);
  });
});
