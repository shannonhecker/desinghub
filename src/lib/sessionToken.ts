/** Server-only signed sessions shared by the login route, proxy and model APIs.
 * Rotating STAGING_TOKEN_SECRET revokes every session. Legacy password hashes
 * intentionally do not verify: the migration requires a fresh login. */
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "uoaui_auth_token";
export const SESSION_TTL_SECONDS = 60 * 60;
const nowSeconds = () => Math.floor(Date.now() / 1000);
const signature = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest();

export function issueSessionToken(secret: string, now = nowSeconds()): string {
  if (!secret) throw new Error("Session signing is unavailable");
  const payload = Buffer.from(JSON.stringify({ v: 1, iat: now, exp: now + SESSION_TTL_SECONDS, jti: randomUUID() })).toString("base64url");
  return `${payload}.${signature(payload, secret).toString("base64url")}`;
}

export function verifySessionToken(token: string, secret: string, now = nowSeconds()): boolean {
  if (!secret || token.length > 1024) return false;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts.every(part => /^[A-Za-z0-9_-]+$/.test(part))) return false;
  const [payload, supplied] = parts;
  const expected = signature(payload, secret);
  const actual = Buffer.from(supplied, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return claims?.v === 1 && Number.isSafeInteger(claims.iat) && Number.isSafeInteger(claims.exp) &&
      claims.exp - claims.iat === SESSION_TTL_SECONDS && claims.iat <= now + 30 && now < claims.exp &&
      typeof claims.jti === "string" && /^[0-9a-f-]{36}$/.test(claims.jti);
  } catch { return false; }
}
