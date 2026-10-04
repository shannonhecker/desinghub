import type { LayoutProps, LayoutWidth, ZoneLayout } from "@/store/useBuilder";
const clamp = (value: unknown, min: number, max: number) => typeof value === "number" && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : undefined;
const oneOf = <T extends string>(value: unknown, values: readonly T[]): T | undefined => typeof value === "string" && values.includes(value as T) ? value as T : undefined;
const object = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
function width(v: unknown): LayoutWidth | undefined {
  if (v === "fill" || v === "auto") return v;
  if (typeof v === "number") return clamp(v, 0, 4096);
  if (typeof v !== "string") return;
  const match = /^(-?\d+(?:\.\d+)?)(px|%|fr)$/.exec(v);
  if (!match) return;
  const cap = match[2] === "px" ? 4096 : match[2] === "%" ? 100 : 12;
  return `${Math.max(0, Math.min(cap, Number(match[1])))}${match[2]}` as LayoutWidth;
}
const clean = <T extends object>(value: T): T => Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
export function safeBlockLayout(value: unknown): Partial<LayoutProps> {
  const v = object(value);
  return clean({
    width: width(v.width), minWidth: width(v.minWidth), maxWidth: width(v.maxWidth),
    height: width(v.height), minHeight: width(v.minHeight), maxHeight: width(v.maxHeight),
    grow: v.grow === 0 || v.grow === 1 ? v.grow : undefined,
    align: oneOf(v.align, ["start", "center", "end", "stretch"]),
    margin: clamp(v.margin, 0, 128),
    gridCol: integer(v.gridCol, 12), spanTablet: integer(v.spanTablet, 12), spanPhone: integer(v.spanPhone, 12), rowSpan: integer(v.rowSpan, 24),
  });
}
function integer(v: unknown, max: number): number | undefined { const n = clamp(v, 1, max); return n === undefined ? undefined : Math.floor(n); }
const bool = (v: unknown) => typeof v === "boolean" ? v : undefined;
export function safeZoneLayout(value: unknown): Partial<ZoneLayout> {
  const v = object(value);
  const gap = object(v.gap), padding = object(v.padding);
  return clean({
    mode: oneOf(v.mode, ["row", "stack", "grid"]), columns: integer(v.columns, 12),
    gap: typeof v.gap === "number" ? clamp(v.gap, 0, 128) : Object.keys(gap).length ? { row: clamp(gap.row, 0, 128) ?? 0, col: clamp(gap.col, 0, 128) ?? 0 } : undefined,
    padding: typeof v.padding === "number" ? clamp(v.padding, 0, 128) : Object.keys(padding).length ? { t: clamp(padding.t, 0, 128) ?? 0, r: clamp(padding.r, 0, 128) ?? 0, b: clamp(padding.b, 0, 128) ?? 0, l: clamp(padding.l, 0, 128) ?? 0 } : undefined,
    align: oneOf(v.align, ["start", "center", "end", "stretch"]),
    justify: oneOf(v.justify, ["start", "center", "end", "space-between", "space-around"]),
    tone: oneOf(v.tone, ["surface", "transparent", "inverse", "dark", "accent"]),
    side: oneOf(v.side, ["left", "right"]), size: clamp(v.size, 0, 2048),
    wrap: bool(v.wrap), visible: bool(v.visible), flush: bool(v.flush), collapsed: bool(v.collapsed), dense: bool(v.dense), plain: bool(v.plain),
  });
}
export function isSafeColor(value: unknown): value is string {
  return typeof value === "string" && value.length <= 96 && (
    /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value) ||
    /^(?:rgb|hsl)a?\(\s*[\d.%+\-\s,/]+\)$/i.test(value) || value === "transparent" || value === "currentColor"
  );
}
