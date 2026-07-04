/* P3-3 grid column-coordinate conversions. gridCol is STORED as a DS-agnostic
   canonical-12 line, but the inspector control shows it in the user's ACTUAL
   grid resolution (the zone's 6/8/12/16 column count) so "Column start 5" means
   the 5th of the columns they see. These two pure helpers are the proportional
   map both directions; they reuse the same model as normalizeColumnStart so the
   control, the canvas, and every exporter agree. At cols === 12 both are the
   identity. */

/* Display column (1..cols, what the user sees) -> canonical-12 line (stored). */
export function toCanonicalColumn(displayCol: number, cols: number): number {
  if (cols <= 0) return 1;
  const canonical = Math.round(((displayCol - 1) / cols) * 12) + 1;
  return Math.max(1, Math.min(12, canonical));
}

/* Canonical-12 line (stored) -> display column (1..cols, shown in the control). */
export function toDisplayColumn(canonical: number, cols: number): number {
  if (cols <= 0) return 1;
  const display = Math.round(((canonical - 1) / 12) * cols) + 1;
  return Math.max(1, Math.min(cols, display));
}
