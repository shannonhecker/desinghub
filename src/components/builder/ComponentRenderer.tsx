"use client";

import React, { useState } from "react";
import {
  SimulatedAlert,
  SimulatedDataTable,
  SimulatedInput,
  SimulatedTabs,
  SimulatedCheckbox,
  SimulatedSwitch,
  SimulatedAvatar,
  SimulatedProgress,
  SimulatedTooltip,
  SimulatedDialog,
  SimulatedDropdown,
  SimulatedDatePicker,
} from "./SimulatedUI";

type DesignSystem = "salt" | "m3" | "fluent";

interface ComponentRendererProps {
  type: string;
  system: DesignSystem;
  [key: string]: unknown;
}

/* ── Token reference for inline styles ── */
const t = {
  primary: "var(--ds-primary)",
  onPrimary: "var(--ds-on-primary)",
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
  statusPositive: "var(--ds-status-positive)",
  statusWarning: "var(--ds-status-warning)",
  statusNegative: "var(--ds-status-negative)",
};
const radius = "var(--ds-radius)";
const btnRadius = "var(--ds-btn-radius)";

/* ── Individual block renderers ── */

function AlertBlock({ system }: { system: DesignSystem }) {
  return <SimulatedAlert system={system} />;
}

function DataTableBlock({ system }: { system: DesignSystem }) {
  return <SimulatedDataTable system={system} />;
}

function FormFieldsBlock({ system }: { system: DesignSystem }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SimulatedInput
        system={system}
        label="Email Address"
        placeholder="name@company.com"
        helperText="We'll never share your email."
      />
      <SimulatedInput
        system={system}
        label="Password"
        placeholder="Enter password"
        type="password"
        helperText=""
      />
    </div>
  );
}

function ButtonsBlock() {
  const [activeBtn, setActiveBtn] = useState<string | null>(null);
  const handleClick = (name: string) => {
    setActiveBtn(name);
    setTimeout(() => setActiveBtn(null), 300);
  };

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {[
        { label: "Primary", bg: t.primary, fg: t.onPrimary, border: "none" },
        { label: "Secondary", bg: "transparent", fg: t.primary, border: `1px solid ${t.primary}` },
        { label: "Text", bg: "transparent", fg: t.fg, border: "none" },
      ].map((btn) => (
        <button
          key={btn.label}
          onClick={() => handleClick(btn.label)}
          style={{
            padding: "8px 16px",
            borderRadius: btnRadius,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            background: btn.bg,
            color: btn.fg,
            border: btn.border,
            transform: activeBtn === btn.label ? "scale(0.95)" : "scale(1)",
            opacity: activeBtn === btn.label ? 0.8 : 1,
            transition: "all 150ms ease",
            boxShadow:
              activeBtn === btn.label && btn.label === "Primary"
                ? `0 0 16px ${t.primaryGlow}`
                : "none",
            fontFamily: "inherit",
          }}
        >
          {btn.label}
        </button>
      ))}
      <button
        disabled
        style={{
          padding: "8px 16px",
          borderRadius: btnRadius,
          fontSize: 12,
          fontWeight: 600,
          background: t.border,
          color: t.fg,
          border: "none",
          cursor: "not-allowed",
          opacity: 0.5,
          fontFamily: "inherit",
        }}
      >
        Disabled
      </button>
    </div>
  );
}

function CardsBlock() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const cards = [
    { title: "Analytics", icon: "bar_chart" },
    { title: "Reports", icon: "description" },
    { title: "Users", icon: "group" },
    { title: "Settings", icon: "settings" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
        gap: 12,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.title}
          onMouseEnter={() => setHoveredCard(card.title)}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            background: hoveredCard === card.title ? t.hover : t.surface,
            border: `1px solid ${hoveredCard === card.title ? t.primaryHover : t.border}`,
            borderRadius: radius,
            padding: 14,
            cursor: "pointer",
            transition: "all 150ms ease",
            transform: hoveredCard === card.title ? "translateY(-2px)" : "none",
            boxShadow:
              hoveredCard === card.title ? `0 4px 12px ${t.primaryShadow}` : "none",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: t.primary, marginBottom: 6, display: "block" }}
          >
            {card.icon}
          </span>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{card.title}</div>
          <div style={{ fontSize: 11, color: t.fgTertiary, marginTop: 4 }}>
            View details
          </div>
        </div>
      ))}
    </div>
  );
}

function TabsBlock({ system }: { system: DesignSystem }) {
  return <SimulatedTabs system={system} />;
}

function TogglesBlock({ system }: { system: DesignSystem }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <SimulatedCheckbox system={system} label="Enable notifications" defaultChecked />
      <SimulatedCheckbox system={system} label="Automatic updates" />
      <SimulatedSwitch system={system} label="Dark mode" />
    </div>
  );
}

function BadgesBlock() {
  const [activeBadge, setActiveBadge] = useState<string | null>(null);
  const badges = [
    { label: "Active", color: t.statusPositive },
    { label: "Pending", color: t.statusWarning },
    { label: "Closed", color: t.statusNegative },
  ];

  return (
    <div style={{ display: "flex", gap: 8 }}>
      {badges.map((b) => (
        <span
          key={b.label}
          onClick={() => setActiveBadge(activeBadge === b.label ? null : b.label)}
          style={{
            padding: "3px 10px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            background: activeBadge === b.label ? b.color : "transparent",
            color: activeBadge === b.label ? t.onPrimary : b.color,
            border: `1px solid ${b.color}`,
            transition: "all 150ms ease",
            userSelect: "none",
          }}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}

function AvatarsBlock({ system }: { system: DesignSystem }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <SimulatedAvatar system={system} initials="AK" size="lg" presence="available" />
      <SimulatedAvatar system={system} initials="JL" size="md" presence="busy" />
      <SimulatedAvatar system={system} initials="RW" size="md" presence="away" />
      <SimulatedAvatar system={system} initials="MZ" size="sm" presence="offline" />
    </div>
  );
}

function ProgressBlock({ system }: { system: DesignSystem }) {
  return <SimulatedProgress system={system} />;
}

function TooltipsBlock({ system }: { system: DesignSystem }) {
  return <SimulatedTooltip system={system} />;
}

function DialogBlock({ system }: { system: DesignSystem }) {
  return <SimulatedDialog system={system} />;
}

function DropdownBlock({ system }: { system: DesignSystem }) {
  return (
    <SimulatedDropdown
      system={system}
      items={[
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
        { label: "Viewer", value: "viewer" },
        { label: "Owner (Locked)", value: "owner", disabled: true },
      ]}
      placeholder="Select a role"
    />
  );
}

function DatePickerBlock({ system }: { system: DesignSystem }) {
  return <SimulatedDatePicker system={system} />;
}

function TypographyBlock() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Display / Hero */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, color: t.fgTertiary, marginBottom: 4 }}>Display</div>
        <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2, color: t.fg }}>
          The quick brown fox
        </div>
      </div>

      {/* Heading levels */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, color: t.fgTertiary, marginBottom: 2 }}>Headings</div>
        <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.25, color: t.fg }}>H1 — Page Title</div>
        <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3, color: t.fg }}>H2 — Section Heading</div>
        <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.35, color: t.fg }}>H3 — Subsection</div>
        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, color: t.fg }}>H4 — Card Title</div>
      </div>

      {/* Body text */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, color: t.fgTertiary, marginBottom: 2 }}>Body Text</div>
        <div style={{ fontSize: 14, lineHeight: 1.6, color: t.fg }}>
          Body 1 — Primary body text used for main content areas, article text, and descriptions. This is the default reading size.
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.5, color: t.fgSecondary }}>
          Body 2 — Secondary body text for supporting content, card descriptions, and supplementary information.
        </div>
      </div>

      {/* Labels & Captions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, color: t.fgTertiary, marginBottom: 2 }}>Labels &amp; Captions</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "baseline" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.fg }}>Label — Form Label</span>
          <span style={{ fontSize: 11, fontWeight: 500, color: t.primary }}>Link — Inline link</span>
          <span style={{ fontSize: 11, color: t.fgTertiary }}>Caption — Helper text</span>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            color: t.fgSecondary,
          }}>
            Overline — Small label
          </span>
        </div>
      </div>

      {/* Sample card with mixed typography */}
      <div style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: radius,
        padding: 16,
      }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, color: t.fgTertiary, marginBottom: 8 }}>Preview — Mixed Usage</div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: t.primary, marginBottom: 4 }}>Featured</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: t.fg, marginBottom: 4 }}>Getting Started Guide</div>
        <div style={{ fontSize: 12, lineHeight: 1.5, color: t.fgSecondary, marginBottom: 8 }}>
          Learn how to set up your workspace, configure themes, and deploy your first project in minutes.
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: t.primary, cursor: "pointer" }}>Read more</span>
          <span style={{ fontSize: 11, color: t.fgTertiary }}>5 min read</span>
        </div>
      </div>
    </div>
  );
}

function StatsCardsBlock() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const stats = [
    { label: "Revenue", value: "$42.8K", pct: 60 },
    { label: "Users", value: "1,247", pct: 75 },
    { label: "Growth", value: "+18%", pct: 90 },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          onMouseEnter={() => setHoveredCard("stat-" + i)}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            background: hoveredCard === "stat-" + i ? t.hover : t.surface,
            border: `1px solid ${hoveredCard === "stat-" + i ? t.primaryHover : t.border}`,
            borderRadius: radius,
            padding: 14,
            cursor: "pointer",
            transition: "all 150ms ease",
            transform: hoveredCard === "stat-" + i ? "translateY(-1px)" : "none",
          }}
        >
          <div style={{ fontSize: 11, color: t.fgSecondary, marginBottom: 4 }}>
            {stat.label}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{stat.value}</div>
          <div
            style={{
              marginTop: 8,
              height: 4,
              borderRadius: 2,
              background: t.border,
            }}
          >
            <div
              style={{
                width: `${stat.pct}%`,
                height: "100%",
                borderRadius: 2,
                background: t.primary,
                transition: "width 500ms ease",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Single-component library blocks ── */

function SimulatedButtonBlock({
  system,
  variant = "primary",
  label = "New Button",
}: {
  system: DesignSystem;
  variant?: string;
  label?: string;
}) {
  const [pressed, setPressed] = useState(false);
  const isPrimary = variant === "primary";
  return (
    <button
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        padding: "8px 20px",
        borderRadius: btnRadius,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        background: isPrimary ? t.primary : "transparent",
        color: isPrimary ? t.onPrimary : t.fg,
        border: isPrimary ? "none" : `1px solid ${t.border}`,
        transform: pressed ? "scale(0.96)" : "scale(1)",
        transition: "all 150ms ease",
      }}
    >
      {label}
    </button>
  );
}

function SimulatedTitleBlock({
  level = "h2",
  text = "New Heading",
}: {
  system: DesignSystem;
  level?: string;
  text?: string;
}) {
  const sizes: Record<string, { fontSize: number; fontWeight: number }> = {
    h1: { fontSize: 28, fontWeight: 700 },
    h2: { fontSize: 22, fontWeight: 700 },
    h3: { fontSize: 18, fontWeight: 600 },
    h4: { fontSize: 16, fontWeight: 600 },
    h5: { fontSize: 14, fontWeight: 600 },
    h6: { fontSize: 12, fontWeight: 600 },
  };
  const s = sizes[level] || sizes.h2;
  return (
    <div style={{ ...s, color: t.fg, lineHeight: 1.3 }}>
      {text}
    </div>
  );
}

function SimulatedTextInputBlock({
  system,
  label = "Label",
  placeholder = "Enter text...",
}: {
  system: DesignSystem;
  label?: string;
  placeholder?: string;
}) {
  return (
    <SimulatedInput
      system={system}
      label={label}
      placeholder={placeholder}
      helperText=""
    />
  );
}

/* ── Renderer map ── */
const RENDERERS: Record<
  string,
  React.FC<{ system: DesignSystem }>
> = {
  Alert: AlertBlock,
  DataTable: DataTableBlock,
  FormFields: FormFieldsBlock,
  Buttons: ButtonsBlock as React.FC<{ system: DesignSystem }>,
  Cards: CardsBlock as React.FC<{ system: DesignSystem }>,
  Tabs: TabsBlock,
  Toggles: TogglesBlock,
  Badges: BadgesBlock as React.FC<{ system: DesignSystem }>,
  Avatars: AvatarsBlock,
  Progress: ProgressBlock,
  Tooltips: TooltipsBlock,
  Dialog: DialogBlock,
  Dropdown: DropdownBlock,
  DatePicker: DatePickerBlock,
  StatsCards: StatsCardsBlock as React.FC<{ system: DesignSystem }>,
  Typography: TypographyBlock as React.FC<{ system: DesignSystem }>,
  SimulatedButton: SimulatedButtonBlock as React.FC<{ system: DesignSystem }>,
  SimulatedTitle: SimulatedTitleBlock as React.FC<{ system: DesignSystem }>,
  SimulatedTextInput: SimulatedTextInputBlock as React.FC<{ system: DesignSystem }>,
};

/* ── Main export ── */
export function ComponentRenderer({ type, system, ...props }: ComponentRendererProps) {
  const Renderer = RENDERERS[type];
  if (!Renderer) {
    return (
      <div style={{ padding: 12, color: t.fgTertiary, fontSize: 12 }}>
        Unknown block type: {type}
      </div>
    );
  }

  return (
    <div>
      <div className="canvas-block-label">{type}</div>
      <Renderer system={system} {...(props as Record<string, unknown>)} />
    </div>
  );
}
