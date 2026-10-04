/* ════════════════════════════════════════════════════════════
   A real button can act: the FX feed's Pause / Resume and Reset are
   the design system's own button in every system, so the button block
   passes a click handler, an accessible name and a title through.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, afterEach, beforeAll, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { RealComponentRenderer } from "../RealComponentRenderer";

beforeAll(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  if (typeof globalThis.ResizeObserver === "undefined") {
    globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
  }
  if (typeof window.matchMedia !== "function") {
    window.matchMedia = ((q: string) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  }
});

let root: Root | null = null;
let container: HTMLDivElement | null = null;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

describe("SimulatedButton, real, with an action", () => {
  for (const system of ["salt", "m3", "fluent", "uoaui", "carbon"] as const) {
    it(`${system}: click, name and title reach the button`, () => {
      const onClick = vi.fn();
      container = document.createElement("div");
      document.body.appendChild(container);
      act(() => {
        root = createRoot(container!);
        root.render(<RealComponentRenderer system={system} type="SimulatedButton" mode="light" saltDensity="high" props={{ label: "Reset", variant: "secondary", onClick, ariaLabel: "Reset the sample feed", title: "Start the sample session again" }} />);
      });
      const button = container.querySelector("button")!;
      expect(button).not.toBeNull();
      expect(button.getAttribute("aria-label")).toBe("Reset the sample feed");
      expect(button.getAttribute("title")).toBe("Start the sample session again");
      act(() => button.click());
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  }
});
