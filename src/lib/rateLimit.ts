/**
 * Sliding-window rate limiter backed by Upstash Redis.
 * Login and model helpers fail closed when Redis is missing or unavailable.
 * The low-level helper retains an explicit optional no-op for other callers.
 *
 * Required env vars (auto-set by Vercel Marketplace Redis integration):
 *   UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 * Legacy Vercel KV env vars are also accepted:
 *   KV_REST_API_URL, KV_REST_API_TOKEN
 */

import { Redis } from "@upstash/redis";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/* Resolve the client IP for rate-limit keying.
   `x-real-ip` is set by Vercel from the verified TCP source and
   cannot be spoofed by the caller. Fall back to the first entry
   of `x-forwarded-for` (best-effort; can be spoofed) and finally
   to "unknown" so an absent header doesn't blow up the bucket key. */
export function getClientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.length > 0) return realIp.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff && xff.length > 0) return xff.split(",")[0].trim();
  return "unknown";
}

const WINDOW_MS = 60_000; // 60 seconds
const MAX_REQUESTS = 20;
/** Retry-After advertised when the limiter itself is down (fail closed). */
const FAIL_CLOSED_RETRY_SECONDS = 10;

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/**
 * Check rate limit for a given IP address, scoped to a bucket so each
 * route has its own quota and one route's traffic can't lock out another.
 *
 * `bucket` defaults to "default" for back-compat with callers that don't
 * pass one (the old behaviour was a single shared "chat" namespace, which
 * was effectively a global quota across every rate-limited route).
 */
export async function checkRateLimit(
  ip: string,
  bucket: string = "default",
  options: { requireConfigured?: boolean; maxRequests?: number; windowMs?: number } = {},
): Promise<RateLimitResult> {
  const maxRequests = options.maxRequests ?? MAX_REQUESTS;
  const windowMs = options.windowMs ?? WINDOW_MS;
  const redis = getRedisClient();
  if (!redis) {
    return options.requireConfigured
      ? { allowed: false, remaining: 0, resetInSeconds: FAIL_CLOSED_RETRY_SECONDS }
      : { allowed: true, remaining: maxRequests, resetInSeconds: 0 };
  }

  try {
    const key = `rl:${bucket}:${ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Use a sorted set: score = timestamp, member = unique request ID
    const requestId = `${now}-${Math.random().toString(36).slice(2, 8)}`;

    // Pipeline: remove old entries, add new one, count, set expiry
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zadd(key, { score: now, member: requestId });
    pipeline.zcard(key);
    pipeline.expire(key, Math.ceil(windowMs / 1000));

    const results = await pipeline.exec();
    const count = results?.[2];
    if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 1) throw new Error("Invalid rate-limit result");

    if (count > maxRequests) {
      // Over limit - remove the request we just added
      await redis.zrem(key, requestId);
      // Find the oldest entry to calculate reset time
      const oldest = await redis.zrange(key, 0, 0, { withScores: true });
      const oldestScore = Number(oldest?.[1]);
      const resetInSeconds = Number.isFinite(oldestScore) && oldestScore > 0
        ? Math.max(1, Math.ceil((oldestScore + windowMs - now) / 1000))
        : Math.ceil(windowMs / 1000);

      return { allowed: false, remaining: 0, resetInSeconds };
    }

    return {
      allowed: true,
      remaining: maxRequests - count,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  } catch (err) {
    /* Redis is CONFIGURED but unreachable. Fail CLOSED: an outage of the
       limiter must degrade to "AI is briefly unavailable", never to
       "unlimited Anthropic spend for anyone who finds the URL". The
       unconfigured (no env) case above still no-ops so local dev is
       unaffected. Short reset so a transient blip clears quickly. */
    console.error("[rateLimit] Redis unavailable; denying request (fail closed)", err);
    return { allowed: false, remaining: 0, resetInSeconds: FAIL_CLOSED_RETRY_SECONDS };
  }
}

/** Both budgets count failed attempts too. Global cap bounds distributed guessing. */
export async function checkLoginRateLimit(ip: string): Promise<RateLimitResult> {
  const global = await checkRateLimit("all", "staging-login-global", { requireConfigured: true, maxRequests: 200 });
  if (!global.allowed) return global;
  return checkRateLimit(ip, "staging-login", { requireConfigured: true });
}

/** Shared daily request budget across all paid model routes. This limits request
 * count, not dollars; provider-side spend limits remain the billing backstop. */
export async function checkModelRateLimit(ip: string, bucket: string): Promise<RateLimitResult> {
  const perIp = await checkRateLimit(ip, bucket, { requireConfigured: true });
  if (!perIp.allowed) return perIp;
  const configured = Number(process.env.MODEL_DAILY_REQUEST_LIMIT ?? 1000);
  const maxRequests = Number.isSafeInteger(configured) && configured > 0 ? Math.min(configured, 100_000) : 1000;
  return checkRateLimit("all", "model-daily", { requireConfigured: true, maxRequests, windowMs: 86_400_000 });
}
