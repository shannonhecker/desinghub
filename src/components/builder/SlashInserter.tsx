"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { useBuilder, type ZoneId } from "@/store/useBuilder";
import { LIBRARY_BLUEPRINTS } from "@/lib/blockRegistry";
import { MiniPreview } from "./MiniPreview";

/* ══════════════════════════════════════════════════════════
   SlashInserter - primary add surface (Track B / A2).

   Open/close is driven by the store:
     - useBuilder.inserterOpen   : boolean
     - useBuilder.inserterAnchor : { zone, index } | null
     - useBuilder.openInserter() / closeInserter()

   Triggers:
     - "/"           → when focus is NOT inside an editable element.
                       Matches the existing behavior so people can
                       still type slashes in inputs / the chat box.
     - Cmd-K / Ctrl-K → always, even inside text fields. Mirrors
                        Spotlight / VS Code command palette patterns
                        so users have one muscle-memory shortcut that
                        works everywhere.

   Features:
     - Fuzzy search via Fuse.js over LIBRARY_BLUEPRINTS. Weighted on
       label (0.7) + type (0.3), threshold 0.4.
     - Zone-grouped results. If `inserterAnchor` has a zone, that
       zone is pinned as the first section. Otherwise results are
       grouped body → header → sidebar → footer in natural order.
     - Zone scoping: a query prefixed with ">header ", ">sidebar ",
       ">body ", ">footer " narrows results to that zone. The
       prefix stays visible in the input so the user sees what's
       scoping the list.
     - Recents stored under localStorage key
       "designhub.inserter.recents" (max 8 unique types). Shown as
       a "Recent" section at the top when the query is empty.
   ══════════════════════════════════════════════════════════ */

const RECENTS_KEY = "designhub.inserter.recents";
const RECENTS_MAX = 8;
const RECENTS_SHOWN = 5;

type Blueprint = (typeof LIBRARY_BLUEPRINTS)[number];

/* Zone restrictions are inferred from addBlockFromLibrary's
   zoneByType map - a handful of block types are pinned to a
   single zone (AppBrand → header, NavItem → sidebar, etc).
   Every other blueprint is treated as zone-agnostic so it shows
   up in every zone section. */
const ZONE_BY_TYPE: Record<string, ZoneId> = {
  AppBrand: "header",
  StatusPill: "header",
  NavItem: "sidebar",
  FooterText: "footer",
};
const ZONE_ORDER: ZoneId[] = ["body", "header", "sidebar", "footer"];
const ZONE_LABEL: Record<ZoneId, string> = {
  body: "Body",
  header: "Header",
  sidebar: "Sidebar",
  footer: "Footer",
};

const ZONE_PREFIXES: { prefix: string; zone: ZoneId }[] = [
  { prefix: ">header ", zone: "header" },
  { prefix: ">sidebar ", zone: "sidebar" },
  { prefix: ">footer ", zone: "footer" },
  { prefix: ">body ", zone: "body" },
];

function isEditableTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable) return true;
  const tag = t.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return false;
}

function readRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v) => typeof v === "string").slice(0, RECENTS_MAX);
  } catch {
    return [];
  }
}

function writeRecents(list: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, RECENTS_MAX)));
  } catch {
    /* ignore quota / privacy-mode failures - non-critical */
  }
}

/* Is this blueprint eligible to live in a given zone? Blueprints
   without an explicit zone pin show everywhere; pinned types only
   show in their assigned zone. */
function isBlueprintInZone(bp: Blueprint, zone: ZoneId): boolean {
  const pinned = ZONE_BY_TYPE[bp.type];
  return pinned === undefined || pinned === zone;
}

interface ResultSection {
  key: string;
  label: string;
  /* rows inside this section, keyed for rendering + flattened index */
  items: Blueprint[];
}

export function SlashInserter() {
  const open = useBuilder((s) => s.inserterOpen);
  const anchor = useBuilder((s) => s.inserterAnchor);
  const closeInserter = useBuilder((s) => s.closeInserter);
  const openInserter = useBuilder((s) => s.openInserter);
  const addBlockFromLibrary = useBuilder((s) => s.addBlockFromLibrary);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recents, setRecents] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  /* Build a Fuse index once. LIBRARY_BLUEPRINTS is a module-level
     constant so this memo effectively runs once per page load. */
  const fuse = useMemo(
    () =>
      new Fuse(LIBRARY_BLUEPRINTS, {
        keys: [
          { name: "label", weight: 0.7 },
          { name: "type", weight: 0.3 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
        includeScore: false,
      }),
    [],
  );

  /* Parse ">zone query" prefix. Returns the scoped zone (or null) and
     the remaining query string after stripping the prefix. The prefix
     itself stays in the input so users see what's scoping their
     results. */
  const { scopedZone, fuseQuery } = useMemo(() => {
    const lower = query.toLowerCase();
    for (const { prefix, zone } of ZONE_PREFIXES) {
      if (lower.startsWith(prefix)) {
        return { scopedZone: zone, fuseQuery: query.slice(prefix.length) };
      }
    }
    return { scopedZone: null as ZoneId | null, fuseQuery: query };
  }, [query]);

  /* Base candidate list. Fuzzy-ranked by Fuse when there's a query,
     otherwise registry order. Honors ">zone" scoping when present. */
  const candidates = useMemo(() => {
    const raw = fuseQuery.trim();
    let list: Blueprint[];
    if (!raw) {
      list = LIBRARY_BLUEPRINTS.slice(0, 60);
    } else {
      list = fuse.search(raw).map((r) => r.item);
    }
    if (scopedZone) {
      list = list.filter((bp) => isBlueprintInZone(bp, scopedZone));
    }
    return list;
  }, [fuse, fuseQuery, scopedZone]);

  /* Group results into sections. Rules:
       - If query is empty and no scopedZone: show "Recent" first (if
         any), then zone sections in either anchor-pinned order or
         natural order.
       - If scopedZone is set: a single section labeled that zone.
       - If fuse query is active: a single "Results" section (grouping
         by zone with fuzzy-ranked cross-zone results would shuffle
         relevance in a confusing way). Anchor-pinned stays pinned
         above via sort. */
  const sections: ResultSection[] = useMemo(() => {
    const emptyQuery = fuseQuery.trim() === "";

    /* Scoped: one section only, label reflects the zone. */
    if (scopedZone) {
      return [
        {
          key: `zone-${scopedZone}`,
          label: `In ${ZONE_LABEL[scopedZone]}`,
          items: candidates,
        },
      ];
    }

    /* Active fuzzy query with no zone scope: flat results, but we
       can still pin anchor-zone matches on top so the in-canvas +
       affordance points the user at what they probably wanted. */
    if (!emptyQuery) {
      if (anchor?.zone) {
        const here: Blueprint[] = [];
        const rest: Blueprint[] = [];
        for (const bp of candidates) {
          if (isBlueprintInZone(bp, anchor.zone)) here.push(bp);
          else rest.push(bp);
        }
        const out: ResultSection[] = [];
        if (here.length > 0) {
          out.push({
            key: `anchor-${anchor.zone}`,
            label: `In ${ZONE_LABEL[anchor.zone]}`,
            items: here,
          });
        }
        if (rest.length > 0) {
          out.push({ key: "other-zones", label: "Other zones", items: rest });
        }
        return out;
      }
      return [{ key: "results", label: "Results", items: candidates }];
    }

    /* Empty query: recents + zone sections. Pin anchor-zone first if
       one exists. */
    const out: ResultSection[] = [];

    if (recents.length > 0) {
      const recentBps = recents
        .slice(0, RECENTS_SHOWN)
        .map((type) => LIBRARY_BLUEPRINTS.find((bp) => bp.type === type))
        .filter((bp): bp is Blueprint => Boolean(bp));
      if (recentBps.length > 0) {
        out.push({ key: "recent", label: "Recent", items: recentBps });
      }
    }

    const zoneOrder: ZoneId[] = anchor?.zone
      ? [anchor.zone, ...ZONE_ORDER.filter((z) => z !== anchor.zone)]
      : ZONE_ORDER;

    for (const zone of zoneOrder) {
      const items = candidates.filter((bp) => isBlueprintInZone(bp, zone));
      if (items.length === 0) continue;
      const label = anchor?.zone === zone ? `In ${ZONE_LABEL[zone]}` : ZONE_LABEL[zone];
      out.push({ key: `zone-${zone}`, label, items });
    }

    return out;
  }, [anchor, candidates, fuseQuery, recents, scopedZone]);

  /* Flattened rows for keyboard nav - every row across all sections
     gets a monotonic index. A row's section membership comes from
     looking at where the index falls. */
  const flatRows = useMemo(() => {
    const rows: { bp: Blueprint; sectionKey: string }[] = [];
    for (const section of sections) {
      for (const bp of section.items) {
        rows.push({ bp, sectionKey: section.key });
      }
    }
    return rows;
  }, [sections]);

  /* Reset activeIndex when the shape of results changes. Clamp to
     valid range so we never stay pointed at a stale row. */
  useEffect(() => {
    setActiveIndex((i) => (i >= flatRows.length ? 0 : i));
  }, [flatRows.length]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  /* Load recents once on mount. Guarded by mount check so SSR doesn't
     touch localStorage. */
  useEffect(() => {
    setRecents(readRecents());
  }, []);

  /* Global triggers:
       - "/" opens only when not inside an editable target.
       - Cmd-K / Ctrl-K opens regardless of focus.
       - Escape closes when open.
     Using useBuilder.getState() inside the handler means we don't
     need `open` in the dependency array - the listener stays stable
     and reads fresh state on each keystroke. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const state = useBuilder.getState();
      const isOpen = state.inserterOpen;
      const isCmdK = (e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey);
      if (isCmdK) {
        e.preventDefault();
        if (!isOpen) {
          setQuery("");
          openInserter();
        } else {
          closeInserter();
        }
        return;
      }
      if (e.key === "/" && !isOpen && !isEditableTarget(document.activeElement)) {
        e.preventDefault();
        setQuery("");
        openInserter();
        return;
      }
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeInserter();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openInserter, closeInserter]);

  /* Focus the search field on open; lock body scroll; scroll the
     active row into view. Same pattern as before — only the open
     source changed. */
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const rows = listRef.current.querySelectorAll<HTMLElement>(".slash-row");
    const row = rows[activeIndex];
    if (row) row.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  /* Reset transient state when the overlay closes so the next open
     starts fresh (empty query, first row highlighted). */
  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  if (!open) return null;

  const handleInsert = (rowIdx: number) => {
    const row = flatRows[rowIdx];
    if (!row) return;
    const bp = row.bp;
    /* Prefer the anchor's zone, but let addBlockFromLibrary's
       zoneByType override still win for types that are locked to a
       specific zone (AppBrand, NavItem, etc). Passing the anchor
       index triggers the in-place splice path. */
    const anchorNow = useBuilder.getState().inserterAnchor;
    addBlockFromLibrary(bp.type, bp.defaults, anchorNow?.zone, anchorNow?.index);
    /* Update recents: unshift the new type, dedupe, cap at MAX. */
    const nextRecents = [bp.type, ...recents.filter((t) => t !== bp.type)].slice(0, RECENTS_MAX);
    setRecents(nextRecents);
    writeRecents(nextRecents);
    closeInserter();
  };

  const handleKeyDown: React.KeyboardEventHandler = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(flatRows.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleInsert(activeIndex);
    } else if (e.key === "Tab") {
      e.preventDefault();
      setActiveIndex((i) =>
        e.shiftKey ? Math.max(0, i - 1) : Math.min(flatRows.length - 1, i + 1),
      );
    }
  };

  /* Compute the global row index for a (section, local-idx) pair so
     keyboard activeIndex matches what's rendered. */
  let cursor = 0;

  return (
    <div
      className="slash-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="slash-inserter-title"
      onClick={() => closeInserter()}
    >
      <div className="slash-panel" onClick={(e) => e.stopPropagation()}>
        <div className="slash-header">
          <span className="slash-title" id="slash-inserter-title">
            Insert component
          </span>
          <span className="slash-hint">
            <kbd>⌘K</kbd> or <kbd>/</kbd> · <kbd>↑</kbd><kbd>↓</kbd> navigate · <kbd>⏎</kbd> insert · <kbd>Esc</kbd> close
          </span>
        </div>
        <div className="slash-search">
          <span className="material-symbols-outlined slash-search-icon" aria-hidden="true">
            search
          </span>
          <input
            ref={inputRef}
            type="text"
            className="slash-search-input"
            placeholder={
              anchor?.zone
                ? `Search components for ${ZONE_LABEL[anchor.zone]}… or type >zone to scope`
                : "Search components… try >header to scope"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div
          className="slash-list"
          ref={listRef}
          role="listbox"
          aria-activedescendant={flatRows[activeIndex] ? `slash-row-${activeIndex}` : undefined}
        >
          {flatRows.length === 0 && (
            <div className="slash-empty">No components match “{query}”.</div>
          )}
          {sections.map((section) => {
            const startedAt = cursor;
            cursor += section.items.length;
            return (
              <div key={section.key} className="slash-section">
                <div className="slash-section-label">{section.label}</div>
                {section.items.map((bp, localIdx) => {
                  const globalIdx = startedAt + localIdx;
                  const isActive = globalIdx === activeIndex;
                  return (
                    <button
                      key={`${section.key}-${bp.id}`}
                      id={`slash-row-${globalIdx}`}
                      type="button"
                      className={`slash-row ${isActive ? "is-active" : ""}`}
                      onMouseEnter={() => setActiveIndex(globalIdx)}
                      onClick={() => handleInsert(globalIdx)}
                      role="option"
                      aria-selected={isActive}
                    >
                      <div className="slash-row-thumb">
                        <MiniPreview type={bp.type} />
                      </div>
                      <div className="slash-row-text">
                        <span className="slash-row-label">{bp.label}</span>
                        <span className="slash-row-type">{bp.type}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
