# DS-Owned Layout Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every layout in Design Hub resolve to each design system's real grid/layout primitives — for live render, the Code tab, and export — driven by one DS-agnostic pattern definition through a new layout registry, without changing the builder's editable model or adding edit-mode padding.

**Architecture:** A new `layoutRegistry.ts` (parallel to `componentApiRegistry.ts`) maps abstract primitives (`grid`/`stack`/`row`/`appShell`/`split`) to each DS's real layout components, with children recursion. Canonical 12-fr spans normalize to each DS's native column count (Carbon 16, others 12) in one helper in `layoutResolver.ts`. `reactExporter` gains children recursion to emit nested layout JSX. The builder keeps `zoneLayouts` + per-block widths as the editable source of truth; the resolver is repointed to emit DS layout in preview/present/export while keeping edit mode padding-free and pixel-identical to preview.

**Tech Stack:** TypeScript, React 18 / Next.js 16, Zustand, Vitest 4 (`vitest run`). Real DS packages: `@salt-ds/core`, `@mui/material`, `@fluentui/react-components`, `@carbon/react`, uoaui (className + `--a-*` CSS).

**Spec:** `docs/superpowers/specs/2026-06-05-ds-owned-layout-registry-design.md`

---

## File Structure

| File | Responsibility | Phase |
|---|---|---|
| `src/lib/layoutResolver.ts` (modify) | Add `nativeColumnsFor(ds)` + `normalizeColumns(fr, nativeCols)` span-normalization helpers | 0 |
| `src/lib/layoutRegistry.ts` (create) | `LAYOUT_REGISTRY[ds][primitive]` → real DS layout JSX + imports, with children recursion. `resolveLayoutApi`, `layoutToJsx`, `collectLayoutImports` | 0 |
| `src/lib/__tests__/layoutRegistry.test.ts` (create) | Unit tests for the registry + normalization | 0 |
| `src/lib/export/reactExporter.ts` (modify) | Children recursion so layout containers emit nested JSX; gather layout imports | 4 |
| `src/components/builder/ComponentRenderer.tsx` (modify) | Route layout containers through `LAYOUT_REGISTRY` for live render | 3 |
| `src/data/<ds>/<ds>-documentation.jsx` (modify ×5) | Replace 40 hand-coded `Pat*` with shared pattern defs resolved via registry | 1–2 |
| `src/data/<ds>/code-snippets.ts` (modify ×5) | Code-tab generated from pattern def + registry | 4 |
| `src/data/<ds>/<ds>-documentation.jsx` `buildCSS` (uoaui) | Add `.a-grid/.a-stack/.a-row` token CSS | 0 |

---

## PHASE 0 — Layout registry scaffold (this plan, full detail)

Self-contained: adds the registry + normalization + unit tests. **No surface change.** Oracle: `vitest run`.

### Task 1: Column normalization helpers

**Files:**
- Modify: `src/lib/layoutResolver.ts` (append exported helpers near `colSpanToWidth`, ~line 43)
- Test: `src/lib/__tests__/layoutResolver.test.ts` (append a new `describe`)

- [ ] **Step 1: Write the failing test**

Append to `src/lib/__tests__/layoutResolver.test.ts`:

```ts
import { nativeColumnsFor, normalizeColumns } from "../layoutResolver";

describe("normalizeColumns — canonical 12-fr maps to each DS's native grid", () => {
  it("is identity on a 12-col DS (Salt/M3/Fluent/uoaui)", () => {
    expect(normalizeColumns(6, 12)).toBe(6);
    expect(normalizeColumns(12, 12)).toBe(12);
    expect(normalizeColumns(3, 12)).toBe(3);
  });

  it("scales to Carbon's 16-col grid with round-half-up", () => {
    expect(normalizeColumns(6, 16)).toBe(8);   // half of 16
    expect(normalizeColumns(12, 16)).toBe(16);  // full
    expect(normalizeColumns(4, 16)).toBe(5);    // round(5.333)
    expect(normalizeColumns(3, 16)).toBe(4);    // quarter
  });

  it("clamps to [1, nativeCols] and guards non-finite input", () => {
    expect(normalizeColumns(0, 12)).toBe(1);
    expect(normalizeColumns(99, 16)).toBe(16);
    expect(normalizeColumns(NaN, 12)).toBe(12); // unsized → full row
  });

  it("nativeColumnsFor returns 16 for carbon, 12 otherwise", () => {
    expect(nativeColumnsFor("carbon")).toBe(16);
    expect(nativeColumnsFor("salt")).toBe(12);
    expect(nativeColumnsFor("m3")).toBe(12);
    expect(nativeColumnsFor("fluent")).toBe(12);
    expect(nativeColumnsFor("uoaui")).toBe(12);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/layoutResolver.test.ts -t "normalizeColumns"`
Expected: FAIL — `nativeColumnsFor`/`normalizeColumns` are not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `src/lib/layoutResolver.ts` (after `colSpanToWidth`, ~line 43). Import `SystemId` at top: change line 20 region to also `import type { SystemId } from "@/lib/componentApiRegistry";` (or from wherever `SystemId` lives — it is exported from `componentApiRegistry.ts:29`).

```ts
/* Each DS's native grid column count. Canonical pattern widths are
   authored in 12-fr; Carbon's grid is 16-col, the rest are 12. The
   layout registry is the ONLY place this normalization happens. */
export function nativeColumnsFor(ds: SystemId): number {
  return ds === "carbon" ? 16 : 12;
}

/* Map a canonical 12-fr span to a DS's native column count.
   round-half-up, clamped to [1, nativeCols]. Non-finite fr (an
   unsized block) spans the full native row. */
export function normalizeColumns(fr: number, nativeCols: number): number {
  if (!Number.isFinite(fr)) return nativeCols;
  const scaled = Math.round((fr / 12) * nativeCols);
  return Math.max(1, Math.min(nativeCols, scaled));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/layoutResolver.test.ts -t "normalizeColumns"`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/layoutResolver.ts src/lib/__tests__/layoutResolver.test.ts
git commit -F- <<'MSG'
feat(layout): canonical 12-fr -> native column normalization

nativeColumnsFor + normalizeColumns: the single place a pattern's
12-fr span maps to each DS's native grid (Carbon 16, others 12).
Foundation for the DS-owned layout registry.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 2: Layout registry scaffold + types + resolver functions (Salt seed)

**Files:**
- Create: `src/lib/layoutRegistry.ts`
- Test: `src/lib/__tests__/layoutRegistry.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/layoutRegistry.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolveLayoutApi, layoutToJsx, collectLayoutImports } from "../layoutRegistry";

const child = (jsx: string, span?: number) => ({ jsx, span });

describe("layoutRegistry — Salt emits real @salt-ds/core layout", () => {
  it("grid emits GridLayout + GridItem colSpan", () => {
    const jsx = layoutToJsx("salt", "grid", { columns: 12, gap: 3 }, [
      child("<Card>A</Card>", 6),
      child("<Card>B</Card>", 6),
    ])!;
    expect(jsx).toContain("<GridLayout columns={12} gap={3}>");
    expect(jsx).toContain('<GridItem colSpan={6}><Card>A</Card></GridItem>');
  });

  it("stack emits StackLayout, row emits FlexLayout", () => {
    expect(layoutToJsx("salt", "stack", {}, [child("<X/>")])!).toContain("<StackLayout");
    expect(layoutToJsx("salt", "row", {}, [child("<X/>")])!).toContain("<FlexLayout");
  });

  it("collects deduped, sorted Salt layout imports", () => {
    const imports = collectLayoutImports("salt", ["grid", "stack", "grid"]);
    expect(imports).toContain('import { FlexLayout, GridItem, GridLayout, StackLayout } from "@salt-ds/core";');
  });

  it("returns null for an unknown primitive so callers can fall back", () => {
    expect(resolveLayoutApi("salt", "bogus" as never)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/layoutRegistry.test.ts`
Expected: FAIL — module `../layoutRegistry` not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/layoutRegistry.ts`. Reuse `SystemId`, `ImportRequirement`, `ImportSpec` from `componentApiRegistry.ts`; reuse `normalizeColumns`/`nativeColumnsFor` from `layoutResolver.ts`.

```ts
/**
 * LayoutRegistry — sibling to componentApiRegistry. Turns an abstract
 * layout primitive (grid/stack/row/appShell/split) into REAL per-DS
 * layout-component JSX with children recursion, for render + export.
 * Same honesty rule: never fabricate an API. Fluent v9 ships no layout
 * component, so it emits idiomatic token-driven CSS, labeled as such.
 */
import type { SystemId, ImportRequirement, ImportSpec } from "./componentApiRegistry";
import { normalizeColumns, nativeColumnsFor } from "./layoutResolver";

export type LayoutPrimitive = "grid" | "stack" | "row" | "appShell" | "split";

/** A pre-rendered child + its canonical 12-fr span and optional shell region. */
export interface LayoutChild {
  jsx: string;
  span?: number; // canonical 12-fr; undefined => full native row
  region?: "header" | "sidenav" | "main" | "footer";
}

export interface LayoutApiEntry {
  imports: ImportRequirement;
  toJsx: (props: Record<string, unknown>, children: LayoutChild[]) => string;
}

const num = (v: unknown, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/* ── SALT — @salt-ds/core ─────────────────────────────────────────── */
const SALT_CORE = "@salt-ds/core";
const SALT: Partial<Record<LayoutPrimitive, LayoutApiEntry>> = {
  grid: {
    imports: { from: SALT_CORE, names: ["GridLayout", "GridItem"] },
    toJsx: (p, children) => {
      const cols = num(p.columns, 12);
      const gap = num(p.gap, 3);
      const items = children
        .map((c) => `<GridItem colSpan={${normalizeColumns(c.span ?? 12, cols)}}>${c.jsx}</GridItem>`)
        .join("");
      return `<GridLayout columns={${cols}} gap={${gap}}>${items}</GridLayout>`;
    },
  },
  stack: {
    imports: { from: SALT_CORE, names: ["StackLayout"] },
    toJsx: (p, children) =>
      `<StackLayout gap={${num(p.gap, 3)}}>${children.map((c) => c.jsx).join("")}</StackLayout>`,
  },
  row: {
    imports: { from: SALT_CORE, names: ["FlexLayout"] },
    toJsx: (p, children) =>
      `<FlexLayout gap={${num(p.gap, 3)}}>${children.map((c) => c.jsx).join("")}</FlexLayout>`,
  },
};

const LAYOUT_REGISTRY: Record<SystemId, Partial<Record<LayoutPrimitive, LayoutApiEntry>>> = {
  salt: SALT,
  m3: {},      // Task 3
  fluent: {},  // Task 5
  carbon: {},  // Task 4
  uoaui: {},   // Task 6
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
    names.size
      ? `import { ${[...names].sort().join(", ")} } from "${from}";`
      : `import "${from}";`,
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/layoutRegistry.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/layoutRegistry.ts src/lib/__tests__/layoutRegistry.test.ts
git commit -F- <<'MSG'
feat(layout): layout registry scaffold + Salt grid/stack/row

LAYOUT_REGISTRY sibling to componentApiRegistry: abstract primitive ->
real DS layout JSX with children recursion. Salt seeded
(GridLayout/GridItem, StackLayout, FlexLayout). resolveLayoutApi /
layoutToJsx / collectLayoutImports.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 3: M3 (MUI) grid/stack/row

**Files:** Modify `src/lib/layoutRegistry.ts` (fill `m3: {}`); Test: append to `layoutRegistry.test.ts`.

- [ ] **Step 1: Write the failing test**

```ts
describe("layoutRegistry — M3 emits real @mui/material layout", () => {
  it("grid emits Grid container + Grid size (12-col)", () => {
    const jsx = layoutToJsx("m3", "grid", { gap: 2 }, [child("<Card>A</Card>", 6)])!;
    expect(jsx).toContain("<Grid container spacing={2}>");
    expect(jsx).toContain("<Grid size={6}><Card>A</Card></Grid>");
  });
  it("stack/row emit MUI Stack with direction", () => {
    expect(layoutToJsx("m3", "stack", {}, [child("<X/>")])!).toContain("<Stack");
    expect(layoutToJsx("m3", "row", {}, [child("<X/>")])!).toContain('direction="row"');
  });
  it("collects MUI layout imports", () => {
    expect(collectLayoutImports("m3", ["grid", "stack"])).toContain('import { Grid, Stack } from "@mui/material";');
  });
});
```

- [ ] **Step 2: Run** `npx vitest run src/lib/__tests__/layoutRegistry.test.ts -t "M3 emits"` → FAIL (m3 empty).

- [ ] **Step 3: Implement** — replace `m3: {},` with:

```ts
  m3: {
    grid: {
      imports: { from: "@mui/material", names: ["Grid"] },
      toJsx: (p, children) => {
        const items = children
          .map((c) => `<Grid size={${normalizeColumns(c.span ?? 12, 12)}}>${c.jsx}</Grid>`)
          .join("");
        return `<Grid container spacing={${num(p.gap, 2)}}>${items}</Grid>`;
      },
    },
    stack: {
      imports: { from: "@mui/material", names: ["Stack"] },
      toJsx: (p, children) => `<Stack spacing={${num(p.gap, 2)}}>${children.map((c) => c.jsx).join("")}</Stack>`,
    },
    row: {
      imports: { from: "@mui/material", names: ["Stack"] },
      toJsx: (p, children) =>
        `<Stack direction="row" spacing={${num(p.gap, 2)}}>${children.map((c) => c.jsx).join("")}</Stack>`,
    },
  },
```

- [ ] **Step 4: Run** → PASS. **Step 5: Commit** `feat(layout): M3 (MUI) grid/stack/row layout registry`.

---

### Task 4: Carbon grid/stack/row (16-col normalization)

**Files:** Modify `src/lib/layoutRegistry.ts` (fill `carbon: {}`); Test: append.

- [ ] **Step 1: Write the failing test**

```ts
describe("layoutRegistry — Carbon emits real @carbon/react layout (16-col)", () => {
  it("grid emits Grid + Column with 16-col-normalized span", () => {
    const jsx = layoutToJsx("carbon", "grid", {}, [child("<Tile>A</Tile>", 6)])!;
    expect(jsx).toContain("<Grid>");
    expect(jsx).toContain("<Column lg={8}><Tile>A</Tile></Column>"); // 6/12*16 = 8
  });
  it("stack emits Carbon Stack with gap", () => {
    expect(layoutToJsx("carbon", "stack", { gap: 5 }, [child("<X/>")])!).toContain("<Stack gap={5}>");
  });
  it("collects Carbon layout imports", () => {
    expect(collectLayoutImports("carbon", ["grid", "stack"])).toContain('import { Column, Grid, Stack } from "@carbon/react";');
  });
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** — replace `carbon: {},`:

```ts
  carbon: {
    grid: {
      imports: { from: "@carbon/react", names: ["Grid", "Column"] },
      toJsx: (_p, children) => {
        const items = children
          .map((c) => `<Column lg={${normalizeColumns(c.span ?? 12, 16)}}>${c.jsx}</Column>`)
          .join("");
        return `<Grid>${items}</Grid>`;
      },
    },
    stack: {
      imports: { from: "@carbon/react", names: ["Stack"] },
      toJsx: (p, children) => `<Stack gap={${num(p.gap, 5)}}>${children.map((c) => c.jsx).join("")}</Stack>`,
    },
    row: {
      imports: { from: "@carbon/react", names: ["Stack"] },
      toJsx: (p, children) =>
        `<Stack orientation="horizontal" gap={${num(p.gap, 5)}}>${children.map((c) => c.jsx).join("")}</Stack>`,
    },
  },
```

- [ ] **Step 4: Run** → PASS. **Step 5: Commit** `feat(layout): Carbon grid/stack/row (16-col normalized)`.

---

### Task 5: Fluent grid/stack/row (idiomatic, no layout component)

**Files:** Modify `src/lib/layoutRegistry.ts` (fill `fluent: {}`); Test: append.

> Honesty: Fluent v9 ships no `Grid`/`Stack`. Emit token-driven CSS via `tokens`, labeled. This satisfies "let the DS define it" using the DS's idiomatic layout, not a fabricated component.

- [ ] **Step 1: Write the failing test**

```ts
describe("layoutRegistry — Fluent emits idiomatic token-driven layout", () => {
  it("grid emits a CSS grid using Fluent spacing tokens", () => {
    const jsx = layoutToJsx("fluent", "grid", {}, [child("<Card>A</Card>", 6)])!;
    expect(jsx).toContain('display: "grid"');
    expect(jsx).toContain("gridColumn: \"span 6\"");
    expect(jsx).toContain("tokens.spacingHorizontalM");
  });
  it("collects the Fluent tokens import", () => {
    expect(collectLayoutImports("fluent", ["grid"])).toContain('import { tokens } from "@fluentui/react-components";');
  });
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** — replace `fluent: {},`:

```ts
  fluent: {
    grid: {
      imports: { from: "@fluentui/react-components", names: ["tokens"] },
      toJsx: (_p, children) => {
        const items = children
          .map(
            (c) =>
              `<div style={{ gridColumn: "span ${normalizeColumns(c.span ?? 12, 12)}" }}>${c.jsx}</div>`,
          )
          .join("");
        return `<div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: tokens.spacingHorizontalM }}>${items}</div>`;
      },
    },
    stack: {
      imports: { from: "@fluentui/react-components", names: ["tokens"] },
      toJsx: (_p, children) =>
        `<div style={{ display: "flex", flexDirection: "column", gap: tokens.spacingVerticalM }}>${children
          .map((c) => c.jsx)
          .join("")}</div>`,
    },
    row: {
      imports: { from: "@fluentui/react-components", names: ["tokens"] },
      toJsx: (_p, children) =>
        `<div style={{ display: "flex", gap: tokens.spacingHorizontalM }}>${children.map((c) => c.jsx).join("")}</div>`,
    },
  },
```

- [ ] **Step 4: Run** → PASS. **Step 5: Commit** `feat(layout): Fluent idiomatic token-driven grid/stack/row`.

---

### Task 6: uoaui grid/stack/row (className + token CSS)

**Files:** Modify `src/lib/layoutRegistry.ts` (fill `uoaui: {}`); add `.a-grid/.a-stack/.a-row` CSS to `src/data/uoaui/uoaui-documentation.jsx` `uoauiBuildCSS`; Test: append.

- [ ] **Step 1: Write the failing test**

```ts
describe("layoutRegistry — uoaui emits a-* className layout", () => {
  it("grid emits .a-grid with span on items", () => {
    const jsx = layoutToJsx("uoaui", "grid", {}, [child("<div className='a-card'>A</div>", 6)])!;
    expect(jsx).toContain('className="a-grid"');
    expect(jsx).toContain('gridColumn: "span 6"');
  });
  it("uoaui layout import is a side-effect stylesheet (no named imports)", () => {
    // uoaui has no npm package; layout CSS ships with the global a-* stylesheet,
    // so collectLayoutImports yields no import line for uoaui layout.
    expect(collectLayoutImports("uoaui", ["grid"])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** — replace `uoaui: {},`:

```ts
  uoaui: {
    grid: {
      imports: [],
      toJsx: (_p, children) => {
        const items = children
          .map(
            (c) => `<div style={{ gridColumn: "span ${normalizeColumns(c.span ?? 12, 12)}" }}>${c.jsx}</div>`,
          )
          .join("");
        return `<div className="a-grid">${items}</div>`;
      },
    },
    stack: { imports: [], toJsx: (_p, children) => `<div className="a-stack">${children.map((c) => c.jsx).join("")}</div>` },
    row: { imports: [], toJsx: (_p, children) => `<div className="a-row">${children.map((c) => c.jsx).join("")}</div>` },
  },
```

`collectLayoutImports` must treat `imports: []` (empty array) as "no imports". Update the loop: `specsOf([])` returns `[]`, so no package is added — already correct. Verify the empty-array case yields `[]` (no side-effect line, since there is no `from`).

Add to `uoauiBuildCSS` in `src/data/uoaui/uoaui-documentation.jsx` (token-driven, glass-aware):

```css
.a-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: var(--a-space-3, 12px); }
.a-stack { display: flex; flex-direction: column; gap: var(--a-space-3, 12px); }
.a-row { display: flex; gap: var(--a-space-3, 12px); }
```

- [ ] **Step 4: Run** → PASS. **Step 5: Commit** `feat(layout): uoaui a-* className grid/stack/row + token CSS`.

---

### Task 7: Phase 0 green gate

- [ ] **Step 1: Run the full layout suites**

Run: `npx vitest run src/lib/__tests__/layoutRegistry.test.ts src/lib/__tests__/layoutResolver.test.ts`
Expected: PASS (all).

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b --noEmit` (or the repo's typecheck script)
Expected: 0 errors.

- [ ] **Step 3: Full suite (regression)**

Run: `npm test`
Expected: no new failures vs main.

- [ ] **Step 4: Open PR** (never auto-merge — owner go required per shipping rules)

```bash
git push -u origin <branch>
gh pr create --base main --title "feat(layout): DS-owned layout registry (Phase 0 scaffold)" --body-file -
```

---

## PHASES 1–4 — sequenced roadmap (detail once Phase 0 interfaces are merged)

Each is its own PR, verified before the next. `builder.css` one-PR-in-flight race rule applies. Detailed TDD steps authored after Phase 0 fixes `LayoutChild`/`layoutToJsx` signatures.

- **Phase 1 — Carbon gallery proof.** Add `appShell` (UIShell/Header/SideNav/Content) + `split` primitives for Carbon. Author 8 shared DS-agnostic pattern defs (App Shell, Data Table Page, Form, List+Detail, Login, Search, Settings, Wizard) as a new `src/data/patterns.ts`. Re-render Carbon gallery from defs via registry. **Owner eyeball vs real IBM Carbon.** Oracle: visual + Code-tab == preview.
- **Phase 2 — Gallery, remaining 4 DS.** Salt (`BorderLayout`/`SplitLayout`), M3 (`Box` regions), Fluent (region `makeStyles`), uoaui (`.a-shell`). Render all gallery patterns from the shared defs; delete the 40 hand-coded `Pat*`. Fanned-out workflow + per-DS adversarial visual verify.
- **Phase 3 — Builder resolver repoint.** `ComponentRenderer` mounts DS layout components in preview/present; edit mode keeps the transparent passthrough grid (no DS box-model). Edit==preview screenshot gate per DS + drag-resize/reorder regression check. Resolve open question: do the 5 `builderTemplates` re-author to canonical patterns or inherit the repointed resolver.
- **Phase 4 — Export + Code-tab generation.** `reactExporter` children recursion + `collectLayoutImports` wired into `collectImports`. Code tab generated from pattern def + registry. Oracle: `scripts/verify-exports.sh` builds all 5 DS with real layout imports.

---

## Self-Review

- **Spec coverage:** registry layer (Tasks 2–6) ✓; 12-fr normalization (Task 1) ✓; render path (Phase 3) ✓; export + children recursion (Phase 4) ✓; gallery 40→8 (Phases 1–2) ✓; Code-tab generation (Phase 4) ✓; builder editable-model + no-padding constraint (Phase 3, gated) ✓; Fluent honesty (Task 5) ✓; per-DS column normalization (Task 1, Carbon 16) ✓.
- **Placeholder scan:** Phase 0 has complete code in every step. Phases 1–4 are explicitly roadmap-resolution (interfaces not yet locked), per the writing-plans rule against fabricating code for tasks whose types aren't defined — they get full TDD detail after Phase 0 merges.
- **Type consistency:** `LayoutChild { jsx, span?, region? }`, `layoutToJsx(ds, primitive, props, children)`, `collectLayoutImports(ds, primitives[])`, `resolveLayoutApi(ds, primitive)` used identically across all tasks. `normalizeColumns(fr, nativeCols)` / `nativeColumnsFor(ds)` signatures consistent. `SystemId` sourced from `componentApiRegistry.ts:29`.
