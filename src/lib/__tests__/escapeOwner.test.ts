import { describe, it, expect } from "vitest";
import { ownsEscape } from "../escapeOwner";

/* An overlay that owns its Escape may be gone by the time the builder's
   listener (on the window, last) runs: ownership is decided on the way down. */
describe("ownsEscape", () => {
  const press = (target: Element, key = "Escape") => {
    let seen: KeyboardEvent | null = null;
    const onWindow = (e: KeyboardEvent) => { seen = e; };
    window.addEventListener("keydown", onWindow);
    target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    window.removeEventListener("keydown", onWindow);
    return seen as unknown as KeyboardEvent;
  };

  it("is true for a press inside an owner, even when the owner is removed while the press is handled", () => {
    const owner = document.createElement("div");
    owner.setAttribute("data-dh-escape-owner", "");
    const button = document.createElement("button");
    owner.appendChild(button);
    document.body.appendChild(owner);
    /* The overlay closes itself (and leaves the page) before the window hears the key. */
    button.addEventListener("keydown", () => owner.remove());
    const e = press(button);
    expect(owner.isConnected).toBe(false);
    expect(ownsEscape(e)).toBe(true);
  });

  it("is false for a press on the page, and for other keys", () => {
    const button = document.createElement("button");
    document.body.appendChild(button);
    expect(ownsEscape(press(button))).toBe(false);
    button.remove();
  });
});
