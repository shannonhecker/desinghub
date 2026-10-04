# Finance templates, slice 2: Sustainable Investment

Date: 2026-10-04. Branch: `feat/finance-templates-slice-2` (stacked on
`feat/finance-templates-slice-1`). Source inventory (code read, not run):
`desinghub-review/2026-10-04/inventory-slices-2-4.md`, sections 1 and 2.

The owner approved the slice order and the ground rules on 2026-10-03 (builder
blocks only, identical layout in five design systems, drivable from chat,
neutral names). This note records the decisions taken for this slice without
a further round of questions, because the owner asked for the work to continue
unattended. Each is reversible; the ones most worth a second look are marked
**Review**.

## Goal

Four reports become builder templates:

| Template | What it shows |
|---|---|
| ESG Analytics | summary grid by account; four score gauges and a rating distribution; a dimension breakdown; an E/S/G trend; top and bottom contributors |
| Climate Analytics | summary grid with grouped headers; alignment, emissions, intensity and contribution charts; a dimension breakdown; two rankings |
| Screening | a screening waterfall that filters the universe grid; a security detail panel |
| Screening Changes | a period-change grid with chips, sparklines and rating badges; the same security detail panel |

Same promises as slice 1: one block list per template, every panel within 1px
in all five systems in light and dark, Edit = Present, live filters, chat can
apply / amend / re-theme, nothing clipped on tablet or phone.

## Decisions

1. **Names and brand.** "ESG Analytics", "Climate Analytics", "Screening",
   "Screening Changes"; brand "Meridian Analytics"; category Finance.
2. **Chrome.** The dark two-bar header of slice 1 with "Sustainable
   Investment" as the active tab, plus a left sidebar grouped with `NavGroup`
   labels ("Portfolio": ESG, Climate; "Screening": Screening, Changes) and the
   active page marked. The page title is "Sustainable Investment", as in the
   source. The sidebar's collapse-to-rail is left out.
3. **Data is real, not staged.** The source fakes several effects (selection
   rescales a curated trend; sparklines are hashes of the name; a currency
   filter multiplies security counts). The templates instead bind to one
   sample dataset, `sustainable`, through the slice 1 query engine, so a
   selection genuinely filters and an uploaded workbook genuinely redraws the
   report. Where the source's behaviour is an artefact (currency converting a
   count), it is not copied. **Review:** numbers will not match the source
   screens digit for digit; shapes, columns and formats do.
4. **Cell renderers live in the grid's column model**, as data: `cell: { type:
   "heat" | "bar" | "deltaChip" | "delta" | "sparkline" | "badge" | "toneText"
   | "flag" | "rank", ... }`. Tones are semantic (`good`, `mid`, `bad`,
   `neutral`) and resolve to each design system's status tokens, so a heat
   cell is green in Salt's green and in Carbon's.
5. **The security detail rail becomes a panel.** A `RecordPanel` block (title
   = the selected record; sections of key/value pairs, mini tables and one
   line chart) bound to the selected row of a grid. It sits in the grid as a
   4-column panel beside the 8-column grid and shows a hint until a row is
   selected. A push-in rail would need layout that changes with state, which
   breaks the fixed-geometry promise. **Review.**
6. **The filter rail is left out.** Screening's set-filter side panel is
   replaced by nothing in this slice; the waterfall selection and the grid's
   own sorting remain. A generic filter block can follow if wanted.
   **Review.**
7. **Controls that do nothing in the source are not copied**: Changes' period
   dropdowns and its currency filter, download buttons, overflow menus.
8. **First column header follows "View by"** (a column's `headerFrom:
   "viewBy"`), as in the source.
9. **Selection that scopes other panels** uses slice 1's report state
   (`select:<name>`); a chart point can now set it too (the waterfall), with
   the unselected points dimmed.

## What gets built

### 1. Grid cell renderers (`dataGridModel.ts`, `SimulatedDataGrid.tsx`)
`heat` (thresholds to tones), `bar` (share of a fixed max or of the column
max), `deltaChip`, `delta` (arrow, sign, `upIsGood`), `sparkline` (points
array field), `badge` (tone by value), `toneText`, `flag`, `rank`. Pure
formatters and tone resolution in the model (unit-tested); rendering in the
grid; exported as plain markup.

### 2. Charts (`SimulatedHighchart.tsx`, `chartExporter.ts`)
`waterfall` (steps, sum bar, per-bar colour, selectable); half-dome `gauge`
with the value in the dome (an option on the existing gauge); `colorByPoint`
with explicit point colours; donut slice labels on/off; `selectState` so a
point click sets report state.

### 3. `RecordPanel` block
Sections: `pairs`, `table`, `chart`. Bound to a table row chosen by report
state; empty state text.

### 4. Dataset `sustainable` (`reportData/sustainableDataset.ts`)
`securities` (name, issuer, account, asset class, sector, industry, region,
country, instrument group, entity, market value, covered values, positions,
E / S / G / key-issue / corporate scores, rating, weight, scope 1 / 2 / 3
emissions, intensity EVIC and revenue, alignment, coverage, screening stage,
period-start and period-end ratings and flags, sparkline points), `esgTrend`
(period, periodicity, E, S, G, ESG), `ghgMonthly` (security, scope, month,
value), `fx`. About 40 securities. Downloadable and uploadable like slice 1.

### 5. Templates (`sustainableTemplates.ts`)
Four templates, 12-column body, pinned heights, `uniformStructure`,
`spanTablet` / `spanPhone` on every block.

### 6. Chat, gallery, export, tests
Template ids and summaries; thumbnails; export of the new cell renderers,
waterfall, gauge and `RecordPanel`; unit tests per renderer and binding; the
finance e2e spec extended to the four templates.

## Out of scope
Sidebar collapse rail; filter rail; panel overflow menus; the "Aggregated"
switch and data-level settings of the source's configuration drawer; hatch
pattern fills.

## Risks
- Five gauges and a column chart across one row is tight at 1320: each cell
  is about 230px. Verify legibility in Material 3 first.
- Sparklines in AG Grid cells at a fractional frame scale: draw as inline SVG
  with a viewBox, not canvas.
- Status tokens differ in strength between systems; heat tints are a fixed
  mix over the surface so they stay legible in dark themes.
