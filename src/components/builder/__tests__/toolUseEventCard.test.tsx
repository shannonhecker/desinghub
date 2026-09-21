/* ════════════════════════════════════════════════════════════
   Phase 3a PR (b) — typed Tool-Use Card variants.
   ────────────────────────────────────────────────────────────
   ToolUseEventCard discriminates on the event's action and renders
   a typed card (AddBlockCard / ChangeDSCard / RemoveBlockCard)
   instead of the base wrapper's raw JSON dump. Untyped actions
   keep the base card + expandable params.

   No RTL in the repo — uses react-dom/client + act() directly,
   matching AnatomyDiagram.test.tsx / codePanel.test.tsx.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ToolUseEventCard } from "../cards/ToolUseCard";
import type { ToolUseEvent } from "@/lib/toolUseEvents";

let root: Root | null = null;
afterEach(() => {
  if (root) {
    const r = root;
    act(() => r.unmount());
    root = null;
  }
});

function renderCard(event: ToolUseEvent, onUndo?: () => void): HTMLElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container);
    root.render(
      <ToolUseEventCard event={event} staggerIndex={0} onUndo={onUndo} />,
    );
  });
  return container;
}

describe("ToolUseEventCard", () => {
  it("addBlock renders a MiniPreview thumbnail of the block type plus a zone label", () => {
    const c = renderCard({
      action: "addBlock",
      value: { type: "SimulatedStatCard", zone: "body" },
      blockId: "b1",
      zone: "body",
      ts: 1,
    });
    expect(
      c.querySelector('svg[aria-label="SimulatedStatCard preview"]'),
    ).toBeTruthy();
    expect(c.textContent).toContain("Stat Card");
    expect(c.textContent).toContain("Body");
  });

  it("addBlock replaces the raw JSON dump (no params pre, no expand chevron)", () => {
    const c = renderCard({
      action: "addBlock",
      value: { type: "SimulatedStatCard", zone: "header" },
      blockId: "b1",
      zone: "header",
      ts: 1,
    });
    expect(c.querySelector(".tool-use-card__params-pre")).toBeNull();
    expect(c.querySelector(".tool-use-card__chevron")).toBeNull();
    expect(c.textContent).toContain("Header");
  });

  it("addBlock keeps the per-card undo affordance when provided", () => {
    const c = renderCard(
      {
        action: "addBlock",
        value: { type: "SimulatedCard", zone: "body" },
        blockId: "b1",
        zone: "body",
        ts: 1,
      },
      () => {},
    );
    expect(c.textContent).toContain("Undo this action");
  });

  it("setDesignSystem renders the DS display name with its icon dot", () => {
    const c = renderCard({ action: "setDesignSystem", value: "m3", ts: 1 });
    expect(c.textContent).toContain("Material 3");
    expect(
      c.querySelector('.tool-use-card__ds-dot[data-ds="m3"]'),
    ).toBeTruthy();
    expect(c.querySelector(".tool-use-card__params-pre")).toBeNull();
  });

  it("removeBlock renders the block label from the emitted type", () => {
    const c = renderCard({
      action: "removeBlock",
      value: { blockId: "b9", type: "SimulatedDataTable" },
      blockId: "b9",
      zone: "body",
      ts: 1,
    });
    expect(c.textContent).toContain("Data Table");
    expect(c.querySelector(".tool-use-card__params-pre")).toBeNull();
  });

  it("removeBlock falls back to the block id when no type was emitted", () => {
    const c = renderCard({
      action: "removeBlock",
      value: { blockId: "b9" },
      blockId: "b9",
      zone: "body",
      ts: 1,
    });
    expect(c.textContent).toContain("b9");
  });

  it("untyped actions keep the base card with expandable raw params", () => {
    const c = renderCard({ action: "setMode", value: "dark", ts: 1 });
    expect(c.textContent).toContain("Switch mode");
    expect(c.querySelector(".tool-use-card__params-pre")).toBeTruthy();
    expect(c.querySelector(".tool-use-card__chevron")).toBeTruthy();
  });
});

describe("ToolUseEventCard — skipped actions", () => {
  it("renders a 'Not applied' card with the reason, no undo and nothing to expand", () => {
    const c = renderCard(
      { action: "moveBlock", value: { blockId: "nope" }, status: "skipped", reason: 'no block with id "nope"', ts: 1 },
      () => {},
    );
    const card = c.querySelector(".tool-use-card");
    expect(card?.classList.contains("tool-use-card--skipped")).toBe(true);
    expect(card?.getAttribute("data-status")).toBe("skipped");
    expect(c.textContent).toContain("Not applied: move block");
    expect(c.textContent).toContain('no block with id "nope"');
    expect(c.querySelector(".tool-use-card__undo")).toBeNull();
    expect(c.querySelector("[aria-expanded]")).toBeNull();
  });

  it("an unknown tool name still gets a card, named after the tool the model used", () => {
    const c = renderCard({ action: "deployToProd", value: {}, status: "skipped", reason: 'unknown tool "deployToProd"', ts: 2 });
    expect(c.textContent).toContain("Not applied: deploytoprod");
    expect(c.textContent).toContain('unknown tool "deployToProd"');
  });
});
