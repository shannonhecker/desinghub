# Core editing flows

Explicit chat additions now work while a template block is selected. Repeated chart, table, and image commands create additional blocks, preserve the existing data, and can be undone. Phrases targeting an existing selection, such as “add a title to this chart”, retain the selected-edit path.

The compatible zone parser and duplicate-add delta logic are adapted from Claude's open PR #400. That branch remains untouched. Whichever PR lands second must reconcile these shared changes; do not apply a competing duplicate-add algorithm.

Pointer width, height, and corner resize gestures record a single history entry across their live frames. Release, pointer cancellation, lost capture, and unmount finish the transaction. Keyboard resize retains individual steps.

The browser suite now exercises all formerly skipped flows through actual controls: keyboard Undo, library click-add, context delete/group, Delete, pointer drag-add, pointer resize with Undo, and Shift-click/keyboard grouping. Tests use fresh browser contexts and a deterministic offline health response. They do not expose a test-only store API.
