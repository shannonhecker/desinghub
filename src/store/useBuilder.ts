import { create } from 'zustand';

export type DesignSystem = 'salt' | 'm3' | 'fluent';
export type InterfaceType = 'dashboard' | 'landing' | 'form' | 'ecommerce' | 'blog' | 'portfolio';
export type BuilderMode = 'light' | 'dark';
export type OnboardingStep = 'type' | 'style' | 'components' | 'ready';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
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

  // UI state
  settingsOpen: boolean;
  previewOpen: boolean;
  sidebarCollapsed: boolean;
  mobilePreviewOpen: boolean;
  previewKey: number;

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

  // Actions — UI
  toggleSettings: () => void;
  togglePreview: () => void;
  setPreviewOpen: (v: boolean) => void;
  toggleSidebar: () => void;
  toggleMobilePreview: () => void;
  bumpPreview: () => void;
}

let msgId = 0;
const uid = () => `msg-${++msgId}-${Date.now()}`;

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
  themeKey: 'jpm-light',
  interfaceType: 'dashboard',
  selectedComponents: ['buttons', 'inputs', 'cards', 'tabs'],

  // Color overrides
  colorOverrides: {},
  hasOverrides: false,

  // Onboarding state
  onboardingStep: 'type',
  pendingComponents: [],

  // UI state
  settingsOpen: false,
  previewOpen: false,
  sidebarCollapsed: false,
  mobilePreviewOpen: false,
  previewKey: 0,

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
    const themeMap: Record<DesignSystem, string> = { salt: 'jpm-light', m3: 'light', fluent: 'light' };
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

  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
  togglePreview: () => set((s) => ({ previewOpen: !s.previewOpen })),
  setPreviewOpen: (v) => set({ previewOpen: v }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleMobilePreview: () => set((s) => ({ mobilePreviewOpen: !s.mobilePreviewOpen })),
  bumpPreview: () => set((s) => ({ previewKey: s.previewKey + 1 })),
}));
