# FX Execution: trading behaviour

Date: 2026-10-06. Branch: `feat/fx-trading` (off `main` at `70c549a`).
Follows `2026-10-06-finance-templates-slice-4-design.md`, which left the
original dashboard's trading behaviour out. The owner has now asked for all
of it. Source inventory: `desinghub-review/2026-10-04/inventory-slices-2-4.md`,
section 6 (26 interactions). Source code read: `fx-execution-analytics/src`.

## Goal

The FX Execution template behaves like the original: prices tick, the chart
can be navigated and drawn on, and an order can be staged, amended and
"submitted", with the same promises as every finance template (builder
blocks only, 0px parity across five design systems in light and dark, Edit =
Present, nothing clipped on tablet or phone, drivable from chat).

## Principles

1. **Nothing is ever sent anywhere.** There is no order, no broker, no
   market-data connection. "Submit" shows a confirmation and adds a line to
   the limit-price log, exactly as the original demo does. The header keeps
   its "Sample data" note. Real quotes over WebSocket are NOT built (they
   would send the reader's address to a third party and need a key).
2. **Present only.** In Edit the chart is a block to select, move and
   resize; pointer gestures on it would fight the builder's own. All of the
   below is live while presenting (and in a shared preview), static in Edit.
3. **Every gesture has a keyboard and a menu path.** Drag-to-amend is also
   "Amend limit price" in the price menu and a field in the ticket; drawing
   tools work from the rail with Enter; zoom has rail buttons. A gesture is
   never the only way.
4. **Motion can be turned off.** The feed has a Live / Paused control in the
   header, starts paused when the reader prefers reduced motion, and pauses
   when the tab is hidden.
5. **State the chat can see stays report state** (live on / off, tool,
   drawings count). Per-frame things (pan, zoom, a drag in progress) stay in
   the chart and never touch the store, so a tick does not re-render the page.
6. **Parity is measured with the feed paused.** The e2e parity and
   Edit = Present tests set `fxLive: Off`; the feed changes numbers, never
   the size or position of a block.

## What gets built, in four PRs

### PR A. Live feed

- `executionFeed.ts` (pure): `createTicker(view, seed)` returns `next()`:
  one new bar a second (mid random walk, bid / ask, average fill, percent
  done, TWAP, sometimes a fill), deterministic from a seed. A filled order's
  own series stop; the market keeps moving.
- The chart appends the bar to its series in place (no rebuild); the header
  figures, fills counter, percent done, the BID tag and its latest-price
  line follow. The statistics, gauge and donut follow for a working order.
- On an interval above one minute, the BID tag shows "closes in Nm".
- Controls: Live / Paused in the header (state `fxLive`); "Reset" returns to
  the seeded session.
- The feed's bars are session-only: they are not written to the dataset,
  the cloud snapshot or the export. Export shows the frozen moment.

### PR B. Chart navigation

- Wheel: zoom in time on the plot, in price on the price axis, centred on
  the pointer. Drag: pan (vertically too once the price scale is manual).
  Drag the price axis to scale it; drag the time axis to stretch it.
  Double-click an axis, or the plot, to reset.
- Box zoom (rail): draw a rectangle, zoom both axes, switch off after one use.
- Press and hold (450ms) pins the crosshair and tooltip; a one-time hint.
- "Go to" dialog from a calendar chip: a date, or a custom range, limited to
  days the data covers. Built from the active design system's own dialog,
  date picker and buttons.
- Rail: Zoom group (box zoom, zoom in, zoom out, reset).

### PR C. Drawing, alerts and menus

- Rail: Drawing group (cursor, trend line, horizontal line, remove all).
  Trend line = two clicks; horizontal line = one. Drawings are report state
  (`fxDrawings`, a short JSON list) so they survive a re-render, are saved
  with the session, and are exported as plot lines.
- Price alert: a dashed line with a bell label at a price.
- Right-click (and the keyboard menu key, and long-press on touch) on the
  plot: Copy price, Add alert, Buy limit, Sell stop, Add order, Draw
  horizontal line, Clear drawn lines, Table view, Settings.
- Right-click on the price scale: Auto, Invert, Logarithmic, Move to left /
  right.
- "Settings" dialog: the overlays and the three execution states as
  checkboxes (the rail's Overlays flyout already holds the same switches).
- Menus are the active design system's own menu component where it has one.

### PR D. Order entry and amendment

- **Order ticket** dialog: pair, Submit, two price tiles to pick the side,
  then Order type (Limit / Market / Stop / Take profit), Liquidity pool
  (the venues), Direction, Notional, Limit or stop price, Iceberg, Start
  (now / delayed), Good till (GTC / GTD / Day), Account. Fields are the
  active design system's inputs and dropdowns. Submit validates (a positive
  notional, a price within a sane band of the market) and shows a toast.
- Launchers: the header's S / B quote tiles, a "Fill now" button, the menu's
  Buy / Sell / Add order, and the BID tag drag.
- **Drag the limit-price line** to amend: a dashed preview with
  "LMT -> price" follows the pointer, snapping to 0.00001; on release the
  limit series gains a step and a toast confirms. Also reachable as "Amend
  limit price" (a small dialog with one field).
- **Drag the BID tag** to stage an order: release above the market opens a
  Sell take-profit ticket, below opens a Buy limit ticket.
- Click a price tag: the price menu, anchored to it.
- **Compare orders** dialog: a three-column table of ten measures for the
  two orders and a small "percent done" chart of both.
- Toast: one shared, polite live region; four seconds; never stacks more
  than one.

## Blocks and files

- `ExecutionChart.tsx` grows; split it: `ExecutionChart.tsx` (shell, rail,
  chips), `executionChartOptions.ts` (pure options builder, tested),
  `useExecutionFeed.ts`, `useChartNavigation.ts`, `useChartDrawing.ts`,
  `OrderTicket.tsx`, `ExecutionDialogs.tsx` (Go to, Compare, Settings,
  Amend), `ExecutionMenu.tsx`.
- New pure modules with unit tests: `executionFeed.ts`,
  `executionOrders.ts` (validate a ticket, apply an amendment to the limit
  series, compare two orders), `executionDrawings.ts`.
- Dialogs, menus, inputs: through `RealComponentRenderer` so each system
  draws its own. Where a system has no menu or dialog in the builder yet,
  that is added to the kit first, in its own commit.
- Template: `fxExecution` gains `fxLive` and tool controls in its `filters`
  list, so the chat can say "pause the feed", "add an alert at 1.3765",
  "open a buy limit ticket".

## Accessibility

- Dialogs trap focus, restore it on close, close on Escape.
- Menus are real menus (arrow keys, type-ahead, Escape).
- The live figures are not announced on every tick: the header region is
  `aria-live="off"`; the toast is the only polite announcer.
- The chart keeps its "View: Table" alternative; the table follows the feed.
- Targets are at least 24px, including the price tags and the rail.
- Colour is never the only signal: side is a word (BUY / SELL), change has a
  sign.

## Testing

- Unit: feed determinism and invariants (bid < mid < ask; percent done never
  falls; a filled order stops), ticket validation, amendment, drawings
  round-trip, compare table.
- E2E (Present): feed advances and pauses; wheel zoom changes the visible
  range and reset restores it; a horizontal line can be drawn and removed;
  the menu opens by mouse and by keyboard; a ticket can be opened from each
  launcher, validated and submitted; the limit line can be amended by drag
  and by dialog; Compare opens. Parity, Edit = Present, tablet and phone
  with the feed paused. Reduced motion: the feed starts paused.
- Accessibility: the axe script from the 6 Oct test pass on the template
  with each dialog open.

## Risks and open points

- **Size.** This is roughly the original's 3,200 lines again, rebuilt on
  builder components across five systems. Four PRs, each reviewable alone.
- **Touch.** The original has no phone layout and its gestures assume a
  mouse. On touch: pinch to zoom, drag to pan, long-press for the menu; the
  drags that amend or stage an order are replaced by their menu paths.
- **One user.** These pieces serve one template. They are kept inside the
  execution chart's folder, not promoted to general blocks, until a second
  template needs them.
- **Perception.** A ticking feed and a Submit button look like a trading
  screen. The "Sample data" note stays visible at all times, and the
  confirmation says "Sample order. Nothing was sent."
- **Review:** should "Fill now" exist at all? In the original it opens the
  ticket. It is kept as a launcher here.
- The 6 Oct test pass found accessibility and security work to do on the
  rest of the app (Codex is on it). This work does not depend on that, but
  PR A should land after the Next.js upgrade if that changes the build.
