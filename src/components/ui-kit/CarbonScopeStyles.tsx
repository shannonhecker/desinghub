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
 * TWO PATHS.
 *
 * Builder (default, no `kit`): a plain <link> to the sheet, exactly as on
 * main. The builder holds its geometry to the pixel across systems, so the
 * sheet it gets is Carbon's, untouched.
 *
 * Library (`kit` prop, or anywhere under <CarbonKitScope>): the sheet is
 * fetched and injected as a <style>. The sheet carries Carbon's own
 * @font-face rules, which point at IBM's CDN; the site's content security
 * policy blocks that host, so every face logged a CSP violation as soon as a
 * real Carbon component rendered (120 blocked requests on the UI kit). The
 * library drops those blocks and lets Carbon's font-family rules read two
 * custom properties (--kit-carbon-sans / --kit-carbon-mono) that only the
 * library shell defines (kit-chrome.css), with Carbon's own family as the
 * fallback. Inside the library Carbon text uses the app's self-hosted IBM
 * Plex; anywhere else the properties are unset and each rule computes to
 * exactly what Carbon wrote. Nothing else in the sheet changes.
 *
 * IDEMPOTENT + SSR-SAFE: a module-level flag + a marker check per path
 * guarantee a single injection even across many CarbonReal subtrees. It runs
 * in an effect (client only), so SSR never emits it and there's no hydration
 * mismatch. Renders nothing.
 */

import React, { useEffect } from "react";

const HREF = "/carbon-scoped.css";
const MARKER = "data-carbon-scope";
const KIT_MARKER = "data-carbon-scope-kit";

/* Module-level guards so repeated mounts don't re-query the DOM every time. */
let injected = false;
let kitInjected = false;

/* ── Builder path: main's loader, unchanged. ── */
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

/**
 * Library path. Remove every @font-face block (they contain no nested
 * braces) and let Carbon's own font-family declarations read a custom
 * property first, falling back to the family Carbon names. Sans stays sans
 * and mono stays mono; the rest of each family list is kept as written.
 */
export function stripFontFaces(css: string): string {
  return css
    .replace(/@font-face\s*\{[^}]*\}/g, "")
    .replace(/font-family:\s*'IBM Plex Sans'/g, "font-family: var(--kit-carbon-sans, 'IBM Plex Sans')")
    .replace(/font-family:\s*'IBM Plex Mono'/g, "font-family: var(--kit-carbon-mono, 'IBM Plex Mono')");
}

function injectKitOnce(): void {
  if (kitInjected || typeof document === "undefined") return;
  kitInjected = true;
  if (document.querySelector(`style[${KIT_MARKER}]`)) return;
  const style = document.createElement("style");
  style.setAttribute(KIT_MARKER, "true");
  document.head.appendChild(style);
  fetch(HREF)
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`carbon-scoped.css ${r.status}`))))
    .then((css) => { style.textContent = stripFontFaces(css); })
    .catch(() => {
      /* Offline or blocked: let a later mount try again. */
      style.remove();
      kitInjected = false;
    });
}

const CarbonKitContext = React.createContext(false);

/** Wraps the library shell: every Carbon sheet request below it takes the
    library path. The builder never mounts this. */
export function CarbonKitScope({ children }: { children: React.ReactNode }): React.ReactElement {
  return <CarbonKitContext.Provider value={true}>{children}</CarbonKitContext.Provider>;
}

export function CarbonScopeStyles({ kit = false }: { kit?: boolean } = {}): null {
  const inKit = React.useContext(CarbonKitContext) || kit;
  useEffect(() => {
    if (inKit) injectKitOnce();
    else injectOnce();
  }, [inKit]);
  return null;
}
