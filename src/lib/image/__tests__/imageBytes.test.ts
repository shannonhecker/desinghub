import { describe, it, expect } from "vitest";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_EDGE,
  MAX_IMAGE_BYTES,
  sniffImageType,
  readImageSize,
  fitWithinEdge,
  bytesToBase64,
  hasImageMetadata,
  MAX_IMAGE_PIXELS,
  base64ToBytes,
  isStrictBase64,
} from "../imageBytes";
import { makePng, makeJpeg, makeGif, makeWebp, toBase64, makeJpegWithExif, makePngWithExif, makePngWithTextAfterIdat, makeGifWithComment } from "./fixtures";

describe("imageBytes: allowlist and caps", () => {
  it("allows exactly png, jpeg, webp and gif", () => {
    expect([...ALLOWED_IMAGE_TYPES].sort()).toEqual(["image/gif", "image/jpeg", "image/png", "image/webp"]);
  });
  it("caps the long edge at 1568 and the encoded size at 2 MB", () => {
    expect(MAX_IMAGE_EDGE).toBe(1568);
    expect(MAX_IMAGE_BYTES).toBe(2 * 1024 * 1024);
  });
});

describe("sniffImageType: by magic bytes only", () => {
  it("recognises each allowed format", () => {
    expect(sniffImageType(makePng(10, 10))).toBe("image/png");
    expect(sniffImageType(makeJpeg(10, 10))).toBe("image/jpeg");
    expect(sniffImageType(makeGif(10, 10))).toBe("image/gif");
    expect(sniffImageType(makeWebp(10, 10))).toBe("image/webp");
  });
  it("rejects svg, html, pdf, bmp and empty input", () => {
    const enc = (s: string) => new TextEncoder().encode(s);
    expect(sniffImageType(enc('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull();
    expect(sniffImageType(enc("<html><body>hi</body></html>"))).toBeNull();
    expect(sniffImageType(enc("%PDF-1.7\n"))).toBeNull();
    expect(sniffImageType(enc("BM\0\0\0\0\0\0\0\0\0\0\0\0"))).toBeNull();
    expect(sniffImageType(new Uint8Array())).toBeNull();
  });
  it("does not accept a RIFF file that is not WebP (e.g. WAV)", () => {
    const wav = new TextEncoder().encode("RIFF\0\0\0\0WAVEfmt ");
    expect(sniffImageType(wav)).toBeNull();
  });
});

describe("readImageSize", () => {
  it("reads pixel dimensions for each format", () => {
    expect(readImageSize(makePng(1920, 1080), "image/png")).toEqual({ width: 1920, height: 1080 });
    expect(readImageSize(makeJpeg(800, 600), "image/jpeg")).toEqual({ width: 800, height: 600 });
    expect(readImageSize(makeGif(320, 200), "image/gif")).toEqual({ width: 320, height: 200 });
    expect(readImageSize(makeWebp(1568, 900), "image/webp")).toEqual({ width: 1568, height: 900 });
  });
  it("returns null for a truncated header", () => {
    expect(readImageSize(makePng(10, 10).slice(0, 18), "image/png")).toBeNull();
    expect(readImageSize(makeJpeg(10, 10).slice(0, 8), "image/jpeg")).toBeNull();
  });
});

describe("fitWithinEdge: downscale to a long edge of 1568", () => {
  it("leaves images within the cap alone", () => {
    expect(fitWithinEdge(1200, 800)).toEqual({ width: 1200, height: 800 });
    expect(fitWithinEdge(1568, 1568)).toEqual({ width: 1568, height: 1568 });
  });
  it("scales landscape and portrait by the long edge, keeping the ratio", () => {
    expect(fitWithinEdge(3136, 1960)).toEqual({ width: 1568, height: 980 });
    expect(fitWithinEdge(1170, 2532)).toEqual({ width: 725, height: 1568 });
  });
  it("never rounds a side down to zero", () => {
    expect(fitWithinEdge(20000, 3)).toEqual({ width: 1568, height: 1 });
  });
});

describe("base64 helpers", () => {
  it("round-trips bytes and matches Node's encoder", () => {
    const bytes = makePng(3, 3, 300);
    const b64 = bytesToBase64(bytes);
    expect(b64).toBe(toBase64(bytes));
    expect(Array.from(base64ToBytes(b64))).toEqual(Array.from(bytes));
  });
  it("accepts only strict, padded base64", () => {
    expect(isStrictBase64("aGVsbG8=")).toBe(true);
    expect(isStrictBase64("aGVsbG8")).toBe(false);
    expect(isStrictBase64("aGVs bG8=")).toBe(false);
    expect(isStrictBase64("data:image/png;base64,aGVsbG8=")).toBe(false);
    expect(isStrictBase64("")).toBe(false);
  });
});

describe("hasImageMetadata: EXIF must not leave the browser", () => {
  it("finds an EXIF APP1 segment in a JPEG and an eXIf chunk in a PNG", () => {
    expect(hasImageMetadata(makeJpegWithExif(10, 10), "image/jpeg")).toBe(true);
    expect(hasImageMetadata(makePngWithExif(10, 10), "image/png")).toBe(true);
  });
  it("is false for clean files", () => {
    expect(hasImageMetadata(makeJpeg(10, 10), "image/jpeg")).toBe(false);
    expect(hasImageMetadata(makePng(10, 10), "image/png")).toBe(false);
  });
  it("caps decode work at about 50 megapixels", () => {
    expect(MAX_IMAGE_PIXELS).toBe(50_000_000);
  });
});

describe("hasImageMetadata fails closed", () => {
  it("finds a PNG text chunk after IDAT", () => {
    expect(hasImageMetadata(makePngWithTextAfterIdat(10, 10), "image/png")).toBe(true);
  });
  it("treats a truncated or malformed PNG as having metadata", () => {
    const png = makePng(10, 10);
    expect(hasImageMetadata(png.slice(0, png.length - 6), "image/png")).toBe(true);
  });
  it("treats a malformed JPEG segment as having metadata", () => {
    const jpeg = makeJpeg(10, 10);
    const broken = jpeg.slice();
    broken[2] = 0x00; // first segment no longer starts with 0xFF
    expect(hasImageMetadata(broken, "image/jpeg")).toBe(true);
    expect(hasImageMetadata(jpeg.slice(0, 12), "image/jpeg")).toBe(true);
  });
  it("finds a GIF comment extension; a plain GIF is clean", () => {
    expect(hasImageMetadata(makeGifWithComment(4, 4, "shot on Pixel"), "image/gif")).toBe(true);
    expect(hasImageMetadata(makeGif(4, 4), "image/gif")).toBe(false);
  });
  it("a well-formed WebP is clean; a chunk running past the end is not", () => {
    expect(hasImageMetadata(makeWebp(10, 10, 0), "image/webp")).toBe(false);
    const webp = makeWebp(10, 10, 0);
    const broken = new Uint8Array([...webp, ...[0x41, 0x4c, 0x50, 0x48, 0xff, 0xff, 0, 0]]);
    expect(hasImageMetadata(broken, "image/webp")).toBe(true);
  });
});
