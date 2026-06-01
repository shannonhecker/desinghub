import type { DesignSystem, InterfaceType, BuilderMode } from "@/store/useBuilder";

/* ════════════════════════════════════════════════════════════
   Assumption Row - pure helpers
   ────────────────────────────────────────────────────────────
   The post-build "Assumption Row" shows <=4 chips for the dims
   the build inferred (interface type, design system, mode,
   density), each one-tap to correct. The cyclable logic + the
   labels + the imperative we send back through handleSend live
   here as a PURE function so they can be unit-tested without
   rendering ChatPanel. The component only maps the result onto
   the existing .prompt-bubble chip markup.
   ════════════════════════════════════════════════════════════ */

/* Design-system display labels (mirrors DS_LABEL in ChatPanel so the
   chip copy + the imperative read the same). */
export const DS_LABELS: Record<DesignSystem, string> = {
  salt: "Salt DS",
  m3: "Material 3",
  fluent: "Fluent 2",
  uoaui: "uoaui DS",
  carbon: "Carbon DS",
};

/* Cycle orders. One tap = advance to the next value (one tap, one
   render branch - a per-chip popover is the richer alternative but
   adds a component + state; cycle keeps it minimal + reversible). */
export const DS_ORDER: DesignSystem[] = ["salt", "m3", "fluent", "uoaui", "carbon"];
export const IFACE_ORDER: InterfaceType[] = [
  "dashboard",
  "form",
  "landing",
  "ecommerce",
  "blog",
  "portfolio",
];
/* density is a free `string` in the store (values diverge per DS:
   Salt/uoaui use high/medium/low/touch; Carbon uses
   compact/normal/spacious). Cycle the canonical 4-level set; if the
   current value is outside it (e.g. a Carbon tier) we still advance
   into the canonical set so the chip stays one-tap and predictable. */
export const DENSITY_ORDER: string[] = ["high", "medium", "low", "touch"];

/* Advance to the next value in a cycle. If `current` is not in the
   order, start from the first entry. */
export function cycleNext<T>(order: readonly T[], current: T): T {
  const i = order.indexOf(current);
  if (i === -1) return order[0];
  return order[(i + 1) % order.length];
}

/* The shape the component renders: a labelled, one-tap-correctable dim. */
export interface AssumptionDim {
  /* Stable React key + a11y hook. */
  key: "ds" | "iface" | "mode" | "density";
  /* Chip face copy (e.g. "Salt DS", "dashboard", "dark", "medium density"). */
  label: string;
  /* The value to set when tapped (what we cycle TO). */
  nextValue: string;
  /* The terse imperative sent through handleSend so the [Current state]
     prefix carries the corrected dim to the model on re-generate. */
  imperative: string;
  /* aria-label spelling out the current value + that tapping rebuilds. */
  ariaLabel: string;
}

export interface AssumptionDimInput {
  designSystem: DesignSystem;
  interfaceType: InterfaceType;
  mode: BuilderMode;
  density: string;
}

/* Build the <=4 labelled, correctable dims from the current store values.
   PURE: no store reads, no side effects - the caller wires nextValue +
   imperative into the setter + handleSend. */
export function buildAssumptionDims(input: AssumptionDimInput): AssumptionDim[] {
  const { designSystem, interfaceType, mode, density } = input;

  const nextDs = cycleNext(DS_ORDER, designSystem);
  const nextIface = cycleNext(IFACE_ORDER, interfaceType);
  const nextMode: BuilderMode = mode === "dark" ? "light" : "dark";
  const nextDensity = cycleNext(DENSITY_ORDER, density);

  const dims: AssumptionDim[] = [
    {
      key: "iface",
      label: interfaceType,
      nextValue: nextIface,
      imperative: `Make it a ${nextIface} instead`,
      ariaLabel: `Interface type, currently ${interfaceType}. Tap to switch to ${nextIface} and rebuild.`,
    },
    {
      key: "ds",
      label: DS_LABELS[designSystem],
      nextValue: nextDs,
      imperative: `Use ${DS_LABELS[nextDs]} instead`,
      ariaLabel: `Design system, currently ${DS_LABELS[designSystem]}. Tap to switch to ${DS_LABELS[nextDs]} and rebuild.`,
    },
    {
      key: "mode",
      label: mode,
      nextValue: nextMode,
      imperative: `Switch to ${nextMode} mode`,
      ariaLabel: `Theme mode, currently ${mode}. Tap to switch to ${nextMode} and rebuild.`,
    },
    {
      key: "density",
      label: `${density} density`,
      nextValue: nextDensity,
      imperative: `Use ${nextDensity} density`,
      ariaLabel: `Density, currently ${density}. Tap to switch to ${nextDensity} and rebuild.`,
    },
  ];

  /* Hard cap at 4 - keeps the row compact and matches the design. */
  return dims.slice(0, 4);
}

/* ── PRE-BUILD AUDIENCE GATE heuristic ──
   audience (internal-tool vs public-facing) is structure-deciding
   (dense data-grid + sidebar vs marketing hero + spacious cards) AND
   genuinely unguessable from a bare prompt like "a dashboard for my
   SaaS". Gate ONLY this one dim, ONLY when the first message reads
   app/dashboard-like AND carries no audience signal word.

   LIMIT (documented): audience is NOT a real store dimension. It is
   folded into the message text only; the [Current state] prefix does
   NOT carry it, so later turns do not re-assert it. Persisting it is a
   deliberate follow-up (add `audience` to BuilderState + the prefix +
   teach chatSystem to branch layout on it). Kept message-only here to
   stay within the smallest edit set. */
export function audienceUnguessable(msg: string): boolean {
  const l = msg.toLowerCase();
  const appLike =
    /\b(dashboard|admin|console|portal|app|tool|crm|analytics|saas)\b/.test(l);
  const hasSignal =
    /\b(internal|team|staff|admin|ops|back ?office|employee)\b/.test(l) || // internal
    /\b(public|marketing|landing|customer|visitor|sign ?up|homepage|website)\b/.test(
      l,
    ); // public-facing
  return appLike && !hasSignal;
}
