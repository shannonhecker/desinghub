import { createElement, type CSSProperties, type SVGAttributes } from "react";
import { CHROME_ICON_STROKE, chromeIconNode, hasChromeIcon } from "@/lib/chromeIcons";

/**
 * One of the builder chrome's icons, as an inline SVG: see
 * src/lib/chromeIcons. `name` is the Material Symbols name the call site has
 * always used. One em square, in the current colour, hidden from assistive
 * technology unless the caller says otherwise (the control it sits in carries
 * the name).
 */
export interface ChromeIconProps extends Omit<SVGAttributes<SVGSVGElement>, "name"> {
  name: string;
  /** The filled style (Material's FILL 1). */
  filled?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function ChromeIcon({ name, filled = false, className, strokeWidth = CHROME_ICON_STROKE, ...rest }: ChromeIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      {...rest}
      data-icon={name}
      data-icon-missing={hasChromeIcon(name) ? undefined : "true"}
      className={className ? `chrome-icon ${className}` : "chrome-icon"}
      width="1em"
      height="1em"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {chromeIconNode(name).map(([tag, attrs], i) => createElement(tag, { ...attrs, key: i }))}
    </svg>
  );
}
