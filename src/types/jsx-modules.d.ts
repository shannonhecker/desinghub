declare module '*.jsx' {
  const content: any;
  export default content;
  export const SALT_THEMES: any;
  export const saltBuildCSS: any;
  export const SIcon: any;
  export const SALT_COMPS: any;
  export const SALT_CATS: string[];
  export const SALT_FONT: string;
  export const SALT_FONT_HEAD: string;
  export function setSaltT(theme: any): void;
  export function getSaltT(): any;
  export function getSaltPreviews(): any;
  export function getSaltDemoComponent(id: string): any;

  export const M3_THEMES: any;
  export const m3BuildCSS: any;
  export const M3_COMPS: any;
  export const M3_CATS: string[];
  export const MATERIAL_COLORS: any[];
  export const M3Icon: any;
  export function generateM3Theme(hex: string, isDark: boolean): any;
  export function setM3T(theme: any): void;
  export function getM3T(): any;
  export function getM3DemoComponent(id: string): any;
  export function getM3DensityCSS(density: number): string;
  export function getM3LayoutDensity(density: number): any;

  export const FLUENT_THEMES: any;
  export const fluentBuildCSS: any;
  export const FLUENT_COMPS: any;
  export const FLUENT_CATS: string[];
  export const FIcon: any;
  export const FLUENT_FONT: string;
  export function setFluentT(theme: any): void;
  export function getFluentT(): any;
  export function getFluentPreviews(): any;
  export function getFluentDemoComponent(id: string): any;
  export function getFluentSizeCSS(size: string): string;
}
