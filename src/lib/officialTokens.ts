/**
 * Official design-system token plumbing for /ui-kit's Token Reference.
 *
 * GOAL: show DEMONSTRABLY-OFFICIAL token values for the design systems whose
 * tokens ship as plain CSS custom properties — Salt (`--salt-*`) and Carbon
 * (`--cds-*`) — read off the real, published token packages rather than the
 * hand-authored JS facsimile theme objects.
 *
 * SCOPING (this is the SSR/leak-safety contract — see PR notes):
 *   - Salt: we import `@salt-ds/theme/index.css` ONCE at the /ui-kit route.
 *     That file defines `--salt-*` only under `.salt-theme` / `.salt-density-*`
 *     class selectors (NOT `:root`, no global reset), so it cannot restyle the
 *     builder or any other route — nothing else in the app carries those
 *     classes. We read values off a throwaway `.salt-theme[data-mode=…]` node.
 *   - Carbon: `@carbon/styles/css/styles.css` is a 950 KB GLOBAL build with an
 *     `html`/`body`/`*` reset and component styles — importing it would wreck
 *     the rest of the app. We deliberately DO NOT import it. Instead we read the
 *     OFFICIAL token VALUES from `@carbon/themes` (the canonical IBM token data
 *     package) and emit ONLY `--cds-*` custom properties, scoped under a
 *     `.preview-carbon[data-cds-theme=…]` selector. No reset, no globals, no
 *     `:root`. The values are the genuine published Carbon tokens; the CSS that
 *     carries them is ours and is namespaced so it can only apply inside an
 *     element that opts in with `.preview-carbon`.
 *
 * The other three systems (M3, Fluent, uoaui) stay on the existing facsimile
 * theme objects for now — a follow-up PR adds their provider-based tokens.
 */

import { white, g10, g90, g100 } from "@carbon/themes";
import type { SystemId } from "@/store/useDesignHub";

/** Token-source provenance for a DS, surfaced in the UI as a small note. */
export type TokenSource = "official" | "facsimile";

/**
 * Which DSs read genuine official CSS-var tokens vs. the hand-authored
 * facsimile. Drives both the Token Reference behaviour and the UI label.
 */
export const TOKEN_SOURCE: Record<SystemId, TokenSource> = {
  salt: "official", // @salt-ds/theme --salt-*
  carbon: "official", // @carbon/themes --cds-*
  m3: "facsimile",
  fluent: "facsimile",
  uoaui: "facsimile",
};

export function isOfficialTokenSource(system: SystemId): boolean {
  return TOKEN_SOURCE[system] === "official";
}

/* ────────────────────────────────────────────────────────────────────────
 * Curated official-token display lists (category → [varName, label]).
 * These are the exact published CSS custom-property names; the displayed
 * value is read live off the official CSS so it is demonstrably official.
 * ──────────────────────────────────────────────────────────────────────── */

export interface OfficialTokenRow {
  /** Canonical CSS custom property, e.g. "--salt-actionable-bold-background". */
  varName: string;
  /** Short human label shown in the row (e.g. "actionable-bold-background"). */
  label: string;
}

export interface OfficialTokenCategory {
  category: string;
  tokens: OfficialTokenRow[];
}

const row = (varName: string, label: string): OfficialTokenRow => ({ varName, label });

/** Official Salt characteristic + palette tokens (`--salt-*`). */
export const SALT_OFFICIAL_TOKENS: OfficialTokenCategory[] = [
  {
    category: "Background",
    tokens: [
      row("--salt-container-primary-background", "container-primary-background"),
      row("--salt-container-secondary-background", "container-secondary-background"),
      row("--salt-palette-neutral-primary-background", "palette-neutral-primary-background"),
    ],
  },
  {
    category: "Foreground",
    tokens: [
      row("--salt-content-primary-foreground", "content-primary-foreground"),
      row("--salt-content-secondary-foreground", "content-secondary-foreground"),
      row("--salt-content-bold-foreground", "content-bold-foreground"),
    ],
  },
  {
    category: "Actionable (Accent)",
    tokens: [
      row("--salt-actionable-bold-background", "actionable-bold-background"),
      row("--salt-actionable-bold-foreground", "actionable-bold-foreground"),
      row("--salt-actionable-accented-background", "actionable-accented-background"),
    ],
  },
  {
    category: "Separable (Border)",
    tokens: [
      row("--salt-separable-primary-borderColor", "separable-primary-borderColor"),
      row("--salt-separable-secondary-borderColor", "separable-secondary-borderColor"),
      row("--salt-focused-outlineColor", "focused-outlineColor"),
    ],
  },
  {
    category: "Status",
    tokens: [
      row("--salt-status-success-foreground", "status-success-foreground"),
      row("--salt-status-error-foreground", "status-error-foreground"),
      row("--salt-status-warning-foreground", "status-warning-foreground"),
      row("--salt-status-info-foreground", "status-info-foreground"),
    ],
  },
];

/** Official Carbon tokens (`--cds-*`), grouped per CLAUDE.md key groups. */
export const CARBON_OFFICIAL_TOKENS: OfficialTokenCategory[] = [
  {
    category: "Background",
    tokens: [
      row("--cds-background", "background"),
      row("--cds-layer-01", "layer-01"),
      row("--cds-layer-02", "layer-02"),
      row("--cds-layer-03", "layer-03"),
    ],
  },
  {
    category: "Text",
    tokens: [
      row("--cds-text-primary", "text-primary"),
      row("--cds-text-secondary", "text-secondary"),
      row("--cds-text-placeholder", "text-placeholder"),
    ],
  },
  {
    category: "Border",
    tokens: [
      row("--cds-border-subtle-01", "border-subtle-01"),
      row("--cds-border-strong-01", "border-strong-01"),
      row("--cds-border-interactive", "border-interactive"),
    ],
  },
  {
    category: "Interactive",
    tokens: [
      row("--cds-interactive", "interactive"),
      row("--cds-link-primary", "link-primary"),
      row("--cds-focus", "focus"),
    ],
  },
  {
    category: "Support",
    tokens: [
      row("--cds-support-success", "support-success"),
      row("--cds-support-error", "support-error"),
      row("--cds-support-warning", "support-warning"),
      row("--cds-support-info", "support-info"),
    ],
  },
];

/** The curated official token list for a DS (empty for facsimile DSs). */
export function getOfficialTokenList(system: SystemId): OfficialTokenCategory[] {
  if (system === "salt") return SALT_OFFICIAL_TOKENS;
  if (system === "carbon") return CARBON_OFFICIAL_TOKENS;
  return [];
}

/* ────────────────────────────────────────────────────────────────────────
 * Carbon: official --cds-* values from @carbon/themes, scoped to .preview-carbon
 * ──────────────────────────────────────────────────────────────────────── */

/** Carbon theme keys exposed by Design Hub map 1:1 to @carbon/themes exports. */
const CARBON_TOKEN_THEMES: Record<string, Record<string, unknown>> = {
  white,
  g10,
  g90,
  g100,
};

/**
 * Convert a @carbon/themes camelCase token key to its canonical Carbon
 * `--cds-*` CSS custom-property name. Verified against the names emitted by
 * `@carbon/styles/css/styles.css`, e.g.:
 *   borderStrong01 → --cds-border-strong-01
 *   layer01        → --cds-layer-01
 *   textPrimary    → --cds-text-primary
 *   supportError   → --cds-support-error
 */
export function cdsVarName(key: string): string {
  const kebab = key
    .replace(/([a-z])([A-Z0-9])/g, "$1-$2")
    .replace(/([0-9])([a-zA-Z])/g, "$1-$2")
    .toLowerCase();
  return `--cds-${kebab}`;
}

/** Only string token values are color/size CSS values we can emit as vars. */
function isCssTokenValue(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

/**
 * Build the scoped, leak-proof Carbon token stylesheet. Emits ONLY `--cds-*`
 * custom properties (no reset, no component CSS, no `:root`), under
 * `.preview-carbon[data-cds-theme="<key>"]`. Safe to inject anywhere — it can
 * only take effect inside an element that opts in with `.preview-carbon`.
 */
export function buildCarbonTokenCSS(): string {
  const blocks: string[] = [];
  for (const [themeKey, tokens] of Object.entries(CARBON_TOKEN_THEMES)) {
    const decls: string[] = [];
    for (const [key, value] of Object.entries(tokens)) {
      if (isCssTokenValue(value)) decls.push(`${cdsVarName(key)}:${value};`);
    }
    blocks.push(`.preview-carbon[data-cds-theme="${themeKey}"]{${decls.join("")}}`);
  }
  return blocks.join("\n");
}

/**
 * Read the official Carbon token VALUES for a theme directly from
 * `@carbon/themes`, keyed by `--cds-*` var name. Used as a fallback path that
 * does not require a live DOM (e.g. SSR / tests), and as the data backing the
 * Token Reference's Carbon rows.
 */
export function getCarbonOfficialTokens(themeKey: string): Record<string, string> {
  const tokens = CARBON_TOKEN_THEMES[themeKey] ?? CARBON_TOKEN_THEMES.white;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tokens)) {
    if (isCssTokenValue(value)) out[cdsVarName(key)] = value;
  }
  return out;
}

/* ────────────────────────────────────────────────────────────────────────
 * Computed-value readers (browser-only). Both fall back to "" off-DOM.
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * Read computed `--salt-*` / `--cds-*` values off a detached, off-screen probe
 * element carrying the right scope class so the official CSS resolves. Returns
 * a map of varName → computed value (trimmed). Returns {} when not in a browser.
 *
 * @param system      "salt" or "carbon"
 * @param varNames    the custom-property names to resolve (e.g. "--salt-actionable-bold-background")
 * @param themeMode   for Salt: "light" | "dark" (data-mode); for Carbon: theme key (data-cds-theme)
 */
export function readOfficialComputedTokens(
  system: "salt" | "carbon",
  varNames: string[],
  themeMode: string,
): Record<string, string> {
  if (typeof document === "undefined") return {};
  const probe = document.createElement("div");
  if (system === "salt") {
    // Self-scoped class from @salt-ds/theme/index.css. Density class supplies
    // the size/spacing tokens; medium is the canonical default.
    probe.className = "salt-theme salt-density-medium";
    probe.setAttribute("data-mode", themeMode === "dark" ? "dark" : "light");
  } else {
    // Our scoped Carbon token block keys off [data-cds-theme].
    probe.className = "preview-carbon";
    probe.setAttribute("data-cds-theme", themeMode);
  }
  probe.style.position = "absolute";
  probe.style.left = "-99999px";
  probe.style.width = "0";
  probe.style.height = "0";
  probe.style.pointerEvents = "none";
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const out: Record<string, string> = {};
  for (const name of varNames) {
    out[name] = cs.getPropertyValue(name).trim();
  }
  document.body.removeChild(probe);
  return out;
}
