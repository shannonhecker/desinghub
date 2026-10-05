# The inspector panel: research and design note

Date: 5 October 2026. Scope: the right-hand panel that opens in Edit mode when a block is selected (`.component-sidebar` > `.inspector-stack`), plus what selecting a block does around it (floating block toolbar, canvas fit, the "Editing ..." chip in the chat column).

The owner's words: "there are many missed alignments and it needs more gap and the interaction is a bit messy." The style rule in force: no harsh outlines; tone, not rings; modern and clean.

## 1. What the best properties panels do

| | Figma | Framer | Webflow | Linear (settings and issue panels) |
|---|---|---|---|---|
| Section anatomy | Flat list, 12px title, sentence case, hairline between sections, chevron or "+" at the right | Flat list, sentence case titles, chevron right | Grouped accordions, titles uppercase 11px | Flat list, titles 13px sentence case, generous 16px inset |
| Label placement | Inline glyph inside numeric cells (W, H, X, Y); stacked labels for the rest | Label left, control right on a two column grid (label about 40 percent) | Stacked labels | Label left, control right |
| Numeric fields | Scrub by dragging the glyph, arrows step, Shift steps 10, commit on blur or Enter, one undo step per field edit | Same | Scrub on label, unit shown as a suffix inside the field | Not applicable |
| Segmented controls | Flush track, selected segment is a filled tonal chip, equal widths, text centred, icon or text never clipped | Same, pill track | Boxed | Tonal pill |
| Colour rows | 20px swatch, hex, opacity, visibility | Swatch plus hex | Swatch plus hex | Not applicable |
| Progressive disclosure | Primary controls visible, "..." reveals the rest; sections collapse and remember state | Same | Accordions remember state | Sections are always open |
| Selection | Panel title names the selection in plain words; sections swap, scroll resets to top, focus stays on the canvas | Same | Same | Not applicable |

Shared lessons:

- One inset for every edge. Every label, control and section title starts on the same left line and ends on the same right line.
- One spacing scale with three sizes that matter: label to control (tight), field to field (medium), section to section (large, with a quiet divider).
- One look per control type, from one token set. The panel is tool chrome; it never dresses in the content's design system.
- Dense but calm: 28px controls, 11 to 12px type, nothing uppercase except nothing.
- Predictable interaction: live preview while editing, one undo step per committed change, Escape leaves the field, Tab walks top to bottom, sections remember.

## 2. Decisions for this panel

1. **The inspector is builder chrome, so every control uses the chrome style.** The design-system-rendered controls (`DsInspectorControls`: Salt, Material and Fluent inputs for text, select and toggle) are no longer used by the panel. They were the main reason the panel showed two products at once (filled square Salt inputs beside rounded chrome boxes), they changed look when the user switched design system, and they put a 40px Material field next to a 28px chrome field. Dogfooding belongs on the canvas, which stays authentic to its system. `DsInspectorControls.tsx` stays in the tree (nothing else imports it) so it can be reused for a future "preview a form field in the active system" feature. Flagged as a decision with several valid answers; this is the most defensible one under the owner's "one chrome style" rule.
2. **Stacked labels, with two exceptions.** Labels sit above their control at 6px. Toggles are one row (label left, switch right), the convention in Figma, Linear and macOS for booleans, and a stacked switch left a lonely label. Dimension pairs (W and H, min and max) share one row with an 8px gutter, each cell with its own stacked label. Label-left two-column grids (Framer) were rejected: this panel has long labels ("Options (comma separated)", "Tree items (Parent > Child, ...)") that would wrap into two-line labels next to one-line controls.
3. **One 4px spacing scale, declared as inspector tokens.** Inset 16px on both sides (the same `--bc-panel-inset` the chat column uses). Label to control 6px. Field to field 12px. Section body to next section title 20px plus a hairline. Section title row 36px tall. Control height 28px. Radius 6px. Fields are tonal fills (one step up from the panel ground, no border); hover is one more step; focus is the single ring that stays (2px accent, keyboard and typing focus).
4. **Plain names.** The panel title is the selected block in plain words ("Stat card", "Area chart", "Data table"), with the zone under it as a quiet line. Sections: "Content" (the block's own properties), "Size", "Layout" (the container's flow, with the scope line "Controls the Body container, not the selected block."), "Accent", "Colours". No code names anywhere. The panel's browse mode (nothing selected) keeps the title "Components".
5. **The Size row explains itself.** Each axis is a labelled cell ("Width", "Height"). The mode control (Fill, Hug, px, %) is a select; the value field appears only for px and %, seeded with a sensible number, and the mode select shows the unit so the value never sits beside a mystery box. No disabled empty box.
6. **One segmented control.** Tonal track, equal segments, centred text, `min-width: 0` and `overflow: hidden` on the track so it can never run past the inset. Selected segment is a raised fill with full-strength text (fill plus weight, never colour alone).
7. **Toggles are real switches** (`role="switch"`, `aria-checked`), 32 by 18, tonal track, filled when on, keyboard operable with Space.
8. **Sliders are chrome sliders.** 4px tonal track, 14px thumb, the current value printed at the right of the label row ("Height" ... "200 px") instead of inside the label text, so the label stays a label.
9. **Colour swatches sit on the grid.** Six per row, fluid cells, 8px gap, rounded 6px, selected state is a 2px ring offset 2px (the one ring allowed: a selection ring on a swatch has no other honest form).
10. **Reserve the space, do not overlay.** The panel is docked chrome in Edit mode and opens when the user enters Edit; selecting a block swaps its content and never changes the stage width, so the device frame does not rescale under the pointer. The only time the stage re-fits is when the user explicitly hides or shows the panel (the "Hide component library" button), which is a deliberate act like resizing the window. An overlay panel was rejected because the frame is scaled to the stage width and an overlay would hide the right 300px of every dashboard. Flagged as a decision.
11. **The block toolbar is placed clear, with a flip.** The drag handle, swap and remove sit in one compact 24px pill. It goes above the block when the gap to the previous sibling has room, below the block when the gap to the next sibling has room, and otherwise docks inside the block's own top-right corner (over its padding) so it never covers another block's controls. The pill is measured on selection and on resize.
12. **The "Editing ..." chip never overlaps.** It lives in the composer's flow (the message list shrinks to make room) instead of floating over the last message.

## 3. Tokens (three layers)

Primitives come from the builder chrome (`--bc-gap-*`, `--bc-radius-*`, `--bc-fg*`, `--bc-bg*`, `--bc-accent`, `--bc-border`). The semantic inspector layer and the component tokens are added to `chrome-tokens.css`:

```
Semantic (inspector)
  --insp-inset           16px     left and right inset for every row
  --insp-gap-label       6px      label to control
  --insp-gap-field       12px     field to field
  --insp-gap-section     20px     last control to the next section title
  --insp-head-h          36px     section title row
  --insp-control-h       28px     text, select, number, segmented
  --insp-control-h-sm    24px     small segmented (Up/Down), hex apply
  --insp-radius          6px
  --insp-field-bg        tonal step 1
  --insp-field-bg-hover  tonal step 2
  --insp-field-fg        --bc-fg
  --insp-label-fg        --bc-fg-muted
  --insp-title-fg        --bc-fg
  --insp-hairline        --bc-border at low contrast
  --insp-focus           --bc-accent, 2px

Component
  field:     --insp-field-pad 0 10px; type 12px/1.3 500
  section:   --insp-title-type 12px/1.2 600; --insp-caret 16px
  segmented: --insp-seg-track (field-bg); --insp-seg-on (raised); --insp-seg-pad 0 6px
  slider:    --insp-slider-track 4px; --insp-slider-thumb 14px
  toggle:    --insp-switch-w 32px; --insp-switch-h 18px; --insp-switch-knob 14px
  swatch:    --insp-swatch-gap 8px; --insp-swatch-ring 2px
```

`npm run tokens:audit` must not rise: every new measurement is a token, and the rewritten CSS removes the literals it replaces.

## 4. Interaction rules

- **Tab order** is DOM order: close, header actions (Swap, Remove), then each section title and its controls top to bottom. Section titles are buttons with `aria-expanded` and `aria-controls`.
- **Focus** is a 2px accent ring at 1px offset on keyboard focus for buttons; text, number and select fields show the ring whenever focused.
- **Escape** inside a panel field leaves the field (blur, value kept, since edits are live) and stops there. Escape with focus on the canvas or the panel chrome clears the selection, which returns the panel to browse mode; this matches the chat composer and the canvas pin.
- **Sections remember** their open state per section key in `sessionStorage` for the session. Keys are per block type for Content ("content-StatCard"), fixed for Size, Layout, Accent and Colours, so a choice made on one stat card holds for the next.
- **Numbers**: drag the label or glyph to scrub (1 per px, Shift for 10), Up and Down arrows step (Shift for 10), typed values apply live while inside the field's range; a value outside the range shows a plain inline line ("Keep this between 1 and 100") and is clamped when the field is left. An empty field leaves the value unchanged.
- **Undo**: one step per committed change. A focused text or number field opens a history transaction on focus and closes it on blur, so live typing coalesces into one undo step; scrubs are one step per drag; a select, toggle, segment or swatch is one step per change.
- **Selection change**: the panel scrolls back to the top, keeps the user's open or closed choices, and does not steal focus from the canvas.
- **Validation copy** is plain and inline, under the field, in the muted label colour.
- **Long text** scrolls inside its field; labels wrap to a second line and the control still starts on the inset.
- **Responsive**: at 1280 and 1024 the panel docks at its tablet width (248px) and every control still fits the inset; on phones (767px and under) the panel is a bottom sheet that opens when a block is selected, with a grab bar, the same header and close button, and Escape to dismiss.

## 5. What is not changing

- The store writes: every control keeps writing the same keys with the same shapes, so exports and saved projects are unchanged.
- The canvas rendering of blocks and the finance geometry (`builder-finance-templates.spec.ts`, `builder-layout-parity.spec.ts`).
- Icon elements inside the panel stay as they are (another branch converts the icon font to SVG); the layout positions around them.
