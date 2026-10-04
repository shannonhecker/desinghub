import { describe, expect, it } from "vitest";
import { safeSharedImageSource } from "../sharedImageSource";
import { decodeShareState, encodeShareState } from "../shareState";

describe("shared image sources", () => {
  it.each(["https://evil.test/a.png", "//evil.test/a.png", "/\\evil.test/a.png", "/%2f%2fevil.test/a.png", "/%252fevil.test/a.png", "javascript:alert(1)", "data:image/svg+xml,<svg onload=alert(1)>", "/../api/a.png"])("removes %s", source => expect(safeSharedImageSource(source)).toBe(""));
  it.each(["/media/dummy/enterprise-analytics.png", "/aologo.svg", "data:image/png;base64,aGVsbG8="])("allows local assets and raster data: %s", source => expect(safeSharedImageSource(source)).toBe(source));
  it("enforces the policy while decoding shared blocks, including nested avatar props", () => {
    const shared = { v: 1 as const, designSystem: "salt" as const, mode: "light" as const, density: "medium", canvasSpacing: "tight" as const, deviceMode: "desktop" as const, themeKey: null, activeTemplateId: null, headerBlocks: [], sidebarBlocks: [], footerBlocks: [], blocks: [{ id: "image", type: "SimulatedImage", props: { src: "https://evil.test/image.png", people: [{ src: "//evil.test/avatar.png" }] } }] };
    expect(decodeShareState(encodeShareState(shared))?.blocks[0].props).toEqual({ src: "", people: [{ src: "" }] });
  });
});
