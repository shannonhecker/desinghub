/* ColumnGuides — grid column boundary overlay shown only while dragging.
   Pure editor visual (writes no data). Uses react-dom/client + act(). */

import { describe, it, expect, afterEach } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ColumnGuides } from "../ColumnGuides";
import { DragActiveContext } from "../dragActiveContext";

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function render(ui: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => { root!.render(ui); });
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  container?.remove();
  root = null;
  container = null;
});

describe("ColumnGuides", () => {
  it("renders nothing when no drag is active", () => {
    render(
      <DragActiveContext.Provider value={false}>
        <ColumnGuides columns={12} gap={12} />
      </DragActiveContext.Provider>,
    );
    expect(container!.querySelector(".zone-col-guides")).toBeNull();
  });

  it("renders one boundary cell per column while dragging a multi-col grid", () => {
    render(
      <DragActiveContext.Provider value={true}>
        <ColumnGuides columns={12} gap={12} />
      </DragActiveContext.Provider>,
    );
    const guides = container!.querySelector(".zone-col-guides");
    expect(guides).not.toBeNull();
    expect(guides!.querySelectorAll(".zone-col-guide-cell").length).toBe(12);
    // Mirrors the zone's track count so the lines align with real columns.
    expect((guides as HTMLElement).style.gridTemplateColumns).toBe("repeat(12, 1fr)");
  });

  it("renders nothing for a single-column zone (no boundaries to show)", () => {
    render(
      <DragActiveContext.Provider value={true}>
        <ColumnGuides columns={1} gap={0} />
      </DragActiveContext.Provider>,
    );
    expect(container!.querySelector(".zone-col-guides")).toBeNull();
  });
});
