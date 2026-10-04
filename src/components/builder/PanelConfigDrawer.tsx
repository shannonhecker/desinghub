"use client";

import React from "react";
import { X } from "lucide-react";
import { useBuilder, type DesignSystem } from "@/store/useBuilder";
import { BUILDER_TEMPLATES, type BuilderTemplate } from "@/lib/builderTemplates";
import { ComponentRenderer } from "./ComponentRenderer";
import { useCanvasDataset } from "./useBoundData";
import type { DataBinding } from "@/lib/reportData/binding";
import {
  AGGREGATIONS,
  PANEL_CHART_TYPES,
  applyPanelConfig,
  currentDataLevel,
  dataLevelOptions,
  withDataLevel,
  isHandBuilt,
  readPanelConfig,
  type PanelConfig,
} from "@/lib/reportData/panelConfig";
import { dimensionsOf, measuresOf, tableOf } from "@/lib/reportData/types";

/* ══════════════════════════════════════════════════════════
   PanelConfigDrawer - configure a data-bound panel.

   The pivot tool: draw the panel as a chart or a grid, group its
   rows by a dimension, pivot another into columns, choose the
   figures and how each is aggregated, show them as shares, keep
   the top N. Every control is the active design system's own
   Dropdown; every change is written straight to the block, so the
   panel beside the drawer updates as you choose.
   ══════════════════════════════════════════════════════════ */

const NONE = "None";
const OFF = "Off";
const SHARE_LABELS: Record<PanelConfig["share"], string> = { none: "Values", total: "% of total", group: "% of row" };
const LIMITS = ["All", "5", "10", "20"];

function Field({ system, label, value, options, onChange }: { system: DesignSystem; label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="dh-config-field">
      <ComponentRenderer type="SimulatedDropdown" system={system} {...{ label, value, options, onValueChange: onChange, inline: true }} />
    </div>
  );
}

export function PanelConfigDrawer({ system, blockId }: { system: DesignSystem; blockId: string }) {
  const block = useBuilder((s) => s.blocks.find((b) => b.id === blockId));
  const reportState = useBuilder((s) => s.reportState);
  const templateId = useBuilder((s) => s.activeTemplateId);
  const replaceBlock = useBuilder((s) => s.replaceBlock);
  const setExpandedPanel = useBuilder((s) => s.setExpandedPanel);
  const dataset = useCanvasDataset();

  const binding = block?.props.binding as DataBinding | undefined;
  const table = dataset && binding ? tableOf(dataset, binding.table) : undefined;
  if (!block || !binding || !table) return null;

  const config = readPanelConfig(block, table, reportState);
  const commit = (next: PanelConfig) => replaceBlock(blockId, applyPanelConfig(block, next, table));

  const levels = dataLevelOptions(binding, table, reportState);
  const level = currentDataLevel(binding, levels);

  const dimensions = dimensionsOf(table);
  const measures = measuresOf(table);
  const dimLabel = (key: string | null) => dimensions.find((d) => d.key === key)?.label ?? NONE;
  const dimKey = (label: string) => dimensions.find((d) => d.label === label)?.key ?? null;
  const chartLabel = PANEL_CHART_TYPES.find((c) => c.value === config.chartType)?.label ?? "Column";
  const aggLabel = (field: string) => AGGREGATIONS.find((a) => a.value === config.values.find((v) => v.field === field)?.agg)?.label ?? OFF;

  const setValue = (field: string, label: string) => {
    const rest = config.values.filter((v) => v.field !== field);
    const agg = AGGREGATIONS.find((a) => a.label === label)?.value;
    if (!agg) {
      /* A panel needs at least one figure. */
      if (rest.length > 0) commit({ ...config, values: rest });
      return;
    }
    const at = config.values.findIndex((v) => v.field === field);
    const values = at >= 0 ? config.values.map((v) => (v.field === field ? { field, agg } : v)) : [...config.values, { field, agg }];
    commit({ ...config, values });
  };

  /* The template's own definition of this panel, if it has one. */
  const template = templateId ? (BUILDER_TEMPLATES as Record<string, BuilderTemplate | undefined>)[templateId] : undefined;
  const original = template?.body.find((b) => b.id === blockId);

  return (
    <aside className="dh-config" aria-label={`Configure ${String(block.props.title ?? "panel")}`}>
      <header className="dh-config-header">
        <h3 className="dh-panel-title">Configuration</h3>
        <button type="button" className="dh-panel-tool" aria-label="Close configuration" onClick={() => setExpandedPanel({ id: blockId, config: false })}>
          <X size={15} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </header>
      <div className="dh-config-body">
        {isHandBuilt(binding) ? (
          <p className="dh-config-note">This panel has a hand-built layout. Changing a setting below replaces it with a standard one.</p>
        ) : null}

        <Field system={system} label="Show as" value={config.view === "grid" ? "Grid" : "Chart"} options={["Chart", "Grid"]} onChange={(v) => commit({ ...config, view: v === "Grid" ? "grid" : "chart" })} />
        {config.view === "chart" ? (
          <Field
            system={system}
            label="Chart type"
            value={chartLabel}
            options={PANEL_CHART_TYPES.map((c) => c.label)}
            onChange={(v) => commit({ ...config, chartType: PANEL_CHART_TYPES.find((c) => c.label === v)?.value ?? config.chartType })}
          />
        ) : null}

        <h4 className="dh-config-heading">Layout</h4>
        <Field system={system} label="Rows" value={dimLabel(config.rows)} options={[NONE, ...dimensions.map((d) => d.label)]} onChange={(v) => commit({ ...config, rows: dimKey(v) })} />
        <Field system={system} label="Columns" value={dimLabel(config.columns)} options={[NONE, ...dimensions.map((d) => d.label)]} onChange={(v) => commit({ ...config, columns: dimKey(v) })} />
        <Field
          system={system}
          label="Show values as"
          value={SHARE_LABELS[config.share]}
          options={Object.values(SHARE_LABELS)}
          onChange={(v) => commit({ ...config, share: (Object.keys(SHARE_LABELS) as PanelConfig["share"][]).find((k) => SHARE_LABELS[k] === v) ?? "none" })}
        />
        <Field system={system} label="Keep top" value={config.limit ? String(config.limit) : "All"} options={LIMITS} onChange={(v) => commit({ ...config, limit: v === "All" ? null : Number(v) })} />

        {levels.length > 0 ? (
          <>
            <h4 className="dh-config-heading">Data</h4>
            <Field
              system={system}
              label="Data level"
              value={level?.label ?? levels[0].label}
              options={levels.map((o) => o.label)}
              onChange={(v) => {
                const next = levels.find((o) => o.label === v);
                if (next) replaceBlock(blockId, { type: block.type, props: { ...block.props, binding: withDataLevel(binding, next.level) } });
              }}
            />
            {level ? <p className="dh-config-note">{level.path}</p> : null}
          </>
        ) : null}

        <h4 className="dh-config-heading">Values</h4>
        {measures.map((m) => (
          <Field
            key={m.key}
            system={system}
            label={m.label}
            value={aggLabel(m.key)}
            options={[OFF, ...AGGREGATIONS.map((a) => a.label)]}
            onChange={(v) => setValue(m.key, v === OFF ? OFF : v)}
          />
        ))}
        {measures.length === 0 ? <p className="dh-config-note">This table has no number columns.</p> : null}
      </div>
      {original ? (
        <footer className="dh-config-footer">
          <button type="button" className="dh-config-reset" onClick={() => replaceBlock(blockId, { type: original.type, props: original.props })}>
            Reset to the template
          </button>
        </footer>
      ) : null}
    </aside>
  );
}
