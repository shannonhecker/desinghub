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

/* DS-prop reference appended to each addendum. The button-prop mappings here
   MATCH the ComponentAPIRegistry's real per-DS translation, so what the AI
   explains lines up with the code the exporter generates. */
const DS_ADDENDA: Record<DesignSystem, string> = {
  salt: "Use --salt-* tokens. Appearances solid/bordered/transparent. Density via SaltProvider. Generic 'primary' button maps to sentiment accented; 'danger' to sentiment negative.",
  m3: "Use --md-sys-color-* tokens. Variants filled/outlined/text/elevated/tonal. Generic 'primary' maps to variant contained; 'danger' to contained + color error.",
  fluent:
    "Use --color* / --fontFamily* tokens. Appearances primary/default/outline/subtle. No native danger button; 'danger' renders subtle + the red token.",
  carbon:
    "Use --cds-* tokens. Flat, radius 0. Density compact/normal/spacious. Button kind primary/secondary/tertiary/ghost/danger; generic 'outline' maps to tertiary.",
  uoaui:
    "Use --a-* tokens. Glass surfaces, backdrop-filter: blur() elevation. Button classes a-btn-primary/secondary/outline/ghost; no danger variant.",
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
