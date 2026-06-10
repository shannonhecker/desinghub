/* ════════════════════════════════════════════════════════════
   VariantExample — renders a component-appropriate example per type.
   Uses react-dom/client + act() (no RTL), matching the repo pattern.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { VariantExample } from "../VariantExample";
import { COMPONENT_VARIANT_NAMING, COMPONENT_ANATOMY } from "@/data/ui-kit-meta";

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

  it("renders a labelled chip with a leading icon for badge assist", () => {
    const c = render("badge", "assist");
    expect(c.textContent).toContain("Ex");
    expect(c.querySelectorAll(".material-symbols-outlined").length).toBe(1);
  });

  it("renders a leading check on the selected tonal chip for badge filter", () => {
    const c = render("badge", "filter");
    expect(c.textContent).toContain("Ex");
    expect(c.querySelector(".material-symbols-outlined")?.textContent).toBe("check");
  });

  it("renders a trailing remove affordance for badge input", () => {
    const c = render("badge", "input");
    expect(c.textContent).toContain("Ex");
    expect(c.querySelector(".material-symbols-outlined")?.textContent).toBe("close");
  });

  it("renders a plain outlined chip with no icon for badge suggestion", () => {
    const c = render("badge", "suggestion");
    expect(c.textContent).toContain("Ex");
    expect(c.querySelector(".material-symbols-outlined")).toBeNull();
  });

  it("registers the four M3 chip types in COMPONENT_VARIANT_NAMING under chip", () => {
    expect((COMPONENT_VARIANT_NAMING.chip?.m3 ?? []).map((v) => v.style)).toEqual([
      "assist",
      "filter",
      "input",
      "suggestion",
    ]);
  });

  it("registers M3 chip anatomy for the Specs anatomy section", () => {
    expect(COMPONENT_ANATOMY.chip?.m3?.parts.length).toBeGreaterThan(0);
  });

  it("registers the M3 dot + count badge types in COMPONENT_VARIANT_NAMING under badge", () => {
    expect((COMPONENT_VARIANT_NAMING.badge?.m3 ?? []).map((v) => v.style)).toEqual([
      "dot",
      "count",
    ]);
  });

  it("registers M3 count-badge anatomy for the Specs anatomy section", () => {
    expect(COMPONENT_ANATOMY.badge?.m3?.parts.length).toBeGreaterThan(0);
  });
});
