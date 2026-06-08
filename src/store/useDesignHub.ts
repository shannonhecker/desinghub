import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type SystemId = 'salt' | 'm3' | 'fluent' | 'uoaui' | 'carbon';

/* Abstract carry-over preferences that PERSIST across a DS switch.
   Each DS encodes mode + density in its own scale (Salt embeds mode in
   themeKey, Carbon uses theme shade, Fluent uses size-variants, etc.).
   These two normalized fields capture the user's INTENT once, then
   setActiveSystem maps them into the target DS's own scale so switching
   systems never resets the user's chosen mode/density to a DS default. */
export type GlobalMode = 'light' | 'dark';
/* 0 = most compact .. 3 = most spacious (normalized 4-level scale,
   matching Salt/uoaui High/Medium/Low/Touch). 3-level DSes fold the
   ends; M3's numeric scale inverts (0=Default spacious .. -3=Dense). */
export type GlobalDensity = 0 | 1 | 2 | 3;
/* Tabs shown on a component detail page. Carbon mirrors the
   carbondesignsystem.com 5-tab shape: Overview / Usage / Style /
   Code / Accessibility. Other DSes only use preview + code. */
export type ActiveTab =
  | 'preview' | 'code'
  | 'tokens' | 'charts' | 'audit'
  | 'usage' | 'style' | 'accessibility'
  /* M3 rich component-page tabs (accessibility shared above). */
  | 'overview' | 'specs' | 'guidelines';

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
  /* Carried across every DS switch + persisted across reload. */
  globalMode: GlobalMode;
  globalDensity: GlobalDensity;
  /* False until the user EXPLICITLY changes density in any DS. While false,
     setActiveSystem leaves the target DS at its own default density so a
     user who never touches density isn't force-folded (e.g. M3 Default ->
     Compact, Carbon Normal -> Compact) just by clicking through the
     switcher. Flips true in every density setter. */
  densityTouched: boolean;
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

/* ── Mode mapping: apply the abstract light/dark intent INTO each DS's
   own theme encoding (preserving the DS's other theme dimensions). ── */
const applyModeToSalt = (themeKey: string, mode: GlobalMode): string => {
  const fam = themeKey.includes('legacy') ? 'legacy' : 'jpm';
  return `${fam}-${mode}`;
};
/* Carbon: white/g10 are light, g90/g100 are dark. Keep the current shade
   if already on the correct side; otherwise snap to the canonical shade
   (white for light, g100 for dark). Lossy by design — the spec asks for
   "map, don't reset", and Carbon collapses to one light/dark bit here. */
const applyModeToCarbon = (themeKey: string, mode: GlobalMode): string => {
  const isDark = themeKey === 'g90' || themeKey === 'g100';
  if (mode === 'dark') return isDark ? themeKey : 'g100';
  return isDark ? 'white' : themeKey; // already a light shade (white/g10) — keep it
};
/* M3: preserve the contrast TIER (normal / medium / high) and only flip
   light<->dark. 'custom' is handled separately via isDarkCustom. */
const applyModeToM3 = (themeKey: string, mode: GlobalMode): string => {
  if (themeKey === 'custom') return 'custom';
  if (themeKey.includes('HighContrast')) return mode === 'dark' ? 'darkHighContrast' : 'lightHighContrast';
  if (themeKey.includes('MediumContrast')) return mode === 'dark' ? 'darkMediumContrast' : 'lightMediumContrast';
  return mode === 'dark' ? 'dark' : 'light';
};

/* ── Inverse: read the abstract mode FROM a DS theme key, so changing
   mode in ANY DS updates the carry-over (latest user choice wins). ── */
const saltModeOf = (k: string): GlobalMode => (k.includes('dark') ? 'dark' : 'light');
const m3ModeOf = (k: string, isDarkCustom: boolean): GlobalMode =>
  k === 'custom' ? (isDarkCustom ? 'dark' : 'light') : (k.startsWith('dark') ? 'dark' : 'light');
const carbonModeOf = (k: string): GlobalMode => (k === 'g90' || k === 'g100' ? 'dark' : 'light');

/* ── Density mapping: abstract level 0..3 INTO each DS's own scale. ── */
const SALT_DENSITY_BY_LEVEL = ['high', 'medium', 'low', 'touch'] as const;     // 0..3
const UOAUI_DENSITY_BY_LEVEL = SALT_DENSITY_BY_LEVEL;                          // shares Salt scale
const M3_DENSITY_BY_LEVEL = [-3, -2, -1, 0] as const;                          // 0(Dense/compact)..3(Default/spacious)
const FLUENT_SIZE_BY_LEVEL = ['small', 'small', 'medium', 'large'] as const;   // 3-level: fold level 0+1 into small
const CARBON_DENSITY_BY_LEVEL = ['compact', 'compact', 'normal', 'spacious'] as const; // 3-level: fold level 0+1 into compact

/* ── Inverse: read the abstract level FROM a DS density value. ── */
const saltLevelOf = (d: string): GlobalDensity =>
  (Math.max(0, SALT_DENSITY_BY_LEVEL.indexOf(d as typeof SALT_DENSITY_BY_LEVEL[number])) as GlobalDensity);
const m3LevelOf = (d: number): GlobalDensity =>
  (Math.max(0, M3_DENSITY_BY_LEVEL.indexOf(d as typeof M3_DENSITY_BY_LEVEL[number])) as GlobalDensity);
const fluentLevelOf = (s: string): GlobalDensity => (s === 'small' ? 1 : s === 'large' ? 3 : 2);
const carbonLevelOf = (d: string): GlobalDensity => (d === 'compact' ? 1 : d === 'spacious' ? 3 : 2);

/* ── 3-level fold-aware inverse (P1-b): the most-compact 3-level value
   ('small' / 'compact') covers BOTH abstract levels 0 and 1. When a user
   picks it, do NOT clobber an already-more-compact abstract level — keep
   globalDensity as the single source of truth. If the current globalDensity
   already falls inside the picked value's fold-range, leave it untouched;
   otherwise snap to that value's canonical (least-compact) level. ── */
const foldedLevel = (
  picked: GlobalDensity,
  current: GlobalDensity,
  range: readonly GlobalDensity[],
): GlobalDensity => (range.includes(current) ? current : picked);
const FLUENT_SMALL_RANGE = [0, 1] as const;   // 'small' folds levels 0 + 1
const CARBON_COMPACT_RANGE = [0, 1] as const; // 'compact' folds levels 0 + 1
const fluentLevelFold = (s: string, current: GlobalDensity): GlobalDensity =>
  s === 'small' ? foldedLevel(1, current, FLUENT_SMALL_RANGE) : fluentLevelOf(s);
const carbonLevelFold = (d: string, current: GlobalDensity): GlobalDensity =>
  d === 'compact' ? foldedLevel(1, current, CARBON_COMPACT_RANGE) : carbonLevelOf(d);

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
  /* Carry-over defaults match the dark/medium per-DS defaults above so a
     first load is consistent; updated whenever the user changes mode or
     density in any DS, and mapped into the target DS on every switch. */
  globalMode: 'dark',
  globalDensity: 1, // level 1 == Salt/uoaui 'medium'
  densityTouched: false, // no explicit density choice yet — don't fold target DS defaults
  selectedComponent: null,
  searchQuery: '',
  activeTab: 'preview',
  /* Collapsed by default (owner): the icon-rail is the always-visible primary
     nav; the secondary panel opens on demand (rail section button / hamburger).
     Ephemeral — not persisted, so every session lands rail-only. */
  sidebarOpen: false,

  /* Switch DS while PRESERVING the user's chosen mode + density: map the
     carried globalMode/globalDensity into the target DS's own scale so the
     intent survives the switch (instead of snapping to that DS default). */
  setActiveSystem: (s) => set((st) => {
    const m = st.globalMode;
    const lvl = st.globalDensity;
    /* Only carry density into the target DS once the user has EXPLICITLY
       chosen a density somewhere (P1-a). Until then, leave each DS at its
       own default density rather than force-folding the seed level into it.
       NOTE: setActiveSystem only READS globalDensity to map it into the
       target slice — it never WRITES globalDensity back, so the abstract
       level stays the single source of truth across round-trips (P1-b). */
    const carryDensity = st.densityTouched;
    const next: Partial<DesignHubState> = {
      activeSystem: s, selectedComponent: null, searchQuery: '', activeTab: 'preview',
    };
    if (s === 'salt')   next.salt   = { ...st.salt,   themeKey: applyModeToSalt(st.salt.themeKey, m), ...(carryDensity && { density: SALT_DENSITY_BY_LEVEL[lvl] }) };
    if (s === 'uoaui')  next.uoaui  = { ...st.uoaui,  themeKey: m,                                    ...(carryDensity && { density: UOAUI_DENSITY_BY_LEVEL[lvl] }) };
    if (s === 'fluent') next.fluent = { ...st.fluent, themeKey: m,                                    ...(carryDensity && { size: FLUENT_SIZE_BY_LEVEL[lvl] }) };
    /* P2: a 'custom' M3 theme owns its own light/dark via isDarkCustom —
       don't flip a user's custom-LIGHT theme to dark on switch. Only map
       light/dark into isDarkCustom for the NON-custom (preset) themes. */
    if (s === 'm3')     next.m3     = { ...st.m3,     themeKey: applyModeToM3(st.m3.themeKey, m), ...(st.m3.themeKey !== 'custom' && { isDarkCustom: m === 'dark' }), ...(carryDensity && { density: M3_DENSITY_BY_LEVEL[lvl] }) };
    if (s === 'carbon') next.carbon = { ...st.carbon, themeKey: applyModeToCarbon(st.carbon.themeKey, m), ...(carryDensity && { density: CARBON_DENSITY_BY_LEVEL[lvl] }) };
    return next;
  }),
  /* Mode/density setters ALSO update the carry-over so the latest user
     choice in any DS wins on the next switch. Palette/accent-only setters
     leave the carry-over untouched (they don't change mode or density). */
  setSaltTheme: (key) => set((st) => ({ salt: { ...st.salt, themeKey: key }, globalMode: saltModeOf(key) })),
  setSaltDensity: (d) => set((st) => ({ salt: { ...st.salt, density: d }, globalDensity: saltLevelOf(d), densityTouched: true })),
  setM3Theme: (key) => set((st) => ({ m3: { ...st.m3, themeKey: key }, globalMode: m3ModeOf(key, st.m3.isDarkCustom) })),
  setM3Density: (d) => set((st) => ({ m3: { ...st.m3, density: d }, globalDensity: m3LevelOf(d), densityTouched: true })),
  setM3CustomColor: (c) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(c)) return;
    set((st) => ({ m3: { ...st.m3, customColor: c } }));
  },
  setM3DarkCustom: (d) => set((st) => ({ m3: { ...st.m3, isDarkCustom: d }, globalMode: d ? 'dark' : 'light' })),
  setFluentTheme: (key) => set((st) => ({ fluent: { ...st.fluent, themeKey: key }, globalMode: key === 'dark' ? 'dark' : 'light' })),
  /* Fold-aware (P1-b): picking 'small' won't clobber an already-more-compact
     abstract level — globalDensity stays the single source of truth. */
  setFluentSize: (s) => set((st) => ({ fluent: { ...st.fluent, size: s }, globalDensity: fluentLevelFold(s, st.globalDensity), densityTouched: true })),
  setUoauiTheme: (key) => set((st) => ({ uoaui: { ...st.uoaui, themeKey: key }, globalMode: key === 'dark' ? 'dark' : 'light' })),
  setUoauiDensity: (d) => set((st) => ({ uoaui: { ...st.uoaui, density: d }, globalDensity: saltLevelOf(d), densityTouched: true })),
  setUoauiAccent: (c) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(c)) return;
    set((st) => ({ uoaui: { ...st.uoaui, accentColor: c } }));
  },
  setCarbonTheme: (key) => set((st) => ({ carbon: { ...st.carbon, themeKey: key }, globalMode: carbonModeOf(key) })),
  /* Fold-aware (P1-b): picking 'compact' won't clobber an already-more-compact
     abstract level — globalDensity stays the single source of truth. */
  setCarbonDensity: (d) => set((st) => ({ carbon: { ...st.carbon, density: d }, globalDensity: carbonLevelFold(d, st.globalDensity), densityTouched: true })),
  setSelectedComponent: (id) => set({ selectedComponent: id, activeTab: 'preview' }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setActiveTab: (t) => set({ activeTab: t }),
  toggleSidebar: () => set((st) => ({ sidebarOpen: !st.sidebarOpen })),
}), {
  name: 'designhub.uikit.v1',
  version: 2,
  storage: createJSONStorage(() => localStorage),
  /* Persist only the user's theme preferences. Ephemeral browsing
     state (selectedComponent, searchQuery, activeTab, sidebarOpen)
     starts fresh each session so users always land on a clean
     component list — surveys consistently show users prefer this
     over "where did I leave off". globalMode/globalDensity carry the
     mode + density intent across DS switches AND across reload. */
  partialize: (state) => ({
    activeSystem: state.activeSystem,
    salt: state.salt,
    m3: state.m3,
    fluent: state.fluent,
    uoaui: state.uoaui,
    carbon: state.carbon,
    globalMode: state.globalMode,
    globalDensity: state.globalDensity,
    densityTouched: state.densityTouched,
  }),
  /* v1 blobs predate globalMode/globalDensity. Seed them from the user's
     CURRENTLY-active DS slice so the very first cross-DS switch after this
     deploy honors what they were already looking at, rather than snapping
     to the dark/medium initial-state default. */
  migrate: (persisted, version) => {
    const p = (persisted ?? {}) as Partial<DesignHubState>;
    if (version < 2 && (p.globalMode === undefined || p.globalDensity === undefined)) {
      const active = p.activeSystem ?? 'salt';
      let mode: GlobalMode = 'dark';
      let density: GlobalDensity = 1;
      if (active === 'salt' && p.salt) { mode = saltModeOf(p.salt.themeKey); density = saltLevelOf(p.salt.density); }
      else if (active === 'uoaui' && p.uoaui) { mode = p.uoaui.themeKey === 'light' ? 'light' : 'dark'; density = saltLevelOf(p.uoaui.density); }
      else if (active === 'fluent' && p.fluent) { mode = p.fluent.themeKey === 'dark' ? 'dark' : 'light'; density = fluentLevelOf(p.fluent.size); }
      else if (active === 'm3' && p.m3) { mode = m3ModeOf(p.m3.themeKey, p.m3.isDarkCustom); density = m3LevelOf(p.m3.density); }
      else if (active === 'carbon' && p.carbon) { mode = carbonModeOf(p.carbon.themeKey); density = carbonLevelOf(p.carbon.density); }
      /* v1 users were already viewing a specific density: seed it AND mark it
         touched so the first cross-DS switch honors what they were looking
         at, rather than reverting to each DS's own default. */
      return { ...p, globalMode: mode, globalDensity: density, densityTouched: true };
    }
    return p;
  },
}));
