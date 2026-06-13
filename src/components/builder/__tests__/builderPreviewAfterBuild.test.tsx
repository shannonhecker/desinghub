/* ════════════════════════════════════════════════════════════
   Preview-default after the first AI build.
   ════════════════════════════════════════════════════════════
   Lovable-style "see your real app": when an AI build populates a
   previously-empty canvas, the builder flips to Preview mode so the
   user sees REAL design-system components instead of the edit-mode
   Simulated* facsimiles (mirrors applyTemplateToCanvas). Scoped to the
   empty -> content transition so a later refinement never yanks the
   user out of a deliberate edit session.

   Uses react-dom/client + React act() directly (no RTL in the repo).
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useBuilder } from "@/store/useBuilder";
import { usePreviewMode } from "@/store/usePreviewMode";

/* The model call "builds" by populating the canvas, then resolves -
   exactly what applyAIActions does in production when actions stream in. */
const sendMessage = vi.fn(async () => {
  useBuilder.getState().setBlocks([
    { id: "ai-1", type: "SimulatedButton" },
  ] as never);
});

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

const STARTED_MESSAGES = [
  { role: "user", content: "hi" },
  { role: "ai", content: "hello" },
] as never;

function reset(blocks: unknown[]) {
  useBuilder.setState({
    messages: STARTED_MESSAGES,
    inputText: "",
    isGenerating: false,
    wizardStep: "done",
    designSystem: "salt",
    blocks,
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
    backendStatus: { anthropicConfigured: true, firebaseConfigured: true },
  } as never);
  usePreviewMode.setState({ mode: "edit" } as never);
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

async function send(text: string) {
  act(() => {
    useBuilder.setState({ inputText: text } as never);
  });
  const ta = container!.querySelector("textarea")!;
  await act(async () => {
    ta.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    // Flush the sendToAPI promise + its .then (preview flip).
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("Preview-default after the first AI build", () => {
  it("flips to Preview when an AI build populates an empty canvas", async () => {
    reset([]); // empty canvas
    mountPanel();
    await send("build me a dashboard");
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(usePreviewMode.getState().mode).toBe("preview");
  });

  it("does NOT yank to Preview when refining an already-populated canvas", async () => {
    reset([{ id: "existing", type: "SimulatedCard" }]); // canvas already has content
    mountPanel();
    await send("add a chart");
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(usePreviewMode.getState().mode).toBe("edit");
  });
});
