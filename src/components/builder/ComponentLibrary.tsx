"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  useBuilder,
  resolveDestinationZone,
  normalizePadding,
  normalizeGap,
  type LayoutProps,
  type LayoutWidth,
  type ZoneId,
  type PaddingObject,
  type GapObject,
} from "@/store/useBuilder";
import {
  LIBRARY_BLUEPRINTS,
  SEARCH_ALIASES,
  TYPE_FIELDS,
  LIBRARY_CATEGORY_ORDER,
  categoryFor,
  type LibraryCategory,
} from "@/lib/blockRegistry";
import { MiniPreview } from "./MiniPreview";
import { ScrubNumberField } from "./ScrubNumberField";
import { BUILDER_TEMPLATES, TEMPLATE_ORDER, type BuilderTemplate, type TemplateId } from "@/lib/builderTemplates";
import { TemplatePreview } from "./TemplatePreviews";
import { titleFromTemplate } from "@/lib/sessionTitle";
import { applyTemplateToCanvas } from "@/lib/applyTemplate";
import { ACCENT_PRESETS, ACCENT_KEY_BY_DS } from "@/data/_shared/accentPresets";
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
  const setLibraryHoverZone = useBuilder((s) => s.setLibraryHoverZone);
  const selectedBlockZone = useBuilder((s) => s.selectedBlockZone);
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
    /* Issue #79: clear zone highlight when the click/drag starts so
       dnd-kit's own indicators take over. */
    setLibraryHoverZone(null);
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
      recordRecent(blueprint.type);
    }
  };

  const handleMouseEnter = () => {
    /* Issue #79: preview where the tile would land if clicked, so the
       zone-resolution rule (zoneByType > preferZone > selectedBlockZone
       > body) is visible without explanation. */
    setLibraryHoverZone(resolveDestinationZone(blueprint.type, zone, selectedBlockZone));
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
    setLibraryHoverZone(null);
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
      /* No native `title`: it duplicated the richer HoverPreview popover and
         the OS truncated it ("...or clic"). aria-label keeps the same hint for
         screen readers without rendering a second, clipped tooltip. */
      aria-label={`${blueprint.label}, drag onto canvas or click to add`}
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

  /* Walk top-level blocks PLUS one level of LayoutGroup children
     so nested blocks (inside a Group column) can be inspected too.
     MVP is single-level nesting - no deeper recursion needed. */
  const findSelected = (arr: typeof blocks) => {
    for (const b of arr) {
      if (b.id === selectedBlockId) return b;
      if (b.children) {
        for (const c of b.children) {
          if (c.id === selectedBlockId) return c;
        }
      }
    }
    return undefined;
  };
  const selectedBlock = selectedBlockId
    ? (findSelected(blocks)
      ?? findSelected(headerBlocks)
      ?? findSelected(sidebarBlocks)
      ?? findSelected(footerBlocks))
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
        {/* Two modes, mutually exclusive (#9 PR-2). A selected block puts the
            panel in INSPECT mode (its properties + layout); with no selection
            the panel is in BROWSE mode (templates + library). Previously browse
            rendered underneath the inspector, so editing a block buried it in
            the full library — the clutter the owner flagged. */}
        {selectedBlock && FieldsComponent ? (
          /* Inspector - each section is collapsible so users can hide the ones
             they don't need; state persists per section key in sessionStorage. */
          <div className="inspector-stack">
            {/* Quick-win order (owner QA 2026-06): the COMPONENT'S OWN
                properties lead — that's what users select a block to edit —
                then the frame clusters (Size, then the container's Auto
                layout), then accent + chart colours. Auto layout defaults
                collapsed for LEAF blocks (it edits the container, not the
                block) and its container-only controls (Columns / Distribute)
                are hidden for leaves; selecting a Group column shows the
                full set expanded. */}

            <InspectorSection
              id={`props-${selectedBlock.type}`}
              title={`${selectedBlock.type.replace("Simulated", "")} Properties`}
            >
              <FieldsComponent blockId={selectedBlock.id} />
            </InspectorSection>

            {/* Size — per-block W/H sizing + alignment (Fixed/Hug/Fill labels). */}
            <LayoutSection block={selectedBlock} zone={selectedBlockZone ?? "body"} />

            {/* Auto-layout — container flow (direction / gap / padding / align). */}
            <ZoneLayoutSection
              zone={selectedBlockZone ?? "body"}
              leaf={selectedBlock.type !== "LayoutGroup"}
            />

            {/* Issue #13: per-block accent override. Lets one block diverge
                from the global accent without affecting siblings. */}
            <BlockAccentSection block={selectedBlock} zone={selectedBlockZone ?? "body"} />

            {/* Chart colours - only for Highchart blocks (P1.3). */}
            {selectedBlock.type.startsWith("Highchart") && (
              <ChartColoursSection block={selectedBlock} />
            )}
          </div>
        ) : (
          <>
            {/* Templates accordion - swap the entire layout mid-flow without
                returning to the empty state. 2x2 grid of mini template cards. */}
            <TemplatesAccordion />

            {/* Library - grouped by zone, searchable. Each blueprint can be
                dragged onto its preferred zone (drop handling allows any zone). */}
            <LibraryBrowser />
          </>
        )}
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

  /* Numeric-only part of a LayoutWidth token, for editing. */
  const parseWidthValue = (w: LayoutWidth | undefined): string => {
    if (w === undefined || w === "fill" || w === "auto") return "";
    if (typeof w === "number") return String(w);
    return w.replace(/(px|%|fr)$/, "");
  };

  /* Which canonical preset the current width matches. The ⅓/⅔
     percentages mirror the resolver's colSpan mapping so a preset
     click reproduces the legacy 1/2/3 widths exactly. null = a custom
     value; an undefined width resolves to "fill" (the row-mode default). */
  const w = layout.width;

  /* Width sizing mode derived from the stored LayoutWidth union (P1 is
     visual-only — never rename the store values): fill/undefined → Fill,
     auto → Hug, any explicit px/%/fr → Fixed. */
  const sizeMode: "fixed" | "hug" | "fill" =
    w === undefined || w === "fill" ? "fill"
    : w === "auto" ? "hug"
    : "fixed";

  /* Custom value + unit for the Fixed case. The unit is stateful so the
     dropdown reflects px vs % before a value is typed; re-seeds per block. */
  const customIsPx = typeof w === "number" || (typeof w === "string" && w.endsWith("px"));
  const [customUnit, setCustomUnit] = useState<"px" | "%">(customIsPx ? "px" : "%");
  useEffect(() => {
    setCustomUnit(customIsPx ? "px" : "%");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id]);
  const customValue = sizeMode === "fixed" ? parseWidthValue(w) : "";

  const applyPreset = (value: string) =>
    updateBlockLayout(zone, block.id, { width: value as LayoutWidth });
  const applyCustom = (value: string, unit: "px" | "%") => {
    const trimmed = value.trim();
    if (trimmed === "") return; // empty input: leave the width unchanged
    updateBlockLayout(zone, block.id, { width: `${trimmed}${unit}` as LayoutWidth });
  };

  const applySizeMode = (mode: "fixed" | "hug" | "fill") => {
    if (mode === "fill") return applyPreset("fill");
    if (mode === "hug") return applyPreset("auto");
    // Fixed: keep an existing explicit value; otherwise seed a px default.
    if (sizeMode !== "fixed") applyPreset("320px");
  };

  /* Figma-style W dropdown: Fill / Hug / px / % in one caret — "px"/"%"
     imply Fixed, folding the old separate mode-segmented + unit-toggle into
     a single control. */
  const applyWMode = (v: string) => {
    if (v === "fill") return applySizeMode("fill");
    if (v === "hug") return applySizeMode("hug");
    const unit: "px" | "%" = v === "%" ? "%" : "px";
    setCustomUnit(unit);
    if (sizeMode !== "fixed") applyPreset(unit === "%" ? "50%" : "320px");
    else if (customValue !== "") applyCustom(customValue, unit);
  };
  const wModeValue = sizeMode === "fill" ? "fill" : sizeMode === "hug" ? "hug" : customUnit;

  /* HEIGHT (counter-axis) — P3. Same Fixed/Hug/Fill labels as W, writing the
     existing LayoutWidth union to `layout.height`:
       Fixed → a px value (typed Custom H px, or a seeded default)
       Hug   → "auto" / undefined (content-driven)
       Fill  → "fill"
     undefined height = Hug (the implicit content-driven default), so an
     un-set block shows "Hug" active and renders exactly as pre-P3. */
  const h = layout.height;
  const heightMode: "fixed" | "hug" | "fill" =
    h === undefined || h === "auto" ? "hug"
    : h === "fill" ? "fill"
    : "fixed";

  const applyHeightMode = (mode: "fixed" | "hug" | "fill") => {
    if (mode === "hug") return updateBlockLayout(zone, block.id, { height: undefined });
    if (mode === "fill") return updateBlockLayout(zone, block.id, { height: "fill" as LayoutWidth });
    // Fixed: keep an existing explicit value; otherwise seed a px default.
    if (heightMode !== "fixed") updateBlockLayout(zone, block.id, { height: "240px" as LayoutWidth });
  };

  /* Custom height value + unit (mirrors the width custom field). Height
     defaults to px since blocks live in a vertically-flowing canvas. */
  const [heightUnit, setHeightUnit] = useState<"px" | "%">(
    typeof h === "string" && h.endsWith("%") ? "%" : "px",
  );
  useEffect(() => {
    setHeightUnit(typeof h === "string" && h.endsWith("%") ? "%" : "px");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id]);
  const heightCustomValue = heightMode === "fixed" ? parseWidthValue(h) : "";
  const applyCustomHeight = (value: string, unit: "px" | "%") => {
    const trimmed = value.trim();
    if (trimmed === "") return;
    updateBlockLayout(zone, block.id, { height: `${trimmed}${unit}` as LayoutWidth });
  };
  const applyHMode = (v: string) => {
    if (v === "fill") return applyHeightMode("fill");
    if (v === "hug") return applyHeightMode("hug");
    const unit: "px" | "%" = v === "%" ? "%" : "px";
    setHeightUnit(unit);
    if (heightMode !== "fixed") updateBlockLayout(zone, block.id, { height: (unit === "%" ? "50%" : "240px") as LayoutWidth });
    else if (heightCustomValue !== "") applyCustomHeight(heightCustomValue, unit);
  };
  const hModeValue = heightMode === "fill" ? "fill" : heightMode === "hug" ? "hug" : heightUnit;

  return (
    <InspectorSection id="layout" title="Size">
      {/* Dimensions — W and H side by side, each a value field + a
          Fill / Hug / px / % dropdown (Figma-style). Folds the old six
          stacked segmented + custom-value rows into two cells; the dropdown
          carries both the sizing mode AND the unit ("px"/"%" imply Fixed). */}
      <div className="inspector-field inspector-field-row">
        <div className="inspector-dim-cell">
          <ScrubNumberField
            layout="inline"
            glyph="W"
            value={customValue}
            placeholder={sizeMode === "fill" ? "Fill" : sizeMode === "hug" ? "Hug" : customUnit === "%" ? "%" : "px"}
            min={customUnit === "%" ? 1 : 0}
            max={customUnit === "%" ? 100 : undefined}
            ariaLabel="Width value"
            onValueChange={(v) => applyCustom(v, customUnit)}
          />
          <select
            className="inspector-select inspector-dim-mode"
            aria-label="Width sizing mode"
            value={wModeValue}
            onChange={(e) => applyWMode(e.target.value)}
          >
            <option value="fill">Fill</option>
            <option value="hug">Hug</option>
            <option value="px">px</option>
            <option value="%">%</option>
          </select>
        </div>
        <div className="inspector-dim-cell">
          <ScrubNumberField
            layout="inline"
            glyph="H"
            value={heightCustomValue}
            placeholder={heightMode === "fill" ? "Fill" : heightMode === "hug" ? "Hug" : heightUnit === "%" ? "%" : "px"}
            min={heightUnit === "%" ? 1 : 0}
            max={heightUnit === "%" ? 100 : undefined}
            ariaLabel="Height value"
            onValueChange={(v) => applyCustomHeight(v, heightUnit)}
          />
          <select
            className="inspector-select inspector-dim-mode"
            aria-label="Height sizing mode"
            value={hModeValue}
            onChange={(e) => applyHMode(e.target.value)}
          >
            <option value="fill">Fill</option>
            <option value="hug">Hug</option>
            <option value="px">px</option>
            <option value="%">%</option>
          </select>
        </div>
      </div>

      {/* Align-self on the cross axis (core control — kept visible) */}
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

      {/* Advanced sizing — collapsed by default so Layout leads with its
          core controls (Width + Align). */}
      <InspectorSubgroup id="layout-advanced" title="Advanced">
        {/* Min / max width (px). Empty string clears the constraint. */}
        <div className="inspector-field inspector-field-row">
          <div style={{ flex: 1 }}>
            <ScrubNumberField
              layout="stacked"
              label="Min width (px)"
              value={parseWidthValue(layout.minWidth)}
              min={0}
              placeholder="—"
              onValueChange={(v) =>
                updateBlockLayout(zone, block.id, {
                  minWidth: v === "" ? undefined : (`${v}px` as LayoutWidth),
                })
              }
            />
          </div>
          <div style={{ flex: 1 }}>
            <ScrubNumberField
              layout="stacked"
              label="Max width (px)"
              value={parseWidthValue(layout.maxWidth)}
              min={0}
              placeholder="—"
              onValueChange={(v) =>
                updateBlockLayout(zone, block.id, {
                  maxWidth: v === "" ? undefined : (`${v}px` as LayoutWidth),
                })
              }
            />
          </div>
        </div>

        {/* Min / max height (px). Empty string clears the constraint. */}
        <div className="inspector-field inspector-field-row">
          <div style={{ flex: 1 }}>
            <ScrubNumberField
              layout="stacked"
              label="Min height (px)"
              value={parseWidthValue(layout.minHeight)}
              min={0}
              placeholder="—"
              onValueChange={(v) =>
                updateBlockLayout(zone, block.id, {
                  minHeight: v === "" ? undefined : (`${v}px` as LayoutWidth),
                })
              }
            />
          </div>
          <div style={{ flex: 1 }}>
            <ScrubNumberField
              layout="stacked"
              label="Max height (px)"
              value={parseWidthValue(layout.maxHeight)}
              min={0}
              placeholder="—"
              onValueChange={(v) =>
                updateBlockLayout(zone, block.id, {
                  maxHeight: v === "" ? undefined : (`${v}px` as LayoutWidth),
                })
              }
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

        {/* Margin - single-value px; applied to all sides. */}
        <div className="inspector-field">
          <ScrubNumberField
            layout="stacked"
            label="Margin (px)"
            value={layout.margin ?? ""}
            min={0}
            placeholder="0"
            onValueChange={(v) =>
              updateBlockLayout(zone, block.id, { margin: v === "" ? undefined : Number(v) })
            }
          />
        </div>
      </InspectorSubgroup>
    </InspectorSection>
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
function ZoneLayoutSection({ zone, leaf = false }: { zone: ZoneId; leaf?: boolean }) {
  const zoneLayout = useBuilder((s) => s.zoneLayouts[zone]);
  const setZoneLayout = useBuilder((s) => s.setZoneLayout);
  const label = zone.charAt(0).toUpperCase() + zone.slice(1);

  /* P5 padding — normalize the stored value (legacy number | {t,r,b,l}) to the
     object form for the per-side inputs. "Linked" mode (all four sides equal)
     writes back a single NUMBER so saved projects stay in the compact legacy
     shape until the user actually splits a side. */
  const pad: PaddingObject = normalizePadding(zoneLayout.padding) ?? { t: 0, r: 0, b: 0, l: 0 };
  const padLinked = pad.t === pad.r && pad.r === pad.b && pad.b === pad.l;
  const [padUnlinked, setPadUnlinked] = useState(false);
  const showPerSide = padUnlinked || !padLinked;
  const writeLinkedPad = (v: number) => setZoneLayout(zone, { padding: Math.max(0, v) });
  const writeSide = (side: keyof PaddingObject, v: number) =>
    setZoneLayout(zone, { padding: { ...pad, [side]: Math.max(0, v) } });

  /* P5 gap — normalize to {row,col}. "Linked" (row === col) writes back a
     single NUMBER (legacy compact shape); splitting writes the object. */
  const gap: GapObject = normalizeGap(zoneLayout.gap) ?? { row: 0, col: 0 };
  const gapLinked = gap.row === gap.col;
  const [gapUnlinked, setGapUnlinked] = useState(false);
  const showGapSplit = gapUnlinked || !gapLinked;
  const writeLinkedGap = (v: number) => setZoneLayout(zone, { gap: Math.max(0, v) });
  const writeGapAxis = (axis: keyof GapObject, v: number) =>
    setZoneLayout(zone, { gap: { ...gap, [axis]: Math.max(0, v) } });

  const numFromEvent = (raw: string): number => Math.max(0, Number(raw) || 0);

  return (
    /* Figma names this cluster "Auto layout" (direction / gap / padding /
       align). We keep the store model ('stack'|'row'|'grid') untouched —
       these are LABELS only. The zone name is shown as a sub-hint so it's
       clear which container ({Header}/{Body}/…) this affects.
       LEAF blocks (anything but a Group column) collapse it by default —
       it edits the container, not the selected block — and hide the
       container-only Columns / Distribute controls. */
    <InspectorSection id={`zone-layout-${zone}`} title="Auto layout" defaultOpen={!leaf}>
      {/* Direction - stack / row / grid */}
      <div className="inspector-field">
        <label className="inspector-field-label">
          <span>Direction</span>
          <span className="inspector-zone-hint">{label}</span>
        </label>
        <div className="inspector-toggle-group" role="radiogroup" aria-label="Auto-layout direction">
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

      {/* Grid column count - only shown in Grid mode, container selections only */}
      {zoneLayout.mode === "grid" && !leaf && (
        <div className="inspector-field">
          <ScrubNumberField
            layout="stacked"
            label="Columns"
            min={1}
            max={12}
            value={zoneLayout.columns ?? 3}
            onValueChange={(v) => setZoneLayout(zone, { columns: Math.max(1, Math.min(12, Number(v) || 3)) })}
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

      {/* Gap — Figma-style H/V gap. Linked = one value (legacy number shape);
          unlinked splits into row (vertical / between rows) + col (horizontal /
          between columns). The link toggle is keyboard-operable + announces its
          state via aria-pressed. */}
      <div className="inspector-field">
        <label className="inspector-field-label">
          <span>Gap (px)</span>
          <button
            type="button"
            className={`inspector-link-toggle${showGapSplit ? " is-unlinked" : ""}`}
            aria-pressed={showGapSplit}
            aria-label={showGapSplit ? "Link row + column gap to one value" : "Unlink row + column gap"}
            title={showGapSplit ? "Link H/V gap" : "Split into H + V gap"}
            onClick={() => {
              if (showGapSplit) {
                /* Re-link: collapse to a single value (use col / horizontal). */
                writeLinkedGap(gap.col);
                setGapUnlinked(false);
              } else {
                setGapUnlinked(true);
              }
            }}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {showGapSplit ? "link_off" : "link"}
            </span>
          </button>
        </label>
        {showGapSplit ? (
          <div className="inspector-pad-grid inspector-pad-grid--2">
            <ScrubNumberField
              layout="cell"
              glyph="V"
              inputClassName="inspector-pad-input"
              min={0}
              ariaLabel="Vertical gap (between rows) in px"
              value={gap.row}
              onValueChange={(v) => writeGapAxis("row", numFromEvent(v))}
            />
            <ScrubNumberField
              layout="cell"
              glyph="H"
              inputClassName="inspector-pad-input"
              min={0}
              ariaLabel="Horizontal gap (between columns) in px"
              value={gap.col}
              onValueChange={(v) => writeGapAxis("col", numFromEvent(v))}
            />
          </div>
        ) : (
          <ScrubNumberField
            layout="inline"
            glyph="↔"
            min={0}
            ariaLabel="Gap between children in px"
            value={gap.row}
            onValueChange={(v) => writeLinkedGap(numFromEvent(v))}
          />
        )}
      </div>

      {/* Padding — Figma-style 4-side control. Linked = one value (legacy number
          shape); unlinked splits into T/R/B/L. */}
      <div className="inspector-field">
        <label className="inspector-field-label">
          <span>Padding (px)</span>
          <button
            type="button"
            className={`inspector-link-toggle${showPerSide ? " is-unlinked" : ""}`}
            aria-pressed={showPerSide}
            aria-label={showPerSide ? "Link all sides to one padding value" : "Unlink padding sides"}
            title={showPerSide ? "Link all sides" : "Set each side"}
            onClick={() => {
              if (showPerSide) {
                /* Re-link: collapse to a single value (use top). */
                writeLinkedPad(pad.t);
                setPadUnlinked(false);
              } else {
                setPadUnlinked(true);
              }
            }}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {showPerSide ? "link_off" : "link"}
            </span>
          </button>
        </label>
        {showPerSide ? (
          <div className="inspector-pad-grid">
            {([
              ["t", "T", "Top padding in px"],
              ["r", "R", "Right padding in px"],
              ["b", "B", "Bottom padding in px"],
              ["l", "L", "Left padding in px"],
            ] as const).map(([side, glyph, hint]) => (
              <ScrubNumberField
                key={side}
                layout="cell"
                glyph={glyph}
                cellTitle={hint}
                inputClassName="inspector-pad-input"
                min={0}
                ariaLabel={hint}
                value={pad[side]}
                onValueChange={(v) => writeSide(side, numFromEvent(v))}
              />
            ))}
          </div>
        ) : (
          <ScrubNumberField
            layout="inline"
            glyph="↔"
            min={0}
            ariaLabel="Padding on all sides in px"
            value={pad.t}
            onValueChange={(v) => writeLinkedPad(numFromEvent(v))}
          />
        )}
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

      {/* Distribute - main-axis distribution (Figma "Auto layout" packing row).
          Writes ZoneLayout.justify. `start` is the default (unset = start), so
          picking Start clears the value to keep saved projects lean + back-
          compatible. Maps to justify-content (flex) / justify-items (grid) in
          the resolver + threads into export via the P4 export twin.
          Container-only: hidden for leaf selections. */}
      {!leaf && (
      <div className="inspector-field">
        <label className="inspector-field-label">Distribute</label>
        <div className="inspector-toggle-group" role="radiogroup" aria-label="Auto-layout distribution">
          {([
            ["start", "Start", "Pack children to the start of the main axis (default)"],
            ["center", "Center", "Center children along the main axis"],
            ["end", "End", "Pack children to the end of the main axis"],
            ["space-between", "Between", "Spread children with equal space between them"],
          ] as const).map(([v, lbl, hint]) => {
            const active = (zoneLayout.justify ?? "start") === v;
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={active}
                className={`inspector-toggle-btn${active ? " active" : ""}`}
                onClick={() => setZoneLayout(zone, { justify: v === "start" ? undefined : v })}
                title={hint}
              >
                {lbl}
              </button>
            );
          })}
        </div>
      </div>
      )}
    </InspectorSection>
  );
}

/* ── Templates accordion - Phase E.3
 *    Collapsible section at the top of the panel. When expanded,
 *    shows a 2x2 grid of mini pattern cards. Clicking one applies that
 *    template to the canvas IMMEDIATELY using the active design system
 *    (shared applyTemplateToCanvas path with the wizard); the DS can be
 *    changed afterward from the preview-bar dropdown. ── */
function TemplatesAccordion() {
  const [open, setOpen] = useState(false);
  const addMessage = useBuilder((s) => s.addMessage);
  const designSystem = useBuilder((s) => s.designSystem);
  const currentSessionId = useBuilder((s) => s.currentSessionId);
  const ensureSessionStarted = useBuilder((s) => s.ensureSessionStarted);
  const setSessionTitle = useBuilder((s) => s.setSessionTitle);
  const activeTemplateId = useBuilder((s) => s.activeTemplateId);
  const isGenerating = useBuilder((s) => s.isGenerating);

  const templates: BuilderTemplate[] = TEMPLATE_ORDER.map((id) => BUILDER_TEMPLATES[id]);

  /* Apply the template to the canvas IMMEDIATELY using the active design
     system (shared path with the wizard). Previously this only staged a
     pending intent + asked for a DS, so the canvas "changed nothing" on
     click. The DS can still be changed afterward from the preview-bar
     dropdown. */
  const handleSelect = (tpl: BuilderTemplate) => {
    if (isGenerating) return;
    const article = /^[aeiouAEIOU]/.test(tpl.label) ? "an" : "a";
    if (!currentSessionId) {
      ensureSessionStarted(titleFromTemplate(tpl.label));
    } else {
      setSessionTitle(titleFromTemplate(tpl.label));
    }
    applyTemplateToCanvas(tpl, designSystem);
    addMessage("user", `Build me ${article} ${tpl.label}`);
    addMessage("ai", tpl.aiResponse);
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

/* ── Reusable inspector section ──
   Every "{Type} Properties" / "Layout" / "Zone Layout" / "Colours"
   header is now a clickable toggle with caret + aria-expanded. State
   per-key in sessionStorage so users' preferred open/closed choices
   persist while they work. Default open on first paint. */
const INSPECTOR_EXPANDED_KEY = "dh-inspector-expanded";

function readInspectorExpanded(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(INSPECTOR_EXPANDED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/* Issue #13: per-block accent override section. Mirrors the
   SettingsPanel accent presets but writes to the block's own
   `colorOverrides` instead of the global one. Reset link clears the
   per-block value so the block re-inherits the global accent. */
function BlockAccentSection({
  block,
  zone,
}: {
  block: { id: string; colorOverrides?: Record<string, string> };
  zone: ZoneId;
}) {
  const designSystem = useBuilder((s) => s.designSystem);
  const setBlockColorOverride = useBuilder((s) => s.setBlockColorOverride);
  const resetBlockColorOverride = useBuilder((s) => s.resetBlockColorOverride);
  const accentKey = ACCENT_KEY_BY_DS[designSystem];
  const current = block.colorOverrides?.[accentKey];

  return (
    <InspectorSection id={`accent-${block.id}`} title="Accent" defaultOpen={Boolean(current)}>
      <div className="color-row">
        <span className="color-label">{current ? "Override" : "Inherits global"}</span>
        {current && (
          <button
            type="button"
            className="settings-reset"
            onClick={() => resetBlockColorOverride(zone, block.id, accentKey)}
            title="Reset to global accent"
          >
            Reset
          </button>
        )}
      </div>
      <div className="accent-preset-row" role="radiogroup" aria-label="Block accent preset">
        {ACCENT_PRESETS[designSystem].map((p) => {
          const isActive = (current ?? "").toLowerCase() === p.hex.toLowerCase();
          return (
            <button
              key={p.hex}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={p.label}
              title={p.label}
              className={`accent-preset-swatch${isActive ? " is-active" : ""}`}
              style={{ background: p.hex }}
              onClick={() => setBlockColorOverride(zone, block.id, accentKey, p.hex)}
            />
          );
        })}
        <input
          type="color"
          className="color-swatch"
          value={current || "#7c3aed"}
          onChange={(e) => setBlockColorOverride(zone, block.id, accentKey, e.target.value)}
          aria-label="Custom block accent"
        />
      </div>
    </InspectorSection>
  );
}

function InspectorSection({
  id,
  title,
  defaultOpen = true,
  children,
}: {
  id: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpenState] = useState<boolean>(() => {
    const saved = readInspectorExpanded();
    return id in saved ? saved[id] : defaultOpen;
  });
  const setOpen = (v: boolean) => {
    setOpenState(v);
    try {
      const saved = readInspectorExpanded();
      saved[id] = v;
      sessionStorage.setItem(INSPECTOR_EXPANDED_KEY, JSON.stringify(saved));
    } catch { /* private mode */ }
  };
  return (
    <div className="inspector-section">
      <button
        type="button"
        className="inspector-section-head"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
      >
        <span className="inspector-section-title-text">{title}</span>
        <span
          className={`material-symbols-outlined inspector-section-caret${open ? " is-open" : ""}`}
          aria-hidden="true"
        >
          chevron_right
        </span>
      </button>
      {open && (
        <div id={`${id}-panel`} className="inspector-section-body">
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Inspector sub-group ──
   A lighter, nested collapsible used INSIDE a section to tuck advanced
   fields away (e.g. Layout's min/max/grow/margin) so the section leads
   with its core controls. Same sessionStorage-backed expand state as
   InspectorSection; distinct visual (indented, smaller header). Defaults
   to collapsed. */
function InspectorSubgroup({
  id,
  title,
  defaultOpen = false,
  children,
}: {
  id: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpenState] = useState<boolean>(() => {
    const saved = readInspectorExpanded();
    return id in saved ? saved[id] : defaultOpen;
  });
  const setOpen = (v: boolean) => {
    setOpenState(v);
    try {
      const saved = readInspectorExpanded();
      saved[id] = v;
      sessionStorage.setItem(INSPECTOR_EXPANDED_KEY, JSON.stringify(saved));
    } catch { /* private mode */ }
  };
  return (
    <div className="inspector-subgroup">
      <button
        type="button"
        className="inspector-subgroup-head"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
      >
        <span
          className={`material-symbols-outlined inspector-subgroup-caret${open ? " is-open" : ""}`}
          aria-hidden="true"
        >
          chevron_right
        </span>
        <span className="inspector-subgroup-title">{title}</span>
      </button>
      {open && (
        <div id={`${id}-panel`} className="inspector-subgroup-body">
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Reusable category accordion header ──
   Button + icon + label + count + caret. Matches TemplatesAccordion's
   interaction shape so the whole Library Browser feels consistent. */
function CollapsibleGroup({
  id,
  icon,
  label,
  count,
  hint,
  open,
  onToggle,
  children,
}: {
  id: string;
  icon: string;
  label: string;
  count: number;
  hint?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="lib-category">
      <button
        type="button"
        className="lib-category-head"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
      >
        <span className="material-symbols-outlined lib-category-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="lib-category-label">{label}</span>
        <span className="lib-category-count">{count}</span>
        <span
          className={`material-symbols-outlined lib-category-caret${open ? " is-open" : ""}`}
          aria-hidden="true"
        >
          chevron_right
        </span>
      </button>
      {open && (
        <div id={`${id}-panel`} className="lib-category-panel" role="region" aria-label={label}>
          {hint && <div className="lib-zone-hint">{hint}</div>}
          {children}
        </div>
      )}
    </div>
  );
}

/* Default expand state for category accordions — all open on first
   paint, so users see the full palette until they choose to collapse.
   Persisted per-key to sessionStorage. */
const LIB_EXPANDED_STORAGE_KEY = "dh-lib-expanded";

function readExpanded(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const saved = sessionStorage.getItem(LIB_EXPANDED_STORAGE_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/* Recently-used blueprint types — most-recent first, capped at 6.
   Persisted to sessionStorage (mirrors the dh-lib-expanded pattern) so
   the strip survives panel re-mounts within a session but resets per
   tab, matching the rest of the builder's session-scoped memory. */
const LIB_RECENTS_STORAGE_KEY = "dh-lib-recents";
const LIB_RECENTS_MAX = 6;

function readRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = sessionStorage.getItem(LIB_RECENTS_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

/* Push `type` to the front of the recents list (de-duped, capped).
   Dispatches a window event so a mounted LibraryBrowser can re-read
   without prop drilling — the click-to-add path lives in BlueprintItem,
   which has no direct handle on the browser's state. */
function recordRecent(type: string) {
  if (typeof window === "undefined") return;
  try {
    const next = [type, ...readRecents().filter((t) => t !== type)].slice(0, LIB_RECENTS_MAX);
    sessionStorage.setItem(LIB_RECENTS_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("dh-lib-recents-change"));
  } catch {
    /* private mode / quota */
  }
}

/* ── Library browser — searchable, grouped by zone, body zone sub-
   grouped by semantic category with expand/collapse accordions.
   Search is sticky at the top; when a query is active, categories
   with matches auto-expand and the rest collapse without touching
   the user's saved state. */
function LibraryBrowser() {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>(readExpanded);
  const [recents, setRecents] = useState<string[]>(readRecents);
  const searchRef = useRef<HTMLInputElement | null>(null);

  /* Keep the recents strip in sync with click-to-add events fired from
     BlueprintItem (which can't reach this component's state directly). */
  useEffect(() => {
    const sync = () => setRecents(readRecents());
    window.addEventListener("dh-lib-recents-change", sync);
    return () => window.removeEventListener("dh-lib-recents-change", sync);
  }, []);

  /* Press "/" anywhere (outside a text field) to jump to the search
     box — matches the placeholder hint and common builder shortcuts. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const persistExpanded = (next: Record<string, boolean>) => {
    setExpanded(next);
    try {
      sessionStorage.setItem(LIB_EXPANDED_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* private mode / quota */
    }
  };

  const toggleCategory = (key: string) => {
    /* Toggle writes the explicit value (true/false) rather than
       inverting from expanded[key] when that slot is undefined —
       undefined currently renders as "open" via the defaulting
       below, and the user's first click should always collapse. */
    const current = expanded[key] !== false;
    persistExpanded({ ...expanded, [key]: !current });
  };

  const q = query.trim().toLowerCase();
  const hasQuery = q.length > 0;

  const grouped = useMemo(() => {
    const groups: Record<LibraryZone, typeof LIBRARY_BLUEPRINTS> = {
      body: [], header: [], sidebar: [], footer: [],
    };
    for (const bp of LIBRARY_BLUEPRINTS) {
      if (
        q &&
        !bp.label.toLowerCase().includes(q) &&
        !bp.type.toLowerCase().includes(q) &&
        !(SEARCH_ALIASES[bp.type] ?? []).some((a) => a.includes(q))
      ) continue;
      const zone = zoneForType(bp.type);
      groups[zone].push(bp);
    }
    return groups;
  }, [q]);

  /* Bucket the body zone by semantic category. Anything without a
     category mapping falls into `misc` and renders last. */
  const bodyByCategory = useMemo(() => {
    const map = new Map<LibraryCategory, typeof LIBRARY_BLUEPRINTS>();
    for (const cat of LIBRARY_CATEGORY_ORDER) map.set(cat.key, []);
    const misc: typeof LIBRARY_BLUEPRINTS = [];
    for (const bp of grouped.body) {
      const cat = categoryFor(bp.type);
      if (cat && map.has(cat)) {
        map.get(cat)!.push(bp);
      } else {
        misc.push(bp);
      }
    }
    return { map, misc };
  }, [grouped.body]);

  const totalVisible = grouped.body.length + grouped.header.length + grouped.sidebar.length + grouped.footer.length;

  /* Is a category visually open right now?
     - When searching: open iff it has matches (ignores saved state)
     - Otherwise: saved state, defaulting to true (open) */
  const isCategoryOpen = (key: string, itemCount: number) => {
    if (hasQuery) return itemCount > 0;
    return expanded[key] !== false;
  };

  /* Every category key that can render at full inventory (no query),
     so Collapse-all / Expand-all writes them in one shot. */
  const allCategoryKeys = useMemo(() => {
    const keys = LIBRARY_CATEGORY_ORDER.map((c) => c.key as string);
    keys.push("misc");
    return keys;
  }, []);

  /* True when at least one category is currently open (so the toggle
     offers Collapse-all); flips to Expand-all once everything is shut. */
  const anyCategoryOpen = allCategoryKeys.some((k) => expanded[k] !== false);

  const setAllCategories = (open: boolean) => {
    const next = { ...expanded };
    for (const k of allCategoryKeys) next[k] = open;
    persistExpanded(next);
  };

  return (
    <div className="lib-browser">
      {/* Sticky search input — pins to top of .lib-body while the
          user scrolls through categories. The inner .lib-search-field
          anchors the icon + clear button to the input itself, not the
          padded sticky band, so the magnifier sits inside the box. */}
      <div className="lib-search lib-search-sticky">
        <label className="dh-visually-hidden" htmlFor="lib-search-input">Search component library</label>
        <div className="lib-search-field">
          <span className="material-symbols-outlined lib-search-icon" aria-hidden="true">search</span>
          <input
            id="lib-search-input"
            ref={searchRef}
            type="search"
            className="lib-search-input"
            placeholder="Search components  (press /)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-describedby={hasQuery ? "lib-search-count" : undefined}
          />
          {query && (
            <button
              type="button"
              className="lib-search-clear"
              onClick={() => { setQuery(""); searchRef.current?.focus(); }}
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 14 }}>close</span>
            </button>
          )}
        </div>
        {!hasQuery && (
          <div className="lib-search-row">
            <button
              type="button"
              className="lib-collapse-toggle"
              onClick={() => setAllCategories(!anyCategoryOpen)}
            >
              {anyCategoryOpen ? "Collapse all" : "Expand all"}
            </button>
          </div>
        )}
      </div>

      {hasQuery && totalVisible > 0 && (
        <span id="lib-search-count" className="lib-search-count" role="status" aria-live="polite">
          {totalVisible} result{totalVisible === 1 ? "" : "s"}
        </span>
      )}

      {totalVisible === 0 && (
        <div className="lib-empty">No components match &ldquo;{query}&rdquo;.</div>
      )}

      {/* Recently used — click-to-re-add the last handful of components.
          Hidden while searching and when the session has no recents. */}
      {!hasQuery && (() => {
        const recentBlueprints = recents
          .map((type) => LIBRARY_BLUEPRINTS.find((bp) => bp.type === type))
          .filter((bp): bp is (typeof LIBRARY_BLUEPRINTS)[number] => Boolean(bp));
        if (recentBlueprints.length === 0) return null;
        return (
          <div className="lib-zone-group">
            <div className="lib-zone-head">
              <span className="material-symbols-outlined lib-zone-icon" aria-hidden="true">history</span>
              <span className="lib-zone-label">Recently used</span>
              <span className="lib-zone-count">{recentBlueprints.length}</span>
            </div>
            <div className="lib-tile-grid">
              {recentBlueprints.map((bp) => (
                <BlueprintItem key={`recent-${bp.id}`} blueprint={bp} zone={zoneForType(bp.type)} />
              ))}
            </div>
          </div>
        );
      })()}

      {/* Body zone — sub-grouped by category, each collapsible */}
      {grouped.body.length > 0 && (
        <div className="lib-zone-group">
          <div className="lib-zone-head">
            <span className="material-symbols-outlined lib-zone-icon" aria-hidden="true">
              {ZONE_LABELS.body.icon}
            </span>
            <span className="lib-zone-label">{ZONE_LABELS.body.label}</span>
            <span className="lib-zone-count">{grouped.body.length}</span>
          </div>
          <div className="lib-zone-hint">{ZONE_LABELS.body.hint}</div>
          {LIBRARY_CATEGORY_ORDER.map((cat) => {
            const items = bodyByCategory.map.get(cat.key) ?? [];
            if (items.length === 0) return null;
            const open = isCategoryOpen(cat.key, items.length);
            return (
              <CollapsibleGroup
                key={cat.key}
                id={`lib-cat-${cat.key}`}
                icon={cat.icon}
                label={cat.label}
                count={items.length}
                open={open}
                onToggle={() => toggleCategory(cat.key)}
              >
                <div className="lib-tile-grid">
                  {items.map((bp) => (
                    <BlueprintItem key={bp.id} blueprint={bp} zone="body" />
                  ))}
                </div>
              </CollapsibleGroup>
            );
          })}
          {bodyByCategory.misc.length > 0 && (
            <CollapsibleGroup
              id="lib-cat-misc"
              icon="more_horiz"
              label="Other"
              count={bodyByCategory.misc.length}
              open={isCategoryOpen("misc", bodyByCategory.misc.length)}
              onToggle={() => toggleCategory("misc")}
            >
              <div className="lib-tile-grid">
                {bodyByCategory.misc.map((bp) => (
                  <BlueprintItem key={bp.id} blueprint={bp} zone="body" />
                ))}
              </div>
            </CollapsibleGroup>
          )}
        </div>
      )}

      {/* Non-body zones — 1–2 items each, rendered flat (sub-grouping
          would be noise at this scale). */}
      {(["header", "sidebar", "footer"] as LibraryZone[]).map((zone) => {
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
    <InspectorSection id="chart-colours" title="Colours">
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
    </InspectorSection>
  );
}
