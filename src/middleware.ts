import { NextRequest, NextResponse } from "next/server";

/**
 * Basic Auth middleware — protects all routes when STAGING_USER and
 * STAGING_PASSWORD are set in the environment.  If those variables are
 * absent (e.g. production or a local dev machine without them) the
 * middleware is a no-op, so the site works normally.
 */
export function middleware(request: NextRequest) {
  const expectedUser = process.env.STAGING_USER;
  const expectedPassword = process.env.STAGING_PASSWORD;

  // Skip auth when env vars are not configured
  if (!expectedUser || !expectedPassword) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Basic ")) {
    // atob is available in the Edge runtime (Web API — no Node Buffer needed)
    const base64 = authHeader.slice(6);
    const decoded = atob(base64);

    // Split on the FIRST colon only — passwords may contain colons (RFC 7617)
    const colonIndex = decoded.indexOf(":");
    const incomingUser = decoded.slice(0, colonIndex);
    const incomingPassword = decoded.slice(colonIndex + 1);

    if (incomingUser === expectedUser && incomingPassword === expectedPassword) {
      return NextResponse.next();
    }
  }

  // Missing or invalid credentials — prompt the browser for a username/password
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  /**
   * Apply to every route EXCEPT:
   *  - /api/*          — API routes (if any) handle their own auth
   *  - /_next/static/* — compiled JS/CSS must load after auth
   *  - /_next/image/*  — Next.js image optimisation endpoint
   *  - /favicon.ico    — browsers fetch this before the user can log in
   */
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
