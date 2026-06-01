"use client";

/**
 * RealComponentRenderer (#9 PR-3) — renders REAL OFFICIAL design-system React
 * components in the /ui-kit "Builder Blocks" gallery, so the kit is
 * demonstrably "pulling from the official DS API" rather than a facsimile.
 *
 * SCOPE (deliberately narrow + honest):
 *   - SYSTEMS: only the three DSs whose styling comes from a JS provider with NO
 *     global reset — Salt (SaltProvider), Material 3 (MUI ThemeProvider), and
 *     Fluent (FluentProvider). Carbon is intentionally EXCLUDED: its real
 *     components need `@carbon/styles`, a ~950 KB GLOBAL reset that would leak
 *     app-wide (html/body/* selectors), so Carbon stays on the existing
 *     Simulated-on-official-tokens render. uoaui is className/CSS-only (no npm
 *     package), so it also stays Simulated.
 *   - BLOCKS: only the CORE SET — Button, TextInput, Checkbox, Switch, Card.
 *     Everything else returns null and the caller falls back to the builder's
 *     ComponentRenderer (the same render path as the canvas).
 *
 * The prop translation mirrors src/lib/componentApiRegistry.ts (the JSX-string
 * exporter) in real React: Salt Button sentiment/appearance, MUI Button
 * variant/color, Fluent Button appearance, etc. — so what renders here matches
 * the handoff code the export emits.
 *
 * SSR SAFETY: this is a "use client" component, and the gallery that mounts it
 * is dynamic-imported with `ssr: false`. Belt-and-suspenders, the CALLER also
 * client-gates this behind a `mounted` flag (BuilderBlockGallery's
 * RealOrSimulated renders the Simulated component until a mount effect fires,
 * then swaps to this one) so MUI's emotion / Fluent's griffel style engines
 * never run during SSR or the first hydration pass — no Next App-Router
 * hydration mismatch, and no empty-demo flash. Each DS subtree is wrapped in its
 * own provider (providers are client-safe).
 *
 * We never import `@carbon/styles` or `@carbon/react`.
 */

import React from "react";

import {
  SaltProvider,
  Button as SaltButton,
  FormField as SaltFormField,
  FormFieldLabel as SaltFormFieldLabel,
  Input as SaltInput,
  Checkbox as SaltCheckbox,
  Switch as SaltSwitch,
  Card as SaltCard,
} from "@salt-ds/core";

import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import MuiButton from "@mui/material/Button";
import MuiTextField from "@mui/material/TextField";
import MuiCheckbox from "@mui/material/Checkbox";
import MuiSwitch from "@mui/material/Switch";
import MuiFormControlLabel from "@mui/material/FormControlLabel";
import MuiCard from "@mui/material/Card";
import MuiCardContent from "@mui/material/CardContent";

import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  Button as FluentButton,
  Field as FluentField,
  Input as FluentInput,
  Checkbox as FluentCheckbox,
  Switch as FluentSwitch,
  Card as FluentCard,
  CardHeader as FluentCardHeader,
} from "@fluentui/react-components";

import type { SystemId } from "@/lib/componentApiRegistry";

/* The systems that render REAL components here (provider-styled, no global
   reset). Carbon + uoaui are deliberately absent — see file header. */
const REAL_SYSTEMS = new Set<SystemId>(["salt", "m3", "fluent"]);

/* The CORE SET of block types we render real, per the PR scope. Anything else
   returns null so the caller falls back to the Simulated ComponentRenderer. */
const CORE_BLOCKS = new Set<string>([
  "SimulatedButton",
  "SimulatedTextInput",
  "SimulatedCheckbox",
  "SimulatedSwitch",
  "SimulatedCard",
]);

/** True when (system, blockType) renders a real official component here. */
export function canRenderReal(system: SystemId, blockType: string): boolean {
  return REAL_SYSTEMS.has(system) && CORE_BLOCKS.has(blockType);
}

const s = (v: unknown, fallback = ""): string => String(v ?? fallback);

/* ── Salt: variant -> sentiment + appearance (mirrors saltButtonAttrs). ── */
function saltButtonProps(variant: string): { sentiment: "accented" | "neutral" | "negative"; appearance: "solid" | "bordered" | "transparent" } {
  const map: Record<string, { sentiment: "accented" | "neutral" | "negative"; appearance: "solid" | "bordered" | "transparent" }> = {
    primary: { sentiment: "accented", appearance: "solid" },
    secondary: { sentiment: "neutral", appearance: "bordered" },
    outline: { sentiment: "neutral", appearance: "bordered" },
    ghost: { sentiment: "neutral", appearance: "transparent" },
    danger: { sentiment: "negative", appearance: "solid" },
    destructive: { sentiment: "negative", appearance: "solid" },
  };
  return map[variant] ?? map.primary;
}

/* ── MUI: variant -> { variant, color } (mirrors m3ButtonAttrs). ── */
function muiButtonProps(variant: string): { variant: "contained" | "outlined" | "text"; color?: "error" } {
  const map: Record<string, { variant: "contained" | "outlined" | "text"; color?: "error" }> = {
    primary: { variant: "contained" },
    secondary: { variant: "outlined" },
    outline: { variant: "outlined" },
    ghost: { variant: "text" },
    danger: { variant: "contained", color: "error" },
    destructive: { variant: "contained", color: "error" },
  };
  return map[variant] ?? map.primary;
}

/* ── Fluent: variant -> appearance (mirrors fluentButtonAttrs). ── */
function fluentButtonProps(variant: string): { appearance: "primary" | "secondary" | "outline" | "subtle"; style?: React.CSSProperties } {
  const map: Record<string, { appearance: "primary" | "secondary" | "outline" | "subtle"; style?: React.CSSProperties }> = {
    primary: { appearance: "primary" },
    secondary: { appearance: "secondary" },
    outline: { appearance: "outline" },
    ghost: { appearance: "subtle" },
    danger: { appearance: "subtle", style: { color: "var(--colorPaletteRedForeground1)" } },
    destructive: { appearance: "subtle", style: { color: "var(--colorPaletteRedForeground1)" } },
  };
  return map[variant] ?? map.primary;
}

type SaltDensity = "high" | "medium" | "low" | "touch";
type SaltMode = "light" | "dark";

interface RealComponentRendererProps {
  system: SystemId;
  type: string;
  /** Light vs dark, derived from the active theme by the gallery. */
  mode: SaltMode;
  /** Salt density (high/medium/low/touch). Ignored by M3/Fluent. */
  saltDensity?: SaltDensity;
  /** The block's default props (variant/label/title/content/...). */
  props: Record<string, unknown>;
}

/* ── SALT real subtree ── */
function SaltReal({ type, mode, saltDensity, props }: Omit<RealComponentRendererProps, "system">) {
  let inner: React.ReactNode = null;
  if (type === "SimulatedButton") {
    const { sentiment, appearance } = saltButtonProps(s(props.variant, "primary"));
    inner = <SaltButton sentiment={sentiment} appearance={appearance}>{s(props.label, "Button")}</SaltButton>;
  } else if (type === "SimulatedTextInput") {
    inner = (
      <SaltFormField>
        <SaltFormFieldLabel>{s(props.label, "Label")}</SaltFormFieldLabel>
        <SaltInput placeholder={s(props.placeholder)} readOnly />
      </SaltFormField>
    );
  } else if (type === "SimulatedCheckbox") {
    inner = <SaltCheckbox label={s(props.label)} defaultChecked={Boolean(props.defaultChecked)} />;
  } else if (type === "SimulatedSwitch") {
    inner = <SaltSwitch label={s(props.label)} defaultChecked={Boolean(props.defaultOn)} />;
  } else if (type === "SimulatedCard") {
    inner = (
      <SaltCard>
        <h3 style={{ margin: "0 0 4px" }}>{s(props.title, "Card")}</h3>
        <p style={{ margin: 0 }}>{s(props.content)}</p>
      </SaltCard>
    );
  }
  /* Default SaltProvider wraps children in a scoped `.salt-theme` element (no
     global :root/body reset), so this nested provider can't leak to the app. */
  return (
    <SaltProvider mode={mode} density={saltDensity ?? "medium"}>
      {inner}
    </SaltProvider>
  );
}

/* ── M3 (MUI) real subtree ── */
function M3Real({ type, mode, props }: Omit<RealComponentRendererProps, "system">) {
  /* createTheme with the active mode; emotion styles are scoped per component
     (no global reset). Memoise so the theme isn't rebuilt every render. */
  const theme = React.useMemo(() => createTheme({ palette: { mode } }), [mode]);
  let inner: React.ReactNode = null;
  if (type === "SimulatedButton") {
    const { variant, color } = muiButtonProps(s(props.variant, "primary"));
    inner = <MuiButton variant={variant} color={color}>{s(props.label, "Button")}</MuiButton>;
  } else if (type === "SimulatedTextInput") {
    inner = <MuiTextField label={s(props.label, "Label")} placeholder={s(props.placeholder)} variant="outlined" />;
  } else if (type === "SimulatedCheckbox") {
    inner = <MuiFormControlLabel control={<MuiCheckbox defaultChecked={Boolean(props.defaultChecked)} />} label={s(props.label)} />;
  } else if (type === "SimulatedSwitch") {
    inner = <MuiFormControlLabel control={<MuiSwitch defaultChecked={Boolean(props.defaultOn)} />} label={s(props.label)} />;
  } else if (type === "SimulatedCard") {
    inner = (
      <MuiCard>
        <MuiCardContent>
          <h3 style={{ margin: "0 0 4px" }}>{s(props.title, "Card")}</h3>
          <p style={{ margin: 0 }}>{s(props.content)}</p>
        </MuiCardContent>
      </MuiCard>
    );
  }
  return <MuiThemeProvider theme={theme}>{inner}</MuiThemeProvider>;
}

/* ── Fluent real subtree ── */
function FluentReal({ type, mode, props }: Omit<RealComponentRendererProps, "system">) {
  let inner: React.ReactNode = null;
  if (type === "SimulatedButton") {
    const { appearance, style } = fluentButtonProps(s(props.variant, "primary"));
    inner = <FluentButton appearance={appearance} style={style}>{s(props.label, "Button")}</FluentButton>;
  } else if (type === "SimulatedTextInput") {
    inner = (
      <FluentField label={s(props.label, "Label")}>
        <FluentInput placeholder={s(props.placeholder)} readOnly />
      </FluentField>
    );
  } else if (type === "SimulatedCheckbox") {
    inner = <FluentCheckbox label={s(props.label)} defaultChecked={Boolean(props.defaultChecked)} />;
  } else if (type === "SimulatedSwitch") {
    inner = <FluentSwitch label={s(props.label)} defaultChecked={Boolean(props.defaultOn)} />;
  } else if (type === "SimulatedCard") {
    inner = (
      <FluentCard>
        <FluentCardHeader header={s(props.title, "Card")} description={s(props.content)} />
      </FluentCard>
    );
  }
  /* FluentProvider scopes its `--color*` vars + griffel styles to a wrapper
     element; webLight/webDark drive the mode. No global reset. */
  return <FluentProvider theme={mode === "dark" ? webDarkTheme : webLightTheme}>{inner}</FluentProvider>;
}

/**
 * Render the REAL official component for (system, type) in the core set, or
 * return null when the pair is out of scope.
 *
 * SSR/hydration contract: the provider style engines (MUI emotion, Fluent
 * griffel) must not run during SSR / first hydration. The CALLER is responsible
 * for client-gating — i.e. only mounting this after a `mounted` effect fires
 * (BuilderBlockGallery's RealOrSimulated does exactly that, and the whole
 * gallery is dynamic-imported `ssr: false`). This keeps the swap to a single
 * mounted guard so there's no empty-demo flash.
 */
export function RealComponentRenderer({
  system,
  type,
  mode,
  saltDensity,
  props,
}: RealComponentRendererProps): React.ReactElement | null {
  if (!canRenderReal(system, type)) return null;

  if (system === "salt") return <SaltReal type={type} mode={mode} saltDensity={saltDensity} props={props} />;
  if (system === "m3") return <M3Real type={type} mode={mode} props={props} />;
  if (system === "fluent") return <FluentReal type={type} mode={mode} props={props} />;
  return null;
}
