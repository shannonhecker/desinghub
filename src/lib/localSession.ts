/**
 * localSession - the pure build / restore pair for the local-first
 * (localStorage) session path.
 *
 * useLocalAutoSave writes through `buildLocalSessionSnapshot`; the
 * SessionsDrawer restores through `restoreLocalSession`. Keeping both
 * halves in one module means the local path can never silently drift from
 * what the cloud path (`firebase.ts` buildProjectSnapshot / loadProject)
 * persists - which is exactly what happened with multi-page canvases:
 * `pages` was a tracked autosave key, so page edits armed the debounce,
 * but the local snapshot never wrote or restored them and every extra page
 * was lost on reload with Firebase unconfigured (the default deployment).
 *
 * Lazy-additive multi-page (owner decision 2026-06-07): single-page
 * canvases stay byte-identical to the legacy snapshot shape; only canvases
 * with >1 page gain `pages` / `activePageId`.
 */

import { useBuilder, flushActiveBody, isMultiPage } from "@/store/useBuilder";
import type { LocalSessionSnapshot } from "@/store/useSessionStore";
import { migrateBlocks } from "./blockMigrations";
import { pagesRestoreFromSnapshot } from "./firebase";

type BuilderStateSnapshot = ReturnType<typeof useBuilder.getState>;

/** Pure: build the localStorage snapshot from the current store state.
 *  Mirrors firebase.buildProjectSnapshot field-for-field. */
export function buildLocalSessionSnapshot(s: BuilderStateSnapshot): LocalSessionSnapshot {
  const snapshot: LocalSessionSnapshot = {
    messages: s.messages,
    blocks: s.blocks,
    headerBlocks: s.headerBlocks,
    sidebarBlocks: s.sidebarBlocks,
    footerBlocks: s.footerBlocks,
    zoneLayouts: s.zoneLayouts,
    designSystem: s.designSystem,
    mode: s.mode,
    density: s.density,
    interfaceType: s.interfaceType,
    selectedComponents: s.selectedComponents,
    colorOverrides: s.colorOverrides,
    activeTemplateId: s.activeTemplateId,
  };
  /* flushActiveBody syncs the live `blocks` mirror into the active page so
     an in-progress page edit is never lost to a stale copy. */
  const flushed = flushActiveBody(s);
  if (isMultiPage(flushed.pages)) {
    snapshot.pages = flushed.pages;
    snapshot.activePageId = flushed.activePageId;
    /* Legacy `blocks` mirrors the active page body so an older reader (or a
       single-page restore) still renders the right page. */
    snapshot.blocks =
      flushed.pages.find((p) => p.id === flushed.activePageId)?.body ?? s.blocks;
  }
  return snapshot;
}

export interface RestorableLocalSession {
  id: string;
  name: string;
  /** Epoch ms of the last save; becomes `lastSavedAt`. */
  updatedAt: number;
  snapshot: LocalSessionSnapshot;
}

/** Restore a local snapshot into the builder store. Mirrors
 *  firebase.loadProject's field set so local + cloud loads behave
 *  identically. Defensive against legacy / partial snapshots: every
 *  nullable field is defaulted and a throw leaves the current canvas
 *  untouched, surfacing the failure via the save indicator instead. */
export function restoreLocalSession(session: RestorableLocalSession): boolean {
  try {
    const snap = session.snapshot;
    const colorOverrides = snap.colorOverrides ?? {};
    /* Multi-page restore: >1 page restores pages + active page; a legacy
       single-page snapshot resets to the lazy empty state so a prior
       multi-page session can't leak stale pages into this one. */
    const pagesRestore = pagesRestoreFromSnapshot(snap, migrateBlocks);
    const restoredActiveBody = pagesRestore?.pages.find(
      (p) => p.id === pagesRestore.activePageId,
    )?.body;
    useBuilder.setState({
      messages: snap.messages ?? [],
      blocks: restoredActiveBody ?? migrateBlocks(snap.blocks ?? []),
      headerBlocks: migrateBlocks(snap.headerBlocks ?? []),
      sidebarBlocks: migrateBlocks(snap.sidebarBlocks ?? []),
      footerBlocks: migrateBlocks(snap.footerBlocks ?? []),
      pages: pagesRestore?.pages ?? [],
      activePageId: pagesRestore?.activePageId ?? null,
      ...(snap.zoneLayouts ? { zoneLayouts: snap.zoneLayouts } : {}),
      designSystem: snap.designSystem,
      mode: snap.mode,
      density: snap.density,
      interfaceType: snap.interfaceType,
      selectedComponents: snap.selectedComponents ?? [],
      colorOverrides,
      activeTemplateId: snap.activeTemplateId ?? null,
      hasOverrides: Object.keys(colorOverrides).length > 0,
      onboardingStep: "ready",
      currentSessionId: session.id,
      sessionTitle: session.name,
      lastSavedAt: session.updatedAt,
      saveState: "saved",
      saveError: null,
      sessionsDrawerOpen: false,
      templatesDrawerOpen: false,
      pendingTemplateId: null,
      pendingFirstMessage: null,
      selectedBlockId: null,
      selectedBlockZone: null,
      selectedBlockIds: [],
      previewOpen: true,
    });
    return true;
  } catch (e) {
    console.error("restoreLocalSession failed:", e);
    useBuilder.setState({
      saveState: "error",
      saveError: "Couldn't open that session. It may be from an older version.",
      sessionsDrawerOpen: false,
    });
    return false;
  }
}
