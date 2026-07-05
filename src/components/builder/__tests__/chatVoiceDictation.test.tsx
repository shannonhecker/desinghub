/* ════════════════════════════════════════════════════════════
   Voice dictation on the builder chatbox (restores 87377bd).
   ────────────────────────────────────────────────────────────
   Pins the ChatPanel wiring around useSpeechInput:
   • mic renders FIRST in .toolbar-right, coexisting with send
     (NOT the old hasText slot-swap), and only when supported
   • listening state: .active class, aria-pressed, stop glyph,
     "Listening…" placeholder while the composer is empty
   • transcripts append to existing text joined with a space
   • send (click AND Enter) aborts dictation BEFORE the input
     clears so a late onresult cannot resurrect the sent text
   • sr-only role=status region announces Listening / stopped
   • the dormant store pair isVoiceActive/toggleVoice is gone

   Uses react-dom/client + act() (no RTL in the repo); heavy
   siblings are mocked, mirroring sendGate429.test.tsx.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useBuilder } from "@/store/useBuilder";

const hoisted = vi.hoisted(() => ({
  sendMessage: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/useChatAPI", () => ({
  useChatAPI: () => ({
    sendMessage: hoisted.sendMessage,
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
vi.mock("../ConversationalOnboarding", () => ({ ConversationalOnboarding: () => null }));
vi.mock("../TemplateCardsMessage", () => ({ TemplateCardsMessage: () => null }));
vi.mock("@/lib/regenerateTemplateContent", () => ({ regenerateTemplateContent: vi.fn() }));
vi.mock("@/lib/toolUseEvents", () => ({ subscribeToolUse: () => () => {} }));

import { ChatPanel } from "../ChatPanel";

/* ── Scriptable SpeechRecognition stand-in (see useSpeechInput.test) ── */
class MockSpeechRecognition {
  static instances: MockSpeechRecognition[] = [];
  continuous = false;
  interimResults = false;
  maxAlternatives = 0;
  lang = "";
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null = null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null = null;
  start = vi.fn(() => this.onstart?.());
  stop = vi.fn(() => this.onend?.());
  abort = vi.fn(() => this.onend?.());
  constructor() {
    MockSpeechRecognition.instances.push(this);
  }
  emitResult(segments: { text: string; final: boolean }[], resultIndex = 0) {
    const results = segments.map((s) =>
      Object.assign([{ transcript: s.text }], { isFinal: s.final }),
    ) as unknown as SpeechRecognitionResultList;
    this.onresult?.({ resultIndex, results });
  }
}

function installSpeechApi() {
  Object.defineProperty(window, "webkitSpeechRecognition", {
    value: MockSpeechRecognition,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, "isSecureContext", {
    value: true,
    configurable: true,
  });
}

function removeSpeechApi() {
  delete (window as unknown as Record<string, unknown>).SpeechRecognition;
  delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
}

let root: Root | null = null;
let container: HTMLDivElement | null = null;

beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  hoisted.sendMessage.mockClear();
  MockSpeechRecognition.instances = [];
  installSpeechApi();
  useBuilder.setState({
    messages: [{ id: "seed", role: "ai", content: "hi" }] as never,
    chatOpen: true,
    inputText: "",
    isGenerating: false,
    wizardStep: "done",
    designSystem: "salt",
    blocks: [], headerBlocks: [], sidebarBlocks: [], footerBlocks: [],
    activeTemplateId: null, pendingTemplateId: null,
    pendingFirstMessage: null, pendingAudience: null,
    previewOpen: true, selectedBlockId: null, selectedBlockZone: null,
    builtViaWizard: false,
    backendStatus: { anthropicConfigured: true, firebaseConfigured: true } as never,
  });
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  vi.useRealTimers();
  if (root) { const r = root; act(() => r.unmount()); root = null; }
  container?.remove();
  container = null;
  removeSpeechApi();
});

function mountPanel() {
  act(() => { root = createRoot(container!); root.render(<ChatPanel />); });
}
function micBtn(): HTMLButtonElement | null {
  return container!.querySelector<HTMLButtonElement>("button.mic-btn");
}
function textarea(): HTMLTextAreaElement {
  return container!.querySelector<HTMLTextAreaElement>("textarea.input-textarea")!;
}
function statusRegion(): HTMLElement | null {
  return container!.querySelector<HTMLElement>('span.sr-only[role="status"]');
}
function lastInstance(): MockSpeechRecognition {
  const inst = MockSpeechRecognition.instances.at(-1);
  if (!inst) throw new Error("no MockSpeechRecognition instance created");
  return inst;
}
/* Simulates the user TYPING into the controlled textarea: the prototype
   value setter bypasses React's value tracker so the native input event
   reaches onChange with the new value. */
function typeInComposer(value: string) {
  const ta = textarea();
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value",
  )!.set!;
  act(() => {
    setter.call(ta, value);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
/* Mic click, then a permission denial: browsers fire onerror then onend. */
function denyPermission() {
  act(() => micBtn()!.click());
  act(() => {
    const rec = lastInstance();
    rec.onerror?.({ error: "not-allowed" });
    rec.onend?.();
  });
}

describe("voice dictation: rendering", () => {
  it("renders the mic first in toolbar-right, coexisting with send", () => {
    useBuilder.setState({ inputText: "already typed" });
    mountPanel();
    const toolbarRight = container!.querySelector(".toolbar-right")!;
    const mic = micBtn()!;
    expect(mic).not.toBeNull();
    expect(toolbarRight.firstElementChild).toBe(mic);
    expect(mic.getAttribute("type")).toBe("button");
    expect(mic.getAttribute("aria-label")).toBe("Voice input");
    expect(mic.getAttribute("aria-pressed")).toBe("false");
    expect(mic.textContent).toBe("mic");
    /* No slot-swap: send stays visible while the mic is present. */
    expect(container!.querySelector("button.send-btn")).not.toBeNull();
  });

  it("does not render the mic when the Speech API is absent", () => {
    removeSpeechApi();
    mountPanel();
    expect(micBtn()).toBeNull();
    expect(statusRegion()).toBeNull();
  });
});

describe("voice dictation: listening state", () => {
  it("click flips to active with stop glyph, aria-pressed, and Listening placeholder", () => {
    mountPanel();
    act(() => micBtn()!.click());
    const mic = micBtn()!;
    expect(mic.classList.contains("active")).toBe(true);
    expect(mic.getAttribute("aria-pressed")).toBe("true");
    expect(mic.textContent).toBe("stop");
    expect(mic.getAttribute("title")).toBe("Stop dictation");
    expect(textarea().placeholder).toBe("Listening…");
  });

  it("announces Listening then Dictation stopped via the sr-only status region", () => {
    /* Announcements land via a clear-then-fill cycle (see the repeat test
       below), so the region fills after a short timer. */
    vi.useFakeTimers();
    mountPanel();
    act(() => micBtn()!.click());
    act(() => { vi.advanceTimersByTime(60); });
    expect(statusRegion()!.textContent).toBe("Listening");
    act(() => micBtn()!.click());
    act(() => { vi.advanceTimersByTime(60); });
    expect(statusRegion()!.textContent).toBe("Dictation stopped");
    expect(micBtn()!.getAttribute("aria-pressed")).toBe("false");
    vi.useRealTimers();
  });

  it("re-announces a REPEATED identical error status by clearing the region first", () => {
    vi.useFakeTimers();
    mountPanel();
    denyPermission();
    act(() => { vi.advanceTimersByTime(60); });
    expect(statusRegion()!.textContent).toContain("Microphone is blocked");

    /* Same error again (user fixed the wrong site and retried): the
       region must MUTATE or screen readers announce nothing. */
    denyPermission();
    expect(statusRegion()!.textContent).toBe("");
    act(() => { vi.advanceTimersByTime(60); });
    expect(statusRegion()!.textContent).toContain("Microphone is blocked");
    vi.useRealTimers();
  });

  it("exposes the visible mic-error hint to assistive tech (not aria-hidden)", () => {
    mountPanel();
    denyPermission();
    const hint = container!.querySelector(".chat-input-hint")!;
    expect(hint).not.toBeNull();
    expect(hint.textContent).toContain("Microphone is blocked");
    /* The live-region announcement is transient; the hint is the only
       place an SR user can re-read the error afterwards. */
    expect(hint.getAttribute("aria-hidden")).toBeNull();
  });
});

describe("voice dictation: focus management", () => {
  it("returns focus to the composer when the user stops dictation from the mic", () => {
    mountPanel();
    const mic = micBtn()!;
    act(() => { mic.focus(); mic.click(); });
    act(() => { mic.focus(); mic.click(); });
    expect(document.activeElement).toBe(textarea());
  });

  it("does not steal focus when the session ends on its own while focus is elsewhere", () => {
    mountPanel();
    act(() => micBtn()!.click());
    const outside = document.createElement("button");
    container!.appendChild(outside);
    outside.focus();
    /* Silence timeout / tab switch: the recognizer ends itself. */
    act(() => { lastInstance().onend?.(); });
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it("keeps focus on the mic button when permission is denied", () => {
    mountPanel();
    const mic = micBtn()!;
    act(() => { mic.focus(); mic.click(); });
    act(() => {
      const rec = lastInstance();
      rec.onerror?.({ error: "not-allowed" });
      rec.onend?.();
    });
    expect(document.activeElement).toBe(mic);
  });
});

describe("voice dictation: docked minimize hard-stops the mic", () => {
  it("aborts the recognizer when the chat closes while the panel stays mounted", () => {
    mountPanel();
    act(() => micBtn()!.click());
    const rec = lastInstance();
    expect(rec.abort).not.toHaveBeenCalled();
    /* Docked minimize only CSS-hides the panel (.chat-slide-closed), so
       unmount cleanup never fires; closing must abort explicitly. */
    act(() => useBuilder.getState().setChatOpen(false));
    expect(rec.abort).toHaveBeenCalledTimes(1);
    expect(micBtn()!.getAttribute("aria-pressed")).toBe("false");
  });
});

describe("voice dictation: manual edits mid-session survive", () => {
  it("preserves text typed during dictation when the next result arrives", () => {
    mountPanel();
    act(() => micBtn()!.click());
    const rec = lastInstance();
    act(() => rec.emitResult([{ text: "add a tabel", final: true }]));
    expect(useBuilder.getState().inputText).toBe("add a tabel");

    /* The user clicks into the composer and fixes the misrecognition. */
    typeInComposer("add a table");
    expect(useBuilder.getState().inputText).toBe("add a table");

    /* They keep speaking: the next utterance APPENDS to the edited text
       instead of rebuilding from the session-start snapshot. */
    act(() =>
      rec.emitResult(
        [
          { text: "add a tabel", final: true },
          { text: " make it blue", final: true },
        ],
        1,
      ),
    );
    expect(useBuilder.getState().inputText).toBe("add a table make it blue");
  });
});

describe("voice dictation: transcript flow", () => {
  it("appends dictation to existing text joined with a space", () => {
    useBuilder.setState({ inputText: "make a" });
    mountPanel();
    act(() => micBtn()!.click());
    act(() => lastInstance().emitResult([{ text: "dashboard", final: true }]));
    expect(useBuilder.getState().inputText).toBe("make a dashboard");
  });

  it("fills an empty composer with the transcript", () => {
    mountPanel();
    act(() => micBtn()!.click());
    act(() =>
      lastInstance().emitResult([
        { text: "add a", final: true },
        { text: " nav bar", final: false },
      ]),
    );
    expect(useBuilder.getState().inputText).toBe("add a nav bar");
  });
});

describe("voice dictation: send aborts dictation (resurrection guard)", () => {
  it("send click aborts the recognizer and a late result cannot refill the composer", () => {
    mountPanel();
    act(() => micBtn()!.click());
    const rec = lastInstance();
    act(() => rec.emitResult([{ text: "tell me about accessibility", final: true }]));
    expect(useBuilder.getState().inputText).toBe("tell me about accessibility");

    act(() => container!.querySelector<HTMLButtonElement>("button.send-btn")!.click());
    expect(hoisted.sendMessage).toHaveBeenCalledTimes(1);
    expect(rec.abort).toHaveBeenCalled();
    /* addMessage cleared the input; the late flush must not restore it. */
    act(() => rec.emitResult([{ text: "tell me about accessibility", final: true }]));
    expect(useBuilder.getState().inputText).toBe("");
  });

  it("Enter in the textarea aborts the recognizer before sending", () => {
    mountPanel();
    act(() => micBtn()!.click());
    const rec = lastInstance();
    act(() => rec.emitResult([{ text: "tell me about accessibility", final: true }]));

    act(() => {
      textarea().dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
      );
    });
    expect(rec.abort).toHaveBeenCalled();
    expect(hoisted.sendMessage).toHaveBeenCalledTimes(1);
    act(() => rec.emitResult([{ text: "tell me about accessibility", final: true }]));
    expect(useBuilder.getState().inputText).toBe("");
  });
});

describe("voice dictation: store cleanup", () => {
  it("the dormant isVoiceActive/toggleVoice pair is deleted from useBuilder", () => {
    const state = useBuilder.getState() as unknown as Record<string, unknown>;
    expect("isVoiceActive" in state).toBe(false);
    expect("toggleVoice" in state).toBe(false);
  });
});
