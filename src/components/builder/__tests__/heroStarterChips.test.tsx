/* ════════════════════════════════════════════════════════════
   Hero starter-prompt chips (builder UX quick win QW6).
   ════════════════════════════════════════════════════════════
   The chatbox-first hero previously offered zero one-click example
   prompts. This asserts 4 starter chips render under the hero
   subtitle, each firing the EXISTING send pipeline in one tap, with
   copy that names a template pattern + a design system keyword and
   carries an audience signal so the pre-build audience gate never
   interrupts the click.

   Uses react-dom/client + React act() directly (no RTL in the repo).
   Heavy siblings (chat API, markdown, onboarding, tool-use cards)
   are mocked - this test targets the hero block only.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useBuilder } from "@/store/useBuilder";
import { audienceUnguessable } from "@/lib/assumptionDims";

const sendMessage = vi.fn(() => Promise.resolve());

vi.mock("@/lib/useChatAPI", () => ({
  /* Mirror the REAL hook's full return shape (QW4 added retrySeconds /
     failedSend / retryFailedSend): a partial double left retrySeconds
     undefined, which read as an active send gate and no-opped handleSend. */
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

describe("Hero starter-prompt chips (QW6)", () => {
  it("renders 4 starter chips on the empty-state hero", () => {
    mountPanel();
    const chips = getChips();
    expect(chips.length).toBe(4);
    for (const chip of chips) {
      const copy = chip.textContent ?? "";
      // Every chip names a design system so the DS keyword fast-path
      // applies it before the build.
      expect(copy).toMatch(/salt|material 3|fluent|uoaui/i);
      // No em or en dashes in display copy (house rule).
      expect(copy).not.toMatch(/[–—]/);
      // Copy must not trip the pre-build audience gate - one click
      // means a build, not another question.
      expect(audienceUnguessable(copy)).toBe(false);
    }
  });

  it("fires the existing send pipeline in one click, with no follow-up question", () => {
    mountPanel();
    const chips = getChips();
    const settingsChip = chips.find((c) =>
      /settings page/i.test(c.textContent ?? ""),
    );
    expect(settingsChip).toBeDefined();

    act(() => settingsChip!.click());

    const s = useBuilder.getState();
    // The chip text became the user's first message.
    expect(s.messages[0]?.role).toBe("user");
    expect(s.messages[0]?.content).toBe(settingsChip!.textContent);
    // DS keyword fast-path applied the named system.
    expect(s.designSystem).toBe("m3");
    // No blocking question was injected.
    const allAi = s.messages.filter((m) => m.role === "ai");
    for (const m of allAi) {
      expect(m.content).not.toMatch(/which design system/i);
      expect(m.content).not.toMatch(/who is this for/i);
    }
  });

  it("hides the starter chips once the conversation has started", () => {
    mountPanel();
    const chips = getChips();
    act(() => chips[0]!.click());
    expect(getChips().length).toBe(0);
  });
});
