"use client";

import { useBuilder, type DesignSystem, type BuilderMode } from "@/store/useBuilder";

/* Compact DS / mode / density quick-controls for the Builder top-bar.
   Surfaces the same controls UI Kit puts in its sidebar so users don't
   need to open SettingsPanel for routine switches. SettingsPanel still
   owns full per-DS theme-key + accent color + interface-type pickers. */

const SYSTEMS: { value: DesignSystem; label: string }[] = [
  { value: "salt", label: "Salt" },
  { value: "m3", label: "Material 3" },
  { value: "fluent", label: "Fluent 2" },
  { value: "carbon", label: "Carbon" },
  { value: "ausos", label: "ausos" },
];

/* Density options vary per DS but all map to a string. UI Kit exposes
   per-DS-named keys (jpm-light/g100/etc.); Builder operates on a single
   density string so we keep three universal buckets that map cleanly:
   "compact", "medium", and "spacious" line up with Carbon's three tiers
   and provide reasonable defaults for the others. */
const DENSITIES: { value: string; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "medium", label: "Medium" },
  { value: "spacious", label: "Spacious" },
];

export function BuilderThemeMenu() {
  const designSystem = useBuilder((s) => s.designSystem);
  const mode = useBuilder((s) => s.mode);
  const density = useBuilder((s) => s.density);
  const setDesignSystem = useBuilder((s) => s.setDesignSystem);
  const setMode = useBuilder((s) => s.setMode);
  const setDensity = useBuilder((s) => s.setDensity);

  const isDark = mode === "dark";

  return (
    <div className="builder-theme-menu" aria-label="Theme quick controls">
      <select
        className="builder-theme-menu__select"
        value={designSystem}
        onChange={(e) => setDesignSystem(e.target.value as DesignSystem)}
        aria-label="Design system"
        title="Design system"
      >
        {SYSTEMS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="builder-theme-menu__mode"
        onClick={() => setMode((isDark ? "light" : "dark") as BuilderMode)}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">
          {isDark ? "light_mode" : "dark_mode"}
        </span>
      </button>

      <select
        className="builder-theme-menu__select"
        value={DENSITIES.some((d) => d.value === density) ? density : "medium"}
        onChange={(e) => setDensity(e.target.value)}
        aria-label="Density"
        title="Density"
      >
        {DENSITIES.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </select>
    </div>
  );
}
