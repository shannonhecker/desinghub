import type { DesignSystem } from "@/store/useBuilder";
import type { LibraryCategory } from "@/lib/blockRegistry";

/* ═══════════════════════════════════════════════════════════
   DS-aware variant presets.

   Each preset is a thin wrapper over a base block type with
   pre-baked defaults that produce a specific DS-canonical
   variant. SlashInserter shows these as a top section when the
   user has a matching DS active, so common patterns like
   "Salt Button — Primary Solid" or "Carbon Button — Danger"
   are one click instead of three.

   Source-of-truth alignment:
     - Salt: appearance × sentiment per @salt-ds/core docs
       (solid/bordered/transparent × accented/neutral/positive
       /caution/negative)
     - M3: variant per Material 3 spec (filled/outlined/text/
       elevated/tonal)
     - Fluent: appearance per Fluent UI v9
       (primary/default/outline/subtle)
     - Carbon: kind per @carbon/react
       (primary/secondary/tertiary/ghost/danger)
     - ausos: variant per internal DS (primary/secondary/ghost)

   Scope: this file currently covers Button. Input / Card / Tabs
   variants are queued for a follow-up — the data shape is
   stable so adding them is additive.
   ═══════════════════════════════════════════════════════════ */

export interface DSVariantPreset {
  /** Stable id, used as React key in slash-inserter results. */
  id: string;
  /** Which DS this preset applies to. */
  ds: DesignSystem;
  /** Base block type — must match a LIBRARY_BLUEPRINTS entry's `type`. */
  baseType: string;
  /** Display label in slash-inserter, e.g. "Salt Button — Primary Solid". */
  label: string;
  /** UI Kit category this preset slots into. */
  category: LibraryCategory;
  /** Material symbol icon name. */
  icon: string;
  /** Defaults to apply to the inserted block. */
  defaults: Record<string, unknown>;
}

/* ── Salt DS — Button variants ─────────────────────────────── */
const SALT_BUTTONS: DSVariantPreset[] = [
  {
    id: "salt-button-accented-solid",
    ds: "salt",
    baseType: "SimulatedButton",
    label: "Salt Button — Accented Solid",
    category: "actions",
    icon: "smart_button",
    defaults: { variant: "primary", appearance: "solid", sentiment: "accented", label: "Save changes" },
  },
  {
    id: "salt-button-neutral-bordered",
    ds: "salt",
    baseType: "SimulatedButton",
    label: "Salt Button — Neutral Bordered",
    category: "actions",
    icon: "smart_button",
    defaults: { variant: "secondary", appearance: "bordered", sentiment: "neutral", label: "Cancel" },
  },
  {
    id: "salt-button-negative-transparent",
    ds: "salt",
    baseType: "SimulatedButton",
    label: "Salt Button — Negative Transparent",
    category: "actions",
    icon: "smart_button",
    defaults: { variant: "tertiary", appearance: "transparent", sentiment: "negative", label: "Delete" },
  },
];

/* ── Material 3 — Button variants ──────────────────────────── */
const M3_BUTTONS: DSVariantPreset[] = [
  {
    id: "m3-button-filled",
    ds: "m3",
    baseType: "SimulatedButton",
    label: "M3 Button — Filled",
    category: "actions",
    icon: "smart_button",
    defaults: { variant: "filled", label: "Confirm" },
  },
  {
    id: "m3-button-outlined",
    ds: "m3",
    baseType: "SimulatedButton",
    label: "M3 Button — Outlined",
    category: "actions",
    icon: "smart_button",
    defaults: { variant: "outlined", label: "Maybe later" },
  },
  {
    id: "m3-button-tonal",
    ds: "m3",
    baseType: "SimulatedButton",
    label: "M3 Button — Tonal",
    category: "actions",
    icon: "smart_button",
    defaults: { variant: "tonal", label: "More options" },
  },
  {
    id: "m3-button-text",
    ds: "m3",
    baseType: "SimulatedButton",
    label: "M3 Button — Text",
    category: "actions",
    icon: "smart_button",
    defaults: { variant: "text", label: "Skip" },
  },
];

/* ── Fluent 2 — Button variants ────────────────────────────── */
const FLUENT_BUTTONS: DSVariantPreset[] = [
  {
    id: "fluent-button-primary",
    ds: "fluent",
    baseType: "SimulatedButton",
    label: "Fluent Button — Primary",
    category: "actions",
    icon: "smart_button",
    defaults: { variant: "primary", appearance: "primary", label: "Continue" },
  },
  {
    id: "fluent-button-default",
    ds: "fluent",
    baseType: "SimulatedButton",
    label: "Fluent Button — Default",
    category: "actions",
    icon: "smart_button",
    defaults: { variant: "secondary", appearance: "default", label: "Cancel" },
  },
  {
    id: "fluent-button-subtle",
    ds: "fluent",
    baseType: "SimulatedButton",
    label: "Fluent Button — Subtle",
    category: "actions",
    icon: "smart_button",
    defaults: { variant: "tertiary", appearance: "subtle", label: "Close" },
  },
];

/* ── Carbon — Button variants ──────────────────────────────── */
const CARBON_BUTTONS: DSVariantPreset[] = [
  {
    id: "carbon-button-primary",
    ds: "carbon",
    baseType: "SimulatedButton",
    label: "Carbon Button — Primary",
    category: "actions",
    icon: "smart_button",
    defaults: { variant: "primary", kind: "primary", label: "Save" },
  },
  {
    id: "carbon-button-secondary",
    ds: "carbon",
    baseType: "SimulatedButton",
    label: "Carbon Button — Secondary",
    category: "actions",
    icon: "smart_button",
    defaults: { variant: "secondary", kind: "secondary", label: "Cancel" },
  },
  {
    id: "carbon-button-ghost",
    ds: "carbon",
    baseType: "SimulatedButton",
    label: "Carbon Button — Ghost",
    category: "actions",
    icon: "smart_button",
    defaults: { variant: "tertiary", kind: "ghost", label: "Skip" },
  },
  {
    id: "carbon-button-danger",
    ds: "carbon",
    baseType: "SimulatedButton",
    label: "Carbon Button — Danger",
    category: "actions",
    icon: "smart_button",
    defaults: { variant: "primary", kind: "danger", label: "Delete record" },
  },
];

/* ── ausos — Button variants ───────────────────────────────── */
const AUSOS_BUTTONS: DSVariantPreset[] = [
  {
    id: "ausos-button-primary",
    ds: "ausos",
    baseType: "SimulatedButton",
    label: "ausos Button — Primary",
    category: "actions",
    icon: "smart_button",
    defaults: { variant: "primary", label: "Generate" },
  },
  {
    id: "ausos-button-secondary",
    ds: "ausos",
    baseType: "SimulatedButton",
    label: "ausos Button — Secondary",
    category: "actions",
    icon: "smart_button",
    defaults: { variant: "secondary", label: "Edit prompt" },
  },
  {
    id: "ausos-button-ghost",
    ds: "ausos",
    baseType: "SimulatedButton",
    label: "ausos Button — Ghost",
    category: "actions",
    icon: "smart_button",
    defaults: { variant: "tertiary", label: "Cancel" },
  },
];

/* ── Combined registry, indexed by DS ──────────────────────── */
const PRESETS_BY_DS: Record<DesignSystem, DSVariantPreset[]> = {
  salt: SALT_BUTTONS,
  m3: M3_BUTTONS,
  fluent: FLUENT_BUTTONS,
  carbon: CARBON_BUTTONS,
  ausos: AUSOS_BUTTONS,
};

export function getDSVariantPresets(ds: DesignSystem): DSVariantPreset[] {
  return PRESETS_BY_DS[ds] ?? [];
}

export const ALL_DS_VARIANT_PRESETS: DSVariantPreset[] = [
  ...SALT_BUTTONS,
  ...M3_BUTTONS,
  ...FLUENT_BUTTONS,
  ...CARBON_BUTTONS,
  ...AUSOS_BUTTONS,
];
