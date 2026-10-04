# Inspector and report component checks (QA7)

The Allocation inspector must update the existing chart, retain its bound data, and persist the edited kind, title, frame and height. A pie explicitly resets the previous donut inner size; the redraw handler removes any obsolete centre-label SVG. The standalone exported chart helper follows the same behavior and is executed against real Highcharts in a regression test.

An explicit nonblank centre label overrides the calculated bound total. Clearing the field restores the calculated total. Both canvas rendering and export apply this rule.

Component tests cover PanelFrame expansion/Escape/focus restoration, PanelConfigDrawer reset/close, InstrumentHeader order selection, ExecutionChart range/interval selection, RecordPanel selected/empty states, MetricTile report selection without editor selection, and EntityHeader changing facts.

## Hook findings reviewed

- CodePanel: a shared cancellation ref could be reset by the next design-system request, allowing an older import to replace current snippets. Replaced with request-local cancellation and system-keyed state. The regression resolves requests out of order and returns to cached snippets.
- SaveIndicator: the mount effect read sessionStorage without the write path's failure guard. A SecurityError regression now verifies the save status still renders.
- Fluent documentation: all 12 rules-of-hooks warnings came from anonymous pattern render functions mounted as React components. Named the nine component functions with capitalized names; hooks remain unconditional and their callers remain JSX components.
- TokenReference: the effect probes live official CSS variables and resets a previous system's computed values. DOM-dependent work; retained.
- ComponentRenderer and HoverPreview: mounted flags guard client-only native DS rendering and a document portal; retained to preserve hydration behavior.
- ContextMenu: layout effect measures the submenu before paint and flips it within the viewport; retained.
- HoverInspector (two findings): matchMedia subscription and cancellable hover-delay lifecycle; both clean up. Retained.
- PanelFrame (two findings): width observer drives stacked header layout; expanded portal setup measures its DOM host and removes the observer/slot on cleanup. Retained. Expansion and focus restoration have behavioral coverage.
- SlashInserter (four findings): result-length clamp, query reset, storage recents hydration and close-state reset. They synchronize overlay state and guard insertion of a missing row; retained.
- SortableBlock: mirrors externally changed width units into the gesture HUD; retained so Undo/external updates change the display. Gesture history has QA6 coverage.
- FoundationPage: resets authored-code availability and uses a request-local cancellation flag when system/component changes; retained.

No blanket hook suppressions or coverage thresholds were introduced. Coverage measures production lib/store/component code, including untested files, and emits text, JSON summary and HTML.

## Validation

Final full coverage run: 1,917 tests / 149 files pass. Statements 49.25%, branches 42.06%, functions 43.01%, lines 49.80%. Typecheck and production build pass; lint 0 errors / 2,762 warnings (13 fewer). Token audit adds no literals. Browser verification and independent review are recorded in the PR.

Independent review found two further chart-kind transitions to repair: stacked column/bar retained stacking, and leaving combination could discard a secondary-axis series. Both builder and generated helper explicitly reset stacking and rebind single-axis series to the primary axis. Axis options are emitted as an explicit collection so Highcharts removes a redundant secondary axis even when the primary options match. Live transition tests cover eight single-axis kinds and switching back to combination without losing names or values.
