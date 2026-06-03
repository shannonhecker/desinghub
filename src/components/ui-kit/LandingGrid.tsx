"use client";

import React from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { useTheme } from "@/contexts/ThemeContext";
import { getComponents, getCategories, getSystemInfo, getPreviews } from "@/data/registry";
import { publicAssetUrl } from "@/lib/sampleImages";
import { getUiKitGroup, BUILDER_BLOCKS } from "./uiKitGroups";
import { getStageBg } from "./stageTint";
import styles from "./LandingHero.module.css";

const HERO_IMAGE_BY_SYSTEM: Record<string, string> = {
  salt: "/media/dummy/enterprise-analytics.png",
  m3: "/media/dummy/material-mobile-collage.png",
  fluent: "/media/dummy/saas-collaboration.png",
  uoaui: "/media/dummy/glass-creative-studio.png",
  carbon: "/media/dummy/enterprise-analytics.png",
};

const HERO_CLASS_BY_SYSTEM: Record<string, string> = {
  salt: styles.systemSalt,
  m3: styles.systemM3,
  fluent: styles.systemFluent,
  uoaui: styles.systemUoaui,
  carbon: styles.systemCarbon,
};

export const LandingGrid = React.memo(function LandingGrid() {
  const activeSystem = useDesignHub((s) => s.activeSystem);
  const setSelectedComponent = useDesignHub((s) => s.setSelectedComponent);
  const t = useTheme();
  const components = getComponents(activeSystem);
  const categories = getCategories(activeSystem);
  const sysInfo = getSystemInfo(activeSystem);
  const previews = getPreviews(activeSystem);

  const h2Size = 22;
  const bodySize = 16;
  const captionSize = 13;
  const outerPad = 48;

  const thumbHeight = 120;
  const cardGap = 20;

  const featurePills = activeSystem === "salt"
    ? [{ icon: "layers", label: "3-Layer Tokens" }, { icon: "density_small", label: "4 Densities" }, { icon: "accessibility_new", label: "WCAG AA" }]
    : activeSystem === "m3"
    ? [{ icon: "palette", label: "Dynamic Color" }, { icon: "accessibility_new", label: "WCAG AA" }]
    : activeSystem === "uoaui"
    ? [{ icon: "blur_on", label: "Glassmorphism" }, { icon: "gradient", label: "Aurora Themes" }, { icon: "density_small", label: "4 Densities" }, { icon: "accessibility_new", label: "WCAG AA" }]
    : activeSystem === "carbon"
    ? [{ icon: "grid_view", label: "2px Grid" }, { icon: "palette", label: "4 Themes" }, { icon: "density_small", label: "7 Sizes" }, { icon: "accessibility_new", label: "WCAG AA" }]
    : [{ icon: "palette", label: "Brand Theming" }, { icon: "straighten", label: "3 Sizes" }, { icon: "accessibility_new", label: "WCAG AA" }];

  const orgLabel = activeSystem === "m3" ? `Google · ${sysInfo.org}` : sysInfo.org;
  const heroWeight = activeSystem === "salt" ? 700 : activeSystem === "m3" ? 400 : activeSystem === "carbon" ? 300 : 300;
  const descSuffix = activeSystem === "salt"
    ? " accessible, density-aware, token-driven design system."
    : activeSystem === "m3"
    ? " expressive, adaptive, and accessible design system."
    : activeSystem === "uoaui"
    ? " glassmorphism-first, accessible, and token-driven design system."
    : activeSystem === "carbon"
    ? " IBM's open-source design system for products and digital experiences."
    : " expressive, adaptive, and cross-platform design system.";

  const cardClass = activeSystem === "salt" ? "s-card" : activeSystem === "m3" ? "m3-card m3-card-outlined" : activeSystem === "uoaui" ? undefined : activeSystem === "carbon" ? "cb-tile" : "f-card";
  const cardRadius = activeSystem === "m3" ? 12 : activeSystem === "uoaui" ? 14 : activeSystem === "carbon" ? 0 : 8;
  const pillRadius = activeSystem === "salt" ? 4 : activeSystem === "carbon" ? 16 : 20;
  const pillWeight = activeSystem === "salt" ? 600 : activeSystem === "carbon" ? 400 : 500;
  const catWeight = activeSystem === "salt" ? 700 : activeSystem === "carbon" ? 400 : 600;
  const heroPreviewItems = components.filter((c) => Boolean(previews[c.id])).slice(0, 3);
  const heroImage = HERO_IMAGE_BY_SYSTEM[activeSystem] ?? HERO_IMAGE_BY_SYSTEM.salt;
  const heroAccent2 = activeSystem === "m3"
    ? "#FFB4AB"
    : activeSystem === "fluent"
    ? "#4CC2FF"
    : activeSystem === "carbon"
    ? "#78A9FF"
    : activeSystem === "uoaui"
    ? "#62D9C7"
    : "#8DDAFF";
  const heroStyle = {
    "--hero-bg": t.bg,
    "--hero-surface": t.bg2,
    "--hero-surface-strong": t.T.layerAccent01 || t.bg2,
    "--hero-border": t.border,
    "--hero-fg": t.fg,
    "--hero-fg-muted": t.fg2,
    "--hero-accent": t.accent,
    "--hero-accent-2": heroAccent2,
    "--hero-panel": activeSystem === "uoaui" ? "rgba(18, 22, 34, 0.56)" : activeSystem === "carbon" ? (t.T.layer01 || t.bg2) : t.bg2,
    "--hero-title-weight": heroWeight,
    "--hero-label-size": `${t.scale.labF}px`,
    "--hero-pill-radius": `${pillRadius}px`,
    "--hero-pill-weight": pillWeight,
    "--hero-pill-size": `${t.scale.navF - 1}px`,
  } as React.CSSProperties;

  const stageBg = getStageBg(t);

  return (
    <div style={{ padding: `${outerPad}px ${outerPad + 8}px`, fontFamily: t.font, background: stageBg, minHeight: "100%" }}>
      <div className={`${styles.heroShell} ${HERO_CLASS_BY_SYSTEM[activeSystem] ?? ""}`} style={heroStyle}>
        <div className={styles.heroCopy}>
          <div className={styles.orgLabel}>{orgLabel}</div>
          <h1 className={styles.heroTitle}>{sysInfo.name}</h1>
          <p className={styles.heroLead}>
            Preview, compare, and copy tokens across five design systems.
          </p>
          <p className={styles.heroBody}>
            {components.length} components across {categories.length} categories:{descSuffix}
          </p>
          <div className={styles.featurePills}>
            {featurePills.map((s) => (
              <div key={s.label} className={styles.featurePill}>
                <span className={`material-symbols-outlined ${styles.featureIcon}`} style={{ fontSize: t.scale.navF }}>{s.icon}</span>
                {s.label}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.heroVisual} aria-hidden="true">
          <div className={styles.signalRail} />
          <div className={styles.mediaFrame}>
            <img src={publicAssetUrl(heroImage)} alt="" />
          </div>
          <div className={styles.motionBand} />
          <div className={styles.previewStack}>
            {heroPreviewItems.map((c, i) => {
              const Preview = previews[c.id];
              return (
                <div
                  key={c.id}
                  className={styles.previewCard}
                  style={{ "--delay": `${i * 0.42}s` } as React.CSSProperties}
                >
                  <div className={styles.previewCanvas}>
                    {Preview ? <Preview /> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {(() => {
        const toolItems: { id: string; name: string; desc: string }[] = [
          ...components.filter((c) => getUiKitGroup(c.id, c.cat) === "Tools"),
          { id: BUILDER_BLOCKS.id, name: BUILDER_BLOCKS.name, desc: BUILDER_BLOCKS.desc },
        ];
        if (toolItems.length === 0) return null;
        return (
          <div style={{ marginBottom: outerPad }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: t.scale.gap + 2, marginBottom: t.scale.gap * 3 }}>
              <h2 style={{ fontSize: h2Size, fontWeight: catWeight, color: t.fg, margin: 0 }}>Tools</h2>
              <span style={{ fontSize: captionSize, color: t.fg3 }}>{toolItems.length}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: cardGap }}>
              {toolItems.map((c) => (
                <button key={c.id} className={`uikit-card${cardClass ? ` ${cardClass}` : ""}`}
                  onClick={() => setSelectedComponent(c.id)}
                  style={{
                    width: "100%", textAlign: "left", padding: 0, fontFamily: t.font, overflow: "hidden", cursor: "pointer",
                    borderRadius: cardRadius,
                    border: activeSystem === "uoaui" ? `1px solid ${t.border}` : activeSystem === "carbon" ? `1px solid transparent` : undefined,
                    background: activeSystem === "uoaui" ? t.T.cardBg : activeSystem === "carbon" ? t.T.layer01 : undefined,
                    backdropFilter: activeSystem === "uoaui" ? t.T.glass : undefined,
                    WebkitBackdropFilter: activeSystem === "uoaui" ? t.T.glass : undefined,
                  }}
                >
                  <div className="uikit-card-thumb" style={{
                    background: activeSystem === "uoaui" && t.T.gradient ? t.T.gradient : activeSystem === "m3" ? t.bg2 : activeSystem === "carbon" ? t.T.layerAccent01 : undefined,
                    height: thumbHeight,
                    borderBottom: `1px solid ${t.borderSubtle}`,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 40, color: t.accent, opacity: 0.85 }}>
                      {c.id === "tokens" ? "palette" : c.id === "audit" ? "fact_check" : "widgets"}
                    </span>
                  </div>
                  <div style={{ padding: "14px 16px 16px" }}>
                    <div style={{ fontSize: bodySize, fontWeight: 600, color: t.fg, lineHeight: 1.3, letterSpacing: activeSystem === "m3" ? "0.1px" : undefined }}>{c.name}</div>
                    <div style={{ fontSize: t.scale.labF + 1, color: t.fg2, marginTop: 4, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.desc || "Tool"}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {categories.map((cat) => {
        const catItems = components.filter((c) => c.cat === cat && getUiKitGroup(c.id, c.cat) !== "Tools");
        if (catItems.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: outerPad }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: t.scale.gap + 2, marginBottom: t.scale.gap * 3 }}>
              <h2 style={{ fontSize: h2Size, fontWeight: catWeight, color: t.fg, margin: 0 }}>{cat}</h2>
              <span style={{ fontSize: captionSize, color: t.fg3 }}>{catItems.length}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: cardGap }}>
              {catItems.map((c) => {
                const Preview = previews[c.id];
                return (
                  <button key={c.id} className={`uikit-card${cardClass ? ` ${cardClass}` : ""}`}
                    onClick={() => setSelectedComponent(c.id)}
                    style={{
                      width: "100%", textAlign: "left", padding: 0, fontFamily: t.font, overflow: "hidden", cursor: "pointer",
                      borderRadius: cardRadius,
                      border: activeSystem === "uoaui" ? `1px solid ${t.border}` : activeSystem === "carbon" ? `1px solid transparent` : undefined,
                      background: activeSystem === "uoaui" ? t.T.cardBg : activeSystem === "carbon" ? t.T.layer01 : undefined,
                      backdropFilter: activeSystem === "uoaui" ? t.T.glass : undefined,
                      WebkitBackdropFilter: activeSystem === "uoaui" ? t.T.glass : undefined,
                    }}
                  >
                    <div className="uikit-card-thumb" style={{
                      background: activeSystem === "uoaui" && t.T.gradient ? t.T.gradient : activeSystem === "m3" ? t.bg2 : activeSystem === "carbon" ? t.T.layerAccent01 : undefined,
                      height: thumbHeight,
                      borderBottom: `1px solid ${t.borderSubtle}`,
                    }}>
                      {Preview
                        ? <div className="uikit-card-specimen" style={{ pointerEvents: "none" }}><Preview /></div>
                        : <span className="material-symbols-outlined" style={{ fontSize: 40, color: t.fg3, opacity: 0.4 }}>widgets</span>}
                    </div>
                    <div style={{ padding: "14px 16px 16px" }}>
                      <div style={{ fontSize: bodySize, fontWeight: 600, color: t.fg, lineHeight: 1.3, letterSpacing: activeSystem === "m3" ? "0.1px" : undefined }}>{c.name}</div>
                      <div style={{ fontSize: t.scale.labF + 1, color: t.fg2, marginTop: 4, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.desc || cat}</div>
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
