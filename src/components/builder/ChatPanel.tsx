"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { useBuilder } from "@/store/useBuilder";
import type { DesignSystem, InterfaceType, BuilderMode } from "@/store/useBuilder";
import { buildAssumptionDims, audienceUnguessable } from "@/lib/assumptionDims";
import { useChatAPI } from "@/lib/useChatAPI";
import { BUILDER_TEMPLATES, TEMPLATE_ORDER, getLoginDashboardBody, type BuilderTemplate, type TemplateId } from "@/lib/builderTemplates";
import { regenerateTemplateContent } from "@/lib/regenerateTemplateContent";
import { titleFromMessage, titleFromTemplate } from "@/lib/sessionTitle";
import { TemplatePreview } from "./TemplatePreviews";
import { FadingWords } from "./FadingWords";
import { LifecyclePill, type LifecycleState } from "./LifecyclePill";
import { applyChatComponentDelta } from "@/lib/chatComponentDelta";
import { subscribeToolUse, type ToolUseEvent } from "@/lib/toolUseEvents";
import { ToolUseCard } from "./cards/ToolUseCard";
import ReactMarkdown from "react-markdown";

/* ── Markdown render config (Phase 2b G16) ────────────────────
   react-markdown handles sanitisation natively (no
   dangerouslySetInnerHTML), so we only restrict the rendered
   subset via component overrides.

   Allowed: bold, italic, inline code, code blocks, links.
   Links auto-get rel="noopener noreferrer" + target="_blank"
   so opened references can't reach back into the builder. */
const MD_COMPONENTS = {
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    <a {...props} rel="noopener noreferrer" target="_blank" />
  ),
};

/* Heuristic: skip ReactMarkdown when the content has no markdown
   markers - cheap path that avoids running the parser for every
   "Theme updated!" style local-pipeline reply. Catches **bold**,
   *italic*, `code`, ```fences```, and [links](...). */
function hasMarkdown(text: string): boolean {
  return /\*\*[^*]+\*\*|(?:^|[^*])\*[^*\n]+\*|`[^`]+`|```|\[[^\]]+\]\([^)]+\)/.test(
    text,
  );
}

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
const STYLE_CHIPS: { label: string; value: DesignSystem }[] = [
  { label: "Salt DS", value: "salt" },
  { label: "Material 3", value: "m3" },
  { label: "Fluent 2", value: "fluent" },
  { label: "uoaui DS", value: "uoaui" },
  { label: "Carbon DS", value: "carbon" },
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
): {
  response: string;
  newComponents: string[] | null;
  /* Explicit remove instructions — set when the user's message has
     remove intent. Drives canvas removal directly instead of relying
     on the (currentComponents → newComponents) delta, which misses
     blocks that aren't tracked in selectedComponents (e.g. dragged
     from the palette). */
  alsoRemoveIds?: string[];
  /* Wipe every body block — set by "clear all" style commands. */
  clearBody?: boolean;
  /* Wipe ALL zones (header, sidebar, body, footer) — "Clear all" means the
     whole canvas, not just the body content area. */
  clearAll?: boolean;
} {
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
    /* alsoRemoveIds = every known wizard ID NOT mentioned.
       applyChatComponentDelta maps these to block types and strips
       matches from the body zone — so this works even when blocks
       were dragged in rather than added through the wizard. */
    const allWizardIds = [...new Set(COMPONENT_KEYWORDS.flatMap((g) => g.ids))];
    const alsoRemoveIds = allWizardIds.filter((id) => !mentionedIds.includes(id));
    return {
      response: `Removed everything except ${mentionedLabels.join(", ")}. ${uniqueRemaining.length} group${uniqueRemaining.length === 1 ? "" : "s"} remaining.`,
      newComponents: newComps,
      alsoRemoveIds,
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
    return {
      response: "Cleared the whole canvas. Tell me what to add or select from the options.",
      newComponents: [],
      clearAll: true,
    };

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
      /* Drive canvas removal explicitly — the (currentComponents →
         newComps) delta is empty when the user hasn't populated
         selectedComponents (e.g. blocks dragged from the palette). */
      alsoRemoveIds: mentionedIds,
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
  uoaui: "uoaui DS",
  carbon: "Carbon DS",
};

/* Did the last AI turn actually BUILD something? Reuse the existing
   tool-use event stream (toolUseByMessage) rather than adding new store
   state - if the turn emitted any block/canvas/interface action, a build
   happened and the Assumption Row should offer to correct the inferred
   dims. (Template-applied builds are covered separately via the canvas
   content / activeTemplateId fallback in the render slot.) */
function lastTurnBuilt(events: ToolUseEvent[] | undefined): boolean {
  if (!events) return false;
  return events.some(
    (e) =>
      e.action === "addBlock" ||
      e.action === "setInterfaceType" ||
      e.action === "clearCanvas" ||
      e.action === "setZoneLayout",
  );
}

function getFreeformResponse(input: string): string {
  const l = input.toLowerCase();
  if (l.includes("dark") || l.includes("light")) return "Theme updated! The preview reflects the new mode.";
  if (l.includes("salt")) return "Switched to Salt DS - teal accents and Open Sans typography.";
  if (l.includes("material") || l.includes("m3")) return "Switched to Material 3 - dynamic color and Roboto type scale.";
  if (l.includes("fluent")) return "Switched to Fluent 2 - Segoe UI and brand blue palette.";
  if (l.includes("uoaui")) return "Switched to uoaui DS - glassmorphism surfaces and muted violet accent.";
  if (l.includes("color") || l.includes("accent")) return "I'll adjust the color palette for you.";
  if (l.includes("thank")) return "You're welcome! Let me know if you need anything else.";
  if (l.includes("help")) return "I can help! Try 'add buttons', 'remove cards', 'build a dashboard', 'dark mode', 'switch to Fluent', or 'what components do I have?'.";
  return "I didn't catch that. Try 'add buttons', 'remove cards', 'build a dashboard', or 'dark mode'.";
}

/* Memoised plain-text message - stable identity-keyed, so
   re-rendering the message list while a new assistant message
   streams in doesn't re-evaluate (or re-animate) historical
   messages. Pairs with the last-AI-message gate in the map
   below so only the actively-streaming message uses
   FadingWords; everything else flows through this. */
const MemoPlainMessage = React.memo(function MemoPlainMessage({
  text,
}: {
  text: string;
}) {
  return <span>{text}</span>;
});

/* Memoised FadingWords wrapper so its identity is stable per
   message id - the animation lifecycle isn't re-triggered by
   unrelated parent renders. */
const MemoFadingWords = React.memo(function MemoFadingWords({
  text,
}: {
  text: string;
}) {
  return <FadingWords text={text} />;
});

/* ═══════════════════════════════════════════
   ChatPanel Component
   ═══════════════════════════════════════════ */

export function ChatPanel() {
  const {
    messages, inputText, isGenerating,
    setInputText, addMessage, setGenerating, bumpPreview,
    designSystem, selectedComponents,
    /* Assumption Row reads these inferred dim VALUES from the store
       (the build set them); the row shows + one-tap-corrects each. */
    mode, density, interfaceType,
    previewOpen, setPreviewOpen,
    setDesignSystem, setMode, setDensity, setInterfaceType, setSelectedComponents,
    setHeaderBlocks, setSidebarBlocks, setBlocks, setFooterBlocks, setZoneLayout,
    activeTemplateId, setActiveTemplateId,
    isRegeneratingContent, setIsRegeneratingContent,
    selectedBlockId, selectedBlockZone, setSelectedBlock,
    blocks: bodyBlocks, headerBlocks, sidebarBlocks, footerBlocks,
    pendingTemplateId, setPendingTemplateId,
    pendingFirstMessage, setPendingFirstMessage,
    pendingAudience, setPendingAudience,
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

  /* Whether the conversational onboarding is waiting on a DS pick. */
  const awaitingDs = Boolean(pendingTemplateId || pendingFirstMessage);

  /* Whether a build has actually placed content on the canvas. The
     Assumption Row is a post-build affordance, so it only shows once
     some zone has blocks (or a template is active). */
  const hasCanvasContent =
    bodyBlocks.length > 0 ||
    headerBlocks.length > 0 ||
    sidebarBlocks.length > 0 ||
    footerBlocks.length > 0 ||
    Boolean(activeTemplateId);

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

  const { sendMessage: sendToAPI, abort: abortAPI } = useChatAPI();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);


  /* ── Lifecycle state for the status pill ──
     Derived from existing signals only:
       - isGenerating flips true when handleSend() commits
       - the last AI message's content starts as "..." and gets
         replaced with real text once the first SSE chunk lands
       - when isGenerating drops back to false we briefly show
         "done" before reverting to idle
       - error sentinel: if the placeholder was replaced with the
         "I'm having trouble connecting" / AI_OFF message,
         we surface that as error briefly */
  const [lifecycleState, setLifecycleState] = useState<LifecycleState>("idle");
  const prevGeneratingRef = useRef(isGenerating);
  const lastAiContent = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "ai") return messages[i].content;
    }
    return null;
  }, [messages]);

  useEffect(() => {
    if (isGenerating) {
      /* Streaming if the placeholder has been replaced with real
         tokens; otherwise still thinking. The placeholder string
         "..." is set inside useChatAPI before the first chunk. */
      if (lastAiContent && lastAiContent !== "..." && lastAiContent.length > 0) {
        setLifecycleState("streaming");
      } else {
        setLifecycleState("thinking");
      }
      prevGeneratingRef.current = true;
      return;
    }
    /* Just transitioned generating → idle. Show "done" briefly,
       then fade to idle. The 800ms matches the spec - long
       enough to read, short enough not to linger. */
    if (prevGeneratingRef.current) {
      prevGeneratingRef.current = false;
      /* Error sentinels emitted by useChatAPI - if the last AI
         message starts with one of these, surface as error. */
      const isError =
        typeof lastAiContent === "string" &&
        (lastAiContent.startsWith("I'm having trouble connecting") ||
          lastAiContent.startsWith("AI is off"));
      setLifecycleState(isError ? "error" : "done");
      const t = setTimeout(() => setLifecycleState("idle"), 800);
      return () => clearTimeout(t);
    }
  }, [isGenerating, lastAiContent]);

  /* ── Phase 3a (N4 Tool-Use Cards) ──
     Subscribe to `builder:tool-use` events emitted by applyAIActions.
     Group by messageId so each assistant message renders its own
     stack of cards inline. Per-tab in-memory only (no persistence)
     — refresh wipes the cards. PR (b) introduces per-action-type
     card variants; PR (a) here renders the base wrapper with a
     param dump and (for addBlock) a per-card undo. */
  const [toolUseByMessage, setToolUseByMessage] = useState<
    Record<string, ToolUseEvent[]>
  >({});

  useEffect(() => {
    const unsubscribe = subscribeToolUse((event) => {
      if (!event.messageId) return;
      setToolUseByMessage((prev) => {
        const existing = prev[event.messageId!] ?? [];
        /* Dedupe by (action + ts) so a re-emit (e.g. React StrictMode
           double-invoke under dev) doesn't double-render. */
        const exists = existing.some(
          (e) => e.action === event.action && e.ts === event.ts,
        );
        if (exists) return prev;
        return { ...prev, [event.messageId!]: [...existing, event] };
      });
    });
    return unsubscribe;
  }, []);

  /* Per-card undo wiring. For PR (a) we ship a working undo for
     `addBlock` only (the most common case): remove the block by id
     from the zone the action targeted. PR (b) variants extend to
     other action types (e.g. setDesignSystem → revert to the prior
     DS, captured from the snapshot). Returns undefined when the
     action has no inverse wired yet so the card just hides the
     button. */
  const removeBlockFromZone = useBuilder((s) => s.removeBlockFromZone);
  const handleToolUseUndo = (event: ToolUseEvent): (() => void) | undefined => {
    if (event.action === "addBlock" && event.blockId && event.zone) {
      const blockId = event.blockId;
      const zone = event.zone;
      return () => removeBlockFromZone(zone, blockId);
    }
    return undefined;
  };

  /* Map ToolUseAction → display title for the base wrapper. PR (b)
     replaces this with per-action card components. */
  const TOOL_USE_TITLE: Record<string, string> = {
    addBlock: "Add block",
    removeBlock: "Remove block",
    moveBlock: "Move block",
    updateBlockProps: "Update block props",
    updateBlockLayout: "Update block layout",
    setDesignSystem: "Switch design system",
    setMode: "Switch mode",
    setDensity: "Switch density",
    setComponents: "Set components",
    setInterfaceType: "Set interface type",
    setThemeKey: "Switch theme",
    setColorOverride: "Override color",
    clearCanvas: "Clear canvas",
    setZoneLayout: "Update zone layout",
  };
  const TOOL_USE_ICON: Record<string, string> = {
    addBlock: "add_box",
    removeBlock: "remove",
    moveBlock: "swap_horiz",
    updateBlockProps: "tune",
    updateBlockLayout: "view_quilt",
    setDesignSystem: "palette",
    setMode: "contrast",
    setDensity: "density_medium",
    setComponents: "widgets",
    setInterfaceType: "dashboard",
    setThemeKey: "format_color_fill",
    setColorOverride: "colorize",
    clearCanvas: "delete_sweep",
    setZoneLayout: "view_module",
  };

  function renderToolUseCards(messageId: string) {
    const events = toolUseByMessage[messageId];
    if (!events || events.length === 0) return null;
    return (
      <div className="tool-use-card-stack">
        {events.map((event, idx) => {
          const title = TOOL_USE_TITLE[event.action] ?? event.action;
          const icon = TOOL_USE_ICON[event.action] ?? "bolt";
          /* Short subtitle for the head: addBlock shows type + zone;
             other actions show a short value summary. PR (b) variants
             render typed param rows instead. */
          let subtitle: string | undefined;
          if (event.action === "addBlock") {
            const v = event.value as { type?: string } | null;
            subtitle = v?.type ? `${v.type} → ${event.zone ?? "body"}` : undefined;
          } else if (typeof event.value === "string") {
            subtitle = event.value;
          }
          const onUndo = handleToolUseUndo(event);
          return (
            <ToolUseCard
              key={`${event.action}-${event.ts}-${idx}`}
              icon={icon}
              title={title}
              subtitle={subtitle}
              staggerIndex={idx}
              onUndo={onUndo}
            >
              {/* PR (a) base: collapsed params show the raw JSON. PR
                  (b) variants slot typed param rows in here. */}
              <pre className="tool-use-card__params-pre">
                {JSON.stringify(event.value, null, 2)}
              </pre>
            </ToolUseCard>
          );
        })}
      </div>
    );
  }

  /* Handler for the stop button - aborts the in-flight fetch and
     drops back to idle. Mirrors the existing setGenerating(false)
     contract so the UI consistently reflects "not running". */
  const handleStop = () => {
    abortAPI();
    setGenerating(false);
  };

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
        /* Apply the template's body layout (e.g. dashboard's 12-col grid); reset
           to the default row layout otherwise so a prior grid doesn't leak. */
        setZoneLayout("body", tpl.zoneLayouts?.body ?? { mode: "row", gap: 12, wrap: true, align: "stretch" });
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
    setZoneLayout("body", tpl.zoneLayouts?.body ?? { mode: "row", gap: 12, wrap: true, align: "stretch" });
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

    /* P4 (build-first): when AI is available, the FIRST freeform message builds
       immediately rather than gating on a "which design system?" question or a
       theme/DS-keyword early-return — a design system is always active (via
       [Current state]). Offline we keep the wizard onboarding so the keyword
       fast-paths can still build without an API key. */
    const isFirstFreeform =
      messages.length === 0 && !selectedBlockId && !aiDisabled;

    /* ── First-turn onboarding (offline only): with no API key, stage this as
       pendingFirstMessage and ask about DS as the next turn so the keyword
       fast-paths can build a template. When AI IS available we skip this and
       fall through to the model (build-first). Skipping the short-circuit also
       matters when text was passed programmatically (applyPendingIntentWithDs)
       or a refine chip is clicked. ── */
    if (messages.length === 0 && !selectedBlockId) {
      if (aiDisabled) {
        setPendingFirstMessage(msg);
        setPendingTemplateId(null);
        addMessage("user", msg);
        addMessage(
          "ai",
          "Got it - which design system should I use for this?"
        );
        ensureSessionStarted(titleFromMessage(msg));
        return;
      }
      /* AI available: name the session, then fall through to the keyword
         fast-paths + model below so "type anything" builds in one turn. */
      ensureSessionStarted(titleFromMessage(msg));

      /* ── PRE-BUILD AUDIENCE GATE (single, confidence-gated) ──
         Build-first still wins for almost everything. We interrupt with
         AT MOST one question, and ONLY when the prompt is app/dashboard-
         like AND carries no audience signal (audienceUnguessable), since
         audience flips structure (dense internal tool vs spacious public
         page). The pick re-sends the staged message with the audience
         folded in. LIMIT: audience is message-only, not a persisted store
         dim, so it is not re-asserted on later turns (documented in
         assumptionDims.ts). We reuse the SAME ensureSessionStarted above —
         no second call — then return to wait for the one-tap chip. */
      if (audienceUnguessable(msg)) {
        setPendingAudience(msg);
        setPendingFirstMessage(null);
        setPendingTemplateId(null);
        addMessage("user", msg);
        addMessage(
          "ai",
          "Quick check so I build the right shape - who is this for?",
        );
        return;
      }
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
      if (aiDisabled) {
        addMessage("ai", "Editing the selected block needs AI. Try \"add buttons\", \"add a nav bar\", or \"build a dashboard\" — those work without an API key.");
        setGenerating(false);
        return;
      }
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

    const { response: compResponse, newComponents, alsoRemoveIds, clearBody, clearAll } =
      processComponentCommand(msg, selectedComponents);

    /* ── Theme changes ── */
    let themeChanged = false;
    if (l.includes("dark"))  { setMode("dark");  themeChanged = true; }
    else if (l.includes("light")) { setMode("light"); themeChanged = true; }

    /* ── Design system changes ── */
    let dsChanged = false;
    if (l.includes("salt"))                               { setDesignSystem("salt");   dsChanged = true; }
    else if (l.includes("material") || l.includes("m3")) { setDesignSystem("m3");     dsChanged = true; }
    else if (l.includes("fluent"))                         { setDesignSystem("fluent"); dsChanged = true; }
    else if (l.includes("uoaui"))                          { setDesignSystem("uoaui");  dsChanged = true; }

    /* ── Component command matched - apply and respond ── */
    if (newComponents !== null) {
      /* Write the delta to the canvas before updating the onboarding
         pick list. PreviewCanvas mirrors selectedComponents → blocks
         only on first mount, so without this the chat-add is
         invisible whenever the preview is already open. alsoRemoveIds
         and clearBody carry explicit remove intent for cases where
         selectedComponents doesn't reflect what's actually on canvas
         (dragged blocks, loaded sessions, etc.). */
      if (clearAll) {
        /* "Clear all" wipes the WHOLE canvas, not just the body. Reset every
           zone + the body layout + the active template. */
        setHeaderBlocks([]);
        setSidebarBlocks([]);
        setBlocks([]);
        setFooterBlocks([]);
        setZoneLayout("body", { mode: "row", gap: 12, wrap: true, align: "stretch" });
        setActiveTemplateId(null);
      } else {
        applyChatComponentDelta(selectedComponents, newComponents, { alsoRemoveIds, clearBody });
      }
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

    // Local fast-path for theme/DS toggles. On the first freeform message we
    // DON'T early-return here: a stray "dark"/"salt" keyword shouldn't swallow
    // the build — the mode/DS are already applied above, so let it reach the
    // model to build the actual UI (build-first).
    if ((themeChanged || dsChanged) && !isFirstFreeform) {
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

    // No local command matched — anything else needs AI.
    if (aiDisabled) {
      setTimeout(() => {
        addMessage("ai", "That one needs AI. Try phrases like \"add a nav bar\", \"add buttons\", or \"build a dashboard\" — those work without an API key.");
        setGenerating(false);
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
            data-ds={chip.value}
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
        >
          {label}
        </button>
      ))}
    </div>
  );

  /* ═══════════════════════════════════
     Assumption Row - post-build, one-tap
     correction of the dims the build
     inferred. Reads VALUES straight from
     the store (mode/density/interfaceType/
     designSystem). Each chip: apply the
     corrected dim via its store setter,
     then re-run generation through the
     unchanged handleSend pipeline so the
     [Current state] prefix carries the
     change to the model. One tap, reversible
     (tap again to cycle on / back).
     ═══════════════════════════════════ */
  const renderAssumptionRow = () => {
    const dims = buildAssumptionDims({ designSystem, interfaceType, mode, density });

    /* Apply the corrected value to the right store dim, then re-send the
       terse imperative. DS/mode/density also have local fast-paths in
       handleSend; interfaceType falls through to the model. */
    const correct = (dim: (typeof dims)[number]) => {
      switch (dim.key) {
        case "ds":
          setDesignSystem(dim.nextValue as DesignSystem);
          break;
        case "iface":
          setInterfaceType(dim.nextValue as InterfaceType);
          break;
        case "mode":
          setMode(dim.nextValue as BuilderMode);
          break;
        case "density":
          setDensity(dim.nextValue);
          break;
      }
      handleSend(dim.imperative);
    };

    return (
      <div
        className="prompt-bubbles assumption-row"
        role="group"
        aria-label="Inferred settings - tap a chip to change it and rebuild"
      >
        <span className="assumption-row-lead" aria-hidden="true">
          I assumed:
        </span>
        {dims.map((dim) => (
          <button
            key={dim.key}
            type="button"
            className="prompt-bubble prompt-bubble-assumption"
            onClick={() => correct(dim)}
            disabled={isGenerating}
            aria-label={dim.ariaLabel}
            title="Tap to change this and rebuild"
          >
            {dim.label}
            <span className="assumption-row-caret" aria-hidden="true">
              ›
            </span>
          </button>
        ))}
      </div>
    );
  };

  /* ═══════════════════════════════════
     Audience gate - the single confidence-
     gated pre-build question. Reuses the
     awaitingDs / pendingFirstMessage staging
     pattern: tap clears pendingAudience and
     re-sends the staged message with the
     resolved audience folded into the text.
     ═══════════════════════════════════ */
  const renderAudienceChips = () => (
    <div
      className="prompt-bubbles ds-reply-chips"
      role="group"
      aria-label="Who is this for?"
    >
      {[
        { value: "internal", label: "Internal tool", hint: "dense, data-first" },
        { value: "public", label: "Public-facing", hint: "spacious, marketing" },
      ].map((opt) => (
        <button
          key={opt.value}
          type="button"
          className="prompt-bubble prompt-bubble-ds"
          onClick={() => {
            const staged = pendingAudience;
            setPendingAudience(null);
            if (!staged) return;
            if (!previewOpen) setPreviewOpen(true);
            /* Fold the resolved audience into the message so the build
               honors it. audience is message-only (not a persisted dim). */
            handleSend(`${staged} (audience: ${opt.value}, ${opt.hint})`);
          }}
          title={`Build for an ${opt.label.toLowerCase()}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  const placeholderText = selectedBlock
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
              /* Render strategy combines Phase 2a memoization + Phase 2b markdown:
                 - Actively streaming last AI msg: MemoFadingWords (Phase 2a animation gate)
                 - Earlier AI msg with markdown markers: ReactMarkdown (Phase 2b)
                 - Earlier AI msg without markdown: MemoPlainMessage (Phase 2a memo)
                 - User msg: MemoPlainMessage (avoid markdown parse on user content)
                 LifecyclePill mounts below the last AI bubble only. */
              const shouldAnimate = isLastAi && isGenerating && msg.role === "ai";
              const useMarkdown =
                msg.role === "ai" &&
                !shouldAnimate &&
                hasMarkdown(msg.content);
              return (
                <div key={msg.id} className={`chat-msg chat-msg-${msg.role}`}>
                  {msg.role === "ai" ? (
                    shouldAnimate ? (
                      <MemoFadingWords text={msg.content} />
                    ) : useMarkdown ? (
                      <div className="chat-msg-md">
                        <ReactMarkdown components={MD_COMPONENTS}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <MemoPlainMessage text={msg.content} />
                    )
                  ) : (
                    <MemoPlainMessage text={msg.content} />
                  )}
                  {isLastAi && msg.role === "ai" && (
                    <LifecyclePill state={lifecycleState} />
                  )}
                  {/* Phase 3a (N4): Tool-Use Cards rendered inline
                      below the assistant message that produced them.
                      Cards persist for the lifetime of the panel
                      (in-memory only — refresh wipes them). */}
                  {msg.role === "ai" && renderToolUseCards(msg.id)}
                  {/* Per-AI-message action row (regenerate / thumbs / copy)
                     was wired to UI only; click handlers were placeholders.
                     Hidden until properly wired (issue #73). Silent no-ops
                     on user clicks erode trust — half-built UI is worse
                     than missing UI. */}
                  {/* Chip slot under the last AI bubble:
                        awaitingDs       -> DS gate (existing)
                        pendingAudience  -> single pre-build audience gate (new)
                        post-build       -> Assumption Row (correct inferred
                                            dims) + the usual refine chips
                        otherwise        -> refine chips only (e.g. a pure
                                            question that didn't build).
                      The Assumption Row shows only once a build has placed
                      content on the canvas (hasCanvasContent) AND this turn
                      actually built (lastTurnBuilt) or a template is active. */}
                  {isLastAi && !isGenerating && (
                    awaitingDs ? (
                      renderDsReplyChips()
                    ) : pendingAudience ? (
                      renderAudienceChips()
                    ) : (
                      <>
                        {hasCanvasContent &&
                        (lastTurnBuilt(toolUseByMessage[msg.id]) || activeTemplateId)
                          ? renderAssumptionRow()
                          : null}
                        {renderRefineChips()}
                      </>
                    )
                  )}
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
              <div className="toolbar-right">
                {isGenerating ? (
                  <button
                    className="stop-btn"
                    onClick={handleStop}
                    aria-label="Stop generating"
                    title="Stop generating"
                  >
                    <span className="stop-btn-glyph" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    className="send-btn"
                    onClick={() => handleSend()}
                    disabled={!hasText}
                    aria-label="Send"
                  >
                    <span className="btn-icon material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* Local-command hint — only surfaced when AI is disabled.
              Reveals the vocabulary that routes through processComponent-
              Command without an API key, so users don't have to guess
              what will work. Muted so it stays peripheral. */}
          {aiDisabled && (
            <div className="chat-input-hint" aria-hidden="true">
              Try:{" "}
              <code>add buttons</code>
              <span className="chat-input-hint-sep"> · </span>
              <code>add a nav bar</code>
              <span className="chat-input-hint-sep"> · </span>
              <code>build a dashboard</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
