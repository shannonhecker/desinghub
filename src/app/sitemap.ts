import type { MetadataRoute } from "next";
import { PUBLIC_PAGES, siteUrl } from "@/lib/site";

/* /sitemap.xml: the public pages only (see PUBLIC_PAGES). */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return PUBLIC_PAGES.map(({ path, priority }) => ({
    url: path === "/" ? `${base}/` : `${base}${path}`,
    changeFrequency: "weekly",
    priority,
  }));
}
