import type { Metadata } from "next";

/**
 * What the site is called and where it lives, for metadata that needs an
 * absolute address: the share image, canonical links, robots.txt and the
 * sitemap.
 *
 * The address is read when the site is built:
 *   NEXT_PUBLIC_SITE_URL                       set it to override everything
 *   VERCEL_PROJECT_PRODUCTION_URL              the production domain, on Vercel
 *   VERCEL_URL                                 this deployment, on a Vercel preview
 *   https://uoaui.ai                           otherwise
 */
export const SITE_NAME = "uoaui.ai";
export const SITE_TITLE = "One finance screen. Five design systems.";
export const SITE_DESCRIPTION =
  "Describe a finance screen, switch it between Salt DS, Material 3, Fluent 2, Carbon and uoaui DS, and export code that runs.";

const FALLBACK = "https://uoaui.ai";

function withScheme(host: string): string {
  return /^https?:\/\//.test(host) ? host : `https://${host}`;
}

export function siteUrl(env: Record<string, string | undefined> = process.env): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  const production = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const deployment = env.VERCEL_URL?.trim();
  const preview = isPreviewDeployment(env);
  const chosen = explicit || (preview ? deployment || production : production) || FALLBACK;
  try {
    return new URL(withScheme(chosen)).origin;
  } catch {
    return FALLBACK;
  }
}

/** A Vercel preview or development deployment: never to be indexed. */
export function isPreviewDeployment(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.VERCEL_ENV) && env.VERCEL_ENV !== "production";
}

/**
 * The pages a search engine should list. The builder and the sign-in page sit
 * behind the access gate, and a shared preview is private to whoever holds
 * its link, so none of them is here; each also says `noindex` itself.
 */
export const PUBLIC_PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/ui-kit", priority: 0.8 },
  { path: "/theme-builder", priority: 0.5 },
  { path: "/token-editor", priority: 0.5 },
];

/**
 * Metadata for one page: its own title, description and address, as a
 * complete share card. A page that sets `openGraph` or `twitter` replaces the
 * site's whole object, so the shared fields are repeated here; the share
 * image comes from src/app/opengraph-image.png either way.
 */
export function pageMetadata(page: { title: string; description: string; path: string; index?: boolean; follow?: boolean }): Metadata {
  const { title, description, path, index = true, follow = true } = page;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: SITE_NAME, title, description, url: path },
    twitter: { card: "summary_large_image", title, description },
    ...(index && follow ? {} : { robots: { index, follow } }),
  };
}
