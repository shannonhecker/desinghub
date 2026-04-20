"use client";

import React, { useMemo, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useBuilder, type LayoutProps, type LayoutWidth, type ZoneId } from "@/store/useBuilder";
import { LIBRARY_BLUEPRINTS, TYPE_FIELDS } from "@/lib/blockRegistry";
import { MiniPreview } from "./MiniPreview";
import { BUILDER_TEMPLATES, TEMPLATE_ORDER, type BuilderTemplate, type TemplateId } from "@/lib/builderTemplates";
import { TemplatePreview } from "./TemplatePreviews";
import { titleFromTemplate } from "@/lib/sessionTitle";
import { HoverPreview, type HoverPreviewState } from "./HoverPreview";
import { CATEGORICAL_PALETTES, PALETTE_SLOT_LABELS, PALETTE_SLOT_NAMES } from "@/lib/categoricalPalettes";

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

/* Shared state for hover-preview fly-out. Tiles call show()/hide();
 *   the HoverPreview overlay reads the current state and positions
 *   itself next to the active tile. Scoped to ComponentLibrary so a
 *   second library instance (if ever mounted) doesn't clash. */
interface HoverContextValue {
  show: (state: HoverPreviewState) => void;
  hide: () => void;
}
const HoverContext = React.createContext<HoverContextValue | null>(null);

const HOVER_DELAY_MS = 300;

/* Click vs. drag threshold - MUST match the MouseSensor's
   activationConstraint.distance in PreviewPanel.tsx (currently 10px).
   If CLICK_TOLERANCE is lower than the drag activation distance, any
   pointer movement in the gap triggers neither click nor drag, which
   reads as "nothing happens" to the user on touchpads / jittery mice.
   Keep these two numbers in lockstep. */
const CLICK_TOLERANCE_PX = 10;

/* ── Visual grid tile - stylized mini-preview + label.
 *   Drag-enabled via dnd-kit for drop-to-canvas.
 *   Click-to-add (Phase E.3) handled via pointer-displacement gating.
 *   Hover preview (Phase E.4) via shared HoverContext. */
function BlueprintItem({ blueprint, zone }: {
  blueprint: { id: string; type: string; label: string; icon: string; defaults: Record<string, unknown> };
  zone: LibraryZone;
}) {
  const addBlockFromLibrary = useBuilder((s) => s.addBlockFromLibrary);
  const hover = React.useContext(HoverContext);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: blueprint.id,
    data: {
      fromLibrary: true,
      type: blueprint.type,
      defaults: blueprint.defaults,
      /* Preferred zone - drag handler can use this as a hint if needed. */
      zone,
    },
  });

  /* Click-to-add: distinguish click vs drag by tracking pointer
     displacement. A click fires only when pointerup lands within a
     few pixels of pointerdown - otherwise dnd-kit takes over. */
  const pointerStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const tileRef = React.useRef<HTMLDivElement | null>(null);
  const hoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    /* Clicking a tile should instantly dismiss the hover preview so
       it doesn't linger after the block is added. */
    if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; }
    hover?.hide();
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start) return;
    const dx = Math.abs(e.clientX - start.x);
    const dy = Math.abs(e.clientY - start.y);
    /* Anything below the dnd-kit activation distance is a click;
       movement past that point is a drag that dnd-kit owns via
       onDragEnd. Keep this in lockstep with MouseSensor's
       activationConstraint.distance (see CLICK_TOLERANCE_PX note). */
    if (dx < CLICK_TOLERANCE_PX && dy < CLICK_TOLERANCE_PX) {
      /* Pass the tile's source zone so a Body-group tile always lands
         in body even if the user's current selectedBlockZone is
         elsewhere (e.g. they clicked a header block just before). */
      addBlockFromLibrary(blueprint.type, blueprint.defaults, zone);
    }
  };

  const handleMouseEnter = () => {
    if (!hover) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      const el = tileRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      hover.show({
        type: blueprint.type,
        label: blueprint.label,
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      });
    }, HOVER_DELAY_MS);
  };
  const handleMouseLeave = () => {
    if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; }
    hover?.hide();
  };

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        tileRef.current = el;
      }}
      className={`lib-tile${isDragging ? " is-dragging" : ""}`}
      {...listeners}
      {...attributes}
      onPointerDown={(e) => {
        handlePointerDown(e);
        /* Forward to dnd-kit's listeners (they're spread above via
           {...listeners}); dnd-kit reads the pointer event itself. */
        listeners?.onPointerDown?.(e);
      }}
      onPointerUp={handlePointerUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={`${blueprint.label} - drag onto canvas or click to add`}
      role="button"
      tabIndex={0}
    >
      <div className="lib-tile-preview">
        <MiniPreview type={blueprint.type} />
      </div>
      <span className="lib-tile-label">{blueprint.label}</span>
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

  /* Shared hover-preview state for all tiles in this panel instance.
     Kept here (rather than in a tile) so the HoverPreview overlay
     reads a single source of truth without per-tile portals. */
  const [hoverState, setHoverState] = useState<HoverPreviewState | null>(null);
  const hoverCtx = useMemo(
    () => ({
      show: (s: HoverPreviewState) => setHoverState(s),
      hide: () => setHoverState(null),
    }),
    []
  );

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
    <HoverContext.Provider value={hoverCtx}>
    <div className="component-library">
      {/* Hover-preview overlay - positioned via portal into document.body
          so it escapes the sidebar's overflow clipping. */}
      <HoverPreview state={hoverState} />

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
        {/* Properties inspector - shown at top when a block is selected */}
        {selectedBlock && FieldsComponent && (
          <div>
            <div className="inspector-section-title">
              {selectedBlock.type.replace("Simulated", "")} Properties
            </div>
            <FieldsComponent blockId={selectedBlock.id} />

            {/* Layout panel - per-block sizing + alignment.
                Visible for any zone; header/sidebar/footer blocks
                can now opt into fixed-width layouts too. */}
            <div className="lib-section-divider" />
            <LayoutSection block={selectedBlock} zone={selectedBlockZone ?? "body"} />
            <div className="lib-section-divider" />
            <ZoneLayoutSection zone={selectedBlockZone ?? "body"} />

            {/* Chart colours - only for Highchart blocks (P1.3).
                Swatches are the active DS's 12-slot categorical palette
                from /lib/categoricalPalettes.ts. Clicking sets the
                first series colour; "Reset" clears the override so
                the chart returns to the full DS palette. */}
            {selectedBlock.type.startsWith("Highchart") && (
              <ChartColoursSection block={selectedBlock} />
            )}
          </div>
        )}

        {/* Templates accordion - collapsible section at the top so users
            can swap the entire layout mid-flow without returning to the
            empty state. Renders a 2x2 grid of mini template cards. */}
        <TemplatesAccordion />

        {/* Library - grouped by zone, searchable. Each blueprint can be
            dragged onto its preferred zone (though drop handling allows
            any zone). */}
        <LibraryBrowser />
      </div>
    </div>
    </HoverContext.Provider>
  );
}

/* ══════════════════════════════════════════════════════════
   LayoutSection - width / min / max / grow / align / margin
   ══════════════════════════════════════════════════════════
   Surfaces the same LayoutProps that the two-handle resize
   writes. Users pick a width MODE (Fill / Auto / Fixed / %
   / fr), then type a value if the mode needs one. Min-width
   and max-width accept bare numbers (treated as px) OR the
   same mode tokens ("120px", "20%"). Grow is a toggle.
   Align controls align-self. Margin is a single-number px.

   Changes write through useBuilder().updateBlockLayout so the
   store notifies subscribers and PreviewCanvas re-renders
   via the layoutResolver. Legacy props.colSpan is left alone
   here - the resolver translates it when layout.width is
   absent, so editing the Layout panel is a progressive
   migration per block. */
function LayoutSection({
  block,
  zone,
}: {
  block: { id: string; type: string; props: Record<string, unknown>; layout?: LayoutProps };
  zone: ZoneId;
}) {
  const updateBlockLayout = useBuilder((s) => s.updateBlockLayout);
  const layout = block.layout ?? {};

  /* Derive the current width "mode" from layout.width. Used by
     the mode buttons to highlight the active option. */
  const currentMode: "fill" | "auto" | "px" | "percent" | "fr" = (() => {
    const w = layout.width;
    if (w === "fill" || w === undefined) return "fill";
    if (w === "auto") return "auto";
    if (typeof w === "number") return "px";
    if (typeof w === "string") {
      if (w.endsWith("px")) return "px";
      if (w.endsWith("%")) return "percent";
      if (w.endsWith("fr")) return "fr";
    }
    return "fill";
  })();

  /* Numeric-only part of a LayoutWidth token, for editing. */
  const parseWidthValue = (w: LayoutWidth | undefined): string => {
    if (w === undefined || w === "fill" || w === "auto") return "";
    if (typeof w === "number") return String(w);
    return w.replace(/(px|%|fr)$/, "");
  };

  const setWidth = (mode: typeof currentMode, value?: string) => {
    if (mode === "fill") {
      updateBlockLayout(zone, block.id, { width: "fill" });
    } else if (mode === "auto") {
      updateBlockLayout(zone, block.id, { width: "auto" });
    } else {
      const n = value !== undefined ? value : parseWidthValue(layout.width) || (mode === "percent" ? "50" : mode === "fr" ? "1" : "240");
      const next = mode === "px" ? `${n}px` : mode === "percent" ? `${n}%` : `${n}fr`;
      updateBlockLayout(zone, block.id, { width: next as LayoutWidth });
    }
  };

  const widthValue = parseWidthValue(layout.width);
  const needsValue = currentMode === "px" || currentMode === "percent" || currentMode === "fr";

  return (
    <>
      <div className="inspector-section-title">Layout</div>

      {/* Width mode selector - 5 modes */}
      <div className="inspector-field">
        <label className="inspector-field-label">Width</label>
        <div className="inspector-toggle-group" role="radiogroup" aria-label="Width mode">
          {([
            ["fill", "Fill"],
            ["auto", "Auto"],
            ["px", "Px"],
            ["percent", "%"],
            ["fr", "Fr"],
          ] as const).map(([m, label]) => (
            <button
              key={m}
              role="radio"
              aria-checked={currentMode === m}
              className={`inspector-toggle-btn${currentMode === m ? " active" : ""}`}
              onClick={() => setWidth(m)}
              title={
                m === "fill" ? "Fill remaining row space"
                : m === "auto" ? "Hug contents"
                : m === "px" ? "Fixed pixel width"
                : m === "percent" ? "Percentage of container"
                : "Grid fractional unit (grid containers only)"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Numeric input - only shown for modes that need a value */}
      {needsValue && (
        <div className="inspector-field">
          <label className="inspector-field-label">
            {currentMode === "px" ? "Value (px)" : currentMode === "percent" ? "Value (%)" : "Value (fr)"}
          </label>
          <input
            type="number"
            className="inspector-input"
            value={widthValue}
            min={currentMode === "percent" ? 1 : 0}
            max={currentMode === "percent" ? 100 : undefined}
            step={currentMode === "fr" ? 0.5 : 1}
            onChange={(e) => setWidth(currentMode, e.target.value)}
          />
        </div>
      )}

      {/* Min / max width (px). Empty string clears the constraint. */}
      <div className="inspector-field inspector-field-row">
        <div style={{ flex: 1 }}>
          <label className="inspector-field-label">Min width (px)</label>
          <input
            type="number"
            className="inspector-input"
            value={parseWidthValue(layout.minWidth)}
            min={0}
            placeholder="—"
            onChange={(e) => {
              const v = e.target.value;
              updateBlockLayout(zone, block.id, {
                minWidth: v === "" ? undefined : (`${v}px` as LayoutWidth),
              });
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="inspector-field-label">Max width (px)</label>
          <input
            type="number"
            className="inspector-input"
            value={parseWidthValue(layout.maxWidth)}
            min={0}
            placeholder="—"
            onChange={(e) => {
              const v = e.target.value;
              updateBlockLayout(zone, block.id, {
                maxWidth: v === "" ? undefined : (`${v}px` as LayoutWidth),
              });
            }}
          />
        </div>
      </div>

      {/* Grow toggle - flex-grow 0 vs 1 */}
      <div className="inspector-field">
        <label className="inspector-field-label">Grow</label>
        <div className="inspector-toggle-group">
          {([["0", "Off", 0 as const], ["1", "On", 1 as const]] as const).map(([, label, v]) => (
            <button
              key={label}
              className={`inspector-toggle-btn${(layout.grow ?? 0) === v ? " active" : ""}`}
              onClick={() => updateBlockLayout(zone, block.id, { grow: v })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Align-self on the cross axis */}
      <div className="inspector-field">
        <label className="inspector-field-label">Align</label>
        <div className="inspector-toggle-group">
          {(["start", "center", "end", "stretch"] as const).map((a) => (
            <button
              key={a}
              className={`inspector-toggle-btn${(layout.align ?? "stretch") === a ? " active" : ""}`}
              onClick={() => updateBlockLayout(zone, block.id, { align: a })}
            >
              {a === "start" ? "Top" : a === "center" ? "Center" : a === "end" ? "Bottom" : "Stretch"}
            </button>
          ))}
        </div>
      </div>

      {/* Margin - single-value px; applied to all sides. */}
      <div className="inspector-field">
        <label className="inspector-field-label">Margin (px)</label>
        <input
          type="number"
          className="inspector-input"
          value={layout.margin ?? ""}
          min={0}
          placeholder="0"
          onChange={(e) => {
            const v = e.target.value;
            updateBlockLayout(zone, block.id, { margin: v === "" ? undefined : Number(v) });
          }}
        />
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   ZoneLayoutSection - container flow picker
   ══════════════════════════════════════════════════════════
   Shows one section per selected zone describing how its
   children flow. Three modes: Stack (vertical), Row (horizontal
   with wrap), Grid (N columns). Grid exposes a column count.
   Also exposes gap + padding + wrap + align for fine control.

   Default values match each zone's traditional behaviour:
     body    -> row + wrap + 12px gap + stretch align
     header  -> row + no-wrap + 8px gap + center align
     sidebar -> stack + 2px gap + stretch align
     footer  -> row + no-wrap + 8px gap + center align

   Writes go through useBuilder().setZoneLayout(zone, patch).
   ZoneDropContainer reads the same slice + applies
   computeContainerStyle, so picking a new mode immediately
   re-flows the canvas. */
function ZoneLayoutSection({ zone }: { zone: ZoneId }) {
  const zoneLayout = useBuilder((s) => s.zoneLayouts[zone]);
  const setZoneLayout = useBuilder((s) => s.setZoneLayout);
  const label = zone.charAt(0).toUpperCase() + zone.slice(1);

  return (
    <>
      <div className="inspector-section-title">{label} Zone Layout</div>

      {/* Flow mode - stack / row / grid */}
      <div className="inspector-field">
        <label className="inspector-field-label">Flow</label>
        <div className="inspector-toggle-group" role="radiogroup" aria-label="Zone flow mode">
          {([
            ["stack", "Stack"],
            ["row", "Row"],
            ["grid", "Grid"],
          ] as const).map(([m, lbl]) => (
            <button
              key={m}
              role="radio"
              aria-checked={zoneLayout.mode === m}
              className={`inspector-toggle-btn${zoneLayout.mode === m ? " active" : ""}`}
              onClick={() => setZoneLayout(zone, { mode: m })}
              title={
                m === "stack" ? "Vertical column - children stack top-down"
                : m === "row" ? "Horizontal row - children sit side-by-side, wrap at edge"
                : "CSS Grid with a fixed column count - children snap to column boundaries"
              }
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Grid column count - only shown in Grid mode */}
      {zoneLayout.mode === "grid" && (
        <div className="inspector-field">
          <label className="inspector-field-label">Columns</label>
          <input
            type="number"
            className="inspector-input"
            min={1}
            max={12}
            value={zoneLayout.columns ?? 3}
            onChange={(e) => setZoneLayout(zone, { columns: Math.max(1, Math.min(12, Number(e.target.value) || 3)) })}
          />
        </div>
      )}

      {/* Wrap toggle - Row mode only; Stack is always nowrap */}
      {zoneLayout.mode === "row" && (
        <div className="inspector-field">
          <label className="inspector-field-label">Wrap</label>
          <div className="inspector-toggle-group">
            {([
              [false, "Nowrap"],
              [true, "Wrap"],
            ] as const).map(([v, lbl]) => (
              <button
                key={lbl}
                className={`inspector-toggle-btn${(zoneLayout.wrap ?? true) === v ? " active" : ""}`}
                onClick={() => setZoneLayout(zone, { wrap: v })}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gap - space between children in px */}
      <div className="inspector-field inspector-field-row">
        <div style={{ flex: 1 }}>
          <label className="inspector-field-label">Gap (px)</label>
          <input
            type="number"
            className="inspector-input"
            min={0}
            value={zoneLayout.gap ?? 0}
            onChange={(e) => setZoneLayout(zone, { gap: Math.max(0, Number(e.target.value) || 0) })}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="inspector-field-label">Padding (px)</label>
          <input
            type="number"
            className="inspector-input"
            min={0}
            value={zoneLayout.padding ?? 0}
            onChange={(e) => setZoneLayout(zone, { padding: Math.max(0, Number(e.target.value) || 0) })}
          />
        </div>
      </div>

      {/* Align - align-items on the cross axis */}
      <div className="inspector-field">
        <label className="inspector-field-label">Align</label>
        <div className="inspector-toggle-group">
          {(["start", "center", "end", "stretch"] as const).map((a) => (
            <button
              key={a}
              className={`inspector-toggle-btn${(zoneLayout.align ?? "stretch") === a ? " active" : ""}`}
              onClick={() => setZoneLayout(zone, { align: a })}
            >
              {a === "start" ? "Top" : a === "center" ? "Center" : a === "end" ? "Bottom" : "Stretch"}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Templates accordion - Phase E.3
 *    Collapsible section at the top of the panel. When expanded,
 *    shows a 2x2 grid of mini pattern cards. Clicking one runs the
 *    same conversational DS-prompt flow as the hero pattern cards:
 *    stages a pending template and asks the AI for a DS pick. ── */
function TemplatesAccordion() {
  const [open, setOpen] = useState(false);
  const addMessage = useBuilder((s) => s.addMessage);
  const setPendingTemplateId = useBuilder((s) => s.setPendingTemplateId);
  const setPendingFirstMessage = useBuilder((s) => s.setPendingFirstMessage);
  const currentSessionId = useBuilder((s) => s.currentSessionId);
  const ensureSessionStarted = useBuilder((s) => s.ensureSessionStarted);
  const setSessionTitle = useBuilder((s) => s.setSessionTitle);
  const activeTemplateId = useBuilder((s) => s.activeTemplateId);
  const isGenerating = useBuilder((s) => s.isGenerating);

  const templates: BuilderTemplate[] = TEMPLATE_ORDER.map((id) => BUILDER_TEMPLATES[id]);

  const handleSelect = (tpl: BuilderTemplate) => {
    if (isGenerating) return;
    const article = /^[aeiouAEIOU]/.test(tpl.label) ? "an" : "a";
    setPendingTemplateId(tpl.id);
    setPendingFirstMessage(null);
    addMessage("user", `Build me ${article} ${tpl.label}`);
    addMessage(
      "ai",
      `Great choice - ${article} ${tpl.label} with ${tpl.desc.toLowerCase()}. Which design system should I use?`
    );
    if (!currentSessionId) {
      ensureSessionStarted(titleFromTemplate(tpl.label));
    } else {
      setSessionTitle(titleFromTemplate(tpl.label));
    }
  };

  return (
    <div className="lib-templates">
      <button
        type="button"
        className="lib-templates-head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span
          className={`material-symbols-outlined lib-templates-caret ${open ? "is-open" : ""}`}
          aria-hidden="true"
        >
          chevron_right
        </span>
        <span className="lib-templates-label">Templates</span>
        <span className="lib-templates-count">{templates.length}</span>
        <span className="lib-templates-hint">Swap the whole layout</span>
      </button>

      {open && (
        <div className="lib-templates-grid">
          {templates.map((tpl) => {
            const isActive = tpl.id === activeTemplateId;
            return (
              <button
                key={tpl.id}
                type="button"
                className={`lib-template-card ${isActive ? "is-active" : ""}`}
                onClick={() => handleSelect(tpl)}
                title={`Switch to ${tpl.label}`}
              >
                <div className="lib-template-thumb">
                  <TemplatePreview id={tpl.id as TemplateId} />
                </div>
                <span className="lib-template-label">
                  {tpl.label}
                  {isActive && <span className="lib-template-active-dot" aria-hidden="true" />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Library browser - searchable + grouped by zone ── */
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
            <div className="lib-tile-grid">
              {items.map((bp) => (
                <BlueprintItem key={bp.id} blueprint={bp} zone={zone} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ChartColoursSection (P1.3)

   Inspector section shown only for Highchart blocks. Exposes the
   active DS's 12-slot categorical palette as click-to-apply swatches
   and lets the user pick a custom hex or reset the override.

   Writes to block.props.seriesColors[0] (first-series-only per the
   plan - "make this chart orange" is the common case). Multi-series
   editing and chat recolour land in P1.4.
   ══════════════════════════════════════════════════════════ */
function ChartColoursSection({ block }: { block: { id: string; type: string; props: Record<string, unknown> } }) {
  const designSystem = useBuilder((s) => s.designSystem);
  const updateBlockProps = useBuilder((s) => s.updateBlockProps);
  const updateZoneBlockProps = useBuilder((s) => s.updateZoneBlockProps);
  const selectedBlockZone = useBuilder((s) => s.selectedBlockZone);
  const palette = CATEGORICAL_PALETTES[designSystem];

  const currentOverride = Array.isArray(block.props.seriesColors)
    ? (block.props.seriesColors as unknown[])[0]
    : undefined;
  const activeColor = typeof currentOverride === "string" ? currentOverride : null;

  /* Chart blocks live in the body zone; use updateZoneBlockProps when
     available (covers any zone), fall back to updateBlockProps. */
  const write = (props: Record<string, unknown>) => {
    if (selectedBlockZone && selectedBlockZone !== "body") {
      updateZoneBlockProps(selectedBlockZone, block.id, props);
    } else {
      updateBlockProps(block.id, props);
    }
  };

  const applyFirstSeriesColor = (color: string | null) => {
    if (color === null) {
      write({ seriesColors: undefined });
      return;
    }
    /* Preserve slots 1+ if user already customised multiple series. */
    const existing = Array.isArray(block.props.seriesColors)
      ? (block.props.seriesColors as unknown[])
      : [];
    const next = [...existing];
    next[0] = color;
    write({ seriesColors: next.filter((c) => typeof c === "string") });
  };

  const [customHex, setCustomHex] = useState(activeColor ?? "");

  return (
    <>
      <div className="lib-section-divider" />
      <div className="inspector-section-title">Colours</div>
      <div className="inspector-field">
        <label className="inspector-field-label">
          {designSystem.toUpperCase()} palette
          {activeColor && (
            <button
              type="button"
              className="inspector-chart-reset"
              onClick={() => applyFirstSeriesColor(null)}
              title="Clear the override - chart returns to the full DS palette"
            >
              Reset
            </button>
          )}
        </label>
        <div className="inspector-chart-swatches" role="group" aria-label="Chart colour palette">
          {palette.map((hex, i) => {
            const slot = PALETTE_SLOT_NAMES[i];
            const label = PALETTE_SLOT_LABELS[slot];
            const isActive = activeColor?.toLowerCase() === hex.toLowerCase();
            return (
              <button
                key={hex + i}
                type="button"
                className={`inspector-chart-swatch${isActive ? " is-active" : ""}`}
                style={{ background: hex }}
                onClick={() => applyFirstSeriesColor(hex)}
                title={`${label} · ${hex}`}
                aria-label={`Apply ${label} (${hex}) to first series`}
                aria-pressed={isActive}
              />
            );
          })}
        </div>
      </div>
      <div className="inspector-field">
        <label className="inspector-field-label" htmlFor={`chart-hex-${block.id}`}>
          Custom hex
        </label>
        <div className="inspector-chart-hex-row">
          <input
            id={`chart-hex-${block.id}`}
            type="text"
            className="inspector-chart-hex-input"
            placeholder="#7E6BC4"
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = customHex.trim();
                if (/^#[0-9a-fA-F]{3,8}$/.test(v)) applyFirstSeriesColor(v);
              }
            }}
          />
          <button
            type="button"
            className="inspector-chart-hex-apply"
            onClick={() => {
              const v = customHex.trim();
              if (/^#[0-9a-fA-F]{3,8}$/.test(v)) applyFirstSeriesColor(v);
            }}
            title="Apply custom hex to the first series"
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}
