/* ════════════════════════════════════════════════════════════
   Builder chat deep-link prompt auto-fire.
   ════════════════════════════════════════════════════════════
   /builder?prompt=<text> stages the text and auto-fires handleSend
   exactly ONCE on mount (one-shot ref + messages.length===0 guard),
   then cleans the URL so a refresh does not re-stage. With Claude on
   (anthropicConfigured) the prompt routes through the AI-first
   handleSend path: an app-like prompt that names no audience gets the
   one pre-build "who is this for?" question first (NO build yet); a
   prompt that names an audience (or is not app-like) reaches the real
   model build (sendToAPI === the mocked sendMessage). It must NEVER add
   the offline "which design system?" onboarding question when AI is on.

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
  it("fires handleSend once with the decoded prompt; an app-like prompt with no audience defers to the one audience question, not a build (AI on)", () => {
    window.history.replaceState({}, "", "/builder?prompt=build%20a%20dashboard");
    reset({ anthropicConfigured: true });

    vi.useFakeTimers();
    mountPanel();
    // The effect schedules handleSend via setTimeout(...,50). Flush it.
    act(() => {
      vi.advanceTimersByTime(60);
    });
    vi.useRealTimers();

    // handleSend ran exactly once with the DECODED text: the user turn is
    // recorded before the audience gate, so exactly one matching turn proves it.
    expect(
      userMessages().filter((m) => m === "build a dashboard"),
    ).toHaveLength(1);

    // "dashboard" is app-like with no audience signal -> the ONE pre-build
    // audience question fires, and NO model build runs yet (sendMessage idle).
    expect(
      aiMessages().some((m) => m.toLowerCase().includes("who is this for")),
    ).toBe(true);
    expect(sendMessage).not.toHaveBeenCalled();

    // AI on -> the offline "which design system?" onboarding was NOT added.
    expect(aiMessages().some((m) => m.includes(DS_QUESTION))).toBe(false);

    // The prompt param was stripped so a refresh would not re-stage.
    expect(window.location.search).not.toContain("prompt=");
  });

  it("a deep-linked prompt that names an audience reaches the real model build (sendMessage), bypassing the audience gate", () => {
    // "internal ... for the team" carries an audience signal, so audienceUnguessable
    // is false and handleSend falls through to the build path -> sendToAPI (the
    // mocked sendMessage). This is the assertion that proves the deep link can
    // actually trigger a build, not merely run handleSend.
    window.history.replaceState(
      {},
      "",
      "/builder?prompt=an%20internal%20admin%20dashboard%20for%20the%20team",
    );
    reset({ anthropicConfigured: true });

    vi.useFakeTimers();
    mountPanel();
    act(() => {
      vi.advanceTimersByTime(60);
    });
    vi.useRealTimers();

    expect(
      userMessages().filter(
        (m) => m === "an internal admin dashboard for the team",
      ),
    ).toHaveLength(1);
    // Audience already named -> no "who is this for?" interruption.
    expect(
      aiMessages().some((m) => m.toLowerCase().includes("who is this for")),
    ).toBe(false);
    // The real build path ran: the API send was invoked.
    expect(sendMessage).toHaveBeenCalled();
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
