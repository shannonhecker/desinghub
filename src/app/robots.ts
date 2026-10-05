import type { MetadataRoute } from "next";
import { isPreviewDeployment, siteUrl } from "@/lib/site";

/* /robots.txt. A preview deployment asks not to be crawled at all. The
   production site is open except for the API; the pages that should not be
   listed (builder, sign-in, shared previews) say `noindex` themselves, which
   a crawler can only read if it is allowed to fetch them. */
export default function robots(): MetadataRoute.Robots {
  if (isPreviewDeployment()) return { rules: [{ userAgent: "*", disallow: "/" }] };
  const base = siteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
