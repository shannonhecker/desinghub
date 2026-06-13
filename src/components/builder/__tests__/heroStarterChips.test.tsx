/* ════════════════════════════════════════════════════════════
   Hero starter chips (builder UX).
   ════════════════════════════════════════════════════════════
   The chatbox-first hero offers 4 one-click starter chips. Each
   chip now seeds the FULL rich template from the canonical registry
   (BUILDER_TEMPLATES) via applyTemplateById - the same path that
   "Browse templates" uses - instead of firing handleSend() into the
   thin LAYOUT_PRESETS skeleton (which dropped a new user onto a
   sparse placeholder). This asserts the chips render and that one
   click lands a populated template in the chip's own design system.

   Uses react-dom/client + React act() directly (no RTL in the repo).
   Heavy siblings (chat API, markdown, onboarding, tool-use cards)
   are mocked - this test targets the hero block only.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useBuilder } from "@/store/useBuilder";

const sendMessage = vi.fn(() => Promise.resolve());

vi.mock("@/lib/useChatAPI", () => ({
  /* Mirror the REAL hook's full return shape (retrySeconds / failedSend /
     retryFailedSend) so the send gate reads as inactive in the test. */
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
vi.mock("../TemplateCardsMessage", () => ({
  TemplateCardsMessage: () => null,
}));
vi.mock("@/lib/regenerateTemplateContent", () => ({
  regenerateTemplateContent: vi.fn(),
}));
vi.mock("@/lib/toolUseEvents", () => ({
  subscribeToolUse: () => () => {},
}));

import { ChatPanel } from "../ChatPanel";

let root: Root | null = null;
let container: HTMLDivElement | null = null;

beforeEach(() => {
  // jsdom has no scrollIntoView.
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  sendMessage.mockClear();
  useBuilder.setState({
    messages: [],
    inputText: "",
    isGenerating: false,
    wizardStep: "done",
    designSystem: "salt",
    blocks: [],
    headerBlocks: [],
    sidebarBlocks: [],
    footerBlocks: [],
    activeTemplateId: null,
    pendingTemplateId: null,
    pendingFirstMessage: null,
    pendingAudience: null,
    previewOpen: false,
    selectedBlockId: null,
    selectedBlockZone: null,
    builtViaWizard: false,
  });
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

function getChips(): HTMLButtonElement[] {
  return Array.from(
    container!.querySelectorAll<HTMLButtonElement>(
      ".hero-starter-chips .prompt-bubble",
    ),
  );
}

describe("Hero starter chips", () => {
  it("renders 4 starter chips on the empty-state hero", () => {
    mountPanel();
    const chips = getChips();
    expect(chips.length).toBe(4);
    for (const chip of chips) {
      const copy = chip.textContent ?? "";
      expect(copy.trim().length).toBeGreaterThan(0);
      // No em or en dashes in display copy (house rule).
      expect(copy).not.toMatch(/[–—]/);
    }
  });

  it("seeds the full rich template in one click, in the chip's design system", () => {
    mountPanel();
    const chips = getChips();
    const settingsChip = chips.find((c) =>
      /settings page/i.test(c.textContent ?? ""),
    );
    expect(settingsChip).toBeDefined();

    act(() => settingsChip!.click());

    const s = useBuilder.getState();
    // The full registry template was applied (not the thin LAYOUT_PRESETS skeleton).
    expect(s.activeTemplateId).toBe("settings-page");
    // A substantial body was seeded, so the user lands on a believable app.
    expect(s.blocks.length).toBeGreaterThan(10);
    // The chip's named design system is live.
    expect(s.designSystem).toBe("m3");
    // No blocking question was injected - one click means a build.
    const allAi = s.messages.filter((m) => m.role === "ai");
    for (const m of allAi) {
      expect(m.content).not.toMatch(/which design system/i);
      expect(m.content).not.toMatch(/who is this for/i);
    }
  });

  it("hides the starter chips once a template has been applied", () => {
    mountPanel();
    const chips = getChips();
    act(() => chips[0]!.click());
    expect(getChips().length).toBe(0);
  });
});
