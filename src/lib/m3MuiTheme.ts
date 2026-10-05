/**
 * m3MuiTheme - the app's Material 3 theme for MUI. One source of truth.
 *
 * MUI's default theme is Material 2: blue, upper-case, 4px corners. Every
 * place that draws Material 3 with MUI components reads this module
 * instead, so the builder canvas, Present, shared previews, the FX dialogs
 * and menus, the inspector's controls, the UI library and the exported
 * React code are the same Material 3:
 *
 *   - colour roles from the app's own M3 tokens (src/data/m3/themes.ts):
 *     primary with its on-primary, the surface ladder, outline;
 *   - shape: fully rounded buttons, 4px text fields, 8px chips, 12px cards,
 *     28px dialogs;
 *   - type: Roboto, sentence-case labels at weight 500;
 *   - state layers at Material's opacities (hover 8%, focus and press 10%,
 *     selected 12%, disabled 38% on 12%).
 *
 * Two fits, one theme:
 *
 *   "slot" (default)  the builder. Its templates hold every block within a
 *                     pixel across five design systems, so controls keep the
 *                     sizes MUI gives them for the builder's density (see
 *                     densitySize.ts). The theme changes colour, corner,
 *                     case, typeface and state only; it never sets a
 *                     height, a width, a padding or a font size.
 *   "spec"            the UI library. Controls take Material's own sizes
 *                     (40px button, 52 by 32 switch, 32px chip), as the
 *                     library's Material pages draw them.
 *
 * The options are plain data (no functions), so the export can write the
 * same theme into the code it hands over (m3ThemeSource).
 */

import { createTheme, type Theme, type ThemeOptions } from "@mui/material/styles";
import { THEMES } from "@/data/m3/themes";
import { coerceDensity, muiSize, muiSize2, type DensityLevel } from "@/lib/densitySize";

export type M3Mode = "light" | "dark";
export type M3Fit = "slot" | "spec";
export type M3Tokens = Record<string, unknown>;

export interface M3ThemeArgs {
  mode: M3Mode;
  /** The builder's density level; becomes MUI's default `size` props. */
  density?: DensityLevel | string;
  /** A token set to use instead of the app's baseline for `mode` (the UI
   *  library passes its own, which may carry a custom colour). */
  tokens?: M3Tokens;
  fit?: M3Fit;
}

const ROLE_KEYS = [
  "primary", "onPrimary", "primaryContainer", "onPrimaryContainer",
  "secondary", "onSecondary", "secondaryContainer", "onSecondaryContainer",
  "tertiary", "tertiaryContainer", "onTertiaryContainer",
  "error", "onError", "errorContainer", "onErrorContainer",
  "surface", "surfaceContainerLowest", "surfaceContainerLow", "surfaceContainer",
  "surfaceContainerHigh", "surfaceContainerHighest",
  "onSurface", "onSurfaceVariant", "outline", "outlineVariant",
  "inverseSurface", "inverseOnSurface", "inversePrimary",
] as const;
export type M3Role = (typeof ROLE_KEYS)[number];
export type M3Roles = Record<M3Role, string>;

/** Material's state-layer opacities. */
export const M3_STATE = { hover: 0.08, focus: 0.1, pressed: 0.1, selected: 0.12, disabled: 0.38, disabledContainer: 0.12 } as const;
export const M3_FONT = "Roboto, sans-serif";
/** Material's shape scale, in px. */
export const M3_SHAPE = { extraSmall: 4, small: 8, medium: 12, extraLarge: 28, full: 9999 } as const;

const isHex = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);

/** Every colour role for `mode`: the passed token where it is a colour, the
 *  app's baseline token otherwise. */
export function m3Roles(mode: M3Mode, tokens?: M3Tokens): M3Roles {
  const base = THEMES[mode === "dark" ? "dark" : "light"] as Record<string, string>;
  const out = {} as M3Roles;
  for (const key of ROLE_KEYS) out[key] = isHex(tokens?.[key]) ? (tokens![key] as string) : base[key];
  return out;
}

function rgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

/** A state layer: `on` at `opacity` over `base`, as one opaque colour. */
export function stateLayer(base: string, on: string, opacity: number): string {
  const b = rgb(base);
  const o = rgb(on);
  return `#${b.map((v, i) => Math.round(v + (o[i] - v) * opacity).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/** A role at an opacity, for a layer over whatever is behind it. */
export function withAlpha(hex: string, opacity: number): string {
  const [r, g, b] = rgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/** The MUI palette for the roles. Shared by the component theme below and by
 *  the builder's `--mui-*` token sheet (officialM3FluentTokens.ts), so the
 *  canvas around a component and the component agree. */
export function m3Palette(mode: M3Mode, roles: M3Roles) {
  return {
    mode,
    primary: { main: roles.primary, dark: stateLayer(roles.primary, roles.onPrimary, M3_STATE.hover), contrastText: roles.onPrimary },
    secondary: { main: roles.secondary, dark: stateLayer(roles.secondary, roles.onSecondary, M3_STATE.hover), contrastText: roles.onSecondary },
    error: { main: roles.error, dark: stateLayer(roles.error, roles.onError, M3_STATE.hover), contrastText: roles.onError },
    background: { default: roles.surface, paper: roles.surfaceContainerLow },
    text: { primary: roles.onSurface, secondary: roles.onSurfaceVariant, disabled: withAlpha(roles.onSurface, M3_STATE.disabled) },
    divider: roles.outlineVariant,
    action: {
      active: roles.onSurfaceVariant,
      hover: withAlpha(roles.onSurface, M3_STATE.hover),
      hoverOpacity: M3_STATE.hover,
      selected: withAlpha(roles.onSurface, M3_STATE.selected),
      selectedOpacity: M3_STATE.selected,
      focus: withAlpha(roles.onSurface, M3_STATE.focus),
      focusOpacity: M3_STATE.focus,
      activatedOpacity: M3_STATE.pressed,
      disabled: withAlpha(roles.onSurface, M3_STATE.disabled),
      disabledBackground: withAlpha(roles.onSurface, M3_STATE.disabledContainer),
      disabledOpacity: M3_STATE.disabled,
    },
  };
}

/* ── "slot": the builder. Colour, corner, case and state; never a size. ── */
function slotOptions(mode: M3Mode, density: DensityLevel, roles: M3Roles): ThemeOptions {
  const size3 = muiSize(density);
  const size2 = muiSize2(density);
  const tonal = {
    backgroundColor: roles.secondaryContainer,
    color: roles.onSecondaryContainer,
    "&:hover": { backgroundColor: stateLayer(roles.secondaryContainer, roles.onSecondaryContainer, M3_STATE.hover) },
  };
  return {
    palette: m3Palette(mode, roles),
    shape: { borderRadius: M3_SHAPE.medium },
    typography: { fontFamily: M3_FONT, button: { textTransform: "none", fontWeight: 500, letterSpacing: "0.1px" } },
    components: {
      MuiButton: {
        defaultProps: { size: size3, disableElevation: true },
        styleOverrides: {
          root: { borderRadius: M3_SHAPE.full },
          outlined: { borderColor: roles.outline },
        },
      },
      MuiCheckbox: { defaultProps: { size: size3 } },
      MuiToggleButtonGroup: { defaultProps: { size: size3 } },
      /* Material's segmented button: one outlined, fully rounded group whose
         chosen segment is the secondary container. */
      MuiToggleButton: {
        styleOverrides: {
          root: {
            borderRadius: M3_SHAPE.full,
            borderColor: roles.outline,
            color: roles.onSurface,
            "&.Mui-selected": tonal,
          },
        },
      },
      MuiTextField: { defaultProps: { size: size2, variant: "outlined" } },
      MuiFormControl: { defaultProps: { size: size2 } },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: M3_SHAPE.extraSmall }, notchedOutline: { borderColor: roles.outline } } },
      /* The underlined (standard) field: Material's active indicator. */
      MuiInput: { styleOverrides: { underline: { "&::before": { borderBottomColor: roles.onSurfaceVariant } } } },
      MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: "none", borderRadius: M3_SHAPE.medium } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: M3_SHAPE.extraLarge, backgroundColor: roles.surfaceContainerHigh } } },
      /* Headline, not a bold title: Material sets dialog headlines at 400. */
      MuiDialogTitle: { styleOverrides: { root: { fontWeight: 400 } } },
      MuiMenu: { styleOverrides: { paper: { borderRadius: M3_SHAPE.extraSmall, backgroundColor: roles.surfaceContainer } } },
      MuiMenuItem: { styleOverrides: { root: { "&.Mui-selected": tonal, "&.Mui-selected.Mui-focusVisible": tonal["&:hover"] } } },
      MuiListItemButton: { styleOverrides: { root: { borderRadius: M3_SHAPE.full, "&.Mui-selected": tonal } } },
      MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: "3px 3px 0 0" } } },
      MuiTableCell: { styleOverrides: { root: { borderBottomColor: roles.outlineVariant } } },
      MuiAvatar: { styleOverrides: { colorDefault: { backgroundColor: roles.primaryContainer, color: roles.onPrimaryContainer } } },
      MuiLinearProgress: { styleOverrides: { root: { borderRadius: M3_SHAPE.full, backgroundColor: roles.secondaryContainer }, bar: { borderRadius: M3_SHAPE.full } } },
      /* The switch's track now reaches the edge of MUI's box, so the label
         needs neither MUI's negative margin (which offset the old padding)
         nor to touch the track. Only a label that holds a switch. */
      MuiFormControlLabel: {
        styleOverrides: {
          root: {
            "&:has(.MuiSwitch-root)": { marginLeft: -3 },
            "&:has(.MuiSwitch-sizeSmall)": { marginLeft: 0 },
            "& .MuiSwitch-root": { marginRight: 9 },
            "& .MuiSwitch-sizeSmall": { marginRight: 10 },
          },
        },
      },
      /* Material's chip: 8px corner, outlined on the surface. The height and
         label padding stay MUI's (32 medium, 24 small). */
      MuiChip: {
        defaultProps: { size: size2 },
        styleOverrides: {
          root: {
            borderRadius: M3_SHAPE.small,
            fontWeight: 500,
            variants: [{
              props: { color: "default" },
              style: { backgroundColor: "transparent", border: `1px solid ${roles.outline}`, color: roles.onSurfaceVariant },
            }],
          },
        },
      },
      /* Material's switch inside MUI's box. MUI's medium root is 58 by 38:
         3px of padding leaves exactly Material's 52 by 32 track, with the
         16px handle off and the 24px handle on. MUI's small root is 40 by
         24: the track fills it and the handle is 12 off, 18 on (the same
         drawing at three quarters). The handle's travel is MUI's own (20,
         small 16), which is exactly Material's, so nothing here moves it.
         The box, and so the row, keeps its size. */
      MuiSwitch: {
        defaultProps: { size: size2 },
        styleOverrides: {
          root: {
            padding: 3,
            overflow: "visible",
            "& .MuiSwitch-switchBase": { padding: 4, top: 3, left: 3, color: roles.outline },
            "& .MuiSwitch-switchBase.Mui-checked": { color: roles.onPrimary },
            "& .MuiSwitch-switchBase.Mui-disabled": { color: withAlpha(roles.onSurface, M3_STATE.disabled) },
            "& .MuiSwitch-switchBase.Mui-checked.Mui-disabled": { color: roles.surface },
            "& .MuiSwitch-thumb": { width: 16, height: 16, margin: 4, boxShadow: "none", backgroundColor: "currentColor" },
            "& .MuiSwitch-switchBase.Mui-checked .MuiSwitch-thumb": { width: 24, height: 24, margin: 0 },
            "& .MuiSwitch-track": { boxSizing: "border-box", borderRadius: M3_SHAPE.full, backgroundColor: roles.surfaceContainerHighest, border: `2px solid ${roles.outline}`, opacity: 1 },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: roles.primary, borderColor: roles.primary, opacity: 1 },
            "& .MuiSwitch-switchBase.Mui-disabled + .MuiSwitch-track": { opacity: M3_STATE.disabled },
            variants: [{
              props: { size: "small" },
              style: {
                padding: 0,
                "& .MuiSwitch-switchBase": { padding: 3, top: 0, left: 0 },
                "& .MuiSwitch-thumb": { width: 12, height: 12, margin: 3 },
                "& .MuiSwitch-switchBase.Mui-checked .MuiSwitch-thumb": { width: 18, height: 18, margin: 0 },
              },
            }],
          },
        },
      },
      MuiTable: { defaultProps: { size: size2 } },
    },
  };
}

/* ── "spec": the UI library. Material's own sizes. This is the theme the
   library has always drawn; its key order is part of what it renders (the
   style engine names classes from it), so it is kept as written. ── */
function specOptions(mode: M3Mode, density: DensityLevel, k: M3Tokens): ThemeOptions {
  const size3 = muiSize(density);
  const size2 = muiSize2(density);
  const c = (key: string): string | undefined => {
    const v = k[key];
    return typeof v === "string" ? v : undefined;
  };
  return {
    palette: {
      mode,
      primary: { main: c("primary")!, contrastText: c("onPrimary") },
      secondary: { main: c("secondary") ?? c("primary")!, contrastText: c("onSecondary") },
      error: { main: c("error") ?? "#B3261E", contrastText: c("onError") },
      background: { default: c("surface"), paper: c("surfaceContainerLow") ?? c("surface") },
      text: { primary: c("onSurface"), secondary: c("onSurfaceVariant") },
      divider: c("outlineVariant"),
    },
    shape: { borderRadius: 12 },
    typography: { fontFamily: M3_FONT, button: { textTransform: "none", fontWeight: 500, letterSpacing: "0.1px" } },
    components: {
      MuiButton: {
        defaultProps: { size: size3, disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 9999, height: 40, padding: "0 24px", fontSize: 14 },
          outlined: { borderColor: c("outline") },
          text: { color: c("primary") },
        },
      },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 4 }, notchedOutline: { borderColor: c("outline") } } },
      MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: "none", borderRadius: 12 } } },
      /* The library's switch has no padding of its own (Material's track is
         the whole control), so the label needs a real gap and must not
         keep the negative margin MUI uses to offset that padding. Only a
         label that holds a switch; a checkbox keeps MUI's spacing. */
      MuiFormControlLabel: { styleOverrides: { root: { "&:has(.MuiSwitch-root)": { marginLeft: 0, gap: 12 } } } },
      MuiCheckbox: { defaultProps: { size: size3 } },
      MuiToggleButtonGroup: { defaultProps: { size: size3 } },
      MuiTextField: { defaultProps: { size: size2 } },
      MuiFormControl: { defaultProps: { size: size2 } },
      MuiChip: {
        defaultProps: { size: size2 },
        styleOverrides: {
          /* Material's chip: 32 high, 8 corner, outlined on the surface. */
          root: {
            height: 32, borderRadius: 8, fontSize: 14,
            variants: [{
              props: { color: "default" },
              style: { backgroundColor: "transparent", border: `1px solid ${c("outline")}`, color: c("onSurfaceVariant") },
            }],
          },
          label: { paddingLeft: 16, paddingRight: 16 },
        },
      },
      MuiSwitch: {
        defaultProps: { size: size2 },
        styleOverrides: {
          /* Material's switch: a 52 by 32 track with a 2px outline; the
             handle is 16 when off and 24 when on. Written on the root
             with the part classes so it outranks MUI's size rules. */
          root: {
            width: 52, height: 32, padding: 0, overflow: "visible",
            "& .MuiSwitch-switchBase": { padding: 4, top: 0, left: 0, color: c("outline"), transform: "none" },
            "& .MuiSwitch-switchBase.Mui-checked": { transform: "translateX(20px)", color: c("onPrimary") },
            "& .MuiSwitch-thumb": { width: 16, height: 16, margin: 4, boxShadow: "none", backgroundColor: "currentColor" },
            "& .MuiSwitch-switchBase.Mui-checked .MuiSwitch-thumb": { width: 24, height: 24, margin: 0 },
            "& .MuiSwitch-track": { boxSizing: "border-box", borderRadius: 16, backgroundColor: c("surfaceContainerHighest"), border: `2px solid ${c("outline")}`, opacity: 1 },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: c("primary"), borderColor: c("primary"), opacity: 1 },
            "& .MuiSwitch-switchBase.Mui-disabled + .MuiSwitch-track": { opacity: 0.38 },
          },
        },
      },
      MuiTable: { defaultProps: { size: size2 } },
    },
  };
}

/** The theme as plain MUI options. */
export function m3ThemeOptions({ mode, density, tokens, fit = "slot" }: M3ThemeArgs): ThemeOptions {
  const level = coerceDensity(density);
  if (fit === "spec") return specOptions(mode, level, tokens ?? (THEMES[mode] as M3Tokens));
  return slotOptions(mode, level, m3Roles(mode, tokens));
}

/** The MUI theme. Callers memoise on (mode, density, tokens, fit). */
export function buildM3Theme(args: M3ThemeArgs): Theme {
  return createTheme(m3ThemeOptions(args));
}

/* ── For the export: the same options as source text. ── */
function literal(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(literal).join(", ")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return "{}";
    return `{ ${entries.map(([k, v]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${literal(v)}`).join(", ")} }`;
  }
  return JSON.stringify(value);
}

/** The builder's theme as a JavaScript object literal, for `createTheme(...)`
 *  in exported code. Evaluating it gives m3ThemeOptions for the same args. */
export function m3ThemeSource(args: Omit<M3ThemeArgs, "fit" | "tokens">): string {
  return literal(m3ThemeOptions({ ...args, fit: "slot" }));
}
