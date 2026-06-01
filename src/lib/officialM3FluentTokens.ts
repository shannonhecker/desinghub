/**
 * Official M3 (Material UI) + Fluent 2 token plumbing (#9 PR-2b).
 *
 * Completes the official-token story for the remaining two external DSs that
 * ship runtime providers rather than a plain CSS-var stylesheet:
 *
 *   - M3  → `@mui/material` exposes its design tokens as `--mui-*` CSS custom
 *           properties through the CSS-variables theme (`extendTheme` +
 *           `CssVarsProvider`). We read the GENUINE published values via
 *           `extendTheme().generateStyleSheets()` and re-emit them as a static
 *           stylesheet SCOPED to `.preview-m3` only (no `:root`, no global).
 *   - Fluent → `@fluentui/react-components`'s `FluentProvider` injects
 *           `--color*` / `--fontFamily*` / `--borderRadius*` vars on its root.
 *           Rather than mount the heavy griffel/SSR provider (hydration risk),
 *           we read the OFFICIAL token VALUES from `@fluentui/react-theme`
 *           (`webLightTheme` / `webDarkTheme` — the token-only package, no React
 *           components, no CSS-in-JS runtime) and emit `--<token>` vars SCOPED
 *           to `.preview-fluent` only.
 *
 * SSR/LEAK-SAFETY CONTRACT (mirrors PR-2a's Carbon approach):
 *   - Both generators run as PURE FUNCTIONS over static token data — no DOM,
 *     no emotion/griffel runtime, no provider mount. Safe to evaluate at module
 *     load on the server (verified: both source packages `require()` cleanly in
 *     plain Node). The output is a string injected via a client-only
 *     `<style>` (OfficialTokenStyles), exactly like buildCarbonTokenCSS().
 *   - EVERY selector is namespaced to `.preview-m3` / `.preview-fluent`. The
 *     MUI sheets (which the package emits at `:root` / `.dark`) are rewritten to
 *     the preview scope; nothing reaches `:root`. The Fluent vars are emitted
 *     ONLY under `.preview-fluent`. So neither `--mui-*` nor `--color*` can leak
 *     onto Salt/Carbon/uoaui or any other route — they only resolve inside an
 *     element that opts in with `.preview-m3` / `.preview-fluent`.
 *   - Builder convention: DARK is the base (`.preview-<ds>`), light is the
 *     `.builder-light .preview-<ds>` override. We map MUI's dark colorScheme to
 *     the base scope and its light scheme to `.builder-light`, matching the
 *     existing facsimile blocks in builder.css.
 */

import { extendTheme } from "@mui/material/styles";
import { webLightTheme, webDarkTheme } from "@fluentui/react-theme";

/* ────────────────────────────────────────────────────────────────────────
 * M3 — @mui/material `--mui-*` official tokens, scoped to .preview-m3
 * ──────────────────────────────────────────────────────────────────────── */

/** camelCase → kebab is NOT applied: MUI var names keep their original casing
 *  (e.g. `--mui-palette-primary-contrastText`). We pass them through verbatim
 *  from `generateStyleSheets()` so they match what `CssVarsProvider` emits and
 *  what the bridge in builder.css references. */
type MuiSheet = Record<string, Record<string, string | number>>;

/**
 * Serialize a decl map to CSS, keeping ONLY `--mui-*` custom properties. MUI's
 * `generateStyleSheets()` also emits a `colorScheme` declaration (the UA
 * `color-scheme` hint, in CSS-in-JS camelCase); we drop it so the output is
 * pure custom properties — it isn't part of the `--ds-*` token contract and
 * leaving it as raw `colorScheme:dark` would be invalid CSS on the wrapper.
 */
function declsToCss(decls: Record<string, string | number>): string {
  return Object.entries(decls)
    .filter(([name]) => name.startsWith("--mui-"))
    .map(([name, value]) => `${name}:${value};`)
    .join("");
}

/**
 * Build the scoped, leak-proof MUI `--mui-*` token stylesheet. Reads the
 * official Material UI CSS-variables theme and re-scopes its generated sheets
 * to `.preview-m3` (dark base) / `.builder-light .preview-m3` (light override).
 *
 * MUI's `generateStyleSheets()` returns, in order:
 *   [0] `:root`          → prefix-agnostic base vars (shape, etc.)
 *   [1] `:root, .light`  → light colorScheme palette
 *   [2] `.dark`          → dark colorScheme palette
 * We rewrite [0]+[1] under `.builder-light .preview-m3` (light) and [0]+[2]
 * under `.preview-m3` (dark = builder base) so the base/override convention
 * matches the rest of builder.css. The base (`:root`) decls go into BOTH so
 * shape/radius resolve in either mode.
 */
export function buildM3TokenCSS(): string {
  const theme = extendTheme({
    cssVarPrefix: "mui",
    colorSchemeSelector: "class",
    colorSchemes: { light: true, dark: true },
  });
  const sheets = theme.generateStyleSheets() as unknown as MuiSheet[];

  const baseDecls: Record<string, string | number> = {};
  const lightDecls: Record<string, string | number> = {};
  const darkDecls: Record<string, string | number> = {};

  for (const sheet of sheets) {
    for (const [selector, decls] of Object.entries(sheet)) {
      if (selector === ":root") Object.assign(baseDecls, decls);
      else if (selector.includes(".light")) Object.assign(lightDecls, decls);
      else if (selector.includes(".dark")) Object.assign(darkDecls, decls);
    }
  }

  /* Dark = builder base; light = .builder-light override. Base (shape) vars
     are merged into both so e.g. --mui-shape-borderRadius always resolves. */
  const darkCss = declsToCss({ ...baseDecls, ...darkDecls });
  const lightCss = declsToCss({ ...baseDecls, ...lightDecls });

  return [
    `.preview-m3{${darkCss}}`,
    `.builder-light .preview-m3{${lightCss}}`,
  ].join("\n");
}

/* ────────────────────────────────────────────────────────────────────────
 * Fluent 2 — @fluentui/react-theme `--<token>` official tokens, scoped to
 * .preview-fluent
 * ──────────────────────────────────────────────────────────────────────── */

/** FluentProvider emits each theme token as a CSS var named `--<tokenKey>`
 *  (e.g. `colorBrandBackground` → `--colorBrandBackground`). We mirror that
 *  exact mapping. Only string-valued tokens are emittable as CSS vars. */
function fluentThemeToDecls(theme: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(theme)) {
    if (typeof value === "string" && value.length > 0) {
      parts.push(`--${key}:${value};`);
    }
  }
  return parts.join("");
}

/**
 * Build the scoped, leak-proof Fluent `--color*` / `--fontFamily*` token
 * stylesheet from the OFFICIAL `@fluentui/react-theme` token objects. Dark =
 * builder base (`.preview-fluent`); light = `.builder-light .preview-fluent`.
 * Emits ONLY custom properties (no reset, no component CSS, no `:root`).
 */
export function buildFluentTokenCSS(): string {
  const darkCss = fluentThemeToDecls(webDarkTheme as unknown as Record<string, unknown>);
  const lightCss = fluentThemeToDecls(webLightTheme as unknown as Record<string, unknown>);
  return [
    `.preview-fluent{${darkCss}}`,
    `.builder-light .preview-fluent{${lightCss}}`,
  ].join("\n");
}
