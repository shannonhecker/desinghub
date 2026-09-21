/**
 * canvasHandoff - the ONE implementation of "hand this canvas to someone":
 * copy a share link, or download the canvas as JSON.
 *
 * Before this module the share-link flow was copy-pasted into BuilderApp
 * (top-bar Export menu), PresentBar (Present mode) and PreviewPanel (dead
 * since share/download moved to the Export menu), and PreviewPanel's dead
 * JSON download serialised only DS/mode/density with no blocks at all.
 * One module means every surface hands off the same payload.
 */

import { useBuilder, flushActiveBody, isMultiPage } from "@/store/useBuilder";
import type { Block, Page, ZoneId, ZoneLayout } from "@/store/useBuilder";
import { buildShareUrl, buildSharedCanvas } from "./shareState";

export type ShareLinkResult = "copied" | "too-long" | "error";

/** How long each result should stay on screen before a button resets. */
export const SHARE_FEEDBACK_MS: Record<ShareLinkResult, number> = {
  copied: 2000,
  "too-long": 3000,
  error: 2500,
};

/** Encode the current canvas as a stateless share URL and copy it. */
export async function copyShareLink(): Promise<ShareLinkResult> {
  const s = useBuilder.getState();
  /* buildSharedCanvas picks v:1 (single-page) or v:2 (multi-page) and flushes
     the active page body so an in-progress edit travels with the link. */
  const { url, tooLong } = buildShareUrl(buildSharedCanvas(s));
  if (tooLong) return "too-long";
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "error";
  }
}

/** Full canvas state snapshot. Chat transcript is intentionally excluded:
 *  this is the design, not the conversation. */
export interface CanvasExportJson {
  designSystem: string;
  mode: string;
  density: string;
  themeKey: string | null;
  interfaceType: string;
  selectedComponents: string[];
  colorOverrides: Record<string, string>;
  zoneLayouts: Record<ZoneId, ZoneLayout>;
  headerBlocks: Block[];
  sidebarBlocks: Block[];
  blocks: Block[];
  footerBlocks: Block[];
  /** Present only for multi-page canvases (lazy-additive, like persistence). */
  pages?: Page[];
  activePageId?: string;
  generatedAt: string;
}

type BuilderStateSnapshot = ReturnType<typeof useBuilder.getState>;

/** Pure: build the JSON payload from store state. */
export function buildCanvasExportJson(
  s: BuilderStateSnapshot,
  now: Date = new Date(),
): CanvasExportJson {
  const out: CanvasExportJson = {
    designSystem: s.designSystem,
    mode: s.mode,
    density: s.density,
    themeKey: s.themeKey ?? null,
    interfaceType: s.interfaceType,
    selectedComponents: s.selectedComponents,
    colorOverrides: s.colorOverrides,
    zoneLayouts: s.zoneLayouts,
    headerBlocks: s.headerBlocks,
    sidebarBlocks: s.sidebarBlocks,
    blocks: s.blocks,
    footerBlocks: s.footerBlocks,
    generatedAt: now.toISOString(),
  };
  const flushed = flushActiveBody(s);
  if (isMultiPage(flushed.pages)) {
    out.pages = flushed.pages;
    out.activePageId = flushed.activePageId;
    out.blocks = flushed.pages.find((p) => p.id === flushed.activePageId)?.body ?? s.blocks;
  }
  return out;
}

export function canvasJsonFilename(s: Pick<BuilderStateSnapshot, "interfaceType" | "designSystem">): string {
  return `${s.interfaceType}-${s.designSystem}-canvas.json`;
}

/** Trigger a browser download of the canvas JSON. */
export function downloadCanvasJson(): void {
  const s = useBuilder.getState();
  const payload = buildCanvasExportJson(s);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = canvasJsonFilename(s);
  a.click();
  URL.revokeObjectURL(url);
}
