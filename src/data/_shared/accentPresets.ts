/**
 * Per-DS accent preset swatches. Each DS exposes 5 brand-aligned
 * options that one-click into `colorOverrides.accent`. The native
 * `<input type="color">` in SettingsPanel still works as a custom
 * fallback for any other hex.
 *
 * Active swatch is matched on hex; case-insensitive comparison
 * recommended at the call site.
 */

import type { DesignSystem } from "@/store/useBuilder";

export interface AccentPreset {
  hex: string;
  label: string;
}

export const ACCENT_PRESETS: Record<DesignSystem, AccentPreset[]> = {
  salt: [
    { hex: "#1B7F9E", label: "JPM teal" },
    { hex: "#0078CF", label: "Legacy blue" },
    { hex: "#2E7D32", label: "Success green" },
    { hex: "#C62828", label: "Alert red" },
    { hex: "#5E35B1", label: "Purple" },
  ],
  m3: [
    { hex: "#6750A4", label: "Purple" },
    { hex: "#0061A4", label: "Blue" },
    { hex: "#386A20", label: "Green" },
    { hex: "#984061", label: "Pink" },
    { hex: "#A23F23", label: "Red" },
  ],
  fluent: [
    { hex: "#0F6CBD", label: "MS blue" },
    { hex: "#107C10", label: "Green" },
    { hex: "#D13438", label: "Red" },
    { hex: "#8764B8", label: "Purple" },
    { hex: "#0099BC", label: "Teal" },
  ],
  carbon: [
    { hex: "#0F62FE", label: "IBM blue" },
    { hex: "#198038", label: "Green" },
    { hex: "#DA1E28", label: "Red" },
    { hex: "#8A3FFC", label: "Purple" },
    { hex: "#FA4D56", label: "Magenta" },
  ],
  ausos: [
    { hex: "#7E6BC4", label: "Aurora violet" },
    { hex: "#5EE7DF", label: "Mint" },
    { hex: "#F78AB8", label: "Rose" },
    { hex: "#FFAD5C", label: "Amber" },
    { hex: "#94B0FF", label: "Sky" },
  ],
};

/* CSS-var name per DS for the primary accent. Used by the BuilderApp
   accent injector so a single override paints into the right token. */
export const ACCENT_VAR_BY_DS: Record<DesignSystem, string> = {
  salt: "--salt-palette-accent",
  m3: "--md-sys-color-primary",
  fluent: "--colorBrandBackground",
  carbon: "--cds-interactive",
  ausos: "--a-accent",
};

/* Per-DS lookup key into `colorOverrides` for the primary accent.
   Mirrors the first entry of each DS's COLOR_KEYS row in SettingsPanel. */
export const ACCENT_KEY_BY_DS: Record<DesignSystem, string> = {
  salt: "accent",
  m3: "primary",
  fluent: "brandBg",
  carbon: "accent",
  ausos: "accent",
};
