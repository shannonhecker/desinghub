/* ════════════════════════════════════════════════════════════
   prepareImageAttachment: turn a user's File into a payload the chat
   route accepts. Browser side of the image pipeline.

   1. Reject files over the input cap before reading them.
   2. Sniff the type from the bytes (allowlist: png, jpeg, webp, gif).
   3. Refuse anything over about 50 megapixels from its header, before
      decoding. Keep the original when it already fits (long edge <= 1568,
      <= 2 MB) and carries no metadata, so screenshots stay sharp and GIFs
      stay GIFs. A file with EXIF (GPS, camera) is always re-encoded, so
      that metadata never leaves the browser.
   4. Otherwise decode, scale to the long-edge cap and re-encode:
      PNG first (crisp UI), then JPEG 0.88, then JPEG 0.75.
   5. Re-check the result with the same rules the server uses.

   The codec is injectable so the logic is testable without a canvas.
   ════════════════════════════════════════════════════════════ */

import {
  MAX_IMAGE_BYTES,
  MAX_IMAGE_EDGE,
  MAX_IMAGE_PIXELS,
  hasImageMetadata,
  type ImageMediaType,
  bytesToBase64,
  fitWithinEdge,
  readImageSize,
  sniffImageType,
} from "./imageBytes";

/* Files larger than this are refused before decoding, so the tab never
   decodes a huge file only to reject it. */
export const MAX_INPUT_FILE_BYTES = 20 * 1024 * 1024;

export interface PreparedImage {
  mediaType: ImageMediaType;
  base64: string;
  width: number;
  height: number;
  /* Encoded size in bytes (before base64). */
  bytes: number;
}

export type ImageAttachmentErrorCode = "unsupported" | "too-large" | "unreadable";

export const IMAGE_ERROR_COPY = {
  unsupported: "That file isn't an image we can read. Try a PNG, JPEG, WebP or GIF.",
  tooLarge: "That image is too large, even after shrinking. Try a smaller crop or a screenshot.",
  unreadable: "We couldn't open that image. Try saving it as a PNG or JPEG first.",
} as const;

export class ImageAttachmentError extends Error {
  readonly code: ImageAttachmentErrorCode;
  constructor(code: ImageAttachmentErrorCode) {
    super(code === "unsupported" ? IMAGE_ERROR_COPY.unsupported : code === "too-large" ? IMAGE_ERROR_COPY.tooLarge : IMAGE_ERROR_COPY.unreadable);
    this.name = "ImageAttachmentError";
    this.code = code;
  }
}

export interface DecodedImage {
  width: number;
  height: number;
  /* Opaque to this module: whatever the codec's encode needs. */
  source: unknown;
}

export interface ImageCodec {
  decode(blob: Blob): Promise<DecodedImage>;
  encode(source: unknown, width: number, height: number, type: "image/png" | "image/jpeg", quality?: number): Promise<Uint8Array>;
  /* Free the decoded image (ImageBitmap.close in the browser). */
  release?(source: unknown): void;
}

type EncodeStep = { type: "image/png" | "image/jpeg"; quality?: number };
/* Re-encode ladder: crisp PNG for UI screenshots, then JPEG for photos.
   A JPEG source is a photo already: re-encoding it as PNG would only grow
   it, so it goes straight to JPEG. */
const JPEG_STEPS: EncodeStep[] = [
  { type: "image/jpeg", quality: 0.88 },
  { type: "image/jpeg", quality: 0.75 },
];
const encodeLadder = (source: ImageMediaType): EncodeStep[] =>
  source === "image/jpeg" ? JPEG_STEPS : [{ type: "image/png" }, ...JPEG_STEPS];

async function readBytes(file: Blob): Promise<Uint8Array> {
  if (typeof file.arrayBuffer === "function") return new Uint8Array(await file.arrayBuffer());
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function fits(bytes: Uint8Array, width: number, height: number): boolean {
  return bytes.length <= MAX_IMAGE_BYTES && width > 0 && height > 0 && Math.max(width, height) <= MAX_IMAGE_EDGE;
}

export async function prepareImageAttachment(file: File, codec: ImageCodec = browserImageCodec): Promise<PreparedImage> {
  if (file.size > MAX_INPUT_FILE_BYTES) throw new ImageAttachmentError("too-large");

  const original = await readBytes(file);
  const mediaType = sniffImageType(original);
  if (!mediaType) throw new ImageAttachmentError("unsupported");

  const size = readImageSize(original, mediaType);
  if (!size || size.width < 1 || size.height < 1) throw new ImageAttachmentError("unreadable");
  if (size.width * size.height > MAX_IMAGE_PIXELS) throw new ImageAttachmentError("too-large");
  if (fits(original, size.width, size.height) && !hasImageMetadata(original, mediaType)) {
    return { mediaType, base64: bytesToBase64(original), width: size.width, height: size.height, bytes: original.length };
  }

  let decoded: DecodedImage;
  try {
    decoded = await codec.decode(new Blob([original as BlobPart], { type: mediaType }));
  } catch {
    throw new ImageAttachmentError("unreadable");
  }
  try {
    if (!(decoded.width > 0 && decoded.height > 0)) throw new ImageAttachmentError("unreadable");
    if (decoded.width * decoded.height > MAX_IMAGE_PIXELS) throw new ImageAttachmentError("too-large");
    const target = fitWithinEdge(decoded.width, decoded.height);
    for (const step of encodeLadder(mediaType)) {
      let out: Uint8Array;
      try {
        out = await codec.encode(decoded.source, target.width, target.height, step.type, step.quality);
      } catch {
        throw new ImageAttachmentError("unreadable");
      }
      const outType = sniffImageType(out);
      const outSize = outType ? readImageSize(out, outType) : null;
      if (!outType || !outSize) throw new ImageAttachmentError("unreadable");
      /* Canvas output carries no EXIF; checked anyway so nothing slips. */
      if (hasImageMetadata(out, outType)) continue;
      if (fits(out, outSize.width, outSize.height)) {
        return { mediaType: outType, base64: bytesToBase64(out), width: outSize.width, height: outSize.height, bytes: out.length };
      }
    }
    throw new ImageAttachmentError("too-large");
  } finally {
    codec.release?.(decoded.source);
  }
}

/* ── Browser codec: createImageBitmap + canvas ── */
export const browserImageCodec: ImageCodec = {
  async decode(blob) {
    /* Explicit, so a phone photo's EXIF rotation is applied before the
       pixels are re-encoded without it. */
    const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
    return { width: bitmap.width, height: bitmap.height, source: bitmap };
  },
  async encode(source, width, height, type, quality) {
    const bitmap = source as ImageBitmap;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    /* JPEG has no alpha: paint white first so transparent areas don't go black. */
    if (type === "image/jpeg") {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    if (!blob) throw new Error("encode failed");
    return readBytes(blob);
  },
  release(source) {
    (source as ImageBitmap | null)?.close?.();
  },
};
