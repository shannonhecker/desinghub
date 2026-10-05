/* The panel's way back from a selected block to the library and templates
   (owner, 5 Oct). Inspect mode shows a "Components and templates" back
   control; browse mode does not. Activating it clears the selection and
   leaves the panel open (the panel's open state is untouched). */
import React, { act } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { useBuilder, type Block } from "@/store/useBuilder";
import { ComponentLibrary } from "../ComponentLibrary";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
class RO { observe() {} unobserve() {} disconnect() {} }
(globalThis as Record<string, unknown>).ResizeObserver ??= RO;
(globalThis as { matchMedia?: unknown }).matchMedia ??= (query: string) => ({
  matches: false, media: query, onchange: null,
  addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
});

let root: Root | null = null;
let container: HTMLDivElement | null = null;
function render(): HTMLElement {
  container = document.createElement("div");
  document.body.appendChild(container);
  act(() => { root = createRoot(container!); root.render(<ComponentLibrary />); });
  return container;
}
afterEach(() => {
  if (root) { const r = root; act(() => r.unmount()); root = null; }
  container?.remove();
  container = null;
});

const card: Block = { id: "c1", type: "SimulatedStatCard", props: { label: "MRR", value: "1" } };
const back = (c: HTMLElement) => [...c.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Components and templates");

describe("panel back control", () => {
  it("inspect mode shows the back control by name; activating it clears the selection and keeps the panel open", () => {
    act(() => { useBuilder.setState({ blocks: [card], selectedBlockId: "c1", selectedBlockIds: ["c1"], selectedBlockZone: "body", componentLibraryOpen: true }); });
    const c = render();
    const button = back(c);
    expect(button).toBeTruthy();
    expect(c.querySelector(".lib-header-title")?.textContent).toBe("Stat card");
    act(() => button!.click());
    expect(useBuilder.getState().selectedBlockId).toBeNull();
    expect(useBuilder.getState().componentLibraryOpen).toBe(true);
    expect(c.querySelector(".lib-header-title")?.textContent).toBe("Components");
    expect(back(c)).toBeUndefined();
    expect(document.activeElement).toBe(c.querySelector(".lib-header-title"));
  });

  it("browse mode has no back control", () => {
    act(() => { useBuilder.setState({ blocks: [card], selectedBlockId: null, selectedBlockIds: [], selectedBlockZone: null }); });
    expect(back(render())).toBeUndefined();
  });
});
