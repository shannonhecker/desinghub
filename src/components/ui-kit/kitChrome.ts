/**
 * Library chrome tokens, layer 1 of 3: PRIMITIVES.
 *
 * The primitives are not invented here. They are the active design system's
 * own tokens (its canvas, text, accent, focus colour, typeface, corner),
 * handed to CSS as --kp-* custom properties. kit-chrome.css turns them into
 * one semantic layer (--kit-surface, --kit-text, ...) and then into component
 * tokens for the card, stage, rail and code block. Nothing below this file
 * names a system or holds a colour literal.
 */
import type { CSSProperties } from "react";
import type { ActiveTheme } from "@/contexts/ThemeContext";
import { getStageBg } from "./stageTint";

export function kitPrimitives(t: ActiveTheme, dark: boolean): CSSProperties {
  const sys = t.activeSystem;
  /* The raised surface is one tonal step from the ground it sits on: in
     light, the system's white canvas on the tinted stage; in dark, a lighter
     step (tone, not shadow). Each system supplies its own step where it has
     one (Material's container ramp, Carbon's layer, uoaui's glass). */
  const raised =
    sys === "uoaui" ? ((t.T.cardBg as string) ?? t.bg2)
    : sys === "carbon" ? ((t.T.layer01 as string) ?? t.bg2)
    : sys === "m3" ? (dark ? ((t.T.surfaceContainerHigh as string) ?? t.bg3) : ((t.T.surfaceContainerLowest as string) ?? t.bg))
    : dark ? `color-mix(in srgb, ${t.fg} 6%, ${t.bg})` : t.bg;
  const fill = sys === "carbon" ? ((t.T.buttonPrimary as string) ?? t.accent) : t.accent;
  const fillFg = sys === "carbon" ? ((t.T.textOnColor as string) ?? t.accentFg) : t.accentFg;
  return {
    "--kp-canvas": t.bg,
    "--kp-ground": getStageBg(t) === "transparent" ? "transparent" : getStageBg(t),
    "--kp-raised": raised,
    "--kp-text": t.fg,
    "--kp-text-2": t.fg2,
    "--kp-accent": fill,
    "--kp-accent-on": fillFg,
    "--kp-accent-text": t.accentText,
    "--kp-focus": t.focusRing,
    "--kp-font": t.font,
    "--kp-corner": sys === "carbon" ? "0px" : sys === "m3" ? "16px" : sys === "uoaui" ? "14px" : "8px",
    "--kp-corner-control": sys === "carbon" ? "0px" : sys === "m3" ? "20px" : sys === "uoaui" ? "10px" : "4px",
    "--kp-glass": sys === "uoaui" ? ((t.T.glass as string) ?? "none") : "none",
    "--kp-lift": dark ? "0" : "1",
    "--kp-title-weight": sys === "salt" ? "700" : sys === "carbon" ? "300" : "500",
  } as CSSProperties;
}
