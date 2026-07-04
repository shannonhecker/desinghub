# Changelog

All notable changes to Design Hub (uoaui.ai) are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Dates are YYYY-MM-DD.

## [Unreleased]

### 2026-06-15 cold-start + UI-Kit + responsive batch (5 PRs, open for review)

Produced by a recon then build then adversarial-verify agent pipeline; each PR is
isolated to a disjoint file set, type-checks and tests clean, and is opened against
`main` (none auto-merged).

#### Added
- **`/start` prompt-first cold-start screen** (PR #367, `feat/start-cold-start-sibling`).
  A new sibling route with a real, controlled prompt input that deep-links to
  `/builder?prompt=<encodeURIComponent(text)>`, example-prompt chips, full a11y
  (labeled textarea, 3:1 focus ring, reduced-motion), brand-token styling, and a
  mobile layout. The live homepage hero is deliberately untouched. Inert until the
  receiver (PR #365) lands. Live-render verified (deep-link URL + responsive).
  Files: `src/app/start/page.tsx`, `src/app/start/start.css`, `+ test`.
- **Builder deep-link `?prompt=` auto-fire** (PR #365, `feat/builder-deeplink-prompt`).
  `/builder?prompt=<text>` stages the text and fires `handleSend` exactly once on
  mount (ref + `messages.length===0` guard), then strips the `prompt` param while
  preserving siblings like `?ds`. With AI on it routes the prompt through the
  AI-first path (builds, or asks the one audience question first for app-like
  prompts with no stated audience). Files: `src/components/builder/ChatPanel.tsx`, `+ test`.
- **Per-DS accessibility data layer + Salt button anatomy** (PR #368, `feat/uikit-anatomy-a11y-data`).
  New `COMPONENT_ACCESSIBILITY` (keyboard / aria / contrast notes for button,
  text input, checkbox, switch across the design systems) replaces the previously
  identical hardcoded Accessibility-tab boilerplate with a data-gated render, plus a
  `COMPONENT_ANATOMY` entry for the Salt button. `tokens:audit` clean.
  Files: `src/data/ui-kit-meta.ts`, `src/components/ComponentPreview.tsx`, `+ tests`.

#### Changed
- **Phase-aware streaming status in builder chat** (PR #365).
  The generating indicator now reflects its phase (Thinking / Building / Applying
  changes) instead of a static "Thinking...", and lights up the previously-dormant
  `LifecyclePill` `tool` state. Additive; no CSS or new component.

#### Fixed
- **Dense dashboards no longer clip at the stage cap** (PR #366, `fix/builder-responsive-clip`).
  The KPI/stat-card row's only responsive relief was a `@container (max-width:640px)`
  query that never fired at typical body widths. Added a 4 to 3 to 2 container-query
  ladder (`<=1100px`, `<=760px`) and switched the legacy `StatsCardsBlock` grid to
  `auto-fit minmax(160px, 1fr)`. The shared layout resolver is intentionally
  untouched. Files: `src/components/builder/builder.css`, `ComponentRenderer.tsx`, `+ test`.
- **Preview-after-first-build gate repaired** (PR #361, `feat/preview-after-ai-build`, owner-gated).
  The original `canvasWasEmpty` gate checked all four canvas zones, but the store
  seeds 7 chrome blocks, so it was always false and the auto-flip-to-Preview never
  fired for real users. Now keyed off `messages.length===0` (first build) plus
  body-only `blocks.length>0` plus a `mode==='edit'` guard, with a realistic test.
  This PR remains an open edit-vs-preview product decision and is not merged.
  Files: `src/components/builder/ChatPanel.tsx`, `+ test`.
