"use client";

/**
 * RealFormDialog - a small form in a dialog, drawn with the active design
 * system's own dialog, fields, choice and buttons (reached through
 * RealComponentRenderer as type "FormDialog").
 *
 * The form is data (FormDialogModel): a title, an optional one-line note, an
 * optional choice (a segmented control), fields in rows and the actions. So
 * one model gives five native dialogs:
 *   - Salt: Dialog, DialogHeader, ToggleButtonGroup, FormField + Input, Button.
 *   - Material 3: Dialog, DialogTitle, ToggleButtonGroup, TextField, Button.
 *   - Fluent 2: Dialog, DialogSurface, TabList, Field + Input, Button.
 *   - Carbon: Modal (passive buttons from its own footer), ContentSwitcher, TextInput.
 *   - uoaui: its .a-dialog, .a-segmented-group, .a-input and .a-btn classes.
 *
 * Every one: role dialog, a name from its title, focus kept inside while
 * open, Escape closes, and focus goes back to the element that opened it.
 * Escape is taken at the window first, so it closes the dialog and nothing
 * else (it would otherwise also leave Present).
 */

import React from "react";
import { useOverlayEscape, useReturnFocus } from "@/lib/overlayEscape";
import { createPortal } from "react-dom";
import { getFullCSS, getTheme } from "@/data/registry";
import { sanitizeCSS } from "@/lib/sanitizeCSS";
import { coerceDensity, type DensityLevel } from "@/lib/densitySize";
import { CarbonScopeStyles } from "@/components/ui-kit/CarbonScopeStyles";
import type { SystemId } from "@/lib/componentApiRegistry";
import { addMonths, monthGrid, monthLabel, monthOf, moveDay } from "@/lib/calendarGrid";

import {
  SaltProvider, Dialog as SaltDialog, DialogHeader as SaltDialogHeader, DialogContent as SaltDialogContent,
  DialogActions as SaltDialogActions, DialogCloseButton as SaltDialogCloseButton, ToggleButtonGroup as SaltToggleButtonGroup,
  ToggleButton as SaltToggleButton, FormField as SaltFormField, FormFieldLabel as SaltFormFieldLabel,
  FormFieldHelperText as SaltFormFieldHelperText, Input as SaltInput, Button as SaltButton,
} from "@salt-ds/core";

import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import MuiDialog from "@mui/material/Dialog";
import MuiDialogTitle from "@mui/material/DialogTitle";
import MuiDialogContent from "@mui/material/DialogContent";
import MuiDialogContentText from "@mui/material/DialogContentText";
import MuiDialogActions from "@mui/material/DialogActions";
import MuiToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import MuiToggleButton from "@mui/material/ToggleButton";
import MuiTextField from "@mui/material/TextField";
import MuiButton from "@mui/material/Button";

import {
  FluentProvider, webLightTheme, webDarkTheme, Dialog as FluentDialog, DialogSurface as FluentDialogSurface,
  DialogBody as FluentDialogBody, DialogTitle as FluentDialogTitle, DialogContent as FluentDialogContent,
  DialogActions as FluentDialogActions, TabList as FluentTabList, Tab as FluentTab, Field as FluentField,
  Input as FluentInput, Button as FluentButton, Text as FluentText,
} from "@fluentui/react-components";

import { Modal as CarbonModal, ContentSwitcher as CarbonContentSwitcher, Switch as CarbonSwitch, TextInput as CarbonTextInput } from "@carbon/react";

export interface FormDialogField {
  id: string;
  label: string;
  type: "date" | "time" | "text";
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  /** A plain sentence shown under the field (and announced). */
  error?: string | null;
  /** The field took focus (the Go to range uses it to say which end the calendar fills). */
  onFocus?: () => void;
}

export interface FormDialogModel {
  open: boolean;
  title: string;
  /** A short note under the title (what the form can reach). */
  note?: string;
  choice?: { label: string; options: string[]; value: string; onChange: (value: string) => void };
  /** A month calendar above the fields (days without data cannot be picked). */
  calendar?: CalendarModel;
  /** Rows of fields: two to a row at most. */
  rows: FormDialogField[][];
  primary: { label: string; onClick: () => void };
  cancel: { label: string };
  onClose: () => void;
  /** The element focus returns to on close (the launcher). */
  returnFocus?: React.RefObject<HTMLElement | null>;
}

export interface CalendarModel {
  /** Names the grid ("Pick a day"). */
  label: string;
  /** "YYYY-MM" shown. */
  month: string;
  onMonth: (month: string) => void;
  /** One day, or a range's two ends ("YYYY-MM-DD"). */
  selected: string[];
  /** Days that can be picked (days with bars). */
  enabled: (day: string) => boolean;
  onPick: (day: string) => void;
  /** First and last day the keys can reach. */
  min: string;
  max: string;
  /** What the next pick sets, read out under the grid ("Pick the end day"). */
  prompt?: string;
}

type Mode = "light" | "dark";
interface Props { system: SystemId; mode: Mode; density?: DensityLevel | string; model: FormDialogModel }

/** Escape closes the dialog and nothing else; on close focus returns to the launcher. */
function useDialogKeys(model: FormDialogModel) {
  const { open, onClose, returnFocus } = model;
  /* Opened from inside a device frame (a tablet or phone preview): no wider
     than the frame, as it would be on that device. The dialogs are drawn at
     the end of the page, so the cap is a variable on the root while open. */
  React.useLayoutEffect(() => {
    if (!open) return;
    const frame = returnFocus?.current?.closest(".bp-device-frame");
    if (!frame) return;
    const root = document.documentElement;
    root.style.setProperty("--dh-form-dialog-cap", `${Math.round(frame.getBoundingClientRect().width)}px`);
    return () => { root.style.removeProperty("--dh-form-dialog-cap"); };
  }, [open, returnFocus]);
  /* Escape and the hand-back of focus are the kit's one mechanism (overlayEscape). */
  useOverlayEscape(open, onClose);
  useReturnFocus(open, returnFocus);
}

const errorId = (f: FormDialogField) => `${f.id}-error`;
const submitOnEnter = (model: FormDialogModel) => (e: React.FormEvent) => { e.preventDefault(); model.primary.onClick(); };

/** The form's grid of rows (ours: the same rhythm in every system). */
function Rows({ model, render }: { model: FormDialogModel; render: (f: FormDialogField) => React.ReactNode }) {
  return (
    <div className="dh-form-dialog-rows">
      {model.rows.map((row, i) => (
        <div key={i} className="dh-form-dialog-row" data-cols={row.length}>
          {row.map((f) => <div key={f.id} className="dh-form-dialog-cell">{render(f)}</div>)}
        </div>
      ))}
      {/* Enter in a field submits. */}
      <button type="submit" hidden tabIndex={-1} aria-hidden="true" />
    </div>
  );
}

/* ── Salt ── */
function SaltForm({ mode, density, model }: Omit<Props, "system">) {
  return (
    <SaltProvider mode={mode} density={coerceDensity(density)} applyClassesTo="scope">
      <SaltDialog open={model.open} onOpenChange={(o) => { if (!o) model.onClose(); }} size="medium" className="dh-form-dialog dh-form-dialog-salt">
        <SaltDialogHeader header={model.title} />
        <SaltDialogContent>
          <form onSubmit={submitOnEnter(model)} noValidate>
            {model.note ? <p className="dh-form-dialog-note dh-form-dialog-note-salt">{model.note}</p> : null}
            {model.choice ? (
              <SaltToggleButtonGroup aria-label={model.choice.label} value={model.choice.value} onChange={(e) => model.choice!.onChange((e.currentTarget as HTMLButtonElement).value)} className="dh-form-dialog-choice">
                {model.choice.options.map((o) => <SaltToggleButton key={o} value={o}>{o}</SaltToggleButton>)}
              </SaltToggleButtonGroup>
            ) : null}
            {model.calendar ? <MonthCalendar model={model.calendar} system="salt" /> : null}
            <Rows model={model} render={(f) => (
              <SaltFormField validationStatus={f.error ? "error" : undefined}>
                <SaltFormFieldLabel>{f.label}</SaltFormFieldLabel>
                <SaltInput value={f.value} placeholder={f.placeholder} onChange={(e) => f.onChange((e.target as HTMLInputElement).value)} inputProps={{ id: f.id, type: f.type, min: f.min, max: f.max, onFocus: f.onFocus }} />
                {f.error ? <SaltFormFieldHelperText>{f.error}</SaltFormFieldHelperText> : null}
              </SaltFormField>
            )} />
          </form>
        </SaltDialogContent>
        <SaltDialogActions>
          <SaltButton sentiment="neutral" appearance="transparent" onClick={model.onClose}>{model.cancel.label}</SaltButton>
          <SaltButton sentiment="accented" appearance="solid" onClick={model.primary.onClick}>{model.primary.label}</SaltButton>
        </SaltDialogActions>
        <SaltDialogCloseButton onClick={model.onClose} />
      </SaltDialog>
    </SaltProvider>
  );
}

/* ── Material 3 ── */
function M3Form({ mode, model }: Omit<Props, "system">) {
  const title = React.useId();
  const theme = React.useMemo(() => createTheme({ palette: { mode } }), [mode]);
  /* Material's colours come from its theme object, not CSS variables. */
  const calendarTokens = {
    "--cal-fg": theme.palette.text.primary, "--cal-muted": theme.palette.text.secondary, "--cal-off": theme.palette.text.disabled,
    "--cal-accent": theme.palette.primary.main, "--cal-accent-fg": theme.palette.primary.contrastText,
    "--cal-hover": theme.palette.action.hover, "--cal-range": theme.palette.action.selected, "--cal-font": theme.typography.fontFamily,
  } as React.CSSProperties;
  return (
    <MuiThemeProvider theme={theme}>
      <MuiDialog open={model.open} onClose={model.onClose} aria-labelledby={title} className="dh-form-dialog dh-form-dialog-m3" slotProps={{ paper: { component: "form", onSubmit: submitOnEnter(model), noValidate: true } as object }}>
        <MuiDialogTitle id={title}>{model.title}</MuiDialogTitle>
        <MuiDialogContent>
          {model.note ? <MuiDialogContentText sx={{ mb: 2 }}>{model.note}</MuiDialogContentText> : null}
          {model.choice ? (
            <MuiToggleButtonGroup exclusive size="small" aria-label={model.choice.label} value={model.choice.value} onChange={(_, v) => { if (v) model.choice!.onChange(v); }} className="dh-form-dialog-choice">
              {model.choice.options.map((o) => <MuiToggleButton key={o} value={o}>{o}</MuiToggleButton>)}
            </MuiToggleButtonGroup>
          ) : null}
          {model.calendar ? <div style={calendarTokens}><MonthCalendar model={model.calendar} system="m3" /></div> : null}
            <Rows model={model} render={(f) => (
            <MuiTextField
              id={f.id} label={f.label} type={f.type} value={f.value} placeholder={f.placeholder} size="small" fullWidth
              error={Boolean(f.error)} helperText={f.error ?? undefined}
              onChange={(e) => f.onChange(e.target.value)} onFocus={f.onFocus}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: f.min, max: f.max } }}
            />
          )} />
        </MuiDialogContent>
        <MuiDialogActions>
          <MuiButton onClick={model.onClose}>{model.cancel.label}</MuiButton>
          <MuiButton type="submit" variant="contained">{model.primary.label}</MuiButton>
        </MuiDialogActions>
      </MuiDialog>
    </MuiThemeProvider>
  );
}

/* ── Fluent 2 ── */
function FluentForm({ mode, model }: Omit<Props, "system">) {
  const title = React.useId();
  return (
    <FluentProvider theme={mode === "dark" ? webDarkTheme : webLightTheme}>
      <FluentDialog open={model.open} onOpenChange={(_, d) => { if (!d.open) model.onClose(); }}>
        <FluentDialogSurface className="dh-form-dialog dh-form-dialog-fluent" aria-labelledby={title}>
          <form onSubmit={submitOnEnter(model)} noValidate>
            <FluentDialogBody>
              <FluentDialogTitle id={title}>{model.title}</FluentDialogTitle>
              <FluentDialogContent>
                {model.note ? <FluentText as="p" block className="dh-form-dialog-note">{model.note}</FluentText> : null}
                {model.choice ? (
                  <FluentTabList aria-label={model.choice.label} selectedValue={model.choice.value} onTabSelect={(_, d) => model.choice!.onChange(String(d.value))} size="small" className="dh-form-dialog-choice">
                    {model.choice.options.map((o) => <FluentTab key={o} value={o}>{o}</FluentTab>)}
                  </FluentTabList>
                ) : null}
                {model.calendar ? <MonthCalendar model={model.calendar} system="fluent" /> : null}
            <Rows model={model} render={(f) => (
                  <FluentField label={f.label} validationState={f.error ? "error" : "none"} validationMessage={f.error ?? undefined} validationMessageIcon={null}>
                    <FluentInput id={f.id} type={f.type} value={f.value} placeholder={f.placeholder} min={f.min} max={f.max} onChange={(_, d) => f.onChange(d.value)} onFocus={f.onFocus} />
                  </FluentField>
                )} />
              </FluentDialogContent>
              <FluentDialogActions>
                <FluentButton appearance="secondary" onClick={model.onClose}>{model.cancel.label}</FluentButton>
                <FluentButton appearance="primary" type="submit">{model.primary.label}</FluentButton>
              </FluentDialogActions>
            </FluentDialogBody>
          </form>
        </FluentDialogSurface>
      </FluentDialog>
    </FluentProvider>
  );
}

/* ── Carbon ── rendered in its scope, at the end of the page (the stage can be scaled). */
function CarbonForm({ mode, model }: Omit<Props, "system">) {
  if (typeof document === "undefined") return null;
  const themeClass = mode === "dark" ? "cds--g100" : "cds--white";
  return createPortal(
    <>
      <CarbonScopeStyles />
      <div
        className={`carbon-live-scope ${themeClass} dh-form-dialog-scope`} data-carbon-theme={mode === "dark" ? "g100" : "white"}
        /* Carbon's own sentinels let Tab out of a modal drawn in a scope: keep it in. */
        onKeyDownCapture={(e) => keepTabInside(e, (e.currentTarget as HTMLElement).querySelector(".cds--modal-container"))}
      >
        <CarbonModal
          open={model.open} size="sm" className="dh-form-dialog dh-form-dialog-carbon"
          modalHeading={model.title} modalLabel={undefined} aria-label={model.title}
          primaryButtonText={model.primary.label} secondaryButtonText={model.cancel.label}
          onRequestSubmit={model.primary.onClick} onRequestClose={model.onClose}
          launcherButtonRef={model.returnFocus} selectorPrimaryFocus={model.choice ? ".cds--content-switcher-btn" : "input"}
        >
          <form onSubmit={submitOnEnter(model)} noValidate>
            {model.note ? <p className="dh-form-dialog-note">{model.note}</p> : null}
            {model.choice ? (
              <CarbonContentSwitcher size="sm" aria-label={model.choice.label} selectedIndex={Math.max(0, model.choice.options.indexOf(model.choice.value))} onChange={(d) => model.choice!.onChange(String(d.name))} className="dh-form-dialog-choice">
                {model.choice.options.map((o) => <CarbonSwitch key={o} name={o} text={o} />)}
              </CarbonContentSwitcher>
            ) : null}
            {model.calendar ? <MonthCalendar model={model.calendar} system="carbon" /> : null}
            <Rows model={model} render={(f) => (
              <CarbonTextInput id={f.id} labelText={f.label} type={f.type} value={f.value} placeholder={f.placeholder} size="md" min={f.min} max={f.max}
                invalid={Boolean(f.error)} invalidText={f.error ?? undefined} aria-describedby={f.error ? `${f.id}-error-msg` : undefined} onChange={(e) => f.onChange(e.target.value)} onFocus={f.onFocus} />
            )} />
          </form>
        </CarbonModal>
      </div>
    </>,
    document.body,
  );
}

/* ── uoaui ── its own dialog classes; focus is kept inside here. */
const UOAUI_SCOPE = ".preview-uoaui.a-app.dh-form-dialog-scope";
function scopeCss(css: string): string {
  /* The same scoping the real renderer uses, to this wrapper. */
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
    if (preamble.trim().startsWith("@")) out += `${preamble}{${scopeCss(body)}}`;
    else out += `${preamble.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (s === ":root" ? UOAUI_SCOPE : `${UOAUI_SCOPE} ${s}`)).join(", ")} {${body}}`;
    i = j;
  }
  return out;
}
/** Keep Tab inside `root` (for a system whose own trap lets focus out). */
function keepTabInside(e: React.KeyboardEvent, root: HTMLElement | null) {
  if (e.key !== "Tab" || !root) return;
  const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null && !el.classList.contains("cds--visually-hidden"));
  if (!items.length) return;
  const [first, last] = [items[0], items[items.length - 1]];
  const now = document.activeElement;
  if (e.shiftKey && (now === first || !root.contains(now))) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && (now === last || !root.contains(now))) { e.preventDefault(); first.focus(); }
}
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

function UoauiForm({ mode, density, model }: Omit<Props, "system">) {
  const title = React.useId();
  const css = React.useMemo(() => scopeCss(sanitizeCSS(getFullCSS("uoaui", getTheme("uoaui", mode), coerceDensity(density)))), [mode, density]);
  const panel = React.useRef<HTMLDivElement>(null);
  /* uoaui's colours live in its theme object, not in CSS variables. */
  const tokens = React.useMemo(() => {
    const t = getTheme("uoaui", mode) as unknown as Record<string, string>;
    return {
      color: t.fg, "--cal-fg": t.fg, "--cal-muted": t.fg2, "--cal-off": t.fgDisabled ?? t.fg3,
      "--cal-accent": t.accent, "--cal-accent-fg": t.accentFg, "--cal-hover": t.surfaceHover,
      "--cal-range": t.accentSurface, "--cal-focus": t.accent, "--cal-radius": "var(--a-radius-full)",
    } as React.CSSProperties;
  }, [mode]);
  React.useEffect(() => {
    if (!model.open) return;
    const first = panel.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
  }, [model.open]);
  if (!model.open || typeof document === "undefined") return null;
  const trap = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const [first, last] = [items[0], items[items.length - 1]];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  return createPortal(
    <div className="preview-uoaui a-app dh-form-dialog-scope">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="a-dialog-backdrop dh-form-dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) model.onClose(); }}>
        <div ref={panel} className="a-dialog dh-form-dialog dh-form-dialog-uoaui" style={tokens} role="dialog" aria-modal="true" aria-labelledby={title} onKeyDown={trap}>
          <form onSubmit={submitOnEnter(model)} noValidate>
            <h2 id={title} className="dh-form-dialog-title">{model.title}</h2>
            {model.note ? <p className="dh-form-dialog-note">{model.note}</p> : null}
            {model.choice ? (
              <div className="a-tabs dh-form-dialog-choice" role="tablist" aria-label={model.choice.label}>
                {model.choice.options.map((o) => (
                  <button key={o} type="button" role="tab" aria-selected={o === model.choice!.value} tabIndex={o === model.choice!.value ? 0 : -1} className={`a-tab${o === model.choice!.value ? " active" : ""}`} onClick={() => model.choice!.onChange(o)}
                    onKeyDown={(e) => {
                      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
                      const opts = model.choice!.options;
                      const next = opts[(opts.indexOf(o) + (e.key === "ArrowRight" ? 1 : opts.length - 1)) % opts.length];
                      model.choice!.onChange(next);
                      (e.currentTarget.parentElement?.querySelector(`[data-tab="${next}"]`) as HTMLElement | null)?.focus();
                    }} data-tab={o}>{o}</button>
                ))}
              </div>
            ) : null}
            {model.calendar ? <MonthCalendar model={model.calendar} system="uoaui" /> : null}
            <Rows model={model} render={(f) => (
              <div className={`a-input-wrap${f.error ? " a-input-error" : ""}`}>
                <label className="a-input-label" htmlFor={f.id}>{f.label}</label>
                <input id={f.id} className="a-input" type={f.type} value={f.value} placeholder={f.placeholder} min={f.min} max={f.max}
                  aria-invalid={f.error ? true : undefined} aria-describedby={f.error ? errorId(f) : undefined} onChange={(e) => f.onChange(e.target.value)} onFocus={f.onFocus} />
                {f.error ? <span id={errorId(f)} className="dh-form-dialog-error">{f.error}</span> : null}
              </div>
            )} />
            <div className="dh-form-dialog-actions">
              <button type="button" className="a-btn a-btn-ghost" onClick={model.onClose}>{model.cancel.label}</button>
              <button type="submit" className="a-btn a-btn-primary">{model.primary.label}</button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ── The month calendar ──
   None of the installed packages for Salt (core), Material (core) or Fluent
   (react-components) ships a calendar; Carbon's is flatpickr, which draws
   outside its scope. So, as the original did for Salt, one calendar grid
   in each system's own colours, type and radius (dh-cal-<system> in
   builder.css), with the WAI-ARIA date grid's keys. */
const WEEKDAYS = [["Mo", "Monday"], ["Tu", "Tuesday"], ["We", "Wednesday"], ["Th", "Thursday"], ["Fr", "Friday"], ["Sa", "Saturday"], ["Su", "Sunday"]] as const;
const DAY_NAME = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function MonthCalendar({ model, system }: { model: CalendarModel; system: SystemId }) {
  const labelId = React.useId();
  const grid = React.useRef<HTMLTableElement>(null);
  const [focusDay, setFocusDay] = React.useState(() => model.selected[0] ?? model.max);
  const wantsFocus = React.useRef(false);
  const shownMonth = monthOf(focusDay) === model.month ? focusDay : (model.selected.find((d) => monthOf(d) === model.month) ?? `${model.month}-01`);
  React.useEffect(() => {
    if (!wantsFocus.current) return;
    wantsFocus.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`[data-day="${focusDay}"]`)?.focus();
  }, [focusDay, model.month]);
  /* Why a day cannot be picked: outside the data's days, or inside them with no bars. */
  const offOf = (day: string): "outside" | "closed" | undefined => (day < model.min || day > model.max ? "outside" : model.enabled(day) ? undefined : "closed");
  const kinds = new Set(monthGrid(model.month).flat().map((day) => (day ? offOf(day) : undefined)));
  const bothKinds = kinds.has("outside") && kinds.has("closed");
  const [lo, hi] = model.selected.length > 1 ? [...model.selected].sort() : [model.selected[0], model.selected[0]];
  const canPrev = addMonths(model.month, -1) >= monthOf(model.min);
  const canNext = addMonths(model.month, 1) <= monthOf(model.max);
  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>, day: string) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (model.enabled(day)) model.onPick(day); return; }
    const next = moveDay(day, e.key, { min: model.min, max: model.max });
    if (!next) return;
    e.preventDefault();
    e.stopPropagation();
    wantsFocus.current = true;
    setFocusDay(next);
    if (monthOf(next) !== model.month) model.onMonth(monthOf(next));
  };
  return (
    <div className={`dh-cal dh-cal-${system}`}>
      <div className="dh-cal-head">
        <button type="button" className="dh-cal-nav" aria-label="Previous month" disabled={!canPrev} onClick={() => model.onMonth(addMonths(model.month, -1))}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>
        </button>
        <span id={labelId} className="dh-cal-month" aria-live="polite">{monthLabel(model.month)}</span>
        <button type="button" className="dh-cal-nav" aria-label="Next month" disabled={!canNext} onClick={() => model.onMonth(addMonths(model.month, 1))}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
        </button>
      </div>
      <table ref={grid} className="dh-cal-grid" role="grid" aria-labelledby={labelId}>
        <thead>
          <tr>{WEEKDAYS.map(([s, l]) => <th key={s} scope="col" abbr={l}>{s}</th>)}</tr>
        </thead>
        <tbody>
          {monthGrid(model.month).map((week, w) => (
            <tr key={w}>
              {week.map((day, i) => {
                if (!day) return <td key={i} role="gridcell" />;
                const off = offOf(day);
                const on = off === undefined;
                const outside = off === "outside";
                const picked = model.selected.includes(day);
                const inRange = lo !== undefined && day > lo && day < hi;
                return (
                  <td key={i} role="gridcell" aria-selected={picked} className={`${picked ? "is-picked" : ""}${inRange ? " is-between" : ""}`}>
                    <button
                      type="button" data-day={day} tabIndex={day === shownMonth ? 0 : -1}
                      className="dh-cal-day" aria-disabled={on ? undefined : true} data-off={off}
                      aria-label={`${DAY_NAME.format(Date.parse(`${day}T00:00:00Z`))}${on ? "" : outside ? ", outside the sample data" : ", market closed, no sample data"}`}
                      onClick={() => { setFocusDay(day); if (on) model.onPick(day); }}
                      onKeyDown={(e) => onKey(e, day)}
                    >
                      {Number(day.slice(8))}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {/* A key, when the month shows both kinds of day that cannot be picked. */}
      {bothKinds ? (
        <p className="dh-cal-legend">
          <span><span className="dh-cal-key dh-cal-key-closed" aria-hidden="true">12</span>Market closed</span>
          <span><span className="dh-cal-key" aria-hidden="true">12</span>Outside the sample data</span>
        </p>
      ) : null}
      {model.prompt ? <p className="dh-cal-prompt" aria-live="polite">{model.prompt}</p> : null}
    </div>
  );
}

export function RealFormDialog({ system, mode, density, model }: Props): React.ReactElement | null {
  useDialogKeys(model);
  if (system === "salt") return <SaltForm mode={mode} density={density} model={model} />;
  if (system === "m3") return <M3Form mode={mode} density={density} model={model} />;
  if (system === "fluent") return <FluentForm mode={mode} density={density} model={model} />;
  if (system === "carbon") return <CarbonForm mode={mode} density={density} model={model} />;
  if (system === "uoaui") return <UoauiForm mode={mode} density={density} model={model} />;
  return null;
}
