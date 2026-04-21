/* Carbon component registry.
   Mirrors the shape of SALT_COMPONENTS / M3 / FLUENT registries.
   Category naming ("Foundations" / "Components & Patterns" / "Patterns")
   follows the Salt convention so Design Hub navigation groups Carbon the
   same way across the app.

   The actual CSS rules + demo renderers live in
   carbon-documentation.jsx (consumed by registry.ts). This file only
   surfaces the metadata the component switcher renders. */

import type { ComponentDef } from "../salt/components";

export const CARBON_COMPONENTS: ComponentDef[] = [
  /* ─── Components ─── */
  {
    id: "buttons",
    name: "Button",
    cat: "Components & Patterns",
    desc:
      "Eight kinds (primary, secondary, tertiary, ghost, danger, danger--primary, danger--tertiary, danger--ghost) across six sizes (xs/sm/md/lg/xl/2xl). Zero border-radius; 2px $focus outline.",
  },
  {
    id: "inputs",
    name: "Text Input",
    cat: "Components & Patterns",
    desc:
      "40px field with a 1px $border-strong-01 bottom rule that swaps to a 2px $focus rule on focus. label-01 above, helper-text-01 below, invalid state adds a 2px $support-error outline + trailing error icon slot.",
  },
  {
    id: "number-input",
    name: "Number Input",
    cat: "Components & Patterns",
    desc:
      "Text-input shell with a paired 40×40 stepper stack on the trailing edge (+ / −). $field-01 bg with a $border-strong-01 left separator between input and steppers.",
  },
  {
    id: "dropdowns",
    name: "Dropdown",
    cat: "Components & Patterns",
    desc:
      "Shares the TextInput field shell (40px, $field-01, bottom $border-strong-01). Trailing down-chevron in $icon-primary. Menu opens directly beneath with $layer-01 surface and $shadow-floating.",
  },
  {
    id: "checkboxes",
    name: "Checkbox",
    cat: "Components & Patterns",
    desc:
      "18×18 square, 2px $icon-primary border. Checked state fills with $background-brand and shows a checkmark glyph in $icon-on-color. Label uses label-01 with an 8px gap.",
  },
  {
    id: "switches",
    name: "Toggle",
    cat: "Components & Patterns",
    desc:
      "48×24 pill. Off state uses $toggle-off, on state uses $support-success. 20×20 white thumb with 2px inset, 70ms ease translation.",
  },
  {
    id: "tabs",
    name: "Tabs",
    cat: "Components & Patterns",
    desc:
      "40px tablist with a 2px $border-strong-01 baseline and a 3px $border-interactive underline on the selected tab. body-compact-02 label (14/18 / 400), $text-primary selected vs $text-secondary inactive.",
  },
  {
    id: "data-table",
    name: "Data Table",
    cat: "Components & Patterns",
    desc:
      "No border-radius. 48px md rows. Header row $layer-accent-01 with heading-02 14px bold; cells padded 0 $spacing-05. Row hover $layer-hover-01, selected row $background-selected.",
  },
  {
    id: "cards",
    name: "Tile",
    cat: "Components & Patterns",
    desc:
      "Flat Carbon tile: no border-radius, $layer-01 surface, $spacing-05 padding. Optional outline variant adds a 1px $border-subtle-01 border; clickable/selectable variants get hover + 2px $interactive outline.",
  },
  {
    id: "tags",
    name: "Tag",
    cat: "Components & Patterns",
    desc:
      "24px pill (1rem radius), 0 $spacing-03 padding, label-01 at 500 weight. Colour variants cover the Carbon palette (red / magenta / purple / blue / cyan / teal / green / gray / cool-gray / warm-gray / high-contrast / outline).",
  },
  {
    id: "textarea",
    name: "Textarea",
    cat: "Components & Patterns",
    desc:
      "Multiline input with character counter (/500), vertical resize handle, and error-state outline. Reuses label-01 + helper-text pattern from Text Input.",
  },
  {
    id: "combobox",
    name: "ComboBox",
    cat: "Components & Patterns",
    desc:
      "Searchable dropdown with live filter, clear button, empty state, and keyboard navigation. Menu anchored via $shadow-floating.",
  },
  {
    id: "multiselect",
    name: "MultiSelect",
    cat: "Components & Patterns",
    desc:
      "Multi-value dropdown. Inline selection count chip, inline chip list, and a Clear all action to bulk-unselect.",
  },
  {
    id: "form-field",
    name: "Form Field",
    cat: "Components & Patterns",
    desc:
      "Field wrapper: label + control + helper-text + error-message stacked on $spacing-03. Carbon's canonical labelled-input pattern.",
  },
  {
    id: "file-uploader",
    name: "File Uploader",
    cat: "Components & Patterns",
    desc:
      "Drag-and-drop zone with drag-over state; accepted-file chip list with × remove and distinct reject error styling.",
  },
  {
    id: "date-picker",
    name: "Date Picker",
    cat: "Components & Patterns",
    desc:
      "Carbon-flatpickr-style month grid: single + range + simple input, day states for today / selected / in-range, keyboard nav.",
  },
  {
    id: "notification",
    name: "Notification",
    cat: "Components & Patterns",
    desc:
      "Info / success / warning / error kinds. Inline (full-bleed) vs toast (floating, top-right, auto-dismiss).",
  },
  {
    id: "divider",
    name: "Divider",
    cat: "Components & Patterns",
    desc:
      "Horizontal + vertical + optional-label variants. $border-subtle-01 by default.",
  },
  {
    id: "badge",
    name: "Badge",
    cat: "Components & Patterns",
    desc:
      "Small numeric or dot indicator, semantic colours via $support-*. Attaches to icons or avatars.",
  },
  {
    id: "header",
    name: "Header / UI Shell",
    cat: "Components & Patterns",
    desc:
      "Black IBM UI Shell ($background-inverse bar) with brand slot, inline nav, and global icon actions.",
  },
  {
    id: "sidenav",
    name: "Side Navigation",
    cat: "Components & Patterns",
    desc:
      "Rail (48px) + expanded (256px). Active item gets a 2px $border-interactive left border; supports nested items.",
  },
  {
    id: "drawer",
    name: "Drawer",
    cat: "Components & Patterns",
    desc:
      "Right-anchored slide-over with overlay backdrop, focus trap, Esc close, and header / body / footer slots.",
  },
  {
    id: "skip-link",
    name: "Skip Link",
    cat: "Components & Patterns",
    desc:
      "Visually hidden until focused, then renders fixed at top-left. Routes keyboard users to #main-content per WCAG 2.4.1.",
  },
  {
    id: "bottom-nav",
    name: "Bottom Navigation",
    cat: "Components & Patterns",
    desc:
      "Mobile-pattern tab bar: 3–5 items with icons, active item uses $text-primary and honours safe-area-inset-bottom.",
  },
  {
    id: "overflow-menu",
    name: "Overflow Menu",
    cat: "Components & Patterns",
    desc:
      "Kebab trigger opens an action menu with optional separator and danger-item variant.",
  },
  {
    id: "code-snippet",
    name: "Code Snippet",
    cat: "Components & Patterns",
    desc:
      "Inline, multiline, and terminal variants. Copy button writes to clipboard.",
  },
];
