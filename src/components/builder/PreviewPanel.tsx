"use client";

import React, { useState } from "react";
import { useBuilder } from "@/store/useBuilder";
import { SimulatedAvatar, SimulatedDropdown, SimulatedDataTable, SimulatedDatePicker, SimulatedDialog, SimulatedTabs } from "./SimulatedUI";

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
  const { designSystem, mode, interfaceType, selectedComponents, colorOverrides } = useBuilder();

  const isDark = mode === "dark";

  /* ── Interactive state ── */
  const [activeTab, setActiveTab] = useState(0);
  const [checks, setChecks] = useState<Record<string, boolean>>({ notifications: true, updates: false, newsletter: false });
  const [switchOn, setSwitchOn] = useState(true);
  const [radio, setRadio] = useState("a");
  const [activeBtn, setActiveBtn] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [activeBadge, setActiveBadge] = useState<string | null>(null);

  const accents: Record<string, { primary: string; bg: string; fg: string; surface: string; border: string; font: string; hover: string }> = {
    salt: {
      primary: colorOverrides.accent || "#1B7F9E",
      bg: isDark ? "#101820" : "#FFFFFF",
      fg: isDark ? "#E2E4E5" : "#000000",
      surface: isDark ? "#1A2229" : "#F5F7F8",
      border: isDark ? "#3A3F44" : "#B1B5B9",
      hover: isDark ? "#1E2A33" : "#EDF0F2",
      font: "'Open Sans', sans-serif",
    },
    m3: {
      primary: colorOverrides.primary || "#6750A4",
      bg: isDark ? "#141218" : "#FEF7FF",
      fg: isDark ? "#E6E0E9" : "#1D1B20",
      surface: isDark ? "#1D1B20" : "#F3EDF7",
      border: isDark ? "#49454F" : "#CAC4D0",
      hover: isDark ? "#252330" : "#E8E0F0",
      font: "'Roboto', sans-serif",
    },
    fluent: {
      primary: colorOverrides.brandBg || "#0F6CBD",
      bg: isDark ? "#292929" : "#FFFFFF",
      fg: isDark ? "#FFFFFF" : "#242424",
      surface: isDark ? "#1F1F1F" : "#FAFAFA",
      border: isDark ? "#666666" : "#D1D1D1",
      hover: isDark ? "#333333" : "#F0F0F0",
      font: "'Segoe UI', -apple-system, sans-serif",
    },
  };

  const t = accents[designSystem];
  const radius = designSystem === "m3" ? 12 : designSystem === "fluent" ? 6 : 4;
  const btnRadius = designSystem === "m3" ? 20 : designSystem === "fluent" ? 6 : 4;
  const has = (c: string) => selectedComponents.includes(c);

  const handleBtnClick = (name: string) => {
    setActiveBtn(name);
    setTimeout(() => setActiveBtn(null), 300);
  };

  return (
    <div style={{ background: t.bg, color: t.fg, fontFamily: t.font, minHeight: "100%", fontSize: 13 }}>
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
                  border: `1px solid ${hoveredCard === "stat-" + i ? t.primary + "40" : t.border}`,
                  borderRadius: radius, padding: 14, cursor: "pointer",
                  transition: "all 150ms ease",
                  transform: hoveredCard === "stat-" + i ? "translateY(-1px)" : "none",
                }}
              >
                <div style={{ fontSize: 11, color: t.fg + "99", marginBottom: 4 }}>{label}</div>
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
                  boxShadow: activeBtn === btn.label && btn.label === "Primary" ? `0 0 16px ${t.primary}60` : "none",
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

        {/* Interactive inputs with focus styles */}
        {(has("inputs") || has("text-fields") || has("form-field")) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { placeholder: "Email address", type: "text" },
                { placeholder: "Password", type: "password" },
              ].map((inp) => (
                <input
                  key={inp.placeholder}
                  placeholder={inp.placeholder}
                  type={inp.type}
                  style={{
                    flex: 1, minWidth: 140, padding: "8px 12px", borderRadius: radius, fontSize: 13,
                    border: `1px solid ${t.border}`, background: t.surface, color: t.fg,
                    fontFamily: t.font, outline: "none", transition: "border-color 150ms ease, box-shadow 150ms ease",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = t.primary; e.currentTarget.style.boxShadow = `0 0 0 2px ${t.primary}30`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                />
              ))}
            </div>
            <textarea
              placeholder="Additional notes..."
              rows={2}
              style={{
                width: "100%", padding: "8px 12px", borderRadius: radius, fontSize: 13,
                border: `1px solid ${t.border}`, background: t.surface, color: t.fg,
                fontFamily: t.font, outline: "none", resize: "vertical", transition: "border-color 150ms ease, box-shadow 150ms ease",
                boxSizing: "border-box",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = t.primary; e.currentTarget.style.boxShadow = `0 0 0 2px ${t.primary}30`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
            />
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
                  border: `1px solid ${hoveredCard === card.title ? t.primary + "40" : t.border}`,
                  borderRadius: radius, padding: 14, cursor: "pointer",
                  transition: "all 150ms ease",
                  transform: hoveredCard === card.title ? "translateY(-2px)" : "none",
                  boxShadow: hoveredCard === card.title ? `0 4px 12px ${t.primary}15` : "none",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: t.primary, marginBottom: 6, display: "block" }}>{card.icon}</span>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{card.title}</div>
                <div style={{ fontSize: 11, color: t.fg + "88", marginTop: 4 }}>View details</div>
              </div>
            ))}
          </div>
        )}

        {/* Interactive checkboxes, switches, radios */}
        {(has("checkboxes") || has("switches") || has("radios")) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 12 }}>
            {has("checkboxes") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { key: "notifications", label: "Enable notifications" },
                  { key: "updates", label: "Automatic updates" },
                  { key: "newsletter", label: "Subscribe to newsletter" },
                ].map((item) => (
                  <label
                    key={item.key}
                    onClick={() => setChecks((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                    style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}
                  >
                    <span style={{
                      width: 16, height: 16, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center",
                      border: `2px solid ${checks[item.key] ? t.primary : t.border}`,
                      background: checks[item.key] ? t.primary : "transparent",
                      color: "#fff", fontSize: 10, transition: "all 150ms ease",
                    }}>{checks[item.key] ? "✓" : ""}</span>
                    {item.label}
                  </label>
                ))}
              </div>
            )}
            {has("switches") && (
              <label
                onClick={() => setSwitchOn(!switchOn)}
                style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}
              >
                <span style={{
                  width: 36, height: 20, borderRadius: 10, position: "relative", display: "inline-block",
                  background: switchOn ? t.primary : t.border, transition: "background 200ms ease",
                }}>
                  <span style={{
                    position: "absolute", top: 2, width: 16, height: 16, borderRadius: "50%", background: "#fff",
                    left: switchOn ? 18 : 2, transition: "left 200ms ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  }} />
                </span>
                Dark mode
              </label>
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
                    style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}
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

        {/* Dialog */}
        {has("buttons") && (
          <SimulatedDialog system={designSystem} />
        )}

        {/* Avatar group */}
        {has("avatars") && (
          <div>
            <div style={{ fontSize: 11, color: t.fg + "88", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Team</div>
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
            <div style={{ fontSize: 11, color: t.fg + "88", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Role</div>
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
            <div style={{ fontSize: 11, color: t.fg + "88", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Schedule</div>
            <SimulatedDatePicker system={designSystem} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Side panel (no header — actions are in top bar) ── */
export function PreviewSidePanel() {
  const { previewOpen, previewKey, messages } = useBuilder();
  const hasContent = messages.some((m) => m.role === "ai");

  return (
    <div className={`preview-side ${previewOpen ? "open" : ""}`}>
      <div className="preview-side-body">
        {hasContent ? (
          <div className="preview-frame" key={previewKey}>
            <PreviewContent />
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
      <PreviewContent />
    </div>
  );
}
