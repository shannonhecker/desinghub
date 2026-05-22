/**
 * Cross-DS resolver for structure padding (S/M/L).
 *
 * Each DS exports its own native S/M/L scale; this helper picks the
 * right scale for the active DS. Used by the BuilderApp CSS-var
 * injector and any future caller that needs to read the live padding
 * values.
 */

import type { DesignSystem } from "@/store/useBuilder";
import type { StructurePaddingScale, StructurePaddingSize, StructurePaddingValue } from "@/data/_shared/structure";
import { SALT_STRUCTURE_PADDING } from "@/data/salt/tokens";
import { M3_STRUCTURE_PADDING } from "@/data/m3/tokens";
import { FLUENT_STRUCTURE_PADDING } from "@/data/fluent/tokens";
import { CARBON_STRUCTURE_PADDING } from "@/data/carbon/tokens";
import { UOAUI_STRUCTURE_PADDING } from "@/data/uoaui/tokens";

const TABLE: Record<DesignSystem, StructurePaddingScale> = {
  salt: SALT_STRUCTURE_PADDING,
  m3: M3_STRUCTURE_PADDING,
  fluent: FLUENT_STRUCTURE_PADDING,
  carbon: CARBON_STRUCTURE_PADDING,
  uoaui: UOAUI_STRUCTURE_PADDING,
};

export function resolveStructurePadding(
  ds: DesignSystem,
  size: StructurePaddingSize,
): StructurePaddingValue {
  return TABLE[ds][size];
}
