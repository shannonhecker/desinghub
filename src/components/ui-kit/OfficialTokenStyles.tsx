"use client";

import React from "react";
import { buildCarbonTokenCSS } from "@/lib/officialTokens";

/**
 * Injects the OFFICIAL Carbon `--cds-*` token values (from @carbon/themes),
 * scoped under `.preview-carbon[data-cds-theme=…]`. This is the leak-safe
 * alternative to importing `@carbon/styles/css/styles.css`, which is a 950 KB
 * global build (html/body/* reset + component CSS) that would restyle the
 * whole app. We emit ONLY custom properties, namespaced to an opt-in class —
 * the Token Reference's off-screen probe is currently the only consumer.
 *
 * Built once at module load (token values are static per release).
 */
const CARBON_TOKEN_CSS = buildCarbonTokenCSS();

export function OfficialTokenStyles() {
  return <style data-official-tokens="carbon" dangerouslySetInnerHTML={{ __html: CARBON_TOKEN_CSS }} />;
}
