import { createRequire } from "module";
import designHubPlugin from "./.eslint/plugin.mjs";

const require = createRequire(import.meta.url);

/* eslint-config-next 16 ships flat-config arrays at each entry point.
   Importing them via require() keeps the return value intact (the FlatCompat
   wrapper we used before threw a "Converting circular structure to JSON"
   error because it tried to legacy-validate already-flat configs). */
const nextCoreWebVitals = require("eslint-config-next/core-web-vitals");
const nextTypescript = require("eslint-config-next/typescript");

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      /* Pre-existing tech-debt rules — downgraded to `warn` so editor
         surfaces findings but CI doesn't block on them. Cleanup tracked
         in a separate hygiene PR. Individual files can flip back to
         `error` as they're cleaned. */
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "react/no-unescaped-entities": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/globals": "warn",
    },
  },
  {
    // Relax rules for untyped JSX reference files
    files: ["src/data/**/*.jsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    /* jsx-modules.d.ts intentionally uses `any` for untyped .jsx imports —
       the glob `declare module '*.jsx'` can't express per-module types, and
       this file is Design Hub's typed boundary to the untyped reference
       files. Not a candidate for strict typing. */
    files: ["src/types/jsx-modules.d.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    /* Test files and exporter / history files have pre-existing unused
       imports kept as API surface placeholders. Downgrade to warning so
       they surface in the editor but don't block CI. Cleanup tracked as
       separate hygiene PR. */
    files: [
      "src/lib/__tests__/**/*.{ts,tsx}",
      "src/lib/export/**/*.{ts,tsx}",
      "src/store/useBuilderHistory.ts",
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  /* design-hub/no-hardcoded-tokens — token-migration guardrail.
     Severity posture after P6 (2026-04-22):
       - warn  for src/data/**\/*.{ts,tsx,jsx} (existing files with
         pre-migration literals — CI catches NEW literals via the
         tokens-audit baseline diff, not via ESLint errors)
       - off   for src/data/**\/tokens.ts (token-definition files)
       - error for src/data/_shared/** (canonical shared layer —
         must never contain raw values)
     See docs/TOKENS.md § Enforcement posture. */
  {
    files: ["src/data/**/*.{ts,tsx,jsx}"],
    plugins: { "design-hub": designHubPlugin },
    rules: {
      "design-hub/no-hardcoded-tokens": "warn",
    },
  },
  {
    files: ["src/data/_shared/**/*.{ts,tsx}"],
    rules: {
      "design-hub/no-hardcoded-tokens": "error",
    },
  },
  {
    /* Token-definition files are the sole legal home for raw ms / px /
       rgba values — consumers must reference them via CSS vars. See
       docs/TOKENS.md § Intentional literals. */
    files: [
      "src/data/**/tokens.ts",
      "src/data/_shared/brand.ts",
      "src/data/_shared/primitives.ts",
    ],
    rules: {
      "design-hub/no-hardcoded-tokens": "off",
    },
  },
  {
    /* Skip linting the multi-megabyte string-constant snippet data files.
       They are literal `{ react: "...", html: "..." }` maps with no logic;
       feeding them to the TS parser stalls eslint for minutes without
       yielding actionable findings. */
    ignores: ["src/data/**/code-snippets.ts"],
  },
];

export default eslintConfig;
