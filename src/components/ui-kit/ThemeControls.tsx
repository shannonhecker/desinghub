"use client";

import React, { useState } from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { useTheme } from "@/contexts/ThemeContext";
import { MATERIAL_COLORS } from "@/data/registry";
import { ModeIndicator } from "./ModeIndicator";

const M3_MODE_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "lightMediumContrast", label: "Light Medium Contrast" },
  { value: "lightHighContrast", label: "Light High Contrast" },
  { value: "darkMediumContrast", label: "Dark Medium Contrast" },
  { value: "darkHighContrast", label: "Dark High Contrast" },
  { value: "custom", label: "Custom" },
];

const AUSOS_ACCENTS = [
  { name: "Violet", hex: "#7E6BC4", grad: "linear-gradient(135deg, #8A7ABD, #6B5AA8)" },
  { name: "Indigo", hex: "#5558B8", grad: "linear-gradient(135deg, #6668C0, #4A4CA5)" },
  { name: "Blue", hex: "#4A74B0", grad: "linear-gradient(135deg, #5A84BA, #3D64A0)" },
  { name: "Teal", hex: "#3D8A82", grad: "linear-gradient(135deg, #4D9A92, #2F7A72)" },
  { name: "Emerald", hex: "#3A8868", grad: "linear-gradient(135deg, #4A9878, #2C7858)" },
  { name: "Rose", hex: "#B04060", grad: "linear-gradient(135deg, #C05070, #9A3050)" },
  { name: "Orange", hex: "#B06830", grad: "linear-gradient(135deg, #C07840, #9A5820)" },
  { name: "Amber", hex: "#9A7A20", grad: "linear-gradient(135deg, #AA8A30, #8A6A10)" },
  { name: "Slate", hex: "#5A6878", grad: "linear-gradient(135deg, #6A7888, #4A5868)" },
];

export function ThemeControls() {
  const store = useDesignHub();
  const { activeSystem } = store;
  const t = useTheme();
  const [open, setOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [accentOpen, setAccentOpen] = useState(false);

  /* Screen-reader announcement of the current theme+density summary.
     Updates on any store change; assistive tech reads the new state so
     users know the toggle landed. */
  const summary = React.useMemo(() => {
    if (activeSystem === "salt") return `Salt ${store.salt.themeKey}, density ${store.salt.density}`;
    if (activeSystem === "m3") return `Material 3 ${store.m3.themeKey}, density ${store.m3.density}`;
    if (activeSystem === "ausos") return `ausos ${store.ausos.themeKey}, density ${store.ausos.density}`;
    if (activeSystem === "carbon") return `Carbon ${store.carbon.themeKey}, density ${store.carbon.density}`;
    return `Fluent ${store.fluent.themeKey}, size ${store.fluent.size}`;
  }, [activeSystem, store.salt.themeKey, store.salt.density, store.m3.themeKey, store.m3.density, store.ausos.themeKey, store.ausos.density, store.carbon.themeKey, store.carbon.density, store.fluent.themeKey, store.fluent.size]);
  const [announce, setAnnounce] = useState("");
  const prevSummary = React.useRef(summary);
  React.useEffect(() => {
    if (prevSummary.current !== summary) setAnnounce(summary);
    prevSummary.current = summary;
  }, [summary]);
  const announceJsx = (
    <div role="status" aria-live="polite" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>
      {announce}
    </div>
  );

  function CtrlBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    const btnClass = activeSystem === "salt"
      ? `s-btn ${active ? "s-btn-solid" : "s-btn-bordered"}`
      : activeSystem === "m3"
      ? `m3-btn ${active ? "m3-btn-filled" : "m3-btn-outlined"}`
      : activeSystem === "ausos"
      ? `a-btn ${active ? "a-btn-primary" : "a-btn-ghost"}`
      : activeSystem === "carbon"
      ? `cb-btn ${active ? "cb-btn-primary" : "cb-btn-tertiary"}`
      : `f-btn ${active ? "f-btn-primary" : "f-btn-secondary"}`;

    return (
      <button className={btnClass} onClick={onClick}
        role="radio" aria-checked={active} tabIndex={active ? 0 : -1}
        style={{
          padding: `${t.scale.gap}px ${t.scale.gap + 8}px`,
          fontSize: t.scale.labF, fontFamily: t.font,
          cursor: "pointer", lineHeight: 1.4, minWidth: 0,
          height: "auto",
        }}>
        {children}
      </button>
    );
  }

  function ControlGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    const innerGap = Math.max(8, t.scale.gap);
    const btnGap   = Math.max(6, t.scale.gap - 2);
    const labelId = React.useId();
    const groupRef = React.useRef<HTMLDivElement>(null);
    const onKeyDown = (e: React.KeyboardEvent) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
      e.preventDefault();
      const buttons = Array.from(groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]') || []);
      if (buttons.length === 0) return;
      const idx = buttons.findIndex(b => b === document.activeElement);
      const start = idx < 0 ? 0 : idx;
      const dir = (e.key === "ArrowLeft" || e.key === "ArrowUp") ? -1 : 1;
      const next = buttons[(start + dir + buttons.length) % buttons.length];
      next.focus();
      next.click();
    };
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: innerGap }}>
        <div id={labelId} style={{ fontSize: t.scale.labF, textTransform: "uppercase" as const, color: t.fg2, letterSpacing: 1, fontWeight: 700 }}>{label}</div>
        <div ref={groupRef} role="radiogroup" aria-labelledby={labelId} onKeyDown={onKeyDown}
             style={{ display: "flex", gap: btnGap, flexWrap: "wrap", alignItems: "center" }}>
          {children}
        </div>
        {hint && (
          <div style={{ fontSize: 10, color: t.fg3, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginTop: -2, opacity: 0.8 }}>
            {hint}
          </div>
        )}
      </div>
    );
  }

  const collapseHeader = (
    <button onClick={() => setOpen(v => !v)} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: `${t.scale.gap - 2}px 0`, background: "none", border: "none", cursor: "pointer",
      fontSize: t.scale.labF, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 1,
      color: t.fg2, fontFamily: t.font,
    }}>
      Controls
      <span style={{ fontSize: 14, transition: "transform 200ms", transform: open ? "rotate(0deg)" : "rotate(-90deg)", opacity: 0.6 }}>⌄</span>
    </button>
  );

  /* ── SALT DS ── */
  if (activeSystem === "salt") {
    const { salt, setSaltTheme, setSaltDensity } = store;
    const theme = salt.themeKey.includes("jpm") ? "jpm" : "legacy";
    const mode = salt.themeKey.includes("dark") ? "dark" : "light";
    const set = (th: string, m: string) => setSaltTheme(`${th}-${m}`);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {announceJsx}
        {collapseHeader}
        {open && (
          <div style={{ display: "flex", flexDirection: "column", gap: t.scale.gap * 2 + 4, paddingBottom: t.scale.gap * 2 }}>
            <ControlGroup label="Theme">
              <CtrlBtn active={theme === "jpm"} onClick={() => set("jpm", mode)}>JPM Brand</CtrlBtn>
              <CtrlBtn active={theme === "legacy"} onClick={() => set("legacy", mode)}>Legacy</CtrlBtn>
            </ControlGroup>
            <ControlGroup label="Mode">
              <CtrlBtn active={mode === "light"} onClick={() => set(theme, "light")}>Light</CtrlBtn>
              <CtrlBtn active={mode === "dark"} onClick={() => set(theme, "dark")}>Dark</CtrlBtn>
            </ControlGroup>
            <ControlGroup label="Density" hint="compact  ·  comfortable  ·  spacious">
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
    const handlePaletteSelect = (hex: string) => { setM3CustomColor(hex); setM3DarkCustom(isDark); setM3Theme("custom"); setPaletteOpen(false); };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {announceJsx}
        {collapseHeader}
        {open && (
          <div style={{ display: "flex", flexDirection: "column", gap: t.scale.gap * 2 + 4, paddingBottom: t.scale.gap * 2 }}>
            {/* Mode dropdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: Math.max(4, t.scale.gap - 2), position: "relative" }}>
              <div style={{ fontSize: t.scale.labF, textTransform: "uppercase", color: t.fg2, letterSpacing: 1, fontWeight: 700 }}>Mode</div>
              {modeOpen && <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setModeOpen(false)} />}
              <button onClick={() => setModeOpen(v => !v)} style={{
                display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between",
                padding: "8px 12px", border: `1px solid ${modeOpen ? t.accent : t.border}`, borderRadius: 4,
                background: t.bg2, color: t.fg, cursor: "pointer", fontFamily: t.font, fontSize: 13, transition: "border-color 150ms",
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ModeIndicator value={isCustom ? "custom" : m3.themeKey} customColor={m3.customColor} border={t.border} />
                  {M3_MODE_OPTIONS.find(o => o.value === (isCustom ? "custom" : m3.themeKey))?.label}
                </span>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: t.fg3 }}>{modeOpen ? "expand_less" : "expand_more"}</span>
              </button>
              {modeOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 99, background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", overflow: "hidden" }}>
                  {M3_MODE_OPTIONS.map(opt => {
                    const isSelected = (isCustom ? "custom" : m3.themeKey) === opt.value;
                    return (
                      <button key={opt.value} onClick={() => { setM3Theme(opt.value); setModeOpen(false); }}
                        style={{ display: "flex", width: "100%", alignItems: "center", gap: 8, padding: "9px 12px", border: "none", cursor: "pointer", fontFamily: t.font, fontSize: 13, textAlign: "left", background: isSelected ? t.accentWeak : "transparent", color: isSelected ? t.accentText : t.fg, transition: "background 100ms" }}>
                        <ModeIndicator value={opt.value} customColor={m3.customColor} border={t.border} />
                        <span style={{ flex: 1 }}>{opt.label}</span>
                        {isSelected && <span className="material-symbols-outlined" style={{ fontSize: 16, color: t.accentText }}>check</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Material Palette dropdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: Math.max(4, t.scale.gap - 2), position: "relative" }}>
              <div style={{ fontSize: t.scale.labF, textTransform: "uppercase", color: t.fg2, letterSpacing: 1, fontWeight: 700 }}>Material Palette</div>
              {paletteOpen && <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setPaletteOpen(false)} />}
              <button onClick={() => setPaletteOpen(v => !v)} style={{
                display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between",
                padding: "8px 12px", border: `1px solid ${paletteOpen ? t.accent : t.border}`, borderRadius: 4,
                background: t.bg2, color: t.fg, cursor: "pointer", fontFamily: t.font, fontSize: 13, transition: "border-color 150ms",
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {selectedPalette
                    ? <><span style={{ width: 12, height: 12, borderRadius: "50%", background: selectedPalette.hex, flexShrink: 0, border: `1px solid ${t.border}`, display: "inline-block" }} />{selectedPalette.name}</>
                    : <span style={{ color: t.fg3 }}>Choose a color…</span>}
                </span>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: t.fg3 }}>{paletteOpen ? "expand_less" : "expand_more"}</span>
              </button>
              {paletteOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 99, background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", maxHeight: 220, overflowY: "auto" }}>
                  {(MATERIAL_COLORS as { name: string; hex: string }[]).map(c => {
                    const isSelected = m3.customColor === c.hex;
                    return (
                      <button key={c.hex} onClick={() => handlePaletteSelect(c.hex)}
                        style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, padding: "8px 12px", border: "none", cursor: "pointer", fontFamily: t.font, fontSize: 13, textAlign: "left", background: isSelected ? t.accentWeak : "transparent", color: isSelected ? t.accentText : t.fg, transition: "background 100ms" }}>
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

            <ControlGroup label="Density" hint="compact  ·  comfortable  ·  spacious">
              {([[0, "Default"], [-1, "Comfortable"], [-2, "Compact"], [-3, "Dense"]] as [number, string][]).map(([d, label]) => (
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
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {announceJsx}
        {collapseHeader}
        {open && (
          <div style={{ display: "flex", flexDirection: "column", gap: t.scale.gap * 2 + 4, paddingBottom: t.scale.gap * 2 }}>
            <ControlGroup label="Theme">
              <CtrlBtn active={ausos.themeKey === "light"} onClick={() => setAusosTheme("light")}>Light</CtrlBtn>
              <CtrlBtn active={ausos.themeKey === "dark"} onClick={() => setAusosTheme("dark")}>Dark</CtrlBtn>
            </ControlGroup>
            <div style={{ display: "flex", flexDirection: "column", gap: Math.max(4, t.scale.gap - 2), position: "relative" }}>
              <div style={{ fontSize: t.scale.labF, textTransform: "uppercase", color: t.fg2, letterSpacing: 1, fontWeight: 700 }}>Accent Color</div>
              {accentOpen && <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setAccentOpen(false)} />}
              <button onClick={() => setAccentOpen(v => !v)} style={{
                display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between",
                padding: `${t.scale.gap}px ${t.scale.gap + 4}px`, border: `1px solid ${accentOpen ? t.accent : t.border}`,
                borderRadius: t.scale.gap, background: t.bg2 || t.bg, color: t.fg, cursor: "pointer",
                fontFamily: t.font, fontSize: t.scale.navF, transition: "border-color 150ms", height: t.scale.navH + 4,
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 14, height: 14, borderRadius: "50%", background: AUSOS_ACCENTS.find(a => a.hex === ausos.accentColor)?.grad || ausos.accentColor, flexShrink: 0, border: `1px solid ${t.border}` }} />
                  {AUSOS_ACCENTS.find(a => a.hex === ausos.accentColor)?.name || "Custom"}
                </span>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: t.fg3 }}>{accentOpen ? "expand_less" : "expand_more"}</span>
              </button>
              {accentOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 99, background: t.bg2 || t.bg, border: `1px solid ${t.border}`, borderRadius: t.scale.gap, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", overflow: "hidden" }}>
                  {AUSOS_ACCENTS.map(a => (
                    <button key={a.hex} onClick={() => { setAusosAccent(a.hex); setAccentOpen(false); }}
                      style={{ display: "flex", width: "100%", alignItems: "center", gap: 8, padding: `${t.scale.gap}px ${t.scale.gap + 4}px`, border: "none", cursor: "pointer", fontFamily: t.font, fontSize: t.scale.navF, textAlign: "left", background: ausos.accentColor === a.hex ? (t.accentWeak || "rgba(0,0,0,0.05)") : "transparent", color: ausos.accentColor === a.hex ? a.hex : t.fg, transition: "background 100ms" }}>
                      <span style={{ width: 14, height: 14, borderRadius: "50%", background: a.grad, flexShrink: 0, border: `1px solid ${t.border}` }} />
                      <span style={{ flex: 1 }}>{a.name}</span>
                      {ausos.accentColor === a.hex && <span className="material-symbols-outlined" style={{ fontSize: 14, color: a.hex }}>check</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <ControlGroup label="Density" hint="compact  ·  comfortable  ·  spacious">
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

  /* ── CARBON DS ── */
  if (activeSystem === "carbon") {
    const { carbon, setCarbonTheme, setCarbonDensity } = store;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {announceJsx}
        {collapseHeader}
        {open && (
          <div style={{ display: "flex", flexDirection: "column", gap: t.scale.gap * 2 + 4, paddingBottom: t.scale.gap * 2 }}>
            <ControlGroup label="Theme">
              {(["white", "g10", "g90", "g100"] as const).map(k => (
                <CtrlBtn key={k} active={carbon.themeKey === k} onClick={() => setCarbonTheme(k)}>
                  {k.toUpperCase()}
                </CtrlBtn>
              ))}
            </ControlGroup>
            <ControlGroup label="Density" hint="compact  ·  comfortable  ·  spacious">
              {(["compact", "normal", "spacious"] as const).map(k => (
                <CtrlBtn key={k} active={carbon.density === k} onClick={() => setCarbonDensity(k)}>
                  {k === "compact" ? "Compact" : k === "normal" ? "Normal" : "Spacious"}
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
      {announceJsx}
      {collapseHeader}
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: t.scale.gap * 2 + 4, paddingBottom: t.scale.gap * 2 }}>
          <ControlGroup label="Theme">
            <CtrlBtn active={fluent.themeKey === "light"} onClick={() => setFluentTheme("light")}>Light</CtrlBtn>
            <CtrlBtn active={fluent.themeKey === "dark"} onClick={() => setFluentTheme("dark")}>Dark</CtrlBtn>
          </ControlGroup>
          <ControlGroup label="Size" hint="compact  ·  comfortable  ·  spacious">
            {([["small","S.24"],["medium","M.32"],["large","L.40"]] as const).map(([k,l]) => (
              <CtrlBtn key={k} active={fluent.size === k} onClick={() => setFluentSize(k)}>{l}</CtrlBtn>
            ))}
          </ControlGroup>
        </div>
      )}
    </div>
  );
}
