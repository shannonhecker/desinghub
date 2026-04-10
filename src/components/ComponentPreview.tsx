"use client";

import React, { useState } from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { getComponents, getTheme, getFullCSS, getFont, getSystemInfo } from "@/data/registry";

/* ── SALT DEMOS ── */
function SaltButtonDemo({ T }: { T: any }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.fg }}>Appearances</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="s-btn s-btn-solid">Solid</button>
        <button className="s-btn s-btn-bordered">Bordered</button>
        <button className="s-btn s-btn-transparent">Transparent</button>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.fg, marginTop: 8 }}>Sentiments</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="s-btn s-btn-solid">Accented</button>
        <button className="s-btn s-btn-neutral">Neutral</button>
        <button className="s-btn" style={{ background: T.positive, color: "#fff" }}>Positive</button>
        <button className="s-btn" style={{ background: T.caution, color: "#fff" }}>Caution</button>
        <button className="s-btn s-btn-negative">Negative</button>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.fg, marginTop: 8 }}>States</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="s-btn s-btn-solid">Default</button>
        <button className="s-btn s-btn-solid" disabled>Disabled</button>
      </div>
    </div>
  );
}

function SaltInputDemo({ T }: { T: any }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 300 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: T.fg }}>Label</label>
        <input className="s-input" placeholder="Enter text..." value={val} onChange={(e) => setVal(e.target.value)} />
        <span style={{ fontSize: 10, color: T.fg3 }}>Helper text</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: T.negative }}>Error State</label>
        <input className="s-input" defaultValue="Invalid value" style={{ borderBottomColor: T.negative }} />
        <span style={{ fontSize: 10, color: T.negative }}>Validation error</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: T.fgDis }}>Disabled</label>
        <input className="s-input" disabled placeholder="Disabled" />
      </div>
    </div>
  );
}

function SaltCardDemo({ T }: { T: any }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
      {["Project Alpha", "Dashboard", "Analytics"].map((title) => (
        <div key={title} className="s-card" tabIndex={0}>
          <div style={{ height: 80, background: `linear-gradient(135deg, ${T.accent}40, ${T.accent}10)` }} />
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.fg }}>{title}</div>
            <div style={{ fontSize: 11, color: T.fg3, marginTop: 4 }}>Card description text</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SaltCheckboxDemo({ T }: { T: any }) {
  const [checks, setChecks] = useState([true, false, false]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {["Option A", "Option B", "Option C"].map((label, i) => (
        <label key={i} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: T.fg }}>
          <div
            className={`s-checkbox ${checks[i] ? "checked" : ""}`}
            onClick={() => { const n = [...checks]; n[i] = !n[i]; setChecks(n); }}
          >
            {checks[i] && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>}
          </div>
          {label}
        </label>
      ))}
    </div>
  );
}

function SaltSwitchDemo({ T }: { T: any }) {
  const [on1, setOn1] = useState(true);
  const [on2, setOn2] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[{ on: on1, set: setOn1, label: "Notifications" }, { on: on2, set: setOn2, label: "Dark mode" }].map((s) => (
        <label key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 12, color: T.fg }}>
          <div className={`s-switch ${s.on ? "on" : ""}`} onClick={() => s.set(!s.on)}>
            <div className="s-switch-thumb" />
          </div>
          {s.label}
        </label>
      ))}
    </div>
  );
}

function SaltTabsDemo({ T }: { T: any }) {
  const [tab, setTab] = useState(0);
  const tabs = ["Overview", "Details", "Settings"];
  return (
    <div>
      <div style={{ display: "flex" }}>
        {tabs.map((t, i) => (
          <button key={t} className={`s-tab ${tab === i ? "active" : ""}`} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>
      <div style={{ padding: 12, fontSize: 12, color: T.fg2 }}>Content for {tabs[tab]}</div>
    </div>
  );
}

function SaltBannerDemo({ T }: { T: any }) {
  const banners = [
    { label: "Info", bg: T.infoWeak, color: T.info, border: T.info },
    { label: "Success", bg: T.positiveWeak, color: T.positive, border: T.positive },
    { label: "Warning", bg: T.cautionWeak, color: T.caution, border: T.caution },
    { label: "Error", bg: T.negativeWeak, color: T.negative, border: T.negative },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {banners.map((b) => (
        <div key={b.label} className="s-banner" style={{ background: b.bg, borderColor: b.border, color: b.color }}>
          {b.label}: This is a {b.label.toLowerCase()} banner message.
        </div>
      ))}
    </div>
  );
}

function SaltBadgeDemo({ T }: { T: any }) {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
      <span className="s-badge" style={{ background: T.accent, color: T.accentFg }}>3</span>
      <span className="s-badge" style={{ background: T.negative, color: "#fff" }}>9+</span>
      <span className="s-badge" style={{ background: T.positive, color: "#fff" }}>OK</span>
      <span className="s-badge" style={{ background: T.caution, color: "#fff" }}>!</span>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: T.accent, display: "inline-block" }} />
    </div>
  );
}

function SaltProgressDemo({ T }: { T: any }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 300 }}>
      <div>
        <div style={{ fontSize: 11, color: T.fg2, marginBottom: 4 }}>75% Complete</div>
        <div className="s-progress"><div className="s-progress-bar" style={{ width: "75%" }} /></div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: T.fg2, marginBottom: 4 }}>30% Complete</div>
        <div className="s-progress"><div className="s-progress-bar" style={{ width: "30%" }} /></div>
      </div>
    </div>
  );
}

function SaltAccordionDemo({ T }: { T: any }) {
  const [open, setOpen] = useState(0);
  const items = ["General Settings", "Notifications", "Privacy & Security"];
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 6 }}>
      {items.map((item, i) => (
        <div key={i}>
          <button className="s-accordion-header" onClick={() => setOpen(open === i ? -1 : i)}>
            <span>{item}</span>
            <span style={{ transform: open === i ? "rotate(180deg)" : "none", transition: "transform 200ms", fontSize: 14 }}>▾</span>
          </button>
          {open === i && (
            <div style={{ padding: 12, fontSize: 12, color: T.fg2, borderBottom: `1px solid ${T.border}` }}>
              Content for {item}. Configure your preferences here.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── M3 DEMOS ── */
function M3ButtonDemo({ T }: { T: any }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: T.onSurface }}>Variants</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="m3-btn m3-btn-filled">Filled</button>
        <button className="m3-btn m3-btn-outlined">Outlined</button>
        <button className="m3-btn m3-btn-text">Text</button>
        <button className="m3-btn m3-btn-elevated">Elevated</button>
        <button className="m3-btn m3-btn-tonal">Tonal</button>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="m3-btn m3-btn-filled" disabled>Disabled</button>
      </div>
    </div>
  );
}

function M3CardDemo({ T }: { T: any }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
      {[["Elevated", "m3-card-elevated"], ["Filled", "m3-card-filled"], ["Outlined", "m3-card-outlined"]].map(([label, cls]) => (
        <div key={label} className={`m3-card ${cls}`} tabIndex={0}>
          <div style={{ height: 80, background: `linear-gradient(135deg, ${T.primaryContainer}, ${T.tertiaryContainer})` }} />
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: T.onSurface }}>{label}</div>
            <div style={{ fontSize: 14, color: T.onSurfaceVariant, marginTop: 4 }}>Card variant</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function M3ChipDemo({ T }: { T: any }) {
  const [selected, setSelected] = useState<number[]>([0]);
  const chips = ["Filter", "Assist", "Input", "Suggestion"];
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {chips.map((c, i) => (
        <button key={c} className={`m3-chip ${selected.includes(i) ? "selected" : ""}`}
          onClick={() => setSelected(selected.includes(i) ? selected.filter(x => x !== i) : [...selected, i])}>
          {selected.includes(i) && "✓ "}{c}
        </button>
      ))}
    </div>
  );
}

function M3SwitchDemo({ T }: { T: any }) {
  const [on, setOn] = useState(true);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: T.onSurface }}>
      <div className={`m3-switch ${on ? "on" : ""}`} onClick={() => setOn(!on)} style={{ cursor: "pointer" }}>
        <div className="m3-switch-thumb" />
      </div>
      {on ? "On" : "Off"}
    </div>
  );
}

function M3TabsDemo({ T }: { T: any }) {
  const [tab, setTab] = useState(0);
  return (
    <div>
      <div style={{ display: "flex" }}>
        {["Tab 1", "Tab 2", "Tab 3"].map((t, i) => (
          <button key={t} className={`m3-tab ${tab === i ? "active" : ""}`} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>
      <div style={{ padding: 16, fontSize: 14, color: T.onSurfaceVariant }}>Content for Tab {tab + 1}</div>
    </div>
  );
}

function M3ProgressDemo({ T }: { T: any }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 300 }}>
      <div className="m3-progress"><div className="m3-progress-bar" style={{ width: "60%" }} /></div>
      <div className="m3-progress"><div className="m3-progress-bar" style={{ width: "85%" }} /></div>
    </div>
  );
}

/* ── FLUENT DEMOS ── */
function FluentButtonDemo({ T }: { T: any }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.fg1 }}>Appearances</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="f-btn f-btn-primary">Primary</button>
        <button className="f-btn f-btn-default">Default</button>
        <button className="f-btn f-btn-outline">Outline</button>
        <button className="f-btn f-btn-subtle">Subtle</button>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.fg1 }}>Sizes</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button className="f-btn f-btn-primary f-btn-sm">Small</button>
        <button className="f-btn f-btn-primary">Medium</button>
        <button className="f-btn f-btn-primary f-btn-lg">Large</button>
      </div>
    </div>
  );
}

function FluentInputDemo({ T }: { T: any }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 300 }}>
      <div className="f-input-wrap">
        <label className="f-input-label">Full name</label>
        <input className="f-input" placeholder="Enter your name" />
      </div>
      <div className="f-input-wrap">
        <label className="f-input-label" style={{ color: T.dangerFg1 }}>Email (error)</label>
        <input className="f-input" defaultValue="invalid" style={{ borderBottomColor: T.dangerBg3 }} />
        <span style={{ fontSize: 12, color: T.dangerFg1 }}>Invalid email address</span>
      </div>
    </div>
  );
}

function FluentCardDemo({ T }: { T: any }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
      {["Dashboard", "Reports", "Settings"].map((title) => (
        <div key={title} className="f-card" tabIndex={0}>
          <div style={{ height: 80, background: `linear-gradient(135deg, ${T.brandBg}30, ${T.brandBg2})` }} />
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.fg1 }}>{title}</div>
            <div style={{ fontSize: 12, color: T.fg3, marginTop: 4 }}>Card description</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FluentSwitchDemo({ T }: { T: any }) {
  const [on, setOn] = useState(true);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: T.fg1 }}>
      <div className={`f-switch ${on ? "on" : ""}`} onClick={() => setOn(!on)} style={{ cursor: "pointer" }}>
        <div className="f-switch-thumb" />
      </div>
      {on ? "On" : "Off"}
    </div>
  );
}

function FluentTabsDemo({ T }: { T: any }) {
  const [tab, setTab] = useState(0);
  return (
    <div>
      <div style={{ display: "flex" }}>
        {["Home", "Activity", "Settings"].map((t, i) => (
          <button key={t} className={`f-tab ${tab === i ? "active" : ""}`} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>
      <div style={{ padding: 12, fontSize: 14, color: T.fg2 }}>Content for tab {tab + 1}</div>
    </div>
  );
}

function FluentBadgeDemo({ T }: { T: any }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <span className="f-badge" style={{ background: T.brandBg, color: T.fgOnBrand }}>5</span>
      <span className="f-badge" style={{ background: T.dangerBg3, color: "#fff" }}>3</span>
      <span className="f-badge" style={{ background: T.successBg3, color: "#fff" }}>OK</span>
      <span className="f-badge" style={{ background: T.warningBg3, color: "#fff" }}>!</span>
    </div>
  );
}

function FluentMessageBarDemo({ T }: { T: any }) {
  const bars = [
    { label: "Info", bg: T.brandBg2, color: T.brandFg1 },
    { label: "Success", bg: T.successBg1, color: T.successFg1 },
    { label: "Warning", bg: T.warningBg1, color: T.warningFg1 },
    { label: "Danger", bg: T.dangerBg1, color: T.dangerFg1 },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {bars.map((b) => (
        <div key={b.label} className="f-messagebar" style={{ background: b.bg, color: b.color }}>
          <strong>{b.label}:</strong> This is a {b.label.toLowerCase()} message.
        </div>
      ))}
    </div>
  );
}

/* ── GENERIC PLACEHOLDER DEMO ── */
function GenericDemo({ T, system, comp }: { T: any; system: string; comp: any }) {
  const fgColor = system === "salt" ? T.fg : system === "m3" ? T.onSurface : T.fg1;
  const fg2Color = system === "salt" ? T.fg2 : system === "m3" ? T.onSurfaceVariant : T.fg2;
  const accentColor = system === "salt" ? T.accent : system === "m3" ? T.primary : T.brandBg;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: fgColor }}>{comp.name}</div>
      <div style={{ fontSize: 12, color: fg2Color, lineHeight: 1.5 }}>{comp.desc}</div>
      <div style={{
        padding: 24, borderRadius: 8, border: `1px dashed ${system === "salt" ? T.border : system === "m3" ? T.outlineVariant : T.stroke2}`,
        display: "flex", alignItems: "center", justifyContent: "center", color: fg2Color, fontSize: 12,
      }}>
        <span style={{ color: accentColor, fontWeight: 600 }}>Interactive demo</span>
        <span style={{ margin: "0 6px" }}>--</span>
        <span>Component preview area</span>
      </div>
    </div>
  );
}

/* ── DEMO REGISTRY ── */
const SALT_DEMOS: Record<string, React.FC<{ T: any }>> = {
  buttons: SaltButtonDemo, inputs: SaltInputDemo, cards: SaltCardDemo,
  checkboxes: SaltCheckboxDemo, switches: SaltSwitchDemo, tabs: SaltTabsDemo,
  banners: SaltBannerDemo, badges: SaltBadgeDemo, progress: SaltProgressDemo,
  accordion: SaltAccordionDemo,
};

const M3_DEMOS: Record<string, React.FC<{ T: any }>> = {
  buttons: M3ButtonDemo, cards: M3CardDemo, chips: M3ChipDemo,
  switches: M3SwitchDemo, tabs: M3TabsDemo, progress: M3ProgressDemo,
};

const FLUENT_DEMOS: Record<string, React.FC<{ T: any }>> = {
  buttons: FluentButtonDemo, inputs: FluentInputDemo, cards: FluentCardDemo,
  switches: FluentSwitchDemo, tabs: FluentTabsDemo, badges: FluentBadgeDemo,
  messagebars: FluentMessageBarDemo,
};

/* ── COMPONENT PREVIEW ── */
export function ComponentPreview({ componentId }: { componentId: string }) {
  const store = useDesignHub();
  const { activeSystem } = store;
  const components = getComponents(activeSystem);
  const comp = components.find((c) => c.id === componentId);
  if (!comp) return null;

  const T = activeSystem === "salt"
    ? getTheme("salt", store.salt.themeKey)
    : activeSystem === "m3"
    ? getTheme("m3", store.m3.themeKey, store.m3.customColor, store.m3.isDarkCustom)
    : getTheme("fluent", store.fluent.themeKey);

  const densityOrSize = activeSystem === "salt" ? store.salt.density : activeSystem === "m3" ? store.m3.density : store.fluent.size;
  const css = getFullCSS(activeSystem, T, densityOrSize);
  const font = getFont(activeSystem);
  const bgColor = activeSystem === "salt" ? T.bg : activeSystem === "m3" ? T.surface : T.bg1;
  const fgColor = activeSystem === "salt" ? T.fg : activeSystem === "m3" ? T.onSurface : T.fg1;
  const borderColor = activeSystem === "salt" ? T.border : activeSystem === "m3" ? T.outlineVariant : T.stroke2;
  const sysInfo = getSystemInfo(activeSystem);

  const demos = activeSystem === "salt" ? SALT_DEMOS : activeSystem === "m3" ? M3_DEMOS : FLUENT_DEMOS;
  const DemoComponent = demos[componentId];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => store.setSelectedComponent(null)}
          style={{ background: "none", border: "none", color: "#4fc3f7", cursor: "pointer", fontSize: 12, fontFamily: "inherit", padding: 0, marginBottom: 8 }}
        >
          ← Back to all
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", color: sysInfo.color, background: `${sysInfo.color}18`, padding: "2px 8px", borderRadius: 8, fontWeight: 600 }}>
            {comp.cat}
          </span>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{comp.name}</h2>
        <p style={{ fontSize: 13, color: "#707080", lineHeight: 1.5 }}>{comp.desc}</p>
      </div>

      {/* Live Preview */}
      <div style={{
        background: bgColor, borderRadius: 8, border: `1px solid ${borderColor}`,
        padding: 24, fontFamily: font, color: fgColor,
      }}>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        {DemoComponent ? <DemoComponent T={T} /> : <GenericDemo T={T} system={activeSystem} comp={comp} />}
      </div>
    </div>
  );
}
