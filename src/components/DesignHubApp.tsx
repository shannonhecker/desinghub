"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useDesignHub, type SystemId, type ActiveTab } from "@/store/useDesignHub";
import { getComponents, getCategories, getTheme, getFullCSS, getFont, getSystemInfo, activateTheme, getPreviews, MATERIAL_COLORS } from "@/data/registry";
import { ComponentPreview } from "./ComponentPreview";

import { TokenReference } from "./TokenReference";

import { AuditPanel } from "./AuditPanel";

// Helper: get token values by system so all UI uses the active DS
export function useActiveTheme() {
  const store = useDesignHub();
  const { activeSystem } = store;
  let T = activeSystem === "salt"
    ? getTheme("salt", store.salt.themeKey)
    : activeSystem === "m3"
    ? getTheme("m3", store.m3.themeKey, store.m3.customColor, store.m3.isDarkCustom)
    : activeSystem === "fluent"
    ? getTheme("fluent", store.fluent.themeKey)
    : getTheme("ausos", store.ausos.themeKey);

  // Apply custom accent color for ausos
  if (activeSystem === "ausos" && store.ausos.accentColor && store.ausos.accentColor !== T.accent) {
    const c = store.ausos.accentColor;
    const lighter = c + "CC";
    T = { ...T, accent: c, accentHover: c, accentActive: c, accentGradient: `linear-gradient(135deg, ${lighter} 0%, ${c} 100%)`, accentSurface: `${c}14`, accentSurfaceHover: `${c}22`, borderAccent: `${c}40` };
  }

  activateTheme(activeSystem, T);

  const densityOrSize = activeSystem === "salt" ? store.salt.density : activeSystem === "m3" ? store.m3.density : activeSystem === "fluent" ? store.fluent.size : store.ausos.density;
  const css = getFullCSS(activeSystem, T, densityOrSize);
  const font = getFont(activeSystem);

  // Normalized token accessors
  const n = (salt: string, m3: string, fluent: string, ausos: string) =>
    activeSystem === "salt" ? T[salt] : activeSystem === "m3" ? T[m3] : activeSystem === "fluent" ? T[fluent] : T[ausos];
  const bg = n("bg", "surface", "bg1", "bg");
  const bg2 = n("bg2", "surfaceContainerLow", "bg2", "bg2");
  const bg3 = n("bg3", "surfaceContainer", "bg3", "bg3");
  const fg = n("fg", "onSurface", "fg1", "fg");
  const fg2 = n("fg2", "onSurfaceVariant", "fg2", "fg2");
  const fg3 = n("fg3", "outline", "fg3", "fg3");
  const accent = n("accent", "primary", "brandBg", "accent");
  const accentFg = n("accentFg", "onPrimary", "fgOnBrand", "accentFg");
  const accentWeak = n("accentWeak", "primaryContainer", "brandBg2", "accentSurface");
  const accentText = activeSystem === "salt" ? (T.accentText || T.accent) : activeSystem === "m3" ? T.primary : activeSystem === "fluent" ? T.brandFg1 : T.accent;
  const border = n("border", "outlineVariant", "stroke2", "border");
  const borderStrong = n("borderStrong", "outline", "strokeAccessible", "borderStrong");

  // Density-derived sizing — every px on the page scales with the active density/size
  const scale = (() => {
    if (activeSystem === "salt") {
      const d = densityOrSize as string;
      return d === "high"  ? { navH: 20, navF: 11, labF: 9,  tabH: 24, hdrH: 36, gap: 4,  panelW: 220 }
           : d === "low"   ? { navH: 36, navF: 13, labF: 11, tabH: 40, hdrH: 48, gap: 8,  panelW: 260 }
           : d === "touch" ? { navH: 44, navF: 14, labF: 12, tabH: 48, hdrH: 56, gap: 10, panelW: 288 }
           :                 { navH: 28, navF: 12, labF: 10, tabH: 32, hdrH: 40, gap: 6,  panelW: 240 }; // medium
    }
    if (activeSystem === "m3") {
      const d = densityOrSize as number;
      return d === -3 ? { navH: 36, navF: 12, labF: 10, tabH: 36, hdrH: 44, gap: 7,  panelW: 230 }
           : d === -2 ? { navH: 40, navF: 13, labF: 10, tabH: 40, hdrH: 48, gap: 8,  panelW: 240 }
           : d === -1 ? { navH: 44, navF: 14, labF: 11, tabH: 44, hdrH: 52, gap: 9,  panelW: 256 }
           :            { navH: 48, navF: 14, labF: 11, tabH: 48, hdrH: 56, gap: 10, panelW: 268 }; // default
    }
    if (activeSystem === "fluent") {
      const d = densityOrSize as string;
      return d === "small" ? { navH: 24, navF: 11, labF: 9,  tabH: 28, hdrH: 36, gap: 4,  panelW: 220 }
           : d === "large" ? { navH: 40, navF: 14, labF: 11, tabH: 42, hdrH: 50, gap: 8,  panelW: 264 }
           :                 { navH: 32, navF: 13, labF: 10, tabH: 36, hdrH: 44, gap: 6,  panelW: 240 }; // medium
    }
    // ausos
    const d = densityOrSize as string;
    return d === "high"  ? { navH: 20, navF: 11, labF: 9,  tabH: 24, hdrH: 36, gap: 4,  panelW: 220 }
         : d === "low"   ? { navH: 36, navF: 13, labF: 11, tabH: 40, hdrH: 48, gap: 8,  panelW: 260 }
         : d === "touch" ? { navH: 44, navF: 14, labF: 12, tabH: 48, hdrH: 56, gap: 10, panelW: 288 }
         :                 { navH: 28, navF: 12, labF: 10, tabH: 32, hdrH: 40, gap: 6,  panelW: 240 }; // medium
  })();

  return { T, css, font, bg, bg2, bg3, fg, fg2, fg3, accent, accentFg, accentWeak, accentText, border, borderStrong, activeSystem, densityOrSize, scale };
}

/* ── M3 mode dropdown helpers ── */
const M3_MODE_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "lightMediumContrast", label: "Light Medium Contrast" },
  { value: "lightHighContrast", label: "Light High Contrast" },
  { value: "darkMediumContrast", label: "Dark Medium Contrast" },
  { value: "darkHighContrast", label: "Dark High Contrast" },
  { value: "custom", label: "Custom" },
];
function ModeIndicator({ value, customColor, border }: { value: string; customColor: string; border: string }) {
  if (value === "custom") return (
    <span style={{ width: 14, height: 14, borderRadius: "50%", background: customColor, flexShrink: 0, border: `1px solid ${border}`, display: "inline-block" }} />
  );
  // Split circle: left half = light tone, right half = dark tone
  // Flip orientation for dark variants so the dominant half matches the mode
  const isDark = value.startsWith("dark");
  return (
    <span style={{
      width: 14, height: 14, borderRadius: "50%", flexShrink: 0, display: "inline-block",
      background: isDark
        ? "linear-gradient(90deg, #1c1b1f 50%, #e6e0e9 50%)"
        : "linear-gradient(90deg, #e6e0e9 50%, #1c1b1f 50%)",
      border: `1px solid ${border}`,
    }} />
  );
}

/* ── DS SWITCHER — uses active DS button classes ── */
function SystemSwitcher() {
  const { activeSystem, setActiveSystem } = useDesignHub();
  const theme = useActiveTheme();
  const systems: { id: SystemId; label: string }[] = [
    { id: "salt", label: "Salt DS" },
    { id: "m3", label: "Material 3" },
    { id: "fluent", label: "Fluent 2" },
    { id: "ausos", label: "ausos" },
  ];
  // Use the DS's own button classes
  const btnClass = activeSystem === "salt" ? "s-btn" : activeSystem === "m3" ? "m3-btn" : activeSystem === "fluent" ? "f-btn" : "a-btn";
  const activeClass = activeSystem === "salt" ? "s-btn-solid" : activeSystem === "m3" ? "m3-btn-filled" : activeSystem === "fluent" ? "f-btn-primary" : "a-btn-primary";
  const inactiveClass = activeSystem === "salt" ? "s-btn-transparent" : activeSystem === "m3" ? "m3-btn-text" : activeSystem === "fluent" ? "f-btn-subtle" : "a-btn-ghost";

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

/* ── THEME CONTROLS — collapsible, uses DS tokens ── */
function ThemeControls() {
  const store = useDesignHub();
  const { activeSystem } = store;
  const t = useActiveTheme();
  const [open, setOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [accentOpen, setAccentOpen] = useState(false);

  const radius = activeSystem === "m3" ? 12 : activeSystem === "fluent" ? 4 : 4;

  /* ToggleButtonGroup — uses each DS's native button classes:
     Salt:   s-btn + s-btn-solid / s-btn-bordered
     M3:     m3-btn + m3-btn-filled / m3-btn-outlined
     Fluent: f-btn + f-btn-primary / f-btn-default */
  function CtrlBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    const btnClass = activeSystem === "salt"
      ? `s-btn ${active ? "s-btn-solid" : "s-btn-bordered"}`
      : activeSystem === "m3"
      ? `m3-btn ${active ? "m3-btn-filled" : "m3-btn-outlined"}`
      : activeSystem === "ausos"
      ? `a-btn ${active ? "a-btn-primary" : "a-btn-ghost"}`
      : `f-btn ${active ? "f-btn-primary" : "f-btn-secondary"}`;

    return (
      <button className={btnClass} onClick={onClick} style={{
        padding: `${t.scale.gap}px ${t.scale.gap + 8}px`,
        fontSize: t.scale.labF, fontFamily: t.font,
        cursor: "pointer", lineHeight: 1.4, minWidth: 0,
        height: "auto",
      }}>
        {children}
      </button>
    );
  }

  function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
    const innerGap = Math.max(4, t.scale.gap - 2);
    const btnGap   = Math.max(4, t.scale.gap - 4);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: innerGap }}>
        <div style={{ fontSize: t.scale.labF, textTransform: "uppercase" as const, color: t.fg2, letterSpacing: 1, fontWeight: 700 }}>{label}</div>
        <div style={{ display: "flex", gap: btnGap, flexWrap: "wrap", alignItems: "center" }}>{children}</div>
      </div>
    );
  }

  /* ── SALT DS ── */
  if (activeSystem === "salt") {
    const { salt, setSaltTheme, setSaltDensity } = store;
    const theme = salt.themeKey.includes("jpm") ? "jpm" : "legacy";
    const mode = salt.themeKey.includes("dark") ? "dark" : "light";
    const set = (th: string, m: string) => setSaltTheme(`${th}-${m}`);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {/* Collapsible header */}
        <button onClick={() => setOpen(v => !v)} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: `${t.scale.gap - 2}px 0`, background: "none", border: "none", cursor: "pointer",
          fontSize: t.scale.labF, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 1,
          color: t.fg2, fontFamily: t.font,
        }}>
          Controls
          <span style={{ fontSize: 14, transition: "transform 200ms", transform: open ? "rotate(0deg)" : "rotate(-90deg)", opacity: 0.6 }}>⌄</span>
        </button>
        {open && (
          <div style={{ display: "flex", flexDirection: "column", gap: t.scale.gap + 4, paddingBottom: t.scale.gap + 4 }}>
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
        )}
      </div>
    );
  }

  /* ── MATERIAL 3 ── */
  if (activeSystem === "m3") {
    const { m3, setM3Theme, setM3Density, setM3CustomColor, setM3DarkCustom } = store;
    const isDark = m3.themeKey.startsWith("dark");
    const isCustom = m3.themeKey === "custom";

    const selectedPalette = (MATERIAL_COLORS as { name: string; hex: string }[]).find(c => c.hex.toLowerCase() === m3.customColor.toLowerCase());

    const handlePaletteSelect = (hex: string) => {
      setM3CustomColor(hex);
      setM3DarkCustom(isDark);
      setM3Theme("custom");
      setPaletteOpen(false);
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <button onClick={() => setOpen(v => !v)} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: `${t.scale.gap - 2}px 0`, background: "none", border: "none", cursor: "pointer",
          fontSize: t.scale.labF, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 1,
          color: t.fg2, fontFamily: t.font,
        }}>
          Controls
          <span style={{ fontSize: 14, transition: "transform 200ms", transform: open ? "rotate(0deg)" : "rotate(-90deg)", opacity: 0.6 }}>⌄</span>
        </button>
        {open && (
          <div style={{ display: "flex", flexDirection: "column", gap: t.scale.gap + 4, paddingBottom: t.scale.gap + 4 }}>
            {/* Mode — M3-native custom dropdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: Math.max(4, t.scale.gap - 2), position: "relative" }}>
              <div style={{ fontSize: t.scale.labF, textTransform: "uppercase", color: t.fg2, letterSpacing: 1, fontWeight: 700 }}>Mode</div>

              {/* Click-outside backdrop */}
              {modeOpen && (
                <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setModeOpen(false)} />
              )}

              {/* Trigger — token-driven outlined select */}
              <button
                onClick={() => setModeOpen(v => !v)}
                style={{
                  display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 12px", border: `1px solid ${modeOpen ? t.accent : t.border}`, borderRadius: 4,
                  background: t.bg2, color: t.fg, cursor: "pointer", fontFamily: t.font, fontSize: 13,
                  transition: "border-color 150ms",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ModeIndicator value={isCustom ? "custom" : m3.themeKey} customColor={m3.customColor} border={t.border} />
                  {M3_MODE_OPTIONS.find(o => o.value === (isCustom ? "custom" : m3.themeKey))?.label}
                </span>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: t.fg3 }}>
                  {modeOpen ? "expand_less" : "expand_more"}
                </span>
              </button>

              {/* Dropdown — all colors from DS tokens, no class-level hardcoding */}
              {modeOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 99,
                  background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 4,
                  boxShadow: `0 4px 16px rgba(0,0,0,0.2)`, overflow: "hidden",
                }}>
                  {M3_MODE_OPTIONS.map(opt => {
                    const isSelected = (isCustom ? "custom" : m3.themeKey) === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => { setM3Theme(opt.value); setModeOpen(false); }}
                        style={{
                          display: "flex", width: "100%", alignItems: "center", gap: 8,
                          padding: "9px 12px", border: "none", cursor: "pointer",
                          fontFamily: t.font, fontSize: 13, textAlign: "left",
                          background: isSelected ? t.accentWeak : "transparent",
                          color: isSelected ? t.accentText : t.fg,
                          transition: "background 100ms",
                        }}
                      >
                        <ModeIndicator value={opt.value} customColor={m3.customColor} border={t.border} />
                        <span style={{ flex: 1 }}>{opt.label}</span>
                        {isSelected && <span className="material-symbols-outlined" style={{ fontSize: 16, color: t.accentText }}>check</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Material Palette — same trigger/dropdown style as Mode */}
            <div style={{ display: "flex", flexDirection: "column", gap: Math.max(4, t.scale.gap - 2), position: "relative" }}>
              <div style={{ fontSize: t.scale.labF, textTransform: "uppercase", color: t.fg2, letterSpacing: 1, fontWeight: 700 }}>Material Palette</div>

              {paletteOpen && (
                <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setPaletteOpen(false)} />
              )}

              {/* Trigger — token-driven, identical structure to Mode trigger */}
              <button
                onClick={() => setPaletteOpen(v => !v)}
                style={{
                  display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 12px", border: `1px solid ${paletteOpen ? t.accent : t.border}`, borderRadius: 4,
                  background: t.bg2, color: t.fg, cursor: "pointer", fontFamily: t.font, fontSize: 13,
                  transition: "border-color 150ms",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {selectedPalette
                    ? <><span style={{ width: 12, height: 12, borderRadius: "50%", background: selectedPalette.hex, flexShrink: 0, border: `1px solid ${t.border}`, display: "inline-block" }} />{selectedPalette.name}</>
                    : <span style={{ color: t.fg3 }}>Choose a color…</span>
                  }
                </span>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: t.fg3 }}>
                  {paletteOpen ? "expand_less" : "expand_more"}
                </span>
              </button>

              {/* Dropdown — all colors from DS tokens */}
              {paletteOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 99,
                  background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 4,
                  boxShadow: `0 4px 16px rgba(0,0,0,0.2)`, maxHeight: 220, overflowY: "auto",
                }}>
                  {(MATERIAL_COLORS as { name: string; hex: string }[]).map(c => {
                    const isSelected = m3.customColor === c.hex;
                    return (
                      <button
                        key={c.hex}
                        onClick={() => handlePaletteSelect(c.hex)}
                        style={{
                          display: "flex", width: "100%", alignItems: "center", gap: 10,
                          padding: "8px 12px", border: "none", cursor: "pointer",
                          fontFamily: t.font, fontSize: 13, textAlign: "left",
                          background: isSelected ? t.accentWeak : "transparent",
                          color: isSelected ? t.accentText : t.fg,
                          transition: "background 100ms",
                        }}
                      >
                        <span style={{ width: 12, height: 12, borderRadius: "50%", background: c.hex, flexShrink: 0, border: `1px solid ${t.border}`, display: "inline-block" }} />
                        <span style={{ flex: 1 }}>{c.name}</span>
                        <span style={{ fontSize: 10, color: isSelected ? t.accentText : t.fg3, fontFamily: "monospace" }}>{c.hex}</span>
                        {isSelected && <span className="material-symbols-outlined" style={{ fontSize: 16, color: t.accentText }}>check</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Density */}
            <ControlGroup label="Density">
              {([
                [0, "Default"],
                [-1, "Comfortable"],
                [-2, "Compact"],
                [-3, "Dense"],
              ] as [number, string][]).map(([d, label]) => (
                <CtrlBtn key={d} active={m3.density === d} onClick={() => setM3Density(d)}>{label}</CtrlBtn>
              ))}
            </ControlGroup>
          </div>
        )}
      </div>
    );
  }

  /* ── AUSOS DS ── */
  if (activeSystem === "ausos") {
    const { ausos, setAusosTheme, setAusosDensity, setAusosAccent } = store;

    const AUSOS_ACCENTS = [
      { name: "Violet", hex: "#9575F0", grad: "linear-gradient(135deg, #A78BFA, #7C3AED)" },
      { name: "Indigo", hex: "#6366F1", grad: "linear-gradient(135deg, #818CF8, #4F46E5)" },
      { name: "Blue", hex: "#3B82F6", grad: "linear-gradient(135deg, #60A5FA, #2563EB)" },
      { name: "Teal", hex: "#14B8A6", grad: "linear-gradient(135deg, #2DD4BF, #0D9488)" },
      { name: "Emerald", hex: "#10B981", grad: "linear-gradient(135deg, #34D399, #059669)" },
      { name: "Rose", hex: "#F43F5E", grad: "linear-gradient(135deg, #FB7185, #E11D48)" },
      { name: "Orange", hex: "#F97316", grad: "linear-gradient(135deg, #FB923C, #EA580C)" },
      { name: "Amber", hex: "#F59E0B", grad: "linear-gradient(135deg, #FBBF24, #D97706)" },
      { name: "Slate", hex: "#64748B", grad: "linear-gradient(135deg, #94A3B8, #475569)" },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <button onClick={() => setOpen(v => !v)} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: `${t.scale.gap - 2}px 0`, background: "none", border: "none", cursor: "pointer",
          fontSize: t.scale.labF, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1,
          color: t.fg2, fontFamily: t.font,
        }}>
          Controls
          <span style={{ fontSize: 14, transition: "transform 200ms", transform: open ? "rotate(0deg)" : "rotate(-90deg)", opacity: 0.6 }}>⌄</span>
        </button>
        {open && (
          <div style={{ display: "flex", flexDirection: "column", gap: t.scale.gap + 4, paddingBottom: t.scale.gap + 4 }}>
            <ControlGroup label="Theme">
              <CtrlBtn active={ausos.themeKey === "light"} onClick={() => setAusosTheme("light")}>Light</CtrlBtn>
              <CtrlBtn active={ausos.themeKey === "dark"} onClick={() => setAusosTheme("dark")}>Dark</CtrlBtn>
            </ControlGroup>

            {/* Accent Color Palette */}
            <div style={{ display: "flex", flexDirection: "column", gap: Math.max(4, t.scale.gap - 2), position: "relative" }}>
              <div style={{ fontSize: t.scale.labF, textTransform: "uppercase", color: t.fg2, letterSpacing: 1, fontWeight: 700 }}>Accent Color</div>
              {accentOpen && (
                <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setAccentOpen(false)} />
              )}
              <button
                onClick={() => setAccentOpen(v => !v)}
                style={{
                  display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 12px", border: `1px solid ${accentOpen ? t.accent : t.border}`,
                  borderRadius: 8, background: t.bg2 || t.bg, color: t.fg, cursor: "pointer",
                  fontFamily: t.font, fontSize: 12, transition: "border-color 150ms",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 14, height: 14, borderRadius: "50%", background: AUSOS_ACCENTS.find(a => a.hex === ausos.accentColor)?.grad || ausos.accentColor, flexShrink: 0, border: `1px solid ${t.border}` }} />
                  {AUSOS_ACCENTS.find(a => a.hex === ausos.accentColor)?.name || "Custom"}
                </span>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: t.fg3 }}>
                  {accentOpen ? "expand_less" : "expand_more"}
                </span>
              </button>
              {accentOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 99,
                  background: t.bg2 || t.bg, border: `1px solid ${t.border}`, borderRadius: 8,
                  boxShadow: `0 4px 16px rgba(0,0,0,0.2)`, overflow: "hidden",
                }}>
                  {AUSOS_ACCENTS.map(a => (
                    <button
                      key={a.hex}
                      onClick={() => { setAusosAccent(a.hex); setAccentOpen(false); }}
                      style={{
                        display: "flex", width: "100%", alignItems: "center", gap: 8,
                        padding: "8px 12px", border: "none", cursor: "pointer",
                        fontFamily: t.font, fontSize: 12, textAlign: "left",
                        background: ausos.accentColor === a.hex ? (t.accentWeak || "rgba(0,0,0,0.05)") : "transparent",
                        color: ausos.accentColor === a.hex ? a.hex : t.fg, transition: "background 100ms",
                      }}
                    >
                      <span style={{ width: 14, height: 14, borderRadius: "50%", background: a.grad, flexShrink: 0, border: `1px solid ${t.border}` }} />
                      <span style={{ flex: 1 }}>{a.name}</span>
                      {ausos.accentColor === a.hex && <span className="material-symbols-outlined" style={{ fontSize: 14, color: a.hex }}>check</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ControlGroup label="Density">
              {(["high", "medium", "low", "touch"] as const).map(k => (
                <CtrlBtn key={k} active={ausos.density === k} onClick={() => setAusosDensity(k)}>
                  {k === "high" ? "H.20" : k === "medium" ? "M.28" : k === "low" ? "L.36" : "T.44"}
                </CtrlBtn>
              ))}
            </ControlGroup>
          </div>
        )}
      </div>
    );
  }

  /* ── FLUENT 2 ── */
  const { fluent, setFluentTheme, setFluentSize } = store;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <button onClick={() => setOpen(v => !v)} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: `${t.scale.gap - 2}px 0`, background: "none", border: "none", cursor: "pointer",
        fontSize: t.scale.labF, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1,
        color: t.fg2, fontFamily: t.font,
      }}>
        Controls
        <span style={{ fontSize: 14, transition: "transform 200ms", transform: open ? "rotate(0deg)" : "rotate(-90deg)", opacity: 0.6 }}>⌄</span>
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: t.scale.gap + 4, paddingBottom: t.scale.gap + 4 }}>
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
      )}
    </div>
  );
}

/* ── SIDEBAR DS BRAND — badge + name + subtitle at the top of the drawer ── */
function SidebarDSBrand() {
  const { activeSystem } = useDesignHub();
  const t = useActiveTheme();
  const sysInfo = getSystemInfo(activeSystem);
  const components = getComponents(activeSystem);

  const badge = { label: activeSystem === "salt" ? "S" : activeSystem === "m3" ? "M3" : activeSystem === "fluent" ? "F2" : "A", bg: t.accent, color: t.accentFg };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: t.scale.gap + 2, padding: `${t.scale.gap + 2}px ${activeSystem === "m3" ? 16 : 14}px` }}>
      <div style={{
        width: t.scale.navF + 14, height: t.scale.navF + 14, borderRadius: activeSystem === "m3" ? 10 : 6,
        background: badge.bg, color: badge.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: t.scale.labF, fontWeight: 700, flexShrink: 0, fontFamily: t.font,
      }}>
        {badge.label}
      </div>
      <div>
        <div style={{ fontSize: t.scale.navF, fontWeight: 600, color: t.fg, lineHeight: 1.2 }}>{sysInfo.name}</div>
        <div style={{ fontSize: t.scale.labF - 1, color: t.fg2, marginTop: 1 }}>{components.length} components</div>
      </div>
    </div>
  );
}

/* ── SIDEBAR SEARCH — sticky between controls and scrollable list ── */
function SidebarSearch() {
  const { activeSystem, searchQuery, setSearchQuery } = useDesignHub();
  const t = useActiveTheme();
  const inputClass = activeSystem === "salt" ? "s-input" : activeSystem === "m3" ? "" : "f-input";
  return (
    <div style={{ position: "relative" }}>
      <span className="material-symbols-outlined" style={{
        position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
        fontSize: 15, color: t.fg3, pointerEvents: "none", lineHeight: 1,
      }}>search</span>
      <input
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className={inputClass}
        style={{
          background: activeSystem === "ausos" ? "transparent" : activeSystem === "m3" ? t.bg : t.bg2,
          color: t.fg, border: `1px solid ${t.border}`,
          borderRadius: activeSystem === "ausos" ? 9999 : activeSystem === "m3" ? 28 : 4,
          padding: `${t.scale.gap - 1}px 10px ${t.scale.gap - 1}px 28px`,
          fontSize: t.scale.navF, fontFamily: t.font, outline: "none", width: "100%",
          boxSizing: "border-box" as const,
          ...(activeSystem === "m3" ? { height: t.scale.navH - 8 } : {}),
        }}
      />
    </div>
  );
}

/* ── CONTENT TOP BAR — hamburger toggle + breadcrumb, replaces M3-only ContentHeader ── */
function ContentTopBar() {
  const { activeSystem, activeTab, selectedComponent, setSelectedComponent } = useDesignHub();
  const { sidebarOpen, toggleSidebar } = useDesignHub();
  const t = useActiveTheme();
  const sysInfo = getSystemInfo(activeSystem);

  // Build breadcrumb path
  const comp = selectedComponent ? getComponents(activeSystem).find(c => c.id === selectedComponent) : null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: t.scale.gap + 4,
      padding: `0 ${t.scale.gap + 12}px`,
      height: t.scale.tabH, flexShrink: 0,
      background: "transparent",
    }}>
      {/* Hamburger — toggles sidebar */}
      <button
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        style={{
          background: "none", border: "none", cursor: "pointer", padding: 4,
          display: "flex", alignItems: "center", color: t.fg2, borderRadius: 4,
          transition: "color 150ms",
        }}
      >
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: t.scale.navF + 4, lineHeight: 1 }}>
          {sidebarOpen ? "chevron_left" : "menu"}
        </span>
      </button>

      {/* Breadcrumb — DS-styled clickable segments */}
      <nav style={{ display: "flex", alignItems: "center", gap: t.scale.gap, fontSize: t.scale.navF - 1, fontFamily: t.font }}>
        {comp ? (
          <>
            <button onClick={() => setSelectedComponent(null)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: `${t.scale.gap - 2}px 0`, fontSize: t.scale.navF - 1, color: t.accent, fontFamily: t.font }}>
              {sysInfo.name}
            </button>
            <span style={{ color: t.fg3, fontSize: t.scale.labF }}>/</span>
            <span style={{ color: t.fg, fontWeight: 500, padding: `${t.scale.gap - 2}px 0` }}>{comp.name}</span>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "baseline", gap: t.scale.gap }}>
            <span style={{ color: t.fg, fontWeight: 500 }}>{sysInfo.name}</span>
            <span style={{ fontSize: t.scale.labF - 1, color: t.fg3, fontWeight: 400 }}>Interactive Documentation</span>
          </div>
        )}
      </nav>
    </div>
  );
}

/* ── COMPONENT LIST — nav items only (search is now in SidebarSearch above) ── */
/* ── Sub-category mapping for nested sidebar navigation ── */
const COMPONENT_SUBCATS: Record<string, string> = {
  /* Actions */
  buttons: "Actions", pills: "Actions", "toggle-btn": "Actions", "segmented-btn": "Actions",
  tag: "Actions", link: "Actions", links: "Actions", fabs: "Actions", "icon-buttons": "Actions",
  chips: "Actions",
  /* Inputs */
  inputs: "Inputs", "text-fields": "Inputs", checkboxes: "Inputs", radios: "Inputs",
  switches: "Inputs", slider: "Inputs", sliders: "Inputs", dropdown: "Inputs", dropdowns: "Inputs",
  "form-field": "Inputs", "list-box": "Inputs", "combo-box": "Inputs",
  "number-input": "Inputs", "multiline-input": "Inputs", calendar: "Inputs",
  "date-picker": "Inputs", "date-pickers": "Inputs", "file-drop": "Inputs",
  /* Navigation */
  tabs: "Navigation", menu: "Navigation", menus: "Navigation", stepper: "Navigation",
  pagination: "Navigation", "vert-nav": "Navigation", "nav-item": "Navigation",
  "skip-link": "Navigation", "nav-bar": "Navigation", breadcrumbs: "Navigation",
  /* Communication */
  banners: "Communication", dialog: "Communication", dialogs: "Communication",
  badges: "Communication", avatars: "Communication", tooltips: "Communication",
  progress: "Communication", toast: "Communication", spinner: "Communication",
  snackbar: "Communication", messagebars: "Communication", alerts: "Communication",
  /* Containment */
  cards: "Containment", accordion: "Containment", dividers: "Containment",
  drawer: "Containment", panel: "Containment", "data-grid": "Containment",
  table: "Containment", "data-table": "Containment", "ag-grid": "Containment",
  overlay: "Containment", splitter: "Containment",
  "static-list": "Containment", carousel: "Containment", "interactable-card": "Containment",
  collapsible: "Containment", "bottom-sheets": "Containment",
};
const SUBCAT_ORDER = ["Actions", "Inputs", "Navigation", "Communication", "Containment"];

function ComponentList() {
  const { activeSystem, selectedComponent, setSelectedComponent, searchQuery } = useDesignHub();
  const t = useActiveTheme();
  const components = getComponents(activeSystem);
  const categories = getCategories(activeSystem);

  const filtered = searchQuery
    ? components.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.desc.toLowerCase().includes(searchQuery.toLowerCase()))
    : components;

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set(["Foundations", "Patterns", ...SUBCAT_ORDER]));
  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group); else next.add(group);
      return next;
    });
  };

  /* DS-scoped nav classes */
  const itemClass = activeSystem === "salt" ? "s-sidebar-item" : activeSystem === "m3" ? "m3-menu-item" : activeSystem === "fluent" ? "f-sidebar-item" : "a-sidebar-item";

  const activeItemStyle = (active: boolean, isChild = false): React.CSSProperties => {
    const indent = isChild ? (activeSystem === "m3" ? 12 : 8) : 0;
    if (activeSystem === "m3") {
      /* M3: pill-shaped indicator, primaryContainer fill */
      return active
        ? { background: t.accentWeak, color: t.accentText, fontWeight: 500, borderRadius: 28, padding: `${t.scale.gap}px ${t.scale.gap + 10}px`, fontSize: t.scale.navF, border: "none", minHeight: t.scale.navH, marginLeft: indent }
        : { borderRadius: 28, padding: `${t.scale.gap}px ${t.scale.gap + 10}px`, fontSize: t.scale.navF, border: "none", background: "transparent", color: t.fg, minHeight: t.scale.navH, marginLeft: indent };
    }
    if (activeSystem === "fluent") {
      /* Fluent: subtleBgSelected, brand text, 4px radius */
      return active
        ? { fontSize: t.scale.navF, fontWeight: 600, color: t.accentText, background: t.accentWeak, borderRadius: 4, paddingLeft: t.scale.gap + 6, marginLeft: indent }
        : { fontSize: t.scale.navF, color: t.fg, paddingLeft: t.scale.gap + 6, marginLeft: indent };
    }
    if (activeSystem === "ausos") {
      /* ausos: clean minimal — subtle bg shift, no borders */
      return active
        ? { fontSize: t.scale.navF, fontWeight: 600, color: t.accent, background: t.accentWeak, borderRadius: 6, paddingLeft: t.scale.gap + 6, marginLeft: indent, border: "none" }
        : { fontSize: t.scale.navF, color: t.fg2, paddingLeft: t.scale.gap + 6, marginLeft: indent, border: "none" };
    }
    /* Salt: left accent border on active item */
    return active
      ? { fontSize: t.scale.navF, fontWeight: 600, color: t.accentText, background: t.accentWeak,
          borderLeft: `3px solid ${t.accent}`, borderRadius: "0 4px 4px 0", paddingLeft: t.scale.gap + 4, marginLeft: indent }
      : { fontSize: t.scale.navF, color: t.fg, borderLeft: "3px solid transparent", paddingLeft: t.scale.gap + 4, marginLeft: indent };
  };

  /* Section header style */
  const sectionHeaderStyle: React.CSSProperties = activeSystem === "m3"
    ? { fontSize: t.scale.labF, fontWeight: 500, color: t.fg2, letterSpacing: "0.5px", padding: `${t.scale.gap + 4}px 16px ${t.scale.gap - 4}px`, textTransform: "uppercase" }
    : { fontSize: t.scale.labF, textTransform: "uppercase", color: t.fg2, letterSpacing: "0.06em", padding: `${t.scale.gap}px 0 ${t.scale.gap - 2}px`, fontWeight: 700 };

  /* Collapsible group header style */
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
      style={{
        display: "flex", alignItems: "center", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: t.font,
        ...activeItemStyle(selectedComponent === c.id, isChild),
      }}
    >{c.name}</button>
  );

  /* Build Foundations group */
  const foundationItems = filtered.filter(c => c.cat === "Foundations");

  /* Build Components & Patterns with sub-categories */
  const componentItems = filtered.filter(c => c.cat === "Components & Patterns");
  const subcatGroups = SUBCAT_ORDER
    .map(sub => ({
      sub,
      items: componentItems
        .filter(c => COMPONENT_SUBCATS[c.id] === sub)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter(g => g.items.length > 0);

  /* Uncategorized components (no subcat mapping) */
  const mappedIds = new Set(componentItems.filter(c => COMPONENT_SUBCATS[c.id]).map(c => c.id));
  const uncategorized = componentItems.filter(c => !mappedIds.has(c.id)).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Foundations — flat list */}
      {foundationItems.length > 0 && (
        <div>
          <button onClick={() => toggleGroup("Foundations")} aria-expanded={expandedGroups.has("Foundations")} style={groupHeaderStyle(expandedGroups.has("Foundations"))}>
            <span style={sectionHeaderStyle}>Foundations</span>
            <span className="material-symbols-outlined" style={{
              fontSize: 14, color: t.fg3, transition: "transform 0.2s",
              transform: expandedGroups.has("Foundations") ? "rotate(0deg)" : "rotate(-90deg)",
            }}>expand_more</span>
          </button>
          {expandedGroups.has("Foundations") && foundationItems.map(c => renderItem(c))}
        </div>
      )}

      {/* Components & Patterns — nested sub-groups */}
      <div style={sectionHeaderStyle}>Components & Patterns</div>
      {subcatGroups.map(g => (
        <div key={g.sub}>
          <button onClick={() => toggleGroup(g.sub)} aria-expanded={expandedGroups.has(g.sub)} style={groupHeaderStyle(expandedGroups.has(g.sub))}>
            <span>{g.sub}</span>
            <span className="material-symbols-outlined" style={{
              fontSize: 14, color: t.fg3, transition: "transform 0.2s",
              transform: expandedGroups.has(g.sub) ? "rotate(0deg)" : "rotate(-90deg)",
            }}>expand_more</span>
          </button>
          {expandedGroups.has(g.sub) && g.items.map(c => renderItem(c, true))}
        </div>
      ))}

      {/* Uncategorized components */}
      {uncategorized.length > 0 && uncategorized.map(c => renderItem(c, true))}

      {/* Patterns — third top-level group */}
      {(() => {
        const patternItems = filtered.filter(c => c.cat === "Patterns").sort((a, b) => a.name.localeCompare(b.name));
        if (patternItems.length === 0) return null;
        return (
          <div>
            <button onClick={() => toggleGroup("Patterns")} aria-expanded={expandedGroups.has("Patterns")} style={groupHeaderStyle(expandedGroups.has("Patterns"))}>
              <span style={sectionHeaderStyle}>Patterns</span>
              <span className="material-symbols-outlined" style={{
                fontSize: 14, color: t.fg3, transition: "transform 0.2s",
                transform: expandedGroups.has("Patterns") ? "rotate(0deg)" : "rotate(-90deg)",
              }}>expand_more</span>
            </button>
            {expandedGroups.has("Patterns") && patternItems.map(c => renderItem(c))}
          </div>
        );
      })()}
    </div>
  );
}

/* ── TAB BAR — each DS renders its own native tab spec ── */
function TabBar() {
  const { activeTab, setActiveTab, activeSystem } = useDesignHub();
  const t = useActiveTheme();
  const tabs: { id: ActiveTab; label: string }[] = [
    { id: "preview", label: "Preview" },
    { id: "code", label: "Code" },
  ];

  /* ── M3 Primary Tabs: height + font scale with density ── */
  if (activeSystem === "m3") {
    return (
      <div style={{ display: "flex", background: t.bg, flexShrink: 0, borderBottom: `1px solid ${t.border}` }}>
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              position: "relative", height: t.scale.tabH, padding: `0 ${t.scale.gap + 18}px`,
              border: "none", background: "transparent", cursor: "pointer",
              fontSize: t.scale.navF, fontWeight: 500, letterSpacing: "0.1px", fontFamily: t.font,
              color: active ? t.accent : t.fg2, transition: "color 150ms",
            }}>
              {tab.label}
              {active && (
                <span style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: 3, background: t.accent, borderRadius: "3px 3px 0 0", display: "block",
                }} />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  /* ── Salt DS Tabs: s-tab class + font size from scale ── */
  if (activeSystem === "salt") {
    return (
      <div style={{ display: "flex", borderBottom: `1px solid ${t.border}`, background: t.bg, flexShrink: 0 }}>
        {tabs.map(tab => (
          <button key={tab.id} className={`s-tab${activeTab === tab.id ? " active" : ""}`}
            onClick={() => setActiveTab(tab.id)} style={{ fontFamily: t.font, fontSize: t.scale.navF }}>
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  /* ── ausos DS Tabs: M3-style underline with ausos theme ── */
  if (activeSystem === "ausos") {
    return (
      <div style={{ display: "flex", borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                position: "relative", height: t.scale.tabH, padding: `0 ${t.scale.gap + 14}px`,
                border: "none", background: "transparent", cursor: "pointer",
                fontSize: t.scale.navF, fontWeight: 500, fontFamily: t.font,
                color: active ? t.accent : t.fg3, transition: "color 150ms",
              }}>
              {tab.label}
              {active && (
                <span style={{
                  position: "absolute", bottom: 0, left: t.scale.gap + 6, right: t.scale.gap + 6,
                  height: 2, borderRadius: 1, background: t.accent,
                }} />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  /* ── Fluent 2 Tabs: f-tab class + font size from scale ── */
  return (
    <div style={{ display: "flex", borderBottom: `1px solid ${t.border}`, background: t.bg, flexShrink: 0 }}>
      {tabs.map(tab => (
        <button key={tab.id} className={`f-tab${activeTab === tab.id ? " active" : ""}`}
          onClick={() => setActiveTab(tab.id)} style={{ fontFamily: t.font, fontSize: t.scale.navF }}>
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

  /* ─── M3 layout: category sections, type scale + card sizes all follow density ─── */
  if (activeSystem === "m3") {
    const heroSize = Math.round(t.scale.tabH * 0.9);   // Display Large → scales with density
    const h2Size   = Math.round(t.scale.tabH * 0.45);  // Headline Medium
    const bodySize = t.scale.navF + 2;
    const outerPad = t.scale.gap * 4;
    return (
      <div style={{ padding: `${outerPad}px ${outerPad + 8}px ${outerPad}px`, fontFamily: t.font, background: t.bg, minHeight: "100%" }}>
        {/* Hero */}
        <div style={{ marginBottom: outerPad, borderBottom: `1px solid ${t.border}`, paddingBottom: outerPad - 8 }}>
          <div style={{
            fontSize: t.scale.labF, fontWeight: 500, color: t.accent,
            letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: t.scale.gap + 4,
          }}>
            Google · {sysInfo.org}
          </div>
          <h1 style={{
            fontSize: heroSize, fontWeight: 400, color: t.fg,
            lineHeight: 1.15, margin: `0 0 ${t.scale.gap + 8}px`, letterSpacing: "-0.25px",
          }}>
            {sysInfo.name}
          </h1>
          <p style={{ fontSize: bodySize, color: t.fg2, lineHeight: 1.6, maxWidth: 560, margin: 0 }}>
            {components.length} components across {categories.length} categories —
            expressive, adaptive, and accessible design system.
          </p>
          {/* Quick-stat chips */}
          <div style={{ display: "flex", gap: t.scale.gap - 2, marginTop: t.scale.gap + 10, flexWrap: "wrap" }}>
            {[
              { icon: "category", label: `${categories.length} Categories` },
              { icon: "widgets", label: `${components.length} Components` },
              { icon: "palette", label: "Dynamic Color" },
              { icon: "accessibility_new", label: "WCAG AA" },
            ].map(s => (
              <div key={s.label} style={{
                display: "flex", alignItems: "center", gap: t.scale.gap - 2,
                padding: `${t.scale.gap - 2}px ${t.scale.gap + 6}px`, borderRadius: 20,
                background: t.bg2, border: `1px solid ${t.border}`,
                fontSize: t.scale.navF - 1, color: t.fg2, fontWeight: 500,
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
              {/* Category header */}
              <div style={{ display: "flex", alignItems: "baseline", gap: t.scale.gap, marginBottom: t.scale.gap + 10 }}>
                <h2 style={{ fontSize: h2Size, fontWeight: 400, color: t.fg, margin: 0 }}>{cat}</h2>
                <span style={{ fontSize: t.scale.labF, color: t.fg2 }}>{catItems.length}</span>
              </div>
              {/* Component cards grid — gap + card internals scale with density */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: t.scale.gap + 2 }}>
                {catItems.map(c => {
                  const Preview = previews[c.id];
                  return (
                    <button key={c.id} className="m3-card m3-card-outlined"
                      onClick={() => setSelectedComponent(c.id)}
                      style={{ width: "100%", textAlign: "left", padding: 0, fontFamily: t.font, borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "box-shadow 200ms" }}
                    >
                      {/* Preview area */}
                      <div style={{
                        background: t.bg2, padding: t.scale.gap + 10, minHeight: t.scale.navH + 20,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        borderBottom: `1px solid ${t.border}`,
                      }}>
                        {Preview
                          ? <div style={{ pointerEvents: "none", width: "100%" }}><Preview /></div>
                          : <span className="material-symbols-outlined" style={{ fontSize: 32, color: t.fg3, opacity: 0.4 }}>widgets</span>
                        }
                      </div>
                      {/* Label area */}
                      <div style={{ padding: `${t.scale.gap + 2}px ${t.scale.gap + 6}px ${t.scale.gap + 4}px` }}>
                        <div style={{ fontSize: t.scale.navF, fontWeight: 500, color: t.fg, letterSpacing: "0.1px" }}>{c.name}</div>
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
  }

  /* ─── Salt / Fluent layout — same template as M3: hero + category sections ─── */
  const cardClass = activeSystem === "salt" ? "s-card" : activeSystem === "ausos" ? "a-card" : "f-card";
  const heroSize = Math.round(t.scale.tabH * 0.9);
  const h2Size   = Math.round(t.scale.tabH * 0.45);
  const bodySize = t.scale.navF + 2;
  const outerPad = t.scale.gap * 4;

  /* DS-specific feature pills */
  const featurePills = activeSystem === "salt"
    ? [
        { icon: "layers", label: "3-Layer Tokens" },
        { icon: "density_small", label: "4 Densities" },
        { icon: "accessibility_new", label: "WCAG AA" },
      ]
    : activeSystem === "ausos"
    ? [
        { icon: "blur_on", label: "Glassmorphism" },
        { icon: "gradient", label: "Aurora Themes" },
        { icon: "density_small", label: "4 Densities" },
        { icon: "accessibility_new", label: "WCAG AA" },
      ]
    : [
        { icon: "palette", label: "Brand Theming" },
        { icon: "straighten", label: "3 Sizes" },
        { icon: "accessibility_new", label: "WCAG AA" },
      ];

  return (
    <div style={{ padding: `${outerPad}px ${outerPad + 8}px`, fontFamily: t.font, background: t.bg, minHeight: "100%" }}>
      {/* Hero */}
      <div style={{ marginBottom: outerPad, borderBottom: `1px solid ${t.border}`, paddingBottom: outerPad - 8 }}>
        <div style={{
          fontSize: t.scale.labF, fontWeight: 700, color: t.accent,
          letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: t.scale.gap + 4,
        }}>
          {sysInfo.org}
        </div>
        <h1 style={{
          fontSize: heroSize, fontWeight: activeSystem === "salt" ? 700 : 600, color: t.fg,
          lineHeight: 1.15, margin: `0 0 ${t.scale.gap + 8}px`, letterSpacing: "-0.25px",
        }}>
          {sysInfo.name}
        </h1>
        <p style={{ fontSize: bodySize, color: t.fg2, lineHeight: 1.6, maxWidth: 560, margin: 0 }}>
          {components.length} components across {categories.length} categories —
          {activeSystem === "salt"
            ? " accessible, density-aware, token-driven design system."
            : activeSystem === "ausos"
            ? " glassmorphism-first, accessible, and token-driven design system."
            : " expressive, adaptive, and cross-platform design system."}
        </p>
        {/* Quick-stat pills */}
        <div style={{ display: "flex", gap: t.scale.gap - 2, marginTop: t.scale.gap + 10, flexWrap: "wrap" }}>
          {[
            { icon: "category", label: `${categories.length} Categories` },
            { icon: "widgets", label: `${components.length} Components` },
            ...featurePills,
          ].map(s => (
            <div key={s.label} style={{
              display: "flex", alignItems: "center", gap: t.scale.gap - 2,
              padding: `${t.scale.gap - 2}px ${t.scale.gap + 6}px`,
              borderRadius: activeSystem === "salt" ? 4 : 16,
              background: t.bg, border: `1px solid ${t.border}`,
              fontSize: t.scale.navF - 1, color: t.fg2, fontWeight: activeSystem === "salt" ? 600 : 500,
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
            {/* Category header */}
            <div style={{ display: "flex", alignItems: "baseline", gap: t.scale.gap, marginBottom: t.scale.gap + 10 }}>
              <h2 style={{ fontSize: h2Size, fontWeight: activeSystem === "salt" ? 700 : 600, color: t.fg, margin: 0 }}>{cat}</h2>
              <span style={{ fontSize: t.scale.labF, color: t.fg2 }}>{catItems.length}</span>
            </div>
            {/* Component cards grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: t.scale.gap + 2 }}>
              {catItems.map(c => {
                const Preview = previews[c.id];
                return (
                  <button key={c.id} className={cardClass}
                    onClick={() => setSelectedComponent(c.id)}
                    style={{
                      width: "100%", textAlign: "left", padding: 0, fontFamily: t.font, overflow: "hidden", cursor: "pointer",
                      borderRadius: activeSystem === "ausos" ? 14 : 8,
                      transition: "box-shadow 200ms, border-color 200ms",
                    }}
                  >
                    {/* Preview area */}
                    <div style={{
                      padding: t.scale.gap + 10, minHeight: t.scale.navH + 20,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      borderBottom: `1px solid ${t.border}`,
                    }}>
                      {Preview
                        ? <div style={{ pointerEvents: "none", width: "100%" }}><Preview /></div>
                        : <span className="material-symbols-outlined" style={{ fontSize: 32, color: t.fg3, opacity: 0.4 }}>widgets</span>
                      }
                    </div>
                    {/* Label area */}
                    <div style={{ padding: `${t.scale.gap + 2}px ${t.scale.gap + 6}px ${t.scale.gap + 4}px` }}>
                      <div style={{ fontSize: t.scale.navF, fontWeight: 500, color: t.fg }}>{c.name}</div>
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
}

/* ── CONTENT HEADER — breadcrumb + component title for M3 ── */
function ContentHeader() {
  const { activeSystem, activeTab, selectedComponent, setSelectedComponent } = useDesignHub();
  const t = useActiveTheme();
  if (activeSystem !== "m3" || !selectedComponent) return null;

  const components = getComponents(activeSystem);
  const comp = components.find(c => c.id === selectedComponent);
  if (!comp) return null;

  const sysInfo = getSystemInfo(activeSystem);
  return (
    <div style={{
      padding: `${t.scale.gap + 4}px ${t.scale.gap * 4}px 0`, background: t.bg, borderBottom: `1px solid ${t.border}`,
      flexShrink: 0,
    }}>
      {/* Breadcrumb — font scales with density */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: t.scale.labF, color: t.fg2, marginBottom: t.scale.gap }}>
        <button onClick={() => setSelectedComponent(null)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: t.scale.labF, color: t.accent, fontFamily: t.font }}>
          {sysInfo.name}
        </button>
        <span className="material-symbols-outlined" style={{ fontSize: t.scale.navF - 2, color: t.fg2 }}>chevron_right</span>
        <span style={{ color: t.fg2 }}>{comp.cat}</span>
        <span className="material-symbols-outlined" style={{ fontSize: t.scale.navF - 2, color: t.fg2 }}>chevron_right</span>
        <span style={{ color: t.fg, fontWeight: 500 }}>{comp.name}</span>
      </div>
      {/* Component title row — title scales with density */}
      <div style={{ display: "flex", alignItems: "baseline", gap: t.scale.gap + 4, paddingBottom: t.scale.gap + 4 }}>
        <h2 style={{ fontSize: Math.round(t.scale.tabH * 0.55), fontWeight: 400, color: t.fg, margin: 0, letterSpacing: "-0.25px" }}>
          {comp.name}
        </h2>
        <span style={{
          fontSize: t.scale.labF, color: t.accentText, background: t.accentWeak,
          padding: `${t.scale.gap - 4}px ${t.scale.gap + 4}px`, borderRadius: 20, fontWeight: 500,
        }}>
          {activeTab === "code" ? "Code" : "Preview"}
        </span>
      </div>
    </div>
  );
}

/* ── MAIN CONTENT ── */
function MainContent() {
  const { activeTab, selectedComponent, activeSystem } = useDesignHub();

  /* Tokens & Audit are standalone Foundations pages */
  if (selectedComponent === "tokens") return <TokenReference />;
  if (selectedComponent === "audit") return <AuditPanel />;

  /* Charts & Dataviz — uses ChartsPage as preview, CodePanel as code */
  if (selectedComponent === "charts") {
    return <ComponentPreview componentId="charts" />;
  }

  if (!selectedComponent) return <LandingGrid />;
  const components = getComponents(activeSystem);
  if (!components.find(c => c.id === selectedComponent)) return <LandingGrid />;
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

  // Detect dark theme for logo color — logo is black SVG, invert to white in dark mode
  const isDarkTheme = activeSystem === "salt"
    ? store.salt.themeKey.includes("dark")
    : activeSystem === "m3"
    ? store.m3.themeKey.startsWith("dark")
    : activeSystem === "ausos"
    ? store.ausos.themeKey === "dark"
    : store.fluent.themeKey === "dark";
  const logoFilter = isDarkTheme ? "brightness(0) invert(1)" : "brightness(0)";

  const pageGradient = undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: activeSystem === "ausos" ? t.bg : (pageGradient || t.bg2), fontFamily: t.font, color: t.fg, transition: "background 200ms, color 200ms" }}>
      {/* Inject the DS CSS */}
      <style dangerouslySetInnerHTML={{ __html: t.css }} />

      {/* Header — 3-column, height + padding scale with density */}
      <header style={{
        display: "flex", alignItems: "center",
        padding: `0 ${t.scale.gap + 4}px`,
        borderBottom: `1px solid ${activeSystem === "ausos" ? (isDarkTheme ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)") : t.border}`,
        background: activeSystem === "ausos" ? "transparent" : t.bg,
        minHeight: t.scale.hdrH, flexShrink: 0,
        position: "relative",
      }}>
        {/* Left — logo + title (hamburger moved to ContentTopBar) */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: t.scale.gap - 1 }}>
          <img src="/aologo.svg" alt="ausōs" style={{ height: t.scale.navF + 4, width: "auto", filter: logoFilter }} />
          <span style={{ fontSize: t.scale.navF + 1, fontWeight: 600, color: t.fg }}>UI Kit Overview</span>
        </div>

        {/* Center — DS switcher, always centered */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <SystemSwitcher />
        </div>

        {/* Right — theme badge + AI Builder */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: t.scale.gap, justifyContent: "flex-end" }}>
          <span style={{
            fontSize: t.scale.labF, color: t.accentText, background: t.accentWeak,
            padding: `${t.scale.gap - 3}px ${t.scale.gap + 4}px`, borderRadius: 9999, fontWeight: 600,
          }}>
            {t.T.name || sysInfo.name}
          </span>
          <Link href="/" target="_blank" rel="noopener noreferrer" style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: t.scale.labF + 1, fontWeight: 600, color: t.accentFg,
            background: t.accent,
            padding: `${t.scale.gap - 1}px ${t.scale.gap + 8}px`, borderRadius: 9999, textDecoration: "none",
          }}>
            AI Builder
          </Link>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar — DS brand → controls → sticky search → scrollable list */}
        {sidebarOpen && (
          <aside style={{
            width: t.scale.panelW,
            borderRight: `1px solid ${activeSystem === "ausos" ? (isDarkTheme ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)") : t.border}`,
            background: activeSystem === "ausos" ? "transparent" : activeSystem === "m3" ? t.bg2 : t.bg,
            display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0,
            transition: "background 200ms",
          }}>
            {/* 1 — DS brand header */}
            <div style={{ flexShrink: 0, borderBottom: `1px solid ${t.border}` }}>
              <SidebarDSBrand />
            </div>
            {/* 2 — Theme controls (collapsible) */}
            <div style={{ padding: `${t.scale.gap + 4}px ${t.scale.gap + 8}px ${t.scale.gap}px`, flexShrink: 0 }}>
              <ThemeControls />
            </div>
            {/* 3 — Sticky search */}
            <div style={{
              padding: `${t.scale.gap}px ${t.scale.gap + 8}px ${t.scale.gap + 4}px`,
              flexShrink: 0,
            }}>
              <SidebarSearch />
            </div>
            {/* 4 — Scrollable component list */}
            <div style={{
              padding: `${t.scale.gap}px ${t.scale.gap + 8}px ${t.scale.gap + 8}px`,
              overflowY: "auto", flex: 1,
            }}>
              <nav aria-label="Component navigation"><ComponentList /></nav>
            </div>
          </aside>
        )}

        {/* Main — ContentTopBar (hamburger + breadcrumb) always at top */}
        <main id="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: activeSystem === "ausos" ? "transparent" : t.bg }}>
          <ContentTopBar />
          <div style={{ flex: 1, overflowY: "auto" }}>
            <MainContent />
          </div>
        </main>
      </div>
    </div>
  );
}
