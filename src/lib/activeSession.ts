/**
 * activeSession - remember which session was open, so a refresh comes back
 * to it.
 *
 * useLocalAutoSave already writes every session to localStorage, but a
 * reload always started on the empty start screen: the work was in the
 * Sessions drawer, yet to the user it looked lost. The id of the session
 * that is open is kept beside the saved sessions and reopened on load.
 *
 * Starting a new session clears the id, so a refresh after "New session"
 * still starts clean.
 */

import { useBuilder } from "@/store/useBuilder";
import { useSessionStore } from "@/store/useSessionStore";
import { restoreLocalSession } from "./localSession";

export const ACTIVE_SESSION_KEY = "uoaui-active-session";

/* A URL that hands the builder its own starting state (a shared canvas, the
   pop-out preview, a landing-page prompt, an explicit design system) wins
   over reopening the last session. */
const HANDOFF_PARAMS = ["shared", "preview", "prompt", "ds", "type", "components"] as const;

/** Record (or, with null, forget) the session that is open. Storage can be
 *  unavailable (private mode, quota): losing the pointer only costs the
 *  resume, so failures are swallowed. */
export function rememberActiveSession(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_SESSION_KEY, id);
    else localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function readActiveSessionId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_SESSION_KEY);
  } catch {
    return null;
  }
}

/** Reopen the session that was open before the page was reloaded.
 *
 *  Does nothing - and returns false - when a session is already running,
 *  the URL carries its own starting state, or the remembered session no
 *  longer exists (deleted, or pushed out by the session cap). */
export function resumeActiveSession(search: string): boolean {
  if (useBuilder.getState().currentSessionId) return false;
  const params = new URLSearchParams(search);
  if (HANDOFF_PARAMS.some((p) => params.has(p))) return false;
  const id = readActiveSessionId();
  if (!id) return false;
  const session = useSessionStore.getState().getSession(id);
  if (!session) {
    rememberActiveSession(null);
    return false;
  }
  return restoreLocalSession(session);
}
