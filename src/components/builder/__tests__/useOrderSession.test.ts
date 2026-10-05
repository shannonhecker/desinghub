/* ════════════════════════════════════════════════════════════
   The sample order session: in memory, for this tab. One toast at a
   time for four seconds; a confirmed order or amendment stays for the
   session and never touches the builder store (so it is never saved,
   shared or exported); Reset returns to the seeded state.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import { SAMPLE_CONFIRMATION } from "@/lib/executionOrders";
import { orderActions, showToast, TOAST_TIME, useOrderSession } from "../useOrderSession";

beforeEach(() => { vi.useFakeTimers(); orderActions.reset(); });
afterEach(() => { orderActions.reset(); vi.useRealTimers(); });

const sample = { side: "BUY" as const, type: "Limit" as const, venue: "Meridian Pool", notional: 1_000_000, price: 1.3765, iceberg: null, start: "Now", goodTill: "GTC" };

describe("useOrderSession", () => {
  it("shows one toast for four seconds; a second replaces the first and restarts the clock", () => {
    expect(TOAST_TIME).toBe(4000);
    showToast(SAMPLE_CONFIRMATION);
    const first = useOrderSession.getState().toast!;
    expect(first.text).toBe("Sample order. Nothing was sent.");
    vi.advanceTimersByTime(3000);
    showToast("Copied 1.37650");
    const second = useOrderSession.getState().toast!;
    expect(second.text).toBe("Copied 1.37650");
    expect(second.id).not.toBe(first.id);
    /* The first toast's timer is gone: the second stays its full four seconds. */
    vi.advanceTimersByTime(3900);
    expect(useOrderSession.getState().toast?.id).toBe(second.id);
    vi.advanceTimersByTime(200);
    expect(useOrderSession.getState().toast).toBeNull();
  });

  it("opens one thing at a time and remembers the launcher", () => {
    const launcher = document.createElement("button");
    orderActions.openTicket({ side: "SELL", price: 1.3764 }, launcher);
    expect(useOrderSession.getState()).toMatchObject({ ticket: { side: "SELL", price: 1.3764 }, amend: null, compare: false, launcher });
    /* The same request launched again is a new launch. */
    const first = useOrderSession.getState().ticket!.seq;
    orderActions.openTicket({ side: "SELL", price: 1.3764 }, launcher);
    expect(useOrderSession.getState().ticket!.seq).not.toBe(first);
    orderActions.openAmend(1.3762, null);
    expect(useOrderSession.getState()).toMatchObject({ ticket: null, amend: { price: 1.3762 }, launcher: null });
    orderActions.openCompare(launcher);
    expect(useOrderSession.getState()).toMatchObject({ amend: null, compare: true, launcher });
    orderActions.close();
    expect(useOrderSession.getState()).toMatchObject({ ticket: null, amend: null, compare: false });
  });

  it("keeps confirmed orders and amendments for the session, outside the builder store; Reset clears them", () => {
    const before = JSON.stringify({ reportState: useBuilder.getState().reportState, blocks: useBuilder.getState().blocks });
    orderActions.place("FO-0002LQD", sample);
    orderActions.amend({ order: "FO-0002LQD", time: 1, price: 1.3762 });
    showToast(SAMPLE_CONFIRMATION);
    const s = useOrderSession.getState();
    expect(s.placed).toHaveLength(1);
    expect(s.placed[0]).toMatchObject({ order: "FO-0002LQD", price: 1.3765, side: "BUY" });
    expect(s.amendments).toEqual([{ order: "FO-0002LQD", time: 1, price: 1.3762 }]);
    expect(JSON.stringify({ reportState: useBuilder.getState().reportState, blocks: useBuilder.getState().blocks })).toBe(before);
    expect(JSON.stringify(useBuilder.getState())).not.toContain("1.3762");

    orderActions.reset();
    expect(useOrderSession.getState()).toMatchObject({ placed: [], amendments: [], toast: null, ticket: null, amend: null, compare: false, menu: null });
    /* No toast timer is left behind. */
    expect(vi.getTimerCount()).toBe(0);
  });
});
