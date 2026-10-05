/**
 * overlayEscape - the one place Escape is decided while an overlay is open.
 *
 * Every kit dialog and menu (RealDialogKit, RealFormDialog) registers here
 * while it is open. One listener on the window, on the way down, takes the
 * key before anything else can: it closes the overlay opened last and the
 * press goes no further, so it never also leaves Present, wherever focus
 * happens to be (inside the overlay, on its backdrop, on the page behind).
 *
 * One exception: a popup open inside the overlay (a dropdown's list). That
 * Escape is the popup's own; it is let through to the design system, and
 * remembered, so the builder's Escape (`overlayTookEscape`) still leaves it
 * alone.
 */

import { useEffect, useRef } from "react";

interface Entry { close: () => void }
const stack: Entry[] = [];
const taken = new WeakSet<Event>();

/** A control with its popup open, or an element of that popup. */
const NESTED = '[aria-expanded="true"], [role="listbox"], [role="option"]';

function onKey(e: KeyboardEvent): void {
  if (e.key !== "Escape" || stack.length === 0) return;
  taken.add(e);
  if (e.target instanceof Element && e.target.closest(NESTED)) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  stack[stack.length - 1].close();
}

function register(entry: Entry): () => void {
  if (stack.length === 0 && typeof window !== "undefined") window.addEventListener("keydown", onKey, true);
  stack.push(entry);
  return () => {
    const at = stack.indexOf(entry);
    if (at >= 0) stack.splice(at, 1);
    if (stack.length === 0 && typeof window !== "undefined") window.removeEventListener("keydown", onKey, true);
  };
}

/** While `open`, Escape closes this overlay (the one opened last, if several) and nothing else. */
export function useOverlayEscape(open: boolean, onClose: () => void): void {
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; });
  useEffect(() => (open ? register({ close: () => close.current() }) : undefined), [open]);
}

/** True when this Escape was pressed while an overlay was open (it was the overlay's, or its popup's). */
export function overlayTookEscape(e: KeyboardEvent): boolean {
  return taken.has(e);
}

/* How long after closing to hand focus back: at once, and again after the
   systems' exit animations (some keep focus in a closing dialog until then). */
const HAND_BACK = [0, 120, 320];
/** Where focus may be taken from: nowhere, the page body, or a closing overlay. */
const OVERLAY = '[role="dialog"], [role="menu"], [role="presentation"], .dh-form-dialog, .dh-kit-scope, .dh-kit-dialog, .dh-kit-menu';
/* Hand-backs still waiting: an overlay that opens meanwhile cancels them (it takes focus itself). */
const handBacks = new Set<number>();

/** After an overlay closes (or is unmounted while open): focus goes back to
 *  what opened it, unless the reader has already moved focus elsewhere. */
export function useReturnFocus(open: boolean, target?: { current: HTMLElement | null }): void {
  const latest = useRef(target);
  useEffect(() => { latest.current = target; });
  useEffect(() => {
    if (!open) return;
    handBacks.forEach((id) => window.clearTimeout(id));
    handBacks.clear();
    return () => {
      const back = () => {
        const el = latest.current?.current;
        const now = document.activeElement as HTMLElement | null;
        if (el && el.isConnected && now !== el && (!now || now === document.body || now.closest(OVERLAY))) el.focus();
      };
      for (const ms of HAND_BACK) {
        const id = window.setTimeout(() => { handBacks.delete(id); back(); }, ms);
        handBacks.add(id);
      }
    };
  }, [open]);
}
