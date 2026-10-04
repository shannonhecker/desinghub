"use client";

import React, { useState } from "react";
import { RealComponentRenderer } from "@/components/ui-kit/RealComponentRenderer";
import type { KitDialogModel, KitField } from "@/components/ui-kit/RealDialogKit";
import type { SystemId } from "@/lib/componentApiRegistry";
import { splitQuote } from "@/lib/executionModel";
import {
  draftTicket, GOOD_TILL, ORDER_TYPES, SAMPLE_ACCOUNT, SAMPLE_CONFIRMATION, START_OPTIONS, validateTicket,
  type Market, type Side, type TicketDraft, type TicketErrors,
} from "@/lib/executionOrders";
import { orderActions, showToast, type TicketRequest } from "./useOrderSession";

/* ══════════════════════════════════════════════════════════
   OrderTicket - the sample order ticket, as the original lays it out:
   the pair, two price tiles to pick the side, then order type,
   liquidity pool, direction, notional, limit or stop price, iceberg,
   start, good till and account. Every control is the active design
   system's own (RealComponentRenderer, KitDialog).

   Submit validates (a positive notional, a price inside a sane band of
   the market). A valid ticket is drawn on the chart for the session and
   a toast says "Sample order. Nothing was sent." Nothing is sent: there
   is no request of any kind.
   ══════════════════════════════════════════════════════════ */

export interface TicketContext {
  system: SystemId;
  mode: "light" | "dark";
  pair: string;
  order: string;
  market: Market;
  venues: string[];
  launcher: HTMLElement | null;
  tones: React.CSSProperties;
}

/** The ticket for one launch; keyed by the caller, so a new launch starts a
 *  new draft. It stays mounted when closed (`open` false) so each system
 *  closes its dialog its own way. */
export function OrderTicket({ request, open, ctx }: { request: TicketRequest; open: boolean; ctx: TicketContext }) {
  const base = ctx.pair.slice(0, 3);
  const quote = ctx.pair.slice(3, 6);
  const [draft, setDraft] = useState<TicketDraft>(() => draftTicket({ ...request, market: ctx.market, venue: ctx.venues[0] ?? "" }));
  const [errors, setErrors] = useState<TicketErrors | null>(null);
  const set = (patch: Partial<TicketDraft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    /* Once Submit has been tried, the messages follow the fields. */
    if (errors) { const r = validateTicket(next, ctx.market); setErrors(r.ok ? {} : r.errors); }
  };
  const pickSide = (side: Side) => set({ side, price: (side === "SELL" ? ctx.market.bid : ctx.market.ask).toFixed(5) });
  const submit = () => {
    const r = validateTicket(draft, ctx.market);
    if (!r.ok) { setErrors(r.errors); return; }
    orderActions.place(ctx.order, r.order);
    orderActions.close();
    showToast(SAMPLE_CONFIRMATION);
  };

  const tile = (side: Side) => {
    const price = side === "SELL" ? ctx.market.bid : ctx.market.ask;
    const { handle, pips } = splitQuote(price);
    return {
      value: side,
      name: `${side === "SELL" ? "Sell" : "Buy"} ${base} at ${price.toFixed(5)}`,
      caption: `${side === "SELL" ? "S" : "B"} ${base}`,
      lead: handle, figure: pips.slice(0, 2), tail: pips.slice(2),
    };
  };
  const priceField: KitField = draft.type === "Market"
    ? { kind: "static", id: "dh-ticket-price", label: "Price", value: "At market" }
    : { kind: "text", id: "dh-ticket-price", label: draft.type === "Stop" ? "Stop price" : draft.type === "Take profit" ? "Take profit price" : "Limit price", value: draft.price, inputMode: "decimal", align: "end", error: errors?.price, onChange: (price) => set({ price }) };

  const model: KitDialogModel = {
    open,
    name: "ticket",
    title: `${ctx.pair} order ticket`,
    description: "Sample data. Nothing is sent.",
    size: "medium",
    choice: { label: "Side", value: draft.side, options: [tile("SELL"), tile("BUY")], onChange: (v) => pickSide(v as Side) },
    rows: [
      [
        { kind: "select", id: "dh-ticket-type", label: "Order type", value: draft.type, options: ORDER_TYPES, onChange: (v) => set({ type: v as TicketDraft["type"] }) },
        { kind: "select", id: "dh-ticket-pool", label: "Liquidity pool", value: draft.venue, options: ctx.venues, onChange: (venue) => set({ venue }) },
      ],
      [{ kind: "static", id: "dh-ticket-direction", label: "Direction", value: draft.side === "BUY" ? `Buy ${base}, sell ${quote}` : `Sell ${base}, buy ${quote}` }],
      [
        { kind: "text", id: "dh-ticket-notional", label: `Notional (${base})`, value: draft.notional, inputMode: "decimal", align: "end", error: errors?.notional, onChange: (notional) => set({ notional }) },
        priceField,
      ],
      [
        { kind: "text", id: "dh-ticket-iceberg", label: `Iceberg (${base}, optional)`, value: draft.iceberg, inputMode: "decimal", align: "end", error: errors?.iceberg, onChange: (iceberg) => set({ iceberg }) },
        { kind: "select", id: "dh-ticket-start", label: "Start", value: draft.start, options: START_OPTIONS, onChange: (v) => set({ start: v as TicketDraft["start"] }) },
      ],
      [
        { kind: "select", id: "dh-ticket-goodtill", label: "Good till", value: draft.goodTill, options: GOOD_TILL, onChange: (v) => set({ goodTill: v as TicketDraft["goodTill"] }) },
        { kind: "static", id: "dh-ticket-account", label: "Account", value: SAMPLE_ACCOUNT },
      ],
    ],
    primary: { label: "Submit sample order", onClick: submit },
    secondary: { label: "Cancel" },
    onClose: orderActions.close,
    returnFocus: { current: ctx.launcher },
    tones: ctx.tones,
  };
  return <RealComponentRenderer system={ctx.system} type="KitDialog" mode={ctx.mode} saltDensity="medium" props={{ model }} />;
}
