import type { ActiveTheme } from "@/contexts/ThemeContext";

/**
 * C2 PER-DS STAGE COLORS — one source of truth for the /ui-kit stage tint.
 *
 * Each design system gets its own surface/stage background so the page reads
 * like that system's real docs site (m3.material.io tonal surface, Carbon's
 * flat seam-matched canvas, an aurora wash for uoaui, restrained neutral
 * greys for Salt/Fluent). Consumed by DesignHubApp (shell <main> + outer
 * wrapper) and LandingGrid (landing root) so the shell and the landing never
 * disagree on the stage colour.
 *
 * Every value is derived from the active theme's tokens — no raw hex here.
 * uoaui returns "transparent" on purpose so the app-level aurora gradient
 * shows through; setting an opaque bg there would kill the aurora.
 */
export function getStageBg(t: ActiveTheme): string {
  switch (t.activeSystem) {
    case "uoaui":
      // Keep transparent so the gradient wrapper behind the shell shows.
      return "transparent";
    case "m3":
      // M3 tonal surface — one tonal step up from the base surface.
      return (t.T.surfaceContainerLow as string) ?? t.bg2;
    case "carbon":
      // Carbon canvas is seam-matched (no step between shell and stage).
      return t.bg;
    case "salt":
    case "fluent":
    default:
      // Restrained neutral grey: a hair of the foreground mixed into the base
      // so the stage reads as a deliberate surface, not flat white/black.
      return `color-mix(in srgb, ${t.fg} 3%, ${t.bg})`;
  }
}

/**
 * Icon-rail surface. Mirrors the per-DS sidebar background logic the old
 * <aside> used: Carbon sits at $layer-01, M3 at its low tonal container,
 * uoaui stays transparent over the aurora, everyone else uses the base bg.
 */
export function getRailBg(t: ActiveTheme): string {
  switch (t.activeSystem) {
    case "uoaui":
      return "transparent";
    case "m3":
      return t.bg2;
    case "carbon":
      return (t.T.layer01 as string) ?? t.bg;
    default:
      return t.bg;
  }
}

/**
 * Secondary-panel surface. Matches the old <aside> per-DS fill exactly so the
 * panel that slides out of the rail looks identical to the prior sidebar.
 */
export function getPanelBg(t: ActiveTheme): string {
  switch (t.activeSystem) {
    case "uoaui":
      return "transparent";
    case "m3":
      return t.bg2;
    case "carbon":
      return (t.T.layer01 as string) ?? t.bg;
    default:
      return t.bg;
  }
}
