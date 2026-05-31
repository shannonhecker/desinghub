/**
 * ComponentAPIRegistry (roadmap P2) — the single source of truth that turns a
 * builder block into REAL design-system component JSX, sourced from each DS's
 * official API. Replaces reactExporter's generic `className="btn"` pseudocode
 * so generated code actually imports + uses the real components.
 *
 * Seeded with Salt DS (the most complete in-repo API, src/data/salt). Other
 * DSs intentionally return null until added with their verified official API —
 * we never fabricate an API. Salt facts are sourced from the official
 * @salt-ds/core surface (sentiment/appearance enums, FormField composition).
 */

export type SystemId = "salt" | "m3" | "fluent" | "carbon" | "uoaui";

export interface ComponentApiEntry {
  /** The real import this block needs from the DS package. */
  imports: { from: string; names: string[] };
  /** Render the real DS-component JSX string for a builder block's props. */
  toJsx: (props: Record<string, unknown>) => string;
}

const s = (v: unknown, fallback = ""): string => String(v ?? fallback);

/* Generic block `variant` -> Salt's official sentiment + appearance.
   Salt API: sentiment = accented|neutral|positive|caution|negative,
   appearance = solid|bordered|transparent (NOT filled/outlined/text). */
function saltButtonAttrs(props: Record<string, unknown>): string {
  const variant = s(props.variant, "primary");
  const map: Record<string, { sentiment: string; appearance: string }> = {
    primary: { sentiment: "accented", appearance: "solid" },
    secondary: { sentiment: "neutral", appearance: "bordered" },
    outline: { sentiment: "neutral", appearance: "bordered" },
    ghost: { sentiment: "neutral", appearance: "transparent" },
    danger: { sentiment: "negative", appearance: "solid" },
    destructive: { sentiment: "negative", appearance: "solid" },
  };
  const { sentiment, appearance } = map[variant] ?? map.primary;
  return `sentiment="${sentiment}" appearance="${appearance}"`;
}

const SALT: Record<string, ComponentApiEntry> = {
  SimulatedButton: {
    imports: { from: "@salt-ds/core", names: ["Button"] },
    toJsx: (p) => `<Button ${saltButtonAttrs(p)}>${s(p.label, "Button")}</Button>`,
  },
  SimulatedTextInput: {
    imports: { from: "@salt-ds/core", names: ["FormField", "FormFieldLabel", "Input"] },
    toJsx: (p) =>
      `<FormField>\n  <FormFieldLabel>${s(p.label, "Label")}</FormFieldLabel>\n  <Input placeholder="${s(p.placeholder)}" />\n</FormField>`,
  },
  SimulatedCheckbox: {
    imports: { from: "@salt-ds/core", names: ["Checkbox"] },
    toJsx: (p) => `<Checkbox label="${s(p.label)}"${p.defaultChecked ? " defaultChecked" : ""} />`,
  },
  SimulatedSwitch: {
    imports: { from: "@salt-ds/core", names: ["Switch"] },
    toJsx: (p) => `<Switch label="${s(p.label)}"${p.defaultOn ? " defaultChecked" : ""} />`,
  },
  SimulatedCard: {
    imports: { from: "@salt-ds/core", names: ["Card"] },
    toJsx: (p) => `<Card>\n  <h3>${s(p.title, "Card")}</h3>\n  <p>${s(p.content)}</p>\n</Card>`,
  },
};

/* Per-DS registries. Only Salt is seeded; other DSs return null so the
   exporter can fall back / mark the block unsupported rather than emit a
   fabricated (wrong) API. */
const REGISTRY: Partial<Record<SystemId, Record<string, ComponentApiEntry>>> = {
  salt: SALT,
};

export function resolveComponentApi(system: SystemId, blockType: string): ComponentApiEntry | null {
  return REGISTRY[system]?.[blockType] ?? null;
}

export function blockToRealJsx(
  system: SystemId,
  block: { type: string; props?: Record<string, unknown> },
): string | null {
  const entry = resolveComponentApi(system, block.type);
  return entry ? entry.toJsx(block.props ?? {}) : null;
}

/** Deduped, sorted import statements (one per package) for a set of block types. */
export function collectImports(system: SystemId, blockTypes: string[]): string[] {
  const byPkg = new Map<string, Set<string>>();
  for (const t of blockTypes) {
    const entry = resolveComponentApi(system, t);
    if (!entry) continue;
    const set = byPkg.get(entry.imports.from) ?? new Set<string>();
    entry.imports.names.forEach((n) => set.add(n));
    byPkg.set(entry.imports.from, set);
  }
  return [...byPkg.entries()].map(
    ([from, names]) => `import { ${[...names].sort().join(", ")} } from "${from}";`,
  );
}
