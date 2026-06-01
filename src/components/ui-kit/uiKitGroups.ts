/**
 * Single source of truth for /ui-kit information architecture.
 *
 * BEFORE: ComponentList hard-split Foundations ids {tokens, audit} into a
 * synthetic "Tools" group AND injected a non-registry "Builder Blocks" tile,
 * while LandingGrid rendered every Foundations entry from getCategories() as a
 * card. Result: "Tokens" + "Design Audit" appeared BOTH as Foundation cards
 * AND as Tools entries (the 11-vs-9 mismatch). MainContent then routed special
 * ids via a magic-id `if` chain that could silently drift from the nav.
 *
 * AFTER: one `GROUP_MAP` keyed by id assigns every entry to exactly one nav
 * group, and one `COMPONENT_ROUTES` table maps special ids to their renderer.
 * BOTH ComponentList and LandingGrid read `getUiKitGroup()`; MainContent reads
 * `COMPONENT_ROUTES`. A thing now appears in exactly ONE place.
 */

/** The three top-level UI-Kit nav groups. */
export type UiKitGroup = "Foundations" | "Tools" | "Components";

/**
 * Explicit per-id group override. Any id NOT listed here falls back to a
 * category-derived group (see `getUiKitGroup`). These ids are the "Tools" —
 * cross-cutting utilities, not per-DS reference entries:
 *   - tokens          → the live Token Reference inspector
 *   - audit           → the Design Audit code scanner
 *   - builder-blocks  → the cross-system Builder Blocks gallery (synthetic;
 *                       not present in any per-DS registry)
 */
export const GROUP_MAP: Record<string, UiKitGroup> = {
  tokens: "Tools",
  audit: "Tools",
  "builder-blocks": "Tools",
};

/**
 * Resolve the single nav group for a registry entry.
 * `id` overrides win (GROUP_MAP); otherwise the registry `cat` decides:
 *   "Foundations"            → Foundations
 *   "Components & Patterns"  → Components
 *   "Patterns"               → Components (rendered under a Patterns sub-group)
 */
export function getUiKitGroup(id: string, cat: string): UiKitGroup {
  if (GROUP_MAP[id]) return GROUP_MAP[id];
  if (cat === "Foundations") return "Foundations";
  return "Components";
}

/**
 * Synthetic "Builder Blocks" entry. It is NOT a per-DS registry component — it
 * is a cross-system view rendering the builder's block vocabulary + real export
 * code. Both the nav (ComponentList) and the overview (LandingGrid Tools row)
 * surface it from this one definition so they can never drift.
 */
export const BUILDER_BLOCKS = {
  id: "builder-blocks",
  name: "Builder Blocks",
  desc: "Cross-system gallery of the builder's block vocabulary with real export code.",
} as const;

/**
 * Special-id route table: id → how MainContent renders it.
 * Replaces MainContent's magic-id `if` chain so nav + overview + content read
 * from one place. Ids NOT listed fall through to the normal per-DS
 * ComponentPreview lookup.
 *
 *   "token-reference"  → <TokenReference />
 *   "audit-panel"      → <AuditPanel />
 *   "builder-blocks"   → lazy <BuilderBlockGallery />
 *   "preview:<id>"     → <ComponentPreview componentId={<id>} />
 */
export type UiKitRoute =
  | { kind: "token-reference" }
  | { kind: "audit-panel" }
  | { kind: "builder-blocks" }
  | { kind: "preview"; componentId: string };

export const COMPONENT_ROUTES: Record<string, UiKitRoute> = {
  tokens: { kind: "token-reference" },
  audit: { kind: "audit-panel" },
  "builder-blocks": { kind: "builder-blocks" },
  charts: { kind: "preview", componentId: "charts" },
};
