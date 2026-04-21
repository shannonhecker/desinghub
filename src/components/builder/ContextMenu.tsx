"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

/* ══════════════════════════════════════════════════════════
   ContextMenu — reusable popover menu positioned at (x, y).

   - Click outside / Escape closes
   - Arrow keys move focus, Enter activates, → opens submenu,
     ← closes submenu, Home/End jump to ends
   - Viewport-edge clamp: if menu would overflow, open upward
     or leftward instead so it stays visible
   - Submenus are supported one level deep (menu → submenu).
     Deeper nesting is intentionally unsupported; if a feature
     ever needs it, model it as a separate menu invocation.

   Renders inline (no portal) — relies on position:fixed to
   escape overflow-clipped ancestors. Z-index comes from the
   .context-menu CSS class.
   ══════════════════════════════════════════════════════════ */

export type ContextMenuItem =
  | "separator"
  | {
      label: string;
      icon?: string;
      onClick: () => void;
      disabled?: boolean;
      shortcut?: string;
      danger?: boolean;
    }
  | {
      label: string;
      icon?: string;
      submenu: ContextMenuItem[];
      disabled?: boolean;
    };

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const MIN_MARGIN = 8;

function isItem(item: ContextMenuItem): item is Exclude<ContextMenuItem, "separator"> {
  return item !== "separator";
}

function hasSubmenu(
  item: ContextMenuItem,
): item is Extract<ContextMenuItem, { submenu: ContextMenuItem[] }> {
  return isItem(item) && "submenu" in item;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: x, top: y });
  const [activeIndex, setActiveIndex] = useState<number>(() =>
    items.findIndex((i) => isItem(i) && !i.disabled),
  );
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);

  /* Viewport-edge clamp. Runs after first paint so measuredRect has
     real dimensions. */
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const maxLeft = window.innerWidth - rect.width - MIN_MARGIN;
    const maxTop = window.innerHeight - rect.height - MIN_MARGIN;
    setPos({
      left: Math.min(Math.max(MIN_MARGIN, x), Math.max(MIN_MARGIN, maxLeft)),
      top: Math.min(Math.max(MIN_MARGIN, y), Math.max(MIN_MARGIN, maxTop)),
    });
  }, [x, y]);

  /* Outside click + Esc. */
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const findNextEnabled = (from: number, step: 1 | -1): number => {
    const n = items.length;
    for (let k = 1; k <= n; k++) {
      const i = (from + step * k + n) % n;
      const it = items[i];
      if (isItem(it) && !it.disabled) return i;
    }
    return from;
  };

  const onRootKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => findNextEnabled(i, 1));
      setOpenSubmenu(null);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => findNextEnabled(i, -1));
      setOpenSubmenu(null);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(findNextEnabled(-1, 1));
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(findNextEnabled(items.length, -1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const it = items[activeIndex];
      if (!isItem(it) || it.disabled) return;
      if (hasSubmenu(it)) {
        setOpenSubmenu(activeIndex);
      } else {
        it.onClick();
        onClose();
      }
    } else if (e.key === "ArrowRight") {
      const it = items[activeIndex];
      if (isItem(it) && hasSubmenu(it) && !it.disabled) {
        e.preventDefault();
        setOpenSubmenu(activeIndex);
      }
    } else if (e.key === "ArrowLeft") {
      if (openSubmenu !== null) {
        e.preventDefault();
        setOpenSubmenu(null);
      }
    }
  };

  return (
    <div
      ref={rootRef}
      className="context-menu"
      role="menu"
      tabIndex={-1}
      style={{ left: pos.left, top: pos.top }}
      onKeyDown={onRootKeyDown}
      onContextMenu={(e) => {
        /* Don't let an accidental right-click inside the menu reopen
           the browser context menu — treat as no-op. */
        e.preventDefault();
      }}
    >
      {items.map((item, i) => {
        if (item === "separator") {
          return <div key={`sep-${i}`} className="context-menu-separator" role="separator" />;
        }
        const isActive = activeIndex === i;
        const submenuOpen = hasSubmenu(item) && openSubmenu === i;
        return (
          <div
            key={item.label}
            className="context-menu-item-wrap"
            onMouseEnter={() => {
              if (item.disabled) return;
              setActiveIndex(i);
              if (hasSubmenu(item)) setOpenSubmenu(i);
              else setOpenSubmenu(null);
            }}
          >
            <button
              type="button"
              role={hasSubmenu(item) ? "menuitem" : "menuitem"}
              aria-haspopup={hasSubmenu(item) ? "menu" : undefined}
              aria-expanded={hasSubmenu(item) ? submenuOpen : undefined}
              aria-disabled={item.disabled || undefined}
              className={
                "context-menu-item" +
                (isActive ? " is-active" : "") +
                (item.disabled ? " is-disabled" : "") +
                (!hasSubmenu(item) && item.danger ? " is-danger" : "")
              }
              onClick={() => {
                if (item.disabled) return;
                if (hasSubmenu(item)) {
                  setOpenSubmenu(submenuOpen ? null : i);
                  return;
                }
                item.onClick();
                onClose();
              }}
            >
              <span className="context-menu-icon" aria-hidden="true">
                {item.icon && (
                  <span className="material-symbols-outlined">{item.icon}</span>
                )}
              </span>
              <span className="context-menu-label">{item.label}</span>
              {hasSubmenu(item) ? (
                <span
                  className="material-symbols-outlined context-menu-chevron"
                  aria-hidden="true"
                >
                  chevron_right
                </span>
              ) : (
                !hasSubmenu(item) && "shortcut" in item && item.shortcut && (
                  <span className="context-menu-shortcut">{item.shortcut}</span>
                )
              )}
            </button>
            {submenuOpen && hasSubmenu(item) && (
              <Submenu
                items={item.submenu}
                onClose={onClose}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* Submenu — rendered adjacent to its parent item. Keeps the same
   item rendering but no viewport clamp (positioned relative to the
   parent .context-menu-item-wrap via CSS). Chooses left vs right
   open direction based on available space. */
function Submenu({
  items,
  onClose,
}: {
  items: ContextMenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [flipLeft, setFlipLeft] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.right > window.innerWidth - MIN_MARGIN) setFlipLeft(true);
  }, []);

  return (
    <div
      ref={ref}
      className={"context-submenu" + (flipLeft ? " is-flipped" : "")}
      role="menu"
    >
      {items.map((item, i) => {
        if (item === "separator") {
          return <div key={`sub-sep-${i}`} className="context-menu-separator" role="separator" />;
        }
        if (hasSubmenu(item)) {
          /* Intentional: ignore deeper submenus. One level only. */
          return null;
        }
        return (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            aria-disabled={item.disabled || undefined}
            className={
              "context-menu-item" +
              (item.disabled ? " is-disabled" : "") +
              (item.danger ? " is-danger" : "")
            }
            onClick={() => {
              if (item.disabled) return;
              item.onClick();
              onClose();
            }}
          >
            <span className="context-menu-icon" aria-hidden="true">
              {item.icon && (
                <span className="material-symbols-outlined">{item.icon}</span>
              )}
            </span>
            <span className="context-menu-label">{item.label}</span>
            {"shortcut" in item && item.shortcut && (
              <span className="context-menu-shortcut">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
