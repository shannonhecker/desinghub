/* ════════════════════════════════════════════════════════════
   DSPreviewStyles — React #310 regression (Rules of Hooks).
   ════════════════════════════════════════════════════════════
   DSPreviewStyles injects Carbon's stylesheet and returns null for
   every other design system. A prior version early-returned for
   non-Carbon BEFORE a useMemo, so the hook count changed (3 vs 4)
   when the design system switched to/from Carbon — React then threw
   #310 ("Rendered fewer hooks than expected") and the whole builder
   crashed ("Something went wrong"). This renders the component and
   flips the design system across the Carbon boundary; if any hook is
   gated behind the early return, the re-render throws.

   Uses react-dom/client + React 19's act() directly (no RTL in the
   repo). The component subscribes to useBuilder, so setState drives a
   real re-render inside act().
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useBuilder } from "@/store/useBuilder";
import { DSPreviewStyles } from "../PreviewPanel";

let root: Root | null = null;

afterEach(() => {
  if (root) {
    const r = root;
    act(() => r.unmount());
    root = null;
  }
});

describe("DSPreviewStyles hook stability (React #310 regression)", () => {
  it("survives switching the design system across the Carbon boundary", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    // Mount on Carbon — the path that needs the memoized stylesheet.
    act(() => {
      useBuilder.setState({ designSystem: "carbon", themeKey: "g100", density: "medium" });
    });
    act(() => {
      root = createRoot(container);
      root.render(<DSPreviewStyles />);
    });

    // Flip across the Carbon boundary repeatedly. If a hook is gated
    // behind the non-Carbon early return, one of these re-renders drops a
    // hook and React throws #310.
    expect(() => {
      act(() => useBuilder.setState({ designSystem: "salt" }));
      act(() => useBuilder.setState({ designSystem: "carbon" }));
      act(() => useBuilder.setState({ designSystem: "m3" }));
      act(() => useBuilder.setState({ designSystem: "carbon" }));
    }).not.toThrow();
  });
});
