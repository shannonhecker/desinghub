"use client";

import React, { useRef, useEffect, useState } from "react";
import { useBuilder } from "@/store/useBuilder";
import type { DesignSystem } from "@/store/useBuilder";
import { useChatAPI } from "@/lib/useChatAPI";
import { BUILDER_TEMPLATES, TEMPLATE_ORDER, getLoginDashboardBody, type BuilderTemplate } from "@/lib/builderTemplates";
import { regenerateTemplateContent } from "@/lib/regenerateTemplateContent";

/* ═══════════════════════════════════════════
   Chat-first Builder — no mandatory wizard.
   Pattern cards are quick-start chips shown
   only while messages.length === 0. Clicking
   a card instantly populates all four canvas
   zones with a realistic template layout.
   ═══════════════════════════════════════════ */

/* Pattern cards surface the four shipped templates. */
const PATTERN_CARDS: BuilderTemplate[] = TEMPLATE_ORDER.map((id) => BUILDER_TEMPLATES[id]);

/* ── DS quick-switch (subtle affordance in hero) ── */
const STYLE_CHIPS: { label: string; value: DesignSystem; color: string }[] = [
  { label: "Salt DS", value: "salt", color: "#1B7F9E" },
  { label: "Material 3", value: "m3", color: "#6750A4" },
  { label: "Fluent 2", value: "fluent", color: "#0F6CBD" },
  { label: "ausos DS", value: "ausos", color: "#7E6BC4" },
];

const REFINE_CHIPS = [
  /* Theme */
  "Dark Mode", "Light Mode",
  /* Add components */
  "Add Stat Cards", "Add Chart", "Add Data Table", "Add Buttons", "Add Cards",
  /* Patterns */
  "Build Dashboard", "Build Login Form", "Build Settings Page",
  /* Manage */
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
               "paragraph", "overline", "display text"],                           ids: ["sim-title"],                             label: "Heading" },
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
  SimulatedTitle: ["sim-title"],
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

const DS_LABEL: Record<DesignSystem, string> = {
  salt: "Salt DS",
  m3: "Material 3",
  fluent: "Fluent 2",
  ausos: "ausos DS",
};

function getFreeformResponse(input: string): string {
  const l = input.toLowerCase();
  if (l.includes("dark") || l.includes("light")) return "Theme updated! The preview reflects the new mode.";
  if (l.includes("salt")) return "Switched to Salt DS — teal accents and Open Sans typography.";
  if (l.includes("material") || l.includes("m3")) return "Switched to Material 3 — dynamic color and Roboto type scale.";
  if (l.includes("fluent")) return "Switched to Fluent 2 — Segoe UI and brand blue palette.";
  if (l.includes("ausos")) return "Switched to ausos DS — glassmorphism surfaces and muted violet accent.";
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
    designSystem, selectedComponents,
    previewOpen, setPreviewOpen,
    setDesignSystem, setMode, setInterfaceType, setSelectedComponents,
    setHeaderBlocks, setSidebarBlocks, setBlocks, setFooterBlocks,
    activeTemplateId, setActiveTemplateId,
    isRegeneratingContent, setIsRegeneratingContent,
    selectedBlockId, selectedBlockZone, setSelectedBlock,
    blocks: bodyBlocks, headerBlocks, sidebarBlocks, footerBlocks,
  } = useBuilder();

  /* Derive the selected-block metadata for the scope chip.
     Falls back to null when nothing is selected. */
  const selectedBlock = (() => {
    if (!selectedBlockId) return null;
    const zones = [...headerBlocks, ...sidebarBlocks, ...bodyBlocks, ...footerBlocks];
    return zones.find((b) => b.id === selectedBlockId) ?? null;
  })();

  /* Human-readable label for the scope chip. Picks the first meaningful
     prop that can act as a display identifier (label / text / title /
     placeholder) and falls back to the block type. */
  const selectedBlockLabel = (() => {
    if (!selectedBlock) return null;
    const p = selectedBlock.props as Record<string, unknown>;
    const candidates = ["label", "text", "title", "placeholder", "value"];
    for (const key of candidates) {
      const v = p[key];
      if (typeof v === "string" && v.trim()) {
        const friendly = selectedBlock.type
          .replace(/^Simulated/, "")
          .replace(/([A-Z])/g, " $1")
          .trim();
        return { friendly, detail: v.length > 28 ? v.slice(0, 26) + "…" : v };
      }
    }
    const friendly = selectedBlock.type
      .replace(/^Simulated/, "")
      .replace(/([A-Z])/g, " $1")
      .trim();
    return { friendly, detail: null as string | null };
  })();

  const { sendMessage: sendToAPI } = useChatAPI();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  const hasMessages = messages.length > 0;
  const hasText = inputText.trim().length > 0;
  const glowActive = focused || hasText;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ═══════════════════════════════════
     Pattern card click — apply a full
     realistic template in one step. All
     four canvas zones (header, sidebar,
     body, footer) are populated; existing
     canvas machinery renders them natively.
     ═══════════════════════════════════ */

  const handlePatternSelect = (tpl: BuilderTemplate) => {
    if (isGenerating) return;
    setInterfaceType(tpl.interfaceType);
    setSelectedComponents(tpl.selectedComponents);
    setHeaderBlocks(tpl.header);
    setSidebarBlocks(tpl.sidebar);
    setBlocks(tpl.body);
    setFooterBlocks(tpl.footer);
    setActiveTemplateId(tpl.id); // enables Regenerate Data chip
    if (!previewOpen) setPreviewOpen(true);
    addMessage("user", `Build me a ${tpl.label}`);
    addMessage("ai", tpl.aiResponse);
    bumpPreview();
  };

  /* ═══════════════════════════════════
     Regenerate Data — ask Claude for a
     fresh pass of realistic mock content
     for the currently-applied template.
     Visible via a refine chip once a
     template is active.
     ═══════════════════════════════════ */
  const handleRegenerateContent = async () => {
    if (!activeTemplateId || isRegeneratingContent) return;
    setIsRegeneratingContent(true);
    addMessage("user", "Regenerate data");
    addMessage("ai", "Generating fresh mock content…");
    try {
      const result = await regenerateTemplateContent(activeTemplateId);
      // Replace the placeholder "Generating…" message with the real outcome
      const msgs = useBuilder.getState().messages;
      const lastAi = msgs[msgs.length - 1];
      if (lastAi && lastAi.role === "ai" && lastAi.content === "Generating fresh mock content…") {
        const content = result.ok
          ? result.patched === 0
            ? "No changes — the current content looked fine to me. Ask me for specific tweaks."
            : `Refreshed ${result.patched} block${result.patched === 1 ? "" : "s"} with new mock content.`
          : `Couldn't regenerate: ${result.error ?? "unknown error"}.`;
        useBuilder.setState({
          messages: [...msgs.slice(0, -1), { ...lastAi, content }],
        });
      }
    } finally {
      setIsRegeneratingContent(false);
    }
  };

  /* ═══════════════════════════════════
     Login → Dashboard flow: triggered
     when the user types "show the
     dashboard" after applying the login
     template. Swaps body blocks to the
     post-login dashboard layout so the
     template honors its two-screen promise.
     ═══════════════════════════════════ */

  const tryAdvanceLoginFlow = (input: string): boolean => {
    const l = input.toLowerCase();
    if (!/\b(show|see|go to|next|show me|open)\b.*\bdashboard\b/i.test(l)) return false;
    // Only advance if the current body looks like the login template
    const { blocks } = useBuilder.getState();
    const isLoginScreen = blocks.some((b) => b.id.includes("lf-signin"));
    if (!isLoginScreen) return false;
    setBlocks(getLoginDashboardBody());
    // Update the header + sidebar to reflect a signed-in state
    setHeaderBlocks([
      { id: "tpl-lf2-brand", type: "AppBrand", props: { label: "Acme" } },
      { id: "tpl-lf2-status", type: "StatusPill", props: { label: "Signed in" } },
    ]);
    setSidebarBlocks([
      { id: "tpl-lf2-nav-1", type: "NavItem", props: { label: "Home", icon: "home", active: true } },
      { id: "tpl-lf2-nav-2", type: "NavItem", props: { label: "Tasks", icon: "database", active: false } },
      { id: "tpl-lf2-nav-3", type: "NavItem", props: { label: "Messages", icon: "chat", active: false } },
      { id: "tpl-lf2-nav-4", type: "NavItem", props: { label: "Analytics", icon: "bar_chart", active: false } },
      { id: "tpl-lf2-nav-5", type: "NavItem", props: { label: "Settings", icon: "settings", active: false } },
    ]);
    addMessage(
      "ai",
      "Swapped to the **post-login dashboard** — this is where users land after signing in. Say 'back to login' to return, or ask me to add specific widgets."
    );
    bumpPreview();
    return true;
  };

  const tryReturnToLogin = (input: string): boolean => {
    const l = input.toLowerCase();
    if (!/\b(back|return|go back|go to)\b.*\b(login|sign[- ]?in)\b/i.test(l)) return false;
    const tpl = BUILDER_TEMPLATES["login-flow"];
    setHeaderBlocks(tpl.header);
    setSidebarBlocks(tpl.sidebar);
    setBlocks(tpl.body);
    setFooterBlocks(tpl.footer);
    addMessage("ai", "Back to the login screen.");
    bumpPreview();
    return true;
  };

  /* ═══════════════════════════════════
     Free-form Send — always treated as "ready"
     (no wizard gating).
     ═══════════════════════════════════ */

  const handleSend = (text?: string) => {
    const msg = (text || inputText).trim();
    if (!msg || isGenerating) return;
    addMessage("user", msg);
    setGenerating(true);
    const l = msg.toLowerCase();

    /* ── Click-to-edit scope — if a block is selected, skip the local
       keyword routing (which could mistake "button" in "change this
       button's label" for a layout/add-component command) and send
       straight to Claude with the selected_block context attached by
       useChatAPI. ── */
    if (selectedBlockId) {
      if (!previewOpen) setPreviewOpen(true);
      setGenerating(false); // sendToAPI manages its own generating state
      sendToAPI(msg).then(() => bumpPreview());
      return;
    }

    /* ── Login → Dashboard flow transitions (template-aware) ── */
    if (tryAdvanceLoginFlow(msg) || tryReturnToLogin(msg)) {
      setGenerating(false);
      return;
    }

    /* ── Layout generation — highest priority ── */
    const layoutResult = processLayoutCommand(msg);
    if (layoutResult) {
      setSelectedComponents(layoutResult.ids);
      if (!previewOpen) setPreviewOpen(true);
      const blockList = layoutResult.blocks.join(", ");
      setTimeout(() => {
        addMessage(
          "ai",
          `Generated a ${layoutResult.layoutType} layout with ${layoutResult.blocks.length} component groups: ${blockList}. ` +
          `Using ${DS_LABEL[designSystem]} styling. Customize by saying 'add' or 'remove' any component.`
        );
        setGenerating(false);
        bumpPreview();
      }, 800 + Math.random() * 800);
      return;
    }

    const { response: compResponse, newComponents } = processComponentCommand(msg, selectedComponents);

    /* ── Theme changes ── */
    let themeChanged = false;
    if (l.includes("dark"))  { setMode("dark");  themeChanged = true; }
    else if (l.includes("light")) { setMode("light"); themeChanged = true; }

    /* ── Design system changes ── */
    let dsChanged = false;
    if (l.includes("salt"))                               { setDesignSystem("salt");   dsChanged = true; }
    else if (l.includes("material") || l.includes("m3")) { setDesignSystem("m3");     dsChanged = true; }
    else if (l.includes("fluent"))                         { setDesignSystem("fluent"); dsChanged = true; }
    else if (l.includes("ausos"))                          { setDesignSystem("ausos");  dsChanged = true; }

    /* ── Component command matched — apply and respond ── */
    if (newComponents !== null) {
      setSelectedComponents(newComponents);
      if (!previewOpen) setPreviewOpen(true);
      setTimeout(() => {
        addMessage("ai", compResponse);
        setGenerating(false);
        bumpPreview();
      }, 600 + Math.random() * 800);
      return;
    }

    /* ── Freeform refinement ── */
    if (!previewOpen) setPreviewOpen(true);

    // Local fast-path for theme/DS toggles
    if (themeChanged || dsChanged) {
      const aiResponse = themeChanged
        ? "Theme updated! The preview reflects the new mode."
        : getFreeformResponse(msg);
      setTimeout(() => {
        addMessage("ai", aiResponse);
        setGenerating(false);
        bumpPreview();
      }, 400);
      return;
    }

    // Route to Claude API for intelligent responses
    setGenerating(false); // sendToAPI manages its own generating state
    sendToAPI(msg).then(() => bumpPreview());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (hasText && !isGenerating) handleSend();
    } else if (e.key === "Escape" && selectedBlockId) {
      // Esc clears the click-to-edit scope without submitting anything
      setSelectedBlock(null, null);
    }
  };

  /* ═══════════════════════════════════
     Refinement chips — shown after first message
     ═══════════════════════════════════ */

  const renderRefineChips = () => (
    <div className="prompt-bubbles">
      {activeTemplateId && (
        <button
          className="prompt-bubble prompt-bubble-accent"
          onClick={handleRegenerateContent}
          disabled={isRegeneratingContent}
          title="Ask Claude for fresh mock data for this template"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 14, marginRight: 4, verticalAlign: "middle" }}
            aria-hidden="true"
          >
            {isRegeneratingContent ? "hourglass_empty" : "auto_awesome"}
          </span>
          {isRegeneratingContent ? "Regenerating…" : "Regenerate data"}
        </button>
      )}
      {REFINE_CHIPS.map((label) => (
        <button key={label} className="prompt-bubble" onClick={() => handleSend(label)}>
          {label}
        </button>
      ))}
    </div>
  );

  const placeholderText = selectedBlock
    ? `Edit this ${selectedBlockLabel?.friendly.toLowerCase() ?? "element"} — what should it say or do?`
    : hasMessages
      ? "Ask me anything — 'add a nav bar', 'switch to dark mode', 'try Fluent'..."
      : "Describe what you'd like to build, or pick a pattern above...";

  return (
    <div className={`chat-layout ${!hasMessages ? "chat-hero-state" : ""}`}>
      {/* Scrollable content area */}
      <div className="chat-scroll" role="log" aria-live="polite" aria-label="Chat messages">
        {/* Flex spacer — pushes content to bottom when messages are few */}
        <div className="chat-scroll-spacer" />

        {/* Hero — quick-start pattern cards, always available until first message */}
        {!hasMessages && (
          <div className="hero-greeting">
            <span className="hero-hi">Hi there,</span>
            <h1 className="hero-title">What are we building?</h1>
            <p className="hero-subtitle">Pick a pattern to start instantly, or describe what you need in the box below.</p>

            {/* Pattern cards */}
            <div className="pattern-cards-grid">
              {PATTERN_CARDS.map((pat) => (
                <button key={pat.label} className="pattern-card" onClick={() => handlePatternSelect(pat)}>
                  <span className="material-symbols-outlined pattern-card-icon" aria-hidden="true">{pat.icon}</span>
                  <span className="pattern-card-label">{pat.label}</span>
                  <span className="pattern-card-desc">{pat.desc}</span>
                </button>
              ))}
            </div>

            {/* DS quick-switch — subtle, so users know they can pick a system upfront */}
            <div className="hero-ds-row" role="group" aria-label="Choose a design system">
              <span className="hero-ds-label">Design system:</span>
              {STYLE_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  className={`hero-ds-chip ${designSystem === chip.value ? "active" : ""}`}
                  onClick={() => setDesignSystem(chip.value)}
                  aria-pressed={designSystem === chip.value}
                >
                  <span className="hero-ds-dot" style={{ background: chip.color }} aria-hidden="true" />
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {hasMessages && (
          <div className="messages-area">
            {messages.map((msg, i) => {
              const isLastAi = msg.role === "ai" && i === messages.length - 1;
              return (
                <div key={msg.id} className={`chat-msg chat-msg-${msg.role}`}>
                  {msg.content}
                  {msg.role === "ai" && (
                    <div className="chat-msg-actions">
                      <button aria-label="Good response"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>thumb_up</span></button>
                      <button aria-label="Bad response"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>thumb_down</span></button>
                      <button aria-label="Regenerate"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span></button>
                      <button aria-label="Copy"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_copy</span></button>
                    </div>
                  )}
                  {isLastAi && !isGenerating && renderRefineChips()}
                </div>
              );
            })}
            {isGenerating && (
              <div className="chat-msg chat-msg-ai generating-state">
                <div className="generating-header">
                  <div className="generating-avatar">AI</div>
                  <span className="generating-badge">Generating...</span>
                </div>
                <div className="generating-progress">
                  <div className="generating-bar" />
                </div>
                <span className="generating-text">Drafting layout and applying design tokens...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input — always pinned to bottom, active from message 1 */}
      <div className="chat-input-bar">
        {/* Scope chip — shown when a block is selected on the canvas, so
            the user has a visible confirmation that their next message
            will be scoped to that element. */}
        {selectedBlock && selectedBlockLabel && (
          <div className="chat-scope-chip" role="status" aria-live="polite">
            <span className="material-symbols-outlined chat-scope-icon" aria-hidden="true">
              edit
            </span>
            <span className="chat-scope-text">
              Editing <strong>{selectedBlockLabel.friendly}</strong>
              {selectedBlockLabel.detail && (
                <span className="chat-scope-detail"> · “{selectedBlockLabel.detail}”</span>
              )}
            </span>
            <button
              type="button"
              className="chat-scope-clear"
              onClick={() => setSelectedBlock(null, null)}
              aria-label="Clear selection"
              title="Clear selection (Esc)"
            >
              <span className="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </div>
        )}
        <div className="input-container">
          <div className={`input-glow ${glowActive ? "active" : ""}`} />
          <div className={`input-box ${focused ? "focused" : ""}`}>
            <textarea
              ref={inputRef}
              className="input-textarea"
              aria-label="Chat message input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={placeholderText}
              rows={1}
            />
            <div className="input-toolbar">
              <div className="toolbar-left">
                <button className="toolbar-icon-btn" aria-label="Add attachment">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
                </button>
              </div>
              <div className="toolbar-right">
                {hasText ? (
                  <button
                    className="send-btn"
                    onClick={() => handleSend()}
                    disabled={isGenerating}
                    aria-label="Send"
                  >
                    <span className="btn-icon material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                  </button>
                ) : (
                  <button
                    className={`mic-btn ${isVoiceActive ? "active" : ""}`}
                    onClick={toggleVoice}
                    aria-label="Toggle voice"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                      {isVoiceActive ? "stop" : "mic"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
