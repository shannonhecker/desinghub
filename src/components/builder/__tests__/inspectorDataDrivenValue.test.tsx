/* Rule (owner, 5 Oct): an inspector control changes the canvas, or it is not
   offered. A gauge whose figure comes from a data binding shows that figure
   read-only ("From the sample data"); a plain gauge keeps its slider, which
   writes the `value` prop the renderer reads. A record card that always
   shows a bound record does not offer its unused Title and Empty text. */
import React, { act } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { useBuilder, type Block } from "@/store/useBuilder";
import { fxExecution } from "@/lib/executionTemplates";
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
function selectBlock(blocks: Block[], id: string, templateId: string | null) {
  act(() => {
    useBuilder.setState({ blocks, headerBlocks: [], sidebarBlocks: [], footerBlocks: [], selectedBlockId: id, selectedBlockIds: [id], selectedBlockZone: "body", activeTemplateId: templateId, reportData: null, reportState: {} } as never);
  });
}

describe("data-driven inspector fields", () => {
  it("a gauge bound to data shows its live figure read-only, with no slider", () => {
    selectBlock(fxExecution.body as Block[], "tpl-fx-passive", "fx-execution");
    const c = render();
    expect(c.querySelector('input[type="range"][aria-label="Value"]')).toBeNull();
    const row = c.querySelector('[data-field-readonly="value"]')!;
    expect(row).toBeTruthy();
    expect(row.textContent).toContain("Value");
    expect(row.querySelector(".inspector-field-value")!.textContent).toMatch(/^\d+\.\d{2}%$/);
    expect(row.textContent).toContain("From the sample data");
  });

  it("a plain gauge keeps its slider, and the slider writes the value prop the renderer reads", () => {
    const gauge: Block = { id: "g1", type: "HighchartGauge", props: { chartType: "gauge", title: "Health", value: 40 } };
    selectBlock([gauge], "g1", null);
    const c = render();
    expect(c.querySelector('[data-field-readonly="value"]')).toBeNull();
    const slider = c.querySelector('input[type="range"][aria-label="Value"]') as HTMLInputElement;
    expect(slider).toBeTruthy();
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    act(() => { setter.call(slider, "63"); slider.dispatchEvent(new Event("input", { bubbles: true })); });
    expect((useBuilder.getState().blocks[0].props as { value: number }).value).toBe(63);
    /* The renderer takes a plain gauge's figure from that same prop. */
    const renderer = readFileSync(join(process.cwd(), "src", "components", "builder", "ComponentRenderer.tsx"), "utf8");
    expect(renderer).toMatch(/bound\?\.view === "value" \? \(bound\.value \?\? undefined\) : p\.value != null \? Number\(p\.value\)/);
  });

  it("a record card that always shows a bound record does not offer its unused Title and Empty text", () => {
    selectBlock(fxExecution.body as Block[], "tpl-fx-stats", "fx-execution");
    const c = render();
    expect(c.querySelector('input[aria-label="Title"]')).toBeNull();
    expect(c.querySelector('input[aria-label="Empty text"]')).toBeNull();
    expect(c.textContent).toContain("This card shows the selected record from the data.");
  });

  it("a plain record card keeps Title and Empty text", () => {
    selectBlock([{ id: "r1", type: "RecordPanel", props: { title: "Detail" } }], "r1", null);
    const c = render();
    expect(c.querySelector('input[aria-label="Title"]')).toBeTruthy();
    expect(c.querySelector('input[aria-label="Empty text"]')).toBeTruthy();
  });
});
