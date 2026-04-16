import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

const TOKEN_SECRET = process.env.STAGING_TOKEN_SECRET ?? "";

export function hashToken(password: string): string {
  return createHmac("sha256", TOKEN_SECRET).update(password).digest("hex");
}

// Note: middleware.ts uses the Web Crypto API equivalent (async) which produces
// the same hex output for the same inputs, ensuring cookie compatibility.

export async function POST(request: NextRequest) {
  let password = "";

  // Support both JSON and FormData bodies
  const ct = request.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const body = await request.json();
    password = body.password ?? "";
  } else {
    const formData = await request.formData();
    password = (formData.get("password") as string | null) ?? "";
  }

  const expectedPassword = process.env.STAGING_PASSWORD;

  if (!expectedPassword || password !== expectedPassword) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = hashToken(expectedPassword);
  const response = NextResponse.json({ ok: true });

  response.cookies.set("ausos_auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60,
    path: "/",
  });

  return response;
}
