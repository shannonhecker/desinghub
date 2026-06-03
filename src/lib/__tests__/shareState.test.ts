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
import LZString from "lz-string";
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

/* Regression: the share hash sits in a URL *path* (/preview/share/<hash>).
   compressToEncodedURIComponent emits `+` and `$`, which a browser 404s in
   a path segment (confirmed live). encodeShareState must map those to
   path-safe unreserved chars. A plain encode/decode round-trip does NOT
   catch this (decompress handles `+`); the breakage is URL transport. */
describe("shareState — URL-path-safe hash (no +/$ that 404 the share route)", () => {
  it("strips the +/$ that the raw LZ encoder would emit, and still decodes", () => {
    // Find a payload whose RAW LZ output is not path-safe (would have broken).
    let payload: SharedCanvas | null = null;
    let raw = "";
    for (let i = 0; i < 300; i++) {
      const p: SharedCanvas = { ...base, blocks: [{ id: "b" + i, type: "Text", props: { text: "sample content " + i } }] };
      const r = LZString.compressToEncodedURIComponent(JSON.stringify(p));
      if (/[+$]/.test(r)) { payload = p; raw = r; break; }
    }
    expect(payload).not.toBeNull();         // a payload the OLD encoder would 404
    expect(raw).toMatch(/[+$]/);            // raw LZ output is NOT path-safe
    const safe = encodeShareState(payload!);
    expect(safe).not.toMatch(/[+$]/);       // our encoder IS path-safe
    expect(safe).toMatch(/^[A-Za-z0-9_~-]+$/);
    expect(decodeShareState(safe)).not.toBeNull();  // and still decodes
  });

  it("encodes only unreserved chars across many varied payloads", () => {
    for (let i = 0; i < 60; i++) {
      const p: SharedCanvas = { ...base, blocks: [{ id: "k" + i, type: "StatCard", props: { v: "$" + i + ".00", t: "row " + i } }] };
      expect(encodeShareState(p)).toMatch(/^[A-Za-z0-9_~-]+$/);
    }
  });
});
