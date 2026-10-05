import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Theme builder",
  description: "Change any colour in a design system's theme, check it in a live preview and copy the result as JSON.",
  path: "/theme-builder",
  /* Behind the access gate: not a page to list in search. */
  index: false,
});

export default function ThemeBuilderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
