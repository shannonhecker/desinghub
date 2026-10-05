"use client";

import { create } from "zustand";
import type { Amendment, OrderType, SampleOrder, Side } from "@/lib/executionOrders";

/* ══════════════════════════════════════════════════════════
   useOrderSession - the FX sample order workflow, for this tab only.

   What is open (the ticket, the amend dialog, Compare, a price menu),
   the toast, and what the reader confirmed this session: limit
   amendments and sample orders. It lives in memory beside the feed,
   never in the builder store, so nothing here reaches the report, a
   saved session, a share or an export. Resetting the feed (or starting
   another order's session) clears it. Nothing is ever sent anywhere.
   ══════════════════════════════════════════════════════════ */

/** How long the toast stays. */
export const TOAST_TIME = 4000;

export interface TicketRequest { side: Side; price: number; type?: OrderType }
export interface PlacedOrder extends SampleOrder { id: number; order: string }

interface OrderSession {
  /** The element that opened what is open now: focus goes back to it. */
  launcher: HTMLElement | null;
  /** `seq` tells one launch from the next (a fresh draft each time). */
  ticket: (TicketRequest & { seq: number }) | null;
  /** The amend dialog, with the price it opens on. */
  amend: { price: number; seq: number } | null;
  compare: boolean;
  menu: { anchor: HTMLElement; price: number; tag: string } | null;
  toast: { id: number; text: string } | null;
  amendments: Amendment[];
  placed: PlacedOrder[];
}

const INITIAL: OrderSession = { launcher: null, ticket: null, amend: null, compare: false, menu: null, toast: null, amendments: [], placed: [] };
export const useOrderSession = create<OrderSession>(() => ({ ...INITIAL }));

let toastTimer: ReturnType<typeof setTimeout> | null = null;
let nextId = 1;

/** One toast at a time: a new one replaces the last. */
export function showToast(text: string): void {
  if (toastTimer) clearTimeout(toastTimer);
  useOrderSession.setState({ toast: { id: nextId++, text } });
  toastTimer = setTimeout(() => { useOrderSession.setState({ toast: null }); toastTimer = null; }, TOAST_TIME);
}

export const orderActions = {
  openTicket(request: TicketRequest, launcher: HTMLElement | null): void {
    useOrderSession.setState({ ticket: { ...request, seq: nextId++ }, amend: null, compare: false, menu: null, launcher });
  },
  openAmend(price: number, launcher: HTMLElement | null): void {
    useOrderSession.setState({ amend: { price, seq: nextId++ }, ticket: null, compare: false, menu: null, launcher });
  },
  openCompare(launcher: HTMLElement | null): void {
    useOrderSession.setState({ compare: true, ticket: null, amend: null, menu: null, launcher });
  },
  openMenu(anchor: HTMLElement, price: number, tag: string): void {
    useOrderSession.setState({ menu: { anchor, price, tag }, launcher: anchor });
  },
  closeMenu(): void { useOrderSession.setState({ menu: null }); },
  close(): void { useOrderSession.setState({ ticket: null, amend: null, compare: false }); },
  /** A confirmed sample order: drawn on the chart for the session. Nothing is sent. */
  place(order: string, sample: SampleOrder): void {
    useOrderSession.setState((s) => ({ placed: [...s.placed, { ...sample, order, id: nextId++ }] }));
  },
  /** A confirmed amendment: the limit steps from `time` on. Nothing is sent. */
  amend(amendment: Amendment): void {
    useOrderSession.setState((s) => ({ amendments: [...s.amendments, amendment] }));
  },
  /** Back to the seeded session (the feed's Reset, another order's session). */
  reset(): void {
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = null;
    useOrderSession.setState({ ...INITIAL });
  },
};
