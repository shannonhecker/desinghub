"use client";

import React, { useRef, useEffect, useState } from "react";
import { useBuilder } from "@/store/useBuilder";
import type { InterfaceType, DesignSystem, OnboardingStep } from "@/store/useBuilder";

/* ═══════════════════════════════════════════
   Progressive Disclosure — Step Configuration
   ═══════════════════════════════════════════ */

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
  { label: "Typography", ids: ["typography"] },
];

const REFINE_CHIPS = [
  "Dark Mode", "Light Mode",
  "Add Buttons", "Add Cards", "Add Typography",
  "Build Dashboard", "Build Form",
  "Show All", "Clear All",
];

/* ── Component keyword → ID mapping for free-form chat ── */

const COMPONENT_KEYWORDS: { keywords: string[]; ids: string[]; label: string }[] = [
  { keywords: ["kpi", "metric", "kpi card", "stats", "stat card", "statistics"],    ids: ["progress"],                              label: "KPI Cards" },
  { keywords: ["table", "data table", "grid", "data grid", "spreadsheet"],          ids: ["table"],                                 label: "Data Table" },
  { keywords: ["input", "form field", "text field", "text input", "form input",
               "form element", "field"],                                             ids: ["inputs", "text-fields", "form-field"],   label: "Form Fields" },
  { keywords: ["button", "cta", "action button"],                                   ids: ["buttons"],                               label: "Buttons" },
  { keywords: ["card", "content card", "info card"],                                ids: ["cards"],                                 label: "Cards" },
  { keywords: ["nav", "navigation", "tab", "menu", "sidebar nav"],                 ids: ["tabs"],                                  label: "Navigation" },
  { keywords: ["toggle", "switch", "checkbox", "radio", "check box"],              ids: ["switches", "checkboxes", "radios"],      label: "Toggles" },
  { keywords: ["badge", "chip", "tag", "label badge"],                              ids: ["badges"],                                label: "Badges" },
  { keywords: ["avatar", "profile pic", "user icon", "user image"],                ids: ["avatars"],                               label: "Avatars" },
  { keywords: ["alert", "notification", "banner", "toast", "snackbar"],            ids: ["alerts"],                                label: "Alerts" },
  { keywords: ["progress bar", "loader", "loading", "spinner", "loading bar"],     ids: ["progress-bar"],                          label: "Progress" },
  { keywords: ["tooltip", "popover", "hint", "info tip"],                          ids: ["tooltips"],                              label: "Tooltips" },
  { keywords: ["dropdown", "select", "picker", "combobox", "combo box"],           ids: ["inputs", "form-field"],                  label: "Dropdown" },
  { keywords: ["date picker", "datepicker", "calendar input", "date field"],       ids: ["inputs", "form-field"],                  label: "Date Picker" },
  { keywords: ["dialog", "modal", "popup", "overlay"],                             ids: ["buttons"],                               label: "Dialog" },
  { keywords: ["typography", "text", "body text", "title", "heading", "label",
               "caption", "font", "type scale", "type", "headline", "subtitle",
               "paragraph", "overline", "display text"],                           ids: ["typography"],                            label: "Typography" },
];

/* ═══════════════════════════════════════════
   Layout Presets — generate full page combos
   ═══════════════════════════════════════════ */

const LAYOUT_PRESETS: Record<string, string[]> = {
  dashboard:  ["StatsCards", "DataTable", "Tabs", "Cards", "Progress"],
  form:       ["FormFields", "Toggles", "Buttons", "Dropdown", "DatePicker"],
  landing:    ["StatsCards", "Buttons", "Cards", "Badges", "Avatars"],
  ecommerce:  ["Cards", "Badges", "Buttons", "DataTable", "FormFields"],
  blog:       ["Cards", "Avatars", "Badges", "Tabs", "Buttons"],
  portfolio:  ["Cards", "Avatars", "StatsCards", "Tabs", "Buttons"],
};

const BLOCK_TO_IDS: Record<string, string[]> = {
  Alert:      ["alerts"],
  DataTable:  ["table"],
  FormFields: ["inputs", "text-fields", "form-field"],
  Buttons:    ["buttons"],
  Cards:      ["cards"],
  Tabs:       ["tabs"],
  Toggles:    ["switches", "checkboxes", "radios"],
  Badges:     ["badges"],
  Avatars:    ["avatars"],
  Progress:   ["progress-bar"],
  Tooltips:   ["tooltips"],
  StatsCards: ["progress"],
  Dropdown:   ["inputs", "form-field"],
  DatePicker: ["inputs", "form-field"],
  Dialog:     ["buttons"],
  Typography: ["typography"],
};

/** Detect layout-generation intent and return the resolved component IDs + metadata. */
function processLayoutCommand(
  input: string,
): { layoutType: string; ids: string[]; blocks: string[] } | null {
  const l = input.toLowerCase();

  // Layout intent patterns
  const layoutPatterns = [
    /\b(?:build|create|generate|make|set up|design|give me|i need|start)\b.*?\b(dashboard|form|landing|ecommerce|e-commerce|blog|portfolio)\b/i,
    /\b(dashboard|form|landing|ecommerce|e-commerce|blog|portfolio)\b.*?\b(?:layout|page|view|template|screen)\b/i,
  ];

  for (const pattern of layoutPatterns) {
    const match = l.match(pattern);
    if (match) {
      let type = match[1].toLowerCase().replace("-", "");
      // Normalize "landing page" → "landing", "e-commerce" → "ecommerce"
      if (type === "e" || type === "ecommerce") type = "ecommerce";
      const blocks = LAYOUT_PRESETS[type];
      if (!blocks) continue;
      const ids = [...new Set(blocks.flatMap((b) => BLOCK_TO_IDS[b] || []))];
      return { layoutType: type, ids, blocks };
    }
  }
  return null;
}

function processComponentCommand(
  input: string,
  currentComponents: string[],
): { response: string; newComponents: string[] | null } {
  const l = input.toLowerCase();

  /* ── List / query current components ── */
  if (/\b(what components|list components|what do i have|show components|current components|what's in)\b/i.test(l)) {
    if (currentComponents.length === 0) {
      return { response: "You don't have any components selected yet. Try 'add buttons' or 'build a dashboard' to get started.", newComponents: null };
    }
    // Reverse-map IDs to labels
    const activeLabels = COMPONENT_KEYWORDS
      .filter((g) => g.ids.some((id) => currentComponents.includes(id)))
      .map((g) => g.label);
    const uniqueLabels = [...new Set(activeLabels)];
    return {
      response: `You currently have ${uniqueLabels.length} component group${uniqueLabels.length === 1 ? "" : "s"}: ${uniqueLabels.join(", ")}.`,
      newComponents: null,
    };
  }

  /* ── Intent detection ── */
  const isClear   = /\b(clear all|remove all|reset|empty|start over|clean)\b/i.test(l);
  const isAll     = /\b(all components|everything|show all|add all)\b/i.test(l);
  const isRemove  = /\b(remove|delete|hide|drop|take away|get rid of)\b/i.test(l);
  const isAdd     = /\b(add|include|show|put|insert|give me|want|need|more|create|generate|build|make)\b/i.test(l);
  const isReplace = /\b(replace|swap)\b/i.test(l);
  const isExcept  = /\b(except|other than|besides|but not|everything but|all but)\b/i.test(l);

  /* ── Match mentioned components ── */
  // Sort keywords by length (longest first) to avoid partial matches ("form" vs "form field")
  const mentionedGroups = COMPONENT_KEYWORDS.filter((g) =>
    g.keywords.some((kw) => {
      const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?\\b`, "i");
      return re.test(l);
    }),
  );
  const mentionedIds    = [...new Set(mentionedGroups.flatMap((g) => g.ids))];
  const mentionedLabels = [...new Set(mentionedGroups.map((g) => g.label))];

  /* ── Negation: "remove everything except X" ── */
  if (isRemove && isExcept && mentionedIds.length > 0) {
    const newComps = currentComponents.filter((id) => mentionedIds.includes(id));
    const remaining = COMPONENT_KEYWORDS
      .filter((g) => g.ids.some((id) => newComps.includes(id)))
      .map((g) => g.label);
    const uniqueRemaining = [...new Set(remaining)];
    return {
      response: `Removed everything except ${mentionedLabels.join(", ")}. ${uniqueRemaining.length} group${uniqueRemaining.length === 1 ? "" : "s"} remaining.`,
      newComponents: newComps,
    };
  }

  /* ── Replace / Swap: "replace X with Y" or "swap X for Y" ── */
  if (isReplace && mentionedGroups.length >= 2) {
    // First mentioned group is the one being replaced, rest are the replacements
    const toRemoveGroup = mentionedGroups[0];
    const toAddGroups = mentionedGroups.slice(1);
    const removeIds = toRemoveGroup.ids;
    const addIds = toAddGroups.flatMap((g) => g.ids);
    let newComps = currentComponents.filter((id) => !removeIds.includes(id));
    newComps = [...new Set([...newComps, ...addIds])];
    const addedLabels = toAddGroups.map((g) => g.label);
    const total = COMPONENT_KEYWORDS.filter((g) => g.ids.some((id) => newComps.includes(id))).length;
    return {
      response: `Replaced ${toRemoveGroup.label} with ${addedLabels.join(", ")}. You now have ${total} component groups.`,
      newComponents: newComps,
    };
  }

  /* ── Clear all ── */
  if (isClear)
    return { response: "All components cleared. Tell me what to add or select from the options.", newComponents: [] };

  /* ── Show all ── */
  if (isAll) {
    const allIds = COMPONENT_KEYWORDS.flatMap((g) => g.ids);
    const uniqueAll = [...new Set(allIds)];
    return { response: `Added all available components to your preview! You now have ${COMPONENT_KEYWORDS.length} component groups.`, newComponents: uniqueAll };
  }

  /* ── Remove specific ── */
  if (isRemove && mentionedIds.length > 0) {
    const newComps = currentComponents.filter((id) => !mentionedIds.includes(id));
    const remaining = COMPONENT_KEYWORDS.filter((g) => g.ids.some((id) => newComps.includes(id))).length;
    return {
      response: `Removed ${mentionedLabels.join(", ")}. ${remaining} group${remaining === 1 ? "" : "s"} remaining.`,
      newComponents: newComps,
    };
  }

  /* ── Add specific (handles compound: "add buttons, cards, and a table") ── */
  if ((isAdd || mentionedIds.length > 0) && mentionedIds.length > 0) {
    const newComps = [...new Set([...currentComponents, ...mentionedIds])];
    const total = COMPONENT_KEYWORDS.filter((g) => g.ids.some((id) => newComps.includes(id))).length;
    // Handle count phrases — cosmetic only
    const countMatch = l.match(/\b(\d+|two|three|four|five|six|seven|eight|nine|ten)\s+\w+/);
    const countNote = countMatch ? " (showing component variations)" : "";
    return {
      response: `Added ${mentionedLabels.join(", ")} to your preview${countNote}. You now have ${total} component groups.`,
      newComponents: newComps,
    };
  }

  return { response: "", newComponents: null };
}

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
  if (l.includes("thank")) return "You're welcome! Let me know if you need anything else.";
  if (l.includes("help")) return "I can help! Try 'add buttons', 'remove cards', 'build a dashboard', 'dark mode', 'switch to Fluent', or 'what components do I have?'.";
  return "I didn't catch that. Try 'add buttons', 'remove cards', 'build a dashboard', or 'dark mode'.";
}

/* ═══════════════════════════════════════════
   ChatPanel Component
   ═══════════════════════════════════════════ */

export function ChatPanel() {
  const {
    messages, inputText, isVoiceActive, isGenerating,
    setInputText, addMessage, toggleVoice, setGenerating, bumpPreview,
    designSystem, interfaceType, selectedComponents,
    previewOpen, setPreviewOpen,
    setDesignSystem, setMode, setInterfaceType, setSelectedComponents,
    onboardingStep: step, setOnboardingStep: setStep,
    pendingComponents, setPendingComponents, togglePendingComponent,
  } = useBuilder();

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  const hasMessages = messages.length > 0;
  const hasText = inputText.trim().length > 0;
  const glowActive = focused || hasText;
  const orbState = isGenerating ? "generating" : hasText ? "typing" : "";

  /* Recover step state — if messages exist but step was lost (e.g. HMR) */
  useEffect(() => {
    if (messages.length > 0 && step === "type") {
      const hasAiMsg = messages.some((m) => m.role === "ai");
      if (hasAiMsg && selectedComponents.length > 0) {
        setStep("ready"); // Wizard was completed, restore to ready
      }
    }
  }, []); // Run once on mount

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
    togglePendingComponent(chip.label);
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

    /* ═══ UNIVERSAL: layout + component commands work in ANY step ═══ */

    /* Layout generation — detect first (higher priority than single-component adds) */
    const layoutResult = processLayoutCommand(msg);
    if (layoutResult) {
      setSelectedComponents(layoutResult.ids);
      if (!previewOpen) setPreviewOpen(true);

      const dsLabel = designSystem === "salt" ? "Salt DS" : designSystem === "m3" ? "Material 3" : "Fluent 2";
      const blockList = layoutResult.blocks.join(", ");
      setTimeout(() => {
        addMessage(
          "ai",
          `Generated a ${layoutResult.layoutType} layout with ${layoutResult.blocks.length} component groups: ${blockList}. ` +
          `Using ${dsLabel} styling. Customize by saying 'add' or 'remove' any component.`
        );
        setGenerating(false);
        bumpPreview();
        if (step !== "ready") setStep("ready");
      }, 800 + Math.random() * 800);
      return;
    }

    const { response: compResponse, newComponents } = processComponentCommand(msg, selectedComponents);

    /* Theme changes — work in any step */
    let themeChanged = false;
    if (l.includes("dark"))  { setMode("dark");  themeChanged = true; }
    else if (l.includes("light")) { setMode("light"); themeChanged = true; }

    /* Design system changes — work in any step */
    let dsChanged = false;
    if (l.includes("salt"))                         { setDesignSystem("salt");   dsChanged = true; }
    else if (l.includes("material") || l.includes("m3")) { setDesignSystem("m3");     dsChanged = true; }
    else if (l.includes("fluent"))                  { setDesignSystem("fluent"); dsChanged = true; }

    /* If component command matched, apply it and respond (regardless of step) */
    if (newComponents !== null) {
      setSelectedComponents(newComponents);
      if (!previewOpen) setPreviewOpen(true);

      setTimeout(() => {
        addMessage("ai", compResponse);
        setGenerating(false);
        bumpPreview();
        if (step !== "ready") setStep("ready");
      }, 600 + Math.random() * 800);
      return;
    }

    /* ── STEP_READY: free-form refinement (theme/DS already applied above) ── */
    if (step === "ready") {
      if (!previewOpen) setPreviewOpen(true);

      const aiResponse = themeChanged
        ? "Theme updated! The preview reflects the new mode."
        : dsChanged
          ? getFreeformResponse(msg)
          : getFreeformResponse(msg);

      setTimeout(() => {
        addMessage("ai", aiResponse);
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
          : "Try 'add buttons', 'remove cards', 'dark mode', or 'switch to Fluent'...";

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
