"use client";

/**
 * RealComponentRenderer (#9 PR-3, extended W6-P2a) — renders REAL design-system
 * components in the /ui-kit "Builder Blocks" gallery (and the read-only builder
 * preview), so the kit is demonstrably "pulling from the official DS API" rather
 * than a facsimile.
 *
 * SCOPE (deliberately narrow + honest):
 *   - SYSTEMS:
 *       · Salt (SaltProvider), Material 3 (MUI ThemeProvider), Fluent
 *         (FluentProvider) — JS-provider DSs with NO global reset, rendered via
 *         their own provider subtree.
 *       · uoaui (W6-P2a) — className/CSS-only (no npm package): the in-house
 *         glassmorphism DS. Rendered via the UoauiReal subtree, which wraps the
 *         real `.a-*` markup (from realBlockMap) in `.preview-uoaui.a-app` and
 *         injects the DS's own CSS via the existing getFullCSS / uoauiBuildCSS
 *         theme mechanism — SCOPED to that wrapper so the DS's global reset
 *         (`*{}` / `:root{}`) can't leak app-wide.
 *       · Carbon (W6-P2b) — real `@carbon/react` components. @carbon/styles is a
 *         ~950 KB GLOBAL sheet (Eric-Meyer reset + `:root` token blocks), so
 *         it's scoped at BUILD TIME to `.carbon-live-scope`
 *         (scripts/generate-carbon-scoped-css.mjs -> public/carbon-scoped.css)
 *         and lazy-loaded by CarbonScopeStyles. The CarbonReal subtree wraps the
 *         real components (from realBlockMap) in a `.carbon-live-scope` element
 *         carrying the `cds--white`/`cds--g100` theme class (so --cds-* resolve
 *         inside the scope). Per the locked decision, Carbon's @keyframes land
 *         in the global keyframe registry (harmless, --cds-/IBM-Plex prefixed);
 *         Shadow DOM/iframe are NOT used (DnD-kit needs one document).
 *   - BLOCKS: only the CORE SET — Button, TextInput, Checkbox, Switch, Card.
 *     Everything else returns null and the caller falls back to the builder's
 *     ComponentRenderer (the same render path as the canvas).
 *
 * The prop translation mirrors src/lib/componentApiRegistry.ts (the JSX-string
 * exporter) in real React/markup: Salt sentiment/appearance, MUI variant/color,
 * Fluent appearance, uoaui `.a-*` classes — so what renders here matches the
 * handoff code the export emits.
 *
 * SSR SAFETY: this is a "use client" component, and the gallery that mounts it
 * is dynamic-imported with `ssr: false`. Belt-and-suspenders, the CALLER also
 * client-gates this behind a `mounted` flag (ComponentRenderer's `mountedReal`)
 * so MUI's emotion / Fluent's griffel style engines never run during SSR or the
 * first hydration pass — no Next App-Router hydration mismatch, and no
 * empty-demo flash. uoaui is plain CSS (no JS style engine), but it rides the
 * same mounted gate so its scoped <style> injects only client-side too. Carbon
 * (@carbon/react) uses Sass-compiled static CSS (no runtime style engine); it
 * rides the same mounted gate and lazy-loads its scoped sheet via
 * CarbonScopeStyles on first mount.
 *
 * We never import the GLOBAL `@carbon/styles` sheet; Carbon's CSS comes only via
 * the build-time-scoped public/carbon-scoped.css (lazy <link>).
 */

import React from "react";

import { getFullCSS, getTheme } from "@/data/registry";
import { DEFAULT_TABLE_COLUMNS, DEFAULT_TABLE_ROWS } from "@/lib/tableData";
import { sanitizeCSS } from "@/lib/sanitizeCSS";
import { buttonActionProps, buttonIcon, getRealBlockRenderer } from "@/components/ui-kit/realBlockMap";
import {
  coerceDensity,
  muiSize,
  muiSize2,
  fluentSize,
  fluentSize2,
  fluentCheckboxSize,
  type DensityLevel,
} from "@/lib/densitySize";
import { CarbonScopeStyles } from "@/components/ui-kit/CarbonScopeStyles";
import { dropdownModel, type DropdownModel, INLINE_DROPDOWN_FONT, INLINE_DROPDOWN_HEIGHT, INLINE_LABEL_FONT } from "@/lib/dropdownModel";

import {
  SaltProvider,
  Button as SaltButton,
  FormField as SaltFormField,
  FormFieldLabel as SaltFormFieldLabel,
  Input as SaltInput,
  Checkbox as SaltCheckbox,
  Switch as SaltSwitch,
  Card as SaltCard,
  H1 as SaltH1,
  H2 as SaltH2,
  H3 as SaltH3,
  H4 as SaltH4,
  Link as SaltLink,
  Badge as SaltBadge,
  Pill as SaltPill,
  Banner as SaltBanner,
  BannerContent as SaltBannerContent,
  Text as SaltText,
  StatusIndicator as SaltStatusIndicator,
  LinearProgress as SaltLinearProgress,
  Avatar as SaltAvatar,
  Dropdown as SaltDropdown,
  Option as SaltOption,
  SegmentedButtonGroup as SaltSegmentedButtonGroup,
  Accordion as SaltAccordion,
  AccordionHeader as SaltAccordionHeader,
  AccordionPanel as SaltAccordionPanel,
  NavigationItem as SaltNavigationItem,
  Table as SaltTable,
  THead as SaltTHead,
  TBody as SaltTBody,
  TH as SaltTH,
  TR as SaltTR,
  TD as SaltTD,
} from "@salt-ds/core";
import { ChevronRightIcon, SearchIcon } from "@salt-ds/icons";

import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import MuiButton from "@mui/material/Button";
import MuiIconButton from "@mui/material/IconButton";
import MuiTextField from "@mui/material/TextField";
import MuiCheckbox from "@mui/material/Checkbox";
import MuiSwitch from "@mui/material/Switch";
import MuiFormControlLabel from "@mui/material/FormControlLabel";
import MuiCard from "@mui/material/Card";
import MuiCardContent from "@mui/material/CardContent";
import MuiTypography from "@mui/material/Typography";
import MuiLink from "@mui/material/Link";
import MuiChip from "@mui/material/Chip";
import MuiLinearProgress from "@mui/material/LinearProgress";
import MuiAvatar from "@mui/material/Avatar";
import MuiAlert from "@mui/material/Alert";
import MuiAlertTitle from "@mui/material/AlertTitle";
import MuiFormControl from "@mui/material/FormControl";
import MuiInputLabel from "@mui/material/InputLabel";
import MuiSelect from "@mui/material/Select";
import MuiMenuItem from "@mui/material/MenuItem";
import MuiToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import MuiToggleButton from "@mui/material/ToggleButton";
import MuiInputAdornment from "@mui/material/InputAdornment";
import MuiAccordion from "@mui/material/Accordion";
import MuiAccordionSummary from "@mui/material/AccordionSummary";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import MuiListItem from "@mui/material/ListItem";
import MuiListItemButton from "@mui/material/ListItemButton";
import MuiListItemIcon from "@mui/material/ListItemIcon";
import MuiListItemText from "@mui/material/ListItemText";
import MuiTable from "@mui/material/Table";
import MuiTableHead from "@mui/material/TableHead";
import MuiTableBody from "@mui/material/TableBody";
import MuiTableRow from "@mui/material/TableRow";
import MuiTableCell from "@mui/material/TableCell";
import MuiTableContainer from "@mui/material/TableContainer";
import MuiPaper from "@mui/material/Paper";

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
  Title1 as FluentTitle1,
  Title2 as FluentTitle2,
  Title3 as FluentTitle3,
  Subtitle2 as FluentSubtitle2,
  Link as FluentLink,
  Badge as FluentBadge,
  Tag as FluentTag,
  MessageBar as FluentMessageBar,
  MessageBarBody as FluentMessageBarBody,
  MessageBarTitle as FluentMessageBarTitle,
  Caption1 as FluentCaption1,
  ProgressBar as FluentProgressBar,
  Avatar as FluentAvatar,
  ToggleButton as FluentToggleButton,
  Dropdown as FluentDropdown,
  Option as FluentOption,
  SearchBox as FluentSearchBox,
  Accordion as FluentAccordion,
  AccordionItem as FluentAccordionItem,
  AccordionHeader as FluentAccordionHeader,
  AccordionPanel as FluentAccordionPanel,
  Toolbar as FluentToolbar,
  Table as FluentTable,
  TableHeader as FluentTableHeader,
  TableRow as FluentTableRow,
  TableHeaderCell as FluentTableHeaderCell,
  TableBody as FluentTableBody,
  TableCell as FluentTableCell,
} from "@fluentui/react-components";
import { resolveCell, isStatusColumn, statusToClass } from "@/lib/tableCells";

import type { SystemId } from "@/lib/componentApiRegistry";

/* The CORE SET of block types rendered real across every DS (W6). */
const CORE_BLOCKS = [
  "SimulatedButton",
  "SimulatedTextInput",
  "SimulatedCheckbox",
  "SimulatedSwitch",
  "SimulatedCard",
] as const;

/* PR-3 extended coverage: low-complexity types now rendered real in Preview. */
const EXTENDED_BLOCKS = [
  "SimulatedTitle",
  "SimulatedLink",
  "SimulatedBadge",
  "SimulatedPill",
  "Alert",
  "AppBrand",
  "StatusPill",
  "FooterText",
  "SimulatedProgress",
  "SimulatedAvatar",
] as const;

/* PR-4 mid-complexity coverage: rendered real across every DS. */
const MID_BLOCKS = [
  "SimulatedStatCard",
  "SimulatedDropdown",
  "SimulatedSearchbox",
  "SimulatedSegmentedGroup",
  "SimulatedAccordion",
  "NavItem",
] as const;

/* PR-5: DataTable rendered as a real DS table across every DS. */
const TABLE_BLOCKS = ["SimulatedDataTable"] as const;

/* Carbon ships no first-party Heading / Footer / Avatar component, so those stay
   Simulated for carbon ONLY (honest fallback). Every other DS covers all. */
const CARBON_OMITS = new Set<string>(["SimulatedTitle", "FooterText", "SimulatedAvatar"]);

/* Per-(system, blockType) coverage — replaces the old global CORE_BLOCKS set so
   coverage can differ per DS (e.g. carbon's omits above). Shared by the builder
   Preview, the /ui-kit gallery, and VariantsMatrix (all route through here). */
const COVERAGE: Record<SystemId, Set<string>> = {
  salt: new Set<string>([...CORE_BLOCKS, ...EXTENDED_BLOCKS, ...MID_BLOCKS, ...TABLE_BLOCKS]),
  m3: new Set<string>([...CORE_BLOCKS, ...EXTENDED_BLOCKS, ...MID_BLOCKS, ...TABLE_BLOCKS]),
  fluent: new Set<string>([...CORE_BLOCKS, ...EXTENDED_BLOCKS, ...MID_BLOCKS, ...TABLE_BLOCKS]),
  uoaui: new Set<string>([...CORE_BLOCKS, ...EXTENDED_BLOCKS, ...MID_BLOCKS, ...TABLE_BLOCKS]),
  carbon: new Set<string>([...CORE_BLOCKS, ...EXTENDED_BLOCKS, ...MID_BLOCKS, ...TABLE_BLOCKS].filter((t) => !CARBON_OMITS.has(t))),
};

/** True when (system, blockType) renders a real official component here. */
/* ── Dropdown: label, chosen value and options come from the block
   (dropdownModel), in each system's own field idiom.

   With `onChange` the dropdown is CONTROLLED: its value is canvas report
   state (a context filter or a panel's "View by") and choosing an option
   writes it back. Without it the dropdown is uncontrolled, keyed on the value
   so a prop edit re-seeds the selection. ── */
type DropdownChange = ((value: string) => void) | undefined;

/** An inline dropdown: its label on the left, the control on the right, on
 *  one line. The label is ours (the same in every system); the control is
 *  the system's own underlined dropdown. */
function InlineField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="dh-inline-field" style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, width: "100%" }}>
      {label ? (
        <span className="dh-inline-label" aria-hidden="true" style={{ flex: "none", fontSize: INLINE_LABEL_FONT, lineHeight: 1, whiteSpace: "nowrap", color: "var(--ds-fg-secondary)" }}>
          {label}
        </span>
      ) : null}
      <span className="dh-inline-control" style={{ flex: "1 1 0", minWidth: 0, display: "block" }}>{children}</span>
    </span>
  );
}

function SaltDropdownField({ model, onChange }: { model: DropdownModel; onChange: DropdownChange }) {
  const dropdown = (
    <SaltDropdown
      key={onChange ? undefined : model.value}
      placeholder={model.placeholder}
      {...(onChange
        ? { selected: model.value ? [model.value] : [], onSelectionChange: (_e: unknown, selected: string[]) => { if (selected[0]) onChange(selected[0]); } }
        : { defaultSelected: model.value ? [model.value] : [] })}
      aria-label={model.label || model.placeholder}
      /* Inline: Salt's primary dropdown - an underline on the surface it
         sits on (white on a white card), not the grey "secondary" fill. */
      {...(model.inline ? { variant: "primary" as const, style: { width: "100%", minWidth: 0, background: "transparent" } } : {})}
    >
      {model.options.map((o) => (
        <SaltOption key={o} value={o}>{o}</SaltOption>
      ))}
    </SaltDropdown>
  );
  if (model.inline) {
    /* Salt's high density is the small control of a dense toolbar. */
    return (
      <InlineField label={model.label}>
        <SaltProvider density="high" applyClassesTo="scope">
          <span style={{ display: "block" }}>{dropdown}</span>
        </SaltProvider>
      </InlineField>
    );
  }
  if (!model.label) return dropdown;
  return (
    <SaltFormField labelPlacement="left">
      <SaltFormFieldLabel>{model.label}</SaltFormFieldLabel>
      {dropdown}
    </SaltFormField>
  );
}

function MuiDropdownField({ model, onChange }: { model: DropdownModel; onChange: DropdownChange }) {
  const id = React.useId();
  const label = model.label || model.placeholder;
  if (model.inline) {
    /* Inline: MUI's "standard" (underlined) select, at toolbar height. */
    return (
      <InlineField label={model.label}>
        <MuiFormControl fullWidth variant="standard" size="small">
          <MuiSelect
            variant="standard"
            key={onChange ? undefined : model.value}
            sx={{ height: INLINE_DROPDOWN_HEIGHT, fontSize: INLINE_DROPDOWN_FONT, "& .MuiSelect-select": { paddingTop: 0, paddingBottom: 0, paddingLeft: 0.5 } }}
            inputProps={{ "aria-label": label }}
            {...(onChange
              ? { value: model.value, onChange: (e: { target: { value: unknown } }) => onChange(String(e.target.value)) }
              : { defaultValue: model.value })}
          >
            {model.options.map((o) => (
              <MuiMenuItem key={o} value={o} dense>{o}</MuiMenuItem>
            ))}
          </MuiSelect>
        </MuiFormControl>
      </InlineField>
    );
  }
  /* Compact (toolbar / panel header): the small size, and an accessible name
     instead of the floating label, which needs the full field height. */
  return (
    <MuiFormControl fullWidth size={model.compact ? "small" : undefined}>
      {model.compact ? null : <MuiInputLabel id={id}>{label}</MuiInputLabel>}
      <MuiSelect
        key={onChange ? undefined : model.value}
        /* MUI's "small" select is still 40px with 16px text: too tall for a
           panel header. Compact brings it to the 32px the other systems use. */
        sx={model.compact ? { height: 32, fontSize: 13 } : undefined}
        {...(model.compact ? { inputProps: { "aria-label": label } } : { labelId: id, label })}
        {...(onChange
          ? { value: model.value, onChange: (e: { target: { value: unknown } }) => onChange(String(e.target.value)) }
          : { defaultValue: model.value })}
      >
        {model.options.map((o) => (
          <MuiMenuItem key={o} value={o}>{o}</MuiMenuItem>
        ))}
      </MuiSelect>
    </MuiFormControl>
  );
}

function FluentDropdownField({ model, size, onChange }: { model: DropdownModel; size: "small" | "medium" | "large"; onChange: DropdownChange }) {
  const dropdown = (
    <FluentDropdown
      key={onChange ? undefined : model.value}
      placeholder={model.placeholder}
      {...(onChange
        ? {
            value: model.value,
            selectedOptions: model.value ? [model.value] : [],
            onOptionSelect: (_e: unknown, data: { optionValue?: string }) => { if (data.optionValue) onChange(data.optionValue); },
          }
        : { defaultValue: model.value || undefined, defaultSelectedOptions: model.value ? [model.value] : [] })}
      aria-label={model.inline ? model.label || model.placeholder : model.label ? undefined : model.placeholder}
      size={model.compact || model.inline ? "small" : size}
      /* Inline: Fluent's underlined dropdown. */
      {...(model.inline ? { appearance: "underline" as const } : {})}
      style={{ minWidth: 0, width: "100%" }}
    >
      {model.options.map((o) => (
        <FluentOption key={o} value={o}>{o}</FluentOption>
      ))}
    </FluentDropdown>
  );
  if (model.inline) return <InlineField label={model.label}>{dropdown}</InlineField>;
  if (!model.label) return dropdown;
  return (
    /* Label above the field: beside it, the label takes a fixed third of
       the width and a narrow filter clips it ("Periodicit"). */
    <FluentField label={model.label} orientation="vertical" size={size}>
      {dropdown}
    </FluentField>
  );
}

/** The block's `onValueChange` prop, when the caller wired one. */
const changeHandler = (props: Record<string, unknown>): DropdownChange =>
  typeof props.onValueChange === "function" ? (props.onValueChange as (v: string) => void) : undefined;

export function canRenderReal(system: SystemId, blockType: string): boolean {
  return COVERAGE[system]?.has(blockType) ?? false;
}

const s = (v: unknown, fallback = ""): string => String(v ?? fallback);

/** Coerce a builder field to a finite number with a fallback (mirrors registry `num`). */
const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/** Split a CSV field into trimmed options with a fallback (mirrors registry `csv`). */
const csv = (v: unknown, fallback: string[] = []): string[] => {
  const parts = s(v).split(",").map((t) => t.trim()).filter(Boolean);
  return parts.length ? parts : fallback;
};

/** Stable slug from a label (mirrors registry `slug`). */
const slug = (v: unknown, fallback = "item"): string =>
  s(v).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || fallback;

/* ── extended-coverage prop maps (PR-3), mirrored from componentApiRegistry. ── */
/* Alert variant -> Salt Banner status. */
function saltAlertStatus(variant: string): "info" | "success" | "warning" | "error" {
  const map: Record<string, "info" | "success" | "warning" | "error"> = { info: "info", success: "success", warning: "warning", error: "error" };
  return map[variant] ?? "info";
}
/* Avatar size token -> Salt Avatar `size` multiplier (sm:1, md:2, lg:4). */
function saltAvatarSize(size: string): number {
  return ({ sm: 1, md: 2, lg: 4 } as Record<string, number>)[size] ?? 2;
}
/* Badge/Pill status -> MUI Chip `color`. */
function muiChipColor(status: string): "default" | "info" | "success" | "warning" | "error" | "secondary" {
  /* indigo (SQL stage) -> MUI `secondary` (the theme's purple), keeping it
     distinct from info (MQL, blue). */
  const map: Record<string, "default" | "info" | "success" | "warning" | "error" | "secondary"> = {
    default: "default", neutral: "default", info: "info", indigo: "secondary",
    success: "success", warning: "warning", error: "error",
  };
  return map[status] ?? "default";
}

/* status -> Salt StatusIndicator `status` (ValidationStatus: info/success/
   warning/error). Salt has no neutral or indigo: Lead (neutral) shows no dot
   (just the label), and SQL (indigo) borrows info -> reads like MQL in Salt. */
function saltIndicatorStatus(status: string): "info" | "success" | "warning" | "error" | null {
  const map: Record<string, "info" | "success" | "warning" | "error"> = {
    info: "info", indigo: "info", success: "success", warning: "warning", error: "error",
  };
  return map[status] ?? null;
}

/* ── Salt: variant -> sentiment + appearance (mirrors saltButtonAttrs).
   Explicit `appearance` / `sentiment` props (DS-variant presets, inspector)
   override the generic-variant mapping so the live preview matches the
   exported JSX. Validated against Salt's official enums. ── */
type SaltSentiment = "accented" | "neutral" | "positive" | "caution" | "negative";
type SaltAppearance = "solid" | "bordered" | "transparent";
const SALT_SENTIMENTS = new Set<SaltSentiment>(["accented", "neutral", "positive", "caution", "negative"]);
const SALT_APPEARANCES = new Set<SaltAppearance>(["solid", "bordered", "transparent"]);
function saltButtonProps(props: Record<string, unknown>): { sentiment: SaltSentiment; appearance: SaltAppearance } {
  const variant = s(props.variant, "primary");
  const map: Record<string, { sentiment: SaltSentiment; appearance: SaltAppearance }> = {
    primary: { sentiment: "accented", appearance: "solid" },
    secondary: { sentiment: "neutral", appearance: "bordered" },
    outline: { sentiment: "neutral", appearance: "bordered" },
    ghost: { sentiment: "neutral", appearance: "transparent" },
    danger: { sentiment: "negative", appearance: "solid" },
    destructive: { sentiment: "negative", appearance: "solid" },
  };
  const base = map[variant] ?? map.primary;
  const sentiment = SALT_SENTIMENTS.has(props.sentiment as SaltSentiment) ? (props.sentiment as SaltSentiment) : base.sentiment;
  const appearance = SALT_APPEARANCES.has(props.appearance as SaltAppearance) ? (props.appearance as SaltAppearance) : base.appearance;
  return { sentiment, appearance };
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

type SaltDensity = DensityLevel;
type SaltMode = "light" | "dark";

interface RealComponentRendererProps {
  system: SystemId;
  type: string;
  /** Light vs dark, derived from the active theme by the gallery. */
  mode: SaltMode;
  /** The builder's shared density level (Salt's high/medium/low/touch ladder).
      Salt and uoaui scale their tokens from it; M3, Fluent and Carbon map it
      onto their per-component `size` props (see src/lib/densitySize.ts). The
      prop keeps its historical name so existing callers need no change. */
  saltDensity?: SaltDensity;
  /** The block's default props (variant/label/title/content/...). */
  props: Record<string, unknown>;
  /**
   * KIT ONLY (additive): the UI kit's own token set for this system, so the
   * real component renders as that system's page shows it. Without it the
   * provider subtrees keep the builder's rendering exactly as before:
   * MUI's default theme, Salt's shipped theme, and so on. The kit passes the
   * same theme object its pages draw from (getTheme / useTheme().T), so a
   * Compare, Playground or Specs panel matches the page beside it.
   */
  kit?: Record<string, unknown>;
}

/* Optional skin for the kit: a system's own theme, as its page draws it. */
type Kit = Record<string, unknown> | undefined;
const kitNoop = () => {};
const kitStr = (kit: Kit, key: string): string | undefined => {
  const v = kit?.[key];
  return typeof v === "string" ? v : undefined;
};

/* ── Per-cell state props the variants matrix threads in. Real DS props on
   every covered component (disabled, validationStatus, indeterminate); state
   axis values that are pure CSS (hover/focus/rest/open) are rendered in their
   default state by every DS, which is honest for a static, store-free grid. ── */
type ValidationStatus = "error" | "warning" | "success" | undefined;

/* Salt validation status -> FormField validationStatus (no "success" slot;
   Salt FormField exposes error|warning). Success renders as the default field. */
function saltValidation(v: ValidationStatus): "error" | "warning" | undefined {
  return v === "error" ? "error" : v === "warning" ? "warning" : undefined;
}

/* ── SALT real subtree ── */
function SaltReal({ type, mode, saltDensity, props, kit }: Omit<RealComponentRendererProps, "system">) {
  const disabled = Boolean(props.disabled);
  let inner: React.ReactNode = null;
  if (type === "SimulatedButton") {
    const { sentiment, appearance } = saltButtonProps(props);
    inner = <SaltButton sentiment={sentiment} appearance={appearance} disabled={disabled} {...buttonActionProps(props)}>{buttonIcon(props) ?? s(props.label, "Button")}</SaltButton>;
  } else if (type === "SimulatedTextInput") {
    inner = (
      <SaltFormField validationStatus={saltValidation(props.validationStatus as ValidationStatus)} disabled={disabled}>
        <SaltFormFieldLabel>{s(props.label, "Label")}</SaltFormFieldLabel>
        {kit
          /* Kit only: Salt styles a read-only field differently from a
             normal one (no fill, a lighter edge), so the library mounts the
             normal, editable field, as the Salt page draws it. */
          ? <SaltInput key={s(props.value)} placeholder={s(props.placeholder)} defaultValue={s(props.value) || undefined} />
          /* No dash for an empty read-only field: the placeholder shows what goes there. */
          : <SaltInput placeholder={s(props.placeholder)} value={s(props.value) || undefined} readOnly emptyReadOnlyMarker="" />}
      </SaltFormField>
    );
  } else if (type === "SimulatedCheckbox") {
    /* Kit only (here and for the switch): Salt styles a read-only control
       differently from a normal one, so the library mounts the normal one. */
    inner = kit
      ? <SaltCheckbox label={s(props.label)} checked={Boolean(props.defaultChecked)} indeterminate={Boolean(props.indeterminate)} disabled={disabled} onChange={kitNoop} />
      : <SaltCheckbox label={s(props.label)} checked={Boolean(props.defaultChecked)} indeterminate={Boolean(props.indeterminate)} disabled={disabled} readOnly />;
  } else if (type === "SimulatedSwitch") {
    inner = kit
      ? <SaltSwitch label={s(props.label)} checked={Boolean(props.defaultOn)} disabled={disabled} onChange={kitNoop} />
      : <SaltSwitch label={s(props.label)} checked={Boolean(props.defaultOn)} disabled={disabled} readOnly />;
  } else if (type === "SimulatedCard") {
    inner = (
      <SaltCard>
        <h3 style={{ margin: "0 0 4px" }}>{s(props.title, "Card")}</h3>
        <p style={{ margin: 0 }}>{s(props.content)}</p>
      </SaltCard>
    );
  } else if (type === "SimulatedTitle") {
    const TitleComponent = ({ h1: SaltH1, h2: SaltH2, h3: SaltH3, h4: SaltH4 } as Record<string, React.ComponentType<{ children?: React.ReactNode }>>)[s(props.level, "h2")] ?? SaltH2;
    inner = <TitleComponent>{s(props.text, "Heading")}</TitleComponent>;
  } else if (type === "SimulatedLink") {
    inner = props.showIcon
      ? <SaltLink href="#" IconComponent={ChevronRightIcon}>{s(props.text, "Learn more")}</SaltLink>
      : <SaltLink href="#">{s(props.text, "Learn more")}</SaltLink>;
  } else if (type === "SimulatedBadge") {
    inner = <SaltBadge value={1}><SaltButton>{s(props.label, "Badge")}</SaltButton></SaltBadge>;
  } else if (type === "SimulatedPill") {
    inner = <SaltPill onClick={() => {}}>{s(props.label, "Tag")}</SaltPill>;
  } else if (type === "Alert") {
    const title = s(props.title) ? `${s(props.title)} ` : "";
    inner = <SaltBanner status={saltAlertStatus(s(props.variant, "info"))}><SaltBannerContent>{title}{s(props.message)}</SaltBannerContent></SaltBanner>;
  } else if (type === "AppBrand") {
    inner = <SaltText styleAs="h4"><strong>{s(props.label, "App Name")}</strong></SaltText>;
  } else if (type === "StatusPill") {
    inner = <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><SaltStatusIndicator status="success" /><SaltText>{s(props.label, "Active")}</SaltText></span>;
  } else if (type === "FooterText") {
    inner = <footer><SaltText variant="secondary">{s(props.label, "Footer")}</SaltText>{" "}<SaltText variant="secondary" styleAs="label">{s(props.version, "v1.0")}</SaltText></footer>;
  } else if (type === "SimulatedProgress") {
    // Salt LinearProgress ships a fixed 400px track (width AND min-width), so a
    // standalone progress block overflows narrow columns and floats at a fixed
    // size in wide ones. M3 (MuiLinearProgress) and Fluent (ProgressBar) both
    // fill their container; pin Salt to match so the bar tracks its cell width.
    inner = <SaltLinearProgress aria-label={s(props.label, "Progress")} value={num(props.value, 50)} style={{ width: "100%", minWidth: 0 }} />;
  } else if (type === "SimulatedAvatar") {
    inner = <SaltAvatar name={s(props.initials, "?")} size={saltAvatarSize(s(props.size, "md"))} />;
  } else if (type === "SimulatedStatCard") {
    inner = (
      <SaltCard>
        <SaltText styleAs="label" variant="secondary">{s(props.label, "Metric")}</SaltText>
        <SaltText styleAs="h2"><strong>{s(props.value, "0")}</strong></SaltText>
        {/* Salt LinearProgress ships a fixed 400px track (width AND
            min-width); inside a KPI card that overflows the card and reads
            as a full-bleed bar misaligned with the padded label/value. Pin
            it to the card's content width so the bar shares the text
            block's inset. hideLabel: the pct is a decorative fill here —
            M3/Fluent/uoaui stat cards show no number either. */}
        <SaltLinearProgress
          aria-label={s(props.label, "Metric")}
          value={num(props.pct, 0)}
          hideLabel
          style={{ width: "100%", minWidth: 0 }}
        />
      </SaltCard>
    );
  } else if (type === "SimulatedDropdown") {
    inner = <SaltDropdownField model={dropdownModel(props)} onChange={changeHandler(props)} />;
  } else if (type === "SimulatedSearchbox") {
    inner = <SaltInput placeholder={s(props.placeholder, "Search...")} startAdornment={<SearchIcon />} readOnly emptyReadOnlyMarker="" />;
  } else if (type === "SimulatedSegmentedGroup") {
    const opts = csv(props.optionsCsv, ["Day", "Week", "Month"]);
    const di = num(props.defaultIndex, 0);
    inner = <SaltSegmentedButtonGroup>{opts.map((o, i) => <SaltButton key={i} sentiment={i === di ? "accented" : "neutral"}>{s(o)}</SaltButton>)}</SaltSegmentedButtonGroup>;
  } else if (type === "SimulatedAccordion") {
    inner = (
      <SaltAccordion value="section">
        <SaltAccordionHeader>{s(props.title, "Section")}</SaltAccordionHeader>
        <SaltAccordionPanel>{s(props.content, "Content")}</SaltAccordionPanel>
      </SaltAccordion>
    );
  } else if (type === "NavItem") {
    inner = <SaltNavigationItem href="#" active={Boolean(props.active)} orientation="vertical">{s(props.label, "Nav")}</SaltNavigationItem>;
  } else if (type === "SimulatedDataTable") {
    const cols = Array.isArray(props.columns) ? (props.columns as string[]) : [...DEFAULT_TABLE_COLUMNS];
    const rows = Array.isArray(props.rows) ? (props.rows as unknown[]) : [...DEFAULT_TABLE_ROWS];
    inner = (
      <SaltTable>
        <SaltTHead>
          <SaltTR>{cols.map((c) => <SaltTH key={c}>{s(c)}</SaltTH>)}</SaltTR>
        </SaltTHead>
        <SaltTBody>
          {rows.map((row, ri) => (
            <SaltTR key={ri}>
              {cols.map((col, ci) => {
                const v = resolveCell(row, col, ci);
                if (!isStatusColumn(col)) return <SaltTD key={ci}>{v}</SaltTD>;
                const st = saltIndicatorStatus(statusToClass(v));
                return (
                  <SaltTD key={ci}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {st && <SaltStatusIndicator status={st} />}
                      <SaltText>{v}</SaltText>
                    </span>
                  </SaltTD>
                );
              })}
            </SaltTR>
          ))}
        </SaltTBody>
      </SaltTable>
    );
  }
  /* `applyClassesTo="scope"`: a SaltProvider with no provider above it is a
     ROOT provider, and Salt's default for a root provider is to stamp its
     `.salt-theme.salt-density-*` classes on <html> — leaking the theme to the
     whole document and, on the canvas, losing to the closer preview scope so
     density never changed. "scope" renders a wrapper element that carries the
     classes, so this subtree is self-contained and its density wins. */
  const provider = (
    <SaltProvider mode={mode} density={coerceDensity(saltDensity)} applyClassesTo="scope">
      {inner}
    </SaltProvider>
  );
  if (!kit) return provider;
  /* Kit skin: Salt's own theming variables, set to the kit's token values for
     the theme in view (JPM Brand teal, sentence-case actions, 4px corners, as
     the Salt page draws them from its GitHub source). Salt's shipped sheet
     is the UITK legacy look, which the kit documents as "Legacy". */
  const legacy = kit.theme === "legacy";
  const skin = {
    "--salt-palette-accent": kitStr(kit, "accent"),
    "--salt-actionable-accented-bold-background": kitStr(kit, "accent"),
    "--salt-actionable-accented-bold-background-hover": kitStr(kit, "accentHover"),
    "--salt-actionable-accented-bold-background-active": kitStr(kit, "accentActive"),
    "--salt-actionable-accented-bold-foreground": kitStr(kit, "accentFg"),
    "--salt-actionable-accented-bold-foreground-hover": kitStr(kit, "accentFg"),
    "--salt-actionable-accented-bold-foreground-active": kitStr(kit, "accentFg"),
    "--salt-actionable-accented-subtle-foreground": kitStr(kit, "accentText"),
    "--salt-actionable-accented-subtle-borderColor": kitStr(kit, "accent"),
    "--salt-actionable-accented-bold-borderColor": kitStr(kit, "accent"),
    "--salt-text-action-textTransform": legacy ? "uppercase" : "none",
    "--salt-text-action-fontWeight": "600",
    "--salt-palette-corner-weak": legacy ? "0px" : "4px",
    "--salt-palette-corner-weaker": legacy ? "0px" : "4px",
    "--salt-color-blue-500": kitStr(kit, "accent"),
    "--salt-palette-interact-cta-background": kitStr(kit, "accent"),
    "--salt-palette-interact-cta-background-hover": kitStr(kit, "accentHover"),
    "--salt-palette-interact-cta-background-active": kitStr(kit, "accentActive"),
    "--salt-palette-interact-primary-foreground": kitStr(kit, "fg"),
    "--salt-content-primary-foreground": kitStr(kit, "fg"),
    "--salt-content-secondary-foreground": kitStr(kit, "fg2"),
    "--salt-container-primary-background": kitStr(kit, "bg"),
    "--salt-container-secondary-background": kitStr(kit, "bg2"),
    "--salt-container-primary-borderColor": kitStr(kit, "border"),
    "--salt-editable-primary-background": kitStr(kit, "bg"),
    "--salt-editable-borderColor": kitStr(kit, "border"),
    "--salt-selectable-borderColor": kitStr(kit, "borderStrong"),
    "--salt-accent-background": kitStr(kit, "accent"),
    "--salt-accent-foreground": kitStr(kit, "accentFg"),
    "--salt-palette-navigate-default": kitStr(kit, "accentText"),
    "--salt-content-foreground-highlight": kitStr(kit, "accentText"),
  };
  /* The provider's scope element re-declares Salt's variables on itself, so
     the skin must be declared on that element with a stronger selector than
     Salt's own `.salt-theme`. Values are the kit's hex tokens only. */
  const decls = Object.entries(skin)
    .filter(([, v]) => typeof v === "string" && /^(#[0-9a-fA-F]{3,8}|none|uppercase|[0-9]+(px)?)$/.test(v))
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  return (
    <div className="kit-salt-skin">
      <style dangerouslySetInnerHTML={{ __html: `.kit-salt-skin .salt-theme,.kit-salt-skin .salt-theme-next{${decls}}` }} />
      {provider}
    </div>
  );
}

/* ── M3 (MUI) real subtree ── */
function M3Real({ type, mode, saltDensity, props, kit }: Omit<RealComponentRendererProps, "system">) {
  /* createTheme with the active mode; emotion styles are scoped per component
     (no global reset). MUI has no global density knob, so the shared density
     level becomes theme-wide default `size` props: every sized component in
     this subtree follows the builder's High/Medium/Low/Touch control without
     each branch repeating the mapping. Memoise so the theme isn't rebuilt
     every render. */
  const density = coerceDensity(saltDensity);
  const theme = React.useMemo(() => {
    const size3 = muiSize(density);
    const size2 = muiSize2(density);
    /* Kit skin: the real M3 colour roles, pill corners, sentence case and
       Roboto, as the Material page draws them. The builder passes no kit and
       keeps MUI's default theme. */
    const k = kit;
    const c = (key: string) => kitStr(k, key);
    const palette = k
      ? {
          mode,
          primary: { main: c("primary")!, contrastText: c("onPrimary") },
          secondary: { main: c("secondary") ?? c("primary")!, contrastText: c("onSecondary") },
          error: { main: c("error") ?? "#B3261E", contrastText: c("onError") },
          background: { default: c("surface"), paper: c("surfaceContainerLow") ?? c("surface") },
          text: { primary: c("onSurface"), secondary: c("onSurfaceVariant") },
          divider: c("outlineVariant"),
        }
      : { mode };
    return createTheme({
      palette,
      ...(k && {
        shape: { borderRadius: 12 },
        typography: { fontFamily: "Roboto, sans-serif", button: { textTransform: "none", fontWeight: 500, letterSpacing: "0.1px" } },
      }),
      components: {
        MuiButton: {
          defaultProps: { size: size3, ...(k && { disableElevation: true }) },
          ...(k && {
            styleOverrides: {
              root: { borderRadius: 9999, height: 40, padding: "0 24px", fontSize: 14 },
              outlined: { borderColor: c("outline") },
              text: { color: c("primary") },
            },
          }),
        },
        ...(k && {
          MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 4 }, notchedOutline: { borderColor: c("outline") } } },
          MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: "none", borderRadius: 12 } } },
        }),
        ...(k && {
          /* The kit's switch has no padding of its own (Material's track is
             the whole control), so the label needs a real gap and must not
             keep the negative margin MUI uses to offset that padding. Only a
             label that holds a switch; a checkbox keeps MUI's spacing. */
          MuiFormControlLabel: { styleOverrides: { root: { "&:has(.MuiSwitch-root)": { marginLeft: 0, gap: 12 } } } },
        }),
        MuiCheckbox: { defaultProps: { size: size3 } },
        MuiToggleButtonGroup: { defaultProps: { size: size3 } },
        MuiTextField: { defaultProps: { size: size2 } },
        MuiFormControl: { defaultProps: { size: size2 } },
        /* Chip and Switch carry a default size for the builder AND, for the
           kit only, the Material shapes. One key each: a second key of the
           same name later in this literal would replace the first. */
        MuiChip: {
          defaultProps: { size: size2 },
          ...(k && {
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
          }),
        },
        MuiSwitch: {
          defaultProps: { size: size2 },
          ...(k && {
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
          }),
        },
        MuiTable: { defaultProps: { size: size2 } },
      },
    });
  }, [mode, density, kit]);
  const disabled = Boolean(props.disabled);
  const validation = props.validationStatus as ValidationStatus;
  let inner: React.ReactNode = null;
  if (type === "SimulatedButton") {
    const { variant, color } = muiButtonProps(s(props.variant, "primary"));
    const icon = buttonIcon(props);
    /* An icon-only button is Material's IconButton. */
    inner = icon
      ? <MuiIconButton color="inherit" disabled={disabled} {...buttonActionProps(props)}>{icon}</MuiIconButton>
      : kit && s(props.variant) === "secondary"
      /* Kit only: Material's secondary action is the filled tonal button
         (secondary container), not a second outlined one. */
      ? <MuiButton variant="contained" disabled={disabled} sx={{ bgcolor: kitStr(kit, "secondaryContainer"), color: kitStr(kit, "onSecondaryContainer"), "&:hover": { bgcolor: kitStr(kit, "secondaryContainer") } }} {...buttonActionProps(props)}>{s(props.label, "Button")}</MuiButton>
      : <MuiButton variant={variant} color={color} disabled={disabled} {...buttonActionProps(props)}>{s(props.label, "Button")}</MuiButton>;
  } else if (type === "SimulatedTextInput") {
    inner = (
      <MuiTextField
        label={s(props.label, "Label")}
        placeholder={s(props.placeholder)}
        value={s(props.value) || undefined}
        variant="outlined"
        error={validation === "error"}
        color={validation === "success" ? "success" : validation === "warning" ? "warning" : undefined}
        focused={validation === "success" || validation === "warning" ? true : undefined}
        disabled={disabled}
        slotProps={{ input: { readOnly: true } }}
      />
    );
  } else if (type === "SimulatedCheckbox") {
    inner = <MuiFormControlLabel disabled={disabled} control={<MuiCheckbox checked={Boolean(props.defaultChecked)} indeterminate={Boolean(props.indeterminate)} readOnly />} label={s(props.label)} />;
  } else if (type === "SimulatedSwitch") {
    inner = <MuiFormControlLabel disabled={disabled} control={<MuiSwitch checked={Boolean(props.defaultOn)} readOnly />} label={s(props.label)} />;
  } else if (type === "SimulatedCard") {
    inner = (
      <MuiCard>
        <MuiCardContent>
          <h3 style={{ margin: "0 0 4px" }}>{s(props.title, "Card")}</h3>
          <p style={{ margin: 0 }}>{s(props.content)}</p>
        </MuiCardContent>
      </MuiCard>
    );
  } else if (type === "SimulatedTitle") {
    const variant = ({ h1: "h3", h2: "h4", h3: "h5", h4: "h6" } as Record<string, "h3" | "h4" | "h5" | "h6">)[s(props.level, "h2")] ?? "h4";
    inner = <MuiTypography variant={variant} component={s(props.level, "h2") as React.ElementType}>{s(props.text, "Heading")}</MuiTypography>;
  } else if (type === "SimulatedLink") {
    inner = <MuiLink href="#" underline="hover">{s(props.text, "Learn more")}</MuiLink>;
  } else if (type === "SimulatedBadge") {
    inner = <MuiChip label={s(props.label, "Badge")} color={muiChipColor(s(props.status, "default"))} />;
  } else if (type === "SimulatedPill") {
    inner = <MuiChip label={s(props.label, "Tag")} color={muiChipColor(s(props.status, "default"))} {...(props.dismissible ? { onDelete: () => {} } : {})} />;
  } else if (type === "Alert") {
    inner = <MuiAlert severity={saltAlertStatus(s(props.variant, "info"))}><MuiAlertTitle>{s(props.title, "Alert")}</MuiAlertTitle>{s(props.message)}</MuiAlert>;
  } else if (type === "AppBrand") {
    inner = <MuiTypography variant="h6" noWrap component="div">{s(props.label, "App Name")}</MuiTypography>;
  } else if (type === "StatusPill") {
    inner = <MuiChip label={s(props.label, "Active")} color="success" variant="outlined" />;
  } else if (type === "FooterText") {
    inner = <MuiTypography variant="body2" color="text.secondary">{s(props.label, "Footer")} · {s(props.version, "v1.0")}</MuiTypography>;
  } else if (type === "SimulatedProgress") {
    inner = <MuiLinearProgress variant="determinate" value={num(props.value, 50)} />;
  } else if (type === "SimulatedAvatar") {
    const dim = ({ sm: 28, md: 40, lg: 56 } as Record<string, number>)[s(props.size, "md")] ?? 40;
    inner = <MuiAvatar sx={{ width: dim, height: dim }}>{s(props.initials, "?")}</MuiAvatar>;
  } else if (type === "SimulatedStatCard") {
    inner = (
      <MuiCard variant="outlined">
        <MuiCardContent>
          <MuiTypography variant="body2" color="text.secondary">{s(props.label, "Metric")}</MuiTypography>
          <MuiTypography variant="h4">{s(props.value, "0")}</MuiTypography>
          <MuiLinearProgress variant="determinate" value={num(props.pct, 0)} sx={{ mt: 1 }} />
        </MuiCardContent>
      </MuiCard>
    );
  } else if (type === "SimulatedDropdown") {
    inner = <MuiDropdownField model={dropdownModel(props)} onChange={changeHandler(props)} />;
  } else if (type === "SimulatedSearchbox") {
    inner = (
      <MuiTextField
        placeholder={s(props.placeholder, "Search...")}
        variant="outlined"
        slotProps={{ input: { readOnly: true, startAdornment: (<MuiInputAdornment position="start"><span className="material-symbols-outlined">search</span></MuiInputAdornment>) } }}
      />
    );
  } else if (type === "SimulatedSegmentedGroup") {
    const opts = csv(props.optionsCsv, ["Day", "Week", "Month"]);
    const selected = slug(opts[num(props.defaultIndex, 0)] ?? opts[0]);
    inner = (
      <MuiToggleButtonGroup exclusive value={selected}>
        {opts.map((o) => <MuiToggleButton key={slug(o)} value={slug(o)}>{s(o)}</MuiToggleButton>)}
      </MuiToggleButtonGroup>
    );
  } else if (type === "SimulatedAccordion") {
    inner = (
      <MuiAccordion>
        <MuiAccordionSummary>
          <MuiTypography>{s(props.title, "Section")}</MuiTypography>
        </MuiAccordionSummary>
        <MuiAccordionDetails>
          <MuiTypography>{s(props.content)}</MuiTypography>
        </MuiAccordionDetails>
      </MuiAccordion>
    );
  } else if (type === "NavItem") {
    inner = (
      <MuiListItem disablePadding>
        <MuiListItemButton selected={Boolean(props.active)}>
          <MuiListItemIcon><span className="material-symbols-outlined">{s(props.icon, "home")}</span></MuiListItemIcon>
          <MuiListItemText primary={s(props.label, "Nav")} />
        </MuiListItemButton>
      </MuiListItem>
    );
  } else if (type === "SimulatedDataTable") {
    const cols = Array.isArray(props.columns) ? (props.columns as string[]) : [...DEFAULT_TABLE_COLUMNS];
    const rows = Array.isArray(props.rows) ? (props.rows as unknown[]) : [...DEFAULT_TABLE_ROWS];
    inner = (
      <MuiTableContainer component={MuiPaper}>
        <MuiTable>
          <MuiTableHead>
            <MuiTableRow>{cols.map((c) => <MuiTableCell key={c} sx={{ fontWeight: 600 }}>{s(c)}</MuiTableCell>)}</MuiTableRow>
          </MuiTableHead>
          <MuiTableBody>
            {rows.map((row, ri) => (
              <MuiTableRow key={ri} hover>
                {cols.map((col, ci) => {
                  const v = resolveCell(row, col, ci);
                  return <MuiTableCell key={ci}>{isStatusColumn(col) ? <MuiChip label={v} color={muiChipColor(statusToClass(v))} /> : v}</MuiTableCell>;
                })}
              </MuiTableRow>
            ))}
          </MuiTableBody>
        </MuiTable>
      </MuiTableContainer>
    );
  }
  return <MuiThemeProvider theme={theme}>{inner}</MuiThemeProvider>;
}

/* ── Fluent real subtree ── */
function FluentReal({ type, mode, saltDensity, props }: Omit<RealComponentRendererProps, "system">) {
  const disabled = Boolean(props.disabled);
  const validation = props.validationStatus as ValidationStatus;
  /* Fluent Field validationState is error|warning|success|none. */
  const fluentValidation = validation ?? undefined;
  /* Fluent 2 sizes per component (no provider-level density): the shared
     level becomes each component's `size`, on the axis that component has. */
  const density = coerceDensity(saltDensity);
  const size = fluentSize(density);
  const size2 = fluentSize2(density);
  let inner: React.ReactNode = null;
  if (type === "SimulatedButton") {
    const { appearance, style } = fluentButtonProps(s(props.variant, "primary"));
    const icon = buttonIcon(props);
    inner = icon
      /* An icon-only quiet button is Fluent's transparent appearance. */
      ? <FluentButton appearance={appearance === "subtle" ? "transparent" : appearance} style={style} disabled={disabled} size={size} icon={icon as React.ReactElement} {...buttonActionProps(props)} />
      : <FluentButton appearance={appearance} style={style} disabled={disabled} size={size} {...buttonActionProps(props)}>{s(props.label, "Button")}</FluentButton>;
  } else if (type === "SimulatedTextInput") {
    inner = (
      <FluentField label={s(props.label, "Label")} validationState={fluentValidation} size={size}>
        <FluentInput placeholder={s(props.placeholder)} value={s(props.value) || undefined} disabled={disabled} readOnly size={size} />
      </FluentField>
    );
  } else if (type === "SimulatedCheckbox") {
    inner = <FluentCheckbox label={s(props.label)} checked={Boolean(props.indeterminate) ? "mixed" : Boolean(props.defaultChecked)} disabled={disabled} readOnly size={fluentCheckboxSize(density)} />;
  } else if (type === "SimulatedSwitch") {
    inner = <FluentSwitch label={s(props.label)} checked={Boolean(props.defaultOn)} disabled={disabled} readOnly size={size2} />;
  } else if (type === "SimulatedCard") {
    inner = (
      <FluentCard size={size}>
        <FluentCardHeader header={s(props.title, "Card")} description={s(props.content)} />
      </FluentCard>
    );
  } else if (type === "SimulatedTitle") {
    const TitleComponent = ({ h1: FluentTitle1, h2: FluentTitle2, h3: FluentTitle3, h4: FluentSubtitle2 } as Record<string, React.ComponentType<{ children?: React.ReactNode }>>)[s(props.level, "h2")] ?? FluentTitle2;
    inner = <TitleComponent>{s(props.text, "Heading")}</TitleComponent>;
  } else if (type === "SimulatedLink") {
    inner = <FluentLink href="#">{s(props.text, "Learn more")}</FluentLink>;
  } else if (type === "SimulatedBadge") {
    const color = ({ default: "brand", info: "informative", success: "success", warning: "warning", error: "danger" } as Record<string, "brand" | "informative" | "success" | "warning" | "danger">)[s(props.status, "default")] ?? "brand";
    inner = <FluentBadge appearance="filled" color={color} size={size}>{s(props.label, "Badge")}</FluentBadge>;
  } else if (type === "SimulatedPill") {
    inner = <FluentTag dismissible={Boolean(props.dismissible)} size={size2}>{s(props.label, "Tag")}</FluentTag>;
  } else if (type === "Alert") {
    inner = (
      <FluentMessageBar intent={saltAlertStatus(s(props.variant, "info"))}>
        <FluentMessageBarBody>
          {s(props.title) ? <FluentMessageBarTitle>{s(props.title)}</FluentMessageBarTitle> : null}
          {s(props.message)}
        </FluentMessageBarBody>
      </FluentMessageBar>
    );
  } else if (type === "AppBrand") {
    inner = <FluentTitle3>{s(props.label, "App Name")}</FluentTitle3>;
  } else if (type === "StatusPill") {
    inner = <FluentBadge appearance="filled" color="success" size={size}>{s(props.label, "Active")}</FluentBadge>;
  } else if (type === "FooterText") {
    inner = <FluentCaption1>{s(props.label, "Footer")} · {s(props.version, "v1.0")}</FluentCaption1>;
  } else if (type === "SimulatedProgress") {
    inner = (
      <FluentField label={s(props.label, "Progress")} size={size}>
        <FluentProgressBar value={num(props.value, 50) / 100} />
      </FluentField>
    );
  } else if (type === "SimulatedAvatar") {
    const size = ({ sm: 24, md: 32, lg: 48 } as Record<string, 24 | 32 | 48>)[s(props.size, "md")] ?? 32;
    inner = <FluentAvatar name={s(props.initials, "?")} size={size} />;
  } else if (type === "SimulatedStatCard") {
    inner = (
      <FluentCard size={size}>
        <FluentCardHeader header={<FluentCaption1>{s(props.label, "Metric")}</FluentCaption1>} />
        <FluentTitle3>{s(props.value, "0")}</FluentTitle3>
        <FluentProgressBar value={num(props.pct, 0) / 100} />
      </FluentCard>
    );
  } else if (type === "SimulatedDropdown") {
    inner = <FluentDropdownField model={dropdownModel(props)} size={size} onChange={changeHandler(props)} />;
  } else if (type === "SimulatedSearchbox") {
    inner = <FluentSearchBox placeholder={s(props.placeholder, "Search...")} size={size} />;
  } else if (type === "SimulatedSegmentedGroup") {
    const opts = csv(props.optionsCsv, ["Day", "Week", "Month"]);
    const di = num(props.defaultIndex, 0);
    inner = <FluentToolbar aria-label="Segmented" size={size2}>{opts.map((o, i) => <FluentToggleButton key={i} appearance="subtle" checked={i === di} size={size}>{s(o)}</FluentToggleButton>)}</FluentToolbar>;
  } else if (type === "SimulatedAccordion") {
    inner = (
      <FluentAccordion collapsible>
        <FluentAccordionItem value="1">
          <FluentAccordionHeader>{s(props.title, "Section")}</FluentAccordionHeader>
          <FluentAccordionPanel>{s(props.content)}</FluentAccordionPanel>
        </FluentAccordionItem>
      </FluentAccordion>
    );
  } else if (type === "NavItem") {
    inner = <FluentButton appearance={props.active ? "primary" : "subtle"} size={size}>{s(props.label, "Nav")}</FluentButton>;
  } else if (type === "SimulatedDataTable") {
    const cols = Array.isArray(props.columns) ? (props.columns as string[]) : [...DEFAULT_TABLE_COLUMNS];
    const rows = Array.isArray(props.rows) ? (props.rows as unknown[]) : [...DEFAULT_TABLE_ROWS];
    /* status -> Fluent Badge color (Tag has no color prop; Badge does, and is
       what the badge blocks + export already use). Fluent has no purple, so the
       funnel uses: info (MQL) -> brand (a clean solid blue), indigo (SQL) ->
       important (high-contrast) to stay distinct. */
    const tagColor = (st: string): "success" | "warning" | "subtle" | "brand" | "important" | "danger" =>
      st === "success" ? "success"
      : st === "warning" ? "warning"
      : st === "info" ? "brand"
      : st === "indigo" ? "important"
      : st === "error" ? "danger"
      : "subtle";
    inner = (
      <FluentTable size={size2}>
        <FluentTableHeader>
          <FluentTableRow>{cols.map((c) => <FluentTableHeaderCell key={c}>{s(c)}</FluentTableHeaderCell>)}</FluentTableRow>
        </FluentTableHeader>
        <FluentTableBody>
          {rows.map((row, ri) => (
            <FluentTableRow key={ri}>
              {cols.map((col, ci) => {
                const v = resolveCell(row, col, ci);
                return <FluentTableCell key={ci}>{isStatusColumn(col) ? <FluentBadge appearance="filled" color={tagColor(statusToClass(v))} size={size}>{v}</FluentBadge> : v}</FluentTableCell>;
              })}
            </FluentTableRow>
          ))}
        </FluentTableBody>
      </FluentTable>
    );
  }
  /* FluentProvider scopes its `--color*` vars + griffel styles to a wrapper
     element; webLight/webDark drive the mode. No global reset. */
  return <FluentProvider theme={mode === "dark" ? webDarkTheme : webLightTheme}>{inner}</FluentProvider>;
}

/* ── uoaui real subtree (W6-P2a) ──
   uoaui has no npm package: its components are `.a-*` classes styled by the
   DS's own CSS. We reuse the EXISTING theme mechanism the documentation file +
   gallery use — getFullCSS('uoaui', theme, density) = uoauiBuildCSS(theme) +
   getUoauiDensityCSS(density) — then SCOPE the result to `.preview-uoaui.a-app`
   so the DS's global `*{}` reset and `:root{}` block can't leak onto the app /
   builder canvas. The real `.a-*` markup comes from realBlockMap. CSS-only, so
   there's no emotion/griffel engine to gate; the caller's mountedReal flag still
   keeps the <style> client-only (it's deterministic anyway). */

/* The wrapper that scopes uoaui's CSS. `.preview-uoaui` already exists in
   builder.css (bridges --a-* to --ds-*); `.a-app` is the uoaui app-shell
   convention the documentation surface wraps demos in. */
const UOAUI_SCOPE = ".preview-uoaui.a-app";

/* Prefix a comma-separated selector list with UOAUI_SCOPE so nothing escapes
   the wrapper. `:root` becomes the wrapper itself (so :root-declared --a-*
   tokens resolve on it); bare `*` / `*,*::before,*::after` resets become
   descendant selectors of the wrapper. */
function scopeSelectorList(selectorList: string): string {
  return selectorList
    .split(",")
    .map((sel) => {
      const t = sel.trim();
      if (!t) return "";
      if (t === ":root") return UOAUI_SCOPE;
      return `${UOAUI_SCOPE} ${t}`;
    })
    .filter(Boolean)
    .join(", ");
}

/* Scope the uoaui CSS to UOAUI_SCOPE via a brace-depth walk (robust where a
   per-rule regex is fragile on the leading rule + nested at-rules). Each
   top-level rule's selector is prefixed; a nested at-rule (@media
   prefers-reduced-motion) keeps its preamble and has its inner rules scoped.
   sanitizeCSS runs first; we also drop the leftover ` url(...);` that
   sanitizeCSS leaves after stripping the `@import` keyword, so it isn't
   mis-parsed as a selector. */
function scopeUoauiCSS(css: string): string {
  /* Remove the orphaned @font import statement (sanitizeCSS strips the
     `@import` keyword but leaves `url(...);`). */
  const cleaned = css.replace(/^\s*url\([^)]*\)\s*;/gm, "");

  let out = "";
  let i = 0;
  const n = cleaned.length;
  while (i < n) {
    const brace = cleaned.indexOf("{", i);
    if (brace === -1) {
      out += cleaned.slice(i);
      break;
    }
    const preamble = cleaned.slice(i, brace);
    const trimmed = preamble.trim();

    /* Find the matching close brace for this block. */
    let depth = 1;
    let j = brace + 1;
    for (; j < n && depth > 0; j++) {
      if (cleaned[j] === "{") depth++;
      else if (cleaned[j] === "}") depth--;
    }
    const body = cleaned.slice(brace + 1, j - 1);

    if (trimmed.startsWith("@")) {
      /* At-rule (e.g. @media): keep preamble, scope its inner rules. */
      out += `${preamble}{${scopeUoauiCSS(body)}}`;
    } else {
      out += `${scopeSelectorList(preamble)} {${body}}`;
    }
    i = j;
  }
  return out;
}

function UoauiReal({ type, mode, saltDensity, props, kit }: Omit<RealComponentRendererProps, "system">) {
  /* Resolve the uoaui theme object from the active mode (dark/light) and build
     the DS CSS via the shared registry helper. Memoised on mode+density so the
     string isn't reassembled every render. setUoauiT inside uoauiBuildCSS is a
     pure read of the passed theme, so this is render-safe. */
  const density = coerceDensity(saltDensity);
  const scopedCss = React.useMemo(() => {
    /* Kit skin: the kit's own uoaui theme (it may carry a custom accent). */
    const theme = (kit as Parameters<typeof getFullCSS>[1] | undefined) ?? getTheme("uoaui", mode === "dark" ? "dark" : "light");
    return scopeUoauiCSS(sanitizeCSS(getFullCSS("uoaui", theme, density)));
  }, [mode, density, kit]);

  const render = getRealBlockRenderer("uoaui", type);
  const inner = render ? render(props, { density }) : null;

  return (
    <div className="preview-uoaui a-app">
      <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
      {inner}
    </div>
  );
}

/* ── Carbon real subtree (W6-P2b) ──
   Renders real @carbon/react components (from realBlockMap) inside a
   `.carbon-live-scope` wrapper. The wrapper ALSO carries Carbon's theme class
   (`cds--white` light / `cds--g100` dark) so the build-time-scoped sheet's
   `.carbon-live-scope .cds--white { --cds-*: … }` block sets the official token
   values on the subtree (Carbon themes are class-based, not attribute-based).
   CarbonScopeStyles lazy-injects public/carbon-scoped.css once on first mount,
   so the heavy sheet only loads when Carbon is actually on screen. */
function CarbonReal({ type, mode, saltDensity, props, kit }: Omit<RealComponentRendererProps, "system">) {
  const themeClass = mode === "dark" ? "cds--g100" : "cds--white";
  const render = getRealBlockRenderer("carbon", type);
  /* Carbon sizes per component (sm/md/lg field heights); the map applies the
     shared density level to each real component's `size`. */
  const inner = render ? render(props, kit ? { density: coerceDensity(saltDensity), kit: true } : { density: coerceDensity(saltDensity) }) : null;

  return (
    <>
      <CarbonScopeStyles kit={Boolean(kit)} />
      <div className={`carbon-live-scope ${themeClass}`} data-carbon-theme={mode === "dark" ? "g100" : "white"}>
        {inner}
      </div>
    </>
  );
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
  kit,
}: RealComponentRendererProps): React.ReactElement | null {
  if (!canRenderReal(system, type)) return null;

  if (system === "salt") return <SaltReal type={type} mode={mode} saltDensity={saltDensity} props={props} kit={kit} />;
  if (system === "m3") return <M3Real type={type} mode={mode} saltDensity={saltDensity} props={props} kit={kit} />;
  if (system === "fluent") return <FluentReal type={type} mode={mode} saltDensity={saltDensity} props={props} />;
  if (system === "uoaui") return <UoauiReal type={type} mode={mode} saltDensity={saltDensity} props={props} kit={kit} />;
  if (system === "carbon") return <CarbonReal type={type} mode={mode} saltDensity={saltDensity} props={props} kit={kit} />;
  return null;
}
