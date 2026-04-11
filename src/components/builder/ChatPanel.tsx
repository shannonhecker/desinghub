"use client";

import React, { useRef, useEffect, useState } from "react";
import { useBuilder } from "@/store/useBuilder";
import type { InterfaceType, DesignSystem } from "@/store/useBuilder";

/* ═══════════════════════════════════════════
   Progressive Disclosure — Step Configuration
   ═══════════════════════════════════════════ */

type OnboardingStep = "type" | "style" | "components" | "ready";

const TYPE_CHIPS: { label: string; value: InterfaceType }[] = [
  { label: "Dashboard", value: "dashboard" },
  { label: "Landing Page", value: "landing" },
  { label: "Form", value: "form" },
  { label: "E-Commerce", value: "ecommerce" },
  { label: "Blog", value: "blog" },
  { label: "Portfolio", value: "portfolio" },
];

const STYLE_CHIPS: { label: string; value: DesignSystem }[] = [
  { label: "Salt DS", value: "salt" },
  { label: "Material 3", value: "m3" },
  { label: "Fluent 2", value: "fluent" },
];

const COMPONENT_CHIPS: { label: string; ids: string[] }[] = [
  { label: "KPI Cards", ids: ["progress"] },
  { label: "Data Table", ids: ["table"] },
  { label: "Form Fields", ids: ["inputs", "text-fields", "form-field"] },
  { label: "Buttons", ids: ["buttons"] },
  { label: "Cards", ids: ["cards"] },
  { label: "Navigation", ids: ["tabs"] },
  { label: "Toggles", ids: ["switches", "checkboxes", "radios"] },
  { label: "Badges", ids: ["badges"] },
  { label: "Avatars", ids: ["avatars"] },
  { label: "Alerts", ids: ["alerts"] },
  { label: "Progress", ids: ["progress-bar"] },
  { label: "Tooltips", ids: ["tooltips"] },
];

const REFINE_CHIPS = ["Dark Mode", "Light Mode"];

/* ── AI response templates ── */
const TYPE_RESPONSES: Record<InterfaceType, string> = {
  dashboard: "Great choice! I'll set up a dashboard with analytics and data views.",
  landing: "Nice! I'll create a landing page with hero sections and feature highlights.",
  form: "Got it! I'll build a form layout with inputs, validation, and stepper flow.",
  ecommerce: "Shopping time! I'll set up a product catalog with filters and cart.",
  blog: "I'll design a blog with article cards, categories, and reading views.",
  portfolio: "I'll create a portfolio with project showcase and contact sections.",
};

const STYLE_RESPONSES: Record<DesignSystem, string> = {
  salt: "Salt DS — teal accents, Open Sans typography, and 4-level density scaling.",
  m3: "Material 3 — dynamic color, rounded surfaces, and the Roboto type scale.",
  fluent: "Fluent 2 — Segoe UI, brand blue palette, and compound components.",
};

function getFreeformResponse(input: string): string {
  const l = input.toLowerCase();
  if (l.includes("dark") || l.includes("light")) return "Theme updated! The preview reflects the new mode.";
  if (l.includes("salt")) return "Switched to Salt DS — teal accents and Open Sans typography.";
  if (l.includes("material") || l.includes("m3")) return "Switched to Material 3 — dynamic color and Roboto type scale.";
  if (l.includes("fluent")) return "Switched to Fluent 2 — Segoe UI and brand blue palette.";
  if (l.includes("color") || l.includes("accent")) return "I'll adjust the color palette for you.";
  if (l.includes("add") || l.includes("more")) return "Added to your preview. Check the updated layout.";
  if (l.includes("remove") || l.includes("less")) return "Removed from the preview. Looking cleaner already.";
  return "Got it! I've updated your design. Check the preview to see the changes.";
}

/* ═══════════════════════════════════════════
   ChatPanel Component
   ═══════════════════════════════════════════ */

export function ChatPanel() {
  const {
    messages, inputText, isVoiceActive, isGenerating,
    setInputText, addMessage, toggleVoice, setGenerating, bumpPreview,
    designSystem, interfaceType,
    previewOpen, setPreviewOpen,
    setDesignSystem, setMode, setInterfaceType, setSelectedComponents,
  } = useBuilder();

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  /* ── Onboarding state machine ── */
  const [step, setStep] = useState<OnboardingStep>("type");
  const [pendingComponents, setPendingComponents] = useState<string[]>([]);

  const hasMessages = messages.length > 0;
  const hasText = inputText.trim().length > 0;
  const glowActive = focused || hasText;
  const orbState = isGenerating ? "generating" : hasText ? "typing" : "";

  /* Reset onboarding when chat is cleared */
  useEffect(() => {
    if (messages.length === 0) {
      setStep("type");
      setPendingComponents([]);
    }
  }, [messages.length]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ═══════════════════════════════════
     Step Handlers
     ═══════════════════════════════════ */

  const handleTypeSelect = (chip: (typeof TYPE_CHIPS)[number]) => {
    if (isGenerating) return;
    addMessage("user", chip.label);
    setInterfaceType(chip.value);
    setGenerating(true);
    setTimeout(() => {
      addMessage("ai", `${TYPE_RESPONSES[chip.value]} Which design system would you like to use?`);
      setGenerating(false);
      setStep("style");
    }, 600 + Math.random() * 600);
  };

  const handleStyleSelect = (chip: (typeof STYLE_CHIPS)[number]) => {
    if (isGenerating) return;
    addMessage("user", chip.label);
    setDesignSystem(chip.value);
    setGenerating(true);
    setTimeout(() => {
      addMessage("ai", `${STYLE_RESPONSES[chip.value]} Now select the components you need.`);
      setGenerating(false);
      setStep("components");
    }, 600 + Math.random() * 600);
  };

  const handleComponentToggle = (chip: (typeof COMPONENT_CHIPS)[number]) => {
    setPendingComponents((prev) =>
      prev.includes(chip.label) ? prev.filter((c) => c !== chip.label) : [...prev, chip.label]
    );
  };

  const handleGeneratePreview = () => {
    if (isGenerating || pendingComponents.length === 0) return;
    const ids = COMPONENT_CHIPS.filter((c) => pendingComponents.includes(c.label)).flatMap((c) => c.ids);
    setSelectedComponents(ids);
    addMessage("user", `Generate with: ${pendingComponents.join(", ")}`);
    setGenerating(true);
    if (!previewOpen) setPreviewOpen(true);

    const dsLabel = designSystem === "salt" ? "Salt DS" : designSystem === "m3" ? "Material 3" : "Fluent 2";
    setTimeout(() => {
      addMessage(
        "ai",
        `Your preview is ready! I've configured ${pendingComponents.length} component groups with ${dsLabel} styling. Switch themes, adjust components, or ask me anything to refine.`
      );
      setGenerating(false);
      bumpPreview();
      setStep("ready");
    }, 800 + Math.random() * 800);
  };

  /* ═══════════════════════════════════
     Free-form Send (STEP_READY + fallback)
     ═══════════════════════════════════ */

  const handleSend = (text?: string) => {
    const msg = (text || inputText).trim();
    if (!msg || isGenerating) return;
    addMessage("user", msg);
    setGenerating(true);
    const l = msg.toLowerCase();

    /* ── STEP_READY: free-form refinement ── */
    if (step === "ready") {
      if (l.includes("dark")) setMode("dark");
      else if (l.includes("light")) setMode("light");

      if (l.includes("salt")) setDesignSystem("salt");
      else if (l.includes("material") || l.includes("m3")) setDesignSystem("m3");
      else if (l.includes("fluent")) setDesignSystem("fluent");

      if (!previewOpen) setPreviewOpen(true);

      setTimeout(() => {
        addMessage("ai", getFreeformResponse(msg));
        setGenerating(false);
        bumpPreview();
      }, 600 + Math.random() * 800);
      return;
    }

    /* ── Guided steps: try to match typed input to step options ── */
    if (step === "type") {
      const match = TYPE_CHIPS.find((c) => l.includes(c.value) || l.includes(c.label.toLowerCase()));
      if (match) {
        setInterfaceType(match.value);
        setTimeout(() => {
          addMessage("ai", `${TYPE_RESPONSES[match.value]} Which design system would you like to use?`);
          setGenerating(false);
          setStep("style");
        }, 600 + Math.random() * 600);
      } else {
        setTimeout(() => {
          addMessage("ai", "I can help with that! Please select a project type above to get started.");
          setGenerating(false);
        }, 400);
      }
    } else if (step === "style") {
      const match = STYLE_CHIPS.find((c) => l.includes(c.value) || l.includes(c.label.toLowerCase()));
      if (match) {
        setDesignSystem(match.value);
        setTimeout(() => {
          addMessage("ai", `${STYLE_RESPONSES[match.value]} Now select the components you need.`);
          setGenerating(false);
          setStep("components");
        }, 600 + Math.random() * 600);
      } else {
        setTimeout(() => {
          addMessage("ai", "Please pick a design system — Salt DS, Material 3, or Fluent 2.");
          setGenerating(false);
        }, 400);
      }
    } else {
      setTimeout(() => {
        addMessage("ai", "Select the components you need above, then click Generate Preview.");
        setGenerating(false);
      }, 400);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (hasText && !isGenerating) handleSend();
    }
  };

  /* ═══════════════════════════════════
     Render
     ═══════════════════════════════════ */

  const renderChips = () => {
    if (step === "type") {
      return (
        <div className="prompt-bubbles">
          {TYPE_CHIPS.map((chip) => (
            <button key={chip.label} className="prompt-bubble" onClick={() => handleTypeSelect(chip)}>
              {chip.label}
            </button>
          ))}
        </div>
      );
    }

    if (step === "style") {
      return (
        <div className="prompt-bubbles">
          {STYLE_CHIPS.map((chip) => (
            <button key={chip.label} className="prompt-bubble" onClick={() => handleStyleSelect(chip)}>
              {chip.label}
            </button>
          ))}
        </div>
      );
    }

    if (step === "components") {
      return (
        <div className="component-selector">
          <div className="prompt-bubbles">
            {COMPONENT_CHIPS.map((chip) => (
              <button
                key={chip.label}
                className={`prompt-bubble ${pendingComponents.includes(chip.label) ? "selected" : ""}`}
                onClick={() => handleComponentToggle(chip)}
              >
                {pendingComponents.includes(chip.label) && (
                  <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 4 }}>check</span>
                )}
                {chip.label}
              </button>
            ))}
          </div>
          {pendingComponents.length > 0 && (
            <button className="generate-btn" onClick={handleGeneratePreview} disabled={isGenerating}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>auto_awesome</span>
              Generate Preview ({pendingComponents.length})
            </button>
          )}
        </div>
      );
    }

    /* STEP_READY — refinement chips */
    return (
      <div className="prompt-bubbles">
        {REFINE_CHIPS.map((label) => (
          <button key={label} className="prompt-bubble" onClick={() => handleSend(label)}>
            {label}
          </button>
        ))}
      </div>
    );
  };

  const placeholderText =
    step === "type"
      ? "Or describe what you'd like to build..."
      : step === "style"
        ? "Or type a design system name..."
        : step === "components"
          ? "Select components above..."
          : "Refine your design — try 'dark mode' or 'switch to Fluent'...";

  return (
    <div className="chat-layout">
      {/* Scrollable content area */}
      <div className="chat-scroll">
        {/* Orb */}
        <div className="orb-container">
          <div className="orb-wrap" style={hasMessages ? { width: 70, height: 70 } : undefined}>
            <div className="orb-glow" style={hasMessages ? { filter: "blur(18px)" } : undefined} />
            {!hasMessages && <div className="orb-particles" />}
            <div className={`orb-sphere ${orbState}`} />
            <div className="orb-shimmer" />
          </div>
        </div>

        {/* Hero title — only STEP_TYPE before first message */}
        {!hasMessages && step === "type" && (
          <h1 className="hero-title">What would you like to build?</h1>
        )}

        {/* Messages */}
        {hasMessages && (
          <div className="messages-area">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-msg chat-msg-${msg.role}`}>
                {msg.role === "ai" && <div className="chat-msg-label">Design Hub AI</div>}
                {msg.content}
              </div>
            ))}
            {isGenerating && (
              <div className="chat-msg chat-msg-ai">
                <div className="chat-msg-label">Design Hub AI</div>
                <div className="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Step-specific chips */}
        {renderChips()}
      </div>

      {/* Input — always pinned to bottom */}
      <div className="chat-input-bar">
        <div className="input-container">
          <div className={`input-glow ${glowActive ? "active" : ""}`} />
          <div className={`input-box ${focused ? "focused" : ""}`}>
            <textarea
              ref={inputRef}
              className="input-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={placeholderText}
              rows={1}
            />
            <div className="input-actions">
              <button
                className={`mic-btn ${isVoiceActive ? "active" : ""}`}
                onClick={toggleVoice}
                aria-label="Toggle voice"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {isVoiceActive ? "stop" : "mic"}
                </span>
              </button>
              <button
                className="send-btn"
                onClick={() => handleSend()}
                disabled={!hasText || isGenerating}
                aria-label="Send"
              >
                <span className="btn-icon material-symbols-outlined">arrow_upward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
