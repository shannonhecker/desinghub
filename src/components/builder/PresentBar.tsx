"use client";

/* ══════════════════════════════════════════════════════════
   PresentBar — slim control bar for Present mode (PR-A).
   ══════════════════════════════════════════════════════════
   Present mode is a full-stage, read-only "stage". Its only
   chrome is this bar, floating bottom-centre. Deliberately a
   small, construction-only control set (no undo/redo, no
   Components, no Export, no density, no faux browser chrome):
   device · DS badge · theme · share · exit.

   setMode collision: the device/theme controls write
   useBuilder.setMode (light/dark canvas theme), while Exit
   writes usePreviewMode.setMode (edit/preview). They're aliased
   on import so the two never get crossed. */

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { useBuilder, type DeviceMode, type DesignSystem } from "@/store/useBuilder";
import { usePreviewMode } from "@/store/usePreviewMode";
import { buildShareUrl } from "@/lib/shareState";

const DS_LABEL: Record<DesignSystem, string> = {
  salt: "Salt DS",
  m3: "Material 3",
  fluent: "Fluent 2",
  uoaui: "uoaui",
  carbon: "Carbon",
};

/* Switch order mirrors the rest of the app (assumptionDims.DS_ORDER).
   Kept local so this construction-only bar stays self-contained. */
const DS_ORDER: DesignSystem[] = ["salt", "m3", "fluent", "uoaui", "carbon"];

const DEVICES: { key: DeviceMode; Icon: typeof Monitor; label: string }[] = [
  { key: "desktop", Icon: Monitor, label: "Desktop" },
  { key: "tablet", Icon: Tablet, label: "Tablet" },
  { key: "mobile", Icon: Smartphone, label: "Mobile" },
];

/* Live design-system switcher — re-themes the whole canvas in place.
   setDesignSystem already remaps themeKey per DS (useBuilder) and the
   blocks are DS-agnostic, so the swap is a pure re-render. Rendered for
   both author and recipient (non-destructive: it only changes how the
   shared canvas is drawn, which is the cross-DS showcase). A WAI-ARIA
   listbox: roving tabindex on the options, Esc/outside-click close, and
   Esc is captured + stopped so it closes the menu instead of exiting
   Present mode (BuilderApp's global Esc handler). */
function PresentDSDropdown() {
  const designSystem = useBuilder((s) => s.designSystem);
  const setDesignSystem = useBuilder((s) => s.setDesignSystem);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  /* Close on outside click + Esc (captured so it beats the global
     Present-mode Esc handler while the menu is open). Esc returns focus
     to the trigger (WCAG 2.4.3); an outside click does not steal it. */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); setOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  /* Move focus to the selected option when the menu opens. */
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
  }, [open]);

  /* Select + close, returning focus to the trigger for keyboard users. */
  const select = (ds: DesignSystem) => { setDesignSystem(ds); setOpen(false); triggerRef.current?.focus(); };

  const onListKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const items = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
    const i = items.findIndex((el) => el === document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[Math.min(items.length - 1, i + 1)]?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); items[Math.max(0, i - 1)]?.focus(); }
    else if (e.key === "Home") { e.preventDefault(); items[0]?.focus(); }
    else if (e.key === "End") { e.preventDefault(); items[items.length - 1]?.focus(); }
  };

  return (
    <div className="present-bar-ds" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="present-bar-btn present-bar-ds-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Design system: ${DS_LABEL[designSystem]}. Change design system.`}
        title="Change design system"
      >
        {DS_LABEL[designSystem]}
        {/* Bar is fixed bottom-centre, so the menu opens upward: caret
            points up when closed (toward the menu), down to collapse. */}
        <span className="material-symbols-outlined present-bar-ds-caret" aria-hidden="true" style={{ fontSize: 18 }}>
          {open ? "arrow_drop_down" : "arrow_drop_up"}
        </span>
      </button>
      {open && (
        <ul
          className="present-bar-ds-menu"
          role="listbox"
          aria-label="Design system"
          ref={listRef}
          onKeyDown={onListKeyDown}
          tabIndex={-1}
        >
          {DS_ORDER.map((ds) => {
            const selected = ds === designSystem;
            return (
              <li
                key={ds}
                role="option"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                className={`present-bar-ds-option${selected ? " present-bar-ds-option-selected" : ""}`}
                onClick={() => select(ds)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(ds); } }}
              >
                <span className="material-symbols-outlined present-bar-ds-check" aria-hidden="true" style={{ fontSize: 16 }}>
                  {selected ? "check" : ""}
                </span>
                {DS_LABEL[ds]}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function PresentBar({
  /* "author" (default): in-app Present mode — exits back to the editor.
     "recipient": the shared-link view — no editor to exit to, so the exit
     slot becomes Edit + Home (Decision #4/#5). */
  variant = "author",
  sharedHash,
}: {
  variant?: "author" | "recipient";
  sharedHash?: string;
} = {}) {
  const deviceMode = useBuilder((s) => s.deviceMode);
  const setDeviceMode = useBuilder((s) => s.setDeviceMode);
  const designSystem = useBuilder((s) => s.designSystem);
  const mode = useBuilder((s) => s.mode);
  /* Alias: canvas light/dark theme — NOT the edit/preview mode. */
  const setThemeMode = useBuilder((s) => s.setMode);
  const compareMode = useBuilder((s) => s.compareMode);
  /* Alias: edit/preview — used only to exit back to the editor. */
  const setBuilderMode = usePreviewMode((s) => s.setMode);

  const [shareState, setShareState] = useState<"idle" | "copied" | "too-long" | "error">("idle");

  const handleShare = async () => {
    const s = useBuilder.getState();
    const { url, tooLong } = buildShareUrl({
      v: 1,
      designSystem: s.designSystem,
      mode: s.mode,
      density: s.density,
      deviceMode: s.deviceMode,
      themeKey: s.themeKey,
      activeTemplateId: s.activeTemplateId,
      headerBlocks: s.headerBlocks,
      sidebarBlocks: s.sidebarBlocks,
      blocks: s.blocks,
      footerBlocks: s.footerBlocks,
    });
    if (tooLong) {
      setShareState("too-long");
      setTimeout(() => setShareState("idle"), 3000);
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2000);
    } catch {
      setShareState("error");
      setTimeout(() => setShareState("idle"), 2500);
    }
  };

  const shareIcon =
    shareState === "copied" ? "check"
    : shareState === "too-long" || shareState === "error" ? "warning"
    : "link";
  const shareLabel =
    shareState === "copied" ? "Link copied"
    : shareState === "too-long" ? "Too large to share"
    : shareState === "error" ? "Clipboard unavailable"
    : "Share";

  return (
    <div className="present-bar" role="toolbar" aria-label="Present mode controls">
      <span className="present-bar-brand" aria-hidden="true">{variant === "recipient" ? "Preview" : "Present"}</span>

      <span className="present-bar-sep" aria-hidden="true" />

      {/* Device picker — hidden in Compare (each quadrant is its own
          DS at a fixed size, so device choice doesn't apply). Active
          state is conveyed by aria-pressed + a heavier icon stroke +
          a non-colour underline cue (see .present-bar-btn-active). */}
      {!compareMode && (
        <div className="present-bar-group" role="group" aria-label="Device">
          {DEVICES.map(({ key, Icon, label }) => (
            <button
              key={key}
              type="button"
              className={`present-bar-btn present-bar-btn-icon${deviceMode === key ? " present-bar-btn-active" : ""}`}
              onClick={() => setDeviceMode(key)}
              aria-pressed={deviceMode === key}
              aria-label={`${label} viewport`}
              title={label}
            >
              <Icon size={16} strokeWidth={deviceMode === key ? 2.2 : 1.6} />
            </button>
          ))}
        </div>
      )}

      <span className="present-bar-sep" aria-hidden="true" />

      {/* DS switcher — live re-theme across all 5 systems (re-renders the
          canvas in place via setDesignSystem). In Compare mode each
          quadrant is its own DS, so a single switcher doesn't apply:
          fall back to the read-only badge there. */}
      {compareMode ? (
        <span className="present-bar-ds-badge" aria-label={`Design system: ${DS_LABEL[designSystem]}`}>
          {DS_LABEL[designSystem]}
        </span>
      ) : (
        <PresentDSDropdown />
      )}

      {/* Theme toggle (light/dark canvas) */}
      <button
        type="button"
        className="present-bar-btn present-bar-btn-icon"
        onClick={() => setThemeMode(mode === "dark" ? "light" : "dark")}
        title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>
          {mode === "dark" ? "light_mode" : "dark_mode"}
        </span>
      </button>

      {/* Share — copies a stateless preview URL to the clipboard. */}
      <button
        type="button"
        className="present-bar-btn present-bar-btn-pill"
        onClick={handleShare}
        title="Copy a shareable preview link"
        aria-label="Copy share link"
      >
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 14, marginRight: 4 }}>
          {shareIcon}
        </span>
        {shareLabel}
      </button>

      <span className="present-bar-sep" aria-hidden="true" />

      {variant === "recipient" ? (
        <>
          {/* Recipient (shared link): open the canvas in the builder, or go
              home. No "exit to edit" — there's no editor in this route. */}
          <button
            type="button"
            className="present-bar-btn present-bar-btn-exit"
            onClick={() => { if (sharedHash) window.location.href = `/builder?shared=${sharedHash}`; }}
            title="Open this canvas in the builder"
            aria-label="Edit this canvas in the builder"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16, marginRight: 4 }}>
              edit
            </span>
            Edit
          </button>
          <Link
            className="present-bar-btn"
            href="/"
            title="Design Hub home"
            aria-label="Design Hub home"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16, marginRight: 4 }}>
              home
            </span>
            Home
          </Link>
        </>
      ) : (
        /* Author: exit Present mode → back to the editor. Esc does the same
           (handled globally in BuilderApp). */
        <button
          type="button"
          className="present-bar-btn present-bar-btn-exit"
          onClick={() => setBuilderMode("edit")}
          title="Edit canvas (Esc)"
          aria-label="Edit canvas"
        >
          Edit
        </button>
      )}
    </div>
  );
}
