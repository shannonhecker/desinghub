/**
 * One place for the three things every library surface must agree on:
 * whether the active system is in dark mode, how the mode toggle flips it,
 * and the query the Workbench reads on arrival. The UI kit shell and the
 * standalone tool pages both read these, so the mode toggle and the builder
 * link behave the same wherever they are pressed.
 */
import { useDesignHub, type SystemId } from "@/store/useDesignHub";

type HubState = ReturnType<typeof useDesignHub.getState>;

/** Display order used by every system switcher in the library. */
export const KIT_SYSTEMS: SystemId[] = ["salt", "m3", "fluent", "uoaui", "carbon"];

export function isDarkActive(s: HubState): boolean {
  switch (s.activeSystem) {
    case "salt": return s.salt.themeKey.includes("dark");
    case "m3": return s.m3.themeKey === "custom" ? s.m3.isDarkCustom : s.m3.themeKey.startsWith("dark");
    case "uoaui": return s.uoaui.themeKey === "dark";
    case "carbon": return s.carbon.themeKey === "g90" || s.carbon.themeKey === "g100";
    default: return s.fluent.themeKey === "dark";
  }
}

/** Flip the active system between its light and dark theme, keeping the
    palette family (a Salt legacy theme stays legacy, an M3 custom colour
    stays custom). */
export function toggleActiveMode(): void {
  const s = useDesignHub.getState();
  switch (s.activeSystem) {
    case "salt": {
      const key = s.salt.themeKey;
      s.setSaltTheme(key.includes("dark") ? key.replace("dark", "light") : key.replace("light", "dark"));
      return;
    }
    case "m3":
      if (s.m3.themeKey === "custom") s.setM3DarkCustom(!s.m3.isDarkCustom);
      else s.setM3Theme(s.m3.themeKey.startsWith("dark") ? "light" : "dark");
      return;
    case "uoaui":
      s.setUoauiTheme(s.uoaui.themeKey === "dark" ? "light" : "dark");
      return;
    case "carbon": {
      /* white and g100 are the canonical pair; g10 / g90 are picked
         explicitly in the theme controls. */
      const k = s.carbon.themeKey;
      s.setCarbonTheme(k === "g100" || k === "g90" ? "white" : "g100");
      return;
    }
    default:
      s.setFluentTheme(s.fluent.themeKey === "dark" ? "light" : "dark");
  }
}

/** Workbench link carrying the system, mode, density and theme in view. */
export function builderHrefFor(s: HubState): string {
  const ds = s.activeSystem;
  const mode = isDarkActive(s) ? "dark" : "light";
  const themeKey =
    ds === "salt" ? s.salt.themeKey :
    ds === "m3" ? s.m3.themeKey :
    ds === "fluent" ? s.fluent.themeKey :
    ds === "carbon" ? s.carbon.themeKey :
    s.uoaui.themeKey;
  const density =
    ds === "salt" ? s.salt.density :
    ds === "fluent" ? s.fluent.size :
    ds === "carbon" ? s.carbon.density :
    ds === "uoaui" ? s.uoaui.density :
    String(s.m3.density);
  return `/builder?ds=${ds}&mode=${mode}&density=${encodeURIComponent(density)}&themeKey=${encodeURIComponent(themeKey)}`;
}
