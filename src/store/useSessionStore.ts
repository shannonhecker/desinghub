"use client";

/**
 * useSessionStore - local-first persistence for builder sessions.
 *
 * Why this exists:
 *  The Sessions/History drawer used to be ALWAYS empty because the only
 *  save path (useAutoSave -> Firebase) short-circuits whenever Firebase
 *  isn't configured, which is the default deployment. Nothing ever wrote
 *  a session, so nothing ever showed up. This store fixes that with a
 *  zero-network, browser-local source of truth.
 *
 * Contract:
 *  - Persists to localStorage under "uoaui-sessions" via Zustand's
 *    persist middleware. No auth, no network, no Firebase import.
 *  - Caps the list at the 25 most-recent sessions (by updatedAt). When a
 *    save pushes the count over the cap, the oldest is dropped. This keeps
 *    us well under the ~5MB localStorage budget even for large canvases.
 *  - upsertSession is idempotent by id: re-saving the same session id
 *    updates it in place (and bumps updatedAt) instead of forking copies.
 *
 * Cloud-dormant by design:
 *  The shape (LocalSession.snapshot) is a superset-compatible mirror of
 *  firebase.ProjectSnapshot, so a future cloud sync layer can read these
 *  rows and push them to Firestore without a schema migration. We do NOT
 *  call any network here - that wiring is intentionally deferred.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ChatMessage,
  Block,
  DesignSystem,
  BuilderMode,
  InterfaceType,
  ZoneLayout,
  ZoneId,
} from "@/store/useBuilder";

/** The persisted slice of builder state for one session. Mirrors
 *  firebase.ProjectSnapshot so a cloud adapter can map 1:1 later. */
export interface LocalSessionSnapshot {
  messages: ChatMessage[];
  blocks: Block[];
  headerBlocks?: Block[];
  sidebarBlocks?: Block[];
  footerBlocks?: Block[];
  zoneLayouts?: Record<ZoneId, ZoneLayout>;
  designSystem: DesignSystem;
  mode: BuilderMode;
  density: string;
  interfaceType: InterfaceType;
  selectedComponents: string[];
  colorOverrides: Record<string, string>;
  activeTemplateId?: string | null;
}

export interface LocalSession {
  id: string;
  name: string;
  /** Epoch ms. Kept as numbers (not Date) so they round-trip cleanly
   *  through JSON.stringify in the persist middleware. */
  createdAt: number;
  updatedAt: number;
  snapshot: LocalSessionSnapshot;
}

/** Most-recent sessions to retain. Older rows are dropped on save. */
export const SESSION_CAP = 25;

interface SessionStoreState {
  sessions: LocalSession[];
  /** Schema marker so a future migration can detect old persisted blobs. */
  _v: number;

  /** Insert or update a session by id, stamp updatedAt, and enforce the
   *  most-recent cap. Returns nothing - read `sessions` reactively. */
  upsertSession: (
    input: {
      id: string;
      name: string;
      snapshot: LocalSessionSnapshot;
    }
  ) => void;

  /** Rename any session (active or not) by id. No-op for unknown ids or
   *  empty names. Bumps updatedAt so the row floats to the top. */
  renameSession: (id: string, name: string) => void;

  /** Remove a session by id. */
  deleteSession: (id: string) => void;

  /** Read a single session by id (or undefined). */
  getSession: (id: string) => LocalSession | undefined;
}

/** Sort newest-first by updatedAt and trim to the cap. Pure helper so the
 *  cap policy lives in one place. */
function capAndSort(sessions: LocalSession[]): LocalSession[] {
  return [...sessions]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, SESSION_CAP);
}

export const useSessionStore = create<SessionStoreState>()(
  persist(
    (set, get) => ({
      sessions: [],
      _v: 1,

      upsertSession: ({ id, name, snapshot }) =>
        set((state) => {
          const now = Date.now();
          const existing = state.sessions.find((s) => s.id === id);
          const next: LocalSession = existing
            ? { ...existing, name, snapshot, updatedAt: now }
            : { id, name, createdAt: now, updatedAt: now, snapshot };
          const others = state.sessions.filter((s) => s.id !== id);
          return { sessions: capAndSort([next, ...others]) };
        }),

      renameSession: (id, name) =>
        set((state) => {
          const trimmed = name.trim();
          if (!trimmed) return {};
          const existing = state.sessions.find((s) => s.id === id);
          if (!existing || existing.name === trimmed) return {};
          const updated: LocalSession = {
            ...existing,
            name: trimmed,
            updatedAt: Date.now(),
          };
          const others = state.sessions.filter((s) => s.id !== id);
          return { sessions: capAndSort([updated, ...others]) };
        }),

      deleteSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        })),

      getSession: (id) => get().sessions.find((s) => s.id === id),
    }),
    {
      name: "uoaui-sessions",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      /* Only persist the data, not the action closures. */
      partialize: (state) => ({ sessions: state.sessions, _v: state._v }),
    }
  )
);
