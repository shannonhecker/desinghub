<!--
  Design Hub PR template. Full review process: docs/DESIGN-REVIEW.md.
  Delete sections that don't apply — not every PR needs every gate.
  Add [skip-review] to the PR title to bypass the auto-comment workflow
  (CI gate still runs).
-->

## Summary

<!-- 1–3 sentences. What changed and why. Link an issue/Figma if relevant. -->

## Scope

Which gates apply? (see `docs/DESIGN-REVIEW.md § Scope selector`)

- [ ] Gate 1 — Concept (new component / pattern / DS)
- [ ] Gate 2 — Design (visible change)
- [ ] Gate 3 — Pre-handoff (WCAG + polish)
- [ ] Gate 4 — Implementation QA (always on via CI)

## Self-review checklist

### Tokens & design
- [ ] No raw hex / rgba / px / ms in `src/data/**` outside `tokens.ts` files (`npm run tokens:audit` exits 0)
- [ ] Per-DS spec adherence — motion / shape / type / opacity follow the active DS's conventions
- [ ] Hover / focus / pressed / disabled states defined (for interactive elements)
- [ ] Density / size variants verified (if applicable)

### Accessibility (WCAG 2.1 AA)
- [ ] Text contrast ≥ 4.5:1 (normal), ≥ 3:1 (large / interactive elements)
- [ ] Focus visible via `:focus-visible` (no bare `outline: none`)
- [ ] Keyboard navigation works (Tab, Arrow keys for tabs / radiogroups / menus)
- [ ] Icon-only buttons have `aria-label`
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Async updates use `aria-live` / `role="status"` / `role="alert"`
- [ ] Semantic HTML before ARIA (`<button>` for actions, `<a>` for nav)

### States & edge cases
- [ ] Empty / loading / error / success states handled
- [ ] Long user input truncates / wraps correctly
- [ ] Dark mode renders correctly (for each affected DS theme)

### Performance & safety
- [ ] No `transition: all` (enumerate properties)
- [ ] No layout reads in render (`getBoundingClientRect`, `offsetHeight`, etc.)
- [ ] Lists > 50 items virtualized (if new)
- [ ] Builder sprint 2525492 features unaffected: multi-select, group-as-column, right-click menu, shortcuts (if PR touches `src/components/builder/`)

## Gate evidence

<!-- Screenshots, Figma links, a11y-audit findings, builder-smoke notes. -->

### Screenshots
<!-- One per affected DS × theme. Drag and drop into this comment. -->

### Figma node (if design-to-code)
<!-- figma.com/design/<fileKey>/<fileName>?node-id=<nodeId> -->

### WCAG audit
<!-- Paste contrast-check output, axe/accesslint findings, or "✓ ran checker, no issues" -->

## Test plan

- [ ] CI typecheck + vitest + lint + tokens-audit pass
- [ ] Manual: `npm run dev` → walk through affected components in each theme
- [ ] Manual: keyboard-only navigation through new/changed interactive elements
- [ ] (For DS-wide changes) `npm run ss` screenshot matrix visually reviewed

## Rollback plan

<!-- How do we revert if this breaks? Single commit? Feature flag? -->

## Follow-ups (not in this PR)

<!-- Explicitly-deferred items, linked issues, or `// TODO` pointers. -->
