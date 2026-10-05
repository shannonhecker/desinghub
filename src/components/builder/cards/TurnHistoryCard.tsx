"use client";

import { ChromeIcon } from "../ChromeIcon";
import React from "react";

/* TurnHistoryCard (Phase 2) — a compact, non-destructive "Restore" affordance
   rendered under a user turn in the chat. Restoring rewinds the canvas to the
   state BEFORE that turn; it is git-revert style (the current state is pushed
   onto the undo stack first), so nothing downstream is lost and Cmd+Z returns
   from the restore. Mirrors Lovable's per-edit history cards. */
export function TurnHistoryCard({ onRestore }: { onRestore: () => void }) {
  return (
    <div className="turn-history-card">
      <ChromeIcon name="history" className="turn-history-icon" aria-hidden="true" />
      <span className="turn-history-label">Before this change</span>
      <button type="button" className="turn-history-restore" onClick={onRestore}>
        <ChromeIcon name="undo" aria-hidden="true" style={{ fontSize: 15 }} />
        Restore
      </button>
    </div>
  );
}
