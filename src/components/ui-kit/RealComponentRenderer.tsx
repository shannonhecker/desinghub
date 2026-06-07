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
import { sanitizeCSS } from "@/lib/sanitizeCSS";
import { getRealBlockRenderer } from "@/components/ui-kit/realBlockMap";
import { CarbonScopeStyles } from "@/components/ui-kit/CarbonScopeStyles";

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
function muiChipColor(status: string): "default" | "info" | "success" | "warning" | "error" {
  const map: Record<string, "default" | "info" | "success" | "warning" | "error"> = { default: "default", info: "info", success: "success", warning: "warning", error: "error" };
  return map[status] ?? "default";
}

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
function SaltReal({ type, mode, saltDensity, props }: Omit<RealComponentRendererProps, "system">) {
  const disabled = Boolean(props.disabled);
  let inner: React.ReactNode = null;
  if (type === "SimulatedButton") {
    const { sentiment, appearance } = saltButtonProps(s(props.variant, "primary"));
    inner = <SaltButton sentiment={sentiment} appearance={appearance} disabled={disabled}>{s(props.label, "Button")}</SaltButton>;
  } else if (type === "SimulatedTextInput") {
    inner = (
      <SaltFormField validationStatus={saltValidation(props.validationStatus as ValidationStatus)} disabled={disabled}>
        <SaltFormFieldLabel>{s(props.label, "Label")}</SaltFormFieldLabel>
        <SaltInput placeholder={s(props.placeholder)} value={s(props.value) || undefined} readOnly />
      </SaltFormField>
    );
  } else if (type === "SimulatedCheckbox") {
    inner = <SaltCheckbox label={s(props.label)} checked={Boolean(props.defaultChecked)} indeterminate={Boolean(props.indeterminate)} disabled={disabled} readOnly />;
  } else if (type === "SimulatedSwitch") {
    inner = <SaltSwitch label={s(props.label)} checked={Boolean(props.defaultOn)} disabled={disabled} readOnly />;
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
    inner = <SaltLinearProgress aria-label={s(props.label, "Progress")} value={num(props.value, 50)} />;
  } else if (type === "SimulatedAvatar") {
    inner = <SaltAvatar name={s(props.initials, "?")} size={saltAvatarSize(s(props.size, "md"))} />;
  } else if (type === "SimulatedStatCard") {
    inner = (
      <SaltCard>
        <SaltText styleAs="label" variant="secondary">{s(props.label, "Metric")}</SaltText>
        <SaltText styleAs="h2"><strong>{s(props.value, "0")}</strong></SaltText>
        <SaltLinearProgress aria-label={s(props.label, "Metric")} value={num(props.pct, 0)} />
      </SaltCard>
    );
  } else if (type === "SimulatedDropdown") {
    inner = (
      <SaltDropdown placeholder={s(props.placeholder, "Select an option")}>
        <SaltOption value="option-1">Option 1</SaltOption>
        <SaltOption value="option-2">Option 2</SaltOption>
      </SaltDropdown>
    );
  } else if (type === "SimulatedSearchbox") {
    inner = <SaltInput placeholder={s(props.placeholder, "Search...")} startAdornment={<SearchIcon />} readOnly />;
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
    const cols = Array.isArray(props.columns) ? (props.columns as string[]) : ["Name", "Status"];
    const rows = Array.isArray(props.rows) ? (props.rows as unknown[]) : [];
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
                return <SaltTD key={ci}>{isStatusColumn(col) ? <SaltPill onClick={() => {}}>{v}</SaltPill> : v}</SaltTD>;
              })}
            </SaltTR>
          ))}
        </SaltTBody>
      </SaltTable>
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
  const disabled = Boolean(props.disabled);
  const validation = props.validationStatus as ValidationStatus;
  let inner: React.ReactNode = null;
  if (type === "SimulatedButton") {
    const { variant, color } = muiButtonProps(s(props.variant, "primary"));
    inner = <MuiButton variant={variant} color={color} disabled={disabled}>{s(props.label, "Button")}</MuiButton>;
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
    inner = <MuiChip label={s(props.label, "Badge")} color={muiChipColor(s(props.status, "default"))} size="small" />;
  } else if (type === "SimulatedPill") {
    inner = <MuiChip label={s(props.label, "Tag")} color={muiChipColor(s(props.status, "default"))} {...(props.dismissible ? { onDelete: () => {} } : {})} />;
  } else if (type === "Alert") {
    inner = <MuiAlert severity={saltAlertStatus(s(props.variant, "info"))}><MuiAlertTitle>{s(props.title, "Alert")}</MuiAlertTitle>{s(props.message)}</MuiAlert>;
  } else if (type === "AppBrand") {
    inner = <MuiTypography variant="h6" noWrap component="div">{s(props.label, "App Name")}</MuiTypography>;
  } else if (type === "StatusPill") {
    inner = <MuiChip label={s(props.label, "Active")} color="success" size="small" variant="outlined" />;
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
    inner = (
      <MuiFormControl fullWidth size="small">
        <MuiInputLabel id="sel-label">{s(props.placeholder, "Select an option")}</MuiInputLabel>
        <MuiSelect labelId="sel-label" label={s(props.placeholder, "Select an option")} defaultValue="">
          <MuiMenuItem value="opt1">Option 1</MuiMenuItem>
          <MuiMenuItem value="opt2">Option 2</MuiMenuItem>
        </MuiSelect>
      </MuiFormControl>
    );
  } else if (type === "SimulatedSearchbox") {
    inner = (
      <MuiTextField
        placeholder={s(props.placeholder, "Search...")}
        variant="outlined"
        size="small"
        slotProps={{ input: { readOnly: true, startAdornment: (<MuiInputAdornment position="start"><span className="material-symbols-outlined">search</span></MuiInputAdornment>) } }}
      />
    );
  } else if (type === "SimulatedSegmentedGroup") {
    const opts = csv(props.optionsCsv, ["Day", "Week", "Month"]);
    const selected = slug(opts[num(props.defaultIndex, 0)] ?? opts[0]);
    inner = (
      <MuiToggleButtonGroup exclusive value={selected} size="small">
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
    const cols = Array.isArray(props.columns) ? (props.columns as string[]) : ["Name", "Status"];
    const rows = Array.isArray(props.rows) ? (props.rows as unknown[]) : [];
    inner = (
      <MuiTableContainer component={MuiPaper}>
        <MuiTable size="small">
          <MuiTableHead>
            <MuiTableRow>{cols.map((c) => <MuiTableCell key={c} sx={{ fontWeight: 600 }}>{s(c)}</MuiTableCell>)}</MuiTableRow>
          </MuiTableHead>
          <MuiTableBody>
            {rows.map((row, ri) => (
              <MuiTableRow key={ri} hover>
                {cols.map((col, ci) => {
                  const v = resolveCell(row, col, ci);
                  return <MuiTableCell key={ci}>{isStatusColumn(col) ? <MuiChip label={v} color={muiChipColor(statusToClass(v))} size="small" /> : v}</MuiTableCell>;
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
function FluentReal({ type, mode, props }: Omit<RealComponentRendererProps, "system">) {
  const disabled = Boolean(props.disabled);
  const validation = props.validationStatus as ValidationStatus;
  /* Fluent Field validationState is error|warning|success|none. */
  const fluentValidation = validation ?? undefined;
  let inner: React.ReactNode = null;
  if (type === "SimulatedButton") {
    const { appearance, style } = fluentButtonProps(s(props.variant, "primary"));
    inner = <FluentButton appearance={appearance} style={style} disabled={disabled}>{s(props.label, "Button")}</FluentButton>;
  } else if (type === "SimulatedTextInput") {
    inner = (
      <FluentField label={s(props.label, "Label")} validationState={fluentValidation}>
        <FluentInput placeholder={s(props.placeholder)} value={s(props.value) || undefined} disabled={disabled} readOnly />
      </FluentField>
    );
  } else if (type === "SimulatedCheckbox") {
    inner = <FluentCheckbox label={s(props.label)} checked={Boolean(props.indeterminate) ? "mixed" : Boolean(props.defaultChecked)} disabled={disabled} readOnly />;
  } else if (type === "SimulatedSwitch") {
    inner = <FluentSwitch label={s(props.label)} checked={Boolean(props.defaultOn)} disabled={disabled} readOnly />;
  } else if (type === "SimulatedCard") {
    inner = (
      <FluentCard>
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
    inner = <FluentBadge appearance="filled" color={color}>{s(props.label, "Badge")}</FluentBadge>;
  } else if (type === "SimulatedPill") {
    inner = <FluentTag dismissible={Boolean(props.dismissible)}>{s(props.label, "Tag")}</FluentTag>;
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
    inner = <FluentBadge appearance="filled" color="success">{s(props.label, "Active")}</FluentBadge>;
  } else if (type === "FooterText") {
    inner = <FluentCaption1>{s(props.label, "Footer")} · {s(props.version, "v1.0")}</FluentCaption1>;
  } else if (type === "SimulatedProgress") {
    inner = (
      <FluentField label={s(props.label, "Progress")}>
        <FluentProgressBar value={num(props.value, 50) / 100} />
      </FluentField>
    );
  } else if (type === "SimulatedAvatar") {
    const size = ({ sm: 24, md: 32, lg: 48 } as Record<string, 24 | 32 | 48>)[s(props.size, "md")] ?? 32;
    inner = <FluentAvatar name={s(props.initials, "?")} size={size} />;
  } else if (type === "SimulatedStatCard") {
    inner = (
      <FluentCard>
        <FluentCardHeader header={<FluentCaption1>{s(props.label, "Metric")}</FluentCaption1>} />
        <FluentTitle3>{s(props.value, "0")}</FluentTitle3>
        <FluentProgressBar value={num(props.pct, 0) / 100} />
      </FluentCard>
    );
  } else if (type === "SimulatedDropdown") {
    inner = (
      <FluentDropdown placeholder={s(props.placeholder, "Select an option")}>
        <FluentOption>Option 1</FluentOption>
        <FluentOption>Option 2</FluentOption>
      </FluentDropdown>
    );
  } else if (type === "SimulatedSearchbox") {
    inner = <FluentSearchBox placeholder={s(props.placeholder, "Search...")} />;
  } else if (type === "SimulatedSegmentedGroup") {
    const opts = csv(props.optionsCsv, ["Day", "Week", "Month"]);
    const di = num(props.defaultIndex, 0);
    inner = <FluentToolbar aria-label="Segmented">{opts.map((o, i) => <FluentToggleButton key={i} appearance="subtle" checked={i === di}>{s(o)}</FluentToggleButton>)}</FluentToolbar>;
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
    inner = <FluentButton appearance={props.active ? "primary" : "subtle"}>{s(props.label, "Nav")}</FluentButton>;
  } else if (type === "SimulatedDataTable") {
    const cols = Array.isArray(props.columns) ? (props.columns as string[]) : ["Name", "Status"];
    const rows = Array.isArray(props.rows) ? (props.rows as unknown[]) : [];
    const tagColor = (st: string): "success" | "warning" | "subtle" => (st === "success" ? "success" : st === "warning" ? "warning" : "subtle");
    inner = (
      <FluentTable>
        <FluentTableHeader>
          <FluentTableRow>{cols.map((c) => <FluentTableHeaderCell key={c}>{s(c)}</FluentTableHeaderCell>)}</FluentTableRow>
        </FluentTableHeader>
        <FluentTableBody>
          {rows.map((row, ri) => (
            <FluentTableRow key={ri}>
              {cols.map((col, ci) => {
                const v = resolveCell(row, col, ci);
                return <FluentTableCell key={ci}>{isStatusColumn(col) ? <FluentTag appearance="filled" color={tagColor(statusToClass(v))}>{v}</FluentTag> : v}</FluentTableCell>;
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

function UoauiReal({ type, mode, saltDensity, props }: Omit<RealComponentRendererProps, "system">) {
  /* Resolve the uoaui theme object from the active mode (dark/light) and build
     the DS CSS via the shared registry helper. Memoised on mode+density so the
     string isn't reassembled every render. setUoauiT inside uoauiBuildCSS is a
     pure read of the passed theme, so this is render-safe. */
  const density = saltDensity ?? "medium";
  const scopedCss = React.useMemo(() => {
    const theme = getTheme("uoaui", mode === "dark" ? "dark" : "light");
    return scopeUoauiCSS(sanitizeCSS(getFullCSS("uoaui", theme, density)));
  }, [mode, density]);

  const render = getRealBlockRenderer("uoaui", type);
  const inner = render ? render(props) : null;

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
function CarbonReal({ type, mode, props }: Omit<RealComponentRendererProps, "system">) {
  const themeClass = mode === "dark" ? "cds--g100" : "cds--white";
  const render = getRealBlockRenderer("carbon", type);
  const inner = render ? render(props) : null;

  return (
    <>
      <CarbonScopeStyles />
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
}: RealComponentRendererProps): React.ReactElement | null {
  if (!canRenderReal(system, type)) return null;

  if (system === "salt") return <SaltReal type={type} mode={mode} saltDensity={saltDensity} props={props} />;
  if (system === "m3") return <M3Real type={type} mode={mode} props={props} />;
  if (system === "fluent") return <FluentReal type={type} mode={mode} props={props} />;
  if (system === "uoaui") return <UoauiReal type={type} mode={mode} saltDensity={saltDensity} props={props} />;
  if (system === "carbon") return <CarbonReal type={type} mode={mode} props={props} />;
  return null;
}
