# `/preview/[interface]/[ds]` — Marketing screenshot route

**Status:** Approved design. Implementation pending explicit go on middleware bypass (security-class).
**Owner:** Shannon Hecker
**Date:** 2026-05-28
**Original task:** Handover memo 2026-05-28, Task #32 — "`/preview/<comp>/<ds>` route for marketing screenshot capture"

## Goal

A public, chrome-free deep-link surface for capturing marketing screenshots of canonical interface-type × design-system combinations.

Every URL like `/preview/dashboard/salt` renders the same composed dashboard the builder would produce, with Salt DS theming applied, but with no chat panel, no sidebar, no settings UI — just the canvas filling the viewport. Marketing assets are captured by browser-windowing the page.

The route reinforces uoaui's positioning: "one brief → 5 DS directions."

## URL shape

```
/preview/[interface]/[ds]
/preview/[interface]/[ds]?mode=light|dark
/preview/[interface]/[ds]?density=high|medium|low|touch
/preview/[interface]/[ds]?mode=light&density=touch
```

- `[interface]`: one of `dashboard | landing | form | ecommerce | blog | portfolio` (the existing `InterfaceType` union)
- `[ds]`: one of `salt | m3 | fluent | uoaui | carbon` (the existing `DesignSystem` union, also accepts the aliases `md3 | material | material3` via `canonicalDesignSystem`)
- `mode` query param (optional): defaults to `dark`
- `density` query param (optional): defaults to `medium`

Total live URLs after this PR: 6 interfaces × 5 DSes × 2 modes = 60 mode-specific deep-links, served by one route file.

## Architecture

```
URL params
   │
   ▼
canonicalInterfaceType(params.interface)  ──── null → notFound() → 404
canonicalDesignSystem(params.ds)          ──── null → notFound() → 404
canonicalBuilderMode(searchParams.mode)
   │
   ▼
useBuilder.getState().setDesignSystem(...)
                     .setInterfaceType(...)
                     .setMode(...)
                     .setDensity(...)
   + apply matching template via BUILDER_TEMPLATES[<id>]
   │
   ▼
<StandalonePreview />  (existing component used by /builder?preview=1)
   │
   ▼
Bare canvas fills the viewport. No chrome.
```

**Reuse, not invention.** Three pieces already exist on `main`:
- `canonicalDesignSystem` / `canonicalInterfaceType` / `canonicalBuilderMode` — `src/lib/dsParam.ts` (PR #150)
- `<StandalonePreview />` — used by the `/builder?preview=1` flow today
- `BUILDER_TEMPLATES` lookup — `src/lib/builderTemplates.ts`

The only genuinely new code in this PR is the route page + 4 new templates.

## New templates

`builderTemplates.ts` currently has 4 templates, all under `interfaceType: "dashboard"` or `"form"`. The other 4 InterfaceTypes are in the type union but have no supporting templates. This PR adds one template per missing interface:

| Interface | Template id | Composition |
|---|---|---|
| `landing` | `marketing-landing` | Hero (title + sub + CTA) → 3-card feature grid → testimonial → footer |
| `ecommerce` | `product-page` | Header → 2-col (image gallery + product info + add-to-cart) → reviews → footer |
| `blog` | `article` | Header → 1-col article (title, meta, body paragraphs, code block, image) → footer |
| `portfolio` | `case-study-grid` | Header → 2×3 case study grid → footer |

Each template follows the existing `BuilderTemplate` shape:
```ts
interface BuilderTemplate {
  id: TemplateId;
  label: string;
  desc: string;
  icon: string;
  interfaceType: InterfaceType;
  selectedComponents: string[];
  header: Block[];
  sidebar: Block[];
  body: Block[];
  footer: Block[];
  aiResponse: string;
}
```

Each template is DS-agnostic; the renderer applies per-DS styling at render time.

Per-interface lookup (one of `dashboard | form` already has multiple templates) picks the FIRST template matching the interface, preferring the alphabetically-sorted one for determinism.

## Middleware bypass — **STOP-class decision, needs explicit go**

The current staging-login middleware (added in PR #16 context, see `feedback_rules_class_files.md`) likely blocks `/preview/*` along with the rest of the app. For screenshot tools (and embedded marketing previews) to hit the URL without a login session, `/preview/[interface]/[ds]` must bypass auth.

**Implementation:** add the path to the bypass allowlist in the middleware config.

**Security implication:** every interface × DS deep-link becomes publicly reachable on the internet. This is fine for marketing assets (no PII, no API key exposure, no user data) but it is a **permanent public surface**. Future content choices for any template inherit this exposure.

**Per shipping rules (`feedback_rules_class_files.md`):** treat middleware changes as STOP-class. Implementation will prepare the patch but pause before pushing for explicit Shannon-go on the bypass list change.

## Error handling

| Condition | Behaviour |
|---|---|
| Unknown `interface` | `notFound()` → standard Next.js 404 |
| Unknown `ds` | `notFound()` → 404 |
| Unknown `mode` / `density` | Silently fall back to defaults (`dark` / `medium`) — same as `/builder?ds=…&mode=…` |
| Interface has no matching template | Render empty canvas with DS applied. No error UI — bare canvas is the intent. |
| Template lookup throws | `notFound()` → 404 (defensive — shouldn't happen since we validated above) |

## Tests

- `src/app/preview/[interface]/[ds]/__tests__/page.test.ts` — unit tests for the param-resolution flow. Validates that:
  - All 30 valid interface × DS combos resolve to a template + DS combo
  - Invalid `interface` returns null (caller can `notFound()`)
  - Invalid `ds` returns null
  - `mode` / `density` defaults apply when query is absent or invalid

`StandalonePreview`'s rendering is already covered by existing tests; the new route doesn't add rendering test surface area.

## Not in scope

- **Marketing frame option** — bare canvas only, per design approval.
- **Export-as-PNG button** — bare canvas means no UI; users capture via browser screenshot tool.
- **Authentication / draft flow** — public deep-links only, no logged-in variant.
- **Hand-curated marketing scenes** (Option D in brainstorming) — the auto-composed template per interface is what ships. If a particular interface × DS combo needs hand-curation later, that's a follow-up PR.
- **Hoisting template definitions to JSON** — they stay as TypeScript objects matching the existing builderTemplates.ts pattern. Refactor is out of scope.

## Open questions for implementation time

1. **Middleware bypass:** which exact paths to allowlist. `/preview/(.*)` regex vs explicit `/preview/[interface]/[ds]` shapes — needs middleware code inspection.
2. **Default mode:** spec says `dark`, but uoaui's brand is dark-default — confirm at implementation time whether any interface (e.g. `blog`) reads better in `light`.
3. **Density default:** spec says `medium`. The landing's actual look is `medium` for everything; confirm.

These are minor — flagged but not blocking the design approval.

## Files this PR will touch

| File | Change |
|---|---|
| `src/app/preview/[interface]/[ds]/page.tsx` | new — the route |
| `src/lib/builderTemplates.ts` | extend `VALID_TEMPLATE_IDS` (4 new ids); add 4 new template definitions; add a `getFirstTemplateForInterface(interfaceType: InterfaceType): BuilderTemplate \| null` helper that returns the alphabetically-first template matching the given interface |
| `src/middleware.ts` (or wherever staging-login bypass list lives) | add `/preview/*` to allowlist (STOP-class) |
| `src/app/preview/[interface]/[ds]/__tests__/page.test.ts` | new — unit tests |
