import type { SystemId } from '@/store/useDesignHub';
import type { ComponentDef } from './salt/components';
import { COMPS as SALT_COMPS, CATS as SALT_CATS } from './salt/components';
import { COMPS as M3_COMPS, CATS as M3_CATS } from './m3/components';
import { COMPS as FLUENT_COMPS, CATS as FLUENT_CATS } from './fluent/components';
import { THEMES as SALT_THEMES, buildCSS as saltBuildCSS, densityCSS as saltDensityCSS, DENSITY_MAP, FONT as SALT_FONT } from './salt/themes';
import { THEMES as M3_THEMES, buildCSS as m3BuildCSS, densityCSS as m3DensityCSS, generateM3Theme, FONT as M3_FONT } from './m3/themes';
import { THEMES as FLUENT_THEMES, buildCSS as fluentBuildCSS, sizeCSS as fluentSizeCSS, SIZE_MAP, FONT as FLUENT_FONT } from './fluent/themes';

export function getComponents(system: SystemId): ComponentDef[] {
  switch (system) {
    case 'salt': return SALT_COMPS;
    case 'm3': return M3_COMPS;
    case 'fluent': return FLUENT_COMPS;
  }
}

export function getCategories(system: SystemId): string[] {
  switch (system) {
    case 'salt': return SALT_CATS;
    case 'm3': return M3_CATS;
    case 'fluent': return FLUENT_CATS;
  }
}

export function getThemeKeys(system: SystemId): string[] {
  switch (system) {
    case 'salt': return Object.keys(SALT_THEMES);
    case 'm3': return Object.keys(M3_THEMES);
    case 'fluent': return Object.keys(FLUENT_THEMES);
  }
}

export function getTheme(system: SystemId, themeKey: string, customColor?: string, isDarkCustom?: boolean): any {
  switch (system) {
    case 'salt': return SALT_THEMES[themeKey] || SALT_THEMES['jpm-light'];
    case 'm3':
      if (themeKey === 'custom') return generateM3Theme(customColor || '#6750A4', isDarkCustom || false);
      return M3_THEMES[themeKey] || M3_THEMES['light'];
    case 'fluent': return FLUENT_THEMES[themeKey] || FLUENT_THEMES['light'];
  }
}

export function getFullCSS(system: SystemId, theme: any, densityOrSize: string | number): string {
  switch (system) {
    case 'salt': return saltBuildCSS(theme) + saltDensityCSS(densityOrSize as string);
    case 'm3': return m3BuildCSS(theme) + m3DensityCSS(densityOrSize as number);
    case 'fluent': return fluentBuildCSS(theme) + fluentSizeCSS(densityOrSize as string);
  }
}

export function getFont(system: SystemId): string {
  switch (system) { case 'salt': return SALT_FONT; case 'm3': return M3_FONT; case 'fluent': return FLUENT_FONT; }
}

export function getSystemInfo(system: SystemId) {
  const info = {
    salt: { name: "Salt DS", org: "J.P. Morgan", color: "#1B7F9E", icon: "S" },
    m3: { name: "Material 3", org: "Google", color: "#6750A4", icon: "M" },
    fluent: { name: "Fluent 2", org: "Microsoft", color: "#0F6CBD", icon: "F" },
  };
  return info[system];
}

export { DENSITY_MAP, SIZE_MAP, SALT_THEMES, M3_THEMES, FLUENT_THEMES };
