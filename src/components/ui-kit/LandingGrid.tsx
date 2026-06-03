"use client";

import React from "react";
import { useDesignHub } from "@/store/useDesignHub";
import type { SystemId } from "@/store/useDesignHub";
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

type HeroArt = {
  signal: string;
  signature: string;
  subtitle: string;
  mark: string;
  palette: string[];
  metricLabel: string;
  metricValue: string;
  metricDelta: string;
  chips: string[];
  bars: number[];
  lanes: string[];
};

const HERO_ART_BY_SYSTEM: Record<SystemId, HeroArt> = {
  salt: {
    signal: "J.P. Morgan",
    signature: "Salt DS",
    subtitle: "Density and data",
    mark: "S",
    palette: ["#0b7fab", "#16a6c9", "#4cc9f0", "#ed3124", "#f5a623", "#7a5aa6", "#9b7a55"],
    metricLabel: "Token coverage",
    metricValue: "3 layers",
    metricDelta: "AA ready",
    chips: ["Compact", "Medium", "Touch"],
    bars: [44, 72, 58, 84, 62, 48, 76],
    lanes: ["Action", "Containment", "Market data"],
  },
  m3: {
    signal: "Google",
    signature: "Material 3",
    subtitle: "Dynamic color",
    mark: "M3",
    palette: ["#6750a4", "#d0bcff", "#eaddff", "#ffd8e4", "#b3261e", "#fef7ff", "#625b71"],
    metricLabel: "Tonal roles",
    metricValue: "13",
    metricDelta: "adaptive",
    chips: ["Filled", "Tonal", "Outlined"],
    bars: [56, 80, 66, 92, 74, 60, 86],
    lanes: ["Surface", "Primary", "Container"],
  },
  fluent: {
    signal: "Microsoft",
    signature: "Fluent 2",
    subtitle: "App surfaces",
    mark: "F2",
    palette: ["#0078d4", "#2899f5", "#60cdff", "#8a8886", "#c8c6c4", "#f3f2f1", "#2b88d8"],
    metricLabel: "Shell states",
    metricValue: "3 sizes",
    metricDelta: "cross platform",
    chips: ["Command", "Pane", "Focus"],
    bars: [38, 62, 88, 70, 46, 78, 54],
    lanes: ["Navigation", "Toolbar", "Content"],
  },
  uoaui: {
    signal: "uoaui",
    signature: "uoaui DS",
    subtitle: "Aurora glass",
    mark: "UA",
    palette: ["#8A58C9", "#9D71D2", "#9575F0", "#f46a9b", "#27aeef", "#1a1035", "#E8EAED"],
    metricLabel: "Glass depth",
    metricValue: "4 layers",
    metricDelta: "motion tuned",
    chips: ["Frosted", "Aurora", "Glow"],
    bars: [50, 74, 96, 68, 82, 58, 88],
    lanes: ["Glass", "Gradient", "Ambient"],
  },
  carbon: {
    signal: "IBM",
    signature: "Carbon DS",
    subtitle: "2px grid",
    mark: "01",
    palette: ["#0f62fe", "#78a9ff", "#33b1ff", "#42be65", "#fa4d56", "#f4f4f4", "#393939"],
    metricLabel: "Grid rhythm",
    metricValue: "2px",
    metricDelta: "flat",
    chips: ["Data", "Tiles", "Plex"],
    bars: [64, 40, 82, 58, 92, 46, 74],
    lanes: ["Column", "Row", "Tile"],
  },
};

function HeroSignaturePanel({ art }: { art: HeroArt }) {
  return (
    <div className={`${styles.showcasePanel} ${styles.signaturePanel}`} style={{ "--delay": "0s" } as React.CSSProperties}>
      <div className={styles.panelTop}>
        <span>{art.signal}</span>
        <span>{art.subtitle}</span>
      </div>
      <div className={styles.signatureBody}>
        <div>
          <div className={styles.signatureMark}>{art.mark}</div>
          <div className={styles.signatureName}>{art.signature}</div>
        </div>
        <div className={styles.swatchCluster}>
          {art.palette.map((color, i) => (
            <span
              key={`${color}-${i}`}
              className={styles.swatchTile}
              style={{ "--swatch": color } as React.CSSProperties}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroSystemScene({ system, art }: { system: SystemId; art: HeroArt }) {
  if (system === "salt") {
    return (
      <div className={styles.saltScene}>
        <div className={styles.marketTape}>
          <span>FX</span>
          <strong>42.08</strong>
          <em>+1.2%</em>
        </div>
        <div className={styles.depthBars}>
          {art.bars.map((bar, i) => <span key={i} style={{ height: `${bar}%` }} />)}
        </div>
        <div className={styles.laneList}>
          {art.lanes.map((lane) => <span key={lane}>{lane}</span>)}
        </div>
      </div>
    );
  }

  if (system === "m3") {
    return (
      <div className={styles.materialScene}>
        <div className={styles.materialPhone}>
          <span className={styles.materialHandle} />
          <div className={styles.materialTileLarge} />
          <div className={styles.materialTileSmall} />
          <div className={styles.materialFab}>+</div>
        </div>
        <div className={styles.tonalStack}>
          {art.chips.map((chip, i) => <span key={chip} style={{ "--tone": art.palette[i] } as React.CSSProperties}>{chip}</span>)}
        </div>
      </div>
    );
  }

  if (system === "fluent") {
    return (
      <div className={styles.fluentScene}>
        <div className={styles.windowBar}>
          <span />
          <span />
          <span />
        </div>
        <div className={styles.commandStrip}>
          <span className="material-symbols-outlined">search</span>
          <span className="material-symbols-outlined">tune</span>
          <span className="material-symbols-outlined">open_in_new</span>
        </div>
        <div className={styles.fluentPaneGrid}>
          {art.lanes.map((lane) => <span key={lane}>{lane}</span>)}
        </div>
      </div>
    );
  }

  if (system === "uoaui") {
    return (
      <div className={styles.auroraScene}>
        <div className={styles.glassPlate}>
          <span>{art.signature}</span>
          <strong>{art.metricValue}</strong>
        </div>
        <div className={styles.glassTiles}>
          {art.chips.map((chip) => <span key={chip}>{chip}</span>)}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.carbonScene}>
      <div className={styles.carbonMatrix}>
        {art.bars.map((bar, i) => <span key={i} style={{ "--height": `${bar}%` } as React.CSSProperties} />)}
      </div>
      <div className={styles.carbonRows}>
        {art.lanes.map((lane) => <span key={lane}>{lane}</span>)}
      </div>
    </div>
  );
}

function HeroInsightPanel({ art }: { art: HeroArt }) {
  return (
    <div className={`${styles.showcasePanel} ${styles.insightPanel}`} style={{ "--delay": "0.84s" } as React.CSSProperties}>
      <div className={styles.insightMetric}>
        <span>{art.metricLabel}</span>
        <strong>{art.metricValue}</strong>
        <em>{art.metricDelta}</em>
      </div>
      <div className={styles.insightBars}>
        {art.bars.map((bar, i) => <span key={i} style={{ height: `${bar}%` }} />)}
      </div>
      <div className={styles.chipRow}>
        {art.chips.map((chip) => <span key={chip}>{chip}</span>)}
      </div>
    </div>
  );
}

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
  const heroImage = HERO_IMAGE_BY_SYSTEM[activeSystem] ?? HERO_IMAGE_BY_SYSTEM.salt;
  const heroArt = HERO_ART_BY_SYSTEM[activeSystem];
  const heroAccent2 = activeSystem === "m3"
    ? "#FFB4AB"
    : activeSystem === "fluent"
    ? "#4CC2FF"
    : activeSystem === "carbon"
    ? "#78A9FF"
    : activeSystem === "uoaui"
    ? "#f46a9b"
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
          <div className={styles.showcaseStack}>
            <HeroSignaturePanel art={heroArt} />
            <div className={`${styles.showcasePanel} ${styles.systemPanel}`} style={{ "--delay": "0.42s" } as React.CSSProperties}>
              <HeroSystemScene system={activeSystem} art={heroArt} />
            </div>
            <HeroInsightPanel art={heroArt} />
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
