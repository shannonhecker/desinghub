/**
 * apiAuth - route-handler twin of the staging gate in `middleware.ts`.
 *
 * The middleware matcher deliberately excludes `/api/*` (share links and
 * the health probe must stay public), which left the three AI routes
 * (`/api/chat`, `/api/builder/generate-content`, `/api/builder/generate-table`)
 * fully unauthenticated even when the app itself sat behind the staging
 * password. Anyone who knew the deployment URL could drive the Anthropic
 * key straight through them. This helper closes that gap: every AI route
 * calls `requireBuilderAuth` first and returns its response when set.
 *
 * Semantics mirror the middleware exactly so a user who can load /builder
 * can always call the AI routes, and nobody else can:
 *   - STAGING_PASSWORD unset            -> public mode, no auth (null)
 *   - STAGING_PASSWORD set, secret unset -> misconfigured, fail closed (503)
 *   - ADMIN_IPS match                    -> allow (null)
 *   - cookie == HMAC(secret, password)   -> allow (null)
 *   - otherwise                          -> 401 JSON
 *
 * Env is read per call (not at module scope) so tests and key rotation
 * see the live values.
 */

const COOKIE = "uoaui_auth_token";

/** Same HMAC-SHA256 hex the middleware and /api/staging-login mint. */
async function hashToken(secret: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(password));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string compare so a token guess can't be timed char-by-char. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

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

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    ""
  );
}

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Returns a Response to send when the caller is NOT allowed to use the AI
 * routes, or null when they are. Callers: `const denied = await
 * requireBuilderAuth(req); if (denied) return denied;`
 */
export async function requireBuilderAuth(req: Request): Promise<Response | null> {
  const expectedPassword = process.env.STAGING_PASSWORD;
  if (!expectedPassword) return null; // public mode

  const secret = process.env.STAGING_TOKEN_SECRET;
  if (!secret) {
    return json(
      { error: "Auth misconfigured: STAGING_TOKEN_SECRET is required when STAGING_PASSWORD is set." },
      503,
    );
  }

  const adminIps = (process.env.ADMIN_IPS ?? "").split(",").map((ip) => ip.trim()).filter(Boolean);
  if (adminIps.length > 0 && adminIps.includes(clientIp(req))) return null;

  const token = readCookie(req, COOKIE);
  if (token) {
    const expected = await hashToken(secret, expectedPassword);
    if (timingSafeEqual(token, expected)) return null;
  }

  return json({ error: "Sign in required" }, 401);
}
