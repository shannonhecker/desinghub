# Finance templates, slice 4: FX execution

Date: 2026-10-06. Branch: `feat/finance-templates-slice-4` (stacked on
`feat/finance-templates-density`). Source inventory (code read):
`desinghub-review/2026-10-04/inventory-slices-2-4.md`, sections 4 and 6.
Reference capture of the original: outside the repo, `ux/ref/fx-dark.png`.

Decisions here were taken without a further round of questions, because the
owner asked for the work to continue unattended. The ones most worth a second
look are marked **Review**.

## Goal

One more template, with the same promises as slices 1 to 3 (builder blocks
only, every block within 1px in five design systems in light and dark, Edit =
Present, live, drivable from chat, nothing clipped on tablet or phone):

| Template | What it shows |
|---|---|
| FX Execution | One algo order worked through a session: the market (bid, ask, mid), the order's limit price and percent done, its fills by venue, the execution states, and the benchmarks; beside it the order's statistics, a passive / aggressive gauge and a venue breakdown |

## What the original is

A single dark page, not a report shell: a two-line instrument header; a 44px
tool rail, one large time-series chart with a row of range chips under it,
and a 300px analytics card; a footnote. It is a trading-style surface with 26
hand-written interactions (live ticking feed, order ticket, drag-to-amend,
drawing tools, context menus, wheel zoom).

## Decisions

1. **Name.** "FX Execution"; category Finance; brand-neutral. The pair stays
   "EURUSD" (a market, not a client). Venue names are invented (the source
   uses real venue and bank product names). Order ids are invented.
2. **What is kept.** The look at rest, and the interactions that change what
   the page SHOWS: interval, chart type (line, candlestick, OHLC), range
   presets, overlays on / off, the venue cross-filter (donut and chart), the
   order switch (a working BUY and a filled SELL), legend toggles, and the
   panel's Expand (the visible bars as a table, which is the original's
   "Visible data").
3. **What is left out. Review.** Everything that acts on an order or draws on
   the chart: the live ticking feed, the order ticket and its launchers
   ("Fill now", the quote buttons act as a readout only), drag-to-amend,
   drawing tools, alerts, context menus, wheel / drag zoom, the Go to and
   Compare dialogs, the Classic / Enhanced switch (the template shows the
   Enhanced header: order tabs). The source's own inventory notes a static
   rebuild needs none of these. They are trading behaviour, not report
   behaviour, and each would be a block with no second user.
4. **Real data.** A sample dataset `fx`: minute bars, hourly history, fills,
   execution states, orders and venues, generated from a seed (so it is the
   same on every load) and downloadable / uploadable as a workbook like the
   others.
5. **Built from blocks.**
   - `InstrumentHeader` (header zone): symbol, description, fills counter,
     OHLC readout, change, a two-sided quote; second line: status, order
     tabs, a data note.
   - `ExecutionChart` (body): the chart in a panel, with its tool rail down
     the left edge and its range chips under it. The rail and the chips are
     the chart's own controls, so they live in the chart block; every choice
     is report state, so the chat can set it.
   - The analytics column is a layout group of three existing blocks: a
     record panel (the statistics, one pair per line, zebra), a gauge (a
     220-degree thin ring), a donut bound to the fills (select a venue to
     highlight its fills on the chart; expanded, it shows the venue table).
6. **Theme.** The original is dark by default. A template does not set the
   mode; the reader's mode stays. **Review.**
7. **Time axis.** Bars are plotted by position, with the time as the label,
   so the inactive gap, weekends and holidays take no room (the source does
   this with axis breaks).

## What gets built

- `reportData/fxDataset.ts`: tables `fxOrders`, `fxBars`, `fxHistory`,
  `fxFills`, `fxStates`, `fxVenues`.
- `executionModel.ts`: pure: dataset + report state -> the chart's series,
  bands, pills, header figures. Unit tested.
- `ExecutionChart.tsx`, `InstrumentHeader` (in `ReportBlocks.tsx`).
- Gauge: `sweep` (180 or 220) and gradient-free thin ring. Record pairs:
  signed values with a tone, zebra rows.
- Template, template id, chat summary, thumbnail, e2e, export, docs.

## Out of scope

See decision 3. Also: real quotes over WebSocket; the right-click price
scale menu (auto, invert, log); the hint banner.

## Risks

- The chart is one large bespoke block. It is the only way to draw it, but it
  is the least "composable" block in the set: its parts cannot be rearranged.
- Candlestick and OHLC need the Highcharts stock module (already a
  dependency of the package; not yet loaded).
- A 220-degree gauge and hand-drawn price pills must hold at 0px across five
  systems; both are drawn by the frame, not by a system component.
