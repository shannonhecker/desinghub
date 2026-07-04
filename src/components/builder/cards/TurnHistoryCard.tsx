"use client";

import React from "react";

/* TurnHistoryCard (Phase 2) — a compact, non-destructive "Restore" affordance
   rendered under a user turn in the chat. Restoring rewinds the canvas to the
   state BEFORE that turn; it is git-revert style (the current state is pushed
   onto the undo stack first), so nothing downstream is lost and Cmd+Z returns
   from the restore. Mirrors Lovable's per-edit history cards. */
export function TurnHistoryCard({ onRestore }: { onRestore: () => void }) {
  return (
    <div className="turn-history-card">
      <span className="material-symbols-outlined turn-history-icon" aria-hidden="true">
        history
      </span>
      <span className="turn-history-label">Before this change</span>
      <button type="button" className="turn-history-restore" onClick={onRestore}>
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 15 }}>
          undo
        </span>
        Restore
      </button>
    </div>
  );
}
