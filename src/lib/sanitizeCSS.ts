/**
 * Sanitize a CSS string to prevent injection attacks.
 * Strips dangerous patterns that could escape a <style> tag or execute code.
 */
export function sanitizeCSS(css: string): string {
  return css
    // Strip anything that could close/open HTML tags
    .replace(/</g, "")
    .replace(/>/g, "")
    // Strip JS expression injection vectors
    .replace(/expression\s*\(/gi, "")
    .replace(/javascript\s*:/gi, "")
    // Strip @import (prevents loading external stylesheets)
    .replace(/@import\b/gi, "")
    // Strip url() with non-data schemes (prevents external resource loading)
    .replace(/url\s*\(\s*(?!['"]?data:)['"]?[^)]*['"]?\s*\)/gi, "url()")
    // Strip binding/behavior (IE-specific but still good practice)
    .replace(/-moz-binding\s*:/gi, "")
    .replace(/behavior\s*:/gi, "");
}

/**
 * Validate a hex color string. Returns true if valid 6-digit hex.
 */
export function isValidHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}
