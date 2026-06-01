import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type SystemId = 'salt' | 'm3' | 'fluent' | 'uoaui' | 'carbon';
/* Tabs shown on a component detail page. Carbon mirrors the
   carbondesignsystem.com 5-tab shape: Overview / Usage / Style /
   Code / Accessibility. Other DSes only use preview + code. */
export type ActiveTab =
  | 'preview' | 'code'
  | 'tokens' | 'charts' | 'audit'
  | 'usage' | 'style' | 'accessibility';

interface DesignHubState {
  activeSystem: SystemId;
  salt: { themeKey: string; density: string };
  m3: { themeKey: string; density: number; customColor: string; isDarkCustom: boolean };
  fluent: { themeKey: string; size: string };
  uoaui: { themeKey: string; density: string; accentColor: string };
  /* Carbon has 4 themes: white (default light), g10 (alt light), g90 (alt
     dark), g100 (default dark). Density ladder: compact / normal / spacious
     matching Carbon spacing-01..13 tokens. */
  carbon: { themeKey: string; density: string };
  selectedComponent: string | null;
  searchQuery: string;
  activeTab: ActiveTab;
  sidebarOpen: boolean;

  setActiveSystem: (s: SystemId) => void;
  setSaltTheme: (key: string) => void;
  setSaltDensity: (d: string) => void;
  setM3Theme: (key: string) => void;
  setM3Density: (d: number) => void;
  setM3CustomColor: (c: string) => void;
  setM3DarkCustom: (d: boolean) => void;
  setFluentTheme: (key: string) => void;
  setFluentSize: (s: string) => void;
  setUoauiTheme: (key: string) => void;
  setUoauiDensity: (d: string) => void;
  setUoauiAccent: (c: string) => void;
  setCarbonTheme: (key: string) => void;
  setCarbonDensity: (d: string) => void;
  setSelectedComponent: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setActiveTab: (t: ActiveTab) => void;
  toggleSidebar: () => void;
}

export const useDesignHub = create<DesignHubState>()(persist((set) => ({
  activeSystem: 'salt',
  /* Dark-default across all 5 DS — matches the uoaui.ai brand (dark-first
     hero + builder mode='dark' in useBuilder). Users can still switch to
     any light theme via the per-DS theme picker. */
  salt: { themeKey: 'jpm-dark', density: 'medium' },
  m3: { themeKey: 'dark', density: 0, customColor: '#6750A4', isDarkCustom: true },
  fluent: { themeKey: 'dark', size: 'medium' },
  uoaui: { themeKey: 'dark', density: 'medium', accentColor: '#8A58C9' },
  /* g100 is Carbon's canonical dark theme (pairs with g90, white, g10). */
  carbon: { themeKey: 'g100', density: 'normal' },
  selectedComponent: null,
  searchQuery: '',
  activeTab: 'preview',
  sidebarOpen: true,

  setActiveSystem: (s) => set({ activeSystem: s, selectedComponent: null, searchQuery: '', activeTab: 'preview' }),
  setSaltTheme: (key) => set((st) => ({ salt: { ...st.salt, themeKey: key } })),
  setSaltDensity: (d) => set((st) => ({ salt: { ...st.salt, density: d } })),
  setM3Theme: (key) => set((st) => ({ m3: { ...st.m3, themeKey: key } })),
  setM3Density: (d) => set((st) => ({ m3: { ...st.m3, density: d } })),
  setM3CustomColor: (c) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(c)) return;
    set((st) => ({ m3: { ...st.m3, customColor: c } }));
  },
  setM3DarkCustom: (d) => set((st) => ({ m3: { ...st.m3, isDarkCustom: d } })),
  setFluentTheme: (key) => set((st) => ({ fluent: { ...st.fluent, themeKey: key } })),
  setFluentSize: (s) => set((st) => ({ fluent: { ...st.fluent, size: s } })),
  setUoauiTheme: (key) => set((st) => ({ uoaui: { ...st.uoaui, themeKey: key } })),
  setUoauiDensity: (d) => set((st) => ({ uoaui: { ...st.uoaui, density: d } })),
  setUoauiAccent: (c) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(c)) return;
    set((st) => ({ uoaui: { ...st.uoaui, accentColor: c } }));
  },
  setCarbonTheme: (key) => set((st) => ({ carbon: { ...st.carbon, themeKey: key } })),
  setCarbonDensity: (d) => set((st) => ({ carbon: { ...st.carbon, density: d } })),
  setSelectedComponent: (id) => set({ selectedComponent: id, activeTab: 'preview' }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setActiveTab: (t) => set({ activeTab: t }),
  toggleSidebar: () => set((st) => ({ sidebarOpen: !st.sidebarOpen })),
}), {
  name: 'designhub.uikit.v1',
  storage: createJSONStorage(() => localStorage),
  /* Persist only the user's theme preferences. Ephemeral browsing
     state (selectedComponent, searchQuery, activeTab, sidebarOpen)
     starts fresh each session so users always land on a clean
     component list — surveys consistently show users prefer this
     over "where did I leave off". */
  partialize: (state) => ({
    activeSystem: state.activeSystem,
    salt: state.salt,
    m3: state.m3,
    fluent: state.fluent,
    uoaui: state.uoaui,
    carbon: state.carbon,
  }),
}));
