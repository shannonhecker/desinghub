import { create } from 'zustand';

export type DesignSystem = 'salt' | 'm3' | 'fluent' | 'ausos';
export type InterfaceType = 'dashboard' | 'landing' | 'form' | 'ecommerce' | 'blog' | 'portfolio';
export type BuilderMode = 'light' | 'dark';
export type OnboardingStep = 'type' | 'style' | 'components' | 'ready';
export type DeviceMode = 'desktop' | 'tablet' | 'mobile';
export type ZoneId = 'body' | 'header' | 'sidebar' | 'footer';

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

  // UI state
  settingsOpen: boolean;
  previewOpen: boolean;
  chatOpen: boolean;
  sidebarCollapsed: boolean;
  previewKey: number;
  deviceMode: DeviceMode;

  // Actions — Chat
  setInputText: (t: string) => void;
  addMessage: (role: 'user' | 'ai', content: string) => void;
  toggleVoice: () => void;
  setGenerating: (v: boolean) => void;
  clearChat: () => void;

  // Actions — Design
  setDesignSystem: (ds: DesignSystem) => void;
  setMode: (m: BuilderMode) => void;
  setDensity: (d: string) => void;
  setThemeKey: (k: string) => void;
  setInterfaceType: (t: InterfaceType) => void;
  toggleComponent: (id: string) => void;
  setSelectedComponents: (ids: string[]) => void;

  // Actions — Colors
  setColorOverride: (key: string, value: string) => void;
  resetColors: () => void;

  // Actions — Onboarding
  setOnboardingStep: (s: OnboardingStep) => void;
  setPendingComponents: (c: string[]) => void;
  togglePendingComponent: (label: string) => void;

  // Actions — Canvas blocks & selection
  setBlocks: (blocks: Block[]) => void;
  updateBlockProps: (id: string, props: Record<string, unknown>) => void;
  setSelectedBlock: (id: string | null, zone: ZoneId | null) => void;
  toggleComponentLibrary: () => void;
  setComponentLibraryOpen: (v: boolean) => void;
  setAddMenuOpen: (v: boolean) => void;
  toggleCanvasViewMode: () => void;

  // Actions — Zone blocks
  setHeaderBlocks: (blocks: Block[]) => void;
  setSidebarBlocks: (blocks: Block[]) => void;
  setFooterBlocks: (blocks: Block[]) => void;
  updateHeaderBlockProps: (id: string, props: Record<string, unknown>) => void;
  updateSidebarBlockProps: (id: string, props: Record<string, unknown>) => void;
  updateFooterBlockProps: (id: string, props: Record<string, unknown>) => void;

  // Actions — Generic zone helpers
  setZoneBlocks: (zone: ZoneId, blocks: Block[]) => void;
  updateZoneBlockProps: (zone: ZoneId, blockId: string, props: Record<string, unknown>) => void;
  addBlockToZone: (zone: ZoneId, block: Block, index?: number) => void;
  removeBlockFromZone: (zone: ZoneId, blockId: string) => void;
  moveBlockBetweenZones: (fromZone: ZoneId, toZone: ZoneId, blockId: string, toIndex: number) => void;

  // Actions — UI
  toggleSettings: () => void;
  togglePreview: () => void;
  setPreviewOpen: (v: boolean) => void;
  toggleChat: () => void;
  setChatOpen: (v: boolean) => void;
  setDeviceMode: (d: DeviceMode) => void;
  toggleSidebar: () => void;
  bumpPreview: () => void;
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

export const useBuilder = create<BuilderState>((set) => ({
  // Chat — start empty so hero shows
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

  // Onboarding state
  onboardingStep: 'type',
  pendingComponents: [],

  // Canvas blocks & selection
  blocks: [],
  selectedBlockId: null,
  selectedBlockZone: null,
  componentLibraryOpen: true,
  addMenuOpen: false,
  canvasViewMode: 'ui',

  // Zone blocks — default content matching the static dashboard layout
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

  // UI state
  settingsOpen: false,
  previewOpen: false,
  chatOpen: true,
  sidebarCollapsed: false,
  previewKey: 0,
  deviceMode: 'desktop',

  // Actions
  setInputText: (t) => set({ inputText: t }),
  addMessage: (role, content) =>
    set((s) => ({
      messages: [...s.messages, { id: uid(), role, content, timestamp: Date.now() }],
      inputText: role === 'user' ? '' : s.inputText,
    })),
  toggleVoice: () => set((s) => ({ isVoiceActive: !s.isVoiceActive })),
  setGenerating: (v) => set({ isGenerating: v }),
  clearChat: () => set({ messages: [], onboardingStep: 'type', pendingComponents: [] }),

  setDesignSystem: (ds) => {
    const themeMap: Record<DesignSystem, string> = { salt: 'jpm-light', m3: 'light', fluent: 'light', ausos: 'dark' };
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

  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
  togglePreview: () => set((s) => ({ previewOpen: !s.previewOpen })),
  setPreviewOpen: (v) => set({ previewOpen: v }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  setChatOpen: (v) => set({ chatOpen: v }),
  setDeviceMode: (d) => set({ deviceMode: d }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  bumpPreview: () => set((s) => ({ previewKey: s.previewKey + 1 })),
}));
