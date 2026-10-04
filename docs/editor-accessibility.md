# Editor and report accessibility

QA item 5 preserves report-panel dimensions and the dense inline-control appearance. Interactive areas cover the full 24px toolbar slot; panel tools compensate for the canvas zoom so their physical hit areas remain at least 24px at desktop editor widths.

Present block wrappers have no button role or tab stop. Edit wrappers are groups with keyboard selection on Enter/Space; drag semantics live on the dedicated drag handle. Grid cells support arrow navigation, keyboard row selection when applicable, and Tab exits. Headers remain reachable by ArrowUp and Enter sorts ungrouped grids.

Expanded panels receive focus, contain the Tab sequence while preserving Highcharts navigation, and restore focus to Expand or Configure on Escape/collapse. Portalled select menus retain their own keyboard handling. Contrast changes use the active design-system foreground/status tokens and retain semantic colours. Comparison categories such as `<2C` have spoken labels so Highcharts does not strip them as HTML.

Chat and library use a common outer inset and spacing scale. The composer has room for its multiline placeholder and grows with content in supporting browsers.

## Validation

Browser regressions cover Present wrapper semantics, expanded grid focus/restore, expanded chart-to-table navigation, grid arrows/Tab and sorting, initial frame dimensions, and idle geometry. The stationary-pointer report has **not** been reproduced: 120-frame samples of frame, panel and chart bounds are stable with a selected Fluent panel and both side panels open at 768/1440/1512/1920px. The invalid initial max-height animation is fixed separately; this is not evidence that every shaking scenario is resolved.

Final production matrix and full-suite evidence are recorded in the pull request. The automated audit is not a substitute for manual screen-reader or physical-device validation.
