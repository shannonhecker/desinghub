/* Minimal, structurally valid image headers for tests. Only the bytes the
   sniffer and the size reader look at are real; the rest is padding. */

const be32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const le16 = (n: number) => [n & 255, (n >>> 8) & 255];
const le24 = (n: number) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255];
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

function withPadding(head: number[], pad: number): Uint8Array {
  const out = new Uint8Array(head.length + pad);
  out.set(head);
  return out;
}

export function makePng(width: number, height: number, pad = 64): Uint8Array {
  return withPadding(
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...be32(13), ...ascii("IHDR"), ...be32(width), ...be32(height), 8, 6, 0, 0, 0],
    pad,
  );
}

export function makeJpeg(width: number, height: number, pad = 64): Uint8Array {
  return withPadding(
    [
      0xff, 0xd8,
      // APP0 (JFIF), length 16
      0xff, 0xe0, 0x00, 0x10, ...ascii("JFIF"), 0, 1, 1, 0, 0, 1, 0, 1, 0, 0,
      // SOF0, length 17: precision, height, width, components
      0xff, 0xc0, 0x00, 0x11, 8, (height >> 8) & 255, height & 255, (width >> 8) & 255, width & 255, 3,
      1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1,
    ],
    pad,
  );
}

export function makeGif(width: number, height: number, pad = 64): Uint8Array {
  return withPadding([...ascii("GIF89a"), ...le16(width), ...le16(height), 0, 0, 0], pad);
}

/* Extended WebP (VP8X): canvas size minus one, 24-bit little endian. */
export function makeWebp(width: number, height: number, pad = 64): Uint8Array {
  return withPadding(
    [...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP"), ...ascii("VP8X"), 10, 0, 0, 0, 0, 0, 0, 0, ...le24(width - 1), ...le24(height - 1)],
    pad,
  );
}

export function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

export function fileFrom(bytes: Uint8Array, name: string, type = ""): File {
  return new File([bytes as BlobPart], name, { type });
}

/* A JPEG carrying an EXIF APP1 segment with a GPS marker, as phones write. */
export const GPS_MARKER = "GPSLatitude51.5074N";
export function makeJpegWithExif(width: number, height: number, pad = 64): Uint8Array {
  const exifBody = [...ascii("Exif"), 0, 0, ...ascii("MM"), 0, 42, ...ascii(GPS_MARKER)];
  const len = exifBody.length + 2;
  const base = makeJpeg(width, height, pad);
  const app1 = [0xff, 0xe1, (len >> 8) & 255, len & 255, ...exifBody];
  const out = new Uint8Array(base.length + app1.length);
  out.set(base.subarray(0, 2));
  out.set(app1, 2);
  out.set(base.subarray(2), 2 + app1.length);
  return out;
}

/* A PNG with an eXIf chunk after IHDR. */
export function makePngWithExif(width: number, height: number): Uint8Array {
  const base = makePng(width, height, 0);
  const data = ascii(GPS_MARKER);
  /* makePng stops after the IHDR data; add its CRC, then the eXIf chunk. */
  const chunk = [0, 0, 0, 0, ...be32(data.length), ...ascii("eXIf"), ...data, 0, 0, 0, 0];
  const out = new Uint8Array(base.length + chunk.length + 32);
  out.set(base);
  out.set(chunk, base.length);
  return out;
}

export const containsAscii = (bytes: Uint8Array, text: string) =>
  Buffer.from(bytes).toString("latin1").includes(text);
