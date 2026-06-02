"use client";

/**
 * CarbonScopeStyles (W6-P2b) — lazy-loads the build-time-scoped Carbon
 * stylesheet ONCE, the first time a real Carbon component is rendered.
 *
 * WHY a <link>, not a static import: @carbon/styles is a ~950 KB GLOBAL sheet
 * with an Eric-Meyer reset + `:root` token blocks that would clobber Design
 * Hub's chrome if imported app-wide. scripts/generate-carbon-scoped-css.mjs
 * prefixes every selector with `.carbon-live-scope` and writes the result to
 * public/carbon-scoped.css; this component injects a <link rel="stylesheet"
 * href="/carbon-scoped.css"> into <head> the first time it mounts, so the heavy
 * CSS only loads when Carbon is actually on screen (the UI Kit gallery or a
 * read-only builder preview). It never loads on pages that don't render Carbon.
 *
 * IDEMPOTENT + SSR-SAFE: a module-level flag + a `link[data-carbon-scope]`
 * existence check guarantee a single injection even across many CarbonReal
 * subtrees. It runs in an effect (client only), so SSR never emits the link and
 * there's no hydration mismatch. Renders nothing.
 */

import { useEffect } from "react";

const HREF = "/carbon-scoped.css";
const MARKER = "data-carbon-scope";

/* Module-level guard so repeated mounts don't re-query the DOM every time. */
let injected = false;

function injectOnce(): void {
  if (injected || typeof document === "undefined") return;
  injected = true;
  /* Belt-and-suspenders: also skip if the link is already in the DOM (e.g. a
     prior session in the same document, or fast-refresh re-eval of this
     module). */
  if (document.querySelector(`link[${MARKER}]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = HREF;
  link.setAttribute(MARKER, "true");
  document.head.appendChild(link);
}

export function CarbonScopeStyles(): null {
  useEffect(() => {
    injectOnce();
  }, []);
  return null;
}
