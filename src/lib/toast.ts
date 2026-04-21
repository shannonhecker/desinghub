/**
 * Minimal toast — single persistent live region at <body>, no provider,
 * no context. Call showToast(message) from anywhere.
 *
 * Rationale: the only thing we need is a transient visual confirmation
 * that's also announced to assistive tech. A full toast system with
 * variants, queues, and dismiss actions is overkill for three copy-
 * to-clipboard buttons. Keep it small; expand only if a new use case
 * actually needs more.
 */

const ROOT_ID = "dh-toast-root";
const VISIBLE_MS = 1800;
const EXIT_MS = 180;

function ensureRoot(): HTMLDivElement | null {
  if (typeof document === "undefined") return null;
  let root = document.getElementById(ROOT_ID) as HTMLDivElement | null;
  if (root) return root;
  root = document.createElement("div");
  root.id = ROOT_ID;
  root.className = "dh-toast-root";
  /* role=status + aria-live=polite: SRs announce new toasts without
     interrupting. aria-atomic ensures the whole message reads as one
     unit even when swapped mid-announcement. */
  root.setAttribute("role", "status");
  root.setAttribute("aria-live", "polite");
  root.setAttribute("aria-atomic", "true");
  document.body.appendChild(root);
  return root;
}

export function showToast(message: string, opts?: { icon?: string }): void {
  const root = ensureRoot();
  if (!root) return;

  const el = document.createElement("div");
  el.className = "dh-toast dh-toast-entering";

  if (opts?.icon) {
    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined dh-toast-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = opts.icon;
    el.appendChild(icon);
  }

  const text = document.createElement("span");
  text.className = "dh-toast-text";
  text.textContent = message;
  el.appendChild(text);

  root.appendChild(el);

  /* Two raf ticks to reliably trigger the enter transition. */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.remove("dh-toast-entering");
      el.classList.add("dh-toast-visible");
    });
  });

  window.setTimeout(() => {
    el.classList.remove("dh-toast-visible");
    el.classList.add("dh-toast-exiting");
    window.setTimeout(() => {
      el.remove();
    }, EXIT_MS);
  }, VISIBLE_MS);
}
