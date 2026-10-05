"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  RATING_TONES,
  barShare,
  cellOf,
  columnMax,
  deltaView,
  dotIsBlank,
  flagEmoji,
  formatGridValue,
  heatTone,
  isColumnGroup,
  isNegativeCell,
  isNumericKind,
  leafColumns,
  sparkPoints,
  sparkPolyline,
  toneColor,
  valueTone,
  type GridCell,
  type GridColumn,
  type GridLeafColumn,
  type GridRow,
  type GridTone,
} from "@/lib/dataGridModel";
import { ArrowDown, ArrowUp } from "lucide-react";
import { GRID_HEADER_HEIGHT, GRID_ROW_HEIGHT } from "@/lib/panelMetrics";
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

/* A dense report grid: compact rows under a compact header. */
export { GRID_ROW_HEIGHT, GRID_HEADER_HEIGHT };
const ROW_HEIGHT = GRID_ROW_HEIGHT;
const HEADER_HEIGHT = GRID_HEADER_HEIGHT;
const FONT_SIZE = 12;
const HEADER_FONT_SIZE = 11;
const INDENT_STEP = 16;
const CELL_PADDING = 6;

const gridTheme = themeQuartz.withParams({
  /* Transparent, so the grid takes the surface it sits on (the panel). A
     second coat of a translucent surface token would lighten it: uoaui's
     glass surfaces showed the grid as a paler slab inside its panel. */
  backgroundColor: "transparent",
  foregroundColor: "var(--ds-fg)",
  headerBackgroundColor: "transparent",
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

/* ── Rich cells (GridCell): the same descriptions the export reads ── */

const SPARK_WIDTH = 56;
const SPARK_HEIGHT = 18;
const ARROW_SIZE = 12;

/** A tone as CSS custom properties on the element, so one class per cell
 *  kind covers every tone in every design system. */
const toneStyle = (tone: GridTone): React.CSSProperties => ({ "--dh-tone": toneColor(tone) }) as React.CSSProperties;

function Sparkline({ value, tone = "neutral" }: { value: unknown; tone?: GridTone }) {
  const points = sparkPolyline(sparkPoints(value), SPARK_WIDTH, SPARK_HEIGHT);
  if (!points) return null;
  return (
    <svg className="dh-cell-spark" style={toneStyle(tone)} width={SPARK_WIDTH} height={SPARK_HEIGHT} viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`} aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Arrow({ direction }: { direction: "up" | "down" }) {
  const Icon = direction === "up" ? ArrowUp : ArrowDown;
  return <Icon size={ARROW_SIZE} strokeWidth={2.2} aria-hidden="true" />;
}

/** What a rich cell draws. `text` is the column's formatted value. */
function RichCell({ cell, column, value, row, text, max }: { cell: GridCell; column: GridLeafColumn; value: unknown; row: GridRow | undefined; text: string; max: number }) {
  switch (cell.type) {
    case "bar": {
      const share = barShare(cell, value, max);
      return (
        <span className="dh-cell-bar" style={toneStyle(cell.tone ?? "accent")}>
          <span className="dh-cell-bar-track" aria-hidden="true">
            <span className="dh-cell-bar-fill" style={{ width: `${Math.round(share * 1000) / 10}%` }} />
          </span>
          <span className="dh-cell-bar-value">{text}</span>
        </span>
      );
    }
    case "deltaChip": {
      const d = deltaView(value, cell.upIsGood ?? true);
      if (!d || d.direction === "flat") return null;
      return (
        <span className="dh-cell-chip" style={toneStyle(d.tone)}>
          <Arrow direction={d.direction} />
          {d.direction === "up" ? "+" : "-"}
          {formatGridValue({ ...column, kind: column.kind ?? "number", decimals: column.decimals ?? 0 }, d.magnitude)}
        </span>
      );
    }
    case "delta": {
      const d = deltaView(value, cell.upIsGood ?? true);
      const spark = cell.sparkField ? <Sparkline value={row?.[cell.sparkField]} /> : null;
      if (!d) return spark;
      return (
        <span className="dh-cell-delta-wrap">
          {spark}
          <span className={`dh-cell-delta${d.direction === "flat" ? " is-flat" : ""}`} style={toneStyle(d.tone)}>
            {d.direction === "flat" ? null : <Arrow direction={d.direction} />}
            {formatGridValue(column, d.magnitude)}
          </span>
        </span>
      );
    }
    case "sparkline":
      return <Sparkline value={value} tone={cell.tone} />;
    case "badge": {
      if (value === null || value === undefined || value === "") return null;
      return <span className="dh-cell-badge" style={toneStyle(valueTone(cell.tones ?? RATING_TONES, value, cell.fallback ?? "bad"))}>{String(value)}</span>;
    }
    case "toneText": {
      const tone = valueTone(cell.tones, value);
      return <span className={`dh-cell-tonetext${tone === "neutral" ? " is-neutral" : ""}`} style={toneStyle(tone)}>{String(value ?? "")}</span>;
    }
    case "flag": {
      const flag = flagEmoji(value);
      return (
        <span className="dh-cell-flag">
          {flag ? <span aria-hidden="true">{flag}</span> : null}
          <span className="dh-cell-flag-code">{String(value ?? "")}</span>
        </span>
      );
    }
    case "rank":
      return <span className="dh-cell-rank">{text}</span>;
    case "dot": {
      if (dotIsBlank(cell, value)) return null;
      const tone = cell.tones ? valueTone(cell.tones, value, cell.tone ?? "neutral") : (cell.tone ?? "neutral");
      const hollow = cell.hollow?.includes(String(value));
      return (
        <span className={`dh-cell-dot${hollow ? " is-hollow" : ""}${tone !== "neutral" && cell.tones ? " is-strong" : ""}`} style={toneStyle(tone)}>
          <span className="dh-cell-dot-mark" aria-hidden="true" />
          {text}
        </span>
      );
    }
    case "chip": {
      if (value === null || value === undefined || value === "") return null;
      return (
        <span className={`dh-cell-tag${cell.variant === "solid" ? " is-solid" : ""}`} style={toneStyle(valueTone(cell.tones, value, cell.fallback ?? "neutral"))}>
          {text}
        </span>
      );
    }
    default:
      return <>{text}</>;
  }
}

function leafColDef(column: GridLeafColumn, isFirst: boolean, max: number, grouped: boolean): ColDef<GridRow> {
  const numeric = isNumericKind(column.kind);
  const cell = cellOf(column);
  /* A heat cell is ordinary text on a tinted background; every other rich
     cell replaces the cell's content. */
  const rendered = cell && cell.type !== "heat" ? cell : null;
  const leftAligned = rendered && (rendered.type === "bar" || rendered.type === "flag" || rendered.type === "toneText");
  /* A grid laid out as group headings keeps its order: sorting would
     scatter the rows away from their headings. */
  const sortable = !grouped;
  return {
    field: column.field,
    headerName: column.header,
    ...(column.width ? { width: column.width } : { flex: column.flex ?? 1, minWidth: column.minWidth ?? (numeric ? 88 : 120) }),
    pinned: column.pinned ? "left" : undefined,
    sortable,
    resizable: false,
    suppressMovable: true,
    type: numeric && !leftAligned ? "rightAligned" : undefined,
    valueFormatter: (params) => formatGridValue(column, params.value),
    ...(rendered
      ? {
          cellRenderer: (params: { value: unknown; data?: GridRow; valueFormatted?: string | null }) => (
            <RichCell cell={rendered} column={column} value={params.value} row={params.data} text={params.valueFormatted ?? formatGridValue(column, params.value)} max={max} />
          ),
        }
      : {}),
    /* Setting cellClass replaces the one the "rightAligned" type adds, so a
       numeric rich cell names it again. */
    cellClass: cell ? `dh-cell dh-cell-kind-${cell.type}${numeric && !leftAligned ? " ag-right-aligned-cell" : ""}` : undefined,
    cellStyle: (params) => {
      const tone = cell?.type === "heat" ? heatTone(cell, params.value) : null;
      return {
        fontVariantNumeric: "tabular-nums",
        fontWeight: params.data?._bold ? 600 : 400,
        ...(isNegativeCell(column, params.value) ? { color: "var(--ds-status-negative)" } : {}),
        ...(tone
          ? {
              /* A fixed mix over the surface, so the tint stays legible in
                 light and dark; the text leans towards the tone. */
              backgroundColor: `color-mix(in srgb, ${toneColor(tone)} 16%, transparent)`,
              color: `color-mix(in srgb, ${toneColor(tone)} 40%, var(--ds-fg))`,
            }
          : {}),
        ...(isFirst && typeof params.data?._indent === "number"
          ? { paddingLeft: `calc(var(--ag-cell-horizontal-padding) + ${params.data._indent * INDENT_STEP}px)` }
          : {}),
      };
    },
  };
}

function toColDefs(columns: GridColumn[], rows: GridRow[]): (ColDef<GridRow> | ColGroupDef<GridRow>)[] {
  let first = true;
  /* Bar cells scaled to the column need its largest value. */
  const maxOf = new Map<string, number>();
  for (const c of leafColumns(columns)) {
    const cell = cellOf(c);
    if (cell?.type === "bar" && cell.scale === "columnMax") maxOf.set(c.field, columnMax(rows, c.field));
  }
  const grouped = rows.some((r) => r._heading || (typeof r._indent === "number" && r._indent > 0));
  const leafColDefOf = (leaf: GridLeafColumn, isFirst: boolean) => leafColDef(leaf, isFirst, maxOf.get(leaf.field) ?? 0, grouped);
  return columns.map((c) => {
    if (isColumnGroup(c)) {
      return {
        headerName: c.header,
        marryChildren: true,
        headerClass: "dh-grid-group-header",
        children: c.children.map((leaf) => {
          const def = leafColDefOf(leaf, first);
          first = false;
          return def;
        }),
      };
    }
    const def = leafColDefOf(c, first);
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
  /** Fade the right edge while more columns lie to the right (a phone):
   *  only grids that ask for it (the workspace's own lists), and only until
   *  the reader has scrolled to the last column. */
  edgeFade?: boolean;
}

/** What a click on a row selects: the row itself, or the group a child row
 *  belongs to. */
function rowSelection(columns: GridColumn[], row: GridRow | undefined): string {
  return typeof row?._select === "string" ? row._select : rowLabel(columns, row);
}

/** A row's label: the value of the grid's first leaf column. */
function rowLabel(columns: GridColumn[], row: GridRow | undefined): string {
  /* The rank column ("#") counts rows; the label is the column after it. */
  const field = leafColumns(columns).find((c) => cellOf(c)?.type !== "rank")?.field;
  return field && row ? String(row[field] ?? "") : "";
}

/** Structural equality for the grid's plain data (columns and rows). */
function sameData(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    const other = b as unknown[];
    return a.length === other.length && a.every((v, i) => sameData(v, other[i]));
  }
  const x = a as Record<string, unknown>;
  const y = b as Record<string, unknown>;
  const keys = Object.keys(x);
  return keys.length === Object.keys(y).length && keys.every((k) => k in y && sameData(x[k], y[k]));
}

/**
 * The value last given, for as long as what arrives says the same thing.
 * A bound grid's columns and rows are derived again on every change of the
 * report state, as new arrays even when nothing in them changed (a row
 * selection changes the state and nothing in the selecting grid). Handed
 * to the grid as new data, every row and cell was destroyed and drawn
 * again, and the focused cell with them.
 */
function useSameData<T>(value: T): T {
  const [held, setHeld] = useState(value);
  if (held === value || sameData(held, value)) return held;
  setHeld(value);
  return value;
}

export function SimulatedDataGrid({ columns: givenColumns, rows: givenRows, height, label, selected, onSelect, edgeFade = false }: SimulatedDataGridProps) {
  const columns = useSameData(givenColumns);
  const rows = useSameData(givenRows);
  const columnDefs = useMemo(() => toColDefs(columns, rows), [columns, rows]);
  const apiRef = useRef<GridApi<GridRow> | null>(null);
  /* Row styling reads the latest selection through a ref, so the grid's
     callbacks stay stable. When the selection changes, only the two rows it
     concerns (the one that was selected, the one that is) are refreshed, in
     place: their classes are re-read and the cells stay the same elements.
     Redrawing every row (redrawRows) removed the focused cell for a moment,
     so focus fell to the page: the next arrow key did nothing, and Tab went
     back into the grid instead of leaving it. */
  const selectedRef = useRef(selected);
  useEffect(() => {
    const before = selectedRef.current;
    selectedRef.current = selected;
    if (before === selected) return;
    apiRef.current?.forEachNode((node) => {
      if (!node.data) return;
      const label = rowLabel(columns, node.data);
      if (label === before || label === selected) node.setData(node.data);
    });
  }, [selected, columns]);
  const rowClassRules = useMemo(
    () => ({
      /* The selected group's own row is marked, not the child rows under it. */
      "dh-grid-row-selected": (params: { data?: GridRow }) => Boolean(selectedRef.current) && params.data?._select === undefined && rowLabel(columns, params.data) === selectedRef.current,
      "dh-grid-row-group": (params: { data?: GridRow }) => Boolean(params.data?._heading),
    }),
    [columns],
  );
  const selectable = Boolean(onSelect);
  const readOnly = usePreviewReadOnly();
  /* More to the right: horizontal overflow not yet scrolled to its end. */
  const [moreRight, setMoreRight] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  /* Read from the rows' own viewport, so it is right however the grid was
     scrolled: the scrollbar, a wheel or trackpad, the keyboard. */
  const syncEdge = useCallback(() => {
    const viewport = rootRef.current?.querySelector<HTMLElement>(".ag-center-cols-viewport");
    if (!edgeFade || !viewport) return;
    setMoreRight(viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 1);
  }, [edgeFade]);
  /* Scroll events do not bubble: listen in the capture phase on the grid, so
     the scrollbar's own viewport and the rows' viewport both count. */
  useEffect(() => {
    const root = rootRef.current;
    if (!edgeFade || !root) return;
    root.addEventListener("scroll", syncEdge, { capture: true, passive: true });
    return () => root.removeEventListener("scroll", syncEdge, { capture: true });
  }, [edgeFade, syncEdge]);

  return (
    <div
      ref={rootRef}
      className={`dh-grid${selectable ? " dh-grid-selectable" : ""}${edgeFade && moreRight ? " dh-grid-more-right" : ""}`}
      style={{ height, width: "100%" }}
      role="region"
      aria-label={label}
      /* While presenting, a click in a selectable grid selects a ROW; it must
         not also select the block for the amend composer. (In Edit a click
         still selects the block, as everywhere else.) */
      onClick={readOnly ? (e) => e.stopPropagation() : undefined}
    >
      <AgGridReact<GridRow>
        theme={gridTheme}
        rowData={rows}
        columnDefs={columnDefs}
        rowClassRules={rowClassRules}
        onGridReady={(e) => { apiRef.current = e.api; syncEdge(); }}
        onBodyScroll={edgeFade ? syncEdge : undefined}
        onGridSizeChanged={edgeFade ? syncEdge : undefined}
        onFirstDataRendered={edgeFade ? syncEdge : undefined}
        onRowClicked={
          selectable
            ? (e) => onSelect!(rowSelection(columns, e.data))
            : undefined
        }
        /* Keyboard: a selectable grid keeps cell focus so Enter / Space on a
           focused row selects it. */
        // Arrow keys move within the grid; Tab leaves it instead of visiting
        // every cell. This also lets readers explore non-selectable reports.
        tabToNextCell={() => false}
        tabToNextHeader={() => false}
        onCellKeyDown={
          selectable
            ? (e) => {
                const key = (e.event as KeyboardEvent | undefined)?.key;
                if (key === "Enter" || key === " ") {
                  (e.event as KeyboardEvent).preventDefault();
                  onSelect!(rowSelection(columns, e.data));
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
