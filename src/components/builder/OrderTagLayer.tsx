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
/* Events on a tag that are never the chart's. */
const STOPPED = ["mousedown", "mousemove", "mouseup", "touchstart", "touchmove", "touchend", "wheel", "dblclick", "contextmenu"];
const DRAG_START = 3;

const NAMES: Record<TagKey, string> = { limit: "Limit price", bid: "Latest bid" };

function Tag({ box, api, working, range }: { box: TagBox; api: OrderChartApi; working: boolean; range: { min: number; max: number } | null }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState<number | null>(null);
  /* What a screen reader is told: the price as it was when the tag took
     focus, then the reader's own steps. The live bid moves every tick and is
     not read out each time (the tag is aria-live="off"). */
  const [heard, setHeard] = useState(box.price);
  const [focused, setFocused] = useState(false);
  const press = useRef<{ id: number; y: number; moved: boolean; price: number | null } | null>(null);
  /* A press that did not move: the click that follows opens the menu. */
  const tapped = useRef(false);
  /* LMT of a filled order: a button for the menu (it can't be amended). */
  const adjustable = box.key === "bid" || working;
  const value = pending ?? box.price;
  const spoken = pending ?? (focused && box.key === "bid" ? heard : box.price);

  const drop = () => { setPending(null); api.preview(box.key, null); };
  const openMenu = () => { drop(); if (ref.current) orderActions.openMenu(ref.current, box.price, box.key); };

  /* The tag's keys and presses are taken natively, on the tag itself, and go
     no further: React's own stopPropagation only acts once an event has
     reached the root, after the chart's listeners (pan, zoom, the price axis)
     have already seen it. */
  const onKeyDown = (e: KeyboardEvent) => {
    const mine = () => { e.preventDefault(); e.stopPropagation(); };
    const step = (dir: 1 | -1, large: boolean) => {
      mine();
      const next = stepPrice(value, dir, large);
      setPending(next);
      api.preview(box.key, next);
    };
    if ((e.key === "F10" && e.shiftKey) || e.key === "ContextMenu") { mine(); openMenu(); return; }
    if (!adjustable) return;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") step(1, e.shiftKey);
    else if (e.key === "ArrowDown" || e.key === "ArrowLeft") step(-1, e.shiftKey);
    else if (e.key === "PageUp") step(1, true);
    else if (e.key === "PageDown") step(-1, true);
    else if (e.key === "Escape" && pending !== null) { mine(); drop(); }
    else if (e.key === "Enter") {
      mine();
      const price = value;
      drop();
      if (box.key === "limit") orderActions.openAmend(price, ref.current);
      else if (pending !== null) api.commit("bid", price, ref.current);
      else openMenu();
    }
  };
  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    /* Ours alone: no compatibility mouse events follow, so nothing under
       the tag starts a drag of its own. Focus is given by hand. */
    e.stopPropagation();
    e.preventDefault();
    const el = ref.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    press.current = { id: e.pointerId, y: e.clientY, moved: false, price: null };
    try { el.setPointerCapture(e.pointerId); } catch { /* no such pointer: the moves still reach the tag */ }
  };
  const onPointerMove = (e: PointerEvent) => {
    e.stopPropagation();
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
  const finish = (e: PointerEvent, commit: boolean) => {
    e.stopPropagation();
    const p = press.current;
    press.current = null;
    if (!p) return;
    const el = ref.current;
    if (el?.hasPointerCapture(p.id)) el.releasePointerCapture(p.id);
    api.preview(box.key, null);
    if (!commit) return;
    if (!p.moved) { tapped.current = true; return; }
    if (p.price !== null) api.commit(box.key, p.price, el);
  };
  const handlers = useRef({ onKeyDown, onPointerDown, onPointerMove, finish });
  React.useLayoutEffect(() => { handlers.current = { onKeyDown, onPointerDown, onPointerMove, finish }; });
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const key = (e: KeyboardEvent) => handlers.current.onKeyDown(e);
    const down = (e: PointerEvent) => handlers.current.onPointerDown(e);
    const move = (e: PointerEvent) => handlers.current.onPointerMove(e);
    const up = (e: PointerEvent) => handlers.current.finish(e, true);
    const cancel = (e: PointerEvent) => handlers.current.finish(e, false);
    /* A press on a tag is never the chart's (mouse and touch listeners too). */
    const stop = (e: Event) => e.stopPropagation();
    el.addEventListener("keydown", key);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", cancel);
    for (const type of STOPPED) el.addEventListener(type, stop);
    return () => {
      el.removeEventListener("keydown", key);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", cancel);
      for (const type of STOPPED) el.removeEventListener(type, stop);
    };
  }, []);

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
        ? { role: "slider", "aria-valuenow": spoken, "aria-valuetext": formatPrice(spoken), "aria-valuemin": range?.min ?? spoken, "aria-valuemax": range?.max ?? spoken, "aria-orientation": "vertical" as const }
        : {})}
      aria-live="off"
      aria-label={adjustable ? NAMES[box.key] : `${text}, filled order`}
      aria-describedby={HINT_ID}
      aria-haspopup="menu"
      title={box.key === "limit" ? (working ? "Drag to amend the limit, or click for the price menu" : "The order is filled") : "Drag to stage an order, or click for the price menu"}
      onFocus={() => { setHeard(box.price); setFocused(true); }}
      onBlur={() => { setFocused(false); if (pending !== null) drop(); }}
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
