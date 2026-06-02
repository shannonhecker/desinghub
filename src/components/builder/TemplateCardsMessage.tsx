"use client";

import React from "react";
import {
  BUILDER_TEMPLATES,
  TEMPLATE_ORDER,
  type TemplateId,
} from "@/lib/builderTemplates";
import { TemplatePreview } from "./TemplatePreviews";

/* ══════════════════════════════════════════════════════════
   TemplateCardsMessage - renders the template gallery INLINE in
   the chat thread, replacing the slide-over drawer. Each card
   shows the wireframe preview + label and at most two actions:
   "Use this" (stage + DS gate, mirroring the old drawer flow)
   and "Customize" (drop to the free-text composer). The composer
   stays pinned at the bottom. Buttons reuse .prompt-bubble so they
   inherit the unified calm hover/focus treatment.
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
  return (
    <div className="template-cards" role="list" aria-label="Starting templates">
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
  );
}
