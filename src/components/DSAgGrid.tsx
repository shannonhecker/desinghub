"use client";

import React, { useMemo, useState, useCallback, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz, type ColDef } from "ag-grid-community";

/* Register AG Grid community modules once */
ModuleRegistry.registerModules([AllCommunityModule]);

/* ═══════════════════════════════════════════════════════════
   DSAgGrid — AG Grid themed with Salt DS, M3, or Fluent 2
   design tokens + column configuration panel.
   ═══════════════════════════════════════════════════════════ */

type DesignSystem = "salt" | "m3" | "fluent";

interface DSAgGridProps {
  system: DesignSystem;
  theme: Record<string, any>;
  height?: number;
}

/* ── Available columns for config panel ── */
interface ColumnConfig {
  field: string;
  headerName: string;
  visible: boolean;
  sortable: boolean;
  filter: boolean;
  flex: number;
}

const ALL_COLUMNS: ColumnConfig[] = [
  { field: "name", headerName: "Name", visible: true, sortable: true, filter: true, flex: 1.5 },
  { field: "role", headerName: "Role", visible: true, sortable: true, filter: true, flex: 1 },
  { field: "status", headerName: "Status", visible: true, sortable: true, filter: true, flex: 0.8 },
  { field: "revenue", headerName: "Revenue", visible: true, sortable: true, filter: false, flex: 1 },
  { field: "date", headerName: "Date", visible: true, sortable: true, filter: false, flex: 1 },
  { field: "email", headerName: "Email", visible: false, sortable: true, filter: true, flex: 1.5 },
  { field: "department", headerName: "Department", visible: false, sortable: true, filter: true, flex: 1 },
  { field: "location", headerName: "Location", visible: false, sortable: false, filter: false, flex: 1 },
];

/* ── Sample data ── */
const ROW_DATA = [
  { name: "Jane Doe", role: "Designer", status: "Active", revenue: "$12,400", date: "Apr 12", email: "jane@co.com", department: "Design", location: "NYC" },
  { name: "John Smith", role: "Developer", status: "Active", revenue: "$18,200", date: "Apr 11", email: "john@co.com", department: "Engineering", location: "SF" },
  { name: "Alice Chen", role: "PM", status: "Pending", revenue: "$9,800", date: "Apr 10", email: "alice@co.com", department: "Product", location: "LON" },
  { name: "Bob Wilson", role: "Analyst", status: "Active", revenue: "$15,600", date: "Apr 09", email: "bob@co.com", department: "Analytics", location: "NYC" },
  { name: "Carol Davis", role: "Designer", status: "Inactive", revenue: "$7,200", date: "Apr 08", email: "carol@co.com", department: "Design", location: "SF" },
  { name: "Dan Lee", role: "Developer", status: "Active", revenue: "$21,300", date: "Apr 07", email: "dan@co.com", department: "Engineering", location: "LON" },
  { name: "Eve Park", role: "PM", status: "Active", revenue: "$16,900", date: "Apr 06", email: "eve@co.com", department: "Product", location: "NYC" },
  { name: "Frank Ng", role: "Analyst", status: "Pending", revenue: "$11,400", date: "Apr 05", email: "frank@co.com", department: "Analytics", location: "SF" },
];

/* ── Map DS theme tokens → AG Grid theme params ── */
function buildAgTheme(system: DesignSystem, T: Record<string, any>) {
  if (system === "salt") {
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
      fontSize: 12,
      headerFontSize: 11,
      headerFontWeight: 600,
      spacing: 6,
      borderRadius: 4,
      wrapperBorderRadius: 4,
    });
  }
  if (system === "m3") {
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
      spacing: 8,
      borderRadius: 12,
      wrapperBorderRadius: 12,
    });
  }
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
    fontSize: 13,
    headerFontSize: 12,
    headerFontWeight: 600,
    spacing: 6,
    borderRadius: 4,
    wrapperBorderRadius: 4,
  });
}

/* ── DS-scoped style helpers ── */
function dsColors(system: DesignSystem, T: Record<string, any>) {
  return {
    accent: system === "salt" ? (T.accent || "#1B7F9E") : system === "m3" ? (T.primary || "#6750A4") : (T.brandBg || "#0F6CBD"),
    accentFg: system === "salt" ? (T.accentFg || "#fff") : system === "m3" ? (T.onPrimary || "#fff") : (T.fgOnBrand || "#fff"),
    accentWeak: system === "salt" ? (T.accentWeak || "rgba(27,127,158,0.12)") : system === "m3" ? (T.secondaryContainer || "#E8DEF8") : (T.subtleBgSelected || "#EBEBEB"),
    bg: system === "salt" ? (T.bg || "#101820") : system === "m3" ? (T.surface || "#FFFBFE") : (T.bg1 || "#fff"),
    bg2: system === "salt" ? (T.bg2 || "#1C2830") : system === "m3" ? (T.surfaceContainerLow || "#F7F2FA") : (T.bg2 || "#FAFAFA"),
    fg: system === "salt" ? (T.fg || "#E2E4E5") : system === "m3" ? (T.onSurface || "#1C1B1F") : (T.fg1 || "#242424"),
    fg2: system === "salt" ? (T.fg2 || "#B0B4B8") : system === "m3" ? (T.onSurfaceVariant || "#49454F") : (T.fg2 || "#616161"),
    fg3: system === "salt" ? (T.fg3 || "#808488") : system === "m3" ? (T.outline || "#79747E") : (T.fg3 || "#9E9E9E"),
    border: system === "salt" ? (T.border || "#3C4850") : system === "m3" ? (T.outlineVariant || "#CAC4D0") : (T.stroke2 || "#E0E0E0"),
    font: system === "salt" ? "Open Sans, sans-serif" : system === "m3" ? "Roboto, sans-serif" : "'Segoe UI', sans-serif",
    radius: system === "m3" ? 12 : 4,
  };
}

/* ═══════════════════════════════════════════════════════════ */

export function DSAgGrid({ system, theme: T, height = 360 }: DSAgGridProps) {
  const agTheme = useMemo(() => buildAgTheme(system, T), [system, T]);
  const c = useMemo(() => dsColors(system, T), [system, T]);
  const gridRef = useRef<AgGridReact>(null);

  const [columns, setColumns] = useState<ColumnConfig[]>(() => ALL_COLUMNS.map(col => ({ ...col })));
  const [configOpen, setConfigOpen] = useState(false);

  /* Derive AG Grid colDefs from config */
  const colDefs: ColDef[] = useMemo(() =>
    columns
      .filter(col => col.visible)
      .map(col => ({
        field: col.field,
        headerName: col.headerName,
        flex: col.flex,
        sortable: col.sortable,
        filter: col.filter,
      })),
    [columns]
  );

  const toggleColumn = useCallback((field: string) => {
    setColumns(prev => prev.map(col =>
      col.field === field ? { ...col, visible: !col.visible } : col
    ));
  }, []);

  const toggleSort = useCallback((field: string) => {
    setColumns(prev => prev.map(col =>
      col.field === field ? { ...col, sortable: !col.sortable } : col
    ));
  }, []);

  const toggleFilter = useCallback((field: string) => {
    setColumns(prev => prev.map(col =>
      col.field === field ? { ...col, filter: !col.filter } : col
    ));
  }, []);

  const moveColumn = useCallback((field: string, dir: -1 | 1) => {
    setColumns(prev => {
      const idx = prev.findIndex(col => col.field === field);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }, []);

  /* DS-scoped button class */
  const btnCls = system === "salt" ? "s-btn s-btn-bordered" : system === "m3" ? "m3-btn m3-btn-outlined" : "f-btn f-btn-secondary";
  const btnPrimaryCls = system === "salt" ? "s-btn s-btn-solid" : system === "m3" ? "m3-btn m3-btn-filled" : "f-btn f-btn-primary";

  return (
    <div style={{ fontFamily: c.font }}>
      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: c.fg }}>
          {ROW_DATA.length} records · {columns.filter(col => col.visible).length} columns
        </div>
        <button className={configOpen ? btnPrimaryCls : btnCls} onClick={() => setConfigOpen(!configOpen)}
          style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, padding: "4px 12px", height: "auto", minWidth: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>tune</span>
          Columns
        </button>
      </div>

      {/* Column config panel */}
      {configOpen && (
        <div style={{
          border: `1px solid ${c.border}`, borderRadius: c.radius, background: c.bg2,
          padding: 12, marginBottom: 8, maxHeight: 200, overflowY: "auto",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: c.fg2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Column Configuration
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {columns.map((col, idx) => (
              <div key={col.field} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "4px 8px",
                borderRadius: c.radius > 4 ? 8 : 4, background: col.visible ? c.accentWeak : "transparent",
                border: `1px solid ${col.visible ? c.accent + "30" : c.border}`,
              }}>
                {/* Visibility toggle */}
                <button onClick={() => toggleColumn(col.field)} style={{
                  width: 18, height: 18, borderRadius: 3, border: `1.5px solid ${col.visible ? c.accent : c.border}`,
                  background: col.visible ? c.accent : "transparent", color: c.accentFg,
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, flexShrink: 0,
                }}>
                  {col.visible && <span className="material-symbols-outlined" style={{ fontSize: 12 }}>check</span>}
                </button>

                {/* Column name */}
                <span style={{ flex: 1, fontSize: 12, color: c.fg, fontWeight: col.visible ? 600 : 400 }}>{col.headerName}</span>

                {/* Sort toggle */}
                <button onClick={() => toggleSort(col.field)} title={col.sortable ? "Disable sort" : "Enable sort"}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2, opacity: col.sortable ? 1 : 0.3 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: col.sortable ? c.accent : c.fg3 }}>sort</span>
                </button>

                {/* Filter toggle */}
                <button onClick={() => toggleFilter(col.field)} title={col.filter ? "Disable filter" : "Enable filter"}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2, opacity: col.filter ? 1 : 0.3 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: col.filter ? c.accent : c.fg3 }}>filter_list</span>
                </button>

                {/* Reorder */}
                <button onClick={() => moveColumn(col.field, -1)} disabled={idx === 0}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 1, opacity: idx === 0 ? 0.2 : 0.6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: c.fg3 }}>arrow_upward</span>
                </button>
                <button onClick={() => moveColumn(col.field, 1)} disabled={idx === columns.length - 1}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 1, opacity: idx === columns.length - 1 ? 0.2 : 0.6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: c.fg3 }}>arrow_downward</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AG Grid */}
      <div style={{ height, width: "100%" }}>
        <AgGridReact
          ref={gridRef}
          theme={agTheme}
          rowData={ROW_DATA}
          columnDefs={colDefs}
          rowSelection="multiple"
          animateRows
          pagination
          paginationPageSize={5}
        />
      </div>
    </div>
  );
}
