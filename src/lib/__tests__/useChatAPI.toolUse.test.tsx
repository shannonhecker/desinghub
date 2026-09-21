/* ════════════════════════════════════════════════════════════
   useChatAPI consumes the route's {tool_use} frames as actions: they
   are applied through applyAIActions in emission order, alongside any
   legacy json fences, and a tool-only turn still gets a confirmation.
   ════════════════════════════════════════════════════════════ */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useBuilder } from "@/store/useBuilder";

const applied = vi.fn();
vi.mock("../applyAIActions", () => ({ applyAIActions: (...args: unknown[]) => applied(...args) }));

import { useChatAPI, CHAT_EMPTY_CONFIRM } from "../useChatAPI";

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

beforeEach(() => {
  applied.mockReset();
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

describe("useChatAPI — tool_use frames", () => {
  it("applies tool calls in order, mapped onto the action shape, and confirms a tool-only turn", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      sseResponse([
        frame({ tool_use: { name: "setZoneLayout", input: { zone: "body", layout: { mode: "grid", columns: 3 } } } }),
        frame({ tool_use: { name: "addBlock", input: { type: "SimulatedStatCard", props: { label: "MRR" }, layout: { width: "fill" } } } }),
        frame({ tool_use: { name: "setMode", input: { value: "dark" } } }),
        "data: [DONE]\n\n",
      ]),
    );
    await act(async () => {
      await api.sendMessage("build KPIs");
    });
    expect(applied).toHaveBeenCalledTimes(1);
    const [actions] = applied.mock.calls[0] as [unknown[]];
    expect(actions).toEqual([
      { action: "setZoneLayout", value: { zone: "body", layout: { mode: "grid", columns: 3 } } },
      { action: "addBlock", value: { type: "SimulatedStatCard", props: { label: "MRR" }, layout: { width: "fill" } } },
      { action: "setMode", value: "dark" },
    ]);
    const msgs = useBuilder.getState().messages;
    expect(msgs[msgs.length - 1].content).toBe(CHAT_EMPTY_CONFIRM(3));
    expect(api.failedSend).toBeNull();
  });

  it("keeps prose as the bubble text, and legacy json fences apply ahead of tool calls", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      sseResponse([
        frame({ text: "Done - " }),
        frame({ text: "```json\n{\"action\":\"setDensity\",\"value\":\"high\"}\n```" }),
        frame({ tool_use: { name: "removeBlock", input: { blockId: "b9" } } }),
        frame({ text: "removed it." }),
        "data: [DONE]\n\n",
      ]),
    );
    await act(async () => {
      await api.sendMessage("remove it");
    });
    const [actions] = applied.mock.calls[0] as [unknown[]];
    expect(actions).toEqual([
      { action: "setDensity", value: "high" },
      { action: "removeBlock", value: { blockId: "b9" } },
    ]);
    const msgs = useBuilder.getState().messages;
    expect(msgs[msgs.length - 1].content).toBe("Done - removed it.");
  });

  it("an unknown tool name is dropped without breaking the turn", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockResolvedValue(
      sseResponse([frame({ tool_use: { name: "deployToProd", input: {} } }), frame({ text: "ok" }), "data: [DONE]\n\n"]),
    );
    await act(async () => {
      await api.sendMessage("x");
    });
    expect(applied).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("deployToProd"));
    warn.mockRestore();
  });
});
