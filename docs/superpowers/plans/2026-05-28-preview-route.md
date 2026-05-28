# `/preview/[interface]/[ds]` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/preview/[interface]/[ds]` — a public, chrome-free route that renders any of 30 interface × design-system combinations for marketing screenshot capture.

**Architecture:** Pure-function param resolver (`previewRoute.ts`) consumed by a thin Next.js route page. Reuses `canonicalDesignSystem` / `canonicalInterfaceType` / `canonicalBuilderMode` from `src/lib/dsParam.ts` (#150) and `<StandalonePreview />` (with a new `bare` prop) from `PreviewPanel.tsx`. Adds 4 new templates to `builderTemplates.ts` so every InterfaceType has a non-empty preview. Adds `preview` to middleware bypass list (STOP-class, explicit go required).

**Tech Stack:** Next.js 16 App Router, React 18, Zustand store (`useBuilder`), Vitest for tests.

---

## File Structure

| File | Purpose |
|---|---|
| `src/lib/builderTemplates.ts` *(modify)* | Add 4 new templates + `getFirstTemplateForInterface` helper |
| `src/lib/__tests__/builderTemplates.test.ts` *(new)* | Test the helper + each new template's shape |
| `src/lib/previewRoute.ts` *(new)* | Pure `resolvePreviewParams` function — pulled out for testability |
| `src/lib/__tests__/previewRoute.test.ts` *(new)* | Test the resolver against the canonicalize-and-lookup flow |
| `src/components/builder/PreviewPanel.tsx` *(modify)* | Add optional `bare?: boolean` prop to `StandalonePreview` |
| `src/app/preview/[interface]/[ds]/page.tsx` *(new)* | The thin route page — calls resolver, sets store, renders `<StandalonePreview bare />` |
| `src/middleware.ts` *(modify, STOP-class)* | Add `preview` to matcher exclusion + public-routes conditional |

---

## Task 1: Add `getFirstTemplateForInterface` helper to `builderTemplates.ts`

Pure function over the existing `BUILDER_TEMPLATES` lookup. No new templates yet — first establish the helper against the current 4-template inventory.

**Files:**
- Modify: `src/lib/builderTemplates.ts`
- Test: `src/lib/__tests__/builderTemplates.test.ts` *(new)*

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/builderTemplates.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getFirstTemplateForInterface, BUILDER_TEMPLATES } from "../builderTemplates";

describe("getFirstTemplateForInterface", () => {
  it("returns the alphabetically-first dashboard template", () => {
    const t = getFirstTemplateForInterface("dashboard");
    expect(t).not.toBeNull();
    expect(t!.interfaceType).toBe("dashboard");
    // alphabetically-first of {analytics-dashboard, crm-contacts}
    expect(t!.id).toBe("analytics-dashboard");
  });

  it("returns the alphabetically-first form template", () => {
    const t = getFirstTemplateForInterface("form");
    expect(t).not.toBeNull();
    expect(t!.interfaceType).toBe("form");
    // alphabetically-first of {login-flow, settings-page}
    expect(t!.id).toBe("login-flow");
  });

  it("returns null for interfaces with no matching template", () => {
    expect(getFirstTemplateForInterface("landing")).toBeNull();
    expect(getFirstTemplateForInterface("ecommerce")).toBeNull();
    expect(getFirstTemplateForInterface("blog")).toBeNull();
    expect(getFirstTemplateForInterface("portfolio")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/builderTemplates.test.ts`
Expected: FAIL with "getFirstTemplateForInterface is not exported"

- [ ] **Step 3: Implement the helper**

In `src/lib/builderTemplates.ts`, after the existing `getTemplate` function (around line 244 in the current source), add:

```ts
/**
 * Returns the alphabetically-first template whose `interfaceType` matches.
 * Returns null when no template exists for that interface type.
 * Used by the /preview/<interface>/<ds> route to pick a deterministic
 * template per interface.
 */
export function getFirstTemplateForInterface(
  interfaceType: InterfaceType,
): BuilderTemplate | null {
  const matches = Object.values(BUILDER_TEMPLATES)
    .filter((t) => t.interfaceType === interfaceType)
    .sort((a, b) => a.id.localeCompare(b.id));
  return matches[0] ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/builderTemplates.test.ts`
Expected: PASS — all 3 cases green

- [ ] **Step 5: Commit**

```bash
git add src/lib/builderTemplates.ts src/lib/__tests__/builderTemplates.test.ts
git commit -m "feat(templates): add getFirstTemplateForInterface helper"
```

---

## Task 2: Add the 4 new templates (one per missing interface)

Adds `marketing-landing`, `product-page`, `article`, `case-study-grid` templates so all 6 InterfaceTypes resolve. Each is ~50 lines of block definitions matching the existing `BuilderTemplate` shape.

**Files:**
- Modify: `src/lib/builderTemplates.ts`
- Test: `src/lib/__tests__/builderTemplates.test.ts` *(extend)*

- [ ] **Step 1: Write the failing test (extend Task 1's file)**

Append to `src/lib/__tests__/builderTemplates.test.ts`:

```ts
describe("new interface templates", () => {
  it("returns marketing-landing for landing", () => {
    const t = getFirstTemplateForInterface("landing");
    expect(t).not.toBeNull();
    expect(t!.id).toBe("marketing-landing");
    expect(t!.interfaceType).toBe("landing");
    expect(t!.body.length).toBeGreaterThan(0);
    expect(t!.header.length).toBeGreaterThan(0);
    expect(t!.footer.length).toBeGreaterThan(0);
  });

  it("returns product-page for ecommerce", () => {
    const t = getFirstTemplateForInterface("ecommerce");
    expect(t).not.toBeNull();
    expect(t!.id).toBe("product-page");
  });

  it("returns article for blog", () => {
    const t = getFirstTemplateForInterface("blog");
    expect(t).not.toBeNull();
    expect(t!.id).toBe("article");
  });

  it("returns case-study-grid for portfolio", () => {
    const t = getFirstTemplateForInterface("portfolio");
    expect(t).not.toBeNull();
    expect(t!.id).toBe("case-study-grid");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/builderTemplates.test.ts`
Expected: FAIL on the 4 new tests — `getFirstTemplateForInterface("landing")` etc. still return null.

- [ ] **Step 3: Extend `VALID_TEMPLATE_IDS`**

In `src/lib/builderTemplates.ts`, change the existing array:

```ts
export const VALID_TEMPLATE_IDS = [
  "analytics-dashboard",
  "settings-page",
  "crm-contacts",
  "login-flow",
  "marketing-landing",
  "product-page",
  "article",
  "case-study-grid",
] as const;
```

- [ ] **Step 4: Add `marketing-landing` template definition**

Add this constant in `builderTemplates.ts` next to the existing template constants (the existing file already defines templates with `interfaceType` near lines 69-225):

```ts
const MARKETING_LANDING_TEMPLATE: BuilderTemplate = {
  id: "marketing-landing",
  label: "Marketing landing",
  desc: "Hero, 3-card feature grid, testimonial, footer.",
  icon: "rocket_launch",
  interfaceType: "landing",
  selectedComponents: ["buttons", "cards", "hero"],
  header: [
    { id: tid("ml-hdr"), type: "AppBrand", props: { label: "Acme", tone: "primary" } },
  ],
  sidebar: [],
  body: [
    {
      id: tid("ml-hero"),
      type: "LayoutGroup",
      props: {
        direction: "stack",
        gap: 16,
        padding: 32,
        align: "center",
      },
      layout: { width: "fill" },
      children: [
        { id: tid("ml-hero-eyebrow"), type: "StatusPill", props: { label: "NEW · 2026 RELEASE", tone: "accent" } },
        { id: tid("ml-hero-title"), type: "DemoHeading", props: { title: "Ship faster with one source of truth", level: 1 } },
        { id: tid("ml-hero-sub"), type: "DemoParagraph", props: { text: "Acme replaces five tools with one. Designed for teams that ship daily." } },
        { id: tid("ml-hero-cta"), type: "PrimaryButton", props: { label: "Start free trial" } },
      ],
    },
    {
      id: tid("ml-feat"),
      type: "LayoutGroup",
      props: { direction: "row", gap: 16, padding: 32 },
      layout: { width: "fill" },
      children: [
        { id: tid("ml-feat-1"), type: "FeatureCard", props: { title: "Real-time sync", body: "Every change reflected across surfaces instantly." }, layout: { width: "fill" } },
        { id: tid("ml-feat-2"), type: "FeatureCard", props: { title: "Built-in audit", body: "Every diff tracked, every action attributable." }, layout: { width: "fill" } },
        { id: tid("ml-feat-3"), type: "FeatureCard", props: { title: "Token-aware", body: "Pull from your design system at any layer." }, layout: { width: "fill" } },
      ],
    },
    {
      id: tid("ml-quote"),
      type: "Testimonial",
      props: {
        quote: "We cut our handoff time by 70% in the first month.",
        author: "Maya Chen",
        role: "Design Engineering Lead, Northwind",
      },
      layout: { width: "fill" },
    },
  ],
  footer: [
    { id: tid("ml-ft"), type: "FooterText", props: { text: "© 2026 Acme · Built with uoaui" } },
  ],
  aiResponse: "Marketing landing applied. Hero, three feature cards, testimonial, footer.",
};
```

- [ ] **Step 5: Add `product-page` template definition**

```ts
const PRODUCT_PAGE_TEMPLATE: BuilderTemplate = {
  id: "product-page",
  label: "Product page",
  desc: "Product gallery, info, add-to-cart, reviews.",
  icon: "shopping_bag",
  interfaceType: "ecommerce",
  selectedComponents: ["cards", "buttons", "tables"],
  header: [
    { id: tid("pp-hdr"), type: "AppBrand", props: { label: "Acme Shop", tone: "primary" } },
    { id: tid("pp-status"), type: "StatusPill", props: { label: "FREE SHIPPING", tone: "positive" } },
  ],
  sidebar: [],
  body: [
    {
      id: tid("pp-row"),
      type: "LayoutGroup",
      props: { direction: "row", gap: 24, padding: 32 },
      layout: { width: "fill" },
      children: [
        { id: tid("pp-gallery"), type: "MediaPlaceholder", props: { label: "Product image" }, layout: { width: "50%" } },
        {
          id: tid("pp-info"),
          type: "LayoutGroup",
          props: { direction: "stack", gap: 12, padding: 0 },
          layout: { width: "50%" },
          children: [
            { id: tid("pp-title"), type: "DemoHeading", props: { title: "Vega Lounge Chair", level: 1 } },
            { id: tid("pp-price"), type: "DemoHeading", props: { title: "$1,240", level: 2 } },
            { id: tid("pp-desc"), type: "DemoParagraph", props: { text: "Walnut frame, hand-stitched leather seat, made to order. Lead time 6-8 weeks." } },
            { id: tid("pp-cta"), type: "PrimaryButton", props: { label: "Add to cart" } },
            { id: tid("pp-cta2"), type: "SecondaryButton", props: { label: "Save for later" } },
          ],
        },
      ],
    },
    {
      id: tid("pp-reviews"),
      type: "LayoutGroup",
      props: { direction: "stack", gap: 16, padding: 32 },
      layout: { width: "fill" },
      children: [
        { id: tid("pp-reviews-title"), type: "DemoHeading", props: { title: "Reviews", level: 2 } },
        { id: tid("pp-review-1"), type: "Testimonial", props: { quote: "Comfortable and beautifully made.", author: "Aisha O.", role: "Verified buyer" } },
      ],
    },
  ],
  footer: [
    { id: tid("pp-ft"), type: "FooterText", props: { text: "© 2026 Acme Shop · Returns within 30 days" } },
  ],
  aiResponse: "Product page applied. Gallery, info, add-to-cart, reviews, footer.",
};
```

- [ ] **Step 6: Add `article` template definition**

```ts
const ARTICLE_TEMPLATE: BuilderTemplate = {
  id: "article",
  label: "Article",
  desc: "Title, meta, paragraphs, code, image, footer.",
  icon: "article",
  interfaceType: "blog",
  selectedComponents: ["typography"],
  header: [
    { id: tid("art-hdr"), type: "AppBrand", props: { label: "Acme Journal", tone: "primary" } },
  ],
  sidebar: [],
  body: [
    {
      id: tid("art-body"),
      type: "LayoutGroup",
      props: { direction: "stack", gap: 16, padding: 32, align: "center" },
      layout: { width: "fill" },
      children: [
        { id: tid("art-meta"), type: "StatusPill", props: { label: "ENGINEERING · 5 MIN READ", tone: "neutral" } },
        { id: tid("art-title"), type: "DemoHeading", props: { title: "What we learned from rebuilding our token pipeline", level: 1 } },
        { id: tid("art-byline"), type: "DemoParagraph", props: { text: "By Maya Chen · 2026-05-21" } },
        { id: tid("art-p1"), type: "DemoParagraph", props: { text: "We replaced a hand-curated CSS file with a token graph last quarter. The first month was rough; the next three were clarifying. Here is what changed." } },
        { id: tid("art-code"), type: "MediaPlaceholder", props: { label: "Code block: tokens.json schema" } },
        { id: tid("art-p2"), type: "DemoParagraph", props: { text: "The hardest part was naming. Every team called the same value something different until we wrote them down in one place. After that, the implementation was mostly mechanical." } },
        { id: tid("art-img"), type: "MediaPlaceholder", props: { label: "Diagram: token resolution flow" } },
      ],
    },
  ],
  footer: [
    { id: tid("art-ft"), type: "FooterText", props: { text: "© 2026 Acme Journal · Subscribe at acme.dev" } },
  ],
  aiResponse: "Article applied. Title, meta, body paragraphs, code block, diagram, footer.",
};
```

- [ ] **Step 7: Add `case-study-grid` template definition**

```ts
const CASE_STUDY_GRID_TEMPLATE: BuilderTemplate = {
  id: "case-study-grid",
  label: "Case-study grid",
  desc: "Portfolio grid of 6 case studies.",
  icon: "grid_view",
  interfaceType: "portfolio",
  selectedComponents: ["cards"],
  header: [
    { id: tid("cs-hdr"), type: "AppBrand", props: { label: "Maya Chen", tone: "primary" } },
  ],
  sidebar: [],
  body: [
    {
      id: tid("cs-intro"),
      type: "LayoutGroup",
      props: { direction: "stack", gap: 12, padding: 32 },
      layout: { width: "fill" },
      children: [
        { id: tid("cs-eyebrow"), type: "StatusPill", props: { label: "DESIGN ENGINEER", tone: "accent" } },
        { id: tid("cs-title"), type: "DemoHeading", props: { title: "Selected work", level: 1 } },
      ],
    },
    {
      id: tid("cs-row-1"),
      type: "LayoutGroup",
      props: { direction: "row", gap: 16, padding: 32 },
      layout: { width: "fill" },
      children: [
        { id: tid("cs-1"), type: "FeatureCard", props: { title: "Northwind dashboards", body: "Series of executive dashboards for an analytics suite." }, layout: { width: "fill" } },
        { id: tid("cs-2"), type: "FeatureCard", props: { title: "Acme tokens", body: "Token graph + Figma sync for a multi-system DS." }, layout: { width: "fill" } },
        { id: tid("cs-3"), type: "FeatureCard", props: { title: "Vega marketplace", body: "End-to-end e-commerce redesign across 4 surfaces." }, layout: { width: "fill" } },
      ],
    },
    {
      id: tid("cs-row-2"),
      type: "LayoutGroup",
      props: { direction: "row", gap: 16, padding: 32 },
      layout: { width: "fill" },
      children: [
        { id: tid("cs-4"), type: "FeatureCard", props: { title: "Lumen onboarding", body: "Multi-step wizard with progressive disclosure." }, layout: { width: "fill" } },
        { id: tid("cs-5"), type: "FeatureCard", props: { title: "Polaris CMS", body: "Editorial workflow for a publishing platform." }, layout: { width: "fill" } },
        { id: tid("cs-6"), type: "FeatureCard", props: { title: "Helio settings", body: "Granular permission UI for a B2B product." }, layout: { width: "fill" } },
      ],
    },
  ],
  footer: [
    { id: tid("cs-ft"), type: "FooterText", props: { text: "© 2026 Maya Chen · hello@mayachen.dev" } },
  ],
  aiResponse: "Case-study grid applied. Six work samples in a 2×3 grid.",
};
```

- [ ] **Step 8: Register the new templates in the `BUILDER_TEMPLATES` record**

The existing record (around line 232) currently looks roughly like:
```ts
export const BUILDER_TEMPLATES: Record<TemplateId, BuilderTemplate> = {
  "analytics-dashboard": ANALYTICS_DASHBOARD_TEMPLATE,
  "settings-page": SETTINGS_PAGE_TEMPLATE,
  "crm-contacts": CRM_CONTACTS_TEMPLATE,
  "login-flow": LOGIN_FLOW_TEMPLATE,
};
```

Extend it to:
```ts
export const BUILDER_TEMPLATES: Record<TemplateId, BuilderTemplate> = {
  "analytics-dashboard": ANALYTICS_DASHBOARD_TEMPLATE,
  "settings-page": SETTINGS_PAGE_TEMPLATE,
  "crm-contacts": CRM_CONTACTS_TEMPLATE,
  "login-flow": LOGIN_FLOW_TEMPLATE,
  "marketing-landing": MARKETING_LANDING_TEMPLATE,
  "product-page": PRODUCT_PAGE_TEMPLATE,
  "article": ARTICLE_TEMPLATE,
  "case-study-grid": CASE_STUDY_GRID_TEMPLATE,
};
```

(If the existing record literal differs in style, match it — but the result must include all 8 ids.)

- [ ] **Step 9: Run all tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/builderTemplates.test.ts`
Expected: PASS — all 7 cases (3 from Task 1 + 4 new) green.

Run full suite: `npm run test`
Expected: 90/90 pass (87 baseline + 3 new from Task 1 + 4 new from Task 2 — adjust if other test changes intervened).

- [ ] **Step 10: Commit**

```bash
git add src/lib/builderTemplates.ts src/lib/__tests__/builderTemplates.test.ts
git commit -m "feat(templates): add 4 templates for landing/ecommerce/blog/portfolio"
```

---

## Task 3: Pure `resolvePreviewParams` function in `src/lib/previewRoute.ts`

Pulls all the URL-param-to-state translation into a pure function. Lets the route page stay thin and lets us unit-test the resolution logic without rendering React.

**Files:**
- Create: `src/lib/previewRoute.ts`
- Test: `src/lib/__tests__/previewRoute.test.ts` *(new)*

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/previewRoute.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolvePreviewParams } from "../previewRoute";

describe("resolvePreviewParams", () => {
  it("resolves a valid dashboard+salt combo with defaults", () => {
    const r = resolvePreviewParams({ interface: "dashboard", ds: "salt" }, {});
    expect(r).not.toBeNull();
    expect(r!.interfaceType).toBe("dashboard");
    expect(r!.ds).toBe("salt");
    expect(r!.mode).toBe("dark");
    expect(r!.density).toBe("medium");
    expect(r!.template.id).toBe("analytics-dashboard");
  });

  it("resolves md3 alias to m3", () => {
    const r = resolvePreviewParams({ interface: "form", ds: "md3" }, {});
    expect(r).not.toBeNull();
    expect(r!.ds).toBe("m3");
  });

  it("honours mode query param", () => {
    const r = resolvePreviewParams({ interface: "blog", ds: "fluent" }, { mode: "light" });
    expect(r).not.toBeNull();
    expect(r!.mode).toBe("light");
  });

  it("honours density query param", () => {
    const r = resolvePreviewParams({ interface: "blog", ds: "fluent" }, { density: "touch" });
    expect(r).not.toBeNull();
    expect(r!.density).toBe("touch");
  });

  it("falls back to default density when query value is unknown", () => {
    const r = resolvePreviewParams({ interface: "blog", ds: "fluent" }, { density: "garbage" });
    expect(r).not.toBeNull();
    expect(r!.density).toBe("medium");
  });

  it("falls back to default mode when query value is unknown", () => {
    const r = resolvePreviewParams({ interface: "blog", ds: "fluent" }, { mode: "garbage" });
    expect(r).not.toBeNull();
    expect(r!.mode).toBe("dark");
  });

  it("returns null for unknown interface", () => {
    expect(resolvePreviewParams({ interface: "xyz", ds: "salt" }, {})).toBeNull();
  });

  it("returns null for unknown ds", () => {
    expect(resolvePreviewParams({ interface: "dashboard", ds: "xyz" }, {})).toBeNull();
  });

  it("covers all 30 interface×ds combos", () => {
    const interfaces = ["dashboard", "landing", "form", "ecommerce", "blog", "portfolio"];
    const dsList = ["salt", "m3", "fluent", "uoaui", "carbon"];
    for (const i of interfaces) {
      for (const d of dsList) {
        const r = resolvePreviewParams({ interface: i, ds: d }, {});
        expect(r, `should resolve ${i}/${d}`).not.toBeNull();
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/previewRoute.test.ts`
Expected: FAIL with "Cannot find module '../previewRoute'".

- [ ] **Step 3: Implement the resolver**

Create `src/lib/previewRoute.ts`:

```ts
import {
  canonicalDesignSystem,
  canonicalInterfaceType,
  canonicalBuilderMode,
} from "./dsParam";
import {
  getFirstTemplateForInterface,
  type BuilderTemplate,
} from "./builderTemplates";
import type {
  DesignSystem,
  InterfaceType,
  BuilderMode,
} from "@/store/useBuilder";

/**
 * Defaults that apply when the URL query is absent or invalid.
 * Marketing screenshots use the brand-dark default unless explicitly
 * overridden. Density mirrors the landing's medium-everywhere setting.
 */
const DEFAULT_MODE: BuilderMode = "dark";
const DEFAULT_DENSITY = "medium";
const KNOWN_DENSITIES = new Set(["high", "medium", "low", "touch"]);

export interface PreviewParams {
  interface: string;
  ds: string;
}

export interface PreviewQuery {
  mode?: string;
  density?: string;
}

export interface ResolvedPreview {
  interfaceType: InterfaceType;
  ds: DesignSystem;
  mode: BuilderMode;
  density: string;
  template: BuilderTemplate;
}

/**
 * Translate `/preview/[interface]/[ds]?mode=&density=` into a
 * fully-resolved preview state, or `null` if the route should 404.
 *
 * The resolver lives separate from the route component so we can
 * unit-test the entire param-resolution flow without rendering React
 * or booting Next.js.
 */
export function resolvePreviewParams(
  params: PreviewParams,
  query: PreviewQuery,
): ResolvedPreview | null {
  const interfaceType = canonicalInterfaceType(params.interface);
  if (!interfaceType) return null;

  const ds = canonicalDesignSystem(params.ds);
  if (!ds) return null;

  const template = getFirstTemplateForInterface(interfaceType);
  if (!template) return null;

  const modeFromQuery = canonicalBuilderMode(query.mode);
  const mode: BuilderMode = modeFromQuery ?? DEFAULT_MODE;

  const densityFromQuery =
    query.density && KNOWN_DENSITIES.has(query.density.toLowerCase())
      ? query.density.toLowerCase()
      : DEFAULT_DENSITY;

  return {
    interfaceType,
    ds,
    mode,
    density: densityFromQuery,
    template,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/previewRoute.test.ts`
Expected: PASS — all 9 cases green, including the 30-combo sweep.

- [ ] **Step 5: Commit**

```bash
git add src/lib/previewRoute.ts src/lib/__tests__/previewRoute.test.ts
git commit -m "feat(preview): pure resolver for /preview/[interface]/[ds] URL params"
```

---

## Task 4: Add `bare?: boolean` prop to `StandalonePreview`

`StandalonePreview` currently always renders the chrome bar (`.standalone-preview-header` with traffic-light dots + label + DS badge). The marketing route needs to hide it. Backward-compat preserved by defaulting `bare` to `false`.

**Files:**
- Modify: `src/components/builder/PreviewPanel.tsx`

(No new test — the prop is just a conditional render. Visual verification happens in Task 6 manual smoke test.)

- [ ] **Step 1: Change the function signature**

In `src/components/builder/PreviewPanel.tsx` at line 1478, change:

```ts
export function StandalonePreview() {
```

to:

```ts
export interface StandalonePreviewProps {
  /** When true, hide the window chrome bar. Used by the /preview/* route
   *  for marketing screenshot capture where the canvas should fill the
   *  viewport with no UI scaffolding. */
  bare?: boolean;
}

export function StandalonePreview({ bare = false }: StandalonePreviewProps = {}) {
```

- [ ] **Step 2: Wrap the chrome bar in a conditional**

Find the chrome header block (starts around line 1497 with `{/* Window chrome bar */}` followed by `<div className="standalone-preview-header">…</div>`). Wrap that single `<div>` in a conditional:

```tsx
{!bare && (
  <div className="standalone-preview-header">
    {/* ...existing chrome contents unchanged... */}
  </div>
)}
```

- [ ] **Step 3: Run tests to verify the change is non-breaking**

Run: `npm run test`
Expected: 90/90 still pass (no test directly tests StandalonePreview's chrome).

Run: `npx tsc --noEmit`
Expected: clean — the new optional prop with default value preserves all existing callers.

- [ ] **Step 4: Commit**

```bash
git add src/components/builder/PreviewPanel.tsx
git commit -m "feat(preview): add bare prop to StandalonePreview to hide chrome bar"
```

---

## Task 5: The route page `src/app/preview/[interface]/[ds]/page.tsx`

Thin client component. Reads URL params via Next.js, calls the resolver from Task 3, sets store state, renders `<StandalonePreview bare />`.

**Files:**
- Create: `src/app/preview/[interface]/[ds]/page.tsx`

- [ ] **Step 1: Write the route file**

Create `src/app/preview/[interface]/[ds]/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { resolvePreviewParams } from "@/lib/previewRoute";
import { useBuilder } from "@/store/useBuilder";
import { StandalonePreview } from "@/components/builder/PreviewPanel";

/**
 * /preview/[interface]/[ds] — public marketing screenshot route.
 *
 * Reads route + query params, resolves them to a builder state via the
 * pure `resolvePreviewParams` helper, applies that state to the Zustand
 * store, and renders the bare canvas (no chrome). Invalid params 404.
 *
 * The store mutation runs in a useEffect because Zustand's setters are
 * client-only and must not run during SSR.
 */
export default function PreviewRoutePage() {
  const params = useParams<{ interface: string; ds: string }>();
  const search = useSearchParams();
  const [applied, setApplied] = useState(false);

  const resolved = resolvePreviewParams(
    { interface: params.interface, ds: params.ds },
    {
      mode: search.get("mode") ?? undefined,
      density: search.get("density") ?? undefined,
    },
  );

  if (!resolved) {
    notFound();
  }

  useEffect(() => {
    if (!resolved) return;
    const store = useBuilder.getState();
    store.setDesignSystem(resolved.ds);
    store.setInterfaceType(resolved.interfaceType);
    store.setMode(resolved.mode);
    store.setDensity(resolved.density);
    store.setHeaderBlocks(resolved.template.header);
    store.setSidebarBlocks(resolved.template.sidebar);
    store.setBlocks(resolved.template.body);
    store.setFooterBlocks(resolved.template.footer);
    setApplied(true);
  }, [resolved]);

  // Render nothing until the store mutation has run, to avoid a frame
  // of empty canvas before the template applies.
  if (!applied) return null;

  return <StandalonePreview bare />;
}
```

- [ ] **Step 2: Verify TypeScript and build**

Run: `npx tsc --noEmit`
Expected: clean.

Run: `npx eslint src/app/preview --quiet`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/preview/[interface]/[ds]/page.tsx
git commit -m "feat(preview): add /preview/[interface]/[ds] route page"
```

---

## Task 6: Middleware bypass — STOP-class change

`src/middleware.ts` (full source already read at plan-writing time) gates access to non-public routes behind a staging-login cookie. The current public allowlist is `/`, `/login`, `/landing`, `/landing-*`, `/ui-kit`. To make `/preview/[interface]/[ds]` reachable without login, `/preview/*` must join that list.

**This task is STOP-class.** Per `feedback_rules_class_files.md`, middleware changes need explicit per-PR go from Shannon. Prepare the patch and pause for confirmation before applying.

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Prepare the patch (do not commit yet)**

Two changes needed in `src/middleware.ts`:

**Change 1 — line 88, the matcher exclusion regex:**

Before:
```ts
matcher: ["/((?!api|_next|$|landing$|login$|ui-kit$|.*\\.[\\w]+$).*)"],
```

After:
```ts
matcher: ["/((?!api|_next|$|landing$|login$|ui-kit$|preview/|.*\\.[\\w]+$).*)"],
```

**Change 2 — lines 53-62, the public-routes conditional:**

Before:
```ts
if (
  pathname === "/" ||
  pathname === "/login" ||
  pathname === "/landing" ||
  pathname.startsWith("/landing-") ||
  pathname === "/ui-kit"
) {
  return NextResponse.next();
}
```

After:
```ts
if (
  pathname === "/" ||
  pathname === "/login" ||
  pathname === "/landing" ||
  pathname.startsWith("/landing-") ||
  pathname === "/ui-kit" ||
  pathname.startsWith("/preview/")
) {
  return NextResponse.next();
}
```

Both changes are required because the matcher controls which paths run middleware at all, while the conditional controls which run-but-bypass.

- [ ] **Step 2: Save the patch to `/tmp/preview-middleware.patch`**

Run:
```bash
git diff src/middleware.ts > /tmp/preview-middleware.patch
```

Confirm:
```bash
cat /tmp/preview-middleware.patch
```

Expected: a unified diff showing exactly the two changes above.

- [ ] **Step 3: STOP. Ask Shannon to approve.**

> "Middleware change ready in `/tmp/preview-middleware.patch`. This makes every `/preview/[interface]/[ds]` URL **publicly reachable on the internet without login**. Marketing assets only — no PII, no API keys, no user data — but it's a permanent public surface that any future template content will inherit. Approve?"

Wait for explicit go. Do not run Step 4 without it.

- [ ] **Step 4: Apply the patch (after go)**

The two edits described in Step 1 are now in `src/middleware.ts`.

- [ ] **Step 5: Verify TypeScript still passes**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(preview): bypass staging-login for /preview/* marketing routes"
```

---

## Task 7: Manual smoke test + PR

Run the local dev server, verify each of the 30 deep-links renders, then push the branch and open the PR.

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

Expected: Vite/Next picks up changes. Cold compile is 4-5 min per the project notes — be patient.

- [ ] **Step 2: Verify smoke routes**

Open in a browser (or curl headers):

| URL | Expected |
|---|---|
| `http://localhost:3000/preview/dashboard/salt` | Renders Salt-themed dashboard, no chrome |
| `http://localhost:3000/preview/landing/m3` | Renders M3-themed marketing landing |
| `http://localhost:3000/preview/blog/fluent` | Renders Fluent-themed article |
| `http://localhost:3000/preview/portfolio/uoaui` | Renders uoaui-themed case-study grid |
| `http://localhost:3000/preview/dashboard/md3` | Same as `m3` — alias resolves |
| `http://localhost:3000/preview/garbage/salt` | 404 |
| `http://localhost:3000/preview/dashboard/garbage` | 404 |
| `http://localhost:3000/preview/dashboard/salt?mode=light` | Light-mode dashboard |
| `http://localhost:3000/preview/dashboard/salt?density=touch` | Touch density |

Smoke at least one valid URL per interface and one invalid case before claiming the task is done.

- [ ] **Step 3: Run the full test + lint sweep**

Run all in parallel:
- `npm run test`
- `npx tsc --noEmit`
- `npx eslint src --quiet`

All three must be green.

- [ ] **Step 4: Push the branch + open PR**

```bash
git push -u origin feat/preview-route
```

Then:
```bash
gh pr create --base main --title "feat(preview): /preview/[interface]/[ds] marketing route" --body "$(cat <<'EOF'
## Summary

Implements Task #32 from the 2026-05-28 handover. Public, chrome-free route for capturing marketing screenshots of any interface × design-system combination.

- 30 deep-links live (6 interfaces × 5 DSes); 6×5×2 modes = 60 with the `?mode=` query param
- Spec: `docs/superpowers/specs/2026-05-28-preview-route-design.md`
- Plan: `docs/superpowers/plans/2026-05-28-preview-route.md`

## What landed

1. `getFirstTemplateForInterface` helper in `builderTemplates.ts`
2. 4 new templates: `marketing-landing`, `product-page`, `article`, `case-study-grid`
3. Pure `resolvePreviewParams` resolver in `src/lib/previewRoute.ts`
4. `bare?: boolean` prop on `StandalonePreview` (default false, backward-compat preserved)
5. Route page at `src/app/preview/[interface]/[ds]/page.tsx`
6. Middleware bypass for `/preview/*` (STOP-class — approved per separate Shannon go)

## Test plan

- [x] `npm run test` — 87 + N new pass
- [x] `npx tsc --noEmit` — clean
- [x] `npx eslint src --quiet` — 0 errors
- [x] Local smoke of 9 URLs in Step 2 above
- [ ] Vercel preview eyeball: each interface × DS combo in dark, then `?mode=light` for at least one
- [ ] Confirm the `/preview/*` URLs are publicly reachable without login on Vercel preview

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: Final commit if any cleanup**

If the smoke test surfaces anything, fix + commit before merging.

---

## Self-Review

**Spec coverage:** Every section of the spec maps to a task:
- Route shape + URL → Task 5 (route page)
- Architecture → Tasks 3, 5
- 4 new templates → Task 2
- Middleware bypass → Task 6 (STOP-class flagged correctly)
- Error handling → Tasks 3 (resolver returns null), 5 (notFound call)
- Tests → Tasks 1, 2, 3 unit tests; Task 7 manual smoke
- Not-in-scope items → none accidentally pulled in

**Placeholder scan:** No TBDs, no "implement later", no vague "add error handling". Each step shows the exact code to write or run.

**Type consistency:** `getFirstTemplateForInterface` and `BuilderTemplate` referenced consistently across Tasks 1-3. `resolvePreviewParams` signature matches between Task 3 (definition) and Task 5 (call site). `StandalonePreview`'s new `bare` prop type matches between Task 4 (definition) and Task 5 (usage).

**Scope:** Single PR, ~7 hours of focused work — within single-plan scope.

**Ambiguity:** None remaining. Task 6 explicitly STOP-class with the exact patch saved to `/tmp/`.
