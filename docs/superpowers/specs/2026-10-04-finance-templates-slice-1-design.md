# Finance templates, slice 1: foundation + Risk + Performance

Date: 2026-10-04. Branch: `feat/finance-templates-slice-1` (stacked on
`fix/trust-fixes-chat-parity`). Owner approved the design in chat on 2026-10-03.

## Goal

Two analytics reports from the owner's client work become builder templates:

- **Risk Analytics** (summary grid, three charts side by side, a full-width
  value-at-risk chart).
- **Performance Analytics** (results grid; grid + clustered column + donut;
  stacked area + combination chart).

Each template must be built only from builder blocks (one DS-agnostic `Block[]`,
no per-design-system forks), be editable, be drivable from the chatbot, and keep
every panel at the same position and size, within 1px, in Salt, Material 3,
Fluent 2, Carbon and uoaui, in light and dark. Quality bar: Awwwards / Webby /
FWA level, reached by self-inspection.

This is slice 1 of 4. Later slices: Sustainable Investment reports; issuer
reports, scorecard and home; the FX execution dashboard.

## Decisions

- **Neutral names.** "Risk Analytics" and "Performance Analytics", a made-up
  brand ("Meridian Analytics") in the header. No client names or logos.
- **Panels are flat blocks.** A chart or a grid block carries its own frame
  (title, subtitle, "View by" options). No container block, so a panel is
  swapped by changing one block and nothing is nested (the renderers look
  blocks up among top-level zone blocks).
- **Heights are pinned.** Components have different natural heights per design
  system, so rows drift unless a template fixes them. Every block in these
  templates has an explicit height; the frame, not the component, sets the box.
- **"View by" shows its options but does not re-query.** Templates carry sample
  data.
- **One panel holds one chart or one grid.**

## What gets built

### 1. Dropdown carries its label, value and options
`SimulatedDropdown` gains `label`, `value`, `optionsCsv`. All five real
renderers, the simulated fallback and the five export emitters render them
(today they hardcode "Option 1 / Option 2"). The context row of each template
is a title plus labelled dropdowns.

### 2. Chart upgrades (`SimulatedHighchart`, `chartExporter`)
- New `chartType`s: `combination` (per-series `type` column / line / spline,
  per-series `yAxis` 0 or 1, optional `dashStyle`), `stacked-bar`,
  `stacked-area`.
- New props: `height` (px), `subtitle`, `viewBy` (string[]), `yAxisFormat`,
  `yAxisTitle`, `secondaryAxisFormat`, `centerLabel` (donut), `legend`
  (boolean).
- Panel frame: when a chart has `panel: true` it is drawn inside a framed card
  with a header row (title, subtitle on the same baseline, "View by" dropdown on
  the right) and the Highcharts title is suppressed. The frame uses `--ds-*`
  tokens only.
- The Highcharts accessibility module is loaded in the canvas and the export.
- The inspector gets a chart-type select so a chart can be swapped in place.

### 3. Data grid block (`DataGrid`)
AG Grid Community (already a dependency), lazy-loaded. Props: `columns`
(leaf columns or groups of leaf columns; each leaf has `field`, `header`,
`kind` text / number / percent / currency, optional `pinned`, `flex`, `width`,
`signed` to colour negatives), `rows`, `boldRows` (row indexes), `height`, plus
the same panel frame props as charts. Themed with AG Grid's Theming API from
`--ds-*` tokens, so it follows whichever design system and mode is active with
no per-system code. Row and header heights are fixed for parity.

### 4. Templates
`risk-analytics` and `performance-analytics` in `builderTemplates.ts`, sample
data in `sampleData.ts`, thumbnails in `TemplatePreviews.tsx`. 12-column grid
body, `Nfr` widths, pinned heights.

### 5. Template gallery
The chat carousel shows 2.5 cards and no descriptions and will not scale. Cards
get the description; the templates drawer becomes a grid with category chips
(General / Finance). "Use this" applies in the current design system instead of
asking first; the design-system chips stay as a follow-up to switch.

### 6. Chatbot
- New tool `applyTemplate { templateId }`.
- The system prompt lists the new block type, chart types and props.
- The canvas manifest labels the new blocks.

### 7. Export
Charts: the three new types and new props. Data grid: an `ag-grid-react` table
with the columns and rows on the canvas. Dropdown: real label and options.

### 8. Tests
- Unit: template structure, dropdown renderers and emitters, chart option
  builders, grid column mapping, `applyTemplate` action, export output.
- e2e `builder-finance-templates.spec.ts`: for each template, each design
  system, light and dark: no sideways overflow, and every body block's x, y,
  width and height match Salt's within 1px; Edit matches Present.
- Screenshots of every combination, reviewed by eye.

## Out of scope for slice 1
Row grouping, cell renderers beyond number formats (heat cells, sparklines,
chips arrive with the Sustainable Investment slice), KPI cards with change
semantics (issuer slice), multi-page templates, the FX chart.

## Risks
- AG Grid inside a scaled (CSS `zoom`) frame: verify column sizing and hover.
- Real Material 3 dropdowns are 56px tall; the context row is sized for the
  tallest system.
- The chat loop that makes "apply template" usable is unit-tested only until it
  runs with a model key.

## Additions agreed during the build (2026-10-04)

The owner extended the slice while it was being built. These replace the
earlier lines they contradict ("View by shows its options but does not
re-query"; "Templates carry sample data").

- **Interactive, like the originals.** Filters, "View by" and the master
  grid's selected row drive the panels. This needed a data layer
  (`src/lib/reportData/`): tables, a query engine, computed measures and
  bindings from blocks to data, with the choices held as report state.
- **Real data for demos.** Download the data template as Excel, upload a
  filled-in copy. Uploaded data stays in the browser and is excluded from the
  cloud snapshot.
- **Per-panel configuration and pivoting**, built in-house on AG Grid
  Community (no Enterprise licence).
- **Chrome that matches the original and can be restyled.** Header bars as
  blocks, zone tone / flush / side / visible. The templates open with a dark
  two-bar header and no sidebar or footer.
- **Softer borders.** Panels use each system's secondary border.
- **Chat.** Besides `applyTemplate`: `setReportFilter`, chrome fields on
  `setZoneLayout`, and local (no-model) template and filter commands.
- **Narrow frames.** `layout.spanTablet` / `layout.spanPhone`.

The data grid export is a semantic `<table>`, not `ag-grid-react`: exported
code should not carry a grid dependency for a static table.

