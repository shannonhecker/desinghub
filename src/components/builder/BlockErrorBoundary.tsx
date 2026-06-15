"use client";

import React from "react";

/* ════════════════════════════════════════════════════════════
   BlockErrorBoundary — isolate one block's render failure.
   ────────────────────────────────────────────────────────────
   ComponentRenderer is the single render entry shared by the
   builder canvas, the Preview/Present panels and the UI Kit. A
   block renderer that throws (bad props, a DS engine blowing up,
   a hook-order slip) would otherwise unmount the WHOLE /builder
   tree and the user sees "Something went wrong".

   Wrapping each block render in this boundary degrades a single
   throwing renderer to the SAME placeholder card the
   "Unknown block type" branch shows (ComponentRenderer.tsx), so
   sibling blocks keep rendering and the canvas stays usable.

   Zero new visual design: the markup mirrors the unknown-block
   placeholder one-for-one and references the same DS token var, so
   it adds no literal tokens.
   ════════════════════════════════════════════════════════════ */

interface BlockErrorBoundaryProps {
  /** The block's type. Logged in componentDidCatch so a failed block
     stays identifiable in the dev console (kept out of the user-facing
     placeholder copy, which is generic by design). */
  blockType?: string;
  children: React.ReactNode;
}

interface BlockErrorBoundaryState {
  hasError: boolean;
}

export class BlockErrorBoundary extends React.Component<
  BlockErrorBoundaryProps,
  BlockErrorBoundaryState
> {
  constructor(props: BlockErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): BlockErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    /* Loud-to-dev, silent-to-user — mirrors parseAIResponse's
       hallucinated-action handling. The placeholder is the user-
       facing signal; this is the trail devs grep for. */
    console.error(
      `[BlockErrorBoundary] block "${this.props.blockType ?? "unknown"}" failed to render:`,
      error,
    );
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      /* SAME visual treatment as the "Unknown block type" placeholder in
         ComponentRenderer (padding, fontSize, token colour var) but accurate
         copy: the type is known, the renderer threw — saying "Unknown block
         type" would misrepresent the failure. */
      return (
        <div
          style={{
            padding: 12,
            color: "var(--ds-fg-tertiary)",
            fontSize: 12,
          }}
        >
          This block couldn&apos;t render.
        </div>
      );
    }
    return this.props.children;
  }
}
