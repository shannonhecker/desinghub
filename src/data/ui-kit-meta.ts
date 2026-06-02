/**
 * ui-kit-meta.ts — PURE DATA backbone for the premium UI Kit component-detail
 * page (the "feel like material.io / spec.fluentui.com" surface).
 *
 * This file contains NO JSX, NO React, NO app-code imports, and NO behaviour.
 * It is a content registry the detail page reads to render four sections per
 * component:
 *   1. a variants × states matrix  (COMPONENT_VARIANTS)
 *   2. per-design-system props tables  (DS_PROPS — generalizes the uoaui-only
 *      UOAUI_PROPS in ComponentPreview.tsx to all five DSs)
 *   3. do / don't usage guidance  (COMPONENT_GUIDANCE)
 *   4. per-design-system relevant design-token swatches  (COMPONENT_TOKENS)
 *
 * Accuracy is sourced from:
 *   - src/lib/componentApiRegistry.ts  (real per-DS prop names + variant maps)
 *   - src/data/<ds>/*-documentation.jsx  (real token names + variant vocab)
 *   - CLAUDE.md (repo root)             (per-DS token namespaces + conventions)
 *
 * Per-DS prop conventions captured here (do not "normalise" them — divergence
 * is the point of a multi-DS kit):
 *   - Salt:   sentiment (accented|neutral|positive|caution|negative) + appearance
 *             (solid|bordered|transparent). Inputs use FormField + FormFieldLabel.
 *   - M3:     variant (filled|outlined|text|elevated|tonal) + color. MUI surface.
 *   - Fluent: appearance (primary|secondary|outline|subtle) + size (small|medium|large).
 *   - Carbon: kind (primary|secondary|tertiary|ghost|danger). Inputs use labelText
 *             + a required id. Flat (radius 0).
 *   - uoaui:  className composition over .a-* classes (a-btn / a-btn-primary …);
 *             no npm package, tokens are --a-*.
 *
 * The eight core components below are keyed by a stable, human-readable
 * `componentId`. The registry block id (`Simulated*`) each maps to is noted in
 * a comment so the detail page can cross-reference the live preview/exporter.
 */

/* ════════════════════════════════════════════════════════════════════
   Shared types
   ════════════════════════════════════════════════════════════════════ */

/** The five design systems Design Hub supports. Mirrors
    `SystemId` in src/lib/componentApiRegistry.ts. */
export type DesignSystemId = "salt" | "m3" | "fluent" | "carbon" | "uoaui";

/** Stable component keys used across this file. Distinct from the registry's
    `Simulated*` block ids (those are noted inline per component). */
export type UiKitComponentId =
  | "button"
  | "textInput"
  | "checkbox"
  | "switch"
  | "card"
  | "badge"
  | "select"
  | "avatar";

/** One cell in the variants × states matrix the detail page renders. */
export interface ComponentVariantCell {
  /** The visual variant axis (e.g. "primary", "outlined", "success"). */
  variant: string;
  /** The interaction / lifecycle state axis (e.g. "default", "hover", "disabled"). */
  state: string;
}

/** The full variant matrix definition for one component: the variant axis,
    the state axis, and the flattened grid of cells to render. */
export interface ComponentVariantMatrix {
  /** Human label for the variant axis ("Variant", "Appearance", "Status"). */
  variantAxisLabel: string;
  /** Human label for the state axis (almost always "State"). */
  stateAxisLabel: string;
  /** Ordered variant values down one axis. */
  variants: string[];
  /** Ordered state values across the other axis. */
  states: string[];
  /** The variant×state product, pre-flattened for convenient rendering. */
  cells: ComponentVariantCell[];
}

/** One row in a per-DS props table. Generalizes the inline UOAUI_PROPS shape
    `{ name; type; default; desc }` in ComponentPreview.tsx — note `description`
    is spelled out here (the old shape used `desc`). */
export interface PropRow {
  name: string;
  /** TypeScript-ish type signature shown verbatim, e.g. `"solid" | "bordered"`. */
  type: string;
  /** Default value shown verbatim; "-" when there is none. */
  default: string;
  description: string;
}

/** Concrete do / don't usage guidance for a component. */
export interface ComponentGuidance {
  dos: string[];
  donts: string[];
}

/** A single design-token swatch entry: the CSS custom-property name plus a
    short human role so the detail page can label the swatch. */
export interface TokenSwatch {
  /** The real CSS variable name, e.g. "--salt-actionable-bold-background". */
  token: string;
  /** What the token drives on this component, e.g. "Fill" / "Label" / "Border". */
  role: string;
}

/** Per-design-system props table map for one component. Each DS that ships a
    real equivalent has an array of rows; this is keyed by DesignSystemId. */
export type DsPropsByComponent = Partial<Record<DesignSystemId, PropRow[]>>;

/** Per-design-system token swatch map for one component. */
export type DsTokensByComponent = Partial<Record<DesignSystemId, TokenSwatch[]>>;

/* Helper used at module scope to flatten a variant matrix's cells. Pure,
   deterministic; not exported (the flattened `cells` are what consumers read). */
function buildCells(variants: string[], states: string[]): ComponentVariantCell[] {
  const cells: ComponentVariantCell[] = [];
  for (const variant of variants) {
    for (const state of states) {
      cells.push({ variant, state });
    }
  }
  return cells;
}

function matrix(
  variantAxisLabel: string,
  variants: string[],
  states: string[],
  stateAxisLabel = "State",
): ComponentVariantMatrix {
  return {
    variantAxisLabel,
    stateAxisLabel,
    variants,
    states,
    cells: buildCells(variants, states),
  };
}

/* ════════════════════════════════════════════════════════════════════
   1. COMPONENT_VARIANTS — variants × states matrix per component
   ════════════════════════════════════════════════════════════════════ */

export const COMPONENT_VARIANTS: Record<UiKitComponentId, ComponentVariantMatrix> = {
  // registry: SimulatedButton
  button: matrix(
    "Variant",
    ["primary", "secondary", "outline", "ghost", "danger"],
    ["default", "hover", "focus", "disabled"],
  ),
  // registry: SimulatedTextInput
  textInput: matrix(
    "Validation",
    ["default", "error", "warning", "success"],
    ["empty", "filled", "focus", "disabled"],
  ),
  // registry: SimulatedCheckbox
  checkbox: matrix(
    "State value",
    ["unchecked", "checked", "indeterminate"],
    ["default", "hover", "focus", "disabled"],
  ),
  // registry: SimulatedSwitch
  switch: matrix(
    "State value",
    ["off", "on"],
    ["default", "hover", "focus", "disabled"],
  ),
  // registry: SimulatedCard
  card: matrix(
    "Variant",
    ["default", "outlined", "elevated", "interactive"],
    ["rest", "hover", "focus"],
  ),
  // registry: SimulatedBadge / SimulatedPill / StatusPill
  badge: matrix(
    "Status",
    ["default", "info", "success", "warning", "error"],
    ["rest", "dismissible"],
  ),
  // registry: SimulatedDropdown
  select: matrix(
    "State value",
    ["placeholder", "selected"],
    ["default", "open", "focus", "disabled"],
  ),
  // registry: SimulatedAvatar
  avatar: matrix(
    "Content",
    ["image", "initials", "icon", "fallback"],
    ["sm", "md", "lg"],
    "Size",
  ),
};

/* ════════════════════════════════════════════════════════════════════
   2. DS_PROPS — real per-DS prop rows for each component
   Prop names verified against componentApiRegistry.ts + each DS's docs.
   ════════════════════════════════════════════════════════════════════ */

export const DS_PROPS: Record<UiKitComponentId, DsPropsByComponent> = {
  /* ── Button ───────────────────────────────────────────────────────── */
  button: {
    salt: [
      { name: "sentiment", type: '"accented" | "neutral" | "positive" | "caution" | "negative"', default: '"neutral"', description: "Semantic intent; drives palette." },
      { name: "appearance", type: '"solid" | "bordered" | "transparent"', default: '"solid"', description: "Fill treatment (NOT filled/outlined/text)." },
      { name: "disabled", type: "boolean", default: "false", description: "Disables interaction and dims fill." },
      { name: "onClick", type: "(e: MouseEvent) => void", default: "-", description: "Click handler." },
    ],
    m3: [
      { name: "variant", type: '"contained" | "outlined" | "text"', default: '"contained"', description: "MUI emphasis level (M3 filled/outlined/text)." },
      { name: "color", type: '"primary" | "secondary" | "error" | "inherit"', default: '"primary"', description: "Theme color role; use error for destructive." },
      { name: "disabled", type: "boolean", default: "false", description: "Disables the button." },
      { name: "startIcon", type: "ReactNode", default: "-", description: "Leading icon node." },
    ],
    fluent: [
      { name: "appearance", type: '"primary" | "secondary" | "outline" | "subtle" | "transparent"', default: '"secondary"', description: "Fluent v9 emphasis. No native danger; tint via style." },
      { name: "size", type: '"small" | "medium" | "large"', default: '"medium"', description: "Component size (Fluent uses size, not density)." },
      { name: "icon", type: "ReactNode", default: "-", description: "Icon slot; icon-only when no children." },
      { name: "disabled", type: "boolean", default: "false", description: "Disables the button." },
    ],
    carbon: [
      { name: "kind", type: '"primary" | "secondary" | "tertiary" | "ghost" | "danger"', default: '"primary"', description: "Carbon button kind (tertiary = bordered/outline)." },
      { name: "size", type: '"sm" | "md" | "lg" | "xl" | "2xl"', default: '"lg"', description: "Height tier." },
      { name: "disabled", type: "boolean", default: "false", description: "Disables the button." },
      { name: "renderIcon", type: "React.ComponentType", default: "-", description: "Carbon icon component reference." },
    ],
    uoaui: [
      { name: "className", type: '"a-btn a-btn-primary" | "a-btn a-btn-secondary" | "a-btn a-btn-outline" | "a-btn a-btn-ghost"', default: '"a-btn a-btn-secondary"', description: "Class composition; no danger class (falls to primary)." },
      { name: "disabled", type: "boolean", default: "false", description: "Disables interaction; applies --a-opacity-disabled." },
      { name: "onClick", type: "() => void", default: "-", description: "Click handler." },
      { name: "children", type: "ReactNode", default: "-", description: "Button label content." },
    ],
  },

  /* ── TextInput ────────────────────────────────────────────────────── */
  textInput: {
    salt: [
      { name: "value / defaultValue", type: "string", default: "-", description: "Controlled / uncontrolled value (on Input)." },
      { name: "placeholder", type: "string", default: "-", description: "Placeholder text." },
      { name: "bordered", type: "boolean", default: "false", description: "Adds a full border around the field." },
      { name: "validationStatus", type: '"error" | "warning" | "success"', default: "-", description: "Set on the wrapping FormField, not Input." },
      { name: "disabled", type: "boolean", default: "false", description: "Disables the input." },
    ],
    m3: [
      { name: "variant", type: '"outlined" | "filled" | "standard"', default: '"outlined"', description: "TextField surface treatment." },
      { name: "label", type: "string", default: "-", description: "Floating label." },
      { name: "placeholder", type: "string", default: "-", description: "Placeholder text." },
      { name: "error", type: "boolean", default: "false", description: "Renders the error color state." },
      { name: "helperText", type: "ReactNode", default: "-", description: "Helper / error text below the field." },
    ],
    fluent: [
      { name: "appearance", type: '"outline" | "underline" | "filled-darker" | "filled-lighter"', default: '"outline"', description: "Input surface; wrap in <Field> for the label." },
      { name: "placeholder", type: "string", default: "-", description: "Placeholder text." },
      { name: "size", type: '"small" | "medium" | "large"', default: '"medium"', description: "Component size." },
      { name: "disabled", type: "boolean", default: "false", description: "Disables the input." },
    ],
    carbon: [
      { name: "id", type: "string", default: "-", description: "Required unique id (Carbon ties label to it)." },
      { name: "labelText", type: "ReactNode", default: "-", description: "Visible field label (NOT `label`)." },
      { name: "placeholder", type: "string", default: "-", description: "Placeholder text." },
      { name: "invalid", type: "boolean", default: "false", description: "Marks the field invalid." },
      { name: "invalidText", type: "ReactNode", default: "-", description: "Error message shown when invalid." },
    ],
    uoaui: [
      { name: "label", type: "string", default: "-", description: "Field label rendered above (.a-input-label)." },
      { name: "placeholder", type: "string", default: "-", description: "Placeholder text." },
      { name: "type", type: '"text" | "email" | "password" | "number"', default: '"text"', description: "Native input type." },
      { name: "disabled", type: "boolean", default: "false", description: "Disables input." },
      { name: "value", type: "string", default: "-", description: "Controlled value." },
    ],
  },

  /* ── Checkbox ─────────────────────────────────────────────────────── */
  checkbox: {
    salt: [
      { name: "label", type: "string", default: "-", description: "Inline checkbox label." },
      { name: "checked / defaultChecked", type: "boolean", default: "false", description: "Controlled / uncontrolled checked state." },
      { name: "indeterminate", type: "boolean", default: "false", description: "Renders the mixed (dash) state." },
      { name: "disabled", type: "boolean", default: "false", description: "Disables the checkbox." },
    ],
    m3: [
      { name: "checked / defaultChecked", type: "boolean", default: "false", description: "Pass on the <Checkbox>; wrap in <FormControlLabel> for the label." },
      { name: "indeterminate", type: "boolean", default: "false", description: "Renders the mixed state." },
      { name: "color", type: '"primary" | "secondary" | "error"', default: '"primary"', description: "Theme color role of the tick." },
      { name: "disabled", type: "boolean", default: "false", description: "Disables the checkbox." },
    ],
    fluent: [
      { name: "label", type: "ReactNode", default: "-", description: "Inline checkbox label." },
      { name: "checked / defaultChecked", type: 'boolean | "mixed"', default: "false", description: '"mixed" renders the indeterminate state.' },
      { name: "shape", type: '"square" | "circular"', default: '"square"', description: "Checkbox shape." },
      { name: "disabled", type: "boolean", default: "false", description: "Disables the checkbox." },
    ],
    carbon: [
      { name: "id", type: "string", default: "-", description: "Required unique id." },
      { name: "labelText", type: "ReactNode", default: "-", description: "Visible label (NOT `label`)." },
      { name: "defaultChecked", type: "boolean", default: "false", description: "Initial checked state." },
      { name: "indeterminate", type: "boolean", default: "false", description: "Renders the mixed state." },
      { name: "disabled", type: "boolean", default: "false", description: "Disables the checkbox." },
    ],
    uoaui: [
      { name: "checked", type: "boolean", default: "false", description: "Checked state; toggles the .checked class." },
      { name: "label", type: "string", default: "-", description: "Checkbox label." },
      { name: "onChange", type: "(checked: boolean) => void", default: "-", description: "Check handler." },
    ],
  },

  /* ── Switch ───────────────────────────────────────────────────────── */
  switch: {
    salt: [
      { name: "label", type: "string", default: "-", description: "Accessible switch label." },
      { name: "checked / defaultChecked", type: "boolean", default: "false", description: "Controlled / uncontrolled on state." },
      { name: "disabled", type: "boolean", default: "false", description: "Disables the switch." },
    ],
    m3: [
      { name: "checked / defaultChecked", type: "boolean", default: "false", description: "Pass on <Switch>; wrap in <FormControlLabel> for the label." },
      { name: "color", type: '"primary" | "secondary" | "error"', default: '"primary"', description: "Theme color of the on track." },
      { name: "disabled", type: "boolean", default: "false", description: "Disables the switch." },
    ],
    fluent: [
      { name: "label", type: "ReactNode", default: "-", description: "Switch label." },
      { name: "checked / defaultChecked", type: "boolean", default: "false", description: "On state." },
      { name: "labelPosition", type: '"before" | "after" | "above"', default: '"after"', description: "Label placement." },
      { name: "disabled", type: "boolean", default: "false", description: "Disables the switch." },
    ],
    carbon: [
      // Carbon's switch primitive IS the Toggle component (verified in registry).
      { name: "id", type: "string", default: "-", description: "Required unique id (component is <Toggle>)." },
      { name: "labelText", type: "ReactNode", default: "-", description: "Visible label." },
      { name: "defaultToggled", type: "boolean", default: "false", description: "Initial on state (NOT defaultChecked)." },
      { name: "size", type: '"sm" | "md"', default: '"md"', description: "Toggle size." },
      { name: "disabled", type: "boolean", default: "false", description: "Disables the toggle." },
    ],
    // uoaui ships no switch/toggle class (omitted from the registry).
  },

  /* ── Card ─────────────────────────────────────────────────────────── */
  card: {
    salt: [
      { name: "variant", type: '"primary" | "secondary" | "tertiary"', default: '"primary"', description: "Surface emphasis level." },
      { name: "accent", type: '"top" | "right" | "bottom" | "left"', default: "-", description: "Optional accent border edge (InteractableCard / accent)." },
      { name: "children", type: "ReactNode", default: "-", description: "Card content." },
    ],
    m3: [
      { name: "variant", type: '"elevation" | "outlined"', default: '"elevation"', description: "MUI surface; M3 filled/elevated/outlined." },
      { name: "raised", type: "boolean", default: "false", description: "Increases elevation shadow." },
      { name: "children", type: "ReactNode", default: "-", description: "Use <CardContent> / <CardActions> children." },
    ],
    fluent: [
      { name: "appearance", type: '"filled" | "filled-alternative" | "outline" | "subtle"', default: '"filled"', description: "Card surface treatment." },
      { name: "orientation", type: '"vertical" | "horizontal"', default: '"vertical"', description: "Content flow direction." },
      { name: "size", type: '"small" | "medium" | "large"', default: '"medium"', description: "Padding scale." },
    ],
    carbon: [
      // Carbon's card primitive IS the Tile component (verified in registry).
      { name: "(component)", type: "Tile | ClickableTile | ExpandableTile", default: "Tile", description: "Carbon has no Card; use a Tile flavour." },
      { name: "children", type: "ReactNode", default: "-", description: "Tile content (flat, radius 0)." },
      { name: "light", type: "boolean", default: "false", description: "Renders the lighter layer fill." },
    ],
    uoaui: [
      { name: "className", type: '"a-card"', default: '"a-card"', description: "Glass surface (backdrop-blur + white-opacity)." },
      { name: "onClick", type: "() => void", default: "-", description: "Makes the card interactive." },
      { name: "padding", type: "number | string", default: "16", description: "Inner padding." },
      { name: "children", type: "ReactNode", default: "-", description: "Card content." },
    ],
  },

  /* ── Badge ────────────────────────────────────────────────────────── */
  badge: {
    salt: [
      // Salt Badge is a count overlay; a labelled status badge maps to Pill/StatusIndicator.
      { name: "value", type: "number | string", default: "-", description: "Count overlay value (Badge is a numeric overlay)." },
      { name: "max", type: "number", default: "-", description: "Caps the displayed value (e.g. 99+)." },
      { name: "status (StatusIndicator)", type: '"info" | "success" | "warning" | "error"', default: '"info"', description: "For labelled status, use StatusIndicator + Text." },
    ],
    m3: [
      // Labelled status badge maps to MUI Chip (verified in registry).
      { name: "label", type: "ReactNode", default: "-", description: "Chip text (status badge = Chip)." },
      { name: "color", type: '"default" | "primary" | "info" | "success" | "warning" | "error"', default: '"default"', description: "Chip semantic color." },
      { name: "variant", type: '"filled" | "outlined"', default: '"filled"', description: "Fill vs. bordered." },
      { name: "size", type: '"small" | "medium"', default: '"medium"', description: "Chip size." },
    ],
    fluent: [
      { name: "appearance", type: '"filled" | "ghost" | "outline" | "tint"', default: '"filled"', description: "Badge fill treatment." },
      { name: "color", type: '"brand" | "danger" | "important" | "informative" | "severe" | "subtle" | "success" | "warning"', default: '"brand"', description: "Semantic color (error -> danger, info -> informative)." },
      { name: "size", type: '"tiny" | "extra-small" | "small" | "medium" | "large" | "extra-large"', default: '"medium"', description: "Badge size." },
      { name: "shape", type: '"circular" | "rounded" | "square"', default: '"circular"', description: "Badge shape." },
    ],
    carbon: [
      // Carbon's status badge primitive IS the Tag component (verified in registry).
      { name: "type", type: '"gray" | "blue" | "green" | "warm-gray" | "red" | "magenta" | "purple" | "cyan" | "teal"', default: '"gray"', description: "Tag color (success -> green, error -> red, info -> blue)." },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Tag size." },
      { name: "filter", type: "boolean", default: "false", description: "Renders a dismissible (filter) tag." },
    ],
    uoaui: [
      { name: "className", type: '"a-badge a-badge-default" | "a-badge a-badge-accent" | "a-badge a-badge-success" | "a-badge a-badge-warning" | "a-badge a-badge-danger"', default: '"a-badge a-badge-default"', description: "Class composition; no info variant (accent is closest)." },
      { name: "children", type: "ReactNode", default: "-", description: "Badge label." },
    ],
  },

  /* ── Select / Dropdown ────────────────────────────────────────────── */
  select: {
    salt: [
      { name: "placeholder", type: "string", default: "-", description: "Trigger placeholder text." },
      { name: "selected / defaultSelected", type: "string[]", default: "-", description: "Selected option value(s); Salt Dropdown is multi-capable." },
      { name: "multiselect", type: "boolean", default: "false", description: "Allows multiple selection." },
      { name: "disabled", type: "boolean", default: "false", description: "Disables the dropdown." },
    ],
    m3: [
      // M3 select = MUI FormControl + InputLabel + Select + MenuItem (verified).
      { name: "label", type: "ReactNode", default: "-", description: "Floating label (paired with <InputLabel>)." },
      { name: "value / defaultValue", type: "string", default: "-", description: "Selected value." },
      { name: "variant", type: '"outlined" | "filled" | "standard"', default: '"outlined"', description: "Surface treatment." },
      { name: "multiple", type: "boolean", default: "false", description: "Allows multiple selection." },
    ],
    fluent: [
      // Fluent Dropdown / Combobox.
      { name: "placeholder", type: "string", default: "-", description: "Trigger placeholder text." },
      { name: "value / selectedOptions", type: "string | string[]", default: "-", description: "Selected option value(s)." },
      { name: "appearance", type: '"outline" | "underline" | "filled-darker" | "filled-lighter"', default: '"outline"', description: "Trigger surface treatment." },
      { name: "size", type: '"small" | "medium" | "large"', default: '"medium"', description: "Component size." },
    ],
    carbon: [
      { name: "id", type: "string", default: "-", description: "Required unique id." },
      { name: "titleText", type: "ReactNode", default: "-", description: "Field label above the dropdown." },
      { name: "label", type: "ReactNode", default: "-", description: "Trigger placeholder text." },
      { name: "items", type: "Array<T>", default: "[]", description: "Option list; pair with itemToString." },
      { name: "itemToString", type: "(item: T) => string", default: "-", description: "Maps each item to its display string." },
    ],
    uoaui: [
      { name: "className", type: '"a-dropdown"', default: '"a-dropdown"', description: "Wrapper; trigger uses .a-dropdown-trigger, menu .a-dropdown-menu." },
      { name: "placeholder", type: "string", default: "-", description: "Trigger placeholder text." },
      { name: "aria-expanded", type: "boolean", default: "false", description: "Open state for the listbox popup." },
    ],
  },

  /* ── Avatar ───────────────────────────────────────────────────────── */
  avatar: {
    salt: [
      { name: "name", type: "string", default: "-", description: "Drives initials when no src." },
      { name: "src", type: "string", default: "-", description: "Image URL." },
      { name: "size", type: "number", default: "2", description: "Size multiplier (1 base, 2 large, 4 XL)." },
    ],
    m3: [
      { name: "src", type: "string", default: "-", description: "Image URL; children render initials when absent." },
      { name: "alt", type: "string", default: "-", description: "Accessible image description." },
      { name: "variant", type: '"circular" | "rounded" | "square"', default: '"circular"', description: "Avatar shape." },
      { name: "sx", type: "SxProps", default: "-", description: "Width/height set via sx (M3 has no size prop)." },
    ],
    fluent: [
      { name: "name", type: "string", default: "-", description: "Drives initials + a11y label." },
      { name: "image", type: "{ src: string }", default: "-", description: "Image slot." },
      { name: "size", type: '16 | 20 | 24 | 28 | 32 | 36 | 40 | 48 | 56 | 64 | 72 | 96 | 120 | 128', default: "32", description: "Discrete pixel size (Fluent enum)." },
      { name: "shape", type: '"circular" | "square"', default: '"circular"', description: "Avatar shape." },
    ],
    // Carbon ships no Avatar component (omitted from the registry).
    uoaui: [
      { name: "className", type: '"a-avatar"', default: '"a-avatar"', description: "Glass avatar surface; initials as children." },
      { name: "children", type: "ReactNode", default: "-", description: "Initials (e.g. first two letters)." },
    ],
  },
};

/* ════════════════════════════════════════════════════════════════════
   3. COMPONENT_GUIDANCE — concrete do / don't usage rules per component
   ════════════════════════════════════════════════════════════════════ */

export const COMPONENT_GUIDANCE: Record<UiKitComponentId, ComponentGuidance> = {
  button: {
    dos: [
      "Use one primary/accented button per view to anchor the main action.",
      "Lead labels with a verb ('Save changes', 'Add member'), not 'OK' or 'Submit'.",
      "Map destructive actions to the negative/danger sentiment so users register the risk.",
      "Keep secondary actions as bordered/outline or ghost/subtle to preserve the hierarchy.",
    ],
    donts: [
      "Don't stack two primary buttons side by side; the eye loses the main action.",
      "Don't disable a button without telling the user why it's unavailable.",
      "Don't put the danger button on the right of the confirm dialog unless it's the safe default.",
      "Don't substitute color alone to signal danger; pair it with a clear label.",
    ],
  },
  textInput: {
    dos: [
      "Always pair an input with a persistent, visible label (Salt FormFieldLabel, Carbon labelText, Fluent Field).",
      "Show validation inline at the field, and describe how to fix the error.",
      "Use placeholder for an example value, never as the label.",
      "Set the correct type (email/number/password) so mobile keyboards adapt.",
    ],
    donts: [
      "Don't rely on placeholder text as the only label; it vanishes on focus.",
      "Don't turn the whole field red with no error message.",
      "Don't auto-submit or block typing on a single invalid keystroke.",
      "Don't omit the required `id` on Carbon inputs; the label won't associate.",
    ],
  },
  checkbox: {
    dos: [
      "Use a checkbox for independent on/off choices that can stand alone.",
      "Use the indeterminate state for a parent controlling a partially-selected group.",
      "Write labels as positive statements ('Email me updates'), not negations.",
      "Keep the clickable target on the label, not just the box.",
    ],
    donts: [
      "Don't use a checkbox for mutually-exclusive options; use radio buttons.",
      "Don't use a checkbox to trigger an instant action; that's a switch's job.",
      "Don't leave a group of checkboxes without a group label/legend.",
      "Don't make 'unchecked' silently mean 'consent given'.",
    ],
  },
  switch: {
    dos: [
      "Use a switch for an immediate, self-applying on/off setting (no Save needed).",
      "Label the thing being toggled, not the state ('Notifications', not 'On').",
      "Reflect the new state instantly and optimistically; reconcile on failure.",
      "Keep the on state visually distinct beyond color (position + fill).",
    ],
    donts: [
      "Don't use a switch inside a form that requires a Submit; use a checkbox.",
      "Don't pair a switch with Apply/Cancel; it implies the change isn't live.",
      "Don't use uoaui for switches; it ships no toggle class (use another DS).",
      "Don't rely on color alone to show on/off for color-blind users.",
    ],
  },
  card: {
    dos: [
      "Use a card to group one coherent unit of related content and actions.",
      "Make the whole card the click target only when it has a single primary action.",
      "Match the card's surface to its DS (Salt variant, M3 elevated/outlined, Carbon Tile, uoaui glass).",
      "Keep consistent internal padding using the DS spacing tokens.",
    ],
    donts: [
      "Don't nest interactive cards inside an interactive card; clicks become ambiguous.",
      "Don't add a drop shadow to an M3 card in light theme; use tonal surface elevation.",
      "Don't put more than one primary action in a single card.",
      "Don't round Carbon Tile corners; Carbon is flat (radius 0).",
    ],
  },
  badge: {
    dos: [
      "Use a badge for short, scannable status ('Active', 'Pending', '3 new').",
      "Pick the semantic color that matches meaning (success/warning/error).",
      "Use the count-overlay flavour (Salt Badge, MUI Badge) only for numeric notifications.",
      "Keep badge text to one or two words.",
    ],
    donts: [
      "Don't use a badge as a button; it isn't an actionable control.",
      "Don't communicate status with color alone; include the text label.",
      "Don't put a long sentence in a badge; use an Alert/Banner instead.",
      "Don't expect a uoaui 'info' badge; map info to the accent variant.",
    ],
  },
  select: {
    dos: [
      "Use a select when there are 5+ options and space is tight.",
      "Give the trigger a clear placeholder that states the choice ('Select a country').",
      "Pair the select with a persistent visible label.",
      "Use ComboBox/Autocomplete instead when the list is long and searchable.",
    ],
    donts: [
      "Don't use a select for 2-3 options; radio buttons or a segmented control read faster.",
      "Don't use a select for a binary on/off; use a switch or checkbox.",
      "Don't hide the selected value behind a generic 'Selected' label.",
      "Don't omit the required `id`/`itemToString` on the Carbon Dropdown.",
    ],
  },
  avatar: {
    dos: [
      "Provide initials or a fallback icon for when the image fails to load.",
      "Give the avatar an accessible name (Salt name, Fluent name, M3 alt).",
      "Use a consistent size step within one context (list, header, comment).",
      "Use an avatar group with a +N overflow when space is limited.",
    ],
    donts: [
      "Don't ship an avatar with no fallback; broken images leave an empty hole.",
      "Don't rely on Carbon for avatars; it ships none (use another DS or a custom element).",
      "Don't crop a non-square image into a circle without object-fit: cover.",
      "Don't use avatar size to imply rank; size should follow layout, not status.",
    ],
  },
};

/* ════════════════════════════════════════════════════════════════════
   4. COMPONENT_TOKENS — real per-DS token swatches per component
   Token names verified against src/data/<ds>/*-documentation.jsx + CLAUDE.md.
   Carbon ships the richest real component-token set (--cds-button-, --cds-field-);
   Salt/M3 expose characteristic/system tokens; Fluent uses --color and
   --borderRadius families; uoaui uses --a- tokens.
   ════════════════════════════════════════════════════════════════════ */

export const COMPONENT_TOKENS: Record<UiKitComponentId, DsTokensByComponent> = {
  /* ── Button ───────────────────────────────────────────────────────── */
  button: {
    salt: [
      { token: "--salt-actionable-bold-background", role: "Solid fill" },
      { token: "--salt-actionable-bold-foreground", role: "Solid label" },
      { token: "--salt-actionable-cta-background", role: "Accented/primary fill" },
      { token: "--salt-curve-100", role: "Corner radius" },
      { token: "--salt-spacing-100", role: "Horizontal padding" },
    ],
    m3: [
      { token: "--md-sys-color-primary", role: "Filled fill" },
      { token: "--md-sys-color-on-primary", role: "Filled label" },
      { token: "--md-sys-color-outline", role: "Outlined border" },
      { token: "--md-sys-shape-corner-full", role: "Pill corner radius" },
    ],
    fluent: [
      { token: "--colorBrandBackground", role: "Primary fill" },
      { token: "--colorBrandBackgroundHover", role: "Primary hover fill" },
      { token: "--colorNeutralForegroundOnBrand", role: "Primary label" },
      { token: "--colorNeutralStroke1", role: "Outline border" },
      { token: "--borderRadiusMedium", role: "Corner radius" },
    ],
    carbon: [
      { token: "--cds-button-primary", role: "Primary fill" },
      { token: "--cds-button-primary-hover", role: "Primary hover fill" },
      { token: "--cds-button-secondary", role: "Secondary fill" },
      { token: "--cds-button-danger-primary", role: "Danger fill" },
      { token: "--cds-focus", role: "Focus outline" },
    ],
    uoaui: [
      { token: "--a-accent", role: "Primary fill" },
      { token: "--a-surface", role: "Secondary glass fill" },
      { token: "--a-border", role: "Outline border" },
      { token: "--a-radius-md", role: "Corner radius" },
      { token: "--a-opacity-disabled", role: "Disabled opacity" },
    ],
  },

  /* ── TextInput ────────────────────────────────────────────────────── */
  textInput: {
    salt: [
      { token: "--salt-editable-background", role: "Field fill" },
      { token: "--salt-editable-borderColor", role: "Border" },
      { token: "--salt-status-error-borderColor", role: "Error border" },
      { token: "--salt-border-focus", role: "Focus ring" },
      { token: "--salt-text-primary-foreground", role: "Typed text" },
    ],
    m3: [
      { token: "--md-sys-color-surface-container-highest", role: "Filled field fill" },
      { token: "--md-sys-color-outline", role: "Outlined border" },
      { token: "--md-sys-color-error", role: "Error border / label" },
      { token: "--md-sys-color-on-surface", role: "Typed text" },
    ],
    fluent: [
      { token: "--colorNeutralBackground1", role: "Field fill" },
      { token: "--colorNeutralStroke1", role: "Border" },
      { token: "--colorCompoundBrandStroke", role: "Focus underline" },
      { token: "--colorPaletteRedForeground1", role: "Error text" },
    ],
    carbon: [
      { token: "--cds-field-01", role: "Field fill" },
      { token: "--cds-field-hover-01", role: "Field hover fill" },
      { token: "--cds-text-placeholder", role: "Placeholder text" },
      { token: "--cds-text-error", role: "Error text" },
      { token: "--cds-focus", role: "Focus border" },
    ],
    uoaui: [
      { token: "--a-surface", role: "Field glass fill" },
      { token: "--a-border", role: "Border" },
      { token: "--a-border-focus", role: "Focus ring" },
      { token: "--a-fg", role: "Typed text" },
    ],
  },

  /* ── Checkbox ─────────────────────────────────────────────────────── */
  checkbox: {
    salt: [
      { token: "--salt-selectable-background", role: "Box fill" },
      { token: "--salt-selectable-foreground-selected", role: "Checked tick" },
      { token: "--salt-actionable-cta-background", role: "Checked box fill" },
      { token: "--salt-border-focus", role: "Focus ring" },
    ],
    m3: [
      { token: "--md-sys-color-primary", role: "Checked box fill" },
      { token: "--md-sys-color-on-primary", role: "Tick" },
      { token: "--md-sys-color-on-surface-variant", role: "Unchecked border" },
    ],
    fluent: [
      { token: "--colorCompoundBrandBackground", role: "Checked box fill" },
      { token: "--colorNeutralForegroundInverted", role: "Tick" },
      { token: "--colorNeutralStrokeAccessible", role: "Unchecked border" },
    ],
    carbon: [
      { token: "--cds-icon-primary", role: "Checked box fill + tick" },
      { token: "--cds-icon-disabled", role: "Disabled box" },
      { token: "--cds-focus", role: "Focus outline" },
    ],
    uoaui: [
      { token: "--a-accent", role: "Checked box fill" },
      { token: "--a-border", role: "Unchecked border" },
      { token: "--a-radius-xs", role: "Box corner radius" },
    ],
  },

  /* ── Switch ───────────────────────────────────────────────────────── */
  switch: {
    salt: [
      { token: "--salt-actionable-cta-background", role: "On track fill" },
      { token: "--salt-selectable-background", role: "Off track fill" },
      { token: "--salt-track-region-fill", role: "Thumb fill" },
    ],
    m3: [
      { token: "--md-sys-color-primary", role: "On track fill" },
      { token: "--md-sys-color-surface-container-highest", role: "Off track fill" },
      { token: "--md-sys-color-outline", role: "Off track border" },
    ],
    fluent: [
      { token: "--colorCompoundBrandBackground", role: "On track fill" },
      { token: "--colorNeutralBackground1", role: "Thumb fill" },
      { token: "--colorNeutralStrokeAccessible", role: "Off track border" },
    ],
    carbon: [
      { token: "--cds-toggle-off", role: "Off track fill" },
      { token: "--cds-support-success", role: "On track fill" },
      { token: "--cds-icon-on-color", role: "Thumb fill" },
    ],
    // uoaui omitted — no switch/toggle token surface.
  },

  /* ── Card ─────────────────────────────────────────────────────────── */
  card: {
    salt: [
      { token: "--salt-container-primary-background", role: "Surface fill" },
      { token: "--salt-container-primary-borderColor", role: "Border" },
      { token: "--salt-elev-medium", role: "Elevation shadow" },
      { token: "--salt-curve-300", role: "Corner radius" },
    ],
    m3: [
      { token: "--md-sys-color-surface-container", role: "Filled surface" },
      { token: "--md-sys-color-outline-variant", role: "Outlined border" },
      { token: "--md-sys-elevation-level1", role: "Elevation shadow" },
      { token: "--md-sys-shape-corner-medium", role: "Corner radius" },
    ],
    fluent: [
      { token: "--colorNeutralBackground1", role: "Filled surface" },
      { token: "--colorNeutralStroke1", role: "Outline border" },
      { token: "--borderRadiusMedium", role: "Corner radius" },
    ],
    carbon: [
      { token: "--cds-layer-01", role: "Tile surface" },
      { token: "--cds-layer-hover-01", role: "Clickable hover surface" },
      { token: "--cds-border-subtle-01", role: "Border" },
    ],
    uoaui: [
      { token: "--a-surface", role: "Glass surface fill" },
      { token: "--a-border", role: "Border" },
      { token: "--a-shadow-md", role: "Elevation shadow" },
      { token: "--a-radius-lg", role: "Corner radius" },
    ],
  },

  /* ── Badge ────────────────────────────────────────────────────────── */
  badge: {
    salt: [
      { token: "--salt-status-info-background", role: "Info fill (StatusIndicator)" },
      { token: "--salt-status-success-background", role: "Success fill" },
      { token: "--salt-status-warning-background", role: "Warning fill" },
      { token: "--salt-status-error-background", role: "Error fill" },
    ],
    m3: [
      { token: "--md-sys-color-error", role: "Error chip fill" },
      { token: "--md-sys-color-on-error", role: "Error chip text" },
      { token: "--md-sys-color-secondary-container", role: "Default chip fill" },
    ],
    fluent: [
      { token: "--colorBrandBackground", role: "Brand fill" },
      { token: "--colorPaletteGreenBackground3", role: "Success fill" },
      { token: "--colorPaletteRedBackground3", role: "Danger fill" },
      { token: "--colorPaletteMarigoldBackground3", role: "Warning fill" },
    ],
    carbon: [
      { token: "--cds-support-success", role: "Green tag" },
      { token: "--cds-support-warning", role: "Warm-gray/warning tag" },
      { token: "--cds-support-error", role: "Red tag" },
      { token: "--cds-support-info", role: "Blue tag" },
    ],
    uoaui: [
      { token: "--a-accent", role: "Accent badge fill" },
      { token: "--a-surface", role: "Default badge fill" },
      { token: "--a-radius-full", role: "Pill corner radius" },
    ],
  },

  /* ── Select / Dropdown ────────────────────────────────────────────── */
  select: {
    salt: [
      { token: "--salt-editable-background", role: "Trigger fill" },
      { token: "--salt-editable-borderColor", role: "Trigger border" },
      { token: "--salt-overlayable-background", role: "Menu surface" },
      { token: "--salt-selectable-background-selected", role: "Selected option fill" },
    ],
    m3: [
      { token: "--md-sys-color-surface-container", role: "Menu surface" },
      { token: "--md-sys-color-outline", role: "Trigger border" },
      { token: "--md-sys-color-secondary-container", role: "Selected option fill" },
    ],
    fluent: [
      { token: "--colorNeutralBackground1", role: "Trigger fill" },
      { token: "--colorNeutralStroke1", role: "Trigger border" },
      { token: "--colorNeutralBackgroundSelected", role: "Selected option fill" },
    ],
    carbon: [
      { token: "--cds-field-01", role: "Trigger fill" },
      { token: "--cds-layer-01", role: "Menu surface" },
      { token: "--cds-layer-selected-01", role: "Selected option fill" },
      { token: "--cds-focus", role: "Focus border" },
    ],
    uoaui: [
      { token: "--a-surface", role: "Trigger + menu glass fill" },
      { token: "--a-border", role: "Border" },
      { token: "--a-accent", role: "Selected option accent" },
      { token: "--a-radius-md", role: "Corner radius" },
    ],
  },

  /* ── Avatar ───────────────────────────────────────────────────────── */
  avatar: {
    salt: [
      { token: "--salt-palette-interact-background", role: "Initials surface" },
      { token: "--salt-text-primary-foreground", role: "Initials text" },
      { token: "--salt-curve-pill", role: "Circular shape" },
    ],
    m3: [
      { token: "--md-sys-color-primary-container", role: "Initials surface" },
      { token: "--md-sys-color-on-primary-container", role: "Initials text" },
      { token: "--md-sys-shape-corner-full", role: "Circular shape" },
    ],
    fluent: [
      { token: "--colorBrandBackground2", role: "Initials surface" },
      { token: "--colorBrandForeground2", role: "Initials text" },
      { token: "--borderRadiusCircular", role: "Circular shape" },
    ],
    // Carbon omitted — no Avatar component.
    uoaui: [
      { token: "--a-surface", role: "Glass avatar surface" },
      { token: "--a-fg", role: "Initials text" },
      { token: "--a-radius-full", role: "Circular shape" },
    ],
  },
};
