"use client";

import React from "react";
import { ChevronDown, Plus, User } from "lucide-react";
import { useBuilder, ZONE_TONES, type Block, type DesignSystem, type ZoneTone } from "@/store/useBuilder";
import { usePreviewReadOnly } from "./previewReadOnly";

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
  return (
    <nav className={`dh-tabstrip dh-tone dh-tone-${tone}`} aria-label={String(p.label ?? "Workspaces")}>
      {tabs.map((label) => (
        <button
          key={label}
          type="button"
          className={`dh-tabstrip-tab${label === active ? " is-active" : ""}`}
          aria-current={label === active ? "page" : undefined}
          onClick={(e) => { if (readOnly) e.stopPropagation(); update({ active: label }); }}
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
  return (
    <div className="dh-page-title-wrap">
      <h1 className="dh-page-title">{String(p.text ?? "Page title")}</h1>
      {p.caption ? <p className="dh-page-caption">{String(p.caption)}</p> : null}
    </div>
  );
}
