/* ════════════════════════════════════════════════════════════
   shareState — PR-C: deviceMode + themeKey in the share schema.
   ════════════════════════════════════════════════════════════
   Behavioural (not source-pin) — shareState is a pure encode/decode
   pair. Pins: (1) the new fields round-trip; (2) v1-compatibility —
   links that predate the fields still decode, with sane defaults,
   rather than erroring (no version bump); (3) decode validation
   (invalid deviceMode → desktop, over-long themeKey → null).
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { encodeShareState, decodeShareState, type SharedCanvas } from "@/lib/shareState";

const base: SharedCanvas = {
  v: 1,
  designSystem: "carbon",
  mode: "dark",
  density: "medium",
  deviceMode: "tablet",
  themeKey: "g90",
  activeTemplateId: null,
  headerBlocks: [],
  sidebarBlocks: [],
  blocks: [],
  footerBlocks: [],
};

describe("shareState — deviceMode + themeKey (PR-C, v1-compatible)", () => {
  it("round-trips deviceMode and themeKey", () => {
    const back = decodeShareState(encodeShareState(base));
    expect(back).not.toBeNull();
    expect(back!.deviceMode).toBe("tablet");
    expect(back!.themeKey).toBe("g90");
  });

  it("decodes a legacy v1 link (no deviceMode/themeKey) with desktop + null defaults", () => {
    /* Simulate a link encoded before PR-C — the payload lacks the new
       fields. It must still decode (not error) with safe defaults. */
    const legacy = {
      v: 1,
      designSystem: "salt",
      mode: "light",
      density: "medium",
      activeTemplateId: null,
      headerBlocks: [],
      sidebarBlocks: [],
      blocks: [],
      footerBlocks: [],
    };
    const back = decodeShareState(encodeShareState(legacy as unknown as SharedCanvas));
    expect(back).not.toBeNull();
    expect(back!.deviceMode).toBe("desktop");
    expect(back!.themeKey).toBeNull();
  });

  it("falls back to desktop for an out-of-range deviceMode", () => {
    const bad = { ...base, deviceMode: "hologram" } as unknown as SharedCanvas;
    const back = decodeShareState(encodeShareState(bad));
    expect(back).not.toBeNull();
    expect(back!.deviceMode).toBe("desktop");
  });

  it("drops an over-long themeKey to null", () => {
    const longKey = { ...base, themeKey: "x".repeat(41) };
    const back = decodeShareState(encodeShareState(longKey));
    expect(back!.themeKey).toBeNull();
  });

  it("still round-trips the core fields unchanged", () => {
    const back = decodeShareState(encodeShareState(base));
    expect(back!.designSystem).toBe("carbon");
    expect(back!.mode).toBe("dark");
    expect(back!.density).toBe("medium");
  });
});
