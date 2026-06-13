/* ════════════════════════════════════════════════════════════
   C-429: the 429 rate-limit countdown gates NETWORK sends only.
   ════════════════════════════════════════════════════════════
   Before this fix the top of handleSend blocked ALL sends while a
   countdown ran, AND the send button was disabled — so local keyword
   commands (which never hit /api/chat) were needlessly blocked, and
   moving the gate naively to the sendToAPI call sites would have
   appended the user turn + cleared the input at addMessage() BEFORE
   the gate, orphaning the turn and losing the text.

   This pins the corrected behavior:
   - the send button is ENABLED during a countdown (so locals run);
   - a NETWORK-bound send during a countdown does NOT call the API,
     does NOT lose the typed text (it is re-staged), and surfaces a
     "Rate limit active" turn instead of a silent orphan.

   Uses react-dom/client + act() (no RTL in the repo); heavy siblings
   are mocked, mirroring heroStarterChips.test.tsx.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useBuilder } from "@/store/useBuilder";

/* Mutable countdown so each test can simulate an ACTIVE 429 window. */
const hoisted = vi.hoisted(() => ({
  sendMessage: vi.fn(() => Promise.resolve()),
  state: { retrySeconds: null as number | null },
}));

vi.mock("@/lib/useChatAPI", () => ({
  useChatAPI: () => ({
    sendMessage: hoisted.sendMessage,
    abort: vi.fn(),
    retrySeconds: hoisted.state.retrySeconds,
    failedSend: null,
    retryFailedSend: vi.fn(),
  }),
}));
vi.mock("react-markdown", () => ({ default: () => null }));
vi.mock("../FadingWords", () => ({ FadingWords: () => null }));
vi.mock("../LifecyclePill", () => ({ LifecyclePill: () => null }));
vi.mock("../cards/ToolUseCard", () => ({ ToolUseCard: () => null }));
vi.mock("../ConversationalOnboarding", () => ({ ConversationalOnboarding: () => null }));
vi.mock("../TemplateCardsMessage", () => ({ TemplateCardsMessage: () => null }));
vi.mock("@/lib/regenerateTemplateContent", () => ({ regenerateTemplateContent: vi.fn() }));
vi.mock("@/lib/toolUseEvents", () => ({ subscribeToolUse: () => () => {} }));

import { ChatPanel } from "../ChatPanel";

let root: Root | null = null;
let container: HTMLDivElement | null = null;

beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  hoisted.sendMessage.mockClear();
  hoisted.state.retrySeconds = null;
  useBuilder.setState({
    messages: [{ id: "seed", role: "ai", content: "hi" }] as never,
    inputText: "",
    isGenerating: false,
    wizardStep: "done",
    designSystem: "salt",
    blocks: [], headerBlocks: [], sidebarBlocks: [], footerBlocks: [],
    activeTemplateId: null, pendingTemplateId: null,
    pendingFirstMessage: null, pendingAudience: null,
    previewOpen: true, selectedBlockId: null, selectedBlockZone: null,
    builtViaWizard: false,
    /* AI available so a freeform message routes to the network path. */
    backendStatus: { anthropicConfigured: true, firebaseConfigured: true } as never,
  });
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  if (root) { const r = root; act(() => r.unmount()); root = null; }
  container?.remove();
  container = null;
});

function mountPanel() {
  act(() => { root = createRoot(container!); root.render(<ChatPanel />); });
}
function sendBtn(): HTMLButtonElement | null {
  return container!.querySelector<HTMLButtonElement>("button.send-btn");
}

describe("C-429: countdown gates network sends only", () => {
  it("leaves the send button ENABLED during a countdown when there is text", () => {
    hoisted.state.retrySeconds = 23;
    useBuilder.setState({ inputText: "tell me about accessibility" });
    mountPanel();
    const btn = sendBtn();
    expect(btn).not.toBeNull();
    // Pre-fix this was disabled (retrySeconds !== null); now only !hasText disables.
    expect(btn!.disabled).toBe(false);
    expect(btn!.getAttribute("aria-label") ?? "").toMatch(/local commands run now/i);
  });

  it("disables the send button only when there is no text (countdown or not)", () => {
    hoisted.state.retrySeconds = 23;
    useBuilder.setState({ inputText: "" });
    mountPanel();
    expect(sendBtn()!.disabled).toBe(true);
  });

  it("defers a network send during a countdown without losing the text or calling the API", () => {
    hoisted.state.retrySeconds = 23;
    const msg = "tell me about accessibility";
    useBuilder.setState({ inputText: msg });
    mountPanel();
    act(() => { sendBtn()!.click(); });

    const s = useBuilder.getState();
    // No network call fired.
    expect(hoisted.sendMessage).not.toHaveBeenCalled();
    // Text is re-staged (not lost) so the user can resend when it clears.
    expect(s.inputText).toBe(msg);
    // A feedback turn was surfaced instead of an orphaned user turn.
    const ai = s.messages.filter((m) => m.role === "ai").map((m) => m.content).join("\n");
    expect(ai).toMatch(/rate limit active/i);
  });

  it("calls the API normally when there is NO countdown", () => {
    hoisted.state.retrySeconds = null;
    useBuilder.setState({ inputText: "tell me about accessibility" });
    mountPanel();
    act(() => { sendBtn()!.click(); });
    expect(hoisted.sendMessage).toHaveBeenCalledTimes(1);
  });
});
