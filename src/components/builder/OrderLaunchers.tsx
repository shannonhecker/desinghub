"use client";

import React, { useSyncExternalStore } from "react";
import { useBuilder, type DesignSystem } from "@/store/useBuilder";
import { RealComponentRenderer } from "@/components/ui-kit/RealComponentRenderer";
import type { SystemId } from "@/lib/componentApiRegistry";
import { orderActions } from "./useOrderSession";

/* ══════════════════════════════════════════════════════════
   OrderLaunchers - Compare and Fill now in the instrument header, each
   the active design system's own button (RealComponentRenderer), in the
   compact size the feed's controls use so the header keeps one height.
   While presenting, Compare opens the Compare dialog and Fill now the
   sample ticket at the offer (as in the original). In Edit they are
   drawn the same and do nothing, so a click selects the block.
   ══════════════════════════════════════════════════════════ */

const COMPACT: Partial<Record<SystemId, "high" | "medium">> = { salt: "medium" };
/* Carbon's primary is a wide solid block, the heaviest thing in the header:
   its ghost there, as the feed's controls are. */
const FILL_VARIANT: Partial<Record<SystemId, string>> = { carbon: "ghost" };
const noSubscription = () => () => {};
type Launch = (e?: React.MouseEvent<HTMLElement>) => void;

export function OrderLaunchers({ system, presenting, ask }: { system: DesignSystem; presenting: boolean; ask: number }) {
  const mode = useBuilder((s) => s.mode);
  const mounted = useSyncExternalStore(noSubscription, () => true, () => false);
  const button = (props: Record<string, unknown>) => (
    <RealComponentRenderer system={system as SystemId} type="SimulatedButton" mode={mode === "dark" ? "dark" : "light"} saltDensity={COMPACT[system as SystemId] ?? "high"} props={props} />
  );
  /* In Edit the two are drawn the same and are not controls: told so
     (aria-disabled) and out of the tab order, in whatever element the
     system's button is. */
  const group = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    group.current?.querySelectorAll<HTMLElement>("button, [role='button']").forEach((b) => {
      if (presenting) {
        if (b.dataset.dhInert) { b.removeAttribute("aria-disabled"); b.removeAttribute("tabindex"); delete b.dataset.dhInert; }
      } else { b.setAttribute("aria-disabled", "true"); b.setAttribute("tabindex", "-1"); b.dataset.dhInert = "1"; }
    });
  });
  const compare: Launch = (e) => orderActions.openCompare(e?.currentTarget ?? null);
  const fill: Launch = (e) => orderActions.openTicket({ side: "BUY", price: ask }, e?.currentTarget ?? null);
  return (
    <span ref={group} className="dh-order-launchers" role="group" aria-label="Order actions">
      {mounted ? (
        <>
          {button({ label: "Compare", variant: "ghost", ariaLabel: "Compare orders", title: "Compare the two orders", onClick: presenting ? compare : undefined })}
          {button({ label: "Fill now", variant: FILL_VARIANT[system as SystemId] ?? "primary", title: presenting ? "Opens the sample order ticket" : undefined, onClick: presenting ? fill : undefined })}
        </>
      ) : null}
    </span>
  );
}
