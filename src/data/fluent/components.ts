import type { ComponentDef } from '../salt/components';

export const COMPS: ComponentDef[] = [
  { id: "dl-icons", name: "Iconography", cat: "Design Language", desc: "Fluent System Icons -- 4,000+ SVG icons in Regular and Filled variants." },
  { id: "dl-color", name: "Color", cat: "Design Language", desc: "Neutral (grays), Brand (blue), and Status (semantic) palettes." },
  { id: "dl-typography", name: "Typography", cat: "Design Language", desc: "Segoe UI type ramp with 16 styles. Regular and Semibold weights." },
  { id: "dl-elevation", name: "Elevation", cat: "Design Language", desc: "Six shadow levels using key + ambient dual shadows." },
  { id: "dl-shapes", name: "Shapes", cat: "Design Language", desc: "Rectangle, Circle, Pill, Beak. Corner radius from 0 to 50%." },
  { id: "dl-spacing", name: "Spacing", cat: "Design Language", desc: "4px base unit with ramp (2-32px)." },
  { id: "dl-motion", name: "Motion", cat: "Design Language", desc: "Duration tokens (50-400ms). Easing curves for entries, exits, standard." },
  { id: "dl-a11y", name: "Accessibility", cat: "Foundations", desc: "WCAG 2.1 AA. Contrast, focus, keyboard, ARIA, High Contrast Mode." },
  { id: "dl-density", name: "Density & Size", cat: "Foundations", desc: "Small 24px / Medium 32px / Large 40px. Height, padding, font adjust." },
  { id: "dl-content", name: "Content Design", cat: "Foundations", desc: "UX writing: simple, direct, human. Style rules for tense and voice." },
  { id: "buttons", name: "Buttons", cat: "Actions", desc: "Primary, Default, Outline, Subtle variants in 3 sizes." },
  { id: "inputs", name: "Text Input", cat: "Inputs", desc: "Labeled text input with bottom-border accent on focus." },
  { id: "checkboxes", name: "Checkbox", cat: "Inputs", desc: "Brand-colored fill when checked. Hover shows brand border." },
  { id: "radios", name: "Radio Group", cat: "Inputs", desc: "Single selection. Inner dot pattern with brand border." },
  { id: "switches", name: "Switch", cat: "Inputs", desc: "Toggle on/off. Brand fill when on, thumb slides." },
  { id: "slider", name: "Slider", cat: "Inputs", desc: "Drag thumb to select a value. Brand-colored." },
  { id: "cards", name: "Cards", cat: "Containment", desc: "Hover lifts with shadow. Background shifts. Subtle stroke." },
  { id: "badges", name: "Badges", cat: "Communication", desc: "Brand, danger, success, warning, subtle variants." },
  { id: "avatars", name: "Avatars", cat: "Communication", desc: "Circular initials in 3 sizes (24/32/48)." },
  { id: "tabs", name: "Tabs", cat: "Navigation", desc: "Underline-style. Active shows brand underline + semibold." },
  { id: "messagebars", name: "Message Bars", cat: "Communication", desc: "Info, success, warning, danger. Semantic backgrounds." },
  { id: "dialogs", name: "Dialog", cat: "Communication", desc: "Modal with shadow28 elevation. Title, body, action buttons." },
  { id: "menus", name: "Menu", cat: "Navigation", desc: "Dropdown with subtle hover. Dividers separate sections." },
  { id: "progress", name: "Progress", cat: "Communication", desc: "Linear bar (2px) and circular spinner. Brand-colored." },
  { id: "tooltips", name: "Tooltips", cat: "Communication", desc: "Hover-triggered. Inverted background. Fade-in." },
  { id: "links", name: "Links", cat: "Navigation", desc: "Brand-colored text links. Underline on hover." },
  { id: "dividers", name: "Dividers", cat: "Containment", desc: "1px stroke2 line. Optional inset." },
];

export const CATS = ["Design Language", "Foundations", "Actions", "Inputs", "Navigation", "Communication", "Containment"];
