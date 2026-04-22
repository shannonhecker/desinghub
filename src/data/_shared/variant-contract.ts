/**
 * Variant contract — shared across all 5 design systems.
 *
 * This file defines the resolution axes every DS token must declare.
 * Zero runtime. Types only.
 *
 * Reference: docs/TOKENS.md § Token schema + § Variant matrix.
 *
 * Resolution axes:
 *   - Mode     → theme-object swap via activateTheme(); never in token name.
 *   - Density  → DENSITY_MAP / SIZE_MAP scale-index → px. Not in name; name is scale-level.
 *   - State    → suffix on interactive color + opacity tokens only.
 *   - Size     → component-prop variants via SIZE_MAP. Not in token name.
 */

/** Active theme mode. Resolves via activateTheme(system, theme). */
export type Mode = 'light' | 'dark' | 'contrast';

/**
 * Density scale-index. Per-DS DENSITY_MAP translates these into px.
 * Salt / ausos use the full 4-tier range.
 * M3 uses a density-offset model (-3..0) — see getM3LayoutDensity.
 * Carbon uses compact / normal / spacious (maps to compact / default / comfortable).
 * Fluent does NOT use density — it uses Size.
 */
export type Density = 'compact' | 'default' | 'comfortable' | 'touch';

/** Interactive state. Only interactive color + opacity tokens take a state suffix. */
export type State = 'rest' | 'hover' | 'focus' | 'pressed' | 'disabled' | 'selected';

/**
 * Component-size scale. Fluent uses this natively (S/M/L); other DS may adopt
 * it for component-prop variants (e.g. Button size).
 */
export type Size = 'sm' | 'md' | 'lg';

/** The 8 categories every DS token resolves under. */
export type TokenCategory =
  | 'color'
  | 'space'
  | 'type'
  | 'radius'
  | 'elev'
  | 'motion'
  | 'opacity'
  | 'border';

/** The 5 supported design systems. */
export type DesignSystem = 'salt' | 'm3' | 'fluent' | 'carbon' | 'ausos';

/**
 * Variant applicability matrix.
 * For each category, which axes resolve its value?
 * See docs/TOKENS.md § Variant matrix for the source of truth.
 */
export type AppliesAxis = Readonly<{
  mode: boolean;
  density: boolean;
  state: boolean;
  size: boolean;
}>;

export type VariantMatrix = Readonly<Record<TokenCategory, AppliesAxis>>;

/** Canonical per-DS variant matrix. Categories marked `partial` in TOKENS.md land as `true` here. */
export const VARIANT_MATRIX: VariantMatrix = {
  color: { mode: true, density: false, state: true, size: false },
  space: { mode: false, density: true, state: false, size: false },
  type: { mode: false, density: true, state: false, size: true },
  radius: { mode: false, density: true, state: false, size: false },
  elev: { mode: true, density: false, state: true, size: false },
  motion: { mode: false, density: false, state: false, size: false },
  opacity: { mode: false, density: false, state: true, size: false },
  border: { mode: false, density: true, state: true, size: false },
} as const;

/** Token name — flat grammar: --<ds>-<category>-<intent>[-<state>][-<size>]. */
export type TokenName = `--${DesignSystem}-${string}`;

/** A token definition — name + resolved CSS value. Values always arrive as CSS strings. */
export interface TokenDef {
  readonly name: TokenName;
  readonly category: TokenCategory;
  readonly value: string;
}
