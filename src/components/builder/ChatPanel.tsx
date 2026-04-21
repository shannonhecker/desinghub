"use client";

import React, { useRef, useEffect, useState } from "react";
import { useBuilder } from "@/store/useBuilder";
import type { DesignSystem } from "@/store/useBuilder";
import { useChatAPI } from "@/lib/useChatAPI";
import { BUILDER_TEMPLATES, TEMPLATE_ORDER, getLoginDashboardBody, type BuilderTemplate, type TemplateId } from "@/lib/builderTemplates";
import { regenerateTemplateContent } from "@/lib/regenerateTemplateContent";
import { titleFromMessage, titleFromTemplate } from "@/lib/sessionTitle";
import { TemplatePreview } from "./TemplatePreviews";
import { FadingWords } from "./FadingWords";
import { applyChatComponentDelta } from "@/lib/chatComponentDelta";

/* ═══════════════════════════════════════════
   Chat-first Builder - no mandatory wizard.
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
  { label: "Carbon DS", value: "carbon", color: "#0f62fe" },
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
   Layout Presets - generate full page combos
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
    // Handle count phrases - cosmetic only
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
  carbon: "Carbon DS",
};

function getFreeformResponse(input: string): string {
  const l = input.toLowerCase();
  if (l.includes("dark") || l.includes("light")) return "Theme updated! The preview reflects the new mode.";
  if (l.includes("salt")) return "Switched to Salt DS - teal accents and Open Sans typography.";
  if (l.includes("material") || l.includes("m3")) return "Switched to Material 3 - dynamic color and Roboto type scale.";
  if (l.includes("fluent")) return "Switched to Fluent 2 - Segoe UI and brand blue palette.";
  if (l.includes("ausos")) return "Switched to ausos DS - glassmorphism surfaces and muted violet accent.";
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
    pendingTemplateId, setPendingTemplateId,
    pendingFirstMessage, setPendingFirstMessage,
    clearPendingIntent,
    setTemplatesDrawerOpen,
    ensureSessionStarted, setSessionTitle, currentSessionId,
  } = useBuilder();

  /* Backend feature flags from useBackendStatus (mounted in BuilderApp).
     `null` = probe still in flight - stay optimistic, don't disable
     anything yet. `false` = server confirmed the key is missing, so
     AI-gated UI (send button, Regenerate chip) should degrade calmly. */
  const anthropicConfigured = useBuilder((s) => s.backendStatus.anthropicConfigured);
  const aiDisabled = anthropicConfigured === false;
  /* Gate dev-centric messaging (mentions .env.local, ANTHROPIC_API_KEY)
     so it never reaches deployed builds. Next.js inlines NODE_ENV at
     build time, so this is a constant on the client. */
  const isDev = process.env.NODE_ENV === "development";

  /* Whether the conversational onboarding is waiting on a DS pick. */
  const awaitingDs = Boolean(pendingTemplateId || pendingFirstMessage);

  /* One-time dismissible "AI features off" banner, mirrors the
     SaveIndicator "Cloud save off" pattern. Hydrates from
     sessionStorage so navigating around the Builder doesn't re-show
     the banner on every render. */
  const [aiHintDismissed, setAiHintDismissed] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("design-hub:ai-off-dismissed") === "1") {
      setAiHintDismissed(true);
    }
  }, []);
  const dismissAiHint = () => {
    setAiHintDismissed(true);
    try { sessionStorage.setItem("design-hub:ai-off-dismissed", "1"); } catch { /* private-mode */ }
  };

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
     Pattern card click - stage the choice
     and ask about design system as the
     next conversational turn. We DON'T
     apply blocks yet; that happens when
     the user picks a DS chip below.
     ═══════════════════════════════════ */

  /** English "a/an" article that reads naturally for a label starting
   *  with a vowel sound (e.g. "an Analytics Dashboard" vs "a Settings
   *  Page"). Not exhaustive - catches the five vowel letters which
   *  covers every current template and is easy to reason about. */
  const articleFor = (label: string): string =>
    /^[aeiouAEIOU]/.test(label) ? "an" : "a";

  const handlePatternSelect = (tpl: BuilderTemplate) => {
    if (isGenerating) return;
    setPendingTemplateId(tpl.id);
    setPendingFirstMessage(null);
    const article = articleFor(tpl.label);
    addMessage("user", `Build me ${article} ${tpl.label}`);
    addMessage(
      "ai",
      `Great choice - ${article} ${tpl.label} with ${tpl.desc.toLowerCase()}. Which design system should I use?`
    );
    /* Start a session keyed to the template name so auto-save kicks in
       immediately. If a session already exists (e.g. user returned to
       the empty state and picked a different template), update its
       title to reflect the new focus. */
    if (!currentSessionId) {
      ensureSessionStarted(titleFromTemplate(tpl.label));
    } else {
      setSessionTitle(titleFromTemplate(tpl.label));
    }
  };

  /* Apply the currently-pending intent (template or freeform message) with
     the chosen design system. Fires when the user clicks a DS chip on the
     AI's follow-up prompt. */
  const applyPendingIntentWithDs = (ds: DesignSystem) => {
    setDesignSystem(ds);

    /* Case 1: a template was staged - apply its full zone payload now */
    if (pendingTemplateId) {
      const tpl = BUILDER_TEMPLATES[pendingTemplateId as TemplateId];
      if (tpl) {
        setInterfaceType(tpl.interfaceType);
        setSelectedComponents(tpl.selectedComponents);
        setHeaderBlocks(tpl.header);
        setSidebarBlocks(tpl.sidebar);
        setBlocks(tpl.body);
        setFooterBlocks(tpl.footer);
        setActiveTemplateId(tpl.id);
        if (!previewOpen) setPreviewOpen(true);
        addMessage("user", DS_LABEL[ds]);
        addMessage("ai", tpl.aiResponse);
        bumpPreview();
      }
      clearPendingIntent();
      return;
    }

    /* Case 2: a freeform first message was staged - route it to the same
       pipeline we use for any later message, now that a DS is set. */
    if (pendingFirstMessage) {
      const msg = pendingFirstMessage;
      clearPendingIntent();
      if (!previewOpen) setPreviewOpen(true);
      addMessage("user", DS_LABEL[ds]);
      /* Re-use the local command pipeline (layout, components, theme)
         and fall through to Claude for anything unmatched. */
      setTimeout(() => handleSend(msg), 50);
    }
  };

  /* ═══════════════════════════════════
     Regenerate Data - ask Claude for a
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
            ? "No changes - the current content looked fine to me. Ask me for specific tweaks."
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
      "Swapped to the **post-login dashboard** - this is where users land after signing in. Say 'back to login' to return, or ask me to add specific widgets."
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
     Free-form Send - always treated as "ready"
     (no wizard gating).
     ═══════════════════════════════════ */

  const handleSend = (text?: string) => {
    const msg = (text || inputText).trim();
    if (!msg || isGenerating) return;

    /* ── First-turn onboarding: if the user has no messages yet and
       nothing staged, stage this as pendingFirstMessage and ask about
       DS as the next conversational turn. Skipping this short-circuit
       is important when:
         - text was passed programmatically (from applyPendingIntentWithDs)
         - a refine chip is clicked after the first message
       We detect "first turn" as messages.length === 0. ── */
    if (messages.length === 0 && !selectedBlockId) {
      setPendingFirstMessage(msg);
      setPendingTemplateId(null);
      addMessage("user", msg);
      addMessage(
        "ai",
        "Got it - which design system should I use for this?"
      );
      /* Start a session named from the user's first intent so the
         sessions drawer has a recognizable entry immediately. */
      ensureSessionStarted(titleFromMessage(msg));
      return;
    }

    addMessage("user", msg);
    setGenerating(true);
    const l = msg.toLowerCase();

    /* ── Click-to-edit scope - if a block is selected, skip the local
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

    /* ── Layout generation - highest priority ── */
    const layoutResult = processLayoutCommand(msg);
    if (layoutResult) {
      /* Apply the delta to the canvas before updating the onboarding
         pick list so the body zone reflects the newly-generated
         layout whether or not the preview was already open. */
      applyChatComponentDelta(selectedComponents, layoutResult.ids);
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

    /* ── Component command matched - apply and respond ── */
    if (newComponents !== null) {
      /* Write the delta to the canvas before updating the onboarding
         pick list. PreviewCanvas mirrors selectedComponents → blocks
         only on first mount, so without this the chat-add is
         invisible whenever the preview is already open. */
      applyChatComponentDelta(selectedComponents, newComponents);
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
      /* Same gating as the send button: no-op when AI is off, so the
         user doesn't fire a request that will fail loudly. */
      if (hasText && !isGenerating && !aiDisabled) handleSend();
    } else if (e.key === "Escape" && selectedBlockId) {
      // Esc clears the click-to-edit scope without submitting anything
      setSelectedBlock(null, null);
    }
  };

  /* ═══════════════════════════════════
     Quick-reply DS chips - shown inside the
     AI's "Which design system?" prompt when
     awaiting a DS pick. Clicking one advances
     the pending intent (template or freeform
     first message) with that DS applied.
     ═══════════════════════════════════ */
  const renderDsReplyChips = () => (
    <div className="prompt-bubbles ds-reply-chips" role="group" aria-label="Choose a design system">
      {STYLE_CHIPS.map((chip) => (
        <button
          key={chip.value}
          className="prompt-bubble prompt-bubble-ds"
          onClick={() => applyPendingIntentWithDs(chip.value)}
          title={`Build this with ${chip.label}`}
        >
          <span
            className="prompt-bubble-ds-dot"
            style={{ background: chip.color }}
            aria-hidden="true"
          />
          {chip.label}
        </button>
      ))}
    </div>
  );

  /* ═══════════════════════════════════
     Refinement chips - shown after the
     canvas has been built (normal flow)
     ═══════════════════════════════════ */

  const renderRefineChips = () => (
    <div className="prompt-bubbles">
      {/* Regenerate chip is AI-gated - hide it entirely when ANTHROPIC_API_KEY
          is absent so users aren't offered a button that will fail. The rest
          of the refine chips stay since they route through handleSend, which
          also gates on aiDisabled below. */}
      {activeTemplateId && !aiDisabled && (
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
        <button
          key={label}
          className="prompt-bubble"
          onClick={() => handleSend(label)}
          disabled={aiDisabled}
          title={aiDisabled ? (isDev ? "AI is off - add ANTHROPIC_API_KEY to .env.local" : "Chat is unavailable") : undefined}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const placeholderText = aiDisabled
    ? (isDev
        ? "AI is off - templates + manual edits still work. Add ANTHROPIC_API_KEY to re-enable chat."
        : "Chat is unavailable")
    : selectedBlock
      ? `Edit this ${selectedBlockLabel?.friendly.toLowerCase() ?? "element"} - what should it say or do?`
      : awaitingDs
        ? "Pick a design system above, or type a different request…"
        : hasMessages
          ? "Ask me anything - 'add a nav bar', 'switch to dark mode', 'try Fluent'..."
          : "Describe the app you want to build…";

  /* Auto-focus the textarea on initial mount so users can type right
     away - matches v0 / Lovable / ChatGPT. Only fires once; subsequent
     focus is left to the user. */
  useEffect(() => {
    if (!hasMessages) inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`chat-layout ${!hasMessages ? "chat-hero-state" : ""}`}>
      {/* AI-off banner - shown once per session when /api/health reports
          ANTHROPIC_API_KEY is missing. Templates + manual component
          editing still work, so this is an informational hint rather
          than an error. Dismissable via the × button; sessionStorage
          keeps it hidden for the rest of the tab's lifetime.
          Gated on NODE_ENV === 'development' so the dev-centric copy
          (mentions .env.local, ANTHROPIC_API_KEY) never leaks onto
          deployed builds. On Vercel preview/production, aiDisabled
          still disables send/Enter — we just don't surface the
          configuration advice to end users. */}
      {aiDisabled && !aiHintDismissed && isDev && (
        <div className="chat-ai-off-banner" role="status" aria-live="polite">
          <span className="material-symbols-outlined" aria-hidden="true">cloud_off</span>
          <span className="chat-ai-off-text">
            <strong>AI features are off.</strong> Templates and manual edits still work.
            Add <code>ANTHROPIC_API_KEY</code> to <code>.env.local</code> and restart dev
            to enable chat + Regenerate data.
          </span>
          <button
            type="button"
            className="chat-ai-off-dismiss"
            onClick={dismissAiHint}
            aria-label="Dismiss"
            title="Dismiss"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>
      )}

      {/* Scrollable content area */}
      <div className="chat-scroll" role="log" aria-live="polite" aria-label="Chat messages">
        {/* Flex spacer - pushes content to bottom when messages are few */}
        <div className="chat-scroll-spacer" />

        {/* Hero - compact empty state.
            Input is the primary action (larger, centered below).
            Pattern cards are a tight secondary row (no SVG on card -
            those live in the Browse Templates drawer). No DS picker
            here; DS is asked conversationally after the first turn. */}
        {!hasMessages && (
          <div className="hero-greeting">
            <span className="hero-hi">Hi there,</span>
            <h1 className="hero-title">What are we building?</h1>
            <p className="hero-subtitle">
              Describe the app you want, or start from a pattern.
            </p>

            {/* Compact pattern cards - medium SVG thumbnail + icon/label/desc.
                Thumbnail is a shrunk-down version of the Phase C wireframes
                so users recognize the layout at a glance without the cards
                dominating the hero. */}
            <div className="pattern-cards-grid pattern-cards-compact">
              {PATTERN_CARDS.map((pat) => (
                <button
                  key={pat.label}
                  className="pattern-card pattern-card-compact pattern-card-thumb"
                  onClick={() => handlePatternSelect(pat)}
                  aria-label={`Start from the ${pat.label} template`}
                >
                  <TemplatePreview id={pat.id as TemplateId} />
                  <div className="pattern-card-compact-text">
                    <div className="pattern-card-compact-head">
                      <span className="material-symbols-outlined pattern-card-icon" aria-hidden="true">
                        {pat.icon}
                      </span>
                      <span className="pattern-card-label">{pat.label}</span>
                    </div>
                    <span className="pattern-card-desc">{pat.desc}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Browse templates link - opens the drawer with the full
                SVG-wireframe gallery relocated from the empty state. */}
            <button
              type="button"
              className="hero-browse-link"
              onClick={() => setTemplatesDrawerOpen(true)}
            >
              Browse templates with previews
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 14, marginLeft: 4 }}>
                arrow_forward
              </span>
            </button>
          </div>
        )}

        {/* Messages */}
        {hasMessages && (
          <div className="messages-area">
            {messages.map((msg, i) => {
              const isLastAi = msg.role === "ai" && i === messages.length - 1;
              return (
                <div key={msg.id} className={`chat-msg chat-msg-${msg.role}`}>
                  {msg.role === "ai" ? <FadingWords text={msg.content} /> : msg.content}
                  {msg.role === "ai" && (
                    <div className="chat-msg-actions">
                      <button aria-label="Good response"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>thumb_up</span></button>
                      <button aria-label="Bad response"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>thumb_down</span></button>
                      <button aria-label="Regenerate"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span></button>
                      <button aria-label="Copy"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_copy</span></button>
                    </div>
                  )}
                  {isLastAi && !isGenerating && (awaitingDs ? renderDsReplyChips() : renderRefineChips())}
                </div>
              );
            })}
            {isGenerating && (
              <div className="chat-msg chat-msg-ai generating-state" aria-live="polite" aria-label="AI is generating">
                {/* Gemini-style shimmer pill (P2.1) - animated gradient
                    halo replaces the old linear progress bar. The dot
                    breathes on its own rhythm, text gets a slow swept
                    highlight pass so the state feels alive without
                    being loud. */}
                <div className="generating-shimmer">
                  <span className="generating-shimmer-dot" aria-hidden="true" />
                  <span className="generating-shimmer-text">Thinking…</span>
                </div>
                <span className="generating-text">Drafting layout and applying design tokens…</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input - always pinned to bottom, active from message 1 */}
      <div className="chat-input-bar">
        {/* Scope chip - shown when a block is selected on the canvas, so
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
                    disabled={isGenerating || aiDisabled}
                    aria-label={aiDisabled ? "Chat is unavailable" : "Send"}
                    title={aiDisabled ? (isDev ? "AI is off - add ANTHROPIC_API_KEY to .env.local" : "Chat is unavailable") : undefined}
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
