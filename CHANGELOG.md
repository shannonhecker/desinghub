# Changelog

All notable changes to Design Hub (uoaui.ai) are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Dates are YYYY-MM-DD.

## [Unreleased]

### 2026-10-04 finance templates, slice 2: Sustainable Investment (`feat/finance-templates-slice-2`, stacked on slice 1)

Four more client reports as builder templates. Design note:
`docs/superpowers/specs/2026-10-04-finance-templates-slice-2-design.md`.

#### Added
- **ESG Analytics, Climate Analytics, Screening, Screening Changes.** One
  block list each, bound to a new sample dataset (`sustainable`: about 36
  securities with scores, emissions, ratings and monthly trends). Measured:
  every panel at the same position and size (0px difference) in all five
  design systems, light and dark; Edit matches Present; nothing clipped on
  tablet or phone. They share the finance header and add the section's
  grouped sidebar.
- **Selections that scope the page.** A row of the ESG or Climate summary
  re-scopes the gauges, charts and rankings; a bar of the Screening waterfall
  filters the universe grid; a row of a security grid opens its detail.
- **Rich grid cells, described as data** (`GridCell`): heat tint by bucket,
  bar, delta chip, arrow delta with a sparkline, sparkline, rating badge,
  toned word, country flag, rank. Tones (good / mid / bad / neutral / accent)
  resolve to each design system's status colours.
- **Charts.** `waterfall`; a score gauge (its own scale and decimals, larger
  in a panel); per-point colours by position or by name; selectable points
  that dim the rest; wrapped category labels.
- **Record Detail block.** The selected row of a grid as label/value pairs,
  small tables with direction arrows and a trend line; a fixed panel, so the
  page keeps its geometry whether or not something is selected.
- **Bindings.** `records` (a table's own rows as a grid), `value` (one
  figure, for a gauge), signed parts with a closing sum, ranked grids, and
  selections made from a chart.
- Chat: the four templates by name; gallery thumbnails.

#### Fixed
- A gauge's track drew black when the primary colour was not a hex string.
- A panel title beside a "View by" select lost a fraction of a pixel and was
  ellipsised although it fitted.
- A selectable chart or grid no longer selects its block while presenting.

#### Different from the source reports (see the design note)
- Data is real, not staged: a selection filters the same rows the grids show,
  so figures do not match the source screens digit for digit.
- The security detail is a fixed panel, not a rail that pushes in.
- Screening's filter side panel and the controls that do nothing in the
  source (period dropdowns, download, overflow menus) are left out.

### 2026-10-04 finance templates, slice 1: Risk and Performance (`feat/finance-templates-slice-1`, stacked on the trust fixes)

Two analytics reports become builder templates, built from builder blocks only
and identical in every design system. Design note:
`docs/superpowers/specs/2026-10-04-finance-templates-slice-1-design.md`.

#### Added
- **Risk Analytics and Performance Analytics templates.** One block list each,
  no per-system forks. Measured: every panel sits at the same position and
  size (0px difference) in Salt, Material 3, Fluent 2, uoaui and Carbon, in
  light and dark, and Edit matches Present. Neutral names and a made-up brand
  ("Meridian Analytics").
- **They are live.** Context filters (currency, fee type, periodicity,
  benchmark), each panel's "View by", and the selected row of the master grid
  re-derive the charts and grids. Data lives in a small report-data layer
  (`src/lib/reportData/`): plain tables, a query engine (group, pivot,
  aggregate, filter, share, total), computed measures and block bindings.
- **Bring your own data.** Download the data template as Excel, fill it in,
  upload it: the report redraws from it. Uploaded data stays in the browser
  (it is left out of the cloud snapshot).
- **Panel tools.** Expand a panel to the full canvas; a configuration drawer
  swaps chart and grid, chart type, rows, columns, values and aggregation
  (a pivot tool built on AG Grid Community; no Enterprise licence).
- **Blocks.** `DataGrid` (grouped headers, number formats, pinned totals, row
  selection); chart kinds `combination`, `stacked-bar`, `stacked-area`; framed
  panels with title, subtitle and "View by"; `TopNav`, `TabStrip`, `NavGroup`,
  `PageTitle`.
- **Header, sidebar and footer are restylable.** A zone has a tone (surface,
  transparent, inverse, dark, accent), can run edge to edge so bars stack,
  can be hidden, and the sidebar can dock right. Controls are in the zone
  overlay in Edit and in the chatbot's `setZoneLayout`.
- **Chatbot.** New tools `applyTemplate` and `setReportFilter`; the canvas
  manifest lists the template, zone tones and every report control with its
  choices. Without a model, "use the risk analytics template in Carbon,
  light", "show it in USD" and "view by sector" are applied directly.
- **Template gallery.** Category chips (All / General / Finance), a
  description on each card, and "Use this" applies in one step.
- **Tablet and phone.** Blocks can declare how they fold
  (`layout.spanTablet`, `layout.spanPhone`); the two templates do. Nothing is
  clipped at 768 or 375.
- **Dropdowns** render and export their own label, value and options in all
  five systems (they showed "Option 1 / Option 2").
- **Export.** React, HTML and Vite exports carry a finance template's data
  (bound blocks are resolved against the active dataset and filters), its
  panels, data tables, header bars, page title and zone tones; hidden zones
  are left out. The HTML export shows a chart's data as a table.

#### Fixed
- Edit did not match Present on a canvas with a removed frame: the
  "+ Sidebar / + Footer" bar took a row and pushed the page down. It floats
  over the frame's corner now.
- The body was up to 2px wider in Edit than in Present (a transparent border
  snapped to device pixels at a fractional scale).
- Compact money read "£3.55bn" in one browser and "£3.55B" in another; the
  formatter now scales and suffixes values itself.
- In Present, using a live filter also selected its block for the amend
  composer and closed the menu.
- Card outlines and dividers use each system's secondary border; the primary
  one read as a hard line around every panel in dark themes.

#### Tests
- `e2e/builder-finance-templates.spec.ts`: four-sided 1px parity across five
  systems in light and dark, Edit = Present, filters and View by, chat
  commands, tablet and phone clipping.
- Unit tests for the query engine, bindings, workbook import/export, the
  templates, panel configuration, chrome blocks, chat tools and manifest.

#### Not verified
- The model-driven chat path (`applyTemplate`, `setReportFilter` called by the
  model) is unit-tested only: there is no model key locally or in the Preview
  environment. The no-model commands are verified in the browser.

### 2026-10-04 trust fixes: chatbot, saving, layout parity (`fix/trust-fixes-chat-parity`, open for review)

From a walkthrough of the live builder on 2026-10-03 plus a second, independent
audit. Unit tests, the e2e suite and browser screenshots cover every item
except the first, which needs a model key to exercise end to end.

#### Fixed
- **The chatbot never added anything.** `/api/chat` made one model request and
  never returned a `tool_result`, so the API ended each turn at the model's
  first batch of calls: a build that opened with `clearCanvas` stopped there.
  The route now acknowledges each call and continues the turn until the model
  stops asking for tools (at most 8 requests). Unit-tested with a scripted
  stream; **not yet verified against the real model** (no key locally or in
  the Preview environment).
- **Theme switches in chat.** Matched by substring: any message containing
  "dark" or "light" was answered "Theme updated!" without reaching the model,
  "switch to Carbon in light mode" changed only the mode, and offline the word
  "switch" added a toggle group. Now parsed by word, across all five systems
  (`src/lib/themeCommand.ts`).
- **"Couldn't save - Missing or insufficient permissions."** The first save of
  a new session read a doc that did not exist yet, which the rules refuse.
  `firestore.rules` is updated too and needs deploying to take effect.
- **Saves dropped mid-save.** A save that came due while another was in flight
  was discarded; it is now queued (`src/lib/coalescedRunner.ts`).
- **Work lost on refresh.** Applying a template from the chat never started a
  session, so nothing was saved; a refresh always landed on the start screen;
  an edit inside the save debounce was lost. Sessions now start in
  `applyTemplateToCanvas`, the open session is reopened on load
  (`src/lib/activeSession.ts`), and a pending save is written on page hide.
- **Layout differed by design system.** The body overflowed its container by
  two gutters in every system but Carbon (clipping the right-hand column), and
  Carbon's narrower body re-wrapped its KPI row. Grid tracks are now
  `minmax(0, 1fr)`.
- **Edit did not match Present.** The frame took whatever width the stage had
  left, so Edit (chat docked) re-flowed a desktop dashboard. The frame is now
  laid out at one design width per device and scaled to the stage
  (`src/lib/frameFit.ts`). Desktop design width is 1320.
- **Carbon dark painted a white body** behind dark cards; **Carbon stat cards
  showed progress as a green "+N%"** in the canvas and the React export.
- **Start-screen tab order** walked through about 17 hidden canvas controls.

#### Added
- `e2e/builder-layout-parity.spec.ts`: no sideways clipping, identical columns
  across the five systems in light and dark, and Edit == Present.


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
