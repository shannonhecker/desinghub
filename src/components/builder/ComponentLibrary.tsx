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
  {
    id: "lib-card",
    type: "SimulatedCard",
    label: "Card",
    icon: "credit_card",
    defaults: { title: "New Card", content: "Card content goes here." },
  },
  {
    id: "lib-badge",
    type: "SimulatedBadge",
    label: "Badge",
    icon: "label",
    defaults: { label: "New Badge", status: "default" },
  },
  {
    id: "lib-chat-message",
    type: "SimulatedChatMessage",
    label: "Chat Message",
    icon: "chat_bubble",
    defaults: { role: "user", message: "Can you help me build a dashboard?" },
  },
  {
    id: "lib-chart",
    type: "SimulatedChart",
    label: "Chart",
    icon: "bar_chart",
    defaults: { title: "Monthly Revenue", dataPoints: "40,70,45,90,65" },
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

/* ── Inspector field ── */
function InspectorField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="inspector-field">
      <label className="inspector-field-label">{label}</label>
      {children}
    </div>
  );
}

/* ── Block-specific property editors ── */

function ButtonFields({ blockId }: { blockId: string }) {
  const { blocks, updateBlockProps } = useBuilder();
  const block = blocks.find((b) => b.id === blockId);
  if (!block) return null;
  const label = (block.props.label as string) ?? "New Button";
  const variant = (block.props.variant as string) ?? "primary";

  return (
    <div>
      <InspectorField label="Label">
        <input
          className="inspector-input"
          type="text"
          value={label}
          onChange={(e) => updateBlockProps(blockId, { label: e.target.value })}
        />
      </InspectorField>
      <InspectorField label="Variant">
        <select
          className="inspector-select"
          value={variant}
          onChange={(e) => updateBlockProps(blockId, { variant: e.target.value })}
        >
          <option value="primary">Primary / CTA</option>
          <option value="secondary">Secondary</option>
          <option value="outline">Outline</option>
          <option value="ghost">Text / Ghost</option>
        </select>
      </InspectorField>
    </div>
  );
}

function TitleFields({ blockId }: { blockId: string }) {
  const { blocks, updateBlockProps } = useBuilder();
  const block = blocks.find((b) => b.id === blockId);
  if (!block) return null;
  const text = (block.props.text as string) ?? "New Heading";
  const level = (block.props.level as string) ?? "h2";

  return (
    <div>
      <InspectorField label="Text">
        <input
          className="inspector-input"
          type="text"
          value={text}
          onChange={(e) => updateBlockProps(blockId, { text: e.target.value })}
        />
      </InspectorField>
      <InspectorField label="Level">
        <select
          className="inspector-select"
          value={level}
          onChange={(e) => updateBlockProps(blockId, { level: e.target.value })}
        >
          <option value="h1">H1</option>
          <option value="h2">H2</option>
          <option value="h3">H3</option>
          <option value="h4">H4</option>
        </select>
      </InspectorField>
    </div>
  );
}

function TextInputFields({ blockId }: { blockId: string }) {
  const { blocks, updateBlockProps } = useBuilder();
  const block = blocks.find((b) => b.id === blockId);
  if (!block) return null;
  const label = (block.props.label as string) ?? "Label";
  const placeholder = (block.props.placeholder as string) ?? "Enter text...";

  return (
    <div>
      <InspectorField label="Label">
        <input
          className="inspector-input"
          type="text"
          value={label}
          onChange={(e) => updateBlockProps(blockId, { label: e.target.value })}
        />
      </InspectorField>
      <InspectorField label="Placeholder">
        <input
          className="inspector-input"
          type="text"
          value={placeholder}
          onChange={(e) =>
            updateBlockProps(blockId, { placeholder: e.target.value })
          }
        />
      </InspectorField>
    </div>
  );
}

function CardFields({ blockId }: { blockId: string }) {
  const { blocks, updateBlockProps } = useBuilder();
  const block = blocks.find((b) => b.id === blockId);
  if (!block) return null;
  const title = (block.props.title as string) ?? "New Card";
  const content = (block.props.content as string) ?? "Card content goes here.";

  return (
    <div>
      <InspectorField label="Title">
        <input
          className="inspector-input"
          type="text"
          value={title}
          onChange={(e) => updateBlockProps(blockId, { title: e.target.value })}
        />
      </InspectorField>
      <InspectorField label="Content">
        <textarea
          className="inspector-input"
          rows={3}
          value={content}
          onChange={(e) => updateBlockProps(blockId, { content: e.target.value })}
          style={{ resize: "vertical", lineHeight: 1.5 }}
        />
      </InspectorField>
    </div>
  );
}

function BadgeFields({ blockId }: { blockId: string }) {
  const { blocks, updateBlockProps } = useBuilder();
  const block = blocks.find((b) => b.id === blockId);
  if (!block) return null;
  const label = (block.props.label as string) ?? "New Badge";
  const status = (block.props.status as string) ?? "default";

  return (
    <div>
      <InspectorField label="Label">
        <input
          className="inspector-input"
          type="text"
          value={label}
          onChange={(e) => updateBlockProps(blockId, { label: e.target.value })}
        />
      </InspectorField>
      <InspectorField label="Status">
        <select
          className="inspector-select"
          value={status}
          onChange={(e) => updateBlockProps(blockId, { status: e.target.value })}
        >
          <option value="default">Default</option>
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
      </InspectorField>
    </div>
  );
}

function ChatMessageFields({ blockId }: { blockId: string }) {
  const { blocks, updateBlockProps } = useBuilder();
  const block = blocks.find((b) => b.id === blockId);
  if (!block) return null;
  const role = (block.props.role as string) ?? "user";
  const message = (block.props.message as string) ?? "";

  return (
    <div>
      <InspectorField label="Role">
        <select
          className="inspector-select"
          value={role}
          onChange={(e) => updateBlockProps(blockId, { role: e.target.value })}
        >
          <option value="user">User</option>
          <option value="system">System / AI</option>
        </select>
      </InspectorField>
      <InspectorField label="Message">
        <textarea
          className="inspector-input"
          rows={3}
          value={message}
          onChange={(e) => updateBlockProps(blockId, { message: e.target.value })}
          style={{ resize: "vertical", lineHeight: 1.5 }}
        />
      </InspectorField>
    </div>
  );
}

function ChartFields({ blockId }: { blockId: string }) {
  const { blocks, updateBlockProps } = useBuilder();
  const block = blocks.find((b) => b.id === blockId);
  if (!block) return null;
  const title = (block.props.title as string) ?? "Monthly Revenue";
  const dataPoints = (block.props.dataPoints as string) ?? "40,70,45,90,65";

  return (
    <div>
      <InspectorField label="Title">
        <input
          className="inspector-input"
          type="text"
          value={title}
          onChange={(e) => updateBlockProps(blockId, { title: e.target.value })}
        />
      </InspectorField>
      <InspectorField label="Data Points">
        <input
          className="inspector-input"
          type="text"
          value={dataPoints}
          placeholder="e.g. 40,70,45,90,65"
          onChange={(e) => updateBlockProps(blockId, { dataPoints: e.target.value })}
        />
      </InspectorField>
    </div>
  );
}

const TYPE_FIELDS: Record<string, React.FC<{ blockId: string }>> = {
  SimulatedButton: ButtonFields,
  SimulatedTitle: TitleFields,
  SimulatedTextInput: TextInputFields,
  SimulatedCard: CardFields,
  SimulatedBadge: BadgeFields,
  SimulatedChatMessage: ChatMessageFields,
  SimulatedChart: ChartFields,
};

/* ── Combined component panel: library + properties ── */
export function ComponentLibrary() {
  const {
    componentLibraryOpen,
    toggleComponentLibrary,
    selectedBlockId,
    blocks,
  } = useBuilder();

  if (!componentLibraryOpen) return null;

  const selectedBlock = selectedBlockId
    ? blocks.find((b) => b.id === selectedBlockId)
    : null;
  const FieldsComponent = selectedBlock
    ? TYPE_FIELDS[selectedBlock.type]
    : null;

  return (
    <div className="component-library open">
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
        <p className="lib-hint">Drag onto the canvas</p>
        {LIBRARY_BLUEPRINTS.map((bp) => (
          <BlueprintItem key={bp.id} blueprint={bp} />
        ))}

        {selectedBlock && FieldsComponent && (
          <div>
            <div className="lib-section-divider" />
            <div className="inspector-section-title">
              {selectedBlock.type.replace("Simulated", "")} Properties
            </div>
            <FieldsComponent blockId={selectedBlock.id} />
          </div>
        )}
      </div>
    </div>
  );
}
