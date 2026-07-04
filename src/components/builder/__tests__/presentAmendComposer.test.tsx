/* PresentAmendComposer — in-place amend (Phase 1, Lovable-style).
   Verifies the mini-composer only appears when a block is selected and shows
   a correctly-scoped label. Uses react-dom/client + act() (no RTL in repo);
   useChatAPI is mocked so no network. */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useBuilder } from "@/store/useBuilder";

const sendMessage = vi.fn(() => Promise.resolve());
vi.mock("@/lib/useChatAPI", () => ({
  useChatAPI: () => ({
    sendMessage,
    abort: vi.fn(),
    retrySeconds: null,
    failedSend: null,
    retryFailedSend: vi.fn(),
  }),
}));

import { PresentAmendComposer } from "../PresentAmendComposer";

let root: Root | null = null;
let container: HTMLDivElement | null = null;

beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  sendMessage.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  useBuilder.setState({ selectedBlockId: null, selectedBlockIds: [], selectedBlockZone: null } as never);
});

afterEach(() => {
  act(() => { root?.unmount(); });
  container?.remove();
  root = null;
  container = null;
});

function render() {
  act(() => {
    root = createRoot(container!);
    root.render(<PresentAmendComposer />);
  });
}

describe("PresentAmendComposer — in-place amend (Phase 1)", () => {
  it("renders nothing when no block is selected", () => {
    render();
    expect(container!.querySelector(".present-amend")).toBeNull();
  });

  it("shows a scoped 'Editing: <label>' chip when a single block is selected", () => {
    useBuilder.setState({
      blocks: [{ id: "b1", type: "SimulatedButton", props: { label: "Go" } }],
      selectedBlockId: "b1",
      selectedBlockIds: ["b1"],
      selectedBlockZone: "body",
    } as never);
    render();
    const label = container!.querySelector(".present-amend-label");
    expect(label).not.toBeNull();
    expect(label?.textContent).toContain("Editing");
    expect(label?.textContent).toContain("Button");
    // composer + send affordance present
    expect(container!.querySelector(".present-amend-input")).not.toBeNull();
    expect(container!.querySelector(".present-amend-send")).not.toBeNull();
  });

  it("shows a count label when several blocks are selected", () => {
    useBuilder.setState({
      blocks: [
        { id: "b1", type: "SimulatedButton", props: {} },
        { id: "b2", type: "SimulatedCard", props: {} },
      ],
      selectedBlockId: "b1",
      selectedBlockIds: ["b1", "b2"],
      selectedBlockZone: "body",
    } as never);
    render();
    expect(container!.querySelector(".present-amend-label")?.textContent).toContain("2 blocks selected");
  });
});
