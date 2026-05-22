import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const TOKEN_SECRET = process.env.STAGING_TOKEN_SECRET ?? "";

/* Cap input password length so a malicious 10MB body can't be hashed.
   Real passwords are well under this; the cap is purely a DoS guard. */
const MAX_PASSWORD_LENGTH = 256;

export function hashToken(password: string): string {
  return createHmac("sha256", TOKEN_SECRET).update(password).digest("hex");
}

/* Constant-time string comparison. Avoids leaking length and per-char
   match progress through response timing. timingSafeEqual requires
   equal-length buffers, so length-mismatch short-circuits to false. */
function timingSafeStringEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

// Note: middleware.ts uses the Web Crypto API equivalent (async) which produces
// the same hex output for the same inputs, ensuring cookie compatibility.

export async function POST(request: NextRequest) {
  // Rate limit before any password work — blocks brute-force attempts.
  // Per-route bucket so a busy chat session can't disable login lockout.
  const ip = getClientIp(request);
  const limit = await checkRateLimit(ip, "staging-login");
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.resetInSeconds) },
      },
    );
  }

  // Misconfiguration guard: password gate enabled but no signing secret.
  // Reject explicitly rather than minting a useless cookie.
  const expectedPassword = process.env.STAGING_PASSWORD;
  if (expectedPassword && !TOKEN_SECRET) {
    return NextResponse.json(
      { error: "Auth misconfigured: STAGING_TOKEN_SECRET is required when STAGING_PASSWORD is set." },
      { status: 503 },
    );
  }

  let password = "";

  // Support both JSON and FormData bodies
  const ct = request.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const body = await request.json();
    password = typeof body.password === "string" ? body.password : "";
  } else {
    const formData = await request.formData();
    const raw = formData.get("password");
    password = typeof raw === "string" ? raw : "";
  }

  // Reject oversized payloads before any hashing work.
  if (password.length > MAX_PASSWORD_LENGTH) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (!expectedPassword || !timingSafeStringEqual(password, expectedPassword)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = hashToken(expectedPassword);
  const response = NextResponse.json({ ok: true });

  response.cookies.set("uoaui_auth_token", token, {
    httpOnly: true,
    // Browsers reject `secure: true` cookies on http://localhost, which would
    // break local dev. Everywhere else (preview, staging, production) the
    // cookie must be HTTPS-only to prevent token leakage.
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    maxAge: 60 * 60,
    path: "/",
  });

  return response;
}
