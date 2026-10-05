import { describe, it, expect, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { overlayTookEscape, useOverlayEscape } from "../overlayEscape";

/* One Escape mechanism for every kit dialog and menu: taken at the window
   on the way down while an overlay is open; the builder's own Escape (leave
   Present) asks whether it was. */
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function render(node: React.ReactElement) {
  const container = document.body.appendChild(document.createElement("div"));
  const root = createRoot(container);
  act(() => { root.render(node); });
  return {
    rerender: (next: React.ReactElement) => act(() => { root.render(next); }),
    unmount: () => { act(() => root.unmount()); container.remove(); },
  };
}

function Overlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  useOverlayEscape(open, onClose);
  return null;
}

function press(target: Element, key = "Escape") {
  let seen: KeyboardEvent | null = null;
  const onWindow = (e: KeyboardEvent) => { seen = e; };
  window.addEventListener("keydown", onWindow);
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  act(() => { target.dispatchEvent(event); });
  window.removeEventListener("keydown", onWindow);
  return { event, reached: seen !== null };
}

describe("useOverlayEscape", () => {
  it("closes the open overlay from anywhere, and the press goes no further", () => {
    const onClose = vi.fn();
    const { unmount } = render(<Overlay open onClose={onClose} />);
    const behind = document.body.appendChild(document.createElement("button"));
    const { event, reached } = press(behind);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(reached).toBe(false);
    expect(event.defaultPrevented).toBe(true);
    expect(overlayTookEscape(event)).toBe(true);
    unmount();
    behind.remove();
  });

  it("does nothing while closed, after it closes, and for other keys", () => {
    const onClose = vi.fn();
    const { rerender, unmount } = render(<Overlay open={false} onClose={onClose} />);
    const el = document.body.appendChild(document.createElement("button"));
    expect(press(el).reached).toBe(true);
    rerender(<Overlay open onClose={onClose} />);
    expect(press(el, "Enter").reached).toBe(true);
    rerender(<Overlay open={false} onClose={onClose} />);
    const after = press(el);
    expect(after.reached).toBe(true);
    expect(overlayTookEscape(after.event)).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
    unmount();
    el.remove();
  });

  it("closes the overlay opened last when two are open", () => {
    const first = vi.fn();
    const second = vi.fn();
    const a = render(<Overlay open onClose={first} />);
    const b = render(<Overlay open onClose={second} />);
    press(document.body);
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    b.unmount();
    press(document.body);
    expect(first).toHaveBeenCalledTimes(1);
    a.unmount();
  });

  it("leaves a popup open inside the overlay its own Escape, and still tells the builder to leave it alone", () => {
    const onClose = vi.fn();
    const { unmount } = render(<Overlay open onClose={onClose} />);
    const combo = document.body.appendChild(document.createElement("button"));
    combo.setAttribute("aria-expanded", "true");
    const { event, reached } = press(combo);
    expect(onClose).not.toHaveBeenCalled();
    expect(reached).toBe(true);
    expect(overlayTookEscape(event)).toBe(true);
    unmount();
    combo.remove();
  });

  it("a tree row closes the overlay (an expanded branch is not an open popup); an open dropdown keeps its Escape", () => {
    const onClose = vi.fn();
    const { unmount } = render(<Overlay open onClose={onClose} />);
    const host = document.body.appendChild(document.createElement("div"));
    host.innerHTML = '<ul role="tree"><li role="treeitem" aria-expanded="true" id="branch"><ul role="group"><li role="treeitem" id="leaf">Sector</li></ul></li></ul>'
      + '<button aria-haspopup="listbox" aria-expanded="true" id="dropdown">Sum</button>';
    press(host.querySelector("#leaf")!);
    expect(onClose).toHaveBeenCalledTimes(1);
    press(host.querySelector("#branch")!);
    expect(onClose).toHaveBeenCalledTimes(2);
    const open = press(host.querySelector("#dropdown")!);
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(open.reached).toBe(true);
    unmount();
    host.remove();
  });
});
