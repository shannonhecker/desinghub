"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { getComponents, getDemoComponent, getSystemInfo } from "@/data/registry";
import { CodePanel, loadCodeMap } from "@/components/CodePanel";

/**
 * FoundationPage — doc-style template for /ui-kit Foundations entries
 * (cat: "Foundations" across all five DSs: Salt/Carbon/uoaui/fluent dl-*
 * ids AND M3's a11y / guide-* / *-tokens ids).
 *
 * Foundations are self-contained reference documents (DLColor,
 * DLTypography, ColorRolesGuide, …) with no metaId, so the component
 * shell's Variants / Props / Guidance machinery has nothing to show for
 * them. This template drops the tabs / matrix / props table / TOC and
 * renders: an eyebrow, the page title, the entry's authored one-line
 * desc (same .dh-detail-desc ramp the component shell uses), the active
 * DS as quiet context, the foundation's own content full-width, and —
 * ONLY when the entry has authored snippets in the active DS's
 * code-snippets module — the same Code section the component shell
 * renders (house CodePanel/CodeBlock styling). Foundations without
 * authored code get no Code section at all, never the skeleton
 * fallback.
 *
 * Reuses the .dh-detail page frame (padding/header rhythm from
 * globals.css) so the page sits identically in the shell; colours come
 * inline from the active theme, never hard-coded. Small header text
 * (eyebrow 11px / context 13px / desc 16px) uses the theme's fg2 text
 * role: fg3 fails WCAG AA 4.5:1 on shipped themes (M3 light ≈4.33:1,
 * uoaui dark ≈3.89:1) while fg2 clears it on every shipped default
 * theme — proven per-theme in __tests__/foundationContrast.test.ts.
 */
export function FoundationPage({ componentId }: { componentId: string }) {
  const t = useTheme();
  const comp = getComponents(t.activeSystem).find((c) => c.id === componentId);
  const Demo = getDemoComponent(t.activeSystem, componentId);

  /* Authored-code gate. Resolves the active DS's snippet map (cached at
     module scope in CodePanel) and only then mounts the Code section —
     so entries without snippets never flash the skeleton fallback. */
  const [hasCode, setHasCode] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setHasCode(false);
    loadCodeMap(t.activeSystem).then((map) => {
      if (!cancelled) setHasCode(Boolean(map[componentId]));
    });
    return () => {
      cancelled = true;
    };
  }, [t.activeSystem, componentId]);

  if (!comp || !Demo) return null;
  const system = getSystemInfo(t.activeSystem);

  return (
    <div className="dh-detail" style={{ fontFamily: t.font, color: t.fg }}>
      <header className="dh-detail-header">
        <p className="dh-foundation-eyebrow" style={{ color: t.fg2 }}>Foundations</p>
        <h1 className="dh-detail-title" style={{ color: t.fg }}>{comp.name}</h1>
        <p className="dh-detail-desc" style={{ color: t.fg2 }}>{comp.desc}</p>
        <p className="dh-foundation-context" style={{ color: t.fg2 }}>{system.name}</p>
      </header>
      <Demo />
      {hasCode && (
        <section
          id="dh-sec-code"
          className="dh-section"
          aria-labelledby="dh-h-code"
          style={{ marginTop: "var(--dh-space-64, 64px)" }}
        >
          <h2 id="dh-h-code" className="dh-section-h" style={{ color: t.fg }}>Code</h2>
          <CodePanel componentId={componentId} />
        </section>
      )}
    </div>
  );
}
