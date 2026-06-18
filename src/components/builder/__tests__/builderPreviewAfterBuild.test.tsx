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

/* The chrome zones useBuilder ships as DEFAULTS (useBuilder.ts ~L853-865):
   2 header + 4 sidebar + 1 footer block. Tests MUST keep these seeded so the
   "was the canvas empty?" question is asked against a realistic load: the
   four-zone all-empty check the original gate used is always false here, which
   is exactly the dead-gate bug this test now guards. Only `blocks` (the body)
   starts empty and is what an AI build populates. */
const SEEDED_HEADER = [
  { id: "hdr-brand", type: "AppBrand" },
  { id: "hdr-status", type: "StatusPill" },
] as never;
const SEEDED_SIDEBAR = [
  { id: "nav-0", type: "NavItem" },
  { id: "nav-1", type: "NavItem" },
  { id: "nav-2", type: "NavItem" },
  { id: "nav-3", type: "NavItem" },
] as never;
const SEEDED_FOOTER = [{ id: "ftr-0", type: "FooterText" }] as never;

function reset(opts: { blocks: unknown[]; messages: unknown[] }) {
  useBuilder.setState({
    messages: opts.messages,
    inputText: "",
    isGenerating: false,
    wizardStep: "done",
    designSystem: "salt",
    blocks: opts.blocks,
    // Realistic seeded chrome, NOT zeroed (that was the false green).
    headerBlocks: SEEDED_HEADER,
    sidebarBlocks: SEEDED_SIDEBAR,
    footerBlocks: SEEDED_FOOTER,
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
  it("flips to Preview on the first build (messages empty) even with seeded chrome zones", async () => {
    // First build = conversation hasn't started yet (messages: []). The chrome
    // zones carry their REALISTIC seeded defaults (set by reset), so this is the
    // exact load the dead four-zone gate failed on. Audience signal word
    // ("customer") keeps the pre-build audience gate from interrupting.
    reset({ blocks: [], messages: [] });
    mountPanel();
    await send("build me a customer dashboard");
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(usePreviewMode.getState().mode).toBe("preview");
  });

  it("REGRESSION: seeded chrome zones + first build still flips (old gate's exact miss)", async () => {
    // Identical to above but stated as the explicit regression: seeded
    // header/sidebar/footer present + a first build that populates `blocks`
    // MUST flip. The original canvasWasEmpty IIFE checked all four zones, so the
    // seeded chrome made it always-false and the flip NEVER fired for a real
    // user. Guards that this is fixed.
    reset({ blocks: [], messages: [] });
    expect(useBuilder.getState().headerBlocks.length).toBeGreaterThan(0);
    expect(useBuilder.getState().sidebarBlocks.length).toBeGreaterThan(0);
    expect(useBuilder.getState().footerBlocks.length).toBeGreaterThan(0);
    mountPanel();
    await send("build me a customer dashboard");
    expect(usePreviewMode.getState().mode).toBe("preview");
  });

  it("does NOT yank to Preview when refining (conversation already started)", async () => {
    // Refinement = messages already populated (messages: STARTED_MESSAGES), so
    // isFirstBuild is false and the user stays in their deliberate edit session.
    reset({ blocks: [{ id: "existing", type: "SimulatedCard" }], messages: STARTED_MESSAGES });
    mountPanel();
    await send("add a chart");
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(usePreviewMode.getState().mode).toBe("edit");
  });
});
