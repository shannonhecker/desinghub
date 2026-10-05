"use client";

/**
 * RealConfigDialog - a data-bound panel's Configuration dialog, drawn with
 * the active design system's own components (reached through
 * RealComponentRenderer as the type "ConfigDialog"; it is not a canvas block).
 *
 * The layout is the original Analytics Dashboard's: a title and a close X;
 * Component Type, then Aggregated (a switch and an info button); tabs
 * (Columns, Groups, Display); on Columns and Groups a filter and two panes,
 * Available (a tree of Dimensions and Metrics) and what is chosen; a footer
 * with Reset to first loaded, "Changes applied automatically" and Close.
 *
 *   Salt: Dialog, Dropdown, Switch, Tooltip, Tabs, Input, Button, @salt-ds/icons.
 *   Material 3: Dialog, Select, Switch, Tooltip, Tabs, TextField, Button, IconButton.
 *   Fluent 2: Dialog, Dropdown, Switch, Tooltip, TabList, Input, Button, react-icons.
 *   Carbon: ComposedModal, Select, Toggle, Tooltip, Tabs, Search, Button, icons-react.
 *   uoaui: its .a-dialog, .a-input, .a-switch, .a-tabs and .a-btn classes.
 *
 * No system ships a tree in its core library, so the tree is ours: a
 * role="tree" list in the dialog's own type and colours, with the tree keys.
 *
 * Escape (overlayEscape) closes it and focus goes back to the launcher.
 */

import React from "react";
import { createPortal } from "react-dom";
import { useOverlayEscape, useReturnFocus } from "@/lib/overlayEscape";
import { getFullCSS, getTheme } from "@/data/registry";
import { sanitizeCSS } from "@/lib/sanitizeCSS";
import { coerceDensity, type DensityLevel } from "@/lib/densitySize";
import { CarbonScopeStyles } from "@/components/ui-kit/CarbonScopeStyles";
import { ChromeIcon } from "@/components/builder/ChromeIcon";
import type { SystemId } from "@/lib/componentApiRegistry";
import type { AvailableTree, ConfigTab } from "@/lib/reportData/panelConfigDialog";

import {
  SaltProvider, Dialog as SaltDialog, DialogHeader as SaltDialogHeader, DialogContent as SaltDialogContent,
  DialogActions as SaltDialogActions, DialogCloseButton as SaltDialogCloseButton, FormField as SaltFormField,
  FormFieldLabel as SaltFormFieldLabel, Input as SaltInput, Button as SaltButton, Dropdown as SaltDropdown,
  Option as SaltOption, Switch as SaltSwitch, Tooltip as SaltTooltip, Tabs as SaltTabs, TabBar as SaltTabBar,
  TabList as SaltTabList, Tab as SaltTab, TabTrigger as SaltTabTrigger, TabPanel as SaltTabPanel,
} from "@salt-ds/core";
import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, ChevronRightIcon, CloseIcon, FilterIcon, InfoIcon } from "@salt-ds/icons";

import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { buildM3Theme } from "@/lib/m3MuiTheme";
import MuiDialog from "@mui/material/Dialog";
import MuiDialogTitle from "@mui/material/DialogTitle";
import MuiDialogContent from "@mui/material/DialogContent";
import MuiDialogActions from "@mui/material/DialogActions";
import MuiTextField from "@mui/material/TextField";
import MuiSelect from "@mui/material/Select";
import MuiButton from "@mui/material/Button";
import MuiIconButton from "@mui/material/IconButton";
import MuiMenuItem from "@mui/material/MenuItem";
import MuiSwitch from "@mui/material/Switch";
import MuiFormControlLabel from "@mui/material/FormControlLabel";
import MuiTooltip from "@mui/material/Tooltip";
import MuiTabs from "@mui/material/Tabs";
import MuiTab from "@mui/material/Tab";
import MuiInputAdornment from "@mui/material/InputAdornment";

import {
  FluentProvider, webLightTheme, webDarkTheme, Dialog as FluentDialog, DialogSurface as FluentDialogSurface,
  DialogBody as FluentDialogBody, DialogTitle as FluentDialogTitle, DialogContent as FluentDialogContent,
  DialogActions as FluentDialogActions, Field as FluentField, Input as FluentInput, Button as FluentButton,
  Dropdown as FluentDropdown, Option as FluentOption, Switch as FluentSwitch, Tooltip as FluentTooltip,
  TabList as FluentTabList, Tab as FluentTab,
} from "@fluentui/react-components";
import {
  ArrowDown16Regular, ArrowUp16Regular, ChevronDown16Regular, ChevronRight16Regular, Dismiss16Regular, Dismiss20Regular,
  Filter20Regular, Info16Regular,
} from "@fluentui/react-icons";

import {
  ComposedModal as CarbonComposedModal, ModalHeader as CarbonModalHeader, ModalBody as CarbonModalBody,
  ModalFooter as CarbonModalFooter, Select as CarbonSelect, SelectItem as CarbonSelectItem, Toggle as CarbonToggle,
  Tabs as CarbonTabs, TabList as CarbonTabList, Tab as CarbonTab, TabPanels as CarbonTabPanels,
  TabPanel as CarbonTabPanel, Search as CarbonSearch, Button as CarbonButton,
} from "@carbon/react";
import {
  ArrowDown as CarbonArrowDown, ArrowUp as CarbonArrowUp, ChevronDown as CarbonChevronDown, ChevronRight as CarbonChevronRight,
  Close as CarbonClose, Filter as CarbonFilter, Information as CarbonInformation,
} from "@carbon/icons-react";

/* ── Model ── */

export interface ConfigSelect { id: string; label: string; value: string; options: readonly string[]; onChange: (value: string) => void; note?: string }
export interface ConfigChosen { key: string; label: string; tag: "abc" | "123" }
export interface ConfigColumn extends ConfigChosen { agg: string; canUp: boolean; canDown: boolean; canRemove: boolean }

export interface ConfigDialogModel {
  open: boolean;
  /** The panel's title, for the dialog's description. */
  panel: string;
  onClose: () => void;
  returnFocus?: React.RefObject<HTMLElement | null>;
  /** Up / down / fg colours from the canvas (tag colours). */
  tones?: React.CSSProperties;
  componentType: ConfigSelect;
  aggregated: { checked: boolean; disabled: boolean; info: string; onChange: (on: boolean) => void };
  tab: ConfigTab;
  tabs: { value: ConfigTab; label: string }[];
  onTab: (tab: ConfigTab) => void;
  filter: string;
  onFilter: (value: string) => void;
  tree: AvailableTree;
  onAdd: (key: string) => void;
  columns: ConfigColumn[];
  aggOptions: readonly string[];
  onAgg: (key: string, label: string) => void;
  onMove: (key: string, by: -1 | 1) => void;
  onRemoveColumn: (key: string) => void;
  /** `pivot` false: the chart has no column group (a pie or donut). */
  groups: { rows: ConfigChosen | null; columns: ConfigChosen | null; pivot: boolean };
  onRemoveGroup: (slot: "rows" | "columns") => void;
  display: ConfigSelect[];
  /** A note over the tabs (a hand-built layout). */
  note?: string;
  reset: { disabled: boolean; onClick: () => void };
}

type Mode = "light" | "dark";
interface Props { system: SystemId; mode: Mode; density?: DensityLevel | string; model: ConfigDialogModel }

type IconName = "up" | "down" | "remove" | "info" | "filter" | "open" | "closed" | "close";
/** The pieces each system draws with its own components. */
interface Kit {
  icon: (name: IconName) => React.ReactNode;
  select: (s: ConfigSelect, opts?: { compact?: boolean }) => React.ReactNode;
  toggle: (m: ConfigDialogModel["aggregated"], id: string) => React.ReactNode;
  info: (label: string, text: string) => React.ReactNode;
  tabs: (model: ConfigDialogModel, panel: React.ReactNode) => React.ReactNode;
  filter: (id: string, value: string, onChange: (v: string) => void) => React.ReactNode;
  iconButton: (label: string, icon: IconName, onClick: () => void, disabled?: boolean) => React.ReactNode;
  button: (label: string, kind: "quiet" | "secondary", onClick: () => void, disabled?: boolean) => React.ReactNode;
}

const FILTER_LABEL = "Filter Columns";
const FILTER_PLACEHOLDER = "Filter attributes, columns, groups";
const NOTE = "Changes applied automatically";
const RESET = "Reset to first loaded";
const tabId = (t: string) => `dh-cfg-tab-${t}`;
const panelId = (t: string) => `dh-cfg-panel-${t}`;

/* ── The tree (ours: no system ships one in its core) ── */

function AvailablePane({ model, kit }: { model: ConfigDialogModel; kit: Kit }) {
  const [closed, setClosed] = React.useState<Set<string>>(() => new Set());
  const [active, setActive] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLUListElement>(null);
  const toggle = (id: string, open?: boolean) => setClosed((s) => {
    const n = new Set(s);
    const isOpen = !n.has(id);
    if (open ?? !isOpen) n.delete(id); else n.add(id);
    return n;
  });
  /* Visible items, in order, for the keys. */
  const items: { id: string; kind: "branch" | "leaf"; key?: string; addable?: boolean; parent?: string }[] = [];
  for (const g of model.tree.groups) {
    items.push({ id: g.id, kind: "branch" });
    if (closed.has(g.id)) continue;
    items.push({ id: `${g.id}-fields`, kind: "branch", parent: g.id });
    if (closed.has(`${g.id}-fields`)) continue;
    for (const l of g.leaves) items.push({ id: `leaf-${l.key}`, kind: "leaf", key: l.key, addable: l.addable, parent: `${g.id}-fields` });
  }
  const current = items.find((i) => i.id === active)?.id ?? items[0]?.id;
  const focus = (id: string | undefined) => {
    if (!id) return;
    setActive(id);
    window.requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>(`[data-node="${id}"]`)?.focus());
  };
  const onKey = (e: React.KeyboardEvent) => {
    const at = items.findIndex((i) => i.id === current);
    const it = items[at];
    if (!it) return;
    if (e.key === "ArrowDown") { e.preventDefault(); focus(items[Math.min(items.length - 1, at + 1)].id); }
    else if (e.key === "ArrowUp") { e.preventDefault(); focus(items[Math.max(0, at - 1)].id); }
    else if (e.key === "Home") { e.preventDefault(); focus(items[0].id); }
    else if (e.key === "End") { e.preventDefault(); focus(items[items.length - 1].id); }
    else if (e.key === "ArrowRight" && it.kind === "branch") { e.preventDefault(); if (closed.has(it.id)) toggle(it.id, true); else focus(items[at + 1]?.id); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); if (it.kind === "branch" && !closed.has(it.id)) toggle(it.id, false); else focus(it.parent); }
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (it.kind === "branch") toggle(it.id);
      else if (it.addable && it.key) model.onAdd(it.key);
    }
  };
  const branch = (id: string, label: string, count: number, level: number, children: React.ReactNode) => {
    const open = !closed.has(id);
    return (
      <li role="treeitem" aria-expanded={open} aria-level={level} aria-selected={false} tabIndex={current === id ? 0 : -1} data-node={id}
        className="dh-cfg-node" onFocus={(e) => { if (e.target === e.currentTarget) setActive(id); }}
        onClick={(e) => { e.stopPropagation(); setActive(id); toggle(id); }}>
        <span className="dh-cfg-row" style={{ "--dh-cfg-level": level - 1 } as React.CSSProperties}>
          <span className="dh-cfg-chevron" aria-hidden="true">{kit.icon(open ? "open" : "closed")}</span>
          <span className="dh-cfg-name">{label}</span>
          <span className="dh-cfg-count">({count})</span>
        </span>
        {open ? <ul role="group">{children}</ul> : null}
      </li>
    );
  };
  return (
    <section className="dh-cfg-pane" aria-labelledby="dh-cfg-available">
      <h3 className="dh-cfg-pane-head" id="dh-cfg-available">Available: {model.tree.count}</h3>
      <div className="dh-cfg-pane-body">
        {model.tree.count === 0 ? (
          <div className="dh-cfg-empty"><p className="dh-cfg-empty-title">No matches</p><p className="dh-cfg-empty-hint">Try another name</p></div>
        ) : (
          <ul ref={ref} role="tree" aria-labelledby="dh-cfg-available" className="dh-cfg-tree" onKeyDown={onKey}>
            {model.tree.groups.map((g) => (
              <React.Fragment key={g.id}>
                {branch(g.id, g.label, g.leaves.length, 1,
                  branch(`${g.id}-fields`, "Fields", g.leaves.length, 2,
                    g.leaves.map((l) => {
                      const id = `leaf-${l.key}`;
                      return (
                        <li key={l.key} role="treeitem" aria-level={3} aria-selected={false} aria-disabled={!l.addable || undefined} tabIndex={current === id ? 0 : -1} data-node={id}
                          className={`dh-cfg-node dh-cfg-leaf${l.addable ? " is-addable" : ""}`} title={l.addable ? `Add ${l.label}` : undefined}
                          onFocus={(e) => { if (e.target === e.currentTarget) setActive(id); }}
                          onClick={(e) => { e.stopPropagation(); setActive(id); if (l.addable) model.onAdd(l.key); }}>
                          <span className="dh-cfg-row" style={{ "--dh-cfg-level": 2 } as React.CSSProperties}>
                            <span className={`dh-cfg-tag dh-cfg-tag-${l.tag === "abc" ? "dim" : "num"}`} aria-hidden="true">{l.tag}</span>
                            <span className="dh-cfg-name">{l.label}</span>
                            {l.addable ? <span className="dh-cfg-sr">, press Enter to add</span> : null}
                          </span>
                        </li>
                      );
                    })))}
              </React.Fragment>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Empty({ title, hint }: { title: string; hint: string }) {
  return <div className="dh-cfg-empty"><p className="dh-cfg-empty-title">{title}</p><p className="dh-cfg-empty-hint">{hint}</p></div>;
}

function ChosenRow({ item, kit, children, actions }: { item: ConfigChosen; kit: Kit; children?: React.ReactNode; actions: React.ReactNode }) {
  void kit;
  return (
    <li className="dh-cfg-chosen" data-key={item.key}>
      <div className="dh-cfg-chosen-line">
        <span className={`dh-cfg-tag dh-cfg-tag-${item.tag === "abc" ? "dim" : "num"}`} aria-hidden="true">{item.tag}</span>
        <span className="dh-cfg-name">{item.label}</span>
        <span className="dh-cfg-actions">{actions}</span>
      </div>
      {children}
    </li>
  );
}

function ColumnsPane({ model, kit }: { model: ConfigDialogModel; kit: Kit }) {
  return (
    <section className="dh-cfg-pane" aria-labelledby="dh-cfg-chosen-cols">
      <h3 className="dh-cfg-pane-head" id="dh-cfg-chosen-cols">Columns: {model.columns.length}</h3>
      <div className="dh-cfg-pane-body">
        {model.columns.length === 0 ? <Empty title="No columns" hint="Add metrics from Available" /> : (
          <ol className="dh-cfg-list">
            {model.columns.map((c) => (
              <ChosenRow key={c.key} item={c} kit={kit} actions={<>
                {kit.iconButton(`Move ${c.label} up`, "up", () => model.onMove(c.key, -1), !c.canUp)}
                {kit.iconButton(`Move ${c.label} down`, "down", () => model.onMove(c.key, 1), !c.canDown)}
                {kit.iconButton(`Remove ${c.label}`, "remove", () => model.onRemoveColumn(c.key), !c.canRemove)}
              </>}>
                <div className="dh-cfg-agg-select">{kit.select({ id: `dh-cfg-agg-${c.key}`, label: `Aggregation for ${c.label}`, value: c.agg, options: model.aggOptions, onChange: (v) => model.onAgg(c.key, v) }, { compact: true })}</div>
              </ChosenRow>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function GroupsPane({ model, kit }: { model: ConfigDialogModel; kit: Kit }) {
  const { rows, columns } = model.groups;
  const slot = (title: string, item: ConfigChosen | null, which: "rows" | "columns", empty: string) => (
    <div className="dh-cfg-slot">
      <h4 className="dh-cfg-slot-head">{title}</h4>
      {item ? (
        <ul className="dh-cfg-list">
          <ChosenRow item={item} kit={kit} actions={kit.iconButton(`Remove ${item.label} from ${title.toLowerCase()}`, "remove", () => model.onRemoveGroup(which))} />
        </ul>
      ) : <p className="dh-cfg-slot-empty">{empty}</p>}
    </div>
  );
  return (
    <section className="dh-cfg-pane" aria-labelledby="dh-cfg-chosen-groups">
      <h3 className="dh-cfg-pane-head" id="dh-cfg-chosen-groups">Row Groups</h3>
      <div className="dh-cfg-pane-body">
        {!rows ? <Empty title="No row groups" hint="Add attributes from Available" /> : (
          <>
            {slot("Row group", rows, "rows", "")}
            {slot("Column group", columns, "columns", model.groups.pivot ? "Add another attribute to split the figures into columns" : "A pie or donut has no column group")}
          </>
        )}
      </div>
    </section>
  );
}

function TabContent({ model, kit }: { model: ConfigDialogModel; kit: Kit }) {
  if (model.tab === "display") {
    return (
      <div className="dh-cfg-display">
        {model.display.map((s) => (
          <div key={s.id} className="dh-cfg-display-field">
            {kit.select(s)}
            {s.note ? <p className="dh-cfg-note">{s.note}</p> : null}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="dh-cfg-split">
      <div className="dh-cfg-filter">{kit.filter(`dh-cfg-filter-${model.tab}`, model.filter, model.onFilter)}</div>
      <div className="dh-cfg-panes">
        <AvailablePane model={model} kit={kit} />
        {model.tab === "groups" ? <GroupsPane model={model} kit={kit} /> : <ColumnsPane model={model} kit={kit} />}
      </div>
    </div>
  );
}

/** Everything between the title and the footer. */
function Body({ model, kit }: { model: ConfigDialogModel; kit: Kit }) {
  return (
    <div className="dh-cfg" style={model.tones}>
      <div className="dh-cfg-top">
        <div className="dh-cfg-type">{kit.select(model.componentType)}</div>
        <div className="dh-cfg-aggregated">
          {kit.toggle(model.aggregated, "dh-cfg-aggregated")}
          {kit.info("About Aggregated", model.aggregated.info)}
        </div>
      </div>
      {model.note ? <p className="dh-cfg-note">{model.note}</p> : null}
      {kit.tabs(model, <TabContent model={model} kit={kit} />)}
    </div>
  );
}

function Footer({ model, kit }: { model: ConfigDialogModel; kit: Kit }) {
  return (
    <div className="dh-cfg-footer">
      <span className="dh-cfg-reset">{kit.button(RESET, "quiet", model.reset.onClick, model.reset.disabled)}</span>
      <span className="dh-cfg-footer-end">
        <span className="dh-cfg-applied">{NOTE}</span>
        {kit.button("Close", "secondary", model.onClose)}
      </span>
    </div>
  );
}

/* Tabs: arrow keys move along (for the systems whose tabs are ours). */
function tabKeys(model: ConfigDialogModel, e: React.KeyboardEvent, current: ConfigTab, root: HTMLElement | null) {
  const opts = model.tabs.map((t) => t.value);
  const at = opts.indexOf(current);
  let next: ConfigTab | undefined;
  if (e.key === "ArrowRight") next = opts[(at + 1) % opts.length];
  else if (e.key === "ArrowLeft") next = opts[(at + opts.length - 1) % opts.length];
  else if (e.key === "Home") next = opts[0];
  else if (e.key === "End") next = opts[opts.length - 1];
  if (!next) return;
  e.preventDefault();
  model.onTab(next);
  root?.querySelector<HTMLElement>(`#${tabId(next)}`)?.focus();
}

/* ── Salt ── */
const saltKit: Kit = {
  icon: (n) => ({ up: <ArrowUpIcon aria-hidden />, down: <ArrowDownIcon aria-hidden />, remove: <CloseIcon aria-hidden />, close: <CloseIcon aria-hidden />, info: <InfoIcon aria-hidden />, filter: <FilterIcon aria-hidden />, open: <ChevronDownIcon aria-hidden />, closed: <ChevronRightIcon aria-hidden /> })[n],
  select: (s, o) => o?.compact ? (
    <SaltDropdown id={s.id} aria-label={s.label} selected={[s.value]} onSelectionChange={(_e, items: string[]) => { if (items[0]) s.onChange(items[0]); }}>
      {s.options.map((v) => <SaltOption key={v} value={v}>{v}</SaltOption>)}
    </SaltDropdown>
  ) : (
    <SaltFormField>
      <SaltFormFieldLabel>{s.label}</SaltFormFieldLabel>
      <SaltDropdown id={s.id} selected={[s.value]} onSelectionChange={(_e, items: string[]) => { if (items[0]) s.onChange(items[0]); }}>
        {s.options.map((v) => <SaltOption key={v} value={v}>{v}</SaltOption>)}
      </SaltDropdown>
    </SaltFormField>
  ),
  toggle: (m, id) => <SaltSwitch id={id} label="Aggregated" checked={m.checked} disabled={m.disabled} onChange={(e) => m.onChange(e.target.checked)} />,
  info: (label, text) => (
    <SaltTooltip content={text} placement="bottom">
      <SaltButton appearance="transparent" sentiment="neutral" aria-label={label} className="dh-cfg-icon-btn">{saltKit.icon("info")}</SaltButton>
    </SaltTooltip>
  ),
  tabs: (model, panel) => (
    <SaltTabs value={model.tab} onChange={(_e, v) => model.onTab(v as ConfigTab)} className="dh-cfg-tabs">
      <SaltTabBar divider>
        <SaltTabList aria-label="Configuration sections">
          {model.tabs.map((t) => <SaltTab key={t.value} value={t.value}><SaltTabTrigger>{t.label}</SaltTabTrigger></SaltTab>)}
        </SaltTabList>
      </SaltTabBar>
      {model.tabs.map((t) => <SaltTabPanel key={t.value} value={t.value} className="dh-cfg-tabpanel">{t.value === model.tab ? panel : null}</SaltTabPanel>)}
    </SaltTabs>
  ),
  filter: (id, value, onChange) => (
    <SaltFormField>
      <SaltFormFieldLabel>{FILTER_LABEL}</SaltFormFieldLabel>
      <SaltInput value={value} placeholder={FILTER_PLACEHOLDER} startAdornment={saltKit.icon("filter")} onChange={(e) => onChange((e.target as HTMLInputElement).value)} inputProps={{ id }} />
    </SaltFormField>
  ),
  iconButton: (label, icon, onClick, disabled) => (
    <SaltButton appearance="transparent" sentiment="neutral" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="dh-cfg-icon-btn">{saltKit.icon(icon)}</SaltButton>
  ),
  button: (label, kind, onClick, disabled) => (
    <SaltButton appearance={kind === "quiet" ? "transparent" : "bordered"} sentiment={kind === "quiet" ? "accented" : "neutral"} disabled={disabled} onClick={onClick}>{label}</SaltButton>
  ),
};
function SaltConfig({ mode, density, model }: Omit<Props, "system">) {
  return (
    <SaltProvider mode={mode} density={coerceDensity(density)} applyClassesTo="scope">
      <SaltDialog open={model.open} onOpenChange={(o) => { if (!o) model.onClose(); }} size="medium" className="dh-kit-dialog dh-cfg-dialog dh-cfg-salt" aria-describedby="dh-cfg-desc">
        <SaltDialogHeader header="Configuration" />
        <SaltDialogContent>
          <p id="dh-cfg-desc" className="dh-cfg-sr">Configure {model.panel}</p>
          <Body model={model} kit={saltKit} />
        </SaltDialogContent>
        <SaltDialogActions><Footer model={model} kit={saltKit} /></SaltDialogActions>
        <SaltDialogCloseButton onClick={model.onClose} aria-label="Close configuration" />
      </SaltDialog>
    </SaltProvider>
  );
}

/* ── Material 3 ── (icons: the Material Symbols shapes, as inline SVG) */
const m3Icon = (n: IconName) => <ChromeIcon name={({ up: "arrow_upward", down: "arrow_downward", remove: "close", close: "close", info: "info", filter: "filter_alt", open: "expand_more", closed: "chevron_right" } as const)[n]} />;
const muiKit: Kit = {
  icon: m3Icon,
  select: (s, o) => o?.compact ? (
    <MuiSelect id={s.id} size="small" fullWidth value={s.value} onChange={(e) => s.onChange(String(e.target.value))} SelectDisplayProps={{ "aria-label": s.label } as React.HTMLAttributes<HTMLDivElement>}>
      {s.options.map((v) => <MuiMenuItem key={v} value={v}>{v}</MuiMenuItem>)}
    </MuiSelect>
  ) : (
    <MuiTextField select id={s.id} label={s.label} value={s.value} size="small" fullWidth onChange={(e) => s.onChange(e.target.value)}>
      {s.options.map((v) => <MuiMenuItem key={v} value={v}>{v}</MuiMenuItem>)}
    </MuiTextField>
  ),
  toggle: (m, id) => <MuiFormControlLabel labelPlacement="start" label="Aggregated" disabled={m.disabled} control={<MuiSwitch id={id} checked={m.checked} onChange={(e) => m.onChange(e.target.checked)} />} />,
  info: (label, text) => (
    <MuiTooltip title={text} placement="bottom">
      <span><MuiIconButton size="small" aria-label={label}>{m3Icon("info")}</MuiIconButton></span>
    </MuiTooltip>
  ),
  tabs: (model, panel) => (
    <div className="dh-cfg-tabs">
      <MuiTabs value={model.tab} onChange={(_e, v) => model.onTab(v as ConfigTab)} aria-label="Configuration sections" className="dh-cfg-tablist">
        {model.tabs.map((t) => <MuiTab key={t.value} value={t.value} label={t.label} id={tabId(t.value)} aria-controls={panelId(t.value)} />)}
      </MuiTabs>
      <div role="tabpanel" id={panelId(model.tab)} aria-labelledby={tabId(model.tab)} className="dh-cfg-tabpanel">{panel}</div>
    </div>
  ),
  filter: (id, value, onChange) => (
    <MuiTextField id={id} label={FILTER_LABEL} placeholder={FILTER_PLACEHOLDER} value={value} size="small" fullWidth variant="standard" onChange={(e) => onChange(e.target.value)}
      slotProps={{ input: { startAdornment: <MuiInputAdornment position="start">{m3Icon("filter")}</MuiInputAdornment> }, inputLabel: { shrink: true } }} />
  ),
  iconButton: (label, icon, onClick, disabled) => (
    <MuiIconButton size="small" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="dh-cfg-icon-btn">{m3Icon(icon)}</MuiIconButton>
  ),
  button: (label, kind, onClick, disabled) => <MuiButton variant={kind === "quiet" ? "text" : "outlined"} disabled={disabled} onClick={onClick}>{label}</MuiButton>,
};
function M3Config({ mode, model }: Omit<Props, "system">) {
  const theme = React.useMemo(() => buildM3Theme({ mode }), [mode]);
  return (
    <MuiThemeProvider theme={theme}>
      <MuiDialog open={model.open} onClose={model.onClose} maxWidth={false} aria-labelledby="dh-cfg-title-m3" aria-describedby="dh-cfg-desc" className="dh-kit-dialog dh-cfg-dialog dh-cfg-m3"
        slotProps={{ paper: { className: "dh-cfg-paper", sx: { fontFamily: theme.typography.fontFamily } } }}>
        <MuiDialogTitle id="dh-cfg-title-m3" className="dh-cfg-title-row">
          <span>Configuration</span>
          <MuiIconButton aria-label="Close configuration" onClick={model.onClose}>{m3Icon("close")}</MuiIconButton>
        </MuiDialogTitle>
        <MuiDialogContent sx={{ fontFamily: theme.typography.fontFamily }}>
          <p id="dh-cfg-desc" className="dh-cfg-sr">Configure {model.panel}</p>
          <Body model={model} kit={muiKit} />
        </MuiDialogContent>
        <MuiDialogActions style={{ fontFamily: theme.typography.fontFamily }}><Footer model={model} kit={muiKit} /></MuiDialogActions>
      </MuiDialog>
    </MuiThemeProvider>
  );
}

/* ── Fluent 2 ── */
const fluentKit: Kit = {
  icon: (n) => ({ up: <ArrowUp16Regular />, down: <ArrowDown16Regular />, remove: <Dismiss16Regular />, close: <Dismiss20Regular />, info: <Info16Regular />, filter: <Filter20Regular />, open: <ChevronDown16Regular />, closed: <ChevronRight16Regular /> })[n],
  select: (s, o) => {
    const dd = (
      <FluentDropdown id={s.id} aria-label={o?.compact ? s.label : undefined} size={o?.compact ? "small" : "medium"} value={s.value} selectedOptions={[s.value]} onOptionSelect={(_e, d) => { if (d.optionValue) s.onChange(d.optionValue); }} style={{ minWidth: 0, width: "100%" }}>
        {s.options.map((v) => <FluentOption key={v} value={v}>{v}</FluentOption>)}
      </FluentDropdown>
    );
    return o?.compact ? dd : <FluentField label={s.label}>{dd}</FluentField>;
  },
  toggle: (m, id) => <FluentSwitch id={id} label="Aggregated" labelPosition="before" checked={m.checked} disabled={m.disabled} onChange={(_e, d) => m.onChange(d.checked)} />,
  info: (label, text) => (
    <FluentTooltip content={text} relationship="description" positioning="below">
      <FluentButton appearance="subtle" size="small" aria-label={label} icon={fluentKit.icon("info") as React.ReactElement} className="dh-cfg-icon-btn" />
    </FluentTooltip>
  ),
  tabs: (model, panel) => (
    <div className="dh-cfg-tabs">
      <FluentTabList selectedValue={model.tab} onTabSelect={(_e, d) => model.onTab(d.value as ConfigTab)} aria-label="Configuration sections" className="dh-cfg-tablist">
        {model.tabs.map((t) => <FluentTab key={t.value} value={t.value} id={tabId(t.value)} aria-controls={panelId(t.value)}>{t.label}</FluentTab>)}
      </FluentTabList>
      <div role="tabpanel" id={panelId(model.tab)} aria-labelledby={tabId(model.tab)} className="dh-cfg-tabpanel">{panel}</div>
    </div>
  ),
  filter: (id, value, onChange) => (
    <FluentField label={FILTER_LABEL}>
      <FluentInput id={id} appearance="underline" value={value} placeholder={FILTER_PLACEHOLDER} contentBefore={fluentKit.icon("filter") as React.ReactElement} onChange={(_e, d) => onChange(d.value)} />
    </FluentField>
  ),
  iconButton: (label, icon, onClick, disabled) => (
    <FluentButton appearance="subtle" size="small" aria-label={label} title={label} disabled={disabled} onClick={onClick} icon={fluentKit.icon(icon) as React.ReactElement} className="dh-cfg-icon-btn" />
  ),
  button: (label, kind, onClick, disabled) => <FluentButton appearance={kind === "quiet" ? "subtle" : "secondary"} disabled={disabled} onClick={onClick}>{label}</FluentButton>,
};
function FluentConfig({ mode, model }: Omit<Props, "system">) {
  return (
    <FluentProvider theme={mode === "dark" ? webDarkTheme : webLightTheme}>
      <FluentDialog open={model.open} onOpenChange={(_e, d) => { if (!d.open) model.onClose(); }}>
        <FluentDialogSurface className="dh-kit-dialog dh-cfg-dialog dh-cfg-fluent" aria-labelledby="dh-cfg-title-fluent" aria-describedby="dh-cfg-desc">
          <FluentDialogBody>
            <FluentDialogTitle id="dh-cfg-title-fluent"
              action={<FluentButton appearance="subtle" aria-label="Close configuration" icon={fluentKit.icon("close") as React.ReactElement} onClick={model.onClose} />}>
              Configuration
            </FluentDialogTitle>
            <FluentDialogContent>
              <p id="dh-cfg-desc" className="dh-cfg-sr">Configure {model.panel}</p>
              <Body model={model} kit={fluentKit} />
            </FluentDialogContent>
            <FluentDialogActions fluid><Footer model={model} kit={fluentKit} /></FluentDialogActions>
          </FluentDialogBody>
        </FluentDialogSurface>
      </FluentDialog>
    </FluentProvider>
  );
}

/* ── Carbon ── in its scope, at the end of the page. */
const carbonIcons = { up: CarbonArrowUp, down: CarbonArrowDown, remove: CarbonClose, close: CarbonClose, info: CarbonInformation, filter: CarbonFilter, open: CarbonChevronDown, closed: CarbonChevronRight } as const;
const carbonKit: Kit = {
  icon: (n) => { const I = carbonIcons[n]; return <I size={16} aria-hidden="true" />; },
  select: (s, o) => (
    <CarbonSelect id={s.id} labelText={s.label} hideLabel={o?.compact} value={s.value} size="sm" onChange={(e) => s.onChange(e.target.value)}>
      {s.options.map((v) => <CarbonSelectItem key={v} value={v} text={v} />)}
    </CarbonSelect>
  ),
  toggle: (m, id) => (
    <span className="dh-cfg-carbon-toggle">
      <label htmlFor={id} className="cds--label dh-cfg-toggle-label">Aggregated</label>
      <CarbonToggle id={id} size="sm" hideLabel labelText="Aggregated" labelA="" labelB="" toggled={m.checked} disabled={m.disabled} onToggle={(on: boolean) => m.onChange(on)} />
    </span>
  ),
  info: (label, text) => <PlainInfo label={label} text={text} buttonClass="cds--btn cds--btn--ghost cds--btn--sm cds--btn--icon-only" icon={carbonKit.icon("info")} tipClass="dh-cfg-tip-carbon" />,
  tabs: (model, panel) => {
    const at = Math.max(0, model.tabs.findIndex((t) => t.value === model.tab));
    return (
      <CarbonTabs selectedIndex={at} onChange={({ selectedIndex }: { selectedIndex: number }) => model.onTab(model.tabs[selectedIndex].value)}>
        <CarbonTabList aria-label="Configuration sections" className="dh-cfg-tablist">
          {model.tabs.map((t) => <CarbonTab key={t.value}>{t.label}</CarbonTab>)}
        </CarbonTabList>
        <CarbonTabPanels>
          {model.tabs.map((t, i) => <CarbonTabPanel key={t.value} className="dh-cfg-tabpanel">{i === at ? panel : null}</CarbonTabPanel>)}
        </CarbonTabPanels>
      </CarbonTabs>
    );
  },
  filter: (id, value, onChange) => (
    <div className="dh-cfg-carbon-filter">
      <label htmlFor={id} className="cds--label">{FILTER_LABEL}</label>
      <CarbonSearch id={id} size="md" labelText={FILTER_LABEL} placeholder={FILTER_PLACEHOLDER} value={value} renderIcon={CarbonFilter} closeButtonLabelText="Clear filter" onChange={(e: { target: HTMLInputElement }) => onChange(e.target.value)} />
    </div>
  ),
  /* Carbon's own ghost icon button, without its tooltip wrapper (three to a row). */
  iconButton: (label, icon, onClick, disabled) => (
    <button type="button" className="cds--btn cds--btn--ghost cds--btn--sm cds--btn--icon-only dh-cfg-icon-btn" aria-label={label} title={label} disabled={disabled} onClick={onClick}>{carbonKit.icon(icon)}</button>
  ),
  button: (label, kind, onClick, disabled) => <CarbonButton kind={kind === "quiet" ? "ghost" : "secondary"} size="md" disabled={disabled} onClick={onClick}>{label}</CarbonButton>,
};
function CarbonConfig({ mode, model }: Omit<Props, "system">) {
  if (!model.open || typeof document === "undefined") return null;
  const themeClass = mode === "dark" ? "cds--g100" : "cds--white";
  return createPortal(
    <>
      <CarbonScopeStyles />
      <div className={`carbon-live-scope ${themeClass} dh-kit-scope`} data-carbon-theme={mode === "dark" ? "g100" : "white"}
        onKeyDownCapture={(e) => keepTabInside(e, (e.currentTarget as HTMLElement).querySelector(".cds--modal-container"))}>
        <CarbonComposedModal open size="sm" className="dh-kit-dialog dh-cfg-dialog dh-cfg-carbon" aria-label="Configuration" onClose={() => { model.onClose(); return false; }}
          launcherButtonRef={model.returnFocus as React.RefObject<HTMLButtonElement>} selectorPrimaryFocus=".cds--select-input">
          <CarbonModalHeader title="Configuration" closeModal={model.onClose} iconDescription="Close configuration" />
          <CarbonModalBody>
            <p id="dh-cfg-desc" className="dh-cfg-sr">Configure {model.panel}</p>
            <Body model={model} kit={carbonKit} />
          </CarbonModalBody>
          <CarbonModalFooter className="dh-cfg-carbon-footer"><Footer model={model} kit={carbonKit} /></CarbonModalFooter>
        </CarbonComposedModal>
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
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])';
function keepTabInside(e: React.KeyboardEvent | KeyboardEvent, root: HTMLElement | null) {
  if (e.key !== "Tab" || !root) return;
  const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null && !el.classList.contains("cds--visually-hidden"));
  if (!items.length) return;
  const [first, last] = [items[0], items[items.length - 1]];
  const now = document.activeElement;
  if (e.shiftKey && (now === first || !root.contains(now))) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && (now === last || !root.contains(now))) { e.preventDefault(); first.focus(); }
}
/** An info button and its tooltip, for the systems whose tooltip cannot sit
 *  in a portalled dialog (uoaui has none; Carbon's popover misplaces there):
 *  shown on hover and on focus, named by the button, described by the tip. */
function PlainInfo({ label, text, buttonClass, icon, tipClass }: { label: string; text: string; buttonClass: string; icon: React.ReactNode; tipClass: string }) {
  const [shown, setShown] = React.useState(false);
  return (
    <span className="dh-cfg-tip-wrap" onMouseEnter={() => setShown(true)} onMouseLeave={() => setShown(false)}>
      <button type="button" className={`${buttonClass} dh-cfg-icon-btn`} aria-label={label} aria-describedby="dh-cfg-tip"
        onFocus={() => setShown(true)} onBlur={() => setShown(false)}>{icon}</button>
      <span id="dh-cfg-tip" role="tooltip" className={`dh-cfg-tip ${tipClass}`} hidden={!shown}>{text}</span>
    </span>
  );
}
const uoauiKit: Kit = {
  icon: m3Icon,
  select: (s, o) => (
    <div className="a-input-wrap">
      {o?.compact ? null : <label className="a-input-label" htmlFor={s.id}>{s.label}</label>}
      <select id={s.id} className="a-input" aria-label={o?.compact ? s.label : undefined} value={s.value} onChange={(e) => s.onChange(e.target.value)}>
        {s.options.map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
    </div>
  ),
  toggle: (m, id) => (
    <span className="dh-cfg-uoaui-toggle">
      <span id={`${id}-label`} className="dh-cfg-toggle-label">Aggregated</span>
      <button id={id} type="button" role="switch" aria-checked={m.checked} aria-labelledby={`${id}-label`} disabled={m.disabled}
        className={`a-switch${m.checked ? " on" : ""}`} onClick={() => m.onChange(!m.checked)}><span className="a-sw-thumb" /></button>
    </span>
  ),
  info: (label, text) => <PlainInfo label={label} text={text} buttonClass="a-btn a-btn-ghost" icon={m3Icon("info")} tipClass="a-tooltip dh-cfg-tip-uoaui" />,
  tabs: (model, panel) => (
    <div className="dh-cfg-tabs">
      <div className="a-tabs dh-cfg-tablist" role="tablist" aria-label="Configuration sections">
        {model.tabs.map((t) => (
          <button key={t.value} type="button" role="tab" id={tabId(t.value)} aria-controls={panelId(t.value)} aria-selected={t.value === model.tab} tabIndex={t.value === model.tab ? 0 : -1}
            className={`a-tab${t.value === model.tab ? " active" : ""}`} onClick={() => model.onTab(t.value)}
            onKeyDown={(e) => tabKeys(model, e, t.value, e.currentTarget.parentElement)}>{t.label}</button>
        ))}
      </div>
      <div role="tabpanel" id={panelId(model.tab)} aria-labelledby={tabId(model.tab)} className="dh-cfg-tabpanel">{panel}</div>
    </div>
  ),
  filter: (id, value, onChange) => (
    <div className="a-input-wrap dh-cfg-uoaui-filter">
      <label className="a-input-label" htmlFor={id}>{FILTER_LABEL}</label>
      <span className="dh-cfg-input-icon">
        {uoauiKit.icon("filter")}
        <input id={id} className="a-input" value={value} placeholder={FILTER_PLACEHOLDER} onChange={(e) => onChange(e.target.value)} />
      </span>
    </div>
  ),
  iconButton: (label, icon, onClick, disabled) => (
    <button type="button" className="a-btn a-btn-ghost dh-cfg-icon-btn" aria-label={label} title={label} disabled={disabled} onClick={onClick}>{uoauiKit.icon(icon)}</button>
  ),
  button: (label, kind, onClick, disabled) => <button type="button" className={`a-btn ${kind === "quiet" ? "a-btn-ghost" : "a-btn-secondary"}`} disabled={disabled} onClick={onClick}>{label}</button>,
};
function UoauiConfig({ mode, density, model }: Omit<Props, "system">) {
  const css = React.useMemo(() => scopeUoaui(sanitizeCSS(getFullCSS("uoaui", getTheme("uoaui", mode), coerceDensity(density)))), [mode, density]);
  const panel = React.useRef<HTMLDivElement>(null);
  const open = model.open;
  React.useEffect(() => {
    if (!open) return;
    (panel.current?.querySelector<HTMLElement>("select, input") ?? panel.current)?.focus();
    const onKey = (e: KeyboardEvent) => keepTabInside(e, panel.current);
    const onFocus = (e: FocusEvent) => {
      const to = e.target as Node | null;
      if (panel.current && to && !panel.current.contains(to)) panel.current.focus();
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
        <div ref={panel} tabIndex={-1} className="a-dialog dh-kit-dialog dh-cfg-dialog dh-cfg-uoaui" role="dialog" aria-modal="true" aria-labelledby="dh-cfg-title-uoaui" aria-describedby="dh-cfg-desc" style={model.tones}>
          <div className="dh-cfg-title-row">
            <h2 id="dh-cfg-title-uoaui" className="dh-kit-title">Configuration</h2>
            <button type="button" className="a-btn a-btn-ghost dh-cfg-icon-btn" aria-label="Close configuration" onClick={model.onClose}>{m3Icon("close")}</button>
          </div>
          <div className="dh-kit-scroll">
            <p id="dh-cfg-desc" className="dh-cfg-sr">Configure {model.panel}</p>
            <Body model={model} kit={uoauiKit} />
          </div>
          <Footer model={model} kit={uoauiKit} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** The Configuration dialog in the active system. */
export function RealConfigDialog({ system, mode, density, model }: Props): React.ReactElement | null {
  useReturnFocus(model.open, model.returnFocus);
  useOverlayEscape(model.open, model.onClose);
  if (system === "salt") return <SaltConfig mode={mode} density={density} model={model} />;
  if (system === "m3") return <M3Config mode={mode} model={model} />;
  if (system === "fluent") return <FluentConfig mode={mode} model={model} />;
  if (system === "carbon") return <CarbonConfig mode={mode} model={model} />;
  return <UoauiConfig mode={mode} density={density} model={model} />;
}
