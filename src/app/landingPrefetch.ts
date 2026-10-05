/**
 * Landing: when may Next prefetch another route?
 *
 * Next prefetches every <Link> in view. From the landing those links lead to
 * the builder (about 2 MB of script), the component library and the two
 * tools, so a visitor who only reads the page would download all of them.
 * Prefetch therefore waits for intent: a mouse resting on the link, or the
 * keyboard focusing it. Then that one route is fetched, and the click that
 * follows is instant.
 *
 * Never on touch: a finger that lands on a link is usually starting a scroll,
 * and a phone is where 2 MB costs most. Never when the visitor asked the
 * browser to save data. Those visitors load the route when they open it.
 */

/** How long a mouse must rest on a link before it counts as intent, so a
    pointer crossing the page does not start a download. */
export const INTENT_DWELL_MS = 90;

export function savesData(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return conn?.saveData === true;
}

/** A pointer that can hover: a mouse or a pen held over the screen. */
export function isHoverPointer(pointerType: string): boolean {
  return pointerType === "mouse" || pointerType === "pen";
}

/** What <Link prefetch> takes: `false` is never, `null` is Next's default
    (fetch the route now that the link is on screen). */
export type LinkPrefetch = false | null;

export function prefetchFor(warmed: ReadonlySet<string>, href: string): LinkPrefetch {
  return warmed.has(href) ? null : false;
}
