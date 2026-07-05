/* ════════════════════════════════════════════════════════════
   Offline mention guard.
   ════════════════════════════════════════════════════════════
   The offline add branch fires on ANY component mention, and the
   alsoAddIds duplicate path used to fire with it, so a message that
   merely mentions a type already on canvas ("the table looks wrong")
   landed a real duplicate block. Duplicates must require an explicit
   additive verb; bare mentions and edit verbs stay canvas no-ops.
   Companion guard: an explicit removal that matches nothing on canvas
   must reply honestly instead of reporting success and desyncing the
   wizard pick list.

   Uses react-dom/client + React act() directly (no RTL in the repo).
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useBuilder } from "@/store/useBuilder";
import type { Block } from "@/store/useBuilder";

const sendMessage = vi.fn(() => Promise.resolve());

vi.mock("@/lib/useChatAPI", () => ({
  /* The lifecycle effect scans the last AI message once generation
     settles, so the error-prefix list must exist on the mock. */
  CHAT_ERROR_PREFIXES: [],
  useChatAPI: () => ({
    sendMessage,
    abort: vi.fn(),
    retrySeconds: null,
    failedSend: null,
    retryFailedSend: vi.fn(),
  }),
}));
vi.mock("react-markdown", () => ({ default: () => null }));
vi.mock("../FadingWords", () => ({ FadingWords: () => null }));
vi.mock("../LifecyclePill", () => ({ LifecyclePill: () => null }));
vi.mock("../cards/ToolUseCard", () => ({ ToolUseCard: () => null }));
vi.mock("../ConversationalOnboarding", () => ({
  ConversationalOnboarding: () => null,
}));
vi.mock("../TemplateCardsMessage", () => ({ TemplateCardsMessage: () => null }));
vi.mock("@/lib/regenerateTemplateContent", () => ({
  regenerateTemplateContent: vi.fn(),
}));
vi.mock("@/lib/toolUseEvents", () => ({ subscribeToolUse: () => () => {} }));

import { ChatPanel } from "../ChatPanel";

let root: Root | null = null;
let container: HTMLDivElement | null = null;

/* A started conversation, so the first-freeform onboarding / audience gate
   never fires and we isolate the offline component-command pipeline. */
const STARTED_MESSAGES = [
  { role: "user", content: "hi" },
  { role: "ai", content: "hello" },
] as never;

const TABLE_BLOCK = { id: "t1", type: "SimulatedDataTable", props: {} } as Block;

/* Offline (no API key): the local keyword pipeline handles everything. */
function reset() {
  useBuilder.setState({
    messages: STARTED_MESSAGES,
    inputText: "",
    isGenerating: false,
    wizardStep: "done",
    designSystem: "salt",
    blocks: [],
    headerBlocks: [],
    sidebarBlocks: [],
    footerBlocks: [],
    selectedComponents: [],
    activeTemplateId: null,
    pendingTemplateId: null,
    pendingFirstMessage: null,
    pendingAudience: null,
    previewOpen: true,
    selectedBlockId: null,
    selectedBlockZone: null,
    builtViaWizard: false,
    backendStatus: {
      anthropicConfigured: false,
      firebaseConfigured: true,
    },
  } as never);
}

beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  sendMessage.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  reset();
});

afterEach(() => {
  vi.useRealTimers();
  if (root) {
    const r = root;
    act(() => r.unmount());
    root = null;
  }
  container?.remove();
  container = null;
});

function mountPanel() {
  act(() => {
    root = createRoot(container!);
    root.render(<ChatPanel />);
  });
}

/** Drive a real send: set the store input, then press Enter on the textarea. */
function send(text: string) {
  act(() => {
    useBuilder.setState({ inputText: text } as never);
  });
  const ta = container!.querySelector("textarea")!;
  act(() => {
    ta.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
  });
}

describe("Offline mention guard: bare mentions never land duplicates", () => {
  it("a bare mention of a type already on canvas does not add a duplicate", () => {
    useBuilder.setState({
      blocks: [TABLE_BLOCK],
      selectedComponents: ["table"],
    } as never);
    mountPanel();
    send("the table looks wrong");
    expect(sendMessage).not.toHaveBeenCalled();
    expect(useBuilder.getState().blocks).toHaveLength(1);
  });

  it("an edit verb ('make the table smaller') does not add a duplicate", () => {
    useBuilder.setState({
      blocks: [TABLE_BLOCK],
      selectedComponents: ["table"],
    } as never);
    mountPanel();
    send("make the table smaller");
    expect(useBuilder.getState().blocks).toHaveLength(1);
  });

  it("a move phrasing with a zone does not add a duplicate to that zone", () => {
    useBuilder.setState({
      blocks: [TABLE_BLOCK],
      selectedComponents: ["table"],
    } as never);
    mountPanel();
    send("move the table to the header");
    expect(useBuilder.getState().blocks).toHaveLength(1);
    expect(useBuilder.getState().headerBlocks).toHaveLength(0);
  });

  it("an explicit add of an already-present type still lands a real duplicate", () => {
    useBuilder.setState({
      blocks: [TABLE_BLOCK],
      selectedComponents: ["table"],
    } as never);
    mountPanel();
    send("add another data table");
    const blocks = useBuilder.getState().blocks;
    expect(blocks).toHaveLength(2);
    expect(blocks.every((b) => b.type === "SimulatedDataTable")).toBe(true);
  });
});

describe("Offline removal honesty: a miss never reports success", () => {
  it("removal that matches nothing on canvas replies honestly and keeps state", () => {
    useBuilder.setState({
      sidebarBlocks: [TABLE_BLOCK],
      selectedComponents: ["table"],
    } as never);
    mountPanel();
    vi.useFakeTimers();
    send("remove the table");
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    const msgs = useBuilder.getState().messages as { role: string; content: string }[];
    const last = msgs[msgs.length - 1];
    expect(last.role).toBe("ai");
    expect(last.content).toMatch(/nothing was removed/i);
    expect(last.content).not.toMatch(/^Removed/);
    /* Canvas untouched, wizard pick list NOT desynced. */
    expect(useBuilder.getState().sidebarBlocks).toHaveLength(1);
    expect(useBuilder.getState().selectedComponents).toEqual(["table"]);
  });

  it("removal that matches blocks in the body still removes them", () => {
    useBuilder.setState({
      blocks: [TABLE_BLOCK],
      selectedComponents: ["table"],
    } as never);
    mountPanel();
    send("remove the table");
    expect(useBuilder.getState().blocks).toHaveLength(0);
    expect(useBuilder.getState().selectedComponents).toEqual([]);
  });
});
