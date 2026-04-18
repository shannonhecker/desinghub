"use client";

import React from "react";
import type { TemplateId } from "@/lib/builderTemplates";

/* ══════════════════════════════════════════════════════════
   TemplatePreviews — tiny SVG wireframes rendered inside each
   pattern card so users see a hint of the actual layout before
   clicking. Replaces the single Material icon with a hand-crafted
   miniature that matches the template's real composition.

   Each SVG is 220 × 130 (2x pattern card aspect) and uses the
   ausos accent (muted violet) for emphasis strokes + semantic
   tokens for surfaces so it works in both dark and light modes.
   ══════════════════════════════════════════════════════════ */

const FG = "currentColor";
const ACCENT = "#9484D6"; // muted violet, ausos accent — always visible over both modes
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

/* ── 1. Analytics Dashboard ── */
function AnalyticsDashboardPreview() {
  return (
    <svg viewBox="0 0 220 130" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Analytics dashboard preview">
      {/* Sidebar */}
      <WireRect x={4} y={4} w={30} h={122} r={3} stroke />
      <WireRect x={10} y={12} w={18} h={3} accent />
      <WireRect x={10} y={20} w={16} h={2} />
      <WireRect x={10} y={25} w={14} h={2} />
      <WireRect x={10} y={30} w={15} h={2} />
      <WireRect x={10} y={35} w={12} h={2} />

      {/* Header */}
      <WireRect x={38} y={4} w={178} h={10} r={2} />

      {/* KPI row */}
      <WireRect x={38} y={18} w={56} h={22} r={2} stroke />
      <WireRect x={98} y={18} w={56} h={22} r={2} stroke />
      <WireRect x={158} y={18} w={58} h={22} r={2} stroke />
      <WireRect x={42} y={22} w={14} h={2} />
      <WireRect x={42} y={27} w={20} h={5} accent />
      <WireRect x={102} y={22} w={14} h={2} />
      <WireRect x={102} y={27} w={20} h={5} accent />
      <WireRect x={162} y={22} w={14} h={2} />
      <WireRect x={162} y={27} w={20} h={5} accent />

      {/* Main chart area */}
      <WireRect x={38} y={44} w={178} h={42} r={2} stroke />
      {/* Chart curve (area shape) */}
      <path
        d="M 42 76 L 58 68 L 74 72 L 90 60 L 106 64 L 122 54 L 138 58 L 154 48 L 170 52 L 186 44 L 202 48 L 212 46 L 212 84 L 42 84 Z"
        fill={ACCENT}
        opacity={0.35}
      />
      <path
        d="M 42 76 L 58 68 L 74 72 L 90 60 L 106 64 L 122 54 L 138 58 L 154 48 L 170 52 L 186 44 L 202 48 L 212 46"
        stroke={ACCENT}
        strokeWidth={1.25}
        fill="none"
      />

      {/* Data table */}
      <WireRect x={38} y={90} w={178} h={36} r={2} stroke />
      <WireRect x={42} y={94} w={170} h={4} />
      <WireRect x={42} y={102} w={170} h={2.5} />
      <WireRect x={42} y={108} w={150} h={2.5} />
      <WireRect x={42} y={114} w={165} h={2.5} />
      <WireRect x={42} y={120} w={140} h={2.5} />
    </svg>
  );
}

/* ── 2. Settings Page ── */
function SettingsPagePreview() {
  return (
    <svg viewBox="0 0 220 130" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Settings page preview">
      {/* Sidebar with section items */}
      <WireRect x={4} y={4} w={54} h={122} r={3} stroke />
      <WireRect x={10} y={12} w={30} h={3} />
      <WireRect x={10} y={22} w={34} h={3} accent />
      <WireRect x={10} y={30} w={28} h={3} />
      <WireRect x={10} y={38} w={32} h={3} />
      <WireRect x={10} y={46} w={26} h={3} />

      {/* Header */}
      <WireRect x={62} y={4} w={154} h={10} r={2} />

      {/* Profile section: avatar + input rows */}
      <WireRect x={62} y={18} w={30} h={3} accent />
      <circle cx={74} cy={34} r={10} fill={BG_BAR} />
      <WireRect x={90} y={28} w={40} h={4} r={2} />
      <WireRect x={90} y={36} w={30} h={3} />
      <WireRect x={62} y={50} w={154} h={6} r={1.5} stroke />
      <WireRect x={62} y={58} w={154} h={6} r={1.5} stroke />

      {/* Preferences section with toggles */}
      <WireRect x={62} y={70} w={34} h={3} accent />
      {/* Toggle row 1 */}
      <WireRect x={62} y={78} w={100} h={4} />
      <WireRect x={196} y={77} w={16} h={6} r={3} accent />
      {/* Toggle row 2 */}
      <WireRect x={62} y={88} w={90} h={4} />
      <WireRect x={196} y={87} w={16} h={6} r={3} />
      {/* Toggle row 3 */}
      <WireRect x={62} y={98} w={110} h={4} />
      <WireRect x={196} y={97} w={16} h={6} r={3} />

      {/* Danger zone alert */}
      <WireRect x={62} y={108} w={154} h={18} r={2} stroke />
      <WireRect x={66} y={112} w={40} h={3} />
      <WireRect x={66} y={118} w={80} h={3} />
    </svg>
  );
}

/* ── 3. CRM Contacts ── */
function CrmContactsPreview() {
  return (
    <svg viewBox="0 0 220 130" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="CRM contacts preview">
      {/* Sidebar */}
      <WireRect x={4} y={4} w={30} h={122} r={3} stroke />
      <WireRect x={10} y={12} w={18} h={3} accent />
      <WireRect x={10} y={20} w={14} h={2} />
      <WireRect x={10} y={25} w={16} h={2} />
      <WireRect x={10} y={30} w={14} h={2} />
      <WireRect x={10} y={35} w={12} h={2} />

      {/* Search + filter row */}
      <WireRect x={38} y={6} w={120} h={10} r={5} stroke />
      <WireRect x={162} y={6} w={54} h={10} r={2} stroke />

      {/* Data table with realistic rows (avatar + lines + status pill) */}
      <WireRect x={38} y={22} w={178} h={76} r={2} stroke />
      {/* Header */}
      <WireRect x={42} y={26} w={170} h={5} />
      {/* 5 rows */}
      {[36, 48, 60, 72, 84].map((y, i) => (
        <g key={y}>
          <circle cx={50} cy={y + 4} r={3} fill={i % 2 === 0 ? ACCENT : MUTED} opacity={i % 2 === 0 ? 0.6 : 1} />
          <WireRect x={58} y={y + 2} w={50} h={2.5} />
          <WireRect x={58} y={y + 6.5} w={30} h={2} />
          <WireRect x={120} y={y + 2.5} w={40} h={3} />
          <WireRect x={170} y={y + 2} w={26} h={4} r={2} accent={i === 0 || i === 2} />
        </g>
      ))}

      {/* KPI row */}
      <WireRect x={38} y={102} w={57} h={22} r={2} stroke />
      <WireRect x={99} y={102} w={57} h={22} r={2} stroke />
      <WireRect x={160} y={102} w={56} h={22} r={2} stroke />
      <WireRect x={42} y={106} w={14} h={2} />
      <WireRect x={42} y={111} w={22} h={6} accent />
      <WireRect x={103} y={106} w={14} h={2} />
      <WireRect x={103} y={111} w={22} h={6} accent />
      <WireRect x={164} y={106} w={16} h={2} />
      <WireRect x={164} y={111} w={26} h={6} accent />
    </svg>
  );
}

/* ── 4. Login → Dashboard ── */
function LoginFlowPreview() {
  return (
    <svg viewBox="0 0 220 130" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Login flow preview">
      {/* Subtle background hint of the destination dashboard */}
      <g opacity={0.15}>
        <WireRect x={4} y={4} w={30} h={122} r={3} stroke />
        <WireRect x={38} y={4} w={178} h={10} r={2} />
        <WireRect x={38} y={18} w={56} h={22} r={2} stroke />
        <WireRect x={98} y={18} w={56} h={22} r={2} stroke />
        <WireRect x={158} y={18} w={58} h={22} r={2} stroke />
        <WireRect x={38} y={44} w={178} h={50} r={2} stroke />
        <WireRect x={38} y={98} w={178} h={28} r={2} stroke />
      </g>

      {/* Centered login card on top */}
      <rect x={60} y={18} width={100} height={94} rx={4} fill="rgba(148, 132, 214, 0.08)" stroke={ACCENT} strokeWidth={1.25} />

      {/* "Welcome back" title */}
      <WireRect x={68} y={25} w={50} h={5} accent />
      <WireRect x={68} y={34} w={70} h={2.5} />

      {/* Email input */}
      <WireRect x={68} y={44} w={84} h={8} r={1.5} stroke />
      {/* Password input */}
      <WireRect x={68} y={56} w={84} h={8} r={1.5} stroke />

      {/* Sign in button */}
      <rect x={68} y={70} width={84} height={10} rx={1.5} fill={ACCENT} />

      {/* OAuth button outline */}
      <WireRect x={68} y={84} w={84} h={8} r={1.5} stroke />
      {/* Second OAuth */}
      <WireRect x={68} y={96} w={84} h={8} r={1.5} stroke />

      {/* Arrow hinting the flow */}
      <path
        d="M 170 64 L 200 64 M 195 60 L 200 64 L 195 68"
        stroke={ACCENT}
        strokeWidth={1.25}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
    </svg>
  );
}

/* ── Registry ── */
const PREVIEWS: Record<TemplateId, React.FC> = {
  "analytics-dashboard": AnalyticsDashboardPreview,
  "settings-page":       SettingsPagePreview,
  "crm-contacts":        CrmContactsPreview,
  "login-flow":          LoginFlowPreview,
};

export function TemplatePreview({ id }: { id: TemplateId }) {
  const Preview = PREVIEWS[id];
  if (!Preview) return null;
  /* No aria-hidden here — the inner SVG has role="img" with an
     aria-label describing what the wireframe represents. The pattern
     card's own aria-label ("Apply X template") gives click context. */
  return (
    <div className="pattern-card-preview">
      <Preview />
    </div>
  );
}
