/* ════════════════════════════════════════════════════════════
   BlockErrorBoundary — one throwing block must not take the tree.
   ────────────────────────────────────────────────────────────
   A single block renderer that throws should degrade to the same
   placeholder card the "Unknown block type" branch shows, while its
   sibling blocks keep rendering. Without the boundary, one throw
   unmounts the whole /builder tree ("Something went wrong").

   react-dom/client + React 19 act() (no RTL in the repo), matching
   dsPreviewStylesHooks.test.tsx / useChatAPI.errors.test.tsx.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { BlockErrorBoundary } from "../BlockErrorBoundary";

let root: Root | null = null;

/* A child that throws on render. */
function Boom(): React.ReactElement {
  throw new Error("renderer blew up");
}

afterEach(() => {
  if (root) {
    const r = root;
    act(() => r.unmount());
    root = null;
  }
  vi.restoreAllMocks();
});

describe("BlockErrorBoundary", () => {
  it("shows the placeholder card when a child throws and keeps siblings rendering", () => {
    /* React logs the caught error to console.error; silence it so the
       test output stays clean (the throw is intentional). */
    vi.spyOn(console, "error").mockImplementation(() => {});

    const container = document.createElement("div");
    document.body.appendChild(container);

    act(() => {
      root = createRoot(container);
      root.render(
        <div>
          <BlockErrorBoundary blockType="card">
            <Boom />
          </BlockErrorBoundary>
          <BlockErrorBoundary blockType="button">
            <span data-testid="sibling-ok">sibling content</span>
          </BlockErrorBoundary>
        </div>,
      );
    });

    /* Throwing boundary degraded to the placeholder, NOT a blank node. The
       copy reflects a render throw (type is known), not "Unknown block type". */
    expect(container.textContent).toContain("This block couldn't render.");
    /* Sibling block is untouched. */
    expect(container.querySelector('[data-testid="sibling-ok"]')).not.toBeNull();
    expect(container.textContent).toContain("sibling content");
  });

  it("renders children unchanged when nothing throws", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    act(() => {
      root = createRoot(container);
      root.render(
        <BlockErrorBoundary blockType="text">
          <span data-testid="happy">all good</span>
        </BlockErrorBoundary>,
      );
    });

    expect(container.querySelector('[data-testid="happy"]')).not.toBeNull();
    expect(container.textContent).not.toContain("This block couldn't render.");
  });
});
