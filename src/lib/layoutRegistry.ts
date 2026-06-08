/**
 * LayoutRegistry — sibling to componentApiRegistry. Turns an abstract layout
 * primitive (grid/stack/row/appShell/split) into REAL per-DS layout-component
 * JSX with children recursion, for render + export. Same honesty rule as the
 * component registry: never fabricate an API. Every entry below was verified
 * against the installed package in node_modules:
 *   - Salt 1.63   @salt-ds/core  GridLayout(columns,gap) / GridItem(colSpan) /
 *                                 StackLayout / FlexLayout
 *   - M3 (MUI 9)  @mui/material  Grid(container,spacing) + Grid(size) / Stack
 *   - Carbon 1.108 @carbon/react Grid + Column(lg<=16) / Stack(gap,orientation)
 *   - Fluent 9.74 @fluentui/react-components ships NO Grid/Stack component
 *                 (Stack was v8 only) -> idiomatic layout is token-driven CSS.
 *   - uoaui (no npm package) className + density-px CSS; .a-grid/.a-stack/.a-row
 *                 carry the gap from the density `sz` object (uoauiBuildCSS).
 *
 * Phase 0 seeds grid/stack/row; appShell/split are added in the gallery phases
 * where patterns need them.
 */
import type { SystemId, ImportRequirement, ImportSpec } from "./componentApiRegistry";
import { normalizeColumns } from "./layoutResolver";

export type LayoutPrimitive = "grid" | "stack" | "row" | "appShell" | "split";

/** A pre-rendered child + its canonical 12-fr span and optional shell region. */
export interface LayoutChild {
  jsx: string;
  span?: number; // canonical 12-fr; undefined => full native row
  region?: "header" | "sidenav" | "main" | "footer";
  /** P3 export twin: a per-child counter-axis (height) projection. When the
     block carries a layout.height / minHeight / maxHeight, the exporter sets
     this to a JSX style-object literal body (e.g. `height: "240px"`). The DS
     layout primitives below wrap such a child in a <div style={{…}}> so the
     height value survives into generated code even when the DS's own grid /
     stack / row primitive can't express it (the export trap). undefined =>
     no wrapper (the common case — most blocks are content-height/Hug). */
  heightStyle?: string;
}

export interface LayoutApiEntry {
  imports: ImportRequirement;
  toJsx: (props: Record<string, unknown>, children: LayoutChild[]) => string;
}

const num = (v: unknown, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/* P3 export twin: when a child carries a height projection, wrap its JSX in a
   plain <div style={{…}}> so the height reaches the generated code even where
   the DS layout primitive (GridItem / Stack / Column) can't set it. No height
   projection => return the JSX untouched (the common Hug case, zero overhead). */
const withHeight = (c: LayoutChild): string =>
  c.heightStyle ? `<div style={{ ${c.heightStyle} }}>${c.jsx}</div>` : c.jsx;

const joinKids = (children: LayoutChild[]): string => children.map(withHeight).join("");

/* ── SALT — @salt-ds/core (12-col GridLayout) ─────────────────────────── */
const SALT_CORE = "@salt-ds/core";
const SALT: Partial<Record<LayoutPrimitive, LayoutApiEntry>> = {
  grid: {
    imports: { from: SALT_CORE, names: ["GridLayout", "GridItem"] },
    toJsx: (p, children) => {
      const cols = num(p.columns, 12);
      const gap = num(p.gap, 3);
      const items = children
        .map((c) => `<GridItem colSpan={${normalizeColumns(c.span ?? 12, cols)}}>${withHeight(c)}</GridItem>`)
        .join("");
      return `<GridLayout columns={${cols}} gap={${gap}}>${items}</GridLayout>`;
    },
  },
  stack: {
    imports: { from: SALT_CORE, names: ["StackLayout"] },
    toJsx: (p, children) => `<StackLayout gap={${num(p.gap, 3)}}>${joinKids(children)}</StackLayout>`,
  },
  row: {
    imports: { from: SALT_CORE, names: ["FlexLayout"] },
    toJsx: (p, children) => `<FlexLayout gap={${num(p.gap, 3)}}>${joinKids(children)}</FlexLayout>`,
  },
};

/* ── M3 — @mui/material (v9 unified Grid, 12-col) ─────────────────────── */
const MUI = "@mui/material";
const M3: Partial<Record<LayoutPrimitive, LayoutApiEntry>> = {
  grid: {
    imports: { from: MUI, names: ["Grid"] },
    toJsx: (p, children) => {
      const items = children
        .map((c) => `<Grid size={${normalizeColumns(c.span ?? 12, 12)}}>${withHeight(c)}</Grid>`)
        .join("");
      return `<Grid container spacing={${num(p.gap, 2)}}>${items}</Grid>`;
    },
  },
  stack: {
    imports: { from: MUI, names: ["Stack"] },
    toJsx: (p, children) => `<Stack spacing={${num(p.gap, 2)}}>${joinKids(children)}</Stack>`,
  },
  row: {
    imports: { from: MUI, names: ["Stack"] },
    toJsx: (p, children) => `<Stack direction="row" spacing={${num(p.gap, 2)}}>${joinKids(children)}</Stack>`,
  },
};

/* ── CARBON — @carbon/react (16-col grid at lg) ──────────────────────── */
const CARBON = "@carbon/react";
const CARBON_REG: Partial<Record<LayoutPrimitive, LayoutApiEntry>> = {
  grid: {
    imports: { from: CARBON, names: ["Grid", "Column"] },
    toJsx: (_p, children) => {
      const items = children
        .map((c) => `<Column lg={${normalizeColumns(c.span ?? 12, 16)}}>${withHeight(c)}</Column>`)
        .join("");
      return `<Grid>${items}</Grid>`;
    },
  },
  stack: {
    imports: { from: CARBON, names: ["Stack"] },
    toJsx: (p, children) => `<Stack gap={${num(p.gap, 5)}}>${joinKids(children)}</Stack>`,
  },
  row: {
    imports: { from: CARBON, names: ["Stack"] },
    toJsx: (p, children) => `<Stack orientation="horizontal" gap={${num(p.gap, 5)}}>${joinKids(children)}</Stack>`,
  },
};

/* ── FLUENT — @fluentui/react-components (no layout component; token CSS) ──
   v9 ships no Grid/Stack. Idiomatic layout is token-driven CSS; emitted as
   inline-style divs with real spacing tokens (makeStyles is more idiomatic and
   is a Phase-4 upgrade, but inline tokens are valid + honest for codegen). */
const FLUENT_PKG = "@fluentui/react-components";
const FLUENT: Partial<Record<LayoutPrimitive, LayoutApiEntry>> = {
  grid: {
    imports: { from: FLUENT_PKG, names: ["tokens"] },
    toJsx: (_p, children) => {
      const items = children
        .map((c) => `<div style={{ gridColumn: "span ${normalizeColumns(c.span ?? 12, 12)}"${c.heightStyle ? `, ${c.heightStyle}` : ""} }}>${c.jsx}</div>`)
        .join("");
      return `<div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: tokens.spacingHorizontalM }}>${items}</div>`;
    },
  },
  stack: {
    imports: { from: FLUENT_PKG, names: ["tokens"] },
    toJsx: (_p, children) =>
      `<div style={{ display: "flex", flexDirection: "column", gap: tokens.spacingVerticalM }}>${joinKids(children)}</div>`,
  },
  row: {
    imports: { from: FLUENT_PKG, names: ["tokens"] },
    toJsx: (_p, children) => `<div style={{ display: "flex", gap: tokens.spacingHorizontalM }}>${joinKids(children)}</div>`,
  },
};

/* ── uoaui — className + density-px CSS (no npm package) ───────────────────
   .a-grid/.a-stack/.a-row carry their gap from the uoaui density `sz` object
   (added to uoauiBuildCSS). The 12-col grid lives in .a-grid; items take a
   span via inline gridColumn so the same canonical fractions apply. No import
   line — the a-* stylesheet is global. */
const UOAUI: Partial<Record<LayoutPrimitive, LayoutApiEntry>> = {
  grid: {
    imports: [],
    toJsx: (_p, children) => {
      const items = children
        .map((c) => `<div style={{ gridColumn: "span ${normalizeColumns(c.span ?? 12, 12)}"${c.heightStyle ? `, ${c.heightStyle}` : ""} }}>${c.jsx}</div>`)
        .join("");
      return `<div className="a-grid">${items}</div>`;
    },
  },
  stack: { imports: [], toJsx: (_p, children) => `<div className="a-stack">${joinKids(children)}</div>` },
  row: { imports: [], toJsx: (_p, children) => `<div className="a-row">${joinKids(children)}</div>` },
};

const LAYOUT_REGISTRY: Record<SystemId, Partial<Record<LayoutPrimitive, LayoutApiEntry>>> = {
  salt: SALT,
  m3: M3,
  fluent: FLUENT,
  carbon: CARBON_REG,
  uoaui: UOAUI,
};

export function resolveLayoutApi(ds: SystemId, primitive: LayoutPrimitive): LayoutApiEntry | null {
  return LAYOUT_REGISTRY[ds]?.[primitive] ?? null;
}

export function layoutToJsx(
  ds: SystemId,
  primitive: LayoutPrimitive,
  props: Record<string, unknown>,
  children: LayoutChild[],
): string | null {
  const entry = resolveLayoutApi(ds, primitive);
  return entry ? entry.toJsx(props, children) : null;
}

/* Flatten an ImportRequirement to ImportSpec[] (mirrors componentApiRegistry). */
function specsOf(req: ImportRequirement, props: Record<string, unknown> = {}): ImportSpec[] {
  if (typeof req === "function") return req(props);
  return Array.isArray(req) ? req : [req];
}

export function collectLayoutImports(ds: SystemId, primitives: LayoutPrimitive[]): string[] {
  const byPkg = new Map<string, Set<string>>();
  for (const prim of primitives) {
    const entry = resolveLayoutApi(ds, prim);
    if (!entry) continue;
    for (const spec of specsOf(entry.imports)) {
      const set = byPkg.get(spec.from) ?? new Set<string>();
      spec.names.forEach((n) => set.add(n));
      byPkg.set(spec.from, set);
    }
  }
  return [...byPkg.entries()].map(([from, names]) =>
    names.size ? `import { ${[...names].sort().join(", ")} } from "${from}";` : `import "${from}";`,
  );
}
