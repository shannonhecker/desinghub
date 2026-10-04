"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

/* ══════════════════════════════════════════════════════════
   ExecutionRail - the FX chart's tool rail and its menus.

   Each rail button opens a menu that floats over the chart: a
   design-system overlay (shadow, hairline, a raised surface in dark
   mode; see .dh-exec-flyout in builder.css and the --dh-exec-menu-*
   tokens in chrome-tokens.css). It keeps inside the chart panel:
   shifted up, or scrolled, when there is no room below.

   A menu in the ARIA sense: Enter, Space or the arrow keys open it on
   the checked item; arrows, Home and End move; Enter or Space choose;
   Escape or a click outside closes it, focus back on its button.
   ══════════════════════════════════════════════════════════ */

export interface RailMenu { key: string; label: string; icon: React.ReactNode; items: { label: string; active: boolean; onPick: () => void }[]; multi?: boolean }

export function ExecutionRail({ menus }: { menus: RailMenu[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});
  /* Opening and the keys move focus; the pointer only moves the highlight. */
  const focusActive = useRef(false);
  const current = menus.find((m) => m.key === open) ?? null;

  const close = (refocus: boolean) => {
    const key = open;
    setOpen(null);
    if (refocus && key) buttons.current[key]?.focus();
  };
  const show = (m: RailMenu, at?: "last") => {
    const checked = m.items.findIndex((i) => i.active);
    setActive(at === "last" ? m.items.length - 1 : Math.max(0, checked));
    focusActive.current = true;
    setOpen(m.key);
  };

  /* Closes on a click outside the rail and on Escape (caught before the
     stage, which would leave Present). */
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!railRef.current?.contains(e.target as Node)) setOpen(null); };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      const back = menuRef.current?.contains(document.activeElement) || buttons.current[open] === document.activeElement;
      setOpen(null);
      if (back) buttons.current[open]?.focus();
    };
    document.addEventListener("mousedown", away);
    window.addEventListener("keydown", key, true);
    return () => { document.removeEventListener("mousedown", away); window.removeEventListener("keydown", key, true); };
  }, [open]);

  /* Placed before paint: below its button, moved up as far as the panel
     needs, and scrolled when even that is not enough. Sizes are read in
     the panel's own pixels (the device frame may be scaled). */
  useLayoutEffect(() => {
    const menu = menuRef.current;
    const panel = railRef.current?.closest<HTMLElement>(".dh-exec");
    if (!menu || !panel) return;
    menu.style.removeProperty("--dh-exec-menu-shift");
    menu.style.removeProperty("--dh-exec-menu-max-h");
    const scale = panel.getBoundingClientRect().width / (panel.offsetWidth || 1) || 1;
    const room = (panel.getBoundingClientRect().bottom - menu.getBoundingClientRect().top) / scale;
    const above = (menu.getBoundingClientRect().top - panel.getBoundingClientRect().top) / scale;
    const inset = parseFloat(getComputedStyle(panel).getPropertyValue("--dh-exec-pad")) || 0;
    const height = menu.offsetHeight;
    const over = height - (room - inset);
    if (over > 0) {
      const shift = Math.min(over, Math.max(0, above - inset));
      menu.style.setProperty("--dh-exec-menu-shift", `${-shift}px`);
      if (over > shift) menu.style.setProperty("--dh-exec-menu-max-h", `${height - (over - shift)}px`);
    }
  }, [open]);

  /* The active item holds focus (roving tabindex), from the moment the menu opens. */
  useEffect(() => {
    if (!open || !focusActive.current) return;
    focusActive.current = false;
    menuRef.current?.querySelectorAll<HTMLElement>("[role^=menuitem]")[active]?.focus();
  }, [open, active]);

  const onButtonKey = (m: RailMenu) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (open === m.key && (e.key === "Enter" || e.key === " ")) { close(true); return; }
      show(m, e.key === "ArrowUp" ? "last" : undefined);
    }
  };
  const onMenuKey = (m: RailMenu) => (e: React.KeyboardEvent) => {
    const last = m.items.length - 1;
    const move = (i: number) => { e.preventDefault(); focusActive.current = true; setActive(i); };
    if (e.key === "ArrowDown") move(active >= last ? 0 : active + 1);
    else if (e.key === "ArrowUp") move(active <= 0 ? last : active - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(last);
    else if (e.key === "Tab") setOpen(null);
  };
  const pick = (m: RailMenu, i: number) => {
    m.items[i].onPick();
    /* A choice closes the menu; a toggle (overlays) keeps it open. */
    if (!m.multi) close(true);
    else setActive(i);
  };

  return (
    <div ref={railRef} className="dh-exec-rail" role="toolbar" aria-label="Chart tools" aria-orientation="vertical">
      {menus.map((m) => (
        <div key={m.key} className="dh-exec-rail-group">
          <button
            ref={(el) => { buttons.current[m.key] = el; }}
            type="button"
            className={`dh-exec-rail-btn${open === m.key ? " is-open" : ""}`}
            aria-label={m.label}
            title={m.label}
            aria-haspopup="menu"
            aria-expanded={open === m.key}
            aria-controls={open === m.key ? `dh-exec-menu-${m.key}` : undefined}
            onClick={() => (open === m.key ? setOpen(null) : show(m))}
            onKeyDown={onButtonKey(m)}
          >
            {m.icon}
          </button>
          {current?.key === m.key ? (
            <div ref={menuRef} id={`dh-exec-menu-${m.key}`} className="dh-exec-flyout" role="menu" aria-label={m.label} onKeyDown={onMenuKey(m)}>
              <p className="dh-exec-flyout-title" aria-hidden="true">{m.label}</p>
              {m.items.map((item, i) => (
                <button
                  key={item.label}
                  type="button"
                  className={`dh-exec-flyout-item${item.active ? " is-checked" : ""}${i === active ? " is-active" : ""}`}
                  role={m.multi ? "menuitemcheckbox" : "menuitemradio"}
                  aria-checked={item.active}
                  tabIndex={i === active ? 0 : -1}
                  onClick={() => pick(m, i)}
                  onMouseEnter={() => setActive(i)}
                >
                  <span className="dh-exec-flyout-check" aria-hidden="true">{item.active ? <Check size={14} strokeWidth={2.2} /> : null}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
