"use client";

import React from "react";
import { useBuilder } from "@/store/useBuilder";
import { TYPE_FIELDS } from "@/lib/blockRegistry";

/* ── Main inspector ── */
export function PropertiesInspector() {
  const {
    selectedBlockId,
    blocks,
    mode,
    setMode,
    density,
    setDensity,
  } = useBuilder();

  const selectedBlock = selectedBlockId
    ? blocks.find((b) => b.id === selectedBlockId)
    : null;

  const FieldsComponent = selectedBlock
    ? TYPE_FIELDS[selectedBlock.type]
    : null;

  return (
    <div className="properties-inspector">
      {/* ── Global controls ── */}
      <div className="inspector-section">
        <div className="inspector-section-title">Theme</div>
        <div className="inspector-toggle-group">
          <button
            className={`inspector-toggle-btn${mode === "light" ? " active" : ""}`}
            onClick={() => setMode("light")}
          >
            Light
          </button>
          <button
            className={`inspector-toggle-btn${mode === "dark" ? " active" : ""}`}
            onClick={() => setMode("dark")}
          >
            Dark
          </button>
        </div>
      </div>

      <div className="inspector-section">
        <div className="inspector-section-title">Density</div>
        <div className="inspector-toggle-group">
          <button
            className={`inspector-toggle-btn${density === "medium" || density === "comfortable" ? " active" : ""}`}
            onClick={() => setDensity("medium")}
          >
            Comfortable
          </button>
          <button
            className={`inspector-toggle-btn${density === "high" || density === "compact" ? " active" : ""}`}
            onClick={() => setDensity("high")}
          >
            Compact
          </button>
        </div>
      </div>

      <div className="inspector-divider" />

      {/* ── Block-specific controls ── */}
      {selectedBlock && FieldsComponent ? (
        <div className="inspector-section">
          <div className="inspector-section-title">
            {selectedBlock.type.replace("Simulated", "")} Properties
          </div>
          <FieldsComponent blockId={selectedBlock.id} />
        </div>
      ) : (
        <div className="inspector-hint">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, opacity: 0.5 }}
          >
            touch_app
          </span>
          Select a component to edit its properties
        </div>
      )}
    </div>
  );
}
