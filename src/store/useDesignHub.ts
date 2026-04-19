import { create } from 'zustand';

export type SystemId = 'salt' | 'm3' | 'fluent' | 'ausos' | 'carbon';
export type ActiveTab = 'preview' | 'code' | 'tokens' | 'charts' | 'audit';

interface DesignHubState {
  activeSystem: SystemId;
  salt: { themeKey: string; density: string };
  m3: { themeKey: string; density: number; customColor: string; isDarkCustom: boolean };
  fluent: { themeKey: string; size: string };
  ausos: { themeKey: string; density: string; accentColor: string };
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
  setAusosTheme: (key: string) => void;
  setAusosDensity: (d: string) => void;
  setAusosAccent: (c: string) => void;
  setCarbonTheme: (key: string) => void;
  setCarbonDensity: (d: string) => void;
  setSelectedComponent: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setActiveTab: (t: ActiveTab) => void;
  toggleSidebar: () => void;
}

export const useDesignHub = create<DesignHubState>((set) => ({
  activeSystem: 'salt',
  salt: { themeKey: 'jpm-light', density: 'medium' },
  m3: { themeKey: 'light', density: 0, customColor: '#6750A4', isDarkCustom: false },
  fluent: { themeKey: 'light', size: 'medium' },
  ausos: { themeKey: 'light', density: 'medium', accentColor: '#7E6BC4' },
  /* White is Carbon's canonical light theme; matches the docs-site default. */
  carbon: { themeKey: 'white', density: 'normal' },
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
  setAusosTheme: (key) => set((st) => ({ ausos: { ...st.ausos, themeKey: key } })),
  setAusosDensity: (d) => set((st) => ({ ausos: { ...st.ausos, density: d } })),
  setAusosAccent: (c) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(c)) return;
    set((st) => ({ ausos: { ...st.ausos, accentColor: c } }));
  },
  setCarbonTheme: (key) => set((st) => ({ carbon: { ...st.carbon, themeKey: key } })),
  setCarbonDensity: (d) => set((st) => ({ carbon: { ...st.carbon, density: d } })),
  setSelectedComponent: (id) => set({ selectedComponent: id, activeTab: 'preview' }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setActiveTab: (t) => set({ activeTab: t }),
  toggleSidebar: () => set((st) => ({ sidebarOpen: !st.sidebarOpen })),
}));
