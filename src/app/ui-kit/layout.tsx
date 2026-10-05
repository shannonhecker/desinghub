import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

/* A link to one entry (/ui-kit?ds=salt&c=buttons) is the same page, so the
   canonical address is the library itself. */
export const metadata: Metadata = pageMetadata({
  title: "Component library",
  description: "Components, patterns and foundations in Salt DS, Material 3, Fluent 2, Carbon and uoaui DS, side by side, with code and specs.",
  path: "/ui-kit",
});

export default function UIKitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
