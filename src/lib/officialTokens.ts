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
 * PR-2b extends the same model to M3 and Fluent, the two DSs that ship runtime
 * providers rather than a plain CSS-var stylesheet:
 *   - M3: `@mui/material`'s CSS-variables theme exposes `--mui-*` custom
 *     properties. We re-emit the genuine generated values SCOPED to
 *     `.preview-m3` (see buildM3TokenCSS in officialM3FluentTokens.ts).
 *   - Fluent: `@fluentui/react-theme`'s web{Light,Dark}Theme tokens map 1:1 to
 *     the `--color*` / `--fontFamily*` vars FluentProvider injects; we emit them
 *     SCOPED to `.preview-fluent` (see buildFluentTokenCSS).
 * Both are emitted via <OfficialTokenStyles> (client-only) with NO `:root` and
 * NO global reset, so they cannot leak. uoaui stays in-house (no official pkg).
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
  m3: "official", // @mui/material --mui-* (CSS-variables theme)
  fluent: "official", // @fluentui/react-theme --color* / --fontFamily*
  uoaui: "facsimile", // in-house DS; no official package
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

/** Official M3 tokens (`--mui-*`) from @mui/material's CSS-variables theme. */
export const M3_OFFICIAL_TOKENS: OfficialTokenCategory[] = [
  {
    category: "Primary",
    tokens: [
      row("--mui-palette-primary-main", "palette-primary-main"),
      row("--mui-palette-primary-dark", "palette-primary-dark"),
      row("--mui-palette-primary-contrastText", "palette-primary-contrastText"),
    ],
  },
  {
    category: "Background / Surface",
    tokens: [
      row("--mui-palette-background-default", "palette-background-default"),
      row("--mui-palette-background-paper", "palette-background-paper"),
      row("--mui-palette-divider", "palette-divider"),
    ],
  },
  {
    category: "Text",
    tokens: [
      row("--mui-palette-text-primary", "palette-text-primary"),
      row("--mui-palette-text-secondary", "palette-text-secondary"),
      row("--mui-palette-text-disabled", "palette-text-disabled"),
    ],
  },
  {
    category: "Status",
    tokens: [
      row("--mui-palette-success-main", "palette-success-main"),
      row("--mui-palette-error-main", "palette-error-main"),
      row("--mui-palette-warning-main", "palette-warning-main"),
      row("--mui-palette-info-main", "palette-info-main"),
    ],
  },
];

/** Official Fluent 2 tokens (`--color*`) from @fluentui/react-theme. */
export const FLUENT_OFFICIAL_TOKENS: OfficialTokenCategory[] = [
  {
    category: "Brand",
    tokens: [
      row("--colorBrandBackground", "colorBrandBackground"),
      row("--colorBrandForeground1", "colorBrandForeground1"),
      row("--colorNeutralForegroundOnBrand", "colorNeutralForegroundOnBrand"),
    ],
  },
  {
    category: "Neutral Background",
    tokens: [
      row("--colorNeutralBackground1", "colorNeutralBackground1"),
      row("--colorNeutralBackground2", "colorNeutralBackground2"),
      row("--colorNeutralBackground3", "colorNeutralBackground3"),
    ],
  },
  {
    category: "Neutral Foreground",
    tokens: [
      row("--colorNeutralForeground1", "colorNeutralForeground1"),
      row("--colorNeutralForeground2", "colorNeutralForeground2"),
      row("--colorNeutralForeground3", "colorNeutralForeground3"),
    ],
  },
  {
    category: "Stroke",
    tokens: [
      row("--colorNeutralStroke1", "colorNeutralStroke1"),
      row("--colorNeutralStroke2", "colorNeutralStroke2"),
      row("--colorNeutralStrokeAccessible", "colorNeutralStrokeAccessible"),
    ],
  },
  {
    category: "Status",
    tokens: [
      row("--colorStatusSuccessForeground1", "colorStatusSuccessForeground1"),
      row("--colorStatusDangerForeground1", "colorStatusDangerForeground1"),
      row("--colorStatusWarningForeground1", "colorStatusWarningForeground1"),
    ],
  },
];

/** The curated official token list for a DS (empty for facsimile DSs). */
export function getOfficialTokenList(system: SystemId): OfficialTokenCategory[] {
  if (system === "salt") return SALT_OFFICIAL_TOKENS;
  if (system === "carbon") return CARBON_OFFICIAL_TOKENS;
  if (system === "m3") return M3_OFFICIAL_TOKENS;
  if (system === "fluent") return FLUENT_OFFICIAL_TOKENS;
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
 *
 * Also emits a bare `.preview-carbon` default block (white theme) so the
 * official `--cds-*` values resolve even before a `data-cds-theme` attribute
 * is set. The bridge in builder.css (`.preview-carbon { --ds-*: var(--cds-*) }`)
 * therefore always reads official Carbon values once this stylesheet is loaded,
 * winning over the facsimile `.cds--<theme>` ancestor on specificity.
 */
export function buildCarbonTokenCSS(): string {
  const blocks: string[] = [];
  /* Default (un-attributed) .preview-carbon → white, so the official tokens
     are in scope on the wrapper even if the active theme attr is missing. */
  const defaultDecls: string[] = [];
  for (const [key, value] of Object.entries(CARBON_TOKEN_THEMES.white)) {
    if (isCssTokenValue(value)) defaultDecls.push(`${cdsVarName(key)}:${value};`);
  }
  blocks.push(`.preview-carbon{${defaultDecls.join("")}}`);
  for (const [themeKey, tokens] of Object.entries(CARBON_TOKEN_THEMES)) {
    const decls: string[] = [];
    for (const [key, value] of Object.entries(tokens)) {
      if (isCssTokenValue(value)) decls.push(`${cdsVarName(key)}:${value};`);
    }
    blocks.push(`.preview-carbon[data-cds-theme="${themeKey}"]{${decls.join("")}}`);
  }
  return blocks.join("\n");
}

/* ────────────────────────────────────────────────────────────────────────
 * Scope wiring: extra class + data-attrs so the OFFICIAL --salt-* / --cds-*
 * vars resolve on the same element that carries .preview-salt / .preview-carbon.
 *
 *   - Salt official tokens are defined by @salt-ds/theme/index.css ONLY under
 *     `.salt-theme` (+ `.salt-theme[data-mode=light|dark]` for the palette).
 *     So a .preview-salt wrapper must ALSO carry `.salt-theme` + `data-mode`
 *     for the official vars to be in scope. The Salt CSS is class-scoped (no
 *     :root / body / * reset — verified), so adding the class is leak-safe.
 *   - Carbon official tokens are emitted (above) under
 *     `.preview-carbon[data-cds-theme=<key>]`, so the wrapper needs the
 *     matching `data-cds-theme`.
 *
 * `salt-density-medium` is added alongside so the size/spacing tokens (which
 * Salt scopes under the density classes) also resolve; medium is the canonical
 * default and matches readOfficialComputedTokens()'s probe.
 * ──────────────────────────────────────────────────────────────────────── */
export interface PreviewOfficialScope {
  /** Extra className to append to the `.preview-<ds>` wrapper. */
  className: string;
  /** Extra data-/attribute props to spread onto the wrapper element. */
  attrs: Record<string, string>;
}

/**
 * For Salt/Carbon, return the official-token scope wiring for a wrapper.
 *
 * M3/Fluent (PR-2b) need NO extra wiring: their official `--mui-*` / `--color*`
 * vars are emitted directly under `.preview-m3` / `.preview-fluent` (dark base)
 * and `.builder-light .preview-m3` / `.preview-fluent` (light) by
 * buildM3TokenCSS / buildFluentTokenCSS. The wrapper already carries
 * `.preview-<ds>`, and the `.builder-light` ancestor (builder-shell /
 * present-stage / standalone-preview / the /ui-kit gallery wrapper) drives the
 * light override automatically — so empty wiring is correct.
 *
 * uoaui (in-house) also returns empty wiring.
 *
 * @param system    active design system
 * @param mode      "light" | "dark" canvas mode (drives Salt data-mode)
 * @param themeKey  active theme key (Carbon: white/g10/g90/g100)
 */
export function getPreviewOfficialScope(
  system: SystemId,
  mode: "light" | "dark",
  themeKey: string,
): PreviewOfficialScope {
  if (system === "salt") {
    return {
      className: "salt-theme salt-density-medium",
      attrs: { "data-mode": mode === "dark" ? "dark" : "light" },
    };
  }
  if (system === "carbon") {
    const resolved = ["white", "g10", "g90", "g100"].includes(themeKey) ? themeKey : "white";
    return { className: "", attrs: { "data-cds-theme": resolved } };
  }
  return { className: "", attrs: {} };
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
 * Read computed `--salt-*` / `--cds-*` / `--mui-*` / `--color*` values off a
 * detached, off-screen probe element carrying the right scope class so the
 * official CSS resolves. Returns a map of varName → computed value (trimmed).
 * Returns {} when not in a browser.
 *
 * For M3/Fluent the official vars are emitted under `.preview-m3` /
 * `.preview-fluent` (dark base) and `.builder-light .preview-m3` /
 * `.preview-fluent` (light), so the probe needs the `.preview-<ds>` class and,
 * for light mode, a `.builder-light` ANCESTOR (matched by wrapping the probe in
 * a `.builder-light` host so the descendant override resolves).
 *
 * @param system      "salt" | "carbon" | "m3" | "fluent"
 * @param varNames    the custom-property names to resolve (e.g. "--mui-palette-primary-main")
 * @param themeMode   Salt/M3/Fluent: "light" | "dark"; Carbon: theme key (data-cds-theme)
 */
export function readOfficialComputedTokens(
  system: "salt" | "carbon" | "m3" | "fluent",
  varNames: string[],
  themeMode: string,
): Record<string, string> {
  if (typeof document === "undefined") return {};
  const probe = document.createElement("div");
  /* For M3/Fluent light mode we need a `.builder-light` ancestor so the
     `.builder-light .preview-<ds>` override resolves; we mount the probe inside
     a host element that carries it. `host` is what we append/remove. */
  let host: HTMLElement = probe;
  if (system === "salt") {
    // Self-scoped class from @salt-ds/theme/index.css. Density class supplies
    // the size/spacing tokens; medium is the canonical default.
    probe.className = "salt-theme salt-density-medium";
    probe.setAttribute("data-mode", themeMode === "dark" ? "dark" : "light");
  } else if (system === "carbon") {
    // Our scoped Carbon token block keys off [data-cds-theme].
    probe.className = "preview-carbon";
    probe.setAttribute("data-cds-theme", themeMode);
  } else {
    // M3 / Fluent: scoped under .preview-m3 / .preview-fluent (dark base) and
    // .builder-light .preview-<ds> (light). Wrap in a .builder-light host for
    // the light probe so the descendant override resolves.
    probe.className = system === "m3" ? "preview-m3" : "preview-fluent";
    if (themeMode === "light") {
      host = document.createElement("div");
      host.className = "builder-light";
      host.appendChild(probe);
    }
  }
  host.style.position = "absolute";
  host.style.left = "-99999px";
  host.style.width = "0";
  host.style.height = "0";
  host.style.pointerEvents = "none";
  document.body.appendChild(host);
  const cs = getComputedStyle(probe);
  const out: Record<string, string> = {};
  for (const name of varNames) {
    out[name] = cs.getPropertyValue(name).trim();
  }
  document.body.removeChild(host);
  return out;
}
