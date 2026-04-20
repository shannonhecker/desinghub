/* Carbon component registry.
   Mirrors the shape of SALT_COMPONENTS / M3 / FLUENT registries.
   The ten entries below cover the components specified by the Carbon
   refresh plan: Button, TextInput, NumberInput, Dropdown, Checkbox,
   Toggle, Tabs, DataTable, Tile, Tag. Category naming (Foundations /
   Components & Patterns / Patterns) follows the Salt convention so
   the Design Hub navigation groups Carbon the same way.

   The actual CSS rules + demo renderers live in
   carbon-documentation.jsx (consumed by registry.ts). This file
   only surfaces the metadata the component switcher renders. */

import type { ComponentDef } from "../salt/components";

export const CARBON_COMPONENTS: ComponentDef[] = [
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
      "24px pill (1rem radius), 0 $spacing-03 padding, label-01 at 500 weight. Colour variants cover the Carbon palette (red / magenta / purple / blue / cyan / teal / green / gray / cool-gray / warm-gray).",
  },
];
