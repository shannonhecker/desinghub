"use client";

import React from "react";

/**
 * Edge cue for a horizontal scroller, set only when it is true.
 *
 * The element gets `data-fade="end"`, `"start"` or `"both"` while content
 * continues past that edge, and no attribute when it does not scroll or has
 * reached the edge. kit-chrome.css fades the marked edge. A row that fits is
 * never masked, so nothing dissolves at the right edge of a wide screen.
 *
 * Returns a ref callback; attach it to the scrolling element.
 */
export function useEdgeFade<T extends HTMLElement>(): (el: T | null) => void {
  const cleanup = React.useRef<(() => void) | null>(null);
  return React.useCallback((el: T | null) => {
    cleanup.current?.();
    cleanup.current = null;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const start = max > 1 && el.scrollLeft > 1;
      const end = max > 1 && el.scrollLeft < max - 1;
      const next = start && end ? "both" : end ? "end" : start ? "start" : null;
      if (next === null) el.removeAttribute("data-fade");
      else if (el.getAttribute("data-fade") !== next) el.setAttribute("data-fade", next);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    /* Content that arrives later (a live component mounting) changes the
       scroll width without resizing the scroller itself. */
    for (const child of Array.from(el.children)) ro?.observe(child);
    const mo = typeof MutationObserver !== "undefined" ? new MutationObserver(update) : null;
    mo?.observe(el, { childList: true });
    cleanup.current = () => { el.removeEventListener("scroll", update); ro?.disconnect(); mo?.disconnect(); };
  }, []);
}

/** Bring one child of a horizontal scroller into view without moving the
    page: only the scroller's own scrollLeft changes. */
export function revealInline(scroller: HTMLElement | null, child: HTMLElement | null, pad = 24): void {
  if (!scroller || !child) return;
  const s = scroller.getBoundingClientRect();
  const c = child.getBoundingClientRect();
  if (c.left < s.left + pad) scroller.scrollLeft -= s.left + pad - c.left;
  else if (c.right > s.right - pad) scroller.scrollLeft += c.right - (s.right - pad);
}
