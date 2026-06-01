/**
 * Escape helpers for code generation.
 *
 * The code generator interpolates user/AI-editable prop text (labels,
 * placeholders, titles, content, CSV items) directly into generated JSX/HTML.
 * Without escaping, a `"`, `<`, `>`, `{`, `}`, or `&` in any field produces an
 * export that does not compile (JSX) or is corrupt/unsafe markup (HTML).
 *
 * Design principle — escape ONLY when a dangerous char is present, so the vast
 * majority of (safe) inputs render byte-identical to before this module
 * existed. This keeps generated code clean and minimizes behavioral risk:
 * "Buy now" stays "Buy now", never "{\"Buy now\"}".
 *
 * Four helpers, one per output context:
 *  - jsxText  — text in JSX children position:  >${jsxText(p.x)}<
 *  - jsxAttr  — value inside a double-quoted JSX attribute:  attr="${jsxAttr(p.x)}"
 *  - htmlText — text in HTML children position (htmlExporter)
 *  - htmlAttr — value inside a double-quoted HTML attribute (htmlExporter)
 *
 * Note: chartExporter.ts (`attr()`) and svgExporter.ts (`esc()`) carry their
 * own local escapers and are intentionally left as-is; this is the shared
 * module for the registry + react/html exporters.
 */

/**
 * JSX CHILDREN text. In JSX children, `< > { } &` are unsafe (`<`/`>` start
 * tags, `{`/`}` open/close expressions, `&` starts an entity reference). A bare
 * `"` is fine in children. When any unsafe char is present, emit a JS-string
 * expression (`{"..."}`) which is always valid JSX; otherwise return the raw
 * string so safe inputs are byte-identical to today.
 */
export function jsxText(v: unknown, fallback = ""): string {
  const str = String(v ?? fallback);
  return /[<>{}&]/.test(str) ? `{${JSON.stringify(str)}}` : str;
}

/**
 * Value to drop INSIDE an existing double-quoted JSX attribute:
 * `attr="${jsxAttr(x)}"`. A `"` would close the attribute, `&` starts an
 * entity, and `<`/`>` should be escaped. Entity-escape (ampersand first) only
 * when one of those chars is present; otherwise return raw.
 */
export function jsxAttr(v: unknown, fallback = ""): string {
  const str = String(v ?? fallback);
  if (!/["&<>]/.test(str)) return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * HTML children text (for htmlExporter). Escape `& < >` (ampersand first) only
 * when present; otherwise return raw so safe inputs are byte-identical.
 */
export function htmlText(v: unknown, fallback = ""): string {
  const str = String(v ?? fallback);
  if (!/[&<>]/.test(str)) return str;
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * HTML attribute value (inside double quotes). Escape `& < > "` (ampersand
 * first) only when present; otherwise return raw.
 */
export function htmlAttr(v: unknown, fallback = ""): string {
  const str = String(v ?? fallback);
  if (!/[&<>"]/.test(str)) return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
