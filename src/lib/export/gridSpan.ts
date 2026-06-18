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
