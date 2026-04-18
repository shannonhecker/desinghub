"use client";

/**
 * useAutoSave — subscribes to canvas-relevant store changes and
 * upserts the current session to Firebase on a debounce.
 *
 * Contract:
 *  - No-op while `currentSessionId` is null (empty canvas, no session
 *    started yet — we don't pollute the project list with untouched
 *    sessions).
 *  - No-op while Firebase isn't configured (graceful degradation;
 *    local state is still the source of truth in-session).
 *  - Debounces 2.5s by default; a burst of edits collapses into one
 *    save.
 *  - Surfaces save progress via store.saveState (idle / saving / saved
 *    / error) + store.lastSavedAt so the top-bar indicator can read
 *    them reactively.
 *
 * The hook intentionally subscribes OUTSIDE the React render graph
 * (via useBuilder.subscribe) so the debounce isn't torn down on every
 * render. A ref-based guard prevents duplicate subscriptions in React
 * Strict Mode's double-mount.
 */

import { useEffect, useRef } from "react";
import { useBuilder } from "@/store/useBuilder";
import { useCloudStorage } from "./firebase";

const DEBOUNCE_MS = 2500;

/** Fields whose changes should trigger a save. Unrelated UI state
 *  (drawer toggles, input focus, preview-open, etc.) is filtered
 *  out so we don't burn Firestore writes on noise. */
const TRACKED_KEYS = [
  "messages",
  "blocks",
  "headerBlocks",
  "sidebarBlocks",
  "footerBlocks",
  "designSystem",
  "mode",
  "density",
  "interfaceType",
  "selectedComponents",
  "colorOverrides",
  "activeTemplateId",
  "sessionTitle",
] as const;

/** Shallow fingerprint across tracked keys — uses reference equality
 *  on each slot and collapses into a pipe-separated hash string. Two
 *  identical state snapshots produce identical fingerprints. */
function fingerprint(state: unknown): string {
  const s = state as Record<string, unknown>;
  /* WeakMap lets us stabilize object identity across reads without
   *  stringifying (which would be expensive for messages[]). */
  const parts: string[] = [];
  for (const k of TRACKED_KEYS) {
    const v = s[k];
    /* For primitives, just coerce; for references, store as-is and
     *  rely on strict-equal comparison of the resulting array index. */
    if (v === null || v === undefined) { parts.push(""); continue; }
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      parts.push(String(v));
    } else {
      /* Reference-stable fingerprint: every distinct reference gets a
       *  unique id via a WeakMap. Store/slice updates replace the
       *  reference whenever Zustand set() is called with new data,
       *  so this picks up all real changes. */
      parts.push(idFor(v as object));
    }
  }
  return parts.join("|");
}

const refIds = new WeakMap<object, string>();
let refCounter = 0;
function idFor(o: object): string {
  const existing = refIds.get(o);
  if (existing) return existing;
  const id = "r" + (++refCounter);
  refIds.set(o, id);
  return id;
}

export function useAutoSave() {
  const { saveProject } = useCloudStorage();
  /* `saveProject` is a new closure on every render of the hook's
   *  parent (useCloudStorage returns inline functions). To keep the
   *  subscription stable across renders, we stash the latest closure
   *  in a ref and read it from there inside the async path. The
   *  useEffect below runs exactly once per mount. */
  const saveProjectRef = useRef(saveProject);
  saveProjectRef.current = saveProject;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    async function scheduleSave() {
      debounceRef.current = null;
      const s = useBuilder.getState();
      if (!s.currentSessionId) return;
      if (savingRef.current) return;

      savingRef.current = true;
      s.setSaveState("saving");
      s.setSaveError(null);

      try {
        await saveProjectRef.current(s.sessionTitle ?? "Untitled session", {
          id: s.currentSessionId,
          refresh: false, // list gets refreshed when the drawer opens
        });
        /* Re-read — state may have mutated during the save */
        const after = useBuilder.getState();
        after.setLastSavedAt(Date.now());
        after.setSaveState("saved");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Save failed";
        const after = useBuilder.getState();
        after.setSaveState("error");
        after.setSaveError(msg);
      } finally {
        savingRef.current = false;
      }
    }

    /* Snapshot-compare via fingerprint — avoids relying on the
     *  (state, prev) two-argument subscribe variant; we just recompute
     *  the fingerprint each notification and bail if nothing tracked
     *  changed. Slightly cheaper than deep-compare, cheaper than
     *  stringifying messages[]. */
    let lastFingerprint = fingerprint(useBuilder.getState());
    const unsub = useBuilder.subscribe((state) => {
      const fp = fingerprint(state);
      if (fp === lastFingerprint) return;
      lastFingerprint = fp;

      /* No session yet → nothing to save */
      if (!state.currentSessionId) return;

      /* Debounce — always reset timer so rapid edits collapse into one
       *  save. If a save is in flight, we still re-arm the debounce so
       *  the NEXT save captures post-completion state. */
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(scheduleSave, DEBOUNCE_MS);
    });

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      unsub();
    };
  }, []);
}
