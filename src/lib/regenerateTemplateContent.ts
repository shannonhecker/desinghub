/**
 * Client-side helper that asks /api/builder/generate-content for fresh
 * mock data and applies the returned patches to the current block list.
 *
 * Kept as a plain function (not a hook) because it's invoked from
 * event handlers and operates on the Zustand store imperatively.
 */

import { useBuilder, type Block } from "@/store/useBuilder";

interface ContentPatch {
  id: string;
  props: Record<string, unknown>;
}

/**
 * Forbidden keys: regen must never change visual structure. The server
 * already enforces this but we strip defensively in case the model drifts.
 */
const FORBIDDEN_KEYS = new Set([
  "colSpan",
  "defaultOn",
  "defaultChecked",
  "presence",
  "size",
  "variant",
  "level",
  "icon",
  "active",
  "showIcon",
  "chartType",
  "status",
]);

const MAX_PROP_STRING_LENGTH = 2000;

/**
 * Render-safe value sanitizer - identical in spirit to the one in
 * shareState.ts. We don't share the function to avoid coupling but
 * the rules match: only JSON primitives, shallow arrays, shallow
 * objects. Defense in depth against a hallucinated prop shape.
 */
function sanitizePropValue(v: unknown, depth = 0): unknown {
  if (depth > 2) return null;
  if (v === null) return null;
  if (typeof v === "string") return v.length > MAX_PROP_STRING_LENGTH ? v.slice(0, MAX_PROP_STRING_LENGTH) : v;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "boolean") return v;
  if (Array.isArray(v)) return v.slice(0, 20).map((x) => sanitizePropValue(x, depth + 1));
  if (typeof v === "object") {
    const out: Record<string, unknown> = {};
    let n = 0;
    for (const [k, val] of Object.entries(v)) {
      if (n >= 20) break;
      if (typeof k !== "string" || k.length > 80) continue;
      out[k] = sanitizePropValue(val, depth + 1);
      n++;
    }
    return out;
  }
  return null; // functions, symbols, bigints - drop
}

function stripForbidden(props: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    if (typeof key !== "string" || key.length > 80) continue;
    clean[key] = sanitizePropValue(value);
  }
  return clean;
}

function applyPatches(blocks: Block[], patches: ContentPatch[]): Block[] {
  if (patches.length === 0) return blocks;
  const byId = new Map(patches.map((p) => [p.id, p]));
  return blocks.map((b) => {
    const patch = byId.get(b.id);
    if (!patch) return b;
    return { ...b, props: { ...b.props, ...stripForbidden(patch.props) } };
  });
}

export interface RegenResult {
  ok: boolean;
  patched: number;
  error?: string;
}

/**
 * Regenerate content for the current template. Applies patches to body,
 * header, sidebar, and footer block arrays in-place via the store.
 */
export async function regenerateTemplateContent(
  templateId: string,
): Promise<RegenResult> {
  const store = useBuilder.getState();
  const { blocks, headerBlocks, sidebarBlocks, footerBlocks } = store;
  const all = [...headerBlocks, ...sidebarBlocks, ...blocks, ...footerBlocks];
  if (all.length === 0) {
    return { ok: false, patched: 0, error: "No blocks to regenerate." };
  }

  // Send a trimmed payload - server expects { id, type, props }
  const payload = all.map((b) => ({ id: b.id, type: b.type, props: b.props }));

  try {
    const basePath =
      (typeof window !== "undefined" &&
        (window as unknown as Record<string, Record<string, string>>).__NEXT_DATA__?.basePath) ||
      "";
    const res = await fetch(`${basePath}/api/builder/generate-content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId, blocks: payload }),
    });

    if (!res.ok) {
      let errorMsg = `Server returned ${res.status}`;
      try {
        const errBody = (await res.json()) as { error?: string };
        if (errBody.error) errorMsg = errBody.error;
      } catch {
        // ignore parse errors
      }
      return { ok: false, patched: 0, error: errorMsg };
    }

    const data = (await res.json()) as { patches?: ContentPatch[] };
    const patches = data.patches ?? [];
    if (patches.length === 0) {
      return { ok: true, patched: 0 };
    }

    // Apply patches to each zone - patches can target any block id
    const nextHeader = applyPatches(headerBlocks, patches);
    const nextSidebar = applyPatches(sidebarBlocks, patches);
    const nextBody = applyPatches(blocks, patches);
    const nextFooter = applyPatches(footerBlocks, patches);

    useBuilder.setState({
      headerBlocks: nextHeader,
      sidebarBlocks: nextSidebar,
      blocks: nextBody,
      footerBlocks: nextFooter,
    });

    useBuilder.getState().bumpPreview();

    return { ok: true, patched: patches.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { ok: false, patched: 0, error: msg };
  }
}
