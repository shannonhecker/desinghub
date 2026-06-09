/* ════════════════════════════════════════════════════════════
   VariantExample — renders a component-appropriate example per type.
   Uses react-dom/client + act() (no RTL), matching the repo pattern.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { VariantExample } from "../VariantExample";

const t = {
  bg: "#111111", bg2: "#222222", fg: "#ffffff", fg2: "#aaaaaa",
  accent: "#6750A4", accentText: "#ffffff", border: "#333333", font: "system-ui",
} as never;

let root: Root | null = null;
afterEach(() => {
  if (root) { const r = root; act(() => r.unmount()); root = null; }
});

function render(componentId: string, style: string): HTMLElement {
  const c = document.createElement("div");
  document.body.appendChild(c);
  act(() => {
    root = createRoot(c);
    root.render(<VariantExample componentId={componentId} style={style} label="Ex" t={t} />);
  });
  return c;
}

describe("VariantExample", () => {
  it("renders a labelled pill example for button", () => {
    expect(render("button", "solid").textContent).toContain("Ex");
  });

  it("renders a card-shaped example for card (a container, not the label)", () => {
    const c = render("card", "elevated");
    expect(c.querySelector("div")).toBeTruthy();
    expect(c.textContent).not.toContain("Ex");
  });

  it("renders an input-shaped example for textInput", () => {
    expect(render("textInput", "filled").textContent).toContain("Value");
  });

  it("renders nothing for a component without an example shape", () => {
    expect(render("avatar", "image").childElementCount).toBe(0);
  });
});
