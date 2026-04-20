"use client";

import React from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { useTheme } from "@/contexts/ThemeContext";
import { getComponents, getCategories, getSystemInfo, getPreviews } from "@/data/registry";

export const LandingGrid = React.memo(function LandingGrid() {
  const activeSystem = useDesignHub((s) => s.activeSystem);
  const setSelectedComponent = useDesignHub((s) => s.setSelectedComponent);
  const t = useTheme();
  const components = getComponents(activeSystem);
  const categories = getCategories(activeSystem);
  const sysInfo = getSystemInfo(activeSystem);
  const previews = getPreviews(activeSystem);

  const heroSize = 48;
  const h2Size = 22;
  const bodySize = 16;
  const captionSize = 13;
  const outerPad = 48;

  /* DS-specific feature pills */
  const featurePills = activeSystem === "salt"
    ? [{ icon: "layers", label: "3-Layer Tokens" }, { icon: "density_small", label: "4 Densities" }, { icon: "accessibility_new", label: "WCAG AA" }]
    : activeSystem === "m3"
    ? [{ icon: "palette", label: "Dynamic Color" }, { icon: "accessibility_new", label: "WCAG AA" }]
    : activeSystem === "ausos"
    ? [{ icon: "blur_on", label: "Glassmorphism" }, { icon: "gradient", label: "Aurora Themes" }, { icon: "density_small", label: "4 Densities" }, { icon: "accessibility_new", label: "WCAG AA" }]
    : activeSystem === "carbon"
    ? [{ icon: "grid_view", label: "2px Grid" }, { icon: "palette", label: "4 Themes" }, { icon: "density_small", label: "7 Sizes" }, { icon: "accessibility_new", label: "WCAG AA" }]
    : [{ icon: "palette", label: "Brand Theming" }, { icon: "straighten", label: "3 Sizes" }, { icon: "accessibility_new", label: "WCAG AA" }];

  const orgLabel = activeSystem === "m3" ? `Google · ${sysInfo.org}` : sysInfo.org;
  /* Carbon uses Plex Light 300 for display-01 - matches the
     carbondesignsystem.com hero treatment exactly. Salt goes
     heavy (700), M3 + Fluent sit at 400. */
  const heroWeight = activeSystem === "salt" ? 700 : activeSystem === "m3" ? 400 : activeSystem === "carbon" ? 300 : 300;
  const descSuffix = activeSystem === "salt"
    ? " accessible, density-aware, token-driven design system."
    : activeSystem === "m3"
    ? " expressive, adaptive, and accessible design system."
    : activeSystem === "ausos"
    ? " glassmorphism-first, accessible, and token-driven design system."
    : activeSystem === "carbon"
    ? " IBM's open-source design system for products and digital experiences."
    : " expressive, adaptive, and cross-platform design system.";

  /* Carbon is flat: 0px radius on cards, no shadows, Plex Light
     hero, tag-style pills (16px), $layer-accent pill bg. */
  const cardClass = activeSystem === "salt" ? "s-card" : activeSystem === "m3" ? "m3-card m3-card-outlined" : activeSystem === "ausos" ? undefined : activeSystem === "carbon" ? "cb-tile" : "f-card";
  const cardRadius = activeSystem === "m3" ? 12 : activeSystem === "ausos" ? 14 : activeSystem === "carbon" ? 0 : 8;
  const pillRadius = activeSystem === "salt" ? 4 : activeSystem === "carbon" ? 16 : 20;
  const pillWeight = activeSystem === "salt" ? 600 : activeSystem === "carbon" ? 400 : 500;
  const catWeight = activeSystem === "salt" ? 700 : activeSystem === "carbon" ? 400 : 600;

  return (
    <div style={{ padding: `${outerPad}px ${outerPad + 8}px`, fontFamily: t.font, background: t.bg, minHeight: "100%" }}>
      {/* Hero */}
      <div style={{ marginBottom: Math.round(outerPad * 1.5), borderBottom: `1px solid ${t.border}`, paddingBottom: outerPad }}>
        <div style={{ fontSize: t.scale.labF, fontWeight: activeSystem === "m3" ? 500 : 700, color: t.accent, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: t.scale.gap + 4 }}>
          {orgLabel}
        </div>
        <h1 style={{ fontSize: heroSize, fontWeight: heroWeight, color: t.fg, lineHeight: 1.15, margin: `0 0 ${t.scale.gap + (activeSystem === "m3" ? 8 : 12)}px`, letterSpacing: activeSystem === "m3" ? "-0.25px" : "-0.5px" }}>
          {sysInfo.name}
        </h1>
        <p style={{ fontSize: bodySize, color: t.fg2, lineHeight: 1.6, maxWidth: 560, margin: 0 }}>
          {components.length} components across {categories.length} categories -{descSuffix}
        </p>
        <div style={{ display: "flex", gap: t.scale.gap - 2, marginTop: t.scale.gap + 10, flexWrap: "wrap" }}>
          {[{ icon: "category", label: `${categories.length} Categories` }, { icon: "widgets", label: `${components.length} Components` }, ...featurePills].map(s => (
            <div key={s.label} style={{
              display: "flex", alignItems: "center", gap: t.scale.gap - 2,
              padding: `${t.scale.gap - 2}px ${t.scale.gap + 6}px`, borderRadius: pillRadius,
              /* Carbon pills use $layer-accent (no border, pill radius)
                 so they read as Carbon tags; others keep their existing
                 bordered-pill look. */
              background: activeSystem === "carbon" ? (t.T.layerAccent01 || t.bg2) : activeSystem === "m3" ? t.bg2 : t.bg,
              border: activeSystem === "carbon" ? "none" : `1px solid ${t.border}`,
              fontSize: t.scale.navF - 1, color: t.fg2, fontWeight: pillWeight,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: t.scale.navF, color: t.accent }}>{s.icon}</span>
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Category sections */}
      {categories.map(cat => {
        const catItems = components.filter(c => c.cat === cat);
        return (
          <div key={cat} style={{ marginBottom: outerPad }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: t.scale.gap + 2, marginBottom: t.scale.gap * 3 }}>
              <h2 style={{ fontSize: h2Size, fontWeight: catWeight, color: t.fg, margin: 0 }}>{cat}</h2>
              <span style={{ fontSize: captionSize, color: t.fg3 }}>{catItems.length}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {catItems.map(c => {
                const Preview = previews[c.id];
                return (
                  <button key={c.id} className={cardClass || undefined}
                    onClick={() => setSelectedComponent(c.id)}
                    style={{
                      width: "100%", textAlign: "left", padding: 0, fontFamily: t.font, overflow: "hidden", cursor: "pointer",
                      borderRadius: cardRadius,
                      border: activeSystem === "ausos" ? `1px solid ${t.border}` : activeSystem === "carbon" ? `1px solid transparent` : undefined,
                      background: activeSystem === "ausos" ? t.T.cardBg : activeSystem === "carbon" ? t.T.layer01 : undefined,
                      backdropFilter: activeSystem === "ausos" ? t.T.glass : undefined,
                      WebkitBackdropFilter: activeSystem === "ausos" ? t.T.glass : undefined,
                      transition: "background 70ms cubic-bezier(0.2, 0, 0.38, 0.9), border-color 200ms",
                    }}
                  >
                    <div style={{
                      /* Carbon preview tile uses $layer-accent (a half-step
                         deeper than layer-01 where the card body sits) to
                         separate the preview visually without shadow. */
                      background: activeSystem === "ausos" && t.T.gradient ? t.T.gradient : activeSystem === "m3" ? t.bg2 : activeSystem === "carbon" ? t.T.layerAccent01 : undefined,
                      padding: 20, minHeight: 60,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      borderBottom: `1px solid ${t.border}`,
                    }}>
                      {Preview
                        ? <div style={{ pointerEvents: "none", width: "100%" }}><Preview /></div>
                        : <span className="material-symbols-outlined" style={{ fontSize: 32, color: t.fg3, opacity: 0.4 }}>widgets</span>}
                    </div>
                    <div style={{ padding: "10px 14px 12px" }}>
                      <div style={{ fontSize: t.scale.navF, fontWeight: 500, color: t.fg, letterSpacing: activeSystem === "m3" ? "0.1px" : undefined }}>{c.name}</div>
                      <div style={{ fontSize: t.scale.labF, color: t.fg2, marginTop: 2 }}>{c.desc?.slice(0, 55) || cat}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
});
