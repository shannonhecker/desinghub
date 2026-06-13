/**
 * Encode / decode a Builder canvas snapshot into a URL-safe string
 * so it can be linked into /preview/share/<hash>.
 *
 * The payload is the minimum state needed to re-render the canvas:
 *   - designSystem, mode, density
 *   - deviceMode, themeKey (so a shared link opens at the author's
 *     device frame + theme — added PR-C, v1-compatible: links that
 *     predate these fields decode with desktop / null defaults)
 *   - activeTemplateId (for future "fork" support)
 *   - all four zone block arrays
 *
 * Chat messages, preview-open flags, and other UI state are NOT
 * included - the share URL represents a canvas, not a session.
 *
 * Encoding is JSON → LZ-String (compressToEncodedURIComponent). The
 * enriched templates pushed the old raw-base64 payload past a
 * platform-friendly URL length ("Too large to share"); LZ-String
 * compresses the repetitive block JSON ~5-10× so realistic canvases
 * fit comfortably. decodeShareState keeps a raw-base64 fallback so
 * links generated before compression was added still resolve.
 */

import type { Block, DesignSystem, BuilderMode, DeviceMode, Page } from "@/store/useBuilder";
import { isValidBlockSource, useBuilder, flushActiveBody, isMultiPage } from "@/store/useBuilder";
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { migrateBlocks } from "./blockMigrations";

export interface SharedCanvas {
  v: 1 | 2; // schema version - bumps allow older URLs to error cleanly
  designSystem: DesignSystem;
  mode: BuilderMode;
  density: string;
  /* Author's block-spacing preset, so a shared link renders with the same
     rhythm as the author's canvas (PresentStage reads it as data-canvas-spacing).
     v1-compatible — decode defaults to 'tight' for older links that lack it. */
  canvasSpacing: 'tight' | 'comfortable';
  /* PR-C: device frame + theme so a shared link opens exactly as the
     author framed it. v1-compatible — decode defaults these for older
     links that lack them, so no version bump is needed. */
  deviceMode: DeviceMode;
  themeKey: string | null;
  activeTemplateId: string | null;
  headerBlocks: Block[];
  sidebarBlocks: Block[];
  blocks: Block[];
  footerBlocks: Block[];
  /* v:2 multi-page (lazy-additive, 2026-06-07). Present ONLY for genuinely
     multi-page canvases; single-page canvases omit these and encode as v:1 —
     byte-identical to the legacy schema, so old v:1 links stay evergreen.
     `blocks` always mirrors the ACTIVE page body, so a v:1 reader / the
     single-page render path keeps working. */
  pages?: Page[];
  activePageId?: string;
}

const DESIGN_SYSTEMS = new Set<DesignSystem>(["salt", "m3", "fluent", "uoaui", "carbon"]);
const MODES = new Set<BuilderMode>(["light", "dark"]);
const DEVICE_MODES = new Set<DeviceMode>(["desktop", "tablet", "mobile"]);

/* Legacy URL-safe base64 decoder — retained so share links generated
 * before LZ-String compression (raw base64 of the JSON, +/ → -_, no
 * padding) still decode. New links use compressToEncodedURIComponent. */
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
/* Depth guard for nested LayoutGroup children. MVP allows a single
   level of nesting (groups inside groups are out of scope), so a
   max depth of 2 accepts top-level blocks and their direct
   children. Anything deeper is truncated on sanitize. */
const MAX_BLOCK_DEPTH = 2;
const MAX_CHILDREN_PER_GROUP = 60;
/* v:2 multi-page caps — bound payload growth (pages × bodies) so a forged
   share URL can't balloon store state. ~3-5 pages of typical content stay
   well under the 12k URL cap after LZ compression; 50 is a defensive ceiling. */
const MAX_PAGES = 50;
const MAX_PAGE_NAME = 120;

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
 *  the 1-3 grid range so a malicious share can't break layout.
 *
 *  Recurses into nested `children` for LayoutGroup blocks so
 *  nested layouts round-trip through share URLs. Depth is capped to
 *  `MAX_BLOCK_DEPTH` (groups-in-groups are out of scope for MVP;
 *  anything deeper is dropped). */
function validateAndSanitizeBlock(b: unknown, depth = 1): Block | null {
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

  const out: Block = { id: blk.id, type: blk.type, props: cleanProps };

  /* Phase 3a: preserve provenance tag if present. Strict allowlist —
     unknown values are dropped silently so a malicious share can't
     ride an arbitrary string in here. Pre-Phase-3a payloads have no
     `source` field and round-trip unchanged. */
  if (isValidBlockSource(blk.source)) {
    out.source = blk.source;
  }

  /* Preserve layout metadata if present. The shape is a small
     key/value bag (width/min/max/grow/align/margin) so the generic
     sanitizer covers it cleanly. */
  if (blk.layout && typeof blk.layout === "object") {
    out.layout = sanitizeValue(blk.layout) as Block["layout"];
  }

  /* Recurse into nested children for LayoutGroup blocks. Past the
     depth guard the children are dropped rather than the whole
     block so malicious deep nesting can't turn into a payload
     rejection. Truncation is loud in dev so a legitimate deep
     or wide group surfaces rather than silently losing data. */
  if (Array.isArray(blk.children)) {
    if (depth < MAX_BLOCK_DEPTH) {
      const over = Math.max(0, blk.children.length - MAX_CHILDREN_PER_GROUP);
      if (over > 0 && process.env.NODE_ENV !== "production") {
        console.warn(
          `[shareState] LayoutGroup \"${out.id}\" has ${blk.children.length} children; truncating to ${MAX_CHILDREN_PER_GROUP}. ${over} dropped.`,
        );
      }
      const kids: Block[] = [];
      for (const c of blk.children.slice(0, MAX_CHILDREN_PER_GROUP)) {
        const cleanChild = validateAndSanitizeBlock(c, depth + 1);
        if (cleanChild) kids.push(cleanChild);
      }
      if (kids.length > 0) out.children = kids;
    } else if (blk.children.length > 0 && process.env.NODE_ENV !== "production") {
      console.warn(
        `[shareState] Block \"${out.id}\" at depth ${depth} exceeds MAX_BLOCK_DEPTH=${MAX_BLOCK_DEPTH}; ${blk.children.length} nested children dropped. (MVP supports one level of nesting only.)`,
      );
    }
  }

  return out;
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

/* compressToEncodedURIComponent emits A-Za-z0-9 plus `+ - $`. `+` and `$`
   are NOT safe in a URL *path* segment (the share hash lives at
   /preview/share/<hash>): a browser navigating to a path with a raw `+`
   404s the route. So we map the two offenders to unreserved chars that
   the LZ alphabet never produces — `+`→`_`, `$`→`~` — yielding a hash of
   only [A-Za-z0-9-_~], all RFC-3986 unreserved and path-safe. decode
   reverses it before decompressing. (Legacy base64 links used `-_`; the
   reverse is applied only on the LZ attempt, and the legacy fallback
   below still sees the raw hash, so those keep resolving.) */
/* Build the share payload from the current store state. Lazy-additive
   (owner decision 2026-06-07): a single-page canvas yields v:1 (byte-identical
   to the legacy schema, no pages); a genuinely multi-page canvas yields v:2
   with flushed pages + activePageId. flushActiveBody syncs the live `blocks`
   mirror into the active page so an in-progress edit isn't lost, and `blocks`
   always carries the active page body for v:1 readers / the single-page path. */
export function buildSharedCanvas(s: ReturnType<typeof useBuilder.getState>): SharedCanvas {
  const flushed = flushActiveBody(s);
  if (isMultiPage(flushed.pages)) {
    const active = flushed.pages.find((p) => p.id === flushed.activePageId);
    return {
      v: 2,
      designSystem: s.designSystem, mode: s.mode, density: s.density, canvasSpacing: s.canvasSpacing,
      deviceMode: s.deviceMode, themeKey: s.themeKey, activeTemplateId: s.activeTemplateId,
      headerBlocks: s.headerBlocks, sidebarBlocks: s.sidebarBlocks,
      blocks: active?.body ?? s.blocks, footerBlocks: s.footerBlocks,
      pages: flushed.pages, activePageId: flushed.activePageId,
    };
  }
  /* v:1 key order matches the legacy inline literal EXACTLY (blocks before
     footerBlocks) so a single-page canvas serializes byte-identically to the
     pre-multi-page hash — the lazy-additive guarantee. Do not spread a shared
     base object here: JSON.stringify preserves insertion order, so a reordered
     key set would change the hash for an unchanged canvas. */
  return {
    v: 1,
    designSystem: s.designSystem, mode: s.mode, density: s.density, canvasSpacing: s.canvasSpacing,
    deviceMode: s.deviceMode, themeKey: s.themeKey, activeTemplateId: s.activeTemplateId,
    headerBlocks: s.headerBlocks, sidebarBlocks: s.sidebarBlocks,
    blocks: s.blocks, footerBlocks: s.footerBlocks,
  };
}

export function encodeShareState(s: SharedCanvas): string {
  return compressToEncodedURIComponent(JSON.stringify(s))
    .replace(/\+/g, "_")
    .replace(/\$/g, "~");
}

/** Decode a share hash back to its JSON string. Tries the current
 *  LZ-String format first (reversing the path-safe char mapping); if
 *  that doesn't yield JSON, falls back to the legacy raw-base64 format
 *  (on the untouched hash) so links created before compression was
 *  introduced still resolve. */
function decodeShareHash(hash: string): string | null {
  try {
    const lz = decompressFromEncodedURIComponent(hash.replace(/_/g, "+").replace(/~/g, "$"));
    // A valid payload is a JSON object, so it must start with '{' (123).
    if (lz && lz.charCodeAt(0) === 123) return lz;
  } catch {
    /* fall through to the legacy decoder */
  }
  return urlSafeB64Decode(hash);
}

export function decodeShareState(hash: string): SharedCanvas | null {
  if (!hash || hash.length > 64 * 1024) return null; // hash string cap (loose)
  const json = decodeShareHash(hash);
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

  if (obj.v !== 1 && obj.v !== 2) return null;
  const version: 1 | 2 = obj.v === 2 ? 2 : 1;
  if (typeof obj.designSystem !== "string" || !DESIGN_SYSTEMS.has(obj.designSystem as DesignSystem)) return null;
  if (typeof obj.mode !== "string" || !MODES.has(obj.mode as BuilderMode)) return null;
  if (typeof obj.density !== "string" || obj.density.length > 40) return null;

  /* PR-C: deviceMode + themeKey. v1-compatible — a link that predates
     these fields (no deviceMode/themeKey) decodes with sane defaults
     rather than erroring, so existing shared URLs keep working without
     a version bump. An invalid deviceMode also falls back to desktop. */
  const deviceMode: DeviceMode =
    typeof obj.deviceMode === "string" && DEVICE_MODES.has(obj.deviceMode as DeviceMode)
      ? (obj.deviceMode as DeviceMode)
      : "desktop";
  const themeKey: string | null =
    typeof obj.themeKey === "string" && obj.themeKey.length <= 40 ? obj.themeKey : null;
  /* canvasSpacing: defaults to 'tight' (the store default) for links that
     predate the field or carry anything other than the two valid values. */
  const canvasSpacing: 'tight' | 'comfortable' =
    obj.canvasSpacing === 'comfortable' ? 'comfortable' : 'tight';

  const activeTemplateId =
    typeof obj.activeTemplateId === "string" && obj.activeTemplateId.length <= 80
      ? obj.activeTemplateId
      : null;

  const headerBlocks  = validateAndSanitizeBlockArray(obj.headerBlocks);
  const sidebarBlocks = validateAndSanitizeBlockArray(obj.sidebarBlocks);
  const blocks        = validateAndSanitizeBlockArray(obj.blocks);
  const footerBlocks  = validateAndSanitizeBlockArray(obj.footerBlocks);

  if (!headerBlocks || !sidebarBlocks || !blocks || !footerBlocks) return null;

  /* v:2 multi-page payload: validate + sanitize each page body, cap the page
     count, and guard a stale/absent activePageId by falling back to the first
     page. A v:2 link missing/empty `pages` is malformed → reject (don't silently
     downgrade). v:1 links have no pages and decode exactly as before. */
  let pages: Page[] | undefined;
  let activePageId: string | undefined;
  if (version === 2) {
    if (!Array.isArray(obj.pages) || obj.pages.length === 0 || obj.pages.length > MAX_PAGES) return null;
    const validated: Page[] = [];
    for (const p of obj.pages) {
      if (typeof p !== "object" || p === null) return null;
      const pg = p as Record<string, unknown>;
      if (typeof pg.id !== "string" || pg.id.length === 0 || pg.id.length > 120) return null;
      const name = typeof pg.name === "string" && pg.name.length <= MAX_PAGE_NAME ? pg.name : "Page";
      const body = validateAndSanitizeBlockArray(pg.body);
      if (!body) return null;
      const page: Page = { id: pg.id, name, body: migrateBlocks(body) };
      if (pg.bodyLayout && typeof pg.bodyLayout === "object") {
        const bl = sanitizeValue(pg.bodyLayout) as Record<string, unknown> | null;
        /* Clamp the layout numerics. v:2 is the FIRST attacker-reachable path
           that carries zone-layout numbers (the prior share schema had none):
           an unbounded columns/gap/padding from a forged hash would emit
           repeat(1e6, 1fr) etc. into the recipient's grid — a layout bomb.
           Mirror the colSpan clamp; 1-12 columns matches the documented range. */
        if (bl) {
          if (bl.columns != null) bl.columns = Math.max(1, Math.min(12, Math.floor(Number(bl.columns)) || 1));
          for (const k of ["gap", "padding", "size"]) {
            if (bl[k] != null) bl[k] = Math.max(0, Math.min(2000, Number(bl[k]) || 0));
          }
        }
        page.bodyLayout = bl as unknown as Page["bodyLayout"];
      }
      validated.push(page);
    }
    pages = validated;
    activePageId =
      typeof obj.activePageId === "string" && validated.some((p) => p.id === obj.activePageId)
        ? obj.activePageId
        : validated[0].id;
  }

  /* For v:2, `blocks` is the active page's body (keeps the legacy field + the
     single-page render path consistent); for v:1 it's the decoded blocks. */
  const activeBody =
    pages && activePageId ? pages.find((p) => p.id === activePageId)!.body : migrateBlocks(blocks);

  return {
    v: version,
    designSystem: obj.designSystem as DesignSystem,
    mode: obj.mode as BuilderMode,
    density: obj.density,
    canvasSpacing,
    deviceMode,
    themeKey,
    activeTemplateId,
    headerBlocks: migrateBlocks(headerBlocks),
    sidebarBlocks: migrateBlocks(sidebarBlocks),
    blocks: activeBody,
    footerBlocks: migrateBlocks(footerBlocks),
    ...(pages ? { pages, activePageId } : {}),
  };
}

/** Build a share URL from the current client-side state.
 *  Returns { url, tooLong } - tooLong is true when the URL exceeds
 *  a platform-friendly cap (12000 chars); caller should warn user.
 *  Now that the payload is LZ-String-compressed (was raw base64 at a
 *  conservative 3500) the cap can be generous: mainstream channels
 *  (browser, Slack, email, clipboard) handle 12k+ char URLs easily,
 *  and a heavy ~20KB-JSON enriched canvas compresses to ~7.8k chars,
 *  so realistic builds no longer trip "Too large to share". */
export function buildShareUrl(state: SharedCanvas): { url: string; tooLong: boolean; hash: string } {
  const hash = encodeShareState(state);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/preview/share/${hash}`;
  return { url, tooLong: url.length > 12000, hash };
}
