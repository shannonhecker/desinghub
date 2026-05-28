/**
 * Validate + canonicalize URL query params for the Builder.
 *
 * URL params are external input — never trust `as DesignSystem` casts.
 * Each helper returns the canonical value or `null` for unknown input,
 * letting callers fall back to the store default without crashing.
 *
 * Without these helpers, `/builder?ds=md3` flowed `"md3"` straight to
 * `setDesignSystem`, where `themeMap["md3"]` was `undefined` and the
 * next property read crashed the whole app.
 */

import type {
  DesignSystem,
  BuilderMode,
  InterfaceType,
} from "@/store/useBuilder";

const DESIGN_SYSTEMS = new Set<DesignSystem>([
  "salt",
  "m3",
  "fluent",
  "uoaui",
  "carbon",
]);

/* URL-friendly aliases. Users naturally type `md3` / `material3` for
   Material 3, so we map common shorthands to the canonical key rather
   than crash or silently default. Keep this list small — every alias
   is a long-term URL contract. */
const DS_ALIASES: Record<string, DesignSystem> = {
  md3: "m3",
  material: "m3",
  material3: "m3",
};

export function canonicalDesignSystem(
  raw: string | null | undefined,
): DesignSystem | null {
  if (!raw) return null;
  const key = raw.toLowerCase().trim();
  if (DESIGN_SYSTEMS.has(key as DesignSystem)) return key as DesignSystem;
  if (key in DS_ALIASES) return DS_ALIASES[key];
  return null;
}

const BUILDER_MODES = new Set<BuilderMode>(["light", "dark"]);

export function canonicalBuilderMode(
  raw: string | null | undefined,
): BuilderMode | null {
  if (!raw) return null;
  const key = raw.toLowerCase().trim();
  return BUILDER_MODES.has(key as BuilderMode) ? (key as BuilderMode) : null;
}

const INTERFACE_TYPES = new Set<InterfaceType>([
  "dashboard",
  "landing",
  "form",
  "ecommerce",
  "blog",
  "portfolio",
]);

export function canonicalInterfaceType(
  raw: string | null | undefined,
): InterfaceType | null {
  if (!raw) return null;
  const key = raw.toLowerCase().trim();
  return INTERFACE_TYPES.has(key as InterfaceType)
    ? (key as InterfaceType)
    : null;
}
