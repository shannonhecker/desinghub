/**
 * Encode / decode a Builder canvas snapshot into a URL-safe string
 * so it can be linked into /preview/share/<hash>.
 *
 * The payload is the minimum state needed to re-render the canvas:
 *   - designSystem, mode, density
 *   - activeTemplateId (for future "fork" support)
 *   - all four zone block arrays
 *
 * Chat messages, preview-open flags, and other UI state are NOT
 * included - the share URL represents a canvas, not a session.
 *
 * Encoding is JSON → URL-safe base64 (no deflate/compress for now;
 * most templates encode to <3KB which stays well below URL limits.
 * If that becomes a problem, swap in LZ-String later.)
 */

import type { Block, DesignSystem, BuilderMode } from "@/store/useBuilder";

export interface SharedCanvas {
  v: 1; // schema version - bumps allow older URLs to error cleanly
  designSystem: DesignSystem;
  mode: BuilderMode;
  density: string;
  activeTemplateId: string | null;
  headerBlocks: Block[];
  sidebarBlocks: Block[];
  blocks: Block[];
  footerBlocks: Block[];
}

const DESIGN_SYSTEMS = new Set<DesignSystem>(["salt", "m3", "fluent", "ausos"]);
const MODES = new Set<BuilderMode>(["light", "dark"]);

/* URL-safe base64: replace +/ with -_ and strip = padding. */
function urlSafeB64Encode(s: string): string {
  const utf8 = typeof TextEncoder !== "undefined"
    ? new TextEncoder().encode(s)
    : Buffer.from(s, "utf-8");
  let binary = "";
  for (let i = 0; i < utf8.byteLength; i++) binary += String.fromCharCode(utf8[i]);
  // btoa works on binary strings
  const b64 = typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function urlSafeB64Decode(s: string): string | null {
  try {
    const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
    const binary = typeof atob !== "undefined" ? atob(padded) : Buffer.from(padded, "base64").toString("binary");
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return typeof TextDecoder !== "undefined"
      ? new TextDecoder().decode(bytes)
      : Buffer.from(bytes).toString("utf-8");
  } catch {
    return null;
  }
}

/* Caps - enforced against the DECODED payload, not the hash string
 * (base64 has ~33% overhead so a large hash is still small decoded).
 * These prevent a malicious share URL from ballooning store state. */
const MAX_JSON_BYTES = 200 * 1024;    // 200KB decoded JSON
const MAX_BLOCKS_PER_ZONE = 120;
const MAX_PROP_STRING_LENGTH = 4000;
const MAX_PROP_KEYS = 50;

/** Recursively deep-sanitize a value so only JSON-primitive, render-safe
 *  shapes survive: strings (capped), finite numbers, booleans, null, and
 *  shallow arrays/objects of those. Anything else (functions, symbols,
 *  deeply nested objects) is dropped. */
function sanitizeValue(v: unknown, depth = 0): unknown {
  if (depth > 3) return null;
  if (v === null) return null;
  if (typeof v === "string") return v.length > MAX_PROP_STRING_LENGTH ? v.slice(0, MAX_PROP_STRING_LENGTH) : v;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "boolean") return v;
  if (Array.isArray(v)) {
    return v.slice(0, 40).map((x) => sanitizeValue(x, depth + 1));
  }
  if (typeof v === "object") {
    const out: Record<string, unknown> = {};
    let count = 0;
    for (const [k, val] of Object.entries(v)) {
      if (count >= MAX_PROP_KEYS) break;
      if (typeof k !== "string" || k.length > 80) continue;
      out[k] = sanitizeValue(val, depth + 1);
      count++;
    }
    return out;
  }
  return null; // functions, symbols, bigints - drop
}

/** Validate a block has the shape { id, type, props } AND sanitize its
 *  props so render-time consumers never see arbitrary shapes. Mutates
 *  the prop bag but returns the same id/type. Also clamps colSpan to
 *  the 1-3 grid range so a malicious share can't break layout. */
function validateAndSanitizeBlock(b: unknown): Block | null {
  if (typeof b !== "object" || b === null) return null;
  const blk = b as Record<string, unknown>;
  if (typeof blk.id !== "string" || blk.id.length === 0 || blk.id.length > 120) return null;
  if (typeof blk.type !== "string" || blk.type.length === 0 || blk.type.length > 80) return null;
  if (typeof blk.props !== "object" || blk.props === null) return null;

  const cleanProps = sanitizeValue(blk.props) as Record<string, unknown>;

  // Clamp colSpan defensively so bad values don't break CSS grid
  if ("colSpan" in cleanProps) {
    const cs = Number(cleanProps.colSpan);
    cleanProps.colSpan = Number.isFinite(cs) ? Math.max(1, Math.min(3, Math.floor(cs))) : 3;
  }

  return { id: blk.id, type: blk.type, props: cleanProps };
}

function validateAndSanitizeBlockArray(a: unknown): Block[] | null {
  if (!Array.isArray(a)) return null;
  if (a.length > MAX_BLOCKS_PER_ZONE) return null;
  const out: Block[] = [];
  for (const item of a) {
    const clean = validateAndSanitizeBlock(item);
    if (!clean) return null;
    out.push(clean);
  }
  return out;
}

export function encodeShareState(s: SharedCanvas): string {
  return urlSafeB64Encode(JSON.stringify(s));
}

export function decodeShareState(hash: string): SharedCanvas | null {
  if (!hash || hash.length > 64 * 1024) return null; // hash string cap (loose)
  const json = urlSafeB64Decode(hash);
  if (!json) return null;
  if (json.length > MAX_JSON_BYTES) return null;     // DECODED payload cap (tight)

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;

  if (obj.v !== 1) return null;
  if (typeof obj.designSystem !== "string" || !DESIGN_SYSTEMS.has(obj.designSystem as DesignSystem)) return null;
  if (typeof obj.mode !== "string" || !MODES.has(obj.mode as BuilderMode)) return null;
  if (typeof obj.density !== "string" || obj.density.length > 40) return null;
  const activeTemplateId =
    typeof obj.activeTemplateId === "string" && obj.activeTemplateId.length <= 80
      ? obj.activeTemplateId
      : null;

  const headerBlocks  = validateAndSanitizeBlockArray(obj.headerBlocks);
  const sidebarBlocks = validateAndSanitizeBlockArray(obj.sidebarBlocks);
  const blocks        = validateAndSanitizeBlockArray(obj.blocks);
  const footerBlocks  = validateAndSanitizeBlockArray(obj.footerBlocks);

  if (!headerBlocks || !sidebarBlocks || !blocks || !footerBlocks) return null;

  return {
    v: 1,
    designSystem: obj.designSystem as DesignSystem,
    mode: obj.mode as BuilderMode,
    density: obj.density,
    activeTemplateId,
    headerBlocks,
    sidebarBlocks,
    blocks,
    footerBlocks,
  };
}

/** Build a share URL from the current client-side state.
 *  Returns { url, tooLong } - tooLong is true when the URL exceeds
 *  a platform-friendly cap (~3500 chars); caller should warn user. */
export function buildShareUrl(state: SharedCanvas): { url: string; tooLong: boolean; hash: string } {
  const hash = encodeShareState(state);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/preview/share/${hash}`;
  return { url, tooLong: url.length > 3500, hash };
}
