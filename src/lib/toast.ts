/**
 * Minimal toast — single persistent live region at <body>, no provider,
 * no context. Call showToast(message) from anywhere.
 *
 * Now supports an optional `action` button (used by delete-class toasts
 * for inline Undo) and a `durationMs` override (delete-class toasts
 * stay visible 4s instead of the default 1.8s, giving non-power users
 * time to read + act).
 */

const ROOT_ID = "dh-toast-root";
const DEFAULT_VISIBLE_MS = 1800;
const EXIT_MS = 180;

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  icon?: string;
  action?: ToastAction;
  /** Override visible duration. Defaults to 1800ms. Delete-class toasts
   * pass 4000ms so non-keyboard-savvy users have time to react. */
  durationMs?: number;
}

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

export function showToast(message: string, opts?: ToastOptions): void {
  const root = ensureRoot();
  if (!root) return;

  const visibleMs = opts?.durationMs ?? DEFAULT_VISIBLE_MS;

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

  let exitTimer: number | null = null;
  let removeTimer: number | null = null;

  const dismiss = () => {
    if (exitTimer !== null) {
      window.clearTimeout(exitTimer);
      exitTimer = null;
    }
    if (removeTimer !== null) return; // already exiting
    el.classList.remove("dh-toast-visible");
    el.classList.add("dh-toast-exiting");
    removeTimer = window.setTimeout(() => {
      el.remove();
    }, EXIT_MS);
  };

  if (opts?.action) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dh-toast-action";
    btn.textContent = opts.action.label;
    btn.setAttribute("aria-label", opts.action.label);
    btn.addEventListener("click", () => {
      try {
        opts.action!.onClick();
      } finally {
        dismiss();
      }
    });
    el.appendChild(btn);
  }

  root.appendChild(el);

  /* Two raf ticks to reliably trigger the enter transition. */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.remove("dh-toast-entering");
      el.classList.add("dh-toast-visible");
    });
  });

  exitTimer = window.setTimeout(() => {
    exitTimer = null;
    dismiss();
  }, visibleMs);
}
