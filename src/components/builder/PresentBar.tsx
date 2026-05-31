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

import React, { useState } from "react";
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

const DEVICES: { key: DeviceMode; Icon: typeof Monitor; label: string }[] = [
  { key: "desktop", Icon: Monitor, label: "Desktop" },
  { key: "tablet", Icon: Tablet, label: "Tablet" },
  { key: "mobile", Icon: Smartphone, label: "Mobile" },
];

export function PresentBar({
  /* "author" (default): in-app Present mode — exits back to the editor.
     "recipient": the shared-link view — no editor to exit to, so the exit
     slot becomes Fork-and-edit + Home (Decision #4/#5). */
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

      {/* DS read-only badge — the recipient sees the author's chosen
          system; the switcher is intentionally deferred (Decision #2). */}
      <span className="present-bar-ds-badge" aria-label={`Design system: ${DS_LABEL[designSystem]}`}>
        {DS_LABEL[designSystem]}
      </span>

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
            aria-label="Fork and edit in the builder"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16, marginRight: 4 }}>
              edit
            </span>
            Fork &amp; edit
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
          title="Exit Present mode (Esc)"
          aria-label="Exit Present mode"
        >
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16, marginRight: 4 }}>
            close
          </span>
          Done
        </button>
      )}
    </div>
  );
}
