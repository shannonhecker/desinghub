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

/* ── Registry ── */
const PREVIEWS: Record<TemplateId, React.FC> = {
  "analytics-dashboard": AnalyticsDashboardPreview,
  "settings-page":       SettingsPagePreview,
  "crm-contacts":        CrmContactsPreview,
  "login-flow":          LoginFlowPreview,
  "landing-page":        LandingPagePreview,
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
