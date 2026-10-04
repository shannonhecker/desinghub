"use client";

import React from "react";
import { ChevronDown, Plus, User } from "lucide-react";
import { useBuilder, ZONE_TONES, type Block, type DesignSystem, type ZoneTone } from "@/store/useBuilder";
import { usePreviewReadOnly } from "./previewReadOnly";
import { ComponentRenderer } from "./ComponentRenderer";
import { BUILDER_TEMPLATES, VALID_TEMPLATE_IDS, type TemplateId } from "@/lib/builderTemplates";
import { openTemplateLink } from "@/lib/applyTemplate";

/* ══════════════════════════════════════════════════════════
   ChromeBars - application chrome as blocks.

   The header used to be one fixed row: a brand, a status pill.
   These blocks make it composable: stack a TopNav and a TabStrip
   in a flush header for a two-bar application shell, group the
   sidebar with NavGroup labels, give each bar its own tone.

   Sizes are fixed and the same in every design system (so the
   body starts at the same point whichever system is active);
   colour and type come from the bar's tone and the active
   system's tokens.
   ══════════════════════════════════════════════════════════ */

const ZONE_KEYS = ["headerBlocks", "sidebarBlocks", "blocks", "footerBlocks"] as const;
const ZONE_OF = { headerBlocks: "header", sidebarBlocks: "sidebar", blocks: "body", footerBlocks: "footer" } as const;

/** Write props back to a chrome block, whichever zone it sits in. */
function useBlockUpdate(blockId: string | undefined) {
  const updateZoneBlockProps = useBuilder((s) => s.updateZoneBlockProps);
  return (patch: Record<string, unknown>) => {
    if (!blockId) return;
    const state = useBuilder.getState();
    for (const key of ZONE_KEYS) {
      if ((state[key] as Block[]).some((b) => b.id === blockId)) {
        updateZoneBlockProps(ZONE_OF[key], blockId, patch);
        return;
      }
    }
  };
}

const csv = (v: unknown, fallback: string[]): string[] => {
  const parts = String(v ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  return parts.length ? parts : fallback;
};
const toneOf = (v: unknown, fallback: ZoneTone): ZoneTone => (ZONE_TONES.includes(v as ZoneTone) ? (v as ZoneTone) : fallback);

interface BarProps {
  system: DesignSystem;
  blockId?: string;
  [key: string]: unknown;
}

/* ── TopNav: brand, primary links, account ── */
export function TopNavBlock({ blockId, ...p }: BarProps) {
  const update = useBlockUpdate(blockId);
  const readOnly = usePreviewReadOnly();
  const brand = String(p.brand ?? "Brand");
  const links = csv(p.linksCsv, []);
  const active = String(p.active ?? links[0] ?? "");
  const tone = toneOf(p.tone, "dark");
  const account = String(p.account ?? "");
  return (
    <div className={`dh-topnav dh-tone dh-tone-${tone}`}>
      <div className="dh-topnav-brand">
        {p.logo !== "none" ? (
          <span className="dh-topnav-mark" aria-hidden="true">{brand.trim().charAt(0).toUpperCase() || "B"}</span>
        ) : null}
        <span className="dh-topnav-name">{brand}</span>
      </div>
      {links.length > 0 ? (
        <>
          <span className="dh-topnav-divider" aria-hidden="true" />
          <nav className="dh-topnav-links" aria-label="Primary">
            {links.map((label) => (
              <button
                key={label}
                type="button"
                className={`dh-topnav-link${label === active ? " is-active" : ""}`}
                aria-current={label === active ? "page" : undefined}
                /* While presenting, a nav click is the product's own
                   interaction, not a block selection. */
                onClick={(e) => { if (readOnly) e.stopPropagation(); update({ active: label }); }}
              >
                {label}
                {p.chevrons !== false ? <ChevronDown size={14} strokeWidth={1.8} aria-hidden="true" /> : null}
              </button>
            ))}
          </nav>
        </>
      ) : null}
      <span className="dh-topnav-spacer" />
      {p.account !== "none" ? (
        <div className="dh-topnav-account">
          <span className="dh-topnav-avatar" aria-hidden="true"><User size={15} strokeWidth={1.8} /></span>
          {account ? <span className="dh-topnav-account-name">{account}</span> : null}
          <ChevronDown size={14} strokeWidth={1.8} aria-hidden="true" />
        </div>
      ) : null}
    </div>
  );
}

/* ── TabStrip: workspace / section tabs ── */
export function TabStripBlock({ blockId, ...p }: BarProps) {
  const update = useBlockUpdate(blockId);
  const readOnly = usePreviewReadOnly();
  const tabs = csv(p.tabsCsv, ["Overview", "Reports"]);
  const active = String(p.active ?? tabs[0]);
  const tone = toneOf(p.tone, "dark");
  const designSystem = useBuilder((s) => s.designSystem);
  /* A tab can name a template (`templates`: tab label -> template id): while
     presenting, choosing it opens that report, so a set of templates behaves
     as one application. In Edit a tab is only marked active. */
  const templates = (p.templates && typeof p.templates === "object" ? p.templates : {}) as Record<string, unknown>;
  const templateOf = (label: string): TemplateId | null => {
    const id = templates[label];
    return typeof id === "string" && (VALID_TEMPLATE_IDS as readonly string[]).includes(id) ? (id as TemplateId) : null;
  };
  return (
    <nav className={`dh-tabstrip dh-tone dh-tone-${tone}`} aria-label={String(p.label ?? "Workspaces")}>
      {tabs.map((label) => (
        <button
          key={label}
          type="button"
          className={`dh-tabstrip-tab${label === active ? " is-active" : ""}`}
          aria-current={label === active ? "page" : undefined}
          onClick={(e) => {
            if (readOnly) e.stopPropagation();
            const templateId = templateOf(label);
            if (readOnly && templateId) { if (label !== active) openTemplateLink(BUILDER_TEMPLATES[templateId], designSystem); return; }
            update({ active: label });
          }}
        >
          {label}
        </button>
      ))}
      {p.addButton === true ? (
        <span className="dh-tabstrip-add" aria-hidden="true"><Plus size={15} strokeWidth={1.8} /></span>
      ) : null}
    </nav>
  );
}

/* ── ContextBar: the page's title and its filters, on one line ──
   The bar under the workspace tabs: what page this is on the left, the
   controls that scope it on the right. Each filter is the active system's
   own inline dropdown, wired to report state by its `stateKey`. */
export interface ContextFilter {
  label: string;
  stateKey: string;
  value: string;
  options: string[];
}
export function contextFiltersOf(props: Record<string, unknown>): ContextFilter[] {
  if (!Array.isArray(props.filters)) return [];
  return props.filters.filter(
    (f): f is ContextFilter => Boolean(f) && typeof f === "object" && typeof (f as ContextFilter).label === "string" && typeof (f as ContextFilter).stateKey === "string" && Array.isArray((f as ContextFilter).options),
  );
}

export function ContextBarBlock({ system, ...p }: BarProps) {
  const filters = contextFiltersOf(p);
  const tone = toneOf(p.tone, "surface");
  return (
    <div className={`dh-contextbar dh-tone dh-tone-${tone}`}>
      <h1 className="dh-contextbar-title">{String(p.title ?? "Page")}</h1>
      {filters.length > 0 ? (
        <div className="dh-contextbar-filters" role="group" aria-label="Filters">
          {filters.map((f) => (
            <div key={f.stateKey} className="dh-contextbar-filter">
              <ComponentRenderer type="SimulatedDropdown" system={system} {...{ label: f.label, value: f.value, options: f.options, stateKey: f.stateKey, inline: true }} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ── NavGroup: a section label in the sidebar ── */
export function NavGroupBlock({ ...p }: BarProps) {
  return <div className="dh-navgroup">{String(p.label ?? "Section")}</div>;
}

/* ── PageTitle: the page heading of an application view ──
   A design system's own heading scale differs a lot at the same level (an
   h2 is small in one system and display-sized in another), which a fixed-height
   context row cannot absorb. A page title is therefore one fixed size, in
   the active system's font and colour. */
export function PageTitleBlock({ ...p }: BarProps) {
  /* Level 2: a section heading inside a page whose title is in the context bar. */
  const Tag = p.level === 2 ? "h2" : "h1";
  return (
    <div className="dh-page-title-wrap">
      <Tag className={`dh-page-title${p.level === 2 ? " dh-page-title-2" : ""}`}>{String(p.text ?? "Page title")}</Tag>
      {p.caption ? <p className="dh-page-caption">{String(p.caption)}</p> : null}
    </div>
  );
}
