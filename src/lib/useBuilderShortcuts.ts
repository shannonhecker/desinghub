/**
 * Keyboard shortcut hook for the Builder.
 *
 * - Cmd+Z  / Ctrl+Z         → undo  (canvas state)
 * - Cmd+Shift+Z / Ctrl+Y    → redo
 * - Cmd+.  / Ctrl+.         → toggle component library panel
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
import { useBuilder } from "@/store/useBuilder";

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
      const k = e.key.toLowerCase();

      /* Non-modifier shortcuts first (Delete / Backspace / Esc). */
      if (!mod) {
        if (e.key === "Delete" || e.key === "Backspace") {
          const s = useBuilder.getState();
          if (s.selectedBlockIds.length > 0 && s.selectedBlockZone) {
            e.preventDefault();
            const zone = s.selectedBlockZone;
            s.selectedBlockIds.forEach((id) => s.removeBlockFromZone(zone, id));
            s.clearSelection();
          }
          return;
        }
        if (e.key === "Escape") {
          const s = useBuilder.getState();
          if (s.blockContextMenu) {
            e.preventDefault();
            s.closeBlockContextMenu();
          } else if (s.selectedBlockIds.length > 0) {
            e.preventDefault();
            s.clearSelection();
          }
          return;
        }
        return;
      }

      /* Cmd/Ctrl + Z / Y — undo/redo */
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === ".") {
        e.preventDefault();
        useBuilder.getState().toggleComponentLibrary();
        return;
      }

      /* ⌘G group / ⌘⇧G ungroup */
      if (k === "g") {
        e.preventDefault();
        const s = useBuilder.getState();
        if (!s.selectedBlockZone || s.selectedBlockIds.length === 0) return;
        if (e.shiftKey) {
          /* Ungroup the first LayoutGroup in the current selection. */
          const zone = s.selectedBlockZone;
          const arr =
            zone === "body" ? s.blocks
            : zone === "header" ? s.headerBlocks
            : zone === "sidebar" ? s.sidebarBlocks
            : s.footerBlocks;
          const groupId = s.selectedBlockIds.find((id) => {
            const b = arr.find((x) => x.id === id);
            return b?.type === "LayoutGroup";
          });
          if (groupId) s.ungroupBlock(zone, groupId);
        } else {
          s.groupBlocks(s.selectedBlockZone, s.selectedBlockIds, "stack");
        }
        return;
      }

      /* ⌘D duplicate */
      if (k === "d") {
        const s = useBuilder.getState();
        if (!s.selectedBlockZone || s.selectedBlockIds.length === 0) return;
        e.preventDefault();
        s.duplicateBlocks(s.selectedBlockZone, s.selectedBlockIds);
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      cleanup();
    };
  }, []);
}
