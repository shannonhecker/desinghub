export interface ComponentDef {
  id: string;
  name: string;
  cat: string;
  desc: string;
}

export const COMPS: ComponentDef[] = [
  // Foundations
  { id: "dl-color", name: "Color", cat: "Foundations", desc: "Aurora palette with glassmorphism surfaces. Neutral accent, white-opacity layers, subtle borders. Signature gradient foundation." },
  { id: "dl-icons", name: "Iconography", cat: "Foundations", desc: "Material Symbols Outlined icons with muted white tones. Density-responsive sizing." },
  { id: "dl-typography", name: "Typography", cat: "Foundations", desc: "DM Sans type scale. 10 styles from Caption to Display. White-opacity hierarchy on dark backgrounds." },
  { id: "dl-elevation", name: "Elevation", cat: "Foundations", desc: "4 glass elevation levels using backdrop-filter blur + white-opacity borders. No drop shadows — depth via transparency." },
  { id: "dl-spacing", name: "Spacing", cat: "Foundations", desc: "4px base grid. Proportional scale (25-300). Adjusts with density." },
  { id: "dl-tokens", name: "Token Architecture", cat: "Foundations", desc: "Semantic CSS variables: --a-bg, --a-surface, --a-fg, --a-accent, --a-border. Glass tokens for blur + saturation." },
  { id: "dl-a11y", name: "Accessibility", cat: "Foundations", desc: "WCAG 2.1 AA. 4.5:1 contrast on glass surfaces, focus rings, 44px touch targets, reduced motion support." },
  { id: "dl-density", name: "Density", cat: "Foundations", desc: "4 levels: High (20px), Medium (28px), Low (36px), Touch (44px). All on 4px scaling grid." },
  { id: "dl-content", name: "Content Design", cat: "Foundations", desc: "Concise, premium voice. Sentence case. Present tense, active verbs." },
  { id: "tokens", name: "Tokens", cat: "Foundations", desc: "Token reference for all design tokens with contrast ratios." },
  { id: "audit", name: "Design Audit", cat: "Foundations", desc: "Paste code to audit for raw hex values, wrong APIs, and accessibility issues." },
  // Components & Patterns
  { id: "charts", name: "Charts & Dataviz", cat: "Components & Patterns", desc: "12 chart types with glass card containers and muted teal data series." },
  { id: "buttons", name: "Buttons", cat: "Components & Patterns", desc: "4 appearances: primary (glass-filled), secondary (bordered), ghost (transparent), outline. Muted teal accent." },
  { id: "inputs", name: "Text Input", cat: "Components & Patterns", desc: "Glass surface input with subtle bottom-border accent on focus. Frosted backdrop." },
  { id: "checkboxes", name: "Checkbox", cat: "Components & Patterns", desc: "Teal fill when checked. Glass-bordered unchecked state." },
  { id: "radios", name: "Radio Buttons", cat: "Components & Patterns", desc: "Teal ring + inner dot when selected. Subtle glass border." },
  { id: "switches", name: "Switch", cat: "Components & Patterns", desc: "Glass track with teal fill when on. Smooth thumb animation." },
  { id: "tabs", name: "Tabs", cat: "Components & Patterns", desc: "Glass underline indicator. Muted labels, active state with teal accent." },
  { id: "cards", name: "Cards", cat: "Components & Patterns", desc: "Frosted glass cards with backdrop-blur, subtle borders, inset highlight on top edge." },
  { id: "badges", name: "Badges", cat: "Components & Patterns", desc: "Glass pill badges. Status variants: default, info, success, warning, error." },
  { id: "avatars", name: "Avatars", cat: "Components & Patterns", desc: "Glass-bordered circle with initials. Presence indicators." },
  { id: "alerts", name: "Alerts", cat: "Components & Patterns", desc: "Glass message bars with status-tinted borders. Info, success, warning, error." },
  { id: "progress", name: "Progress", cat: "Components & Patterns", desc: "Glass-track progress bar with teal fill. Indeterminate animation." },
  { id: "tooltips", name: "Tooltips", cat: "Components & Patterns", desc: "Frosted glass tooltip with subtle shadow. Arrow pointer." },
  { id: "dropdowns", name: "Dropdown", cat: "Components & Patterns", desc: "Glass surface menu with hover highlights. Frosted backdrop." },
  { id: "dialog", name: "Dialog", cat: "Components & Patterns", desc: "Glass modal overlay with frosted backdrop. Centered card layout." },
  { id: "accordion", name: "Accordion", cat: "Components & Patterns", desc: "Collapsible glass sections with chevron indicator." },
  { id: "breadcrumbs", name: "Breadcrumbs", cat: "Components & Patterns", desc: "Subtle path navigation with separator dots." },
  { id: "date-picker", name: "Date Picker", cat: "Components & Patterns", desc: "Calendar date selector with glass surface and accent highlight on selected date." },
  { id: "data-table", name: "Data Table", cat: "Components & Patterns", desc: "Glass-row striping with hover highlights and sortable headers." },
  { id: "ag-grid", name: "AG Grid", cat: "Components & Patterns", desc: "Enterprise data grid with glass theming, sorting, filtering, and density scaling." },
  // Patterns
  { id: "pat-dashboard", name: "Analytical Dashboard", cat: "Patterns", desc: "Glass stat cards, charts, and data tables composed into an analytics overview." },
  { id: "pat-form", name: "Forms", cat: "Patterns", desc: "Glass input fields, validation, and button bar composed into a data entry form." },
  { id: "pat-list-detail", name: "List-Detail", cat: "Patterns", desc: "Master list alongside glass detail pane for navigation." },
  { id: "pat-app-shell", name: "App Shell", cat: "Patterns", desc: "Header, glass sidebar navigation, content area, and footer." },
  { id: "pat-login", name: "Login / Auth", cat: "Patterns", desc: "Authentication form with brand header, glass inputs, and accent button." },
  { id: "pat-settings", name: "Settings Page", cat: "Patterns", desc: "Navigation sidebar with form sections for configuration." },
  { id: "pat-search", name: "Search Results", cat: "Patterns", desc: "Search input with filterable glass result cards." },
  { id: "pat-wizard", name: "Wizard / Stepper", cat: "Patterns", desc: "Multi-step form with progress indicator and validation." },
  { id: "pat-data-table", name: "Data Table Page", cat: "Patterns", desc: "Filter bar, sortable glass data grid, and pagination." },
];

export const CATS = ["Foundations", "Components & Patterns", "Patterns"];
