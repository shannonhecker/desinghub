"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  BUILDER_TEMPLATES,
  TEMPLATE_ORDER,
  type TemplateId,
} from "@/lib/builderTemplates";
import { TemplatePreview } from "./TemplatePreviews";

/* ══════════════════════════════════════════════════════════
   TemplateCardsMessage - the template gallery INLINE in the chat
   thread (replaces the slide-over drawer). A horizontal carousel
   with left/right arrows + edge-fades + a peek of the next card,
   so every template is reachable and obviously-more (NN/g: cut-off
   adjacent items + arrows aid discovery; the prior version hid the
   scrollbar with no affordance, so it read as "3 cards, done").
   Each card: wireframe preview + label + two actions ("Use this" /
   "Customize"). Buttons reuse .prompt-bubble for the unified hover.
   ══════════════════════════════════════════════════════════ */
export function TemplateCardsMessage({
  onUse,
  onCustomize,
  disabled = false,
}: {
  onUse: (id: TemplateId) => void;
  onCustomize: (id: TemplateId) => void;
  disabled?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  /* Track scroll position so arrows + edge-fades hide at each end. */
  const sync = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    sync();
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sync]);

  const nudge = (dir: 1 | -1) =>
    scrollRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });

  return (
    <div className={`template-gallery${atStart ? " at-start" : ""}${atEnd ? " at-end" : ""}`}>
      <button
        type="button"
        className="template-gallery-arrow template-gallery-arrow-left"
        onClick={() => nudge(-1)}
        disabled={atStart}
        tabIndex={atStart ? -1 : 0}
        aria-label="Scroll to previous templates"
      >
        <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
      </button>

      <div className="template-cards" ref={scrollRef} onScroll={sync} role="list" aria-label="Starting templates">
        {TEMPLATE_ORDER.map((id) => {
          const tpl = BUILDER_TEMPLATES[id];
          return (
            <div key={id} className="template-card" role="listitem">
              <div className="template-card-preview">
                <TemplatePreview id={id} />
              </div>
              <div className="template-card-head">
                <span className="material-symbols-outlined" aria-hidden="true">
                  {tpl.icon}
                </span>
                <span className="template-card-label">{tpl.label}</span>
              </div>
              <div className="template-card-actions">
                <button
                  type="button"
                  className="prompt-bubble template-card-btn template-card-btn-primary"
                  onClick={() => onUse(id)}
                  disabled={disabled}
                  aria-label={`Use the ${tpl.label} template`}
                >
                  Use this
                </button>
                <button
                  type="button"
                  className="prompt-bubble template-card-btn"
                  onClick={() => onCustomize(id)}
                  disabled={disabled}
                  aria-label={`Customize the ${tpl.label} template`}
                >
                  Customize
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="template-gallery-arrow template-gallery-arrow-right"
        onClick={() => nudge(1)}
        disabled={atEnd}
        tabIndex={atEnd ? -1 : 0}
        aria-label="Scroll to more templates"
      >
        <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
      </button>
    </div>
  );
}
