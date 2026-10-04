/**
 * reportCommand - chat messages the builder can act on without a model:
 *
 *   "use the risk analytics template"        -> apply a template
 *   "performance template in Carbon, light"  -> apply it, re-themed
 *   "show it in USD" / "view by sector"      -> set a report control
 *
 * Like themeCommand, each parser reports a match only when the message asks
 * for nothing else (every other word is filler), so "add a chart of USD
 * exposure" still goes to the model.
 */

import type { Block, BuilderMode, DesignSystem } from "@/store/useBuilder";
import { parseThemeCommand } from "./themeCommand";
import { viewByOf, viewByStateKey } from "./panelMetrics";
import type { TemplateId } from "./templateIds";

const words = (s: string): string[] => s.toLowerCase().match(/[a-z0-9%]+/g) ?? [];

const FILLER = new Set([
  "switch", "change", "use", "try", "set", "make", "turn", "go", "put", "show", "give", "apply", "load", "open", "start",
  "to", "in", "into", "on", "with", "for", "of", "and", "the", "a", "an", "it", "this", "that", "from", "as", "by", "my",
  "mode", "theme", "design", "system", "ds", "style", "look", "version", "ui", "instead", "now", "new",
  "please", "pls", "can", "could", "you", "me", "i", "want", "would", "like", "lets", "let", "s", "2", "3",
  "salt", "material", "m3", "fluent", "uoaui", "carbon", "dark", "light",
]);

/* ── Templates ── */

/** Phrases that name a template. Longest first, so "performance analytics"
 *  wins over a shorter phrase inside it. */
const TEMPLATE_PHRASES: [phrase: string, id: TemplateId][] = (
  [
    ["performance analytics", "performance-analytics"],
    ["performance report", "performance-analytics"],
    ["performance template", "performance-analytics"],
    ["esg analytics", "esg-analytics"],
    ["esg report", "esg-analytics"],
    ["esg template", "esg-analytics"],
    ["climate analytics", "climate-analytics"],
    ["climate report", "climate-analytics"],
    ["climate template", "climate-analytics"],
    ["screening changes", "screening-changes"],
    ["changes report", "screening-changes"],
    ["screening report", "screening"],
    ["screening template", "screening"],
    ["risk analytics", "risk-analytics"],
    ["risk report", "risk-analytics"],
    ["risk template", "risk-analytics"],
    ["analytics dashboard", "analytics-dashboard"],
    ["settings page", "settings-page"],
    ["crm contacts", "crm-contacts"],
    ["landing page", "landing-page"],
    ["login flow", "login-flow"],
  ] as [string, TemplateId][]
).sort((a, b) => b[0].length - a[0].length);

const TEMPLATE_FILLER = new Set(["template", "templates", "report", "build", "create", "one", "page", "dashboard"]);

export interface TemplateCommand {
  templateId: TemplateId;
  designSystem?: DesignSystem;
  mode?: BuilderMode;
}

/** A message that only asks for a template (optionally in a design system
 *  and mode). Must say "template" or an applying verb, so a bare mention
 *  ("what is in the risk analytics one?") is not a command. */
export function parseTemplateCommand(message: string): TemplateCommand | null {
  const text = ` ${words(message).join(" ")} `;
  const hit = TEMPLATE_PHRASES.find(([phrase]) => text.includes(` ${phrase} `));
  if (!hit) return null;
  const rest = words(text.replace(` ${hit[0]} `, " "));
  const asksToApply = /\b(template|use|apply|load|open|start|build|create|show|give|switch|try)\b/.test(text);
  if (!asksToApply) return null;
  if (rest.some((w) => !FILLER.has(w) && !TEMPLATE_FILLER.has(w))) return null;
  const theme = parseThemeCommand(message);
  return { templateId: hit[1], ...(theme.designSystem ? { designSystem: theme.designSystem } : {}), ...(theme.mode ? { mode: theme.mode } : {}) };
}

/* ── Report controls ── */

export interface ReportControl {
  /** Report-state key. */
  key: string;
  /** The filter's label, or the panel's title for a "View by". */
  label: string;
  kind: "filter" | "viewBy";
  current: string;
  choices: string[];
}

/** Every report control on the canvas: dropdowns with a `stateKey`, and
 *  panels with "View by" choices. */
export function collectReportControls(blocks: Block[], reportState: Record<string, string> = {}): ReportControl[] {
  const out: ReportControl[] = [];
  for (const b of blocks) {
    const props = (b.props ?? {}) as Record<string, unknown>;
    if (typeof props.stateKey === "string" && props.stateKey) {
      const choices = String(props.optionsCsv ?? "").split(",").map((o) => o.trim()).filter(Boolean);
      out.push({ key: props.stateKey, label: String(props.label ?? props.stateKey), kind: "filter", current: reportState[props.stateKey] ?? String(props.value ?? ""), choices });
    }
    const viewBy = viewByOf(props);
    if (viewBy.length > 0) {
      const key = viewByStateKey(b.id);
      out.push({ key, label: String(props.title ?? "Panel"), kind: "viewBy", current: reportState[key] ?? viewBy[0], choices: viewBy });
    }
  }
  return out;
}

const CONTROL_FILLER = new Set(["view", "filter", "display", "convert", "breakdown", "values", "everything", "report", "data", "all", "charts", "chart", "panels", "panel", "grid", "group", "grouped"]);

export interface ReportFilterCommand {
  changes: { key: string; value: string; label: string; kind: ReportControl["kind"] }[];
}

/** A message that only asks to set a report control to one of its choices.
 *  A choice several panels share ("view by sector") applies to each of them,
 *  unless the message names a panel by its title. */
export function parseReportFilterCommand(message: string, controls: ReportControl[]): ReportFilterCommand | null {
  const text = ` ${words(message).join(" ")} `;
  const phrase = (s: string) => words(s).join(" ");
  type Hit = { control: ReportControl; choice: string; phrase: string };
  let hits: Hit[] = [];
  for (const control of controls) {
    /* Longest matching choice of this control ("Net of fees" over "Net"). */
    const choice = [...control.choices]
      .sort((a, b) => b.length - a.length)
      .find((c) => phrase(c) && text.includes(` ${phrase(c)} `));
    if (choice) hits.push({ control, choice, phrase: phrase(choice) });
  }
  if (hits.length === 0) return null;
  /* Keep the hits for the longest phrase only: "gross of fees" must not also
     count as another control's "gross". */
  const longest = Math.max(...hits.map((h) => h.phrase.length));
  hits = hits.filter((h) => h.phrase.length === longest);
  const named = hits.filter((h) => phrase(h.control.label) && text.includes(` ${phrase(h.control.label)} `));
  if (named.length > 0) hits = named;
  /* A dropdown filter and a "View by" answering to the same word is too
     ambiguous to act on without a model. */
  if (new Set(hits.map((h) => h.control.kind)).size > 1) return null;
  if (hits[0].control.kind === "filter" && hits.length > 1) return null;

  let rest = text.replace(` ${hits[0].phrase} `, " ");
  for (const h of hits) rest = ` ${rest} `.replace(` ${phrase(h.control.label)} `, " ");
  if (words(rest).some((w) => !FILLER.has(w) && !CONTROL_FILLER.has(w))) return null;
  const changes = hits.filter((h) => h.control.current !== h.choice).map((h) => ({ key: h.control.key, value: h.choice, label: h.control.label, kind: h.control.kind }));
  return { changes };
}

/** One sentence saying what a filter command did. */
export function describeReportFilterCommand(cmd: ReportFilterCommand): string {
  if (cmd.changes.length === 0) return "That is already selected.";
  const first = cmd.changes[0];
  if (first.kind === "filter") return `${first.label} set to ${first.value}. The charts and grids have updated.`;
  const panels = cmd.changes.map((c) => c.label);
  return `${panels.length === 1 ? panels[0] : panels.slice(0, -1).join(", ") + " and " + panels[panels.length - 1]} now ${panels.length === 1 ? "shows" : "show"} ${first.value}.`;
}
