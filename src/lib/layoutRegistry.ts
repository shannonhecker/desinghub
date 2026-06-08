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
import { normalizePadding, normalizeGap } from "@/store/useBuilder";
import type { LayoutJustify, LayoutAlign, PaddingValue, GapValue } from "@/store/useBuilder";

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

/* ── P4 export twin: justify (main-axis distribution) + align (cross-axis) ──
   ZoneLayout.justify / .align are resolved to CSS by layoutResolver for the
   edit canvas + preview; the export path must carry the SAME values into
   generated code or they silently die (the export trap). These helpers mirror
   layoutResolver's FLEX_JUSTIFY / cross-axis maps so exported code matches what
   the user sees in the builder.

   `justify`/`align` arrive on the registry `props` object (forwarded by
   reactExporter). undefined => emit nothing (additive — most zones never set
   them, keeps output lean). */
const isJustify = (v: unknown): v is LayoutJustify =>
  v === "start" || v === "center" || v === "end" || v === "space-between" || v === "space-around";
const isAlign = (v: unknown): v is LayoutAlign =>
  v === "start" || v === "center" || v === "end" || v === "stretch";

const justifyOf = (p: Record<string, unknown>): LayoutJustify | undefined =>
  isJustify(p.justify) ? p.justify : undefined;
const alignOf = (p: Record<string, unknown>): LayoutAlign | undefined =>
  isAlign(p.align) ? p.align : undefined;

/* CSS justify-content value for flex containers (mirrors FLEX_JUSTIFY). */
const FLEX_JUSTIFY_CSS: Record<LayoutJustify, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  "space-between": "space-between",
  "space-around": "space-around",
};
/* CSS align-items value for the cross axis. */
const ALIGN_ITEMS_CSS: Record<LayoutAlign, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
};
/* CSS justify-items value for grid containers (mirrors GRID_JUSTIFY_ITEMS:
   space-* has no justify-items value, so those pin items to start and the
   container distributes via justify-content instead). */
const GRID_JUSTIFY_ITEMS_CSS: Record<LayoutJustify, string> = {
  start: "start",
  center: "center",
  end: "end",
  "space-between": "start",
  "space-around": "start",
};

/* Salt FlexLayout/StackLayout use their OWN value vocabulary (start/center/end/
   stretch/space-*), NOT the CSS flex-start/flex-end spelling — so Salt native
   props take the raw LayoutJustify/LayoutAlign value directly. */

/* Build the body of a JSX style-object (no braces) for a FLEX container's
   justify + align. Returns "" when neither is set so callers can skip the
   style prop entirely. */
const flexJustifyAlignBody = (p: Record<string, unknown>): string => {
  const j = justifyOf(p);
  const a = alignOf(p);
  const parts: string[] = [];
  if (j) parts.push(`justifyContent: ${JSON.stringify(FLEX_JUSTIFY_CSS[j])}`);
  if (a) parts.push(`alignItems: ${JSON.stringify(ALIGN_ITEMS_CSS[a])}`);
  return parts.join(", ");
};

/* Build the body of a JSX style-object (no braces) for a GRID container's
   justify + align. Grid uses justify-items for positional values and
   justify-content for space-* distribution; cross-axis stays alignItems. */
const gridJustifyAlignBody = (p: Record<string, unknown>): string => {
  const j = justifyOf(p);
  const a = alignOf(p);
  const parts: string[] = [];
  if (j) {
    parts.push(`justifyItems: ${JSON.stringify(GRID_JUSTIFY_ITEMS_CSS[j])}`);
    if (j === "space-between" || j === "space-around") {
      parts.push(`justifyContent: ${JSON.stringify(j)}`);
    }
  }
  if (a) parts.push(`alignItems: ${JSON.stringify(ALIGN_ITEMS_CSS[a])}`);
  return parts.join(", ");
};

/* ── P5 export twin: per-side padding + row/col gap ──────────────────────────
   ZoneLayout.padding (number | {t,r,b,l}) and .gap (number | {row,col}) are
   resolved to CSS by layoutResolver for the edit canvas + preview. The export
   path must carry the SAME values into generated code or they silently die (the
   export trap). NO DS layout primitive (Salt GridLayout/StackLayout/FlexLayout,
   MUI Grid/Stack, Carbon Grid/Stack, Fluent/uoaui divs) exposes a per-side
   padding prop, so padding ALWAYS goes through CSS style. Gap: the DS-native
   spacing prop (gap={n} / spacing={n}) carries a UNIFORM gap; only when the two
   axes differ do we emit rowGap/columnGap (px) as a CSS override.

   `padding`/`gap` arrive on the registry `props` object (forwarded by
   reactExporter). undefined => emit nothing (additive — most zones never set
   per-side padding or per-axis gap, keeps output lean). */
const paddingOf = (p: Record<string, unknown>): PaddingValue | undefined => {
  const v = p.padding;
  if (typeof v === "number") return v;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.t === "number" && typeof o.r === "number" && typeof o.b === "number" && typeof o.l === "number") {
      return { t: o.t, r: o.r, b: o.b, l: o.l };
    }
  }
  return undefined;
};
const gapValueOf = (p: Record<string, unknown>): GapValue | undefined => {
  const v = p.gap;
  if (typeof v === "number") return v;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.row === "number" && typeof o.col === "number") return { row: o.row, col: o.col };
  }
  return undefined;
};

/* The DS-native spacing-unit gap (single number) the DS layout prop accepts.
   Mirrors what the legacy number path forwarded — for the object form we take
   the COL (main-axis / between-columns) gap so a uniform native prop matches
   the canvas's dominant gap; the row/col split (if any) is reconciled by the
   CSS rowGap/columnGap override emitted in paddingGapCssBody. */
const nativeGap = (p: Record<string, unknown>, fallback: number): number => {
  const g = normalizeGap(gapValueOf(p));
  return g ? g.col : fallback;
};

/* Build the body of a JSX style-object (no braces) for per-side padding + a
   per-axis gap override. Returns "" when neither needs CSS (uniform/zero
   padding handled below; uniform gap handled by the native prop). The values
   are px literals (matches layoutResolver). */
const paddingGapCssBody = (p: Record<string, unknown>): string => {
  const parts: string[] = [];
  const pad = normalizePadding(paddingOf(p));
  if (pad && (pad.t || pad.r || pad.b || pad.l)) {
    if (pad.t === pad.r && pad.r === pad.b && pad.b === pad.l) {
      parts.push(`padding: ${JSON.stringify(`${pad.t}px`)}`);
    } else {
      parts.push(`paddingTop: ${JSON.stringify(`${pad.t}px`)}`);
      parts.push(`paddingRight: ${JSON.stringify(`${pad.r}px`)}`);
      parts.push(`paddingBottom: ${JSON.stringify(`${pad.b}px`)}`);
      parts.push(`paddingLeft: ${JSON.stringify(`${pad.l}px`)}`);
    }
  }
  const gap = normalizeGap(gapValueOf(p));
  if (gap && gap.row !== gap.col) {
    parts.push(`rowGap: ${JSON.stringify(`${gap.row}px`)}`);
    parts.push(`columnGap: ${JSON.stringify(`${gap.col}px`)}`);
  }
  return parts.join(", ");
};

/* Merge two JSX style-object bodies (no braces) into one comma-joined body,
   dropping empties. Used to combine the justify/align body with the
   padding/gap body so a single style/sx prop carries everything. */
const mergeBodies = (...bodies: string[]): string => bodies.filter(Boolean).join(", ");

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
      const gap = nativeGap(p, 3);
      const items = children
        .map((c) => `<GridItem colSpan={${normalizeColumns(c.span ?? 12, cols)}}>${withHeight(c)}</GridItem>`)
        .join("");
      const grid = `<GridLayout columns={${cols}} gap={${gap}}>${items}</GridLayout>`;
      /* GridLayout exposes no justify/align OR padding prop -> wrap in a styled
         grid div so distribution/alignment + P5 per-side padding / per-axis gap
         still reach generated code. */
      const body = mergeBodies(gridJustifyAlignBody(p), paddingGapCssBody(p));
      return body ? `<div style={{ display: "grid", ${body} }}>${grid}</div>` : grid;
    },
  },
  stack: {
    imports: { from: SALT_CORE, names: ["StackLayout"] },
    toJsx: (p, children) => {
      /* StackLayout supports `align` natively but has NO justify or padding
         prop. Emit align natively; wrap in a flex column carrying justifyContent
         + P5 padding/gap CSS when set (CSS-wrapper fallback per the export trap
         rule). */
      const a = alignOf(p);
      const alignAttr = a ? ` align="${a}"` : "";
      const stack = `<StackLayout gap={${nativeGap(p, 3)}}${alignAttr}>${joinKids(children)}</StackLayout>`;
      const j = justifyOf(p);
      const wrapParts = mergeBodies(
        j ? `justifyContent: ${JSON.stringify(FLEX_JUSTIFY_CSS[j])}` : "",
        paddingGapCssBody(p),
      );
      return wrapParts
        ? `<div style={{ display: "flex", flexDirection: "column", ${wrapParts} }}>${stack}</div>`
        : stack;
    },
  },
  row: {
    imports: { from: SALT_CORE, names: ["FlexLayout"] },
    toJsx: (p, children) => {
      /* FlexLayout supports BOTH justify + align natively (Salt's own
         start/center/end/stretch/space-* vocabulary == our LayoutJustify/
         LayoutAlign value set) but has NO padding prop -> P5 padding / per-axis
         gap go through a CSS-wrapper div. */
      const j = justifyOf(p);
      const a = alignOf(p);
      const justifyAttr = j ? ` justify="${j}"` : "";
      const alignAttr = a ? ` align="${a}"` : "";
      const flex = `<FlexLayout gap={${nativeGap(p, 3)}}${justifyAttr}${alignAttr}>${joinKids(children)}</FlexLayout>`;
      const body = paddingGapCssBody(p);
      return body ? `<div style={{ ${body} }}>${flex}</div>` : flex;
    },
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
      /* MUI Grid container is a flexbox -> use flex justifyContent/alignItems +
         P5 padding/gap via the native `sx` prop (NOT justify-items). */
      const body = mergeBodies(flexJustifyAlignBody(p), paddingGapCssBody(p));
      const sx = body ? ` sx={{ ${body} }}` : "";
      return `<Grid container spacing={${nativeGap(p, 2)}}${sx}>${items}</Grid>`;
    },
  },
  stack: {
    imports: { from: MUI, names: ["Stack"] },
    toJsx: (p, children) => {
      const body = mergeBodies(flexJustifyAlignBody(p), paddingGapCssBody(p));
      const sx = body ? ` sx={{ ${body} }}` : "";
      return `<Stack spacing={${nativeGap(p, 2)}}${sx}>${joinKids(children)}</Stack>`;
    },
  },
  row: {
    imports: { from: MUI, names: ["Stack"] },
    toJsx: (p, children) => {
      const body = mergeBodies(flexJustifyAlignBody(p), paddingGapCssBody(p));
      const sx = body ? ` sx={{ ${body} }}` : "";
      return `<Stack direction="row" spacing={${nativeGap(p, 2)}}${sx}>${joinKids(children)}</Stack>`;
    },
  },
};

/* ── CARBON — @carbon/react (16-col grid at lg) ──────────────────────── */
const CARBON = "@carbon/react";
const CARBON_REG: Partial<Record<LayoutPrimitive, LayoutApiEntry>> = {
  grid: {
    imports: { from: CARBON, names: ["Grid", "Column"] },
    toJsx: (p, children) => {
      const items = children
        .map((c) => `<Column lg={${normalizeColumns(c.span ?? 12, 16)}}>${withHeight(c)}</Column>`)
        .join("");
      /* Carbon Grid is a CSS grid and spreads ...rest (incl. style) onto its
         root element (verified in @carbon/react CSSGrid.js) -> forward grid
         justify-items/justify-content + alignItems + P5 padding/gap via style. */
      const body = mergeBodies(gridJustifyAlignBody(p), paddingGapCssBody(p));
      const style = body ? ` style={{ ${body} }}` : "";
      return `<Grid${style}>${items}</Grid>`;
    },
  },
  stack: {
    imports: { from: CARBON, names: ["Stack"] },
    toJsx: (p, children) => {
      /* Carbon Stack extends React.HTMLAttributes and merges rest.style onto
         the element (verified in @carbon/react Stack.js) -> forward flex
         justifyContent/alignItems + P5 padding/gap via style. */
      const body = mergeBodies(flexJustifyAlignBody(p), paddingGapCssBody(p));
      const style = body ? ` style={{ ${body} }}` : "";
      return `<Stack gap={${nativeGap(p, 5)}}${style}>${joinKids(children)}</Stack>`;
    },
  },
  row: {
    imports: { from: CARBON, names: ["Stack"] },
    toJsx: (p, children) => {
      const body = mergeBodies(flexJustifyAlignBody(p), paddingGapCssBody(p));
      const style = body ? ` style={{ ${body} }}` : "";
      return `<Stack orientation="horizontal" gap={${nativeGap(p, 5)}}${style}>${joinKids(children)}</Stack>`;
    },
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
    toJsx: (p, children) => {
      const items = children
        .map((c) => `<div style={{ gridColumn: "span ${normalizeColumns(c.span ?? 12, 12)}"${c.heightStyle ? `, ${c.heightStyle}` : ""} }}>${c.jsx}</div>`)
        .join("");
      const body = mergeBodies(gridJustifyAlignBody(p), paddingGapCssBody(p));
      const ja = body ? `, ${body}` : "";
      return `<div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: tokens.spacingHorizontalM${ja} }}>${items}</div>`;
    },
  },
  stack: {
    imports: { from: FLUENT_PKG, names: ["tokens"] },
    toJsx: (p, children) => {
      const body = mergeBodies(flexJustifyAlignBody(p), paddingGapCssBody(p));
      const ja = body ? `, ${body}` : "";
      return `<div style={{ display: "flex", flexDirection: "column", gap: tokens.spacingVerticalM${ja} }}>${joinKids(children)}</div>`;
    },
  },
  row: {
    imports: { from: FLUENT_PKG, names: ["tokens"] },
    toJsx: (p, children) => {
      const body = mergeBodies(flexJustifyAlignBody(p), paddingGapCssBody(p));
      const ja = body ? `, ${body}` : "";
      return `<div style={{ display: "flex", gap: tokens.spacingHorizontalM${ja} }}>${joinKids(children)}</div>`;
    },
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
    toJsx: (p, children) => {
      const items = children
        .map((c) => `<div style={{ gridColumn: "span ${normalizeColumns(c.span ?? 12, 12)}"${c.heightStyle ? `, ${c.heightStyle}` : ""} }}>${c.jsx}</div>`)
        .join("");
      const body = mergeBodies(gridJustifyAlignBody(p), paddingGapCssBody(p));
      const style = body ? ` style={{ ${body} }}` : "";
      return `<div className="a-grid"${style}>${items}</div>`;
    },
  },
  stack: {
    imports: [],
    toJsx: (p, children) => {
      const body = mergeBodies(flexJustifyAlignBody(p), paddingGapCssBody(p));
      const style = body ? ` style={{ ${body} }}` : "";
      return `<div className="a-stack"${style}>${joinKids(children)}</div>`;
    },
  },
  row: {
    imports: [],
    toJsx: (p, children) => {
      const body = mergeBodies(flexJustifyAlignBody(p), paddingGapCssBody(p));
      const style = body ? ` style={{ ${body} }}` : "";
      return `<div className="a-row"${style}>${joinKids(children)}</div>`;
    },
  },
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
