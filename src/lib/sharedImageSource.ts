/** Shared links may load packaged assets or inert raster data, never a remote
 * tracking URL, blob belonging to another document, or executable SVG data. */
export function safeSharedImageSource(value: unknown): string {
  if (typeof value !== "string") return "";
  if (/^data:image\/(?:png|jpeg|gif|webp|avif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return value;
  if (!/^\/[A-Za-z0-9_ .\/-]+\.(?:png|jpe?g|gif|webp|avif|svg)$/i.test(value)) return "";
  if (value.startsWith("//") || value.split("/").some(part => part === "." || part === "..")) return "";
  return value;
}
