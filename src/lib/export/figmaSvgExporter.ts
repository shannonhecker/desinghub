/**
 * Export the LIVE rendered canvas as a pixel-accurate, Figma-editable SVG.
 *
 * Unlike svgExporter.ts (store-based, always works), this walks the actual
 * rendered DOM: it finds the mounted canvas root, recursively measures every
 * element with getBoundingClientRect() + getComputedStyle(), and serialises to
 * one absolutely-positioned SVG of <rect>/<text> (+ inline Highcharts <svg>).
 * Figma imports that natively as editable vector layers — drag the .svg onto a
 * Figma canvas, no plugin.
 *
 * It needs the canvas MOUNTED + visible (open Preview / Present mode first), so
 * it returns `null` when no canvas is found; the caller shows a guard message.
 *
 * Selectors are the REAL live-canvas roots (the design's `.dashboard-layout`
 * only exists in EXPORT output, never in the live DOM): the present-stage
 * viewport wrapping `.bp-dashboard` (PresentStage.tsx + PreviewPanel.tsx), the
 * viewport alone, then the bare `.bp-dashboard` (the in-app preview side panel).
 */

const CANVAS_SELECTORS = [
  ".present-stage-viewport .bp-dashboard",
  ".present-stage-viewport",
  ".bp-dashboard",
];

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rgbaToHexA(c: string): { hex: string; opacity: number } | null {
  if (!c || c === "transparent" || c === "rgba(0, 0, 0, 0)") return null;
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = "1"] = m[1].split(",").map((v) => v.trim());
  const h = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return { hex: `#${h(+r)}${h(+g)}${h(+b)}`, opacity: parseFloat(a) };
}

/* Local serialisation node. Renamed from the design's `Node` so it never
   shadows the DOM `Node` global (used below for Node.TEXT_NODE). */
interface SvgNode {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: { hex: string; opacity: number } | null;
  stroke: { hex: string; opacity: number } | null;
  strokeW: number;
  radius: number;
  text?: { value: string; color: string; size: number; weight: string; family: string; align: string };
  blockId?: string;
  zone?: string;
}

/* Return the element's DIRECT text (not descendants') so we emit one <text>
   per text run instead of per-character span. */
function hasDirectText(el: Element): string | null {
  let t = "";
  el.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) t += n.textContent || "";
  });
  t = t.trim();
  return t.length ? t : null;
}

function collect(el: Element, originX: number, originY: number, out: SvgNode[]): void {
  const cs = getComputedStyle(el);
  if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) return;
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) {
    /* Zero-box wrapper (e.g. a fragment) — still recurse for children. */
    Array.from(el.children).forEach((c) => collect(c, originX, originY, out));
    return;
  }

  /* A Highcharts (or any) SVG: capture it verbatim as a nested <svg> via the
     __SVG__ marker; do not descend into chart internals. */
  if (el.tagName.toLowerCase() === "svg") {
    out.push({
      x: r.left - originX, y: r.top - originY, w: r.width, h: r.height,
      fill: null, stroke: null, strokeW: 0, radius: 0,
      blockId: el.closest("[data-block-id]")?.getAttribute("data-block-id") || undefined,
      text: { value: "__SVG__" + el.outerHTML, color: "", size: 0, weight: "", family: "", align: "" },
    });
    return;
  }

  const fill = rgbaToHexA(cs.backgroundColor);
  const stroke = cs.borderTopWidth !== "0px" ? rgbaToHexA(cs.borderTopColor) : null;
  const radius = parseFloat(cs.borderTopLeftRadius) || 0;
  const txt = hasDirectText(el);

  out.push({
    x: r.left - originX, y: r.top - originY, w: r.width, h: r.height,
    fill, stroke, strokeW: stroke ? parseFloat(cs.borderTopWidth) : 0, radius,
    blockId: el.getAttribute("data-block-id") || undefined,
    zone: el.getAttribute("data-zone") || undefined,
    text: txt
      ? {
          value: txt,
          color: cs.color,
          size: parseFloat(cs.fontSize),
          weight: cs.fontWeight,
          family: cs.fontFamily.split(",")[0].replace(/['"]/g, "").trim(),
          align: cs.textAlign,
        }
      : undefined,
  });
  if (txt) return; // leaf text run — don't descend (avoids per-glyph spans)
  Array.from(el.children).forEach((c) => collect(c, originX, originY, out));
}

/* Sanitise a captured chart <svg> before embedding: strip foreignObject /
   script / style and inline event-handler attributes so the exported file is
   valid, safe SVG (Figma rasterises foreignObject; raw handlers have no place
   in a static export). Exported for unit testing. */
export function sanitizeSvg(raw: string): string {
  return raw
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "");
}

function emit(n: SvgNode): string {
  const name = n.blockId
    ? ` data-name="${esc(n.blockId)}"`
    : n.zone
      ? ` data-name="zone-${esc(n.zone)}"`
      : "";

  /* Highcharts passthrough: embed the captured chart <svg> in place, sanitised
     so the output stays valid, safe SVG that Figma can import. */
  if (n.text?.value.startsWith("__SVG__")) {
    const raw = sanitizeSvg(n.text.value.slice(7));
    return `  <g transform="translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})"${name}>${raw}</g>`;
  }

  const parts: string[] = [];
  if (n.fill || n.stroke) {
    const f = n.fill ? `fill="${n.fill.hex}" fill-opacity="${n.fill.opacity}"` : `fill="none"`;
    const st = n.stroke
      ? `stroke="${n.stroke.hex}" stroke-opacity="${n.stroke.opacity}" stroke-width="${n.strokeW}"`
      : "";
    parts.push(
      `  <rect x="${n.x.toFixed(1)}" y="${n.y.toFixed(1)}" width="${n.w.toFixed(1)}" height="${n.h.toFixed(1)}" rx="${n.radius}" ${f} ${st}${name}/>`,
    );
  }
  if (n.text) {
    const t = n.text;
    const tc = rgbaToHexA(t.color);
    const anchor = t.align === "center" ? "middle" : t.align === "right" ? "end" : "start";
    const tx = anchor === "middle" ? n.x + n.w / 2 : anchor === "end" ? n.x + n.w : n.x;
    parts.push(
      `  <text x="${tx.toFixed(1)}" y="${(n.y + t.size).toFixed(1)}" font-family="${esc(t.family)}" font-size="${t.size}" font-weight="${t.weight}" fill="${tc?.hex || "#000"}" text-anchor="${anchor}">${esc(t.value)}</text>`,
    );
  }
  return parts.join("\n");
}

/**
 * Serialise the live canvas to SVG, or `null` when no canvas is mounted (caller
 * shows "Open Preview first, then export to Figma").
 */
export function exportFigmaSvg(): string | null {
  if (typeof document === "undefined") return null;

  let root: Element | null = null;
  for (const sel of CANVAS_SELECTORS) {
    root = document.querySelector(sel);
    if (root) break;
  }
  if (!root) return null;

  const rr = root.getBoundingClientRect();
  if (rr.width === 0 || rr.height === 0) return null;

  const nodes: SvgNode[] = [];
  collect(root, rr.left, rr.top, nodes);
  const body = nodes.map(emit).filter(Boolean).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${rr.width.toFixed(0)}" height="${rr.height.toFixed(0)}" viewBox="0 0 ${rr.width.toFixed(0)} ${rr.height.toFixed(0)}">
${body}
</svg>`;
}
