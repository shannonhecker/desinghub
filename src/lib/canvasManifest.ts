/**
 * canvasManifest - a compact, bounded description of what is on the canvas,
 * sent to the model on every chat turn.
 *
 * Before this, the per-turn context carried the design system, mode, density
 * and (only when the user had clicked one) the selected block. Nothing else
 * on the canvas had an id the model could see, so "move the table up" or
 * "delete the second chart" could not resolve to a block and silently did
 * nothing. The manifest lists every block per zone with its real id, type
 * and a one-line summary, plus each zone's flow mode, so block-targeting
 * actions can name real ids and positions.
 *
 * Shape (one zone per line, blocks in order, `|`-separated):
 *
 *   zones: body=grid/4 header=row sidebar=stack footer=row
 *   header: tpl-brand AppBrand "Acme" | tpl-status StatusPill "Live"
 *   body: b1 SimulatedTitle "Sales" | b2 HighchartLine "Revenue" w=66.666% | ...
 *
 * Bounded: at most MAX_BLOCKS blocks and MAX_CHARS characters, so a large
 * canvas degrades to "... +N more" instead of blowing the token budget.
 * Never contains a newline inside a block entry or a "]" followed by a blank
 * line, so the `[Current state: ...]` prefix stripper still matches.
 */

import type { Block, Page, ZoneId, ZoneLayout } from "@/store/useBuilder";

export interface ManifestSource {
  blocks: Block[];
  headerBlocks: Block[];
  sidebarBlocks: Block[];
  footerBlocks: Block[];
  zoneLayouts: Record<ZoneId, ZoneLayout>;
  pages?: Page[];
  activePageId?: string | null;
}

export const MANIFEST_MAX_BLOCKS = 80;
export const MANIFEST_MAX_CHARS = 4000;
const SUMMARY_MAX = 28;
const ZONE_ORDER: ZoneId[] = ["header", "sidebar", "body", "footer"];
const SUMMARY_KEYS = ["label", "title", "text", "name", "placeholder", "message", "initials"] as const;

/** One printable line fragment for a block; never contains newlines. */
export function summarizeBlock(b: Block): string {
  const parts: string[] = [b.id, b.type];
  const props = b.props ?? {};
  for (const key of SUMMARY_KEYS) {
    const v = props[key];
    if (typeof v === "string" && v.trim()) {
      parts.push(`"${clip(v)}"`);
      break;
    }
  }
  if (b.type === "SimulatedDataTable" && Array.isArray(props.rows)) {
    parts.push(`${props.rows.length} rows`);
  }
  if (b.type === "NavItem" && props.active) parts.push("active");
  const w = b.layout?.width;
  if (w !== undefined && w !== null) parts.push(`w=${String(w)}`);
  if (b.type === "LayoutGroup" && Array.isArray(b.children) && b.children.length) {
    parts.push(`[${b.children.map((c) => `${c.id} ${c.type}`).join(", ")}]`);
  }
  return parts.join(" ").replace(/[\r\n]+/g, " ");
}

function clip(s: string): string {
  const one = s.replace(/\s+/g, " ").trim();
  return one.length > SUMMARY_MAX ? `${one.slice(0, SUMMARY_MAX - 1)}…` : one;
}

function zoneMode(z: ZoneLayout | undefined): string {
  if (!z) return "stack";
  return z.mode === "grid" && z.columns ? `grid/${z.columns}` : z.mode;
}

/** Build the manifest text. Pure; safe to call from tests and the client. */
export function buildCanvasManifest(
  s: ManifestSource,
  limits: { maxBlocks?: number; maxChars?: number } = {},
): string {
  const maxBlocks = limits.maxBlocks ?? MANIFEST_MAX_BLOCKS;
  const maxChars = limits.maxChars ?? MANIFEST_MAX_CHARS;
  const zoneBlocks: Record<ZoneId, Block[]> = {
    header: s.headerBlocks ?? [],
    sidebar: s.sidebarBlocks ?? [],
    body: s.blocks ?? [],
    footer: s.footerBlocks ?? [],
  };

  const lines: string[] = [];
  const zonesLine = ZONE_ORDER.map((z) => `${z}=${zoneMode(s.zoneLayouts?.[z])}`).join(" ");
  lines.push(`zones: ${zonesLine}`);

  if (s.pages && s.pages.length > 1) {
    lines.push(
      `pages: ${s.pages.map((p) => `${p.id} "${clip(p.name)}"${p.id === s.activePageId ? " (active)" : ""}`).join(", ")}`,
    );
  }

  let emitted = 0;
  let omitted = 0;
  for (const zone of ZONE_ORDER) {
    const arr = zoneBlocks[zone];
    if (arr.length === 0) {
      lines.push(`${zone}: (empty)`);
      continue;
    }
    const entries: string[] = [];
    for (const b of arr) {
      if (emitted >= maxBlocks) {
        omitted++;
        continue;
      }
      entries.push(summarizeBlock(b));
      emitted++;
    }
    lines.push(`${zone}: ${entries.join(" | ")}`);
  }
  if (omitted > 0) lines.push(`... +${omitted} more blocks not listed`);

  let out = lines.join("\n");
  if (out.length > maxChars) {
    out = `${out.slice(0, maxChars - 20).replace(/[^\n]*$/, "")}\n... (manifest truncated)`;
  }
  return out;
}
