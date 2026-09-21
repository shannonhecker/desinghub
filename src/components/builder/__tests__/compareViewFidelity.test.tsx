/* ════════════════════════════════════════════════════════════
   CompareView fidelity: each quadrant renders what Preview/Present
   render for that DS (real components + official token scope), and
   the five-up grid does not stack five sets of page landmarks.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useBuilder } from "@/store/useBuilder";
import { usePreviewReadOnly } from "../previewReadOnly";

/* ComponentRenderer drags every block renderer + DS package into the graph;
   replace it with a probe that records the read-only signal each quadrant
   provides (the gate ComponentRenderer uses to take the real-component path). */
const seen: { type: string; readOnly: boolean }[] = [];
vi.mock("../ComponentRenderer", () => ({
  ComponentRenderer: ({ type }: { type: string }) => {
    const readOnly = usePreviewReadOnly();
    seen.push({ type, readOnly });
    return <div data-probe={type} />;
  },
}));

import { CompareView } from "../CompareView";

let root: Root | null = null;
let container: HTMLDivElement;

beforeEach(() => {
  seen.length = 0;
  useBuilder.setState({
    designSystem: "salt",
    mode: "dark",
    themeKey: "jpm-dark",
    density: "medium",
    blocks: [{ id: "b1", type: "SimulatedButton", props: { label: "Go" } }],
    headerBlocks: [{ id: "h1", type: "AppBrand", props: { label: "App" } }],
    sidebarBlocks: [],
    footerBlocks: [],
  } as never);
  container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container);
    root.render(<CompareView />);
  });
});

afterEach(() => {
  if (root) {
    const r = root;
    act(() => r.unmount());
    root = null;
  }
  container.remove();
});

describe("CompareView — fidelity", () => {
  it("every quadrant provides the read-only signal so blocks take the real-component path", () => {
    expect(seen.length).toBe(10); // 5 systems × (1 header + 1 body block)
    expect(seen.every((s) => s.readOnly)).toBe(true);
  });

  it("carries the official-token scope: Salt gets .salt-theme + data-mode, Carbon gets data-cds-theme for the mode", () => {
    const salt = container.querySelector(".compare-quadrant-body.preview-salt");
    expect(salt?.classList.contains("salt-theme")).toBe(true);
    expect(salt?.getAttribute("data-mode")).toBe("dark");
    const carbon = container.querySelector(".compare-quadrant-body.preview-carbon");
    expect(carbon?.getAttribute("data-cds-theme")).toBe("g100");
  });

  it("the active DS keeps its live theme key; other systems use their mode default", () => {
    act(() => {
      useBuilder.setState({ designSystem: "carbon", themeKey: "g90", mode: "dark" } as never);
    });
    expect(container.querySelector(".preview-carbon")?.getAttribute("data-cds-theme")).toBe("g90");
    expect(container.querySelector(".preview-salt")?.getAttribute("data-mode")).toBe("dark");
  });

  it("does not nest five <main>/<header>/<nav>/<footer> landmark sets; each quadrant is one labelled region", () => {
    expect(container.querySelectorAll("main, header, nav, footer").length).toBe(0);
    const regions = container.querySelectorAll("section.compare-quadrant[aria-label]");
    expect(regions.length).toBe(5);
    expect(regions[0].getAttribute("aria-label")).toMatch(/Salt DS preview/);
  });

  it("Open switches the editor to that DS and leaves compare mode", () => {
    useBuilder.setState({ compareMode: true } as never);
    const open = container.querySelector<HTMLButtonElement>('button[aria-label="Switch editor to IBM Carbon"]');
    expect(open).not.toBeNull();
    act(() => open!.click());
    expect(useBuilder.getState().designSystem).toBe("carbon");
    expect(useBuilder.getState().compareMode).toBe(false);
  });
});
