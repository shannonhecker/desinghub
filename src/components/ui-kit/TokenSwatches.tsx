"use client";

/**
 * TokenSwatches (W8-P5) — the per-DS design-token table, in the spirit of the
 * m3.material.io token tables.
 *
 * Reads COMPONENT_TOKENS[activeSystem][id] from src/data/ui-kit-meta.ts (an
 * authored, per-component list of the real CSS custom properties that drive the
 * component) and renders three columns: a live swatch chip, the token name, and
 * the LIVE getComputedStyle-resolved value.
 *
 * The resolved value is read off a probe element that is mounted INSIDE the DS
 * style scope (the same wrapper the Specimen renders into), because the DS CSS
 * string injected per preview declares these custom properties on a scoped
 * selector — `:root` resolution in the document head would miss them. The probe
 * ref is forwarded by the caller via the `scopeRef` prop.
 *
 * Recomputed via useMemo keyed on the live theme css + system + density so the
 * resolved values update when the user switches mode / theme / density. We also
 * re-read on mount (the probe must exist in the DOM first).
 *
 * Owner decision (locked): per-component authored token list + live
 * getComputedStyle-resolved values. Not color-only — the token name + resolved
 * string carry the value; the chip is supplementary.
 */

import React from "react";
import type { ActiveTheme } from "@/contexts/ThemeContext";
import type { TokenSwatch } from "@/data/ui-kit-meta";

interface TokenSwatchesProps {
  tokens: TokenSwatch[];
  t: ActiveTheme;
  /** A ref to an element inside the DS style scope, used to resolve the tokens. */
  scopeRef: React.RefObject<HTMLElement | null>;
}

interface ResolvedSwatch extends TokenSwatch {
  /** The live getComputedStyle value, or "" when it does not resolve. */
  value: string;
}

/** True when a resolved value looks like a paintable color (so we show a chip). */
function isColorish(value: string): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return (
    v.startsWith("#") ||
    v.startsWith("rgb") ||
    v.startsWith("hsl") ||
    v.startsWith("oklch") ||
    v.startsWith("oklab") ||
    v.startsWith("color(") ||
    v.startsWith("linear-gradient") ||
    v.startsWith("radial-gradient")
  );
}

export function TokenSwatches({ tokens, t, scopeRef }: TokenSwatchesProps) {
  /* Mount tick: forces a recompute on first client paint, once the scoped probe
     element is actually in the DOM (getComputedStyle needs a live node). */
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    setTick((x) => x + 1);
  }, []);

  /* Resolve every token's live value off the scoped probe. useMemo keyed on the
     theme css + system + density (t.css changes whenever mode/theme/density
     changes) so the table refreshes with the theme; `tick` re-runs once mounted. */
  const resolved: ResolvedSwatch[] = React.useMemo(() => {
    const probe = scopeRef.current;
    if (typeof window === "undefined" || !probe) {
      return tokens.map((s) => ({ ...s, value: "" }));
    }
    const cs = window.getComputedStyle(probe);
    return tokens.map((s) => ({
      ...s,
      value: cs.getPropertyValue(s.token).trim(),
    }));
    // t.css / activeSystem / densityOrSize drive the injected DS variables.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, scopeRef, tick, t.css, t.activeSystem, t.densityOrSize]);

  if (!tokens || tokens.length === 0) return null;

  return (
    <div className="dh-detail-card" style={{ borderColor: t.border, background: t.bg2 }}>
      <table className="dh-tokens" style={{ fontFamily: t.font }}>
        <thead>
          <tr>
            <th scope="col" className="dh-tokens-h dh-tokens-h-swatch" style={{ color: t.fg3 }}>
              Sample
            </th>
            <th scope="col" className="dh-tokens-h" style={{ color: t.fg3 }}>
              Token · role
            </th>
            <th scope="col" className="dh-tokens-h dh-tokens-h-value" style={{ color: t.fg3 }}>
              Resolved value
            </th>
          </tr>
        </thead>
        <tbody>
          {resolved.map((s) => {
            const colorish = isColorish(s.value);
            return (
              <tr key={s.token}>
                <td className="dh-tokens-cell">
                  <span
                    className="dh-token-chip"
                    aria-hidden="true"
                    style={{
                      borderColor: t.borderSubtle,
                      background: colorish
                        ? s.value
                        : "transparent",
                    }}
                  >
                    {!colorish && (
                      <span className="dh-token-chip-na" style={{ color: t.fg3 }}>
                        —
                      </span>
                    )}
                  </span>
                </td>
                <td className="dh-tokens-cell">
                  <code className="dh-token-name" style={{ color: t.accentText }}>
                    {s.token}
                  </code>
                  <span className="dh-token-role" style={{ color: t.fg3 }}>
                    {s.role}
                  </span>
                </td>
                <td className="dh-tokens-cell dh-tokens-value">
                  <code
                    className="dh-token-value"
                    style={{ color: s.value ? t.fg2 : t.fg3 }}
                  >
                    {s.value || "unresolved"}
                  </code>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
