"use client";

import React, { useEffect, useState } from "react";
import { useBuilder } from "@/store/useBuilder";
import { isFirebaseConfigured } from "@/lib/firebase";
import { relativeTimeLabel } from "@/lib/sessionTitle";

/* Dismiss key - once the user clicks × on the "Cloud save off" hint,
   we remember the dismissal in sessionStorage so it doesn't re-appear
   on every selection / edit. sessionStorage (not local) means it
   re-shows in a new tab or after a browser restart. */
const DISMISS_KEY = "design-hub:cloud-save-off-dismissed";

/* ══════════════════════════════════════════════════════════
   SaveIndicator - calm, always-visible reassurance that the
   user's session is safe.

   States:
     - idle (no session started yet)                     → nothing
     - saving                                            → "Saving…"
     - saved + lastSavedAt populated                     → "Saved 2 min ago"
     - error                                             → "Couldn't save · Retry"
     - Firebase unconfigured + session started           → "Cloud save off · dismiss"
                                                           (one-time dismissible hint)

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

  /* Local dismiss state for the "cloud save off" hint. Hydrates from
     sessionStorage on mount so navigating around the Builder doesn't
     re-show the hint once the user has acknowledged it. */
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

  /* Cloud save is off (no Firebase creds). Show a calm, dismissible
     info pill once per session instead of letting saveState churn
     through "saving → error" every 2.5s. Returning null after
     dismissal means the top bar stays clean the rest of the session. */
  if (!isFirebaseConfigured) {
    if (hintDismissed) return null;
    return (
      <div className="save-indicator save-indicator--off" aria-live="polite" role="status">
        <span className="material-symbols-outlined save-indicator-icon" aria-hidden="true">
          cloud_off
        </span>
        <span>
          Cloud save off
          <span className="save-indicator-error-detail">
            {" "}· add Firebase keys to sync across devices
          </span>
        </span>
        <button
          type="button"
          className="save-indicator-retry"
          onClick={dismissHint}
          title="Dismiss"
          aria-label="Dismiss cloud-save hint"
        >
          Dismiss
        </button>
      </div>
    );
  }

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
