# Design Review Process — Design Hub

The 4-gate review process for Design Hub changes. Scale up or down based on scope — see §Scope selector.

Related references:
- `docs/TOKENS.md` — token schema + migration status, token-audit gate
- `CLAUDE.md` — design system rules, intentional-literal list, clarify-first

---

## Scope selector (which gates apply?)

| PR touches | Gate 1 Concept | Gate 2 Design | Gate 3 Pre-handoff | Gate 4 QA |
|---|:---:|:---:|:---:|:---:|
| Docs / README / scripts only | — | — | — | — |
| `src/data/_shared/` types or primitives | — | ✓ | ✓ | ✓ |
| Single DS `tokens.ts` (values only) | — | ✓ | — | ✓ |
| Single DS `*-documentation.jsx` (new component) | ✓ | ✓ | ✓ | ✓ |
| Single DS `*-documentation.jsx` (refactor) | — | ✓ | ✓ | ✓ |
| Cross-DS change (registry.ts, 2+ DS touched) | ✓ | ✓ | ✓ | ✓ |
| Builder (`src/components/builder/`, `src/store/`) | ✓ | ✓ | ✓ | ✓ |
| New DS added | ✓ | ✓ | ✓ | ✓ |

Minimum always-on: **Gate 4 (QA)** — typecheck + vitest + tokens-audit, enforced by CI.

---

## Gate 1 — Concept Review

**Before you design.** Skip for refactors, typo fixes, or token-only changes. Run for: new components, new patterns, DS additions, builder UX changes, anything user-facing-new.

### Criteria
- [ ] Problem clearly defined — what gap does this fill in Design Hub?
- [ ] User need grounded — which Design Hub user persona benefits? (Design engineer evaluating DSs? Dev reading snippets? Stakeholder previewing?)
- [ ] 2+ concepts explored, or explicit rationale for a single direction
- [ ] Strategic alignment — does it fit the 5-DS normalization philosophy? Does it respect per-DS character?
- [ ] Stakeholder input gathered if the change affects shared surfaces (registry, chrome, builder)

### Exit signal
A one-paragraph "why + what" you can paste at the top of the PR description, with a link to any sketches / Figma frames / reference patterns.

---

## Gate 2 — Design Review

**During design.** For any visible change.

### Criteria
- [ ] Tokens only — no raw hex, spacing px, font-size, duration, or radius in `src/data/**` outside `tokens.ts` files. Verified via `npm run tokens:audit`.
- [ ] Per-DS spec adherence — Salt characteristic tokens, M3 shape ladder, Fluent duration names (`durationFaster/Fast/Normal`), Carbon productive/expressive motion, ausos glass opacity scale.
- [ ] Interaction patterns consistent across the DS — hover / focus / pressed / disabled states all present.
- [ ] Responsive behavior defined — if density/size variants apply (Salt H/M/L/T, Carbon compact/normal/spacious, Fluent S/M/L, M3 density offset, ausos H/M/L/T).
- [ ] Content strategy — labels active-voice + Title Case, error messages include fix, specific button labels (not "Continue").
- [ ] Design system components used — prefer existing `.a-*` / `.cb-*` / `.f-*` / `.m3-*` / `.s-*` utility classes + token CSS vars before introducing new ones.

### Exit signal
Screenshot(s) of the change across at least one theme per affected DS, attached to the PR.

---

## Gate 3 — Pre-Handoff Review

**Before merge.** The WCAG + polish gate.

### Criteria
- [ ] All states designed — empty / loading / error / success / disabled / focus.
- [ ] Edge cases — long user input, empty arrays, short/average/very-long copy.
- [ ] Accessibility — WCAG 2.1 AA:
  - Text contrast ≥ 4.5:1 (normal) / ≥ 3:1 (large)
  - Interactive element contrast ≥ 3:1
  - Focus rings visible (`:focus-visible`, 2px, contrast ≥ 3:1)
  - Touch targets ≥ 44px (Salt Touch / M3) / ≥ 32px (Fluent)
  - Keyboard navigation works (Tab, Arrow keys for compound widgets)
  - ARIA labels on icon-only buttons
  - Decorative icons marked `aria-hidden="true"`
  - Async updates have `aria-live`
  - Semantic HTML before ARIA
- [ ] Dark mode — all tokens resolve correctly; shadows adapted; borders visible.
- [ ] Density variants — verified across all per-DS density levels.
- [ ] Handoff specs complete — if this is a Figma-to-code PR, the Figma node ID is in the description.

### Exit signal
All boxes checked in the PR template; `npm run tokens:audit` exits 0; `npm run typecheck` + `npm run test` + lint all green.

---

## Gate 4 — Implementation QA

**On CI and manually before merge.**

### Automated (CI — `.github/workflows/ci.yml`)
- [ ] `npm run typecheck` clean
- [ ] `npm run test` — 79/79 passing (or updated baseline)
- [ ] `npx eslint src --max-warnings=10000` — no new errors
- [ ] `npm run tokens:audit` — literal count did not rise vs. `scripts/tokens-baseline.json`

### Manual (reviewer walks through)
- [ ] Design matches screenshots / Figma spec
- [ ] Interactions work as designed (click + keyboard)
- [ ] Responsive — tested at common viewport widths (if applicable)
- [ ] Cross-browser — Chrome / Safari / Firefox (for non-trivial visual changes)
- [ ] Builder smoke — Sprint 2525492 features still work: multi-select, group-as-column, right-click menu, shortcuts (for any change in or near `src/components/builder/`)
- [ ] Screenshot matrix — `npm run ss` captures are visually diff-clean (for DS-wide changes)

### Exit signal
Merged PR with all CI checks ✓, reviewer walkthrough approved in a comment.

---

## Review criteria (cross-gate)

Every review — concept through QA — asks these five questions:

1. **Does it solve the user problem?** (Design Hub user = design engineer evaluating / comparing / shipping across DSs.)
2. **Is it consistent with the active DS?** (Salt vs. M3 vs. Fluent vs. Carbon vs. ausos each have their own spec conventions.)
3. **Is it accessible (WCAG 2.1 AA)?**
4. **Are all states and edge cases covered?**
5. **Is it feasible and sustainable to maintain?** (Does it add cross-DS coupling? Does it depend on external packages we don't control?)

---

## Approval workflow

Solo / small team — Shannon is both designer and lead. Scale appropriately:

1. **Self-review against checklist** (you, against the PR template)
2. **Automated gate** (CI must pass — non-negotiable)
3. **Design-lead sign-off** — currently self; when a collaborator joins, they review before self-merge
4. **Stakeholder approval** — only for visible changes that affect the Design Hub public surface
5. **Developer acceptance** — covered by CI + manual walkthrough

For agent-authored PRs (Claude Code / ultrareview), the human is always the final approver.

---

## Best practices

- **Not every project needs every gate.** Token-value tweaks skip Concept. Docs skip Design. Scale down aggressively.
- **Time-box reviews.** 15 min for small PRs, 45 min for cross-DS, 2 hr max for new DS additions. If a review extends past the cap, split the PR.
- **Use the PR template checklist to make reviews objective.** No "looks good to me" — if a box isn't checked, the reason is in the description.
- **Document decisions and rationale** in the PR description, not the commit message. PRs are searchable; commit bodies aren't.
- **Intentional-literal exceptions** (anything in `CLAUDE.md § Intentional literals` / `docs/TOKENS.md § Intentional literals`) need an inline comment explaining why, plus a `// tokens-audit-ignore` suppression.
- **Destructive actions always need confirmation** — when removing a component, a token, or a DS feature, call it out in the PR description explicitly. "This removes X" should be a header, not buried.

---

## Integrations

- **CI gate**: `.github/workflows/ci.yml` (typecheck / test / lint / tokens-audit)
- **Pre-commit hook**: `.githooks/pre-commit` (tokens-audit on staged `src/data/**` files)
- **PR template**: `.github/PULL_REQUEST_TEMPLATE.md` (auto-populates on PR open)
- **Auto-comment workflow**: `.github/workflows/design-review.yml` (scopes gate checklist to changed paths, labels PR)
- **Issue template**: `.github/ISSUE_TEMPLATE/design-review.yml` (structured review-request form)

---

## Escape hatches

- **`[skip-review]` in PR title** — bypasses the auto-comment workflow. Use for trivial doc typos, CI-only changes, dependency bumps. CI gate still runs.
- **`git commit --no-verify`** — bypasses pre-commit hook. Emergency only (P0 incident, CI broken, etc.). Log the bypass in the PR description.
- **`// tokens-audit-ignore`** at end of a line — excludes that line from the token-audit sweep. Use for intentional literals; always paired with a rationale comment.
