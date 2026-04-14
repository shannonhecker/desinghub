import { NextRequest, NextResponse } from "next/server";

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

  // Token = base64(password) — validated by middleware on every request
  const token = btoa(expectedPassword);
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
