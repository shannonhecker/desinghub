"use client";

import React, { useMemo, useCallback, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type GridReadyEvent,
  type GridApi,
} from "ag-grid-community";

/* Register AG Grid community modules once */
ModuleRegistry.registerModules([AllCommunityModule]);

/* ═══════════════════════════════════════════════════════════
   DSAgGrid — AG Grid themed with Salt DS, M3, or Fluent 2
   design tokens. Uses AG Grid's native Community features:
   - Column header menus (sort, pin, autosize)
   - Drag-to-reorder columns in headers
   - Column resize handles
   - Built-in sorting, filtering, pagination
   ═══════════════════════════════════════════════════════════ */

type DesignSystem = "salt" | "m3" | "fluent" | "ausos";

interface DSAgGridProps {
  system: DesignSystem;
  theme: Record<string, any>;
  density?: string | number;
  height?: number;
}

/* ── Sample data ── */
const ROW_DATA = [
  { name: "Jane Doe", role: "Designer", status: "Active", revenue: 12400, date: "2026-04-12", email: "jane@co.com", department: "Design" },
  { name: "John Smith", role: "Developer", status: "Active", revenue: 18200, date: "2026-04-11", email: "john@co.com", department: "Engineering" },
  { name: "Alice Chen", role: "PM", status: "Pending", revenue: 9800, date: "2026-04-10", email: "alice@co.com", department: "Product" },
  { name: "Bob Wilson", role: "Analyst", status: "Active", revenue: 15600, date: "2026-04-09", email: "bob@co.com", department: "Analytics" },
  { name: "Carol Davis", role: "Designer", status: "Inactive", revenue: 7200, date: "2026-04-08", email: "carol@co.com", department: "Design" },
  { name: "Dan Lee", role: "Developer", status: "Active", revenue: 21300, date: "2026-04-07", email: "dan@co.com", department: "Engineering" },
  { name: "Eve Park", role: "PM", status: "Active", revenue: 16900, date: "2026-04-06", email: "eve@co.com", department: "Product" },
  { name: "Frank Ng", role: "Analyst", status: "Pending", revenue: 11400, date: "2026-04-05", email: "frank@co.com", department: "Analytics" },
];

/* ── Column definitions using AG Grid's native API ── */
const COLUMN_DEFS: ColDef[] = [
  {
    field: "name",
    headerName: "Name",
    flex: 1.5,
    filter: "agTextColumnFilter",
    pinned: "left" as const,
    checkboxSelection: true,
    headerCheckboxSelection: true,
  },
  {
    field: "role",
    headerName: "Role",
    flex: 1,
    filter: "agTextColumnFilter",
  },
  {
    field: "status",
    headerName: "Status",
    flex: 0.8,
    filter: "agTextColumnFilter",
    cellStyle: (params: any) => {
      if (params.value === "Active") return { color: "#1a7f37", fontWeight: 600 };
      if (params.value === "Pending") return { color: "#b45309", fontWeight: 600 };
      if (params.value === "Inactive") return { color: "#cf222e", fontWeight: 600 };
      return null;
    },
  },
  {
    field: "revenue",
    headerName: "Revenue",
    flex: 1,
    filter: "agNumberColumnFilter",
    valueFormatter: (params: any) => params.value ? `$${params.value.toLocaleString()}` : "",
  },
  {
    field: "date",
    headerName: "Date",
    flex: 1,
    filter: "agDateColumnFilter",
    valueFormatter: (params: any) => {
      if (!params.value) return "";
      const d = new Date(params.value);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    },
  },
  {
    field: "email",
    headerName: "Email",
    flex: 1.5,
    filter: "agTextColumnFilter",
    hide: true,
  },
  {
    field: "department",
    headerName: "Department",
    flex: 1,
    filter: "agTextColumnFilter",
    hide: true,
  },
];

/* ── Default column definition — AG Grid Community features ── */
const DEFAULT_COL_DEF: ColDef = {
  sortable: true,
  resizable: true,
  filter: true,
  floatingFilter: true,
  minWidth: 80,
};

/* ── Map DS theme tokens + density → AG Grid theme params ── */
function buildAgTheme(system: DesignSystem, T: Record<string, any>, density?: string | number) {
  /* Density-scaled values per DS */
  if (system === "salt") {
    const d = density as string || "medium";
    const scale = d === "high" ? { fs: 11, hFs: 10, sp: 4, rowH: 24 }
      : d === "low" ? { fs: 13, hFs: 12, sp: 8, rowH: 36 }
      : d === "touch" ? { fs: 14, hFs: 13, sp: 10, rowH: 44 }
      : { fs: 12, hFs: 11, sp: 6, rowH: 28 }; /* medium */
    return themeQuartz.withParams({
      accentColor: T.accent || "#1B7F9E",
      backgroundColor: T.bg || "#101820",
      foregroundColor: T.fg || "#E2E4E5",
      headerBackgroundColor: T.bg2 || "#1C2830",
      headerTextColor: T.fg2 || "#B0B4B8",
      borderColor: T.border || "#3C4850",
      rowHoverColor: T.bg2 || "#1C2830",
      selectedRowBackgroundColor: T.accentWeak || "rgba(27,127,158,0.12)",
      fontFamily: "Open Sans, sans-serif",
      fontSize: scale.fs,
      headerFontSize: scale.hFs,
      headerFontWeight: 600,
      spacing: scale.sp,
      borderRadius: 4,
      wrapperBorderRadius: 4,
      rowHeight: scale.rowH,
      headerHeight: scale.rowH + 4,
    });
  }
  if (system === "m3") {
    const d = (density as number) || 0;
    const offset = d * 4; /* M3 density: 0=default, -1=-4px, -2=-8px, -3=-12px */
    return themeQuartz.withParams({
      accentColor: T.primary || "#6750A4",
      backgroundColor: T.surface || "#FFFBFE",
      foregroundColor: T.onSurface || "#1C1B1F",
      headerBackgroundColor: T.surfaceContainerLow || T.surfaceContainer || "#F7F2FA",
      headerTextColor: T.onSurfaceVariant || "#49454F",
      borderColor: T.outlineVariant || "#CAC4D0",
      rowHoverColor: (T.primary || "#6750A4") + "14",
      selectedRowBackgroundColor: T.secondaryContainer || "#E8DEF8",
      fontFamily: "Roboto, sans-serif",
      fontSize: 14,
      headerFontSize: 12,
      headerFontWeight: 500,
      spacing: Math.max(4, 8 + offset),
      borderRadius: 12,
      wrapperBorderRadius: 12,
      rowHeight: Math.max(28, 40 + offset),
      headerHeight: Math.max(32, 44 + offset),
    });
  }
  /* ausos DS */
  if (system === "ausos") {
    const d = density as string || "medium";
    const scale = d === "high" ? { fs: 11, hFs: 10, sp: 6, rowH: 24 }
      : d === "low" ? { fs: 14, hFs: 12, sp: 10, rowH: 40 }
      : d === "touch" ? { fs: 15, hFs: 13, sp: 12, rowH: 48 }
      : { fs: 13, hFs: 12, sp: 8, rowH: 32 }; /* medium */
    return themeQuartz.withParams({
      accentColor: T.accent || "#A78BFA",
      backgroundColor: T.bg || "#0b1120",
      foregroundColor: T.fg || "#E8EAED",
      headerBackgroundColor: T.bg2 || "#0e1428",
      headerTextColor: T.fg3 || "#6B7280",
      borderColor: T.borderMd || "rgba(255,255,255,0.12)",
      rowHoverColor: T.surfaceHover || "rgba(255,255,255,0.10)",
      selectedRowBackgroundColor: T.accentSurface || "rgba(167,139,250,0.08)",
      fontFamily: "'Inter', 'DM Sans', sans-serif",
      fontSize: scale.fs,
      headerFontSize: scale.hFs,
      headerFontWeight: 500,
      spacing: scale.sp,
      borderRadius: 12,
      wrapperBorderRadius: 16,
      rowHeight: scale.rowH,
      headerHeight: scale.rowH + 6,
    });
  }
  /* Fluent 2 */
  const sz = density as string || "medium";
  const scale = sz === "small" ? { fs: 12, hFs: 11, sp: 4, rowH: 24 }
    : sz === "large" ? { fs: 14, hFs: 13, sp: 8, rowH: 40 }
    : { fs: 13, hFs: 12, sp: 6, rowH: 32 }; /* medium */
  return themeQuartz.withParams({
    accentColor: T.brandBg || "#0F6CBD",
    backgroundColor: T.bg1 || "#FFFFFF",
    foregroundColor: T.fg1 || "#242424",
    headerBackgroundColor: T.bg2 || "#FAFAFA",
    headerTextColor: T.fg2 || "#616161",
    borderColor: T.stroke2 || "#E0E0E0",
    rowHoverColor: T.subtleBgHover || "#F5F5F5",
    selectedRowBackgroundColor: T.subtleBgSelected || "#EBEBEB",
    fontFamily: "'Segoe UI', sans-serif",
    fontSize: scale.fs,
    headerFontSize: scale.hFs,
    headerFontWeight: 600,
    spacing: scale.sp,
    borderRadius: 4,
    wrapperBorderRadius: 4,
    rowHeight: scale.rowH,
    headerHeight: scale.rowH + 4,
  });
}

/* ── DS-scoped colors for toolbar ── */
function dsColors(system: DesignSystem, T: Record<string, any>) {
  return {
    accent: system === "salt" ? (T.accent || "#1B7F9E") : system === "m3" ? (T.primary || "#6750A4") : (T.brandBg || "#0F6CBD"),
    fg: system === "salt" ? (T.fg || "#E2E4E5") : system === "m3" ? (T.onSurface || "#1C1B1F") : (T.fg1 || "#242424"),
    fg2: system === "salt" ? (T.fg2 || "#B0B4B8") : system === "m3" ? (T.onSurfaceVariant || "#49454F") : (T.fg2 || "#616161"),
    fg3: system === "salt" ? (T.fg3 || "#808488") : system === "m3" ? (T.outline || "#79747E") : (T.fg3 || "#9E9E9E"),
    border: system === "salt" ? (T.border || "#3C4850") : system === "m3" ? (T.outlineVariant || "#CAC4D0") : (T.stroke2 || "#E0E0E0"),
    font: system === "salt" ? "Open Sans, sans-serif" : system === "m3" ? "Roboto, sans-serif" : "'Segoe UI', sans-serif",
  };
}

/* ═══════════════════════════════════════════════════════════ */

export function DSAgGrid({ system, theme: T, density, height = 400 }: DSAgGridProps) {
  const agTheme = useMemo(() => buildAgTheme(system, T, density), [system, T, density]);
  const c = useMemo(() => dsColors(system, T), [system, T]);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
  }, []);

  /* Toolbar actions using AG Grid API */
  const autoSizeAll = useCallback(() => {
    gridApi?.autoSizeAllColumns();
  }, [gridApi]);

  const resetColumns = useCallback(() => {
    gridApi?.resetColumnState();
  }, [gridApi]);

  const exportCsv = useCallback(() => {
    gridApi?.exportDataAsCsv();
  }, [gridApi]);

  /* DS button classes */
  const btnCls = system === "salt" ? "s-btn s-btn-bordered" : system === "m3" ? "m3-btn m3-btn-outlined" : "f-btn f-btn-secondary";

  return (
    <div style={{ fontFamily: c.font }}>
      {/* Toolbar — uses AG Grid API methods */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 8, flexWrap: "wrap", gap: 6,
      }}>
        <div style={{ fontSize: 12, color: c.fg2 }}>
          Drag column headers to reorder · Right-click header for options · Resize by dragging edges
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button className={btnCls} onClick={autoSizeAll}
            style={{ fontSize: 11, padding: "3px 10px", height: "auto", minWidth: 0, minHeight: 24, display: "flex", alignItems: "center", gap: 4 }}>
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 14 }}>fit_screen</span>
            Auto Size
          </button>
          <button className={btnCls} onClick={resetColumns}
            style={{ fontSize: 11, padding: "3px 10px", height: "auto", minWidth: 0, minHeight: 24, display: "flex", alignItems: "center", gap: 4 }}>
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 14 }}>restart_alt</span>
            Reset
          </button>
          <button className={btnCls} onClick={exportCsv}
            style={{ fontSize: 11, padding: "3px 10px", height: "auto", minWidth: 0, minHeight: 24, display: "flex", alignItems: "center", gap: 4 }}>
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 14 }}>download</span>
            CSV
          </button>
        </div>
      </div>

      {/* AG Grid — all column management via native AG Grid features */}
      <div style={{ height, width: "100%" }}>
        <AgGridReact
          theme={agTheme}
          rowData={ROW_DATA}
          columnDefs={COLUMN_DEFS}
          defaultColDef={DEFAULT_COL_DEF}
          rowSelection="multiple"
          animateRows
          pagination
          paginationPageSize={5}
          onGridReady={onGridReady}
          suppressDragLeaveHidesColumns
          rowDragManaged
        />
      </div>
    </div>
  );
}
