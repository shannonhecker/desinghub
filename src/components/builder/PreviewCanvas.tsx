"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useBuilder, type Block } from "@/store/useBuilder";
import { SortableBlock } from "./SortableBlock";
import { ComponentRenderer } from "./ComponentRenderer";
import { SwapMenu } from "./SwapMenu";
import { ComponentLibrary, LIBRARY_BLUEPRINTS } from "./ComponentLibrary";
import { ID_TO_BLOCK, BLOCK_TO_ID } from "@/lib/componentMaps";

let blockCounter = 0;
function makeBlockId() {
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

export function PreviewCanvas() {
  const {
    designSystem, selectedComponents, setSelectedComponents,
    blocks, setBlocks,
    selectedBlockId, setSelectedBlockId,
    addMenuOpen, setAddMenuOpen,
    density,
  } = useBuilder();

  /* ── Local UI state ── */
  const [swapTarget, setSwapTarget] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

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

  /* ── DnD sensors ── */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /* ── Handlers ── */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;

      // Case 1: Library blueprint dropped onto canvas
      if (active.data.current?.fromLibrary) {
        const { type, defaults } = active.data.current as {
          type: string;
          defaults: Record<string, unknown>;
        };
        const newId = makeBlockId();
        const next = [{ id: newId, type, props: { ...defaults } }, ...blocks];
        syncToStore(next);
        setSelectedBlockId(newId);
        return;
      }

      // Case 2: Reorder existing blocks
      if (over && active.id !== over.id) {
        const oldIndex = blocks.findIndex((b) => b.id === active.id);
        const newIndex = blocks.findIndex((b) => b.id === over.id);
        const next = arrayMove(blocks, oldIndex, newIndex);
        syncToStore(next);
      }
    },
    [blocks, syncToStore, setSelectedBlockId]
  );

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

  /* ── Resolve drag overlay content ── */
  const activeBlueprintLabel = activeDragId
    ? LIBRARY_BLUEPRINTS.find((bp) => bp.id === activeDragId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="preview-canvas-layout">
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

      {/* Component Library panel — right side layout */}
      <ComponentLibrary />
      </div>

      {/* Drag overlay — ghost preview while dragging from library */}
      <DragOverlay dropAnimation={null}>
        {activeBlueprintLabel ? (
          <div className="lib-drag-overlay">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {activeBlueprintLabel.icon}
            </span>
            <span>{activeBlueprintLabel.label}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
