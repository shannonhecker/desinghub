import { NextRequest, NextResponse } from "next/server";

const COOKIE = "ausos_auth_token";

/**
 * Staging auth middleware — cookie-based, redirects to /login.
 *
 * Protected routes: /builder (and any sub-paths)
 * Public routes:    /, /login, /landing, /ui-kit, /api/*, /_next/*, static assets
 *
 * Only active when STAGING_PASSWORD is set in the environment.
 * When the env var is absent (local dev without .env.local) it is a complete no-op.
 */
export function middleware(request: NextRequest) {
  const expectedPassword = process.env.STAGING_PASSWORD;

  // Skip entirely when not configured
  if (!expectedPassword) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Public routes — always allow through
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/landing" ||
    pathname === "/ui-kit"
  ) {
    return NextResponse.next();
  }

  // Validate the cookie
  const token = request.cookies.get(COOKIE)?.value;
  const expectedToken = btoa(expectedPassword);

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
