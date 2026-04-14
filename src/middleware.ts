import { NextRequest, NextResponse } from "next/server";

const COOKIE = "ausos_auth_token";

/**
 * Two-tier staging auth middleware:
 *
 * 1. Admin (IP whitelist) — auto-access, no password needed.
 *    Set ADMIN_IPS env var with comma-separated IPs.
 *
 * 2. Visitor — must log in with STAGING_PASSWORD via /login.
 *
 * Protected routes: /builder (and any sub-paths)
 * Public routes:    /, /login, /landing, /ui-kit, /api/*, /_next/*, static assets
 *
 * When STAGING_PASSWORD is absent, auth is disabled entirely.
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

  // --- Tier 1: Admin IP whitelist ---
  const adminIps = (process.env.ADMIN_IPS ?? "").split(",").map((ip) => ip.trim()).filter(Boolean);
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "";

  if (adminIps.length > 0 && adminIps.includes(clientIp)) {
    return NextResponse.next();
  }

  // --- Tier 2: Cookie-based visitor auth ---
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
  matcher: ["/((?!api|_next|.*\\.[\\w]+$).*)"],
};
