"use client";

/**
 * DS-native inspector controls. The config/inspector panel's controls render as
 * the ACTIVE design system's REAL form components, so editing a Salt block uses
 * Salt's Input/Dropdown/Switch, an M3 block uses MUI TextField/Select/Switch,
 * etc. — the panel dogfoods the DS you're shaping.
 *
 * Architecture mirrors RealComponentRenderer: each JS-provider DS renders inside
 * its own provider subtree (SaltProvider / MUI ThemeProvider / FluentProvider),
 * behind a `mounted` SSR gate so MUI's emotion / Fluent's griffel style engines
 * never run during SSR/first hydration. The caller (SchemaFields) gates its
 * control swap on the SAME `useMounted()` signal, so the DS controls never render
 * a frame outside their provider. Carbon + uoaui need scoped-CSS machinery
 * (CarbonScopeStyles / .preview-uoaui) and are handled in a follow-up; until then
 * `supportsDsControls` returns false for them and the caller keeps the neutral
 * controls — an honest, crash-free fallback.
 *
 * Each control accepts an `ariaLabel` (the inspector field label) and routes it to
 * the element that actually carries the role, per DS: Salt Input/Switch via
 * `inputProps`, MUI via `slotProps.htmlInput`/`select`/`input`, Salt Dropdown +
 * all Fluent controls via a top-level `aria-label` (their primary slot).
 */
import React from "react";
import type { SystemId } from "@/lib/componentApiRegistry";

import { SaltProvider, Input as SaltInput, Dropdown as SaltDropdown, Option as SaltOption, Switch as SaltSwitch } from "@salt-ds/core";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import MuiTextField from "@mui/material/TextField";
import MuiMenuItem from "@mui/material/MenuItem";
import MuiSwitch from "@mui/material/Switch";
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  Input as FluentInput,
  Dropdown as FluentDropdown,
  Option as FluentOption,
  Switch as FluentSwitch,
} from "@fluentui/react-components";

export type Mode = "light" | "dark";
export interface SelectOption {
  value: string;
  label: string;
}

/* DSs that render real inspector controls today (JS-provider, no scoped CSS).
   Carbon/uoaui fall back to neutral controls until their scope machinery lands. */
const DS_CONTROL_SYSTEMS = new Set<SystemId>(["salt", "m3", "fluent"]);
export function supportsDsControls(system: SystemId): boolean {
  return DS_CONTROL_SYSTEMS.has(system);
}

/* One-time client mount gate (style engines must not run on the server).
   Exported so the caller (SchemaFields) can gate its control swap on the SAME
   signal — otherwise the DS controls render for one frame before this provider
   mounts, i.e. outside their theme context. */
export function useMounted(): boolean {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}

/* Wrap a field list in the active DS's provider subtree exactly once. Outside a
   real-control DS (or before mount) it is a transparent passthrough so the
   caller's neutral controls render unchanged. */
export function DsControlScope({
  system,
  mode,
  children,
}: {
  system: SystemId;
  mode: Mode;
  children: React.ReactNode;
}) {
  const mounted = useMounted();
  /* Memoise so the MUI theme isn't rebuilt every render (mirrors RealComponentRenderer). */
  const m3Theme = React.useMemo(() => createTheme({ palette: { mode } }), [mode]);
  if (!mounted || !supportsDsControls(system)) return <>{children}</>;
  switch (system) {
    case "salt":
      return (
        <SaltProvider mode={mode}>
          <div className="ds-inspector-controls" data-ds="salt">{children}</div>
        </SaltProvider>
      );
    case "m3":
      return (
        <MuiThemeProvider theme={m3Theme}>
          <div className="ds-inspector-controls" data-ds="m3">{children}</div>
        </MuiThemeProvider>
      );
    case "fluent":
      return (
        <FluentProvider theme={mode === "dark" ? webDarkTheme : webLightTheme}>
          <div className="ds-inspector-controls" data-ds="fluent">{children}</div>
        </FluentProvider>
      );
    default:
      return <>{children}</>;
  }
}

/* ── Text ─────────────────────────────────────────────────────────────── */
export function DsText({
  system,
  value,
  placeholder,
  ariaLabel,
  onChange,
}: {
  system: SystemId;
  value: string;
  placeholder?: string;
  ariaLabel?: string;
  onChange: (v: string) => void;
}) {
  switch (system) {
    case "salt":
      /* Salt's Input extends div props — the component-level onChange would land
         on the wrapper <div> and never fire. Route change + name via inputProps. */
      return (
        <SaltInput
          value={value}
          placeholder={placeholder}
          inputProps={{ "aria-label": ariaLabel, onChange: (e) => onChange(e.currentTarget.value) }}
          style={{ width: "100%" }}
        />
      );
    case "m3":
      return (
        <MuiTextField
          size="small"
          fullWidth
          variant="outlined"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          slotProps={{ htmlInput: { "aria-label": ariaLabel } }}
        />
      );
    case "fluent":
      return (
        <FluentInput
          value={value}
          placeholder={placeholder}
          aria-label={ariaLabel}
          onChange={(_e, data) => onChange(data.value)}
          style={{ width: "100%" }}
        />
      );
    default:
      return null;
  }
}

/* ── Select ───────────────────────────────────────────────────────────── */
export function DsSelect({
  system,
  value,
  options,
  ariaLabel,
  onChange,
}: {
  system: SystemId;
  value: string;
  options: SelectOption[];
  ariaLabel?: string;
  onChange: (v: string) => void;
}) {
  const current = options.find((o) => o.value === value) ?? options[0];
  switch (system) {
    case "salt":
      return (
        <SaltDropdown
          selected={current ? [current.value] : []}
          value={current?.label}
          aria-label={ariaLabel}
          onSelectionChange={(_e, sel) => onChange((sel?.[0] as string) ?? "")}
          style={{ width: "100%" }}
        >
          {options.map((o) => (
            <SaltOption value={o.value} key={o.value}>
              {o.label}
            </SaltOption>
          ))}
        </SaltDropdown>
      );
    case "m3":
      return (
        <MuiTextField
          select
          size="small"
          fullWidth
          variant="outlined"
          value={current?.value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          slotProps={{ select: { "aria-label": ariaLabel } }}
        >
          {options.map((o) => (
            <MuiMenuItem value={o.value} key={o.value}>
              {o.label}
            </MuiMenuItem>
          ))}
        </MuiTextField>
      );
    case "fluent":
      return (
        <FluentDropdown
          value={current?.label ?? ""}
          selectedOptions={current ? [current.value] : []}
          aria-label={ariaLabel}
          onOptionSelect={(_e, data) => onChange(data.optionValue ?? "")}
          style={{ width: "100%", minWidth: "auto" }}
        >
          {options.map((o) => (
            <FluentOption value={o.value} key={o.value}>
              {o.label}
            </FluentOption>
          ))}
        </FluentDropdown>
      );
    default:
      return null;
  }
}

/* ── Toggle (switch) ──────────────────────────────────────────────────── */
export function DsToggle({
  system,
  checked,
  ariaLabel,
  onChange,
}: {
  system: SystemId;
  checked: boolean;
  ariaLabel?: string;
  onChange: (v: boolean) => void;
}) {
  switch (system) {
    case "salt":
      return (
        <SaltSwitch
          checked={checked}
          inputProps={{ "aria-label": ariaLabel }}
          onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
        />
      );
    case "m3":
      return (
        <MuiSwitch
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          size="small"
          slotProps={{ input: { "aria-label": ariaLabel } }}
        />
      );
    case "fluent":
      return <FluentSwitch checked={checked} aria-label={ariaLabel} onChange={(_e, data) => onChange(data.checked)} />;
    default:
      return null;
  }
}
