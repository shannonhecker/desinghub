/**
 * Sliding-window rate limiter backed by Upstash Redis.
 * Falls back to no-op when env vars are absent (local dev).
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

const WINDOW_MS = 60_000; // 60 seconds
const MAX_REQUESTS = 20;

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/**
 * Check rate limit for a given IP address.
 * Uses Upstash Redis if configured, otherwise always allows (local dev).
 */
export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (!redis) {
    return { allowed: true, remaining: MAX_REQUESTS, resetInSeconds: 0 };
  }

  try {
    const key = `rl:chat:${ip}`;
    const now = Date.now();
    const windowStart = now - WINDOW_MS;

    // Use a sorted set: score = timestamp, member = unique request ID
    const requestId = `${now}-${Math.random().toString(36).slice(2, 8)}`;

    // Pipeline: remove old entries, add new one, count, set expiry
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zadd(key, { score: now, member: requestId });
    pipeline.zcard(key);
    pipeline.expire(key, Math.ceil(WINDOW_MS / 1000));

    const results = await pipeline.exec();
    const count = (results?.[2] as number) ?? 0;

    if (count > MAX_REQUESTS) {
      // Over limit — remove the request we just added
      await redis.zrem(key, requestId);
      // Find the oldest entry to calculate reset time
      const oldest = await redis.zrange(key, 0, 0, { withScores: true });
      const oldestScore = (oldest as unknown as { score: number }[])?.[0]?.score;
      const resetInSeconds = oldestScore
        ? Math.ceil((oldestScore + WINDOW_MS - now) / 1000)
        : Math.ceil(WINDOW_MS / 1000);

      return { allowed: false, remaining: 0, resetInSeconds };
    }

    return {
      allowed: true,
      remaining: MAX_REQUESTS - count,
      resetInSeconds: Math.ceil(WINDOW_MS / 1000),
    };
  } catch {
    // If Redis fails, allow the request (fail open) but log
    console.warn("[rateLimit] Redis unavailable, skipping rate limit");
    return { allowed: true, remaining: MAX_REQUESTS, resetInSeconds: 0 };
  }
}
