"use client";

/**
 * RealDialogKit - a dialog and an anchored menu drawn with the active design
 * system's own components, reached through RealComponentRenderer as the
 * types "KitDialog" and "KitMenu" (they are not canvas blocks).
 *
 * The content is data, so one model gives five native results:
 *   - KitDialogModel: a title, a one-line description, an optional choice of
 *     two tiles, rows of fields (a dropdown, a text field or a read-only
 *     value; two to a row at most), an optional table, an optional extra
 *     node (a small chart), and the actions.
 *   - KitMenuModel: items anchored to an element.
 *
 *   Salt: Dialog, ToggleButtonGroup, FormField + Dropdown / Input, Table, Menu.
 *   Material 3: Dialog, ToggleButtonGroup, Select / TextField, Table, Menu.
 *   Fluent 2: Dialog, ToggleButton, Field + Dropdown / Input, Table, Menu.
 *   Carbon: Modal, TileGroup + RadioTile, Select / TextInput, Table, Menu.
 *   uoaui: its .a-dialog, .a-btn, .a-input, .a-table and .a-dropdown-menu classes.
 *
 * Every dialog: role dialog named by its title, focus kept inside, Escape
 * closes it, and focus goes back to `returnFocus` (the launcher) after it
 * closes. Escape is taken once, at the window (overlayEscape), for every
 * dialog and menu here and in RealFormDialog.
 */

import React from "react";
import { useOverlayEscape, useReturnFocus } from "@/lib/overlayEscape";
import { createPortal } from "react-dom";
import { getFullCSS, getTheme } from "@/data/registry";
import { sanitizeCSS } from "@/lib/sanitizeCSS";
import { coerceDensity, type DensityLevel } from "@/lib/densitySize";
import { CarbonScopeStyles } from "@/components/ui-kit/CarbonScopeStyles";
import type { SystemId } from "@/lib/componentApiRegistry";

import {
  SaltProvider, Dialog as SaltDialog, DialogHeader as SaltDialogHeader, DialogContent as SaltDialogContent,
  DialogActions as SaltDialogActions, DialogCloseButton as SaltDialogCloseButton, ToggleButtonGroup as SaltToggleButtonGroup,
  ToggleButton as SaltToggleButton, FormField as SaltFormField, FormFieldLabel as SaltFormFieldLabel,
  FormFieldHelperText as SaltFormFieldHelperText, Input as SaltInput, Button as SaltButton, Dropdown as SaltDropdown,
  Option as SaltOption, Table as SaltTable, THead as SaltTHead, TBody as SaltTBody, TH as SaltTH, TR as SaltTR, TD as SaltTD,
  Menu as SaltMenu, MenuPanel as SaltMenuPanel, MenuItem as SaltMenuItem,
} from "@salt-ds/core";

import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { buildM3Theme, M3_SHAPE } from "@/lib/m3MuiTheme";
import MuiDialog from "@mui/material/Dialog";
import MuiDialogTitle from "@mui/material/DialogTitle";
import MuiDialogContent from "@mui/material/DialogContent";
import MuiDialogContentText from "@mui/material/DialogContentText";
import MuiDialogActions from "@mui/material/DialogActions";
import MuiToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import MuiToggleButton from "@mui/material/ToggleButton";
import MuiTextField from "@mui/material/TextField";
import MuiButton from "@mui/material/Button";
import MuiMenu from "@mui/material/Menu";
import MuiMenuItem from "@mui/material/MenuItem";
import MuiTable from "@mui/material/Table";
import MuiTableHead from "@mui/material/TableHead";
import MuiTableBody from "@mui/material/TableBody";
import MuiTableRow from "@mui/material/TableRow";
import MuiTableCell from "@mui/material/TableCell";

import {
  FluentProvider, webLightTheme, webDarkTheme, Dialog as FluentDialog, DialogSurface as FluentDialogSurface,
  DialogBody as FluentDialogBody, DialogTitle as FluentDialogTitle, DialogContent as FluentDialogContent,
  DialogActions as FluentDialogActions, Field as FluentField, Input as FluentInput, Button as FluentButton, Text as FluentText,
  Dropdown as FluentDropdown, Option as FluentOption, ToggleButton as FluentToggleButton, Menu as FluentMenu,
  MenuPopover as FluentMenuPopover, MenuList as FluentMenuList, MenuItem as FluentMenuItem, Table as FluentTable,
  TableHeader as FluentTableHeader, TableRow as FluentTableRow, TableHeaderCell as FluentTableHeaderCell,
  TableBody as FluentTableBody, TableCell as FluentTableCell,
} from "@fluentui/react-components";

import {
  Modal as CarbonModal, Select as CarbonSelect, SelectItem as CarbonSelectItem, TextInput as CarbonTextInput,
  TileGroup as CarbonTileGroup, RadioTile as CarbonRadioTile, Menu as CarbonMenu, MenuItem as CarbonMenuItem,
  Table as CarbonTable, TableHead as CarbonTableHead, TableRow as CarbonTableRow, TableHeader as CarbonTableHeader,
  TableBody as CarbonTableBody, TableCell as CarbonTableCell,
} from "@carbon/react";

/* ── Models ── */

export type KitField =
  | { kind: "select"; id: string; label: string; value: string; options: readonly string[]; onChange: (value: string) => void }
  | { kind: "text"; id: string; label: string; value: string; onChange: (value: string) => void; /** Leaving the field (the ticket tidies the number). */ onBlur?: () => void; error?: string | null; inputMode?: "decimal" | "numeric" | "text"; align?: "end" }
  | { kind: "static"; id: string; label: string; value: string };

export interface KitChoiceOption {
  value: string;
  /** What the tile is called for assistive tech ("Sell at 1.37648"). */
  name: string;
  /** Small caption on top ("S EUR"), the big figure under it. */
  caption: string;
  lead: string;
  figure: string;
  tail: string;
}
export interface KitChoice { label: string; value: string; options: KitChoiceOption[]; onChange: (value: string) => void }

export type KitTone = "up" | "down" | "flat" | undefined;
export interface KitTable { caption: string; columns: string[]; rows: { cells: string[]; tones?: KitTone[] }[] }

export interface KitDialogModel {
  open: boolean;
  title: string;
  description?: string;
  size?: "small" | "medium";
  choice?: KitChoice;
  rows?: KitField[][];
  table?: KitTable;
  /** Drawn under the table (the Compare dialog's chart). */
  extra?: React.ReactNode;
  primary?: { label: string; onClick: () => void };
  secondary: { label: string };
  onClose: () => void;
  /** The element focus returns to on close (the launcher). */
  returnFocus?: React.RefObject<HTMLElement | null>;
  /** A class for tests and screenshots. */
  name: string;
  /** The page's up / down colours (`--dh-kit-up`, `--dh-kit-down`) for signed figures. */
  tones?: React.CSSProperties;
}

export interface KitMenuItem { id: string; label: string; disabled?: boolean; onSelect: () => void }
export interface KitMenuModel {
  open: boolean;
  label: string;
  anchor: HTMLElement | null;
  items: KitMenuItem[];
  onClose: () => void;
  /** Where focus goes when the menu closes without a choice (the anchor, by default). */
  returnFocus?: React.RefObject<HTMLElement | null>;
}

type Mode = "light" | "dark";
interface DialogProps { system: SystemId; mode: Mode; density?: DensityLevel | string; model: KitDialogModel }
interface MenuProps { system: SystemId; mode: Mode; model: KitMenuModel }

/* ── Shared behaviour ── */

const titleId = (model: KitDialogModel, system: string) => `dh-kit-${model.name}-${system}-title`;
const errorId = (f: KitField) => `${f.id}-error`;
const submitOnEnter = (model: KitDialogModel) => (e: React.FormEvent) => { e.preventDefault(); model.primary?.onClick(); };

/** Rows of fields, two to a row at most (ours: the same rhythm in every system). */
function Rows({ rows, render }: { rows?: KitField[][]; render: (f: KitField) => React.ReactNode }) {
  if (!rows?.length) return null;
  return (
    <div className="dh-kit-rows">
      {rows.map((row, i) => (
        <div key={i} className="dh-kit-row" data-cols={row.length}>
          {row.map((f) => <div key={f.id} className="dh-kit-cell" data-field={f.id}>{render(f)}</div>)}
        </div>
      ))}
      {/* Enter in a text field submits. */}
      <button type="submit" hidden tabIndex={-1} aria-hidden="true" />
    </div>
  );
}

/** A tile's face: caption, then the quote with its big pips. The tile is
 *  named by the hidden sentence ("Sell EUR at 1.37648"), whatever element
 *  the system makes it (a button, a radio's label). */
function TileFace({ o }: { o: KitChoiceOption }) {
  return (
    <span className="dh-kit-tile">
      <span className="dh-kit-sr">{o.name}</span>
      <span className="dh-kit-tile-caption" aria-hidden="true">{o.caption}</span>
      <span className="dh-kit-tile-quote" aria-hidden="true"><span>{o.lead}</span><strong>{o.figure}</strong><span>{o.tail}</span></span>
    </span>
  );
}

const toneClass = (t: KitTone) => (t === "up" ? "dh-kit-up" : t === "down" ? "dh-kit-down" : undefined);
/** Everything below the title, in a system's own components. */
interface Parts {
  choice: (c: KitChoice) => React.ReactNode;
  field: (f: KitField) => React.ReactNode;
  table: (t: KitTable) => React.ReactNode;
}
function Body({ model, parts }: { model: KitDialogModel; parts: Parts }) {
  return (
    <div className="dh-kit-body" style={model.tones}>
      {model.choice ? <div className="dh-kit-choice">{parts.choice(model.choice)}</div> : null}
      <Rows rows={model.rows} render={parts.field} />
      {model.table ? <div className="dh-kit-table">{parts.table(model.table)}</div> : null}
      {model.extra ? <div className="dh-kit-extra">{model.extra}</div> : null}
    </div>
  );
}

/* ── Salt ── */
const saltParts: Parts = {
  choice: (c) => (
    <SaltToggleButtonGroup aria-label={c.label} value={c.value} sentiment="accented" appearance="bordered" onChange={(e) => c.onChange((e.currentTarget as HTMLButtonElement).value)}>
      {c.options.map((o) => <SaltToggleButton key={o.value} value={o.value}><TileFace o={o} /></SaltToggleButton>)}
    </SaltToggleButtonGroup>
  ),
  field: (f) => (
    <SaltFormField validationStatus={f.kind === "text" && f.error ? "error" : undefined} readOnly={f.kind === "static"}>
      <SaltFormFieldLabel>{f.label}</SaltFormFieldLabel>
      {f.kind === "select" ? (
        <SaltDropdown id={f.id} selected={[f.value]} onSelectionChange={(_e, items: string[]) => { if (items[0]) f.onChange(items[0]); }}>
          {f.options.map((o) => <SaltOption key={o} value={o}>{o}</SaltOption>)}
        </SaltDropdown>
      ) : (
        <SaltInput
          value={f.value} readOnly={f.kind === "static"} textAlign={f.kind === "text" && f.align === "end" ? "right" : "left"}
          onChange={f.kind === "text" ? (e) => f.onChange((e.target as HTMLInputElement).value) : undefined}
          inputProps={{ id: f.id, inputMode: f.kind === "text" ? f.inputMode : undefined, onBlur: f.kind === "text" ? f.onBlur : undefined }}
        />
      )}
      {f.kind === "text" && f.error ? <SaltFormFieldHelperText>{f.error}</SaltFormFieldHelperText> : null}
    </SaltFormField>
  ),
  table: (t) => (
    /* A dense table: Salt's high density. */
    <SaltProvider density="high" applyClassesTo="scope">
      <SaltTable aria-label={t.caption}>
        <SaltTHead><SaltTR>{t.columns.map((c, i) => <SaltTH key={i} scope="col">{c}</SaltTH>)}</SaltTR></SaltTHead>
        <SaltTBody>{t.rows.map((r, i) => <SaltTR key={i}>{r.cells.map((c, j) => (j === 0 ? <SaltTH key={j} scope="row">{c}</SaltTH> : <SaltTD key={j} className={toneClass(r.tones?.[j - 1])}>{c}</SaltTD>))}</SaltTR>)}</SaltTBody>
      </SaltTable>
    </SaltProvider>
  ),
};
function SaltKitDialog({ mode, density, model }: Omit<DialogProps, "system">) {
  return (
    <SaltProvider mode={mode} density={coerceDensity(density)} applyClassesTo="scope">
      <SaltDialog open={model.open} onOpenChange={(o) => { if (!o) model.onClose(); }} size={model.size === "small" ? "small" : "medium"} className={`dh-kit-dialog dh-kit-${model.name}`}>
        <SaltDialogHeader header={model.title} />
        <SaltDialogContent>
          {model.description ? <p className="dh-kit-description">{model.description}</p> : null}
          <form onSubmit={submitOnEnter(model)} noValidate><Body model={model} parts={saltParts} /></form>
        </SaltDialogContent>
        <SaltDialogActions>
          <SaltButton sentiment="neutral" appearance="transparent" onClick={model.onClose}>{model.secondary.label}</SaltButton>
          {model.primary ? <SaltButton sentiment="accented" appearance="solid" onClick={model.primary.onClick}>{model.primary.label}</SaltButton> : null}
        </SaltDialogActions>
        <SaltDialogCloseButton onClick={model.onClose} />
      </SaltDialog>
    </SaltProvider>
  );
}

/* ── Material 3 ── */
const M3_TILE_CORNER = `${M3_SHAPE.medium}px`;
const muiParts: Parts = {
  choice: (c) => (
    /* Price tiles are tall, so they take Material's medium corner (12), not
       the full rounding a one-line segmented button has. */
    <MuiToggleButtonGroup exclusive fullWidth aria-label={c.label} value={c.value} onChange={(_e, v) => { if (v) c.onChange(v); }}
      sx={{ "& .MuiToggleButtonGroup-firstButton": { borderTopLeftRadius: M3_TILE_CORNER, borderBottomLeftRadius: M3_TILE_CORNER }, "& .MuiToggleButtonGroup-lastButton": { borderTopRightRadius: M3_TILE_CORNER, borderBottomRightRadius: M3_TILE_CORNER } }}>
      {c.options.map((o) => <MuiToggleButton key={o.value} value={o.value}><TileFace o={o} /></MuiToggleButton>)}
    </MuiToggleButtonGroup>
  ),
  field: (f) =>
    f.kind === "select" ? (
      <MuiTextField select id={f.id} label={f.label} value={f.value} size="small" fullWidth onChange={(e) => f.onChange(e.target.value)}
        >
        {f.options.map((o) => <MuiMenuItem key={o} value={o}>{o}</MuiMenuItem>)}
      </MuiTextField>
    ) : (
      <MuiTextField
        id={f.id} label={f.label} value={f.value} size="small" fullWidth
        error={f.kind === "text" && Boolean(f.error)} helperText={f.kind === "text" ? (f.error ?? undefined) : undefined}
        onChange={f.kind === "text" ? (e) => f.onChange(e.target.value) : undefined} onBlur={f.kind === "text" ? f.onBlur : undefined}
        slotProps={{ input: { readOnly: f.kind === "static" }, htmlInput: { inputMode: f.kind === "text" ? f.inputMode : undefined, style: f.kind === "text" && f.align === "end" ? { textAlign: "right" } : undefined } }}
      />
    ),
  table: (t) => (
    <MuiTable size="small" aria-label={t.caption}>
      <MuiTableHead><MuiTableRow>{t.columns.map((c, i) => <MuiTableCell key={i} align={i ? "right" : "left"}>{c}</MuiTableCell>)}</MuiTableRow></MuiTableHead>
      <MuiTableBody>{t.rows.map((r, i) => <MuiTableRow key={i}>{r.cells.map((c, j) => <MuiTableCell key={j} component={j ? "td" : "th"} scope={j ? undefined : "row"} align={j ? "right" : "left"} className={j ? toneClass(r.tones?.[j - 1]) : undefined}>{c}</MuiTableCell>)}</MuiTableRow>)}</MuiTableBody>
    </MuiTable>
  ),
};
function M3KitDialog({ mode, model }: Omit<DialogProps, "system">) {
  const theme = React.useMemo(() => buildM3Theme({ mode }), [mode]);
  return (
    <MuiThemeProvider theme={theme}>
      <MuiDialog open={model.open} onClose={model.onClose} maxWidth={model.size === "small" ? "xs" : "sm"} fullWidth aria-labelledby={titleId(model, "m3")} className={`dh-kit-dialog dh-kit-${model.name}`}
        slotProps={{ paper: { component: "form", onSubmit: submitOnEnter(model), noValidate: true } as object }}>
        <MuiDialogTitle id={titleId(model, "m3")}>{model.title}</MuiDialogTitle>
        <MuiDialogContent sx={{ fontFamily: theme.typography.fontFamily }}>
          {model.description ? <MuiDialogContentText className="dh-kit-description">{model.description}</MuiDialogContentText> : null}
          <Body model={model} parts={muiParts} />
        </MuiDialogContent>
        <MuiDialogActions>
          <MuiButton onClick={model.onClose}>{model.secondary.label}</MuiButton>
          {model.primary ? <MuiButton type="submit" variant="contained">{model.primary.label}</MuiButton> : null}
        </MuiDialogActions>
      </MuiDialog>
    </MuiThemeProvider>
  );
}

/* ── Fluent 2 ── */
const fluentParts: Parts = {
  choice: (c) => (
    <div role="group" aria-label={c.label} className="dh-kit-tiles">
      {c.options.map((o) => <FluentToggleButton key={o.value} checked={o.value === c.value} onClick={() => c.onChange(o.value)} className="dh-kit-tile-btn"><TileFace o={o} /></FluentToggleButton>)}
    </div>
  ),
  field: (f) => (
    <FluentField label={f.label} validationState={f.kind === "text" && f.error ? "error" : "none"} validationMessage={f.kind === "text" ? (f.error ?? undefined) : undefined}>
      {f.kind === "select" ? (
        <FluentDropdown id={f.id} value={f.value} selectedOptions={[f.value]} onOptionSelect={(_e, d) => { if (d.optionValue) f.onChange(d.optionValue); }} style={{ minWidth: 0 }}>
          {f.options.map((o) => <FluentOption key={o} value={o}>{o}</FluentOption>)}
        </FluentDropdown>
      ) : (
        <FluentInput id={f.id} value={f.value} readOnly={f.kind === "static"} inputMode={f.kind === "text" ? f.inputMode : undefined}
          input={{ style: f.kind === "text" && f.align === "end" ? { textAlign: "right" } : undefined }}
          onChange={f.kind === "text" ? (_e, d) => f.onChange(d.value) : undefined} onBlur={f.kind === "text" ? f.onBlur : undefined} />
      )}
    </FluentField>
  ),
  table: (t) => (
    <FluentTable size="small" aria-label={t.caption}>
      <FluentTableHeader><FluentTableRow>{t.columns.map((c, i) => <FluentTableHeaderCell key={i}>{c}</FluentTableHeaderCell>)}</FluentTableRow></FluentTableHeader>
      <FluentTableBody>{t.rows.map((r, i) => <FluentTableRow key={i}>{r.cells.map((c, j) => <FluentTableCell key={j} className={j ? toneClass(r.tones?.[j - 1]) : undefined}>{c}</FluentTableCell>)}</FluentTableRow>)}</FluentTableBody>
    </FluentTable>
  ),
};
function FluentKitDialog({ mode, model }: Omit<DialogProps, "system">) {
  return (
    <FluentProvider theme={mode === "dark" ? webDarkTheme : webLightTheme}>
      <FluentDialog open={model.open} onOpenChange={(_e, d) => { if (!d.open) model.onClose(); }}>
        <FluentDialogSurface className={`dh-kit-dialog dh-kit-${model.name} dh-kit-fluent-${model.size ?? "medium"}`} aria-labelledby={titleId(model, "fluent")}>
          <form onSubmit={submitOnEnter(model)} noValidate>
            <FluentDialogBody>
              <FluentDialogTitle id={titleId(model, "fluent")}>{model.title}</FluentDialogTitle>
              <FluentDialogContent>
                {model.description ? <FluentText as="p" block className="dh-kit-description">{model.description}</FluentText> : null}
                <Body model={model} parts={fluentParts} />
              </FluentDialogContent>
              <FluentDialogActions>
                <FluentButton appearance="secondary" onClick={model.onClose}>{model.secondary.label}</FluentButton>
                {model.primary ? <FluentButton appearance="primary" type="submit">{model.primary.label}</FluentButton> : null}
              </FluentDialogActions>
            </FluentDialogBody>
          </form>
        </FluentDialogSurface>
      </FluentDialog>
    </FluentProvider>
  );
}

/* ── Carbon ── in its scope, at the end of the page (the stage can be scaled). */
const carbonParts: Parts = {
  choice: (c) => (
    <CarbonTileGroup legend={c.label} name={`${c.label}-tiles`} valueSelected={c.value} onChange={(v) => c.onChange(String(v))} className="dh-kit-tiles">
      {c.options.map((o) => <CarbonRadioTile key={o.value} id={`dh-kit-tile-${o.value}`} value={o.value}><TileFace o={o} /></CarbonRadioTile>)}
    </CarbonTileGroup>
  ),
  field: (f) =>
    f.kind === "select" ? (
      <CarbonSelect id={f.id} labelText={f.label} value={f.value} size="md" onChange={(e) => f.onChange(e.target.value)}>
        {f.options.map((o) => <CarbonSelectItem key={o} value={o} text={o} />)}
      </CarbonSelect>
    ) : (
      <CarbonTextInput id={f.id} labelText={f.label} value={f.value} size="md" readOnly={f.kind === "static"}
        inputMode={f.kind === "text" ? f.inputMode : undefined} style={f.kind === "text" && f.align === "end" ? { textAlign: "right" } : undefined}
        invalid={f.kind === "text" && Boolean(f.error)} invalidText={f.kind === "text" ? (f.error ?? undefined) : undefined}
        /* Carbon points aria-errormessage at its message; described-by makes every reader announce it. */
        aria-describedby={f.kind === "text" && f.error ? `${f.id}-error-msg` : undefined}
        onChange={f.kind === "text" ? (e) => f.onChange(e.target.value) : undefined} onBlur={f.kind === "text" ? f.onBlur : undefined} />
    ),
  table: (t) => (
    <CarbonTable size="xs" aria-label={t.caption}>
      <CarbonTableHead><CarbonTableRow>{t.columns.map((c, i) => <CarbonTableHeader key={i}>{c}</CarbonTableHeader>)}</CarbonTableRow></CarbonTableHead>
      <CarbonTableBody>{t.rows.map((r, i) => <CarbonTableRow key={i}>{r.cells.map((c, j) => <CarbonTableCell key={j} className={j ? toneClass(r.tones?.[j - 1]) : undefined}>{c}</CarbonTableCell>)}</CarbonTableRow>)}</CarbonTableBody>
    </CarbonTable>
  ),
};
function CarbonKitDialog({ mode, model }: Omit<DialogProps, "system">) {
  /* Carbon keeps a closed modal in the page (hidden): not mounted while closed. */
  if (!model.open || typeof document === "undefined") return null;
  const themeClass = mode === "dark" ? "cds--g100" : "cds--white";
  return createPortal(
    <>
      <CarbonScopeStyles />
      <div className={`carbon-live-scope ${themeClass} dh-kit-scope`} data-carbon-theme={mode === "dark" ? "g100" : "white"}>
        <CarbonModal
          open={model.open} size={model.size === "small" ? "sm" : "md"} className={`dh-kit-dialog dh-kit-${model.name}`}
          modalHeading={model.title} aria-label={model.title}
          /* With nothing to submit, the one footer button closes (and takes
             focus: Carbon's X shows a tooltip that would take the first Escape). */
          primaryButtonText={model.primary?.label ?? model.secondary.label} secondaryButtonText={model.primary ? model.secondary.label : undefined}
          onRequestSubmit={model.primary?.onClick ?? model.onClose} onRequestClose={model.onClose} onSecondarySubmit={model.onClose}
          launcherButtonRef={model.returnFocus as React.RefObject<HTMLButtonElement>}
          selectorPrimaryFocus={model.choice ? ".cds--tile-input:checked" : model.primary ? "input, select" : ".cds--modal-footer .cds--btn"}
        >
          <form onSubmit={submitOnEnter(model)} noValidate>
            {model.description ? <p className="dh-kit-description">{model.description}</p> : null}
            <Body model={model} parts={carbonParts} />
          </form>
        </CarbonModal>
      </div>
    </>,
    document.body,
  );
}

/* ── uoaui ── its own classes; focus is kept inside here. */
const UOAUI_SCOPE = ".preview-uoaui.a-app.dh-kit-scope";
function scopeUoaui(css: string): string {
  const cleaned = css.replace(/^\s*url\([^)]*\)\s*;/gm, "");
  let out = "";
  let i = 0;
  while (i < cleaned.length) {
    const brace = cleaned.indexOf("{", i);
    if (brace === -1) { out += cleaned.slice(i); break; }
    const preamble = cleaned.slice(i, brace);
    let depth = 1;
    let j = brace + 1;
    for (; j < cleaned.length && depth > 0; j++) { if (cleaned[j] === "{") depth++; else if (cleaned[j] === "}") depth--; }
    const body = cleaned.slice(brace + 1, j - 1);
    if (preamble.trim().startsWith("@")) out += `${preamble}{${scopeUoaui(body)}}`;
    else out += `${preamble.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (s === ":root" ? UOAUI_SCOPE : `${UOAUI_SCOPE} ${s}`)).join(", ")} {${body}}`;
    i = j;
  }
  return out;
}
function useUoauiCss(mode: Mode, density?: DensityLevel | string): string {
  return React.useMemo(() => scopeUoaui(sanitizeCSS(getFullCSS("uoaui", getTheme("uoaui", mode), coerceDensity(density)))), [mode, density]);
}
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])';
/** Tab stays in the panel: it wraps at either end, and comes back in from
 *  anywhere else (the panel itself, the page behind). */
function trapTab(panel: HTMLElement | null, e: KeyboardEvent) {
  if (e.key !== "Tab" || !panel) return;
  const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
  if (!items.length) { e.preventDefault(); panel.focus(); return; }
  const [first, last] = [items[0], items[items.length - 1]];
  const at = document.activeElement as HTMLElement | null;
  const inside = Boolean(at && at !== panel && panel.contains(at));
  if (!inside) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
  else if (e.shiftKey && at === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
}
const uoauiParts: Parts = {
  choice: (c) => (
    <div role="radiogroup" aria-label={c.label} className="dh-kit-tiles">
      {c.options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === c.value}
          className={`a-btn ${o.value === c.value ? "a-btn-primary" : "a-btn-secondary"} dh-kit-tile-btn`} onClick={() => c.onChange(o.value)}>
          <TileFace o={o} />
        </button>
      ))}
    </div>
  ),
  field: (f) => (
    <div className={`a-input-wrap${f.kind === "text" && f.error ? " a-input-error" : ""}`}>
      <label className="a-input-label" htmlFor={f.id}>{f.label}</label>
      {f.kind === "select" ? (
        <select id={f.id} className="a-input" value={f.value} onChange={(e) => f.onChange(e.target.value)}>
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input id={f.id} className="a-input" value={f.value} readOnly={f.kind === "static"} inputMode={f.kind === "text" ? f.inputMode : undefined}
          style={f.kind === "text" && f.align === "end" ? { textAlign: "right" } : undefined}
          aria-invalid={f.kind === "text" && f.error ? true : undefined} aria-describedby={f.kind === "text" && f.error ? errorId(f) : undefined}
          onChange={f.kind === "text" ? (e) => f.onChange(e.target.value) : undefined} onBlur={f.kind === "text" ? f.onBlur : undefined} />
      )}
      {f.kind === "text" && f.error ? <span id={errorId(f)} className="dh-kit-error">{f.error}</span> : null}
    </div>
  ),
  table: (t) => (
    <table className="a-table" aria-label={t.caption}>
      <thead><tr>{t.columns.map((c, i) => <th key={i} scope="col">{c}</th>)}</tr></thead>
      <tbody>{t.rows.map((r, i) => <tr key={i}>{r.cells.map((c, j) => (j === 0 ? <th key={j} scope="row" className="dh-kit-rowhead">{c}</th> : <td key={j} className={toneClass(r.tones?.[j - 1])}>{c}</td>))}</tr>)}</tbody>
    </table>
  ),
};
function UoauiKitDialog({ mode, density, model }: Omit<DialogProps, "system">) {
  const css = useUoauiCss(mode, density);
  const panel = React.useRef<HTMLDivElement>(null);
  const open = model.open;
  React.useEffect(() => {
    if (!open) return;
    const p = panel.current;
    (p?.querySelector<HTMLElement>('[aria-checked="true"], input:not([readonly]), select, .dh-kit-actions button') ?? p)?.focus();
    /* Focus is kept inside: Tab is trapped at the window (it works wherever
       focus is), and focus that lands on the page behind comes back. */
    const onKey = (e: KeyboardEvent) => trapTab(panel.current, e);
    const onFocus = (e: FocusEvent) => {
      const to = e.target as Node | null;
      if (panel.current && to && !panel.current.contains(to) && !(to instanceof Element && to.closest(".dh-kit-scope, [role=\"listbox\"], [role=\"menu\"]"))) panel.current.focus();
    };
    window.addEventListener("keydown", onKey, true);
    document.addEventListener("focusin", onFocus);
    return () => { window.removeEventListener("keydown", onKey, true); document.removeEventListener("focusin", onFocus); };
  }, [open]);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="preview-uoaui a-app dh-kit-scope">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="a-dialog-backdrop dh-kit-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) model.onClose(); }}>
        <div ref={panel} tabIndex={-1} className={`a-dialog dh-kit-dialog dh-kit-${model.name} dh-kit-uoaui-${model.size ?? "medium"}`} role="dialog" aria-modal="true" aria-labelledby={titleId(model, "uoaui")} style={model.tones}>
          <form onSubmit={submitOnEnter(model)} noValidate>
            <h2 id={titleId(model, "uoaui")} className="dh-kit-title">{model.title}</h2>
            {/* The fields scroll; the title and the actions stay in view. */}
            <div className="dh-kit-scroll">
              {model.description ? <p className="dh-kit-description">{model.description}</p> : null}
              <Body model={model} parts={uoauiParts} />
            </div>
            <div className="dh-kit-actions">
              <button type="button" className="a-btn a-btn-ghost" onClick={model.onClose}>{model.secondary.label}</button>
              {model.primary ? <button type="submit" className="a-btn a-btn-primary">{model.primary.label}</button> : null}
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** A dialog in the active system. */
export function RealKitDialog({ system, mode, density, model }: DialogProps): React.ReactElement | null {
  useReturnFocus(model.open, model.returnFocus);
  useOverlayEscape(model.open, model.onClose);
  if (system === "salt") return <SaltKitDialog mode={mode} density={density} model={model} />;
  if (system === "m3") return <M3KitDialog mode={mode} model={model} />;
  if (system === "fluent") return <FluentKitDialog mode={mode} model={model} />;
  if (system === "carbon") return <CarbonKitDialog mode={mode} model={model} />;
  return <UoauiKitDialog mode={mode} density={density} model={model} />;
}

/* ── Menus ── */

/** A menu that closed without a choice hands focus back to its anchor. */
function useMenuFocus(model: KitMenuModel) {
  const anchor = React.useMemo(() => ({ current: model.anchor }), [model.anchor]);
  useReturnFocus(model.open, model.returnFocus ?? anchor);
}

/* The canvas's overlay look (--dh-exec-menu-*, chrome-tokens.css: the chart
   rail's menus), read where the anchor sits and handed to the portalled
   menu, so a kit menu and a rail menu are one surface in each system, light
   and dark. An anchor outside a canvas has none: the menu keeps its own. */
const OVERLAY_TOKENS = ["bg", "image", "border", "shadow", "backdrop", "radius", "item-radius"] as const;
function overlayLook(anchor: HTMLElement | null): { className: string; style: React.CSSProperties } {
  const style: Record<string, string> = {};
  if (anchor && typeof window !== "undefined") {
    const computed = window.getComputedStyle(anchor);
    for (const t of OVERLAY_TOKENS) {
      const v = computed.getPropertyValue(`--dh-exec-menu-${t}`).trim();
      if (v) style[`--dh-exec-menu-${t}`] = v;
    }
  }
  return { className: style["--dh-exec-menu-bg"] ? "dh-kit-menu dh-kit-menu-surface" : "dh-kit-menu", style: style as React.CSSProperties };
}

function SaltKitMenu({ mode, model }: Omit<MenuProps, "system">) {
  const look = overlayLook(model.anchor);
  return (
    <SaltProvider mode={mode} applyClassesTo="scope">
      <SaltMenu open={model.open} onOpenChange={(o) => { if (!o) model.onClose(); }} getVirtualElement={() => model.anchor} placement="bottom-end">
        <SaltMenuPanel aria-label={model.label} className={look.className} style={look.style}>
          {model.items.map((it) => <SaltMenuItem key={it.id} disabled={it.disabled} onClick={() => { model.onClose(); it.onSelect(); }}>{it.label}</SaltMenuItem>)}
        </SaltMenuPanel>
      </SaltMenu>
    </SaltProvider>
  );
}
function M3KitMenu({ mode, model }: Omit<MenuProps, "system">) {
  const theme = React.useMemo(() => buildM3Theme({ mode }), [mode]);
  const look = overlayLook(model.anchor);
  return (
    <MuiThemeProvider theme={theme}>
      <MuiMenu open={model.open && Boolean(model.anchor)} anchorEl={model.anchor} onClose={model.onClose} autoFocus
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ list: { "aria-label": model.label, dense: true } as object, paper: { style: look.style } }} className={look.className}>
        {model.items.map((it) => <MuiMenuItem key={it.id} disabled={it.disabled} onClick={() => { model.onClose(); it.onSelect(); }}>{it.label}</MuiMenuItem>)}
      </MuiMenu>
    </MuiThemeProvider>
  );
}
function FluentKitMenu({ mode, model }: Omit<MenuProps, "system">) {
  const look = overlayLook(model.anchor);
  return (
    <FluentProvider theme={mode === "dark" ? webDarkTheme : webLightTheme}>
      <FluentMenu open={model.open} onOpenChange={(_e, d) => { if (!d.open) model.onClose(); }} positioning={{ target: model.anchor, position: "below", align: "end" }}>
        <FluentMenuPopover className={look.className} style={look.style}>
          <FluentMenuList aria-label={model.label}>
            {model.items.map((it) => <FluentMenuItem key={it.id} disabled={it.disabled} onClick={() => { model.onClose(); it.onSelect(); }}>{it.label}</FluentMenuItem>)}
          </FluentMenuList>
        </FluentMenuPopover>
      </FluentMenu>
    </FluentProvider>
  );
}
function CarbonKitMenu({ mode, model }: Omit<MenuProps, "system">) {
  const [scope, setScope] = React.useState<HTMLDivElement | null>(null);
  /* Carbon opens a menu from its anchor's left edge; a tag sits at the
     chart's right edge, so the menu is moved to end where the tag ends. */
  const { open, anchor } = model;
  React.useEffect(() => {
    if (!scope || !anchor || !open) return;
    /* Carbon places the menu itself, after it has drawn: put right each time it does. */
    const align = () => {
      const menu = scope.querySelector<HTMLElement>(".cds--menu");
      if (!menu || !menu.offsetWidth) return;
      const left = Math.max(8, anchor.getBoundingClientRect().right - menu.offsetWidth);
      if (Math.abs(menu.getBoundingClientRect().left - left) > 0.5) menu.style.insetInlineStart = `${left}px`;
    };
    align();
    const seen = new MutationObserver(align);
    seen.observe(scope, { subtree: true, childList: true, attributes: true, attributeFilter: ["style", "class"] });
    return () => seen.disconnect();
  }, [scope, anchor, open]);
  if (typeof document === "undefined") return null;
  const rect = model.anchor?.getBoundingClientRect();
  const themeClass = mode === "dark" ? "cds--g100" : "cds--white";
  const look = overlayLook(model.anchor);
  return createPortal(
    <>
      <CarbonScopeStyles />
      <div ref={setScope} className={`carbon-live-scope ${themeClass} dh-kit-scope`} data-carbon-theme={mode === "dark" ? "g100" : "white"} style={look.style}>
        {scope && rect ? (
          <CarbonMenu open={model.open} label={model.label} mode="basic" size="sm" target={scope} className={look.className}
            x={[rect.left, rect.right]} y={[rect.top, rect.bottom]} onClose={model.onClose}>
            {model.items.map((it) => <CarbonMenuItem key={it.id} label={it.label} disabled={it.disabled} onClick={() => { model.onClose(); it.onSelect(); }} />)}
          </CarbonMenu>
        ) : null}
      </div>
    </>,
    document.body,
  );
}
/** uoaui has no menu component: its dropdown panel and items, with the
 *  menu keys (arrows, Home / End, type-ahead, Escape, Tab closes). */
function UoauiKitMenu({ mode, model }: Omit<MenuProps, "system">) {
  const css = useUoauiCss(mode);
  const list = React.useRef<HTMLUListElement>(null);
  const { open, anchor } = model;
  const close = React.useRef(model.onClose);
  React.useEffect(() => { close.current = model.onClose; });
  /* On opening only (the model is a new object on every render, and the
     page re-renders on every feed tick): focus the first item once. */
  React.useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')?.focus();
    const away = (e: PointerEvent) => { if (!list.current?.contains(e.target as Node) && !anchor?.contains(e.target as Node)) close.current(); };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open, anchor]);
  if (!model.open || !model.anchor || typeof document === "undefined") return null;
  const rect = model.anchor.getBoundingClientRect();
  const look = overlayLook(model.anchor);
  const items = () => [...(list.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? [])];
  const onKey = (e: React.KeyboardEvent) => {
    const all = items();
    const at = all.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => { e.preventDefault(); all[(i + all.length) % all.length]?.focus(); };
    if (e.key === "ArrowDown") go(at + 1);
    else if (e.key === "ArrowUp") go(at - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(all.length - 1);
    else if (e.key === "Tab") model.onClose();
    else if (e.key.length === 1 && /\S/.test(e.key)) {
      const k = e.key.toLowerCase();
      const next = [...all.slice(at + 1), ...all.slice(0, at + 1)].find((el) => el.textContent?.trim().toLowerCase().startsWith(k));
      if (next) { e.preventDefault(); next.focus(); }
    }
  };
  return createPortal(
    <div className="preview-uoaui a-app dh-kit-scope">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <ul ref={list} role="menu" aria-label={model.label} className={`a-dropdown-menu ${look.className} dh-kit-menu-uoaui`} onKeyDown={onKey}
        style={{ ...look.style, position: "fixed", top: rect.bottom + 4, left: "auto", right: Math.max(8, window.innerWidth - rect.right) }}>
        {model.items.map((it) => (
          <li key={it.id} role="menuitem" tabIndex={-1} aria-disabled={it.disabled || undefined} className="a-dropdown-item"
            onClick={() => { if (it.disabled) return; model.onClose(); it.onSelect(); }}
            onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !it.disabled) { e.preventDefault(); model.onClose(); it.onSelect(); } }}>
            {it.label}
          </li>
        ))}
      </ul>
    </div>,
    document.body,
  );
}

/** A menu anchored to an element, in the active system. */
export function RealKitMenu({ system, mode, model }: MenuProps): React.ReactElement | null {
  useMenuFocus(model);
  useOverlayEscape(model.open && Boolean(model.anchor), model.onClose);
  if (!model.anchor) return null;
  if (system === "salt") return <SaltKitMenu mode={mode} model={model} />;
  if (system === "m3") return <M3KitMenu mode={mode} model={model} />;
  if (system === "fluent") return <FluentKitMenu mode={mode} model={model} />;
  if (system === "carbon") return <CarbonKitMenu mode={mode} model={model} />;
  return <UoauiKitMenu mode={mode} model={model} />;
}
