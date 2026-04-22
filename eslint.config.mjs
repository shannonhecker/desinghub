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
      // Explicit any requires an eslint-disable comment (already used sparingly)
      "@typescript-eslint/no-explicit-any": "error",
      // Catch unused vars (prefix _ to ignore)
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // Relax rules for untyped JSX reference files
    files: ["src/data/**/*.jsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  /* design-hub/no-hardcoded-tokens — P0 token-migration guardrail.
     Severity is `warn` during P0→P5; flips to `error` per-DS as each
     phase lands, and globally at P6. See docs/TOKENS.md. */
  {
    files: ["src/data/**/*.{ts,tsx,jsx}"],
    plugins: { "design-hub": designHubPlugin },
    rules: {
      "design-hub/no-hardcoded-tokens": "warn",
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
