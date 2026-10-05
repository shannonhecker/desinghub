"use client";

import { ChromeIcon } from "./ChromeIcon";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  BUILDER_TEMPLATES,
  INDIVIDUAL_TEMPLATE_ORDER,
  WORKSPACE_TEMPLATE_ID,
  templateCategory,
  type TemplateCategory,
  type TemplateId,
} from "@/lib/builderTemplates";
import { TemplatePreview } from "./TemplatePreviews";
import { TemplateGalleryControls, TemplateWorkspaceOption } from "./TemplateGalleryControls";
import { TemplateSourceNote } from "./TemplateSourceNote";

/* ══════════════════════════════════════════════════════════
   TemplateCardsMessage - the template gallery INLINE in the chat
   thread (replaces the slide-over drawer). A horizontal carousel
   with left/right arrows + edge-fades + a peek of the next card,
   so every template is reachable and obviously-more (NN/g: cut-off
   adjacent items + arrows aid discovery; the prior version hid the
   scrollbar with no affordance, so it read as "3 cards, done").
   Each card: wireframe preview + label + what it contains + two actions
   ("Use this" / "Customize"). Category chips above narrow the row, so the
   gallery still reads at a glance as templates are added. Buttons reuse
   .prompt-bubble for the unified hover.
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
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const ids = INDIVIDUAL_TEMPLATE_ORDER.filter((id) => category === "all" || templateCategory(id) === category);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  /* Track scroll position so arrows + edge-fades hide at each end. */
  const sync = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  /* A new category is a new row: back to its start. */
  useEffect(() => {
    scrollRef.current?.scrollTo({ left: 0 });
    sync();
  }, [category, sync]);

  useEffect(() => {
    sync();
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sync]);

  /* Previous / next move one full view, so cards are never left half shown. */
  const nudge = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="template-gallery-wrap">
      <TemplateWorkspaceOption onWorkspace={() => onUse(WORKSPACE_TEMPLATE_ID)} disabled={disabled} />
      <TemplateGalleryControls category={category} onCategory={setCategory}>
        <div className="template-gallery-arrows">
          <button type="button" className="template-gallery-arrow" onClick={() => nudge(-1)} disabled={atStart} aria-label="Scroll to previous templates">
            <ChromeIcon name="chevron_left" aria-hidden="true" />
          </button>
          <button type="button" className="template-gallery-arrow" onClick={() => nudge(1)} disabled={atEnd} aria-label="Scroll to more templates">
            <ChromeIcon name="chevron_right" aria-hidden="true" />
          </button>
        </div>
      </TemplateGalleryControls>
      <div className="template-cards" ref={scrollRef} onScroll={sync} role="list" aria-label="Starting templates">
        {ids.map((id) => {
          const tpl = BUILDER_TEMPLATES[id];
          return (
            <div key={id} className="template-card" role="listitem">
              <div className="template-card-preview">
                <TemplatePreview id={id} />
              </div>
              <div className="template-card-head">
                <ChromeIcon name={tpl.icon} aria-hidden="true" />
                <span className="template-card-label">{tpl.label}</span>
              </div>
              <p className="template-card-desc">{tpl.desc}</p>
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
      {/* Credit for the finance templates' sources: outside any template canvas. */}
      <TemplateSourceNote />
    </div>
  );
}
