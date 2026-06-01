/**
 * kitCatalog — the bridge that makes /ui-kit speak the BUILDER's vocabulary.
 *
 * It derives the kit's component list from the builder's single source of
 * truth (`LIBRARY_BLUEPRINTS` + `BLOCK_CATEGORY` in blockRegistry) and exposes
 * `kitExportCode`, which reuses `blockToRealJsx` + `collectImports` VERBATIM so
 * the kit shows the EXACT per-DS handoff code the builder export emits. Add a
 * block to the builder and it auto-appears here — no duplicated vocabulary.
 */

import {
  LIBRARY_BLUEPRINTS,
  BLOCK_CATEGORY,
  LIBRARY_CATEGORY_ORDER,
  type LibraryCategory,
} from "@/lib/blockRegistry";
import {
  blockToRealJsx,
  collectImports,
  resolveComponentApi,
  type SystemId,
} from "@/lib/componentApiRegistry";

export interface KitEntry {
  /** Builder block type — THE shared id across kit + builder + exporter. */
  type: string;
  label: string;
  icon: string;
  category: LibraryCategory | null;
  defaults: Record<string, unknown>;
}

/* Zone-chrome (AppBrand/StatusPill/NavItem/FooterText) + LayoutGroup need
   zone/group context, not a standalone demo, so they're excluded from the
   kit gallery. Everything else is a real, standalone builder block. */
const HIDE = new Set([
  "LayoutGroup",
  "AppBrand",
  "StatusPill",
  "NavItem",
  "FooterText",
]);

/** The kit catalog — a projection of the builder's own vocabulary. */
export const KIT_CATALOG: KitEntry[] = LIBRARY_BLUEPRINTS.filter(
  (b) => !HIDE.has(b.type),
).map((b) => ({
  type: b.type,
  label: b.label,
  icon: b.icon,
  category: BLOCK_CATEGORY[b.type] ?? null,
  defaults: b.defaults,
}));

/** Catalog grouped by the builder's own library categories (in order). */
export function kitByCategory(): {
  key: LibraryCategory;
  label: string;
  icon: string;
  items: KitEntry[];
}[] {
  return LIBRARY_CATEGORY_ORDER.map((c) => ({
    ...c,
    items: KIT_CATALOG.filter((e) => e.category === c.key),
  })).filter((g) => g.items.length > 0);
}

/** Look up a single catalog entry by builder block type. */
export function kitEntry(blockType: string): KitEntry | null {
  return KIT_CATALOG.find((e) => e.type === blockType) ?? null;
}

export interface KitExport {
  /** Real per-DS component JSX (empty string when no registry entry exists). */
  code: string;
  /** Deduped import statements for that block in that DS. */
  imports: string[];
  /** True when the ComponentAPIRegistry has a real entry for this block+DS. */
  isReal: boolean;
}

/**
 * The SAME real per-DS export the builder emits, for one block type.
 * Reuses blockToRealJsx + collectImports verbatim against the block's
 * defaults so kit and builder are guaranteed identical.
 */
export function kitExportCode(system: SystemId, blockType: string): KitExport {
  const entry = kitEntry(blockType);
  const props = entry?.defaults ?? {};
  const real = blockToRealJsx(system, { type: blockType, props });
  const imports = collectImports(system, [blockType]);
  return {
    code: real ?? "",
    imports,
    isReal: resolveComponentApi(system, blockType) != null,
  };
}
