import type { SystemId } from '@/store/useDesignHub';
import type { ComponentDef } from './salt/components';

/* ── Types for untyped JSX boundary ── */

/** Common shape for raw component entries from the .jsx reference files */
interface RawComponent {
  id: string;
  name: string;
  cat: string;
  desc: string;
  [key: string]: unknown;
}

/** Theme token dictionaries - keys vary by DS, values are CSS strings but
 *  the untyped JSX sources use mixed types, so we keep this permissive and
 *  let consumers cast to string where needed for CSS properties. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ThemeTokens = Record<string, any>;

/** Theme dictionary: themeKey → token set */
type ThemeDict = Record<string, ThemeTokens>;

/** Density map entry */
interface DensityEntry {
  h: number; sp: number; fs: number; fsS: number;
  h1: number; h2: number; title: number; pad: number;
  cr: number; icon: number; sideW: number; mainP: number;
  cardMin: number; cardP: number; gap: number; topH: number;
  srchH: number; logoS: number; catFs: number; demoP: number; demoCr: number;
}

// Import directly from the original reference files (complete implementations)
import {
  SALT_THEMES, saltBuildCSS, SIcon, SALT_COMPS, SALT_CATS, SALT_FONT, SALT_FONT_HEAD,
  setSaltT, getSaltT, getSaltPreviews, getSaltDemoComponent,
  SALT_MOTION, SALT_CURVE, SALT_ELEVATION, SALT_TYPE, SALT_BORDER,
} from './salt/salt-documentation.jsx';

import {
  M3_THEMES, m3BuildCSS, M3_COMPS, M3_CATS, MATERIAL_COLORS, M3Icon, M3_MOTION,
  generateM3Theme, setM3T, getM3T, getM3DemoComponent,
  getM3DensityCSS, getM3LayoutDensity, getM3Previews,
  M3_SHAPE, M3_TYPE, M3_DENSITY, M3_BORDER,
} from './m3/m3-documentation.jsx';

import {
  FLUENT_THEMES, fluentBuildCSS, FLUENT_COMPS, FLUENT_CATS, FIcon, FLUENT_FONT,
  setFluentT, getFluentT, getFluentPreviews, getFluentDemoComponent,
  getFluentSizeCSS,
  FLUENT_MOTION, FLUENT_RADIUS, FLUENT_SHADOW, FLUENT_STROKE_WIDTH,
} from './fluent/fluent2-documentation.jsx';

import {
  AUSOS_THEMES, ausosBuildCSS, AUSOS_COMPS, AUSOS_CATS, AIcon, AUSOS_FONT,
  setAusosT, getAusosT, getAusosPreviews, getAusosDemoComponent,
  getAusosDensityCSS,
  AUSOS_MOTION, AUSOS_OPACITY, AUSOS_RADIUS, AUSOS_SHADOW, AUSOS_BORDER,
} from './ausos/ausos-documentation.jsx';

import {
  CARBON_THEMES, carbonBuildCSS, CARBON_COMPS, CARBON_CATS, CIcon, CARBON_FONT,
  setCarbonT, getCarbonT, getCarbonPreviews, getCarbonDemoComponent,
  getCarbonDensityCSS,
  CARBON_MOTION, CARBON_TYPE, CARBON_RADIUS, CARBON_SPACING, CARBON_BORDER,
} from './carbon/carbon-documentation.jsx';

// Re-export for use in other modules
export {
  SIcon, M3Icon, FIcon, AIcon, CIcon,
  MATERIAL_COLORS, generateM3Theme,
  M3_MOTION, M3_SHAPE, M3_TYPE, M3_DENSITY, M3_BORDER,
  AUSOS_MOTION, AUSOS_OPACITY, AUSOS_RADIUS, AUSOS_SHADOW, AUSOS_BORDER,
  FLUENT_MOTION, FLUENT_RADIUS, FLUENT_SHADOW, FLUENT_STROKE_WIDTH,
  CARBON_MOTION, CARBON_TYPE, CARBON_RADIUS, CARBON_SPACING, CARBON_BORDER,
  SALT_MOTION, SALT_CURVE, SALT_ELEVATION, SALT_TYPE, SALT_BORDER,
  getSaltPreviews, getFluentPreviews, getAusosPreviews, getCarbonPreviews,
};

export function getComponents(system: SystemId): ComponentDef[] {
  /* Keyed lookup avoids the "used before assignment" strict-mode
     error that a `let x; switch {...}` pattern can produce when TS
     doesn't infer exhaustiveness across imports from .jsx. The
     Record<SystemId, ...> type does the compile-time check for us -
     adding a new SystemId fails here until the map gets a matching
     entry. */
  const compsBySystem: Record<SystemId, RawComponent[]> = {
    salt: SALT_COMPS, m3: M3_COMPS, fluent: FLUENT_COMPS, ausos: AUSOS_COMPS, carbon: CARBON_COMPS,
  };
  return compsBySystem[system].map((c) => ({ id: c.id, name: c.name, cat: c.cat, desc: c.desc }));
}

export function getCategories(system: SystemId): string[] {
  switch (system) {
    case 'salt': return SALT_CATS;
    case 'm3': return M3_CATS;
    case 'fluent': return FLUENT_CATS;
    case 'ausos': return AUSOS_CATS;
    case 'carbon': return CARBON_CATS;
  }
}

export function getThemeKeys(system: SystemId): string[] {
  const dictBySystem: Record<SystemId, ThemeDict> = {
    salt: SALT_THEMES, m3: M3_THEMES, fluent: FLUENT_THEMES, ausos: AUSOS_THEMES, carbon: CARBON_THEMES,
  };
  return Object.keys(dictBySystem[system]);
}

export function getTheme(system: SystemId, themeKey: string, customColor?: string, isDarkCustom?: boolean): ThemeTokens {
  const st = SALT_THEMES as ThemeDict, mt = M3_THEMES as ThemeDict, ft = FLUENT_THEMES as ThemeDict, at = AUSOS_THEMES as ThemeDict, ct = CARBON_THEMES as ThemeDict;
  switch (system) {
    case 'salt': return st[themeKey] || st['jpm-light'];
    case 'm3':
      if (themeKey === 'custom') return generateM3Theme(customColor || '#6750A4', isDarkCustom || false);
      return mt[themeKey] || mt['light'];
    case 'fluent': return ft[themeKey] || ft['light'];
    case 'ausos': return at[themeKey] || at['dark'];
    case 'carbon': return ct[themeKey] || ct['white'];
  }
}

// Set the module-scoped T variable in each reference file so demos render with the right theme
export function activateTheme(system: SystemId, theme: ThemeTokens) {
  switch (system) {
    case 'salt': setSaltT(theme); break;
    case 'm3': setM3T(theme); break;
    case 'fluent': setFluentT(theme); break;
    case 'ausos': setAusosT(theme); break;
    case 'carbon': setCarbonT(theme); break;
  }
}

// Get the demo render function for a component from its original reference file
export function getDemoComponent(system: SystemId, componentId: string): React.ComponentType | null {
  switch (system) {
    case 'salt': return getSaltDemoComponent(componentId);
    case 'm3': return getM3DemoComponent(componentId);
    case 'fluent': return getFluentDemoComponent(componentId);
    case 'ausos': return getAusosDemoComponent(componentId);
    case 'carbon': return getCarbonDemoComponent(componentId);
  }
}

// Get preview thumbnails for landing grid
export function getPreviews(system: SystemId): Record<string, React.ComponentType> {
  switch (system) {
    case 'salt': return getSaltPreviews();
    case 'm3': return getM3Previews();
    case 'fluent': return getFluentPreviews();
    case 'ausos': return getAusosPreviews();
    case 'carbon': return getCarbonPreviews();
  }
}

export function getFullCSS(system: SystemId, theme: ThemeTokens, densityOrSize: string | number): string {
  switch (system) {
    case 'salt': {
      const d = SALT_DENSITY_MAP[densityOrSize as string] || SALT_DENSITY_MAP.medium;
      return saltBuildCSS(theme) + `:root{--h:${d.h}px;--pad:${d.pad}px;--fs:${d.fs}px;--cr:${d.cr}px;}
        .s-sidebar-item{padding:${Math.max(4,d.sp-2)}px ${d.sp}px;font-size:${d.fs}px;border-radius:${d.cr}px;}`;
    }
    case 'm3': return m3BuildCSS(theme) + getM3DensityCSS(densityOrSize as number);
    case 'fluent': return fluentBuildCSS(theme) + getFluentSizeCSS(densityOrSize as string);
    case 'ausos': return ausosBuildCSS(theme) + getAusosDensityCSS(densityOrSize as string);
    case 'carbon': return carbonBuildCSS(theme) + getCarbonDensityCSS(densityOrSize as string);
  }
}

export function getFont(system: SystemId): string {
  switch (system) {
    case 'salt': return SALT_FONT;
    case 'm3': return "'Roboto', sans-serif";
    case 'fluent': return FLUENT_FONT;
    case 'ausos': return AUSOS_FONT;
    case 'carbon': return CARBON_FONT;
  }
}

export function getSystemInfo(system: SystemId) {
  const info = {
    salt: { name: "Salt DS", org: "J.P. Morgan", color: "#1B7F9E", icon: "S" },
    m3: { name: "Material 3", org: "Google", color: "#6750A4", icon: "M" },
    fluent: { name: "Fluent 2", org: "Microsoft", color: "#0F6CBD", icon: "F" },
    ausos: { name: "ausos DS", org: "ausos", color: "#7E6BC4", icon: "A" },
    carbon: { name: "Carbon DS", org: "IBM", color: "#0f62fe", icon: "C" },
  };
  return info[system];
}

// Salt density map from the reference file
const SALT_DENSITY_MAP: Record<string, DensityEntry> = {
  high:   { h:20, sp:4,  fs:11, fsS:10, h1:18, h2:14, title:24, pad:6,  cr:2, icon:10, sideW:200, mainP:16, cardMin:150, cardP:8,  gap:6,  topH:28, srchH:24, logoS:20, catFs:8,  demoP:12, demoCr:4 },
  medium: { h:28, sp:8,  fs:12, fsS:11, h1:24, h2:18, title:32, pad:8,  cr:4, icon:12, sideW:240, mainP:24, cardMin:180, cardP:12, gap:8,  topH:36, srchH:28, logoS:26, catFs:9,  demoP:20, demoCr:8 },
  low:    { h:36, sp:12, fs:14, fsS:12, h1:32, h2:24, title:40, pad:12, cr:6, icon:14, sideW:280, mainP:32, cardMin:210, cardP:16, gap:10, topH:44, srchH:32, logoS:30, catFs:10, demoP:28, demoCr:10 },
  touch:  { h:44, sp:16, fs:16, fsS:14, h1:42, h2:32, title:48, pad:16, cr:8, icon:16, sideW:300, mainP:40, cardMin:240, cardP:20, gap:14, topH:52, srchH:40, logoS:36, catFs:11, demoP:36, demoCr:12 },
};

const AUSOS_DENSITY_MAP: Record<string, DensityEntry> = {
  high:   { h:20, sp:4,  fs:11, fsS:10, h1:18, h2:14, title:24, pad:6,  cr:6,  icon:10, sideW:200, mainP:16, cardMin:150, cardP:8,  gap:6,  topH:28, srchH:24, logoS:20, catFs:8,  demoP:12, demoCr:8 },
  medium: { h:28, sp:8,  fs:12, fsS:11, h1:24, h2:18, title:32, pad:8,  cr:8,  icon:12, sideW:240, mainP:24, cardMin:180, cardP:12, gap:8,  topH:36, srchH:28, logoS:26, catFs:9,  demoP:20, demoCr:12 },
  low:    { h:36, sp:12, fs:14, fsS:12, h1:32, h2:24, title:40, pad:12, cr:10, icon:14, sideW:280, mainP:32, cardMin:210, cardP:16, gap:10, topH:44, srchH:32, logoS:30, catFs:10, demoP:28, demoCr:14 },
  touch:  { h:44, sp:16, fs:16, fsS:14, h1:42, h2:32, title:48, pad:16, cr:12, icon:16, sideW:300, mainP:40, cardMin:240, cardP:20, gap:14, topH:52, srchH:40, logoS:36, catFs:11, demoP:36, demoCr:16 },
};

/* Carbon density map — Carbon's PREVIEW-CHROME scale (4px-based).
   Drives sidebar width, card min-widths, preview padding. This is
   DIFFERENT from Carbon's internal --cds-spacing-* ladder (2px-based)
   which is defined in carbon-documentation.jsx and used by rendered
   Carbon components.

   Per Q4 (2026-04-22): the numeric values below live conceptually
   under the --bc-* builder-chrome namespace. See aliases:
     sp: 4  → var(--bc-preview-carbon-gap-compact)
     sp: 8  → var(--bc-preview-carbon-gap-normal)
     sp: 12 → var(--bc-preview-carbon-gap-spacious)
   (exposed in src/components/builder/chrome-tokens.css).

   Radius stays at 0 across the board — Carbon is flat/Swiss.
   Corner tokens exist (--cds-radius-0..3) but standard controls use 0. */
const CARBON_DENSITY_MAP: Record<string, DensityEntry> = {
  compact:  { h:24, sp:4,  fs:12, fsS:11, h1:20, h2:14, title:24, pad:6,  cr:0, icon:12, sideW:200, mainP:16, cardMin:160, cardP:8,  gap:6,  topH:32, srchH:24, logoS:22, catFs:9,  demoP:12, demoCr:0 },
  normal:   { h:32, sp:8,  fs:14, fsS:12, h1:24, h2:18, title:28, pad:8,  cr:0, icon:14, sideW:256, mainP:24, cardMin:192, cardP:12, gap:8,  topH:40, srchH:32, logoS:26, catFs:10, demoP:20, demoCr:0 },
  spacious: { h:48, sp:12, fs:16, fsS:14, h1:32, h2:24, title:40, pad:12, cr:0, icon:16, sideW:288, mainP:32, cardMin:224, cardP:16, gap:12, topH:56, srchH:48, logoS:32, catFs:11, demoP:32, demoCr:0 },
  /* Alias so any caller that hands us "medium" (the generic density
     label used elsewhere) still resolves to something sensible. */
  medium:   { h:32, sp:8,  fs:14, fsS:12, h1:24, h2:18, title:28, pad:8,  cr:0, icon:14, sideW:256, mainP:24, cardMin:192, cardP:12, gap:8,  topH:40, srchH:32, logoS:26, catFs:10, demoP:20, demoCr:0 },
};

export { SALT_DENSITY_MAP, AUSOS_DENSITY_MAP, CARBON_DENSITY_MAP };
export { SALT_THEMES, M3_THEMES, FLUENT_THEMES, AUSOS_THEMES, CARBON_THEMES };
