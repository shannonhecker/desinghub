"use client";

import React, { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type ColGroupDef,
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
  rowHoverColor: "var(--ds-surface-hover)",
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
    ...(column.width ? { width: column.width } : { flex: column.flex ?? 1, minWidth: numeric ? 88 : 120 }),
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
}

export function SimulatedDataGrid({ columns, rows, height, label }: SimulatedDataGridProps) {
  const columnDefs = useMemo(() => toColDefs(columns), [columns]);
  return (
    <div className="dh-grid" style={{ height, width: "100%" }} role="region" aria-label={label}>
      <AgGridReact<GridRow>
        theme={gridTheme}
        rowData={rows}
        columnDefs={columnDefs}
        suppressCellFocus
        suppressMovableColumns
        animateRows={false}
      />
    </div>
  );
}
