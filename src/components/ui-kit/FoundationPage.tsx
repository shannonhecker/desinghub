"use client";

import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { getComponents, getDemoComponent, getSystemInfo } from "@/data/registry";

/**
 * FoundationPage — doc-style template for /ui-kit Foundations entries
 * (cat: "Foundations" across all five DSs: Salt/Carbon/uoaui/fluent dl-*
 * ids AND M3's a11y / guide-* / *-tokens ids).
 *
 * Foundations are self-contained reference documents (DLColor,
 * DLTypography, ColorRolesGuide, …) with no metaId, so the component
 * shell's Variants / Props / Guidance machinery has nothing to show for
 * them. This template drops the tabs / matrix / props table / TOC and
 * renders: an eyebrow, the page title, the active DS as quiet context,
 * then the foundation's own content full-width.
 *
 * Reuses the .dh-detail page frame (padding/header rhythm from
 * globals.css) so the page sits identically in the shell; colours come
 * inline from the active theme, never hard-coded.
 */
export function FoundationPage({ componentId }: { componentId: string }) {
  const t = useTheme();
  const comp = getComponents(t.activeSystem).find((c) => c.id === componentId);
  const Demo = getDemoComponent(t.activeSystem, componentId);
  if (!comp || !Demo) return null;
  const system = getSystemInfo(t.activeSystem);

  return (
    <div className="dh-detail" style={{ fontFamily: t.font, color: t.fg }}>
      <header className="dh-detail-header">
        <p className="dh-foundation-eyebrow" style={{ color: t.fg3 }}>Foundations</p>
        <h2 className="dh-detail-title" style={{ color: t.fg }}>{comp.name}</h2>
        <p className="dh-foundation-context" style={{ color: t.fg3 }}>{system.name}</p>
      </header>
      <Demo />
    </div>
  );
}
