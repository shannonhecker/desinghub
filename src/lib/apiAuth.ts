/** Model endpoints always require a signed session, independently of the UI gate. */
import { SESSION_COOKIE, verifySessionToken } from "./sessionToken";

/** Minimal cookie-header parse: returns the named cookie's value or null. */
function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

export async function requireBuilderAuth(req: Request): Promise<Response | null> {
  const secret = process.env.STAGING_TOKEN_SECRET;
  if (!secret) return Response.json({ error: "Sign-in is temporarily unavailable" }, { status: 503 });
  const token = readCookie(req, SESSION_COOKIE);
  if (token && verifySessionToken(token, secret)) return null;
  return Response.json({ error: "Sign in required" }, { status: 401 });
}
