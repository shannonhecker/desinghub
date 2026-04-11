"use client";

import React, { useState } from "react";
import { useBuilder } from "@/store/useBuilder";
import {
  SimulatedAvatar, SimulatedDropdown, SimulatedDataTable, SimulatedDatePicker,
  SimulatedDialog, SimulatedTabs, SimulatedInput, SimulatedCheckbox, SimulatedSwitch,
  SimulatedAlert, SimulatedProgress, SimulatedTooltip,
} from "./SimulatedUI";
import { PreviewCanvas } from "./PreviewCanvas";

/* ── Default welcome state ── */
function DefaultPreview() {
  return (
    <div className="preview-default">
      <div className="preview-default-icon">
        <span className="material-symbols-outlined" style={{ fontSize: 32, color: "white" }}>
          auto_awesome
        </span>
      </div>
      <h3 className="preview-default-title">Design Preview</h3>
      <p className="preview-default-desc">
        Start a conversation to see your design come to life. Try asking for a
        dashboard, landing page, or form.
      </p>
      <div className="preview-default-tags">
        <span className="preview-tag">Salt DS</span>
        <span className="preview-tag">Material 3</span>
        <span className="preview-tag">Fluent 2</span>
      </div>
    </div>
  );
}

/* ── Preview content — interactive UI kit components ── */
function PreviewContent() {
  const { designSystem, interfaceType, selectedComponents, colorOverrides } = useBuilder();

  /* ── Interactive state ── */
  const [activeTab, setActiveTab] = useState(0);
  const [radio, setRadio] = useState("a");
  const [activeBtn, setActiveBtn] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [activeBadge, setActiveBadge] = useState<string | null>(null);

  /* Semantic tokens reference — all values come from CSS custom properties */
  const t = {
    primary: "var(--ds-primary)",
    bg: "var(--ds-bg)",
    fg: "var(--ds-fg)",
    fgSecondary: "var(--ds-fg-secondary)",
    fgTertiary: "var(--ds-fg-tertiary)",
    surface: "var(--ds-surface)",
    border: "var(--ds-border)",
    hover: "var(--ds-hover)",
    font: "var(--ds-font)",
    primaryHover: "var(--ds-primary-hover)",
    primaryGlow: "var(--ds-primary-glow)",
    primaryShadow: "var(--ds-primary-shadow)",
  };
  const radius = "var(--ds-radius)";
  const btnRadius = "var(--ds-btn-radius)";

  /* Resolve colorOverrides to a CSS custom property override on the wrapper */
  const primaryOverride = colorOverrides.accent || colorOverrides.primary || colorOverrides.brandBg;
  const has = (c: string) => selectedComponents.includes(c);

  const handleBtnClick = (name: string) => {
    setActiveBtn(name);
    setTimeout(() => setActiveBtn(null), 300);
  };

  return (
    <div
      className={`preview-${designSystem}`}
      style={{
        background: t.bg, color: t.fg, fontFamily: t.font, minHeight: "100%", fontSize: 13,
        ...(primaryOverride && { '--ds-primary': primaryOverride } as React.CSSProperties),
      }}
    >
      {/* Header with interactive tabs */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: `1px solid ${t.border}`, background: t.surface }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: radius, background: t.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
            {designSystem === "salt" ? "S" : designSystem === "m3" ? "M" : "F"}
          </div>
          <span style={{ fontWeight: 700, fontSize: 14 }}>
            {interfaceType === "dashboard" ? "Analytics" : interfaceType === "landing" ? "Product" : interfaceType === "form" ? "Onboarding" : interfaceType === "ecommerce" ? "Shop" : interfaceType === "blog" ? "Blog" : "Portfolio"}
          </span>
        </div>
        {has("tabs") && (
          <div style={{ display: "flex", gap: 2 }}>
            {["Overview", "Details", "Settings"].map((tab, i) => (
              <span
                key={tab}
                onClick={() => setActiveTab(i)}
                style={{
                  padding: "6px 12px", fontSize: 12, cursor: "pointer",
                  fontWeight: i === activeTab ? 600 : 400,
                  color: i === activeTab ? t.primary : t.fg,
                  borderBottom: i === activeTab ? `2px solid ${t.primary}` : "2px solid transparent",
                  transition: "all 150ms ease",
                }}
              >{tab}</span>
            ))}
          </div>
        )}
        {!has("tabs") && has("avatars") && (
          <div />
        )}
        {has("avatars") && (
          <SimulatedAvatar system={designSystem} initials="U" size="sm" />
        )}
      </div>

      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Stats cards */}
        {(interfaceType === "landing" || interfaceType === "dashboard") && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {["Revenue", "Users", "Growth"].map((label, i) => (
              <div
                key={label}
                onMouseEnter={() => setHoveredCard("stat-" + i)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: hoveredCard === "stat-" + i ? t.hover : t.surface,
                  border: `1px solid ${hoveredCard === "stat-" + i ? t.primaryHover : t.border}`,
                  borderRadius: radius, padding: 14, cursor: "pointer",
                  transition: "all 150ms ease",
                  transform: hoveredCard === "stat-" + i ? "translateY(-1px)" : "none",
                }}
              >
                <div style={{ fontSize: 11, color: t.fgSecondary, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {i === 0 ? "$42.8K" : i === 1 ? "1,247" : "+18%"}
                </div>
                {has("progress") && (
                  <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: t.border }}>
                    <div style={{ width: `${60 + i * 15}%`, height: "100%", borderRadius: 2, background: t.primary, transition: "width 500ms ease" }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Alert banner */}
        {has("alerts") && (
          <SimulatedAlert system={designSystem} />
        )}

        {/* Progress bar */}
        {has("progress-bar") && (
          <SimulatedProgress system={designSystem} />
        )}

        {/* Interactive buttons */}
        {has("buttons") && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "Primary", bg: t.primary, fg: "#fff", border: "none" },
              { label: "Secondary", bg: "transparent", fg: t.primary, border: `1px solid ${t.primary}` },
              { label: "Text", bg: "transparent", fg: t.fg, border: "none" },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={() => handleBtnClick(btn.label)}
                style={{
                  padding: "8px 16px", borderRadius: btnRadius, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: btn.bg, color: btn.fg, border: btn.border,
                  transform: activeBtn === btn.label ? "scale(0.95)" : "scale(1)",
                  opacity: activeBtn === btn.label ? 0.8 : 1,
                  transition: "all 150ms ease",
                  boxShadow: activeBtn === btn.label && btn.label === "Primary" ? `0 0 16px ${t.primaryGlow}` : "none",
                }}
              >{btn.label}</button>
            ))}
            <button
              onClick={() => handleBtnClick("Disabled")}
              disabled
              style={{
                padding: "8px 16px", borderRadius: btnRadius, fontSize: 12, fontWeight: 600,
                background: t.border, color: t.fg + "44", border: "none", cursor: "not-allowed", opacity: 0.5,
              }}
            >Disabled</button>
          </div>
        )}

        {/* Tabs */}
        {has("tabs") && (
          <SimulatedTabs system={designSystem} />
        )}

        {/* Inputs */}
        {(has("inputs") || has("text-fields") || has("form-field")) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SimulatedInput system={designSystem} label="Email Address" placeholder="name@company.com" helperText="We'll never share your email." />
            <SimulatedInput system={designSystem} label="Password" placeholder="Enter password" type="password" helperText="" />
          </div>
        )}

        {/* Interactive cards */}
        {has("cards") && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 }}>
            {[
              { title: "Analytics", icon: "bar_chart" },
              { title: "Reports", icon: "description" },
              { title: "Users", icon: "group" },
              { title: "Settings", icon: "settings" },
            ].map((card) => (
              <div
                key={card.title}
                onMouseEnter={() => setHoveredCard(card.title)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: hoveredCard === card.title ? t.hover : t.surface,
                  border: `1px solid ${hoveredCard === card.title ? t.primaryHover : t.border}`,
                  borderRadius: radius, padding: 14, cursor: "pointer",
                  transition: "all 150ms ease",
                  transform: hoveredCard === card.title ? "translateY(-2px)" : "none",
                  boxShadow: hoveredCard === card.title ? `0 4px 12px ${t.primaryShadow}` : "none",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: t.primary, marginBottom: 6, display: "block" }}>{card.icon}</span>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{card.title}</div>
                <div style={{ fontSize: 11, color: t.fgTertiary, marginTop: 4 }}>View details</div>
              </div>
            ))}
          </div>
        )}

        {/* Checkboxes + Switches */}
        {(has("checkboxes") || has("switches") || has("radios")) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {has("checkboxes") && (
              <>
                <SimulatedCheckbox system={designSystem} label="Enable notifications" defaultChecked />
                <SimulatedCheckbox system={designSystem} label="Automatic updates" />
                <SimulatedCheckbox system={designSystem} label="Subscribe to newsletter" />
              </>
            )}
            {has("switches") && (
              <SimulatedSwitch system={designSystem} label="Dark mode" />
            )}
            {has("radios") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { value: "a", label: "Option A" },
                  { value: "b", label: "Option B" },
                  { value: "c", label: "Option C" },
                ].map((item) => (
                  <label
                    key={item.value}
                    onClick={() => setRadio(item.value)}
                    style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none", fontSize: 13, fontFamily: t.font, color: t.fg }}
                  >
                    <span style={{
                      width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      border: `2px solid ${radio === item.value ? t.primary : t.border}`,
                      transition: "border-color 150ms ease",
                    }}>
                      <span style={{
                        width: radio === item.value ? 8 : 0, height: radio === item.value ? 8 : 0,
                        borderRadius: "50%", background: t.primary,
                        transition: "all 150ms ease",
                      }} />
                    </span>
                    {item.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Interactive badges */}
        {has("badges") && (
          <div style={{ display: "flex", gap: 8 }}>
            {[{ label: "Active", color: "#00875D" }, { label: "Pending", color: "#C75300" }, { label: "Closed", color: "#E52135" }].map((b) => (
              <span
                key={b.label}
                onClick={() => setActiveBadge(activeBadge === b.label ? null : b.label)}
                style={{
                  padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  background: activeBadge === b.label ? b.color : b.color + "20",
                  color: activeBadge === b.label ? "#fff" : b.color,
                  transition: "all 150ms ease",
                  userSelect: "none",
                }}
              >{b.label}</span>
            ))}
          </div>
        )}

        {/* Tooltip */}
        {has("tooltips") && (
          <SimulatedTooltip system={designSystem} />
        )}

        {/* Dialog */}
        {has("buttons") && (
          <SimulatedDialog system={designSystem} />
        )}

        {/* Avatar group */}
        {has("avatars") && (
          <div>
            <div style={{ fontSize: 11, color: t.fgTertiary, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Team</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <SimulatedAvatar system={designSystem} initials="AK" size="lg" presence="available" />
              <SimulatedAvatar system={designSystem} initials="JL" size="md" presence="busy" />
              <SimulatedAvatar system={designSystem} initials="RW" size="md" presence="away" />
              <SimulatedAvatar system={designSystem} initials="MZ" size="sm" presence="offline" />
            </div>
          </div>
        )}

        {/* Dropdown */}
        {(has("inputs") || has("form-field")) && (
          <div>
            <div style={{ fontSize: 11, color: t.fgTertiary, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Role</div>
            <SimulatedDropdown
              system={designSystem}
              items={[
                { label: "Admin", value: "admin" },
                { label: "Editor", value: "editor" },
                { label: "Viewer", value: "viewer" },
                { label: "Owner (Locked)", value: "owner", disabled: true },
              ]}
              placeholder="Select a role"
            />
          </div>
        )}

        {/* Data table */}
        {(has("table") || interfaceType === "dashboard") && (
          <SimulatedDataTable system={designSystem} />
        )}

        {/* Date picker */}
        {(has("inputs") || has("form-field")) && (
          <div>
            <div style={{ fontSize: 11, color: t.fgTertiary, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Schedule</div>
            <SimulatedDatePicker system={designSystem} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Preview toolbar — DS switcher + theme toggle ── */
function PreviewToolbar() {
  const { designSystem, setDesignSystem, mode, setMode } = useBuilder();

  const systems: { key: "salt" | "m3" | "fluent"; label: string }[] = [
    { key: "salt", label: "Salt DS" },
    { key: "m3", label: "Material 3" },
    { key: "fluent", label: "Fluent 2" },
  ];

  const themes: { key: "light" | "dark"; icon: string; label: string }[] = [
    { key: "light", icon: "light_mode", label: "Light" },
    { key: "dark", icon: "dark_mode", label: "Dark" },
  ];

  return (
    <div className="preview-toolbar">
      {/* UI Kit Switcher */}
      <div className="preview-toolbar-group">
        {systems.map((s) => (
          <button
            key={s.key}
            className={`preview-toolbar-btn${designSystem === s.key ? " preview-toolbar-btn-active" : ""}`}
            onClick={() => setDesignSystem(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Theme Toggle */}
      <div className="preview-toolbar-group">
        {themes.map((t) => (
          <button
            key={t.key}
            className={`preview-toolbar-btn${mode === t.key ? " preview-toolbar-btn-active" : ""}`}
            onClick={() => setMode(t.key)}
          >
            <span className="material-symbols-outlined preview-toolbar-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Side panel with toolbar ── */
export function PreviewSidePanel() {
  const { previewOpen, previewKey, messages } = useBuilder();
  const hasContent = messages.some((m) => m.role === "ai");

  return (
    <div className={`preview-side ${previewOpen ? "open" : ""}`}>
      {hasContent && <PreviewToolbar />}
      <div className="preview-side-body">
        {hasContent ? (
          <div className="preview-frame" key={previewKey}>
            <PreviewCanvas />
          </div>
        ) : (
          <DefaultPreview />
        )}
      </div>
    </div>
  );
}

/* ── Standalone Preview (for pop-out window) ── */
export function StandalonePreview() {
  const { designSystem, mode } = useBuilder();
  return (
    <div className={`standalone-preview ${mode === "light" ? "builder-light" : ""}`}>
      <div className="standalone-preview-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <span className="preview-dot" style={{ background: "#ff5f57" }} />
            <span className="preview-dot" style={{ background: "#febc2e" }} />
            <span className="preview-dot" style={{ background: "#28c840" }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--b-fg)" }}>
            Design Hub Preview
          </span>
        </div>
        <span className="preview-badge-inline">
          {designSystem.toUpperCase()} &middot; {mode}
        </span>
      </div>
      <PreviewToolbar />
      <PreviewContent />
    </div>
  );
}
