import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const user = (formData.get("user") as string | null) ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  const expectedUser = process.env.STAGING_USER;
  const expectedPassword = process.env.STAGING_PASSWORD;

  if (
    !expectedUser ||
    !expectedPassword ||
    user !== expectedUser ||
    password !== expectedPassword
  ) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Token = base64(user:password) — same security level as Basic Auth, stored httpOnly
  const token = btoa(`${user}:${password}`);
  const response = NextResponse.json({ ok: true });

  response.cookies.set("staging_auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return response;
}
