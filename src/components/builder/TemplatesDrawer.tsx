"use client";

import React, { useEffect } from "react";
import { useBuilder } from "@/store/useBuilder";
import {
  BUILDER_TEMPLATES,
  TEMPLATE_ORDER,
  type BuilderTemplate,
  type TemplateId,
} from "@/lib/builderTemplates";
import { TemplatePreview } from "./TemplatePreviews";

/* ══════════════════════════════════════════════════════════
   TemplatesDrawer - full visual gallery with SVG wireframes.
   Opened from the hero "Browse templates with previews" link
   so the compact empty state stays clean while preserving the
   rich previews we shipped in Phase C.

   Clicking a template from the drawer follows the same
   conversational flow as clicking a compact card: it stages
   the template as pending and asks the user to pick a DS as
   the next chat turn. The drawer closes on selection.
   ══════════════════════════════════════════════════════════ */
export function TemplatesDrawer() {
  const {
    templatesDrawerOpen,
    setTemplatesDrawerOpen,
    setPendingTemplateId,
    setPendingFirstMessage,
    addMessage,
    isGenerating,
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

  const templates: BuilderTemplate[] = TEMPLATE_ORDER.map((id) => BUILDER_TEMPLATES[id]);

  const handleSelect = (tpl: BuilderTemplate) => {
    if (isGenerating) return;
    // Mirror handlePatternSelect in ChatPanel - stage and ask DS next.
    const article = /^[aeiouAEIOU]/.test(tpl.label) ? "an" : "a";
    setPendingTemplateId(tpl.id);
    setPendingFirstMessage(null);
    addMessage("user", `Build me ${article} ${tpl.label}`);
    addMessage(
      "ai",
      `Great choice - ${article} ${tpl.label} with ${tpl.desc.toLowerCase()}. Which design system should I use?`
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
              Each starts a full layout across header, sidebar, body, and footer. Pick a design system after.
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

        <div className="templates-drawer-grid" role="list">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              className="templates-drawer-card"
              onClick={() => handleSelect(tpl)}
              aria-label={`Start from the ${tpl.label} template`}
              role="listitem"
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
      </aside>
    </div>
  );
}
