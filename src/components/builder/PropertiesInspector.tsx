"use client";

import React from "react";
import { useBuilder } from "@/store/useBuilder";

/* ── Field component ── */
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

/* ── Type-specific form renderers ── */

function ButtonFields({ blockId }: { blockId: string }) {
  const { blocks, updateBlockProps } = useBuilder();
  const block = blocks.find((b) => b.id === blockId);
  if (!block) return null;

  const label = (block.props.label as string) ?? "New Button";
  const variant = (block.props.variant as string) ?? "primary";

  return (
    <>
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
    </>
  );
}

function TitleFields({ blockId }: { blockId: string }) {
  const { blocks, updateBlockProps } = useBuilder();
  const block = blocks.find((b) => b.id === blockId);
  if (!block) return null;

  const text = (block.props.text as string) ?? "New Heading";
  const level = (block.props.level as string) ?? "h2";

  return (
    <>
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
    </>
  );
}

function TextInputFields({ blockId }: { blockId: string }) {
  const { blocks, updateBlockProps } = useBuilder();
  const block = blocks.find((b) => b.id === blockId);
  if (!block) return null;

  const label = (block.props.label as string) ?? "Label";
  const placeholder = (block.props.placeholder as string) ?? "Enter text...";

  return (
    <>
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
    </>
  );
}

function CardFields({ blockId }: { blockId: string }) {
  const { blocks, updateBlockProps } = useBuilder();
  const block = blocks.find((b) => b.id === blockId);
  if (!block) return null;

  const title = (block.props.title as string) ?? "New Card";
  const content = (block.props.content as string) ?? "Card content goes here.";

  return (
    <>
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
    </>
  );
}

function BadgeFields({ blockId }: { blockId: string }) {
  const { blocks, updateBlockProps } = useBuilder();
  const block = blocks.find((b) => b.id === blockId);
  if (!block) return null;

  const label = (block.props.label as string) ?? "New Badge";
  const status = (block.props.status as string) ?? "default";

  return (
    <>
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
    </>
  );
}

function ChatMessageFields({ blockId }: { blockId: string }) {
  const { blocks, updateBlockProps } = useBuilder();
  const block = blocks.find((b) => b.id === blockId);
  if (!block) return null;

  const role = (block.props.role as string) ?? "user";
  const message = (block.props.message as string) ?? "";

  return (
    <>
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
    </>
  );
}

function ChartFields({ blockId }: { blockId: string }) {
  const { blocks, updateBlockProps } = useBuilder();
  const block = blocks.find((b) => b.id === blockId);
  if (!block) return null;

  const title = (block.props.title as string) ?? "Monthly Revenue";
  const dataPoints = (block.props.dataPoints as string) ?? "40,70,45,90,65";

  return (
    <>
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
    </>
  );
}

/* ── Type → fields map ── */
const TYPE_FIELDS: Record<string, React.FC<{ blockId: string }>> = {
  SimulatedButton: ButtonFields,
  SimulatedTitle: TitleFields,
  SimulatedTextInput: TextInputFields,
  SimulatedCard: CardFields,
  SimulatedBadge: BadgeFields,
  SimulatedChatMessage: ChatMessageFields,
  SimulatedChart: ChartFields,
};

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
