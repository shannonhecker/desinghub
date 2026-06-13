"use client";

/* ══════════════════════════════════════════════════════════
   SharedPreview — read-only renderer for /preview/share/[hash].
   ══════════════════════════════════════════════════════════
   PR-E: unified onto the PresentStage shell (finishing "unify all
   preview surfaces" — PR-D did the pop-out). The server route decodes
   the hash and passes `state`; here we hydrate the builder store ONCE,
   synchronously (before first paint), so PresentStage — which reads the
   store — renders the canvas already populated (no empty flash). Then
   render PresentStage in the "recipient" variant: Edit + Home,
   no editor exit, and no DS switcher (author's DS only, Decision #5).

   The route stays stateless (server decodes, client renders); the
   global Zustand store is fresh on this page load, so hydrating it is
   safe — no collision with an editor session. */

import { useRef } from "react";
import type { SharedCanvas } from "@/lib/shareState";
import { useBuilder } from "@/store/useBuilder";
import { PresentStage } from "./PresentStage";
import "./builder.css";

export function SharedPreview({ state, hash }: { state: SharedCanvas; hash: string }) {
  /* Hydrate the builder store from the decoded `state` SYNCHRONOUSLY during
     render (before PresentStage first reads it → no empty flash), guarded by
     a ref keyed on `hash`. This runs exactly once per distinct share link:
     same-route re-renders skip it (ref unchanged), Strict Mode's double-
     invoke is guarded, and navigating to a DIFFERENT share link re-hydrates
     (new hash). Render-phase store init is safe here — the only store
     subscriber on this route is PresentStage, rendered AFTER this block, so
     there is no mid-render update of an already-rendered component.
     Order matters: themeKey LAST, after setMode — setMode derives a
     dialect-specific default themeKey that the explicit one must override
     (null = legacy link with no themeKey → keep setMode's default). */
  const hydratedHash = useRef<string | null>(null);
  if (hydratedHash.current !== hash) {
    hydratedHash.current = hash;
    const store = useBuilder.getState();
    store.setDesignSystem(state.designSystem);
    store.setMode(state.mode);
    store.setDensity(state.density);
    store.setCanvasSpacing(state.canvasSpacing);
    store.setHeaderBlocks(state.headerBlocks);
    store.setSidebarBlocks(state.sidebarBlocks);
    store.setBlocks(state.blocks);
    store.setFooterBlocks(state.footerBlocks);
    store.setDeviceMode(state.deviceMode);
    if (state.themeKey) store.setThemeKey(state.themeKey);
    /* v:2 multi-page: hydrate the page set + active page so the recipient can
       navigate between tabs. `state.blocks` already holds the active page body
       (setBlocks above); also seed zoneLayouts.body from the active page's
       bodyLayout so the FIRST paint uses the author's per-page layout (not the
       recipient's default grid) — otherwise it would only correct itself after
       a tab switch. v:1 links omit these → single page. */
    if (state.pages && state.activePageId) {
      const activePage = state.pages.find((p) => p.id === state.activePageId);
      useBuilder.setState({
        pages: state.pages,
        activePageId: state.activePageId,
        ...(activePage?.bodyLayout
          ? { zoneLayouts: { ...useBuilder.getState().zoneLayouts, body: activePage.bodyLayout } }
          : {}),
      });
    }
  }

  return <PresentStage barVariant="recipient" sharedHash={hash} />;
}
