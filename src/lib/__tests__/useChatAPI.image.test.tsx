/* ════════════════════════════════════════════════════════════
   An image turn: the image rides in the request body on the latest user
   message only, and is never written to the builder store, so it cannot
   reach chat history, the local session, cloud save or a share link.
   ════════════════════════════════════════════════════════════ */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useBuilder } from "@/store/useBuilder";
import { buildLocalSessionSnapshot } from "../localSession";
import { buildProjectSnapshot } from "../firebase";
import { buildSharedCanvas, encodeShareState } from "../shareState";
import { makePng, toBase64 } from "../image/__tests__/fixtures";

vi.mock("../applyAIActions", () => ({
  applyAIActions: (actions: unknown[]) => ({ applied: actions.length, skipped: [] }),
}));

import { useChatAPI, CHAT_ERROR_COPY } from "../useChatAPI";

let api: ReturnType<typeof useChatAPI>;
function Probe() {
  api = useChatAPI();
  return null;
}
let root: Root | null = null;
const realFetch = globalThis.fetch;

function sseResponse(frames: string[]): Response {
  let sent = false;
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    body: {
      getReader: () => ({
        read: async () =>
          sent ? { done: true, value: undefined } : ((sent = true), { done: false, value: new TextEncoder().encode(frames.join("")) }),
      }),
    },
  } as unknown as Response;
}
const frame = (o: unknown) => `data: ${JSON.stringify(o)}\n\n`;

const IMAGE = { mediaType: "image/png" as const, base64: toBase64(makePng(1200, 800, 4000)) };
/* A long, distinctive run of the image's base64 to search for. */
const NEEDLE = IMAGE.base64.slice(0, 64);

beforeEach(() => {
  useBuilder.setState({ messages: [], isGenerating: false });
  const container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container);
    root.render(<Probe />);
  });
});
afterEach(() => {
  if (root) {
    const r = root;
    act(() => r.unmount());
    root = null;
  }
  globalThis.fetch = realFetch;
});

type Body = { messages: { role: string; content: string; image?: { mediaType: string; data: string } }[] };
const bodyOf = (fetchMock: ReturnType<typeof vi.fn>, call = 0): Body =>
  JSON.parse((fetchMock.mock.calls[call][1] as RequestInit).body as string) as Body;

describe("useChatAPI: image turns", () => {
  it("puts the image on the latest user message only, as base64 with its media type", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      sseResponse([frame({ tool_use: { name: "setMode", input: { value: "dark" } } }), "data: [DONE]\n\n"]),
    );
    globalThis.fetch = fetchMock;
    useBuilder.setState({
      messages: [
        { id: "u0", role: "user", content: "earlier", timestamp: 1 },
        { id: "a0", role: "ai", content: "Done.", timestamp: 2 },
      ],
    });
    await act(async () => {
      await api.sendMessage("Build this screen from the image.", { image: IMAGE });
    });
    const body = bodyOf(fetchMock);
    const last = body.messages[body.messages.length - 1];
    expect(last.role).toBe("user");
    expect(last.image).toEqual({ mediaType: "image/png", data: IMAGE.base64 });
    expect(last.content).toMatch(/Build this screen from the image\.$/);
    expect(body.messages.slice(0, -1).some((m) => "image" in m)).toBe(false);
  });

  it("a text-only send carries no image key", async () => {
    const fetchMock = vi.fn().mockResolvedValue(sseResponse(["data: [DONE]\n\n"]));
    globalThis.fetch = fetchMock;
    await act(async () => {
      await api.sendMessage("add a chart");
    });
    expect(bodyOf(fetchMock).messages.some((m) => "image" in m)).toBe(false);
  });

  it("never writes the image to the store, local session, cloud save or share state", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      sseResponse([frame({ text: "Built it." }), "data: [DONE]\n\n"]),
    );
    const id = useBuilder.getState().addMessage("user", "Build this screen from the image.", undefined, { attachment: "image" });
    await act(async () => {
      await api.sendMessage("Build this screen from the image.", { image: IMAGE });
    });
    const s = useBuilder.getState();
    expect(JSON.stringify(s.messages)).not.toContain(NEEDLE);
    expect(JSON.stringify(buildLocalSessionSnapshot(s))).not.toContain(NEEDLE);
    expect(JSON.stringify(buildProjectSnapshot(s))).not.toContain(NEEDLE);
    expect(encodeShareState(buildSharedCanvas(s))).not.toContain(NEEDLE);
    expect(JSON.stringify(buildSharedCanvas(s))).not.toContain(NEEDLE);
    /* Only the marker stays in the visible transcript. */
    expect(s.messages.find((m) => m.id === id)?.attachment).toBe("image");
  });

  it("Retry after a server failure resends the same image, from memory", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, headers: new Headers() } as Response)
      .mockResolvedValueOnce(sseResponse(["data: [DONE]\n\n"]));
    globalThis.fetch = fetchMock;
    await act(async () => {
      await api.sendMessage("Build this screen from the image.", { image: IMAGE });
    });
    expect(api.failedSend).not.toBeNull();
    expect(JSON.stringify(useBuilder.getState().messages)).not.toContain(NEEDLE);
    await act(async () => {
      await api.retryFailedSend();
    });
    const body = bodyOf(fetchMock, 1);
    expect(body.messages[body.messages.length - 1].image?.data).toBe(IMAGE.base64);
  });

  it("a server image reject says so plainly, not 'trouble connecting', and does not offer Retry", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers(),
      json: async () => ({ error: "That image could not be used. Try a PNG, JPEG, WebP or GIF under 2 MB." }),
    } as unknown as Response);
    let outcome: unknown;
    await act(async () => {
      outcome = await api.sendMessage("Build this screen from the image.", { image: IMAGE });
    });
    const msgs = useBuilder.getState().messages;
    expect(msgs[msgs.length - 1].content).toBe(CHAT_ERROR_COPY.imageRejected);
    expect(CHAT_ERROR_COPY.imageRejected).not.toMatch(/trouble connecting/);
    expect(outcome).toEqual({ status: "image-rejected" });
    expect(api.failedSend).toBeNull();
  });

  it("a 429 on an image turn hands the image back so it is not lost", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ "Retry-After": "5" }),
    } as unknown as Response);
    let outcome: unknown;
    await act(async () => {
      outcome = await api.sendMessage("Build this screen from the image.", { image: IMAGE });
    });
    expect(outcome).toEqual({ status: "rate-limited", image: IMAGE });
    expect(JSON.stringify(useBuilder.getState().messages)).not.toContain(NEEDLE);
  });

  it("a plain 400 on a text turn keeps the old generic copy", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers(),
      json: async () => ({ error: "messages must be an array of 1-40 items" }),
    } as unknown as Response);
    await act(async () => {
      await api.sendMessage("hi");
    });
    const msgs = useBuilder.getState().messages;
    expect(msgs[msgs.length - 1].content).toBe(CHAT_ERROR_COPY.generic);
  });
});
