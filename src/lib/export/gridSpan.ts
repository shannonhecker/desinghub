import type { Block } from "@/store/useBuilder";

/* ──────────────────────────────────────────────────────────────
   spanOf — the SINGLE source of a block's canonical 12-fr column
   span for grid export. Shared by reactExporter, htmlExporter (and
   viteExporter) so every runnable exporter emits the SAME span for
   the same saved block. Until that parity holds, no new grid
   placement field may ship (the P3 export-parity gate).

   "Nfr" -> N; "X%" -> proportional of 12; fill/auto/px/undefined ->
   full row (12, which normalizeColumns maps to the DS's full native
   width). Spans stay RELATIVE so the container-level mobile collapse
   keeps reflowing them.
   ────────────────────────────────────────────────────────────── */
export function spanOf(block: Block): number {
  const w = block.layout?.width;
  if (typeof w === "string") {
    if (w.endsWith("fr")) {
      const n = parseFloat(w);
      if (Number.isFinite(n)) return n;
    }
    if (w.endsWith("%")) {
      const pct = parseFloat(w);
      if (Number.isFinite(pct)) return Math.max(1, Math.round((pct / 100) * 12));
    }
  }
  return 12;
}

/* startOf — the canonical-12 column-START line for a block (P3-3), or undefined
   for an auto-placed block. The start-line analog of spanOf: gridCol is stored
   canonical-12, so read it verbatim, coercing a missing / non-finite value to
   undefined (= no pin). Each exporter maps it to its own resolution via
   normalizeColumnStart and clamps against the block's span, so html / react /
   vite stay byte-identical — the same parity contract spanOf holds for span. */
export function startOf(block: Block): number | undefined {
  const c = block.layout?.gridCol;
  return typeof c === "number" && Number.isFinite(c) ? c : undefined;
}
