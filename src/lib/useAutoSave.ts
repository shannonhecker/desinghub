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

export function useAutoSave() {
  const { saveProject } = useCloudStorage();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return; // Strict Mode double-mount guard
    mountedRef.current = true;

    const unsub = useBuilder.subscribe((state, prev) => {
      /* Cheap short-circuit: only act if a relevant slice changed */
      const changed = TRACKED_KEYS.some((k) => {
        return state[k as keyof typeof state] !== prev[k as keyof typeof prev];
      });
      if (!changed) return;

      /* No session yet → nothing to save */
      if (!state.currentSessionId) return;

      /* Already mid-save? Let the in-flight save finish and the next
       *  change tick will re-schedule. Avoids overlapping writes. */
      if (savingRef.current) {
        /* But do reset the debounce so we don't fire immediately on
         *  save completion. */
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(scheduleSave, DEBOUNCE_MS);
        return;
      }

      /* Debounce */
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(scheduleSave, DEBOUNCE_MS);
    });

    async function scheduleSave() {
      debounceRef.current = null;
      const s = useBuilder.getState();
      if (!s.currentSessionId) return;
      if (savingRef.current) return;

      savingRef.current = true;
      s.setSaveState("saving");
      s.setSaveError(null);

      try {
        await saveProject(s.sessionTitle ?? "Untitled session", {
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

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      unsub();
      mountedRef.current = false;
    };
  }, [saveProject]);
}
