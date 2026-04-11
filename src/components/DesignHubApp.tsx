"use client";

import React from "react";
import Link from "next/link";
import { useDesignHub, type SystemId, type ActiveTab } from "@/store/useDesignHub";
import { getComponents, getCategories, getTheme, getFullCSS, getFont, getSystemInfo, activateTheme, getPreviews } from "@/data/registry";
import { ComponentPreview } from "./ComponentPreview";
import { CodePanel } from "./CodePanel";
import { TokenReference } from "./TokenReference";
import { ChartsPage } from "./ChartsPage";
import { AuditPanel } from "./AuditPanel";

// Helper: get token values by system so all UI uses the active DS
function useActiveTheme() {
  const store = useDesignHub();
  const { activeSystem } = store;
  const T = activeSystem === "salt"
    ? getTheme("salt", store.salt.themeKey)
    : activeSystem === "m3"
    ? getTheme("m3", store.m3.themeKey, store.m3.customColor, store.m3.isDarkCustom)
    : getTheme("fluent", store.fluent.themeKey);

  activateTheme(activeSystem, T);

  const densityOrSize = activeSystem === "salt" ? store.salt.density : activeSystem === "m3" ? store.m3.density : store.fluent.size;
  const css = getFullCSS(activeSystem, T, densityOrSize);
  const font = getFont(activeSystem);

  // Normalized token accessors
  const bg = activeSystem === "salt" ? T.bg : activeSystem === "m3" ? T.surface : T.bg1;
  const bg2 = activeSystem === "salt" ? T.bg2 : activeSystem === "m3" ? T.surfaceContainerLow : T.bg2;
  const bg3 = activeSystem === "salt" ? T.bg3 : activeSystem === "m3" ? T.surfaceContainer : T.bg3;
  const fg = activeSystem === "salt" ? T.fg : activeSystem === "m3" ? T.onSurface : T.fg1;
  const fg2 = activeSystem === "salt" ? T.fg2 : activeSystem === "m3" ? T.onSurfaceVariant : T.fg2;
  const fg3 = activeSystem === "salt" ? T.fg3 : activeSystem === "m3" ? T.outline : T.fg3;
  const accent = activeSystem === "salt" ? T.accent : activeSystem === "m3" ? T.primary : T.brandBg;
  const accentFg = activeSystem === "salt" ? T.accentFg : activeSystem === "m3" ? T.onPrimary : T.fgOnBrand;
  const accentWeak = activeSystem === "salt" ? T.accentWeak : activeSystem === "m3" ? T.primaryContainer : T.brandBg2;
  const accentText = activeSystem === "salt" ? (T.accentText || T.accent) : activeSystem === "m3" ? T.primary : T.brandFg1;
  const border = activeSystem === "salt" ? T.border : activeSystem === "m3" ? T.outlineVariant : T.stroke2;
  const borderStrong = activeSystem === "salt" ? T.borderStrong : activeSystem === "m3" ? T.outline : T.strokeAccessible;

  return { T, css, font, bg, bg2, bg3, fg, fg2, fg3, accent, accentFg, accentWeak, accentText, border, borderStrong, activeSystem, densityOrSize };
}

/* ── DS SWITCHER — uses active DS button classes ── */
function SystemSwitcher() {
  const { activeSystem, setActiveSystem } = useDesignHub();
  const theme = useActiveTheme();
  const systems: { id: SystemId; label: string }[] = [
    { id: "salt", label: "Salt DS" },
    { id: "m3", label: "Material 3" },
    { id: "fluent", label: "Fluent 2" },
  ];
  // Use the DS's own button classes
  const btnClass = activeSystem === "salt" ? "s-btn" : activeSystem === "m3" ? "m3-btn" : "f-btn";
  const activeClass = activeSystem === "salt" ? "s-btn-solid" : activeSystem === "m3" ? "m3-btn-filled" : "f-btn-primary";
  const inactiveClass = activeSystem === "salt" ? "s-btn-transparent" : activeSystem === "m3" ? "m3-btn-text" : "f-btn-subtle";

  return (
    <div style={{ display: "flex", gap: 4 }}>
      {systems.map((s) => (
        <button key={s.id} className={`${btnClass} ${activeSystem === s.id ? activeClass : inactiveClass}`}
          onClick={() => setActiveSystem(s.id)}
          style={{ minWidth: "auto", padding: "0 12px", height: activeSystem === "m3" ? 32 : undefined, fontSize: 12 }}>
          {s.label}
        </button>
      ))}
    </div>
  );
}

/* ── THEME CONTROLS — uses DS tokens for all colors ── */
function ThemeControls() {
  const store = useDesignHub();
  const { activeSystem } = store;
  const t = useActiveTheme();

  function CtrlBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
      <button onClick={onClick} style={{
        padding: "4px 10px", fontSize: 11, fontWeight: active ? 600 : 400, fontFamily: t.font,
        background: active ? t.accentWeak : "transparent", color: active ? t.accentText : t.fg3,
        border: `1px solid ${active ? t.accent + "40" : t.border}`, borderRadius: activeSystem === "m3" ? 20 : 4,
        cursor: "pointer", transition: "all 150ms",
      }}>
        {children}
      </button>
    );
  }

  function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div>
        <div style={{ fontSize: 10, textTransform: "uppercase", color: t.fg3, letterSpacing: 1, marginBottom: 4, fontWeight: 600 }}>{label}</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>{children}</div>
      </div>
    );
  }

  if (activeSystem === "salt") {
    const { salt, setSaltTheme, setSaltDensity } = store;
    const theme = salt.themeKey.includes("jpm") ? "jpm" : "legacy";
    const mode = salt.themeKey.includes("dark") ? "dark" : "light";
    const set = (th: string, m: string) => setSaltTheme(`${th}-${m}`);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 0" }}>
        <ControlGroup label="Theme">
          <CtrlBtn active={theme === "jpm"} onClick={() => set("jpm", mode)}>JPM Brand</CtrlBtn>
          <CtrlBtn active={theme === "legacy"} onClick={() => set("legacy", mode)}>Legacy</CtrlBtn>
        </ControlGroup>
        <ControlGroup label="Mode">
          <CtrlBtn active={mode === "light"} onClick={() => set(theme, "light")}>Light</CtrlBtn>
          <CtrlBtn active={mode === "dark"} onClick={() => set(theme, "dark")}>Dark</CtrlBtn>
        </ControlGroup>
        <ControlGroup label="Density">
          {(["high", "medium", "low", "touch"] as const).map(k => (
            <CtrlBtn key={k} active={salt.density === k} onClick={() => setSaltDensity(k)}>
              {k === "high" ? "H.20" : k === "medium" ? "M.28" : k === "low" ? "L.36" : "T.44"}
            </CtrlBtn>
          ))}
        </ControlGroup>
      </div>
    );
  }

  if (activeSystem === "m3") {
    const { m3, setM3Theme, setM3Density, setM3CustomColor, setM3DarkCustom } = store;
    const isDark = m3.themeKey.startsWith("dark");
    const contrast = m3.themeKey.includes("HighContrast") ? "high" : m3.themeKey.includes("MediumContrast") ? "medium" : "standard";
    const buildKey = (dark: boolean, c: string) => {
      if (m3.themeKey === "custom") return "custom";
      const prefix = dark ? "dark" : "light";
      if (c === "high") return `${prefix}HighContrast`;
      if (c === "medium") return `${prefix}MediumContrast`;
      return prefix;
    };
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 0" }}>
        <ControlGroup label="Mode">
          <CtrlBtn active={!isDark && m3.themeKey !== "custom"} onClick={() => setM3Theme(buildKey(false, contrast))}>Light</CtrlBtn>
          <CtrlBtn active={isDark && m3.themeKey !== "custom"} onClick={() => setM3Theme(buildKey(true, contrast))}>Dark</CtrlBtn>
          <CtrlBtn active={m3.themeKey === "custom"} onClick={() => setM3Theme("custom")}>Custom</CtrlBtn>
        </ControlGroup>
        {m3.themeKey !== "custom" && (
          <ControlGroup label="Contrast">
            <CtrlBtn active={contrast === "standard"} onClick={() => setM3Theme(buildKey(isDark, "standard"))}>Standard</CtrlBtn>
            <CtrlBtn active={contrast === "medium"} onClick={() => setM3Theme(buildKey(isDark, "medium"))}>Medium</CtrlBtn>
            <CtrlBtn active={contrast === "high"} onClick={() => setM3Theme(buildKey(isDark, "high"))}>High</CtrlBtn>
          </ControlGroup>
        )}
        {m3.themeKey === "custom" && (
          <ControlGroup label="Custom Color">
            <input type="color" value={m3.customColor} onChange={e => setM3CustomColor(e.target.value)}
              style={{ width: 32, height: 24, border: "none", cursor: "pointer", borderRadius: 4 }} />
            <span style={{ fontSize: 11, color: t.fg3, fontFamily: "monospace" }}>{m3.customColor}</span>
            <CtrlBtn active={m3.isDarkCustom} onClick={() => setM3DarkCustom(!m3.isDarkCustom)}>{m3.isDarkCustom ? "Dark" : "Light"}</CtrlBtn>
          </ControlGroup>
        )}
        <ControlGroup label="Density">
          {[0, -1, -2, -3].map(d => (
            <CtrlBtn key={d} active={m3.density === d} onClick={() => setM3Density(d)}>{d === 0 ? "Default" : `${d}`}</CtrlBtn>
          ))}
        </ControlGroup>
      </div>
    );
  }

  const { fluent, setFluentTheme, setFluentSize } = store;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 0" }}>
      <ControlGroup label="Theme">
        <CtrlBtn active={fluent.themeKey === "light"} onClick={() => setFluentTheme("light")}>Light</CtrlBtn>
        <CtrlBtn active={fluent.themeKey === "dark"} onClick={() => setFluentTheme("dark")}>Dark</CtrlBtn>
      </ControlGroup>
      <ControlGroup label="Size">
        {([["small","S.24"],["medium","M.32"],["large","L.40"]] as const).map(([k,l]) => (
          <CtrlBtn key={k} active={fluent.size === k} onClick={() => setFluentSize(k)}>{l}</CtrlBtn>
        ))}
      </ControlGroup>
    </div>
  );
}

/* ── COMPONENT LIST — uses DS sidebar-item classes ── */
function ComponentList() {
  const { activeSystem, selectedComponent, setSelectedComponent, searchQuery, setSearchQuery } = useDesignHub();
  const t = useActiveTheme();
  const components = getComponents(activeSystem);
  const categories = getCategories(activeSystem);

  const filtered = searchQuery
    ? components.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.desc.toLowerCase().includes(searchQuery.toLowerCase()))
    : components;
  const grouped = categories.map(cat => ({ cat, items: filtered.filter(c => c.cat === cat) })).filter(g => g.items.length > 0);

  // Use the DS's own input and sidebar-item classes
  const inputClass = activeSystem === "salt" ? "s-input" : activeSystem === "m3" ? "" : "f-input";
  const itemClass = activeSystem === "salt" ? "s-sidebar-item" : activeSystem === "m3" ? "" : "f-sidebar-item";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
        className={inputClass}
        style={{
          background: t.bg2, color: t.fg, border: `1px solid ${t.border}`,
          borderRadius: activeSystem === "m3" ? 28 : 4, padding: "6px 10px", fontSize: 12,
          fontFamily: t.font, outline: "none", marginBottom: 8, width: "100%",
          ...(activeSystem === "m3" ? { height: 36, borderBottom: `1px solid ${t.border}` } : {}),
        }}
      />
      {grouped.map(g => (
        <div key={g.cat}>
          <div style={{ fontSize: 10, textTransform: "uppercase", color: t.fg3, letterSpacing: "0.06em", padding: "8px 0 4px", fontWeight: 700 }}>{g.cat}</div>
          {g.items.map(c => (
            <button key={c.id}
              className={itemClass + (selectedComponent === c.id ? " active" : "")}
              onClick={() => setSelectedComponent(selectedComponent === c.id ? null : c.id)}
              style={{
                display: "block", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: t.font,
                // M3 doesn't have a sidebar-item class, so style inline
                ...(activeSystem === "m3" ? {
                  padding: "8px 12px", borderRadius: 28, border: "none", fontSize: 13,
                  background: selectedComponent === c.id ? t.accentWeak : "transparent",
                  color: selectedComponent === c.id ? t.accentText : t.fg2,
                  fontWeight: selectedComponent === c.id ? 600 : 400,
                  transition: "all 150ms",
                } : {}),
              }}
            >{c.name}</button>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── TAB BAR — uses DS tab classes ── */
function TabBar() {
  const { activeTab, setActiveTab } = useDesignHub();
  const t = useActiveTheme();
  const { activeSystem } = useDesignHub();
  const tabs: { id: ActiveTab; label: string }[] = [
    { id: "preview", label: "Preview" },
    { id: "code", label: "Code" },
    { id: "tokens", label: "Tokens" },
    { id: "charts", label: "Charts" },
    { id: "audit", label: "Audit" },
  ];

  const tabClass = activeSystem === "salt" ? "s-tab" : activeSystem === "m3" ? "m3-tab" : "f-tab";

  return (
    <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${t.border}`, background: t.bg }}>
      {tabs.map(tab => (
        <button key={tab.id} className={`${tabClass} ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => setActiveTab(tab.id)} style={{ fontFamily: t.font }}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ── LANDING GRID — uses DS card classes ── */
function LandingGrid() {
  const store = useDesignHub();
  const { activeSystem, setSelectedComponent } = store;
  const t = useActiveTheme();
  const components = getComponents(activeSystem);
  const categories = getCategories(activeSystem);
  const sysInfo = getSystemInfo(activeSystem);
  const previews = getPreviews(activeSystem);

  const cardClass = activeSystem === "salt" ? "s-card" : activeSystem === "m3" ? "m3-card m3-card-outlined" : "f-card";

  return (
    <div style={{ padding: 24, fontFamily: t.font }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: t.fg, marginBottom: 4 }}>{sysInfo.name}</h1>
        <p style={{ fontSize: 14, color: t.fg3 }}>{sysInfo.org} — {components.length} components across {categories.length} categories</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {components.map(c => {
          const Preview = previews[c.id];
          return (
            <button key={c.id} className={cardClass} onClick={() => setSelectedComponent(c.id)}
              style={{ width: "100%", textAlign: "left", padding: 14, fontFamily: t.font }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.fg }}>{c.name}</div>
              <div style={{ fontSize: 10, color: t.fg3, marginTop: 2 }}>{c.cat}</div>
              {Preview && <div style={{ pointerEvents: "none", marginTop: 4 }}><Preview /></div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── MAIN CONTENT ── */
function MainContent() {
  const { activeTab, selectedComponent, activeSystem } = useDesignHub();
  if (activeTab === "tokens") return <TokenReference />;
  if (activeTab === "charts") return <ChartsPage />;
  if (activeTab === "audit") return <AuditPanel />;
  if (!selectedComponent) return <LandingGrid />;
  const components = getComponents(activeSystem);
  if (!components.find(c => c.id === selectedComponent)) return <LandingGrid />;
  if (activeTab === "code") return <CodePanel componentId={selectedComponent} />;
  return <ComponentPreview componentId={selectedComponent} />;
}

/* ── MAIN APP — fully themed by active DS ── */
export function DesignHubApp() {
  const store = useDesignHub();
  const { sidebarOpen, toggleSidebar, activeSystem } = store;
  const t = useActiveTheme();
  const sysInfo = getSystemInfo(activeSystem);

  // DS-specific sidebar item class for the toggle button
  const btnClass = activeSystem === "salt" ? "s-btn s-btn-transparent" : activeSystem === "m3" ? "m3-btn m3-btn-text" : "f-btn f-btn-subtle";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: t.bg2, fontFamily: t.font, color: t.fg, transition: "background 200ms, color 200ms" }}>
      {/* Inject the DS CSS */}
      <style dangerouslySetInnerHTML={{ __html: t.css }} />

      {/* Header — uses DS background and border tokens */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 16px", borderBottom: `1px solid ${t.border}`, background: t.bg,
        minHeight: 44, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className={btnClass} onClick={toggleSidebar}
            style={{ minWidth: "auto", width: 32, height: 32, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
            {sidebarOpen ? "◁" : "▷"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 24, height: 24, borderRadius: activeSystem === "m3" ? 8 : 4,
              background: t.accent, display: "flex", alignItems: "center", justifyContent: "center",
              color: t.accentFg, fontWeight: 700, fontSize: 12,
            }}>
              {sysInfo.icon}
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, color: t.fg }}>Design Hub</span>
          </div>
          <SystemSwitcher />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 11, color: t.accentText, background: t.accentWeak,
            padding: "3px 10px", borderRadius: activeSystem === "m3" ? 16 : 8, fontWeight: 600,
          }}>
            {t.T.name || sysInfo.name}
          </span>
          <Link href="/builder" style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 12, fontWeight: 600, color: "#fff",
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            padding: "5px 14px", borderRadius: 8, textDecoration: "none",
            boxShadow: "0 0 12px rgba(124,58,237,0.3)",
            transition: "box-shadow 200ms, transform 200ms",
          }}>
            AI Builder
          </Link>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar — uses DS background, border, and navigation tokens */}
        {sidebarOpen && (
          <aside style={{
            width: 240, borderRight: `1px solid ${t.border}`, background: t.bg,
            display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0,
            transition: "background 200ms",
          }}>
            <div style={{ padding: "12px 14px", overflowY: "auto", flex: 1 }}>
              <ThemeControls />
              <div style={{ height: 1, background: t.border, margin: "8px 0" }} />
              <ComponentList />
            </div>
          </aside>
        )}

        {/* Main */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: t.bg2 }}>
          <TabBar />
          <div style={{ flex: 1, overflowY: "auto" }}>
            <MainContent />
          </div>
        </main>
      </div>
    </div>
  );
}
