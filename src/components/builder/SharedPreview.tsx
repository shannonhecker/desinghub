"use client";

/* ══════════════════════════════════════════════════════════
   SharedPreview — read-only renderer for /preview/share/[hash].
   ══════════════════════════════════════════════════════════
   PR-E: unified onto the PresentStage shell (finishing "unify all
   preview surfaces" — PR-D did the pop-out). The server route decodes
   the hash and passes `state`; here we hydrate the builder store ONCE,
   synchronously (before first paint), so PresentStage — which reads the
   store — renders the canvas already populated (no empty flash). Then
   render PresentStage in the "recipient" variant: Fork-and-edit + Home,
   no editor exit, and no DS switcher (author's DS only, Decision #5).

   The route stays stateless (server decodes, client renders); the
   global Zustand store is fresh on this page load, so hydrating it is
   safe — no collision with an editor session. */

import { useMemo } from "react";
import type { SharedCanvas } from "@/lib/shareState";
import { useBuilder } from "@/store/useBuilder";
import { PresentStage } from "./PresentStage";
import "./builder.css";

export function SharedPreview({ state, hash }: { state: SharedCanvas; hash: string }) {
  /* One-shot SYNCHRONOUS hydration (useMemo, not useEffect) so the store
     is populated BEFORE PresentStage first reads it — avoids the empty
     flash a post-paint useEffect would cause. Idempotent (same values
     each run), so React Strict Mode's dev double-invoke is harmless.
     Order matters: themeKey LAST, after setMode — setMode derives a
     dialect-specific default themeKey that the explicit one must override
     (null = legacy link with no themeKey → keep setMode's default). */
  useMemo(() => {
    const store = useBuilder.getState();
    store.setDesignSystem(state.designSystem);
    store.setMode(state.mode);
    store.setDensity(state.density);
    store.setHeaderBlocks(state.headerBlocks);
    store.setSidebarBlocks(state.sidebarBlocks);
    store.setBlocks(state.blocks);
    store.setFooterBlocks(state.footerBlocks);
    store.setDeviceMode(state.deviceMode);
    if (state.themeKey) store.setThemeKey(state.themeKey);
  }, [state]);

  return <PresentStage barVariant="recipient" sharedHash={hash} />;
}
