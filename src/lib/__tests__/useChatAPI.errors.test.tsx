/* ════════════════════════════════════════════════════════════
   Differentiated chat failure states (analysis QW4).
   ────────────────────────────────────────────────────────────
   useChatAPI branches on response.status BEFORE reading the stream:
     • 429       → Retry-After header drives a live countdown message
                   that re-enables send when it hits zero
     • 5xx       → retryable failure with a Retry affordance
     • network   → same affordance, connection-specific copy
     • sentinel  → refusal / context-overrun stream errors get
                   "Try a smaller ask" guidance
     • AI_OFF    → existing missing-key copy (unchanged)

   No RTL in the repo — react-dom/client + act() probe component,
   matching AnatomyDiagram.test.tsx / codePanel.test.tsx.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useBuilder } from "@/store/useBuilder";

/* applyAIActions pulls blockRegistry (every block renderer) — mock the
   heavy sibling; these tests never reach the action-apply path. */
vi.mock("../applyAIActions", () => ({ applyAIActions: vi.fn() }));

import { useChatAPI, CHAT_EMPTY_CONFIRM } from "../useChatAPI";

type ChatApi = ReturnType<typeof useChatAPI>;
let api: ChatApi;

function Probe() {
  api = useChatAPI();
  return null;
}

let root: Root | null = null;
const realFetch = globalThis.fetch;

function mountProbe() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container);
    root.render(<Probe />);
  });
}

beforeEach(() => {
  useBuilder.setState({ messages: [], isGenerating: false });
  mountProbe();
});

afterEach(() => {
  if (root) {
    const r = root;
    act(() => r.unmount());
    root = null;
  }
  globalThis.fetch = realFetch;
  vi.useRealTimers();
  vi.clearAllMocks();
});

/* ── fetch stubs ── */

function errorResponse(
  status: number,
  headers?: Record<string, string>,
  body?: Record<string, unknown>,
): Response {
  return {
    ok: false,
    status,
    headers: new Headers(headers ?? {}),
    json: async () => body ?? { error: "x" },
  } as unknown as Response;
}

function sseResponse(frames: string[]): Response {
  let sent = false;
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    body: {
      getReader: () => ({
        read: async () =>
          sent
            ? { done: true, value: undefined }
            : ((sent = true),
              {
                done: false,
                value: new TextEncoder().encode(frames.join("")),
              }),
      }),
    },
  } as unknown as Response;
}

const lastMessage = () => {
  const msgs = useBuilder.getState().messages;
  return msgs[msgs.length - 1];
};

describe("useChatAPI error states", () => {
  it("429 reads Retry-After into a live countdown and re-enables send at zero", async () => {
    vi.useFakeTimers();
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(errorResponse(429, { "Retry-After": "3" }));

    await act(async () => {
      await api.sendMessage("build a dashboard");
    });

    expect(lastMessage().content).toBe("Rate limit reached. Retry in 3s.");
    expect(api.retrySeconds).toBe(3);
    expect(useBuilder.getState().isGenerating).toBe(false);

    /* Send stays blocked while the countdown runs. */
    await act(async () => {
      await api.sendMessage("another ask");
    });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(lastMessage().content).toBe("Rate limit reached. Retry in 2s.");
    expect(api.retrySeconds).toBe(2);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(lastMessage().content).toBe(
      "Rate limit cleared. You can send again.",
    );
    expect(api.retrySeconds).toBeNull();
  });

  it("5xx surfaces a retryable failure and retryFailedSend re-sends the same text", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(errorResponse(500))
      .mockResolvedValueOnce(
        sseResponse(['data: {"text":"Hello"}\n\n', "data: [DONE]\n\n"]),
      );

    await act(async () => {
      await api.sendMessage("hi");
    });

    const failedBubble = lastMessage();
    expect(failedBubble.content).toContain("Use Retry");
    expect(api.failedSend).toEqual({
      messageId: failedBubble.id,
      userText: "hi",
    });

    await act(async () => {
      await api.retryFailedSend();
    });

    expect(api.failedSend).toBeNull();
    const msgs = useBuilder.getState().messages;
    /* Error bubble dropped so the resend history stays clean. */
    expect(msgs.some((m) => m.id === failedBubble.id)).toBe(false);
    expect(lastMessage().content).toBe("Hello");
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it("network failure gets connection copy plus the retry affordance", async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new TypeError("Failed to fetch"));

    await act(async () => {
      await api.sendMessage("hi");
    });

    const bubble = lastMessage();
    expect(bubble.content).toContain("I could not reach the server");
    expect(api.failedSend?.messageId).toBe(bubble.id);
  });

  it("context-overrun stream sentinel gets smaller-ask guidance with no retry affordance", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        sseResponse([
          'data: {"error":"prompt is too long: 207000 tokens > 200000 maximum"}\n\n',
        ]),
      );

    await act(async () => {
      await api.sendMessage("hi");
    });

    expect(lastMessage().content).toContain("Try a smaller ask");
    expect(api.failedSend).toBeNull();
    expect(api.retrySeconds).toBeNull();
  });

  it("AI_OFF sentinel keeps the existing missing-key copy", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        errorResponse(503, {}, { error: "ANTHROPIC_API_KEY not configured" }),
      );

    await act(async () => {
      await api.sendMessage("hi");
    });

    expect(lastMessage().content).toContain("AI is off");
    expect(api.failedSend).toBeNull();
  });

  it("other 4xx statuses keep the generic connection copy", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(errorResponse(400));

    await act(async () => {
      await api.sendMessage("hi");
    });

    expect(lastMessage().content).toContain("trouble connecting");
    expect(api.failedSend).toBeNull();
  });

  /* ── Empty-bubble resilience ──
     A 200 stream that yields neither display text nor actions used to
     overwrite the "..." placeholder with "" — a silent blank bubble.
     Now: 0 text + 0 actions surfaces the retry affordance; json-only
     (0 text + >0 actions) substitutes a terse confirmation. */

  it("a DONE-only stream leaves a non-empty bubble and arms Retry", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(sseResponse(["data: [DONE]\n\n"]));

    await act(async () => {
      await api.sendMessage("hi");
    });

    const bubble = lastMessage();
    /* Never blank, and never the bare placeholder. */
    expect(bubble.content.trim()).not.toBe("");
    expect(bubble.content).not.toBe("...");
    /* Retry affordance is armed against this bubble. */
    expect(api.failedSend).toEqual({
      messageId: bubble.id,
      userText: "hi",
    });
  });

  it("a json-only frame renders a confirmation, not a blank bubble", async () => {
    const jsonFrame =
      'data: {"text":"```json\\n{\\"action\\":\\"setDesignSystem\\",\\"value\\":\\"m3\\"}\\n```"}\n\n';
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(sseResponse([jsonFrame, "data: [DONE]\n\n"]));

    await act(async () => {
      await api.sendMessage("switch to m3");
    });

    const bubble = lastMessage();
    /* The display text was empty (json-only) but the bubble must not
       go blank — a confirmation stands in. */
    expect(bubble.content.trim()).not.toBe("");
    expect(bubble.content).not.toBe("...");
    expect(bubble.content).toBe(CHAT_EMPTY_CONFIRM(1));
    /* Applying actions is not an error, so no retry affordance. */
    expect(api.failedSend).toBeNull();
  });
});
