/* Carbon icon adapter.
   ----------------------------------------------------------------
   Thin wrapper around @carbon/icons-react that accepts either a
   Carbon export name ("Search", "Add") or a Material-Symbols legacy
   alias ("search", "add", "chevron_down"). The lookup mirrors the
   alias table already used inside carbon-documentation.jsx so the
   two call sites stay in sync.

   Renders a 16 / 20 / 24 / 32 px SVG icon. Colour is driven by
   CSS currentColor unless an explicit `color` prop is passed, so
   the icon inherits the parent's colour by default - this is the
   idiomatic way to colour Carbon SVG icons. */

import * as React from "react";
import * as CarbonIcons from "@carbon/icons-react";

export type CarbonIconSize = 16 | 20 | 24 | 32;

export interface CarbonIconProps {
  /** Carbon export name ("Search") or Material-Symbols legacy alias ("search"). */
  name: string;
  /** Icon size in px. Defaults to 16 (Carbon's baseline). */
  size?: CarbonIconSize;
  /** Explicit colour override. Omit to inherit via currentColor. */
  color?: string;
  /** Accessible label. When unset, the icon is marked aria-hidden. */
  "aria-label"?: string;
  /** Additional className merged onto the rendered SVG. */
  className?: string;
  /** Inline style merged onto the rendered SVG. */
  style?: React.CSSProperties;
}

/* Legacy Material-Symbols → @carbon/icons-react alias table.
   Every value must resolve to a real Carbon export. Keep in sync
   with CARBON_ICON_ALIASES inside carbon-documentation.jsx. */
const CARBON_ICON_ALIASES: Record<string, string> = {
  search: "Search",
  add: "Add",
  close: "Close",
  check: "Checkmark",
  check_circle: "CheckmarkFilled",
  cancel: "ErrorFilled",
  error: "ErrorFilled",
  warning: "WarningFilled",
  info: "Information",
  settings: "Settings",
  person: "User",
  home: "Home",
  menu: "Menu",
  delete: "TrashCan",
  edit: "Edit",
  download: "Download",
  upload: "Upload",
  filter_alt: "Filter",
  save: "Save",
  notifications: "Notification",
  bookmark: "Bookmark",
  arrow_forward: "ArrowRight",
  arrow_back: "ArrowLeft",
  arrow_upward: "ArrowUp",
  arrow_downward: "ArrowDown",
  chevron_left: "ChevronLeft",
  chevron_right: "ChevronRight",
  chevron_up: "ChevronUp",
  chevron_down: "ChevronDown",
  expand_more: "ChevronDown",
  expand_less: "ChevronUp",
  remove: "Subtract",
  calendar_today: "Calendar",
  more_horiz: "OverflowMenuHorizontal",
  more_vert: "OverflowMenuVertical",
  copy: "Copy",
};

/** Resolve a Carbon / Material-Symbols name to its @carbon/icons-react
 *  component reference. Returns `null` when no match is found so callers
 *  can render a sized placeholder instead of crashing. */
export function resolveCarbonIcon(name: string): React.ComponentType<Record<string, unknown>> | null {
  const resolved = CARBON_ICON_ALIASES[name] ?? name;
  const maybe = (CarbonIcons as unknown as Record<string, unknown>)[resolved];
  if (typeof maybe === "function" || (typeof maybe === "object" && maybe !== null)) {
    return maybe as React.ComponentType<Record<string, unknown>>;
  }
  return null;
}

/**
 * Carbon icon wrapper. Accepts the semantic name + size and resolves to
 * a tree-shakeable @carbon/icons-react component. Falls back to a sized
 * placeholder span when the name does not resolve, so layout stays
 * stable even with a typo.
 */
export function CIcon({
  name,
  size = 16,
  color,
  "aria-label": ariaLabel,
  className,
  style,
}: CarbonIconProps): React.ReactElement {
  const IconComp = resolveCarbonIcon(name);

  const mergedStyle: React.CSSProperties = {
    color: color ?? "currentColor",
    verticalAlign: "middle",
    flexShrink: 0,
    ...style,
  };

  if (!IconComp) {
    return (
      <span
        aria-hidden={ariaLabel ? undefined : true}
        aria-label={ariaLabel}
        className={className}
        style={{ display: "inline-block", width: size, height: size, ...style }}
      />
    );
  }

  const ariaProps = ariaLabel
    ? { "aria-label": ariaLabel, role: "img" as const }
    : { "aria-hidden": true };

  return (
    <IconComp
      size={size}
      className={className}
      style={mergedStyle}
      {...ariaProps}
    />
  );
}

export default CIcon;
