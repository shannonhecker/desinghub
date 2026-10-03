"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type ColGroupDef,
  type GridApi,
} from "ag-grid-community";
import {
  formatGridValue,
  isColumnGroup,
  isNegativeCell,
  isNumericKind,
  type GridColumn,
  type GridLeafColumn,
  type GridRow,
} from "@/lib/dataGridModel";
import { usePreviewReadOnly } from "./previewReadOnly";

ModuleRegistry.registerModules([AllCommunityModule]);

/* ══════════════════════════════════════════════════════════
   SimulatedDataGrid - a dense data grid (AG Grid) for the
   builder canvas: grouped headers, a pinned first column,
   right-aligned formatted numbers, bold total rows.

   One renderer for every design system. The AG Grid theme is
   built from the canvas's --ds-* tokens, which the active
   system and mode already resolve, so there is no per-system
   branch here. Row and header heights are fixed so the grid is
   the same size in every system.
   ══════════════════════════════════════════════════════════ */

const ROW_HEIGHT = 32;
const HEADER_HEIGHT = 36;
const FONT_SIZE = 13;
const HEADER_FONT_SIZE = 12;
const INDENT_STEP = 16;
const CELL_PADDING = 12;

const gridTheme = themeQuartz.withParams({
  backgroundColor: "var(--ds-surface)",
  foregroundColor: "var(--ds-fg)",
  headerBackgroundColor: "var(--ds-surface)",
  headerTextColor: "var(--ds-fg-secondary)",
  /* Row rules use the system's secondary separator: its primary border
     reads as a heavy white line between every row in the dark themes. */
  borderColor: "var(--ds-border-subtle, var(--ds-border))",
  accentColor: "var(--ds-primary)",
  /* A light wash of the text colour: the system's surface-hover token is a
     solid fill that hides negative-coloured values in the dark themes. */
  rowHoverColor: "color-mix(in srgb, var(--ds-fg) 6%, transparent)",
  fontFamily: "inherit",
  fontSize: FONT_SIZE,
  headerFontSize: HEADER_FONT_SIZE,
  headerFontWeight: 600,
  rowHeight: ROW_HEIGHT,
  headerHeight: HEADER_HEIGHT,
  cellHorizontalPadding: CELL_PADDING,
  wrapperBorder: false,
  wrapperBorderRadius: 0,
  columnBorder: false,
});

function leafColDef(column: GridLeafColumn, isFirst: boolean): ColDef<GridRow> {
  const numeric = isNumericKind(column.kind);
  return {
    field: column.field,
    headerName: column.header,
    ...(column.width ? { width: column.width } : { flex: column.flex ?? 1, minWidth: column.minWidth ?? (numeric ? 88 : 120) }),
    pinned: column.pinned ? "left" : undefined,
    sortable: true,
    resizable: false,
    suppressMovable: true,
    type: numeric ? "rightAligned" : undefined,
    valueFormatter: (params) => formatGridValue(column, params.value),
    cellStyle: (params) => ({
      fontVariantNumeric: "tabular-nums",
      fontWeight: params.data?._bold ? 600 : 400,
      ...(isNegativeCell(column, params.value) ? { color: "var(--ds-status-negative)" } : {}),
      ...(isFirst && typeof params.data?._indent === "number"
        ? { paddingLeft: `calc(var(--ag-cell-horizontal-padding) + ${params.data._indent * INDENT_STEP}px)` }
        : {}),
    }),
  };
}

function toColDefs(columns: GridColumn[]): (ColDef<GridRow> | ColGroupDef<GridRow>)[] {
  let first = true;
  return columns.map((c) => {
    if (isColumnGroup(c)) {
      return {
        headerName: c.header,
        marryChildren: true,
        headerClass: "dh-grid-group-header",
        children: c.children.map((leaf) => {
          const def = leafColDef(leaf, first);
          first = false;
          return def;
        }),
      };
    }
    const def = leafColDef(c, first);
    first = false;
    return def;
  });
}

interface SimulatedDataGridProps {
  columns: GridColumn[];
  rows: GridRow[];
  /** Height of the grid area in px. */
  height: number;
  /** Accessible name. */
  label?: string;
  /** Label (first-column value) of the selected row, for a master grid. */
  selected?: string;
  /** Makes rows selectable: called with the clicked row's label. */
  onSelect?: (label: string) => void;
}

/** A row's label: the value of the grid's first leaf column. */
function rowLabel(columns: GridColumn[], row: GridRow | undefined): string {
  const first = columns[0];
  const field = first ? (isColumnGroup(first) ? first.children[0]?.field : first.field) : undefined;
  return field && row ? String(row[field] ?? "") : "";
}

export function SimulatedDataGrid({ columns, rows, height, label, selected, onSelect }: SimulatedDataGridProps) {
  const columnDefs = useMemo(() => toColDefs(columns), [columns]);
  const apiRef = useRef<GridApi<GridRow> | null>(null);
  /* Row styling reads the latest selection through a ref, so the grid's
     callbacks stay stable and only a redraw is needed when it changes. */
  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
    apiRef.current?.redrawRows();
  }, [selected]);
  const rowClassRules = useMemo(
    () => ({ "dh-grid-row-selected": (params: { data?: GridRow }) => Boolean(selectedRef.current) && rowLabel(columns, params.data) === selectedRef.current }),
    [columns],
  );
  const selectable = Boolean(onSelect);
  const readOnly = usePreviewReadOnly();

  return (
    <div
      className={`dh-grid${selectable ? " dh-grid-selectable" : ""}`}
      style={{ height, width: "100%" }}
      role="region"
      aria-label={label}
      /* While presenting, a click in a selectable grid selects a ROW; it must
         not also select the block for the amend composer. (In Edit a click
         still selects the block, as everywhere else.) */
      onClick={selectable && readOnly ? (e) => e.stopPropagation() : undefined}
    >
      <AgGridReact<GridRow>
        theme={gridTheme}
        rowData={rows}
        columnDefs={columnDefs}
        rowClassRules={rowClassRules}
        onGridReady={(e) => { apiRef.current = e.api; }}
        onRowClicked={
          selectable
            ? (e) => onSelect!(rowLabel(columns, e.data))
            : undefined
        }
        /* Keyboard: a selectable grid keeps cell focus so Enter / Space on a
           focused row selects it. */
        suppressCellFocus={!selectable}
        onCellKeyDown={
          selectable
            ? (e) => {
                const key = (e.event as KeyboardEvent | undefined)?.key;
                if (key === "Enter" || key === " ") {
                  (e.event as KeyboardEvent).preventDefault();
                  onSelect!(rowLabel(columns, e.data));
                }
              }
            : undefined
        }
        suppressMovableColumns
        animateRows={false}
      />
    </div>
  );
}
