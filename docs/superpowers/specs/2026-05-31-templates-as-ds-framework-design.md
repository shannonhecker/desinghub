# Templates as DS Framework — Design Spec

**Date:** 2026-05-31
**Status:** Draft for owner review
**Owner:** Shannon (design engineer / art director)
**Repo:** `shannonhecker/desinghub` (Design Hub / uoaui), Next.js 16, Zustand

## 1. Goal & context

Part of the product goal: a usable simple UI generator where the starter templates are **best-in-class, reusable framework patterns that "live in each DS library"**, expressible across all 5 design systems (Salt, Material 3, Fluent, Carbon, uoaui), that users reuse and download (code / SVG / Figma), with `/ui-kit` and the builder sharing **one source of truth**.

Today there are 4 DS-agnostic starter templates (`analytics-dashboard`, `settings-page`, `crm-contacts`, `login-flow`) defined as `BuilderTemplate` objects (header/sidebar/body/footer `Block[]`) that render through whichever DS is active via `ComponentRenderer`, and export real per-DS code via `componentApiRegistry` + `reactExporter`.

**Owner feedback driving this work:**
- The generated/templated UI was noisy and misaligned (addressed by PR #202: de-noise + crash fix, merged).
- The current templates feel **loose and unfinished** — padding too big, spacing not tight enough. They need a **finished** look, benchmarked against **better example UIs**.
- Templates should be **researched best-practice patterns**, not generic filler.

## 2. Confirmed architecture (LOCKED 2026-05-31)

**One pattern → 5 DSs via the registry.** Each pattern is authored **once** as a DS-agnostic `Block[]` tree (the existing `BuilderTemplate` shape). The per-DS expression lives entirely in `componentApiRegistry` (keyed `[SystemId][blockType]`), which resolves each block into real Salt/M3/Fluent/Carbon/uoaui components for both **live preview** (`ComponentRenderer`) and **code export** (`reactExporter.blockToRealJsx`).

- "Live in each DS library" = the same pattern **resolves into** each library, not authored 5×.
- Adding a 6th DS later = one registry column = every pattern available in it for free.
- This is the workbench's structural moat: MUI/Carbon/Salt each author patterns for **one** system; here one pattern resolves into **all 5**.
- **Hybrid escape hatch (block-level only):** where a DS genuinely lacks a primitive (uoaui has no switch/no danger button; Fluent has no native danger), the registry declares an explicit substitution or honest "not supported → graceful fallback." Patterns never fork into per-DS files.

> **Slogan:** templates are the framework; the registry is the compiler.

**Rejected:** per-DS authored template variants (5× files, drift, loses single-source).

## 3. The pattern set (5, locked for v1)

Mapped to the 4 existing templates + 1 new (Landing). Each rebuilt to the researched canonical structure, with the research's anti-patterns encoded as **guardrail data / lint** (so "best-in-class" is enforced by the pattern, not left to the AI generator). Reference products in parentheses are the visual bar.

1. **Analytics Dashboard** (Stripe Home, Mixpanel Insights, Linear Insights) — inverted pyramid: sticky **scope bar** (title + date-range + "vs previous" compare + export) → **KPI row** of 3–5 cards, lead metric top-left, value 2–3× the label, signed-% delta + arrow + color (never color-only) → **one full-width hero trend** with comparison overlay → **2-up supporting chart grid** → **detail table** with sort + drill. Budget ~4–9 modules.
2. **Settings Page** — split parent/detail: left **NavList** of 4–7 categories (frequency order, not alphabetical) → right scrollable detail pane, grouped sections (heading + description + rows), one setting per row (label left / control right), **danger zone isolated last**, explicit save model. (Current single-column stack = the ≤4-category lightweight variant.)
3. **CRM Workspace** — master-detail backbone, 3 surfaces from one dataset: (a) **list/index** (toolbar + search + filter chips + table, checkbox-first, name-first column, batch-action bar, pagination), (b) **pipeline/kanban** (5–7 stage columns, count + summed value per header, deal cards 3–5 fields), (c) **record detail** (highlights header + stage path + left properties rail + center activity timeline + right associations rail). Highest-value pattern (no single DS ships it; exercises the most block types).
4. **Auth (sign-in / sign-up)** — one spine, two variants: SIGN-IN (header → email → password+show/hide → forgot-password inline → full-width primary → SSO divider → switch-to-signup); SIGN-UP (header+benefit → SSO-first → divider → email → password+strength → consent → switch-to-signin). Drop confirm-password. Keep the login→dashboard handoff.
5. **Landing Page** (NEW; MUI's "Marketing page" archetype) — single scroll: sticky slim nav → hero (benefit H1 + subhead + ONE primary CTA + anxiety reducer + visual) → social-proof strip → features/how-it-works → testimonials → optional pricing → FAQ accordion → final CTA band → footer. One primary CTA, repeated ≤3×.

## 4. Visual finish & density (owner feedback — first-class)

The current templates read loose/unfinished. Every pattern must look **finished and tight**:

- **Tighten spacing.** Reduce zone padding and card padding to a deliberate rhythm; gutters consistent on one grid; group spacing > intra-group spacing so grouping reads. No large empty bands between sections (the dead-gap anti-pattern from the audit).
- **Trace the source first.** Before tuning values, find where the loose padding originates — zone container padding (layout resolver / zone defaults), card/component padding (Simulated\* CSS), or token defaults — and fix at the right layer (tokens over literals). Document which layer.
- **Finished detailing.** Consistent card framing (header position, padding, radius per DS), aligned baselines, equal-height cells per row, status as color **+** icon/text, de-emphasized labels with emphasized values (Refactoring UI).
- **Benchmark against the named references** above; a reviewer should not be able to tell the rebuilt template from a real product screen at a glance.
- Run the `design-audit` + `accesslint` + `typography` skills as part of the rebuild, not as an afterthought.

## 5. Registry-as-compiler + the coverage gap

Real blocker = coverage. Today only 5 block types (Button, TextInput, Checkbox, Switch, Card) have real-API registry entries; templates lean on StatCard, DataTable, Highchart\*, Tabs, Searchbox, Dropdown, Title, Alert, Avatar, Progress, NavItem, FooterText — all of which fall through to generic `className` markup in the exporter. **Best-in-class downloadable code requires widening the registry matrix** to every block a pattern uses, across all 5 DSs, each cell pinned by a vitest test (the existing `componentApiRegistry.test.ts` is the template).

## 6. Single source of truth

- **Pattern data:** stays in `builderTemplates.ts` as `BuilderTemplate` objects. `VALID_TEMPLATE_IDS` remains the single id list **and** the API-route prompt-injection allow-list (`route.ts`) — add a pattern in one place, both update.
- **Per-DS expression:** stays in `componentApiRegistry.ts` (`[SystemId][blockType]`); fill the matrix for pattern-used blocks.
- **Code output:** `reactExporter` (already calls `blockToRealJsx` + `collectImports`; its generic switch becomes pure fallback as coverage → 100%). `htmlExporter`/`viteExporter` wired the same way.
- **The single-source fix:** `/ui-kit` (DesignHubApp) must import the **same `BUILDER_TEMPLATES`** and render each preview via the **same `ComponentRenderer`** the builder uses (today only the builder imports them — the real double-build risk). The `?ds=&mode=&density=&themeKey=` handoff is already shared.
- **Result:** one pattern → live preview + builder canvas + /ui-kit gallery + code/SVG/Figma export, all derived from it. Never built twice.

## 7. Download tiers (3 serializers, 1 source — later phases)

1. **Code** — live today; widen registry coverage so a *whole* pattern exports real per-DS code.
2. **SVG** — NEW; serialize the live `ComponentRenderer` DOM (adapter over the existing render path, not a parallel renderer). Open Q below.
3. **Figma** — NEW; via the `figma:figma-generate-design` / `figma-generate-library` path from the `Block[]` tree + token layer. Deferred to last (depends on token-mapping + the figma skill). Open Q below.

## 8. Phased plan (registry-first, thin-slice — recommended)

Execute registry-first, but as a per-pattern thin slice so each pattern goes end-to-end before the next. **Branch + PR per phase; registry-coverage PRs carry vitest pins; verify the registry matrix on main after each squash (coverage regressions are silent). Visually verify on a local prod build BEFORE merge ([[feedback_visual_check_before_merge]]).**

- **Phase 1 — Analytics Dashboard thin-slice** (do first; widest block set): (1) widen `componentApiRegistry` for the dashboard's blocks (StatCard, Highchart line/bar/donut, DataTable, Progress, NavItem, Title, FooterText) across all 5 DSs with vitest pins; (2) rebuild the Analytics Dashboard template to the §3 canonical structure with §4 tight finish; (3) point `/ui-kit` at the shared `BUILDER_TEMPLATES` + `ComponentRenderer`; (4) prove real per-DS code export for the whole pattern; (5) prototype the SVG serializer on this one pattern.
- **Phase 2 — Settings**, **Phase 3 — CRM Workspace**, **Phase 4 — Auth**, **Phase 5 — Landing** — same slice each (registry coverage → canonical rebuild → export proof).
- **Phase 6 — SVG serializer** hardened across all patterns.
- **Phase 7 — Figma** export.
- **Spacing/finish audit** (§4) runs within each pattern's rebuild.

## 9. Decisions taken / deferred

**Taken:**
- Expression model = one pattern → 5 DSs via registry (LOCKED).
- Pattern set = 5 (Dashboard, Settings, CRM, Auth, Landing); locked for v1.
- Sequencing = registry-first, Dashboard thin-slice first.
- Anti-patterns encoded as guardrail data/lint.
- Capability gaps = honest degradation via registry omission/substitution (existing behavior).
- Templates stay tight/finished, benchmarked to named reference UIs.

**Deferred (resolve at their phase):**
- SVG fidelity: pixel-faithful (snapshot the live DOM → foreignObject) vs structural (hand-serialized shapes). Editability vs fidelity.
- Figma direction: filled **frames** (a screen) vs a **library** (component set + variants).
- Registry coverage ceiling: 100% of pattern-used blocks real, vs documented fallback for v1.
- `/ui-kit` gallery: own DS switcher vs inherit only via `?ds=` (respect the redundant-controls intent).

## 10. Testing & shipping discipline

- Vitest pin per registry cell; render-proof each new DS realization (throwaway Vite app with the real package + Playwright screenshot, per the codegen-spine method).
- After each squash-merge, grep the artifact on main (coverage regressions are silent).
- Local prod build + Playwright visual check before every merge; preview is keyless so it can't reach the model.
- Respect: branch+PR never direct-to-main; no merge without explicit per-PR go; solo edits in this repo (parallel-agent HEAD-flip race).
