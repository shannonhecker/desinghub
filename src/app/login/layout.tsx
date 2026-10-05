import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Sign in",
  description: "Sign in to open the uoaui.ai builder.",
  path: "/login",
  index: false,
  follow: false,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
