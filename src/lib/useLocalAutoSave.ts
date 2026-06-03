"use client";

/**
 * useLocalAutoSave - the local-first sibling of useAutoSave.
 *
 * useAutoSave writes sessions to Firebase and NO-OPS entirely when
 * Firebase isn't configured (the default). That no-op is exactly why the
 * Sessions drawer was always empty: with no cloud configured, nothing
 * ever persisted. This hook closes the gap by writing the same session
 * snapshot to the browser-local useSessionStore (localStorage) instead.
 *
 * It mirrors useAutoSave's mechanics:
 *  - Subscribes OUTSIDE the React render graph (useBuilder.subscribe) so
 *    the debounce isn't torn down on every render.
 *  - Fingerprint-diffs the same TRACKED_KEYS so unrelated UI state
 *    (drawer toggles, focus, preview-open) doesn't trigger a write.
 *  - Light debounce so a burst of keystrokes collapses into one write.
 *  - No-op while currentSessionId is null. That gate is correct, not the
 *    bug: a stable session id is minted on the first meaningful action
 *    (template pick / first message) via ensureSessionStarted(), so we
 *    never pollute the list with an untouched empty canvas.
 *
 * Crucially there is NO isFirebaseConfigured gate here, and no network.
 * localStorage is the source of truth. A future cloud sync can layer on
 * top by reading useSessionStore rows.
 */

import { useEffect, useRef } from "react";
import { useBuilder } from "@/store/useBuilder";
import { useSessionStore, type LocalSessionSnapshot } from "@/store/useSessionStore";
import { TRACKED_KEYS } from "./autoSaveTrackedKeys";

/* localStorage writes are synchronous and cheap, so a short debounce is
 *  plenty to collapse rapid edits without losing the latest state. */
const DEBOUNCE_MS = 800;

const refIds = new WeakMap<object, string>();
let refCounter = 0;
function idFor(o: object): string {
  const existing = refIds.get(o);
  if (existing) return existing;
  const id = "r" + ++refCounter;
  refIds.set(o, id);
  return id;
}

/** Shallow reference fingerprint across tracked keys - identical to the
 *  useAutoSave strategy: distinct references get a stable WeakMap id, so
 *  any Zustand set() that swaps a slot's reference is detected. */
function fingerprint(state: unknown): string {
  const s = state as Record<string, unknown>;
  const parts: string[] = [];
  for (const k of TRACKED_KEYS) {
    const v = s[k];
    if (v === null || v === undefined) {
      parts.push("");
      continue;
    }
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
      parts.push(String(v));
    } else {
      parts.push(idFor(v as object));
    }
  }
  return parts.join("|");
}

export function useLocalAutoSave() {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function persistNow() {
      debounceRef.current = null;
      const s = useBuilder.getState();
      /* No session started yet -> nothing to save (correct gate). */
      if (!s.currentSessionId) return;

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

      try {
        s.setSaveState("saving");
        useSessionStore.getState().upsertSession({
          id: s.currentSessionId,
          name: s.sessionTitle ?? "Untitled session",
          snapshot,
        });
        const after = useBuilder.getState();
        after.setLastSavedAt(Date.now());
        after.setSaveState("saved");
        after.setSaveError(null);
      } catch (err) {
        /* localStorage can throw (quota / private mode). Surface it via
           the existing save indicator instead of crashing the builder. */
        const msg =
          err instanceof Error ? err.message : "Couldn't save this session locally.";
        const after = useBuilder.getState();
        after.setSaveState("error");
        after.setSaveError(msg);
      }
    }

    let lastFingerprint = fingerprint(useBuilder.getState());
    const unsub = useBuilder.subscribe((state) => {
      const fp = fingerprint(state);
      if (fp === lastFingerprint) return;
      lastFingerprint = fp;

      if (!state.currentSessionId) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(persistNow, DEBOUNCE_MS);
    });

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      unsub();
    };
  }, []);
}
