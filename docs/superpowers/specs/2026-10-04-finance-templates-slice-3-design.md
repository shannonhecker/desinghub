# Finance templates, slice 3: issuer reports, scorecard, home

Date: 2026-10-04. Branch: `feat/finance-templates-slice-3` (stacked on
`feat/finance-templates-slice-2`). Source inventory (code read, not run):
`desinghub-review/2026-10-04/inventory-slices-2-4.md`, section 3.

Decisions here were taken without a further round of questions, because the
owner asked for the work to continue unattended. The ones most worth a second
look are marked **Review**.

## Goal

Six more templates, with the same promises as slices 1 and 2 (builder blocks
only, every panel within 1px in five design systems in light and dark, Edit =
Present, live, drivable from chat, nothing clipped on tablet or phone):

| Template | What it shows |
|---|---|
| Issuer Climate | an issuer's emissions against a benchmark, its net-zero pathway, an alignment verdict, scope emissions, two peer rankings |
| Issuer Business Involvement | five involvement counts, a grouped detail grid, a peer radar |
| Issuer Controversies | three controversy score cards, a grouped severity grid |
| Entity Comparison | two entity summaries, a radar, score / rating / emissions comparisons |
| Governance Scorecard | four category cards that filter positive and negative indicator grids, and a reference grid |
| Analytics Home | a hero with search, four launcher cards that open the other templates, a filterable list of dashboards |

## Decisions

1. **Names.** As in the table; brand "Meridian Analytics"; category Finance.
   Issuer names are invented.
2. **Left out** (not in the owner's list, found in the inventory): the
   duplicate "Business Involvement & Controversies" entry, Home's
   Configuration, Approvals and Reports Repository pages, and the "Select
   data" modal. **Review:** say if any is wanted.
3. **The entity is report state.** The source picks the issuer from the page
   title, which opens a menu. Here an "Entity" dropdown in the context row
   sets report state `entity`, and an `EntityHeader` block shows the chosen
   issuer's name and facts. Same behaviour, built from blocks the builder
   already has. **Review.**
4. **Real data.** One sample dataset, `issuer`: entities, their emissions,
   pathway, involvement, controversies, rating history and indicators, plus
   cohort benchmarks. Changing the entity filters real rows.
5. **The comparator is a second filter.** Entity Comparison's second entity is
   fixed in the source; here it is a "Compare with" dropdown (state
   `comparator`).
6. **Launcher cards open templates.** On Home, "Open report" applies the
   matching template, which is what the source's tab switch amounts to.
7. **Controls that do nothing in the source are not copied** ("View in Data
   Explorer", "Compare" row buttons, overflow menus, the "Details" tab).

## What gets built

### Blocks
- `EntityHeader`: a title and a line of "label: value" facts from the
  selected row of a table, with optional count badges. Bound like a Record
  panel.
- `MetricTile`: label, large figure, optional icon, optional sub-figures
  beside it, optional chips; can be selectable (writes report state) and
  shows a selected state. Covers the icon stat cards, the Social card with
  sub-stats, and the scorecard's category cards. Bound to `value` bindings.
- `VerdictCard`: chip, hero figure with unit and status, caption, labelled
  progress bar, two stats, footnote; tone from the data.
- `LauncherCard`: accent bar, title, tag, thumbnail, description, a button
  that applies a template.
- Record panel gains a left accent and a plain "pairs only" use for the
  entity summary cards.

### Charts
`radar` (polar line, dashed second series), `arearange` band with two lines
(the pathway corridor), a categorical value axis (`yAxisCategories`), white
bar borders left out (they do not suit dark themes).

### Grid
Cells `dot` (dot + value or word, hollow variant, blank at zero) and `chip`
(tinted or solid, toned by value); group and leaf rows from data (`_bold`,
`_indent` already exist: a records binding learns `groupField` to lay rows
out as group + indented leaves with a count); a "View by" that switches which
column is shown (`viewColumn`).

### Dataset `issuer`
Tables: `entities`, `emissionsSummary` (entity or cohort x metric),
`scopeEmissions`, `pathway` (entity x year), `peers`, `involvement` (entity x
activity), `involvementPeers`, `controversies` (entity x category),
`ratingTrend`, `indicators`, `reference`, `dashboards`, `fx`.

### Templates, chat, gallery, export, tests
As in slice 2: template ids and summaries, thumbnails, export of the new
blocks and charts, unit tests per block and binding, the finance e2e spec
extended to the six templates.

## Out of scope
The entity title as a menu; sidebar collapse; the search box's typeahead
results (the search field is shown, not wired); hatch pattern fill on the
corridor (a translucent band instead).

## Risks
- Twelve templates in the gallery: the category chips already exist; check
  the carousel still reads well, and consider sub-groups if not.
- The scorecard's three grids are of different lengths; pinned heights mean
  the shorter ones have empty space or the longer ones scroll.
