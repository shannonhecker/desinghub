/* ════════════════════════════════════════════════════════════
   validateImagePayload: server-side re-validation of an image the
   client says it prepared. The client is not trusted: the shape, the
   base64, the declared type against the sniffed bytes, the size and
   the pixel dimensions are all checked again. Base64 only, so the
   server never fetches a user-supplied URL.

   The rejection reason is a short code for the server log. It never
   includes image data, and the client only ever sees one generic line.
   ════════════════════════════════════════════════════════════ */

import type Anthropic from "@anthropic-ai/sdk";
import {
  MAX_IMAGE_BYTES,
  MAX_IMAGE_EDGE,
  type ChatImagePayload,
  MAX_IMAGE_BASE64_LENGTH,
  base64DecodedLength,
  base64ToBytes,
  isAllowedImageType,
  isStrictBase64,
  readImageSize,
  sniffImageType,
} from "./imageBytes";

export type ImageRejectReason = "shape" | "media-type" | "base64" | "too-large" | "type-mismatch" | "dimensions";

export type ImageValidation =
  | { ok: true; image: ChatImagePayload; bytes: number; width: number; height: number }
  | { ok: false; reason: ImageRejectReason };

/* What the client is told for any rejected image. */
export const IMAGE_REJECTED_ERROR = "That image could not be used. Try a PNG, JPEG, WebP or GIF under 2 MB.";

export function validateImagePayload(raw: unknown): ImageValidation {
  if (typeof raw !== "object" || raw === null) return { ok: false, reason: "shape" };
  const { mediaType, data } = raw as Record<string, unknown>;
  if (typeof mediaType !== "string" || typeof data !== "string") return { ok: false, reason: "shape" };
  if (!isAllowedImageType(mediaType)) return { ok: false, reason: "media-type" };
  /* Length first, before any scanning or decoding: a huge string costs one
     comparison, and the route never depends on the platform's body cap. */
  if (data.length > MAX_IMAGE_BASE64_LENGTH) return { ok: false, reason: "too-large" };
  if (!isStrictBase64(data)) return { ok: false, reason: "base64" };
  if (base64DecodedLength(data) > MAX_IMAGE_BYTES) return { ok: false, reason: "too-large" };

  const bytes = base64ToBytes(data);
  if (sniffImageType(bytes) !== mediaType) return { ok: false, reason: "type-mismatch" };
  const size = readImageSize(bytes, mediaType);
  if (!size || size.width < 1 || size.height < 1 || Math.max(size.width, size.height) > MAX_IMAGE_EDGE) {
    return { ok: false, reason: "dimensions" };
  }
  return { ok: true, image: { mediaType, data }, bytes: bytes.length, width: size.width, height: size.height };
}

/** The Messages API content block for a validated image. */
export function imageContentBlock(image: ChatImagePayload): Anthropic.ImageBlockParam {
  return { type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } };
}
