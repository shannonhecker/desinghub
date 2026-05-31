/**
 * ComponentAPIRegistry (roadmap P2) — the single source of truth that turns a
 * builder block into REAL design-system component JSX, sourced from each DS's
 * official API. Replaces reactExporter's generic `className="btn"` pseudocode
 * so generated code actually imports + uses the real components.
 *
 * Seeded with all five DSs: Salt, Material 3 (@mui/material), Fluent 2
 * (@fluentui/react-components), Carbon (@carbon/react), and uoaui — the in-house
 * DS, which has no npm package: it is className + --a-* token CSS, so it emits
 * a-* classNames + a side-effect stylesheet import rather than component imports.
 * We never fabricate an API; each DS's facts are sourced from its official
 * package surface (Salt sentiment/appearance, MUI variant/color, Fluent
 * appearance, Carbon kind/labelText, uoaui a-* classes) cross-checked against
 * src/data/<ds>.
 */

export type SystemId = "salt" | "m3" | "fluent" | "carbon" | "uoaui";

export interface ComponentApiEntry {
  /** The real import this block needs from the DS package. */
  imports: { from: string; names: string[] };
  /** Render the real DS-component JSX string for a builder block's props. */
  toJsx: (props: Record<string, unknown>) => string;
}

const s = (v: unknown, fallback = ""): string => String(v ?? fallback);

/* Carbon's TextInput/Checkbox/Toggle require a unique `id` — derive a stable
   slug from the label so generated code is valid out of the box. */
const slug = (v: unknown, fallback = "field"): string =>
  s(v).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || fallback;

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

/* Generic block `variant` -> Material 3 (MUI) Button props. MUI Button API:
   variant = contained|outlined|text; color = primary|secondary|error|... */
function m3ButtonAttrs(props: Record<string, unknown>): string {
  const variant = s(props.variant, "primary");
  const map: Record<string, string> = {
    primary: 'variant="contained"',
    secondary: 'variant="outlined"',
    outline: 'variant="outlined"',
    ghost: 'variant="text"',
    danger: 'variant="contained" color="error"',
    destructive: 'variant="contained" color="error"',
  };
  return map[variant] ?? map.primary;
}

const M3: Record<string, ComponentApiEntry> = {
  SimulatedButton: {
    imports: { from: "@mui/material", names: ["Button"] },
    toJsx: (p) => `<Button ${m3ButtonAttrs(p)}>${s(p.label, "Button")}</Button>`,
  },
  SimulatedTextInput: {
    imports: { from: "@mui/material", names: ["TextField"] },
    toJsx: (p) => `<TextField label="${s(p.label, "Label")}" placeholder="${s(p.placeholder)}" variant="outlined" />`,
  },
  SimulatedCheckbox: {
    imports: { from: "@mui/material", names: ["Checkbox", "FormControlLabel"] },
    toJsx: (p) => `<FormControlLabel control={<Checkbox${p.defaultChecked ? " defaultChecked" : ""} />} label="${s(p.label)}" />`,
  },
  SimulatedSwitch: {
    imports: { from: "@mui/material", names: ["FormControlLabel", "Switch"] },
    toJsx: (p) => `<FormControlLabel control={<Switch${p.defaultOn ? " defaultChecked" : ""} />} label="${s(p.label)}" />`,
  },
  SimulatedCard: {
    imports: { from: "@mui/material", names: ["Card", "CardContent"] },
    toJsx: (p) => `<Card>\n  <CardContent>\n    <h3>${s(p.title, "Card")}</h3>\n    <p>${s(p.content)}</p>\n  </CardContent>\n</Card>`,
  },
};

/* Generic block `variant` -> Fluent 2 (@fluentui/react-components) Button.
   Fluent API: appearance = primary|secondary|outline|subtle|transparent.
   Fluent v9 has NO native destructive appearance — the repo's verified pattern
   for danger is subtle + the real --colorPaletteRedForeground1 token (a CSS var
   FluentProvider injects), so we mirror that rather than fabricate a prop. */
function fluentButtonAttrs(props: Record<string, unknown>): string {
  const variant = s(props.variant, "primary");
  const map: Record<string, string> = {
    primary: 'appearance="primary"',
    secondary: 'appearance="secondary"',
    outline: 'appearance="outline"',
    ghost: 'appearance="subtle"',
    danger: 'appearance="subtle" style={{ color: "var(--colorPaletteRedForeground1)" }}',
    destructive: 'appearance="subtle" style={{ color: "var(--colorPaletteRedForeground1)" }}',
  };
  return map[variant] ?? map.primary;
}

const FLUENT: Record<string, ComponentApiEntry> = {
  SimulatedButton: {
    imports: { from: "@fluentui/react-components", names: ["Button"] },
    toJsx: (p) => `<Button ${fluentButtonAttrs(p)}>${s(p.label, "Button")}</Button>`,
  },
  SimulatedTextInput: {
    imports: { from: "@fluentui/react-components", names: ["Field", "Input"] },
    toJsx: (p) =>
      `<Field label="${s(p.label, "Label")}">\n  <Input placeholder="${s(p.placeholder)}" />\n</Field>`,
  },
  SimulatedCheckbox: {
    imports: { from: "@fluentui/react-components", names: ["Checkbox"] },
    toJsx: (p) => `<Checkbox label="${s(p.label)}"${p.defaultChecked ? " defaultChecked" : ""} />`,
  },
  SimulatedSwitch: {
    imports: { from: "@fluentui/react-components", names: ["Switch"] },
    toJsx: (p) => `<Switch label="${s(p.label)}"${p.defaultOn ? " defaultChecked" : ""} />`,
  },
  SimulatedCard: {
    imports: { from: "@fluentui/react-components", names: ["Card", "CardHeader"] },
    toJsx: (p) =>
      `<Card>\n  <CardHeader header="${s(p.title, "Card")}" description="${s(p.content)}" />\n</Card>`,
  },
};

/* Generic block `variant` -> Carbon (@carbon/react) Button kind.
   Carbon API: kind = primary|secondary|tertiary|ghost|danger (+ danger--* ).
   tertiary is Carbon's bordered/outline button; danger is the destructive kind. */
function carbonButtonAttrs(props: Record<string, unknown>): string {
  const variant = s(props.variant, "primary");
  const map: Record<string, string> = {
    primary: 'kind="primary"',
    secondary: 'kind="secondary"',
    outline: 'kind="tertiary"',
    ghost: 'kind="ghost"',
    danger: 'kind="danger"',
    destructive: 'kind="danger"',
  };
  return map[variant] ?? map.primary;
}

const CARBON: Record<string, ComponentApiEntry> = {
  SimulatedButton: {
    imports: { from: "@carbon/react", names: ["Button"] },
    toJsx: (p) => `<Button ${carbonButtonAttrs(p)}>${s(p.label, "Button")}</Button>`,
  },
  SimulatedTextInput: {
    imports: { from: "@carbon/react", names: ["TextInput"] },
    toJsx: (p) =>
      `<TextInput id="${slug(p.label, "input")}" labelText="${s(p.label, "Label")}" placeholder="${s(p.placeholder)}" />`,
  },
  SimulatedCheckbox: {
    imports: { from: "@carbon/react", names: ["Checkbox"] },
    toJsx: (p) =>
      `<Checkbox id="${slug(p.label, "checkbox")}" labelText="${s(p.label)}"${p.defaultChecked ? " defaultChecked" : ""} />`,
  },
  SimulatedSwitch: {
    imports: { from: "@carbon/react", names: ["Toggle"] },
    toJsx: (p) =>
      `<Toggle id="${slug(p.label, "toggle")}" labelText="${s(p.label)}"${p.defaultOn ? " defaultToggled" : ""} />`,
  },
  SimulatedCard: {
    imports: { from: "@carbon/react", names: ["Tile"] },
    toJsx: (p) => `<Tile>\n  <h3>${s(p.title, "Card")}</h3>\n  <p>${s(p.content)}</p>\n</Tile>`,
  },
};

/* Generic block `variant` -> uoaui button class suffix. uoaui buttons:
   a-btn-primary|secondary|outline|ghost. uoaui has NO danger button variant
   (and no --a-danger token), so danger falls to primary — the closest real
   class — rather than inventing a-btn-danger. */
function uoauiButtonClass(props: Record<string, unknown>): string {
  const variant = s(props.variant, "primary");
  const map: Record<string, string> = {
    primary: "a-btn-primary",
    secondary: "a-btn-secondary",
    outline: "a-btn-outline",
    ghost: "a-btn-ghost",
    danger: "a-btn-primary",
    destructive: "a-btn-primary",
  };
  return map[variant] ?? map.primary;
}

/* uoaui is CSS-only — every entry's "import" is the same side-effect stylesheet
   (the --a-* tokens + .a-* rules Design Hub generates via uoauiBuildCSS), with
   no named exports. collectImports turns names:[] into `import "..."`. */
const uoauiImport = { from: "./uoaui-theme.css", names: [] as string[] };

const UOAUI: Record<string, ComponentApiEntry> = {
  SimulatedButton: {
    imports: uoauiImport,
    toJsx: (p) => `<button className="a-btn ${uoauiButtonClass(p)}">${s(p.label, "Button")}</button>`,
  },
  SimulatedTextInput: {
    imports: uoauiImport,
    toJsx: (p) =>
      `<div className="a-input-wrap">\n  <label className="a-input-label">${s(p.label, "Label")}</label>\n  <input className="a-input" placeholder="${s(p.placeholder)}" />\n</div>`,
  },
  SimulatedCheckbox: {
    imports: uoauiImport,
    toJsx: (p) => {
      const checked = !!p.defaultChecked;
      return `<label className="a-checkbox${checked ? " checked" : ""}">\n  <span className="a-cb-box">${checked ? "✓" : ""}</span>\n  ${s(p.label)}\n</label>`;
    },
  },
  /* uoaui has no native switch/toggle component — SimulatedSwitch is
     intentionally omitted so the exporter falls back to generic markup rather
     than emit a fabricated a-switch class. */
  SimulatedCard: {
    imports: uoauiImport,
    toJsx: (p) => `<div className="a-card">\n  <h3>${s(p.title, "Card")}</h3>\n  <p>${s(p.content)}</p>\n</div>`,
  },
};

/* Per-DS registries. All five DSs seeded. uoaui is className/CSS-based; the
   other four import real component packages. */
const REGISTRY: Partial<Record<SystemId, Record<string, ComponentApiEntry>>> = {
  salt: SALT,
  m3: M3,
  fluent: FLUENT,
  carbon: CARBON,
  uoaui: UOAUI,
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
  return [...byPkg.entries()].map(([from, names]) =>
    names.size === 0
      ? `import "${from}";` /* side-effect import (e.g. uoaui's CSS-only theme) */
      : `import { ${[...names].sort().join(", ")} } from "${from}";`,
  );
}
