import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Shared mock function references ──────────────────────────────────────────
// These are declared outside vi.mock so they survive module resets and
// can be referenced in assertions. The mock factory captures them in closure.

const mockGet = vi.fn();
const mockSet = vi.fn();

// ─── Mock @upstash/redis ───────────────────────────────────────────────────────
// Redis is used as `new Redis(...)` so the mock must be a constructor function.
// vi.mock is hoisted to the top — factory must use vi.fn() inline.

vi.mock("@upstash/redis", () => {
  function RedisMock() {
    return { get: mockGet, set: mockSet };
  }
  return { Redis: RedisMock };
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("buildCacheKey", () => {
  it("produces a deterministic key from a prefix and params object", async () => {
    const { buildCacheKey } = await import("./redis");
    const key1 = buildCacheKey("search", { minPrice: 100, city: "Austin" });
    const key2 = buildCacheKey("search", { city: "Austin", minPrice: 100 });
    expect(key1).toBe(key2);
  });

  it("includes the prefix in the key", async () => {
    const { buildCacheKey } = await import("./redis");
    const key = buildCacheKey("search", { q: "test" });
    expect(key).toMatch(/^search:/);
  });

  it("produces different keys for different params", async () => {
    const { buildCacheKey } = await import("./redis");
    const key1 = buildCacheKey("search", { q: "Austin" });
    const key2 = buildCacheKey("search", { q: "Dallas" });
    expect(key1).not.toBe(key2);
  });
});

describe("cacheGet", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://fake.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "fake-token");
  });

  it("returns null when Redis get returns null (cache miss)", async () => {
    mockGet.mockResolvedValue(null);
    const { cacheGet } = await import("./redis");
    const result = await cacheGet<string>("test-key");
    expect(result).toBeNull();
  });

  it("returns the cached value on hit", async () => {
    mockGet.mockResolvedValue({ foo: "bar" });
    const { cacheGet } = await import("./redis");
    const result = await cacheGet<{ foo: string }>("test-key");
    expect(result).toEqual({ foo: "bar" });
  });

  it("returns null when Redis throws (graceful fallback)", async () => {
    mockGet.mockRejectedValue(new Error("Redis connection failed"));
    const { cacheGet } = await import("./redis");
    const result = await cacheGet<string>("test-key");
    expect(result).toBeNull();
  });

  it("returns null when env vars are missing (no Redis client)", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { cacheGet } = await import("./redis");
    const result = await cacheGet<string>("test-key");
    expect(result).toBeNull();
  });
});

describe("cacheSet", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://fake.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "fake-token");
  });

  it("calls Redis set with EX option", async () => {
    mockSet.mockResolvedValue("OK");
    const { cacheSet } = await import("./redis");
    await cacheSet("my-key", { data: 42 }, 60);
    expect(mockSet).toHaveBeenCalledWith("my-key", { data: 42 }, { ex: 60 });
  });

  it("does not throw when Redis set fails", async () => {
    mockSet.mockRejectedValue(new Error("Redis write failed"));
    const { cacheSet } = await import("./redis");
    await expect(cacheSet("key", "value", 10)).resolves.toBeUndefined();
  });
});

describe("cacheWrap", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://fake.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "fake-token");
  });

  it("returns cached value on cache hit (does not call fetchFn)", async () => {
    mockGet.mockResolvedValue({ cached: true });
    const { cacheWrap } = await import("./redis");
    const fetchFn = vi.fn().mockResolvedValue({ cached: false });

    const result = await cacheWrap("hit-key", 60, fetchFn);

    expect(result).toEqual({ cached: true });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("calls fetchFn and stores result on cache miss", async () => {
    mockGet.mockResolvedValue(null);
    mockSet.mockResolvedValue("OK");
    const { cacheWrap } = await import("./redis");
    const fetchFn = vi.fn().mockResolvedValue({ fresh: true });

    const result = await cacheWrap("miss-key", 60, fetchFn);

    // Allow async fire-and-forget write to complete
    await new Promise((r) => setTimeout(r, 20));

    expect(result).toEqual({ fresh: true });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith("miss-key", { fresh: true }, { ex: 60 });
  });

  it("falls through to fetchFn when Redis get throws (graceful degradation)", async () => {
    mockGet.mockRejectedValue(new Error("Redis down"));
    const { cacheWrap } = await import("./redis");
    const fetchFn = vi.fn().mockResolvedValue({ fallback: true });

    const result = await cacheWrap("err-key", 60, fetchFn);

    expect(result).toEqual({ fallback: true });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("still returns fetchFn result when cacheSet throws after miss", async () => {
    mockGet.mockResolvedValue(null);
    mockSet.mockRejectedValue(new Error("Redis write failed"));
    const { cacheWrap } = await import("./redis");
    const fetchFn = vi.fn().mockResolvedValue({ value: "ok" });

    const result = await cacheWrap("write-fail-key", 60, fetchFn);

    expect(result).toEqual({ value: "ok" });
  });

  it("calls fetchFn when env vars are missing (no Redis client)", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { cacheWrap } = await import("./redis");
    const fetchFn = vi.fn().mockResolvedValue({ noRedis: true });

    const result = await cacheWrap("no-redis-key", 60, fetchFn);

    expect(result).toEqual({ noRedis: true });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
