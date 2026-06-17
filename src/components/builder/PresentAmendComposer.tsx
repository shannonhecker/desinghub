"use client";

import React, { useState } from "react";
import { useBuilder, findBlockInTree } from "@/store/useBuilder";
import { useChatAPI } from "@/lib/useChatAPI";

/* "SimulatedStatCard" -> "Stat card" — a friendly scope label. */
function blockLabel(type: string): string {
  const cleaned = type
    .replace(/^Simulated/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();
  if (!cleaned) return "Block";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

/* ════════════════════════════════════════════════════════════
   PresentAmendComposer — "amend in place" (Phase 1).
   ════════════════════════════════════════════════════════════
   Appears anchored at the bottom of Present mode the moment a block is
   selected (click-to-select on the live render, gated by AmendableContext).
   It runs its OWN useChatAPI instance — ChatPanel is edit-only and is NOT
   mounted in Present, so there is no second-subscriber conflict. useChatAPI
   reads selectedBlockId straight from the store and injects the
   selected_block context, so a prompt typed here is automatically SCOPED to
   the clicked block. Mirrors ChatPanel's selected-block send path
   (addMessage("user") → sendMessage → bumpPreview), minus the keyword
   routing (a block is always selected here). */
export function PresentAmendComposer() {
  const selectedBlockId = useBuilder((s) => s.selectedBlockId);
  const selectedBlockIds = useBuilder((s) => s.selectedBlockIds);
  const clearSelection = useBuilder((s) => s.clearSelection);
  const addMessage = useBuilder((s) => s.addMessage);
  const bumpPreview = useBuilder((s) => s.bumpPreview);
  const isGenerating = useBuilder((s) => s.isGenerating);
  const anthropicConfigured = useBuilder((s) => s.backendStatus.anthropicConfigured);
  const label = useBuilder((s) => {
    if (!s.selectedBlockId) return "";
    const all = [...s.headerBlocks, ...s.sidebarBlocks, ...s.blocks, ...s.footerBlocks];
    const b = findBlockInTree(all, s.selectedBlockId);
    return b ? blockLabel(b.type) : "Block";
  });

  const { sendMessage, retrySeconds } = useChatAPI();
  const [text, setText] = useState("");
  const [hint, setHint] = useState<string | null>(null);

  if (!selectedBlockId) return null;

  const aiDisabled = anthropicConfigured === false;
  const multi = selectedBlockIds.length > 1;

  const submit = () => {
    const msg = text.trim();
    if (!msg || isGenerating) return;
    if (aiDisabled) {
      setHint("Editing a block needs AI (set ANTHROPIC_API_KEY).");
      return;
    }
    if (retrySeconds != null) {
      setHint("Rate limit active. Try again in a moment.");
      return;
    }
    setHint(null);
    addMessage("user", msg);
    setText("");
    sendMessage(msg).then(() => bumpPreview());
  };

  const dismiss = () => {
    clearSelection();
    setHint(null);
  };

  return (
    <div className="present-amend" role="form" aria-label={`Amend ${label}`}>
      <div className="present-amend-scope">
        <span className="present-amend-dot" aria-hidden="true" />
        <span className="present-amend-label">
          {multi ? `${selectedBlockIds.length} blocks selected` : `Editing: ${label}`}
        </span>
        <button
          type="button"
          className="present-amend-clear"
          aria-label="Clear selection"
          onClick={dismiss}
        >
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>
            close
          </span>
        </button>
      </div>
      <div className="present-amend-row">
        <input
          className="present-amend-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            } else if (e.key === "Escape") {
              dismiss();
            }
          }}
          placeholder={
            isGenerating
              ? "Amending…"
              : multi
                ? "Describe the change for these blocks…"
                : "Describe the change… e.g. make it primary"
          }
          disabled={isGenerating}
          aria-label="Describe the change"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
        <button
          type="button"
          className="present-amend-send"
          onClick={submit}
          disabled={isGenerating || !text.trim()}
          aria-label="Send amend"
        >
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 18 }}>
            {isGenerating ? "hourglass_empty" : "arrow_upward"}
          </span>
        </button>
      </div>
      {hint && (
        <div className="present-amend-hint" role="status">
          {hint}
        </div>
      )}
    </div>
  );
}
