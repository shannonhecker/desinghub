/**
 * themeCommand - recognise "switch to Carbon in light mode" style messages.
 *
 * The chat applies theme and design-system switches itself, without a model
 * round trip. It used to do so by substring: any message containing "dark"
 * or "light" was treated as a mode switch and answered "Theme updated!", so
 * "add a lightweight table" never reached the model, and "switch to Carbon
 * in light mode" changed only the mode (Carbon was not in the list).
 *
 * This parses WORDS, covers all five design systems, and reports whether the
 * message is ONLY a switch (`pure`). A message that also asks for something
 * else is left for the model, which has tools for both.
 */

import type { BuilderMode, DesignSystem } from "@/store/useBuilder";

export interface ThemeCommand {
  mode?: BuilderMode;
  designSystem?: DesignSystem;
  /** True when the message asks for nothing but the switch. */
  pure: boolean;
}

const DS_WORDS: Record<string, DesignSystem> = {
  salt: "salt",
  material: "m3",
  m3: "m3",
  fluent: "fluent",
  uoaui: "uoaui",
  carbon: "carbon",
};

const MODE_WORDS: Record<string, BuilderMode> = { dark: "dark", light: "light" };

/* Words that can surround a switch without asking for anything more. */
const FILLER = new Set([
  "switch", "change", "use", "try", "set", "make", "turn", "go", "put", "show", "give",
  "to", "in", "into", "on", "with", "for", "of", "and", "the", "a", "an", "it", "this", "that",
  "mode", "theme", "design", "system", "ds", "style", "look", "version", "ui", "instead", "now",
  "please", "pls", "can", "could", "you", "me", "i", "want", "would", "like", "lets", "let", "s",
  "2", "3",
]);

export function parseThemeCommand(message: string): ThemeCommand {
  const words = message.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const cmd: ThemeCommand = { pure: false };
  let other = 0;
  for (const w of words) {
    if (w in DS_WORDS) cmd.designSystem ??= DS_WORDS[w];
    else if (w in MODE_WORDS) cmd.mode ??= MODE_WORDS[w];
    else if (!FILLER.has(w)) other++;
  }
  cmd.pure = other === 0 && (cmd.mode !== undefined || cmd.designSystem !== undefined);
  return cmd;
}

const DS_NAME: Record<DesignSystem, string> = {
  salt: "Salt DS",
  m3: "Material 3",
  fluent: "Fluent 2",
  uoaui: "uoaui DS",
  carbon: "Carbon DS",
};

/** One sentence saying exactly what was switched. */
export function describeThemeCommand(cmd: ThemeCommand): string {
  if (cmd.designSystem && cmd.mode) return `Switched to ${DS_NAME[cmd.designSystem]} in ${cmd.mode} mode.`;
  if (cmd.designSystem) return `Switched to ${DS_NAME[cmd.designSystem]}.`;
  if (cmd.mode) return `Switched to ${cmd.mode} mode.`;
  return "";
}
