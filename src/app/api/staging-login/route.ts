import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { checkLoginRateLimit, getClientIp } from "@/lib/rateLimit";
import { issueSessionToken, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/sessionToken";
import { readBoundedText, RequestBodyError } from "@/lib/requestBody";

export async function POST(request: NextRequest) {
  const limit = await checkLoginRateLimit(getClientIp(request));
  if (!limit.allowed) return NextResponse.json(
    { error: "Too many login attempts. Please try again later." },
    { status: 429, headers: { "Retry-After": String(limit.resetInSeconds) } },
  );
  const expectedPassword = process.env.STAGING_PASSWORD;
  const secret = process.env.STAGING_TOKEN_SECRET;
  if (!expectedPassword || !secret) return NextResponse.json({ error: "Sign-in is temporarily unavailable" }, { status: 503 });

  let password: unknown;
  try {
    const text = await readBoundedText(request, 4096);
    const ct = request.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const body = JSON.parse(text);
      if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid body");
      password = body.password;
    } else {
      const form = await new Response(text, { headers: { "content-type": ct } }).formData();
      password = form.get("password");
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof RequestBodyError ? error.message : "Invalid request body" },
      { status: error instanceof RequestBodyError ? error.status : 400 });
  }
  if (typeof password !== "string" || password.length > 256) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  const actual = Buffer.from(password);
  const expected = Buffer.from(expectedPassword);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, issueSessionToken(secret), {
    httpOnly: true, secure: process.env.NODE_ENV !== "development", sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS, path: "/",
  });
  return response;
}
