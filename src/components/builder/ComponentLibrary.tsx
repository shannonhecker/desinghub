"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { useBuilder } from "@/store/useBuilder";
import { LIBRARY_BLUEPRINTS, TYPE_FIELDS } from "@/lib/blockRegistry";

/* ── Single draggable blueprint card ── */
function BlueprintItem({ blueprint }: { blueprint: { id: string; type: string; label: string; icon: string; defaults: Record<string, unknown> } }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: blueprint.id,
    data: {
      fromLibrary: true,
      type: blueprint.type,
      defaults: blueprint.defaults,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`lib-blueprint${isDragging ? " is-dragging" : ""}`}
      {...listeners}
      {...attributes}
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
            <div className="lib-section-divider" />
          </div>
        )}

        <p className="lib-hint">Drag onto the canvas</p>
        {LIBRARY_BLUEPRINTS.map((bp) => (
          <BlueprintItem key={bp.id} blueprint={bp} />
        ))}
      </div>
    </div>
  );
}
