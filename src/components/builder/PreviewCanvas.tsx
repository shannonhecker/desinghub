"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useBuilder, type Block } from "@/store/useBuilder";
import { SortableBlock } from "./SortableBlock";
import { ComponentRenderer } from "./ComponentRenderer";
import { SwapMenu } from "./SwapMenu";
import { ID_TO_BLOCK, BLOCK_TO_ID } from "@/lib/componentMaps";

let blockCounter = 0;
export function makeBlockId() {
  return `block-${++blockCounter}-${Date.now()}`;
}

/* ── Droppable canvas wrapper ── */
function CanvasDropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-drop-zone" });
  return (
    <div
      ref={setNodeRef}
      className={`canvas-drop-zone${isOver ? " is-over" : ""}`}
    >
      {children}
    </div>
  );
}

/* ── Code Viewer — full-page JSON schema display ── */
function CodeViewer({ blocks }: { blocks: import("@/store/useBuilder").Block[] }) {
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
          dangerouslySetInnerHTML={{ __html: highlighted || '// No blocks yet — drag components onto the canvas' }}
        />
      </pre>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PreviewCanvas — sortable drop zone for builder blocks.
   DndContext is provided by the parent (CanvasDndProvider
   in PreviewPanel) so that the ComponentLibrary sidebar
   shares the same drag-and-drop context.
   ══════════════════════════════════════════════════════════ */
export function PreviewCanvas() {
  const {
    designSystem, selectedComponents, setSelectedComponents,
    blocks, setBlocks,
    selectedBlockId, setSelectedBlockId,
    addMenuOpen, setAddMenuOpen,
    canvasViewMode,
    density,
  } = useBuilder();

  /* ── Local UI state ── */
  const [swapTarget, setSwapTarget] = useState<string | null>(null);

  /* Track whether we initialized from store already */
  const initializedRef = useRef(false);

  /* ── Initialize blocks from selectedComponents on first mount ── */
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const seen = new Set<string>();
    const initial: Block[] = [];
    for (const compId of selectedComponents) {
      const blockType = ID_TO_BLOCK[compId];
      if (blockType && !seen.has(blockType)) {
        seen.add(blockType);
        initial.push({ id: makeBlockId(), type: blockType, props: {} });
      }
    }
    setBlocks(initial);
  }, [selectedComponents, setBlocks]);

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
      setSelectedBlockId(newId);
    },
    [blocks, syncToStore, setSelectedBlockId, setAddMenuOpen]
  );

  const handleRemoveBlock = useCallback(
    (id: string) => {
      const next = blocks.filter((b) => b.id !== id);
      syncToStore(next);
      if (selectedBlockId === id) setSelectedBlockId(null);
    },
    [blocks, syncToStore, selectedBlockId, setSelectedBlockId]
  );

  /* ── Code view ── */
  if (canvasViewMode === 'code') {
    return <CodeViewer blocks={blocks} />;
  }

  /* ── Canvas view (DndContext is provided by parent) ── */
  return (
    <div
      className={`preview-${designSystem} preview-canvas-root density-${density}`}
      onClick={() => setSelectedBlockId(null)}
    >
      {/* Add component menu — triggered from toolbar */}
      {addMenuOpen && (
        <div style={{ position: "relative" }}>
          <SwapMenu
            onSelect={handleAddBlock}
            onClose={() => setAddMenuOpen(false)}
          />
        </div>
      )}

      <CanvasDropZone>
        <SortableContext
          items={blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {blocks.map((block) => (
            <div
              key={block.id}
              style={{ position: "relative" }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBlockId(block.id);
              }}
            >
              <SortableBlock
                id={block.id}
                isSelected={selectedBlockId === block.id}
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
          ))}
        </SortableContext>
      </CanvasDropZone>
    </div>
  );
}
