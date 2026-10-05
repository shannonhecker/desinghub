import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Token reference",
  description: "Every colour token of Salt DS, Material 3, Fluent 2, Carbon and uoaui DS. Select a value to copy it, or copy the whole set as JSON.",
  path: "/token-editor",
  /* Behind the access gate: not a page to list in search. */
  index: false,
});

export default function TokenEditorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
