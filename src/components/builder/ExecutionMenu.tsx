"use client";

import React from "react";
import { RealComponentRenderer } from "@/components/ui-kit/RealComponentRenderer";
import type { KitMenuItem, KitMenuModel } from "@/components/ui-kit/RealDialogKit";
import type { SystemId } from "@/lib/componentApiRegistry";
import { formatPrice } from "@/lib/executionModel";
import { orderActions, showToast } from "./useOrderSession";

/* ══════════════════════════════════════════════════════════
   ExecutionMenu - a price tag's menu, anchored to the tag, in the
   active design system's own menu (RealComponentRenderer, KitMenu).

   PR D items: Buy limit, Sell stop and Add order at the tag's price
   (each opens the ticket), Amend limit price (the dialog path of the
   limit drag; off for a filled order) and Copy price. PR C adds the
   plot and price-axis menus (alerts, drawings, scale) beside this one.
   ══════════════════════════════════════════════════════════ */

export function PriceMenu({ system, mode, open, anchor, price, working }: { system: SystemId; mode: "light" | "dark"; open: boolean; anchor: HTMLElement; price: number; working: boolean }) {
  const p = formatPrice(price);
  const items: KitMenuItem[] = [
    { id: "buy", label: `Buy limit at ${p}`, onSelect: () => orderActions.openTicket({ side: "BUY", price, type: "Limit" }, anchor) },
    { id: "sell", label: `Sell stop at ${p}`, onSelect: () => orderActions.openTicket({ side: "SELL", price, type: "Stop" }, anchor) },
    { id: "order", label: `Add order at ${p}`, onSelect: () => orderActions.openTicket({ side: "BUY", price }, anchor) },
    { id: "amend", label: working ? "Amend limit price" : "Amend limit price (order filled)", disabled: !working, onSelect: () => orderActions.openAmend(price, anchor) },
    {
      id: "copy", label: `Copy price ${p}`,
      onSelect: () => {
        void navigator.clipboard?.writeText(p).then(() => showToast(`Copied ${p}`), () => showToast(`Couldn't copy ${p}`));
        anchor.focus();
      },
    },
  ];
  const model: KitMenuModel = { open, label: `Price ${p}`, anchor, items, onClose: orderActions.closeMenu };
  return <RealComponentRenderer system={system} type="KitMenu" mode={mode} props={{ model }} />;
}
