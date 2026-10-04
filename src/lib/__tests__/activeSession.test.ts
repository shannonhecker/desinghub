import { describe, it, expect, beforeEach } from "vitest";
import { ACTIVE_SESSION_KEY, rememberActiveSession, readActiveSessionId, resumeActiveSession } from "../activeSession";
import { buildLocalSessionSnapshot } from "../localSession";
import { useBuilder } from "@/store/useBuilder";
import { useSessionStore } from "@/store/useSessionStore";
import type { Block } from "@/store/useBuilder";

const chart: Block = { id: "c1", type: "HighchartColumn", props: { title: "VaR by fund" } };

/** Save a session holding one chart, then go back to a fresh, session-less
 *  builder - the state a page reload starts in. */
function saveSessionThenReload(id = "sess-1") {
  useBuilder.setState({ blocks: [chart], currentSessionId: id, sessionTitle: "Risk review" } as never);
  useSessionStore.getState().upsertSession({ id, name: "Risk review", snapshot: buildLocalSessionSnapshot(useBuilder.getState()) });
  rememberActiveSession(id);
  useBuilder.setState({ blocks: [], currentSessionId: null, sessionTitle: null } as never);
}

beforeEach(() => {
  localStorage.clear();
  useSessionStore.setState({ sessions: [] });
  useBuilder.setState({ blocks: [], currentSessionId: null, sessionTitle: null, pages: [], activePageId: null } as never);
});

describe("activeSession - a refresh comes back to the open session", () => {
  it("remembers and forgets the open session id", () => {
    rememberActiveSession("sess-9");
    expect(localStorage.getItem(ACTIVE_SESSION_KEY)).toBe("sess-9");
    expect(readActiveSessionId()).toBe("sess-9");
    rememberActiveSession(null);
    expect(readActiveSessionId()).toBeNull();
  });

  it("reopens the remembered session with its canvas", () => {
    saveSessionThenReload();
    expect(resumeActiveSession("")).toBe(true);
    const s = useBuilder.getState();
    expect(s.currentSessionId).toBe("sess-1");
    expect(s.sessionTitle).toBe("Risk review");
    expect(s.blocks).toEqual([chart]);
  });

  it("does nothing when no session was open (a refresh after New session stays clean)", () => {
    saveSessionThenReload();
    rememberActiveSession(null);
    expect(resumeActiveSession("")).toBe(false);
    expect(useBuilder.getState().blocks).toEqual([]);
  });

  it("does not replace a session that is already running", () => {
    saveSessionThenReload();
    useBuilder.setState({ currentSessionId: "sess-other", blocks: [] } as never);
    expect(resumeActiveSession("")).toBe(false);
    expect(useBuilder.getState().currentSessionId).toBe("sess-other");
  });

  it("yields to a URL that carries its own starting state", () => {
    for (const search of ["?shared=abc", "?preview=1", "?prompt=a%20dashboard", "?ds=carbon"]) {
      saveSessionThenReload();
      expect(resumeActiveSession(search), search).toBe(false);
      expect(useBuilder.getState().currentSessionId).toBeNull();
    }
  });

  it("forgets a remembered session that no longer exists", () => {
    saveSessionThenReload();
    useSessionStore.getState().deleteSession("sess-1");
    expect(resumeActiveSession("")).toBe(false);
    expect(readActiveSessionId()).toBeNull();
  });
});
