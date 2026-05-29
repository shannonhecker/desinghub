/* ════════════════════════════════════════════════════════════
   usePreviewMode (Phase E1, 2026-05-29 builder UX cleanup)
   ════════════════════════════════════════════════════════════
   Two builder modes:
     - "edit"    : default. All editing chrome visible
                   (selection borders, hover labels, drag
                   handles, remove + swap buttons, chip rail,
                   resize handles, etc).
     - "preview" : chrome hidden. Rendered blocks remain fully
                   visible and interactive (links clickable,
                   scroll works). Mimics Webflow / Webstudio /
                   Plasmic "Preview mode".

   In-memory only. Reload defaults back to "edit".

   Brand mapping (per uoaui palette memo):
     Teal Input  (#49D0BE) maps to Edit active
     Peach Output (#E5A999) maps to Preview active
   The visual binding lives in PreviewToggle.tsx + chrome-
   tokens.css (--brand-teal / --brand-peach).
   ════════════════════════════════════════════════════════════ */

import { create } from "zustand";

export type BuilderMode = "edit" | "preview";

interface PreviewModeState {
  mode: BuilderMode;
  toggle: () => void;
  setMode: (m: BuilderMode) => void;
}

export const usePreviewMode = create<PreviewModeState>((set) => ({
  mode: "edit",
  toggle: () =>
    set((s) => ({ mode: s.mode === "edit" ? "preview" : "edit" })),
  setMode: (m) => set({ mode: m }),
}));
