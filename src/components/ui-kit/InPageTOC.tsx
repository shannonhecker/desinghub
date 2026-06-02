"use client";

/**
 * InPageTOC (W8-P6) — the sticky right-rail table of contents for the premium
 * single-scroll component-detail page (m3.material.io anatomy pattern). OWNER
 * DECISION (locked): detail nav is a right-rail sticky TOC on one scrollable
 * page, not tabs.
 *
 * BEHAVIOUR:
 *   - position: sticky; top: 24px (offset below the ContentTopBar).
 *   - Tracks the active section via IntersectionObserver. rootMargin is tuned so
 *     a section counts as "active" once its heading clears the ContentTopBar and
 *     before it reaches the bottom of the viewport (a tall negative bottom margin
 *     keeps only the topmost in-view section active rather than the last one).
 *   - aria-current="location" on the active link (programmatic current location).
 *   - Smooth-scroll on click, scrollIntoView({ behavior: "smooth" }) — downgraded
 *     to "auto" when the user prefers reduced motion.
 *   - The observer uses the default viewport root: the page's scroll container
 *     fills the viewport beneath the top bar, so viewport intersection tracks the
 *     scroll correctly without coupling to a specific scroll node.
 *
 * Pure presentation + one observer effect. Works light + dark via the theme.
 */

import React from "react";
import type { ActiveTheme } from "@/contexts/ThemeContext";

export interface TocSection {
  id: string;
  label: string;
}

interface InPageTOCProps {
  sections: TocSection[];
  t: ActiveTheme;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function InPageTOC({ sections, t }: InPageTOCProps) {
  const [activeId, setActiveId] = React.useState<string>(sections[0]?.id ?? "");
  /* Track every section's current intersection ratio so we can always pick the
     topmost section that is in view (handles fast scrolls + short sections). */
  const visible = React.useRef<Map<string, boolean>>(new Map());

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return;

    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (els.length === 0) return;

    const recompute = () => {
      // First section (document order) that is currently intersecting wins.
      for (const s of sections) {
        if (visible.current.get(s.id)) {
          setActiveId(s.id);
          return;
        }
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible.current.set(entry.target.id, entry.isIntersecting);
        }
        recompute();
      },
      {
        /* Top margin pulls the trigger line below the ContentTopBar (~56px) plus
           the 24px sticky offset; the large negative bottom margin narrows the
           "active band" to the upper third of the viewport so the topmost visible
           heading is the one highlighted. */
        rootMargin: "-88px 0px -55% 0px",
        threshold: [0, 1],
      },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const onJump = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    setActiveId(id);
    el.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
    /* Move focus to the heading for keyboard + SR users without a hard jump. */
    const heading = el.querySelector<HTMLElement>("h2, h3, [tabindex]");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
  };

  return (
    <nav className="dh-toc" aria-label="On this page" style={{ fontFamily: t.font }}>
      <p className="dh-toc-title" style={{ color: t.fg3 }}>
        On this page
      </p>
      <ul className="dh-toc-list">
        {sections.map((s) => {
          const active = s.id === activeId;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => onJump(e, s.id)}
                aria-current={active ? "location" : undefined}
                className={`dh-toc-link${active ? " is-active" : ""}`}
                style={{
                  color: active ? t.accentText : t.fg3,
                  // The active rail uses the DS accent; inactive is a subtle line.
                  borderLeftColor: active ? t.accent : t.borderSubtle,
                  fontWeight: active ? 600 : 500,
                }}
              >
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
