/* ════════════════════════════════════════════════════════════
   /api/chat streams the model's TOOL CALLS to the client as structured
   frames, alongside text deltas, and declares the canvas tools on the
   request. Mocks the SDK with a scripted event stream.
   ════════════════════════════════════════════════════════════ */
import { describe, it, expect, vi, beforeEach } from "vitest";

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

type Ev = Record<string, unknown>;
function scripted(events: Ev[]) {
  return (async function* () {
    for (const e of events) yield e;
  })();
}

async function readFrames(res: Response): Promise<Record<string, unknown>[]> {
  const text = await res.text();
  return text
    .split("\n\n")
    .filter((l) => l.startsWith("data: ") && !l.includes("[DONE]"))
    .map((l) => JSON.parse(l.slice(6)) as Record<string, unknown>);
}

async function post(body: unknown): Promise<Response> {
  const { POST } = await import("../route");
  return POST(new Request("http://localhost/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
}

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = "test-key";
  delete process.env.STAGING_PASSWORD;
  streamMock.mockReset();
});

describe("POST /api/chat: canvas tools", () => {
  it("declares the 14 canvas tools on every request, ahead of the cached system prompt", async () => {
    streamMock.mockImplementation(async () => scripted([]));
    await post({ messages: [{ role: "user", content: "hi" }], designSystem: "carbon" });
    expect(streamMock).toHaveBeenCalledTimes(1);
    const params = streamMock.mock.calls[0][0] as { tools: { name: string }[]; system: unknown[] };
    expect(params.tools.map((t) => t.name)).toEqual([
      "setDesignSystem", "setMode", "setDensity", "setThemeKey", "setInterfaceType", "setComponents", "setColorOverride",
      "addBlock", "removeBlock", "moveBlock", "updateBlockProps", "updateBlockLayout", "setZoneLayout", "clearCanvas",
    ]);
    expect(params.system).toHaveLength(1);
  });

  it("emits {tool_use} frames when tool blocks close, in order, interleaved with text", async () => {
    streamMock.mockImplementation(async () =>
      scripted([
        { type: "message_start", message: { usage: { input_tokens: 10 } } },
        { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
        { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Moving it up." } },
        { type: "content_block_stop", index: 0 },
        { type: "content_block_start", index: 1, content_block: { type: "tool_use", id: "tu_1", name: "setZoneLayout", input: {} } },
        { type: "content_block_delta", index: 1, delta: { type: "input_json_delta", partial_json: '{"zone":"body",' } },
        { type: "content_block_delta", index: 1, delta: { type: "input_json_delta", partial_json: '"layout":{"mode":"grid","columns":3}}' } },
        { type: "content_block_stop", index: 1 },
        { type: "content_block_start", index: 2, content_block: { type: "tool_use", id: "tu_2", name: "moveBlock", input: {} } },
        { type: "content_block_delta", index: 2, delta: { type: "input_json_delta", partial_json: '{"blockId":"tb","toZone":"body","toIndex":0}' } },
        { type: "content_block_stop", index: 2 },
        { type: "message_stop" },
      ]),
    );
    const frames = await readFrames(await post({ messages: [{ role: "user", content: "move the table up" }] }));
    expect(frames).toEqual([
      { text: "Moving it up." },
      { tool_use: { name: "setZoneLayout", input: { zone: "body", layout: { mode: "grid", columns: 3 } } } },
      { tool_use: { name: "moveBlock", input: { blockId: "tb", toZone: "body", toIndex: 0 } } },
    ]);
  });

  it("a tool block with no input deltas yields an empty object; unparseable input is reported, not dropped", async () => {
    streamMock.mockImplementation(async () =>
      scripted([
        { type: "content_block_start", index: 0, content_block: { type: "tool_use", id: "tu_1", name: "clearCanvas", input: {} } },
        { type: "content_block_stop", index: 0 },
        { type: "content_block_start", index: 1, content_block: { type: "tool_use", id: "tu_2", name: "addBlock", input: {} } },
        { type: "content_block_delta", index: 1, delta: { type: "input_json_delta", partial_json: '{"type": "SimulatedCard"' } },
        { type: "content_block_stop", index: 1 },
      ]),
    );
    const frames = await readFrames(await post({ messages: [{ role: "user", content: "x" }] }));
    expect(frames).toEqual([
      { tool_use: { name: "clearCanvas", input: {} } },
      { tool_skipped: { name: "addBlock", reason: "invalid tool input JSON" } },
    ]);
  });
});
