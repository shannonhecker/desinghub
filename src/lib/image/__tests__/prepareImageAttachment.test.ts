import { describe, it, expect, vi } from "vitest";
import {
  prepareImageAttachment,
  ImageAttachmentError,
  IMAGE_ERROR_COPY,
  MAX_INPUT_FILE_BYTES,
  type ImageCodec,
} from "../prepareImageAttachment";
import { MAX_IMAGE_BYTES } from "../imageBytes";
import { makePng, makeJpeg, makeGif, makeWebp, fileFrom, toBase64, makeJpegWithExif, makePngWithExif, containsAscii, GPS_MARKER } from "./fixtures";
import { base64ToBytes } from "../imageBytes";

/* A codec double: decode reports the size it is told to, encode returns a
   real PNG/JPEG header at the requested size, padded to `encodedBytes`. */
function fakeCodec(opts: { decoded?: { width: number; height: number }; encodedBytes?: (type: string, quality?: number) => number; failDecode?: boolean } = {}) {
  const encode = vi.fn(async (_src: unknown, width: number, height: number, type: string, quality?: number) => {
    const pad = opts.encodedBytes?.(type, quality) ?? 1000;
    return type === "image/png" ? makePng(width, height, pad) : makeJpeg(width, height, pad);
  });
  const release = vi.fn();
  const codec: ImageCodec = {
    release,
    decode: vi.fn(async () => {
      if (opts.failDecode) throw new Error("decode failed");
      return { width: opts.decoded?.width ?? 0, height: opts.decoded?.height ?? 0, source: {} };
    }),
    encode,
  };
  return { codec, encode, release };
}

async function rejection(p: Promise<unknown>): Promise<ImageAttachmentError> {
  try {
    await p;
  } catch (err) {
    expect(err).toBeInstanceOf(ImageAttachmentError);
    return err as ImageAttachmentError;
  }
  throw new Error("expected a rejection");
}

describe("prepareImageAttachment: accepts by sniffed bytes", () => {
  it("returns a small PNG as is, with its size and base64", async () => {
    const bytes = makePng(800, 600, 2000);
    const { codec } = fakeCodec();
    const out = await prepareImageAttachment(fileFrom(bytes, "shot.png", "image/png"), codec);
    expect(out).toEqual({ mediaType: "image/png", base64: toBase64(bytes), width: 800, height: 600, bytes: bytes.length });
    expect(codec.decode).not.toHaveBeenCalled();
  });

  it("trusts the bytes, not the name or declared type", async () => {
    const bytes = makeJpeg(400, 300);
    const { codec } = fakeCodec();
    const out = await prepareImageAttachment(fileFrom(bytes, "looks-like.png", "image/png"), codec);
    expect(out.mediaType).toBe("image/jpeg");
  });

  it("keeps GIF and WebP originals when they already fit", async () => {
    const { codec } = fakeCodec();
    expect((await prepareImageAttachment(fileFrom(makeGif(100, 50), "a.gif"), codec)).mediaType).toBe("image/gif");
    expect((await prepareImageAttachment(fileFrom(makeWebp(1568, 400), "a.webp"), codec)).mediaType).toBe("image/webp");
  });
});

describe("prepareImageAttachment: rejects", () => {
  it("an SVG named .png with the unsupported message", async () => {
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>');
    const err = await rejection(prepareImageAttachment(fileFrom(svg, "logo.png", "image/png"), fakeCodec().codec));
    expect(err.code).toBe("unsupported");
    expect(err.message).toBe(IMAGE_ERROR_COPY.unsupported);
  });

  it("a PDF, without decoding it", async () => {
    const { codec } = fakeCodec();
    const err = await rejection(prepareImageAttachment(fileFrom(new TextEncoder().encode("%PDF-1.7"), "x.pdf"), codec));
    expect(err.code).toBe("unsupported");
    expect(codec.decode).not.toHaveBeenCalled();
  });

  it("a file over the input cap before reading it", async () => {
    const huge = { name: "huge.png", type: "image/png", size: MAX_INPUT_FILE_BYTES + 1, arrayBuffer: vi.fn() } as unknown as File;
    const err = await rejection(prepareImageAttachment(huge, fakeCodec().codec));
    expect(err.code).toBe("too-large");
    expect(err.message).toBe(IMAGE_ERROR_COPY.tooLarge);
    expect((huge as unknown as { arrayBuffer: ReturnType<typeof vi.fn> }).arrayBuffer).not.toHaveBeenCalled();
  });

  it("an image the browser cannot decode", async () => {
    const bytes = makePng(4000, 3000);
    const err = await rejection(prepareImageAttachment(fileFrom(bytes, "broken.png"), fakeCodec({ failDecode: true }).codec));
    expect(err.code).toBe("unreadable");
    expect(err.message).toBe(IMAGE_ERROR_COPY.unreadable);
  });

  it("an image still over the byte cap after every re-encode", async () => {
    const bytes = makePng(4000, 3000);
    const { codec, encode } = fakeCodec({ decoded: { width: 4000, height: 3000 }, encodedBytes: () => MAX_IMAGE_BYTES + 10 });
    const err = await rejection(prepareImageAttachment(fileFrom(bytes, "big.png"), codec));
    expect(err.code).toBe("too-large");
    expect(encode).toHaveBeenCalledTimes(3);
  });
});

describe("prepareImageAttachment: downscales to a long edge of 1568", () => {
  it("re-encodes an oversized screenshot as PNG at 1568 on the long edge", async () => {
    const bytes = makePng(3136, 1960);
    const { codec, encode } = fakeCodec({ decoded: { width: 3136, height: 1960 } });
    const out = await prepareImageAttachment(fileFrom(bytes, "retina.png"), codec);
    expect(encode).toHaveBeenCalledTimes(1);
    expect(encode.mock.calls[0].slice(1, 4)).toEqual([1568, 980, "image/png"]);
    expect(out).toMatchObject({ mediaType: "image/png", width: 1568, height: 980 });
  });

  it("falls back to JPEG when the PNG is over the byte cap", async () => {
    /* A PNG source (a photo saved as PNG): PNG first, then JPEG. */
    const bytes = makePng(4032, 3024);
    const { codec, encode } = fakeCodec({
      decoded: { width: 4032, height: 3024 },
      encodedBytes: (type) => (type === "image/png" ? MAX_IMAGE_BYTES + 1 : 500_000),
    });
    const out = await prepareImageAttachment(fileFrom(bytes, "photo.jpg"), codec);
    expect(encode.mock.calls.map((c) => [c[3], c[4]])).toEqual([["image/png", undefined], ["image/jpeg", 0.88]]);
    expect(out).toMatchObject({ mediaType: "image/jpeg", width: 1568, height: 1176 });
    expect(out.bytes).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
  });

  it("re-encodes a small-dimension image that is over the byte cap", async () => {
    const bytes = makePng(1200, 900, MAX_IMAGE_BYTES + 5);
    const { codec, encode } = fakeCodec({ decoded: { width: 1200, height: 900 } });
    const out = await prepareImageAttachment(fileFrom(bytes, "noisy.png"), codec);
    expect(encode.mock.calls[0].slice(1, 3)).toEqual([1200, 900]);
    expect(out.bytes).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
  });
});

describe("prepareImageAttachment: decode guard and cleanup", () => {
  it("rejects an image over about 50 megapixels from its header, before decoding", async () => {
    const { codec } = fakeCodec({ decoded: { width: 10000, height: 6000 } });
    const err = await rejection(prepareImageAttachment(fileFrom(makePng(10000, 6000), "huge.png"), codec));
    expect(err.code).toBe("too-large");
    expect(codec.decode).not.toHaveBeenCalled();
  });

  it("rejects a header it cannot read, without decoding", async () => {
    const { codec } = fakeCodec({ decoded: { width: 10, height: 10 } });
    const err = await rejection(prepareImageAttachment(fileFrom(makePng(10, 10).slice(0, 20), "cut.png"), codec));
    expect(err.code).toBe("unreadable");
    expect(codec.decode).not.toHaveBeenCalled();
  });

  it("releases the decoded bitmap after re-encoding, and after a failure", async () => {
    const ok = fakeCodec({ decoded: { width: 3000, height: 2000 } });
    await prepareImageAttachment(fileFrom(makePng(3000, 2000), "a.png"), ok.codec);
    expect(ok.release).toHaveBeenCalledTimes(1);
    const bad = fakeCodec({ decoded: { width: 3000, height: 2000 }, encodedBytes: () => MAX_IMAGE_BYTES + 1 });
    await rejection(prepareImageAttachment(fileFrom(makePng(3000, 2000), "b.png"), bad.codec));
    expect(bad.release).toHaveBeenCalledTimes(1);
  });
});

describe("prepareImageAttachment: metadata never leaves the browser", () => {
  it("re-encodes a small JPEG that carries EXIF (GPS), so the original bytes are not sent", async () => {
    const bytes = makeJpegWithExif(800, 600);
    expect(containsAscii(bytes, GPS_MARKER)).toBe(true);
    const { codec, encode } = fakeCodec({ decoded: { width: 800, height: 600 } });
    const out = await prepareImageAttachment(fileFrom(bytes, "phone.jpg"), codec);
    expect(encode).toHaveBeenCalled();
    expect(encode.mock.calls[0].slice(1, 3)).toEqual([800, 600]);
    expect(containsAscii(base64ToBytes(out.base64), GPS_MARKER)).toBe(false);
  });

  it("re-encodes a PNG with an eXIf chunk", async () => {
    const { codec, encode } = fakeCodec({ decoded: { width: 10, height: 10 } });
    const out = await prepareImageAttachment(fileFrom(makePngWithExif(10, 10), "x.png"), codec);
    expect(encode).toHaveBeenCalled();
    expect(containsAscii(base64ToBytes(out.base64), GPS_MARKER)).toBe(false);
  });
});

describe("prepareImageAttachment: JPEG sources stay JPEG", () => {
  it("re-encodes a JPEG as JPEG first, never PNG", async () => {
    const { codec, encode } = fakeCodec({ decoded: { width: 4032, height: 3024 } });
    const out = await prepareImageAttachment(fileFrom(makeJpeg(4032, 3024), "photo.jpg"), codec);
    expect(encode.mock.calls.map((c) => c[3])).toEqual(["image/jpeg"]);
    expect(encode.mock.calls[0][4]).toBe(0.88);
    expect(out.mediaType).toBe("image/jpeg");
  });
});

describe("browserImageCodec", () => {
  it("decodes with imageOrientation 'from-image' explicitly", async () => {
    const { browserImageCodec } = await import("../prepareImageAttachment");
    const spy = vi.fn(async () => ({ width: 2, height: 1, close: vi.fn() }));
    const prev = (globalThis as { createImageBitmap?: unknown }).createImageBitmap;
    (globalThis as { createImageBitmap?: unknown }).createImageBitmap = spy;
    try {
      await browserImageCodec.decode(new Blob([new Uint8Array([1])]));
      expect(spy).toHaveBeenCalledWith(expect.any(Blob), { imageOrientation: "from-image" });
    } finally {
      (globalThis as { createImageBitmap?: unknown }).createImageBitmap = prev;
    }
  });
});
