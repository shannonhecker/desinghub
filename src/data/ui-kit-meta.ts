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
  | "chip"
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
  // dot/count notification overlays (Salt Badge, MUI Badge, Fluent Badge);
  // no Simulated* block — the labelled status pills live under chip now.
  badge: matrix(
    "Type",
    ["dot", "count"],
    ["default", "error"],
    "Status",
  ),
  // registry: SimulatedBadge / SimulatedPill / StatusPill (labelled status chips)
  chip: matrix(
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

  /* ── Badge (dot / count notification overlays) ────────────────────── */
  badge: {
    salt: [
      // Salt Badge is a count overlay; a labelled status badge maps to Pill/StatusIndicator.
      { name: "value", type: "number | string", default: "-", description: "Count overlay value (Badge is a numeric overlay)." },
      { name: "max", type: "number", default: "-", description: "Caps the displayed value (e.g. 99+)." },
      { name: "status (StatusIndicator)", type: '"info" | "success" | "warning" | "error"', default: '"info"', description: "For labelled status, use StatusIndicator + Text." },
    ],
    m3: [
      // M3 badge = MUI Badge, a dot/count overlay anchored to a child (verified in @mui/material Badge.d.ts).
      { name: "badgeContent", type: "ReactNode", default: "-", description: "Counter content; omit for the dot variant." },
      { name: "variant", type: '"standard" | "dot"', default: '"standard"', description: "Counter (M3 large badge) vs. 6dp dot (M3 small badge)." },
      { name: "color", type: '"default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"', default: '"default"', description: "Badge fill; M3 spec uses the error role." },
      { name: "max", type: "number", default: "99", description: "Caps the displayed count (99+)." },
      { name: "invisible", type: "boolean", default: "false", description: "Hides the badge (e.g. when the count is zero)." },
    ],
    fluent: [
      { name: "appearance", type: '"filled" | "ghost" | "outline" | "tint"', default: '"filled"', description: "Badge fill treatment." },
      { name: "color", type: '"brand" | "danger" | "important" | "informative" | "severe" | "subtle" | "success" | "warning"', default: '"brand"', description: "Semantic color (error -> danger, info -> informative)." },
      { name: "size", type: '"tiny" | "extra-small" | "small" | "medium" | "large" | "extra-large"', default: '"medium"', description: "Badge size." },
      { name: "shape", type: '"circular" | "rounded" | "square"', default: '"circular"', description: "Badge shape." },
    ],
    // Carbon omitted: its Tag primitive is chip semantics (see chip); no dot/count badge ships.
    uoaui: [
      { name: "className", type: '"a-badge a-badge-default" | "a-badge a-badge-accent" | "a-badge a-badge-success" | "a-badge a-badge-warning" | "a-badge a-badge-danger"', default: '"a-badge a-badge-default"', description: "Class composition; no info variant (accent is closest)." },
      { name: "children", type: "ReactNode", default: "-", description: "Badge label." },
    ],
  },

  /* ── Chip (labelled M3 chips / Carbon tags) ───────────────────────── */
  chip: {
    salt: [
      // Verified against @salt-ds/core 1.63.0 dist-types: PillProps extends
      // ComponentPropsWithoutRef<"button"> + value; selection state lives on
      // PillGroup, not the Pill. TagProps = bordered / variant / category.
      { name: "onClick (Pill)", type: "(e: MouseEvent) => void", default: "-", description: "Pill renders a real <button>; click toggles or acts." },
      { name: "value (Pill)", type: "string", default: "-", description: "Selection value reported to a wrapping PillGroup." },
      { name: "selected / defaultSelected (PillGroup)", type: "string[]", default: "-", description: 'Selection lives on PillGroup (selectionVariant="multiple"), not the Pill.' },
      { name: "variant (Tag)", type: '"primary" | "secondary"', default: '"primary"', description: "Tag emphasis; secondary uses the bold category fill." },
      { name: "category (Tag)", type: "number", default: "1", description: "Categorical palette index 1-20; drives the --salt-category-N colors." },
      { name: "bordered (Tag)", type: "boolean", default: "false", description: "Adds the full category border to the Tag." },
    ],
    m3: [
      // Labelled status badge maps to MUI Chip (verified in registry).
      { name: "label", type: "ReactNode", default: "-", description: "Chip text (status badge = Chip)." },
      { name: "color", type: '"default" | "primary" | "info" | "success" | "warning" | "error"', default: '"default"', description: "Chip semantic color." },
      { name: "variant", type: '"filled" | "outlined"', default: '"filled"', description: "Fill vs. bordered." },
      { name: "size", type: '"small" | "medium"', default: '"medium"', description: "Chip size." },
    ],
    carbon: [
      // Carbon's status badge primitive IS the Tag component (verified in registry).
      { name: "type", type: '"gray" | "blue" | "green" | "warm-gray" | "red" | "magenta" | "purple" | "cyan" | "teal"', default: '"gray"', description: "Tag color (success -> green, error -> red, info -> blue)." },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Tag size." },
      { name: "filter", type: "boolean", default: "false", description: "Renders a dismissible (filter) tag." },
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
      "Use the count-overlay flavour (Salt Badge, MUI Badge) only for numeric notifications.",
      "Use a dot badge for presence (something new exists) and a count badge for magnitude.",
      "Anchor the badge to the element it annotates (icon, avatar, tab), never floating free.",
      "Cap large counts (99+) so the badge stays compact.",
    ],
    donts: [
      "Don't use a badge as a button; it isn't an actionable control.",
      "Don't show a count of zero; hide the badge instead.",
      "Don't rely on the dot alone for critical state; pair it with an accessible label.",
      "Don't expect a uoaui 'info' badge; map info to the accent variant.",
    ],
  },
  chip: {
    dos: [
      "Use a chip for short, scannable status ('Active', 'Pending', '3 new').",
      "Pick the semantic color that matches meaning (success/warning/error).",
      "Keep chip text to one or two words.",
      "Match the chip type to its job (M3: assist acts, filter toggles, input represents entries, suggestion prompts).",
    ],
    donts: [
      "Don't communicate status with color alone; include the text label.",
      "Don't put a long sentence in a chip; use an Alert/Banner instead.",
      "Don't mix chip types within one set; each type does a different job.",
      "Don't use a chip for the screen's primary action; that's a button's job.",
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

  /* ── Badge (dot / count notification overlays) ────────────────────── */
  badge: {
    salt: [
      { token: "--salt-status-info-background", role: "Info fill (StatusIndicator)" },
      { token: "--salt-status-success-background", role: "Success fill" },
      { token: "--salt-status-warning-background", role: "Warning fill" },
      { token: "--salt-status-error-background", role: "Error fill" },
    ],
    m3: [
      { token: "--md-sys-color-error", role: "Badge fill (dot + count)" },
      { token: "--md-sys-color-on-error", role: "Count label" },
      { token: "--md-sys-shape-corner-full", role: "Rounded shape" },
    ],
    fluent: [
      { token: "--colorBrandBackground", role: "Brand fill" },
      { token: "--colorPaletteGreenBackground3", role: "Success fill" },
      { token: "--colorPaletteRedBackground3", role: "Danger fill" },
      { token: "--colorPaletteMarigoldBackground3", role: "Warning fill" },
    ],
    // Carbon omitted: Tag tokens are chip semantics (see chip).
    uoaui: [
      { token: "--a-accent", role: "Accent badge fill" },
      { token: "--a-surface", role: "Default badge fill" },
      { token: "--a-radius-full", role: "Pill corner radius" },
    ],
  },

  /* ── Chip (labelled M3 chips / Carbon tags) ───────────────────────── */
  chip: {
    salt: [
      { token: "--salt-actionable-bold-background", role: "Pill fill" },
      { token: "--salt-actionable-bold-foreground", role: "Pill label" },
      { token: "--salt-category-1-background", role: "Tag category fill" },
      { token: "--salt-category-1-foreground", role: "Tag label" },
      { token: "--salt-palette-corner-strongest", role: "Tag full corner" },
    ],
    m3: [
      { token: "--md-sys-color-error", role: "Error chip fill" },
      { token: "--md-sys-color-on-error", role: "Error chip text" },
      { token: "--md-sys-color-secondary-container", role: "Default chip fill" },
    ],
    carbon: [
      { token: "--cds-support-success", role: "Green tag" },
      { token: "--cds-support-warning", role: "Warm-gray/warning tag" },
      { token: "--cds-support-error", role: "Red tag" },
      { token: "--cds-support-info", role: "Blue tag" },
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

/* ════════════════════════════════════════════════════════════
   5. COMPONENT_ANATOMY — labelled part callouts + dp measurements
   ════════════════════════════════════════════════════════════
   Drives the Specs ‣ Anatomy section (AnatomyDiagram). The diagram is
   colour-free, so the SAME shape skins per DS from its own theme. `x`/`y`
   are percent anchors for the callout badge within the dotted stage.
   Seeded for the M3 Button pilot; propagation to the other DS is purely
   adding entries here — no component change. */
export interface AnatomyPart {
  /** Callout number, shown in both the badge and the legend. */
  n: number;
  label: string;
  /** Badge anchor as a percent of the stage box. Values outside 0–100
   *  place the callout off the specimen with a leader tick back to its
   *  edge — used by small schematics (e.g. the 32dp chip) whose parts
   *  would otherwise be buried under the badges. */
  x: number;
  y: number;
}
export interface AnatomyMeasure {
  label: string;
  /** Display value, e.g. "40dp" or "Full". */
  value: string;
}
export interface ComponentAnatomy {
  parts: AnatomyPart[];
  measures: AnatomyMeasure[];
}

export const COMPONENT_ANATOMY: Partial<
  Record<UiKitComponentId, Partial<Record<DesignSystemId, ComponentAnatomy>>>
> = {
  button: {
    m3: {
      parts: [
        { n: 1, label: "Container", x: 50, y: 15 },
        { n: 2, label: "Label text", x: 50, y: 85 },
        { n: 3, label: "State layer", x: 15, y: 50 },
      ],
      measures: [
        { label: "Height", value: "40dp" },
        { label: "Padding", value: "24dp" },
        { label: "Corner", value: "Full" },
      ],
    },
    /* Salt Button, medium density. Source: @salt-ds/core Button.css — the
       container height tracks --salt-size-base (36 at MD), horizontal padding
       is --salt-spacing-100 (8 at MD), the corner is --salt-curve-100 (4 at
       MD; Salt's idiom is flat + lightly rounded, NOT the M3 full pill), and
       the label type is --salt-text-fontSize (14 at MD). The third part is the
       focus ring rather than M3's state-layer overlay: Salt has no Material
       ripple, it draws a 2-pixel --salt-focused-outline on :focus-visible.
       Measures shown as their resolved MD values (display strings, like the
       M3 "40dp" convention) with the driving token named in the role column
       of COMPONENT_TOKENS; no raw px literal is introduced here. */
    salt: {
      parts: [
        { n: 1, label: "Container", x: 50, y: 15 },
        { n: 2, label: "Label text", x: 50, y: 85 },
        { n: 3, label: "Focus ring", x: 15, y: 50 },
      ],
      measures: [
        { label: "Height", value: "36dp" },
        { label: "Padding", value: "8dp" },
        { label: "Corner", value: "4dp" },
        { label: "Font", value: "14dp" },
      ],
    },
  },
  badge: {
    m3: {
      parts: [
        /* Off-specimen anchors: the 16dp count badge is far too small to
           carry its callouts — badges sit above/below with leader ticks. */
        { n: 1, label: "Container", x: 50, y: -55 },
        { n: 2, label: "Label text", x: 50, y: 155 },
      ],
      measures: [
        { label: "Height", value: "16dp" },
        { label: "Corner", value: "8dp" },
        { label: "Dot", value: "6dp" },
        { label: "Padding", value: "4dp" },
      ],
    },
    /* Salt Badge. Source: @salt-ds/core Badge.css — height and min-width
       both track --salt-text-notation-lineHeight, the corner is
       --salt-palette-corner-strongest (full fallback), the type is
       --salt-text-notation-fontSize. */
    salt: {
      parts: [
        /* Off-specimen anchors, same convention as badge.m3 above. */
        { n: 1, label: "Container", x: 50, y: -55 },
        { n: 2, label: "Label text", x: 50, y: 155 },
      ],
      measures: [
        { label: "Height", value: "16dp" },
        { label: "Corner", value: "Full" },
        { label: "Min width", value: "16dp" },
        { label: "Font", value: "11dp" },
      ],
    },
    /* Fluent Badge, medium size. Source: @fluentui/react-badge dist
       useBadgeStyles — height 20, min-width 20, padding per side is
       spacingHorizontalXS plus the XXS text padding (4 + 2 = 6), corner
       borderRadiusCircular, type caption1Strong (fontSizeBase200 = 12,
       semibold). */
    fluent: {
      parts: [
        { n: 1, label: "Container", x: 50, y: -55 },
        { n: 2, label: "Label text", x: 50, y: 155 },
      ],
      measures: [
        { label: "Height", value: "20dp" },
        { label: "Corner", value: "Circular" },
        { label: "Padding", value: "6dp" },
        { label: "Font", value: "12dp" },
      ],
    },
    /* uoaui glass badge. Source: uoaui-documentation.jsx buildCSS .a-badge —
       height 22, radius var(--a-radius-full), padding 0 10, font 11. */
    uoaui: {
      parts: [
        { n: 1, label: "Container", x: 50, y: -55 },
        { n: 2, label: "Label text", x: 50, y: 155 },
      ],
      measures: [
        { label: "Height", value: "22dp" },
        { label: "Corner", value: "Full" },
        { label: "Padding", value: "10dp" },
        { label: "Font", value: "11dp" },
      ],
    },
  },
  chip: {
    m3: {
      parts: [
        /* Off-specimen anchors: the 32dp chip is too small to carry its
           callouts — badges sit above/below with leader ticks instead. */
        { n: 1, label: "Container", x: 50, y: -55 },
        { n: 2, label: "Label text", x: 50, y: 155 },
        { n: 3, label: "Leading icon (optional)", x: 16, y: 155 },
        { n: 4, label: "Trailing icon (optional)", x: 84, y: 155 },
      ],
      measures: [
        { label: "Height", value: "32dp" },
        { label: "Corner", value: "8dp" },
        { label: "Icon", value: "18dp" },
        { label: "Padding", value: "16dp" },
      ],
    },
    /* Salt Pill + Tag, medium density. Source: @salt-ds/core Pill.css and
       Tag.css — both share height calc(--salt-size-base minus
       --salt-spacing-100), 28 minus 8 = 20 at medium density; font is
       --salt-text-fontSize (12 at MD); padding is Tag's horizontal
       --salt-spacing-100 (8; the Pill itself runs tighter on
       --salt-spacing-50). Corner shown as the Salt curve family midpoint
       --salt-curve-100 (4 at MD); the Pill resolves
       --salt-palette-corner-weaker while the Tag is full
       (--salt-palette-corner-strongest). */
    salt: {
      parts: [
        /* Off-specimen anchors, same convention as chip.m3 above. */
        { n: 1, label: "Container", x: 50, y: -55 },
        { n: 2, label: "Label text", x: 50, y: 155 },
        { n: 3, label: "Close icon (optional)", x: 84, y: 155 },
      ],
      measures: [
        { label: "Height", value: "20dp" },
        { label: "Corner", value: "4dp" },
        { label: "Padding", value: "8dp" },
        { label: "Font", value: "12dp" },
      ],
    },
  },
};

/* ════════════════════════════════════════════════════════════
   6. COMPONENT_VARIANT_NAMING — the named variants of a component in
   THIS DS's own vocabulary, with one-line guidance. Drives the Overview
   "Variants & naming" block. Data-gated (renders only where present), so
   M3 surfaces its real Filled/Tonal/Elevated/Outlined/Text taxonomy even
   though the cross-DS variants matrix uses a generic axis. Propagation to
   other DS = adding entries here.
   ════════════════════════════════════════════════════════════ */
export interface VariantNaming {
  name: string;
  /** Emphasis level + what the variant is. */
  desc: string;
  /** Best-practice guidance: when to reach for this variant. */
  use: string;
  /** Appearance of the live example rendered in the card. The set spans
   *  components: button (solid/tonal/elevated/outlined/text), card
   *  (elevated/filled/outlined), text field (filled/outlined), chip
   *  (assist/filter/input/suggestion), badge (dot/count). DS-prefixed keys
   *  (salt-*, fluent-*, glass-*) render that DS's own example treatment. */
  style:
    | "solid" | "tonal" | "elevated" | "outlined" | "text" | "filled"
    | "assist" | "filter" | "input" | "suggestion"
    | "dot" | "count"
    | "salt-pill" | "salt-tag"
    | "salt-accent" | "salt-positive" | "salt-caution" | "salt-negative" | "salt-dot"
    | "fluent-filled" | "fluent-tint" | "fluent-outline" | "fluent-ghost"
    | "glass-accent" | "glass-default" | "glass-danger" | "glass-success" | "glass-warning";
}
export const COMPONENT_VARIANT_NAMING: Partial<
  Record<UiKitComponentId, Partial<Record<DesignSystemId, VariantNaming[]>>>
> = {
  button: {
    m3: [
      {
        name: "Filled",
        desc: "Highest emphasis. A solid accent fill.",
        use: "The single most important action on the screen, like Save, Confirm, or Send. Use only one per view so it stays the clear focus.",
        style: "solid",
      },
      {
        name: "Tonal",
        desc: "Medium-high emphasis. A soft tonal fill.",
        use: "A prominent action that should not compete with a filled button, like Add, Next, or Reply. Good middle ground between filled and outlined.",
        style: "tonal",
      },
      {
        name: "Elevated",
        desc: "Medium emphasis. An outline-free button with a shadow.",
        use: "When the button sits over an image, a busy, or a patterned surface and needs separation from the content behind it.",
        style: "elevated",
      },
      {
        name: "Outlined",
        desc: "Medium emphasis. An outline, no fill.",
        use: "Secondary actions placed beside a filled button, like Cancel next to Save, or Back next to Continue.",
        style: "outlined",
      },
      {
        name: "Text",
        desc: "Lowest emphasis. No container.",
        use: "The least prominent action, like Learn more or dismissive actions inside dialogs, cards, and snackbars where a heavy button would be too much.",
        style: "text",
      },
    ],
    salt: [
      { name: "Solid", desc: "Highest emphasis. The actionable bold fill.", use: "The primary action in a view, like Save or Submit. Keep one solid button per area so it stays the clear focus.", style: "solid" },
      { name: "Bordered", desc: "Medium emphasis. An outline with no fill.", use: "Secondary actions placed beside a solid button, like Cancel next to Save.", style: "outlined" },
      { name: "Transparent", desc: "Lowest emphasis. No container.", use: "Tertiary, low-stakes actions inside dense toolbars or cards where a filled button would be too heavy.", style: "text" },
    ],
    fluent: [
      { name: "Primary", desc: "Highest emphasis. The solid brand fill.", use: "The single most important action in a surface. Use one per view so it reads as the main path.", style: "solid" },
      { name: "Secondary", desc: "Medium-high emphasis. A soft neutral fill.", use: "A prominent action that should not outweigh the primary button, like Add or Next.", style: "tonal" },
      { name: "Outline", desc: "Medium emphasis. A stroke, no fill.", use: "Secondary actions beside a primary button where a fill would compete.", style: "outlined" },
      { name: "Subtle", desc: "Low emphasis. Text-only, no container.", use: "Quiet, repeated actions inside lists, toolbars, and menus.", style: "text" },
    ],
    uoaui: [
      { name: "Primary", desc: "Highest emphasis. The accent glass fill.", use: "The main action on a glass surface, like Continue or Generate. One per cluster keeps it the focus.", style: "solid" },
      { name: "Secondary", desc: "Medium emphasis. A tinted glass surface.", use: "A supporting action that sits beside the primary without competing with it.", style: "tonal" },
      { name: "Outline", desc: "Medium emphasis. A hairline border over glass.", use: "Secondary actions on busy or image-backed surfaces that need a clear edge.", style: "outlined" },
      { name: "Ghost", desc: "Lowest emphasis. Bare label, no container.", use: "Quiet actions inside panels and menus where a fill would add noise.", style: "text" },
    ],
  },
  card: {
    m3: [
      {
        name: "Elevated",
        desc: "A surface with a soft shadow.",
        use: "When the card needs to lift off the background, or sits on a plain surface that wouldn't otherwise separate it.",
        style: "elevated",
      },
      {
        name: "Filled",
        desc: "A tonal surface, no shadow.",
        use: "The lowest-emphasis container. Groups related content without drawing attention to the card itself.",
        style: "filled",
      },
      {
        name: "Outlined",
        desc: "An outline, no fill or shadow.",
        use: "A clearly bounded container with the least visual weight. Good for dense layouts or sitting alongside other cards.",
        style: "outlined",
      },
    ],
    salt: [
      { name: "Primary", desc: "A raised surface with a soft shadow.", use: "When the card should lift off the page, or sits on a plain background that would not otherwise separate it.", style: "elevated" },
      { name: "Secondary", desc: "A tonal surface, no shadow.", use: "A quieter container that groups related content without drawing attention to the card itself.", style: "filled" },
      { name: "Tertiary", desc: "A bordered surface, no fill or shadow.", use: "The lightest bounded container. Good for dense layouts and side-by-side cards.", style: "outlined" },
    ],
    fluent: [
      { name: "Filled", desc: "A neutral surface fill.", use: "The default Fluent card. Groups content on a calm surface in most layouts.", style: "filled" },
      { name: "Filled alternative", desc: "A raised surface with elevation.", use: "When the card needs to separate from the content behind it, like a floating panel.", style: "elevated" },
      { name: "Outline", desc: "A bordered surface, no fill.", use: "A clearly bounded, low-weight container for dense lists and grids.", style: "outlined" },
    ],
    uoaui: [
      { name: "Elevated", desc: "A glass surface with a soft lift.", use: "When the card should float above the aurora background and read as a distinct layer.", style: "elevated" },
      { name: "Filled", desc: "A tinted glass surface, flatter.", use: "Grouping related content quietly without a strong lift.", style: "filled" },
      { name: "Outlined", desc: "A hairline-bordered glass surface.", use: "The lightest container, for dense layouts where blur on blur would muddy the surface.", style: "outlined" },
    ],
  },
  textInput: {
    m3: [
      {
        name: "Filled",
        desc: "A tonal fill with an underline.",
        use: "The default M3 text field. Use in most forms; the fill makes the field read clearly as a tap target.",
        style: "filled",
      },
      {
        name: "Outlined",
        desc: "An outline, no fill.",
        use: "When fields sit on a busy or tonal surface where a filled field would blend in, or when you want a lighter, more contained look.",
        style: "outlined",
      },
    ],
    salt: [
      { name: "Primary", desc: "A bordered field with a fill.", use: "The default Salt input. Use in most forms; the fill makes the field read clearly as a target.", style: "filled" },
      { name: "Secondary", desc: "A bordered field, no fill.", use: "When fields sit on a tonal or busy surface where a filled field would blend in, or for a lighter look.", style: "outlined" },
    ],
    fluent: [
      { name: "Filled", desc: "A soft neutral fill with an underline.", use: "The default Fluent input in most forms; the fill reads clearly as an editable target.", style: "filled" },
      { name: "Outline", desc: "A bordered field, no fill.", use: "On busy or tonal surfaces where a filled field blends in, or when a lighter, more contained look fits.", style: "outlined" },
    ],
    uoaui: [
      { name: "Filled", desc: "A glass field with a tinted fill and accent underline.", use: "The default uoaui input; the fill keeps the field legible over the aurora background.", style: "filled" },
      { name: "Outlined", desc: "A hairline-bordered glass field.", use: "When a lighter, more contained field suits the surface and a fill would add noise.", style: "outlined" },
    ],
  },
  badge: {
    /* M3's two badge sizes. Badges are non-interactive notification
       markers anchored to another component (a navigation icon, avatar,
       or tab); the labelled chip taxonomy lives under chip below. */
    m3: [
      {
        name: "Dot",
        desc: "The M3 small badge. A 6dp dot with no label.",
        use: "Signal that something new or unseen exists, like unread activity behind a navigation icon. It marks presence, not magnitude.",
        style: "dot",
      },
      {
        name: "Count",
        desc: "The M3 large badge. A 16dp counter set in label-small type on an error container fill with an on-error label.",
        use: "Show how many items await the user, like unread messages on a tab icon. Cap large values (99+) so the counter stays compact.",
        style: "count",
      },
    ],
    /* Salt's badge statuses. Four full-corner sentiment counters plus the
       labelless presence dot. Carbon is deliberately absent here: its 5-tab
       layout never renders this premium meta. */
    salt: [
      {
        name: "Accent",
        desc: "The default counter. A neutral count on the accent sentiment fill.",
        use: "General totals with no judgement attached, like unread messages or items in a queue. Cap large values (99+) so the counter stays compact.",
        style: "salt-accent",
      },
      {
        name: "Positive",
        desc: "A success counter. The positive sentiment fill.",
        use: "Counting things that are going well, like passing checks or completed tasks. Keep it for genuinely good news so the green stays meaningful.",
        style: "salt-positive",
      },
      {
        name: "Caution",
        desc: "A warning counter. The caution sentiment fill.",
        use: "Counting things that need attention soon, like expiring entitlements or pending reviews. Pair it with a text label nearby, never color alone.",
        style: "salt-caution",
      },
      {
        name: "Negative",
        desc: "An error counter. The negative sentiment fill.",
        use: "Counting failures and blocking problems, like failed jobs or rejected rows. Reserve it for true errors so the signal keeps its weight.",
        style: "salt-negative",
      },
      {
        name: "Dot",
        desc: "A small labelless dot.",
        use: "Signal that something new or unseen exists, like activity behind a navigation icon. It marks presence, not magnitude.",
        style: "salt-dot",
      },
    ],
    /* Fluent's four appearances of the one Badge component. Same semantics,
       descending visual volume: filled, tint, outline, ghost. */
    fluent: [
      {
        name: "Filled",
        desc: "The default appearance. A solid color fill with high contrast.",
        use: "Most counters and status markers; the solid fill stays legible at small sizes. Reach for it unless the badge competes with nearby emphasis.",
        style: "fluent-filled",
      },
      {
        name: "Tint",
        desc: "A subtle appearance. A soft tint fill with a matching stroke.",
        use: "Quieter status beside filled badges, or dense surfaces where solid fills would shout. Same semantics at a lower volume.",
        style: "fluent-tint",
      },
      {
        name: "Outline",
        desc: "A stroke-only appearance. Transparent fill with a colored border.",
        use: "The lightest bounded treatment, like secondary metadata in tables and lists where fills would add noise.",
        style: "fluent-outline",
      },
      {
        name: "Ghost",
        desc: "A bare appearance. Colored text with no fill or border.",
        use: "Inline counts and labels that should read as text, like a count beside a heading. The lowest emphasis of the four.",
        style: "fluent-ghost",
      },
    ],
    /* uoaui's glass pill badges. One .a-badge base, five semantic tints. */
    uoaui: [
      {
        name: "Accent",
        desc: "The brand glass pill. An accent-tinted surface with a soft border.",
        use: "Highlighting the active or featured item, like the current plan or a live status. One per cluster keeps the highlight meaningful.",
        style: "glass-accent",
      },
      {
        name: "Default",
        desc: "The neutral glass pill. A plain surface tint.",
        use: "General labels with no semantic charge, like counts and categories. The default when no status applies.",
        style: "glass-default",
      },
      {
        name: "Danger",
        desc: "An error pill. The danger tint and border.",
        use: "Flagging failures and destructive states, like a failed sync or an expired key.",
        style: "glass-danger",
      },
      {
        name: "Success",
        desc: "A success pill. The success tint and border.",
        use: "Confirming healthy state, like passing checks or an active connection.",
        style: "glass-success",
      },
      {
        name: "Warning",
        desc: "A warning pill. The warning tint and border.",
        use: "Calling out things that need attention soon, like approaching limits or actions awaiting the user.",
        style: "glass-warning",
      },
    ],
  },
  chip: {
    /* M3's four chip types. Unlike buttons these are not an emphasis
       ladder; each type does a different job, and each carries its own
       signature affordance (leading icon, check, trailing remove). */
    m3: [
      {
        name: "Assist",
        desc: "A smart contextual action. Elevated, with a leading icon.",
        use: "Surfacing a contextual smart action that helps the user complete a task in place, like adding an event to the calendar.",
        style: "assist",
      },
      {
        name: "Filter",
        desc: "A toggleable facet. Selecting it swaps the outline for a tonal fill and a checkmark.",
        use: "Letting users refine a collection by toggling facets on and off, like narrowing search results by category.",
        style: "filter",
      },
      {
        name: "Input",
        desc: "A discrete piece of user input, with a trailing remove affordance.",
        use: "Representing things the user entered, like recipients or tags, that they can edit or remove one by one.",
        style: "input",
      },
      {
        name: "Suggestion",
        desc: "A suggested prompt. Plain outline, lowest emphasis.",
        use: "Offering quick follow-ups or query refinements before the user commits to one, like reply suggestions under a message.",
        style: "suggestion",
      },
    ],
    /* Salt's two chip-shaped components. Not an emphasis ladder: Pill is
       the selectable one, Tag the dismissible one, per the Salt docs. */
    salt: [
      {
        name: "Pill",
        desc: "A selectable pill. A real button on the actionable bold fill.",
        use: "Letting users toggle a selection on and off, like filtering by category or picking skills, singly or inside a PillGroup. Reach for Tag when the item is metadata rather than a choice.",
        style: "salt-pill",
      },
      {
        name: "Tag",
        desc: "Dismissible, removable metadata. A label drawn from the 20-step category palette, with an optional close affordance.",
        use: "Showing metadata the user applied and can take away, like labels on a record or tokens in a filter bar. Keep one category number per meaning so related tags share a color.",
        style: "salt-tag",
      },
    ],
  },
};

/* ════════════════════════════════════════════════════════════
   7. COMPONENT_ACCESSIBILITY — per-component, per-DS keyboard +
   screen-reader / ARIA notes.
   ════════════════════════════════════════════════════════════
   Drives the Accessibility tab (ComponentPreview). Data-gated exactly like
   COMPONENT_ANATOMY / COMPONENT_GUIDANCE: where an entry exists for the
   active component + DS it renders the real keyboard map + ARIA/SR notes
   (+ an optional contrast line); otherwise the tab falls back to the
   shared WCAG boilerplate. Strings only — no tokens, so this is audit-safe.

   Notes are sourced from each DS's published accessibility guidance and the
   WAI-ARIA Authoring Practices the components implement (button, checkbox,
   switch patterns; native <input> semantics for the text field). Where the
   behaviour is genuinely identical across DS the same lines are reused; where
   a DS diverges (e.g. Carbon's 2-pixel focus indicator and flat controls, M3's
   state-layer, Fluent's switch role choice) the notes are tailored.

   `keyboard`  — ordered key → effect lines.
   `aria`      — screen-reader / ARIA / focus semantics the component exposes.
   `contrast`  — optional one-line note on the relevant WCAG contrast minima.
   ════════════════════════════════════════════════════════════ */
export interface ComponentAccessibility {
  keyboard: string[];
  aria: string[];
  contrast?: string;
}

export const COMPONENT_ACCESSIBILITY: Partial<
  Record<UiKitComponentId, Partial<Record<DesignSystemId, ComponentAccessibility>>>
> = {
  /* ── Button — WAI-ARIA button pattern; native <button> across all DS. ── */
  button: {
    m3: {
      keyboard: [
        "Tab / Shift+Tab: move focus to and from the button.",
        "Enter: activate the button.",
        "Space: activate the button on key-up.",
      ],
      aria: [
        "Renders a native <button>, so the role, focusability, and Enter/Space activation come from the platform.",
        "Icon-only buttons carry an aria-label naming the action; text buttons take their accessible name from the visible label.",
        "Disabled buttons set the disabled attribute and are removed from the tab order.",
        "A visible state layer plus a focus indicator mark the focused control, never colour alone.",
      ],
      contrast: "Label text meets 4.5:1; the container and focus indicator meet 3:1 against adjacent colours.",
    },
    salt: {
      keyboard: [
        "Tab / Shift+Tab: move focus to and from the button.",
        "Enter: activate the button.",
        "Space: activate the button.",
      ],
      aria: [
        "Renders a native <button>; role, focus order, and Enter/Space activation are native.",
        "Icon-only Salt buttons require an aria-label; labelled buttons name themselves from their text.",
        "Disabled buttons are not focusable and expose the disabled state to assistive tech.",
        "Focus is shown with the 2-pixel Salt focus ring (--salt-focused-outline), not by a colour change alone.",
      ],
      contrast: "Label meets 4.5:1; the focus ring and bordered edge clear the 3:1 non-text minimum.",
    },
    fluent: {
      keyboard: [
        "Tab / Shift+Tab: move focus to and from the button.",
        "Enter: activate the button.",
        "Space: activate the button.",
      ],
      aria: [
        "Renders a native <button> with platform role and keyboard activation.",
        "Icon-only buttons need an aria-label; toggle buttons expose aria-pressed for their on/off state.",
        "Disabled buttons set disabled and leave the tab order; Fluent's focus-indicator stroke marks the focused button.",
      ],
      contrast: "Label meets 4.5:1; the focus stroke and outline variants meet the 3:1 non-text minimum.",
    },
    uoaui: {
      keyboard: [
        "Tab / Shift+Tab: move focus to and from the button.",
        "Enter: activate the button.",
        "Space: activate the button.",
      ],
      aria: [
        "Renders a native <button>; role and Enter/Space activation are native.",
        "Icon-only glass buttons require an aria-label so the action is announced.",
        "Because the surface is translucent glass, a solid focus ring is drawn so focus stays visible over any backdrop, never relying on the blur or tint alone.",
      ],
      contrast: "Verify label and focus-ring contrast against the live backdrop, not the glass tint, since the surface is see-through.",
    },
    carbon: {
      keyboard: [
        "Tab / Shift+Tab: move focus to and from the button.",
        "Enter: activate the button.",
        "Space: activate the button.",
      ],
      aria: [
        "Renders a native <button> with platform role and activation.",
        "Icon-only buttons require an aria-label; Carbon pairs them with a tooltip naming the action.",
        "Disabled buttons set disabled and drop out of the tab order.",
        "Focus is shown with Carbon's 2-pixel focus border (--cds-focus), distinct from the flat resting border, so focus never relies on colour alone.",
      ],
      contrast: "Label meets 4.5:1; the 2-pixel focus border and control edges meet the 3:1 non-text minimum.",
    },
  },

  /* ── Text field — native <input>/<textarea>, labelled programmatically. ── */
  textInput: {
    m3: {
      keyboard: [
        "Tab / Shift+Tab: move focus to and from the field.",
        "Type to enter text; arrow keys and Home/End move the caret.",
        "Native editing shortcuts (select, copy, paste, undo) all apply.",
      ],
      aria: [
        "A real <label> is programmatically tied to the input, so the label, not just the placeholder, names the field.",
        "Helper and error text are linked with aria-describedby and announced with the field.",
        "An invalid field sets aria-invalid='true'; required fields set the required attribute.",
        "Placeholder text is never the only label, since it disappears on input.",
      ],
      contrast: "Input text and label meet 4.5:1; the field outline and focus indicator meet the 3:1 non-text minimum.",
    },
    salt: {
      keyboard: [
        "Tab / Shift+Tab: move focus to and from the input.",
        "Type to enter text; arrow keys and Home/End move the caret.",
        "Native editing shortcuts (select, copy, paste, undo) all apply.",
      ],
      aria: [
        "Wrapped in a Salt FormField, so FormFieldLabel becomes the input's programmatic label.",
        "FormFieldHelperText is linked via aria-describedby and read with the field.",
        "validationStatus='error' sets aria-invalid and surfaces the error text to assistive tech.",
        "Focus is shown with the 2-pixel Salt focus ring, not a colour swap alone.",
      ],
      contrast: "Input text and label meet 4.5:1; the field border and focus ring clear the 3:1 non-text minimum.",
    },
    fluent: {
      keyboard: [
        "Tab / Shift+Tab: move focus to and from the input.",
        "Type to enter text; arrow keys and Home/End move the caret.",
        "Native editing shortcuts (select, copy, paste, undo) all apply.",
      ],
      aria: [
        "Pair the Input with a Field (or a <label>) so it has a programmatic name; the Fluent Field wires label, hint, and validation text for you.",
        "Validation messages are linked with aria-describedby and announced with the field.",
        "An error field sets aria-invalid='true'; the underline/filled variants keep a visible focus and resting border.",
      ],
      contrast: "Input text and label meet 4.5:1; the field border and focus stroke meet the 3:1 non-text minimum.",
    },
    uoaui: {
      keyboard: [
        "Tab / Shift+Tab: move focus to and from the input.",
        "Type to enter text; arrow keys and Home/End move the caret.",
        "Native editing shortcuts (select, copy, paste, undo) all apply.",
      ],
      aria: [
        "A real <label> is tied to the input; placeholder text never stands in for the label.",
        "Helper and error text are linked with aria-describedby; an invalid field sets aria-invalid='true'.",
        "On the translucent glass surface, the field border and focus ring are kept solid enough to read against any backdrop, not the tint alone.",
      ],
      contrast: "Check input text, label, and the field border against the live backdrop behind the glass, not only the surface tint.",
    },
    carbon: {
      keyboard: [
        "Tab / Shift+Tab: move focus to and from the input.",
        "Type to enter text; arrow keys and Home/End move the caret.",
        "Native editing shortcuts (select, copy, paste, undo) all apply.",
      ],
      aria: [
        "labelText renders a real <label> bound to the input; the label is always present, never placeholder-only.",
        "helperText is linked with aria-describedby; invalid sets aria-invalid and ties invalidText to the field with role-appropriate announcement.",
        "Focus is shown with Carbon's 2-pixel focus border (--cds-focus); the flat field keeps a visible resting border too.",
      ],
      contrast: "Input text and label meet 4.5:1; the resting and 2-pixel focus borders meet the 3:1 non-text minimum.",
    },
  },

  /* ── Checkbox — WAI-ARIA checkbox pattern; native <input type=checkbox>. ── */
  checkbox: {
    m3: {
      keyboard: [
        "Tab / Shift+Tab: move focus to and from the checkbox.",
        "Space: toggle between checked and unchecked.",
      ],
      aria: [
        "Renders a native checkbox input, so the role and checked state are exposed without extra ARIA.",
        "The visible <label> is programmatically associated, so clicking the label and the box both toggle it.",
        "An indeterminate checkbox sets the indeterminate property, announced as 'mixed'.",
        "State is shown by the check/indeterminate glyph plus the box fill, never by colour alone.",
      ],
      contrast: "The label meets 4.5:1; the box outline, fill, and focus indicator meet the 3:1 non-text minimum.",
    },
    salt: {
      keyboard: [
        "Tab / Shift+Tab: move focus to and from the checkbox.",
        "Space: toggle between checked and unchecked.",
      ],
      aria: [
        "Salt Checkbox renders a native checkbox input with its label associated, so both label and box toggle it.",
        "The indeterminate prop sets the indeterminate state, announced as 'mixed'.",
        "error/validationStatus is exposed to assistive tech; focus uses the 2-pixel Salt focus ring.",
        "The checked glyph plus the box fill carry the state, not colour alone.",
      ],
      contrast: "Label meets 4.5:1; the box border, fill, and focus ring clear the 3:1 non-text minimum.",
    },
    fluent: {
      keyboard: [
        "Tab / Shift+Tab: move focus to and from the checkbox.",
        "Space: toggle between checked and unchecked.",
      ],
      aria: [
        "Fluent Checkbox wraps a native checkbox input; the label prop becomes its associated label.",
        "A 'mixed' value renders the indeterminate state, announced as mixed to assistive tech.",
        "Focus is shown with Fluent's focus indicator; the checkmark glyph plus fill mark the checked state.",
      ],
      contrast: "Label meets 4.5:1; the box border, fill, and focus indicator meet the 3:1 non-text minimum.",
    },
    uoaui: {
      keyboard: [
        "Tab / Shift+Tab: move focus to and from the checkbox.",
        "Space: toggle between checked and unchecked.",
      ],
      aria: [
        "Renders a native checkbox input with an associated label; both toggle the box.",
        "The checked glyph and box fill mark the state, reinforced over the glass surface so it never rides on tint alone.",
        "Focus draws a solid ring that stays visible against any backdrop behind the glass.",
      ],
      contrast: "Check the box outline, fill, and focus ring against the live backdrop behind the glass, not only the tint.",
    },
    carbon: {
      keyboard: [
        "Tab / Shift+Tab: move focus to and from the checkbox.",
        "Space: toggle between checked and unchecked.",
      ],
      aria: [
        "Carbon Checkbox renders a native checkbox input; labelText is its associated label, so label and box both toggle.",
        "The indeterminate prop sets the mixed state, announced as 'mixed'.",
        "Focus is shown with Carbon's 2-pixel focus border (--cds-focus); the flat checked box keeps a visible border.",
        "The checkmark glyph plus fill carry the state, not colour alone.",
      ],
      contrast: "Label meets 4.5:1; the box border, fill, and 2-pixel focus border meet the 3:1 non-text minimum.",
    },
  },

  /* ── Switch — WAI-ARIA switch pattern. DS differ on role + element. ── */
  switch: {
    m3: {
      keyboard: [
        "Tab / Shift+Tab: move focus to and from the switch.",
        "Space: toggle the switch on and off.",
        "Enter: toggle the switch on and off.",
      ],
      aria: [
        "Exposes role='switch' with aria-checked reflecting the on/off state, so assistive tech announces 'on'/'off', not 'checked'.",
        "Takes its accessible name from an associated <label> or aria-label.",
        "The thumb position plus the selected icon mark the state, never the track colour alone.",
        "Focus is shown with a visible focus indicator on the switch.",
      ],
      contrast: "Any label meets 4.5:1; the track, thumb, and focus indicator meet the 3:1 non-text minimum.",
    },
    salt: {
      keyboard: [
        "Tab / Shift+Tab: move focus to and from the switch.",
        "Space: toggle the switch on and off.",
      ],
      aria: [
        "Salt Switch renders a checkbox input styled as a switch; its label is programmatically associated.",
        "The on/off state is exposed via the native checked state and read with the label.",
        "The thumb position carries the state alongside the track fill, not colour alone; focus uses the 2-pixel Salt focus ring.",
      ],
      contrast: "Label meets 4.5:1; the track, thumb, and focus ring clear the 3:1 non-text minimum.",
    },
    fluent: {
      keyboard: [
        "Tab / Shift+Tab: move focus to and from the switch.",
        "Space: toggle the switch on and off.",
      ],
      aria: [
        "Fluent Switch renders a checkbox input with the toggle role; pair it with a Field or label so it has an accessible name.",
        "The on/off state is exposed through the native checked state and announced with the field.",
        "The thumb position plus track marks the state; Fluent's focus indicator shows focus.",
      ],
      contrast: "Any label meets 4.5:1; the track, thumb, and focus indicator meet the 3:1 non-text minimum.",
    },
    uoaui: {
      keyboard: [
        "Tab / Shift+Tab: move focus to and from the switch.",
        "Space: toggle the switch on and off.",
      ],
      aria: [
        "Exposes role='switch' with aria-checked for the on/off state and takes its name from a label or aria-label.",
        "The thumb position marks the state, reinforced so it reads over the translucent glass track, not the tint alone.",
        "Focus draws a solid ring that stays visible against any backdrop behind the glass.",
      ],
      contrast: "Check the track, thumb, and focus ring against the live backdrop behind the glass, not only the tint.",
    },
    carbon: {
      keyboard: [
        "Tab / Shift+Tab: move focus to and from the toggle.",
        "Space: toggle on and off.",
        "Enter: toggle on and off.",
      ],
      aria: [
        "Carbon Toggle exposes role='switch' with aria-checked, so it announces as on/off; labelText names it and labelA/labelB give the per-state text.",
        "The visible on/off state text plus the thumb position carry the state, not colour alone.",
        "Focus is shown with Carbon's 2-pixel focus border (--cds-focus).",
      ],
      contrast: "Label and state text meet 4.5:1; the track, thumb, and 2-pixel focus border meet the 3:1 non-text minimum.",
    },
  },
};
