"use client";

import React from "react";
import { REFERENCE_THUMBNAILS } from "@/lib/templateReferenceAssets";
import {
  ArrowRight, Briefcase, Clapperboard, Fuel, HardHat, HeartPulse, Landmark, Leaf, Scale, Search, Shield, ShoppingBag, Users, type LucideIcon,
} from "lucide-react";
import { useBuilder, type DesignSystem } from "@/store/useBuilder";
import { toneColor, type GridTone } from "@/lib/dataGridModel";
import { fieldText, fieldTone, isRowLookup, lookupKey, lookupRow, type RowLookup } from "@/lib/recordPanelModel";
import { BUILDER_TEMPLATES, VALID_TEMPLATE_IDS, type TemplateId } from "@/lib/builderTemplates";
import { openTemplateLink } from "@/lib/applyTemplate";
import type { DataRow } from "@/lib/reportData/types";
import { usePreviewReadOnly } from "./previewReadOnly";
import { TemplatePreview } from "./TemplatePreviews";
import { useCanvasDataset } from "./useBoundData";

/* ══════════════════════════════════════════════════════════
   ReportBlocks - the small composed blocks of a report page:
   an entity header, metric tiles, a verdict card, a launcher.

   Each data-bound one shows ONE row of a table, chosen by report
   state (the selected entity) or fixed (a tile per category), so
   changing the entity re-reads the same block from another row.
   Sizes are fixed and the same in every design system; colour
   and type come from --ds-* tokens.
   ══════════════════════════════════════════════════════════ */

type Props = { system: DesignSystem; blockId?: string };

const toneStyle = (tone: GridTone): React.CSSProperties => ({ "--dh-tone": toneColor(tone) }) as React.CSSProperties;

/** Icons a tile can name. */
export const TILE_ICONS: Record<string, LucideIcon> = {
  environment: Leaf, social: Users, governance: Landmark, rights: Scale, labour: HardHat, customers: ShoppingBag,
  health: HeartPulse, entertainment: Clapperboard, weapons: Shield, energy: Fuel, practices: Briefcase,
};

function useBlock(blockId: string | undefined): Record<string, unknown> {
  const block = useBuilder((s) => (blockId ? s.blocks.find((b) => b.id === blockId) : undefined));
  return (block?.props ?? {}) as Record<string, unknown>;
}

function useRow(lookup: unknown): DataRow | null {
  const dataset = useCanvasDataset();
  const state = useBuilder((s) => s.reportState);
  return isRowLookup(lookup) && dataset ? lookupRow(lookup, dataset, state) : null;
}

const str = (v: unknown, fallback = ""): string => (typeof v === "string" && v ? v : fallback);
/** A block's fixed height: its cell in the grid is that tall, and the block
 *  fills it (a percentage height has nothing to resolve against there). */
const boxHeight = (p: Record<string, unknown>): React.CSSProperties | undefined => (typeof p.height === "number" ? { height: p.height } : undefined);
const list = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/* ── EntityHeader: the name of the selected entity and a line of facts ── */
export function EntityHeaderBlock({ blockId }: Props) {
  const p = useBlock(blockId);
  const row = useRow(p.binding);
  const title = row && isRowLookup(p.binding) ? String(row[(p.binding as RowLookup).keyField] ?? "") : str(p.title, "Entity");
  const facts = list<{ label: string; field: string }>(p.facts);
  const badges = list<{ field: string; tone: GridTone; label: string }>(p.badges);
  /* What the entity is set against ("vs Helios Energy"): a second lookup. */
  const other = useRow(p.suffixBinding);
  const suffix = other && isRowLookup(p.suffixBinding) ? `${str(p.suffixPrefix, "vs")} ${String(other[(p.suffixBinding as RowLookup).keyField] ?? "")}` : str(p.suffix);
  return (
    <div className={`dh-entity${p.card === true ? " dh-entity-card" : ""}`} style={boxHeight(p)}>
      <div className="dh-entity-main">
        {p.eyebrow ? <span className="dh-entity-eyebrow">{str(p.eyebrow)}</span> : null}
        <h2 className="dh-entity-title">{title}</h2>
        {badges.map((b) => (
          <span key={b.field} className="dh-cell-tag is-solid" style={toneStyle(b.tone)} title={b.label} aria-label={`${b.label}: ${fieldText(row, b.field)}`}>
            {fieldText(row, b.field) || "0"}
          </span>
        ))}
        {suffix ? <span className="dh-entity-suffix">{suffix}</span> : null}
      </div>
      {facts.length > 0 ? (
        <dl className="dh-entity-facts">
          {facts.map((f) => (
            <div key={f.field}>
              <dt>{f.label}</dt>
              <dd>{fieldText(row, f.field) || "-"}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

/* ── MetricTile: a label, an icon and a figure; optional sub-figures,
      count chips, and a selected state that drives other panels ── */
interface TileSub { label: string; field: string; icon?: string }
interface TileChip { field: string; tone: GridTone; label?: string }

export function MetricTileBlock({ blockId }: Props) {
  const p = useBlock(blockId);
  const row = useRow(p.binding);
  const readOnly = usePreviewReadOnly();
  const setReportState = useBuilder((s) => s.setReportState);
  const selectState = str(p.selectState);
  const selectValue = str(p.selectValue, str(p.label));
  const current = useBuilder((s) => (selectState ? s.reportState[selectState] : undefined));
  const selected = Boolean(selectState) && (current ?? str(p.selectDefault)) === selectValue;
  const Icon = TILE_ICONS[str(p.icon)];
  const value = p.field ? fieldText(row, str(p.field)) : str(p.value);
  const subs = list<TileSub>(p.subs);
  const chips = list<TileChip>(p.chips);
  const muted = value === "0";

  const body = (
    <>
      <span className="dh-tile-label">{str(p.label, "Metric")}</span>
      <span className="dh-tile-row">
        <span className="dh-tile-main">
          {Icon ? <Icon className="dh-tile-icon" size={34} strokeWidth={1.3} aria-hidden="true" /> : null}
          {p.field || p.value ? <span className={`dh-tile-value${muted ? " is-muted" : ""}`}>{value || "-"}</span> : null}
          {chips.map((c) => {
            const text = fieldText(row, c.field) || "0";
            return (
              <span key={c.field} className="dh-cell-tag is-solid" style={toneStyle(text === "0" ? "neutral" : c.tone)} aria-label={c.label ? `${c.label}: ${text}` : undefined}>
                {text}
              </span>
            );
          })}
        </span>
        {subs.length > 0 ? (
          <span className="dh-tile-subs">
            {subs.map((s) => {
              const SubIcon = TILE_ICONS[str(s.icon)];
              return (
                <span key={s.field} className="dh-tile-sub">
                  <span className="dh-tile-sub-label">{s.label}</span>
                  <span className="dh-tile-sub-main">
                    {SubIcon ? <SubIcon size={22} strokeWidth={1.4} aria-hidden="true" /> : null}
                    <span className="dh-tile-sub-value">{fieldText(row, s.field) || "0"}</span>
                  </span>
                </span>
              );
            })}
          </span>
        ) : null}
      </span>
    </>
  );

  if (!selectState) return <div className="dh-tile" style={boxHeight(p)}>{body}</div>;
  return (
    <button
      type="button"
      className={`dh-tile dh-tile-selectable${selected ? " is-selected" : ""}`}
      aria-pressed={selected}
      style={boxHeight(p)}
      /* While presenting, a click selects the CATEGORY, not the block. */
      onClick={(e) => { if (readOnly) e.stopPropagation(); setReportState(selectState, selectValue); }}
    >
      {body}
    </button>
  );
}

/* ── VerdictCard: one judgement, stated large, with what backs it ── */
interface VerdictStat { label: string; field: string; suffix?: string; decimals?: number; toneField?: string }

export function VerdictCardBlock({ blockId }: Props) {
  const p = useBlock(blockId);
  const row = useRow(p.binding);
  const tone = fieldTone(row, str(p.toneField), "neutral");
  const progress = p.progress as { label: string; field: string; suffix?: string } | undefined;
  const pct = progress && row ? Math.max(0, Math.min(100, Number(row[progress.field]) || 0)) : 0;
  const stats = list<VerdictStat>(p.stats);
  return (
    <div className="dh-verdict" style={{ ...toneStyle(tone), height: typeof p.height === "number" ? p.height : undefined }}>
      {p.title ? <h3 className="dh-verdict-title">{str(p.title)}</h3> : null}
      {p.chip ? (
        <span className="dh-verdict-chip"><span className="dh-cell-dot-mark" aria-hidden="true" />{str(p.chip)}</span>
      ) : null}
      <p className="dh-verdict-hero">
        <span className="dh-verdict-figure">{fieldText(row, str(p.heroField), { decimals: 1 }) || "-"}</span>
        {p.heroUnit ? <span className="dh-verdict-unit">{str(p.heroUnit)}</span> : null}
        <span className="dh-verdict-status">{fieldText(row, str(p.statusField))}</span>
      </p>
      {p.captionField ? <p className="dh-verdict-caption">{fieldText(row, str(p.captionField))}</p> : null}
      {progress ? (
        <div className="dh-verdict-progress">
          <div className="dh-verdict-progress-head">
            <span>{progress.label}</span>
            <span>{Math.round(pct)}{progress.suffix ?? "%"}</span>
          </div>
          <div className="dh-cell-bar-track" role="img" aria-label={`${progress.label}: ${Math.round(pct)}${progress.suffix ?? "%"}`}>
            <span className="dh-cell-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      ) : null}
      {stats.length > 0 ? (
        <dl className="dh-verdict-stats">
          {stats.map((s) => (
            <div key={s.field}>
              <dt>{s.label}</dt>
              <dd style={s.toneField ? toneStyle(fieldTone(row, s.toneField)) : undefined} className={s.toneField ? "is-toned" : undefined}>
                {fieldText(row, s.field, { decimals: s.decimals ?? 0, suffix: s.suffix }) || "-"}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {p.footnote ? <p className="dh-verdict-footnote">{str(p.footnote)}</p> : null}
    </div>
  );
}

/* ── LauncherCard: a way into another report ── */
export function LauncherCardBlock({ blockId }: Props) {
  const p = useBlock(blockId);
  const readOnly = usePreviewReadOnly();
  const designSystem = useBuilder((s) => s.designSystem);
  const templateId = (VALID_TEMPLATE_IDS as readonly string[]).includes(str(p.templateId)) ? (str(p.templateId) as TemplateId) : null;
  const open = (e: React.MouseEvent) => {
    /* In Edit a click selects the block, like any other; while presenting,
       the button goes to the report. */
    if (!readOnly || !templateId) return;
    e.stopPropagation();
    openTemplateLink(BUILDER_TEMPLATES[templateId], designSystem);
  };
  return (
    <article className="dh-launcher" style={{ ...toneStyle(str(p.accent) === "mid" ? "mid" : "accent"), ...boxHeight(p) }}>
      <header className="dh-launcher-head">
        <h3 className="dh-launcher-title">{str(p.title, "Report")}</h3>
        {p.tag ? <span className="dh-cell-tag" style={toneStyle(str(p.tagTone) === "mid" ? "mid" : "accent")}>{str(p.tag)}</span> : null}
      </header>
      <div className="dh-launcher-thumb" aria-hidden="true">{templateId && REFERENCE_THUMBNAILS[templateId] ? <img src={REFERENCE_THUMBNAILS[templateId]} alt="" /> : templateId ? <TemplatePreview id={templateId} /> : null}</div>
      <p className="dh-launcher-desc">{str(p.description)}</p>
      <button type="button" className="dh-launcher-open" onClick={open} disabled={!templateId}>
        {str(p.actionLabel, "Open report")}
        <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
      </button>
    </article>
  );
}

/* ── HeroSearch: a page's opening line and a search field ── */
export function HeroSearchBlock({ blockId }: Props) {
  const p = useBlock(blockId);
  return (
    <div className={`dh-hero${p.referenceGraphic === "analytics" ? " dh-hero-reference" : ""}`} style={boxHeight(p)}>
      <h1 className="dh-hero-title">{str(p.title, "Analytics")}</h1>
      {p.subtitle ? <p className="dh-hero-subtitle">{str(p.subtitle)}</p> : null}
      <div className="dh-hero-search" role="search">
        <Search size={16} strokeWidth={1.8} aria-hidden="true" />
        <input type="search" className="dh-hero-input" placeholder={str(p.placeholder, "Search")} aria-label={str(p.placeholder, "Search")} readOnly />
        <span className="dh-hero-button" aria-hidden="true">{str(p.buttonLabel, "Search")}</span>
      </div>
    </div>
  );
}

/** The key a tile, header or card is currently showing (for tests). */
export { lookupKey };
