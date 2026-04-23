"use client";

import React, { useState } from "react";
import { useDesignHub, type ActiveTab } from "@/store/useDesignHub";
import { useTheme } from "@/contexts/ThemeContext";
import { getComponents, getCategories } from "@/data/registry";
import { COMPONENT_SUBCATS, SUBCAT_ORDER } from "@/data/componentCategories";

export function ComponentList() {
  const activeSystem = useDesignHub((s) => s.activeSystem);
  const selectedComponent = useDesignHub((s) => s.selectedComponent);
  const setSelectedComponent = useDesignHub((s) => s.setSelectedComponent);
  const searchQuery = useDesignHub((s) => s.searchQuery);
  const t = useTheme();
  const components = getComponents(activeSystem);
  const categories = getCategories(activeSystem);

  const filtered = searchQuery
    ? components.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.desc.toLowerCase().includes(searchQuery.toLowerCase()))
    : components;

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set(["Foundations", "Tools", "Patterns", ...SUBCAT_ORDER]));
  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group); else next.add(group);
      return next;
    });
  };

  const itemClass = activeSystem === "salt" ? "s-sidebar-item"
    : activeSystem === "m3" ? "m3-menu-item"
    : activeSystem === "fluent" ? "f-sidebar-item"
    : activeSystem === "carbon" ? "cb-sidenav-item"
    : "a-sidebar-item";

  const activeItemStyle = (active: boolean, isChild = false): React.CSSProperties => {
    const indent = isChild ? (activeSystem === "m3" ? 12 : 8) : 0;
    if (activeSystem === "m3") {
      return active
        ? { background: t.accentWeak, color: t.accentText, fontWeight: 500, borderRadius: 28, padding: `${t.scale.gap}px ${t.scale.gap + 10}px`, fontSize: t.scale.navF, border: "none", minHeight: t.scale.navH, marginLeft: indent }
        : { borderRadius: 28, padding: `${t.scale.gap}px ${t.scale.gap + 10}px`, fontSize: t.scale.navF, border: "none", background: "transparent", color: t.fg, minHeight: t.scale.navH, marginLeft: indent };
    }
    if (activeSystem === "fluent") {
      return active
        ? { fontSize: t.scale.navF, fontWeight: 600, color: t.accentText, background: t.accentWeak, borderRadius: 4, paddingLeft: t.scale.gap + 6, marginLeft: indent }
        : { fontSize: t.scale.navF, color: t.fg, paddingLeft: t.scale.gap + 6, marginLeft: indent };
    }
    if (activeSystem === "ausos") {
      return active
        ? { fontSize: t.scale.navF, fontWeight: 600, color: t.accent, background: t.accentWeak, borderRadius: 6, paddingLeft: t.scale.gap + 6, marginLeft: indent, border: "none" }
        : { fontSize: t.scale.navF, color: t.fg2, paddingLeft: t.scale.gap + 6, marginLeft: indent, border: "none" };
    }
    if (activeSystem === "carbon") {
      /* Carbon side-nav mirrors carbondesignsystem.com's left-border
         active indicator: 3px $interactive border-left, $text-primary
         text (SemiBold when active), $layer-hover background.
         Inactive items have a 3px transparent border so active/inactive
         don't shift horizontally. */
      return active
        ? { fontSize: 14, fontWeight: 600, color: t.fg, background: t.T.layerHover01 ?? t.bg2, borderLeft: `3px solid ${t.accent}`, borderRadius: 0, padding: "10px 16px", marginLeft: 0, paddingLeft: 16 + indent }
        : { fontSize: 14, fontWeight: 400, color: t.fg2, borderLeft: "3px solid transparent", borderRadius: 0, padding: "10px 16px", marginLeft: 0, paddingLeft: 16 + indent };
    }
    return active
      ? { fontSize: t.scale.navF, fontWeight: 600, color: t.accentText, background: t.accentWeak, borderLeft: `3px solid ${t.accent}`, borderRadius: "0 4px 4px 0", paddingLeft: t.scale.gap + 4, marginLeft: indent }
      : { fontSize: t.scale.navF, color: t.fg, borderLeft: "3px solid transparent", paddingLeft: t.scale.gap + 4, marginLeft: indent };
  };

  const sectionHeaderStyle: React.CSSProperties = activeSystem === "m3"
    ? { fontSize: t.scale.labF, fontWeight: 500, color: t.fg2, letterSpacing: "0.5px", padding: `${t.scale.gap + 4}px 16px ${t.scale.gap - 4}px`, textTransform: "uppercase" }
    : { fontSize: t.scale.labF, textTransform: "uppercase", color: t.fg2, letterSpacing: "0.06em", padding: `${t.scale.gap}px 0 ${t.scale.gap - 2}px`, fontWeight: 700 };

  const groupHeaderStyle = (expanded: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
    background: "none", border: "none", cursor: "pointer",
    padding: activeSystem === "m3" ? `${t.scale.gap}px 16px` : `${t.scale.gap}px 0`,
    fontSize: t.scale.navF - 1, fontWeight: 600, color: t.fg2, fontFamily: t.font,
  });

  const renderItem = (c: { id: string; name: string }, isChild = false) => (
    <button key={c.id}
      className={itemClass + (selectedComponent === c.id ? " active" : "")}
      onClick={() => setSelectedComponent(selectedComponent === c.id ? null : c.id)}
      style={{ display: "flex", alignItems: "center", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: t.font, ...activeItemStyle(selectedComponent === c.id, isChild) }}
    >{c.name}</button>
  );

  const TOOL_IDS = new Set(["tokens", "audit"]);
  const foundationItems = filtered.filter(c => c.cat === "Foundations" && !TOOL_IDS.has(c.id));
  const toolItems = filtered.filter(c => c.cat === "Foundations" && TOOL_IDS.has(c.id));
  const componentItems = filtered.filter(c => c.cat === "Components & Patterns");

  const helperStyle: React.CSSProperties = {
    fontSize: 10, color: t.fg3, letterSpacing: "0.04em",
    padding: activeSystem === "m3" ? "0 16px 4px" : "0 0 4px",
    fontWeight: 400,
  };
  const subcatGroups = SUBCAT_ORDER
    .map(sub => ({ sub, items: componentItems.filter(c => COMPONENT_SUBCATS[c.id] === sub).sort((a, b) => a.name.localeCompare(b.name)) }))
    .filter(g => g.items.length > 0);
  const mappedIds = new Set(componentItems.filter(c => COMPONENT_SUBCATS[c.id]).map(c => c.id));
  const uncategorized = componentItems.filter(c => !mappedIds.has(c.id)).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {foundationItems.length > 0 && (
        <div>
          <button onClick={() => toggleGroup("Foundations")} aria-expanded={expandedGroups.has("Foundations")} style={groupHeaderStyle(expandedGroups.has("Foundations"))}>
            <span style={sectionHeaderStyle}>Foundations</span>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: t.fg3, transition: "transform 0.2s", transform: expandedGroups.has("Foundations") ? "rotate(0deg)" : "rotate(-90deg)" }}>expand_more</span>
          </button>
          {expandedGroups.has("Foundations") && foundationItems.map(c => renderItem(c))}
        </div>
      )}

      {toolItems.length > 0 && (
        <div>
          <button onClick={() => toggleGroup("Tools")} aria-expanded={expandedGroups.has("Tools")} style={groupHeaderStyle(expandedGroups.has("Tools"))}>
            <span style={sectionHeaderStyle}>Tools</span>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: t.fg3, transition: "transform 0.2s", transform: expandedGroups.has("Tools") ? "rotate(0deg)" : "rotate(-90deg)" }}>expand_more</span>
          </button>
          {expandedGroups.has("Tools") && <div style={helperStyle}>Inspect tokens, audit code</div>}
          {expandedGroups.has("Tools") && toolItems.map(c => renderItem(c))}
        </div>
      )}

      <div style={sectionHeaderStyle}>Components</div>
      <div style={helperStyle}>Atomic UI controls</div>
      {subcatGroups.map(g => (
        <div key={g.sub}>
          <button onClick={() => toggleGroup(g.sub)} aria-expanded={expandedGroups.has(g.sub)} style={groupHeaderStyle(expandedGroups.has(g.sub))}>
            <span>{g.sub}</span>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: t.fg3, transition: "transform 0.2s", transform: expandedGroups.has(g.sub) ? "rotate(0deg)" : "rotate(-90deg)" }}>expand_more</span>
          </button>
          {expandedGroups.has(g.sub) && g.items.map(c => renderItem(c, true))}
        </div>
      ))}

      {uncategorized.length > 0 && uncategorized.map(c => renderItem(c, true))}

      {(() => {
        const patternItems = filtered.filter(c => c.cat === "Patterns").sort((a, b) => a.name.localeCompare(b.name));
        if (patternItems.length === 0) return null;
        return (
          <div>
            <button onClick={() => toggleGroup("Patterns")} aria-expanded={expandedGroups.has("Patterns")} style={groupHeaderStyle(expandedGroups.has("Patterns"))}>
              <span style={sectionHeaderStyle}>Patterns & Flows</span>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: t.fg3, transition: "transform 0.2s", transform: expandedGroups.has("Patterns") ? "rotate(0deg)" : "rotate(-90deg)" }}>expand_more</span>
            </button>
            {expandedGroups.has("Patterns") && <div style={helperStyle}>Page layouts &amp; multi-component flows</div>}
            {expandedGroups.has("Patterns") && patternItems.map(c => renderItem(c))}
          </div>
        );
      })()}
    </div>
  );
}
