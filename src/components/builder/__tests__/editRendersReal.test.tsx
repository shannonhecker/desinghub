/* ════════════════════════════════════════════════════════════
   Edit-mode fidelity: registry-covered blocks render as the REAL DS
   component while editing (default), their props are edited in the
   inspector (selecting one opens it), and the preference can be
   switched back to the simulated facsimiles.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useBuilder } from "@/store/useBuilder";
import { PreviewReadOnlyContext } from "../previewReadOnly";

/* The real renderer pulls every DS package; replace it with a probe and a
   coverage function that covers only the button, so a second block type
   proves the simulated fallback still runs for uncovered pairs. */
vi.mock("../../ui-kit/RealComponentRenderer", () => ({
  RealComponentRenderer: ({ type }: { type: string }) => <div data-real={type} />,
  canRenderReal: (_system: string, type: string) => type === "SimulatedButton",
}));
/* next/dynamic (Highcharts lazy import) is not needed for these blocks. */
vi.mock("next/dynamic", () => ({ default: () => () => null }));

import { ComponentRenderer } from "../ComponentRenderer";

let root: Root | null = null;
let container: HTMLDivElement;

function mount(ui: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container);
    root.render(ui);
  });
}

beforeEach(() => {
  useBuilder.setState({
    designSystem: "salt",
    mode: "dark",
    density: "medium",
    editRendersReal: true,
    componentLibraryOpen: false,
    selectedBlockId: null,
    selectedBlockZone: null,
    selectedBlockIds: [],
    blocks: [{ id: "b1", type: "SimulatedButton", props: { label: "Go" } }],
    headerBlocks: [],
    sidebarBlocks: [],
    footerBlocks: [],
  } as never);
});

afterEach(() => {
  if (root) {
    const r = root;
    act(() => r.unmount());
    root = null;
  }
  container?.remove();
});

describe("ComponentRenderer — real components in Edit mode", () => {
  it("renders a covered block as the real DS component in EDIT mode (readOnly=false) by default", () => {
    mount(<ComponentRenderer type="SimulatedButton" system="salt" blockId="b1" label="Go" />);
    expect(container.querySelector('[data-real="SimulatedButton"]')).not.toBeNull();
  });

  it("falls back to the simulated facsimile when the preference is off", () => {
    useBuilder.setState({ editRendersReal: false } as never);
    mount(<ComponentRenderer type="SimulatedButton" system="salt" blockId="b1" label="Go" />);
    expect(container.querySelector("[data-real]")).toBeNull();
    /* The simulated button renders its label (inline-styled facsimile). */
    expect(container.textContent).toContain("Go");
  });

  it("read-only surfaces (Preview / Present / Compare) render real regardless of the preference", () => {
    useBuilder.setState({ editRendersReal: false } as never);
    mount(
      <PreviewReadOnlyContext.Provider value={true}>
        <ComponentRenderer type="SimulatedButton" system="salt" blockId="b1" label="Go" />
      </PreviewReadOnlyContext.Provider>,
    );
    expect(container.querySelector('[data-real="SimulatedButton"]')).not.toBeNull();
  });

  it("uncovered blocks keep the simulated renderer (honest fallback)", () => {
    mount(<ComponentRenderer type="SimulatedTitle" system="salt" blockId="t1" text="Hello" level="h2" />);
    expect(container.querySelector("[data-real]")).toBeNull();
    expect(container.textContent).toContain("Hello");
  });

  it("selecting a real-rendered block in Edit mode opens the inspector panel (where its props are edited)", () => {
    mount(<ComponentRenderer type="SimulatedButton" system="salt" blockId="b1" label="Go" />);
    expect(useBuilder.getState().componentLibraryOpen).toBe(false);
    act(() => {
      useBuilder.getState().setSelectedBlock("b1", "body");
    });
    expect(useBuilder.getState().componentLibraryOpen).toBe(true);
  });

  it("selecting a simulated block does not force the panel open (inline editing handles it)", () => {
    useBuilder.setState({ editRendersReal: false } as never);
    mount(<ComponentRenderer type="SimulatedButton" system="salt" blockId="b1" label="Go" />);
    act(() => {
      useBuilder.getState().setSelectedBlock("b1", "body");
    });
    expect(useBuilder.getState().componentLibraryOpen).toBe(false);
  });
});

describe("useBuilder — editRendersReal preference", () => {
  it("defaults on and toggles", () => {
    expect(useBuilder.getState().editRendersReal).toBe(true);
    useBuilder.getState().toggleEditRendersReal();
    expect(useBuilder.getState().editRendersReal).toBe(false);
    useBuilder.getState().setEditRendersReal(true);
    expect(useBuilder.getState().editRendersReal).toBe(true);
  });
});
