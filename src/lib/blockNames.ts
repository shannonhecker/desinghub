import { LIBRARY_BLUEPRINTS } from "@/lib/blockRegistry";

/* Plain name for a block type: the library's label in sentence case
   ("Stat card", "Area chart"); all-caps words (FX, KPI) keep their case; a
   type without a library entry is split on its capitals. Shared by the
   inspector's title and the chat's "Editing ..." chip. */
export function plainBlockName(type: string): string {
  const label = LIBRARY_BLUEPRINTS.find((b) => b.type === type)?.label
    ?? type.replace(/^Simulated/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
  return label
    .split(" ")
    .map((w, i) => (i === 0 || /^[A-Z0-9]{2,}$/.test(w) ? w : w.toLowerCase()))
    .join(" ");
}
