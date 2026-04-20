"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useBuilder, type Block, type LayoutWidth } from "@/store/useBuilder";
import { SortableBlock } from "./SortableBlock";
import { ComponentRenderer } from "./ComponentRenderer";
import { SwapMenu } from "./SwapMenu";
import { ZoneDropContainer } from "./ZoneDropContainer";
import { ID_TO_BLOCK, ID_TO_MULTI_BLOCKS, BLOCK_TO_ID } from "@/lib/componentMaps";
import { computeItemStyle, deriveColSpan } from "@/lib/layoutResolver";

let blockCounter = 0;
export function makeBlockId() {
  return `block-${++blockCounter}-${Date.now()}`;
}

/* CanvasDropZone replaced by ZoneDropContainer */

/* ── Code Viewer - full-page JSON schema display ── */
export function CodeViewer({ blocks }: { blocks: import("@/store/useBuilder").Block[] }) {
  const headerBlocks = useBuilder((s) => s.headerBlocks);
  const sidebarBlocks = useBuilder((s) => s.sidebarBlocks);
  const footerBlocks = useBuilder((s) => s.footerBlocks);
  const [copied, setCopied] = useState(false);

  const schema = {
    header: headerBlocks.map((b) => ({ id: b.id, type: b.type, props: b.props })),
    sidebar: sidebarBlocks.map((b) => ({ id: b.id, type: b.type, props: b.props })),
    main: blocks.map((b) => ({ id: b.id, type: b.type, props: b.props })),
    footer: footerBlocks.map((b) => ({ id: b.id, type: b.type, props: b.props })),
  };
  const json = JSON.stringify(schema, null, 2);
  const totalBlocks = headerBlocks.length + sidebarBlocks.length + blocks.length + footerBlocks.length;

  const handleCopy = () => {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /* Syntax-highlight tokens (key / string / number / keyword) */
  const highlighted = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(?:[^"\\]|\\.)*")(\s*:)/g,
      '<span class="cv-key">$1</span>$2'
    )
    .replace(
      /: ("(?:[^"\\]|\\.)*")/g,
      ': <span class="cv-string">$1</span>'
    )
    .replace(/: (\d+\.?\d*)/g, ': <span class="cv-number">$1</span>')
    .replace(/: (true|false|null)/g, ': <span class="cv-keyword">$1</span>');

  return (
    <div className="canvas-code-viewer">
      <div className="canvas-code-header">
        <span className="canvas-code-header-dot" style={{ background: "#ff5f57" }} />
        <span className="canvas-code-header-dot" style={{ background: "#febc2e" }} />
        <span className="canvas-code-header-dot" style={{ background: "#28c840" }} />
        <span className="canvas-code-filename">ui-schema.json</span>
        <span className="canvas-code-count">{totalBlocks} block{totalBlocks !== 1 ? "s" : ""}</span>
        <button className="canvas-code-copy-btn" onClick={handleCopy} title="Copy to clipboard">
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
            {copied ? "check" : "content_copy"}
          </span>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="canvas-code-pre">
        <code
          className="canvas-code-body"
          dangerouslySetInnerHTML={{ __html: highlighted || '// No blocks yet - drag components onto the canvas' }}
        />
      </pre>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PreviewCanvas - sortable drop zone for builder blocks.
   DndContext is provided by the parent (CanvasDndProvider
   in PreviewPanel) so that the ComponentLibrary sidebar
   shares the same drag-and-drop context.
   ══════════════════════════════════════════════════════════ */
export function PreviewCanvas() {
  const {
    designSystem, selectedComponents, setSelectedComponents,
    blocks, setBlocks,
    selectedBlockId, setSelectedBlock,
    addMenuOpen, setAddMenuOpen,
    density,
  } = useBuilder();
  /* Read the body zone's container layout via the new store
     slice. The resolver uses this to size every block. */
  const bodyZoneLayout = useBuilder((s) => s.zoneLayouts.body);

  /* ── Local UI state ── */
  const [swapTarget, setSwapTarget] = useState<string | null>(null);

  /* Track whether we initialized from store already */
  const initializedRef = useRef(false);

  /* ── Initialize blocks from selectedComponents on first mount ──
     Skip when `blocks` already has content so rich template-applied
     layouts are preserved (see src/lib/builderTemplates.ts). Without
     this guard, opening the preview for the first time after a
     template apply would rebuild a naive list from selectedComponents. */
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    if (blocks.length > 0) return; // template-applied or restored layout - don't overwrite

    const seen = new Set<string>();
    const initial: Block[] = [];
    for (const compId of selectedComponents) {
      if (seen.has(compId)) continue;
      seen.add(compId);

      /* Compound expansion: some IDs create multiple individual blocks */
      const multiBlocks = ID_TO_MULTI_BLOCKS[compId];
      if (multiBlocks) {
        for (const mb of multiBlocks) {
          initial.push({ id: makeBlockId(), type: mb.type, props: { ...mb.props } });
        }
        continue;
      }

      /* Single block */
      const blockType = ID_TO_BLOCK[compId];
      if (blockType) {
        initial.push({ id: makeBlockId(), type: blockType, props: {} });
      }
    }
    setBlocks(initial);
    // `blocks.length` is read inside to guard template-applied layouts;
    // the initializedRef short-circuits re-runs so adding it here is safe.
  }, [selectedComponents, setBlocks, blocks.length]);

  /* ── Sync blocks back to selectedComponents when blocks change ── */
  const syncToStore = useCallback(
    (updated: Block[]) => {
      setBlocks(updated);
      const ids = updated
        .map((b) => BLOCK_TO_ID[b.type])
        .filter(Boolean) as string[];
      setSelectedComponents(ids);
    },
    [setSelectedComponents, setBlocks]
  );

  /* ── Handlers ── */
  const handleSwap = useCallback(
    (blockId: string, newType: string) => {
      const next = blocks.map((b) =>
        b.id === blockId ? { ...b, type: newType, props: {} } : b
      );
      syncToStore(next);
      setSwapTarget(null);
    },
    [blocks, syncToStore]
  );

  const handleAddBlock = useCallback(
    (type: string) => {
      const newId = makeBlockId();
      const next = [{ id: newId, type, props: {} }, ...blocks];
      syncToStore(next);
      setAddMenuOpen(false);
      setSelectedBlock(newId, "body");
    },
    [blocks, syncToStore, setSelectedBlock, setAddMenuOpen]
  );

  const handleRemoveBlock = useCallback(
    (id: string) => {
      const next = blocks.filter((b) => b.id !== id);
      syncToStore(next);
      if (selectedBlockId === id) setSelectedBlock(null, null);
    },
    [blocks, syncToStore, selectedBlockId, setSelectedBlock]
  );

  /* ── Canvas view (DndContext is provided by parent) ── */
  /* Note: Code view is now rendered at the dashboard level in PreviewPanel */
  return (
    <div
      className={`preview-${designSystem} preview-canvas-root density-${density}`}
      onClick={() => setSelectedBlock(null, null)}
    >
      {/* Add component menu - triggered from toolbar */}
      {addMenuOpen && (
        <div style={{ position: "relative" }}>
          <SwapMenu
            onSelect={handleAddBlock}
            onClose={() => setAddMenuOpen(false)}
          />
        </div>
      )}

      <ZoneDropContainer zoneId="body" blocks={blocks} className="canvas-drop-zone">
        {blocks.map((block) => {
          /* Pull the zone's layout mode from the store via the
             resolver. computeItemStyle handles all width modes
             (fill/auto/px/%/fr) + min/max + colSpan back-compat. */
          const itemStyle = computeItemStyle(block, bodyZoneLayout);
          /* deriveColSpan keeps the legacy colSpan-cycle button
             working via a stable 1|2|3 integer. Sub-phase 4 wires
             the px resize handle on top. */
          const colSpan = deriveColSpan(block);
          return (
          <div
            key={block.id}
            style={itemStyle}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBlock(block.id, "body");
            }}
          >
            <SortableBlock
              id={block.id}
              zone="body"
              isSelected={selectedBlockId === block.id}
              colSpan={colSpan}
              layoutHints={block.layout ? { minWidth: block.layout.minWidth, maxWidth: block.layout.maxWidth } : undefined}
              onColSpanChange={(span) => {
                /* Legacy colSpan write - the resolver auto-translates
                   to width on the next render. The new width handle
                   below bypasses this for continuous resizing. */
                const next = blocks.map((b) =>
                  b.id === block.id ? { ...b, props: { ...b.props, colSpan: span } } : b
                );
                syncToStore(next);
              }}
              onWidthChange={(w) => {
                /* Write the continuous width to block.layout.width so
                   the resolver renders an exact pixel or percent value.
                   Also clear the legacy colSpan to avoid stale values
                   fighting the new width on next mount. */
                const next = blocks.map((b) => {
                  if (b.id !== block.id) return b;
                  const { colSpan: _drop, ...restProps } = b.props;
                  void _drop;
                  return { ...b, layout: { ...(b.layout ?? {}), width: w as LayoutWidth }, props: restProps };
                });
                setBlocks(next);
              }}
              onSwapClick={() =>
                setSwapTarget(swapTarget === block.id ? null : block.id)
              }
              onRemove={() => handleRemoveBlock(block.id)}
            >
              <ComponentRenderer
                type={block.type}
                system={designSystem}
                blockId={block.id}
                {...block.props}
              />
            </SortableBlock>

            {/* Swap menu for this block */}
            {swapTarget === block.id && (
              <SwapMenu
                onSelect={(newType) => handleSwap(block.id, newType)}
                onClose={() => setSwapTarget(null)}
              />
            )}
          </div>
          );
        })}
      </ZoneDropContainer>
    </div>
  );
}
