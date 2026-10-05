"use client";

import { ChromeIcon } from "@/components/builder/ChromeIcon";
import React, { useEffect, useState } from "react";
import { useDesignHub, type SystemId } from "@/store/useDesignHub";
import { useTheme } from "@/contexts/ThemeContext";
import { getComponents, getSystemInfo } from "@/data/registry";

const DS_OPTIONS: Array<{ id: SystemId; label: string }> = [
  { id: "salt",   label: "Salt DS" },
  { id: "m3",     label: "Material 3" },
  { id: "fluent", label: "Fluent 2" },
  { id: "uoaui",  label: "uoaui" },
  { id: "carbon", label: "Carbon" },
];

export function ContentTopBar() {
  const activeSystem = useDesignHub((s) => s.activeSystem);
  const selectedComponent = useDesignHub((s) => s.selectedComponent);
  const setSelectedComponent = useDesignHub((s) => s.setSelectedComponent);
  const setActiveSystem = useDesignHub((s) => s.setActiveSystem);
  const t = useTheme();
  const sysInfo = getSystemInfo(activeSystem);

  const comp = selectedComponent ? getComponents(activeSystem).find(c => c.id === selectedComponent) : null;

  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = () => setIsNarrow(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const [dsOpen, setDsOpen] = useState(false);

  if (!comp) return null;

  /* Library chrome, one size in every system: the bar's height and its left
     inset come from kit-chrome.css tokens, not from the system's density
     scale, so the breadcrumb, the title and the tab strip stay exactly where
     they are when the system changes (owner rule: no jumping). */
  return (
    <div className="kit-topbar">
      <nav className="kit-crumbs" aria-label="Breadcrumb">
        {/* Narrow viewports: the system name opens a picker (the rail's
            system row scrolls on a phone). Wide: a link back to the overview. */}
        {isNarrow ? (
          <>
            {dsOpen && <div className="kit-crumb-scrim" onClick={() => setDsOpen(false)} />}
            <button type="button" className="kit-crumb-pick" onClick={() => setDsOpen((v) => !v)} aria-haspopup="listbox" aria-expanded={dsOpen}>
              <span>{sysInfo.name}</span>
              <ChromeIcon name={dsOpen ? "expand_less" : "expand_more"} aria-hidden="true" />
            </button>
            {dsOpen && (
              <div role="listbox" aria-label="Design system" className="kit-crumb-menu" style={{
                /* uoaui's raised surface is glass: keep the menu legible. */
                backdropFilter: t.T.glass as string | undefined,
                WebkitBackdropFilter: t.T.glass as string | undefined,
              }}>
                {DS_OPTIONS.map((opt) => {
                  const isSelected = activeSystem === opt.id;
                  return (
                    <button key={opt.id} type="button" role="option" aria-selected={isSelected} onClick={() => { setActiveSystem(opt.id); setDsOpen(false); }}>
                      <span>{opt.label}</span>
                      {isSelected && <ChromeIcon name="check" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <button type="button" className="kit-crumb-link" onClick={() => setSelectedComponent(null)}>{sysInfo.name}</button>
        )}
        <span className="kit-crumb-sep" aria-hidden="true">/</span>
        <span className="kit-crumb-here" aria-current="page">{comp.name}</span>
      </nav>
    </div>
  );
}
