import { create } from 'zustand';

export type DesignSystem = 'salt' | 'm3' | 'fluent' | 'ausos' | 'carbon';
export type InterfaceType = 'dashboard' | 'landing' | 'form' | 'ecommerce' | 'blog' | 'portfolio';
export type BuilderMode = 'light' | 'dark';
export type OnboardingStep = 'type' | 'style' | 'components' | 'ready';
export type DeviceMode = 'desktop' | 'tablet' | 'mobile';
export type ZoneId = 'body' | 'header' | 'sidebar' | 'footer';

/* ══════════════════════════════════════════════════════════
   Layout system (Figma-inspired flex primitives)
   ══════════════════════════════════════════════════════════
   Flexbox replaces the previous 3-column grid. Every block can
   carry its own sizing + alignment props, and containers (zones
   or nested LayoutGroup blocks) pick between Stack / Row / Grid
   flow modes.

   Width modes:
     "fill"            - flex: 1 (take remaining row space)
     "auto"            - flex: 0 0 auto; width follows content
     "{N}px"           - fixed pixel width
     "{N}%"            - percentage of container (flex-basis)
     "{N}fr"           - CSS Grid fraction (only valid inside
                         Grid-mode containers; Flex containers
                         treat fr as fill + grow fraction)

   colSpan is kept for backward compatibility. Old blocks with
   colSpan: 1|2|3 get translated to width: "33%"|"66%"|"100%"
   at render time. Templates are migrated in Phase 8.
   ══════════════════════════════════════════════════════════ */

/** String template used for width / minWidth / maxWidth props.
   `number` as a bare value is accepted too and treated as px. */
export type LayoutWidth =
  | 'fill'
  | 'auto'
  | `${number}px`
  | `${number}%`
  | `${number}fr`
  | number;

/** Main-axis alignment applied to an item inside its container. */
export type LayoutAlign = 'start' | 'center' | 'end' | 'stretch';

/** Container flow mode. Stack = vertical flex, Row = horizontal
   flex with wrap, Grid = CSS Grid with a column count. */
export type LayoutMode = 'stack' | 'row' | 'grid';

/** Optional per-block layout metadata. All fields are optional;
   absent values fall back to container defaults. */
export interface LayoutProps {
  /** Width mode. Defaults to "fill" inside Row containers and
     "fill" (stretched) inside Stack containers. */
  width?: LayoutWidth;
  /** Floor on computed width. Ignored for auto. */
  minWidth?: LayoutWidth;
  /** Cap on computed width. Ignored for auto. */
  maxWidth?: LayoutWidth;
  /** flex-grow override. 0 disables growing, 1 enables. */
  grow?: 0 | 1;
  /** align-self on the cross-axis. */
  align?: LayoutAlign;
  /** Margin helper - simplified to a single number (px) for now.
     Per-side margins deliberately omitted to keep the prop
     shape simple; users can add padding via LayoutGroup. */
  margin?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

export interface Block {
  id: string;
  type: string;
  props: Record<string, unknown>;
  /* Optional layout metadata. When absent, the container's
     default layout applies. LayoutGroup blocks have their own
     internal children via props.children. */
  layout?: LayoutProps;
  /* Nested children - only populated for LayoutGroup blocks.
     The renderer recurses into these blocks using the group's
     direction / gap / padding. Other block types ignore it. */
  children?: Block[];
}

/* Valid LayoutGroup direction values. Mirrors LayoutMode since
   a LayoutGroup is effectively a zone-in-a-block. */
export type LayoutGroupDirection = LayoutMode;

/* Per-zone layout configuration (separate from individual block
   layouts). Defaults stay backward-compatible: body defaults to
   "row" with wrap, header/footer to "row", sidebar to "stack". */
export interface ZoneLayout {
  mode: LayoutMode;
  /** Used only when mode === "grid" - column count (1–12). */
  columns?: number;
  /** Gap between items in px. Defaults via CSS. */
  gap?: number;
  /** Padding inside the zone in px. Optional. */
  padding?: number;
  /** For Row mode: whether items wrap to new lines. */
  wrap?: boolean;
  /** align-items on the cross-axis. */
  align?: LayoutAlign;
}

interface BuilderState {
  // Chat
  messages: ChatMessage[];
  inputText: string;
  isVoiceActive: boolean;
  isGenerating: boolean;

  // Design configuration
  designSystem: DesignSystem;
  mode: BuilderMode;
  density: string;
  themeKey: string;
  interfaceType: InterfaceType;
  selectedComponents: string[];

  // Color overrides
  colorOverrides: Record<string, string>;
  hasOverrides: boolean;

  // Onboarding state (persisted across remounts)
  onboardingStep: OnboardingStep;
  pendingComponents: string[];

  // Active template (set when a pattern card is applied; null for ad-hoc canvases)
  activeTemplateId: string | null;
  // Regenerate-content status - true while /api/builder/generate-content is pending
  isRegeneratingContent: boolean;

  // ── Conversational onboarding ("pending" flow) ──
  // When the user picks a template OR sends their first freeform message,
  // we DON'T apply anything yet - we stage it here and prompt the user to
  // pick a design system as the next chat turn. Once the DS is chosen, the
  // pending intent is flushed: either the template is applied with that DS,
  // or the freeform message is routed to Claude with that DS set.
  pendingTemplateId: string | null;
  pendingFirstMessage: string | null;

  // Templates drawer - slide-in gallery that shows the full SVG-wireframe
  // cards (relocated from the empty state for visual clarity).
  templatesDrawerOpen: boolean;

  // ── Session + auto-save ──
  // currentSessionId is null for a fresh canvas that hasn't yet been
  // saved. It's populated the moment the user takes a meaningful first
  // action (template pick or first message) via ensureSessionStarted().
  // Once set, the auto-save hook starts writing to Firebase on change.
  currentSessionId: string | null;
  sessionTitle: string | null;
  lastSavedAt: number | null;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  saveError: string | null;
  sessionsDrawerOpen: boolean;

  /* Backend health - populated by useBackendStatus() on Builder mount.
     `null` = not yet fetched (treat as "assume everything works" so we
     don't block the first paint). false = server reported the feature
     is unconfigured; client uses this to disable AI-gated UI. */
  backendStatus: {
    anthropicConfigured: boolean | null;
    firebaseConfigured: boolean | null;
  };

  // Canvas blocks & selection
  blocks: Block[];
  selectedBlockId: string | null;
  selectedBlockZone: ZoneId | null;
  componentLibraryOpen: boolean;
  addMenuOpen: boolean;
  canvasViewMode: 'ui' | 'code';

  // Zone blocks (header / sidebar / footer)
  headerBlocks: Block[];
  sidebarBlocks: Block[];
  footerBlocks: Block[];

  /* Per-zone layout configuration. Replaces the implicit
     "body = 3-col grid" rule with an explicit, editable contract
     per zone. Defaults keep visual parity with the old Builder. */
  zoneLayouts: Record<ZoneId, ZoneLayout>;

  // UI state
  settingsOpen: boolean;
  previewOpen: boolean;
  chatOpen: boolean;
  sidebarCollapsed: boolean;
  previewKey: number;
  deviceMode: DeviceMode;

  // Compare-DS mode - renders the current canvas in all four design systems
  // simultaneously (2x2 grid) so designers can compare visual output.
  compareMode: boolean;

  // Actions - Chat
  setInputText: (t: string) => void;
  addMessage: (role: 'user' | 'ai', content: string) => void;
  toggleVoice: () => void;
  setGenerating: (v: boolean) => void;
  clearChat: () => void;

  // Actions - Design
  setDesignSystem: (ds: DesignSystem) => void;
  setMode: (m: BuilderMode) => void;
  setDensity: (d: string) => void;
  setThemeKey: (k: string) => void;
  setInterfaceType: (t: InterfaceType) => void;
  toggleComponent: (id: string) => void;
  setSelectedComponents: (ids: string[]) => void;

  // Actions - Colors
  setColorOverride: (key: string, value: string) => void;
  resetColors: () => void;

  // Actions - Onboarding
  setOnboardingStep: (s: OnboardingStep) => void;
  setPendingComponents: (c: string[]) => void;
  togglePendingComponent: (label: string) => void;

  // Actions - Templates / regeneration
  setActiveTemplateId: (id: string | null) => void;
  setIsRegeneratingContent: (v: boolean) => void;

  // Actions - Pending (conversational onboarding)
  setPendingTemplateId: (id: string | null) => void;
  setPendingFirstMessage: (msg: string | null) => void;
  clearPendingIntent: () => void;

  // Actions - Templates drawer
  setTemplatesDrawerOpen: (v: boolean) => void;
  toggleTemplatesDrawer: () => void;

  /** Click-to-add from the component library. Inserts a new block of
   *  `type` at the end of the target zone. Resolution order:
   *    1. `preferZone` when supplied (library tile's source zone)
   *    2. zoneByType for types that only live in one zone (AppBrand, etc.)
   *    3. `selectedBlockZone` so repeated clicks stack near the user's focus
   *    4. "body" fallback
   *  The new block becomes the selected block so the properties
   *  inspector lights up with its fields. */
  addBlockFromLibrary: (
    type: string,
    defaults: Record<string, unknown>,
    preferZone?: ZoneId,
  ) => void;

  // Actions - Sessions + auto-save
  setCurrentSessionId: (id: string | null) => void;
  setSessionTitle: (t: string | null) => void;
  setLastSavedAt: (t: number | null) => void;
  setSaveState: (s: 'idle' | 'saving' | 'saved' | 'error') => void;
  setSaveError: (e: string | null) => void;
  setBackendStatus: (s: { anthropicConfigured: boolean; firebaseConfigured: boolean }) => void;
  setSessionsDrawerOpen: (v: boolean) => void;
  toggleSessionsDrawer: () => void;
  /** Create a session ID + derive a title if one isn't already active.
   *  `seed` is either the first user message or the picked template's
   *  label - used to auto-generate a readable session name. No-op if
   *  a session already exists. */
  ensureSessionStarted: (seed: string) => void;
  /** Tear down the current session and reset canvas state so the user
   *  can start a fresh build from the empty state. */
  startNewSession: () => void;

  // Actions - Canvas blocks & selection
  setBlocks: (blocks: Block[]) => void;
  updateBlockProps: (id: string, props: Record<string, unknown>) => void;
  setSelectedBlock: (id: string | null, zone: ZoneId | null) => void;
  toggleComponentLibrary: () => void;
  setComponentLibraryOpen: (v: boolean) => void;
  setAddMenuOpen: (v: boolean) => void;
  toggleCanvasViewMode: () => void;

  // Actions - Zone blocks
  setHeaderBlocks: (blocks: Block[]) => void;
  setSidebarBlocks: (blocks: Block[]) => void;
  setFooterBlocks: (blocks: Block[]) => void;
  updateHeaderBlockProps: (id: string, props: Record<string, unknown>) => void;
  updateSidebarBlockProps: (id: string, props: Record<string, unknown>) => void;
  updateFooterBlockProps: (id: string, props: Record<string, unknown>) => void;

  // Actions - Generic zone helpers
  setZoneBlocks: (zone: ZoneId, blocks: Block[]) => void;
  updateZoneBlockProps: (zone: ZoneId, blockId: string, props: Record<string, unknown>) => void;
  addBlockToZone: (zone: ZoneId, block: Block, index?: number) => void;
  removeBlockFromZone: (zone: ZoneId, blockId: string) => void;
  moveBlockBetweenZones: (fromZone: ZoneId, toZone: ZoneId, blockId: string, toIndex: number) => void;

  /* ── Group (LayoutGroup) mutations ──
     These operate on the nested `children` array of a LayoutGroup
     block and walk all four zones to locate the parent group. They
     are additive - existing zone mutations are unchanged. */
  /** Insert a block as a child of the specified LayoutGroup. When
     `index` is undefined the block is appended. */
  addBlockToGroup: (parentGroupId: string, block: Block, index?: number) => void;
  /** Remove a block from its parent LayoutGroup's children. */
  removeBlockFromGroup: (parentGroupId: string, blockId: string) => void;
  /** Move a block from a top-level zone into a LayoutGroup at
     `destIndex` within the group's children. The block is removed
     from the source zone (preserving its props/layout) before being
     inserted into the group. */
  moveBlockIntoGroup: (srcZone: ZoneId, blockId: string, groupId: string, destIndex: number) => void;
  /** Ungroup: remove the LayoutGroup block from `zone` and splice
     its children into the zone at the group's original index. Each
     child's existing layout / props are preserved as-is. */
  ungroupBlock: (zone: ZoneId, groupId: string) => void;
  /** Update props on a LayoutGroup's child block (no zone ID
     required - walks children to find it). Used by the inspector
     when a nested block is selected. */
  updateGroupChildProps: (parentGroupId: string, blockId: string, props: Record<string, unknown>) => void;

  // Actions - Layout
  /** Patch a specific block's layout props (width/min/max/grow/align/margin).
     Merges into existing layout - pass undefined in a field to clear it. */
  updateBlockLayout: (zone: ZoneId, blockId: string, patch: Partial<LayoutProps>) => void;
  /** Patch a zone's container layout (mode/columns/gap/padding/wrap/align).
     Used by the zone layout-mode picker. */
  setZoneLayout: (zone: ZoneId, patch: Partial<ZoneLayout>) => void;

  // Actions - UI
  toggleSettings: () => void;
  togglePreview: () => void;
  setPreviewOpen: (v: boolean) => void;
  toggleChat: () => void;
  setChatOpen: (v: boolean) => void;
  setDeviceMode: (d: DeviceMode) => void;
  toggleSidebar: () => void;
  bumpPreview: () => void;

  // Compare-DS
  toggleCompareMode: () => void;
  setCompareMode: (v: boolean) => void;
}

const uid = (() => {
  let msgId = 0;
  return () => `msg-${++msgId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
})();

const ZONE_KEYS: Record<ZoneId, 'blocks' | 'headerBlocks' | 'sidebarBlocks' | 'footerBlocks'> = {
  body: 'blocks',
  header: 'headerBlocks',
  sidebar: 'sidebarBlocks',
  footer: 'footerBlocks',
};

/* Zone ID order used when iterating every zone to find a nested
   LayoutGroup block (e.g. group mutations that don't know which
   zone the group lives in). */
const ZONE_IDS: ZoneId[] = ['body', 'header', 'sidebar', 'footer'];

/* ══════════════════════════════════════════════════════════
   Recursive block finder - walks through blocks[] and nested
   LayoutGroup.children[] looking for a block by ID. Returns
   the block itself, the array that contains it (so mutations
   know where to splice), and the parent LayoutGroup block
   when the match is nested, or null when it's top-level.
   ══════════════════════════════════════════════════════════ */
export interface BlockFindResult {
  block: Block;
  parentArray: Block[];
  parentBlock: Block | null;
  index: number;
}

export function findBlockById(
  blocks: Block[],
  id: string,
  parentBlock: Block | null = null,
): BlockFindResult | null {
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.id === id) return { block: b, parentArray: blocks, parentBlock, index: i };
    if (b.children && b.children.length > 0) {
      const nested = findBlockById(b.children, id, b);
      if (nested) return nested;
    }
  }
  return null;
}

export const useBuilder = create<BuilderState>((set) => ({
  // Chat - start empty so hero shows
  messages: [],
  inputText: '',
  isVoiceActive: false,
  isGenerating: false,

  // Design configuration
  designSystem: 'salt',
  mode: 'dark',
  density: 'medium',
  themeKey: 'jpm-dark',
  interfaceType: 'dashboard',
  selectedComponents: ['buttons', 'inputs', 'cards', 'tabs'],

  // Color overrides
  colorOverrides: {},
  hasOverrides: false,

  // Onboarding state - default 'ready' so free-form chat works from message 1.
  // Pattern cards still appear while messages.length === 0 for quick-start,
  // but users can also type directly without being forced through a wizard.
  onboardingStep: 'ready',
  pendingComponents: [],

  // Template / regeneration state
  activeTemplateId: null,
  isRegeneratingContent: false,

  // Conversational onboarding state
  pendingTemplateId: null,
  pendingFirstMessage: null,

  // Templates drawer
  templatesDrawerOpen: false,

  // Session + auto-save - starts unpopulated; populated on first action
  currentSessionId: null,
  sessionTitle: null,
  lastSavedAt: null,
  saveState: 'idle',
  saveError: null,
  sessionsDrawerOpen: false,

  /* Backend status defaults to unknown (null) so first-render UI
     doesn't flicker into a "disabled" state while the health probe
     is in flight. useBackendStatus() hydrates both fields on mount. */
  backendStatus: {
    anthropicConfigured: null,
    firebaseConfigured: null,
  },

  // Canvas blocks & selection
  blocks: [],
  selectedBlockId: null,
  selectedBlockZone: null,
  componentLibraryOpen: true,
  addMenuOpen: false,
  canvasViewMode: 'ui',

  // Zone blocks - default content matching the static dashboard layout
  headerBlocks: [
    { id: 'hdr-brand', type: 'AppBrand', props: { label: 'AI Agent' } },
    { id: 'hdr-status', type: 'StatusPill', props: { label: 'Active' } },
  ],
  sidebarBlocks: [
    { id: 'nav-0', type: 'NavItem', props: { label: 'Chat', icon: 'chat', active: true } },
    { id: 'nav-1', type: 'NavItem', props: { label: 'Data', icon: 'database', active: false } },
    { id: 'nav-2', type: 'NavItem', props: { label: 'Settings', icon: 'settings', active: false } },
    { id: 'nav-3', type: 'NavItem', props: { label: 'Analytics', icon: 'bar_chart', active: false } },
  ],
  footerBlocks: [
    { id: 'ftr-0', type: 'FooterText', props: { label: 'Powered by Design Hub', version: 'v1.0' } },
  ],

  /* Zone layout defaults - backward-compatible with the pre-flex
     Builder: body now uses Row+wrap (visually replaces the old
     3-column grid once block widths translate colSpan → percent),
     header/footer stay horizontal, sidebar stays vertical. Users
     can flip any of these via the zone layout-mode picker. */
  zoneLayouts: {
    body:    { mode: 'row',   gap: 12, wrap: true,  align: 'stretch' },
    header:  { mode: 'row',   gap: 8,  wrap: false, align: 'center' },
    sidebar: { mode: 'stack', gap: 2,                align: 'stretch' },
    footer:  { mode: 'row',   gap: 8,  wrap: false, align: 'center' },
  },

  // UI state
  settingsOpen: false,
  previewOpen: false,
  chatOpen: true,
  sidebarCollapsed: false,
  previewKey: 0,
  deviceMode: 'desktop',
  compareMode: false,

  // Actions
  setInputText: (t) => set({ inputText: t }),
  addMessage: (role, content) =>
    set((s) => ({
      messages: [...s.messages, { id: uid(), role, content, timestamp: Date.now() }],
      inputText: role === 'user' ? '' : s.inputText,
    })),
  toggleVoice: () => set((s) => ({ isVoiceActive: !s.isVoiceActive })),
  setGenerating: (v) => set({ isGenerating: v }),
  clearChat: () => set({
    messages: [],
    onboardingStep: 'ready',
    pendingComponents: [],
    activeTemplateId: null,
    pendingTemplateId: null,
    pendingFirstMessage: null,
  }),

  setDesignSystem: (ds) => {
    /* Default theme key per DS - Carbon defaults to "white" (its
       canonical light theme) since its other three themes (g10, g90,
       g100) are variants the user picks explicitly. */
    const themeMap: Record<DesignSystem, string> = {
      salt: 'jpm-light', m3: 'light', fluent: 'light', ausos: 'light', carbon: 'white',
    };
    set({ designSystem: ds, themeKey: themeMap[ds] });
  },
  setMode: (m) => set((s) => {
    const key = s.themeKey;
    if (s.designSystem === 'salt') {
      const base = key.replace(/-?(light|dark)$/, '');
      return { mode: m, themeKey: `${base}-${m}` };
    }
    if (s.designSystem === 'm3') {
      if (m === 'dark' && !key.startsWith('dark')) return { mode: m, themeKey: 'dark' };
      if (m === 'light' && key.startsWith('dark')) return { mode: m, themeKey: 'light' };
    }
    if (s.designSystem === 'carbon') {
      /* Carbon has 4 named themes (white/g10 light, g90/g100 dark).
         Light-mode default is white; dark-mode default is g100. If the
         user already has the other variant in that family, keep it. */
      if (m === 'light') {
        return { mode: m, themeKey: (key === 'g10') ? 'g10' : 'white' };
      }
      return { mode: m, themeKey: (key === 'g90') ? 'g90' : 'g100' };
    }
    return { mode: m, themeKey: m === 'dark' ? 'dark' : 'light' };
  }),
  setDensity: (d) => set({ density: d }),
  setThemeKey: (k) => set({ themeKey: k }),
  setInterfaceType: (t) => set({ interfaceType: t }),
  toggleComponent: (id) =>
    set((s) => ({
      selectedComponents: s.selectedComponents.includes(id)
        ? s.selectedComponents.filter((c) => c !== id)
        : [...s.selectedComponents, id],
    })),
  setSelectedComponents: (ids) => set({ selectedComponents: ids }),

  setColorOverride: (key, value) =>
    set((s) => ({ colorOverrides: { ...s.colorOverrides, [key]: value }, hasOverrides: true })),
  resetColors: () => set({ colorOverrides: {}, hasOverrides: false }),

  setOnboardingStep: (s) => set({ onboardingStep: s }),
  setPendingComponents: (c) => set({ pendingComponents: c }),
  togglePendingComponent: (label) =>
    set((s) => ({
      pendingComponents: s.pendingComponents.includes(label)
        ? s.pendingComponents.filter((c) => c !== label)
        : [...s.pendingComponents, label],
    })),

  setActiveTemplateId: (id) => set({ activeTemplateId: id }),
  setIsRegeneratingContent: (v) => set({ isRegeneratingContent: v }),

  setPendingTemplateId: (id) => set({ pendingTemplateId: id }),
  setPendingFirstMessage: (msg) => set({ pendingFirstMessage: msg }),
  clearPendingIntent: () => set({ pendingTemplateId: null, pendingFirstMessage: null }),

  setTemplatesDrawerOpen: (v) => set({ templatesDrawerOpen: v }),
  toggleTemplatesDrawer: () => set((s) => ({ templatesDrawerOpen: !s.templatesDrawerOpen })),

  addBlockFromLibrary: (type, defaults, preferZone) => {
    /* Resolve the target zone:
       1. `preferZone` - explicit hint from the caller (e.g. a library
          tile passes the zone heading it lives under, so a Body-group
          tile always lands in body even when the current
          selectedBlockZone points elsewhere).
       2. zoneByType for types that only make sense in one zone.
       3. `selectedBlockZone` so repeated clicks stack near the user's
          focus when no explicit hint is given.
       4. "body" as the workspace default. */
    const zoneByType: Record<string, ZoneId> = {
      AppBrand: 'header',
      StatusPill: 'header',
      NavItem: 'sidebar',
      FooterText: 'footer',
      /* Body-only primitive - a grouped column of blocks. */
      LayoutGroup: 'body',
    };
    const state = useBuilder.getState();
    const targetZone: ZoneId =
      zoneByType[type] ?? preferZone ?? state.selectedBlockZone ?? 'body';
    const key = ZONE_KEYS[targetZone];
    const id = `blk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const newBlock: Block = { id, type, props: { ...defaults } };
    const existing = state[key] as Block[];
    set({ [key]: [...existing, newBlock] } as Partial<BuilderState>);
    /* Select the newly-added block so the inspector jumps to it. */
    set({ selectedBlockId: id, selectedBlockZone: targetZone });
    /* Open the preview panel if it's closed so the user sees the block
       land. Cheap no-op when already open. */
    if (!state.previewOpen) set({ previewOpen: true });
    state.bumpPreview();
  },

  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  setSessionTitle: (t) => set({ sessionTitle: t }),
  setLastSavedAt: (t) => set({ lastSavedAt: t }),
  setSaveState: (s) => set({ saveState: s }),
  setSaveError: (e) => set({ saveError: e }),
  setBackendStatus: (s) => set({ backendStatus: s }),
  setSessionsDrawerOpen: (v) => set({ sessionsDrawerOpen: v }),
  toggleSessionsDrawer: () => set((s) => ({ sessionsDrawerOpen: !s.sessionsDrawerOpen })),

  ensureSessionStarted: (seed: string) => set((s) => {
    if (s.currentSessionId) return {}; // already started - no-op
    /* Client-side session id - uuid-lite. Firebase will confirm / issue
     *  a canonical id on first save; this lets us start saving against
     *  a stable local identifier immediately. */
    const rand = Math.random().toString(36).slice(2, 10);
    const id = `sess-${Date.now().toString(36)}-${rand}`;
    const trimmed = seed.trim();
    const title = trimmed.length > 48 ? trimmed.slice(0, 46).trimEnd() + "…" : trimmed || "Untitled session";
    return {
      currentSessionId: id,
      sessionTitle: title,
      lastSavedAt: null,
      saveState: 'idle' as const,
      saveError: null,
    };
  }),

  startNewSession: () => set({
    /* Reset canvas + conversation state, but KEEP user-level preferences
     *  like designSystem, density, mode - they're part of the user's
     *  workspace setup, not part of the session. */
    messages: [],
    blocks: [],
    headerBlocks: [],
    sidebarBlocks: [],
    footerBlocks: [],
    zoneLayouts: {
      body:    { mode: 'row',   gap: 12, wrap: true,  align: 'stretch' },
      header:  { mode: 'row',   gap: 8,  wrap: false, align: 'center' },
      sidebar: { mode: 'stack', gap: 2,                align: 'stretch' },
      footer:  { mode: 'row',   gap: 8,  wrap: false, align: 'center' },
    },
    selectedComponents: [],
    selectedBlockId: null,
    selectedBlockZone: null,
    activeTemplateId: null,
    pendingTemplateId: null,
    pendingFirstMessage: null,
    inputText: '',
    isGenerating: false,
    currentSessionId: null,
    sessionTitle: null,
    lastSavedAt: null,
    saveState: 'idle',
    saveError: null,
    sessionsDrawerOpen: false,
    templatesDrawerOpen: false,
    previewOpen: false,
    onboardingStep: 'ready',
  }),

  setBlocks: (blocks) => set({ blocks }),
  updateBlockProps: (id, props) =>
    set((s) => ({
      blocks: s.blocks.map((b) =>
        b.id === id ? { ...b, props: { ...b.props, ...props } } : b
      ),
    })),
  setSelectedBlock: (id, zone) => set({ selectedBlockId: id, selectedBlockZone: zone }),
  toggleComponentLibrary: () => set((s) => ({ componentLibraryOpen: !s.componentLibraryOpen })),
  setComponentLibraryOpen: (v) => set({ componentLibraryOpen: v }),
  setAddMenuOpen: (v) => set({ addMenuOpen: v }),
  toggleCanvasViewMode: () => set((s) => ({ canvasViewMode: s.canvasViewMode === 'ui' ? 'code' : 'ui' })),

  setHeaderBlocks: (blocks) => set({ headerBlocks: blocks }),
  setSidebarBlocks: (blocks) => set({ sidebarBlocks: blocks }),
  setFooterBlocks: (blocks) => set({ footerBlocks: blocks }),
  updateHeaderBlockProps: (id, props) =>
    set((s) => ({ headerBlocks: s.headerBlocks.map((b) => b.id === id ? { ...b, props: { ...b.props, ...props } } : b) })),
  updateSidebarBlockProps: (id, props) =>
    set((s) => ({ sidebarBlocks: s.sidebarBlocks.map((b) => b.id === id ? { ...b, props: { ...b.props, ...props } } : b) })),
  updateFooterBlockProps: (id, props) =>
    set((s) => ({ footerBlocks: s.footerBlocks.map((b) => b.id === id ? { ...b, props: { ...b.props, ...props } } : b) })),

  // Generic zone helpers
  setZoneBlocks: (zone, blocks) => {
    set({ [ZONE_KEYS[zone]]: blocks });
  },
  updateZoneBlockProps: (zone, blockId, props) => {
    const key = ZONE_KEYS[zone];
    set((s) => ({
      [key]: (s[key] as Block[]).map((b) => b.id === blockId ? { ...b, props: { ...b.props, ...props } } : b),
    }));
  },
  addBlockToZone: (zone, block, index) => {
    const key = ZONE_KEYS[zone];
    set((s) => {
      const arr = [...(s[key] as Block[])];
      if (index !== undefined && index >= 0) {
        arr.splice(index, 0, block);
      } else {
        arr.unshift(block);
      }
      return { [key]: arr };
    });
  },
  removeBlockFromZone: (zone, blockId) => {
    const key = ZONE_KEYS[zone];
    set((s) => ({ [key]: (s[key] as Block[]).filter((b) => b.id !== blockId) }));
  },
  moveBlockBetweenZones: (fromZone, toZone, blockId, toIndex) => {
    const fromKey = ZONE_KEYS[fromZone];
    const toKey = ZONE_KEYS[toZone];
    set((s) => {
      const fromArr = s[fromKey] as Block[];
      const block = fromArr.find((b) => b.id === blockId);
      if (!block) return {};
      const newFrom = fromArr.filter((b) => b.id !== blockId);
      const toArr = fromKey === toKey ? newFrom : [...(s[toKey] as Block[])];
      const clampedIndex = Math.min(toIndex, toArr.length);
      toArr.splice(clampedIndex, 0, block);
      return { [fromKey]: newFrom, [toKey]: toArr };
    });
  },

  /* ──────────────────────────────────────────────────────────
     Group mutations - operate on LayoutGroup.children
     ────────────────────────────────────────────────────────── */

  addBlockToGroup: (parentGroupId, block, index) => {
    /* Defense-in-depth: reject nested LayoutGroup at the store level.
       DnD gates (PreviewPanel handleDragEnd, ComponentRenderer renderer)
       already block this, but an AI action or future direct caller
       would bypass those. MVP supports one level deep only; enforcing
       here keeps the serialization caps (MAX_BLOCK_DEPTH=2 in
       shareState) from silently truncating on reload. */
    if (block.type === "LayoutGroup") {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[useBuilder] addBlockToGroup rejected: LayoutGroup blocks cannot be nested inside another group (MVP supports one level of nesting only).",
        );
      }
      return;
    }
    set((s) => {
      /* Walk every zone and replace the matching LayoutGroup block
         with a copy whose `children` array has the new block inserted
         at `index` (or appended when index is undefined). */
      const patches: Partial<BuilderState> = {};
      for (const zone of ZONE_IDS) {
        const key = ZONE_KEYS[zone];
        const arr = s[key] as Block[];
        const i = arr.findIndex((b) => b.id === parentGroupId);
        if (i === -1) continue;
        const group = arr[i];
        const kids = group.children ? [...group.children] : [];
        const at = index === undefined ? kids.length : Math.max(0, Math.min(index, kids.length));
        kids.splice(at, 0, block);
        const nextArr = [...arr];
        nextArr[i] = { ...group, children: kids };
        (patches as Record<string, unknown>)[key] = nextArr;
        break;
      }
      return patches;
    });
  },

  removeBlockFromGroup: (parentGroupId, blockId) => {
    set((s) => {
      const patches: Partial<BuilderState> = {};
      for (const zone of ZONE_IDS) {
        const key = ZONE_KEYS[zone];
        const arr = s[key] as Block[];
        const i = arr.findIndex((b) => b.id === parentGroupId);
        if (i === -1) continue;
        const group = arr[i];
        const kids = (group.children ?? []).filter((b) => b.id !== blockId);
        const nextArr = [...arr];
        nextArr[i] = { ...group, children: kids };
        (patches as Record<string, unknown>)[key] = nextArr;
        break;
      }
      return patches;
    });
  },

  moveBlockIntoGroup: (srcZone, blockId, groupId, destIndex) => {
    set((s) => {
      const srcKey = ZONE_KEYS[srcZone];
      const srcArr = s[srcKey] as Block[];
      const block = srcArr.find((b) => b.id === blockId);
      if (!block) return {};
      /* Same defense-in-depth guard as addBlockToGroup: never place a
         LayoutGroup inside another group. */
      if (block.type === "LayoutGroup") {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[useBuilder] moveBlockIntoGroup rejected: LayoutGroup blocks cannot be nested inside another group.",
          );
        }
        return {};
      }
      /* Drop source */
      const nextSrc = srcArr.filter((b) => b.id !== blockId);
      const patches: Partial<BuilderState> = { [srcKey]: nextSrc } as Partial<BuilderState>;
      /* Find the group in any zone (may be the same zone we just
         removed from; read from the patched array). */
      for (const zone of ZONE_IDS) {
        const key = ZONE_KEYS[zone];
        const arr = key === srcKey ? nextSrc : (s[key] as Block[]);
        const i = arr.findIndex((b) => b.id === groupId);
        if (i === -1) continue;
        const group = arr[i];
        const kids = group.children ? [...group.children] : [];
        const at = Math.max(0, Math.min(destIndex, kids.length));
        kids.splice(at, 0, block);
        const nextArr = [...arr];
        nextArr[i] = { ...group, children: kids };
        (patches as Record<string, unknown>)[key] = nextArr;
        break;
      }
      return patches;
    });
  },

  ungroupBlock: (zone, groupId) => {
    set((s) => {
      const key = ZONE_KEYS[zone];
      const arr = s[key] as Block[];
      const i = arr.findIndex((b) => b.id === groupId);
      if (i === -1) return {};
      const group = arr[i];
      const kids = group.children ?? [];
      /* Splice the children into the zone at the group's index
         (preserving their layout/props untouched). */
      const nextArr = [...arr.slice(0, i), ...kids, ...arr.slice(i + 1)];
      return { [key]: nextArr } as Partial<BuilderState>;
    });
  },

  updateGroupChildProps: (parentGroupId, blockId, props) => {
    set((s) => {
      const patches: Partial<BuilderState> = {};
      for (const zone of ZONE_IDS) {
        const key = ZONE_KEYS[zone];
        const arr = s[key] as Block[];
        const i = arr.findIndex((b) => b.id === parentGroupId);
        if (i === -1) continue;
        const group = arr[i];
        const kids = (group.children ?? []).map((b) =>
          b.id === blockId ? { ...b, props: { ...b.props, ...props } } : b,
        );
        const nextArr = [...arr];
        nextArr[i] = { ...group, children: kids };
        (patches as Record<string, unknown>)[key] = nextArr;
        break;
      }
      return patches;
    });
  },

  /* Patch a block's layout metadata. Creates the layout object on
     first write so old blocks without layout pick up new fields
     cleanly. Pass `undefined` for a field to clear it. */
  updateBlockLayout: (zone, blockId, patch) => {
    const key = ZONE_KEYS[zone];
    set((s) => ({
      [key]: (s[key] as Block[]).map((b) =>
        b.id === blockId
          ? { ...b, layout: { ...(b.layout ?? {}), ...patch } }
          : b,
      ),
    }));
  },
  /* Patch a zone's layout container config. Deep-merge over the
     current zone layout. */
  setZoneLayout: (zone, patch) => set((s) => ({
    zoneLayouts: {
      ...s.zoneLayouts,
      [zone]: { ...s.zoneLayouts[zone], ...patch },
    },
  })),

  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
  togglePreview: () => set((s) => ({ previewOpen: !s.previewOpen })),
  setPreviewOpen: (v) => set({ previewOpen: v }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  setChatOpen: (v) => set({ chatOpen: v }),
  setDeviceMode: (d) => set({ deviceMode: d }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  bumpPreview: () => set((s) => ({ previewKey: s.previewKey + 1 })),

  toggleCompareMode: () => set((s) => ({ compareMode: !s.compareMode })),
  setCompareMode: (v) => set({ compareMode: v }),
}));
