"use client";

import React from "react";

/* ══════════════════════════════════════════════════════════
   LifecyclePill - small status chip that hovers near the
   most-recent assistant message and reflects the current
   generation phase. Closes the "Hidden System State" anti-
   pattern: users see whether the model is thinking, streaming,
   wrapped up, or errored without having to interpret the
   progress shimmer.

   States: idle (rendered as null), thinking, streaming, tool,
   done, error. All colour mapping flows through --bc-*
   semantic tokens; reduced-motion users get an instant swap
   instead of the 300ms cross-fade.
   ══════════════════════════════════════════════════════════ */

export type LifecycleState =
  | "idle"
  | "thinking"
  | "streaming"
  | "tool"
  | "done"
  | "error";

interface LifecyclePillProps {
  state: LifecycleState;
  errorText?: string;
}

const STATE_LABEL: Record<Exclude<LifecycleState, "idle">, string> = {
  thinking: "Thinking",
  streaming: "Streaming",
  tool: "Using tool",
  done: "Done",
  error: "Error",
};

export function LifecyclePill({ state, errorText }: LifecyclePillProps) {
  if (state === "idle") return null;
  const label = state === "error" && errorText ? errorText : STATE_LABEL[state];
  return (
    <div
      className={`lifecycle-pill lifecycle-pill-${state}`}
      role="status"
      aria-live="polite"
    >
      <span className="lifecycle-pill-dot" aria-hidden="true" />
      <span className="lifecycle-pill-label">{label}</span>
    </div>
  );
}
