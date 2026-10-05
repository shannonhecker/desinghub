import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

/* The builder sits behind the access gate and holds the visitor's own work:
   it is not a page to list in search. A link to it still shares well. */
export const metadata: Metadata = pageMetadata({
  title: "Builder",
  description: "Describe a finance screen, edit it on the canvas, switch design system and export code that runs.",
  path: "/builder",
  index: false,
});

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
