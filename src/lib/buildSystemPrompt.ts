/* Design Hub AI: DS-aware system prompt builder (Phase 4).
 *
 * Wraps the base SYSTEM_PROMPT from chatSystem.ts with a short, DS-specific
 * addendum so Claude tailors token + variant guidance to the active design
 * system. The route layer is the strict guard (returns 400 on non-canonical
 * input). This function is defensive only: unknown strings return the base
 * prompt with no addendum so a misrouted call never throws.
 */

import { SYSTEM_PROMPT } from "./chatSystem";

export const VALID_DESIGN_SYSTEMS = [
  "salt",
  "m3",
  "fluent",
  "carbon",
  "uoaui",
] as const;

export type DesignSystem = (typeof VALID_DESIGN_SYSTEMS)[number];

const DS_ADDENDA: Record<DesignSystem, string> = {
  salt: "Use --salt-* tokens. Appearances solid/bordered/transparent. Density via SaltProvider.",
  m3: "Use --md-sys-color-* tokens. Variants filled/outlined/text/elevated/tonal.",
  fluent:
    "Use --color* / --fontFamily* tokens. Appearances primary/default/outline/subtle.",
  carbon:
    "Use --cds-* tokens. Flat, radius 0. Density compact/normal/spacious.",
  uoaui:
    "Use --a-* tokens. Glass surfaces, backdrop-filter: blur() elevation.",
};

function isDesignSystem(value: unknown): value is DesignSystem {
  return (
    typeof value === "string" &&
    (VALID_DESIGN_SYSTEMS as readonly string[]).includes(value)
  );
}

/**
 * Returns the base SYSTEM_PROMPT plus a DS-specific addendum.
 *
 * Defaults to `salt` when input is undefined or null. For any non-canonical
 * string, returns the base prompt with no addendum (defensive default: the
 * route is the strict validator and should reject before reaching here).
 */
export function buildSystemPrompt(
  ds: DesignSystem | string | undefined | null,
): string {
  if (ds === undefined || ds === null) {
    return `${SYSTEM_PROMPT}\n\n## Active Design System: salt\n\n${DS_ADDENDA.salt}`;
  }
  if (isDesignSystem(ds)) {
    return `${SYSTEM_PROMPT}\n\n## Active Design System: ${ds}\n\n${DS_ADDENDA[ds]}`;
  }
  return SYSTEM_PROMPT;
}
