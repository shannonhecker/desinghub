"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { useBuilder } from "@/store/useBuilder";
import type { DesignSystem, BuilderMode } from "@/store/useBuilder";
import { ComponentRenderer } from "./ComponentRenderer";
import { DSPreviewStyles } from "./PreviewPanel";
import {
  WIZARD_STEPS,
  WIZARD_STEP_LABELS,
  stepIndex,
  nextStep,
  prevStep,
  TYPE_OPTIONS,
  AUDIENCE_OPTIONS,
  DENSITY_VALUES,
  densityLabel,
  buildSummaryParts,
  type DensityValue,
} from "@/lib/wizardFlow";

/* ── DS chips reuse the exact STYLE_CHIPS shape from ChatPanel. Kept
   local to avoid a circular import; values + labels match verbatim. ── */
const DS_CHIPS: { label: string; value: DesignSystem }[] = [
  { label: "Salt DS", value: "salt" },
  { label: "Material 3", value: "m3" },
  { label: "Fluent 2", value: "fluent" },
  { label: "uoaui DS", value: "uoaui" },
  { label: "Carbon DS", value: "carbon" },
];

export interface WizardBuildArgs {
  /* Free-text the user typed on step 1 instead of picking a type. When
     present, the build routes through the freeform composer path; when
     null, the chosen interfaceType maps to a template / layout preset. */
  freeText: string | null;
  audience: "internal" | "public";
  note: string;
}

interface WizardPanelProps {
  /* Build it - ChatPanel owns the (template / freeform) pipeline so the
     downstream stays UNCHANGED. The wizard has already written every dim
     to the store via the setters below. */
  onBuild: (args: WizardBuildArgs) => void;
  /* Skip setup - drop straight into the freeform composer with the
     current defaults already applied. */
  onSkip: () => void;
  /* Browse templates with previews - opens the existing drawer. */
  onBrowseTemplates: () => void;
}

/* ── Live mini-preview: a representative button + card + input in the
   chosen DS + mode + density. Store-free (blockId=undefined) so the
   renderers fall back to their default copy. Wrapped in preview-<ds> so
   the --ds-* tokens resolve; DSPreviewStyles injects Carbon's sheet. The
   builder-light/dark ancestor (builder-shell) drives mode automatically,
   so changing the store's mode re-themes this live. ── */
function WizardLivePreview() {
  const designSystem = useBuilder((s) => s.designSystem);
  const density = useBuilder((s) => s.density);
  return (
    <div
      className={`wizard-preview preview-${designSystem} density-${density}`}
      aria-hidden="true"
    >
      <DSPreviewStyles />
      <div className="wizard-preview-stack">
        <ComponentRenderer type="SimulatedButton" system={designSystem} />
        <ComponentRenderer type="SimulatedTextInput" system={designSystem} />
        <ComponentRenderer type="SimulatedCard" system={designSystem} />
      </div>
    </div>
  );
}

export function WizardPanel({ onBuild, onSkip, onBrowseTemplates }: WizardPanelProps) {
  const wizardStep = useBuilder((s) => s.wizardStep);
  const setWizardStep = useBuilder((s) => s.setWizardStep);

  const interfaceType = useBuilder((s) => s.interfaceType);
  const setInterfaceType = useBuilder((s) => s.setInterfaceType);
  const designSystem = useBuilder((s) => s.designSystem);
  const setDesignSystem = useBuilder((s) => s.setDesignSystem);
  const mode = useBuilder((s) => s.mode);
  const setMode = useBuilder((s) => s.setMode);
  const density = useBuilder((s) => s.density);
  const setDensity = useBuilder((s) => s.setDensity);

  /* Step-local state that isn't a persisted store dim. */
  const [freeText, setFreeText] = React.useState("");
  const [audience, setAudience] = React.useState<"internal" | "public">("internal");
  const [note, setNote] = React.useState("");
  /* aria-live announcement string, updated on each transition. */
  const [announce, setAnnounce] = React.useState("");

  const cardRef = useRef<HTMLDivElement>(null);
  const idx = stepIndex(wizardStep);
  const total = WIZARD_STEPS.length;

  /* Announce the step on transition + move focus to the first/selected
     option so keyboard users land in the right place. */
  useEffect(() => {
    if (wizardStep === "done") return;
    setAnnounce(`Step ${idx} of ${total}, ${WIZARD_STEP_LABELS[wizardStep as Exclude<typeof wizardStep, "done">]}`);
    /* Defer so the new step's DOM is mounted before we focus. */
    const r = requestAnimationFrame(() => {
      const sel = cardRef.current?.querySelector<HTMLElement>(
        '[data-wizard-focus="true"]',
      );
      sel?.focus();
    });
    return () => cancelAnimationFrame(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizardStep]);

  const goNext = useCallback(() => {
    const n = nextStep(wizardStep);
    if (n === "done") {
      onBuild({ freeText: freeText.trim() ? freeText.trim() : null, audience, note: note.trim() });
      return;
    }
    setWizardStep(n);
  }, [wizardStep, freeText, audience, note, onBuild, setWizardStep]);

  const goBack = useCallback(() => {
    setWizardStep(prevStep(wizardStep));
  }, [wizardStep, setWizardStep]);

  const isConfirm = wizardStep === "confirm";

  /* ── Keyboard: 1-9 select an option in the active grid, arrows move,
     Enter advances, Esc / Backspace-on-empty steps back. Scoped to the
     card so it doesn't hijack global shortcuts. ── */
  const onCardKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const typingInField =
      target.tagName === "TEXTAREA" ||
      (target.tagName === "INPUT" && (target as HTMLInputElement).type === "text");

    if (e.key === "Enter" && !typingInField) {
      e.preventDefault();
      goNext();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      if (wizardStep !== "type") goBack();
      return;
    }
    if (typingInField) return; // let digits/arrows type into free-text

    /* Digit selection on the current option grid. */
    if (/^[1-9]$/.test(e.key)) {
      const buttons = Array.from(
        cardRef.current?.querySelectorAll<HTMLElement>('[data-wizard-option="true"]') ?? [],
      );
      const target2 = buttons[Number(e.key) - 1];
      if (target2) {
        e.preventDefault();
        target2.click();
        target2.focus();
      }
      return;
    }
    /* Arrow roving across the current option grid. */
    if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) {
      const buttons = Array.from(
        cardRef.current?.querySelectorAll<HTMLElement>('[data-wizard-option="true"]') ?? [],
      );
      if (buttons.length === 0) return;
      const current = buttons.indexOf(document.activeElement as HTMLElement);
      const fwd = e.key === "ArrowRight" || e.key === "ArrowDown";
      const start = current === -1 ? 0 : current;
      const next = fwd
        ? (start + 1) % buttons.length
        : (start - 1 + buttons.length) % buttons.length;
      e.preventDefault();
      buttons[next].focus();
    }
  };

  /* ── Step 1: Type ── */
  const renderTypeStep = () => (
    <div className="wizard-step">
      <h2 className="wizard-step-title">What are we building?</h2>
      <p className="wizard-step-sub">Pick the kind of interface, or describe it in your own words.</p>
      <div className="wizard-grid" role="group" aria-label="Interface type">
        {TYPE_OPTIONS.map((opt, i) => {
          const selected = interfaceType === opt.value && !freeText.trim();
          return (
            <button
              key={opt.value}
              type="button"
              data-wizard-option="true"
              data-wizard-focus={selected || (interfaceType === opt.value && i === 0) ? "true" : undefined}
              className={`prompt-bubble wizard-chip${selected ? " selected" : ""}${opt.recommended ? " prompt-bubble-accent" : ""}`}
              aria-pressed={selected}
              onClick={() => {
                setInterfaceType(opt.value);
                setFreeText(""); // type pick clears any free-text (mutually exclusive)
              }}
            >
              <span className="material-symbols-outlined wizard-chip-icon" aria-hidden="true">
                {opt.icon}
              </span>
              {opt.label}
              {opt.recommended && <span className="wizard-tag">Recommended</span>}
            </button>
          );
        })}
      </div>
      <div className="wizard-or-row">
        <span className="wizard-or-label">or describe it</span>
        <input
          type="text"
          className="wizard-freetext"
          placeholder="e.g. a habit tracker for kids"
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          aria-label="Describe what you want to build"
        />
      </div>
    </div>
  );

  /* ── Step 2: System ── */
  const renderStyleStep = () => (
    <div className="wizard-step">
      <h2 className="wizard-step-title">Which design system?</h2>
      <p className="wizard-step-sub">Every choice re-themes the preview on the right.</p>
      <div className="wizard-grid" role="group" aria-label="Design system">
        {DS_CHIPS.map((chip, i) => {
          const selected = designSystem === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              data-wizard-option="true"
              data-wizard-focus={selected || (i === 0 && !DS_CHIPS.some((c) => c.value === designSystem)) ? "true" : undefined}
              className={`prompt-bubble wizard-chip${selected ? " selected" : ""}`}
              aria-pressed={selected}
              onClick={() => setDesignSystem(chip.value)}
            >
              <span className="prompt-bubble-ds-dot" data-ds={chip.value} aria-hidden="true" />
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ── Step 3: Look (light/dark + density) ── */
  const renderDetailsStep = () => {
    const modes: { value: BuilderMode; label: string; icon: string }[] = [
      { value: "light", label: "Light", icon: "light_mode" },
      { value: "dark", label: "Dark", icon: "dark_mode" },
    ];
    return (
      <div className="wizard-step">
        <h2 className="wizard-step-title">Set the look.</h2>
        <p className="wizard-step-sub">Theme and density. The preview updates as you go.</p>

        <div className="wizard-group-label" id="wizard-mode-label">Theme</div>
        <div className="wizard-grid wizard-grid-inline" role="group" aria-labelledby="wizard-mode-label">
          {modes.map((m, i) => {
            const selected = mode === m.value;
            return (
              <button
                key={m.value}
                type="button"
                data-wizard-option="true"
                data-wizard-focus={selected || i === 0 ? "true" : undefined}
                className={`prompt-bubble wizard-chip${selected ? " selected" : ""}`}
                aria-pressed={selected}
                onClick={() => setMode(m.value)}
              >
                <span className="material-symbols-outlined wizard-chip-icon" aria-hidden="true">{m.icon}</span>
                {m.label}
              </button>
            );
          })}
        </div>

        <div className="wizard-group-label" id="wizard-density-label">Density</div>
        <div className="wizard-grid wizard-grid-inline" role="group" aria-labelledby="wizard-density-label">
          {DENSITY_VALUES.map((d) => {
            const selected = density === d;
            return (
              <button
                key={d}
                type="button"
                data-wizard-option="true"
                className={`prompt-bubble wizard-chip${selected ? " selected" : ""}`}
                aria-pressed={selected}
                onClick={() => setDensity(d)}
              >
                {densityLabel(d as DensityValue, designSystem)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  /* ── Step 4: Audience ── */
  const renderAudienceStep = () => (
    <div className="wizard-step">
      <h2 className="wizard-step-title">Who is this for?</h2>
      <p className="wizard-step-sub">Audience shapes the layout: dense data tool vs. spacious public page.</p>
      <div className="wizard-grid" role="group" aria-label="Audience">
        {AUDIENCE_OPTIONS.map((opt, i) => {
          const selected = audience === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              data-wizard-option="true"
              data-wizard-focus={selected || i === 0 ? "true" : undefined}
              className={`prompt-bubble wizard-chip wizard-chip-wide${selected ? " selected" : ""}`}
              aria-pressed={selected}
              onClick={() => setAudience(opt.value)}
            >
              <span className="wizard-chip-main">{opt.label}</span>
              <span className="wizard-chip-hint">{opt.hint}</span>
            </button>
          );
        })}
      </div>
      <div className="wizard-or-row">
        <span className="wizard-or-label">add a note</span>
        <input
          type="text"
          className="wizard-freetext"
          placeholder="optional - anything specific?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-label="Optional note about the audience"
        />
      </div>
    </div>
  );

  /* ── Step 5: Confirm ── */
  const renderConfirmStep = () => {
    const usingFreeText = Boolean(freeText.trim());
    const parts = buildSummaryParts({
      interfaceType,
      designSystem,
      mode,
      density: (DENSITY_VALUES as readonly string[]).includes(density)
        ? (density as DensityValue)
        : "medium",
      audience,
    });
    /* Each phrase is a chip that jumps back to the step that owns it. */
    const jump = (step: typeof wizardStep) => () => setWizardStep(step);
    return (
      <div className="wizard-step">
        <h2 className="wizard-step-title">Ready to build.</h2>
        <p className="wizard-step-sub">Tap any part to change it.</p>
        <p className="wizard-summary">
          {usingFreeText ? (
            <>
              <button type="button" className="wizard-summary-chip" data-wizard-focus="true" data-wizard-option="true" onClick={jump("type")}>
                &ldquo;{freeText.trim()}&rdquo;
              </button>
              {", built with "}
              <button type="button" className="wizard-summary-chip" data-wizard-option="true" onClick={jump("style")}>{parts.ds}</button>
              {", "}
              <button type="button" className="wizard-summary-chip" data-wizard-option="true" onClick={jump("details")}>{parts.look}</button>
              {", for "}
              <button type="button" className="wizard-summary-chip" data-wizard-option="true" onClick={jump("audience")}>{parts.audience}</button>
              {"."}
            </>
          ) : (
            <>
              {parts.article + " "}
              <button type="button" className="wizard-summary-chip" data-wizard-focus="true" data-wizard-option="true" onClick={jump("type")}>{parts.type}</button>
              {", built with "}
              <button type="button" className="wizard-summary-chip" data-wizard-option="true" onClick={jump("style")}>{parts.ds}</button>
              {", "}
              <button type="button" className="wizard-summary-chip" data-wizard-option="true" onClick={jump("details")}>{parts.look}</button>
              {", for "}
              <button type="button" className="wizard-summary-chip" data-wizard-option="true" onClick={jump("audience")}>{parts.audience}</button>
              {"."}
            </>
          )}
        </p>
      </div>
    );
  };

  const renderStep = () => {
    switch (wizardStep) {
      case "type": return renderTypeStep();
      case "style": return renderStyleStep();
      case "details": return renderDetailsStep();
      case "audience": return renderAudienceStep();
      case "confirm": return renderConfirmStep();
      default: return null;
    }
  };

  if (wizardStep === "done") return null;

  return (
    <div className="wizard-layout">
      <div
        className="wizard-card"
        ref={cardRef}
        onKeyDown={onCardKeyDown}
        role="region"
        aria-label="Guided setup"
      >
        {/* Progress: 5 determinate segments + "Step N of 5" + upcoming labels. */}
        <div className="wizard-progress" aria-hidden="true">
          <div className="wizard-progress-head">
            <span className="wizard-progress-count">Step {idx} of {total}</span>
          </div>
          <div className="wizard-segments">
            {WIZARD_STEPS.map((s, i) => (
              <span
                key={s}
                className={`wizard-segment${i < idx ? " is-filled" : ""}${i === idx - 1 ? " is-current" : ""}`}
              />
            ))}
          </div>
          <div className="wizard-segment-labels">
            {WIZARD_STEPS.map((s, i) => (
              <span key={s} className={`wizard-segment-label${i === idx - 1 ? " is-current" : ""}`}>
                {WIZARD_STEP_LABELS[s]}
              </span>
            ))}
          </div>
        </div>

        {/* aria-live region announces the step on transition. */}
        <div className="wizard-aria-live" role="status" aria-live="polite">
          {announce}
        </div>

        {renderStep()}

        {/* Nav row: Back (after step 1) + Continue / Build it. */}
        <div className="wizard-nav">
          {wizardStep !== "type" ? (
            <button type="button" className="wizard-back" onClick={goBack}>
              <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
              Back
            </button>
          ) : (
            <span className="wizard-nav-spacer" aria-hidden="true" />
          )}
          <button
            type="button"
            className={`wizard-continue${isConfirm ? " wizard-build" : ""}`}
            onClick={goNext}
          >
            {isConfirm ? "Build it" : "Continue"}
            {!isConfirm && (
              <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
            )}
          </button>
        </div>

        {/* Persistent skip. */}
        <button type="button" className="wizard-skip" onClick={onSkip}>
          Skip setup, describe it myself
        </button>
      </div>

      {/* Live preview - right on desktop, below on mobile. */}
      <div className="wizard-preview-pane">
        <span className="wizard-preview-caption" aria-hidden="true">Live preview</span>
        <WizardLivePreview />
        <button type="button" className="wizard-browse-link" onClick={onBrowseTemplates}>
          Browse templates with previews
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 14, marginLeft: 4 }}>
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  );
}
