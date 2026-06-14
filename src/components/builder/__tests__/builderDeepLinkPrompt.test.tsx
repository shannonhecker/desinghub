/* ════════════════════════════════════════════════════════════
   Builder chat deep-link prompt auto-fire.
   ════════════════════════════════════════════════════════════
   /builder?prompt=<text> stages the text and fires ONE build on
   mount. With Claude available (anthropicConfigured) and an empty
   conversation, the deep-linked prompt routes through the AI-first
   handleSend path - it must NOT add the offline "which design
   system?" onboarding question, and it must fire exactly once
   (one-shot ref + messages.length===0 guard). The URL is cleaned
   afterwards so a refresh does not re-stage.

   Uses react-dom/client + React act() directly (no RTL in the repo),
   mirroring builderAiFirst.test.tsx.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useBuilder } from "@/store/useBuilder";

const sendMessage = vi.fn(() => Promise.resolve());

vi.mock("@/lib/useChatAPI", () => ({
  useChatAPI: () => ({
    sendMessage,
    abort: vi.fn(),
    retrySeconds: null,
    failedSend: null,
    retryFailedSend: vi.fn(),
  }),
  CHAT_ERROR_PREFIXES: [],
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

/* The offline onboarding question handleSend can emit on a first turn.
   We assert this string is NEVER added when AI is on + a prompt deep-links. */
const DS_QUESTION = "which design system";

function reset(opts: { anthropicConfigured: boolean }) {
  useBuilder.setState({
    messages: [], // empty - the canonical first-turn signal the effect guards on
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
      anthropicConfigured: opts.anthropicConfigured,
      firebaseConfigured: true,
    },
  } as never);
}

beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  sendMessage.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  if (root) {
    const r = root;
    act(() => r.unmount());
    root = null;
  }
  container?.remove();
  container = null;
  // Restore a clean URL between tests.
  window.history.replaceState({}, "", "/builder");
});

function mountPanel() {
  act(() => {
    root = createRoot(container!);
    root.render(<ChatPanel />);
  });
}

/** AI messages currently in the store. */
function aiMessages(): string[] {
  return (useBuilder.getState().messages as { role: string; content: string }[])
    .filter((m) => m.role === "ai")
    .map((m) => m.content);
}
/** User messages currently in the store. */
function userMessages(): string[] {
  return (useBuilder.getState().messages as { role: string; content: string }[])
    .filter((m) => m.role === "user")
    .map((m) => m.content);
}

describe("Builder chat deep-link ?prompt= auto-fire", () => {
  it("fires handleSend once with the decoded prompt and never asks the DS question (AI on)", () => {
    window.history.replaceState({}, "", "/builder?prompt=build%20a%20dashboard");
    reset({ anthropicConfigured: true });

    vi.useFakeTimers();
    mountPanel();
    // The effect schedules handleSend via setTimeout(...,50). Flush it.
    act(() => {
      vi.advanceTimersByTime(60);
    });
    vi.useRealTimers();

    // handleSend ran exactly once with the DECODED text: the build path always
    // records the user turn, so exactly one matching user message proves it.
    expect(
      userMessages().filter((m) => m === "build a dashboard"),
    ).toHaveLength(1);

    // AI on -> the offline "which design system?" onboarding was NOT added.
    expect(aiMessages().some((m) => m.includes(DS_QUESTION))).toBe(false);

    // The prompt param was stripped so a refresh would not re-stage.
    expect(window.location.search).not.toContain("prompt=");
  });

  it("preserves sibling params (?ds) when cleaning the prompt param", () => {
    window.history.replaceState(
      {},
      "",
      "/builder?ds=m3&prompt=build%20a%20dashboard",
    );
    reset({ anthropicConfigured: true });

    vi.useFakeTimers();
    mountPanel();
    act(() => {
      vi.advanceTimersByTime(60);
    });
    vi.useRealTimers();

    expect(window.location.search).not.toContain("prompt=");
    expect(window.location.search).toContain("ds=m3");
  });

  it("does NOT fire when the conversation already has history", () => {
    window.history.replaceState({}, "", "/builder?prompt=build%20a%20dashboard");
    reset({ anthropicConfigured: true });
    // Seed a started conversation: the messages.length===0 guard must block.
    act(() => {
      useBuilder.setState({
        messages: [
          { role: "user", content: "hi" },
          { role: "ai", content: "hello" },
        ],
      } as never);
    });

    vi.useFakeTimers();
    mountPanel();
    act(() => {
      vi.advanceTimersByTime(60);
    });
    vi.useRealTimers();

    // No "build a dashboard" user turn was injected.
    expect(userMessages()).not.toContain("build a dashboard");
    // The URL is left untouched (effect early-returned before cleanup).
    expect(window.location.search).toContain("prompt=");
  });
});
