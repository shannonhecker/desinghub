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
 * included — the share URL represents a canvas, not a session.
 *
 * Encoding is JSON → URL-safe base64 (no deflate/compress for now;
 * most templates encode to <3KB which stays well below URL limits.
 * If that becomes a problem, swap in LZ-String later.)
 */

import type { Block, DesignSystem, BuilderMode } from "@/store/useBuilder";

export interface SharedCanvas {
  v: 1; // schema version — bumps allow older URLs to error cleanly
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

/* Validate a block has the shape { id, type, props } with primitive-safe values. */
function isValidBlock(b: unknown): b is Block {
  if (typeof b !== "object" || b === null) return false;
  const blk = b as Record<string, unknown>;
  return (
    typeof blk.id === "string" &&
    typeof blk.type === "string" &&
    typeof blk.props === "object" &&
    blk.props !== null
  );
}

function isValidBlockArray(a: unknown): a is Block[] {
  return Array.isArray(a) && a.every(isValidBlock);
}

export function encodeShareState(s: SharedCanvas): string {
  return urlSafeB64Encode(JSON.stringify(s));
}

export function decodeShareState(hash: string): SharedCanvas | null {
  if (!hash || hash.length > 32 * 1024) return null;
  const json = urlSafeB64Decode(hash);
  if (!json) return null;
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
  if (typeof obj.density !== "string") return null;
  if (obj.activeTemplateId !== null && typeof obj.activeTemplateId !== "string") return null;
  if (!isValidBlockArray(obj.headerBlocks)) return null;
  if (!isValidBlockArray(obj.sidebarBlocks)) return null;
  if (!isValidBlockArray(obj.blocks)) return null;
  if (!isValidBlockArray(obj.footerBlocks)) return null;

  return {
    v: 1,
    designSystem: obj.designSystem as DesignSystem,
    mode: obj.mode as BuilderMode,
    density: obj.density,
    activeTemplateId: (obj.activeTemplateId as string | null) ?? null,
    headerBlocks: obj.headerBlocks,
    sidebarBlocks: obj.sidebarBlocks,
    blocks: obj.blocks,
    footerBlocks: obj.footerBlocks,
  };
}

/** Build a share URL from the current client-side state.
 *  Returns { url, tooLong } — tooLong is true when the URL exceeds
 *  a platform-friendly cap (~3500 chars); caller should warn user. */
export function buildShareUrl(state: SharedCanvas): { url: string; tooLong: boolean; hash: string } {
  const hash = encodeShareState(state);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/preview/share/${hash}`;
  return { url, tooLong: url.length > 3500, hash };
}
