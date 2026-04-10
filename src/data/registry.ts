import type { SystemId } from '@/store/useDesignHub';
import type { ComponentDef } from './salt/components';

// Import directly from the original reference files (complete implementations)
import {
  SALT_THEMES, saltBuildCSS, SIcon, SALT_COMPS, SALT_FONT, SALT_FONT_HEAD,
  setSaltT, getSaltT, getSaltPreviews, getSaltDemoComponent
} from './salt/salt-documentation.jsx';

import {
  M3_THEMES, m3BuildCSS, M3_COMPS, M3_CATS, MATERIAL_COLORS, M3Icon,
  generateM3Theme, setM3T, getM3T, getM3DemoComponent,
  getM3DensityCSS, getM3LayoutDensity
} from './m3/m3-documentation.jsx';

import {
  FLUENT_THEMES, fluentBuildCSS, FLUENT_COMPS, FLUENT_CATS, FIcon, FLUENT_FONT,
  setFluentT, getFluentT, getFluentPreviews, getFluentDemoComponent,
  getFluentSizeCSS
} from './fluent/fluent2-documentation.jsx';

// Re-export for use in other modules
export {
  SIcon, M3Icon, FIcon,
  MATERIAL_COLORS, generateM3Theme,
  getSaltPreviews, getFluentPreviews,
};

export function getComponents(system: SystemId): ComponentDef[] {
  switch (system) {
    case 'salt': return SALT_COMPS.map((c: any) => ({ id: c.id, name: c.name, cat: c.cat, desc: c.desc }));
    case 'm3': return M3_COMPS.map((c: any) => ({ id: c.id, name: c.name, cat: c.cat, desc: c.desc }));
    case 'fluent': return FLUENT_COMPS.map((c: any) => ({ id: c.id, name: c.name, cat: c.cat, desc: c.desc }));
  }
}

export function getCategories(system: SystemId): string[] {
  switch (system) {
    case 'salt': return ["Design Language", "Foundations", "Actions", "Inputs", "Navigation", "Communication", "Containment"];
    case 'm3': return M3_CATS;
    case 'fluent': return FLUENT_CATS;
  }
}

export function getThemeKeys(system: SystemId): string[] {
  switch (system) {
    case 'salt': return Object.keys(SALT_THEMES as any);
    case 'm3': return Object.keys(M3_THEMES as any);
    case 'fluent': return Object.keys(FLUENT_THEMES as any);
  }
}

export function getTheme(system: SystemId, themeKey: string, customColor?: string, isDarkCustom?: boolean): any {
  const st = SALT_THEMES as any, mt = M3_THEMES as any, ft = FLUENT_THEMES as any;
  switch (system) {
    case 'salt': return st[themeKey] || st['jpm-light'];
    case 'm3':
      if (themeKey === 'custom') return generateM3Theme(customColor || '#6750A4', isDarkCustom || false);
      return mt[themeKey] || mt['light'];
    case 'fluent': return ft[themeKey] || ft['light'];
  }
}

// Set the module-scoped T variable in each reference file so demos render with the right theme
export function activateTheme(system: SystemId, theme: any) {
  switch (system) {
    case 'salt': setSaltT(theme); break;
    case 'm3': setM3T(theme); break;
    case 'fluent': setFluentT(theme); break;
  }
}

// Get the demo render function for a component from its original reference file
export function getDemoComponent(system: SystemId, componentId: string): React.ComponentType | null {
  switch (system) {
    case 'salt': return getSaltDemoComponent(componentId);
    case 'm3': return getM3DemoComponent(componentId);
    case 'fluent': return getFluentDemoComponent(componentId);
  }
}

// Get preview thumbnails for landing grid
export function getPreviews(system: SystemId): Record<string, React.ComponentType> {
  switch (system) {
    case 'salt': return getSaltPreviews();
    case 'm3': return {}; // M3 doesn't have a PREVIEWS object
    case 'fluent': return getFluentPreviews();
  }
}

export function getFullCSS(system: SystemId, theme: any, densityOrSize: string | number): string {
  switch (system) {
    case 'salt': {
      const d = SALT_DENSITY_MAP[densityOrSize as string] || SALT_DENSITY_MAP.medium;
      return saltBuildCSS(theme) + `:root{--h:${d.h}px;--pad:${d.pad}px;--fs:${d.fs}px;--cr:${d.cr}px;}
        .s-sidebar-item{padding:${Math.max(4,d.sp-2)}px ${d.sp}px;font-size:${d.fs}px;border-radius:${d.cr}px;}`;
    }
    case 'm3': return m3BuildCSS(theme) + getM3DensityCSS(densityOrSize as number);
    case 'fluent': return fluentBuildCSS(theme) + getFluentSizeCSS(densityOrSize as string);
  }
}

export function getFont(system: SystemId): string {
  switch (system) { case 'salt': return SALT_FONT; case 'm3': return "'Roboto', sans-serif"; case 'fluent': return FLUENT_FONT; }
}

export function getSystemInfo(system: SystemId) {
  const info = {
    salt: { name: "Salt DS", org: "J.P. Morgan", color: "#1B7F9E", icon: "S" },
    m3: { name: "Material 3", org: "Google", color: "#6750A4", icon: "M" },
    fluent: { name: "Fluent 2", org: "Microsoft", color: "#0F6CBD", icon: "F" },
  };
  return info[system];
}

// Salt density map from the reference file
const SALT_DENSITY_MAP: Record<string, any> = {
  high:   { h:20, sp:4,  fs:11, fsS:10, h1:18, h2:14, title:24, pad:6,  cr:2, icon:10, sideW:200, mainP:16, cardMin:150, cardP:8,  gap:6,  topH:28, srchH:24, logoS:20, catFs:8,  demoP:12, demoCr:4 },
  medium: { h:28, sp:8,  fs:12, fsS:11, h1:24, h2:18, title:32, pad:8,  cr:4, icon:12, sideW:240, mainP:24, cardMin:180, cardP:12, gap:8,  topH:36, srchH:28, logoS:26, catFs:9,  demoP:20, demoCr:8 },
  low:    { h:36, sp:12, fs:14, fsS:12, h1:32, h2:24, title:40, pad:12, cr:6, icon:14, sideW:280, mainP:32, cardMin:210, cardP:16, gap:10, topH:44, srchH:32, logoS:30, catFs:10, demoP:28, demoCr:10 },
  touch:  { h:44, sp:16, fs:16, fsS:14, h1:42, h2:32, title:48, pad:16, cr:8, icon:16, sideW:300, mainP:40, cardMin:240, cardP:20, gap:14, topH:52, srchH:40, logoS:36, catFs:11, demoP:36, demoCr:12 },
};

export { SALT_DENSITY_MAP };
export { SALT_THEMES, M3_THEMES, FLUENT_THEMES };
