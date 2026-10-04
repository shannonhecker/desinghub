import { issueSessionToken } from "@/lib/sessionToken";
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
  checkModelRateLimit: vi.fn().mockResolvedValue({ allowed: true, resetInSeconds: 0 }),
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
  return POST(new Request("http://localhost/api/chat", { method: "POST", headers: { "Content-Type": "application/json", cookie: `uoaui_auth_token=${issueSessionToken("test-secret")}` }, body: JSON.stringify(body) }));
}

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = "test-key";
  process.env.STAGING_TOKEN_SECRET = "test-secret";
  delete process.env.STAGING_PASSWORD;
  streamMock.mockReset();
});

describe("POST /api/chat: canvas tools", () => {
  it("declares the 16 canvas tools on every request, ahead of the cached system prompt", async () => {
    streamMock.mockImplementation(async () => scripted([]));
    await post({ messages: [{ role: "user", content: "hi" }], designSystem: "carbon" });
    expect(streamMock).toHaveBeenCalledTimes(1);
    const params = streamMock.mock.calls[0][0] as { tools: { name: string }[]; system: unknown[] };
    expect(params.tools.map((t) => t.name)).toEqual([
      "setDesignSystem", "setMode", "setDensity", "setThemeKey", "setInterfaceType", "setComponents", "setColorOverride",
      "addBlock", "removeBlock", "moveBlock", "updateBlockProps", "updateBlockLayout", "setZoneLayout", "applyTemplate", "setReportFilter", "clearCanvas",
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

  /* Canvas tools run in the browser, so the route never has a real tool
     result. Without one the API ends the turn at the model's first batch of
     calls (stop_reason "tool_use") — a build that opens with clearCanvas
     stopped there and left an empty canvas. The route acknowledges each call
     and keeps the same turn going until the model is done. */
  it("acknowledges tool calls and continues the turn until the model stops asking for tools", async () => {
    streamMock
      .mockImplementationOnce(async () =>
        scripted([
          { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
          { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "On it." } },
          { type: "content_block_stop", index: 0 },
          { type: "content_block_start", index: 1, content_block: { type: "tool_use", id: "tu_1", name: "clearCanvas", input: {} } },
          { type: "content_block_delta", index: 1, delta: { type: "input_json_delta", partial_json: '{"zone":"body"}' } },
          { type: "content_block_stop", index: 1 },
          { type: "message_delta", delta: { stop_reason: "tool_use" } },
          { type: "message_stop" },
        ]),
      )
      .mockImplementationOnce(async () =>
        scripted([
          { type: "content_block_start", index: 0, content_block: { type: "tool_use", id: "tu_2", name: "addBlock", input: {} } },
          { type: "content_block_delta", index: 0, delta: { type: "input_json_delta", partial_json: '{"type":"HighchartColumn","props":{"title":"VaR by fund"}}' } },
          { type: "content_block_stop", index: 0 },
          { type: "message_delta", delta: { stop_reason: "tool_use" } },
        ]),
      )
      .mockImplementationOnce(async () =>
        scripted([
          { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
          { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Added the chart." } },
          { type: "content_block_stop", index: 0 },
          { type: "message_delta", delta: { stop_reason: "end_turn" } },
        ]),
      );

    const frames = await readFrames(await post({ messages: [{ role: "user", content: "build a risk dashboard" }] }));

    expect(frames).toEqual([
      { text: "On it." },
      { tool_use: { name: "clearCanvas", input: { zone: "body" } } },
      { tool_use: { name: "addBlock", input: { type: "HighchartColumn", props: { title: "VaR by fund" } } } },
      { text: "\n\n" },
      { text: "Added the chart." },
    ]);
    expect(streamMock).toHaveBeenCalledTimes(3);

    type Msg = { role: string; content: unknown };
    const second = (streamMock.mock.calls[1][0] as { messages: Msg[] }).messages;
    expect(second).toEqual([
      { role: "user", content: "build a risk dashboard" },
      {
        role: "assistant",
        content: [
          { type: "text", text: "On it." },
          { type: "tool_use", id: "tu_1", name: "clearCanvas", input: { zone: "body" } },
        ],
      },
      { role: "user", content: [{ type: "tool_result", tool_use_id: "tu_1", content: expect.stringMatching(/queued/i) }] },
    ]);
    const third = (streamMock.mock.calls[2][0] as { messages: Msg[] }).messages;
    expect(third).toHaveLength(5);
    expect(third[4]).toEqual({ role: "user", content: [{ type: "tool_result", tool_use_id: "tu_2", content: expect.stringMatching(/queued/i) }] });
  });

  it("a call whose input could not be parsed is answered as an error so the model can retry it", async () => {
    streamMock
      .mockImplementationOnce(async () =>
        scripted([
          { type: "content_block_start", index: 0, content_block: { type: "tool_use", id: "tu_1", name: "addBlock", input: {} } },
          { type: "content_block_delta", index: 0, delta: { type: "input_json_delta", partial_json: '{"type": "SimulatedCard"' } },
          { type: "content_block_stop", index: 0 },
          { type: "message_delta", delta: { stop_reason: "tool_use" } },
        ]),
      )
      .mockImplementationOnce(async () => scripted([{ type: "message_delta", delta: { stop_reason: "end_turn" } }]));
    await readFrames(await post({ messages: [{ role: "user", content: "x" }] }));
    const second = (streamMock.mock.calls[1][0] as { messages: { role: string; content: unknown }[] }).messages;
    expect(second[1]).toEqual({ role: "assistant", content: [{ type: "tool_use", id: "tu_1", name: "addBlock", input: {} }] });
    expect(second[2]).toEqual({
      role: "user",
      content: [{ type: "tool_result", tool_use_id: "tu_1", is_error: true, content: expect.stringMatching(/not applied/i) }],
    });
  });

  it("stops after a bounded number of continuation steps", async () => {
    streamMock.mockImplementation(async () =>
      scripted([
        { type: "content_block_start", index: 0, content_block: { type: "tool_use", id: "tu_x", name: "clearCanvas", input: {} } },
        { type: "content_block_stop", index: 0 },
        { type: "message_delta", delta: { stop_reason: "tool_use" } },
      ]),
    );
    const frames = await readFrames(await post({ messages: [{ role: "user", content: "x" }] }));
    expect(streamMock).toHaveBeenCalledTimes(8);
    expect(frames.filter((f) => "tool_use" in f)).toHaveLength(8);
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
