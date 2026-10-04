"use client";

import React, { useRef, useState } from "react";
import { formatPrice } from "@/lib/executionModel";
import { stepPrice } from "@/lib/executionOrders";
import { orderActions } from "./useOrderSession";
import { useTagStore, type OrderChartApi, type TagBox, type TagKey } from "./useOrderAmend";

/* ══════════════════════════════════════════════════════════
   OrderTagLayer - a target over the LMT and BID price tags (they are
   drawn in the chart's SVG and redrawn every bar; these stay put, so
   focus and a drag survive a tick).

   Pointer: press and drag to amend (LMT) or stage (BID); a press that
   does not move is a click and opens the tag's price menu. The targets
   take touch themselves (touch-action: none) so a finger on a tag drags
   it, and a finger anywhere else still scrolls the page.
   Keyboard: each is a slider over the price. Arrows step 0.00001
   (Shift, or Page Up / Down: a pip), Enter amends the limit or stages a
   ticket, Shift+F10 or the menu key opens the price menu, Escape drops
   the stepped price.
   ══════════════════════════════════════════════════════════ */

const HINT_ID = "dh-order-tag-hint";
const DRAG_START = 3;

const NAMES: Record<TagKey, string> = { limit: "Limit price", bid: "Latest bid" };

function Tag({ box, api, working, range }: { box: TagBox; api: OrderChartApi; working: boolean; range: { min: number; max: number } | null }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState<number | null>(null);
  const press = useRef<{ id: number; y: number; moved: boolean; price: number | null } | null>(null);
  /* A press that did not move: the click that follows opens the menu. */
  const tapped = useRef(false);
  /* LMT of a filled order: a button for the menu (it can't be amended). */
  const adjustable = box.key === "bid" || working;
  const value = pending ?? box.price;

  const drop = () => { setPending(null); api.preview(box.key, null); };
  const openMenu = () => { drop(); if (ref.current) orderActions.openMenu(ref.current, box.price, box.key); };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const step = (dir: 1 | -1, large: boolean) => {
      e.preventDefault();
      const next = stepPrice(value, dir, large);
      setPending(next);
      api.preview(box.key, next);
    };
    if ((e.key === "F10" && e.shiftKey) || e.key === "ContextMenu") { e.preventDefault(); openMenu(); return; }
    if (!adjustable) return;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") step(1, e.shiftKey);
    else if (e.key === "ArrowDown" || e.key === "ArrowLeft") step(-1, e.shiftKey);
    else if (e.key === "PageUp") step(1, true);
    else if (e.key === "PageDown") step(-1, true);
    else if (e.key === "Escape" && pending !== null) { e.preventDefault(); e.stopPropagation(); drop(); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const price = value;
      drop();
      if (box.key === "limit") orderActions.openAmend(price, ref.current);
      else if (pending !== null) api.commit("bid", price, ref.current);
      else openMenu();
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    press.current = { id: e.pointerId, y: e.clientY, moved: false, price: null };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* no such pointer: the moves still reach the tag */ }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const p = press.current;
    if (!p || !adjustable) return;
    if (!p.moved && Math.abs(e.clientY - p.y) < DRAG_START) return;
    p.moved = true;
    e.preventDefault();
    const price = api.priceAt(e);
    if (price === null) return;
    p.price = price;
    api.preview(box.key, price);
  };
  const finish = (e: React.PointerEvent<HTMLButtonElement>, commit: boolean) => {
    const p = press.current;
    press.current = null;
    if (!p) return;
    if (e.currentTarget.hasPointerCapture(p.id)) e.currentTarget.releasePointerCapture(p.id);
    api.preview(box.key, null);
    if (!commit) return;
    if (!p.moved) { tapped.current = true; return; }
    if (p.price !== null) api.commit(box.key, p.price, ref.current);
  };

  /* A drag in progress is cancelled by Escape (taken before the builder's,
     which would leave Present). */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !press.current) return;
      e.stopPropagation();
      e.preventDefault();
      const id = press.current.id;
      press.current = null;
      if (ref.current?.hasPointerCapture(id)) ref.current.releasePointerCapture(id);
      api.preview(box.key, null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [api, box.key]);

  const text = `${NAMES[box.key]} ${formatPrice(value)}`;
  return (
    <button
      ref={ref}
      type="button"
      className={`dh-order-tag dh-order-tag-${box.key}${pending !== null ? " is-stepped" : ""}`}
      style={{ "--dh-order-tag-top": `${box.top}`, "--dh-order-tag-left": `${box.left}`, "--dh-order-tag-w": `${box.width}`, "--dh-order-tag-h": `${box.height}` } as React.CSSProperties}
      data-price={formatPrice(box.price)}
      {...(adjustable
        ? { role: "slider", "aria-valuenow": value, "aria-valuetext": formatPrice(value), "aria-valuemin": range?.min ?? value, "aria-valuemax": range?.max ?? value, "aria-orientation": "vertical" as const }
        : {})}
      aria-label={adjustable ? NAMES[box.key] : `${text}, filled order`}
      aria-describedby={HINT_ID}
      aria-haspopup="menu"
      title={box.key === "limit" ? (working ? "Drag to amend the limit, or click for the price menu" : "The order is filled") : "Drag to stage an order, or click for the price menu"}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => finish(e, true)}
      onPointerCancel={(e) => finish(e, false)}
      onBlur={() => { if (pending !== null) drop(); }}
      onClick={(e) => {
        e.stopPropagation();
        /* A keyboard click (Space), or the click after a press that did not
           move. Opened after this click has finished: a menu that closes on
           an outside click would otherwise take this one as its own. */
        if (e.detail !== 0 && !tapped.current) return;
        tapped.current = false;
        window.setTimeout(openMenu, 0);
      }}
    />
  );
}

/** The targets, over the tags as they are drawn now. */
export function OrderTagLayer({ api }: { api: OrderChartApi }) {
  const boxes = useTagStore((s) => s.boxes);
  const working = useTagStore((s) => s.working);
  const range = useTagStore((s) => s.range);
  return (
    <div className="dh-order-layer">
      {boxes.map((b) => <Tag key={b.key} box={b} api={api} working={working} range={range} />)}
      <span id={HINT_ID} hidden>Arrow keys move the price. Enter amends the limit, or stages an order from the bid. Shift F10 opens the price menu.</span>
    </div>
  );
}
