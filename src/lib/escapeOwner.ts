/**
 * escapeOwner - which Escape presses belong to an overlay.
 *
 * A dialog or menu marked `data-dh-escape-owner` closes itself on Escape.
 * The builder's own Escape (leave Present) must leave those presses alone,
 * but by the time its listener runs the overlay may already be gone from
 * the page, so asking the event's target then is too late. This notes, as
 * the press starts down the tree, whether its target sat inside an owner.
 */

const OWNER = "[data-dh-escape-owner]";
const owned = new WeakSet<Event>();
let installed = false;

function install(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && e.target instanceof Element && e.target.closest(OWNER)) owned.add(e);
  }, true);
}
install();

/** True when this Escape was pressed inside an overlay that owns it. */
export function ownsEscape(e: KeyboardEvent): boolean {
  return owned.has(e) || (e.target instanceof Element && Boolean(e.target.closest(OWNER)));
}
