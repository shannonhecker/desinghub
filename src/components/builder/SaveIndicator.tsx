"use client";

import React, { useEffect, useState } from "react";
import { useBuilder } from "@/store/useBuilder";
import { relativeTimeLabel } from "@/lib/sessionTitle";

/* ══════════════════════════════════════════════════════════
   SaveIndicator — calm, always-visible reassurance that the
   user's session is safe.

   States:
     - idle (no session started yet)                     → nothing
     - saving                                            → "Saving…"
     - saved + lastSavedAt populated                     → "Saved 2 min ago"
     - error                                             → "Couldn't save · Retry"

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

  /* Tick a local counter every 15s so relativeTimeLabel re-renders.
     Mounts only while we have something meaningful to tick. */
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!lastSavedAt || saveState !== "saved") return;
    const id = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(id);
  }, [lastSavedAt, saveState]);

  /* Retry handler — manually flips saveState to trigger the auto-save
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
  if (!currentSessionId || saveState === "idle") return null;

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
