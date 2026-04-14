import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = (formData.get("password") as string | null) ?? "";

  const expectedPassword = process.env.STAGING_PASSWORD;

  if (!expectedPassword || password !== expectedPassword) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Token = base64(password) — validated by middleware on every request
  const token = btoa(expectedPassword);
  const response = NextResponse.json({ ok: true });

  response.cookies.set("ausos_auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour — forces re-login on mobile
    path: "/",
  });

  return response;
}
