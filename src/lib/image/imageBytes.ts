/* ════════════════════════════════════════════════════════════
   imageBytes: the pure, isomorphic core of the image pipeline.
   Used by the browser (prepareImageAttachment) and the server
   (validateImagePayload), so both sides agree on what an acceptable
   image is. No DOM, no Node-only APIs.
   ════════════════════════════════════════════════════════════ */

export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
export type ImageMediaType = (typeof ALLOWED_IMAGE_TYPES)[number];

/* Long-edge cap in pixels. The chat model reads images at up to this size;
   anything larger costs upload time and latency for no extra detail. */
export const MAX_IMAGE_EDGE = 1568;

/* Cap on the encoded (decoded-from-base64) image size. base64 adds a third,
   so about 2.7 MB on the wire: with the route's 40-message history cap the
   request stays under Vercel's 4.5 MB body limit. */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/* Longest base64 string that can decode to MAX_IMAGE_BYTES. Checked first,
   before any parsing, so a huge string costs one comparison. */
export const MAX_IMAGE_BASE64_LENGTH = Math.ceil(MAX_IMAGE_BYTES / 3) * 4;

/* Decode guard: refuse to decode anything over this many pixels, read from
   the header, so a small file that claims a vast canvas cannot exhaust
   the tab's memory. */
export const MAX_IMAGE_PIXELS = 50_000_000;

/* The image the API route accepts on the latest user message. */
export interface ChatImagePayload {
  mediaType: ImageMediaType;
  /* base64, no data: prefix, no whitespace. */
  data: string;
}

export function isAllowedImageType(value: unknown): value is ImageMediaType {
  return typeof value === "string" && (ALLOWED_IMAGE_TYPES as readonly string[]).includes(value);
}

const startsWith = (b: Uint8Array, sig: number[], at = 0) =>
  b.length >= at + sig.length && sig.every((v, i) => b[at + i] === v);
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

/** Media type from the file's magic bytes, or null if it is not one of the
 *  allowed formats. Never looks at a name or a declared type. */
export function sniffImageType(bytes: Uint8Array): ImageMediaType | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, ascii("GIF87a")) || startsWith(bytes, ascii("GIF89a"))) return "image/gif";
  if (startsWith(bytes, ascii("RIFF")) && startsWith(bytes, ascii("WEBP"), 8)) return "image/webp";
  return null;
}

export interface ImageSize {
  width: number;
  height: number;
}

const be16 = (b: Uint8Array, i: number) => (b[i] << 8) | b[i + 1];
const be32 = (b: Uint8Array, i: number) => ((b[i] << 24) >>> 0) + ((b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]);
const le16 = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8);
const le24 = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);

function jpegSize(b: Uint8Array): ImageSize | null {
  let i = 2;
  while (i + 3 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    /* Fill bytes and standalone markers carry no length. */
    if (marker === 0xff) { i += 1; continue; }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) { i += 2; continue; }
    const len = be16(b, i + 2);
    if (len < 2) return null;
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      if (i + 8 >= b.length) return null;
      return { height: be16(b, i + 5), width: be16(b, i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

function webpSize(b: Uint8Array): ImageSize | null {
  if (b.length < 30) return null;
  if (startsWith(b, ascii("VP8X"), 12)) return { width: 1 + le24(b, 24), height: 1 + le24(b, 27) };
  if (startsWith(b, ascii("VP8 "), 12)) return { width: le16(b, 26) & 0x3fff, height: le16(b, 28) & 0x3fff };
  if (startsWith(b, ascii("VP8L"), 12)) {
    const [b0, b1, b2, b3] = [b[21], b[22], b[23], b[24]];
    return {
      width: 1 + (((b1 & 0x3f) << 8) | b0),
      height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
    };
  }
  return null;
}

/** Pixel size read from the header, or null when the header is truncated
 *  or not understood. */
export function readImageSize(bytes: Uint8Array, type: ImageMediaType): ImageSize | null {
  switch (type) {
    case "image/png":
      if (bytes.length < 24 || !startsWith(bytes, ascii("IHDR"), 12)) return null;
      return { width: be32(bytes, 16), height: be32(bytes, 20) };
    case "image/gif":
      if (bytes.length < 10) return null;
      return { width: le16(bytes, 6), height: le16(bytes, 8) };
    case "image/jpeg":
      return jpegSize(bytes);
    case "image/webp":
      return webpSize(bytes);
  }
}

/** Size scaled so the long edge is at most `edge`, keeping the ratio. */
export function fitWithinEdge(width: number, height: number, edge = MAX_IMAGE_EDGE): ImageSize {
  const long = Math.max(width, height);
  if (long <= edge) return { width, height };
  const scale = edge / long;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

const isBase64Char = (c: number) =>
  (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 48 && c <= 57) || c === 43 || c === 47;

/** Strict, padded, standard-alphabet base64 with no prefix or whitespace.
 *  A linear scan, not a regex: a regex with a repeated group overflowed the
 *  stack on very long input. Callers check MAX_IMAGE_BASE64_LENGTH first. */
export function isStrictBase64(value: string): boolean {
  const n = value.length;
  if (n === 0 || n % 4 !== 0) return false;
  let pad = 0;
  if (value.charCodeAt(n - 1) === 61) pad = value.charCodeAt(n - 2) === 61 ? 2 : 1;
  for (let i = 0; i < n - pad; i++) {
    if (!isBase64Char(value.charCodeAt(i))) return false;
  }
  return true;
}

/** Decoded size of a base64 string, without decoding it. */
export function base64DecodedLength(value: string): number {
  const pad = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  return (value.length / 4) * 3 - pad;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/** True when the file carries metadata that could identify the user or
 *  their location: an EXIF/XMP APP1 segment in a JPEG, an eXIf or text
 *  chunk in a PNG, an EXIF or XMP chunk in a WebP. Such files are
 *  re-encoded in the browser so the metadata never leaves it. */
export function hasImageMetadata(bytes: Uint8Array, type: ImageMediaType): boolean {
  switch (type) {
    case "image/jpeg": {
      let i = 2;
      while (i + 3 < bytes.length) {
        if (bytes[i] !== 0xff) return false;
        const marker = bytes[i + 1];
        if (marker === 0xff) { i += 1; continue; }
        if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) { i += 2; continue; }
        /* Start of scan: no more header segments. */
        if (marker === 0xda) return false;
        /* APP1 (EXIF, XMP), APP3-APP13, APP15 and comments. APP0 (JFIF),
           APP2 (ICC colour) and APP14 (Adobe colour transform) are kept. */
        if (marker === 0xe1 || (marker >= 0xe3 && marker <= 0xed) || marker === 0xef || marker === 0xfe) return true;
        const len = be16(bytes, i + 2);
        if (len < 2) return false;
        i += 2 + len;
      }
      return false;
    }
    case "image/png": {
      let i = 8;
      while (i + 8 <= bytes.length) {
        const len = be32(bytes, i);
        const name = String.fromCharCode(bytes[i + 4], bytes[i + 5], bytes[i + 6], bytes[i + 7]);
        if (name === "eXIf" || name === "tEXt" || name === "iTXt" || name === "zTXt") return true;
        if (name === "IDAT" || name === "IEND") return false;
        i += 12 + len;
      }
      return false;
    }
    case "image/webp": {
      let i = 12;
      while (i + 8 <= bytes.length) {
        const name = String.fromCharCode(bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3]);
        if (name === "EXIF" || name === "XMP ") return true;
        const len = bytes[i + 4] | (bytes[i + 5] << 8) | (bytes[i + 6] << 16) | (bytes[i + 7] << 24);
        i += 8 + len + (len % 2);
      }
      return false;
    }
    case "image/gif":
      return false;
  }
}
