/**
 * Upstash Redis client with typed get/set/cacheWrap helpers.
 *
 * Initializes lazily — no Redis client is created unless both
 * UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set.
 *
 * All operations degrade gracefully: if Redis is unavailable or
 * env vars are missing, cacheGet returns null, cacheSet is a no-op,
 * and cacheWrap falls through to the provided fetch function.
 *
 * Phase 6-03: Redis-backed caching for search, RESO, and RAG context.
 */

import { Redis } from "@upstash/redis";

// ─── Lazy singleton ────────────────────────────────────────────────────────────

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

// ─── buildCacheKey ─────────────────────────────────────────────────────────────

/**
 * Produces a deterministic cache key from a prefix and params object.
 * Params are sorted by key before JSON.stringify so object field order
 * does not produce different keys.
 *
 * @param prefix  Namespace prefix (e.g. "search", "reso", "rag")
 * @param params  Key-value params contributing to the cache key
 * @returns       A string like "search:{json-of-sorted-params}"
 */
export function buildCacheKey(
  prefix: string,
  params: Record<string, unknown>
): string {
  const sorted = Object.keys(params)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});
  return `${prefix}:${JSON.stringify(sorted)}`;
}

// ─── cacheGet ─────────────────────────────────────────────────────────────────

/**
 * Retrieves a cached value by key.
 * Returns null on miss, Redis unavailability, or any error.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const value = await redis.get<T>(key);
    return value ?? null;
  } catch {
    // Redis unavailable — degrade gracefully
    return null;
  }
}

// ─── cacheSet ─────────────────────────────────────────────────────────────────

/**
 * Stores a value in the cache with an expiry.
 * Silently no-ops if Redis is unavailable or the write fails.
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // Redis write failed — degrade gracefully
  }
}

// ─── cacheWrap ────────────────────────────────────────────────────────────────

/**
 * Cache-aside helper. On cache hit returns cached value. On miss (or Redis
 * unavailability), calls fn(), caches the result, and returns it.
 *
 * The function never throws due to Redis errors — if Redis is down the
 * application continues to work with direct DB/API calls.
 *
 * @param key         Cache key
 * @param ttlSeconds  Cache TTL in seconds
 * @param fn          Async function to call on cache miss
 */
export async function cacheWrap<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  try {
    const cached = await cacheGet<T>(key);
    if (cached !== null) {
      return cached;
    }
  } catch {
    // Redis error — fall through to fn()
  }

  const result = await fn();

  // Best-effort write — don't await failure
  cacheSet(key, result, ttlSeconds).catch(() => {
    // Intentional no-op: write failure should not interrupt the response
  });

  return result;
}
