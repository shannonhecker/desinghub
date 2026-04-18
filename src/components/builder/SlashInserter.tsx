"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useBuilder } from "@/store/useBuilder";
import { LIBRARY_BLUEPRINTS } from "@/lib/blockRegistry";
import { MiniPreview } from "./MiniPreview";

/* ══════════════════════════════════════════════════════════
   SlashInserter - Notion-style quick component picker.

   Trigger:
     - Press `/` anywhere while focus is NOT inside an editable
       element (input, textarea, contentEditable). This lets users
       still type slashes freely in the chat input.
   Behaviour:
     - Opens a centered floating overlay with a search field +
       keyboard-navigable list of components.
     - Arrow keys move selection, Enter inserts, Esc closes.
     - Selecting calls the same addBlockFromLibrary action used by
       click-to-add in the panel - identical routing + side effects.
   ══════════════════════════════════════════════════════════ */

function isEditableTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable) return true;
  const tag = t.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return false;
}

export function SlashInserter() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const addBlockFromLibrary = useBuilder((s) => s.addBlockFromLibrary);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LIBRARY_BLUEPRINTS.slice(0, 30);
    return LIBRARY_BLUEPRINTS.filter(
      (bp) =>
        bp.label.toLowerCase().includes(q) ||
        bp.type.toLowerCase().includes(q)
    );
  }, [query]);

  /* Reset activeIndex when filter changes; clamp to list length. */
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  /* Global "/" hotkey - only when no editable element is focused.
     Also handles Escape to close when open. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !open && !isEditableTarget(document.activeElement)) {
        e.preventDefault();
        setQuery("");
        setOpen(true);
        return;
      }
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /* Focus the search field when the overlay opens. */
  useEffect(() => {
    if (open) {
      /* microtask to let the element render before focusing */
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  /* Lock body scroll while open. */
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  /* Scroll active row into view when keyboard-navigating. */
  useEffect(() => {
    if (!open || !listRef.current) return;
    const rows = listRef.current.querySelectorAll<HTMLElement>(".slash-row");
    const row = rows[activeIndex];
    if (row) row.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  if (!open) return null;

  const handleInsert = (idx: number) => {
    const bp = results[idx];
    if (!bp) return;
    addBlockFromLibrary(bp.type, bp.defaults);
    setOpen(false);
  };

  const handleKeyDown: React.KeyboardEventHandler = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleInsert(activeIndex);
    } else if (e.key === "Tab") {
      e.preventDefault();
      setActiveIndex((i) => (e.shiftKey
        ? Math.max(0, i - 1)
        : Math.min(results.length - 1, i + 1)));
    }
  };

  return (
    <div
      className="slash-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="slash-inserter-title"
      onClick={() => setOpen(false)}
    >
      <div className="slash-panel" onClick={(e) => e.stopPropagation()}>
        <div className="slash-header">
          <span className="slash-title" id="slash-inserter-title">
            Insert component
          </span>
          <span className="slash-hint">
            <kbd>↑</kbd><kbd>↓</kbd> to navigate · <kbd>⏎</kbd> to insert · <kbd>Esc</kbd> to close
          </span>
        </div>
        <div className="slash-search">
          <span className="material-symbols-outlined slash-search-icon" aria-hidden="true">
            search
          </span>
          <input
            ref={inputRef}
            type="text"
            className="slash-search-input"
            placeholder="Search components…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="slash-list" ref={listRef} role="listbox" aria-activedescendant={results[activeIndex] ? `slash-row-${activeIndex}` : undefined}>
          {results.length === 0 && (
            <div className="slash-empty">No components match “{query}”.</div>
          )}
          {results.map((bp, i) => (
            <button
              key={bp.id}
              id={`slash-row-${i}`}
              type="button"
              className={`slash-row ${i === activeIndex ? "is-active" : ""}`}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => handleInsert(i)}
              role="option"
              aria-selected={i === activeIndex}
            >
              <div className="slash-row-thumb">
                <MiniPreview type={bp.type} />
              </div>
              <div className="slash-row-text">
                <span className="slash-row-label">{bp.label}</span>
                <span className="slash-row-type">{bp.type}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
