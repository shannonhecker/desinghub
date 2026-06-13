/* ════════════════════════════════════════════════════════════
   Builder chat AI-first routing.
   ════════════════════════════════════════════════════════════
   When Claude IS available (anthropicConfigured), additive build/add
   intents ("add buttons", "build a dashboard") must fall through to the
   model (sendToAPI) instead of the local LAYOUT_PRESETS / component-group
   skeleton, so results are real and contextual. The local keyword pipeline
   is the OFFLINE fallback only. Destructive ops (clear/remove) stay instant
   and deterministic even with AI on.

   Uses react-dom/client + React act() directly (no RTL in the repo).
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
   never fires and we isolate the keyword-vs-Claude routing decision. */
const STARTED_MESSAGES = [
  { role: "user", content: "hi" },
  { role: "ai", content: "hello" },
] as never;

function reset(opts: { anthropicConfigured: boolean }) {
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

describe("Builder chat AI-first routing", () => {
  it("routes an additive 'add buttons' to Claude when AI is available", () => {
    reset({ anthropicConfigured: true });
    mountPanel();
    send("add buttons");
    // Fell through to the model, not the local component-group skeleton.
    expect(sendMessage).toHaveBeenCalledTimes(1);
    // The local pipeline did NOT mutate the canvas selection.
    expect(useBuilder.getState().selectedComponents).toEqual([]);
  });

  it("builds 'add buttons' locally (no network) when AI is unavailable", () => {
    reset({ anthropicConfigured: false });
    mountPanel();
    send("add buttons");
    // Offline fallback: the local pipeline applied, no model call.
    expect(sendMessage).not.toHaveBeenCalled();
    expect(useBuilder.getState().selectedComponents.length).toBeGreaterThan(0);
  });

  it("keeps a destructive 'clear all' instant and local even with AI on", () => {
    reset({ anthropicConfigured: true });
    useBuilder.setState({
      selectedComponents: ["button"],
      blocks: [{ id: "b1", type: "SimulatedButton" }],
    } as never);
    mountPanel();
    send("clear all");
    // Deterministic destructive op resolved client-side, no model call.
    expect(sendMessage).not.toHaveBeenCalled();
    expect(useBuilder.getState().blocks).toEqual([]);
  });
});
