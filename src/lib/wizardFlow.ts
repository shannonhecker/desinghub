import type { InterfaceType, DesignSystem, BuilderMode, WizardStep } from "@/store/useBuilder";
import type { TemplateId } from "@/lib/builderTemplates";

/* ════════════════════════════════════════════════════════════
   Guided pre-build setup - pure helpers
   ────────────────────────────────────────────────────────────
   The 5-step flow (Type / System / Look / Audience / Confirm) is
   rendered conversationally by ConversationalOnboarding.tsx, but
   every decision-free piece of logic - the step order, the
   next/prev transitions, the interfaceType -> templateId map, and
   the option metadata - lives here so it can be unit-tested
   without rendering React.
   ════════════════════════════════════════════════════════════ */

/* Ordered visible steps (the 5 the user walks; 'done' is terminal,
   not shown as a segment). */
export const WIZARD_STEPS: Exclude<WizardStep, "done">[] = [
  "type",
  "style",
  "details",
  "audience",
  "confirm",
];

/* Human labels for the progress indicator (Type · System · Look ·
   Audience · Confirm). */
export const WIZARD_STEP_LABELS: Record<Exclude<WizardStep, "done">, string> = {
  type: "Type",
  style: "System",
  details: "Look",
  audience: "Audience",
  confirm: "Confirm",
};

/* 1-based index of a step within the 5-step flow (for "Step N of 5"). */
export function stepIndex(step: WizardStep): number {
  const i = WIZARD_STEPS.indexOf(step as Exclude<WizardStep, "done">);
  return i === -1 ? WIZARD_STEPS.length : i + 1;
}

/* Advance to the next step. The last visible step ('confirm') advances
   to 'done' (build). */
export function nextStep(step: WizardStep): WizardStep {
  const i = WIZARD_STEPS.indexOf(step as Exclude<WizardStep, "done">);
  if (i === -1) return "done";
  if (i >= WIZARD_STEPS.length - 1) return "done";
  return WIZARD_STEPS[i + 1];
}

/* Step back. The first step ('type') has no previous step - stays put. */
export function prevStep(step: WizardStep): WizardStep {
  const i = WIZARD_STEPS.indexOf(step as Exclude<WizardStep, "done">);
  if (i <= 0) return "type";
  return WIZARD_STEPS[i - 1];
}

/* ── Step 1: Interface type options ──
   Dashboard is the recommended default. The 'or describe it' free-text
   line is rendered separately by the panel (mutually exclusive). */
export interface TypeOption {
  value: InterfaceType;
  label: string;
  icon: string; // Material Symbol
  recommended?: boolean;
}
export const TYPE_OPTIONS: TypeOption[] = [
  { value: "dashboard", label: "Dashboard", icon: "dashboard", recommended: true },
  { value: "landing", label: "Landing", icon: "rocket_launch" },
  { value: "form", label: "Form", icon: "list_alt" },
  { value: "ecommerce", label: "E-commerce", icon: "shopping_cart" },
  { value: "blog", label: "Blog", icon: "article" },
  { value: "portfolio", label: "Portfolio", icon: "wallpaper" },
];

/* ── Step 2: Design-system options ──
   The five systems offered, in display order. Shared by the
   conversational onboarding (and previously the card wizard) so the
   chip list has one source of truth. The dot colour is driven by
   data-ds={value} in CSS. */
export const DS_OPTIONS: { label: string; value: DesignSystem }[] = [
  { label: "Salt DS", value: "salt" },
  { label: "Material 3", value: "m3" },
  { label: "Fluent 2", value: "fluent" },
  { label: "uoaui DS", value: "uoaui" },
  { label: "Carbon DS", value: "carbon" },
];

/* ── Step 3: Theme (light / dark) options ── */
export const MODE_OPTIONS: { value: BuilderMode; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "light_mode" },
  { value: "dark", label: "Dark", icon: "dark_mode" },
];

/* ── Step 4: Audience options ── */
export interface AudienceOption {
  value: "internal" | "public";
  label: string;
  hint: string;
}
export const AUDIENCE_OPTIONS: AudienceOption[] = [
  { value: "internal", label: "Internal tool", hint: "dense, data-first" },
  { value: "public", label: "Public-facing", hint: "spacious, marketing" },
];

/* Arguments handed to the build pipeline when setup completes (or the
   user builds early). interfaceType / designSystem / mode / density are
   read straight off the store (set live as the user answers); only these
   three are not persisted store dims, so they travel here. */
export interface WizardBuildArgs {
  /* Free-text the user typed instead of picking a type. When present the
     build routes through the freeform composer path; when null the chosen
     interfaceType maps to a template / layout preset. */
  freeText: string | null;
  audience: "internal" | "public";
  note: string;
}

/* ── interfaceType -> templateId ──
   Dashboard / form map onto the four shipped templates so the offline
   template path can build a full layout with zero AI. The remaining
   types (landing / ecommerce / blog / portfolio) have no template yet
   and route through the freeform layout-preset path instead (returns
   null here). */
export function interfaceTypeToTemplateId(
  type: InterfaceType,
): TemplateId | null {
  switch (type) {
    case "dashboard":
      return "analytics-dashboard";
    case "form":
      return "settings-page";
    case "landing":
      return "landing-page";
    default:
      return null;
  }
}

/* A terse imperative the freeform layout-preset fast-path recognises
   (processLayoutCommand matches "build a <type>"). Used when there is no
   template for the chosen type, so the build still works offline. */
export function interfaceTypeToBuildPrompt(type: InterfaceType): string {
  /* "ecommerce" is the preset key; the phrasing reads naturally too. */
  const phrase = type === "ecommerce" ? "ecommerce" : type;
  return `Build a ${phrase}`;
}

/* ── Density labels per DS ──
   Carbon relabels the canonical high/medium/low/touch ladder to
   compact/normal/spacious; the panel shows the DS-appropriate copy but
   always writes the canonical value into the store (the registry maps it
   back). */
export const DENSITY_VALUES = ["high", "medium", "low", "touch"] as const;
export type DensityValue = (typeof DENSITY_VALUES)[number];

export function densityLabel(value: DensityValue, ds: DesignSystem): string {
  if (ds === "carbon") {
    const map: Record<DensityValue, string> = {
      high: "Compact",
      medium: "Normal",
      low: "Spacious",
      touch: "Spacious+",
    };
    return map[value];
  }
  const map: Record<DensityValue, string> = {
    high: "High",
    medium: "Medium",
    low: "Low",
    touch: "Touch",
  };
  return map[value];
}

/* ── Confirm-screen summary ──
   "A Dashboard, built with Salt, light at medium density, for an internal
   tool." Each phrase is a chip in the panel that jumps back to its step;
   this builds the plain-text spine + the per-phrase pieces. */
export interface SummaryInput {
  interfaceType: InterfaceType;
  designSystem: DesignSystem;
  mode: BuilderMode;
  density: DensityValue;
  audience: "internal" | "public";
}

export const DS_SUMMARY_LABEL: Record<DesignSystem, string> = {
  salt: "Salt",
  m3: "Material 3",
  fluent: "Fluent 2",
  uoaui: "uoaui",
  carbon: "Carbon",
};

const TYPE_SUMMARY_LABEL: Record<InterfaceType, string> = {
  dashboard: "Dashboard",
  landing: "Landing page",
  form: "Form",
  ecommerce: "E-commerce store",
  blog: "Blog",
  portfolio: "Portfolio",
};

function articleFor(label: string): string {
  return /^[aeiouAEIOU]/.test(label) ? "An" : "A";
}

export function buildSummaryParts(input: SummaryInput) {
  const { interfaceType, designSystem, mode, density, audience } = input;
  const typeLabel = TYPE_SUMMARY_LABEL[interfaceType];
  const article = articleFor(typeLabel);
  return {
    article,
    type: typeLabel,
    ds: DS_SUMMARY_LABEL[designSystem],
    look: `${mode} at ${density} density`,
    audience: audience === "internal" ? "an internal tool" : "a public-facing site",
  };
}

/* Full one-sentence summary as plain text (used for aria + tests). */
export function buildSummarySentence(input: SummaryInput): string {
  const p = buildSummaryParts(input);
  return `${p.article} ${p.type}, built with ${p.ds}, ${p.look}, for ${p.audience}.`;
}
