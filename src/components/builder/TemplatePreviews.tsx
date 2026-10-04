"use client";

import React from "react";
import type { TemplateId } from "@/lib/builderTemplates";

/* ══════════════════════════════════════════════════════════
   TemplatePreviews - tiny SVG wireframes rendered inside each
   pattern card so users see a hint of the actual layout before
   clicking. Replaces the single Material icon with a hand-crafted
   miniature that matches the template's real composition.

   Kept in sync with src/lib/builderTemplates.ts — when a template's
   block list changes, update its wireframe here so the card mirrors
   what actually populates the canvas (owner 2026-06-03: the cards
   must match the templates).

   Each SVG is 220 × 130 (2x pattern card aspect) and uses the
   uoaui accent (muted violet) for emphasis strokes + semantic
   tokens for surfaces so it works in both dark and light modes.
   ══════════════════════════════════════════════════════════ */

const FG = "currentColor";
const ACCENT = "#9484D6"; // muted violet, uoaui accent - always visible over both modes
const MUTED = "rgba(128, 128, 128, 0.35)";
const BG_BAR = "rgba(128, 128, 128, 0.2)";

function WireRect({
  x, y, w, h, r = 1.5, accent, stroke,
}: { x: number; y: number; w: number; h: number; r?: number; accent?: boolean; stroke?: boolean }) {
  return (
    <rect
      x={x} y={y} width={w} height={h} rx={r} ry={r}
      fill={accent ? ACCENT : stroke ? "none" : BG_BAR}
      stroke={stroke ? (accent ? ACCENT : MUTED) : "none"}
      strokeWidth={stroke ? 1 : 0}
    />
  );
}

/* ── 1. Analytics Dashboard ──
   Mirrors the enriched template: 4 KPI cards, a full-width hero
   trend chart, a 2-up supporting row (bar chart + donut), and a
   detail table — i.e. the "5 charts to start" composition. */
function AnalyticsDashboardPreview() {
  return (
    <svg viewBox="0 0 220 130" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Analytics dashboard preview: KPI row, trend chart, bar chart, donut, and a data table">
      {/* Sidebar */}
      <WireRect x={4} y={4} w={30} h={122} r={3} stroke />
      <WireRect x={10} y={12} w={18} h={3} accent />
      <WireRect x={10} y={20} w={16} h={2} />
      <WireRect x={10} y={25} w={14} h={2} />
      <WireRect x={10} y={30} w={15} h={2} />
      <WireRect x={10} y={35} w={12} h={2} />

      {/* Header */}
      <WireRect x={38} y={4} w={178} h={8} r={2} />

      {/* KPI row — 4 cards */}
      <WireRect x={38} y={16} w={40} h={16} r={2} stroke />
      <WireRect x={82} y={16} w={40} h={16} r={2} stroke />
      <WireRect x={126} y={16} w={40} h={16} r={2} stroke />
      <WireRect x={170} y={16} w={46} h={16} r={2} stroke />
      <WireRect x={42} y={19} w={12} h={2} /><WireRect x={42} y={23} w={18} h={5} accent />
      <WireRect x={86} y={19} w={12} h={2} /><WireRect x={86} y={23} w={18} h={5} accent />
      <WireRect x={130} y={19} w={12} h={2} /><WireRect x={130} y={23} w={18} h={5} accent />
      <WireRect x={174} y={19} w={12} h={2} /><WireRect x={174} y={23} w={18} h={5} accent />

      {/* Hero trend (area) */}
      <WireRect x={38} y={36} w={178} h={24} r={2} stroke />
      <path d="M 42 54 L 58 48 L 74 51 L 90 43 L 106 46 L 122 39 L 138 42 L 154 36 L 170 39 L 186 33 L 202 36 L 212 35 L 212 57 L 42 57 Z" fill={ACCENT} opacity={0.3} />
      <path d="M 42 54 L 58 48 L 74 51 L 90 43 L 106 46 L 122 39 L 138 42 L 154 36 L 170 39 L 186 33 L 202 36 L 212 35" stroke={ACCENT} strokeWidth={1} fill="none" />

      {/* 2-up supporting row: bar chart + donut */}
      <WireRect x={38} y={64} w={86} h={26} r={2} stroke />
      <WireRect x={46} y={78} w={6} h={8} accent />
      <WireRect x={56} y={73} w={6} h={13} accent />
      <WireRect x={66} y={80} w={6} h={6} accent />
      <WireRect x={76} y={70} w={6} h={16} accent />
      <WireRect x={86} y={76} w={6} h={10} accent />
      <WireRect x={96} y={74} w={6} h={12} accent />
      <WireRect x={106} y={81} w={6} h={5} accent />
      <WireRect x={128} y={64} w={88} h={26} r={2} stroke />
      <circle cx={150} cy={77} r={9} fill="none" stroke={MUTED} strokeWidth={4} />
      <path d="M 150 68 A 9 9 0 0 1 158 81" fill="none" stroke={ACCENT} strokeWidth={4} />
      <WireRect x={166} y={72} w={42} h={2.5} />
      <WireRect x={166} y={78} w={34} h={2.5} />
      <WireRect x={166} y={84} w={38} h={2.5} />

      {/* Data table */}
      <WireRect x={38} y={94} w={178} h={32} r={2} stroke />
      <WireRect x={42} y={98} w={170} h={4} />
      <WireRect x={42} y={106} w={170} h={2.5} />
      <WireRect x={42} y={112} w={150} h={2.5} />
      <WireRect x={42} y={118} w={165} h={2.5} />
    </svg>
  );
}

/* ── 2. Settings Page ──
   Mirrors the enriched template: Profile, Preferences toggles, an
   Integrations section (connect cards + key/verify), then Danger. */
function SettingsPagePreview() {
  return (
    <svg viewBox="0 0 220 130" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Settings page preview: profile, preference toggles, integrations cards, and a danger zone">
      {/* Sidebar with section items */}
      <WireRect x={4} y={4} w={54} h={122} r={3} stroke />
      <WireRect x={10} y={12} w={30} h={3} />
      <WireRect x={10} y={22} w={34} h={3} accent />
      <WireRect x={10} y={30} w={28} h={3} />
      <WireRect x={10} y={38} w={32} h={3} />
      <WireRect x={10} y={46} w={26} h={3} />

      {/* Header */}
      <WireRect x={62} y={4} w={154} h={8} r={2} />

      {/* Profile: heading + avatar + input */}
      <WireRect x={62} y={16} w={28} h={3} accent />
      <circle cx={73} cy={30} r={8} fill={BG_BAR} />
      <WireRect x={86} y={26} w={36} h={3.5} r={2} />
      <WireRect x={86} y={33} w={26} h={2.5} />
      <WireRect x={62} y={42} w={154} h={5} r={1.5} stroke />

      {/* Preferences: heading + 2 toggles */}
      <WireRect x={62} y={52} w={34} h={3} accent />
      <WireRect x={62} y={59} w={90} h={3.5} />
      <WireRect x={198} y={58} w={14} h={5} r={2.5} accent />
      <WireRect x={62} y={67} w={80} h={3.5} />
      <WireRect x={198} y={66} w={14} h={5} r={2.5} />

      {/* Integrations (NEW): heading + 3 connect cards + key field + verify */}
      <WireRect x={62} y={78} w={40} h={3} accent />
      <WireRect x={62} y={84} w={48} h={16} r={2} stroke />
      <WireRect x={114} y={84} w={48} h={16} r={2} stroke />
      <WireRect x={166} y={84} w={50} h={16} r={2} stroke />
      <circle cx={70} cy={90} r={2.5} fill={ACCENT} /><WireRect x={76} y={88} w={26} h={2.5} /><WireRect x={66} y={94} w={40} h={2} />
      <circle cx={122} cy={90} r={2.5} fill={MUTED} /><WireRect x={128} y={88} w={26} h={2.5} /><WireRect x={118} y={94} w={40} h={2} />
      <circle cx={174} cy={90} r={2.5} fill={MUTED} /><WireRect x={180} y={88} w={28} h={2.5} /><WireRect x={170} y={94} w={42} h={2} />
      <WireRect x={62} y={104} w={110} h={7} r={1.5} stroke />
      <WireRect x={176} y={104} w={40} h={7} r={1.5} accent />

      {/* Danger zone alert (slim) */}
      <WireRect x={62} y={115} w={154} h={11} r={2} stroke />
      <WireRect x={66} y={119} w={60} h={3} />
    </svg>
  );
}

/* ── 3. CRM Contacts ──
   Mirrors the enriched template: search + filter, a 3-KPI overview,
   a chart row (contacts-added area + status donut), then the table. */
function CrmContactsPreview() {
  return (
    <svg viewBox="0 0 220 130" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="CRM contacts preview: search and filter, KPI cards, a trend chart and status donut, and a contacts table">
      {/* Sidebar */}
      <WireRect x={4} y={4} w={30} h={122} r={3} stroke />
      <WireRect x={10} y={12} w={18} h={3} accent />
      <WireRect x={10} y={20} w={14} h={2} />
      <WireRect x={10} y={25} w={16} h={2} />
      <WireRect x={10} y={30} w={14} h={2} />
      <WireRect x={10} y={35} w={12} h={2} />

      {/* Search + filter */}
      <WireRect x={38} y={6} w={124} h={9} r={4.5} stroke />
      <WireRect x={166} y={6} w={50} h={9} r={2} stroke />

      {/* KPI row (3) */}
      <WireRect x={38} y={19} w={56} h={16} r={2} stroke />
      <WireRect x={98} y={19} w={56} h={16} r={2} stroke />
      <WireRect x={158} y={19} w={58} h={16} r={2} stroke />
      <WireRect x={42} y={22} w={12} h={2} /><WireRect x={42} y={26} w={20} h={5} accent />
      <WireRect x={102} y={22} w={12} h={2} /><WireRect x={102} y={26} w={20} h={5} accent />
      <WireRect x={162} y={22} w={14} h={2} /><WireRect x={162} y={26} w={22} h={5} accent />

      {/* Chart row (NEW): contacts-added area (8) + status donut (4) */}
      <WireRect x={38} y={39} w={116} h={28} r={2} stroke />
      <path d="M 44 60 L 60 54 L 76 57 L 92 50 L 108 53 L 124 47 L 140 50 L 148 48 L 148 63 L 44 63 Z" fill={ACCENT} opacity={0.3} />
      <path d="M 44 60 L 60 54 L 76 57 L 92 50 L 108 53 L 124 47 L 140 50 L 148 48" stroke={ACCENT} strokeWidth={1} fill="none" />
      <WireRect x={158} y={39} w={58} h={28} r={2} stroke />
      <circle cx={177} cy={53} r={9} fill="none" stroke={MUTED} strokeWidth={4} />
      <path d="M 177 44 A 9 9 0 0 1 184 58" fill="none" stroke={ACCENT} strokeWidth={4} />
      <WireRect x={194} y={49} w={18} h={2} />
      <WireRect x={194} y={54} w={14} h={2} />

      {/* Contacts table */}
      <WireRect x={38} y={71} w={178} h={55} r={2} stroke />
      <WireRect x={42} y={75} w={170} h={4} />
      {[83, 93, 103, 113].map((y, i) => (
        <g key={y}>
          <circle cx={50} cy={y + 3} r={3} fill={i % 2 === 0 ? ACCENT : MUTED} opacity={i % 2 === 0 ? 0.6 : 1} />
          <WireRect x={58} y={y + 1.5} w={50} h={2.5} />
          <WireRect x={120} y={y + 1.5} w={36} h={3} />
          <WireRect x={170} y={y + 1} w={26} h={4} r={2} accent={i === 0 || i === 2} />
        </g>
      ))}
    </svg>
  );
}

/* ── 4. Login → Dashboard ──
   Mirrors the enriched template: an auth card that now leads with a
   hero banner image, then the form (title, email, password, sign in,
   two OAuth buttons), over a faint dashboard-destination hint. */
function LoginFlowPreview() {
  return (
    <svg viewBox="0 0 220 130" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Login flow preview: an auth card with a hero banner image and a sign-in form, over a faint dashboard hint">
      {/* Subtle background hint of the destination dashboard */}
      <g opacity={0.12}>
        <WireRect x={4} y={4} w={30} h={122} r={3} stroke />
        <WireRect x={38} y={4} w={178} h={10} r={2} />
        <WireRect x={38} y={18} w={56} h={22} r={2} stroke />
        <WireRect x={98} y={18} w={56} h={22} r={2} stroke />
        <WireRect x={158} y={18} w={58} h={22} r={2} stroke />
        <WireRect x={38} y={44} w={178} h={50} r={2} stroke />
      </g>

      {/* Centered auth card with a hero banner at the top (NEW) */}
      <rect x={58} y={12} width={104} height={106} rx={4} fill="rgba(148, 132, 214, 0.08)" stroke={ACCENT} strokeWidth={1.25} />
      {/* Hero banner image — sun + mountains motif */}
      <rect x={62} y={16} width={96} height={22} rx={2} fill={MUTED} />
      <circle cx={78} cy={26} r={3.5} fill={ACCENT} opacity={0.7} />
      <path d="M 64 36 L 84 22 L 100 32 L 120 20 L 156 36 Z" fill="rgba(148, 132, 214, 0.4)" />

      {/* Title + subtitle */}
      <WireRect x={66} y={44} w={46} h={4} accent />
      <WireRect x={66} y={51} w={66} h={2.5} />
      {/* Email + password */}
      <WireRect x={66} y={58} w={88} h={7} r={1.5} stroke />
      <WireRect x={66} y={68} w={88} h={7} r={1.5} stroke />
      {/* Sign in */}
      <rect x={66} y={79} width={88} height={9} rx={1.5} fill={ACCENT} />
      {/* Two OAuth buttons */}
      <WireRect x={66} y={91} w={88} h={7} r={1.5} stroke />
      <WireRect x={66} y={101} w={88} h={7} r={1.5} stroke />

      {/* Arrow hinting the flow to the dashboard */}
      <path d="M 168 64 L 198 64 M 193 60 L 198 64 L 193 68" stroke={ACCENT} strokeWidth={1.25} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
    </svg>
  );
}

/* ── 5. Landing Page ──
   Mirrors the enriched template: top nav, hero (headline + email +
   image), a feature trio, a "From the blog" image-card row, and a
   social-proof stats band. */
function LandingPagePreview() {
  return (
    <svg viewBox="0 0 220 130" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Landing page preview: top nav, hero with image, feature trio, blog image cards, and a stats band">
      {/* Top nav: brand + links + CTA */}
      <WireRect x={8} y={5} w={24} h={4} accent />
      <WireRect x={120} y={6} w={12} h={2.5} />
      <WireRect x={136} y={6} w={12} h={2.5} />
      <WireRect x={152} y={6} w={12} h={2.5} />
      <WireRect x={186} y={4} w={26} h={8} r={2} accent />

      {/* Hero: headline + email capture (left), image (right) */}
      <WireRect x={8} y={20} w={80} h={6} accent />
      <WireRect x={8} y={29} w={92} h={2.5} />
      <WireRect x={8} y={35} w={56} h={8} r={1.5} stroke />
      <WireRect x={68} y={35} w={24} h={8} r={1.5} accent />
      <WireRect x={120} y={18} w={92} h={28} r={2} stroke />
      <circle cx={138} cy={28} r={3.5} fill={ACCENT} opacity={0.6} />
      <path d="M 124 42 L 144 26 L 160 38 L 182 24 L 208 42 Z" fill={MUTED} />

      {/* Feature trio */}
      {[8, 80, 152].map((x) => (
        <g key={`f${x}`}>
          <WireRect x={x} y={50} w={60} h={20} r={2} stroke />
          <WireRect x={x + 6} y={54} w={9} h={9} r={2} accent />
          <WireRect x={x + 19} y={55} w={30} h={2.5} />
          <WireRect x={x + 19} y={60} w={24} h={2} />
          <WireRect x={x + 19} y={64} w={28} h={2} />
        </g>
      ))}

      {/* "From the blog" image cards (NEW): image on top + caption */}
      {[8, 80, 152].map((x) => (
        <g key={`b${x}`}>
          <WireRect x={x} y={74} w={60} h={20} r={2} stroke />
          <rect x={x + 3} y={77} width={54} height={9} rx={1.5} fill={MUTED} />
          <circle cx={x + 12} cy={81} r={2} fill={ACCENT} opacity={0.6} />
          <WireRect x={x + 3} y={88} w={44} h={2.5} />
        </g>
      ))}

      {/* Social-proof stats band */}
      {[8, 80, 152].map((x) => (
        <g key={`s${x}`}>
          <WireRect x={x + 8} y={100} w={22} h={5} accent />
          <WireRect x={x + 8} y={108} w={36} h={2.5} />
        </g>
      ))}

      {/* Footer */}
      <WireRect x={4} y={120} w={212} h={5} r={1} />
    </svg>
  );
}

/* Shared chrome for the finance report wireframes: the two-bar header and the
   context row (title + filters). */
function FinanceChrome({ filters }: { filters: number }) {
  const width = 26;
  const gap = 4;
  return (
    <>
      {/* Two-bar application header: brand + links, then workspace tabs. */}
      <WireRect x={4} y={4} w={212} h={7} r={2} stroke />
      <WireRect x={8} y={6.5} w={3} h={2.4} accent />
      <WireRect x={13} y={6.8} w={20} h={1.8} />
      <WireRect x={40} y={6.8} w={10} h={1.8} />
      <WireRect x={54} y={6.8} w={10} h={1.8} />
      <WireRect x={68} y={6.8} w={10} h={1.8} />
      <WireRect x={8} y={12.6} w={9} h={1.6} />
      <WireRect x={21} y={12.6} w={13} h={1.6} accent />
      <WireRect x={38} y={12.6} w={8} h={1.6} />
      {/* Context row: page title + filters. */}
      <WireRect x={21} y={18} w={28} h={4} accent />
      {Array.from({ length: filters }, (_, i) => (
        <WireRect key={i} x={199 - (filters - i) * (width + gap) + gap} y={17} w={width} h={6} r={1.5} stroke />
      ))}
    </>
  );
}

/** The page body of the finance thumbnails, centred under the header. */
const FINANCE_BODY_SHIFT = "translate(-17 0)";

/* A grid panel: header band, grouped header row, then rows. */
function WireGrid({ x, y, w, h, rows }: { x: number; y: number; w: number; h: number; rows: number }) {
  const step = (h - 12) / rows;
  return (
    <>
      <WireRect x={x} y={y} w={w} h={h} r={2} stroke />
      <WireRect x={x + 4} y={y + 3.5} w={Math.min(34, w * 0.4)} h={2.5} accent />
      <WireRect x={x + 4} y={y + 9} w={w - 8} h={2.5} />
      {Array.from({ length: rows - 1 }, (_, i) => (
        <WireRect key={i} x={x + 4} y={y + 9 + step * (i + 1)} w={(w - 8) * (i % 2 ? 0.86 : 0.94)} h={1.6} />
      ))}
    </>
  );
}

/* ── 6. Risk Analytics ──
   Mirrors the template: context row, the risk summary grid, three
   chart panels (stacked bar, clustered column, stacked bar) and the
   full-width value-at-risk combination chart. */
function RiskAnalyticsPreview() {
  const bars = [30, 24, 18, 14, 10, 7];
  return (
    <svg viewBox="0 0 220 130" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Risk analytics preview: a risk summary grid, three chart panels and a value-at-risk trend chart">
      <FinanceChrome filters={1} />
      <g transform={FINANCE_BODY_SHIFT}>
      <WireGrid x={38} y={26} w={178} h={26} rows={4} />

      {/* Stacked bar (horizontal) */}
      <WireRect x={38} y={56} w={56} h={32} r={2} stroke />
      {bars.map((b, i) => (
        <React.Fragment key={i}>
          <WireRect x={43} y={61 + i * 4.2} w={b * 0.6} h={2.4} accent />
          <WireRect x={43 + b * 0.6} y={61 + i * 4.2} w={b * 0.5} h={2.4} />
        </React.Fragment>
      ))}
      {/* Clustered column */}
      <WireRect x={99} y={56} w={56} h={32} r={2} stroke />
      {[16, 6, 14, 5, 8, 3].map((v, i) => (
        <React.Fragment key={i}>
          <WireRect x={104 + i * 8} y={84 - v} w={2.6} h={v} accent />
          <WireRect x={107.4 + i * 8} y={84 - v * 0.6} w={2.6} h={v * 0.6} />
        </React.Fragment>
      ))}
      {/* Stacked bar (horizontal) */}
      <WireRect x={160} y={56} w={56} h={32} r={2} stroke />
      {bars.map((b, i) => (
        <React.Fragment key={i}>
          <WireRect x={165} y={61 + i * 4.2} w={b * 0.9} h={2.4} accent />
          <WireRect x={165 + b * 0.9} y={61 + i * 4.2} w={b * 0.25} h={2.4} />
        </React.Fragment>
      ))}

      {/* Combination: columns + two lines */}
      <WireRect x={38} y={92} w={178} h={34} r={2} stroke />
      {Array.from({ length: 24 }, (_, i) => {
        const v = 6 + ((i * 7) % 9);
        return <WireRect key={i} x={44 + i * 7} y={121 - v} w={3.4} h={v} />;
      })}
      <path d="M 45 118 L 66 116 L 87 108 L 108 101 L 129 99 L 150 106 L 171 114 L 192 117 L 210 119" stroke={ACCENT} strokeWidth={1.2} fill="none" />
      <path d="M 45 119 L 66 117 L 87 110 L 108 103 L 129 101 L 150 107 L 171 115 L 192 118 L 210 120" stroke={MUTED} strokeWidth={1} strokeDasharray="2 2" fill="none" />
      </g>
    </svg>
  );
}

/* ── 7. Performance Analytics ──
   Mirrors the template: context row with four filters, the results
   grid, a row of grid + clustered column + donut, then stacked area
   + combination. */
function PerformanceAnalyticsPreview() {
  return (
    <svg viewBox="0 0 220 130" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Performance analytics preview: a results grid, a breakdown grid, returns and allocation charts, and two trend charts">
      <FinanceChrome filters={4} />
      <g transform={FINANCE_BODY_SHIFT}>
      <WireGrid x={38} y={26} w={178} h={32} rows={6} />

      <WireGrid x={38} y={62} w={56} h={30} rows={5} />
      {/* Clustered column */}
      <WireRect x={99} y={62} w={56} h={30} r={2} stroke />
      {[5, 8, 15, 18].map((v, i) => (
        <React.Fragment key={i}>
          <WireRect x={105 + i * 12} y={88 - v} w={3} h={v} accent />
          <WireRect x={109 + i * 12} y={88 - v * 0.9} w={3} h={v * 0.9} />
        </React.Fragment>
      ))}
      {/* Donut */}
      <WireRect x={160} y={62} w={56} h={30} r={2} stroke />
      <circle cx={188} cy={78} r={9} fill="none" stroke={MUTED} strokeWidth={4} />
      <path d="M 188 69 A 9 9 0 0 1 195.8 82.5" fill="none" stroke={ACCENT} strokeWidth={4} />

      {/* Stacked area */}
      <WireRect x={38} y={96} w={86} h={30} r={2} stroke />
      <path d="M 43 116 L 60 114 L 77 113 L 94 110 L 111 109 L 119 108 L 119 122 L 43 122 Z" fill={ACCENT} opacity={0.35} />
      <path d="M 43 108 L 60 107 L 77 105 L 94 104 L 111 102 L 119 102 L 119 108 L 111 109 L 94 110 L 77 113 L 60 114 L 43 116 Z" fill={FG} opacity={0.18} />
      {/* Combination */}
      <WireRect x={130} y={96} w={86} h={30} r={2} stroke />
      {[4, 3, 12, 15, 3, 6].map((v, i) => (
        <React.Fragment key={i}>
          <WireRect x={136 + i * 13} y={122 - v} w={3.4} h={v} accent />
          <WireRect x={140.4 + i * 13} y={122 - v * 0.8} w={3.4} h={v * 0.8} />
        </React.Fragment>
      ))}
      <path d="M 139 110 L 152 111 L 165 106 L 178 105 L 191 112 L 204 113" stroke={FG} strokeOpacity={0.55} strokeWidth={1} fill="none" />
      </g>
    </svg>
  );
}

/* Shared chrome for the Sustainable Investment wireframes: the two-bar
   header, the section's grouped sidebar, and the page title. The body starts
   at x=42. */
function SustainableChrome({ active, filters = 0 }: { active: number; filters?: number }) {
  return (
    <>
      <WireRect x={4} y={4} w={212} h={7} r={2} stroke />
      <WireRect x={8} y={6.5} w={3} h={2.4} accent />
      <WireRect x={13} y={6.8} w={20} h={1.8} />
      <WireRect x={8} y={12.6} w={9} h={1.6} />
      <WireRect x={21} y={12.6} w={10} h={1.6} />
      <WireRect x={35} y={12.6} w={18} h={1.6} accent />
      {/* Sidebar: two groups of two pages. */}
      <WireRect x={4} y={17} w={32} h={109} r={2} stroke />
      {[0, 1, 2, 3].map((i) => {
        const y = 26 + i * 6 + (i > 1 ? 9 : 0);
        return <WireRect key={i} x={9} y={y} w={i === active ? 20 : 16} h={2} accent={i === active} />;
      })}
      <WireRect x={9} y={21} w={10} h={1.4} />
      <WireRect x={9} y={42} w={12} h={1.4} />
      {/* Context row. */}
      <WireRect x={42} y={18} w={40} h={4} accent />
      {Array.from({ length: filters }, (_, i) => (
        <WireRect key={i} x={216 - (filters - i) * 30 + 4} y={17} w={26} h={6} r={1.5} stroke />
      ))}
    </>
  );
}

/* A half-dome gauge in a small panel. */
function WireGauge({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const cx = x + w / 2;
  const cy = y + h - 5;
  const r = Math.min(w / 2 - 5, h - 10);
  return (
    <>
      <WireRect x={x} y={y} w={w} h={h} r={2} stroke />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={MUTED} strokeWidth={2.6} />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r * 0.3} ${cy - r * 0.95}`} fill="none" stroke={ACCENT} strokeWidth={2.6} />
    </>
  );
}

/* ── 8. ESG Analytics ── summary grid, four gauges and a distribution, a
   breakdown grid beside a trend, two rankings. */
function EsgAnalyticsPreview() {
  return (
    <svg viewBox="0 0 220 130" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ESG analytics preview: a summary grid, four score gauges, a rating distribution, a trend chart and two rankings">
      <SustainableChrome active={0} filters={2} />
      <WireGrid x={42} y={26} w={174} h={24} rows={4} />
      {[0, 1, 2, 3].map((i) => <WireGauge key={i} x={42 + i * 29.5} y={53} w={27} h={22} />)}
      <WireRect x={160} y={53} w={56} h={22} r={2} stroke />
      {[4, 7, 12, 9, 5, 3].map((v, i) => <WireRect key={i} x={166 + i * 8} y={72 - v} w={4} h={v} accent={i < 3} />)}
      <WireGrid x={42} y={78} w={85} h={22} rows={4} />
      <WireRect x={131} y={78} w={85} h={22} r={2} stroke />
      {[6, 8, 9, 11, 12].map((v, i) => (
        <React.Fragment key={i}>
          <WireRect x={137 + i * 15} y={97 - v} w={3} h={v} accent />
          <WireRect x={141 + i * 15} y={97 - v * 0.8} w={3} h={v * 0.8} />
        </React.Fragment>
      ))}
      <WireGrid x={42} y={103} w={85} h={23} rows={4} />
      <WireGrid x={131} y={103} w={85} h={23} rows={4} />
    </svg>
  );
}

/* ── 9. Climate Analytics ── summary grid, four charts across, a breakdown
   grid beside a donut, a ranking beside a column chart. */
function ClimateAnalyticsPreview() {
  return (
    <svg viewBox="0 0 220 130" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Climate analytics preview: a summary grid, four emissions charts, a breakdown grid, a donut and a ranking">
      <SustainableChrome active={1} filters={1} />
      <WireGrid x={42} y={26} w={174} h={24} rows={4} />
      {[0, 1, 2, 3].map((i) => <WireRect key={i} x={42 + i * 44.5} y={53} w={40.5} h={24} r={2} stroke />)}
      {[16, 12, 9, 6].map((v, i) => <WireRect key={i} x={46} y={58 + i * 4.2} w={v} h={2.2} accent />)}
      {[10, 14, 8, 5].map((v, i) => (
        <React.Fragment key={i}>
          <WireRect x={92 + i * 8} y={74 - v} w={4} h={v * 0.5} accent />
          <WireRect x={92 + i * 8} y={74 - v * 0.5} w={4} h={v * 0.5} />
        </React.Fragment>
      ))}
      {[13, 9, 7, 4].map((v, i) => <WireRect key={i} x={137 + i * 8} y={74 - v} w={4} h={v} />)}
      <circle cx={196} cy={65} r={7} fill="none" stroke={MUTED} strokeWidth={3} />
      <path d="M 196 58 A 7 7 0 0 1 202.6 67.4" fill="none" stroke={ACCENT} strokeWidth={3} />
      <WireGrid x={42} y={80} w={100} h={22} rows={4} />
      <WireRect x={146} y={80} w={70} h={22} r={2} stroke />
      <circle cx={181} cy={91} r={7} fill="none" stroke={MUTED} strokeWidth={3} />
      <path d="M 181 84 A 7 7 0 1 1 174.6 93.4" fill="none" stroke={ACCENT} strokeWidth={3} />
      <WireGrid x={42} y={105} w={85} h={21} rows={4} />
      <WireRect x={131} y={105} w={85} h={21} r={2} stroke />
      {[15, 12, 10, 8, 7, 5, 4, 3].map((v, i) => <WireRect key={i} x={137 + i * 9.4} y={123 - v} w={5} h={v} accent={i < 2} />)}
    </svg>
  );
}

/* ── 10. Screening ── a waterfall over a universe grid and a detail panel. */
function ScreeningPreview() {
  const steps: [top: number, height: number][] = [[34, 24], [34, 8], [42, 5], [47, 4], [51, 3], [54, 4]];
  return (
    <svg viewBox="0 0 220 130" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Screening preview: a screening waterfall, the security universe grid and a security detail panel">
      <SustainableChrome active={2} />
      <WireRect x={42} y={26} w={174} h={38} r={2} stroke />
      <WireRect x={46} y={29.5} w={34} h={2.5} accent />
      {steps.map(([top, height], i) => <WireRect key={i} x={52 + i * 27} y={top} w={14} h={height} accent={i === 0 || i === steps.length - 1} />)}
      <WireGrid x={42} y={68} w={114} h={58} rows={9} />
      <WireRect x={160} y={68} w={56} h={58} r={2} stroke />
      <WireRect x={164} y={71.5} w={28} h={2.5} accent />
      {[0, 1, 2].map((i) => (
        <React.Fragment key={i}>
          <WireRect x={164} y={79 + i * 7} w={14} h={1.6} />
          <WireRect x={190} y={79 + i * 7} w={18} h={1.6} />
        </React.Fragment>
      ))}
      <path d="M 164 120 L 172 114 L 180 116 L 188 109 L 196 111 L 204 105 L 212 107" stroke={ACCENT} strokeWidth={1.2} fill="none" />
    </svg>
  );
}

/* ── 11. Screening Changes ── a wide change grid with chips and sparklines,
   beside the detail panel. */
function ScreeningChangesPreview() {
  return (
    <svg viewBox="0 0 220 130" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Screening changes preview: a change grid with chips, sparklines and badges, and a security detail panel">
      <SustainableChrome active={3} />
      <WireRect x={42} y={26} w={114} h={100} r={2} stroke />
      <WireRect x={46} y={29.5} w={26} h={2.5} accent />
      <WireRect x={46} y={36} w={106} h={2.5} />
      {Array.from({ length: 12 }, (_, i) => {
        const y = 43 + i * 6.6;
        return (
          <React.Fragment key={i}>
            <WireRect x={46} y={y} w={30} h={1.6} />
            <WireRect x={82} y={y - 1} w={9} h={3.4} r={1.7} accent={i % 3 === 0} />
            <WireRect x={95} y={y - 1} w={9} h={3.4} r={1.7} />
            <path d={`M 110 ${y + 1.4} l 4 -1.6 l 4 1 l 4 -2 l 4 0.8`} stroke={i % 2 ? MUTED : ACCENT} strokeWidth={0.9} fill="none" />
            <circle cx={136} cy={y + 0.8} r={2.2} fill="none" stroke={i % 4 === 1 ? ACCENT : MUTED} strokeWidth={0.9} />
            <circle cx={144} cy={y + 0.8} r={2.2} fill="none" stroke={MUTED} strokeWidth={0.9} />
          </React.Fragment>
        );
      })}
      <WireRect x={160} y={26} w={56} h={100} r={2} stroke />
      <WireRect x={164} y={29.5} w={28} h={2.5} accent />
      {[0, 1, 2, 3, 4].map((i) => (
        <React.Fragment key={i}>
          <WireRect x={164} y={38 + i * 8} w={14} h={1.6} />
          <WireRect x={190} y={38 + i * 8} w={18} h={1.6} />
        </React.Fragment>
      ))}
      <path d="M 164 112 L 172 104 L 180 107 L 188 98 L 196 101 L 204 93 L 212 96" stroke={ACCENT} strokeWidth={1.2} fill="none" />
    </svg>
  );
}

/* ── Registry ── */
const PREVIEWS: Record<TemplateId, React.FC> = {
  "analytics-dashboard": AnalyticsDashboardPreview,
  "settings-page":       SettingsPagePreview,
  "crm-contacts":        CrmContactsPreview,
  "login-flow":          LoginFlowPreview,
  "landing-page":        LandingPagePreview,
  "risk-analytics":        RiskAnalyticsPreview,
  "performance-analytics": PerformanceAnalyticsPreview,
  "esg-analytics":         EsgAnalyticsPreview,
  "climate-analytics":     ClimateAnalyticsPreview,
  "screening":             ScreeningPreview,
  "screening-changes":     ScreeningChangesPreview,
};

export function TemplatePreview({ id }: { id: TemplateId }) {
  const Preview = PREVIEWS[id];
  if (!Preview) return null;
  /* No aria-hidden here - the inner SVG has role="img" with an
     aria-label describing what the wireframe represents. The pattern
     card's own aria-label ("Apply X template") gives click context. */
  return (
    <div className="pattern-card-preview">
      <Preview />
    </div>
  );
}
