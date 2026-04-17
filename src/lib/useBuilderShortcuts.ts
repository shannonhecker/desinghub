/**
 * Keyboard shortcut hook for the Builder.
 *
 * - Cmd+Z  / Ctrl+Z         → undo  (canvas state)
 * - Cmd+Shift+Z / Ctrl+Y    → redo
 *
 * Listens on window; skipped when focus is inside an editable text
 * element so we don't hijack native editing undo in the chat input
 * or an inline block property input.
 *
 * The hook also initializes the history store on mount so every
 * builder session has undo available from the first change.
 */

"use client";

import { useEffect } from "react";
import { initBuilderHistory, undo, redo } from "./builderHistory";

function isEditableTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable) return true;
  const tag = t.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return false;
}

export function useBuilderShortcuts() {
  useEffect(() => {
    const cleanup = initBuilderHistory();

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      // Cmd/Ctrl + Z / Y
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      cleanup();
    };
  }, []);
}
