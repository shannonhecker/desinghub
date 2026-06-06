/* ════════════════════════════════════════════════════════════
   CodeBlock container width — M3 code-tab clipping regression.
   ════════════════════════════════════════════════════════════
   CodePanel reuses the active DS's *card* class as the code-block
   container (cardCls: m3-card / s-card / cb-tile / ...). M3's
   `.m3-card` carries an intrinsic `width:200px` (it sizes the M3
   card-component demo), so the M3 Code tab collapsed the code box
   to 200px — clipping the code and dropping the absolutely-
   positioned Copy button on top of the first line. Other DS card
   classes have no fixed width, so only M3 broke.

   The fix forces the code container to full width at the reuse
   point (inline style beats the class rule), instead of stripping
   `.m3-card`'s width (which the real card demos depend on). This
   asserts the container is full-width regardless of the donor card
   class so a future DS card with intrinsic sizing can't leak again.

   Uses react-dom/client + act() directly (no RTL in the repo),
   matching dsPreviewStylesHooks.test.tsx.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CodeBlock } from "../CodePanel";

/* Minimal theme stand-in — CodeBlock reads only activeSystem/bg/fg. */
const fakeTheme = (activeSystem: string) =>
  ({ activeSystem, bg: "#ffffff", fg: "#111111" } as never);

let root: Root | null = null;
afterEach(() => {
  if (root) {
    const r = root;
    act(() => r.unmount());
    root = null;
  }
});

function renderCodeBlock(cardClass: string): HTMLElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container);
    root.render(<CodeBlock code={"// long line that would overflow a 200px card ".repeat(4)} theme={fakeTheme("m3")} cardClass={cardClass} />);
  });
  return container.firstChild as HTMLElement;
}

describe("CodeBlock container is full-width regardless of the donor DS card class", () => {
  it("forces width:100% when reusing M3's fixed-width .m3-card (the clipping bug)", () => {
    const el = renderCodeBlock("m3-card");
    expect(el.style.width).toBe("100%");
  });

  it("keeps the code box from being clamped for any DS card class", () => {
    for (const cls of ["m3-card", "s-card", "cb-tile", "f-card", "a-card"]) {
      const el = renderCodeBlock(cls);
      expect(el.style.width).toBe("100%");
    }
  });
});
