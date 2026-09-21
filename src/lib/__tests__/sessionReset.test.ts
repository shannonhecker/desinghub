import { describe, it, expect, beforeEach, vi } from "vitest";

const toasts: { message: string; opts?: { action?: { label: string; onClick: () => void } } }[] = [];
vi.mock("../toast", () => ({
  showToast: (message: string, opts?: { action?: { label: string; onClick: () => void } }) => {
    toasts.push({ message, opts });
  },
}));

import { useBuilder } from "@/store/useBuilder";
import type { Block } from "@/store/useBuilder";
import { initBuilderHistory } from "../builderHistory";
import { startNewSessionWithUndo, clearCanvasWithUndo, sessionIsEmpty } from "../sessionReset";

const card = (id: string): Block => ({ id, type: "SimulatedCard", props: { title: id } });

function seed() {
  useBuilder.getState().startNewSession();
  useBuilder.setState({
    blocks: [card("c1"), card("c2")],
    headerBlocks: [card("h1")],
    messages: [{ id: "m1", role: "user", content: "build a dashboard", timestamp: 1 }],
    currentSessionId: "sess-1",
    sessionTitle: "My dashboard",
    activeTemplateId: "analytics-dashboard",
  } as never);
}

beforeEach(() => {
  toasts.length = 0;
  seed();
});

describe("sessionIsEmpty", () => {
  it("is false with content and true after a wipe", () => {
    expect(sessionIsEmpty()).toBe(false);
    useBuilder.getState().startNewSession();
    expect(sessionIsEmpty()).toBe(true);
  });
});

describe("startNewSessionWithUndo", () => {
  it("wipes the session and the toast's Undo restores canvas, transcript and session identity", () => {
    startNewSessionWithUndo();
    let s = useBuilder.getState();
    expect(s.blocks).toEqual([]);
    expect(s.messages).toEqual([]);
    expect(s.currentSessionId).toBeNull();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe("New session started");

    toasts[0].opts?.action?.onClick();
    s = useBuilder.getState();
    expect(s.blocks).toEqual([card("c1"), card("c2")]);
    expect(s.headerBlocks).toEqual([card("h1")]);
    expect(s.messages).toHaveLength(1);
    expect(s.currentSessionId).toBe("sess-1");
    expect(s.sessionTitle).toBe("My dashboard");
    expect(s.activeTemplateId).toBe("analytics-dashboard");
  });

  it("an already-empty session resets silently (nothing to undo)", () => {
    useBuilder.getState().startNewSession();
    startNewSessionWithUndo();
    expect(toasts).toHaveLength(0);
  });
});

describe("clearCanvasWithUndo", () => {
  it("wipes every zone, keeps the transcript, and Undo brings the canvas back", () => {
    const cleanup = initBuilderHistory();
    try {
      clearCanvasWithUndo();
      let s = useBuilder.getState();
      expect(s.blocks).toEqual([]);
      expect(s.headerBlocks).toEqual([]);
      expect(s.activeTemplateId).toBeNull();
      expect(s.messages).toHaveLength(1); // chat is not part of "clear all"
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe("Canvas cleared");

      toasts[0].opts?.action?.onClick();
      s = useBuilder.getState();
      expect(s.blocks).toEqual([card("c1"), card("c2")]);
      expect(s.headerBlocks).toEqual([card("h1")]);
      expect(s.activeTemplateId).toBe("analytics-dashboard");
    } finally {
      cleanup();
    }
  });

  it("Undo still restores when a later effect pushed an extra (empty) history entry", async () => {
    const cleanup = initBuilderHistory();
    const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
    try {
      clearCanvasWithUndo();
      await frame(); // muted capture re-anchors to the post-clear state
      useBuilder.getState().setSelectedComponents([]); // fresh ref → new tracked change
      await frame(); // pushes a post-clear (empty) entry onto the stack
      toasts[0].opts?.action?.onClick();
      const s = useBuilder.getState();
      expect(s.blocks).toEqual([card("c1"), card("c2")]);
      expect(s.headerBlocks).toEqual([card("h1")]);
    } finally {
      cleanup();
    }
  });

  it("an empty canvas clears silently", () => {
    useBuilder.setState({ blocks: [], headerBlocks: [], sidebarBlocks: [], footerBlocks: [] } as never);
    clearCanvasWithUndo();
    expect(toasts).toHaveLength(0);
  });
});
