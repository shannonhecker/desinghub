"use client";

import { TemplateGalleryControls } from "./TemplateGalleryControls";
import { TemplateSourceNote } from "./TemplateSourceNote";

import React, { useEffect, useState } from "react";
import { useBuilder } from "@/store/useBuilder";
import type { DesignSystem } from "@/store/useBuilder";
import {
  BUILDER_TEMPLATES,
  INDIVIDUAL_TEMPLATE_ORDER,
  WORKSPACE_TEMPLATE_ID,
  templateCategory,
  type TemplateCategory,
  type BuilderTemplate,
  type TemplateId,
} from "@/lib/builderTemplates";
import { TemplatePreview } from "./TemplatePreviews";
import { applyTemplateToCanvas } from "@/lib/applyTemplate";
import { DS_LABELS } from "@/lib/assumptionDims";
import { titleFromTemplate } from "@/lib/sessionTitle";

/* ══════════════════════════════════════════════════════════
   TemplatesDrawer - full visual gallery with SVG wireframes.
   Opened from the hero "Browse templates with previews" link
   so the compact empty state stays clean while preserving the
   rich previews we shipped in Phase C.

   Clicking a template applies it IMMEDIATELY in the store's
   current design system (the first decisive action yields a
   canvas, not a question - QW5). The DS question becomes a
   non-blocking follow-up turn: the template stays staged as
   pending, so the existing DS reply chips render under the AI
   offer and tapping one re-applies the same template in the
   chosen DS. The swap is lossless via the templates-as-DS-
   framework registry. The drawer closes on selection.
   ══════════════════════════════════════════════════════════ */
export function TemplatesDrawer() {
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const {
    templatesDrawerOpen,
    setTemplatesDrawerOpen,
    setPendingTemplateId,
    setPendingFirstMessage,
    addMessage,
    isGenerating,
    designSystem,
    previewOpen,
    setPreviewOpen,
    ensureSessionStarted,
  } = useBuilder();

  /* Esc to dismiss - standard drawer UX */
  useEffect(() => {
    if (!templatesDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTemplatesDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [templatesDrawerOpen, setTemplatesDrawerOpen]);

  /* Lock body scroll while the drawer is open so the background
     doesn't shift when users scroll the card list. */
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (templatesDrawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [templatesDrawerOpen]);

  if (!templatesDrawerOpen) return null;

  const templates: BuilderTemplate[] = INDIVIDUAL_TEMPLATE_ORDER.filter(id => category === "all" || templateCategory(id) === category).map((id) => BUILDER_TEMPLATES[id]);

  const handleSelect = (tpl: BuilderTemplate) => {
    if (isGenerating) return;
    const article = /^[aeiouAEIOU]/.test(tpl.label) ? "an" : "a";

    /* Apply NOW in the current DS - canvas first, question never blocks. */
    ensureSessionStarted(titleFromTemplate(tpl.label));
    applyTemplateToCanvas(tpl, designSystem);
    if (!previewOpen) setPreviewOpen(true);

    /* Keep the template staged so the existing DS reply chips render
       under the follow-up turn; tapping one re-applies this template in
       the chosen DS (applyPendingIntentWithDs case 1) - lossless swap. */
    setPendingTemplateId(tpl.id);
    setPendingFirstMessage(null);

    const others = (Object.keys(DS_LABELS) as DesignSystem[])
      .filter((ds) => ds !== designSystem)
      .map((ds) => DS_LABELS[ds]);
    const offer = `${others.slice(0, -1).join(", ")}, or ${others[others.length - 1]}`;

    addMessage("user", `Build me ${article} ${tpl.label}`);
    addMessage(
      "ai",
      `Built in ${DS_LABELS[designSystem]}. Want it in ${offer}? Tap a chip to swap. The layout carries over.`
    );
    setTemplatesDrawerOpen(false);
  };

  return (
    <div
      className="templates-drawer-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="templates-drawer-title"
      onClick={() => setTemplatesDrawerOpen(false)}
    >
      <aside
        className="templates-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="templates-drawer-header">
          <div>
            <h2 id="templates-drawer-title" className="templates-drawer-title">
              Browse templates
            </h2>
            <p className="templates-drawer-subtitle">
              Choose an individual template, or open the connected analytics workspace.
            </p>
          </div>
          <button
            type="button"
            className="templates-drawer-close"
            onClick={() => setTemplatesDrawerOpen(false)}
            aria-label="Close drawer (Esc)"
            title="Close (Esc)"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </header>

        <TemplateGalleryControls category={category} onCategory={setCategory} onWorkspace={() => handleSelect(BUILDER_TEMPLATES[WORKSPACE_TEMPLATE_ID])} disabled={isGenerating} />
        <div className="templates-drawer-grid" role="group" aria-label="Individual templates">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              className="templates-drawer-card"
              onClick={() => handleSelect(tpl)}
              aria-label={`Start from the ${tpl.label} template`}
            >
              <TemplatePreview id={tpl.id as TemplateId} />
              <div className="templates-drawer-card-text">
                <div className="templates-drawer-card-head">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {tpl.icon}
                  </span>
                  <span className="templates-drawer-card-label">{tpl.label}</span>
                </div>
                <p className="templates-drawer-card-desc">{tpl.desc}</p>
              </div>
            </button>
          ))}
        </div>
        {category !== "general" && <TemplateSourceNote />}
      </aside>
    </div>
  );
}
