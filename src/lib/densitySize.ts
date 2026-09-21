/**
 * densitySize — one shared density scale, mapped onto each design system's
 * own sizing vocabulary.
 *
 * The builder exposes a single density control (High / Medium / Low / Touch,
 * Salt's ladder). Salt and uoaui scale every token from it via their
 * providers; Material, Fluent and Carbon have no global density knob — they
 * size per component. These maps are the single place that translation
 * lives, so the canvas, the UI Kit gallery and the exporters agree on what
 * "High density" means in each system.
 *
 *   density   Salt/uoaui   MUI (3-step / 2-step)   Fluent          Carbon
 *   high      high         small   / small         small           sm  (32px)
 *   medium    medium       medium  / medium        medium          md  (40px)
 *   low       low          large   / medium        large           lg  (48px)
 *   touch     touch        large   / medium        large           lg  (48px)
 *
 * Carbon's preview stylesheet uses a three-tier ladder (compact / normal /
 * spacious); `touch` shares `spacious` with `low` because Carbon has no
 * fourth tier.
 */

export type DensityLevel = "high" | "medium" | "low" | "touch";

export const DENSITY_LEVELS: readonly DensityLevel[] = ["high", "medium", "low", "touch"];

/** Any unknown value collapses to the default level. */
export function coerceDensity(v: unknown): DensityLevel {
  return v === "high" || v === "low" || v === "touch" ? v : "medium";
}

export type MuiSize3 = "small" | "medium" | "large";
export type MuiSize2 = "small" | "medium";

/** MUI components with three sizes (Button, Checkbox, ToggleButtonGroup). */
export function muiSize(d: DensityLevel): MuiSize3 {
  return d === "high" ? "small" : d === "medium" ? "medium" : "large";
}

/** MUI components with two sizes (TextField, Chip, Switch, FormControl, Table). */
export function muiSize2(d: DensityLevel): MuiSize2 {
  return d === "high" ? "small" : "medium";
}

export type FluentSize = "small" | "medium" | "large";

/** Fluent components with the standard S/M/L axis. */
export function fluentSize(d: DensityLevel): FluentSize {
  return d === "high" ? "small" : d === "medium" ? "medium" : "large";
}

/** Fluent Checkbox (medium | large): no small indicator exists. */
export function fluentCheckboxSize(d: DensityLevel): "medium" | "large" {
  return d === "high" || d === "medium" ? "medium" : "large";
}

/** Fluent Switch / Tag (small | medium): no large variant exists. */
export function fluentSize2(d: DensityLevel): "small" | "medium" {
  return d === "high" ? "small" : "medium";
}

export type CarbonSize = "sm" | "md" | "lg";

/** Carbon field-height ladder shared by Button, TextInput, Dropdown, Search, Tag. */
export function carbonSize(d: DensityLevel): CarbonSize {
  return d === "high" ? "sm" : d === "medium" ? "md" : "lg";
}

/** Carbon Toggle (sm | md): no large variant exists. */
export function carbonSize2(d: DensityLevel): "sm" | "md" {
  return d === "high" ? "sm" : "md";
}

export type CarbonDensityTier = "compact" | "normal" | "spacious";

/** Carbon's preview-stylesheet tier for the shared level (touch → spacious). */
export function carbonDensityTier(d: DensityLevel): CarbonDensityTier {
  return d === "high" ? "compact" : d === "medium" ? "normal" : "spacious";
}
