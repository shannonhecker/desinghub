"use client";

import React from "react";
import { useBuilder } from "@/store/useBuilder";

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

/* ── Preview content — renders a mini layout based on user's choices ── */
function PreviewContent() {
  const { designSystem, mode, interfaceType, selectedComponents, colorOverrides } = useBuilder();

  const isDark = mode === "dark";

  const accents: Record<string, { primary: string; bg: string; fg: string; surface: string; border: string; font: string }> = {
    salt: {
      primary: colorOverrides.accent || "#1B7F9E",
      bg: isDark ? "#101820" : "#FFFFFF",
      fg: isDark ? "#E2E4E5" : "#000000",
      surface: isDark ? "#1A2229" : "#F5F7F8",
      border: isDark ? "#3A3F44" : "#B1B5B9",
      font: "'Open Sans', sans-serif",
    },
    m3: {
      primary: colorOverrides.primary || "#6750A4",
      bg: isDark ? "#141218" : "#FEF7FF",
      fg: isDark ? "#E6E0E9" : "#1D1B20",
      surface: isDark ? "#1D1B20" : "#F3EDF7",
      border: isDark ? "#49454F" : "#CAC4D0",
      font: "'Roboto', sans-serif",
    },
    fluent: {
      primary: colorOverrides.brandBg || "#0F6CBD",
      bg: isDark ? "#292929" : "#FFFFFF",
      fg: isDark ? "#FFFFFF" : "#242424",
      surface: isDark ? "#1F1F1F" : "#FAFAFA",
      border: isDark ? "#666666" : "#D1D1D1",
      font: "'Segoe UI', -apple-system, sans-serif",
    },
  };

  const t = accents[designSystem];
  const radius = designSystem === "m3" ? 12 : designSystem === "fluent" ? 6 : 4;
  const btnRadius = designSystem === "m3" ? 20 : designSystem === "fluent" ? 6 : 4;
  const has = (c: string) => selectedComponents.includes(c);

  return (
    <div style={{ background: t.bg, color: t.fg, fontFamily: t.font, minHeight: "100%", fontSize: 13 }}>
      {/* Header */}
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
              <span key={tab} style={{
                padding: "6px 12px", fontSize: 12, fontWeight: i === 0 ? 600 : 400,
                color: i === 0 ? t.primary : t.fg, borderBottom: i === 0 ? `2px solid ${t.primary}` : "none",
                cursor: "pointer",
              }}>{tab}</span>
            ))}
          </div>
        )}
        {has("avatars") && (
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: t.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 600 }}>U</div>
        )}
      </div>

      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        {(interfaceType === "landing" || interfaceType === "dashboard") && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {["Revenue", "Users", "Growth"].map((label, i) => (
              <div key={label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: radius, padding: 14 }}>
                <div style={{ fontSize: 11, color: t.fg + "99", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {i === 0 ? "$42.8K" : i === 1 ? "1,247" : "+18%"}
                </div>
                {has("progress") && (
                  <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: t.border }}>
                    <div style={{ width: `${60 + i * 15}%`, height: "100%", borderRadius: 2, background: t.primary }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {has("buttons") && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={{ padding: "8px 16px", borderRadius: btnRadius, background: t.primary, color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Primary</button>
            <button style={{ padding: "8px 16px", borderRadius: btnRadius, background: "transparent", color: t.primary, border: `1px solid ${t.primary}`, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Secondary</button>
            <button style={{ padding: "8px 16px", borderRadius: btnRadius, background: "transparent", color: t.fg, border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Text</button>
          </div>
        )}

        {(has("inputs") || has("text-fields") || has("form-field")) && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input placeholder="Email address" style={{
              flex: 1, minWidth: 140, padding: "8px 12px", borderRadius: radius, fontSize: 13,
              border: `1px solid ${t.border}`, background: t.surface, color: t.fg,
              fontFamily: t.font, outline: "none",
            }} />
            <input placeholder="Password" type="password" style={{
              flex: 1, minWidth: 140, padding: "8px 12px", borderRadius: radius, fontSize: 13,
              border: `1px solid ${t.border}`, background: t.surface, color: t.fg,
              fontFamily: t.font, outline: "none",
            }} />
          </div>
        )}

        {has("cards") && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 }}>
            {["Analytics", "Reports", "Users", "Settings"].map((title) => (
              <div key={title} style={{
                background: t.surface, border: `1px solid ${t.border}`, borderRadius: radius,
                padding: 14, cursor: "pointer",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
                <div style={{ fontSize: 11, color: t.fg + "88", marginTop: 4 }}>View details</div>
              </div>
            ))}
          </div>
        )}

        {(has("checkboxes") || has("switches") || has("radios")) && (
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 12 }}>
            {has("checkboxes") && (
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <span style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${t.primary}`, background: t.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10 }}>&#10003;</span>
                Enable notifications
              </label>
            )}
            {has("switches") && (
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <span style={{ width: 36, height: 20, borderRadius: 10, background: t.primary, position: "relative", display: "inline-block" }}>
                  <span style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: "50%", background: "#fff" }} />
                </span>
                Dark mode
              </label>
            )}
            {has("radios") && (
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <span style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${t.primary}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.primary }} />
                </span>
                Option A
              </label>
            )}
          </div>
        )}

        {has("badges") && (
          <div style={{ display: "flex", gap: 8 }}>
            {[{ label: "Active", color: "#00875D" }, { label: "Pending", color: "#C75300" }, { label: "Closed", color: "#E52135" }].map((b) => (
              <span key={b.label} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: b.color + "20", color: b.color }}>{b.label}</span>
            ))}
          </div>
        )}

        {(has("table") || interfaceType === "dashboard") && (
          <div style={{ border: `1px solid ${t.border}`, borderRadius: radius, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", fontSize: 11, fontWeight: 700, padding: "8px 12px", background: t.surface, borderBottom: `1px solid ${t.border}`, color: t.fg + "88" }}>
              <span>Name</span><span>Status</span><span>Date</span><span>Amount</span>
            </div>
            {[["Project Alpha", "Active", "Mar 15", "$12,400"], ["Project Beta", "Review", "Mar 18", "$8,200"], ["Project Gamma", "Closed", "Mar 22", "$15,750"]].map(([name, status, date, amount]) => (
              <div key={name} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", fontSize: 12, padding: "10px 12px", borderBottom: `1px solid ${t.border}40` }}>
                <span style={{ fontWeight: 500 }}>{name}</span><span>{status}</span><span style={{ color: t.fg + "88" }}>{date}</span><span style={{ fontWeight: 600 }}>{amount}</span>
              </div>
            ))}
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
