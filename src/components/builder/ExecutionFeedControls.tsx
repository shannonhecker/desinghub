"use client";

import React, { useSyncExternalStore } from "react";
import { useBuilder, type DesignSystem } from "@/store/useBuilder";
import { Pause, Play, RotateCcw } from "lucide-react";
import { RealComponentRenderer } from "@/components/ui-kit/RealComponentRenderer";
import type { SystemId } from "@/lib/componentApiRegistry";
import { useFeedControls } from "./useExecutionFeed";

/* ══════════════════════════════════════════════════════════
   The sample feed in the instrument header, quiet like the original's
   "Live, simulated feed" mark: a dot, what it is doing, the "Sample
   data" note, then Pause / Resume and Reset as each design system's own
   quiet icon button (ghost / subtle / IconButton), at least 24px, in a
   fixed slot so the header is one height in every system.
   ══════════════════════════════════════════════════════════ */

/* Each system's compact button that still gives a target of at least 24
   CSS pixels: Salt's high density draws a 20 pixel button, so Salt takes
   its medium size (28). */
const COMPACT: Partial<Record<SystemId, "high" | "medium">> = { salt: "medium" };

const noSubscription = () => () => {};

export type FeedStatus = "live" | "paused" | "ended" | "edit";

/* "edit": switched on, shown in Edit, where the feed does not run. It
   reads as Live (the dot does not pulse) so Edit and Present match. */
const STATUS_TEXT: Record<FeedStatus, string> = { live: "Live", paused: "Paused", ended: "Ended", edit: "Live" };
/* Line icons: a system that fills its button icons (Carbon) must not fill these. */
/* Every word the state can show: the widest one sets the slot's width. */
const SIZERS = [...new Set(Object.values(STATUS_TEXT))];
const ICON = { size: 16, strokeWidth: 2, "aria-hidden": true, style: { fill: "none" } } as const;

/** The feed's status, the "Sample data" note and two quiet icon buttons,
 *  as one group at the header's right edge. */
export function ExecutionFeedControls({ system, status, canReset, presenting, note }: { system: DesignSystem; status: FeedStatus; canReset: boolean; presenting: boolean; note: string }) {
  const mode = useBuilder((s) => s.mode);
  const { pause, resume, reset } = useFeedControls();
  /* The design systems' style engines must not run during SSR / hydration. */
  const mounted = useSyncExternalStore(noSubscription, () => true, () => false);
  const pausing = status === "live" || status === "edit";
  const button = (props: Record<string, unknown>) => (
    <RealComponentRenderer system={system as SystemId} type="SimulatedButton" mode={mode === "dark" ? "dark" : "light"} saltDensity={COMPACT[system as SystemId] ?? "high"} props={{ variant: "ghost", ...props }} />
  );

  return (
    <span className="dh-feed" role="group" aria-label="Sample feed">
      <span className={`dh-feed-status is-${status}`} title={presenting ? undefined : "The feed runs while presenting"}>
        <span className="dh-feed-dot" aria-hidden="true" />
        <span className="dh-feed-state">
          {SIZERS.map((word) => <span key={word} className="dh-feed-state-sizer" aria-hidden="true">{word}</span>)}
          <span className="dh-feed-state-word">{STATUS_TEXT[status]}</span>
        </span>
        <span className="dh-feed-note">{note}</span>
      </span>
      <span className="dh-feed-btns">
        {mounted ? (
          <>
            {button({
              label: pausing ? "Pause" : "Resume",
              icon: pausing ? <Pause {...ICON} /> : <Play {...ICON} />,
              ariaLabel: pausing ? "Pause the sample feed" : "Resume the sample feed",
              title: pausing ? "Pause" : "Resume",
              disabled: status === "ended",
              onClick: pausing ? pause : resume,
            })}
            {button({
              label: "Reset",
              icon: <RotateCcw {...ICON} />,
              ariaLabel: "Reset the sample feed",
              title: "Reset",
              disabled: !canReset,
              onClick: reset,
            })}
          </>
        ) : null}
      </span>
    </span>
  );
}
