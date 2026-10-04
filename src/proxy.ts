import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/sessionToken";

/** UI-only staging gate. Model APIs enforce signed sessions separately. */
export async function proxy(request: NextRequest) {
  if (!process.env.STAGING_PASSWORD) return NextResponse.next();
  const { pathname } = request.nextUrl;
  if (pathname === "/" || pathname === "/login" || pathname === "/landing" ||
      pathname.startsWith("/landing-") || pathname === "/ui-kit" || pathname.startsWith("/preview/share/")) {
    return NextResponse.next();
  }
  const secret = process.env.STAGING_TOKEN_SECRET;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (secret && token && verifySessionToken(token, secret)) return NextResponse.next();
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api|_next|$|landing$|login$|ui-kit$|.*\\.[\\w]+$).*)"],
};
