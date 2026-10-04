"use client";

import React, { useSyncExternalStore } from "react";
import { useBuilder, type DesignSystem } from "@/store/useBuilder";
import { RealComponentRenderer } from "@/components/ui-kit/RealComponentRenderer";
import type { SystemId } from "@/lib/componentApiRegistry";
import { useFeedControls } from "./useExecutionFeed";

/* ══════════════════════════════════════════════════════════
   The sample feed's controls, in the instrument header: what it is
   doing (Live, Paused), Pause / Resume, and Reset. The two buttons are
   the active design system's own button, at its compact size so the
   header is the same height in every system.
   ══════════════════════════════════════════════════════════ */

/* Each system's compact button that still gives a target of at least 24
   CSS pixels: Salt's high density draws a 20 pixel button, so Salt takes
   its medium size (28). */
const COMPACT: Partial<Record<SystemId, "high" | "medium">> = { salt: "medium" };

const noSubscription = () => () => {};

export type FeedStatus = "live" | "paused" | "ended" | "edit";

const STATUS_TEXT: Record<FeedStatus, string> = {
  live: "Live",
  paused: "Paused",
  ended: "Ended",
  edit: "Live in Present",
};

export function ExecutionFeedControls({ system, status, canReset, presenting }: { system: DesignSystem; status: FeedStatus; canReset: boolean; presenting: boolean }) {
  const mode = useBuilder((s) => s.mode);
  const { pause, resume, reset } = useFeedControls();
  /* The design systems' style engines must not run during SSR / hydration. */
  const mounted = useSyncExternalStore(noSubscription, () => true, () => false);
  const pausing = status === "live" || status === "edit";
  const button = (props: Record<string, unknown>) => (
    <RealComponentRenderer system={system as SystemId} type="SimulatedButton" mode={mode === "dark" ? "dark" : "light"} saltDensity={COMPACT[system as SystemId] ?? "high"} props={props} />
  );

  return (
    <span className="dh-feed" role="group" aria-label="Sample feed">
      <span className={`dh-feed-status is-${status}`}>
        <span className="dh-feed-dot" aria-hidden="true" />
        {STATUS_TEXT[status]}
      </span>
      {mounted ? (
        <>
          <span className="dh-feed-btn">
            {button({
              label: pausing ? "Pause" : "Resume",
              variant: "secondary",
              ariaLabel: pausing ? "Pause the sample feed" : "Resume the sample feed",
              title: presenting ? undefined : "The feed runs while presenting",
              disabled: status === "ended",
              onClick: pausing ? pause : resume,
            })}
          </span>
          <span className="dh-feed-btn">
            {button({
              label: "Reset",
              variant: "ghost",
              ariaLabel: "Reset the sample feed",
              disabled: !canReset,
              onClick: reset,
            })}
          </span>
        </>
      ) : null}
    </span>
  );
}
