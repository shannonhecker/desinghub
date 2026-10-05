import { describe, it, expect } from "vitest";
import { validateImagePayload, imageContentBlock, IMAGE_REJECTED_ERROR } from "../validateImagePayload";
import { IMAGE_REJECTED_ERROR as SHARED_REJECT } from "../imageBytes";
import { MAX_IMAGE_BYTES } from "../imageBytes";
import { makePng, makeJpeg, makeWebp, makeGif, toBase64 } from "./fixtures";

describe("validateImagePayload (server re-validation)", () => {
  it("accepts each allowed format whose bytes match the declared type", () => {
    for (const [mediaType, bytes] of [
      ["image/png", makePng(1568, 900)],
      ["image/jpeg", makeJpeg(800, 600)],
      ["image/webp", makeWebp(1200, 1200)],
      ["image/gif", makeGif(64, 64)],
    ] as const) {
      const out = validateImagePayload({ mediaType, data: toBase64(bytes) });
      expect(out).toMatchObject({ ok: true, image: { mediaType, data: toBase64(bytes) }, bytes: bytes.length });
    }
  });

  it("rejects a non-object, a missing field, or an unknown media type", () => {
    expect(validateImagePayload("abc")).toEqual({ ok: false, reason: "shape" });
    expect(validateImagePayload({ mediaType: "image/png" })).toEqual({ ok: false, reason: "shape" });
    expect(validateImagePayload({ mediaType: "image/svg+xml", data: toBase64(makePng(1, 1)) })).toEqual({ ok: false, reason: "media-type" });
  });

  it("rejects a URL source: base64 only", () => {
    expect(validateImagePayload({ mediaType: "image/png", data: "https://example.com/a.png" })).toEqual({ ok: false, reason: "base64" });
    expect(validateImagePayload({ mediaType: "image/png", url: "https://example.com/a.png" })).toEqual({ ok: false, reason: "shape" });
  });

  it("rejects malformed base64 and a data: URL prefix", () => {
    expect(validateImagePayload({ mediaType: "image/png", data: "not base64!!" })).toEqual({ ok: false, reason: "base64" });
    expect(validateImagePayload({ mediaType: "image/png", data: `data:image/png;base64,${toBase64(makePng(2, 2))}` })).toEqual({ ok: false, reason: "base64" });
  });

  it("rejects bytes that do not match the declared type", () => {
    expect(validateImagePayload({ mediaType: "image/png", data: toBase64(makeJpeg(10, 10)) })).toEqual({ ok: false, reason: "type-mismatch" });
    const html = new TextEncoder().encode("<html><script>x</script></html>");
    expect(validateImagePayload({ mediaType: "image/png", data: toBase64(html) })).toEqual({ ok: false, reason: "type-mismatch" });
  });

  it("rejects oversize data before decoding and decoded bytes over the cap", () => {
    const big = makePng(100, 100, MAX_IMAGE_BYTES);
    expect(validateImagePayload({ mediaType: "image/png", data: toBase64(big) })).toEqual({ ok: false, reason: "too-large" });
  });

  it("rejects dimensions over the 1568 long edge, and unreadable headers", () => {
    expect(validateImagePayload({ mediaType: "image/png", data: toBase64(makePng(1569, 10)) })).toEqual({ ok: false, reason: "dimensions" });
    expect(validateImagePayload({ mediaType: "image/png", data: toBase64(makePng(0, 10)) })).toEqual({ ok: false, reason: "dimensions" });
    expect(validateImagePayload({ mediaType: "image/png", data: toBase64(makePng(10, 10).slice(0, 20)) })).toEqual({ ok: false, reason: "dimensions" });
  });
});

describe("imageContentBlock", () => {
  it("builds a base64 image block for the Messages API", () => {
    expect(imageContentBlock({ mediaType: "image/webp", data: "AAAA" })).toEqual({
      type: "image",
      source: { type: "base64", media_type: "image/webp", data: "AAAA" },
    });
  });
});

describe("the reject message is one shared constant", () => {
  it("the server module re-exports the isomorphic constant the client matches on", () => {
    expect(IMAGE_REJECTED_ERROR).toBe(SHARED_REJECT);
    expect(SHARED_REJECT).toBe("That image could not be used. Try a PNG, JPEG, WebP or GIF under 2 MB.");
  });
});
