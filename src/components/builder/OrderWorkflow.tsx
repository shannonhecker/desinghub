"use client";

import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useBuilder, type DesignSystem } from "@/store/useBuilder";
import type { SystemId } from "@/lib/componentApiRegistry";
import { resolveExecution } from "@/lib/executionModel";
import { canAmend } from "@/lib/executionOrders";
import { parseExecutionTime } from "@/lib/reportData/executionDataset";
import { tableOf, type ReportDataset } from "@/lib/reportData/types";
import type { ThemeVars } from "./SimulatedHighchart";
import { AmendDialog, CompareDialog } from "./ExecutionDialogs";
import { PriceMenu } from "./ExecutionMenu";
import { OrderTicket } from "./OrderTicket";
import { useFeedDataset, useFeedStore } from "./useExecutionFeed";
import { orderActions, useOrderSession } from "./useOrderSession";

/* ══════════════════════════════════════════════════════════
   OrderWorkflow - where the FX sample order workflow is drawn while
   presenting: the ticket, Amend, Compare, a price menu, and the one
   toast. Every launcher (the header's quote tiles, Fill now and
   Compare; the price tags and their menu) writes to useOrderSession;
   this draws what it says. Reset on the feed clears the session.

   The toast is the page's only polite live region for the workflow:
   one message at a time for four seconds, never stacked. Nothing is
   ever sent anywhere.
   ══════════════════════════════════════════════════════════ */

const noSubscription = () => () => {};

/** The last thing that was open: a closed dialog keeps its content while it
 *  closes (each system closes its own way, through `open`). */
function useLast<T>(value: T | null): T | null {
  const [last, setLast] = useState(value);
  if (value !== null && value !== last) setLast(value);
  return value ?? last;
}

export function OrderWorkflow({ system, dataset, vars, palette }: { system: DesignSystem; dataset: ReportDataset | null; vars: ThemeVars | null; palette: string[] }) {
  const mode = useBuilder((s) => (s.mode === "dark" ? "dark" : "light"));
  const reportState = useBuilder((s) => s.reportState);
  const session = useOrderSession();
  const live = useFeedDataset(dataset);
  const view = useMemo(() => (live ? resolveExecution(live, reportState) : null), [live, reportState]);
  const mounted = useSyncExternalStore(noSubscription, () => true, () => false);
  const ticket = useLast(session.ticket);
  const amend = useLast(session.amend);
  const menu = useLast(session.menu);
  /* Compare is drawn from its first opening on (it then closes through `open`). */
  const [compared, setCompared] = useState(false);
  if (session.compare && !compared) setCompared(true);

  /* The feed starting again (Reset, another order) returns to the seeded session. */
  const generation = useFeedStore((s) => s.generation);
  const seen = useRef(generation);
  useEffect(() => {
    if (generation !== seen.current) { seen.current = generation; orderActions.reset(); }
  }, [generation]);
  /* Leaving Present closes what is open (the session's orders stay). */
  useEffect(() => () => { orderActions.close(); orderActions.closeMenu(); }, []);

  if (!view || !view.last) return null;
  const market = { bid: view.last.bid, ask: view.last.ask };
  const tones = vars ? ({ "--dh-kit-up": vars.positive, "--dh-kit-down": vars.negative } as React.CSSProperties) : {};
  const ctx = { system: system as SystemId, mode, launcher: session.launcher, tones } as const;
  const latest = () => {
    const samples = useFeedStore.getState().samples;
    if (samples.length) return samples[samples.length - 1].time;
    const rows = dataset ? tableOf(dataset, "market")?.rows ?? [] : [];
    return rows.length ? parseExecutionTime(rows[rows.length - 1].time) : Date.now();
  };
  const limit = view.pills.find((p) => p.key === "limit")?.value ?? market.bid;

  return (
    <>
      {mounted ? (
        <>
          {ticket ? (
            <OrderTicket key={ticket.seq} open={Boolean(session.ticket)} request={ticket} ctx={{ ...ctx, pair: view.pair, order: view.order.id, market, venues: view.venues.length ? view.venues : ["Any venue"] }} />
          ) : null}
          {amend ? <AmendDialog key={amend.seq} open={Boolean(session.amend)} ctx={ctx} order={view.order} current={limit} start={amend.price} market={market} latest={latest} /> : null}
          {compared && live ? <CompareDialog open={session.compare} ctx={ctx} dataset={live} vars={vars} palette={palette} /> : null}
          {menu ? <PriceMenu system={system as SystemId} mode={mode} open={Boolean(session.menu)} anchor={menu.anchor} price={menu.price} working={canAmend(view.order)} /> : null}
        </>
      ) : null}
      <div className={`dh-order-toast${session.toast ? " is-shown" : ""}`} role="status" aria-live="polite" aria-atomic="true">
        {session.toast ? <span key={session.toast.id}><span className="dh-order-toast-dot" aria-hidden="true" />{session.toast.text}</span> : null}
      </div>
    </>
  );
}
