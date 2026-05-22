/* Bento panel graphics — bespoke static SVG thumbnails for the four
   bento panels on the landing page. Each component renders at the
   container's natural width with a fixed aspect ratio, so the panel
   can scale freely. All shapes use semantic landing-page colors via
   currentColor / CSS vars; no hardcoded brand-specific hex values
   leak from this file. */

export function BentoSystemsGraphic() {
  /* Five tile previews — one representative chrome moment per DS:
     Salt = dense grid, M3 = rounded card with surface tint,
     Fluent = compound input, Carbon = UI Shell strip,
     uoaui = glass panel. */
  return (
    <svg
      className="bento-graphic bento-graphic--systems"
      viewBox="0 0 480 152"
      role="img"
      aria-label="Five design-system preview tiles: Salt, Material 3, Fluent 2, Carbon, uoaui"
    >
      {/* Salt — dense grid */}
      <g transform="translate(0,12)">
        <rect x="2" y="0" width="92" height="128" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" />
        <rect x="10" y="10" width="76" height="6" rx="2" fill="rgba(255,255,255,0.55)" />
        <g fill="rgba(255, 255, 255,0.35)">
          <rect x="10" y="24" width="20" height="14" rx="2" />
          <rect x="34" y="24" width="20" height="14" rx="2" />
          <rect x="58" y="24" width="20" height="14" rx="2" />
          <rect x="10" y="42" width="20" height="14" rx="2" />
          <rect x="34" y="42" width="20" height="14" rx="2" />
          <rect x="58" y="42" width="20" height="14" rx="2" />
        </g>
        <rect x="10" y="64" width="76" height="4" rx="1" fill="rgba(255,255,255,0.18)" />
        <rect x="10" y="74" width="60" height="4" rx="1" fill="rgba(255,255,255,0.14)" />
        <rect x="10" y="84" width="68" height="4" rx="1" fill="rgba(255,255,255,0.14)" />
        <rect x="10" y="106" width="34" height="14" rx="3" fill="rgba(255, 255, 255,0.6)" />
      </g>

      {/* M3 — rounded surface card */}
      <g transform="translate(98,12)">
        <rect x="0" y="0" width="92" height="128" rx="20" fill="rgba(255, 255, 255,0.1)" stroke="rgba(255, 255, 255,0.2)" />
        <rect x="12" y="12" width="68" height="36" rx="14" fill="rgba(255, 255, 255,0.22)" />
        <rect x="22" y="22" width="20" height="6" rx="2" fill="rgba(255,255,255,0.7)" />
        <rect x="22" y="32" width="36" height="4" rx="1" fill="rgba(255,255,255,0.4)" />
        <rect x="12" y="56" width="68" height="6" rx="2" fill="rgba(255,255,255,0.4)" />
        <rect x="12" y="68" width="60" height="4" rx="1" fill="rgba(255,255,255,0.22)" />
        <circle cx="22" cy="100" r="10" fill="rgba(255, 255, 255,0.6)" />
        <rect x="38" y="92" width="42" height="18" rx="9" fill="rgba(255, 255, 255,0.32)" />
      </g>

      {/* Fluent — compound input */}
      <g transform="translate(194,12)">
        <rect x="0" y="0" width="92" height="128" rx="6" fill="rgba(255, 255, 255,0.08)" stroke="rgba(255, 255, 255,0.18)" />
        <rect x="12" y="14" width="40" height="6" rx="2" fill="rgba(255,255,255,0.55)" />
        <rect x="12" y="28" width="68" height="22" rx="4" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.16)" />
        <rect x="12" y="50" width="68" height="2" fill="rgba(255, 255, 255,0.7)" />
        <rect x="12" y="62" width="40" height="4" rx="1" fill="rgba(255,255,255,0.32)" />
        <rect x="12" y="76" width="68" height="22" rx="4" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.16)" />
        <rect x="12" y="98" width="68" height="2" fill="rgba(255, 255, 255,0.45)" />
        <rect x="12" y="108" width="38" height="14" rx="3" fill="rgba(255, 255, 255,0.55)" />
      </g>

      {/* Carbon — IBM UI Shell strip */}
      <g transform="translate(290,12)">
        <rect x="0" y="0" width="92" height="128" rx="0" fill="rgba(20,20,20,0.78)" stroke="rgba(255,255,255,0.16)" />
        <rect x="0" y="0" width="92" height="22" fill="rgba(0,0,0,0.85)" />
        <circle cx="12" cy="11" r="2" fill="rgba(255,255,255,0.7)" />
        <rect x="20" y="8" width="28" height="6" rx="0" fill="rgba(255,255,255,0.85)" />
        <rect x="74" y="6" width="14" height="10" rx="0" fill="rgba(255, 255, 255,1)" />
        <rect x="10" y="32" width="32" height="6" rx="0" fill="rgba(255,255,255,0.7)" />
        <rect x="10" y="46" width="72" height="4" rx="0" fill="rgba(255,255,255,0.32)" />
        <rect x="10" y="56" width="60" height="4" rx="0" fill="rgba(255,255,255,0.22)" />
        <rect x="10" y="76" width="72" height="32" rx="0" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.16)" />
        <rect x="14" y="80" width="20" height="4" fill="rgba(255,255,255,0.55)" />
        <rect x="14" y="88" width="64" height="4" fill="rgba(255,255,255,0.32)" />
        <rect x="14" y="96" width="48" height="4" fill="rgba(255,255,255,0.22)" />
        <rect x="10" y="114" width="28" height="10" rx="0" fill="rgba(255, 255, 255,0.92)" />
      </g>

      {/* uoaui — glass panel */}
      <g transform="translate(386,12)">
        <rect x="0" y="0" width="92" height="128" rx="14" fill="rgba(255, 255, 255,0.06)" stroke="rgba(255, 255, 255,0.18)" />
        <rect x="12" y="14" width="68" height="22" rx="11" fill="rgba(255, 255, 255,0.12)" stroke="rgba(255,255,255,0.16)" />
        <rect x="22" y="22" width="6" height="6" rx="3" fill="rgba(255, 255, 255,0.85)" />
        <rect x="34" y="22" width="38" height="6" rx="2" fill="rgba(255,255,255,0.6)" />
        <rect x="12" y="46" width="68" height="32" rx="10" fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.13)" />
        <rect x="20" y="54" width="32" height="5" rx="1" fill="rgba(255,255,255,0.55)" />
        <rect x="20" y="63" width="50" height="3" rx="1" fill="rgba(255,255,255,0.32)" />
        <rect x="20" y="69" width="42" height="3" rx="1" fill="rgba(255,255,255,0.22)" />
        <rect x="12" y="86" width="32" height="14" rx="7" fill="rgba(255, 255, 255,0.42)" />
        <rect x="48" y="86" width="32" height="14" rx="7" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.16)" />
        <circle cx="20" cy="116" r="4" fill="rgba(255, 255, 255,0.85)" />
        <rect x="30" y="113" width="50" height="6" rx="2" fill="rgba(255,255,255,0.32)" />
      </g>
    </svg>
  );
}

export function BentoFramesGraphic() {
  /* Three device frames in proportional aspect ratios — desktop (16:10),
     tablet (4:3), mobile (9:16) — each with a header bar and content blocks. */
  return (
    <svg
      className="bento-graphic bento-graphic--frames"
      viewBox="0 0 480 160"
      role="img"
      aria-label="Three responsive frames: desktop, tablet, and mobile previews"
    >
      {/* Desktop — 16:10 */}
      <g transform="translate(8,12)">
        <rect x="0" y="0" width="220" height="138" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.16)" />
        <rect x="0" y="0" width="220" height="14" rx="6" fill="rgba(255,255,255,0.08)" />
        <circle cx="8" cy="7" r="2" fill="rgba(255,255,255,0.42)" />
        <circle cx="16" cy="7" r="2" fill="rgba(255,255,255,0.42)" />
        <circle cx="24" cy="7" r="2" fill="rgba(255,255,255,0.42)" />
        <rect x="10" y="22" width="56" height="100" rx="2" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" />
        <rect x="14" y="28" width="40" height="4" rx="1" fill="rgba(255,255,255,0.45)" />
        <rect x="14" y="38" width="36" height="3" rx="1" fill="rgba(255,255,255,0.22)" />
        <rect x="14" y="46" width="44" height="3" rx="1" fill="rgba(255,255,255,0.22)" />
        <rect x="14" y="54" width="38" height="3" rx="1" fill="rgba(255,255,255,0.22)" />
        <rect x="74" y="22" width="138" height="44" rx="3" fill="rgba(255, 255, 255,0.16)" stroke="rgba(255, 255, 255,0.32)" />
        <rect x="82" y="32" width="60" height="6" rx="2" fill="rgba(255,255,255,0.7)" />
        <rect x="82" y="44" width="100" height="3" rx="1" fill="rgba(255,255,255,0.4)" />
        <rect x="82" y="52" width="78" height="3" rx="1" fill="rgba(255,255,255,0.32)" />
        <rect x="74" y="74" width="42" height="48" rx="3" fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.1)" />
        <rect x="120" y="74" width="42" height="48" rx="3" fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.1)" />
        <rect x="166" y="74" width="46" height="48" rx="3" fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.1)" />
      </g>

      {/* Tablet — 4:3 */}
      <g transform="translate(244,18)">
        <rect x="0" y="0" width="120" height="126" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.16)" />
        <rect x="0" y="0" width="120" height="11" rx="8" fill="rgba(255,255,255,0.08)" />
        <rect x="50" y="3" width="20" height="5" rx="2" fill="rgba(255,255,255,0.36)" />
        <rect x="8" y="20" width="104" height="22" rx="3" fill="rgba(255, 255, 255,0.16)" stroke="rgba(255, 255, 255,0.32)" />
        <rect x="14" y="26" width="50" height="4" rx="1" fill="rgba(255,255,255,0.6)" />
        <rect x="14" y="34" width="78" height="2" rx="1" fill="rgba(255,255,255,0.32)" />
        <rect x="8" y="50" width="48" height="32" rx="3" fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.1)" />
        <rect x="60" y="50" width="52" height="32" rx="3" fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.1)" />
        <rect x="8" y="90" width="104" height="3" rx="1" fill="rgba(255,255,255,0.32)" />
        <rect x="8" y="98" width="84" height="3" rx="1" fill="rgba(255,255,255,0.22)" />
        <rect x="8" y="106" width="92" height="3" rx="1" fill="rgba(255,255,255,0.22)" />
        <rect x="8" y="114" width="64" height="6" rx="2" fill="rgba(255, 255, 255,0.5)" />
      </g>

      {/* Mobile — 9:16 */}
      <g transform="translate(388,12)">
        <rect x="0" y="0" width="74" height="138" rx="10" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.16)" />
        <rect x="22" y="3" width="30" height="3" rx="1" fill="rgba(255,255,255,0.36)" />
        <rect x="6" y="14" width="62" height="22" rx="4" fill="rgba(255, 255, 255,0.18)" stroke="rgba(255, 255, 255,0.34)" />
        <rect x="12" y="20" width="38" height="4" rx="1" fill="rgba(255,255,255,0.6)" />
        <rect x="12" y="28" width="50" height="2" rx="1" fill="rgba(255,255,255,0.32)" />
        <rect x="6" y="44" width="62" height="3" rx="1" fill="rgba(255,255,255,0.32)" />
        <rect x="6" y="52" width="48" height="3" rx="1" fill="rgba(255,255,255,0.22)" />
        <rect x="6" y="62" width="62" height="36" rx="3" fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.1)" />
        <rect x="11" y="68" width="36" height="3" rx="1" fill="rgba(255,255,255,0.45)" />
        <rect x="11" y="76" width="50" height="2" rx="1" fill="rgba(255,255,255,0.28)" />
        <rect x="11" y="82" width="40" height="2" rx="1" fill="rgba(255,255,255,0.28)" />
        <rect x="11" y="88" width="44" height="2" rx="1" fill="rgba(255,255,255,0.22)" />
        <rect x="6" y="106" width="62" height="20" rx="10" fill="rgba(255, 255, 255,0.55)" />
      </g>
    </svg>
  );
}

export function BentoHandoffGraphic() {
  /* Three file-format glyphs — React (atom), HTML (brackets), Vite (lightning) —
     each on a tinted card. */
  return (
    <svg
      className="bento-graphic bento-graphic--handoff"
      viewBox="0 0 480 160"
      role="img"
      aria-label="Three handoff-ready outputs: React, HTML, and Vite"
    >
      {/* React card — atom orbits */}
      <g transform="translate(20,16)">
        <rect x="0" y="0" width="138" height="128" rx="10" fill="rgba(255, 255, 255,0.08)" stroke="rgba(255, 255, 255,0.22)" />
        <g transform="translate(69,52)" stroke="rgba(255, 255, 255,0.85)" strokeWidth="1.6" fill="none">
          <ellipse cx="0" cy="0" rx="32" ry="12" />
          <ellipse cx="0" cy="0" rx="32" ry="12" transform="rotate(60)" />
          <ellipse cx="0" cy="0" rx="32" ry="12" transform="rotate(-60)" />
          <circle cx="0" cy="0" r="4" fill="rgba(255, 255, 255,1)" stroke="none" />
        </g>
        <rect x="42" y="100" width="54" height="6" rx="2" fill="rgba(255, 255, 255,0.85)" />
        <rect x="48" y="112" width="42" height="3" rx="1" fill="rgba(255,255,255,0.4)" />
      </g>

      {/* HTML card — angle brackets */}
      <g transform="translate(170,16)">
        <rect x="0" y="0" width="138" height="128" rx="10" fill="rgba(255, 255, 255,0.08)" stroke="rgba(255, 255, 255,0.22)" />
        <g transform="translate(69,52)" stroke="rgba(255, 255, 255,0.92)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="-22,-14 -38,0 -22,14" />
          <polyline points="22,-14 38,0 22,14" />
          <line x1="-8" y1="16" x2="8" y2="-16" stroke="rgba(255,255,255,0.55)" strokeWidth="2.4" />
        </g>
        <rect x="42" y="100" width="54" height="6" rx="2" fill="rgba(255, 255, 255,0.85)" />
        <rect x="48" y="112" width="42" height="3" rx="1" fill="rgba(255,255,255,0.4)" />
      </g>

      {/* Vite card — lightning bolt */}
      <g transform="translate(322,16)">
        <rect x="0" y="0" width="138" height="128" rx="10" fill="rgba(255, 255, 255,0.08)" stroke="rgba(255, 255, 255,0.22)" />
        <g transform="translate(69,52)">
          <path
            d="M -10 -28 L 14 -28 L 4 -4 L 18 -4 L -10 30 L 0 4 L -14 4 Z"
            fill="rgba(255, 255, 255,0.92)"
            stroke="rgba(255,255,255,0.32)"
            strokeWidth="0.8"
          />
        </g>
        <rect x="42" y="100" width="54" height="6" rx="2" fill="rgba(255, 255, 255,0.92)" />
        <rect x="48" y="112" width="42" height="3" rx="1" fill="rgba(255,255,255,0.4)" />
      </g>
    </svg>
  );
}

export function BentoReviewGraphic() {
  /* Preview window with three tabs (Preview/Notes/Export) and an annotation
     pin to convey the "review room" idea. */
  return (
    <svg
      className="bento-graphic bento-graphic--review"
      viewBox="0 0 480 160"
      role="img"
      aria-label="Private review room with preview, notes, and export tabs plus a comment annotation"
    >
      {/* Window frame */}
      <g transform="translate(20,12)">
        <rect x="0" y="0" width="440" height="136" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.16)" />

        {/* Top bar */}
        <rect x="0" y="0" width="440" height="18" rx="8" fill="rgba(255,255,255,0.06)" />
        <circle cx="10" cy="9" r="2.5" fill="rgba(255,255,255,0.45)" />
        <circle cx="20" cy="9" r="2.5" fill="rgba(255,255,255,0.45)" />
        <circle cx="30" cy="9" r="2.5" fill="rgba(255,255,255,0.45)" />
        <rect x="180" y="6" width="80" height="6" rx="2" fill="rgba(255,255,255,0.32)" />

        {/* Tab strip */}
        <rect x="0" y="18" width="440" height="20" fill="rgba(255,255,255,0.025)" />
        <rect x="20" y="22" width="56" height="14" rx="3" fill="rgba(255, 255, 255,0.22)" stroke="rgba(255, 255, 255,0.42)" />
        <rect x="34" y="27" width="28" height="4" rx="1" fill="rgba(255,255,255,0.85)" />
        <rect x="86" y="27" width="28" height="4" rx="1" fill="rgba(255,255,255,0.36)" />
        <rect x="124" y="27" width="28" height="4" rx="1" fill="rgba(255,255,255,0.36)" />

        {/* Canvas content */}
        <rect x="20" y="50" width="240" height="76" rx="4" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" />
        <rect x="30" y="60" width="60" height="6" rx="2" fill="rgba(255,255,255,0.55)" />
        <rect x="30" y="72" width="120" height="3" rx="1" fill="rgba(255,255,255,0.32)" />
        <rect x="30" y="80" width="100" height="3" rx="1" fill="rgba(255,255,255,0.22)" />
        <rect x="30" y="92" width="36" height="14" rx="3" fill="rgba(255, 255, 255,0.45)" />
        <rect x="72" y="92" width="36" height="14" rx="3" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.16)" />

        {/* Notes side panel */}
        <rect x="276" y="50" width="148" height="76" rx="4" fill="rgba(255, 255, 255,0.08)" stroke="rgba(255, 255, 255,0.22)" />
        <rect x="284" y="60" width="50" height="5" rx="1" fill="rgba(255, 255, 255,0.85)" />
        <rect x="284" y="72" width="120" height="3" rx="1" fill="rgba(255,255,255,0.32)" />
        <rect x="284" y="80" width="106" height="3" rx="1" fill="rgba(255,255,255,0.22)" />
        <rect x="284" y="92" width="92" height="3" rx="1" fill="rgba(255,255,255,0.22)" />
        <circle cx="288" cy="116" r="4" fill="rgba(255, 255, 255,0.85)" />
        <rect x="298" y="113" width="80" height="6" rx="2" fill="rgba(255,255,255,0.32)" />

        {/* Annotation pin on canvas */}
        <g transform="translate(160,82)">
          <circle r="11" fill="rgba(255, 255, 255,0.92)" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
          <text textAnchor="middle" y="3.5" fontSize="10" fontWeight="700" fill="#0b1322">3</text>
        </g>
      </g>
    </svg>
  );
}

export function getBentoGraphic(key: string) {
  switch (key) {
    case "systems":
      return <BentoSystemsGraphic />;
    case "frames":
      return <BentoFramesGraphic />;
    case "handoff":
      return <BentoHandoffGraphic />;
    case "review":
      return <BentoReviewGraphic />;
    default:
      return null;
  }
}
