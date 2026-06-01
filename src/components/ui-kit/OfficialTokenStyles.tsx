"use client";

import React from "react";
import { buildCarbonTokenCSS } from "@/lib/officialTokens";
import { buildM3TokenCSS, buildFluentTokenCSS } from "@/lib/officialM3FluentTokens";

/**
 * Injects the OFFICIAL token VALUES for the three external DSs whose tokens we
 * surface as scoped CSS custom properties rather than via their (heavy) runtime
 * providers:
 *
 *   - Carbon → `--cds-*` from `@carbon/themes`, scoped to
 *     `.preview-carbon[data-cds-theme=…]` (PR-2a).
 *   - M3     → `--mui-*` from `@mui/material`'s CSS-variables theme, scoped to
 *     `.preview-m3` (dark base) / `.builder-light .preview-m3` (PR-2b).
 *   - Fluent → `--color*` / `--fontFamily*` from `@fluentui/react-theme`'s
 *     `web{Light,Dark}Theme`, scoped to `.preview-fluent` (PR-2b).
 *
 * This is the leak-safe alternative to importing each DS's global stylesheet or
 * mounting its provider: we emit ONLY custom properties, every selector
 * namespaced to an opt-in `.preview-<ds>` class, so they cannot restyle the rest
 * of the app or any other route. The bridges in builder.css
 * (`.preview-<ds> { --ds-*: var(--official-var, facsimile) }`) then read these
 * genuine official values, with facsimile literals as last-resort fallbacks.
 *
 * All three strings are built once at module load (token values are static per
 * release) by pure functions over static token data — no DOM, no emotion /
 * griffel runtime, no provider — so this is SSR-safe even though it lives in a
 * "use client" component.
 */
const CARBON_TOKEN_CSS = buildCarbonTokenCSS();
const M3_TOKEN_CSS = buildM3TokenCSS();
const FLUENT_TOKEN_CSS = buildFluentTokenCSS();

export function OfficialTokenStyles() {
  return (
    <>
      <style data-official-tokens="carbon" dangerouslySetInnerHTML={{ __html: CARBON_TOKEN_CSS }} />
      <style data-official-tokens="m3" dangerouslySetInnerHTML={{ __html: M3_TOKEN_CSS }} />
      <style data-official-tokens="fluent" dangerouslySetInnerHTML={{ __html: FLUENT_TOKEN_CSS }} />
    </>
  );
}
