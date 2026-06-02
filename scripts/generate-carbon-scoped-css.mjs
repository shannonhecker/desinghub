#!/usr/bin/env node
/**
 * generate-carbon-scoped-css — build-time scoper for @carbon/styles.
 *
 * WHY: @carbon/react components need @carbon/styles' ~950 KB global stylesheet.
 * That sheet opens with an Eric-Meyer-style reset (`html, body, div, span, …`),
 * a `*, *::before, *::after { box-sizing: inherit }` rule, and several `:root`
 * token blocks. Loaded globally those would clobber Design Hub's own chrome.
 * So we PREFIX every selector with `.carbon-live-scope`, neutralise the global
 * `html`/`body` reset, and commit the result to public/carbon-scoped.css — then
 * lazy-load it only when a real Carbon component is actually rendered
 * (CarbonScopeStyles.tsx).
 *
 * APPROACH: postcss AST walk (robust where regex is fragile on the leading
 * combined reset + nested at-rules). For each rule:
 *   - `:root`                       -> `.carbon-live-scope`         (tokens land
 *                                       on the wrapper so --cds-* resolve inside)
 *   - bare `html`                   -> `.carbon-live-scope`         (its box-sizing
 *                                       / font-size now anchor the scope, which is
 *                                       what `box-sizing: inherit` chains to)
 *   - bare `body`                   -> dropped from a combined list, or mapped to
 *                                       `.carbon-live-scope` when standalone (so
 *                                       Carbon's body bg/color theming still works
 *                                       inside the scope, never on the app <body>)
 *   - every other selector `X`      -> `.carbon-live-scope X`
 *   - `*` / `*::before`             -> `.carbon-live-scope *` / `… *::before`
 *
 * LOCKED DECISION (#5): @keyframes / @font-face at-rules are left GLOBAL (their
 * names are --cds- / IBM-Plex prefixed, harmless). @media / @supports / @layer
 * KEEP their at-rule params global but have their INNER selectors prefixed
 * (recursively). Shadow DOM / iframe are explicitly NOT used (DnD-kit needs a
 * single document). See task brief + memory.
 *
 * USAGE:  node scripts/generate-carbon-scoped-css.mjs
 *   reads  node_modules/@carbon/styles/css/styles.css
 *   writes public/carbon-scoped.css  (committed)
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const postcss = require("postcss");

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const SCOPE = ".carbon-live-scope";

/* Atom-level reset selectors that target the document root. When they appear in
   a combined selector list they're stripped (so the reset only ever affects
   inside the scope); when standalone they're remapped to the scope itself. */
const ROOT_LEVEL = new Set(["html", "body", ":root"]);

/* At-rules whose INNER rules should be scoped but whose params stay global. */
const SCOPE_INNER_ATRULES = new Set(["media", "supports", "layer", "container", "scope", "starting-style"]);

/* At-rules left fully global per the locked decision (no inner selectors to
   scope, or names are namespaced + harmless). */
const GLOBAL_ATRULES = new Set(["keyframes", "font-face", "charset", "import", "namespace", "page", "property", "counter-style", "font-feature-values"]);

/**
 * Prefix one comma-separated selector list with SCOPE.
 *  - `:root` / `html` -> SCOPE (the wrapper becomes the document-root anchor)
 *  - `body`           -> SCOPE  (Carbon's body theming applies to the wrapper)
 *  - anything else    -> `SCOPE <sel>` (descendant)
 * In a COMBINED list (e.g. the Meyer reset `html, body, div, …`) the root-level
 * atoms are dropped so the reset only ever touches descendants of the scope and
 * never the real document <html>/<body>.
 */
function scopeSelectorList(selectorList) {
  const parts = selectorList
    .split(",")
    .map((sel) => sel.trim())
    .filter(Boolean);
  const isCombined = parts.length > 1;

  const out = [];
  for (const sel of parts) {
    if (sel === ":root" || sel === "html") {
      out.push(SCOPE);
    } else if (sel === "body") {
      // Standalone `body` -> scope; inside a big reset list, drop it entirely.
      if (!isCombined) out.push(SCOPE);
    } else if (ROOT_LEVEL.has(sel)) {
      if (!isCombined) out.push(`${SCOPE} ${sel}`);
    } else {
      out.push(`${SCOPE} ${sel}`);
    }
  }
  // Defensive: never emit an empty selector (would be a global rule).
  return out.length ? out.join(", ") : `${SCOPE}`;
}

/** Recursively prefix every selector under a node (root or at-rule body). */
function scopeContainer(container) {
  container.each((node) => {
    if (node.type === "rule") {
      node.selector = scopeSelectorList(node.selector);
    } else if (node.type === "atrule") {
      const name = node.name.toLowerCase();
      if (GLOBAL_ATRULES.has(name)) {
        // Leave fully global (keyframes/font-face/etc).
        return;
      }
      if (SCOPE_INNER_ATRULES.has(name)) {
        // Keep @media/@supports/… params, scope the inner rules.
        scopeContainer(node);
        return;
      }
      // Unknown at-rule with a body: scope its inner rules to be safe.
      if (node.nodes) scopeContainer(node);
    }
  });
}

async function main() {
  const carbonCssPath = require.resolve("@carbon/styles/css/styles.css");
  const css = await readFile(carbonCssPath, "utf8");

  const root = postcss.parse(css);
  scopeContainer(root);

  const banner =
    "/*\n" +
    " * carbon-scoped.css — GENERATED, DO NOT EDIT BY HAND.\n" +
    " * Source: @carbon/styles/css/styles.css, every selector prefixed with\n" +
    " * `.carbon-live-scope` so the ~950 KB Carbon global reset can never leak\n" +
    " * onto Design Hub's own chrome. Regenerate with:\n" +
    " *   node scripts/generate-carbon-scoped-css.mjs\n" +
    " * @keyframes / @font-face are intentionally left global (locked decision\n" +
    " * #5 — names are --cds-/IBM-Plex prefixed and harmless).\n" +
    " */\n";

  const result = root.toResult();
  const outPath = resolve(repoRoot, "public", "carbon-scoped.css");
  await writeFile(outPath, banner + result.css, "utf8");

  // Sanity report.
  const sizeKB = Math.round(Buffer.byteLength(banner + result.css) / 1024);
  console.log(`carbon-scoped.css written (${sizeKB} KB) from ${carbonCssPath}`);
}

main().catch((err) => {
  console.error("generate-carbon-scoped-css failed:", err);
  process.exit(1);
});
