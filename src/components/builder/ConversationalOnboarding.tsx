"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useBuilder } from "@/store/useBuilder";
import type { DesignSystem } from "@/store/useBuilder";
import {
  WIZARD_STEPS,
  stepIndex,
  nextStep,
  TYPE_OPTIONS,
  DS_OPTIONS,
  MODE_OPTIONS,
  AUDIENCE_OPTIONS,
  DENSITY_VALUES,
  densityLabel,
  buildSummaryParts,
  DS_SUMMARY_LABEL,
  type DensityValue,
  type WizardBuildArgs,
} from "@/lib/wizardFlow";

/* ════════════════════════════════════════════════════════════
   Conversational onboarding
   ────────────────────────────────────────────────────────────
   Replaces the multi-card WizardPanel. Same five decisions
   (Type → System → Look → Audience → Confirm) but delivered ONE
   AT A TIME as chat turns: the assistant asks, the user answers
   with chips (or by typing), the answer renders as a user bubble,
   and the next question follows.

   It owns NO build logic — it drives the existing store dims
   (interfaceType / designSystem / mode / density via their
   setters, so the eventual build + any live theming stay correct)
   and the shared `wizardStep` pointer, then hands off to the
   UNCHANGED onBuild pipeline. A persistent "Build it now" lets the
   user create at any point, never trapped in the questionnaire.
   ════════════════════════════════════════════════════════════ */

interface ConversationalOnboardingProps {
  /* Build with the answers so far — ChatPanel owns the (template /
     freeform) pipeline; we only pass the non-store args. */
  onBuild: (args: WizardBuildArgs) => void;
  /* Drop straight into the freeform composer with current defaults. */
  onSkip: () => void;
  /* Open the templates drawer (the secondary, non-conversational entry). */
  onBrowseTemplates: () => void;
}

type VisibleStep = (typeof WIZARD_STEPS)[number];

/* The question the assistant asks for each step. */
const QUESTION: Record<VisibleStep, string> = {
  type: "What are you building?",
  style: "Which design system should I use?",
  details: "Set the look. Pick a theme and density.",
  audience: "Who is this for?",
  confirm: "Ready to build.",
};

/* ── Roving radiogroup of chips ──
   A true radiogroup (arrow-key roving + Enter/Space select), so a
   single choice is keyboard-operable and announced correctly. The
   selected chip is distinguished by fill + weight + a check glyph,
   never colour alone. */
interface RadioOption {
  value: string;
  label: string;
}
function RadioChips({
  ariaLabel,
  options,
  value,
  onSelect,
  renderLead,
  autoFocusFirst,
}: {
  ariaLabel: string;
  options: RadioOption[];
  value: string | null;
  onSelect: (value: string) => void;
  renderLead?: (opt: RadioOption) => React.ReactNode;
  autoFocusFirst?: boolean;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (from: number, dir: 1 | -1) => {
    const n = options.length;
    const to = (from + dir + n) % n;
    refs.current[to]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      move(i, 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      move(i, -1);
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onSelect(options[i].value);
    }
  };

  /* Roving tabindex: the selected chip (or the first when none is
     selected) is the single tab stop. */
  const activeIndex = (() => {
    const i = options.findIndex((o) => o.value === value);
    return i === -1 ? 0 : i;
  })();

  return (
    <div role="radiogroup" aria-label={ariaLabel} className="prompt-bubbles onboarding-radiogroup">
      {options.map((opt, i) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={i === activeIndex ? 0 : -1}
            data-onboarding-focus={autoFocusFirst && i === activeIndex ? "true" : undefined}
            className={`prompt-bubble onboarding-radio${selected ? " selected" : ""}`}
            onClick={() => onSelect(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {renderLead?.(opt)}
            {opt.label}
            {selected && (
              <span className="material-symbols-outlined onboarding-radio-check" aria-hidden="true">
                check
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ConversationalOnboarding({
  onBuild,
  onSkip,
  onBrowseTemplates,
}: ConversationalOnboardingProps) {
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

  /* Non-store answers. */
  const [freeText, setFreeText] = useState("");
  const [audience, setAudience] = useState<"internal" | "public">("internal");
  const [note, setNote] = useState("");
  const [announce, setAnnounce] = useState("");
  /* Whether the user has actively picked an interface type. Until they do, the
     type step shows NO pre-selected chip (owner: don't pre-select "Dashboard").
     The store's interfaceType still defaults to dashboard for the live preview;
     this only governs the wizard's visible selection. */
  const [typeChosen, setTypeChosen] = useState(false);

  const activeRef = useRef<HTMLDivElement>(null);

  const idx = stepIndex(wizardStep); // 1-based within the 5 visible steps
  const total = WIZARD_STEPS.length;
  const answered = WIZARD_STEPS.slice(0, idx - 1); // steps before the active one

  const args = useCallback(
    (): WizardBuildArgs => ({
      freeText: freeText.trim() ? freeText.trim() : null,
      audience,
      note: note.trim(),
    }),
    [freeText, audience, note],
  );

  /* Advance to the next visible step (or build, when past Confirm). */
  const advance = useCallback(() => {
    const n = nextStep(wizardStep);
    if (n === "done") {
      onBuild(args());
      return;
    }
    setWizardStep(n);
  }, [wizardStep, onBuild, args, setWizardStep]);

  /* Single-choice steps select + advance in one tap (snappy, chat-like).
     The Look step (two picks) and Confirm advance via an explicit button. */
  const pickType = (value: string) => {
    setInterfaceType(value as typeof interfaceType);
    setTypeChosen(true);
    setFreeText("");
    advance();
  };
  const pickDs = (value: string) => {
    setDesignSystem(value as DesignSystem);
    advance();
  };
  const pickAudience = (value: string) => {
    setAudience(value as "internal" | "public");
    advance();
  };

  /* Announce the active question + move focus into it on each transition. */
  useEffect(() => {
    if (wizardStep === "done") return;
    setAnnounce(`Step ${idx} of ${total}. ${QUESTION[wizardStep as VisibleStep]}`);
    const r = requestAnimationFrame(() => {
      const el = activeRef.current?.querySelector<HTMLElement>(
        '[data-onboarding-focus="true"], .onboarding-build-primary, input',
      );
      el?.focus();
    });
    return () => cancelAnimationFrame(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizardStep]);

  if (wizardStep === "done") return null;

  /* The answer label to echo as a user bubble for a completed step. */
  const answerLabel = (step: VisibleStep): string => {
    switch (step) {
      case "type":
        return freeText.trim()
          ? `“${freeText.trim()}”`
          : TYPE_OPTIONS.find((o) => o.value === interfaceType)?.label ?? "Dashboard";
      case "style":
        return DS_SUMMARY_LABEL[designSystem];
      case "details": {
        const m = MODE_OPTIONS.find((o) => o.value === mode)?.label ?? "Light";
        return `${m}, ${densityLabel(density as DensityValue, designSystem)} density`;
      }
      case "audience":
        return AUDIENCE_OPTIONS.find((o) => o.value === audience)?.label ?? "Internal tool";
      default:
        return "";
    }
  };

  /* ── Active-step controls ── */
  const renderActive = () => {
    switch (wizardStep) {
      case "type":
        return (
          <>
            <RadioChips
              ariaLabel="Interface type"
              options={TYPE_OPTIONS.map((o) => ({
                value: o.value,
                label: o.recommended ? `${o.label} (recommended)` : o.label,
              }))}
              value={typeChosen && !freeText.trim() ? interfaceType : null}
              onSelect={pickType}
              autoFocusFirst
              renderLead={(opt) => (
                <span
                  className="material-symbols-outlined onboarding-radio-icon"
                  aria-hidden="true"
                >
                  {TYPE_OPTIONS.find((o) => o.value === opt.value)?.icon ?? "dashboard"}
                </span>
              )}
            />
          </>
        );

      case "style":
        return (
          <RadioChips
            ariaLabel="Design system"
            options={DS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            value={designSystem}
            onSelect={pickDs}
            autoFocusFirst
            renderLead={(opt) => (
              <span className="prompt-bubble-ds-dot" data-ds={opt.value} aria-hidden="true" />
            )}
          />
        );

      case "details":
        return (
          <>
            <RadioChips
              ariaLabel="Theme"
              options={MODE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              value={mode}
              onSelect={(v) => setMode(v as typeof mode)}
              autoFocusFirst
              renderLead={(opt) => (
                <span
                  className="material-symbols-outlined onboarding-radio-icon"
                  aria-hidden="true"
                >
                  {MODE_OPTIONS.find((o) => o.value === opt.value)?.icon ?? "light_mode"}
                </span>
              )}
            />
            <RadioChips
              ariaLabel="Density"
              options={DENSITY_VALUES.map((d) => ({
                value: d,
                label: densityLabel(d, designSystem),
              }))}
              value={density}
              onSelect={(v) => setDensity(v as DensityValue)}
            />
            <button type="button" className="onboarding-build-primary onboarding-continue" onClick={advance}>
              Continue
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_forward
              </span>
            </button>
          </>
        );

      case "audience":
        return (
          <>
            <RadioChips
              ariaLabel="Audience"
              options={AUDIENCE_OPTIONS.map((o) => ({
                value: o.value,
                label: `${o.label} (${o.hint})`,
              }))}
              value={audience}
              onSelect={pickAudience}
              autoFocusFirst
            />
            <div className="onboarding-freetext-row">
              <span className="onboarding-freetext-label">add a note</span>
              <input
                type="text"
                className="onboarding-freetext"
                placeholder="optional, anything specific?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                aria-label="Optional note about the audience"
              />
            </div>
          </>
        );

      case "confirm": {
        const parts = buildSummaryParts({
          interfaceType,
          designSystem,
          mode,
          density: (DENSITY_VALUES as readonly string[]).includes(density)
            ? (density as DensityValue)
            : "medium",
          audience,
        });
        const usingFreeText = Boolean(freeText.trim());
        const jump = (step: VisibleStep) => () => setWizardStep(step);
        return (
          <>
            <p className="onboarding-summary">
              {usingFreeText ? (
                <>
                  <button type="button" className="onboarding-summary-chip" data-onboarding-focus="true" onClick={jump("type")}>
                    {`“${freeText.trim()}”`}
                  </button>
                  {", built with "}
                </>
              ) : (
                <>
                  {parts.article + " "}
                  <button type="button" className="onboarding-summary-chip" data-onboarding-focus="true" onClick={jump("type")}>
                    {parts.type}
                  </button>
                  {", built with "}
                </>
              )}
              <button type="button" className="onboarding-summary-chip" onClick={jump("style")}>
                {parts.ds}
              </button>
              {", "}
              <button type="button" className="onboarding-summary-chip" onClick={jump("details")}>
                {parts.look}
              </button>
              {", for "}
              <button type="button" className="onboarding-summary-chip" onClick={jump("audience")}>
                {parts.audience}
              </button>
              {". Tap any part to change it."}
            </p>
            <button type="button" className="onboarding-build-primary" onClick={() => onBuild(args())}>
              Build it
              <span className="material-symbols-outlined" aria-hidden="true">
                auto_awesome
              </span>
            </button>
          </>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="onboarding-flow" role="group" aria-label="Guided setup">
      {/* Screen-reader announcement of each new question. */}
      <div className="onboarding-aria-live" role="status" aria-live="polite">
        {announce}
      </div>

      {/* Completed turns: question (assistant) + answer (user) bubbles. */}
      {answered.map((step) => (
        <React.Fragment key={step}>
          <div className="chat-msg chat-msg-ai onboarding-q">{QUESTION[step]}</div>
          <button
            type="button"
            className="chat-msg chat-msg-user onboarding-a"
            onClick={() => setWizardStep(step)}
            title="Change this answer"
          >
            {answerLabel(step)}
          </button>
        </React.Fragment>
      ))}

      {/* Active turn. */}
      <div className="onboarding-active" ref={activeRef}>
        <div className="chat-msg chat-msg-ai onboarding-q">
          {QUESTION[wizardStep as VisibleStep]}
          <span className="onboarding-step-count" aria-hidden="true">
            {idx} of {total}
          </span>
        </div>
        {renderActive()}
      </div>

      {/* Persistent escape hatches — never trapped in the questionnaire. */}
      <div className="onboarding-footer">
        {wizardStep !== "confirm" && (
          <button type="button" className="onboarding-footer-link onboarding-build-now" onClick={() => onBuild(args())}>
            <span className="material-symbols-outlined" aria-hidden="true">
              bolt
            </span>
            Build it now
          </button>
        )}
        <button type="button" className="onboarding-footer-link" onClick={onBrowseTemplates}>
          Browse templates
        </button>
        <button type="button" className="onboarding-footer-link onboarding-skip" onClick={onSkip}>
          Skip setup, I&rsquo;ll describe it myself
        </button>
      </div>
    </div>
  );
}
