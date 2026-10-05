"use client";

import React, { useLayoutEffect, useState } from "react";
import { useBuilder, type DesignSystem } from "@/store/useBuilder";
import { BUILDER_TEMPLATES, type BuilderTemplate } from "@/lib/builderTemplates";
import { RealComponentRenderer } from "@/components/ui-kit/RealComponentRenderer";
import type { ConfigDialogModel, ConfigSelect } from "@/components/ui-kit/RealConfigDialog";
import type { SystemId } from "@/lib/componentApiRegistry";
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
import {
  addColumn, addGroup, availableTree, canPivot, withAggregated, canRemoveColumn, moveColumn, removeColumn, removeGroup, setAggregation, type ConfigTab,
} from "@/lib/reportData/panelConfigDialog";
import { fieldOf, tableOf } from "@/lib/reportData/types";

/* ══════════════════════════════════════════════════════════
   PanelConfigDialog - configure a data-bound panel, in the
   original Analytics Dashboard's Configuration dialog: Component
   Type, Aggregated, then Columns (the figures, in order, each
   with its aggregation), Groups (one row group, one column group)
   and Display (values as shares, top N, data level). Drawn in the
   active design system's own components (RealConfigDialog).

   Every change is written straight to the block, so the panel
   behind the dialog updates as you choose. Reset to first loaded
   puts back the template's own definition of the panel.
   ══════════════════════════════════════════════════════════ */

const SHARE_LABELS: Record<PanelConfig["share"], string> = { none: "Values", total: "% of total", group: "% of row" };
const LIMITS = ["All", "5", "10", "20"];
const GRID = "Grid";
const TABS: { value: ConfigTab; label: string }[] = [
  { value: "columns", label: "Columns" },
  { value: "groups", label: "Groups" },
  { value: "display", label: "Display" },
];
export const AGGREGATED_INFO = "Aggregated shows one row per group. Turn it off to see every row.";

/** The canvas's colours, for the tree's type tags (the dialog is portalled out of the canvas). */
function tonesFrom(el: HTMLElement | null): React.CSSProperties {
  if (!el || typeof window === "undefined") return {};
  const cs = window.getComputedStyle(el);
  const v = (name: string) => cs.getPropertyValue(name).trim();
  const out: Record<string, string> = {};
  const num = v("--ds-status-positive");
  const dim = v("--ds-accent") || v("--ds-primary");
  const fg = v("--ds-fg");
  if (num) out["--dh-cfg-num"] = num;
  if (dim) out["--dh-cfg-dim"] = dim;
  if (fg) out["--dh-kit-fg"] = fg;
  return out as React.CSSProperties;
}

export function PanelConfigDialog({ system, blockId, launcher }: { system: DesignSystem; blockId: string; launcher: React.RefObject<HTMLElement | null> }) {
  const block = useBuilder((s) => s.blocks.find((b) => b.id === blockId));
  const reportState = useBuilder((s) => s.reportState);
  const templateId = useBuilder((s) => s.activeTemplateId);
  const replaceBlock = useBuilder((s) => s.replaceBlock);
  const setExpandedPanel = useBuilder((s) => s.setExpandedPanel);
  const mode = useBuilder((s) => (s.mode === "dark" ? "dark" : "light"));
  const dataset = useCanvasDataset();
  const [tab, setTab] = useState<ConfigTab>("columns");
  const [filter, setFilter] = useState("");
  /* The launcher is drawn in the same commit as the dialog: read its colours once it is there. */
  const [tones, setTones] = useState<React.CSSProperties>({});
  /* Read again when the system or the mode changes under the open dialog. */
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read from the DOM after commit
    setTones(tonesFrom(launcher.current));
  }, [launcher, system, mode]);
  /* The binding as the dialog found it (Aggregated off then on returns to it). */
  const [opening] = useState(() => block?.props.binding as DataBinding | undefined);

  const binding = block?.props.binding as DataBinding | undefined;
  const table = dataset && binding ? tableOf(dataset, binding.table) : undefined;
  if (!block || !binding || !table) return null;

  const config = readPanelConfig(block, table, reportState);
  const commit = (next: PanelConfig) => { if (next !== config) replaceBlock(blockId, applyPanelConfig(block, next, table)); };
  const close = () => setExpandedPanel({ id: blockId, config: false });

  const levels = dataLevelOptions(binding, table, reportState);
  const level = currentDataLevel(binding, levels);
  const setLevel = (next: (typeof levels)[number]["level"]) => replaceBlock(blockId, { type: block.type, props: { ...block.props, binding: withDataLevel(binding, next) } });
  /* No raw-row mode in the model: off is the grid's last level on its own
     (one row per item), on is the full hierarchy. Without levels, there is
     only the aggregated view and the switch says so (on, disabled). */
  const fullLevel = levels.find((o) => typeof o.level === "number")?.level ?? 0;
  const hasLeaf = levels.some((o) => o.level === "leaf");

  const chartLabel = PANEL_CHART_TYPES.find((c) => c.value === config.chartType)?.label ?? "Column";
  const label = (key: string) => fieldOf(table, key)?.label ?? key;
  const aggLabel = (agg: string) => AGGREGATIONS.find((a) => a.value === agg)?.label ?? agg;

  /* The template's own definition of this panel, if it has one. */
  const template = templateId ? (BUILDER_TEMPLATES as Record<string, BuilderTemplate | undefined>)[templateId] : undefined;
  const original = template?.body.find((b) => b.id === blockId);
  const unchanged = !original || (original.type === block.type && JSON.stringify(original.props) === JSON.stringify(block.props));

  const display: ConfigSelect[] = [
    {
      id: "dh-cfg-share", label: "Show values as", value: SHARE_LABELS[config.share], options: Object.values(SHARE_LABELS),
      onChange: (v) => commit({ ...config, share: (Object.keys(SHARE_LABELS) as PanelConfig["share"][]).find((k) => SHARE_LABELS[k] === v) ?? "none" }),
    },
    { id: "dh-cfg-limit", label: "Keep top", value: config.limit ? String(config.limit) : "All", options: LIMITS, onChange: (v) => commit({ ...config, limit: v === "All" ? null : Number(v) }) },
  ];
  if (levels.length > 0) {
    display.push({
      id: "dh-cfg-level", label: "Data level", value: level?.label ?? levels[0].label, options: levels.map((o) => o.label), note: level?.path,
      onChange: (v) => { const next = levels.find((o) => o.label === v); if (next) setLevel(next.level); },
    });
  }

  const model: ConfigDialogModel = {
    open: true,
    panel: String(block.props.title ?? "panel"),
    onClose: close,
    returnFocus: launcher,
    tones,
    componentType: {
      id: "dh-cfg-type", label: "Component Type", value: config.view === "grid" ? GRID : chartLabel, options: [GRID, ...PANEL_CHART_TYPES.map((c) => c.label)],
      onChange: (v) => {
        if (v === GRID) commit({ ...config, view: "grid" });
        else commit({ ...config, view: "chart", chartType: PANEL_CHART_TYPES.find((c) => c.label === v)?.value ?? config.chartType });
      },
    },
    aggregated: {
      checked: level?.level !== "leaf",
      disabled: !hasLeaf,
      info: AGGREGATED_INFO,
      onChange: (on) => replaceBlock(blockId, { type: block.type, props: { ...block.props, binding: withAggregated(binding, opening ?? binding, on, fullLevel) } }),
    },
    tab,
    tabs: TABS,
    onTab: (t) => { setTab(t); setFilter(""); },
    filter,
    onFilter: setFilter,
    tree: availableTree(table, config, tab, filter),
    onAdd: (key) => commit(tab === "groups" ? addGroup(config, key, table) : addColumn(config, key, table)),
    columns: config.values.map((v, i) => ({
      key: v.field, label: label(v.field), tag: "123", agg: aggLabel(v.agg),
      canUp: i > 0, canDown: i < config.values.length - 1, canRemove: canRemoveColumn(config),
    })),
    aggOptions: AGGREGATIONS.map((a) => a.label),
    onAgg: (key, l) => { const agg = AGGREGATIONS.find((a) => a.label === l)?.value; if (agg) commit(setAggregation(config, key, agg)); },
    onMove: (key, by) => commit(moveColumn(config, key, by)),
    onRemoveColumn: (key) => commit(removeColumn(config, key)),
    groups: {
      rows: config.rows ? { key: config.rows, label: label(config.rows), tag: "abc" } : null,
      columns: config.columns && canPivot(config) ? { key: config.columns, label: label(config.columns), tag: "abc" } : null,
      pivot: canPivot(config),
    },
    onRemoveGroup: (slot) => commit(removeGroup(config, slot)),
    display,
    note: isHandBuilt(binding) ? "This panel has a hand-built layout. Changing a setting replaces it with a standard one." : undefined,
    reset: { disabled: unchanged, onClick: () => { if (original) replaceBlock(blockId, { type: original.type, props: original.props }); } },
  };
  return <RealComponentRenderer system={system as SystemId} type="ConfigDialog" mode={mode} saltDensity="medium" props={{ model }} />;
}
