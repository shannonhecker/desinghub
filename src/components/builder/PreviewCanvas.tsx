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
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useBuilder } from "@/store/useBuilder";
import { SortableBlock } from "./SortableBlock";
import { ComponentRenderer } from "./ComponentRenderer";
import { SwapMenu } from "./SwapMenu";

/* ── Map store component IDs to block type strings ── */
const ID_TO_BLOCK: Record<string, string> = {
  buttons: "Buttons",
  cards: "Cards",
  table: "DataTable",
  inputs: "FormFields",
  "text-fields": "FormFields",
  "form-field": "FormFields",
  tabs: "Tabs",
  switches: "Toggles",
  checkboxes: "Toggles",
  radios: "Toggles",
  badges: "Badges",
  avatars: "Avatars",
  alerts: "Alert",
  "progress-bar": "Progress",
  tooltips: "Tooltips",
  progress: "StatsCards",
  typography: "Typography",
};

/* Reverse: block type -> a canonical store ID */
const BLOCK_TO_ID: Record<string, string> = {
  Buttons: "buttons",
  Cards: "cards",
  DataTable: "table",
  FormFields: "inputs",
  Tabs: "tabs",
  Toggles: "switches",
  Badges: "badges",
  Avatars: "avatars",
  Alert: "alerts",
  Progress: "progress-bar",
  Tooltips: "tooltips",
  StatsCards: "progress",
  Dialog: "dialog",
  Dropdown: "dropdown",
  DatePicker: "date-picker",
  Typography: "typography",
};

interface Block {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

let blockCounter = 0;
function makeBlockId() {
  return `block-${++blockCounter}-${Date.now()}`;
}

export function PreviewCanvas() {
  const { designSystem, selectedComponents, setSelectedComponents, colorOverrides } = useBuilder();
  const primaryOverride = colorOverrides.accent || colorOverrides.primary || colorOverrides.brandBg;

  /* ── State ── */
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [swapTarget, setSwapTarget] = useState<string | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  /* Track whether we initialized from store already */
  const initializedRef = useRef(false);

  /* ── Initialize blocks from store on mount / when selectedComponents changes externally ── */
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
  }, [selectedComponents]);

  /* ── Sync blocks back to store when they change ── */
  const syncToStore = useCallback(
    (updated: Block[]) => {
      const ids = updated
        .map((b) => BLOCK_TO_ID[b.type])
        .filter(Boolean) as string[];
      setSelectedComponents(ids);
    },
    [setSelectedComponents]
  );

  /* ── DnD sensors ── */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /* ── Handlers ── */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        setBlocks((prev) => {
          const oldIndex = prev.findIndex((b) => b.id === active.id);
          const newIndex = prev.findIndex((b) => b.id === over.id);
          const next = arrayMove(prev, oldIndex, newIndex);
          syncToStore(next);
          return next;
        });
      }
    },
    [syncToStore]
  );

  const handleSwap = useCallback(
    (blockId: string, newType: string) => {
      setBlocks((prev) => {
        const next = prev.map((b) =>
          b.id === blockId ? { ...b, type: newType, props: {} } : b
        );
        syncToStore(next);
        return next;
      });
      setSwapTarget(null);
    },
    [syncToStore]
  );

  const handleAddBlock = useCallback(
    (type: string) => {
      setBlocks((prev) => {
        const next = [...prev, { id: makeBlockId(), type, props: {} }];
        syncToStore(next);
        return next;
      });
      setAddMenuOpen(false);
    },
    [syncToStore]
  );

  const handleRemoveBlock = useCallback(
    (id: string) => {
      setBlocks((prev) => {
        const next = prev.filter((b) => b.id !== id);
        syncToStore(next);
        return next;
      });
    },
    [syncToStore]
  );

  return (
    <div
      className={`preview-${designSystem}`}
      style={{
        background: "var(--ds-bg)",
        color: "var(--ds-fg)",
        fontFamily: "var(--ds-font)",
        minHeight: "100%",
        fontSize: 13,
        padding: 16,
        ...(primaryOverride
          ? ({ "--ds-primary": primaryOverride } as React.CSSProperties)
          : {}),
      }}
    >
      {/* Add component button — top */}
      <div style={{ position: "relative" }}>
        <button
          className="canvas-add-btn"
          onClick={() => setAddMenuOpen(!addMenuOpen)}
          type="button"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            add
          </span>
          Add Component
        </button>

        {addMenuOpen && (
          <SwapMenu
            onSelect={handleAddBlock}
            onClose={() => setAddMenuOpen(false)}
          />
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {blocks.map((block) => (
            <div key={block.id} style={{ position: "relative" }}>
              <SortableBlock
                id={block.id}
                onSwapClick={() =>
                  setSwapTarget(swapTarget === block.id ? null : block.id)
                }
                onRemove={() => handleRemoveBlock(block.id)}
              >
                <ComponentRenderer
                  type={block.type}
                  system={designSystem}
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
      </DndContext>
    </div>
  );
}
