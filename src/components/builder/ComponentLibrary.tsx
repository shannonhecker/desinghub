"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { useBuilder } from "@/store/useBuilder";

export interface LibraryBlueprint {
  id: string;
  type: string;
  label: string;
  icon: string;
  defaults: Record<string, unknown>;
}

export const LIBRARY_BLUEPRINTS: LibraryBlueprint[] = [
  {
    id: "lib-button",
    type: "SimulatedButton",
    label: "Button",
    icon: "smart_button",
    defaults: { variant: "primary", label: "New Button" },
  },
  {
    id: "lib-title",
    type: "SimulatedTitle",
    label: "Title / Heading",
    icon: "title",
    defaults: { level: "h2", text: "New Heading" },
  },
  {
    id: "lib-text-input",
    type: "SimulatedTextInput",
    label: "Text Input",
    icon: "text_fields",
    defaults: { placeholder: "Enter text...", label: "Label" },
  },
  {
    id: "lib-alert",
    type: "Alert",
    label: "Alert",
    icon: "warning",
    defaults: {},
  },
];

/* ── Single draggable blueprint card ── */
function BlueprintItem({ blueprint }: { blueprint: LibraryBlueprint }) {
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

/* ── Library panel ── */
export function ComponentLibrary() {
  const { componentLibraryOpen, toggleComponentLibrary } = useBuilder();

  return (
    <>
      {componentLibraryOpen && (
        <div className="lib-backdrop" onClick={toggleComponentLibrary} />
      )}

      <div className={`component-library${componentLibraryOpen ? " open" : ""}`}>
        <div className="lib-header">
          <span className="lib-header-title">Components</span>
          <button
            className="lib-close-btn"
            onClick={toggleComponentLibrary}
            type="button"
            title="Close library"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              close
            </span>
          </button>
        </div>

        <div className="lib-body">
          <p className="lib-hint">Drag a component onto the canvas</p>
          {LIBRARY_BLUEPRINTS.map((bp) => (
            <BlueprintItem key={bp.id} blueprint={bp} />
          ))}
        </div>
      </div>
    </>
  );
}
