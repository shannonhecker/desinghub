/* ════════════════════════════════════════════════════════════
   /api/chat accepts ONE image on the latest user message, re-validates it
   (type by bytes, size, dimensions, base64 shape) and sends it to the model
   as an image block on that turn only. Text-only requests are unchanged.
   ════════════════════════════════════════════════════════════ */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { makePng, makeJpeg, toBase64 } from "@/lib/image/__tests__/fixtures";
import { MAX_IMAGE_BYTES } from "@/lib/image/imageBytes";

const streamMock = vi.fn();
vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = { stream: streamMock };
  }
  return { default: MockAnthropic };
});

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, resetInSeconds: 0 }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

async function post(body: unknown): Promise<Response> {
  const { POST } = await import("../route");
  return POST(new Request("http://localhost/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
}

const empty = async () => (async function* () {})();
const png = makePng(1200, 800, 500);
const goodImage = { mediaType: "image/png", data: toBase64(png) };

let logSpy: ReturnType<typeof vi.spyOn>;
let warnSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = "test-key";
  delete process.env.STAGING_PASSWORD;
  streamMock.mockReset();
  streamMock.mockImplementation(empty);
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  logSpy.mockRestore();
  warnSpy.mockRestore();
  errorSpy.mockRestore();
});

/* Every console line the route wrote, joined: must never carry image data. */
function allLogs(): string {
  return [logSpy, warnSpy, errorSpy].flatMap((s) => s.mock.calls.map((c: unknown[]) => c.map(String).join(" "))).join("\n");
}

type Params = { messages: { role: string; content: unknown }[]; system: unknown[]; tools: unknown[] };

describe("POST /api/chat: image on the latest user message", () => {
  it("sends a valid image as an image block ahead of the text, on that turn only", async () => {
    const res = await post({
      messages: [
        { role: "user", content: "hi" },
        { role: "assistant", content: "Hello." },
        { role: "user", content: "Build this screen from the image.", image: goodImage },
      ],
    });
    expect(res.status).toBe(200);
    await res.text();
    const params = streamMock.mock.calls[0][0] as Params;
    expect(params.messages).toEqual([
      { role: "user", content: "hi" },
      { role: "assistant", content: "Hello." },
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/png", data: goodImage.data } },
          { type: "text", text: "Build this screen from the image." },
        ],
      },
    ]);
  });

  it("keeps the cached prefix byte-stable: same tools and system with or without an image", async () => {
    await (await post({ messages: [{ role: "user", content: "x" }], designSystem: "m3" })).text();
    await (await post({ messages: [{ role: "user", content: "x", image: goodImage }], designSystem: "m3" })).text();
    const [a, b] = streamMock.mock.calls.map((c) => c[0] as Params);
    expect(JSON.stringify(b.system)).toBe(JSON.stringify(a.system));
    expect(JSON.stringify(b.tools)).toBe(JSON.stringify(a.tools));
    expect(b.system).toHaveLength(1);
    /* The image guidance lives in the static, cached system prompt. */
    const text = (b.system[0] as { text: string }).text;
    expect(text).toContain("## Building from an image");
    expect(text).toMatch(/say(?:ing)? plainly what you could not match/i);
  });

  it("the image stays on its turn across tool continuations", async () => {
    streamMock
      .mockImplementationOnce(async () =>
        (async function* () {
          yield { type: "content_block_start", index: 0, content_block: { type: "tool_use", id: "tu_1", name: "clearCanvas", input: {} } };
          yield { type: "content_block_stop", index: 0 };
          yield { type: "message_delta", delta: { stop_reason: "tool_use" } };
        })(),
      )
      .mockImplementationOnce(empty);
    await (await post({ messages: [{ role: "user", content: "x", image: goodImage }] })).text();
    const second = (streamMock.mock.calls[1][0] as Params).messages;
    expect(second).toHaveLength(3);
    expect((second[0].content as { type: string }[])[0].type).toBe("image");
    expect(JSON.stringify(second.slice(1))).not.toContain(goodImage.data);
  });

  it.each([
    ["a media type outside the allowlist", { mediaType: "image/svg+xml", data: goodImage.data }],
    ["bytes that are not the declared type", { mediaType: "image/png", data: toBase64(makeJpeg(10, 10)) }],
    ["malformed base64", { mediaType: "image/png", data: "%%%not-base64%%%" }],
    ["a URL instead of data", { mediaType: "image/png", url: "https://example.com/x.png" }],
    ["an oversize image", { mediaType: "image/png", data: toBase64(makePng(100, 100, MAX_IMAGE_BYTES)) }],
    ["dimensions over the cap", { mediaType: "image/png", data: toBase64(makePng(4000, 3000)) }],
  ])("rejects %s with a generic 400 and never calls the model", async (_label, image) => {
    const res = await post({ messages: [{ role: "user", content: "x", image }] });
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe("That image could not be used. Try a PNG, JPEG, WebP or GIF under 2 MB.");
    expect(streamMock).not.toHaveBeenCalled();
    expect(allLogs()).toMatch(/\[api\/chat\] image rejected: reason=/);
    const data = (image as { data?: string }).data;
    if (data) expect(allLogs()).not.toContain(data.slice(0, 40));
  });

  it("rejects a huge base64 string with the generic 400, before any regex work", async () => {
    const huge = "A".repeat(40 * 1024 * 1024);
    const res = await post({ messages: [{ role: "user", content: "x", image: { mediaType: "image/png", data: huge } }] });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe("That image could not be used. Try a PNG, JPEG, WebP or GIF under 2 MB.");
    expect(allLogs()).toMatch(/reason=too-large/);
    expect(streamMock).not.toHaveBeenCalled();
  }, 30_000);

  it("rejects an image on a message that is not the latest", async () => {
    const res = await post({
      messages: [
        { role: "user", content: "x", image: goodImage },
        { role: "assistant", content: "ok" },
        { role: "user", content: "y" },
      ],
    });
    expect(res.status).toBe(400);
    expect(streamMock).not.toHaveBeenCalled();
  });

  it("rejects an image on an assistant message, even the last one", async () => {
    const res = await post({ messages: [{ role: "user", content: "x" }, { role: "assistant", content: "ok", image: goodImage }] });
    expect(res.status).toBe(400);
    expect(streamMock).not.toHaveBeenCalled();
  });

  it("never logs image data on success", async () => {
    await (await post({ messages: [{ role: "user", content: "x", image: goodImage }] })).text();
    expect(allLogs()).not.toContain(goodImage.data.slice(0, 40));
  });
});

describe("POST /api/chat: text-only requests are unchanged", () => {
  it("passes plain string messages straight through", async () => {
    await (await post({ messages: [{ role: "user", content: "hi" }, { role: "assistant", content: "yo" }, { role: "user", content: "add a chart" }] })).text();
    expect((streamMock.mock.calls[0][0] as Params).messages).toEqual([
      { role: "user", content: "hi" },
      { role: "assistant", content: "yo" },
      { role: "user", content: "add a chart" },
    ]);
  });

  it("an explicit null image is treated as no image", async () => {
    const res = await post({ messages: [{ role: "user", content: "hi", image: null }] });
    expect(res.status).toBe(200);
    await res.text();
    expect((streamMock.mock.calls[0][0] as Params).messages).toEqual([{ role: "user", content: "hi" }]);
  });
});
