"use client";

import React, { useMemo, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useBuilder } from "@/store/useBuilder";
import { LIBRARY_BLUEPRINTS, TYPE_FIELDS } from "@/lib/blockRegistry";

/* ══════════════════════════════════════════════════════════
   Zone classification for drag-to-all-zones discoverability.
   Every blueprint type is tagged with a primary home zone so
   the library can group them and users can see at a glance
   which components are designed for which zone.
   ══════════════════════════════════════════════════════════ */
type LibraryZone = "header" | "sidebar" | "footer" | "body";

const ZONE_BY_TYPE: Record<string, LibraryZone> = {
  AppBrand: "header",
  StatusPill: "header",
  NavItem: "sidebar",
  FooterText: "footer",
  /* Everything else defaults to "body" via zoneForType() below. */
};

function zoneForType(type: string): LibraryZone {
  return ZONE_BY_TYPE[type] ?? "body";
}

const ZONE_LABELS: Record<LibraryZone, { label: string; hint: string; icon: string }> = {
  header:  { label: "Header",  hint: "Drag onto the top bar",     icon: "top_panel_open" },
  sidebar: { label: "Sidebar", hint: "Drag onto the left rail",   icon: "left_panel_open" },
  body:    { label: "Body",    hint: "Drag onto the main canvas", icon: "dashboard" },
  footer:  { label: "Footer",  hint: "Drag onto the bottom bar",  icon: "bottom_panel_open" },
};

const ZONE_ORDER: LibraryZone[] = ["body", "header", "sidebar", "footer"];

/* ── Single draggable blueprint card ── */
function BlueprintItem({ blueprint, zone }: {
  blueprint: { id: string; type: string; label: string; icon: string; defaults: Record<string, unknown> };
  zone: LibraryZone;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: blueprint.id,
    data: {
      fromLibrary: true,
      type: blueprint.type,
      defaults: blueprint.defaults,
      /* Preferred zone — drag handler can use this as a hint if needed. */
      zone,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`lib-blueprint${isDragging ? " is-dragging" : ""}`}
      {...listeners}
      {...attributes}
      title={`${blueprint.label} — ${ZONE_LABELS[zone].hint.toLowerCase()}`}
    >
      <span className="material-symbols-outlined lib-blueprint-icon">
        {blueprint.icon}
      </span>
      <span className="lib-blueprint-label">{blueprint.label}</span>
    </div>
  );
}

/* ── Combined component panel: library + properties ── */
export function ComponentLibrary() {
  const {
    toggleComponentLibrary,
    selectedBlockId,
    selectedBlockZone,
    blocks,
    headerBlocks,
    sidebarBlocks,
    footerBlocks,
    updateBlockProps,
  } = useBuilder();

  const selectedBlock = selectedBlockId
    ? (blocks.find((b) => b.id === selectedBlockId)
      ?? headerBlocks.find((b) => b.id === selectedBlockId)
      ?? sidebarBlocks.find((b) => b.id === selectedBlockId)
      ?? footerBlocks.find((b) => b.id === selectedBlockId))
    : null;
  const FieldsComponent = selectedBlock
    ? TYPE_FIELDS[selectedBlock.type]
    : null;

  return (
    <div className="component-library">
      <div className="lib-header">
        <span className="lib-header-title">Components</span>
        <button
          className="lib-close-btn"
          onClick={toggleComponentLibrary}
          type="button"
          title="Close panel"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            close
          </span>
        </button>
      </div>

      <div className="lib-body">
        {/* Properties inspector — shown at top when a block is selected */}
        {selectedBlock && FieldsComponent && (
          <div>
            <div className="inspector-section-title">
              {selectedBlock.type.replace("Simulated", "")} Properties
            </div>
            <FieldsComponent blockId={selectedBlock.id} />

            {/* Layout: column span — only for body blocks */}
            {selectedBlockZone === "body" && (
              <>
                <div className="lib-section-divider" />
                <div className="inspector-section-title">Layout</div>
                <div className="inspector-field">
                  <label className="inspector-field-label">Column Width</label>
                  <div className="inspector-toggle-group">
                    {([1, 2, 3] as const).map((span) => {
                      const labels: Record<number, string> = { 1: "⅓", 2: "⅔", 3: "Full" };
                      const current = Number(selectedBlock.props.colSpan) || 3;
                      return (
                        <button
                          key={span}
                          className={`inspector-toggle-btn${current === span ? " active" : ""}`}
                          onClick={() => updateBlockProps(selectedBlock.id, { colSpan: span })}
                        >
                          {labels[span]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Library — grouped by zone, searchable. Each blueprint can be
            dragged onto its preferred zone (though drop handling allows
            any zone). */}
        <LibraryBrowser />
      </div>
    </div>
  );
}

/* ── Library browser — searchable + grouped by zone ── */
function LibraryBrowser() {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groups: Record<LibraryZone, typeof LIBRARY_BLUEPRINTS> = {
      body: [], header: [], sidebar: [], footer: [],
    };
    for (const bp of LIBRARY_BLUEPRINTS) {
      if (q && !bp.label.toLowerCase().includes(q) && !bp.type.toLowerCase().includes(q)) continue;
      const zone = zoneForType(bp.type);
      groups[zone].push(bp);
    }
    return groups;
  }, [query]);

  const totalVisible = grouped.body.length + grouped.header.length + grouped.sidebar.length + grouped.footer.length;

  return (
    <div>
      {/* Search input */}
      <div className="lib-search">
        <span className="material-symbols-outlined lib-search-icon" aria-hidden="true">search</span>
        <input
          type="text"
          className="lib-search-input"
          placeholder="Search components..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search component library"
        />
        {query && (
          <button
            type="button"
            className="lib-search-clear"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 14 }}>close</span>
          </button>
        )}
      </div>

      {totalVisible === 0 && (
        <div className="lib-empty">No components match "{query}".</div>
      )}

      {ZONE_ORDER.map((zone) => {
        const items = grouped[zone];
        if (items.length === 0) return null;
        const meta = ZONE_LABELS[zone];
        return (
          <div key={zone} className="lib-zone-group">
            <div className="lib-zone-head">
              <span className="material-symbols-outlined lib-zone-icon" aria-hidden="true">{meta.icon}</span>
              <span className="lib-zone-label">{meta.label}</span>
              <span className="lib-zone-count">{items.length}</span>
            </div>
            <div className="lib-zone-hint">{meta.hint}</div>
            {items.map((bp) => (
              <BlueprintItem key={bp.id} blueprint={bp} zone={zone} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
