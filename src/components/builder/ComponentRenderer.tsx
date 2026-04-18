"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useBuilder } from "@/store/useBuilder";
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
  SimulatedTitle as SimulatedTitleUI,
  SimulatedBreadcrumb,
  SimulatedAccordion,
  SimulatedCard,
  SimulatedBadge,
  SimulatedChatMessage,
  SimulatedChart,
  SimulatedRadioGroup,
  SimulatedSlider,
  SimulatedNumberInput,
  SimulatedMultilineInput,
  SimulatedPill,
  SimulatedToggleButton,
  SimulatedSegmentedGroup,
  SimulatedLink,
  SimulatedListBox,
  SimulatedComboBox,
  SimulatedFileDropZone,
  SimulatedTree,
  SimulatedRating,
  SimulatedSkeleton,
  SimulatedSearchbox,
  SimulatedTokenizedInput,
  SimulatedNavDrawer,
  SimulatedPopover,
  SimulatedPersona,
  SimulatedAvatarGroup,
} from "./SimulatedUI";
import { SimulatedHighchart, type HighchartType } from "./SimulatedHighchart";

type DesignSystem = "salt" | "m3" | "fluent" | "ausos";

interface ComponentRendererProps {
  type: string;
  system: DesignSystem;
  [key: string]: unknown;
}

/* ── Zone-aware block lookup - searches all 4 zones ── */
type ZoneId = "body" | "header" | "sidebar" | "footer";
const ZONE_KEYS = ["blocks", "headerBlocks", "sidebarBlocks", "footerBlocks"] as const;
const ZONE_IDS: ZoneId[] = ["body", "header", "sidebar", "footer"];

function useBlockInAnyZone(blockId?: string) {
  const block = useBuilder((s) => {
    if (!blockId) return null;
    for (const key of ZONE_KEYS) {
      const found = s[key].find((b) => b.id === blockId);
      if (found) return found;
    }
    return null;
  });

  const zone: ZoneId = useBuilder((s) => {
    if (!blockId) return "body";
    for (let i = 0; i < ZONE_KEYS.length; i++) {
      if (s[ZONE_KEYS[i]].some((b) => b.id === blockId)) return ZONE_IDS[i];
    }
    return "body";
  });

  const updateZoneBlockProps = useBuilder((s) => s.updateZoneBlockProps);
  const selectedBlockId = useBuilder((s) => s.selectedBlockId);

  const update = (props: Record<string, unknown>) => {
    if (blockId) updateZoneBlockProps(zone, blockId, props);
  };

  const isSelected = blockId != null && selectedBlockId === blockId;

  return { block, update, isSelected };
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
  surfaceHover: "var(--ds-surface-hover)",
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

function DataTableBlock({ system, blockId }: { system: DesignSystem; blockId?: string }) {
  const selectedBlockId = useBuilder((s) => s.selectedBlockId);
  const blocks = useBuilder((s) => s.blocks);
  const updateBlockProps = useBuilder((s) => s.updateBlockProps);
  const isSelected = blockId != null && selectedBlockId === blockId;
  const block = blockId ? blocks.find((b) => b.id === blockId) : null;

  const defaultRows = [
    { name: "Jane Doe", status: "Active", role: "Admin", date: "2 hrs ago" },
    { name: "John Smith", status: "Pending", role: "Editor", date: "Yesterday" },
    { name: "Alice Jones", status: "Active", role: "Viewer", date: "5 mins ago" },
  ];
  const rows = (block?.props.rows as typeof defaultRows) ?? defaultRows;

  const updateCell = (rowIdx: number, key: string, value: string) => {
    if (!blockId) return;
    const next = rows.map((r, i) => (i === rowIdx ? { ...r, [key]: value } : r));
    updateBlockProps(blockId, { rows: next });
  };

  if (isSelected && blockId) {
    const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
    return (
      <table className={`${prefix}-table`} style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${t.border}`, textAlign: "left" }}>
            {["Name", "Status", "Role", "Last Active"].map((h) => (
              <th key={h} style={{ padding: "8px 10px", fontWeight: 600, color: t.fgSecondary, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${t.border}` }}>
              <td style={{ padding: "8px 10px" }}>
                <InlineEditable value={row.name} onChange={(v) => updateCell(i, "name", v)} style={{ outline: "none" }} />
              </td>
              <td style={{ padding: "8px 10px" }}>
                <InlineEditable value={row.status} onChange={(v) => updateCell(i, "status", v)} style={{ outline: "none", color: row.status === "Active" ? t.statusPositive : t.statusWarning }} />
              </td>
              <td style={{ padding: "8px 10px" }}>
                <InlineEditable value={row.role} onChange={(v) => updateCell(i, "role", v)} style={{ outline: "none" }} />
              </td>
              <td style={{ padding: "8px 10px", color: t.fgTertiary }}>
                <InlineEditable value={row.date} onChange={(v) => updateCell(i, "date", v)} style={{ outline: "none" }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return <SimulatedDataTable system={system} data={rows} />;
}

function FormFieldsBlock({ system, blockId }: { system: DesignSystem; blockId?: string }) {
  const selectedBlockId = useBuilder((s) => s.selectedBlockId);
  const blocks = useBuilder((s) => s.blocks);
  const updateBlockProps = useBuilder((s) => s.updateBlockProps);
  const isSelected = blockId != null && selectedBlockId === blockId;
  const block = blockId ? blocks.find((b) => b.id === blockId) : null;

  const label1 = (block?.props.label1 as string) ?? "Email Address";
  const placeholder1 = (block?.props.placeholder1 as string) ?? "name@company.com";
  const helper1 = (block?.props.helper1 as string) ?? "We'll never share your email.";
  const label2 = (block?.props.label2 as string) ?? "Password";
  const placeholder2 = (block?.props.placeholder2 as string) ?? "Enter password";

  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";

  if (isSelected && blockId) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className={`${prefix}-input-container`}>
          <InlineEditable value={label1} onChange={(v) => updateBlockProps(blockId, { label1: v })} className={`${prefix}-label`} style={{ outline: "none", display: "block" }} />
          <div className={`${prefix}-input-wrapper`}>
            <input className={`${prefix}-input`} value={placeholder1} onChange={(e) => updateBlockProps(blockId, { placeholder1: e.target.value })} onClick={(e) => e.stopPropagation()} />
          </div>
          <InlineEditable value={helper1} onChange={(v) => updateBlockProps(blockId, { helper1: v })} className={`${prefix}-helper-text`} style={{ outline: "none", display: "block" }} />
        </div>
        <div className={`${prefix}-input-container`}>
          <InlineEditable value={label2} onChange={(v) => updateBlockProps(blockId, { label2: v })} className={`${prefix}-label`} style={{ outline: "none", display: "block" }} />
          <div className={`${prefix}-input-wrapper`}>
            <input className={`${prefix}-input`} value={placeholder2} onChange={(e) => updateBlockProps(blockId, { placeholder2: e.target.value })} onClick={(e) => e.stopPropagation()} type="password" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SimulatedInput system={system} label={label1} placeholder={placeholder1} helperText={helper1} />
      <SimulatedInput system={system} label={label2} placeholder={placeholder2} type="password" helperText="" />
    </div>
  );
}

function ButtonsBlock({ blockId }: { system?: DesignSystem; blockId?: string }) {
  const selectedBlockId = useBuilder((s) => s.selectedBlockId);
  const blocks = useBuilder((s) => s.blocks);
  const updateBlockProps = useBuilder((s) => s.updateBlockProps);
  const isSelected = blockId != null && selectedBlockId === blockId;
  const block = blockId ? blocks.find((b) => b.id === blockId) : null;

  const defaultBtns = [
    { key: "primary", label: "Primary", bg: t.primary, fg: t.onPrimary, border: "none" },
    { key: "secondary", label: "Secondary", bg: "transparent", fg: t.primary, border: `1px solid ${t.primary}` },
    { key: "text", label: "Text", bg: "transparent", fg: t.fg, border: "none" },
    { key: "disabled", label: "Disabled", bg: t.border, fg: t.fg, border: "none", disabled: true },
  ];

  const labels: Record<string, string> = (block?.props.btnLabels as Record<string, string>) ?? {};
  const getLabel = (key: string, fallback: string) => labels[key] ?? fallback;

  const updateLabel = (key: string, value: string) => {
    if (!blockId) return;
    updateBlockProps(blockId, { btnLabels: { ...labels, [key]: value } });
  };

  const [activeBtn, setActiveBtn] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {defaultBtns.map((btn) => (
        <div
          key={btn.key}
          onClick={() => { if (!btn.disabled) { setActiveBtn(btn.key); setTimeout(() => setActiveBtn(null), 300); } }}
          style={{
            display: "inline-flex",
            padding: "8px 16px",
            borderRadius: btnRadius,
            fontSize: 12,
            fontWeight: 600,
            cursor: btn.disabled ? "not-allowed" : "pointer",
            background: btn.bg,
            color: btn.fg,
            border: btn.border,
            opacity: btn.disabled ? 0.5 : activeBtn === btn.key ? 0.8 : 1,
            transform: activeBtn === btn.key ? "scale(0.95)" : "scale(1)",
            transition: "all 150ms ease",
            fontFamily: "inherit",
          }}
        >
          {isSelected && blockId && !btn.disabled ? (
            <InlineEditable
              value={getLabel(btn.key, btn.label)}
              onChange={(v) => updateLabel(btn.key, v)}
              style={{ outline: "none", minWidth: 20, color: "inherit" }}
            />
          ) : (
            getLabel(btn.key, btn.label)
          )}
        </div>
      ))}
    </div>
  );
}

function CardsBlock({ blockId }: { system?: DesignSystem; blockId?: string }) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const selectedBlockId = useBuilder((s) => s.selectedBlockId);
  const blocks = useBuilder((s) => s.blocks);
  const updateBlockProps = useBuilder((s) => s.updateBlockProps);
  const isSelected = blockId != null && selectedBlockId === blockId;
  const block = blockId ? blocks.find((b) => b.id === blockId) : null;

  const defaultCards = [
    { title: "Analytics", icon: "bar_chart" },
    { title: "Reports", icon: "description" },
    { title: "Users", icon: "group" },
    { title: "Settings", icon: "settings" },
  ];
  const cards = (block?.props.cards as typeof defaultCards) ?? defaultCards;

  const updateCardTitle = (idx: number, title: string) => {
    if (!blockId) return;
    const next = cards.map((c, i) => (i === idx ? { ...c, title } : c));
    updateBlockProps(blockId, { cards: next });
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
        gap: 12,
      }}
    >
      {cards.map((card, idx) => {
        const hoverKey = `card-${idx}`;
        return (
          <div
            key={idx}
            onMouseEnter={() => setHoveredCard(hoverKey)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              background: hoveredCard === hoverKey ? t.surfaceHover : t.surface,
              border: `1px solid ${hoveredCard === hoverKey ? t.primaryHover : t.border}`,
              borderRadius: radius,
              padding: 14,
              cursor: "pointer",
              transition: "all 150ms ease",
              transform: hoveredCard === hoverKey ? "translateY(-2px)" : "none",
              boxShadow:
                hoveredCard === hoverKey ? `0 4px 12px ${t.primaryShadow}` : "none",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: t.primary, marginBottom: 6, display: "block" }}
            >
              {card.icon}
            </span>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {isSelected && blockId ? (
                <InlineEditable value={card.title} onChange={(v) => updateCardTitle(idx, v)} style={{ outline: "none" }} />
              ) : card.title}
            </div>
            <div style={{ fontSize: 11, color: t.fgTertiary, marginTop: 4 }}>
              View details
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TabsBlock({ system }: { system: DesignSystem }) {
  return <SimulatedTabs system={system} />;
}

function TogglesBlock({ system, blockId }: { system: DesignSystem; blockId?: string }) {
  const selectedBlockId = useBuilder((s) => s.selectedBlockId);
  const blocks = useBuilder((s) => s.blocks);
  const updateBlockProps = useBuilder((s) => s.updateBlockProps);
  const isSelected = blockId != null && selectedBlockId === blockId;
  const block = blockId ? blocks.find((b) => b.id === blockId) : null;

  const cb1 = (block?.props.cb1 as string) ?? "Enable notifications";
  const cb2 = (block?.props.cb2 as string) ?? "Automatic updates";
  const sw1 = (block?.props.sw1 as string) ?? "Dark mode";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <SimulatedCheckbox system={system} label={cb1} defaultChecked>
        {isSelected && blockId ? (
          <InlineEditable value={cb1} onChange={(v) => updateBlockProps(blockId, { cb1: v })} style={{ outline: "none" }} />
        ) : undefined}
      </SimulatedCheckbox>
      <SimulatedCheckbox system={system} label={cb2}>
        {isSelected && blockId ? (
          <InlineEditable value={cb2} onChange={(v) => updateBlockProps(blockId, { cb2: v })} style={{ outline: "none" }} />
        ) : undefined}
      </SimulatedCheckbox>
      <SimulatedSwitch system={system} label={sw1}>
        {isSelected && blockId ? (
          <InlineEditable value={sw1} onChange={(v) => updateBlockProps(blockId, { sw1: v })} style={{ outline: "none" }} />
        ) : undefined}
      </SimulatedSwitch>
    </div>
  );
}

function BadgesBlock({ blockId }: { system?: DesignSystem; blockId?: string }) {
  const [activeBadge, setActiveBadge] = useState<string | null>(null);
  const selectedBlockId = useBuilder((s) => s.selectedBlockId);
  const blocks = useBuilder((s) => s.blocks);
  const updateBlockProps = useBuilder((s) => s.updateBlockProps);
  const isSelected = blockId != null && selectedBlockId === blockId;
  const block = blockId ? blocks.find((b) => b.id === blockId) : null;

  const defaultBadges = [
    { label: "Active", color: t.statusPositive },
    { label: "Pending", color: t.statusWarning },
    { label: "Closed", color: t.statusNegative },
  ];
  const badges = (block?.props.badges as typeof defaultBadges) ?? defaultBadges;

  const updateBadgeLabel = (idx: number, label: string) => {
    if (!blockId) return;
    const next = badges.map((b, i) => (i === idx ? { ...b, label } : b));
    updateBlockProps(blockId, { badges: next });
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      {badges.map((b, idx) => (
        <span
          key={idx}
          onClick={() => setActiveBadge(activeBadge === `badge-${idx}` ? null : `badge-${idx}`)}
          style={{
            padding: "3px 10px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            background: activeBadge === `badge-${idx}` ? b.color : "transparent",
            color: activeBadge === `badge-${idx}` ? t.onPrimary : b.color,
            border: `1px solid ${b.color}`,
            transition: "all 150ms ease",
            userSelect: "none",
          }}
        >
          {isSelected && blockId ? (
            <InlineEditable value={b.label} onChange={(v) => updateBadgeLabel(idx, v)} style={{ outline: "none", color: "inherit" }} />
          ) : b.label}
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

function DropdownBlock({ system, blockId }: { system: DesignSystem; blockId?: string }) {
  const selectedBlockId = useBuilder((s) => s.selectedBlockId);
  const blocks = useBuilder((s) => s.blocks);
  const updateBlockProps = useBuilder((s) => s.updateBlockProps);
  const isSelected = blockId != null && selectedBlockId === blockId;
  const block = blockId ? blocks.find((b) => b.id === blockId) : null;

  const defaultItems = [
    { label: "Admin", value: "admin" },
    { label: "Editor", value: "editor" },
    { label: "Viewer", value: "viewer" },
    { label: "Owner (Locked)", value: "owner", disabled: true },
  ];
  const items = (block?.props.items as typeof defaultItems) ?? defaultItems;
  const placeholder = (block?.props.placeholder as string) ?? "Select a role";

  const updateItem = (idx: number, label: string) => {
    if (!blockId) return;
    const next = items.map((item, i) => (i === idx ? { ...item, label } : item));
    updateBlockProps(blockId, { items: next });
  };

  if (isSelected && blockId) {
    const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <InlineEditable
          value={placeholder}
          onChange={(v) => updateBlockProps(blockId, { placeholder: v })}
          className={`${prefix}-label`}
          style={{ outline: "none", display: "block", fontSize: 11, color: t.fgSecondary, marginBottom: 4 }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 2, border: `1px solid ${t.border}`, borderRadius: radius, overflow: "hidden" }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ padding: "6px 10px", fontSize: 12, opacity: item.disabled ? 0.5 : 1, background: t.surface }}>
              <InlineEditable
                value={item.label}
                onChange={(v) => updateItem(idx, v)}
                style={{ outline: "none" }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <SimulatedDropdown
      system={system}
      items={items}
      placeholder={placeholder}
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
        <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.25, color: t.fg }}>H1 - Page Title</div>
        <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3, color: t.fg }}>H2 - Section Heading</div>
        <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.35, color: t.fg }}>H3 - Subsection</div>
        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, color: t.fg }}>H4 - Card Title</div>
      </div>

      {/* Body text */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, color: t.fgTertiary, marginBottom: 2 }}>Body Text</div>
        <div style={{ fontSize: 14, lineHeight: 1.6, color: t.fg }}>
          Body 1 - Primary body text used for main content areas, article text, and descriptions. This is the default reading size.
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.5, color: t.fgSecondary }}>
          Body 2 - Secondary body text for supporting content, card descriptions, and supplementary information.
        </div>
      </div>

      {/* Labels & Captions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, color: t.fgTertiary, marginBottom: 2 }}>Labels &amp; Captions</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "baseline" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.fg }}>Label - Form Label</span>
          <span style={{ fontSize: 11, fontWeight: 500, color: t.primary }}>Link - Inline link</span>
          <span style={{ fontSize: 11, color: t.fgTertiary }}>Caption - Helper text</span>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            color: t.fgSecondary,
          }}>
            Overline - Small label
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
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, color: t.fgTertiary, marginBottom: 8 }}>Preview - Mixed Usage</div>
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

function StatsCardsBlock({ blockId }: { system?: DesignSystem; blockId?: string }) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const selectedBlockId = useBuilder((s) => s.selectedBlockId);
  const blocks = useBuilder((s) => s.blocks);
  const updateBlockProps = useBuilder((s) => s.updateBlockProps);
  const isSelected = blockId != null && selectedBlockId === blockId;
  const block = blockId ? blocks.find((b) => b.id === blockId) : null;

  const defaultStats = [
    { label: "Revenue", value: "$42.8K", pct: 60 },
    { label: "Users", value: "1,247", pct: 75 },
    { label: "Growth", value: "+18%", pct: 90 },
  ];
  const stats = (block?.props.stats as typeof defaultStats) ?? defaultStats;

  const updateStat = (idx: number, key: string, val: string) => {
    if (!blockId) return;
    const next = stats.map((s, i) => (i === idx ? { ...s, [key]: val } : s));
    updateBlockProps(blockId, { stats: next });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
      {stats.map((stat, i) => (
        <div
          key={i}
          onMouseEnter={() => setHoveredCard("stat-" + i)}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            background: hoveredCard === "stat-" + i ? t.surfaceHover : t.surface,
            border: `1px solid ${hoveredCard === "stat-" + i ? t.primaryHover : t.border}`,
            borderRadius: radius,
            padding: 14,
            cursor: "pointer",
            transition: "all 150ms ease",
            transform: hoveredCard === "stat-" + i ? "translateY(-1px)" : "none",
          }}
        >
          <div style={{ fontSize: 11, color: t.fgSecondary, marginBottom: 4 }}>
            {isSelected && blockId ? (
              <InlineEditable value={stat.label} onChange={(v) => updateStat(i, "label", v)} style={{ outline: "none" }} />
            ) : stat.label}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {isSelected && blockId ? (
              <InlineEditable value={stat.value} onChange={(v) => updateStat(i, "value", v)} style={{ outline: "none" }} />
            ) : stat.value}
          </div>
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

/* ── Inline-editable text helper ── */
function InlineEditable({
  value,
  onChange,
  style,
  className,
  autoOpenComponentPanel = false,
}: {
  value: string;
  onChange: (v: string) => void;
  style?: React.CSSProperties;
  className?: string;
  autoOpenComponentPanel?: boolean;
}) {
  const setComponentLibraryOpen = useBuilder((s) => s.setComponentLibraryOpen);
  const ref = useRef<HTMLSpanElement>(null);
  const isEditingRef = useRef(false);

  useEffect(() => {
    if (ref.current && !isEditingRef.current) {
      if (ref.current.textContent !== value) {
        ref.current.textContent = value;
      }
    }
  }, [value]);

  const handleBlur = useCallback(() => {
    isEditingRef.current = false;
    if (ref.current) onChange(ref.current.textContent || "");
  }, [onChange]);
  const handleFocus = useCallback(() => {
    isEditingRef.current = true;
    if (autoOpenComponentPanel) setComponentLibraryOpen(true);
  }, [autoOpenComponentPanel, setComponentLibraryOpen]);
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      }
    },
    []
  );

  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className={`inline-editable ${className || ""}`}
      style={style}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        e.stopPropagation();
        if (autoOpenComponentPanel) setComponentLibraryOpen(true);
      }}
    >
      {value}
    </span>
  );
}

function SimulatedButtonBlock({
  system,
  variant = "primary",
  label = "New Button",
  blockId,
}: {
  system: DesignSystem;
  variant?: string;
  label?: string;
  blockId?: string;
}) {
  const { isSelected, update } = useBlockInAnyZone(blockId);

  /* Variant-specific styles */
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: t.primary,
      color: t.onPrimary,
      border: "none",
      boxShadow: `0 2px 8px ${t.primaryShadow}`,
    },
    secondary: {
      background: t.surface,
      color: t.fg,
      border: `1px solid ${t.border}`,
    },
    outline: {
      background: "transparent",
      color: t.primary,
      border: `1.5px solid ${t.primary}`,
    },
    ghost: {
      background: "transparent",
      color: t.fgSecondary,
      border: "none",
    },
  };
  const vs = variantStyles[variant ?? "primary"] || variantStyles.primary;

  return (
    <div
      style={{
        display: "inline-flex",
        padding: variant === "ghost" ? "8px 12px" : "8px 20px",
        borderRadius: btnRadius,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s ease",
        ...vs,
      }}
    >
      {isSelected && blockId ? (
        <InlineEditable
          value={label}
          onChange={(v) => update({ label: v })}
          autoOpenComponentPanel
          style={{ outline: "none", minWidth: 20 }}
        />
      ) : (
        label
      )}
    </div>
  );
}

function SimulatedTitleBlock({
  system,
  level = "h2",
  text = "New Heading",
  blockId,
}: {
  system: DesignSystem;
  level?: string;
  text?: string;
  blockId?: string;
}) {
  const { isSelected, update } = useBlockInAnyZone(blockId);
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";

  if (isSelected && blockId) {
    return (
      <InlineEditable
        value={text}
        onChange={(v) => update({ text: v })}
        autoOpenComponentPanel
        className={`${prefix}-title ${prefix}-title-${level}`}
        style={{ display: "block", outline: "none" }}
      />
    );
  }

  return (
    <SimulatedTitleUI
      system={system}
      level={level as "h1" | "h2" | "h3" | "h4"}
      text={text}
    />
  );
}

function SimulatedTextInputBlock({
  system,
  label = "Label",
  placeholder = "Enter text...",
  blockId,
}: {
  system: DesignSystem;
  label?: string;
  placeholder?: string;
  blockId?: string;
}) {
  const { isSelected, update } = useBlockInAnyZone(blockId);
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";

  return (
    <div className={`${prefix}-input-container`}>
      {isSelected && blockId ? (
        <InlineEditable
          value={label}
          onChange={(v) => update({ label: v })}
          autoOpenComponentPanel
          className={`${prefix}-label`}
          style={{ outline: "none", display: "block" }}
        />
      ) : (
        <label className={`${prefix}-label`}>{label}</label>
      )}
      <div className={`${prefix}-input-wrapper`}>
        {isSelected && blockId ? (
          <input
            type="text"
            className={`${prefix}-input`}
            value={placeholder}
            onChange={(e) => update({ placeholder: e.target.value })}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <input
            type="text"
            className={`${prefix}-input`}
            placeholder={placeholder}
            readOnly
          />
        )}
      </div>
    </div>
  );
}

function SimulatedCardBlock({
  system,
  title = "Card Title",
  content = "Card content goes here.",
  blockId,
}: {
  system: DesignSystem;
  title?: string;
  content?: string;
  blockId?: string;
}) {
  const { isSelected, update } = useBlockInAnyZone(blockId);
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";

  if (isSelected && blockId) {
    return (
      <div className={`${prefix}-sim-card`}>
        <div className={`${prefix}-sim-card-header`}>
          <InlineEditable
            value={title}
            onChange={(v) => update({ title: v })}
            autoOpenComponentPanel
            className={`${prefix}-sim-card-title`}
            style={{ outline: "none", display: "block" }}
          />
        </div>
        <div className={`${prefix}-sim-card-body`}>
          <InlineEditable
            value={content}
            onChange={(v) => update({ content: v })}
            className={`${prefix}-sim-card-content`}
            style={{ outline: "none", display: "block" }}
          />
        </div>
      </div>
    );
  }

  return <SimulatedCard system={system} title={title} content={content} />;
}

function SimulatedStatCardBlock({
  blockId,
  label = "Revenue",
  value = "$42.8K",
  pct = 60,
}: {
  system?: DesignSystem;
  blockId?: string;
  label?: string;
  value?: string;
  pct?: number;
}) {
  const [hovered, setHovered] = useState(false);
  const selectedBlockId = useBuilder((s) => s.selectedBlockId);
  const blocks = useBuilder((s) => s.blocks);
  const headerBlocks = useBuilder((s) => s.headerBlocks);
  const sidebarBlocks = useBuilder((s) => s.sidebarBlocks);
  const footerBlocks = useBuilder((s) => s.footerBlocks);
  const updateZoneBlockProps = useBuilder((s) => s.updateZoneBlockProps);
  const isSelected = blockId != null && selectedBlockId === blockId;
  const block = blockId
    ? (blocks.find((b) => b.id === blockId) ?? headerBlocks.find((b) => b.id === blockId)
      ?? sidebarBlocks.find((b) => b.id === blockId) ?? footerBlocks.find((b) => b.id === blockId))
    : null;

  const displayLabel = (block?.props.label as string) ?? label;
  const displayValue = (block?.props.value as string) ?? value;
  const displayPct = Number(block?.props.pct ?? pct);

  const handleUpdate = (key: string, val: string | number) => {
    if (!blockId) return;
    /* Find the zone and update */
    const zone = blocks.find((b) => b.id === blockId) ? "body" as const
      : headerBlocks.find((b) => b.id === blockId) ? "header" as const
      : sidebarBlocks.find((b) => b.id === blockId) ? "sidebar" as const
      : "footer" as const;
    updateZoneBlockProps(zone, blockId, { [key]: val });
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? t.surfaceHover : t.surface,
        border: `1px solid ${hovered ? t.primaryHover : t.border}`,
        borderRadius: radius,
        padding: 14,
        cursor: "pointer",
        transition: "all 150ms ease",
        transform: hovered ? "translateY(-1px)" : "none",
      }}
    >
      <div style={{ fontSize: 11, color: t.fgSecondary, marginBottom: 4 }}>
        {isSelected && blockId ? (
          <InlineEditable value={displayLabel} onChange={(v) => handleUpdate("label", v)} style={{ outline: "none" }} />
        ) : displayLabel}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: t.fg }}>
        {isSelected && blockId ? (
          <InlineEditable value={displayValue} onChange={(v) => handleUpdate("value", v)} style={{ outline: "none" }} />
        ) : displayValue}
      </div>
      <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: t.border }}>
        <div style={{
          width: `${displayPct}%`,
          height: "100%",
          borderRadius: 2,
          background: t.primary,
          transition: "width 500ms ease",
        }} />
      </div>
    </div>
  );
}

function SimulatedBadgeBlock({
  system,
  label = "Badge",
  status = "default",
  blockId,
}: {
  system: DesignSystem;
  label?: string;
  status?: string;
  blockId?: string;
}) {
  const { isSelected, update } = useBlockInAnyZone(blockId);
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";

  return (
    <span className={`${prefix}-sim-badge ${prefix}-sim-badge-${status}`}>
      {isSelected && blockId ? (
        <InlineEditable
          value={label}
          onChange={(v) => update({ label: v })}
          autoOpenComponentPanel
          style={{ outline: "none", color: "inherit" }}
        />
      ) : label}
    </span>
  );
}

function SimulatedChatMessageBlock({
  system,
  role = "user",
  message,
  blockId,
}: {
  system: DesignSystem;
  role?: "user" | "system";
  message?: string;
  blockId?: string;
}) {
  const { isSelected, update } = useBlockInAnyZone(blockId);
  const isUser = role === "user";
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";
  const defaultMsg = isUser
    ? "Can you help me build a dashboard?"
    : "Absolutely! I'll generate a layout for you now.";
  const displayMsg = message || defaultMsg;

  return (
    <div
      className={`${prefix}-chat-wrapper ${
        isUser ? `${prefix}-chat-right` : `${prefix}-chat-left`
      }`}
    >
      {!isUser && (
        <div className={`${prefix}-chat-avatar`} aria-hidden="true">AI</div>
      )}
      <div
        className={`${prefix}-chat-bubble ${
          isUser ? `${prefix}-chat-user` : `${prefix}-chat-system`
        }`}
      >
        {isSelected && blockId ? (
          <InlineEditable
            value={displayMsg}
            onChange={(v) => update({ message: v })}
            autoOpenComponentPanel
            style={{ outline: "none" }}
          />
        ) : (
          displayMsg
        )}
      </div>
      {isUser && (
        <div
          className={`${prefix}-chat-avatar ${prefix}-avatar-user`}
          aria-hidden="true"
        >
          U
        </div>
      )}
    </div>
  );
}

function SimulatedChartBlock({
  system,
  title = "Monthly Revenue",
  dataPoints = "40,70,45,90,65",
  blockId,
}: {
  system: DesignSystem;
  title?: string;
  dataPoints?: string;
  blockId?: string;
}) {
  const { isSelected, update } = useBlockInAnyZone(blockId);
  const prefix = system === "salt" ? "s" : system === "m3" ? "m3" : "f";

  const parsed = dataPoints
    .split(",")
    .map((n) => parseInt(n.trim(), 10))
    .filter((n) => !isNaN(n));
  const safeData = parsed.length > 0 ? parsed : [40, 70, 45, 90, 65];
  const maxVal = Math.max(...safeData) * 1.1;

  return (
    <div className={`${prefix}-chart-container`}>
      {isSelected && blockId ? (
        <InlineEditable
          value={title}
          onChange={(v) => update({ title: v })}
          autoOpenComponentPanel
          className={`${prefix}-chart-title`}
          style={{ outline: "none", display: "block" }}
        />
      ) : (
        <h4 className={`${prefix}-chart-title`}>{title}</h4>
      )}
      <div className={`${prefix}-chart-area`}>
        {safeData.map((val, i) => (
          <div key={i} className={`${prefix}-chart-column`}>
            <div
              className={`${prefix}-chart-bar`}
              style={{ height: `${(val / maxVal) * 100}%` }}
              role="presentation"
              aria-label={`Item ${i + 1}: ${val}`}
            />
            <span className={`${prefix}-chart-label`}>Item {i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Batch 1: Form Control block renderers ── */

function SimulatedCheckboxBlock({
  system,
  blockId,
}: {
  system: DesignSystem;
  blockId?: string;
}) {
  const blocks = useBuilder((s) => s.blocks);
  const block = blockId ? blocks.find((b) => b.id === blockId) : null;
  const label = (block?.props.label as string) ?? "Accept terms and conditions";
  const defaultChecked = Boolean(block?.props.defaultChecked);

  return (
    <SimulatedCheckbox system={system} label={label} defaultChecked={defaultChecked} />
  );
}

function SimulatedSwitchBlock({
  system,
  blockId,
}: {
  system: DesignSystem;
  blockId?: string;
}) {
  const blocks = useBuilder((s) => s.blocks);
  const block = blockId ? blocks.find((b) => b.id === blockId) : null;
  const label = (block?.props.label as string) ?? "Enable Notifications";
  const defaultOn = Boolean(block?.props.defaultOn);

  return (
    <SimulatedSwitch system={system} label={label} defaultOn={defaultOn} />
  );
}

function SimulatedDropdownBlock({
  system,
  blockId,
}: {
  system: DesignSystem;
  blockId?: string;
}) {
  const blocks = useBuilder((s) => s.blocks);
  const block = blockId ? blocks.find((b) => b.id === blockId) : null;
  const placeholder = (block?.props.placeholder as string) ?? "Select an option";

  return (
    <SimulatedDropdown system={system} placeholder={placeholder} />
  );
}

/* ── Batch 2: Data Display block renderers ── */

function SimulatedDataTableBlock({
  system,
  blockId,
}: {
  system: DesignSystem;
  blockId?: string;
}) {
  const blocks = useBuilder((s) => s.blocks);
  const block = blockId ? blocks.find((b) => b.id === blockId) : null;
  const data = (block?.props.rows as { name: string; status: string; role: string; date: string }[]) ?? undefined;

  return <SimulatedDataTable system={system} data={data} />;
}

function SimulatedProgressBlock({
  system,
  blockId,
}: {
  system: DesignSystem;
  blockId?: string;
}) {
  const blocks = useBuilder((s) => s.blocks);
  const block = blockId ? blocks.find((b) => b.id === blockId) : null;
  const label = (block?.props.label as string) ?? "Uploading assets...";
  const value = Number(block?.props.value ?? 50);

  return <SimulatedProgress system={system} label={label} value={value} />;
}

function SimulatedAvatarBlock({
  system,
  blockId,
}: {
  system: DesignSystem;
  blockId?: string;
}) {
  const blocks = useBuilder((s) => s.blocks);
  const block = blockId ? blocks.find((b) => b.id === blockId) : null;
  const initials = (block?.props.initials as string) ?? "AB";
  const size = (block?.props.size as "sm" | "md" | "lg") ?? "md";
  const presence = (block?.props.presence as "available" | "busy" | "away" | "offline" | undefined) || undefined;

  return <SimulatedAvatar system={system} initials={initials} size={size} presence={presence} />;
}

/* ── Batch 3: Navigation & Layout block renderers ── */

function SimulatedTabsBlock({
  system,
  blockId,
}: {
  system: DesignSystem;
  blockId?: string;
}) {
  const blocks = useBuilder((s) => s.blocks);
  const block = blockId ? blocks.find((b) => b.id === blockId) : null;
  const csv = (block?.props.tabsCsv as string) ?? "General, Security, Notifications";
  const tabs = csv.split(",").map((s) => s.trim()).filter(Boolean);

  return <SimulatedTabs system={system} tabs={tabs} />;
}

function SimulatedBreadcrumbBlock({
  system,
}: {
  system: DesignSystem;
}) {
  // TODO: SimulatedBreadcrumb doesn't accept path prop yet - wire when component is extended
  return <SimulatedBreadcrumb system={system} />;
}

function SimulatedAccordionBlock({
  system,
}: {
  system: DesignSystem;
}) {
  // TODO: SimulatedAccordion doesn't accept title/content props yet - wire when component is extended
  return <SimulatedAccordion system={system} />;
}

/* ── Batch 4: Overlays & Feedback block renderers ── */

function SimulatedDialogBlock({
  system,
}: {
  system: DesignSystem;
}) {
  // TODO: SimulatedDialog doesn't accept title/message props yet - wire when component is extended
  return <SimulatedDialog system={system} />;
}

function SimulatedTooltipBlock({
  system,
  blockId,
}: {
  system: DesignSystem;
  blockId?: string;
}) {
  const blocks = useBuilder((s) => s.blocks);
  const block = blockId ? blocks.find((b) => b.id === blockId) : null;
  const text = (block?.props.text as string) ?? "This is a simulated tooltip";
  const buttonLabel = (block?.props.buttonLabel as string) ?? "Hover me";

  return <SimulatedTooltip system={system} text={text} buttonLabel={buttonLabel} />;
}

function SimulatedDatePickerBlock({
  system,
  blockId,
}: {
  system: DesignSystem;
  blockId?: string;
}) {
  const blocks = useBuilder((s) => s.blocks);
  const block = blockId ? blocks.find((b) => b.id === blockId) : null;
  const month = (block?.props.month as string) ?? "October";
  const year = Number(block?.props.year ?? 2026);

  return <SimulatedDatePicker system={system} month={month} year={year} />;
}

/* ── Batch 5: Highcharts block renderer ── */

/* ── Zone-specific renderers ── */

function AppBrandBlock({ blockId }: { blockId?: string }) {
  const blocks = useBuilder((s) => s.blocks);
  const headerBlocks = useBuilder((s) => s.headerBlocks);
  const sidebarBlocks = useBuilder((s) => s.sidebarBlocks);
  const footerBlocks = useBuilder((s) => s.footerBlocks);
  const block = blockId
    ? (blocks.find((b) => b.id === blockId) ?? headerBlocks.find((b) => b.id === blockId)
      ?? sidebarBlocks.find((b) => b.id === blockId) ?? footerBlocks.find((b) => b.id === blockId))
    : null;
  const label = (block?.props.label as string) || "App Name";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 28, height: 28, borderRadius: "var(--ds-radius)", background: t.primary,
        display: "flex", alignItems: "center", justifyContent: "center", color: t.onPrimary, flexShrink: 0,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>smart_toy</span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: t.fg }}>{label}</span>
    </div>
  );
}

function StatusPillBlock({ blockId }: { blockId?: string }) {
  const blocks = useBuilder((s) => s.blocks);
  const headerBlocks = useBuilder((s) => s.headerBlocks);
  const sidebarBlocks = useBuilder((s) => s.sidebarBlocks);
  const footerBlocks = useBuilder((s) => s.footerBlocks);
  const block = blockId
    ? (blocks.find((b) => b.id === blockId) ?? headerBlocks.find((b) => b.id === blockId)
      ?? sidebarBlocks.find((b) => b.id === blockId) ?? footerBlocks.find((b) => b.id === blockId))
    : null;
  const label = (block?.props.label as string) || "Active";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "4px 10px 4px 8px", borderRadius: 20,
      background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)",
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%", background: "#22c55e",
        boxShadow: "0 0 6px rgba(34, 197, 94, 0.5)",
      }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: "#22c55e" }}>{label}</span>
    </div>
  );
}

function NavItemBlock({ blockId }: { blockId?: string }) {
  const blocks = useBuilder((s) => s.blocks);
  const headerBlocks = useBuilder((s) => s.headerBlocks);
  const sidebarBlocks = useBuilder((s) => s.sidebarBlocks);
  const footerBlocks = useBuilder((s) => s.footerBlocks);
  const block = blockId
    ? (blocks.find((b) => b.id === blockId) ?? headerBlocks.find((b) => b.id === blockId)
      ?? sidebarBlocks.find((b) => b.id === blockId) ?? footerBlocks.find((b) => b.id === blockId))
    : null;
  const label = (block?.props.label as string) || "Nav Item";
  const icon = (block?.props.icon as string) || "chat";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
      borderRadius: "var(--ds-radius)", color: t.fgSecondary, fontSize: 12, fontWeight: 500,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

/* ── Batch 6 renderers - pass-through to SimulatedUI components ── */

function SimulatedRadioGroupBlock({ system, ...props }: { system: DesignSystem; [k: string]: unknown }) {
  return <SimulatedRadioGroup system={system} label={props.label as string} optionsCsv={props.optionsCsv as string} defaultIndex={Number(props.defaultIndex ?? 0)} />;
}
function SimulatedSliderBlock({ system, ...props }: { system: DesignSystem; [k: string]: unknown }) {
  return <SimulatedSlider system={system} label={props.label as string} min={Number(props.min ?? 0)} max={Number(props.max ?? 100)} value={Number(props.value ?? 50)} />;
}
function SimulatedNumberInputBlock({ system, ...props }: { system: DesignSystem; [k: string]: unknown }) {
  return <SimulatedNumberInput system={system} label={props.label as string} value={Number(props.value ?? 1)} min={Number(props.min ?? 0)} max={Number(props.max ?? 99)} step={Number(props.step ?? 1)} />;
}
function SimulatedMultilineInputBlock({ system, ...props }: { system: DesignSystem; [k: string]: unknown }) {
  return <SimulatedMultilineInput system={system} label={props.label as string} placeholder={props.placeholder as string} rows={Number(props.rows ?? 3)} />;
}
function SimulatedPillBlock({ system, ...props }: { system: DesignSystem; [k: string]: unknown }) {
  return <SimulatedPill system={system} label={props.label as string} status={props.status as "default"} dismissible={props.dismissible !== false} />;
}
function SimulatedToggleButtonBlock({ system, ...props }: { system: DesignSystem; [k: string]: unknown }) {
  return <SimulatedToggleButton system={system} label={props.label as string} defaultPressed={Boolean(props.defaultPressed)} />;
}
function SimulatedSegmentedGroupBlock({ system, ...props }: { system: DesignSystem; [k: string]: unknown }) {
  return <SimulatedSegmentedGroup system={system} optionsCsv={props.optionsCsv as string} defaultIndex={Number(props.defaultIndex ?? 0)} />;
}
function SimulatedLinkBlock({ system, ...props }: { system: DesignSystem; [k: string]: unknown }) {
  return <SimulatedLink system={system} text={props.text as string} showIcon={props.showIcon !== false} />;
}
function SimulatedListBoxBlock({ system, ...props }: { system: DesignSystem; [k: string]: unknown }) {
  return <SimulatedListBox system={system} itemsCsv={props.itemsCsv as string} multiSelect={Boolean(props.multiSelect)} />;
}
function SimulatedComboBoxBlock({ system, ...props }: { system: DesignSystem; [k: string]: unknown }) {
  return <SimulatedComboBox system={system} placeholder={props.placeholder as string} itemsCsv={props.itemsCsv as string} />;
}
function SimulatedFileDropZoneBlock({ system, ...props }: { system: DesignSystem; [k: string]: unknown }) {
  return <SimulatedFileDropZone system={system} label={props.label as string} acceptTypes={props.acceptTypes as string} />;
}

/* ── Batch 7 renderers ── */
function SimulatedTreeBlock({ system, ...p }: { system: DesignSystem; [k: string]: unknown }) { return <SimulatedTree system={system} itemsCsv={p.itemsCsv as string} />; }
function SimulatedRatingBlock({ system, ...p }: { system: DesignSystem; [k: string]: unknown }) { return <SimulatedRating system={system} label={p.label as string} max={Number(p.max ?? 5)} value={Number(p.value ?? 3)} />; }
function SimulatedSkeletonBlock({ system, ...p }: { system: DesignSystem; [k: string]: unknown }) { return <SimulatedSkeleton system={system} variant={p.variant as "card"} />; }
function SimulatedSearchboxBlock({ system, ...p }: { system: DesignSystem; [k: string]: unknown }) { return <SimulatedSearchbox system={system} placeholder={p.placeholder as string} />; }
function SimulatedTokenizedInputBlock({ system, ...p }: { system: DesignSystem; [k: string]: unknown }) { return <SimulatedTokenizedInput system={system} label={p.label as string} tokensCsv={p.tokensCsv as string} />; }
function SimulatedNavDrawerBlock({ system, ...p }: { system: DesignSystem; [k: string]: unknown }) { return <SimulatedNavDrawer system={system} itemsCsv={p.itemsCsv as string} />; }
function SimulatedPopoverBlock({ system, ...p }: { system: DesignSystem; [k: string]: unknown }) { return <SimulatedPopover system={system} title={p.title as string} content={p.content as string} />; }
function SimulatedPersonaBlock({ system, ...p }: { system: DesignSystem; [k: string]: unknown }) { return <SimulatedPersona system={system} name={p.name as string} role={p.role as string} presence={p.presence as "available"} />; }
function SimulatedAvatarGroupBlock({ system, ...p }: { system: DesignSystem; [k: string]: unknown }) { return <SimulatedAvatarGroup system={system} namesCsv={p.namesCsv as string} max={Number(p.max ?? 4)} />; }

function FooterTextBlock({ blockId }: { blockId?: string }) {
  const blocks = useBuilder((s) => s.blocks);
  const headerBlocks = useBuilder((s) => s.headerBlocks);
  const sidebarBlocks = useBuilder((s) => s.sidebarBlocks);
  const footerBlocks = useBuilder((s) => s.footerBlocks);
  const block = blockId
    ? (blocks.find((b) => b.id === blockId) ?? headerBlocks.find((b) => b.id === blockId)
      ?? sidebarBlocks.find((b) => b.id === blockId) ?? footerBlocks.find((b) => b.id === blockId))
    : null;
  const label = (block?.props.label as string) || "Footer text";
  const version = (block?.props.version as string) || "";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: t.fgTertiary }}>
      <span>{label}</span>
      {version && <><span style={{ opacity: 0.4 }}>&middot;</span><span>{version}</span></>}
    </div>
  );
}

function HighchartBlockRenderer({
  system,
  blockId,
}: {
  system: DesignSystem;
  blockId?: string;
}) {
  const blocks = useBuilder((s) => s.blocks);
  const headerBlocks = useBuilder((s) => s.headerBlocks);
  const sidebarBlocks = useBuilder((s) => s.sidebarBlocks);
  const footerBlocks = useBuilder((s) => s.footerBlocks);
  const block = blockId
    ? (blocks.find((b) => b.id === blockId)
      ?? headerBlocks.find((b) => b.id === blockId)
      ?? sidebarBlocks.find((b) => b.id === blockId)
      ?? footerBlocks.find((b) => b.id === blockId))
    : null;
  const chartType = (block?.props.chartType as HighchartType) ?? "line";
  const title = (block?.props.title as string) ?? "";
  const value = block?.props.value != null ? Number(block.props.value) : undefined;

  return (
    <SimulatedHighchart
      chartType={chartType}
      title={title}
      value={value}
      system={system}
    />
  );
}

/* ── Renderer map ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RENDERERS: Record<string, React.FC<any>> = {
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
  SimulatedBreadcrumb: SimulatedBreadcrumbBlock as React.FC<{ system: DesignSystem }>,
  SimulatedAccordion: SimulatedAccordionBlock as React.FC<{ system: DesignSystem }>,
  SimulatedCard: SimulatedCardBlock as React.FC<{ system: DesignSystem }>,
  SimulatedBadge: SimulatedBadgeBlock as React.FC<{ system: DesignSystem }>,
  SimulatedChatMessage: SimulatedChatMessageBlock as React.FC<{ system: DesignSystem }>,
  SimulatedChart: SimulatedChartBlock as React.FC<{ system: DesignSystem }>,
  SimulatedCheckbox: SimulatedCheckboxBlock as React.FC<{ system: DesignSystem }>,
  SimulatedSwitch: SimulatedSwitchBlock as React.FC<{ system: DesignSystem }>,
  SimulatedDropdown: SimulatedDropdownBlock as React.FC<{ system: DesignSystem }>,
  SimulatedDataTable: SimulatedDataTableBlock as React.FC<{ system: DesignSystem }>,
  SimulatedProgress: SimulatedProgressBlock as React.FC<{ system: DesignSystem }>,
  SimulatedAvatar: SimulatedAvatarBlock as React.FC<{ system: DesignSystem }>,
  SimulatedTabs: SimulatedTabsBlock as React.FC<{ system: DesignSystem }>,
  SimulatedDialog: SimulatedDialogBlock as React.FC<{ system: DesignSystem }>,
  SimulatedTooltip: SimulatedTooltipBlock as React.FC<{ system: DesignSystem }>,
  SimulatedDatePicker: SimulatedDatePickerBlock as React.FC<{ system: DesignSystem }>,
  HighchartLine: HighchartBlockRenderer as React.FC<{ system: DesignSystem }>,
  HighchartArea: HighchartBlockRenderer as React.FC<{ system: DesignSystem }>,
  HighchartColumn: HighchartBlockRenderer as React.FC<{ system: DesignSystem }>,
  HighchartPie: HighchartBlockRenderer as React.FC<{ system: DesignSystem }>,
  HighchartScatter: HighchartBlockRenderer as React.FC<{ system: DesignSystem }>,
  HighchartBar: HighchartBlockRenderer as React.FC<{ system: DesignSystem }>,
  HighchartDonut: HighchartBlockRenderer as React.FC<{ system: DesignSystem }>,
  HighchartSpline: HighchartBlockRenderer as React.FC<{ system: DesignSystem }>,
  HighchartStackedColumn: HighchartBlockRenderer as React.FC<{ system: DesignSystem }>,
  HighchartGauge: HighchartBlockRenderer as React.FC<{ system: DesignSystem }>,
  HighchartHeatmap: HighchartBlockRenderer as React.FC<{ system: DesignSystem }>,
  HighchartTreemap: HighchartBlockRenderer as React.FC<{ system: DesignSystem }>,
  SimulatedAlert: AlertBlock,
  SimulatedStatCard: SimulatedStatCardBlock as React.FC<{ system: DesignSystem }>,
  /* Batch 6 */
  SimulatedRadioGroup: SimulatedRadioGroupBlock,
  SimulatedSlider: SimulatedSliderBlock,
  SimulatedNumberInput: SimulatedNumberInputBlock,
  SimulatedMultilineInput: SimulatedMultilineInputBlock,
  SimulatedPill: SimulatedPillBlock,
  SimulatedToggleButton: SimulatedToggleButtonBlock,
  SimulatedSegmentedGroup: SimulatedSegmentedGroupBlock,
  SimulatedLink: SimulatedLinkBlock,
  SimulatedListBox: SimulatedListBoxBlock,
  SimulatedComboBox: SimulatedComboBoxBlock,
  SimulatedFileDropZone: SimulatedFileDropZoneBlock,
  /* Batch 7 */
  SimulatedTree: SimulatedTreeBlock,
  SimulatedRating: SimulatedRatingBlock,
  SimulatedSkeleton: SimulatedSkeletonBlock,
  SimulatedSearchbox: SimulatedSearchboxBlock,
  SimulatedTokenizedInput: SimulatedTokenizedInputBlock,
  SimulatedNavDrawer: SimulatedNavDrawerBlock,
  SimulatedPopover: SimulatedPopoverBlock,
  SimulatedPersona: SimulatedPersonaBlock,
  SimulatedAvatarGroup: SimulatedAvatarGroupBlock,
  /* Zone-specific types */
  AppBrand: AppBrandBlock as React.FC<{ system: DesignSystem }>,
  StatusPill: StatusPillBlock as React.FC<{ system: DesignSystem }>,
  NavItem: NavItemBlock as React.FC<{ system: DesignSystem }>,
  FooterText: FooterTextBlock as React.FC<{ system: DesignSystem }>,
};

/* ── Main export ── */
export function ComponentRenderer({ type, system, blockId, ...props }: ComponentRendererProps & { blockId?: string }) {
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
      <Renderer system={system} blockId={blockId} {...(props as Record<string, unknown>)} />
    </div>
  );
}
