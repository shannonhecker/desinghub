/**
 * Landing: when may Next prefetch the builder route?
 *
 * Next prefetches every <Link> in view, and the builder route is about 2 MB
 * of script. That is a good trade on a desktop (the handoff is instant) and a
 * poor one on a phone, so prefetch is opt-in: wide, fine-pointer screens that
 * have not asked to save data. Everyone else loads the builder on tap.
 */
export const PREFETCH_QUERY = "(min-width: 1241px) and (pointer: fine)";

export function canPrefetchBuilder(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !conn?.saveData && window.matchMedia(PREFETCH_QUERY).matches;
}

export function subscribePrefetch(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const mq = window.matchMedia(PREFETCH_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
