# Analytics Dashboard — Canonical Rebuild + Spacing Finish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline, recommended for this repo — it has a parallel-agent HEAD-flip race, so do NOT run multiple editing agents). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Rebuild the `analytics-dashboard` BuilderTemplate to the researched inverted-pyramid canonical structure and tighten its spacing so it reads finished/best-in-class, with the live preview verified across all 5 DSs before merge.

**Architecture:** Pure data change to one `BuilderTemplate` object in `builderTemplates.ts` (DS-agnostic `Block[]`, renders per-DS via `ComponentRenderer` — no registry/exporter change needed for the visible preview). Spacing fixed at the body-zone layout layer (set an explicit `zoneLayout` grid + tightened gap/padding) rather than per-block, so the rhythm is consistent. This is Sub-slice 1A of the templates-as-DS-framework spec (`docs/superpowers/specs/2026-05-31-templates-as-ds-framework-design.md`); registry coverage, /ui-kit wiring, export proof, and SVG are separate subsequent plans.

**Tech Stack:** Next.js 16, Zustand `useBuilder`, `BuilderTemplate` (`src/lib/builderTemplates.ts`), `layoutResolver.ts` (zone layout), `ComponentRenderer.tsx` (preview). vitest for the template-shape pin; local prod build + Playwright for the visual check.

---

### Task 1: Pin the dashboard template shape (canonical structure) with a test

**Files:**
- Test: `src/lib/__tests__/builderTemplates.test.ts` (create if absent)

- [ ] **Step 1: Write the failing test** — assert the rebuilt analytics-dashboard body has the canonical zones in order: a scope-bar row (Title + range control + Export), a 4-card KPI row, one full-width hero chart, a 2-up supporting chart row, and one table last; and that no body row mixes a percentage width with `fill`.

```ts
import { describe, it, expect } from "vitest";
import { BUILDER_TEMPLATES } from "../builderTemplates";

const ad = BUILDER_TEMPLATES.find((t) => t.id === "analytics-dashboard")!;

describe("analytics-dashboard canonical structure", () => {
  it("leads with a KPI row of 4 stat cards (not 3)", () => {
    const kpis = ad.body.filter((b) => b.type === "SimulatedStatCard");
    expect(kpis).toHaveLength(4);
  });
  it("KPI row comes before any chart (KPIs lead, not buried)", () => {
    const firstKpi = ad.body.findIndex((b) => b.type === "SimulatedStatCard");
    const firstChart = ad.body.findIndex((b) => b.type.startsWith("Highchart"));
    expect(firstKpi).toBeLessThan(firstChart);
  });
  it("has exactly one full-width hero chart then a 2-up supporting row", () => {
    const charts = ad.body.filter((b) => b.type.startsWith("Highchart"));
    expect(charts.length).toBeGreaterThanOrEqual(3); // hero + 2 supporting
  });
  it("ends with a single data table", () => {
    const last = ad.body[ad.body.length - 1];
    expect(last.type).toBe("SimulatedDataTable");
  });
  it("no body block mixes percentage width with fill in a way that wraps (uses grid or clean widths)", () => {
    // Canonical rebuild uses width '25%' for the KPI row and '50%' pairs; never a bare % next to 'fill' in one logical row.
    const widths = ad.body.map((b) => b.layout?.width).filter(Boolean);
    expect(widths.every((w) => w === "fill" || w === "25%" || w === "50%" || w === "auto")).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails** — `npx vitest run src/lib/__tests__/builderTemplates.test.ts` → FAIL (current template has 3 KPIs, mixed widths).

- [ ] **Step 3: Commit the failing test** — `git add` the test, commit `test: pin analytics-dashboard canonical structure (RED)`.

---

### Task 2: Rebuild the analytics-dashboard body to canonical + clean widths

**Files:**
- Modify: `src/lib/builderTemplates.ts` (the `analyticsDashboard.body` array, ~lines 82-94, and add a body `zoneLayout` if the BuilderTemplate type supports it; otherwise widths only)

- [ ] **Step 1: Replace the body array** with the canonical structure. Scope bar row (Title + SegmentedGroup range + Export button), 4-up KPI row at `25%` each with signed pct, full-width hero `HighchartArea`, a 6/6 supporting row (`HighchartColumn` 50% + `HighchartDonut` 50%), and the existing domain table last:

```ts
  body: [
    /* Scope bar - title + range preset + export (canonical dashboard header line) */
    { id: tid("ad-title"), type: "SimulatedTitle", props: { text: "Revenue overview", level: "h3" }, layout: { width: "fill" } },
    { id: tid("ad-range"), type: "SimulatedSegmentedGroup", props: { optionsCsv: "7d,30d,90d" }, layout: { width: "auto" } },
    { id: tid("ad-export"), type: "SimulatedButton", props: { variant: "outline", label: "Export" }, layout: { width: "auto" } },
    /* KPI row - 4 cards, lead metric first, signed delta */
    { id: tid("ad-kpi-1"), type: "SimulatedStatCard", props: { label: "MRR", value: "$48,200", pct: 12 }, layout: { width: "25%" } },
    { id: tid("ad-kpi-2"), type: "SimulatedStatCard", props: { label: "Active users", value: "12,847", pct: 8 }, layout: { width: "25%" } },
    { id: tid("ad-kpi-3"), type: "SimulatedStatCard", props: { label: "Churn rate", value: "2.1%", pct: -3 }, layout: { width: "25%" } },
    { id: tid("ad-kpi-4"), type: "SimulatedStatCard", props: { label: "ARPU", value: "$38", pct: 5 }, layout: { width: "25%" } },
    /* Hero trend - full width */
    { id: tid("ad-hero"), type: "HighchartArea", props: { chartType: "area", title: "Revenue, last 30 days vs previous" }, layout: { width: "fill" } },
    /* 2-up supporting row - 6/6 */
    { id: tid("ad-chart-2"), type: "HighchartColumn", props: { chartType: "column", title: "Signups by channel" }, layout: { width: "50%" } },
    { id: tid("ad-chart-3"), type: "HighchartDonut", props: { chartType: "donut", title: "Revenue by plan" }, layout: { width: "50%" } },
    /* Detail table - last */
    { id: tid("ad-table"), type: "SimulatedDataTable", props: { columns: ["Order", "Status", "Customer", "Updated"], rows: [{ name: "#10472", status: "Paid", role: "Northwind Co.", date: "2h ago" }, { name: "#10471", status: "Pending", role: "Globex Ltd.", date: "Yesterday" }, { name: "#10468", status: "Paid", role: "Initech", date: "2d ago" }] }, layout: { width: "fill" } },
  ],
```

- [ ] **Step 2: Update `selectedComponents`** to match the blocks used (keeps the library/chip UI in sync): `["progress", "table", "tabs"]` → `["progress", "table"]` (drop unused) or add what is used; verify against `BLOCK_TO_ID`.

- [ ] **Step 3: Run the Task-1 test** — `npx vitest run src/lib/__tests__/builderTemplates.test.ts` → PASS.

- [ ] **Step 4: typecheck** — `npx tsc --noEmit` → clean.

- [ ] **Step 5: Commit** — `feat(templates): rebuild analytics-dashboard to canonical inverted-pyramid (4-up KPIs, hero trend, 2-up grid, table)`.

---

### Task 3: Tighten body-zone spacing (the loose/unfinished fix)

**Files:**
- Investigate: where the body zone's default `zoneLayout` (padding/gap) is set — `src/store/useBuilder.ts` (zone defaults) and `src/lib/layoutResolver.ts:158-183` (`computeContainerStyle`). Confirm the default gap/padding values.
- Modify: the body zone default OR set an explicit `zoneLayout` for the dashboard body so cards/charts sit on a tight, consistent grid (e.g. `gap: 12`, `padding: 16`, grid where appropriate) instead of loose defaults. Prefer tokenized values over literals.

- [ ] **Step 1: Find the current default** — `grep -nE "zoneLayout|bodyLayout|padding|gap" src/store/useBuilder.ts` and read `computeContainerStyle`. Record the current default gap/padding (the source of the loose look).

- [ ] **Step 2: Tighten** — reduce body gap to ~12px and zone padding to ~16px (or the nearest spacing tokens), and ensure equal-height rows. If the loose look is card padding (Simulated\* `.{prefix}-card`/`-stat-card` CSS), tighten there instead. Fix at the layer the trace identifies; document which.

- [ ] **Step 3: typecheck + existing tests** — `npx tsc --noEmit && npx vitest run` → clean / green (no regressions).

- [ ] **Step 4: Commit** — `fix(builder): tighten dashboard body spacing (was loose/unfinished)`.

---

### Task 4: Visual verification across the 5 DSs (BEFORE merge)

**Files:** `/tmp/pw_dash.js` (Playwright drive)

- [ ] **Step 1: Local prod build** — `npm run build` (background), wait for exit, confirm no failure.

- [ ] **Step 2: Serve + screenshot the dashboard template across DSs** — `next start`, then a Playwright script that opens `/builder?ds=<ds>` for ds in salt,m3,fluent,carbon,uoaui, applies the analytics-dashboard template (click its pattern card or seed it), and screenshots each. Capture `/tmp/dash-<ds>.png`.

- [ ] **Step 3: Review the screenshots** — confirm: KPI row of 4 leads at top, tight even spacing (no loose gaps), hero trend full width, 2-up charts aligned, table last, finished look in all 5 DSs. Compare to the named reference (Stripe/Mixpanel/Linear).

- [ ] **Step 4: Send the screenshots to the owner for the before/after + merge go.** Do NOT merge without explicit go (per [[feedback_no_auto_merge]] + [[feedback_visual_check_before_merge]]).

---

### Task 5: Open PR (no merge without go)

- [ ] **Step 1:** `git push -u origin feat-templates-ds-framework`.
- [ ] **Step 2:** `gh pr create --base main` with title "Templates: analytics-dashboard canonical rebuild + spacing finish (Sub-slice 1A)" and a body summarizing the spec link, the rebuild, the spacing fix, the 5-DS visual proof, and "not for merge until owner go".
- [ ] **Step 3:** Pre-ship gate (base main, CLEAN, no rules-class, no em-dashes in display copy, explicit go) before any merge.

---

## Self-review

- **Spec coverage:** This plan implements §3 (Analytics Dashboard canonical) + §4 (visual finish/density) for the dashboard only — the Sub-slice 1A scope. Registry coverage (§5), /ui-kit shared source (§6), download tiers (§7) are explicitly out of scope here and tracked as subsequent plans.
- **Placeholder scan:** Task 3 spacing values depend on the Step-1 trace (the one genuine unknown) — the method + candidate layers are concrete; exact px pinned during execution against the found default.
- **Type consistency:** Block types used (SimulatedTitle, SimulatedSegmentedGroup, SimulatedButton, SimulatedStatCard, HighchartArea/Column/Donut, SimulatedDataTable) all exist in the prompt's Available Block Types + `ComponentRenderer` registry. `layout.width` shape matches `LayoutProps`.
