"use client";

import React, { useEffect, useState } from "react";
import { useBuilder } from "@/store/useBuilder";
import { isFirebaseConfigured } from "@/lib/firebase";
import { relativeTimeLabel } from "@/lib/sessionTitle";

/* Dismiss key - once the user dismisses the optional cross-device sync
   hint, we remember it in sessionStorage so it doesn't re-appear on
   every selection / edit. sessionStorage (not local) means it re-shows
   in a new tab or after a browser restart. The hint is a SECONDARY note
   appended to the affirmative "Saved on this device" state, not a
   replacement for it. */
const DISMISS_KEY = "design-hub:cloud-save-off-dismissed";

/* ══════════════════════════════════════════════════════════
   SaveIndicator - calm, always-visible reassurance that the
   user's session is safe.

   Sessions are ALWAYS persisted: useLocalAutoSave writes every
   tracked edit to localStorage (the local-first source of truth),
   and useAutoSave additionally mirrors to Firebase when configured.
   So the indicator should ALWAYS reflect real save progress, never
   imply "nothing is saved".

   States:
     - idle (no session started yet)        → nothing
     - saving                               → "Saving…"
     - saved (Firebase on)                  → "Saved 2 min ago"
     - saved (Firebase off, local-first)    → "Saved on this device"
                                              (+ optional dismissible
                                               "add Firebase keys to sync"
                                               note)
     - error                                → "Couldn't save · Retry"

   The "X ago" label ticks itself on a 15-second interval so users
   see it freshen over time without manual refresh. Refreshing the
   ticker only runs while the indicator is actually mounted + a
   timestamp exists, so idle sessions pay no perf cost.
   ══════════════════════════════════════════════════════════ */
export function SaveIndicator() {
  const saveState = useBuilder((s) => s.saveState);
  const lastSavedAt = useBuilder((s) => s.lastSavedAt);
  const saveError = useBuilder((s) => s.saveError);
  const currentSessionId = useBuilder((s) => s.currentSessionId);

  /* Local dismiss state for the optional cross-device sync note. Hydrates
     from sessionStorage on mount so navigating around the Builder doesn't
     re-show the note once the user has acknowledged it. This only hides
     the secondary sync hint; the affirmative "Saved on this device" state
     still shows. */
  const [hintDismissed, setHintDismissed] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") setHintDismissed(true);
  }, []);
  const dismissHint = () => {
    setHintDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* private-mode */ }
  };

  /* Tick a local counter every 15s so relativeTimeLabel re-renders.
     Mounts only while we have something meaningful to tick. */
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!lastSavedAt || saveState !== "saved") return;
    const id = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(id);
  }, [lastSavedAt, saveState]);

  /* Retry handler - manually flips saveState to trigger the auto-save
     hook to pick it up on the next change. If the user's state
     already matches what's on the server, they'll see "Saved just
     now" after the retry succeeds. */
  const handleRetry = () => {
    /* Bump a harmless state value (sessionTitle) to re-notify the
       auto-save subscription. We keep the title stable by writing
       the exact same value, so the actual content doesn't change. */
    const s = useBuilder.getState();
    if (s.sessionTitle) {
      s.setSessionTitle(s.sessionTitle);
    }
    s.setSaveState("idle");
    s.setSaveError(null);
  };

  /* Don't render anything until a session has been started. */
  if (!currentSessionId) return null;

  /* Local-first save is ALWAYS active (useLocalAutoSave -> localStorage),
     so even without Firebase we reflect the real saveState below rather
     than implying nothing is saved. `localOnly` just tweaks the saved-
     state copy to "Saved on this device" and offers the optional
     cross-device sync note. */
  const localOnly = !isFirebaseConfigured;

  if (saveState === "idle") return null;

  if (saveState === "saving") {
    return (
      <div className="save-indicator save-indicator--saving" aria-live="polite">
        <span className="save-indicator-dot save-indicator-dot--saving" aria-hidden="true" />
        <span>Saving…</span>
      </div>
    );
  }

  if (saveState === "error") {
    return (
      <div className="save-indicator save-indicator--error" aria-live="polite" role="status">
        <span className="material-symbols-outlined save-indicator-icon" aria-hidden="true">
          error
        </span>
        <span>
          Couldn&apos;t save
          {saveError && <span className="save-indicator-error-detail"> · {saveError}</span>}
        </span>
        <button
          type="button"
          className="save-indicator-retry"
          onClick={handleRetry}
          title="Retry save"
        >
          Retry
        </button>
      </div>
    );
  }

  /* saveState === "saved" */

  /* Local-first (no Firebase): affirmative "Saved on this device" plus an
     optional, dismissible sync note. We never tell the user nothing was
     saved - the session IS persisted in localStorage. */
  if (localOnly) {
    return (
      <div className="save-indicator save-indicator--saved" aria-live="polite">
        <span className="material-symbols-outlined save-indicator-icon" aria-hidden="true">
          check_circle
        </span>
        <span>
          Saved on this device
          {!hintDismissed && (
            <span className="save-indicator-error-detail">
              {". "}Add Firebase keys to sync across devices.
            </span>
          )}
        </span>
        {!hintDismissed && (
          <button
            type="button"
            className="save-indicator-retry"
            onClick={dismissHint}
            title="Dismiss"
            aria-label="Dismiss cross-device sync hint"
          >
            Dismiss
          </button>
        )}
      </div>
    );
  }

  /* Cloud-synced (Firebase configured): freshening relative timestamp. */
  const when = relativeTimeLabel(lastSavedAt);
  return (
    <div className="save-indicator save-indicator--saved" aria-live="polite">
      <span className="material-symbols-outlined save-indicator-icon" aria-hidden="true">
        check_circle
      </span>
      <span>Saved {when}</span>
    </div>
  );
}
