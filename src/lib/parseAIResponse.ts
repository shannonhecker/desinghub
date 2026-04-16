/* ── Parse AI response text into display text + actionable JSON blocks ── */

export interface AIAction {
  action:
    | "setDesignSystem" | "setComponents" | "setDensity" | "setMode"
    | "addBlock" | "removeBlock" | "moveBlock" | "updateBlockProps"
    | "setThemeKey" | "setColorOverride" | "clearCanvas" | "setInterfaceType";
  value: unknown;
}

/**
 * Extracts plain display text and JSON action blocks from AI response.
 * JSON blocks are expected in ```json ... ``` fences.
 */
export function parseAIResponse(text: string): { displayText: string; actions: AIAction[] } {
  const actions: AIAction[] = [];
  const jsonBlockRegex = /```json\s*\n?([\s\S]*?)```/g;

  // Extract all JSON blocks
  let match: RegExpExecArray | null;
  while ((match = jsonBlockRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed && parsed.action) {
        actions.push(parsed as AIAction);
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
