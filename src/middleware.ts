import { NextRequest, NextResponse } from "next/server";

const COOKIE = "staging_auth";

/**
 * Staging auth middleware — cookie-based, redirects to a styled /login page.
 * Only active when STAGING_USER + STAGING_PASSWORD are set in the environment.
 * When those vars are absent (production, local dev without .env.local) it is
 * a complete no-op.
 */
export function middleware(request: NextRequest) {
  const expectedUser = process.env.STAGING_USER;
  const expectedPassword = process.env.STAGING_PASSWORD;

  // Skip entirely when not configured
  if (!expectedUser || !expectedPassword) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Always allow the login page through (avoid redirect loop)
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // Validate the cookie
  const token = request.cookies.get(COOKIE)?.value;
  const expectedToken = btoa(`${expectedUser}:${expectedPassword}`);

  if (token === expectedToken) {
    return NextResponse.next();
  }

  // No valid token → redirect to login
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  /**
   * Apply to page routes only — exclude:
   *  - /api/*      — API routes (login handler, etc.)
   *  - /_next/*    — all Next.js internals (static, image, data, webpack-hmr)
   *  - static assets with file extensions (.svg, .png, .ico, etc.)
   */
  matcher: ["/((?!api|_next|.*\\.[\\w]+$).*)"],
};
