/**
 * Export the builder canvas as a downloadable, Figma-editable SVG.
 *
 * STORE-based (useBuilder.getState()) and dependency-free — it never touches
 * the DOM, so it always works (Preview open or not, SSR-safe, deterministic).
 * Same getState() read + four-zone walk as htmlExporter.ts / reactExporter.ts.
 *
 * It emits a real primitive SVG: a named <g> per zone, a named <g> per block
 * built from <rect>/<text>/<line>/<circle>/<polyline>, tinted with the active
 * DS accent. Figma natively imports those primitives as editable, regroupable
 * vector layers — there is NO <foreignObject> anywhere (Figma can't import it).
 *
 * Fidelity is wireframe / medium: it reproduces canvas REGIONS (header bar,
 * left sidebar, body card stack, footer bar) and component silhouettes, not the
 * live flex/grid layout (it does not re-run layoutResolver.ts). Colours are the
 * same STATIC per-DS hex constants the other exporters use, so per-block
 * colorOverrides and non-canonical themeKeys are not reflected. <text> does not
 * wrap — long strings are clipped with an ellipsis.
 */

import { useBuilder } from "@/store/useBuilder";
import type { Block } from "@/store/useBuilder";

/* Static per-DS accent — mirrors htmlExporter's `.btn-primary` map, plus the
   Carbon accent htmlExporter omits. Kept static (not live CSS vars) so the
   exporter stays dependency-free + SSR-safe, consistent with the other two. */
const DS_ACCENT: Record<string, string> = {
  salt: "#1B7F9E",
  m3: "#6750A4",
  fluent: "#0F6CBD",
  uoaui: "#8A58C9",
  carbon: "#0F62FE",
};

interface Palette {
  bg: string;
  fg: string;
  fgMuted: string;
  surface: string;
  border: string;
  accent: string;
}

function paletteFor(designSystem: string, mode: "light" | "dark"): Palette {
  const accent = DS_ACCENT[designSystem] ?? DS_ACCENT.salt;
  return mode === "dark"
    ? { bg: "#0b1120", fg: "#e8eaed", fgMuted: "#9aa0aa", surface: "#141b2b", border: "#2a3346", accent }
    : { bg: "#ffffff", fg: "#1a1a1a", fgMuted: "#6b7280", surface: "#f6f7f9", border: "#e2e5ea", accent };
}

/* ── Layout geometry (region grid) ──────────────────────────────────────── */
const CANVAS_W = 1280;
const PAD = 24;
const HEADER_H = 56;
const FOOTER_H = 44;
const SIDEBAR_W = 240;
const GAP = 16;
const SIDEBAR_ITEM_H = 40;
const TEXT_PAD = 14;

/* XML-escape for safe text/attribute interpolation. */
function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* Clip a string to a max char count, appending an ellipsis. SVG <text> does
   not wrap, so this is the honest fallback for long copy. */
function clip(s: string, max: number): string {
  const str = String(s);
  return str.length > max ? str.slice(0, Math.max(0, max - 1)) + "…" : str;
}

const CHART_TYPES = new Set<string>([
  "SimulatedChart", "HighchartLine", "HighchartArea", "HighchartColumn",
  "HighchartPie", "HighchartScatter", "HighchartBar", "HighchartDonut",
  "HighchartSpline", "HighchartStackedColumn", "HighchartGauge",
  "HighchartHeatmap", "HighchartTreemap",
]);

/* Estimated rendered height of a block at wireframe fidelity. Keeps the
   vertical stack honest without a DOM measure. */
function blockHeight(block: Block): number {
  switch (block.type) {
    case "SimulatedTitle": return 40;
    case "SimulatedButton": return 40;
    case "SimulatedBadge":
    case "StatusPill": return 28;
    case "SimulatedStatCard": return 96;
    case "SimulatedCard": return 110;
    case "Alert": return 72;
    case "SimulatedTextInput": return 64;
    case "LayoutGroup": {
      const kids = block.children ?? [];
      const inner = kids.reduce((acc, k) => acc + blockHeight(k) + GAP, 0);
      return Math.max(80, inner + TEXT_PAD * 2);
    }
    default:
      if (CHART_TYPES.has(block.type)) return 200;
      return 72;
  }
}

/* Draw one block as a named <g> of primitives at (x, y) with width w.
   `depth` guards against runaway recursion (one LayoutGroup level only). */
function drawBlock(block: Block, x: number, y: number, w: number, p: Palette, depth: number): string {
  const h = blockHeight(block);
  const props = block.props ?? {};
  const id = esc(`block-${block.type}-${block.id}`);
  const open = `    <g id="${id}">`;
  const close = `    </g>`;
  const maxChars = Math.max(8, Math.floor(w / 8));

  const surfaceRect = (rx = 8) =>
    `      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${p.surface}" stroke="${p.border}" stroke-width="1" />`;
  const text = (value: string, tx: number, ty: number, size: number, fill: string, weight = "400", anchor = "start") =>
    `      <text x="${tx}" y="${ty}" font-family="system-ui, -apple-system, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(clip(value, maxChars))}</text>`;

  switch (block.type) {
    case "SimulatedTitle":
      return [open, text(String(props.text ?? "Heading"), x, y + 26, 22, p.fg, "700"), close].join("\n");

    case "SimulatedButton":
      return [
        open,
        `      <rect x="${x}" y="${y}" width="${Math.min(160, w)}" height="${h}" rx="6" fill="${p.accent}" />`,
        text(String(props.label ?? "Button"), x + Math.min(160, w) / 2, y + h / 2 + 5, 14, "#ffffff", "500", "middle"),
        close,
      ].join("\n");

    case "SimulatedBadge":
    case "StatusPill":
      return [
        open,
        `      <rect x="${x}" y="${y}" width="${Math.min(110, w)}" height="${h}" rx="14" fill="${p.accent}" fill-opacity="0.18" stroke="${p.accent}" stroke-width="1" />`,
        text(String(props.label ?? "Badge"), x + 14, y + 19, 12, p.accent, "600"),
        close,
      ].join("\n");

    case "SimulatedStatCard":
      return [
        open,
        surfaceRect(),
        text(String(props.label ?? "Metric"), x + TEXT_PAD, y + 26, 13, p.fgMuted, "500"),
        text(String(props.value ?? "0"), x + TEXT_PAD, y + 58, 28, p.fg, "700"),
        `      <rect x="${x + TEXT_PAD}" y="${y + h - 22}" width="${w - TEXT_PAD * 2}" height="6" rx="3" fill="${p.border}" />`,
        `      <rect x="${x + TEXT_PAD}" y="${y + h - 22}" width="${Math.round((Number(props.pct) || 0) / 100 * (w - TEXT_PAD * 2))}" height="6" rx="3" fill="${p.accent}" />`,
        close,
      ].join("\n");

    case "SimulatedCard":
      return [
        open,
        surfaceRect(),
        text(String(props.title ?? "Card"), x + TEXT_PAD, y + 30, 16, p.fg, "600"),
        text(String(props.content ?? ""), x + TEXT_PAD, y + 56, 13, p.fgMuted),
        close,
      ].join("\n");

    case "Alert":
      return [
        open,
        `      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${p.surface}" stroke="${p.border}" stroke-width="1" />`,
        `      <rect x="${x}" y="${y}" width="4" height="${h}" rx="2" fill="${p.accent}" />`,
        text(String(props.title ?? "Alert"), x + TEXT_PAD, y + 28, 14, p.fg, "600"),
        text(String(props.message ?? ""), x + TEXT_PAD, y + 50, 13, p.fgMuted),
        close,
      ].join("\n");

    case "SimulatedTextInput":
      return [
        open,
        text(String(props.label ?? "Label"), x, y + 16, 13, p.fgMuted, "500"),
        `      <rect x="${x}" y="${y + 26}" width="${w}" height="34" rx="4" fill="${p.bg}" stroke="${p.border}" stroke-width="1" />`,
        text(String(props.placeholder ?? ""), x + 12, y + 48, 13, p.fgMuted),
        close,
      ].join("\n");

    case "NavItem":
      return [
        open,
        ...(props.active
          ? [`      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${p.accent}" fill-opacity="0.16" />`]
          : []),
        `      <circle cx="${x + 14}" cy="${y + h / 2}" r="5" fill="${props.active ? p.accent : p.fgMuted}" />`,
        text(String(props.label ?? "Nav"), x + 30, y + h / 2 + 5, 14, props.active ? p.accent : p.fg, props.active ? "600" : "400"),
        close,
      ].join("\n");

    case "AppBrand":
      return [open, text(String(props.label ?? "App"), x, y + 20, 16, p.fg, "700"), close].join("\n");

    case "FooterText":
      return [
        open,
        text(`${props.label ?? ""} ${props.version ?? ""}`.trim(), x + w / 2, y + 18, 12, p.fgMuted, "400", "middle"),
        close,
      ].join("\n");

    case "LayoutGroup": {
      const kids = depth < 1 ? (block.children ?? []) : [];
      let cy = y + TEXT_PAD;
      const childSvg: string[] = [];
      for (const kid of kids) {
        childSvg.push(drawBlock(kid, x + TEXT_PAD, cy, w - TEXT_PAD * 2, p, depth + 1));
        cy += blockHeight(kid) + GAP;
      }
      return [
        open,
        `      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="none" stroke="${p.border}" stroke-width="1" stroke-dasharray="4 4" />`,
        ...childSvg,
        close,
      ].join("\n");
    }

    default:
      /* Charts: a small bar-column silhouette regardless of sub-type. */
      if (CHART_TYPES.has(block.type)) {
        const bars: string[] = [];
        const innerX = x + TEXT_PAD;
        const innerW = w - TEXT_PAD * 2;
        const baseY = y + h - TEXT_PAD;
        const count = 6;
        const bw = (innerW / count) * 0.6;
        const heights = [0.5, 0.8, 0.4, 0.95, 0.65, 0.85];
        for (let i = 0; i < count; i++) {
          const bh = (h - TEXT_PAD * 2 - 24) * heights[i];
          const bx = innerX + (innerW / count) * i + ((innerW / count) - bw) / 2;
          bars.push(`      <rect x="${bx.toFixed(1)}" y="${(baseY - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="2" fill="${p.accent}" fill-opacity="${(0.55 + i * 0.06).toFixed(2)}" />`);
        }
        return [
          open,
          surfaceRect(),
          text(String(props.title ?? "Chart"), x + TEXT_PAD, y + 26, 14, p.fg, "600"),
          `      <line x1="${innerX}" y1="${baseY}" x2="${innerX + innerW}" y2="${baseY}" stroke="${p.border}" stroke-width="1" />`,
          ...bars,
          close,
        ].join("\n");
      }
      /* Honest labelled placeholder — shows the type name rather than vanishing. */
      return [
        open,
        `      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${p.surface}" stroke="${p.border}" stroke-width="1" stroke-dasharray="3 3" />`,
        text(block.type, x + TEXT_PAD, y + h / 2 + 5, 13, p.fgMuted, "500"),
        close,
      ].join("\n");
  }
}

/* Stack a zone's blocks vertically inside a named <g>. Returns the SVG plus the
   total height consumed (so the caller can place the next region). */
function drawZone(
  blocks: Block[],
  zoneName: string,
  x: number,
  y: number,
  w: number,
  p: Palette,
  itemHeightOverride?: number,
): { svg: string; height: number } {
  if (blocks.length === 0) return { svg: "", height: 0 };
  const inner: string[] = [];
  let cy = y;
  for (const block of blocks) {
    inner.push(drawBlock(block, x, cy, w, p, 0));
    cy += (itemHeightOverride ?? blockHeight(block)) + GAP;
  }
  const total = cy - y - GAP;
  const svg = `  <g id="zone-${zoneName}">\n${inner.join("\n")}\n  </g>`;
  return { svg, height: total };
}

export function exportSvg(): string {
  const s = useBuilder.getState();
  const mode: "light" | "dark" = s.mode === "dark" ? "dark" : "light";
  const p = paletteFor(s.designSystem, mode);

  /* P2 Frames: a removed peripheral frame (visible === false) is dropped from
     the wireframe too, so the SVG thumbnail matches the live canvas + export.
     visible === undefined defaults to shown (back-compat). Body never hides. */
  const showHeader = s.zoneLayouts?.header?.visible !== false && s.headerBlocks.length > 0;
  const showSidebar = s.zoneLayouts?.sidebar?.visible !== false && s.sidebarBlocks.length > 0;
  const showFooter = s.zoneLayouts?.footer?.visible !== false && s.footerBlocks.length > 0;

  /* Header bar — full width; blocks laid as a simple left-anchored row at a
     fixed row height (wireframe approximation of the live header flex). */
  let headerSvg = "";
  if (showHeader) {
    const items: string[] = [];
    let hx = PAD;
    for (const block of s.headerBlocks) {
      items.push(drawBlock(block, hx, (HEADER_H - 28) / 2, 200, p, 0));
      hx += 220;
    }
    headerSvg = `  <g id="zone-header">\n    <rect x="0" y="0" width="${CANVAS_W}" height="${HEADER_H}" fill="${p.surface}" />\n    <line x1="0" y1="${HEADER_H}" x2="${CANVAS_W}" y2="${HEADER_H}" stroke="${p.border}" stroke-width="1" />\n${items.join("\n")}\n  </g>`;
  }

  const bodyTop = (showHeader ? HEADER_H : 0) + PAD;

  /* Sidebar — left column, fixed-height nav rows. Drawn empty (height 0) when
     the frame is removed so the body reclaims the full width. */
  const sidebar = showSidebar
    ? drawZone(s.sidebarBlocks, "sidebar", PAD, bodyTop, SIDEBAR_W - PAD, p, SIDEBAR_ITEM_H)
    : { svg: "", height: 0 };

  /* Body — vertical card stack to the right of the sidebar. */
  const bodyX = (showSidebar ? SIDEBAR_W : 0) + PAD;
  const bodyW = CANVAS_W - bodyX - PAD;
  const body = drawZone(s.blocks, "body", bodyX, bodyTop, bodyW, p);

  const contentBottom = bodyTop + Math.max(sidebar.height, body.height);

  /* Footer — full-width bar pinned below content. */
  let footerSvg = "";
  let footerBottom = contentBottom;
  if (showFooter) {
    const footY = contentBottom + PAD;
    const items: string[] = [];
    let fx = PAD;
    for (const block of s.footerBlocks) {
      items.push(drawBlock(block, fx, footY + (FOOTER_H - 18) / 2 - 6, CANVAS_W - PAD * 2, p, 0));
      fx += 240;
    }
    footerSvg = `  <g id="zone-footer">\n    <rect x="0" y="${footY}" width="${CANVAS_W}" height="${FOOTER_H}" fill="${p.surface}" />\n    <line x1="0" y1="${footY}" x2="${CANVAS_W}" y2="${footY}" stroke="${p.border}" stroke-width="1" />\n${items.join("\n")}\n  </g>`;
    footerBottom = footY + FOOTER_H;
  }

  const canvasH = Math.max(footerBottom + PAD, 240);
  const zones = [headerSvg, sidebar.svg, body.svg, footerSvg].filter(Boolean).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${canvasH}" viewBox="0 0 ${CANVAS_W} ${canvasH}" data-ds="${esc(s.designSystem)}" data-mode="${esc(mode)}">
  <rect x="0" y="0" width="${CANVAS_W}" height="${canvasH}" fill="${p.bg}" />
${zones}
</svg>`;
}
