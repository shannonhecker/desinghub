"use client";

/**
 * CarbonScopeStyles (W6-P2b) — lazy-loads the build-time-scoped Carbon
 * stylesheet ONCE, the first time a real Carbon component is rendered.
 *
 * WHY not a static import: @carbon/styles is a ~950 KB GLOBAL sheet with an
 * Eric-Meyer reset + `:root` token blocks that would clobber Design Hub's
 * chrome if imported app-wide. scripts/generate-carbon-scoped-css.mjs prefixes
 * every selector with `.carbon-live-scope` and writes the result to
 * public/carbon-scoped.css; this component loads it the first time it mounts,
 * so the heavy CSS only loads when Carbon is actually on screen.
 *
 * WHY fetched and injected as <style>, not a <link>: the sheet carries
 * Carbon's own @font-face rules, which point at IBM's CDN. The site's content
 * security policy blocks that host, so every face logged a CSP violation as
 * soon as a real Carbon component rendered (120 blocked requests on the UI
 * kit). The app already self-hosts IBM Plex through its font loader, so the
 * @font-face blocks are dropped here and Carbon's text uses the same typeface
 * from the app (see kit-chrome.css). Nothing else in the sheet changes.
 *
 * IDEMPOTENT + SSR-SAFE: a module-level flag + a marker check guarantee a
 * single injection even across many CarbonReal subtrees. It runs in an effect
 * (client only), so SSR never emits it and there's no hydration mismatch.
 * Renders nothing.
 */

import { useEffect } from "react";

const HREF = "/carbon-scoped.css";
const MARKER = "data-carbon-scope";

/* Module-level guard so repeated mounts don't re-query the DOM every time. */
let injected = false;

/** Remove every @font-face block (they contain no nested braces). */
export function stripFontFaces(css: string): string {
  return css.replace(/@font-face\s*\{[^}]*\}/g, "");
}

function injectOnce(): void {
  if (injected || typeof document === "undefined") return;
  injected = true;
  /* Belt-and-suspenders: also skip if it is already in the DOM (e.g. a prior
     session in the same document, or fast-refresh re-eval of this module). */
  if (document.querySelector(`[${MARKER}]`)) return;
  const style = document.createElement("style");
  style.setAttribute(MARKER, "true");
  document.head.appendChild(style);
  fetch(HREF)
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`carbon-scoped.css ${r.status}`))))
    .then((css) => { style.textContent = stripFontFaces(css); })
    .catch(() => {
      /* Offline or blocked: let a later mount try again. */
      style.remove();
      injected = false;
    });
}

export function CarbonScopeStyles(): null {
  useEffect(() => {
    injectOnce();
  }, []);
  return null;
}
