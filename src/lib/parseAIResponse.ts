/* ── Parse AI response text into display text + actionable JSON blocks ── */

export interface AIAction {
  action:
    | "setDesignSystem" | "setComponents" | "setDensity" | "setMode"
    | "addBlock" | "removeBlock" | "moveBlock" | "updateBlockProps"
    | "setThemeKey" | "setColorOverride" | "clearCanvas" | "setInterfaceType"
    /* Layout system additions (sub-phase 9): width/min/max per block
       + zone-level flow mode. Handled in applyAIActions.ts. */
    | "updateBlockLayout" | "setZoneLayout";
  value: unknown;
}

/**
 * Allow-list of action types the builder knows how to apply.
 * Mirrors the switch in `applyAIActions.ts`. Must stay in sync with
 * the AIAction discriminated union above.
 *
 * Purpose: hard-reject hallucinated action names from the model at the
 * parse boundary (anti-pattern #7 — Hallucinated Action Names). Without
 * this, `applyAIActions` silently falls through its switch and the user
 * sees an AI turn that did nothing, with no log trail.
 */
const KNOWN_ACTION_TYPES = new Set<AIAction["action"]>([
  "setDesignSystem",
  "setComponents",
  "setDensity",
  "setMode",
  "addBlock",
  "removeBlock",
  "moveBlock",
  "updateBlockProps",
  "setThemeKey",
  "setColorOverride",
  "clearCanvas",
  "setInterfaceType",
  "updateBlockLayout",
  "setZoneLayout",
]);

/**
 * Extracts plain display text and JSON action blocks from AI response.
 * JSON blocks are expected in ```json ... ``` fences.
 *
 * Unknown action types (not in KNOWN_ACTION_TYPES) are dropped from the
 * returned array. A console.warn is emitted per drop so devs notice in
 * dev tools; never throws, never surfaces a UI error.
 */
export function parseAIResponse(text: string): { displayText: string; actions: AIAction[] } {
  const actions: AIAction[] = [];
  const jsonBlockRegex = /```json\s*\n?([\s\S]*?)```/g;

  // Extract all JSON blocks
  let match: RegExpExecArray | null;
  while ((match = jsonBlockRegex.exec(text)) !== null) {
    const raw = match[1].trim();
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.action) {
        if (
          typeof parsed.action === "string" &&
          KNOWN_ACTION_TYPES.has(parsed.action as AIAction["action"])
        ) {
          actions.push(parsed as AIAction);
        } else {
          // Hard-reject hallucinated action types. Silent-to-user, loud-to-dev.
          const preview = raw.length > 120 ? `${raw.slice(0, 120)}…` : raw;
          console.warn(
            `[parseAIResponse] Dropping unknown action type "${String(parsed.action)}". Source: ${preview}`,
          );
        }
      }
    } catch {
      // Skip malformed JSON blocks
    }
  }

  // Remove JSON blocks from display text
  const displayText = text
    .replace(jsonBlockRegex, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { displayText, actions };
}
