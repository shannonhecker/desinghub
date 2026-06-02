"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useBuilder } from "@/store/useBuilder";
import { useCloudStorage } from "@/lib/firebase";
import { migrateBlocks } from "@/lib/blockMigrations";
import {
  useSessionStore,
  type LocalSession,
  type LocalSessionSnapshot,
} from "@/store/useSessionStore";

/* ══════════════════════════════════════════════════════════
   SessionsDrawer - left slide-in session browser.

   Local-first: the list reads from useSessionStore (persisted to
   localStorage under "uoaui-sessions"), so it's never empty once a
   user has built anything. When Firebase is also configured, cloud
   projects are merged in (deduped by id, local wins as the live copy).

   Users open it from the top-left hamburger icon, see their sessions,
   inline-rename titles, delete with a per-row button, and start a
   fresh session via the "+ New session" button at top.

   Auto-save keeps the list current - useLocalAutoSave upserts the
   active session to the local store on every meaningful change (and
   useAutoSave mirrors to Firebase when configured).
   ══════════════════════════════════════════════════════════ */

/** A normalized row the drawer can render regardless of source. */
interface DrawerSession {
  id: string;
  name: string;
  updatedAt: Date;
  snapshot: LocalSessionSnapshot;
  /** True when this row exists in the local store (so delete/rename can
   *  target localStorage). Cloud-only rows fall back to the cloud path. */
  isLocal: boolean;
}

function fromLocal(s: LocalSession): DrawerSession {
  return {
    id: s.id,
    name: s.name,
    updatedAt: new Date(s.updatedAt),
    snapshot: s.snapshot,
    isLocal: true,
  };
}

/** Restore a snapshot into the builder. Mirrors firebase.loadProject's
 *  field set so local + cloud loads behave identically. Defensive against
 *  legacy/partial snapshots so one bad row never crashes the builder. */
function restoreSnapshot(session: DrawerSession) {
  try {
    const snap = session.snapshot;
    const colorOverrides = snap.colorOverrides ?? {};
    useBuilder.setState({
      messages: snap.messages ?? [],
      blocks: migrateBlocks(snap.blocks ?? []),
      headerBlocks: migrateBlocks(snap.headerBlocks ?? []),
      sidebarBlocks: migrateBlocks(snap.sidebarBlocks ?? []),
      footerBlocks: migrateBlocks(snap.footerBlocks ?? []),
      ...(snap.zoneLayouts ? { zoneLayouts: snap.zoneLayouts } : {}),
      designSystem: snap.designSystem,
      mode: snap.mode,
      density: snap.density,
      interfaceType: snap.interfaceType,
      selectedComponents: snap.selectedComponents ?? [],
      colorOverrides,
      activeTemplateId: snap.activeTemplateId ?? null,
      hasOverrides: Object.keys(colorOverrides).length > 0,
      onboardingStep: "ready",
      currentSessionId: session.id,
      sessionTitle: session.name,
      lastSavedAt: session.updatedAt.getTime(),
      saveState: "saved",
      saveError: null,
      sessionsDrawerOpen: false,
      templatesDrawerOpen: false,
      pendingTemplateId: null,
      pendingFirstMessage: null,
      selectedBlockId: null,
      selectedBlockZone: null,
      previewOpen: true,
    });
  } catch (e) {
    console.error("restoreSnapshot failed:", e);
    useBuilder.setState({
      saveState: "error",
      saveError: "Couldn't open that session. It may be from an older version.",
      sessionsDrawerOpen: false,
    });
  }
}

export function SessionsDrawer() {
  const sessionsDrawerOpen = useBuilder((s) => s.sessionsDrawerOpen);
  const setSessionsDrawerOpen = useBuilder((s) => s.setSessionsDrawerOpen);
  const currentSessionId = useBuilder((s) => s.currentSessionId);
  /* Subscribed so the active row's label/timestamp stay live in the brief
     window before the first debounced save persists the session. */
  const currentSessionTitle = useBuilder((s) => s.sessionTitle);
  const startNewSession = useBuilder((s) => s.startNewSession);

  /* Local store = primary, always-present source of truth. */
  const localSessions = useSessionStore((s) => s.sessions);
  const renameLocal = useSessionStore((s) => s.renameSession);
  const deleteLocal = useSessionStore((s) => s.deleteSession);

  /* Cloud is optional. When Firebase isn't configured, projects is [] and
     these are graceful no-ops, so the drawer still works fully offline. */
  const { projects, loadProject, deleteProject } = useCloudStorage();

  const [query, setQuery] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  /* Esc dismiss */
  useEffect(() => {
    if (!sessionsDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !renamingId) {
        setSessionsDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sessionsDrawerOpen, renamingId, setSessionsDrawerOpen]);

  /* Lock body scroll while open */
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (sessionsDrawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [sessionsDrawerOpen]);

  /* Merged, deduped, newest-first list. Local rows win over cloud rows
     with the same id (local is the live, in-session copy). Cloud-only
     rows (saved on another device) are appended. The current in-progress
     session is guaranteed present even before the first debounced save
     fires, so an active build never shows an empty drawer. */
  const sessions = useMemo<DrawerSession[]>(() => {
    const byId = new Map<string, DrawerSession>();

    for (const s of localSessions) byId.set(s.id, fromLocal(s));

    for (const p of projects) {
      if (byId.has(p.id)) continue;
      byId.set(p.id, {
        id: p.id,
        name: p.name,
        updatedAt: p.updatedAt,
        snapshot: p.snapshot as LocalSessionSnapshot,
        isLocal: false,
      });
    }

    /* Synthesize the active session if it hasn't persisted yet. */
    if (currentSessionId && !byId.has(currentSessionId)) {
      const live = useBuilder.getState();
      byId.set(currentSessionId, {
        id: currentSessionId,
        name: live.sessionTitle ?? "Untitled session",
        updatedAt: new Date(live.lastSavedAt ?? Date.now()),
        snapshot: {
          messages: live.messages,
          blocks: live.blocks,
          headerBlocks: live.headerBlocks,
          sidebarBlocks: live.sidebarBlocks,
          footerBlocks: live.footerBlocks,
          zoneLayouts: live.zoneLayouts,
          designSystem: live.designSystem,
          mode: live.mode,
          density: live.density,
          interfaceType: live.interfaceType,
          selectedComponents: live.selectedComponents,
          colorOverrides: live.colorOverrides,
          activeTemplateId: live.activeTemplateId,
        },
        isLocal: true,
      });
    }

    return [...byId.values()].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }, [localSessions, projects, currentSessionId, currentSessionTitle]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => s.name.toLowerCase().includes(q));
  }, [sessions, query]);

  if (!sessionsDrawerOpen) return null;

  const handleNew = () => {
    startNewSession();
    setSessionsDrawerOpen(false);
  };

  const handleLoad = (session: DrawerSession) => {
    if (renamingId) return;
    /* Loading the already-active session is a no-op aside from closing. */
    if (session.id === currentSessionId) {
      setSessionsDrawerOpen(false);
      return;
    }
    if (session.isLocal) {
      restoreSnapshot(session);
    } else {
      /* Cloud-only row: reuse the firebase loader (rebuilds a SavedProject
         shape from the same fields). */
      loadProject({
        id: session.id,
        name: session.name,
        createdAt: session.updatedAt,
        updatedAt: session.updatedAt,
        snapshot: session.snapshot,
      });
    }
    setSessionsDrawerOpen(false);
  };

  const handleRenameStart = (session: DrawerSession) => {
    setRenamingId(session.id);
    setRenameValue(session.name);
  };

  const handleRenameCommit = (session: DrawerSession) => {
    const next = renameValue.trim();
    setRenamingId(null);
    if (!next || next === session.name) return;

    /* Local store is the source of truth: rename any session by id,
       active or not. This is the fix for the previously-broken rename
       (which silently skipped non-active sessions). */
    renameLocal(session.id, next);

    /* If the renamed session is the one open in the canvas, keep the live
       title in sync so the next autosave doesn't overwrite the new name. */
    if (session.id === currentSessionId) {
      useBuilder.getState().setSessionTitle(next);
    }
  };

  const handleDelete = (session: DrawerSession) => {
    if (!window.confirm(`Delete "${session.name}"? This cannot be undone.`)) {
      return;
    }
    deleteLocal(session.id);
    /* Best-effort cloud cleanup; no-op when Firebase isn't configured. */
    void deleteProject(session.id);
    if (session.id === currentSessionId) {
      /* If the active session was deleted, reset to a fresh canvas. */
      startNewSession();
    }
  };

  return (
    <div
      className="sessions-drawer-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sessions-drawer-title"
      onClick={() => setSessionsDrawerOpen(false)}
    >
      <aside
        className="sessions-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sessions-drawer-header">
          <div>
            <h2 id="sessions-drawer-title" className="sessions-drawer-title">
              Sessions
            </h2>
            <p className="sessions-drawer-subtitle">
              Saved on this device. Click any to resume.
            </p>
          </div>
          <button
            type="button"
            className="sessions-drawer-close"
            onClick={() => setSessionsDrawerOpen(false)}
            aria-label="Close drawer (Esc)"
            title="Close (Esc)"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </header>

        <button
          type="button"
          className="sessions-new-btn"
          onClick={handleNew}
        >
          <span className="material-symbols-outlined" aria-hidden="true">add</span>
          New session
        </button>

        {sessions.length > 2 && (
          <div className="sessions-search">
            <span className="material-symbols-outlined sessions-search-icon" aria-hidden="true">search</span>
            <input
              type="text"
              className="sessions-search-input"
              placeholder="Search sessions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search sessions"
            />
          </div>
        )}

        <div className="sessions-list" role="list">
          {sessions.length === 0 && (
            <div className="sessions-empty">
              No sessions yet. Build something - it&apos;ll save automatically.
            </div>
          )}
          {sessions.length > 0 && filtered.length === 0 && (
            <div className="sessions-empty">No sessions match &ldquo;{query}&rdquo;.</div>
          )}

          {filtered.map((session) => {
            const isActive = session.id === currentSessionId;
            const isRenaming = renamingId === session.id;
            return (
              <div
                key={session.id}
                className={`sessions-row ${isActive ? "is-active" : ""}`}
                role="listitem"
              >
                <button
                  type="button"
                  className="sessions-row-main"
                  onClick={() => handleLoad(session)}
                  onDoubleClick={() => handleRenameStart(session)}
                  disabled={isRenaming}
                  aria-label={`Load session ${session.name}`}
                >
                  <span className="sessions-row-icon material-symbols-outlined" aria-hidden="true">
                    {isActive ? "radio_button_checked" : "chat_bubble"}
                  </span>
                  {isRenaming ? (
                    <input
                      type="text"
                      className="sessions-row-rename-input"
                      value={renameValue}
                      autoFocus
                      onChange={(e) => setRenameValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={() => handleRenameCommit(session)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameCommit(session);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      aria-label={`Rename session ${session.name}`}
                    />
                  ) : (
                    <span className="sessions-row-title">{session.name}</span>
                  )}
                  <span className="sessions-row-timestamp">
                    {session.updatedAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </button>

                {!isRenaming && (
                  <div className="sessions-row-actions">
                    <button
                      type="button"
                      className="sessions-row-action"
                      onClick={() => handleRenameStart(session)}
                      aria-label={`Rename ${session.name}`}
                      title="Rename"
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">edit</span>
                    </button>
                    <button
                      type="button"
                      className="sessions-row-action sessions-row-action--danger"
                      onClick={() => handleDelete(session)}
                      aria-label={`Delete ${session.name}`}
                      title="Delete"
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
