"use client";

import React, { useState, useMemo } from "react";
import { useDesignHub, type SystemId, type ActiveTab } from "@/store/useDesignHub";
import { getComponents, getCategories, getTheme, getFullCSS, getFont, getSystemInfo } from "@/data/registry";
import { ComponentPreview } from "./ComponentPreview";
import { CodePanel } from "./CodePanel";
import { TokenReference } from "./TokenReference";
import { ChartsPage } from "./ChartsPage";
import { AuditPanel } from "./AuditPanel";

/* ── SYSTEM SWITCHER TABS ── */
function SystemSwitcher() {
  const { activeSystem, setActiveSystem } = useDesignHub();
  const systems: { id: SystemId; label: string; color: string }[] = [
    { id: "salt", label: "Salt DS", color: "#1B7F9E" },
    { id: "m3", label: "Material 3", color: "#6750A4" },
    { id: "fluent", label: "Fluent 2", color: "#0F6CBD" },
  ];
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {systems.map((s) => (
        <button
          key={s.id}
          onClick={() => setActiveSystem(s.id)}
          style={{
            padding: "6px 16px",
            background: activeSystem === s.id ? s.color : "transparent",
            color: activeSystem === s.id ? "#fff" : "#a0a0b0",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: activeSystem === s.id ? 600 : 400,
            fontSize: 13,
            fontFamily: "inherit",
            transition: "all 150ms",
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

/* ── THEME CONTROLS ── */
function ThemeControls() {
  const store = useDesignHub();
  const { activeSystem } = store;

  if (activeSystem === "salt") {
    const { salt, setSaltTheme, setSaltDensity } = store;
    const theme = salt.themeKey.includes("jpm") ? "jpm" : "legacy";
    const mode = salt.themeKey.includes("dark") ? "dark" : "light";
    const setThemeMode = (t: string, m: string) => setSaltTheme(`${t}-${m}`);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 0" }}>
        <ControlGroup label="Theme">
          {["jpm", "legacy"].map((t) => (
            <CtrlBtn key={t} active={theme === t} onClick={() => setThemeMode(t, mode)}>
              {t === "jpm" ? "JPM Brand" : "Legacy"}
            </CtrlBtn>
          ))}
        </ControlGroup>
        <ControlGroup label="Mode">
          {["light", "dark"].map((m) => (
            <CtrlBtn key={m} active={mode === m} onClick={() => setThemeMode(theme, m)}>
              {m === "light" ? "Light" : "Dark"}
            </CtrlBtn>
          ))}
        </ControlGroup>
        <ControlGroup label="Density">
          {[
            { k: "high", l: "H.20" }, { k: "medium", l: "M.28" },
            { k: "low", l: "L.36" }, { k: "touch", l: "T.44" },
          ].map((d) => (
            <CtrlBtn key={d.k} active={salt.density === d.k} onClick={() => setSaltDensity(d.k)}>
              {d.l}
            </CtrlBtn>
          ))}
        </ControlGroup>
      </div>
    );
  }

  if (activeSystem === "m3") {
    const { m3, setM3Theme, setM3Density, setM3CustomColor, setM3DarkCustom } = store;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 0" }}>
        <ControlGroup label="Palette">
          <select
            value={m3.themeKey}
            onChange={(e) => setM3Theme(e.target.value)}
            style={{
              background: "#1a1a2e", color: "#e0e0e0", border: "1px solid #2a2a4a",
              borderRadius: 4, padding: "4px 8px", fontSize: 12, fontFamily: "inherit",
            }}
          >
            {["light", "dark", "lightMediumContrast", "lightHighContrast", "darkMediumContrast", "darkHighContrast", "custom"].map((k) => (
              <option key={k} value={k}>{k === "custom" ? "Custom" : k.replace(/([A-Z])/g, " $1").trim()}</option>
            ))}
          </select>
        </ControlGroup>
        {m3.themeKey === "custom" && (
          <ControlGroup label="Custom Color">
            <input
              type="color" value={m3.customColor}
              onChange={(e) => setM3CustomColor(e.target.value)}
              style={{ width: 32, height: 24, border: "none", cursor: "pointer", borderRadius: 4 }}
            />
            <span style={{ fontSize: 11, color: "#a0a0b0", fontFamily: "monospace" }}>{m3.customColor}</span>
            <CtrlBtn active={m3.isDarkCustom} onClick={() => setM3DarkCustom(!m3.isDarkCustom)}>
              {m3.isDarkCustom ? "Dark" : "Light"}
            </CtrlBtn>
          </ControlGroup>
        )}
        <ControlGroup label="Density">
          {[0, -1, -2, -3].map((d) => (
            <CtrlBtn key={d} active={m3.density === d} onClick={() => setM3Density(d)}>
              {d === 0 ? "Default" : `${d}`}
            </CtrlBtn>
          ))}
        </ControlGroup>
      </div>
    );
  }

  // Fluent
  const { fluent, setFluentTheme, setFluentSize } = store;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 0" }}>
      <ControlGroup label="Theme">
        {["light", "dark"].map((t) => (
          <CtrlBtn key={t} active={fluent.themeKey === t} onClick={() => setFluentTheme(t)}>
            {t === "light" ? "Light" : "Dark"}
          </CtrlBtn>
        ))}
      </ControlGroup>
      <ControlGroup label="Size">
        {[
          { k: "small", l: "S.24" }, { k: "medium", l: "M.32" }, { k: "large", l: "L.40" },
        ].map((s) => (
          <CtrlBtn key={s.k} active={fluent.size === s.k} onClick={() => setFluentSize(s.k)}>
            {s.l}
          </CtrlBtn>
        ))}
      </ControlGroup>
    </div>
  );
}

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, textTransform: "uppercase", color: "#707080", letterSpacing: 1, marginBottom: 4, fontWeight: 600 }}>{label}</div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>{children}</div>
    </div>
  );
}

function CtrlBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 10px", fontSize: 11, fontWeight: active ? 600 : 400, fontFamily: "inherit",
        background: active ? "#4fc3f720" : "transparent", color: active ? "#4fc3f7" : "#a0a0b0",
        border: `1px solid ${active ? "#4fc3f740" : "#2a2a4a"}`, borderRadius: 4, cursor: "pointer",
        transition: "all 150ms",
      }}
    >
      {children}
    </button>
  );
}

/* ── COMPONENT LIST ── */
function ComponentList() {
  const { activeSystem, selectedComponent, setSelectedComponent, searchQuery, setSearchQuery } = useDesignHub();
  const components = getComponents(activeSystem);
  const categories = getCategories(activeSystem);

  const filtered = searchQuery
    ? components.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.desc.toLowerCase().includes(searchQuery.toLowerCase()))
    : components;

  const grouped = categories.map((cat) => ({
    cat,
    items: filtered.filter((c) => c.cat === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <input
        type="text"
        placeholder="Search components..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          background: "#0f1629", color: "#e0e0e0", border: "1px solid #2a2a4a",
          borderRadius: 4, padding: "6px 10px", fontSize: 12, fontFamily: "inherit",
          outline: "none", marginBottom: 8,
        }}
      />
      {grouped.map((g) => (
        <div key={g.cat}>
          <div style={{ fontSize: 10, textTransform: "uppercase", color: "#707080", letterSpacing: 1, padding: "8px 0 4px", fontWeight: 600 }}>
            {g.cat}
          </div>
          {g.items.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedComponent(selectedComponent === c.id ? null : c.id)}
              style={{
                display: "block", width: "100%", padding: "5px 10px", borderRadius: 4,
                border: "none", background: selectedComponent === c.id ? "#4fc3f718" : "transparent",
                color: selectedComponent === c.id ? "#4fc3f7" : "#a0a0b0",
                fontWeight: selectedComponent === c.id ? 600 : 400,
                cursor: "pointer", fontFamily: "inherit", fontSize: 12, textAlign: "left",
                transition: "all 100ms",
              }}
              onMouseEnter={(e) => { if (selectedComponent !== c.id) (e.target as HTMLElement).style.background = "#ffffff08"; }}
              onMouseLeave={(e) => { if (selectedComponent !== c.id) (e.target as HTMLElement).style.background = "transparent"; }}
            >
              {c.name}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── TAB BAR ── */
function TabBar() {
  const { activeTab, setActiveTab, selectedComponent } = useDesignHub();
  const tabs: { id: ActiveTab; label: string }[] = [
    { id: "preview", label: "Preview" },
    { id: "code", label: "Code" },
    { id: "tokens", label: "Tokens" },
    { id: "charts", label: "Charts" },
    { id: "audit", label: "Audit" },
  ];
  return (
    <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #2a2a4a" }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setActiveTab(t.id)}
          style={{
            padding: "8px 18px", fontSize: 13, fontWeight: activeTab === t.id ? 600 : 400,
            color: activeTab === t.id ? "#4fc3f7" : "#707080", background: "none", border: "none",
            borderBottom: activeTab === t.id ? "2px solid #4fc3f7" : "2px solid transparent",
            cursor: "pointer", fontFamily: "inherit", transition: "all 150ms",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ── LANDING GRID ── */
function LandingGrid() {
  const { activeSystem, setSelectedComponent } = useDesignHub();
  const components = getComponents(activeSystem);
  const categories = getCategories(activeSystem);
  const sysInfo = getSystemInfo(activeSystem);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
          {sysInfo.name}
        </h1>
        <p style={{ fontSize: 14, color: "#707080" }}>
          {sysInfo.org} — {components.length} components across {categories.length} categories
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {components.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedComponent(c.id)}
            style={{
              background: "#16213e", border: "1px solid #2a2a4a", borderRadius: 8,
              padding: 16, cursor: "pointer", textAlign: "left", transition: "all 150ms",
              outline: "none",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = sysInfo.color; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2a2a4a"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
          >
            <div style={{ fontSize: 10, textTransform: "uppercase", color: sysInfo.color, letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>
              {c.cat}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#e0e0e0", marginBottom: 4 }}>
              {c.name}
            </div>
            <div style={{ fontSize: 11, color: "#707080", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {c.desc}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── MAIN CONTENT ── */
function MainContent() {
  const { activeTab, selectedComponent, activeSystem } = useDesignHub();

  // Global tabs (tokens, charts, audit) render regardless of selected component
  if (activeTab === "tokens") return <TokenReference />;
  if (activeTab === "charts") return <ChartsPage />;
  if (activeTab === "audit") return <AuditPanel />;

  // Preview and Code need a selected component
  if (!selectedComponent) return <LandingGrid />;

  const components = getComponents(activeSystem);
  const comp = components.find((c) => c.id === selectedComponent);
  if (!comp) return <LandingGrid />;

  if (activeTab === "code") return <CodePanel componentId={selectedComponent} />;

  return <ComponentPreview componentId={selectedComponent} />;
}

/* ── MAIN APP ── */
export function DesignHubApp() {
  const { sidebarOpen, toggleSidebar, activeSystem } = useDesignHub();
  const sysInfo = getSystemInfo(activeSystem);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#1a1a2e" }}>
      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px", borderBottom: "1px solid #2a2a4a", background: "#0f1629",
        minHeight: 48, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={toggleSidebar} style={{
            background: "none", border: "none", color: "#a0a0b0", cursor: "pointer",
            fontSize: 18, padding: "2px 6px", borderRadius: 4,
          }}>
            {sidebarOpen ? "◁" : "▷"}
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: -0.3 }}>
            Design Hub
          </span>
          <SystemSwitcher />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 11, color: sysInfo.color, background: `${sysInfo.color}18`,
            padding: "3px 10px", borderRadius: 12, fontWeight: 600,
          }}>
            {sysInfo.name}
          </span>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        {sidebarOpen && (
          <aside style={{
            width: 240, borderRight: "1px solid #2a2a4a", background: "#0f1629",
            display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0,
          }}>
            <div style={{ padding: "12px 14px", overflowY: "auto", flex: 1 }}>
              <ThemeControls />
              <div style={{ height: 1, background: "#2a2a4a", margin: "8px 0" }} />
              <ComponentList />
            </div>
          </aside>
        )}

        {/* Main */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <TabBar />
          <div style={{ flex: 1, overflowY: "auto" }}>
            <MainContent />
          </div>
        </main>
      </div>
    </div>
  );
}
